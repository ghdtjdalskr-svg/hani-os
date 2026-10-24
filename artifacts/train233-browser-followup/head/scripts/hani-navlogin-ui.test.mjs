// Isolated synthetic credentials/Cloud responses only; never contacts production.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(import.meta.dirname,'..'),evidence=path.join(root,'.ai-budget-private/navlogin-qa');fs.mkdirSync(evidence,{recursive:true});
const server=http.createServer((req,res)=>{
  const uri=decodeURIComponent(new URL(req.url,'http://test').pathname),file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));
  if(!file.startsWith(root+path.sep)||uri.split('/').some(x=>x.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
let browser,cases=0;
try{
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:1000}});
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
    await page.goto(origin+'/#characterArchive');await page.waitForFunction(()=>typeof loginGateInitialized==='boolean'&&loginGateInitialized);
    assert.equal(await page.locator('#app').evaluate(e=>e.inert),true);
    assert.equal(await page.locator('#loginGateTitle').innerText(),'HANI OS 입장 화면');
    assert.equal(await page.locator('[data-organization-tab="archive"]').getAttribute('aria-selected'),'true');
    await page.locator('input[name="loginFinish"][value="midnight-black"]').check();await page.locator('[data-login-theme="winter"]').click();
    assert.deepEqual(await page.evaluate(()=>[document.documentElement.dataset.finish,document.documentElement.dataset.season]),['midnight-black','winter']);
    assert.equal(await page.locator('[data-login-theme="winter"]').getAttribute('aria-pressed'),'true');
    await page.evaluate(()=>{
      state=freshState();state.books=[{id:'synthetic-book',title:'UI synthetic'}];writeProtectedState(JSON.stringify(state));
      window.navloginUi={authCalls:0,failed:true,release:null,signouts:0};
      cloudClient={auth:{signInWithPassword:async()=>{navloginUi.authCalls++;return {data:{user:{id:'synthetic-owner'}}}},signOut:async options=>{if(options.scope!=='local')throw Error('wrong scope');navloginUi.signouts++;return {error:null}}}};
      cloudFetchMeta=async()=>{};
      cloudSyncCycle=async()=>{
        await new Promise(resolve=>{navloginUi.release=resolve});
        cloudAutoSyncReady=!navloginUi.failed;cloudRuntime.sync=navloginUi.failed?'OFFLINE':'ON';cloudRuntime.message='Synthetic Cloud retry';
      };
    });
    const protectedBefore=await page.evaluate(()=>localStorage.getItem(STORAGE_KEY));
    await page.locator('#loginGateEmail').fill('synthetic@example.test');await page.locator('#loginGatePassword').fill('temporary');
    await page.locator('#loginGateSubmit').click();await page.waitForFunction(()=>!!navloginUi.release);
    assert.equal(await page.locator('#app').evaluate(e=>e.inert),true,'Cloud wait keeps the app locked');
    await page.evaluate(()=>navloginUi.release());await page.waitForFunction(()=>!loginGateBusy);
    assert.equal(await page.locator('#loginGateCloudTools #cloudBridgeCard').count(),1,'canonical recovery card moves without copying');
    assert.equal(await page.locator('#loginGatePassword').inputValue(),'');
    await page.evaluate(()=>{navloginUi.failed=false;navloginUi.release=null});
    await page.locator('#loginGateSubmit').click();await page.waitForFunction(()=>!!navloginUi.release);await page.evaluate(()=>navloginUi.release());
    await page.waitForFunction(()=>loginGateUnlocked);assert.equal(await page.evaluate(()=>navloginUi.authCalls),1,'retry does not store/replay password');
    assert.equal(await page.locator('#app').evaluate(e=>e.inert),false);
    assert.equal(await page.locator('#settings #cloudBridgeCard').count(),1);
    if(width===390){await page.evaluate(()=>document.querySelector('#app').classList.add('mobile-open'));await page.locator('.side [data-view="organization"]').click();assert.equal(await page.locator('#app').evaluate(e=>e.classList.contains('mobile-open')),false)}
    else await page.locator('.side [data-view="organization"]').click();
    assert.equal(await page.locator('.ogh-cta').count(),0,'duplicate overview hero removed');assert.equal(await page.locator('#organization > .ds-main-character-banner').count(),1,'canonical organization hero retained');await page.locator('[data-organization-tab="people"]').click();assert.equal(await page.locator('[data-organization-tab="people"]').getAttribute('aria-selected'),'true');
    await page.locator('[data-organization-tab="overview"]').click();
    await page.locator('[data-organization-tab="overview"]').focus();await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-organization-tab="people"]').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('#ogh-chart').isVisible(),true);
    await page.keyboard.press('End');assert.equal(await page.locator('[data-organization-tab="aiTeam"]').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('.ogh-person:visible').count(),10);
    await page.keyboard.press('Home');assert.equal(await page.locator('[data-organization-tab="overview"]').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('#ogh-chart').isVisible(),false);
    await page.evaluate(()=>showView('organization/people/hani'));await page.locator('.ogh-dialog[open]').waitFor();await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-card-person="hani"]').evaluate(e=>e===document.activeElement),true);
    await page.evaluate(()=>showView('settings'));
    await page.locator('[data-settings-tab="data"]').focus();await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-settings-tab="policy"]').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('#policy').isVisible(),true);assert.equal(await page.locator('#settingsData').isVisible(),false);
    await page.keyboard.press('Home');assert.equal(await page.locator('#settingsData').isVisible(),true);
    await page.evaluate(()=>showView('policy'));assert.equal(await page.evaluate(()=>location.hash),'#settings/policy');
    await page.evaluate(()=>showView('aura'));assert.equal(await page.locator('#title').innerText(),'테마 스튜디오');
    assert.equal(await page.locator('body').innerText().then(text=>text.includes('HANI AURA')),false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:path.join(evidence,'organization-'+width+'.png')});
    await page.evaluate(()=>cloudLogout());assert.equal(await page.locator('#app').evaluate(e=>e.inert),true);assert.equal(await page.evaluate(()=>localStorage.getItem(STORAGE_KEY)),protectedBefore);
    await page.reload();await page.waitForFunction(()=>loginGateInitialized);assert.equal(await page.locator('#app').evaluate(e=>e.inert),true,'new visit requires credentials');
    assert.deepEqual(errors,[]);cases++;await context.close();
  }
  console.log('PASS nav/login UI '+cases+' viewports: design before entry, Cloud wait/retry, tab keyboard, drawer, dialog focus, logout preservation, fresh entry');
}finally{await browser?.close();server.close()}
