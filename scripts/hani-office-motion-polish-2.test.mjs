import test from 'node:test';
import strictAssert from 'node:assert/strict';
// Values returned from the vm context come from another realm; compare them by plain JSON structure.
const plain = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const assert = Object.assign(Object.create(strictAssert), strictAssert, {
  deepEqual: (a, b, m) => strictAssert.deepStrictEqual(plain(a), plain(b), m),
  notDeepEqual: (a, b, m) => strictAssert.notDeepStrictEqual(plain(a), plain(b), m),
});
import fs from 'node:fs';
import vm from 'node:vm';

const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const jsSource = read('hani-office-live.js');
const cssSource = read('hani-office-live.css');

const json = f => JSON.parse(read(f));
const assets = {
  canon: json('data/hani-building/spatial-contract.json'),
  art: json('data/hani-building/art-map-v1.json'),
  sprites: json('assets/sprites-v2/manifest.json'),
  spritesV3: json('assets/sprites-v3/manifest-v3.json'),
  places: json('data/hani-building/office-places.json'),
};
const actionTable = json('assets/data/office-actions-221.json');

function mountOffice(time = '10:00', reduced = false, extraEnv = {}) {
  const ids = new Map(), timers = [], observers = [], motionEvents = {}, writes = [];
  let clock = new Date(`2026-11-02T${time}:00+09:00`).getTime();
  const deny = (...args) => { writes.push(args); throw Error('forbidden storage write'); };

  class Element {
    constructor(tag = 'div') {
      this.tagName = tag; this.children = []; this.dataset = {}; this.attributes = {};
      this.events = {}; this.hidden = false; this.className = ''; this._textContent = '';
      this.style = { setProperty(k, v) { this[k] = v; }, getPropertyValue(k) { return this[k] ?? ''; } };
      this.classList = {
        contains: c => this.className.split(/\s+/).includes(c),
        add: c => { if (!this.classList.contains(c)) this.className = (this.className + ' ' + c).trim(); },
      };
    }
    get textContent() { return this._textContent + this.children.map(c => c.textContent).join(''); }
    set textContent(v) { this._textContent = String(v); this.children = []; }
    set id(v) { this._id = v; ids.set(v, this); }
    get id() { return this._id; }
    append(...nodes) { for (const n of nodes) { n.parentElement = this; this.children.push(n); } }
    after(node) { this.parentElement?.append(node); }
    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k] ?? (k === 'src' ? this.src : null); }
    addEventListener(k, fn) { this.events[k] = fn; }
    contains(node) { return this === node || this.children.some(c => c.contains(node)); }
    closest(selector) {
      if (selector === '.view') return view;
      if (selector === '[data-building-floor]' && this.dataset.buildingFloor) return this;
      if (selector.startsWith('.') && this.classList.contains(selector.slice(1))) return this;
      return this.parentElement?.closest(selector) || null;
    }
    querySelectorAll(selector) {
      const descendants = this.children.flatMap(c => [c, ...c.querySelectorAll('*')]);
      return selector === '*' ? descendants : descendants.filter(c => selector.split(',').some(s => s.startsWith('.') ? c.classList.contains(s.slice(1)) : c.tagName === s));
    }
    querySelector(s) { return this.querySelectorAll(s)[0] || null; }
    replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
    focus() { document.activeElement = this; }
    scrollIntoView() {}
    get firstElementChild() { return this.children[0] || null; }
  }

  const document = {
    hidden: false, visibilityState: 'visible', events: {},
    getElementById: id => ids.get(id) || null,
    createElement: t => new Element(t),
    addEventListener(k, fn) { this.events[k] = fn; },
  };
  const app = new Element(); app.id = 'app';
  const view = new Element(); view.className = 'view active';
  const root = new Element(); root.id = 'haniOfficeLive'; view.append(root); app.append(view);
  const tabs = new Element(); tabs.className = 'hani-building-tabs';
  const scroll = new Element(); scroll.className = 'hani-office-scroll';
  const map = new Element(); map.id = 'haniOfficeMap';
  scroll.append(map); root.append(tabs, scroll);
  for (const cls of ['hani-office-background', 'hani-office-foreground', 'hani-office-foreground', 'hani-office-foreground']) {
    const img = new Element('img'); img.className = cls; map.append(img);
  }
  for (const id of ['haniOfficeActors', 'haniOfficeConversation', 'haniOfficeMeeting', 'haniOfficeParticipants', 'haniOfficeQuestions', 'haniOfficeMeetingOpen', 'haniOfficeReturn', 'haniOfficeCaseState', 'haniOfficeReportLink', 'haniOfficeMeetingTitle', 'haniOfficeMeetingMeta', 'agentCaseDetail']) {
    const el = new Element(); el.id = id;
    if (['haniOfficeActors'].includes(id)) map.append(el);
    else root.append(el);
  }
  ids.get('haniOfficeMeeting').hidden = true;

  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [clock])); }
    static now() { return clock; }
  }
  class Image { set src(v) { this.onload?.(); } }

  const context = vm.createContext({
    HaniOfficeV2Assets: assets,
    HaniOfficeActions221: actionTable,
    HaniOfficeActions216: null,
    document, window: {}, Date: Clock, Image,
    matchMedia: q => ({ matches: /prefers-reduced-motion/.test(q) ? reduced : false, addEventListener: (name, fn) => { motionEvents[name] = fn; } }),
    getComputedStyle: () => ({ display: 'block' }),
    MutationObserver: class { constructor(cb) { observers.push(cb); } observe() {} },
    setInterval: (fn, ms) => { timers.push({ fn, ms }); },
    setTimeout: () => 0, clearTimeout: () => {},
    localStorage: { getItem: () => null, setItem: deny, removeItem: deny, clear: deny },
    sessionStorage: { getItem: () => null, setItem: deny, removeItem: deny, clear: deny },
    console,
    ...extraEnv,
  });

  vm.runInContext(read('hani-organization-hub.js'), context);
  vm.runInContext(jsSource, context);

  const click = floor => tabs.events.click({ target: [...tabs.children].find(b => b.dataset.buildingFloor === floor) });
  const visible = () => ids.get('haniOfficeActors').children.filter(a => !a.hidden);
  return {
    context, scene: context.HaniBuildingScene, ids, root, map, tabs, timers, writes,
    click, visible, tick: () => timers.find(t => t.ms === 100).fn(),
    setDateTime: t => { clock = new Date(t).getTime(); },
  };
}

const at = (day, seconds) => new Date(Date.parse(day + 'T00:00:00+09:00') + seconds * 1000);

test('② easeRun is continuous at segment ends, compileCurve rounds corners smoothly, and schedule arrival times remain invariant', () => {
  const { scene } = mountOffice();
  const { ease, curve, sampleCurve } = scene.motion;

  for (const dur of [0.5, 0.9, 3, 10]) {
    assert.equal(ease(0, dur), 0);
    assert.equal(ease(1, dur), 1);
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const val = ease(i / 100, dur);
      assert.ok(val >= prev - 1e-12 && val <= 1 + 1e-12, `monotonicity at ${i}% dur=${dur}`);
      prev = val;
    }
    assert.ok(ease(0.01, dur) - ease(0, dur) < 0.01, 'gentle start derivative');
    assert.ok(ease(1, dur) - ease(0.99, dur) < 0.01, 'gentle stop derivative');
  }

  // L-shaped corner rounding: [10, 10] -> [50, 10] -> [50, 50]
  // Note: 1672x941 canvas makes horizontal 40% (668.8px) longer than vertical 40% (376.4px),
  // so totalLen/2 lies on the first straight leg before the corner fillet; sample the quad fillet directly
  // and also check an equal-pixel-length L-corner at totalLen/2.
  const c = curve([[10, 10], [50, 10], [50, 50]]);
  const quad = c.segs.find(s => s.kind === 'quad');
  assert.ok(quad, 'corner fillet creates a quadratic Bezier segment');
  assert.deepEqual(sampleCurve(c, 0).position, [10, 10]);
  assert.deepEqual(sampleCurve(c, c.totalLen).position, [50, 50]);
  const mid = sampleCurve(c, (quad.cumStart + quad.cumEnd) / 2).position;
  assert.ok(mid[0] < 50 && mid[1] > 10 && mid[0] > quad.a[0] && mid[1] < quad.b[1], 'corner rounds smoothly inside the 90-degree vertex');
  const eq = curve([[20, 20], [50, 20], [50, 20 + (30 * 16.72) / 9.41]]);
  const eqMid = sampleCurve(eq, eq.totalLen / 2).position;
  assert.ok(eqMid[0] < 50 && eqMid[1] > 20, 'equal-pixel-length L-corner midpoint sits inside the vertex');

  // Scheduled arrival & state invariance on multi-leg same-floor route
  const formal = scene.scheduler.plan('2026-10-22', { chairmanPresent: true });
  const events = [...formal, ...scene.scheduler.blockPlan('2026-10-22', 0, formal, { chairmanPresent: true })];
  const multiLeg = events.flatMap(e => e.people.map(p => ({ e, p }))).find(({ p }) => {
    const legs = p.out.filter(l => scene.anchors.get(l.from).floor === scene.anchors.get(l.to).floor);
    return legs.length >= 2 && Math.abs(legs[0].end - legs[1].start) < 1e-6;
  });
  assert.ok(multiLeg, 'multi-leg same-floor route exists in deterministic schedule');
  const { e, p } = multiLeg;
  const legs = p.out;
  const runStart = legs[0].start;
  const boundary = legs[0].end;
  const startState = scene.scheduler.stateAt(e, p, runStart);
  assert.equal(startState.walking, true);
  assert.deepEqual(startState.position, scene.visualPoint(scene.anchors.get(legs[0].from)));

  // Speed across intermediate leg boundary does not drop to zero
  const beforePos = scene.scheduler.stateAt(e, p, boundary - 0.05).position;
  const afterPos = scene.scheduler.stateAt(e, p, boundary + 0.05).position;
  const speedAcrossBoundary = Math.hypot((afterPos[0] - beforePos[0]) * 16.72, (afterPos[1] - beforePos[1]) * 9.41) / 0.1;
  assert.ok(speedAcrossBoundary > 120, `continuous cruise across intermediate waypoint (got ${speedAcrossBoundary.toFixed(1)} px/s)`);

  // Arrival state at performStart is identical
  const arrived = scene.scheduler.stateAt(e, p, e.performStart);
  assert.equal(arrived.walking, false);
  assert.equal(arrived.seat.anchor, p.seat.anchor);
});

test('③ companionActivity applies petEase once to cumulative distance rather than per segment', () => {
  const start = jsSource.indexOf('  function companionActivity(');
  const end = jsSource.indexOf('  function residentSeed(');
  const body = jsSource.slice(start, end);
  assert.match(body, /easedProgress\s*=\s*reduced\s*\?\s*progress\s*:\s*petEase\(progress\)/);
  assert.match(body, /cursor\s*=\s*easedProgress\s*\*\s*length/);
  const loopSection = body.slice(body.indexOf('for(let i=0;i<lengths.length;i++)'), body.indexOf('if(safe(position))'));
  assert.doesNotMatch(loopSection, /petEase\(/, 'segment loop must use linear t after global petEase');
});

test('⑤ gait bounce/lean ranges, Bori pace/stride, cat bob, and kid/mascot motion connections', () => {
  const { scene } = mountOffice();
  const { gait } = scene.motion;
  const r = scene.residents;

  // Human distanceGait: bounce 2..3px, phase-oscillating lean ±1..1.5deg
  const s0 = gait(22.5, 1);
  const s1 = gait(67.5, 1);
  assert.ok(s0.bounce <= -2 && s0.bounce >= -3, `bounce in [-3, -2], got ${s0.bounce}`);
  assert.ok(Math.abs(s0.lean) >= 1 && Math.abs(s0.lean) <= 1.5, `lean magnitude in [1, 1.5], got ${s0.lean}`);
  assert.ok(s0.lean * s1.lean < 0, 'lean alternates left/right across successive steps');
  assert.equal(gait(0, 1).lean, 0);
  assert.deepEqual(gait(22.5, 1, true), { pose: 'walk-a', bounce: 0, lean: 0 });
});

test('⑤ verified gait pose, Bori pace/stride, cat bob, kids & companions motion', () => {
  const { scene } = mountOffice();
  const { gait } = scene.motion;
  const r = scene.residents;

  assert.equal(gait(22.5, 1).pose, 'walk-a');
  assert.equal(gait(67.5, 1).pose, 'walk-b');
  assert.deepEqual(gait(22.5, 1, true), { pose: 'walk-a', bounce: 0, lean: 0 });

  // Bori stride=12 (multiple alternating steps on 25px route) & pace raised (0.55 in residentSnapshot)
  const boriA = r.spot('resident_bori_lobby_a'), boriB = r.spot('resident_bori_lobby_b');
  const boriSample = r.motion('pet-bori', '2026-11-02', 1, boriA, boriB, 1.0, () => true, 0.55, 'left');
  assert.ok(boriSample);
  assert.ok(boriSample.speed >= 8 && boriSample.speed <= 12, `Bori pace=0.55 speed ~10px/s, got ${boriSample.speed}`);
  assert.match(jsSource, /person\.id==='pet-bori'\?\.55:1/);
  assert.match(jsSource, /stride=id==='pet-bori'\?12:/);

  // Cat bob >= 1.0px during walk
  const catA = r.spot('resident_cat_lobby'), catB = r.spot('resident_cat_front');
  let maxCatBob = 0;
  for (let t = 0.2; t <= 2.5; t += 0.1) {
    const m = r.motion('pet-cat', '2026-11-02', 1, catA, catB, t, () => true, 1, 'right');
    if (m?.walking) maxCatBob = Math.max(maxCatBob, Math.abs(m.bob));
  }
  assert.ok(maxCatBob >= 1.0, `cat bob >= 1.0px, got ${maxCatBob}`);

  // Walking followers: weekday mascot (companion-frog) and weekend kids (suyeon & suhyeon)
  const walkingChair = floor => ({ floors: [{ id: floor, people: [{ id: 'seongmin', floor, position: [51, 66], pose: 'walk-a', walking: true, facing: 'right' }] }] });
  const weekdayCompanion = r.companionSnapshot(at('2026-11-02', 36000.3), walkingChair('4f')).find(p => p.id === 'companion-frog');
  assert.ok(weekdayCompanion?.walking && weekdayCompanion.motion && weekdayCompanion.motion.bob < 0);

  const weekendKids = r.companionSnapshot(at('2026-11-07', 36000.3), walkingChair('4f')).filter(p => p.kid);
  assert.equal(weekendKids.length, 2);
  for (const kid of weekendKids) {
    assert.ok(kid.motion && typeof kid.motion.bob === 'number' && typeof kid.motion.lean === 'number', `${kid.id} has bob & lean`);
  }

  assert.match(cssSource, /\.hani-office-actor\[data-resident="kid"\]\[data-walking="true"\]:not\(\[data-motion\]\) \.hani-office-sprite\{transform:translateY\(var\(--pet-bob,0px\)\) rotate\(var\(--pet-lean,0deg\)\)\}/);
});

test('⑥ idle breathing keyframes have 2~3% scaleY and 1~1.5deg rotate, scattered delays, and Motion polish 1 stays intact', () => {
  const keyframe = name => cssSource.match(new RegExp(`@keyframes ${name}\\{(?:[^{}]|\\{[^{}]*\\})*\\}`))?.[0] || '';
  assert.match(keyframe('hani-office-breathe'), /scaleY\(1\.026\)\s+rotate\(1\.1deg\)/);
  assert.match(keyframe('hani-office-sway'), /rotate\(1\.3deg\)\s+scaleY\(1\.022\)/);
  assert.match(keyframe('hani-pet-idle'), /scale\(1\.01,1\.024\)/);
  assert.match(keyframe('hani-pet-sleep'), /scaleY\(1\.03\)/);
  assert.match(cssSource, /hani-pet-sleep var\(--idle-duration,4s\) var\(--idle-delay,0s\)/);
  assert.match(cssSource, /\/\* Motion polish 1 \(11\/21\):[\s\S]*left \.1s linear,top \.1s linear/);

  const f = mountOffice();
  const actors = f.ids.get('haniOfficeActors').children;
  const delays = new Set(actors.map(a => a.style['--idle-delay']));
  assert.ok(actors.every(a => /^-\d+(\.\d+)?s$/.test(a.style['--idle-delay'])), 'every actor has negative idle-delay');
  assert.ok(delays.size >= 15, `idle-delay scattered across actors (unique=${delays.size})`);
});

test('⑦ pet free() failure holds previous position up to 2.5s instead of snapping, and companion slew clamps jumps', () => {
  const { scene } = mountOffice();
  const r = scene.residents;
  const day = '2026-11-02';
  const baseSec = 10 * 3600 + 120;

  // Sample pet-cat cleanly at t0
  const cat0 = r.snapshot(at(day, baseSec), { floors: [] }).find(p => p.id === 'pet-cat');
  assert.ok(cat0);

  // At t0 + 0.1s, a walking human passes right on top of cat0 -> free() fails for non-resident
  const staffBlocker = { floors: [{ id: cat0.floor, people: [{ id: 'hani', floor: cat0.floor, position: cat0.position.slice(), walking: true }] }] };
  const held = r.snapshot(at(day, baseSec + 0.1), staffBlocker).find(p => p.id === 'pet-cat');
  assert.ok(held);
  assert.deepEqual(held.position, cat0.position, 'pet holds previous position on transient staff block');
  assert.equal(held.walking, false);

  // After > 2.5s of continuous block, pet safely falls back
  const afterHold = r.snapshot(at(day, baseSec + 2.7), staffBlocker).find(p => p.id === 'pet-cat');
  assert.ok(afterHold);
  assert.notDeepEqual(afterHold.position, cat0.position, 'pet relocates after 2.5s hold limit');

  // Companion slew limits jumps to <= 240 px/s
  const start = [40, 60], target = [52, 60]; // ~200px apart
  const step1 = r.slew('4f', start, target, 0.1, true);
  assert.equal(step1.moved, true);
  const stepPx = Math.hypot((step1.position[0] - start[0]) * 16.72, (step1.position[1] - start[1]) * 9.41);
  assert.ok(stepPx <= 24.01 && stepPx >= 23, `slew step limited to 24px/100ms (got ${stepPx.toFixed(2)})`);
});

test('⑧ vertical movement preserves previous facing, and kidsVisits/companionActivity use current segment dx', () => {
  const { scene } = mountOffice();
  const r = scene.residents;
  const a = r.spot('resident_bori_lounge_a'), b = r.spot('resident_bori_lounge_b');
  assert.equal(a.visual[0], b.visual[0], '2F bori lounge stops are purely vertical');

  assert.equal(r.motion('pet-bori', '2026-11-02', 1, a, b, 0.5, () => true, 0.55, 'left').facing, 'left');
  assert.equal(r.motion('pet-bori', '2026-11-02', 1, a, b, 0.5, () => true, 0.55, 'right').facing, 'right');

  assert.match(jsSource, /function segmentAt\(path,progress\)/);
  assert.match(jsSource, /if\(Math\.abs\(segDx\)>=6\)facings\.set\(id,segDx<0\?'left':'right'\)/);
  assert.match(jsSource, /if\(Math\.abs\(segDx\)>=6\)child\.facing=segDx<0\?'left':'right'/);
});

test('⑨ companion and pet rhythms include deterministic per-character phase jitter without storage', () => {
  const { scene } = mountOffice();
  const r = scene.residents;
  assert.notEqual(r.seed('walk-phase|kid-suyeon') % 100, r.seed('walk-phase|kid-suhyeon') % 100);
  assert.match(jsSource, /residentSeed\('walk-phase\|'\+/);
  assert.match(jsSource, /slot\*2\+\(seed%11\)\/10/);
});

test('⑩ meeting summon duration uses visualPoint 1672x941 coordinate system instead of 1000x640 logical coords', () => {
  const f = mountOffice('09:00', false);
  f.context.window.haniOfficeLiveUpdate({
    case: { id: 'case-1', title: '속도 점검' },
    reviews: [{ agent_key: 'JIEUN', review_round: 1, summary: '검토' }],
  });
  f.click('2f');
  f.ids.get('haniOfficeMeetingOpen').events.click();
  const jieun = f.visible().find(a => a.dataset.person === 'jieun');
  assert.ok(jieun?.officeTravel, 'meeting summon starts officeTravel');

  const path = jieun.officeTravel.path;
  const visualLen = path.slice(1).reduce((sum, n, i) => {
    const va = f.scene.visualPoint(path[i]), vb = f.scene.visualPoint(n);
    return sum + Math.hypot((vb[0] - va[0]) * 16.72, (vb[1] - va[1]) * 9.41);
  }, 0);
  const expectedDuration = visualLen / 180 * 1000;
  assert.ok(Math.abs(jieun.officeTravel.duration - expectedDuration) < 1, `duration ${jieun.officeTravel.duration} matches 1672x941 pixel length (${expectedDuration})`);
  assert.doesNotMatch(jsSource.slice(jsSource.indexOf('const travel=actor.officeTravel;')), /Math\.hypot\(b\.x-a\.x/);
});

test('safety: zero new timers, zero new rAF/Observer/listeners, and zero storage writes', () => {
  const count = re => [...jsSource.matchAll(re)].length;
  assert.equal(count(/\bsetInterval\s*\(/g), 2);
  assert.equal(count(/\brequestAnimationFrame\s*\(/g), 0);
  assert.equal(count(/\bMutationObserver\s*\(/g), 1);
  assert.equal(count(/\bsessionStorage\b/g), 0);
  assert.equal(count(/\bsupabase\b/g), 0);

  // localStorage appears only inside createOfficeAffinity
  const affinityStart = jsSource.indexOf('  function createOfficeAffinity()');
  const affinityEnd = jsSource.indexOf('  function createTapLines(');
  const outsideAffinity = jsSource.slice(0, affinityStart) + jsSource.slice(affinityEnd);
  assert.equal([...outsideAffinity.matchAll(/\blocalStorage\b/g)].length, 0);

  const f = mountOffice('10:00', false);
  assert.deepEqual(f.timers.map(t => t.ms), [100, 4200]);
  for (let i = 1; i <= 20; i++) {
    f.setDateTime(`2026-11-02T10:00:${String(Math.floor(i / 10)).padStart(2, '0')}.${(i % 10) * 100}+09:00`);
    f.tick();
  }
  assert.deepEqual(f.writes, []);
});
