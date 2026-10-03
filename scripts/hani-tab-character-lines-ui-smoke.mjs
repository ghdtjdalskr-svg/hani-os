import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { TAB_CHARACTER_LINES } from '../hani-tab-character-lines.mjs';
const { chromium }=createRequire(import.meta.url)('playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const server=http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://127.0.0.1').pathname;
  const file=path.resolve(root,decodeURIComponent(pathname.slice(1)||'index.html'));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404).end();return;}
  const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
  response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(response);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
try{
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    const page=await browser.newPage({viewport});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    // Isolated context: never access real accounts or allow production API calls.
    await page.route('**/*',route=>{
      const request=route.request(),url=new URL(request.url());
      if(url.hostname==='127.0.0.1'||(url.hostname==='cdn.jsdelivr.net'&&request.method()==='GET'))return route.continue();
      return route.abort();
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'load'});
    await page.evaluate(()=>{document.querySelector('#loginGate')?.style.setProperty('display','none','important');const app=document.querySelector('#app');app?.classList.remove('login-locked');app?.setAttribute('aria-hidden','false');});
    await page.waitForTimeout(500);
    const original=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    const renderedMenus=await page.evaluate(ids=>ids.filter(id=>document.getElementById(id)),Object.keys(TAB_CHARACTER_LINES));
    assert.deepEqual(Object.keys(TAB_CHARACTER_LINES).filter(id=>!renderedMenus.includes(id)),['work'],'Only the pre-existing, unmounted work definition may be absent');
    const enter=async(tab)=>{
      await page.evaluate(id=>{const nav=document.querySelector(`.nav-btn[data-view="${id}"]`);if(nav)nav.click();else{showView(id);document.body.dispatchEvent(new MouseEvent('click',{bubbles:true}));}},tab);
      const lines=TAB_CHARACTER_LINES[tab].lines;
      try{await page.waitForFunction(allowed=>allowed.some(line=>document.querySelector('#aiQuote b')?.textContent===`“${line}”`),lines,{timeout:8000});}
      catch{throw new Error(JSON.stringify({tab,errors,screen:await page.evaluate(()=>({active:document.querySelector('.view.active')?.id,quote:document.querySelector('#aiQuote b')?.textContent,ui:window.HANI_UI_V02992,slot:!!document.querySelector('.view.active [data-main-character-banner-agent-slot] #aiBanner')}))}));}
      return page.locator('#aiQuote b').textContent();
    };
    for(const tab of renderedMenus){
      const first=await enter(tab);
      await page.evaluate(()=>document.body.dispatchEvent(new MouseEvent('click',{bubbles:true})));
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#aiQuote b').textContent(),first,tab+': redraw changed quote');
      await enter(tab==='home'?'movie':'home');
      assert.notEqual(await enter(tab),first,tab+': re-entry did not advance');
      assert.equal(await page.locator('#aiAvatar').getAttribute('class').then(value=>value.includes('agent-'+TAB_CHARACTER_LINES[tab].agent)),true,tab+': avatar mismatch');
      assert.equal(await page.locator('#'+tab+' > .ds-main-character-banner').getAttribute('data-owner'),TAB_CHARACTER_LINES[tab].agent);
    }
    await enter('game');
    for(const view of ['yankees','kia','madrid','dplus']){
      await page.locator(`[data-sports-tab="${view}"]`).click();
      await page.waitForTimeout(100);
      const first=await page.locator('#aiQuote b').textContent();
      assert.notEqual(first,`“${TAB_CHARACTER_LINES.game.lines[0]}”`);
      await page.locator('[data-sports-tab="home"]').click();
      await page.locator(`[data-sports-tab="${view}"]`).click();
      await page.waitForTimeout(100);
      assert.notEqual(await page.locator('#aiQuote b').textContent(),first);
    }
    assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),original,'Navigation changed protected life data');
    await enter('movie');
    fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
    await page.locator('#movie > .ds-main-character-banner').screenshot({path:path.join(root,`artifacts/tab-voice-${viewport.width}.png`)});
    await page.close();
  }
  console.log('Tab quote UI PASS: desktop/mobile, 28 mounted menus, 4 sports views, stable redraw, re-entry, avatars, protected storage unchanged. Unmounted work definition: UI N/A.');
}finally{await browser.close();server.close();}
