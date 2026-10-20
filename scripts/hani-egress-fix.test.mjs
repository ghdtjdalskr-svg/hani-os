// Runs actual read/cycle/gate/list functions with synthetic adapters and a controllable clock.
// Each scenario checks the protected raw bytes and rejects protected/Cloud writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const source=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const polish=fs.readFileSync(new URL('../hani-stability-polish-v02972.js',import.meta.url),'utf8');
const normalized=source.replace(/\r\n/g,'\n');
function extract(name,text=normalized){
  const start=text.search(new RegExp('^(?:async )?function '+name+'\\(','m'));assert.ok(start>=0,name);
  const rest=text.slice(start),next=rest.slice(1).search(/\n(?:async )?function |\n(?:let|const) [A-Za-z]/);
  // Source functions all close on their own line or are single-line declarations.
  const single=rest.indexOf('\n'),line=rest.slice(0,single);
  if(line.endsWith('}'))return line;
  const end=rest.indexOf('\n}');assert.ok(end>=0,name+' end');return rest.slice(0,end+2);
}
const names=['cloudOutageError','cloudShowOutage','cloudScheduleOutageProbe','cloudNoteReadFailure','cloudReadFetch','cloudProbeOutage','cloudFetchMeta','cloudReadRow','cloudStopAutoSync','cloudStartPolling','cloudRetryAfterNetwork','cloudIsNetworkFailure','cloudIsLifecycleCheck','cloudShouldFetchFullState','cloudCanUseVerifiedRemote','cloudRememberVerifiedRemote','cloudRevisionNumber','cloudSyncDecision','cloudSyncSelfTest','cloudSyncCycle','cloudBindLifecycle','loginGateEnterApp','investmentNewsArchiveContext','investmentNewsArchiveCursor','investmentNewsArchiveLoad','investmentNewsArchiveDetail','investmentNewsArchivePosts'];
let cases=0;const counts=[];
function fixture(){
  let now=100000;let timerId=0;const timers=new Map(),events=new Map(),requests=[],writes=[];
  const raw=' {"books":[{"id":"b","title":"로컬 원본"}],"unknown":{"keep":true}}\n';
  const storage=new Map([['hani_os_life_v23',raw]]),baseline={books:[{id:'b',title:'로컬 원본'}],unknown:{keep:true}};
  let meta={syncEngine:5,hashSchema:4,lastSyncedHash:JSON.stringify(baseline),appliedRevision:7};
  const FakeDate=class extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}};
  const ctx=vm.createContext({console:{warn(){},error(){}},structuredClone,Promise,Map,Set,JSON,Number,String,Date:FakeDate,URL,Response,
    navigator:{onLine:true},document:{visibilityState:'visible',addEventListener:(name,fn)=>events.set(name,fn)},window:{addEventListener:(name,fn)=>events.set(name,fn)},
    setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId},clearTimeout:id=>timers.delete(id),setInterval:()=>++timerId,clearInterval(){},
    localStorage:{getItem:key=>{if(ctx.readError)throw Error('local read denied');return storage.get(key)??null},setItem:(key,value)=>{writes.push(key);throw Error('unexpected protected write')},removeItem:()=>{throw Error('unexpected remove')}},
    STORAGE_KEY:'hani_os_life_v23',CLOUD_SYNC_ENGINE:5,CLOUD_HASH_SCHEMA:4,INVESTMENT_NEWS_ARCHIVE_LIMIT:50,
    state:structuredClone(baseline),cloudUser:{id:'owner'},cloudClient:null,cloudRuntime:{sync:'ON'},cloudOutage:{active:false,attempt:0,until:0,timer:null,probe:null,probing:false,probeFailed:false},cloudLifecycleCheck:{at:0,owner:'',client:null},
    cloudAutoSyncReady:true,cloudApplyingRemote:false,cloudSyncBusy:false,cloudSyncPending:false,cloudSyncTimer:null,cloudPollTimer:null,cloudVerifiedRemote:null,cloudLifecycleBound:false,cloudNetworkRetryPending:false,cloudNetworkRetryAt:0,cloudComparisonEpoch:0,cloudChoicePreview:null,cloudRecoveryMode:false,loadRecovery:{active:false},importSyncHold:false,lastLoadError:'read failure',cloudSessionFullReads:0,cloudSessionMetaChecks:0,
    loginGateAttempt:1,loginGateUnlocked:false,investmentNewsArchiveRuntime:{posts:[],readSet:new Set()},
    cloudMeta:()=>meta,cloudSyncPolicy:()=> 'cloud-first',cloudComparableState:structuredClone,cloudStateHash:async value=>JSON.stringify(value),cloudSame:(a,b)=>JSON.stringify(a)===JSON.stringify(b),cloudHasMeaningfulLocalData:value=>!!value?.books?.length,
    cloudSummaryText:()=> 'synthetic',cloudSetRuntime:(status,message,tone,extra)=>{Object.assign(ctx.cloudRuntime,{status,message,tone},extra)},renderCloudPanel(){},renderCloudTransferUsage(){},renderCloudChoice(){},toast(){},
    assertCloudSourceReady:()=>{if(ctx.loadRecovery.active||ctx.importSyncHold||ctx.crossTabHold)throw Error('protected hold')},readImportSyncHold:()=>!!ctx.crossTabHold,
    cloudSaveSyncMeta:(row,hash)=>{meta={...meta,appliedRevision:row.revision,lastSyncedHash:hash};return {verifiedAt:'now'}},
    cloudPrepareChoice(){throw Error('unexpected apply')},cloudApplyRemoteRow(){throw Error('unexpected protected apply')},cloudPushLocalRow(){writes.push('Cloud write');throw Error('unexpected Cloud write')},
    loginGateStatus(){},loginGateShowCloudTools(){},markLoginGateSession(){},unlockLoginGate:()=>{ctx.loginGateUnlocked=true},renderAll(){},
    agentArray:x=>Array.isArray(x)?x:[],agentObj:x=>x&&typeof x==='object'?x:{},n:x=>Number(x)||0,renderInvestmentNews(){},fetch:async()=>{throw Error('unconfigured transport')},
    status:200,remote:{state:structuredClone(baseline),revision:7,updated_at:'2026-10-20T00:00:00Z'},news:[],reads:[]});
  const client={from(table){let columns='',filters=[],limit=0,orders=[],retry=true;const q={
    select(value){columns=value;return q},eq(...args){filters.push(['eq',...args]);return q},in(...args){filters.push(['in',...args]);return q},or(value){filters.push(['or',value]);return q},order(...args){orders.push(args);return q},limit(value){limit=value;return q},retry(value){retry=value;return q},
    update(){writes.push('Cloud update');throw Error('write forbidden')},upsert(){writes.push('Cloud upsert');throw Error('write forbidden')},
    async then(resolve,reject){try{
      const request={table,columns,filters,limit,orders,retry};requests.push(request);
      if(ctx.onRequest)await ctx.onRequest(request);
      if(ctx.network)throw new TypeError('Failed to fetch');
      const error=ctx.status>=400?{message:'HTTP '+ctx.status}:null;
      const data=table==='hani_state'?[structuredClone(columns.startsWith('state,')?ctx.remote:{revision:ctx.remote.revision,updated_at:ctx.remote.updated_at,device:'other'})]:table==='hani_newsroom_reads'?ctx.reads:ctx.news;
      resolve({status:ctx.status,error,data:structuredClone(data)});
    }catch(e){if(reject)reject(e);else throw e}}
  };return q}};ctx.cloudClient=client;
  for(const name of names)vm.runInContext(extract(name),ctx);
  return {ctx,requests,writes,events,timers,raw,storage,meta:()=>meta,tick:ms=>now+=ms,check(){assert.equal(storage.get('hani_os_life_v23'),raw);assert.deepEqual(writes,[])}};
}
async function scenario(name,fn){const f=fixture();await fn(f);f.check();cases++;console.log('PASS '+name)}
await scenario('focus/pageshow/visible/resume burst: metadata 1, full 0',async f=>{
  f.ctx.cloudBindLifecycle();const a=f.events.get('focus')();f.events.get('pageshow')();f.events.get('visibilitychange')();await f.ctx.cloudSyncCycle('resume-focus');await a;await new Promise(setImmediate);
  assert.equal(f.requests.length,1);assert.equal(f.ctx.cloudSessionFullReads,0);assert.equal(f.ctx.cloudSessionMetaChecks,1);counts.push({scenario:'unchanged lifecycle burst',meta:1,full:0});
});
await scenario('revision changed: full 1; concurrent returns coalesce',async f=>{
  f.ctx.remote.revision=8;await Promise.all(['focus','pageshow','visible','resume-visible'].map(reason=>f.ctx.cloudSyncCycle(reason)));
  assert.equal(f.ctx.cloudSessionMetaChecks,1);assert.equal(f.ctx.cloudSessionFullReads,1);assert.equal(f.ctx.cloudAutoSyncReady,true);counts.push({scenario:'changed revision (equal content)',meta:1,full:1});
});
await scenario('verified bfcache gate + focus rejoin one lifecycle read',async f=>{
  f.ctx.cloudLifecycleBound=true;
  await Promise.all([f.ctx.cloudSyncCycle('focus'),f.ctx.loginGateEnterApp('session-resume')]);assert.equal(f.requests.length,1);assert.equal(f.ctx.cloudSessionFullReads,0);assert.equal(f.ctx.loginGateUnlocked,true);
});
await scenario('unsynced local follows existing decision, no policy override',async f=>{
  f.ctx.state.books[0].title='pending edit';let pushes=0;f.ctx.cloudPushLocalRow=async()=>{pushes++};await f.ctx.cloudSyncCycle('resume-focus');assert.equal(pushes,1);assert.equal(f.ctx.cloudSessionFullReads,1);
});
for(const status of [402,429,500,503])await scenario(status+' shared pause, 10 focus + poll/resume/queued/view suppressed',async f=>{
  f.ctx.status=status;await f.ctx.cloudSyncCycle('focus');assert.equal(f.requests.length,1);assert.equal(f.ctx.cloudOutage.until,160000);assert.equal(f.ctx.cloudRuntime.sync,'PAUSED');
  await Promise.all([...Array(10).fill('focus'),'poll','resume-pageshow','queued','local-save','view-newsroom'].map(reason=>f.ctx.cloudSyncCycle(reason)));
  assert.equal(f.requests.length,1);assert.equal(f.ctx.cloudSessionFullReads,0);f.tick(60000);f.ctx.status=200;await Promise.all([f.ctx.cloudProbeOutage(),f.ctx.cloudProbeOutage()]);assert.equal(f.requests.length,2);assert.equal(f.ctx.cloudAutoSyncReady,true);assert.equal(f.ctx.cloudOutage.active,false);
});
await scenario('backoff 1/2/5/15/60 min; failed probes stay paused',async f=>{
  f.ctx.status=402;await f.ctx.cloudSyncCycle('focus');let now=100000;
  for(const delay of [2,5,15,60,60]){const until=f.ctx.cloudOutage.until;f.tick(until-now);now=until;await f.ctx.cloudProbeOutage();assert.equal(f.ctx.cloudOutage.until-now,delay*60000);assert.equal(f.ctx.cloudRuntime.sync,'PAUSED')}
});
await scenario('manual retry is one metadata probe; network offline stays held',async f=>{
  f.ctx.status=402;await f.ctx.cloudSyncCycle('focus');f.ctx.navigator.onLine=false;await f.ctx.cloudProbeOutage(true);assert.equal(f.requests.length,1);f.ctx.navigator.onLine=true;f.ctx.status=200;
  await f.ctx.cloudSyncCycle('manual');assert.equal(f.requests.length,3);assert.equal(f.ctx.cloudOutage.active,false);assert.equal(f.ctx.cloudSessionFullReads,1);
});
await scenario('transport honours Retry-After seconds/date; writes pass unchanged',async f=>{
  let wire=0;f.ctx.fetch=async()=>{wire++;return new Response('{}',{status:429,headers:{'Retry-After':'600'}})};
  await f.ctx.cloudReadFetch('https://synthetic.invalid/rest/v1/hani_state?select=revision,updated_at,device',{method:'GET'});assert.equal(f.ctx.cloudOutage.until,700000);
  for(let i=0;i<10;i++)await f.ctx.cloudReadFetch('https://synthetic.invalid/rest/v1/hani_state?select=state',{method:'GET'});assert.equal(wire,1);
  f.ctx.cloudNoteReadFailure(null,503,new Date(100000+900000).toUTCString());assert.equal(f.ctx.cloudOutage.until,1000000);
  const input='https://synthetic.invalid/rest/v1/hani_state',init={method:'PATCH',body:'unchanged'};let got;const response=new Response('{}',{status:200});f.ctx.fetch=async(...args)=>{got=args;return response};assert.equal(await f.ctx.cloudReadFetch(input,init),response);assert.equal(got[0],input);assert.equal(got[1],init);
});
await scenario('REST outage response is observed without changing write request/response',async f=>{
  const input='https://synthetic.invalid/rest/v1/hani_state',init={method:'PATCH',body:'synthetic-only'},response=new Response('{}',{status:402});let got;
  f.ctx.fetch=async(...args)=>{got=args;return response};assert.equal(await f.ctx.cloudReadFetch(input,init),response);assert.equal(got[0],input);assert.equal(got[1],init);assert.equal(f.ctx.cloudOutage.active,true);
  const timer=f.timers.get(f.ctx.cloudOutage.timer);f.tick(60000);timer.fn();await new Promise(setImmediate);assert.equal(f.requests.length,1);assert.equal(f.ctx.cloudOutage.active,false);
});
for(const failure of ['402','network'])await scenario('gate opens verified local during '+failure,async f=>{
  if(failure==='402')f.ctx.status=402;else f.ctx.network=true;
  assert.equal(await f.ctx.loginGateEnterApp('login-gate'),true);assert.equal(f.ctx.loginGateUnlocked,true);assert.ok(['PAUSED','OFFLINE'].includes(f.ctx.cloudRuntime.sync));
});
for(const hold of ['account-mismatch','recovery','local-recovery','import','cross-tab-import','read-error','choice','empty'])await scenario('gate stays closed: '+hold,async f=>{
  f.ctx.status=402;
  if(hold==='account-mismatch')f.ctx.onRequest=()=>{f.ctx.cloudUser={id:'other'}};
  if(hold==='recovery')f.ctx.cloudRecoveryMode=true;
  if(hold==='local-recovery')f.ctx.loadRecovery.active=true;
  if(hold==='import')f.ctx.importSyncHold=true;
  if(hold==='cross-tab-import')f.ctx.crossTabHold=true;
  if(hold==='read-error')f.ctx.readError=true;
  if(hold==='choice')f.ctx.cloudChoicePreview={};
  if(hold==='empty')f.ctx.state={books:[]};
  let result=false;try{result=await f.ctx.loginGateEnterApp('login-gate')}catch(e){assert.ok(['recovery','local-recovery'].includes(hold))}
  assert.equal(!!result,false);assert.equal(f.ctx.loginGateUnlocked,false);
});
const post=(id,date='2026-10-20T00:00:00Z')=>({id,post_type:'INTEREST',title:'요약',summary:'짧은 요약',published_at:date,updated_at:date});
await scenario('Newsroom limited summaries + id-bound detail coalescing + incremental date/id',async f=>{
  f.ctx.news=[post('a')];assert.equal(await f.ctx.investmentNewsArchiveLoad(),true);
  const list=f.requests[0];assert.equal(list.limit,50);for(const col of ['payload','comments','body','why_it_matters','hani_view'])assert.ok(!list.columns.split(',').includes(col),col);assert.equal(list.retry,false);
  assert.ok(f.requests[1].filters.some(x=>x[0]==='in'&&x[1]==='post_id'));
  f.ctx.news=[{id:'a',why_it_matters:'본문',hani_view:'의견',comments:[{comment:'댓글'}],payload:{event_type:'NEWS'},updated_at:'2026-10-20T00:00:00Z'}];
  const details=await Promise.all([f.ctx.investmentNewsArchiveDetail('a'),f.ctx.investmentNewsArchiveDetail('a')]);assert.equal(details[0].why_it_matters,'본문');assert.equal(f.requests.length,3);assert.ok(f.requests[2].filters.some(x=>x[1]==='id'&&x[2]==='a'));
  f.ctx.news=[post('b','2026-10-21T00:00:00Z')];await f.ctx.investmentNewsArchiveLoad(true);assert.match(f.requests[3].filters.find(x=>x[0]==='or')[1],/updated_at\.gt\..*id\.gt\.a/);assert.equal(f.ctx.investmentNewsArchiveRuntime.posts.length,2);
});
await scenario('Newsroom older page uses published date/id; failed refresh keeps list',async f=>{
  f.ctx.news=Array.from({length:50},(_,i)=>post('id'+String(i).padStart(2,'0'))).reverse();await f.ctx.investmentNewsArchiveLoad();f.ctx.news=[post('older','2026-10-19T00:00:00Z')];await f.ctx.investmentNewsArchiveLoad(true,{older:true});assert.match(f.requests[2].filters.find(x=>x[0]==='or')[1],/published_at\.lt\..*id\.lt\./);assert.equal(f.ctx.investmentNewsArchiveRuntime.posts.length,51);
  f.ctx.status=402;await f.ctx.investmentNewsArchiveLoad(true);assert.equal(f.ctx.investmentNewsArchiveRuntime.loaded,true);assert.equal(f.ctx.investmentNewsArchiveRuntime.posts.length,51);const n=f.requests.length;await f.ctx.investmentNewsArchiveLoad(true);await f.ctx.investmentNewsArchiveDetail('older');assert.equal(f.requests.length,n);
});
await scenario('stale owner/detail response cannot populate replacement account',async f=>{
  f.ctx.news=[post('a')];await f.ctx.investmentNewsArchiveLoad();f.ctx.onRequest=request=>{if(request.columns.includes('comments')){f.ctx.cloudUser={id:'other'};f.ctx.investmentNewsArchiveContext()}};
  assert.equal(await f.ctx.investmentNewsArchiveDetail('a'),null);assert.equal(f.ctx.investmentNewsArchiveRuntime.details.size,0);
});
assert.doesNotMatch(polish,/refreshAfterResume|bindResumeChecks|cloudSyncCycle\('resume-/,'legacy listener layer deleted');
// Byte-level comparison of protected write/policy/auth/recovery functions against the worktree baseline.
if(process.env.HANI_GIT){
  const baseline=execFileSync(process.env.HANI_GIT,['show','origin/main:hani-main.js'],{encoding:'utf8',maxBuffer:8*1024*1024});
  const exact=(text,name)=>{
    const start=text.search(new RegExp('^(?:async )?function '+name+'\\(','m')),rest=text.slice(start),lineEnd=rest.indexOf('\n');assert.ok(start>=0,name);
    if(rest.slice(0,lineEnd).trimEnd().endsWith('}'))return rest.slice(0,lineEnd+1);
    const end=/^\}\r?$/m.exec(rest);assert.ok(end,name+' exact end');return rest.slice(0,end.index+end[0].length+1);
  };
  for(const name of ['cloudApplyRemoteRow','cloudPushLocalRow','cloudSyncDecision','writeProtectedState','removeProtectedState','save','assertCloudSourceReady','loginGateResumeSession','loginGateSubmit','cloudBindAuthEvents','initLoginGate','investmentNewsArchiveMarkRead','syncSeasonCollection'])assert.equal(exact(source,name),exact(baseline,name),name+' byte-identical');
}
console.log(JSON.stringify({cases,counts,protectedBytes:'identical in every scenario; no production data used'}));

if(process.argv[2]){
  const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
  const root=path.resolve(import.meta.dirname,'..'),evidence=path.join(root,'artifacts/egress-221');
  const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://test').pathname,file=path.resolve(root,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({executablePath:process.argv[3],headless:true});const results=[];
  async function pageFixture(width,{before=false}={}){
    console.log('BROWSER start '+width+(before?' baseline':' patched'));
    const context=await browser.newContext({viewport:{width,height:1000}}),wire=[],page=await context.newPage(),errors=[];
    page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(20000);
    let replyStatus=200,network=false,revision=7,remoteState=null;
    const news=Array.from({length:50},(_,i)=>({...post('post'+String(i).padStart(2,'0')),title:'합성 뉴스 '+i,entity_name:'테스트 종목',ticker:'TEST',market:'US',sentiment:'NEUTRAL',importance:3,source_grade:'MEDIA',source_url:'https://example.invalid/source',source_verified:true,summary:'목록 요약 '+i,why_it_matters:'상세 본문 '+i,hani_view:'상세 의견 '+i,comments:[{agent_name:'하니',comment:'상세 댓글 '+i}],payload:{event_type:'NEWS',scope:'COMPANY_COMMON'}})).reverse();
    await context.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.origin===origin){
        if(before&&['/hani-main.js','/hani-stability-polish-v02972.js'].includes(url.pathname)){const body=execFileSync(process.env.HANI_GIT,['show','origin/main:'+url.pathname.slice(1)],{encoding:'utf8',maxBuffer:8*1024*1024});return route.fulfill({status:200,contentType:'text/javascript',body})}
        return route.continue();
      }
      if(url.hostname!=='synthetic.invalid')return route.abort();
      const table=url.pathname.split('/').at(-1),columns=url.searchParams.get('select')||'';
      wire.push({table,columns,limit:Number(url.searchParams.get('limit')),method:route.request().method()});
      assert.equal(route.request().method(),'GET','no Cloud writes in measured browser scenarios');
      if(network)return route.abort('failed');
      let rows=[];
      if(table==='hani_state')rows=[{revision,updated_at:'2026-10-20T00:00:00Z',device:'test',...(columns.includes('state')?{state:remoteState}: {})}];
      if(table==='hani_newsroom_posts')rows=url.searchParams.has('id')?news.filter(x=>'eq.'+x.id===url.searchParams.get('id')):news;
      // Real column projection at the transport mock boundary; list cannot receive hidden detail content.
      const data=rows.map(row=>Object.fromEntries(columns.split(',').filter(key=>!key.includes(':')).map(key=>[key,row[key]])));
      return route.fulfill({status:replyStatus,headers:{'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},body:JSON.stringify(replyStatus>=400?{message:'synthetic outage'}:data)});
    });
    page.on('pageerror',e=>errors.push(e.message));page.on('dialog',()=>{throw Error('unexpected dialog')});
    await page.goto(origin);await page.waitForFunction(()=>typeof cloudSyncCycle==='function');console.log('BROWSER loaded '+width);
    await page.evaluate(async()=>{
      state=freshState();state.books=[{id:'synthetic',title:'안전한 합성 원본'}];writeProtectedState(JSON.stringify(state));
      loadRecovery.active=false;importSyncHold=false;cloudUser={id:'synthetic-owner',email:'synthetic@example.invalid'};
      // Synthetic PostgREST adapter uses actual browser fetch and the production read transport.
      cloudClient={from(table){const params=new URLSearchParams();const query={
        select(columns){params.set('select',columns);return query},eq(k,v){params.set(k,'eq.'+v);return query},in(k,v){params.set(k,'in.('+v.join(',')+')');return query},or(v){params.set('or','('+v+')');return query},order(k,v){params.append('order',k+'.'+(v.ascending?'asc':'desc'));return query},limit(v){params.set('limit',v);return query},retry(){return query},
        upsert(){throw Error('unexpected upsert')},update(){throw Error('unexpected update')},
        then(resolve,reject){return (async()=>{try{const response=await (typeof cloudReadFetch==='function'?cloudReadFetch:fetch)('https://synthetic.invalid/rest/v1/'+table+'?'+params,{method:'GET'}),data=await response.json();return response.ok?{data,status:response.status}:{error:data,status:response.status}}catch(error){return {error:{message:error.message},status:0}}})().then(resolve,reject)}
      };return query}};
      const row={state:structuredClone(state),revision:7,updated_at:'2026-10-20T00:00:00Z'};cloudSaveSyncMeta(row,await cloudStateHash(state),{appliedRevision:7});cloudRememberVerifiedRemote(row,cloudComparableState(state),await cloudStateHash(state));
      cloudAutoSyncReady=true;cloudRuntime={...cloudRuntime,sync:'ON'};cloudBindLifecycle();
    });
    remoteState=await page.evaluate(()=>state);let raw=await page.evaluate(()=>localStorage.getItem(STORAGE_KEY));
    return {context,page,wire,errors,fail:status=>replyStatus=status,offline:value=>network=value,revision:value=>revision=value,async snapshot(){raw=await page.evaluate(()=>localStorage.getItem(STORAGE_KEY))},async kept(){assert.equal(await page.evaluate(()=>localStorage.getItem(STORAGE_KEY)),raw);assert.deepEqual(errors,[])}};
  }
  try{
    if(process.env.HANI_GIT){const f=await pageFixture(1440,{before:true});await f.page.waitForTimeout(2600);f.wire.length=0;await f.page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('pageshow'));document.dispatchEvent(new Event('visibilitychange'))});await f.page.waitForTimeout(500);await f.kept();const full=f.wire.filter(x=>x.table==='hani_state'&&x.columns.includes('state')).length;assert.equal(full,1,'baseline legacy resume downloads full state');results.push({name:'before unchanged return burst',meta:f.wire.filter(x=>x.table==='hani_state'&&!x.columns.includes('state')).length,full});await f.context.close()}
    for(const width of [390,1440]){
      let f=await pageFixture(width);
      await f.page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('pageshow'));document.dispatchEvent(new Event('visibilitychange'))});await f.page.waitForTimeout(500);await f.kept();
      assert.equal(f.wire.filter(x=>x.table==='hani_state').length,1);assert.equal(f.wire[0].columns,'revision,updated_at,device');results.push({name:'after unchanged return burst '+width,meta:1,full:0});await f.context.close();
      f=await pageFixture(width);await f.page.evaluate(()=>{markLoginGateSession();cloudClient.auth={getSession:async()=>({data:{session:{user:cloudUser}}}),getUser:async()=>({data:{user:cloudUser}})};window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'))});await f.page.waitForTimeout(500);await f.kept();assert.equal(f.wire.length,1);assert.equal(f.wire[0].columns,'revision,updated_at,device');results.push({name:'verified bfcache pageshow/focus '+width,meta:1,full:0});await f.context.close();
      f=await pageFixture(width);f.revision(8);await f.page.evaluate(()=>Promise.all(['focus','pageshow','visible'].map(reason=>cloudSyncCycle(reason))));await f.kept();assert.equal(f.wire.filter(x=>x.columns.includes('state')).length,1);results.push({name:'changed revision '+width,meta:1,full:1});await f.context.close();
      f=await pageFixture(width);f.fail(402);assert.equal(await f.page.evaluate(()=>loginGateEnterApp('login-gate')),true);const first=f.wire.length;
      await f.page.evaluate(()=>Promise.all([...Array(10).fill('focus'),'resume-focus','poll','queued','view-newsroom'].map(reason=>cloudSyncCycle(reason))));assert.equal(f.wire.length,first);await f.kept();
      assert.match(await f.page.locator('#cloudMessage').textContent(),/Cloud 일시 중단/);
      await f.page.evaluate(()=>showView('settings'));await f.page.locator('#cloudStatePill').screenshot({path:path.join(evidence,`outage-status-${width}.png`)});results.push({name:'402 gate + repeated automatic checks '+width,requests:first,extra:0});await f.context.close();
      f=await pageFixture(width);f.offline(true);assert.equal(await f.page.evaluate(()=>loginGateEnterApp('login-gate')),true);await f.kept();assert.equal(await f.page.evaluate(()=>cloudRuntime.sync),'OFFLINE');await f.context.close();
      f=await pageFixture(width);await f.page.evaluate(()=>{state.ui.investmentNewsMode='interest';loginGateUnlocked=true;document.querySelector('#loginGate').classList.add('is-hidden');document.querySelector('#app').classList.remove('login-locked');document.querySelector('#app').inert=false;document.body.classList.remove('login-scroll-locked');showView('newsroom')});await f.page.evaluate(()=>investmentNewsArchiveLoad(true));await f.page.waitForFunction(()=>investmentNewsArchiveRuntime.loaded);await f.page.evaluate(()=>{investmentNewsArchiveRuntime.readSet.add('post49');renderInvestmentNews()});await f.page.locator('.legacy-stock-news-archive > summary').click();await f.snapshot();const list=f.wire.find(x=>x.table==='hani_newsroom_posts');assert.ok(list.limit<=50);assert.ok(!list.columns.split(',').some(x=>['payload','body','comments'].includes(x)));
      await f.page.locator('[data-news-row-toggle="0"]').click().catch(async error=>{await f.page.screenshot({path:path.join(evidence,`news-failure-${width}.png`)});console.log('NEWS DOM '+JSON.stringify(await f.page.evaluate(()=>({view:document.body.dataset.view,active:[...document.querySelectorAll('.view.active')].map(x=>x.id),mode:state.ui.investmentNewsMode,ancestors:(()=>{let e=document.querySelector('[data-news-row-toggle="0"]'),a=[];while(e&&a.length<9){a.push({tag:e.tagName,id:e.id,class:e.className,hidden:e.hidden,display:getComputedStyle(e).display});e=e.parentElement}return a})()}))));throw error});await f.page.waitForFunction(()=>investmentNewsArchiveRuntime.details?.has('post49'));await f.page.waitForTimeout(50);assert.equal(f.wire.filter(x=>x.table==='hani_newsroom_posts'&&x.columns.includes('comments')).length,1);assert.equal(await f.page.locator('[data-news-row-toggle="0"]').getAttribute('aria-expanded'),'true');assert.match(await f.page.locator('[data-news-row-detail="0"]').innerText(),/상세 본문 49/);await f.kept();
      await f.page.locator('#investmentNewsFeed').screenshot({path:path.join(evidence,`news-detail-${width}.png`)});results.push({name:'news list + opened detail '+width,rows:50,detailRequests:1});await f.context.close();
    }
    fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify({results,external:'all non-synthetic external requests blocked'},null,2));console.log('PASS full-browser egress '+JSON.stringify(results));
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
}
