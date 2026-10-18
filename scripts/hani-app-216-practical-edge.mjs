// Full local runtime, synthetic records, network isolated. No real user records or Cloud.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),out=path.join(root,'artifacts/a216-2');fs.mkdirSync(out,{recursive:true});
const playwright=process.argv[2]||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const executablePath=process.env.HANI_CHROME_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const {chromium}=await import(pathToFileURL(playwright).href);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res)});
let browser;const result={browser:executablePath,widths:[],errors:[]};
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,executablePath});const context=await browser.newContext();await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(String(e)));await page.clock.install({time:new Date('2026-10-18T03:00:00Z')});
 await page.goto(origin,{waitUntil:'load'});await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&window.HANI_STUDY_V02984_TEST);
 await page.evaluate(()=>{
  unlockLoginGate();commit=()=>{window.__commits=(window.__commits||0)+1;return true};save=()=>true;
  window.__commits=0;window.__saved=localStorage.getItem('hani_os_life_v23');
  const dates=['2026-01-10','2026-02-10','2026-02-12','2026-03-10','2026-03-12','2026-04-10','2026-04-12','2026-07-01'];
  state.books=dates.map((completedDate,i)=>({id:'book-'+i,title:'합성 도서 '+i,status:'read',completedDate,author:'테스트',createdAt:completedDate+'T00:00:00Z'}));
  state.movies=[{id:'movie-1',title:'합성 작품',status:'watched',watchedDate:'2026-08-01'}];
  const item=(id,date,amount,extra={})=>({id,date,content:'통신비',category:'fixed',subcategory:'통신',detail:'월요금',payment:'테스트 카드',amount,reimbursement:0,note:'합성 원본 메모',...extra});
  state.ledgerMonths=[{month:'2026-08',items:[item('old','2026-08-01',100)],...ledgerSettlementPeriod('2026-08'),importVersion:'LEDGER_FINAL_V1',importedAt:'2026-08-18T00:00:00Z'},{month:'2026-09',items:[item('new','2026-09-01',200,{reimbursement:50}),item('extra','2026-09-02',30,{content:'새 구독',note:'<script>합성 메모</script>'})],...ledgerSettlementPeriod('2026-09'),importVersion:'LEDGER_FINAL_V1',importedAt:'2026-09-18T00:00:00Z'}];
  state.ui.ledgerMonth='2026-09';state.learningProjects=[{id:'p',name:'합성 복습',category:'other',status:'paused',schedule:'manual'}];state.learningQuizzes=[];
  state.learningWrongAnswers=[1,2,3,4].map(i=>({id:'wrong-'+i,projectId:'p',question:'합성 오답 '+i,choices:['맞는 답','다른 답'],correctAnswer:'맞는 답',userAnswer:'다른 답',explanation:'합성 해설',wrongCount:5-i,reviewStatus:'review',lastWrongDate:'2026-09-01'}));
  state.learningWrongAnswers.push({id:'mastered',projectId:'p',question:'제외된 완료 오답',wrongCount:99,reviewStatus:'mastered'});
  window.HANI_STUDY_V02984_TEST.openTaskProject('p');
  window.__fixtureBefore=JSON.stringify({books:state.books,movies:state.movies,ledger:state.ledgerMonths,goals:state.goalRegistry,wrong:state.learningWrongAnswers});
  renderReading();renderMovies();renderLedger();renderHome();window.HANI_STUDY_V02984_TEST.openTaskProject('p');
 });
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  for(const [view,detailsId,input,edit] of [['reading','reading','bookTitle','[data-book-edit]'],['movie','movie','movieTitle','[data-movie-edit]']]){
   await page.evaluate(view=>{showView(view);document.querySelector('.hani-remote-close')?.click()},view);
   const details=page.locator(`[data-phase1-form="${detailsId}"]`);await details.evaluate(el=>el.open=false);
   assert.equal(await page.locator('#'+input).isVisible(),false);
   await details.locator('summary').click();assert.equal(await page.locator('#'+input).isVisible(),true);
   await details.locator('summary').click();await page.locator(edit).first().click();assert.equal(await page.locator('#'+input).isVisible(),true);assert.match(await page.locator('#'+input).inputValue(),/합성/);
   await details.evaluate(el=>el.open=false);assert.equal(await page.locator('#'+input).isVisible(),false);
   await page.evaluate(()=>window.scrollTo(0,0));
   const order=await page.evaluate(view=>{
    const form=document.querySelector(`[data-phase1-form="${view}"]`),trend=document.getElementById(view==='reading'?'readingActivityTrend':'movieActivityTrend');
    const slot=trend;view==='reading'?renderReading():renderMovies();view==='reading'?renderReading():renderMovies();
    const cards=[...form.parentElement.children].filter(el=>el!==form&&el!==trend&&el.getClientRects().length),box=el=>el.getBoundingClientRect();
    return {sameSlot:slot===document.getElementById(trend.id),unique:document.querySelectorAll('#'+trend.id).length,afterForm:form.nextElementSibling===trend,formBottom:box(form).bottom,trendTop:box(trend).top,trendBottom:box(trend).bottom,nextTops:cards.map(el=>box(el).top)};
   },view);
   assert.equal(order.sameSlot,true,'rerenders reuse the persistent trend slot');assert.equal(order.unique,1);assert.equal(order.afterForm,true,'trend immediately follows the record form in DOM order');
   assert.ok(order.formBottom<=order.trendTop&&order.nextTops.every(top=>order.trendBottom<=top),'trend follows record row and precedes every list/goal card on phone and desktop: '+JSON.stringify(order));
   assert.ok(order.trendTop>=0&&order.trendTop<1000,'trend starts in the initial viewport');
   await page.screenshot({path:path.join(out,`${view}-${width}.png`),fullPage:true});
  }
  assert.match(await page.locator('#readingActivityTrend').innerText(),/쉬는 중/);assert.match(await page.locator('#movieActivityTrend').innerText(),/시청 사용 추이/);
  await page.evaluate(()=>showView('diet'));
  const boxes=await page.evaluate(()=>Object.fromEntries(['.body-quick-input','.body-chart-card'].map(s=>[s,document.querySelector(s).getBoundingClientRect().top])));
  if(width===390)assert.ok(boxes['.body-quick-input']<boxes['.body-chart-card'],JSON.stringify(boxes));
  await page.locator('#bodyWeight').fill('72.50');assert.equal(await page.locator('#bodyWeight').inputValue(),'72.50');
  await page.screenshot({path:path.join(out,`weight-${width}.png`),fullPage:true});
  await page.evaluate(()=>{showView('ledger');renderLedger()});await page.locator('#ledgerPractical>details').nth(0).locator(':scope>summary').click();await page.locator('#ledgerPractical>details').nth(1).locator(':scope>summary').click();
  assert.match(await page.locator('#ledgerPractical').innerText(),/100원 → 200원/);assert.match(await page.locator('#ledgerPractical').innerText(),/회수 예정\(받았는지 확인 필요\)/);assert.match(await page.locator('#ledgerPractical').innerText(),/합성 원본 메모/);
  await page.locator('#ledgerPractical details details').first().locator('summary').click();assert.match(await page.locator('#ledgerPractical').innerText(),/2026-08-01/);assert.match(await page.locator('#ledgerPractical').innerText(),/2026-09-01/);
  assert.equal(await page.locator('#ledgerPractical script').count(),0);await page.screenshot({path:path.join(out,`ledger-${width}.png`),fullPage:true});
  await page.evaluate(()=>{showView('monthlyReport');renderMonthlyReport()});await page.locator('#monthlyReadingActivityTrend').waitFor({state:'visible'});assert.match(await page.locator('#monthlyReadingActivityTrend').innerText(),/독서 사용 추이/);await page.screenshot({path:path.join(out,`report-${width}.png`),fullPage:true});
  await page.evaluate(()=>{showView('home');renderHome()});assert.equal(await page.locator('#settlementQuickCheck').isVisible(),true);assert.equal(await page.locator('[data-check-go]').count(),4);if(width===390)assert.equal(await page.evaluate(()=>document.querySelector('#homeTodayTaskMini').getBoundingClientRect().top<document.querySelector('#settlementQuickCheck').getBoundingClientRect().top),true,'today tasks keep priority');await page.screenshot({path:path.join(out,`checklist-${width}.png`),fullPage:true});
  await page.locator('[data-check-go="ledger"]').click();assert.equal(await page.locator('body').getAttribute('data-view'),'ledger');
  await page.evaluate(()=>{showView('reading');renderReading()});await page.locator('#readingActivityTrend [data-activity-goal]').click();assert.equal(await page.locator('body').getAttribute('data-view'),'settings');assert.equal(await page.locator('#goalRegistryPanel').isVisible(),true);
  await page.evaluate(()=>{showView('study');window.HANI_STUDY_V02984_TEST.openTaskProject('p')});await page.locator('#studyQuickWrongOpen').click();assert.equal(await page.locator('#studyWrongPanel .study-wrong-row').count(),3);assert.equal(await page.locator('#studyWrongPanel .study-retry').count(),3);assert.doesNotMatch(await page.locator('#studyWrongPanel').innerText(),/제외된 완료 오답/);await page.screenshot({path:path.join(out,`wrong-${width}.png`),fullPage:true});await page.locator('#studyQuickWrongExit').click();
  await page.locator('#studyQuickWrongOpen').click();await page.evaluate(()=>window.HANI_STUDY_V02984_TEST.openTaskProject('p'));assert.equal(await page.locator('#studyWrongPanel .study-wrong-row').count(),4,'existing task entry clears the temporary three-row selection');assert.equal(await page.locator('#studyQuickWrongExit').count(),0);
  assert.equal(await page.evaluate(()=>__commits),0,'entry and display never save');
  assert.equal(await page.evaluate(()=>JSON.stringify({books:state.books,movies:state.movies,ledger:state.ledgerMonths,goals:state.goalRegistry,wrong:state.learningWrongAnswers})===__fixtureBefore),true);
  result.widths.push({width,passed:true});
 }
 // Existing retry flow still handles a real radio choice and one existing commit.
 await page.locator('#studyQuickWrongOpen').click();const row=page.locator('#studyWrongPanel .study-wrong-row').first();await row.locator('input[value="0"]').check();await row.locator('[data-wrong-submit]').click();
 assert.equal(await page.evaluate(()=>__commits),1);assert.equal(await page.evaluate(()=>state.learningWrongAnswers.find(r=>r.id==='wrong-1').reviewStatus),'retry_completed');
 assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')===__saved),true);assert.deepEqual(result.errors,[]);result.passed=true;console.log(JSON.stringify(result));
}catch(error){result.failure=String(error.stack||error);console.error(result.failure);process.exitCode=1}
finally{fs.writeFileSync(path.join(out,'edge-result.json'),JSON.stringify(result,null,2));await browser?.close();server.close()}
