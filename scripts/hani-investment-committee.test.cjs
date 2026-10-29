/* Synthetic data; direct node execution avoids node --test subprocess restrictions. */
const test = require('node:test');
const assert = require('node:assert/strict');
const inputContext=require('node:vm').createContext({Date});require('./qa-1st-test-support.cjs').loadInputHelpers(inputContext);global.validateEntryDates=inputContext.validateEntryDates;
const C = require('../hani-investment-committee.js');
const fixture = require('./fixtures/investment-research-mock.json');
const state = () => ({investmentResearchCards: fixture.cards.map((c,i) => ({...C.normalizeCard(c),id:'r'+i})),investmentResearchHistory:[],investmentCommitteeSnapshots:[]});
const options = () => {let serial=0;return {uid:()=> 's'+ ++serial,now:'2026-10-11T00:00:00Z'};};
const confirm = (s, month, opts=options()) => C.confirmCommittee(s,C.committeeDraft(s,month),()=>true,opts);

test('KST formatting handles UTC day/month/year boundaries and KST input without raw ISO',()=>{
  assert.equal(C.kst('2026-10-09T01:00:00Z','price'),'10/09 10:00');
  assert.equal(C.kst('2026-10-10T16:00:00Z'),'2026.10.11');
  assert.equal(C.kst('2026-12-31T15:00:00Z','datetime'),'2027.01.01 00:00');
  assert.equal(C.monthNow('2026-09-30T15:00:00Z'),'2026-10');
  assert.equal(C.kst('2026-10-11'),'2026.10.11');
  assert.equal(C.kst('2026.10.11 10:00','price'),'10/11 10:00');
  assert.equal(C.kst('invalid'),'시각 미확인');
  assert.equal(C.inputDate('2026.10.11 10:00'),'2026-10-11T01:00:00.000Z');
  const old='2026-10-09T01:00:34Z';assert.equal(C.inputDate(C.kst(old,'datetime'),old),old);
  assert.throws(()=>C.inputDate('invalid'));
});

test('draft is memory-only; card comparison and price suggestions come from real values',()=>{
  const s=state(),before=JSON.stringify(s),draft=C.committeeDraft(s,'2026-09');
  assert.equal(JSON.stringify(s),before);assert.equal(draft.newWatchlist.length,3);
  assert.deepEqual(draft.strengthened,[]);assert.deepEqual(draft.weakened,[]);
  assert.deepEqual(draft.valuationAlerts,[]);assert.deepEqual(draft.deepValue,[]);
  confirm(s,'2026-09');
  s.investmentResearchCards[0].rating='STRONG BUY';s.investmentResearchCards[0].thesisStrength='STRONG';
  s.investmentResearchCards[1].rating='EXIT';s.investmentResearchCards[1].thesisStrength='WEAK';
  s.investmentResearchCards[2].manualPrice={value:50000,currency:'KRW',asOf:'2026-10-11'};
  s.investmentResearchCards[3].manualPrice={value:200,currency:'USD',asOf:'2026-10-11'};
  const next=C.committeeDraft(s,'2026-10');
  assert.equal(next.strengthened.length,1);assert.match(next.strengthened[0],/삼성전자우/);
  assert.equal(next.weakened.length,1);assert.match(next.weakened[0],/LG전자우/);
  assert.deepEqual(next.newWatchlist,[]);assert.match(next.deepValue[0],/오리온/);
  assert.match(next.valuationAlerts[0],/NVIDIA/);
  assert.equal(next.actionPlan.length,6);
});

test('snapshot freezes OWNED/WATCH cards, derived values, quotes and holdings by deep copy',()=>{
  const s=state(),opts=options();
  s.investmentResearchCards[5].status='ARCHIVED';
  s.investmentResearchHistory.push({researchId:'r0',changedAt:'2026-10-09T00:00:00Z',changes:{rating:{from:'HOLD',to:'BUY'}}});
  const quotes={stocks:[{symbol:'005935',market:'KR',currency:'KRW'}],quotes:[{symbol:'005935',currency:'KRW',lastPrice:50000,timestamp:'2026-10-09T01:00:00Z'}]};
  const holdingRows=[{instrumentId:'mock-samsung-pref',quantity:3,accountId:'a',key:'a:1',holdingAsOf:'2026-10-09',extra:{kept:true}}];
  const draft=C.committeeDraft(s,'2026-10',quotes,holdingRows);draft.executiveSummary='당시 요약';draft.actionPlan=['직접 편집한 계획'];
  const snap=C.confirmCommittee(s,draft,()=>true,{...opts,priceSource:quotes,holdingRows});
  assert.equal(snap.securitySnapshots.length,5);const card=snap.securitySnapshots[0];
  assert.equal(card.previousRating,'HOLD');assert.equal(card.currentPrice.value,50000);
  assert.equal(card.currentPrice.asOf,'2026-10-09T01:00:00Z');assert.match(card.currentPrice.source,/기존 시세/);
  assert.ok(Math.abs(card.upside-30)<1e-10);assert.equal(card.downside,0);assert.equal(card.convictionScore,0);
  assert.equal(card.holdingsRefs[0].quantity,3);assert.deepEqual(snap.actionPlan,['직접 편집한 계획']);
  const frozen=JSON.stringify(snap);
  Object.assign(s.investmentResearchCards[0],{rating:'EXIT',fairValue:1});
  s.investmentResearchCards[0].thesis[0]='변경';s.investmentResearchCards[0].conviction.dimensions[0].score=25;
  quotes.quotes[0].lastPrice=90000;holdingRows[0].extra.kept=false;draft.actionPlan.push('추가');
  assert.equal(JSON.stringify(s.investmentCommitteeSnapshots[0]),frozen);
  assert.equal(C.latestSnapshot(s,'2026-10').executiveSummary,'당시 요약');
});

test('one-per-month guard rejects duplicate confirmation before persist; separate months allowed',()=>{
  const s=state(),opts=options();confirm(s,'2026-09',opts);let saves=0;
  const before=JSON.stringify(s);assert.throws(()=>C.confirmCommittee(s,C.committeeDraft(s,'2026-09'),()=>{saves++;return true;},opts),/이미 확정/);
  assert.equal(saves,0);assert.equal(JSON.stringify(s),before);confirm(s,'2026-10',opts);
  assert.equal(s.investmentCommitteeSnapshots.length,2);
  assert.throws(()=>C.prepareSnapshot(s,{reviewMonth:'2026-13'},opts));
  assert.throws(()=>C.prepareSnapshot(s,{reviewMonth:'2026-11'},{...opts,revision:true}),/원본/);
});

test('explicit revisions append and keep originals; latest revision used for next month comparison',()=>{
  const s=state(),opts=options(),first=confirm(s,'2026-09',opts),before=JSON.stringify(first);
  s.investmentResearchCards[0].rating='HOLD';
  const revised=C.confirmCommittee(s,C.committeeDraft(s,'2026-09'),()=>true,{...opts,revision:true});
  assert.equal(revised.revision,2);assert.equal(revised.supersedesId,first.id);assert.notEqual(revised.id,first.id);
  assert.equal(JSON.stringify(first),before);assert.equal(s.investmentCommitteeSnapshots.length,2);
  assert.equal(C.latestSnapshot(s,'2026-09').id,revised.id);
  assert.equal(C.priorSnapshot(s,'2026-10').id,revised.id);assert.deepEqual(C.committeeDraft(s,'2026-10').weakened,[]);
  const third=C.confirmCommittee(s,C.committeeDraft(s,'2026-09'),()=>true,{...opts,revision:true});assert.equal(third.revision,3);
});

test('failed confirm restores original snapshot array reference and unrelated data',()=>{
  for(const persist of [()=>false,()=>{throw Error('quota');}]){
    const s=state(),opts=options();confirm(s,'2026-09',opts);s.unrelated={kept:true};
    const before=JSON.stringify(s),array=s.investmentCommitteeSnapshots;
    assert.throws(()=>C.confirmCommittee(s,C.committeeDraft(s,'2026-10'),persist,opts));
    assert.equal(s.investmentCommitteeSnapshots,array);assert.equal(JSON.stringify(s),before);
  }
});

test('overlap derives actual distinct OWNED cards only, ignores WATCH/archived and unspecified themes',()=>{
  const s=state(),cards=s.investmentResearchCards;
  cards.forEach(c=>{c.themes=['반도체','반도체'];c.portfolioRoles.tags=['배당'];});
  let summary=C.portfolioSummary(cards,[{instrumentId:'mock-samsung-pref',quantity:3},{instrumentId:'mock-samsung-pref',quantity:0}]);
  assert.equal(summary.themes[0].securities.length,6);assert.equal(summary.themes[0].ownedCount,3);
  assert.deepEqual(summary.overlapWarnings,[{theme:'반도체',level:'HIGH',ownedCount:3,holdingCount:1}]);
  assert.equal(summary.roles[0].securities.length,6);
  cards[2].status='WATCH';assert.deepEqual(C.portfolioSummary(cards).overlapWarnings,[]);
  cards[2].status='ARCHIVED';assert.equal(C.portfolioSummary(cards).themes[0].securities.length,5);
  cards.forEach(c=>c.themes=[]);assert.deepEqual(C.portfolioSummary(cards).overlapWarnings,[]);
  assert.deepEqual(C.portfolioSummary([]),{themes:[],roles:[],overlapWarnings:[]});
});

test('monthly rating points merge with change log by date; preserved values survive live edits',()=>{
  const s=state(),opts=options();opts.now='2026-09-11T00:00:00Z';confirm(s,'2026-09',opts);
  s.investmentResearchHistory.push({id:'h',researchId:'r0',changedAt:'2026-10-01T00:00:00Z',changes:{rating:{from:'BUY',to:'HOLD'}}});
  s.investmentResearchCards[0].rating='HOLD';opts.now='2026-10-11T00:00:00Z';confirm(s,'2026-10',opts);
  const rows=C.ratingTimeline(s.investmentResearchCards[0],s);assert.deepEqual(rows.map(r=>r.kind),['monthly','change','monthly']);
  assert.equal(rows[0].rating,'HOLD');assert.equal(rows[2].rating,'BUY');
  s.investmentResearchCards[0].fairValue=1;assert.equal(C.ratingTimeline(s.investmentResearchCards[0],s)[2].fairValue,65000);
  assert.deepEqual(C.ratingTimeline(null,s),[]);
});
