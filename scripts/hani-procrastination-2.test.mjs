import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsPath = path.join(rootDir, 'hani-procrastination-board.js');
const cssPath = path.join(rootDir, 'hani-procrastination-board.css');
const jsSource = fs.readFileSync(jsPath, 'utf8');
const cssSource = fs.readFileSync(cssPath, 'utf8');

function createMockDom() {
  const cards = [];
  let innerHtmlValue = '';

  function makeCard(id, owner) {
    const dataset = {};
    const attrs = { 'data-pb-card': id };
    const els = {
      '.pb-portrait': { setAttribute: (k, v) => { els['.pb-portrait'][k] = v; } },
      '.pb-age': { textContent: '' },
      '.pb-level': { textContent: '' },
      '.pb-speech': { textContent: '' },
      '.pb-mediation': { hidden: true },
      '.pb-mediation-text': { textContent: '' },
      '.pb-basis': { textContent: '' },
      '[data-pb-go]': { onclick: null },
      '[data-pb-reply]': { onclick: null }
    };
    return {
      dataset,
      attrs,
      els,
      querySelector(sel) {
        return els[sel] || null;
      }
    };
  }

  const board = {
    get children() {
      return cards;
    },
    get innerHTML() {
      return innerHtmlValue;
    },
    set innerHTML(html) {
      innerHtmlValue = String(html);
      cards.length = 0;
      const re = /data-pb-card="([^"]+)"/g;
      let match;
      while ((match = re.exec(innerHtmlValue)) !== null) {
        cards.push(makeCard(match[1]));
      }
    },
    querySelector(sel) {
      const m = /^\[data-pb-card="([^"]+)"\]$/.exec(sel);
      if (!m) return null;
      return cards.find(c => c.attrs['data-pb-card'] === m[1]) || null;
    }
  };

  const count = { textContent: '' };
  const doc = {
    body: { dataset: { view: 'elsewhere' } },
    getElementById(id) {
      if (id === 'procrastinationBoard') return board;
      if (id === 'procrastinationCount') return count;
      return null;
    }
  };

  return { board, count, doc };
}

function loadBoard(options = {}) {
  const routes = [];
  const timeouts = [];
  const dom = options.withDom ? createMockDom() : {
    board: null,
    count: null,
    doc: { body: { dataset: {} }, getElementById: () => null }
  };
  const deny = (name) => new Proxy({}, {
    get() { throw new Error(`Forbidden runtime access: ${name}`); },
    set() { throw new Error(`Forbidden runtime mutation: ${name}`); }
  });

  const sandbox = {
    window: {},
    document: dom.doc,
    showView(route) { routes.push(route); },
    localStorage: deny('localStorage'),
    sessionStorage: deny('sessionStorage'),
    fetch() { throw new Error('Forbidden runtime call: fetch'); },
    setInterval() { throw new Error('Forbidden runtime call: setInterval'); },
    setTimeout(fn, delay) {
      if (!options.allowReplyTimeout) {
        throw new Error('Unexpected setTimeout during script load/project/render');
      }
      timeouts.push({ fn, delay });
      return timeouts.length;
    },
    Date, Math, Array, Object, Set, Map, Number, String, Boolean, RegExp, Error
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  new vm.Script(jsSource, { filename: 'hani-procrastination-board.js' }).runInContext(sandbox);
  return { api: sandbox.window.HaniProcrastination, dom, routes, timeouts };
}

test('syntax and static read-only / timer safety', () => {
  assert.doesNotThrow(() => new vm.Script(jsSource, { filename: 'hani-procrastination-board.js' }));

  const forbidden = [
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\.setItem\b/,
    /\.removeItem\b/,
    /\.clear\s*\(/,
    /\bhani_os_life_v23\b/,
    /\bfetch\s*\(/,
    /\.upsert\b/,
    /\.insert\b/,
    /\baddEventListener\b/,
    /\bsetInterval\b/,
    /\bMutationObserver\b/,
    /\bResizeObserver\b/,
    /\bIntersectionObserver\b/
  ];
  for (const rx of forbidden) {
    assert.equal(rx.test(jsSource), false, `Forbidden pattern matched: ${rx}`);
  }

  const timeoutMatches = jsSource.match(/\bsetTimeout\s*\(/g) || [];
  assert.equal(timeoutMatches.length, 1, 'Expected exactly one setTimeout inside reply click handler');
});

test('board exposes 12 cards with updated owners and speech constraints', () => {
  const { api } = loadBoard();
  const now = '2026-11-17T12:00:00+09:00';
  const empty = api.project({}, now);

  assert.equal(empty.length, 12);
  const byId = Object.fromEntries(empty.map(item => [item.id, item]));
  assert.equal(byId.diary.owner, 'hani');
  assert.equal(byId.culture.owner, 'minji');
  assert.equal(byId.tasks.owner, 'gaeun');
  assert.equal(byId.workout.owner, 'sooyeon');
  assert.equal(byId.wrongReview.owner, 'yoonseul');
  assert.equal(byId.spendReview.owner, 'haru');
  assert.equal('reading' in byId, false);

  for (const item of empty) {
    const texts = [
      item.speech,
      ...item.staff.lines,
      item.staff.thanks,
      item.staff.reply,
      ...(item.staff.mediation ? [item.staff.mediation] : [])
    ];
    for (const line of texts) {
      assert.ok(line.length <= 30, `Line exceeds 30 chars (${line.length}): ${line}`);
      assert.equal(/[a-zA-Z]/.test(line), false, `English chars found in line: ${line}`);
      assert.equal(/(오빠|대표님|감독님|고객님|매니저님)/.test(line), false, `Disallowed title in line: ${line}`);
    }
    assert.ok(item.staff.thanks.includes('드디어! 고마워요♡'), `Thanks missing phrase for ${item.owner}`);
  }
});

test('diary moved to hani, culture tracks books+movies, and quiz filters invalid/paused projects', () => {
  const { api } = loadBoard();
  const now = '2026-11-17T12:00:00+09:00';

  const result = api.project({
    diaries: [{ date: '2026-11-14', content: '하루 기록 테스트' }],
    books: [{ title: '책A', status: 'read', completedDate: '2026-11-01' }],
    movies: [{ title: '영화A', status: 'watched', watchedDate: '2026-11-10' }],
    learningProjects: [
      { id: 'p-active', status: 'active' },
      { id: 'p-paused', status: 'paused' },
      { id: 'p-archived', status: 'archived' }
    ],
    learningQuizzes: [
      { status: 'pending', scheduledDate: '2026-10-01', questions: [{}] },
      { projectId: 'missing', status: 'pending', scheduledDate: '2026-10-01', questions: [{}] },
      { projectId: 'p-paused', status: 'pending', scheduledDate: '2026-10-01', questions: [{}] },
      { projectId: 'p-archived', status: 'pending', scheduledDate: '2026-10-01', questions: [{}] },
      { projectId: 'p-active', status: 'pending', scheduledDate: '2026-11-15', questions: [{}] }
    ]
  }, now);

  const byId = Object.fromEntries(result.map(item => [item.id, item]));
  assert.equal(byId.diary.owner, 'hani');
  assert.equal(byId.diary.days, 3);
  assert.equal(byId.diary.level, 1);

  assert.equal(byId.culture.owner, 'minji');
  assert.equal(byId.culture.date, '2026-11-10');
  assert.equal(byId.culture.days, 7);
  assert.equal(byId.culture.level, 1);

  assert.equal(byId.quiz.owner, 'hina');
  assert.equal(byId.quiz.date, '2026-11-15');
  assert.equal(byId.quiz.days, 2);
  assert.equal(byId.quiz.pending, 1);
});

test('tasks, workout, wrongReview, spendReview, and hani mediation behave accurately', () => {
  const { api } = loadBoard();
  const now = '2026-11-17T12:00:00+09:00';

  const result = api.project({
    tasks: [
      { id: 't1', text: '끝난 일', done: true, due: '2026-10-01' },
      { id: 't2', text: '기한 모름', done: false, due: '2026-10-01', dueKnown: false },
      { id: 't3', text: '밀린 일', done: false, due: '2026-11-01', dueKnown: true }
    ],
    exercise: [
      { date: '2026-11-17', steps: 9000, strength: false },
      { date: '2026-11-10', steps: 0, strength: true }
    ],
    learningProjects: [{ id: 'p1', status: 'active' }],
    learningWrongAnswers: [
      { projectId: 'p1', reviewStatus: 'review', lastWrongDate: '2026-11-02' }
    ],
    spendReviews: [
      { date: '2026-11-01', reviews: [] },
      { date: '2026-10-01', reviews: [{ date: '2026-10-15', verdict: 'good' }] }
    ],
    diaries: [{ date: '2026-10-01', content: '오래전 일기' }]
  }, now);

  const byId = Object.fromEntries(result.map(item => [item.id, item]));

  assert.equal(byId.tasks.date, '2026-11-01');
  assert.equal(byId.tasks.days, 16);
  assert.equal(byId.tasks.level, 3);
  assert.equal(byId.tasks.pending, 1);
  assert.ok(byId.tasks.mediation && byId.tasks.mediation.includes('가은'));

  assert.equal(byId.steps.level, 0);
  assert.equal(byId.workout.date, '2026-11-10');
  assert.equal(byId.workout.days, 7);
  assert.equal(byId.workout.level, 2);
  assert.equal(byId.workout.mediation, null);

  assert.equal(byId.wrongReview.date, '2026-11-02');
  assert.equal(byId.wrongReview.days, 15);
  assert.equal(byId.wrongReview.level, 2);

  assert.equal(byId.spendReview.date, '2026-11-01');
  assert.equal(byId.spendReview.days, 16);
  assert.equal(byId.spendReview.level, 1);

  // Executive Hani does not mediate for herself even at level 4
  assert.equal(byId.diary.level, 4);
  assert.equal(byId.diary.mediation, null);

  // Tasks cleared -> level 0, days 0
  const cleared = api.project({
    tasks: [{ id: 't1', text: '모두 완료', done: true, due: '2026-11-01' }]
  }, now);
  const clearedTasks = cleared.find(item => item.id === 'tasks');
  assert.equal(clearedTasks.level, 0);
  assert.equal(clearedTasks.days, 0);
});

test('render uses persistent card slots, toggles mediation, and handles reply button', () => {
  const { api, dom, routes, timeouts } = loadBoard({ withDom: true, allowReplyTimeout: false });
  const state = {
    tasks: [{ id: 't1', text: '마감 지남', done: false, due: '2026-10-01' }]
  };

  api.render(state);
  assert.equal(dom.board.children.length, 12);
  const firstCards = dom.board.children.slice();

  // Re-render preserves persistent card nodes
  const kstToday = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
  api.render({ ...state, diaries: [{ date: kstToday, content: '오늘 일기' }] });
  assert.equal(dom.board.children.length, 12);
  firstCards.forEach((card, i) => assert.equal(dom.board.children[i], card));

  const tasksCard = dom.board.querySelector('[data-pb-card="tasks"]');
  assert.equal(tasksCard.dataset.owner, 'gaeun');
  assert.equal(tasksCard.dataset.level, '4');
  assert.equal(tasksCard.els['.pb-mediation'].hidden, false);

  const diaryCard = dom.board.querySelector('[data-pb-card="diary"]');
  assert.equal(diaryCard.dataset.owner, 'hani');
  assert.equal(diaryCard.dataset.level, '0');
  assert.equal(diaryCard.els['.pb-mediation'].hidden, true);

  // Reply button interaction uses a single short timeout then navigates
  const replyEnv = loadBoard({ withDom: true, allowReplyTimeout: true });
  replyEnv.api.render(state);
  const card = replyEnv.dom.board.querySelector('[data-pb-card="tasks"]');
  card.els['[data-pb-reply]'].onclick();
  assert.equal(card.dataset.replied, 'true');
  assert.equal(card.els['.pb-speech'].textContent, '네, 회장님! 바로 준비해 둘게요.');
  assert.equal(replyEnv.timeouts.length, 1);
  replyEnv.timeouts[0].fn();
  assert.equal(card.dataset.replied, undefined);
  assert.deepEqual(replyEnv.routes, ['tasks']);
});

test('CSS references valid assets and supports themes, 9 staff, 5 moods, mobile, and reduced motion', () => {
  const urls = [...cssSource.matchAll(/url\((["']?)([^"')]+)\1\)/g)].map(m => m[2]);
  // Round 3 adds the Naeun per-item pose sheet and the scene background sheet.
  assert.equal(urls.length, 7);
  assert.ok(urls.includes('./assets/procrastination/pb-naeun-items-v1.webp'));
  assert.ok(urls.includes('./assets/procrastination/pb-scene-bg-v1.webp'));
  for (const rel of urls) {
    const abs = path.resolve(rootDir, rel);
    assert.equal(fs.existsSync(abs), true, `Missing CSS asset: ${rel}`);
  }

  for (const owner of ['naeun', 'hina', 'jieun', 'haru', 'minji', 'hani', 'gaeun', 'sooyeon', 'yoonseul']) {
    assert.ok(cssSource.includes(`[data-owner="${owner}"]`), `Missing staff CSS: ${owner}`);
  }
  for (const level of ['0', '1', '2', '3', '4', 'unknown']) {
    assert.ok(cssSource.includes(`[data-level="${level}"]`), `Missing mood CSS: ${level}`);
  }
  assert.ok(cssSource.includes('.pb-nametag'));
  assert.ok(cssSource.includes('[data-theme="dark"]'));
  assert.ok(cssSource.includes('[data-finish="midnight-black"]'));
  assert.ok(cssSource.includes('[data-finish="titanium-graphite"]'));
  assert.ok(cssSource.includes('@media(max-width:600px)'));
  assert.ok(cssSource.includes('prefers-reduced-motion:reduce'));
});
