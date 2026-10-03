// Batch C: source/session bridge. No operational source writes or Cloud mutations.
import {DEFAULT_REGISTRY, calculateMonth, compareMetric, resolveGoal, previousMonth, koreaDate} from './metrics-core.mjs';
import {createMetricsStore, prepareSnapshot} from './metrics-store.mjs';

export const DASHBOARD_SLOTS = Object.freeze([
  ['hasdaq', 'investment_total_krw', 'homeAsset', 'homeInvestRate'],
  ['ne100', 'body_weight_kg', 'homeWeight', 'homeWeightGoal'],
  ['hinaJones', 'books_completed_count', 'homeBooks', 'homeContentMeta'],
  ['harukei', 'steps_daily_average', 'homeExerciseSteps', 'homeExerciseAvg'],
  ['jispi', 'spending_jispi_krw', 'homeJispi', 'homeJispiMeta'],
  ['hinkei', 'quiz_accuracy_percent', 'homeHinkei', 'homeHinkeiMeta']
]);
const copy = value => structuredClone(value);
const signature = value => JSON.stringify(value);
export function createDashboardRuntime({verify, getBinding, getContext, getSource, canonical,
  getGoals = () => [], getCoverage = () => ({}), clock = () => new Date().toISOString(),
  storeFactory = createMetricsStore, onChange = () => {}}) {
  let epoch = 0, active = null, busy = false;
  const store = storeFactory({getBinding});
  function invalidate() {
    epoch++; active = null; store.invalidate(); onChange();
  }
  function live(token, binding) {
    return token === epoch && signature(getBinding()) === signature(binding);
  }
  function peek() {
    // Paint never verifies, calculates or writes. Context checks are O(1).
    if (active && (signature(getContext()) !== active.context || getSource() !== active.source ||
      koreaDate(clock()) !== active.asOf)) invalidate();
    return active ? copy(active.view) : {status: 'OWNER_BINDING_BLOCKED', metrics: [], cache: 'DISABLED'};
  }
  function auditSource() {
    // Called once at the existing full source-render boundary, not each visual paint.
    if (active && !getBinding()) invalidate();
  }
  async function refresh() {
    if (busy) return {status: 'BUSY'};
    if (active && getBinding() && signature(getContext()) === active.context && koreaDate(clock()) === active.asOf)
      return peek();
    busy = true; invalidate(); const token = epoch;
    try {
      const verification = await verify();
      if (token !== epoch) return {status: 'CONTEXT_CHANGED'};
      const binding = getBinding();
      if (verification.status !== 'VERIFIED' || !binding) return peek();
      const sourceRef = getSource(), context = signature(getContext()), now = clock(), asOf = koreaDate(now);
      const month = asOf.slice(0, 7), months = [previousMonth(month), month];
      const source = Object.fromEntries(DEFAULT_REGISTRY.map(def => [def.source, copy(sourceRef[def.source])]));
      const goals = copy(getGoals()), coverage = copy(getCoverage());
      let cached = {status: 'CACHE_MISS', rows: []}, cache = 'MEMORY_ONLY';
      try { await store.activate(binding); cached = await store.readActive(); } catch { /* safe memory fallback */ }
      if (!live(token, binding)) return {status: 'CONTEXT_CHANGED'};
      const sourceContexts = {};
      const rows = months.flatMap(m => {
        const sourceContext = Object.fromEntries(DEFAULT_REGISTRY.map(def => [def.source,
          {ready: Array.isArray(source[def.source]), complete: false, ...(coverage[m]?.[def.source] || {})}]));
        // No period-completeness provenance in operational books: absence is NOT a confirmed zero.
        if (!sourceContext.books.complete && !source.books?.some(row => row.status === 'read' &&
          String(row.readDate || row.completedDate || '').startsWith(m))) sourceContext.books.ready = false;
        sourceContexts[m] = sourceContext;
        return calculateMonth(source, {month: m, asOf, calculatedAt: now, canonical, sourceContext,
          previousRows: cached.rows || []});
      });
      // One coherent generation uses the conservative intersection of period coverage.
      const sourceContext = Object.fromEntries(DEFAULT_REGISTRY.map(def => [def.source, {
        ready: months.every(m => sourceContexts[m][def.source].ready),
        complete: months.every(m => sourceContexts[m][def.source].complete)
      }]));
      const prepared = await prepareSnapshot(source, {rows, months, asOf, createdAt: now, sourceContext,
        canonicalVersion: canonical.version, binding});
      if (!live(token, binding)) return {status: 'CONTEXT_CHANGED'};
      let consumedRows = rows;
      try {
        const current = await store.readActive(prepared);
        if (!live(token, binding)) return {status: 'CONTEXT_CHANGED'};
        if (current.status === 'READY') { cache = 'CACHE_HIT'; consumedRows = current.rows; }
        else {
          const published = await store.publish(prepared, {expectedGeneration: current.generation?.generation_id || null});
          cache = published.status === 'PUBLISHED' || published.status === 'UNCHANGED' ? published.status : 'MEMORY_ONLY';
        }
      } catch { /* IndexedDB unavailable must not break HANI */ }
      if (!live(token, binding) || signature(getContext()) !== context || getSource() !== sourceRef) return {status: 'CONTEXT_CHANGED'};
      const metrics = DEFAULT_REGISTRY.map(def => {
        const row = consumedRows.find(r => r.month === month && r.metric_id === def.metric_id);
        const baseline = consumedRows.find(r => r.month === months[0] && r.metric_id === def.metric_id);
        const goal = resolveGoal(goals, def, {month, asOf, evaluationAt: now});
        return {key: DASHBOARD_SLOTS.find(s => s[1] === def.metric_id)[0], row,
          comparison: compareMetric(row, baseline, def, goal), goal};
      });
      active = {context, source: sourceRef, asOf, view: {status: 'VERIFIED', metrics, cache, month, asOf}};
      onChange(); return peek();
    } catch {
      if (token === epoch) { active = null; onChange(); }
      return {status: 'OWNER_BINDING_BLOCKED', metrics: [], cache: 'DISABLED'};
    } finally { busy = false; }
  }
  return {refresh, invalidate, auditSource, peek};
}

export function dashboardText(metric) {
  if (!metric) return {value: '—', comparison: '원본 검증 대기', status: 'OWNER_BINDING_BLOCKED'};
  const {row, comparison: c} = metric;
  const number = value => Number(value).toLocaleString('ko-KR', {maximumFractionDigits: 2});
  const unit = {KRW: '원', kg: 'kg', book: '권', 'steps/day': '보', '%': '%'}[row.unit] || row.unit;
  const value = row.value === null ? '기록 없음' : number(row.value) + unit;
  const signed = value => (value > 0 ? '+' : '') + number(value);
  let comparison = 'Target not set';
  if (c.comparison_type === 'exact_previous_month') comparison = c.baseline ?
    `전월 ${number(c.baseline.value)}${unit} · ${signed(c.delta_absolute)}${unit}` +
    (c.delta_percent === null ? ' · 비율 비교 불가' : ` (${signed(c.delta_percent)}%)`) : '전월 데이터 없음';
  else if (c.target !== null) {
    if (c.comparison_type === 'target_budget') comparison = `예산 사용 ${number(c.usage_rate)}% · 잔여 ${number(c.remaining)}원`;
    else if (c.comparison_type === 'target_pp') comparison = `목표 ${number(c.target)}% · ${signed(c.delta_pp)}%p`;
    else comparison = `목표 ${number(c.target)}${unit} · ${number(c.achievement_rate)}%`;
  }
  else if(metric.goal.status === 'RESOLVED') comparison = `목표 ${number(metric.goal.target)}${unit} · 비교 데이터 없음`;
  const quality = row.reasons.includes('ZERO_STEPS_AMBIGUITY') ? ' · 0보 입력 구분 불가' : '';
  const observed = row.observed_days !== undefined ? ` · 관측 ${row.observed_days}일` : '';
  const period = row.period_basis === 'settlement_18_17' ? ` · ${row.period_start}~${row.period_end} (18→17)` : '';
  return {value, comparison, status: row.status,
    detail: `${row.status} · 기준 ${row.as_of || '미확인'}${observed}${quality}${period}`};
}
