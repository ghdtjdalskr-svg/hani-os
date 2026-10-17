import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import {assets} from './hani-office-v2-fixture.mjs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const source=read('hani-office-live.js'),context=vm.createContext({HaniOfficeV2Assets:assets,document:{getElementById:()=>null},window:{}});
vm.runInContext(source,context);vm.runInContext(read('hani-organization-hub.js'),context);
const api=context.HaniBuildingScene,plain=value=>JSON.parse(JSON.stringify(value));
const at=time=>api.snapshot(new Date('2026-10-11T'+time+':00+09:00'));
test('17 canonical staff, exact home floors and immutable config',()=>{
 assert.deepEqual(plain(api.floors.map(f=>f.residents)),[[],['hani','yuna','gaeun','mir'],['seoyun','dohyun','serin','yuri','arin'],['jieun','haru','naeun','hina','minji','sooyeon'],['sua','taeo']]);
 const ids=api.floors.flatMap(f=>f.residents),canonical=context.window.HaniOrganizationRoster.people.filter(p=>p.status!=="planned").map(p=>p.id);
 assert.equal(ids.length,17);assert.equal(new Set(ids).size,17);assert.deepEqual([...ids].sort(),[...canonical].sort());
 assert.ok(Object.isFrozen(api.floors));for(const f of api.floors)assert.ok(Object.isFrozen(f.residents));
});
test('ordinary hours keep every staff member at their home floor',()=>{for(const f of at('09:00').floors){assert.equal(f.rest,0);assert.equal(f.work,f.residents.length);assert.ok(f.people.every(p=>p.floor===p.home&&p.activity==='work'))}});
for(const [time,mode] of [['09:59','work'],['10:00','meeting'],['10:29','meeting'],['10:30','work'],['11:59','work'],['12:00','rest'],['12:59','rest'],['13:00','work'],['14:59','work'],['15:00','rest'],['15:19','rest'],['15:20','work'],['15:59','work'],['16:00','meeting'],['16:29','meeting'],['16:30','work']]){
 test('KST boundary '+time+' '+mode,()=>{
  const result=at(time),entries=result.floors.flatMap(f=>f.people),visitors=entries.filter(p=>p.activity==='rest'),leads=entries.filter(p=>p.activity==='meeting');
  assert.equal(entries.length,17);assert.equal(new Set(entries.map(p=>p.id)).size,17);
  if(mode==='rest'){assert.ok(visitors.length>=1&&visitors.length<=3);assert.ok(visitors.every(p=>p.floor==='4f'&&p.home!=='4f'))}else assert.equal(visitors.length,0);
  if(mode==='meeting'){assert.deepEqual(plain(leads.map(p=>p.id).sort()),['hani','jieun','seoyun']);assert.ok(leads.every(p=>p.floor==='2f'));const floor=result.floors.find(f=>f.id==='2f');assert.equal(floor.overflow,2);assert.ok(leads.every(p=>floor.visible.some(v=>v.id===p.id)))}else assert.equal(leads.length,0);
  assert.ok(entries.filter(p=>p.activity==='work').every(p=>p.floor===p.home));
  for(const f of result.floors){assert.ok(f.visible.length<=6);assert.equal(f.visible.length+f.overflow,f.people.length);assert.equal(f.work+f.rest,f.people.length)}
 });
}
test('date/slot determinism, timezone independence and daily variation',()=>{
 assert.deepEqual(plain(at('12:00').floors),plain(at('12:59').floors));assert.deepEqual(plain(api.snapshot('2026-10-11T03:05:00Z')),plain(api.snapshot('2026-10-11T12:05:00+09:00')));
 const sets=new Set();for(let day=1;day<=20;day++){const s=api.snapshot(`2026-10-${String(day).padStart(2,'0')}T12:00:00+09:00`);sets.add(s.floors.find(f=>f.id==='4f').people.filter(p=>p.activity==='rest').map(p=>p.id).join(','))}assert.ok(sets.size>1);
 assert.equal(api.snapshot('2026-10-11T15:01:00Z').day,'2026-10-12');
});
test('cap and overflow retain every entry and prioritize visitors/meeting leads',()=>{
 for(const n of [0,3,6,7,12]){const entries=Array.from({length:n},(_,i)=>({id:'p'+i,activity:i===n-1?'rest':'work'})),p=api.projection(entries);assert.equal(p.visible.length,Math.min(n,6));assert.equal(p.overflow,Math.max(0,n-6));assert.equal(entries.length,n);if(n)assert.equal(p.visible[0].id,'p'+(n-1))}
});
test('existing assets resolve for all staff; per-floor art config has fallback',()=>{
 for(const id of api.floors.flatMap(f=>f.residents))assert.ok(fs.existsSync(new URL('../'+api.profile(id),import.meta.url)),id);
 for(const f of api.floors){assert.equal(f.background,(f.id==='5f'?'./assets/building/floor-5f-v1.webp':`./assets/building/floor-${f.id}-215.webp`));assert.ok(fs.existsSync(new URL('../'+f.fallback,import.meta.url)))}
});
