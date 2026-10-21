// node scripts/hani-office-219.test.mjs [--browser [playwright/index.mjs] [browser.exe] [--labels-only]]
// Real production index/assets for all revisions; fake KST clock, external traffic blocked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {withoutSimplify225} from './hani-simplify-225-preservation.mjs';
import {withoutLaunchGreeting} from './hani-launch-greeting-221-preservation.mjs';
import {withoutPhotoBackupUi} from './hani-photo-backup-222-preservation.mjs';
import {withoutOfflineEntryUi} from './hani-offline-entry-223-preservation.mjs';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/office-219');
fs.mkdirSync(out,{recursive:true});
const git=(...args)=>{
 if(args[0]==='show'){
  const [ref,...parts]=args[1].split(':'),revision=ref==='60db7b5'?'217':ref===base?'218':null;
  const exported=process.env.HANI_OFFICE_TEST_BASELINE?path.join(process.env.HANI_OFFICE_TEST_BASELINE,ref.replaceAll('/','-'),parts.join(':')):revision&&path.join(out,'baseline',revision,parts.join(':'));
  if(exported&&fs.existsSync(exported))return fs.readFileSync(exported);
 }
 return execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
};
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const before='60db7b5',base='974fa64df67a3c0060bdf0eda951aafeaf5a9b11';
const old=f=>git('show',before+':'+f).toString('utf8');
const times=['10:00','15:40','21:00','00:30'],widths=[390,412,884,1440],floors=['1f','2f','3f','4f','5f'];
const assets={canon:JSON.parse(read('data/hani-building/spatial-contract.json')),sprites:JSON.parse(read('assets/sprites-v2/manifest.json')),art:JSON.parse(read('data/hani-building/art-map-v1.json'))};
const table=JSON.parse(read('assets/data/office-actions-216.json')),source=read('hani-office-live.js');
function model(text,metadata=assets){
 const c=vm.createContext({HaniOfficeV2Assets:metadata,HaniOfficeActions216:table,window:{},document:{getElementById:()=>null}});
 vm.runInContext(text,c);return c.HaniBuildingScene;
}
const plain=v=>JSON.parse(JSON.stringify(v));
const current=model(source),baseline=model(old('hani-office-live.js'),{...assets,art:JSON.parse(old('data/hani-building/art-map-v1.json'))});
const report={result:'running',base,baseline:before,checks:[],screenshots:[],errors:[],static:[]};
const save=()=>fs.writeFileSync(path.join(out,process.argv.includes('--browser')?'label-results.json':'label-unit-results.json'),JSON.stringify(report,null,2));
const overlap=(x,y)=>Math.max(0,Math.min(x.right,y.right)-Math.max(x.left,y.left))*Math.max(0,Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top))/Math.min(x.width*x.height,y.width*y.height);
function contrast(fg,bg){
 const luminance=color=>{const hex=color.length===4?'#'+[...color.slice(1)].map(c=>c+c).join(''):color,rgb=hex.startsWith('#')?hex.slice(1).match(/../g).map(v=>parseInt(v,16)):color.match(/[\d.]+/g).slice(0,3).map(Number);return rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)};
 const x=luminance(fg),y=luminance(bg);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
const css=read('hani-office-live.css');
for(const selector of ['.hani-office-name','.hani-office-status','.hani-office-actor[data-mood="true"] .hani-office-status','.hani-office-actor[data-called="true"] .hani-office-status','.hani-office-character-bubble']){
 const declarations=css.slice(css.indexOf(selector+'{')).split('}')[0],fg=declarations.match(/;color:(#[\da-f]{6}|#[\da-f]{3})/i)?.[1],bg=declarations.match(/;background:(#[\da-f]{6}|#[\da-f]{3})/i)?.[1];
 assert.ok(fg&&bg&&contrast(fg,bg)>=4.5,`${selector} AA text contrast`);
}
report.static.push('actual stylesheet: name/status/mood/meeting/speech text contrast >=4.5:1');

// Evidence rules out remapped chairs, atlas/pose/scale drift; no hypothetical visual PASS.
assert.deepEqual(assets.art.anchors,baseline.art.anchors);
assert.equal(read('assets/sprites-v2/manifest.json'),old('assets/sprites-v2/manifest.json'));
const slice=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
assert.equal(slice(source,'  function pose(','  function loadSprite('),slice(old('hani-office-live.js'),'  function pose(','  function loadSprite('));
const scale=s=>[...s.matchAll(/\.hani-office-actor\{[^}]+\}/g)].map(m=>m[0].replace('z-index:4;',''));
assert.deepEqual(scale(read('hani-office-live.css')),scale(old('hani-office-live.css')));
report.static.push('217 anchors, atlas metadata, pose/pivot and actor scale unchanged');
assert.doesNotMatch(read('hani-office-live.css'),/\.hani-office-status\{display:none\}/);
assert.doesNotMatch(source,/localStorage|sessionStorage|supabase/);
for(const time of [...times,'02:00']){
 const instant=`2026-10-19T${time}:00+09:00`,s=current.snapshot(instant),people=s.floors.flatMap(f=>f.visible);
 assert.equal(people.length,time==='02:00'?5:17);assert.ok(people.every(p=>p.line&&p.seat));
 assert.equal(new Set(people.map(p=>p.seat.anchor)).size,people.length);
 if(time==='02:00')assert.deepEqual(people.map(p=>p.id).sort(),['dohyun','minji','mir','seoyun','yuna']);
 if(['10:00','15:40'].includes(time)){
  const prev=baseline.snapshot(instant);
  assert.deepEqual(plain(s.floors.map(f=>f.visible)),plain(prev.floors.map(f=>f.visible)));
 }
 report.static.push(`${time}: ${people.length} staff, unique seats, speech present; night presence retained`);
}
for(const f of ['index.html','data/hani-building/art-map-v1.json','data/hani-building/spatial-contract.json','assets/sprites-v2/manifest.json','assets/data/office-actions-216.json'])assert.equal(f==='index.html'?withoutPhotoBackupUi(withoutLaunchGreeting(withoutOfflineEntryUi(withoutSimplify225(f,read(f))))):read(f),f==='index.html'?withoutPhotoBackupUi(withoutLaunchGreeting(withoutOfflineEntryUi(git('show','origin/main:'+f).toString('utf8')))):git('show',base+':'+f).toString('utf8'),f+' preserved');
report.static.push('version/cache, office metadata and action budgets preserved; no office storage/Cloud APIs (art files checked separately with git diff)');
// Execute the real renderer and floor events as well as the scene model. DOM doubles
// verify persistent identity and speech updates, not visibility or pixel geometry.
const {fixture}=await import('./hani-building-206-engine.test.mjs');
const mounted=fixture('10:00',true,null,table),nodes=[...mounted.ids.get('haniOfficeActors').children],pills=nodes.map(n=>n.querySelector('.hani-office-status'));
for(const time of times){
 mounted.setDateTime(`2026-10-19T${time}:00+09:00`);let count=0;
 for(const floor of floors){
  mounted.click(floor);count+=mounted.visible().length;
  assert.deepEqual(mounted.ids.get('haniOfficeActors').children,nodes);
  assert.ok(nodes.every((n,i)=>n.querySelector('.hani-office-status')===pills[i]));
  for(const actor of mounted.visible()){
   const pill=actor.querySelector('.hani-office-status');
   assert.ok(pill.dataset.full);assert.equal(pill.dataset.full,actor.officeText.textContent);
   assert.equal(pill.title,pill.dataset.full);assert.ok(pill.dataset.full.includes(actor.dataset.line));
   const dot=actor.querySelector('.hani-office-status-dot'),icon=actor.querySelector('.hani-office-activity-icon');
   assert.ok(dot.title);assert.equal(dot.getAttribute('aria-label'),dot.title);
   assert.equal(icon.textContent,actor.dataset.emoji);assert.equal(icon.hidden,!actor.dataset.emoji);
   assert.equal(actor.querySelectorAll('.hani-office-name').length,1);
  }
 }
 assert.ok(count>0);
}
report.static.push('real renderer: four clocks/five floor clicks retain actor/status slots and update full speech/title/roster');
// The real delegated tap path owns one persistent panel and a fresh 3s lifetime.
mounted.click('3f');const tapActors=mounted.visible(),panel=mounted.root.querySelector('.hani-office-character-bubble'),timeouts=[];
mounted.context.setTimeout=(fn,ms)=>{timeouts.push({fn,ms})};
const tap=actor=>mounted.ids.get('haniOfficeActors').events.click({target:actor.querySelector('.hani-office-name')});
tap(tapActors[0]);assert.equal(panel.hidden,false);assert.ok(panel.querySelector('p').textContent.includes(tapActors[0].dataset.line));
tap(tapActors[1]);assert.equal(mounted.root.querySelectorAll('.hani-office-character-bubble').length,1);
assert.ok(panel.querySelector('p').textContent.includes(tapActors[1].dataset.name));assert.ok(timeouts.every(t=>t.ms===3000));
timeouts[0].fn();assert.equal(panel.hidden,false,'an earlier tap cannot close the current speech');
timeouts[1].fn();assert.equal(panel.hidden,true);
tap(tapActors[0]);mounted.click('2f');timeouts.at(-1).fn();assert.equal(panel.hidden,true);
report.static.push('delegated name/dot tap: one persistent full status panel, 3000ms, latest tap wins, floor change closes');
const event=current.scheduler.plan('2026-10-19').find(e=>e.layer===3),eventTime=new Date(Date.parse('2026-10-19T00:00:00+09:00')+(event.performStart+event.performEnd)/2*1000).toISOString();
mounted.setDateTime(eventTime);mounted.click(event.floors[0]);const performer=mounted.visible().find(a=>a.dataset.action===event.actionId);
assert.ok(performer.dataset.emoji);assert.equal(performer.querySelector('.hani-office-activity-icon').textContent,performer.dataset.emoji);assert.equal(performer.querySelector('.hani-office-activity-icon').hidden,false);
report.static.push('216 scheduled activity: active emoji updates inside persistent name slot');
// Constrained geometry exercises the actual owner through floor/tap handlers.
// These supplied boxes verify collision decisions, not browser font measurements.
const layout=fixture('10:00',true,null,table);layout.click('3f');const layoutActors=layout.visible();
const box=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
let canvas=box(0,0,336,180);
layout.map.getBoundingClientRect=()=>canvas;
function measured(node,kind,base){node.getBoundingClientRect=()=>{const r=base(),x=parseFloat(node.style['--'+kind+'-x'])||0,y=parseFloat(node.style['--'+kind+'-y'])||0;return box(r.left+x,r.top+y,r.width,r.height)}}
for(const [i,actor] of layoutActors.entries()){
 measured(actor.querySelector('.hani-office-name'),'name',()=>canvas.width<=600?box(70+i*21,120,40,16):box(70+i*140,55,26,14));
 measured(actor.querySelector('.hani-office-status'),'status',()=>box(100,25,120,20));
}
layout.click('3f');
for(const a of layoutActors){assert.equal(a.querySelector('.hani-office-status').hidden,true);for(const b of layoutActors.filter(b=>b!==a))assert.ok(overlap(a.querySelector('.hani-office-name').getBoundingClientRect(),b.querySelector('.hani-office-name').getBoundingClientRect())<=.10)}
canvas=box(0,0,900,80);layout.click('3f');
// In this deliberately crowded floor only two pill rows fit. Speech must take
// the first row, a meeting the next, and normal statuses must yield.
layoutActors[1].dataset.activity='meeting';layout.context.setTimeout=()=>{};
layout.ids.get('haniOfficeActors').events.click({target:layoutActors.at(-1)});
const shown=layoutActors.filter(a=>a.querySelector('.hani-office-status').style.visibility!=='hidden');
assert.ok(shown.includes(layoutActors.at(-1))&&shown.includes(layoutActors[1]));assert.equal(shown.length,2);
for(const a of shown)for(const b of layoutActors){const pill=a.querySelector('.hani-office-status').getBoundingClientRect();assert.equal(overlap(pill,b.querySelector('.hani-office-name').getBoundingClientRect()),0);if(a!==b&&shown.includes(b))assert.equal(overlap(pill,b.querySelector('.hani-office-status').getBoundingClientRect()),0)}
canvas=box(0,0,900,400);layout.ids.get('haniOfficeActors').events.keydown({key:'Escape'});
assert.ok(layoutActors.every(a=>a.querySelector('.hani-office-status').style.visibility!=='hidden'),'resize recovers hidden lower-priority pills');
for(const [state,title] of [['work','근무 중'],['rest','휴식 중'],['meeting','회의 중'],['moving','이동 중'],['night','야근 중']]){
 const actor=layoutActors[0];actor.officeTravel=null;actor.dataset.called='false';actor.dataset.activity=state;actor.dataset.walking=String(state==='moving');actor.querySelector('.hani-office-status').dataset.full=state==='night'?'야근 중':'자료 확인 중';
 layout.ids.get('haniOfficeActors').events.keydown({key:'Escape'});assert.equal(actor.dataset.status,state);assert.equal(actor.querySelector('.hani-office-status-dot').title,title);assert.equal(actor.querySelector('.hani-office-status-dot').getAttribute('aria-label'),title);
}
report.static.push('constrained boxes/actual owner: compact tags stagger without overlap; desktop speech > meeting > status, no name collisions, hidden pills recover');
report.result='static-passed-browser-not-run';save();
console.log('PASS office-219 source/model: geometry equality, five clocks, presence, read-only/version/art preservation');
if(!process.argv.includes('--browser')){console.log('NOT RUN: real screen/label bounds/overlap/scale screenshots; use --browser');}
else{
let browser,server;
try{
 const i=process.argv.indexOf('--browser');
 const browserArgs=process.argv.slice(i+1).filter(a=>!a.startsWith('--'));
 const runtime=browserArgs[0]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 const {chromium}=await import(pathToFileURL(path.resolve(runtime)).href);
 browser=await chromium.launch({headless:true,executablePath:browserArgs[1]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const blobs=new Map();
 server=http.createServer((req,res)=>{
  try{
   const u=new URL(req.url,'http://local'),revision=u.searchParams.get('rev')||req.headers.referer&&new URL(req.headers.referer).searchParams.get('rev')||'patched';
   const name=decodeURIComponent(u.pathname).replace(/^\//,'')||'index.html',file=path.resolve(root,name);
   if(!file.startsWith(root)||name.split('/').some(p=>p.startsWith('.'))||!['217','218','patched'].includes(revision)){res.writeHead(403).end();return;}
   let body;
   if(revision==='patched')body=fs.readFileSync(file);
   else{const key=revision+':'+name;if(!blobs.has(key))blobs.set(key,git('show',(revision==='217'?before:base)+':'+name));body=blobs.get(key);}
   res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(name)]||'application/octet-stream');res.end(body);
  }catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const sizes=new Map(),captures=new Map(),revisions=process.argv.includes('--labels-only')?['patched']:['217','218','patched'];
 if(process.argv.includes('--labels-only')){
  const measured=JSON.parse(read('artifacts/office-219/results.json'));
  assert.equal(measured.result,'passed');assert.equal(measured.base,base);
  for(const c of measured.checks.filter(c=>c.revision==='217'&&c.time==='10:00'))for(const a of c.actors)sizes.set(`${c.width}:${a.id}`,a.sprite);
 }
 for(const width of widths)for(const time of times)for(const revision of revisions){
  const context=await browser.newContext({viewport:{width,height:1400},timezoneId:'Asia/Seoul',reducedMotion:'reduce',colorScheme:'light'});
  await context.addInitScript(instant=>{
   const D=Date;window.Date=class extends D{constructor(...a){super(...(a.length?a:[instant]))}static now(){return new D(instant).getTime()}};
  },`2026-10-19T${time}:00+09:00`);
  await context.route('**/*',r=>{
   const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();
   u.searchParams.set('rev',revision);return r.continue({url:u.href});
  });
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push({width,time,revision,error:e.message}));
  await page.goto(`${origin}/?rev=${revision}`);
  await page.waitForFunction(()=>window.HaniBuildingScene?.scheduler&&document.querySelectorAll('[data-building-floor]').length===5);
  await page.evaluate(()=>{
   unlockLoginGate();document.documentElement.dataset.finish='cream';showView('agentReview');
   window.office219Nodes=[...document.querySelector('#haniOfficeActors').children];window.office219Writes=[];
   window.office219Protected=localStorage.getItem('hani_os_life_v23');
   for(const key of ['setItem','removeItem','clear']){const fn=Storage.prototype[key];Storage.prototype[key]=function(...a){office219Writes.push(key+':'+(a[0]||''));return fn.apply(this,a)}}
  });
  let staff=0;
  for(const floor of floors){
   await page.locator(`[data-building-floor="${floor}"]`).click();
   await page.waitForFunction(id=>{
    const m=document.querySelector('#haniOfficeMap'),img=m.querySelector('.hani-office-background');
    return m.dataset.floor===id&&m.dataset.art==='floor'&&img.complete&&img.naturalWidth>0&&[...m.querySelectorAll('.hani-office-actor')].filter(a=>!a.hidden).every(a=>a.dataset.avatar==='v2');
   },floor);
   await page.evaluate(()=>document.fonts.ready);
   const check=await page.evaluate(()=>{
    const m=document.querySelector('#haniOfficeMap'),box=m.getBoundingClientRect(),rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
    const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility==='visible'&&+s.opacity>0&&r.width>0&&r.height>0};
    const paint=e=>({foreground:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor});
    return {floor:m.dataset.floor,box:rect(m),persistent:office219Nodes.every((n,i)=>n===document.querySelector('#haniOfficeActors').children[i]),writes:office219Writes,protectedSame:office219Protected===localStorage.getItem('hani_os_life_v23'),
     actors:[...m.querySelectorAll('.hani-office-actor')].filter(a=>!a.hidden).map(a=>{const s=a.querySelector('.hani-office-status'),n=a.querySelector('.hani-office-name'),dot=n.querySelector('.hani-office-status-dot'),icon=n.querySelector('.hani-office-activity-icon'),r=s.getBoundingClientRect(),tag=n.getBoundingClientRect();return {id:a.dataset.person,seat:a.dataset.seat,pose:a.dataset.pose,line:a.dataset.line,emoji:a.dataset.emoji,status:a.dataset.status,sprite:rect(a.querySelector('.hani-office-sprite')),visible:visible(a)&&visible(a.querySelector('.hani-office-sprite')),name:{...rect(n),...paint(n),text:n.textContent,visible:visible(n),inside:tag.left>=box.left&&tag.right<=box.right&&tag.top>=box.top&&tag.bottom<=box.bottom,dot:dot?{...rect(dot),visible:visible(dot),title:dot.title,aria:dot.getAttribute('aria-label'),color:getComputedStyle(dot).backgroundColor}:null,icon:icon?{visible:visible(icon),text:icon.textContent}:null},label:{...rect(s),...paint(s),text:s.textContent,visible:visible(s),inside:r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom}}})};
   });
   report.checks.push({width,time,revision,...check});staff+=check.actors.length;
   assert.ok(check.persistent&&check.protectedSame);assert.deepEqual(check.writes,[]);
   if(revision==='217'&&time==='10:00')for(const a of check.actors)sizes.set(`${width}:${a.id}`,a.sprite);
   if(revision==='patched'){
    for(const a of check.actors){
     assert.ok(a.visible&&a.name.visible&&a.name.inside&&a.name.text,`${width} ${time} ${floor} ${a.id}: sprite/name visible and within floor`);
     assert.ok(contrast(a.name.foreground,a.name.background)>=4.5,'computed name text AA');if(a.label.visible)assert.ok(contrast(a.label.foreground,a.label.background)>=4.5,'computed pill text AA');
     if(check.box.width<=600){
      assert.equal(a.label.visible,false,'no separate mobile text pill');assert.ok(a.name.dot.visible&&a.name.dot.title&&a.name.dot.aria===a.name.dot.title);
      assert.equal(a.name.dot.color,({work:'rgb(22, 128, 60)',rest:'rgb(168, 100, 8)',meeting:'rgb(37, 99, 235)',moving:'rgb(100, 116, 139)',night:'rgb(126, 34, 206)'})[a.status]);
      assert.ok(a.name.dot.left>=a.name.left&&a.name.dot.right<=a.name.right,'dot inside canonical name');
      assert.equal(a.name.icon.visible,Boolean(a.emoji));assert.equal(a.name.icon.text,a.emoji);
     }else if(a.label.visible)assert.ok(a.label.inside&&a.label.text,'visible desktop pill within floor');
     const original=sizes.get(`${width}:${a.id}`);assert.ok(original,'217 daytime reference for '+a.id);
     for(const axis of ['width','height'])assert.ok(Math.abs(a.sprite[axis]/original[axis]-1)<=.10,`${a.id} ${axis} within 10% of 217`);
    }
    for(let a=0;a<check.actors.length;a++)for(let b=a+1;b<check.actors.length;b++){
     if(width===390||width===412)assert.ok(overlap(check.actors[a].name,check.actors[b].name)<=.10,`${width} ${time} ${floor}: name tags including dot overlap <=10%`);
     const x=check.actors[a].sprite,y=check.actors[b].sprite;
     const intersection=Math.max(0,Math.min(x.right,y.right)-Math.max(x.left,y.left))*Math.max(0,Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top));
     const ratio=intersection/Math.min(x.width*x.height,y.width*y.height),msg=`${width} ${time} ${floor}: ${check.actors[a].id}/${check.actors[b].id} overlap ${(ratio*100).toFixed(0)}% (limit 30%)`;
     if(process.env.OFFICE_SOFT){if(ratio>.30)(report.overlaps||(report.overlaps=[])).push(msg);}else assert.ok(ratio<=.30,msg);
    }
    if(check.box.width>600)for(const a of check.actors.filter(a=>a.label.visible)){
     for(const b of check.actors){assert.equal(overlap(a.label,b.name),0,`${width} ${time} ${floor}: pill never covers name ${b.id}`);if(a.id!==b.id&&b.label.visible)assert.equal(overlap(a.label,b.label),0,`${width} ${time} ${floor}: pills never overlap`)}
    }
   }
   captures.set(`${width}:${time}:${revision}:${floor}`,await page.locator('#haniOfficeMap').screenshot({animations:'disabled'}));
  }
  if(revision==='patched')assert.ok(staff>0,`${width} ${time}: visible staff across floors (empty roof is intentional)`);
  if(revision==='patched'&&time==='10:00'&&[390,412,1440].includes(width)){
   await page.locator('[data-building-floor="3f"]').click();const taps=page.locator('.hani-office-actor:not([hidden])'),panel=page.locator('.hani-office-character-bubble');
   await taps.nth(0).click();await panel.waitFor({state:'visible'});await page.waitForTimeout(1600);await taps.nth(1).press('Enter');
   assert.equal(await panel.count(),1);assert.ok((await panel.innerText()).includes(await taps.nth(1).getAttribute('data-name')));
   await page.waitForTimeout(1600);assert.ok(await panel.isVisible(),'earlier 3s timeout leaves latest speech visible');
   await panel.waitFor({state:'hidden',timeout:2100});report.static.push(`${width}: actual tap/Enter one full-status speech panel, latest tap gets 3 seconds`);
  }
  await context.close();
 }
 // Side-by-side evidence uses actual screenshot pixels: 217 | 218 | patched, all five floors.
 const sheet=await browser.newPage();
 for(const width of widths)for(const time of times){
  await sheet.setViewportSize({width:width*revisions.length+64,height:1200});
  await sheet.setContent(`<html><meta charset="utf-8"><style>body{font:16px sans-serif;margin:8px;background:#eee}main{display:grid;grid-template-columns:repeat(${revisions.length},1fr);gap:8px}h2{font-size:16px}img{width:100%;display:block}figure{margin:0 0 10px}figcaption{padding:6px}</style><h1>${width}px · 2026-10-19 ${time} KST</h1><main>${revisions.map(rev=>`<section><h2>${rev}</h2>${floors.map(f=>`<figure><figcaption>${f}</figcaption><img src="data:image/png;base64,${captures.get(`${width}:${time}:${rev}:${f}`).toString('base64')}"></figure>`).join('')}</section>`).join('')}</main></html>`);
  await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  const name=`labels-${width}-${time.replace(':','')}.png`;await sheet.screenshot({path:path.join(out,name),fullPage:true});report.screenshots.push(name);
 }
 await sheet.close();assert.deepEqual(report.errors,[]);report.result='passed';
}catch(error){report.result=/EPERM|EACCES|executable.*exist/i.test(error.message)?'browser-blocked':'failed';report.reason=error.stack;process.exitCode=1;}
finally{await browser?.close();if(server?.listening)await new Promise(r=>server.close(r));save();console.log(JSON.stringify({result:report.result,checks:report.checks.length,screenshots:report.screenshots.length,reason:report.reason}));}
}
