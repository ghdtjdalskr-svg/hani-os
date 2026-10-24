// Lively idle layer: the shown floor changes every couple of seconds, day and evening, without shared spots.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {measure} from './hani-office-lively-measure.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
const table=JSON.parse(fs.readFileSync(new URL('../assets/data/office-actions-221.json',import.meta.url),'utf8'));
for(const [label,day,from,to] of [['weekday day','2026-10-21','14:00','14:20'],['weekday evening','2026-10-21','19:00','19:20'],['weekend evening','2026-10-24','20:00','20:20']])
  test(`${label}: every occupied floor keeps changing (avg <=5s, never frozen over 35s)`,()=>{
    for(const [floor,r] of Object.entries(measure(day,from,to))){if(!r.people)continue;assert.ok(r.avgGapSec<=5,floor+' gap '+r.avgGapSec);assert.ok(r.longestStaticSec<=35,floor+' static '+r.longestStaticSec);assert.ok(r.distinctLines>=8,floor+' lines '+r.distinctLines)}
  });
test('evening mixes playful statuses and short same-floor strolls; reduced motion keeps everyone seated',()=>{
  const s=fixture('09:00',false,null,table).context.HaniBuildingScene.scheduler,lines=new Set();let strolls=0;
  for(let t=Date.parse('2026-10-21T19:00:00+09:00');t<Date.parse('2026-10-21T19:30:00+09:00');t+=1000)for(const p of s.snapshot(new Date(t)).entries){lines.add(p.line);if(p.stroll&&p.walking)strolls++}
  for(const playful of ['몰래 인스타 순찰 중','간식 서랍 점검 중','옆자리랑 수다 중'])assert.ok(lines.has(playful),playful);
  assert.ok(lines.has('퇴근 준비 중'),'time-of-day flavour kept');assert.ok(strolls>0,'strolls happen');
  // About a third to half of a floor is busy at once; plain base work is dot-only and never repeats a busy line.
  let busy=0,total=0,dups=0;
  for(let t=Date.parse('2026-10-21T14:00:00+09:00');t<Date.parse('2026-10-21T14:20:00+09:00');t+=1000){const entries=s.snapshot(new Date(t)).entries.filter(p=>p.id!=='mir');total+=entries.length;busy+=entries.filter(p=>!p.plain).length;
    for(const floor of ['1f','2f','3f','4f']){const shown=entries.filter(p=>p.floor===floor&&!p.plain).map(p=>p.line);if(new Set(shown).size!==shown.length)dups++}}
  assert.ok(busy/total>=.2&&busy/total<=.5,'busy share '+busy/total);assert.ok(dups/(1200*4)<.02,'repeated busy lines '+dups);
  const at=new Date('2026-10-21T19:10:00+09:00'),calm=s.snapshot(at,{reducedMotion:true});
  assert.ok(calm.entries.every(p=>!p.stroll&&!p.walking));assert.deepEqual(s.snapshot(at).entries.map(p=>p.line),s.snapshot(at).entries.map(p=>p.line),'deterministic');
});
test('lively-3/obr2: one bit per person per cycle, door paths and two outing units per floor',()=>{
  const f=fixture('09:00',false,null,table),scene=f.context.HaniBuildingScene,s=scene.scheduler,starts=new Map(),last=new Map();let doors=0,strollSeconds=0;
  for(let t=Date.parse('2026-10-21T14:00:00+09:00');t<Date.parse('2026-10-21T15:00:00+09:00');t+=1000){const per={};
    for(const p of s.snapshot(new Date(t)).entries){if(p.id==='mir')continue;
      const bit=!p.eventId&&!p.plain&&!p.stroll;if(bit&&!last.get(p.id))(starts.get(p.id)||starts.set(p.id,[]).get(p.id)).push(t);last.set(p.id,bit);
      if(p.stroll){strollSeconds++;(per[p.floor]||=new Map()).set(p.outingId,p.groupIds?.length||1);if(scene.anchors.get(p.seat.anchor)?.type==='door')doors++}}
    assert.ok(Object.values(per).every(units=>units.size<=2&&[...units.values()].filter(n=>n>1).length<=1),'at most two outing units, including at most one group');}
  for(const [id,list]of starts)for(let i=1;i<list.length;i++)assert.ok(list[i]-list[i-1]>=14000,id+' bits too close: '+(list[i]-list[i-1])/1000+'s');
  assert.ok(strollSeconds>0&&doors>0,'strolls happen and pass through doors');
});
test('visitors: one guest at a time, public 1F rooms only, gate in/out, never on a staff spot, none at night',()=>{
  const f=fixture('09:00',false,null,table),scene=f.context.HaniBuildingScene,s=scene.scheduler,rooms=new Set(['lobby','cafe','consult',null,undefined]),kinds=new Set();let seen=0;
  for(let t=Date.parse('2026-10-21T09:00:00+09:00');t<Date.parse('2026-10-21T21:00:00+09:00');t+=2000){const snap=s.snapshot(new Date(t));assert.ok(snap.visitors.length<=1);
    for(const v of snap.visitors){seen++;kinds.add(v.kind);const a=scene.anchors.get(v.seat.anchor);assert.equal(v.floor,'1f');assert.equal(a.floor,'1f');assert.ok(rooms.has(a.room??null),'public room only: '+a.id+' '+a.room);
      assert.ok(!snap.entries.some(p=>p.seat.anchor===v.seat.anchor),'no shared seat with staff');assert.ok(!snap.entries.some(p=>p.id==='visitor'),'not counted as staff')}}
  assert.ok(seen>500&&kinds.size>=4,'guests visit through the day: '+[...kinds]);
  for(const time of ['23:30','02:00','07:30'])assert.equal(s.snapshot(new Date(`2026-10-21T${time}:00+09:00`)).visitors.length,0,'no guests at '+time);
  for(let t=Date.parse('2026-10-21T10:00:00+09:00');t<Date.parse('2026-10-21T11:00:00+09:00');t+=1000){const v=s.snapshot(new Date(t),{reducedMotion:true}).visitors[0];if(v)assert.equal(v.walking,false)}
});
test('renderer shows the guest in one persistent 1F slot with its own name and sprite',()=>{
  const f=fixture('09:00',false,()=>true,table),s=f.context.HaniBuildingScene.scheduler;let t=Date.parse('2026-10-21T10:00:00+09:00');
  while(!s.snapshot(new Date(t)).visitors.length)t+=1000;
  const v=s.snapshot(new Date(t)).visitors[0];f.setDateTime(t);f.click('1f');const actor=f.visible().find(a=>a.dataset.person==='visitor');
  assert.ok(actor,'guest visible on 1F');assert.equal(actor.dataset.name,v.name);assert.equal(actor.dataset.sprite,v.sprite);assert.equal(actor.officeText.textContent,v.line);
  f.click('2f');assert.ok(!f.visible().some(a=>a.dataset.person==='visitor'),'guest never leaves 1F');
});
