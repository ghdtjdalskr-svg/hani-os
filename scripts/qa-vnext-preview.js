const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const output = path.resolve('artifacts/vnext-preview');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
  const results = [];
  for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile-390', width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    await page.goto('http://127.0.0.1:8771/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const gate = document.querySelector('#loginGate');
      if (gate) gate.style.setProperty('display', 'none', 'important');
      const app = document.querySelector('#app');
      app?.classList.remove('login-locked');
      app?.setAttribute('aria-hidden', 'false');
      if (typeof renderAll === 'function') renderAll();
    });
    for (const view of ['aiTeam', 'game', 'movie', 'study', 'intake']) {
      await page.evaluate(id => {
        document.querySelectorAll('.view').forEach(x => x.classList.toggle('active', x.id === id));
        document.querySelectorAll('.nav-btn').forEach(x => x.classList.toggle('active', x.dataset.view === id));
      }, view);
      await page.waitForTimeout(180);
      await page.screenshot({ path: path.join(output, `${viewport.name}-${view}.png`), fullPage: true });
    }
    await page.evaluate(() => document.querySelector('[data-sports-tab="kia"]')?.click());
    await page.waitForTimeout(80);
    const sports = await page.evaluate(() => ({
      activeTab: document.querySelector('.sports-view-tabs .active')?.dataset.sportsTab,
      visiblePanels: [...document.querySelectorAll('#game [data-sports-panel]')].filter(x => !x.hidden).map(x => x.dataset.sportsPanel),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    const yuna = await page.evaluate(() => ({
      parsed: window.HANI_YUNA_HELPDESK?.parse('제목은 AI 패권전쟁이야 오늘 다 읽었고'),
      scrollable: (() => { const x=document.querySelector('#yunaConversation'); return !!x && getComputedStyle(x).overflowY === 'auto'; })(),
    }));
    results.push({ viewport, sports, yuna, errors });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
