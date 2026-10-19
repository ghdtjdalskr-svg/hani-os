/* Synthetic data only; direct node invocation works without a test runner child process. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const C = require('../hani-investment-committee.js');
const fixture = require('./fixtures/investment-research-mock.json');
const source = fs.readFileSync(require.resolve('../hani-investment-committee.js'), 'utf8');
const blank = () => ({investmentResearchCards: [], investmentResearchHistory: [], investmentCommitteeSnapshots: [], ui: {icAccumulationAccountIds: []}});
const raw = extra => {const c = {...fixture.cards[0], ...extra}; for (const k of ['fairValue', 'fairValueLow', 'fairValueHigh']) if (!Object.hasOwn(extra, k)) delete c[k]; return c;};
const review = input => C.reviewReport([input], blank())[0];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fn = (name, end) => source.slice(source.indexOf('  function ' + name + '('), source.indexOf(end, source.indexOf('  function ' + name + '(')));

test('common GPT price aliases, nested base/mid and nested fairValue preserve trading currency', () => {
  for (const key of ['fairValue', 'fair_value', 'fairValueMid', 'targetPrice', 'target_price', '적정가']) {
    assert.equal(review(raw({[key]: '약 ₩90,000원'})).card.fairValue, 90000, key);
    for (const mid of ['mid', 'base']) {
      const card = review(raw({[key]: {low:'8만', [mid]:'9만', high:'100K'}})).card;
      assert.deepEqual([card.fairValueLow, card.fairValue, card.fairValueHigh], [80000,90000,100000]);
    }
  }
  assert.equal(review(raw({targetPrice:{fairValue:{low:80000,mid:90000,high:100000}}})).card.fairValue,90000);
  assert.equal(review(raw({low:80000,base:90000,high:100000})).card.fairValue,90000);
  const usd = C.importFairValues({fair_value: {low:'$100',mid:'약 120 USD',high:'$150'}},'USD');
  assert.deepEqual([usd.currency,usd.fairValueLow,usd.fairValue,usd.fairValueHigh],['USD',100,120,150]);
});

test('number suffixes and ranges yield positive plain numbers; invalid values reject before saving', () => {
  for (const [value,expected] of [['9만',90000],['9.5만 원',95000],['85K',85000],['1.2k USD',1200],['약 $123.45',123.45]]) assert.equal(C.parseFairNumber(value, /USD|\$/.test(value)?'USD':'KRW'),expected);
  const item=review(raw({fairValueRange:'85,000~95,000'}));
  assert.deepEqual([item.card.fairValueLow,item.card.fairValue,item.card.fairValueHigh],[85000,90000,95000]);
  assert.match(item.card.valuationNote,/중간값/); assert.equal(item.missingFairValue,false);
  for (const value of [0,-1,'미확인','90,000 또는 100,000',Infinity,{},'$90']) assert.throws(()=>C.parseFairNumber(value,'KRW'));
  assert.throws(()=>review(raw({fairValueRange:'95,000~85,000'})),/Low/);
  assert.throws(()=>review(raw({fairValue:100000,fairValueHigh:90000})),/Low/);
  assert.throws(()=>C.importFairValues({fairValue:{currency:'USD',mid:90}},'KRW'),/통화/);
});

test('review warns for incoming missing fair value even when retaining an existing value; never mutates source', () => {
  const s=blank(),old={...C.normalizeCard(fixture.cards[0]),id:'old',extra:{keep:true}};
  s.investmentResearchCards=[old]; s.investmentResearchHistory=[{id:'history',keep:true}];s.investmentCommitteeSnapshots=[{id:'snapshot',keep:true}];
  const before=JSON.stringify(s),items=C.reviewReport([raw({})],s);
  assert.equal(items[0].missingFairValue,true);assert.equal(items[0].card.fairValue,old.fairValue);
  assert.equal(JSON.stringify(s),before);assert.equal(s.investmentResearchCards[0],old);
  assert.equal(review(raw({fairValue:null,valuationNote:'비상장으로 산정 불가'})).missingFairValue,true);
  const slot={innerHTML:''},context=vm.createContext({importReview:items,importDialog:{querySelector:()=>slot},missingFairItems:C.missingFairItems,esc,labels:{},valueText:JSON.stringify});
  vm.runInContext(fn('renderReview','  const monthlyHost')+'\nrenderReview();',context);
  assert.match(slot.innerHTML,/적정가 누락 1종목/);assert.match(slot.innerHTML,/적정가 누락 – GPT에 다시 요청하거나 직접 입력/);assert.match(slot.innerHTML,/누락 종목만 GPT 재요청 복사/);
  assert.equal(JSON.stringify(s),before);
});

test('follow-up includes only missing securities, current price and thesis, no other ratings or writes', () => {
  const a=review(raw({manualPrice:{value:55000,currency:'KRW',asOf:'2026-10-10'}})),b=review({...fixture.cards[3]});
  const items=[a,b,{...a,excluded:true}],before=JSON.stringify(items),prompt=C.fairFollowupPrompt(items);
  const data=JSON.parse(prompt.split('자료: ')[1]);
  assert.equal(data.length,1);assert.equal(data[0].name,a.card.name);assert.equal(data[0].currentPrice.value,55000);assert.deepEqual(data[0].thesis,a.card.thesis);
  assert.equal(Object.hasOwn(data[0],'rating'),false);assert.match(prompt,/valuationMethod\/valuationNote/);assert.match(prompt,/절대 생략/);assert.equal(JSON.stringify(items),before);
  assert.throws(()=>C.fairFollowupPrompt([b]));
});

test('schema requires numeric trading-currency values and the filled example conforms to required keys', () => {
  for(const k of ['fairValue','fairValueLow','fairValueHigh']){assert.ok(C.OUTPUT_SCHEMA.items.required.includes(k));assert.deepEqual(C.OUTPUT_SCHEMA.items.properties[k].type,['number','null']);assert.equal(typeof C.OUTPUT_EXAMPLE[k],'number');}
  assert.deepEqual(Object.keys(C.OUTPUT_EXAMPLE).sort(),C.OUTPUT_SCHEMA.items.required.slice().sort());
  const prompt=C.buildPrompt(blank());assert.match(prompt,/단위 없는 양수 숫자/);assert.match(prompt,/정말 산정 불가능/);assert.match(prompt,/완성된 카드 예시/);
});

test('monthly steps and reminder use KST boundaries, active records, previous snapshot and future checkpoints', () => {
  const s=blank(),card={...C.normalizeCard(fixture.cards[0]),lastReviewedAt:'2026-09-30T15:00:00Z',id:'a',nextCheckpoints:['2026-10-04 실적', '2026.10.06 공시', '날짜 없이 논리 점검']};s.investmentResearchCards=[card];
  const before=JSON.stringify(s),p=C.committeeProgress(s,'2026-10-01T00:00:00Z');
  assert.deepEqual([p.month,p.researchDone,p.committeeDone,p.nextCheckpoint,p.reminder],['2026-10',true,false,'2026-10-04',true]);assert.equal(JSON.stringify(s),before);
  s.investmentCommitteeSnapshots=[{id:'sep',reviewMonth:'2026-09',securitySnapshots:[]}];assert.equal(C.committeeProgress(s,'2026-10-01').reminder,false);
  card.lastReviewedAt='2026-09-30T14:59:00Z';assert.equal(C.committeeProgress(s,'2026-10-07').reminder,true);assert.equal(C.committeeProgress(s,'2026-10-08').reminder,false);
  card.lastReviewedAt='2026-10-05';assert.equal(C.committeeProgress(s,'2026-10-05').nextCheckpoint,'2026-10-06');
  s.investmentCommitteeSnapshots.push({id:'oct',reviewMonth:'2026-10',securitySnapshots:[{...card,nextCheckpoints:['2026-11-02 frozen']} ]});
  assert.equal(C.committeeProgress(s,'2026-10-11').committeeDone,true);assert.equal(C.committeeProgress(s,'2026-10-11').nextCheckpoint,'2026-11-02');
  s.investmentCommitteeSnapshots=[];card.status='ARCHIVED';assert.equal(C.committeeProgress(s,'2026-10-05').researchDone,false);
  assert.equal(C.committeeProgress(blank(),'2026-12-31T15:00:00Z').month,'2027-01');
});

test('card summary math handles 8 cards, missing values, score bands and empty lists', () => {
  const cards=Array.from({length:8},(_,i)=>({...C.normalizeCard(fixture.cards[0]),name:'종목'+i,rating:C.RATINGS[i%5],fairValue:i<3?null:90000,convictionScore:40+i*5,nextCheckpoints:i<2?['실적','공시']:[]}));
  const before=JSON.stringify(cards),s=C.cardSummary(cards);assert.deepEqual(s.distribution,{'STRONG BUY':2,BUY:2,HOLD:2,REDUCE:1,EXIT:1});assert.equal(s.average,57.5);assert.equal(s.highest.card.name,'종목7');assert.equal(s.fairValueCount,5);assert.equal(s.checkpointCount,4);assert.equal(JSON.stringify(cards),before);
  assert.equal(C.cardSummary([]).average,null);assert.equal(C.cardSummary([]).highest,null);assert.equal(C.cardSummary([]).total,0);
  assert.equal(C.cardSummary([{...cards[0],convictionScore:undefined}]).average,C.convictionTotal(cards[0].conviction));
});

test('confirmed next-review summary reads frozen checkpoint records and crosses December', () => {
  const s={reviewMonth:'2026-10',securitySnapshots:[{name:'삼성전자우',nextCheckpoints:['실적','배당']},{name:'ETF',kind:'accumulation',nextCheckpoints:['제외']} ]};const before=JSON.stringify(s),summary=C.confirmedSummary(s);
  assert.equal(summary.label,'10월 리포트 확정 완료 · 다음 리뷰 11월 첫 주 · 체크포인트 2개');assert.equal(summary.checkpoints.length,2);assert.equal(JSON.stringify(s),before);
  assert.match(C.confirmedSummary({...s,reviewMonth:'2026-12'}).label,/다음 리뷰 1월 첫 주/);
});

test('actual card renderer replaces missing FV noise with detail CTA and computes positive/negative upside', () => {
  const money=(v,c)=>v==null?'미입력':v+' '+c,percent=v=>v==null?'미확인':(v>=0?'+':'')+v.toFixed(1)+'%';
  const context=vm.createContext({currentPrice:C.currentPrice,valuation:C.valuation,hasFairValue:C.hasFairValue,prices:()=>({}),money,percent,esc,kst:C.kst});vm.runInContext(fn('priceHtml','  host.innerHTML'),context);
  const card={...C.normalizeCard(fixture.cards[0]),id:'cta',fairValue:null};context.card=card;
  const html=vm.runInContext('priceHtml(card,true)',context);assert.match(html,/적정가 입력하기/);assert.match(html,/data-research="cta"/);assert.doesNotMatch(html,/미입력|미확인 \/ 미확인/);
  card.manualPrice={value:100,currency:'KRW',asOf:'2026-10-11'};card.fairValue=112.4;
  assert.match(vm.runInContext('priceHtml(card,true)',context),/is-positive/);assert.match(vm.runInContext('priceHtml(card,true)',context),/\+12.4%/);
  card.fairValue=95;assert.match(vm.runInContext('priceHtml(card,true)',context),/is-negative/);assert.match(vm.runInContext('priceHtml(card,true)',context),/−5.0%/);
});

test('existing proactive renderer displays reminder on home/desk slot and stays read-only', () => {
  const main=fs.readFileSync(require.resolve('../hani-main.js'),'utf8'),start=main.indexOf('function renderHaniCareCards('),end=main.indexOf('\nfunction renderHaniCareHome(',start);
  const slot={dataset:{},hidden:false,innerHTML:'',querySelectorAll:()=>[],querySelector:()=>null};const parent={querySelector:()=>slot};
  const s=blank(),context=vm.createContext({state:s,careCampusGroups:()=>[],campusAssignments:()=>[],certificateCareSorted:()=>[],certificateDays:()=>40,careKoreaPeriod:()=>({day:'2026-10-01'}),esc,window:{HaniInvestmentResearchCore:C}});
  const before=JSON.stringify(s);vm.runInContext(main.slice(start,end),context);context.parent=parent;vm.runInContext('renderHaniCareCards(parent)',context);assert.equal(slot.hidden,false);assert.match(slot.innerHTML,/이번 달 HANI 투자 리포트 리뷰/);assert.match(slot.innerHTML,/data-hani-care-view="investmentCommittee"/);assert.equal(JSON.stringify(s),before);
  context.careKoreaPeriod=()=>({day:'2026-10-08'});vm.runInContext('renderHaniCareCards(parent)',context);assert.equal(slot.hidden,true);assert.doesNotMatch(slot.innerHTML,/이번 달 HANI 투자 리포트 리뷰/);
});

test('actual delegated import handler accepts a valuation-only follow-up and persists only on selected confirm', async () => {
  const s=blank(),before=JSON.stringify(s),report={value:JSON.stringify([raw({}),fixture.cards[3]])},error={textContent:''},slot={innerHTML:''},next={dataset:{}};
  let saved=0,closed=0,renders=0;
  const context=vm.createContext({state:s,importReview:[],importBaseline:'',parseReport:C.parseReport,reviewReport:C.reviewReport,importFairValues:C.importFairValues,match:C.match,framework:C.FRAMEWORK,holdings:()=>[],fingerprint:()=>JSON.stringify(s),accountIdentity:()=>null,
    importDialog:{querySelector:q=>q==='[data-ic-report]'?report:q==='.ic-review'?slot:error,querySelectorAll:q=>q==='[data-ic-include]'?[{dataset:{icInclude:'0'},checked:true},{dataset:{icInclude:'1'},checked:false}]:[{dataset:{icInclude:'0'}}],close:()=>closed++},
    host:{querySelector:()=>next},applyBatch:C.applyBatch,commit:()=>{saved++;return true;},uid:()=> 'confirmed-'+saved,
    missingFairItems:C.missingFairItems,esc,labels:{},valueText:JSON.stringify,render:()=>renders++,refreshPrices:()=>{},notice:()=>{}});
  vm.runInContext(fn('renderReview','  const monthlyHost'),context);
  const start=source.indexOf("  host.addEventListener('click', async event => {"),end=source.indexOf("  host.querySelector('[data-ic-status]')",start);
  const handler=source.slice(start,end).replace("  host.addEventListener('click', async event => {","this.click = async event => {").replace(/\}\);\s*$/,'};');vm.runInContext(handler,context);
  const click=action=>context.click({target:{closest:()=>({dataset:{ic:action},closest:()=>context.importDialog})}});
  await click('parse');assert.match(slot.innerHTML,/적정가 누락 1종목/);assert.equal(saved,0);assert.equal(JSON.stringify(s),before);
  const thesis=context.importReview[0].card.thesis;
  report.value=JSON.stringify([{name:fixture.cards[0].name,targetPrice:'9만',fairValueLow:'8만',fairValueHigh:'10만',valuationMethod:'배수',valuationNote:'보완'}]);
  await click('parse');assert.equal(context.importReview[0].card.fairValue,90000);assert.deepEqual(context.importReview[0].card.thesis,thesis);assert.doesNotMatch(slot.innerHTML,/적정가 누락/);assert.equal(context.importReview.length,2);assert.equal(context.importReview[1].card.name,fixture.cards[3].name);assert.equal(context.importReview[1].include,false);assert.equal(saved,0);assert.equal(JSON.stringify(s),before);
  await click('apply');assert.equal(saved,1);assert.equal(closed,1);assert.equal(renders,1);assert.equal(s.investmentResearchCards[0].fairValue,90000);assert.equal(next.dataset.appliedOwner,'local');
  assert.equal(s.investmentCommitteeSnapshots.length,0);
});
