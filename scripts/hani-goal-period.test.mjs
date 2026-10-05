// Tests for data-hub/period-goal.mjs. Run: node --test scripts/hani-goal-period.test.mjs
// The integration cases load the real Data Hub core from hani-main.js (read-only) so the
// period layer is checked against the production monthly engine, not only fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {
  metricPeriod, periodMonths, periodRange, aggregatePeriod, resolvePeriodGoal, goalProgress,
  suggestMonthlyBudget, EXTRA_DEFINITIONS, EXTRA_ADAPTERS, PERIOD_ENGINE_VERSION
} from '../data-hub/period-goal.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
function loadCore() {
  const source = readFileSync(root + 'hani-main.js', 'utf8');
  const start = source.indexOf('const core=(()=>{');
  const end = source.indexOf('const store=(()=>{');
  assert.ok(start > 0 && end > start, 'Data Hub core region not found in hani-main.js');
  return new Function(source.slice(start, end) + '\nreturn core;')();
}
const core = loadCore();
const def = id => [...core.DEFAULT_REGISTRY, ...EXTRA_DEFINITIONS].find(item => item.metric_id === id);
const deepFreeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); } return value; };

function row(definition, month, value, extra = {}) {
  const period = core.metricPeriod(month, definition.period_basis);
  return {metric_id: definition.metric_id, month, value, unit: definition.unit, kind: definition.kind,
    definition_version: definition.definition_version, ...period, status: 'CONFIRMED', reasons: [],
    revision: 1, as_of: period.period_end, ...extra};
}
const goal = (definition, extra) => ({goal_id: 'g1', revision: 1, metric_id: definition.metric_id, unit: definition.unit,
  semantics: definition.goal_semantics, status: 'active', created_at: '2026-01-01T00:00:00+09:00', ...extra});

test('periods: months, ranges and parity with core metricPeriod', () => {
  assert.deepEqual(periodMonths({type: 'quarter', year: 2026, quarter: 2}), ['2026-04', '2026-05', '2026-06']);
  assert.equal(periodMonths({type: 'annual', year: 2026}).length, 12);
  assert.deepEqual(periodMonths({type: 'month', year: 2026, month: 3}), ['2026-03']);
  assert.throws(() => periodMonths({type: 'quarter', year: 2026, quarter: 5}));
  assert.throws(() => periodMonths({type: 'week', year: 2026}));
  // D-20261005-09: ledger Q1 is settlement months 1-3 = 2025-12-18 .. 2026-03-17
  const ledger = periodRange(def('spending_jispi_krw'), {type: 'quarter', year: 2026, quarter: 1});
  assert.equal(ledger.period_start, '2025-12-18'); assert.equal(ledger.period_end, '2026-03-17');
  const books = periodRange(def('books_completed_count'), {type: 'quarter', year: 2026, quarter: 1});
  assert.equal(books.period_start, '2026-01-01'); assert.equal(books.period_end, '2026-03-31');
  for (const month of ['2024-02', '2026-01', '2026-12'])
    for (const basis of ['calendar_month', 'settlement_18_17'])
      assert.deepEqual(metricPeriod(month, basis), core.metricPeriod(month, basis));
});

test('cumulative: closed quarter sums months and is CONFIRMED', () => {
  const d = def('books_completed_count');
  const rows = deepFreeze([row(d, '2026-01', 2), row(d, '2026-02', 3), row(d, '2026-03', 1)]);
  const result = aggregatePeriod(rows, d, {type: 'quarter', year: 2026, quarter: 1}, {asOf: '2026-04-02'});
  assert.equal(result.value, 6); assert.equal(result.status, 'CONFIRMED'); assert.deepEqual(result.reasons, []);
  assert.equal(result.engine_version, PERIOD_ENGINE_VERSION);
});

test('cumulative: a missing month makes the quarter PARTIAL and is reported', () => {
  const d = def('books_completed_count');
  const result = aggregatePeriod([row(d, '2026-01', 2), row(d, '2026-03', 1)], d,
    {type: 'quarter', year: 2026, quarter: 1}, {asOf: '2026-04-02'});
  assert.equal(result.value, 3); assert.equal(result.status, 'PARTIAL');
  assert.deepEqual(result.months_missing, ['2026-02']); assert.ok(result.reasons.includes('MONTHS_MISSING'));
});

test('average: weighted by observed days, not a mean of monthly means', () => {
  const d = def('steps_daily_average');
  const rows = [row(d, '2026-01', 10000, {numerator: 100000, denominator: 10}), row(d, '2026-02', 2000, {numerator: 2000, denominator: 1}),
    row(d, '2026-03', 8000, {numerator: 80000, denominator: 10})];
  const result = aggregatePeriod(rows, d, {type: 'quarter', year: 2026, quarter: 1}, {asOf: '2026-04-01'});
  assert.equal(result.value, 182000 / 21); assert.equal(result.denominator, 21);
});

test('ratio: quiz accuracy is weighted by questions', () => {
  const d = def('quiz_accuracy_percent');
  const rows = [row(d, '2026-04', 90, {numerator: 9, denominator: 10}), row(d, '2026-05', 50, {numerator: 45, denominator: 90})];
  const result = aggregatePeriod(rows, d, {type: 'quarter', year: 2026, quarter: 2}, {asOf: '2026-07-01'});
  assert.equal(result.value, 54); assert.deepEqual(result.months_missing, ['2026-06']);
});

test('point in time: last available month, flagged when the latest month is missing', () => {
  const d = def('investment_total_krw');
  const result = aggregatePeriod([row(d, '2026-01', 100), row(d, '2026-02', 120)], d,
    {type: 'quarter', year: 2026, quarter: 1}, {asOf: '2026-04-05'});
  assert.equal(result.value, 120); assert.ok(result.reasons.includes('LATEST_MONTH_UNAVAILABLE'));
  assert.equal(result.status, 'PARTIAL');
});

test('open period: future months are not started, not missing', () => {
  const d = def('books_completed_count');
  const result = aggregatePeriod([row(d, '2026-04', 1, {status: 'PARTIAL', reasons: ['PERIOD_OPEN']})], d,
    {type: 'quarter', year: 2026, quarter: 2}, {asOf: '2026-04-20'});
  assert.deepEqual(result.months_not_started, ['2026-05', '2026-06']); assert.deepEqual(result.months_missing, []);
  assert.equal(result.status, 'PARTIAL'); assert.ok(result.reasons.includes('PERIOD_OPEN'));
});

test('stale, duplicate and mismatched month rows are excluded', () => {
  const d = def('books_completed_count');
  const rows = [row(d, '2026-01', 5, {status: 'STALE'}), row(d, '2026-02', 1), row(d, '2026-02', 2),
    row(d, '2026-03', 4, {definition_version: 2})];
  const result = aggregatePeriod(rows, d, {type: 'quarter', year: 2026, quarter: 1}, {asOf: '2026-04-02'});
  assert.equal(result.value, null); assert.equal(result.status, 'NO_DATA');
  for (const reason of ['STALE_MONTH', 'DUPLICATE_MONTH_ROW', 'DEFINITION_MISMATCH', 'NO_OBSERVATION']) assert.ok(result.reasons.includes(reason), reason);
});

test('goal resolution: exact period type, effective date, creation time, conflicts', () => {
  const d = def('books_completed_count'), q1 = {type: 'quarter', year: 2026, quarter: 1};
  const clock = {asOf: '2026-03-31', evaluationAt: '2026-04-01T09:00:00+09:00'};
  const quarterGoal = goal(d, {goal_type: 'quarter', year: 2026, quarter: 1, value: 6, effective_from: '2026-01-01', effective_to: '2026-03-31'});
  const annualGoal = goal(d, {goal_id: 'g2', goal_type: 'annual', year: 2026, value: 30, effective_from: '2026-01-01', effective_to: '2026-12-31'});
  assert.equal(resolvePeriodGoal([quarterGoal, annualGoal], d, q1, clock).target, 6);
  assert.equal(resolvePeriodGoal([annualGoal], d, q1, clock).status, 'NO_GOAL');
  assert.equal(resolvePeriodGoal([annualGoal], d, {type: 'annual', year: 2026}, clock).target, 30);
  const future = {...quarterGoal, created_at: '2026-05-01T00:00:00+09:00'};
  assert.equal(resolvePeriodGoal([future], d, q1, clock).status, 'NO_GOAL');
  // A superseded revision applies only to its own effective window.
  const old = {...quarterGoal, status: 'superseded', effective_to: '2026-02-14'};
  const next = {...quarterGoal, revision: 2, value: 8, effective_from: '2026-02-15'};
  assert.equal(resolvePeriodGoal([old, next], d, q1, clock).target, 8);
  assert.equal(resolvePeriodGoal([old, next], d, q1, {...clock, asOf: '2026-02-01'}).target, 6);
  assert.equal(resolvePeriodGoal([quarterGoal, {...quarterGoal, goal_id: 'x'}], d, q1, clock).status, 'CONFLICT');
  assert.equal(resolvePeriodGoal([{...quarterGoal, unit: 'kg'}], d, q1, clock).status, 'INVALID_TARGET');
});

test('cumulative goal progress with pace (D-20261005-08)', () => {
  const d = def('books_completed_count'), year = {type: 'annual', year: 2026};
  const rows = [row(d, '2026-01', 2), row(d, '2026-02', 2), row(d, '2026-03', 2, {status: 'PARTIAL', reasons: ['PERIOD_OPEN']})];
  const metric = aggregatePeriod(rows, d, year, {asOf: '2026-03-31'});
  const resolved = resolvePeriodGoal([goal(d, {goal_type: 'annual', year: 2026, value: 30, effective_from: '2026-01-01', effective_to: '2026-12-31'})],
    d, year, {asOf: '2026-03-31', evaluationAt: '2026-03-31T20:00:00+09:00'});
  const progress = goalProgress(metric, resolved, d);
  assert.equal(progress.achievement_rate, 20); assert.equal(progress.remaining, 24);
  assert.equal(progress.pace.elapsed_days, 90); assert.equal(progress.pace.total_days, 365);
  assert.ok(Math.abs(progress.pace.projected - 6 / (90 / 365)) < 1e-9); // about 24.3 books by year end
});

test('monthly budget: suggestion is ledger target + 15% (D-20261005-07) and usage is per month', () => {
  assert.deepEqual({...suggestMonthlyBudget(2300000)}, {value: 2645000, base: 2300000, margin: 0.15, basis: 'ledger_targetT'});
  assert.throws(() => suggestMonthlyBudget(0)); assert.throws(() => suggestMonthlyBudget(1000, 2));
  const d = def('spending_jispi_krw'), q1 = {type: 'quarter', year: 2026, quarter: 1};
  const metric = aggregatePeriod([row(d, '2026-01', 2500000), row(d, '2026-02', 2800000), row(d, '2026-03', 2400000)], d, q1, {asOf: '2026-03-20'});
  const budget = suggestMonthlyBudget(2300000).value;
  const progress = goalProgress(metric, {status: 'RESOLVED', target: budget, goal_id: 'b', goal_revision: 1, unit: 'KRW', semantics: 'monthly_budget', reasons: []}, d);
  assert.equal(progress.budget_total, budget * 3); assert.equal(progress.remaining, budget * 3 - 7700000);
  assert.deepEqual(progress.months_over_budget, ['2026-02']); assert.equal(progress.interpretation, 'favorable');
});

test('rate and point targets', () => {
  const quiz = def('quiz_accuracy_percent'), q = {type: 'quarter', year: 2026, quarter: 1};
  const quizMetric = aggregatePeriod([row(quiz, '2026-01', 80, {numerator: 8, denominator: 10})], quiz, q, {asOf: '2026-04-01'});
  const rate = goalProgress(quizMetric, {status: 'RESOLVED', target: 85, goal_id: 'q', goal_revision: 1, unit: '%', semantics: 'rate', reasons: []}, quiz);
  assert.equal(rate.delta_pp, -5); assert.equal(rate.interpretation, 'unfavorable');
  const invest = def('investment_total_krw');
  const investMetric = aggregatePeriod([row(invest, '2026-03', 80000000)], invest, q, {asOf: '2026-04-01'});
  const point = goalProgress(investMetric, {status: 'RESOLVED', target: 100000000, goal_id: 'i', goal_revision: 1, unit: 'KRW', semantics: 'point_target', reasons: []}, invest);
  assert.equal(point.achievement_rate, 80); assert.equal(point.remaining, 20000000);
  const weight = def('body_weight_kg');
  const weightMetric = aggregatePeriod([row(weight, '2026-03', 104)], weight, q, {asOf: '2026-04-01'});
  const w = goalProgress(weightMetric, {status: 'RESOLVED', target: 100, goal_id: 'w', goal_revision: 1, unit: 'kg', semantics: 'point_target', reasons: []}, weight);
  assert.equal(w.gap, 4); assert.equal(w.achievement_rate, null); assert.equal(w.interpretation, 'unclassified');
  assert.ok(goalProgress(weightMetric, {status: 'NO_GOAL', reasons: ['NO_GOAL']}, weight).reasons.includes('NO_GOAL'));
});

test('extra definitions pass the core registry validation', () => {
  const registry = core.createRegistry([...core.DEFAULT_REGISTRY, ...EXTRA_DEFINITIONS]);
  assert.equal(registry.length, core.DEFAULT_REGISTRY.length + 3);
});

function calc(source, month, asOf) {
  return core.calculateMonth(source, {month, asOf, calculatedAt: asOf + 'T23:00:00+09:00',
    registry: [...core.DEFAULT_REGISTRY, ...EXTRA_DEFINITIONS], adapters: {...core.SOURCE_ADAPTERS, ...EXTRA_ADAPTERS},
    canonical: {version: 'test', brokerTotal: () => 0, ledgerSpending: () => 0},
    sourceContext: Object.fromEntries(['body', 'exercise', 'movies', 'books', 'learningQuizzes', 'ledgerMonths', 'investmentBrokerSnapshots']
      .map(key => [key, {complete: true}]))});
}

test('integration: extra adapters through the real core calculateMonth', () => {
  const source = deepFreeze({
    investmentBrokerSnapshots: [], ledgerMonths: [], books: [], learningQuizzes: [],
    body: [{id: 'b1', date: '2026-03-02', weight: 105, fat: 28.4}, {id: 'b2', date: '2026-03-20', weight: 104, fat: 27.9},
      {id: 'b3', date: '2026-03-25', weight: 104, fat: null}, {id: 'b4', date: '2026-02-10', weight: 106, fat: 29}],
    exercise: [{id: 'e1', date: '2026-03-01', steps: 9000, distance: 0, strength: false},
      {id: 'e2', date: '2026-03-03', steps: 4000, distance: 3.2, strength: false},
      {id: 'e3', date: '2026-03-05', steps: 0, distance: 0, strength: true}, {id: 'e4', date: '2026-02-05', distance: 5}],
    movies: [{id: 'm1', status: 'watched', watchedDate: '2026-03-04'}, {id: 'm2', status: 'watched', watchedDate: '2026-03-28'},
      {id: 'm3', status: 'wish', watchedDate: ''}, {id: 'm4', status: 'watched', watchedDate: '2026-02-11'}]
  });
  const rows = calc(source, '2026-03', '2026-03-31');
  const get = id => rows.find(item => item.metric_id === id);
  assert.equal(get('body_fat_percent').value, 27.9); assert.equal(get('body_fat_percent').status, 'CONFIRMED');
  assert.equal(get('exercise_days_count').value, 2, 'step-only day is not a workout day');
  assert.equal(get('media_watched_count').value, 2);
  const flagged = calc({...source, movies: [...source.movies, {id: 'm5', status: 'watched', watchedDate: '2026-13-40'}]}, '2026-03', '2026-03-31');
  assert.ok(flagged.find(item => item.metric_id === 'media_watched_count').reasons.includes('INVALID_DATE'));
});

test('integration: real monthly rows → quarter metric → goal progress', () => {
  const source = deepFreeze({
    investmentBrokerSnapshots: [], ledgerMonths: [], learningQuizzes: [], body: [], movies: [],
    exercise: [{date: '2026-01-10', distance: 2}, {date: '2026-02-11', strength: true}, {date: '2026-02-12', distance: 1}, {date: '2026-03-15', distance: 4}],
    books: [{id: 'k1', status: 'read', completedDate: '2026-01-20'}, {id: 'k2', status: 'read', completedDate: '2026-02-03'},
      {id: 'k3', status: 'read', readDate: '2026-03-09'}]
  });
  const rows = ['2026-01', '2026-02', '2026-03'].flatMap(month => calc(source, month, '2026-04-02'));
  const q1 = {type: 'quarter', year: 2026, quarter: 1};
  const workouts = aggregatePeriod(rows, def('exercise_days_count'), q1, {asOf: '2026-04-02'});
  assert.equal(workouts.value, 4); assert.equal(workouts.status, 'CONFIRMED');
  const books = aggregatePeriod(rows, def('books_completed_count'), q1, {asOf: '2026-04-02'});
  assert.equal(books.value, 3); assert.equal(books.status, 'CONFIRMED');
  const target = resolvePeriodGoal([goal(def('exercise_days_count'), {goal_type: 'quarter', year: 2026, quarter: 1, value: 8,
    effective_from: '2026-01-01', effective_to: '2026-03-31'})], def('exercise_days_count'), q1,
    {asOf: '2026-04-02', evaluationAt: '2026-04-02T10:00:00+09:00'});
  const progress = goalProgress(workouts, target, def('exercise_days_count'));
  assert.equal(progress.achievement_rate, 50); assert.equal(progress.remaining, 4); assert.equal(progress.pace.elapsed_ratio, 1);
});

test('purity: inputs are not mutated', () => {
  const d = def('books_completed_count');
  const rows = deepFreeze([row(d, '2026-01', 1)]);
  assert.doesNotThrow(() => aggregatePeriod(rows, d, {type: 'quarter', year: 2026, quarter: 1}, {asOf: '2026-02-01'}));
});
