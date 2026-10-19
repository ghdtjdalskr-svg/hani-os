import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/fix-218/simplify');
const before=process.argv.includes('--before'),phase=before?'before':'after';
const shots=['reading','geminiReports','ledger','travel','aiWork','movie','aiBudget','certificate'];
const result={phase,views:[],tabs:[],checks:[],screenshots:[],errors:[],failedAssets:[]};
let server,browser;
try{
 const {chromium}=await import(pathToFileURL(process.argv[2]).href);
 browser=await chromium.launch({executablePath:process.argv[3],headless:true});
 server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
  if(before&&path.dirname(file)===root){const original=path.join(out,'baseline',path.basename(file));if(fs.existsSync(original))file=original;}
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const views=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<button class="nav-btn[^>]*data-view="([^"]+)"[^>]*>[\s\S]*?<span class="txt">([^<]+)<\/span>/g)].map(m=>({id:m[1],label:m[2]}));
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1100},timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
  await context.addInitScript(()=>{const D=Date;window.Date=class extends D{constructor(...a){super(...(a.length?a:['2026-10-18T19:31:00+09:00']));}static now(){return new D('2026-10-18T19:31:00+09:00').getTime();}};});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)result.failedAssets.push(r.url().replace(origin,''));});
  await page.goto(origin);await page.waitForFunction(()=>window.HaniBuildingScene?.scheduler&&window.HaniOrganizationHub);
  await page.evaluate(()=>{unlockLoginGate();document.documentElement.dataset.finish='cream';window.simplifyProtected=localStorage.getItem('hani_os_life_v23');});
  for(const view of views){
   await page.evaluate(id=>showView(id),view.id);await page.waitForTimeout(220);
   const row=await page.evaluate(view=>{
    const root=document.getElementById(view.id);if(!root)return {...view,retired:true};
    const visible=e=>!!(e.getBoundingClientRect().width&&e.getBoundingClientRect().height)&&getComputedStyle(e).display!=='none';
    const cards=[...root.querySelectorAll('.card, [class*="intro"], [class*="banner"], [class*="hero"], [class*="notice"], [class*="profile"], .note')].filter(visible).map(e=>({tag:e.tagName,id:e.id,class:e.className,text:e.innerText.replace(/\s+/g,' ').slice(0,470),controls:e.querySelectorAll('button,input,select,a,textarea,iframe').length}));
    const descriptions=[...root.querySelectorAll('p.sub,p.section-intro,.note,[class*="intro"],[class*="guide"]')].filter(visible).map(e=>({class:e.className,id:e.id,text:e.innerText.replace(/\s+/g,' ').slice(0,600),controls:e.querySelectorAll('button,input,select,a,textarea').length}));
    return {...view,cards,descriptions,overflow:document.documentElement.scrollWidth>innerWidth};
   },view);result.views.push({width,...row});
   if(!before&&shots.includes(view.id))assert.equal(row.overflow,false,view.id+' no horizontal overflow');
   if(shots.includes(view.id)){
    await page.locator(`#${view.id} .ds-main-character-banner img`).first().evaluate(i=>i.decode()).catch(()=>{});
    await page.evaluate(()=>scrollTo(0,0));const name=`${phase}-${view.id}-${width}.png`;await page.screenshot({path:path.join(out,name),animations:'disabled'});result.screenshots.push(name);
    if(['reading','geminiReports','travel','aiBudget','certificate'].includes(view.id)){
     const full=`${phase}-${view.id}-${width}-full.png`;await page.screenshot({path:path.join(out,full),animations:'disabled',fullPage:true});result.screenshots.push(full);
    }
   }
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')===window.simplifyProtected),true,'nav view read-back preserves protected bytes');
  if(!before){
   for(const [id,selector] of [['travel','[data-travel-tab]'],['ledger','[data-panel]'],['monthlyReport','[data-report-board]'],['organization','.organization-tabs button'],['investmentCommittee','.ic-section-tabs button'],['investment','.investment-tabs-main button'],['settings','[data-settings-tab]'],['aura','.aura-tabs button']]){
    await page.evaluate(id=>showView(id),id);const buttons=page.locator('#'+id+' '+selector);
    const count=await buttons.count();for(let n=0;n<count;n++){
     if(!await buttons.nth(n).isVisible())continue;await buttons.nth(n).click();await page.waitForTimeout(100);
     const description=await page.locator('#'+id).evaluate(e=>[...e.querySelectorAll('p.sub,p.section-intro,.note,[class*="intro"],[class*="guide"]')].filter(x=>x.getBoundingClientRect().height&&x.getBoundingClientRect().width).map(x=>({class:x.className,id:x.id,text:x.innerText.replace(/\s+/g,' ').slice(0,340)})));
     result.tabs.push({width,id,tab:n,description});
    }
   }
   await page.evaluate(()=>showView('geminiReports'));
   assert.equal(await page.locator('#geminiStaffProfile,.gemini-reports-intro,.budget-manager').count(),0);
   assert.equal(await page.locator('#geminiReportStatus').isVisible(),false);
   await page.locator('#geminiReportSearch').fill('no-matching-report-218');assert.equal(await page.locator('.gemini-report-item').count(),0);
   await page.locator('#geminiReportSearch').fill('');assert.ok(await page.locator('.gemini-report-item').count()>0);
   await page.locator('#geminiReportFilter').selectOption('approved');assert.ok(await page.locator('.gemini-report-item').count()>0);
   await page.locator('#geminiReportRefresh').click();await page.waitForTimeout(100);assert.equal(await page.locator('#geminiReportStatus').isVisible(),false);
   await page.evaluate(()=>{window.simplifyCatalog=HaniGeminiReportCatalog;globalThis.HaniGeminiReportCatalog={};});
   await page.locator('#geminiReportRefresh').click();await page.waitForTimeout(100);assert.match(await page.locator('#geminiReportStatus').innerText(),/목록을 읽지 못했습니다/);assert.equal(await page.locator('#geminiReportStatus').isVisible(),true);
   await page.evaluate(()=>{globalThis.HaniGeminiReportCatalog=window.simplifyCatalog;});await page.locator('#geminiReportRefresh').click();await page.waitForTimeout(100);assert.equal(await page.locator('#geminiReportStatus').isVisible(),false);
   result.checks.push({width,report:'search/filter/refresh/error/recovery passed'});
   await page.evaluate(()=>{
    window.simplifyProtected=localStorage.getItem('hani_os_life_v23');
    window.simplifyBooks=state.books;window.simplifyMovies=state.movies;window.simplifyGoals=window.HANI_GOAL_PROGRESS;
    const dates=['2026-01-01','2026-02-01','2026-02-02','2026-03-01','2026-03-02','2026-04-01','2026-04-02','2026-05-01','2026-07-01','2026-07-02','2026-07-03','2026-08-01','2026-09-01','2026-09-02','2026-10-01'];
    state.books=dates.map((date,i)=>({id:'sample-'+i,status:'read',completedDate:date,title:'QA sample'}));state.movies=dates.map((date,i)=>({id:'sample-'+i,status:'watched',watchedDate:date,title:'QA sample'}));
    window.simplifyGoalRead=()=>['books_completed_count','media_watched_count'].map(metric_id=>({definition:{metric_id},goal:{status:'RESOLVED',target:24}}));
    window.simplifyWrites=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(...args){window.simplifyWrites.push(args[0]);return original.apply(this,args)};
   });
   for(const finish of ['cream','midnight-black'])for(const [id,kind] of [['reading','reading'],['movie','movie']]){
    await page.evaluate(({finish,id,kind})=>{document.documentElement.dataset.finish=finish;document.body.dataset.finishActive=finish;showView(id);const original=window.HANI_GOAL_PROGRESS;try{window.HANI_GOAL_PROGRESS={...original,read:window.simplifyGoalRead};renderActivityTrend(id+'ActivityTrend',kind)}finally{window.HANI_GOAL_PROGRESS=original}},{finish,id,kind});await page.waitForTimeout(100);
    const slot=page.locator('#'+id+'ActivityTrend');assert.equal(await slot.locator('.activity-chart rect').count(),6);assert.equal(await slot.locator('.activity-chart-average').count(),2);assert.equal(await slot.locator('.activity-goal-ring').count(),1);
    const geo=await slot.evaluate(e=>{const svg=e.querySelector('.activity-chart'),top=Number(svg.dataset.scaleMax);return {overflow:document.documentElement.scrollWidth>innerWidth,bars:[...svg.querySelectorAll('rect')].map(r=>({count:+r.dataset.count,height:r.getBoundingClientRect().height,unit:112/top*svg.getScreenCTM().d})),colors:{bar:getComputedStyle(svg.querySelector('.current rect')).fill,previous:getComputedStyle(svg.querySelector('rect')).fill,text:getComputedStyle(svg.querySelector('text')).fill,panel:getComputedStyle(e).backgroundColor}}});
    assert.equal(geo.overflow,false);assert.notEqual(geo.colors.bar,'rgb(0, 0, 0)','theme accent resolves');assert.notEqual(geo.colors.previous,'rgb(0, 0, 0)','historical bar color resolves');for(const r of geo.bars)assert.ok(Math.abs(r.height-r.count*r.unit)<1,'scaled bar height');
    const details=slot.locator('details');assert.equal(await details.getAttribute('open'),null);await details.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await details.evaluate(e=>e.open),true);assert.match(await details.innerText(),/最|최초 관측월/);await details.locator('summary').click();
    const name=`sample-${id}-${finish}-${width}.png`;await slot.screenshot({path:path.join(out,name),animations:'disabled',style:'header.top,.hani-remote-launcher{visibility:hidden!important}'});result.screenshots.push(name);result.checks.push({width,id,finish,...geo});
    await slot.locator('[data-activity-goal]').click();await page.waitForTimeout(100);assert.equal(await page.locator('#settings').evaluate(e=>e.classList.contains('active')),true);assert.equal(await page.locator('#goalRegistryPanel').isVisible(),true);
   }
   const writes=await page.evaluate(()=>window.simplifyWrites);
   assert.deepEqual(writes.filter(key=>key!=='hani_os_navigation_v1'),[],'chart and details write nothing; goal navigation retains existing route persistence only');
   result.checks.push({width,storageWrites:writes,protectedUnchanged:true});
   await page.evaluate(()=>{state.books=window.simplifyBooks;state.movies=window.simplifyMovies;window.HANI_GOAL_PROGRESS=window.simplifyGoals;});
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')===window.simplifyProtected),true);
  await context.close();
 }
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.failedAssets,[]);result.result='passed';
}catch(error){result.result=/EPERM|EACCES/.test(error.message)?'blocked':'failed';result.reason=error.stack;process.exitCode=1;}
finally{await browser?.close();if(server?.listening)await new Promise(r=>server.close(r));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,`audit-${phase}.json`),JSON.stringify(result,null,2));console.log(JSON.stringify({result:result.result,views:result.views.length,screenshots:result.screenshots.length,reason:result.reason}));}
