// 서윤 실행 전용: node scripts/hani-office-obr15.browser.mjs [playwright/index.mjs] [msedge.exe]
// Actual office owners/assets, fixture clock and presence override only. No app writes.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {untilOffice,waitForOfficeLabels} from './hani-office-label-browser-ready.mjs';
import {readPhoneLabels,assertPhoneLabels} from './hani-office-obr18-browser-geometry.mjs';
import {readStationarySprites} from './hani-office-obr21-geometry.mjs';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/office-behavior/'+(process.env.HANI_OFFICE_BROWSER_TAG?process.env.HANI_OFFICE_BROWSER_TAG+'-shots':'obr15-shots'));
fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('<section class="hani-office-live"'),end=html.indexOf('</section>',start)+10;assert.ok(start>0&&end>start);
const document=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/hani-office-live.css"><link rel="stylesheet" href="/hani-design-system.css"><link rel="stylesheet" href="/hani-desk-mascots.css"><style>body{margin:0;padding:12px;font-family:'Malgun Gothic',sans-serif}.view{max-width:1350px;margin:auto}[hidden]{display:none!important}</style><div id="app"><div class="view active">${html.slice(start,end)}</div></div><script src="/hani-organization-hub.js"></script><script src="/hani-office-live.js"></script><script src="/hani-desk-mascots.js"></script></html>`;
const result={status:'running',checks:[],reportSprites:[],loungeChecks:[],screenshots:[],errors:[],writes:[],network:[]};let browser,server;
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
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;window.officeActorNodes=[...document.querySelector('#haniOfficeActors').children];window.officeLabelNodes=officeActorNodes.flatMap(a=>['name','status'].map(k=>a.querySelector('.hani-office-'+k)))},theme);
  const show=async(time,presence,floor='4f')=>{await page.evaluate(({time,presence})=>{officeClock=time;HaniOfficePresence={chairman:presence}}, {time,presence});await page.locator('[data-building-floor="'+floor+'"]').click();await waitForOfficeLabels(page,floor)};
  const pair=await page.evaluate(()=>{
   const s=HaniBuildingScene.scheduler,d='2026-10-22';
   for(let sec=32400;sec<68400;sec+=5){const stamp=Date.parse(d+'T00:00:00+09:00')+sec*1000,snap=s.snapshot(new Date(stamp),{chairmanPresent:false}),p=snap.entries.find(p=>p.deskPartner&&p.id!=='seongmin'&&p.deskPartner!=='seongmin');if(p)return {stamp,floor:p.floor,ids:[p.id,p.deskPartner]}}throw Error('no ordinary paired-dialogue fixture');
  });
  await show(pair.stamp,'absent',pair.floor);const pairLabels=await page.evaluate(readPhoneLabels);assertPhoneLabels(pairLabels);
  const pairVisibility=await page.evaluate(ids=>ids.map(id=>{const a=document.querySelector('#haniOfficeActors [data-person="'+id+'"]'),n=a.querySelector(matchMedia('(max-width:600px)').matches?'.hani-office-name':'.hani-office-status');return {id,shown:!a.hidden&&a.dataset.labelMode!=='dot'&&getComputedStyle(n).visibility!=='hidden',line:a.dataset.line}}),pair.ids);
  assert.ok(pairVisibility.every(p=>p.shown),'both ordinary dialogue lines visible');
  const arrival=await page.evaluate(()=>{
   const s=HaniBuildingScene.scheduler,day='2026-10-22';
   for(let sec=32400;sec<33000;sec++){const stamp=Date.parse(day+'T00:00:00+09:00')+sec*1000,snap=s.snapshot(new Date(stamp),{chairmanPresent:true,chairmanSince:stamp,chairmanArrivalAt:stamp}),g=snap.entries.filter(p=>p.behaviorKind==='chairman-greeting');if(g.length)return {stamp,people:g.map(p=>({id:p.id,line:p.line,until:p.greetingUntil}))}}throw Error('no greeting fixture');
  });
  await show(arrival.stamp-1,'absent');assert.equal(await page.locator('[data-person="seongmin"]').first().isVisible(),false);
  await show(arrival.stamp,'active');
  for(const p of arrival.people){const actor=page.locator('#haniOfficeActors [data-person="'+p.id+'"]');assert.equal(await actor.getAttribute('data-line'),p.line);assert.equal(await actor.getAttribute('data-pose'),'standing');assert.equal(await actor.getAttribute('data-walking'),'false');}
  await waitForOfficeLabels(page,'4f');
  const arrivalLabels=await page.evaluate(readPhoneLabels);assertPhoneLabels(arrivalLabels);
  let shot=path.join(out,`${width}-${theme}-arrival.png`);await page.locator('#haniOfficeMap').screenshot({path:shot});result.screenshots.push(path.relative(root,shot));
  await show(Math.max(...arrival.people.map(p=>p.until))+1,'active');for(const p of arrival.people)assert.notEqual(await page.locator('#haniOfficeActors [data-person="'+p.id+'"]') .getAttribute('data-line'),p.line);
  // Brief absence never replays the greeting; >=10 minute absence does.
  await show(arrival.stamp+11000,'absent');await show(arrival.stamp+12000,'active');for(const p of arrival.people)assert.notEqual(await page.locator('#haniOfficeActors [data-person="'+p.id+'"]') .getAttribute('data-line'),p.line);
  const report=await page.evaluate(()=>{
   const s=HaniBuildingScene.scheduler,o={chairmanPresent:true},d='2026-10-22',f=s.plan(d,o),e=s.blockPlan(d,0,f,o).find(e=>e.report&&e.people[0].home.floor!=='4f');if(!e)throw Error('no cross-floor report');return {id:e.id,staff:e.report,stamp:Date.parse(d+'T00:00:00+09:00')+(e.performStart+1)*1000,end:Date.parse(d+'T00:00:00+09:00')+(e.end+1)*1000,home:e.people[0].home.anchorId,target:e.people[0].seat.anchor};
  });
  await show(report.stamp,'active');const staff=page.locator('#haniOfficeActors [data-person="'+report.staff+'"]'),chair=page.locator('#haniOfficeActors [data-person="seongmin"]');
  assert.equal(await staff.getAttribute('data-partner'),'seongmin');assert.equal(await chair.getAttribute('data-partner'),report.staff);assert.equal(await staff.getAttribute('data-slot'),report.target);assert.equal(await chair.getAttribute('data-slot'),'ceo-reserved');assert.notEqual(await staff.getAttribute('data-facing'),await chair.getAttribute('data-facing'));assert.match(await staff.getAttribute('data-line'),/회장님께 .+ 보고 중/);assert.equal(await chair.getAttribute('data-line'),'좋아요, 이대로 갑시다');
  const labels=await page.evaluate(()=>[...document.querySelectorAll('#haniOfficeActors [data-partner]:not([data-partner=""])')].filter(a=>!a.hidden).map(a=>{const phone=matchMedia('(max-width:600px)').matches,n=a.querySelector(phone?'.hani-office-name':'.hani-office-status'),r=n.getBoundingClientRect();return {id:a.dataset.person,full:a.dataset.line,text:phone?a.querySelector('.hani-office-compact-line').textContent.slice(3):n.textContent,shown:getComputedStyle(n).visibility!=='hidden'&&getComputedStyle(n).display!=='none'&&a.dataset.labelMode!=='dot',rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},rotate:getComputedStyle(a.querySelector('.hani-office-sprite')).rotate}}));
  assert.equal(labels.length,2);assert.ok(labels.every(p=>p.shown),'both report lines visible '+width+' '+theme+' '+JSON.stringify(labels.map(p=>({id:p.id,shown:p.shown,text:p.text,rect:p.rect}))));if(width===390)assert.ok(labels.every(p=>[...p.text].length<=6));const [a,b]=labels.map(p=>p.rect);assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,'dialogue label overlap');
  const safety=await page.evaluate(()=>{
   const map=document.getElementById('haniOfficeMap'),floor=map.getBoundingClientRect(),visible=n=>getComputedStyle(n).visibility!=='hidden'&&getComputedStyle(n).display!=='none'&&!n.hidden,overlap=(a,b)=>a.left<b.right-.1&&a.right>b.left+.1&&a.top<b.bottom-.1&&a.bottom>b.top+.1;
   const actors=[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden),boxes=actors.flatMap(a=>['name','status'].map(k=>a.querySelector('.hani-office-'+k)).filter(visible).map(n=>({id:a.dataset.person,left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right,top:n.getBoundingClientRect().top,bottom:n.getBoundingClientRect().bottom}))),mascots=[...map.querySelectorAll('.hani-desk-mascots:not([hidden]) .hani-desk-mascot[data-ready="true"]')].filter(visible).map(n=>n.getBoundingClientRect());
   const sprites=actors.map(a=>({id:a.dataset.person,rect:a.querySelector('.hani-office-sprite').getBoundingClientRect()})),faces=actors.map(a=>{const r=a.querySelector('.hani-office-sprite').getBoundingClientRect();return {id:a.dataset.person,rect:{left:r.left,top:r.top,right:r.right,bottom:r.top+r.height*.65}}});
   return {outside:boxes.filter(b=>b.left<floor.left||b.right>floor.right||b.top<floor.top||b.bottom>floor.bottom).length,overlap:boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>overlap(a,b))).length,mascotOverlap:boxes.filter(a=>mascots.some(b=>overlap(a,b))).length,spriteOverlap:boxes.filter(a=>sprites.some(b=>a.id!==b.id&&overlap(a,b.rect))).length,ownFaceOverlap:boxes.filter(a=>faces.some(b=>a.id===b.id&&overlap(a,b.rect))).length};
  });assert.deepEqual(safety,{outside:0,overlap:0,mascotOverlap:0,spriteOverlap:0,ownFaceOverlap:0});
  const reportLabels=await page.evaluate(readPhoneLabels);assertPhoneLabels(reportLabels);
  if(width===390)assert.deepEqual(reportLabels.spritePairs.filter(pair=>pair.includes('seongmin')&&pair.includes(report.staff)),[],'chairman/reporter sprites do not overlap');
  if(width===390){
   const reports=await page.evaluate(()=>{const s=HaniBuildingScene.scheduler,d='2026-10-22',o={chairmanPresent:true};return s.blockPlan(d,0,s.plan(d,o),o).filter(e=>e.report).flatMap(e=>[e.performStart+.001,e.performEnd-.001].map(sec=>({staff:e.report,stamp:Date.parse(d+'T00:00:00+09:00')+sec*1000})))});
   for(const r of reports){await show(r.stamp,'active');const geometry=await page.evaluate(readPhoneLabels);assert.deepEqual(geometry.spritePairs.filter(pair=>pair.includes('seongmin')&&pair.includes(r.staff)),[],'every report endpoint: chairman/reporter sprites do not overlap');result.reportSprites.push({width,theme,...r,spritePairs:geometry.spritePairs})}
   await show(report.stamp,'active');
  }
  shot=path.join(out,`${width}-${theme}-report.png`);await page.locator('#haniOfficeMap').screenshot({path:shot});result.screenshots.push(path.relative(root,shot));
  await show(report.end,'active');assert.notEqual(await chair.getAttribute('data-partner'),report.staff);
  await show(report.stamp,'absent');assert.equal(await chair.isVisible(),false);assert.notEqual(await staff.getAttribute('data-partner'),'seongmin');
  if(width===390)for(const presence of ['absent','active']){
   // Cover each distinct stationary seat pair, plus old dense-scene times.
   // Model selection cannot PASS the check: actual rendered sprite rects must.
   const stamps=await page.evaluate(presence=>{
    const s=HaniBuildingScene.scheduler,d='2026-10-22',o={chairmanPresent:presence==='active'},base=Date.parse(d+'T00:00:00+09:00'),f=s.plan(d,o),out=s.blockPlan(d,0,f,o),times=new Set([32895,33678,34360,36012,33300,43800,56400]);
    for(const e of [...f,...out])for(const t of e.people)for(const sec of [e.start,e.end,...[...t.out,...t.back].flatMap(l=>[l.start,l.end])])if(sec>=32400&&sec<68400)times.add(sec);
    const ticks=[...times].sort((a,b)=>a-b),seen=new Set(),chosen=new Set([32895,33678,34360,36012,33300,43800,56400]);
    for(let i=1;i<ticks.length;i++){const sec=(ticks[i-1]+ticks[i])/2,snap=s.snapshot(new Date(base+sec*1000),o),people=[...snap.entries,...snap.visitors].filter(p=>p.floor==='1f'&&!p.walking);
     for(let j=0;j<people.length;j++)for(const q of people.slice(j+1)){const p=people[j];if(p.state==='AT_HOME'&&q.state==='AT_HOME'&&!p.visitor&&!q.visitor)continue;const key=[p.id,p.seat.anchor,q.id,q.seat.anchor].join('|');if(!seen.has(key)){seen.add(key);chosen.add(sec)}}
    }return [...chosen].map(sec=>base+sec*1000);
   },presence);
   for(const stamp of stamps){await show(stamp,presence,'1f');const geometry=await page.evaluate(readStationarySprites);result.loungeChecks.push({width,theme,presence,stamp,...geometry});assert.deepEqual(geometry.collisions,[],'1F new behavior stationary phone sprites do not overlap (216/221 catalog and fixed homes excluded; catalogExclusions reported) '+JSON.stringify({presence,stamp,geometry}))}
   await show(Date.parse('2026-10-22T12:10:00+09:00'),presence,'1f');
   shot=path.join(out,`${width}-${theme}-1f-${presence}.png`);await page.locator('#haniOfficeMap').screenshot({path:shot});result.screenshots.push(path.relative(root,shot));
  }
  assert.ok(await page.evaluate(()=>officeActorNodes.every((a,i)=>a===document.querySelector('#haniOfficeActors').children[i])),'persistent actor identity');
  assert.ok(await page.evaluate(()=>officeActorNodes.flatMap(a=>['name','status'].map(k=>a.querySelector('.hani-office-'+k))).every((n,i)=>n===officeLabelNodes[i])),'persistent name/status identity and parent');
  result.checks.push({width,theme,pair,pairLabels,pairVisibility,arrival,report,labels,safety,arrivalLabels,reportLabels});result.writes.push(...await page.evaluate(()=>officeWrites));await context.close();
 }
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.writes,[]);assert.deepEqual(result.network,[]);result.status='PASS';
}catch(e){result.status='FAIL';result.failure=e.stack;process.exitCode=1}finally{await browser?.close();await new Promise(r=>server?server.close(r):r());fs.writeFileSync(path.join(out,'../'+(process.env.HANI_OFFICE_BROWSER_TAG||'obr15')+'-browser.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,checks:result.checks.length,screenshots:result.screenshots.length,failure:result.failure}))}
