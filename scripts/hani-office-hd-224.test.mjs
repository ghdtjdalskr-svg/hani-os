// Seed 233 activates two canon desks ahead of the unchanged 232 scheduler catalog.
// node scripts/hani-office-hd-224.test.mjs [--browser [playwright/index.mjs] [browser.exe]]
// Browser run captures real 222/current floors at native physical pixels; no mocks of layout.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {assets} from './hani-office-v2-fixture.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {withoutDeskMascots} from './hani-desk-mascots-preservation.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/office-hd-224');
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const hd=json('assets/sprites-v3/manifest-v3.json'),sources=json('docs/design/sprites-v3-meta/_sources.json');
const source=read('hani-office-live.js'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const sharp=createRequire(import.meta.url)(process.env.HANI_SHARP_MODULE||path.join(runtime,'sharp'));
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
fs.mkdirSync(out,{recursive:true});

test('separately seeded HD manifest resolves every asset; pre-mascot runtime closure retains the 128-file contract',async()=>{
 const seed=await resolveRuntimeClosure({entrypoints:['assets/sprites-v3/manifest-v3.json'],exists:f=>fs.existsSync(path.join(root,f)),read:f=>fs.readFileSync(path.join(root,f))});
 assert.deepEqual(seed.missing,[]);
 for(const entry of hd.entries){
  assert.ok(seed.files.includes('assets/sprites-v3/'+entry.file),entry.id+' seeded atlas');
  const original=sources.people.find(p=>p.id===entry.id).currentEntry||assets.sprites.entries.find(e=>e.id===entry.id);
  assert.equal(entry.identityReference,original.identityReference?.startsWith('assets/')?path.posix.relative('assets/sprites-v3',original.identityReference):original.identityReference,entry.id+' relative provenance');
 }
 // Exclude only the two exactly-once approved tags; mascot packaging requires separate verification.
 const runtime=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:f=>f==='index.html'?Buffer.from(withoutDeskMascots(read(f))):fs.readFileSync(path.join(root,f))});
 assert.deepEqual(runtime.missing,[]);
 const contract=json('dev-center/one-pass-gate-contract.json');assert.equal(contract.limits.max_files,128);assert.ok(runtime.files.length<=contract.limits.max_files);
 console.log(JSON.stringify({runtimeFiles:runtime.files.length,seedFiles:seed.files.length,seedBytes:[...seed.contents.values()].reduce((n,b)=>n+b.length,0)}));
});

test('25 original artworks / 100 physical 3x frames retain exact crop, footprint and pivot ratios',async()=>{
 assert.equal(hd.scale,3);assert.equal(hd.entries.length,25);let bytes=0;
 assert.equal(new Set(hd.entries.map(e=>e.id)).size,25);
 for(const entry of hd.entries){
  const person=sources.people.find(p=>p.id===entry.id),old=person.currentEntry||assets.sprites.entries.find(e=>e.id===entry.id);
  const encoded=fs.readFileSync(path.join(root,'assets/sprites-v3',entry.file));bytes+=encoded.length;
  assert.equal(hash(encoded),entry.sha256);assert.equal(encoded.length,entry.sizeBytes);
  assert.equal(entry.sourceSha256,old.sourceSha256);assert.equal(entry.scale,3);
  assert.deepEqual(entry.cell,old.cell.map(x=>x*3));assert.deepEqual(entry.atlas,old.atlas.map(x=>x*3));
  const meta=await sharp(encoded).metadata();assert.deepEqual([meta.width,meta.height],entry.atlas);assert.ok(meta.hasAlpha);
  const poses=[];
  for(let i=0;i<4;i++){
   const frame=entry.frames[i],prev=old.frames[i];assert.equal(frame.name,prev.name);
   for(const key of ['rect','pivot','contentRect'])assert.deepEqual(frame[key],prev[key].map(x=>x*3),entry.id+' '+key);
   assert.deepEqual(frame.sourceRect,prev.sourceRect);
   const [left,top,width,height]=frame.rect;
   const raw=await sharp(encoded).extract({left,top,width,height}).ensureAlpha().raw().toBuffer();
   for(let x=0;x<width;x++)for(const y of [0,height-1])assert.equal(raw[(y*width+x)*4+3],0);
   for(let y=0;y<height;y++)for(const x of [0,width-1])assert.equal(raw[(y*width+x)*4+3],0);
   poses.push(hash(raw));
  }
  assert.equal(new Set(poses).size,4);
 }
 assert.equal(bytes,hd.spriteBytes);assert.ok(bytes<1475000);
});

test('real canonical loader prefers v3; per-atlas failure falls back once to v2 without new actors or storage writes',async()=>{
 for(const mode of ['hd','missing-atlas','missing-manifest']){
  const requests=[],writes=[],metadata={...assets,spritesV3:mode==='missing-manifest'?null:hd};
  const store={setItem(...v){writes.push(v)},removeItem(...v){writes.push(v)},clear(){writes.push('clear')}};
  const f=fixture('10:00',true,url=>{requests.push(url);return mode==='hd'?/sprites-v[23]\//.test(url):/sprites-v2\//.test(url)},null,{HaniOfficeV2Assets:metadata,localStorage:store,sessionStorage:store});
  const nodes=[...f.ids.get('haniOfficeActors').children];
  for(const floor of ['1f','2f','3f','4f','5f']){f.click(floor);await flush()}
  for(const actor of nodes){
   if(['daon','yoonseul'].includes(actor.dataset.person)){assert.equal(actor.hidden,true);assert.equal(actor.dataset.spriteScale,undefined);continue;}
   assert.equal(actor.dataset.spriteScale,mode==='hd'?'3':'1');
   assert.match(actor.querySelector('.hani-office-sprite').style.backgroundImage,mode==='hd'?/sprites-v3\//:/sprites-v2\//);
   assert.match(actor.style.transform,/translate\(-50%,-95\.3125%\)/,'normalized physical pivot');
  }
  assert.equal(requests.filter(u=>/sprites-v3\//.test(u)).length,mode==='missing-manifest'?0:17);
  assert.equal(requests.filter(u=>/sprites-v2\//.test(u)).length,mode==='hd'?0:17);
  assert.deepEqual(f.ids.get('haniOfficeActors').children,nodes);assert.deepEqual(writes,[]);
 }
});

test('actual metadata bootstrap tolerates missing/malformed v3 and keeps the v2 scene',async()=>{
 for(const mode of ['present','404','invalid-json','network','bad-schema']){
  const calls=[];const c=vm.createContext({window:{},document:{getElementById:()=>null},fetch:async url=>{
   calls.push(url);
   if(url.endsWith('manifest-v3.json')){
    if(mode==='network')throw Error('offline');
    return {ok:mode!=='404',json:async()=>{if(mode==='invalid-json')throw Error('json');return mode==='bad-schema'?{}:hd}};
   }
   const file=path.join(root,url);return {ok:fs.existsSync(file),json:async()=>JSON.parse(fs.readFileSync(file))};
  }});
  await vm.runInContext(source,c);assert.ok(c.HaniBuildingScene);assert.equal(c.HaniBuildingScene.canon.anchors.length,326);
  assert.equal(calls.filter(u=>u.endsWith('manifest-v3.json')).length,1);
 }
 assert.doesNotMatch(source,/localStorage|sessionStorage|supabase|\.setItem\(|\.removeItem\(|\.clear\(/);
});

if(process.argv.includes('--browser'))await browserChecks();
else console.log('NOT RUN: real browser geometry, hit testing, anchor comparison and screenshots; use --browser');

async function browserChecks(){
 const args=process.argv.slice(process.argv.indexOf('--browser')+1),report={result:'running',checks:[],screenshots:[],errors:[],baseline:'aa9c963c39e51775e3077bfbd22b2ea32e4372a1',clock:'2026-10-19T10:00:00+09:00',zoom:1};
 let browser,server;
 try{
  const {chromium}=await import(pathToFileURL(path.resolve(args[0]||path.join(runtime,'playwright/index.mjs'))).href);
  browser=await chromium.launch({headless:true,executablePath:args[1]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  server=http.createServer((req,res)=>{
   const url=new URL(req.url,'http://local'),baseline=url.pathname.startsWith('/baseline/');
   const rel=decodeURIComponent(url.pathname.replace(/^\/baseline/,'').replace(/^\/$/,'/index.html'));
   let file=path.resolve(root,'.'+rel);
   if(!file.startsWith(path.resolve(root)+path.sep)){res.writeHead(403).end();return}
   if(baseline&&['/hani-office-live.js','/hani-office-live.css','/hani-design-system.css'].includes(rel))file=path.join(out,'baseline',rel.slice(1));
   if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
   res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  async function open(width,dpr,baseline=false,fail=''){
   const context=await browser.newContext({viewport:{width,height:1200},deviceScaleFactor:dpr,timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
   await context.route('**/*',r=>{
    const u=new URL(r.request().url());if(u.origin!==origin)return r.fulfill({status:200,body:''});
    if(fail==='manifest'&&u.pathname.endsWith('manifest-v3.json')||fail==='atlas'&&/sprites-v3\/.*\.webp$/.test(u.pathname))return r.fulfill({status:404,body:''});
    return r.continue();
   });
   const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
   await page.clock.install({time:new Date(report.clock)});await page.clock.pauseAt(new Date(report.clock));
   await page.goto(origin+(baseline?'/baseline/':'/'));
   await page.waitForFunction(()=>typeof showView==='function'&&globalThis.HaniBuildingScene&&document.querySelector('#haniOfficeActors')?.children.length>0);
   // Login/view setup can write existing app UI prefs. Measure only office actions after setup.
   await page.evaluate(()=>{unlockLoginGate();showView('agentReview');window.hdWrites=[];for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(...args){hdWrites.push({method,key:args[0]});};});
   return {context,page};
  }
  async function floor(page,id){
   await page.locator(`[data-building-floor="${id}"]`).click();
   await page.waitForFunction(()=>[...document.querySelectorAll('.hani-office-actor:not([hidden])')].every(a=>a.dataset.avatar==='v2'));
   await page.locator('#haniOfficeMap').scrollIntoViewIfNeeded();
  }
  async function measure(page){return page.evaluate(()=>[...document.querySelectorAll('.hani-office-actor:not([hidden])')].map(a=>{
   const m=document.getElementById('haniOfficeMap').getBoundingClientRect(),r=a.getBoundingClientRect(),box={left:r.left-m.left,top:r.top-m.top,width:r.width,height:r.height},sprite=a.querySelector('.hani-office-sprite').getBoundingClientRect(),hit=getComputedStyle(a,'::before'),transform=getComputedStyle(a).transform;
   const frame=HaniBuildingScene.canon.people.find(p=>p.id===a.dataset.person),w=parseFloat(hit.width)||box.width,h=parseFloat(hit.height)||box.height;
   return {id:a.dataset.person,pose:a.dataset.pose,scale:a.dataset.spriteScale,anchor:[box.left+box.width*.5,box.top+box.height*61/64],sprite:{width:sprite.width,height:sprite.height},hit:{x:r.left+(box.width-w)/2,y:r.top+(box.height-h)/2,width:w,height:h},transform,registered:!!frame};
  }));}
  const captures={};
  for(const width of [390,412,884,1440]){
   const dpr=width<=412?3:width===884?2.6:1,before=await open(width,dpr,true),after=await open(width,dpr);
   for(const id of ['1f','2f','3f','4f','5f']){
    await floor(before.page,id);await floor(after.page,id);
    const old=await measure(before.page),now=await measure(after.page);
    assert.deepEqual(now.map(a=>a.id),old.map(a=>a.id));
    for(const actor of now){
     const prev=old.find(a=>a.id===actor.id);assert.equal(actor.scale,'3');assert.ok(Math.abs(actor.sprite.width/actor.sprite.height-.75)<=.02);
     assert.ok(Math.abs(actor.anchor[0]-prev.anchor[0])<=2&&Math.abs(actor.anchor[1]-prev.anchor[1])<=2,JSON.stringify({width,id,actor,prev}));
     if(width<=900)assert.ok(actor.hit.width>=40&&actor.hit.height>=40);
    }
    report.checks.push({width,dpr,floor:id,actors:now});
    if([412,1440].includes(width)&&['2f','3f'].includes(id)){
     for(const [label,page] of [['before',before.page],['after',after.page]]){
      const file=path.join(out,`${label}-${width}-${id}.png`);await page.locator('#haniOfficeMap').screenshot({path:file,scale:'device'});
      (captures[width]||=[]).push({label,floor:id,file});
     }
    }
   }
   // Real hit testing outside the narrow artwork plus delegated mouse/keyboard events.
   await floor(after.page,'3f');const actors=await measure(after.page);let tapped=false;
   for(const actor of actors){
    const x=actor.hit.x+1,y=actor.hit.y+actor.hit.height/2;
    const target=await after.page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('.hani-office-actor')?.dataset.person,{x,y});
    if(target!==actor.id)continue;
    await after.page.mouse.click(x,y);await after.page.locator('.hani-office-character-bubble').waitFor({state:'visible'});
    await after.page.locator(`.hani-office-actor[data-person="${actor.id}"]`).press('Enter');tapped=true;break;
   }
   assert.ok(tapped,'expanded hit area dispatches through actor');assert.deepEqual(await after.page.evaluate(()=>hdWrites),[]);
   await before.context.close();await after.context.close();
  }
  for(const fail of ['manifest','atlas']){
   const {context,page}=await open(412,3,false,fail);await floor(page,'3f');
   assert.ok((await measure(page)).every(a=>a.scale==='1'));assert.deepEqual(await page.evaluate(()=>hdWrites),[]);
   report.checks.push({fallback:fail,result:'v2 loaded'});await context.close();
  }
  for(const width of [412,1440]){
   const rows=captures[width],meta=await sharp(rows[0].file).metadata(),header=48,gap=20;
   const layers=[];
   for(const row of rows){const left=row.label==='before'?0:meta.width+gap,top=header+(row.floor==='2f'?0:meta.height+gap);layers.push({input:row.file,left,top});}
   const w=meta.width*2+gap,h=header+meta.height*2+gap;
   const label=Buffer.from(`<svg width="${w}" height="${header}"><rect width="100%" height="100%" fill="#eef0f5"/><text x="12" y="30" font-family="Arial" font-size="20">2.9.222 / DPR ${width===412?3:1} / native pixels</text><text x="${meta.width+gap+12}" y="30" font-family="Arial" font-size="20">office-hd-224 / same floor and clock</text></svg>`);
   const file=path.join(out,width===412?'compare-412-dpr3.png':'compare-1440.png');
   await sharp({create:{width:w,height:h,channels:4,background:'#eef0f5'}}).composite([{input:label,left:0,top:0},...layers]).png().toFile(file);
   report.screenshots.push(path.basename(file));
  }
  assert.deepEqual(report.errors,[]);report.result='passed';
 }catch(e){report.result=/EPERM|EACCES|executable.*exist/i.test(String(e))?'browser-blocked':'failed';report.errors.push(String(e));process.exitCode=1;}
 finally{await browser?.close();if(server)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,checks:report.checks.length,screenshots:report.screenshots,errors:report.errors}));}
}
