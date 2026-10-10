// Synthetic, localhost-only check of the proactive-care features. No real data; storage writes are recorded.
import {pathToFileURL} from 'node:url';
const [pw, exe, base, outDir] = process.argv.slice(2);
const {chromium} = await import(pathToFileURL(pw).href);
const browser = await chromium.launch({executablePath: exe, headless: true});
const results = [];
for (const [width, ua] of [[1440, null], [390, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1']]) {
  const context = await browser.newContext({viewport: {width, height: 900}, ...(ua ? {userAgent: ua} : {})});
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(() => {
    window.__writes = [];
    const set = Storage.prototype.setItem, rem = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (k, v) { window.__writes.push('set:' + k); return set.call(this, k, v); };
    Storage.prototype.removeItem = function (k) { window.__writes.push('rm:' + k); return rem.call(this, k); };
  });
  await page.goto(base + '/index.html');
  await page.waitForTimeout(1500);
  const r = await page.evaluate(async () => {
    if (typeof unlockLoginGate === 'function') unlockLoginGate();
    const writesBefore = window.__writes.length;
    // synthetic in-memory state only (never saved)
    const today = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Asia/Seoul'}).format(new Date());
    const d = n => { const x = new Date(today + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() - n); return x.toISOString().slice(0, 10); };
    state.profile.heightCm = 188;
    state.body = [{date: d(40), weight: 98}, {date: d(25), weight: 96.5}, {date: d(10), weight: 95.2}, {date: d(1), weight: 94.6}].map(x => ({...x, id: 'b' + x.date}));
    const p = careKoreaPeriod();
    state.goalRegistry = [{id: 'g1', metric_id: 'body_bmi', goal_type: 'quarter', year: p.year, quarter: p.quarter, value: 25, effective_from: d(30), effective_to: '2099-12-31', created_at: new Date(Date.now() - 30 * 86400000).toISOString(), status: 'active', revision: 1}];
    const out = {};
    showView('diet'); renderBody(); await new Promise(r => setTimeout(r, 400));
    out.diet = document.querySelector('#diet [data-diet-pace]')?.innerText.replace(/\n+/g, ' | ').slice(0, 400) || null;
    showView('settings'); renderStoragePanel(); await new Promise(r => setTimeout(r, 400));
    out.kickoff = [...document.querySelectorAll('#goalRegistryContent .note h3')].map(e => e.innerText);
    const btn = document.querySelector('[data-quarter-goal]');
    if (btn) { btn.click(); const f = document.getElementById('goalRegistryForm').elements; out.kickoffPrefill = {metric: f.metric_id.value, type: f.goal_type.value, quarter: f.quarter.value}; }
    out.cloudCard = document.querySelector('[data-cloud-transfer]')?.innerText.replace(/\n+/g, ' | ') || null;
    out.storageNotice = !!document.querySelector('#settings .hani-care-notice');
    showView('home'); await new Promise(r => setTimeout(r, 400));
    out.homeNotice = !!document.querySelector('#home .hani-care-notice');
    out.checklist17 = haniCareChecklist(today.slice(0, 8) + '17');
    out.checklist10 = haniCareChecklist(today.slice(0, 8) + '10');
    // re-render twice: no duplicated cards
    renderHome(); renderHome(); renderBody(); renderBody();
    out.dupHomeNotice = document.querySelectorAll('#home .hani-care-notice').length;
    out.dupDietCard = document.querySelectorAll('#diet [data-diet-pace]').length;
    out.newWrites = window.__writes.slice(writesBefore).filter(k => !/hani_os_navigation_v1/.test(k));
    return out;
  });
  r.width = width; r.ios = !!ua; r.errors = errors.slice(0, 3);
  await page.screenshot({path: `${outDir}/care-${width}.png`});
  results.push(r);
  await context.close();
}
console.log(JSON.stringify(results, null, 1));
await browser.close();
