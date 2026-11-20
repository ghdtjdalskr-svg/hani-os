import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = f => fs.readFileSync(new URL(f, root), 'utf8');

function createDomHarness() {
  const writes = [];
  const scrolled = [];
  let activeView = 'agentReview';
  const listeners = { docClick: [], docKey: [], winResize: [] };

  class ClassList {
    constructor(el) { this.el = el; this.set = new Set(); }
    sync() {
      const cls = (this.el.attrs.class || '').split(/\s+/).filter(Boolean);
      this.set = new Set(cls);
    }
    _commit() { this.el.attrs.class = [...this.set].join(' '); }
    add(...names) { names.forEach(n => this.set.add(n)); this._commit(); }
    remove(...names) { names.forEach(n => this.set.delete(n)); this._commit(); }
    toggle(name, force) {
      const next = force === undefined ? !this.set.has(name) : !!force;
      if (next) this.set.add(name); else this.set.delete(name);
      this._commit();
      return next;
    }
    contains(name) { return this.set.has(name); }
  }

  class MockElement {
    constructor(tagName = 'div') {
      this.tagName = String(tagName).toUpperCase();
      this.attrs = {};
      this.children = [];
      this.parentElement = null;
      this.style = {};
      this.dataset = {};
      this.hidden = false;
      this.open = false;
      this._textContent = '';
      this._events = new Map();
      this.classList = new ClassList(this);
      this.scrollCalls = 0;
      this.clickCalls = 0;
      this.focusCalls = 0;
    }
    set id(v) { this.attrs.id = v; }
    get id() { return this.attrs.id || ''; }
    set className(v) { this.attrs.class = v; this.classList.sync(); }
    get className() { return this.attrs.class || ''; }
    set textContent(v) { this._textContent = String(v ?? ''); }
    get textContent() {
      if (this.children.length) return this._textContent + this.children.map(c => c.textContent).join('');
      return this._textContent;
    }
    set innerHTML(html) {
      this._html = String(html);
      this.children = [];
      this._textContent = '';
      parseHtmlInto(this, this._html);
    }
    get innerHTML() { return this._html || ''; }
    setAttribute(k, v) {
      const val = String(v);
      this.attrs[k] = val;
      if (k === 'class') this.classList.sync();
      if (k === 'hidden') this.hidden = true;
      if (k === 'open') this.open = true;
      if (k.startsWith('data-')) {
        const camel = k.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
        this.dataset[camel] = val;
      }
    }
    getAttribute(k) { return Object.hasOwn(this.attrs, k) ? this.attrs[k] : null; }
    hasAttribute(k) { return Object.hasOwn(this.attrs, k); }
    append(...nodes) {
      for (const node of nodes) {
        if (typeof node === 'string') { this._textContent += node; continue; }
        node.parentElement = this;
        this.children.push(node);
      }
    }
    replaceChildren(...nodes) {
      this.children = [];
      this._textContent = '';
      this.append(...nodes);
    }
    addEventListener(type, fn) {
      if (!this._events.has(type)) this._events.set(type, []);
      this._events.get(type).push(fn);
    }
    dispatchEvent(evt) {
      evt.target = evt.target || this;
      let cur = evt.target;
      while (cur) {
        for (const fn of (cur._events.get(evt.type) || [])) fn(evt);
        cur = cur.parentElement;
      }
    }
    matches(sel) {
      return sel.split(',').some(part => matchSingle(this, part.trim()));
    }
    closest(sel) {
      let cur = this;
      while (cur) {
        if (cur.matches(sel)) return cur;
        cur = cur.parentElement;
      }
      return null;
    }
    querySelectorAll(sel) {
      const out = [];
      const walk = node => {
        for (const child of node.children) {
          if (child.matches(sel)) out.push(child);
          walk(child);
        }
      };
      walk(this);
      return out;
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    checkVisibility() { return !this.hidden; }
    getBoundingClientRect() { return { width: 100, height: 24 }; }
    scrollIntoView(opts) { this.scrollCalls++; scrolled.push({ id: this.id || this.className, opts }); }
    focus() { this.focusCalls++; }
    click() { this.clickCalls++; this.dispatchEvent({ type: 'click', target: this }); }
  }

  function matchSingle(el, sel) {
    if (!sel) return false;
    const parts = sel.trim().split(/\s+/);
    if (parts.length > 1) {
      if (!matchAtom(el, parts.at(-1))) return false;
      let cur = el.parentElement;
      for (let i = parts.length - 2; i >= 0; i--) {
        while (cur && !matchAtom(cur, parts[i])) cur = cur.parentElement;
        if (!cur) return false;
        cur = cur.parentElement;
      }
      return true;
    }
    return matchAtom(el, parts[0]);
  }

  function matchAtom(el, atom) {
    let rest = atom;
    const tagMatch = rest.match(/^([a-zA-Z][\w-]*)/);
    if (tagMatch) {
      if (el.tagName !== tagMatch[1].toUpperCase()) return false;
      rest = rest.slice(tagMatch[0].length);
    }
    const tokens = rest.match(/(?:#[\w-]+|\.[\w-]+|\[[^\]]+\])/g) || [];
    if (tokens.join('') !== rest) return false;
    for (const tok of tokens) {
      if (tok[0] === '#') {
        if (el.id !== tok.slice(1)) return false;
      } else if (tok[0] === '.') {
        if (!el.classList.contains(tok.slice(1))) return false;
      } else {
        const inner = tok.slice(1, -1);
        const eq = inner.indexOf('=');
        if (eq < 0) {
          if (inner === 'hidden') { if (!el.hidden) return false; }
          else if (inner === 'open') { if (!el.open) return false; }
          else if (!el.hasAttribute(inner)) return false;
        } else {
          const k = inner.slice(0, eq);
          const v = inner.slice(eq + 1).replace(/^["']|["']$/g, '');
          if (el.getAttribute(k) !== v) return false;
        }
      }
    }
    return true;
  }

  function parseHtmlInto(parent, html) {
    const tokenRe = /<(\/?)([\w-]+)([^>]*)>|([^<]+)/g;
    const stack = [parent];
    const voidTags = new Set(['IMG', 'BR', 'HR', 'INPUT']);
    let m;
    while ((m = tokenRe.exec(html))) {
      if (m[4]) {
        const top = stack.at(-1);
        if (top) top._textContent += m[4];
        continue;
      }
      const closing = m[1] === '/';
      const tag = m[2].toUpperCase();
      if (closing) {
        while (stack.length > 1 && stack.at(-1).tagName !== tag) stack.pop();
        if (stack.length > 1) stack.pop();
        continue;
      }
      const node = new MockElement(tag);
      const attrRe = /([\w-]+)(?:\s*=\s*"([^"]*)")?/g;
      let am;
      while ((am = attrRe.exec(m[3] || ''))) {
        node.setAttribute(am[1], am[2] ?? '');
      }
      stack.at(-1).append(node);
      if (!voidTags.has(tag)) stack.push(node);
    }
  }

  const rootDoc = new MockElement('html');
  rootDoc.dataset.season = 'spring';
  const body = new MockElement('body');
  body.dataset.view = activeView;
  rootDoc.append(body);

  const app = new MockElement('div');
  app.id = 'app';
  app.className = 'app';
  body.append(app);

  const titleEl = new MockElement('h2');
  titleEl.id = 'title';
  titleEl.textContent = 'HANI GROUP';
  app.append(titleEl);

  const headerTop = new MockElement('header');
  headerTop.className = 'top';
  const topActions = new MockElement('div');
  topActions.className = 'top-actions';
  headerTop.append(topActions);
  app.append(headerTop);

  const agentView = new MockElement('section');
  agentView.id = 'agentReview';
  agentView.className = 'view active';
  const agentCount = new MockElement('span');
  agentCount.id = 'agentCaseCount';
  agentCount.textContent = '3';
  const agentList = new MockElement('div');
  agentList.id = 'agentCaseList';
  const agentDetail = new MockElement('div');
  agentDetail.id = 'agentCaseDetail';
  const agentInput = new MockElement('input');
  agentInput.id = 'agentRequestInput';
  agentView.append(agentCount, agentList, agentDetail, agentInput);
  app.append(agentView);

  const intakeView = new MockElement('section');
  intakeView.id = 'intake';
  intakeView.className = 'view';
  const yunaInput = new MockElement('textarea');
  yunaInput.id = 'yunaInput';
  intakeView.append(yunaInput);
  app.append(intakeView);

  const tasksView = new MockElement('section');
  tasksView.id = 'tasks';
  tasksView.className = 'view';
  app.append(tasksView);

  const auraView = new MockElement('section');
  auraView.id = 'aura';
  auraView.className = 'view';
  app.append(auraView);

  const orgView = new MockElement('section');
  orgView.id = 'organization';
  orgView.className = 'view';
  app.append(orgView);

  const quizOpens = [];
  const viewChanges = [];
  const docObj = {
    body,
    documentElement: rootDoc,
    createElement: tag => new MockElement(tag),
    querySelector: sel => rootDoc.querySelector(sel),
    querySelectorAll: sel => rootDoc.querySelectorAll(sel),
    getElementById: id => rootDoc.querySelector('#' + id),
    addEventListener: (type, fn) => {
      if (type === 'click') listeners.docClick.push(fn);
      if (type === 'keydown') listeners.docKey.push(fn);
    }
  };

  const forbidden = method => (...args) => {
    writes.push([method, ...args]);
    throw new Error('Unexpected storage mutation: ' + method);
  };

  const context = {
    document: docObj,
    window: {
      innerWidth: 1440,
      addEventListener: (type, fn) => { if (type === 'resize') listeners.winResize.push(fn); },
      scrollTo: opts => scrolled.push({ id: 'window', opts }),
      HANI_MAIN_CHARACTER_BANNER: {
        get: id => id === 'agentReview' ? { owner: 'hani', speaker: '하니', quote: '오늘 결재 안건을 함께 볼까요?' } : null
      },
      HaniOrganizationRoster: { people: [{ id: 'hani', name: '하니' }] },
      HaniOrganizationHub: { openPerson: () => {} },
      HANI_STUDY_V02984_TEST: {
        pendingLearningQuizzes: () => [
          { id: 'q1', title: '퀴즈 1', status: 'pending' },
          { id: 'q2', title: '퀴즈 2', status: 'pending' },
          { id: 'q3', title: '퀴즈 3', status: 'pending' },
          { id: 'q4', title: '퀴즈 4', status: 'pending' },
          { id: 'q5', title: '퀴즈 5', status: 'pending' }
        ],
        quizDate: q => q.id === 'q1' ? '2026-11-17' : '2026-11-18',
        openPendingQuiz: id => quizOpens.push(id)
      }
    },
    innerWidth: 1440,
    localStorage: {
      getItem: () => null,
      setItem: forbidden('localStorage.setItem'),
      removeItem: forbidden('localStorage.removeItem'),
      clear: forbidden('localStorage.clear')
    },
    sessionStorage: {
      getItem: () => null,
      setItem: forbidden('sessionStorage.setItem'),
      removeItem: forbidden('sessionStorage.removeItem'),
      clear: forbidden('sessionStorage.clear')
    },
    state: { tasks: [{ done: false, due: '2026-11-17' }] },
    careKoreaPeriod: () => ({ day: '2026-11-17' }),
    showView: id => {
      activeView = id.split('/')[0];
      body.dataset.view = activeView;
      viewChanges.push(id);
    },
    setTimeout: fn => { fn(); return 1; },
    clearTimeout: () => {},
    console, Date, Math, Number, String, Array, Object, JSON, Map, Set, Uint32Array
  };
  context.window.window = context.window;
  context.globalThis = context;
  vm.createContext(context);
  return { context, app, agentInput, agentList, yunaInput, writes, scrolled, quizOpens, viewChanges };
}

test('Issue 1: investment KPI deduplication keeps top 4 live cards and only 3 non-overlapping dashboard cards without label bands or line wrapping', () => {
  const style01 = read('hani-style-01.css');
  const ds = read('hani-design-system.css');
  const mainJs = read('hani-main.js');
  const html = read('index.html');

  // Top 4 live KPI IDs remain in index.html
  for (const id of ['investmentLiveTotal', 'investmentLiveMarket', 'investmentLivePnl', 'investmentLiveCash']) {
    assert.ok(html.includes(`id="${id}"`), `top live KPI ${id} remains`);
  }

  // renderBrokerDashboard still computes and renders all 6 slots cleanly (no calculation/data change)
  const renderFnStart = mainJs.indexOf('function renderBrokerDashboard()');
  const renderFnEnd = mainJs.indexOf('function drawBrokerChart()', renderFnStart);
  assert.ok(renderFnStart >= 0 && renderFnEnd > renderFnStart);
  const renderFn = mainJs.slice(renderFnStart, renderFnEnd);
  assert.match(renderFn, /\["최근 총자산",won\(c\.total\),"primary"\],\["전월 대비",signedWon\(d\.change\)[^\]]*\],\["총평가금액",won\(c\.evaluation\),"accent"\],\["평가손익",signedWon\(c\.pnl\)[^\]]*\],\["보유 종목"[^\]]*\],\["기록 월",latest\.period,""\]/);

  // CSS hides the 3 overlapping KPIs (nth-child 1, 3, 4) and lays out 3 columns cleanly
  assert.match(style01, /#investment #brokerDashboardStats\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important\}/);
  assert.match(style01, /#investment #brokerDashboardStats>\.broker-kpi:nth-child\(1\),\s*#investment #brokerDashboardStats>\.broker-kpi:nth-child\(3\),\s*#investment #brokerDashboardStats>\.broker-kpi:nth-child\(4\)\{display:none\}/);

  // Corner semicircle decoration removed
  assert.doesNotMatch(style01, /\.live-stat:after\{/);

  // No-wrap on KPI values prevents "기록 없음" 2-line wrapping
  assert.match(style01, /#investment \.live-stat strong\{[^}]*white-space:nowrap/);
  assert.match(style01, /#investment \.broker-kpi \.value\{[^}]*white-space:nowrap/);

  // Label white band removed and replaced with finish secondary ink token
  assert.match(ds, /#app #investment :is\(\.investment-live small,\.broker-stats \.label\)\{color:var\(--text-secondary,[^)]+\)!important;background:transparent!important\}/);
  assert.match(ds, /#app #investment \.investment-live small\{display:block;padding:0!important/);
});

test('Issue 2: organization hero uses cover + top-anchored image, non-overlapping grid layout, finish accent tokens, and 390px overflow-safe rules', () => {
  const orgCss = read('hani-organization-hub.css');

  // Image uses cover anchored at center top (no object-fit:contain)
  const heroArtImg = [...orgCss.matchAll(/#haniOrganizationHub \.ogh-hero-art>img\{[^}]+\}/g)].at(-1)?.[0] || '';
  assert.ok(heroArtImg, '.ogh-hero-art>img rule exists');
  assert.match(heroArtImg, /object-fit:cover/);
  assert.match(heroArtImg, /object-position:center top/);
  assert.doesNotMatch(heroArtImg, /object-fit:contain/);

  // Non-overlapping 2-column desktop layout & no absolute/white overlay on copy
  const heroRule = [...orgCss.matchAll(/#haniOrganizationHub \.ogh-hero\{[^}]+\}/g)].at(-1)?.[0] || '';
  assert.match(orgCss, /#haniOrganizationHub \.ogh-hero\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1\.15fr\)[^}]*max-width:100%/);
  const heroCopyRule = [...orgCss.matchAll(/#haniOrganizationHub \.ogh-hero-copy\{[^}]+\}/g)].at(-1)?.[0] || '';
  const heroCopyAll = [...orgCss.matchAll(/#haniOrganizationHub \.ogh-hero-copy\{[^}]+\}/g)].map(m => m[0]);
  assert.ok(heroCopyAll.some(r => /background:transparent/.test(r) && /min-width:0/.test(r)), 'desktop hero copy is transparent');
  assert.ok(heroCopyAll.every(r => !/rgba\(255,255,255/.test(r)), 'no white overlay box');
  const heroArtRule = [...orgCss.matchAll(/#haniOrganizationHub \.ogh-hero-art\{[^}]+\}/g)].at(-1)?.[0] || '';
  assert.doesNotMatch(heroArtRule, /position:absolute/);

  // Mobile 390px stacking rule present
  assert.match(orgCss, /@media\(max-width:850px\)\{[^}]*#haniOrganizationHub \.ogh-hero\{grid-template-columns:minmax\(0,1fr\)/);

  // Hardcoded blues replaced with finish tokens
  assert.doesNotMatch(orgCss, /#4562e6|#334fa7|#b798ed|#8ea3ff|#215ad5|#f3f7ff/);
  assert.match(orgCss, /#haniOrganizationHub \.ogh-hero h1 em\{color:var\(--control-accent\)\}/);
  assert.match(orgCss, /#haniOrganizationHub \.ogh-team-tabs button\[aria-selected=true\]\{color:var\(--control-accent\);border-bottom-color:var\(--control-accent\);background:var\(--control-soft\)\}/);
});

test('Issue 3: remote removes duplicate nav list, preserves all navigation routes, translates English labels, caps Today quizzes to 3, collapses utility without localStorage writes, and uses finish tokens', () => {
  const remoteJs = read('hani-context-remote-v1.js');
  const remoteCss = read('hani-context-remote.css');

  // CSS assertions: lowered media height + finish tokens (no hardcoded orange/lavender/white collapse)
  assert.match(remoteCss, /#app \.hani-remote-media\{[^}]*height:310px/);
  assert.doesNotMatch(remoteCss, /height:410px/);
  assert.doesNotMatch(remoteCss, /--remote-primary:#ffead5|--remote-current:#edf0fa|--remote-yuna:#fff4e5|--remote-alert:#fff0f3/);
  assert.match(remoteCss, /--remote-primary:var\(--control-soft/);
  assert.match(remoteCss, /--remote-current:var\(--control-soft/);
  assert.match(remoteCss, /--remote-focus:var\(--control-accent/);
  assert.match(remoteCss, /#app \.hani-remote-collapse,#app \.hani-remote-close\{[^}]*background:var\(--surface-raised/);

  // Source check: zero localStorage writes or new storage keys in remote JS
  assert.doesNotMatch(remoteJs, /localStorage|sessionStorage/);

  // Execute actual remote script in VM harness
  const h = createDomHarness();
  vm.runInContext(remoteJs, h.context);

  const rail = h.app.querySelector('#haniContextRemote');
  const mobileTrigger = h.app.querySelector('.hani-remote-mobile-trigger');
  assert.ok(rail, 'remote rail mounted');
  assert.ok(mobileTrigger, 'mobile trigger mounted');

  // 1. Duplicate list removed, 4 circle buttons retained
  assert.equal(rail.querySelector('.hani-remote-nav'), null, 'duplicate .hani-remote-nav removed');
  const circleButtons = rail.querySelectorAll('.hani-remote-media-actions button');
  assert.deepEqual(circleButtons.map(b => b.dataset.remoteAction), ['primary', 'yuna', 'agent', 'recent']);

  // 2. Zero English titles in rendered remote UI
  const fullText = rail.textContent + ' ' + mobileTrigger.textContent + ' ' + (rail.getAttribute('aria-label') || '');
  for (const forbiddenEng of ['HANI REMOTE', 'SECTION SHORTCUTS', 'HANI Remote', 'Release Queue', 'HINA QA', 'Calendar', 'Preview', 'Registry', 'HANI Insight']) {
    assert.equal(fullText.includes(forbiddenEng), false, `English label "${forbiddenEng}" should be translated`);
  }
  assert.equal(rail.querySelector('.hani-remote-brand').textContent.trim(), '리모컨');
  assert.equal(rail.querySelector('.hani-remote-section-label').textContent.trim(), '화면 바로가기');

  // 3. Today quiz list shows 1 summary row + top 3 visible quizzes + collapsed overflow
  const quizzesBox = rail.querySelector('[data-remote-quizzes]');
  assert.equal(quizzesBox.children.filter(c => c.tagName === 'BUTTON').length, 3, 'top 3 quizzes rendered directly');
  const moreDetails = quizzesBox.querySelector('details.hani-remote-today-more');
  assert.ok(moreDetails, 'remaining quizzes placed in <details>');
  assert.equal(moreDetails.open, false, 'overflow quiz <details> collapsed by default');
  assert.equal(moreDetails.children.flatMap(c => [c, ...(c.children || [])]).filter(b => b.dataset?.remoteQuiz).length, 2, '2 overflow quizzes inside collapsed <details>');

  // 4. Utility group is collapsed <details> by default
  const utility = rail.querySelector('details.hani-remote-utility');
  assert.ok(utility, '.hani-remote-utility is a <details>');
  assert.equal(utility.open, false, '.hani-remote-utility collapsed by default');
  assert.ok(utility.querySelector('[data-remote-action="theme"]'));
  assert.ok(utility.querySelector('[data-remote-action="top"]'));

  // 5. All navigation routes remain reachable (0 route loss)
  const currentBtn = rail.querySelector('.hani-remote-media-chip[data-remote-action="current"]');
  assert.ok(currentBtn, 'current screen route preserved on media chip button');
  currentBtn.click();
  assert.ok(h.scrolled.some(s => s.id === 'agentReview'));

  const alertBtn = rail.querySelector('[data-remote-action="alert"]');
  assert.ok(alertBtn && !alertBtn.hidden, 'alert route preserved and visible when agentReview count > 0');
  alertBtn.click();
  assert.ok(h.scrolled.some(s => s.id === 'agentCaseList'));

  rail.querySelector('[data-remote-action="recent"]').click();
  assert.equal(h.scrolled.filter(s => s.id === 'agentCaseList').length, 2);

  rail.querySelector('.hani-remote-links button').click();
  assert.equal(h.scrolled.filter(s => s.id === 'agentCaseList').length, 3);

  rail.querySelector('[data-remote-action="primary"]').click();
  assert.equal(h.agentInput.focusCalls, 1);

  rail.querySelector('[data-remote-action="agent"]').click();
  assert.ok(h.viewChanges.includes('organization/people/hani'));

  rail.querySelector('[data-remote-action="yuna"]').click();
  assert.ok(h.viewChanges.includes('intake'));
  assert.equal(h.yunaInput.focusCalls, 1);

  rail.querySelector('[data-remote-action="tasks"]').click();
  assert.ok(h.viewChanges.includes('tasks'));

  // Fake DOM lacks attribute closest(); quiz click is verified statically + in a real browser (Seoyun).
  assert.match(remoteJs, /e\.target\.closest\('\[data-remote-quiz\]'\);if\(quiz\)\{window\.HANI_STUDY_V02984_TEST\?\.openPendingQuiz\(quiz\.dataset\.remoteQuiz\)/);

  utility.querySelector('[data-remote-action="theme"]').click();
  assert.ok(h.viewChanges.includes('aura'));

  utility.querySelector('[data-remote-action="top"]').click();
  assert.ok(h.scrolled.some(s => s.id === 'window' && s.opts?.top === 0));

  rail.querySelector('.hani-remote-collapse').click();
  assert.deepEqual(h.writes, [], 'zero localStorage/sessionStorage writes');
});
