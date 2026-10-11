const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const test = require('node:test');
const C = require('../hani-investment-committee.js');
const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'hani-main.js'), 'utf8');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/investment-research-mock.json'), 'utf8'));
const baseCard = () => C.normalizeCard(fixture.cards[0]);
const blank = () => ({investmentResearchCards: [], investmentResearchHistory: [], investmentCommitteeSnapshots: [], instruments: [], investmentWatchlist: [], accounts: [], transactions: []});
const options = () => {let serial = 0; return {uid: () => 'test-uuid-' + ++serial, now: '2026-10-11T00:00:00Z'};};
const fn = (name, source = main) => {
  const start = source.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name);
  const end = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, end < 0 ? source.length : end).trim();
};
function stateHarness(source = main) {
  const context = vm.createContext({structuredClone, Date, VERSION: '2.9.15-safe-baseline-bootstrap', seedAccounts: [], monthKeyNow: () => '2026-10', today: () => '2026-10-11', n: v => Number(v) || 0, uid: () => 'test-id', cloudSame: (a, b) => JSON.stringify(a) === JSON.stringify(b)});
  // Execute the actual load default and validator functions; owner functions unrelated to fixture are stubbed.
  const fresh = source.slice(source.indexOf('const freshState='), source.indexOf('let lastLoadError='));
  const normalize = fn('normalizeState', source);
  for (const symbol of [...new Set(normalize.match(/\b(?:normalize[A-Z]\w*|legacyExercise)\b/g) || [])].filter(s => s !== 'normalizeState')) context[symbol] = v => v;
  vm.runInContext(fresh + '\n' + fn('validateStoredRecords', source) + '\n' + normalize + '\n' + fn('cloudHasMeaningfulLocalData', source) + '\nthis.api={freshState,normalizeState,validateStoredRecords,cloudHasMeaningfulLocalData};', context);
  return context.api;
}
test('old state loads without migration; exactly 3 new defaults; arrays preserved verbatim', () => {
  const api = stateHarness();
  const old = {instruments: [{id: 'i', name: '원본'}], accounts: [], investmentWatchlist: [], extra: {original: true}};
  const normalized = api.normalizeState(old);
  const keys = ['investmentResearchCards', 'investmentResearchHistory', 'investmentCommitteeSnapshots'];
  for (const key of keys) assert.deepEqual(Array.from(normalized[key]), []);
  assert.equal(normalized.extra, old.extra); assert.equal(normalized.instruments, old.instruments);
  const records = {...old, investmentResearchCards: [{id: 'r', unknown: {original: 1}}], investmentResearchHistory: [{id: 'h', changes: {rating: {from: 'BUY', to: 'HOLD'}}}], investmentCommitteeSnapshots: [{id: 's', reviewMonth: '2025-01', frozen: {price: 10}}]};
  api.validateStoredRecords(records);
  for (const key of keys) assert.equal(api.normalizeState(records)[key], records[key]);
  const original = JSON.stringify(records); api.normalizeState(records); assert.equal(JSON.stringify(records), original);
  for (const key of keys) {
    assert.throws(() => api.validateStoredRecords({[key]: {bad: true}}));
    assert.throws(() => api.validateStoredRecords({[key]: [null]}));
    const empty = api.freshState(); assert.equal(api.cloudHasMeaningfulLocalData(empty), false);
    empty[key].push({id: 'only-record'}); assert.equal(api.cloudHasMeaningfulLocalData(empty), true);
  }
});
test('conviction defaults, automatic total and configurable six-dimensional framework', () => {
  assert.equal(C.convictionTotal(C.conviction()), 0);
  const framework = {id: 'custom-v1', dimensions: C.FRAMEWORK.dimensions.map((d, i) => ({...d, max: i ? 15 : 25}))};
  const c = C.conviction({}, framework); c.dimensions.forEach(d => {d.score = d.max;});
  assert.equal(C.convictionTotal(c), 100); assert.equal(c.frameworkId, 'custom-v1');
  assert.throws(() => C.conviction({dimensions: [{key: 'only', max: 100, score: 1}]}));
  assert.throws(() => C.conviction({...c, dimensions: c.dimensions.map(d => ({...d, score: d.max + 1}))}));
  assert.throws(() => C.conviction({}, {...framework, dimensions: framework.dimensions.map(d => ({...d, max: 10}))}));
});
test('history is append-only; no-op/text/price/date saves create no judgment history', () => {
  const state = blank(), opts = options(); let saves = 0;
  C.applyBatch(state, [{card: baseCard(), reason: '최초 검토'}], () => {saves++; return true;}, opts);
  const card = state.investmentResearchCards[0], first = JSON.stringify(state.investmentResearchHistory);
  assert.equal(state.investmentResearchHistory.length, 1);
  C.applyBatch(state, [{existingId: card.id, card: {...card, executiveComment: '텍스트 갱신', lastReviewedAt: '2026-10-12', manualPrice: {value: 56000, currency: 'KRW', asOf: '2026-10-12'}}}], () => {saves++; return true;}, opts);
  assert.equal(JSON.stringify(state.investmentResearchHistory), first);
  const latest = state.investmentResearchCards[0];
  C.applyBatch(state, [{existingId: latest.id, card: latest}], () => {saves++; return true;}, opts);
  assert.equal(JSON.stringify(state.investmentResearchHistory), first); assert.equal(saves, 3);
  const c = state.investmentResearchCards[0];
  C.applyBatch(state, [{existingId: c.id, card: {...c, rating: 'REDUCE', fairValue: 60000}, reason: '이익 전망 하향'}], () => true, opts);
  assert.equal(state.investmentResearchHistory.length, 2);
  assert.equal(JSON.stringify(state.investmentResearchHistory.slice(0, 1)), first);
  assert.deepEqual(state.investmentResearchHistory[1].changes.rating, {from: 'BUY', to: 'REDUCE'});
  assert.deepEqual(state.investmentResearchHistory[1].changes.fairValue, {from: 65000, to: 60000});
  assert.equal(state.investmentResearchHistory[1].fairValueChangeReason, '이익 전망 하향');
  assert.equal(C.previousRating(state.investmentResearchCards[0], state.investmentResearchHistory), 'BUY');
  assert.deepEqual(state.investmentCommitteeSnapshots, []);
});
test('all tracked fields diff correctly; dimension redistribution alone is not total change', () => {
  const a = baseCard(), b = {...a, rating: 'EXIT', fairValueLow: 45000, fairValue: 60000, fairValueHigh: 75000, thesisStrength: 'WEAK', riskLevel: 'HIGH', action: 'EXIT', conviction: C.conviction()};
  b.conviction.dimensions[0].score = 10;
  assert.deepEqual(Object.keys(C.diff(a, b).tracked).sort(), [...C.TRACKED].sort());
  const c = {...b, conviction: structuredClone(b.conviction)}; c.conviction.dimensions[0].score = 5; c.conviction.dimensions[1].score = 5;
  assert.deepEqual(C.diff(b, c).tracked, {}); assert.ok(C.diff(b, c).fields.conviction);
});
test('failed commits restore original arrays and preserve unrelated state', () => {
  for (const persist of [() => false, () => {throw Error('quota');}]) {
    const state = blank(); state.instruments = [{id: 'original'}]; state.investmentCommitteeSnapshots = [{reviewMonth: '2025-01'}];
    const before = JSON.stringify(state), cards = state.investmentResearchCards, history = state.investmentResearchHistory;
    assert.throws(() => C.applyBatch(state, [{card: baseCard()}], persist, options()));
    assert.equal(JSON.stringify(state), before); assert.equal(state.investmentResearchCards, cards); assert.equal(state.investmentResearchHistory, history);
  }
});
test('parser accepts array/object, fences, surrounding prose and brackets in strings', () => {
  const rows = [{...fixture.cards[0], executiveComment: '문자열 [안쪽] {중괄호} "따옴표"'}], json = JSON.stringify(rows);
  for (const input of [json, JSON.stringify({cards: rows}), '설명\n```json\n' + json + '\n```\n감사합니다', '검토 결과입니다:\n' + json + '\n끝', '참고 [설명] 뒤에\n' + json]) assert.deepEqual(C.parseReport(input), rows);
  for (const bad of ['hello', '[]', '{"cards":[null]}', '{"cards":[[1]]}', '[{broken}]']) assert.throws(() => C.parseReport(bad));
});
test('matching prefers instrumentId, normalized market+ticker, then unique non-conflicting name', () => {
  const card = {...baseCard(), id: 'existing'};
  assert.equal(C.match({instrumentId: card.instrumentId}, [card]), card);
  assert.equal(C.match({market: 'KOSPI', ticker: 'A005935'}, [card]), card);
  assert.equal(C.match({name: '삼성 전자 우'}, [card]), card);
  assert.equal(C.match({name: card.name, market: 'US', ticker: 'OTHER'}, [card]), null);
  assert.throws(() => C.match({name: card.name}, [card, {...card, id: 'duplicate'}]));
});
test('review leaves state untouched; unmatched WATCH / holding OWNED; selection applies once', () => {
  const state = blank(), opts = options();
  C.applyBatch(state, [{card: baseCard()}], () => true, opts);
  state.instruments.push({id: 'lg', name: 'LG전자우', ticker: '066575', market: 'KR'});
  const holding = {instrumentId: 'lg', name: 'LG전자우', ticker: '066575', market: 'KR', quantity: 2};
  const before = JSON.stringify(state);
  const review = C.reviewReport([{...fixture.cards[0], rating: 'HOLD', changeReason: '기존 판단 변경'}, {...fixture.cards[1], status: 'WATCH'}, fixture.cards[3]], state, [holding]);
  assert.equal(JSON.stringify(state), before); assert.equal(review[0].existingId, state.investmentResearchCards[0].id);
  assert.deepEqual(review[0].tracked.rating, {from: 'BUY', to: 'HOLD'}); assert.equal(review[1].card.status, 'OWNED'); assert.equal(review[2].card.status, 'WATCH');
  let calls = 0; C.applyBatch(state, [review[0], review[2]], () => {calls++; return true;}, opts);
  assert.equal(calls, 1); assert.equal(state.investmentResearchCards.length, 2); assert.ok(!state.investmentResearchCards.some(c => c.name === 'LG전자우'));
  assert.equal(state.investmentResearchHistory.length, 3); assert.equal(state.investmentResearchHistory[1].reason, '기존 판단 변경');
  assert.deepEqual(state.instruments, [{id: 'lg', name: 'LG전자우', ticker: '066575', market: 'KR'}]);
  assert.throws(() => C.reviewReport([fixture.cards[0], fixture.cards[0]], state));
  assert.throws(() => C.reviewReport([{...fixture.cards[3], rating: 'AI BUY'}], state));
});
test('invalid second import item cannot partially change first item; duplicate create refused', () => {
  const state = blank(), before = JSON.stringify(state);
  assert.throws(() => C.applyBatch(state, [{card: baseCard()}, {card: {...fixture.cards[3], thesis: []}}], () => true, options()));
  assert.equal(JSON.stringify(state), before);
  C.applyBatch(state, [{card: baseCard()}], () => true, options());
  assert.throws(() => C.applyBatch(state, [{card: baseCard()}], () => true, options()));
});
test('price is read-only, quote.timestamp preserved; market/currency mismatch and missing cache fallback', () => {
  const c = baseCard(), source = {stocks: [{symbol: c.ticker, market: 'KOSPI', currency: 'KRW'}], quotes: [{symbol: c.ticker, currency: 'KRW', lastPrice: 50000, timestamp: '2026-10-09T02:00:00Z', collectedAt: '2026-10-10T00:00:00Z'}]};
  const original = JSON.stringify([c, source]), price = C.currentPrice(c, source);
  assert.equal(price.asOf, '2026-10-09T02:00:00Z'); assert.equal(price.value, 50000);
  assert.ok(Math.abs(C.valuation(c, price).upside - 30) < 0.000001); assert.equal(C.valuation(c, price).downside, 0);
  assert.equal(JSON.stringify([c, source]), original);
  assert.equal(C.currentPrice({...c, market: 'US'}, source).source, '수동 입력');
  assert.equal(C.valuation(c, {...price, currency: 'USD'}).upside, null);
  assert.equal(C.currentPrice({...c, manualPrice: null}, {}), null);
});
test('Korean GPT prompt includes exact schema, latest judgments; archived excluded; holdings not seeded', () => {
  const state = blank(); state.investmentResearchCards = fixture.cards.slice(0, 2).map(c => C.normalizeCard(c)); state.investmentResearchCards[1].status = 'ARCHIVED';
  const before = JSON.stringify(state), prompt = C.buildPrompt(state, [{instrumentId: 'lg', name: 'LG전자우', ticker: '066575', market: 'KR', quantity: 1}, {name: 'Visa', ticker: 'V', market: 'US', quantity: 2}]);
  assert.match(prompt, /주가가 올랐다는 이유만으로/); assert.match(prompt, /OUTPUT/); assert.ok(prompt.includes(JSON.stringify(C.OUTPUT_SCHEMA)));
  const data = JSON.parse(prompt.split('자료(JSON):\n')[1].split('\nConviction framework')[0]);
  assert.equal(data.cards.length, 1); assert.equal(data.holdingsWithoutCards.length, 1); assert.equal(data.holdingsWithoutCards[0].name, 'Visa');
  assert.equal(JSON.stringify(state), before);
});
test('new runtime has no direct storage/Cloud writes, destructive calls, seed, or duplicate id literals', () => {
  const source = fs.readFileSync(path.join(root, 'hani-investment-committee.js'), 'utf8');
  assert.doesNotMatch(source, /localStorage|\.clear\s*\(|\.\s*(?:insert|upsert|delete)\s*\(|fixtures\//);
  assert.doesNotMatch(source, /id=["'][^$]|\.id\s*=\s*["']/);
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.indexOf('hani-investment-committee.js') > html.indexOf('hani-asset-market-view.js'));
  assert.equal((html.match(/hani-investment-committee\.js/g) || []).length, 1);
});
test('actual commit/save owner persists cards/history with read-back; existing failure guard rolls back', () => {
  const stored = new Map(), writes = [], source = blank(); source.meta = {lastSavedAt: ''}; source.ledgerMonths = [{month: '2026-10', original: true}];
  const context = vm.createContext({state:source, VERSION:'2.9.15-safe-baseline-bootstrap', STORAGE_KEY:'existing-protected-key',
    loadRecovery:{active:false}, lastLoadError:'protected', cloudApplyingRemote:false, cloudQueues:0, rendered:0,
    freshState:()=>({meta:{lastSavedAt:''}}), serializedBytes:s=>Buffer.byteLength(s), updateStorageStatus(){}, isQuotaError:()=>true,
    cloudQueueSync(){context.cloudQueues++;}, renderAll(){context.rendered++;}, toast(){}, alert(){}, console:{error(){}},
    localStorage:{getItem:k=>stored.get(k)??null,setItem(k,v){if(context.failWrite)throw Error('QuotaExceededError');writes.push(k);stored.set(k,v);}}, Date});
  const save = main.slice(main.indexOf('function save('), main.indexOf('// Goal Registry:'));
  const commit = main.slice(main.indexOf('function commit('), main.indexOf('// =========================================================', main.indexOf('function commit(')));
  vm.runInContext(fn('writeProtectedState') + '\n' + save + '\n' + commit, context);
  C.applyBatch(source, [{card:baseCard()}], ()=>context.commit('test'), options());
  assert.deepEqual(writes,['existing-protected-key']); assert.equal(context.cloudQueues,1); assert.equal(context.rendered,1);
  const persisted = JSON.parse(stored.get('existing-protected-key'));
  assert.equal(persisted.investmentResearchCards.length,1); assert.equal(persisted.investmentResearchHistory.length,1); assert.deepEqual(persisted.ledgerMonths,source.ledgerMonths);
  assert.deepEqual(C.diff(persisted.investmentResearchCards[0], source.investmentResearchCards[0]).tracked,{});
  const before = JSON.stringify(source), originalStorage = stored.get('existing-protected-key'); context.failWrite=true;
  assert.throws(()=>C.applyBatch(source,[{existingId:source.investmentResearchCards[0].id,card:{...source.investmentResearchCards[0],rating:'EXIT'}}],()=>context.commit('test'),options()));
  assert.equal(JSON.stringify(source),before); assert.equal(stored.get('existing-protected-key'),originalStorage); assert.equal(context.cloudQueues,1);
  context.failWrite=false;context.loadRecovery.active=true;
  assert.throws(()=>C.applyBatch(source,[{existingId:source.investmentResearchCards[0].id,card:{...source.investmentResearchCards[0],rating:'EXIT'}}],()=>context.commit('test'),options()));
  assert.equal(JSON.stringify(source),before);assert.deepEqual(writes,['existing-protected-key']);
  // Account setting uses the same real owner; absent defaults are never persisted on read.
  context.failWrite=false;context.loadRecovery.active=false;
  source.ui={preserved:'keep'};source.accounts=[{id:'kiwoom',broker:'키움증권'}];
  const settingWrites=writes.length;
  assert.deepEqual(C.accumulationAccountIds(source),['kiwoom']);assert.equal(writes.length,settingWrites);
  C.saveAccumulationAccounts(source,['kiwoom'],()=>context.commit('setting'));
  assert.equal(writes.length,settingWrites+1);
  assert.deepEqual(JSON.parse(stored.get('existing-protected-key')).ui,{preserved:'keep',icAccumulationAccountIds:['kiwoom']});
  const oldSetting=source.ui.icAccumulationAccountIds,settingStored=stored.get('existing-protected-key');
  for(const mode of ['quota','protection']){
    context.failWrite=mode==='quota';context.loadRecovery.active=mode==='protection';
    assert.throws(()=>C.saveAccumulationAccounts(source,[],()=>context.commit('setting failed')));
    assert.equal(source.ui.icAccumulationAccountIds,oldSetting);assert.equal(stored.get('existing-protected-key'),settingStored);
    assert.equal(writes.length,settingWrites+1);
  }
  context.failWrite=false;context.loadRecovery.active=false;
  // Monthly confirm uses the same real owner; quota/original-protection failure restores snapshots.
  context.loadRecovery.active=false;
  const draft=C.committeeDraft(source,'2026-10');
  C.confirmCommittee(source,draft,()=>context.commit('monthly'),options());
  assert.equal(writes.length,3); assert.equal(context.cloudQueues,3);
  assert.equal(JSON.parse(stored.get('existing-protected-key')).investmentCommitteeSnapshots.length,1);
  const frozen=JSON.stringify(source.investmentCommitteeSnapshots), saved=stored.get('existing-protected-key');
  for(const mode of ['quota','protection']){
    context.failWrite=mode==='quota';context.loadRecovery.active=mode==='protection';
    assert.throws(()=>C.confirmCommittee(source,draft,()=>context.commit('monthly'),{...options(),revision:true}));
    assert.equal(JSON.stringify(source.investmentCommitteeSnapshots),frozen);
    assert.equal(stored.get('existing-protected-key'),saved);assert.equal(context.cloudQueues,3);
  }
});
test('Portfolio activation stays independent of Committee slots', () => {
  const helper=fn('activateInvestmentTab');
  assert.doesNotMatch(helper,/selectInvestmentSection|icPortfolio|commit|save/);
  let clicks=0;
  const context=vm.createContext({document:{querySelector:()=>({querySelector:()=>({click(){clicks++;}})})}});
  vm.runInContext(helper,context);
  for(const id of ['investOverview','investMonthly','investManage','investJournal'])context.activateInvestmentTab(id);
  assert.equal(clicks,4);
  assert.doesNotMatch(main,/setupInvestmentCommitteeLayout|icPortfolio|selectInvestmentSection/);
});

test('existing state normalization preserves explicit ui account selection without seeding default', () => {
  const api=stateHarness(),legacy=api.freshState();
  assert.equal(Object.hasOwn(legacy.ui,'icAccumulationAccountIds'),false);
  const normalized=api.normalizeState(JSON.parse(JSON.stringify(legacy)));
  assert.equal(Object.hasOwn(normalized.ui,'icAccumulationAccountIds'),false);
  for(const selection of [[],['kiwoom','toss']]){
    const saved=JSON.parse(JSON.stringify(legacy));saved.ui.icAccumulationAccountIds=selection;
    const loaded=api.normalizeState(saved);
    assert.deepEqual(Array.from(loaded.ui.icAccumulationAccountIds),selection);
    assert.deepEqual(Object.keys(loaded).sort(),Object.keys(normalized).sort());
  }
});
