// Actual app/CSS in disposable contexts. Args: <playwright index.mjs> <browser exe>.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
assert.ok(process.argv[2]&&process.argv[3],'args: <playwright index.mjs> <browser exe>');
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const out=path.join(root,'.ai-budget-private/login-a-204/ui');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
  const uri=decodeURIComponent(new URL(req.url,'http://test').pathname),file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));
  if(!file.startsWith(root+path.sep)||uri.split('/').some(x=>x.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
const seasons=['spring','summer','autumn','winter'],finishes=['porcelain-cream','titanium-graphite','midnight-black','sakura-pink','alpine-blue'];
const ratio=(a,b)=>{
  const lum=rgb=>rgb.slice(0,3).map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
  return (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
};
let browser,cases=0;
try{
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});
  for(const width of [1440,900,390]){
    const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    // Existing UI preferences only, isolated from the user's profile/life data.
    await context.addInitScript(()=>{if(!localStorage.getItem('hani_os_season_theme_v1'))localStorage.setItem('hani_os_season_theme_v1','winter')});
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.dismiss());
    await page.goto(origin);await page.waitForFunction(()=>typeof loginGateInitialized==='boolean'&&loginGateInitialized);
    await page.waitForFunction(()=>document.querySelector('.login-season-artwork img.is-active')?.complete&&document.querySelector('.login-season-artwork img.is-active')?.naturalWidth>0);
    const lifeBefore=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    const initial=await page.evaluate(()=>document.documentElement.dataset.season);
    assert.equal(initial,'winter','initial image uses the existing saved Season');
    assert.equal(await page.locator('.login-season-artwork img.is-active').getAttribute('data-login-season-artwork'),initial);
    assert.equal(await page.locator('#app').evaluate(e=>e.inert),true);
    for(const finish of finishes){
      await page.locator('input[name="loginFinish"][value="'+finish+'"]').check();
      const boxes=await page.locator('.login-design-choice').evaluateAll(items=>items.map(e=>{const b=e.getBoundingClientRect();return {top:b.top,left:b.left,width:b.width}}));
      assert.equal(new Set(boxes.map(b=>Math.round(b.top))).size,width>820?1:2,'five options compact into desktop row/mobile 3+2');
      for(const season of seasons){
        await page.locator('[data-login-theme="'+season+'"]').click();
        assert.equal(await page.locator('.login-season-artwork img.is-active').getAttribute('data-login-season-artwork'),season,'immediate image selection');
        assert.equal(await page.locator('[data-login-theme="'+season+'"]').getAttribute('aria-pressed'),'true');
        await page.waitForFunction(()=>[...document.querySelectorAll('.login-season-artwork img')].every(e=>e.complete&&e.naturalWidth>0));
        assert.equal(await page.locator('#loginGate').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
        assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),lifeBefore,'appearance changes preserve protected data');
        assert.equal(await page.locator('.login-season-artwork img.is-active').evaluate(e=>getComputedStyle(e).objectFit),'cover');
        const transition=await page.locator('.login-season-artwork img.is-active').evaluate(e=>parseFloat(getComputedStyle(e).transitionDuration));assert.ok(transition<=.25);
      }
      const bounds=await page.locator('.login-character-panel').evaluate(panel=>{
        const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};
        return {panel:rect(panel),brand:rect(panel.querySelector('.login-brand')),partner:rect(panel.querySelector('.login-partner-card')),photo:rect(panel.querySelector('.login-character-photo')),quote:rect(panel.querySelector('.login-character-quote'))};
      });
      assert.ok(bounds.brand.bottom<=bounds.partner.top,'brand and partner do not overlap');
      for(const item of [bounds.partner,bounds.photo,bounds.quote])assert.ok(item.top>=bounds.panel.top&&item.bottom<=bounds.panel.bottom&&item.left>=bounds.panel.left&&item.right<=bounds.panel.right,'overlay stays inside the illustration');
      assert.notEqual(await page.locator('#loginCharacterPhoto').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
      assert.equal(await page.locator('.login-partner-card').evaluate(e=>getComputedStyle(e).backdropFilter),'none','no glass filter');
      if(width>820)assert.equal(await page.locator('#loginGate').evaluate(e=>e.scrollHeight<=e.clientHeight),true,'normal form fits 900px without gate scrolling');
      if(width===390){const b=await page.locator('.login-character-panel').boundingBox();assert.ok(b.height>=195&&b.height<=215);const form=await page.locator('.login-card').boundingBox();assert.ok(form.y>=b.y+b.height-1)}
    }
    await page.locator('input[name="loginFinish"][value="porcelain-cream"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('input[name="loginFinish"][value="titanium-graphite"]').isChecked(),true);
    await page.locator('[data-login-theme="spring"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.login-season-artwork img.is-active').getAttribute('data-login-season-artwork'),'spring');
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.login-season-artwork img.is-active').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
    await page.screenshot({path:path.join(out,'login-'+width+'.png'),fullPage:true});
    await page.reload();await page.waitForFunction(()=>loginGateInitialized);assert.equal(await page.evaluate(()=>document.documentElement.dataset.season),'spring');assert.equal(await page.evaluate(()=>document.documentElement.dataset.finish),'titanium-graphite');
    await page.evaluate(()=>{unlockLoginGate();showView('organization');renderNavNewBadges(Date.parse('2026-10-11T00:00:00Z'))});
    // showView mounts through rAF; wait for the actual owner surface, not a delay.
    await page.waitForFunction(()=>document.querySelector('#organization.view.active .ogh-overview'));
    for(const finish of ['porcelain-cream','midnight-black','titanium-graphite']){
      await page.evaluate(value=>applySignatureFinish(value,false),finish);
      const colors=await page.locator('#sidebar .nav-new-pill:not([hidden])').evaluateAll(items=>items.map(e=>{const s=getComputedStyle(e),rgb=value=>value.match(/[\d.]+/g).map(Number);return {fg:rgb(s.color),bg:rgb(s.backgroundColor),parent:!!e.closest('.group-head')}}));
      assert.ok(!colors.some(c=>c.parent),'QA-210: group headers carry no NEW pill');assert.ok(colors.some(c=>!c.parent));for(const c of colors)assert.ok(ratio(c.fg,c.bg)>=4.5,finish+' NEW AA');
    }
    assert.deepEqual(errors,[]);cases++;await context.close();
  }
  console.log('PASS login-a-204 UI: '+cases+' widths, 5 finishes × 4 seasons, immediate selection, fit/overflow, keyboard, reduced motion, preference reload, AA parent/menu badges');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
