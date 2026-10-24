// Usage: node scripts/hani-org-demoday-card.browser.mjs <playwright/index.mjs> <msedge.exe>
// Serves this worktree only; removes the login overlay in an isolated test page.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const [runtime, executablePath] = process.argv.slice(2);
if (!runtime || !executablePath) throw Error('Usage: node <script> <playwright index.mjs> <msedge.exe>');
const {chromium} = await import(pathToFileURL(path.resolve(runtime)).href);
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'artifacts/org-demoday');
fs.mkdirSync(out, {recursive:true});
const server = http.createServer((req, res) => {
  const uri = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (uri === '/' ? '/index.html' : uri));
  if (!file.startsWith(root) || uri.split('/').some(p => p.startsWith('.')) ||
      !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8', '.json':'application/json', '.webp':'image/webp',
    '.svg':'image/svg+xml', '.png':'image/png', '.woff2':'font/woff2'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const results = [];
let browser;
try {
  browser = await chromium.launch({executablePath, headless:true});
  for (const width of [1440, 390]) {
    const context = await browser.newContext({viewport:{width, height:1100}, reducedMotion:'reduce'});
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(origin + '/index.html#organization/overview');
    await page.waitForFunction(() => typeof loginGateInitialized !== 'undefined' && loginGateInitialized && window.HaniOrganizationHub);
    const protectedBefore = await page.evaluate(() => localStorage.getItem('hani_os_life_v23'));
    // DOM-only visual fixture: no login call, token, storage write or production change.
    await page.evaluate(() => {
      document.querySelector('#loginGate').remove();
      document.body.classList.remove('login-scroll-locked');
      const app = document.querySelector('#app');
      app.classList.remove('login-locked'); app.inert = false; app.removeAttribute('aria-hidden');
      showView('organization/overview');
    });
    const card = page.locator('.ogh-overview > .ogh-demoday-card');
    const photo = card.locator('img');
    await card.waitFor({state:'visible'});
    await photo.scrollIntoViewIfNeeded();
    await photo.evaluate(img => img.decode());
    const ownerErrors = [];
    page.on('pageerror', error => ownerErrors.push(error.message));
    for (const finish of ['pure-white', 'midnight-black', 'titanium-graphite']) {
      await page.evaluate(finish => {
        document.documentElement.dataset.finish = finish;
        document.documentElement.dataset.theme = finish === 'pure-white' ? 'light' : 'dark';
      }, finish);
      assert.equal(await card.count(), 1);
      assert.equal(await photo.getAttribute('width'), '1439');
      assert.equal(await photo.getAttribute('height'), '810');
      assert.equal(await photo.getAttribute('loading'), 'lazy');
      assert.equal(await photo.getAttribute('decoding'), 'async');
      assert.equal(await photo.getAttribute('src'), './assets/team/hani-org-demo-day-v1.webp');
      assert.equal(await photo.getAttribute('alt'), 'M9 아홉 멤버가 제품 시연 현장에서 발표·기록·검토하는 협업 장면');
      assert.deepEqual(await card.locator('figcaption span').allTextContents(), ['INSIDE HANI / DEMO DAY', 'M9 · IN ACTION']);
      assert.equal(await card.locator('.ogh-seal').innerText(), 'ONE\nTEAM\n✳');
      const metrics = await card.evaluate(el => {
        const img = el.querySelector('img'), history = el.nextElementSibling;
        const a = el.getBoundingClientRect(), b = history.getBoundingClientRect(), p = img.getBoundingClientRect();
        const seal = el.querySelector('.ogh-seal').getBoundingClientRect();
        return {height:p.height, width:p.width, decoded:img.complete && img.naturalWidth > 0,
          historyNext:history.matches('.ogh-history'), above:a.bottom <= b.top,
          overflow:document.documentElement.scrollWidth > innerWidth,
          sealInside:seal.left >= a.left && seal.right <= a.right && seal.top >= a.top && seal.bottom <= a.bottom,
          cardWidth:a.width, slotWidth:el.parentElement.clientWidth,
          imageColor:getComputedStyle(el).backgroundColor, captionColor:getComputedStyle(el.querySelector('figcaption')).color};
      });
      assert.equal(metrics.decoded, true);
      assert.ok(metrics.height > 100 && metrics.height <= 361, JSON.stringify(metrics));
      assert.equal(metrics.historyNext && metrics.above && metrics.sealInside, true, JSON.stringify(metrics));
      assert.equal(metrics.overflow, false, `${width}/${finish}: horizontal overflow`);
      if (width === 390) assert.ok(Math.abs(metrics.cardWidth - metrics.slotWidth) <= 1, 'mobile card fills slot');
      assert.equal(await page.locator('.ogh-hero,.ogh-cta').count(), 0, 'no duplicated headline/CTA');
      // Save references inside the page; later checks compare actual node identity.
      await card.evaluate(el => { window.__demodayNode = el; window.__demodayImage = el.querySelector('img'); });
      for (const tab of ['people', 'aiTeam', 'archive', 'overview', 'people', 'overview']) {
        await page.locator(`[data-organization-tab="${tab}"]`).click();
        assert.equal(await card.isVisible(), tab === 'overview', `${tab}: overview photo visibility`);
        assert.equal(await card.evaluate(el => el === window.__demodayNode && el.querySelector('img') === window.__demodayImage), true, 'persistent figure/image');
      }
      await page.evaluate(() => window.dispatchEvent(new Event('hani-ilbo-ready')));
      assert.equal(await card.evaluate(el => el === window.__demodayNode), true, 'overview update preserves card');
      assert.equal(await card.count(), 1);
      const duplicateIds = await page.locator('#haniOrganizationHub [id]').evaluateAll(nodes => {
        const ids = nodes.map(el => el.id); return ids.filter((id, i) => ids.indexOf(id) !== i);
      });
      assert.deepEqual(duplicateIds, []);
      assert.equal(await page.evaluate(() => localStorage.getItem('hani_os_life_v23')), protectedBefore);
      // Frame the photo and the start of the timeline, preserving the real page layout.
      await card.evaluate(el => window.scrollBy(0, el.getBoundingClientRect().top - 100));
      await page.screenshot({path:path.join(out, `${width}${finish === 'pure-white' ? '' : '-' + finish}.png`)});
      results.push({width, finish, ...metrics, status:'PASS'});
      console.log(`PASS DEMO DAY ${width}/${finish}: decoded, above history, no overflow, tab visibility, persistent DOM, protected key unchanged`);
    }
    assert.deepEqual(ownerErrors, [], 'no JS errors during card/tab checks');
    await context.close();
  }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({status:'PASS', url:origin, results}, null, 2) + '\n');
} catch (error) {
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({status:'NOT_VERIFIED',
    reason:error.message.split('\n')[0], results}, null, 2) + '\n');
  throw error;
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
