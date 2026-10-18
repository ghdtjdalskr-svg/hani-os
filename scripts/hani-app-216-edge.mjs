// Offline, synthetic browser fixture. Never reaches real Cloud or user records.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'artifacts/a216-1');fs.mkdirSync(out,{recursive:true});
const playwright=process.argv[2]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const executablePath=process.env.HANI_CHROME_PATH||process.argv[3]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const {chromium}=await import(pathToFileURL(playwright).href);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)});
let browser;const result={browser:executablePath,widths:[],errors:[]};
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,executablePath});
 const context=await browser.newContext();await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(String(e)));page.on('dialog',()=>{throw Error('Unexpected browser dialog')});
 await page.goto(origin,{waitUntil:'load'});await page.waitForFunction(()=>typeof unlockLoginGate==='function');
 await page.evaluate(()=>{
  unlockLoginGate();commit=()=>{window.__commits=(window.__commits||0)+1;return true};
  window.__saved=localStorage.getItem('hani_os_life_v23');window.__commits=0;
  state.body=[{id:'delete-body',date:today(),weight:72.35,fat:0,muscle:null,bmi:23.45,fatMass:0}];
  state.exercise=[{id:'delete-exercise',date:today(),steps:6500,distance:4.25,strength:false,note:'삭제 확인 테스트'}];
   state.tasks=[{id:'today',text:'오늘 할 일 테스트',due:today(),done:false},{id:'future',text:'미래 할 일 테스트',due:'2099-01-01',done:false},{id:'past',text:'지난 할 일 테스트',due:'2000-01-01',done:false},{id:'derived',text:'오늘 자동 일정 테스트',dueAt:today()+'T09:00:00+09:00',sourceType:'care',done:false}];
  renderBody();renderExercise();renderHome();showView('diet');
 });
 // Actual buttons, native dialog, default focus, Escape, and single confirmed delete.
 await page.locator('[data-delete-body="delete-body"]').click();await page.locator('#recordDeleteDialog').waitFor({state:'visible'});
 assert.equal(await page.locator('#recordDeleteCancel').evaluate(el=>el===document.activeElement),true);
 assert.match(await page.locator('#recordDeleteValues').innerText(),/72\.35/);assert.equal(await page.evaluate(()=>__commits),0);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>state.body.length),1);
 await page.locator('[data-delete-body="delete-body"]').click();await page.locator('#recordDeleteDialog [value="approve"]').click();
 assert.equal(await page.evaluate(()=>state.body.length),0);assert.equal(await page.evaluate(()=>__commits),1);
 await page.evaluate(()=>showView('exercise'));await page.locator('[data-delete-exercise]').click();assert.match(await page.locator('#recordDeleteValues').innerText(),/6500/);await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>state.exercise.length),1,'Enter on default cancel preserves the row');
 // Verify an isolated synthetic source through the bundled Data Hub runtime.
 await page.evaluate(async()=>{
  const binding={userId:'fixture',sourceOwnerId:'fixture',sourceOwnerVerified:true,datasetId:'fixture',projectRef:'fixture',sessionEpoch:'fixture'};
  dataHubRuntime=window.HANI_DATA_HUB.createDashboardRuntime({getSource:()=>state,getContext:()=>binding,getBinding:()=>binding,verify:async()=>({status:'VERIFIED'}),clock:()=>new Date().toISOString(),canonical:{version:'fixture',brokerTotal:()=>0,ledgerSpending:()=>0},storeFactory:()=>({invalidate(){},async activate(){throw Error('Synthetic memory store')}})});
  await dataHubRuntime.refresh();dataHubRenderDashboard();
  const account=state.accounts[0];
  state.investmentBrokerSnapshots=[normalizeBrokerSnapshot({id:'browser-fixture',mode:'actual',status:'confirmed',period:today().slice(0,7),snapshotDate:today(),accounts:[{accountId:account.id,accountName:account.name,enabled:true,estimatedAssets:24000,holdings:[{name:'테스트 종목',ticker:'005930',quantity:2,buyPrice:10000,currentPrice:12000,purchaseAmount:20000,evaluationAmount:24000,pnl:4000,returnRate:20}]}]})];
  state.ledgerMonths=[normalizeLedgerMonth({id:'browser-ledger',month:today().slice(0,7),items:[{id:'item',date:today(),content:'가상 점심',payment:'테스트 카드',category:'variable',subcategory:'식비',detail:'점심',amount:12000,reimbursement:0,note:'모의 내역'}]})];
  state.ui.ledgerMonth=today().slice(0,7);renderBrokerDashboard();renderLedger();
 });
 for(const width of [390,650,651,1440]){
  await page.setViewportSize({width,height:900});
  if(width===390||width===1440){await page.evaluate(()=>{showView('exercise');document.querySelector('.hani-remote-close')?.click()});await page.locator('[data-delete-exercise]').click();assert.equal(await page.locator('#recordDeleteCancel').evaluate(el=>el===document.activeElement),true);await page.screenshot({path:path.join(out,`delete-confirm-${width}.png`)});await page.locator('#recordDeleteCancel').click();}
  await page.setViewportSize({width,height:900});await page.evaluate(()=>{showView('home');renderHome();document.querySelector('.hani-remote-close')?.click();window.scrollTo({top:0,behavior:'instant'})});
  const mobile=width<=650;
  assert.equal(await page.locator('.home-today-title').isVisible(),mobile);
  assert.equal(await page.locator('#homeTodayTaskMini').isVisible(),mobile);
  assert.equal(await page.locator('#homeTaskMini').isVisible(),!mobile);
  assert.match(await page.locator('#homeTodayTaskMini').innerText(),/오늘 할 일 테스트/);assert.match(await page.locator('#homeTodayTaskMini').innerText(),/오늘 자동 일정 테스트/);assert.doesNotMatch(await page.locator('#homeTodayTaskMini').innerText(),/미래|지난/);
  if(mobile){
   const boxes=await page.evaluate(()=>Object.fromEntries(['lifeMarketGrid','homeTodayTaskMini','seasonalLifeArtwork','lifeTicker'].map(id=>[id,document.getElementById(id).getBoundingClientRect().top])));
   assert.ok(boxes.lifeMarketGrid<boxes.homeTodayTaskMini&&boxes.homeTodayTaskMini<boxes.seasonalLifeArtwork&&boxes.homeTodayTaskMini<boxes.lifeTicker,JSON.stringify(boxes));
   assert.equal(await page.locator('#lifeMarketGrid [data-life-index]:visible').count(),6);
   // Presentation follows the actual gate result, with no fabricated verification.
   await page.evaluate(()=>{dataHubRenderDashboard();window.__actualVerified=document.querySelector('#home').dataset.sourceVerified});
   assert.equal(await page.evaluate(()=>__actualVerified),await page.evaluate(()=>String(dataHubRuntime?.peek().status==='VERIFIED')));
   assert.equal(await page.evaluate(()=>__actualVerified),'true','synthetic source actually verified');
   assert.equal(await page.locator('#dataHubPeriodHelp').isVisible(),false);
   if(width===390){await page.screenshot({path:path.join(out,'home-390.png'),fullPage:true});await page.screenshot({path:path.join(out,'home-fold-390.png')});}
   await page.evaluate(()=>{dataHubRuntime.invalidate();dataHubRenderDashboard()});assert.equal(await page.locator('#dataHubPeriodHelp').isVisible(),true);
   await page.evaluate(async()=>{await dataHubRuntime.refresh();dataHubRenderDashboard()});
  }
  if(width===1440)await page.screenshot({path:path.join(out,'home-1440.png'),fullPage:true});
  // Actual production renderers populate the same table in both summaries and full view.
  for(const [id,view,columns,key] of [['investmentHoldingsTable','investment',9,'brokerLatestHoldingRows'],['ledgerDetailTable','ledger',9,'ledgerItemRows']]){
   await page.evaluate(({view})=>{showView(view);if(view==='investment'){activateInvestmentTab('investOverview');renderBrokerDashboard()}else renderLedger()},{view});
   if(view==='investment')await page.locator('.investment-overview-tabs [data-panel="investOverviewAll"]').click();
   const button=page.locator(`[aria-controls="${id}"]`),table=page.locator('#'+id);
   assert.equal(await button.isVisible(),mobile,id+': toggle visibility at '+width);
   assert.equal(await table.locator('tbody tr:first-child td:visible').count(),mobile?4:columns);
   assert.match(await table.innerText(),view==='investment'?/테스트 종목/:/가상 점심/);
   if(mobile){await button.click();assert.equal(await button.getAttribute('aria-expanded'),'true');assert.equal(await table.locator('tbody tr:first-child td:visible').count(),columns);await button.click();assert.equal(await table.locator('tbody tr:first-child td:visible').count(),4);assert.ok(await table.evaluate(el=>el.scrollWidth<=el.clientWidth+1));}
   if(width===390||width===1440){await page.evaluate(()=>{document.querySelector('.hani-remote-close')?.click();window.scrollTo({top:0,behavior:'instant'})});await page.screenshot({path:path.join(out,`${view}-${width}.png`),fullPage:true});await table.screenshot({path:path.join(out,`${view}-summary-${width}.png`)});}
  }
  await page.evaluate(()=>showView('ledger'));await page.locator('#ledgerOpenImport').click();assert.equal(await page.locator('#ledgerImportRaw').evaluate(el=>el===document.activeElement),true);
  assert.equal(await page.locator('#ledgerImportRaw').count(),1);
  for(const [view,role] of [['investment','현황'],['investmentCommittee','판단'],['investmentIntake','입력'],['asset','저장된 구성'],['ledger','소비 결산']]){await page.evaluate(view=>showView(view),view);assert.match(await page.locator('#'+view+' .finance-role-caption').innerText(),new RegExp(role));}
  result.widths.push(width);
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')===__saved),true,'no protected data save during read-only UI');
 assert.equal(result.errors.length,0,result.errors.join('\n'));result.status='PASS';
}catch(e){result.status='FAILED_OR_BLOCKED';result.error=e.stack||String(e);process.exitCode=1;console.error(result.error)}finally{if(browser)await browser.close();server.close();fs.writeFileSync(path.join(out,'edge-result.json'),JSON.stringify(result,null,2));}
console.log(JSON.stringify(result));
