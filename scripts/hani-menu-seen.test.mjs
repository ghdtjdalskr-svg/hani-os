// node --test scripts/hani-menu-seen.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const mainSource = read('hani-main.js');
const procSource = read('hani-procrastination-board.js');

test('syntax and static safety boundaries for menu seen persistence', () => {
  new vm.Script(mainSource, { filename: 'hani-main.js' });

  const seenStart = mainSource.indexOf('const MENU_SEEN_KEY="hani_menu_seen_v1";');
  const seenEnd = mainSource.indexOf('const GROUP_COLLAPSE_KEY="hani_os_group_collapse_v1";');
  assert.ok(seenStart >= 0 && seenEnd > seenStart, 'menu seen helpers exist before GROUP_COLLAPSE_KEY');
  const seenBlock = mainSource.slice(seenStart, seenEnd);

  assert.match(seenBlock, /MENU_SEEN_KEY="hani_menu_seen_v1"/);
  assert.doesNotMatch(seenBlock, /hani_os_life_v23|STORAGE_KEY|removeItem|\.clear\(|sessionStorage|supabase|cloud|save\(|commit\(|setInterval/);

  const badgeStart = mainSource.indexOf('function menuBadgeKstDay(');
  const badgeEnd = mainSource.indexOf('function savedCollapsedGroups(');
  assert.ok(badgeStart >= 0 && badgeEnd > badgeStart, 'badge slice anchors exist');
  const badgeBlock = mainSource.slice(badgeStart, badgeEnd);
  assert.doesNotMatch(badgeBlock, /localStorage|sessionStorage|setInterval|MutationObserver|hani_os_life_v23/);

  const showViewStart = mainSource.indexOf('function showView(id){');
  const showViewEnd = mainSource.indexOf('const QUICK_JUMP_ITEMS=[');
  assert.ok(showViewStart >= 0 && showViewEnd > showViewStart, 'showView block exists');
  const showViewBlock = mainSource.slice(showViewStart, showViewEnd);
  assert.ok(
    showViewBlock.indexOf('markMenuSeen(id)') > showViewBlock.indexOf('if(!$(id))id="home";'),
    'markMenuSeen runs after view id resolution'
  );
  assert.ok(
    showViewBlock.indexOf('renderNavNewBadges()') > showViewBlock.indexOf('markMenuSeen(id)'),
    'renderNavNewBadges runs immediately after markMenuSeen'
  );
});

function createStorageMock(initial = {}, { throwOnGet = false, throwOnSet = false } = {}) {
  const store = new Map(Object.entries(initial));
  const calls = { getItem: [], setItem: [], removeItem: [], clear: [] };
  return {
    store,
    calls,
    api: {
      getItem(key) {
        calls.getItem.push(String(key));
        if (throwOnGet) throw new Error('Storage read blocked');
        return store.has(String(key)) ? store.get(String(key)) : null;
      },
      setItem(key, value) {
        calls.setItem.push({ key: String(key), value: String(value) });
        if (throwOnSet) throw new Error('QuotaExceededError');
        store.set(String(key), String(value));
      },
      removeItem(key) {
        calls.removeItem.push(String(key));
        store.delete(String(key));
      },
      clear() {
        calls.clear.push(true);
        store.clear();
      }
    }
  };
}

function createEl(tag = 'span') {
  const attrs = {};
  const classes = new Set();
  const el = {
    tagName: tag.toUpperCase(),
    className: '',
    hidden: false,
    textContent: '',
    dataset: {},
    nextElementSibling: null,
    classList: {
      add(c) { classes.add(c); el.className = [...classes].join(' '); },
      remove(c) { classes.delete(c); el.className = [...classes].join(' '); },
      toggle(c, force) {
        const next = force === undefined ? !classes.has(c) : !!force;
        if (next) classes.add(c); else classes.delete(c);
        el.className = [...classes].join(' ');
        return next;
      },
      contains(c) { return classes.has(c) || el.className.split(/\s+/).includes(c); }
    },
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return Object.hasOwn(attrs, k) ? attrs[k] : null; },
    removeAttribute(k) { delete attrs[k]; },
    after(node) { el.nextElementSibling = node; },
    closest() { return null; },
    remove() {}
  };
  return el;
}

function loadMenuSeenHarness({ initialStorage = {}, throwOnGet = false, throwOnSet = false, initialNow } = {}) {
  const storage = createStorageMock(initialStorage, { throwOnGet, throwOnSet });
  let currentNow = initialNow ?? Date.parse('2026-11-18T09:30:00+09:00');

  const FakeDate = class extends Date {
    constructor(...args) {
      if (args.length === 0) super(currentNow);
      else super(...args);
    }
    static now() { return currentNow; }
  };

  const procWindow = {};
  vm.runInContext(procSource, vm.createContext({ window: procWindow }));

  const navButtons = {};
  const viewNodes = {};
  for (const vid of ['home', 'board', 'ilbo', 'newsroom', 'procrastination', 'tasks', 'study']) {
    const label = createEl('span');
    label.classList.add('txt');
    label.textContent = vid;
    const btn = {
      dataset: { view: vid },
      classList: createEl('button').classList,
      querySelector(sel) {
        if (sel === '.txt') return label;
        return null;
      },
      closest() { return null; }
    };
    navButtons[vid] = { btn, label };
    viewNodes[vid] = createEl('section');
  }
  const titleEl = createEl('h1');
  const kickerEl = createEl('span');
  const appEl = createEl('div');
  const byId = { ...viewNodes, title: titleEl, pageKicker: kickerEl, app: appEl };

  const runtimeState = {
    boardPosts: [],
    tasks: [],
    learningQuizzes: []
  };
  const archiveRuntime = { posts: [], readSet: new Set() };
  let ilboDates = [];
  let ilboHasToday = false;

  const seenStart = mainSource.indexOf('const MENU_SEEN_KEY="hani_menu_seen_v1";');
  const seenEnd = mainSource.indexOf('const GROUP_COLLAPSE_KEY="hani_os_group_collapse_v1";');
  const badgeStart = mainSource.indexOf('const NAV_NEW_DATES=Object.freeze(');
  const badgeEnd = mainSource.indexOf('renderNavNewBadges();', mainSource.indexOf('function renderNavNewBadges('));
  const showViewStart = mainSource.indexOf('const INVESTMENT_COMMITTEE_VIEW=\'investmentCommittee\';');
  const showViewEnd = mainSource.indexOf('const QUICK_JUMP_ITEMS=[');

  assert.ok(seenStart >= 0 && seenEnd > seenStart);
  assert.ok(badgeStart >= 0 && badgeEnd > badgeStart);
  assert.ok(showViewStart >= 0 && showViewEnd > showViewStart);

  const documentMock = {
    body: { dataset: {} },
    createElement(tag) { return createEl(tag); },
    querySelector(sel) {
      const m = sel.match(/\[data-view="([^"]+)"\]/);
      return m ? navButtons[m[1]]?.btn || null : null;
    },
    querySelectorAll(sel) {
      if (sel === '#sidebar .nav-btn[data-view]') return Object.values(navButtons).map(x => x.btn);
      if (sel === '[data-view]') return Object.values(navButtons).map(x => x.btn);
      if (sel === '.view') return Object.values(viewNodes);
      return [];
    }
  };

  const windowObj = {
    addEventListener() {},
    scrollTo() {},
    HaniIlbo: {
      hasTodayIssue: () => ilboHasToday,
      issueDates: () => ilboDates,
      homeCard() {},
      enter() {}
    },
    HaniProcrastination: {
      project: procWindow.HaniProcrastination.project,
      render() {}
    }
  };

  const ctx = vm.createContext({
    Date: FakeDate,
    window: windowObj,
    document: documentMock,
    localStorage: storage.api,
    $: id => byId[id] || null,
    state: runtimeState,
    investmentNewsArchiveRuntime: archiveRuntime,
    location: { hash: '', href: 'https://hani.local/' },
    history: { replaceState() {} },
    setTimeout: () => 1,
    clearTimeout: () => {},
    pageMeta: {
      home: ['대시보드', '', 'home'],
      board: ['HANI 라운지', '', 'team'],
      ilbo: ['HANI 일보', '', 'team'],
      newsroom: ['뉴스룸', '', 'finance'],
      procrastination: ['미룬 일', '', 'work'],
      tasks: ['할 일', '', 'work'],
      study: ['공부', '', 'growth']
    },
    setBanner() {},
    updateFinishScope() {},
    updateHomeNewsCount() {},
    syncThemeCollections() {},
    organizationRoute: () => null,
    settingsRoute: () => null,
    selectOrganizationTab() {},
    selectSettingsTab() {},
    navigationTimer: 0,
    navigationCurrent: '',
    NAVIGATION_VIEWS: new Set(['home', 'board']),
    navigationBooted: false,
    loginGateUnlocked: true,
    navigationPersist() {},
    cloudUser: null,
    cloudRecoveryMode: false,
    drawExercise() {},
    drawPortfolio() {},
    investmentNewsMaybeRefresh() {},
    drawBody() {},
    drawLedgerTrend() {},
    renderCalendar() {},
    googleCalendarRefreshStatus() {},
    intakeRenderPreview() {},
    agentReviewInit() {},
    renderMonthlyReport() {},
    agentPolicyInit() {},
    deployCenterRender() {}
  });

  vm.runInContext(mainSource.slice(seenStart, seenEnd), ctx);
  vm.runInContext(mainSource.slice(badgeStart, badgeEnd), ctx);
  vm.runInContext(mainSource.slice(showViewStart, showViewEnd), ctx);

  return {
    ctx,
    storage,
    runtimeState,
    archiveRuntime,
    navButtons,
    setNow(isoOrMs) {
      currentNow = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs);
    },
    setIlbo({ dates = [], hasToday = false } = {}) {
      ilboDates = dates;
      ilboHasToday = hasToday;
    },
    pillFor(vid) {
      return navButtons[vid].label.nextElementSibling;
    }
  };
}

test('NEW badge turns on before viewing, off immediately on showView, and back on when newer item arrives', () => {
  const h = loadMenuSeenHarness({ initialNow: '2026-11-18T09:30:00+09:00' });

  h.runtimeState.boardPosts = [{ id: 'p1', publishedAt: '2026-11-18T08:00:00+09:00' }];
  h.setIlbo({ dates: ['2026-11-18'], hasToday: true });
  h.archiveRuntime.posts = [{ post_id: 'n1', event_at: '2026-11-18T08:30:00+09:00' }];

  h.ctx.renderNavNewBadges();

  assert.equal(h.pillFor('board').hidden, false);
  assert.equal(h.pillFor('board').textContent, 'NEW');
  assert.equal(h.pillFor('ilbo').hidden, false);
  assert.equal(h.pillFor('ilbo').textContent, 'NEW');
  assert.equal(h.pillFor('newsroom').hidden, false);
  assert.equal(h.pillFor('newsroom').textContent, 'NEW');
  assert.equal(h.storage.calls.setItem.length, 0, 'renderNavNewBadges must not write to localStorage');

  const boardSlot = h.pillFor('board');
  h.ctx.showView('board');

  assert.equal(h.pillFor('board'), boardSlot, 'Persistent Slot node is reused');
  assert.equal(h.pillFor('board').hidden, true);
  assert.equal(h.pillFor('board').textContent, '');
  assert.equal(h.pillFor('ilbo').hidden, false, 'unvisited ilbo stays NEW');
  assert.equal(h.pillFor('newsroom').hidden, false, 'unvisited newsroom stays NEW');

  assert.equal(h.storage.calls.setItem.length, 1);
  assert.equal(h.storage.calls.setItem[0].key, 'hani_menu_seen_v1');
  const saved1 = JSON.parse(h.storage.store.get('hani_menu_seen_v1'));
  assert.equal(saved1.v, 1);
  assert.deepEqual(Object.keys(saved1), ['v', 'seen']);
  assert.deepEqual(Object.keys(saved1.seen), ['board']);
  assert.match(saved1.seen.board, /^2026-11-18T09:30:00(?:\.\d+)?\+09:00$/);

  h.ctx.showView('ilbo');
  h.ctx.showView('newsroom');
  assert.equal(h.pillFor('ilbo').hidden, true);
  assert.equal(h.pillFor('newsroom').hidden, true);

  // Newer items arrive after the seen timestamps (including next-day check)
  h.setNow('2026-11-19T08:00:00+09:00');
  h.runtimeState.boardPosts.push({ id: 'p2', publishedAt: '2026-11-18T21:00:00+09:00' });
  h.setIlbo({ dates: ['2026-11-18', '2026-11-19'], hasToday: true });
  h.archiveRuntime.posts.push({ post_id: 'n2', published_at: '2026-11-18T11:00:00+09:00' });

  const writesBeforeRender = h.storage.calls.setItem.length;
  h.ctx.renderNavNewBadges();

  assert.equal(h.storage.calls.setItem.length, writesBeforeRender, 'renderNavNewBadges never writes');
  assert.equal(h.pillFor('board'), boardSlot, 'Persistent Slot reused on re-activation');
  assert.equal(h.pillFor('board').hidden, false);
  assert.equal(h.pillFor('board').textContent, 'NEW');
  assert.equal(h.pillFor('ilbo').hidden, false);
  assert.equal(h.pillFor('newsroom').hidden, false);

  const uniqueWrittenKeys = new Set(h.storage.calls.setItem.map(c => c.key));
  assert.deepEqual([...uniqueWrittenKeys], ['hani_menu_seen_v1']);
  assert.equal(h.storage.calls.setItem.some(c => c.key === 'hani_os_life_v23'), false);
});

test('corrupt or non-date values are ignored without removeItem or overwrite until next normal save', () => {
  const corruptPayloads = [
    '{broken-json',
    '[]',
    'null',
    JSON.stringify({ v: 2, seen: { board: '2026-11-18T09:30:00+09:00' } }),
    JSON.stringify({ v: 1, seen: 'bad' }),
    JSON.stringify({ v: 1, seen: { board: 'not-a-date', ilbo: 12345, newsroom: '2026-02-31T09:00:00+09:00' } })
  ];

  for (const raw of corruptPayloads) {
    const h = loadMenuSeenHarness({
      initialNow: '2026-11-18T10:00:00+09:00',
      initialStorage: { hani_menu_seen_v1: raw }
    });
    h.runtimeState.boardPosts = [{ id: 'p1', publishedAt: '2026-11-18T08:00:00+09:00' }];

    h.ctx.renderNavNewBadges();

    assert.equal(h.pillFor('board').hidden, false, 'falls back to today check when stored seen value is invalid');
    assert.equal(h.storage.calls.removeItem.length, 0, 'removeItem must be 0');
    assert.equal(h.storage.calls.clear.length, 0, 'clear must be 0');
    assert.equal(h.storage.calls.setItem.length, 0, 'must not overwrite corrupt value during read/render');
    assert.equal(h.storage.store.get('hani_menu_seen_v1'), raw);
  }

  // Next normal save replaces the corrupt value cleanly
  const h = loadMenuSeenHarness({
    initialNow: '2026-11-18T10:00:00+09:00',
    initialStorage: { hani_menu_seen_v1: '{broken-json' }
  });
  h.runtimeState.boardPosts = [{ id: 'p1', publishedAt: '2026-11-18T08:00:00+09:00' }];
  h.ctx.showView('board');

  assert.equal(h.storage.calls.removeItem.length, 0);
  assert.equal(h.pillFor('board').hidden, true);
  const repaired = JSON.parse(h.storage.store.get('hani_menu_seen_v1'));
  assert.equal(repaired.v, 1);
  assert.match(repaired.seen.board, /^2026-11-18T10:00:00(?:\.\d+)?\+09:00$/);
});

test('storage errors never throw and never touch hani_os_life_v23', () => {
  const h = loadMenuSeenHarness({
    initialNow: '2026-11-18T10:00:00+09:00',
    throwOnSet: true
  });
  h.runtimeState.boardPosts = [{ id: 'p1', publishedAt: '2026-11-18T08:00:00+09:00' }];

  assert.doesNotThrow(() => h.ctx.showView('board'));
  assert.equal(h.storage.calls.removeItem.length, 0);
  assert.equal(h.storage.calls.setItem.some(c => c.key === 'hani_os_life_v23'), false);

  const readFail = loadMenuSeenHarness({
    initialNow: '2026-11-18T10:00:00+09:00',
    throwOnGet: true,
    throwOnSet: true
  });
  readFail.runtimeState.boardPosts = [{ id: 'p1', publishedAt: '2026-11-18T08:00:00+09:00' }];
  assert.doesNotThrow(() => readFail.ctx.renderNavNewBadges());
  assert.doesNotThrow(() => readFail.ctx.showView('board'));
  assert.equal(readFail.pillFor('board').hidden, false);
});

test('number badges and NAV_NEW_DATES remain unchanged; opening non-NEW views writes nothing', () => {
  const h = loadMenuSeenHarness({ initialNow: '2026-11-18T10:00:00+09:00' });
  h.runtimeState.tasks = [
    { id: 't1', due: '2026-11-18', done: false },
    { id: 't2', dueAt: '2026-11-18T18:00:00+09:00', done: false }
  ];
  h.runtimeState.learningQuizzes = [
    { id: 'q1', scheduledDate: '2026-11-18', status: 'pending' }
  ];
  h.runtimeState.books = [];

  h.ctx.renderNavNewBadges();
  assert.equal(h.pillFor('tasks').textContent, '2');
  assert.equal(h.pillFor('tasks').hidden, false);
  assert.equal(h.pillFor('study').textContent, '1');
  assert.equal(h.pillFor('study').hidden, false);

  h.ctx.showView('tasks');
  h.ctx.showView('study');
  h.ctx.showView('procrastination');
  h.ctx.showView('home');

  assert.equal(h.storage.calls.setItem.length, 0, 'opening count/home views must not write hani_menu_seen_v1');
  assert.equal(h.pillFor('tasks').textContent, '2');
  assert.equal(h.pillFor('study').textContent, '1');

  // NAV_NEW_DATES fixed window remains active during 2026-10-11..2026-10-17 even when seen
  const fixedBadges = h.ctx.computeMenuBadges({}, {
    menuSeen: { board: '2026-10-12T12:00:00+09:00' }
  }, Date.parse('2026-10-12T13:00:00+09:00'));
  assert.equal(fixedBadges.board.active, true);
  assert.equal(fixedBadges.board.text, 'NEW');
});
