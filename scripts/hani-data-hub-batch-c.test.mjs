import assert from 'node:assert/strict';
import test from 'node:test';
import {createDashboardRuntime, dashboardText} from '../data-hub/dashboard-runtime.mjs';
import {DEFAULT_REGISTRY} from '../data-hub/metrics-core.mjs';
const binding = {projectRef: 'synthetic', userId: 'A', sourceOwnerId: 'A', datasetId: 'life', sessionEpoch: '1', sourceOwnerVerified: true};
const source = () => ({investmentBrokerSnapshots: ['08','09','10'].map((m,i)=>({id:m,mode:'actual',status:'confirmed',period:'2026-'+m,
  snapshotDate:'2026-'+m+'-02',accounts:[{enabled:true,estimatedAssets:100+i*10}]})),
  body:['08','09','10'].map((m,i)=>({id:m,date:'2026-'+m+'-02',weight:100-i})),
  books:[{id:'b1',status:'read',readDate:'2026-09-01'},{id:'b2',status:'read',readDate:'2026-10-01'}],
  movies:[{status:'watched',watchedDate:'2026-10-01'}],
  exercise:[{id:'s1',date:'2026-10-01',steps:8000},{id:'s2',date:'2026-10-02',steps:12000},{id:'s0',date:'2026-10-03',steps:0}],
  ledgerMonths:[{id:'l',month:'2026-10',periodStart:'2026-09-18',periodEnd:'2026-10-17',items:[{date:'2026-09-20',category:'variable',amount:400}]}],
  learningQuizzes:[{id:'q1',status:'completed',completedAt:'2026-10-01T00:00:00Z',total:10,correctCount:10},
    {id:'q2',status:'completed',completedAt:'2026-10-02T00:00:00Z',total:30,correctCount:15}]});
function harness(extra={}) {
  let data=source(), liveBinding=binding, verifies=0, writes=0;
  let cached=null;
  const runtime=createDashboardRuntime({getSource:()=>data,getContext:()=>liveBinding,getBinding:()=>liveBinding,
    verify:async()=>{verifies++;return {status:liveBinding?'VERIFIED':'OWNER_BINDING_BLOCKED'}},
    clock:()=> '2026-10-03T03:00:00Z',canonical:{version:'synthetic',brokerTotal:r=>r.accounts[0].estimatedAssets,
      ledgerSpending:r=>r.items.reduce((sum,i)=>sum+i.amount,0)},
    storeFactory:()=>({invalidate(){},async activate(){},async readActive(expected){return cached?
      {status:!expected||cached.metadata.content_hash===expected.metadata.content_hash?'READY':'STALE',rows:structuredClone(cached.rows),generation:{generation_id:'g'}}:
      {status:'CACHE_MISS',rows:[],generation:null}},async publish(prepared){writes++;cached=structuredClone(prepared);return{status:'PUBLISHED'}}}),...extra});
  return {runtime,get data(){return data},set data(v){data=v},get verifies(){return verifies},get writes(){return writes},
    set binding(v){liveBinding=v}};
}
test('six consumers, immutable source, exact previous month, books only, positive steps, weighted quiz, no default goals',async()=>{
  const h=harness(), before=JSON.stringify(h.data),view=await h.runtime.refresh();
  assert.equal(view.status,'VERIFIED');assert.equal(view.metrics.length,6);assert.equal(h.writes,1);
  assert.equal(view.metrics[0].comparison.baseline.month,'2026-09');
  assert.equal(view.metrics[2].row.value,1);assert.equal(view.metrics[3].row.value,10000);
  assert.equal(view.metrics[3].row.observed_days,2);assert.ok(dashboardText(view.metrics[3]).detail.includes('0보'));
  assert.equal(view.metrics[5].row.value,62.5);
  for(const m of view.metrics.slice(3))assert.equal(dashboardText(m).comparison,'Target not set');
  assert.equal(view.metrics[4].row.period_start,'2026-09-18');assert.equal(JSON.stringify(h.data),before);
  for(let i=0;i<50;i++)h.runtime.peek();await h.runtime.refresh();assert.equal(h.verifies,1);assert.equal(h.writes,1);
  h.runtime.invalidate();const hit=await h.runtime.refresh();assert.equal(hit.cache,'CACHE_HIT');assert.equal(h.writes,1);
});
test('August exists, September missing, October current: no substituted baseline for HASDAQ / N&E / READ',async()=>{
  const h=harness();h.data.investmentBrokerSnapshots=h.data.investmentBrokerSnapshots.filter(r=>r.period!=='2026-09');
  h.data.body=h.data.body.filter(r=>!r.date.startsWith('2026-09'));h.data.books=h.data.books.filter(r=>!r.readDate.startsWith('2026-09'));
  const view=await h.runtime.refresh();for(const m of view.metrics.slice(0,3))assert.equal(m.comparison.baseline,null);
});
test('confirmed zero with explicit complete coverage remains distinct from unknown absent period',async()=>{
  const coverage=Object.fromEntries(['2026-09','2026-10'].map(m=>[m,Object.fromEntries(DEFAULT_REGISTRY.map(d=>[d.source,{ready:true,complete:true}]))]));
  const h=harness({getCoverage:()=>coverage});h.data.books=[];
  const view=await h.runtime.refresh();assert.equal(view.metrics[2].row.value,0);assert.equal(view.metrics[2].comparison.baseline.value,0);
  assert.equal(view.metrics[2].row.status,'PARTIAL'); // open October, not finalized history
  const unknown=harness();unknown.data.books=[];assert.equal((await unknown.runtime.refresh()).metrics[2].row.value,null);
});
test('valid explicit target math: JISPI usage/remaining, HINKEI percentage points',async()=>{
  const goals=DEFAULT_REGISTRY.slice(3).map(d=>({metric_id:d.metric_id,goal_id:d.metric_id,revision:1,year:2026,
    goal_type:'annual',value:d.adapter==='quiz'?75:d.adapter==='ledger'?1000:8000,unit:d.unit,semantics:d.goal_semantics,
    status:'active',effective_from:'2026-01-01',effective_to:'2026-12-31',created_at:'2026-01-01T00:00:00Z'}));
  const view=await harness({getGoals:()=>goals}).runtime.refresh();
  assert.equal(view.metrics[4].comparison.usage_rate,40);assert.equal(view.metrics[4].comparison.remaining,600);
  assert.ok(dashboardText(view.metrics[5]).comparison.includes('-12.5%p'));
});
test('owner/session change and stale async completion never expose former metrics',async()=>{
  const h=harness();await h.runtime.refresh();h.binding={...binding,userId:'B',sourceOwnerId:'B',sessionEpoch:'2'};
  assert.equal(h.runtime.peek().metrics.length,0);h.binding=null;assert.equal((await h.runtime.refresh()).status,'OWNER_BINDING_BLOCKED');
  assert.equal(h.writes,1);
  let release;const waiting=harness({verify:()=>new Promise(resolve=>release=resolve)});
  const pending=waiting.runtime.refresh();waiting.runtime.invalidate();release({status:'VERIFIED'});
  assert.equal((await pending).status,'CONTEXT_CHANGED');assert.equal(waiting.writes,0);
});
test('storage unavailable uses safe in-memory result, never null to zero',async()=>{
  const h=harness({storeFactory:()=>({invalidate(){},async activate(){throw Error('IDB_UNAVAILABLE')},async readActive(){throw Error('IDB_UNAVAILABLE')}})});
  h.data.body=[];const view=await h.runtime.refresh();assert.equal(view.status,'VERIFIED');assert.equal(view.cache,'MEMORY_ONLY');
  assert.equal(view.metrics[1].row.value,null);assert.equal(dashboardText(view.metrics[1]).value,'기록 없음');
});
test('failed canonical recalculation preserves last good value as STALE, not an official comparison',async()=>{
  let fail=false;
  const h=harness({canonical:{version:'synthetic',brokerTotal:r=>{if(fail)throw Error('unavailable');return r.accounts[0].estimatedAssets},ledgerSpending:r=>r.items.reduce((sum,i)=>sum+i.amount,0)}});
  await h.runtime.refresh();fail=true;h.runtime.invalidate();const view=await h.runtime.refresh();
  assert.equal(view.metrics[0].row.value,120);assert.equal(view.metrics[0].row.status,'STALE');assert.equal(view.metrics[0].comparison.baseline,null);
});
