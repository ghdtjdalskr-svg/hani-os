// Isolated actual runtime/CSS; all external traffic blocked, synthetic in-memory state only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const runtime=process.argv[2]||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const {chromium}=await import(pathToFileURL(runtime).href);
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'.ai-budget-private/ui-203b');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
  const uri=decodeURIComponent(new URL(req.url,'http://test').pathname),file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));
  if(!file.startsWith(root+path.sep)||uri.split('/').some(x=>x.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
  browser=await chromium.launch({executablePath:process.argv[3]||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin);await page.waitForFunction(()=>loginGateInitialized&&window.HaniOrganizationHub);
    const protectedBefore=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    const themes=['porcelain-cream','titanium-graphite','midnight-black','sakura-pink','alpine-blue'];
    for(const theme of themes){
      await page.locator('input[name="loginFinish"][value="'+theme+'"]').check();
      assert.equal(await page.evaluate(()=>document.documentElement.dataset.finish),theme);
      const swatches=await page.locator('[data-design="'+theme+'"] .login-design-swatches i').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).backgroundColor));
      const tokens=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return ['--surface-canvas','--surface-panel','--structure-accent'].map(k=>s.getPropertyValue(k).trim())});
      assert.equal(swatches.length,3);assert.ok(new Set(swatches).size>=2);
      assert.equal(await page.locator('input[name="loginFinish"]:checked').count(),1);
      assert.equal(await page.locator('[data-design="'+theme+'"] .login-design-check').evaluate(e=>getComputedStyle(e).visibility),'visible');
      assert.ok(tokens.every(Boolean));
      const backgrounds=[];
      for(const season of ['spring','summer','autumn','winter']){await page.locator('[data-login-theme="'+season+'"]').click();backgrounds.push(await page.locator('#loginGate').evaluate(e=>getComputedStyle(e).backgroundImage));assert.equal(await page.locator('[data-login-theme="'+season+'"]').getAttribute('aria-pressed'),'true')}
      assert.equal(new Set(backgrounds).size,4,'entry background immediately changes in '+theme);
      assert.equal(await page.locator('#loginGate').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
    }
    await page.locator('input[name="loginFinish"][value="porcelain-cream"]').focus();await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('input[name="loginFinish"][value="titanium-graphite"]').isChecked(),true);
    await page.locator('[data-login-theme="summer"]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.documentElement.dataset.season),'summer');
    await page.screenshot({path:path.join(out,'login-'+width+'.png'),fullPage:true});
    await page.evaluate(()=>{state=freshState();unlockLoginGate();showView('organization')});
    assert.equal(await page.locator('.ogh-overview').isVisible(),true);assert.equal(await page.locator('.ogh-timeline li').count(),8);assert.equal(await page.locator('.ogh-stats>div').count(),4);assert.match(await page.locator('.ogh-overview').innerText(),/이번 달 게시판 활동이 쌓이면/);
    await page.evaluate(()=>{const createdAt=new Date().toISOString();state.boardPosts=[{id:'synthetic',authorId:'hani',createdAt}];state.boardComments=[{postId:'synthetic',authorId:'hani',createdAt}];HaniOrganizationHub.selectTab('overview')});
    assert.match(await page.locator('.ogh-employee').innerText(),/하니[\s\S]*전무[\s\S]*전략기획실[\s\S]*2건/);
    await page.screenshot({path:path.join(out,'overview-'+width+'.png'),fullPage:true});
    await page.evaluate(()=>{for(let i=0;i<3;i++)renderNavNewBadges(Date.parse('2026-10-11T00:00:00Z'))});
    // :visible includes the translated-offscreen mobile drawer. Keep CSS visibility,
    // then check horizontal viewport intersection; sidebar items may scroll vertically.
    const newBadges=await page.locator('#sidebar .nav-btn .nav-new-pill:visible').evaluateAll(nodes=>nodes.map(n=>{
      const {left,right}=n.getBoundingClientRect();return {view:n.closest('[data-view]').dataset.view,text:n.textContent,left,right,inHorizontalViewport:right>0&&left<innerWidth};
    }));
    console.log('NEW badge diagnostics '+JSON.stringify({width,expected:width===1440?4:0,items:newBadges}));
    assert.equal(newBadges.length,4,'four active menu badges retain CSS visibility');
    assert.equal(newBadges.filter(n=>n.inHorizontalViewport).length,width===1440?4:0,'NEW badges intersect the horizontal viewport');
    assert.equal(await page.locator('#sidebar .nav-btn .nav-new-pill').count(),4,'repeat render is idempotent');
    assert.equal(await page.locator('#sidebar .group-head .nav-new-pill').count(),2);
    await page.evaluate(()=>renderNavNewBadges(Date.parse('2026-10-18T00:00:00Z')));assert.equal(await page.locator('#sidebar .nav-new-pill:not([hidden])').count(),0);
    await page.locator('[data-organization-tab="people"]').click();assert.equal(await page.locator('.ogh-overview').isVisible(),false);await page.locator('[data-organization-tab="overview"]').click();assert.equal(await page.locator('.ogh-overview').isVisible(),true);
    await page.evaluate(()=>showView('monthlyReport'));
    for(const theme of ['porcelain-cream','midnight-black','titanium-graphite']){
      await page.evaluate(theme=>applySignatureFinish(theme,false),theme);
      const accents=[];
      for(const period of ['monthly','quarterly','annual']){
        const tab=page.locator('[data-report-board="'+period+'"]');await tab.click();assert.equal(await tab.getAttribute('aria-selected'),'true');
        const colors=await tab.evaluate(e=>{const s=getComputedStyle(e),b=getComputedStyle(e.querySelector('b'));return {fg:b.color,bg:s.backgroundColor}});accents.push(colors.fg);
        const rgb=c=>c.match(/[\d.]+/g).slice(0,3).map(Number),lum=c=>rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
        const a=lum(colors.fg),b=lum(colors.bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,theme+' '+period+' selected text AA');
      }
      assert.equal(new Set(accents).size,3);
    }
    await page.screenshot({path:path.join(out,'reports-'+width+'.png'),fullPage:true});
    assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),protectedBefore);assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS 203b UI 1440/390: five token palettes, four season previews, radio/season keyboard, NEW parent/idempotency/expiry, live overview/fallback, report accents and AA, protected data unchanged');
}finally{await browser?.close();server.close()}
