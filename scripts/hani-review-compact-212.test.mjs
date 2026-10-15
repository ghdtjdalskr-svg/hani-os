// Synthetic read-only revision projection; existing saves remain covered by final-review tests.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url), C = require('../hani-investment-committee.js');
const fixture = require('./fixtures/investment-research-mock.json');
const cards = () => fixture.cards.slice(0,3).map((c,i) => ({...C.normalizeCard(c),id:'compact-'+i,rating:'HOLD'}));
const final = (c,rating='유지') => ({researchId:c.id,final_rating:rating,changed:rating!=='유지',accepted:['반영 근거'],rejected:[{point:'반론',reason:'기각 근거'}],rationale:['핵심 근거 한 줄','두 번째 근거','세 번째 근거'],next_checks:['다음 확인']});
const source = cs => ({investmentResearchCards:cs,investmentCommitteeSnapshots:[{id:'frozen',reviewMonth:'2026-10',revision:1,securitySnapshots:structuredClone(cs)}]});

test('session finals project one editable line per reviewed stock without changing cards or snapshots', () => {
  const cs=cards(),s=source(cs),before=JSON.stringify(s),finals=[final(cs[0]),final(cs[1],'상향'),final(cs[2],'하향')];
  const rows=C.revisionReviewSummaries(s,'2026-10',finals);
  assert.deepEqual(rows.map(r=>r.summary),cs.map((c,i)=>c.name+' · 최종 '+finals[i].final_rating+' · 핵심 근거 한 줄'));
  assert.deepEqual(rows.map(r=>r.targetRating),[null,'BUY','REDUCE']);
  assert.equal(JSON.stringify(s),before);
});

test('latest saved memo from selected month is recovered and other months are excluded', () => {
  const cs=cards(),s=source(cs);
  cs[0].valuationNote=C.finalReviewNote(final(cs[0],'상향'),'2026-09');
  cs[1].valuationNote=C.finalReviewNote(final(cs[1],'上向'),'2026-10');
  assert.deepEqual(C.revisionReviewSummaries(s,'2026-10'),[]);
  cs[0].valuationNote+='\n\n'+C.finalReviewNote(final(cs[0],'상향'),'2026-10');
  cs[1].valuationNote=C.finalReviewNote(final(cs[1],'하향'),'2026-10');
  let rows=C.revisionReviewSummaries(s,'2026-10');
  assert.equal(rows.length,2);assert.equal(rows[0].targetRating,'BUY');assert.equal(rows[1].targetRating,'REDUCE');
  cs[0].rating='BUY';cs[1].rating='REDUCE';
  assert.deepEqual(C.revisionReviewSummaries(s,'2026-10').map(r=>r.targetRating),[null,null]);
  cs[0].valuationNote+='\n\n'+C.finalReviewNote(final(cs[0]),'2026-10');
  assert.equal(C.revisionReviewSummaries(s,'2026-10')[0].finalRating,'유지');
});

test('session takes precedence, boundary ratings stay put, incomplete memos do not invent conclusions', () => {
  const cs=cards(),s=source(cs);
  cs[0].rating='STRONG BUY';cs[1].rating='EXIT';
  cs[0].valuationNote=C.finalReviewNote(final(cs[0],'하향'),'2026-10');
  assert.deepEqual(C.revisionReviewSummaries(s,'2026-10',[final(cs[0],'상향'),final(cs[1],'하향')]).map(r=>r.targetRating),[null,null]);
  cs[2].valuationNote='[2026-10 · 하니 최종 의견 (대표님 채팅에서 받은 답)]\n최종 투자의견: 상향';
  assert.equal(C.revisionReviewSummaries(s,'2026-10').length,1);
  delete s.investmentCommitteeSnapshots;
  assert.equal(C.revisionReviewSummaries(s,'2026-10')[0].targetRating,null);
});
