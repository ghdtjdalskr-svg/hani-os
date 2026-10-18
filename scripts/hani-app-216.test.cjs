// Synthetic records only. Exercise the actual approval and canonical delete handlers.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../hani-main.js'),'utf8');
const helpers=source.slice(source.indexOf('// Record deletion approval is transient UI;'),source.indexOf('function renderBody(){'));
function expressionAt(start){
  for(let end=source.indexOf('}',start);end>=0;end=source.indexOf('}',end+1)){
    const code=source.slice(start,end+1);try{new vm.Script('('+code+')');return code}catch{}
  }
  throw Error('Missing function at '+start);
}
function handler(marker){
  const at=source.indexOf(marker);assert.ok(at>=0,marker);
  const match=/onclick=(async\s*)?\(\)=>\{/.exec(source.slice(at));assert.ok(match,marker);
  return expressionAt(at+match.index+'onclick='.length);
}
function fixture(){
  const nodes=new Map(),focus=[],messages=[];
  const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',open:false,returnValue:'',isConnected:true,attrs:{},listeners:{},classList:{values:new Set(),toggle(k){if(this.values.has(k)){this.values.delete(k);return false}this.values.add(k);return true}},focus(){focus.push(id)},getAttribute(k){return this.attrs[k]},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this.listeners[k]=fn},showModal(){this.open=true},close(value){if(value!==undefined)this.returnValue=value;this.open=false;const fn=this.listeners.close;delete this.listeners.close;fn?.()}});return nodes.get(id)};
  const c={state:{},$:node,document:{activeElement:node('opener')},toast:x=>messages.push(x),calls:0,backups:0,autoSnapshots:0,commit(){c.calls++;return true},exportData(){c.backups++;return true},closeModal(){},renderAll(){},monthlyDraft:null,brokerDraft:null,activeDiaryId:'target',monthKeyNow:()=> '2026-10',monthlyBlankDraft:()=>({}),brokerBlank:()=>({}),taskCalendarMeta:t=>({eventId:t.eventId}),autoSnapshot(){c.autoSnapshots++},instrumentBy:id=>c.state.instruments.find(x=>x.id===id),masterUsage:()=>({}),openTravelTripDetail(){},campusActiveSemester:()=>c.state.campusSemesters[0],ledgerEditMonth:'2026-10',ledgerFind:()=>c.state.ledgerMonths[0],showView:id=>{c.view=id},console,Promise};
  c.structuredClone=structuredClone;vm.createContext(c);vm.runInContext(helpers,c);return {c,node,focus,messages};
}
const specs=[
 ['body',"document.querySelectorAll('[data-delete-body]')",'deleteBody','body'],
 ['exercise',"document.querySelectorAll('[data-delete-exercise]')",'deleteExercise','exercise'],
 ['book',"document.querySelectorAll('[data-book-delete]')",'bookDelete','books'],
 ['movie',"document.querySelectorAll('[data-movie-delete]')",'movieDelete','movies'],
 ['task','document.querySelectorAll("[data-task-delete]")','taskDelete','tasks'],
 ['cashflow','document.querySelectorAll("[data-flow-delete]")','flowDelete','investmentCashFlows'],
 ['watch','document.querySelectorAll("[data-watch-delete]")','watchDelete','investmentWatchlist'],
 ['journal','document.querySelectorAll("[data-journal-delete]")','journalDelete','investmentJournal'],
 ['instrument','document.querySelectorAll("[data-delete-instrument]")','deleteInstrument','instruments'],
 ['transaction','document.querySelectorAll("[data-delete-tx]")','deleteTx','transactions'],
 ['monthly','document.querySelectorAll("[data-monthly-delete]")','monthlyDelete','investmentMonthlySnapshots'],
 ['broker','document.querySelectorAll("[data-bs-delete]")','bsDelete','investmentBrokerSnapshots'],
 ['ledger month','document.querySelectorAll("[data-ledger-month-delete]")','ledgerMonthDelete','ledgerMonths'],
 ['spend purchase','document.querySelectorAll("[data-spend-purchase-delete]")','spendPurchaseDelete','spendReviews'],
 ['wish',"querySelectorAll('[data-wish-delete]')",'wishDelete','wishlistItems'],
 ['certificate','querySelectorAll(".certificate-delete")','certificate','certificates'],
 ['place','querySelectorAll(".travel-place-delete")','placeId','travelPlaces'],
 ['linked place','querySelectorAll(".travel-linked-place-delete")','travelReview','travelPlaces'],
 ['travel wish','querySelectorAll(".travel-wish-delete")','travelWish','travelWishlist'],
 ['travel trip','$("travelDetailDeleteTrip")',null,'travelTrips'],
 ['campus course','$("campusDetailDeleteCourse")',null,'campusSemesters.0.courses'],
 ['travel stop','row.querySelector(".travel-stop-delete")',null,'travelTrips.0.itinerary'],
 ['travel review','querySelectorAll(".travel-review-delete")','travelReview','travelTrips.0.reviews'],
 ['ledger item','document.querySelectorAll("[data-ledger-item-delete]")','ledgerItemDelete','ledgerMonths.0.items'],
 ['spend review','document.querySelectorAll("[data-spend-review-delete]")','spendReviewDelete','spendReviews.0.reviews'],
 ['diary',null,null,'diaries']
];
const get=(root,path)=>path.split('.').reduce((x,k)=>x[k],root);
const set=(root,path,value)=>{const keys=path.split('.'),last=keys.pop();keys.reduce((x,k)=>x[k]??(x[k]=/^\d+$/.test(k)?[]:{}),root)[last]=value};
let checks=0;
(async()=>{
 for(const [name,marker,datasetKey,list] of specs){
  const f=fixture(),{c,node}=f;
  const target={id:'target',date:'2026-10-18',name:'대상 <img onerror=throw>',title:'삭제 대상',text:'오늘 할 일',weight:72.35,fat:0,muscle:null,steps:6500,distance:4.25,strength:false,note:'메모',month:'2026-10',period:'2026-10',mode:'actual',reviews:[],items:[],itinerary:[]};
  c.state={transactions:[],ui:{ledgerMonth:'2026-10'},travelTrips:[{id:'trip',itinerary:[],reviews:[]}],travelPlaces:[],campusSemesters:[{courses:[],events:[{courseId:'target'},{courseId:'keep'}]}],ledgerMonths:[{month:'2026-10',items:[]}],spendReviews:[{id:'purchase',name:'부모 구매',reviews:[]}]};
  set(c.state,list,[target,{id:'keep',date:'2026-10-17'}]);
  c.id='target';c.t=c.state.travelTrips[0];
  c.b=c.btn={dataset:{[datasetKey]:name==='spend review'?'purchase|target':'target'},closest:()=>({dataset:{[datasetKey]:'target'}})};
  node('travelDetailTripId').value='target';node('campusDetailCourseId').value='target';
  const code=marker?handler(marker):expressionAt(source.indexOf('async function deleteDiary('));
  c.run=vm.runInContext('('+code+')',c);
  const before=JSON.stringify(c.state),pending=c.run('target');
  assert.equal(node('recordDeleteDialog').open,true,name+': in-page dialog opened');
  assert.equal(f.focus.at(-1),'recordDeleteCancel',name+': cancel focus');
  assert.match(node('recordDeleteValues').textContent,/2026-10-18/);
  assert.match(node('recordDeleteValues').textContent,/72\.35/);
  assert.equal(c.calls,0);assert.equal(c.backups,0);assert.equal(JSON.stringify(c.state),before,name+': untouched while pending');
  node('recordDeleteDialog').close('cancel');await pending;
  assert.equal(JSON.stringify(c.state),before,name+': cancel untouched');assert.equal(c.calls,0);
  const approved=c.run('target');node('recordDeleteDialog').close('approve');await approved;
  assert.deepEqual(Array.from(get(c.state,list),x=>x.id),['keep'],name+': only target removed');
  assert.equal(c.calls,1,name+': one existing commit');
  assert.equal(c.backups,['monthly','broker','place','linked place','travel wish','travel trip','campus course'].includes(name)?1:0,name+': original backup');
  if(name==='transaction')assert.equal(c.autoSnapshots,1);
  if(name==='campus course')assert.deepEqual(Array.from(c.state.campusSemesters[0].events,x=>x.courseId),['keep']);
  checks++;
 }
 for(const change of ['mutate','replace','remove','switch-state']){
  const f=fixture(),r={id:'target',date:'2026-10-18',steps:0};f.c.state={exercise:[r]};
  const p=f.c.confirmRecordDelete(r,'운동 기록');
  assert.equal(await f.c.confirmRecordDelete(r,'중복 클릭'),false,'no parallel dialogs');
  if(change==='mutate')r.steps=1;
  if(change==='replace')f.c.state.exercise=[{...r}];
  if(change==='remove')f.c.state.exercise=[];
  if(change==='switch-state')f.c.state={exercise:[r]};
  f.node('recordDeleteDialog').close('approve');assert.equal(await p,false,change+': stale approval denied');checks++;
 }
 {const f=fixture(),r={id:'t',fat:0,muscle:null,strength:false,note:'<img src=x onerror=alert(1)>',cover:'data:image/png;base64,omitted'};f.c.state={body:[r]};const pending=f.c.confirmRecordDelete(r,'신체');const text=f.node('recordDeleteValues').textContent;assert.match(text,/체지방률 \(%\) · 0/);assert.match(text,/골격근량 \(kg\) · 미입력/);assert.match(text,/근력운동 · 아니요/);assert.match(text,/<img/);assert.doesNotMatch(text,/base64/);f.node('recordDeleteDialog').close();assert.equal(await pending,false,'Escape/native close defaults to cancel');checks++}
 {const f=fixture(),button=f.node('toggle');button.attrs['aria-controls']='table';f.c.togglePhoneTable(button);assert.equal(button.attrs['aria-expanded'],'true');assert.equal(button.textContent,'요약 보기');f.c.togglePhoneTable(button);assert.equal(button.attrs['aria-expanded'],'false');assert.equal(button.textContent,'전체 보기');assert.equal(f.c.calls,0);checks++}
 {const f=fixture(),input=f.node('ledgerImportRaw');input.closest=()=>({scrollIntoView(){f.c.scrolled=true}});f.c.openLedgerImport();assert.equal(f.c.view,'investmentIntake');assert.equal(f.focus.at(-1),'ledgerImportRaw');assert.equal(f.c.scrolled,true);assert.equal(f.c.calls,0);checks++}
 console.log('PASS app-216: '+checks+' behavior scenarios (26 canonical deletes, cancel/default focus, stale/double approval, summary toggle, existing importer focus).');
})().catch(e=>{console.error(e);process.exitCode=1});
