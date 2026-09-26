import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const require=createRequire(import.meta.url);
const { chromium }=require('playwright');
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const output=resolve(process.env.HANI_PHASE1_QA_OUTPUT||join(tmpdir(),'hani-design-system-phase1-v29135'));
mkdirSync(output,{recursive:true});

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
const server=createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
  const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const file=normalize(join(root,relative));
  if(!file.startsWith(root)||!existsSync(file)||!statSync(file).isFile()){response.writeHead(404);response.end('Not found');return}
  response.writeHead(200,{'Content-Type':types[extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
  createReadStream(file).pipe(response);
});
await new Promise(resolveReady=>server.listen(0,'127.0.0.1',resolveReady));
const port=server.address().port;

const viewIds=['home','agentReview','intake','investmentIntake','investment','newsroom','reading','study','movie','game','settings'];
const viewports=[
  {name:'desktop-1280',width:1280,height:900},
  {name:'desktop-1440',width:1440,height:1000},
  {name:'mobile-390',width:390,height:844},
];
const report={version:'2.9.135',base:'origin/main@730657b38ebcfeac07ccc6116298850c69b267dc',generatedAt:new Date().toISOString(),viewports:[],invariants:{}};

const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
try{
  for(const viewport of viewports){
    const page=await browser.newPage({viewport});
    const consoleErrors=[];
    page.on('pageerror',error=>consoleErrors.push(`pageerror: ${error.message}`));
    page.on('console',message=>{if(message.type()==='error')consoleErrors.push(`console: ${message.text()}`)});
    await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'load'});
    await page.evaluate(()=>{
      document.querySelector('#loginGate')?.style.setProperty('display','none','important');
      document.querySelector('#app')?.classList.remove('login-locked');
      document.querySelector('#app')?.setAttribute('aria-hidden','false');
      document.documentElement.style.scrollBehavior='auto';
    });
    await page.waitForTimeout(350);

    const testedViews=[];
    for(const id of viewIds){
      if(viewport.width<=850){
        await page.locator('#mobileMenu').click();
        await page.waitForTimeout(40);
      }
      const nav=page.locator(`.nav-btn[data-view="${id}"]`).first();
      assert.equal(await nav.count(),1,`${id}: nav exists`);
      await nav.click();
      await page.waitForTimeout(100);
      const snapshot=await page.evaluate(viewId=>{
        const active=document.querySelector(`#${viewId}.view.active`);
        const banner=active?.querySelector(':scope > .ds-main-character-banner, :scope > .ds-page-hero, :scope > .ds-team-hero');
        const broken=[...document.images].filter(image=>image.offsetParent!==null&&image.complete&&image.naturalWidth===0).map(image=>image.currentSrc||image.src);
        const overflow=document.documentElement.scrollWidth-document.documentElement.clientWidth;
        const offenders=[...document.querySelectorAll('body *')].filter(element=>{
          const rect=element.getBoundingClientRect();
          return rect.right>document.documentElement.clientWidth+.5||rect.left<-.5;
        }).slice(0,12).map(element=>({tag:element.tagName,id:element.id,className:String(element.className).slice(0,100),rect:element.getBoundingClientRect().toJSON()}));
        return {viewId,active:!!active,banner:!!banner,overflow,broken,offenders};
      },id);
      assert(snapshot.active,`${id}: route becomes active`);
      assert(snapshot.banner,`${id}: canonical banner remains present`);
      assert.equal(snapshot.overflow,0,`${id}: horizontal viewport overflow`);
      assert.deepEqual(snapshot.broken,[],`${id}: visible image load`);
      testedViews.push(snapshot);
      if(['home','agentReview','investment','game'].includes(id))await page.screenshot({path:join(output,`${viewport.name}-${id}.png`),fullPage:true});
    }

    if(viewport.width>850){
      const before=await page.locator('#app').evaluate(element=>element.classList.contains('sidebar-mini'));
      await page.locator('#sideToggle').click();
      const after=await page.locator('#app').evaluate(element=>element.classList.contains('sidebar-mini'));
      assert.notEqual(after,before,'sidebar collapse toggles');
      await page.locator('#sideToggle').click();
    }else{
      await page.locator('#mobileMenu').click();
      assert(await page.locator('#app').evaluate(element=>element.classList.contains('mobile-open')),'mobile drawer opens');
      await page.mouse.click(viewport.width-2,Math.min(220,viewport.height/2));
      assert(!await page.locator('#app').evaluate(element=>element.classList.contains('mobile-open')),'mobile drawer closes');
    }

    const themeBefore=await page.locator('html').getAttribute('data-season');
    await page.locator('#theme').click();
    const themeAfter=await page.locator('html').getAttribute('data-season');
    assert.notEqual(themeAfter,themeBefore,'theme button changes season');

    if(viewport.width>900){
      await page.locator('#quickJumpInput').fill('스포츠');
      assert(await page.locator('#quickJump').evaluate(element=>element.classList.contains('open')),'search opens result menu');
      assert((await page.locator('#quickJumpMenu').innerText()).includes('스포츠'),'search returns sports route');
    }else{
      await page.locator('#quickJump').click();
      assert(await page.locator('#quickJump').evaluate(element=>element.classList.contains('open')),'compact search opens result menu');
    }

    let backupFilename='covered-by-desktop-1280';
    if(viewport.name==='desktop-1280'){
      const downloadPromise=page.waitForEvent('download');
      await page.locator('#quickBackup').click();
      const download=await downloadPromise;
      backupFilename=download.suggestedFilename();
      assert(/\.json$/i.test(backupFilename),`backup button creates JSON download: ${backupFilename}`);
      await download.cancel();
    }

    if(viewport.width<=850)await page.locator('#mobileMenu').click();
    await page.locator('.nav-btn[data-view="game"]').click();
    await page.locator('[data-sports-tab="kia"]').click();
    assert.equal(await page.locator('[data-sports-tab="kia"]').getAttribute('class').then(value=>String(value).includes('active')),true,'sports tab changes');

    const utility=await page.evaluate(()=>{
      const viewportWidth=document.documentElement.clientWidth;
      const required=['saveStateBadge','lastSavedLabel','cloudHeaderState','quickJump','quickBackup','theme'];
      return required.map(id=>{
        const element=document.getElementById(id);const rect=element?.getBoundingClientRect();
        return {id,visible:!!element&&getComputedStyle(element).display!=='none'&&rect.width>0&&rect.height>0,inside:!!rect&&rect.left>=0&&rect.right<=viewportWidth+.5,text:element?.textContent?.trim()||''};
      });
    });
    assert(utility.every(item=>item.visible&&item.inside&&item.text),`utility controls visible and unclipped: ${JSON.stringify(utility)}`);

    report.viewports.push({viewport,testedViews,utility,backupFilename,consoleErrors:[...new Set(consoleErrors)]});
    await page.close();
  }

  const source=readFileSync(join(root,'hani-main.js'),'utf8');
  const html=readFileSync(join(root,'index.html'),'utf8');
  const css=readFileSync(join(root,'hani-design-system.css'),'utf8');
  report.invariants={
    storageKey:(source.match(/const STORAGE_KEY="([^"]+)"/)||[])[1],
    internalVersion:(source.match(/const VERSION="([^"]+)"/)||[])[1],
    displayVersion:(source.match(/const HANI_DISPLAY_VERSION="([^"]+)"/)||[])[1],
    duplicateIds:[...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]).filter((id,index,ids)=>ids.indexOf(id)!==index),
    phase1Tokens:['--hani-type-page','--hani-space-page','--hani-radius-control','--color-data-up','--color-state-success'].every(token=>css.includes(token)),
    hiddenOverflowRuleRemovedFromOwner:!css.includes('html,body{overflow-x:hidden'),
  };
  assert.equal(report.invariants.storageKey,['hani','os','life','v23'].join('_'));
  assert.equal(report.invariants.internalVersion,'2.9.15-safe-baseline-bootstrap');
  assert.equal(report.invariants.displayVersion,'2.9.135');
  assert.deepEqual(report.invariants.duplicateIds,[]);
  assert(report.invariants.phase1Tokens);
  const errors=report.viewports.flatMap(entry=>entry.consoleErrors);
  const actionableErrors=errors.filter(error=>!error.includes('ERR_NETWORK_ACCESS_DENIED')&&!error.includes('Supabase JS를 불러오지 못했습니다'));
  report.environmentWarnings=[...new Set(errors.filter(error=>!actionableErrors.includes(error)))];
  assert.deepEqual(actionableErrors,[],`console errors: ${actionableErrors.join('\n')}`);
  writeFileSync(join(output,'qa-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({state:'PASS',output,viewports:report.viewports.map(entry=>({name:entry.viewport.name,views:entry.testedViews.length,consoleErrors:entry.consoleErrors.length})),invariants:report.invariants},null,2));
}finally{
  await browser.close();
  await new Promise(resolveClosed=>server.close(resolveClosed));
}
