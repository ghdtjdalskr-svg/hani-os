// HANI Data Hub · Period aggregation and goal progress (standalone pure module).
// Not loaded by the application. Input is the monthly row contract produced by
// the Data Hub core `calculateMonth`; nothing here reads or writes storage.
// Contract: docs/development-history/2026-10-05-common-data-contract.md §5.2–5.3
// Decisions: D-20261005-06..10 in docs/development-history/DECISIONS.md

export const PERIOD_ENGINE_VERSION = '0.1.0';
export const BUDGET_MARGIN = 0.15; // D-20261005-07

const TIMEZONE = 'Asia/Seoul';
const DAY = 86400000;
const USABLE = ['CONFIRMED', 'PARTIAL'];
const finite = value => typeof value === 'number' && Number.isFinite(value);
const pad = number => String(number).padStart(2, '0');
const unique = values => [...new Set(values)].sort();
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
const dayNumber = date => Date.parse(date + 'T00:00:00Z') / DAY;

// Mirrors core `metricPeriod` (parity is asserted by the integration test).
export function metricPeriod(month, basis = 'calendar_month') {
  if (typeof month !== 'string' || !validDate(month + '-01')) throw new TypeError('Invalid month');
  const [year, number] = month.split('-').map(Number);
  if (basis === 'settlement_18_17') {
    const previous = number === 1 ? `${year - 1}-12` : `${year}-${pad(number - 1)}`;
    return {period_basis: basis, period_start: previous + '-18', period_end: month + '-17'};
  }
  if (basis !== 'calendar_month') throw new TypeError('Unknown period basis');
  const end = new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
  return {period_basis: basis, period_start: month + '-01', period_end: end};
}

export function periodMonths(period) {
  const {type, year} = period || {};
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new TypeError('Invalid period year');
  const label = month => `${year}-${pad(month)}`;
  if (type === 'month') {
    if (!Number.isInteger(period.month) || period.month < 1 || period.month > 12) throw new TypeError('Invalid period month');
    return [label(period.month)];
  }
  if (type === 'quarter') {
    if (!Number.isInteger(period.quarter) || period.quarter < 1 || period.quarter > 4) throw new TypeError('Invalid period quarter');
    return [1, 2, 3].map(offset => label((period.quarter - 1) * 3 + offset));
  }
  if (type === 'annual') return Array.from({length: 12}, (_, index) => label(index + 1));
  throw new TypeError('Invalid period type');
}

// Labeled months under the metric's basis. Ledger Q1 = 12/18 of the previous year to 3/17 (D-20261005-09).
export function periodRange(definition, period) {
  const months = periodMonths(period);
  const first = metricPeriod(months[0], definition.period_basis);
  const last = metricPeriod(months.at(-1), definition.period_basis);
  return {months, period_basis: definition.period_basis, period_start: first.period_start, period_end: last.period_end};
}

function rowMatches(row, definition) {
  return row && row.metric_id === definition.metric_id && row.unit === definition.unit &&
    row.definition_version === definition.definition_version && row.period_basis === definition.period_basis;
}

export function aggregatePeriod(monthRows, definition, period, {asOf} = {}) {
  if (!validDate(asOf)) throw new TypeError('Explicit valid asOf required');
  const range = periodRange(definition, period);
  const reasons = [], included = [], missing = [], notStarted = [], sourceRows = [];
  const rows = Array.isArray(monthRows) ? monthRows.filter(row => row?.metric_id === definition.metric_id) : [];
  for (const month of range.months) {
    if (metricPeriod(month, definition.period_basis).period_start > asOf) { notStarted.push(month); continue; }
    const candidates = rows.filter(row => row.month === month);
    if (candidates.length > 1) { reasons.push('DUPLICATE_MONTH_ROW'); missing.push(month); continue; }
    const row = candidates[0];
    if (!row) { missing.push(month); continue; }
    if (!rowMatches(row, definition)) { reasons.push('DEFINITION_MISMATCH'); missing.push(month); continue; }
    if (row.status === 'STALE') reasons.push('STALE_MONTH');
    if (!USABLE.includes(row.status) || !finite(row.value)) { missing.push(month); continue; }
    if (['average', 'ratio'].includes(definition.kind) && (!finite(row.numerator) || !finite(row.denominator) || row.denominator <= 0)) {
      reasons.push('MISSING_COMPONENTS'); missing.push(month); continue;
    }
    if (row.status === 'PARTIAL') reasons.push('PARTIAL_MONTH');
    included.push(month);
    sourceRows.push({month, value: row.value, status: row.status, revision: row.revision, as_of: row.as_of ?? null,
      ...(['average', 'ratio'].includes(definition.kind) ? {numerator: row.numerator, denominator: row.denominator} : {})});
  }
  const closed = asOf >= range.period_end;
  if (!closed) reasons.push('PERIOD_OPEN');
  if (missing.length) reasons.push('MONTHS_MISSING');

  let value = null, extra = {}, asOfValue = null;
  if (sourceRows.length) {
    if (definition.kind === 'point_in_time') {
      const last = sourceRows.at(-1);
      value = last.value; asOfValue = last.as_of;
      const startedMonths = range.months.filter(month => !notStarted.includes(month));
      if (last.month !== startedMonths.at(-1)) reasons.push('LATEST_MONTH_UNAVAILABLE');
    } else if (definition.kind === 'cumulative') {
      value = sourceRows.reduce((sum, row) => sum + row.value, 0);
      asOfValue = sourceRows.map(row => row.as_of).filter(Boolean).sort().at(-1) || null;
    } else if (['average', 'ratio'].includes(definition.kind)) {
      const numerator = sourceRows.reduce((sum, row) => sum + row.numerator, 0);
      const denominator = sourceRows.reduce((sum, row) => sum + row.denominator, 0);
      value = numerator / denominator * (definition.kind === 'ratio' ? 100 : 1);
      extra = {numerator, denominator};
      asOfValue = sourceRows.map(row => row.as_of).filter(Boolean).sort().at(-1) || null;
    } else {
      reasons.push('UNSUPPORTED_KIND');
    }
  }
  if (value === null) reasons.push('NO_OBSERVATION');
  const status = value === null ? 'NO_DATA' :
    closed && !missing.length && sourceRows.every(row => row.status === 'CONFIRMED') ? 'CONFIRMED' : 'PARTIAL';
  return freeze({metric_id: definition.metric_id, period: {...period}, period_basis: range.period_basis,
    period_start: range.period_start, period_end: range.period_end, as_of: asOfValue, evaluated_at: asOf,
    value, ...extra, status, reasons: unique(reasons), unit: definition.unit, kind: definition.kind,
    months_included: included, months_missing: missing, months_not_started: notStarted, source_rows: sourceRows,
    definition_version: definition.definition_version, engine_version: PERIOD_ENGINE_VERSION});
}

function koreaInstant(value) {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
}
// Goal periods are stored on calendar months by the Goal Registry (goalRegistryBuildDraft).
function calendarGoalEnd(period) {
  const months = periodMonths(period);
  return metricPeriod(months.at(-1), 'calendar_month').period_end;
}

// Exact period-type match: a quarter period uses a quarter goal, an annual period an annual goal.
export function resolvePeriodGoal(goals, definition, period, {asOf, evaluationAt} = {}) {
  if (!validDate(asOf) || !koreaInstant(evaluationAt)) throw new TypeError('Invalid goal evaluation clock');
  if (!['quarter', 'annual'].includes(period?.type)) return freeze({status: 'NO_GOAL', target: null, reasons: ['GOAL_PERIOD_UNSUPPORTED']});
  const goalEnd = calendarGoalEnd(period), date = asOf < goalEnd ? asOf : goalEnd;
  const candidates = (Array.isArray(goals) ? goals : []).filter(goal => goal && goal.metric_id === definition.metric_id &&
    goal.year === period.year && goal.goal_type === period.type && (period.type === 'annual' || goal.quarter === period.quarter) &&
    ['active', 'superseded'].includes(goal.status) && validDate(goal.effective_from) &&
    (!goal.effective_to || validDate(goal.effective_to)) && goal.effective_from <= date &&
    (!goal.effective_to || goal.effective_to >= date) && koreaInstant(goal.created_at) &&
    Date.parse(goal.created_at) <= Date.parse(evaluationAt));
  if (!candidates.length) return freeze({status: 'NO_GOAL', target: null, reasons: ['NO_GOAL']});
  if (candidates.length !== 1) return freeze({status: 'CONFLICT', target: null, reasons: ['OVERLAPPING_GOALS']});
  const goal = candidates[0];
  if (!goal.goal_id || !Number.isInteger(goal.revision) || goal.revision < 1 || !finite(goal.value) || goal.value <= 0 ||
      goal.unit !== definition.unit || goal.semantics !== definition.goal_semantics || (definition.unit === '%' && goal.value > 100)) {
    return freeze({status: 'INVALID_TARGET', target: null, reasons: ['INVALID_TARGET']});
  }
  return freeze({status: 'RESOLVED', target: goal.value, goal_id: goal.goal_id, goal_revision: goal.revision,
    goal_type: goal.goal_type, semantics: goal.semantics, unit: goal.unit, reasons: []});
}

function interpret(definition, delta) {
  if (['goalDependent', 'neutral'].includes(definition.direction)) return 'unclassified';
  if (delta === 0) return 'on_target';
  const favorable = definition.direction === 'budget' ? delta < 0 : definition.direction === 'higherBetter' ? delta > 0 : delta < 0;
  return favorable ? 'favorable' : 'unfavorable';
}

export function goalProgress(periodMetric, goal, definition) {
  const output = {metric_id: definition.metric_id, period: periodMetric.period, goal_status: goal?.status ?? 'NO_GOAL',
    goal_id: null, goal_revision: null, semantics: definition.goal_semantics, target: null,
    actual: periodMetric.value, actual_status: periodMetric.status, gap: null, achievement_rate: null, usage_rate: null,
    remaining: null, delta_pp: null, budget_total: null, months_over_budget: [], pace: null,
    interpretation: 'unclassified', reasons: [...periodMetric.reasons], engine_version: PERIOD_ENGINE_VERSION};
  if (!goal || goal.status !== 'RESOLVED') { output.reasons.push(...(goal?.reasons?.length ? goal.reasons : ['NO_GOAL'])); return freeze({...output, reasons: unique(output.reasons)}); }
  if (goal.unit !== definition.unit || goal.semantics !== definition.goal_semantics || !finite(goal.target) || goal.target <= 0) {
    output.reasons.push('INVALID_TARGET'); return freeze({...output, reasons: unique(output.reasons)});
  }
  output.goal_id = goal.goal_id; output.goal_revision = goal.goal_revision; output.target = goal.target;
  const actual = periodMetric.value, target = goal.target;
  if (!finite(actual)) { output.reasons.push('NO_ACTUAL'); return freeze({...output, reasons: unique(output.reasons)}); }
  switch (definition.goal_semantics) {
    case 'point_target':
      output.gap = actual - target; output.remaining = target - actual;
      if (definition.direction === 'higherBetter') output.achievement_rate = actual / target * 100;
      output.interpretation = interpret(definition, output.gap);
      break;
    case 'cumulative_total': {
      output.gap = actual - target; output.achievement_rate = actual / target * 100;
      output.remaining = Math.max(0, target - actual);
      output.interpretation = interpret(definition, output.gap);
      // D-20261005-08: projected period-end total at the current pace (calendar days elapsed).
      const start = dayNumber(periodMetric.period_start), end = dayNumber(periodMetric.period_end);
      const now = Math.min(dayNumber(periodMetric.evaluated_at), end);
      const total = end - start + 1, elapsed = now - start + 1;
      if (elapsed > 0) {
        const ratio = Math.min(1, elapsed / total);
        output.pace = {elapsed_days: Math.min(elapsed, total), total_days: total, elapsed_ratio: ratio,
          projected: actual / ratio, projected_rate: actual / ratio / target * 100};
        if (periodMetric.months_missing.length) output.reasons.push('PACE_WITH_MISSING_MONTHS');
      }
      break;
    }
    case 'daily_average':
      output.gap = actual - target; output.achievement_rate = actual / target * 100;
      output.interpretation = interpret(definition, output.gap);
      break;
    case 'monthly_budget': {
      // D-20261005-07: the goal value is a monthly budget; the period budget is budget × counted months.
      const counted = periodMetric.source_rows.length;
      output.budget_total = target * counted;
      output.remaining = output.budget_total - actual;
      output.usage_rate = output.budget_total > 0 ? actual / output.budget_total * 100 : null;
      output.gap = actual - output.budget_total;
      output.months_over_budget = periodMetric.source_rows.filter(row => row.value > target).map(row => row.month);
      output.interpretation = interpret({...definition, direction: 'budget'}, output.gap);
      break;
    }
    case 'rate':
      output.gap = output.delta_pp = actual - target;
      output.interpretation = interpret(definition, output.gap);
      break;
    default:
      output.reasons.push('UNSUPPORTED_SEMANTICS');
  }
  return freeze({...output, reasons: unique(output.reasons)});
}

// D-20261005-07: suggested monthly budget = ledger monthly spending target (targetT) + 15%.
export function suggestMonthlyBudget(ledgerTarget, margin = BUDGET_MARGIN) {
  if (!finite(ledgerTarget) || ledgerTarget <= 0 || !finite(margin) || margin < 0 || margin > 1) throw new TypeError('Invalid budget input');
  return freeze({value: Math.round(ledgerTarget * (1 + margin)), base: ledgerTarget, margin, basis: 'ledger_targetT'});
}

// ---- D-20261005-10: additional metric definitions and source adapters ----
// Adapters follow the core SOURCE_ADAPTERS signature (rows, context) and return
// {value, sample_count, as_of}. Custom adapters receive unscoped rows and own their scope.
const common = {definition_version: 1, timezone: TIMEZONE, period_basis: 'calendar_month',
  coverage_policy: 'caller_verified_period_coverage_otherwise_partial', goal_support: ['annual', 'quarter']};
export const EXTRA_DEFINITIONS = freeze([
  {...common, metric_id: 'body_fat_percent', name: 'FAT', domain: 'Health', kind: 'point_in_time', aggregation: 'last_valid',
    quarter_aggregation: 'last_valid', annual_aggregation: 'last_valid', unit: '%', comparison: 'exact_previous_month',
    direction: 'goalDependent', source: 'body', adapter: 'body_fat', goal_semantics: 'point_target',
    description: 'Last valid observed body fat percentage within the calendar month',
    validation: 'valid_date_fat_between_0_and_100_daily_representative', zero_policy: 'zero_invalid', sample_basis: 'valid_observed_days'},
  {...common, metric_id: 'exercise_days_count', name: 'WORKOUT', domain: 'Activity', kind: 'cumulative', aggregation: 'sum',
    quarter_aggregation: 'sum', annual_aggregation: 'sum', unit: 'day', comparison: 'exact_previous_month',
    direction: 'higherBetter', source: 'exercise', adapter: 'exercise_days', goal_semantics: 'cumulative_total',
    description: 'Days with a workout: positive distance or strength checked. Step-only days are not counted',
    validation: 'valid_date_distance_positive_or_strength_true', zero_policy: 'zero_count_with_explicit_coverage', sample_basis: 'workout_days'},
  {...common, metric_id: 'media_watched_count', name: 'WATCH', domain: 'Culture', kind: 'cumulative', aggregation: 'sum',
    quarter_aggregation: 'sum', annual_aggregation: 'sum', unit: 'title', comparison: 'exact_previous_month',
    direction: 'higherBetter', source: 'movies', adapter: 'media_watched', goal_semantics: 'cumulative_total',
    description: 'Watched entries with a valid watched date; one saved entry counts once (same rule as the monthly report)',
    validation: 'status_watched_valid_watched_date', zero_policy: 'zero_count_with_explicit_coverage', sample_basis: 'watched_entries'}
]);

const stamp = row => { const value = Date.parse(row.updatedAt || row.createdAt || ''); return Number.isFinite(value) ? value : 0; };
function inPeriod(rows, context, dateOf) {
  return rows.flatMap(row => {
    if (!row || typeof row !== 'object') return [];
    const date = dateOf(row);
    if (date === undefined) return [];
    if (!validDate(date)) { context.reasons.push('INVALID_DATE'); return []; }
    return date >= context.period.period_start && date <= context.cutoff ? [{row, date}] : [];
  });
}
function latestPerDay(entries, context) {
  const days = new Map();
  for (const entry of entries) { if (!days.has(entry.date)) days.set(entry.date, []); days.get(entry.date).push(entry); }
  return [...days.keys()].sort().flatMap(date => {
    const list = days.get(date);
    if (list.length > 1) context.reasons.push('DUPLICATE_DAY_RESOLVED');
    const best = Math.max(...list.map(entry => stamp(entry.row)));
    const top = list.filter(entry => stamp(entry.row) === best);
    if (top.length > 1 && new Set(top.map(entry => JSON.stringify(entry.row))).size > 1) { context.reasons.push('AMBIGUOUS_DUPLICATE'); return []; }
    return [top[0]];
  });
}
const numeric = value => value === null || value === undefined || String(value).trim() === '' ? null :
  Number.isFinite(Number(value)) ? Number(value) : NaN;

export const EXTRA_ADAPTERS = freeze({
  body_fat(rows, context) {
    const entries = inPeriod(rows, context, row => row.date).filter(({row}) => {
      const fat = numeric(row.fat);
      if (fat === null) return false; // not measured that day
      if (Number.isNaN(fat) || fat <= 0 || fat > 100) { context.reasons.push('INVALID_BODY_FAT'); return false; }
      return true;
    });
    const days = latestPerDay(entries, context), last = days.at(-1);
    return {value: last ? Number(last.row.fat) : null, sample_count: days.length, as_of: last?.date ?? null};
  },
  exercise_days(rows, context) {
    const days = new Set();
    for (const {row, date} of inPeriod(rows, context, row => row.date)) {
      const distance = numeric(row.distance);
      if ((finite(distance) && distance > 0) || row.strength === true) days.add(date);
    }
    const sorted = [...days].sort();
    return {value: sorted.length, sample_count: sorted.length, as_of: sorted.at(-1) ?? null};
  },
  media_watched(rows, context) {
    const watched = rows.filter(row => row && row.status === 'watched');
    const entries = inPeriod(watched, context, row => row.watchedDate ?? '');
    const ids = new Map();
    for (const entry of entries) {
      const key = entry.row.id ? 'id:' + entry.row.id : 'row:' + JSON.stringify(entry.row);
      if (ids.has(key)) context.reasons.push('DUPLICATE_EVENT_RESOLVED');
      if (!ids.has(key) || stamp(entry.row) >= stamp(ids.get(key).row)) ids.set(key, entry);
    }
    const dates = [...ids.values()].map(entry => entry.date).sort();
    return {value: dates.length, sample_count: dates.length, as_of: dates.at(-1) ?? null};
  }
});
