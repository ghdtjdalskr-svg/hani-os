// Usage: node scripts/hani-proactive-204-ui.test.mjs <playwright/index.mjs> <browser.exe>
// Synthetic state, existing save stub, external requests blocked. No production account/data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const [runtime,exe]=process.argv.slice(2);if(!runtime||!exe)throw Error('Pass playwright/index.mjs and browser executable');
const {chromium}=await import(pathToFileURL(runtime).href);
const evidence=path.join(root,'artifacts/proactive-204');fs.mkdirSync(evidence,{recursive:true});
const server=http.createServer((req,res)=>{
 const uri=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 const type=file.endsWith('.js')||file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream';
 res.setHeader('Content-Type',type+'; charset=utf-8');res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser,cases=0;
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
// A pressed native input must keep its hit target while the card remains still.
const checkCampusInput=async(page,group)=>{
 const input=group.locator('input[type=checkbox]').first();await input.scrollIntoViewIfNeeded();await frame(page);
 const before=await input.boundingBox();assert.ok(before);await page.mouse.move(before.x+before.width/2,before.y+before.height/2);await page.mouse.down();
 try{assert.equal(await group.evaluate(el=>getComputedStyle(el).scale),'none','input interaction must not scale the parent card');assert.deepEqual(await input.boundingBox(),before,'pressed checkbox keeps its hit target');}finally{await page.mouse.up();}
 assert.equal(await input.isChecked(),true,'native click checks the input');await input.uncheck();await input.check();
};
const show=async(page,view)=>{await page.evaluate(view=>showView(view),view);await page.waitForFunction(view=>document.body.dataset.view===view&&document.querySelector('#'+view+'.active')?.getClientRects().length,view);await frame(page);};
try{
 browser=await chromium.launch({executablePath:exe,headless:true});
 for(const width of [1440,390])for(const finish of ['porcelain-cream','midnight-black']){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await context.addInitScript(()=>{
   const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-10-11T03:00:00Z']))}static now(){return new NativeDate('2026-10-11T03:00:00Z').getTime()}};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.dismiss());
  await page.goto(origin);await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&window.HANI_YUNA_HELPDESK&&window.HANI_STUDY_V02984_TEST&&window.HANI_GOAL_PROGRESS);
  await page.evaluate(finish=>{
   unlockLoginGate();document.documentElement.dataset.finish=finish;document.body.dataset.finishActive='true';
   state=freshState();state.ui.campusActiveSemesterId='semester';
   const row=(week,endAt,done=false)=>({id:'w'+week,week:String(week),startAt:'2026-10-01T00:00',endAt,topic:'수업 '+week,content:'보존 내용',done});
   const course=(id,name)=>({id,name,type:'전공',credits:3,curriculum:[row(1,'2026-10-09T23:59'),row(2,'2026-10-08T23:59'),row(3,'2026-10-11T00:00'),row(4,'2026-10-02T23:59',true)]});
   state.campusSemesters=[{id:'semester',term:'2026-2',status:'active',courses:[course('a','자료구조'),course('b','통계학')],events:[]},{id:'archived',term:'2025-2',status:'archived',courses:[course('c','보관 과목')],events:[]}];
   state.tasks=[{id:'old-task',text:'기존 과제',due:'2026-10-13',sourceType:'university',courseName:'자료구조',done:false},{id:'far',text:'14일 과제',due:'2026-10-25',sourceType:'university',courseName:'자료구조',done:false},{id:'manual',text:'일반 할 일',due:'2026-10-12',done:false}];
   state.certificates=[{id:'past',name:'지난 시험',examDate:'2026-10-10',status:'taken'},{id:'today',name:'오늘 시험',examDate:'2026-10-11',status:'planned'},{id:'near',name:'23일 시험',examDate:'2026-11-03',resultDate:'2026-11-20',status:'planned'},{id:'far',name:'31일 시험',examDate:'2026-11-11',status:'planned'}];
   const api=window.HANI_STUDY_V02984_TEST,project=(id,name,status)=>api.normalizeProject({id,name,category:'university',status,scheduleType:'manual'});
   state.learningProjects=[project('project','알림 테스트','active'),project('other','프로젝트별 테스트','active'),project('paused','중지 프로젝트','paused'),project('archived','보관 프로젝트','archived')];
   const quiz=(id,projectId,status)=>api.normalizeQuiz({id,projectId,title:'알림 퀴즈 '+id,status,date:'2026-10-10',questions:[{prompt:'표본 문항',choices:['가','나','다','라'],answerIndex:0}],answers:[null]});
   state.learningQuizzes=[...['pending','in_progress','completed'].map((status,i)=>quiz('q'+i,'project',status)),quiz('other-pending','other','pending'),quiz('other-completed','other','completed'),quiz('paused-pending','paused','pending'),quiz('paused-progress','paused','in_progress'),quiz('archived-pending','archived','pending'),quiz('orphan-missing','missing','pending'),quiz('orphan-empty','','pending')];
   window.saveCalls=0;window.failSave=false;window.saved=[];save=()=>{window.saveCalls++;if(!window.failSave)window.saved.push(structuredClone(state));return {ok:!window.failSave,message:'합성 저장 결과'}};
   window.storageWrites=[];const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage)window.storageWrites.push(k);return set.call(this,k,v)};
   dataHubInvalidate=()=>{};dataHubRefresh=()=>{};
   goalPeriodReadContext=()=>({source:structuredClone(state),canonical:{brokerTotal:()=>0,ledgerSpending:()=>0},asOf:'2026-10-11',evaluationAt:'2026-10-11T12:00:00+09:00'});
   renderAll();showView('home');window.readBaseline=JSON.stringify(state);
  },finish);
  await page.waitForFunction(()=>document.querySelector('#home [data-care-campus]')?.getClientRects().length&&document.querySelector('[data-study-pending]')?.textContent==='3');await frame(page);
  const home=page.locator('#home [data-hani-care-cards]');
  assert.equal(await home.locator('[data-care-campus]').count(),2);assert.equal(await home.locator('[data-care-assignment]').count(),1);assert.equal(await home.locator('[data-care-certificate]').count(),1);assert.equal(await home.locator('[data-care-quiz]').count(),0,'QA-210: unfinished quizzes live in the Remote today list');
  assert.match(await home.innerText(),/지난주 2주차 수업 다 들으셨어요/);assert.doesNotMatch(await home.innerText(),/보관 과목|31일 시험|중지 프로젝트|보관 프로젝트/);
  assert.deepEqual(await page.evaluate(()=>window.HANI_STUDY_V02984_TEST.pendingLearningQuizzes().map(quiz=>quiz.id)),['q0','q1','other-pending']);assert.equal(await page.locator('[data-study-pending]').getAttribute('aria-label'),'안 푼 퀴즈 3개');
  assert.equal(await page.locator('#home .learning-derived[data-learning-quiz]:not([data-learning-quiz=""])').count(),0);
  assert.equal(await page.evaluate(()=>JSON.stringify(state)===window.readBaseline),true);assert.equal(await page.evaluate(()=>window.saveCalls),0);
  await page.evaluate(()=>{window.careSlot=document.querySelector('#home [data-hani-care-cards]');renderHome();renderHome()});assert.equal(await page.evaluate(()=>window.careSlot===document.querySelector('#home [data-hani-care-cards]')),true);
  await page.evaluate(()=>window.HANI_CONTEXT_REMOTE_V1?.update());await page.locator('[data-remote-quiz]').first().dispatchEvent('click');await page.waitForFunction(()=>document.querySelector('#studyQuizDetail')?.getClientRects().length);assert.match(await page.locator('#studyQuizDetail').innerText(),/알림 퀴즈/);assert.equal(await page.evaluate(()=>window.saveCalls),0);
  await show(page,'intake');await page.waitForFunction(()=>document.querySelectorAll('#intake [data-care-campus]').length===2);const desk=page.locator('#intake [data-hani-care-cards]');assert.equal(await desk.locator('[data-care-quiz]').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(state)===window.readBaseline),true);assert.equal(await page.evaluate(()=>window.saveCalls),0);
  const group=desk.locator('[data-care-campus]').first();await group.locator('[data-care-part]').click();await checkCampusInput(page,group);
  await page.evaluate(()=>{window.deskSlot=document.querySelector('#intake [data-hani-care-cards]');window.HANI_YUNA_HELPDESK.init();renderHome()});assert.equal(await page.evaluate(()=>window.deskSlot===document.querySelector('#intake [data-hani-care-cards]')),true);assert.equal(await group.locator('input:checked').count(),1);
  await group.locator('form button[type=submit]').click();assert.equal(await page.evaluate(()=>window.saveCalls),1);assert.equal(await page.evaluate(()=>state.campusSemesters[0].courses[0].curriculum[1].done),true);assert.equal(await page.evaluate(()=>state.campusSemesters[0].courses[1].curriculum[1].done),false);
  await page.waitForFunction(()=>document.querySelectorAll('#intake [data-care-campus]').length===2&&!document.querySelector('#intake [data-care-campus]')?.textContent.includes('자료구조'));await desk.locator('[data-care-campus]').first().locator('[data-care-all]').click();await page.waitForFunction(()=>document.querySelectorAll('#intake [data-care-campus]').length===1);assert.equal(await page.evaluate(()=>state.campusSemesters[0].courses[1].curriculum[1].done),true);
  const beforeDismiss=await page.evaluate(()=>JSON.stringify(state.campusSemesters));await desk.locator('[data-care-dismiss]').click();await page.waitForFunction(()=>document.querySelectorAll('#intake [data-care-campus]').length===0);assert.equal(await desk.locator('[data-care-campus]').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(state.campusSemesters)),beforeDismiss);assert.equal(await page.evaluate(()=>Object.values(state.ui.campusWeekDismissals)[0]),'2026-10-12');
  await show(page,'university');await page.waitForFunction(()=>document.querySelector('[data-campus-assignment-form]')?.getClientRects().length);
  const form=page.locator('#university [data-campus-assignment-form]');assert.equal(await form.count(),1);assert.equal(await form.locator('button[type=submit]').count(),1);await form.locator('[name=courseId]').selectOption('a');await form.locator('[name=title]').fill('새 과제');await form.locator('[name=date]').fill('2026-10-12');await form.locator('[name=time]').fill('18:30');await form.locator('button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#university [data-campus-assignments]')?.textContent.includes('새 과제'));
  const task=await page.evaluate(()=>state.tasks.at(-1));assert.equal(task.sourceType,'university');assert.equal(task.courseName,'자료구조');assert.equal(task.dueAt,'2026-10-12T18:30:00+09:00');assert.match(await page.locator('[data-campus-assignments]').innerText(),/새 과제|14일 과제/);
  await page.evaluate(()=>window.failSave=true);const beforeFail=await page.evaluate(()=>JSON.stringify(state));await form.locator('[name=title]').fill('실패 과제');await form.locator('[name=date]').fill('2026-10-12');await form.locator('button[type=submit]').click();assert.equal(await page.evaluate(()=>JSON.stringify(state)),beforeFail);await page.evaluate(()=>window.failSave=false);
  await show(page,'certificate');assert.deepEqual(await page.locator('#certificateList article').evaluateAll(rows=>rows.map(r=>r.dataset.certificate)),['today','near','far','past']);assert.match(await page.locator('#certificateList').innerText(),/D-Day|D-23|종료/);
  await show(page,'home');await page.waitForFunction(()=>document.querySelector('#home [data-care-assignment]')?.getClientRects().length&&document.querySelector('#home [data-care-assignment]')?.textContent.includes('새 과제'));assert.match(await home.locator('[data-care-assignment]').innerText(),/새 과제/);
  await page.evaluate(()=>{monthlyReportBoard='quarterly';showView('monthlyReport');monthlyReportRenderBoard()});await page.waitForFunction(()=>document.querySelector('#quarterGoalReport [data-quarter-goals-link]')?.getClientRects().length);await frame(page);
  const beforeGoalRead=await page.evaluate(()=>window.saveCalls);const report=page.locator('#quarterGoalReport');assert.equal(await report.locator('[data-guidance-value]').count(),0);await report.locator('[data-quarter-goals-link]').click();
  await page.waitForFunction(()=>document.querySelector('[data-quarter-goal-editor] #goalRegistryForm')?.getClientRects().length);assert.equal(await page.locator('#goalRegistryForm').count(),1);
  const goal=page.locator('#goalRegistryForm');await goal.locator('[name=metric_id]').selectOption('books_completed_count');await goal.locator('[name=value]').fill('12');await goal.locator('[type=submit]').click();assert.match(await page.locator('#goalRegistryPreview').innerText(),/12/);assert.equal(await page.evaluate(()=>window.saveCalls),beforeGoalRead);
  await page.locator('#goalRegistryApprove').click();assert.equal(await page.evaluate(()=>window.saveCalls),beforeGoalRead+1);assert.equal(await page.evaluate(()=>state.goalRegistry.at(-1).value),12);
  await page.locator('[data-quarter-tab=actual]').click();assert.equal(await page.locator('#quarterGoalReport [data-guidance-value]').count(),0);await show(page,'settings');assert.equal(await page.locator('#settings #goalRegistryPanel').count(),1);assert.equal(await page.locator('#goalRegistryForm').count(),1);
  await show(page,'intake');await page.waitForFunction(()=>document.querySelector('#intake [data-care-assignment]')?.getClientRects().length&&document.querySelector('#intake [data-care-assignment]')?.textContent.includes('새 과제'));assert.equal(await desk.count(),1);await desk.scrollIntoViewIfNeeded();assert.ok(await desk.evaluate(el=>el.scrollWidth<=el.clientWidth+1));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(evidence,`${width}-${finish}.png`)});
  assert.deepEqual(await page.evaluate(()=>window.storageWrites.filter(k=>k!=='hani_os_navigation_v1')),[]);assert.deepEqual(errors,[]);
  cases++;await context.close();
 }
 console.log(`PASS ${cases} synthetic app UI combinations: 1440/390 × Porcelain/Midnight; cards with per-project pending counts (paused/archived/orphans excluded), all/partial/dismiss, task save/rollback, quiz navigation, D-Day, read-only report and existing goal Preview/save. External requests blocked. Screenshots: artifacts/proactive-204.`);
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
