import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(import.meta.dirname,'..');
const server=http.createServer((req,res)=>{const uri=new URL(req.url,'http://test').pathname;const file=path.resolve(root,'.'+(uri==='/'?'/index.html':decodeURIComponent(uri)));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.argv[3],headless:true});let cases=0;
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
  await page.goto(origin);await page.waitForFunction(()=>typeof cloudSyncCycle==='function');
  await page.evaluate(()=>{
   window.testCloud={reads:0,writes:0,fail:null,remote:null};state=freshState();state.books=[{id:'synthetic',title:'Local book'}];save();
   cloudUser={id:'synthetic-owner',email:'synthetic@example.invalid'};loadRecovery.active=false;importSyncHold=false;
   window.seedBaseline=async()=>{if(!state.books.length){state.books=[{id:'synthetic',title:'Local book'}];save();}testCloud.remote={state:structuredClone(state),revision:7,updated_at:'2026-10-06T00:00:00Z'};cloudSaveSyncMeta(testCloud.remote,await cloudStateHash(state),{appliedRevision:7});cloudAutoSyncReady=true;cloudNetworkRetryPending=false;cloudNetworkRetryAt=0;cloudSetRuntime('정상','synthetic','ok',{sync:'ON'});};
   const q={select:()=>q,eq:()=>q,limit:async()=>{testCloud.reads++;if(testCloud.fail)throw testCloud.fail;return {data:[structuredClone(testCloud.remote)]}},update:()=>{testCloud.writes++;throw Error('unexpected write')},insert:()=>{testCloud.writes++;throw Error('unexpected insert')}};cloudClient={from:()=>q};cloudBindLifecycle();
   document.querySelector('#loginGate').style.display='none';document.querySelector('#app').classList.remove('login-locked');document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));document.querySelector('#settings').classList.add('active');
  });
  const network=await page.evaluate(async()=>{await seedBaseline();const raw=localStorage.getItem(STORAGE_KEY);testCloud.fail=new TypeError('Failed to fetch');await cloudSyncCycle('manual');return {pending:cloudNetworkRetryPending,sync:cloudRuntime.sync,kept:localStorage.getItem(STORAGE_KEY)===raw,writes:testCloud.writes};});
  assert.deepEqual(network,{pending:true,sync:'OFFLINE',kept:true,writes:0});cases++;
  await page.evaluate(()=>{testCloud.fail=null;window.dispatchEvent(new Event('online'));});await page.waitForFunction(()=>cloudRuntime.sync==='ON');cases++;
  const conflict=await page.evaluate(async()=>{await seedBaseline();state.books[0].title='local edit';save();testCloud.remote.state.books[0].title='remote edit';testCloud.remote.revision=8;const raw=localStorage.getItem(STORAGE_KEY);await cloudSyncCycle('manual');const reads=testCloud.reads;window.dispatchEvent(new Event('online'));return {sync:cloudRuntime.sync,pending:cloudNetworkRetryPending,readsHeld:testCloud.reads===reads,kept:localStorage.getItem(STORAGE_KEY)===raw,writes:testCloud.writes};});
  assert.deepEqual(conflict,{sync:'STOP',pending:false,readsHeld:true,kept:true,writes:0});cases++;
  const before=await page.evaluate(()=>({raw:localStorage.getItem(STORAGE_KEY),meta:localStorage.getItem(CLOUD_META_KEY),sync:cloudRuntime.sync}));
  await page.locator('#cloudConflictAction').click();await page.waitForFunction(()=>document.querySelector('#cloudDifferenceList').children.length>0);
  assert.match(await page.locator('#cloudDifferenceList').innerText(),/독서 · 이 기기 1건 \/ Cloud 1건/);
  assert.match(await page.locator('#cloudDifferenceSummary').innerText(),/모두 변경/);
  assert.deepEqual(await page.evaluate(()=>({raw:localStorage.getItem(STORAGE_KEY),meta:localStorage.getItem(CLOUD_META_KEY),sync:cloudRuntime.sync})),before);cases++;
  const held=await page.evaluate(async()=>{await seedBaseline();importSyncHold=true;cloudAutoSyncReady=false;cloudRuntime.sync='HOLD';const meta=localStorage.getItem(CLOUD_META_KEY);await cloudCompare();return {held:importSyncHold,sync:cloudRuntime.sync,metaKept:localStorage.getItem(CLOUD_META_KEY)===meta,text:document.querySelector('#cloudDifferenceSummary').textContent};});
  assert.equal(held.held,true);assert.equal(held.sync,'HOLD');assert.equal(held.metaKept,true);assert.match(held.text,/복구 확인 중/);cases++;
  const invalid=await page.evaluate(async()=>{importSyncHold=false;await seedBaseline();testCloud.remote.revision=null;const raw=localStorage.getItem(STORAGE_KEY);await cloudSyncCycle('manual');return {sync:cloudRuntime.sync,pending:cloudNetworkRetryPending,kept:localStorage.getItem(STORAGE_KEY)===raw};});
  assert.deepEqual(invalid,{sync:'STOP',pending:false,kept:true});cases++;
  const auth=await page.evaluate(async()=>{await seedBaseline();testCloud.fail={message:'permission denied',code:'42501'};await cloudSyncCycle('manual');return {sync:cloudRuntime.sync,pending:cloudNetworkRetryPending};});assert.deepEqual(auth,{sync:'STOP',pending:false});cases++;
  const empty=await page.evaluate(async()=>{testCloud.fail=null;state=freshState();save();localStorage.removeItem(CLOUD_META_KEY);testCloud.remote={state:freshState(),revision:9};testCloud.remote.state.books=[{id:'restored',title:'Cloud-only book'}];await cloudSyncCycle('manual');return {sync:cloudRuntime.sync,empty:state.books.length===0,shown:!document.querySelector('#cloudChoicePanel').hidden,writes:testCloud.writes};});
  assert.deepEqual(empty,{sync:'STOP',empty:true,shown:true,writes:0});cases++;
  await page.locator('#cloudChoiceOpen').click();await page.locator('#cloudChoiceCloud').click();await page.waitForFunction(()=>!cloudSyncBusy&&cloudRuntime.sync==='ON');
  const restored=await page.evaluate(async()=>({book:state.books[0]?.id,readback:JSON.parse(localStorage.getItem(STORAGE_KEY)).books[0]?.id,backedUp:(await safetyArchiveList()).filter(x=>x.verified).some(x=>x.payload.state.books.length===0),writes:testCloud.writes}));
  assert.deepEqual(restored,{book:'restored',readback:'restored',backedUp:true,writes:0});cases++;
  const denial=await page.evaluate(async()=>{state=freshState();save();localStorage.removeItem(CLOUD_META_KEY);const raw=localStorage.getItem(STORAGE_KEY),original=cloudSaveSafetySnapshot;cloudSaveSafetySnapshot=async()=>false;try{await cloudSyncCycle('manual');await cloudChooseOriginal('cloud');return {sync:cloudRuntime.sync,rawKept:localStorage.getItem(STORAGE_KEY)===raw,empty:state.books.length===0};}finally{cloudSaveSafetySnapshot=original}});
  assert.deepEqual(denial,{sync:'STOP',rawKept:true,empty:true});cases++;
  await page.evaluate(async()=>{await seedBaseline();testCloud.remote.state.books[0].title='remote difference';cloudAutoSyncReady=false;cloudRuntime.sync='STOP';renderCloudPanel();await cloudCompare();});
  const manualBefore=await page.evaluate(()=>localStorage.getItem(STORAGE_KEY));await page.locator('#cloudCreateSafetyBackup').click();await page.waitForFunction(()=>!cloudSafetyBackupBusy);
  assert.equal(await page.evaluate(()=>localStorage.getItem(STORAGE_KEY)),manualBefore);
  assert.equal(await page.evaluate(async()=>(await safetyArchiveList()).filter(x=>x.verified).some(x=>x.payload.reason==='manual_full_backup')),true);cases++;
  await page.evaluate(()=>{state.books[0].title='new local after comparison';save()});
  assert.equal(await page.locator('#cloudDifferencePanel').isVisible(),false);cases++;
  await page.evaluate(async()=>{await cloudCompare();cloudUser=null;renderCloudPanel()});
  assert.equal(await page.locator('#cloudDifferencePanel').isVisible(),false);cases++;
  await page.evaluate(async()=>{cloudUser={id:'synthetic-owner',email:'synthetic@example.invalid'};cloudStopAutoSync('Local과 Cloud 내용이 달라 자동 반영을 멈췄습니다. 차이를 확인해 주세요.');await cloudCompare()});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);cases++;
  fs.mkdirSync(path.join(root,'qa-evidence'),{recursive:true});await page.locator('#cloudBridgeCard').screenshot({path:path.join(root,'qa-evidence',`cloud-stability-${width}.png`)});
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log(`PASS ${cases} Cloud runtime cases at 390/1440: reconnect, conflict STOP, read-only compare, hold, invalid revision, auth rejection, new-device restore, backup denial and manual backup. All external requests blocked.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
