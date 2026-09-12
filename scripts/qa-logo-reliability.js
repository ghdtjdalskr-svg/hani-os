const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const baseUrl = process.env.HANI_QA_URL || 'http://127.0.0.1:8771/';
const outputDir = path.resolve('artifacts/logo-reliability-v29114');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const securities = [
  { id:'qa-samsung', name:'삼성전자', className:'주식', market:'KR', ticker:'005930' },
  { id:'qa-samsung-p', name:'삼성전자우', className:'주식', market:'KR', ticker:'005935' },
  { id:'qa-lg', name:'LG전자', className:'주식', market:'KR', ticker:'066570' },
  { id:'qa-lg-p', name:'LG전자우', className:'주식', market:'KR', ticker:'066575' },
  { id:'qa-nvidia', name:'엔비디아', className:'해외주식', market:'US', ticker:'NVDA' },
  { id:'qa-amazon', name:'아마존', className:'해외주식', market:'US', ticker:'AMZN' },
  { id:'qa-alphabet', name:'알파벳 Class A', className:'해외주식', market:'US', ticker:'GOOGL' },
  { id:'qa-hynix', name:'SK하이닉스', className:'주식', market:'KR', ticker:'000660' },
  { id:'qa-robo', name:'로보 글로벌 로보틱스/자동화 ETF', className:'ETF', market:'US', ticker:'ROBO' },
  { id:'qa-ace-bond', name:'ACE 미국30년국채액티브(H)', className:'ETF', market:'KR', ticker:'453850' },
  { id:'qa-ace-dividend', name:'ACE 미국배당퀄리티', className:'ETF', market:'KR', ticker:'0046Y0' },
  { id:'qa-kodex-gold', name:'KODEX 금액티브', className:'ETF', market:'KR', ticker:'0064K0' },
  { id:'qa-kodex-bond', name:'KODEX 미국10년국채액티브(H)', className:'ETF', market:'KR', ticker:'0091C0' },
  { id:'qa-kodex-n100', name:'KODEX 미국나스닥100', className:'ETF', market:'KR', ticker:'379810' },
  { id:'qa-kodex-n100h', name:'KODEX 미국나스닥100(H)', className:'ETF', market:'KR', ticker:'449190' },
  { id:'qa-kodex-robot', name:'KODEX 미국휴머노이드로봇', className:'ETF', market:'KR', ticker:'0038A0' },
  { id:'qa-kodex-ai', name:'KODEX 미국AI전력핵심인프라', className:'ETF', market:'KR', ticker:'487230' },
  { id:'qa-kodex-health', name:'KODEX 미국S&P500헬스케어', className:'ETF', market:'KR', ticker:'497020' },
  { id:'qa-tiger-sp500', name:'TIGER 미국S&P500', className:'ETF', market:'KR', ticker:'360750' },
  { id:'qa-fallback', name:'미래테마 실험형 ETF', className:'ETF', market:'OTHER', ticker:'QAFALL' },
];

const futureResolverCases = [
  { name:'KODEX 미래혁신테마', className:'ETF', market:'KR', ticker:'FUTURE-K', expectedId:'kodex' },
  { name:'TIGER 차세대산업', className:'ETF', market:'KR', ticker:'FUTURE-T', expectedId:'tiger' },
  { name:'ACE 미래배당성장', className:'ETF', market:'KR', ticker:'FUTURE-A', expectedId:'ace' },
  { name:'SOL 미래인프라', className:'ETF', market:'KR', ticker:'FUTURE-S', expectedId:'sol' },
  { name:'RISE 미래국채', className:'ETF', market:'KR', ticker:'FUTURE-R', expectedId:'rise' },
  { name:'PLUS 미래로봇', className:'ETF', market:'KR', ticker:'FUTURE-P', expectedId:'plus' },
  { name:'KOACT 미래AI', className:'ETF', market:'KR', ticker:'FUTURE-O', expectedId:'koact' },
  { name:'미래배당성장', issuer:'TIGER', className:'ETF', market:'KR', ticker:'FUTURE-I', expectedId:'tiger' },
  { name:'완전 신규 상장사', className:'주식', market:'KR', ticker:'123456', expectedId:'fallback-' },
  { name:'미등록 미래전략 ETF', className:'ETF', market:'OTHER', ticker:'NEWETF', expectedId:'fallback-' },
];

function assertSurface(surface, expected) {
  assert.equal(surface.rows, expected, `${surface.name}: expected ${expected} security rows/cards`);
  assert.equal(surface.missing, 0, `${surface.name}: logo missing`);
  assert.equal(surface.duplicates, 0, `${surface.name}: duplicate canonical logo`);
  assert.equal(surface.legacy, 0, `${surface.name}: legacy logo survived`);
  assert.equal(surface.blank, 0, `${surface.name}: neither mapped logo nor fallback is visible`);
  assert.equal(surface.visibleBrokenImages, 0, `${surface.name}: a broken image is visible`);
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const report = { baseUrl, securities: securities.map(x => `${x.name} (${x.ticker})`), viewports: [] };

  for (const viewport of [
    { name:'desktop-1440', width:1440, height:1000 },
    { name:'mobile-390', width:390, height:844 },
  ]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto(baseUrl, { waitUntil:'networkidle' });

    const setup = await page.evaluate(items => {
      const gate=document.querySelector('#loginGate');
      if(gate)gate.style.setProperty('display','none','important');
      const app=document.querySelector('#app');
      app?.classList.remove('login-locked','mobile-open');
      app?.setAttribute('aria-hidden','false');
      const storageBefore=localStorage.getItem('hani_os_life_v23');
      const original={
        accounts:structuredClone(state.accounts),
        instruments:structuredClone(state.instruments),
        transactions:structuredClone(state.transactions),
        snapshots:structuredClone(state.snapshots),
        investmentWatchlist:structuredClone(state.investmentWatchlist),
        investmentBrokerSnapshots:structuredClone(state.investmentBrokerSnapshots),
        ui:structuredClone(state.ui),
        brokerDraft:typeof brokerDraft==='undefined'?null:structuredClone(brokerDraft),
      };
      window.__HANI_LOGO_QA_ORIGINAL=original;
      const account={id:'qa-account',name:'QA 통합계좌',type:'ISA',broker:'QA증권',number:'0000',openingCash:200000000};
      state.accounts=[account];
      state.instruments=items.map(x=>({...x,price:10000,createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-01T00:00:00.000Z'}));
      state.investmentWatchlist=items.map((x,index)=>normalizeWatchlistItem({
        id:`watch-${index}`,instrumentId:x.id,name:x.name,market:x.market,ticker:x.ticker,
        registeredDate:'2026-09-01',status:index%2?'interest':'study',reason:'Logo Reliability QA',newsTracking:true,
      }));
      const holdings=(multiplier=1)=>items.map((x,index)=>normalizeBrokerHolding({
        id:`holding-${multiplier}-${index}`,instrumentId:x.id,name:x.name,market:x.market,ticker:x.ticker,
        quantity:(index+1)*multiplier,buyPrice:10000+index*100,currentPrice:10300+index*110,
      }));
      const makeSnapshot=(id,period,multiplier)=>normalizeBrokerSnapshot({
        id,mode:'actual',period,snapshotDate:`${period}-10`,status:'confirmed',note:'Logo Reliability QA',
        accounts:[{id:`${id}-account`,accountId:account.id,accountName:account.name,enabled:true,
          estimatedAssets:250000000,totalPurchase:null,totalEvaluation:null,totalPnl:null,totalReturn:null,
          holdings:holdings(multiplier)}],
        createdAt:`${period}-10T00:00:00.000Z`,updatedAt:`${period}-10T00:00:00.000Z`,revision:1,
      });
      const previous=makeSnapshot('qa-snapshot-previous','2026-08',1);
      const latest=makeSnapshot('qa-snapshot-latest','2026-09',2);
      state.investmentBrokerSnapshots=[previous,latest];
      state.transactions=[
        {id:'qa-deposit',date:'2026-08-01',accountId:account.id,type:'입금',amount:200000000,note:'QA',createdAt:'2026-08-01T00:00:00.000Z'},
        ...items.map((x,index)=>({id:`qa-buy-${index}`,date:'2026-09-01',accountId:account.id,type:'매수',instrumentId:x.id,qty:index+1,price:10000+index*100,fee:0,note:'QA',createdAt:`2026-09-01T00:00:${String(index).padStart(2,'0')}.000Z`})),
      ];
      state.snapshots=[];
      state.ui={...state.ui,latestHoldingAccount:'all',investmentYear:'2026',annualStockKey:'',watchlistFilter:'all',watchlistSearch:'',overviewAccountId:account.id,series:['total']};
      brokerDraft=normalizeBrokerSnapshot(structuredClone(latest));
      renderAll();
      document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='investment'));
      document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.view==='investment'));
      document.body.dataset.view='investment';

      const fixture=document.createElement('div');
      fixture.id='logoQaNewsroomFixture';
      fixture.hidden=true;
      fixture.innerHTML=items.map(x=>`<div class="investment-news-entity-row" data-news-entity="${x.id}"><div class="news-entity-main"><b>${x.name}</b><span>${x.market} · ${x.ticker}</span></div></div>`).join('');
      document.querySelector('#newsroom')?.appendChild(fixture);
      return {storageBefore,logoSystem:window.HANI_LOGO_SYSTEM,owners:window.HANI_CANONICAL_LOGO_OWNERS};
    }, securities);

    await page.waitForTimeout(2700);
    const runtime = await page.evaluate(({expectedNames,futureCases}) => {
      const legacySelector='.hani-etf-logo-v02982,.hani-etf-logo-v02981,.hani-etf-logo-v02980,.hani-security-logo-v02979,.hani-security-logo-v02978,.hani-security-logo-v02976';
      const inspect=(name,selector)=>{
        const rows=[...document.querySelectorAll(selector)];
        const stats={name,rows:rows.length,missing:0,duplicates:0,legacy:0,blank:0,visibleBrokenImages:0,details:[]};
        rows.forEach((row,index)=>{
          const logos=[...row.querySelectorAll('.hani-investment-logo,.hani-news-logo-v02983')];
          const legacy=row.querySelectorAll(legacySelector).length;
          const visibleBrokenImages=[...row.querySelectorAll('.hani-investment-logo img,.hani-news-logo-v02983 img')].filter(img=>{
            const style=getComputedStyle(img);
            return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0&&(!img.complete||img.naturalWidth===0);
          }).length;
          const blank=logos.filter(logo=>{
            const image=logo.querySelector('img');
            const mapped=!!image&&image.complete&&image.naturalWidth>0&&(logo.classList.contains('is-loaded')||logo.classList.contains('logo-loaded'));
            const fallback=logo.querySelector('.hani-investment-logo-glyph,.fallback');
            return !mapped&&(!fallback||getComputedStyle(fallback).display==='none'||getComputedStyle(fallback).visibility==='hidden'||Number(getComputedStyle(fallback).opacity)===0);
          }).length;
          if(logos.length===0)stats.missing++;
          if(logos.length>1)stats.duplicates++;
          if(legacy)stats.legacy+=legacy;
          stats.blank+=blank;
          stats.visibleBrokenImages+=visibleBrokenImages;
          stats.details.push({index,text:String(row.textContent||'').replace(/\s+/g,' ').trim().slice(0,90),logos:logos.length,legacy,blank,visibleBrokenImages});
        });
        return stats;
      };
      const surfaces=[
        inspect('instrument-master','#instrumentRows tr'),
        inspect('watchlist','#watchList .watchlist-item'),
        inspect('latest-holdings','#brokerLatestHoldingRows tr.security-row'),
        inspect('account-holdings','#overviewAccountHoldingRows tr.security-row'),
        inspect('annual-summary','#annualStockRows tr'),
        inspect('legacy-holdings','#holdingRows tr'),
        inspect('transactions','#transactionRows tr.security-row'),
        inspect('monthly-editor','#brokerAccountEditors .broker-holding'),
        inspect('newsroom-fixture','#logoQaNewsroomFixture .investment-news-entity-row'),
      ];
      const highlight=inspect('security-highlights','#investmentHighlights .highlight-card:has(> .hani-investment-logo)');
      const duplicateIds=[...document.querySelectorAll('[id]')].map(x=>x.id).filter((id,index,all)=>all.indexOf(id)!==index);
      const sports={
        cards:document.querySelectorAll('#game .sports-home-panel').length,
        tabs:document.querySelectorAll('#game [data-sports-tab]').length,
        panels:document.querySelectorAll('#game [data-sports-panel]').length,
        homeGrid:!!document.querySelector('#game .sports-home-overview'),
      };
      const futureResolver=futureCases.map(test=>{
        const first=window.HANI_LOGO_SYSTEM.resolveInvestment(test);
        const second=window.HANI_LOGO_SYSTEM.resolveInvestment(structuredClone(test));
        return {test,first,second};
      });
      const seasons=['spring','summer','autumn','winter'].map(key=>{applySeasonTheme(key,false);return document.documentElement.dataset.season;});
      const routed=['investment','game','aiTeam'].map(id=>{showView(id);return document.querySelector('.view.active')?.id||'';});
      const brandHosts=[...document.querySelectorAll('[data-hani-brand-logo]')].map(host=>{
        const frame=getComputedStyle(host),img=host.querySelector(':scope > img'),rect=host.getBoundingClientRect(),imgRect=img?.getBoundingClientRect();
        return {images:host.querySelectorAll(':scope > img').length,src:img?.getAttribute('src')||'',alt:img?.alt||'',width:rect.width,height:rect.height,overflow:frame.overflow,aspectRatio:frame.aspectRatio,imagePosition:img?getComputedStyle(img).position:'',imageExtendsBelow:!!imgRect&&imgRect.bottom>rect.bottom+1};
      });
      const brand={
        hosts:brandHosts,
        count:brandHosts.length,
        standaloneOutsideCanonical:[...document.querySelectorAll('img[src*="hani-group-ci-official"]')].filter(img=>!img.closest('[data-hani-brand-logo]')).length,
      };
      const storageAfter=localStorage.getItem('hani_os_life_v23');
      return {
        expectedNames,
        surfaces,
        highlight,
        brand,
        owners:window.HANI_CANONICAL_LOGO_OWNERS,
        logoSystemVersion:window.HANI_LOGO_SYSTEM?.version,
        legacyInvestmentLogos:[...(document.querySelector('#investment')?.querySelectorAll(legacySelector)||[])].map(el=>({className:el.className,parent:String(el.parentElement?.textContent||'').replace(/\s+/g,' ').trim().slice(0,120),parentClass:el.parentElement?.className||''})),
        duplicateIds,
        sports,
        futureResolver,
        seasons,
        routed,
        storageAfter,
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
      };
    }, {expectedNames:securities.map(x=>x.name),futureCases:futureResolverCases});

    runtime.surfaces.forEach(surface=>assertSurface(surface,securities.length));
    assertSurface(runtime.highlight,3);
    assert.deepEqual(runtime.owners,{brand:'hani-main',investment:'hani-main',newsroom:'hani-ui-v02983'});
    assert.equal(runtime.logoSystemVersion,'2.9.114');
    runtime.futureResolver.forEach(({test,first,second})=>{
      if(test.expectedId.endsWith('-'))assert.ok(first.id.startsWith(test.expectedId),`future fallback ID missing: ${JSON.stringify({test,first})}`);
      else assert.equal(first.id,test.expectedId,`future issuer prefix was not resolved centrally: ${JSON.stringify({test,first})}`);
      assert.deepEqual(first,second,`resolver must be deterministic for future securities: ${JSON.stringify(test)}`);
      assert.ok(first.fallback,`future security fallback mark is empty: ${JSON.stringify({test,first})}`);
      if(test.className==='ETF')assert.equal(first.type,'etf',`future ETF type mismatch: ${JSON.stringify({test,first})}`);
    });
    assert.equal(runtime.legacyInvestmentLogos.length,0,`legacy investment logo nodes survived: ${JSON.stringify(runtime.legacyInvestmentLogos)}`);
    assert.equal(runtime.brand.count,2,'two standalone HANI GROUP brand locations are expected');
    runtime.brand.hosts.forEach((host,index)=>{
      assert.equal(host.images,1,`brand host ${index}: exactly one image`);
      assert.match(host.src,/assets\/brand\/hani-group-ci-official\.webp$/);
      assert.equal(host.alt,'HANI GROUP 공식 로고');
      assert.equal(host.overflow,'hidden');
      assert.equal(host.aspectRatio,'1774 / 745',`brand crop ratio changed: ${JSON.stringify(host)}`);
      assert.equal(host.imagePosition,'absolute',`brand image must stay inside the crop frame: ${JSON.stringify(host)}`);
      if(host.width>0)assert.equal(host.imageExtendsBelow,true,`tagline pixels must remain outside the visible logo frame: ${JSON.stringify(host)}`);
    });
    assert.ok(runtime.brand.hosts.some(host=>host.width>0&&host.imageExtendsBelow),'at least one visible brand logo must be crop-verified');
    assert.equal(runtime.brand.standaloneOutsideCanonical,0,'official CI cannot bypass the canonical crop frame');
    assert.equal(runtime.sports.cards,4,'SPORTS HOME 2×2 cards changed');
    assert.equal(runtime.sports.tabs,5,'sports tabs changed');
    assert.equal(runtime.sports.panels,5,'sports panels changed');
    assert.equal(runtime.sports.homeGrid,true,'sports home grid missing');
    assert.deepEqual(runtime.seasons,['spring','summer','autumn','winter']);
    assert.deepEqual(runtime.routed,['investment','game','aiTeam']);
    assert.equal(runtime.duplicateIds.length,0,`duplicate IDs: ${runtime.duplicateIds.join(', ')}`);
    assert.equal(runtime.storageAfter,setup.storageBefore,'hani_os_life_v23 changed during read-only Logo QA');
    assert.equal(runtime.overflow,false,'document has horizontal overflow');
    assert.equal(pageErrors.length,0,`page errors: ${pageErrors.join(' | ')}`);
    const expectedSandboxNetworkErrors=consoleErrors.filter(message=>/ERR_NETWORK_ACCESS_DENIED|Supabase JS를 불러오지 못했습니다/.test(message));
    const unexpectedConsoleErrors=consoleErrors.filter(message=>!expectedSandboxNetworkErrors.includes(message));
    assert.equal(unexpectedConsoleErrors.length,0,`unexpected console errors: ${unexpectedConsoleErrors.join(' | ')}`);

    const activateView=async id=>page.evaluate(view=>{
      document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===view));
      document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
      document.body.dataset.view=view;
      window.scrollTo(0,0);
    },id);
    const activateInvestmentPanel=async id=>page.evaluate(panel=>{
      document.querySelectorAll('.investment-tabs-main .tab').forEach(x=>x.classList.toggle('active',x.dataset.panel===panel));
      ['investOverview','investMonthly','investManage','investJournal'].forEach(key=>document.getElementById(key)?.classList.toggle('active',key===panel));
      window.scrollTo(0,0);
    },id);
    await activateView('investment');
    await activateInvestmentPanel('investManage');
    await page.waitForTimeout(450);
    await page.screenshot({path:path.join(outputDir,`${viewport.name}-investment-manage.png`),fullPage:false});
    await page.evaluate(()=>document.querySelector('#instrumentRows')?.closest('.card')?.scrollIntoView({block:'start'}));
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(outputDir,`${viewport.name}-investment-logo-matrix.png`),fullPage:false});
    await activateInvestmentPanel('investOverview');
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(outputDir,`${viewport.name}-investment-overview.png`),fullPage:false});
    await activateView('aiTeam');
    await page.waitForTimeout(450);
    await page.screenshot({path:path.join(outputDir,`${viewport.name}-brand-company.png`),fullPage:false});

    report.viewports.push({viewport,setup:{logoSystem:setup.logoSystem,owners:setup.owners},runtime,consoleErrors,pageErrors,expectedSandboxNetworkErrors,unexpectedConsoleErrors});
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(outputDir,'qa-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({status:'PASS',outputDir,viewports:report.viewports.map(x=>({viewport:x.viewport,surfaces:x.runtime.surfaces.map(s=>({name:s.name,rows:s.rows})),brand:x.runtime.brand,sports:x.runtime.sports}))},null,2));
})().catch(error=>{console.error(error);process.exit(1)});
