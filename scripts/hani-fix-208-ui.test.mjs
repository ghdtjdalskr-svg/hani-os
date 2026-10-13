// node scripts/hani-fix-208-ui.test.mjs <playwright index.mjs> <browser exe>
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const evidence=path.join(root,'artifacts/sidebar-mini');fs.mkdirSync(evidence,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const uri=decodeURIComponent(new URL(req.url,'http://test').pathname),file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));if(!file.startsWith(root+path.sep)||uri.split('/').some(part=>part.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
let browser;const passed=[];
// Width thresholds can pass during the existing 250ms grid transition.
// Measure after finite sidebar transitions, preserving exact geometry assertions.
const settleSidebar=page=>page.waitForFunction(()=>{
 const app=document.querySelector('#app'),sidebar=document.querySelector('#sidebar');
 sidebar.getBoundingClientRect();
 return [...app.getAnimations(),...sidebar.getAnimations({subtree:true})].every(animation=>
  animation.effect.getComputedTiming().endTime===Infinity||(!animation.pending&&animation.playState!=='running'));
});
try{
 browser=await chromium.launch({executablePath:process.argv[3],headless:true});
 for(const width of [1440,1024])for(const finish of ['porcelain-cream','midnight-black']){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'}),page=await context.newPage(),errors=[];
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.dismiss());
  await page.goto(origin);await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&!!window.HaniMotion&&!!window.HANI_STUDY_V02984_TEST);
  await page.evaluate(finish=>{unlockLoginGate();document.documentElement.dataset.finish=finish;document.documentElement.dataset.theme=finish==='midnight-black'?'dark':'light';showView('study');state.learningProjects=[{id:'jlpt',name:'JLPT N3',status:'active',scheduleType:'manual'},{id:'economy',name:'주식/경제/거시경제 기초',status:'active',scheduleType:'manual'}];const api=window.HANI_STUDY_V02984_TEST;state.learningQuizzes=Array.from({length:11},(_,i)=>api.normalizeQuiz({id:'quiz-'+i,projectId:i<7?'jlpt':i<10?'economy':'gone',status:i<5||i>=7&&i<10?'completed':'pending',questions:[{prompt:'합성 문제',choices:['A','B','C','D'],answerIndex:0}],answers:[null]}));renderAll();showView('home');renderHaniCareHome();},finish);
  await page.waitForFunction(()=>document.querySelector('[data-study-pending]')?.textContent==='2');
  assert.equal(await page.locator('#home [data-care-quiz]').count(),0,'QA-210: quiz reminder moved to the Remote');await page.evaluate(()=>window.HANI_CONTEXT_REMOTE_V1?.update());assert.equal(await page.locator('[data-remote-today-count]').first().textContent(),'2');
    
  await settleSidebar(page);
  const expanded=await page.locator('#sidebar .nav-btn').evaluateAll(buttons=>buttons.map(button=>{const icon=button.querySelector('.ico').getBoundingClientRect(),rect=button.getBoundingClientRect();return [button.dataset.view,icon.width,rect.width]}));
  await page.locator('#sideToggle').click();await page.waitForFunction(()=>document.querySelector('#app').classList.contains('sidebar-mini'));
  await page.waitForFunction(()=>document.querySelector('#sidebar').getBoundingClientRect().width<100);
  await settleSidebar(page);
  const audit=await page.evaluate(()=>{
   const sidebar=document.querySelector('#sidebar'),box=sidebar.getBoundingClientRect(),failures=[],visible=el=>!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
   for(const el of sidebar.querySelectorAll('*'))if(visible(el)&&el.getBoundingClientRect().width>box.width+1)failures.push('wide: '+el.className);
   const walker=document.createTreeWalker(sidebar,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){const node=walker.currentNode;if(!node.textContent.trim()||!visible(node.parentElement))continue;const range=document.createRange();range.selectNodeContents(node);const tops=new Set([...range.getClientRects()].filter(r=>r.width&&r.height).map(r=>Math.round(r.top)));if(tops.size>2)failures.push('text wraps: '+node.textContent.trim());}
   for(const button of sidebar.querySelectorAll('.nav-btn'))if(visible(button)){
    const icon=button.querySelector('.ico'),rect=icon.getBoundingClientRect(),nav=button.getBoundingClientRect();
    if(Math.abs(rect.left+rect.width/2-(box.left+box.width/2))>4||Math.abs(rect.top+rect.height/2-(nav.top+nav.height/2))>4)failures.push('off-center: '+button.dataset.view);
    if(!button.title||!button.getAttribute('aria-label'))failures.push('tooltip: '+button.dataset.view);
    const badge=button.querySelector('[data-study-pending]');if(badge&&!badge.hidden){const b=badge.getBoundingClientRect();if(b.left<rect.left-1||b.right>rect.right+1||b.top<rect.top-1||b.bottom>rect.bottom+1)failures.push('badge outside icon');}
   }
   for(const el of sidebar.querySelectorAll('.group-head>*,.nav-new-pill,.sidebar-team-mini,.brand,.pill:not([data-study-pending])'))if(visible(el))failures.push('leaked label/card: '+el.className);
   return {failures,width:box.width};
  });
  await page.screenshot({path:path.join(evidence,`${width}-${finish}.png`),fullPage:true});fs.writeFileSync(path.join(evidence,`${width}-${finish}.json`),JSON.stringify(audit,null,2));assert.deepEqual(audit.failures,[]);
  await page.locator('#sideToggle').click();await page.waitForFunction(()=>!document.querySelector('#app').classList.contains('sidebar-mini'));
  await page.waitForFunction(()=>document.querySelector('#sidebar').getBoundingClientRect().width>200);
  await settleSidebar(page);
  assert.deepEqual(await page.locator('#sidebar .nav-btn').evaluateAll(buttons=>buttons.map(button=>{const icon=button.querySelector('.ico').getBoundingClientRect(),rect=button.getBoundingClientRect();return [button.dataset.view,icon.width,rect.width]})),expanded,'expanded geometry restored');
  await page.evaluate(()=>showView('study'));const archive=page.locator('.study-orphan-archive');await archive.locator('summary').click();await archive.locator('[data-study-orphan-open]').click();assert.equal(await archive.locator('.study-exam-sheet').count(),1);assert.equal(await archive.locator('.study-exam-sheet input:enabled').count(),0);
  assert.equal(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return new Set(ids).size===ids.length}),true,'no duplicate DOM IDs');
  await archive.locator('[data-study-attach-select]').selectOption('jlpt');const quizBefore=await page.evaluate(()=>JSON.stringify(state.learningQuizzes));await archive.locator('[data-study-orphan-attach]').click();assert.equal(await page.evaluate(()=>JSON.stringify(state.learningQuizzes)),quizBefore,'confirmation cancelled: unchanged');
  // Test only the existing commit contract in a disposable browser, without writing data or contacting Cloud.
  await page.evaluate(()=>{window.fix208OriginalCommit=commit;window.fix208Saves=0;window.fix208SaveOk=true;commit=()=>{fix208Saves++;renderAll();return fix208SaveOk};state.tasks=[{id:'motion-task',text:'합성 할 일',done:false}];state.books=[{id:'motion-book',title:'합성 책',status:'wish',topic:'교양'}];showView('tasks');renderTasks()});
  await page.locator('[data-task-check="motion-task"]').check();assert.equal(await page.locator('.hani-motion-burst').count(),1);assert.match(await page.locator('#toast').innerText(),/^수아/);
  await page.locator('[data-task-check="motion-task"]').dispatchEvent('change');assert.equal(await page.locator('.hani-motion-burst').count(),1,'repeat completion silent');
  await page.waitForFunction(()=>!document.querySelector('.hani-motion-burst'));await page.evaluate(()=>{showView('reading');const button=document.querySelector('[data-book-toggle="motion-book"]');HaniMotion.trackGoal('edge:goal',90,button.getBoundingClientRect(),'reading');HaniMotion.trackGoal('edge:goal',100,button.getBoundingClientRect(),'reading');HaniMotion.trackGoal('edge:goal',110,button.getBoundingClientRect(),'reading')});assert.equal(await page.locator('.hani-motion-burst').count(),1,'goal crossing once');
  await page.waitForFunction(()=>!document.querySelector('.hani-motion-burst'));await page.locator('[data-book-toggle="motion-book"]').click();assert.equal(await page.locator('.hani-motion-burst').count(),1);assert.match(await page.locator('#toast').innerText(),/^하루/);
  await page.evaluate(()=>showView('asset'));await page.waitForFunction(()=>!document.querySelector('#assetStats .hani-motion-number-overlay'));
  // Compare the same final text: a longer value can legitimately wrap at 1024px.
  await page.evaluate(()=>{document.querySelector('#assetStats .value').textContent='12,345원'});
  const numberBefore=await page.locator('#assetStats .value').first().boundingBox();await page.evaluate(()=>HaniMotion.countUp(document.querySelector('#assetStats .value'),'12,345원','edge:count'));
  const numberDuring=await page.locator('#assetStats .value').first().boundingBox();assert.equal(numberDuring.height,numberBefore.height,'number has no height shift');
  assert.equal(await page.evaluate(()=>HaniMotion.countUp(document.querySelector('#assetStats .value'),'12,345원','edge:count')),false,'unchanged target skips');
  await page.waitForFunction(()=>!document.querySelector('#assetStats .hani-motion-number-overlay'));assert.equal(await page.locator('#assetStats .value').first().innerText(),'12,345원');
  assert.equal((await page.locator('#assetStats .value').first().boundingBox()).height,numberBefore.height,'final number preserves static target height');
  // CDP media emulation returns before the browser dispatches the change event.
  // Keep effects active so this checks the off-switch, not their natural expiry.
  // The current view is asset; a hidden reading control correctly suppresses effects.
  await page.evaluate(()=>{
   const control=document.querySelector('#assetStats .value');
   HaniMotion.completion('book:media-change',false,true,control.getBoundingClientRect(),'reading');
   HaniMotion.countUp(document.querySelector('#assetStats .value'),'24,680원','edge:media-change');
   window.fix208MotionChanged=new Promise(resolve=>matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>requestAnimationFrame(()=>resolve()),{once:true}));
  });
  assert.ok(await page.locator('.hani-motion-burst').count()>0,'effect active before off-switch');
  assert.ok(await page.locator('.hani-motion-number-overlay').count()>0,'count-up active before off-switch');
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>fix208MotionChanged);
  assert.equal(await page.evaluate(()=>HaniMotion.reduced()),true);
  assert.equal(await page.locator('.hani-motion-burst').count(),0);
  assert.equal(await page.locator('.hani-motion-number-overlay').count(),0,'off-switch stops count-up');
  assert.equal(await page.locator('#assetStats .value').first().innerText(),'24,680원');
  const toastBefore=await page.locator('#toast').innerText();await page.evaluate(()=>{const control=document.querySelector('#assetStats .value');HaniMotion.completion('book:reduced',false,true,control.getBoundingClientRect(),'reading');HaniMotion.countUp(document.querySelector('#homeAsset'),'12,345원','motion:reduced')});
  assert.equal(await page.locator('.hani-motion-burst,.hani-motion-number-overlay').count(),0);assert.equal(await page.locator('#toast').innerText(),toastBefore);
  await page.evaluate(()=>{commit=fix208OriginalCommit});assert.deepEqual(errors,[],'no browser JS errors');
  console.log(`PASS ${width}/${finish}: collapsed geometry/tooltips/badge, expanded restoration, 11→2 quiz/orphan read-only, confirmation cancel, completion once, reduced motion`);passed.push({width,finish});await context.close();
 }
 fs.writeFileSync(path.join(evidence,'run-status.json'),JSON.stringify({status:'PASS',passed,screenshots:passed.map(({width,finish})=>`${width}-${finish}.png`)},null,2));
}catch(error){fs.writeFileSync(path.join(evidence,'run-status.json'),JSON.stringify({status:'FAILED_OR_BLOCKED',reason:error.message.split('\n')[0],screenshots:fs.readdirSync(evidence).filter(file=>file.endsWith('.png'))},null,2));throw error}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
