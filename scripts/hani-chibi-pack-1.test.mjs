import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import inverse from './hani-chibi-pack-1-source.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {readChibiRawFileSync:read,delta,hash,restoreChibiPack1Source:restore}=inverse;
const source=read(new URL('../hani-main.js',import.meta.url),'utf8');
const css=read(new URL('../hani-street-journal.css',import.meta.url),'utf8');
const section=(start,end)=>{const i=source.indexOf(start),j=source.indexOf(end,i+start.length);assert.ok(i>=0&&j>i,start);return source.slice(i,j)};
const sections=[['function renderChibiNote(', 'function renderPortfolio('],['function investmentAmountKnown(', '// Read-only decoration:'],['function renderPortfolio(', '$("editInvestGoal")'],['function renderAssets(', 'function bodyMetric('],['function renderLedger(', 'function drawLedgerTrend('],['function renderMovies(', '$("cancelMovieEdit")'],['function renderSettlementCheck(', 'function renderReading('],['function renderMonthlyReport(', 'function renderAll(']];
function harness(){
  const nodes=new Map();let created=0;
  class Node{
    constructor(tag='div'){this.tag=tag;this.children=[];this.hidden=false;this.style={};this.value='';this.className='';this.classList={toggle(){},add(){},remove(){}};this.textContent='';}
    set innerHTML(value){this.html=value;this.children=[];if(value.startsWith('<span class="hani-chibi-note-art"')){this.children=[new Node('span'),new Node('span')];}}
    get innerHTML(){return this.html||''}
    get firstElementChild(){return this.children[0]}
    get lastElementChild(){return this.children.at(-1)}
    before(node){if(!nodes.has(node.id))created++;nodes.set(node.id,node);this.beforeNode=node;}
    after(node){if(!nodes.has(node.id))created++;nodes.set(node.id,node);this.afterNode=node;}
    append(node){this.children.push(node)}
    querySelector(selector){return this.children.find(n=>'.'+n.className===selector)||null}
    querySelectorAll(){return []}
  }
  const $=id=>{if(nodes.has(id))return nodes.get(id);if(id.endsWith('ChibiNote'))return null;const node=new Node();nodes.set(id,node);return node;};
  const fail=()=>{throw Error('unexpected storage/write access')};
  const c={console,Date,Map,Set,Math,Number,String,Array,JSON,n:v=>Number(v)||0,esc:v=>String(v??''),won:v=>String(v),signedWon:v=>String(v),seriesColor:()=>'',investmentMoveClass:()=>'',recordIdAttributes:()=>'',
    state:{ui:{},accounts:[],transactions:[],goals:{investment:100},movies:[],ledgerMonths:[],monthlyReports:[]},latest:null,
    calculate:()=>({total:0,totalCash:0,totalMarket:0,pnl:0,accounts:Object.fromEntries(c.state.accounts.map(a=>[a.id,{total:a.openingCash}]))}),officialBrokerLatest:()=>c.latest,brokerCalc:r=>r,
    $,document:{createElement:tag=>new Node(tag),querySelector:()=>null,querySelectorAll:()=>[]},window:{HaniMotion:{refresh(){}}},
    localStorage:new Proxy({},{get:fail}),save:fail,commit:fail,fetch:fail,setTimeout:()=>{},
    drawPortfolio(){},renderLedgerPractical(){},renderSpendReviews(){},drawLedgerTrend(){},ledgerEditMonth:'',LEDGER_CATEGORY_LABELS:{},ledgerDetailView:{category:'all',subcategory:'all',sort:'amountDesc'},
    ledgerCurrentMonthKey:()=> '2026-10',ledgerFind:()=>c.state.ledgerMonths.find(r=>r.month==='2026-10'),ledgerSettlementPeriod:()=>({}),ledgerCalc:()=>({total:0,targetT:100,targetC:100,jispiT:0,jispiC:0}),ledgerJispiStatus:()=>'',ledgerDetailSubcategories:()=>[],ledgerVisibleItems:items=>items.filter(x=>c.ledgerDetailView.category==='all'||x.category===c.ledgerDetailView.category),ledgerSorted:()=>c.state.ledgerMonths,ledgerMonthLabel:x=>x,
    renderActivityTrend(){},sortRatedItems:x=>x,filterMinimumRating:x=>x,filterText:(x,q)=>x.filter(r=>r.title.includes(q)),movieContentType:v=>v,movieWorkGroups:x=>x,movieViewingUnits:x=>x.length,completedByToday:()=>true,ratingValue:()=>null,movieWorkCard:m=>'<article>'+m.title+'</article>',uiPageSize:()=>12,uiPageSlice:(_id,rows)=>({rows}),uiMountPagination(){},updateMovieFormState(){},
    today:()=> '2026-11-17',settlementCheckModel:()=>({visible:c.settlementVisible,month:'2026-11',items:[]}),settlementVisible:true,
    monthlyReportBoard:'monthly',monthlyReportMonth:'2026-10',monthlyReportGeneration:null,monthlyReportGenerationFailure:null,monthlyReportRenderBoard(){},monthlyReportKoreaDate:()=> '2026-11-12',monthlyReportAvailableMonths:()=>[],monthlyReportDate:()=>true,monthlyReportPrevMonth:()=> '2026-10',monthlyReportStored:()=>c.stored,stored:null,monthlyReportSnapshot:()=>({recordCount:c.recordCount||0}),monthlyReportPresentStored(){c.presented=true},formatDateTime:x=>x,
  };
  vm.createContext(c);for(const [start,end]of sections)vm.runInContext(section(start,end),c);
  return {c,nodes,get created(){return created},visible:id=>nodes.has(id)&&!nodes.get(id).hidden};
}

test('exact outer inverse restores all original bytes; rejects drift, partial/duplicate edits and a second inverse',()=>{
  for(const [file,row]of Object.entries(delta.files)){
    const raw=read(new URL('../'+file,import.meta.url),'utf8'),before=restore(raw,file);assert.equal(hash(before),row.beforeSha256);
    assert.deepEqual(restore(Buffer.from(raw),file),Buffer.from(before));let forward=before;
    for(const edit of row.edits)forward=forward.replace(edit.before,()=>edit.after);assert.equal(forward,raw);
    for(const bad of [raw+'\n',raw.slice(1),before,raw+raw,raw.replace(row.edits[0].after,()=>row.edits[0].before)])assert.throws(()=>restore(bad,file),/exact chibi-pack-1 input/);
    assert.equal(inverse.projectPreChibiPack1Source(raw+'\n',file),raw+'\n');
  }
});
test('supplied release 289 projects exactly to independently frozen 288 bytes without relaxing lower pins',()=>{
  for(const [file,row]of Object.entries(delta.baseline289)){
    const raw=read(new URL('../'+file,import.meta.url),'utf8'),source=inverse.projectPreChibiPack1Source(raw,file),before=inverse.restoreBaseline289Source(source,file);
    assert.equal(hash(before),row.beforeSha256);assert.deepEqual(inverse.restoreBaseline289Source(Buffer.from(source),file),Buffer.from(before));
    for(const bad of [source+'\n',source.slice(1),source+source,before]){assert.throws(()=>inverse.restoreBaseline289Source(bad,file),/exact release-289 input/);assert.equal(inverse.projectLegacySource(bad,file),bad);}
  }
});
test('ledger: one persistent note only for the selected month without entries; filter misses and zero-valued entries are distinct',()=>{
  const h=harness();h.c.renderLedger();const slot=h.nodes.get('ledgerChibiNote');assert.ok(h.visible('ledgerChibiNote'));
  for(let i=0;i<8;i++)h.c.renderLedger();assert.equal(h.nodes.get('ledgerChibiNote'),slot);assert.equal(h.created,1);
  h.c.state.ledgerMonths=[{month:'2026-10',items:[{amount:0,category:'fixed'}]}];h.c.ledgerDetailView.category='variable';h.c.renderLedger();assert.equal(h.visible('ledgerChibiNote'),false);assert.match(h.nodes.get('ledgerItemRows').innerHTML,/조건에 맞는/);
  h.c.state.ledgerMonths=[{month:'2026-09',items:[{amount:1}]}];h.c.renderLedger();assert.ok(h.visible('ledgerChibiNote'));assert.equal(h.created,1);
});
test('investment and asset: missing records show Jieun once, confirmed zero records and existing transactions hide her',()=>{
  for(const [fn,id]of [['renderPortfolio','investmentChibiNote'],['renderAssets','assetChibiNote']]){
    const h=harness();h.c[fn]();const slot=h.nodes.get(id);for(let i=0;i<8;i++)h.c[fn]();assert.ok(h.visible(id));assert.equal(h.created,1);assert.equal(h.nodes.get(id),slot);
    h.c.latest={total:0,evaluation:0,cashLike:0,pnl:0,accounts:[]};h.c[fn]();assert.equal(h.visible(id),false);
    h.c.latest=null;h.c.state.transactions=[{amount:0}];h.c[fn]();assert.equal(h.visible(id),false);
    h.c.state.transactions=[];h.c.state.accounts=[{openingCash:10}];h.c[fn]();assert.equal(h.visible(id),false);
    h.c.state.accounts=[{openingCash:0}];h.c[fn]();assert.ok(h.visible(id));assert.equal(h.created,1);
  }
});
test('movie: one Minji for the entirely empty archive, no first-record note for wishes, watched items or filter misses',()=>{
  const h=harness();h.c.renderMovies();const slot=h.nodes.get('movieChibiNote');for(let i=0;i<8;i++)h.c.renderMovies();assert.ok(h.visible('movieChibiNote'));assert.equal(h.created,1);assert.equal(h.nodes.get('movieChibiNote'),slot);
  for(const status of ['wish','watched']){h.c.state.movies=[{title:'기존 작품',status}];h.c.state.ui.movieSearch='없음';h.c.renderMovies();assert.equal(h.visible('movieChibiNote'),false);assert.match(h.nodes.get('watchedMovies').innerHTML,/조건에 맞는/);}
  h.c.state.movies=[];h.c.renderMovies();assert.ok(h.visible('movieChibiNote'));assert.equal(h.created,1);
});
test('settlement: one persistent slot and content wrapper; date hiding preserves both and existing instructions',()=>{
  const h=harness();h.c.renderSettlementCheck();const note=h.nodes.get('settlementChibiNote'),content=h.nodes.get('settlementQuickCheck').querySelector('.hani-settlement-content');
  for(let i=0;i<8;i++)h.c.renderSettlementCheck();assert.equal(h.created,1);assert.equal(h.nodes.get('settlementChibiNote'),note);assert.equal(h.nodes.get('settlementQuickCheck').querySelector('.hani-settlement-content'),content);assert.match(content.innerHTML,/확인 표시는 저장하지 않아요/);
  assert.equal(content.afterNode,note,'existing checklist/buttons precede the decoration');
  h.c.settlementVisible=false;h.c.renderSettlementCheck();assert.equal(h.nodes.get('settlementQuickCheck').hidden,true);h.c.settlementVisible=true;h.c.renderSettlementCheck();assert.equal(h.created,1);
});
test('monthly: cover note never masks record availability, retry errors, generation status or stored report description',()=>{
  const h=harness();h.c.renderMonthlyReport();const note=h.nodes.get('monthlyReportChibiNote');assert.ok(h.visible('monthlyReportChibiNote'));assert.match(h.nodes.get('monthlyReportPending').innerHTML,/완료 기록이 없습니다/);
  h.c.recordCount=1;h.c.renderMonthlyReport();assert.match(h.nodes.get('monthlyReportPending').innerHTML,/확인한 뒤 보고서를 생성/);
  h.c.monthlyReportGeneration={};h.c.renderMonthlyReport();assert.equal(h.visible('monthlyReportChibiNote'),false);assert.match(h.nodes.get('monthlyReportPending').innerHTML,/원본 연결을 확인/);
  h.c.monthlyReportGeneration=null;h.c.monthlyReportGenerationFailure={month:'2026-10',reason:'원본 검증 실패'};h.c.renderMonthlyReport();assert.equal(h.visible('monthlyReportChibiNote'),false);assert.match(h.nodes.get('monthlyReportPending').innerHTML,/원본 검증 실패/);
  h.c.monthlyReportGenerationFailure=null;h.c.stored={month:'2026-10',generatedAt:'합성 시각'};for(let i=0;i<8;i++)h.c.renderMonthlyReport();assert.ok(h.c.presented);assert.ok(h.visible('monthlyReportChibiNote'));assert.equal(h.nodes.get('monthlyReportChibiNote'),note);assert.equal(h.created,1);assert.match(h.nodes.get('monthlyReportPending').innerHTML,/자동으로 바뀌지 않습니다/);
  assert.equal(h.nodes.get('monthlyReportPending').afterNode,note,'existing status and generate/retry button precede the decoration');
});
test('new UI edits have no storage, network, state writes, new event bindings or timers; old storage/event bytes fully restore',()=>{
  const added=delta.files['hani-main.js'].edits.map(e=>e.after.replace(e.before,'')).join('\n');
  assert.doesNotMatch(added,/localStorage|sessionStorage|supabase|fetch\s*\(|\b(?:save|commit|setTimeout|setInterval|addEventListener)\s*\(|state\.[\w.]+\s*=(?!=)/);
  for(const token of ['localStorage.setItem','localStorage.removeItem','localStorage.clear','addEventListener(','setInterval(','setTimeout('])assert.equal(source.split(token).length,restore(source,'hani-main.js').split(token).length,token);
});
test('only existing sprite coordinates are shared; responsive art is 72px/56px, hidden slots have no layout',()=>{
  const before=restore(css,'hani-street-journal.css');for(const pose of ['hani-point','jieun-think','minji-think']){
    const value=before.match(new RegExp('\\.hsj-sheet \\.hsj-p-'+pose+'\\{([^}]+)\\}'))[1];assert.ok(css.includes('.hsj-sheet .hsj-p-'+pose+',.hani-chibi-note .hsj-p-'+pose+'{'+value+'}'));
  }
  assert.match(css,/width:72px;height:72px/);assert.match(css,/width:56px;height:56px/);assert.match(css,/\.hani-chibi-note\[hidden\]\{display:none!important\}/);assert.match(source,/aria-hidden="true"/);
  assert.match(css,/#monthlyReportChibiNote\{justify-content:flex-start;flex-direction:row-reverse\}/);
  assert.match(css,/@media print\{\.hani-chibi-note\{display:none!important\}\}/);
});
test('raw runtime closure remains 164 files with no missing asset and the existing sheet included',async()=>{
  const root=new URL('../',import.meta.url);const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>read(new URL(f,root))});assert.equal(closure.files.length,164);assert.deepEqual(closure.missing,[]);assert.ok(closure.files.includes('assets/street-journal/chibi-sheet-v1.webp'));
});
