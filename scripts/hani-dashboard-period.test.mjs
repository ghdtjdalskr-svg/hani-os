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
