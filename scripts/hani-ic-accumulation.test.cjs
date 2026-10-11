/* Synthetic holdings only. No browser, storage or network access. */
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../hani-investment-committee.js');
const fixture = require('./fixtures/investment-research-mock.json');
const make = () => {
  const accounts = [
    ...['ISA','연금','IRP','위탁'].map((type,i) => ({id:'k'+i,name:'키움 '+type,type,broker:'키움증권'})),
    {id:'t',name:'토스 위탁종합',type:'위탁종합',broker:'토스증권'},
    {id:'h',name:'하나 위탁종합',type:'위탁종합',broker:'하나증권'}
  ];
  const cards = fixture.cards.slice(0,3).map((c,i) => ({...C.normalizeCard({...c,themes:['공통 테마']}),id:'r'+i}));
  const instruments = cards.map((c,i) => ({id:c.instrumentId || 'i'+i,name:c.name,ticker:c.ticker,market:c.market,currency:'KRW'}));
  cards.forEach((c,i) => {c.instrumentId = instruments[i].id;});
  instruments.push({id:'nocard',name:'장기 적립 ETF',ticker:'999999',market:'KR',currency:'KRW'});
  const source = {ui:{keep:'preserved'},accounts,instruments,investmentWatchlist:[],investmentResearchCards:cards,investmentResearchHistory:[],investmentCommitteeSnapshots:[]};
  const rows = [
    {instrumentId:instruments[0].id,accountId:'k0',quantity:2,recordedEvaluation:200,recordedCurrency:'KRW'},
    {instrumentId:instruments[0].id,accountId:'k1',quantity:3,recordedEvaluation:300,recordedCurrency:'KRW'},
    {instrumentId:instruments[1].id,accountId:'k2',quantity:1,recordedEvaluation:100,recordedCurrency:'KRW'},
    {instrumentId:instruments[1].id,accountId:'t',quantity:1,recordedEvaluation:100,recordedCurrency:'KRW'},
    {instrumentId:instruments[2].id,accountId:'h',quantity:2,recordedEvaluation:200,recordedCurrency:'KRW'},
    {instrumentId:'nocard',accountId:'k3',quantity:1,recordedEvaluation:100,recordedCurrency:'KRW'}
  ];
  return {source,rows};
};

test('default uses broker containing 키움 only, across ISA/pension/IRP/regular, without writing ui',()=>{
  const {source,rows}=make(),before=JSON.stringify(source);
  assert.deepEqual(C.accumulationAccountIds(source),['k0','k1','k2','k3']);
  assert.equal(C.accumulationInfo(source.investmentResearchCards[0],source,rows).kind,'accumulation');
  assert.equal(C.accumulationInfo(source.investmentResearchCards[2],source,rows).kind,'normal');
  source.accounts[0].broker='해외 키움 계좌';
  assert.ok(C.accumulationAccountIds(source).includes('k0'));
  source.accounts[0].broker='키움증권';
  assert.equal(JSON.stringify(source),before);
  assert.equal(Object.hasOwn(source.ui,'icAccumulationAccountIds'),false);
});

test('explicit settings including empty list override default; saves only through existing owner',()=>{
  const {source,rows}=make(),beforeKeys=Object.keys(source),cards=source.investmentResearchCards;
  let calls=0;C.saveAccumulationAccounts(source,['h','h','unknown'],()=>{calls++;return true;});
  assert.equal(calls,1);assert.deepEqual(source.ui,{keep:'preserved',icAccumulationAccountIds:['h']});
  assert.deepEqual(Object.keys(source),beforeKeys);assert.equal(source.investmentResearchCards,cards);
  assert.equal(C.accumulationInfo(cards[0],source,rows).kind,'normal');
  assert.equal(C.accumulationInfo(cards[2],source,rows).kind,'accumulation');
  C.saveAccumulationAccounts(source,[],()=>true);
  assert.deepEqual(C.accumulationAccountIds(source),[]);
  assert.equal(C.accumulationSecurities(source,rows).length,0);
});

test('failed settings persist rolls back exact previous property and reference',()=>{
  const {source}=make(),ui=source.ui;
  assert.throws(()=>C.saveAccumulationAccounts(source,['t'],()=>false),/되돌렸/);
  assert.equal(source.ui,ui);assert.equal(Object.hasOwn(ui,'icAccumulationAccountIds'),false);
  const previous=['k0'];ui.icAccumulationAccountIds=previous;
  assert.throws(()=>C.saveAccumulationAccounts(source,[],()=>{throw Error('disk full');}),/disk full/);
  assert.equal(ui.icAccumulationAccountIds,previous);assert.equal(ui.keep,'preserved');
  assert.throws(()=>C.saveAccumulationAccounts({},[],()=>true),/기존 UI/);
});

test('all current holdings determine only vs mixed; zero positions and missing accounts handled conservatively',()=>{
  const {source,rows}=make(),card=source.investmentResearchCards[0];
  assert.equal(C.accumulationInfo(source.investmentResearchCards[1],source,rows).kind,'mixed');
  assert.equal(C.accumulationInfo(card,source,[...rows,{instrumentId:card.instrumentId,accountId:'t',quantity:0}]).kind,'accumulation');
  assert.equal(C.accumulationInfo(card,source,[...rows,{instrumentId:card.instrumentId,accountId:'unknown',quantity:1}]).kind,'mixed');
  assert.equal(C.accumulationInfo(card,source,[]).kind,'normal');
  const alias={name:card.name,ticker:'A'+card.ticker,market:'KOSPI'};
  assert.equal(C.accumulationInfo(alias,source,rows).kind,'accumulation');
});

test('GPT export excludes accumulation with and without cards, keeps mixed/normal/WATCH, has no writes',()=>{
  const {source,rows}=make(),before=JSON.stringify(source);
  source.investmentWatchlist=[fixture.cards[3]];
  const withWatch=JSON.stringify(source),prompt=C.buildPrompt(source,rows);
  assert.doesNotMatch(prompt,/삼성전자우|장기 적립 ETF/);
  assert.match(prompt,/LG전자우/);assert.match(prompt,/오리온/);
  const data=JSON.parse(prompt.split('자료(JSON):\n')[1].split('\nConviction framework')[0]);
  assert.deepEqual(data.cards.map(c=>c.name),['LG전자우','오리온']);
  assert.equal(JSON.stringify(source),withWatch);
  source.investmentWatchlist=[];assert.equal(JSON.stringify(source),before);
});

test('GPT import reviews excluded names unchecked without matching existing research, even partial/invalid opinions',()=>{
  const {source,rows}=make(),before=JSON.stringify(source),existing=source.investmentResearchCards[0];
  const review=C.reviewReport([{instrumentId:existing.instrumentId,name:existing.name,rating:'INVALID'},
    {instrumentId:'nocard',name:'장기 적립 ETF'}, {...source.investmentResearchCards[1],rating:'BUY'}],source,rows);
  assert.deepEqual(review.map(r=>[r.include,r.excluded]),[[false,true],[false,true],[true,false]]);
  assert.equal(review[0].existingId,null);assert.deepEqual(review[0].tracked,{});
  assert.equal(review[2].existingId,'r1');assert.equal(JSON.stringify(source),before);
  let calls=0;let serial=0;const opts={uid:()=> 'new'+ ++serial};
  assert.throws(()=>C.applyBatch(source,review.slice(0,2),()=>{calls++;return true;},opts));
  assert.equal(calls,0);assert.equal(JSON.stringify(source),before);
  C.applyBatch(source,review,()=>{calls++;return true;},opts);
  assert.equal(calls,1);assert.deepEqual(source.investmentResearchCards[0],existing);
  assert.equal(source.investmentResearchCards.length,3);assert.equal(source.investmentResearchCards[1].rating,'BUY');
});

test('Monthly draft excludes accumulation from opinion lists/conviction/overlap and includes no-card holdings',()=>{
  const {source,rows}=make(),before=JSON.stringify(source);
  const d=C.committeeDraft(source,'2026-10',{},rows);
  assert.doesNotMatch(d.executiveSummary,/삼성전자우/);assert.doesNotMatch(d.actionPlan.join('\n'),/삼성전자우/);
  assert.deepEqual(d.topConviction,['LG전자우','오리온']);assert.deepEqual(d.portfolioSummary.overlapWarnings,[]);
  assert.deepEqual(C.portfolioSummary(source.investmentResearchCards,rows,source).overlapWarnings,[]);
  assert.deepEqual(d.accumulationSecurities.map(c=>c.name),['삼성전자우','장기 적립 ETF']);
  assert.deepEqual(d.accumulationSecurities[0].accounts.map(a=>a.name),['키움 ISA','키움 연금']);
  assert.deepEqual(d.accumulationSecurities[0].currentValues,[{currency:'KRW',value:500}]);
  assert.equal(d.accumulationSecurities[0].weight,50);assert.equal(JSON.stringify(source),before);
});

test('snapshot freezes accumulation records without research fields, retains mixed judgment, and keeps original cards',()=>{
  const {source,rows}=make(),cardsBefore=JSON.stringify(source.investmentResearchCards);
  const draft=C.committeeDraft(source,'2026-10',{},rows);let serial=0;
  const snap=C.confirmCommittee(source,draft,()=>true,{uid:()=> 's'+ ++serial,now:'2026-10-11T03:00:00Z',holdingRows:rows});
  const acc=snap.securitySnapshots.filter(c=>c.kind==='accumulation');
  assert.equal(acc.length,2);assert.equal(snap.securitySnapshots.length,4);
  for(const entry of acc)for(const field of ['researchId','rating','fairValue','fairValueLow','fairValueHigh','conviction','convictionScore','thesis','action'])assert.equal(Object.hasOwn(entry,field),false,field);
  assert.equal(snap.securitySnapshots.find(c=>c.id==='r1').hasAccumulation,true);
  assert.deepEqual(snap.topConviction.map(c=>c.name),['LG전자우','오리온']);
  assert.deepEqual(snap.portfolioSummary.overlapWarnings,[]);assert.equal(JSON.stringify(source.investmentResearchCards),cardsBefore);
  assert.deepEqual(C.ratingTimeline(source.investmentResearchCards[0],source),[]);
  const frozen=JSON.stringify(snap);source.accounts[0].name='변경';source.ui.icAccumulationAccountIds=[];rows[0].recordedEvaluation=99999;
  source.investmentResearchCards[0].rating='EXIT';draft.accumulationSecurities[0].name='변경';
  assert.equal(JSON.stringify(source.investmentCommitteeSnapshots[0]),frozen);
});

test('read-only values stay unknown if missing; cross-currency holdings have no invented global weight',()=>{
  const {source,rows}=make();delete rows[0].recordedEvaluation;
  let acc=C.accumulationSecurities(source,rows);assert.deepEqual(acc[0].currentValues,[]);assert.equal(acc[0].weight,null);
  rows[0].recordedEvaluation=200;rows[4].recordedCurrency='USD';
  acc=C.accumulationSecurities(source,rows);assert.equal(acc[0].weight,null);assert.equal(acc[1].weight,null);
  assert.deepEqual(acc[0].currentValues,[{currency:'KRW',value:500}]);
});

test('canonical latest positions ignore old holdings and transaction fallback in explicitly empty accounts',()=>{
  const M=require('../hani-market-data.js'),{source}=make(),card=source.investmentResearchCards[0];
  const holding={instrumentId:card.instrumentId,name:card.name,ticker:card.ticker,quantity:2,currency:'KRW',evaluationAmount:200};
  source.investmentBrokerSnapshots=[
    {mode:'positions',recordType:'positions',status:'confirmed',period:'2026-09',accounts:[{accountId:'t',enabled:true,holdings:[holding]}]},
    {mode:'positions',recordType:'positions',status:'confirmed',period:'2026-10',accounts:[{accountId:'t',enabled:true,holdings:[]},{accountId:'k0',enabled:true,holdings:[holding]}]}
  ];
  const transaction=[{accountId:'t',instrumentId:card.instrumentId,qty:5}];
  const current=M.positions(source,transaction);
  assert.equal(current.length,1);assert.equal(C.accumulationInfo(card,source,current).kind,'accumulation');
  assert.doesNotMatch(C.buildPrompt(source,current),/삼성전자우/);
  assert.deepEqual(C.accumulationSecurities(source,current)[0].currentValues,[{currency:'KRW',value:200}]);
  source.investmentBrokerSnapshots[1].accounts[0].holdings=[holding];
  assert.equal(C.accumulationInfo(card,source,M.positions(source,transaction)).kind,'mixed');
});
