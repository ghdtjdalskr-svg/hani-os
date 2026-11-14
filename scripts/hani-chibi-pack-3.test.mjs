import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
// Capture actual feature bytes before importing any legacy adapters.
import inverse from './hani-chibi-pack-3-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import fs from 'node:fs';
const {readRawFileSync:read,delta,hash,restore,project}=inverse,root=new URL('../',import.meta.url);
const main=read(new URL('hani-main.js',root),'utf8');
function fn(name){
 const start=main.indexOf('function '+name+'(');assert.ok(start>=0,name);
 for(let end=main.indexOf('\n',start);end>=0;end=main.indexOf('\n',end+1)){
  const candidate=main.slice(start,end);try{new vm.Script('('+candidate+')');return candidate}catch{}
 }
 throw Error('function end '+name);
}
function harness({missingPortrait=false}={}){
 let created=0,writes=0;
 class Node{
  constructor(tag='div'){this.tag=tag;this.id='';this.className='';this.children=[];this.hidden=false;this.style={};this.dataset={};this.value='';this.textContent='';this.attributes={};this.classList={toggle(){},add(){},remove(){}};}
  append(node){this.insertBefore(node,null)}
  insertBefore(node,next){if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);node.parent=this;this.children.splice(next?this.children.indexOf(next):this.children.length,0,node);}
  before(node){this.parent.insertBefore(node,this)}
  after(node){this.parent.insertBefore(node,this.parent.children[this.parent.children.indexOf(this)+1]||null)}
  get firstElementChild(){return this.children[0]}
  get lastElementChild(){return this.children.at(-1)}
  setAttribute(k,v){this.attributes[k]=v}
  set innerHTML(value){this.html=value;for(const n of this.children)n.parent=null;this.children=[];if(value.startsWith('<span class="hani-chibi-note-art"')){this.append(new Node('span'));this.append(new Node('span'));}}
  get innerHTML(){return this.html||''}
  querySelector(s){return this.querySelectorAll(s)[0]||null}
  querySelectorAll(s){const match=n=>s.startsWith('#')?n.id===s.slice(1):s.startsWith('.')?n.className.split(' ').includes(s.slice(1)):false;return this.children.flatMap(n=>[...(match(n)?[n]:[]),...n.querySelectorAll(s)]);}
 }
 const rootNode=new Node(),find=id=>rootNode.querySelector('#'+id);
 const $=id=>{let node=find(id);if(!node&&!id.endsWith('ChibiNote')){node=new Node();node.id=id;rootNode.append(node);}return node;};
 const fail=()=>{writes++;throw Error('unexpected storage/network/commit/timer/listener')};
 const state={ui:{},diaries:[],movies:[],books:[],body:[],exercise:[],tasks:[],monthlyReports:[],ledgerMonths:[]};
 const c={console,Date,Map,Set,Math,Number,String,Array,JSON,$,state,window:{},
  document:{createElement:t=>{created++;return new Node(t)},querySelectorAll:()=>[],getElementById:()=>null},
  localStorage:new Proxy({},{get:fail}),sessionStorage:new Proxy({},{get:fail}),save:fail,commit:fail,fetch:fail,setTimeout:fail,setInterval:fail,
  n:v=>Number(v)||0,esc:v=>String(v??''),today:()=> '2026-11-21',filterText:(a,s)=>a.filter(r=>JSON.stringify(r).includes(s)),
  uiPageSize:()=>12,uiPageSlice:(_id,rows)=>({rows}),uiMountPagination(){},diaryCard:r=>'<article>'+r.title+'</article>',
  renderActivityTrend(){},movieContentType:x=>x,movieWorkGroups:x=>x,movieViewingUnits:x=>x.length,movieWorkCard:r=>'<article>'+r.title+'</article>',
  sortRatedItems:x=>x,filterMinimumRating:x=>x,completedByToday:()=>true,ratingValue:()=>null,updateMovieFormState(){},
  monthlyReportMonth:'2026-10',monthlyReportBoard:'monthly',monthlyReportGeneration:null,monthlyReportGenerationFailure:null,
  monthlyReportRenderBoard(){},monthlyReportKoreaDate:()=> '2026-11-21',monthlyReportAvailableMonths:()=>['2026-10'],monthlyReportDate:()=>true,
  monthlyReportPrevMonth:()=> '2026-10',monthlyReportStored:()=>state.monthlyReports.find(r=>r.month===c.monthlyReportMonth),monthlyReportSnapshot:()=>({recordCount:0}),monthlyReportPresentStored(){},formatDateTime:()=> '합성 시각',
  syncThemeCollections(){},renderHomeDialogue(){},officialBrokerSorted:()=>[],renderHaniCareHome(){},taskReadModel:()=>({own:[],actionable:[],todayLearning:[],count:0}),homeCalendarHtml:()=>'',ledgerMonthLabel:x=>x,
  completedInMonthByToday:()=>false,lifePeriodRows:()=>[],homeKpiHtml:()=>'',renderHomeMiniCharts(){},renderLifeMarket(){}
 };
 vm.createContext(c);
 const org=read(new URL('hani-organization-hub.js',root),'utf8');vm.runInContext(org,c);
 vm.runInContext(main.slice(main.indexOf('const canonicalProfileImages='),main.indexOf('const pageAgentImage=')).replace('...canonicalProfileImages,nauen:',(missingPortrait?'...canonicalProfileImages,daon:"",nauen:':'...canonicalProfileImages,nauen:')),c);
 vm.runInContext(main.slice(main.indexOf('const CHIBI_STAFF_BIRTHDAYS='),main.indexOf('function renderHomeBirthday(')),c);
 for(const name of ['renderChibiNote','renderHomeBirthday','renderHome','renderDiary','renderMovies','renderMonthlyReport'])vm.runInContext(fn(name),c);
 $('homeActions');$('diaryList');$('watchedMovies');$('monthlyReportPending');
 return {c,find,get created(){return created},get writes(){return writes},visible:id=>!!find(id)&&!find(id).hidden,
  run(name,...args){const before=JSON.stringify(state);c[name](...args);assert.equal(JSON.stringify(state),before,'state unchanged');assert.equal(writes,0);},
  clock(iso){const R=Date,F=R.parse(iso);c.Date=class extends R{constructor(...a){a.length?super(...a):super(F)}static now(){return F}};}};
}
test('outer feature inverse matches independent main296, preserves EOLs and rejects drift/double inverse',()=>{
 assert.equal(delta.base,'7a91982de08a54452f6b9057f906d651f63a65ca');
 for(const [file,row]of Object.entries(delta.files)){
  const source=read(new URL(file,root),'utf8'),before=repository.read(delta.base,file);
  assert.equal(hash(before),row.beforeSha256);assert.equal(restore(source,file),before);assert.deepEqual(restore(Buffer.from(source),file),Buffer.from(before));
  let forward=before;for(const e of row.edits){assert.equal(forward.split(e.before).length-1,1);forward=forward.replace(e.before,()=>e.after)}assert.equal(forward,source);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(row.edits[0].after,()=>row.edits[0].before),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){assert.throws(()=>restore(bad,file),/exact chibi-pack-3 input/);assert.equal(project(bad,file),bad);}
 }
});
test('approved birthday table is exactly 20 unique staff, dates/names/ranks match the organization roster',()=>{
 const h=harness(),rows=JSON.parse(vm.runInContext('JSON.stringify(CHIBI_STAFF_BIRTHDAYS)',h.c));
 assert.equal(rows.length,20);assert.equal(new Set(rows.map(r=>r[0])).size,20);
 assert.deepEqual(Object.fromEntries(rows.map(r=>[r[0],r.slice(3)])),{seoyun:[3,12],dohyun:[6,18],serin:[7,23],yuri:[9,11],arin:[4,24],gaeun:[9,25],mir:[5,14],taeo:[2,6],daon:[11,21],yoonseul:[3,26],hani:[1,17],yuna:[2,20],jieun:[4,9],haru:[5,29],naeun:[7,8],hina:[8,21],minji:[10,8],sooyeon:[11,6],sua:[12,12],ieum:[6,3]});
 for(const row of rows){
  const p=h.c.window.HaniOrganizationRoster.people.find(p=>p.id===row[0]);assert.ok(p);assert.equal(row[1],p.name);assert.equal(row[2],p.rank);
  h.run('renderHomeBirthday',new Date(Date.UTC(2026,row[3]-1,row[4],3)));
  const note=h.find('homeBirthdayChibiNote'),face=note.querySelector('.hani-birthday-portraits').children.find(f=>!f.hidden);
  assert.equal(face.dataset.person,row[0]);assert.equal(face.title,p.name+' · '+p.rank);assert.match(note.lastElementChild.textContent,new RegExp(p.name));
  const image=face.style.backgroundImage.match(/^url\("(.+)"\)$/)[1];assert.ok(fs.existsSync(new URL(image,root)),'existing portrait '+row[0]);
 }
});
test('real home renderer: birthday/nonbirthday, persistent card and thumbnails, KST midnight, no writes',()=>{
 const h=harness();h.clock('2026-11-20T14:59:59Z');h.run('renderHome');assert.equal(h.visible('homeBirthdayChibiNote'),false);assert.equal(h.created,0);
 h.clock('2026-11-20T15:00:00Z');h.run('renderHome');const note=h.find('homeBirthdayChibiNote'),count=h.created;
 assert.ok(h.visible(note.id));assert.equal(note.lastElementChild.textContent,'🎂 오늘은 다온 님 생일이에요! · 하니 · 다 같이 축하해요.');assert.match(note.firstElementChild.className,/birthday-cake/);
 const portraits=note.querySelector('.hani-birthday-portraits'),faces=portraits.children,daon=faces.find(f=>f.dataset.person==='daon');assert.equal(faces.filter(f=>!f.hidden).length,1);assert.match(daon.style.backgroundImage,/daon-v2-256.webp/);assert.equal(daon.title,'다온 · 사원');
 for(let i=0;i<8;i++)h.run('renderHome');assert.equal(h.created,count);assert.equal(h.find(note.id),note);assert.equal(portraits.children.find(f=>f.dataset.person==='daon'),daon);
 h.clock('2026-11-21T15:00:00Z');h.run('renderHome');assert.equal(h.visible(note.id),false);
 h.clock('2027-11-21T12:00:00+09:00');h.run('renderHome');assert.equal(h.find(note.id),note);assert.equal(h.created,count);assert.ok(h.visible(note.id));
});
test('two simultaneous birthdays share one card, both names and two persistent faces; unknown profile uses initial',()=>{
 const h=harness(),rows=JSON.parse(vm.runInContext('JSON.stringify(CHIBI_STAFF_BIRTHDAYS)',h.c));
 rows.find(r=>r[0]==='yoonseul').splice(3,2,11,21);
 const date=new Date('2026-11-21T12:00:00+09:00');h.run('renderHomeBirthday',date,rows);
 const note=h.find('homeBirthdayChibiNote'),count=h.created;
 assert.equal(note.lastElementChild.textContent,'🎂 오늘은 다온 님, 윤슬 님 생일이에요! · 하니 · 다 같이 축하해요.');
 assert.deepEqual(note.querySelector('.hani-birthday-portraits').children.filter(f=>!f.hidden).map(f=>f.dataset.person),['daon','yoonseul']);
 h.run('renderHomeBirthday',date,rows);assert.equal(h.find(note.id),note);assert.equal(h.created,count);
 const fallback=harness({missingPortrait:true});fallback.run('renderHomeBirthday',date);
 const face=fallback.find(note.id).querySelector('.hani-birthday-portraits').children.find(f=>f.dataset.person==='daon');
 assert.equal(face.textContent,'다');assert.equal(face.style.backgroundImage,undefined);
});
test('diary wholly empty differs from search misses; same slot survives record/empty transitions',()=>{
 const h=harness();h.run('renderDiary');const note=h.find('diaryChibiNote');assert.ok(h.visible(note.id));assert.equal(note.lastElementChild.textContent,'윤슬 · 오늘 한 줄부터 남겨 볼까요?');
 for(let i=0;i<6;i++)h.run('renderDiary');assert.equal(h.created,1);
 h.c.state.diaries=[{id:'d',title:'기존 일기',date:'2026-11-20'}];h.c.state.ui.diarySearch='없는 검색';h.run('renderDiary');assert.equal(h.visible(note.id),false);assert.match(h.find('diaryList').innerHTML,/조건에 맞는 일기가 없습니다/);
 h.c.state.diaries=[];h.run('renderDiary');assert.equal(h.find(note.id),note);assert.ok(h.visible(note.id));assert.equal(h.created,1);
});
test('movie existing slot uses Haru only when whole archive empty, hides for wish/watched and filter misses',()=>{
 const h=harness();h.run('renderMovies');const note=h.find('movieChibiNote');assert.ok(h.visible(note.id));assert.equal(note.lastElementChild.textContent,'하루 · 첫 작품 기록을 기다리고 있어요!');assert.match(note.firstElementChild.className,/haru-popcorn/);
 for(let i=0;i<6;i++)h.run('renderMovies');assert.equal(h.created,1);
 for(const status of ['wish','watched']){h.c.state.movies=[{id:'m',title:'기존 작품',status}];h.c.state.ui.movieSearch='없는 검색';h.c.state.ui.movieTypeFilter='영화';h.run('renderMovies');assert.equal(h.visible(note.id),false);}
 h.c.state.movies=[];h.run('renderMovies');assert.equal(h.find(note.id),note);assert.ok(h.visible(note.id));assert.equal(h.created,1);
});
test('monthly existing slot: empty only; stored, generation, failure and other boards hide; 296 title spans intact',()=>{
 const h=harness();h.run('renderMonthlyReport');const note=h.find('monthlyReportChibiNote');assert.ok(h.visible(note.id));assert.equal(note.lastElementChild.textContent,'지은 · 이번 달 보고가 생기면 여기 모아 둘게요.');assert.match(note.firstElementChild.className,/jieun-binder/);
 assert.match(h.find('monthlyReportPending').innerHTML,/<h4 class="monthly-report-empty-title"><span>2026-10<\/span> <span>월간보고가 없습니다.<\/span><\/h4>/);
 for(let i=0;i<6;i++)h.run('renderMonthlyReport');assert.equal(h.created,1);
 h.c.state.monthlyReports=[{month:'2026-10',view:{},generatedAt:'2026-11-01'}];h.run('renderMonthlyReport');assert.equal(h.visible(note.id),false);
 h.c.state.monthlyReports=[];h.c.monthlyReportGeneration={};h.run('renderMonthlyReport');assert.equal(h.visible(note.id),false);
 h.c.monthlyReportGeneration=null;h.c.monthlyReportGenerationFailure={month:'2026-10',reason:'합성 오류'};h.run('renderMonthlyReport');assert.equal(h.visible(note.id),false);
 h.c.monthlyReportGenerationFailure=null;for(const board of ['quarterly','annual']){h.c.monthlyReportBoard=board;h.run('renderMonthlyReport');assert.equal(h.visible(note.id),false);}
 h.c.monthlyReportBoard='monthly';h.run('renderMonthlyReport');assert.equal(h.find(note.id),note);assert.ok(h.visible(note.id));assert.equal(h.created,1);
});
test('added paths contain zero writes, listeners/timers/requests; existing handlers and 296 title bytes survive inverse',()=>{
 const source=main,before=restore(source,'hani-main.js'),added=delta.files['hani-main.js'].edits.map(e=>e.after.replace(e.before,'')).join('\n');
 assert.doesNotMatch(added,/localStorage|sessionStorage|supabase|fetch\s*\(|\b(?:save|commit|setTimeout|setInterval|addEventListener)\s*\(|state\.[\w.]+\s*=(?!=)/);
 for(const token of ['localStorage.setItem','localStorage.removeItem','localStorage.clear','addEventListener(','setTimeout(','setInterval(','commit('])assert.equal(source.split(token).length,before.split(token).length,token);
 assert.ok(fn('renderHome').includes('renderHomeBirthday();'));
 for(const f of ['index.html','hani-design-system.css','hani-study-v02984.js','assets/data/hani-history-releases-v1.json'])assert.equal(read(new URL(f,root),'utf8'),repository.read(delta.base,f));
});
test('actual WebP alpha/size and sheet positions, unchanged responsive/print/reduced-motion, raw 173 -> main296 172',async()=>{
 const css=read(new URL('hani-street-journal.css',root),'utf8');for(const [p,xy]of [['birthday-cake','0% 0%'],['yoonseul-notebook','100% 0%'],['haru-popcorn','0% 100%'],['jieun-binder','100% 100%']])assert.ok(css.includes('.hani-chibi-note .hsj-p-'+p+'{background-position:'+xy+'}'));
 assert.match(css,/width:72px;height:72px/);assert.match(css,/width:56px;height:56px/);assert.match(css,/@media print\{\.hani-chibi-note\{display:none!important\}\}/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 const b=read(new URL('assets/street-journal/chibi-sheet-v3.webp',root));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');assert.equal(b.readUIntLE(24,3)+1,1024);assert.equal(b.readUIntLE(27,3)+1,1024);assert.ok(b.includes(Buffer.from('ALPH')));assert.ok(b.length>=120*1024&&b.length<=240*1024);
 const closure=project=>resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>project(read(new URL(f,root)),f)});
 const current=await closure(b=>b),baseline=await closure(project);assert.equal(current.files.length,173);assert.equal(baseline.files.length,172);assert.deepEqual(current.files.filter(f=>!baseline.files.includes(f)),['assets/street-journal/chibi-sheet-v3.webp']);assert.deepEqual(current.missing,[]);assert.deepEqual(baseline.missing,[]);
});
