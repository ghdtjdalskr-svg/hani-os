import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(import.meta.dirname,'..'),evidence=path.join(root,'artifacts/yuna-schedule');
fs.mkdirSync(evidence,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.argv[3],headless:true});
const input='12월 12일 토요일부터 12월 13일 일요일까지야\n할일은 "찐막채 송년회"로 일정 올려줘';
let cases=0;
try{
 for(const width of [1440,390])for(const finish of ['porcelain-cream','midnight-black']){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();await page.goto(origin);await page.waitForFunction(()=>!!window.HANI_YUNA_HELPDESK&&typeof unlockLoginGate==='function');
  await page.evaluate(finish=>{unlockLoginGate();showView('intake');document.documentElement.dataset.finish=finish;document.body.dataset.finishActive='true';window.yunaStateBefore=JSON.stringify(state);window.yunaWrites=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage)window.yunaWrites.push(k);return original.call(this,k,v)};window.yunaApplyCount=0;intakeApplyRow=()=>{window.yunaApplyCount++};},finish);
  await page.locator('#yunaInput').fill(input);await page.locator('#yunaSend').click();
  const preview=page.locator('.yuna-preview');await preview.waitFor();
  assert.deepEqual(await preview.locator('.yuna-preview-fields b').allTextContents(),['찐막채 송년회','2026-12-12','2026-12-13','예']);
  assert.equal(await page.locator('#yunaSave').count(),0);assert.match(await preview.innerText(),/일정 저장은 아직 지원하지 않습니다/);
  await preview.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(evidence,`${width}-${finish}.png`)});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page horizontal overflow');
  assert.ok(await preview.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'preview horizontal overflow');
  await page.locator('#yunaEdit').click();await page.locator('#yunaInput').fill('제목은 새 송년회');await page.locator('#yunaSend').click();
  assert.equal(await preview.locator('.yuna-preview-fields b').first().innerText(),'새 송년회');
  await page.locator('#yunaEdit').click();await page.locator('#yunaInput').fill('12월 14일부터 15일까지');await page.locator('#yunaSend').click();
  assert.deepEqual(await preview.locator('.yuna-preview-fields b').allTextContents(),['새 송년회','2026-12-14','2026-12-15','예']);
  assert.deepEqual(await page.evaluate(()=>({same:JSON.stringify(state)===window.yunaStateBefore,writes:window.yunaWrites,apply:window.yunaApplyCount})),{same:true,writes:[],apply:0});
  await page.locator(width===390?'#yunaMobileNew':'#yunaNew').click();await page.locator('#yunaInput').fill('내일까지 HDMI 젠더 챙기기');await page.locator('#yunaSend').click();
  assert.equal(await page.locator('#yunaSave').count(),1);assert.match(await preview.innerText(),/할 일/);
  cases++;await context.close();
 }
 console.log(`PASS ${cases} real-app synthetic UI combinations: desktop/mobile × Porcelain/Midnight; original input, title/date edits, deadline Save retained; application-state/localStorage writes 0. Screenshots: artifacts/yuna-schedule. External services blocked; no production data used.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
