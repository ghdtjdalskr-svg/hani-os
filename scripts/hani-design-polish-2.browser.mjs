// Seoyun only: node scripts/hani-design-polish-2.browser.mjs <playwright/index.mjs> <msedge.exe>
// --setup-only validates exact sources, matrix and HTTP serving without launching any browser.
// No inverse fs preload: before=independent main296; after=actual design2 disk bytes.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import inverse from './hani-design-polish-2-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {sampleBackgroundPixels} from './hani-design-polish-1-contrast.mjs';
const root=path.resolve(import.meta.dirname,'..');
const args=process.argv.slice(2),outputArg=args.find(a=>a.startsWith('--output-dir='));
const out=path.resolve(root,outputArg?.slice('--output-dir='.length)??'artifacts/design-polish-2/browser');
const browserArgs=args.filter(a=>!a.startsWith('--output-dir='));
const file='hani-design-system.css',after=inverse.readRawFileSync(path.join(root,file),'utf8'),before=inverse.restore(after,file);
assert.equal(before,repository.read(inverse.delta.base,file));
const cssBlock=inverse.delta.files[file].edits[0].after;
const topRules=(()=>{let depth=0,count=0;for(const c of cssBlock.replace(/\/\*[\s\S]*?\*\//g,'')){if(c==='{'){if(depth===0)count++;depth++}else if(c==='}')depth--;}assert.equal(depth,0);return count})();
const finishes=['porcelain-cream','pure-white','titanium-graphite','midnight-black','sakura-pink','alpine-blue'];
const seasons=['spring','summer','autumn','winter'];
const helpers=['certificate','ledger','game','tasks','investmentCommittee','investmentIntake','settings','travel','diet','exercise'];
const views=[...helpers,'aiWork','board','investment','study','newsroom','diary','dev','drive','aura','wishlist','ilbo','milestones','intake'];
// Required selectors may never disappear silently: a missing row is a FAIL.
const contrasts={
 travel:['.module-kpi .sub','.module-kpi small'],
 aiWork:['.member-role','.member-link::before','.member-copy p','.ai-team-profile-role'],
 board:['.board-tab[data-board-filter="WORK"]','.board-tab[data-board-filter="LIFE"]'],
 investment:['.investment-tabs-main .tab:not(.active)','.investment-live small','.broker-stats .label'],
 study:['.study-main-empty b','.study-main-empty span'],
 newsroom:['.newsroom-4cut-context td.is-down'],
 ledger:['.jispi-c .ledger-breaker-line strong','.jispi-c .ledger-jispi-head span'],
 diary:['[data-diary-view]'],diet:['.date-mode-toggle'],certificate:['.date-mode-toggle']
};
const report={result:'NOT_RUN',base:inverse.delta.base,sourceHashes:{before:inverse.hash(before),after:inverse.hash(after)},cases:[],combinations:[],screenshots:[],failures:[],observations:[],errors:[],storage:[],helperPolicy:{profile:'no stored position',gate:'scroll zero: no control overlaps',cards:'report-only',scrolledOverlaps:'report-only'},note:'Synthetic disposable profile, external requests blocked. CSS passive apply must write zero and preserve state/protected bytes. Existing navigation-only writes are recorded separately. All contrast rows use text-free worst PNG pixels (first-pass sampler), threshold 4.5 without rounding. No claim of PASS for missing/hidden selectors.'};
let phase='after',browser;
const check=(ok,message,details)=>{if(!ok)report.failures.push({message,...details})};
const server=http.createServer((req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\//,'')||'index.html',full=path.resolve(root,name);
  if(!full.startsWith(root+path.sep)||!fs.existsSync(full)||!fs.statSync(full).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(full)]||'application/octet-stream');
  res.end(name===file?({before,after})[phase]:inverse.readRawFileSync(full));
 }catch{res.writeHead(500);res.end('fixture server error')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;

// Real DOM geometry and computed values, no injected replacement renderer.
function measure({id,phase,checkpoint}){
 const view=document.getElementById(id),rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}},visible=e=>!!e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';
 const hit=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
 const row={id,phase,checkpoint,scrollY,width:innerWidth,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),controlsOutside:[],overlaps:[],contrast:[]};
 const helper=document.getElementById('haniHelperBot');row.helperVisible=!!visible(helper);row.helperReason=helper?.dataset.helperReason;row.helper=row.helperVisible?rect(helper):null;
 row.helperHasStoredPosition=localStorage.getItem('hani_helper_pos_v1')!==null;
 row.helperSafeBottom=helper?getComputedStyle(helper).getPropertyValue('--helper-safe-bottom').trim():null;
 row.helperInViewport=!!row.helper&&row.helper.left>=0&&row.helper.top>=0&&row.helper.right<=innerWidth&&row.helper.bottom<=innerHeight;
 for(const e of view.querySelectorAll('input:not([type="hidden"]),textarea,select,button,a[href],summary,[role="button"]')){
  if(!visible(e))continue;const r=rect(e);if(r.width&&(r.left<-.5||r.right>innerWidth+.5))row.controlsOutside.push({id:e.id,class:e.className,rect:r});
  if(row.helper&&hit(row.helper,r))row.overlaps.push({id:e.id,class:e.className,text:e.textContent.slice(0,70),rect:r});
 }
 row.cardOverlaps=[];
 for(const e of view.querySelectorAll('.card,.stat,.module-kpi,.sports-home-panel,.ic-card'))if(visible(e)&&row.helper&&hit(row.helper,rect(e)))row.cardOverlaps.push({id:e.id,class:e.className,rect:rect(e)});
 const banner=view.querySelector(':scope>.ds-main-character-banner');
 if(visible(banner)){const img=banner.querySelector('img');row.banner={...rect(banner),copyHeight:rect(banner.querySelector('.ds-main-character-banner__copy')).height,objectFit:getComputedStyle(img).objectFit,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight};}
 if(id==='exercise')row.exercise=[...view.querySelectorAll('#exerciseStats>.stat')].map(rect);
 if(id==='board')row.tabs=[...view.querySelectorAll('.board-tab')].map(e=>({text:e.textContent,...rect(e)}));
 if(id==='dev')row.meta=[...view.querySelectorAll('.hani-history-meta,.hani-history-meta span,.hani-history-meta time,.hani-history-row code,.hani-history-row summary')].filter(visible).map(e=>({font:parseFloat(getComputedStyle(e).fontSize),height:rect(e).height,tag:e.tagName}));
 if(id==='game')row.gameMeta=[...view.querySelectorAll('.sports-league,.sports-home-identity small,.sports-home-recent small,.sports-home-foot>span,.sports-result>div:first-child>span')].filter(visible).map(e=>({font:parseFloat(getComputedStyle(e).fontSize),text:e.textContent}));
 if(id==='aura'||id==='drive')row.checkboxes=[...view.querySelectorAll(id==='drive'?'.gdrive-fulltext input':'#launchGreetingEnabled')].filter(visible).map(e=>({box:rect(e),label:rect(e.closest('label')),checked:e.checked}));
 if(id==='wishlist'||id==='ilbo'||id==='milestones')row.wrapping=[...view.querySelectorAll(id==='wishlist'?'.empty':id==='milestones'?'.ms-tier small':'h1,h2,h3,.ilbo-headline')].filter(visible).map(e=>({wordBreak:getComputedStyle(e).wordBreak,text:e.textContent.slice(0,100)}));
 if(id==='diet'||id==='certificate')row.dateInputs=[...view.querySelectorAll('input[type="date"],input[type="month"]')].filter(visible).map(e=>({scheme:getComputedStyle(e).colorScheme}));
 return row;
}

async function contrastRows(page,id,prefix){
 const rows=[];
 for(const selector of contrasts[id]??[]){
  const pseudo=selector.endsWith('::before')?'::before':null,elementSelector=selector.replace(/::before$/,'');
  const locator=page.locator('#'+id+' '+elementSelector).first();
  if(!await locator.count()||!await locator.isVisible()){rows.push({selector,unresolved:'missing/hidden'});continue;}
  await locator.scrollIntoViewIfNeeded();
  const geometry=await locator.evaluate((e,pseudo)=>{
   const r=e.getBoundingClientRect(),padding=6;
   let left=Math.max(0,Math.floor(r.left-padding)),top=Math.max(0,Math.floor(r.top-padding)),right=Math.min(innerWidth,Math.ceil(r.right+padding)),bottom=Math.min(innerHeight,Math.ceil(r.bottom+padding));
   const style=getComputedStyle(e,pseudo),canvas=document.createElement('canvas');canvas.width=canvas.height=1;const c=canvas.getContext('2d',{willReadFrequently:true});
   // A button/cell's external margin is not its text background. Constrain the
   // original sampler to the nearest opaque painting surface, inside its border.
   let surface=null;const cornerRects=[];
   for(let n=e;n;n=n.parentElement){
    const s=getComputedStyle(n);c.clearRect(0,0,1,1);c.fillStyle=s.backgroundColor;c.fillRect(0,0,1,1);
    if(c.getImageData(0,0,1,1).data[3]!==255)continue;
    const b=n.getBoundingClientRect();surface={tag:n.tagName,id:n.id,left:b.left,right:b.right,top:b.top,bottom:b.bottom};
    left=Math.max(left,Math.ceil(b.left+Math.max(1,parseFloat(s.borderLeftWidth))));right=Math.min(right,Math.floor(b.right-Math.max(1,parseFloat(s.borderRightWidth))));top=Math.max(top,Math.ceil(b.top+Math.max(1,parseFloat(s.borderTopWidth))));bottom=Math.min(bottom,Math.floor(b.bottom-Math.max(1,parseFloat(s.borderBottomWidth))));
    // Rounded cutouts paint the outer card, rather than the text's own surface.
    for(const [property,x,y]of [['borderTopLeftRadius',0,0],['borderTopRightRadius',1,0],['borderBottomLeftRadius',0,1],['borderBottomRightRadius',1,1]]){const radius=Math.min(parseFloat(s[property])||0,b.width/2,b.height/2);if(radius)cornerRects.push({left:x?b.right-radius:b.left,right:x?b.right:b.left+radius,top:y?b.bottom-radius:b.top,bottom:y?b.bottom:b.top+radius});}
    break;
   }
   const textRects=[...cornerRects],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){const node=walker.currentNode;if(!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);for(const b of range.getClientRects())if(b.left<right+2&&b.right>left-2&&b.top<bottom+2&&b.bottom>top-2)textRects.push({left:b.left,right:b.right,top:b.top,bottom:b.bottom});}
   if(pseudo)textRects.push({left:r.left,right:r.right,top:r.top,bottom:r.bottom});
   c.clearRect(0,0,1,1);c.fillStyle=style.color;c.fillRect(0,0,1,1);const rgba=[...c.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);
   const effects=[];for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(Number(s.opacity)!==1||s.filter!=='none'||s.mixBlendMode!=='normal')effects.push(n.tagName);}
   return {clip:{x:left,y:top,width:right-left,height:bottom-top},textRects,color:rgba,colorCss:style.color,effects,surface};
  },pseudo);
  if(geometry.effects.length||geometry.clip.width<=0||geometry.clip.height<=0){rows.push({selector,unresolved:'opacity/filter/blend/geometry',geometry});continue;}
  const filename=prefix+'-contrast-'+rows.length+'.png',png=await page.screenshot({path:path.join(out,filename),clip:geometry.clip,type:'png',animations:'disabled',scale:'css'});
  const sample=await page.evaluate(sampleBackgroundPixels,{png:png.toString('base64'),...geometry});
  rows.push({selector,...sample,geometry,screenshot:filename,method:'first-pass text-free worst PNG pixel'});
 }
 return rows;
}

try{
 if(process.argv.includes('--setup-only')){
  for(phase of ['before','after'])assert.equal(await (await fetch(origin+'/'+file)).text(),({before,after})[phase]);
  assert.equal(views.length,23);assert.equal(finishes.length*seasons.length,24);assert.equal(helpers.length,10);
  console.log(JSON.stringify({result:'SETUP_PASS',views:views.length,beforeAfterShots:views.length*8,contrastCombinations:24*2*Object.keys(contrasts).length,base:inverse.delta.base,browserLaunched:false}));
 }else{
  fs.mkdirSync(out,{recursive:true});assert.ok(browserArgs[0]&&browserArgs[1],'Supply Playwright module and Edge executable paths, or --setup-only');
  const {chromium}=await import(pathToFileURL(path.resolve(browserArgs[0])).href);browser=await chromium.launch({headless:true,executablePath:browserArgs[1]});
  for(phase of ['before','after'])for(const width of [1440,390])for(const finish of ['porcelain-cream','midnight-black']){
   const context=await browser.newContext({viewport:{width,height:width===390?844:1000},deviceScaleFactor:1,timezoneId:'Asia/Seoul',reducedMotion:'reduce',serviceWorkers:'block'});
   try{
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    await context.addInitScript(()=>{
     const Real=Date,fixed=Real.parse('2026-11-17T12:00:00+09:00');window.Date=class extends Real{constructor(...a){super(...(a.length?a:[fixed]))}static now(){return fixed}};
     // Each new disposable context starts without a saved helper position.
    });
    const page=await context.newPage();page.on('pageerror',e=>report.errors.push({phase,width,finish,message:e.message}));page.on('dialog',d=>d.dismiss());
    await page.goto(origin,{waitUntil:'load'});await page.waitForFunction(()=>typeof loginGateInitialized!=='undefined'&&loginGateInitialized&&typeof showView==='function'&&typeof state==='object');
    const parsedRules=await page.evaluate(css=>{const sheet=new CSSStyleSheet();sheet.replaceSync(css);return sheet.cssRules.length},cssBlock);
    check(parsedRules===topRules,'CSSOM dropped a design2 rule',{phase,width,finish,expected:topRules,actual:parsedRules});
    await page.evaluate(finish=>{
     cloudStopAutoSync();unlockLoginGate();applySignatureFinish(finish,false);applySeasonTheme('autumn',false);
     state.diaries=[{id:'design2-synthetic-diary',date:'2026-11-17',title:'디자인 확인용',content:'합성 일기입니다.',mood:'happy'}];renderDiary();
     window.__design2Writes=[];for(const method of ['setItem','removeItem','clear']){const old=Storage.prototype[method];Storage.prototype[method]=function(...args){window.__design2Writes.push({method,key:args[0]??null});return old.apply(this,args)}}
     window.__design2Life=localStorage.getItem('hani_os_life_v23');window.__design2Position=localStorage.getItem('hani_helper_pos_v1');
     if(window.__design2Position!==null)throw new Error('Default helper fixture must have no stored position');
    },finish);
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>{const s=getComputedStyle(document.getElementById('loginGate'));return s.visibility==='hidden'&&Number(s.opacity)===0&&!!window.HaniHelperBot?.update});
    await page.evaluate(()=>window.HaniHelperBot.update());await page.waitForFunction(()=>{const h=document.getElementById('haniHelperBot');return h&&!h.hidden&&h.dataset.helperReason==='shown'});
    for(const id of views){
     await page.evaluate(id=>{showView(id);window.scrollTo(0,0)},id);await page.locator('#'+id).waitFor({state:'visible'});await page.waitForTimeout(300);
     // Navigation can restore scroll on a later frame; measure only after it settles.
     await page.evaluate(()=>{window.scrollTo({top:0,left:0,behavior:'instant'});window.HaniHelperBot.update()});
     await page.waitForFunction(()=>window.scrollY===0);
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     const row=await page.evaluate(measure,{id,phase,checkpoint:'top'});Object.assign(row,{finish});report.cases.push(row);
     const filename=`${phase}-${width}-${finish}-${id}.png`;await page.screenshot({path:path.join(out,filename),animations:'disabled'});report.screenshots.push(filename);
     if(phase==='after'){
      check(row.overflow<=.5,'horizontal overflow',row);check(row.controlsOutside.length===0,'controls outside viewport',row);
      if(width===390&&helpers.includes(id)){
       check(row.scrollY===0,'helper first screen at scroll zero',row);
       check(!row.helperHasStoredPosition,'helper first screen without stored position',row);
       check(row.helperVisible&&row.helperInViewport,'visible helper inside viewport',row);
       check(!row.overlaps.length,'helper overlaps first-screen controls',row);
       report.observations.push({message:'first-screen card overlaps',policy:'report-only',...row});
      }
      if(width===390&&row.banner)check(row.banner.height<236&&row.banner.objectFit==='contain'&&row.banner.naturalWidth>0,'short complete mobile banner',row);
      if(width===390&&id==='exercise'){const a=row.exercise;check(a.length===5&&Math.abs(a[4].width-(a[1].right-a[0].left))<=1,'exercise fifth summary spans both columns',row);}
      if(width===390&&id==='board'){const a=row.tabs;check(a.length===6&&a[0].top===a[2].top&&a[3].top===a[5].top&&a[3].top>a[0].top,'board balanced 3 by 2 tabs',row);}
      for(const b of row.checkboxes??[])check(b.box.width===18&&b.box.height===18&&b.label.height>=44,'checkbox visual/hit area',row);
      for(const m of row.meta??[])check(m.font>=(m.tag==='SUMMARY'?14:13)&&(m.tag!=='SUMMARY'||m.height>=44),'readable dev metadata/summary',row);
      for(const m of row.gameMeta??[])check(m.font>=12,'readable league/date',row);
      for(const m of row.wrapping??[])check(m.wordBreak==='keep-all','Korean word wrapping',row);
      for(const m of row.dateInputs??[])check(m.scheme==='light','native calendar indicator surface pairing',row);
     }
     // Check CSS application as a passive operation. Do not call a renderer that
     // is allowed to persist preferences and then call that a CSS storage write.
     row.passive=await page.evaluate(()=>{
      const start=window.__design2Writes.length,stateBefore=JSON.stringify(state),life=localStorage.getItem('hani_os_life_v23'),position=localStorage.getItem('hani_helper_pos_v1');
      const link=[...document.querySelectorAll('link[rel="stylesheet"]')].find(e=>e.href.includes('hani-design-system.css'));link.disabled=true;void document.body.offsetHeight;link.disabled=false;void document.body.offsetHeight;
      return {writes:window.__design2Writes.slice(start),stateUnchanged:JSON.stringify(state)===stateBefore,lifeUnchanged:life===localStorage.getItem('hani_os_life_v23'),positionUnchanged:position===localStorage.getItem('hani_helper_pos_v1')};
     });check(!row.passive.writes.length&&row.passive.stateUnchanged&&row.passive.lifeUnchanged&&row.passive.positionUnchanged,'CSS storage/state safety',row);
     if(width===390&&helpers.includes(id))for(const checkpoint of ['middle','bottom']){
      await page.evaluate(checkpoint=>window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*(checkpoint==='middle'?.5:1)),checkpoint);await page.waitForTimeout(150);
      const scrolled=await page.evaluate(measure,{id,phase,checkpoint});Object.assign(scrolled,{finish});report.cases.push(scrolled);
      const name=`${phase}-${width}-${finish}-${id}-${checkpoint}.png`;await page.screenshot({path:path.join(out,name),animations:'disabled'});report.screenshots.push(name);
      if(phase==='after'){check(scrolled.helperVisible&&scrolled.helperInViewport,'scrolled helper visible',scrolled);report.observations.push({message:'scrolled helper overlaps controls/cards',policy:'report-only',...scrolled});check(scrolled.overflow<=.5,'scrolled horizontal overflow',scrolled);}
     }
    }
    if(phase==='after'&&finish==='porcelain-cream')for(const f of finishes)for(const season of seasons)for(const id of Object.keys(contrasts)){
     await page.evaluate(({f,season,id})=>{showView(id);applySignatureFinish(f,false);applySeasonTheme(season,false)},{f,season,id});await page.waitForTimeout(100);
     const row={id,width,finish:f,season,contrast:await contrastRows(page,id,`${width}-${f}-${season}-${id}`)};report.combinations.push(row);
     for(const t of row.contrast)check(!t.unresolved&&t.ratio>=4.5,'pixel contrast below 4.5 or unresolved',{id,width,finish:f,season,text:t});
    }
    const storage=await page.evaluate(()=>({writes:window.__design2Writes,lifeUnchanged:localStorage.getItem('hani_os_life_v23')===window.__design2Life,positionUnchanged:localStorage.getItem('hani_helper_pos_v1')===window.__design2Position}));report.storage.push({phase,width,finish,...storage});
    check(storage.lifeUnchanged&&storage.positionUnchanged&&storage.writes.every(w=>w.method==='setItem'&&w.key==='hani_os_navigation_v1'),'unexpected non-navigation storage write',{phase,width,finish,...storage});
   }finally{await context.close()}
  }
  for(const row of report.cases.filter(r=>r.phase==='after'&&r.width===390&&r.checkpoint==='top'&&r.banner)){
   const old=report.cases.find(r=>r.phase==='before'&&r.width===390&&r.finish===row.finish&&r.id===row.id&&r.checkpoint==='top');
   check(old?.banner&&row.banner.height<old.banner.height,'banner gets shorter than actual main296',{id:row.id,finish:row.finish,before:old?.banner,after:row.banner});
  }
  check(report.errors.length===0,'page exceptions',{errors:report.errors});report.result=report.failures.length?'FAIL':'PASS';if(report.failures.length)process.exitCode=1;
 }
}catch(e){report.result='BLOCKED_OR_FAILED';report.error=e.stack;process.exitCode=1}
finally{
 if(!process.argv.includes('--setup-only')){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,cases:report.cases.length,screenshots:report.screenshots.length,combinations:report.combinations.length,failures:report.failures.length,error:report.error?.split('\n')[0]}));}
 await browser?.close();await new Promise(resolve=>server.close(resolve));
}
