// node artifacts/theme-thaw/browser.mjs <playwright/index.mjs> <msedge.exe>
// Disposable context, local server only. Never opens a real account or production.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'../..'),out=import.meta.dirname;
const report={base:'e1f3ac7e944484b09fe102464b22ef6e66204d9a',head:'4701b5853bd289df7ce5febea38fd8da32b3cea9',identity:Object.fromEntries(['index.html','hani-main.js','hani-design-system.css','hani-theme-collections.json'].map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),viewports:[],screenshots:[],errors:[],cases:[],fetches:[]};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{const uri=decodeURIComponent(new URL(req.url,'http://test').pathname),file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));if(!file.startsWith(root+path.sep)||uri.split('/').some(x=>x.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
  const {chromium}=await import(pathToFileURL(process.argv[2]).href);
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  for(const width of [1280,390])for(const [phase,now]of Object.entries({before:'2026-12-20T12:00:00+09:00',teaser:'2027-01-10T12:00:00+09:00',launch:'2027-02-09T12:00:00+09:00',after:'2027-02-20T12:00:00+09:00'})){
    const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Asia/Seoul',reducedMotion:'reduce',serviceWorkers:'block'});
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
    await context.addInitScript(({now})=>{const Native=Date,clock=Native.parse(now);window.Date=class extends Native{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}};localStorage.setItem('hani_os_signature_finish_v1','midnight-black');localStorage.setItem('hani_os_season_theme_v1','winter')},{now});
    const page=await context.newPage();page.on('pageerror',e=>report.errors.push({width,phase,error:e.message}));page.on('dialog',d=>d.dismiss());
    page.on('response',response=>{const url=new URL(response.url());if(url.pathname.endsWith('/hani-theme-collections.json')||url.pathname.includes('/assets/theme-collections/'))report.fetches.push({width,phase,path:url.pathname,status:response.status()})});
    await page.goto(origin);await page.waitForFunction(()=>typeof loginGateInitialized!=='undefined'&&loginGateInitialized&&typeof THEME_COLLECTIONS!=='undefined'&&THEME_COLLECTIONS.length===1);
    await page.evaluate(()=>{cloudStopAutoSync();unlockLoginGate();showView('home')});
    await page.evaluate(()=>{window.thawBeforeLife=localStorage.getItem('hani_os_life_v23');window.thawBeforeState=JSON.stringify(state);window.thawWrites=[];for(const method of ['setItem','removeItem','clear']){const old=Storage.prototype[method];Storage.prototype[method]=function(...args){window.thawWrites.push([method,...args]);return old.apply(this,args)}};syncThemeCollections();});
    const shot=async(label,selector)=>{if(selector)await page.locator(selector).evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await page.evaluate(()=>document.fonts.ready);const filename=`294-${width}-${phase}-${label}.png`;await page.screenshot({path:path.join(out,filename),fullPage:false,animations:'disabled'});report.screenshots.push(filename)};
    if(['teaser','launch'].includes(phase)){await page.locator('#themeCollectionHome').waitFor();await shot('home','#themeCollectionHome');assert.equal(await page.locator('#themeCollectionHome picture img').evaluate(i=>i.complete&&i.naturalWidth>0),true)}else{assert.equal(await page.locator('#themeCollectionHome:visible').count(),0);await shot('home')}
    if(phase==='teaser')assert.equal(await page.locator('[data-collection-countdown]').textContent(),'D-29');
    // Screenshots scroll the real app and its canonical navigation owner saves y.
    // Measure the campaign operation itself synchronously, apart from scrolling.
    const passive=await page.evaluate(()=>{const navigationWrites=window.thawWrites;window.thawWrites=[];syncThemeCollections();return {writes:window.thawWrites,navigationWrites,finish:document.documentElement.dataset.finish,season:document.documentElement.dataset.season}});assert.deepEqual(passive.writes,[]);assert.ok(passive.navigationWrites.every(w=>w[0]==='setItem'&&w[1]==='hani_os_navigation_v1'));assert.equal(passive.finish,'midnight-black');assert.equal(passive.season,'winter');
    if(phase==='launch'){
      await page.locator('#themeCollectionHome [data-collection-open]').click();await page.locator('#themeCollectionDialog').waitFor();await shot('dialog');
      assert.ok((await page.evaluate(()=>window.thawWrites)).every(w=>w[0]==='setItem'&&w[1]==='hani_os_navigation_v1'));
      await page.keyboard.press('Escape');assert.equal(await page.locator('#themeCollectionDialog').evaluate(d=>d.open),false);
      assert.equal(await page.evaluate(()=>document.activeElement.matches('[data-collection-open]')),true,'Escape restores invoker focus');
    }
    await page.evaluate(()=>{themeCollectionStudio();window.thawWrites=[]});
    assert.equal(await page.locator('#themeCollectionChoices .theme-collection-choice').count(),1,'single persistent THAW row, including before teaser');
    const apply=page.locator('#themeCollectionChoices [data-collection-apply]');assert.equal(await apply.isDisabled(),phase==='before'||phase==='teaser');
    await shot('studio','#themeCollectionChoices');
    await page.waitForFunction(()=>{const img=document.querySelector('#themeCollectionChoices picture img');return img?.complete&&img.naturalWidth>0});
    const studioPassive=await page.evaluate(()=>{const navigationWrites=window.thawWrites;window.thawWrites=[];const row=themeCollectionMemory.rows.get('thaw-2027q1'),card=themeCollectionMemory.home;syncThemeCollections();return {writes:window.thawWrites,navigationWrites,persistent:row===themeCollectionMemory.rows.get('thaw-2027q1')&&card===themeCollectionMemory.home,phase:row.dataset.phase,art:row.querySelector('img').currentSrc}});
    assert.deepEqual(studioPassive.writes,[]);assert.equal(studioPassive.persistent,true);assert.equal(studioPassive.phase,phase);assert.ok(studioPassive.navigationWrites.every(w=>w[0]==='setItem'&&w[1]==='hani_os_navigation_v1'));
    assert.ok(studioPassive.art.endsWith(width<=600?'/teaser-mobile.webp':'/teaser-wide.webp'),'responsive artwork uses the expected runtime path');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow');
    if(phase==='after'){await page.locator('[data-collection-replay]').click();await shot('dialog');await page.locator('#themeCollectionDialog button[type="submit"]').click()}
    if(phase==='launch'||phase==='after'){
      await page.waitForTimeout(400);await page.evaluate(()=>{window.thawWrites=[]});
      // Actual computed Finish tokens remain independent of all four Seasons.
      const combinationColors={};
      for(const finish of ['porcelain-cream','pure-white','titanium-graphite','midnight-black','sakura-pink','alpine-blue']){
        const colors=[];
        for(const season of ['spring','summer','autumn','winter'])colors.push(await page.evaluate(({finish,season})=>{applySignatureFinish(finish);applySeasonTheme(season);syncThemeCollections();const s=getComputedStyle(document.documentElement);return ['--surface-canvas','--surface-panel','--text-primary','--text-secondary'].map(k=>s.getPropertyValue(k).trim())},{finish,season}));
        for(const color of colors)assert.deepEqual(color,colors[0],finish+' surface tokens across Seasons');combinationColors[finish]=colors[0];
      }
      assert.deepEqual(await page.evaluate(()=>window.thawWrites),[]);
      await apply.click();const writes=await page.evaluate(()=>window.thawWrites);assert.deepEqual(writes.map(w=>w.slice(0,2)),[['setItem','hani_os_signature_finish_v1'],['setItem','hani_os_season_theme_v1']]);
      report.cases.push({width,phase,combinations:24,combinationColors,explicitWrites:writes});
    }
    assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')===window.thawBeforeLife&&JSON.stringify(state)===window.thawBeforeState),true,'life bytes and in-memory records unchanged');
    if(phase==='teaser'||phase==='launch'){await page.evaluate(()=>showView('home'));await page.locator('[data-collection-dismiss]').click();await page.evaluate(()=>syncThemeCollections());assert.equal(await page.locator('#themeCollectionHome').evaluate(e=>e.hidden),true);}
    assert.ok(report.fetches.some(r=>r.width===width&&r.phase===phase&&r.path.endsWith('/hani-theme-collections.json')&&r.status===200));
    report.viewports.push({width,phase,now,passiveWrites:0,studioPassiveWrites:0,studioVisible:true,homeVisible:phase==='teaser'||phase==='launch',art:studioPassive.art,lifePreserved:true});await context.close();
  }
  assert.deepEqual(report.errors,[]);report.result='PASS';
}catch(error){report.result='BLOCKED_OR_FAILED';report.failure=error.stack;throw error}
finally{fs.writeFileSync(path.join(out,'browser-status-294.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(resolve=>server.close(resolve))}
