import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {loadScene,at,readAt} from './hani-office-lively-fixture.mjs';
import {spriteBox,boxesOverlap} from './hani-office-obr21-geometry.mjs';
const {scene,context,table}=loadScene(),s=scene.scheduler;
let writes=0;const deny=()=>{writes++;throw Error('forbidden persistence/network')};
context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};context.fetch=deny;
test('obr21 authored full absent/present plans and reverse snapshots match frozen delta',()=>{
 const bytes=gunzipSync(fs.readFileSync('scripts/fixtures/office-obr21-plans.json.gz'));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'c4fb9bd7308ae9244c48d1f21cdefded76a09390cd3d4cb2dd6dbf848d0c6870');
 const frozen=JSON.parse(bytes);assert.equal(createHash('sha256').update(fs.readFileSync('hani-office-live.js')).digest('hex'),frozen.sourceSha256);
 for(const r of frozen.records){const api=loadScene().scene.scheduler,f=api.plan(r.day,r.options),o=api.blockPlan(r.day,0,f,r.options);
  assert.equal(JSON.stringify(f),JSON.stringify(r.formal),r.label+' formal');assert.equal(JSON.stringify(o),JSON.stringify(r.outings),r.label+' outings');
  for(const row of r.snapshots.toReversed())assert.equal(JSON.stringify(api.snapshot(at(r.day,row.seconds),r.options)),JSON.stringify(row.snapshot),r.label+' '+row.seconds);
 }assert.equal(writes,0);
});
test('obr21 all 1F stationary intervals incl waits: independent phone sprite boxes do not overlap; formal catalog and fixed homes exempt',()=>{
 const rows=[];
 for(const day of ['2026-10-21','2026-10-22','2026-10-23','2026-10-24'])for(const chairmanPresent of [false,true]){
  const options={chairmanPresent},formal=s.plan(day,options),out=s.blockPlan(day,0,formal,options),events=[...formal,...out],stops=[];
  // Derive each actor's piecewise timeline independently from public legs and
  // stateAt, including gaps at home. A sweep covers whole intersecting intervals.
  const ids=[...table.people.filter(p=>p.id!=='seongmin'||chairmanPresent).map(p=>p.id),'visitor','visitor-2'];
  for(const id of ids){const person=table.people.find(p=>p.id===id),visitor=id.startsWith('visitor'),own=events.filter(e=>e.people.some(t=>t.id===id)),times=new Set([0,3600,25200,32400,64800,68400,86400]);
   for(const e of own){times.add(e.start);times.add(e.end);const t=e.people.find(t=>t.id===id);for(const l of [...t.out,...t.back]){times.add(l.start);times.add(l.end)}}
   const ticks=[...times].sort((a,b)=>a-b);
   for(let i=1;i<ticks.length;i++){const start=ticks[i-1],end=ticks[i],sec=(start+end)/2,e=own.find(e=>e.start<=sec&&sec<e.end);if(!visitor&&!s.presentAt(id,sec)||visitor&&!e)continue;
    const h=person&&s.homeAt(person,sec),p=e?s.stateAt(e,e.people.find(t=>t.id===id),sec):{seat:s.slot(h.anchorId,'sit'),floor:h.floor,walking:false,state:'AT_HOME'};
    if(p.floor==='1f'&&!p.walking)stops.push({...p,id,visitor,start,end,catalog:!!e&&!e.card});
   }
  }
  let pairs=0,homeExceptions=0,catalogExceptions=0;const witnesses=new Map(),active=[];
  for(const p of stops.sort((a,b)=>a.start-b.start)){for(let i=active.length-1;i>=0;i--)if(active[i].end<=p.start)active.splice(i,1);
   for(const q of active){if(p.id===q.id)continue;pairs++;if(p.catalog||q.catalog){if(boxesOverlap(spriteBox(p),spriteBox(q)))catalogExceptions++;continue}const home=p.state==='AT_HOME'&&q.state==='AT_HOME'&&!p.visitor&&!q.visitor;
    if(home){if(boxesOverlap(spriteBox(p),spriteBox(q)))homeExceptions++;continue}
    const sec=(Math.max(p.start,q.start)+Math.min(p.end,q.end))/2;
    assert.ok(!boxesOverlap(spriteBox(p),spriteBox(q)),JSON.stringify({day,chairmanPresent,sec,p:p.id,q:q.id,anchors:[p.seat.anchor,q.seat.anchor]}));
    const key=[p.id,p.seat.anchor,q.id,q.seat.anchor].join('|');if(!witnesses.has(key))witnesses.set(key,sec);
   }active.push(p);
  }
  rows.push({day,chairmanPresent,stationaryIntervals:stops.length,pairs,homeExceptions,catalogExceptions,witnesses:[...witnesses.values()]});
 }
 fs.writeFileSync('artifacts/office-behavior/obr21-stationary.json',JSON.stringify(rows,null,2)+'\n');assert.ok(rows.every(r=>r.pairs>0));assert.equal(writes,0);
});
test('obr21 every report uses existing CEO floor >=170 art pixels away with reciprocal facing and safe phone boxes',()=>{
 for(const day of ['2026-10-21','2026-10-22','2026-10-23','2026-10-24']){
  const o={chairmanPresent:true},f=s.plan(day,o),out=s.blockPlan(day,0,f,o),reports=out.filter(e=>e.report);assert.ok(reports.length>=4&&reports.length<=8);
  for(const e of reports){const t=e.people.find(t=>t.id===e.report),a=scene.anchors.get(t.seat.anchor);assert.equal(a.room,'ceo');assert.ok(['junction','door'].includes(a.type));
   for(const sec of [e.performStart+.001,e.performEnd-.001]){const snap=s.snapshot(at(day,sec),o),p=snap.entries.find(p=>p.id===e.report),q=snap.entries.find(p=>p.id==='seongmin');
    assert.ok(Math.hypot((p.seat.x-q.seat.x)*16.72,(p.seat.y-q.seat.y)*9.41)>=170);assert.ok(!boxesOverlap(spriteBox(p),spriteBox(q)));assert.equal(p.deskPartner,q.id);assert.equal(q.deskPartner,p.id);assert.notEqual(p.facing,q.facing);
   }
   assert.equal(t.out[0].from,t.home.anchorId);assert.equal(t.back.at(-1).to,t.home.anchorId);
  }
 }assert.equal(writes,0);
});
test('obr21 fixed pre-patch collision witnesses fail on base and clear on current, including reduced motion/cancellation',()=>{
 const old=loadScene({ref:'2cd24abb6360f6509d005b975eb0513ad6b1a03e'}).scene.scheduler;
 // Reduced motion can show a GOING actor on its actual fixed home anchor.
 // Exempt that existing furniture overlap by anchor, never by logical phase.
 const home=p=>!p.visitor&&scene.homeSeat(p.id)?.anchor===p.seat.anchor;
 const collisions=snap=>{const people=[...snap.entries,...snap.visitors].filter(p=>p.floor==='1f'&&!p.walking);return people.flatMap((p,i)=>people.slice(i+1).filter(q=>!p.eventId&&!q.eventId&&!(home(p)&&home(q))&&boxesOverlap(spriteBox(p),spriteBox(q))).map(q=>[p.id,q.id]))};
 for(const sec of [32895,33678,34360,36012]){
  assert.ok(collisions(old.snapshot(at('2026-10-22',sec))).length>0,'fixed base must reproduce overlap '+sec);
  for(const chairmanPresent of [false,true])for(const reducedMotion of [false,true]){
   const o={chairmanPresent,reducedMotion},time=at('2026-10-22',sec);assert.deepEqual(collisions(s.snapshot(time,o)),[],JSON.stringify({sec,o}));
   const out=s.blockPlan('2026-10-22',0,s.plan('2026-10-22',o),o),active=out.filter(e=>e.start<=sec&&sec<e.end);
   for(const e of active)assert.deepEqual(collisions(s.snapshot(time,{...o,cancelled:new Set([e.id])})),[],'cancel '+e.id);
  }
 }assert.equal(writes,0);
});

// The index update must preserve bucket/ledger order, even after extensions.
test('obr21 cached gathering/index decisions equal full index rebuilds',()=>{
 const original=readAt('hani-office-live.js','2cd24abb6360f6509d005b975eb0513ad6b1a03e');
 const range=src=>src.slice(src.indexOf('    function resourceIntervals(e){'),src.indexOf('    const resourceSets='));
 assert.ok(range(original).includes('intervalCache.set(e,result)'));
 const transform=source=>{
  const anchor='replaceLedgerIndex(ledger,old,e);replaceLedgerIndex(result,old,e);';
  assert.ok(source.includes(anchor));
  return source.replace(range(source),range(original)).replace(anchor,'ledgerIndices.delete(ledger);ledgerIndices.delete(result);')
   .replace('function weight(card,people,at){','function weight(card,people,at){gatheringWindow=null;');
 };
 for(const day of ['2026-10-22','2026-10-23'])for(const chairmanPresent of [false,true]){
  const options={chairmanPresent},a=loadScene().scene.scheduler,b=loadScene({transform}).scene.scheduler;
  const af=a.plan(day,options),bf=b.plan(day,options);
  assert.equal(JSON.stringify(af),JSON.stringify(bf));
  assert.equal(JSON.stringify(a.blockPlan(day,0,af,options)),JSON.stringify(b.blockPlan(day,0,bf,options)),day+' '+chairmanPresent);
  for(const sec of [3600,32400,43800,56400,64800,75599])assert.equal(JSON.stringify(a.snapshot(at(day,sec),options)),JSON.stringify(b.snapshot(at(day,sec),options)));
 }
});

test('obr21 new desk gestures keep the phone envelope clear without moving fixed homes',()=>{
 let pairs=0;
 const api=loadScene().scene.scheduler;
 for(const day of ['2026-10-22','2026-10-23'])for(let sec=32400;sec<64800;sec+=5){
  const snap=api.snapshot(at(day,sec)),peers=snap.entries.filter(p=>p.deskPartner&&p.id!=='seongmin'&&p.deskPartner!=='seongmin');
  for(const p of peers){pairs++;assert.equal(p.state,'AT_HOME');
   for(const q of snap.entries.filter(q=>q.id!==p.id&&q.floor===p.floor&&!q.walking)){
    const seat=q.seat,dx=Math.abs(p.seat.x-seat.x)*3.42,dy=Math.abs(p.seat.y-seat.y)*(342*941/1672)/100;
    assert.ok(dx>=38||dy>=44,day+' '+sec+' '+p.id+' / '+q.id);
   }
  }
 }
 assert.ok(pairs>0,'safe desk conversations remain reachable');
 // Original crowded home seats are retained, including the documented pair.
 assert.equal(scene.homeSeat('sua').anchor,'business-west');assert.equal(scene.homeSeat('taeo').anchor,'business-east');
});
