// Run directly with node: this suite needs no browser, subprocess, network or user data.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {createHistoryHarness} from './hani-history-226.test.mjs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const main=read('hani-main.js'),html=read('index.html'),css=read('hani-design-system.css');
const cut=(s,a,b)=>{const x=s.indexOf(a),y=s.indexOf(b,x);assert.ok(x>=0&&y>x,a);return s.slice(x,y);};
const plain=x=>JSON.parse(JSON.stringify(x));
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const deny=()=>{throw Error('read-only owner attempted a write');};
const guard={save:deny,commit:deny,localStorage:{setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny},cloudClient:new Proxy({},{get:deny})};
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rosterContext={window:{},document:{getElementById:()=>null,querySelectorAll:()=>[]},...guard};
vm.runInNewContext(read('hani-organization-hub.js'),rosterContext);
const roster=rosterContext.window.HaniOrganizationRoster;
const alias=k=>({nauen:'naeun',suyeon:'sooyeon',doyeon:'dohyun'})[k]||k;
class HealthDate extends Date{constructor(...args){super(...(args.length?args:['2026-11-01T03:00:00Z']));}}
const health=vm.createContext({...guard,esc,Date:HealthDate,today:()=> '2026-11-01'});
const dailyOwner=cut(main,'function monthlyReportDaily(', 'function monthlyReportPrevMonth(');
vm.runInContext(dailyOwner,health);
vm.runInContext(cut(main,'function careKoreaPeriod(', 'function dietPaceMarkup(')+cut(main,'function healthRecordDay(', 'function renderDietPace('),health);
const period=health.careKoreaPeriod(new Date('2026-11-01T03:00:00Z'));
const goal=(value=80,extra={})=>({metric_id:'body_weight_kg',value,status:'active',year:2026,quarter:4,goal_type:'quarter',effective_from:'2026-10-01',effective_to:'2026-12-31',created_at:'2026-09-30T03:00:00Z',revision:1,...extra});
const journey=(weights,goals=[goal()],height=180)=>health.weightJourneyData(freeze(weights.map((weight,i)=>({weight,date:['2026-10-01','2026-10-20','2026-11-01'][i]}))),freeze(goals),height,period);

test('QA-2: persistent actions precede closed news; only ilbo and milestones stay inside',()=>{
  const block=cut(html,'      <details class="home-news"','      <button class="home-yuna-quick"');
  assert.match(block,/<summary>오늘의 소식/);assert.doesNotMatch(block,/<details[^>]+\bopen\b/);
  for(const token of ['data-ilbo-home','data-milestone-home']){assert.equal(html.split(token).length-1,1);assert.ok(block.includes(token));}
  const actions=cut(html,'      <div id="homeActions"','      <details class="home-news"');
  assert.match(actions,/id="settlementQuickCheck"/);assert.doesNotMatch(block,/settlementQuickCheck|homeActions/);
  assert.equal(html.split('id="settlementQuickCheck"').length-1,1);
  assert.ok(html.indexOf('id="lifeTicker"')<html.indexOf('id="homeActions"'));
  assert.ok(html.indexOf('id="homeDialogueText"')<html.indexOf('id="homeNews"'));
});

test('QA-2: real count and alert owner preserve live buttons on repeated renders and collapse',()=>{
  const link={dataset:{haniCareView:'investmentCommittee'}},slot={dataset:{},children:[{hidden:false}],querySelectorAll:s=>s==='[data-hani-care-view]'?[link]:[],hasAttribute:k=>k==='data-hani-care-cards'};
  const ilbo={hidden:false,hasAttribute:()=>false},milestone={hidden:false,hasAttribute:()=>false},host={children:[ilbo,milestone],querySelector:()=>slot},count={},empty={};
  const nodes={homeNewsItems:host,homeNewsCount:count,homeNewsEmpty:empty};let route;
  const c=vm.createContext({...guard,$:id=>nodes[id],window:{HaniInvestmentResearchCore:{committeeProgress:()=>({reminder:true,researchDone:false})}},state:freeze({}),careKoreaPeriod:()=>period,careCampusGroups:()=>[],campusAssignments:()=>[],certificateCareSorted:()=>[],showView:v=>route=v});
  vm.runInContext(cut(main,'function renderHaniCareCards(', 'function renderHaniCareHome('),c);
  c.renderHaniCareCards(host);const markup=slot.innerHTML,click=link.onclick;
  c.updateHomeNewsCount();assert.equal(count.textContent,'2건');assert.equal(empty.hidden,true);
  const details={open:false};for(const open of [true,false,true]){details.open=open;c.renderHaniCareCards(host);c.updateHomeNewsCount();assert.equal(slot.innerHTML,markup);assert.equal(link.onclick,click);link.onclick();assert.equal(route,'investmentCommittee');}
  for(const node of host.children)node.hidden=true;c.updateHomeNewsCount();assert.equal(count.textContent,'0건');assert.equal(empty.hidden,false);
  assert.match(cut(main,'function renderHaniCareHome(', 'function renderHome('),/renderHaniCareCards\(actions,/);
});

test('QA-2: actual ilbo home button, milestone navigation and asynchronous count hook remain reachable',()=>{
  let route,count=0;const button={},card={querySelector:()=>button};
  const c=vm.createContext({...guard,document:{querySelector:()=>card},entries:freeze([{date:'2026-11-01',number:1}]),seenDate:'',koreaDate:()=> '2026-11-01',VIEW:'ilbo',showView:v=>route=v,updateHomeNewsCount:()=>count++});
  vm.runInContext('let selected=null;'+cut(read('hani-ilbo.js'),'  function homeCard(', '  function bindImage('),c);
  c.homeCard();button.onclick();assert.equal(route,'ilbo');assert.match(card.innerHTML,/data-ilbo-open/);assert.equal(count,1);
  let milestoneClick;
  const m={window:{},...guard,showView:v=>route=v,document:{readyState:'complete',getElementById:()=>null,querySelector:()=>null,addEventListener:(type,fn)=>{if(type==='click')milestoneClick=fn;}}};vm.runInNewContext(read('hani-milestones.js'),m);
  assert.match(m.window.HaniMilestones.homeCardMarkup(m.window.HaniMilestones.SEED[0]),/data-ms-home-open/);
  milestoneClick({target:{closest:()=>true}});assert.equal(route,'milestones');
  assert.match(read('hani-milestones.js'),/if \(typeof updateHomeNewsCount === 'function'\) updateHomeNewsCount\(\)/);
  assert.match(read('hani-milestones.js'),/event.target.closest\('\[data-ms-home-open\],\.ms-home-face'\)[^\n]+showView\(VIEW\)/);
});

test('QA-2: existing alert and settlement links all navigate after grouping; dismiss refreshes count',()=>{
  const routes=[],buttons=['investmentCommittee','university','certificate'].map(haniCareView=>({dataset:{haniCareView}}));
  const care={dataset:{},querySelectorAll:s=>s==='[data-hani-care-view]'?buttons:[]};
  const c=vm.createContext({...guard,window:{HaniInvestmentResearchCore:{committeeProgress:()=>({reminder:true})}},state:freeze({}),careKoreaPeriod:()=>period,careCampusGroups:()=>[],campusAssignments:()=>[{id:'fixture'}],campusAssignmentMarkup:()=>'<p>synthetic assignment</p>',certificateCareSorted:()=>[{name:'fixture',examDate:'2026-11-02'}],certificateDays:()=>1,certificateDday:()=> 'D-1',esc,showView:v=>routes.push(v)});
  vm.runInContext(cut(main,'function renderHaniCareCards(', 'function updateHomeNewsCount('),c);
  c.renderHaniCareCards({querySelector:()=>care});
  for(const button of buttons){assert.ok(care.innerHTML.includes('data-hani-care-view="'+button.dataset.haniCareView+'"'));button.onclick();}
  assert.deepEqual(routes,['investmentCommittee','university','certificate']);
  const checks=['ledger','investment','settings'].map(go=>({go,label:go,detail:'fixture'})),links=checks.map(x=>({dataset:{checkGo:x.go}})),slot={querySelectorAll:()=>links};
  c.$=id=>id==='settlementQuickCheck'?slot:null;c.today=()=> '2026-11-18';c.settlementCheckModel=()=>({visible:true,month:'2026-11',items:checks});
  vm.runInContext(main.match(/function renderSettlementCheck\([\s\S]*?\n}/)[0],c);c.renderSettlementCheck();
  for(const link of links)link.onclick();assert.deepEqual(routes.slice(3),checks.map(x=>x.go));
  const close={},notice={hidden:false,querySelector:()=>close},memory={};let counts=0;
  Object.assign(c,{haniCareMemory:()=>memory,haniCareNeedsInstall:()=>true,document:{createElement:()=>notice},updateHomeNewsCount:()=>counts++});
  vm.runInContext(main.split('\n').find(l=>l.startsWith('function haniCareNotice(')),c);
  c.haniCareNotice({insertBefore(){}},null,'homeNotice');close.onclick();
  assert.equal(memory.dismissed,true);assert.equal(notice.hidden,true);assert.equal(counts,1);
});

const poolContext=vm.createContext({});vm.runInContext(cut(main,'const HOME_DIALOGUES=[','function renderHomeDialogue(')+';this.rows=HOME_DIALOGUES;',poolContext);
test('한마디: no duplicate text, every speaker resolves to roster, 19 fresh voices in canon',()=>{
  const lines=poolContext.rows.flatMap(r=>[r.text,...r.chat.map(c=>c.text)]);assert.equal(new Set(lines).size,lines.length);
  for(const r of poolContext.rows)for(const key of [r.agent,...r.chat.map(c=>c.agent)])assert.ok(roster.people.some(p=>p.id===alias(key)),key);
  const fresh=poolContext.rows.slice(-19);assert.equal(new Set(fresh.map(r=>alias(r.agent))).size,roster.people.length);
  for(const r of fresh){const p=roster.people.find(p=>p.id===alias(r.agent));assert.ok(r.kind.includes(p.rank));assert.doesNotMatch(r.text,/몸|체중|얼굴|외모|예쁘|매수|매도|수익률/);assert.ok(r.text.length<100);}
});

test('한마디: real renderer pairs every selected line with canonical title; repeat avoidance remains',()=>{
  const nodes=Object.fromEntries(['homeDialogueText','homeDialogueSpeaker','homeDialogueAvatar','homeDialogueLabel','homeDialogueChat','homeDialogueNext'].map(id=>[id,{style:{},dataset:{}}]));
  const c=vm.createContext({...guard,window:{HaniOrganizationRoster:roster},$:id=>nodes[id],teamByKey:()=>({name:'BAD FALLBACK'}),sidebarAgentImages:{},agentImages:{},agentArray:a=>a,esc});
  vm.runInContext(cut(main,'function renderHomeDialogue(', 'function homeCalendarHtml('),c);
  for(const row of poolContext.rows){c.pickHomeDialogue=()=>row;c.renderHomeDialogue();const p=roster.people.find(p=>p.id===alias(row.agent));assert.equal(nodes.homeDialogueSpeaker.textContent,p.name+' '+p.rank);assert.equal(nodes.homeDialogueText.textContent,'“'+row.text+'”');for(const chat of row.chat){const p=roster.people.find(p=>p.id===alias(chat.agent));assert.ok(nodes.homeDialogueChat.innerHTML.includes(p.name+' '+p.rank));}}
  const first=poolContext.pickHomeDialogue();assert.equal(poolContext.pickHomeDialogue(),first);for(let i=0;i<80;i++){const before=poolContext.pickHomeDialogue();assert.notEqual(poolContext.pickHomeDialogue(true),before);}
});

test('QA-5: actual overview headcount follows roster, excluding planned staff; no fixed total',()=>{
  for(const people of [roster.people,roster.people.slice(0,2),[...roster.people,{id:'future',status:'planned',registration:'planned'}]]){
    const f=createHistoryHarness({people});f.render();const label={};f.nodes['[data-ogh-staff-count]']=label;f.render();
    assert.equal(label.textContent,`함께하는 AI 직원 ${people.filter(p=>p.status!=='planned'&&p.registration!=='planned').length}명 · 전체 명단은 조직도에서 만나요.`);
    assert.match(f.slot.markup,/ogh-hero-art[^]*hani-team-office.webp/);assert.doesNotMatch(f.slot.markup,/ogh-demo-card|hani-group-company-profile-v1.webp/);assert.deepEqual(f.writes,[]);
  }
});

function comicRuntime(catalog){
  const nodes=new Map(),el=()=>({hidden:false,children:[],attrs:{},classList:{toggle(){}},append(...a){this.children.push(...a);},replaceChildren(...a){this.children=a;},setAttribute(k,v){this.attrs[k]=v;},get childElementCount(){return this.children.length;}});
  const slot={...el(),querySelector:s=>{if(!nodes.has(s))nodes.set(s,el());return nodes.get(s);}};
  class FixedDate extends Date{constructor(...a){super(...(a.length?a:['2026-11-01T03:00:00Z']));}}
  const c={...guard,window:{},Date:FixedDate,URL,document:{body:{dataset:{view:'newsroom'}},querySelector:()=>slot,createElement:el},fetch:async()=>({ok:true,json:async()=>catalog})};
  vm.runInNewContext(read('hani-newsroom-4cut.js'),c);return {api:c.window.HaniNewsroom4cut,nodes};
}
test('QA-10: published issue supplies summary + 4 indices; no next-week schedule invented',async()=>{
  const catalog=JSON.parse(read('assets/data/newsroom-4cut/issues.json')),f=comicRuntime(catalog);await f.api.enter();
  const p=f.api.issuePanels(catalog.issues[0]);assert.equal(p.summary,catalog.issues[0].title);assert.deepEqual(plain(p.indices),[{name:'코스피',close:'5,730.74',change:'3.25% 상승'},{name:'코스닥',close:'724.38',change:'3.63% 하락'},{name:'S&P500',close:null,change:'0.57% 하락'},{name:'나스닥',close:null,change:'2.00% 하락'}]);
  assert.equal(f.nodes.get('.newsroom-4cut-context').children.length,2);
  const image=f.nodes.get('.newsroom-4cut-image');await f.api.enter();assert.equal(f.nodes.get('.newsroom-4cut-image'),image);
});
test('QA-10: missing numeric data omits table; absent summary omits context; unsafe text remains text',async()=>{
  const issue={number:1,publishDate:'2026-11-01',week:'fixture',title:'<img src=x>',alt:'수치 없는 테스트',image:'001',sources:[]};
  const f=comicRuntime({issues:[issue]});await f.api.enter();const panel=f.nodes.get('.newsroom-4cut-context');assert.equal(panel.children.length,1);assert.equal(panel.children[0].children[1].textContent,issue.title);
  assert.equal(f.api.issuePanels({}).indices.length,0);assert.equal(f.api.issuePanels({}).summary,'');
  assert.equal(f.api.issuePanels({alt:'코스피는 5% 올랐다. 종가는 모름'}).indices.length,0);
  // Invoke the actual panel renderer to cover the fully absent-data branch too.
  const c={document:{createElement:()=>{throw Error('empty must not create panels');}},issuePanels:f.api.issuePanels};vm.runInNewContext(cut(read('hani-newsroom-4cut.js'),'  function renderIssuePanels(', '  function render()'),c);c.renderIssuePanels(panel,{});assert.equal(panel.children.length,0);assert.equal(panel.hidden,true);
});

test('QA-11: down/up goals, exact arrival, overshoot, wrong direction and start=target',()=>{
  assert.equal(journey([100,90]).percent,50);assert.equal(journey([100,80]).reached,true);assert.equal(journey([100,75]).percent,100);
  const away=journey([100,105]);assert.equal(away.percent,0);assert.equal(away.away,true);assert.equal(away.reached,false);assert.match(health.weightJourneyMarkup(away),/멀어져/);
  assert.equal(journey([70,75],[goal(80)]).percent,50);assert.equal(journey([70,81],[goal(80)]).reached,true);
  assert.equal(journey([80,80]).reached,true);assert.equal(journey([80,80]).percent,null);assert.equal(journey([80,81]).percent,null);assert.equal(journey([80,81]).reached,false);
  assert.match(health.weightJourneyMarkup(journey([100,80])),/🏅 승인 목표 달성/);assert.doesNotMatch(health.weightJourneyMarkup(away),/🏅/);
});
test('QA-11: missing/invalid data, no approved target, BMI conversion, effective dates',()=>{
  assert.equal(journey([],[]),null);assert.equal(journey([100,null],[]).current,100);assert.equal(journey(['',NaN,-1]),null);
  assert.equal(journey([100,90],[]).percent,null);assert.doesNotMatch(health.weightJourneyMarkup(journey([100,90],[])),/<progress|0%/);
  assert.equal(journey([100,90],[goal(25,{metric_id:'body_bmi'})],200).target,100);
  assert.equal(journey([100,90],[goal(25,{metric_id:'body_bmi'})],null).target,null);
  for(const extra of [{status:'draft'},{effective_from:'2026-11-02'},{effective_to:'2026-10-31'},{created_at:'2026-11-02T00:00:00Z'}])assert.equal(journey([100,90],[goal(80,extra)]).target,null);
  const rows=freeze([{date:'2026-09-30',weight:100},{date:'2026-10-20',weight:90},{date:'2026-11-02',weight:1}]);const result=health.weightJourneyData(rows,freeze([goal()]),180,period);assert.equal(result.startDate,'2026-09-30');assert.equal(result.current,90);
});
test('QA-11: calendar retains empty vs explicit zero; real threshold bins, leap month and text alternative',()=>{
  const rows=freeze([{date:'2026-11-01',steps:0},{date:'2026-11-02',steps:null},{date:'2026-11-03',steps:4999},{date:'2026-11-04',steps:5000},{date:'2026-11-05',steps:10000},{date:'2026-11-06',steps:-1},{date:'2026-11-07',steps:''},{date:'invalid',steps:99}]);
  const before=JSON.stringify(rows),m=health.stepCalendarData(rows,'month','2026-11-08');assert.equal(m[0].days.length,30);assert.equal(m[0].offset,0);
  assert.deepEqual(plain(m[0].days.slice(0,7).map(d=>[d.steps,d.level])),[[0,'zero'],[null,'empty'],[4999,'low'],[5000,'mid'],[10000,'high'],[null,'empty'],[null,'empty']]);
  const markup=health.stepCalendarMarkup(m);assert.match(markup,/2026-11-01 · 0보/);assert.match(markup,/2026-11-02 · 미기록/);assert.match(markup,/<summary>날짜별 걸음 텍스트로 보기/);assert.match(markup,/10,000보 이상/);assert.equal(JSON.stringify(rows),before);
  assert.equal(health.stepCalendarData([],'month','2024-02-29')[0].days.length,29);assert.equal(health.stepCalendarData([],'year').length,12);assert.equal(health.stepCalendarData([],'all').length,0);
  for(const mode of ['month','year','all'])assert.match(health.stepCalendarMarkup(health.stepCalendarData([],mode,'2026-11-01')),/표시할 걸음 기록이 없어요/);assert.equal(health.stepCalendarData([{date:'2026-11-02',steps:100}],'month')[0].days[1].steps,null);
});

test('QA-11: actual body and exercise owners update the same slots without state or storage writes',()=>{
  const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);};
  const state=freeze({body:[{id:'a',date:'2026-10-01',weight:100},{id:'b',date:'2026-11-01',weight:80}],goalRegistry:[goal()],profile:{heightCm:180},goals:{weight1:90,weight2:80},ui:{exercisePeriod:'month'},exercise:[{id:'s',date:'2026-11-01',steps:5000,distance:3}]});
  const before=JSON.stringify(state),noop=()=>{};
  const c=vm.createContext({...guard,state,$:get,esc,n:x=>Number(x)||0,num:String,window:{},document:{querySelectorAll:()=>[]},today:()=> '2026-11-01',careKoreaPeriod:()=>period,careApprovedGoals:health.careApprovedGoals,renderDietPace:noop,bodyPeriodRows:a=>a,exercisePeriodRows:a=>a,lifePeriodLabel:()=> 'fixture',lifePeriodBasis:()=> 'fixture',uiPageSlice:(k,rows)=>({rows}),uiPageSize:()=>8,uiMountPagination:noop,BODY_METRICS:{},recordIdAttributes:()=>'',bodyMetric:String,renderBodyMetricStats:noop,drawBody:noop,dataHubRenderDashboard:noop,exerciseChanged:new Set(['fixture']),drawExercise:noop});
  vm.runInContext(dailyOwner+cut(main,'function healthRecordDay(', 'function renderDietPace(')+cut(main,'function renderBody(){','function renderBodyMetricStats(')+cut(main,'function renderExercise(){','function drawExercise('),c);
  c.renderBody();c.renderExercise();const weightSlot=get('bodyJourney'),stepSlot=get('exerciseStepCalendar');
  assert.match(weightSlot.innerHTML,/🏅 승인 목표 달성/);assert.match(get('dietStats').innerHTML,/journey-target/);assert.match(get('dietStats').innerHTML,/journey-change/);
  assert.match(stepSlot.innerHTML,/2026-11-01 · 5,000보/);assert.match(stepSlot.innerHTML,/2026-11-02 · 미기록/);
  c.renderBody();c.renderExercise();assert.equal(get('bodyJourney'),weightSlot);assert.equal(get('exerciseStepCalendar'),stepSlot);assert.equal(JSON.stringify(state),before);
});

const lum=rgb=>rgb.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const rgb=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16));
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
test('AA: all six theme surfaces, health colours and translucent banner worst-case pixels',()=>{
  const healthColours=css.match(/#diet,#exercise\{([^}]+)}/)[1],darkColours=css.match(/\[data-finish="titanium-graphite"\]\) :is\(#diet,#exercise\)\{([^}]+)}/)[1];
  const palette=rule=>[...rule.matchAll(/--journey-\w+:(#[\da-f]{6})/g)].map(m=>m[1]);
  for(const finish of ['porcelain-cream','pure-white','sakura-pink','alpine-blue','midnight-black','titanium-graphite']){
    const tokens={};for(const [,sel,body] of css.matchAll(/([^{}]+)\{([^{}]+)\}/g))if(sel.includes('.login-design-choice[data-design="'+finish+'"]'))for(const [,k,v] of body.matchAll(/(--[\w-]+):(#[\da-f]{6})/g))tokens[k]=v;
    const dark=/black|graphite/.test(finish),colours=palette(dark?darkColours:healthColours);assert.equal(colours.length,3);
    for(const bg of ['--surface-panel','--surface-raised'])for(const fg of [...colours,tokens['--text-primary'],tokens['--text-secondary']])assert.ok(ratio(rgb(fg),rgb(tokens[bg]))>=4.5,finish+' '+fg+'/'+tokens[bg]);
  }
  for(const bg of ['#edf5ef','#b8dfc6'])assert.ok(ratio(rgb('#17271f'),rgb(bg))>=4.5);assert.ok(ratio(rgb('#fffFFF'),rgb('#256447'))>=4.5);
  // .94 white box over every possible grayscale channel, including a black image pixel.
  const orgCss=read('hani-organization-hub.css');
  assert.match(orgCss,/:root #haniOrganizationHub \.ogh-hero \.ogh-hero-copy h1 em\{color:#334fa7}/,'white-box emphasis outranks the existing dark-theme selector');
  assert.match(orgCss,/\.ogh-hero-copy\{[^}]*background:rgba\(255,255,255,\.94\)/);
  for(let pixel=0;pixel<=255;pixel++)for(const fg of ['#111c32','#33415a','#334fa7'])assert.ok(ratio(rgb(fg),[0,0,0].map(()=>255*.94+pixel*.06))>=4.5,fg);
  assert.ok(ratio(rgb('#ffffff'),rgb('#111c32'))>=4.5);
});
test('release closure still exactly 128, no missing files or newly packaged image',async()=>{
  const result=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL('../'+f,import.meta.url)),read});assert.ok(result.files.length<=200);assert.deepEqual(result.missing,[]);
  assert.equal(createHash('sha256').update(result.files.join('\n')).digest('hex'),'8a5f748a13fd729f35db0e48727090c82a605c87da98cf10dccac6c8a8feca64','same 128-file closure as task base 9b50d16');
  assert.ok(result.files.includes('assets/team/hani-team-office.webp'));
  // This published image is dynamically resolved by the original comic owner,
  // so the static closure walker cannot see it. Keep its original catalog id.
  assert.equal(JSON.parse(read('assets/data/newsroom-4cut/issues.json')).issues[0].image,'001');
  assert.ok(fs.existsSync(new URL('../assets/newsroom-4cut/001.webp',import.meta.url)));
});

// qa-b8: exercise the existing owners with synthetic DOM/state, no new runtime layer.
class HomeElement{
  constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.hidden=false;this.attrs={};this.style={};this.classList={add(){},remove(){},toggle(){}};this._markup='';}
  get firstChild(){return this.children[0]||null;}
  get nextSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)+1]||null;}
  insertBefore(node,before){if(node.parentNode){const siblings=node.parentNode.children;siblings.splice(siblings.indexOf(node),1);}const i=before?this.children.indexOf(before):this.children.length;assert.ok(i>=0,'valid insertion anchor');this.children.splice(i,0,node);node.parentNode=this;return node;}
  setAttribute(k,v){this.attrs[k]=v;}
  hasAttribute(k){return Object.hasOwn(this.attrs,k)||k==='data-hani-care-cards'&&Object.hasOwn(this.dataset,'haniCareCards');}
  set innerHTML(value){this._markup=value;this._buttons=null;}
  get innerHTML(){return this._markup;}
  querySelector(selector){if(selector===':scope > [data-hani-care-cards]')return this.children.find(x=>x.hasAttribute('data-hani-care-cards'))||null;if(selector==='button')return (this._close??=new HomeElement('button'));return null;}
  querySelectorAll(selector){
    const key=({'[data-hani-care-view]':'haniCareView','[data-check-go]':'checkGo'})[selector];if(!key)return [];
    const attr=key==='haniCareView'?'data-hani-care-view':'data-check-go';this._buttons??={};
    return this._buttons[key]??=(Array.from(this.innerHTML.matchAll(new RegExp(attr+'="([^"]+)"','g')),m=>{const el=new HomeElement('button');el.dataset[key]=m[1];return el;}));
  }
}
function homeOwners(){
  const nodes=Object.fromEntries(['home','homeActions','homeNews','homeNewsItems','homeNewsCount','homeNewsEmpty','settlementQuickCheck'].map(id=>[id,new HomeElement()]));
  nodes.home.insertBefore(nodes.homeActions,null);nodes.home.insertBefore(nodes.homeNews,null);nodes.homeNews.open=false;
  nodes.homeNews.insertBefore(nodes.homeNewsItems,null);nodes.homeActions.insertBefore(nodes.settlementQuickCheck,null);
  const ilbo=new HomeElement('aside'),milestone=new HomeElement('aside');ilbo.hidden=milestone.hidden=true;
  nodes.homeNewsItems.insertBefore(ilbo,null);nodes.homeNewsItems.insertBefore(milestone,null);
  const routes=[],model={checklist:null,install:true,settlement:false};
  const c=vm.createContext({...guard,esc,window:{},state:{},$:id=>nodes[id]||null,today:()=> '2026-11-18',careKoreaPeriod:()=>period,careCampusGroups:()=>[],campusAssignments:()=>[],certificateCareSorted:()=>[],haniCareNeedsInstall:()=>model.install,haniCareChecklist:()=>model.checklist,settlementCheckModel:source=>({visible:model.settlement,month:'2026-11',items:[{label:'월간보고서',detail:source.monthlyReports?.length?'반영 기록 있음':'기록 확인 필요',go:'monthlyReport'}]}),showView:id=>routes.push(id),document:{createElement:tag=>new HomeElement(tag),querySelector:()=>null,querySelectorAll:()=>[],body:{dataset:{}}}});
  vm.runInContext(cut(main,'function haniCareMemory(', 'function haniCareNeedsInstall(')+main.split('\n').find(l=>l.startsWith('function haniCareNotice('))+cut(main,'function renderHaniCareCards(', 'function renderHome(')+cut(main,'function renderSettlementCheck(', 'function renderReading('),c);
  return {c,nodes,ilbo,milestone,model,routes};
}

test('qa-b8 HIGH: storage warning stays visible above closed news; persistent actions and empty slot collapse',()=>{
  const f=homeOwners(),{c,nodes,model}=f;model.checklist={items:[{done:false}]};model.settlement=true;
  c.renderHaniCareHome();const memory=c.haniCareMemory(),notice=memory.homeNotice,chip=memory.checklistChip,care=nodes.homeActions.querySelector(':scope > [data-hani-care-cards]');
  assert.equal(nodes.homeNews.open,false);assert.equal(notice.parentNode,nodes.homeActions);assert.equal(notice.hidden,false);
  assert.equal(chip.parentNode,nodes.homeActions);chip.onclick();assert.deepEqual(f.routes,['tasks']);
  assert.equal(nodes.settlementQuickCheck.hidden,false);nodes.settlementQuickCheck.querySelectorAll('[data-check-go]')[0].onclick();assert.equal(f.routes.at(-1),'monthlyReport');
  assert.equal(nodes.homeNewsItems.children.length,2);assert.equal(nodes.homeNewsCount.textContent,'0건');assert.equal(nodes.homeNewsEmpty.hidden,false);
  f.ilbo.hidden=f.milestone.hidden=false;c.renderHaniCareHome();assert.equal(nodes.homeNewsCount.textContent,'2건');
  assert.equal(c.haniCareMemory().homeNotice,notice);assert.equal(nodes.homeActions.querySelector(':scope > [data-hani-care-cards]'),care);
  const close=notice.querySelector('button').onclick;close();assert.equal(notice.hidden,true);assert.equal(nodes.homeNewsCount.textContent,'2건');
  model.settlement=false;model.checklist=null;c.renderHaniCareHome();assert.ok(nodes.homeActions.children.every(x=>x.hidden));
  assert.match(css,/#home #homeActions:not\(:has\(> :not\(\[hidden\]\)\)\)\{display:none}/);assert.match(css,/#home #homeActions\{[^}]*margin:0;padding:0/);
  assert.doesNotMatch(cut(main,'function renderHaniCareHome(', 'function renderHome('),/createElement\(['"]details|addEventListener/);
});

test('qa-b8 HIGH: exact-start, all-before-effective and unknowable directions never contradict progress',()=>{
  const from=rows=>health.weightJourneyData(freeze(rows),freeze([goal(70)]),180,period);
  const same=from([{date:'2026-10-01',weight:70},{date:'2026-10-15',weight:69}]);
  assert.equal(same.percent,null);assert.equal(same.reached,false);assert.equal(same.away,false);assert.doesNotMatch(health.weightJourneyMarkup(same),/<progress|🏅|멀어져/);
  const before=from([{date:'2026-09-10',weight:80},{date:'2026-09-25',weight:70}]);
  assert.equal(before.percent,null);assert.equal(before.reached,false);assert.equal(before.away,false);assert.equal(before.target,70);
  const unknown=from([{date:'2026-09-25',weight:68},{date:'2026-10-15',weight:67}]);
  assert.equal(unknown.direction,0);assert.equal(unknown.percent,null);assert.equal(unknown.away,false);
  const markup=health.weightJourneyMarkup(unknown);assert.match(markup,/68\.00kg/);assert.match(markup,/67\.00kg/);assert.match(markup,/70\.00kg/);assert.doesNotMatch(markup,/<progress|🏅/);
});

test('qa-b8 HIGH: approved metric history and measurements keep loss/gain direction after crossing',()=>{
  const history=[goal(80,{effective_from:'2026-09-01',effective_to:'2026-09-30',created_at:'2026-08-30T03:00:00Z',quarter:3,status:'superseded'}),goal(70)];
  const rows=freeze([{date:'2026-09-25',weight:68},{date:'2026-10-15',weight:67}]);
  const loss=health.weightJourneyData(rows,freeze(history),180,period);assert.equal(loss.direction,-1);assert.equal(loss.reached,true);assert.equal(loss.percent,100);assert.equal(loss.away,false);
  const down=health.weightJourneyData(freeze([{date:'2026-09-25',weight:80},{date:'2026-10-01',weight:70},{date:'2026-10-15',weight:69}]),freeze([goal(70)]),180,period);
  assert.equal(down.percent,100);assert.equal(down.reached,true);assert.equal(down.away,false);
  const up=health.weightJourneyData(freeze([{date:'2026-09-25',weight:60},{date:'2026-10-01',weight:70},{date:'2026-10-15',weight:71}]),freeze([goal(70)]),180,period);
  assert.equal(up.direction,1);assert.equal(up.percent,100);assert.equal(up.away,false);
  const crossed=health.weightJourneyData(freeze([{date:'2026-09-20',weight:80},...rows]),freeze([goal(70)]),180,period);
  assert.equal(crossed.direction,-1);assert.equal(crossed.reached,true);assert.equal(crossed.away,false);
  // Broad invariant across exact/crossed/unknown baselines, both directions and stale records.
  for(const initial of [60,70,80])for(const baseline of [60,70,80])for(const current of [50,60,70,80,90]){
    const model=health.weightJourneyData(freeze([{date:'2026-09-20',weight:initial},{date:'2026-10-01',weight:baseline},{date:'2026-10-15',weight:current}]),freeze([goal(70)]),180,period);
    assert.ok(!(model.percent>0&&model.away));assert.ok(!(model.reached&&model.away));if(model.away)assert.equal(model.percent,0);
  }
  const draft=health.weightJourneyData(rows,freeze([goal(80,{status:'draft',effective_from:'2026-09-01'}),goal(70)]),180,period);assert.equal(draft.percent,null);
});

test('qa-b8 MEDIUM: calendar empty states work in month/year/all, period filtering, zero and leap dates',()=>{
  for(const mode of ['month','year','all'])for(const rows of [[],[{date:'invalid',steps:1}],[{date:'2026-11-02',steps:100}]])assert.match(health.stepCalendarMarkup(health.stepCalendarData(freeze(rows),mode,'2026-11-01')),/표시할 걸음 기록이 없어요/);
  for(const mode of ['month','year'])assert.match(health.stepCalendarMarkup(health.stepCalendarData([{date:'2025-11-01',steps:100}],mode,'2026-11-01')),/표시할 걸음 기록이 없어요/);
  const zero=health.stepCalendarData([{date:'2024-02-29',steps:0}],'month','2024-02-29');assert.equal(zero[0].days.length,29);assert.match(health.stepCalendarMarkup(zero),/2024-02-29 · 0보/);assert.doesNotMatch(health.stepCalendarMarkup(zero),/표시할 걸음 기록이 없어요/);
});

test('qa-b8 MEDIUM: calendar defaults to KST across UTC midnight boundary without today()',()=>{
  class BoundaryDate extends Date{constructor(...a){super(...(a.length?a:['2026-11-01T15:30:00Z']));}}
  const c=vm.createContext({...guard,Date:BoundaryDate,esc,today:()=>{throw Error('local today() must not be used');}});
  vm.runInContext(dailyOwner+cut(main,'function careKoreaPeriod(', 'function dietPaceMarkup(')+cut(main,'function healthRecordDay(', 'function renderDietPace('),c);
  const model=c.stepCalendarData(freeze([{date:'2026-11-02',steps:2345},{date:'2026-11-03',steps:9999}]),'month');assert.equal(model[0].days[1].steps,2345);assert.equal(model[0].days[2].steps,null);
});

test('qa-b8 MEDIUM/LOW: step and weight duplicate dates use the actual monthly owner latest timestamp rule',()=>{
  const latest={date:'2026-10-01',weight:100,steps:5000,updatedAt:'2026-10-02T03:00:00Z',id:'a'},old={date:'2026-10-01',weight:60,steps:1,updatedAt:'2026-10-01T03:00:00Z',id:'z'},current={date:'2026-10-15',weight:90,steps:10000,createdAt:'2026-10-15T03:00:00Z'};
  const dataHub=vm.createContext({koreaDate:value=>Number.isFinite(Date.parse(value)),stable:JSON.stringify});vm.runInContext(cut(main,'function stamp(row)', 'function events('),dataHub);
  for(const rows of [[latest,old,current],[old,current,latest]]){
    freeze(rows);const before=JSON.stringify(rows),expected=health.monthlyReportDaily(rows),w=health.weightJourneyData(rows,freeze([goal(80)]),180,period),m=health.stepCalendarData(rows,'month','2026-10-31');
    assert.equal(w.start,expected[0].weight);assert.equal(w.current,90);assert.equal(w.percent,50);assert.equal(m[0].days[0].steps,expected[0].steps);assert.equal(m[0].days[14].steps,10000);assert.deepEqual(plain(dataHub.daily(rows,[])),plain(expected));assert.equal(JSON.stringify(rows),before);
  }
  for(const rows of [[{date:'2026-10-01',weight:100,steps:5,createdAt:'2026-10-02T03:00:00Z'},old], [{date:'2026-10-01',weight:100,steps:5},{date:'2026-10-01',weight:90,steps:0}]]){
    freeze(rows);const expected=health.monthlyReportDaily(rows)[0];assert.equal(health.weightJourneyData(rows,[],180,period).current,expected.weight);assert.equal(health.stepCalendarData(rows,'month','2026-10-31')[0].days[0].steps,expected.steps);
  }
});

test('qa-b8 MEDIUM: curriculum import refreshes existing home action owner with one existing commit',()=>{
  const f=homeOwners(),{c,nodes}=f,course={id:'c',name:'과목',curriculum:[]},sem={courses:[course]};let commits=0;
  nodes.campusCurriculumImport=new HomeElement('button');nodes.campusDetailCourseId={value:'c'};nodes.campusCurriculumBulk={value:'1\t수업\t내용\t과제'};
  Object.assign(c,{saveEntry:(button,fn)=>fn,campusActiveSemester:()=>sem,parseBulkRows:()=>[['1','수업','내용','과제']],normalizeCampusCurriculum:row=>row,commit:()=>{commits++;return true;},openCampusCourseDetail:()=>{},careCampusGroups:()=>course.curriculum.length?[{key:'last-week',week:'1',rows:[{sem,course,item:course.curriculum[0]}]}]:[]});
  c.renderHaniCareHome();const care=nodes.homeActions.querySelector(':scope > [data-hani-care-cards]');assert.equal(care.hidden,true);
  vm.runInContext(main.split('\n').find(line=>line.startsWith('$("campusCurriculumImport").onclick=')),c);nodes.campusCurriculumImport.onclick();
  assert.equal(commits,1);assert.equal(course.curriculum.length,1);assert.equal(nodes.campusCurriculumBulk.value,'');assert.equal(care.hidden,false);assert.match(care.innerHTML,/지난주 1주차/);assert.equal(nodes.homeNewsCount.textContent,'0건');
});

test('qa-b8 MEDIUM: monthly generation success/failure/cancel refresh existing action owner without extra saves',async()=>{
  for(const result of ['success','save-failure','blocked','cancel']){
    const f=homeOwners(),{c,nodes,model}=f;let saves=0;const previous={month:'2026-10',view:'old'};c.state.monthlyReports=result==='cancel'?[previous]:[];
    Object.assign(c,{monthlyReportGeneration:null,monthlyReportGenerationFailure:null,monthlyReportMonth:'2026-10',renderMonthlyReport:()=>{},dataHubRefresh:async()=>{},monthlyReportKoreaDate:()=> '2026-11-18',monthlyReportSnapshot:()=>({recordCount:1}),monthlyReportStored:()=>result==='cancel'?previous:null,monthlyReportDate:x=>x,monthlyReportBuildCurrent:()=>true,monthlyReportCaptureView:()=> 'new report',confirm:()=>false,save:()=>{saves++;return {ok:result!=='save-failure'};},toast:()=>{}});
    c.window.HANI_GOAL_PROGRESS={read:()=>result==='blocked'?null:{}};
    // A changed day/visible reader and the report-derived settlement card must be refreshed together.
    c.renderHaniCareHome();f.ilbo.hidden=false;model.settlement=true;
    vm.runInContext(cut(main,'async function monthlyReportGenerate(', 'function renderMonthlyReport('),c);await c.monthlyReportGenerate('2026-10');
    assert.equal(nodes.homeNewsCount.textContent,'1건');assert.equal(nodes.settlementQuickCheck.hidden,false);assert.equal(saves,['success','save-failure'].includes(result)?1:0);
    assert.match(nodes.settlementQuickCheck.innerHTML,result==='success'||result==='cancel'?/반영 기록 있음/:/기록 확인 필요/);assert.equal(c.state.monthlyReports.length,result==='success'||result==='cancel'?1:0);assert.equal(c.monthlyReportGeneration,null);
  }
});

test('qa-b8 MEDIUM: actual showView(home) already refreshes care; shared owner now also refreshes settlement/count',()=>{
  const f=homeOwners(),{c,nodes,model}=f;for(const id of ['title','app'])nodes[id]=new HomeElement();
  Object.assign(c,{organizationRoute:()=>null,settingsRoute:()=>null,location:{hash:'',href:'https://fixture.invalid/'},history:{replaceState(){}},clearTimeout(){},navigationTimer:0,navigationCurrent:'',navigationBooted:false,loginGateUnlocked:false,NAVIGATION_VIEWS:new Set(['home']),pageMeta:{home:['대시보드','','home']},setBanner(){},updateFinishScope(){},cloudUser:null});c.window.scrollTo=()=>{};
  vm.runInContext(cut(main,'function showView(', 'const QUICK_JUMP_ITEMS='),c);
  c.showView('home');const notice=c.haniCareMemory().homeNotice,chipCount=nodes.homeActions.children.length;assert.equal(nodes.settlementQuickCheck.hidden,true);
  model.settlement=true;f.milestone.hidden=false;c.showView('home');assert.equal(nodes.settlementQuickCheck.hidden,false);assert.equal(nodes.homeNewsCount.textContent,'1건');assert.equal(nodes.homeNews.open,false);
  assert.equal(c.haniCareMemory().homeNotice,notice);assert.equal(nodes.homeActions.children.length,chipCount);
  model.settlement=false;f.milestone.hidden=true;c.showView('home');assert.equal(nodes.settlementQuickCheck.hidden,true);assert.equal(nodes.homeNewsCount.textContent,'0건');
});
