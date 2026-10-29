import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadScene,readAt,at} from './hani-office-lively-fixture.mjs';
const before=readAt('hani-office-live.js','0d47015');
assert.equal(createHash('sha256').update(before).digest('hex'),'5f9308771e5da0578367d9b541b79b2e7e4e32e37a835530c4bb23ccd571da98');
const plain=x=>JSON.parse(JSON.stringify(x));
for(const [day,options]of [['2026-10-22',{}],['2026-10-23',{chairmanPresent:true}],['2026-10-24',{}],['2026-11-01',{presentIds:['seoyun','dohyun','yuna','minji']}],['2026-11-02',{presentIds:['hani','yuri','serin','arin','hina','daon','yoonseul']}]] ){
 test('obr12: '+day+' full formal/outing bytes, phase boundaries, query order and zero writes',()=>{
  const old=loadScene({transform:()=>before}),current=loadScene();let writes=0;
  const deny=()=>{writes++;throw Error('storage forbidden')};for(const {context}of [old,current])context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};
  const a=old.scene.scheduler,b=current.scene.scheduler;
  const compare=(label,x,y)=>{assert.equal(JSON.stringify(x),JSON.stringify(y),label+' bytes');assert.deepEqual(plain(x),plain(y),label+' deepEqual')};
  const af=a.plan(day,options),bf=b.plan(day,options);compare('formal',bf,af);compare('outings',b.blockPlan(day,0,bf,options),a.blockPlan(day,0,af,options));
  for(const seconds of [86399.999,64800,64799.999,45000,0,3599.999,3600,25199.999,25200,32400,41400,46800,70200])compare('snapshot '+seconds,b.snapshot(at(day,seconds),options),a.snapshot(at(day,seconds),options));
  const cancelled=new Set(af.slice(0,3).map(e=>e.id)),suppressed={...options,cancelled,summoned:['yuna','seoyun'],reducedMotion:true};
  compare('suppressed',b.snapshot(at(day,45000),suppressed),a.snapshot(at(day,45000),suppressed));assert.equal(writes,0);
 });
}
