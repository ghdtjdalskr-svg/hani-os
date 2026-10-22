// node scripts/hani-desk-mascots.test.mjs [--unit]
// Browser default: real office + production index; local-only, synthetic clock/data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const out = path.join(root, 'artifacts/desk-mascots');
const catalog = JSON.parse(read('assets/data/desk-mascots-v1.json'));
const plan = JSON.parse(read('artifacts/desk-mascots/runtime-plan.json')).placements;
const art = JSON.parse(read('data/hani-building/art-map-v1.json'));
const canon = JSON.parse(read('data/hani-building/spatial-contract.json'));
const source = read('hani-desk-mascots.js');
const html = read('index.html');
const report = { result: 'running', scope: process.argv.includes('--unit') ? 'DOM execution, no pixel claims' : 'real browser', checks: [], errors: [], screenshots: [] };
const save = () => fs.writeFileSync(path.join(out, process.argv.includes('--unit') ? 'runtime-unit.json' : 'browser-results.json'), JSON.stringify(report, null, 2) + '\n');

function metadataChecks() {
  assert.deepEqual(Object.keys(catalog.staff).sort(), canon.people.filter(p => p.id !== 'seongmin').map(p => p.id).sort());
  assert.equal(Object.keys(catalog.staff).length, 19);
  for (const p of plan) {
    const entry = catalog.staff[p.id], anchor = art.anchors[entry.anchor];
    assert.equal(entry.anchor, canon.people.find(person => person.id === p.id).homeAnchor);
    assert.equal(entry.floor, p.floor);
    assert.equal(canon.anchors.find(a => a.id === entry.anchor).floor, p.floor);
    assert.ok(Math.abs((anchor.x + entry.offset[0]) / 100 * 1672 - p.foot[0]) < .001);
    assert.ok(Math.abs((anchor.y + entry.offset[1]) / 100 * 941 - p.foot[1]) < .001);
    assert.ok(p.foot[0] >= p.deskBounds[0] && p.foot[0] <= p.deskBounds[2] && p.foot[1] >= p.deskBounds[1] && p.foot[1] <= p.deskBounds[3]);
    // Actual compressed source headers, rather than a filename/manifest assertion.
    const bytes = fs.readFileSync(path.join(root, 'assets/data', entry.file));
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    if (bytes.toString('ascii', 12, 16) === 'VP8L') {
      assert.equal(bytes[20], 0x2f);
      const bits = bytes.readUInt32LE(21);
      assert.equal((bits & 0x3fff) + 1, 72);
      assert.equal(((bits >>> 14) & 0x3fff) + 1, 72);
      assert.ok(bits & 0x10000000, 'transparent lossless source');
    } else {
      assert.equal(bytes.toString('ascii', 12, 16), 'VP8X');
      assert.equal(bytes.readUIntLE(24, 3) + 1, 72);
      assert.equal(bytes.readUIntLE(27, 3) + 1, 72);
      assert.ok(bytes[20] & 16, 'transparent source');
    }
  }
  const measured = JSON.parse(read('artifacts/desk-mascots/placements.json')).placements;
  for (const p of measured) assert.deepEqual(plan.find(item => item.id === p.id).foot, [p.figureBox[0] + 14, p.figureBox[1] + 28]);
  assert.doesNotMatch(source, /localStorage|sessionStorage|supabase|\.id\s*=(?!=)|setAttribute\(['"]id/);
  assert.ok(html.indexOf('src="./hani-desk-mascots.js"') > html.indexOf('src="./hani-office-live.js'));
  assert.ok(html.indexOf('href="./hani-desk-mascots.css"') > html.indexOf('href="./hani-office-live.css'));
  report.checks.push('19 original staff IDs/home anchors, 13 approved measured positions + 6 art-map desk positions; 72x72 alpha headers; no new literal IDs/storage APIs; module load order');
}

async function unitChecks() {
  const { fixture } = await import('./hani-building-206-engine.test.mjs');
  const f = fixture('10:00', true, () => true);
  await new Promise(resolve => setTimeout(resolve, 0));
  const prototype = Object.getPrototypeOf(f.map);
  prototype.hasAttribute = function (name) { return name === 'src' ? !!this.src : this.getAttribute(name) !== null; };
  prototype.decode = async function () { this.naturalWidth = 72; this.naturalHeight = 72; };
  f.map.clientWidth = 1440;
  const callbacks = [];
  f.context.MutationObserver = class { constructor(cb) { callbacks.push(cb); } observe() {} };
  f.context.ResizeObserver = class { constructor(cb) { callbacks.push(cb); } observe() {} };
  f.context.fetch = async () => ({ ok: true, json: async () => catalog });
  f.context.URL = URL;
  f.context.location = { href: 'https://hani.test/' };
  f.context.localStorage = f.context.sessionStorage = new Proxy({}, { get() { throw Error('storage access'); } });
  const actorNodes = [...f.ids.get('haniOfficeActors').children];
  vm.runInContext(source, f.context);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(f.map.querySelectorAll('.hani-desk-mascots').length, 0, 'catalog can resolve before the async office API');
  f.context.window.HaniBuildingScene = f.context.HaniBuildingScene;
  callbacks.forEach(cb => cb());
  const layers = [...f.map.querySelectorAll('.hani-desk-mascots')];
  const images = [...f.map.querySelectorAll('.hani-desk-mascot')];
  assert.equal(layers.length, 5); assert.equal(images.length, 19);
  assert.ok(images.filter(i => i.parentElement.dataset.floor !== '4f').every(i => !i.src), 'inactive floors never request art');
  assert.ok(images.every(i => !i.dataset.ready), 'nothing shown before decode');
  for (const floor of ['1f', '2f', '3f', '4f', '5f', '2f']) {
    f.click(floor); await new Promise(resolve => setTimeout(resolve, 0));
    callbacks.forEach(cb => cb());
    assert.equal(layers.filter(l => !l.hidden).length, 1);
    assert.equal(layers.find(l => !l.hidden).dataset.floor, floor);
    for (const image of images.filter(i => !i.parentElement.hidden)) {
      await image.events.load();
      assert.equal(image.dataset.ready, 'true');
      const p = plan.find(p => p.id === image.dataset.person);
      assert.ok(Math.abs(parseFloat(image.style.left) / 100 * 1672 - p.foot[0]) < .001);
      assert.ok(Math.abs(parseFloat(image.style.top) / 100 * 941 - p.foot[1]) < .001);
    }
    assert.deepEqual(f.map.querySelectorAll('.hani-desk-mascot'), images);
    assert.deepEqual(f.ids.get('haniOfficeActors').children, actorNodes);
  }
  for (const id of ['daon', 'yoonseul']) assert.equal(images.find(i => i.dataset.person === id).dataset.planned, 'true');
  const old = images[0].decode;
  images[0].decode = async () => { throw Error('decode failure'); }; delete images[0].dataset.ready;
  await images[0].events.load(); assert.equal(images[0].dataset.ready, undefined); images[0].decode = old;
  f.hide(); callbacks.forEach(cb => cb()); assert.ok(layers.every(l => l.hidden));
  f.show(); callbacks.forEach(cb => cb()); assert.equal(layers.filter(l => !l.hidden).length, 1);
  f.document.hidden = true; f.document.events.visibilitychange(); assert.ok(layers.every(l => l.hidden));
  f.document.hidden = false; f.map.dataset.art = 'fallback'; callbacks.forEach(cb => cb()); assert.ok(layers.every(l => l.hidden));
  vm.runInContext(source, f.context); assert.equal(f.map.querySelectorAll('.hani-desk-mascots').length, 5);
  report.checks.push('executed actual module + office renderer: persistent 5 layers/19 figures/actors; lazy inactive floors; decode-before-show/failure; all floor switches; two reserved seats; hidden document/view/fallback; double-load guard; throwing storage sentinels untouched');
}

async function browserChecks() {
  let browser, server;
  try {
    const runtime = process.env.HANI_PLAYWRIGHT_PATH || path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
    const { chromium } = await import(pathToFileURL(runtime).href);
    browser = await chromium.launch({ headless: true, executablePath: process.env.HANI_CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    const start = html.indexOf('<section class="hani-office-live"'), end = html.indexOf('</section>', start) + 10;
    assert.ok(start > 0 && end > start);
    const fixture = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/hani-office-live.css"><link rel="stylesheet" href="/hani-desk-mascots.css"><style>body{margin:0;font-family:'Malgun Gothic',sans-serif}[hidden]{display:none!important}.hani-office-live{padding:0;border:0}.hani-office-map{border:0;border-radius:0}</style><div class="view active">${html.slice(start, end)}</div><script src="/hani-organization-hub.js"></script><script src="/hani-office-live.js"></script><script src="/hani-desk-mascots.js"></script></html>`;
    server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://local');
      if (url.pathname === '/office-fixture') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(fixture); return; }
      const name = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const file = path.resolve(root, '.' + name);
      if (!file.startsWith(root + path.sep) || name.split('/').some(p => p.startsWith('.')) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
      res.end(fs.readFileSync(file));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    for (const mode of ['office', 'app']) for (const width of [390, 884, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1250 }, timezoneId: 'Asia/Seoul', reducedMotion: 'reduce' });
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.fulfill({ status: 200, body: '' }));
      if (mode === 'office') await context.addInitScript(() => {
        window.mascotWrites = [];
        for (const method of ['setItem', 'removeItem', 'clear']) Storage.prototype[method] = function () { mascotWrites.push(method); throw Error('storage write forbidden'); };
      });
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.clock.install({ time: new Date('2026-10-22T10:00:00+09:00') });
      await page.goto(origin + (mode === 'office' ? '/office-fixture' : '/'));
      await page.waitForFunction(() => window.HaniBuildingScene && document.querySelectorAll('.hani-desk-mascot').length === 19);
      if (mode === 'app') await page.evaluate(() => {
        unlockLoginGate(); showView('agentReview'); window.mascotWrites = [];
        for (const method of ['setItem', 'removeItem', 'clear']) Storage.prototype[method] = function () { mascotWrites.push(method); throw Error('storage write forbidden'); };
      });
      await page.evaluate(() => { window.mascotSlots = [...document.querySelectorAll('.hani-desk-mascots,.hani-desk-mascot')]; });
      for (const floor of ['1f', '2f', '3f', '4f', '5f']) {
        await page.locator(`[data-building-floor="${floor}"]`).click();
        await page.waitForFunction(floor => {
          const map = document.getElementById('haniOfficeMap'), layers = [...map.querySelectorAll('.hani-desk-mascots')];
          const active = layers.find(layer => !layer.hidden);
          return map.dataset.art === 'floor' && active?.dataset.floor === floor && [...active.children].every(img => img.dataset.ready === 'true');
        }, floor);
        const geometry = await page.evaluate(() => {
          const map = document.getElementById('haniOfficeMap'), rect = map.getBoundingClientRect(), style = getComputedStyle(map);
          const left = rect.left + parseFloat(style.borderLeftWidth), top = rect.top + parseFloat(style.borderTopWidth);
          const box = n => { const r = n.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
          const visible = n => n.getClientRects().length > 0 && getComputedStyle(n).visibility === 'visible';
          return { map: { left, top, width: map.clientWidth, height: map.clientHeight }, figures: [...map.querySelectorAll('.hani-desk-mascot')].filter(visible).map(n => ({ id: n.dataset.person, planned: n.dataset.planned, ...box(n), pointerEvents: getComputedStyle(n).pointerEvents, loading: n.loading, under: !!document.elementFromPoint(n.getBoundingClientRect().x + n.getBoundingClientRect().width / 2, n.getBoundingClientRect().y + n.getBoundingClientRect().height / 2)?.closest('.hani-desk-mascots') })), names: [...map.querySelectorAll('.hani-office-actor:not([hidden]) .hani-office-name')].filter(visible).map(box), slotsPersistent: mascotSlots.every((n, i) => n === [...map.querySelectorAll('.hani-desk-mascots,.hani-desk-mascot')][i]), hiddenFloorsEmpty: [...map.querySelectorAll('.hani-desk-mascots[hidden] img')].every(n => !n.getClientRects().length) };
        });
        assert.deepEqual(geometry.figures.map(p => p.id).sort(), plan.filter(p => p.floor === floor).map(p => p.id).sort());
        assert.ok(geometry.slotsPersistent && geometry.hiddenFloorsEmpty);
        for (const figure of geometry.figures) {
          const p = plan.find(p => p.id === figure.id), m = geometry.map;
          assert.ok(Math.abs(figure.left + figure.width / 2 - m.left - p.foot[0] / 1672 * m.width) <= 4, `${figure.id} desk x`);
          assert.ok(Math.abs(figure.bottom - m.top - p.foot[1] / 941 * m.height) <= 4, `${figure.id} desk y`);
          assert.ok(Math.abs(figure.height - Math.max(16, m.width * 32 / 1440)) < 1, `${figure.id} target size`);
          assert.equal(figure.pointerEvents, 'none'); assert.equal(figure.loading, 'lazy'); assert.equal(figure.under, false);
          if (p.planned) assert.equal(figure.planned, 'true');
          for (const tag of geometry.names) {
            const area = Math.max(0, Math.min(figure.right, tag.right) - Math.max(figure.left, tag.left)) * Math.max(0, Math.min(figure.bottom, tag.bottom) - Math.max(figure.top, tag.top));
            // Phone tags are large relative to the map; a figure must stay at least half visible there.
            assert.ok(area / Math.min(figure.width * figure.height, tag.width * tag.height) <= (width < 600 ? .5 : .10), `${mode}/${width}/${floor}/${figure.id} name overlap`);
          }
        }
        const actor = page.locator('.hani-office-actor:not([hidden]) .hani-office-sprite').first();
        if (await actor.count()) {
          const person = await actor.locator('..').getAttribute('data-person');
          await actor.click();
          await page.locator('.hani-office-character-bubble:visible').waitFor();
          assert.ok((await page.locator('.hani-office-character-bubble p').innerText()).trim());
          assert.ok((await page.locator('.hani-office-character-bubble a').getAttribute('href')).endsWith('/' + person), 'tap still opens the selected character line');
          await actor.locator('..').press('Escape');
        }
        const screenshot = `${mode === 'app' ? 'app' : 'app-office'}-${floor}-${width}.png`;
        await page.locator('#haniOfficeLive').screenshot({ path: path.join(out, screenshot) }); report.screenshots.push(screenshot);
        report.checks.push({ mode, width, floor, ...geometry });
      }
      await page.evaluate(() => { document.querySelector('#haniOfficeLive').closest('.view').classList.remove('active'); });
      await page.waitForFunction(() => [...document.querySelectorAll('.hani-desk-mascots')].every(n => n.hidden));
      assert.deepEqual(await page.evaluate(() => mascotWrites), []);
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); }
}

try {
  metadataChecks();
  if (process.argv.includes('--unit')) await unitChecks(); else await browserChecks();
  report.result = 'pass';
} catch (error) {
  report.result = /EPERM|EACCES|spawn/.test(error.message) ? 'blocked' : 'fail';
  report.errors.push(error.message.split('Call log:')[0].trim());
  process.exitCode = 1;
} finally { save(); }
console.log(JSON.stringify(report));
