// Actual app, disposable context, blocked external requests, no account or production data.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import inverse from './hani-m9-polish-source.cjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/m9-polish');
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
  const baseline=new Map();
  for(const width of [1280,390])for(const mode of ['before','after']){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    await context.route('**/*',r=>{const url=new URL(r.request().url());if(url.origin!==origin)return r.abort();const file=url.pathname.slice(1);if(mode==='before'&&inverse.delta.files.some(row=>row.file===file))return r.fulfill({contentType:file.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8',body:inverse.restore(fs.readFileSync(path.join(root,file),'utf8'),file)});return r.continue();});
    await context.addInitScript(()=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-11-08T03:00:00Z']));}static now(){return NativeDate.parse('2026-11-08T03:00:00Z');}};});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/#organization/archive');await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&window.HaniOrganizationHub&&window.HANI_CHARACTER_ARCHIVE);
    await page.evaluate(()=>{unlockLoginGate();showView('organization/archive');});
    const card=page.locator('[data-special-listing="seoyun"]');await card.scrollIntoViewIfNeeded();await card.locator('img').evaluate(i=>i.decode());
    await page.evaluate(()=>{window.m9Writes=[];window.m9Before=JSON.stringify(state);window.m9Storage=localStorage.getItem(STORAGE_KEY);for(const name of ['setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.m9Writes.push(name);return original.apply(this,args);};}});
    const capture=async name=>{if(mode==='before')return;const file=`${width}-${name}.png`;await page.screenshot({path:path.join(out,file)});report.screenshots.push(file);};
    assert.equal(await card.locator('img').evaluate(i=>getComputedStyle(i).objectFit),'contain');
    const metrics=await card.evaluate(el=>{const box=n=>{const b=n.getBoundingClientRect();return {x:b.x,width:b.width,height:b.height};};const lines=n=>{const range=document.createRange();range.selectNodeContents(n);return new Set([...range.getClientRects()].map(r=>r.y)).size;};const title=el.querySelector('h3'),rank=title.querySelector('span'),badge=el.querySelector('.ca-planned-badge');return {card:box(el),photo:box(el.querySelector('.ca-cover-photo')),title:box(title),rank:box(rank),rankLines:lines(rank),badgeLines:lines(badge),rankDisplay:getComputedStyle(rank).display,rankWordBreak:getComputedStyle(rank).wordBreak,titleWordBreak:getComputedStyle(title).wordBreak,gridColumns:getComputedStyle(el.parentElement).gridTemplateColumns};});
    if(mode==='before')baseline.set(width,metrics);
    else{assert.equal(await card.locator('.ca-planned-badge').innerText(),'M9 특별 합류');assert.equal(metrics.rankLines,1);assert.equal(metrics.badgeLines,1);assert.equal(metrics.card.x,baseline.get(width).card.x);assert.equal(metrics.card.width,baseline.get(width).card.width);assert.deepEqual(metrics.photo,baseline.get(width).photo);assert.equal(metrics.gridColumns,baseline.get(width).gridColumns);if(width===390)for(const key of ['rankDisplay','rankWordBreak','titleWordBreak'])assert.equal(metrics[key],baseline.get(width)[key],key);else assert.equal(metrics.titleWordBreak,'keep-all');}
    await capture('special-card');
    await card.locator('[data-special-profile]').click();const dialog=page.locator('#haniOrganizationHub dialog');await dialog.waitFor({state:'visible'});
    await dialog.locator('.ogh-special-cut img').evaluate(i=>i.decode());assert.equal(await dialog.locator('.ogh-special-cut img').evaluate(i=>getComputedStyle(i).objectFit),'contain');await capture('special-detail');
    const note=await dialog.locator('.ogh-detail-note').innerText();
    if(mode==='after'){assert.equal(note,'M9 특별 합류 · Platform Architect (하니 전무 승인)');await dialog.locator('.ogh-detail-note').scrollIntoViewIfNeeded();await capture('special-detail-note');}
    else assert.match(note,/신규 이름·역할은 제안안/);
    await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    assert.deepEqual(await page.evaluate(()=>m9Writes),[]);assert.equal(await page.evaluate(()=>JSON.stringify(state)===m9Before&&localStorage.getItem(STORAGE_KEY)===m9Storage),true);assert.deepEqual(errors,[]);
    report.cases.push({width,height:900,mode,status:'PASS',metrics,writes:0,errors});await context.close();
  }
  report.status='PASS';
}catch(e){report.status=/EPERM/.test(e.message)?'BLOCKED':'FAIL';report.errors.push(e.message);process.exitCode=1;}
finally{await browser?.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,screenshots:report.screenshots.length,error:report.errors[0]?.split('\n')[0]}));}
