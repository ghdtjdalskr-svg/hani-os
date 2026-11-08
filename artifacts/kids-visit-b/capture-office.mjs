// Isolated real office DOM + actual runtime/assets; no app login or production data.
// node artifacts/kids-visit-b/capture-office.mjs [playwright/index.mjs] [msedge.exe]
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {fileURLToPath,pathToFileURL} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('<section class="hani-office-live"'),end=html.indexOf('</section>',start)+10;assert.ok(start>0&&end>start);
const document=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/hani-office-live.css"><style>body{margin:0;padding:12px;font-family:'Malgun Gothic',sans-serif}.view{max-width:1350px;margin:auto}[hidden]{display:none!important}</style><div id="app"><div class="view active">${html.slice(start,end)}</div></div><script src="/hani-organization-hub.js"></script><script src="/hani-office-live.js"></script></html>`;
const status={result:'running',date:'2026-11-08',source:'local actual office section/runtime/assets, isolated fresh context',checks:[],errors:[],writes:[]};let browser,server;
try{
 const runtime=process.argv[2]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 const {chromium}=await import(pathToFileURL(runtime).href);
 browser=await chromium.launch({headless:true,executablePath:process.argv[3]||process.env.HANI_CHROME_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 status.browser=browser.version();
 server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(document);return}
  const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)||pathname.split('/').some(s=>s.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'});
  await context.addInitScript(()=>{
   window.officeClock=Date.parse('2026-11-08T10:00:00+09:00');const RealDate=Date;window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[window.officeClock]))}static now(){return window.officeClock}};
   window.HaniOfficePresence={chairman:'active'};window.officeWrites=[];for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(){officeWrites.push(method);throw Error('isolated office persistence forbidden')};
  });await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>status.errors.push(e.message));await page.goto(origin);
  const until=async(fn,arg)=>{for(let i=0;i<200;i++){if(await page.evaluate(fn,arg))return;await page.waitForTimeout(100)}throw Error('office readiness timeout: '+fn)};
  await until(()=>!!window.HaniBuildingScene?.scheduler&&document.querySelectorAll('[data-building-floor]').length===5);
  await page.locator('[data-building-floor="4f"]').click();
  const samples=await page.evaluate(()=>{const scene=HaniBuildingScene,base=Date.parse('2026-11-08T00:00:00+09:00'),seen=new Map();for(let t=36000;t<36180;t+=.5){const now=new Date(base+t*1000),snapshot=scene.snapshot(now,{chairmanPresent:true}),kids=scene.residents.companionSnapshot(now,snapshot).filter(p=>p.kid),p=kids.find(p=>p.id==='kid-suyeon');if(p){const name=p.artPose||p.pose;if(!seen.has(name))seen.set(name,{name,time:base+t*1000,floor:p.floor})}}return [...seen.values()].filter(p=>['wave','seat-b','cling','walk-a'].includes(p.name))});
  assert.ok(samples.length>=2,'natural weekend samples found');
  for(const sample of samples){
   await page.evaluate(time=>{window.officeClock=time},sample.time);await page.locator(`[data-building-floor="${sample.floor}"]`).click();
   await until(()=>[...document.querySelectorAll('[data-person^="kid-"]')].filter(p=>!p.hidden).length===2);
   await page.waitForTimeout(400);await page.evaluate(()=>document.fonts.ready);
   const file=`office-${width}-${sample.name}.png`;await page.locator('#haniOfficeLive').screenshot({path:path.join(out,file)});
   const check=await page.evaluate(()=>({width:innerWidth,clock:new Date().toISOString(),overflow:document.documentElement.scrollWidth>innerWidth,kids:[...document.querySelectorAll('[data-person^="kid-"]')].filter(p=>!p.hidden).map(p=>({id:p.dataset.person,pose:p.dataset.pose,facing:p.dataset.facing,source:p.querySelector('.hani-office-sprite').style.backgroundImage,frame:p.querySelector('.hani-office-sprite').style.backgroundPosition,position:p.officeResidentState.position})),writes:officeWrites}));
   assert.equal(check.kids.length,2);assert.ok(check.kids.every(p=>p.source.includes('kids-v2.webp')));assert.deepEqual(check.writes,[]);status.checks.push({file,...check});
  }await context.close();
 }assert.deepEqual(status.errors,[]);status.result='pass';
}catch(error){status.result=/EPERM|EACCES|spawn/.test(error.message)?'blocked':'fail';status.errors.push(error.stack);process.exitCode=1}
finally{fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(status,null,2)+'\n');await browser?.close();await new Promise(resolve=>server?server.close(resolve):resolve())}
console.log(JSON.stringify({result:status.result,browser:status.browser,screenshots:status.checks.map(c=>c.file),errors:status.errors.map(e=>e.slice(0,400))}));
