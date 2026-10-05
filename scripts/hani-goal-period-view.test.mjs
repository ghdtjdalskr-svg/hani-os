import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import core from '../data-hub/month-core.generated.mjs';
import {projectGoalPeriod} from '../data-hub/goal-period-view.mjs';
const main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const start=main.indexOf('const core=(()=>{'),end=main.indexOf('const store=(()=>{');
const original=new Function(main.slice(start,end)+';return core;')();
const period={type:'quarter',year:2026,quarter:1},asOf='2026-03-31',evaluationAt='2026-03-31T12:00:00+09:00';
const goal=(id,value,unit,semantics)=>({goal_id:id,revision:1,metric_id:id,goal_type:'quarter',year:2026,quarter:1,value,unit,semantics,effective_from:'2026-01-01',effective_to:'2026-03-31',created_at:'2026-01-01T00:00:00+09:00',status:'active'});
const source={books:[{status:'read',completedDate:'2026-01-12'},{status:'read',completedDate:'2026-03-14'}],body:[{date:'2026-03-14',weight:85,bmi:27,fat:25}],exercise:[],learningQuizzes:[],ledgerMonths:[],investmentBrokerSnapshots:[],goalRegistry:[goal('books_completed_count',10,'book','cumulative_total'),goal('body_bmi',25,'kg/m²','point_target')]};
const options={source,canonical:{},asOf,evaluationAt,period,metricIds:['books_completed_count','body_bmi']};
test('canonical monthly engine extraction matches actual source behavior',()=>{
 const o={month:'2026-03',asOf,calculatedAt:evaluationAt};assert.deepEqual(core.calculateMonth(source,o),original.calculateMonth(source,o));
});
test('projection uses real monthly records, missing months and BMI target without writes',()=>{
 const before=JSON.stringify(source),facts=projectGoalPeriod(options);
 const books=facts.find(x=>x.definition.metric_id==='books_completed_count');assert.equal(books.actual.value,2);assert.equal(books.actual.status,'PARTIAL');assert.deepEqual(books.actual.months_missing,['2026-02']);assert.equal(books.progress.achievement_rate,20);
 const bmi=facts.find(x=>x.definition.metric_id==='body_bmi');assert.equal(bmi.actual.value,27);assert.equal(bmi.progress.target,25);assert.equal(bmi.progress.gap,2);assert.equal(bmi.progress.interpretation,'unclassified');assert.equal(JSON.stringify(source),before);
});
test('annual targets do not substitute for quarterly targets, future data stays absent',()=>{
 const facts=projectGoalPeriod({...options,period:{type:'annual',year:2026}});assert.equal(facts[0].goal.status,'NO_GOAL');
 const future=projectGoalPeriod({...options,period:{type:'quarter',year:2027,quarter:1}});assert.equal(future[0].actual.value,null);assert.equal(future[0].actual.months_not_started.length,3);
});
test('original application read boundary hides facts on failed/stale owner verification',()=>{
 const a=main.indexOf('function goalPeriodReadContext(){'),b=main.indexOf('let cloudOwnerVerificationEpoch=',a);assert.ok(a>0&&b>a);
 let status='OWNER_BINDING_BLOCKED',binding=null,audits=0;
 const sandbox={state:source,structuredClone,Date,dataHubAuditSource(){audits++},dataHubRuntime:{peek:()=>({status,asOf})},dataHubBinding:()=>binding,brokerCalc:()=>({total:1}),ledgerCalc:()=>({jispiT:1})};
 vm.createContext(sandbox);vm.runInContext(main.slice(a,b),sandbox);assert.equal(sandbox.goalPeriodReadContext(),null);
 status='VERIFIED';assert.equal(sandbox.goalPeriodReadContext(),null);binding={userId:'synthetic'};
 const context=sandbox.goalPeriodReadContext();assert.equal(context.asOf,asOf);assert.notEqual(context.source,source);assert.equal(context.canonical.brokerTotal({}),1);
 binding=null;assert.equal(sandbox.goalPeriodReadContext(),null);assert.equal(audits,4);
});
