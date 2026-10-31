// 서윤 실행: node scripts/hani-office-obr14.browser.mjs [playwright/index.mjs] [msedge.exe]
// Actual owners/CSS/seed assets. Only clock and measurement hooks are fixture-only.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {untilOffice,waitForOfficeLabels} from './hani-office-label-browser-ready.mjs';
import {readPhoneLabels,assertPhoneLabels} from './hani-office-obr18-browser-geometry.mjs';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/office-behavior/'+(process.env.HANI_OFFICE_BROWSER_TAG?process.env.HANI_OFFICE_BROWSER_TAG+'-shots':'obr14-shots'));fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('<section class="hani-office-live"'),end=html.indexOf('</section>',start)+10;assert.ok(start>0&&end>start);
const document=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/hani-office-live.css"><link rel="stylesheet" href="/hani-design-system.css"><link rel="stylesheet" href="/hani-desk-mascots.css"><style>body{margin:0;padding:12px;font-family:'Malgun Gothic',sans-serif}.view{max-width:1350px;margin:auto}[hidden]{display:none!important}</style><div id="app"><div class="view active">${html.slice(start,end)}</div></div><script src="/hani-organization-hub.js"></script><script src="/hani-office-live.js"></script><script src="/hani-desk-mascots.js"></script></html>`;
const result={status:'running',browser:null,checks:[],screenshots:[],layout:[],frames:[],errors:[],writes:[],unavailable:[]};let browser,server;
try{
 const runtime=process.argv[2]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 const {chromium}=await import(pathToFileURL(runtime).href);browser=await chromium.launch({headless:true,executablePath:process.argv[3]||process.env.HANI_CHROME_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});result.browser=await browser.version();
 server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(document)}
  const file=path.resolve(root,'.'+pathname);if(!file.startsWith(path.resolve(root)+path.sep)||pathname.split('/').some(p=>p.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');
  if(pathname==='/hani-office-live.js')return res.end(fs.readFileSync(file,'utf8').replace('function fitStatusLabels(){',`function fitStatusLabels(){const t=performance.now();try{return measuredStatusLabels()}finally{(window.officeLayoutCosts||=[]).push(performance.now()-t)}}function measuredStatusLabels(){`).replace('function sceneVisible(){','function sceneVisible(){if(window.officeStress)return false;'));res.end(fs.readFileSync(file));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 for(const width of [390,884,1440])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'});
  await context.addInitScript(()=>{
   window.officeClock=Date.parse('2026-10-22T12:10:00+09:00');const RealDate=Date;window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[officeClock]))}static now(){return officeClock}};
   window.HaniOfficePresence={chairman:'active'};window.officeWrites=[];
   for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(){officeWrites.push(method);throw Error('forbidden storage write')};
  });await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('response',r=>{if(r.status()===404)result.unavailable.push(r.url())});await page.goto(origin);
  await untilOffice(page,()=>window.HaniBuildingScene?.scheduler&&document.querySelectorAll('[data-building-floor]').length===5);await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  const read=()=>page.evaluate(()=>{
   const map=document.getElementById('haniOfficeMap'),floor=map.getBoundingClientRect(),rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}},visible=n=>{const c=getComputedStyle(n);return !n.hidden&&c.display!=='none'&&c.visibility!=='hidden'&&n.getBoundingClientRect().width>0};
   const actors=[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden),boxes=[],staff=[];
   for(const a of actors)for(const kind of ['name','status']){const n=a.querySelector('.hani-office-'+kind);if(visible(n))boxes.push({id:a.dataset.person,kind,fontSize:parseFloat(getComputedStyle(n).fontSize),...rect(n)});if(kind==='status'&&a.dataset.visitor!=='true'){const phone=matchMedia('(max-width:600px)').matches,slot=phone?a.querySelector('.hani-office-name'):n;staff.push({id:a.dataset.person,shown:visible(slot)&&a.dataset.labelMode!=='dot',text:phone?a.querySelector('.hani-office-compact-line').textContent.slice(3):n.textContent,full:n.dataset.full,fontSize:parseFloat(getComputedStyle(slot).fontSize)})}}
   const mascots=[...map.querySelectorAll('.hani-desk-mascots:not([hidden]) .hani-desk-mascot[data-ready="true"]')].filter(visible).map(rect);
   const overlap=(a,b)=>a.left<b.right-.1&&a.right>b.left+.1&&a.top<b.bottom-.1&&a.bottom>b.top+.1;
   const sprites=actors.map(a=>({id:a.dataset.person,...rect(a.querySelector('.hani-office-sprite'))}));
   const faces=actors.map(a=>{const r=rect(a.querySelector('.hani-office-sprite'));return {id:a.dataset.person,left:r.left,top:r.top,right:r.right,bottom:r.top+(r.bottom-r.top)*.65}});
   const layers=actors.map(a=>({id:a.dataset.person,actor:getComputedStyle(a).zIndex,transform:getComputedStyle(a).transform,translate:getComputedStyle(a).translate,sprite:+getComputedStyle(a.querySelector('.hani-office-sprite')).zIndex,name:+getComputedStyle(a.querySelector('.hani-office-name')).zIndex,status:+getComputedStyle(a.querySelector('.hani-office-status')).zIndex}));
   return {floor:map.dataset.floor,staff,ratio:staff.length?staff.filter(p=>p.shown).length/staff.length:null,boxes,outside:boxes.filter(b=>b.left<floor.left||b.right>floor.right||b.top<floor.top||b.bottom>floor.bottom),overlap:boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>overlap(a,b)).map(b=>[a.id,a.kind,b.id,b.kind])),mascotOverlap:boxes.filter(a=>mascots.some(b=>overlap(a,b))),spriteOverlap:boxes.flatMap(a=>sprites.filter(b=>a.id!==b.id&&overlap(a,b)).map(b=>[a.id,a.kind,b.id])),ownFaceOverlap:boxes.filter(a=>faces.some(b=>a.id===b.id&&overlap(a,b))),layers,writes:officeWrites};
  });
  for(const time of ['09:15:00','12:10:00','15:40:00'])for(const floor of ['1f','2f','3f','4f','5f']){
   await page.evaluate(time=>{officeClock=Date.parse('2026-10-22T'+time+'+09:00');officeLayoutCosts=[]},time);await page.locator(`[data-building-floor="${floor}"]`).click();
   await waitForOfficeLabels(page,floor);const r=await read();result.checks.push({width,theme,time,...r});
   const phoneLabels=await page.evaluate(readPhoneLabels);result.checks.at(-1).phoneLabels=phoneLabels;result.checks.at(-1).phoneCoverage={pills:phoneLabels.rows.filter(p=>p.mode==='pill'&&p.nameShown).length,dots:phoneLabels.rows.filter(p=>p.mode==='dot'&&p.nameShown).length,people:phoneLabels.rows.length,dotRatio:phoneLabels.rows.length?phoneLabels.rows.filter(p=>p.mode==='dot'&&p.nameShown).length/phoneLabels.rows.length:0};assertPhoneLabels(phoneLabels);
   const layout=await page.evaluate(()=>officeLayoutCosts.slice());assert.ok(layout.length>0);result.layout.push({width,theme,time,floor,unit:'ms/update (includes DOM)',samples:layout,mean:layout.reduce((a,b)=>a+b,0)/layout.length,max:Math.max(...layout)});
   if(r.ratio!==null){assert.ok(r.ratio>=(width===390?0:.85),`${width} ${theme} ${floor} ${time} visible ratio ${r.ratio}`);if(width===1440)assert.equal(r.ratio,1,'desktop keeps 100%');}assert.equal(r.overlap.length,0);assert.equal(r.outside.length,0);assert.equal(r.mascotOverlap.length,0);assert.deepEqual(r.writes,[]);
   assert.deepEqual(r.spriteOverlap,[],'labels avoid every other actor sprite');assert.deepEqual(r.ownFaceOverlap,[],'labels avoid their own face');
   for(const l of r.layers){assert.equal(l.actor,'auto');assert.equal(l.transform,'none');assert.equal(l.translate,'none');assert.ok(l.sprite<l.name&&l.name<l.status&&l.status<8,'props/plates/mascots < sprite < labels < foreground < character bubble');}
   if(width===390){for(const b of r.boxes)assert.ok(b.fontSize>=10,'name and status fonts >=10px');for(const p of r.staff.filter(p=>p.shown)){assert.ok([...p.text].length<=8);assert.ok(p.fontSize>=10);assert.doesNotMatch(p.text,/…|\.\.\./)}}
   if(time==='12:10:00'){const shot=path.join(out,`${width}-${theme}-${floor}.png`);await page.locator('#haniOfficeMap').screenshot({path:shot});result.screenshots.push(path.relative(root,shot))}
  }
  // Full panel keeps the original line; keyboard activation uses the same path.
  await page.locator('[data-building-floor="3f"]').click();await waitForOfficeLabels(page,'3f');const idleId=await page.evaluate(()=>[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].find(a=>!a.hidden&&a.dataset.action==='base-work'&&!a.dataset.event&&a.dataset.walking!=='true')?.dataset.person);assert.ok(idleId,'idle actor for full-line tap');const target=page.locator('#haniOfficeActors [data-person="'+idleId+'"]');await target.press('Enter');const panel=page.locator('.hani-office-character-bubble');await panel.waitFor({state:'visible'});assert.ok((await panel.textContent()).includes(await target.getAttribute('data-line')));
  if(theme==='light'&&[390,1440].includes(width)){
   if(width===390){await target.locator('.hani-office-name').click();await panel.waitFor({state:'visible'});assert.equal(await target.getAttribute('data-speaking'),'true','merged pill uses existing delegated click');assert.ok((await panel.textContent()).includes(await target.getAttribute('data-line')))}
   const costs=await page.evaluate(()=>{officeLayoutCosts=[];for(let i=0;i<30;i++)document.querySelector('[data-building-floor="3f"]').click();return officeLayoutCosts});result.layout.push({width,unit:'ms',samples:costs,mean:costs.reduce((a,b)=>a+b,0)/costs.length,max:Math.max(...costs)});
   const frames=await page.evaluate(async()=>{
    const layer=document.getElementById('haniOfficeActors'),all=[...layer.children],backups=all.map(a=>({a,hidden:a.hidden,style:a.getAttribute('style'),pose:a.dataset.pose,walking:a.dataset.walking}));
    // Stress fixture: exactly 21 staff sprites + two guests, independent of roster count.
    const stress=Array.from({length:23},(_,i)=>{const a=all[i%all.length].cloneNode(true);a.hidden=false;a.dataset.pose=i%2?'sitting':'standing';a.dataset.walking='false';a.style.left=(8+i%8*12)+'%';a.style.top=(30+Math.floor(i/8)*22)+'%';a.querySelectorAll('.hani-office-status,.hani-office-name').forEach(n=>n.hidden=true);layer.append(a);return a});all.forEach(a=>a.hidden=true);
    const sample=async disabled=>{stress.forEach(a=>{const sprite=a.querySelector('.hani-office-sprite');sprite.style.animation=disabled?'none':'';sprite.style.setProperty('animation-play-state','running','important')});const times=[];await new Promise(resolve=>{let previous;function tick(now){if(previous!==undefined)times.push(now-previous);previous=now;if(times.length===120)resolve();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});const sorted=[...times].sort((a,b)=>a-b);return {disabled,samples:times,mean:times.reduce((a,b)=>a+b)/times.length,p95:sorted[113],over25ms:times.filter(t=>t>25).length}};
    // Pause owner updates while measuring; sprites explicitly keep running.
    window.officeStress=true;const paused=document.getElementById('haniOfficeLive').dataset.paused;document.getElementById('haniOfficeLive').dataset.paused='true';stress.forEach(a=>a.querySelector('.hani-office-sprite').style.setProperty('animation-play-state','running','important'));
    const samples=[await sample(true),await sample(false)];stress.forEach(a=>a.remove());for(const b of backups){b.a.hidden=b.hidden;b.a.setAttribute('style',b.style||'');b.a.dataset.pose=b.pose;b.a.dataset.walking=b.walking}document.getElementById('haniOfficeLive').dataset.paused=paused||'false';window.officeStress=false;return {sprites:23,staff:21,guests:2,samples};
   });result.frames.push({width,...frames});
   await context.addInitScript(()=>{});await page.emulateMedia({reducedMotion:'reduce'});assert.ok(await page.evaluate(()=>[...document.querySelectorAll('#haniOfficeActors .hani-office-sprite')].every(n=>getComputedStyle(n).animationName==='none')));
   await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.getElementById('haniOfficeLive').dataset.paused='true');assert.ok(await page.evaluate(()=>[...document.querySelectorAll('#haniOfficeActors .hani-office-sprite')].every(n=>getComputedStyle(n).animationPlayState==='paused')));
  }
  result.writes.push(...await page.evaluate(()=>officeWrites));await context.close();
 }
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.writes,[]);assert.deepEqual(result.unavailable,[]);result.status='PASS';
}catch(e){result.status='FAIL';result.failure=e.stack;process.exitCode=1}finally{await browser?.close();await new Promise(r=>server?server.close(r):r());fs.writeFileSync(path.join(out,'../'+(process.env.HANI_OFFICE_BROWSER_TAG||'obr14')+'-browser.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,checks:result.checks.length,screenshots:result.screenshots.length,failure:result.failure}))}
