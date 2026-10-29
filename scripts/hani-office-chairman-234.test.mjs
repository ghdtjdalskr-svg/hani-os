import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadScene,at,readAt} from './hani-office-lively-fixture.mjs';
import {validPlaceSpeech,assertResources} from './hani-office-place-assertions.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const {scene,table,context}=loadScene(),s=scene.scheduler,day='2026-10-22',options={chairmanPresent:true};
let writes=0;const deny=()=>{writes++;throw Error('storage/network forbidden')};
context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};context.fetch=deny;
const plain=x=>JSON.parse(JSON.stringify(x));
const goldenBytes=gunzipSync(fs.readFileSync('scripts/fixtures/office-chairman-234-plans.json.gz'));
assert.equal(createHash('sha256').update(goldenBytes).digest('hex'),'cd5541576e23b39018e704f14bcc253eac4aba152849779300f5f2b817852dff','immutable authored obr13 behavior oracle');
const golden=JSON.parse(goldenBytes);
assert.equal(createHash('sha256').update(readAt('hani-office-live.js','33d39892c2a5c0a1779650e440a2dd5068b44495')).digest('hex'),golden.sourceSha256);
assert.equal(createHash('sha256').update(fs.readFileSync('data/hani-building/office-places.json')).digest('hex'),golden.placesSha256);
test('234 frozen six full formal/outing ledgers and 84 snapshots preserve exact bytes and deep equality',()=>{
 for(const r of golden.records){const api=loadScene({ref:'33d39892c2a5c0a1779650e440a2dd5068b44495'}).scene.scheduler,f=api.plan(r.day,r.options),o=api.blockPlan(r.day,0,f,r.options);
  for(const [actual,expected]of [[f,r.formal],[o,r.outings],...r.snapshots.map(row=>[api.snapshot(at(r.day,row.seconds),r.options),row.snapshot])]){assert.equal(JSON.stringify(actual),JSON.stringify(expected));assert.deepEqual(plain(actual),expected)}
 }
});
test('234 actual owner renders and hides persistent chairman actor through the shared input/update path',()=>{
 const f=fixture('09:00',false,null,table),app=f.document.createElement('div');app.id='app';f.document.visibilityState='visible';
 f.setDateTime('2026-10-22T09:00:00+09:00');f.document.events.pointerdown();f.click('4f');
 const actor=f.ids.get('haniOfficeActors').children.find(a=>a.dataset.person==='seongmin');assert.ok(actor&&!actor.hidden);
 const nodes=[...f.ids.get('haniOfficeActors').children];
 for(const type of ['keydown','wheel','touchstart'])assert.strictEqual(f.document.events[type],f.document.events.pointerdown);
 const tick=f.timers.find(t=>t.ms===4200).fn;
 f.setDateTime('2026-10-22T09:10:00+09:00');tick();assert.equal(actor.hidden,true);
 f.document.events.wheel();tick();assert.equal(actor.hidden,false);
 app.className='login-locked';tick();assert.equal(actor.hidden,true);app.className='';f.document.events.touchstart();tick();assert.equal(actor.hidden,false);
 f.context.window.HaniOfficePresence={chairman:'absent'};tick();assert.equal(actor.hidden,true);
 assert.deepEqual(f.ids.get('haniOfficeActors').children,nodes);assert.equal(f.timers.length,2);
});
function presence({locked=false,visible=true,override}={}){
 const env={time:0,locked,visible,override};
 const p=scene.createPresence({now:()=>env.time,locked:()=>env.locked,visible:()=>env.visible,override:()=>env.override});
 return {env,p,read:()=>p.read().chairmanPresent};
}
test('234 presence: initial login/visibility, four shared passive input bindings, lock exclusion and external priority',()=>{
 const a=presence();assert.equal(a.read(),true);
 a.env.locked=true;assert.equal(a.read(),false);a.env.locked=false;a.p.interact();assert.equal(a.read(),true);
 assert.equal(presence({locked:true}).read(),false);assert.equal(presence({visible:false}).read(),false);
 a.env.override={chairman:'active'};a.env.locked=true;a.env.visible=false;a.env.time=2000000;assert.equal(a.read(),true);
 a.env.override={chairman:'absent'};a.env.locked=false;a.env.visible=true;a.p.interact();assert.equal(a.read(),false);
 a.env.override={};assert.equal(a.read(),false);a.env.override=undefined;assert.equal(a.read(),true);
 const source=fs.readFileSync('hani-office-live.js','utf8');
 assert.equal((source.match(/window\.HaniOfficePresence/g)||[]).length,1,'only injected canonical override reader');
 assert.match(source,/\['pointerdown','keydown','wheel','touchstart'\]\)document\.addEventListener\(type,officePresence\.interact,\{passive:true\}\)/);
 assert.equal((source.match(/const presence=officePresence\.read\(\)/g)||[]).length,2);
 assert.equal((source.match(/setInterval\(/g)||[]).length,2,'existing frame/update timers only');
 assert.doesNotMatch(source,/localStorage|sessionStorage|\.setItem\(|\.removeItem\(|\.clear\(\)\s*;?\s*\/\/.*storage/);
});
test('234 presence: exact ten-minute idle expiry, hidden grace, renewed input, brief flicker and repeated reads',()=>{
 const a=presence();assert.equal(a.read(),true);a.env.time=599999;assert.equal(a.read(),true);a.env.time=600000;assert.equal(a.read(),false);
 for(let i=0;i<100;i++){a.env.time++;assert.equal(a.read(),false)}
 a.p.interact();assert.equal(a.read(),true);a.env.visible=false;assert.equal(a.read(),true);
 a.env.time+=599999;assert.equal(a.read(),true);a.env.time++;assert.equal(a.read(),false);
 a.env.visible=true;a.p.interact();assert.equal(a.read(),true);
 for(let i=0;i<100;i++){a.env.time+=100;a.env.visible=false;assert.equal(a.read(),true);a.env.visible=true;assert.equal(a.read(),true)}
 assert.equal(writes,0);
});
test('234 chairman: real 4F home and frog sprite identity; workday has all three signatures, base actions, affinity outings and safe reservations',()=>{
 const f=s.plan(day,options),b=s.blockPlan(day,0,f,options),own=f.filter(e=>e.start>=32400&&e.start<64800&&e.people.some(t=>t.id==='seongmin'));
 for(const id of ['sig-seongmin-1','sig-seongmin-4','sig-seongmin-5','base-coffee','base-read','base-think','base-walk']){
  const e=own.find(e=>e.actionId===id);assert.ok(e,id+' must occur in workday');
  const p=s.snapshot(at(day,(e.performStart+e.performEnd)/2),options).entries.find(p=>p.id==='seongmin');assert.equal(p.actionId,id);assert.ok(p.line.length>2);assert.equal(p.walking,false);
 }
 let idle;for(let sec=32400;sec<64800&&!idle;sec++){const p=s.snapshot(at(day,sec),options).entries.find(p=>p.id==='seongmin');if(p.state==='AT_HOME'&&p.actionId==='base-work')idle=p}
 assert.ok(idle);assert.equal(idle.floor,'4f');assert.equal(idle.seat.anchor,'ceo-reserved');
 assert.deepEqual(plain(s.identity.seongmin),{entity:'human_user',role:'chairman',officeVisual:'ceo_frog',spriteId:'seongmin',staffAddress:'회장님'});
 const manifest=JSON.parse(fs.readFileSync('assets/sprites-v2/manifest.json'));assert.ok(manifest.entries.some(e=>e.id==='seongmin'));
 const trips=b.filter(e=>e.people.some(t=>t.id==='seongmin'));for(const kind of ['meeting','sofa','window'])assert.ok(trips.some(e=>e.card.kind===kind),kind);
 for(const e of trips)for(const other of [...f,...b])if(e!==other&&e.start<other.end&&other.start<e.end){assert.ok(!other.people.some(t=>t.id==='seongmin'));assertResources(s,e,other)}
 assert.equal(s.snapshot(at(day,32400)).entries.some(p=>p.id==='seongmin'),false);assert.equal(writes,0);
});
test('234 colleague visits: >=32px from actual colleague and horizontal approach preference, other rest minima unchanged',()=>{
 let count=0,min=Infinity;
 const f=s.plan(day,options),b=s.blockPlan(day,0,f,options);
 for(const card of scene.places.filter(c=>c.errandKind==='colleague')){
  const person=table.people.find(p=>p.id===card.targetPerson),h=scene.art.anchors[person.home.anchorId];
  const vertical=Array.from(card.slots,id=>Math.abs(scene.art.anchors[id].y-h.y));assert.deepEqual([...vertical].sort((a,b)=>a-b),vertical);
 }
 for(const e of b.filter(e=>e.card.errandKind==='colleague')){
  const snap=s.snapshot(at(day,(e.performStart+e.performEnd)/2),options),p=snap.entries.find(p=>p.outingId===e.id),q=snap.entries.find(p=>p.id===e.card.targetPerson);
  assert.ok(p&&q);assert.equal(p.state,'AT_PLACE');assert.equal(q.state,'AT_HOME');
  const gap=Math.hypot((p.seat.x-q.seat.x)*16.72,(p.seat.y-q.seat.y)*9.41);assert.ok(gap>=32,e.id+' '+gap);min=Math.min(min,gap);count++;
 }
 assert.ok(count>100);console.log('234 colleague visits',{count,minPx:min});
});
test('234 long solitary stays: exactly one deterministic switch within same place, no arrival speech while moving',()=>{
 const f=s.plan(day,options),b=s.blockPlan(day,0,f,options);let checked=0;
 for(const e of b.filter(e=>!e.visitor&&!e.group&&e.card.kind!=='errand'))for(const t of e.people){
  const arrival=t.out.at(-1).end,departure=t.back[0].start;if(departure-arrival<=90)continue;
  const midpoint=(arrival+departure)/2,times=[arrival+.001,midpoint-.001,midpoint+.001,departure-.001];
  const snapshots=times.map(sec=>s.snapshot(at(day,sec),options)),people=snapshots.map(snap=>snap.entries.find(p=>p.id===t.id));
  if(people.some(p=>p.gatheringIds))continue; // social speech has its own real peer boundaries
  assert.ok(people.every(p=>p.state==='AT_PLACE'&&p.outingId===e.id));assert.equal(people[0].line,people[1].line);assert.equal(people[2].line,people[3].line);
  assert.notEqual(people[0].line,people[2].line,e.id);assert.ok(validPlaceSpeech(people[2],e.card,table));
  assert.deepEqual(plain(s.snapshot(at(day,midpoint+.001),options)),plain(snapshots[2]));
  const moving=s.snapshot(at(day,e.start+.001),options).entries.find(p=>p.id===t.id);assert.match(moving.line,/가는 중$/);checked++;
 }
 assert.ok(checked>20);console.log('234 long stay switches',{checked});assert.equal(writes,0);
});
test('234 deterministic staff paths within each presence key, cache reuse across toggles and reordered snapshots',()=>{
 for(const chairmanPresent of [false,true]){
  const o={chairmanPresent},a=loadScene().scene.scheduler,b=loadScene().scene.scheduler;
  const af=a.plan(day,o),bf=b.plan(day,o);assert.equal(JSON.stringify(af),JSON.stringify(bf));assert.equal(JSON.stringify(a.blockPlan(day,0,af,o)),JSON.stringify(b.blockPlan(day,0,bf,o)));
  const times=[32400,41400,45000,54000,64799],expected=times.map(sec=>plain(a.snapshot(at(day,sec),o)));
  b.snapshot(at(day,45000),{chairmanPresent:!chairmanPresent});
  for(const sec of [...times].reverse())assert.deepEqual(plain(b.snapshot(at(day,sec),o)),expected[times.indexOf(sec)]);
  assert.strictEqual(a.plan(day,o),af);assert.strictEqual(a.blockPlan(day,143,af,o),a.blockPlan(day,0,af,o));
 }
});
test('234 long social stays switch to another approved place phrase while retaining actual companion names',()=>{
 const f=s.plan(day,options),b=s.blockPlan(day,0,f,options);let count=0;
 for(const e of b.filter(e=>!e.visitor&&e.card.kind!=='errand'))for(const t of e.people){
  const arrival=t.out.at(-1).end,departure=t.back[0].start;if(departure-arrival<=90)continue;
  const sec=Math.max(e.performStart+.001,(arrival+departure)/2+.002);if(sec>=e.performEnd)continue;
  const p=s.snapshot(at(day,sec),options).entries.find(p=>p.id===t.id);
  if(!p.groupIds&&!p.gatheringIds)continue;
  assert.ok(p.stayLine);assert.ok(validPlaceSpeech(p,e.card,table));assert.equal(validPlaceSpeech({...p,stayLine:p.stayLine+' 가짜'},e.card,table),false);
  const before=s.snapshot(at(day,arrival+.001),options).entries.find(p=>p.id===t.id);
  assert.equal(before.stayLine,undefined);assert.notEqual(before.line,p.line);count++;
 }
 assert.ok(count>5);console.log('234 social place switches',{count});
});
