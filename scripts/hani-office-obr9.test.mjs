import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {loadScene,at,readAt} from './hani-office-lively-fixture.mjs';
// Fixed Git source, never current runtime as its own oracle.
const before=readAt('hani-office-live.js','0b7bedd');
assert.equal(crypto.createHash('sha256').update(before).digest('hex'),'54fbf9a6f0301acf8c6e52d7ed3dc0ab8d05d684b763e84d2563f677981c6885','fixed obr8 Git source bytes');
const old=loadScene({transform:()=>before}),current=loadScene();
let writes=0;
for(const {context}of [old,current]){
 const deny=()=>{writes++;throw Error('storage forbidden')};
 context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};
}
test('obr9: obr8 bytes survive phases, presence subsets, repeated days, cancellations and cache eviction',()=>{
 const cases=[
  ['2026-10-22',{}],['2026-10-23',{chairmanPresent:true}],
  ['2026-10-24',{}],['2026-10-25',{presentIds:['seoyun','dohyun','yuna','minji','gaeun','yuri']}],
  ['2026-10-26',{presentIds:['hani','naeun','hina','haru']}],['2026-10-27',{presentIds:[]}],
  ['2026-10-28',{chairmanPresent:true}],['2026-10-22',{}]
 ];
 const seconds=[0,3599.999,3600,25199.999,25200,32400,41400,46800,64799.999,64800,75599,86399.999];
 const same=(a,b,label)=>assert.equal(JSON.stringify(a),JSON.stringify(b),label+' bytes');
 for(const [day,options]of cases){
  const a=old.scene.scheduler,b=current.scene.scheduler;
  const af=a.plan(day,options),bf=b.plan(day,options);same(bf,af,day+' formal');
  const ao=a.blockPlan(day,0,af,options),bo=b.blockPlan(day,0,bf,options);same(bo,ao,day+' outings');
  const samples=[...seconds,...ao.filter(e=>e.people.length>1).slice(0,5).flatMap(e=>[e.start,e.performStart,e.performEnd,e.end-.001])];
  for(const s of samples)for(const extra of [{},{reducedMotion:true},{summoned:['yuna','seoyun']},{cancelled:new Set(ao.slice(0,4).map(e=>e.id))}])same(b.snapshot(at(day,s),{...options,...extra}),a.snapshot(at(day,s),{...options,...extra}),day+' '+s);
 }
 assert.equal(writes,0);console.log('obr9 obr8 source comparison: 8 cases, complete formal/outings, phase/group snapshots × 4 option modes, storage writes 0');
});
