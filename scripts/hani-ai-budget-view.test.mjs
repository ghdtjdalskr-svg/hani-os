import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const read = name => fs.readFile(new URL('../' + name, import.meta.url), 'utf8');
const core = createRequire(import.meta.url)('../hani-ai-budget-core.js');
const [html, mainJs, budgetJs, budgetCss] = await Promise.all([
  read('index.html'),
  read('hani-main.js'),
  read('hani-ai-budget.js'),
  read('hani-ai-budget.css')
]);

// Static syntax and write-surface checks.
new vm.Script(mainJs, {filename: 'hani-main.js'});
new vm.Script(budgetJs, {filename: 'hani-ai-budget.js'});
const setItemMatches = [...budgetJs.matchAll(/localStorage\.setItem\s*\(/g)];
assert.equal(setItemMatches.length, 1, 'hani-ai-budget.js keeps only the single canonical localStorage.setItem inside save()');
assert.equal(/localStorage\.(?:removeItem|clear)\s*\(/.test(budgetJs), false, 'no removeItem/clear in budget UI');
assert.equal(/hani_ai_budget_summary_v1/.test(mainJs), false, 'hani-main.js does not read/write budget storage directly');
assert.match(html, /id="homeAiFuelCard"[^>]*data-go="aiBudget"/, 'dashboard AI 연료 card navigates to aiBudget');
assert.match(html, /<details[^>]*class="[^"]*budget-info-details[^"]*"[^>]*>[\s\S]*ⓘ/, 'long explanation in #aiBudget is folded under ⓘ');

// Runtime UI + Dashboard read-only tests.
const baseNow = Date.now();
let mockNow = baseNow;
class MockDate extends Date {
  constructor(...args) { super(...(args.length ? args : [mockNow])); }
  static now() { return mockNow; }
}

const nodes = new Map();
const storage = new Map([['hani_os_life_v23', 'LIFE_FIXTURE_UNCHANGED']]);
const writes = [];
const removes = [];
let clears = 0;

function node(id) {
  if (!nodes.has(id)) {
    nodes.set(id, {
      innerHTML: '',
      textContent: '',
      value: '',
      hidden: false,
      disabled: false,
      classList: {contains: () => true},
      handlers: {},
      addEventListener(type, fn) { this.handlers[type] = fn; },
      focus() {}
    });
  }
  return nodes.get(id);
}

let fetchImpl = async () => ({ok: true, text: async () => JSON.stringify(payload)});
let payload = {schemaVersion: 1, accounts: [], collectorStatus: 'ready'};

const ui = vm.createContext({
  window: {HaniAiBudgetCore: core},
  document: {getElementById: node, addEventListener() {}},
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem(key, value) { writes.push(key); storage.set(key, value); },
    removeItem(key) { removes.push(key); storage.delete(key); },
    clear() { clears++; storage.clear(); }
  },
  setInterval() {},
  setTimeout,
  clearTimeout,
  AbortController,
  Intl,
  Date: MockDate,
  console,
  fetch: (...args) => fetchImpl(...args)
});

vm.runInContext(budgetJs, ui);
const card = id => node('aiBudgetCards').innerHTML.match(new RegExp(`<article[^>]*data-budget-slot="${id}"[\\s\\S]*?</article>`))?.[0] || '';
const fuelRow = id => node('homeAiFuelRows').innerHTML.match(new RegExp(`<div[^>]*data-fuel-slot="${id}"[\\s\\S]*?</div>`))?.[0] || '';

// 1. Initial empty state: 0 writes, codex-2 (cancelled) and gemini-cli hidden, no progress bar drawn without values.
assert.equal(writes.length, 0, 'initial render must not call setItem');
assert.deepEqual(
  [...node('aiBudgetCards').innerHTML.matchAll(/data-budget-slot="([^"]+)"/g)].map(m => m[1]),
  ['codex-1', 'claude-1', 'gemini-pro', 'antigravity-cg']
);
assert.match(card('codex-1'), /Codex 주력/);
assert.match(card('codex-1'), /아직 수집 전/);
assert.match(card('codex-1'), /미확인/);
assert.equal(card('codex-1').includes('budget-meter'), false, 'empty card must not draw a progress bar');
assert.equal(card('codex-1').includes('role="meter"'), false);
assert.equal(card('codex-2'), '', 'cancelled GPT backup account stays hidden');
assert.equal(node('aiBudgetCards').innerHTML.includes('data-budget-slot="gemini-cli"'), false, 'gemini-cli remains hidden');
assert.equal(node('aiBudgetAccount').innerHTML.includes('codex-2'), false);
assert.equal(node('aiBudgetAccount').innerHTML.includes('gemini-cli'), false);

// 2. >6h stale chip & fresh relative age & reset countdown chip & missing-value no-bar rule.
const HOUR = 3600000;
payload = {
  schemaVersion: 1,
  collectorStatus: 'ready',
  accounts: [
    {
      id: 'codex-1',
      provider: 'codex',
      source: 'codex-app-server',
      observedAt: new Date(mockNow - (6 * HOUR + 60000)).toISOString(),
      windows: [{kind: 'weekly', usedPercent: 42, resetsAt: new Date(mockNow + 2 * HOUR).toISOString()}]
    },
    {
      id: 'claude-1',
      provider: 'claude',
      source: 'claude-code-transcripts',
      observedAt: new Date(mockNow - 20 * 60000).toISOString(),
      windows: [],
      transcriptUsage: {
        observedAt: new Date(mockNow - 20 * 60000).toISOString(),
        fiveHours: {inputTokens: 100, outputTokens: 20, assistantTurns: 2},
        sevenDays: {inputTokens: 200, outputTokens: 40, assistantTurns: 4},
        lastActivityAt: new Date(mockNow - 20 * 60000).toISOString(),
        fourWeekMaxFiveHourTokens: null,
        dailyMaxima: [],
        limited: false
      }
    },
    {
      id: 'gemini-pro',
      provider: 'antigravity',
      source: 'antigravity',
      observedAt: new Date(mockNow - 30 * 60000).toISOString(),
      windows: [{kind: 'weekly', usedPercent: 16, resetsAt: new Date(mockNow + 24 * HOUR).toISOString()}]
    },
    {
      id: 'antigravity-cg',
      provider: 'antigravity',
      source: 'antigravity',
      observedAt: new Date(mockNow - 30 * 60000).toISOString(),
      windows: [{kind: 'weekly', usedPercent: null, resetsAt: null}]
    },
    {
      id: 'gemini-cli',
      provider: 'gemini',
      source: 'gemini-cli-logs',
      observedAt: new Date(mockNow - 5 * 60000).toISOString(),
      windows: [{kind: 'daily', usedPercent: 50, resetsAt: new Date(mockNow + 5 * HOUR).toISOString()}]
    }
  ]
};

await node('aiBudgetRefresh').handlers.click();
assert.equal(writes.length, 1, 'successful refresh writes once to hani_ai_budget_summary_v1');
assert.equal(writes[0], 'hani_ai_budget_summary_v1');

assert.match(card('codex-1'), /마지막 갱신 6시간 전/);
assert.match(card('codex-1'), /⏳ 오래된 값/);
assert.match(card('codex-1'), /budget-meter[^>]*aria-valuenow="42"/);
assert.match(card('codex-1'), /width:42%/);
assert.match(card('codex-1'), /리셋 2시간 0분 남음/);

assert.match(card('gemini-pro'), /마지막 갱신 30분 전/);
assert.equal(card('gemini-pro').includes('오래된 값'), false, '30m old card must not show 오래된 값');
assert.match(card('gemini-pro'), /width:16%/);

assert.match(card('claude-1'), /플랜 사용률 미확인/);
assert.equal(card('claude-1').includes('budget-meter'), false, 'claude without personal max must not draw a 0% bar');
assert.match(card('antigravity-cg'), /미확인/);
assert.equal(card('antigravity-cg').includes('budget-meter'), false, 'null usedPercent must not draw a bar');
assert.equal(node('aiBudgetCards').innerHTML.includes('data-budget-slot="gemini-cli"'), false);

// 3. Refresh failure shows 1-line failure chip and writes 0 times.
fetchImpl = async () => { throw new Error('bridge offline'); };
await node('aiBudgetRefresh').handlers.click();
assert.equal(writes.length, 1, 'failed refresh must not call setItem');
assert.match(card('codex-1'), /이번에는 못 가져왔어요 · 이전 값 표시 중/);
assert.match(card('gemini-pro'), /이번에는 못 가져왔어요 · 이전 값 표시 중/);
assert.match(card('codex-1'), /58%/, 'previous value stays visible on failure');

// 4. Partial collectorStatus failure shows chip only on affected provider cards.
fetchImpl = async () => ({ok: true, text: async () => JSON.stringify({schemaVersion: 1, accounts: [], collectorStatus: 'codex_read_failed'})});
await node('aiBudgetRefresh').handlers.click();
assert.equal(writes.length, 2);
assert.match(card('codex-1'), /이번에는 못 가져왔어요 · 이전 값 표시 중/);
assert.equal(card('gemini-pro').includes('이번에는 못 가져왔어요'), false);

// 5. Manual entry on codex-1 works and updates dashboard.
node('aiBudgetAccount').value = 'codex-1';
node('budget-session-used').value = '25';
node('budget-session-reset').value = '';
node('aiBudgetForm').handlers.submit({preventDefault() {}});
assert.equal(writes.length, 3);
assert.match(card('codex-1'), /75%/);
assert.match(card('codex-1'), /width:25%/);
assert.match(card('codex-1'), /마지막 갱신 0분 전/);

// 6. Dashboard "AI 연료" card is strictly read-only and renders compact 1-line rows.
const writesBeforeDash = writes.length;
ui.window.HaniAiBudget.render();
ui.window.HaniAiBudget.render();
assert.equal(writes.length, writesBeforeDash, 'dashboard render must be strictly read-only');
assert.equal(removes.length, 0);
assert.equal(clears, 0);

assert.match(fuelRow('codex-1'), />GPT</);
assert.match(fuelRow('codex-1'), /home-ai-fuel-bar/);
assert.match(fuelRow('codex-1'), /width:25%/);
assert.equal(fuelRow('codex-2'), '');

assert.match(fuelRow('claude-1'), /미확인/);
assert.equal(fuelRow('claude-1').includes('home-ai-fuel-bar'), false, 'dashboard must not draw bar when value missing');
assert.match(fuelRow('gemini-pro'), /16%/);
assert.match(fuelRow('antigravity-cg'), /미확인/);
assert.equal(fuelRow('antigravity-cg').includes('home-ai-fuel-bar'), false);
assert.equal(node('homeAiFuelRows').innerHTML.includes('gemini-cli'), false);

assert.equal(storage.get('hani_os_life_v23'), 'LIFE_FIXTURE_UNCHANGED');
assert.ok(writes.every(k => k === 'hani_ai_budget_summary_v1'));

// Responsive, #home placement & Dark finish CSS checks.
const movedToHome = [];
const fakeHome = {classList: {contains: () => true}, appendChild(el) { el.parentElement = this; movedToHome.push(el.id); }};
const fakeLowerGrid = {className: 'home-lower-grid'};
const fakeFuel = {id: 'homeAiFuelCard', parentElement: fakeLowerGrid};
const promoNodes = new Map([['home', fakeHome], ['homeAiFuelCard', fakeFuel]]);
const promoUi = vm.createContext({
  window: {HaniAiBudgetCore: core},
  document: {getElementById: id => promoNodes.get(id) ?? node('promo-' + id), addEventListener() {}},
  localStorage: {getItem: () => null, setItem() { throw new Error('unexpected write'); }, removeItem() {}, clear() {}},
  setInterval() {},
  setTimeout,
  clearTimeout,
  AbortController,
  Intl,
  Date: MockDate,
  console,
  fetch: (...args) => fetchImpl(...args)
});
vm.runInContext(budgetJs, promoUi);
assert.deepEqual(movedToHome, ['homeAiFuelCard'], 'AI 연료 card is promoted to direct child of #home');
assert.equal(fakeFuel.parentElement, fakeHome);

assert.match(budgetCss, /@media\(max-width:480px\)/);
assert.match(budgetCss, /midnight-black/);
assert.match(budgetCss, /titanium-graphite/);
assert.match(budgetCss, /#app #home>\.home-ai-fuel-card\{[^}]*order:-15/);
assert.match(budgetCss, /@media\(max-width:700px\)\{[^\n]*#app #home>\.home-ai-fuel-card\{order:-15\}/);
assert.match(budgetCss, /:root:is\(\[data-finish="midnight-black"\],\[data-finish="titanium-graphite"\]\) #aiBudget \.budget-meter i\{background:var\(--structure-accent\)\}/);
assert.match(budgetCss, /:root:is\(\[data-finish="midnight-black"\],\[data-finish="titanium-graphite"\]\) #app #home \.home-ai-fuel-bar i\{background:var\(--structure-accent\)\}/);
assert.equal(/#aiBudget[^{]*\.btn[^}]*!important/.test(budgetCss), false, 'no hardcoded !important button color conflicts in #aiBudget CSS');

console.log('PASS: AI budget view — 0 extra writes, >6h stale chip, failure chip, codex-2/gemini-cli hidden, no bar without value, read-only dashboard card.');
