/* Synthetic fixtures only. No browser storage, network or production data. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const C = require('../hani-investment-committee.js');
const fixture = require('./fixtures/investment-research-mock.json');
const runtime = fs.readFileSync(require.resolve('../hani-investment-committee.js'), 'utf8');
const blank = () => ({investmentResearchCards: [], investmentResearchHistory: [], investmentCommitteeSnapshots: [], ui: {icAccumulationAccountIds: []}});
const oldCard = extra => ({...C.normalizeCard(fixture.cards[0]), id: 'old', lastReviewedAt: '2026-11-01', ...extra});
const sourceWith = card => ({...blank(), investmentResearchCards: [card]});
const fairKeys = ['fairValue', 'fairValueLow', 'fairValueHigh'];
const values = card => fairKeys.map(k => card[k]);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const reviewMarkup = items => {
  const slot = {innerHTML: ''}, ctx = vm.createContext({importReview: items, importDialog: {querySelector: () => slot}, missingFairItems: C.missingFairItems, esc, labels: {}, valueText: JSON.stringify});
  vm.runInContext(runtime.slice(runtime.indexOf('  function renderReview('), runtime.indexOf('  const monthlyHost')) + '\nrenderReview();', ctx);
  return slot.innerHTML;
};

test('without-card holdings split by identity; accumulation and existing cards stay excluded and input stays untouched', () => {
  const s = blank();
  s.accounts = [{id: 'acc', broker: '키움'}]; s.ui.icAccumulationAccountIds = ['acc'];
  s.investmentResearchCards = [oldCard({name: '기존 종목', ticker: 'EXIST', market: 'US'})];
  const rows = [
    {instrumentId: null, name: '삼성증권', ticker: '016360', market: '', currency: '', quantity: 1},
    {name: '삼성전자', ticker: '', quantity: 1}, {name: 'LG전자', ticker: '', quantity: 1},
    {name: '마스터 식별', instrumentId: 'instrument-only', quantity: 1},
    {name: '기존 종목', ticker: 'EXIST', market: 'US', quantity: 1},
    {name: '적립식', ticker: 'ACC', market: 'US', accountId: 'acc', quantity: 1}
  ];
  const before = JSON.stringify([s, rows]), split = C.unresolvedHoldings(s, rows);
  assert.deepEqual(split.ready.map(c => c.name), ['삼성증권', '마스터 식별']);
  assert.deepEqual(split.unresolved.map(c => c.name), ['삼성전자', 'LG전자']);
  const prompt = C.buildPrompt(s, rows), data = JSON.parse(prompt.split('자료(JSON):\n')[1].split('\nConviction framework')[0]);
  assert.deepEqual(data.holdingsWithoutCards, split.ready);
  assert.match(prompt, /모든 종목도 cards와 같은 형식의 새 카드로 작성해 출력 배열에 함께 넣으세요/);
  assert.match(prompt, /합친 3개와 정확히 같아야/);
  assert.equal(data.holdingsWithoutCards[0].instrumentId, null);
  assert.equal(data.holdingsWithoutCards[0].ticker, '016360');
  assert.equal(JSON.stringify([s, rows]), before);
});

test('instruction bytes match the frozen baseline when no ready holdings exist', () => {
  const rows = [{name: '코드 없음', quantity: 1}];
  const prefix = C.buildPrompt(blank(), rows).split('자료(JSON):')[0];
  assert.equal(createHash('sha256').update(prefix).digest('hex'), '8a304ae1d2b4005a8b0599b2de95662aee35191db1789f39fd66c53258c4ac34');
  assert.equal(C.buildPrompt(blank(), rows), C.buildPrompt(blank()));
});

test('returned Samsung Securities card matches a holding with empty market and becomes OWNED', () => {
  const rows = [{instrumentId: null, name: '삼성증권', ticker: '016360', market: '', currency: '', quantity: 2}];
  const card = {...fixture.cards[0], instrumentId: null, name: '삼성증권', ticker: '016360', market: 'KR', currency: 'KRW', status: 'WATCH'};
  assert.equal(C.reviewReport([card], blank(), rows)[0].card.status, 'OWNED');
});

test('all-empty incoming values preserve the existing triplet and render a notice without persisting its flag', () => {
  for (const empty of [null, undefined, '']) {
    const old = oldCard(), s = sourceWith(old), before = JSON.stringify(s);
    const input = {...old, fairValue: empty, fairValueLow: empty, fairValueHigh: empty};
    const item = C.reviewReport([input], s)[0];
    assert.deepEqual(values(item.card), values(old));
    assert.equal(item.preservedFairValue, true); assert.equal(item.missingFairValue, false);
    assert.match(reviewMarkup([item]), /GPT가 적정가를 주지 않아 기존 적정가를 유지해요/);
    assert.equal(Object.hasOwn(item.card, 'preservedFairValue'), false);
    const prepared = C.prepareBatch(s, [item], {uid: () => 'fixture-id'});
    assert.equal(prepared.history.length, 0); assert.equal(Object.hasOwn(prepared.cards[0], 'preservedFairValue'), false);
    assert.equal(JSON.stringify(s), before);
  }
  const old = oldCard({fairValue: null, fairValueLow: 80000, fairValueHigh: null});
  const item = C.reviewReport([{...old, fairValueLow: null}], sourceWith(old))[0];
  assert.deepEqual(values(item.card), values(old)); assert.equal(item.missingFairValue, false);
});

test('any supplied fair value keeps prior import behavior; a truly missing value still warns; manual clearing stays available', () => {
  const old = oldCard(), s = sourceWith(old);
  for (const key of fairKeys) {
    const input = {...old, fairValue: null, fairValueLow: null, fairValueHigh: null, [key]: 90000};
    const item = C.reviewReport([input], s)[0];
    assert.equal(item.preservedFairValue, false);
    assert.deepEqual(values(item.card), fairKeys.map(k => k === key ? 90000 : null));
  }
  const empty = {...old, fairValue: null, fairValueLow: null, fairValueHigh: null};
  const item = C.reviewReport([empty], sourceWith(empty))[0];
  assert.equal(item.missingFairValue, true); assert.equal(item.preservedFairValue, false);
  assert.match(reviewMarkup([item]), /적정가 누락 1종목/);
  assert.deepEqual(values(C.normalizeCard(empty, old)), [null, null, null]);
});

test('actual followup parse branch preserves unchanged stored fair values, selection and zero History', () => {
  const old = oldCard(), state = sourceWith(old), initial = C.reviewReport([{...old}], state);
  initial[0].include = false;
  const response = [{name: old.name, ticker: old.ticker, market: old.market, fairValue: null, fairValueLow: '', fairValueHigh: null}];
  const ctx = vm.createContext({...C, state, importReview: initial, framework: C.FRAMEWORK, holdings: () => [], fingerprint: () => 'fixture', renderReview: () => {},
    importDialog: {querySelector: selector => selector === '[data-ic-report]' ? {value: JSON.stringify(response)} : {textContent: ''}, querySelectorAll: () => [{dataset: {icInclude: '0'}, checked: false}]}});
  const start = runtime.indexOf("        case 'parse':"), end = runtime.indexOf("        case 'apply':", start);
  vm.runInContext("switch ('parse') {\n" + runtime.slice(start, end) + '\n}', ctx);
  const updated = ctx.importReview[0];
  assert.equal(updated.include, false); assert.equal(updated.preservedFairValue, true);
  assert.deepEqual(values(updated.card), values(old)); assert.equal(updated.missingFairValue, false);
  let commits = 0;
  C.applyBatch(state, [updated], () => {commits++; return true;}, {uid: () => 'fixture-id'});
  assert.equal(commits, 1); assert.equal(state.investmentResearchHistory.length, 0);
  assert.deepEqual(values(state.investmentResearchCards[0]), values(old));
});

test('followup fills missing prices on a new pending report through the same review owner', () => {
  const state = blank(), raw = {...fixture.cards[0], fairValue: null, fairValueLow: null, fairValueHigh: null};
  const pending = C.reviewReport([raw], state)[0];
  assert.equal(pending.missingFairValue, true);
  const input = {name: raw.name, ticker: raw.ticker, fairValue: 90000, fairValueLow: 80000, fairValueHigh: 100000};
  const reviewed = C.reviewReport([{...pending.card, ...C.importFairValues(input, pending.card.currency)}], state)[0];
  assert.equal(reviewed.missingFairValue, false); assert.deepEqual(values(reviewed.card), [90000, 80000, 100000]);
  assert.deepEqual(reviewed.card.thesis, pending.card.thesis);
});

test('reportNextStep covers all seven ordered branches, login, month markers and partial memo saves', () => {
  const a = oldCard(), b = oldCard({id: 'other'}), memo = '[2026-11 · 세린 연구원 2차 의견 · Gemini]';
  const base = {progress: {researchDone: true, committeeDone: false, month: '2026-11'}, cards: [a, b]};
  assert.equal(C.reportNextStep({...base, progress: {...base.progress, researchDone: false}, ready: [{name: '삼성증권'}]}).step, 1);
  const ready = C.reportNextStep({...base, ready: [{name: '삼성증권'}]});
  assert.equal(ready.step, 2); assert.equal(ready.title, '아직 종목 카드가 없는 보유종목이 1개 있어요 (삼성증권).');
  assert.equal(ready.action, 'copy'); assert.equal(ready.secondary, 'import');
  assert.equal(C.reportNextStep(base).action, 'copy-second');
  assert.equal(C.reportNextStep({...base, loggedIn: true}).action, 'ask-second');
  assert.equal(C.reportNextStep({...base, cards: [{...a, valuationNote: '[2026-10 · 세린 연구원 2차 의견'}]}).step, 3);
  const opinions = [{researchId: a.id}, {researchId: b.id}];
  const final = {...base, secondOpinions: opinions, finalOpinions: [{researchId: a.id}]};
  assert.equal(C.reportNextStep({...base, secondOpinions: opinions}).step, 4);
  assert.equal(C.reportNextStep({...base, secondOpinions: opinions}).secondary, 'import-final');
  const remaining = C.reportNextStep({...final, cards: [{...a, valuationNote: memo}, b]});
  assert.equal(remaining.step, 5); assert.match(remaining.detail, /1종목/); assert.equal(remaining.action, undefined);
  const saved = {...base, cards: [{...a, valuationNote: memo}, {...b, valuationNote: memo}]};
  assert.equal(C.reportNextStep(saved).step, 6); assert.equal(C.reportNextStep(saved).action, 'monthly');
  assert.equal(C.reportNextStep({...saved, progress: {...base.progress, committeeDone: true}}), null);
  assert.equal(C.reportNextStep({...base, progress: {...base.progress, committeeDone: true}}), null);
  assert.equal(C.reportNextStep({...saved, secondOpinions: opinions}).step, 6);
  const before = JSON.stringify(final); C.reportNextStep(final); assert.equal(JSON.stringify(final), before);
});

test('persistent notice escapes names, next-step reuses delegated actions, hides legacy continue and performs no writes', () => {
  const slots = Object.fromEntries(['.ic-next-step', '.ic-unresolved', '.ic-continue', '[data-ic-status]'].map(s => [s, {hidden: false, innerHTML: '', value: 'ACTIVE'}]));
  const s = sourceWith(oldCard()), rows = [{name: '<img src=x onerror=boom>', quantity: 1}];
  const before = JSON.stringify([s, rows]);
  const ctx = vm.createContext({...C, state: s, host: {querySelector: s => slots[s]}, holdings: () => rows, secondOpinions: new Map(), finalOpinions: new Map(),
    resetSecondOpinionSession: () => {}, updateSecondButton: () => {}, finalTools: {}, currentOpinionCards: () => [], renderSettings: () => {}, renderProgress: () => {}, secondRunning: false, accountIdentity: () => null, esc});
  const start = runtime.indexOf('  function render() {'), end = runtime.indexOf('    renderCardSummary(cards);', start);
  vm.runInContext(runtime.slice(start, end) + '\n}\nrender();', ctx);
  assert.match(slots['.ic-unresolved'].innerHTML, /&lt;img/); assert.doesNotMatch(slots['.ic-unresolved'].innerHTML, /<img/);
  assert.equal(slots['.ic-unresolved'].hidden, false); assert.equal(slots['.ic-continue'].hidden, true);
  assert.match(slots['.ic-next-step'].innerHTML, /data-ic="copy/);
  rows.length = 0; vm.runInContext('render();', ctx);
  assert.equal(slots['.ic-unresolved'].hidden, true); assert.equal(slots['.ic-unresolved'].innerHTML, '');
  assert.equal(JSON.stringify([s, [{name: '<img src=x onerror=boom>', quantity: 1}]]), before);
});

test('existing Gemini button updater synchronizes header and guidance buttons during requests and logout', () => {
  const button = () => ({setAttribute(key, value) {this[key] = value;}}), header = button(), next = button();
  const ctx = vm.createContext({host: {querySelector: selector => selector === '.ic-next-step' ? {querySelector: () => next} : header},
    accountIdentity: () => 'owner', cloudClient: {}, secondRunning: false});
  const start = runtime.indexOf('  function updateSecondButton()'), end = runtime.indexOf('  function secondOpinionError(', start);
  vm.runInContext(runtime.slice(start, end) + '\nupdateSecondButton();', ctx);
  for (const b of [header, next]) assert.equal(b.disabled, false);
  ctx.secondRunning = true; vm.runInContext('updateSecondButton();', ctx);
  for (const b of [header, next]) {assert.equal(b.disabled, true); assert.equal(b['aria-busy'], 'true');}
  ctx.secondRunning = false; ctx.accountIdentity = () => null; vm.runInContext('updateSecondButton();', ctx);
  for (const b of [header, next]) {assert.equal(b.disabled, true); assert.match(b.title, /로그인/);}
});
