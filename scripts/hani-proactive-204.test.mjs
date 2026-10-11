import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const main=fs.readFileSync(path.join(root,'hani-main.js'),'utf8');
const study=fs.readFileSync(path.join(root,'hani-study-v02984.js'),'utf8');
const section=main.slice(main.indexOf('// proactive-204:'),main.indexOf('function renderHaniCareHome()'));
function single(name){const line=main.split('\n').find(x=>x.startsWith('function '+name+'('));assert.ok(line,name);return line;}
function fixture(){
 const item=(week,endAt,extra={})=>({id:'w'+week,week:String(week),startAt:'2026-10-01T00:00',endAt,topic:'topic '+week,content:'preserve',done:false,...extra});
 const course=(id)=>({id,name:'Course '+id,curriculum:[item(1,'2026-10-09T23:59'),item(2,'2026-10-11T00:00'),item(3,'invalid'),item(4,'2026-10-05T18:00',{done:true})]});
 const state={ui:{campusActiveSemesterId:'active',unrelated:'keep'},meta:{lastSavedAt:''},tasks:[],campusSemesters:[{id:'active',term:'2026-2',status:'active',courses:[course('a'),course('b')]},{id:'archive',term:'2025-2',status:'archived',courses:[course('c')]}],certificates:[],learningQuizzes:[],unrelated:{keep:23}};
 let calls=0,result=true;
 const FakeDate=class extends Date{constructor(...a){super(...(a.length?a:['2026-10-11T03:00:00Z']))}static now(){return new FakeDate().getTime()}};
 const c=vm.createContext({state,Date:FakeDate,Intl,console,structuredClone,alert:()=>{},uid:()=> 'task-'+calls,commit:()=>{calls++;return result},renderCampus:()=>{},renderHaniCareHome:()=>{}});
 vm.runInContext(single('careKoreaPeriod')+'\n'+single('campusSemestersSorted')+'\n'+section+'\n'+['intakeCampusTaskRows','intakeText','intakeDate','intakeCampusAssessmentType','intakeNormText'].map(single).join('\n'),c);
 // Run the real intakeApplyRow implementation; its task branch requires no normalization.
 vm.runInContext(single('intakeApplyRow'),c);
 vm.runInContext(main.slice(main.indexOf('function pad2DateFlex('),main.indexOf('function normalizeDateFlexMonth(')),c);
 return {c,state,item,get calls(){return calls},fail(){result=false},throwSave(){c.commit=()=>{calls++;throw Error('synthetic failure')}}};
}
const plain=x=>JSON.parse(JSON.stringify(x));
test('KST date and Monday boundary; invalid and explicit-zone dates',()=>{
 const {c}=fixture();assert.equal(c.careKoreaPeriod(new Date('2026-10-10T15:00Z')).day,'2026-10-11');
 assert.equal(c.careDateAt('2026-10-11'),Date.parse('2026-10-10T15:00Z'));
 assert.equal(c.careDateAt('2026-10-10T23:59'),Date.parse('2026-10-10T14:59Z'));
 assert.equal(c.careDateAt('2026-10-11T00:00Z'),Date.parse('2026-10-11T00:00Z'));
 assert.ok(Number.isNaN(c.careDateAt('2026-02-30')));assert.ok(Number.isNaN(c.careDateAt('')));
 assert.equal(c.careWeekStart('2026-10-11'),'2026-10-05');assert.equal(c.careWeekStart('2026-10-12'),'2026-10-12');
});
test('active semester only; expired strict cutoff, false only, read-only',()=>{
 const f=fixture(),before=JSON.stringify(f.state);const groups=f.c.careCampusGroups();
 assert.equal(groups.length,1);assert.equal(groups[0].week,'1');assert.equal(groups[0].rows.length,2);
 assert.equal(JSON.stringify(f.state),before);assert.equal(f.calls,0);
 f.state.ui.campusActiveSemesterId='archive';assert.equal(f.c.careCampusGroups().length,0);
});
test('pending cap five items across groups, not five courses per group',()=>{
 const f=fixture(),sem=f.state.campusSemesters[0];sem.courses[0].curriculum=Array.from({length:8},(_,i)=>f.item(i+1,'2026-10-03T12:00'));
 assert.equal(f.c.careCampusGroups().flatMap(g=>g.rows).length,5);
});
test('all/partial completion changes only selected done and saves once; stale click ignored',()=>{
 const f=fixture(),rows=f.c.careCampusGroups()[0].rows,before=structuredClone(f.state);
 assert.equal(f.c.careCampusComplete([rows[0]]),true);before.campusSemesters[0].courses[0].curriculum[0].done=true;
 assert.deepEqual(f.state,before);assert.equal(f.calls,1);assert.equal(f.c.careCampusComplete([rows[0]]),false);assert.equal(f.calls,1);
 assert.equal(f.c.careCampusComplete([rows[1]]),true);assert.equal(f.c.careCampusGroups().length,0);
});
test('completion blocked after semester change or object replacement',()=>{
 const f=fixture(),rows=f.c.careCampusGroups()[0].rows;f.state.ui.campusActiveSemesterId='archive';
 assert.equal(f.c.careCampusComplete(rows),false);f.state.ui.campusActiveSemesterId='active';
 f.state.campusSemesters[0].courses[0].curriculum[0]=structuredClone(rows[0].item);
 assert.equal(f.c.careCampusComplete([rows[0]]),false);assert.equal(f.calls,0);
});
for(const mode of ['fail','throwSave'])test('completion rolls back '+mode,()=>{
 const f=fixture(),before=JSON.stringify(f.state);f[mode]();assert.equal(f.c.careCampusComplete(f.c.careCampusGroups()[0].rows),false);assert.equal(JSON.stringify(f.state),before);
});
test('dismiss in existing ui keyed by semester/week; next Monday reappears; no curriculum changes',()=>{
 const f=fixture(),before=JSON.stringify(f.state.campusSemesters),group=f.c.careCampusGroups()[0];
 assert.equal(f.c.careCampusDismiss(group),true);assert.equal(f.state.ui.campusWeekDismissals[group.key],'2026-10-12');
 assert.equal(f.c.careCampusGroups().length,0);assert.equal(f.c.careCampusDismiss(group),false);assert.equal(f.calls,1);
 assert.ok(f.c.careCampusGroups('2026-10-12').length);assert.equal(JSON.stringify(f.state.campusSemesters),before);
});
test('dismiss rollback preserves previous markers and unrelated ui',()=>{
 const f=fixture();f.state.ui.campusWeekDismissals={old:'2026-10-01'};const before=JSON.stringify(f.state);f.fail();assert.equal(f.c.careCampusDismiss(f.c.careCampusGroups()[0]),false);assert.equal(JSON.stringify(f.state),before);
});
test('quick task uses real university intake shape, KST optional time and existing tasks; one save',()=>{
 const f=fixture(),before=structuredClone(f.state);assert.equal(f.c.campusAssignmentAdd('a','Essay','2026-10-12','18:30'),true);
 const t=f.state.tasks[0];assert.equal(t.sourceType,'university');assert.equal(t.courseName,'Course a');assert.equal(t.course,'Course a');assert.equal(t.due,'2026-10-12');assert.equal(t.dueAt,'2026-10-12T18:30:00+09:00');assert.equal(t.done,false);assert.equal(t.dueKnown,true);assert.equal(t.week,'');assert.equal(t.scheduled,'');assert.equal(t.scheduleEnd,'');assert.equal(f.calls,1);
 before.tasks=structuredClone(f.state.tasks);assert.deepEqual(plain(f.state),before);
 assert.equal(f.c.campusAssignmentAdd('b','Essay 2','2026-10-13'),true);assert.equal(f.state.tasks[1].dueAt,'2026-10-13');
});
test('invalid assignments and archived courses blocked, no task or save',()=>{
 const f=fixture();for(const args of [['missing','Essay','2026-10-12'],['a',' ','2026-10-12'],['a','Essay','2026-02-30'],['a','Essay','2026-10-12','25:00']])assert.equal(f.c.campusAssignmentAdd(...args),false);
 f.state.ui.campusActiveSemesterId='archive';assert.equal(f.c.campusAssignmentAdd('c','Essay','2026-10-12'),false);assert.equal(f.calls,0);assert.deepEqual(f.state.tasks,[]);
});
test('task save failure preserves original tasks, curriculum and other state',()=>{
 const f=fixture();f.state.tasks.push({id:'existing',text:'keep'});const before=JSON.stringify(f.state);f.fail();assert.equal(f.c.campusAssignmentAdd('a','Essay','2026-10-12'),false);assert.equal(JSON.stringify(f.state),before);
});
test('assignment 2/14 day horizons, time cutoff, done/source/course filters; immutable',()=>{
 const f=fixture(),task=(id,due,extra={})=>({id,due,text:id,courseName:'Course a',sourceType:'university',done:false,...extra});
 f.state.tasks=[task('now','2026-10-11'),task('timed','2026-10-11',{dueAt:'2026-10-11T11:59+09:00'}),task('2','2026-10-13'),task('14','2026-10-25'),task('15','2026-10-26'),task('done','2026-10-12',{done:true}),task('other','2026-10-12',{courseName:'Other'}),task('plain','2026-10-12',{sourceType:'manual'}),task('past','2026-10-10')];
 const before=JSON.stringify(f.state);assert.deepEqual(plain(f.c.campusAssignments(2)).map(t=>t.id),['now','2']);assert.deepEqual(plain(f.c.campusAssignments()).map(t=>t.id),['now','2','14']);assert.equal(JSON.stringify(f.state),before);assert.equal(f.calls,0);
});
test('assignment renderer targets submit with date toggle present; empty/archived semester disables only submit',()=>{
 const f=fixture(),submit={disabled:false},toggle={disabled:false},select={value:'a',options:[]};
 Object.defineProperty(select,'innerHTML',{set(value){this.options=[...value.matchAll(/<option value="([^"]+)"/g)].map(m=>({value:m[1]}));}});
 const form={elements:{courseId:select},querySelector:s=>s==='button[type=submit]'?submit:toggle},list={innerHTML:''};
 f.c.document={querySelector:s=>s==='[data-campus-assignment-form]'?form:list};f.c.esc=x=>String(x??'');
 f.c.renderCampusAssignments({courses:[]});assert.equal(submit.disabled,true);assert.equal(toggle.disabled,false);
 f.c.renderCampusAssignments(f.state.campusSemesters[0]);assert.equal(submit.disabled,false);assert.equal(toggle.disabled,false);assert.equal(select.value,'a');
 f.c.renderCampusAssignments(f.state.campusSemesters[1]);assert.equal(submit.disabled,true);assert.equal(toggle.disabled,false);assert.equal(f.calls,0);
});
test('certificate D-Day and upcoming-first order without mutation',()=>{
 const f=fixture();f.state.certificates=[{id:'past',examDate:'2026-10-10'},{id:'missing'},{id:'30',examDate:'2026-11-10'},{id:'today',examDate:'2026-10-11'},{id:'23',examDate:'2026-11-03'},{id:'older',examDate:'2026-10-01'}];const before=JSON.stringify(f.state);
 assert.deepEqual(plain(f.c.certificateCareSorted()).map(t=>t.id),['today','23','30','past','older','missing']);assert.equal(f.c.certificateDday(f.state.certificates[0]),'종료');assert.equal(f.c.certificateDday(f.state.certificates[3]),'D-Day');assert.equal(f.c.certificateDday(f.state.certificates[4]),'D-23');assert.equal(f.c.certificateDday({}),'');assert.equal(JSON.stringify(f.state),before);
});
test('study pending metric follows existing status rule and reads without persistence',()=>{
 const pending=study.slice(study.indexOf('  function pendingLearningQuizzes()'),study.indexOf('  function openPendingQuiz()'));
 const state={learningQuizzes:[{id:'pending',status:'pending'},{id:'progress',status:'in_progress'},{id:'done',status:'completed'},{id:'legacy'}]};
 const c=vm.createContext({state});vm.runInContext(pending,c);assert.deepEqual(plain(c.pendingLearningQuizzes()).map(t=>t.id),['pending','progress','legacy']);
});
test('quiz reminder opens the pending quiz without automatic generation, including a closed project',()=>{
 const rows=[{id:'orphan',projectId:'missing',status:'pending'},{id:'quiz',projectId:'closed',status:'in_progress'}],project={id:'closed',status:'completed',name:'Closed project'};
 const box={innerHTML:''},views=[],renders=[],context=vm.createContext({state:{learningQuizzes:rows},projectById:id=>id==='closed'?project:null,quizById:id=>rows.find(q=>q.id===id),showView:id=>views.push(id),renderLearning:auto=>renders.push(auto),requestAnimationFrame:fn=>fn(),q:s=>s==='#studyProjectList'?box:null,qa:()=>[],boardProjects:()=>[],visibleProjects:()=>[project]});
 vm.runInContext("let activeProjectId='',activeQuizId='',activeStudyTab='',quizArchiveMonth='old',quizArchivePage=8;\n"+study.slice(study.indexOf('  function pendingLearningQuizzes()'),study.indexOf('  function renderPendingQuizNav()'))+'\n'+study.slice(study.indexOf('  function renderProjectList()'),study.indexOf('  function wrongRows()'))+'\n globalThis.readLink=()=>[activeProjectId,activeQuizId,activeStudyTab,quizArchiveMonth,quizArchivePage];',context);
 context.openPendingQuiz();context.renderProjectList();assert.deepEqual(plain(context.readLink()),['closed','quiz','board','all',1]);assert.deepEqual(views,['study']);assert.deepEqual(renders,[false]);
});
test('care card owner preserves priority and one slot; midnight and identical source replacement refresh',()=>{
 const f=fixture();f.state.tasks=[{text:'Essay',due:'2026-10-12',courseName:'Course a',sourceType:'university'}];f.state.certificates=[{name:'Exam',examDate:'2026-11-03'}];
 let slot=null,creates=0,htmlWrites=0;
 const parent={querySelector:()=>slot,insertBefore:el=>{slot=el;creates++}};
 f.c.window={HANI_STUDY_V02984_TEST:{pendingLearningQuizzes:()=>[{id:'q',projectId:'p',title:'Quiz'}]}};
 f.c.esc=x=>String(x??'').replaceAll('<','&lt;');
 f.c.document={createElement:()=>({dataset:{},querySelector:()=>null,querySelectorAll:()=>[],get innerHTML(){return this._html},set innerHTML(s){this._html=s;htmlWrites++}})};
 f.c.renderHaniCareCards(parent);assert.equal(creates,1);assert.equal(htmlWrites,1);
 const html=slot.innerHTML;assert.ok(html.indexOf('data-care-assignment')<html.indexOf('data-care-campus'));assert.ok(html.indexOf('data-care-campus')<html.indexOf('data-care-certificate'));assert.ok(html.indexOf('data-care-certificate')<html.indexOf('data-care-quiz'));assert.match(html,/D-23/);
 f.c.renderHaniCareCards(parent);assert.equal(htmlWrites,1);f.state.campusSemesters[0]=structuredClone(f.state.campusSemesters[0]);f.c.renderHaniCareCards(parent);assert.equal(htmlWrites,2);
 f.c.careKoreaPeriod=()=>({day:'2026-10-12'});f.c.renderHaniCareCards(parent);assert.equal(htmlWrites,3);assert.match(slot.innerHTML,/D-22/);assert.equal(creates,1);assert.equal(f.calls,0);
});
test('actual report rendering separates comparison/guidance and reuses the single editor across views',()=>{
 const source=fs.readFileSync(path.join(root,'hani-goal-progress.js'),'utf8');
 class Node {
  constructor(){this.children=[];this.innerHTML='';this.hidden=false;this.attributes={};this.classList={toggle:()=>{}};}
  get previousSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)-1]||null;}
  detach(){if(this.parentNode)this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);}
  appendChild(node){node.detach();this.children.push(node);node.parentNode=this;}
  before(node){const p=this.parentNode;node.detach();p.children.splice(p.children.indexOf(this),0,node);node.parentNode=p;}
  after(node){const p=this.parentNode;node.detach();p.children.splice(p.children.indexOf(this)+1,0,node);node.parentNode=p;}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,v){this[k]=v;}
  querySelectorAll(){return [];}
  querySelector(s){return s==='[data-quarter-goals-link]'&&this.innerHTML.includes('data-quarter-goals-link')?link:null;}
 }
 const settings=new Node(),editor=new Node(),destination=new Node(),quarter=new Node(),annual=new Node(),summary=new Node(),guidance=new Node(),link=new Node();settings.appendChild(editor);
 const tabs=['actual','goals'].map(tab=>Object.assign(new Node(),{dataset:{quarterTab:tab}})),panels=['actual','goals'].map(tab=>Object.assign(new Node(),{dataset:{quarterPanel:tab}}));
 const fields=Object.fromEntries(['metric_id','goal_type','year','quarter','value'].map(k=>[k,{value:'',dispatchEvent:()=>{}}]));
 const form={elements:{namedItem:k=>fields[k]},dispatchEvent:()=>{},scrollIntoView:()=>{}};
 const body={dataset:{view:'monthlyReport'}};
 const document={body,createComment:()=>new Node(),getElementById:id=>({goalRegistryPanel:editor,goalRegistryForm:form,quarterGoalReport:quarter,annualGoalReport:annual}[id]),querySelector:s=>({'[data-quarter-goal-editor]':destination,'[data-quarter-goal-summary]':summary,'[data-quarter-goal-guidance]':guidance}[s]),querySelectorAll:s=>s==='[data-quarter-tab]'?tabs:s==='[data-quarter-panel]'?panels:[]};
 let allowed=true,edits=0;
 const facts=[{definition:{metric_id:'weight',unit:'kg'},actual:{value:80,period_start:'2026-10-01',period_end:'2026-12-31',months_missing:[]},progress:{target:75}}];
 const context=vm.createContext({document,window:{},monthlyReportBoard:'quarterly',reportRendering:false,reportPeriods:{quarter:{type:'quarter',year:2026,quarter:4},annual:{type:'annual',year:2026}},reportNames:{weight:'체중'},reportUnits:{kg:'kg'},reportRead:()=>allowed?facts:null,guidancePreview:()=>[{metric_id:'weight',unit:'kg',value:75,action:'USE',reason:'review',period:{type:'quarter',year:2027,quarter:1}}],escape:String,number:x=>x??'—',comparison:()=> '비교',renderGoalRegistry:()=>{edits++},showView:view=>{body.dataset.view=view;context.syncGoalEditor(view)},toast:()=>{},Event:class{}});
 const start=source.indexOf('function reportCards(');vm.runInContext(source.slice(start,source.indexOf('window.HANI_GOAL_PROGRESS=Object.freeze(',start)),context);
 context.renderReportProgress();assert.match(quarter.innerHTML,/실적/);assert.match(quarter.innerHTML,/목표 수정은 목표 탭에서/);assert.doesNotMatch(quarter.innerHTML,/data-guidance-value|data-guidance-use/);assert.match(guidance.innerHTML,/data-guidance-value/);assert.match(annual.innerHTML,/data-guidance-value/);assert.equal(editor.parentNode,settings);
 link.click();assert.equal(editor.parentNode,destination);assert.equal(panels[0].hidden,true);assert.equal(panels[1].hidden,false);
 context.selectQuarterReportTab('goals');context.selectQuarterReportTab('goals');assert.equal(destination.children.length,1);
 context.syncGoalEditor('settings');assert.equal(editor.parentNode,settings);assert.equal(settings.children.length,2);
 context.goalDraftFromGuidance({metric_id:'weight',unit:'kg',action:'USE',period:{type:'quarter',year:2027,quarter:1}},72);
 assert.equal(editor.parentNode,destination);assert.equal(fields.value.value,'72');assert.equal(fields.year.value,'2027');assert.equal(fields.quarter.value,'1');assert.equal(edits,1);
 context.selectQuarterReportTab('actual');assert.equal(editor.parentNode,settings);
 allowed=false;context.renderReportProgress();assert.match(quarter.innerHTML,/원본 검증 대기/);assert.equal(guidance.textContent,'');assert.equal(summary.textContent,'원본 검증 대기');
});
test('unchanged lines preserve exact EOL and protected versions/keys; no added direct storage or Cloud operations',()=>{
 const baseline=process.env.HANI_PROACTIVE_TEST_BASELINE;
 for(const file of ['hani-main.js','index.html']){
  const old=baseline?fs.readFileSync(path.join(baseline,file),'utf8'):execFileSync('git',['show','HEAD:'+file],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024}),current=fs.readFileSync(path.join(root,file),'utf8');
  const lines=s=>s.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g).filter(Boolean);
  // Every untouched line keeps its original terminator, including unique mixed-EOL anchors.
  const a=lines(old),b=lines(current),byText=new Map();for(const l of a){const t=l.replace(/[\r\n]+$/,'');if(!byText.has(t))byText.set(t,new Set());byText.get(t).add(l.slice(t.length));}
  for(const l of b){const t=l.replace(/[\r\n]+$/,'');if(byText.has(t))assert.ok(byText.get(t).has(l.slice(t.length)),file+' EOL '+t.slice(0,70));}
  assert.ok(current.includes('2.9.203'));assert.equal(current.match(/2\.9\.204/g)?.length||0,old.match(/2\.9\.204/g)?.length||0);
 }
 const diff=baseline?fs.readFileSync(path.join(baseline,'runtime.diff'),'utf8'):execFileSync('git',['diff','--unified=0','--','hani-main.js','index.html','hani-study-v02984.js','hani-goal-progress.js','hani-yuna-helpdesk.js'],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
 const additions=diff.split('\n').filter(l=>l.startsWith('+')&&!l.startsWith('+++')).join('\n');
 assert.doesNotMatch(additions,/localStorage\.(?:setItem|removeItem|clear)|\.from\([^)]*\)\.(?:insert|update|delete|upsert)|\.clear\(/);
 assert.match(main,/VERSION\s*=\s*["']2\.9\.15-safe-baseline-bootstrap["']/);assert.ok(main.includes('hani_os_life_v23'));
});
test('static DOM id literals introduce no duplicates over the base',()=>{
 const counts=old=>{
  const result=new Map();for(const file of ['index.html','hani-main.js','hani-study-v02984.js','hani-goal-progress.js','hani-yuna-helpdesk.js']){
   const baseline=process.env.HANI_PROACTIVE_TEST_BASELINE,text=old?(baseline?fs.readFileSync(path.join(baseline,file),'utf8'):execFileSync('git',['show','HEAD:'+file],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024})):fs.readFileSync(path.join(root,file),'utf8');
   for(const match of text.matchAll(/\bid\s*=\s*["']([\w-]+)["']/g))result.set(match[1],(result.get(match[1])||0)+1);
  }return result;
 };
 const old=counts(true),current=counts(false);for(const [id,count] of current)if(count>1)assert.ok(count<=(old.get(id)||0),'new duplicate id literal '+id);
});
