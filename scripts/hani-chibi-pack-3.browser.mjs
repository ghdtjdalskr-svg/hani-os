// Actual raw app + isolated Edge profile; no preload, real account or external network.
// Usage: node scripts/hani-chibi-pack-3.browser.mjs [Edge executable]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/chibi-pack-3');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'hani-chibi3-edge-'));
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
  await protocol.send('Emulation.setTimezoneOverride',{timezoneId:'Asia/Seoul'});
  await protocol.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  protocol.events.set('Fetch.requestPaused',({requestId,request})=>{protocol.send(new URL(request.url).origin===origin?'Fetch.continueRequest':'Fetch.failRequest',new URL(request.url).origin===origin?{requestId}:{requestId,errorReason:'BlockedByClient'}).catch(()=>{});});
  const errors=[];protocol.events.set('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description||e.exceptionDetails.text));
  // Clock and write audit are confined to an isolated profile, before app bootstrap.
  await protocol.send('Page.addScriptToEvaluateOnNewDocument',{source:"(()=>{window.__chibiClock=Date.parse('2026-11-21T12:00:00+09:00');const R=Date;class D extends R{constructor(...a){a.length?super(...a):super(window.__chibiClock)}static now(){return window.__chibiClock}}window.Date=D})();"});
  await protocol.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__chibiWrites=[];for(const name of ['setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.__chibiWrites.push(name);return original.apply(this,args)}}"});
  await protocol.send('Page.navigate',{url:origin});
  let ready=false;for(let i=0;i<150;i++){ready=await protocol.evaluate("typeof renderHomeBirthday==='function'&&!!window.HaniOrganizationRoster&&typeof state==='object'");if(ready)break;await delay(100);}assert.ok(ready,'app and canonical roster ready');
  const setup=()=>{
    document.getElementById('loginGate').style.display='none';
    const app=document.getElementById('app');app.classList.remove('login-locked');app.inert=false;
    state.diaries=[];state.movies=[];state.monthlyReports=[];
    state.ui.diarySearch='';state.ui.diarySort='newest';state.ui.movieSearch='';state.ui.movieTypeFilter='all';state.ui.movieMinRating=0;
    monthlyReportMonth='2026-10';monthlyReportBoard='monthly';monthlyReportGeneration=null;monthlyReportGenerationFailure=null;
  };
  const cases=[
    {name:'home-birthday-1121',view:'home',fn:'renderHome',id:'homeBirthdayChibiNote',text:'🎂 오늘은 다온 님 생일이에요! · 하니 · 다 같이 축하해요.',clock:'2026-11-21T12:00:00+09:00'},
    {name:'home-nonbirthday-1122',view:'home',fn:'renderHome',id:'homeBirthdayChibiNote',visible:false,clock:'2026-11-22T12:00:00+09:00'},
    {name:'diary-empty',view:'diary',fn:'renderDiary',id:'diaryChibiNote',text:'윤슬 · 오늘 한 줄부터 남겨 볼까요?'},
    {name:'movie-empty',view:'movie',fn:'renderMovies',id:'movieChibiNote',text:'하루 · 첫 작품 기록을 기다리고 있어요!'},
    {name:'monthly-empty',view:'monthlyReport',fn:'renderMonthlyReport',id:'monthlyReportChibiNote',text:'지은 · 이번 달 보고가 생기면 여기 모아 둘게요.'},
  ];
  fs.mkdirSync(out,{recursive:true});
  for(const width of [1440,390]){
    await protocol.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    for(const row of cases){
      await protocol.evaluate('('+setup.toString()+')()');
      await protocol.evaluate('window.__chibiClock=Date.parse('+JSON.stringify(row.clock||'2026-11-21T12:00:00+09:00')+')');
      await protocol.evaluate('showView('+JSON.stringify(row.view)+');'+row.fn+'()');
      await delay(200);
      const result=await protocol.evaluate('('+function(id,fnExpression){
        const fn=(0,eval)(fnExpression),slot=document.getElementById(id),before=JSON.stringify(state),writes=window.__chibiWrites.length;
        for(let i=0;i<5;i++)fn();
        const note=document.getElementById(id),visible=!note.hidden&&getComputedStyle(note).display!=='none';
        (visible?note:document.getElementById('homeActions')).scrollIntoView({block:'center',behavior:'instant'});
        const rect=note.getBoundingClientRect(),style=getComputedStyle(note.firstElementChild);
        return {width:innerWidth,count:document.querySelectorAll('#'+id).length,sameNode:slot===note,visible,stateUnchanged:before===JSON.stringify(state),writes:window.__chibiWrites.length-writes,text:note.lastElementChild.textContent,artWidth:style.width,artHeight:style.height,sheet:style.backgroundImage,withinViewport:!visible||(rect.left>=0&&rect.right<=innerWidth+1),faces:[...note.querySelectorAll('.hani-birthday-person')].filter(x=>!x.hidden).map(x=>({id:x.dataset.person,image:getComputedStyle(x).backgroundImage})),titleSpans:id!=='monthlyReportChibiNote'||document.querySelectorAll('#monthlyReportPending .monthly-report-empty-title>span').length===2};
      }.toString()+')('+JSON.stringify(row.id)+','+JSON.stringify(row.fn)+')');
      result.name=row.name;
      assert.equal(result.count,1,JSON.stringify(result));assert.ok(result.sameNode);assert.equal(result.visible,row.visible!==false);assert.ok(result.stateUnchanged);assert.equal(result.writes,0);assert.ok(result.withinViewport);assert.ok(result.titleSpans);
      if(row.visible!==false){assert.equal(result.text,row.text);assert.equal(result.artWidth,width===390?'56px':'72px');assert.equal(result.artHeight,result.artWidth);assert.match(result.sheet,/chibi-sheet-v3\.webp/);}
      if(row.name==='home-birthday-1121'){assert.equal(result.faces.length,1);assert.equal(result.faces[0].id,'daon');assert.match(result.faces[0].image,/daon-v2-256.webp/);}
      const screenshot=await protocol.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      fs.writeFileSync(path.join(out,row.name+'-'+width+'.png'),Buffer.from(screenshot.data,'base64'));results.push(result);
    }
    // Empty search results with existing records must not produce first-entry decoration.
    for(const [view,fn,id,prepare]of [
      ['diary','renderDiary','diaryChibiNote',"state.diaries=[{id:'synthetic-diary',title:'합성 일기',content:'기존 기록',date:'2026-11-20'}];state.ui.diarySearch='없는 검색'"],
      ['movie','renderMovies','movieChibiNote',"state.movies=[{id:'synthetic-movie',title:'합성 작품',status:'wish',contentType:'영화'}];state.ui.movieSearch='없는 검색'"]
    ]){
      await protocol.evaluate(prepare+';'+fn+'()');assert.equal(await protocol.evaluate('document.getElementById('+JSON.stringify(id)+').hidden'),true);
    }
  }
  // Actual CSS behavior for print/reduced-motion, without a new application hook.
  await protocol.send('Emulation.setEmulatedMedia',{media:'print'});
  assert.equal(await protocol.evaluate("getComputedStyle(document.getElementById('monthlyReportChibiNote')).display"),'none');
  await protocol.send('Emulation.setEmulatedMedia',{media:'',features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await protocol.evaluate("getComputedStyle(document.querySelector('#monthlyReportChibiNote .hani-chibi-note-art')).animationName"),'none');
  assert.deepEqual(errors,[]);
  const report={status:'PASS',screenshots:results.length,results};fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}catch(error){console.error(JSON.stringify({status:'BLOCKED_OR_FAILED',message:error.message,code:error.code,temp,screenshots:results.length}));process.exitCode=1;}
finally{protocol?.socket.close();processEdge?.kill();server.close();}
