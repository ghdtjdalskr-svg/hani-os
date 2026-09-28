// Isolated browser context, synthetic holdings and intercepted market responses. No real accounts.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const cacheMode=process.env.HANI_MARKET_CACHE_TEST==='1';
const stateFixture={version:'2.9.15-safe-baseline-bootstrap',accounts:[{id:'a',name:'토스',broker:'토스증권',type:'위탁'},{id:'b',name:'하나',broker:'하나증권',type:'위탁'}],instruments:[{id:'s',name:'삼성전자',ticker:'005930',market:'국내',price:68000}],transactions:[],snapshots:[],investmentBrokerSnapshots:[{id:'fixture',period:'2026-09',mode:'actual',status:'confirmed',accounts:[{id:'sa',accountId:'a',enabled:true,estimatedAssets:1000000,totalEvaluation:900000,totalPurchase:880000,holdings:[{id:'h',instrumentId:'s',name:'삼성전자',ticker:'005930',quantity:4,buyPrice:68000,purchaseAmount:272000,currentPrice:67500,evaluationAmount:270000,pnl:-2000},{id:'u',name:'코드 미확인 종목',quantity:null,evaluationAmount:300000}]},{id:'sb',accountId:'b',enabled:true,estimatedAssets:200000,totalEvaluation:200000,holdings:[{id:'us',name:'애플',ticker:'AAPL',quantity:1,buyPrice:150,currentPrice:200,evaluationAmount:200}]}]}],ui:{series:['total']},meta:{}};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{let data=fs.readFileSync(file);if(file.endsWith('index.html'))data=data.toString().replace('<meta name="hani-market-gateway" content="">','<meta name="hani-market-gateway" content="https://market.test">');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch(_){res.writeHead(404);res.end();}});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.HANI_CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1050},timezoneId:'Asia/Seoul'});let fail=false,charts=0;
    await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin===url)return route.continue();if(u.origin!=='https://market.test')return route.abort();
      if(fail)return route.fulfill({status:502,contentType:'application/json',body:'{"error":"offline"}'});
      const stocks=[{symbol:'005930',name:'삼성전자',currency:'KRW',market:'KOSPI'},{symbol:'AAPL',name:'애플',currency:'USD',market:'NASDAQ'}];let body;
      if(u.pathname==='/v1/stocks')body={result:stocks};else if(u.pathname==='/v1/prices')body={result:stocks.map(s=>({...s,lastPrice:s.currency==='KRW'?72000:210,timestamp:new Date().toISOString()}))};
      else if(u.pathname==='/v1/chart'){charts++;const kr=u.searchParams.get('symbol')==='005930';body={result:Array.from({length:24},(_,i)=>({timestamp:new Date(Date.now()-(24-i)*86400000).toISOString(),closePrice:kr?66500+i*200+Math.sin(i)*600:180+i,currency:kr?'KRW':'USD'})),complete:true,adjusted:false};}
      else if(u.pathname==='/v1/search')body={result:stocks};
      else body={result:[]};await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
    });
    await context.addInitScript(s=>{localStorage.setItem('hani_os_life_v23',JSON.stringify(s));localStorage.setItem('hani_os_gate_session_v2','1');},stateFixture);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
    await page.goto(url,{waitUntil:'networkidle'});
    if(cacheMode)await page.evaluate(()=>{
      document.querySelector('meta[name="hani-market-catalog"]')?.remove(); // Legacy-cache fallback fixture.
      if(document.querySelector('meta[name="hani-market-cache"]')?.content!=='hani-market-cache')throw Error('Runtime cache configuration is missing');
      const stocks=[{symbol:'005930',name:'삼성전자',currency:'KRW',market:'KOSPI'},{symbol:'AAPL',name:'애플',currency:'USD',market:'NASDAQ'}];
      const files={},charts={},collectedAt='2026-09-20T01:00:00Z';let n=0;
      for(const s of stocks)for(const period of ['1D','1W','1M','3M','6M','1Y']){const ref='charts/'+(++n).toString(16).padStart(64,'0')+'.json';charts[s.symbol+'/'+period]=ref;files['fixture/'+ref]={symbol:s.symbol,period,adjusted:false,complete:true,result:Array.from({length:24},(_,i)=>({timestamp:new Date(Date.parse(collectedAt)-(24-i)*86400000).toISOString(),closePrice:s.currency==='KRW'?68000+i*100:180+i,currency:s.currency}))};}
      files['fixture/latest.json']={version:1,collectedAt,stocks,quotes:stocks.map(s=>({symbol:s.symbol,currency:s.currency,lastPrice:s.currency==='KRW'?72000:210,timestamp:collectedAt})),charts};
      window.mockMarketStorage={from:()=>({download:async path=>({data:new Blob([JSON.stringify(files[path])])})})};
    });
    if(!cacheMode)await page.evaluate(()=>document.querySelector('meta[name="hani-market-cache"]')?.remove());
    await page.evaluate(()=>{unlockLoginGate();cloudClient={auth:{getSession:async()=>({data:{session:{access_token:'test-session',user:{id:'fixture'}}}})},storage:window.mockMarketStorage};showView('asset');});
    await page.locator('#marketStatus').filter({hasText:cacheMode?'PC 마지막 수집':'응답 정상'}).waitFor();await page.locator('#marketChart svg').waitFor();
    if(cacheMode)assert.match(await page.locator('#marketStatus').innerText(),/실시간 아님/);
    assert.match(await page.locator('#marketSummary').innerText(),/288,000/);assert.match(await page.locator('#marketCoverage').innerText(),/2\/3/);
    assert.equal(await page.locator('.market-holding').count(),3);assert.equal(await page.locator('#marketChart .market-average').count(),1);
    assert.match(await page.locator('#marketCards').innerText(),/코드 미확인 종목/);assert.match(await page.locator('#marketCards').innerText(),/300,000/);
    const seriesColor=()=>page.evaluate(()=>{const el=document.querySelector('#marketChart svg');return el?getComputedStyle(el).color:null;});
    const firstColor=await seriesColor();
    await page.waitForFunction(()=>document.querySelectorAll('.market-mini svg').length>=2);
    assert.equal(await page.locator('.market-mini svg').first().evaluate(el=>getComputedStyle(el).color),firstColor);
    assert.equal(await page.locator('#assetMarket [class*="security-logo"],#assetMarket [data-hani-investment-logo]').count(),0,'legacy card-wide logo inference must not enter market component');
    const before=await page.evaluate(()=>JSON.stringify({accounts:state.accounts,instruments:state.instruments,snapshots:state.investmentBrokerSnapshots}));
    await page.evaluate(()=>{window.marketWrites=0;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='hani_os_life_v23')window.marketWrites++;return original.call(this,k,v);};});
    await page.locator('#marketAccount').selectOption('b');await page.locator('#marketInstrument').filter({hasText:'애플'}).waitFor();await page.locator('#marketChart svg').waitFor();assert.match(await page.locator('#marketPosition').innerText(),/손익 —/);
    assert.notEqual(await seriesColor(),firstColor,'different fixture tickers should have distinct colors');
    await page.locator('[data-market-period="1Y"]').click();await page.locator('#marketChart svg').waitFor();
    await page.locator('#marketAccount').selectOption('a');await page.locator('#marketChart svg').waitFor();
    assert.equal(await seriesColor(),firstColor,'account switching preserves identity color');
    fail=true;await page.locator('#marketRefresh').click();await page.locator('#marketStatus').filter({hasText:cacheMode?'PC 마지막 수집':'연결을 확인하지 못했습니다'}).waitFor();assert.match(await page.locator('#marketSummary').innerText(),/288,000/);
    assert.equal(await page.evaluate(()=>window.marketWrites),0);assert.equal(await page.evaluate(()=>JSON.stringify({accounts:state.accounts,instruments:state.instruments,snapshots:state.investmentBrokerSnapshots})),before);
    fail=false;await page.locator('#marketRefresh').click();await page.locator('#marketStatus').filter({hasText:cacheMode?'PC 마지막 수집':'응답 정상'}).waitFor();await page.locator('#marketChart svg').waitFor();
    if(process.env.HANI_MARKET_SCREENSHOT){
      // Isolate the inspected component from existing sticky global chrome, only in this test context.
      await page.evaluate(()=>{for(const el of document.querySelectorAll('body *')){if(!el.closest('#assetMarket')&&['fixed','sticky'].includes(getComputedStyle(el).position))el.style.visibility='hidden';}const banner=document.createElement('p');banner.textContent='개발 미리보기 · 테스트 데이터 · 실제 토스 미연결';banner.style.cssText='padding:12px;background:#fff2d5;border-radius:12px;color:#7c510b';document.getElementById('assetMarket').prepend(banner);});
      await page.locator('#assetMarket').screenshot({path:process.env.HANI_MARKET_SCREENSHOT});
    }
    await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,'mobile overflow');
    await page.waitForFunction(()=>{const svg=document.querySelector('#marketChart svg');return svg&&svg.viewBox.baseVal.width<=400;});
    await page.waitForFunction(()=>document.querySelector('#assetMarket .market-toolbar .hani-remote-mobile-trigger'));
    assert.equal(await page.locator('.hani-remote-mobile-trigger').evaluate(el=>getComputedStyle(el).position),'static');
    await page.locator('.hani-remote-mobile-trigger').click();assert.equal(await page.locator('.hani-remote-mobile-trigger').getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');assert.equal(await page.locator('.hani-remote-mobile-trigger').getAttribute('aria-expanded'),'false');
    await page.waitForFunction(color=>{const el=document.querySelector('#marketChart svg');return el&&getComputedStyle(el).color===color;},firstColor);
    assert.equal(await seriesColor(),firstColor,'resize preserves identity color');
    assert.equal(await page.evaluate(()=>{
      const svg=document.querySelector('#marketChart svg'),rect=svg.querySelector('clipPath rect');
      const left=Number(rect.getAttribute('x')),top=Number(rect.getAttribute('y')),right=left+Number(rect.getAttribute('width')),bottom=top+Number(rect.getAttribute('height'));
      for(const label of svg.querySelectorAll('.market-y-tick')){const b=label.getBBox();if(b.x<0||b.x+b.width>left-5)return false;}
      for(const label of svg.querySelectorAll('.market-x-tick')){const b=label.getBBox();if(b.y<bottom+5)return false;}
      for(const path of svg.querySelectorAll('.market-price-line,.market-average')){const b=path.getBBox();if(b.x<left+3||b.x+b.width>right-3||b.y<top||b.y+b.height>bottom||!path.parentElement.hasAttribute('clip-path'))return false;}
      return true;
    }),true,'chart lines must remain inside plot and outside tick-label gutters');
    if(process.env.HANI_MARKET_SCREENSHOT)await page.locator('#assetMarket').screenshot({path:process.env.HANI_MARKET_SCREENSHOT.replace('.png','-mobile.png')});
    // Exercise form-only lookup in the actual relocated instrument-management panel.
    await page.evaluate(()=>{showView('investment');activateInvestmentTab('investManage');window.lookupSaveOwner=document.getElementById('addInstrument').onclick;});
    await page.locator('#instrumentLookupMarket').selectOption('NASDAQ');await page.locator('#instrumentLookupQuery').fill('애플');await page.locator('#instrumentLookupButton').click();
    await page.locator('#instrumentLookupResults button').first().waitFor();
    assert.match(await page.locator('#instrumentLookupStatus').innerText(),cacheMode?/전체 종목 검색 아님/:/토스 거래 가능 활성 종목/);
    if(process.env.HANI_MARKET_SCREENSHOT)await page.locator('#instrumentLookup').screenshot({path:process.env.HANI_MARKET_SCREENSHOT.replace('.png','-lookup.png')});
    await page.locator('#instrumentLookupResults button').first().click();
    assert.equal(await page.locator('#instrumentName').inputValue(),'애플');assert.equal(await page.locator('#instrumentTicker').inputValue(),'AAPL');assert.equal(await page.locator('#instrumentMarket').inputValue(),'US');assert.equal(await page.locator('#instrumentClass').inputValue(),'기타');
    assert.match(await page.locator('#instrumentLookupStatus').innerText(),/아직 저장되지/);
    assert.equal(await page.evaluate(()=>document.getElementById('addInstrument').onclick===window.lookupSaveOwner),true);
    await page.locator('#instrumentLookupMarket').selectOption('KOSPI');await page.locator('#instrumentLookupQuery').fill('삼성');await page.locator('#instrumentLookupButton').click();await page.locator('#instrumentLookupResults button').first().click();
    assert.match(await page.locator('#instrumentLookupStatus').innerText(),/이미 등록된 코드/);assert.equal(await page.locator('#instrumentTicker').inputValue(),'AAPL');
    await page.locator('#instrumentLookupMarket').selectOption('NASDAQ');await page.locator('#instrumentLookupQuery').fill('애플');await page.locator('#instrumentLookupButton').click();await page.locator('#instrumentLookupResults button').first().waitFor();await page.locator('#instrumentName').fill('직접 입력');await page.locator('#instrumentLookupResults button').first().click();
    assert.match(await page.locator('#instrumentLookupStatus').innerText(),/등록 폼이 변경/);assert.equal(await page.locator('#instrumentName').inputValue(),'직접 입력');
    await page.evaluate(()=>{document.getElementById('instrumentEditId').value='s';});
    await page.locator('#instrumentLookupButton').click();await page.locator('#instrumentLookupResults button').first().click();assert.match(await page.locator('#instrumentLookupStatus').innerText(),/다른 종목으로 연결하지/);
    assert.equal(await page.evaluate(()=>window.marketWrites),0);assert.equal(await page.evaluate(()=>JSON.stringify({accounts:state.accounts,instruments:state.instruments,snapshots:state.investmentBrokerSnapshots})),before);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    assert.deepEqual(errors,[]);console.log('PASS market browser: chart, average line, account scope, lookup form-only/duplicate/edit protection, unpriced preservation, foreign cost guard, periods, outage fallback, zero storage writes, mobile layout. Charts: '+charts);
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
