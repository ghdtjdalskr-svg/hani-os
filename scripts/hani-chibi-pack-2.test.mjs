import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import inverse from './hani-chibi-pack-2-source.cjs';
import releases from './hani-release-version-layers.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import fs from 'node:fs';
const {delta,hash,restore,project}=inverse;
// Keep this feature frozen; peel only the exact deployed 295 version bytes.
const read=releases.createReleaseReader('2.9.295',true);
const main=read(new URL('../hani-main.js',import.meta.url),'utf8'),study=read(new URL('../hani-study-v02984.js',import.meta.url),'utf8');
function fn(source,name){
 const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);
 for(let end=source.indexOf('\n',start);end>=0;end=source.indexOf('\n',end+1)){
  const candidate=source.slice(start,end);try{new vm.Script('('+candidate+')');return candidate}catch{}
 }
 throw Error('function end '+name);
}
function harness(){
 let created=0;
 class Node{
  constructor(tag='div'){this.tag=tag;this.id='';this.className='';this.children=[];this.hidden=false;this.style={};this.value='';this.textContent='';this.classList={toggle(){},add(){},remove(){}};}
  append(node){if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);node.parent=this;this.children.push(node);}
  before(node){this.insertSibling(node,0)}
  after(node){this.insertSibling(node,1)}
  insertSibling(node,offset){if(node===this)return;if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);node.parent=this.parent;this.parent.children.splice(this.parent.children.indexOf(this)+offset,0,node);}
  get firstElementChild(){return this.children[0]}
  get lastElementChild(){return this.children.at(-1)}
  set innerHTML(value){this.html=value;for(const n of this.children)n.parent=null;this.children=[];
   if(value.startsWith('<span class="hani-chibi-note-art"')){this.append(new Node('span'));this.append(new Node('span'));}
   if(value.includes('<header class="study-exam-head"')){const head=new Node('header');head.className='study-exam-head';this.append(head);}
  }
  get innerHTML(){return this.html||''}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null}
  querySelectorAll(selector){const matches=n=>selector.startsWith('#')?n.id===selector.slice(1):selector.startsWith('.')?n.className.split(' ').includes(selector.slice(1)):false;return this.children.flatMap(n=>[...(matches(n)?[n]:[]),...n.querySelectorAll(selector)]);}
 }
 const root=new Node(),find=id=>root.querySelector('#'+id);
 const $=id=>{let node=find(id);if(!node&&!id.endsWith('ChibiNote')){node=new Node();node.id=id;root.append(node);}return node;};
 const q=(s,host=root)=>host?.querySelector(s)||null;
 const fail=()=>{throw Error('unexpected storage/network/commit/timer/listener')};
 const state={ui:{},books:[],travelTrips:[],travelWishlist:[],travelPlaces:[],pageNotes:{},learningProjects:[],learningQuizzes:[]};
 const context={console,Date,Map,Set,Math,Number,String,Array,JSON,$,q,qa:()=>[],state,
  document:{createElement:tag=>{created++;return new Node(tag)},querySelectorAll:()=>[]},window:{HaniMotion:{refresh(){}}},
  localStorage:new Proxy({},{get:fail}),sessionStorage:new Proxy({},{get:fail}),save:fail,commit:fail,fetch:fail,setTimeout:fail,setInterval:fail,
  n:v=>Number(v)||0,esc:v=>String(v??''),safe:v=>String(v??''),today:()=> '2026-11-13',renderActivityTrend(){},
  sortRatedItems:x=>x,filterMinimumRating:(x,min)=>x.filter(b=>(b.rating||0)>=min),filterText:(x,s)=>x.filter(b=>b.title.includes(s)),completedByToday:()=>true,ratingValue:()=>null,completedInYearByToday:()=>true,completedInMonthByToday:()=>true,bookThanksIds:()=>new Set(),bookCard:b=>'<article>'+b.title+'</article>',
  uiPageSize:()=>12,uiPageSlice:(_id,rows)=>({rows}),uiMountPagination(){},updateBookFormState(){},renderReadingGoals(){},
  travelPlaceRows:()=>[],travelArchiveGroup:x=>x,travelDateRange:t=>t.startDate||'날짜 미정',recordIdAttributes:()=>'',renderTravelArchive(){},
  activeProjectId:'p',activeQuizId:'q',learningBoardOpen:false,quizArchivePage:1,quizArchiveMonth:'all',QUIZ_ARCHIVE_PAGE_SIZE:12,
  projectById:id=>state.learningProjects.find(x=>x.id===id),normalizeProject:p=>p,generationDate:()=> '2026-11-13',projectQuizzes:()=>state.learningQuizzes,generationPeriodQuiz:()=>state.learningQuizzes[0],quizById:id=>state.learningQuizzes.find(x=>x.id===id),isScheduledDate:()=>false,generationFailures:new Map(),generationKey:()=>'',busy:false,SCHEDULE_LABELS:{manual:'수동'},
  quizStatusLabel:()=> '기존 점수',quizDate:()=> '2026-11-13',quizThanksMarkup:()=>'',hinaQuizItems:()=>[],questionChips:()=>'',renderQuestionDispute:()=>'',tutorName:()=> '히나',bindQuestionDisputes(){},bindTutorReviewCopy(){},maybeAutoGenerate:fail,
 };
 $('studyMainPanel');vm.createContext(context);
 for(const name of ['renderChibiNote','renderReading','renderTravel','renderTravelDetailLists'])vm.runInContext(fn(main,name),context);
 for(const name of ['quizCorrectCount','regradeNote','acceptedRegrade','quizRegradeCount','quizScoreLabel','renderQuizDetail','renderMain'])vm.runInContext(fn(study,name),context);
 return {c:context,root,find,get created(){return created},visible:id=>!!find(id)&&!find(id).hidden,run(name,...args){const before=JSON.stringify(state);context[name](...args);assert.equal(JSON.stringify(state),before,'renderer leaves state unchanged');}};
}
const projectFixture=()=>({id:'p',name:'합성 학습',category:'general',scheduleType:'manual',status:'active',quizSize:2,focusAreas:[]});
const quizFixture=(answers=[0,0],status='completed')=>({id:'q',projectId:'p',title:'합성 문제',status,total:2,correctCount:answers.filter(x=>x===0).length,score:99,date:'2026-11-13',answers,questions:[0,1].map(i=>({prompt:'합성 문제 '+i,choices:['A','B','C','D'],answerIndex:0,explanation:'기존 해설'}))});

test('outer inverse matches independent supplied main bytes and retains all old fixture pins',()=>{
 for(const [file,row]of Object.entries(delta.files)){
  const raw=read(new URL('../'+file,import.meta.url),'utf8'),before=repository.read(delta.base,file);
  assert.equal(hash(before),row.beforeSha256);assert.equal(restore(raw,file),before);assert.deepEqual(restore(Buffer.from(raw),file),Buffer.from(before));
  let forward=before;for(const e of row.edits){assert.equal(forward.split(e.before).length-1,1);forward=forward.replace(e.before,()=>e.after)}assert.equal(forward,raw);
  for(const bad of [raw+'\n',raw.slice(1),raw+raw,before,raw.replace(row.edits[0].after,()=>row.edits[0].before),raw.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.throws(()=>restore(bad,file),/exact chibi-pack-2 input/);assert.equal(project(bad,file),bad);
  }
  assert.equal(project(before,file),before);
 }
});
test('reading: one persistent Yoonseul only for the wholly empty library, including return from wish/read/filter misses',()=>{
 const h=harness();h.run('renderReading');const note=h.find('readingChibiNote');assert.ok(h.visible('readingChibiNote'));assert.equal(note.lastElementChild.textContent,'윤슬 · 첫 책 한 권부터 적어 볼까요?');
 for(let i=0;i<6;i++)h.run('renderReading');assert.equal(h.created,1);assert.equal(h.find('readingChibiNote'),note);
 for(const status of ['wish','read']){h.c.state.books=[{id:'b',title:'기존 도서',status}];h.c.state.ui.readingSearch='없는 검색';h.run('renderReading');assert.equal(h.visible('readingChibiNote'),false);}
 h.c.state.books=[];h.run('renderReading');assert.ok(h.visible('readingChibiNote'));assert.equal(h.find('readingChibiNote'),note);assert.equal(h.created,1);
});
test('travel: one shared list slot across tabs; archive/filter misses hide it and undated wish remains undated',()=>{
 const h=harness();h.run('renderTravel');const note=h.find('travelChibiNote');assert.ok(h.visible('travelChibiNote'));
 for(let i=0;i<6;i++)h.run('renderTravel');assert.equal(h.created,1);
 h.c.state.ui.travelTab='wish';h.run('renderTravel');assert.ok(h.visible('travelChibiNote'));assert.equal(note.lastElementChild.textContent,'수연 · 가고 싶은 곳부터 적어 봐요!');assert.equal(note.parent.children[note.parent.children.indexOf(note)+1].id,'travelWishGrid');
 h.c.state.travelWishlist=[{id:'w',destination:'미정 여행',expectedDate:''}];h.run('renderTravel');assert.equal(h.visible('travelChibiNote'),false);assert.match(h.find('travelWishGrid').innerHTML,/날짜 미정/);
 h.c.state.ui.travelTab='archive';h.run('renderTravel');assert.equal(h.visible('travelChibiNote'),false);
 h.c.state.ui.travelTab='trips';h.c.state.travelTrips=[{id:'t',destination:'기존 여행',itinerary:[],reviews:[]}];h.run('renderTravel');assert.equal(h.visible('travelChibiNote'),false);
 h.c.state.travelTrips=[];h.run('renderTravel');assert.equal(h.find('travelChibiNote'),note);assert.ok(h.visible('travelChibiNote'));assert.equal(h.created,1);
});
test('travel schedule: the persistent slot follows actual itinerary emptiness without inventing dates',()=>{
 const h=harness(),trip={id:'t',itinerary:[],reviews:[]};h.run('renderTravelDetailLists',trip);const note=h.find('travelScheduleChibiNote');
 for(let i=0;i<6;i++)h.run('renderTravelDetailLists',trip);assert.equal(h.created,1);assert.ok(h.visible('travelScheduleChibiNote'));assert.equal(note.lastElementChild.textContent,'수연 · 일정은 천천히 적어 봐요.');
 trip.itinerary=[{id:'s',place:'미정 장소'}];h.run('renderTravelDetailLists',trip);assert.equal(h.visible('travelScheduleChibiNote'),false);assert.doesNotMatch(h.find('travelStopList').innerHTML,/2026-11-13/);
 trip.itinerary=[];h.run('renderTravelDetailLists',trip);assert.equal(h.find('travelScheduleChibiNote'),note);assert.ok(h.visible('travelScheduleChibiNote'));
});
test('quiz: one node survives owner innerHTML replacement, reflects actual regrade owner, hides on missing/pending/empty results',()=>{
 const h=harness();h.c.state.learningProjects=[projectFixture()];h.c.state.learningQuizzes=[quizFixture()];h.run('renderMain',false);const note=h.find('quizResultChibiNote');assert.ok(h.visible('quizResultChibiNote'));assert.equal(note.lastElementChild.textContent,'히나 · 잘했어요!');
 for(let i=0;i<6;i++)h.run('renderMain',false);assert.equal(h.created,1);assert.equal(h.find('quizResultChibiNote'),note);assert.equal(note.parent,h.find('studyMainPanel'));
 const quiz=quizFixture([1,0]);h.c.state.learningQuizzes=[quiz];h.run('renderMain',false);assert.equal(note.lastElementChild.textContent,'히나 · 틀린 문제, 다시 같이 봐요.');assert.match(note.firstElementChild.className,/hina-review/);assert.match(h.find('studyMainPanel').innerHTML,/기존 해설/);
 quiz.regradeNotes=[{questionIndex:0,status:'accepted',claim:'my_answer_correct',userAnswerIndex:1}];h.run('renderMain',false);assert.equal(note.lastElementChild.textContent,'히나 · 잘했어요!');
 h.c.state.learningQuizzes=[quizFixture([null,null],'pending')];h.run('renderMain',false);assert.equal(h.visible('quizResultChibiNote'),false);
 h.c.state.learningQuizzes=[];h.run('renderMain',false);assert.equal(h.visible('quizResultChibiNote'),false);
 h.c.state.learningQuizzes=[{...quizFixture(),questions:[],answers:[],total:0}];h.run('renderMain',false);assert.equal(h.visible('quizResultChibiNote'),false);
 h.c.activeProjectId='missing';h.run('renderMain',false);assert.equal(h.visible('quizResultChibiNote'),false);
 h.c.activeProjectId='p';h.c.state.learningQuizzes=[quizFixture()];h.run('renderMain',false);assert.equal(h.find('quizResultChibiNote'),note);assert.ok(h.visible('quizResultChibiNote'));assert.equal(h.created,1);
});
test('added code has zero storage, state writes, listeners, timers, requests and preserves grading/write/event bytes exactly',()=>{
 for(const file of ['hani-main.js','hani-study-v02984.js']){
  const raw=read(new URL('../'+file,import.meta.url),'utf8'),before=restore(raw,file),added=delta.files[file].edits.map(e=>e.after.replace(e.before,'')).join('\n');
  assert.doesNotMatch(added,/localStorage|sessionStorage|supabase|fetch\s*\(|\b(?:save|commit|setTimeout|setInterval|addEventListener)\s*\(|state\.[\w.]+\s*=(?!=)/);
  for(const token of ['localStorage.setItem','localStorage.removeItem','localStorage.clear','addEventListener(','setTimeout(','setInterval(','learningCommit(','commit('])assert.equal(raw.split(token).length,before.split(token).length,token);
 }
});
test('sprite: exactly one new transparent WebP dependency, four 2x2 positions, existing responsive/print rules and reduced motion',async()=>{
 const css=read(new URL('../hani-street-journal.css',import.meta.url),'utf8');
 for(const [pose,xy]of [['yoonseul-bookmark','0% 0%'],['hina-cheer','100% 0%'],['hina-review','0% 100%'],['sooyeon-map','100% 100%']])assert.ok(css.includes('.hani-chibi-note .hsj-p-'+pose+'{background-position:'+xy+'}'));
 assert.match(css,/background-size:200% 200%/);assert.match(css,/width:72px;height:72px/);assert.match(css,/width:56px;height:56px/);assert.match(css,/@media print\{\.hani-chibi-note\{display:none!important\}\}/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 const webp=read(new URL('../assets/street-journal/chibi-sheet-v2.webp',import.meta.url));assert.equal(webp.toString('ascii',0,4),'RIFF');assert.equal(webp.toString('ascii',8,12),'WEBP');assert.equal(webp.toString('ascii',12,16),'VP8X');assert.equal(webp.readUIntLE(24,3)+1,1024);assert.equal(webp.readUIntLE(27,3)+1,1024);assert.ok(webp.length>=120*1024&&webp.length<=240*1024);assert.ok(webp.includes(Buffer.from('ALPH')),'alpha chunk');
 const root=path.resolve(import.meta.dirname,'..');const current=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:f=>read(path.join(root,f))});
 const baseline=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:f=>project(read(path.join(root,f)),f)});
 assert.deepEqual(current.files.filter(f=>!baseline.files.includes(f)),['assets/street-journal/chibi-sheet-v2.webp']);assert.ok(current.files.length<=200);assert.deepEqual(current.missing,[]);
});
