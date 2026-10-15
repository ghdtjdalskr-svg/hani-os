import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {test} from 'node:test';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const main=fs.readFileSync(path.join(root,'hani-main.js'),'utf8'),study=fs.readFileSync(path.join(root,'hani-study-v02984.js'),'utf8');
const modelSource=main.slice(main.indexOf('function taskIsDerived('),main.indexOf('function renderTasks()'));
const careSource=main.slice(main.indexOf('function renderHaniCareHome()'),main.indexOf('function renderHome(){'));
const single=name=>main.split('\n').find(x=>x.startsWith('function '+name+'('));
const plain=x=>JSON.parse(JSON.stringify(x));
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.hidden=false;this.open=false;this.textContent='';this.className='';this.attributes={};}
 setAttribute(k,v){this.attributes[k]=v}
 insertBefore(el,before){assert.ok(!before||before.parentNode===this,'valid DOM insertion anchor');if(el.parentNode){el.parentNode.children.splice(el.parentNode.children.indexOf(el),1)}const at=before?this.children.indexOf(before):this.children.length;this.children.splice(at,0,el);el.parentNode=this;return el}
 appendChild(el){return this.insertBefore(el,null)}
 get firstChild(){return this.children[0]||null}
 get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null}
 querySelector(selector){return this.children.find(el=>selector==='[data-task-derived]'&&Object.hasOwn(el.dataset,'taskDerived'))||null}
 querySelectorAll(selector){const attr=selector.match(/^\[([^\]]+)\]$/)?.[1];if(!attr)return [];return [...(this.innerHTML||'').matchAll(/<button\b([^>]+)>/g)].filter(m=>m[1].includes(attr+'=')).map(m=>{const b=new Element('button');for(const a of m[1].matchAll(/data-([\w-]+)="([^"]*)"/g))b.dataset[a[1].replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=a[2];return b})}
}
function fixture(){
 const state={tasks:[],learningProjects:[],learningQuizzes:[],learningWrongAnswers:[],ledgerMonths:[],investmentBrokerSnapshots:[],body:[]};
 const nodes=Object.fromEntries(['home','taskCalendarHub','taskList','taskCount'].map(id=>[id,new Element()])),grid=new Element(),card=new Element();grid.appendChild(nodes.taskCalendarHub);card.appendChild(nodes.taskList);
 let writes=0;const failWrite=()=>{writes++;throw Error('Unexpected write')};
 const DateAt=class extends Date{constructor(...args){super(...(args.length?args:['2026-10-15T03:00:00Z']))}static now(){return new Date('2026-10-15T03:00:00Z').getTime()}};
 const context=vm.createContext({state,window:{},document:{querySelector:()=>null,querySelectorAll:()=>[],createElement:tag=>new Element(tag)},Date:DateAt,Intl,console,structuredClone,crypto:{randomUUID:()=> 'fixture'},commit:failWrite,save:failWrite,localStorage:{setItem:failWrite,removeItem:failWrite},$:id=>nodes[id],esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),monthlyReportKoreaDate:()=> '2026-10-15',monthlyReportDate:d=>/^\d{4}-\d\d-\d\d$/.test(d)?d:'',ledgerSettlementPeriod:()=>({periodStart:'2026-09-19',periodEnd:'2026-10-18'}),haniCareNotice(){},renderHaniCareCards(){},showView:id=>context.lastView=id,taskCalendarActionHtml:()=>'',taskDisplayText:t=>t.text,taskScheduleLabel:t=>t.due||'',requestAnimationFrame(){}});
 vm.runInContext(study.replace(/\r?\n  boot\(\);/,'\n  // fixture excludes boot'),context);
 vm.runInContext(single('careKoreaPeriod')+'\n'+single('haniCareMemory')+'\n'+single('haniCareChecklist')+'\n'+main.slice(main.indexOf('function careDateAt('),main.indexOf('function careWeekStart('))+'\n'+modelSource+'\n'+careSource,context);
 return {state,nodes,grid,context,api:context.window.HANI_STUDY_V02984_TEST,writes:()=>writes};
}
function seed(f){
 f.state.tasks=[...Array.from({length:5},(_,i)=>({id:'own-'+i,text:'직접 할 일 '+i,due:i%2?'2026-11-01':'',done:false})),{id:'own-done',text:'직접 완료',done:true},...Array.from({length:32},(_,i)=>({id:'future-'+i,text:'다음 달 과제 '+i,sourceType:'university',due:'2026-11-01',done:false})),{id:'due-today',text:'오늘 과제',sourceType:'university',due:'2026-10-15',done:false}];
 f.state.learningProjects=[f.api.normalizeProject({id:'active',name:'공부',status:'active',scheduleType:'manual'})];
 f.state.learningQuizzes=Array.from({length:30},(_,i)=>f.api.normalizeQuiz({id:'quiz-'+i,projectId:'active',title:'문제세트 '+i,date:i<2?'2026-10-15':i<22?'2026-10-01':'2026-11-01',status:i===1?'in_progress':'pending',questions:[],answers:[]}));
}

test('5 own open + 32 future assignments + 30 quizzes: badge 8, separate derived 63, no writes',()=>{
 const f=fixture();seed(f);const before=JSON.stringify(f.state);
 for(let i=0;i<3;i++){const m=f.context.taskReadModel();assert.equal(m.count,8);assert.equal(m.own.length,6);assert.equal(m.derivedCount,63);assert.equal(m.actionable.length,1);assert.equal(m.todayLearning.length,2)}
 assert.equal(JSON.stringify(f.state),before);assert.equal(f.writes(),0);
});
test('derived due dates use KST; dueAt wins, scheduled dates and overdue/completed do not count',()=>{
 const f=fixture();f.state.tasks=[{id:'a',sourceType:'university',due:'2026-10-16',dueAt:'2026-10-14T15:30:00Z'},{id:'b',sourceType:'university',due:'2026-10-15',done:true},{id:'c',sourceType:'university',scheduled:'2026-10-15'},{id:'d',sourceType:'university',due:'2026-10-14'},{id:'e',sourceType:'quiz',due:'2026-10-15',dueAt:'2026-10-15T16:00:00Z'},{id:'bad',sourceType:'care',due:'2026-02-30'}];
 assert.equal(f.context.taskReadModel().count,1);assert.deepEqual(plain(f.context.taskReadModel().actionable).map(x=>x.id),['a']);
});
test('today quiz generation actionable, uncapped list, paused/archived/orphans excluded, completed silent',()=>{
 const f=fixture();seed(f);
 for(const status of ['active','paused','archived','completed'])f.state.learningProjects.push(f.api.normalizeProject({id:status==='active'?'generation':status,name:status,status,scheduleType:'daily'}));
 for(const projectId of ['paused','archived','missing','completed'])f.state.learningQuizzes.push(f.api.normalizeQuiz({id:projectId,projectId,date:'2026-10-15',status:'pending'}));
 f.state.learningQuizzes.push(f.api.normalizeQuiz({id:'done',projectId:'active',date:'2026-10-15',status:'completed'}));
 const before=JSON.stringify(f.state),m=f.context.taskReadModel();
 assert.equal(m.count,10,'base 8 + active daily generation + existing pending quiz in completed project');
 assert.equal(m.learning.length,32);assert.ok(!m.learning.some(t=>['paused','archived','missing','done'].includes(t.quizId)));
 assert.equal(JSON.stringify(f.state),before);assert.equal(f.writes(),0);
});
test('all completed and no today targets yields zero; own tasks independent of date or intake source',()=>{
 const f=fixture();f.state.tasks=[{id:'a',done:true},{id:'b',sourceType:'university',due:'2026-11-01'}];assert.equal(f.context.taskReadModel().count,0);
 f.state.tasks.push({id:'c',sourceType:'intake',due:''},{id:'d',sourceType:'manual',due:'2025-01-01'});assert.equal(f.context.taskReadModel().count,2);
});
test('single persistent stepper above Calendar; 3 status icons/buttons, N chip navigation, zero hidden',()=>{
 const f=fixture(),c=f.context,before=JSON.stringify(f.state);c.renderHaniCareHome();const m=c.haniCareMemory(),slot=m.checklist,chip=m.checklistChip;
 assert.equal(slot.parentNode,f.grid);assert.equal(slot.nextSibling,f.nodes.taskCalendarHub);assert.equal(slot.attributes['aria-label'],'월말 정산 도우미');assert.equal(chip.textContent,'월말 정산 할 일 3개 남음 →');chip.onclick();assert.equal(c.lastView,'tasks');
 assert.match(slot.innerHTML,/0\/3 완료/);assert.equal((slot.innerHTML.match(/data-hani-care-view=/g)||[]).length,3);assert.equal((slot.innerHTML.match(/class="hani-care-status"/g)||[]).length,3);
 c.renderHaniCareHome();c.renderHaniCareHome();assert.equal(m.checklist,slot);assert.equal(m.checklistChip,chip);assert.equal(f.grid.children.filter(n=>n.className.includes('hani-care-checklist')).length,1);assert.ok(!f.nodes.home.children.includes(slot));assert.equal(JSON.stringify(f.state),before);
 f.state.ledgerMonths=[{month:'2026-10',status:'confirmed'}];c.renderHaniCareHome();assert.match(slot.innerHTML,/1\/3 완료/);assert.match(chip.textContent,/2개/);
 f.state.investmentBrokerSnapshots=[{period:'2026-10',mode:'actual',status:'confirmed'}];f.state.body=[{date:'2026-10-15',weight:80}];c.renderHaniCareHome();assert.match(slot.innerHTML,/3\/3 완료/);assert.equal(chip.hidden,true);
 c.monthlyReportKoreaDate=()=> '2026-10-21';c.renderHaniCareHome();assert.equal(slot.hidden,true);assert.equal(chip.hidden,true);assert.equal(f.writes(),0);
});
test('derived details preserve open state and list every source without creating a second slot',()=>{
 const f=fixture();seed(f);const c=f.context,before=JSON.stringify(f.state),m=c.taskReadModel();c.renderTaskDerived(m);
 const slot=f.nodes.taskList.parentNode.querySelector('[data-task-derived]');assert.equal(slot.open,false);assert.match(slot.innerHTML,/자동·학습 할 일/);assert.match(slot.innerHTML,/63개/);assert.match(slot.innerHTML,/future-31/);assert.match(slot.innerHTML,/quiz-29/);
 slot.open=true;c.renderTaskDerived(m);assert.equal(slot.open,true);assert.equal(f.nodes.taskList.parentNode.children.length,2);assert.equal(JSON.stringify(f.state),before);assert.equal(f.writes(),0);
});
test('existing task save handlers retained; no added storage/Cloud/EOL/version/id changes',()=>{
 const baseline=process.env.HANI_PROACTIVE_TEST_BASELINE;
 if(baseline){const old=fs.readFileSync(path.join(baseline,'hani-main.js'),'utf8'),a=old.slice(old.indexOf('document.querySelectorAll("[data-task-check]")',old.indexOf('function renderTasks()')),old.indexOf('renderTaskCalendarHub()}',old.indexOf('function renderTasks()'))),b=main.slice(main.indexOf('document.querySelectorAll("[data-task-check]")',main.indexOf('function renderTasks()')),main.indexOf('renderTaskCalendarHub();renderHaniCareHome()}',main.indexOf('function renderTasks()')));assert.equal(b,a,'existing write handlers byte-for-byte');}
 assert.doesNotMatch(modelSource+careSource,/localStorage|\bcommit\(|\bsave\(|\.clear\(|\bid\s*=\s*["']/);
 assert.equal((main.match(/function renderHaniCareHome\(/g)||[]).length,1);
 assert.doesNotMatch(study.slice(study.indexOf('  function renderHomeDerived()'),study.indexOf('  function patchCoreHooks()')),/appendChild|createElement|base \+ rows/);
 const remote=fs.readFileSync(path.join(root,'hani-context-remote-v1.js'),'utf8');assert.match(remote,/taskReadModel\(day\)\.count/);
});

const [runtime,exe]=process.argv.slice(2);
test('Playwright screenshots and interaction at 1440/884/412, two finishes, read-only fixtures',{skip:!runtime||!exe,timeout:180000},async()=>{
 const {chromium}=await import(pathToFileURL(runtime).href),out=path.join(root,'artifacts/tasks-qa-212');fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{const uri=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+(uri==='/'?'/index.html':uri));if(!file.startsWith(root+path.sep)||uri.split('/').some(p=>p.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(file))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let browser;const results=[];
 try{
  browser=process.env.HANI_BROWSER_CDP?await chromium.connectOverCDP(process.env.HANI_BROWSER_CDP):await chromium.launch({executablePath:exe,headless:true});
  for(const width of [1440,884,412])for(const finish of ['porcelain-cream','midnight-black']){
   const context=await browser.newContext({viewport:{width,height:1000}});await context.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
   await context.addInitScript(()=>{const Native=Date;window.Date=class extends Native{constructor(...args){super(...(args.length?args:['2026-10-15T03:00:00Z']))}static now(){return new Native('2026-10-15T03:00:00Z').getTime()}}});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());await page.goto(origin);
   await page.waitForFunction(()=>typeof unlockLoginGate==='function'&&window.HANI_STUDY_V02984_TEST&&window.HANI_CONTEXT_REMOTE_V1);
   await page.evaluate(finish=>{
    unlockLoginGate();document.documentElement.dataset.finish=finish;document.body.dataset.finishActive='true';state=freshState();
    state.tasks=[...Array.from({length:5},(_,i)=>({id:'own-'+i,text:'직접 할 일 '+(i+1),due:'',done:false})),...Array.from({length:32},(_,i)=>({id:'auto-'+i,text:'다음 달 과제 '+(i+1),due:'2026-11-01',sourceType:'university',done:false})),{id:'today',text:'오늘 제출할 과제',due:'2026-10-15',sourceType:'university',done:false}];
    const api=window.HANI_STUDY_V02984_TEST;state.learningProjects=[api.normalizeProject({id:'p',name:'오늘 학습',status:'active',scheduleType:'manual'})];state.learningQuizzes=Array.from({length:30},(_,i)=>api.normalizeQuiz({id:'q-'+i,projectId:'p',title:'문제세트 '+(i+1),date:i<2?'2026-10-15':i<22?'2026-10-01':'2026-11-01',status:'pending',questions:[],answers:[]}));
    state.ledgerMonths=[{month:'2026-10',status:'confirmed',items:[]}];window.qaSaveCalls=0;save=()=>{window.qaSaveCalls++;return {ok:true}};
    window.qaStorageWrites=[];const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;Storage.prototype.setItem=function(k,v){window.qaStorageWrites.push('set:'+k);return set.call(this,k,v)};Storage.prototype.removeItem=function(k){window.qaStorageWrites.push('remove:'+k);return remove.call(this,k)};
    renderAll();showView('home');window.qaStateBaseline=JSON.stringify(state);
   },finish);
   const chip=page.locator('#home .hani-care-chip');await chip.waitFor({state:'visible'});assert.match(await chip.innerText(),/2개/);assert.equal(await page.locator('#home .hani-care-checklist').count(),0);await page.screenshot({path:path.join(out,`dashboard-${width}-${finish}.png`),fullPage:true});
   await chip.click();await page.locator('#tasks').waitFor({state:'visible'});const stepper=page.locator('#tasks .hani-care-checklist');assert.equal(await stepper.count(),1);assert.equal(await stepper.locator('li').count(),3);assert.equal(await stepper.locator('button').count(),3);assert.match(await stepper.innerText(),/1\/3 완료/);
   assert.equal(await stepper.evaluate(el=>!!(el.compareDocumentPosition(document.getElementById('taskCalendarHub'))&Node.DOCUMENT_POSITION_FOLLOWING)),true);
   assert.equal(await page.locator('#taskCount').innerText(),'8개');assert.equal(await page.locator('#homeTasks').innerText(),'8개');await page.evaluate(()=>window.HANI_CONTEXT_REMOTE_V1.update());assert.equal(await page.locator('[data-remote-today-count]').innerText(),'8');
   const group=page.locator('#tasks [data-task-derived]');assert.equal(await group.getAttribute('open'),null);await group.locator('summary').click();assert.equal(await group.locator('[data-task-check]').count(),33);assert.equal(await group.locator('[data-task-learning]').count(),30);await page.evaluate(()=>renderTasks());assert.notEqual(await group.getAttribute('open'),null);
   await group.locator('summary').click();await stepper.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`tasks-${width}-${finish}.png`),fullPage:true});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.equal(await stepper.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
   const contrast=await stepper.evaluate(el=>{const lum=c=>{const a=c.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]},bg=lum(getComputedStyle(el).backgroundColor);return [...el.querySelectorAll('h3,p,b,button,.hani-care-status')].map(n=>{const fg=lum(getComputedStyle(n).color);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)})});assert.ok(contrast.every(x=>x>=4.5),'AA contrast');
   const first=stepper.locator('button').first();await first.focus();assert.notEqual(await first.evaluate(el=>getComputedStyle(el).outlineStyle),'none');await first.click();await page.locator('#ledger').waitFor({state:'visible'});
   await page.evaluate(()=>{showView('tasks');renderTasks();renderTasks()});assert.equal(await stepper.count(),1);assert.equal(await page.evaluate(()=>JSON.stringify(state)===window.qaStateBaseline),true);assert.equal(await page.evaluate(()=>window.qaSaveCalls),0);assert.deepEqual(await page.evaluate(()=>window.qaStorageWrites.filter(x=>!x.endsWith(':hani_os_navigation_v1'))),[]);
   await page.evaluate(()=>{state.investmentBrokerSnapshots=[{period:'2026-10',mode:'actual',status:'confirmed'}];state.body=[{date:'2026-10-15',weight:80}];renderHaniCareHome()});assert.equal(await page.locator('.hani-care-chip').isHidden(),true);assert.deepEqual(errors,[]);
   results.push({width,finish,badge:8,derived:63,minContrast:Math.min(...contrast),errors,writes:0});await context.close();
  }
  fs.writeFileSync(path.join(out,'ui-results.json'),JSON.stringify(results,null,2));
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
});
