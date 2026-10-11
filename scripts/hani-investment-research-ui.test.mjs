/* Full app UI, synthetic fixture only; usage: node <file> <playwright/index.mjs> <browser.exe> */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/investment-research-mock.json', import.meta.url), 'utf8'));
if (!process.argv[2] || !process.argv[3]) throw Error('Usage: node scripts/hani-investment-research-ui.test.mjs <playwright index.mjs> <browser exe>');
const {chromium} = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname), file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404); res.end(); return;}
  const mime = {'.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.jpg':'image/jpeg'};
  res.setHeader('Content-Type', mime[path.extname(file)] || 'text/html; charset=utf-8'); res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
const evidence = process.argv[4] ? path.resolve(root, process.argv[4]) : path.join(root, 'artifacts/investment-research');
try {
  browser = await chromium.launch({executablePath: process.argv[3], headless: true});
  fs.mkdirSync(evidence, {recursive: true});
  for (const width of [1440, 390]) for (const finish of ['porcelain-cream', 'midnight-black']) {
    const context = await browser.newContext({viewport:{width, height:900}, permissions:['clipboard-read','clipboard-write']});
    await context.addInitScript(() => {
      const NativeDate=Date;
      window.Date=class extends NativeDate {constructor(...args){super(...(args.length?args:['2026-10-11T03:00:00Z']));}static now(){return new NativeDate('2026-10-11T03:00:00Z').getTime();}};
    });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if (message.type() === 'error' && !/net::ERR_FAILED|Failed to load resource/.test(message.text())) errors.push('console: ' + message.text());});
    page.on('dialog', dialog => dialog.dismiss());
    await page.goto(origin); await page.waitForFunction(() => !!window.HaniInvestmentCommittee && !!document.querySelector('.ic-section-tabs'));
    await page.evaluate(({finish, fixture}) => {
      unlockLoginGate(); showView('investmentCommittee'); document.documentElement.dataset.finish = finish; document.body.dataset.finishActive = 'true';
      state = freshState();
      // Existing opinion regression uses an explicit empty selection; default broker behavior is tested below.
      state.ui.icAccumulationAccountIds = [];
      state.instruments = [{id: fixture.cards[0].instrumentId, name: fixture.cards[0].name, ticker: fixture.cards[0].ticker, market: 'KR'}];
      state.investmentWatchlist = [normalizeWatchlistItem({...fixture.cards[3], id:'mock-watch', status:'study'})];
      state.investmentBrokerSnapshots = [normalizeBrokerSnapshot({id:'mock-broker', mode:'positions', recordType:'positions', status:'confirmed', period:'2026-10', snapshotDate:'2026-10-10', accounts:[{accountId:state.accounts[0].id, enabled:true, holdings:[{instrumentId:fixture.cards[0].instrumentId, name:fixture.cards[0].name, ticker:fixture.cards[0].ticker, market:'KR', quantity:3, buyPrice:50000, buyCurrency:'KRW'}]}]})];
      window.icStored = null; window.icWrites = []; const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {window.icWrites.push(key); return original.call(this,key,value);};
      window.icLegacy = JSON.stringify([state.instruments,state.accounts,state.transactions,state.investmentBrokerSnapshots,state.investmentWatchlist,state.ledgerMonths]);
      window.HaniAssetMarket.readResearchQuotes = async () => ({stocks:[{symbol:'005935',market:'KOSPI',currency:'KRW'}],quotes:[{symbol:'005935',currency:'KRW',lastPrice:55000,timestamp:'2026-10-09T01:00:00Z'}]});
      renderAll();
    }, {finish, fixture});
    const tabs = page.locator('#investmentCommittee #icSections');
    await page.waitForFunction(() => !!document.querySelector('#investmentCommittee > .ds-main-character-banner'));
    assert.equal(await tabs.getByRole('tab').count(), 2); assert.equal(await tabs.getByRole('tab',{name:'종목 리서치'}).getAttribute('aria-selected'), 'true');
    const legacyOverview = await page.locator('#investOverviewAll').innerHTML();
    // QA1: explicit creation, save, reopen and reload; no automatic card generation.
    await tabs.getByRole('tab',{name:'종목 리서치'}).click(); const host = page.locator('.ic-research');
    assert.match(await host.innerText(), /HANI Investment Research를 시작해볼까요/);
    assert.equal(await page.evaluate(() => state.investmentResearchCards.length), 0);
    const beforeCreate = await page.evaluate(() => icWrites.length);
    await host.getByRole('button',{name:'+ 첫 Research 작성',exact:true}).click(); const editor = page.locator('.ic-editor');
    await editor.locator('[data-ic-picker]').selectOption('0');
    assert.equal(await editor.locator('[name=status]').inputValue(), 'OWNED');
    await editor.locator('[name=rating]').selectOption('BUY');
    for (const [field,value] of [['fairValueLow','50000'],['fairValue','65000'],['fairValueHigh','80000']]) await editor.locator('[name='+field+']').fill(value);
    const thesis = editor.locator('details').filter({has:page.locator('[name=thesis]')}); await thesis.locator('summary').click();
    await editor.locator('[name=thesis]').fill(fixture.cards[0].thesis.join('\n'));
    assert.equal(await page.evaluate(() => icWrites.length), beforeCreate);
    // QA4: framework total is automatic.
    for (const [i,value] of ['20','15','12','10','10','8'].entries()) await editor.locator('[name=score'+i+']').fill(value);
    assert.equal(await editor.locator('[data-ic-total]').innerText(), '75/100');
    await editor.getByRole('button',{name:'Research 저장',exact:true}).click(); await editor.waitFor({state:'hidden'});
    assert.equal(await host.locator('.ic-card').count(),1); assert.match(await host.innerText(),/기준 10\/09 10:00/);
    assert.doesNotMatch(await host.innerText(),/\d{4}-\d{2}-\d{2}T/);
    {
      const header=host.locator('.ic-header'),top=page.locator('.ui26-top');
      for(const phase of ['initial','anchor scroll']){
        if(phase==='anchor scroll')await header.evaluate(el=>el.scrollIntoView({block:'start'}));
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const a=await header.boundingBox(),b=await top.boundingBox(),diagnostics={width,finish,phase,header:a,top:b,scrollY:await page.evaluate(()=>scrollY)};
        console.log('DIAGNOSTICS IC header bounds',JSON.stringify(diagnostics));
        assert.ok(a&&b,'IC header/top bounding boxes exist: '+JSON.stringify(diagnostics));
        const overlap=Math.min(a.x+a.width,b.x+b.width)>Math.max(a.x,b.x)&&Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y)+1;
        assert.equal(overlap,false,'sticky top bar must not overlap IC header: '+JSON.stringify(diagnostics));
      }
    }
    await host.getByRole('button',{name:'상세 / 수정'}).click();
    assert.equal(await editor.locator('[name=rating]').inputValue(),'BUY'); assert.equal(await editor.locator('details[open]').count(),0);
    await editor.getByRole('button',{name:'닫기',exact:true}).click();
    await host.getByRole('button',{name:'보유 현황 보기',exact:true}).click();
    assert.equal(await page.evaluate(()=>document.body.dataset.view),'investment');
    assert.equal(await page.locator('#investOverviewStocks').isVisible(),true);
    await page.evaluate(()=>showView('investmentCommittee'));
    await host.getByRole('button',{name:'상세 / 수정'}).click();
    let history = await page.evaluate(() => JSON.stringify(state.investmentResearchHistory));
    await editor.getByRole('button',{name:'Research 저장',exact:true}).click(); await editor.waitFor({state:'hidden'});
    assert.equal(await page.evaluate(() => JSON.stringify(state.investmentResearchHistory)), history);
    // QA2+3: Rating and FV diff, optional reason, immutable timeline.
    await host.getByRole('button',{name:'상세 / 수정'}).click();
    await editor.locator('[name=rating]').selectOption('HOLD'); await editor.locator('[name=fairValue]').fill('60000'); await editor.locator('[name=reason]').fill('이익 전망 하향');
    assert.match(await editor.innerText(), /주가가 올랐다는 이유만으로 Fair Value를 변경하지 않는다/);
    await editor.getByRole('button',{name:'Research 저장',exact:true}).click(); await editor.waitFor({state:'hidden'});
    const change = await page.evaluate(() => state.investmentResearchHistory.at(-1));
    assert.deepEqual(change.changes.rating,{from:'BUY',to:'HOLD'}); assert.deepEqual(change.changes.fairValue,{from:65000,to:60000}); assert.equal(change.fairValueChangeReason,'이익 전망 하향');
    assert.equal(await page.evaluate(() => JSON.stringify(state.investmentResearchHistory.slice(0,1))),history);
    await host.getByRole('button',{name:'상세 / 수정'}).click();
    await editor.locator('details').filter({has:page.locator('.ic-timeline')}).locator('summary').click();
    assert.match(await editor.locator('.ic-timeline').innerText(),/BUY → HOLD/); assert.match(await editor.locator('.ic-timeline').innerText(),/이익 전망 하향/);
    await editor.getByRole('button',{name:'닫기',exact:true}).click();
    // QA6: existing watch candidate, cancel safe, manual price and custom action.
    await host.getByRole('button',{name:'+ Research 작성',exact:true}).click();
    await editor.locator('[data-ic-picker]').selectOption('1'); assert.equal(await editor.locator('[name=name]').inputValue(),'NVIDIA'); assert.equal(await editor.locator('[name=status]').inputValue(),'WATCH');
    await editor.locator('details').filter({has:page.locator('[name=thesis]')}).locator('summary').click(); await editor.locator('[name=thesis]').fill(fixture.cards[3].thesis.join('\n'));
    await editor.locator('details').filter({has:page.locator('[name=manualValue]')}).locator('summary').click();
    await editor.locator('[name=manualValue]').fill('120'); await editor.locator('[name=manualCurrency]').fill('USD'); await editor.locator('[name=manualAsOf]').fill('2026-10-10');
    await editor.locator('details').filter({has:page.locator('[name=customAction]')}).locator('summary').click();
    await editor.locator('[name=action]').selectOption('CUSTOM'); await editor.locator('[name=customAction]').fill('분기 실적 확인 후 검토');
    await editor.getByRole('button',{name:'Research 저장',exact:true}).click(); await editor.waitFor({state:'hidden'});
    assert.match(await host.innerText(),/120 USD/); assert.match(await host.innerText(),/분기 실적 확인 후 검토/);
    // GPT export → prose/fenced import → diffs → exclusion → explicit confirmation.
    await host.getByRole('button',{name:'GPT용 자료 복사'}).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText()); assert.match(copied,/OUTPUT/); assert.match(copied,/changeReason/);
    await page.evaluate(()=>{window.icBeforeCopyWrites=icWrites.length;window.icOriginalExec=document.execCommand;Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied for fallback test');}}});document.execCommand=command=>{window.icFallbackPrompt=document.querySelector('.ic-clipboard')?.value;return command==='copy';};});
    await host.getByRole('button',{name:'GPT용 자료 복사'}).click();
    assert.match(await page.evaluate(()=>icFallbackPrompt),/OUTPUT/);assert.equal(await host.locator('.ic-clipboard').count(),0);assert.equal(await page.evaluate(()=>icWrites.length),await page.evaluate(()=>icBeforeCopyWrites));
    await page.evaluate(()=>{delete navigator.clipboard;document.execCommand=icOriginalExec;});
    const report = [{...fixture.cards[0],rating:'REDUCE',changeReason:'가치평가 재검토'},fixture.cards[4],fixture.cards[5]];
    await host.getByRole('button',{name:'리포트 붙여넣기'}).click(); const importer=page.locator('.ic-import');
    const beforeImport = await page.evaluate(() => ({state:JSON.stringify(state),writes:icWrites.length}));
    await importer.locator('[data-ic-report]').fill('분석 결과:\n```json\n'+JSON.stringify(report)+'\n```\n참고하세요');
    await importer.getByRole('button',{name:'변경 검토',exact:true}).click(); assert.equal(await importer.locator('.ic-review-item').count(),3);
    assert.match(await importer.locator('.ic-review-item').first().innerText(),/HOLD → REDUCE/); assert.match(await importer.innerText(),/가치평가 재검토/);
    assert.deepEqual(await page.evaluate(() => ({state:JSON.stringify(state),writes:icWrites.length})),beforeImport);
    await importer.locator('[data-ic-include="2"]').uncheck(); await importer.getByRole('button',{name:'선택 반영',exact:true}).click(); await importer.waitFor({state:'hidden'});
    assert.deepEqual(await page.evaluate(() => state.investmentResearchCards.map(c=>c.name)),['삼성전자우','NVIDIA','Amazon']);
    // GPT continuation opens a prefilled memory-only draft and cancellation leaves state untouched.
    const afterGpt=await page.evaluate(()=>({state:JSON.stringify(state),writes:icWrites.length}));
    await host.getByRole('button',{name:'이번 달 위원회로 이어서',exact:true}).click();
    const monthly=page.locator('.ic-monthly');
    assert.equal(await tabs.getByRole('tab',{name:'월간 위원회'}).getAttribute('aria-selected'),'true');
    assert.match(await monthly.innerText(),/HANI GROUP · INVESTMENT COMMITTEE · 2026 OCTOBER/);
    assert.match(await monthly.locator('[name=actionPlan]').inputValue(),/삼성전자우/);
    assert.match(await monthly.locator('[name=newWatchlist]').inputValue(),/Amazon/);
    assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(state),writes:icWrites.length})),afterGpt);
    await monthly.getByRole('button',{name:'초안 취소',exact:true}).click();
    await tabs.getByRole('tab',{name:'종목 리서치'}).click();
    // Stale import cannot silently overwrite changes; no report parsing save.
    await host.getByRole('button',{name:'리포트 붙여넣기'}).click(); await importer.locator('[data-ic-report]').fill(JSON.stringify([fixture.cards[0]])); await importer.getByRole('button',{name:'변경 검토',exact:true}).click();
    await page.evaluate(() => {state.investmentResearchCards[0].executiveComment='동시 변경';});
    const staleBefore=await page.evaluate(() => JSON.stringify(state)); await importer.getByRole('button',{name:'선택 반영',exact:true}).click();
    assert.match(await importer.locator('.ic-error').innerText(),/원본이 변경/); assert.equal(await page.evaluate(() => JSON.stringify(state)),staleBefore); await importer.getByRole('button',{name:'닫기',exact:true}).click();
    // QA7: no horizontal overflow; UI screenshots and unique actual runtime IDs.
    assert.ok(await host.evaluate(el=>el.scrollWidth<=el.clientWidth+1)); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const duplicates=await page.evaluate(()=>{const all=[...document.querySelectorAll('[id]')].map(el=>el.id);return [...new Set(all.filter((id,i)=>all.indexOf(id)!==i))].filter(id=>id.startsWith('ic'));}); assert.deepEqual(duplicates,[]);
    await host.screenshot({path:path.join(evidence,`${width}-${finish}-research.png`)});
    await host.locator('.ic-card').first().getByRole('button',{name:'상세 / 수정'}).click();
    assert.ok(await editor.evaluate(el=>el.scrollWidth<=el.clientWidth+1)); await editor.screenshot({path:path.join(evidence,`${width}-${finish}-detail.png`)}); await editor.getByRole('button',{name:'닫기',exact:true}).click();
    // QA5: confirm/freeze, past-month read-only, revisions append, actual holdings and theme overlap.
    await page.evaluate(({fixture})=>{
      const C=HaniInvestmentResearchCore;
      const draft=C.committeeDraft(state,'2026-09');draft.executiveSummary='9월 확정 요약';
      C.confirmCommittee(state,draft,()=>commit('synthetic September'),{uid,now:'2026-09-30T01:00:00Z',holdingRows:HaniMarketData.positions(state,calculate().holdings)});
      window.icSeptember=JSON.stringify(state.investmentCommitteeSnapshots[0]);
      C.applyBatch(state,[{card:{...fixture.cards[1],themes:['배당']}},{card:{...fixture.cards[2],themes:['배당']}}],()=>commit('synthetic theme cards'),{uid});
    },{fixture});
    await host.locator('.ic-card').first().getByRole('button',{name:'상세 / 수정'}).click();
    await editor.locator('[name=rating]').selectOption('BUY');await editor.locator('[name=fairValue]').fill('70000');
    await editor.locator('details').filter({has:page.locator('[name=themes]')}).locator('summary').click();await editor.locator('[name=themes]').fill('배당');
    await editor.getByRole('button',{name:'Research 저장',exact:true}).click();await editor.waitFor({state:'hidden'});
    await tabs.getByRole('tab',{name:'월간 위원회'}).click();
    assert.deepEqual(await monthly.locator('.ic-months button').allTextContents(),['2026.10','2026.09']);
    await monthly.locator('[data-month="2026-09"]').click();
    assert.match(await monthly.innerText(),/9월 확정 요약/);assert.equal(await monthly.locator('form').count(),0);
    const pastRow=monthly.locator('.ic-snapshot-security').first();assert.match(await pastRow.innerText(),/65,000 KRW/);assert.match(await pastRow.innerText(),/REDUCE/);
    await pastRow.getByRole('button',{name:'종목 상세 · Rating History'}).click();
    assert.match(await editor.locator('.ic-timeline').innerText(),/월간 위원회 2026.09/);
    assert.match(await editor.locator('.ic-timeline').innerText(),/REDUCE/);assert.equal(await editor.locator('[name=rating]').inputValue(),'BUY');
    await editor.getByRole('button',{name:'닫기',exact:true}).click();await tabs.getByRole('tab',{name:'월간 위원회'}).click();
    const beforeDraft=await page.evaluate(()=>({state:JSON.stringify(state),writes:icWrites.length}));
    await monthly.getByRole('button',{name:'이번 달 위원회 시작',exact:true}).click();
    assert.match(await monthly.locator('[name=strengthened]').inputValue(),/REDUCE → BUY/);
    assert.match(await monthly.locator('.ic-overlap').innerText(),/HIGH · 보유 카드 3개/);
    await monthly.locator('[name=ratingPreset]').selectOption('SELECTIVE BUY');
    assert.equal(await monthly.locator('[name=portfolioRating]').inputValue(),'SELECTIVE BUY');
    await monthly.locator('[name=portfolioRating]').fill('HOLD / SELECTIVE BUY');
    for(const [key,value] of [['marketView','시장 관찰'],['executiveSummary','10월 핵심 요약'],['haniRecommendation','현재 논리를 확인하며 선별 매수'],['actionPlan','삼성전자우 실적 확인\nNVIDIA 관찰']])await monthly.locator('[name='+key+']').fill(value);
    assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(state),writes:icWrites.length})),beforeDraft);
    // Unrelated rerender and tab switches preserve draft text; none cause a write.
    await page.evaluate(()=>HaniInvestmentCommittee.render());
    await monthly.locator('[data-month="2026-09"]').click();await monthly.locator('[data-month="2026-10"]').click();
    assert.equal(await monthly.locator('[name=executiveSummary]').inputValue(),'10월 핵심 요약');
    assert.ok(await monthly.evaluate(el=>el.scrollWidth<=el.clientWidth+1));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await monthly.screenshot({path:path.join(evidence,`${width}-${finish}-monthly-draft.png`)});
    await monthly.getByRole('button',{name:'이번 달 위원회 확정',exact:true}).click();
    assert.equal(await monthly.locator('form').count(),0);assert.match(await monthly.innerText(),/10월 핵심 요약/);
    assert.equal(await monthly.locator('[data-monthly=start]').isVisible(),false);
    assert.equal(await page.evaluate(()=>state.investmentCommitteeSnapshots.length),2);
    const original=await page.evaluate(()=>JSON.stringify(state.investmentCommitteeSnapshots[1]));
    const frozenSummary=await monthly.locator('.ic-snapshot-securities').innerText();
    // Live card edits and price cache changes cannot recompute frozen data, even in October.
    await page.evaluate(()=>{
      const C=HaniInvestmentResearchCore,card=state.investmentResearchCards[0];
      C.applyBatch(state,[{existingId:card.id,card:{...card,rating:'EXIT',fairValue:51000}}],()=>commit('synthetic after confirm'),{uid});
      window.dispatchEvent(new Event('hani:market-updated'));
    });
    assert.equal(await monthly.locator('.ic-snapshot-securities').innerText(),frozenSummary);
    await monthly.getByRole('button',{name:'수정본 추가',exact:true}).click();
    await monthly.locator('[name=executiveSummary]').fill('10월 수정된 요약');
    assert.equal(await page.evaluate(()=>state.investmentCommitteeSnapshots.length),2);
    await monthly.getByRole('button',{name:'이번 달 위원회 확정',exact:true}).click();
    assert.match(await monthly.innerText(),/수정본 2/);assert.match(await monthly.innerText(),/이전 수정본 1개/);
    assert.equal(await page.evaluate(()=>state.investmentCommitteeSnapshots.length),3);
    assert.equal(await page.evaluate(()=>JSON.stringify(state.investmentCommitteeSnapshots[1])),original);
    assert.equal(await page.evaluate(()=>JSON.stringify(state.investmentCommitteeSnapshots[0])),await page.evaluate(()=>icSeptember));
    await monthly.locator('details').filter({hasText:'이전 수정본 1개'}).locator('summary').click();await monthly.locator('[data-monthly=revision]').click();
    assert.match(await monthly.innerText(),/10월 핵심 요약/);assert.doesNotMatch(await monthly.innerText(),/10월 수정된 요약/);
    await monthly.getByRole('button',{name:'최신 수정본 보기'}).click();
    assert.match(await monthly.innerText(),/10월 수정된 요약/);
    assert.doesNotMatch(await monthly.innerText(),/\d{4}-\d{2}-\d{2}T/);
    assert.ok(await monthly.evaluate(el=>el.scrollWidth<=el.clientWidth+1));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await monthly.screenshot({path:path.join(evidence,`${width}-${finish}-monthly.png`)});
    const writesBeforeGuard=await page.evaluate(()=>icWrites.length);
    const guarded=await page.evaluate(()=>{try{HaniInvestmentResearchCore.confirmCommittee(state,HaniInvestmentResearchCore.committeeDraft(state,'2026-10'),()=>commit('should not run'),{uid});return false;}catch(e){return /이미 확정/.test(e.message);}});
    assert.equal(guarded,true);assert.equal(await page.evaluate(()=>icWrites.length),writesBeforeGuard);
    await page.evaluate(()=>showView('investment')); assert.equal(await page.locator('#investOverviewAll').innerHTML(),legacyOverview);
    assert.equal(await page.evaluate(()=>JSON.stringify([state.instruments,state.accounts,state.transactions,state.investmentBrokerSnapshots,state.investmentWatchlist,state.ledgerMonths])),await page.evaluate(()=>icLegacy));
    // Commit wrote the same existing protected key; re-entry reads real storage through loadState.
    await page.evaluate(()=>{const before=state.investmentResearchCards.map(c=>c.name);state=loadState();window.icReload=JSON.stringify(before)===JSON.stringify(state.investmentResearchCards.map(c=>c.name));}); assert.equal(await page.evaluate(()=>icReload),true);
    assert.equal(await page.evaluate(()=>state.investmentCommitteeSnapshots.length),3);
    assert.ok(await page.evaluate(()=>icWrites.includes(STORAGE_KEY))); assert.deepEqual(errors,[]);
    // Accumulation settings: default broker rule, explicit save, GPT exclusion, optional Research and frozen Monthly list.
    await page.evaluate(()=>showView('investmentCommittee'));
    await tabs.getByRole('tab',{name:'종목 리서치'}).click();
    await page.evaluate(({fixture})=>{
      state=freshState();
      state.accounts=[{id:'ic-k',name:'키움 ISA',type:'ISA',broker:'키움증권'},{id:'ic-t',name:'토스 위탁종합',type:'위탁종합',broker:'토스증권'},{id:'ic-h',name:'하나 위탁종합',type:'위탁종합',broker:'하나증권'}];
      const only={...fixture.cards[0],instrumentId:'ic-only',name:'키움전용 적립 ETF'};
      const mixed={...fixture.cards[1],instrumentId:'ic-mixed',name:'혼합 보유 종목'};
      const normal={...fixture.cards[2],instrumentId:'ic-normal',name:'하나 일반 종목'};
      state.instruments=[only,mixed,normal].map(c=>({id:c.instrumentId,name:c.name,ticker:c.ticker,market:c.market,currency:c.currency}));
      state.instruments.push({id:'ic-nocard',name:'키움전용 무카드 ETF',ticker:'999999',market:'KR',currency:'KRW'});
      state.investmentResearchCards=[only,mixed,normal].map((c,i)=>({...HaniInvestmentResearchCore.normalizeCard({...c,themes:['동일 테마']}),id:'ic-r'+i}));
      const holdings=(ids)=>ids.map((id,i)=>({instrumentId:id,name:state.instruments.find(x=>x.id===id).name,ticker:state.instruments.find(x=>x.id===id).ticker,market:'KR',quantity:2,evaluationAmount:100000,currency:'KRW'}));
      state.investmentBrokerSnapshots=[normalizeBrokerSnapshot({id:'ic-acc-snapshot',mode:'positions',recordType:'positions',status:'confirmed',period:'2026-10',snapshotDate:'2026-10-10',accounts:[
        {accountId:'ic-k',enabled:true,holdings:holdings(['ic-only','ic-mixed','ic-nocard'])},
        {accountId:'ic-t',enabled:true,holdings:holdings(['ic-mixed'])},
        {accountId:'ic-h',enabled:true,holdings:holdings(['ic-normal'])}
      ]})];
      window.icAccumulationReport=[only,mixed];
      window.icAccumulationLegacy=JSON.stringify([state.accounts,state.instruments,state.investmentResearchCards,state.investmentBrokerSnapshots]);
      HaniInvestmentCommittee.render();
    },{fixture});
    const settings=host.locator('.ic-accumulation-settings');
    assert.equal(await settings.getAttribute('open'),null);
    const accumulationBefore=await page.evaluate(()=>({state:JSON.stringify(state),writes:icWrites.length}));
    await settings.locator('summary').click();
    assert.equal(await settings.locator('[data-ic-account="ic-k"]').isChecked(),true);
    assert.equal(await settings.locator('[data-ic-account="ic-t"]').isChecked(),false);
    assert.equal(await settings.locator('[data-ic-account="ic-h"]').isChecked(),false);
    assert.equal(await page.evaluate(()=>Object.hasOwn(state.ui,'icAccumulationAccountIds')),false);
    await settings.locator('[data-ic-account="ic-t"]').check();
    await page.evaluate(()=>HaniInvestmentCommittee.render());
    assert.equal(await settings.locator('[data-ic-account="ic-t"]').isChecked(),true);
    await settings.locator('[data-ic-account="ic-t"]').uncheck();
    assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(state),writes:icWrites.length})),accumulationBefore);
    assert.match(await host.locator('.ic-card').first().innerText(),/적립식 계좌 종목 · 의견 선택 사항/);
    assert.match(await host.locator('.ic-card').nth(1).innerText(),/일부 적립식/);
    await host.getByRole('button',{name:'GPT용 자료 복사',exact:true}).click();
    const accumulationPrompt=await page.evaluate(()=>navigator.clipboard.readText());
    assert.doesNotMatch(accumulationPrompt,/키움전용 적립 ETF|키움전용 무카드 ETF/);
    assert.match(accumulationPrompt,/혼합 보유 종목|하나 일반 종목/);
    await host.getByRole('button',{name:'+ Research 작성',exact:true}).click();
    assert.doesNotMatch(await editor.locator('[data-ic-picker]').innerText(),/키움전용/);
    const optional=editor.locator('details').filter({hasText:'적립식 종목 (의견 없이 보유)'});
    assert.equal(await optional.getAttribute('open'),null);await optional.locator('summary').click();
    await optional.getByRole('button',{name:'그래도 작성',exact:true}).last().click();
    assert.equal(await editor.locator('[name=name]').inputValue(),'키움전용 무카드 ETF');
    await editor.getByRole('button',{name:'닫기',exact:true}).click();
    await host.getByRole('button',{name:'리포트 붙여넣기',exact:true}).click();
    await importer.locator('[data-ic-report]').fill(await page.evaluate(()=>JSON.stringify(icAccumulationReport)));
    await importer.getByRole('button',{name:'변경 검토',exact:true}).click();
    assert.match(await importer.locator('.ic-review-item').first().innerText(),/적립식 종목 · 반영 제외/);
    assert.equal(await importer.locator('[data-ic-include="0"]').isChecked(),false);
    assert.equal(await importer.locator('[data-ic-include="0"]').isDisabled(),true);
    assert.equal(await importer.locator('[data-ic-include="1"]').isChecked(),true);
    await importer.getByRole('button',{name:'닫기',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(state),writes:icWrites.length})),accumulationBefore);
    await settings.getByRole('button',{name:'계좌 설정 저장',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>state.ui.icAccumulationAccountIds),['ic-k']);
    assert.equal(await page.evaluate(()=>icWrites.length),accumulationBefore.writes+1);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem(STORAGE_KEY)).ui.icAccumulationAccountIds),['ic-k']);
    await settings.locator('[data-ic-account="ic-k"]').uncheck();await settings.getByRole('button',{name:'계좌 설정 저장',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>state.ui.icAccumulationAccountIds),[]);
    await host.getByRole('button',{name:'GPT용 자료 복사',exact:true}).click();
    assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/키움전용 적립 ETF/);
    await settings.locator('[data-ic-account="ic-k"]').check();await settings.getByRole('button',{name:'계좌 설정 저장',exact:true}).click();
    await tabs.getByRole('tab',{name:'월간 위원회'}).click();
    assert.match(await monthly.locator('.ic-accumulation').innerText(),/키움전용 적립 ETF/);
    await monthly.getByRole('button',{name:'이번 달 위원회 시작',exact:true}).click();
    assert.match(await monthly.locator('.ic-accumulation').innerText(),/장기 적립식 \(투자의견 없음\)/);
    assert.match(await monthly.locator('.ic-accumulation').innerText(),/키움 ISA/);
    assert.doesNotMatch(await monthly.locator('.ic-accumulation').innerText(),/Rating|Fair Value/);
    assert.equal(await monthly.locator('.ic-overlap').count(),0);
    assert.doesNotMatch(await monthly.locator('[name=executiveSummary]').inputValue(),/키움전용/);
    assert.match(await monthly.locator('.ic-monthly-research-summary').innerText(),/일부 적립식/);
    await monthly.locator('[name=marketView]').fill('작성 중 보존');
    await page.evaluate(()=>{state.investmentBrokerSnapshots[0].accounts[0].holdings[0].evaluationAmount=120000;HaniInvestmentCommittee.render();});
    assert.equal(await monthly.locator('[name=marketView]').inputValue(),'작성 중 보존');
    // Holdings changed after start: the canonical stale-draft guard must reject without saving.
    const beforeRejectedConfirm=await page.evaluate(()=>({snapshots:JSON.stringify(state.investmentCommitteeSnapshots),cards:JSON.stringify(state.investmentResearchCards),writes:icWrites.length}));
    await monthly.getByRole('button',{name:'이번 달 위원회 확정',exact:true}).click();
    assert.match(await monthly.locator('.ic-error').innerText(),/초안 작성 중 원본이 변경되었습니다/);
    assert.equal(await monthly.locator('form').count(),1);
    assert.equal(await monthly.locator('[name=marketView]').inputValue(),'작성 중 보존');
    assert.deepEqual(await page.evaluate(()=>({snapshots:JSON.stringify(state.investmentCommitteeSnapshots),cards:JSON.stringify(state.investmentResearchCards),writes:icWrites.length})),beforeRejectedConfirm);
    await monthly.getByRole('button',{name:'초안 취소',exact:true}).click();
    await monthly.getByRole('button',{name:'이번 달 위원회 시작',exact:true}).click();
    await monthly.locator('[name=marketView]').fill('작성 중 보존');
    await monthly.getByRole('button',{name:'이번 달 위원회 확정',exact:true}).click();
    assert.equal(await monthly.locator('form').count(),0);
    assert.match(await monthly.innerText(),/확정본 · 수정본 1/);
    assert.equal(await monthly.locator('[data-monthly=start]').isVisible(),false);
    assert.equal(await page.evaluate(()=>state.investmentCommitteeSnapshots.length),1);
    assert.equal(await page.evaluate(()=>icWrites.length),beforeRejectedConfirm.writes+1);
    const accumulationSnapshot=await page.evaluate(()=>HaniInvestmentResearchCore.latestSnapshot(state,'2026-10'));
    assert.ok(accumulationSnapshot,'Monthly confirm must create the October snapshot before reading its securities');
    assert.equal(accumulationSnapshot.marketView,'작성 중 보존');
    const accumulationSecurities=accumulationSnapshot.securitySnapshots.filter(c=>c.kind==='accumulation');
    assert.deepEqual(accumulationSecurities.map(c=>c.name).sort(),['키움전용 무카드 ETF','키움전용 적립 ETF'].sort());
    assert.deepEqual(accumulationSecurities.find(c=>c.instrumentId==='ic-only')?.currentValues,[{currency:'KRW',value:120000}]);
    assert.deepEqual(accumulationSnapshot.securitySnapshots.filter(c=>c.kind!=='accumulation').map(c=>c.id).sort(),['ic-r1','ic-r2']);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem(STORAGE_KEY)).investmentCommitteeSnapshots),[accumulationSnapshot]);
    const frozenAccumulation=await monthly.locator('.ic-accumulation').innerText();
    const frozenAccumulationSnapshot=await page.evaluate(()=>JSON.stringify(state.investmentCommitteeSnapshots));
    assert.equal(await page.evaluate(()=>state.investmentResearchCards.length),3);
    await monthly.screenshot({path:path.join(evidence,`${width}-${finish}-accumulation.png`)});
    await tabs.getByRole('tab',{name:'종목 리서치'}).click();
    await settings.locator('[data-ic-account="ic-k"]').uncheck();await settings.getByRole('button',{name:'계좌 설정 저장',exact:true}).click();
    await tabs.getByRole('tab',{name:'월간 위원회'}).click();
    assert.equal(await monthly.locator('.ic-accumulation').innerText(),frozenAccumulation);
    assert.equal(await page.evaluate(()=>JSON.stringify(state.investmentCommitteeSnapshots)),frozenAccumulationSnapshot);
    assert.equal(await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem(STORAGE_KEY)).investmentCommitteeSnapshots)),frozenAccumulationSnapshot);
    assert.equal(await page.evaluate(()=>JSON.stringify(state.investmentResearchCards)),beforeRejectedConfirm.cards);
    assert.equal(await page.evaluate(()=>state.investmentResearchCards.length),3);
    const accumulationDuplicates=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.filter((id,i)=>id.startsWith('ic')&&ids.indexOf(id)!==i);});
    assert.deepEqual(accumulationDuplicates,[]);assert.deepEqual(errors,[]);
    await context.close();
  }
  console.log('PASS Investment Research + Monthly IC + accumulation UI (Edge) 4 combinations: QA1/2/3/4/5/6/7, GPT continuation/cancel, KST, desktop header, monthly draft/no-write, freeze/revision/guard/overlap/history, 390px screenshots, legacy state/DOM, reload, app console errors 0. Synthetic only; real auth/Cloud/Android unverified.');
} finally {if(browser)await browser.close(); await new Promise(resolve=>server.close(resolve));}
