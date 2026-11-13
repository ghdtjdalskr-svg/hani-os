import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/save-guard');
const server=http.createServer((req,res)=>{const uri=decodeURIComponent(new URL(req.url,'http://test').pathname);const file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'})[ext]||'application/octet-stream');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
let browser;const results=[];
try{
 browser=/^https?:/.test(process.argv[3])?await chromium.connectOverCDP(process.argv[3]):await chromium.launch({executablePath:process.argv[3],headless:true});
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:900}});let external=0;const errors=[];
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():(external++,r.abort()));
  const a=await context.newPage();await a.goto(origin);await a.waitForFunction(()=>typeof save==='function');
  await a.evaluate(()=>{state.books=[{id:'baseline',title:'합성 기록'}];if(!save().ok)throw Error('seed save failed')});
  const b=await context.newPage();await b.goto(origin);await b.waitForFunction(()=>typeof save==='function');
  for(const p of [a,b]){p.on('pageerror',e=>errors.push(e.message));await p.evaluate(()=>{document.querySelector('#loginGate').style.display='none';document.querySelector('#app').classList.remove('login-locked');document.querySelector('#app').inert=false;document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));document.querySelector('#settings').classList.add('active')});}
  await b.evaluate(()=>{state.books.push({id:'draft-b',title:'B에서 입력 중'});const input=document.querySelector('#settings input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=hidden])');if(!input)throw Error('settings input missing');input.value='177'});
  const draft=await b.evaluate(()=>({state:JSON.stringify(state),inputs:[...document.querySelectorAll('#settings input')].map(x=>x.value)}));
  assert.equal(await a.evaluate(()=>{state.books.push({id:'saved-a',title:'A에서 저장'});return save().ok}),true);
  const raw=await a.evaluate(()=>localStorage.getItem(STORAGE_KEY));await b.waitForSelector('#storageTabConflict');
  const blocked=await b.evaluate(()=>({ok:save().ok,state:JSON.stringify(state),raw:localStorage.getItem(STORAGE_KEY),inputs:[...document.querySelectorAll('#settings input')].map(x=>x.value)}));
  assert.equal(blocked.ok,false);assert.equal(blocked.raw,raw);assert.equal(blocked.state,draft.state);assert.deepEqual(blocked.inputs,draft.inputs);
  await assert.equal(await b.locator('#storageTabConflict button').innerText(),'새로고침');
  assert.equal(await b.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await b.screenshot({path:path.join(out,`conflict-${width}.png`)});
  await b.locator('#storageTabConflict button').click();await b.waitForFunction(()=>typeof save==='function');
  assert.equal(await b.evaluate(()=>state.books.some(x=>x.id==='saved-a')),true);assert.equal(await b.locator('#storageTabConflict').count(),0);
  // Use a fresh isolated context below for Cloud; no real auth or network write.
  results.push({width,blocked:true,rawPreserved:true,draftPreserved:true,reload:true,externalBlocked:external,errors});assert.deepEqual(errors,[]);await context.close();
 }
 const context=await browser.newContext();await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 const p=await context.newPage();await p.goto(origin);await p.waitForFunction(()=>typeof cloudApplyRemoteRow==='function');
 const cloud=await p.evaluate(async()=>{
  state.books=[{id:'local',title:'로컬 합성'}];save();const raw=localStorage.getItem(STORAGE_KEY),memory=JSON.stringify(state);
  let rejected=false;try{await cloudApplyRemoteRow({state:{books:[null]},revision:2})}catch(e){rejected=e.message==='Cloud 기록 형식을 확인하지 못해 이 기기 기록을 유지했어요'}
  const invalid={rejected,rawPreserved:localStorage.getItem(STORAGE_KEY)===raw,memoryPreserved:JSON.stringify(state)===memory,message:cloudRuntime.message,sync:cloudRuntime.sync};
  const remote=structuredClone(state);remote.books=[{id:'cloud',title:'정상 Cloud 합성'}];
  const applied=await cloudApplyRemoteRow({state:remote,revision:2,updated_at:'2026-11-08T00:00:00Z'},await cloudStateHash(cloudComparableState(remote)));
  return {invalid,applied,readback:JSON.parse(localStorage.getItem(STORAGE_KEY)).books[0].id,backup:(await safetyArchiveList()).some(x=>x.verified&&x.payload.state.books[0]?.id==='local')};
 });
 assert.equal(cloud.invalid.rejected,true);assert.equal(cloud.invalid.rawPreserved,true);assert.equal(cloud.invalid.memoryPreserved,true);assert.equal(cloud.invalid.sync,'STOP');assert.equal(cloud.applied,true);assert.equal(cloud.readback,'cloud');assert.equal(cloud.backup,true);
 results.push({cloud});await context.close();fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));console.log('PASS Edge 1280/390: two tabs, draft/raw preservation, reload, malformed/valid Cloud, verified backup');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
