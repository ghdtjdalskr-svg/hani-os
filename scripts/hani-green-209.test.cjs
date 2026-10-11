const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../hani-investment-committee.js');
const fixture=require('./fixtures/investment-research-mock.json');
const card=()=>({...C.normalizeCard(fixture.cards[0]),id:'research-test',revision:1,lastReviewedAt:'2026-10-10T00:00:00Z',valuationNote:'기존 메모'});
const row=()=>({researchId:'research-test',agreeWithRating:'partly',concerns:['수익성 가정 확인'],missingRisks:['환율 위험'],fairValueSanity:{verdict:'too high',reason:'성장 가정의 근거가 부족합니다.'},oneLine:'가정을 더 확인해 주세요.'});
test('Gemini prompt preserves complete current cards, units and exact schema without mutation',()=>{
  const cards=[card()],before=JSON.stringify(cards),prompt=C.buildSecondOpinionPrompt(cards);
  const data=JSON.parse(prompt.split('현재 카드(JSON):\n')[1]);
  for(const key of ['rating','fairValue','fairValueLow','fairValueHigh','conviction','thesis','risks','invalidation','action','actionNote','conditions','currency','valuationNote'])assert.deepEqual(data[0][key],cards[0][key]??null,key);
  assert.deepEqual(JSON.parse(prompt.split('JSON Schema:\n')[1].split('\n현재 카드')[0]),C.SECOND_OPINION_SCHEMA);
  assert.equal(JSON.stringify(cards),before);assert.match(prompt,/비판 검토/);assert.throws(()=>C.buildSecondOpinionPrompt([]));
});
test('parser tolerates fences, prose, escaped braces and cards wrapper',()=>{
  const v=row();v.oneLine='문자열 안의 [배열]과 "인용"도 그대로';
  for(const raw of [JSON.stringify([v]),'설명\n```json\n'+JSON.stringify([v])+'\n```\n끝','먼저 [설명]을 보고 '+JSON.stringify({cards:[v]})+' 끝']){
    const before=JSON.stringify(card()),parsed=C.parseSecondOpinion(raw,[card()]);assert.equal(parsed[0].oneLine,v.oneLine);assert.equal(parsed[0].basis,C.secondOpinionBasis(card()));assert.equal(JSON.stringify(card()),before);
  }
});
test('parser rejects malformed, oversized, ambiguous and rating-changing input atomically',()=>{
  const bad=[{...row(),researchId:'unknown'},{...row(),agreeWithRating:'maybe'},{...row(),rating:'BUY'},{...row(),concerns:'위험'}, {...row(),fairValueSanity:{verdict:'reasonable'}},{...row(),oneLine:'x'.repeat(241)},{...row(),concerns:Array(13).fill('위험')}];
  for(const v of bad)assert.throws(()=>C.parseSecondOpinion(JSON.stringify([v]),[card()]));
  assert.throws(()=>C.parseSecondOpinion(JSON.stringify([row(),row()]),[card()]));assert.throws(()=>C.parseSecondOpinion(JSON.stringify([row()]),[card(),card()]));
  for(const raw of ['', '{}','[null]','x'.repeat(1000001),'[',JSON.stringify([{...row(),fairValueSanity:null}])])assert.throws(()=>C.parseSecondOpinion(raw,[card()]));
});
test('explicit note save uses existing rollback path; only note + audit metadata change',()=>{
  const source={investmentResearchCards:[card()],investmentResearchHistory:[{id:'history'}],investmentCommitteeSnapshots:[{id:'frozen',securitySnapshots:[card()]}]};
  const original=structuredClone(source), opinion=C.parseSecondOpinion(JSON.stringify([row()]),source.investmentResearchCards)[0];let calls=0;
  assert.deepEqual(source,original,'parse is memory only');
  C.saveSecondOpinionNote(source,opinion,()=>{calls++;return true;},{uid:()=>{throw Error('no history UUID needed');},month:'2026-10',now:'2026-10-11T00:00:00Z'});
  assert.equal(calls,1);assert.ok(source.investmentResearchCards[0].valuationNote.startsWith('기존 메모\n\n[2026-10 · 세린'));
  for(const key of C.FIELDS.filter(k=>k!=='valuationNote'))assert.deepEqual(source.investmentResearchCards[0][key],original.investmentResearchCards[0][key],key);
  assert.deepEqual(source.investmentResearchHistory,original.investmentResearchHistory);assert.deepEqual(source.investmentCommitteeSnapshots,original.investmentCommitteeSnapshots);
  assert.throws(()=>C.saveSecondOpinionNote(source,opinion,()=>true,{uid:()=>'',month:'2026-10'}),/이미/);
});
test('note failure/exception restores original arrays; stale card cannot save',()=>{
  for(const persist of [()=>false,()=>{throw Error('disk full');}]){
    const source={investmentResearchCards:[card()],investmentResearchHistory:[]},cards=source.investmentResearchCards,history=source.investmentResearchHistory;
    const opinion=C.parseSecondOpinion(JSON.stringify([row()]),cards)[0];
    assert.throws(()=>C.saveSecondOpinionNote(source,opinion,persist,{uid:()=>'',month:'2026-10'}));
    assert.equal(source.investmentResearchCards,cards);assert.equal(source.investmentResearchHistory,history);
    source.investmentResearchCards[0].fairValue=1;
    assert.throws(()=>C.saveSecondOpinionNote(source,opinion,()=>{throw Error('must not persist');},{uid:()=>''}),/변경/);
  }
});
