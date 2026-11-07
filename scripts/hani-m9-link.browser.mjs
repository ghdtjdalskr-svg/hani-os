// Actual app, disposable context, blocked external requests, no account or production data.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/m9-link');
const modulePath=process.argv[2]||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const {chromium}=await import(pathToFileURL(modulePath).href);
const server=http.createServer((req,res)=>{
  const uri=decodeURIComponent(new URL(req.url,'http://fixture').pathname),f=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));
  if(!f.startsWith(root+path.sep)||uri.split('/').some(x=>x.startsWith('.'))||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.json')?'application/json':f.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(fs.readFileSync(f));
});
let browser;const report={status:'NOT_RUN',cases:[],screenshots:[],errors:[]};
try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({executablePath:process.argv[3]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  report.browser=await browser.version();
  for(const width of [1280,390]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
    await context.addInitScript(()=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-11-08T03:00:00Z']));}static now(){return NativeDate.parse('2026-11-08T03:00:00Z');}};});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/#organization/archive');await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&window.HaniOrganizationHub&&window.HANI_CHARACTER_ARCHIVE);
    await page.evaluate(()=>{unlockLoginGate();showView('organization/archive');});
    const card=page.locator('[data-special-listing="seoyun"]');await card.scrollIntoViewIfNeeded();await card.locator('img').evaluate(i=>i.decode());
    await page.evaluate(()=>{window.m9Writes=[];window.m9Before=JSON.stringify(state);window.m9Storage=localStorage.getItem(STORAGE_KEY);for(const name of ['setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.m9Writes.push(name);return original.apply(this,args);};}});
    const capture=async name=>{const file=`${width}-${name}.png`;await page.screenshot({path:path.join(out,file)});report.screenshots.push(file);};
    assert.equal(await card.locator('img').evaluate(i=>getComputedStyle(i).objectFit),'contain');await capture('special-card');
    await card.locator('[data-special-profile]').click();const dialog=page.locator('#haniOrganizationHub dialog');await dialog.waitFor({state:'visible'});
    await dialog.locator('.ogh-special-cut img').evaluate(i=>i.decode());assert.equal(await dialog.locator('.ogh-special-cut img').evaluate(i=>getComputedStyle(i).objectFit),'contain');await capture('special-detail');
    await page.keyboard.press('Escape');await page.evaluate(()=>showView('ilbo'));
    await page.locator('[data-ilbo-extra="seoyun-m9"]').click();await page.locator('.ilbo-extra-captions li').last().waitFor({state:'visible'});
    assert.equal(await page.locator('.ilbo-extra-captions li').count(),6);assert.match(await page.locator('.ilbo-extra-captions').innerText(),/꼬마 수연[^]*꼬마 수현/);
    await page.locator('[data-ilbo-comic]').evaluate(i=>i.decode());await page.locator('.ilbo-paper').scrollIntoViewIfNeeded();await capture('extra');
    await page.locator('.ilbo-extra-captions').screenshot({path:path.join(out,`${width}-extra-captions.png`)});report.screenshots.push(`${width}-extra-captions.png`);
    assert.equal(await page.evaluate(()=>HaniIlbo.publishedCount()),3);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    assert.deepEqual(await page.evaluate(()=>m9Writes),[]);assert.equal(await page.evaluate(()=>JSON.stringify(state)===m9Before&&localStorage.getItem(STORAGE_KEY)===m9Storage),true);assert.deepEqual(errors,[]);
    report.cases.push({width,height:900,status:'PASS',writes:0,errors});await context.close();
  }
  report.status='PASS';
}catch(e){report.status=/EPERM/.test(e.message)?'BLOCKED':'FAIL';report.errors.push(e.message);process.exitCode=1;}
finally{await browser?.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,screenshots:report.screenshots.length,error:report.errors[0]?.split('\n')[0]}));}
