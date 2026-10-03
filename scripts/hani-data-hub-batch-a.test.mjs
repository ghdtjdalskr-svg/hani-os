import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {
  DEFAULT_REGISTRY, SOURCE_ADAPTERS, createRegistry, calculateMonth, compareMetric,
  resolveGoal, markStale, metricPeriod, previousMonth, validDate, koreaDate, sourceFingerprint
} from '../data-hub/metrics-core.mjs';

const production = readFileSync(new URL('../hani-main.js', import.meta.url), 'utf8');
const context = vm.createContext({n: x => Number(x) || 0, cashFlowSummary: () => ({})});
const functions = ['brokerHoldingCalc', 'brokerCalc'].map(name => production.match(new RegExp('function ' + name + '\\([^\\n]+'))[0]).join('\n');
const ledger = production.slice(production.indexOf('function ledgerCalc('), production.indexOf('const LEDGER_CATEGORY_LABELS='));
vm.runInContext(functions + '\n' + ledger, context);
const canonical = {
  version: 'fe07619-brokerCalc-ledgerCalc',
  brokerTotal: row => context.brokerCalc(row).total,
  ledgerSpending: row => context.ledgerCalc(row).jispiT
};
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const complete = Object.fromEntries(DEFAULT_REGISTRY.map(def => [def.source, {ready: true, complete: true}]));
const options = {month: '2026-09', asOf: '2026-09-30', calculatedAt: '2026-09-30T12:00:00Z', canonical, sourceContext: complete};
const source = () => ({
  investmentBrokerSnapshots: [{id: 'b1', mode: 'actual', status: 'confirmed', period: '2026-09', snapshotDate: '2026-09-20',
    accounts: [{enabled: true, estimatedAssets: 113750000, totalEvaluation: 110000000, holdings: [], totalPurchase: null, totalPnl: null, totalReturn: null}]}],
  body: [{id: 'w1', date: '2026-09-02', weight: 103.2}, {id: 'w2', date: '2026-09-21', weight: 101}],
  books: [{id: 'r1', status: 'read', readDate: '2026-09-02'}, {id: 'r2', status: 'read', completedDate: '2026-09-20'}],
  movies: [{status: 'watched', watchedDate: '2026-09-01'}],
  exercise: [{id: 'e1', date: '2026-09-01', steps: 8000}, {id: 'e2', date: '2026-09-02', steps: 12000}],
  ledgerMonths: [{id: 'l1', month: '2026-09', periodStart: '2026-08-18', periodEnd: '2026-09-17', targetT: 2300000,
    items: [{date: '2026-08-18', category: 'fixed', amount: 1000000, reimbursement: 100000},
      {date: '2026-09-17', category: 'variable', amount: 600000}, {date: '2026-09-01', category: 'finance', amount: 900000}]}],
  learningQuizzes: [{id: 'q1', status: 'completed', completedAt: '2026-08-31T15:00:00Z', total: 10, correctCount: 10},
    {id: 'q2', status: 'completed', completedAt: '2026-09-01T01:00:00+09:00', total: 30, correctCount: 15}]
});
const metric = (rows, id) => rows.find(row => row.metric_id === id);
const definition = id => DEFAULT_REGISTRY.find(def => def.metric_id === id);
const calculate = (state = source(), overrides = {}) => calculateMonth(state, {...options, ...overrides});
const goal = (id = 'steps_daily_average', overrides = {}) => ({
  goal_id: 'g1', metric_id: id, goal_type: 'annual', year: 2026, value: 10000,
  unit: definition(id).unit, semantics: definition(id).goal_semantics, status: 'active', revision: 1,
  effective_from: '2026-01-01', effective_to: '2026-12-31', created_at: '2026-01-01T00:00:00Z', ...overrides
});
const goalClock = {month: options.month, asOf: options.asOf, evaluationAt: options.calculatedAt};

test('registry is extensible, deeply immutable, and rejects invalid definitions', () => {
  assert.equal(DEFAULT_REGISTRY.length, 6);
  assert.throws(() => DEFAULT_REGISTRY[0].goal_support.push('monthly'));
  assert.throws(() => createRegistry([...DEFAULT_REGISTRY, DEFAULT_REGISTRY[0]]));
  assert.throws(() => createRegistry([{...DEFAULT_REGISTRY[0], metric_id: 'Bad'}]));
  assert.throws(() => createRegistry([{...DEFAULT_REGISTRY[0], period_basis: 'unknown'}]));
  assert.throws(() => createRegistry([{...DEFAULT_REGISTRY[0], timezone: 'UTC'}]));
  const extra = {...DEFAULT_REGISTRY[2], metric_id: 'habit_done_count', name: 'HABIT', domain: 'Habit',
    source: 'habits', adapter: 'habit', comparison: 'none'};
  const registry = createRegistry([...DEFAULT_REGISTRY, extra]);
  const adapters = {...SOURCE_ADAPTERS, habit: rows => ({value: rows.filter(row => row.done).length, sample_count: rows.length, as_of: null})};
  const rows = calculate({...source(), habits: [{done: true}, {done: false}]}, {registry, adapters,
    sourceContext: {...complete, habits: {ready: true, complete: true}}});
  assert.equal(rows.length, 7);
  assert.equal(metric(rows, extra.metric_id).value, 1);
  assert.equal(metric(rows, extra.metric_id).domain, 'Habit');
});

test('six metrics use canonical sources and preserve frozen source', () => {
  const state = freeze(source()), before = JSON.stringify(state), rows = calculate(state);
  assert.deepEqual(rows.map(row => row.value), [113750000, 101, 2, 10000, 1500000, 62.5]);
  assert(rows.every(row => row.status === 'CONFIRMED'));
  assert.equal(metric(rows, 'quiz_accuracy_percent').numerator, 25);
  assert.equal(metric(rows, 'quiz_accuracy_percent').denominator, 40);
  assert.equal(metric(rows, 'steps_daily_average').observed_days, 2);
  assert.equal(JSON.stringify(state), before);
  assert.throws(() => { rows[0].value = 999; });
});

test('date validators, KST boundary, leap dates, explicit deterministic clock', () => {
  assert(validDate('2024-02-29')); assert(!validDate('2026-02-29')); assert(!validDate('2026-09-31'));
  assert.equal(koreaDate('2026-08-31T15:00:00Z'), '2026-09-01');
  assert.equal(koreaDate('2026-08-31T14:59:59Z'), '2026-08-31');
  assert.equal(koreaDate('2026-09-01T00:00:00'), null);
  assert.equal(koreaDate(null), null);
  assert.equal(koreaDate('2026-09-01T24:00:00Z'), null);
  assert.equal(koreaDate('2026-09-01T00:00:00+14:01'), null);
  assert.equal(previousMonth('2026-01'), '2025-12');
  assert.throws(() => previousMonth('2026-13'));
  assert.throws(() => calculate(source(), {asOf: undefined}));
  assert.deepEqual(calculate(), calculate());
});

test('settlement basis stays previous 18th through current 17th', () => {
  assert.deepEqual(metricPeriod('2026-01', 'settlement_18_17'), {
    period_basis: 'settlement_18_17', period_start: '2025-12-18', period_end: '2026-01-17'
  });
  assert.equal(metricPeriod('2024-02').period_end, '2024-02-29');
  const state = source();
  state.ledgerMonths[0].items.push({date: '2026-09-18', category: 'variable', amount: 999999});
  const row = metric(calculate(state), 'spending_jispi_krw');
  assert.equal(row.value, 1500000); assert.equal(row.period_start, '2026-08-18');
  assert(row.reasons.includes('ITEM_OUTSIDE_SETTLEMENT')); assert.equal(row.status, 'PARTIAL');
  state.ledgerMonths[0].periodStart = '2026-09-01';
  assert.equal(metric(calculate(state), row.metric_id).value, null);
});

test('HASDAQ excludes positions/practice/draft/future and does not reconstruct holdings', () => {
  const state = source(), original = structuredClone(state.investmentBrokerSnapshots[0]);
  state.investmentBrokerSnapshots.push(...[
    {recordType: 'positions'}, {mode: 'practice'}, {status: 'draft'}, {snapshotDate: '2026-10-01'}
  ].map((patch, i) => ({...original, ...patch, id: 'excluded' + i})));
  assert.equal(metric(calculate(state), 'investment_total_krw').value, 113750000);
  const missing = metric(calculate(state, {canonical: {}}), 'investment_total_krw');
  assert.equal(missing.status, 'NO_DATA'); assert(missing.reasons.includes('CANONICAL_TOTAL_UNAVAILABLE'));
  assert.equal(metric(calculate(state, {canonical: {...canonical, brokerTotal: () => NaN}}), missing.metric_id).value, null);
  assert.equal(metric(calculate(state, {canonical: {...canonical, brokerTotal: () => 0}}), missing.metric_id).value, 0);
});

test('last valid monthly point is not the last pair of raw records', () => {
  const state = source(); state.body.push({id: 'invalid', date: '2026-09-29', weight: 0}, {id: 'future', date: '2026-10-01', weight: 50});
  const row = metric(calculate(state), 'body_weight_kg');
  assert.equal(row.value, 101); assert.equal(row.as_of, '2026-09-21'); assert.equal(row.status, 'PARTIAL');
});

test('exact previous month gaps and zero baselines are never substituted', () => {
  const current = metric(calculate(), 'books_completed_count'), def = definition(current.metric_id);
  const earlier = {...current, month: '2026-07', value: 1};
  const gap = compareMetric(current, earlier, def);
  assert.equal(gap.delta_absolute, null); assert(gap.reasons.includes('NO_PREVIOUS_MONTH'));
  const zero = compareMetric(current, {...earlier, month: '2026-08', value: 0}, def);
  assert.equal(zero.delta_absolute, 2); assert.equal(zero.delta_percent, null); assert(zero.reasons.includes('BASELINE_ZERO'));
  const normal = compareMetric(current, {...earlier, month: '2026-08'}, def);
  assert.equal(normal.delta_absolute, 1); assert.equal(normal.delta_percent, 100);
  const mismatch = compareMetric(current, {...earlier, month: '2026-08', definition_version: 2}, def);
  assert(mismatch.reasons.includes('BASELINE_CONTRACT_MISMATCH'));
});

test('NO_DATA vs observed zero vs incomplete dataset are distinct', () => {
  const absent = calculate({}); assert(absent.every(row => row.value === null && row.status === 'NO_DATA'));
  assert(absent.every(row => row.reasons.includes('SOURCE_NOT_READY')));
  const state = source(); state.books = []; state.exercise = []; state.learningQuizzes = [];
  const rows = calculate(state);
  assert.equal(metric(rows, 'books_completed_count').value, 0);
  assert.equal(metric(rows, 'books_completed_count').status, 'CONFIRMED');
  assert.equal(metric(rows, 'steps_daily_average').value, null);
  assert.equal(metric(rows, 'quiz_accuracy_percent').value, null);
  const partial = metric(calculate(state, {sourceContext: {}}), 'books_completed_count');
  assert.equal(partial.value, 0); assert.equal(partial.status, 'PARTIAL');
  const pending = metric(calculate(state, {sourceContext: {books: {ready: false, complete: true}}}), 'books_completed_count');
  assert.equal(pending.value, null);
});

test('STEP positive observed days, zero ambiguity, duplicate-day correction, and immutable raw records', () => {
  const state = source(); state.exercise.push({id: 'zero', date: '2026-09-03', steps: 0, strength: true},
    {id: 'e2', date: '2026-09-02', steps: 9000, updatedAt: '2026-09-03T00:00:00Z'});
  const before = JSON.stringify(state), row = metric(calculate(freeze(state)), 'steps_daily_average');
  assert.equal(row.value, 8500); assert.equal(row.total, 17000); assert.equal(row.observed_days, 2);
  assert(row.reasons.includes('ZERO_STEPS_AMBIGUITY')); assert.equal(row.status, 'PARTIAL');
  assert.equal(JSON.stringify(state), before);
});

test('ambiguous duplicate days are not resolved by array order', () => {
  const state = source(); state.body = [{date: '2026-09-01', weight: 90}, {date: '2026-09-01', weight: 100}];
  const first = metric(calculate(state), 'body_weight_kg'); state.body.reverse();
  const second = metric(calculate(state), first.metric_id);
  assert.deepEqual(first, second); assert.equal(first.value, null); assert(first.reasons.includes('AMBIGUOUS_DUPLICATE'));
});

test('READ counts books only, excludes conflicts and counts duplicate IDs once', () => {
  const state = source(); state.books.push({...state.books[0]}, {id: 'bad', status: 'read', readDate: '2026-09-01', completedDate: '2026-08-01'},
    {status: 'reading', readDate: '2026-09-02'});
  const row = metric(calculate(state), 'books_completed_count'); assert.equal(row.value, 2);
  assert(row.reasons.includes('INVALID_COMPLETION_DATE')); assert.equal(row.status, 'PARTIAL');
});

test('accuracy is monthly weighted counts, never all-time or score reverse inference', () => {
  const state = source(); state.learningQuizzes.push({status: 'completed', completedAt: '2026-08-31T14:59:59Z', total: 100, correctCount: 100},
    {status: 'completed', completedAt: '2026-09-02T00:00:00Z', total: 10, correctCount: null, score: 100},
    {status: 'completed', completedAt: '2026-09-03T00:00:00Z', total: 0, correctCount: 0},
    {status: 'pending', total: 1, correctCount: 1});
  const row = metric(calculate(state), 'quiz_accuracy_percent');
  assert.equal(row.value, 62.5); assert.equal(row.denominator, 40); assert.equal(row.status, 'PARTIAL');
  state.learningQuizzes = [{status: 'completed', completedAt: '2026-09-01T00:00:00Z', total: 10, correctCount: 0}];
  assert.equal(metric(calculate(state), row.metric_id).value, 0);
});

test('future periods and open monthly periods remain explicit', () => {
  const rows = calculate(source(), {month: '2026-10'});
  assert(rows.every(row => row.status === 'NO_DATA'));
  const open = calculate(source(), {asOf: '2026-09-05'});
  assert(metric(open, 'books_completed_count').reasons.includes('PERIOD_OPEN'));
  assert.equal(metric(open, 'quiz_accuracy_percent').status, 'PARTIAL');
  assert.equal(metric(open, 'spending_jispi_krw').value, 900000);
});

test('read-only goal resolver: quarter > annual > none, no state.goals/default migration', () => {
  const def = definition('steps_daily_average');
  const annual = goal(), quarterly = goal(def.metric_id, {goal_id: 'g2', goal_type: 'quarter', quarter: 3, value: 9000});
  const before = JSON.stringify([annual, quarterly]);
  assert.equal(resolveGoal(freeze([annual, quarterly]), def, goalClock).target, 9000);
  assert.equal(resolveGoal([annual], def, goalClock).target, 10000);
  assert.equal(resolveGoal([], def, goalClock).status, 'NO_GOAL');
  assert.equal(resolveGoal({investment: 100000000}, def, goalClock).status, 'NO_GOAL');
  assert.equal(JSON.stringify([annual, quarterly]), before);
});

test('goal history respects effective dates and knowledge time', () => {
  const def = definition('steps_daily_average'), early = goal(def.metric_id, {status: 'superseded', effective_to: '2026-09-14'});
  const late = goal(def.metric_id, {goal_id: 'g2', revision: 2, value: 8000, effective_from: '2026-09-15', created_at: '2026-09-15T00:00:00Z'});
  assert.equal(resolveGoal([early, late], def, {...goalClock, asOf: '2026-09-10'}).target, 10000);
  assert.equal(resolveGoal([early, late], def, goalClock).goal_revision, 2);
  assert.equal(resolveGoal([late], def, {...goalClock, evaluationAt: '2026-09-10T00:00:00Z'}).status, 'NO_GOAL');
  assert.equal(resolveGoal([goal(def.metric_id, {status: 'revoked'})], def, goalClock).status, 'NO_GOAL');
});

test('overlaps, missing units, wrong semantics and zero/invalid goals fail closed', () => {
  const def = definition('steps_daily_average');
  assert.equal(resolveGoal([goal(), goal(def.metric_id, {goal_id: 'g2'})], def, goalClock).status, 'CONFLICT');
  for (const patch of [{value: 0}, {value: NaN}, {unit: 'book'}, {semantics: 'annual_total'}])
    assert.equal(resolveGoal([goal(def.metric_id, patch)], def, goalClock).status, 'INVALID_TARGET');
  const read = definition('books_completed_count');
  assert.equal(resolveGoal([goal(read.metric_id, {value: 24})], read, goalClock).target, 24, 'no division by twelve');
});

test('comparison target math: STEP achievement, JISPI usage, HINKEI pp; no fake goals', () => {
  const rows = calculate();
  for (const [id, target] of [['steps_daily_average', 12000], ['spending_jispi_krw', 2300000], ['quiz_accuracy_percent', 85]]) {
    const def = definition(id), resolved = resolveGoal([goal(id, {value: target})], def, goalClock);
    const output = compareMetric(metric(rows, id), null, def, resolved);
    assert.equal(output.target, target); assert.equal(output.goal_revision, 1);
    if (id.startsWith('steps')) { assert.equal(output.achievement_rate, 10000 / 12000 * 100); assert.equal(output.usage_rate, null); }
    if (id.startsWith('spending')) { assert.equal(output.remaining, 800000); assert.equal(output.usage_rate, 1500000 / 2300000 * 100); assert.equal(output.achievement_rate, null); }
    if (id.startsWith('quiz')) { assert.equal(output.delta_pp, -22.5); assert.equal(output.delta_percent, null); }
    const noGoal = compareMetric(metric(rows, id), null, def); assert.equal(noGoal.target, null); assert(noGoal.reasons.includes('NO_GOAL'));
  }
});

test('signed movement is separate from interpretation', () => {
  const row = metric(calculate(), 'body_weight_kg');
  const output = compareMetric(row, {...row, month: '2026-08', value: 103.2}, definition(row.metric_id));
  assert.equal(output.direction.movement, 'down'); assert.equal(output.direction.interpretation, 'unclassified');
  const spending = metric(calculate(), 'spending_jispi_krw'), def = definition(spending.metric_id);
  const budget = compareMetric(spending, null, def, resolveGoal([goal(def.metric_id, {value: 2300000})], def, goalClock));
  assert.equal(budget.direction.movement, 'down'); assert.equal(budget.direction.interpretation, 'favorable');
});

test('source edits/deletions, canonical total and definition changes invalidate revisions', () => {
  const state = source(), first = calculate(state), again = calculate(state, {previousRows: first});
  assert(again.every(row => row.revision === 1));
  state.books.pop();
  const changed = calculate(state, {previousRows: first});
  assert.equal(metric(changed, 'books_completed_count').revision, 2);
  assert.equal(metric(changed, 'steps_daily_average').revision, 1);
  const totalChanged = calculate(state, {previousRows: first, canonical: {...canonical, brokerTotal: () => 1}});
  assert.equal(metric(totalChanged, 'investment_total_krw').revision, 2);
  const registry = createRegistry(DEFAULT_REGISTRY.map(def => ({...def, definition_version: 2})));
  assert(calculate(state, {previousRows: first, registry}).every(row => row.revision === 2));
});

test('STALE preserves last good value but excludes official comparison', () => {
  const row = metric(calculate(), 'books_completed_count'), stale = markStale(row, {source_revision: 'different'});
  assert.equal(row.status, 'CONFIRMED'); assert.equal(stale.status, 'STALE'); assert.equal(stale.value, 2);
  const output = compareMetric(stale, {...row, month: '2026-08'}, definition(row.metric_id));
  assert.equal(output.delta_absolute, null); assert(output.reasons.includes('STALE_CURRENT'));
  assert.deepEqual(markStale(row, {source_revision: row.source_revision}), row);
});

test('adapter failure and invalid output do not become confirmed zeros', () => {
  const failure = metric(calculate(source(), {adapters: {...SOURCE_ADAPTERS, books: () => { throw new Error('failure'); }}}), 'books_completed_count');
  assert.equal(failure.value, null); assert(failure.reasons.includes('ADAPTER_FAILED'));
  const invalid = metric(calculate(source(), {adapters: {...SOURCE_ADAPTERS, books: () => ({value: NaN, sample_count: -1, as_of: null})}}), failure.metric_id);
  assert.equal(invalid.value, null); assert(invalid.reasons.includes('INVALID_ADAPTER_RESULT'));
});

test('failed recalculation preserves last good observation; legitimate deletion becomes NO_DATA', () => {
  const state = source(), previous = calculate(state);
  const failed = calculate(state, {previousRows: previous,
    adapters: {...SOURCE_ADAPTERS, books: () => { throw new Error('Unavailable'); }}});
  const row = metric(failed, 'books_completed_count');
  assert.equal(row.status, 'STALE'); assert.equal(row.value, 2); assert.equal(row.revision, 1);
  assert.equal(row.source_revision, metric(previous, row.metric_id).source_revision);
  assert(row.reasons.includes('RECALCULATION_FAILED'));
  const unavailable = metric(calculate(state, {previousRows: previous, canonical: {}}), 'investment_total_krw');
  assert.equal(unavailable.status, 'STALE'); assert.equal(unavailable.value, 113750000);
  state.exercise = [];
  const deleted = metric(calculate(state, {previousRows: previous}), 'steps_daily_average');
  assert.equal(deleted.status, 'NO_DATA'); assert.equal(deleted.value, null); assert.equal(deleted.revision, 2);
  assert.equal(metric(calculate(source(), {previousRows: failed}), 'books_completed_count').status, 'CONFIRMED');
});

test('canonical callbacks receive frozen copies and invalid average adapters fail closed', () => {
  const state = source(), before = JSON.stringify(state);
  const rows = calculate(state, {canonical: {...canonical, brokerTotal: snapshot => {
    snapshot.accounts[0].estimatedAssets = 1; return 1;
  }}});
  assert.equal(metric(rows, 'investment_total_krw').value, null);
  assert.equal(JSON.stringify(state), before);
  const invalid = calculate(source(), {adapters: {...SOURCE_ADAPTERS,
    steps: () => ({value: 100, numerator: 1, denominator: 0, sample_count: 1, as_of: null})}});
  assert(metric(invalid, 'steps_daily_average').reasons.includes('INVALID_ADAPTER_RESULT'));
});

test('definition kind/aggregation is enforced and period quality transition increments revision', () => {
  assert.throws(() => createRegistry([{...DEFAULT_REGISTRY[3], aggregation: 'sum'}]));
  const state = source(), open = calculate(state, {asOf: '2026-09-29'});
  const closed = calculate(state, {previousRows: open});
  assert.equal(metric(closed, 'books_completed_count').revision, 2);
  assert.equal(metric(closed, 'body_weight_kg').revision, 2, 'period completeness is explicit row metadata');
});

test('malformed comparison inputs fail closed rather than emitting NaN', () => {
  const current = metric(calculate(), 'books_completed_count'), def = definition(current.metric_id);
  assert(compareMetric({...current, value: NaN}, null, def).reasons.includes('INVALID_CURRENT'));
  assert(compareMetric(current, {...current, month: '2026-08', value: undefined}, def).reasons.includes('BASELINE_UNAVAILABLE'));
  const step = metric(calculate(), 'steps_daily_average');
  const comparison = compareMetric(step, null, definition(step.metric_id), {status: 'RESOLVED', target: 0, reasons: []});
  assert.equal(comparison.target, null); assert(comparison.reasons.includes('INVALID_TARGET'));
});

test('valid edits in another month do not invalidate this month or unrelated domains', () => {
  const state = source(); state.books.push({id: 'old', status: 'read', readDate: '2026-08-10'});
  const previous = calculate(state);
  state.books.at(-1).readDate = '2026-08-11';
  const next = calculate(state, {previousRows: previous});
  assert.equal(metric(next, 'books_completed_count').revision, 1);
  state.books.at(-1).readDate = '2026-09-10';
  assert.equal(metric(calculate(state, {previousRows: previous}), 'books_completed_count').revision, 2);
});

test('fingerprint is stable for object/row ordering, no storage/network/runtime integration', () => {
  assert.equal(sourceFingerprint([{b: 2, a: 1}, {x: 3}]), sourceFingerprint([{x: 3}, {a: 1, b: 2}]));
  const module = readFileSync(new URL('../data-hub/metrics-core.mjs', import.meta.url), 'utf8');
  assert(!/\b(localStorage|indexedDB|document|window|fetch|XMLHttpRequest)\b/.test(module));
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert(!html.includes('metrics-core.mjs'));
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Network forbidden'); };
  try { calculate(freeze(source())); } finally { globalThis.fetch = oldFetch; }
});
