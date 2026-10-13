// Synthetic final review contract QA. No account, network or storage writes.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),C=require('../hani-investment-committee.js');
const fixture=JSON.parse(fs.readFileSync(new URL('fixtures/investment-research-mock.json',import.meta.url),'utf8'));
const cards=()=>fixture.cards.slice(0,3).map((v,i)=>({...C.normalizeCard(v),id:'final-'+i,createdAt:'2026-10-11T00:00:00Z',updatedAt:'2026-10-11T00:00:00Z',lastReviewedAt:'2026-10-11'}));
const seconds=cs=>C.parseSecondOpinion(JSON.stringify(cs.map(c=>({researchId:c.id,agreeWithRating:'partly',concerns:['수익 가정 과대'],missingRisks:['환율 민감도'],fairValueSanity:{verdict:'reasonable',reason:'자료 부족'},oneLine:'반론 요약'}))),cs);
const reply=cs=>cs.map((c,i)=>({ticker:c.ticker,name:c.name,final_rating:['유지','상향','하향'][i%3],changed:i%3!==0,accepted:['환율 위험 반영: 수익에 영향'],rejected:[{point:'수익 가정 과대',reason:'최근 공시로 확인'}],rationale:['경쟁력 유지','추정 범위 보수화','다음 실적 확인'],next_checks:['다음 실적 발표']}));
const options=()=>{let seq=0;return {month:'2026-10',now:'2026-10-14T00:00:00Z',uid:()=>`final-test-${++seq}`};};

test('one Korean final prompt includes complete original fields, every critique, exact request and strict schema',()=>{
 const cs=cards(),ss=seconds(cs),before=JSON.stringify(cs),prompt=C.buildFinalReviewPrompt(cs,ss);
 const data=JSON.parse(prompt.split('자료(JSON):\n')[1].split('\n엄격한 JSON Schema:')[0]);
 assert.equal(data.length,cs.length);
 for(let i=0;i<cs.length;i++){
  for(const field of C.FIELDS)assert.deepEqual(data[i].hani_original_report[field],cs[i][field]??null);
  for(const field of C.SECOND_OPINION_SCHEMA.items.required)assert.deepEqual(data[i].gemini_critique[field],ss[i][field]);
  assert.equal(data[i].gemini_critique.agreement,'일부 동의');
 }
 assert.match(prompt,/Gemini 반론을 항목별로 검토해 반영\/기각과 이유를 밝히고, 최종 투자의견\(유지\/상향\/하향\)과 근거 3줄, 다음 확인 포인트를 주세요. 아래 JSON 형식으로 답하세요\./);
 assert.deepEqual(JSON.parse(prompt.split('엄격한 JSON Schema:\n')[1]),C.FINAL_REVIEW_SCHEMA);
 assert.equal(C.FINAL_REVIEW_SCHEMA.items.additionalProperties,false);
 assert.equal(C.FINAL_REVIEW_SCHEMA.items.properties.rejected.items.additionalProperties,false);
 assert.equal(JSON.stringify(cs),before);
});
test('parser accepts plain/fenced arrays including surrounding prose and binds each stock to its critique',()=>{
 const cs=cards(),ss=seconds(cs),json=JSON.stringify(reply(cs));
 for(const raw of [json,'```json\n'+json+'\n```','최종 의견입니다.\n```JSON\n'+json+'\n```']){
  const parsed=C.parseFinalReview(raw,cs,ss);
  assert.equal(parsed.length,3);
  for(let i=0;i<3;i++){assert.equal(parsed[i].researchId,cs[i].id);assert.equal(parsed[i].basis,C.finalReviewBasis(cs[i],ss[i]));assert.equal(parsed[i].final_rating,['유지','상향','하향'][i]);}
 }
});
test('malformed JSON and invalid strict fields, arrays, changed flags and identities get friendly Korean errors',()=>{
 const cs=cards(),ss=seconds(cs),good=reply(cs);
 for(const raw of ['', '[null]', '```json\n[broken\n```','[]','[1]'])assert.throws(()=>C.parseFinalReview(raw,cs,ss),/JSON 배열.*붙여넣으세요/);
 const variants=[
  {changed:'true'},{changed:true},{final_rating:'BUY'},{name:'없는 종목'},{ticker:'UNKNOWN'},{extra:'금지'},
  {accepted:'문자열'},{accepted:[1]},{accepted:[' ']},{accepted:Array(13).fill('반영')},
  {rejected:[{point:'우려'}]},{rejected:[{point:'우려',reason:'이유',extra:1}]},{rejected:[null]},
  {rationale:['두','줄']},{rationale:['a','b','c','d']},{next_checks:[{}]},{name:'x'.repeat(201)}
 ];
 for(const variant of variants)assert.throws(()=>C.parseFinalReview(JSON.stringify([{...good[0],...variant}]),cs,ss),/주세요/);
 const missing={...good[0]};delete missing.changed;
 assert.throws(()=>C.parseFinalReview(JSON.stringify([missing]),cs,ss),/필수 필드/);
 assert.throws(()=>C.parseFinalReview(JSON.stringify([good[0],good[0]]),cs,ss),/중복/);
 assert.throws(()=>C.parseFinalReview(JSON.stringify([good[0]]),cs,[]),/먼저 Gemini/);
 const stale=structuredClone(cs);stale[0].rating='EXIT';
 assert.throws(()=>C.parseFinalReview(JSON.stringify(good),stale,ss),/종목이 변경/);
});
test('existing memo save adds final text only, preserves all card fields and frozen reports, blocks duplicate saves',()=>{
 const cs=cards(),ss=seconds(cs),final=C.parseFinalReview(JSON.stringify(reply(cs)),cs,ss);
 const state={investmentResearchCards:cs,investmentResearchHistory:[],investmentCommitteeSnapshots:[{id:'frozen',text:'확정 원본'}]},before=structuredClone(state);
 let saves=0;
 const opt={...options(),finalOpinion:final[0]};
 assert.equal(saves,0);assert.deepEqual(state,before);
 C.saveSecondOpinionNote(state,ss[0],()=>{saves++;return true;},opt);
 assert.equal(saves,1);
 const saved=state.investmentResearchCards[0];
 assert.ok(saved.valuationNote.includes(C.secondOpinionNote(ss[0],opt.month)));
 assert.ok(saved.valuationNote.includes(C.finalReviewNote(final[0],opt.month)));
 assert.match(saved.valuationNote,/하니 최종 의견 \(대표님 채팅에서 받은 답\)/);
 assert.match(saved.valuationNote,/최종 근거:\n경쟁력 유지\n추정 범위 보수화\n다음 실적 확인/);
 for(const field of Object.keys(cs[0]).filter(k=>k!=='valuationNote'&&k!=='updatedAt'))assert.deepEqual(saved[field],cs[0][field]);
 assert.deepEqual(state.investmentCommitteeSnapshots,before.investmentCommitteeSnapshots);
 assert.equal(state.investmentResearchHistory.length,0);
 assert.throws(()=>C.saveSecondOpinionNote(state,ss[0],()=>{saves++;return true;},opt),/이미 메모/);assert.equal(saves,1);
});
test('saving critique first then final adds no duplicate critique; failures roll back and stale final cannot save',()=>{
 const cs=cards(),ss=seconds(cs),final=C.parseFinalReview(JSON.stringify(reply(cs)),cs,ss),opt=options();
 const state={investmentResearchCards:cs,investmentResearchHistory:[],investmentCommitteeSnapshots:[]};
 C.saveSecondOpinionNote(state,ss[0],()=>true,opt);
 const before=JSON.stringify(state);
 assert.throws(()=>C.saveSecondOpinionNote(state,ss[0],()=>false,{...opt,finalOpinion:final[0]}),/저장/);
 assert.equal(JSON.stringify(state),before);
 C.saveSecondOpinionNote(state,ss[0],()=>true,{...opt,finalOpinion:final[0]});
 assert.equal(state.investmentResearchCards[0].valuationNote.split(C.secondOpinionNote(ss[0],opt.month)).length,2);
 const altered={...ss[1],oneLine:'새 반론'};let saves=0;
 assert.throws(()=>C.saveSecondOpinionNote(state,altered,()=>{saves++;return true;},{...opt,finalOpinion:final[1]}),/검토 내용이 바뀌/);assert.equal(saves,0);
});
