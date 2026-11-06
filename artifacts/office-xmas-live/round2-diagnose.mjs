// Test-only office harness: actual owner/CSS/art; fixed clock, no application storage.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {assets} from '../../scripts/hani-office-v2-fixture.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const table=JSON.parse(read('assets/data/office-actions-221.json'));
const manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.webp')?'image/webp':'application/octet-stream');fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 const base=`http://127.0.0.1:${server.address().port}/`,results=[];
 for(const [width,height]of [[1280,900],[390,844]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'no-preference'});
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await page.setContent(`<base href="${base}"><link rel="stylesheet" href="hani-office-live.css"><style>body{margin:0;padding:16px;font-family:Arial,sans-serif;background:#faf8f5}.hani-office-live{padding:0;border:0}h1{font-size:18px}p{font-size:13px}</style><h1>크리스마스 사무실 · 2026-12-24 20:00 KST</h1><div id="app"><section class="view active"><div class="hani-office-live" id="haniOfficeLive"><div class="hani-building-tabs"></div><div class="hani-office-scroll"><div class="hani-office-map" id="haniOfficeMap"><img class="hani-office-background"><img class="hani-office-foreground"><img class="hani-office-foreground"><img class="hani-office-foreground"><div id="haniOfficeActors"></div></div></div>${['haniOfficeConversation','haniOfficeMeeting','haniOfficeParticipants','haniOfficeQuestions','haniOfficeMeetingOpen','haniOfficeReturn','haniOfficeCaseState','haniOfficeReportLink','haniOfficeMeetingTitle','haniOfficeMeetingMeta','agentCaseDetail'].map(id=>`<div id="${id}" hidden></div>`).join('')}</div></section></div>`);
  await page.evaluate(({assets,table,manifest})=>{
   const RealDate=Date;window.xmasClock=RealDate.parse('2026-12-24T20:00:00+09:00');
   window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[window.xmasClock]))}static now(){return window.xmasClock}};
   window.HaniOfficeV2Assets={...assets,spritesV3:manifest};window.HaniOfficeActions221=table;
   window.xmasWrites=[];for(const key of ['setItem','removeItem','clear'])Storage.prototype[key]=(...args)=>{window.xmasWrites.push([key,...args]);throw Error('storage forbidden')};
   window.xmasTimers=[];window.setInterval=(fn,ms)=>{window.xmasTimers.push({fn,ms});return window.xmasTimers.length};
  },{assets,table,manifest});
  await page.addScriptTag({url:base+'hani-organization-hub.js'});await page.addScriptTag({url:base+'hani-office-live.js'});
  for(const floor of ['1f','5f']){
   await page.locator(`[data-building-floor="${floor}"]`).click();
   await page.waitForFunction(floor=>document.getElementById('haniOfficeMap').dataset.floor===floor&&document.getElementById('haniOfficeMap').dataset.art==='floor',floor);
   await page.evaluate(()=>Promise.all([...document.images].map(img=>img.decode().catch(()=>{}))));
   await page.waitForFunction(()=>[...document.querySelectorAll('.hani-office-actor')].filter(a=>!a.hidden).every(a=>a.dataset.avatar!=='pending'));
   const result=await page.evaluate(()=>{
    const props=[...document.querySelectorAll('.hani-office-live-prop[data-event]')];
    const snapshot=()=>props.map(p=>{const s=getComputedStyle(p),r=p.getBoundingClientRect();return {id:p.dataset.prop,hidden:p.hidden,display:s.display,pointerEvents:s.pointerEvents,animation:s.animationName,timing:s.animationTimingFunction,position:s.backgroundPosition,rect:[r.x,r.y,r.width,r.height]}});
    const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    const brand=document.querySelector('.hani-office-brand').getBoundingClientRect(),wreath=props.find(p=>p.dataset.prop==='xmas-wreath').getBoundingClientRect();
    return {floor:document.getElementById('haniOfficeMap').dataset.floor,art:document.querySelector('.hani-office-background').src,props:snapshot(),layers:[...document.querySelectorAll('#haniOfficeActors,.hani-office-live-props,.hani-office-actor:not([hidden]),.hani-office-name,.hani-office-status')].filter(e=>getComputedStyle(e).display!=='none').map(e=>({class:e.className,id:e.id,person:e.dataset.person,style:e.getAttribute('style'),z:getComputedStyle(e).zIndex,transform:getComputedStyle(e).transform,rect:e.getBoundingClientRect().toJSON()})),wreathOverlapsBrand:overlap(brand,wreath),writes:window.xmasWrites};
   });
   assert.equal(result.props.filter(p=>!p.hidden).length,floor==='1f'?4:1);assert.deepEqual(result.writes,[]);assert.ok(result.props.every(p=>p.pointerEvents==='none'));
   assert.equal(result.wreathOverlapsBrand,false,'wreath clears the existing HANI GROUP label');
   await page.screenshot({path:path.join(root,`artifacts/office-xmas-live/${floor}-${width}x${height}.png`)});
   await page.emulateMedia({reducedMotion:'reduce'});
   const reduced=await page.locator('.hani-office-live-prop[data-event]').evaluateAll(props=>props.map(p=>({id:p.dataset.prop,animation:getComputedStyle(p).animationName,position:getComputedStyle(p).backgroundPosition})));
   assert.ok(reduced.every(p=>p.animation==='none'));result.reduced=reduced;results.push(result);
   await page.emulateMedia({reducedMotion:'no-preference'});
  }
  await page.close();
 }
 fs.writeFileSync(path.join(root,'artifacts/office-xmas-live/round2-before-browser.json'),JSON.stringify(results,null,2)+'\n');
 console.log('browser QA: four screenshots, tap-through, layer visibility and reduced motion verified');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
