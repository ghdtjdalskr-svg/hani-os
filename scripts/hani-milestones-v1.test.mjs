// node scripts/hani-milestones-v1.test.mjs [playwright/index.mjs] [browser.exe]
// Node checks always run. Browser checks run only when Playwright and a browser are given.
// Synthetic UI only: the login overlay is hidden, no account is used, nothing is saved.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const code = read('hani-milestones.js'), html = read('index.html'), main = read('hani-main.js');
const plain = value => JSON.parse(JSON.stringify(value));
let writes = 0;
const failWrite = () => { writes++; throw Error('Unexpected write'); };
const context = vm.createContext({window:{}, console, Date, Intl, Map, Set, localStorage:{setItem:failWrite, removeItem:failWrite, clear:failWrite}, sessionStorage:{setItem:failWrite, removeItem:failWrite, clear:failWrite}});
vm.runInNewContext(read('hani-organization-hub.js'), {window:context.window, document:{getElementById:() => null}});
vm.runInContext(code, context);
const api = context.window.HaniMilestones;
const agents = plain(context.window.HaniOrganizationRoster.people).map(x => x.id);
const navViews = [...html.matchAll(/class="nav-btn[^"]*" data-view="([^"]+)"/g)].map(m => m[1]);
const seed = plain(api.SEED)[0];
let passed = 0;
function check(name, run) { run(); passed++; console.log('PASS', name); }
const valid = (patch = {}) => ({...plain(seed), id:'milestone_test_20261024', source:'manual', ...patch});

// ---- Catalog / data ----
check('exactly one seed milestone, verbatim chairman values', () => {
  assert.equal(api.SEED.length, 1);
  assert.deepEqual(plain(api.seedErrors), []);
  assert.equal(seed.id, 'milestone_health_20261023');
  assert.equal(seed.date, '2026-10-23');
  assert.equal(seed.title, 'HANI OS 건강혁명 프로젝트');
  assert.equal(seed.category, 'HEALTH'); assert.equal(seed.importance, 'HISTORIC'); assert.equal(seed.source, 'seed');
  assert.equal(seed.summary, '어제보다 나은 삶이 숫자로 확인된 날.');
  assert.deepEqual(seed.metrics.map(x => [x.label, x.before, x.after, x.change]), [
    ['체중','122.8kg','95.62kg','-27.18kg'],['혈당','211','91mg/dL',null],['HbA1c',null,'5.3%',null],['중성지방','430','101',null],
    ['총콜레스테롤','271','166',null],['LDL','223','108',null],['AST','132','12',null],['ALT','99','10',null],['감마GTP','95','14',null]]);
  assert.ok(seed.metrics.every(x => x.unit === null), 'no unit invented');
  assert.deepEqual(seed.agents, ['naeun','hani']);
  assert.deepEqual(seed.agentComments.map(x => x.agent), ['naeun','hani']);
  assert.match(seed.agentComments[0].text, /우리 회장님, 정말 많이 해냈어요\.$/);
  assert.match(seed.agentComments[1].text, /성민의 삶에 배포된 가장 중요한 업데이트 중 하나다\.$/);
  assert.deepEqual(seed.tags, ['건강혁명','체중감량','혈당','대사건강','HANI OS']);
  assert.equal(seed.nextGoals.length, 9); assert.equal(seed.nextGoals[8], '결석 재발 예방');
  assert.deepEqual(seed.images, []);
  assert.ok(Object.isFrozen(api.SEED[0].metrics[0]), 'seed source is immutable');
});
check('category, importance and grade enums are config based', () => {
  assert.deepEqual(plain(api.CATEGORIES).map(x => x.id), ['HEALTH','FINANCE','INVESTMENT','STUDY','CAREER','LIFE','TRAVEL','RELATIONSHIP','PROJECT','OTHER']);
  assert.deepEqual(plain(api.CATEGORIES).map(x => x.label), ['건강','재무','투자','공부','커리어','생활','여행','관계','프로젝트','기타']);
  assert.deepEqual(plain(api.IMPORTANCE).map(x => x.id), ['NORMAL','MAJOR','HISTORIC']);
  assert.deepEqual(plain(api.GRADES).map(x => x.id), ['RARE','EPIC','LEGENDARY']);
  assert.match(api.validate(valid({category:'GAME'})).join(), /분야/);
  assert.match(api.validate(valid({importance:'LEGENDARY'})).join(), /중요도/);
  assert.match(api.validate(valid({grade:'MYTHIC'})).join(), /난이도/);
  assert.deepEqual(plain(api.validate(valid({grade:null}))), [], 'grade is optional');
});
check('duplicate id blocked and next id never collides', () => {
  assert.match(api.validate(valid({id:seed.id}), {ids:[seed.id]}).join(), /이미 있어요/);
  assert.equal(api.nextId('HEALTH', '2026-10-23', [seed.id]), 'milestone_health_20261023_2');
  assert.equal(api.nextId('TRAVEL', '2027-01-02', []), 'milestone_travel_20270102');
});
check('metric before may be null; after is required; duplicate metric id rejected', () => {
  assert.deepEqual(plain(api.validate(valid({metrics:[{id:'a',label:'HbA1c',before:null,after:'5.3%',change:null,unit:null}], featuredMetrics:undefined}))), []);
  assert.match(api.validate(valid({metrics:[{id:'a',label:'체중',before:'1',after:'',change:null,unit:null}], featuredMetrics:undefined})).join(), /지금 값/);
  assert.match(api.validate(valid({metrics:[{id:'a',label:'x',after:'1'},{id:'a',label:'y',after:'2'}], featuredMetrics:undefined})).join(), /겹쳐요/);
  assert.deepEqual(plain(api.validate(valid({metrics:[], featuredMetrics:undefined}))), [], 'a milestone without numbers is allowed');
});
check('tags, agents, goals and related views are validated arrays', () => {
  assert.match(api.validate(valid({tags:'건강'})).join(), /tags/);
  assert.match(api.validate(valid({agents:'hani'})).join(), /agents/);
  assert.match(api.validate(valid({agents:['nobody']}), {agents}).join(), /담당 Agent/);
  assert.match(api.validate(valid({relatedTabs:['healthCenter']}), {views:navViews}).join(), /관련 HANI OS/);
  assert.deepEqual(plain(api.validate(seed, {views:navViews, agents})), [], 'seed agents and related views exist');
  assert.ok(seed.relatedTabs.every(id => navViews.includes(id)) && seed.relatedTabs.includes('diet'));
});
check('images keep small path metadata only (no data URI)', () => {
  assert.match(api.validate(valid({images:[{src:'data:image/png;base64,AAAA'}]})).join(), /이미지/);
  assert.deepEqual(plain(api.validate(valid({images:[{src:'./assets/milestones/a.webp',alt:'',caption:null}]}))), []);
});
check('sorting, filtering and dashboard pick', () => {
  const a = valid({id:'milestone_a', date:'2025-01-01', importance:'MAJOR', category:'TRAVEL'});
  const b = valid({id:'milestone_b', date:'2027-01-01', importance:'NORMAL', category:'STUDY'});
  const list = [seed, a, b];
  assert.deepEqual(api.sorted(list, 'newest').map(x => x.id), ['milestone_b', seed.id, 'milestone_a']);
  assert.deepEqual(api.sorted(list, 'oldest').map(x => x.id), ['milestone_a', seed.id, 'milestone_b']);
  assert.deepEqual(api.sorted(list, 'importance').map(x => x.id), [seed.id, 'milestone_a', 'milestone_b']);
  assert.deepEqual(api.sorted(list, 'category').map(x => x.category), ['HEALTH','STUDY','TRAVEL']);
  assert.deepEqual(api.filtered(list, 'TRAVEL').map(x => x.id), ['milestone_a']);
  assert.equal(api.homePick(list).id, seed.id, 'newest HISTORIC first');
  assert.equal(api.homePick([a, b]).id, 'milestone_a', 'falls back to MAJOR');
  assert.equal(api.homePick([b]), null, 'NORMAL alone does not take the dashboard');
});
check('card shows 2-4 featured metrics; detail shows all; HTML escaped', () => {
  const card = api.card(seed);
  assert.equal((card.match(/<li><span>/g) || []).length, 4);
  assert.match(card, /122\.8kg → 95\.62kg/); assert.match(card, /HISTORIC/); assert.match(card, /LEGENDARY/);
  assert.doesNotMatch(card, /감마GTP/);
  const detail = api.detail(seed);
  for (const label of ['감마GTP','총콜레스테롤','이 변화의 의미','다음 목표','회장 본인 Comment','Agent Comment','관련 HANI OS 기능']) assert.ok(detail.includes(label), label);
  assert.ok(detail.includes('<b>—</b>'), 'missing before shows a dash, not an invented value');
  const evil = valid({title:'<img src=x onerror=alert(1)>'});
  assert.doesNotMatch(api.card(evil), /<img src=x/);
  assert.deepEqual(api.featured(seed, 3).map(api.compactMetric), ['체중 -27.18kg','혈당 211 → 91mg/dL','HbA1c 5.3%']);
});
check('empty archive and empty filter copy are gentle', () => {
  assert.match(api.list([], {}), /아직 남긴 마일스톤이 없어요/);
  assert.match(api.list([seed], {category:'TRAVEL'}), /여행 분야의 마일스톤은 아직 없어요/);
  const copy = code + html.slice(html.indexOf('<section id="milestones"'), html.indexOf('</section>', html.indexOf('data-ms-form')));
  for (const banned of ['더 노력하세요','연속 기록이 끊','목표보다 부족','다음 업적까지','XP','레벨 업']) assert.ok(!copy.includes(banned), banned);
});

// ---- Safety ----
check('no storage, network or cloud path in the milestone owner', () => {
  for (const banned of ['localStorage','sessionStorage','indexedDB','fetch(','XMLHttpRequest','supabase','hani_os_life_v23','.setItem','.removeItem']) assert.ok(!code.includes(banned), banned);
  assert.equal(writes, 0);
});
check('protected baseline untouched and wiring stays minimal', () => {
  assert.ok(main.includes('hani_os_life_v23'));
  assert.ok(main.includes('2.9.15-safe-baseline-bootstrap'));
  assert.equal((main.match(/window\.HaniMilestones/g) || []).length, 1, 'one showView hook');
  assert.equal((html.match(/data-view="milestones"/g) || []).length, 1, 'one nav entry');
  assert.equal((html.match(/id="milestones"/g) || []).length, 1);
  const ui = read('hani-ui-v02992.js');
  assert.match(ui, /milestones: entry\("hani"/, 'canonical tab voice');
  assert.match(ui, /"milestones":Object\.freeze\(\{[\s\S]*?title:"삶에 남은 변화들"[\s\S]*?sceneImage: "\.\/assets\/heroes\/organization-226w\.webp"/, 'canonical banner reuses an existing scene');
  assert.ok(html.indexOf('data-view="milestones"') > html.indexOf('data-view="home"') && html.indexOf('data-view="milestones"') < html.indexOf('office-main-nav'), 'directly below dashboard');
  assert.ok(/<script src="\.\/hani-milestones\.js\?v=[\d.]+"><\/script>/.test(html) && /href="\.\/hani-milestones\.css\?v=[\d.]+"/.test(html));
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate static DOM id');
});
console.log('Node checks: ' + passed + ' PASS');

// ---- Browser ----
if (process.argv[2] && process.argv[3]) {
  const {chromium} = await import(pathToFileURL(process.argv[2]).href);
  const out = path.join(root, 'artifacts', 'milestones-v1');
  fs.mkdirSync(out, {recursive:true});
  const types = {'.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.html':'text/html; charset=utf-8'};
  const server = http.createServer((req, res) => {
    const uri = new URL(req.url, 'http://test').pathname, file = path.resolve(root, '.' + (uri === '/' ? '/index.html' : decodeURIComponent(uri)));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({executablePath:process.argv[3], headless:true});
  const results = [];
  try {
    for (const width of [390, 412, 884, 1440]) {
      for (const theme of ['light', 'dark']) {
        const ctx = await browser.newContext({viewport:{width, height:900}, colorScheme:theme, reducedMotion:'reduce'});
        await ctx.route('**/*', r => new URL(r.request().url()).origin === origin ? r.continue() : r.abort());
        const page = await ctx.newPage(), errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.addInitScript(() => {
          const set = Storage.prototype.setItem;
          window.__msWrites = [];
          Storage.prototype.setItem = function (key, value) { if (String(new Error().stack).includes('hani-milestones.js')) window.__msWrites.push(key); return set.call(this, key, value); };
        });
        await page.goto(origin);
        await page.waitForFunction(() => window.HaniMilestones && typeof showView === 'function');
        await page.evaluate(theme => {
          unlockLoginGate();
          document.getElementById('loginGate').style.display = 'none';
          const app = document.getElementById('app'); app.classList.remove('login-locked'); app.inert = false; app.removeAttribute('inert');
          document.body.classList.remove('login-scroll-locked');
          // The app's dark look is the Midnight Black finish; saveChoice=false keeps it in memory.
          if (theme === 'dark') applySignatureFinish('midnight-black', false);
          document.querySelectorAll('[class*=remote]').forEach(el => { if (getComputedStyle(el).position === 'fixed') el.style.display = 'none'; });
        }, theme);
        const lifeBefore = await page.evaluate(() => localStorage.getItem('hani_os_life_v23'));
        const shot = async name => { if (theme === 'light' || name === 'detail' || name === 'archive') await page.screenshot({path:path.join(out, name + '-' + width + (theme === 'dark' ? '-dark' : '') + '.png'), fullPage:name === 'detail'}); };
        const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const tag = width + '/' + theme;

        // Dashboard card
        await page.evaluate(() => showView('home'));
        const home = page.locator('[data-milestone-home]');
        assert.equal(await home.isVisible(), true, tag + ' dashboard card');
        assert.match(await home.innerText(), /LIFE MILESTONE[\s\S]*건강혁명 프로젝트[\s\S]*체중 -27\.18kg[\s\S]*HbA1c 5\.3%/);
        assert.equal(await page.locator('[data-milestone-home] .ms-home-metrics li').count(), 3);
        await home.scrollIntoViewIfNeeded(); await shot('dashboard');
        await page.locator('[data-ms-home-open]').click();
        assert.equal(await page.evaluate(() => document.body.dataset.view), 'milestones');

        // Archive + filter (the page hero is the canonical banner owner, not a second hero)
        const banner = page.locator('#milestones > .ds-main-character-banner');
        assert.equal(await banner.count(), 1, tag + ' one canonical banner');
        assert.match(await banner.innerText(), /MILESTONES[\s\S]*삶에 남은 변화들[\s\S]*더 나은 삶을 살기 위해/i);
        assert.match(await page.locator('#milestones .ms-motto').innerText(), /더 완벽해지기 위해서가 아니라,\s*더 나은 삶을 살기 위해\./);
        assert.equal(await page.locator('#milestones .ms-item').count(), 1);
        assert.equal(await page.locator('.nav-btn[data-view="milestones"]').evaluate(el => el.classList.contains('active')), true);
        assert.ok(await overflow() <= 0, tag + ' archive overflow');
        await shot('archive');
        await page.locator('[data-ms-filter="TRAVEL"]').click();
        assert.match(await page.locator('[data-ms-list]').innerText(), /여행 분야의 마일스톤은 아직 없어요/);
        await page.locator('[data-ms-filter="ALL"]').click();
        await page.locator('[data-ms-sort]').selectOption('importance');
        assert.equal(await page.locator('#milestones .ms-item').count(), 1);

        // Detail open / close
        await page.locator('[data-ms-open="milestone_health_20261023"]').click();
        assert.equal(await page.locator('[data-ms-detail]').isVisible(), true);
        assert.equal(await page.evaluate(() => document.activeElement?.matches('[data-ms-detail-title]')), true, tag + ' focus to detail title');
        assert.equal(await page.locator('.ms-compare-row').count(), 9);
        const clipped = await page.locator('.ms-compare-cell b, .ms-comment blockquote, .ms-tags span, .ms-detail-head h3').evaluateAll(els => els.filter(e => e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > document.documentElement.clientWidth).length);
        assert.equal(clipped, 0, tag + ' detail text clipped');
        assert.ok(await overflow() <= 0, tag + ' detail overflow');
        await shot('detail');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('[data-ms-archive]').isVisible(), true, tag + ' escape returns to list');
        assert.equal(await page.evaluate(() => document.activeElement?.matches('[data-ms-open]')), true, tag + ' focus returns to card');

        // Related tab route
        await page.locator('[data-ms-open]').click();
        await page.locator('[data-ms-go="diet"]').click();
        assert.equal(await page.evaluate(() => document.body.dataset.view), 'diet');
        await page.evaluate(() => showView('milestones'));
        await page.locator('[data-ms-back]').first().click();

        // Form validation, metric add/remove, preview-only save
        await page.locator('[data-ms-new]').click();
        assert.equal(await page.evaluate(() => document.activeElement?.matches('[data-ms-form-title]')), true);
        assert.match(await page.locator('[data-ms-form]').innerText(), /자주 기록할 필요는 없습니다/);
        await page.locator('[data-ms-form] button[type="submit"]').click();
        assert.match(await page.locator('[data-ms-errors]').innerText(), /제목을 적어 주세요[\s\S]*대표 문장/);
        assert.ok(await overflow() <= 0, tag + ' form overflow');
        await page.locator('[data-ms-metric-add]').click();
        assert.equal(await page.locator('[data-ms-metric-row]').count(), 2);
        await page.locator('[data-ms-metric-remove]').nth(1).click();
        assert.equal(await page.locator('[data-ms-metric-row]').count(), 1);
        await page.locator('[data-ms-form] [name="title"]').fill('첫 하프 마라톤 완주 — 아주 긴 제목이 화면 너비를 넘더라도 자연스럽게 줄바꿈되는지 확인하는 문장');
        await page.locator('[data-ms-form] [name="summary"]').fill('끝까지 달린 날.');
        await page.locator('[data-ms-form] [name="category"]').selectOption('LIFE');
        await page.locator('[data-ms-form] [name="grade"]').selectOption('EPIC');
        await page.locator('[data-ms-metric-row] [data-ms-field="label"]').fill('기록');
        await page.locator('[data-ms-metric-row] [data-ms-field="after"]').fill('2:05:11');
        await page.locator('input[name="agents"][value="naeun"]').check();
        await page.locator('[data-ms-form] [name="tags"]').fill('러닝, #도전');
        await page.locator('[data-ms-form] [name="nextGoals"]').fill('부상 없이 회복\n풀코스는 천천히');
        await shot('form');
        await page.locator('[data-ms-form] button[type="submit"]').click();
        assert.equal(await page.locator('[data-ms-detail]').isVisible(), true);
        assert.match(await page.locator('[data-ms-detail]').innerText(), /EPIC[\s\S]*2:05:11[\s\S]*#러닝[\s\S]*#도전[\s\S]*미리보기/);
        assert.ok(await overflow() <= 0, tag + ' long title overflow');
        await page.locator('[data-ms-back]').first().click();
        assert.equal(await page.locator('#milestones .ms-item').count(), 2);
        assert.equal(await page.locator('[data-ms-session]').isVisible(), true);

        // Safety: no milestone write, protected key unchanged, no duplicate id
        // Route links call the existing showView owner, which keeps its own scroll/navigation UI key.
        assert.deepEqual(await page.evaluate(() => window.__msWrites.filter(key => key !== 'hani_os_navigation_v1')), [], tag + ' milestone storage writes');
        assert.equal(await page.evaluate(() => localStorage.getItem('hani_os_life_v23')), lifeBefore);
        assert.equal(await page.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(n => n.id); return ids.length - new Set(ids).size; }), 0, tag + ' duplicate DOM ids');
        const touch = await page.locator('#milestones .btn, #milestones .ms-chip, #milestones select').evaluateAll(els => els.filter(e => e.offsetParent && e.getBoundingClientRect().height < 36).map(e => e.textContent.trim()));
        assert.deepEqual(touch, [], tag + ' touch targets');
        assert.deepEqual(errors, [], tag + ' page errors');
        results.push(tag);
        await ctx.close();
      }
    }
    console.log('Browser checks PASS: ' + results.join(', '));
  } finally { await browser.close(); server.close(); }
} else console.log('Browser checks: NOT RUN (no Playwright/browser argument)');
