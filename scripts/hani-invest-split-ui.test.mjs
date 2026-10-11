// Full runtime, synthetic holdings, external requests blocked. No saved state changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
if(!process.argv[2]||!process.argv[3])throw Error('Usage: node scripts/hani-invest-split-ui.test.mjs <playwright index.mjs> <browser exe>');
const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
const server=http.createServer((req,res)=>{
  const uri=decodeURIComponent(new URL(req.url,'http://test').pathname),file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port,out=path.join(root,'.ai-budget-private/invest-split-204');
let browser;
try{
  browser=await chromium.launch({executablePath:process.argv[3],headless:true});fs.mkdirSync(out,{recursive:true});
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:1000}});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    await context.addInitScript(()=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-10-11T05:21:00Z']));}static now(){return new NativeDate('2026-10-11T05:21:00Z').getTime();}};});
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/#investmentCommittee/monthly');
    await page.waitForFunction(()=>!!window.HaniInvestmentCommittee&&!!document.querySelector('#investmentCommittee .ic-section-tabs'));
    await page.evaluate(()=>{unlockLoginGate();showView(location.hash.slice(1));});
    await page.waitForFunction(()=>document.querySelector('#investmentCommittee > .ds-main-character-banner')&&document.querySelector('#icMonthly:not([hidden])'));
    assert.equal(await page.locator('#investmentCommittee [role=tab]').count(),2);
    assert.equal(await page.locator('#investmentCommittee > .ds-main-character-banner .ds-main-character-banner__scene img').count(),1);
    const finance=await page.locator('#sidebar [data-color=finance] .nav-btn').evaluateAll(nodes=>nodes.map(n=>n.dataset.view));
    assert.deepEqual(finance,['investment','investmentCommittee','investmentIntake','asset','ledger','newsroom']);
    await page.evaluate(()=>{location.hash='#investmentCommittee';});
    await page.waitForFunction(()=>document.body.dataset.view==='investmentCommittee'&&!document.getElementById('icResearch').hidden);
    await page.locator('#investmentCommittee [role=tab]').first().focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#icMonthly').isVisible(),true);
    await page.evaluate(()=>{
      state=freshState();state.instruments=[{id:'mock-aapl',name:'Apple',ticker:'005930',market:'KR',className:'주식'}];
      state.investmentBrokerSnapshots=[normalizeBrokerSnapshot({id:'mock-snapshot',mode:'actual',recordType:'actual',status:'confirmed',period:'2026-09',snapshotDate:'2026-09-20',accounts:[{accountId:state.accounts[0].id,enabled:true,holdingListMode:'complete',estimatedAssets:2026000,holdings:[{instrumentId:'mock-aapl',name:'Apple',ticker:'005930',market:'KR',quantity:3,evaluationAmount:2000000,currency:'KRW'}]}]})];
      window.splitState=JSON.stringify(state);window.splitKeys=Object.keys(state).sort();window.splitStorage=Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)]));
      window.splitNodes=[document.getElementById('assetMarket'),document.getElementById('marketChart'),document.getElementById('portfolioLivePreview')];
      const original=HaniAssetMarket.analyticsSource;
      HaniAssetMarket.analyticsSource=()=>({...original(),state,stocks:[{symbol:'005930',name:'Apple',market:'KOSPI',currency:'KRW'}],quotes:[{symbol:'005930',currency:'KRW',lastPrice:620555,timestamp:'2026-10-11T05:20:00Z'}]});
      window.dispatchEvent(new Event('hani:market-updated'));showView('asset');
    });
    assert.equal(await page.locator('#asset #assetMarket').count(),0);assert.equal(await page.locator('#asset #portfolioLivePreview').count(),0);
    const assetBasis=await page.locator('#asset [data-portfolio-summary]').innerText();
    console.log('DIAGNOSTICS asset basis',JSON.stringify({width,text:assetBasis}));
    assert.match(assetBasis,/실시간 평가 ₩1,861,665 · 10\/11 14:20 시세/,'asset live amount has quote time in KST');
    assert.match(assetBasis,/월별 확정 기록 ₩2,000,000 · 9\/20 기록/,'asset confirmed amount has record date');
    assert.match(assetBasis,/₩26,000 \(9\/20 기록\)/,'asset falls back to recorded cash with date');
    assert.match(assetBasis,/확정 기록 이후 시세 변동 −₩138,335/,'reconciliation compares same holdings without cash');
    assert.match(assetBasis,/현재 투자 자산\(추정\) ₩1,887,665/,'estimate adds live holdings and recorded cash');
    await page.locator('#asset [data-asset-market-link]').click();
    await page.waitForFunction(()=>document.body.dataset.view==='investment'&&document.querySelector('#investOverviewStocks.active #marketChart')&&document.querySelector('#investOverviewStocks .portfolio-treemap'));
    const visibleMap=width===390?'#portfolioLivePreview .portfolio-mobile-bars':'#portfolioLivePreview .portfolio-treemap';
    const layout=await page.locator('#portfolioLivePreview').evaluate(el=>({view:document.body.dataset.view,parent:el.parentElement.id,paneActive:el.parentElement.classList.contains('active'),mapDisplay:getComputedStyle(el.querySelector('.portfolio-treemap')).display,barsDisplay:getComputedStyle(el.querySelector('.portfolio-mobile-bars')).display,summary:el.querySelector('.portfolio-summary')?.textContent}));
    console.log('DIAGNOSTICS stock pane',JSON.stringify({width,...layout}));
    assert.equal(await page.locator('#assetMarket').isVisible(),true,'['+width+'] canonical market root is visible: '+JSON.stringify(layout));
    assert.equal(await page.locator(visibleMap).isVisible(),true,'['+width+'] responsive holdings visualization is visible: '+JSON.stringify(layout));
    assert.match(await page.locator(visibleMap).innerText(),/Apple/,'['+width+'] priced synthetic holding is rendered');
    assert.equal(await page.locator('#portfolioLivePreview [data-p-summary]').innerText(),assetBasis,'stock and asset summary share the same basis labels');
    await page.waitForFunction(()=>!!document.querySelector('#investment > .ds-main-character-banner'));
    assert.equal(await page.locator('#investment .ic-section-tabs').count(),0);
    for(const panel of ['investMonthly','investManage','investJournal','investOverview']){
      await page.evaluate(panel=>{showView('investmentCommittee/monthly');showView('investment');activateInvestmentTab(panel);},panel);
      assert.equal(await page.locator('#'+panel).isVisible(),true);
    }
    // Match the existing access-ui direct panel activation path.
    await page.evaluate(()=>{document.querySelectorAll('#investment .panel').forEach(node=>node.classList.remove('active'));document.getElementById('investOverview').classList.add('active');document.getElementById('investOverviewAll').classList.add('active');});
    assert.equal(await page.locator('#investOverviewAll').isVisible(),true);
    await page.evaluate(()=>activateInvestmentStocks());
    await page.locator('#investOverviewStocks').screenshot({path:path.join(out,width+'-stocks.png')});
    await page.evaluate(()=>showView('investmentCommittee'));
    await page.waitForFunction(()=>document.querySelector('#investmentCommittee > .ds-main-character-banner'));
    await page.locator('#investmentCommittee').screenshot({path:path.join(out,width+'-committee.png')});
    assert.equal(await page.evaluate(()=>JSON.stringify(state)===splitState),true,'UI navigation preserves all state values');
    assert.deepEqual(await page.evaluate(()=>Object.keys(state).sort()),await page.evaluate(()=>splitKeys));
    assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)]))),await page.evaluate(()=>splitStorage));
    assert.equal(await page.evaluate(()=>splitNodes.every(node=>node===document.getElementById(node.id))),true);
    for(const id of ['assetMarket','marketChart','portfolioLivePreview','icSections','icResearch','icMonthly'])assert.equal(await page.locator('#'+id).count(),1,id+' single instance');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
    await context.close();
  }
  console.log('PASS invest split UI 1440/390: sidebar order, hash/keyboard, asset route, single stock chart/map, legacy panels/access path, banner mounting, unchanged state/storage, screenshots and no page errors.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
