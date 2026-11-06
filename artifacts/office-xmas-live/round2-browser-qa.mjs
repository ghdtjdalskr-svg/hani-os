// Test-only office harness: actual owner/CSS/art; fixed clock, no application storage.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {assets} from '../../scripts/hani-office-v2-fixture.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const baseline=process.argv.includes('--baseline');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const table=JSON.parse(read('assets/data/office-actions-221.json'));
const manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.webp')?'image/webp':'application/octet-stream');if(baseline&&file.endsWith('hani-office-live.css'))res.end(read('artifacts/office-xmas-live/round2-before.css'));else fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 const base=`http://127.0.0.1:${server.address().port}/`,results=[];
 for(const [width,height]of [[1280,900],[390,844]])for(const hour of [20,12]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'no-preference'});
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await page.setContent(`<base href="${base}"><link rel="stylesheet" href="hani-office-live.css"><style>body{margin:0;padding:16px;font-family:Arial,sans-serif;background:#faf8f5}.hani-office-live{padding:0;border:0}h1{font-size:18px}p{font-size:13px}</style><h1>크리스마스 사무실 · 2026-12-24 ${hour}:00 KST</h1><div id="app"><section class="view active"><div class="hani-office-live" id="haniOfficeLive"><div class="hani-building-tabs"></div><div class="hani-office-scroll"><div class="hani-office-map" id="haniOfficeMap"><img class="hani-office-background"><img class="hani-office-foreground"><img class="hani-office-foreground"><img class="hani-office-foreground"><div id="haniOfficeActors"></div></div></div>${['haniOfficeConversation','haniOfficeMeeting','haniOfficeParticipants','haniOfficeQuestions','haniOfficeMeetingOpen','haniOfficeReturn','haniOfficeCaseState','haniOfficeReportLink','haniOfficeMeetingTitle','haniOfficeMeetingMeta','agentCaseDetail'].map(id=>`<div id="${id}" hidden></div>`).join('')}</div></section></div>`);
  await page.evaluate(({assets,table,manifest,hour})=>{
   const RealDate=Date;window.xmasClock=RealDate.parse(`2026-12-24T${hour}:00:00+09:00`);
   window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[window.xmasClock]))}static now(){return window.xmasClock}};
   window.HaniOfficeV2Assets={...assets,spritesV3:manifest};window.HaniOfficeActions221=table;
   window.xmasWrites=[];for(const key of ['setItem','removeItem','clear'])Storage.prototype[key]=(...args)=>{window.xmasWrites.push([key,...args]);throw Error('storage forbidden')};
   window.xmasTimers=[];window.setInterval=(fn,ms)=>{window.xmasTimers.push({fn,ms});return window.xmasTimers.length};
  },{assets,table,manifest,hour});
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
    const gift=props.find(p=>p.dataset.prop==='xmas-gifts'),giftRect=gift.getBoundingClientRect();
    const labels=[...document.querySelectorAll('.hani-office-name,.hani-office-status')].filter(node=>!node.closest('.hani-office-actor').hidden&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden'&&overlap(giftRect,node.getBoundingClientRect()));
    const giftLabelOverlaps=labels.map(node=>({person:node.closest('.hani-office-actor').dataset.person,kind:node.className}));
    const giftCoveredLabels=labels.filter(node=>{
     const rect=node.getBoundingClientRect(),x=(Math.max(rect.left,giftRect.left)+Math.min(rect.right,giftRect.right))/2,y=(Math.max(rect.top,giftRect.top)+Math.min(rect.bottom,giftRect.bottom))/2;
     const giftStyle=gift.getAttribute('style'),labelStyle=node.getAttribute('style');gift.style.pointerEvents='auto';node.style.pointerEvents='auto';
     const stack=document.elementsFromPoint(x,y),li=stack.findIndex(e=>e===node||node.contains(e)),pi=stack.indexOf(gift);
     gift.setAttribute('style',giftStyle);node.setAttribute('style',labelStyle);
     return li<0||pi<li;
    }).map(node=>node.closest('.hani-office-actor').dataset.person);
    return {floor:document.getElementById('haniOfficeMap').dataset.floor,art:document.querySelector('.hani-office-background').src,props:snapshot(),giftLabelOverlaps,giftCoveredLabels,wreathOverlapsBrand:overlap(brand,wreath),writes:window.xmasWrites};
   });
   result.viewport=[width,height];result.kst=`2026-12-24 ${hour}:00`;
   assert.equal(result.props.filter(p=>!p.hidden).length,floor==='1f'?4:hour===20?1:0);assert.deepEqual(result.writes,[]);assert.ok(result.props.every(p=>p.pointerEvents==='none'));
   assert.equal(result.wreathOverlapsBrand,false,'wreath clears the existing HANI GROUP label');
   if(floor==='1f'){
    assert.deepEqual(result.giftCoveredLabels,[],'gift never paints over any displayed name/status label '+width+' '+hour);
    assert.deepEqual(result.giftLabelOverlaps.filter(row=>row.person.startsWith('pet-')),[],'gift rectangle clears pet name labels');
   }
   if(!baseline)await page.screenshot({path:path.join(root,`artifacts/office-xmas-live/${floor}-${hour===20?'':'12h-'}${width}x${height}.png`)});
   // Actual browser paint-order regression: every old/new prop over the same
   // existing actor's name, status, sprite and bubble. Press/fade contexts are
   // exercised too; no test DOM layer or runtime handler is introduced.
   if(floor==='1f')result.stacking=await page.evaluate(()=>{
    const actor=[...document.querySelectorAll('.hani-office-actor')].find(e=>!e.hidden&&!e.dataset.resident);
    const bubble=document.querySelector('.hani-office-character-bubble'),layer=document.querySelector('.hani-office-live-props');
    const props=[...layer.children],out=[],saved=[];
    const set=(node,key,value)=>{saved.push(()=>node[key]=value);node[key]=value};
    set(layer,'hidden',false);set(bubble,'hidden',false);
    for(const prop of props){
     const propStyle=prop.getAttribute('style'),propHidden=prop.hidden;
     prop.hidden=false;
     for(const mode of ['normal','fade','press']){
      const original=actor.getAttribute('style');
      if(mode==='fade')actor.style.opacity='.999';
      if(mode==='press')actor.style.transform='scale(.99)';
      for(const node of [actor.querySelector('.hani-office-name'),actor.querySelector('.hani-office-status'),actor.querySelector('.hani-office-sprite'),bubble]){
       const originalStyle=node.getAttribute('style'),originalHidden=node.hidden;node.hidden=false;node.style.display='block';node.style.visibility='visible';node.style.pointerEvents='auto';
       const rect=node.getBoundingClientRect(),map=document.querySelector('.hani-office-map').getBoundingClientRect();
       if(!rect.width||!rect.height)throw Error('paint target has no area: '+node.className);
       const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
       prop.style.cssText=`left:${x-map.left-1}px;top:${y-map.top-1}px;width:24px;height:24px;transform:translate(-50%,-50%);pointer-events:auto;animation:none;background:magenta`;
       const stack=document.elementsFromPoint(x,y),targetIndex=stack.findIndex(e=>e===node||node.contains(e)),propIndex=stack.indexOf(prop),above=targetIndex>=0&&propIndex>targetIndex;
       out.push({prop:prop.dataset.prop,mode,target:node.className,targetIndex,propIndex,above});
       node.hidden=originalHidden;if(originalStyle===null)node.removeAttribute('style');else node.setAttribute('style',originalStyle);
      }
      actor.setAttribute('style',original);
     }
     prop.hidden=propHidden;if(propStyle===null)prop.removeAttribute('style');else prop.setAttribute('style',propStyle);
    }
    saved.reverse().forEach(fn=>fn());return out;
   });
   if(result.stacking)assert.ok(result.stacking.every(p=>p.above),JSON.stringify(result.stacking.filter(p=>!p.above)));
   await page.emulateMedia({reducedMotion:'reduce'});
   const reduced=await page.locator('.hani-office-live-prop[data-event]').evaluateAll(props=>props.map(p=>({id:p.dataset.prop,animation:getComputedStyle(p).animationName,position:getComputedStyle(p).backgroundPosition})));
   assert.ok(reduced.every(p=>p.animation==='none'));result.reduced=reduced;results.push(result);
   await page.emulateMedia({reducedMotion:'no-preference'});
  }
  await page.close();
 }
 fs.writeFileSync(path.join(root,'artifacts/office-xmas-live/round2-browser-check.json'),JSON.stringify(results,null,2)+'\n');
 console.log('browser QA: eight screenshots, all 12 props below name/status/sprite/bubble in normal/fade/press states, tap-through and reduced motion verified');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
