import {sourcePixels,verifyRemoteCardNode} from './hani-remote-card-node.mjs';
// Real index + canonical remote renderer, disposable local Edge, no external services.
// node scripts/hani-remote-card-224.test.mjs [--geometry-only | --node-only | --restore-217]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {remote217Oracle,remote217Seed,remote217BrowserEntropy} from './hani-remote-217-oracle.mjs';
import {localBrowser} from './hani-contrast-audit.mjs';
const restore217=process.argv.includes('--restore-217');
const root=path.resolve(import.meta.dirname,'..'),out=path.resolve(root,process.env.HANI_REMOTE_CARD_OUTPUT||(restore217?'artifacts/hero-restore':'artifacts/remote-card-224'));
const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
if(process.argv.includes('--node-only')){await verifyRemoteCardNode();process.exit(0)}
const deps=process.env.HANI_PLAYWRIGHT||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const git=process.env.HANI_GIT_PATH||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe';
const sharp=createRequire(pathToFileURL(deps))('sharp');
const geometryOnly=process.argv.includes('--geometry-only');
const selected=restore217?['movie','investment','study']:['reading','investment','exercise','geminiReports'];
const focal={reading:'50% 30%',investment:'50% 30%',exercise:'50% 30%',geminiReports:'50% 30%'};
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const report={status:'RUNNING',base:'0442c6b4b7110a9fa9a1f142de8df3645f77e1cd',patchBase:'274997a961c03216d5de7c600c5eda5ebb7593bb',selectionSource:'60db7b5:hani-context-remote-v1.js',dateKST:'2026-10-21',geometryOnly,restore217,
 testSha256:hash('scripts/hani-remote-card-224.test.mjs'),
 oracleSha256:hash('scripts/hani-remote-217-oracle.mjs'),selectionFixtureSha256:hash('scripts/fixtures/context-remote-217-selection.json'),
 sourceHashes:Object.fromEntries(['hani-context-remote-v1.js','hani-context-remote.css','index.html','hani-main.js'].map(f=>[f,hash(f)])),
 method:'Real index; original image paint with card overlays/content temporarily hidden vs normal composited top-55% pixels, including top/left/right bands. Hide content/chip in both paints; retain the lower gradient and clip only its upper 55% in the reference. No sampled pixels excluded. Fixed no-scrim band and strict maxDelta<=1 / luminance>=.98. Record decoded image identity and gradient; reject geometry/source changes between captures. Same browser paint preserves image sampling/compositing identity. Three text-paint captures isolate glyph interiors >=230/255; every text/icon >=4.5:1, including each hovered/keyboard-focused card button. Synthetic empty local context; external services stubbed. Before CSS from fixed base in the same browser.',baseline:[],cases:[],errors:[],consoleErrors:[],networkErrors:[]};
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
 // Use the same tall image and stacking tree in both paints. Hide text overlays
 // for BOTH captures; retaining the lower scrim avoids changing the image's
 // compositing path by removing the whole pseudo-element. No upper pixels are
 // excluded or tolerances relaxed. AA is audited separately with text restored.
 await page.evaluate(()=>document.fonts.ready);
 const snapshot=()=>card.evaluate(card=>{
  const img=card.querySelector('img'),r=img.getBoundingClientRect();
  return {rect:{left:r.left,top:r.top,width:r.width,height:r.height},boxes:[],source:{src:img.getAttribute('src'),currentSrc:img.currentSrc,complete:img.complete,natural:[img.naturalWidth,img.naturalHeight]},scrim:getComputedStyle(card,'::after').backgroundImage};
 });
 const ref=await snapshot();assert.ok(ref.source.complete&&ref.source.natural.every(n=>n>0),'decoded reference source');
 const hidden=await page.addStyleTag({content:'.hani-remote-media-chip,.hani-remote-media-content{visibility:hidden!important}'});
 let actual,original;
 try{
  actual=await sharp(await page.screenshot({animations:'disabled'})).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const reference=await page.addStyleTag({content:'.hani-remote-media::before{visibility:hidden!important}.hani-remote-media::after{clip-path:inset(55% 0 0 0)!important}'});
  try{original=await sharp(await page.screenshot({animations:'disabled'})).removeAlpha().raw().toBuffer({resolveWithObject:true})}finally{await reference.evaluate(e=>e.remove())}
 }finally{await hidden.evaluate(e=>e.remove())}
 assert.deepEqual(await snapshot(),ref,'source/layout stable across captures and restored overlays');
 assert.deepEqual(actual.info,original.info,'same screenshot dimensions');
 return {...sourcePixels(actual,original,ref),source:ref.source,imageRect:ref.rect,scrim:ref.scrim};
}
let env,oracle,currentView,currentSeason;
try{
 env=await localBrowser(deps,process.env.HANI_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');report.browser=env.browser.version();const {page,origin}=env;
 await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});page.on('requestfailed',r=>report.networkErrors.push(r.url()));
 await remote217BrowserEntropy(page);
 const baselineCss=restore217?'':execFileSync(git,['show',report.base+':hani-context-remote.css'],{cwd:root,encoding:'utf8'});
 const load=async()=>{await page.goto(origin);await page.waitForFunction(()=>window.HANI_CONTEXT_REMOTE_V1);await page.evaluate(()=>{unlockLoginGate();const style=document.createElement('style');style.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.append(style)});
  ({view:currentView,season:currentSeason}=await page.evaluate(()=>({view:document.body.dataset.view,season:document.documentElement.dataset.season})));oracle=remote217Oracle(()=>remote217Seed(currentView,currentSeason));oracle.select(currentView,currentSeason);
 };
 const show=async(view,theme,width,season='autumn')=>{
  currentView=view;oracle.select(currentView,currentSeason);
  const changed=currentSeason!==season;currentSeason=season;const expected=oracle.select(currentView,currentSeason,{changed});
  await page.setViewportSize({width,height:900});
  await page.evaluate(({view,theme,season})=>{showView(view);applySignatureFinish(theme==='light'?'porcelain-cream':'midnight-black',false);applySeasonTheme(season,false);HANI_CONTEXT_REMOTE_V1.update()}, {view,theme,season});
  if(width<=850&&await page.locator('#haniContextRemote').getAttribute('data-open')!=='true')await page.locator('.hani-remote-mobile-trigger').click();
  await page.locator('#haniContextRemote').evaluate(async n=>{n.scrollTop=0;await n.querySelector('img').decode()});await page.mouse.move(0,0);await page.evaluate(()=>document.activeElement?.blur());
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  assert.equal(await page.locator('.hani-remote-media-image').getAttribute('src'),expected,view+'/'+season+' equals 217 selection');
 };
 const baselineRoute=r=>r.fulfill({status:200,body:baselineCss,contentType:'text/css'});
 if(!restore217){await page.route('**/hani-context-remote.css?*',baselineRoute);await load();
 await page.evaluate(()=>{window.testRemoteSlot=document.querySelector('.hani-remote-media');window.testRemoteImage=testRemoteSlot.querySelector('img');window.testRemoteButtons=[...testRemoteSlot.querySelectorAll('button')]});
 for(const width of [1440,390])for(const view of selected){await show(view,'light',width);report.baseline.push({width,view,...await geometry(page)})}
 await page.unroute('**/hani-context-remote.css?*',baselineRoute);}
 await load();
 await page.evaluate(()=>{window.testRemoteSlot=document.querySelector('.hani-remote-media');window.testRemoteImage=testRemoteSlot.querySelector('img');window.testRemoteButtons=[...testRemoteSlot.querySelectorAll('button')];window.remoteCardWrites=[];for(const m of ['setItem','removeItem','clear']){const orig=Storage.prototype[m];Storage.prototype[m]=function(...args){remoteCardWrites.push({method:m,key:args[0]});return orig.apply(this,args)}}});
 const heroes=await page.evaluate(()=>[...new Set([...document.querySelectorAll('.view[id]')].map(n=>n.id).concat('home'))].filter(id=>HANI_MAIN_CHARACTER_BANNER.get(id)?.sceneImage));report.heroes=heroes;
 for(const width of [1440,390])for(const theme of ['light','dark'])for(const view of restore217||geometryOnly?selected:heroes)for(const season of restore217?['autumn','spring','summer','winter']:['autumn']){
  try{
  await show(view,theme,width,season);const card=page.locator('.hani-remote-media'),g=await geometry(page),result={width,theme,view,season,geometry:g,states:[]};report.cases.push(result);
  if(!restore217&&selected.includes(view))await page.screenshot({path:path.join(out,`after-${view}-${width===1440?'desktop':'mobile'}-${theme}.png`),animations:'disabled'});
  assert.match(g.hero,/^\.\/assets\/context-remote\//);assert.ok(g.natural[1]/g.natural[0]>=1.6,'tall portrait');
  if(restore217&&theme==='light'&&season==='autumn'){const screenshot=`remote-${view}-${width}.png`;await page.screenshot({path:path.join(out,screenshot),animations:'disabled'});result.screenshot=screenshot;}
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
   const result=report.cases.at(-1),failure={width,theme,view,season,error:error.stack};
   if(result?.width===width&&result.theme===theme&&result.view===view&&result.season===season)result.failure=failure.error;
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
}catch(e){report.status=/EPERM|EACCES/.test(e.message)?'BLOCKED':'FAIL';report.errors.push(e.stack);process.exitCode=1;console.error(e.message.split('\n')[0])}
finally{await env?.close();report.failedCases=report.cases.filter(c=>c.failure||c.error).map(({width,theme,view,season})=>({width,theme,view,season}));fs.writeFileSync(path.join(out,restore217?'remote-217-browser.json':geometryOnly?'geometry.json':'after.json'),JSON.stringify(report,null,2));console.log(`remote224 ${report.status}: ${report.cases.length} cases; failed combinations: ${JSON.stringify(report.failedCases)}`)}
