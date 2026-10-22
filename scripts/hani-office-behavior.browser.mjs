// Isolated actual office DOM. Run by Seoyun in the browser-enabled environment:
// node scripts/hani-office-behavior.browser.mjs <playwright/index.mjs> <msedge.exe>
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/office-behavior');fs.mkdirSync(out,{recursive:true});
const status={result:'running',checks:[],screenshots:[],errors:[],writes:[]};
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('<section class="hani-office-live"'),end=html.indexOf('</section>',start)+10;
assert.ok(start>0&&end>start);
const document=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/hani-office-live.css"><style>body{margin:0;padding:12px;font-family:'Malgun Gothic',sans-serif}.view{max-width:1350px;margin:auto}[hidden]{display:none!important}</style><div class="view active">${html.slice(start,end)}</div><script src="/hani-organization-hub.js"></script><script src="/hani-office-live.js"></script></html>`;
let browser,server;
try{
 const runtime=process.argv[2]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 const {chromium}=await import(pathToFileURL(runtime).href);
 browser=await chromium.launch({headless:true,executablePath:process.argv[3]||process.env.HANI_CHROME_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
 server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);
  if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(document);return}
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(path.resolve(root)+path.sep)||pathname.split('/').some(p=>p.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 for(const width of [390,884,1440])for(const reducedMotion of ['no-preference','reduce']){
  const context=await browser.newContext({viewport:{width,height:1100},reducedMotion});
  await context.addInitScript(()=>{
   window.officeClock=Date.parse('2026-10-22T14:00:00+09:00');const RealDate=Date;
   window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[officeClock]))}static now(){return officeClock}};
   window.officeWrites=[];for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(){officeWrites.push(method);throw Error('office storage write forbidden')};
  });
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>status.errors.push(e.message));await page.goto(origin);
  // The page clock is frozen, so poll from Node instead of waitForFunction's in-page timer.
  const until=async(fn,arg)=>{for(let i=0;i<300;i++){if(await page.evaluate(fn,arg))return;await page.waitForTimeout(100)}throw Error('office not ready: '+fn)};
  await until(()=>!!window.HaniBuildingScene?.scheduler&&document.querySelectorAll('[data-building-floor]').length===5);
  await page.evaluate(()=>{window.originalOfficeNodes=[...document.querySelector('#haniOfficeActors').children]});
  for(const floor of ['1f','2f','3f','4f','5f']){
   const times=await page.evaluate(floor=>{
    const base=Date.parse('2026-10-22T00:00:00+09:00'),scene=HaniBuildingScene;
    const event=scene.scheduler.plan('2026-10-22').find(e=>e.floors.includes(floor)&&e.people.some(p=>p.seat.anchor!==p.home.anchorId));
    return [...Array.from({length:31},(_,i)=>base+(14*3600+i)*1000),...['14:11:30','14:04:21','08:08:40','20:23:40'].map(t=>Date.parse('2026-10-22T'+t+'+09:00')),Date.parse('2026-10-23T01:57:24+09:00'),...(event?[base+(event.performStart+.5)*1000]:[])];
   },floor);
   for(const time of times){
    await page.evaluate(time=>{window.officeClock=time},time);await page.locator(`[data-building-floor="${floor}"]`).click();
    await until(f=>document.querySelector('#haniOfficeMap').dataset.floor===f&&document.querySelector('#haniOfficeMap').dataset.art==='floor',floor);
    const result=await page.evaluate(({floor,reduced})=>{
     const scene=HaniBuildingScene,snap=scene.scheduler.snapshot(new Date(),{reducedMotion:reduced}),errors=[];
     const actors=[...document.querySelectorAll('.hani-office-actor')].filter(a=>!a.hidden),map=document.querySelector('#haniOfficeMap'),rect=map.getBoundingClientRect();
     const list=actors.map(a=>({id:a.dataset.person,x:parseFloat(a.style.left)*1672/100,y:parseFloat(a.style.top)*941/100,walking:a.dataset.walking==='true'}));
     for(const p of list){const model=[...snap.entries,...snap.visitors].find(m=>m.id===p.id),actor=actors.find(a=>a.dataset.person===p.id),target=scene.art.anchors[model.targetAnchor];
      if(model.floor!==floor)errors.push('DOM floor '+p.id);
      const position=model.position||[model.seat.x,model.seat.y];if(Math.hypot(p.x-position[0]*16.72,p.y-position[1]*9.41)>2)errors.push('DOM/model foot '+p.id);
      if(actor.dataset.behavior!==model.state||actor.dataset.line!==model.line)errors.push('DOM/model state/speech '+p.id);
      if(model.state==='AT_PLACE'&&(!target||Math.hypot(p.x-target.x*16.72,p.y-target.y*9.41)>2))errors.push('place foot '+p.id);
      // Guests keep their own reception lines; staff speak the place card's lines.
      const card=scene.places.find(c=>c.id===model.placeId);if(model.state==='AT_PLACE'){
       const pool=card?[...card.at,...(card.atByPerson?.[p.id]||[])]:[];
       const groupOk=model.groupIds?.length&&model.groupIds.filter(id=>id!==p.id).every(id=>actor.dataset.line.includes(scene.canon.people.find(p=>p.id===id)?.name||'__missing_person__'))&&actor.dataset.line.includes(card.at[0].split('에서')[0]+'에서');
       if(model.visitor?actor.dataset.line!==model.at:card&&!(pool.includes(actor.dataset.line)||groupOk))errors.push('place speech '+p.id);
      }
      if(p.walking&&!(/가는 중|돌아가는 중/.test(actor.dataset.line)||model.visitor&&model.state==='RETURNING'&&actor.dataset.line==='안녕히 계세요~'))errors.push('walking speech '+p.id);
     }
     for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j];if(Math.hypot(a.x-b.x,a.y-b.y)<(a.walking||b.walking?24:20)-.01)errors.push('DOM proximity '+a.id+'/'+b.id)}
     if(!originalOfficeNodes.every((n,i)=>document.querySelector('#haniOfficeActors').children[i]===n))errors.push('actor identity changed');
     return {errors,actors:list.length,map:{width:rect.width,height:rect.height},writes:officeWrites};
    },{floor,reduced:reducedMotion==='reduce'});
    assert.deepEqual(result.errors,[],JSON.stringify({width,reducedMotion,floor,time}));assert.deepEqual(result.writes,[]);status.checks.push({width,reducedMotion,floor,time,actors:result.actors});
   }
   const screenshot=`behavior-${width}-${floor}-${reducedMotion}.png`;await page.locator('#haniOfficeLive').screenshot({path:path.join(out,screenshot)});status.screenshots.push(screenshot);
  }
  await context.close();
 }
 assert.deepEqual(status.errors,[]);status.result='pass';
}catch(error){status.result=/EPERM|EACCES|spawn/.test(error.message)?'blocked':'fail';status.errors.push(error.stack);process.exitCode=1}
finally{fs.writeFileSync(path.join(out,'behavior-browser.json'),JSON.stringify(status,null,2));await browser?.close();await new Promise(resolve=>server?server.close(resolve):resolve())}
console.log(JSON.stringify(status));
