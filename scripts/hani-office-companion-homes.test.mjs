import './hani-life-bundle-preload.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {patrol278Delta,restoreCompanionHomesSource,projectPreCompanionHomesSource} from './hani-office-chairman-patrol-278-source.mjs';
import {projectPreBoriStrollSource} from './hani-office-bori-stroll-source.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),plain=x=>JSON.parse(JSON.stringify(x));
const current=projectPreBoriStrollSource(fs.readFileSync('hani-office-live.js','utf8')),base=restoreCompanionHomesSource(current);
const {scene,table}=loadScene({transform:projectPreBoriStrollSource}),r=scene.residents,prior=loadScene({transform:projectPreCompanionHomesSource}).scene;
const homes={'companion-frog':'4f','companion-penguin':'3f','companion-chick':'2f','companion-fox':'2f','companion-otter':'1f'};
const weekdays=['companion-frog','companion-penguin','companion-otter','companion-chick','companion-fox'];
const chair=(floor='4f')=>({floors:[{id:floor,people:[{id:'seongmin',floor,position:[51,66],pose:'sitting',walking:false}]}]});
const distance=(a,b)=>Math.hypot((a[0]-b[0])*scene.art.width/100,(a[1]-b[1])*scene.art.height/100);

test('home extension retains the exact entire 278 contract and restores c590f8a; rejects every partial, duplicate and unrelated edit',()=>{
 const {companionHomesExtension:row,...older}=patrol278Delta,bytes=fs.readFileSync('artifacts/companion-homes/baseline-278-delta.json');
 assert.equal(hash(bytes),'22a25dcad943eca990558ab02c930aec7f2ee134da6f1da9e5ddff0bbb7909d5');assert.deepEqual(older,JSON.parse(bytes));
 assert.equal(row.baseCommit,'c590f8ab64270857e5f50d82330f89a126e3b8a6');assert.equal(hash(base),'aa5c9893814c89d00e57626b9a43582ad885e4c93d6b152f338204a2e52375c9');
 let forward=base,aEnd=0,bEnd=0;
 for(const pair of row.replacements){
  assert.ok(pair.before.length&&pair.after.length);assert.notEqual(pair.before,pair.after);assert.equal(base.split(pair.before).length-1,1);assert.equal(current.split(pair.after).length-1,1);
  const a=base.indexOf(pair.before),b=current.indexOf(pair.after);assert.ok(a>=aEnd&&b>=bEnd);aEnd=a+pair.before.length;bEnd=b+pair.after.length;forward=forward.replace(pair.before,()=>pair.after);
  assert.throws(()=>restoreCompanionHomesSource(current.replace(pair.after,()=>pair.before)));assert.throws(()=>restoreCompanionHomesSource(current+pair.after));
 }assert.equal(forward,current);assert.equal(hash(current),row.afterSha256);
 for(const bad of [current+'\n',current.slice(1),base,current+current])assert.throws(()=>restoreCompanionHomesSource(bad));assert.throws(()=>restoreCompanionHomesSource(current,'hani-main.js'));
});
test('home extension independently matches the specified fixed Git base',()=>{
 assert.equal(base,execFileSync('git',['show','c590f8ab64270857e5f50d82330f89a126e3b8a6:hani-office-live.js'],{encoding:'utf8',maxBuffer:32*1024*1024}));
});

test('every minute of all five weekdays and both weekend days keeps off-duty animals home and original followers; reports all visible pet floor maxima',()=>{
 const evidence=[];
 for(let d=2;d<=8;d++){
  const day='2026-11-'+String(d).padStart(2,'0'),weekend=d>=7,maxima=Object.fromEntries(scene.floors.map(f=>[f.id,0])),companionMaxima={...maxima},hidden=Object.fromEntries(Object.keys(homes).map(id=>[id,0]));let samples=0;
  for(let sec=0;sec<86400;sec+=60){
   const now=at(day,sec),staff=scene.snapshot(now,{chairmanPresent:true}),before=JSON.stringify(staff),existing=r.snapshot(now,staff),states=r.companionSnapshot(now,staff,true,false,existing),followers=states.filter(p=>p.following),ceo=staff.floors.flatMap(f=>f.people).find(p=>p.id==='seongmin'&&p.state!=='ABSENT');
   assert.equal(JSON.stringify(staff),before);for(const id of Object.keys(homes))if(!states.some(p=>p.id===id))hidden[id]++;
   assert.deepEqual(plain(followers.map(p=>p.id)),weekend?['kid-suhyeon','kid-suyeon']:[weekdays[d-2]]);
   assert.ok(followers.every(p=>p.floor===ceo.floor));assert.equal(states.filter(p=>p.kid).length,weekend?2:0);
   for(const p of states.filter(p=>p.pet&&!p.following))assert.equal(p.floor,homes[p.id],day+' '+sec+' '+p.id);
   const pets=[...existing,...states].filter(p=>p.pet);
   for(const f of scene.floors){maxima[f.id]=Math.max(maxima[f.id],pets.filter(p=>p.floor===f.id).length);companionMaxima[f.id]=Math.max(companionMaxima[f.id],states.filter(p=>p.pet&&p.floor===f.id).length)}
   for(let i=0;i<states.length;i++)for(const p of states.slice(i+1))if(p.floor===states[i].floor&&p.pet&&states[i].pet)assert.ok(distance(p.position,states[i].position)>=70-1e-6,'companion footprints remain free');
   samples++;
  }evidence.push({day,samples,allPets:maxima,companionsOnly:companionMaxima,hiddenByExistingFreeRule:hidden});
 }console.log('companion homes daily maxima '+JSON.stringify(evidence));
});

test('absent chairman, reduced motion and KST midnight keep home rules and weekend sibling presence',()=>{
 for(const day of ['2026-11-02','2026-11-07'])for(const reduced of [false,true])for(let sec=0;sec<86400;sec+=60){
  const states=r.companionSnapshot(at(day,sec),{floors:[]},true,reduced),weekday=day.endsWith('02');
  assert.equal(states.length,weekday?4:5);assert.ok(states.every(p=>!p.following&&!p.kid&&p.floor===homes[p.id]));if(reduced)assert.ok(states.every(p=>!p.walking));
 }
 for(const iso of ['2026-11-06T23:59:59.999+09:00','2026-11-07T00:00:00+09:00','2026-11-08T23:59:59.999+09:00','2026-11-09T00:00:00+09:00']){
  const states=r.companionSnapshot(new Date(iso),chair()),old=prior.residents.companionSnapshot(new Date(iso),chair());assert.deepEqual(plain(states.filter(p=>p.following).map(p=>p.id)),plain(old.filter(p=>p.following).map(p=>p.id)));
 }assert.deepEqual(plain(r.companionSnapshot(new Date(),chair(),false)),[]);
});

test('preferred 2F department stops, within-floor walking/sitting, safe envelopes and deterministic results survive',()=>{
 const moving=new Set(),sitting=new Set(),slots={chick:new Set(),fox:new Set()};
 for(let sec=50400;sec<50640;sec+=.5){
  const now=at('2026-11-07',sec),states=r.companionSnapshot(now,{floors:[]});assert.equal(states.length,5);
  assert.deepEqual(plain(states),plain(r.companionSnapshot(now,{floors:[]})));
  for(const p of states){assert.equal(p.floor,homes[p.id]);assert.ok(r.safe(p.floor,p.point,p.position));if(p.walking)moving.add(p.id);if(p.pose==='sitting')sitting.add(p.id)}
  for(const [id,prefix]of [['chick','resident_bori_'],['fox','resident_dog_']]){
   const pet=states.find(p=>p.id==='companion-'+id);
   const stops=id==='chick'?['resident_bori_lounge_a','resident_bori_lounge_b']:['resident_dog_hall','resident_dog_hall_front'];
   const anchors=stops.map(id=>r.spot(id));assert.ok(pet.point[0]>=Math.min(...anchors.map(s=>s.x))&&pet.point[0]<=Math.max(...anchors.map(s=>s.x))&&pet.point[1]===330,prefix);slots[id].add(pet.position.join(','));
  }
 }assert.deepEqual([...moving].sort(),Object.keys(homes).sort());assert.deepEqual([...sitting].sort(),Object.keys(homes).sort());assert.ok(slots.chick.size>1&&slots.fox.size>1);
});

test('executed 2F motion endpoint reservations never share a stop, including occupied preferred-stop fallback',()=>{
 // Observe the actual selected IDs without adding a production API or state.
 const traced=loadScene({transform:s=>'globalThis.__homeLegs=[];\n'+projectPreBoriStrollSource(s).replace('usedStops.add(a.id);usedStops.add(b.id);','globalThis.__homeLegs.push({id:person.id,from:a.id,to:b.id});usedStops.add(a.id);usedStops.add(b.id);')});
 for(let sec=0;sec<86400;sec+=60){
  traced.context.__homeLegs.length=0;const now=at('2026-11-07',sec),staff=traced.scene.snapshot(now,{chairmanPresent:true}),existing=traced.scene.residents.snapshot(now,staff);
  traced.scene.residents.companionSnapshot(now,staff,true,false,existing);
  const legs=traced.context.__homeLegs.filter(p=>p.id==='companion-chick'||p.id==='companion-fox');
  if(legs.length===2)assert.ok(![legs[0].from,legs[0].to].some(id=>id===legs[1].from||id===legs[1].to),'both moving endpoints remain distinct');
 }
});

test('occupied preferred 2F stops fall back to an existing safe pet stop without changing floors',()=>{
 const blockers=['resident_bori_lounge_a','resident_bori_lounge_b'].flatMap(id=>{const s=r.spot(id);return [0,-12,12,24].map((dy,i)=>({id:id+i,resident:true,pet:true,floor:'2f',position:[s.visual[0],s.visual[1]+dy]}))});
 const states=r.companionSnapshot(at('2026-11-07',50400),{floors:[]},true,false,blockers),chick=states.find(p=>p.id==='companion-chick');
 assert.ok(chick,'finance-side fallback is available');assert.equal(chick.floor,'2f');assert.ok(r.safe(chick.floor,chick.point,chick.position));assert.ok(chick.point[0]<r.spot('resident_bori_lounge_a').x);
});

test('existing residents and hidden visit/patrol owners retain exact source and resident output',()=>{
 const start=s=>s.indexOf('  function companionSnapshot('),end=s=>s.indexOf('  function companionActivity(');
 assert.equal(current.slice(0,start(current)),base.slice(0,start(base)));assert.equal(current.slice(end(current)),base.slice(end(base)));
 for(const day of ['2026-11-02','2026-11-07'])for(const sec of [0,25200,36000,50400,72000,86399]){
  const now=at(day,sec),staff=scene.snapshot(now,{chairmanPresent:true});assert.deepEqual(plain(r.snapshot(now,staff)),plain(prior.residents.snapshot(now,staff)));
 }assert.deepEqual(plain(r.kidsVisitLines),plain(prior.residents.kidsVisitLines));
});

test('actual persistent DOM mounts all department pets on weekdays/weekends with zero writes and unchanged timer/listener registration',()=>{
 const writes=[],manifest=JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json')),deny=(...args)=>{writes.push(args);throw Error('forbidden home persistence')};
 const mount=transform=>fixture('14:00',false,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:manifest},setTimeout:()=>0,localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny}},s=>transform(projectPreBoriStrollSource(s)));
 const f=mount(s=>s),old=mount(projectPreCompanionHomesSource),slots=f.ids.get('haniOfficeActors').children.slice(),tick=f.timers.find(t=>t.ms===100).fn;
 assert.deepEqual(f.timers.map(t=>t.ms),old.timers.map(t=>t.ms));assert.deepEqual(Object.keys(f.document.events),Object.keys(old.document.events));
 for(const day of ['2026-11-02','2026-11-07']){
  f.context.window.HaniOfficePresence={chairman:'active'};f.setDateTime(day+'T14:00:00+09:00');
  for(const floor of scene.floors.map(p=>p.id)){
   f.click(floor);tick();const states=f.context.HaniBuildingScene.residents.companionSnapshot(new Date(day+'T14:00:00+09:00'),f.context.HaniBuildingScene.snapshot(new Date(day+'T14:00:00+09:00'),{chairmanPresent:true}));
   for(const p of states){const actor=slots.find(a=>a.dataset.person===p.id);assert.equal(actor.hidden,p.floor!==floor,p.id+' '+floor)}
  }
 }assert.deepEqual(f.ids.get('haniOfficeActors').children,slots);assert.deepEqual(writes,[]);
 const count=(s,re)=>[...s.matchAll(re)].length;
 for(const re of [/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:localStorage|sessionStorage)\b/g,/\bsupabase\b/g])assert.equal(count(current,re),count(base,re));
});

test('no runtime file, atlas, version, CSS or data dependency is added',async()=>{
 const read=f=>fs.readFileSync(f),a=await resolveRuntimeClosure({exists:fs.existsSync,read}),b=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>f==='hani-office-live.js'?Buffer.from(base):read(f)});
 assert.deepEqual(a.files,b.files);assert.deepEqual(a.missing,[]);assert.equal(a.files.length,161);
});
