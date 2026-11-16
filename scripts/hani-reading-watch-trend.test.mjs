// Tests for Reading & Watching Activity Trend cards in hani-main.js / hani-design-system.css.
// Run: node --test scripts/hani-reading-watch-trend.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const deepFreeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

function loadTrendModule({ books = [], movies = [], goals = {}, todayValue = '2026-11-17' } = {}) {
  const source = readFileSync(root + 'hani-main.js', 'utf8');
  const start = source.indexOf('function activityDate(value){');
  const end = source.indexOf('function ledgerFixedChanges(');
  assert.ok(start > 0 && end > start, 'Activity trend region not found in hani-main.js');
  const snippet = source.slice(start, end);

  const state = deepFreeze({ books, movies });
  const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const today = () => todayValue;
  const mediaImage = (item, field) => item?.[field] ?? '';
  const ratingValue = v => {
    if (v === null || v === undefined || String(v).trim() === '') return null;
    const x = Math.round(Number(v) * 10) / 10;
    return Number.isFinite(x) && x >= 0.1 && x <= 5 ? x : null;
  };
  const movieContentType = (v, def = '기타') => {
    const s = String(v || '').trim();
    return s || def;
  };
  const window = {
    HANI_GOAL_PROGRESS: {
      read: ({ year } = {}) => {
        const list = [];
        if (goals.readingAnnual) list.push({ definition: { metric_id: 'books_completed_count' }, goal: { status: 'RESOLVED', target: goals.readingAnnual, year } });
        if (goals.movieAnnual) list.push({ definition: { metric_id: 'media_watched_count' }, goal: { status: 'RESOLVED', target: goals.movieAnnual, year } });
        return list;
      }
    }
  };
  const $ = () => null;

  const factory = new Function(
    'state', 'esc', 'today', 'mediaImage', 'ratingValue', 'movieContentType', 'window', '$',
    snippet + '\nreturn { activityDate, activityMonthShift, activityTrend, readingTrendDate, activityTrendRecent, activityTrendReaction, activityTrendChart, activityTrendHtml };'
  );
  return factory(state, esc, today, mediaImage, ratingValue, movieContentType, window, $);
}

test('reading trend: 12-month cap, summary metrics, and exact data-length window', () => {
  const books = [
    { id: 'b0', status: 'read', title: '작년 10월 책', completedDate: '2025-10-05', rating: 4.0 },
    { id: 'b1', status: 'read', title: '작년 12월 책', completedDate: '2025-12-10', rating: 4.2 },
    { id: 'b2', status: 'read', title: '1월 책', completedDate: '2026-01-12', rating: 4.5 },
    { id: 'b3', status: 'read', title: '3월 책 A', completedDate: '2026-03-01', rating: 4.0 },
    { id: 'b4', status: 'read', title: '3월 책 B', completedDate: '2026-03-14', rating: 4.8 },
    { id: 'b5', status: 'read', title: '3월 책 C', completedDate: '2026-03-25', rating: 5.0 },
    { id: 'b6', status: 'read', title: '11월 책 1', completedDate: '2026-11-02', rating: 4.7, cover: 'data:image/webp;base64,AAA' },
    { id: 'b7', status: 'read', title: '11월 책 2', completedDate: '2026-11-15', rating: 4.9 },
    { id: 'b_wish', status: 'wish', title: '읽을 책', completedDate: '2026-11-10', rating: 5.0 },
    { id: 'b_future', status: 'read', title: '미래 책', completedDate: '2026-12-01', rating: 5.0 }
  ];
  const mod = loadTrendModule({ books, goals: { readingAnnual: 20 } });
  const model = mod.activityTrend(books, { dateOf: mod.readingTrendDate, completed: r => r.status === 'read', asOf: '2026-11-17' });

  assert.equal(model.chartMonths.length, 12);
  assert.equal(model.chartMonths[0].month, '2025-12');
  assert.equal(model.chartMonths.at(-1).month, '2026-11');
  assert.equal(model.annual, 6);
  assert.equal(model.thisMonthCount, 2);
  assert.ok(Math.abs(model.monthAvg - 7 / 12) < 1e-9);
  assert.deepEqual(model.peak, { month: '2026-03', count: 3 });

  const html = mod.activityTrendHtml('reading', '2026-11-17');
  assert.match(html, /올해 합계<\/small><strong>6<span>권<\/span>/);
  assert.match(html, /이번 달<\/small><b>2<span>권<\/span>/);
  assert.match(html, /월평균<\/small><b>0\.6<span>권<\/span>/);
  assert.match(html, /가장 많이 읽은 달<\/small><b>3월 · 3권<\/b>/);
  assert.match(html, /data-months="12"/);

  // Shorter history only renders available months up to 12.
  const shortBooks = [
    { id: 's1', status: 'read', title: '9월 책', completedDate: '2026-09-05', rating: 4.1 },
    { id: 's2', status: 'read', title: '11월 책', completedDate: '2026-11-11', rating: 4.6 }
  ];
  const shortMod = loadTrendModule({ books: shortBooks });
  const shortModel = shortMod.activityTrend(shortBooks, { dateOf: shortMod.readingTrendDate, completed: r => r.status === 'read', asOf: '2026-11-17' });
  assert.deepEqual(shortModel.chartMonths.map(x => x.month), ['2026-09', '2026-10', '2026-11']);
});

test('watching trend: 0-count month baseline, current highlight, and overlapping average lines', () => {
  const movies = [
    { id: 'm1', status: 'watched', title: '작품1', contentType: '영화', watchedDate: '2026-05-05' },
    { id: 'm2', status: 'watched', title: '작품2', contentType: '드라마', watchedDate: '2026-06-10' },
    { id: 'm3', status: 'watched', title: '작품3', contentType: '애니메이션', watchedDate: '2026-07-11' },
    { id: 'm4', status: 'watched', title: '작품4', contentType: '영화', watchedDate: '2026-08-12' },
    { id: 'm5', status: 'watched', title: '작품5', contentType: '드라마', watchedDate: '2026-09-13' },
    { id: 'm6', status: 'watched', title: '작품6', contentType: '다큐멘터리', watchedDate: '2026-10-14' }
  ];
  const mod = loadTrendModule({ movies });
  const model = mod.activityTrend(movies, { dateOf: r => r.watchedDate, completed: r => r.status === 'watched', asOf: '2026-11-17' });
  assert.equal(model.baseline, 1);
  assert.equal(model.latest, 1);
  assert.equal(model.thisMonthCount, 0);

  const svg = mod.activityTrendChart(model, '편');
  // 2026-11 has 0 count -> current + is-zero + height="2", without floating "0" value label
  assert.match(svg, /<g class="activity-chart-month current is-zero"><title>2026-11 · 0편 · 이번 달<\/title><rect [^>]*height="2"[^>]*data-month="2026-11" data-count="0"\/>/);
  assert.doesNotMatch(svg, /<g class="activity-chart-month current is-zero">[^<]*<title>[^<]*<\/title><rect [^>]*><text class="activity-chart-value"/);
  assert.equal((svg.match(/class="activity-chart-value"/g) || []).length, 6);
  // Overlapping baseline & latest (both 1) are offset cleanly
  assert.equal((svg.match(/data-overlap="1"/g) || []).length, 2);

  // When both averages are 0, neither zero line cluttering the bottom axis is emitted
  const emptyMod = loadTrendModule({ movies: [] });
  const emptyModel = emptyMod.activityTrend([], { dateOf: r => r.watchedDate, completed: r => r.status === 'watched', asOf: '2026-11-17' });
  const emptySvg = emptyMod.activityTrendChart(emptyModel, '편');
  assert.doesNotMatch(emptySvg, /activity-chart-average/);
});

test('recent 3 items: reading shows title & rating; watching shows title & contentType; optional existing thumbs only', () => {
  const books = [
    { id: 'b1', status: 'read', title: '옛날 책', completedDate: '2026-01-01', rating: 3.5 },
    { id: 'b2', status: 'read', title: '둘째 최근 책', completedDate: '2026-11-05', rating: 4.0 },
    { id: 'b3', status: 'read', title: '셋째 최근 책', completedDate: '2026-10-20', rating: null, cover: 'data:image/png;base64,BBB' },
    { id: 'b4', status: 'read', title: '가장 최근 책', completedDate: '2026-11-16', rating: 4.8, cover: 'data:image/png;base64,CCC' },
    { id: 'b5', status: 'wish', title: '미완독 책', completedDate: '2026-11-17', rating: 5.0 },
    { id: 'b6', status: 'read', title: '미래 완독 책', completedDate: '2026-12-01', rating: 5.0 }
  ];
  const movies = [
    { id: 'm1', status: 'watched', title: '첫 작품', contentType: '영화', watchedDate: '2026-08-01' },
    { id: 'm2', status: 'watched', title: '셋째 작품', contentType: '예능', watchedDate: '2026-10-12' },
    { id: 'm3', status: 'watched', title: '둘째 작품', contentType: '드라마', watchedDate: '2026-11-02', poster: 'data:image/webp;base64,DDD' },
    { id: 'm4', status: 'watched', title: '최신 작품', contentType: '애니메이션', watchedDate: '2026-11-16' }
  ];
  const mod = loadTrendModule({ books, movies });

  const recentBooks = mod.activityTrendRecent(books, 'reading', '2026-11-17', 3);
  assert.deepEqual(recentBooks.map(x => [x.title, x.rating, Boolean(x.thumb)]), [
    ['가장 최근 책', 4.8, true],
    ['둘째 최근 책', 4.0, false],
    ['셋째 최근 책', null, true]
  ]);

  const readingHtml = mod.activityTrendHtml('reading', '2026-11-17');
  assert.match(readingHtml, /최근 기록 3개/);
  assert.match(readingHtml, /가장 최근 책/);
  assert.match(readingHtml, /★ 4\.8/);
  assert.match(readingHtml, /미평가/);
  assert.equal((readingHtml.match(/class="activity-recent-thumb"/g) || []).length, 2);

  const recentMovies = mod.activityTrendRecent(movies, 'movie', '2026-11-17', 3);
  assert.deepEqual(recentMovies.map(x => [x.title, x.contentType, Boolean(x.thumb)]), [
    ['최신 작품', '애니메이션', false],
    ['둘째 작품', '드라마', true],
    ['셋째 작품', '예능', false]
  ]);

  const movieHtml = mod.activityTrendHtml('movie', '2026-11-17');
  assert.match(movieHtml, /최신 작품/);
  assert.match(movieHtml, /애니메이션/);
  assert.match(movieHtml, /드라마/);
  assert.equal((movieHtml.match(/class="activity-recent-thumb"/g) || []).length, 1);
});

test('minji one-liner: data-driven, <= 30 chars, uses only 회장님 for both reading and watching', () => {
  const mod = loadTrendModule();
  const cases = [
    { asOf: '2026-11-17', totalCompleted: 0, thisMonthCount: 0, annual: 0, peak: null },
    { asOf: '2026-11-17', totalCompleted: 5, thisMonthCount: 0, annual: 5, peak: { month: '2026-08', count: 3 } },
    { asOf: '2026-11-17', totalCompleted: 8, thisMonthCount: 5, annual: 8, peak: { month: '2026-11', count: 5 } },
    { asOf: '2026-11-17', totalCompleted: 10, thisMonthCount: 1, annual: 10, peak: { month: '2026-07', count: 4 } },
    { asOf: '2026-11-17', totalCompleted: 22, thisMonthCount: 2, annual: 14, peak: { month: '2026-07', count: 2 } },
    { asOf: '2026-11-17', totalCompleted: 3, thisMonthCount: 1, annual: 3, peak: { month: '2026-10', count: 2 } }
  ];
  for (const kind of ['reading', 'movie']) {
    const outputs = new Set();
    for (const c of cases) {
      const msg = mod.activityTrendReaction(kind, c);
      assert.ok(msg.length > 0 && msg.length <= 30, `${kind} reaction too long (${msg.length}): ${msg}`);
      assert.ok(msg.includes('회장님'), `${kind} reaction must address 회장님: ${msg}`);
      assert.ok(!/오빠|대표님/.test(msg), `${kind} reaction must not use other honorifics: ${msg}`);
      outputs.add(msg);
    }
    assert.ok(outputs.size >= 4, `expected diverse reactions for ${kind}, got ${outputs.size}`);
  }
});

test('css layout & dark finish contract: full width chart, 3-col PC, 390px order, single-line legend', () => {
  const css = readFileSync(root + 'hani-design-system.css', 'utf8');
  assert.doesNotMatch(css, /activity-chart-figure[^}]*max-width\s*:\s*640px/);
  assert.match(css, /#app \.activity-chart-figure\{[^}]*max-width:none/);
  assert.match(css, /#app \.activity-trend-visual\{[^}]*grid-template-columns:minmax\(0,1\.55fr\)\s+minmax\(185px,225px\)\s+minmax\(240px,\.95fr\)/);
  assert.match(css, /#app \.activity-chart-legend\{[^}]*flex-wrap:nowrap/);
  assert.match(css, /@media\(max-width:650px\)\{[\s\S]*#app \.activity-trend-visual\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /--text-primary/);
  assert.match(css, /--surface-raised/);
});
