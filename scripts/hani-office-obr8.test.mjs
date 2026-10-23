import test from 'node:test';
import assert from 'node:assert/strict';
import {loadScene,at,readAt} from './hani-office-lively-fixture.mjs';
import {assertResources,validPlaceSpeech} from './hani-office-place-assertions.mjs';
const overlap=(a,b)=>a.start<b.end&&b.start<a.end;
const plain=v=>JSON.parse(JSON.stringify(v));
const days=['2026-10-22','2026-10-23','2026-10-24'];
const {scene,table,context}=loadScene(),s=scene.scheduler;
let writes=0;const fail=()=>{writes++;throw Error('storage forbidden')};
context.localStorage=context.sessionStorage={setItem:fail,removeItem:fail,clear:fail};
test('obr8: frozen formal plans stay identical to obr7; errands have full 8–25s stays, ≤60s round trips, present colleagues, shared reservations and no leisure words',()=>{
 const old=loadScene({transform:()=>readAt('hani-office-live.js','84cadbd')}).scene.scheduler;
 const counts={colleague:0,delivery:0,notice:0};
 for(const day of days){
  const options={chairmanPresent:true},formal=s.plan(day,options),all=s.blockPlan(day,0,formal,options),errands=all.filter(e=>e.card.kind==='errand');
  assert.deepEqual(plain(formal),plain(old.plan(day,options)),'all formal decisions unchanged');
  assert.ok(errands.length>600,day+' actual accepted errands');
  const previous=new Map();
  for(const e of errands){
   const t=e.people[0],card=e.card;counts[card.errandKind]++;
   assert.equal(e.people.length,1);assert.equal(e.floors.length,1);assert.ok(e.end-e.start<=60+1e-6);
   assert.ok(e.performEnd-e.performStart>=8&&e.performEnd-e.performStart<=25);
   assert.equal(t.back[0].start,e.performEnd);assert.equal(t.out.at(-1).end,e.performStart);
   assert.ok(e.start>=32400&&e.end<=75600);assert.notEqual(card.id,previous.get(t.id));previous.set(t.id,card.id);
   assert.doesNotMatch(card.go+' '+card.at.join(' '),/커피|쉬는|휴식|창밖|간식|소파|산책|테라스|라운지/);
   assert.ok(table.people.every(p=>p.home.anchorId!==t.seat.anchor));
   for(const other of [...formal,...all])if(other!==e&&overlap(e,other)){
    assert.ok(other.people.every(q=>q.id!==t.id),'no actor overlap');assertResources(s,e,other);
    if(card.targetPerson)assert.ok(other.people.every(q=>q.id!==card.targetPerson||q.seat.anchor===q.home.anchorId),'colleague stays home for the entire visit');
   }
   const snap=s.snapshot(at(day,(e.performStart+e.performEnd)/2),options),p=snap.entries.find(p=>p.id===t.id);
   assert.equal(p.outingId,e.id);assert.ok(validPlaceSpeech(p,card,table));
   assert.equal(validPlaceSpeech({...p,seat:{...p.seat,anchor:t.home.anchorId}},card,table),false,'arrival words refused at wrong anchor');
   assert.equal(validPlaceSpeech({...p,line:'커피 마시는 중'},card,table),false);
   const going=s.snapshot(at(day,e.start+.001),options).entries.find(p=>p.id===t.id);assert.equal(going.line,card.go);
   if(card.targetPerson){
    const target=snap.entries.find(p=>p.id===card.targetPerson),peer=table.people.find(p=>p.id===card.targetPerson);
    assert.ok(target);assert.equal(target.seat.anchor,peer.home.anchorId);assert.equal(target.walking,false);
    assert.ok(Math.hypot((p.seat.x-target.seat.x)*16.72,(p.seat.y-target.seat.y)*9.41)>=24.01);
    assert.equal(validPlaceSpeech({...p,line:card.at[0].replace(peer.name,'없는 동료')},card,table),false);
   }
  }
  for(const floor of ['1f','2f','3f','4f'])for(const e of errands.filter(e=>e.card.floor===floor)){
   assert.ok(errands.filter(q=>q.card.floor===floor&&q.start<=e.start&&e.start<q.end).length<=(floor==='2f'?3:2));
  }
  for(const person of table.people.filter(p=>!['mir','seongmin'].includes(p.id))){
   const list=errands.filter(e=>e.people[0].id===person.id),gaps=list.slice(1).map((e,i)=>(e.start-list[i].start)/60);
   assert.ok(gaps.every(g=>g>=6));const mean=gaps.reduce((a,b)=>a+b,0)/gaps.length;
   assert.ok(mean>=6&&mean<=15,day+' '+person.id+' actual mean '+mean);
  }
 }
 assert.ok(Object.values(counts).every(n=>n>0));assert.equal(writes,0);console.log('obr8 errand kinds',counts);
});
test('obr8: 9.41px approach is refused, absent/summoned target excluded, cancellation atomic, reduced motion and query order stable',()=>{
 assert.ok(!s.errandPlaces.some(c=>c.slots.includes('approach_desk_yoonseul')));
 const day=days[0],formal=s.plan(day),all=s.blockPlan(day,0,formal),e=all.find(e=>e.card.targetPerson),time=at(day,e.performStart+.01);
 assert.ok(e);
 for(const options of [{summoned:[e.people[0].id]},{summoned:[e.card.targetPerson]},{cancelled:new Set([e.id])}])assert.ok(s.snapshot(time,options).entries.every(p=>p.outingId!==e.id));
 const subset={presentIds:['seoyun','dohyun']},f=s.plan(day,subset),trips=s.blockPlan(day,0,f,subset);
 assert.ok(trips.filter(q=>q.card.targetPerson).every(q=>subset.presentIds.includes(q.card.targetPerson)));
 const snap=plain(s.snapshot(time));s.snapshot(at(days[2],50000));assert.deepEqual(plain(s.snapshot(time)),snap);
 assert.ok(s.snapshot(time,{reducedMotion:true}).entries.every(p=>!p.walking));assert.equal(writes,0);
});
test('obr8: daytime visitors use one public slot with 20–40s takeout; staff errands do not shorten rest stays',()=>{
 const formal=s.plan(days[0]),all=s.blockPlan(days[0],0,formal),guests=all.filter(e=>e.visitor);
 assert.ok(guests.length>200);
 assert.ok(guests.filter(e=>['courier','rider','generic'].includes(e.visitor.kind)).length/guests.length>.8);
 for(let i=0;i<guests.length;i++){
  const e=guests[i],t=e.people[0];assert.equal(e.people.length,1);assert.equal(e.floors[0],'1f');if(i)assert.ok(guests[i-1].end<=e.start);
  assert.ok(['lobby','cafe','consult'].includes(scene.anchors.get(t.seat.anchor).room));
  if(e.visitor.kind==='generic'){
   assert.equal(t.seat.anchor,'coffee_counter');assert.ok(e.performEnd-e.performStart>=20&&e.performEnd-e.performStart<=40);
   const snap=s.snapshot(at(days[0],e.performStart+.01));assert.equal(snap.visitors[0].line,'커피 받아 가는 중');
  }
 }
 assert.equal(writes,0);
});
