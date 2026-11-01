import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const main=read('hani-main.js'),goal=read('hani-goal-progress.js'),index=read('index.html');
const between=(source,start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const plain=x=>JSON.parse(JSON.stringify(x));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode=x=>x.replace(/&(amp|lt|gt|quot|#39);/g,(_,s)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[s]));

// Minimal tree DOM: setters really destroy descendants, so identity checks detect a repaint.
class Element {
 constructor(tag='div',attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.children=[];this.writes=0;this.value=attrs.value||'';this.defaultValue=this.value;this.hidden='hidden' in attrs;this.open='open' in attrs;this.style={};}
 get dataset(){return Object.fromEntries(Object.entries(this.attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v]));}
 get classList(){const self=this;return { [Symbol.iterator]:function*(){yield* (self.attrs.class||'').split(' ').filter(Boolean)},toggle(){}};}
 setAttribute(k,v){this.attrs[k]=String(v);}
 appendChild(el){el.parentNode=this;this.children.push(el);return el;}
 get textContent(){return this.tagName==='#TEXT'?this.text:this.children.map(x=>x.textContent).join('');}
 set textContent(s){this.children=[];const el=new Element('#text');el.text=String(s);this.appendChild(el);this.writes++;}
 get innerHTML(){return this.children.map(el=>el.tagName==='#TEXT'?esc(el.text):`<${el.tagName.toLowerCase()}${Object.entries(el.attrs).map(([k,v])=>` ${k}="${esc(v)}"`).join('')}>${el.innerHTML}</${el.tagName.toLowerCase()}>`).join('');}
 set innerHTML(html){
  this.writes++;this.children=[];const stack=[this];
  for(const token of String(html).match(/<[^>]*>|[^<]+/g)||[]){
   if(token.startsWith('</')){stack.pop();continue;}
   if(token.startsWith('<')){
    const tag=/^<([\w-]+)/.exec(token)?.[1];if(!tag)continue;
    const attrs={};for(const m of token.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g))attrs[m[1]]=decode(m[2]??m[3]??m[4]??'');
    const el=new Element(tag,attrs);stack.at(-1).appendChild(el);
    if(!['input','img','br','hr','meta','link'].includes(tag)&&!token.endsWith('/>'))stack.push(el);
   }else{const el=new Element('#text');el.text=decode(token);stack.at(-1).appendChild(el);}
  }
  for(const select of this.querySelectorAll('select')){const options=select.querySelectorAll('option');select.value=(options.find(x=>'selected' in x.attrs)||options[0])?.attrs.value||'';}
 }
 matches(selector){
  const tag=/^[\w-]+/.exec(selector)?.[0];if(tag&&this.tagName!==tag.toUpperCase())return false;
  const id=/#([\w-]+)/.exec(selector)?.[1];if(id&&this.attrs.id!==id)return false;
  for(const m of selector.matchAll(/\.([\w-]+)/g))if(!(this.attrs.class||'').split(' ').includes(m[1]))return false;
  for(const m of selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g))if(!(m[1] in this.attrs)||m[2]!==undefined&&this.attrs[m[1]]!==m[2])return false;
  return true;
 }
 querySelectorAll(selector){
  const all=[];const visit=el=>{for(const child of el.children){all.push(child);visit(child)}};visit(this);
  return all.filter(el=>selector.split(',').some(part=>{
   const parts=part.trim().split(/\s+/);if(!el.matches(parts.pop()))return false;
   let parent=el.parentNode;while(parts.length){const part=parts.pop();if(part==='>'){const p=parts.pop();if(!parent?.matches(p))return false;parent=parent.parentNode;}else{while(parent&&!parent.matches(part))parent=parent.parentNode;if(!parent)return false;parent=parent.parentNode;}}return true;
  }));
 }
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 closest(s){return this.matches(s)?this:this.parentNode?.closest(s)||null;}
 contains(el){return !!el&&(el===this||this.children.some(child=>child.contains(el)));}
}
function documentFixture(){
 const root=new Element();root.innerHTML='<div id="goalProgressContent"></div>'+between(index,'<section id="monthlyReport"','    </section>')+'</section>';
 const document={body:{dataset:{view:'monthlyReport'}},activeElement:null,getElementById:id=>root.querySelector('#'+id),querySelector:s=>root.querySelector(s),querySelectorAll:s=>root.querySelectorAll(s)};
 return {root,document,$:id=>document.getElementById(id)};
}
function monthlyContext(){
 const dom=documentFixture();let writes=0,refreshes=0,confirms=0;
 const state={monthlyReports:[],books:[{id:'original',title:'원본'}]};
 const c=vm.createContext({...dom,window:{HANI_GOAL_PROGRESS:{read:()=>null}},state,esc,console,
  monthlyReportMonth:'2026-09',monthlyReportRenderBoard:()=>{},monthlyReportKoreaDate:()=> '2026-11-01',monthlyReportAvailableMonths:()=>['2026-09'],monthlyReportPrevMonth:()=> '2026-10',monthlyReportDate:x=>/^\d{4}-\d{2}-\d{2}$/.test(x)?x:'',monthlyReportSnapshot:()=>({recordCount:1}),formatDateTime:String,
  monthlyReportBuildCurrent:()=>true,save:()=>{writes++;return {ok:true}},dataHubRefresh:async()=>{refreshes++},confirm:()=>{confirms++;return true},toast:()=>{},
  monthlyReportOwners:{finance:{key:'hani',name:'하니',role:'INVESTMENT LEAD'}},agentImages:{hani:'hani.webp'}});
 vm.runInContext(between(main,'function monthlyReportDomainCard(','function monthlyReportRenderBoard(')+between(main,'function monthlyReportStored(','\n\n\nfunction renderAll()'),c);
 c.renderMonthlyReport();
 return {...dom,c,state,get writes(){return writes},get refreshes(){return refreshes},get confirms(){return confirms}};
}
test('blocked generation refreshes once, persists Korean reason through repaint, writes nothing',async()=>{
 const f=monthlyContext(),before=JSON.stringify(f.state);await f.c.monthlyReportGenerate('2026-09');
 assert.equal(f.refreshes,1);assert.equal(f.writes,0);assert.equal(JSON.stringify(f.state),before);
 assert.match(f.$('monthlyReportPending').textContent,/Cloud 연결을 확인한 후 다시 눌러/);
 f.c.renderMonthlyReport();assert.match(f.$('monthlyReportPending').textContent,/Cloud 연결을 확인한 후 다시 눌러/);assert.equal(f.$('monthlyReportPending').hidden,false);
});
test('read, refresh, build and capture exceptions preserve original records and old report',async()=>{
 for(const stage of ['read','refresh','build','capture']){
  const f=monthlyContext();f.state.monthlyReports=[{month:'2026-09',generatedAt:'old',format:1,view:{kpis:[['체중','old','meta']],domains:[],insight:'old'}}];
  f.c.window.HANI_GOAL_PROGRESS.read=()=>stage==='read'?(()=>{throw Error('private raw exception')})():stage==='refresh'?null:[];
  if(stage==='refresh')f.c.dataHubRefresh=async()=>{throw Error('private raw exception')};
  if(stage==='build')f.c.monthlyReportBuildCurrent=()=>{throw Error('private raw exception')};
  if(stage==='capture')f.c.monthlyReportCaptureView=()=>{throw Error('private raw exception')};
  const before=JSON.stringify(f.state);await f.c.monthlyReportGenerate('2026-09');
  assert.equal(f.writes,0,stage);assert.equal(JSON.stringify(f.state),before,stage);assert.match(f.$('monthlyReportPending').textContent,/오류가 발생/);assert.doesNotMatch(f.$('monthlyReportPending').textContent,/private raw/);assert.match(f.$('monthlyReportKpis').textContent,/old/);
 }
 const f=monthlyContext();f.c.window.HANI_GOAL_PROGRESS.read=()=>{throw null};await f.c.monthlyReportGenerate('2026-09');assert.equal(f.writes,0);assert.match(f.$('monthlyReportPending').textContent,/오류가 발생/);
});
test('refresh then success keeps waiting button, blocks double click and preserves format:1 view',async()=>{
 const f=monthlyContext();let resolve,refreshes=0,reads=0;f.c.dataHubRefresh=()=>{refreshes++;return new Promise(r=>resolve=r)};f.c.window.HANI_GOAL_PROGRESS.read=()=>{reads++;return null};
 const pending=f.c.monthlyReportGenerate('2026-09');
 const button=f.$('monthlyReportGenerateBtn');assert.ok('disabled' in button.attrs);assert.match(button.textContent,/확인 중/);
 await f.c.monthlyReportGenerate('2026-09');assert.equal(f.writes,0);
 f.c.window.HANI_GOAL_PROGRESS.read=()=>{reads++;return []};resolve();await pending;
 assert.equal(refreshes,1);assert.equal(reads,2);assert.equal(f.writes,1);assert.equal(f.state.monthlyReports.length,1);assert.equal(f.state.monthlyReports[0].format,1);assert.deepEqual(Object.keys(f.state.monthlyReports[0]).sort(),['format','generatedAt','month','view']);
});
test('false build has persistent reason; regeneration cancellation and failed save preserve old row',async()=>{
 for(const mode of ['blocked','cancel','failed','throw']){
  const f=monthlyContext();f.state.monthlyReports=[{month:'2026-09',generatedAt:'old',format:1,view:{kpis:[],domains:[],insight:'preserve'}}];f.c.window.HANI_GOAL_PROGRESS.read=()=>[];
  if(mode==='blocked')f.c.monthlyReportBuildCurrent=()=>false;
  if(mode==='cancel')f.c.confirm=()=>false;
  if(mode==='failed')f.c.save=()=>({ok:false});
  if(mode==='throw')f.c.save=()=>{throw Error('save exception')};
  const before=JSON.stringify(f.state);await f.c.monthlyReportGenerate('2026-09');assert.equal(JSON.stringify(f.state),before,mode);
  if(mode==='blocked')assert.match(f.$('monthlyReportPending').textContent,/Cloud 연결/);
  if(mode==='failed'||mode==='throw')assert.match(f.$('monthlyReportPending').textContent,/보고서 저장 중 오류/);
  assert.equal(f.writes,0);
 }
});
test('changing month during verification cancels generation and a concurrent report is preserved on success',async()=>{
 for(const changeMonth of [true,false]){
  const f=monthlyContext();let release;f.c.dataHubRefresh=()=>new Promise(r=>release=r);
  const waiting=f.c.monthlyReportGenerate('2026-09');
  const concurrent={month:'2026-08',format:1,generatedAt:'concurrent',view:{kpis:[],domains:[]}};f.state.monthlyReports=[concurrent];
  if(changeMonth)f.c.monthlyReportMonth='2026-08';
  f.c.window.HANI_GOAL_PROGRESS.read=()=>[];release();await waiting;
  assert.equal(f.state.monthlyReports[0],concurrent);assert.equal(f.writes,changeMonth?0:1);assert.equal(f.state.monthlyReports.length,changeMonth?1:2);
 }
});
function goalContext(empty=false){
 const f=monthlyContext();
 const source={books:[],movies:[],exercise:[],body:[],learningQuizzes:[],investmentBrokerSnapshots:[],ledgerMonths:[],goalRegistry:[]};
 if(!empty){source.body=[{date:'2026-09-06',weight:80,bmi:27}];source.goalRegistry=[{goal_id:'bmi',revision:1,metric_id:'body_bmi',goal_type:'quarter',year:2026,quarter:3,value:25,unit:'kg/m²',semantics:'point_target',effective_from:'2026-07-01',effective_to:'2026-09-30',created_at:'2026-07-01T00:00:00+09:00',status:'active'}];}
 let allowed=true;
 f.c.structuredClone=structuredClone;f.c.Intl=Intl;f.c.monthlyReportBoard='quarterly';f.c.goalPeriodReadContext=()=>allowed?{source,asOf:'2026-09-30',evaluationAt:'2026-10-07T00:00:00Z',canonical:{brokerTotal:()=>0,ledgerSpending:()=>0}}:null;
 vm.runInContext(goal,f.c);
 const host=f.$('quarterGoalReport');host.querySelector('[data-report-year]').value='2026';host.querySelector('[data-report-year]').onchange();host.querySelector('[data-report-quarter]').value='3';host.querySelector('[data-report-quarter]').onchange();
 return {...f,source,allow:value=>{allowed=value}};
}
test('quarter/year/settings controls persist; unchanged repaint writes no result markup; summary count and details survive',()=>{
 const f=goalContext(),host=f.$('quarterGoalReport'),select=host.querySelector('[data-report-quarter]'),year=host.querySelector('[data-report-year]'),details=host.parentNode;
 assert.equal(details.tagName,'DETAILS');assert.equal(details.open,false);details.open=true;
 assert.equal(f.document.querySelector('[data-quarter-report-summary]').textContent,'분기 실적 · 목표 비교 · 목표 설정 1/9개');
 const annual=f.$('annualGoalReport'),settings=f.$('goalProgressContent');const settingsSelect=settings.querySelector('#goalProgressQuarter'),annualYear=annual.querySelector('[data-report-year]');
 const slots=[host,annual,settings].map(x=>x.querySelector('[data-period-content]')),counts=slots.map(x=>x.writes);
 f.document.activeElement=select;f.c.window.HANI_GOAL_PROGRESS.render();
 assert.equal(host.querySelector('[data-report-quarter]'),select);assert.equal(select.value,'3');assert.equal(host.querySelector('[data-report-year]'),year);assert.equal(annual.querySelector('[data-report-year]'),annualYear);assert.equal(settings.querySelector('#goalProgressQuarter'),settingsSelect);assert.deepEqual(slots.map(x=>x.writes),counts);assert.equal(details.open,true);
 f.document.activeElement=year;year.value='202';f.c.window.HANI_GOAL_PROGRESS.render();assert.equal(year.value,'202');
 f.allow(false);f.c.window.HANI_GOAL_PROGRESS.render();assert.match(f.document.querySelector('[data-quarter-report-summary]').textContent,/원본 검증 대기/);assert.equal(host.querySelector('[data-report-quarter]'),select);assert.equal(details.open,true);
});
test('guidance input text and focused element survive same and changed facts, including annual',()=>{
 const f=goalContext(),api=f.c.window.HANI_GOAL_PROGRESS;
 const slots=[f.document.querySelector('[data-quarter-goal-guidance]'),f.$('annualGoalReport').querySelector('[data-period-guidance]')];
 for(const slot of slots){
  const input=slot.querySelector('[data-guidance-key]');input.value='123.5';f.document.activeElement=input;
  api.render();assert.equal(slot.querySelector('[data-guidance-key]'),input);assert.equal(input.value,'123.5');
  f.source.body[0].weight+=1;api.render();assert.equal(slot.querySelector('[data-guidance-key]'),input);assert.equal(input.value,'123.5');
  f.document.activeElement=null;api.render();assert.equal(slot.querySelector('[data-guidance-key]').value,'123.5');
 }
 f.allow(false);api.render();f.allow(true);api.render();for(const slot of slots)assert.equal(slot.querySelector('[data-guidance-key]').value,'123.5');
 const slot=slots[0],input=slot.querySelector('[data-guidance-key]');input.value=input.defaultValue;api.render();f.allow(false);api.render();f.allow(true);api.render();assert.equal(slot.querySelector('[data-guidance-key]').value,input.defaultValue,'resetting to the original value clears the remembered draft');
});
test('null metrics invent no number; voices use only each verified metric and archive roundtrip preserves all text',()=>{
 const f=goalContext(true),api=f.c.window.HANI_GOAL_PROGRESS;api.renderMonthly('2026-09');
 const empty=f.c.monthlyReportCaptureView();assert.equal(empty.domains.length,9);
 for(const d of empty.domains){assert.equal(d.empty,true);assert.doesNotMatch(d.comment,/\d/);assert.match(d.comment,/오빠/);assert.doesNotMatch(d.comment,/Data Hub|확정 결산/);assert.equal(d.metrics[0][1],'기록 없음');}
 f.source.body=[{date:'2026-09-06',weight:80,bmi:27,fat:21}];f.source.books=[{status:'read',completedDate:'2026-09-03'}];f.source.exercise=[{date:'2026-09-05',steps:9000}];f.source.learningQuizzes=[{status:'completed',completedAt:'2026-09-02T00:00:00Z',total:30,correctCount:15}];api.renderMonthly('2026-09');
 const view=plain(f.c.monthlyReportCaptureView());
 for(const d of view.domains){assert.match(d.comment,/오빠/);assert.doesNotMatch(d.comment,/Data Hub 및 기간 보고서와 같은|전월|지난달|확정 결산/);assert.match(d.basis,/확정 결산/);assert.deepEqual(d.metrics[1],['월간 목표','설정 안 함']);}
 assert.match(view.domains.find(d=>d.title==='신체').comment,/80kg/);assert.match(view.domains.find(d=>d.title==='학습').comment,/50%/);
 for(const [, ,meta] of view.kpis)assert.equal(meta,'2026-09 기록 기준');
 f.c.monthlyReportPresentStored({format:1,view});assert.deepEqual(plain(f.c.monthlyReportCaptureView()),view);
 const old={kpis:[['생활 지출','old value','old meta']],insightTitle:'old title',insight:'old insight',domains:[{tone:'money',eyebrow:'MONEY',title:'소비',empty:false,headline:'old headline',comment:'이전 보고서 한마디',basis:'old basis',metrics:[['old','old']]}]};
 f.c.monthlyReportPresentStored({format:1,view:old});assert.deepEqual(plain(f.c.monthlyReportCaptureView()),old);assert.match(f.$('monthlyReportKpis').innerHTML,/tone-money/);
});
test('each metric voice depends on its own value; KPI tones derive from saved labels and have AA contrast',()=>{
 const f=goalContext();f.c.window.HANI_GOAL_PROGRESS.renderMonthly('2026-09');const before=plain(f.c.monthlyReportCaptureView());f.source.body[0].weight=81;f.c.window.HANI_GOAL_PROGRESS.renderMonthly('2026-09');const after=plain(f.c.monthlyReportCaptureView());
 for(let i=0;i<before.domains.length;i++)if(before.domains[i].title!=='신체')assert.equal(after.domains[i].comment,before.domains[i].comment);
 const css=read('hani-design-system.css');const luminance=hex=>hex.match(/\w\w/g).map(h=>parseInt(h,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 for(const [tone,label] of [['finance','투자자산'],['money','월 지출 예산'],['health','체중'],['activity','일평균 걸음'],['culture','완독'],['learning','퀴즈 정답률']]){
  const color=new RegExp('monthly-report-kpi\\)\\.tone-'+tone+'\\{--report-tone:#([a-f0-9]{6})').exec(css)?.[1];assert.ok(color,tone);
  for(const bg of ['171f31','121929'])assert.ok((luminance(color)+.05)/(luminance(bg)+.05)>=4.5,tone+' AA');
  f.c.monthlyReportPresentStored({view:{kpis:[[label,'v','m']],domains:[]}});assert.match(f.$('monthlyReportKpis').innerHTML,new RegExp('tone-'+tone));
 }
});
test('quarterly keynote precedes a closed details; library/movie trends remain and monthly render never calls the trend',()=>{
 const f=documentFixture(),actual=f.document.querySelector('[data-quarter-panel="actual"]');const elements=actual.children.filter(x=>x.tagName!=='#TEXT');
 assert.equal(elements[0].attrs.class,'monthly-report-future-head');assert.equal(elements[1].attrs.id,'earningsQuarterly');assert.equal(elements[2].tagName,'DETAILS');assert.equal(elements[2].open,false);assert.equal(elements[2].querySelector('#quarterGoalReport')?.tagName,'DIV');
 assert.equal(f.$('monthlyReadingActivityTrend'),null);assert.match(index,/id="readingActivityTrend"/);assert.match(index,/id="movieActivityTrend"/);
 assert.doesNotMatch(between(main,'function renderMonthlyReport(){','\n\n\nfunction renderAll()'),/renderActivityTrend/);
});
