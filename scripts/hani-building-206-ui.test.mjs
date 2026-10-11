// node scripts/hani-building-206-ui.test.mjs <playwright index.mjs> <browser exe>
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(fileURLToPath(new URL('../', import.meta.url))),evidence=path.join(root,'.ai-budget-private/building-206-ui');fs.mkdirSync(evidence,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const uri=decodeURIComponent(new URL(req.url,'http://test').pathname),file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));if(!file.startsWith(root+path.sep)||uri.split('/').some(x=>x.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({executablePath:process.argv[3],headless:true});
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],missingArt=[];
  await context.addInitScript(()=>{const RealDate=Date;window.buildingClock=RealDate.parse('2026-10-11T09:00:00+09:00');window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[window.buildingClock]))}static now(){return window.buildingClock}}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:200,body:'',contentType:'text/plain'}));
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()!=='error')return;const url=m.location().url;if(/\/assets\/building\/floor-[1-4]f-v1\.webp$/.test(url)&&m.text().includes('404'))missingArt.push(url);else errors.push(m.text())});page.on('dialog',d=>d.dismiss());
  await page.goto(origin);await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&typeof showView==='function'&&!!window.HaniBuildingScene);
  await page.evaluate(()=>{unlockLoginGate();showView('agentReview')});
  await page.waitForFunction(()=>document.querySelector('#haniOfficeMap').dataset.floor==='4f'&&document.querySelector('#haniOfficeLive').dataset.paused==='false');
  const storage=await page.evaluate(()=>[localStorage.getItem('hani_os_life_v23'),sessionStorage.getItem('hani_os_life_v23')]);
  await page.evaluate(()=>{window.buildingOriginalActors=[...document.querySelector('#haniOfficeActors').children];window.buildingOriginalHost=document.querySelector('#haniOfficeMap')});
  for(const floor of ['4f','3f','2f','1f','4f']){
   await page.locator(`[data-building-floor="${floor}"]`).click();await page.waitForFunction(f=>document.querySelector('#haniOfficeMap').dataset.floor===f,floor);
   await page.waitForFunction(()=>document.querySelector('#haniOfficeMap').dataset.art==='fallback'||document.querySelector('#haniOfficeMap').dataset.art==='floor');
   assert.equal(await page.locator('.hani-building-tabs [aria-selected="true"]').count(),1);assert.ok(await page.locator('#haniOfficeActors .hani-office-actor:visible').count()<=6);
   assert.equal(await page.evaluate(()=>document.querySelectorAll('#haniOfficeMap').length===1&&buildingOriginalHost===document.querySelector('#haniOfficeMap')&&buildingOriginalActors.every((a,i)=>document.querySelector('#haniOfficeActors').children[i]===a)),true,'persistent engine/actor slots');
   assert.equal(await page.evaluate(()=>[document.documentElement,document.querySelector('#haniOfficeLive'),document.querySelector('.hani-office-scroll')].every(e=>e.scrollWidth<=e.clientWidth+2)),true,'no horizontal overflow');
   await page.waitForFunction(()=>[...document.querySelectorAll('#haniOfficeActors .hani-office-avatar')].filter(e=>!e.parentElement.hidden).every(e=>e.complete&&e.naturalWidth>0));
   await page.screenshot({path:path.join(evidence,`${width}-${floor}.png`),fullPage:true});
  }
  await page.locator('[data-building-floor="4f"]').focus();await page.keyboard.press('End');assert.equal(await page.locator('[data-building-floor="1f"]').getAttribute('aria-selected'),'true');await page.keyboard.press('Home');
  await page.evaluate(()=>{buildingClock=Date.parse('2026-10-11T12:05:00+09:00')});await page.locator('[data-building-floor="4f"]').click();
  assert.ok(await page.locator('#haniOfficeActors [data-activity="rest"]:visible').count()>=1);assert.ok(await page.locator('#haniOfficeActors .hani-office-actor:visible').count()<=6);
  await page.evaluate(()=>{buildingClock=Date.parse('2026-10-11T10:05:00+09:00')});await page.locator('[data-building-floor="2f"]').click();assert.equal(await page.locator('.hani-building-overflow').innerText(),'+2');assert.equal(await page.locator('#haniOfficeActors .hani-office-actor:visible').count(),6);
  await page.screenshot({path:path.join(evidence,`${width}-2f-conference.png`),fullPage:true});
  await page.evaluate(()=>{buildingClock=Date.parse('2026-10-11T09:00:00+09:00')});await page.locator('[data-building-floor="4f"]').click();
  // Existing read-only meeting bridge: synthetic case, never writes/contacts Cloud.
  await page.evaluate(()=>haniOfficeLiveUpdate({case:{id:'building-synthetic',title:'합성 안건',hani_final:{executive_summary:'기존 결재 경로 보존'}},reviews:[{agent_key:'JIEUN',review_round:1,summary:'합성 검토'}]}));
  await page.locator('#haniOfficeMeetingOpen').click();await page.waitForFunction(()=>document.querySelector('#haniOfficeMap').dataset.state==='meeting');assert.equal(await page.locator('#haniOfficeMeeting').isVisible(),true);assert.match(await page.locator('#haniOfficeConversation').innerText(),/합성 검토/);
  await page.locator('[data-building-floor="3f"]').click();assert.equal(await page.locator('#haniOfficeMeeting').isVisible(),true);await page.locator('#haniOfficeReturn').click();await page.waitForFunction(()=>document.querySelector('#haniOfficeMap').dataset.state==='idle');
  await page.evaluate(()=>showView('home'));await page.waitForFunction(()=>document.querySelector('#haniOfficeLive').dataset.paused==='true');
  await page.evaluate(()=>showView('agentReview'));await page.waitForFunction(()=>document.querySelector('#haniOfficeLive').dataset.paused==='false');
  assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('hani_os_life_v23'),sessionStorage.getItem('hani_os_life_v23')]),storage);
  assert.deepEqual(errors,[],'no JS/unexpected console errors (missing future art 404 recorded separately)');
  console.log(`PASS ${width}: 4 floors, persistent slots, no overflow, meeting bridge, hidden pause, protected data unchanged; expected missing art probes ${missingArt.length}`);await context.close();
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
