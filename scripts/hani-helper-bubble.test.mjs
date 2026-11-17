// Node: node --test scripts/hani-helper-bubble.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const ui = read('hani-ui-v02992.js');
const helperSource = ui.slice(ui.indexOf('// BEGIN HANI HELPER BOT'));
const css = read('hani-style-08.css');
const mainSource = read('hani-main.js');
const tapBank = JSON.parse(read('assets/data/office-tap-lines-v1.json'));
const releases = JSON.parse(read('assets/data/hani-history-releases-v1.json'));
const rosterContext = {window: {}, document: {getElementById: () => null, querySelectorAll: () => []}};
vm.runInNewContext(read('hani-organization-hub.js'), rosterContext);
const staff = rosterContext.window.HaniOrganizationRoster.people;

function bubbleFixture({
  now = Date.parse('2026-11-17T10:00:00+09:00'),
  width = 390,
  height = 844,
  hiddenFlag = null,
  storedPos = null,
  initialView = 'home',
  loginLocked = false,
  people = staff
} = {}) {
  const callbacks = new Map(), frames = [], observers = [], timers = new Map(), storageCalls = [];
  let nextTimerId = 1, clockNow = now;
  let document;
  const store = new Map();
  if (hiddenFlag !== null) store.set('hani_helper_hidden_v1', hiddenFlag);
  if (storedPos !== null) store.set('hani_helper_pos_v1', storedPos);

  const matches = (el, selector) => selector.split(',').some(raw => {
    const s = raw.trim();
    if (!s) return false;
    if (s === '*') return true;
    if (s.includes(':not(')) return el.tagName === 'INPUT' && el.attributes.type !== 'hidden';
    if (s.startsWith('.')) return s.slice(1).split('.').every(c => (el.attributes.class || '').split(/\s+/).includes(c));
    if (s.startsWith('#')) return el.id === s.slice(1);
    const attr = s.match(/^(\w+)?\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attr) {
      const okTag = !attr[1] || el.tagName === attr[1].toUpperCase();
      const val = el.attributes[attr[2]];
      return okTag && val !== undefined && (attr[3] === undefined || val === attr[3]);
    }
    return el.tagName === s.toUpperCase();
  });

  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.attributes = {};
      this.style = {};
      this.hidden = false;
      this.textContent = '';
      this.isConnected = false;
      this.computed = {};
      this.dataset = new Proxy({}, {
        set: (data, key, value) => {
          data[key] = String(value);
          this.attributes['data-' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())] = String(value);
          return true;
        },
        deleteProperty: (data, key) => {
          delete data[key];
          delete this.attributes['data-' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase())];
          return true;
        }
      });
    }
    setPointerCapture(id) { this.captured = id; }
    hasPointerCapture(id) { return this.captured === id; }
    releasePointerCapture() { this.captured = null; }
    set id(v) { this.attributes.id = v; }
    get id() { return this.attributes.id; }
    setAttribute(k, v) {
      this.attributes[k] = String(v);
      if (k.startsWith('data-')) this.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(v);
      if (k === 'hidden') this.hidden = true;
    }
    getAttribute(k) { return this.attributes[k] ?? null; }
    matches(s) { return matches(this, s); }
    get classList() {
      const list = () => (this.attributes.class || '').split(/\s+/).filter(Boolean);
      return {
        contains: name => list().includes(name),
        add: name => {
          const items = list();
          if (!items.includes(name)) this.attributes.class = [...items, name].join(' ');
        },
        remove: name => {
          this.attributes.class = list().filter(x => x !== name).join(' ');
        }
      };
    }
    append(...els) {
      for (const el of els) {
        el.parent = this;
        el.isConnected = true;
        this.children.push(el);
      }
    }
    contains(el) { return this === el || this.children.some(c => c.contains(el)); }
    closest(s) { return matches(this, s) ? this : this.parent?.closest(s) || null; }
    querySelectorAll(s) { return this.children.flatMap(c => [...(matches(c, s) ? [c] : []), ...c.querySelectorAll(s)]); }
    querySelector(s) { return this.querySelectorAll(s)[0] || null; }
    focus() { document.activeElement = this; }
    getBoundingClientRect() {
      for (let el = this; el; el = el.parent) {
        if (el.hidden) return {left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0};
      }
      if (this.box) return {...this.box, right: this.box.left + this.box.width, bottom: this.box.top + this.box.height};
      if (this.classList.contains('hani-helper-bubble')) {
        const l = parseFloat(this.style.left) || 0;
        const t = parseFloat(this.style.top) || 0;
        const w = this.mockWidth ?? 190;
        const h = this.mockHeight ?? 42;
        return {left: l, top: t, width: w, height: h, right: l + w, bottom: t + h};
      }
      if (this.classList.contains('hani-helper-face')) {
        const edge = windowObj.innerWidth > 850 ? 58 : 50;
        const helper = document.getElementById('haniHelperBot');
        const l = parseFloat(helper?.style.left) || 0;
        const t = parseFloat(helper?.style.top) || 0;
        return {left: l, top: t, width: edge, height: edge, right: l + edge, bottom: t + edge};
      }
      const w = this.tagName === 'SECTION' ? 320 : 0;
      const h = this.tagName === 'SECTION' ? 320 : 0;
      return {left: 0, top: 0, width: w, height: h, right: w, bottom: h};
    }
    set innerHTML(html) {
      this.children = [];
      const stack = [this];
      for (const match of html.matchAll(/<\/?[^>]+>/g)) {
        const token = match[0];
        if (token.startsWith('</')) { stack.pop(); continue; }
        const tag = token.match(/^<(\w+)/)[1];
        const el = new Element(tag);
        const attrs = token.slice(tag.length + 1, -1);
        for (const m of attrs.matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) el.setAttribute(m[1], m[2] ?? '');
        stack.at(-1).append(el);
        if (!['input', 'img', 'br', 'hr'].includes(tag)) stack.push(el);
      }
    }
  }

  const body = new Element('body');
  body.dataset.view = initialView;
  body.isConnected = true;
  if (loginLocked) body.classList.add('login-scroll-locked');

  const events = (target, name, fn) => {
    const key = target + ':' + name;
    if (!callbacks.has(key)) callbacks.set(key, []);
    callbacks.get(key).push(fn);
  };

  document = {
    body,
    readyState: 'complete',
    activeElement: body,
    createElement: tag => new Element(tag),
    getElementById: id => body.querySelector('#' + id),
    querySelectorAll: s => body.querySelectorAll(s),
    addEventListener: (name, fn) => events('document', name, fn)
  };

  const app = new Element('div');
  app.id = 'app';
  if (loginLocked) app.classList.add('login-locked');
  body.append(app);
  const loginGate = new Element('div');
  loginGate.id = 'loginGate';
  loginGate.hidden = !loginLocked;
  if (loginLocked) loginGate.box = {left: 0, top: 0, width, height};
  body.append(loginGate);

  for (const id of ['home', 'tasks', 'calendar', 'investment', 'settings', 'diary']) {
    const el = new Element('section');
    el.id = id;
    app.append(el);
  }

  const storage = {
    getItem(key) {
      storageCalls.push(['getItem', key]);
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      storageCalls.push(['setItem', key, String(value)]);
      store.set(key, String(value));
    },
    removeItem(key) {
      storageCalls.push(['removeItem', key]);
      store.delete(key);
    },
    clear() {
      storageCalls.push(['clear']);
      store.clear();
    }
  };

  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [clockNow])); }
    static now() { return clockNow; }
  }

  const windowObj = {
    innerWidth: width,
    innerHeight: height,
    HaniOrganizationRoster: {people},
    addEventListener: (name, fn) => events('window', name, fn)
  };

  const setTimer = (fn, ms) => {
    const id = nextTimerId++;
    timers.set(id, {fn, runAt: clockNow + ms});
    return id;
  };
  const clearTimer = id => { timers.delete(id); };

  const context = vm.createContext({
    window: windowObj,
    document,
    Date: Clock,
    localStorage: storage,
    sessionStorage: storage,
    setTimeout: setTimer,
    clearTimeout: clearTimer,
    requestAnimationFrame: fn => frames.push(fn),
    MutationObserver: class { constructor(fn) { observers.push(fn); } observe() {} },
    getComputedStyle: el => ({visibility: 'visible', display: 'block', opacity: '1', pointerEvents: 'auto', position: 'static', getPropertyValue: () => '0px', ...el.computed}),
    showView: id => {
      body.dataset.view = id;
      windowObj.HaniHelperBot?.bubble?.(id);
    },
    fetch: async url => ({ok: true, json: async () => url.includes('tap-lines') ? tapBank : releases})
  });

  vm.runInContext(helperSource, context);

  return {
    Element,
    document,
    window: windowObj,
    app,
    loginGate,
    timers,
    storageCalls,
    get writes() { return storageCalls.filter(c => c[0] !== 'getItem'); },
    fire(type, target, extra = {}) {
      let prevented = false;
      const event = {
        type,
        target,
        pointerId: 1,
        button: 0,
        detail: 1,
        isPrimary: true,
        preventDefault() { prevented = true; },
        ...extra
      };
      for (const fn of callbacks.get('document:' + type) || []) fn(event);
      return {prevented};
    },
    switchView(id) {
      context.showView(id);
    },
    unlock() {
      loginLocked = false;
      body.classList.remove('login-scroll-locked');
      app.classList.remove('login-locked');
      loginGate.hidden = true;
      loginGate.box = null;
      context.showView('home');
    },
    advance(ms) {
      clockNow += ms;
      for (const [id, t] of [...timers.entries()]) {
        if (t.runAt <= clockNow) {
          timers.delete(id);
          t.fn();
        }
      }
    },
    flushFrames() {
      while (frames.length) frames.shift()();
    }
  };
}

test('face size shrunk ~20% on PC & phone (>=44px touch target), dark & reduced-motion CSS present', () => {
  assert.match(css, /#haniHelperBot\{[^}]*--helper-edge:58px;--helper-art-scale:1\.038461538;/);
  assert.match(css, /@media\(max-width:850px\)\{#haniHelperBot\{--helper-edge:50px;--helper-art-scale:0\.884615385\}\}/);
  assert.match(css, /:root:is\(\[data-theme="dark"\],\[data-finish="midnight-black"\],\[data-finish="titanium-graphite"\]\) #haniHelperBot \.hani-helper-bubble/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{#haniHelperBot \.hani-helper-art\{animation:none\}#haniHelperBot \.hani-helper-bubble\{animation:none;transition:none\}\}/);
  assert.match(css, /#haniHelperBot \.hani-helper-bubble\{[^}]*max-width:min\(248px,calc\(100vw - 24px\)\)/);
  assert.match(css, /#haniHelperBot \.hani-helper-bubble-close\{[^}]*width:28px;height:28px;/);
  assert.match(css, /#haniHelperBot \.hani-helper-bubble-close::after\{content:"";position:absolute;inset:-8px\}/);
});

test('showView hooks HaniHelperBot.bubble cleanly, no extra storage keys or setInterval or MutationObserver', () => {
  const showViewStart = mainSource.indexOf('function showView(id){');
  const showViewEnd = mainSource.indexOf('\nconst QUICK_JUMP_ITEMS=', showViewStart);
  assert.ok(showViewStart > 0 && showViewEnd > showViewStart);
  const showViewBody = mainSource.slice(showViewStart, showViewEnd);
  assert.equal((showViewBody.match(/window\.HaniHelperBot\?\.bubble\?\.\(id\)/g) || []).length, 1);

  assert.doesNotMatch(helperSource, /setInterval/);
  assert.equal((helperSource.match(/new MutationObserver/g) || []).length, 1);
  // 기존(main)과 같은 4곳: 숨김 읽기/쓰기 + 위치 읽기/쓰기. 말풍선은 저장소를 늘리지 않음.
  assert.equal((helperSource.match(/localStorage\.|sessionStorage\./g) || []).length, 4);
  assert.equal((helperSource.match(/const POSITION_KEY = 'hani_helper_pos_v1';/g) || []).length, 1);
  assert.equal((helperSource.match(/const HIDDEN_KEY = 'hani_helper_hidden_v1';/g) || []).length, 1);
});

test('bubble lines are 1-3 per view, <= 30 chars, and use 회장님 only', () => {
  const start = helperSource.indexOf('const BUBBLE_LINES = Object.freeze({');
  const end = helperSource.indexOf('const bubbleCursor =', start);
  assert.ok(start >= 0 && end > start);
  const data = vm.runInNewContext(helperSource.slice(start, end) + ';({BUBBLE_LINES, BUBBLE_FALLBACK})');
  const views = Object.entries(data.BUBBLE_LINES);
  assert.ok(views.length >= 30);
  const forbidden = /(오빠|대표님|성민)/;
  for (const [view, lines] of views) {
    assert.ok(lines.length >= 1 && lines.length <= 3, `${view} line count ${lines.length}`);
    for (const line of lines) {
      assert.ok(line.length > 0 && line.length <= 30, `${view} line too long (${line.length}): ${line}`);
      assert.doesNotMatch(line, forbidden, `${view} forbidden honorific: ${line}`);
    }
  }
  assert.ok(data.BUBBLE_FALLBACK.length >= 1 && data.BUBBLE_FALLBACK.length <= 3);
  for (const line of data.BUBBLE_FALLBACK) {
    assert.ok(line.length > 0 && line.length <= 30, `fallback too long: ${line}`);
    assert.doesNotMatch(line, forbidden, `fallback forbidden honorific: ${line}`);
  }
});

test('startup & view transitions trigger bubble once, cancel old timer, auto-hide after 6000ms, zero storage writes', () => {
  const f = bubbleFixture({width: 1280, height: 800, loginLocked: true, initialView: 'login'});
  f.flushFrames();
  const root = f.document.getElementById('haniHelperBot');
  const bubble = f.document.getElementById('haniHelperBubble');
  const bodyBtn = bubble.querySelector('[data-helper-bubble-open]');
  assert.equal(root.hidden, true);
  assert.equal(bubble.hidden, true);
  assert.equal(f.timers.size, 0);

  f.unlock();
  assert.equal(root.hidden, false);
  assert.equal(bubble.hidden, false);
  assert.ok(bodyBtn.textContent.length > 0 && bodyBtn.textContent.length <= 30);
  assert.equal(f.timers.size, 1);
  const firstTimerId = [...f.timers.keys()][0];

  f.advance(4000);
  assert.equal(bubble.hidden, false);
  f.switchView('tasks');
  assert.equal(bubble.hidden, false);
  assert.equal(f.timers.size, 1, 'old timer cleared when view changes');
  assert.notEqual([...f.timers.keys()][0], firstTimerId);

  f.advance(5999);
  assert.equal(bubble.hidden, false);
  f.advance(1);
  assert.equal(bubble.hidden, true);
  assert.equal(f.timers.size, 0);
  assert.deepEqual(f.writes, []);
});

test('hidden helper, modal, or missing duty keeps bubble suppressed', () => {
  const hiddenF = bubbleFixture({hiddenFlag: '1'});
  hiddenF.flushFrames();
  hiddenF.switchView('tasks');
  assert.equal(hiddenF.document.getElementById('haniHelperBubble').hidden, true);
  assert.equal(hiddenF.timers.size, 0);

  const noDutyF = bubbleFixture({people: []});
  noDutyF.flushFrames();
  assert.equal(noDutyF.document.getElementById('haniHelperBubble').hidden, true);
  assert.equal(noDutyF.timers.size, 0);

  const modalF = bubbleFixture();
  const dialog = new modalF.Element('div');
  dialog.setAttribute('role', 'dialog');
  dialog.box = {left: 40, top: 40, width: 300, height: 240};
  modalF.document.body.append(dialog);
  modalF.switchView('tasks');
  assert.equal(modalF.document.getElementById('haniHelperBubble').hidden, true);
  assert.equal(modalF.timers.size, 0);
});

test('clicking bubble body opens panel; clicking x dismisses for current viewing without writing storage', () => {
  const f = bubbleFixture();
  f.flushFrames();
  const helper = f.document.getElementById('haniHelperBot');
  const bubble = f.document.getElementById('haniHelperBubble');
  const openBtn = bubble.querySelector('[data-helper-bubble-open]');
  const closeBtn = bubble.querySelector('[data-helper-bubble-close]');
  const panel = helper.querySelector('#haniHelperSpeech');

  assert.equal(bubble.hidden, false);
  f.fire('click', openBtn);
  assert.equal(panel.hidden, false);
  assert.equal(bubble.hidden, true);
  assert.equal(f.timers.size, 0);

  // Close panel then change view so bubble re-appears, then dismiss via ×
  f.fire('click', panel.querySelector('[data-helper-close]'));
  f.switchView('calendar');
  assert.equal(bubble.hidden, false);
  f.fire('click', closeBtn);
  assert.equal(bubble.hidden, true);
  assert.equal(f.timers.size, 0);

  // Subsequent view changes in the same viewing stay dismissed
  f.switchView('investment');
  assert.equal(bubble.hidden, true);
  assert.deepEqual(f.writes, []);

  // Fresh reload shows bubble again
  const reloaded = bubbleFixture();
  reloaded.flushFrames();
  assert.equal(reloaded.document.getElementById('haniHelperBubble').hidden, false);
});

test('bubble follows dragged position, flips left/right, stays inside 390px bounds, and avoids fixed controls/inputs', () => {
  const f = bubbleFixture({width: 390, height: 844});
  f.flushFrames();
  const helper = f.document.getElementById('haniHelperBot');
  const face = helper.querySelector('.hani-helper-face');
  const bubble = f.document.getElementById('haniHelperBubble');

  // Default slot is on bottom-right, so bubble points inward on left side
  assert.equal(bubble.dataset.side, 'left');
  const rightRect = bubble.getBoundingClientRect();
  assert.ok(rightRect.left >= 12 && rightRect.right <= 378, '390px phone zero horizontal overflow');

  // Drag face to middle-left edge: bubble must flip to right side and stay within bounds
  f.fire('pointerdown', face, {clientX: 330, clientY: 780});
  f.fire('pointermove', face, {clientX: 16, clientY: 220});
  assert.equal(bubble.dataset.side, 'right');
  const flipped = bubble.getBoundingClientRect();
  assert.ok(flipped.left >= 12 && flipped.right <= 378 && flipped.top >= 12);
  f.fire('pointerup', face, {clientX: 16, clientY: 220});

  // Add a fixed control blocking the right side of the dragged face; bubble moves to top/bottom to avoid it
  const bar = new f.Element('div');
  bar.computed = {position: 'fixed'};
  bar.box = {left: 70, top: 210, width: 320, height: 64};
  f.document.body.append(bar);
  f.switchView('diary');
  const avoided = bubble.getBoundingClientRect();
  const overlapsBar = avoided.left < bar.box.left + bar.box.width &&
    avoided.right > bar.box.left &&
    avoided.top < bar.box.top + bar.box.height &&
    avoided.bottom > bar.box.top;
  assert.equal(overlapsBar, false, 'bubble avoids fixed control after drag');

  // Add a focused input blocking top; bubble moves to bottom without overlapping either obstacle
  const input = new f.Element('input');
  input.setAttribute('type', 'text');
  input.box = {left: 0, top: 140, width: 300, height: 64};
  f.document.body.append(input);
  input.focus();
  f.fire('focusin', input);
  f.flushFrames();
  const b2 = bubble.getBoundingClientRect();
  const overlapsInput = b2.left < input.box.left + input.box.width &&
    b2.right > input.box.left &&
    b2.top < input.box.top + input.box.height &&
    b2.bottom > input.box.top;
  assert.equal(overlapsInput, false, 'bubble avoids focused input');
});
