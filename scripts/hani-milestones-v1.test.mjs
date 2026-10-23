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
  assert.equal((main.match(/window\.HaniMilestones/g) || []).length, 2, 'one showView hook and one renderHome refresh');
  // Optional list: validated like other record lists, never defaulted (no stored-byte or Cloud-hash churn on upgrade).
  assert.match(main, /lists\.push\("boardPosts","boardComments","milestones"\);/);
  assert.match(main, /validateStoredRecords\(\{boardPosts:data\.boardPosts,boardComments:data\.boardComments,milestones:data\.milestones\}\)/);
  assert.doesNotMatch(main, /milestones:\[\]/, 'no default milestones list in freshState/normalizeState');
  assert.match(main, /마일스톤 \$\{\(d\.milestones\|\|\[\]\)\.length\}개/, 'restore preview count');
  // The only write path in the owner is the existing save() inside persist().
  assert.equal((code.match(/=\s*save\(\)/g) || []).length, 1);
  assert.equal((code.match(/\bstate\s*=\s*[^=]/g) || []).length, 2, 'state replaced only in persist (set + rollback)');
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
// ---- Persistence owner (synthetic globals, mocked save) ----
function owner(globals) {
  const c = vm.createContext({window:{}, console, Date, Intl, Map, Set, loadRecovery:{active:false}, importSyncHold:false, cloudRecoveryMode:false,
    cloudAutoSyncReady:true, cloudRuntime:{sync:'ON'}, cloudUser:{id:'synthetic'}, cloudHasMeaningfulLocalData:() => true, ...globals});
  vm.runInNewContext(read('hani-organization-hub.js'), {window:c.window, document:{getElementById:() => null}});
  vm.runInContext(code, c);
  return c;
}
const manual = valid({id:'milestone_life_20261101', title:'첫 하프 마라톤', category:'LIFE', importance:'MAJOR'});
check('write is blocked unless Cloud sync is verified ON; blocked writes never call save', () => {
  for (const [name, patch] of [['logged out', {cloudUser:null}], ['sync not ON', {cloudRuntime:{sync:'HOLD'}}], ['auto sync off', {cloudAutoSyncReady:false}],
    ['recovery', {loadRecovery:{active:true}}], ['import hold', {importSyncHold:true}], ['cloud recovery', {cloudRecoveryMode:true}], ['empty local', {cloudHasMeaningfulLocalData:() => false}]]) {
    let calls = 0;
    const original = {books:[{id:'b1'}]};
    const c = owner({state:original, save:() => { calls++; return {ok:true}; }, ...patch});
    const result = c.window.HaniMilestones.persist([manual]);
    assert.equal(result.ok, false, name); assert.ok(result.message, name);
    assert.equal(calls, 0, name + ' no save'); assert.equal(c.state, original, name + ' state untouched');
  }
});
check('successful save replaces only milestones; failed save restores the exact previous state', () => {
  const original = {books:[{id:'b1'}], meta:{lastSavedAt:'x'}};
  let seen = null;
  const c = owner({state:original, save:() => { seen = c.state; return {ok:true}; }});
  assert.equal(c.window.HaniMilestones.persist([manual]).ok, true);
  assert.notEqual(seen, original); assert.deepEqual(plain(seen.milestones), [plain(manual)]);
  assert.equal(seen.books, original.books, 'other lists keep identity'); assert.equal(original.milestones, undefined, 'previous object not mutated');
  const before = {books:[{id:'b1'}]};
  const failing = owner({state:before, save:() => ({ok:false, message:'quota'})});
  assert.deepEqual(plain(failing.window.HaniMilestones.persist([manual])), {ok:false, message:'quota'});
  assert.equal(failing.state, before, 'rolled back to the same object');
  const throwing = owner({state:before, save:() => { throw Error('boom'); }});
  assert.equal(throwing.window.HaniMilestones.persist([manual]).ok, false); assert.equal(throwing.state, before);
});
check('merge: seed override wins, invalid saved rows are hidden but kept, absent list is empty', () => {
  const override = {...plain(seed), chairmanComment:'정말 기쁜 날', updatedAt:'2026-10-24T00:00:00Z'};
  const broken = {id:'milestone_bad', title:''};
  const c = owner({state:{milestones:[override, manual, broken]}});
  const view = plain(c.window.HaniMilestones.merged());
  assert.deepEqual(view.items.map(x => x.id), [seed.id, manual.id]);
  assert.equal(view.items[0].chairmanComment, '정말 기쁜 날'); assert.equal(view.hidden, 1);
  assert.equal(c.state.milestones.length, 3, 'nothing dropped from the source');
  assert.deepEqual(plain(owner({state:{}}).window.HaniMilestones.merged().items).map(x => x.id), [seed.id]);
  assert.deepEqual(plain(owner({state:{milestones:'bad'}}).window.HaniMilestones.merged().items).map(x => x.id), [seed.id]);
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
  // Synthetic life record only (one fake book); the real chairman data is never used.
  const KEY = 'hani_os_life_v23';
  const syntheticRaw = JSON.stringify({version:'2.9.15-safe-baseline-bootstrap', accounts:[], books:[{id:'synthetic-book', title:'가상 책', author:'테스트', status:'read'}], meta:{}});
  async function openApp(ctx, {theme = 'light', stored = syntheticRaw} = {}) {
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(({KEY, stored}) => {
      if (stored !== null && sessionStorage.getItem('__msSeeded') === null) { localStorage.setItem(KEY, stored); sessionStorage.setItem('__msSeeded', '1'); }
      const set = Storage.prototype.setItem;
      window.__msWrites = [];
      Storage.prototype.setItem = function (key, value) { if (String(new Error().stack).includes('hani-milestones.js')) window.__msWrites.push(key); return set.call(this, key, value); };
    }, {KEY, stored});
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
    return {page, errors};
  }
  // Fake a verified Cloud ON session without any network: sync calls are counted, never sent.
  const cloudOn = page => page.evaluate(() => {
    cloudUser = {id:'synthetic-user'}; cloudAutoSyncReady = true; cloudRecoveryMode = false; importSyncHold = false;
    cloudRuntime = {...cloudRuntime, sync:'ON'};
    window.__queued = 0; cloudQueueSync = () => { window.__queued++; }; cloudSyncCycle = async () => {};
  });
  const stored = page => page.evaluate(KEY => localStorage.getItem(KEY), KEY);
  const withoutMilestones = raw => { const x = JSON.parse(raw); delete x.milestones; delete x.meta; delete x.version; return x; };
  try {
    for (const width of [390, 412, 884, 1440]) {
      for (const theme of ['light', 'dark']) {
        const ctx = await browser.newContext({viewport:{width, height:900}, colorScheme:theme, reducedMotion:'reduce'});
        await ctx.route('**/*', r => new URL(r.request().url()).origin === origin ? r.continue() : r.abort());
        const {page, errors} = await openApp(ctx, {theme});
        await cloudOn(page);
        const lifeBefore = await page.evaluate(() => JSON.stringify(state));
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
        assert.equal(await page.locator('[data-ms-delete]').count(), 0, tag + ' seed cannot be deleted');
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

        // Form validation, metric add/remove, real save through save()
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
        await page.locator('[data-ms-form] input[name="agents"][value="naeun"]').check();
        await page.locator('[data-ms-form] [name="tags"]').fill('러닝, #도전');
        await page.locator('[data-ms-form] [name="nextGoals"]').fill('부상 없이 회복\n풀코스는 천천히');
        await shot('form');
        await page.locator('[data-ms-form] button[type="submit"]').click();
        assert.equal(await page.locator('[data-ms-detail]').isVisible(), true, tag + ' saved detail');
        assert.match(await page.locator('[data-ms-detail]').innerText(), /EPIC[\s\S]*2:05:11[\s\S]*#러닝[\s\S]*#도전/);
        assert.ok(await overflow() <= 0, tag + ' long title overflow');
        await page.locator('[data-ms-back]').first().click();
        assert.equal(await page.locator('#milestones .ms-item').count(), 2);
        assert.match(await page.locator('[data-ms-session]').innerText(), /저장했어요/);

        // Safety: the owner writes only via save(); other records are byte-identical
        const after = await stored(page);
        assert.deepEqual(withoutMilestones(after), withoutMilestones(lifeBefore), tag + ' other records unchanged');
        assert.equal(JSON.parse(after).milestones.length, 1);
        assert.deepEqual(await page.evaluate(() => [...new Set(window.__msWrites)].filter(key => key !== 'hani_os_navigation_v1')), [KEY], tag + ' writes only through save()');
        assert.ok(await page.evaluate(() => window.__queued) >= 1, tag + ' Cloud sync queued after save');
        assert.equal(await page.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(n => n.id); return ids.length - new Set(ids).size; }), 0, tag + ' duplicate DOM ids');
        const touch = await page.locator('#milestones .btn, #milestones .ms-chip, #milestones select').evaluateAll(els => els.filter(e => e.offsetParent && e.getBoundingClientRect().height < 36).map(e => e.textContent.trim()));
        assert.deepEqual(touch, [], tag + ' touch targets');
        assert.deepEqual(errors, [], tag + ' page errors');
        results.push(tag);
        await ctx.close();
      }
    }
    console.log('Browser UI checks PASS: ' + results.join(', '));

    // ---- Persistence scenarios (1440, synthetic data, fake Cloud) ----
    const scenarios = [];
    const scenario = async (name, run) => {
      const ctx = await browser.newContext({viewport:{width:1440, height:900}});
      await ctx.route('**/*', r => new URL(r.request().url()).origin === origin ? r.continue() : r.abort());
      try { await run(ctx); scenarios.push(name); console.log('PASS persistence:', name); } finally { await ctx.close(); }
    };
    const fillNew = async (page, title) => {
      await page.evaluate(() => showView('milestones'));
      await page.locator('[data-ms-new]').click();
      await page.locator('[data-ms-form] [name="title"]').fill(title);
      await page.locator('[data-ms-form] [name="summary"]').fill('조용히 남기는 문장.');
      await page.locator('[data-ms-metric-row] [data-ms-field="label"]').fill('거리');
      await page.locator('[data-ms-metric-row] [data-ms-field="after"]').fill('21.1km');
      await page.locator('[data-ms-form] button[type="submit"]').click();
    };

    await scenario('upgrade adds no milestones key and writes nothing', async ctx => {
      const {page, errors} = await openApp(ctx);
      await page.evaluate(() => showView('milestones'));
      assert.equal(await stored(page), syntheticRaw, 'stored bytes untouched by opening the archive');
      assert.equal(await page.evaluate(() => 'milestones' in state), false, 'absent list stays absent');
      const hashes = await page.evaluate(async () => [await cloudStateHash(state), await cloudStateHash(normalizeState(JSON.parse(JSON.stringify(state))))]);
      assert.equal(hashes[0], hashes[1], 'Cloud fingerprint stable across normalize');
      assert.deepEqual(errors, []);
    });

    await scenario('blocked while Cloud is not ON: nothing saved, reason shown', async ctx => {
      const {page} = await openApp(ctx);
      await fillNew(page, 'Cloud 꺼짐 테스트');
      assert.match(await page.locator('[data-ms-errors]').innerText(), /Cloud/);
      assert.equal(await stored(page), syntheticRaw);
      assert.equal(await page.evaluate(() => 'milestones' in state), false);
    });

    await scenario('save → reload → read-back; edit keeps id; seed comment; delete via existing dialog', async ctx => {
      const {page} = await openApp(ctx);
      await cloudOn(page);
      const loaded = await page.evaluate(() => JSON.stringify(state));
      await fillNew(page, '첫 하프 마라톤');
      const first = JSON.parse(await stored(page)).milestones;
      assert.equal(first.length, 1); assert.equal(first[0].title, '첫 하프 마라톤'); assert.equal(first[0].source, 'manual');
      await page.reload();
      await page.waitForFunction(() => window.HaniMilestones && typeof showView === 'function');
      await page.evaluate(() => { unlockLoginGate(); document.getElementById('loginGate').style.display = 'none'; const app = document.getElementById('app'); app.classList.remove('login-locked'); app.inert = false; });
      await cloudOn(page);
      await page.evaluate(() => showView('milestones'));
      assert.equal(await page.locator('#milestones .ms-item').count(), 2, 'saved milestone survives reload');
      // Edit the saved one: same id, createdAt kept, updatedAt moves.
      const id = first[0].id;
      await page.locator('[data-ms-open="' + id + '"]').click();
      await page.locator('[data-ms-edit="' + id + '"]').click();
      await page.locator('[data-ms-form] [name="chairmanComment"]').fill('끝까지 달렸다.');
      await page.locator('[data-ms-form] button[type="submit"]').click();
      const edited = JSON.parse(await stored(page)).milestones;
      assert.equal(edited.length, 1); assert.equal(edited[0].id, id); assert.equal(edited[0].createdAt, first[0].createdAt); assert.equal(edited[0].chairmanComment, '끝까지 달렸다.');
      // Seed comment: saved as an override row with the seed id, values otherwise verbatim.
      await page.locator('[data-ms-back]').first().click();
      await page.locator('[data-ms-open="milestone_health_20261023"]').click();
      await page.locator('[data-ms-edit="milestone_health_20261023"]').click();
      await page.locator('[data-ms-form] [name="chairmanComment"]').fill('내 삶에 배포된 가장 중요한 업데이트.');
      await page.locator('[data-ms-form] button[type="submit"]').click();
      const rows = JSON.parse(await stored(page)).milestones, override = rows.find(x => x.id === 'milestone_health_20261023');
      assert.equal(override.source, 'seed'); assert.equal(override.chairmanComment, '내 삶에 배포된 가장 중요한 업데이트.');
      assert.deepEqual(override.metrics.map(x => [x.id, x.before, x.after, x.change]), seed.metrics.map(x => [x.id, x.before, x.after, x.change]));
      assert.deepEqual(override.featuredMetrics, seed.featuredMetrics);
      assert.match(await page.locator('[data-ms-detail]').innerText(), /내 삶에 배포된 가장 중요한 업데이트/);
      assert.equal(await page.locator('[data-ms-delete]').count(), 0, 'seed override still not deletable');
      // Delete the manual one through the shared record-delete dialog.
      await page.locator('[data-ms-back]').first().click();
      await page.locator('[data-ms-open="' + id + '"]').click();
      await page.locator('[data-ms-delete="' + id + '"]').click();
      await page.locator('#recordDeleteDialog button[value="approve"]').click();
      await page.waitForFunction(id => !JSON.parse(localStorage.getItem('hani_os_life_v23')).milestones.some(x => x.id === id), id);
      assert.deepEqual(JSON.parse(await stored(page)).milestones.map(x => x.id), ['milestone_health_20261023']);
      assert.deepEqual(withoutMilestones(await stored(page)), withoutMilestones(loaded), 'other records unchanged after edit/delete');
    });

    await scenario('failed save (quota) restores state and keeps stored bytes', async ctx => {
      const {page} = await openApp(ctx);
      await cloudOn(page);
      await page.evaluate(KEY => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === KEY) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } return set.call(this, k, v); }; }, KEY);
      const before = await page.evaluate(() => JSON.stringify(state));
      await fillNew(page, '저장 공간 부족 테스트');
      assert.match(await page.locator('[data-ms-errors]').innerText(), /저장 공간|저장/);
      assert.equal(await page.evaluate(() => JSON.stringify(state)), before, 'in-memory state rolled back');
      assert.equal(await stored(page), syntheticRaw, 'stored bytes untouched');
    });

    await scenario('backup export/validate/restore keeps milestones; Cloud fingerprint sees them', async ctx => {
      const {page} = await openApp(ctx);
      await cloudOn(page);
      await fillNew(page, '백업 테스트');
      const result = await page.evaluate(async () => {
        const payload = buildBackupPayload(state, new Date().toISOString());
        const {data} = validateBackup(JSON.parse(JSON.stringify(payload)));
        const restored = normalizeState(data);
        const without = structuredClone(state); delete without.milestones;
        return {inPayload:payload.milestones.length, restored:restored.milestones.length, same:JSON.stringify(restored.milestones) === JSON.stringify(state.milestones),
          summary:backupSummary(data), comparable:cloudComparableState(state).milestones.length,
          hashDiffers:(await cloudStateHash(state)) !== (await cloudStateHash(without))};
      });
      assert.equal(result.inPayload, 1); assert.equal(result.restored, 1); assert.equal(result.same, true);
      assert.match(result.summary, /마일스톤 1개/); assert.equal(result.comparable, 1); assert.equal(result.hashDiffers, true, 'a milestone change is a Cloud change');
    });

    await scenario('corrupt milestones list fails closed into original protection', async ctx => {
      const bad = JSON.stringify({...JSON.parse(syntheticRaw), milestones:'not-a-list'});
      const {page} = await openApp(ctx, {stored:bad});
      assert.equal(await page.evaluate(() => loadRecovery.active), true);
      assert.equal(await stored(page), bad, 'original bytes kept');
      assert.ok(await page.evaluate(() => Object.keys(localStorage).some(k => k.startsWith('hani_os_load_quarantine_v1_'))), 'quarantine copy made');
      assert.match(await page.evaluate(() => window.HaniMilestones.writeBlockReason()), /원본 보호|Cloud|로그인/);
    });

    // Released 2.9.232 normalizeState (origin/main) keeps a list it does not know, so older devices never drop milestones.
    await scenario('older released normalizeState preserves milestones', async ctx => {
      const {execFileSync} = await import('node:child_process');
      const released = execFileSync(process.env.HANI_GIT_PATH || process.env.HANI_GIT || 'git', ['show', 'origin/main:hani-main.js'], {cwd:root, encoding:'utf8', maxBuffer:64 * 1024 * 1024});
      const body = released.slice(released.indexOf('function normalizeState(d){'), released.indexOf('function isQuotaError('));
      assert.ok(body.includes('...(d||{})') && !body.includes('milestones'), 'released source has the generic spread and no milestone handling');
      const {page} = await openApp(ctx);
      const kept = await page.evaluate(({body, seedRow}) => {
        const oldNormalize = new Function('freshState', 'n', 'today', 'uid', 'VERSION', 'monthKeyNow', 'legacyExercise', 'normalizeMonthlySnapshot', 'normalizeBrokerSnapshot', 'normalizeCashFlow', 'normalizeInvestmentJournal', 'normalizeWatchlistItem', 'normalizeLedgerMonth', 'normalizeSpendPurchase', 'normalizeBodyRecord', 'normalizeCampusSemester', 'normalizeTravelTrip', 'normalizeTravelPlace', 'normalizeTravelWish', 'normalizeCertificate', 'normalizeWishItem',
          body + ';return normalizeState;')(freshState, n, today, uid, VERSION, monthKeyNow, legacyExercise, normalizeMonthlySnapshot, normalizeBrokerSnapshot, normalizeCashFlow, normalizeInvestmentJournal, normalizeWatchlistItem, normalizeLedgerMonth, normalizeSpendPurchase, normalizeBodyRecord, normalizeCampusSemester, normalizeTravelTrip, normalizeTravelPlace, normalizeTravelWish, normalizeCertificate, normalizeWishItem);
        const input = {...JSON.parse(JSON.stringify(state)), milestones:[seedRow]};
        return JSON.stringify(JSON.parse(JSON.stringify(oldNormalize(input))).milestones) === JSON.stringify([seedRow]);
      }, {body, seedRow:{...seed, chairmanComment:'old device'}});
      assert.equal(kept, true);
    });
    console.log('Persistence scenarios PASS: ' + scenarios.length);
  } finally { await browser.close(); server.close(); }
} else console.log('Browser checks: NOT RUN (no Playwright/browser argument)');
