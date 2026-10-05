import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(import.meta.dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.argv[3],headless:true});
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000}});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();await page.goto(origin);await page.waitForTimeout(300);
  // Fresh synthetic profile only; no actual account/session/raw user data.
  await page.evaluate(()=>{
   document.querySelector('#loginGate').hidden=true;document.querySelector('#loginGate').style.display='none';
   document.querySelector('#app').classList.remove('login-locked');document.querySelector('#app').setAttribute('aria-hidden','false');
   cloudUser={id:'fixture-owner'};
   cloudClient={auth:{getUser:async()=>({data:{user:{id:'fixture-owner'}},error:null})},from:()=>({select:()=>({eq:()=>({limit:async()=>({data:[{user_id:'fixture-owner',state:structuredClone(state),revision:1}],error:null})})})})};
   // Period UI is isolated from session startup races. Real owner verification
   // is separately covered by hani-owner-verification-runtime.test.mjs.
   window.periodFixtureVerified=true;
   const binding={projectRef:'fixture',userId:'fixture-owner',sourceOwnerId:'fixture-owner',sourceOwnerVerified:true,datasetId:'fixture',sessionEpoch:'1'};
   dataHubRuntime=window.HANI_DATA_HUB.createDashboardRuntime({getSource:()=>window.periodFixtureSource||state,getContext:()=>binding,getBinding:()=>window.periodFixtureVerified?binding:null,
    verify:async()=>({status:window.periodFixtureVerified?'VERIFIED':'OWNER_BINDING_BLOCKED'}),getMonth:()=>dataHubSelectedMonth,
    canonical:{version:'fixture',brokerTotal:row=>brokerCalc(row).total,ledgerSpending:row=>ledgerCalc(row).jispiT},onChange:dataHubRenderDashboard,
    storeFactory:()=>({invalidate(){},async activate(){throw new Error('Isolated memory store')}})});
   dataHubRenderDashboard();
  });
  const before=await page.evaluate(()=>localStorage.getItem(STORAGE_KEY));
  if(process.argv.includes('--startup'))await page.evaluate(()=>{dataHubRuntime=null;});
  await page.locator('#dataHubMonth').fill('2026-09');await page.locator('#dataHubMonth').dispatchEvent('change');
  if(process.argv.includes('--startup')){
   await page.waitForTimeout(600);
   console.log('startup diagnostic:',await page.evaluate(async()=>{const result=await dataHubRuntime?.refresh();return {status:result?.status,reason:result?.reason,month:result?.month}}));
  }
  await page.waitForFunction(()=>dataHubRuntime?.peek().status==='VERIFIED',{},{timeout:3000});
  assert((await page.locator('#dataHubPeriod').innerText()).includes('2026-09'));
  assert((await page.locator('#dataHubPeriodHelp').innerText()).includes('데이터 삭제'));
  assert.equal(await page.evaluate(()=>dataHubRuntime.peek().asOf),await page.evaluate(()=>today()));
  if(!process.argv.includes('--startup')){
   await page.evaluate(async()=>{
    window.periodFixtureSource={...structuredClone(state),investmentBrokerSnapshots:[
     {mode:'actual',status:'confirmed',period:'2026-09',snapshotDate:'2026-09-30',accounts:[{accountId:'isa',accountName:'ISA',enabled:true,estimatedAssets:1000000,totalEvaluation:1000000,totalPurchase:900000,totalPnl:100000,totalReturn:null,loanAmount:null,holdings:[]}]}],
     ledgerMonths:[{month:'2026-09',items:[{date:'2026-09-10',category:'variable',amount:70000}]}]};
    dataHubSelectedMonth='2026-10';dataHubRuntime.invalidate();await dataHubRuntime.refresh();
   });
   assert((await page.locator('#homeInvestRate').innerText()).includes('최근 확정 자산 · 2026-09 · 2026-09-30'));
   assert((await page.locator('#homeJispiMeta').innerText()).includes('최근 마감 소비 · 2026-08-18~2026-09-17'));
   assert.notEqual(await page.locator('#homeAsset').innerText(),'기록 없음');
   assert.equal(await page.evaluate(()=>dataHubRuntime.peek().metrics.find(m=>m.key==='ne100').row.month),'2026-10');
   assert.equal(await page.evaluate(()=>localStorage.getItem(STORAGE_KEY)),before);
   const out=path.join(root,'qa-evidence');fs.mkdirSync(out,{recursive:true});
   await page.locator('#lifeMarketGrid').screenshot({path:path.join(out,`dashboard-monthly-cadence-${width}.png`)});
  }
  await page.evaluate(()=>{window.periodFixtureVerified=false;});
  if(process.argv.includes('--startup'))await page.evaluate(()=>{
   cloudClient={auth:{getUser:async()=>({data:{user:{id:'fixture-owner'}},error:null})},from:()=>({select:()=>({eq:()=>({limit:async()=>({data:[],error:null})})})})};
  });
  await page.locator('#dataHubMonth').fill('2026-08');await page.locator('#dataHubMonth').dispatchEvent('change');
  await page.evaluate(async()=>{await dataHubRuntime?.refresh()});
  await page.waitForFunction(()=>dataHubRuntime?.peek().status==='OWNER_BINDING_BLOCKED');
  assert.notEqual(await page.evaluate(()=>dataHubRuntime.peek().reason),'NOT_VERIFIED','must check finished rejection, not initial invalidation');
  assert.equal(await page.locator('#homeAsset').innerText(),'—');
  assert((await page.locator('#dataHubPeriodHelp').innerText()).includes('원본 검증'));
  assert.equal(await page.evaluate(()=>localStorage.getItem(STORAGE_KEY)),before);
  const bounds=await page.locator('#dataHubMonth').boundingBox();assert(bounds&&bounds.x+bounds.width<=width+1);
  const out=path.join(root,'qa-evidence');fs.mkdirSync(out,{recursive:true});
  await page.locator('#dataHubPeriodHelp').screenshot({path:path.join(out,`dashboard-period-help-${width}.png`)});
  console.log(`PASS dashboard ${width}: real event, selected month, real clock, missing-owner block, protected source unchanged, selector fits. Synthetic only.`);
  await context.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r))}
