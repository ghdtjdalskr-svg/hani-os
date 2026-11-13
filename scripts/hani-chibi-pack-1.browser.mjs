// Actual raw app + isolated Edge profile; no preload, real account or external network.
// Usage: node scripts/hani-chibi-pack-1.browser.mjs [Edge executable]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/chibi-pack-1');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'hani-ch292-edge-'));
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
  // Fixed clock (2026-11-17 12:00 KST) so the month-end settlement window is real; app's today() is a const.
  await protocol.send('Page.addScriptToEvaluateOnNewDocument',{source:"(()=>{const F=Date.parse('2026-11-17T12:00:00+09:00'),R=Date;class D extends R{constructor(...a){a.length?super(...a):super(F)}static now(){return F}}window.Date=D})();"});
  await protocol.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__chibiWrites=[];for(const name of ['setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.__chibiWrites.push(name);return original.apply(this,args)}}"});
  await protocol.send('Page.navigate',{url:origin});
  let ready=false;for(let i=0;i<150;i++){ready=await protocol.evaluate("typeof renderMonthlyReport==='function'&&typeof state==='object'");if(ready)break;await delay(100);}assert.ok(ready,'app ready');
  const setup=()=>{
    document.getElementById('loginGate').style.display='none';const app=document.getElementById('app');app.classList.remove('login-locked');app.inert=false;
    state.movies=[];state.ledgerMonths=[];state.accounts=[];state.transactions=[];state.investmentBrokerSnapshots=[];state.monthlyReports=[];state.snapshots=[];
    state.ui.ledgerMonth='2026-10';ledgerEditMonth='';Object.assign(ledgerDetailView,{category:'all',subcategory:'all',sort:'amountDesc'});
    state.ui.movieSearch='';state.ui.movieTypeFilter='all';monthlyReportBoard='monthly';monthlyReportMonth='2026-10';monthlyReportGeneration=null;monthlyReportGenerationFailure=null;
  };
  const cases=[
    {name:'ledger-empty',view:'ledger',fn:'renderLedger',id:'ledgerChibiNote'},
    {name:'investment-empty',view:'investment',fn:'renderPortfolio',id:'investmentChibiNote'},
    {name:'asset-empty',view:'asset',fn:'renderAssets',id:'assetChibiNote'},
    {name:'movie-empty',view:'movie',fn:'renderMovies',id:'movieChibiNote'},
    {name:'settlement',view:'home',fn:'renderSettlementCheck',id:'settlementChibiNote'},
    {name:'monthly-empty',view:'monthlyReport',fn:'renderMonthlyReport',id:'monthlyReportChibiNote'},
    {name:'monthly-stored',view:'monthlyReport',fn:'renderMonthlyReport',id:'monthlyReportChibiNote',prepare:"state.monthlyReports=[{month:'2026-10',generatedAt:'2026-11-01T00:00:00Z',view:{kpis:[],domains:[],insightTitle:'합성 보고서',insight:'화면 확인용 합성 자료'}}]"},
    {name:'ledger-filter-miss',view:'ledger',fn:'renderLedger',id:'ledgerChibiNote',hidden:true,prepare:"state.ledgerMonths=['2026-10','2026-11'].map(m=>normalizeLedgerMonth({month:m,items:[{id:'synthetic-'+m,date:m+'-01',content:'합성 0원 항목',detail:'합성 0원 항목',category:'fixed',amount:0}]}));ledgerDetailView.category='variable'"},
    {name:'movie-filter-miss',view:'movie',fn:'renderMovies',id:'movieChibiNote',hidden:true,prepare:"state.movies=[{id:'synthetic',title:'합성 작품',status:'watched',contentType:'영화'}];state.ui.movieSearch='검색 결과 없음'"},
    {name:'monthly-error',view:'monthlyReport',fn:'renderMonthlyReport',id:'monthlyReportChibiNote',hidden:true,prepare:"monthlyReportGenerationFailure={month:'2026-10',reason:'합성 원본 검증 오류 · 다시 확인해 주세요.'}"},
  ];
  fs.mkdirSync(out,{recursive:true});
  for(const width of [1440,390]){
    await protocol.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    for(const row of cases){
      await protocol.evaluate('('+setup.toString()+')()');if(row.prepare)await protocol.evaluate(row.prepare);
      await protocol.evaluate('showView('+JSON.stringify(row.view)+');'+row.fn+'()');await delay(200);
      const result=await protocol.evaluate(`(()=>{
        const id=${JSON.stringify(row.id)},fn=${row.fn},before=JSON.stringify(state),writes=window.__chibiWrites.length,slot=document.getElementById(id);
        for(let i=0;i<5;i++)fn();const note=document.getElementById(id),hidden=${!!row.hidden};
        if(!hidden)note.scrollIntoView({block:'center',behavior:'instant'});else document.getElementById(${JSON.stringify(row.view)}).scrollIntoView({block:'start',behavior:'instant'});
        const rect=note?.getBoundingClientRect(),art=note?.firstElementChild,style=art&&getComputedStyle(art);
        return {name:${JSON.stringify(row.name)},width:innerWidth,count:document.querySelectorAll('#'+id).length,hidden:!note||getComputedStyle(note).display==='none',sameNode:slot===note,stateUnchanged:before===JSON.stringify(state),writes:window.__chibiWrites.length-writes,artWidth:style?.width,sheet:style?.backgroundImage,withinViewport:hidden||rect.left>=0&&rect.right<=innerWidth+1};
      })()`);
      assert.equal(result.hidden,!!row.hidden,JSON.stringify(result));assert.equal(result.count,1);assert.ok(result.sameNode);assert.ok(result.stateUnchanged);assert.equal(result.writes,0);assert.ok(result.withinViewport);
      if(!row.hidden){assert.equal(result.artWidth,width===390?'56px':'72px');assert.match(result.sheet,/chibi-sheet-v1\.webp/);}
      const image=await protocol.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,row.name+'-'+width+'.png'),Buffer.from(image.data,'base64'));results.push(result);
    }
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'PASS',screenshots:results.length,results}));
}catch(error){console.error(JSON.stringify({status:'BLOCKED_OR_FAILED',message:error.message,code:error.code,temp,screenshots:results.length}));process.exitCode=1;}
finally{protocol?.socket.close();processEdge?.kill();server.close();}
