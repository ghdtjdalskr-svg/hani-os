import {readTlayoutPlans} from './hani-office-tlayout-fixture.mjs';
import {restoreResidentsSource as restorePriorResidentsSource} from './hani-office-residents-source.mjs';
import {restoreTlayoutSource} from './hani-office-tlayout-fixture.mjs';
const restoreResidentsSource=source=>restorePriorResidentsSource(restoreTlayoutSource(source));
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {loadScene,at,readAt} from './hani-office-lively-fixture.mjs';
import {assertResources,validPlaceSpeech} from './hani-office-place-assertions.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
const base='bebcf2c16b163df1f311fbcdc36caa42a4af7940',day='2026-10-22',options={chairmanPresent:true};
const {scene,table,context}=loadScene(),s=scene.scheduler;
let writes=0;const deny=()=>{writes++;throw Error('forbidden storage/network')};
context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};context.fetch=deny;
const serialize=JSON.stringify,hash=x=>createHash('sha256').update(x).digest('hex');
// Exact QA-3/18/19 display edits are restored before the unchanged behavior guard.
const labelDeltaBytes=fs.readFileSync('scripts/fixtures/office-labels-qa-source-delta.json');
assert.equal(hash(labelDeltaBytes),'6b850fdbe8089984f01bf62dcd1c29568e2d1cb67220ea9c5dcc980730e0c50c');
const labelDelta=JSON.parse(labelDeltaBytes);
assert.equal(labelDelta.beforeSha256,'406937ae1d69c0379bb735e961734b517ae9440a02c93a0d41771dc0c694d246');
function restoreOfficeLabelsSource(source){
 source=restoreResidentsSource(source);
 const lines=source.match(/[^\n]*\n|[^\n]+$/g);
 for(const change of labelDelta.changes.toReversed()){
  assert.deepEqual(lines.slice(change.afterLine,change.afterLine+change.after.length),change.after,'only exact reviewed display lines at '+change.afterLine);
  lines.splice(change.afterLine,change.after.length,...change.before);
 }
 const restored=lines.join('');assert.equal(hash(restored),labelDelta.beforeSha256,'every other source byte including scheduler stays frozen');return restored;
}
test('obr15 historical source identities retained; cafe/rest source and full absent ledgers frozen separately',()=>{
 const frozen=JSON.parse(gunzipSync(fs.readFileSync('scripts/fixtures/office-lively-labels-235-plans.json.gz')));
 assert.equal(hash(readAt('hani-office-live.js',base)),frozen.sourceSha256);
 assert.equal(hash(readAt('hani-office-live.css',base)),frozen.cssSha256);
 for(const [day,o]of [['2026-10-22',{}],['2026-10-23',{chairmanPresent:false}],['2026-10-24',{}],['2026-11-01',{presentIds:['seoyun','dohyun','yuna','minji']}],['2026-11-02',{presentIds:['hani','yuri','serin','arin','hina','daon','yoonseul']}]] ){
  const actual=loadScene().scene.scheduler;
  // Cafe/rest intentionally changes full ledgers. Pin the separately authored
  // full output here; obr21 and all its historical fixtures remain untouched.
  const cafeBytes=gunzipSync(fs.readFileSync('scripts/fixtures/office-cafe-finish-plans.json.gz'));
  assert.equal(hash(cafeBytes),'e72482ea731c0b8311eb53c90c40e573f4465a45ef37cd6ef6927261aaf72b7a','immutable cafe/rest full-ledger oracle');
  const cafe=JSON.parse(cafeBytes);assert.equal(hash(readAt('hani-office-live.js','b653a173079323217bcd5e338e82c50d40d578e1')),cafe.sourceSha256);assert.equal(hash(readAt('data/hani-building/office-places.json','b653a173079323217bcd5e338e82c50d40d578e1')),cafe.placesSha256);
  const consultBytes=gunzipSync(fs.readFileSync('scripts/fixtures/office-consult-v7-plans.json.gz'));
  assert.equal(hash(consultBytes),'1a0acf4ae695ccb93b315b59bea9804273ca7cee4eb024dcd84bab90bd4579db','approved consultation full-output SHA-256 oracle');
  const consult=JSON.parse(consultBytes);assert.equal(hash(restoreOfficeLabelsSource(fs.readFileSync('hani-office-live.js','utf8'))),consult.sourceSha256);assert.equal(hash(fs.readFileSync('data/hani-building/office-places.json')),consult.placesSha256);
  const reviewed=readTlayoutPlans().records.find(r=>r.label==='obr15 absent '+day);
  assert.ok(reviewed);assert.equal(serialize(o),serialize(reviewed.options));
  const a=actual.plan(day,o),out=actual.blockPlan(day,0,a,o);assert.equal(hash(serialize(a)),reviewed.formalSha256);assert.equal(hash(serialize(out)),reviewed.outingsSha256);
  for(let sec=86399;sec>=0;sec-=137)assert.equal(serialize(actual.snapshot(at(day,sec),{...o,chairmanArrivalAt:at(day,32400).getTime()})),serialize(actual.snapshot(at(day,sec),o)),day+' '+sec);
 }
 assert.equal(writes,0);
});
test('obr15 canonical presence first arrival / >=10 minute absence / brief flicker / day rollover / override',()=>{
 let time=at(day,32400).getTime(),locked=true,visible=true,override;
 const p=scene.createPresence({now:()=>time,locked:()=>locked,visible:()=>visible,override:()=>override});
 assert.equal(p.read().chairmanPresent,false);locked=false;p.interact();let r=p.read();assert.equal(r.chairmanArrivalAt,time);assert.equal(r.chairmanSince,time);assert.equal(p.read().chairmanArrivalAt,time);
 locked=true;time+=1000;p.read();time+=599999;locked=false;p.interact();assert.equal(p.read().chairmanArrivalAt,null);
 locked=true;time+=1;p.read();time+=600000;locked=false;p.interact();assert.equal(p.read().chairmanArrivalAt,time);
 override={chairman:'absent'};p.read();time=at('2026-10-23',1).getTime();override={chairman:'active'};assert.equal(p.read().chairmanArrivalAt,time);
 visible=false;override=undefined;p.read();time+=600000;assert.equal(p.read().chairmanPresent,false);
});
test('obr15 greeting occurs immediately, 1–2 nearest available 4F staff stand in place for 5–10 seconds, then exact original action',()=>{
 let cases=0;
 // Six fixed witnesses authored with the approved schedule, same six-case bar.
 for(const sec of [32610,32617,32624,32631,32638,32645]){
  const stamp=at(day,sec).getTime(),o={...options,chairmanSince:stamp,chairmanArrivalAt:stamp},baseSnap=s.snapshot(at(day,sec),{...options,chairmanSince:stamp});
  const snap=s.snapshot(at(day,sec),o),g=snap.entries.filter(p=>p.behaviorKind==='chairman-greeting');
  if(!g.length)continue;
  assert.ok(g.length<=2);cases++;
  const chair=baseSnap.entries.find(p=>p.id==='seongmin'),distance=p=>Math.hypot((p.seat.x-chair.seat.x)*16.72,(p.seat.y-chair.seat.y)*9.41);
  for(const p of g){const original=baseSnap.entries.find(q=>q.id===p.id);assert.equal(p.floor,'4f');assert.equal(p.walking,false);assert.equal(p.pose,'standing');assert.equal(p.seat.anchor,original.seat.anchor);assert.ok(distance(p)<=650);assert.match(p.line,/회장님/);assert.ok([...p.shortLine].length<=10);
   const duration=(p.greetingUntil-stamp)/1000;assert.ok(duration>=5&&duration<=10);
   assert.equal(s.snapshot(at(day,sec+duration-.001),o).entries.find(q=>q.id===p.id).behaviorKind,'chairman-greeting');
   assert.equal(serialize(s.snapshot(at(day,sec+duration),o).entries.find(q=>q.id===p.id)),serialize(s.snapshot(at(day,sec+duration),{...options,chairmanSince:stamp}).entries.find(q=>q.id===p.id)));
   assert.equal(s.snapshot(at(day,sec-.001),o).entries.some(p=>p.behaviorKind==='chairman-greeting'),false);
   assert.equal(s.snapshot(at(day,sec),{...o,summoned:[p.id]}).entries.some(q=>q.id===p.id),false);
  }
  const other=loadScene().scene.scheduler;assert.equal(serialize(other.snapshot(at(day,sec),o)),serialize(snap));
  const reordered=loadScene().scene.scheduler;reordered.snapshot(at(day,sec),{...o,summoned:[g[0].id]});assert.equal(serialize(reordered.snapshot(at(day,sec),o)),serialize(snap),'transient summons cannot poison greeting selection');
  if(cases>=6)break;
 }
 assert.ok(cases>=6);assert.equal(writes,0);
});
test('obr15 greeting never addresses a chairman on a different floor',()=>{
 const f=s.plan(day,options),out=s.blockPlan(day,0,f,options),e=out.find(e=>!e.report&&e.people.some(t=>t.id==='seongmin'&&scene.anchors.get(t.seat.anchor).floor!=='4f'));
 assert.ok(e);const stamp=at(day,e.performStart+1).getTime(),snap=s.snapshot(new Date(stamp),{...options,chairmanArrivalAt:stamp,chairmanSince:stamp});assert.notEqual(snap.entries.find(p=>p.id==='seongmin').floor,'4f');assert.equal(snap.entries.some(p=>p.behaviorKind==='chairman-greeting'),false);
});
test('obr15 legacy 216 fallback retains its no-chairman-outing contract',()=>{
 const a=loadScene({catalog:216}).scene.scheduler,f=a.plan(day,options),out=a.blockPlan(day,0,f,options);assert.equal(out.some(e=>e.report),false);assert.ok(out.every(e=>e.visitor||e.people.every(t=>t.id!=='seongmin'&&t.id!=='mir')));
});
test('obr15 reports: 4–8/day, one/person, 20–60 seconds, private chair unused, actor/resource collision zero, elevator round trip',()=>{
 let cross=0;
 for(const d of ['2026-10-21',day,'2026-10-23','2026-10-24']){
  const f=s.plan(d,options),out=s.blockPlan(d,0,f,options),reports=out.filter(e=>e.report);
  assert.ok(reports.length>=4&&reports.length<=8,d+' '+reports.length);assert.equal(new Set(reports.map(e=>e.report)).size,reports.length);
  for(const e of reports){
   const staff=e.people.find(t=>t.id===e.report),chair=e.people.find(t=>t.id==='seongmin');assert.ok(chair);assert.equal(chair.seat.anchor,'ceo-reserved');assert.equal(chair.out.length+chair.back.length,0);
   assert.notEqual(staff.seat.anchor,'ceo-reserved');assert.ok(['junction','door'].includes(scene.anchors.get(staff.seat.anchor).type));assert.equal(scene.anchors.get(staff.seat.anchor).room,'ceo');
   assert.ok(e.performEnd-e.performStart>=20&&e.performEnd-e.performStart<=60);assert.equal(staff.out[0].from,staff.home.anchorId);assert.equal(staff.back.at(-1).to,staff.home.anchorId);
   const dist=Math.hypot((staff.seat.x-chair.seat.x)*16.72,(staff.seat.y-chair.seat.y)*9.41);assert.ok(dist>=170);
   if(staff.home.floor!=='4f'){cross++;for(const legs of [staff.out,staff.back]){const transfers=legs.filter(l=>scene.anchors.get(l.from).floor!==scene.anchors.get(l.to).floor);assert.ok(transfers.length);for(const l of transfers){assert.match(l.from,/elevator/);assert.match(l.to,/elevator/);assert.equal(s.stateAt(e,staff,(l.start+l.end)/2).walking,false)}}}
   for(const q of [...f,...out])if(q!==e&&q.start<e.end&&e.start<q.end){assert.equal(q.people.some(t=>e.people.some(p=>p.id===t.id)),false);assertResources(s,e,q)}
   for(const t of [e.start+.001,e.performStart+.001,e.performEnd-.001,e.end-.001]){const snap=s.snapshot(at(d,t),options);for(const p of snap.entries.filter(p=>p.outingId===e.id)){assert.ok([...p.shortLine].length<=10);assert.equal(snap.entries.filter(q=>q.floor===p.floor&&q.line===p.line).length,1);if(p.walking)assert.match(p.line,/가는 중|돌아가는 중/);if(p.state==='AT_PLACE')assert.ok(validPlaceSpeech(p,e.card,table));}}
   assert.equal(s.snapshot(at(d,e.performStart+1),{...options,chairmanSince:at(d,e.start+.001).getTime()}).entries.some(p=>p.outingId===e.id),false,'no report whose departure predates actual presence');
  }
 }
 assert.ok(cross>0);assert.equal(writes,0);
});
test('obr15 reciprocal two-line report dialogue, exact endpoints, absent/cancelled/summoned gates and deterministic order',()=>{
 const f=s.plan(day,options),out=s.blockPlan(day,0,f,options);
 for(const e of out.filter(e=>e.report)){
  const o={...options,chairmanSince:at(day,32400).getTime()},sec=e.performStart+.001;
  const snap=s.snapshot(at(day,sec),o),p=snap.entries.find(p=>p.id===e.report),q=snap.entries.find(p=>p.id==='seongmin');
  assert.equal(p.deskPartner,q.id);assert.equal(q.deskPartner,p.id);assert.notEqual(p.facing,q.facing);assert.equal(p.state,'AT_PLACE');assert.equal(q.state,'AT_HOME');assert.equal(q.seat.anchor,'ceo-reserved');assert.equal(q.line,'좋아요, 이대로 갑시다');assert.match(p.line,/회장님께 .+ 보고 중/);
  const later=s.snapshot(at(day,e.performEnd-.001),o).entries.find(p=>p.id===e.report);assert.notEqual(p.line,later.line);assert.ok(e.card.at.includes(later.line));
  for(const t of [e.start+.001,e.performEnd+.001,e.end-.001])assert.equal(s.snapshot(at(day,t),o).entries.some(p=>p.deskPartner==='seongmin'),false);
  for(const extra of [{cancelled:new Set([e.id])},{summoned:['seongmin']},{summoned:[e.report]},{chairmanPresent:false}])assert.equal(s.snapshot(at(day,sec),{...o,...extra}).entries.some(p=>p.deskPartner==='seongmin'),false);
  const other=loadScene().scene.scheduler;other.snapshot(at(day,e.end+1),o);assert.equal(serialize(other.snapshot(at(day,sec),o)),serialize(snap));
 }
 assert.equal(writes,0);
});
test('obr15 actual persistent renderer consumes presence greeting and reciprocal facing, then resets through the existing update path',()=>{
 const f=fixture('09:00',false,null,table),actors=[...f.ids.get('haniOfficeActors').children],tick=f.timers.find(t=>t.ms===4200).fn;
 // Fixed arrival witness from the approved cafe/rest schedule; all original
 // renderer, greeting duration, count, facing and reset assertions remain.
 f.context.window.HaniOfficePresence={chairman:'absent'};f.setDateTime(at(day,32610));f.click('4f');
 f.context.window.HaniOfficePresence={chairman:'active'};tick();
 const greeting=f.visible().filter(a=>/회장님.*(?:안건|메모|일정)/.test(a.dataset.line));assert.ok(greeting.length>=1&&greeting.length<=2);assert.ok(greeting.every(a=>a.dataset.pose==='standing'));
 const e=s.blockPlan(day,0,s.plan(day,options),options).find(e=>e.report),staff=actors.find(a=>a.dataset.person===e.report),chair=actors.find(a=>a.dataset.person==='seongmin');
 f.setDateTime(at(day,e.performStart+1));f.document.events.pointerdown();tick();assert.equal(staff.dataset.partner,'seongmin');assert.equal(chair.dataset.partner,e.report);assert.notEqual(staff.dataset.facing,chair.dataset.facing);assert.equal(chair.dataset.slot,'ceo-reserved');
 f.setDateTime(at(day,e.performEnd+1));f.document.events.pointerdown();tick();assert.equal(chair.dataset.partner,'');assert.equal(staff.dataset.partner,'');assert.equal(chair.dataset.facing,'');
 assert.deepEqual(f.ids.get('haniOfficeActors').children,actors);assert.equal(f.timers.length,2);
 const css=fs.readFileSync('hani-office-live.css','utf8');assert.match(css,/data-facing="left".*rotate:-4deg/);assert.match(css,/data-facing="right".*rotate:4deg/);assert.match(css,/@media\(prefers-reduced-motion:reduce\).*rotate:none!important/);
});
