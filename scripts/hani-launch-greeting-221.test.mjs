// Real app, disposable browser contexts, no external/Cloud requests.
// node scripts/hani-launch-greeting-221.test.mjs [playwright/index.mjs] [msedge.exe]
// HANI_CDP_ENDPOINT can attach to an already running isolated headless browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'artifacts/launch-221');
fs.mkdirSync(out, {recursive: true});
const result = {checks: [], screenshots: [], errors: [], status: 'running'};
const runtime = process.argv[2] || path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const {chromium} = await import(pathToFileURL(runtime).href);
const server = http.createServer((req, res) => {
  const uri = decodeURIComponent(new URL(req.url, 'http://test').pathname);
  const file = path.resolve(root, '.' + (uri === '/' ? '/index.html' : uri));
  if (!file.startsWith(root + path.sep) || uri.split('/').some(s => s.startsWith('.')) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const key = 'hani_theme_settings_v1';
let browser;
const check = name => { result.checks.push(name); console.log('PASS ' + name); };
async function paintedPanel(page) {
  const panel = page.locator('#haniLaunchGreeting');
  await panel.waitFor({state:'visible'});
  await panel.locator('img').evaluate(async image => {
    await image.decode();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const paint = await panel.evaluate(panel => {
    const gate = getComputedStyle(document.getElementById('loginGate'));
    const style = getComputedStyle(panel), art = panel.querySelector('img');
    const rect = panel.getBoundingClientRect();
    const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const probe = document.createElement('canvas').getContext('2d');
    probe.fillStyle = style.backgroundColor; probe.fillRect(0, 0, 1, 1);
    return {topmost:!!top && (top === panel || panel.contains(top)), gateHidden:gate.display === 'none' || (gate.visibility === 'hidden' && Number(gate.opacity) === 0),
      opacity:style.opacity, artOpacity:getComputedStyle(art.parentElement).opacity,
      decoded:art.complete && art.naturalWidth === 1600, alpha:probe.getImageData(0,0,1,1).data[3]};
  });
  assert.deepEqual(paint, {topmost:true,gateHidden:true,opacity:'1',artOpacity:'1',decoded:true,alpha:255}, 'decoded greeting painted opaque above hidden gate');
  return panel;
}
async function fixture({hour = 9, width = 390, finish = 'pure-white', reduced = false, prefs, throwing, failSession = false, delay = 0, broken = false, timezone = 'America/Los_Angeles', force = true} = {}) {
  const context = await browser.newContext({viewport: {width, height: 1000}, timezoneId: timezone, reducedMotion: reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block'});
  const requests = [], errors = [];
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) {
      await route.fulfill({status: 200, contentType: route.request().resourceType()==='stylesheet' ? 'text/css' : 'text/javascript', body: ''}); return;
    }
    if (url.pathname.startsWith('/assets/launch/')) {
      requests.push(url.pathname);
      if (delay) await new Promise(r => setTimeout(r, delay));
      if (broken) { await route.fulfill({status:200, contentType:'image/webp', body:'invalid image'}); return; }
    }
    await route.continue();
  });
  await context.addInitScript(({key, prefs, finish, force}) => {
    window.__HANI_LAUNCH_GREETING_FORCE__ = force;
    localStorage.setItem('hani_os_signature_finish_v1', finish);
    if (prefs) localStorage.setItem(key, JSON.stringify(prefs));
  }, {key, prefs, finish, force});
  if (throwing) {
    await context.addInitScript(({key, throwing, failSession}) => {
      for (const method of throwing === 'write' ? ['setItem'] : ['getItem','setItem']) {
        const native = Storage.prototype[method];
        Storage.prototype[method] = function(k, ...args) { if (k === key && (this === localStorage || failSession)) throw new DOMException('UI storage denied', 'SecurityError'); return native.call(this, k, ...args); };
      }
    }, {key, throwing, failSession});
  }
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date(`2026-10-20T${String(hour).padStart(2,'0')}:00:00+09:00`));
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  page.on('dialog', d => d.dismiss());
  await page.goto(origin);
  await page.waitForFunction(() => typeof loginGateInitialized === 'boolean' && loginGateInitialized);
  await page.evaluate(() => {
    window.launchLifeBefore = localStorage.getItem('hani_os_life_v23');
    window.launchLifeWrites = [];
    for (const method of ['setItem','removeItem','clear']) {
      const native = Storage.prototype[method];
      Storage.prototype[method] = function(k, ...args) { if (k === 'hani_os_life_v23' || method === 'clear') launchLifeWrites.push(method); return native.call(this, k, ...args); };
    }
    window.launchBeforeGateHidden = false;
    const gate = document.getElementById('loginGate');
    const native = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = function(...args) {
      if (this.src.includes('/assets/launch/')) {
        const style = getComputedStyle(gate);
        if (style.display !== 'none' && (style.visibility !== 'hidden' || Number(style.opacity) !== 0)) window.launchBeforeGateHidden = true;
      }
      return native.apply(this, args);
    };
  });
  assert.equal(await page.locator('#haniLaunchGreeting').count(), 0);
  assert.equal(requests.length, 0, 'no launch image before unlock');
  const unlock = () => page.evaluate(() => unlockLoginGate());
  async function verify() {
    await page.waitForTimeout(50);
    assert.deepEqual(await page.evaluate(() => ({writes: launchLifeWrites, same: launchLifeBefore === localStorage.getItem('hani_os_life_v23')})), {writes: [], same: true});
    assert.deepEqual(errors, [], 'no console or JS errors');
    assert.equal(await page.evaluate(() => launchBeforeGateHidden), false, 'no launch decode during gate fade');
    await context.close();
  }
  return {page, context, requests, unlock, verify};
}
try {
  browser = process.env.HANI_CDP_ENDPOINT ? await chromium.connectOverCDP(process.env.HANI_CDP_ENDPOINT) : await chromium.launch({headless: true, executablePath: process.argv[3] || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  {
    const f = await fixture({force:false});
    assert.equal(await f.page.evaluate(() => navigator.webdriver),true,'real automation detection is active');
    await f.unlock(); await f.page.waitForFunction(() => {
      const gate = getComputedStyle(document.getElementById('loginGate'));
      return gate.visibility === 'hidden' && Number(gate.opacity) === 0;
    });
    await f.page.waitForTimeout(900);
    assert.equal(f.requests.length,0);assert.equal(await f.page.locator('#haniLaunchGreeting').count(),0);
    assert.equal(await f.page.evaluate(key=>localStorage.getItem(key),key),null,'no seen write on suppressed automation');
    await f.verify();check('webdriver without force: unlocked app, no launch request/overlay/prefs write');
  }
  for (const width of [390, 884, 1440]) for (const finish of ['pure-white','midnight-black']) for (const hour of [9,23]) {
    const f = await fixture({width, finish, hour});
    await f.unlock();
    const panel = await paintedPanel(f.page);
    assert.equal(await panel.getAttribute('role'), 'dialog');
    assert.ok(await panel.getAttribute('aria-label'));
    assert.match(await panel.locator('h2').innerText(), /회장님/);
    const scene = hour === 23 ? 'night' : 'day';
    assert.deepEqual(f.requests, [`/assets/launch/chibi-launch-v1-${scene}.webp`]);
    const image = await panel.locator('img').evaluate(e => ({width:e.naturalWidth, fit:getComputedStyle(e).objectFit}));
    assert.equal(image.width,1600); assert.equal(image.fit,'contain');
    assert.equal(await panel.evaluate(e => e.scrollWidth <= e.clientWidth), true);
    const theme = finish === 'pure-white' ? 'light' : 'dark';
    const shot = `launch-${width}-${theme}-${scene}.png`;
    await f.page.screenshot({path:path.join(out,shot),animations:'disabled'}); result.screenshots.push(shot);
    await panel.click({position:{x:10,y:10}});
    await panel.waitFor({state:'hidden'});
    { const focused = await f.page.evaluate(() => { const a = document.activeElement; return {body: a === document.body, visible: !!a?.getClientRects().length, id: a?.id || a?.tagName}; }); assert.equal(focused.body, false, 'focus returns to a page element, not body'); assert.equal(focused.visible, true, 'restored focus target is visible ' + focused.id); }
    await f.verify();
    check(`${width} ${theme} ${scene}: unlock, chosen decode, layout, tap/focus, life untouched, console clean`);
  }
  for (const focus of ['control','body']) {
    const f = await fixture({delay:100});
    const requested = f.page.waitForRequest(/assets\/launch/);
    await f.unlock(); await requested;
    await f.page.evaluate(focus => {
      if (focus === 'body') document.activeElement.blur();
      else {
        const button = document.createElement('button'); button.id = 'launchPreviousFocus';
        button.textContent = '이전 포커스'; document.getElementById('app').append(button); button.focus();
      }
    }, focus);
    await paintedPanel(f.page); await f.page.keyboard.press('Escape');
    { const a = await f.page.evaluate(() => ({id: document.activeElement.id, body: document.activeElement === document.body, visible: !!document.activeElement.getClientRects().length})); if (focus === 'body') { assert.equal(a.body, false, 'fallback focus is a page element'); assert.equal(a.visible, true, 'fallback focus is visible'); } else assert.equal(a.id, 'launchPreviousFocus'); }
    await f.verify(); check(`${focus}: previous focus restored or main title fallback`);
  }
  {
    const f = await fixture(); await f.unlock();
    await f.page.locator('#haniLaunchGreeting').waitFor({state:'visible'});
    await f.page.keyboard.press('Escape');
    assert.equal(await f.page.locator('#haniLaunchGreeting').isVisible(),false);
    await f.page.reload(); await f.page.waitForFunction(() => loginGateInitialized);
    await f.unlock(); await f.page.waitForTimeout(900);
    assert.equal(await f.page.locator('#haniLaunchGreeting').count(),0,'second open same day');
    await f.page.clock.setFixedTime(new Date('2026-10-21T09:00:00+09:00'));
    await f.page.reload(); await f.page.waitForFunction(() => loginGateInitialized); await f.unlock();
    await f.page.locator('#haniLaunchGreeting').waitFor({state:'visible'});
    await f.page.keyboard.press('x');
    assert.equal(await f.page.locator('#haniLaunchGreeting').isVisible(),false);
    // New page instrumentation after reload for protected storage evidence.
    assert.equal(await f.page.evaluate(() => localStorage.getItem('hani_os_life_v23')),null);
    await f.context.close(); check('Esc/any key; persisted same-day suppression and next-day open (KST in US timezone)');
  }
  for (const hour of [0,5,6,12,18,21,22]) {
    const f = await fixture({hour}); await f.unlock(); const p=f.page.locator('#haniLaunchGreeting'); await p.waitFor({state:'visible'});
    assert.match(await p.locator('img').getAttribute('src'), hour>=21||hour<6 ? /night/ : /day/);
    const word=hour>=6&&hour<12?'아침':hour>=12&&hour<18?'오후':hour>=18&&hour<22?'저녁':'밤';
    assert.ok((await p.locator('h2').innerText()).includes(word)); await f.page.keyboard.press('Enter'); await f.verify();
  } check('KST midnight / 05:00 / 06:00 / afternoon / evening / 21:00 / late-night boundaries');
  for (const reduced of [false,true]) {
    const f=await fixture({reduced}); await f.unlock(); const p=f.page.locator('#haniLaunchGreeting'); await p.waitFor({state:'visible'});
    const began=Date.now();
    if(reduced) assert.equal(await p.evaluate(e=>getComputedStyle(e).animationName),'none');
    await p.waitFor({state:'hidden'}); const elapsed=Date.now()-began;
    assert.ok(elapsed>=(reduced?1000:1850)&&elapsed<=(reduced?1700:2600),`dismiss ${elapsed}ms`);
    assert.equal(await f.page.getByRole('dialog',{name:'HANI 직원들의 짧은 인사'}).count(),0);
    await f.verify(); check(`${reduced?'reduced static 1.2s':'animated <=2.2s'} auto-dismiss and accessibility removal`);
  }
  for (const {throwing,failSession} of [{throwing:'both',failSession:false},{throwing:'write',failSession:false},{throwing:'both',failSession:true}]) {
    const f=await fixture({throwing,failSession}); await f.unlock(); await f.page.locator('#haniLaunchGreeting').waitFor({state:'visible'}); await f.page.keyboard.press('Escape');
    await f.page.evaluate(()=>{lockLoginGate();unlockLoginGate()}); await f.page.waitForTimeout(900);
    assert.equal(f.requests.length,1); await f.verify();
    // Keep the browser tab's sessionStorage while opening a new document on the next day.
    const persistent=await fixture({throwing,failSession});await persistent.unlock();await persistent.page.locator('#haniLaunchGreeting').waitFor({state:'visible'});await persistent.page.keyboard.press('Escape');
    await persistent.page.clock.setFixedTime(new Date('2026-10-21T09:00:00+09:00'));
    await persistent.page.reload();await persistent.page.waitForFunction(()=>loginGateInitialized);await persistent.unlock();await persistent.page.waitForTimeout(900);
    if (failSession) {
      await persistent.page.locator('#haniLaunchGreeting').waitFor({state:'visible'});
      await persistent.page.keyboard.press('Escape');
      await persistent.page.evaluate(()=>{lockLoginGate();unlockLoginGate()});await persistent.page.waitForTimeout(900);
    }
    assert.equal(persistent.requests.length,failSession?2:1,failSession?'both stores denied: at most once per page load':'localStorage failure must not repeat across reload in the same tab session');
    assert.equal(await persistent.page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),null);
    await persistent.context.close();check(`storage throwing ${throwing}, session denied ${failSession}: ${failSession?'once per page load':'session once including reload'}, clean errors/life`);
  }
  {
    const f=await fixture({prefs:{launchEnabled:false}}); await f.unlock(); await f.page.waitForTimeout(900); assert.equal(f.requests.length,0);
    await f.page.evaluate(()=>showView('aura')); const toggle=f.page.getByRole('switch',{name:'앱 시작 인사 (치비툰)'});
    assert.equal(await toggle.isChecked(),false); await toggle.check(); await toggle.uncheck();
    assert.equal(await f.page.evaluate(key=>JSON.parse(localStorage.getItem(key)).launchEnabled,key),false);
    await f.verify(); check('Theme Studio switch off, on/off through canonical key; disabled means no image');
  }
  for (const mode of ['before','during','relock','popup','native']) {
    const f=await fixture({delay:mode==='during'?300:0});
    if(mode==='before') await f.page.evaluate(()=>{document.getElementById('spendPurchaseModal').classList.add('open')});
    if(mode==='popup') await f.page.evaluate(()=>{const p=document.createElement('aside');p.className='popup';p.textContent='기존 팝업';document.body.append(p)});
    if(mode==='native') await f.page.evaluate(()=>document.getElementById('recordDeleteDialog').showModal());
    const pendingArt = mode==='during' ? f.page.waitForRequest(/assets\/launch/) : null;
    await f.unlock();
    if(pendingArt) {await pendingArt; await f.page.evaluate(()=>document.getElementById('recordDeleteDialog').showModal());}
    if(mode==='relock') {await f.page.locator('#haniLaunchGreeting').waitFor({state:'visible'});await f.page.evaluate(()=>lockLoginGate());}
    await f.page.waitForTimeout(950); assert.equal(await f.page.locator('#haniLaunchGreeting').isVisible(),false);
    if(mode!=='relock') {await f.page.evaluate(()=>{document.getElementById('spendPurchaseModal').classList.remove('open');document.getElementById('recordDeleteDialog').close();document.querySelector('.popup')?.remove()});await f.page.waitForTimeout(100);assert.equal(await f.page.locator('#haniLaunchGreeting').isVisible(),false)}
    await f.verify(); check(`blocking UI ${mode}: no overlap/retry`);
  }
  for(const options of [{delay:1000},{broken:true}]) {
    const f=await fixture(options); await f.unlock(); await f.page.waitForTimeout(1250);
    assert.equal(await f.page.locator('#haniLaunchGreeting').count(),0);
    assert.equal(await f.page.evaluate(key=>localStorage.getItem(key),key),null); await f.verify();
  } check('800ms image timeout / invalid image silently skip without seen write');
  result.status='pass';
} catch(error) {
  result.status=/spawn EPERM|connect ECONNREFUSED/.test(error.message)?'blocked':'failed';result.errors.push(error.stack);console.error(error);process.exitCode=1;
} finally {
  await browser?.close(); await new Promise(r=>server.close(r));
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2)+'\n');
}
