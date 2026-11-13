// Seoyun: node scripts/hani-design-polish-1.browser.mjs <playwright/index.mjs> <msedge.exe>
// Real app + real owners/CSS, synthetic empty data, disposable browser contexts.
// No inverse preload. 'before' serves the two original cb11935 files; 'after' serves disk.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import repository from './hani-test-repository-evidence.cjs';
import {resolveScreenshotContrast} from './hani-design-polish-1-contrast.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/design-polish-1/browser-fixed');
const hash=b=>createHash('sha256').update(b).digest('hex'),base='cb119351ff7b0a01b77fdc04d6f0b1ba0c2b54dc';
const owners=['hani-main.js','hani-design-system.css'];
const sources=Object.fromEntries(owners.map(f=>[f,{before:repository.read(base,f),after:fs.readFileSync(path.join(root,f),'utf8')}]));
const finishes=['porcelain-cream','pure-white','titanium-graphite','midnight-black','sakura-pink','alpine-blue'];
const seasons=['spring','summer','autumn','winter'];
const cases=[
 {id:'intake',selector:'.yuna-composer',items:[1,5]},
 {id:'investmentCommittee',selector:'.ic-header',items:[2,3]},
 {id:'monthlyReport',selector:'#monthlyReportPending',items:[4]},
 {id:'asset',selector:'#assetStats',items:[6]},
 {id:'procrastination',selector:'.pb-header',items:[7]},
 {id:'board',selector:'.board-search',items:[8]},
 {id:'drive',selector:'.gdrive-search',items:[8]},
 {id:'tasks',selector:'.card:has(#taskText)',items:[9]},
 {id:'aura',selector:'.aura-showroom',items:[10]}
];
let phase='after',browser;
const report={result:'NOT_RUN',base,sourceHashes:Object.fromEntries(owners.map(f=>[f,Object.fromEntries(['before','after'].map(p=>[p,hash(sources[f][p])]))])),cases:[],combinations:[],screenshots:[],errors:[],failures:[],navigationWrites:[],helperSetup:[],note:'Zero writes is measured for synchronous passive rendering/style operations. Existing navigation/scroll preference writes are separately recorded. No production/account data. Gradient/image contrast uses clipped PNG background pixels outside text boxes, taking the worst ratio; no 4.5 threshold change. Original failed evidence remains in the parent directory.'};
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\//,'')||'index.html',file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');
  res.end(sources[name]?.[phase]??fs.readFileSync(file));
 }catch(e){res.writeHead(500);res.end('fixture server error')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const check=(condition,message,row)=>{if(!condition)report.failures.push({message,...row})};

// This function executes in the page. It measures actual layout, not CSS strings.
function measure({id,phase}){
 const view=document.getElementById(id),rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}},visible=e=>!!e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const hit=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
 const row={id,phase,width:innerWidth,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),controlsOutside:[],overlaps:[],contrast:[]};
 for(const e of view.querySelectorAll('input:not([type="hidden"]),textarea,select,button')){
  if(!visible(e))continue;const r=rect(e);if(r.width&&r.height&&(r.left<-.5||r.right>innerWidth+.5))row.controlsOutside.push(e.id||e.className);
 }
 const helper=document.getElementById('haniHelperBot');row.helperVisible=!!visible(helper);
 row.helperReason=helper?.dataset.helperReason??null;
 if(helper){const h=rect(helper);row.helperInViewport=!!row.helperVisible&&h.left>=0&&h.top>=0&&h.right<=innerWidth&&h.bottom<=innerHeight;}
 if(id==='intake'){
  const composer=view.querySelector('.yuna-composer');row.composer=rect(composer);row.helper=visible(helper)?rect(helper):null;
  if(row.helper)for(const e of composer.querySelectorAll('button,textarea,label'))if(visible(e)&&hit(row.helper,rect(e)))row.overlaps.push(e.id||e.className);
 }
 if(id==='investmentCommittee'){
  const title=view.querySelector('.ic-header h2'),tools=view.querySelector('.ic-header .ic-tools'),range=document.createRange();range.selectNodeContents(title);
  row.titleLines=range.getClientRects().length;row.toolsBelow=rect(tools).top>=rect(title).bottom;
  const label=view.querySelector('.ic-filter');range.selectNode(label.firstChild);row.filterLabelLines=range.getClientRects().length;
 }
 if(id==='monthlyReport'){
  const spans=[...view.querySelectorAll('.monthly-report-empty-title>span')];row.titlePhrases=spans.map(e=>({text:e.textContent,...rect(e)}));
 }
 if(id==='tasks'){
  const card=view.querySelector('.card:has(#taskText)'),sync=document.getElementById('taskCalendarHub');
  row.formBeforeSync=rect(card).top<rect(sync).top;row.domSyncBeforeForm=!!(sync.compareDocumentPosition(card)&Node.DOCUMENT_POSITION_FOLLOWING);
 }
 if(id==='board'||id==='drive'){
  const search=view.querySelector(id==='drive'?'.gdrive-search input[type="search"]':'.board-search input[type="search"]'),s=getComputedStyle(search);
  row.searchHeight=rect(search).height;row.searchStyle={minHeight:s.minHeight,height:s.height,padding:s.padding,lineHeight:s.lineHeight,inlineStyle:search.getAttribute('style')};
 }
 if(id==='aura'){
  const preview=[...view.querySelectorAll('.aura-preview')].find(visible),choices=document.getElementById('signatureFinishChoices');
  row.introHeight=rect(preview).height;row.choicesTop=rect(choices).top+scrollY;row.choiceCount=view.querySelectorAll('.galaxy-choice').length;
 }
 // Resolve computed sRGB/OKLab/etc through canvas, then composite alpha onto
 // ancestor solid surfaces. Gradients/images require a clipped pixel readback.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const c=canvas.getContext('2d',{willReadFrequently:true});
 const rgba=color=>{c.clearRect(0,0,1,1);c.fillStyle=color;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v)};
 const over=(a,b)=>{const alpha=a[3]+b[3]*(1-a[3]);return [0,1,2].map(i=>(a[i]*a[3]+b[i]*b[3]*(1-a[3]))/(alpha||1)).concat(alpha)};
 const l=a=>a.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const selectors=id==='intake'?['#yunaTargetHelp']:id==='asset'?['#assetStats .asset-evaluation','#assetStats .stat:has(.asset-evaluation) .label']:id==='procrastination'?['.pb-header .pb-eyebrow','.pb-header .pb-intro']:[];
 for(const selector of selectors){
  const e=view.querySelector(selector);if(!visible(e)){row.contrast.push({selector,unresolved:'missing/hidden'});continue;}
  let bg=[0,0,0,0],gradient=false;
  for(let n=e;n&&bg[3]<.999;n=n.parentElement){const s=getComputedStyle(n);if(s.backgroundImage!=='none')gradient=true;bg=over(bg,rgba(s.backgroundColor));}
  bg=over(bg,[255,255,255,1]);const style=getComputedStyle(e),fg=over(rgba(style.color),bg),a=l(fg),b=l(bg);
  row.contrast.push({selector,color:style.color,rgba:rgba(style.color),background:bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),unresolved:gradient?'gradient/image background':null});
 }
 return row;
}

try{
 assert.ok(process.argv[2]&&process.argv[3],'Supply Playwright module and Edge executable paths');
 const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
 browser=await chromium.launch({headless:true,executablePath:process.argv[3]});
 for(phase of ['before','after'])for(const width of [1440,390])for(const finish of ['porcelain-cream','midnight-black']){
  const context=await browser.newContext({viewport:{width,height:width===390?844:1000},deviceScaleFactor:1,timezoneId:'Asia/Seoul',reducedMotion:'reduce',serviceWorkers:'block'});
  try{
   await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
   await context.addInitScript(()=>{
    const Real=Date,fixed=Real.parse('2026-11-17T12:00:00+09:00');window.Date=class extends Real{constructor(...a){super(...(a.length?a:[fixed]))}static now(){return fixed}};
    // Synthetic drag position reproduces the corner collision; only this empty profile.
    localStorage.setItem('hani_helper_pos_v1',JSON.stringify({x:.95,y:.95,v:1}));
   });
   const page=await context.newPage();page.on('pageerror',e=>report.errors.push({phase,width,finish,message:e.message}));page.on('dialog',d=>d.dismiss());
   await page.goto(origin,{waitUntil:'load'});
   await page.waitForFunction(()=>typeof loginGateInitialized!=='undefined'&&loginGateInitialized&&typeof showView==='function'&&typeof state==='object');
   await page.evaluate(finish=>{
    cloudStopAutoSync();unlockLoginGate();
    state.accounts=[];state.transactions=[];state.investmentBrokerSnapshots=[];state.snapshots=[];state.monthlyReports=[];
    monthlyReportBoard='monthly';monthlyReportMonth='2026-10';monthlyReportGeneration=null;monthlyReportGenerationFailure=null;
    applySignatureFinish(finish,false);applySeasonTheme('autumn',false);
    window.__polishWrites=[];
    for(const method of ['setItem','removeItem','clear']){const old=Storage.prototype[method];Storage.prototype[method]=function(...args){window.__polishWrites.push({method,key:args[0]??null});return old.apply(this,args)}}
    window.__polishLife=localStorage.getItem('hani_os_life_v23');
   },finish);
   await page.evaluate(()=>document.fonts.ready);
   // unlockLoginGate starts a .22s visibility transition. The helper's existing
   // observer can place() during that transition and retain reason=login until
   // another focus/resize. Wait for actual gate visibility, then use its public
   // update path; never force hidden=false, fake duty, or seed another store.
   const helperSetup={phase,width,finish,before:await page.evaluate(()=>({reason:document.getElementById('haniHelperBot')?.dataset.helperReason,gateVisibility:getComputedStyle(document.getElementById('loginGate')).visibility,gateOpacity:getComputedStyle(document.getElementById('loginGate')).opacity}))};
   report.helperSetup.push(helperSetup);
   await page.waitForFunction(()=>{
    const gate=document.getElementById('loginGate'),s=getComputedStyle(gate);
    return s.visibility==='hidden'&&Number(s.opacity)===0&&!!window.HaniHelperBot?.update;
   });
   await page.evaluate(()=>window.HaniHelperBot.update());
   await page.waitForFunction(()=>{
    const helper=document.getElementById('haniHelperBot');return helper&&!helper.hidden&&helper.dataset.helperReason==='shown'&&helper.getClientRects().length>0;
   });
   helperSetup.after=await page.evaluate(()=>({reason:document.getElementById('haniHelperBot').dataset.helperReason,gateVisibility:getComputedStyle(document.getElementById('loginGate')).visibility}));
   for(const item of cases){
    await page.evaluate(id=>{showView(id);if(id==='asset')renderAssets();if(id==='tasks')renderTasks();if(id==='monthlyReport')renderMonthlyReport()},item.id);
    await page.locator('#'+item.id+' '+item.selector).first().waitFor({state:'visible'});
    if(item.id!=='aura')await page.locator('#'+item.id+' '+item.selector).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const row=await page.evaluate(measure,{id:item.id,phase});Object.assign(row,{finish,items:item.items});
    await resolveScreenshotContrast(page,row,{out,prefix:`${phase}-${width}-${finish}-${item.id}`});report.cases.push(row);
    if(phase==='after'){
     check(row.overflow<=.5,'horizontal overflow',row);check(row.controlsOutside.length===0,'controls outside viewport',row);
     if(item.id==='intake'&&width===390){check(row.helperVisible,'helper must be visible for overlap QA',row);check(row.helperInViewport,'helper must remain inside viewport',row);check(row.overlaps.length===0,'helper overlaps composer control',row);}
     if(item.id==='investmentCommittee'){check(row.titleLines===1&&row.toolsBelow,'title own single row',row);check(row.filterLabelLines===1,'filter label split',row);}
     if(item.id==='monthlyReport'&&width===390)check(row.titlePhrases.length===2&&row.titlePhrases[1].top>row.titlePhrases[0].top,'two empty title phrases',row);
     if(item.id==='tasks'&&width===390)check(row.formBeforeSync&&row.domSyncBeforeForm,'CSS visual order/DOM ownership',row);
     if(['board','drive'].includes(item.id))check(row.searchHeight>=44,'search height',row);
    }
    const filename=`${phase}-${width}-${finish}-${item.id}.png`;await page.screenshot({path:path.join(out,filename),animations:'disabled'});report.screenshots.push(filename);
    // Passive rendering/style operation has its own precise, synchronous write boundary.
    const passive=await page.evaluate(id=>{
     const before=JSON.stringify(state),writes=window.__polishWrites.length;
     if(id==='asset')renderAssets();if(id==='tasks')renderTasks();if(id==='monthlyReport')renderMonthlyReport();if(id==='aura')syncThemeCollections();
     return {writes:window.__polishWrites.slice(writes),stateUnchanged:JSON.stringify(state)===before,lifeUnchanged:localStorage.getItem('hani_os_life_v23')===window.__polishLife};
    },item.id);row.passive=passive;check(passive.writes.length===0&&passive.stateUnchanged&&passive.lifeUnchanged,'passive render write/state safety',row);
    if(item.id==='intake'&&width===390){
     await page.locator('#yunaInput').focus();await page.locator('#yunaInput').evaluate(e=>{e.style.height='112px';window.dispatchEvent(new Event('resize'))});await page.waitForTimeout(100);
     const expanded=await page.evaluate(measure,{id:item.id,phase});row.expandedComposer=expanded;
     if(phase==='after')check(expanded.overlaps.length===0&&expanded.helperVisible,'expanded/focused composer overlap',expanded);
     if(phase==='after')check(expanded.helperInViewport,'expanded composer helper inside viewport',expanded);
    }
    if(item.id==='aura'){
     await page.locator('[data-panel="auraSeasons"]').click();await page.waitForTimeout(100);
     const thaw=await page.locator('#themeCollectionChoices .theme-collection-choice').evaluateAll(nodes=>nodes.map(n=>({phase:n.dataset.phase,applyDisabled:n.querySelector('[data-collection-apply]').disabled})));
     row.thaw=thaw;check(thaw.length===1&&thaw[0].applyDisabled,'THAW locked row preserved',row);
     const shot=`${phase}-${width}-${finish}-aura-season.png`;await page.screenshot({path:path.join(out,shot),animations:'disabled'});report.screenshots.push(shot);
    }
   }
   if(phase==='after'&&finish==='porcelain-cream')for(const f of finishes)for(const season of seasons)for(const id of ['intake','asset','procrastination']){
    await page.evaluate(({f,season,id})=>{showView(id);applySignatureFinish(f,false);applySeasonTheme(season,false);if(id==='asset')renderAssets()},{f,season,id});
    const combination=await page.evaluate(measure,{id,phase});Object.assign(combination,{finish:f,season});
    await resolveScreenshotContrast(page,combination,{out,prefix:`${phase}-${width}-${f}-${season}-${id}`});report.combinations.push(combination);
    for(const text of combination.contrast)check(!text.unresolved&&text.ratio>=4.5,'computed contrast below 4.5 or unresolved',{id,width,finish:f,season,text});
   }
   const writes=await page.evaluate(()=>window.__polishWrites);report.navigationWrites.push({phase,width,finish,writes});
   check(writes.every(w=>w.method==='setItem'&&w.key==='hani_os_navigation_v1'),'unexpected storage write outside passive boundary',{phase,width,finish,writes});
  }finally{await context.close()}
 }
 for(const after of report.cases.filter(r=>r.phase==='after'&&r.width===390&&r.id==='aura')){
  const before=report.cases.find(r=>r.phase==='before'&&r.width===after.width&&r.finish===after.finish&&r.id==='aura');
  check(after.introHeight<before.introHeight&&after.choicesTop<before.choicesTop,'mobile theme selection starts earlier',{before,after});
  check(after.choiceCount===before.choiceCount&&after.choiceCount===6,'all six Finish cards preserved',{before,after});
 }
 check(report.errors.length===0,'page exceptions',{errors:report.errors});
 report.result=report.failures.length?'FAIL':'PASS';if(report.failures.length)process.exitCode=1;
}catch(e){report.result='BLOCKED_OR_FAILED';report.error=e.stack;process.exitCode=1}
finally{
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2)+'\n');
 await browser?.close();await new Promise(resolve=>server.close(resolve));
 console.log(JSON.stringify({result:report.result,screenshots:report.screenshots.length,cases:report.cases.length,contrastCombinations:report.combinations.length,failures:report.failures.length,error:report.error?.split('\n')[0]}));
}
