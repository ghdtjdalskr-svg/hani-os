// 서윤 실행 전용: node scripts/hani-office-obr15.browser.mjs [playwright/index.mjs] [msedge.exe]
// Actual office owners/assets, fixture clock and presence override only. No app writes.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {untilOffice,waitForOfficeLabels} from './hani-office-label-browser-ready.mjs';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/office-behavior/obr15-shots');
fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('<section class="hani-office-live"'),end=html.indexOf('</section>',start)+10;assert.ok(start>0&&end>start);
const document=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/hani-office-live.css"><link rel="stylesheet" href="/hani-design-system.css"><link rel="stylesheet" href="/hani-desk-mascots.css"><style>body{margin:0;padding:12px;font-family:'Malgun Gothic',sans-serif}.view{max-width:1350px;margin:auto}[hidden]{display:none!important}</style><div id="app"><div class="view active">${html.slice(start,end)}</div></div><script src="/hani-organization-hub.js"></script><script src="/hani-office-live.js"></script><script src="/hani-desk-mascots.js"></script></html>`;
const result={status:'running',checks:[],screenshots:[],errors:[],writes:[],network:[]};let browser,server;
try{
 const runtime=process.argv[2]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 const {chromium}=await import(pathToFileURL(runtime).href);browser=await chromium.launch({headless:true,executablePath:process.argv[3]||process.env.HANI_CHROME_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});result.browser=await browser.version();
 server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(document)}
  const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root)||pathname.split('/').some(p=>p.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 for(const width of [390,1440])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'});
  await context.addInitScript(()=>{
   window.officeClock=Date.parse('2026-10-22T09:00:00+09:00');const RealDate=Date;window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[officeClock]))}static now(){return officeClock}};
   window.HaniOfficePresence={chairman:'absent'};window.officeWrites=[];
   for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(){officeWrites.push(method);throw Error('forbidden storage write')};
  });
  await context.route('**/*',r=>{const req=r.request();if(new URL(req.url()).origin!==origin||!['GET','HEAD'].includes(req.method())){result.network.push({url:req.url(),method:req.method()});return r.abort()}return r.continue()});
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));await page.goto(origin);
  await untilOffice(page,()=>window.HaniBuildingScene?.scheduler&&document.querySelectorAll('[data-building-floor]').length===5);
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;window.officeActorNodes=[...document.querySelector('#haniOfficeActors').children]},theme);
  const show=async(time,presence)=>{await page.evaluate(({time,presence})=>{officeClock=time;HaniOfficePresence={chairman:presence}}, {time,presence});await page.locator('[data-building-floor="4f"]').click();await waitForOfficeLabels(page,'4f')};
  const arrival=await page.evaluate(()=>{
   const s=HaniBuildingScene.scheduler,day='2026-10-22';
   for(let sec=32400;sec<33000;sec++){const stamp=Date.parse(day+'T00:00:00+09:00')+sec*1000,snap=s.snapshot(new Date(stamp),{chairmanPresent:true,chairmanSince:stamp,chairmanArrivalAt:stamp}),g=snap.entries.filter(p=>p.behaviorKind==='chairman-greeting');if(g.length)return {stamp,people:g.map(p=>({id:p.id,line:p.line,until:p.greetingUntil}))}}throw Error('no greeting fixture');
  });
  await show(arrival.stamp-1,'absent');assert.equal(await page.locator('[data-person="seongmin"]').first().isVisible(),false);
  await show(arrival.stamp,'active');
  for(const p of arrival.people){const actor=page.locator('#haniOfficeActors [data-person="'+p.id+'"]');assert.equal(await actor.getAttribute('data-line'),p.line);assert.equal(await actor.getAttribute('data-pose'),'standing');assert.equal(await actor.getAttribute('data-walking'),'false');}
  await waitForOfficeLabels(page,'4f');
  let shot=path.join(out,`${width}-${theme}-arrival.png`);await page.locator('#haniOfficeMap').screenshot({path:shot});result.screenshots.push(path.relative(root,shot));
  await show(Math.max(...arrival.people.map(p=>p.until))+1,'active');for(const p of arrival.people)assert.notEqual(await page.locator('#haniOfficeActors [data-person="'+p.id+'"]') .getAttribute('data-line'),p.line);
  // Brief absence never replays the greeting; >=10 minute absence does.
  await show(arrival.stamp+11000,'absent');await show(arrival.stamp+12000,'active');for(const p of arrival.people)assert.notEqual(await page.locator('#haniOfficeActors [data-person="'+p.id+'"]') .getAttribute('data-line'),p.line);
  const report=await page.evaluate(()=>{
   const s=HaniBuildingScene.scheduler,o={chairmanPresent:true},d='2026-10-22',f=s.plan(d,o),e=s.blockPlan(d,0,f,o).find(e=>e.report&&e.people[0].home.floor!=='4f');if(!e)throw Error('no cross-floor report');return {id:e.id,staff:e.report,stamp:Date.parse(d+'T00:00:00+09:00')+(e.performStart+1)*1000,end:Date.parse(d+'T00:00:00+09:00')+(e.end+1)*1000,home:e.people[0].home.anchorId,target:e.people[0].seat.anchor};
  });
  await show(report.stamp,'active');const staff=page.locator('#haniOfficeActors [data-person="'+report.staff+'"]'),chair=page.locator('#haniOfficeActors [data-person="seongmin"]');
  assert.equal(await staff.getAttribute('data-partner'),'seongmin');assert.equal(await chair.getAttribute('data-partner'),report.staff);assert.equal(await staff.getAttribute('data-slot'),report.target);assert.equal(await chair.getAttribute('data-slot'),'ceo-reserved');assert.notEqual(await staff.getAttribute('data-facing'),await chair.getAttribute('data-facing'));assert.match(await staff.getAttribute('data-line'),/회장님께 .+ 보고 중/);assert.equal(await chair.getAttribute('data-line'),'좋아요, 이대로 갑시다');
  const labels=await page.evaluate(()=>[...document.querySelectorAll('#haniOfficeActors [data-partner]:not([data-partner=""])')].filter(a=>!a.hidden).map(a=>{const n=a.querySelector('.hani-office-status'),r=n.getBoundingClientRect();return {id:a.dataset.person,full:a.dataset.line,text:n.textContent,shown:getComputedStyle(n).visibility!=='hidden',rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},rotate:getComputedStyle(a.querySelector('.hani-office-sprite')).rotate}}));
  assert.equal(labels.length,2);assert.ok(labels.every(p=>p.shown),'both report lines visible');if(width===390)assert.ok(labels.every(p=>[...p.text].length<=8));const [a,b]=labels.map(p=>p.rect);assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,'dialogue label overlap');
  const safety=await page.evaluate(()=>{
   const map=document.getElementById('haniOfficeMap'),floor=map.getBoundingClientRect(),visible=n=>getComputedStyle(n).visibility!=='hidden'&&getComputedStyle(n).display!=='none'&&!n.hidden,overlap=(a,b)=>a.left<b.right-.1&&a.right>b.left+.1&&a.top<b.bottom-.1&&a.bottom>b.top+.1;
   const boxes=[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden).flatMap(a=>['name','status'].map(k=>a.querySelector('.hani-office-'+k)).filter(visible).map(n=>n.getBoundingClientRect())),mascots=[...map.querySelectorAll('.hani-desk-mascots:not([hidden]) .hani-desk-mascot[data-ready="true"]')].filter(visible).map(n=>n.getBoundingClientRect());
   return {outside:boxes.filter(b=>b.left<floor.left||b.right>floor.right||b.top<floor.top||b.bottom>floor.bottom).length,overlap:boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>overlap(a,b))).length,mascotOverlap:boxes.filter(a=>mascots.some(b=>overlap(a,b))).length};
  });assert.deepEqual(safety,{outside:0,overlap:0,mascotOverlap:0});
  shot=path.join(out,`${width}-${theme}-report.png`);await page.locator('#haniOfficeMap').screenshot({path:shot});result.screenshots.push(path.relative(root,shot));
  await show(report.end,'active');assert.notEqual(await chair.getAttribute('data-partner'),report.staff);
  await show(report.stamp,'absent');assert.equal(await chair.isVisible(),false);assert.notEqual(await staff.getAttribute('data-partner'),'seongmin');
  assert.ok(await page.evaluate(()=>officeActorNodes.every((a,i)=>a===document.querySelector('#haniOfficeActors').children[i])),'persistent actor identity');
  result.checks.push({width,theme,arrival,report,labels,safety});result.writes.push(...await page.evaluate(()=>officeWrites));await context.close();
 }
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.writes,[]);assert.deepEqual(result.network,[]);result.status='PASS';
}catch(e){result.status='FAIL';result.failure=e.stack;process.exitCode=1}finally{await browser?.close();await new Promise(r=>server?server.close(r):r());fs.writeFileSync(path.join(out,'../'+(process.env.HANI_OFFICE_BROWSER_TAG||'obr15')+'-browser.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,checks:result.checks.length,screenshots:result.screenshots.length,failure:result.failure}))}
