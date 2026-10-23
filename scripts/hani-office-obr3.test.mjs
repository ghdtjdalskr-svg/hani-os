import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadScene,root} from './hani-office-lively-fixture.mjs';
import {assertFormalStay} from './hani-office-formal-stay-assertions.mjs';
const days=['2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-24','2026-10-25'];
const places=JSON.parse(fs.readFileSync(new URL('data/hani-building/office-places.json',root),'utf8'));
const fileStrings=value=>typeof value==='string'?/\.[a-z][a-z0-9]{0,9}\b/i.test(value)?[value]:[]:value&&typeof value==='object'?Object.entries(value).flatMap(([k,v])=>[...fileStrings(k),...fileStrings(v)]):[];
test('obr3: every places JSON string is free of file extensions, including keys and nested evidence',()=>{
 assert.deepEqual(fileStrings(places),[]);
 for(const value of ['texture.PNG','bundle.js?v=1','theme.css','office.json','photo.webp','some/asset.mjs'])assert.equal(fileStrings({nested:[value]}).length,1);
});
test('obr3: formal 216/221 trips obey destination bounds including FIFO waiting; home durations stay exact',()=>{
 for(const catalog of [216,221]){
  const {scene,table}=loadScene({catalog});let away=0,home=0,groups=0;
  for(const day of ['2026-10-22','2026-10-23'])for(const e of scene.scheduler.plan(day,{chairmanPresent:true})){
   assertFormalStay(scene,e,table);
   if(e.people.some(t=>t.seat.anchor!==t.home.anchorId)){away++;if(e.actionId.startsWith('scene-'))groups++;}else home++;
  }
  assert.ok(away>10&&home>10);console.log('obr3 formal bounds',{catalog,away,home,groups});
 }
});
test('obr3: unmapped destination falls back to its room kind, then a 45-second minimum',()=>{
 for(const unknown of [false,true]){
  const {scene,table}=loadScene({catalog:216,transform:src=>src.replace("const places=Object.freeze(placeTable?.schemaVersion==='office-places-v1'?placeTable.places:[]);",'const places=Object.freeze([]);').replace('function createScheduler(table){',`function createScheduler(table){\n${unknown?"anchors.get('pantry_2f').room=null;":''}`)});
  const events=scene.scheduler.plan('2026-10-22',{chairmanPresent:true}).filter(e=>e.people.some(t=>t.seat.anchor==='pantry_2f'&&t.seat.anchor!==t.home.anchorId));
  assert.ok(events.length);for(const e of events)assertFormalStay(scene,e,table);
  for(const e of events)assert.ok(e.duration>=(unknown?45:60));
 }
});
test('obr3: staff companionship fits 09:00–19:30, avoids consult/reception, and cross-floor companionship stays ≤2 per person/day',()=>{
 const {scene}=loadScene(),s=scene.scheduler;let groups=0,morning=0,evening=0;
 const week=[];
 for(const day of days){
  const formal=s.plan(day),trips=s.blockPlan(day,0,formal).filter(e=>!e.visitor),daily=new Map();
  for(const e of trips){
   assert.notEqual(e.card.room,'consult');assert.ok(!e.card.slots.includes('reception'));
   if(e.start>=25200&&e.start<32400){morning++;assert.equal(e.card.kind,'coffee');}
   if(e.start>=70200){evening++;assert.ok(['coffee','sofa'].includes(e.card.kind));}
   if(!e.group)continue;groups++;
   assert.ok(e.start>=32400&&e.end<=70200,day+' '+e.id);
   for(const t of e.people)if(e.card.floor!==t.home.floor)daily.set(t.id,(daily.get(t.id)||0)+1);
  }
  for(const count of daily.values())assert.ok(count<=2);
  week.push({day,groups:trips.filter(e=>e.group).length,trios:trips.filter(e=>e.group?.length===3).length});
 }
 assert.ok(groups>10&&morning>0&&evening>0);console.log('obr3 companion week',week);
});
test('obr3: explicit human presence retains its reserved seat; staff leisure does not invite the chairman or virtual MIR',()=>{
 const {scene}=loadScene({catalog:216}),s=scene.scheduler,day='2026-10-19',options={chairmanPresent:true};
 const formal=s.plan(day,options),trips=s.blockPlan(day,0,formal,options).filter(e=>!e.visitor);
 assert.ok(trips.length);assert.ok(trips.every(e=>e.people.every(t=>!['seongmin','mir'].includes(t.id))));
 const chairman=s.snapshot(day+'T23:00:00+09:00',options).entries.find(p=>p.id==='seongmin');
 assert.equal(chairman.seat.anchor,'ceo-reserved');
 assert.equal(s.snapshot(day+'T23:00:00+09:00').entries.some(p=>p.id==='seongmin'),false);
});
