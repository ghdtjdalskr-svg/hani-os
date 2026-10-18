// node scripts/hani-newstaff-215.test.mjs [--unit] [playwright/index.mjs] [browser.exe]
// Real app, disposable empty contexts; external traffic blocked, protected state never written.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import http from 'node:http';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const data=require('../hani-character-archive-data.js'),album=require('../hani-character-archive.js');
const ids=['daon','yoonseul'],names=['다온','윤슬'],teams=['finance','life'];
const out=path.join(root,'artifacts/newstaff-215');fs.mkdirSync(out,{recursive:true});
const report={unit:[],browser:[],result:'NOT_RUN'};
const org=vm.createContext({document:{getElementById:()=>null},window:{HANI_CHARACTER_ARCHIVE_DATA:data}});vm.runInContext(read('hani-organization-hub.js'),org);
const roster=org.window.HaniOrganizationRoster;
assert.equal(roster.people.length,19);assert.equal(data.characters.length,12);
assert.equal(data.characters.filter(c=>c.type==='m9_member').length,9);
for(let i=0;i<ids.length;i++){
 const id=ids[i],p=roster.people.find(p=>p.id===id),c=data.characters.find(c=>c.id===id);
 assert.equal(p.status,'planned');assert.equal(p.registration,'planned');assert.equal(p.rank,'사원');assert.equal(p.team,teams[i]);assert.equal(p.floor,'2F');
 assert.ok(Object.isFrozen(c.sections));assert.equal(c.registration,'planned');assert.equal(c.status,'입사 예정');assert.equal(c.rank,'사원');
 assert.match(c.tagline,/회장님/);assert.doesNotMatch(c.canon,/오빠|대표님|HANI\s*O\s+S/);
 for(const label of ['PERSONALITY','CORE AREA','SEONGMIN','VISUAL','BOUNDARY'])assert.ok(c.sections.find(s=>s.label===label)?.text);
 for(const html of [album.page(),album.detail(c)]){assert.ok(html.includes(names[i]));assert.match(html,/입사 예정/);assert.doesNotMatch(html,/undefined/)}
 for(const n of [720,256,128]){
  const file=`assets/profiles/${n===720?'':'thumb/'}hani-profile-${id}-v2${n===720?'':'-'+n}.webp`,b=fs.readFileSync(path.join(root,file));
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
  const base=path.join(root,n===720?'assets/profiles':'assets/profiles/thumb');
  const sizes=fs.readdirSync(base).filter(f=>/^hani-profile-/.test(f)&&!ids.some(id=>f.includes('-'+id))&&(n===720?/\.webp$/:new RegExp('-'+n+'\\.webp$')).test(f)).map(f=>fs.statSync(path.join(base,f)).size);
  assert.ok(b.length>=Math.min(...sizes)&&b.length<=Math.max(...sizes),file+' fits existing byte range');
  // Lossy VP8 dimensions, with optional extended container.
  let dims;for(let o=12;o+8<b.length;){const type=b.toString('ascii',o,o+4),s=o+8,l=b.readUInt32LE(o+4);if(type==='VP8 '){dims=[b.readUInt16LE(s+6)&16383,b.readUInt16LE(s+8)&16383];break}if(type==='VP8X'){dims=[b.readUIntLE(s+4,3)+1,b.readUIntLE(s+7,3)+1];break}o=s+l+l%2}assert.deepEqual(dims,[n,n]);
 }
}
report.unit.push('19 roster / 12 album; unchanged 9 M9; planned rank/team/floor/personality/chairman canon; six WebP dimensions and existing byte ranges');
// Execute the existing author selection projection: public directory membership cannot activate hires.
const board=read('hani-board.js'),start=board.indexOf('  function recentAuthors('),end=board.indexOf('  function themeFor(',start);
const authors=vm.runInNewContext(board.slice(start,end)+';selectAuthors(99,[],[],Date.now(),"test")',{roster:()=>roster,posts:()=>[],comments:()=>[],person:id=>roster.people.find(p=>p.id===id),hash:()=>0});
assert.equal(authors.length,17);assert.ok(authors.every(p=>!ids.includes(p.id)));report.unit.push('existing board author selection excludes both planned hires');
const main=read('hani-main.js'),images=main.slice(main.indexOf('const canonicalProfileImages='),main.indexOf('const pageAgentImage='));
const cards=main.slice(main.indexOf('// Identity and navigation stay local;'),main.indexOf('// ===== v2.9.0 Campus MVP'));
const context=vm.createContext({team:[],document:{querySelectorAll:()=>[]},$:()=>null,esc:String,AbortController,setTimeout,clearTimeout});vm.runInContext(images+cards,context);
for(const id of ids){assert.match(vm.runInContext(`teamCard({key:'${id}',name:'test',role:'role',status:'planned'})`,context),/입사 예정/);assert.match(vm.runInContext(`JSON.stringify(teamMeta('${id}'))`,context),/회장님/)}
report.unit.push('existing main card renderer and full metadata render both hires');
if(process.argv.includes('--unit')){console.log('PASS newstaff-215 unit: '+report.unit.length+' groups');process.exit(0)}
const args=process.argv.slice(2),pw=args[0]||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'),exe=args[1]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html')));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let browser;
try{
 const {chromium}=await import(pathToFileURL(pw).href);browser=await chromium.launch({executablePath:exe,headless:true});
 for(const width of [390,1440])for(const failed of [false,true]){
  const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
  ctx.setDefaultTimeout(15000);
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  if(failed)await ctx.route(/hani-profile-(daon|yoonseul)-v2(-\d+)?\.webp/,r=>r.fulfill({status:404,body:''}));
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&window.HaniOrganizationRoster&&globalThis.HaniBuildingScene);
  await page.evaluate(()=>{unlockLoginGate();cloudStopAutoSync();document.documentElement.dataset.theme='light';document.documentElement.dataset.finish='pure-white';document.body.dataset.finishActive='true';window.newstaffBefore=JSON.stringify(state);window.newstaffWrites=[];for(const m of ['setItem','removeItem','clear']){const original=Storage.prototype[m];Storage.prototype[m]=function(...args){newstaffWrites.push({method:m,key:args[0]});if(m==='setItem'&&args[0]==='hani_os_navigation_v1')return original.apply(this,args);throw Error('Unexpected storage write '+m)}};save=commit=()=>{throw Error('Unexpected save')};showView('organization/people');});
  // Hide the existing floating remote only in screenshot paint, so it cannot cover the album evidence.
  const shotStyle='#haniContextRemote,.hani-remote-mobile-trigger{visibility:hidden}';
  for(let i=0;i<ids.length;i++){
   const id=ids[i],card=page.locator(`[data-card-person="${id}"]`);await card.scrollIntoViewIfNeeded();
   assert.match(await card.innerText(),/입사 예정/);assert.match(await card.innerText(),/사원/);
   await page.waitForFunction(({id,failed})=>{const img=document.querySelector(`[data-card-person="${id}"] img`);return img.complete&&(failed?img.hidden&&!!img.nextElementSibling:img.naturalWidth===720)},{id,failed});
   if(!failed)await card.screenshot({path:path.join(out,`${width}-${id}-card.png`)});
   await card.click();const dialog=page.locator('#haniOrganizationHub dialog');await dialog.waitFor({state:'visible'});
   assert.match(await dialog.innerText(),/입사 예정/);assert.match(await dialog.innerText(),/2F/);assert.match(await dialog.innerText(),/회장님/);
   if(!failed)await dialog.locator('.ogh-portrait').scrollIntoViewIfNeeded();
   await page.waitForFunction(failed=>{const img=document.querySelector('#haniOrganizationHub dialog img');return img?.complete&&(failed?img.hidden:img.naturalWidth===720)},failed);
   await dialog.screenshot({path:path.join(out,`${width}-${id}-${failed?'fallback':'profile'}.png`)});await page.locator('.ogh-close').click();
  }
  await page.evaluate(()=>showView('characterArchive'));assert.equal(await page.locator('#albumMembers [data-character-card]').count(),12);
  for(let i=0;i<ids.length;i++){
   const id=ids[i],card=page.locator(`[data-character-card="${id}"]`);await card.scrollIntoViewIfNeeded();
   assert.match(await card.innerText(),/입사 예정/);await page.waitForFunction(({id,failed})=>{const img=document.querySelector(`[data-character-card="${id}"] img`);return img.complete&&(failed?img.hidden:img.naturalWidth===720)},{id,failed});
   if(!failed)await card.screenshot({path:path.join(out,`${width}-${id}-album-card.png`)});
   await card.locator('button').click();await page.waitForFunction(id=>document.querySelector('#caDetailTitle').textContent.includes(id),names[i]);
   assert.match(await page.locator('#caDetail').innerText(),/입사 예정/);assert.match(await page.locator('#caDetail').innerText(),/2F/);
   await page.waitForFunction(failed=>{const img=document.querySelector('#caDetail .album-photo img');return img.complete&&(failed?img.hidden:img.naturalWidth===720)},failed);
   await page.locator('#caDetail .album-spread').screenshot({path:path.join(out,`${width}-${id}-album-${failed?'fallback':'profile'}.png`),style:shotStyle});
  }
  await page.evaluate(()=>showView('aiTeam'));assert.equal(await page.locator('.ogh-person:visible').count(),10);
  console.log(`Verified ${width}/${failed}: cards, profiles, album, AI list`);
  for(const id of ids)assert.equal(await page.locator(`[data-card-person="${id}"]`).isVisible(),true);
  await page.evaluate(()=>{showView('agentReview')});await page.locator('[data-building-floor="2f"]').click();
  for(const id of ids){const row=page.locator(`[data-planned-person="${id}"]`);assert.equal(await row.isVisible(),true);assert.match(await row.innerText(),/입사 예정/);assert.equal(await page.locator(`#haniOfficeActors [data-person="${id}"]`).count(),0)}
  if(!failed)await page.locator('.hani-building-roster').screenshot({path:path.join(out,`${width}-2f-roster.png`)});
  const nodes=await page.locator('[data-planned-person]').evaluateAll(rows=>{window.newstaffRows=rows;return rows.length});assert.equal(nodes,2);
  await page.locator('[data-building-floor="3f"]').click();assert.equal(await page.locator('[data-planned-person]:visible').count(),0);
  await page.locator('[data-building-floor="2f"]').click();assert.equal(await page.evaluate(()=>newstaffRows.every(row=>row===document.querySelector(`[data-planned-person="${row.dataset.plannedPerson}"]`))),true);
  // Exercise main's existing portrait lifecycle too, including a real 404 and named fallback.
  await page.evaluate(()=>renderTeam());
  console.log(`Verified ${width}/${failed}: persistent 2F roster; checking main fallback`);
  for(const id of ids)await page.waitForFunction(({id,failed})=>{const img=document.querySelector(`#homeTeamList [data-team-key="${id}"] [data-development-portrait]`);return img?.complete&&(failed?img.hidden&&!img.nextElementSibling.hidden:img.naturalWidth===256)},{id,failed});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.equal(await page.evaluate(()=>JSON.stringify(state)===newstaffBefore),true);assert.deepEqual(errors,[]);
  const writes=await page.evaluate(()=>newstaffWrites);assert.ok(writes.every(w=>w.method==='setItem'&&w.key==='hani_os_navigation_v1'));
  report.browser.push({width,images:failed?'404 fallback':'loaded',profileCards:2,albumCards:2,aiStaffCount:10,plannedRoster:2,activeHires:0,stateSame:true,writes,errors});
  console.log(`PASS ${width} / ${failed?'404 fallback':'loaded'}`);await ctx.close();
 }
 report.result='PASS';console.log('PASS newstaff-215: unit + real app 390/1440 loaded/404 profiles, album, AI lists, persistent planned floor rows; state unchanged');
}catch(error){report.result='FAIL';report.error=error.stack;throw error}
finally{fs.writeFileSync(path.join(out,'status.json'),JSON.stringify(report,null,2));if(browser)await browser.close();await new Promise(r=>server.close(r))}
