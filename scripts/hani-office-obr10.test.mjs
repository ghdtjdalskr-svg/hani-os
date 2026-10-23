import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {assertResources,validPlaceSpeech} from './hani-office-place-assertions.mjs';
const data=JSON.parse(fs.readFileSync('data/hani-building/office-places.json','utf8'));
const {scene,table,context}=loadScene(),s=scene.scheduler;
const plain=v=>JSON.parse(JSON.stringify(v)),overlap=(a,b)=>a.start<b.end&&b.start<a.end;
let writes=0;const deny=()=>{writes++;throw Error('storage forbidden')};context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};
test('obr10: data owns 5+ unique desk actions and 2 signatures per existing person, paired words, real same-floor errands and unchanged rest minima',()=>{
 assert.equal(new Set(scene.places.map(c=>c.id)).size,scene.places.length,'rest and work task IDs must never alias');
 for(const p of table.people){const lines=data.behavior.deskVoice[p.id];assert.ok(new Set(lines).size>=5,p.id);assert.ok(lines.every(l=>!/창가|창밖|화이트보드|소파|팬트리|화분|라운지/.test(l)));assert.equal(data.behavior.signatures[p.id].length,2)}
 for(const c of data.errands){assert.ok(c.slots.every(id=>scene.anchors.get(id)?.floor===c.floor&&scene.anchors.get(id)?.room===c.room));assert.doesNotMatch(c.go+c.at.join(),/커피|쉬는|휴식|창밖|간식|소파|산책|테라스|라운지/)}
 assert.ok(data.behavior.deskPairs.length>=5);assert.equal(writes,0);
});
test('obr10: gathering extensions re-reserve complete trajectories, resources and cooldowns; actual names, cancellation and determinism',()=>{
 let extensions=0,moments=0;
 for(const day of ['2026-10-22','2026-10-23','2026-10-24']){
  const f=s.plan(day),a=s.blockPlan(day,0,f),counts=new Map();
  for(const e of a.filter(e=>e.group)){for(let i=0;i<e.group.length;i++)for(let j=i+1;j<e.group.length;j++){const key=[e.group[i],e.group[j]].sort().join('|');counts.set(key,(counts.get(key)||0)+1)}}
  assert.ok([...counts.values()].every(n=>n<=data.behavior.pairDailyMax));
  for(const e of a.filter(e=>e.gatheringExtension)){
   extensions++;assert.ok(e.card.slots.length>=2&&data.behavior.gathering.kinds.includes(e.card.kind));
   const ceiling=Math.max(...e.gatheringChecks.map(c=>c.size>=3?480:e.card.stay[1]*1.5));
   assert.ok(e.performEnd-e.performStart<=480+1e-6);for(const t of e.people){assert.ok(t.back[0].start>=e.performEnd&&t.back.at(-1).end<=e.end);assert.ok(t.back[0].start-t.out.at(-1).end<=ceiling+1e-6,'individual dwell includes FIFO waiting')}
   for(const other of [...f,...a])if(other!==e&&overlap(other,e)){assert.ok(!other.people.some(t=>e.people.some(q=>q.id===t.id)));assertResources(s,e,other)}
   const people=a.filter(q=>q.card.id===e.card.id&&q.performStart<e.performEnd&&e.performStart<q.performEnd);
   assert.ok(people.some(q=>q!==e));
   for(const t of [e.performStart,e.performEnd-.001,...people.map(q=>q.performStart+.01)]){
    const snap=s.snapshot(at(day,t));for(const p of snap.entries.filter(p=>p.gatheringIds)){
     moments++;const card=scene.places.find(c=>c.id===p.placeId);assert.ok(validPlaceSpeech(p,card,table));
     for(const id of p.gatheringIds){const q=snap.entries.find(q=>q.id===id);assert.ok(q&&q.state==='AT_PLACE'&&q.placeId===p.placeId&&card.slots.includes(q.seat.anchor))}
     assert.equal(validPlaceSpeech({...p,line:p.line+' 가짜'},card,table),false);
     assert.equal(validPlaceSpeech({...p,seat:{...p.seat,anchor:'not-a-place'}},card,table),false);
    }
   }
  }
 }
 assert.ok(extensions>0&&moments>0);assert.equal(writes,0);console.log('obr10 gathering extensions and sampled member states',{extensions,moments});
 const day='2026-10-23',time=at(day,45500),before=plain(s.snapshot(time));s.snapshot(at('2026-10-25',30000));assert.deepEqual(plain(s.snapshot(time)),before);
 const blocked=before.entries.find(p=>p.gatheringIds);if(blocked){const snap=s.snapshot(time,{summoned:[blocked.id]});assert.ok(snap.entries.every(p=>!p.gatheringIds?.includes(blocked.id)))}
});
test('obr10: rejected extension leaves no partial reservation; same original 20/24px sweep still owns acceptance',()=>{
 const rejected=loadScene({transform:src=>src.replace('const ids=new Set(candidate.people.map(t=>t.id));','if(candidate.gatheringExtension)return false;\n      const ids=new Set(candidate.people.map(t=>t.id));')}).scene.scheduler;
 const day='2026-10-22',a=rejected.blockPlan(day,0,rejected.plan(day));assert.ok(!a.some(e=>e.gatheringExtension));assert.ok(a.length>1000);
 for(const e of a)for(const q of a)if(e!==q&&overlap(e,q))assertResources(rejected,e,q);
});
test('obr10: visitor and host really co-locate, use distinct ≥40px slots, cancel with guest and preserve reduced motion',()=>{
 const day='2026-10-22',a=s.blockPlan(day,0,s.plan(day)),hosts=a.filter(e=>e.guestId);assert.ok(hosts.length>0);
 for(const e of hosts){const t=(e.performStart+e.performEnd)/2,snap=s.snapshot(at(day,t)),p=snap.entries.find(p=>p.outingId===e.id),v=snap.visitors[0];assert.ok(p&&v);assert.equal(p.state,'AT_PLACE');assert.equal(v.state,'AT_PLACE');assert.equal(p.visitorPartner,e.guestId);assert.equal(v.hostId,p.id);assert.equal(v.line,data.behavior.visitorReply);assert.ok(validPlaceSpeech(p,e.card,table));
  assert.ok(Math.hypot((p.seat.x-v.seat.x)*16.72,(p.seat.y-v.seat.y)*9.41)>=40);
  assert.ok(s.snapshot(at(day,t),{cancelled:new Set([e.guestId])}).entries.every(p=>p.outingId!==e.id));
  assert.ok(s.snapshot(at(day,t),{reducedMotion:true}).entries.every(p=>!p.walking));
 }assert.equal(writes,0);console.log('obr10 visitor host pairs',hosts.length);
});
