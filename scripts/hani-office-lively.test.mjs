// Lively idle layer: the shown floor changes every couple of seconds, day and evening, without shared spots.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {measure} from './hani-office-lively-measure.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
const table=JSON.parse(fs.readFileSync(new URL('../assets/data/office-actions-221.json',import.meta.url),'utf8'));
for(const [label,day,from,to] of [['weekday day','2026-10-21','14:00','14:20'],['weekday evening','2026-10-21','19:00','19:20'],['weekend evening','2026-10-24','20:00','20:20']])
  test(`${label}: every occupied floor changes visibly every ~2-3s and never freezes over 15s`,()=>{
    for(const [floor,r] of Object.entries(measure(day,from,to))){if(!r.people)continue;assert.ok(r.avgGapSec<=3,floor+' gap '+r.avgGapSec);assert.ok(r.longestStaticSec<=15,floor+' static '+r.longestStaticSec);assert.ok(r.distinctLines>=8,floor+' lines '+r.distinctLines)}
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
  assert.ok(busy/total>=.3&&busy/total<=.65,'busy share '+busy/total);assert.ok(dups/(1200*4)<.02,'repeated busy lines '+dups);
  const at=new Date('2026-10-21T19:10:00+09:00'),calm=s.snapshot(at,{reducedMotion:true});
  assert.ok(calm.entries.every(p=>!p.stroll&&!p.walking));assert.deepEqual(s.snapshot(at).entries.map(p=>p.line),s.snapshot(at).entries.map(p=>p.line),'deterministic');
});
