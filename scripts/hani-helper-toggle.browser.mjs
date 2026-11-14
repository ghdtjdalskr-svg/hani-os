// Seoyun only: node scripts/hani-helper-toggle.browser.mjs <playwright/index.mjs> <msedge.exe>
// --check-setup checks raw serving/setup in Node; it never launches a browser.
// Use no inverse preload. Disposable contexts, synthetic empty data, external requests blocked.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/helper-toggle/browser');
const key='hani_helper_hidden_v1',position='{"x":0.2,"y":0.3,"v":1}';
const owners=['hani-ui-v02992.js','hani-style-08.css'];
const hashes=Object.fromEntries(owners.map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
const report={result:'NOT_RUN',base:'7a91982de08a54452f6b9057f906d651f63a65ca',sourceHashes:hashes,cases:[],failures:[]};
function serve(req,res){
 try{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\//,'')||'index.html',file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(500).end('fixture server error')}
}
function instrument(){
 window.__helperToggleWrites=[];
 for(const method of ['setItem','removeItem','clear']){
  const original=Storage.prototype[method];
  Storage.prototype[method]=function(...args){
   window.__helperToggleWrites.push({area:this===localStorage?'local':'session',method,key:args[0]??null,...(args[0]==='hani_helper_hidden_v1'?{value:args[1]}:{})});
   return original.apply(this,args);
  };
 }
}
function unlock(){
 unlockLoginGate();showView('home');
 // Public update after synthetic login setup, matching established helper browser tests.
 HaniHelperBot.update();
}
function readState(){
 const bot=document.getElementById('haniHelperBot'),toggle=document.querySelector('#haniHelperSettings [data-helper-visibility]');
 return {hidden:bot.hidden,reason:bot.dataset.helperReason,preference:localStorage.getItem('hani_helper_hidden_v1'),position:localStorage.getItem('hani_helper_pos_v1'),
  checked:toggle.getAttribute('aria-checked'),left:bot.style.left,top:bot.style.top,
  life:localStorage.getItem('hani_os_life_v23'),writes:window.__helperToggleWrites};
}
const server=http.createServer(serve);let browser;
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
try{
 if(process.argv.includes('--check-setup')){
  for(const fn of [instrument,unlock,readState])new vm.Script('('+fn.toString()+')');
  for(const file of ['index.html',...owners]){
   const response=await fetch(origin+'/'+file);assert.equal(response.status,200);
   assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync(path.join(root,file)),'raw serving '+file);
  }
  fs.writeFileSync(path.join(root,'artifacts/helper-toggle/browser-setup.json'),JSON.stringify({result:'SETUP_PASS',sourceHashes:hashes,rawServing:'byte-identical',setupSyntax:'PASS',edge:'NOT_RUN',png:'NOT_RUN'},null,2)+'\n');
  console.log('PASS raw serving + browser setup syntax (Edge/PNG NOT RUN)');
 }else{
  assert.ok(process.argv[2]&&process.argv[3],'provide Playwright module and Edge executable');
  const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
  fs.mkdirSync(out,{recursive:true});
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  for(const width of [390,1440]){
   const row={width,height:900,steps:[],actionWrites:[],externalRequests:[],errors:[],screenshots:[]};report.cases.push(row);
   const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Seoul',
    storageState:{cookies:[],origins:[{origin,localStorage:[{name:'hani_helper_pos_v1',value:position}]}]}});
   try{
    await context.route('**/*',route=>{
     const url=route.request().url();
     if(new URL(url).origin===origin)return route.continue();
     row.externalRequests.push({method:route.request().method(),origin:new URL(url).origin});
     return route.fulfill({status:200,body:''});
    });
    await context.addInitScript(instrument);
    const page=await context.newPage();page.on('pageerror',e=>row.errors.push(e.message));
    await page.clock.setFixedTime(new Date('2026-11-14T12:30:00+09:00'));
    const capture=async name=>{const file=`${width}-${name}.png`;await page.screenshot({path:path.join(out,file)});row.screenshots.push(file)};
    const start=async reload=>{
     if(reload)await page.reload();else await page.goto(origin);
     await page.waitForFunction(()=>!!window.HaniHelperBot&&!!window.HaniOrganizationRoster);
     await page.evaluate(unlock);
     await page.waitForFunction(()=>!document.getElementById('haniLaunchGreeting'));
     // The login gate releases asynchronously; re-run the public update until the helper settles.
     await page.waitForFunction(()=>{if(!document.getElementById('haniHelperSettings'))return false;HaniHelperBot.update();const r=document.getElementById('haniHelperBot').dataset.helperReason;return r==='shown'||r==='user-hidden'},null,{polling:250,timeout:15000});
    };
    const state=async name=>{const value=await page.evaluate(readState);row.steps.push({name,...value,lifePresent:value.life!==null,life:undefined});return value};
    const action=async(name,run)=>{
     await page.evaluate(()=>{window.__helperToggleWrites=[]});await run();
     // Flush the existing placement frame; no app polling/listener is added.
     await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     const value=await state(name);row.actionWrites.push({name,writes:value.writes});
     return value;
    };
    await start(false);const initial=await state('default-on');assert.equal(initial.hidden,false);assert.equal(initial.preference,null);
    const helper=page.locator('#haniHelperBot');await helper.locator('.hani-helper-face').click();await capture('default-on');
    const hidden=await action('hide',()=>helper.locator('[data-helper-hide]').click());
    assert.equal(hidden.hidden,true);assert.equal(hidden.preference,'1');assert.equal(hidden.checked,'false');await capture('hidden');
    await start(true);const persisted=await state('hidden-after-reload');assert.equal(persisted.hidden,true);assert.equal(persisted.preference,'1');await capture('hidden-after-reload');
    await page.evaluate(()=>showView('settings'));
    await page.locator('#group-display').evaluate(e=>{e.open=true});
    const toggle=page.locator('#haniHelperSettings [data-helper-visibility]');
    await toggle.scrollIntoViewIfNeeded();const box=await toggle.boundingBox();assert.ok(box&&box.height>=44&&box.width>=44,'44px touch target');
    assert.equal(await toggle.getAttribute('role'),'switch');
    const enabled=await action('settings-on',()=>toggle.click());
    assert.equal(enabled.hidden,false);assert.equal(enabled.preference,'0');assert.equal(enabled.checked,'true');
    assert.equal(enabled.left,initial.left);assert.equal(enabled.top,initial.top);await capture('settings-on');
    await start(true);const final=await state('on-after-reload');assert.equal(final.hidden,false);assert.equal(final.preference,'0');await capture('on-after-reload');
    for(const step of [initial,hidden,persisted,enabled,final]){assert.equal(step.position,position,'position preserved');assert.equal(step.life,initial.life,'protected data unchanged');}
    for(const [i,{writes}]of row.actionWrites.entries())assert.deepEqual(writes,[{area:'local',method:'setItem',key,value:i===0?'1':'0'}],'action writes only the approved preference');
    row.writeKeys=[...new Set(row.steps.flatMap(s=>s.writes.map(w=>w.key)))];
    assert.deepEqual(row.errors,[]);row.result='PASS';
   }catch(e){row.result='FAIL';row.error=e.stack;report.failures.push({width,error:e.message});}
   finally{await context.close();}
  }
  report.result=report.failures.length?'FAIL':'PASS';
  fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({result:report.result,cases:report.cases.map(c=>({width:c.width,result:c.result,writeKeys:c.writeKeys,screenshots:c.screenshots})),failures:report.failures}));
  if(report.failures.length)process.exitCode=1;
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
