// node scripts/hani-polish-215.test.mjs [--unit] [playwright index.mjs] [browser exe]
// Read-only status tests and isolated real-app screenshots; no account or external requests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {collectReferences} from './hani-runtime-closure.mjs';
const root=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const code=read('hani-main.js'),data=JSON.parse(read('assets/data/ai-team-status.json'));
const keys=['seoyun','doyeon','gemini','work-hani','work-yuri','work-arin','work-hina'];
const ids=['seoyun','dohyun','serin','hani','yuri','arin','hina'];
const out=path.join(root,'artifacts/polish-215');fs.mkdirSync(out,{recursive:true});
const report={unit:[],browser:[],errors:[],result:'NOT_RUN'};
const statusCode=code.slice(code.indexOf('// Identity and navigation stay local;'),code.indexOf('// ===== v2.9.0 Campus MVP'));
const imageCode=code.slice(code.indexOf('const canonicalProfileImages='),code.indexOf('const pageAgentImage='));
function fixture(fetch){
 const summary={textContent:''};let renders=0;
 const c=vm.createContext({fetch,AbortController,setTimeout,clearTimeout,team:[],esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),$:id=>id==='aiTeamStatusSummary'?summary:null,document:{querySelectorAll:()=>[]},localStorage:{setItem(){throw Error('write')},removeItem(){throw Error('remove')},clear(){throw Error('clear')}}});
 vm.runInContext(imageCode+statusCode+';renderTeam=()=>{};',c);
 return {c,summary,run:s=>vm.runInContext(s,c)};
}
let calls=0;const good=fixture(async(url,options)=>{calls++;assert.equal(url,'./assets/data/ai-team-status.json');assert.equal(options.cache,'no-store');return {ok:true,json:async()=>structuredClone(data)}});
await good.run('loadAiTeamStatus()');await good.run('loadAiTeamStatus()');assert.equal(calls,1);
assert.equal(data.productionVersion,'2.9.214');assert.match(good.summary.textContent,/2026-10-16.*운영 v2.9.214/);
for(let i=0;i<keys.length;i++){
 const member=good.run(`developmentTeam[${i}]`);assert.equal(member.key,keys[i]);assert.equal(member.imageKey,ids[i]);
 const row=data.members.find(x=>x.id===ids[i]),meta=good.run(`teamMeta('${keys[i]}')`);
 for(const [a,b] of [['focus','now'],['traits','recent'],['style','next']])assert.deepEqual(Array.from(meta[a]),row[b]);
 for(const full of [false,true]){
  const html=good.run(`developmentPortrait(developmentTeam[${i}],${full})`),src=html.match(/src="([^"]+)"/)[1];
  assert.equal(src,`./assets/profiles/${full?'':'thumb/'}hani-profile-${ids[i]}${full?'':'-256'}.webp`);assert.ok(fs.existsSync(path.join(root,src)));
 }
 assert.doesNotMatch(good.run(`teamCard(developmentTeam[${i}])`),/COMING SOON|v2.9.205/);
}
assert.ok(collectReferences('hani-main.js',code).includes('assets/data/ai-team-status.json'),'runtime package discovers feed');
report.unit.push('feed rendered for all seven identities; one fetch; exact canonical full/thumb portraits; runtime closure');
for(const mode of ['http','network','json','shape','missing','duplicate']){
 const f=fixture(async()=>{if(mode==='network')throw Error('offline');return {ok:mode!=='http',json:async()=>{if(mode==='json')throw SyntaxError('bad JSON');if(mode==='shape')return {};const d=structuredClone(data);if(mode==='missing')d.members.pop();if(mode==='duplicate')d.members.push(d.members[0]);return d}}});
 await f.run('loadAiTeamStatus()');assert.equal(f.summary.textContent,'현황을 불러오지 못했어요');
 for(const key of keys){const meta=f.run(`teamMeta('${key}')`);assert.deepEqual(Array.from(meta.focus),['현황을 불러오지 못했어요']);assert.equal(meta.traits.length,0);assert.equal(meta.style.length,0);assert.doesNotMatch(JSON.stringify(meta),/205|209|2026-10-11/)}
}
report.unit.push('HTTP/network/JSON/schema/missing/duplicate failure: neutral, no stale work');
const image={naturalWidth:0,complete:true,nextElementSibling:{hidden:true}},imageRoot={querySelectorAll:()=>[image]};good.c.imageRoot=imageRoot;good.run('bindDevelopmentPortraits(imageRoot)');assert.equal(image.hidden,true);assert.equal(image.nextElementSibling.hidden,false);image.naturalWidth=720;image.onload();assert.equal(image.hidden,false);assert.equal(image.nextElementSibling.hidden,true);
report.unit.push('portrait load/error fallback lifecycle');
// Execute the existing search function so legacy habits and saved destinations stay valid.
const search=code.slice(code.indexOf('const QUICK_JUMP_ITEMS='),code.indexOf('function renderQuickJump'));
for(const term of ['대표실','하니 본사'])assert.deepEqual(Array.from(vm.runInNewContext(search+`;quickJumpMatches('${term}').find(x=>x[0]==='agentReview')`)).slice(0,2),['agentReview','하니 본사']);
report.unit.push('old/new command aliases reach unchanged agentReview route');
if(process.argv.includes('--unit')){console.log('PASS polish-215 unit: '+report.unit.length+' groups');process.exit(0)}
const args=process.argv.slice(2),pw=args[0]||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'),exe=args[1]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let browser;
try{
 const {chromium}=await import(pathToFileURL(pw).href);browser=await chromium.launch({executablePath:exe,headless:true});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  let feedCalls=0;await context.route('**/assets/data/ai-team-status.json',r=>{feedCalls++;return r.continue()});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&typeof aiTeamStatus!=='undefined'&&!!aiTeamStatus);
  await page.evaluate(()=>{unlockLoginGate();cloudStopAutoSync();document.documentElement.dataset.theme='light';document.documentElement.dataset.finish='pure-white';document.body.dataset.finishActive='true';});
  // Navigation uses its existing preference key; protect all other writes and app data.
  await page.evaluate(()=>{
   window.polishWrites=[];for(const method of ['setItem','removeItem','clear']){const original=Storage.prototype[method];Storage.prototype[method]=function(...args){polishWrites.push({method,key:args[0]});if(method==='setItem'&&args[0]==='hani_os_navigation_v1')return original.apply(this,args);throw Error('Unexpected storage write: '+method)}};
   window.polishBefore=JSON.stringify(state);save=commit=()=>{throw Error('Unexpected save')};
   showView('agentReview');
  });
  await page.locator('#agentReview').waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelector('#title')?.textContent==='하니 본사');
  assert.equal(await page.locator('.nav-btn[data-view="agentReview"] .txt').textContent(),'하니 본사');
  assert.equal(await page.locator('#haniOfficeLive h3').textContent(),'하니 본사');assert.equal(await page.locator('#agentReview .card .sh h3').first().textContent(),'하니 본사');
  assert.equal(await page.locator('#haniOfficeLive').getAttribute('aria-label'),'하니 본사');
  assert.match(await page.locator('#haniOfficeLive').textContent(),/4F 경영층/);
  assert.match(await page.locator('#haniOfficeLive').textContent(),/성민 회장실/,'canon room name unchanged');
  for(const term of ['대표실','하니 본사'])assert.deepEqual(await page.evaluate(term=>quickJumpMatches(term).find(x=>x[0]==='agentReview').slice(0,2),term),['agentReview','하니 본사']);
  await page.screenshot({path:path.join(out,`${width}-hq.png`),fullPage:true});
  // Reveal the real sidebar at mobile width for the menu/heading evidence.
  if(width===390){await page.locator('.mobile-menu').click();await page.locator('.nav-btn[data-view="agentReview"]').scrollIntoViewIfNeeded()}
  await page.screenshot({path:path.join(out,`${width}-hq-menu.png`)});
  await page.evaluate(()=>{document.querySelector('#app').classList.remove('mobile-open');showView('aiWork')});
  await page.locator('#aiWork').waitFor({state:'visible'});
  assert.equal(await page.locator('#developmentTeamList [data-development-portrait]').count(),7);
  for(let i=0;i<keys.length;i++){
   const card=page.locator(`#developmentTeamList [data-team-key="${keys[i]}"]`);await card.click();
   await page.waitForFunction(()=>[...document.querySelectorAll('#aiWork [data-development-portrait]')].every(x=>x.complete&&x.naturalWidth>0));
   assert.equal(await page.locator('#developmentTeamProfilePanel img').getAttribute('src'),`./assets/profiles/hani-profile-${ids[i]}.webp`);
   const row=data.members.find(x=>x.id===ids[i]),text=await page.locator('#developmentTeamProfilePanel').textContent();
   for(const value of [...row.now,...row.recent,...row.next,row.role])assert.ok(text.includes(value),value);
   assert.doesNotMatch(text,/v2.9.205|2026-10-11|COMING SOON/);
  }
  await page.locator('#developmentTeamList [data-team-key="seoyun"]').click();
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#developmentTeamList .member-visual').first().evaluate(el=>el.clientWidth>100),'portraits use the card width');
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,`${width}-ai-team.png`),fullPage:true,style:'@media(max-width:768px){#haniContextRemote[data-open="false"]{visibility:hidden}}'});
  await page.locator('#developmentTeamProfilePanel').screenshot({path:path.join(out,`${width}-ai-profile.png`)});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow');
  assert.equal(await page.evaluate(()=>JSON.stringify(state)===polishBefore),true,'app state preserved');
  assert.deepEqual(await page.evaluate(()=>polishWrites.filter(x=>x.key!=='hani_os_navigation_v1')),[]);assert.equal(feedCalls,1);
  // Feed is authoritative: changed fixture fields appear as text, without executing HTML.
  const changed=structuredClone(data);changed.updatedAt='2026-10-17';Object.assign(changed.members[0],{role:'배포 팀장 · 동적 역할',now:['<img src=x onerror="window.polishXss=1">'],recent:['동적 최근 진행'],next:['동적 다음 행동']});
  await context.route('**/assets/data/ai-team-status.json',r=>r.fulfill({json:changed}));
  await page.evaluate(async()=>{aiTeamStatusPromise=null;await loadAiTeamStatus();openTeamProfile('seoyun')});
  assert.match(await page.locator('#aiTeamStatusSummary').textContent(),/2026-10-17/);assert.equal(await page.evaluate(()=>!!window.polishXss),false);
  assert.ok((await page.locator('#developmentTeamProfilePanel').textContent()).includes(changed.members[0].now[0]));
  assert.equal(await page.locator('#developmentTeamList img').count(),7,'feed HTML escaped');
  for(const failure of ['http','json','shape']){
   await context.route('**/assets/data/ai-team-status.json',r=>failure==='http'?r.fulfill({status:503,body:'unavailable'}):failure==='json'?r.fulfill({contentType:'application/json',body:'{broken'}):r.fulfill({json:{}}));
   await page.evaluate(async()=>{aiTeamStatusPromise=null;await loadAiTeamStatus();openTeamProfile('doyeon')});
   assert.equal(await page.locator('#aiTeamStatusSummary').textContent(),'현황을 불러오지 못했어요');
   const text=await page.locator('#developmentTeamProfilePanel').textContent();assert.match(text,/현황을 불러오지 못했어요/);assert.doesNotMatch(text,/205|209|2026-10-11|동적/);
  }
  await context.route(/\/assets\/profiles\/(?:thumb\/)?hani-profile-seoyun.*\.webp\?polish-failure=1$/,r=>r.fulfill({status:404,body:''}));
  await page.evaluate(()=>{renderTeam();openTeamProfile('seoyun');document.querySelectorAll('#aiWork img[src*="seoyun"]').forEach(image=>image.src+='?polish-failure=1')});
  await page.waitForFunction(()=>[...document.querySelectorAll('#aiWork img[src*="seoyun"]')].every(x=>x.hidden));
  assert.equal(await page.locator('#developmentTeamList [data-team-key="seoyun"] [data-development-portrait-fallback]').isVisible(),true);
  assert.equal(await page.locator('#developmentTeamProfilePanel [data-development-portrait-fallback]').isVisible(),true);
  await page.locator('#developmentTeamProfilePanel').screenshot({path:path.join(out,`${width}-fallback.png`)});
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>JSON.stringify(state)===polishBefore),true);
  assert.deepEqual(await page.evaluate(()=>polishWrites.filter(x=>x.key!=='hani_os_navigation_v1')),[]);
  report.browser.push({width,result:'PASS',portraits:7,profiles:7,feedFailures:3,portrait404:'PASS',overflow:false,stateUnchanged:true,unexpectedWrites:0,pageErrors:0});await context.close();
 }
 report.result='PASS';console.log('PASS polish-215: '+report.unit.length+' unit groups; real app 390/1440, 7 cards/profiles, feed failures, portrait fallback, state preservation');
}catch(e){report.result='FAIL';report.errors.push(e.stack);console.error(e.stack);process.exitCode=1}
finally{if(browser)await browser.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'status.json'),JSON.stringify(report,null,2))}
