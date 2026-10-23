import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import {assets} from './hani-office-v2-fixture.mjs';
import {readReviewedCurrentSource} from './hani-reviewed-release-baseline.mjs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const source=read('hani-office-live.js'),context=vm.createContext({HaniOfficeV2Assets:assets,document:{getElementById:()=>null},window:{}});
// The approved join excludes the office scene; preserve its 17-person oracle.
vm.runInContext(source,context);vm.runInContext(readReviewedCurrentSource('hani-organization-hub.js'),context);
const api=context.HaniBuildingScene,plain=value=>JSON.parse(JSON.stringify(value));
const at=time=>api.snapshot(new Date('2026-10-11T'+time+':00+09:00'));
test('17 canonical staff, exact home floors and immutable config',()=>{
 assert.deepEqual(plain(api.floors.map(f=>f.residents)),[[],['hani','yuna','gaeun','mir'],['seoyun','dohyun','serin','yuri','arin'],['jieun','haru','naeun','hina','minji','sooyeon'],['sua','taeo']]);
 const ids=api.floors.flatMap(f=>f.residents),canonical=context.window.HaniOrganizationRoster.people.filter(p=>p.status!=="planned").map(p=>p.id);
 assert.equal(ids.length,17);assert.equal(new Set(ids).size,17);assert.deepEqual([...ids].sort(),[...canonical].sort());
 assert.ok(Object.isFrozen(api.floors));for(const f of api.floors)assert.ok(Object.isFrozen(f.residents));
});
test('ordinary hours keep every staff member at their home floor',()=>{for(const f of at('09:00').floors){assert.equal(f.rest,0);assert.equal(f.work,f.residents.length);assert.ok(f.people.every(p=>p.floor===p.home&&p.activity==='work'))}});
for(const time of ['09:59','10:00','10:29','10:30','11:59','12:00','12:59','13:00','14:59','15:00','15:19','15:20','15:59','16:00','16:29','16:30']){
 test('table unavailable at KST '+time+' keeps base work, no retired fixed-time scenes',()=>{
  const result=at(time),entries=result.floors.flatMap(f=>f.people),visitors=entries.filter(p=>p.activity==='rest'),leads=entries.filter(p=>p.activity==='meeting');
  assert.equal(entries.length,17);assert.equal(new Set(entries.map(p=>p.id)).size,17);
  assert.equal(visitors.length,0);assert.equal(leads.length,0);
  assert.ok(entries.filter(p=>p.activity==='work').every(p=>p.floor===p.home));
  for(const f of result.floors){assert.ok(f.visible.length<=6);assert.equal(f.visible.length+f.overflow,f.people.length);assert.equal(f.work+f.rest,f.people.length)}
 });
}
test('fallback determinism and timezone independence; variation belongs to the 216 scheduler',()=>{
 assert.deepEqual(plain(at('12:00').floors),plain(at('12:59').floors));assert.deepEqual(plain(api.snapshot('2026-10-11T03:05:00Z')),plain(api.snapshot('2026-10-11T12:05:00+09:00')));
 for(let day=1;day<=20;day++){const s=api.snapshot(`2026-10-${String(day).padStart(2,'0')}T12:00:00+09:00`);assert.ok(s.floors.flatMap(f=>f.people).every(p=>p.actionId==='base-work'));}
 assert.equal(api.snapshot('2026-10-11T15:01:00Z').day,'2026-10-12');
});
test('cap and overflow retain every entry and prioritize visitors/meeting leads',()=>{
 for(const n of [0,3,6,7,12]){const entries=Array.from({length:n},(_,i)=>({id:'p'+i,activity:i===n-1?'rest':'work'})),p=api.projection(entries);assert.equal(p.visible.length,Math.min(n,6));assert.equal(p.overflow,Math.max(0,n-6));assert.equal(entries.length,n);if(n)assert.equal(p.visible[0].id,'p'+(n-1))}
});
test('existing assets resolve for all staff; per-floor art config has fallback',()=>{
 for(const id of api.floors.flatMap(f=>f.residents))assert.ok(fs.existsSync(new URL('../'+api.profile(id),import.meta.url)),id);
 for(const f of api.floors){assert.equal(f.background,(['1f','2f','4f','5f'].includes(f.id)?`./assets/building/floor-${f.id}-217.webp`:`./assets/building/floor-${f.id}-215.webp`));assert.ok(fs.existsSync(new URL('../'+f.fallback,import.meta.url)))}
});
