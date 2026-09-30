const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const phase = process.argv[2];
assert(['before', 'after'].includes(phase), 'usage: node scripts/hani-neutral-surface-pilot-qa.cjs before|after');
const output = path.join(os.tmpdir(), 'hani-neutral-surface-pilot');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png' };
const server = http.createServer((request, response) => {
  const relative = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname).replace(/^\//, '') || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  if (phase === 'before' && relative === 'hani-design-system.css') {
    const candidate = fs.readFileSync(file, 'utf8');
    const baseline = candidate.replace(/\/\* Neutral Surface Pilot:[\s\S]*?\*\/\r?\nbody:is\(\[data-view="home"\],\[data-view="diet"\]\)\{--ds-canvas:#f8f7f4;--season-page-glow:#e8e5de\}\r?\n/, '');
    assert.notEqual(baseline, candidate, 'pilot rule missing from CSS');
    response.end(baseline);
    return;
  }
  fs.createReadStream(file).pipe(response);
});

const selectors = {
  canvas: 'body',
  main: '#app .main',
  header: '#app .ui26-top',
  hasdaq: '#lifeMarketGrid > .home-kpi:nth-child(1)',
  health: '#lifeMarketGrid > .home-kpi:nth-child(2)',
  culture: '#lifeMarketGrid > .home-kpi:nth-child(3)',
  activity: '#lifeMarketGrid > .home-kpi:nth-child(4)',
  jispi: '#lifeMarketGrid > .home-kpi:nth-child(5)',
  learning: '#lifeMarketGrid > .home-kpi:nth-child(6)',
  dietMetric: '#bodyMetricStats .stat:first-child',
  dietCard: '#diet .grid > .card.full:first-child',
  dietStatus: '#diet .pill.health',
  sidebar: '#sidebar',
  remote: '#haniContextRemote .hani-remote-scene',
};
const readStyles = selectors => {
  const result = { season: document.documentElement.dataset.season, view: document.body.dataset.view };
  for (const [name, selector] of Object.entries(selectors)) {
    const element = document.querySelector(selector);
    if (!element) { result[name] = null; continue; }
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    result[name] = {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderColor: style.borderTopColor,
      color: style.color,
      width: Math.round(box.width),
      height: Math.round(box.height),
    };
  }
  return result;
};

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const report = {};
  try {
    for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
      await page.evaluate(() => {
        document.querySelector('#loginGate')?.style.setProperty('display', 'none', 'important');
        document.querySelector('#app')?.classList.remove('login-locked');
        document.querySelector('#app')?.setAttribute('aria-hidden', 'false');
      });
      await page.waitForFunction(() => window.HANI_UI_V02992 && window.HANI_CONTEXT_REMOTE_V1 && document.querySelector('#lifeMarketGrid > .home-kpi'));
      for (const season of ['spring', 'summer', 'autumn', 'winter']) {
        await page.evaluate(value => { document.documentElement.dataset.season = value; }, season);
        await page.waitForTimeout(300); // Let seasonal/card CSS transitions settle before sampling.
        for (const view of ['home', 'diet']) {
          await page.locator(`.nav-btn[data-view="${view}"]`).first().evaluate(node => node.click());
          await page.waitForSelector(`#${view}.view.active`);
          await page.waitForTimeout(250);
          const key = `${viewport.name}-${season}-${view}`;
          report[key] = await page.evaluate(readStyles, selectors);
          if (season === 'autumn' && phase === 'after') {
            // Pair captures in one unchanged page: only the two Pilot tokens differ.
            await page.evaluate(() => {
              const source = getComputedStyle(document.documentElement);
              for (const name of ['--ds-canvas', '--season-page-glow']) document.body.style.setProperty(name, source.getPropertyValue(name));
            });
            await page.screenshot({ path: path.join(output, `paired-before-${key}.png`) });
            await page.evaluate(() => {
              for (const name of ['--ds-canvas', '--season-page-glow']) document.body.style.removeProperty(name);
            });
            await page.screenshot({ path: path.join(output, `paired-after-${key}.png`) });
          }
        }
      }
      if (phase === 'after') {
        await page.locator('.nav-btn[data-view="investment"]').first().evaluate(node => node.click());
        await page.waitForSelector('#investment.view.active');
        assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(241, 245, 251)', `${viewport.name}: non-pilot investment canvas changed`);
        const protectedBefore = await page.evaluate(() => localStorage.getItem('hani_os_life_v23'));
        await page.locator('#theme').click();
        assert.equal(await page.evaluate(() => document.documentElement.dataset.season), 'spring', `${viewport.name}: theme button did not cycle`);
        assert.equal(await page.evaluate(() => localStorage.getItem('hani_os_season_theme_v1')), 'spring', `${viewport.name}: theme preference not saved`);
        assert.equal(await page.evaluate(() => localStorage.getItem('hani_os_life_v23')), protectedBefore, `${viewport.name}: protected data changed`);
        await page.reload({ waitUntil: 'load' });
        assert.equal(await page.evaluate(() => document.documentElement.dataset.season), 'spring', `${viewport.name}: theme choice did not survive reload`);
      }
      assert.deepEqual(errors, [], `${viewport.name}: browser errors`);
      await context.close();
    }
    fs.writeFileSync(path.join(output, `${phase}-styles.json`), JSON.stringify(report, null, 2));
    console.log(`${phase}: ${Object.keys(report).length} screen/season samples; screenshots and styles in ${output}`);
    if (phase === 'after') {
      const before = JSON.parse(fs.readFileSync(path.join(output, 'before-styles.json'), 'utf8'));
      for (const [key, current] of Object.entries(report)) {
        const previous = before[key];
        assert(previous, `${key}: missing baseline`);
        for (const name of ['hasdaq', 'health', 'culture', 'activity', 'jispi', 'learning', 'dietMetric', 'dietCard', 'dietStatus', 'sidebar', 'remote']) {
          if (!previous[name] || !current[name]) continue;
          for (const property of ['backgroundColor', 'backgroundImage', 'borderColor', 'color']) {
            assert.equal(current[name][property], previous[name][property], `${key}: ${name}.${property} changed`);
          }
        }
        for (const name of ['canvas', 'main']) {
          assert.notEqual(current[name].backgroundImage, previous[name].backgroundImage, `${key}: ${name} retained seasonal glow`);
        }
      }
      for (const viewport of ['desktop', 'mobile']) for (const view of ['home', 'diet']) {
        const colors = ['spring', 'summer', 'autumn', 'winter'].map(season => report[`${viewport}-${season}-${view}`].canvas.backgroundColor);
        assert.equal(new Set(colors).size, 1, `${viewport}-${view}: canvas still changes by season`);
      }
      console.log('Card, status, sidebar, and Remote computed colors unchanged.');
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
