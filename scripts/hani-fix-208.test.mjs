import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const study=readFileSync(new URL('../hani-study-v02984.js',import.meta.url),'utf8');
function learning(){
 const state={learningProjects:[{id:'jlpt',name:'JLPT N3',status:'active'},{id:'economy',name:'경제',status:'active'},{id:'paused',status:'paused'},{id:'archived',status:'archived'},{id:'renamed',name:'새 이름',status:'active'}],learningQuizzes:[{id:'normal',projectId:'jlpt',status:'pending'},{id:'progress',projectId:'jlpt',status:'in_progress'},{id:'done',projectId:'economy',status:'completed'},{id:'missing-id',status:'pending'},{id:'deleted-project',projectId:'deleted',status:'pending'},{id:'pause',projectId:'paused',status:'pending'},{id:'archive',projectId:'archived',status:'pending'},{id:'rename',projectId:'renamed',status:'pending'}],learningWrongAnswers:[]};
 let writes=0,ok=true;
 const context=vm.createContext({state,window:{confirm:()=>true},document:{querySelector:()=>null,querySelectorAll:()=>[]},console,structuredClone,commit:()=>{writes++;return ok},Date,Set,Map,crypto:{randomUUID:()=> 'fixture'},showView(){},requestAnimationFrame(){}});
 vm.runInContext(study.replace(/\r?\n  boot\(\);/,'\n  // boot omitted only in VM fixture'),context);
 return {state,api:context.window.HANI_STUDY_V02984_TEST,writes:()=>writes,fail:()=>{ok=false}};
}
test('counts only existing, visible, unpaused projects; includes in_progress and renamed ID',()=>{
 const {api,state}=learning(),before=JSON.stringify(state);
 assert.deepEqual(Array.from(api.pendingLearningQuizzes(),q=>q.id),['normal','progress','rename']);
 assert.deepEqual(JSON.parse(JSON.stringify(api.pendingQuizProjects())),[{projectId:'jlpt',name:'JLPT N3',count:2},{projectId:'renamed',name:'새 이름',count:1}]);
 assert.deepEqual(Array.from(api.orphanLearningQuizzes(),q=>q.id),['missing-id','deleted-project','archive']);
 assert.equal(JSON.stringify(state),before);
});
test('11 total, 5/7 JLPT and 3/3 economy: pending 2, preserve orphan',()=>{
 const {state,api}=learning();state.learningProjects=state.learningProjects.slice(0,2);
 state.learningQuizzes=Array.from({length:11},(_,i)=>({id:'quiz-'+i,projectId:i<7?'jlpt':i<10?'economy':'gone',status:i<5||i>=7&&i<10?'completed':'pending'}));
 assert.equal(api.pendingLearningQuizzes().length,2);assert.equal(api.orphanLearningQuizzes().length,1);assert.equal(state.learningQuizzes.length,11);
});
test('orphan attachment confirmation, existing commit, complete quiz preservation and rollback',()=>{
 const {state,api,writes,fail}=learning(),quiz=state.learningQuizzes.find(q=>q.id==='deleted-project');
 Object.assign(quiz,{questions:[{prompt:'보존'}],answers:[1],score:80,extra:'unchanged'});
 const snapshot=JSON.stringify(quiz),count=state.learningQuizzes.length;
 assert.equal(api.attachOrphanQuiz(quiz.id,'jlpt',()=>false),false);assert.equal(writes(),0);assert.equal(JSON.stringify(quiz),snapshot);
 assert.equal(api.attachOrphanQuiz(quiz.id,'unknown'),false);assert.equal(api.attachOrphanQuiz('normal','economy'),false);
 fail();assert.equal(api.attachOrphanQuiz(quiz.id,'jlpt'),false);assert.equal(JSON.stringify(quiz),snapshot);assert.equal(writes(),1);
 const success=learning(),orphan=success.state.learningQuizzes.find(q=>q.id==='deleted-project');Object.assign(orphan,JSON.parse(snapshot));
 assert.equal(success.api.attachOrphanQuiz(orphan.id,'jlpt'),true);assert.equal(success.writes(),1);assert.equal(orphan.projectId,'jlpt');
 assert.deepEqual(orphan.questions,[{prompt:'보존'}]);assert.deepEqual(orphan.answers,[1]);assert.equal(orphan.score,80);assert.equal(orphan.extra,'unchanged');
 assert.equal(state.learningQuizzes.length,count);assert.equal(success.state.learningQuizzes.length,count);
});
const ui=readFileSync(new URL('../hani-ui-v02992.js',import.meta.url),'utf8');
function motion(reduced=false){
 const preference={matches:reduced,addEventListener(_,fn){this.change=fn}},bursts=[],toasts=[],frames=new Map();let sequence=0;
 class Element {
  constructor(){this.children=[];this.style={setProperty(){}};this.classList={add(){},remove(){}};this.isConnected=true;this.textContent='';}
  append(...children){this.children.push(...children)}
  replaceChildren(...children){this.children=children}
  setAttribute(){} remove(){this.removed=true}
  getClientRects(){return [{}]}
  querySelector(){return this.children.find(c=>c.className==='hani-motion-number-final')||null}
 }
 const context=vm.createContext({window:{matchMedia:()=>preference},document:{createElement:()=>new Element(),body:{append:e=>bursts.push(e)}},TAB_CHARACTER_LINES:{tasks:{speakerId:'sua',lines:['완료한 한 칸도 진전이에요.']},home:{speakerId:'hani',lines:['같이 볼까요?']}},CHARACTER_REGISTRY:{sua:{identity:'수아 · Operations'},hani:{identity:'하니 · Chief'}},innerWidth:1440,innerHeight:900,toast:m=>toasts.push(m),setTimeout(){},requestAnimationFrame:f=>{frames.set(++sequence,f);return sequence},cancelAnimationFrame:id=>frames.delete(id),performance:{now:()=>0},q:()=>null,qa:()=>[]});
 vm.runInContext(ui.slice(ui.indexOf('const motionPreference ='),ui.indexOf('// END HANI UI MOTION')),context);
 return {api:context.window.HaniMotion,preference,bursts,toasts,frames,Element};
}
const anchor={left:10,top:10,width:30,height:30};
test('completion once per transition; undo re-arms, historical completion silent',()=>{
 const {api,bursts,toasts}=motion();assert.equal(api.completion('task:x',false,true,anchor,'tasks'),true);
 assert.equal(api.completion('task:x',false,true,anchor,'tasks'),false);assert.equal(api.completion('task:x',true,true,anchor,'tasks'),false);
 assert.equal(bursts.length,1);assert.equal(bursts[0].children.length,24);assert.match(toasts[0],/^수아/);
 api.completion('task:x',true,false,anchor,'tasks');assert.equal(api.completion('task:x',false,true,anchor,'tasks'),true);
 assert.equal(api.trackGoal('goal:x',100,anchor,'home'),false);api.trackGoal('goal:y',90,anchor,'home');assert.equal(api.trackGoal('goal:y',100,anchor,'home'),true);assert.equal(api.trackGoal('goal:y',110,anchor,'home'),false);
});
test('reduced motion suppresses confetti/toasts/count-up and cancels running effects immediately',()=>{
 const off=motion(true),e=new off.Element();assert.equal(off.api.reduced(),true);assert.equal(off.api.completion('book:x',false,true,anchor,'home'),false);
 assert.equal(off.api.countUp(e,'1,234원','asset'),false);assert.equal(e.textContent,'1,234원');assert.equal(off.bursts.length,0);assert.equal(off.toasts.length,0);assert.equal(off.frames.size,0);
 const on=motion(),number=new on.Element();assert.equal(on.api.countUp(number,'1,234원','asset'),true);assert.equal(on.api.countUp(number,'1,234원','asset'),false);assert.equal(on.frames.size,1);
 on.api.completion('task:x',false,true,anchor,'tasks');on.preference.matches=true;on.preference.change();assert.equal(on.frames.size,0);assert.equal(number.textContent,'1,234원');assert.equal(on.bursts[0].removed,true);
});
test('count-up ends in 560ms; unchanged value skips, changed value animates',()=>{
 const {api,frames,Element}=motion(),e=new Element();assert.equal(api.countUp(e,'23.5kg','weight'),true);
 const callback=[...frames.values()][0];callback(560);assert.equal(e.textContent,'23.5kg');assert.equal(frames.size,0);
 assert.equal(api.countUp(e,'23.5kg','weight'),false);assert.equal(api.countUp(e,'24.0kg','weight'),true);
});
test('canonical task and book controls call celebration only after commit succeeds',()=>{
 const main=readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
 const taskHandler=main.slice(main.indexOf('x.onchange=()=>{const t=state.tasks.find'),main.indexOf('});document.querySelectorAll("[data-task-calendar-sync]"'))+'}';
 const bookStart=main.indexOf('b.onclick=()=>{const x=state.books.find',main.indexOf("document.querySelectorAll('[data-book-toggle]')"));
 const bookHandler=main.slice(bookStart,main.indexOf("});document.querySelectorAll('[data-book-edit]')",bookStart))+'}';
 const state={tasks:[{id:'t',done:false}],books:[{id:'b',status:'wish'}]},calls=[];
 let saved=false;
 const context=vm.createContext({state,x:{dataset:{taskCheck:'t'},checked:true,getBoundingClientRect:()=>anchor},b:{dataset:{bookToggle:'b'},getBoundingClientRect:()=>anchor},commit:()=>saved,today:()=> '2026-10-11',Date,window:{HaniMotion:{completion:(...args)=>calls.push(args)}}});
 vm.runInContext(taskHandler+';'+bookHandler,context);context.x.onchange();context.b.onclick();assert.equal(calls.length,0);
 state.tasks[0].done=false;state.books[0].status='wish';saved=true;context.x.onchange();context.b.onclick();
 assert.deepEqual(calls.map(c=>c.slice(0,3)),[['task:t',false,true],['book:b',false,true]]);
 assert.equal(calls[0][4],'tasks');assert.equal(calls[1][4],'reading');
});
