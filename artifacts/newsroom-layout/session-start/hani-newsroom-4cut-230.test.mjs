import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {assertNoNewDuplicateIds} from './hani-duplicate-id-guard.mjs';
import {readMainBaseline} from './hani-regression-baseline.mjs';
import {collectReferences} from './hani-runtime-closure.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const source = read('hani-newsroom-4cut.js');
const catalog = JSON.parse(read('assets/data/newsroom-4cut/issues.json'));
const out = path.join(root, 'artifacts/newsroom-4cut-230');
const nodeOnly = process.argv.includes('--node');
const browserOnly = process.argv.includes('--browser');
const first = {number:1, publishDate:'2026-10-25', week:'2026-10-19~10-23',
 image:'fixture-001', alt:'합성 테스트 4컷', title: '금리와 실적 사이, 시장의 한 주', sources: [
  {label: '공식 발표 · 테스트 출처', url: 'https://example.com/official'},
  {label: '<unsafe>', url: 'javascript:alert(1)'}
]};
const publishedFixture = {issues:[first]};
const many = {issues: [
  {...first, number: 99, publishDate: '2026-10-26', title: '미래호'},
  ...Array.from({length: 11}, (_, i) => ({...first, number: 11-i,
    publishDate: `2026-10-${String(25-i).padStart(2, '0')}`, week: `테스트 주간 ${11-i}`, title: `시장 소식 ${11-i}`}))
].reverse()};

function runtime(data = publishedFixture, time = '2026-10-25T00:00:00+09:00', fetcher) {
  const nodes = new Map();
  function element() {
    return {hidden: true, children: [], attrs: {}, textContent: '', open: false,
      append(...items) { this.children.push(...items); },
      replaceChildren(...items) { this.children = items; },
      get childElementCount() { return this.children.length; },
      setAttribute(k,v) { this.attrs[k]=v; }, showModal() { this.open=true; }};
  }
  const slot = {...element(), querySelector(selector) {
    if (!nodes.has(selector)) nodes.set(selector, element());
    return nodes.get(selector);
  }};
  const calls = [], writes = [];
  class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [time])); } }
  const document = {body: {dataset: {view: 'home'}}, querySelector: () => slot, createElement: element};
  const ctx = vm.createContext({window: {}, document, Date: FixedDate, URL,
    fetch: async (...args) => { calls.push(args); return fetcher ? fetcher(...args) : {ok:true,json:async()=>data}; },
    localStorage: {setItem: (...a)=>writes.push(a), removeItem: (...a)=>writes.push(a),clear:()=>writes.push('clear')},
    sessionStorage: {setItem: (...a)=>writes.push(a)}, console});
  vm.runInContext(source, ctx);
  return {api:ctx.window.HaniNewsroom4cut, document, slot, nodes, calls, writes};
}

if (!browserOnly) {
  test('real catalog issues pass the renderer filter and every image exists', () => {
    const {api}=runtime();
    assert.equal(api.published(catalog,new Date('2099-01-01T00:00:00Z')).length,catalog.issues.length);
    for(const issue of catalog.issues)assert.ok(fs.existsSync(path.join(root,`assets/newsroom-4cut/${issue.image}.webp`)),issue.image);
    assert.equal(api.published(catalog,new Date('2026-10-31T14:59:59Z')).length,0,'issue 1 waits for Nov 1 KST');
  });
  test('empty catalog stays hidden after release without image assignments, errors or writes', async () => {
    const r=runtime({issues:[]},'2026-11-01T00:00:00+09:00');r.document.body.dataset.view='newsroom';
    await assert.doesNotReject(()=>r.api.enter());await assert.doesNotReject(()=>r.api.enter());
    assert.equal(r.slot.hidden,true);assert.equal(r.nodes.size,0,'no image/source DOM accessed');
    assert.equal(r.calls.length,1);assert.deepEqual(r.writes,[]);
  });
  test('KST release boundary: Oct 24 hidden; Oct 25 published, regardless of host timezone', () => {
    const {api} = runtime();
    assert.equal(api.kstDay(new Date('2026-10-24T14:59:59Z')), '2026-10-24');
    assert.equal(api.published(publishedFixture, new Date('2026-10-24T14:59:59Z')).length, 0);
    assert.equal(api.published(publishedFixture, new Date('2026-10-24T15:00:00Z'))[0].number, 1);
    assert.equal(api.published({issues:[]}).length, 0);
  });
  test('canonical entry lazily fetches once; hidden slot, no images or storage writes before release', async () => {
    const r = runtime(publishedFixture, '2026-10-24T23:59:59+09:00');
    await r.api.enter(); assert.equal(r.calls.length, 0);
    r.document.body.dataset.view='newsroom';
    await Promise.all([r.api.enter(), r.api.enter()]);
    assert.equal(r.calls.length, 1); assert.equal(r.calls[0][0], 'assets/data/newsroom-4cut/issues.json');
    assert.equal(r.slot.hidden, true); assert.equal(r.nodes.size, 0);
    await r.api.enter(); assert.equal(r.calls.length, 1); assert.deepEqual(r.writes, []);
  });
  test('published renderer shows title, safe sources, latest eight past issues in date order and persistent slot', async () => {
    const r = runtime(many); r.document.body.dataset.view='newsroom'; await r.api.enter();
    const q = s=>r.slot.querySelector(s);
    assert.equal(r.slot.hidden, false); assert.equal(q('.newsroom-4cut-title').textContent, '시장 소식 11');
    assert.equal(q('.newsroom-4cut-source-list').childElementCount, 1);
    assert.equal(q('.newsroom-4cut-source-list').children[0].children[0].rel,'noopener noreferrer');
    const buttons = q('.newsroom-4cut-past').children.map(li=>li.children[0]);
    assert.deepEqual(buttons.map(b=>b.textContent.match(/^제(\d+)호/)[1]), ['10','9','8','7','6','5','4','3']);
    buttons[1].onclick(); assert.equal(q('.newsroom-4cut-title').textContent, '시장 소식 9');
    q('.newsroom-4cut-open').onclick(); assert.equal(q('dialog').open, true);
    assert.equal(q('.newsroom-4cut-full').src, `assets/newsroom-4cut/${first.image}.webp`);
    q('.newsroom-4cut-latest').onclick(); assert.equal(q('.newsroom-4cut-title').textContent, '시장 소식 11');
    const image=q('.newsroom-4cut-image'); await r.api.enter(); assert.equal(q('.newsroom-4cut-image'),image);
    assert.equal(r.calls.length,1); assert.deepEqual(r.writes,[]);
  });
  test('catalog failure stays invisible and retries next visit; untrusted paths and sources are rejected', async () => {
    let n=0;
    const r=runtime(publishedFixture,undefined,async()=>{if(!n++)throw Error('offline');return {ok:true,json:async()=>publishedFixture};});
    r.document.body.dataset.view='newsroom'; await r.api.enter(); assert.equal(r.slot.hidden,true);
    await r.api.enter(); assert.equal(r.slot.hidden,false); assert.equal(r.calls.length,2);
    assert.equal(r.api.published({issues:[{...first,image:'https://example.com/tracker.webp'}]}).length,0);
    assert.equal(r.api.published({issues:[{...first,publishDate:'invalid'}]}).length,0);
  });
  test('release closure literal, static lazy dimensions, canonical route and no new duplicate id literals', () => {
    assert.deepEqual(collectReferences('hani-newsroom-4cut.js',source),['assets/data/newsroom-4cut/issues.json']);
    assert.deepEqual(collectReferences('assets/data/newsroom-4cut/issues.json',JSON.stringify(publishedFixture)),[],'catalog image ids must not become closure paths');
    assert.doesNotMatch(source,/localStorage|sessionStorage|\.addEventListener|MutationObserver|\.innerHTML|\.insert\(|\.upsert\(/);
    const html=read('index.html');
    assert.match(html,/class="newsroom-4cut-image" loading="lazy" width="1200" height="1600"/);
    assert.match(html,/※ 정보 정리용이며 투자 권유가 아닙니다。|※ 정보 정리용이며 투자 권유가 아닙니다\./);
    assert.match(read('hani-main.js'),/if\(id==="newsroom"\)window.HaniNewsroom4cut\?\.enter\(\)/);
    console.log(assertNoNewDuplicateIds(read,readMainBaseline));
  });
}

if (!nodeOnly) test('actual browser: route lazy loading, dates, archive, modal, themes, AA, storage, layouts and screenshots', async () => {
  fs.mkdirSync(out,{recursive:true});
  const args=process.argv.slice(2).filter(a=>!a.startsWith('--'));
  const pw=args[0]||process.env.HANI_PLAYWRIGHT||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
  const {chromium}=await import(pathToFileURL(pw).href);
  const browser=await chromium.launch({headless:true,executablePath:args[1]||process.env.HANI_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));
    if (!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()) {res.writeHead(404).end();return;}
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin='http://127.0.0.1:'+server.address().port, results=[];
  async function pageAt(time,data,width=1440) {
    const context=await browser.newContext({viewport:{width,height:1000},timezoneId:'America/Los_Angeles',reducedMotion:'reduce'});
    let fetches=0, images=0;
    await context.route('**/*',async route=>{
      const u=new URL(route.request().url());
      if(u.origin!==origin){await route.fulfill({status:200,contentType:'application/javascript',body:''});return;}
      if(u.pathname==='/assets/data/newsroom-4cut/issues.json'){fetches++;await route.fulfill({json:data});return;}
      if(u.pathname.startsWith('/assets/newsroom-4cut/')){images++;await route.fulfill({contentType:'image/svg+xml',body:read('scripts/fixtures/newsroom-4cut.svg')});return;}
      await route.continue();
    });
    const page=await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.stack||e.message));
    await page.clock.setFixedTime(new Date(time));
    await page.goto(origin,{waitUntil:'load'});
    await page.waitForFunction(()=>typeof showView==='function'&&window.HaniNewsroom4cut);
    assert.equal(fetches,0,'home must not request catalog'); assert.equal(images,0);
    await page.evaluate(()=>{
      document.querySelectorAll('.login-gate,.login-recovery-gate').forEach(e=>e.style.display='none');
      document.getElementById('app')?.classList.remove('login-locked');
      document.getElementById('app').inert=false;
      document.getElementById('app').removeAttribute('aria-hidden');
      document.body.classList.remove('login-scroll-locked');
      document.documentElement.classList.remove('login-scroll-locked');
      // Existing news fetch/save is outside this read-only feature test.
      investmentNewsMaybeRefresh=()=>{};
      window.__fourCutWrites=[];
      for(const key of ['setItem','removeItem','clear']){
        const original=Storage.prototype[key];
        Storage.prototype[key]=function(...args){window.__fourCutWrites.push({key,stack:new Error().stack});return original.apply(this,args);};
      }
      showView('reading');
    });
    assert.equal(fetches,0,'other views must not request catalog');
    await page.evaluate(()=>showView('newsroom'));
    await page.waitForTimeout(200);
    assert.equal(fetches,1,JSON.stringify({view:await page.evaluate(()=>document.body.dataset.view),errors}));
    await page.evaluate(()=>window.HaniNewsroom4cut.enter());
    return {page,context,errors,get fetches(){return fetches;},get images(){return images;}};
  }
  try {
    const hidden=await pageAt('2026-10-24T14:59:59Z',publishedFixture);
    assert.equal(await hidden.page.locator('.newsroom-4cut').isVisible(),false);
    assert.equal(hidden.images,0); assert.equal(hidden.fetches,1);
    await hidden.page.clock.setFixedTime(new Date('2026-10-24T15:00:00Z'));
    await hidden.page.evaluate(()=>{showView('reading');showView('newsroom');});
    assert.equal(await hidden.page.locator('.newsroom-4cut').isVisible(),true,'cached issue becomes visible at KST midnight');
    assert.equal(hidden.fetches,1); await hidden.context.close();
    const empty=await pageAt('2026-11-01T00:00:00+09:00',{issues:[]});
    assert.equal(await empty.page.locator('.newsroom-4cut').isVisible(),false);
    assert.equal(empty.images,0,'unpublished catalog requests no image');
    assert.equal(await empty.page.locator('.newsroom-4cut img[src]').count(),0);
    assert.equal(empty.fetches,1);assert.deepEqual(empty.errors,[]);
    assert.deepEqual(await empty.page.evaluate(()=>window.__fourCutWrites),[]);
    await empty.context.close();
    for(const width of [390,884,1440]) for(const finish of ['pure-white','midnight-black']) {
      const r=await pageAt('2026-10-24T15:00:00Z',{issues:[first]},width),{page}=r;
      await page.evaluate(f=>document.documentElement.dataset.finish=f,finish);
      const slot=page.locator('.newsroom-4cut'); await slot.waitFor({state:'visible'});
      assert.match(await slot.locator('h2').innerText(),/이번 주 시장 4컷 · 2026-10-19~10-23/);
      assert.equal(await slot.locator('.newsroom-4cut-title').innerText(),first.title);
      assert.equal(await slot.locator('.newsroom-4cut-footnote').first().innerText(),'※ 정보 정리용이며 투자 권유가 아닙니다.');
      await slot.locator('.newsroom-4cut-sources summary').click();
      assert.equal(await slot.locator('.newsroom-4cut-source-list a').count(),1);
      assert.equal(await slot.locator('.newsroom-4cut-source-list a').getAttribute('href'),first.sources[0].url);
      await slot.locator('.newsroom-4cut-image').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>{const i=document.querySelector('.newsroom-4cut-image');return i.complete&&i.naturalWidth>0;});
      const layout=await slot.evaluate(el=>{
        const contrast=(fg,bg)=>{
          const lum=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return v[0]*.2126+v[1]*.7152+v[2]*.0722;};
          const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        };
        const style=getComputedStyle(el),foot=getComputedStyle(el.querySelector('.newsroom-4cut-footnote'));
        return {overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
          ownOverflow:el.scrollWidth-el.clientWidth,contrast:contrast(style.color,style.backgroundColor),footContrast:contrast(foot.color,style.backgroundColor)};
      });
      assert.ok(layout.overflow<=2,JSON.stringify({width,finish,layout})); assert.ok(layout.ownOverflow<=2);
      assert.ok(layout.contrast>=4.5&&layout.footContrast>=4.5,JSON.stringify(layout));
      // Component evidence omits global fixed chrome only while capturing.
      // Interaction/overflow/AA checks above use the actual app unchanged.
      await slot.screenshot({path:path.join(out,`${width}-${finish}.png`),
        style:'header.top,.hani-context-remote,.hani-remote-mobile-trigger{visibility:hidden!important}'});
      await slot.locator('.newsroom-4cut-open').click();
      await page.locator('.newsroom-4cut dialog[open]').waitFor();
      await page.waitForFunction(()=>{const i=document.querySelector('.newsroom-4cut-full');return i.complete&&i.naturalWidth>0;});
      const fullWidth=await slot.locator('.newsroom-4cut-full').evaluate(e=>e.getBoundingClientRect().width);
      assert.ok(fullWidth>0);
      assert.ok(await slot.locator('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'dialog horizontal overflow');
      if(width===1440)assert.ok(fullWidth>await slot.locator('.newsroom-4cut-image').evaluate(e=>e.getBoundingClientRect().width));
      if(finish==='pure-white'&&width!==884)await page.screenshot({path:path.join(out,`${width}-full.png`)});
      await page.keyboard.press('Escape');
      assert.equal(await slot.locator('dialog').getAttribute('open'),null);
      assert.equal(await slot.locator('.newsroom-4cut-open').evaluate(e=>e===document.activeElement),true);
      await page.evaluate(()=>{window.__fourCutSlot=document.querySelector('.newsroom-4cut');showView('reading');showView('newsroom');});
      assert.equal(await page.evaluate(()=>window.__fourCutSlot===document.querySelector('.newsroom-4cut')),true);
      assert.equal(r.fetches,1);
      const writes=await page.evaluate(()=>window.__fourCutWrites);
      assert.deepEqual(writes,[],'read-only route must not write storage');
      assert.deepEqual(r.errors,[],'app page errors');
      results.push({width,finish,...layout,fetches:r.fetches,storageWrites:writes.length});
      await r.context.close();
    }
    const past=await pageAt('2026-10-25T00:00:00+09:00',many);
    const {page}=past, archive=page.locator('.newsroom-4cut-archive'); await archive.locator('summary').click();
    const buttons=archive.locator('button'); assert.equal(await buttons.count(),8);
    assert.deepEqual((await buttons.allTextContents()).map(s=>s.match(/^제(\d+)호/)[1]),['10','9','8','7','6','5','4','3']);
    await buttons.nth(1).click(); assert.equal(await page.locator('.newsroom-4cut-title').innerText(),'시장 소식 9');
    await page.locator('.newsroom-4cut-latest').click(); assert.equal(await page.locator('.newsroom-4cut-title').innerText(),'시장 소식 11');
    await past.context.close();
    const runtimeFiles=['index.html','hani-main.js','hani-newsroom-4cut.js','hani-design-system.css','assets/data/newsroom-4cut/issues.json'];
    const hashes=Object.fromEntries(runtimeFiles.map(f=>[f,createHash('sha256').update(read(f)).digest('hex')]));
    fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({status:'PASS',fixture:'scripts/fixtures/newsroom-4cut.svg (not final art)',hashes,results},null,2)+'\n');
  } finally { await browser.close(); await new Promise(r=>server.close(r)); }
});
