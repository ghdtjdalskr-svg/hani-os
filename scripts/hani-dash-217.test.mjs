import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {main,bundle,presentationCode,rendererCode,source,makeRuntime,expectedCards} from './hani-dash-217-fixture.mjs';
const window={};new Function('window',bundle)(window);
const api=window.HANI_DATA_HUB;
const present=new Function('n',presentationCode+'\nreturn dataHubLifeCardPresentation;')(v=>Number(v)||0);
const records=structuredClone(source),before=JSON.stringify(records);
const runtime=makeRuntime(api,{records});const view=await runtime.refresh();
assert.equal(view.status,'VERIFIED');assert.equal(view.metrics.length,6);
const metric=key=>view.metrics.find(m=>m.key===key);
const expected={hasdaq:['▲ 20%','up','📈 상승장'],
  ne100:['▼ 2%','up','📈 상승장'],hinaJones:['▲ 100%','up','📈 상승장'],
  harukei:['▲ 20%','up','📈 상승장'],jispi:['▲ 30%','down','🛑 지출 서킷브레이커'],
  hinkei:['▲ 33.33%','up','📈 상승장']};
for(const [key,[change,tone,market]] of Object.entries(expected)){
  const p=present(metric(key));assert.equal(p.change,'전월 대비 '+change,key);
  assert.equal(p.tone,tone,key);assert.equal(p.market,market,key);
  assert.equal(api.dashboardText(metric(key)).value,expectedCards[key].value,key);
  assert.equal(metric(key).row.month,'2026-09',key);
  assert.equal(metric(key).monthComparison.baseline.month,'2026-08',key);
  assert.deepEqual({change,tone,market},{change:expectedCards[key].change,tone:expectedCards[key].tone,market:expectedCards[key].market});
}
assert.equal(metric('jispi').comparison.usage_rate,130,'existing budget calculation retained');
assert.equal(metric('harukei').comparison.comparison_type,'target');
assert.equal(metric('hinkei').comparison.comparison_type,'target_pp');
assert.equal(metric('hinkei').monthComparison.delta_absolute,20);
assert.equal(JSON.stringify(records),before,'no input mutation');
console.log('PASS real runtime: six unchanged values + exact month percent only; budget/target comparison retained.');

const altered=(key,value,previous,status='CONFIRMED')=>{
  const m=structuredClone(metric(key));m.row.value=value;m.row.status=status;
  m.monthComparison={...m.monthComparison,baseline:previous===null?null:{value:previous,month:'2026-08',status:'CONFIRMED'},
    delta_absolute:previous===null?null:value-previous,delta_percent:previous? (value-previous)/previous*100:null};
  return m;
};
for(const key of ['hasdaq','ne100','jispi','hinaJones','harukei','hinkei']){
  const m=altered(key,100,100);m.comparison.target=null;
  assert.equal(present(m).market,'↔ 보합');assert.equal(present(m).tone,'flat');
  for(const [value,tone] of [[90,['ne100','jispi'].includes(key)?'up':'down'],[110,['ne100','jispi'].includes(key)?'down':'up']]){
    m.row.value=value;m.monthComparison.delta_absolute=value-100;
    assert.equal(present(m).tone,tone);assert.equal(present(m).market,tone==='up'?'📈 상승장':'📉 하락장');
  }
}
for(const [value,label] of [[70,'초강세'],[80,'강한 상승장'],[85,'📈 상승장'],[90,'보합'],[110,'하락장'],[120,'하락장'],[125,'사이드카'],[130,'서킷브레이커']]){
  const m=altered('jispi',value,100);m.comparison.target=100;
  // Floating-point boundary behavior is the canonical function's behavior, unchanged.
  const canonical=new Function(presentationCode+'\nreturn ledgerJispiStatus;')();
  assert.equal(present(m).market,canonical(value,100));
  if(![90,110].includes(value))assert(present(m).market.includes(label));
}
let m=altered('hasdaq',10,null);assert.equal(present(m).change,'');assert.equal(present(m).market,'⏳ 비교 대기');
m=altered('hinaJones',1,0);assert.equal(present(m).change,'');assert(!/Infinity|NaN/.test(present(m).change));
m=altered('harukei',6000,5000,'PARTIAL');assert.equal(present(m).quality,'기록 일부만 있어요');
m=altered('hasdaq',120,100);m.monthComparison.baseline.status='PARTIAL';assert(present(m).qualityDetail.includes('2026-08'));assert(present(m).quality);
m=altered('hasdaq',120,100);assert.equal(present(m).quality,'');
for(const status of ['NO_DATA','STALE']){
  m=altered('hasdaq',null,null,status);assert(!present(m).change.includes('전월 대비'));assert.equal(present(m).quality,'');assert.equal(present(m).market,'⏳ 기록 대기');
}
assert.equal(present(null).market,'⏳ 검증 대기');
const noPrevious=makeRuntime(api,{records:{...source,body:source.body.slice(1),exercise:source.exercise.slice(1)}});
const noPreviousView=await noPrevious.refresh();
for(const key of ['ne100','harukei'])assert.equal(noPreviousView.metrics.find(m=>m.key===key).monthComparison.baseline,null);
console.log('PASS directions, existing JISPI thresholds, zero baseline, missing/stale/partial and missing exact month.');

// Minimal DOM executes the production renderer; browser geometry remains a separate check.
class Element{
  constructor(tag='span'){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.className='';this.textContent='';this.style={};}
  append(child){child.parent=this;this.children.push(child);}
  after(child){child.parent=this.parent;this.parent.children.splice(this.parent.children.indexOf(this)+1,0,child);}
  setAttribute(k,v){this.attributes[k]=v;}
  querySelector(sel){return this.querySelectorAll(sel)[0]||null;}
  querySelectorAll(sel){return this.children.filter(c=>sel.split(',').some(s=>c.className.split(' ').includes(s.trim().slice(1))));}
}
const ids=new Map(),cards=new Map();
for(const [key,,valueId,metaId] of api.DASHBOARD_SLOTS){
  const card=new Element('button');cards.set(key,card);
  for(const [tag,id] of [['strong',valueId],['small',metaId]]){const node=new Element(tag);ids.set(id,node);card.append(node);}
}
const document={createElement:tag=>new Element(tag),querySelector:sel=>cards.get(sel.match(/data-life-index="(.*?)"/)?.[1])||null};
for(const id of ['dataHubStatus','homeTrendBadge','homeMixDonut'])ids.set(id,new Element());
ids.get('homeMixDonut').classList={add(){}};
let current=view;
const render=new Function('window','document','$','today','state','dataHubRuntime','n','esc',
  'let dataHubSelectedMonth="2026-09",activeLifeIndex="hasdaq";\n'+presentationCode+'\n'+rendererCode+'\nreturn dataHubRenderDashboard;')(
    window,document,id=>ids.get(id),()=> '2026-10-18',{}, {peek:()=>current},v=>Number(v)||0,v=>String(v));
render();const persistent=[...cards.values()].flatMap(c=>c.children);render();
assert.deepEqual([...cards.values()].flatMap(c=>c.children),persistent,'refresh preserves slot identity');
for(const [key,card] of cards){
  assert.equal(card.querySelectorAll('.life-card-move').length,1);assert.equal(card.querySelectorAll('.life-card-market').length,1);
  const value=card.children.find(c=>c.tag==='strong'),move=card.querySelector('.life-card-move');
  assert.equal(card.children.indexOf(move),card.children.indexOf(value)+1,'change directly under value');
  const meta=ids.get(api.DASHBOARD_SLOTS.find(s=>s[0]===key)[3]);
  assert(!/PARTIAL|관측 \d+일/.test(meta.textContent));assert(card.title.includes(metric(key).row.status));
  if(key==='harukei')assert(card.title.includes('관측 1일'));
}
current={status:'OWNER_BINDING_BLOCKED',reason:'OWNER_BINDING_BLOCKED',metrics:[]};render();
assert.match(ids.get('homeMixDonut').innerHTML,/>로그인·원본 확인이 필요해요<\/b>/);
assert.match(ids.get('homeMixDonut').innerHTML,/title="OWNER_BINDING_BLOCKED"/);
assert.doesNotMatch(ids.get('dataHubStatus').textContent,/OWNER_BINDING_BLOCKED/);
assert.match(ids.get('dataHubStatus').title,/OWNER_BINDING_BLOCKED/);
assert.equal(ids.get('homeTrendBadge').textContent,'로그인·원본 확인이 필요해요');
for(const card of cards.values()){
  assert.equal(card.querySelector('.life-card-move').textContent,'원본 검증 대기');
  assert.equal(card.querySelector('.life-card-market').textContent,'⏳ 검증 대기');
  assert.equal(card.querySelector('.life-card-quality').hidden,true);
  assert.equal(card.children.find(c=>c.tag==='strong').textContent,'—');
}
assert.equal(JSON.stringify(records),before);
console.log('PASS real renderer: persistent slots, accessible completeness, clean footers, verified→blocked clears prior values.');
// Shared browser harness paths are not source baselines; explicit source-file QA is retained.
const browserHarness=process.argv[2]&&process.argv[2].replaceAll('\\','/').endsWith('/playwright/index.mjs');
if(process.argv[2]&&!browserHarness){
  const baseline=readFileSync(process.argv[2],'utf8'),oldWindow={};
  new Function('window',baseline.slice(baseline.indexOf('// BEGIN GENERATED HANI DATA HUB'),baseline.indexOf('// END GENERATED HANI DATA HUB')))(oldWindow);
  const oldView=await makeRuntime(oldWindow.HANI_DATA_HUB).refresh();
  assert.deepEqual({...view,metrics:view.metrics.map(({monthComparison,...m})=>m)},oldView,'all prior runtime outputs unchanged');
  const mask=(text,start,end)=>{const a=text.indexOf(start),b=text.indexOf(end,a);assert(a>=0&&b>a);return text.slice(0,a)+'<presentation>'+text.slice(b);};
  const maskMain=text=>mask(mask(text,'return {key: DASHBOARD_SLOTS.find','\n      active ='),
    text.includes('// Presentation only: never fill')?'// Presentation only: never fill':'function dataHubRenderDashboard(',
    '// Read-only period projection;');
  assert.equal(maskMain(main),maskMain(baseline),'outside presentation regions all bytes/EOL, storage/cloud owners preserved');
  if(process.argv[3]){
    const css=readFileSync(new URL('../hani-style-08.css',import.meta.url),'utf8'),oldCss=readFileSync(process.argv[3],'utf8');
    assert.equal(mask(css,'/* dash-217:', '.hani-motion-number{'),mask(oldCss,'/* The final text reserves', '.hani-motion-number{'),'outside CSS patch bytes/EOL preserved');
  }
  console.log('PASS HEAD baseline: prior runtime outputs equal; all bytes/EOL outside presentation regions unchanged.');
}
mkdirSync(new URL('../artifacts/dash-217/',import.meta.url),{recursive:true});
writeFileSync(new URL('../artifacts/dash-217/node-status.json',import.meta.url),JSON.stringify({result:'PASS',scope:'synthetic runtime and minimal DOM; no browser geometry',expected},null,2));
