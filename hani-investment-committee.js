/* Investment Research V1b. Persistence belongs exclusively to the existing commit owner. */
(function (root) {
  'use strict';
  const RATINGS = ['STRONG BUY', 'BUY', 'HOLD', 'REDUCE', 'EXIT'];
  const STATUSES = ['OWNED', 'WATCH', 'ARCHIVED'];
  const THESIS = ['VERY STRONG', 'STRONG', 'NORMAL', 'WEAK', 'BROKEN'];
  const RISKS = ['LOW', 'MEDIUM', 'HIGH', 'VERY HIGH'];
  const ACTIONS = ['ADD', 'ADD ON PULLBACK', 'HOLD', 'WAIT', 'REDUCE', 'EXIT', 'WATCH'];
  const FRAMEWORK = Object.freeze({id: 'hani-conviction-v1', dimensions: Object.freeze([
    {key: 'business', label: 'Business Quality', max: 25},
    {key: 'growth', label: 'Growth / Earnings', max: 20},
    {key: 'financial', label: 'Financial Strength', max: 15},
    {key: 'valuation', label: 'Valuation', max: 15},
    {key: 'fit', label: 'Portfolio Fit', max: 15},
    {key: 'risk', label: 'Risk Control', max: 10}
  ].map(Object.freeze))});
  const TRACKED = ['rating', 'fairValue', 'fairValueLow', 'fairValueHigh', 'convictionScore', 'thesisStrength', 'riskLevel', 'action'];
  const FIELDS = ['instrumentId', 'name', 'ticker', 'market', 'currency', 'status', 'rating',
    'fairValue', 'fairValueLow', 'fairValueHigh', 'valuationMethod', 'valuationNote', 'manualPrice',
    'conviction', 'thesisStrength', 'riskLevel', 'portfolioRoles', 'themes', 'thesis', 'bullCase',
    'risks', 'invalidation', 'nextCheckpoints', 'action', 'actionNote', 'conditions', 'executiveComment', 'lastReviewedAt'];
  const clone = v => JSON.parse(JSON.stringify(v));
  const text = v => String(v ?? '').trim();
  const number = v => v === null || v === undefined || text(v) === '' ? null : Number.isFinite(Number(v)) ? Number(v) : NaN;
  const ticker = v => text(v).normalize('NFKC').toUpperCase().replace(/^A(?=\d[A-Z0-9]{5}$)/, '');
  const nameKey = v => text(v).normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/[\s.\-()]/g, '');
  const marketKey = v => /^(KR|KOSPI|KOSDAQ|KR_ETC|한국|국내)$/.test(text(v).toUpperCase()) ? 'KR' : /^(US|NYSE|NASDAQ|AMEX|US_ETC|미국)$/.test(text(v).toUpperCase()) ? 'US' : text(v).toUpperCase();
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function string(v, label) {
    if (v !== undefined && v !== null && typeof v !== 'string') throw Error(label + ': 문자열이 필요합니다.');
    return text(v);
  }
  function enumValue(v, values, fallback, label) {
    if (v === undefined) return fallback;
    if (!values.includes(v)) throw Error(label + ': 허용되지 않은 값입니다.');
    return v;
  }
  function positive(v, label) {
    const n = number(v);
    if (n !== null && (!Number.isFinite(n) || n <= 0)) throw Error(label + ': 0보다 큰 숫자가 필요합니다.');
    return n;
  }
  function strings(v, label) {
    if (v === undefined) return [];
    if (!Array.isArray(v) || v.some(x => typeof x !== 'string')) throw Error(label + ': 문자열 배열이 필요합니다.');
    return v.map(text).filter(Boolean);
  }
  function conviction(value = {}, framework = FRAMEWORK) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Conviction 형식을 확인하세요.');
    const dims = value.dimensions === undefined ? framework.dimensions.map(d => ({...d, score: 0})) : value.dimensions;
    if (!Array.isArray(dims) || dims.length !== 6) throw Error('Conviction은 6개 항목이 필요합니다.');
    const seen = new Set();
    const dimensions = dims.map(d => {
      if (!d || typeof d !== 'object' || !text(d.key) || seen.has(d.key)) throw Error('Conviction 항목 key를 확인하세요.');
      seen.add(d.key);
      const max = Number(d.max), score = number(d.score) ?? 0;
      if (!Number.isFinite(max) || max <= 0 || !Number.isFinite(score) || score < 0 || score > max) throw Error('Conviction 점수는 항목의 0~최대값 사이여야 합니다.');
      return {key: text(d.key), label: string(d.label ?? framework.dimensions.find(x => x.key === d.key)?.label ?? d.key, '항목명'), max, score};
    });
    if (Math.abs(dimensions.reduce((s, d) => s + d.max, 0) - 100) > 0.000001) throw Error('Conviction 항목 최대점수 합계는 100이어야 합니다.');
    return {frameworkId: string(value.frameworkId ?? framework.id, 'frameworkId'), dimensions};
  }
  const convictionTotal = value => Math.round(conviction(value).dimensions.reduce((s, d) => s + d.score, 0) * 100) / 100;
  function normalizeCard(input = {}, previous = null, framework = FRAMEWORK) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('카드 객체가 필요합니다.');
    const v = {...(previous || {}), ...Object.fromEntries(FIELDS.filter(k => Object.hasOwn(input, k)).map(k => [k, input[k]]))};
    const out = {...(previous || {})}; // Preserve unknown pre-existing record fields; never normalize stored arrays on load.
    for (const k of ['instrumentId', 'name', 'ticker', 'market', 'currency', 'valuationMethod', 'valuationNote', 'bullCase', 'actionNote', 'executiveComment', 'lastReviewedAt']) out[k] = string(v[k], k);
    if (!out.name) throw Error('종목명을 입력하세요.');
    out.instrumentId = out.instrumentId || null; out.ticker = ticker(out.ticker); out.market = text(out.market).toUpperCase();
    out.currency = out.currency || (marketKey(out.market) === 'US' ? 'USD' : marketKey(out.market) === 'KR' ? 'KRW' : '');
    if (out.currency && !/^[A-Z]{3}$/.test(out.currency)) throw Error('통화는 KRW / USD 등 3자리 코드로 입력하세요.');
    out.status = enumValue(v.status, STATUSES, 'WATCH', 'status'); out.rating = enumValue(v.rating, RATINGS, 'HOLD', 'rating');
    out.thesisStrength = enumValue(v.thesisStrength, THESIS, 'NORMAL', 'thesisStrength'); out.riskLevel = enumValue(v.riskLevel, RISKS, 'MEDIUM', 'riskLevel');
    out.action = string(v.action ?? 'WATCH', 'action'); if (!out.action) throw Error('Action을 입력하세요.');
    for (const k of ['fairValue', 'fairValueLow', 'fairValueHigh']) out[k] = positive(v[k], k);
    if (out.fairValueLow !== null && out.fairValue !== null && out.fairValueLow > out.fairValue || out.fairValueHigh !== null && out.fairValue !== null && out.fairValue > out.fairValueHigh || out.fairValueLow !== null && out.fairValueHigh !== null && out.fairValueLow > out.fairValueHigh) throw Error('Fair Value는 Low ≤ Mid ≤ High 순서로 입력하세요.');
    out.conviction = conviction(v.conviction, framework);
    for (const k of ['themes', 'thesis', 'risks', 'invalidation', 'nextCheckpoints']) out[k] = strings(v[k], k);
    if (out.thesis.length < 3 || out.thesis.length > 5) throw Error('WHY WE OWN IT은 3~5개 논리를 한 줄씩 입력하세요.');
    const roles = v.portfolioRoles ?? {tags: [], note: ''}, conditions = v.conditions ?? {};
    if (!roles || typeof roles !== 'object' || Array.isArray(roles) || !conditions || typeof conditions !== 'object' || Array.isArray(conditions)) throw Error('역할 / 조건 형식을 확인하세요.');
    out.portfolioRoles = {tags: strings(roles.tags, 'portfolioRoles.tags'), note: string(roles.note, 'portfolioRoles.note')};
    out.conditions = Object.fromEntries(['add', 'reduce', 'exit'].map(k => [k, string(conditions[k], k + ' 조건')]));
    out.manualPrice = null;
    if (v.manualPrice !== null && v.manualPrice !== undefined) {
      if (typeof v.manualPrice !== 'object' || Array.isArray(v.manualPrice)) throw Error('수동 가격 형식을 확인하세요.');
      const value = positive(v.manualPrice.value, '수동 현재가'), currency = string(v.manualPrice.currency, '수동 가격 통화').toUpperCase(), asOf = string(v.manualPrice.asOf, '수동 가격 기준일');
      if (value === null || !/^[A-Z]{3}$/.test(currency) || !Number.isFinite(Date.parse(asOf))) throw Error('수동 현재가·통화·기준일을 모두 입력하세요.');
      out.manualPrice = {value, currency, asOf};
    }
    if (out.lastReviewedAt && !Number.isFinite(Date.parse(out.lastReviewedAt))) throw Error('마지막 검토일 형식을 확인하세요.');
    return out;
  }
  const trackedValue = (c, k) => !c ? null : k === 'convictionScore' ? convictionTotal(c.conviction) : c[k] ?? null;
  function diff(from, to) {
    const tracked = {}, fields = {};
    for (const k of TRACKED) { const a = trackedValue(from, k), b = trackedValue(to, k); if (!same(a, b)) tracked[k] = {from: a, to: b}; }
    for (const k of FIELDS.filter(k => !TRACKED.includes(k) && k !== 'lastReviewedAt')) {
      const a = from?.[k] ?? null, b = to?.[k] ?? null; if (!same(a, b)) fields[k] = {from: a, to: b};
    }
    return {tracked, fields};
  }
  function match(input, rows) {
    const unique = found => { if (found.length > 1) throw Error('동일 종목 후보가 여러 개입니다. instrumentId 또는 시장·티커를 확인하세요.'); return found[0] || null; };
    if (input.instrumentId) { const found = unique(rows.filter(c => c.instrumentId === input.instrumentId)); if (found) return found; }
    const code = ticker(input.ticker), market = marketKey(input.market);
    if (code && market) { const found = unique(rows.filter(c => ticker(c.ticker) === code && marketKey(c.market) === market)); if (found) return found; }
    return unique(rows.filter(c => nameKey(c.name) && nameKey(c.name) === nameKey(input.name) && (!code || !ticker(c.ticker) || code === ticker(c.ticker)) && (!market || !marketKey(c.market) || market === marketKey(c.market))));
  }
  function candidates(source, holdings = []) {
    const result = [];
    for (const [rows, category] of [[holdings.filter(h => Number(h.quantity ?? h.qty) > 0), '보유종목'], [source.instruments || [], '종목 마스터'], [source.investmentWatchlist || [], '관심종목']]) {
      for (const item of rows) {
        const master = (source.instruments || []).find(i => i.id === item.instrumentId);
        const row = {instrumentId: item.instrumentId || (category === '종목 마스터' ? item.id : null), name: item.name || master?.name || '', ticker: item.ticker || master?.ticker || '', market: item.market || master?.market || '', currency: item.currency || master?.currency || '', status: category === '보유종목' ? 'OWNED' : 'WATCH', category};
        if (!row.name) continue;
        const existing = match(row, result);
        if (existing) { if (row.status === 'OWNED') existing.status = 'OWNED'; continue; }
        result.push(row);
      }
    }
    return result;
  }
  function parseReport(raw) {
    if (typeof raw !== 'string' || raw.length > 1000000) throw Error('JSON 리포트는 1MB 이하 텍스트로 붙여넣으세요.');
    const fragments = [raw.trim(), ...Array.from(raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi), m => m[1])];
    const decode = fragment => {
      try {const parsed = JSON.parse(fragment), rows = Array.isArray(parsed) ? parsed : parsed?.cards; return Array.isArray(rows) && rows.length && rows.length <= 200 && rows.every(c => c && typeof c === 'object' && !Array.isArray(c)) ? rows : null;} catch (_) {return null;}
    };
    for (const fragment of fragments) {const rows = decode(fragment); if (rows) return rows;}
    let scanBudget = 2000000;
    // Balanced JSON scanner skips brackets inside strings and tolerates surrounding prose.
    for (let start = 0; start < raw.length; start++) {
      if (scanBudget <= 0) break;
      if (raw[start] !== '[' && raw[start] !== '{') continue;
      const stack = []; let quoted = false, escaped = false;
      for (let i = start; i < raw.length; i++) {
        if (--scanBudget <= 0) break;
        const c = raw[i];
        if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; continue; }
        if (c === '"') { quoted = true; continue; }
        if (c === '[' || c === '{') stack.push(c);
        else if (c === ']' || c === '}') { if (stack.pop() !== (c === ']' ? '[' : '{')) break; if (!stack.length) { const rows = decode(raw.slice(start, i + 1)); if (rows) return rows; start = i; break; } }
      }
    }
    throw Error('cards 배열 또는 JSON 배열을 찾지 못했습니다. 최대 200개 종목을 확인하세요.');
  }
  function reviewReport(rows, source, holdings = [], framework = FRAMEWORK) {
    const seen = [], options = candidates(source, holdings);
    return rows.map(input => {
      const existing = match(input, source.investmentResearchCards || []), candidate = !existing ? match(input, options) : null;
      const card = normalizeCard({...input, instrumentId: existing?.instrumentId || candidate?.instrumentId || input.instrumentId || null, status: existing ? input.status ?? existing.status : candidate?.status === 'OWNED' ? 'OWNED' : 'WATCH'}, existing, framework);
      if (match(card, seen)) throw Error('리포트에 동일 종목이 중복되어 있습니다. 한 종목당 하나만 남기세요.');
      seen.push(card);
      return {existingId: existing?.id || null, card, reason: string(input.changeReason, 'changeReason'), ...diff(existing, card)};
    });
  }
  function prepareBatch(source, items, {uid, now = new Date().toISOString(), framework = FRAMEWORK} = {}) {
    if (typeof uid !== 'function') throw Error('기존 UUID owner가 필요합니다.');
    const cards = clone(source.investmentResearchCards || []), history = clone(source.investmentResearchHistory || []), updated = [];
    for (const item of items) {
      const byId = item.existingId ? cards.find(c => c.id === item.existingId) : null;
      if (item.existingId && !byId) throw Error('카드가 변경되었습니다. 다시 열어 확인하세요.');
      const matched = match(item.card, cards);
      if (matched && matched.id !== byId?.id) throw Error('이미 Research가 있는 종목입니다. 기존 카드를 수정하세요.');
      const card = normalizeCard(item.card, byId, framework), changes = diff(byId, card).tracked;
      const revision = (Number(byId?.revision) || 0) + 1;
      Object.assign(card, {id: byId?.id || uid(), revision, createdAt: byId?.createdAt || now, updatedAt: now, lastReviewedAt: card.lastReviewedAt || now});
      if (Object.keys(changes).length) history.push({id: uid(), researchId: card.id, revision, changedAt: now, changes, reason: text(item.reason), fairValueChangeReason: Object.keys(changes).some(k => k.startsWith('fairValue')) ? text(item.reason) || null : null});
      if (byId) cards[cards.indexOf(byId)] = card; else cards.push(card);
      updated.push(card);
    }
    return {cards, history, updated};
  }
  function applyBatch(source, items, persist, options) {
    const prepared = prepareBatch(source, items, options), cardsBefore = source.investmentResearchCards, historyBefore = source.investmentResearchHistory;
    source.investmentResearchCards = prepared.cards; source.investmentResearchHistory = prepared.history;
    try { if (persist() !== true) throw Error('저장 검증에 실패해 Research 변경을 되돌렸습니다.'); }
    catch (e) { source.investmentResearchCards = cardsBefore; source.investmentResearchHistory = historyBefore; throw e; }
    return prepared.updated;
  }
  const previousRating = (card, history) => history.filter(h => h.researchId === card.id && h.changes?.rating).slice().sort((a, b) => String(a.changedAt).localeCompare(String(b.changedAt)) || (a.revision || 0) - (b.revision || 0)).at(-1)?.changes.rating.from ?? null;
  function currentPrice(card, source = {}) {
    const code = ticker(card.ticker), market = marketKey(card.market);
    const stock = (source.stocks || []).find(s => ticker(s.symbol) === code && marketKey(s.market) === market && s.currency === card.currency);
    const quote = stock ? (source.quotes || []).find(q => ticker(q.symbol) === code && q.currency === stock.currency) : null;
    if (quote && Number.isFinite(number(quote.lastPrice)) && number(quote.lastPrice) > 0) return {value: number(quote.lastPrice), currency: quote.currency, asOf: quote.timestamp || '', source: '기존 시세 캐시 · 마지막 확인 가격'};
    return card.manualPrice ? {...card.manualPrice, source: '수동 입력'} : null;
  }
  function valuation(card, price) {
    const percent = v => price && price.value > 0 && price.currency === card.currency && v !== null && v !== undefined ? (v / price.value - 1) * 100 : null;
    return {upside: percent(card.fairValue), downside: percent(card.fairValueLow), high: percent(card.fairValueHigh)};
  }
  // Dates remain ISO in storage; all research/committee presentation is explicitly KST.
  function dateValue(value) {
    const raw = text(value).replace(/^(\d{4})\.(\d{2})\.(\d{2})/, '$1-$2-$3');
    if (!raw) return null;
    const local = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2})(?::(\d{2}))?)?$/.exec(raw);
    const date = new Date(local ? local[1] + 'T' + (local[2] || '00:00') + ':' + (local[3] || '00') + '+09:00' : raw);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  function kst(value, style = 'date') {
    const date = dateValue(value);
    if (!date) return '시각 미확인';
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(date).map(p => [p.type, p.value]));
    const day = p.year + '.' + p.month + '.' + p.day, time = p.hour + ':' + p.minute;
    return style === 'month' ? p.year + '-' + p.month : style === 'price' ? p.month + '/' + p.day + ' ' + time : style === 'datetime' ? day + ' ' + time : day;
  }
  function inputDate(value, oldValue) {
    if (!text(value)) return '';
    if (oldValue && value === kst(oldValue, 'datetime')) return oldValue;
    const date = dateValue(value);
    if (!date) throw Error('날짜는 2026.10.11 또는 2026.10.11 10:00 (KST)로 입력하세요.');
    return date.toISOString();
  }
  const monthNow = (now = new Date()) => kst(now, 'month');
  const latestSnapshot = (source, month) => (source.investmentCommitteeSnapshots || []).filter(s => s.reviewMonth === month).slice().sort((a, b) => (b.revision || 1) - (a.revision || 1)).at(0) || null;
  function priorSnapshot(source, month) {
    const months = (source.investmentCommitteeSnapshots || []).map(s => s.reviewMonth).filter(m => m < month).sort();
    return latestSnapshot(source, months.at(-1));
  }
  function portfolioSummary(cards, holdingRows = []) {
    const groups = new Map(), roles = new Map();
    for (const card of cards.filter(c => ['OWNED', 'WATCH'].includes(c.status))) {
      for (const theme of new Set(card.themes?.length ? card.themes : ['테마 미지정'])) {
        if (!groups.has(theme)) groups.set(theme, []);
        groups.get(theme).push({researchId: card.id, name: card.name, ticker: card.ticker, status: card.status});
      }
      for (const role of new Set(card.portfolioRoles?.tags?.length ? card.portfolioRoles.tags : ['역할 미지정'])) {
        if (!roles.has(role)) roles.set(role, []);
        roles.get(role).push({researchId: card.id, name: card.name, status: card.status});
      }
    }
    const themes = [...groups].map(([theme, securities]) => {
      const owned = securities.filter(c => c.status === 'OWNED');
      const holdingCount = holdingRows.filter(h => owned.some(c => {
        const card = cards.find(x => x.id === c.researchId);
        return h.quantity > 0 && (card.instrumentId ? h.instrumentId === card.instrumentId : ticker(h.ticker) && ticker(h.ticker) === ticker(card.ticker) && marketKey(h.market) === marketKey(card.market));
      })).length;
      return {theme, securities, ownedCount: owned.length, holdingCount, overlap: theme !== '테마 미지정' && owned.length >= 3 ? 'HIGH' : null};
    });
    return {themes, roles: [...roles].map(([role, securities]) => ({role, securities})), overlapWarnings: themes.filter(t => t.overlap).map(t => ({theme: t.theme, level: t.overlap, ownedCount: t.ownedCount, holdingCount: t.holdingCount}))};
  }
  const COMMITTEE_LISTS = ['strengthened', 'weakened', 'newWatchlist', 'valuationAlerts', 'deepValue', 'actionPlan'];
  const thesisLabel = value => ({'VERY STRONG':'매우 강함',STRONG:'강함',NORMAL:'보통',WEAK:'약함',BROKEN:'훼손'})[value] || value;
  function committeeDraft(source, month = monthNow(), priceSource = {}, holdingRows = []) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw Error('위원회 기준월을 확인하세요.');
    const cards = (source.investmentResearchCards || []).filter(c => ['OWNED', 'WATCH'].includes(c.status));
    const previous = priorSnapshot(source, month), lastCards = previous?.securitySnapshots || [];
    const draft = {reviewMonth: month, portfolioRating: 'HOLD', marketView: '', executiveSummary: '', haniRecommendation: '', topConviction: cards.slice().sort((a, b) => convictionTotal(b.conviction) - convictionTotal(a.conviction)).slice(0, 3).map(c => c.name), portfolioSummary: portfolioSummary(cards, holdingRows)};
    COMMITTEE_LISTS.forEach(k => {draft[k] = [];});
    draft.executiveSummary = cards.map(c => c.name + ' · ' + c.rating + ' · ' + c.action).join('\n');
    draft.haniRecommendation = cards.filter(c => text(c.executiveComment)).map(c => c.name + ' · ' + c.executiveComment).join('\n');
    for (const card of cards) {
      const old = lastCards.find(c => c.id === card.id), value = valuation(card, currentPrice(card, priceSource));
      if (old) {
        const ratingDelta = RATINGS.indexOf(old.rating) - RATINGS.indexOf(card.rating), thesisDelta = THESIS.indexOf(old.thesisStrength) - THESIS.indexOf(card.thesisStrength);
        const change = card.name + ' · Rating ' + old.rating + ' → ' + card.rating + ' · 투자 논리 ' + thesisLabel(old.thesisStrength) + ' → ' + thesisLabel(card.thesisStrength);
        if (ratingDelta > 0 || thesisDelta > 0) draft.strengthened.push(change);
        if (ratingDelta < 0 || thesisDelta < 0) draft.weakened.push(change);
      }
      if (card.status === 'WATCH' && (!old || old.status !== 'WATCH')) draft.newWatchlist.push(card.name + ' · ' + card.rating);
      if (value.upside !== null && value.upside < 0) draft.valuationAlerts.push(card.name + ' · 현재가가 Fair Value를 초과');
      if (value.upside !== null && value.upside >= 30) draft.deepValue.push(card.name + ' · Fair Value 대비 상승 여력 ' + value.upside.toFixed(1) + '% (가치 차이 기준)');
      draft.actionPlan.push(card.name + ' · ' + card.action + (card.actionNote ? ' · ' + card.actionNote : ''));
    }
    return draft;
  }
  function prepareSnapshot(source, draft, {uid, now = new Date().toISOString(), revision = false, priceSource = {}, holdingRows = []} = {}) {
    if (!draft || !/^\d{4}-(0[1-9]|1[0-2])$/.test(draft.reviewMonth)) throw Error('위원회 기준월을 확인하세요.');
    if (typeof uid !== 'function' || !dateValue(now)) throw Error('스냅샷 ID / 확정 시각이 필요합니다.');
    const old = latestSnapshot(source, draft.reviewMonth);
    if (old && !revision) throw Error('이미 확정된 월입니다. 수정본 추가를 선택하세요.');
    if (!old && revision) throw Error('확정된 원본이 없어 수정본을 추가할 수 없습니다.');
    const result = {id: uid(), reviewMonth: draft.reviewMonth, revision: old ? (old.revision || 1) + 1 : 1, supersedesId: old?.id || null, confirmedAt: now};
    for (const k of ['portfolioRating', 'marketView', 'executiveSummary', 'haniRecommendation']) result[k] = string(draft[k], k);
    for (const k of COMMITTEE_LISTS) result[k] = strings(draft[k], k);
    const cards = (source.investmentResearchCards || []).filter(c => ['OWNED', 'WATCH'].includes(c.status));
    result.securitySnapshots = cards.map(card => {
      const price = currentPrice(card, priceSource), values = valuation(card, price);
      const refs = holdingRows.filter(h => card.instrumentId ? h.instrumentId === card.instrumentId : ticker(h.ticker) && ticker(h.ticker) === ticker(card.ticker) && marketKey(h.market) === marketKey(card.market));
      return {...clone(card), researchId: card.id, previousRating: previousRating(card, source.investmentResearchHistory || []), currentPrice: price ? clone(price) : null, convictionScore: convictionTotal(card.conviction), ...values, holdingsRefs: clone(refs)};
    });
    result.holdingsRefs = clone(holdingRows);
    result.portfolioSummary = portfolioSummary(result.securitySnapshots, result.holdingsRefs);
    result.topConviction = result.securitySnapshots.slice().sort((a, b) => b.convictionScore - a.convictionScore).slice(0, 3).map(c => ({researchId: c.id, name: c.name, convictionScore: c.convictionScore}));
    return clone(result);
  }
  function confirmCommittee(source, draft, persist, options) {
    const snapshot = prepareSnapshot(source, draft, options), before = source.investmentCommitteeSnapshots;
    source.investmentCommitteeSnapshots = [...(before || []), snapshot];
    try { if (persist() !== true) throw Error('저장 검증에 실패해 위원회 확정을 되돌렸습니다.'); }
    catch (e) {source.investmentCommitteeSnapshots = before; throw e;}
    return snapshot;
  }
  function ratingTimeline(card, source) {
    if (!card) return [];
    const changes = (source.investmentResearchHistory || []).filter(h => h.researchId === card.id).map(h => ({...h, kind: 'change', date: h.changedAt}));
    const points = (source.investmentCommitteeSnapshots || []).flatMap(s => (s.securitySnapshots || []).filter(c => c.id === card.id || c.researchId === card.id).map(c => ({kind: 'monthly', date: s.confirmedAt || s.reviewMonth + '-01', reviewMonth: s.reviewMonth, revision: s.revision || 1, rating: c.rating, fairValue: c.fairValue, currency: c.currency, convictionScore: c.convictionScore})));
    return [...changes, ...points].sort((a, b) => (dateValue(b.date)?.getTime() || 0) - (dateValue(a.date)?.getTime() || 0) || (b.revision || 0) - (a.revision || 0));
  }
  const OUTPUT_SCHEMA = {
    type: 'array', minItems: 1, maxItems: 200, items: {type: 'object', additionalProperties: false,
      required: [...FIELDS, 'changeReason'], properties: {
        instrumentId: {type: ['string', 'null']}, name: {type: 'string'}, ticker: {type: 'string'}, market: {type: 'string'}, currency: {type: 'string'}, status: {enum: STATUSES}, rating: {enum: RATINGS},
        ...Object.fromEntries(['fairValue', 'fairValueLow', 'fairValueHigh'].map(k => [k, {type: ['number', 'null'], exclusiveMinimum: 0}])),
        ...Object.fromEntries(['valuationMethod', 'valuationNote', 'bullCase', 'action', 'actionNote', 'executiveComment', 'lastReviewedAt', 'changeReason'].map(k => [k, {type: 'string'}])),
        manualPrice: {anyOf: [{type: 'null'}, {type: 'object', additionalProperties: false, required: ['value', 'currency', 'asOf'], properties: {value: {type: 'number', exclusiveMinimum: 0}, currency: {type: 'string'}, asOf: {type: 'string'}}}]},
        conviction: {type: 'object', additionalProperties: false, required: ['frameworkId', 'dimensions'], properties: {frameworkId: {type: 'string'}, dimensions: {type: 'array', minItems: 6, maxItems: 6, items: {type: 'object', additionalProperties: false, required: ['key', 'max', 'score'], properties: {key: {type: 'string'}, label: {type: 'string'}, max: {type: 'number', exclusiveMinimum: 0}, score: {type: 'number', minimum: 0}}}}}},
        thesisStrength: {enum: THESIS}, riskLevel: {enum: RISKS},
        portfolioRoles: {type: 'object', additionalProperties: false, required: ['tags', 'note'], properties: {tags: {type: 'array', items: {type: 'string'}}, note: {type: 'string'}}},
        ...Object.fromEntries(['themes', 'thesis', 'risks', 'invalidation', 'nextCheckpoints'].map(k => [k, {type: 'array', items: {type: 'string'}, ...(k === 'thesis' ? {minItems: 3, maxItems: 5} : {})}])),
        conditions: {type: 'object', additionalProperties: false, required: ['add', 'reduce', 'exit'], properties: Object.fromEntries(['add', 'reduce', 'exit'].map(k => [k, {type: 'string'}]))}
      }}
  };
  function buildPrompt(source, holdings = [], priceSource = {}, framework = FRAMEWORK) {
    const cards = (source.investmentResearchCards || []).filter(c => ['OWNED', 'WATCH'].includes(c.status));
    const withoutCards = candidates(source, holdings).filter(c => c.status === 'OWNED' && !match(c, source.investmentResearchCards || []));
    const data = {cards: cards.map(c => ({...Object.fromEntries(['id', ...FIELDS].map(k => [k, c[k] ?? null])), previousRating: previousRating(c, source.investmentResearchHistory || []), convictionScore: convictionTotal(c.conviction), currentPrice: currentPrice(c, priceSource)})), holdingsWithoutCards: withoutCards};
    return '성민 대표님의 Personal Investment Research OS를 검토하세요. 한국어로 판단 근거를 작성하세요.\n주가가 올랐다는 이유만으로 Fair Value를 변경하지 않는다. 모르는 가격·가치는 null로 두고 임의로 만들지 마세요. 현재가의 통화·기준일을 보존하세요. 기존 판단과 변경 이유(changeReason)를 함께 제시하세요.\n매매 실행이나 자동 저장은 없습니다. 대표님이 diff를 확인하고 선택 반영합니다. instrumentId·시장·티커를 그대로 유지하세요. WHY WE OWN IT은 3~5개, Conviction은 각 항목 0~max, max 합계 100입니다. lastReviewedAt은 검토일 ISO 날짜로 쓰세요.\n자료(JSON):\n' + JSON.stringify(data) + '\nConviction framework(JSON):\n' + JSON.stringify(framework) + '\nOUTPUT: 설명 없이 다음 정확한 JSON Schema에 맞는 카드 배열만 반환하세요.\n' + JSON.stringify(OUTPUT_SCHEMA);
  }
  const core = {RATINGS, STATUSES, THESIS, RISKS, ACTIONS, FRAMEWORK, TRACKED, FIELDS, OUTPUT_SCHEMA, conviction, convictionTotal, normalizeCard, diff, match, candidates, parseReport, reviewReport, prepareBatch, applyBatch, previousRating, currentPrice, valuation, buildPrompt, kst, inputDate, monthNow, latestSnapshot, priorSnapshot, portfolioSummary, COMMITTEE_LISTS, committeeDraft, prepareSnapshot, confirmCommittee, ratingTimeline};
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  root.HaniInvestmentResearchCore = core;
  if (!root.document) return;
  // Browser UI is mounted only into persistent panels prepared by setupInvestmentRc21Layout.
  const UI = root.HaniInvestmentCommitteeIds;
  const host = document.getElementById(UI.research);
  if (!host) return;
  let framework = FRAMEWORK, quoteSource = {}, quoteOwner = null, request = 0, editorCard = null, editorBaseline = '', importReview = [], importBaseline = '';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const accountIdentity = () => typeof cloudUser !== 'undefined' ? cloudUser?.id || null : null;
  const prices = () => quoteOwner === accountIdentity() ? quoteSource : {};
  const fingerprint = () => JSON.stringify([state.investmentResearchCards, state.investmentResearchHistory, state.instruments, state.investmentWatchlist, state.investmentBrokerSnapshots, state.transactions]);
  const holdings = () => root.HaniMarketData?.positions(state, typeof calculate === 'function' ? calculate().holdings : []) || [];
  const labels = {OWNED:'보유',WATCH:'관심',ARCHIVED:'보관', 'VERY STRONG':'매우 강함',STRONG:'강함',NORMAL:'보통',WEAK:'약함',BROKEN:'훼손',LOW:'낮음',MEDIUM:'보통',HIGH:'높음','VERY HIGH':'매우 높음',rating:'Rating',fairValue:'Fair Value',fairValueLow:'Fair Value 하단',fairValueHigh:'Fair Value 상단',convictionScore:'확신도',thesisStrength:'투자 논리 강도',riskLevel:'위험 수준',action:'Action',manualPrice:'수동 현재가',portfolioRoles:'포트폴리오 역할',themes:'테마',thesis:'투자 논리',bullCase:'상승 시나리오',risks:'위험 요인',invalidation:'논리 무효화 조건',nextCheckpoints:'다음 점검',executiveComment:'하니의 의견',valuationMethod:'가치평가 방법',valuationNote:'가치평가 메모',business:'사업의 질',growth:'성장과 이익',financial:'재무 건전성',valuation:'가치평가',fit:'포트폴리오 적합성',risk:'위험 관리'};
  const money = (v, currency) => v === null || v === undefined ? '미입력' : Number(v).toLocaleString('ko-KR', {maximumFractionDigits: 2}) + ' ' + (currency || '통화 미지정');
  const percent = v => v === null ? '미확인' : (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  const pill = rating => '<span class="ic-rating ic-rating-' + RATINGS.indexOf(rating) + '">' + esc(rating) + '</span>';
  function priceHtml(card) {
    const price = currentPrice(card, prices()), values = valuation(card, price);
    return '<p class="ic-price">현재가 ' + (price ? esc(money(price.value, price.currency)) + ' · 기준 ' + esc(kst(price.asOf, 'price')) + ' · ' + esc(price.source) : '미확인 · 상세에서 수동 가격 입력') + '</p><div class="ic-value"><span><small>Fair Value</small><b>' + esc(money(card.fairValue, card.currency)) + '</b><small>' + esc(money(card.fairValueLow, card.currency)) + ' ~ ' + esc(money(card.fairValueHigh, card.currency)) + '</small></span><span><small>현재가 대비 적정가 / 하단</small><b>' + percent(values.upside) + ' / ' + percent(values.downside) + '</b><small>상승 / 하락 여력 (하단)</small></span></div>';
  }
  host.innerHTML = '<div class="ic-header"><div><small>HANI INVESTMENT RESEARCH</small><h2>보유의 이유, 판단의 기록</h2><p>기업 가치와 투자 논리를 확인하고 다음 행동을 기록합니다.</p></div><div class="ic-tools"><button type="button" class="btn finance" data-ic="new">+ Research 작성</button><button type="button" class="btn" data-ic="copy">GPT용 자료 복사</button><button type="button" class="btn" data-ic="import">리포트 붙여넣기</button></div></div><p class="ic-notice" role="status" aria-live="polite"></p><label class="ic-filter">카드 상태 <select data-ic-status><option value="ACTIVE">보유 + 관심</option><option value="OWNED">보유</option><option value="WATCH">관심</option><option value="ARCHIVED">보관</option><option value="ALL">전체</option></select></label><button type="button" class="btn finance ic-continue" data-ic="monthly" hidden>이번 달 위원회로 이어서</button><div class="ic-list"></div><dialog class="ic-dialog ic-editor" aria-label="Research Card 상세"></dialog><dialog class="ic-dialog ic-import" aria-label="리포트 붙여넣기 및 검토"></dialog>';
  const editor = host.querySelector('.ic-editor'), importDialog = host.querySelector('.ic-import');
  const notice = message => {host.querySelector('.ic-notice').textContent = message;};
  function render() {
    const filter = host.querySelector('[data-ic-status]').value, all = state.investmentResearchCards || [];
    const cards = all.filter(c => filter === 'ALL' || (filter === 'ACTIVE' ? ['OWNED', 'WATCH'].includes(c.status) : c.status === filter));
    host.querySelector('.ic-list').innerHTML = cards.length ? cards.map(c => {
      const score = convictionTotal(c.conviction);
      return '<article class="ic-card"><div class="ic-card-head"><div><small>' + esc((labels[c.status] || c.status) + ' · ' + c.market + ' · ' + c.ticker) + '</small><h3>' + esc(c.name) + '</h3></div>' + pill(c.rating) + '</div>' + priceHtml(c) + '<div class="ic-conviction"><span>확신도 <b>' + score + '/100</b></span><progress max="100" value="' + score + '" aria-label="Conviction ' + score + '점"></progress></div><div class="ic-card-action"><b>' + esc(c.action) + '</b><button type="button" class="btn" data-ic="edit" data-research="' + esc(c.id) + '">상세 / 수정</button></div><small>마지막 검토 ' + esc(c.lastReviewedAt ? kst(c.lastReviewedAt) : '미검토') + '</small></article>';
    }).join('') : '<div class="ic-empty"><h3>' + (all.length ? '이 상태의 카드가 없습니다.' : 'HANI Investment Research를 시작해볼까요?') + '</h3><p>기존 보유종목·관심종목을 선택하거나 새 WATCH 종목을 작성할 수 있어요.</p><button type="button" class="btn finance" data-ic="new">+ 첫 Research 작성</button></div>';
    renderMonthly();
  }
  async function refreshPrices() {
    const owner = accountIdentity(), generation = ++request;
    try {
      const source = await root.HaniAssetMarket?.readResearchQuotes?.((state.investmentResearchCards || []).concat(candidates(state, holdings())));
      if (generation !== request || owner !== accountIdentity()) return;
      quoteSource = source || root.HaniAssetMarket?.analyticsSource?.() || {}; quoteOwner = owner; render();
    } catch (_) { if (generation === request) {quoteSource = {}; quoteOwner = owner; render();} }
  }
  const field = (key, label, value, type = 'text', extra = '') => '<label class="ic-field">' + esc(label) + '<input name="' + esc(key) + '" type="' + type + '" value="' + esc(value ?? '') + '" ' + extra + '></label>';
  const area = (key, label, value) => '<label class="ic-field">' + esc(label) + '<textarea name="' + esc(key) + '" rows="3">' + esc(Array.isArray(value) ? value.join('\n') : value || '') + '</textarea></label>';
  const select = (key, label, value, options) => '<label class="ic-field">' + esc(label) + '<select name="' + esc(key) + '">' + options.map(v => '<option value="' + esc(v) + '" ' + (v === value ? 'selected' : '') + '>' + esc(key === 'action' || key === 'rating' ? v : labels[v] || v) + '</option>').join('') + '</select></label>';
  const section = (label, content) => '<details class="ic-section"><summary>' + label + '</summary><div class="ic-section-content">' + content + '</div></details>';
  function timeline(card) {
    const rows = ratingTimeline(card, state);
    return '<h4>Rating History · 판단 변경 이력</h4><ol class="ic-timeline">' + (rows.map(h => '<li><time>' + esc(kst(h.date, 'datetime')) + ' KST</time>' + (h.kind === 'monthly' ? '<p>월간 위원회 ' + esc(h.reviewMonth.replace('-', '.')) + ' · 수정본 ' + h.revision + '</p><p>' + pill(h.rating) + ' · Fair Value ' + esc(money(h.fairValue, h.currency)) + ' · 확신도 ' + (h.convictionScore ?? '미확인') + '/100</p>' : '<ul>' + Object.entries(h.changes || {}).map(([k, v]) => '<li>' + esc(labels[k] || k) + ': ' + esc(labels[v.from] ?? v.from ?? '미입력') + ' → ' + esc(labels[v.to] ?? v.to ?? '미입력') + '</li>').join('') + '</ul><p>이유: ' + esc(h.reason || h.fairValueChangeReason || '입력 없음') + '</p>') + '</li>').join('') || '<li>아직 판단 변경 이력이 없습니다.</li>') + '</ol>';
  }
  function openEditor(card = null, candidate = null) {
    editorCard = card ? clone(card) : null; editorBaseline = fingerprint();
    const c = card || {...(candidate || {}), status: candidate?.status || 'WATCH', rating: 'HOLD', thesisStrength: 'NORMAL', riskLevel: 'MEDIUM', action: 'WATCH', conviction: conviction({}, framework), thesis: [], conditions: {}, portfolioRoles: {tags: [], note: ''}};
    const options = candidates(state, holdings());
    const picker = !card ? '<label class="ic-field">기존 보유종목 / 종목 / 관심종목 선택<select data-ic-picker><option value="">새 WATCH 종목 직접 입력</option>' + options.map((v, i) => '<option value="' + i + '">' + esc(v.category + ' · ' + v.name + ' · ' + v.ticker) + '</option>').join('') + '</select></label>' : '';
    editor.innerHTML = '<form><div class="ic-dialog-head"><h3>' + (card ? esc(card.name) + ' · Research' : '첫 Research 작성') + '</h3><button type="button" class="btn" data-ic="close">닫기</button></div>' + picker + '<div class="ic-form-grid">' + field('name', '종목명', c.name, 'text', 'required') + field('ticker', '티커 / 종목코드', c.ticker) + field('market', '시장 (KR / US 등)', c.market) + field('currency', '가치평가 통화', c.currency || (marketKey(c.market) === 'US' ? 'USD' : 'KRW')) + select('status', '카드 상태', c.status, STATUSES) + select('rating', 'Rating', c.rating, RATINGS) + '</div><p>직전 Rating: ' + esc(card ? previousRating(card, state.investmentResearchHistory || []) || '없음' : '없음') + '</p><div class="ic-rule">주가가 올랐다는 이유만으로 Fair Value를 변경하지 않는다.</div><div class="ic-form-grid">' + field('fairValueLow', 'Fair Value 하단', c.fairValueLow, 'number', 'min="0.000001" step="any"') + field('fairValue', 'Fair Value 적정가', c.fairValue, 'number', 'min="0.000001" step="any"') + field('fairValueHigh', 'Fair Value 상단', c.fairValueHigh, 'number', 'min="0.000001" step="any"') + '</div>' + field('reason', '판단 / Fair Value 변경 이유 (선택)', '') + '<div class="ic-form-grid">' + field('valuationMethod', '가치평가 방법', c.valuationMethod) + area('valuationNote', '가치평가 메모', c.valuationNote) + '</div><div class="ic-price-preview">' + priceHtml(c) + '</div>' + section('현재가 · 캐시가 없으면 수동 입력', '<p>기존 시세 캐시가 우선입니다. 수동 현재가는 이 카드에만 기록합니다.</p><div class="ic-form-grid">' + field('manualValue', '수동 현재가', c.manualPrice?.value, 'number', 'min="0.000001" step="any"') + field('manualCurrency', '가격 통화', c.manualPrice?.currency || c.currency || 'KRW') + field('manualAsOf', '가격 기준일 / 시각', c.manualPrice?.asOf ? kst(c.manualPrice.asOf, 'datetime') : '', 'text', 'placeholder="2026.10.11 10:00 (KST)"') + '</div>') + '<h4>확신도 평가</h4><div class="ic-form-grid">' + c.conviction.dimensions.map((d, i) => field('score' + i, (labels[d.key] || d.label) + ' / ' + d.max, d.score, 'number', 'min="0" max="' + d.max + '" step="any" data-ic-score')).join('') + '</div><div class="ic-conviction"><b data-ic-total>' + convictionTotal(c.conviction) + '/100</b><progress data-ic-progress max="100" value="' + convictionTotal(c.conviction) + '"></progress></div><div class="ic-form-grid">' + select('thesisStrength', '투자 논리 강도', c.thesisStrength, THESIS) + select('riskLevel', '위험 수준', c.riskLevel, RISKS) + '</div>' + section('포트폴리오 역할 · 테마', area('roleTags', '역할 태그 (한 줄에 하나)', c.portfolioRoles?.tags) + area('roleNote', '역할 메모', c.portfolioRoles?.note) + area('themes', '테마 태그 (한 줄에 하나)', c.themes)) + section('WHY WE OWN IT · 투자 논리와 점검', area('thesis', 'WHY WE OWN IT (3~5개, 한 줄에 하나)', c.thesis) + area('bullCase', '상승 시나리오', c.bullCase) + area('risks', '위험 요인 (한 줄에 하나)', c.risks) + area('invalidation', '논리 무효화 조건 (한 줄에 하나)', c.invalidation) + area('nextCheckpoints', '다음 점검 (한 줄에 하나)', c.nextCheckpoints)) + section('Action · 매수 / 축소 / 청산 조건', select('action', 'Action', ACTIONS.includes(c.action) ? c.action : 'CUSTOM', [...ACTIONS, 'CUSTOM']) + field('customAction', '직접 입력 Action', ACTIONS.includes(c.action) ? '' : c.action) + area('actionNote', '행동 메모', c.actionNote) + area('add', '추가 매수 조건', c.conditions?.add) + area('reduce', '축소 조건', c.conditions?.reduce) + area('exit', '청산 조건', c.conditions?.exit)) + section('HANI COMMENT · 마지막 검토', '<div class="ic-hani"><img src="./assets/profiles/hani-profile-hani.webp" alt="하니"><span><b>HANI COMMENT</b><small>최고 투자 전략가</small></span></div>' + area('executiveComment', 'HANI COMMENT', c.executiveComment) + field('lastReviewedAt', '마지막 검토일 (KST)', kst(c.lastReviewedAt || new Date(), 'datetime'))) + section('Rating History · 판단 변경 이력', timeline(card)) + '<p class="ic-error" role="alert"></p><div class="ic-footer"><button type="button" class="btn" data-ic="close">취소</button><button type="submit" class="btn finance">Research 저장</button></div></form>';
    editor.dataset.instrument = c.instrumentId || ''; editor._conviction = clone(c.conviction); editor._options = options;
    if (candidate) editor.querySelector('[data-ic-picker]').value = String(options.indexOf(match(candidate, options)));
    if (!editor.open) editor.showModal();
  }
  function readEditor() {
    const data = new FormData(editor.querySelector('form')), get = k => data.get(k), lines = k => text(get(k)).split('\n').map(text).filter(Boolean);
    const draft = {...(editorCard || {}), ...Object.fromEntries(['name', 'ticker', 'market', 'currency', 'status', 'rating', 'valuationMethod', 'valuationNote', 'thesisStrength', 'riskLevel', 'bullCase', 'actionNote', 'executiveComment', 'lastReviewedAt'].map(k => [k, get(k)])), instrumentId: editor.dataset.instrument || null,
      ...Object.fromEntries(['fairValue', 'fairValueLow', 'fairValueHigh'].map(k => [k, get(k)])),
      conviction: {...editor._conviction, dimensions: editor._conviction.dimensions.map((d, i) => ({...d, score: get('score' + i)}))},
      portfolioRoles: {tags: lines('roleTags'), note: get('roleNote')}, themes: lines('themes'), thesis: lines('thesis'), risks: lines('risks'), invalidation: lines('invalidation'), nextCheckpoints: lines('nextCheckpoints'),
      action: get('action') === 'CUSTOM' ? get('customAction') : get('action'), conditions: {add: get('add'), reduce: get('reduce'), exit: get('exit')},
      manualPrice: text(get('manualValue')) ? {value: get('manualValue'), currency: get('manualCurrency'), asOf: get('manualAsOf')} : null};
    draft.lastReviewedAt = inputDate(get('lastReviewedAt'), editorCard?.lastReviewedAt);
    if (draft.manualPrice) draft.manualPrice.asOf = inputDate(get('manualAsOf'), editorCard?.manualPrice?.asOf);
    return {existingId: editorCard?.id || null, card: normalizeCard(draft, editorCard, framework), reason: get('reason')};
  }
  editor.addEventListener('submit', event => {
    event.preventDefault();
    try {
      if (editorBaseline !== fingerprint()) throw Error('편집 중 원본이 변경되었습니다. 닫고 다시 확인하세요.');
      const item = readEditor(); applyBatch(state, [item], () => commit('Research를 저장했습니다.'), {uid, framework});
      editor.close(); render(); refreshPrices();
    } catch (e) {editor.querySelector('.ic-error').textContent = e.message; render();}
  });
  editor.addEventListener('input', event => {
    if (!event.target.matches('[data-ic-score]')) return;
    const sum = [...editor.querySelectorAll('[data-ic-score]')].reduce((s, el) => s + (Number(el.value) || 0), 0);
    editor.querySelector('[data-ic-total]').textContent = sum + '/100'; editor.querySelector('[data-ic-progress]').value = sum;
  });
  editor.addEventListener('change', event => {
    if (event.target.matches('[data-ic-picker]')) {
      const c = event.target.value === '' ? null : editor._options[Number(event.target.value)]; openEditor(null, c);
    }
  });
  async function copyPrompt() {
    const prompt = buildPrompt(state, holdings(), prices(), framework);
    try { if (!navigator.clipboard?.writeText) throw Error('clipboard unavailable'); await navigator.clipboard.writeText(prompt); }
    catch (_) {
      const textarea = document.createElement('textarea'); textarea.value = prompt; textarea.className = 'ic-clipboard'; host.append(textarea); textarea.select();
      try {if (!document.execCommand('copy')) throw Error('클립보드 복사 권한을 확인하세요.');} finally {textarea.remove();}
    }
    notice('GPT용 한국어 자료와 OUTPUT JSON Schema를 복사했습니다.');
  }
  function openImport() {
    importReview = []; importBaseline = '';
    importDialog.innerHTML = '<div class="ic-dialog-head"><h3>리포트 붙여넣기</h3><button type="button" class="btn" data-ic="close">닫기</button></div><p>GPT JSON을 붙여넣고 종목별 변경 내용을 확인하세요. 선택 반영 전에는 저장하지 않습니다.</p><label class="ic-field">GPT 리포트<textarea data-ic-report rows="10" placeholder="```json 또는 JSON 배열"></textarea></label><button type="button" class="btn finance" data-ic="parse">변경 검토</button><p class="ic-error" role="alert"></p><div class="ic-review"></div>';
    importDialog.showModal();
  }
  const displayValue = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(v) ? kst(v, 'datetime') + ' KST' : Array.isArray(v) ? v.map(displayValue) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, displayValue(x)])) : v;
  const valueText = v => v === null || v === undefined ? '미입력' : typeof v === 'object' ? JSON.stringify(displayValue(v)) : String(displayValue(v));
  function renderReview() {
    importDialog.querySelector('.ic-review').innerHTML = '<h4>선택할 종목과 변경 이유를 확인하세요.</h4>' + importReview.map((item, i) => '<article class="ic-review-item"><label><input type="checkbox" data-ic-include="' + i + '" checked> ' + esc(item.card.name) + ' · ' + (item.existingId ? '기존 카드' : '새 카드 · ' + esc(labels[item.card.status] || item.card.status)) + '</label><div class="ic-diffs">' + (Object.entries(item.tracked).map(([k, d]) => '<p><b>' + esc(labels[k] || k) + '</b> ' + esc(valueText(d.from)) + ' → ' + esc(valueText(d.to)) + '</p>').join('') || '<p>추적 판단 변경 없음 · History 추가 없음</p>') + '</div><p>이유: ' + esc(item.reason || '입력 없음 (선택 사항)') + '</p><details class="ic-section"><summary>새 내용 / 변경된 텍스트와 기타 필드 ' + Object.keys(item.fields).length + '개</summary><div class="ic-section-content">' + Object.entries(item.fields).map(([k, d]) => '<p><b>' + esc(labels[k] || k) + '</b><br>' + esc(valueText(d.from)) + ' → ' + esc(valueText(d.to)) + '</p>').join('') + '</div></details></article>').join('') + '<button type="button" class="btn finance" data-ic="apply">선택 반영</button>';
  }
  const monthlyHost = document.getElementById(UI.monthly);
  let selectedMonth = monthNow(), monthlyDraft = null, draftBaseline = '', revisionDraft = false, viewedRevision = null, monthlyOwner = accountIdentity();
  const monthLabel = month => month.replace('-', '.');
  const committeeTitle = month => 'HANI GROUP · INVESTMENT COMMITTEE · ' + month.slice(0, 4) + ' ' + ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'][Number(month.slice(5)) - 1];
  const draftFingerprint = () => JSON.stringify([accountIdentity(), fingerprint(), state.investmentCommitteeSnapshots, holdings()]);
  const haniHeading = label => '<div class="ic-hani"><img src="./assets/profiles/hani-profile-hani.webp" alt="하니"><span><b>' + label + '</b><small>최고 투자 전략가 · 하니</small></span></div>';
  const listLabels = {strengthened: '투자 논리 강화', weakened: '투자 논리 약화', newWatchlist: '관심 종목', valuationAlerts: '가치평가 주의', deepValue: '저평가 후보', actionPlan: '실행 계획'};
  function summaryHtml(summary) {
    if (!summary?.themes?.length) return '<p>작성된 보유·관심 카드가 없습니다. 먼저 종목 리서치를 작성해 주세요.</p>';
    return '<div class="ic-theme-list">' + summary.themes.map(t => '<article class="ic-theme"><h4>' + esc(t.theme) + '</h4><p>' + t.securities.map(c => esc(c.name) + ' <small>' + esc(labels[c.status] || c.status) + '</small>').join(' · ') + '</p></article>').join('') + '</div><details class="ic-section"><summary>포트폴리오 역할별 보기</summary><div class="ic-section-content">' + (summary.roles || []).map(r => '<p><b>' + esc(r.role) + '</b> · ' + r.securities.map(c => esc(c.name)).join(' · ') + '</p>').join('') + '</div></details>' + (summary.overlapWarnings?.length ? '<aside class="ic-overlap"><h4>Overlap Warning · 테마 중복 주의</h4>' + summary.overlapWarnings.map(w => '<p>' + esc(w.theme) + ' · HIGH · 보유 카드 ' + w.ownedCount + '개' + (w.holdingCount ? ' · 연결 보유 기록 ' + w.holdingCount + '개' : '') + '</p>').join('') + '<small>OWNED 카드 수 기준이며, 포트폴리오 금액 비중을 추정하지 않습니다.</small></aside>' : '<p class="ic-muted">테마 중복 경고 없음 · 동일 테마 보유 카드 3개 이상일 때 표시합니다.</p>');
  }
  function frozenRows(snapshot) {
    return '<div class="ic-snapshot-securities">' + (snapshot.securitySnapshots || []).map(c => {
      const p = c.currentPrice;
      return '<article class="ic-snapshot-security"><div class="ic-card-head"><h4>' + esc(c.name) + '</h4>' + pill(c.rating) + '</div><p><b>Fair Value ' + esc(money(c.fairValue, c.currency)) + '</b> · 확신도 ' + (c.convictionScore ?? '미확인') + '/100 · ' + esc(c.action) + '</p><p class="ic-price">' + (p ? '현재가 ' + esc(money(p.value, p.currency)) + ' · 기준 ' + esc(kst(p.asOf, 'price')) + ' · ' + esc(p.source) : '현재가 미확인') + '</p><p>직전 Rating ' + esc(c.previousRating || '없음') + ' · 상승 / 하락 여력 ' + percent(c.upside ?? null) + ' / ' + percent(c.downside ?? null) + '</p><button type="button" class="btn" data-monthly="history" data-research="' + esc(c.researchId || c.id) + '">종목 상세 · Rating History</button></article>';
    }).join('') + '</div>';
  }
  function renderMonthly() {
    if (!monthlyHost) return;
    if (monthlyOwner !== accountIdentity()) {monthlyDraft = null; viewedRevision = null; selectedMonth = monthNow(); monthlyOwner = accountIdentity();}
    const snapshots = state.investmentCommitteeSnapshots || [], months = [...new Set([monthNow(), ...snapshots.map(s => s.reviewMonth), ...(monthlyDraft ? [monthlyDraft.reviewMonth] : [])])].sort().reverse();
    const latest = latestSnapshot(state, selectedMonth), snapshot = viewedRevision ? snapshots.find(s => s.id === viewedRevision && s.reviewMonth === selectedMonth) || latest : latest;
    monthlyHost.querySelector('.ic-months').innerHTML = months.map(m => '<button type="button" class="btn" data-monthly="month" data-month="' + esc(m) + '" aria-pressed="' + (m === selectedMonth) + '">' + esc(monthLabel(m)) + '</button>').join('');
    const start = monthlyHost.querySelector('[data-monthly=start]'); start.hidden = !!latestSnapshot(state, monthNow());
    const board = monthlyHost.querySelector('.ic-monthly-board');
    if (monthlyDraft && monthlyDraft.reviewMonth === selectedMonth) {
      // Update only summaries when a price response arrives; preserve focused inputs and memory draft.
      if (board.querySelector('form')?.dataset.month === selectedMonth && board.dataset.draftRevision === String(revisionDraft)) return;
      board.dataset.draftRevision = String(revisionDraft);
      board.innerHTML = '<form data-month="' + esc(selectedMonth) + '"><div class="ic-executive"><small>' + esc(committeeTitle(selectedMonth)) + '</small><h2>Executive Summary</h2><p>' + (revisionDraft ? '수정본 초안 · 확정하면 새 수정본이 추가되고 이전 기록은 보존됩니다. 종목 값은 현재 카드 기준입니다.' : '이번 달 투자위원회 초안 · 확정 전에는 저장하지 않습니다.') + '</p></div><div class="ic-form-grid">' + field('portfolioRating', '포트폴리오 판단 (직접 입력 가능)', monthlyDraft.portfolioRating) + select('ratingPreset', '판단 프리셋', '직접 입력', ['직접 입력', 'HOLD', 'SELECTIVE BUY', 'BUY', 'REDUCE', 'DEFENSIVE']) + '</div>' + area('marketView', '시장 관점', monthlyDraft.marketView) + area('executiveSummary', '핵심 요약', monthlyDraft.executiveSummary) + '<blockquote class="ic-recommendation">' + haniHeading('HANI RECOMMENDATION') + area('haniRecommendation', '하니의 제안', monthlyDraft.haniRecommendation) + '</blockquote><details class="ic-section" open><summary>이번 달 판단과 실행 계획</summary><div class="ic-section-content"><p>이전 월 최신 확정본 대비 제안입니다. 가격 관련 후보는 입력된 가격과 Fair Value로만 계산하며, 모든 목록을 편집할 수 있습니다.</p><div class="ic-form-grid">' + COMMITTEE_LISTS.map(k => area(k, listLabels[k] + ' (한 줄에 하나)', monthlyDraft[k])).join('') + '</div></div></details><h3>Portfolio Research Summary · 포트폴리오 리서치</h3>' + summaryHtml(monthlyDraft.portfolioSummary) + '<p class="ic-error" role="alert"></p><div class="ic-footer"><button type="button" class="btn" data-monthly="cancel">초안 취소</button><button type="submit" class="btn finance">이번 달 위원회 확정</button></div></form>';
      return;
    }
    board.dataset.draftRevision = '';
    if (!snapshot) {board.innerHTML = '<div class="ic-empty"><h3>' + esc(monthLabel(selectedMonth)) + ' 월간 위원회</h3><p>이번 달 보유의 이유와 다음 행동을 함께 정리해볼까요?</p></div>'; return;}
    const previous = snapshots.filter(s => s.reviewMonth === selectedMonth && s.id !== latest.id).sort((a, b) => (b.revision || 1) - (a.revision || 1));
    board.innerHTML = '<div class="ic-executive"><small>' + esc(committeeTitle(selectedMonth)) + '</small><h2>Executive Summary</h2><p>확정본 · 수정본 ' + (snapshot.revision || 1) + ' · ' + esc(kst(snapshot.confirmedAt, 'datetime')) + ' KST</p><b>' + esc(snapshot.portfolioRating || '미입력') + '</b></div><p class="ic-frozen-note">확정 당시 값을 보관한 읽기 전용 기록입니다.</p><div class="ic-tools"><button type="button" class="btn" data-monthly="revise">수정본 추가</button>' + (snapshot.id !== latest.id ? '<button type="button" class="btn" data-monthly="latest">최신 수정본 보기</button>' : '') + '</div>' + (previous.length ? '<details class="ic-section"><summary>이전 수정본 ' + previous.length + '개</summary><div class="ic-section-content">' + previous.map(s => '<button type="button" class="btn" data-monthly="revision" data-snapshot="' + esc(s.id) + '">수정본 ' + (s.revision || 1) + ' · ' + esc(kst(s.confirmedAt)) + '</button>').join('') + '</div></details>' : '') + '<h3>시장 관점</h3><p class="ic-prose">' + esc(snapshot.marketView || '입력 없음') + '</p><h3>핵심 요약</h3><p class="ic-prose">' + esc(snapshot.executiveSummary || '입력 없음') + '</p><blockquote class="ic-recommendation">' + haniHeading('HANI RECOMMENDATION') + '<p class="ic-prose">' + esc(snapshot.haniRecommendation || '입력 없음') + '</p></blockquote><div class="ic-form-grid">' + COMMITTEE_LISTS.map(k => '<section class="ic-monthly-list"><h3>' + listLabels[k] + '</h3><ul>' + ((snapshot[k] || []).map(v => '<li>' + esc(v) + '</li>').join('') || '<li>해당 항목 없음</li>') + '</ul></section>').join('') + '</div><h3>확신도 상위 종목</h3><p>' + (snapshot.topConviction || []).map(c => esc(typeof c === 'string' ? c : c.name + ' · ' + c.convictionScore + '/100')).join(' · ') + '</p><h3>Portfolio Research Summary · 포트폴리오 리서치</h3>' + summaryHtml(snapshot.portfolioSummary) + '<h3>확정 당시 종목 판단</h3>' + frozenRows(snapshot);
  }
  function startCommittee(revision = false) {
    const month = revision ? selectedMonth : monthNow(), old = latestSnapshot(state, month);
    if (old && !revision) {selectedMonth = month; viewedRevision = null; monthlyDraft = null; renderMonthly(); return;}
    if (monthlyDraft) {selectedMonth = monthlyDraft.reviewMonth; renderMonthly(); return;}
    monthlyDraft = committeeDraft(state, month, prices(), holdings());
    if (revision && old) for (const k of ['portfolioRating', 'marketView', 'executiveSummary', 'haniRecommendation', ...COMMITTEE_LISTS]) monthlyDraft[k] = clone(old[k] ?? (COMMITTEE_LISTS.includes(k) ? [] : ''));
    revisionDraft = revision; selectedMonth = month; viewedRevision = null; draftBaseline = draftFingerprint();
    monthlyHost.querySelector('.ic-monthly-board').innerHTML = ''; renderMonthly();
  }
  function continueCommittee() {
    selectInvestmentSection(UI.monthly); startCommittee(); monthlyHost.scrollIntoView({block: 'start'});
  }
  if (monthlyHost) {
    monthlyHost.innerHTML = '<div class="ic-header"><div><small>HANI MONTHLY INVESTMENT COMMITTEE</small><h2>월간 위원회</h2><p>월별로 투자 판단을 확정하고 당시의 근거를 보관합니다.</p></div><button type="button" class="btn finance" data-monthly="start">이번 달 위원회 시작</button></div><nav class="ic-months" aria-label="위원회 기준월"></nav><p class="ic-monthly-notice" role="status" aria-live="polite"></p><div class="ic-monthly-board"></div>';
    monthlyHost.addEventListener('input', event => {
      if (!monthlyDraft || !event.target.name || !(event.target.name in monthlyDraft)) return;
      monthlyDraft[event.target.name] = COMMITTEE_LISTS.includes(event.target.name) ? event.target.value.split('\n').map(text).filter(Boolean) : event.target.value;
    });
    monthlyHost.addEventListener('change', event => {
      if (event.target.name !== 'ratingPreset' || event.target.value === '직접 입력' || !monthlyDraft) return;
      monthlyDraft.portfolioRating = event.target.value; monthlyHost.querySelector('[name=portfolioRating]').value = event.target.value;
    });
    monthlyHost.addEventListener('click', event => {
      const button = event.target.closest('[data-monthly]'); if (!button) return;
      switch (button.dataset.monthly) {
        case 'start': startCommittee(); break;
        case 'month': selectedMonth = button.dataset.month; viewedRevision = null; renderMonthly(); break;
        case 'revise': startCommittee(true); break;
        case 'cancel': monthlyDraft = null; revisionDraft = false; renderMonthly(); break;
        case 'revision': viewedRevision = button.dataset.snapshot; renderMonthly(); break;
        case 'latest': viewedRevision = null; renderMonthly(); break;
        case 'history': {
          const card = (state.investmentResearchCards || []).find(c => c.id === button.dataset.research);
          if (!card) {monthlyHost.querySelector('.ic-monthly-notice').textContent = '현재 카드가 없습니다. 이 월의 확정된 종목 값은 보존되어 있습니다.'; break;}
          selectInvestmentSection(UI.research); openEditor(card); const section = editor.querySelector('.ic-timeline')?.closest('details'); if (section) {section.open = true; section.scrollIntoView({block: 'nearest'});} break;
        }
      }
    });
    monthlyHost.addEventListener('submit', event => {
      event.preventDefault(); if (!monthlyDraft) return;
      try {
        if (draftBaseline !== draftFingerprint()) throw Error('초안 작성 중 원본이 변경되었습니다. 초안을 취소한 뒤 다시 시작해 주세요.');
        const snapshot = confirmCommittee(state, monthlyDraft, () => commit('월간 위원회를 확정했습니다.'), {uid, revision: revisionDraft, priceSource: prices(), holdingRows: holdings()});
        monthlyDraft = null; revisionDraft = false; selectedMonth = snapshot.reviewMonth; viewedRevision = null; render();
      } catch (e) {monthlyHost.querySelector('.ic-error').textContent = e.message;}
    });
    renderMonthly();
  }
  host.addEventListener('click', async event => {
    const button = event.target.closest('[data-ic]'); if (!button) return;
    try {
      switch (button.dataset.ic) {
        case 'monthly': continueCommittee(); break;
        case 'new': openEditor(); break;
        case 'edit': {const card = (state.investmentResearchCards || []).find(c => c.id === button.dataset.research); if (card) openEditor(card); break;}
        case 'close': button.closest('dialog')?.close(); break;
        case 'copy': await copyPrompt(); break;
        case 'import': openImport(); break;
        case 'parse':
          importReview = reviewReport(parseReport(importDialog.querySelector('[data-ic-report]').value), state, holdings(), framework);
          importBaseline = fingerprint(); importDialog.querySelector('.ic-error').textContent = ''; renderReview(); break;
        case 'apply': {
          if (importBaseline !== fingerprint()) throw Error('검토 중 원본이 변경되었습니다. 변경 검토를 다시 실행하세요.');
          const selected = [...importDialog.querySelectorAll('[data-ic-include]:checked')].map(el => importReview[Number(el.dataset.icInclude)]);
          if (!selected.length) throw Error('반영할 종목을 하나 이상 선택하세요.');
          applyBatch(state, selected, () => commit('선택한 Research ' + selected.length + '개를 반영했습니다.'), {uid, framework});
          importDialog.close(); importReview = []; host.querySelector('.ic-continue').hidden = false; render(); refreshPrices(); break;
        }
      }
    } catch (e) {const dialog = button.closest('dialog'); if (dialog?.querySelector('.ic-error')) dialog.querySelector('.ic-error').textContent = e.message; else notice(e.message); render();}
  });
  host.querySelector('[data-ic-status]').addEventListener('change', render);
  root.addEventListener('hani:market-updated', () => {quoteSource = root.HaniAssetMarket?.analyticsSource?.() || {}; quoteOwner = accountIdentity(); render();});
  root.HaniInvestmentCommittee = {render, refreshPrices, renderMonthly, continueCommittee, setFramework(value) {conviction({}, value); framework = clone(value);}, enter() {render(); refreshPrices();}};
  render();
})(typeof window !== 'undefined' ? window : globalThis);
