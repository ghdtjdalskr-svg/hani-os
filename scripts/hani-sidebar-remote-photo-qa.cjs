const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
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
  fs.createReadStream(file).pipe(response);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const output = path.join(os.tmpdir(), 'hani-sidebar-remote-photo-qa');
  fs.mkdirSync(output, { recursive: true });
  try {
    for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
      await page.evaluate(() => {
        document.querySelector('#loginGate')?.style.setProperty('display', 'none', 'important');
        const app = document.querySelector('#app');
        app?.classList.remove('login-locked');
        app?.setAttribute('aria-hidden', 'false');
      });
      await page.waitForSelector('#haniContextRemote .hani-remote-scene img');
      const team = await page.locator('.sidebar-team-official-photo').evaluate(image => ({
        loaded: image.complete && image.naturalWidth > 0,
        ratio: image.getBoundingClientRect().width / image.getBoundingClientRect().height,
        fit: getComputedStyle(image).objectFit,
      }));
      assert(team.loaded && team.fit === 'contain' && Math.abs(team.ratio - 1672 / 941) < .03, `${viewport.name}: team photo is cropped`);
      const brand = await page.locator('.sidebar-corporate-lockup').evaluate(node => ({ height: node.getBoundingClientRect().height, text: node.textContent }));
      assert(brand.height <= 70 && brand.text.includes('9 AGENTS'), `${viewport.name}: brand bar is not compact`);
      if (viewport.name === 'mobile') await page.locator('#mobileMenu').click();
      await page.screenshot({ path: path.join(output, `${viewport.name}-team.png`) });
      if (viewport.name === 'mobile') await page.locator('.hani-remote-mobile-trigger').click();
      for (const file of ['spring-1.jpg', 'spring-2.jpg', 'summer-1.jpg', 'summer-2.jpg', 'autumn-1.jpg', 'autumn-2.jpg', 'winter-1.jpg', 'winter-2.jpg', 'life-office-lounge-v1.jpg', 'life-book-cafe-v1.jpg', 'life-brunch-v1.jpg', 'life-media-night-v1.jpg']) {
        await page.locator('.hani-remote-scene img').evaluate((image, name) => { image.src = `./assets/context-remote/${name}`; }, file);
        const scene = await page.locator('.hani-remote-scene img').evaluate(async image => {
          await image.decode();
          const box = image.getBoundingClientRect();
          const fit = getComputedStyle(image).objectFit;
          return { loaded: image.naturalWidth > 0, fit, width: box.width, height: box.height };
        });
        assert(scene.loaded && scene.fit === 'contain' && scene.width > 0 && scene.height > 0, `${viewport.name}: ${file} is not fully shown`);
        if (file === 'autumn-1.jpg') await page.screenshot({ path: path.join(output, `${viewport.name}-remote-seasonal.png`) });
      }
      await page.screenshot({ path: path.join(output, `${viewport.name}-remote.png`) });
      assert.deepEqual(errors, [], `${viewport.name}: browser errors`);
      console.log(`${viewport.name}: team photo full aspect, compact brand bar, 12 Remote images loaded with contain`);
      await page.close();
    }
    console.log(`Screenshots: ${output}`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
