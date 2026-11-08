import './hani-life-bundle-preload.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import seoyunM9 from './hani-seoyun-m9-source.cjs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {boriStrollDelta,restoreBoriStrollSource,projectPreBoriStrollSource} from './hani-office-bori-stroll-source.mjs';
const current=seoyunM9.projectPreSeoyunM9Source(fs.readFileSync('hani-office-live.js','utf8')),base=restoreBoriStrollSource(current);
const {scene,table}=loadScene(),r=scene.residents,plain=x=>JSON.parse(JSON.stringify(x));
const hash=s=>createHash('sha256').update(s).digest('hex');
const distance=(a,b)=>Math.hypot((a[0]-b[0])*scene.art.width/100,(a[1]-b[1])*scene.art.height/100);
function tourWindows(day){
 const trips=new Map();for(let sec=32400;sec<75600;sec+=60){const now=at(day,sec),staff=scene.snapshot(now,{chairmanPresent:true}),p=r.snapshot(now,staff).find(p=>p.id==='pet-bori');if(p?.stroll)trips.set(p.stroll.key,{...p.stroll,day,floor:p.floor})}return [...trips.values()];
}

test('stroll exact inverse retains all f1a457f bytes and original 278 contract; every partial/duplicate/unrelated edit is rejected',()=>{
 assert.equal(base,fs.readFileSync('artifacts/bori-stroll/baseline-hani-office-live.js.txt','utf8'));
 assert.equal(hash(fs.readFileSync('scripts/fixtures/office-chairman-patrol-278-delta.json')),hash(fs.readFileSync('artifacts/bori-stroll/baseline-278-delta.json')));
 let forward=base,aEnd=0,bEnd=0;
 for(const pair of boriStrollDelta.replacements){
  assert.ok(pair.before.length&&pair.after.length);assert.notEqual(pair.before,pair.after);assert.equal(base.split(pair.before).length-1,1);assert.equal(current.split(pair.after).length-1,1);
  const a=base.indexOf(pair.before),b=current.indexOf(pair.after);assert.ok(a>=aEnd&&b>=bEnd,pair.name);aEnd=a+pair.before.length;bEnd=b+pair.after.length;forward=forward.replace(pair.before,()=>pair.after);
  assert.throws(()=>restoreBoriStrollSource(current.replace(pair.after,()=>pair.before)));assert.throws(()=>restoreBoriStrollSource(current+pair.after));
 }assert.equal(forward,current);
 for(const bad of [base,current+'\n',current.slice(1),current+current])assert.throws(()=>restoreBoriStrollSource(bad));assert.throws(()=>restoreBoriStrollSource(current,'hani-main.js'));
});
test('stroll inverse independently matches the fixed Git base',()=>{
 assert.equal(base,execFileSync('git',['show',boriStrollDelta.baseCommit+':hani-office-live.js'],{encoding:'utf8',maxBuffer:32*1024*1024}));
});

test('weekday/weekend minute-by-minute days: 15..25 daytime outings, 2..4 minutes each, no night outing or pet/companion/sibling overlap',()=>{
 const evidence=[];
 for(const day of ['2026-11-02','2026-11-03','2026-11-06','2026-11-07','2026-11-08']){
  const trips=new Map(),daytime={samples:720,visible:0,sleep:0,awake:0,walking:0};let overlap=0,night=0,nap=0,walk=0,visible=0;
  for(let sec=0;sec<86400;sec+=60){
   const now=at(day,sec),staff=scene.snapshot(now,{chairmanPresent:true}),before=JSON.stringify(staff),states=r.snapshot(now,staff),p=states.find(p=>p.id==='pet-bori');
   assert.equal(JSON.stringify(staff),before);if(!p)continue;visible++;if(p.pose==='sleep')nap++;if(p.walking)walk++;
   assert.ok(r.safe(p.floor,p.point,p.position));
   const companions=r.companionSnapshot(now,staff,true,false,states);
   if(sec>=22*3600||sec<9*3600){if(p.stroll||p.walking)night++;assert.equal(p.pose,'sleep')}
   if(sec>=9*3600&&sec<21*3600){daytime.visible++;if(p.walking){daytime.walking++;assert.match(p.pose,/^walk-[ab]$/)}else if(p.pose==='sleep')daytime.sleep++;else {assert.ok(['sitting','standing'].includes(p.pose));daytime.awake++}}
   for(const q of [...states,...companions].filter(q=>q.id!==p.id&&q.floor===p.floor))if(distance(p.position,q.position)<96-1e-6)overlap++;
   if(!p.stroll)continue;
   trips.set(p.stroll.key,p.stroll);assert.ok(sec>=9*3600&&sec<21*3600);assert.ok(p.stroll.duration>=120&&p.stroll.duration<=240);
   assert.equal(p.floor,sec>=13*3600&&sec<15*3600?'2f':'1f');
   for(const stop of p.stroll.stops){const a=r.spot(stop);assert.ok(a);assert.equal(a.floor,p.floor)}
   assert.ok(p.stroll.stops.length>=2&&p.stroll.stops.length<=3);
  }
  const starts=[...trips.values()].map(t=>t.start).sort((a,b)=>a-b),intervals=starts.slice(1).map((s,i)=>(s-starts[i])/60);
  evidence.push({day,samples:1440,daytime,outings:trips.size,night,overlap,visible,sleepMinutes:nap,walkingMinuteSamples:walk,intervalMinutes:intervals,durations:[...trips.values()].map(t=>t.duration)});
  assert.ok(trips.size>=15&&trips.size<=25,day+' outings '+trips.size);assert.equal(night,0);assert.equal(overlap,0);assert.ok(visible>=1440*.95);
  assert.ok(daytime.visible>=720*.95);assert.ok(daytime.sleep/720>=.3&&daytime.sleep/720<=.5,day+' sleep '+daytime.sleep);assert.ok(daytime.awake/720>=.3,day+' awake '+daytime.awake);assert.ok(daytime.walking/720>=.1,day+' walking '+daytime.walking);
  for(const gap of intervals)assert.ok(gap>=30&&gap<=45,day+' gap '+gap);
 }
 fs.mkdirSync('artifacts/bori-fix',{recursive:true});fs.writeFileSync('artifacts/bori-fix/daily-evidence.json',JSON.stringify(evidence,null,2)+'\n');console.log('Bori daily evidence',JSON.stringify(evidence));
});

test('second-level full tours wake, walk to 1..2 stops and return home without collisions; routes reserve both ends from the chick',()=>{
 const result=[];
 for(const day of ['2026-11-02','2026-11-07']){
  for(const trip of tourWindows(day)){
   const seen=new Set(),poses=new Set();let walks=0,lines=0,hidden=0;
   for(let elapsed=0;elapsed<trip.duration;elapsed+=.5){
    const now=at(day,trip.start+elapsed),staff=scene.snapshot(now,{chairmanPresent:true}),states=r.snapshot(now,staff),p=states.find(p=>p.id==='pet-bori'),companions=r.companionSnapshot(now,staff,true,false,states);
    // The canonical free rule can hide a resident briefly when staff cross both
    // home stops. Record those samples instead of forcing an occupied position.
    if(!p){hidden++;continue}assert.equal(p.floor,trip.floor);assert.ok(r.safe(p.floor,p.point,p.position));poses.add(p.pose);if(p.walking)walks++;if(p.scene){assert.ok(r.people.find(p=>p.id==='pet-bori').lines.includes(p.scene.line));lines++}
    if(p.stroll){for(const id of p.stroll.stops)if(distance(p.position,r.spot(id).visual)<1)seen.add(id)}
    for(const q of [...states,...companions].filter(q=>q.id!==p.id&&q.floor===p.floor))assert.ok(distance(p.position,q.position)>=96-1e-6,day+' '+(trip.start+elapsed)+' '+q.id);
   }
   assert.ok(walks>0);assert.ok(poses.has('standing'));assert.ok(poses.has('sleep'));assert.ok(seen.size>=2);assert.ok(hidden/(trip.duration*2)<.1);result.push({day,start:trip.start,stops:[...seen],walkSamples:walks,lineSamples:lines,hiddenSamples:hidden});
   const end=at(day,trip.start+trip.duration-1),home=r.snapshot(end,scene.snapshot(end,{chairmanPresent:true})).find(p=>p.id==='pet-bori');assert.equal(home.pose,'sleep');assert.equal(home.walking,false);assert.ok(distance(home.position,r.spot(trip.stops[0]).visual)<1);
   const after=at(day,trip.start+trip.duration),p=r.snapshot(after,scene.snapshot(after,{chairmanPresent:true})).find(p=>p.id==='pet-bori');assert.equal(p.stroll,undefined);assert.ok(r.safe(p.floor,p.point,p.position));
  }
 }
 fs.writeFileSync('artifacts/bori-fix/tour-evidence.json',JSON.stringify(result,null,2)+'\n');
});

test('date seed, reordered samples, absent chairman, reduced motion, KST boundaries and blocking retain safe nap behavior',()=>{
 const now=at('2026-11-07',50400),staff=scene.snapshot(now,{chairmanPresent:false}),a=r.snapshot(now,staff);r.snapshot(at('2026-11-08',72000));assert.deepEqual(plain(r.snapshot(now,staff)),plain(a));
 for(const day of ['2026-11-02','2026-11-07'])for(let sec=0;sec<86400;sec+=60){const now=at(day,sec),staff=scene.snapshot(now,{chairmanPresent:false}),p=r.snapshot(now,staff,true,true).find(p=>p.id==='pet-bori');assert.ok(p);assert.equal(p.pose,'sleep');assert.equal(p.walking,false);assert.equal(p.stroll,undefined)}
 for(const sec of [0,32399.9,75600,79200,86399.9]){const now=at('2026-11-07',sec),p=r.snapshot(now,{floors:[]}).find(p=>p.id==='pet-bori');assert.equal(p.pose,'sleep');assert.equal(p.stroll,undefined)}
 assert.deepEqual(plain(r.snapshot(now,staff,false)),[]);
 const trip=tourWindows('2026-11-02')[0],block=r.spot(trip.stops[1]),blocked={floors:[{people:[{id:'blocker',floor:block.floor,position:block.visual}]}]},p=r.snapshot(at(trip.day,trip.start+10),blocked).find(p=>p.id==='pet-bori');assert.ok(!p||!p.walking&&!p.stroll);
 const home=r.spot('resident_bori_lobby_a'),other=r.spot('resident_bori_lobby_b'),m=r.motion('pet-bori','2026-11-07',1,home,other,.5);assert.ok(m.speed>=16.2&&m.speed<=19.8);
});

test('real persistent DOM: one Bori bubble on original owner, no writes, unchanged timers/listeners/nodes, hidden and reduced motion',()=>{
 const writes=[],deny=(...args)=>{writes.push(args);throw Error('forbidden persistence')},manifest=JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json'));
 const mount=(transform=s=>s,reduced=false)=>fixture('14:00',reduced,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:manifest},setTimeout:()=>0,localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny}},transform);
 const f=mount(),old=mount(projectPreBoriStrollSource),slots=f.ids.get('haniOfficeActors').children.slice(),tick=f.timers.find(t=>t.ms===100).fn;
 assert.deepEqual(f.timers.map(t=>t.ms),old.timers.map(t=>t.ms));assert.deepEqual(Object.keys(f.document.events),Object.keys(old.document.events));assert.equal(slots.length,old.ids.get('haniOfficeActors').children.length);
 f.context.window.HaniOfficePresence={chairman:'active'};const actor=slots.find(a=>a.dataset.person==='pet-bori'),panel=f.root.querySelector('.hani-office-character-bubble');let lines=0;
 const samples=['2026-11-02','2026-11-07'].flatMap(day=>{const all=tourWindows(day);return ['1f','2f'].map(floor=>all.find(t=>t.floor===floor&&t.beat%3===0)).filter(Boolean)});
 for(const trip of samples){
  f.click(r.spot(trip.stops[0]).floor);
  for(let sec=trip.start;sec<trip.start+240;sec++){
   f.setDateTime(at(trip.day,sec).toISOString());tick();if(actor.officeResidentState?.scene&&actor.dataset.speaking==='true'){lines++;assert.equal(panel.hidden,false);assert.ok(panel.textContent.includes('보리'))}assert.equal(f.root.querySelectorAll('.hani-office-character-bubble').length,1);
  }
 }
 assert.ok(lines>0);assert.deepEqual(f.ids.get('haniOfficeActors').children,slots);assert.deepEqual(writes,[]);
 f.click('3f');tick();const before=actor.officeResidentState;f.setDateTime('2026-11-07T16:00:00+09:00');tick();assert.equal(actor.officeResidentState,before);f.hide();tick();assert.equal(f.root.dataset.paused,'true');
 const reduced=mount(s=>s,true);for(const sec of [32400,36000,50400,72000]){reduced.setDateTime(at('2026-11-07',sec).toISOString());reduced.click(sec>=46800&&sec<54000?'2f':'1f');reduced.timers.find(t=>t.ms===100).fn();const p=reduced.ids.get('haniOfficeActors').children.find(p=>p.dataset.person==='pet-bori');assert.equal(p.dataset.walking,'false')}
 for(const regex of [/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g,/\brequestAnimationFrame\s*\(/g,/\bcreateElement\s*\(/g,/\b(?:localStorage|sessionStorage)\b/g,/\bsupabase\b/g])assert.equal([...current.matchAll(regex)].length,[...base.matchAll(regex)].length);
});

test('Tuesday 10:00 KST at 40x: 90 actual persistent DOM poses retain daytime sleep, awake and walking shares',()=>{
 const f=fixture('10:00',false,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json'))},setTimeout:()=>0});
 f.context.window.HaniOfficePresence={chairman:'active'};f.click('1f');
 const actor=f.ids.get('haniOfficeActors').children.find(a=>a.dataset.person==='pet-bori'),tick=f.timers.find(t=>t.ms===100).fn,counts={sleep:0,awake:0,walking:0},samples=[];
 for(let i=0;i<90;i++){
  f.setDateTime(at('2026-11-03',36000+i*40).toISOString());tick();assert.equal(actor.hidden,false);
  const {pose,walking}=actor.dataset,p=actor.officeResidentState;assert.equal(pose,p.pose);assert.equal(walking,String(p.walking));
  if(walking==='true'){counts.walking++;assert.match(pose,/^walk-[ab]$/)}else if(pose==='sleep')counts.sleep++;else {assert.ok(['sitting','standing'].includes(pose));counts.awake++}
  samples.push({i,pose,walking});
 }
 assert.ok(counts.sleep>=27&&counts.sleep<=45,JSON.stringify(counts));assert.ok(counts.awake>=27,JSON.stringify(counts));assert.ok(counts.walking>=9,JSON.stringify(counts));
 fs.writeFileSync('artifacts/bori-fix/dom-40x.json',JSON.stringify({day:'2026-11-03',start:'10:00 KST',counts,samples},null,2)+'\n');
});

test('runtime closure, CSS, assets, version, staff plan and other resident definitions have no dependency change',async()=>{
 const read=f=>fs.readFileSync(f),a=await resolveRuntimeClosure({exists:fs.existsSync,read}),b=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>f==='hani-office-live.js'?Buffer.from(base):read(f)});assert.deepEqual(a.files,b.files);assert.deepEqual(a.missing,[]);assert.equal(a.files.length,161);
 const residentStart=s=>s.indexOf('  const residentNames='),companionStart=s=>s.indexOf('  function companionSnapshot(');assert.equal(current.slice(0,residentStart(current)),base.slice(0,residentStart(base)));assert.equal(current.slice(residentStart(current),companionStart(current)),base.slice(residentStart(base),companionStart(base)));
});
