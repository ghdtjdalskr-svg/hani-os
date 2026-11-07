import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture as mountFixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {restorePatrol278Source,projectPreKidsSource} from './hani-office-chairman-patrol-278-source.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
// Frozen patrol contract remains exact; the lively extension has live tests.
const fixture=(...args)=>{while(args.length<5)args.push(undefined);return mountFixture(...args,projectPreKidsSource)};
const {scene,table,context}=loadScene({transform:projectPreKidsSource}),s=scene.scheduler,r=scene.residents,options={chairmanPresent:true},plain=x=>JSON.parse(JSON.stringify(x));
const trips=day=>s.blockPlan(day,0,s.plan(day,options),options).filter(e=>e.patrol);
const person=(day,seconds,o=options)=>s.snapshot(at(day,seconds),o).entries.find(p=>p.id==='seongmin');
const staff=(day,seconds,o=options)=>scene.snapshot(at(day,seconds),o);

test('KST weekday/weekend rhythm books four 15–25 minute patrols across actual floors without formal or other actor conflicts',()=>{
 for(let d=2;d<=8;d++){
  const day='2026-11-'+String(d).padStart(2,'0'),formal=s.plan(day,options),all=s.blockPlan(day,0,formal,options),patrols=trips(day);
  assert.equal(patrols.length,4,day);assert.deepEqual(new Set(patrols.map(e=>e.card.floor)),new Set(['1f','2f','3f','5f']));
  for(const e of patrols){
   assert.ok(e.end-e.start>=900&&e.end-e.start<=1500);assert.equal(e.people.length,1);assert.equal(e.people[0].id,'seongmin');
   assert.equal(e.people[0].home.anchorId,'ceo-reserved');assert.ok(e.people[0].out.some(l=>scene.anchors.get(l.from).floor!==scene.anchors.get(l.to).floor));
   for(const other of [...formal,...all])if(e!==other&&e.start<other.end&&other.start<e.end)assert.ok(!other.people.some(p=>p.id==='seongmin'),'chairman commitment conflict');
   assert.ok(e.start>=e.patrol.window-1800&&e.start<=e.patrol.window+2700);assert.equal(e.patrol.weekend,d>=7);
  }
  assert.equal(s.blockPlan(day,0,s.plan(day,{}),{}).some(e=>e.patrol),false);
 }
});
test('real KST desk → path → destination → return → same desk states and deterministic samples',()=>{
 const day='2026-11-02';assert.equal(person(day,36000).seat.anchor,'ceo-reserved');
 for(const e of trips(day)){
  const t=e.people[0],out=t.out.find(l=>scene.anchors.get(l.from).floor===scene.anchors.get(l.to).floor),back=t.back.find(l=>scene.anchors.get(l.from).floor===scene.anchors.get(l.to).floor);
  for(const [seconds,state,walking]of [[(out.start+out.end)/2,'GOING',true],[(e.performStart+e.performEnd)/2,'AT_PLACE',false],[(back.start+back.end)/2,'RETURNING',true],[e.end+.01,'AT_HOME',false]]){
   const p=person(day,seconds);assert.equal(p.state,state);assert.equal(p.walking,walking);if(state==='AT_HOME')assert.equal(p.seat.anchor,'ceo-reserved');else assert.ok(p.patrol);
   assert.deepEqual(plain(person(day,seconds)),plain(person(day,seconds)));
  }
  assert.equal(person(day,(e.performStart+e.performEnd)/2).floor,e.card.floor);
  const cancelled=person(day,e.performStart+1,{...options,cancelled:new Set([e.id])});assert.equal(cancelled.patrol,undefined);
 }
 assert.equal(person(day,37800,{chairmanPresent:false}),undefined);
 const utc=new Date('2026-11-01T15:00:00Z');assert.equal(scene.snapshot(utc,options).day,'2026-11-02');
});
test('companions follow every route sample and floor transfer, remain safe, respect presence and reduced motion',()=>{
 for(const day of ['2026-11-02','2026-11-06','2026-11-07'])for(const e of trips(day)){
  const seconds=[e.start,e.performStart+1,e.performEnd+1,e.end-.01,...e.people[0].out.flatMap(l=>[l.start+.001,l.end-.001])];
  for(const sec of seconds){const snap=staff(day,sec),chair=snap.floors.flatMap(f=>f.people).find(p=>p.id==='seongmin'),followers=r.companionSnapshot(at(day,sec),snap).filter(p=>p.following);assert.equal(followers.length,day.endsWith('07')?2:1);
   for(const p of followers){assert.equal(p.floor,chair.floor);assert.equal(p.walking,chair.walking);assert.ok(r.companionSafe(p.floor,p.position,p.kid));}
   assert.ok(r.companionSnapshot(at(day,sec),snap,true,true).every(p=>!p.walking));
  }
 }
 assert.ok(r.companionSnapshot(at('2026-11-07',40000),{floors:[]}).every(p=>!p.kid));
});
test('daughter leads with hop using existing walk frames, brother follows half a step behind',()=>{
 for(const facing of ['left','right']){
  const snap={floors:[{id:'5f',people:[{id:'seongmin',floor:'5f',position:[51,70],walking:true,facing,patrol:{window:50400},state:'GOING'}]}]},kids=r.companionSnapshot(at('2026-11-07',50402),snap).filter(p=>p.kid),sister=kids.find(p=>p.id==='kid-suyeon'),brother=kids.find(p=>p.id==='kid-suhyeon'),direction=facing==='left'?-1:1;
  assert.ok((sister.position[0]-51)*direction>0);assert.ok((brother.position[0]-51)*direction<0);assert.ok(sister.motion.bob<=0);assert.match(sister.pose,/^walk-/);assert.equal(brother.scene.line,'…천천히 가.');
 }
});
test('weekend cafe/rooftop/leading dialogue and affectionate tap additions retain original exact lines',()=>{
 const day='2026-11-07';for(const [floor,line]of [['1f','아빠 나도 코코아!'],['5f','꽃이다!!'],['3f','아빠 여기여기!']]){
  const e=trips(day).find(e=>e.card.floor===floor),sec=e.performStart+20,kids=r.companionSnapshot(at(day,sec),staff(day,sec)).filter(p=>p.kid);
  assert.equal(kids.find(p=>p.id==='kid-suyeon').scene.line,line);assert.equal(kids.find(p=>p.id==='kid-suhyeon').scene.line,'수연이 가방? 내가 들어 줄게.');
 }
 const sister=r.companions.find(p=>p.id==='kid-suyeon');assert.deepEqual(plain(sister.lines),['아빠아아!','나 커서 아빠랑 결혼할 거야!','오빠는 맨날 아닌 척해!','아빠 손 꼭 잡고 갈래!','아빠랑 다니니까 제일 좋아!','아빠 여기여기! 나랑 같이 가!']);
});
test('at most two actual idle staff greet an arrival on the visited floor through existing reaction payloads',()=>{
 for(const day of ['2026-11-02','2026-11-07']){
  let count=0;for(const e of trips(day))for(const offset of [1,6]){
   const sec=e.performStart+offset,snap=staff(day,sec),reactions=r.companionSnapshot(at(day,sec),snap).flatMap(p=>p.reaction?[p.reaction]:[]);
   const own=reactions.filter(p=>p.key.includes('|patrol|'));assert.ok(own.length<=1);
   for(const row of own){const peer=snap.floors.flatMap(f=>f.people).find(p=>p.id===row.id);assert.equal(peer.floor,e.card.floor);assert.ok(!peer.walking&&!peer.eventId&&!peer.outingId);assert.equal(row.line,day.endsWith('07')?(offset===1?'어머 수연이 왔어?':'수현이도 같이 왔구나!'):'회장님 오셨어요!');count++;}
  }assert.ok(count>=2,'real present greeters '+day);
 }
});
test('actual persistent owner supports chairman and all six sister taps during patrol with no storage writes/timer/listener additions',()=>{
 const writes=[],deny=(...args)=>{writes.push(args);throw Error('forbidden patrol storage')};context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};context.fetch=deny;
 const manifest=JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json')),f=fixture('10:00',false,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:manifest},setTimeout:()=>0,localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny}});
 f.context.window.HaniOfficePresence={chairman:'active'};const e=trips('2026-11-07').find(e=>e.card.floor==='1f'),now=at('2026-11-07',e.performStart+20);f.setDateTime(now.toISOString());f.click('1f');const tick=f.timers.find(t=>t.ms===100).fn;tick();
 const nodes=f.ids.get('haniOfficeActors').children,chair=nodes.find(a=>a.dataset.person==='seongmin'),sister=nodes.find(a=>a.dataset.person==='kid-suyeon'),bubble=f.map.children.find(a=>a.className==='hani-office-character-bubble');
 assert.ok(!chair.hidden&&!sister.hidden);const tap=actor=>f.ids.get('haniOfficeActors').events.click({target:actor,isTrusted:true});tap(chair);assert.match(bubble.children[0].textContent,/회장님/);assert.equal(bubble.hidden,false);
 for(const line of r.companions.find(p=>p.id==='kid-suyeon').lines){tap(sister);assert.ok(bubble.children[0].textContent.includes(line));tick();assert.ok(bubble.children[0].textContent.includes(line));}
 f.context.window.HaniOfficePresence={chairman:'absent'};f.timers.find(t=>t.ms===4200).fn();assert.equal(chair.hidden,true);assert.equal(sister.hidden,true);assert.deepEqual(f.ids.get('haniOfficeActors').children,nodes);assert.equal(f.timers.length,2);assert.deepEqual(writes,[]);
 const source=fs.readFileSync('hani-office-live.js','utf8'),base=restorePatrol278Source(source),count=(s,re)=>[...s.matchAll(re)].length;
 for(const re of [/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:localStorage|sessionStorage)\b/g,/\bsupabase\b/g])assert.equal(count(source,re),count(base,re));
});
test('patrol retains exact runtime asset closure with no new files',async()=>{
 const read=file=>fs.readFileSync(file),a=await resolveRuntimeClosure({exists:fs.existsSync,read}),b=await resolveRuntimeClosure({exists:fs.existsSync,read:file=>['hani-office-live.js','hani-office-live.css'].includes(file)?restorePatrol278Source(read(file).toString(),file):read(file)});assert.deepEqual(a.missing,[]);assert.deepEqual(a.files,b.files);
});

test('single mounted bubble actually displays staff greetings, cocoa/flowers, and brother in order without losing pending lines',()=>{
 for(const [floor,want] of [['1f','아빠 나도 코코아!'],['5f','꽃이다!!']]){
  const manifest=JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json')),callbacks=[],f=fixture('10:00',false,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:manifest},setTimeout:(fn,ms)=>{callbacks.push({fn,ms});return callbacks.length},clearTimeout:()=>{}});
  f.context.window.HaniOfficePresence={chairman:'active'};
  const e=trips('2026-11-07').find(e=>e.card.floor===floor),bubble=f.map.children.find(a=>a.className==='hani-office-character-bubble'),tick=f.timers.find(t=>t.ms===100).fn,shown=[];
  const sample=offset=>{f.setDateTime(at('2026-11-07',e.performStart+offset).toISOString());if(offset===1)f.click(floor);tick();if(!bubble.hidden)shown.push(bubble.children[0].textContent)};
  const expire=()=>callbacks.findLast(t=>t.ms===3000)?.fn();
  sample(1);expire();sample(6);expire();sample(11);assert.ok(shown.at(-1)?.includes(want),JSON.stringify(shown));expire();sample(16);assert.ok(shown.at(-1)?.includes('수연이 가방? 내가 들어 줄게.'),JSON.stringify(shown));
  assert.ok(shown.some(l=>/어머 수연이 왔어\?|수현이도 같이 왔구나!/.test(l)),JSON.stringify(shown));
  assert.equal(f.timers.length,2);
 }
});
