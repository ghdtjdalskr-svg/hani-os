// Actual raw app + isolated Edge profile; no preload, real account or external network.
// Usage: node scripts/hani-chibi-pack-2.browser.mjs [Edge executable]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/chibi-pack-2');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'hani-chibi2-edge-'));
const executable=process.argv[2]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
let processEdge,protocol;const results=[];
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
class CDP{
  constructor(socket){this.socket=socket;this.id=0;this.pending=new Map();this.events=new Map();socket.addEventListener('message',async e=>{
    const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}
    else this.events.get(m.method)?.(m.params);
  });}
  send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.socket.send(JSON.stringify({id,method,params}));});}
  async evaluate(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
}
try{
  const stderr=fs.openSync(path.join(temp,'edge-stderr.log'),'w');let launchError;
  processEdge=spawn(executable,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+temp,'about:blank'],{windowsHide:true,stdio:['ignore','ignore',stderr]});
  processEdge.on('error',error=>{launchError=error});
  let endpoint;
  for(let i=0;i<80;i++){
    if(launchError)throw launchError;
    const active=path.join(temp,'DevToolsActivePort');if(fs.existsSync(active)){endpoint='http://127.0.0.1:'+fs.readFileSync(active,'utf8').split('\n')[0];break;}
    if(processEdge.exitCode!==null)throw Error('Edge exited '+processEdge.exitCode+'; '+fs.readFileSync(path.join(temp,'edge-stderr.log'),'utf8').slice(-1200));
    await delay(100);
  }
  if(!endpoint)throw Error('Edge DevTools unavailable; see '+path.join(temp,'edge-stderr.log'));
  const target=await (await fetch(endpoint+'/json/new?about:blank',{method:'PUT'})).json();
  const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});protocol=new CDP(socket);
  await protocol.send('Page.enable');await protocol.send('Runtime.enable');
  await protocol.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  protocol.events.set('Fetch.requestPaused',({requestId,request})=>{protocol.send(new URL(request.url).origin===origin?'Fetch.continueRequest':'Fetch.failRequest',new URL(request.url).origin===origin?{requestId}:{requestId,errorReason:'BlockedByClient'}).catch(()=>{});});
  const errors=[];protocol.events.set('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description||e.exceptionDetails.text));
  // Fixed synthetic clock; fixtures stay in page memory and never use a real account.
  await protocol.send('Page.addScriptToEvaluateOnNewDocument',{source:"(()=>{const F=Date.parse('2026-11-17T12:00:00+09:00'),R=Date;class D extends R{constructor(...a){a.length?super(...a):super(F)}static now(){return F}}window.Date=D})();"});
  await protocol.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__chibiWrites=[];for(const name of ['setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.__chibiWrites.push(name);return original.apply(this,args)}}"});
  await protocol.send('Page.navigate',{url:origin});
  let ready=false;for(let i=0;i<150;i++){ready=await protocol.evaluate("typeof renderReading==='function'&&!!window.HANI_STUDY_V02984_TEST&&typeof state==='object'");if(ready)break;await delay(100);}assert.ok(ready,'app ready');
  const setup=()=>{
    document.getElementById('loginGate').style.display='none';
    const app=document.getElementById('app');app.classList.remove('login-locked');app.inert=false;
    state.books=[];state.travelTrips=[];state.travelWishlist=[];state.travelPlaces=[];
    state.ui.readingSearch='';state.ui.readingMinRating=0;state.ui.travelTab='trips';
    state.learningWrongAnswers=[];
    const api=window.HANI_STUDY_V02984_TEST,date=today();
    state.learningProjects=[api.normalizeProject({id:'synthetic-project',name:'화면 확인용 합성 학습',category:'other',scheduleType:'manual',quizSize:5,status:'active',createdAt:date+'T00:00:00Z'})];
    state.learningQuizzes=[api.normalizeQuiz({id:'synthetic-quiz',projectId:'synthetic-project',title:'합성 결과 · 저장하지 않는 화면 확인',scheduledDate:date,status:'completed',score:100,correctCount:5,total:5,answers:[0,0,0,0,0],questions:Array.from({length:5},(_,i)=>({id:'synthetic-q-'+i,prompt:'화면 확인용 문제 '+(i+1),choices:['정답 선택지','다른 선택지','세 번째 선택지','네 번째 선택지'],answerIndex:0,explanation:'기존 정답·해설을 그대로 표시합니다.'})),createdAt:date+'T00:00:00Z',completedAt:date+'T01:00:00Z'})];
  };
  const cases=[
    {name:'reading-empty',view:'reading',fn:'renderReading',id:'readingChibiNote',text:'윤슬 · 첫 책 한 권부터 적어 볼까요?'},
    {name:'quiz-correct',view:'study',fn:"()=>window.HANI_STUDY_V02984_TEST.openTaskProject('synthetic-project')",id:'quizResultChibiNote',text:'히나 · 잘했어요!'},
    {name:'quiz-wrong',view:'study',fn:"()=>window.HANI_STUDY_V02984_TEST.openTaskProject('synthetic-project')",id:'quizResultChibiNote',text:'히나 · 틀린 문제, 다시 같이 봐요.',prepare:"Object.assign(state.learningQuizzes[0],{answers:[1,0,0,0,0],correctCount:4,score:80})"},
    {name:'travel-empty',view:'travel',fn:'renderTravel',id:'travelChibiNote',text:'수연 · 여행 기록을 천천히 남겨 봐요.'},
    {name:'travel-wish-empty',view:'travel',fn:'renderTravel',id:'travelChibiNote',text:'수연 · 가고 싶은 곳부터 적어 봐요!',prepare:"state.ui.travelTab='wish'"},
    {name:'travel-schedule-empty',view:'travel',fn:"()=>renderTravelDetailLists(state.travelTrips[0])",id:'travelScheduleChibiNote',text:'수연 · 일정은 천천히 적어 봐요.',prepare:"state.travelTrips=[normalizeTravelTrip({id:'synthetic-trip',name:'날짜 미정 합성 여행',destination:'미정 장소',startDate:'',endDate:'',itinerary:[],reviews:[]})]",after:"openTravelTripDetail('synthetic-trip')"},
  ];
  fs.mkdirSync(out,{recursive:true});
  for(const width of [1440,390]){
    await protocol.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    for(const row of cases){
      await protocol.evaluate('('+setup.toString()+')()');
      if(row.prepare)await protocol.evaluate(row.prepare);
      await protocol.evaluate('showView('+JSON.stringify(row.view)+');('+row.fn+')()');
      if(row.after)await protocol.evaluate(row.after);
      await delay(200);
      const result=await protocol.evaluate('('+function(id,fnExpression,expected){
        const fn=(0,eval)('('+fnExpression+')'),slot=document.getElementById(id),before=JSON.stringify(state),writes=window.__chibiWrites.length;
        for(let i=0;i<5;i++)fn();
        const note=document.getElementById(id);note.scrollIntoView({block:'center',behavior:'instant'});
        const rect=note.getBoundingClientRect(),art=note.firstElementChild,style=getComputedStyle(art);
        return {width:innerWidth,count:document.querySelectorAll('#'+id).length,sameNode:slot===note,visible:getComputedStyle(note).display!=='none'&&rect.width>0&&rect.height>0,stateUnchanged:before===JSON.stringify(state),writes:window.__chibiWrites.length-writes,text:note.lastElementChild.textContent,expected,artWidth:style.width,artHeight:style.height,sheet:style.backgroundImage,position:style.backgroundPosition,withinViewport:rect.left>=0&&rect.right<=innerWidth+1,detailsPresent:id!=='quizResultChibiNote'||!!document.querySelector('#studyQuizDetail .study-explanation')};
      }.toString()+')('+JSON.stringify(row.id)+','+JSON.stringify(row.fn)+','+JSON.stringify(row.text)+')');
      result.name=row.name;
      assert.equal(result.count,1,JSON.stringify(result));assert.ok(result.sameNode);assert.ok(result.visible);assert.ok(result.stateUnchanged);assert.equal(result.writes,0);assert.equal(result.text,row.text);assert.ok(result.withinViewport);assert.ok(result.detailsPresent);
      assert.equal(result.artWidth,width===390?'56px':'72px');assert.equal(result.artHeight,result.artWidth);assert.match(result.sheet,/chibi-sheet-v2\.webp/);
      const screenshot=await protocol.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      fs.writeFileSync(path.join(out,row.name+'-'+width+'.png'),Buffer.from(screenshot.data,'base64'));results.push(result);
      await protocol.evaluate("document.querySelectorAll('.modal.open').forEach(el=>el.classList.remove('open'))");
    }
  }
  // Actual CSS behavior for print/reduced-motion, without a new application hook.
  await protocol.send('Emulation.setEmulatedMedia',{media:'print'});
  assert.equal(await protocol.evaluate("getComputedStyle(document.getElementById('travelScheduleChibiNote')).display"),'none');
  await protocol.send('Emulation.setEmulatedMedia',{media:'',features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await protocol.evaluate("getComputedStyle(document.querySelector('#travelScheduleChibiNote .hani-chibi-note-art')).animationName"),'none');
  assert.deepEqual(errors,[]);
  const report={status:'PASS',screenshots:results.length,results};fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}catch(error){console.error(JSON.stringify({status:'BLOCKED_OR_FAILED',message:error.message,code:error.code,temp,screenshots:results.length}));process.exitCode=1;}
finally{protocol?.socket.close();processEdge?.kill();server.close();}
