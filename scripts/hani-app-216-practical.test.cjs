const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const source=fs.readFileSync('hani-main.js','utf8'),study=fs.readFileSync('hani-study-v02984.js','utf8');
const pick=(s,a,b)=>{assert.ok(s.includes(a)&&s.includes(b));return s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)))};
const context=vm.createContext({Date,Intl,Map,Set,Number,Math,JSON,Array,String,Object,state:{books:[],movies:[],ledgerMonths:[]},window:{},today:()=> '2026-10-18',won:x=>Number(x).toLocaleString()+'원',esc:x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))});
vm.runInContext(pick(source,'function ledgerSettlementPeriod(','function ledgerCategoryKey(')+pick(source,'function activityDate(','function renderReading(){')+'\nthis.api={activityDate,activityTrend,readingTrendDate,activityTrendHtml,ledgerFixedChanges,ledgerReimbursements,settlementCheckModel,renderActivityTrend,renderSettlementCheck,renderLedgerPractical};',context);
const {api}=context,plain=x=>JSON.parse(JSON.stringify(x));
const rows=(dates)=>dates.map((date,i)=>({id:String(i),status:'read',completedDate:date}));
const baseline=['2026-01-10','2026-02-10','2026-02-12','2026-03-10','2026-03-12','2026-04-10','2026-04-12'];
const trend=dates=>api.activityTrend(rows(dates),{dateOf:api.readingTrendDate,asOf:'2026-10-18'});
test('completion dates: KST, valid calendar, conflict, future, undated registration and duplicate IDs',()=>{
 assert.equal(api.activityDate('2026-01-31T15:00:00Z'),'2026-02-01');assert.equal(api.activityDate('2026-02-30'),'');
 for(const value of ['2026-01-01T24:00:00Z','2026-01-01T12:60:00Z','2026-01-01T12:00:00+14:30','2026-01-01T12:00:00+15:00'])assert.equal(api.activityDate(value),'',value);
 assert.equal(api.readingTrendDate({completedDate:'2026-02-01',readDate:'2026-02-02'}),'');
 const input=[...rows(baseline),{id:'future',completedDate:'2027-01-01'},{id:'undated',createdAt:'2026-03-01T00:00:00Z'},{id:'x',completedDate:'2026-08-01'},{id:'x',completedDate:'2026-08-01'}];const before=JSON.stringify(input);
 const value=api.activityTrend(input,{dateOf:api.readingTrendDate,asOf:'2026-10-18'});assert.equal(value.annual,7);assert.equal(value.undated,1);assert.equal(value.registered,1);assert.equal(JSON.stringify(input),before);
});
test('consecutive completed initial/recent windows include empty months; initial partial month omitted',()=>{
 const value=trend([...baseline,'2026-07-01','2026-09-01']);assert.deepEqual(plain(value.initial),['2026-02','2026-03','2026-04']);assert.deepEqual(plain(value.recentCounts),[1,0,1]);assert.equal(value.baseline,2);assert.equal(value.status,'줄어듦');assert.equal(value.projection,11);
});
test('status 유지 / 줄어듦 / 쉬는 중 and conservative insufficient samples',()=>{
 assert.equal(trend([...baseline,'2026-07-01','2026-07-02','2026-08-01','2026-08-02','2026-09-01']).status,'유지');
 assert.equal(trend([...baseline,'2026-07-01']).status,'쉬는 중');
 assert.equal(trend(['2026-06-01','2026-07-01','2026-08-01','2026-09-01']).enough,false);
 assert.equal(trend(['2026-01-01','2026-02-01','2026-03-01']).projection,null);
 assert.equal(trend([]).status,'판정 보류 · 기록 부족');
});
test('year boundary and current partial month excluded from pace, included in annual completion',()=>{
 const value=api.activityTrend(rows(['2025-01-01','2025-02-01','2025-03-01','2025-04-01','2025-10-01','2025-11-01','2025-12-01','2026-01-01']),{dateOf:api.readingTrendDate,asOf:'2026-01-02'});
 assert.equal(value.annual,1);assert.deepEqual(plain(value.recent),['2025-10','2025-11','2025-12']);assert.equal(value.projection,13);
});
test('rendered trend uses resolved registry goal only; never legacy fallback, no guilt, escapes values',()=>{
 context.state.books=rows([...baseline,'2026-07-01']);context.state.goals={readingAnnual:999};
 let html=api.activityTrendHtml('reading');assert.match(html,/기록이 뜸해졌네요/);assert.match(html,/실제로 안 읽으신/);assert.match(html,/목표 비교 보류/);assert.match(html,/목표 없음/);assert.doesNotMatch(html,/999/);
 context.window.HANI_GOAL_PROGRESS={read:()=>[{definition:{metric_id:'books_completed_count'},goal:{status:'RESOLVED',target:24}}]};html=api.activityTrendHtml('reading');assert.match(html,/연간 목표 24권/);
 context.window.HANI_GOAL_PROGRESS.read=()=>[{definition:{metric_id:'books_completed_count'},goal:{status:'CONFLICT',target:999}}];assert.doesNotMatch(api.activityTrendHtml('reading'),/999/);
 context.state.movies=[{status:'watched',watchedDate:'2026-02-01'}];assert.match(api.activityTrendHtml('movie'),/시청 사용 추이/);
});
const item=(id,amount,extra={})=>({id,date:'2026-09-05',content:'통신비',category:'fixed',payment:'카드A',subcategory:'통신',detail:'월요금',amount,reimbursement:0,note:'원본 메모',...extra});
const ledger=(month,items,extra={})=>({month,items,importVersion:'LEDGER_FINAL_V1',importedAt:month+'-18T00:00:00Z',...plain(context.ledgerSettlementPeriod(month)),...extra});
test('fixed costs compare finalized consecutive settlement periods, aggregate matching rows and preserve sources',()=>{
 const before=ledger('2026-08',[item('a',100,{date:'2026-08-01'}),item('b',50,{date:'2026-08-02'})]),after=ledger('2026-09',[item('c',200),item('d',30,{content:'구독료'})]);
 const original=JSON.stringify([before,after]);const value=api.ledgerFixedChanges([after,before], '2026-10-18');assert.equal(value.ready,true);assert.equal(value.changes.length,2);assert.equal(value.changes[0].before,150);assert.equal(value.changes[0].total,200);assert.equal(value.changes[0].previousRows.length,2);assert.equal(value.changes[1].before,null);assert.equal(JSON.stringify([before,after]),original);
});
test('fixed costs skip ongoing, manual/incomplete months, gaps, invalid amounts and out-of-period rows',()=>{
 const good=ledger('2026-08',[item('a',100,{date:'2026-08-01'})]);
 for(const bad of [ledger('2026-09',[item('b',200)],{importVersion:''}),ledger('2026-09',[item('b',200)],{periodStart:''}),ledger('2026-09',[item('b',200,{date:'2026-09-18'})]),ledger('2026-09',[item('b',NaN)]),ledger('2026-10',[item('b',200,{date:'2026-10-01'})])])assert.equal(api.ledgerFixedChanges([good,bad],'2026-10-17').ready,false);
 assert.equal(api.ledgerFixedChanges([good,ledger('2026-09',[item('b',200)])],'2026-09-17').ready,false);
 assert.equal(api.ledgerFixedChanges([good,ledger('2026-10',[item('b',200,{date:'2026-10-01'})])],'2026-11-01').ready,false);
});
test('reimbursement rows retain month, amount and memo without a received/unpaid inference',()=>{
 const a=item('a',100,{reimbursement:70,note:'이미 받았을 수도 있음'}),records=[ledger('2026-08',[a,item('b',100)])];const before=JSON.stringify(records),value=api.ledgerReimbursements(records);assert.equal(value[0].rows.length,1);assert.equal(value[0].rows[0].note,a.note);assert.equal(JSON.stringify(records),before);
});
test('settlement checklist 15–21 only, exact periods, confirmed investment, previous closed report, verified backup age',()=>{
 const source={ledgerMonths:[ledger('2026-10',[])],investmentBrokerSnapshots:[{period:'2026-10',mode:'practice',status:'confirmed'}],monthlyReports:[{month:'2026-09',view:{}}]};const before=JSON.stringify(source);
 let value=api.settlementCheckModel(source,'2026-10-18',{lastAt:'2026-10-10T15:00:00Z'});assert.equal(value.visible,true);assert.match(value.items[0].detail,/記録|기록 있음/);assert.match(value.items[1].detail,/확인 필요/);assert.match(value.items[2].detail,/생성 기록 있음/);assert.match(value.items[3].detail,/7일/);assert.equal(JSON.stringify(source),before);
 for(const day of [14,22,31])assert.equal(api.settlementCheckModel(source,'2026-10-'+day).visible,false);
 for(const day of [15,17,18,21])assert.equal(api.settlementCheckModel(source,'2026-10-'+day).visible,true);
 assert.match(api.settlementCheckModel(source,'2026-10-18',{lastAt:'2026-10-19'}).items[3].detail,/확인 필요/);
});
test('quick wrong selection excludes mastered/disputed via canonical wrongRows, max 3, never mutates or saves',()=>{
 const learning={learningWrongAnswers:[{id:'1',wrongCount:5},{id:'2',wrongCount:4,reviewStatus:'mastered'},{id:'3',wrongCount:4,disputed:true},{id:'4',wrongCount:3,reviewStatus:'reviewed'},{id:'5',wrongCount:1,reviewStatus:'review'},{id:'6',wrongCount:1,reviewStatus:'retry_completed'}]};
 const ctx=vm.createContext({state:learning,disputedWrongAnswer:r=>r.disputed});
 vm.runInContext(pick(study,'  function wrongRows() {','  function wrongGroups() {')+pick(study,'  function quickWrongRows() {','  function renderQuickWrong() {')+'this.select=quickWrongRows;',ctx);
 const before=JSON.stringify(learning);assert.deepEqual(plain(ctx.select()).map(r=>r.id),['1','4','5']);assert.equal(JSON.stringify(learning),before);
});
test('native collapsed forms use original unique IDs and save path; persistent slots and phone order anchors',()=>{
 const html=fs.readFileSync('index.html','utf8');for(const view of ['reading','movie']){const match=html.match(new RegExp('<details[^>]+data-phase1-form="'+view+'"[^>]*>'));assert.ok(match);assert.doesNotMatch(match[0],/\bopen\b/)}
 for(const id of ['saveBook','saveMovie','bookTitle','movieTitle','bodyWeight','readingActivityTrend','movieActivityTrend','monthlyReadingActivityTrend','settlementQuickCheck'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 for(const view of ['reading','movie']){const section=pick(html,'<section id="'+view+'"','</section>');assert.match(section,new RegExp('</details>\\s*<div class="card full activity-trend-card" id="'+view+'ActivityTrend"></div>'),'persistent trend slot immediately follows record form');}
 assert.match(fs.readFileSync('hani-design-system.css','utf8'),/\.body-quick-input\{order:-2/);
});
test('Vault status reads only the current owner cache and exposes no handle, name, hash or writes',()=>{
 const vault=fs.readFileSync('hani-drive-vault.js','utf8'),body=pick(vault,'  function readStatus(){','  root.HANI_DRIVE_VAULT=');
 const ctx=vm.createContext({api:{context:()=>({owner:'a'})},cachedOwner:'a',cached:{last:{at:'2026-10-11T00:00:00Z',name:'private-name',sha256:'private-hash'},handle:{}},Object});vm.runInContext(body+'this.read=readStatus;',ctx);
 assert.deepEqual(plain(ctx.read()),{lastAt:'2026-10-11T00:00:00Z'});assert.equal(Object.isFrozen(ctx.read()),true);
 ctx.api.context=()=>({owner:'b'});assert.equal(ctx.read().lastAt,null);ctx.api.context=()=>({owner:''});assert.equal(ctx.read().lastAt,null);
 ctx.api.context=()=>({owner:'a'});ctx.cached=null;assert.equal(ctx.read().lastAt,null);
});
