import test from 'node:test';
import assert from 'node:assert/strict';
import {guidancePreview,nextGuidancePeriod} from '../data-hub/guidance-preview.mjs';
import {projectGoalPeriod} from '../data-hub/goal-period-view.mjs';
const period={type:'quarter',year:2026,quarter:3};
const source={body:[],books:[],movies:[],exercise:[{id:'1',date:'2026-08-01',steps:1000},{id:'2',date:'2026-09-01',steps:9000},{id:'3',date:'2026-09-02',steps:9000}],learningQuizzes:[{id:'q1',status:'completed',completedAt:'2026-08-01T00:00:00Z',total:10,correctCount:10},{id:'q2',status:'completed',completedAt:'2026-09-01T00:00:00Z',total:30,correctCount:15}],investmentBrokerSnapshots:[],ledgerMonths:[{month:'2026-09',items:[{date:'2026-08-18',category:'variable',amount:100},{date:'2026-09-18',category:'variable',amount:999}]}],goalRegistry:[]};
const options={source,period,asOf:'2026-09-30',evaluationAt:'2026-10-07T00:00:00Z',canonical:{ledgerSpending:r=>r.items.reduce((s,r)=>s+r.amount,0)},metricIds:['steps_daily_average','quiz_accuracy_percent','spending_jispi_krw','media_watched_count']};
test('quarter report weights days/questions and obeys settlement cutoff without source writes',()=>{
 const before=JSON.stringify(source),facts=projectGoalPeriod(options),value=id=>facts.find(x=>x.definition.metric_id===id).actual.value;assert.equal(value('steps_daily_average'),19000/3);assert.equal(value('quiz_accuracy_percent'),62.5);assert.equal(value('spending_jispi_krw'),100);assert.equal(value('media_watched_count'),null);assert.equal(JSON.stringify(source),before);
});
test('monthly report uses the same period projection and missing works remain unknown',()=>{
 const facts=projectGoalPeriod({...options,period:{type:'month',year:2026,month:9}}),value=id=>facts.find(x=>x.definition.metric_id===id).actual.value;assert.equal(value('steps_daily_average'),9000);assert.equal(value('quiz_accuracy_percent'),50);assert.equal(value('spending_jispi_krw'),100);assert.equal(value('media_watched_count'),null);
});
test('guidance is an explicit keep/set/review draft, never inferred raising or lowering',()=>{
 const facts=projectGoalPeriod(options),before=JSON.stringify(facts);let draft=guidancePreview(facts,period);assert(draft.every(d=>d.action==='SET'&&d.value===null));
 draft=guidancePreview([{...facts[0],progress:{goal_status:'RESOLVED',target:10000}},{...facts[1],progress:{goal_status:'CONFLICT',target:null}}],period);assert.equal(draft[0].action,'KEEP');assert.equal(draft[0].value,10000);assert.equal(draft[1].action,'REVIEW');assert.deepEqual(draft[0].period,{type:'quarter',year:2026,quarter:4});assert.equal(JSON.stringify(facts),before);
});
test('next quarter rolls year, annual rolls year, invalid period rejected',()=>{
 assert.deepEqual(nextGuidancePeriod({type:'quarter',year:2026,quarter:4}),{type:'quarter',year:2027,quarter:1});assert.deepEqual(nextGuidancePeriod({type:'annual',year:2026}),{type:'annual',year:2027});assert.throws(()=>nextGuidancePeriod({type:'annual',year:2100}));assert.throws(()=>nextGuidancePeriod({type:'month',year:2026,month:9}));
});
