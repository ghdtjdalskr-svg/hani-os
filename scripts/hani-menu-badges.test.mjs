import './hani-procrast-312-preload.cjs'; // Exact procrast-312 inverse before historical badge counts.
// node scripts/hani-menu-badges.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { makeBoardFixture } from './hani-procrastination-cases.mjs';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const mainSource = read('hani-main.js');
const ilboSource = read('hani-ilbo.js');
const procSource = read('hani-procrastination-board.js');
const designCss = read('hani-design-system.css');
const style08Css = read('hani-style-08.css');
const draftTeamStatus = JSON.parse(read('artifacts/menu-badges/ai-team-status-draft.json'));

test('syntax checks for modified JS files', () => {
  new vm.Script(mainSource, { filename: 'hani-main.js' });
  new vm.Script(ilboSource, { filename: 'hani-ilbo.js' });
  new vm.Script(procSource, { filename: 'hani-procrastination-board.js' });
});

function loadBadgeHarness() {
  const storageCalls = [];
  const forbidden = name => new Proxy({}, {
    get(_target, prop) {
      storageCalls.push(`${name}.${String(prop)}`);
      throw new Error(`Forbidden ${name}.${String(prop)} access during badge computation`);
    }
  });

  const procWindow = {};
  const procCtx = vm.createContext({
    window: procWindow,
    localStorage: forbidden('localStorage'),
    sessionStorage: forbidden('sessionStorage'),
    fetch: forbidden('fetch'),
    setTimeout: forbidden('setTimeout'),
    setInterval: forbidden('setInterval')
  });
  vm.runInContext(procSource, procCtx);

  const start = mainSource.indexOf('const NAV_NEW_DATES=Object.freeze(');
  const end = mainSource.indexOf('if(typeof window!=="undefined")window.HaniMenuBadges=');
  assert.ok(start >= 0 && end > start, 'badge calculation helpers exist in hani-main.js');
  const snippet = mainSource.slice(start, end);

  const badgeWindow = {};
  const badgeCtx = vm.createContext({
    window: badgeWindow,
    localStorage: forbidden('localStorage'),
    sessionStorage: forbidden('sessionStorage'),
    fetch: forbidden('fetch'),
    setTimeout: forbidden('setTimeout'),
    setInterval: forbidden('setInterval'),
    MutationObserver: forbidden('MutationObserver')
  });
  vm.runInContext(snippet, badgeCtx);

  return {
    computeMenuBadges: badgeCtx.computeMenuBadges,
    formatMenuBadgeCount: badgeCtx.formatMenuBadgeCount,
    projectProcrastination: procWindow.HaniProcrastination.project,
    storageCalls
  };
}

test('computeMenuBadges handles empty state and zero storage side effects', () => {
  const { computeMenuBadges, projectProcrastination, storageCalls } = loadBadgeHarness();
  const now = Date.parse('2026-11-17T10:00:00+09:00');
  const fakeState = {};
  const snapshotBefore = JSON.stringify(fakeState);

  const badges = computeMenuBadges(fakeState, { projectProcrastination }, now);

  assert.equal(JSON.stringify(fakeState), snapshotBefore);
  assert.deepEqual(storageCalls, []);
  for (const key of ['board', 'ilbo', 'newsroom', 'procrastination', 'tasks', 'study']) {
    assert.equal(badges[key].active, false, `${key} should be inactive on empty state`);
    assert.equal(badges[key].text, '');
    assert.equal(badges[key].count, 0);
  }
});

test('board NEW badge reflects today published posts only in KST', () => {
  const { computeMenuBadges, storageCalls } = loadBadgeHarness();
  const now = Date.parse('2026-11-17T10:00:00+09:00');

  const absentState = {
    boardPosts: [
      { id: 'old', publishedAt: '2026-11-16T23:50:00+09:00' },
      { id: 'draft', publishedAt: '2026-11-17T08:00:00+09:00', draft: true },
      { id: 'pending', publishedAt: '2026-11-17T08:00:00+09:00', pending: true },
      { id: 'archived', publishedAt: '2026-11-17T08:00:00+09:00', disposition: 'archived' },
      { id: 'meta', publishedAt: '2026-11-17T08:00:00+09:00', boardMeta: true }
    ]
  };
  assert.equal(computeMenuBadges(absentState, {}, now).board.active, false);
  assert.equal(computeMenuBadges(absentState, {}, now).board.text, '');

  const presentState = {
    boardPosts: [
      ...absentState.boardPosts,
      { id: 'today-kst', publishedAt: '2026-11-17T08:15:00+09:00' }
    ]
  };
  const presentBadge = computeMenuBadges(presentState, {}, now).board;
  assert.equal(presentBadge.kind, 'new');
  assert.equal(presentBadge.active, true);
  assert.equal(presentBadge.text, 'NEW');

  const utcMidnightKst = {
    boardPosts: [{ id: 'utc', createdAt: '2026-11-16T15:30:00Z' }]
  };
  assert.equal(computeMenuBadges(utcMidnightKst, {}, now).board.active, true);
  assert.deepEqual(storageCalls, []);
});

test('ilbo and newsroom NEW badges read today runtime metadata without storage writes', () => {
  const { computeMenuBadges, storageCalls } = loadBadgeHarness();
  const now = Date.parse('2026-11-17T10:00:00+09:00');

  const none = computeMenuBadges({}, {
    ilboDates: ['2026-11-09'],
    newsPosts: [{ post_id: 'n0', published_at: '2026-11-16T20:00:00+09:00' }]
  }, now);
  assert.equal(none.ilbo.active, false);
  assert.equal(none.newsroom.active, false);

  const unread = computeMenuBadges({}, {
    ilboDates: ['2026-11-09', '2026-11-17'],
    newsPosts: [{ post_id: 'n1', event_at: '2026-11-17T09:00:00+09:00' }],
    newsReadSet: new Set()
  }, now);
  assert.equal(unread.ilbo.active, true);
  assert.equal(unread.ilbo.text, 'NEW');
  assert.equal(unread.newsroom.active, true);
  assert.equal(unread.newsroom.text, 'NEW');

  const readNews = computeMenuBadges({}, {
    ilboHasToday: true,
    newsPosts: [{ post_id: 'n1', event_at: '2026-11-17T09:00:00+09:00' }],
    newsReadSet: new Set(['n1'])
  }, now);
  assert.equal(readNews.ilbo.active, true);
  assert.equal(readNews.newsroom.active, false);
  assert.deepEqual(storageCalls, []);
});

test('procrastination count reuses HaniProcrastination.project stage >= 1 and caps at 99+', () => {
  const { computeMenuBadges, formatMenuBadgeCount, projectProcrastination, storageCalls } = loadBadgeHarness();
  const fixture = makeBoardFixture();
  const fixtureNowIso = '2026-11-08T03:00:00Z';
  const fixtureNow = Date.parse(fixtureNowIso);
  const projected = projectProcrastination(fixture, fixtureNowIso);
  const expectedStage1Plus = projected.filter(item => item.level >= 1).length;
  assert.equal(expectedStage1Plus, 4);

  const badges = computeMenuBadges(fixture, { projectProcrastination }, fixtureNow);
  assert.equal(badges.procrastination.kind, 'count');
  assert.equal(badges.procrastination.active, true);
  assert.equal(badges.procrastination.count, 4);
  assert.equal(badges.procrastination.text, '4');

  assert.equal(formatMenuBadgeCount(0), '');
  assert.equal(formatMenuBadgeCount(99), '99');
  assert.equal(formatMenuBadgeCount(100), '99+');

  const overflow = computeMenuBadges({}, {
    procrastinationItems: Array.from({ length: 105 }, (_, i) => ({ id: `p${i}`, level: 1 }))
  }, fixtureNow);
  assert.equal(overflow.procrastination.count, 105);
  assert.equal(overflow.procrastination.text, '99+');
  assert.deepEqual(storageCalls, []);
});

test('tasks due today and study today incomplete quiz counts calculate and cap at 99+', () => {
  const { computeMenuBadges, storageCalls } = loadBadgeHarness();
  const now = Date.parse('2026-11-17T10:00:00+09:00');
  const fakeState = {
    tasks: [
      { id: 't1', due: '2026-11-17', done: false },
      { id: 't2', dueAt: '2026-11-17T23:30:00+09:00', done: false },
      { id: 't3', due: '2026-11-17', done: true },
      { id: 't4', due: '2026-11-18', done: false }
    ],
    learningQuizzes: [
      { id: 'q1', scheduledDate: '2026-11-17', status: 'pending' },
      { id: 'q2', scheduledDate: '2026-11-17', status: 'in_progress' },
      { id: 'q3', scheduledDate: '2026-11-17', status: 'completed' },
      { id: 'q4', scheduledDate: '2026-11-16', status: 'pending' }
    ]
  };

  const badges = computeMenuBadges(fakeState, {}, now);
  assert.equal(badges.tasks.count, 2);
  assert.equal(badges.tasks.text, '2');
  assert.equal(badges.study.count, 2);
  assert.equal(badges.study.text, '2');

  const manyTasks = {
    tasks: Array.from({ length: 120 }, (_, i) => ({ id: `t${i}`, due: '2026-11-17', done: false }))
  };
  const capped = computeMenuBadges(manyTasks, {}, now);
  assert.equal(capped.tasks.count, 120);
  assert.equal(capped.tasks.text, '99+');
  assert.deepEqual(storageCalls, []);
});

test('CSS, runtime hooks, and AI team draft JSON match constraints', () => {
  const badgeSlice = mainSource.slice(
    mainSource.indexOf('function menuBadgeKstDay('),
    mainSource.indexOf('function savedCollapsedGroups(')
  );
  assert.doesNotMatch(badgeSlice, /localStorage|sessionStorage|setInterval|MutationObserver/);
  assert.match(mainSource, /window\.addEventListener\?\.\("hani-ilbo-ready"/);
  assert.match(mainSource, /function renderAll\(\)\{[\s\S]*renderNavNewBadges\(\)/);

  assert.match(designCss, /#app #aiWork #developmentTeamList \.member-visual\{[^}]*aspect-ratio:1\/1/);
  assert.match(designCss, /#app #aiWork #developmentTeamList \[data-development-portrait\][\s\S]*object-fit:cover;object-position:center 20%/);
  assert.match(designCss, /#app\.sidebar-mini #sidebar \.nav-btn \.nav-new-pill\[data-menu-badge="new"\]:not\(\[hidden\]\)/);
  assert.match(style08Css, /:not\(\[data-menu-badge\]\)/);

  assert.equal(draftTeamStatus.updatedAt, '2026-11-17');
  assert.equal(draftTeamStatus.members.length, 7);
  assert.deepEqual(
    draftTeamStatus.members.map(m => m.id),
    ['seoyun', 'dohyun', 'serin', 'hani', 'yuri', 'arin', 'hina']
  );
});
