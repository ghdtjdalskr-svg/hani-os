// node scripts/hani-ilbo-213.test.mjs [playwright/index.mjs] [browser.exe|http://CDP]
// Synthetic records only. Reports/preview go to the OS temp directory, outside the patch scope.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const root = path.resolve(import.meta.dirname,'..'), out = fs.mkdtempSync(path.join(os.tmpdir(),'hani-ilbo-visual-'));
fs.mkdirSync(out,{recursive:true});
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const code = read('hani-ilbo.js'), manifest = JSON.parse(read('data/hani-ilbo/issues.json')), issue = JSON.parse(read('data/hani-ilbo/001.json'));
const firstEntry = manifest.issues.find(x=>x.number===1);
const report = {base:'3aee805904679000673560b2f3eb9a97fa9e64d9',unit:[],browser:[],browserStatus:'NOT_RUN'};
const plain = value => JSON.parse(JSON.stringify(value));
let writes = 0;
const failWrite = () => {writes++;throw Error('Unexpected write');};
const context = vm.createContext({window:{},console,Date,Intl,Map,Set,localStorage:{setItem:failWrite,removeItem:failWrite,clear:failWrite},sessionStorage:{setItem:failWrite,removeItem:failWrite,clear:failWrite},commit:failWrite,save:failWrite});
vm.runInNewContext(read('hani-organization-hub.js'),{window:context.window,document:{getElementById:()=>null}});
vm.runInContext(code,context);
const api = context.window.HaniIlbo, now = Date.parse('2026-10-19T03:00:00Z');
const fixture = {
  exercise:[{date:'2026-10-12',steps:9000,strength:true,updatedAt:'2026-10-12T09:00:00Z'},{date:'2026-10-12',steps:1000,strength:false,updatedAt:'2026-10-12T01:00:00Z'},{date:'2026-10-18',steps:11000,strength:false},{date:'2026-10-19',steps:999999,strength:true}],
  books:[{status:'read',completedDate:'2026-10-14',title:'완독 책'},{status:'wish',completedDate:'2026-10-14'},{status:'read',completedDate:'2026-10-20'},{status:'read',completedDate:'2026-10-14',readDate:'2026-10-15'}],
  learningQuizzes:[{status:'completed',completedAt:'2026-10-12T00:00:00Z',total:10,correctCount:8},{status:'completed',completedAt:'2026-10-18T14:59:00Z',total:20,score:50},{status:'pending',completedAt:'2026-10-14T00:00:00Z',total:10,score:100},{status:'completed',completedAt:'2026-10-18T15:00:00Z',total:10,score:100},{status:'completed',completedAt:'2026-10-13T00:00:00Z',total:10,score:null}],
  ledgerMonths:[{month:'2026-10',items:[{category:'variable',date:'2026-10-12',amount:15000},{category:'fixed',date:'2026-10-18',amount:5000},{category:'special',date:'2026-10-05',amount:12000},{category:'finance',date:'2026-10-13',amount:1000000},{category:'variable',amount:99000}]}],
  tasks:[{text:'월요일 마감',due:'2026-10-19'},{text:'일요일 마감',due:'2026-10-25'},{text:'KST 마감',dueAt:'2026-10-25T15:00:00Z'},{text:'완료',due:'2026-10-20',done:true},{text:'지난 마감',due:'2026-10-18'},{text:'날짜 없음'},{text:'잘못된 날짜',due:'2026-02-30'}]
};
const freeze = value => {if(value && typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}return value;};
freeze(fixture);freeze(issue);
const loungeFixture = freeze(['minji','yuna','hani','haru'].map((authorId,i)=>({authorId,title:['일주일의 작은 발견','커피 한 잔의 여유','우리 팀에 보내는 응원','다음 주 이야기'][i],createdAt:'2026-10-14T03:00:00Z',likes:12-i,views:54-i*4})));
const marketFixture = freeze([{event_at:'2026-10-14T03:00:00Z',title:'이번 주 시장 돌아보기',summary:'가상 시장 소식 · 숫자와 기록을 차분히 돌아보는 시간입니다. 실제 시황이 아닙니다.'}]);
function check(name,run) {run();report.unit.push({name,status:'PASS'});console.log('PASS',name);}
try {
  check('manifest parsing, duplicate/path/date rejection and newest-first archive',()=>{
    const entries=api.parseManifest({issues:[firstEntry,{number:2,date:'2026-10-26',file:'data/hani-ilbo/002.json'},{number:3,date:'2026-10-05',file:'data/hani-ilbo/003.json'}]});
    assert.deepEqual(plain(entries).map(x=>x.number),[2,1,3]);
    for(const bad of [{issues:[...manifest.issues,...manifest.issues]},{issues:[{...firstEntry,date:'2026-02-30'}]},{issues:[{...firstEntry,file:'../secret.json'}]},{}]) assert.throws(()=>api.parseManifest(bad));
    for(const entry of api.parseManifest(manifest)) api.parseIssue(JSON.parse(read(entry.file)),entry);
    assert.throws(()=>api.parseIssue({...issue,comic:{...issue.comic,image:'https://external/image.webp'}},firstEntry));
    assert.throws(()=>api.parseIssue({...issue,news:[{title:'표시 없는 기사',body:'가상 여부 누락'}]},firstEntry));
  });
  check('six interview pairs preserved; comic captions only in accessible text',()=>{
    // Digest captured from the supplied draft, so the test is portable to CI without ../ files.
    assert.equal(createHash('sha256').update(JSON.stringify(issue.interview)).digest('hex'),'c844548c71fb7a9b196a1e0590e353cefc8f41221b7f5e66e12226f9e1f4fd4c');
    const draftPath=path.resolve(root,'../haniilbo-issue1-interview.md');
    if(fs.existsSync(draftPath)) {
      const pairs=[...fs.readFileSync(draftPath,'utf8').matchAll(/\*\*Q\. (.*?)\*\*\r?\nA\. ([\s\S]*?)(?=\r?\n\r?\n\*\*Q\.|\s*$)/g)].map(m=>({q:m[1],a:m[2].trimEnd()}));
      assert.deepEqual(issue.interview,pairs);
    }
    assert.equal(issue.interview.length,6);assert.equal(issue.comic.captions.length,8);
    const html=api.markup(issue,fixture,null,[],now);assert.equal((html.match(/<dt>/g)||[]).length,6);
    for(const pair of issue.interview){assert.ok(html.includes(pair.q));assert.ok(html.includes(pair.a));}
    assert.doesNotMatch(html,/ilbo-captions|<figcaption|<ol[^>]*>[^]*?<\/ol>/);
    const comic=html.match(/<section class="ilbo-comic">([^]*?)<\/section>/)[1];
    assert.equal((comic.match(/<h3>/g)||[]).length,1);assert.ok(!comic.includes(issue.comic.subtitle));
    const alt=comic.match(/<img data-ilbo-comic[^>]* alt="([^"]*)"/)[1];
    for(const caption of issue.comic.captions)assert.ok(alt.includes(caption));
    assert.match(comic,/class="ilbo-sr-only"/,'missing-image captions remain accessible');
    assert.match(html,/<h2>HANI 일보<\/h2>/);assert.doesNotMatch(html,/HANI\s*(?:<[^>]+>\s*)*HANI 일보/);assert.ok(html.includes('2026.10.19(월)'));if(issue.editorialDraft)assert.ok(html.includes('편집 초안'));
  });
  check('profile and quote, nested full interview, chat avatars, only first two sections open',()=>{
    const html=api.markup(issue,fixture,null,[],now);
    assert.match(html,/<div class="ilbo-profile-card"><header>[^]*?thumb\/hani-profile-seoyun-128.webp/);
    assert.ok(html.includes(issue.interviewQuote));assert.ok(issue.interview.some(x=>x.a.includes(issue.interviewQuote)));
    assert.match(html,/<details class="ilbo-interview-full"><summary>인터뷰 전문 보기<\/summary>/);
    assert.equal((html.match(/class="ilbo-qa"/g)||[]).length,6);assert.equal((html.match(/Q · 민지 기자/g)||[]).length,6);
    assert.equal((html.match(/thumb\/hani-profile-minji-128.webp/g)||[]).length,6);
    const sections=[...html.matchAll(/<details class="ilbo-fold"( open)?><summary>([^<]+)/g)];
    assert.deepEqual(sections.filter(x=>x[1]).map(x=>x[2]),['숫자로 보는 한 주','이 주의 인터뷰']);
    assert.match(html,/class="ilbo-spark"/);assert.match(html,/<progress[^>]*max="100" value="60"/);assert.match(html,/<progress[^>]*max="7" value="1"/);
    assert.match(html,/class="ilbo-timeline"/);assert.match(html,/class="ilbo-signature">하니 드림/);
    const roster=context.window.HaniOrganizationRoster;delete context.window.HaniOrganizationRoster;
    assert.doesNotThrow(()=>api.markup(issue,fixture,null,[],now));context.window.HaniOrganizationRoster=roster;
  });
  check('weekly fixtures: daily snapshot, completed books, weighted quiz, recorded spend, strength',()=>{
    const model=plain(api.compute(fixture,issue.date,now)),tiles=Object.fromEntries(model.tiles.map(x=>[x.key,x]));
    assert.deepEqual(model.range,{start:'2026-10-12',end:'2026-10-18'});
    assert.equal(tiles.steps.value,20000);assert.equal(tiles.books.value,1);assert.equal(tiles.quiz.value,60);assert.equal(tiles.spend.value,20000);assert.match(tiles.spend.note,/12,000.*\+8,000/);assert.equal(tiles.workouts.value,1);
    assert.deepEqual(tiles.steps.series,[9000,11000]);assert.equal(tiles.quiz.max,100);assert.equal(tiles.workouts.max,7);
    assert.deepEqual(model.tasks.map(x=>x.text),['월요일 마감','일요일 마감']);
    assert.equal(api.koreaDate('2026-10-18T15:00:00Z'),'2026-10-19');assert.equal(api.koreaDate('bad'),'');
  });
  check('missing/malformed/unscored data hides tiles; explicit zero retained; future excluded',()=>{
    assert.deepEqual(plain(api.compute({},issue.date,now).tiles),[]);
    assert.deepEqual(plain(api.compute({exercise:[{date:'2026-10-12',steps:null},{date:'2026-02-30',steps:999}],learningQuizzes:[{status:'completed',completedAt:'2026-10-14T03:00:00Z',total:10,score:999}]},issue.date,now).tiles),[]);
    const zero=plain(api.compute({exercise:[{date:'2026-10-12',steps:0,strength:false}]},issue.date,now).tiles);assert.deepEqual(zero.map(x=>[x.key,x.value]),[['steps',0],['workouts',0]]);
    assert.ok(!api.compute({ledgerMonths:fixture.ledgerMonths.map(x=>({...x,items:x.items.filter(y=>y.date!=='2026-10-05')}))},issue.date,now).tiles.some(x=>x.key==='spend'));
    assert.equal(api.compute(fixture,issue.date,Date.parse('2026-10-16T03:00:00Z')).tiles.find(x=>x.key==='steps').value,9000);
  });
  check('top posts use displayLikes/displayViews, week boundary, read-only list API',()=>{
    let calls=0;const posts=freeze([{title:'저장 추천이 많은 글',authorId:'haru',createdAt:'2026-10-12T03:00:00Z',likes:999,display:1},{title:'표시 추천 1위',authorId:'yuna',createdAt:'2026-10-18T14:59:00Z',likes:0,display:10},{title:'다음 주 글',createdAt:'2026-10-18T15:00:00Z',display:99},{title:'표시 추천 2위',authorId:'minji',createdAt:'2026-10-13T03:00:00Z',display:5},{title:'표시 추천 3위',authorId:'hani',createdAt:'2026-10-14T03:00:00Z',display:3}]);
    const board={listPosts:(...args)=>{assert.deepEqual(args,['ALL','',now]);calls++;return posts;},displayLikes:p=>p.display,displayViews:p=>p.display*3,openPost:failWrite,toggleLike:failWrite};
    const top=plain(api.topPosts(board,issue.date,now));assert.equal(calls,1);assert.equal(top[0].title,'표시 추천 1위');assert.equal(top[0].views,30);assert.equal(top.length,3);assert.equal(top[0].authorId,'yuna');
    const html=api.markup(issue,fixture,board,[],now);assert.equal((html.match(/class="ilbo-lounge-card"/g)||[]).length,3);assert.match(html,/thumb\/hani-profile-yuna-128.webp/);assert.ok(html.includes('♥ 추천 10'));assert.ok(html.includes('◉ 조회 30'));assert.ok(!html.includes('저장 추천이 많은 글'));
  });
  check('newsroom event_at, fictional labels, HTML escaping and real update separation',()=>{
    const html=api.markup({...issue,headline:'<img src=x onerror=bad()>',praise:'<script>bad()</script>'},fixture,null,[{event_at:'2026-10-12T03:00:00Z',title:'뉴스 fixture',summary:'기존 뉴스'}],now);
    assert.equal((html.match(/<small class="ilbo-chip ilbo-fiction">세계관/g)||[]).length,3);assert.equal((html.match(/<small class="ilbo-chip ilbo-real">실제 소식/g)||[]).length,2);
    assert.deepEqual(issue.news.map(x=>x.icon),['☕','🏃','🏆','🚀','📁']);assert.equal((html.match(/ilbo-story ilbo-news-card/g)||[]).length,5);
    for(const icon of issue.news.map(x=>x.icon))assert.ok(html.includes('aria-hidden="true">'+icon+'</div>'));
    const legacy={...issue,news:issue.news.map(({icon,...x})=>x)};assert.doesNotThrow(()=>api.parseIssue(legacy,firstEntry));assert.ok(api.markup(legacy,fixture,null,[],now).includes('aria-hidden="true">☕</div>'));
    assert.throws(()=>api.parseIssue({...issue,news:[{...issue.news[0],icon:42}]},firstEntry));
    assert.throws(()=>api.parseIssue({...issue,interviewQuote:'원문에 없는 인용'},firstEntry));
    const escaped=api.markup({...issue,news:[{...issue.news[0],icon:'<svg onload=x>'}],comic:{...issue.comic,captions:['" onerror="bad() <script>']}},fixture,null,[],now);assert.ok(!escaped.includes('<svg onload'));assert.ok(!escaped.includes('<script>'));assert.ok(escaped.includes('&quot; onerror=&quot;bad() &lt;script&gt;'));
    assert.ok(html.includes('뉴스 fixture'));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<script>'));
  });
  check('missing image fallback visible; load/error switch without losing captions',()=>{
    const placeholder={hidden:false},image={hidden:true,complete:true,naturalWidth:0},avatar={complete:true,naturalWidth:80,hidden:false};
    api.bindImage({querySelector:s=>s==='[data-ilbo-comic]'?image:placeholder,querySelectorAll:()=>[avatar]});assert.equal(image.hidden,true);assert.equal(placeholder.hidden,false);
    image.naturalWidth=800;image.onload();assert.equal(image.hidden,false);assert.equal(placeholder.hidden,true);
    image.naturalWidth=0;image.onerror();assert.equal(image.hidden,true);assert.equal(placeholder.hidden,false);
    avatar.onerror();assert.equal(avatar.hidden,true,'failed avatar reveals its initial');
  });
  check('zero source mutation/writes; canonical route/unique DOM ids/version retained',()=>{
    const before=JSON.stringify(fixture);for(let i=0;i<3;i++)api.markup(issue,fixture,null,[],now);
    assert.equal(JSON.stringify(fixture),before);assert.equal(writes,0);
    assert.doesNotMatch(code,/localStorage|sessionStorage|\.setItem\s*\(|\.removeItem\s*\(|\.clear\s*\(|\b(?:commit|save|upsert)\s*\(/);
    const html=read('index.html'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);
    assert.match(read('hani-main.js'),/if\(id==="ilbo"\)window\.HaniIlbo\?\.enter\(\)/);
    assert.match(html,/hani-main\.js\?v=\d+\.\d+\.\d+/);assert.ok(html.includes('hani-ilbo.js'));assert.ok(html.includes('data-ilbo-home'));
    assert.doesNotMatch(api.markup(issue,fixture,null,[],now),/\bid="/,'no new DOM id literals');
  });
} catch(error) {report.unitError=error.stack;fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));throw error;}

// Execute the real async lifecycle and delegated events with DOM slots; no layout claims here.
{
  let active=false, failed=true, lifecycleWrites=0, prints=0;
  const folds=[true,true,false,false].map(open=>({open,dataset:{}}));
  const content={innerHTML:'',setAttribute(){},querySelector:()=>null},archive={innerHTML:''},listeners={},printEvents={},button={};
  const home={hidden:true,innerHTML:'',querySelector:()=>button};
  const host={classList:{contains:()=>active},querySelector:s=>s==='[data-ilbo-content]'?content:s==='[data-ilbo-archive]'?archive:null,querySelectorAll:s=>s==='details'?folds:folds.filter(x=>x.dataset.ilboWasOpen!==undefined),addEventListener:(type,fn)=>listeners[type]=fn};
  const old={...issue,number:2,date:'2026-10-12'},future={...issue,number:3,date:'2026-10-26'};
  const files={'data/hani-ilbo/issues.json':{issues:[{number:2,date:old.date,file:'data/hani-ilbo/002.json'},firstEntry,{number:3,date:future.date,file:'data/hani-ilbo/003.json'}]},'data/hani-ilbo/001.json':issue,'data/hani-ilbo/002.json':old,'data/hani-ilbo/003.json':future};
  const DateAt=class extends Date {constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};
  const ctx=vm.createContext({Date:DateAt,Intl,console,state:fixture,document:{readyState:'complete',getElementById:()=>host,querySelector:()=>home,addEventListener(){}},window:{addEventListener:(type,fn)=>printEvents[type]=fn,print:()=>prints++},fetch:async file=>{if(failed){failed=false;return {ok:false};}return {ok:true,json:async()=>files[file]};},save:()=>lifecycleWrites++,commit:()=>lifecycleWrites++});
  vm.runInContext(code,ctx);const run=ctx.window.HaniIlbo;
  await run.enter();assert.match(content.innerHTML,/다시 불러오기/);
  await run.enter();assert.match(content.innerHTML,/제 1호/);assert.equal(home.hidden,false,'initial hidden render never marks read');
  assert.ok(archive.innerHTML.indexOf('제 1호')<archive.innerHTML.indexOf('제 2호'));assert.ok(!archive.innerHTML.includes('제 3호'),'future excluded');
  run.homeCard(Date.parse('2026-10-11T03:00:00Z'));assert.equal(home.hidden,true,'no premature card');
  run.homeCard(now);active=true;await run.enter();assert.equal(home.hidden,true,'opening latest marks session read');
  run.homeCard(Date.parse('2026-10-26T03:00:00Z'));assert.equal(home.hidden,false,'next date becomes unread');
  listeners.click({target:{closest:s=>s==='[data-ilbo-issue]'?{dataset:{ilboIssue:'2'}}:null}});await run.enter();assert.match(content.innerHTML,/제 2호/);
  run.homeCard(Date.parse('2026-10-26T03:00:00Z'));assert.equal(home.hidden,false,'old archive never dismisses newer date');
  assert.equal(lifecycleWrites,0);report.unit.push({name:'real async lifecycle: fetch retry, session unread, archive order/selection, future gating, zero writes',status:'PASS'});console.log('PASS real async lifecycle and session unread');
  check('canonical print click/beforeprint expands all; afterprint restores nested fold states',()=>{
    listeners.click({target:{closest:s=>s==='[data-ilbo-print]'?{}:null}});assert.equal(prints,1);
    printEvents.beforeprint();assert.ok(folds.every(x=>x.open));
    printEvents.afterprint();assert.deepEqual(folds.map(x=>x.open),[true,true,false,false]);assert.ok(folds.every(x=>x.dataset.ilboWasOpen===undefined));assert.equal(lifecycleWrites,0);
  });
}
// Reviewable offline preview, clearly separated from production and real records.
const previewBoard={listPosts:()=>loungeFixture,displayLikes:x=>x.likes,displayViews:x=>x.views};
fs.writeFileSync(path.join(out,'preview.html'),'<!doctype html><html lang="ko" data-theme="light"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+pathToFileURL(root+path.sep).href+'"><title>HANI 일보 · 가상 fixture Preview</title><link rel="stylesheet" href="hani-ilbo.css"><style>:root{--panel:#fff;--panel2:#fafbff;--text:#202638;--line:#e8ebf2}html[data-theme="dark"]{--panel:#1a2232;--panel2:#222b3e;--text:#f3f5ff;--line:#303a50}body{margin:0;padding:16px;background:var(--panel2);color:var(--text);font-family:system-ui,sans-serif}button{font:inherit;padding:10px;background:var(--panel);color:var(--text);border:1px solid currentColor}nav{max-width:1140px;margin:0 auto 16px}</style><nav>가상 fixture Preview · 운영 반영 전 <button type="button" onclick="document.documentElement.dataset.theme=document.documentElement.dataset.theme===\'light\'?\'dark\':\'light\'">밝게 / 어둡게</button></nav>'+api.markup(issue,fixture,previewBoard,marketFixture,now)+'<script src="hani-ilbo.js"></script><script>HaniIlbo.bindImage(document.querySelector(".ilbo-paper"))</script></html>');
if(process.argv.includes('--unit')) {fs.writeFileSync(path.join(out,'unit-results.json'),JSON.stringify(report,null,2)+'\n');process.exit(0);}

const playwright=process.argv[2] || path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const executable=process.argv[3] || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try {
  const {chromium}=await import(pathToFileURL(playwright).href);
  browser=executable.startsWith('http')?await chromium.connectOverCDP(executable):await chromium.launch({executablePath:executable,headless:true});
  for(const width of [412,884,1440])for(const theme of ['light','dark']) {
    const browserContext=await browser.newContext({viewport:{width,height:1100},deviceScaleFactor:1});
    await browserContext.route('https://**/*',route=>route.abort());
    await browserContext.route('**/assets/hani-ilbo/**',route=>route.fulfill({status:404,body:''}));
    await browserContext.addInitScript(()=>{
      const Native=Date,fixed=new Native('2026-10-19T03:00:00Z').getTime();
      window.Date=class extends Native{constructor(...args){super(...(args.length?args:[fixed]));}static now(){return fixed;}};
    });
    const page=await browserContext.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin);await page.waitForFunction(()=>!!window.HaniIlbo && typeof unlockLoginGate==='function');
    await page.evaluate(theme=>{unlockLoginGate();cloudStopAutoSync();document.documentElement.dataset.theme=theme;document.documentElement.dataset.finish=theme==='dark'?'midnight-black':'porcelain-cream';document.body.dataset.finishActive='true';},theme);
    const home=page.locator('[data-ilbo-home]');await home.waitFor({state:'visible'});
    await page.evaluate(()=>{window.ilboWrites=0;for(const key of ['setItem','removeItem','clear'])Storage.prototype[key]=()=>{window.ilboWrites++;throw Error('Unexpected storage write');};commit=()=>{window.ilboWrites++;throw Error('Unexpected commit');};save=()=>{window.ilboWrites++;throw Error('Unexpected save');};window.ilboBefore=JSON.stringify(state);});
    await home.locator('button').click();const view=page.locator('section#ilbo');await view.waitFor({state:'visible'});await view.locator('.ilbo-paper').waitFor();
    assert.equal(await home.isVisible(),false);await view.locator('[data-ilbo-placeholder]').waitFor({state:'visible'});
    assert.equal(await view.locator('[data-ilbo-comic]').isVisible(),false);assert.equal(await view.locator('.ilbo-captions, .ilbo-comic figcaption, .ilbo-comic ol').count(),0);
    const alt=await view.locator('[data-ilbo-comic]').getAttribute('alt');for(const caption of issue.comic.captions)assert.ok(alt.includes(caption));
    assert.equal(await page.evaluate(()=>JSON.stringify(state)===ilboBefore),true);
    await browserContext.unroute('**/assets/hani-ilbo/**');
    await page.evaluate(({fixture,loungeFixture,marketFixture})=>{Object.assign(state,fixture);window.HaniBoard=Object.freeze({listPosts:()=>loungeFixture,displayLikes:x=>x.likes,displayViews:x=>x.views,openPost:()=>{throw Error('Unexpected board open');},toggleLike:()=>{throw Error('Unexpected like');}});investmentNewsArchiveRuntime.posts=marketFixture;window.ilboFixtureBefore=JSON.stringify(state);}, {fixture,loungeFixture,marketFixture});await page.evaluate(()=>window.HaniIlbo.enter());
    // Chromium may retain the failed response for the identical image URL. Explicitly request
    // a fresh fixture after restoring the server, then exercise the same canonical load handler.
    await view.locator('[data-ilbo-comic]').evaluate(image=>{image.src=new URL(image.src).href+'?qa=restored';});
    await view.locator('[data-ilbo-comic]').waitFor({state:'visible'});assert.equal(await view.locator('[data-ilbo-placeholder]').isVisible(),false);
    assert.equal(await view.locator('[data-ilbo-tile]').count(),5);
    assert.deepEqual(await view.locator('.ilbo-fold[open]>summary').allTextContents(),['숫자로 보는 한 주','이 주의 인터뷰']);
    assert.equal(await view.locator('.ilbo-profile-card').isVisible(),true);assert.match(await view.locator('.ilbo-profile-card img').getAttribute('src'),/thumb\/hani-profile-seoyun-128.webp/);
    const full=view.locator('.ilbo-interview-full');assert.equal(await full.getAttribute('open'),null);assert.equal(await full.locator('.ilbo-qa').first().isVisible(),false);
    await full.locator('summary').click();assert.equal(await full.locator('.ilbo-qa').count(),6);assert.equal(await full.locator('.ilbo-qa').first().isVisible(),true);
    assert.equal(await full.locator('dt img').count(),6);assert.match(await full.locator('dt img').first().getAttribute('src'),/hani-profile-minji-128.webp/);
    // Keep nth() anchored to every fold: opening one must not shrink the locator list.
    for(const details of await view.locator('.ilbo-fold').all()) {
      if(await details.getAttribute('open')===null)await details.locator(':scope>summary').click();
      assert.notEqual(await details.getAttribute('open'),null,'clicked fold opens');
    }
    assert.equal(await view.locator('.ilbo-fold:not([open])').count(),0,'every newspaper section opens through its summary');
    assert.equal(await view.locator('.ilbo-news-card .ilbo-fiction:visible').count(),3);assert.equal(await view.locator('.ilbo-news-card .ilbo-real:visible').count(),2);
    assert.deepEqual(await view.locator('.ilbo-icon-band').allTextContents(),issue.news.map(x=>x.icon));assert.equal(await view.locator('.ilbo-lounge-card').count(),3);
    assert.equal(await view.locator('.ilbo-lounge-card img').count(),3);assert.equal(await view.locator('.ilbo-market li').count(),1);assert.equal(await view.locator('.ilbo-timeline li').count(),2);
    await view.locator('[data-ilbo-avatar]').evaluateAll(images=>images.forEach(x=>x.loading='eager'));
    await page.waitForFunction(()=>[...document.querySelectorAll('section#ilbo [data-ilbo-avatar]')].every(x=>x.complete));
    assert.equal(await view.locator('[data-ilbo-avatar]').evaluateAll(images=>images.filter(x=>!x.naturalWidth || x.hidden).length),0,'existing staff avatar assets load');
    const clamp=await view.locator('.ilbo-news-card p').first().evaluate(x=>({clamp:getComputedStyle(x).webkitLineClamp,height:x.clientHeight,line:parseFloat(getComputedStyle(x).lineHeight)}));assert.equal(clamp.clamp,'2');assert.ok(clamp.height<=clamp.line*2+1);
    const geometry=await view.evaluate(el=>({width:el.getBoundingClientRect().width,scroll:el.scrollWidth,client:el.clientWidth,page:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert.ok(geometry.scroll<=geometry.client+1,JSON.stringify(geometry));assert.ok(geometry.page<=geometry.viewport+1,JSON.stringify(geometry));
    const contrast=await view.evaluate(el=>{
      const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
      const rgb=color=>{ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);};
      const luminance=color=>{const [r,g,b]=rgb(color).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return r*.2126+g*.7152+b*.0722;};
      return [...el.querySelectorAll('h2,h3,h4,p,small,summary,dt,dd,li,strong,blockquote,time,.ilbo-person,.ilbo-signature,.ilbo-tile-label')].filter(x=>x.getClientRects().length && !x.classList.contains('ilbo-sr-only')).map(x=>{let parent=x,bg;while(parent){bg=getComputedStyle(parent).backgroundColor;if(!['rgba(0, 0, 0, 0)','transparent'].includes(bg))break;parent=parent.parentElement;}const a=luminance(getComputedStyle(x).color),b=luminance(bg||'white');return {text:x.textContent.slice(0,35),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
    });
    const failures=contrast.filter(x=>x.ratio<4.5);assert.deepEqual(failures,[],'AA 4.5:1 for all text including small labels: '+JSON.stringify(failures));
    await full.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await full.getAttribute('open'),null,'keyboard collapses full interview');
    await view.screenshot({path:path.join(out,`${width}-${theme}.png`)});
    const persisted=await page.evaluate(()=>({writes:ilboWrites,unchanged:JSON.stringify(state)===ilboFixtureBefore}));assert.equal(persisted.writes,0);assert.equal(persisted.unchanged,true);assert.deepEqual(errors,[]);
    await page.evaluate(()=>HaniIlbo.homeCard(Date.parse('2026-10-16T03:00:00Z')));assert.equal(await home.isVisible(),false);
    await page.evaluate(()=>{document.querySelectorAll('section#ilbo details').forEach(x=>x.open=false);window.dispatchEvent(new Event('beforeprint'));});
    assert.equal(await view.locator('details:not([open])').count(),0);
    await page.emulateMedia({media:'print'});
    const printStyle=await view.locator('.ilbo-paper').evaluate(x=>({background:getComputedStyle(x).backgroundColor,color:getComputedStyle(x).color}));assert.equal(printStyle.background,'rgb(255, 255, 255)');assert.equal(printStyle.color,'rgb(17, 17, 17)');
    assert.equal(await view.locator('.ilbo-qa').first().isVisible(),true);assert.equal(await view.locator('.ilbo-news-card p').first().evaluate(x=>getComputedStyle(x).display),'block');
    await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));assert.equal(await view.locator('details[open]').count(),0,'print restores prior fold state');
    report.browser.push({width,theme,status:'PASS',geometry,minContrast:Math.min(...contrast.map(x=>x.ratio)),writes:0});console.log('PASS browser',width,theme);
    await browserContext.close();
  }
  report.browserStatus='PASS';
} catch(error) {report.browserStatus=browser?'FAIL':'BLOCKED';report.browserError=String(error.stack);process.exitCode=1;console.error(report.browserStatus,error.message.split('\n')[0]);}
finally {if(browser)await browser.close();await new Promise(done=>server.close(done));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');}
