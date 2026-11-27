// 2.9.321 walk detours: every elevator-to-seat route leg on every floor avoids the painted-furniture rects.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'), json = f => JSON.parse(read(f));
const files = { canon: 'data/hani-building/spatial-contract-v4.json', art: 'data/hani-building/art-map-v4.json', sprites: 'assets/sprites-v2/manifest.json', spritesV3: 'assets/sprites-v3/manifest-v3.json', places: 'data/hani-building/office-places-v3.json' };
const assets = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, json(f)]));
function load() {
  let storage = 0;
  const deny = new Proxy({}, { get() { storage++; throw Error('storage forbidden'); } });
  const ctx = vm.createContext({ HaniOfficeV2Assets: structuredClone(assets), HaniOfficeActions221: json('assets/data/office-actions-323.json'), document: { getElementById: () => null, addEventListener() {} }, window: {}, localStorage: deny, sessionStorage: deny, setTimeout() {}, setInterval() {} });
  vm.runInContext(read('hani-office-live.js'), ctx);
  return { scene: ctx.HaniBuildingScene, storage: () => storage };
}
const { scene, storage } = load();
const len = pts => pts.slice(1).reduce((s, p, i) => s + Math.hypot((p[0] - pts[i][0]) * 16.72, (p[1] - pts[i][1]) * 9.41), 0);

test('every floor has an obstacle map measured on its current art', () => {
  const obs = scene.motion.obstacles;
  for (const floor of ['1f', '2f', '3f', '4f', 'creative', '5f']) {
    assert.ok(Array.isArray(obs[floor]) && obs[floor].length >= 15, floor + ' obstacle rects');
    for (const r of obs[floor]) assert.ok(r.length === 4 && r[0] < r[2] && r[1] < r[3] && r.every(v => v >= 0 && v <= 100), floor + ' rect ' + r);
  }
});

test('elevator-to-seat legs detour around furniture and stay walkable-length', () => {
  const obs = scene.motion.obstacles, detour = scene.motion.detour, anchors = [...scene.anchors.values()];
  const inside = (f, p) => obs[f].some(r => p[0] > r[0] + .5 && p[0] < r[2] - .5 && p[1] > r[1] + .5 && p[1] < r[3] - .5);
  const near = (p, q, r) => Math.hypot(p[0] - q[0], (p[1] - q[1]) * .5628) < r;
  const report = {};
  for (const floor of Object.keys(obs)) {
    const elev = anchors.find(a => a.floor === floor && /^elevator_/.test(a.id));
    assert.ok(elev, floor + ' elevator');
    let legs = 0, crossing = 0, worst = 1;
    for (const t of anchors.filter(a => a.floor === floor && a.walkTarget !== false && !/^(path|junction|approach|elevator|door|hall)/.test(a.id))) {
      const r = scene.route(elev.id, t.id); if (!r || r.length < 2) continue;
      for (let i = 1; i < r.length; i++) {
        const A = scene.anchors.get(r[i - 1].id || r[i - 1]), B = scene.anchors.get(r[i].id || r[i]);
        if (!A || !B || A.floor !== floor || B.floor !== floor) continue;
        const a = scene.visualPoint(A), b = scene.visualPoint(B), p = detour(floor, a, b);
        legs++; worst = Math.max(worst, len(p) / Math.max(1, len([a, b])));
        assert.deepEqual(p[0], a); assert.deepEqual(p.at(-1), b);
        let hit = false;
        for (let k = 1; k < p.length && !hit; k++) for (let u = 0; u <= 20; u++) { const q = [p[k - 1][0] + (p[k][0] - p[k - 1][0]) * u / 20, p[k - 1][1] + (p[k][1] - p[k - 1][1]) * u / 20]; if (inside(floor, q) && !near(q, a, 8) && !near(q, b, 8)) { hit = true; break; } }
        if (hit) crossing++;
      }
    }
    report[floor] = { legs, crossing, worst: +worst.toFixed(2) };
    assert.ok(legs > 50, floor + ' legs ' + legs);
    assert.equal(crossing, 0, floor + ' legs crossing furniture: ' + JSON.stringify(report[floor]));
    assert.ok(worst <= 2.3, floor + ' detour too long: ' + worst);
  }
  assert.equal(storage(), 0);
});

test('detours are deterministic, cached and leave clear legs untouched', () => {
  const detour = scene.motion.detour;
  const clear = detour('1f', [22, 30], [22, 40]);
  assert.deepEqual(JSON.parse(JSON.stringify(clear)), [[22, 30], [22, 40]]);
  const a = detour('1f', [29, 52], [16, 79]), b = detour('1f', [29, 52], [16, 79]);
  assert.strictEqual(a, b);
  assert.ok(a.length > 2, 'store counter is walked around');
  assert.deepEqual(JSON.parse(JSON.stringify(detour('9f', [1, 1], [2, 2]))), [[1, 1], [2, 2]]);
});
