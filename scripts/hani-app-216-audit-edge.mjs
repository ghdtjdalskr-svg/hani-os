// Full local runtime; synthetic data only, external network blocked.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),out=path.join(root,'artifacts/a216-3');fs.mkdirSync(out,{recursive:true});
const playwright=process.argv[2]||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const executablePath=process.env.HANI_CHROME_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const baseline=process.argv[3]||path.join(out,'baseline');assert.ok(fs.existsSync(path.join(baseline,'index.html')),'raw pre-patch snapshot required for before/after comparison');
const {chromium}=await import(pathToFileURL(playwright).href);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://local'),before=url.pathname.startsWith('/before/'),relative=(before?url.pathname.slice(7):url.pathname).replace(/^\//,'')||'index.html';
 const snapshot=path.join(baseline,relative),file=before&&fs.existsSync(snapshot)?snapshot:path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
let browser;const result={browser:executablePath,screens:[],errors:[]};
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,executablePath});
 const layouts={};
 for(const mode of ['before','after'])for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000}});await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage(),requests=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>result.errors.push({mode,width,error:String(e)}));
  await page.addInitScript(()=>{let seed=42;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296)});
  await page.clock.install({time:new Date('2026-10-18T03:00:00Z')});
  await page.goto(origin+(mode==='before'?'/before/':'/'),{waitUntil:'load'});
  await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&window.HaniBoard&&window.HaniBuildingScene);
  await page.evaluate(()=>{
   unlockLoginGate();commit=()=>{window.__commits=(window.__commits||0)+1;return true};save=()=>true;window.__commits=0;
   window.__protectedBefore=localStorage.getItem('hani_os_life_v23');
   state.tasks=[{id:'task-fixture',text:'합성 오늘 할 일',due:'2026-10-18',done:false}];
   state.books=[{id:'book-fixture',title:'합성 독서',status:'read',completedDate:'2026-10-17'}];renderHome();
   document.querySelector('.hani-remote-close')?.click();
  });
  if(mode==='after')assert.equal(requests.some(u=>u.includes('hani-pdf-worker')),false,'no PDF worker request during boot');
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
  for(const [view,selector]of [['home','#home'],['agentReview','#haniOfficeLive'],['board','#board']]){
   await page.evaluate(view=>{showView(view);document.querySelector('.hani-remote-close')?.click();window.scrollTo(0,0)},view);
   await page.locator(selector).waitFor({state:'visible'});
   await page.screenshot({path:path.join(out,`${mode}-${view}-${width}.png`),fullPage:true,animations:'disabled'});
   const layout=await page.evaluate(selector=>{
    const host=document.querySelector(selector),targets=[host,...host.querySelectorAll(':scope>.grid,:scope>.grid>.card,.home-today-task-mini,.office-map,#haniOfficeMap,.board-header,.board-toolbar')];
    return targets.filter(el=>el.getBoundingClientRect().width>0).map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {id:el.id,cls:el.className,width:Math.round(r.width),height:Math.round(r.height),display:s.display,font:s.fontSize,color:s.color,background:s.backgroundColor,padding:s.padding,gap:s.gap}});
   },selector);
   layouts[`${mode}-${view}-${width}`]=layout;result.screens.push({mode,view,width});
   if(mode==='after')assert.deepEqual(layout,layouts[`before-${view}-${width}`],`${view} ${width}: stylesheet move preserves layout/styles`);
  }
  if(mode==='after'){
   await page.evaluate(()=>{
    const bad='"><img src=x onerror="window.__xss=true">',good='valid-record';window.__badId=bad;
    const record=(id)=>({id,date:'2026-10-18',weight:70,steps:5000,distance:3,note:'합성 기록'});
    state.body=[record(bad),record(good)];state.exercise=[record(bad),record(good)];
    state.books=[{id:bad,title:'악성 ID 도서',status:'wish'},{id:good,title:'정상 도서',status:'wish'}];
    state.movies=[{id:bad,title:'악성 ID 작품',status:'wish',contentType:'영화'},{id:good,title:'정상 작품',status:'wish',contentType:'영화'}];
    window.__beforeIds=JSON.stringify([state.body,state.exercise,state.books,state.movies]);
    renderBody();renderExercise();renderReading();renderMovies();
   });
   for(const selector of ['#bodyRows','#exerciseRows','#wishBooks','#wishMovies']){
    assert.equal(await page.locator(selector+' img[src="x"]').count(),0);
    assert.ok(await page.locator(selector+' button[disabled]').count()>0,selector+': invalid ID actions disabled');
   }
   assert.equal(await page.evaluate(()=>!!window.__xss),false);
   assert.equal(await page.evaluate(()=>JSON.stringify([state.body,state.exercise,state.books,state.movies])===__beforeIds),true,'render never rewrites imported data');
   await page.evaluate(()=>{
    deployRuntime.health={github_reachable:true,main_sha:'a'.repeat(40)};deployRuntime.pending={pending:null};deployRuntime.stage=null;deployRuntime.qa=null;deployRuntime.merged=null;deployCenterRender();
   });
   assert.doesNotMatch(await page.locator('#deployExecutiveState').textContent(),/완료/,'empty Inbox is not deployment evidence');
   await page.evaluate(()=>{showView('deployment');deployRuntime.merged={merged:true,merged_sha:'a'.repeat(40),production_readback:'PASS'};deployCenterRender()});
   assert.equal(await page.locator('#deployFinalSummary').textContent(),'main 병합 완료 · 사이트 반영 확인 중');
   assert.equal(await page.locator('#deploySiteSteps').isVisible(),true,'four stages are visible without opening technical details');
   assert.match(await page.locator('#deploySiteSteps').textContent(),/Pages 반영 확인 · 확인 대기/);
   await page.screenshot({path:path.join(out,`deploy-pending-${width}.png`),fullPage:true});
   await page.evaluate(()=>{Object.assign(deployRuntime.merged,{site_verified_sha:'a'.repeat(40),pages_readback:'PASS',latest_js_readback:'PASS',functional_readback:'PASS'});deployCenterRender()});
   assert.equal(await page.locator('#deployFinalSummary').textContent(),'운영 반영 완료');assert.equal(await page.locator('#deployExecutiveState').textContent(),'운영 반영 완료');
   await page.evaluate(()=>showView('intake'));assert.equal(await page.locator('#yunaTargetHelp').isVisible(),true);
   const help=await page.locator('#yunaTargetHelp').innerText();for(const text of ['바로 저장','담당 메뉴로 안내','미리보기만'])assert.ok(help.includes(text));
   await page.locator('[data-yuna-kind="book"]').click();await page.locator('#yunaInput').fill('오늘 주식 투자 책 완독했어');await page.locator('#yunaSend').click();
   await page.locator('#yunaSave').waitFor({state:'visible'});assert.equal(await page.locator('#yunaRoute').count(),0);assert.match(await page.locator('.yuna-preview').innerText(),/책 · 독서/);
   await page.screenshot({path:path.join(out,`yuna-book-${width}.png`),fullPage:true});
   assert.equal(await page.evaluate(()=>__commits),0);assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')===__protectedBefore),true);
   assert.equal(requests.some(u=>u.includes('hani-pdf-worker')),false,'non-PDF navigation never loads worker');
  }
  await context.close();
 }
 assert.deepEqual(result.errors,[]);result.passed=true;console.log('PASS Edge: before/after home, office, lounge 390/1440; malformed IDs; deploy evidence; book Preview; lazy worker; no protected writes');
 fs.writeFileSync(path.join(out,'layouts.json'),JSON.stringify(layouts,null,2));
}catch(error){result.failure=String(error.stack||error);console.error(result.failure);process.exitCode=1}
finally{fs.writeFileSync(path.join(out,'edge-result.json'),JSON.stringify(result,null,2));await browser?.close();server.close()}
