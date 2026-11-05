import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {restoreResidentsSource} from './hani-office-residents-source.mjs';
import {reapplyTlayoutSource} from './hani-office-tlayout-fixture.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const read=f=>fs.readFileSync(f,'utf8'),hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const {scene,table}=loadScene(),r=scene.residents;
const people=r.people,ids=people.map(p=>p.id),plain=x=>JSON.parse(JSON.stringify(x));
const mount=(enabled=true,reduced=false,width=1440,options={})=>{
 const loaded=[],writes=[];const deny=(...args)=>{writes.push(args);throw Error('unexpected persistence')};
 const f=fixture('10:00',reduced,src=>{loaded.push(src);return fs.existsSync(src)},table,{
  HaniOfficeV2Assets:enabled?{...assets,spritesV3:options.spritesV3||manifest}:assets,setTimeout:options.setTimeout||(()=>0),
  matchMedia:q=>({matches:/prefers-reduced-motion/.test(q)?reduced:width<=Number(q.match(/max-width:\s*(\d+)/)?.[1]||0),addEventListener(){}}),
  localStorage:{setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny},save:deny,
 });
 f.setDateTime('2026-11-02T10:02:00+09:00');f.click('1f');
 return {...f,loaded,writes,residents:()=>f.ids.get('haniOfficeActors').children.filter(a=>a.dataset.resident),tick:()=>f.timers.find(t=>t.ms===100).fn()};
};
const settled=()=>new Promise(resolve=>setImmediate(resolve));
const sharpModule=()=>{const require=createRequire(import.meta.url);try{return require('sharp')}catch{return require(process.env.HANI_SHARP_MODULE||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'))}};
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
const movingSecond=(id,start,day='2026-11-02')=>{for(let t=start;t<start+300;t+=.1)if(r.snapshot(at(day,t),null,true,false,false).find(p=>p.id===id)?.walking)return t;throw Error('no safe movement within five minutes: '+id)};

test('final names, personalities and actual residentPeople lines obey the local dialogue rules',()=>{
 assert.equal(r.names.cat,'치즈');assert.equal(r.names.dog,'크림');
 const seen=new Set();
 for(const person of people){
  for(const line of person.lines){
   assert.ok(Array.from(line).length<=22,line);assert.doesNotMatch(line,/뚱|못생|살쪘|키가|외모|개구리|왕눈|초록 회장/);
   assert.ok(!seen.has(line),'duplicate resident line: '+line);seen.add(line);
  }
 }
 assert.ok(people[0].lines.includes('관심은 없지만 곁에 있을게요.'));assert.ok(people[1].lines.includes('모두 만나니 기분이 좋아요!'));
 assert.ok(people[0].lines.includes('츄르 없이는 면담 신청 안 받아요.'));
});

test('reduced motion jumps to the stop and keeps coordinates fixed throughout every walking interval',async()=>{
 for(const start of [7*3600,9*3600,12*3600,17*3600])for(const id of ['pet-cat','pet-dog','pet-rabbit']){
  const seconds=movingSecond(id,start),first=r.snapshot(at('2026-11-02',seconds),null,true,true,false).find(p=>p.id===id);
  for(const offset of [.01,.02,.05]){const pet=r.snapshot(at('2026-11-02',seconds+offset),null,true,true,false).find(p=>p.id===id);assert.deepEqual(plain(pet.position),plain(first.position));assert.equal(pet.walking,false);assert.doesNotMatch(pet.pose,/walk|hop/)}
  assert.equal(first.life,undefined);
 }
 const f=mount(true,true);f.setDateTime('2026-11-02T10:00:00.100+09:00');f.click('1f');await settled();
 const before=f.residents().map(a=>[a.style.left,a.style.top]);
 for(const ms of [200,500,900]){f.setDateTime(`2026-11-02T10:00:00.${ms}+09:00`);f.tick();assert.deepEqual(f.residents().map(a=>[a.style.left,a.style.top]),before)}
});

test('resident occupancy stays separate for multiple days and moving as well as resting residents',()=>{
 const collision=loadScene({transform:source=>source.replace("['resident_dog_lobby','resident_dog_front']","['resident_cat_lobby','resident_cat_front']")}).scene.residents;
 const crowded=collision.snapshot(at('2026-11-02',20*3600));assert.equal(crowded.length,2,'shared stops cannot fit both bodies: later resident waits offscreen');assert.equal(crowded[0].id,'pet-cat');
 for(let day=1;day<=7;day++)for(let second=0;second<86400;second+=900)for(const offset of [.1,.5,2,5,120]){
  const states=r.snapshot(at('2026-11-'+String(day).padStart(2,'0'),second+offset));
  for(let i=0;i<states.length;i++)for(let j=i+1;j<states.length;j++)if(states[i].floor===states[j].floor)assert.ok(Math.hypot((states[i].position[0]-states[j].position[0])*1672/100,(states[i].position[1]-states[j].position[1])*941/100)>=96);
 }
});

test('unchanged residents perform no DOM writes on the shared clock',async()=>{
 const f=mount();await settled();f.tick();let writes=0;
 for(const actor of f.residents())for(const node of [actor,...actor.querySelectorAll('*')]){
  for(const key of ['dataset','style'])node[key]=new Proxy(node[key],{set(target,k,value){writes++;target[k]=value;return true},deleteProperty(target,k){writes++;return delete target[k]}});
  let hidden=node.hidden;Object.defineProperty(node,'hidden',{get:()=>hidden,set:value=>{writes++;hidden=value},configurable:true});
  const set=node.setAttribute;node.setAttribute=function(...args){writes++;return set.apply(this,args)};
 }
 for(let i=0;i<20;i++){f.setDateTime('2026-11-02T10:02:00.'+String(i*5).padStart(3,'0')+'+09:00');f.tick()}assert.equal(writes,0);
});

test('walking taps wait for arrival, NPC sprites stay upright, and label fit runs at arrival',async()=>{
 const start=movingSecond('pet-cat',10*3600),f=mount();f.setDateTime(at('2026-11-02',start).toISOString());f.click('1f');await settled();
 const pet=f.residents().find(a=>!a.hidden&&a.dataset.walking==='true');assert.ok(pet);
 const calls=[],tick=pet.officeReactions.tick;pet.officeReactions.tick=(...args)=>{calls.push(args[2]);return tick(...args)};
 f.ids.get('haniOfficeActors').events.click({target:pet});f.tick();assert.equal(pet.dataset.motion,undefined);assert.equal(calls.at(-1),true);
 const owner=f.context.HaniBuildingScene;let fits=0;f.map.getBoundingClientRect=()=>rect(0,0,390,220);
 for(const a of f.ids.get('haniOfficeActors').children)for(const node of [a,...a.querySelectorAll('*')])node.getBoundingClientRect=()=>rect(100,100,30,30);
 f.context.HaniBuildingScene={...owner,labels:{...owner.labels,place(...args){fits++;return owner.labels.place(...args)}}};
 f.setDateTime(at('2026-11-02',start+10).toISOString());f.tick();assert.equal(calls.at(-1),false);assert.equal(pet.dataset.motion,'hop');assert.ok(fits>0,'arrival repacks labels');
 f.click('2f');for(const a of f.residents().filter(a=>a.dataset.resident==='npc'&&!a.hidden)){
  const box=rect(100,100,40,60),expected=owner.motion.stableSpriteBox({...a,dataset:{...a.dataset,facing:''}},box);assert.deepEqual(plain(owner.motion.stableSpriteBox(a,box)),plain(expected));
 }
 assert.match(read('hani-office-live.css'),/\.hani-office-actor\[data-resident\] \.hani-office-sprite\{rotate:0deg;filter:none\}/);
});

test('moving open bubbles follow cached geometry without frame reads and close when their resident hides',async()=>{
 const start=movingSecond('pet-cat',10*3600),f=mount();f.setDateTime(at('2026-11-02',start).toISOString());f.click('1f');await settled();
 const bubble=f.map.querySelector('.hani-office-character-bubble'),pet=f.residents().find(a=>!a.hidden&&a.dataset.walking==='true');
 f.map.getBoundingClientRect=()=>rect(0,0,1000,560);bubble.getBoundingClientRect=()=>rect(0,0,180,35);
 for(const a of f.ids.get('haniOfficeActors').children){a.getBoundingClientRect=()=>rect(parseFloat(a.style.left)*10-15,parseFloat(a.style.top)*5.6-60,30,60);for(const n of a.querySelectorAll('*'))n.getBoundingClientRect=()=>rect(0,0,30,12)}
 f.ids.get('haniOfficeActors').events.click({target:pet});const left=bubble.style.left;let reads=0;
 for(const node of [f.map,bubble,...f.ids.get('haniOfficeActors').children.flatMap(a=>[a,...a.querySelectorAll('*')])]){const measure=node.getBoundingClientRect;node.getBoundingClientRect=()=>{reads++;return measure()}}
 f.setDateTime(at('2026-11-02',start+.1).toISOString());f.tick();assert.notEqual(bubble.style.left,left);assert.equal(reads,0);
 f.setDateTime('2026-11-02T12:00:00.200+09:00');f.tick();assert.equal(pet.hidden,true);assert.equal(bubble.hidden,true);
});

test('compact dot fallback never exposes a full resident name',async()=>{
 const f=mount(true,false,390);await settled();const owner=f.context.HaniBuildingScene;
 f.map.getBoundingClientRect=()=>rect(0,0,390,220);
 for(const a of f.ids.get('haniOfficeActors').children)for(const n of [a,...a.querySelectorAll('*')])n.getBoundingClientRect=()=>rect(100,100,30,20);
 f.context.HaniBuildingScene={...owner,labels:{...owner.labels,place(floor,groups){return new Map(groups.map(g=>[g.id,{dot:true,name:rect(20,20,5,5)}]))}}};
 f.click('1f');for(const a of f.residents().filter(a=>!a.hidden)){const name=a.querySelector('.hani-office-name');assert.equal(name.style.visibility,'hidden');assert.equal(name.officeLabelPlacement,null)}
});

test('eight approved atlases decode, match their manifest hashes, load through the real owner and enter the closure',async()=>{
 const require=createRequire(import.meta.url);let sharp;
 try{sharp=require('sharp')}catch{sharp=require(process.env.HANI_SHARP_MODULE||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'))}
 const f=mount();
 for(const time of ['10:02','14:02','16:02']){f.setDateTime('2026-11-02T'+time+':00+09:00');for(const floor of ['1f','2f','3f','4f','5f']){f.click(floor);await settled()}}
 for(const p of people){
  const entry=manifest.entries.find(e=>e.id===p.sprite),file='assets/sprites-v3/'+entry.file,bytes=fs.readFileSync(file),meta=await sharp(bytes).metadata();
  assert.equal(hash(bytes),entry.sha256);assert.deepEqual([meta.width,meta.height],entry.atlas);assert.ok(meta.hasAlpha);
  assert.equal(entry.frames.length,p.pet?10:4);assert.ok(f.loaded.includes('./'+file),p.id+' real Image request');
  const actor=f.residents().find(a=>a.dataset.person===p.id);assert.equal(actor.dataset.avatar,'v2');assert.ok(actor.querySelector('.hani-office-sprite').style.backgroundImage.includes(entry.file));
  const fallback=r.atlas(p);assert.deepEqual(plain(fallback.frames.map(f=>[f.name,f.rect,f.pivot])),entry.frames.map(f=>[f.name,f.rect,f.pivot]));
 }
 const closure=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>fs.readFileSync(f)});
 assert.ok(closure.files.length<=160);assert.deepEqual(closure.missing,[]);
 const baseline=(await resolveRuntimeClosure({exists:fs.existsSync,read:f=>f==='hani-office-live.css'?read(f).split('/* Resident art uses the existing sheet loader;')[0]:f==='hani-office-live.js'?restoreResidentsSource(read(f)):fs.readFileSync(f)})).files;
 assert.equal(baseline.length,138,'existing closure loses only removed portrait');
 assert.deepEqual(closure.files.filter(f=>!baseline.includes(f)).sort(),plain(ids.map(id=>'assets/sprites-v3/'+id+'.webp')).sort());
});

test('separate date seed, stable hour/floor schedule, eight daytime residents and only pets overnight',()=>{
 const now=at('2026-11-02',10*3600+125),first=JSON.stringify(r.snapshot(now));
 for(let i=0;i<10;i++)assert.equal(JSON.stringify(r.snapshot(now)),first);
 assert.notEqual(r.seed('office-residents|2026-11-02|pet-cat'),r.seed('office-residents|2026-11-03|pet-cat'));
 assert.equal(r.snapshot(now).length,8);assert.deepEqual(plain(r.snapshot(now,null,false)),[]);
 for(const seconds of [0,3600,6*3600+3599,18*3600,23*3600+3599]){
  const states=r.snapshot(at('2026-11-02',seconds));assert.equal(states.length,3);assert.ok(states.every(p=>p.pet));
 }
 for(const p of people)for(const [floor,spots]of Object.entries(p.places)){
  assert.ok(spots.length>=1&&spots.length<=2,'use fewer stops where painted furniture leaves little floor');
  for(let i=0;i<spots.length;i++){const a=r.spot(spots[i]);assert.ok(a&&!a.rendererSeat&&a.floor===floor,spots[i]);assert.ok(r.path(spots[(i+spots.length-1)%spots.length],spots[i]).length,'all consecutive stops have a safe route')}
 }
 for(const hour of [8,10,12,14,16]){const cleaner=r.snapshot(at('2026-11-02',hour*3600+120)).find(p=>p.id==='npc-cleaner');assert.equal(cleaner.floor,([8,10,12,14,16].indexOf(hour)+1)+'f')}
 assert.ok(r.snapshot(at('2026-11-02',14*3600+120)).filter(p=>p.id.startsWith('npc-temp')).every(p=>['2f','3f'].includes(p.floor)));
});

test('all resident dwell points and sampled walking positions stay walkable, outside walls and all furniture',()=>{
 let walking=0;const poses=new Set(),facings=new Set();
 for(let seconds=0;seconds<86400;seconds+=60)for(const offset of [.1,.5,1,2,4])for(const p of r.snapshot(at('2026-11-02',seconds+offset))){
  assert.ok(r.safe(p.floor,p.point,p.position,p.pet),p.id+' '+seconds);if(p.walking)walking++;if(p.pet){poses.add(p.pose);facings.add(p.facing)}
 }
 assert.ok(walking>50);for(const pose of ['sitting','standing','sleep','walk-a','walk-b'])assert.ok(poses.has(pose),pose);assert.deepEqual([...facings].sort(),['left','right']);
});

test('every stop and whole walking segment clears painted furniture, counters, cabinets, sofas, tables and spare desks on all five floors',()=>{
 // Independent segment/AABB intersection (not the runtime sample loop).
 const intersects=(a,b,box)=>{let lo=0,hi=1;for(let axis=0;axis<2;axis++){const d=b[axis]-a[axis];if(!d){if(a[axis]<box[axis]||a[axis]>box[axis+2])return false;continue}let p=(box[axis]-a[axis])/d,q=(box[axis+2]-a[axis])/d;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);if(lo>hi)return false}return true};
 const floors=new Set(),stops=new Set();let segments=0;
 for(const person of people)for(const [floor,ids]of Object.entries(person.places)){
  floors.add(floor);const art=scene.art.floors[floor],boxes=[...r.furniture[floor],...Object.values(art.homeFurniture||{}).flatMap(i=>[i.seatBounds,i.deskBounds]),...(art.freeDesks||[]).flatMap(i=>[i.seatBounds,i.deskBounds])].filter(Boolean);
  for(const id of ids){const a=r.spot(id);assert.ok(a,id);stops.add(id);assert.ok(!scene.anchors.has(id),'resident stops never modify shared anchors');
   const px=[a.visual[0]*1672/100,a.visual[1]*941/100],half=person.pet?46:56,height=person.pet?88:164;
   for(const box of boxes)assert.equal(intersects(px,px,[box[0]-half-8,box[1]-8,box[2]+half+8,box[3]+height+8]),false,id+' visible body clears '+box);
  }
  for(let i=0;i<ids.length;i++){
   const points=r.path(ids[(i+ids.length-1)%ids.length],ids[i]);assert.ok(points.length);
   for(let j=1;j<points.length;j++){
    const a=points[j-1],b=points[j],va=a.visual.map((v,k)=>v*(k?941:1672)/100),vb=b.visual.map((v,k)=>v*(k?941:1672)/100),half=person.pet?46:56,height=person.pet?88:164;
    for(const box of boxes)assert.equal(intersects(va,vb,[box[0]-half-8,box[1]-8,box[2]+half+8,box[3]+height+8]),false,a.id+' -> '+b.id+' whole body/segment');
    for(const box of scene.canon.floors.find(f=>f.id===floor).noWalk)assert.equal(intersects([a.x,a.y],[b.x,b.y],[box.x,box.y,box.x+box.w,box.y+box.h]),false,'logical wall/surface');
    segments++;
   }
  }
 }
 assert.equal(floors.size,5);assert.equal(stops.size,24);assert.equal(segments,14);
 // Actual known art locations, including the reported 41.8% / 33.5% desk.
 const forbidden={'1f':[[41.8,33.5],[83.5,73],[77,41],[75,26]],'2f':[[10.5,55],[75,25],[80,70]],'3f':[[22,20],[80,20],[80,65]],'4f':[[82,72],[86,31],[28,86]],'5f':[[26,30],[77,31],[25,70],[79,74]]};
 for(const [floor,positions]of Object.entries(forbidden))for(const v of positions)assert.equal(r.safe(floor,[500,330],v),false,floor+' furniture '+v);
 for(const floor of Object.keys(r.furniture))for(const box of r.furniture[floor])assert.equal(r.safe(floor,[500,330],[(box[0]+box[2])/2/1672*100,(box[1]+box[3])/2/941*100]),false,'every painted exclusion rejects residents');
});

test('02:00 to 07:00 sleeping pets keep separate stable spots, including occupied-spot fallback',()=>{
 for(const day of ['2026-11-02','2026-11-03'])for(const hour of [2,3,4,5,6]){
  const pets=r.snapshot(at(day,hour*3600+30));assert.equal(pets.length,3);assert.ok(pets.every(p=>p.pose==='sleep'&&!p.walking&&p.floor==='1f'));
  const [cat,dog]=pets;assert.ok(Math.hypot((cat.position[0]-dog.position[0])*1672/100,(cat.position[1]-dog.position[1])*941/100)>180);
  for(const p of pets){const usual=people.find(q=>q.id===p.id).places['1f'][0];assert.equal(p.anchor,usual);assert.deepEqual(plain(p.position),plain(r.spot(usual).visual));}
  const blocked={floors:[{people:[{floor:'1f',seat:{x:cat.position[0],y:cat.position[1]}}]}]},fallback=r.snapshot(at(day,hour*3600+30),blocked);
  assert.equal(fallback.length,3);assert.equal(fallback[0].pose,'sleep');assert.notEqual(fallback[0].anchor,cat.anchor);assert.notDeepEqual(plain(fallback[0].position),plain(fallback[1].position));
 }
});

test('pets stay awake at 23:59 and 01:30, walk after midnight, and sleep only from 02:00 to 07:00 KST',()=>{
 for(const seconds of [7*3600,21*3600,22*3600,23*3600+59*60,86400+90*60]){
  const states=r.snapshot(at('2026-11-02',seconds));assert.equal(states.filter(p=>p.pet).length,3);
  assert.ok(states.filter(p=>p.pet).every(p=>p.pose!=='sleep'));
 }
 for(const start of [23*3600+45*60,86400+90*60])for(const id of ['pet-cat','pet-dog'])assert.ok(movingSecond(id,start)<start+300,'cat/dog walk safe seeded routes within five minutes, including after midnight');
 for(const seconds of [2*3600,3*3600,7*3600-.01])assert.ok(r.snapshot(at('2026-11-02',seconds)).every(p=>p.pose==='sleep'&&!p.walking));
 for(const person of people.filter(p=>p.pet))assert.ok(person.hours.some(([start,end,floor])=>start===22&&end===26&&floor==='1f'),'explicit cross-midnight 1F window');
 for(const seconds of [22*3600+.1,23*3600+120,86400+90*60+.1])for(const pet of r.snapshot(at('2026-11-02',seconds)).filter(p=>p.id!=='pet-rabbit')){
  assert.ok(pet.anchor.includes('_night_'),'dedicated lounge-side night stops');assert.ok(r.safe(pet.floor,pet.point,pet.position));
  assert.ok(Math.hypot(pet.position[0]*16.72-1105,pet.position[1]*9.41-525)<230,'both pets remain within 230 native pixels of the lounge corner');
 }
 // Even a chairman on a different floor cannot take either pet away at night.
 for(const seconds of [22*3600+120,23*3600+59*60,86400+90*60]){
  const now=at('2026-11-02',seconds),staff=scene.snapshot(now,{chairmanPresent:true});
  const pets=r.snapshot(now,staff).filter(p=>p.pet);assert.equal(pets.length,3);assert.ok(pets.every(p=>p.floor==='1f'&&p.pose!=='sleep'));
 }
});

test('pet daily seeds and positions remain continuous over midnight and roll over at 07:00',()=>{
 const before=at('2026-11-02',86400-.001),after=at('2026-11-03',.001),a=r.clock(before),b=r.clock(after);
 assert.equal(a.day,b.day);assert.equal(a.day,'2026-11-02');assert.equal(a.night,true);assert.equal(b.night,true);
 assert.ok(Math.abs(b.seconds-a.seconds-.002)<1e-6);assert.equal(Math.floor(b.seconds/900)-Math.floor(a.seconds/900),1);
 for(const person of people.filter(p=>p.pet))assert.equal(r.seed('office-residents|'+a.day+'|'+person.id),r.seed('office-residents|'+b.day+'|'+person.id));
 const first=r.snapshot(before),next=r.snapshot(after);for(const pet of first){const q=next.find(p=>p.id===pet.id);assert.equal(pet.floor,q.floor);assert.ok(Math.hypot((pet.position[0]-q.position[0])*16.72,(pet.position[1]-q.position[1])*9.41)<1,'quarter-hour walking starts where the last beat ended')}
 assert.equal(r.clock(at('2026-11-03',7*3600-.01)).day,'2026-11-02');assert.equal(r.clock(at('2026-11-03',7*3600)).day,'2026-11-03');
});

const restingPeer=(id='taeo',floor='1f')=>({id,floor,seat:plain(scene.homeSeat(id)),activity:'rest',pose:'sitting',state:'AT_HOME',walking:false});
const staffWith=(...people)=>({floors:[{people}]});
const petGap=(pet,peer)=>{const v=peer.position||[peer.seat.x,peer.seat.y];return Math.hypot((pet.position[0]-v[0])*16.72,(pet.position[1]-v[1])*9.41)};

test('stable quarter-hour visits use only resting staff on the same floor and never visitors or travellers',()=>{
 const now=at('2026-11-02',10*3600+120),peer=restingPeer(),staff=staffWith(peer),bytes=JSON.stringify(staff);
 const cat=r.snapshot(now,staff).find(p=>p.id==='pet-cat');assert.equal(cat.scene.partnerId,peer.id);assert.equal(cat.scene.kind,'rest');assert.equal(cat.floor,peer.floor);assert.ok(petGap(cat,peer)>=100&&petGap(cat,peer)<=320);
 assert.equal(r.snapshot(at('2026-11-02',10*3600+300),staff).find(p=>p.id===cat.id).scene.key,cat.scene.key);
 assert.equal(JSON.stringify(staff),bytes);
 for(const edit of [{activity:'work'},{floor:'2f'},{walking:true},{state:'GOING'},{state:'RETURNING'},{visitor:true}]){
  const states=r.snapshot(now,staffWith({...peer,...edit}));assert.ok(states.every(p=>!p.scene),JSON.stringify(edit));
 }
 assert.ok(r.snapshot(now,staff,true,false,false).every(p=>!p.scene));
 const peers=staffWith(peer,{...peer,id:'sua'}),reverse=staffWith(...peers.floors[0].people.toReversed());
 assert.equal(JSON.stringify(r.snapshot(now,peers)),JSON.stringify(r.snapshot(now,reverse)),'selection is independent of snapshot ordering');
});

test('thirty short voiced lines include every canonical staff member and monitor-side cat reactions stay on clear floor',()=>{
 assert.deepEqual(Object.keys(r.voice.staff).sort(),table.people.map(p=>p.id).sort());
 const lines=[...r.voice.cat,...r.voice.dog,...Object.values(r.voice.staff)];assert.equal(lines.length,30);assert.equal(new Set(lines).size,30);
 for(const line of lines){assert.ok(Array.from(line).length<=22,line);assert.doesNotMatch(line,/뚱|못생|살쪘|개구리|왕눈|초록 회장/)}
 const peer=restingPeer(),now=at('2026-11-02',9*3600+47*60+20),cat=r.snapshot(now,staffWith(peer)).find(p=>p.id==='pet-cat');
 assert.equal(cat.scene.kind,'monitor');assert.equal(cat.scene.partnerId,peer.id);assert.equal(cat.pose,'sitting');assert.equal(cat.scene.petLine,r.voice.cat[2]);assert.equal(cat.scene.staffLine,r.voice.staff[peer.id]);
 assert.ok(r.safe(cat.floor,cat.point,cat.position));
 const [x,y]=[cat.position[0]*16.72,cat.position[1]*9.41],box=scene.art.floors['1f'].homeFurniture[peer.seat.anchor].deskBounds;
 assert.ok(x<box[0]||x>box[2]||y<box[1]||y>box[3],'feet never land on a monitor or desk surface');
 assert.ok(!r.snapshot(now,staffWith({...peer,activity:'work'})).some(p=>p.scene),'monitor scene also waits for a break');
});

test('cream follows seated or walking chairman to his floor, dwells beside clear positions, and yields when blocked',()=>{
 const now=at('2026-11-02',10*3600+120);
 for(const floor of ['2f','3f','4f','5f'])for(const walking of [false,true]){
  const chair={id:'seongmin',floor,seat:{x:51,y:40,posture:'sitting'},position:walking?[51,40]:null,walking,pose:walking?'walk-a':'sitting',activity:'work'},staff=staffWith(chair),bytes=JSON.stringify(staff);
  const dog=r.snapshot(now,staff).find(p=>p.id==='pet-dog');assert.ok(dog);assert.equal(dog.floor,floor);assert.equal(dog.scene.kind,'chairman');assert.equal(dog.scene.partnerName,'회장님');assert.ok(petGap(dog,chair)>=100&&petGap(dog,chair)<=320);assert.ok(r.safe(floor,dog.point,dog.position));
  for(const offset of [180,300,600]){const next=r.snapshot(at('2026-11-02',10*3600+offset),staff).find(p=>p.id===dog.id);assert.equal(next.floor,floor);assert.ok(petGap(next,chair)>=100&&petGap(next,chair)<=320,'short seeded walks stay beside the present chairman');assert.ok(r.safe(next.floor,next.point,next.position))}
  assert.equal(JSON.stringify(staff),bytes);
  const blockers={...chair,id:'visitor-test',visitor:true,walking:true,position:dog.position};
  const yielded=r.snapshot(now,staffWith(chair,blockers)).find(p=>p.id===dog.id);if(yielded)assert.ok(petGap(yielded,blockers)>=100,'moving staff/visitor route gets priority');
 }
 const present=scene.snapshot(now,{chairmanPresent:true}),dog=r.snapshot(now,present).find(p=>p.id==='pet-dog');assert.equal(dog.floor,'4f');assert.equal(dog.scene,null,'default ceo chair has no furniture-clear adjacent bay; keep the safe corridor fallback');
 assert.equal(r.snapshot(now,scene.snapshot(now,{chairmanPresent:false})).find(p=>p.id==='pet-dog').floor,'2f');
});

test('interaction routes and dwell spots clear full furniture envelopes and staff snapshots/plans remain byte-identical on and off',()=>{
 const original=loadScene({transform:()=>reapplyTlayoutSource(restoreResidentsSource(read('hani-office-live.js')))}).scene;
 let scenes=0,moving=0;
 for(const day of ['2026-11-02','2026-11-03'])for(const chairmanPresent of [false,true]){
  const options={chairmanPresent},plan=scene.scheduler.plan(day,options);assert.equal(JSON.stringify(plan),JSON.stringify(original.scheduler.plan(day,options)));
  for(const seconds of [1,3*3600,9*3600+47*60,10*3600+120,23*3600+120]){
   assert.equal(JSON.stringify(scene.scheduler.blockPlan(day,Math.floor(seconds/600),plan,options)),JSON.stringify(original.scheduler.blockPlan(day,Math.floor(seconds/600),original.scheduler.plan(day,options),options)));
   const now=at(day,seconds),staff=scene.snapshot(now,options),bytes=JSON.stringify(staff);
   r.snapshot(now,staff,true,false,true);r.snapshot(now,staff,true,false,false);r.snapshot(now,staff,false);
   assert.equal(JSON.stringify(staff),bytes);assert.equal(bytes,JSON.stringify(original.snapshot(now,options)));
  }
 }
 for(const seconds of [9*3600+45*60,10*3600,23*3600])for(const offset of Array.from({length:1201},(_,i)=>i*.25)){
  const now=at('2026-11-02',seconds+offset),staff=seconds===23*3600?scene.snapshot(now,{chairmanPresent:true}):staffWith(restingPeer());
  for(const pet of r.snapshot(now,staff).filter(p=>p.pet)){
   assert.ok(r.safe(pet.floor,pet.point,pet.position));if(pet.walking)moving++;if(pet.scene){scenes++;const peer=staff.floors.flatMap(f=>f.people).find(p=>p.id===pet.scene.partnerId);assert.ok(peer);assert.equal(peer.floor,pet.floor);assert.equal(peer.activity,'rest')}
   const x=pet.position[0]*16.72,y=pet.position[1]*9.41,items=scene.art.floors[pet.floor],boxes=[...r.furniture[pet.floor],...Object.values(items.homeFurniture||{}).flatMap(i=>[i.seatBounds,i.deskBounds]),...(items.freeDesks||[]).flatMap(i=>[i.seatBounds,i.deskBounds])].filter(Boolean);
   for(const box of boxes)assert.ok(x+46<box[0]-8||x-46>box[2]+8||y+8<box[1]||y-88>box[3]+8,'whole pet body clears furniture throughout the social approach');
  }
 }
 assert.ok(scenes>0);assert.ok(moving>0);
});

test('actual delegated pet taps show both speakers, automatic scene uses existing bubble, and all persistence/AI paths remain unused',async()=>{
 const f=mount();await settled();f.setDateTime('2026-11-02T23:02:00+09:00');f.click('1f');await settled();
 const dog=f.residents().find(a=>a.dataset.person==='pet-dog'),scene=dog.officeResidentState.scene;assert.ok(scene);assert.equal(scene.partnerId,'yuna');
 const bubble=f.map.querySelector('.hani-office-character-bubble'),line=bubble.querySelector('p');assert.equal(bubble.hidden,false);assert.equal(line.textContent,'크림 · '+scene.line);
 assert.ok(line.textContent.includes(scene.petLine));assert.ok(line.textContent.includes(scene.staffLine));
 f.ids.get('haniOfficeActors').events.click({target:dog});assert.equal(line.textContent,'크림 · 같이 놀자!!');assert.equal(bubble.querySelector('a').hidden,true);assert.equal(f.writes.length,0);
 f.setDateTime('2026-11-03T03:00:00+09:00');f.tick();assert.ok(!line.textContent.includes(scene.staffLine),'a departed partner cannot leave a stale pair line');
 const patch=read('hani-office-live.js'),before=restoreResidentsSource(patch);
 // The owner events' two approved timeouts and three listeners sit in the same line delta; residents add none.
 assert.equal(patch.split(/event(?:End|Cooldown)Timer=setTimeout\(/).length-1,2);
 assert.equal(patch.split("eventButton.addEventListener('click',").length-1,1);assert.equal(patch.split("eventPanel.addEventListener('keydown',").length-1,1);assert.equal(patch.split("button.addEventListener('click',()=>runOwnerEvent(id))").length-1,1);
 assert.deepEqual(patch.replace(/event(?:End|Cooldown)Timer=setTimeout\(/g,'').replace("eventButton.addEventListener('click',",'').replace("eventPanel.addEventListener('keydown',",'').replace("button.addEventListener('click',()=>runOwnerEvent(id))",'').match(/\b(?:fetch|setInterval|setTimeout|addEventListener)\s*\(/g),before.match(/\b(?:fetch|setInterval|setTimeout|addEventListener)\s*\(/g),'no additional network, timer or event paths');
 assert.doesNotMatch(patch,/localStorage|sessionStorage|\bsave\s*\(|supabase/);
});

test('all decoded pose tops drive the existing label flow at phone and desktop widths without frame layout reads',async()=>{
 const sharp=sharpModule();let frames=0;
 for(const person of people){const entry=manifest.entries.find(e=>e.id===person.id);
  for(const frame of entry.frames){const {data,info}=await sharp('assets/sprites-v3/'+entry.file).extract({left:frame.rect[0],top:frame.rect[1],width:96,height:144}).ensureAlpha().raw().toBuffer({resolveWithObject:true});let top=144;
   for(let y=0;y<144;y++)for(let x=0;x<96;x++)if(data[(y*96+x)*info.channels+3]>=24)top=Math.min(top,y);
   const pose=frame.name.replace(/-(left|right)$/,''),bounds=r.bounds(person.id,pose);assert.equal(bounds[1],top,person.id+' '+frame.name+' actual alpha top');frames++;
  }
 }
 assert.equal(frames,50);
 const css=read('hani-office-live.css');assert.match(css,/\[data-resident\]\[data-avatar="v2"\] \.hani-office-name\{bottom:calc\(100% - var\(--actor-height\)\*var\(--resident-top,0\) \+ 3px\)\}/);
 for(const width of [360,390,1440]){
  const f=mount(true,false,width);await settled();const owner=f.context.HaniBuildingScene,records=[];
  f.context.HaniBuildingScene={...owner,labels:{...owner.labels,place(floor,groups,obstacles){const placed=owner.labels.place(floor,groups,obstacles);records.push({groups,placed});return placed}}};
  const height=width*941/1672,cell=Math.max(40,width*.068);f.map.getBoundingClientRect=()=>rect(0,0,width,height);
  for(const a of f.ids.get('haniOfficeActors').children){
   a.getBoundingClientRect=()=>rect(parseFloat(a.style.left)*width/100-cell*(a.officePivot?.[0]??.5)*2/3,parseFloat(a.style.top)*height/100-cell*(a.officePivot?.[1]??.9375),cell*2/3,cell);
   a.querySelector('.hani-office-name').getBoundingClientRect=()=>{const b=a.getBoundingClientRect(),top=Number(a.style['--resident-top']||0);return rect(b.left+b.width/2-20,b.top+cell*top-15,40,12)};
   a.querySelector('.hani-office-status').getBoundingClientRect=()=>a.dataset.resident?rect(0,0,0,0):rect(0,0,45,12);
  }
  for(const [time,floor]of [['10:02:00','1f'],['14:02:00','3f'],['16:02:00','5f'],['22:02:00','1f']]){
   f.setDateTime('2026-11-02T'+time+'+09:00');f.click(floor);await settled();
   for(const a of f.residents().filter(a=>!a.hidden)){
    const bounds=r.bounds(a.dataset.person,a.dataset.pose);assert.equal(Number(a.style['--resident-top']),bounds[1]/144);
    const cellBox=a.getBoundingClientRect(),real=owner.motion.stableSpriteBox(a,cellBox,false),last=records.at(-1),g=last.groups.find(g=>g.id===a.dataset.person),p=last.placed.get(g.id);
    assert.equal(g.actor.top,real.top,'packing uses real art top');assert.ok(real.top>cellBox.top+cell*.08,'transparent cell top excluded');assert.ok(p?.name,'resident label remains visible');
    assert.ok(p.name.top+g.name.height<=real.top+1e-6,JSON.stringify({message:'name stays above actual head',id:a.dataset.person,width,time,real,placement:p,name:g.name}));assert.ok(real.top-(p.name.top+g.name.height)<20,'name stays close to actual head');
   }
  }
  f.setDateTime('2026-11-02T10:00:00.100+09:00');f.click('1f');await settled();f.tick();let reads=0,firstRead;
  for(const n of [f.map,...f.root.querySelectorAll('*')])if(n.getBoundingClientRect){const measure=n.getBoundingClientRect;n.getBoundingClientRect=()=>{reads++;firstRead??=new Error().stack;return measure()}};
  for(let i=0;i<30;i++){f.setDateTime('2026-11-02T10:00:00.'+String(100+i*10).padStart(3,'0')+'+09:00');f.tick()}
  assert.equal(reads,0,'walking/pose frames add no layout reads: '+firstRead);
 }
});

test('the shared bubble hidden CSS wins over display:flex for residents and visitors, and staff links remain shown',async()=>{
 // Resolve the real bubble selectors and display specificity; a hidden flag
 // alone failed in the browser, so check the winning author declaration too.
 const rules=[...read('hani-office-live.css').matchAll(/(\.hani-office-character-bubble[^{}]*)\{([^{}]*)\}/g)].flatMap(m=>m[1].split(',').map(selector=>({selector:selector.trim(),display:m[2].match(/(?:^|;)display:([^;}]*)/)?.[1]}))).filter(r=>r.display);
 const display=(node,bubble)=>{let winner={score:-1,display:'inline'};for(const rule of rules){const parts=rule.selector.split(/\s+/);if(parts.length!==2||parts[0]!=='.hani-office-character-bubble')continue;const last=parts[1];if(last==='a'&&node.tagName!=='a'||last==='[hidden]'&&!node.hidden)continue;if(!['a','[hidden]'].includes(last))continue;const score=10+(last==='[hidden]'?10:1);if(score>=winner.score)winner={score,display:rule.display}}return winner.display};
 const f=mount();await settled();const layer=f.ids.get('haniOfficeActors'),bubble=f.map.querySelector('.hani-office-character-bubble'),link=bubble.querySelector('a');
 for(const floor of ['1f','2f','3f','4f','5f']){f.click(floor);await settled();for(const a of f.residents().filter(a=>!a.hidden)){layer.events.click({target:a});assert.equal(display(link,bubble),'none')}}
 const s=f.context.HaniBuildingScene.scheduler,day='2026-11-02',plan=s.plan(day,{chairmanPresent:false}),guest=s.blockPlan(day,0,plan,{chairmanPresent:false}).find(e=>e.visitor);assert.ok(guest,'scheduled visitor');
 const guestTime=(guest.performStart+guest.performEnd)/2,guestState=s.snapshot(at(day,guestTime),{chairmanPresent:false}).visitors.find(v=>v.id===guest.people[0].id);assert.ok(guestState);
 f.setDateTime(at(day,guestTime).toISOString());f.click(guestState.floor);await settled();const visitor=f.visible().find(a=>a.dataset.visitor==='true');assert.ok(visitor,'real visitor actor');layer.events.click({target:visitor});assert.equal(link.hidden,true);assert.equal(display(link,bubble),'none');
 f.setDateTime('2026-11-02T10:02:00+09:00');f.click('2f');const staff=f.visible().find(a=>!a.dataset.resident&&a.dataset.visitor!=='true');layer.events.click({target:staff});assert.equal(link.hidden,false);assert.equal(display(link,bubble),'flex');assert.equal(f.writes.length,0);
});

test('every original source byte and staff/visitor plan, outing and snapshot stays identical with residents on or off',()=>{
 const original=restoreResidentsSource(read('hani-office-live.js'));
 const old=loadScene({transform:()=>reapplyTlayoutSource(original)}).scene;
 for(const day of ['2026-11-01','2026-11-02'])for(const chairmanPresent of [false,true]){
  const options={chairmanPresent},before=old.scheduler.plan(day,options),after=scene.scheduler.plan(day,options);
  assert.equal(JSON.stringify(after),JSON.stringify(before));
  assert.equal(JSON.stringify(scene.scheduler.blockPlan(day,0,after,options)),JSON.stringify(old.scheduler.blockPlan(day,0,before,options)));
  for(const seconds of [1,36000,50400,86399]){
   const now=at(day,seconds),snapshot=scene.snapshot(now,options),bytes=JSON.stringify(snapshot);
   r.snapshot(now,snapshot,true);r.snapshot(now,snapshot,false);
   assert.equal(JSON.stringify(snapshot),bytes);assert.equal(bytes,JSON.stringify(old.snapshot(now,options)));
  }
 }
 assert.throws(()=>restoreResidentsSource(read('hani-office-live.js').replace('function createScheduler(','function changedScheduler(')));
});

test('real persistent actors survive floor changes, do not affect floor counts or roster, and use both pet facing rows',async()=>{
 const on=mount(),off=mount(false),slots=on.residents();assert.equal(slots.length,8);const seen=new Set();
 assert.ok(on.context.window.HaniOrganizationRoster.people.every(p=>!ids.includes(p.id)),'org roster unchanged');
 assert.ok(on.context.HaniBuildingScene.floors.every(f=>f.residents.every(id=>!ids.includes(id))),'floor staff roster unchanged');
 for(const time of ['10:00:02','10:02:00','14:00:02','14:02:00']){
  on.setDateTime('2026-11-02T'+time+'+09:00');off.setDateTime('2026-11-02T'+time+'+09:00');
  for(const floor of ['1f','2f','3f','4f','5f','1f']){
   on.click(floor);off.click(floor);await settled();
   assert.deepEqual(on.residents(),slots);assert.deepEqual(on.tabs.children.map(b=>b.querySelector('small').textContent),off.tabs.children.map(b=>b.querySelector('small').textContent));
   assert.deepEqual(on.visible().filter(a=>!a.dataset.resident).map(a=>[a.dataset.person,a.dataset.seat,a.style.left,a.style.top]),off.visible().map(a=>[a.dataset.person,a.dataset.seat,a.style.left,a.style.top]));
   for(const actor of on.visible().filter(a=>a.dataset.resident)){
    seen.add(actor.dataset.person);assert.equal(actor.officeRow.hidden,true);assert.equal(actor.querySelector('.hani-office-status').hidden,true);
    assert.equal(actor.querySelector('.hani-office-rank').textContent,'');assert.equal(actor.officeName.textContent,people.find(p=>p.id===actor.dataset.person).name);
    if(actor.dataset.resident==='pet'){const entry=manifest.entries.find(e=>e.id===actor.dataset.person),frame=entry.frames.find(f=>f.name===actor.dataset.pose+'-'+actor.dataset.facing);assert.ok(frame);assert.equal(actor.querySelector('.hani-office-sprite').style.backgroundPosition,(frame.rect[0]/(entry.atlas[0]-entry.cell[0])*100)+'% '+(frame.rect[1]/(entry.atlas[1]-entry.cell[1])*100)+'%')}
   }
  }
 }
 assert.equal(seen.size,8);assert.ok(!on.root.querySelector('.hani-building-roster').children.some(row=>slots.some(a=>a.officeRow===row)));
});

test('existing delegated tap/keyboard bubbles use short local lines, pet hop, no profile or writes; hidden/reduced clocks stay still',async()=>{
 const f=mount();await settled();const layer=f.ids.get('haniOfficeActors'),pet=f.residents().find(a=>!a.hidden),bubble=f.map.querySelector('.hani-office-character-bubble');
 layer.events.click({target:pet});f.tick();assert.match(bubble.textContent,new RegExp(pet.dataset.name));assert.equal(pet.dataset.motion,'hop');assert.equal(bubble.querySelector('a').hidden,true);
 const line=bubble.querySelector('p').textContent;layer.events.keydown({key:'Enter',target:pet,preventDefault(){}});assert.notEqual(bubble.querySelector('p').textContent,line);assert.equal(f.writes.length,0);
 const tapped=new Set();for(const floor of ['1f','2f','3f','4f','5f']){f.click(floor);for(const actor of f.residents().filter(a=>!a.hidden)){layer.events.click({target:actor});const person=people.find(p=>p.id===actor.dataset.person);assert.ok(person.lines.some(line=>bubble.querySelector('p').textContent===person.name+' · '+line));assert.equal(bubble.querySelector('a').hidden,true);tapped.add(person.id)}}assert.equal(tapped.size,8);assert.equal(f.writes.length,0);f.click('1f');
 const positions=f.residents().map(a=>[a.style.left,a.style.top]);f.document.hidden=true;f.document.events.visibilitychange();f.setDateTime('2026-11-02T14:02:00+09:00');f.tick();assert.deepEqual(f.residents().map(a=>[a.style.left,a.style.top]),positions);assert.equal(pet.dataset.motion,undefined);
 f.document.hidden=false;f.document.events.visibilitychange();f.click('5f');assert.ok(f.residents().some(a=>!a.hidden));
 const reduced=mount(true,true);reduced.setDateTime('2026-11-02T10:00:02+09:00');reduced.click('1f');await settled();const a=reduced.residents().find(a=>!a.hidden);reduced.ids.get('haniOfficeActors').events.click({target:a});reduced.tick();assert.equal(a.dataset.motion,undefined);assert.equal(a.dataset.walking,'false');assert.ok(!a.dataset.pose.startsWith('walk-'),'reduced motion uses a still atlas pose');assert.equal(reduced.writes.length,0);
 assert.doesNotMatch(read('hani-office-live.js'),/localStorage|sessionStorage|\bsave\s*\(|supabase/);
});

test('Mochi approved atlas decodes with hop phases, exact manifest metadata and cached-manifest fallback',async()=>{
 const pet=people.find(p=>p.id==='pet-rabbit'),entry=manifest.entries.find(e=>e.id===pet.id),bytes=fs.readFileSync('assets/sprites-v3/'+entry.file);
 assert.equal(pet.name,'모찌');assert.equal(pet.lines.length,10);assert.ok(pet.lines.includes('조용한 자리가 있으면 알려주세요.'));assert.ok(pet.lines.includes('간식보다 평온이 좋아요.'));
 assert.equal(hash(bytes),entry.sha256);assert.equal(hash(bytes),'dd0e60bde7eb949bac0d491b659d2d93720e042b172c328457a7e9f29975ec2f');
 const decoded=await sharpModule()(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.deepEqual([decoded.info.width,decoded.info.height],[480,288]);assert.equal(decoded.info.channels,4);
 const expected=['left','right'].flatMap(d=>['sitting','standing','hop-a','hop-b','sleep'].map(p=>p+'-'+d));assert.deepEqual(entry.frames.map(f=>f.name),expected);
 assert.deepEqual(plain(r.atlas(pet).frames.map(f=>[f.name,f.rect,f.pivot])),entry.frames.map(f=>[f.name,f.rect,f.pivot]));
 const cached={...manifest,entries:manifest.entries.filter(e=>e.id!==pet.id)},f=mount(true,false,1440,{spritesV3:cached});f.setDateTime('2026-11-02T08:02:00+09:00');f.click('3f');await settled();
 const actor=f.residents().find(a=>a.dataset.person===pet.id);assert.equal(actor.hidden,false);assert.equal(actor.dataset.avatar,'v2');assert.ok(actor.querySelector('.hani-office-sprite').style.backgroundImage.includes('pet-rabbit.webp'));
 assert.equal(f.writes.length,0);
});

test('Mochi schedule covers quiet 3F mornings, 4F days, 1F evenings, midnight continuity and 02..07 sleep',()=>{
 for(const day of ['2026-11-02','2026-11-03'])for(const [seconds,floor,sleep]of [[0,'1f',false],[7199,'1f',false],[7200,'1f',true],[25199,'1f',true],[25200,'3f',false],[43199,'3f',false],[43200,'4f',false],[61199,'4f',false],[61200,'1f',false],[79200,'1f',false],[86399,'1f',false]]){
  const pet=r.snapshot(at(day,seconds),null,true,true).find(p=>p.id==='pet-rabbit');assert.ok(pet,day+' '+seconds);assert.equal(pet.floor,floor);assert.equal(pet.pose==='sleep',sleep);assert.ok(r.safe(floor,pet.point,pet.position,true));
 }
 for(const second of [22*3600+120,23*3600+120,86400+90*60]){
  const pets=r.snapshot(at('2026-11-02',second)),rabbit=pets.find(p=>p.id==='pet-rabbit');for(const p of pets.filter(p=>p.pet&&p.id!==rabbit.id))assert.ok(petGap(rabbit,{position:p.position})<280,'rabbit stays near both nighttime companions');
 }
});

test('Mochi uses eased hops around 18px/sec every 120..180 seconds, with longer rests and whole-body clearance',()=>{
 const start=8*3600,states=[];for(let second=0;second<1800;second+=.25){const p=r.snapshot(at('2026-11-02',start+second),null,true,false,false).find(p=>p.id==='pet-rabbit');assert.ok(p);assert.ok(r.safe(p.floor,p.point,p.position,true));states.push({second,p});if(p.walking)assert.match(p.pose,/^hop-[ab]$/);else assert.doesNotMatch(p.pose,/walk|hop/);const clock=r.clock(at('2026-11-02',start+second)),rhythm=r.rhythm(p.id,clock.day,clock.seconds);if(rhythm.elapsed<30)assert.equal(p.walking,false)}
 const moving=states.filter(s=>s.p.walking);assert.ok(moving.length>2);assert.deepEqual([...new Set(moving.map(s=>s.p.pose))].sort(),['hop-a','hop-b']);assert.ok(moving.length*.25<50,'almost all time is quiet rest');
 for(let i=1;i<moving.length;i++)if(moving[i].second-moving[i-1].second===.25)assert.ok(petGap(moving[i].p,{position:moving[i-1].p.position})<=18*1.1*1.5*.25+.01);
 const starts=moving.filter((p,i)=>!i||r.rhythm('pet-rabbit','2026-11-02',start+p.second).beat!==r.rhythm('pet-rabbit','2026-11-02',start+moving[i-1].second).beat);assert.ok(starts.length>=5);for(let i=1;i<starts.length;i++)assert.ok(starts[i].second-starts[i-1].second>=120&&starts[i].second-starts[i-1].second<=180);
 for(const id of ['pet-cat','pet-dog'])assert.ok(r.rhythm(id,'2026-11-02',start).period<r.rhythm('pet-rabbit','2026-11-02',start).period,'Mochi rests longer than both pets');
});

test('Mochi prefers resting guardian Hina, yields to work/travel/visitors and never changes staff',()=>{
 const hina={...restingPeer('hina','3f'),seat:{x:52,y:25}},other={...hina,id:'yuri',seat:{x:52,y:65}},staff=staffWith(other,hina),bytes=JSON.stringify(staff),now=at('2026-11-02',8*3600+120);
 const pet=r.snapshot(now,staff).find(p=>p.id==='pet-rabbit');assert.equal(pet.scene.partnerId,'hina');assert.equal(pet.scene.staffLine,'모찌, 편히 쉬어. 내가 지킬게.');assert.ok(r.safe(pet.floor,pet.point,pet.position));assert.ok(petGap(pet,hina)>=100&&petGap(pet,hina)<=320);
 assert.equal(JSON.stringify(staff),bytes);assert.equal(r.snapshot(at('2026-11-02',8*3600+600),staff).find(p=>p.id===pet.id).scene.key,pet.scene.key);
 for(const change of [{activity:'work'},{walking:true},{visitor:true},{state:'GOING'},{state:'RETURNING'},{floor:'2f'}])assert.notEqual(r.snapshot(now,staffWith({...hina,...change})).find(p=>p.id===pet.id).scene?.partnerId,'hina');
 // A guardian standing across both quiet stops blocks the route: safe omission wins.
 const blocked={...hina,seat:{x:52,y:40}};assert.equal(r.snapshot(now,staffWith(blocked)).find(p=>p.id===pet.id),undefined);
 assert.ok(people.find(p=>p.id==='pet-cat').lines.includes('쟤는 말이 없어서 괜찮네요.'));
});

test('tap any trio member sequences Cream, Cheese, Mochi on the single bubble and holds safe nearby stops for twelve seconds',async()=>{
 for(const tappedId of ['pet-cat','pet-dog','pet-rabbit']){
  let timer;const f=mount(true,false,1440,{setTimeout(fn){timer=fn;return 1}});f.setDateTime('2026-11-02T20:02:00+09:00');f.click('1f');await settled();
  const pet=id=>f.residents().find(a=>a.dataset.person===id),layer=f.ids.get('haniOfficeActors'),bubble=f.map.querySelector('.hani-office-character-bubble');
  layer.events.click({target:pet(tappedId)});assert.equal(bubble.querySelector('p').textContent,'크림 · 같이 놀자!!');assert.equal(bubble.querySelector('a').hidden,true);
  timer();assert.equal(bubble.querySelector('p').textContent,'치즈 · 싫어요.');timer();assert.equal(bubble.querySelector('p').textContent,'모찌 · ……조용히 놀면요.');timer();assert.equal(bubble.hidden,true);
  const positions=['pet-cat','pet-dog','pet-rabbit'].map(id=>plain(pet(id).officeResidentState.position));
  for(const second of [1,4,8,11]){f.setDateTime('2026-11-02T20:02:'+String(second).padStart(2,'0')+'+09:00');f.tick();for(const [i,id]of ['pet-cat','pet-dog','pet-rabbit'].entries()){const state=pet(id).officeResidentState;assert.deepEqual(plain(state.position),positions[i]);assert.equal(state.walking,false);assert.ok(f.context.HaniBuildingScene.residents.safe(state.floor,state.point,state.position,true))}}
  for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){const gap=petGap({position:positions[i]},{position:positions[j]});assert.ok(gap>=96&&gap<280)}
  f.setDateTime('2026-11-02T20:02:13+09:00');f.tick();assert.notDeepEqual(plain(pet('pet-rabbit').officeResidentState.position),positions[2]);assert.equal(f.writes.length,0);
 }
});

test('trio rejects missing/different-floor/sleeping pets and staff-blocked floor; plan and snapshot bytes stay frozen',()=>{
 const isolated=loadScene().scene,rr=isolated.residents,now=at('2026-11-02',20*3600+120),states=rr.snapshot(now),staff=isolated.snapshot(now,{chairmanPresent:true}),bytes=JSON.stringify(staff);
 assert.equal(rr.trio(now,states.filter(p=>p.id!=='pet-rabbit'),staff),null);assert.equal(rr.trio(now,states.map(p=>p.id==='pet-rabbit'?{...p,floor:'3f'}:p),staff),null);
 assert.equal(rr.trio(at('2026-11-03',3*3600),rr.snapshot(at('2026-11-03',3*3600)),staff),null);
 const stop=rr.spot('resident_rabbit_night_a'),blocked=staffWith({id:'visitor',visitor:true,floor:'1f',position:plain(stop.visual),walking:true});assert.equal(rr.trio(now,states,blocked),null);
 const old=loadScene({transform:source=>reapplyTlayoutSource(restoreResidentsSource(source))}).scene;
 assert.ok(rr.trio(now,states,staff));rr.snapshot(now,staff);assert.equal(JSON.stringify(staff),bytes);
 for(const day of ['2026-11-02','2026-11-03'])for(const chairmanPresent of [true,false]){const options={chairmanPresent},plan=isolated.scheduler.plan(day,options),prior=old.scheduler.plan(day,options);assert.equal(JSON.stringify(plan),JSON.stringify(prior));for(const block of [0,48,72,120,143])assert.equal(JSON.stringify(isolated.scheduler.blockPlan(day,block,plan,options)),JSON.stringify(old.scheduler.blockPlan(day,block,prior,options)))}
 // The owner events' two timeouts and three listeners share the same line delta; residents add none.
 const source=read('hani-office-live.js'),before=restoreResidentsSource(source),withoutSnack=source.replace(/event(?:End|Cooldown)Timer=setTimeout\(/g,'').replace("eventButton.addEventListener('click',",'').replace("eventPanel.addEventListener('keydown',",'').replace("button.addEventListener('click',()=>runOwnerEvent(id))",'');for(const re of [/\bfetch\s*\(/g,/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g])assert.deepEqual(withoutSnack.match(re),before.match(re));
 assert.doesNotMatch(source,/localStorage|sessionStorage|supabase|\bsave\s*\(/);
});


test('seeded Cheese and Cream spots change within two minutes; NPC quarters and all staff plans stay frozen',()=>{
 for(const day of ['2026-11-02','2026-11-03','2026-11-04'])for(const id of ['pet-cat','pet-dog'])for(const start of [8*3600+30,10*3600+120,14*3600+60,20*3600+150,23*3600+30,25*3600+30]){
  const first=r.snapshot(at(day,start),null,true,false,false).find(p=>p.id===id);let changed=false,moving=false;
  for(let offset=.5;offset<=120;offset+=.5){const now=at(day,start+offset),pet=r.snapshot(now,null,true,false,false).find(p=>p.id===id);assert.equal(pet.floor,first.floor);assert.ok(r.safe(pet.floor,pet.point,pet.position));if(pet.walking)moving=true;if(petGap(pet,{position:first.position})>2)changed=true}
  assert.ok(changed&&moving,day+' '+id+' '+start);
  const a=r.snapshot(at(day,start)),b=r.snapshot(at(day,start));assert.equal(JSON.stringify(a),JSON.stringify(b),'stable seed, no random clock state');
 }
 const original=loadScene({transform:source=>reapplyTlayoutSource(restoreResidentsSource(source))}).scene;
 for(const day of ['2026-11-02','2026-11-03'])for(const chairmanPresent of [false,true]){const options={chairmanPresent},plan=scene.scheduler.plan(day,options),old=original.scheduler.plan(day,options);assert.equal(JSON.stringify(plan),JSON.stringify(old));for(const block of [0,48,72,120,143])assert.equal(JSON.stringify(scene.scheduler.blockPlan(day,block,plan,options)),JSON.stringify(original.scheduler.blockPlan(day,block,old,options)))}
});

test('affection is brief, deterministic, floor-local and near a stationary working or resting member; Cream prefers chairman',()=>{
 const templates=r.snapshot(at('2026-11-02',20*3600),null,true,true,false).filter(p=>p.pet),counts={'pet-cat':0,'pet-dog':0,'pet-rabbit':0},seen=new Set();const starts=Object.fromEntries(templates.map(p=>[p.id,[]]));
 const staff=templates.map((p,i)=>({id:['sua','seongmin','hina'][i],floor:p.floor,activity:i%2?'work':'rest',state:'AT_PLACE',walking:false,position:[p.position[0],p.position[1]-120/9.41]})),bytes=JSON.stringify(staff);
 for(let second=17*3600;second<22*3600;second++){
  const now=at('2026-11-02',second),states=r.affection(now,plain(templates),staff),active=states.filter(p=>p.affection);assert.ok(active.length<=3,'each pet owns a greeting window');
  for(const p of active){const a=p.affection,peer=staff.find(q=>q.id===a.partnerId);assert.ok(peer);assert.equal(peer.floor,p.floor);assert.ok(petGap(p,peer)>=100&&petGap(p,peer)<=320);assert.ok(['rest','work'].includes(peer.activity));assert.equal(JSON.stringify(states),JSON.stringify(r.affection(now,plain(templates),staff)));
   if(!seen.has(a.key)){seen.add(a.key);counts[p.id]++;starts[p.id].push(second);}
   if(p.id==='pet-dog'){assert.equal(a.heart,'💕');assert.equal(a.partnerId,'seongmin');assert.equal(a.partnerName,'회장님')}else assert.equal(a.heart,'♥');
   for(const edit of [{floor:'5f'},{walking:true},{visitor:true},{activity:'meeting'},{state:'GOING'},{state:'RETURNING'},{position:[0,0]}]){const excluded=staff.map(q=>q.id===peer.id?{...q,...edit}:q);assert.ok(!r.affection(now,plain(templates),excluded).some(q=>q.affection?.partnerId===peer.id),JSON.stringify(edit))}
  }
 }
 assert.ok(counts['pet-dog']>counts['pet-rabbit']&&counts['pet-rabbit']>counts['pet-cat']&&counts['pet-cat']>0,JSON.stringify(counts));for(const times of Object.values(starts)){assert.ok(times.length>100);for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=60&&times[i]-times[i-1]<=120,'each pet greets every one to two minutes when staff stay near')} assert.equal(JSON.stringify(staff),bytes);
 assert.ok(!r.affection(at('2026-11-03',3*3600),plain(templates),staff).some(p=>p.affection));
 for(const p of templates)p.walking=true;assert.ok(!r.affection(at('2026-11-02',79252),plain(templates),staff).some(p=>p.affection));
 const lines=Object.values(r.affectionVoice).flatMap(Object.values);assert.equal(lines.length,20);assert.equal(new Set(lines).size,20);for(const line of lines){assert.ok([...line].length<=22,line);assert.doesNotMatch(line,/개구리|왕눈|초록 회장/)}
});

test('real pet hearts reuse one mounted node, pair taps override trio during affection, and reduced motion is still with zero writes',async()=>{
 for(const reduced of [false,true]){
  const f=mount(true,reduced);await settled();const slots=f.residents(),hearts=slots.filter(p=>p.dataset.resident==='pet').map(p=>p.officeHeart);assert.equal(hearts.length,3);assert.equal(new Set(hearts).size,3);assert.ok(hearts.every(Boolean));assert.ok(slots.filter(p=>p.dataset.resident==='npc').every(p=>!p.officeHeart));
  const nextScene=(start,wantBubble)=>{for(let sec=start;sec<start+1800;sec++){const now=at('2026-11-02',sec),staff=scene.snapshot(now,{chairmanPresent:false}),p=r.snapshot(now,staff,true,reduced).find(p=>p.id==='pet-dog'&&p.affection&&p.affection.bubble===wantBubble);if(p)return {sec,p}}throw Error('no real Cream affection scene')};
  const hit=nextScene(22*3600,true);f.setDateTime(at('2026-11-02',hit.sec-1).toISOString());f.click('1f');await settled();
  const dog=slots.find(a=>a.dataset.person==='pet-dog'),heart=dog.officeHeart,bubble=f.map.querySelector('.hani-office-character-bubble'),create=f.document.createElement;let creates=0;f.document.createElement=(...args)=>{creates++;return create(...args)};
  f.setDateTime(at('2026-11-02',hit.sec).toISOString());f.tick();assert.ok(dog.officeResidentState.affection);assert.equal(heart.hidden,false);assert.equal(heart.textContent,'💕');assert.equal(dog.dataset.affection,'dog');assert.equal(bubble.hidden,false);assert.ok(bubble.querySelector('p').textContent.includes(dog.officeResidentState.affection.staffLine));
  f.ids.get('haniOfficeActors').events.click({target:dog});assert.equal(bubble.querySelector('p').textContent,'크림 · '+dog.officeResidentState.affection.line,'pair takes precedence over trio');assert.equal(bubble.querySelector('a').hidden,true);
  let reads=0;const measures=new Map();for(const n of new Set([f.map,...f.root.querySelectorAll('*')])){measures.set(n,n.getBoundingClientRect);n.getBoundingClientRect=()=>{reads++;throw Error('per-frame layout read')}};
  f.setDateTime(at('2026-11-02',hit.sec+.1).toISOString());f.tick();assert.equal(reads,0);for(const [n,measure]of measures){if(measure)n.getBoundingClientRect=measure;else delete n.getBoundingClientRect}
  f.setDateTime(at('2026-11-02',hit.sec+8).toISOString());f.tick();assert.equal(heart.hidden,true);assert.equal(dog.dataset.affection,undefined);
  const second=nextScene(hit.sec+20,false);f.setDateTime(at('2026-11-02',second.sec).toISOString());f.tick();assert.equal(dog.officeHeart,heart);assert.equal(heart.hidden,false);assert.equal(creates,0);assert.equal(f.writes.length,0);if(reduced){assert.equal(dog.dataset.motion,undefined);assert.equal(dog.dataset.walking,'false')}
 }
 const css=read('hani-office-live.css');assert.match(css,/\.hani-office-pet-heart\[hidden\]\{display:none!important\}/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.hani-office-actor\[data-affection\] \.hani-office-pet-heart\{animation:none!important;transform:translateX\(-50%\);opacity:\.9\}/);assert.match(css,/data-affection="dog"\] \.hani-office-sprite\{animation:hani-office-hop \.48s ease-in-out 2\}/);
 const source=read('hani-office-live.js'),before=restoreResidentsSource(source);assert.equal(source.split(/event(?:End|Cooldown)Timer=setTimeout\(/).length-1,2);assert.equal(source.split("eventButton.addEventListener('click',").length-1,1);assert.equal(source.split("eventPanel.addEventListener('keydown',").length-1,1);assert.equal(source.split("button.addEventListener('click',()=>runOwnerEvent(id))").length-1,1);const withoutSnack=source.replace(/event(?:End|Cooldown)Timer=setTimeout\(/g,'').replace("eventButton.addEventListener('click',",'').replace("eventPanel.addEventListener('keydown',",'').replace("button.addEventListener('click',()=>runOwnerEvent(id))",'');for(const re of [/\bfetch\s*\(/g,/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g])assert.deepEqual(withoutSnack.match(re),before.match(re));assert.doesNotMatch(source,/localStorage|sessionStorage|supabase|\bsave\s*\(/);
});

test('life signs repeat every 10..20 seconds, cover four gestures, and sleep or reduced motion suppresses them',()=>{
 for(const day of ['2026-11-02','2026-11-03','2026-11-04'])for(const id of ['pet-cat','pet-dog','pet-rabbit']){
  const kinds=new Set(),times=[],template={id,pet:true,floor:'1f',position:[50,55],pose:'sitting',walking:false,facing:'left'};let last;
  for(let sec=20*3600;sec<20*3600+300;sec+=.1){
   const now=at(day,sec),p=r.life(now,[{...template}],false)[0];
   if(p.life&&p.life.key!==last){kinds.add(p.life.kind);times.push(sec);last=p.life.key;if(p.life.kind==='sit-stand')assert.equal(p.pose,'standing')}
   assert.equal(r.life(now,[{...template}],true)[0].life,undefined);
  }
  assert.deepEqual([...kinds].sort(),['hop','sit-stand','turn','wag']);assert.ok(times.length>=14);
  for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=9.9&&times[i]-times[i-1]<=20.1);
  for(const edit of [{walking:true},{affection:{kind:'cat'}}])assert.equal(r.life(at(day,72000),[{...template,...edit}],false)[0].life,undefined);
  assert.equal(r.life(at(day,3*3600),[{...template,pose:'sleep'}],false)[0].life,undefined);
 }
});

test('persistent pet life gestures run on the shared tick without creating nodes, timers or frame layout reads; sleeping taps hop',async()=>{
 const f=mount();await settled();const slots=f.residents(),pet=slots.find(a=>a.dataset.person==='pet-cat'),timers=f.timers.length,children=slots.map(a=>a.children.length),kinds=new Set();let reads=0,creates=0;
 const create=f.document.createElement;f.document.createElement=(...args)=>{creates++;return create(...args)};
 for(let sec=10*3600;sec<10*3600+300&&kinds.size<4;sec++){
  const now=at('2026-11-02',sec),sample=r.life(now,[{id:'pet-cat',pet:true,pose:'sitting',walking:false}],false)[0];if(!sample.life||kinds.has(sample.life.kind))continue;
  f.setDateTime(now.toISOString());f.click('1f');await settled();f.tick();if(pet.dataset.life!==sample.life.kind)continue;
  // Measure start and end on the 100ms resident clock between the existing
  // 200ms staff projections; staff layout events have their own owner/tests.
  for(const [before,after]of [[-.1,.01],[1.1,1.21]]){
   f.setDateTime(at('2026-11-02',sec+before).toISOString());f.click('1f');await settled();f.tick();assert.equal(pet.officeResidentState.walking,false);
   const measures=new Map();for(const n of new Set([f.map,...f.root.querySelectorAll('*')])){measures.set(n,n.getBoundingClientRect);n.getBoundingClientRect=()=>{reads++;throw Error('life frame layout read')}}
   for(const offset of [after,after+.03,after+.05]){f.setDateTime(at('2026-11-02',sec+offset).toISOString());f.tick()}
   for(const [n,measure]of measures){if(measure)n.getBoundingClientRect=measure;else delete n.getBoundingClientRect}
  }
  kinds.add(sample.life.kind);
 }
 assert.deepEqual([...kinds].sort(),['hop','sit-stand','turn','wag']);assert.equal(reads,0);assert.equal(creates,0);assert.equal(f.timers.length,timers);assert.deepEqual(slots.map(a=>a.children.length),children);assert.equal(f.writes.length,0);
 f.setDateTime('2026-11-03T03:00:00+09:00');f.click('1f');f.tick();
 for(const a of slots.filter(a=>a.dataset.resident==='pet')){assert.equal(a.dataset.pose,'sleep');assert.equal(a.dataset.life,undefined);assert.equal(a.dataset.affection,undefined);assert.equal(a.dataset.motion,undefined)}
 const position=[pet.style.left,pet.style.top];f.ids.get('haniOfficeActors').events.click({target:pet});f.tick();assert.equal(pet.dataset.motion,'hop');assert.equal(f.map.querySelector('.hani-office-character-bubble').hidden,false);assert.deepEqual([pet.style.left,pet.style.top],position);
 const css=read('hani-office-live.css');assert.match(css,/data-pose="sleep"\]:not\(\[data-motion\]\) \.hani-office-sprite\{animation:hani-pet-sleep/);assert.match(css,/data-resident="pet"\] \.hani-office-sprite\{animation:none!important;transform:none!important;rotate:none!important/);
});

test('pet nominal speeds vary per leg around Cream 48, Cheese 40 and Mochi 18 while periods remain stable over days',()=>{
 for(const day of ['2026-11-02','2026-11-03','2026-11-04'])for(const [id,speed]of [['pet-cat',40],['pet-dog',48],['pet-rabbit',18]]){
  const period=r.rhythm(id,day,30000).period;assert.ok(period>=(id==='pet-rabbit'?120:60)&&period<=(id==='pet-rabbit'?180:120));
  const sec=movingSecond(id,10*3600,day),a=r.snapshot(at(day,sec),null,true,false,false).find(p=>p.id===id),b=r.snapshot(at(day,sec+.1),null,true,false,false).find(p=>p.id===id);assert.ok(b.walking);assert.ok(a.motion.speed>=speed*.9&&a.motion.speed<=speed*1.1);assert.ok(petGap(a,b)<speed*1.1*1.5*.1+.01);
 }
});

test('shared-floor companions safely approach each other and the trio speaks automatically once together',async()=>{
 const local=loadScene().scene.residents;let approached=false;const gaps=[];
 for(let second=7*3600+60;second<7*3600+540;second+=.5){const now=at('2026-11-02',second),states=local.snapshot(now),cat=states.find(p=>p.id==='pet-cat'),dog=states.find(p=>p.id==='pet-dog');if(!cat||!dog)continue;assert.ok(local.safe(cat.floor,cat.point,cat.position));assert.ok(local.safe(dog.floor,dog.point,dog.position));const gap=petGap(cat,dog);assert.ok(gap>=96);gaps.push(gap);if(cat.walking&&cat.position[0]>47)approached=true}
 assert.ok(approached,'Cheese walks beyond its usual stop toward Cream');assert.ok(Math.max(...gaps)-Math.min(...gaps)>100);
 const f=mount();await settled();f.setDateTime('2026-11-02T22:05:40+09:00');f.click('1f');await settled();
 const pets=f.residents().filter(a=>a.dataset.resident==='pet');assert.ok(pets.every(a=>!a.hidden&&!a.officeResidentState.walking&&!a.officeResidentState.affection));for(const a of pets)for(const b of pets)assert.ok(petGap(a.officeResidentState,b.officeResidentState)<280);
 const bubble=f.map.querySelector('.hani-office-character-bubble');bubble.hidden=true;f.root.officeTrioBeat=undefined;f.tick();assert.equal(bubble.hidden,false);assert.equal(bubble.querySelector('p').textContent,'크림 · 같이 놀자!!');assert.equal(f.writes.length,0);
});

test('pet easing moves less at both ends than in the middle, with seeded per-leg speeds and variable launch rests',()=>{
 const a=r.spot('resident_cat_lobby'),end=r.spot('resident_cat_front'),b={...end,x:a.x+(end.x-a.x)*.4,visual:a.visual.map((v,i)=>v+(end.visual[i]-v)*.4)};
 for(const [id,base]of [['pet-cat',40],['pet-dog',48],['pet-rabbit',18]]){
  const speeds=new Set(),rests=new Set();let tested=0;
  for(let beat=0;beat<25;beat++){
   const first=r.motion(id,'2026-11-02',beat,a,b,0);assert.ok(first);assert.ok(first.speed>=base*.9&&first.speed<=base*1.1);speeds.add(first.speed);rests.add(r.rhythm(id,'2026-11-02',beat*r.rhythm(id,'2026-11-02',30000).period).rest);
   if(first.pause)continue;
   const sample=t=>r.motion(id,'2026-11-02',beat,a,b,first.duration*t),gap=(x,y)=>petGap(sample(x),sample(y));
   assert.ok(gap(0,.1)<gap(.45,.55)*.4);assert.ok(gap(.9,1)<gap(.45,.55)*.4);assert.ok(petGap(sample(0),{position:a.visual})<.001);assert.ok(petGap(sample(1),{position:b.visual})<.001);tested++;
  }
  assert.ok(tested>5);assert.ok(speeds.size>5);assert.ok(rests.size>1);
 }
});

test('a seeded day includes reproducible one-to-three second mid-route pauses followed by onward movement',()=>{
 for(const id of ['pet-cat','pet-dog','pet-rabbit']){
  let witness;
  for(let sec=7*3600;sec<21*3600;sec+=.5){const p=r.snapshot(at('2026-11-02',sec),null,true,false,false).find(p=>p.id===id);if(p?.motion?.paused&&p.motion.kind!=='ears'){witness={sec,p};break}}
  assert.ok(witness,id+' has an actual paused snapshot');const {sec,p}=witness;assert.equal(p.walking,false);assert.ok(p.motion.pause>=1&&p.motion.pause<=3);assert.equal(JSON.stringify(p),JSON.stringify(r.snapshot(at('2026-11-02',sec),null,true,false,false).find(q=>q.id===id)));
  let resumed=false,held=false;for(let dt=.1;dt<8;dt+=.1){const q=r.snapshot(at('2026-11-02',sec+dt),null,true,false,false).find(q=>q.id===id);if(q.motion?.paused&&petGap(p,q)<.001)held=true;if(q.walking&&petGap(p,q)>1)resumed=true}
  assert.ok(held);assert.ok(resumed,id+' resumes after inspecting the floor');
 }
});

test('curves use clear midpoints and whole corridors on every pet floor, and still reject blocked points',()=>{
 let curved=0;
 for(const p of r.people.filter(p=>p.pet))for(const [floor,ids]of Object.entries(p.places))for(let i=0;i<ids.length;i++){
  const a=r.spot(ids[i]),b=r.spot(ids[(i+1)%ids.length]);if(!a||!b)continue;
  for(const seed of [0,1]){const route=r.route(a,b,seed);assert.ok(route.nodes.length);for(const n of route.nodes)assert.ok(r.safe(floor,n.point,n.visual,true));const mid=route.nodes[Math.floor(route.nodes.length/2)],linear=a.visual.map((v,j)=>(v+b.visual[j])/2);if(petGap({position:mid.visual},{position:linear})>1)curved++}
 }
 assert.ok(curved>=3,'safe bends on multiple routes');
 const a=r.spot('resident_cat_lobby'),b=r.spot('resident_cat_front');assert.equal(r.motion('pet-cat','2026-11-02',1,a,b,.5,()=>false),null);
 let actual=false;for(let sec=20*3600;sec<20*3600+120;sec+=.1){const p=r.snapshot(at('2026-11-02',sec),null,true,false,false).find(p=>p.id==='pet-cat');assert.ok(r.safe(p.floor,p.point,p.position));if(p.walking&&Math.abs(p.position[1]-55)>.02)actual=true}assert.ok(actual,'actual snapshot follows a curve');
});

test('facing is stable across short and vertical legs, including reversed legs and their arrival',()=>{
 const a=r.spot('resident_dog_hall'),b={...a,visual:[a.visual[0]+.4,a.visual[1]+1]};
 for(const fallback of ['left','right']){assert.equal(r.facing(a,b,fallback),fallback);assert.equal(r.facing(b,a,fallback),fallback)}
 for(const id of ['pet-cat','pet-dog','pet-rabbit'])for(let beat=0;beat<8;beat++){
  const facings=new Set();for(const [from,to]of [[a,b],[b,a]]){const first=r.motion(id,'2026-11-02',beat,from,to,0);assert.ok(first);for(let t=0;t<=first.duration+1;t+=.02)facings.add(r.motion(id,'2026-11-02',beat,from,to,t).facing)}assert.equal(facings.size,1);
 }
});

test('personalities use distance-synced quiet steps, bouncy trot and two hops then ears-up rest; Cream can spin',()=>{
 const a=r.spot('resident_cat_lobby'),b=r.spot('resident_cat_front');let spin=false,tail=false,ears=false;
 for(const id of ['pet-cat','pet-dog','pet-rabbit'])for(let beat=0;beat<25;beat++){
  const first=r.motion(id,'2026-11-02',beat,a,b,0);let previous;
  for(let t=0;t<first.duration;t+=.05){const q=r.motion(id,'2026-11-02',beat,a,b,t);assert.ok(q);if(q.walking){const stride=id==='pet-rabbit'?18:id==='pet-dog'?24:30;assert.equal(q.pose,(id==='pet-rabbit'?'hop-':'walk-')+(Math.floor(q.distance/stride)%2?'b':'a'));assert.ok(Math.abs(q.bob)<=(id==='pet-cat'?.35:id==='pet-dog'?1.3:2.2)+.001)}
   if(id==='pet-cat'&&Math.abs(q.lean)>.1)tail=true;
   if(id==='pet-dog'&&q.spin>10&&q.spin<350)spin=true;
   if(id==='pet-rabbit'&&q.kind==='ears'){ears=true;assert.equal(q.pose,'standing');assert.ok(Math.abs(q.distance-36)<.001);assert.equal(q.walking,false);if(previous?.kind==='ears')assert.equal(q.distance,previous.distance)}previous=q;
  }
 }
 assert.ok(spin);assert.ok(tail);assert.ok(ears);
});

test('reduced pet motion has no bob, lean, spin, animated pose or easing properties in the persistent owner',async()=>{
 const f=mount(true,true);await settled();
 for(const sec of [36000,36001,36003,72000,79200]){f.setDateTime(at('2026-11-02',sec).toISOString());f.click('1f');f.tick();for(const actor of f.residents().filter(a=>a.dataset.resident==='pet'&&!a.hidden)){
  assert.equal(actor.officeResidentState.motion,undefined);assert.equal(actor.officeResidentState.walking,false);assert.equal(actor.dataset.petPause,undefined);assert.equal(actor.dataset.life,undefined);assert.equal((actor.style.getPropertyValue?.('--pet-bob')??actor.style['--pet-bob']),'0px');assert.equal((actor.style.getPropertyValue?.('--pet-lean')??actor.style['--pet-lean']),'0deg');assert.equal((actor.style.getPropertyValue?.('--pet-spin')??actor.style['--pet-spin']),'0deg');assert.doesNotMatch(actor.dataset.pose,/walk|hop/);
 }}
 const css=read('hani-office-live.css');assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.hani-office-actor\[data-resident="pet"\] \.hani-office-sprite\{animation:none!important;transition:none!important;transform:none!important;rotate:none!important\}/);assert.equal(f.writes.length,0);
});
