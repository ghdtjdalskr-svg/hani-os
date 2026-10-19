// Real index.html in disposable Edge; all external requests blocked.
// node scripts/hani-remote-media-219.test.mjs [playwright index.mjs] [browser exe] [--before]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {localBrowser} from './hani-contrast-audit.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/remote-219');
fs.mkdirSync(out,{recursive:true});
const deps=process.argv[2]||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const exe=process.argv[3]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const before=process.argv.includes('--before'),phase=before?'before':'after';
const report={phase,status:'RUNNING',cases:[],contrast:[],actions:[],errors:[],consoleErrors:[],externalStubs:[]};
report.base='974fa64df67a3c0060bdf0eda951aafeaf5a9b11';
report.sourceHashes=Object.fromEntries(['hani-context-remote-v1.js','hani-context-remote.css','hani-main.js','hani-ui-v02992.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
report.method='Disposable Edge, real index and real handler bodies. Four lexical navigation/target entry spies; real DOM focus/scroll/profile results. External dependencies empty-stubbed; AA measures composited visible text pixels; theme interior comparison tolerates 1/255 GPU rounding.';
report.foldCases=[];
const sharp=createRequire(pathToFileURL(deps))('sharp');
const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
// Every composited background pixel under each visible text range, including glyphs.
// Hide only text fill/shadow for the capture; layout, image, scrim and buttons remain.
async function pixelAudit(page){
 const entries=await page.locator('.hani-remote-media').evaluate(card=>{
  const entries=[],walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
   const el=node.parentElement;if(!node.textContent.trim()||!el.checkVisibility({checkVisibilityCSS:true,checkOpacity:true}))continue;
   const style=getComputedStyle(el),canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=style.color;ctx.fillRect(0,0,1,1);const fg=[...ctx.getImageData(0,0,1,1).data];
   const range=document.createRange();range.selectNodeContents(node);let opacity=1;for(let e=el;e;e=e.parentElement)opacity*=Number(getComputedStyle(e).opacity);
   const cr=card.getBoundingClientRect();let clip={left:cr.left,right:cr.right,top:cr.top,bottom:cr.bottom};
   for(let e=el;e;e=e.parentElement)if(/hidden|clip|auto|scroll/.test(getComputedStyle(e).overflow)){const r=e.getBoundingClientRect();clip={left:Math.max(clip.left,r.left),right:Math.min(clip.right,r.right),top:Math.max(clip.top,r.top),bottom:Math.min(clip.bottom,r.bottom)}}
   for(const r of range.getClientRects()){
    const box={left:Math.max(r.left,clip.left),right:Math.min(r.right,clip.right),top:Math.max(r.top,clip.top),bottom:Math.min(r.bottom,clip.bottom)};
    if(box.right-box.left<2||box.bottom-box.top<2)continue;
    const hit=document.elementFromPoint((box.left+box.right)/2,(box.top+box.bottom)/2);if(hit!==el&&!el.contains(hit))continue;
    entries.push({text:node.textContent.trim(),fg,opacity,...box});
   }
  }return entries;
 });
 const style=await page.addStyleTag({content:'.hani-remote-media,.hani-remote-media *{-webkit-text-fill-color:transparent!important;text-shadow:none!important}'});
 let png;try{png=await page.screenshot({animations:'disabled'})}finally{await style.evaluate(e=>e.remove())}
 const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
 return entries.map(e=>{let min=Infinity,samples=0;for(let y=Math.ceil(e.top)+1;y<Math.floor(e.bottom)-1;y++)for(let x=Math.ceil(e.left)+1;x<Math.floor(e.right)-1;x++){
  const i=(y*info.width+x)*info.channels,bg=[data[i],data[i+1],data[i+2]],a=e.fg[3]/255*e.opacity,fg=e.fg.slice(0,3).map((v,k)=>v*a+bg[k]*(1-a));min=Math.min(min,ratio(fg,bg));samples++;
 }return {text:e.text,minRatio:min,samples}}).filter(e=>e.samples);
}
// Measure the committed pre-219 runtime in the same browser, without a locally
// retained before.json. This fixture is regenerated from a fixed release identity.
async function measureBaseline(browser,origin){
 const context=await browser.newContext({viewport:{width:1440,height:900}}),cache=new Map(),cases=[];
 const git=process.env.HANI_GIT_PATH||process.env.HANI_GIT||'git';
 const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
 try{
  await context.route('**/*',r=>{
   const url=new URL(r.request().url());
   if(url.origin!==origin)return r.fulfill({status:200,body:''});
   const file=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html',type=types[path.extname(file)];
   if(!type)return r.continue();
   if(!cache.has(file))cache.set(file,execFileSync(git,['show',report.base+':'+file],{cwd:root,maxBuffer:32*1024*1024}));
   return r.fulfill({status:200,body:cache.get(file),contentType:type});
  });
  const page=await context.newPage();await page.goto(origin);await page.waitForFunction(()=>!!window.HANI_CONTEXT_REMOTE_V1);await page.evaluate(()=>unlockLoginGate());
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});
   for(const view of ['reading','investment','exercise','geminiReports']){
    await page.evaluate(view=>{showView(view);applySignatureFinish('porcelain-cream',false);applySeasonTheme('autumn',false)},view);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    if(width===390&&await page.locator('#haniContextRemote').getAttribute('data-open')!=='true')await page.locator('.hani-remote-mobile-trigger').click();
    await page.locator('#haniContextRemote').evaluate(async rail=>{rail.scrollTop=0;await rail.querySelector('img').decode()});await page.waitForTimeout(300);
    const geometry=await page.locator('#haniContextRemote').evaluate(n=>({width:n.clientWidth,height:n.clientHeight,scroll:n.scrollHeight,overflow:n.scrollWidth>n.clientWidth+1}));
    cases.push({width,view,geometry});
   }
  }
  const result={base:report.base,cases,sourceHashes:Object.fromEntries([...cache].map(([file,body])=>[file,crypto.createHash('sha256').update(body).digest('hex')]))};
  fs.writeFileSync(path.join(out,'baseline-scroll.json'),JSON.stringify(result,null,2));return result;
 }finally{await context.close()}
}

let env;
try{
 env=await localBrowser(deps,exe);const {page,origin}=env;
 const baseline=!before&&!process.argv.includes('--actions-only')?await measureBaseline(env.browser,origin):null;
 if(baseline)report.scrollBaseline=baseline;
 // Empty local responses for external dependencies prevent artificial ERR_FAILED noise.
 // No external service, production storage or authenticated account is contacted.
 await page.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();const type=r.request().resourceType();report.externalStubs.push(type);return r.fulfill({status:200,body:'',contentType:type==='script'?'application/javascript':type==='stylesheet'?'text/css':'text/plain'})});
 if(!before){
  // Spy at the existing lexical action entries; retain and execute their real bodies.
  // This also distinguishes a handler call from a legacy target that no longer exists.
  let source=fs.readFileSync(path.join(root,'hani-context-remote-v1.js'),'utf8');
  for(const [name,arg] of [['goView','id'],['moveTo','selector'],['focusTarget','selector'],['resolveTarget','selector']]){
   const anchor=`const ${name}=${arg}=>{`;assert.ok(source.includes(anchor));source=source.replace(anchor,`${anchor}(window.remoteCallTrace||=[]).push(['${name}',${arg}]);`);
  }
  await page.route('**/hani-context-remote-v1.js?*',r=>r.fulfill({status:200,contentType:'application/javascript',body:source}));
 }
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});
 await page.goto(origin);await page.waitForFunction(()=>!!window.HANI_CONTEXT_REMOTE_V1);
 await page.evaluate(()=>{unlockLoginGate();window.remoteWrites=[];for(const method of ['setItem','removeItem','clear']){const original=Storage.prototype[method];Storage.prototype[method]=function(...args){window.remoteWrites.push({method,key:args[0]});return original.apply(this,args)}}});
 for(const width of process.argv.includes('--actions-only')?[]:[1440,390]){
  await page.setViewportSize({width,height:900});
  for(const view of ['reading','investment','exercise','geminiReports']){
   await page.evaluate(view=>{showView(view);applySignatureFinish('porcelain-cream',false);applySeasonTheme('autumn',false)},view);
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   if(width===390&&await page.locator('#haniContextRemote').getAttribute('data-open')!=='true')await page.locator('.hani-remote-mobile-trigger').click();
   await page.locator('#haniContextRemote').evaluate(async rail=>{rail.scrollTop=0;await rail.querySelector('img').decode()});
   await page.waitForTimeout(300);
   const geometry=await page.locator('#haniContextRemote').evaluate(n=>({width:n.clientWidth,height:n.clientHeight,scroll:n.scrollHeight,overflow:n.scrollWidth>n.clientWidth+1}));
   await page.screenshot({path:path.join(out,`${phase}-${view}-${width}.png`)});
   report.cases.push({width,view,geometry});assert.equal(geometry.overflow,false);
   if(!before){
    const old=baseline.cases.find(c=>c.width===width&&c.view===view);
    assert.ok(geometry.scroll-geometry.height<=old.geometry.scroll-old.geometry.height,'no added internal scroll at '+width+'/'+view);
   }
  }
 }
 if(!before){
  // Seed only this disposable browser through the existing owner. Full-view coverage
  // includes the pre-existing Backup and Newsroom tab controls, which call save().
  // Preserve all business data/other keys; permit only those owners' UI/timestamps.
  await page.evaluate(()=>{save();navigationPersist('home',0)});
  const storageSnapshot=()=>Object.fromEntries(Object.entries(localStorage).map(([key,value])=>{
   if(key==='hani_os_life_v23'){
    const data=JSON.parse(value);delete data.meta.lastSavedAt;delete data.meta.lastBackupAt;delete data.ui.investmentNewsMode;value=JSON.stringify(data);
   }else if(key==='hani_os_navigation_v1')value='existing route/scroll/report-tab preference';
   return [key,value];
  }));
  const storageBefore=await page.evaluate(storageSnapshot);
  const invariant=new Map();
  await page.evaluate(()=>{window.remoteSlot=document.querySelector('.hani-remote-media');window.remoteImage=remoteSlot.querySelector('img');window.remoteButtons=[...remoteSlot.querySelectorAll('button')];window.remoteLinks=[...document.querySelectorAll('[data-remote-links] button')]});
  for(const width of process.argv.includes('--actions-only')?[]:[1440,390,884])for(const finish of ['porcelain-cream','midnight-black','pure-white'])for(const view of ['reading','investment','exercise','geminiReports']){
   await page.setViewportSize({width,height:844});
   await page.evaluate(({finish,view})=>{applySignatureFinish(finish,false);showView(view)}, {finish,view});
   if(width===390)await page.locator('.hani-remote-mobile-trigger').click();
   await page.locator('#haniContextRemote').evaluate(async n=>{n.scrollTop=0;await n.querySelector('img').decode()});
   await page.waitForTimeout(260);await page.mouse.move(0,0);
   const identity=await page.evaluate(()=>{
    const card=document.querySelector('.hani-remote-media'),hero=HANI_MAIN_CHARACTER_BANNER.get(document.body.dataset.view),img=card.querySelector('img');
    return {same:card===remoteSlot&&img===remoteImage&&remoteButtons.every((b,i)=>b===card.querySelectorAll('button')[i])&&remoteLinks.every((b,i)=>b===document.querySelectorAll('[data-remote-links] button')[i]),src:img.getAttribute('src'),hero:hero.sceneImage,banner:document.querySelector('.view.active > .ds-main-character-banner img')?.getAttribute('src'),title:card.querySelector('h2').textContent,expectedTitle:document.querySelector('#title').textContent,staff:card.querySelector('[data-remote-media-staff]').textContent,expectedStaff:'담당 직원 · '+hero.speaker,background:getComputedStyle(card).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth+1,railOverflow:document.querySelector('#haniContextRemote').scrollWidth>document.querySelector('#haniContextRemote').clientWidth+1};
   });
   assert.ok(identity.same,'persistent DOM');assert.equal(identity.src,identity.hero);assert.equal(identity.src,identity.banner);assert.equal(identity.title,identity.expectedTitle);assert.equal(identity.staff,identity.expectedStaff);assert.equal(identity.background,'rgb(23, 20, 30)');assert.equal(identity.overflow,false);assert.equal(identity.railOverflow,false);
   if(width===884){assert.equal(await page.locator('.hani-remote-media').evaluate(n=>n.getBoundingClientRect().width),46);report.foldCases.push({finish,view,...identity});if(finish==='porcelain-cream')await page.screenshot({path:path.join(out,`after-${view}-884.png`)});continue}
   assert.ok(await page.locator('#haniContextRemote').evaluate(n=>n.scrollHeight<=n.clientHeight+1)||width===1440,'390x844 no new scrolling');
   const entries=await pixelAudit(page);assert.ok(entries.length>=12);assert.ok(entries.every(e=>e.minRatio>=4.5),JSON.stringify({width,finish,view,failed:entries.filter(e=>e.minRatio<4.5)}));report.contrast.push({width,finish,view,state:'rest',min:Math.min(...entries.map(e=>e.minRatio)),entries});
   const png=await page.locator('.hani-remote-media').screenshot(),{width:w,height:h}=await sharp(png).metadata();fs.writeFileSync(path.join(out,`card-${width}-${view}-${finish}.png`),png);const raw=await sharp(png).extract({left:24,top:24,width:w-48,height:h-48}).raw().toBuffer(),key=width+'/'+view;
   // Exclude rounded corners showing the page. GPU rasterization can vary by 1/255.
   if(invariant.has(key)){const base=invariant.get(key);assert.equal(raw.length,base.length);let max=0;for(let i=0;i<raw.length;i++)max=Math.max(max,Math.abs(raw[i]-base[i]));assert.ok(max<=1,`${key}/${finish}: theme pixel delta ${max}`);report.themeMaxPixelDelta=Math.max(report.themeMaxPixelDelta||0,max)}else invariant.set(key,raw);
   if(view==='reading')for(const action of ['primary','yuna','agent','recent'])for(const state of ['hover','focus']){
    const button=page.locator(`.hani-remote-media [data-remote-action="${action}"]`);if(state==='hover')await button.hover();else {await page.mouse.move(0,0);await page.keyboard.press('Tab');await button.focus();assert.ok(await button.evaluate(n=>n.matches(':focus-visible')))}
    const entries=await pixelAudit(page);assert.ok(entries.every(e=>e.minRatio>=4.5),JSON.stringify({width,finish,action,state,entries}));report.contrast.push({width,finish,view,state,action,min:Math.min(...entries.map(e=>e.minRatio))});
   }
   await page.locator('.hani-remote-media h2').evaluate(n=>{n.tabIndex=-1;n.focus();n.removeAttribute('tabindex')});
  }
  // Direct calls and canonical Season API update without observers or DOM reconstruction.
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(()=>{showView('aura');applySeasonTheme('summer',false)});
  const fallback=await page.locator('.hani-remote-media img').getAttribute('src');assert.equal(fallback,await page.evaluate(()=>HANI_MAIN_CHARACTER_BANNER.get('home').sceneImage),'no-hero view shares the current seasonal artwork');
  await page.evaluate(()=>{showView('home');applySeasonTheme('winter',false)});
  assert.equal(await page.locator('.hani-remote-media img').getAttribute('src'),await page.locator('#seasonalLifeArtwork').getAttribute('src'));
  // Observe the real DOM effect of every action, not merely entry into its handler.
  await page.evaluate(()=>{
   window.actionElements=[];
   for(const method of ['scrollIntoView','focus']){
    const original=HTMLElement.prototype[method];HTMLElement.prototype[method]=function(...args){
     if(!this.closest('#haniContextRemote'))actionElements.push({method,el:this});
     return original.apply(this,args);
    };
   }
  });
  const routes=await page.evaluate(()=>[...new Set([...document.querySelectorAll('.view[id]')].map(n=>n.id).concat([...document.querySelectorAll('#sidebar [data-view]')].map(n=>n.dataset.view),'organization/people','organization/aiTeam','settings/policy','investmentCommittee/monthly'))]);
  const routeFilter=process.argv.find(a=>a.startsWith('--route='))?.slice(8);
  for(const view of routes.filter(v=>!routeFilter||v===routeFilter))for(const action of ['primary','yuna','agent','recent']){
   const traces=[];
   for(const parent of ['.hani-remote-nav','.hani-remote-media']){
    const initial=await page.evaluate(view=>{
     document.querySelectorAll('dialog[open]').forEach(n=>n.close());document.querySelectorAll('.modal.open').forEach(n=>n.classList.remove('open'));
     showView(view);
     // Begin on another real tab, or with the input form closed, to catch stale targets.
     const opposite={investment:'[data-panel="investManage"]',study:'[data-study-tab="wrong"]',game:'[data-sports-tab="kia"]',newsroom:'[data-newsroom-mode="general"]',monthlyReport:'[data-report-board="quarterly"]',settings:'[data-settings-tab="policy"]'};
     document.querySelector('#'+document.body.dataset.view+' '+(opposite[document.body.dataset.view]||'[data-no-remote-test-tab]'))?.click();
     document.querySelectorAll('.view.active details').forEach(n=>n.open=false);
     const form=document.querySelector('#studyProjectForm');if(form)form.hidden=true;
     HANI_CONTEXT_REMOTE_V1.update();
     const hero=HANI_MAIN_CHARACTER_BANNER.get(document.body.dataset.view),owner=hero?.owner||({aura:'hani',shopping:'hani'}[view])||'hani';
     return {view:document.body.dataset.view,hash:location.hash,owner,name:HaniOrganizationRoster.people.find(p=>p.id===owner)?.name};
    },view);
    const button=page.locator(parent+' [data-remote-action="'+action+'"]');
    assert.equal(await button.count(),1,view+'/'+action+' persistent slot');
    if(await button.getAttribute('hidden')!==null){
     assert.equal(await button.isVisible(),false,view+'/'+action+' unavailable action hidden');
     traces.push({hidden:true});continue;
    }
    await button.scrollIntoViewIfNeeded();
    await page.evaluate(()=>{window.actionElements=[];window.remoteCallTrace=[]});
    await button.click();
    if(action==='yuna')await page.waitForFunction(()=>['yunaInput','intakeSourceText'].includes(document.activeElement?.id));
    await page.waitForFunction(initial=>{
     const focused=actionElements.some(({method,el})=>method==='focus'&&el.isConnected&&el.checkVisibility({checkVisibilityCSS:true})&&document.activeElement===el);
     if(remoteCallTrace.some(([name])=>name==='focusTarget'))return focused;
     return focused||document.body.dataset.view!==initial.view||location.hash!==initial.hash||actionElements.some(({method,el})=>{const r=el.getBoundingClientRect();return method==='scrollIntoView'&&el.isConnected&&el.checkVisibility({checkVisibilityCSS:true})&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth});
    },initial,{timeout:5000});
    await page.waitForTimeout(80);
    const result=await page.evaluate(()=>{
     const describe=el=>el.id?'#'+el.id:el.tagName.toLowerCase()+'.'+[...el.classList].join('.');
     const effects=actionElements.map(({method,el})=>{const r=el.getBoundingClientRect();return {method,target:describe(el),exists:el.isConnected,visible:el.checkVisibility({checkVisibilityCSS:true}),inViewport:r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth,rect:{top:r.top,bottom:r.bottom,left:r.left,right:r.right},focused:document.activeElement===el}});
     const dialog=document.querySelector('#haniOrganizationHub dialog[open]');
     return {view:document.body.dataset.view,hash:location.hash,effects,calls:remoteCallTrace,profile:dialog?{title:dialog.querySelector('h2')?.textContent,portrait:dialog.querySelector('img')?.getAttribute('src')}:null,investmentTab:document.querySelector('#investMonthly')?.classList.contains('active'),studyTab:document.querySelector('[data-study-tab="history"]')?.classList.contains('is-active')};
    });
    const key=view+'/'+action+'/'+parent;
    assert.ok(result.view!==initial.view||result.hash!==initial.hash||result.effects.some(e=>e.exists&&e.visible&&(e.method==='focus'?e.focused:e.inViewport)),key+' must have a real route/focus/visible scroll effect: '+JSON.stringify(result));
    if(action==='agent'){
     assert.equal(result.hash,'#organization/people/'+initial.owner,key+' canonical owner deep-link');
     assert.ok(result.profile?.title.includes(initial.name),key+' correct staff detail shown');
     assert.ok(result.profile?.portrait?.includes('hani-profile-'+initial.owner),key+' correct staff portrait');
    }
    if(action==='yuna')assert.ok(result.effects.some(e=>e.method==='focus'&&e.focused&&e.visible&&['#yunaInput','#intakeSourceText'].includes(e.target)),key+' quick input focused: '+JSON.stringify(result));
    if(initial.view==='investment'&&action==='recent')assert.equal(result.investmentTab,true,key+' monthly tab active');
    if(initial.view==='exercise'&&action==='primary')assert.ok(result.effects.some(e=>e.target==='#exerciseSteps'&&e.focused),key+' current exercise input');
    if(initial.view==='study'&&action==='recent')assert.equal(result.studyTab,true,key+' history tab active');
    assert.ok(result.calls.length,key+' existing canonical action executed');
    assert.equal(new Set(result.calls.map(t=>t[0])).size,result.calls.length,key+' no duplicate handler calls');
    // Effect identity, excluding focus transitions already performed by an idempotent tab.
    traces.push({view:result.view,hash:result.hash,calls:result.calls,profile:result.profile,scrolls:result.effects.filter(e=>e.method==='scrollIntoView').map(e=>e.target),hidden:false});
    report.actions.push({view,action,parent,initial,result});
   }
   assert.deepEqual(traces[1],traces[0],view+'/'+action+' media and list share one action');
   if(action==='recent')console.log('PASS remote actions '+view);
  }
  // Runtime DOM drift must hide both copies of a dead action and restore the same slots.
  for(const [action,id] of [['primary','exerciseSteps'],['recent','exerciseRows']]){
   await page.evaluate(({id})=>{document.querySelectorAll('dialog[open]').forEach(n=>n.close());showView('exercise');document.getElementById(id).id='remote-test-missing';HANI_CONTEXT_REMOTE_V1.update()}, {id});
   for(const parent of ['.hani-remote-nav','.hani-remote-media'])assert.equal(await page.locator(parent+' [data-remote-action="'+action+'"]').isVisible(),false,'missing '+id+' hidden in '+parent);
   await page.evaluate(({id})=>{document.getElementById('remote-test-missing').id=id;HANI_CONTEXT_REMOTE_V1.update()}, {id});
   assert.equal(await page.locator('.hani-remote-media [data-remote-action="'+action+'"]').getAttribute('hidden'),null,'restored '+id+' reuses slot');
  }
  report.actionCoverage={routes,actions:['primary','yuna','agent','recent'],surfaces:2,clicked:report.actions.length,hidden:routes.length*8-report.actions.length};
  for(const action of ['yuna','agent']){
   await page.evaluate(action=>{
    showView('exercise');
    if(action==='agent'){window.remoteTestProfileAPI=HaniOrganizationHub;window.HaniOrganizationHub=undefined}
    else {window.remoteTestInputIDs=[...document.querySelectorAll('#intake #yunaInput,#intake #intakeSourceText')].map(el=>({el,id:el.id}));remoteTestInputIDs.forEach(({el})=>el.removeAttribute('id'))}
    HANI_CONTEXT_REMOTE_V1.update();
   },action);
   for(const parent of ['.hani-remote-nav','.hani-remote-media'])assert.equal(await page.locator(parent+' [data-remote-action="'+action+'"]').isVisible(),false,'unavailable '+action+' hidden in '+parent);
   await page.evaluate(action=>{if(action==='agent'){window.HaniOrganizationHub=remoteTestProfileAPI;delete window.remoteTestProfileAPI}else{remoteTestInputIDs.forEach(({el,id})=>el.id=id);delete window.remoteTestInputIDs}HANI_CONTEXT_REMOTE_V1.update()},action);
   assert.equal(await page.locator('.hani-remote-media [data-remote-action="'+action+'"]').getAttribute('hidden'),null,'restored '+action+' reuses slot');
  }

  report.nativeStorageWrites=await page.evaluate(()=>remoteWrites);
  assert.ok(report.nativeStorageWrites.every(w=>w.method==='setItem'&&['hani_os_life_v23','hani_os_navigation_v1'].includes(w.key)),'only existing navigation UI and Backup/Newsroom saves, no other keys/removal/clear');
  await page.evaluate(()=>{window.remoteWrites=[];for(let i=0;i<25;i++)HANI_CONTEXT_REMOTE_V1.update()});
  assert.deepEqual(await page.evaluate(()=>remoteWrites),[],'redraw never writes any storage');
  assert.deepEqual(await page.evaluate(storageSnapshot),storageBefore,'business records and all other storage unchanged; only existing route UI, Backup/Newsroom UI timestamps exempt');
  const nav=await page.evaluate(()=>JSON.parse(localStorage.getItem('hani_os_navigation_v1')));
  assert.equal(nav.version,1);assert.ok(routes.includes(nav.view));assert.ok(Number.isFinite(nav.y)&&nav.y>=0&&nav.y<=1000000);assert.ok(Object.keys(nav).every(k=>['version','view','y','board'].includes(k)));
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#haniContextRemote').evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);
  report.storage='all business records, storage keys and other values unchanged; existing navigation UI, Backup timestamps and Newsroom mode only; 25 redraws zero writes';report.persistent=true;report.themePixelIdentity=true;report.fold884=true;
 }
 report.status='PASS';
}catch(e){report.status='FAIL';report.errors.push(e.stack);process.exitCode=1;console.error(e.message);await env?.page.screenshot({path:path.join(out,'actions-failure.png')})}
finally{await env?.close();fs.writeFileSync(path.join(out,`${phase}.json`),JSON.stringify(report,null,2));console.log(`${phase}: ${report.status}, ${report.cases.length} screenshots`)}
