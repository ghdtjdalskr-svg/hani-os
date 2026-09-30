import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = process.argv[2];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  const relative = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname).replace(/^\//, '') || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404); response.end(); return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(response);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
      await page.evaluate(() => {
        document.querySelector('#loginGate')?.style.setProperty('display', 'none', 'important');
        const app = document.querySelector('#app');
        app?.classList.remove('login-locked'); app?.setAttribute('aria-hidden', 'false');
        document.querySelector('#deployment')?.style.setProperty('display', 'block', 'important');
        document.querySelector('#deployPackageIngest').open = true;
        deployCenterInit();
      });
      const input = page.locator('#deployExistingPrNumber');
      const button = page.locator('#deployExistingPrQaBtn');
      assert(await input.isVisible(), 'existing PR number input not visible');
      assert(await button.isVisible(), 'read-only HINA button not visible');
      assert(await button.isDisabled(), 'button must require package');
      await input.fill('126');
      assert.equal(await input.inputValue(), '126');
      if (packagePath && viewport.width > 1000) {
        await page.locator('#deployPackageFile').setInputFiles(packagePath);
        await page.waitForFunction(() => document.querySelector('#deployPackageSha')?.textContent?.startsWith('PASS'), null, { timeout: 30000 });
        assert(await button.isEnabled(), 'valid frozen package should enable existing PR QA');
      }
      const size = await page.locator('.deploy-existing-pr').evaluate(node => ({ width: node.scrollWidth, client: node.clientWidth }));
      assert(size.width <= size.client + 1, 'PR controls overflow viewport');
      await page.close();
    }
    console.log('PASS: desktop/mobile existing PR QA controls, disabled gate, no overflow');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
