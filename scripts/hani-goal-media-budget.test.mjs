import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {projectGoalPeriod} from '../data-hub/goal-period-view.mjs';
import {suggestMonthlyBudget} from '../data-hub/period-goal.mjs';
const main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const start=main.indexOf('const GOAL_METRICS='),end=main.indexOf('function renderGoalRegistry(){',start);
const sandbox={Date,structuredClone,Intl,window:{},document:{},console};vm.createContext(sandbox);vm.runInContext(main.slice(start,end),sandbox);
test('media goal uses existing registry contract, positive integer count and future application date',()=>{
 const input={metric_id:'media_watched_count',value:12,goal_type:'quarter',year:2027,quarter:1,effective_from:'2027-01-01'},registry=[];
 const draft=sandbox.goalRegistryBuildDraft(registry,input,'2026-10-06T12:00:00+09:00','media');assert.equal(draft.entry.unit,'title');assert.equal(draft.entry.semantics,'cumulative_total');assert.equal(draft.entry.value,12);assert.equal(registry.length,0);
 for(const value of [0,-1,2.5])assert.throws(()=>sandbox.goalRegistryBuildDraft(registry,{...input,value},'2026-10-06T12:00:00+09:00','media'));
});
test('budget reference is latest non-future month; duplicate/missing/invalid references stop proposal',()=>{
 const rows=[{month:'2026-09',targetT:1000000},{month:'2026-08',targetT:900000},{month:'2027-01',targetT:2000000}],before=JSON.stringify(rows);
 const ref=sandbox.goalBudgetReference(rows,'2026-10');assert.equal(ref.month,'2026-09');assert.equal(suggestMonthlyBudget(ref.base).value,1150000);assert.equal(JSON.stringify(rows),before);
 assert.equal(sandbox.goalBudgetReference([...rows,{month:'2026-09',targetT:1000000}],'2026-10').status,'CONFLICT');
 for(const targetT of [null,0,-2,'bad'])assert.equal(sandbox.goalBudgetReference([{month:'2026-10',targetT}],'2026-10').status,'INVALID_REFERENCE');
 assert.equal(sandbox.goalBudgetReference([{month:'2027-01',targetT:1000}],'2026-10').status,'NO_REFERENCE');assert.equal(sandbox.goalBudgetReference(null,'2026-10').status,'NO_REFERENCE');
});
test('observed watched records feed quarterly actual/goal/pace; empty or invalid date is not confirmed zero',()=>{
 const source={movies:[{id:'a',status:'watched',watchedDate:'2026-01-05'},{id:'b',status:'watched',watchedDate:'2026-02-10'},{id:'c',status:'watching',watchedDate:'2026-02-10'}],goalRegistry:[{goal_id:'watch',revision:1,metric_id:'media_watched_count',goal_type:'quarter',year:2026,quarter:1,value:6,unit:'title',semantics:'cumulative_total',effective_from:'2026-01-01',effective_to:'2026-03-31',created_at:'2026-01-01T00:00:00+09:00',status:'active'}]};
 const options={source,canonical:{},asOf:'2026-03-31',evaluationAt:'2026-03-31T12:00:00+09:00',period:{type:'quarter',year:2026,quarter:1},metricIds:['media_watched_count']};
 const before=JSON.stringify(source),fact=projectGoalPeriod(options)[0];assert.equal(fact.actual.value,2);assert.equal(fact.actual.status,'PARTIAL');assert.equal(fact.progress.target,6);assert.ok(Math.abs(fact.progress.achievement_rate-100/3)<1e-9);assert.deepEqual(fact.actual.months_missing,['2026-03']);assert.equal(JSON.stringify(source),before);
 for(const movies of [[],[{status:'watched',watchedDate:''}],[{status:'watched',watchedDate:'2026-01-90'}]])assert.equal(projectGoalPeriod({...options,source:{...source,movies}})[0].actual.value,null);
});
