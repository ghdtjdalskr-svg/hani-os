// Real index + canonical remote renderer, disposable local Edge, no external services.
// node scripts/hani-remote-card-224.test.mjs [--geometry-only | --node-only]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {localBrowser} from './hani-contrast-audit.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.resolve(root,process.env.HANI_REMOTE_CARD_OUTPUT||'artifacts/remote-card-224');
const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
function sourcePixels(actual,original,{rect:r,boxes}){
 let samples=0,maxDelta=0,minLuminanceRatio=Infinity,totalDelta=0,worst=null;
 const bands={top:0,left:0,right:0};
 // Keep the fixed upper-55% contract (one percent inside its edge). Never
 // shrink this band to follow a regressed scrim or mask differing pixels.
 const band={left:12,top:12,right:Math.floor(r.width)-12,bottom:Math.floor(r.height*.54)};
 for(let y=band.top;y<band.bottom;y+=2)for(let x=band.left;x<band.right;x+=2){
  const sx=Math.floor(r.left+x),sy=Math.floor(r.top+y);if(boxes.some(b=>sx>=b.left&&sx<=b.right&&sy>=b.top&&sy<=b.bottom))continue;
  assert.ok(sx>=0&&sy>=0&&sx<actual.info.width&&sy<actual.info.height,'sample inside viewport');
  const i=(sy*actual.info.width+sx)*actual.info.channels,j=(sy*original.info.width+sx)*original.info.channels;
  const a=[...actual.data.subarray(i,i+3)],b=[...original.data.subarray(j,j+3)];
  const delta=Math.max(...a.map((v,k)=>Math.abs(v-b[k])));if(delta>maxDelta){maxDelta=delta;worst={x,y,a,b}}totalDelta+=delta;samples++;
  minLuminanceRatio=Math.min(minLuminanceRatio,(lum(a)+.05)/(lum(b)+.05));
  if(y<r.height*.2)bands.top++;if(x<r.width*.2)bands.left++;if(x>r.width*.8)bands.right++;
 }
 return {samples,bands,maxDelta,meanDelta:totalDelta/samples,minLuminanceRatio,worst,band,excludedRects:boxes};
}
if(process.argv.includes('--node-only')){
 await import('./hani-context-remote.test.mjs');
 const source=fs.readFileSync(path.join(root,'hani-context-remote-v1.js'),'utf8');new vm.Script(source);
 const begin=source.indexOf('  const mediaFocal='),end=source.indexOf('  const updateToday=',begin);assert.ok(begin>=0&&end>begin);
 const nodes=new Map(),writes=[];let view='reading';
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{style:{},getAttribute(k){return this[k]},setAttribute(k,v){this[k]=v}});return nodes.get(selector)};
 const ctx=vm.createContext({rail:{},$:node,viewId:()=>view,season:()=> 'autumn',greetings:{autumn:['staff','fallback quote']},window:{HANI_MAIN_CHARACTER_BANNER:{get:id=>({sceneImage:'./assets/heroes/'+id+'.webp',speaker:'하루',quote:'test quote'})}},localStorage:{setItem(...v){writes.push(v)},removeItem(...v){writes.push(v)},clear(){writes.push('clear')}}});
 vm.runInContext(source.slice(begin,end)+';globalThis.render=updateBanner;',ctx);
 for(const [id,focal] of [['reading','57% 22%'],['investment','51% 24%'],['exercise','53% 32%'],['geminiReports','63% 38%'],['home','50% 30%']]){
  view=id;ctx.render({primary:'기존 작업',recent:'최근 기록'},id);
  assert.equal(node('.hani-remote-media-image').style.objectPosition,focal);
  assert.equal(node('.hani-remote-media-image').src,'./assets/heroes/'+id+'.webp');
  assert.equal(node('[data-remote-media-title]').textContent,id);
  assert.equal(node('[data-remote-media-staff]').textContent,'담당 직원 · 하루');
  assert.equal(node('[data-remote-media-line]').textContent,'test quote');
  assert.equal(node('.hani-remote-media [data-remote-action="primary"]')['aria-label'],'기존 작업');
 }
 const slots=[...nodes.values()];for(let i=0;i<25;i++)ctx.render({},'repeat');assert.deepEqual([...nodes.values()],slots);assert.deepEqual(writes,[]);
 // A title may paint above its positioned parent; excluding only the parent
 // misclassifies its opaque backing as darkened artwork. Use the actual sampler.
 const info={width:240,height:460,channels:3},original={info,data:Buffer.alloc(info.width*info.height*3,180)},actual={info,data:Buffer.from(original.data)};
 const rect={left:10,top:10,width:211,height:408},parent={left:22,top:240,right:208,bottom:400},title={left:110,top:190,right:160,bottom:215};
 for(let y=title.top;y<=title.bottom;y++)for(let x=title.left;x<=title.right;x++)actual.data.fill(109,(y*info.width+x)*3,(y*info.width+x)*3+3);
 assert.equal(sourcePixels(actual,original,{rect,boxes:[parent]}).maxDelta,71,'parent-only mask reproduces an overlay false failure');
 const clean=sourcePixels(actual,original,{rect,boxes:[parent,title]});assert.equal(clean.maxDelta,0);assert.equal(clean.minLuminanceRatio,1);assert.ok(Object.values(clean.bands).every(n=>n>0));
 const shade=(x,y)=>actual.data.fill(109,((rect.top+y)*info.width+rect.left+x)*3,((rect.top+y)*info.width+rect.left+x)*3+3);
 for(const [x,y] of [[12,12],[12,190],[198,190],[120,218]]){shade(x,y);assert.equal(sourcePixels(actual,original,{rect,boxes:[parent,title]}).maxDelta,71,'unmasked upper/edge/near-scrim darkening still fails');actual.data.set([180,180,180],((rect.top+y)*info.width+rect.left+x)*3)}
 console.log('PASS remote224 canonical focal/reset, source/labels, persistent slots x25, write0; sampler overlay overflow + strict upper/edge/near-scrim darkening regression; NOT RUN: browser AA/cover/overflow/controls');process.exit(0);
}
const deps=process.env.HANI_PLAYWRIGHT||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const git=process.env.HANI_GIT_PATH||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe';
const sharp=createRequire(pathToFileURL(deps))('sharp');
const geometryOnly=process.argv.includes('--geometry-only');
const selected=['reading','investment','exercise','geminiReports'];
const focal={reading:'57% 22%',investment:'51% 24%',exercise:'53% 32%',geminiReports:'63% 38%'};
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const report={status:'RUNNING',base:'0442c6b4b7110a9fa9a1f142de8df3645f77e1cd',dateKST:'2026-10-21',geometryOnly,
 testSha256:hash('scripts/hani-remote-card-224.test.mjs'),
 sourceHashes:Object.fromEntries(['hani-context-remote-v1.js','hani-context-remote.css','index.html','hani-main.js'].map(f=>[f,hash(f)])),
 method:'Real index; original image paint with card overlays/content temporarily hidden vs normal composited top-55% pixels, including top/left/right bands. Exclude visible overlay roots AND descendant paint rects, including content overflowing its parent. Fixed no-scrim band and strict maxDelta<=1 / luminance>=.98. Record decoded image identity and gradient; reject geometry/source changes between captures. Same browser paint preserves image sampling/compositing identity. Three text-paint captures isolate glyph interiors >=230/255; every text/icon >=4.5:1, including each hovered/keyboard-focused card button. Synthetic empty local context; external services stubbed. Before CSS from fixed base in the same browser.',baseline:[],cases:[],errors:[],consoleErrors:[],networkErrors:[]};
fs.mkdirSync(out,{recursive:true});
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
async function pixelAudit(page,card){
 const entries=await card.evaluate(card=>{
  const entries=[],walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
   const el=node.parentElement;if(!node.textContent.trim()||!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
   const style=getComputedStyle(el),canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=style.color;ctx.fillRect(0,0,1,1);const fg=[...ctx.getImageData(0,0,1,1).data];
   let opacity=1,clip={left:0,top:0,right:innerWidth,bottom:innerHeight};
   for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);opacity*=+s.opacity;if(/hidden|clip|auto|scroll/.test(s.overflow)){const r=e.getBoundingClientRect();clip={left:Math.max(clip.left,r.left),top:Math.max(clip.top,r.top),right:Math.min(clip.right,r.right),bottom:Math.min(clip.bottom,r.bottom)}}}
   const range=document.createRange();range.selectNodeContents(node);
   for(const r of range.getClientRects()){
    const box={left:Math.max(r.left,clip.left),top:Math.max(r.top,clip.top),right:Math.min(r.right,clip.right),bottom:Math.min(r.bottom,clip.bottom)};
    if(box.right-box.left>1&&box.bottom-box.top>1)entries.push({text:node.textContent.trim(),fg,opacity,...box});
   }
  }return entries;
 });
 const paints=[];
 for(const color of ['transparent','black','white']){
  const style=await page.addStyleTag({content:`.hani-remote-media,.hani-remote-media *{-webkit-text-fill-color:${color}!important;text-shadow:none!important}`});
  try{paints.push(await sharp(await page.screenshot({animations:'disabled'})).removeAlpha().raw().toBuffer({resolveWithObject:true}))}finally{await style.evaluate(e=>e.remove())}
 }
 const {data,info}=paints[0];
 return entries.map(e=>{
  let min=Infinity,samples=0,worst=null;
  for(let y=Math.ceil(e.top);y<Math.floor(e.bottom);y++)for(let x=Math.ceil(e.left);x<Math.floor(e.right);x++){
   const i=(y*info.width+x)*info.channels;
   if(Math.max(...[0,1,2].map(k=>Math.abs(paints[2].data[i+k]-paints[1].data[i+k])))<230)continue;
   const bg=[data[i],data[i+1],data[i+2]],alpha=e.fg[3]/255*e.opacity,fg=e.fg.slice(0,3).map((v,k)=>v*alpha+bg[k]*(1-alpha));
   const cr=ratio(fg,bg);if(cr<min){min=cr;worst={x,y,bg}}samples++;
  }return {text:e.text,minRatio:+min.toFixed(4),samples,worst};
 }).filter(e=>e.samples);
}
async function geometry(page){return page.locator('#haniContextRemote').evaluate(n=>{
 const card=n.querySelector('.hani-remote-media'),img=card.querySelector('img'),r=card.getBoundingClientRect(),nr=n.getBoundingClientRect();
 const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
 const buttons=[...n.querySelectorAll('.hani-remote-nav button')].filter(b=>b.checkVisibility());
 return {height:r.height,cardWidth:r.width,railHeight:n.clientHeight,scroll:n.scrollHeight,overflow:n.scrollWidth>n.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,
  quickActionsVisible:buttons.every(b=>{const br=b.getBoundingClientRect();return br.top>=nr.top&&br.bottom<=Math.min(nr.bottom,innerHeight)+1}),
  contentInside:[...card.querySelectorAll('h2,p,button')].filter(e=>e.checkVisibility()).every(e=>{const br=e.getBoundingClientRect();return br.left>=r.left&&br.right<=r.right+1&&br.top>=r.top&&br.bottom<=r.bottom}),
  objectFit:getComputedStyle(img).objectFit,filter:getComputedStyle(img).filter,position:getComputedStyle(img).objectPosition,image:rect(img),card:rect(card),natural:[img.naturalWidth,img.naturalHeight],
  scrim:getComputedStyle(card,'::after').backgroundImage,hero:img.getAttribute('src'),title:card.querySelector('h2').textContent,
  same:card===window.testRemoteSlot&&img===window.testRemoteImage&&window.testRemoteButtons.every((b,i)=>b===card.querySelectorAll('button')[i])};
 })}
async function imagePixels(page,card){
 // Render the original decoded source in the same slot with ONLY overlays hidden.
 // A separate body image/canvas uses a different GPU sampling/compositing path.
 await page.evaluate(()=>document.fonts.ready);
 const snapshot=()=>card.evaluate(card=>{
  const img=card.querySelector('img'),r=img.getBoundingClientRect();
  const roots=[...card.querySelectorAll('.hani-remote-media-chip,.hani-remote-media-content')];
  const overlays=[...new Set(roots.flatMap(n=>[n,...n.querySelectorAll('*')]))].filter(n=>n.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}));
  const boxes=overlays.flatMap(n=>[...n.getClientRects()].filter(r=>r.width&&r.height).map(r=>({left:r.left-7,top:r.top-3,right:r.right+7,bottom:r.bottom+3})));
  // Title/line text-shadows and pill pseudo-elements paint up to ~24px outside their client rects.
  const content=card.querySelector('.hani-remote-media-content');if(content){const c=content.getBoundingClientRect();boxes.push({left:c.left-7,top:c.top-24,right:c.right+7,bottom:c.bottom+3})}
  return {rect:{left:r.left,top:r.top,width:r.width,height:r.height},boxes,source:{src:img.getAttribute('src'),currentSrc:img.currentSrc,complete:img.complete,natural:[img.naturalWidth,img.naturalHeight]},scrim:getComputedStyle(card,'::after').backgroundImage};
 });
 const ref=await snapshot();assert.ok(ref.source.complete&&ref.source.natural.every(n=>n>0),'decoded reference source');
 const actual=await sharp(await page.screenshot({animations:'disabled'})).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const hidden=await page.addStyleTag({content:'.hani-remote-media::before,.hani-remote-media::after,.hani-remote-media-chip,.hani-remote-media-content{visibility:hidden!important}'});
 let original;try{original=await sharp(await page.screenshot({animations:'disabled'})).removeAlpha().raw().toBuffer({resolveWithObject:true})}finally{await hidden.evaluate(e=>e.remove())}
 const restored=await snapshot();assert.deepEqual(restored,ref,'source/layout/overlays stable across captures');
 assert.deepEqual(actual.info,original.info,'same screenshot dimensions');
 return {...sourcePixels(actual,original,ref),source:ref.source,imageRect:ref.rect,scrim:ref.scrim};
}
let env;
try{
 env=await localBrowser(deps,process.env.HANI_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');report.browser=env.browser.version();const {page,origin}=env;
 await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});page.on('requestfailed',r=>report.networkErrors.push(r.url()));
 const baselineCss=execFileSync(git,['show',report.base+':hani-context-remote.css'],{cwd:root,encoding:'utf8'});
 const load=async()=>{await page.goto(origin);await page.waitForFunction(()=>window.HANI_CONTEXT_REMOTE_V1);await page.evaluate(()=>{unlockLoginGate();const style=document.createElement('style');style.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.append(style)})};
 const show=async(view,theme,width)=>{
  await page.setViewportSize({width,height:900});
  await page.evaluate(({view,theme})=>{showView(view);applySignatureFinish(theme==='light'?'porcelain-cream':'midnight-black',false);applySeasonTheme('autumn',false);HANI_CONTEXT_REMOTE_V1.update()}, {view,theme});
  if(width<=850&&await page.locator('#haniContextRemote').getAttribute('data-open')!=='true')await page.locator('.hani-remote-mobile-trigger').click();
  await page.locator('#haniContextRemote').evaluate(async n=>{n.scrollTop=0;await n.querySelector('img').decode()});await page.mouse.move(0,0);await page.evaluate(()=>document.activeElement?.blur());
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 };
 const baselineRoute=r=>r.fulfill({status:200,body:baselineCss,contentType:'text/css'});
 await page.route('**/hani-context-remote.css?*',baselineRoute);await load();
 await page.evaluate(()=>{window.testRemoteSlot=document.querySelector('.hani-remote-media');window.testRemoteImage=testRemoteSlot.querySelector('img');window.testRemoteButtons=[...testRemoteSlot.querySelectorAll('button')]});
 for(const width of [1440,390])for(const view of selected){await show(view,'light',width);report.baseline.push({width,view,...await geometry(page)})}
 await page.unroute('**/hani-context-remote.css?*',baselineRoute);await load();
 await page.evaluate(()=>{window.testRemoteSlot=document.querySelector('.hani-remote-media');window.testRemoteImage=testRemoteSlot.querySelector('img');window.testRemoteButtons=[...testRemoteSlot.querySelectorAll('button')];window.remoteCardWrites=[];for(const m of ['setItem','removeItem','clear']){const orig=Storage.prototype[m];Storage.prototype[m]=function(...args){remoteCardWrites.push({method:m,key:args[0]});return orig.apply(this,args)}}});
 const heroes=await page.evaluate(()=>[...new Set([...document.querySelectorAll('.view[id]')].map(n=>n.id).concat('home'))].filter(id=>HANI_MAIN_CHARACTER_BANNER.get(id)?.sceneImage));report.heroes=heroes;
 for(const width of [1440,390])for(const theme of ['light','dark'])for(const view of geometryOnly?selected:heroes){
  try{
  await show(view,theme,width);const card=page.locator('.hani-remote-media'),g=await geometry(page),result={width,theme,view,geometry:g,states:[]};report.cases.push(result);
  if(selected.includes(view))await page.screenshot({path:path.join(out,`after-${view}-${width===1440?'desktop':'mobile'}-${theme}.png`),animations:'disabled'});
  assert.equal(g.height,width===1440?410:204,'image area height');assert.equal(g.overflow,false,'no horizontal overflow');assert.ok(g.contentInside,view+' content inside card');assert.ok(g.same,'persistent card/image/button slots');
  assert.equal(g.objectFit,'cover');assert.equal(g.filter,'none');assert.equal(g.position,focal[view]||'50% 30%');assert.ok(g.natural.every(n=>n>0),'image decoded');
  assert.equal(g.image.width,g.card.width-2,'image covers full card width');assert.equal(g.image.height,g.card.height-2,'image covers full card height');
  const old=report.baseline.find(b=>b.width===width&&b.view===view);
  if(old){assert.ok(g.height/old.height>=1.15&&g.height/old.height<=1.2);assert.ok(g.quickActionsVisible,view+' all quick actions visible');assert.ok(Math.max(0,g.scroll-g.railHeight)<=Math.max(0,old.scroll-old.railHeight)+1,view+' no added rail scroll')}
  if(geometryOnly)continue;
  result.imagePixels=await imagePixels(page,card);assert.ok(result.imagePixels.samples>100);assert.ok(Object.values(result.imagePixels.bands).every(n=>n>0));
  assert.ok(result.imagePixels.maxDelta<=1&&result.imagePixels.minLuminanceRatio>=.98,view+' upper source pixels unchanged: '+JSON.stringify(result.imagePixels));
  const audit=async state=>{const entries=await pixelAudit(page,card);result.states.push({state,entries,min:Math.min(...entries.map(e=>e.minRatio))});assert.ok(entries.length>=10,view+' visible text sampled');assert.ok(entries.every(e=>e.minRatio>=4.5),JSON.stringify({view,width,theme,state,failed:entries.filter(e=>e.minRatio<4.5)}))};
  await audit('rest');
  if(selected.includes(view))for(const action of ['primary','yuna','agent','recent']){
   const button=card.locator(`[data-remote-action="${action}"]`);if(!await button.isVisible())continue;
   await button.hover();await audit(action+'/hover');await page.mouse.move(0,0);await page.keyboard.press('Tab');await button.focus();assert.ok(await button.evaluate(e=>e.matches(':focus-visible')));await audit(action+'/focus');await button.evaluate(e=>e.blur());
  }
  console.log(`PASS remote224 ${width}/${theme}/${view}`);
  }catch(error){
   const result=report.cases.at(-1),failure={width,theme,view,error:error.stack};
   if(result?.width===width&&result.theme===theme&&result.view===view)result.failure=failure.error;
   else report.cases.push(failure);
   report.errors.push(failure);console.error(`FAIL remote224 ${width}/${theme}/${view}: ${error.message}`);
  }
 }
 await page.setViewportSize({width:390,height:844});for(const view of selected){await show(view,'light',390);await page.setViewportSize({width:390,height:844});const g=await geometry(page);assert.ok(g.scroll<=g.railHeight+1,'390x844 no scroll '+view)}
 // Unknown/no-hero route resets any previous focal setting, retaining the slot.
 await show('aura','light',1440);assert.equal(await page.locator('.hani-remote-media-image').evaluate(e=>getComputedStyle(e).objectPosition),'50% 30%');
 await page.evaluate(()=>{remoteCardWrites.length=0;for(let i=0;i<25;i++)HANI_CONTEXT_REMOTE_V1.update()});assert.deepEqual(await page.evaluate(()=>remoteCardWrites),[]);report.redrawWrites=0;
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.networkErrors,[]);
 report.status='PASS';
}catch(e){report.status='FAIL';report.errors.push(e.stack);process.exitCode=1;console.error(e.message)}
finally{await env?.close();report.failedCases=report.cases.filter(c=>c.failure||c.error).map(({width,theme,view})=>({width,theme,view}));fs.writeFileSync(path.join(out,geometryOnly?'geometry.json':'after.json'),JSON.stringify(report,null,2));console.log(`remote224 ${report.status}: ${report.cases.length} cases; failed combinations: ${JSON.stringify(report.failedCases)}`)}
