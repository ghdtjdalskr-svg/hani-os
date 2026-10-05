import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const begin=main.indexOf('// BEGIN GENERATED HANI DATA HUB'),end=main.indexOf('// END GENERATED HANI DATA HUB');
assert(begin>=0&&end>begin);
const window={};new Function('window',main.slice(begin,end))(window);
const api=window.HANI_DATA_HUB;
const source={investmentBrokerSnapshots:[],body:[],books:[],exercise:[],ledgerMonths:[],learningQuizzes:[]};
const before=JSON.stringify(source),binding={userId:'fixture-owner',sourceOwnerId:'fixture-owner',sourceOwnerVerified:true,datasetId:'fixture',projectRef:'fixture',sessionEpoch:'1'};
let selected=null,verified=true,checks=0;
const runtime=api.createDashboardRuntime({
  getSource:()=>source,getContext:()=>binding,getBinding:()=>verified?binding:null,
  verify:async()=>({status:verified?'VERIFIED':'OWNER_BINDING_BLOCKED'}),getMonth:()=>selected,
  canonical:{version:'fixture',brokerTotal:()=>0,ledgerSpending:()=>0},
  clock:()=> '2026-10-06T03:00:00Z',
  storeFactory:()=>({invalidate(){},async activate(){throw new Error('No persistent store in fixture')}})
});
for(const [requested,expected] of [[null,'2026-10'],['2026-09','2026-09'],['2025-12','2025-12'],['2027-01','2026-10'],['2026-13','2026-10']]){
  selected=requested;const view=await runtime.refresh();
  assert.equal(view.status,'VERIFIED');assert.equal(view.month,expected);
  assert.equal(view.asOf,'2026-10-06','selection must not forge the verification clock');
  assert.equal(view.metrics.length,6);assert(view.metrics.every(m=>m.row.month===expected));checks++;
}
selected='2026-09';assert.equal(runtime.peek().status,'OWNER_BINDING_BLOCKED','changed selection invalidates old view');checks++;
verified=false;runtime.invalidate();assert.equal((await runtime.refresh()).status,'OWNER_BINDING_BLOCKED');assert.equal(runtime.peek().metrics.length,0);checks++;
assert.equal(runtime.peek().reason,'OWNER_CHECK');
assert.equal(JSON.stringify(source),before,'source never changes');
assert(!main.slice(begin,end).includes('getMonth = () => null, clock = () => getMonth'), 'no date spoofing');
console.log(`PASS: ${checks} period cases; actual bundled runtime; real as-of preserved; blocked source remains hidden; source unchanged. Not authenticated UI QA.`);
const helperStart=main.indexOf('function dataHubLatestRecordMonth('),helperEnd=main.indexOf('\nlet cloudOwnerVerificationEpoch',helperStart);
assert(helperStart>0&&helperEnd>helperStart);
const latest=new Function(main.slice(helperStart,helperEnd)+'\nreturn dataHubLatestRecordMonth;')();
assert.equal(latest({body:[{date:'2026-09-01'},{date:'2027-01-01'}],books:[{readDate:'2026-08-30'}]},'2026-10'),'2026-09');
assert.equal(latest({body:[{date:'bad'}],ledgerMonths:[{month:'2026-13'}]},'2026-10'),null);
assert.equal(latest({},'2026-10'),null);
console.log('PASS: latest-input-month dates, future rejection, missing dates; no metric values fabricated.');
const privateFailure=api.createDashboardRuntime({getSource:()=>source,getContext:()=>binding,getBinding:()=>null,
 verify:async()=>({status:'OWNER_BINDING_BLOCKED',reason:'SECRET_OR_PRIVATE_DIAGNOSTIC'}),canonical:{version:'fixture'}});
await privateFailure.refresh();assert.equal(privateFailure.peek().reason,'OWNER_CHECK','arbitrary error content never printed');
console.log('PASS: safe diagnostic reason allowlist; arbitrary details hidden.');

const monthlySource={...structuredClone(source),investmentBrokerSnapshots:[
 {mode:'actual',status:'confirmed',period:'2026-08',snapshotDate:'2026-08-31',total:100},
 {mode:'actual',status:'confirmed',period:'2026-09',snapshotDate:'2026-09-30',total:120},
 {mode:'actual',status:'draft',period:'2026-10',snapshotDate:'2026-10-01',total:999},
 {mode:'actual',status:'confirmed',period:'2026-11',snapshotDate:'2026-11-01',total:999}
],ledgerMonths:[
 {month:'2026-08',items:[{date:'2026-08-10',category:'variable',amount:50}]},
 {month:'2026-09',items:[{date:'2026-09-10',category:'variable',amount:70}]},
 {month:'2026-10',items:[{date:'2026-10-01',category:'variable',amount:900}]}
],body:[{date:'2026-09-30',weight:90}]};
const monthlyBefore=JSON.stringify(monthlySource);
let query='2026-10',now='2026-10-06T03:00:00Z';
const monthly=api.createDashboardRuntime({getSource:()=>monthlySource,getContext:()=>binding,getBinding:()=>binding,
 verify:async()=>({status:'VERIFIED'}),getMonth:()=>query,clock:()=>now,
 getGoals:()=>[3,4].map(quarter=>({metric_id:'spending_jispi_krw',goal_id:`budget-${quarter}`,revision:1,
  goal_type:'quarter',year:2026,quarter,status:'active',unit:'KRW',semantics:'monthly_budget',value:quarter===3?100:1000,
  effective_from:quarter===3?'2026-07-01':'2026-10-01',created_at:'2026-07-01T00:00:00Z'})),
 canonical:{version:'fixture',brokerTotal:r=>r.total,ledgerSpending:r=>r.items.reduce((s,i)=>s+i.amount,0)},
 storeFactory:()=>({invalidate(){},async activate(){throw new Error('Isolated memory store')}})});
let result=await monthly.refresh();
const metric=(key)=>result.metrics.find(m=>m.key===key);
assert.equal(result.month,'2026-10');
assert.equal(metric('hasdaq').row.month,'2026-09');assert.equal(metric('hasdaq').row.value,120);
assert.equal(metric('hasdaq').comparison.baseline.month,'2026-08');assert.equal(metric('hasdaq').comparison.delta_absolute,20);
assert(api.dashboardText(metric('hasdaq')).basis.includes('2026-09-30'));
assert.equal(metric('jispi').row.month,'2026-09');assert.equal(metric('jispi').row.value,70);
assert(api.dashboardText(metric('jispi')).basis.includes('2026-08-18~2026-09-17'));
assert.equal(metric('jispi').row.status,'PARTIAL','unverified coverage is not relabeled confirmed');
assert.equal(metric('jispi').comparison.target,100,'September spending must not use October quarter budget');
assert.equal(metric('jispi').comparison.usage_rate,70);
assert.equal(metric('ne100').row.month,'2026-10');assert.equal(metric('ne100').row.value,null,'daily card never carries September forward');
query='2026-08';result=await monthly.refresh();assert.equal(metric('hasdaq').row.value,100);assert.equal(metric('hasdaq').comparison.baseline,null,'missing exact previous month is not inferred');
query='2026-07';result=await monthly.refresh();assert.equal(metric('hasdaq').row.value,null);assert.equal(metric('jispi').row.value,null,'no future record backfill');
query='2026-10';now='2026-10-18T03:00:00Z';result=await monthly.refresh();assert.equal(metric('jispi').row.month,'2026-10');assert.equal(metric('jispi').row.value,900,'closed current settlement becomes eligible');assert.equal(metric('jispi').comparison.target,1000);
monthlySource.ledgerMonths[2].items=[];monthly.invalidate();result=await monthly.refresh();assert.equal(metric('jispi').row.month,'2026-09','empty unverified ledger cannot become a confirmed zero');
monthlySource.ledgerMonths[2].items=[{date:'2026-10-01',category:'variable',amount:900}];
assert.equal(JSON.stringify(monthlySource),monthlyBefore,'monthly derivation never changes source');
console.log('PASS: monthly cadence, true basis/date, exact baseline, open/closed settlement, draft/future rejection, empty unverified zero rejection, daily scope, source preservation.');
