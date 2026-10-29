// 서윤 실행 전용: node scripts/hani-office-chairman-234.browser.mjs [playwright/index.mjs] [msedge.exe]
// 실제 office DOM/loader/renderer, 가상 시각. 로그인/Cloud는 실행하지 않는 격리 fixture.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/office-behavior');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('<section class="hani-office-live"'),end=html.indexOf('</section>',start)+10;
assert.ok(start>0&&end>start);
const fixture=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/hani-office-live.css"><style>body{margin:0;padding:12px}.view{max-width:1350px;margin:auto}[hidden]{display:none!important}</style><div id="app"><div class="view active">${html.slice(start,end)}</div></div><script src="/hani-organization-hub.js"></script><script src="/hani-office-live.js"></script></html>`;
const result={status:'running',checks:[],screenshots:[],errors:[],writes:[]};let browser,server;
try{
 const runtime=process.argv[2]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 const {chromium}=await import(pathToFileURL(runtime).href);
 browser=await chromium.launch({headless:true,executablePath:process.argv[3]||process.env.HANI_CHROME_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
 server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);
  if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fixture);return}
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(path.resolve(root)+path.sep)||pathname.split('/').some(p=>p.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 for(const width of [390,1440])for(const locked of [false,true]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await context.addInitScript(({locked})=>{
   window.officeClock=Date.parse('2026-10-22T09:00:00+09:00');const RealDate=Date;
   window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[officeClock]))}static now(){return officeClock}};
   window.officeWrites=[];for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(){officeWrites.push(method);throw Error('office storage forbidden')};
   if(locked)new MutationObserver((_,observer)=>{const app=document.getElementById('app');if(app){app.classList.add('login-locked');observer.disconnect()}}).observe(document,{childList:true,subtree:true});
  },{locked});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));await page.goto(origin);
  const until=async(fn)=>{for(let i=0;i<150;i++){if(await page.evaluate(fn))return;await page.waitForTimeout(100)}throw Error('office ready timeout')};
  await until(()=>!!window.HaniBuildingScene?.scheduler&&document.querySelectorAll('[data-building-floor]').length===5);
  await page.locator('[data-building-floor="4f"]').click();
  await until(()=>document.getElementById('haniOfficeMap').dataset.floor==='4f');
  if(!locked)await until(()=>document.querySelector('#haniOfficeActors [data-person="seongmin"]').dataset.avatar==='v2');
  const read=()=>page.evaluate(()=>{const actor=document.querySelector('#haniOfficeActors [data-person="seongmin"]');return {visible:!!actor&&!actor.hidden,sprite:window.HaniBuildingScene.scheduler.identity.seongmin.spriteId,image:actor?.querySelector('.hani-office-sprite').style.backgroundImage,floor:document.getElementById('haniOfficeMap').dataset.floor,anchor:actor?.officeAnchor,writes:officeWrites}});
  const initial=await read();assert.equal(initial.visible,!locked);assert.equal(initial.sprite,'seongmin');assert.equal(initial.floor,'4f');assert.deepEqual(initial.writes,[]);
  if(!locked){assert.match(initial.image,/seongmin\.webp/);assert.equal(initial.anchor,'ceo-reserved')}
  const shot=path.join(out,`obr13-${width}-${locked?'locked':'present'}.png`);await page.screenshot({path:shot,fullPage:true});result.screenshots.push(path.relative(root,shot));
  if(!locked){
   // Programmatic click reuses selectFloor; it emits no presence input event.
   await page.evaluate(()=>{officeClock+=600001;document.querySelector('[data-building-floor="4f"]').click()});
   await until(()=>document.querySelector('#haniOfficeActors [data-person="seongmin"]').hidden);
   assert.equal((await read()).visible,false);
   await page.evaluate(()=>{document.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));document.querySelector('[data-building-floor="4f"]').click()});
   assert.equal((await read()).visible,true);
   await page.evaluate(()=>{document.getElementById('app').classList.add('login-locked');document.querySelector('[data-building-floor="4f"]').click()});
   assert.equal((await read()).visible,false);
  }
  result.checks.push({width,locked,initial,idleExpiry:locked?'N/A':'PASS',reentry:locked?'N/A':'PASS',lock: 'PASS'});result.writes.push(...await page.evaluate(()=>officeWrites));await context.close();
 }
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.writes,[]);result.status='PASS';
}catch(error){result.status='FAIL';result.error=error.stack;process.exitCode=1}
finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'obr13-browser.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))}
