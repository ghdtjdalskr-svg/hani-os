import test from 'node:test';
import {restoreBarista273Source} from './hani-office-barista-night-273-source.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {at} from './hani-office-lively-fixture.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const table=JSON.parse(read('assets/data/office-actions-221.json'));
const manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve()};
// Same real owner/DOM loader, fake clock and persistence traps as snack.test.
async function mount({width=1280,reduced=false,seconds=36000,floor='1f'}={}){
 let clock=+at('2026-11-06',seconds),next=0;const pending=new Map(),history=[],writes=[];
 const deny=(...args)=>{writes.push(args);throw Error('unexpected persistence')};
 const f=fixture('10:00',reduced,()=>true,table,{
  HaniOfficeV2Assets:{...assets,spritesV3:manifest},innerWidth:width,
  fetch:async url=>url.endsWith('/office-tap-lines-v1.json')?{ok:true,json:async()=>JSON.parse(read('assets/data/office-tap-lines-v1.json'))}:{ok:false},
  matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:width<=Number(q.match(/max-width:\s*(\d+)/)?.[1]||0),addEventListener(){}}),
  setTimeout(fn,ms){const t={id:++next,fn,ms,at:clock+ms};pending.set(t.id,t);history.push(t);return t.id},clearTimeout:id=>pending.delete(id),
  localStorage:{setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny},save:deny
 });
 f.ids.set('app',{classList:{contains:()=>false}});f.context.window.HaniOfficePresence={chairman:'absent'};
 f.document.visibilityState='visible';f.setDateTime(new Date(clock).toISOString());f.click(floor);await flush();
 const panel=f.root.querySelector('.hani-office-character-bubble');
 const down=target=>f.document.events.pointerdown({target,pointerType:'mouse',isPrimary:true});
 const tap=target=>{down(target);const event={target};if(panel.contains(target))panel.onclick(event);else if(target.closest?.('.hani-office-actor'))f.ids.get('haniOfficeActors').events.click(event);else target.onclick?.(event)};
 const staff=()=>f.visible().filter(a=>!a.dataset.resident&&a.dataset.visitor!=='true'&&a.dataset.person!=='seongmin');
 async function advance(ms){clock+=ms;f.setDateTime(new Date(clock).toISOString());for(const t of [...pending.values()].sort((a,b)=>a.at-b.at))if(pending.has(t.id)&&t.at<=clock){pending.delete(t.id);t.fn()}f.timers.find(t=>t.ms===100).fn();await flush()}
 return {f,panel,down,tap,staff,pending,history,writes,advance};
}

const plain=x=>JSON.parse(JSON.stringify(x));
const ids=['pet-cat','pet-dog','pet-rabbit','pet-bori'];
test('Bori: three byte-exact approved assets and complete ten-frame dog model; no full portrait',async()=>{
 const require=createRequire(import.meta.url),sharp=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
 const expected={'assets/sprites-v3/pet-bori.webp':['pet-bori.webp',480,288],'assets/profiles/thumb/hani-profile-bori-128.webp':['thumb/hani-profile-bori-128.webp',128,128],'assets/profiles/thumb/hani-profile-bori-256.webp':['thumb/hani-profile-bori-256.webp',256,256]};
 for(const [file,[source,width,height]]of Object.entries(expected)){const b=fs.readFileSync(new URL('../'+file,import.meta.url)),original=new URL('../../pet-bori/artifacts/pet-bori/'+source,import.meta.url);assert.deepEqual(b,fs.readFileSync(original));const meta=await sharp(b).metadata();assert.equal(meta.width,width);assert.equal(meta.height,height)}
 assert.equal(fs.existsSync(new URL('../assets/profiles/hani-profile-bori.webp',import.meta.url)),false);
 const entry=manifest.entries.find(e=>e.id==='pet-bori'),dog=manifest.entries.find(e=>e.id==='pet-dog');assert.ok(entry);assert.equal(entry.scale,dog.scale);assert.equal(entry.frames.length,10);assert.equal(entry.sha256,createHash('sha256').update(fs.readFileSync(new URL('../assets/sprites-v3/pet-bori.webp',import.meta.url))).digest('hex'));
 assert.deepEqual(entry.frames.map(f=>[f.name,f.pose,f.direction,f.rect,f.pivot]),dog.frames.map(f=>[f.name,f.pose,f.direction,f.rect,f.pivot]));
});
test('Bori: 1F 07–13/15–07, 2F 13–15; visible >=95%, sleeps more than all peers',async()=>{
 const x=await mount(),model=x.f.context.HaniBuildingScene,r=model.residents;assert.equal(r.names.bori,'보리');assert.equal(r.people.filter(p=>p.pet).length,4);
 const evidence=[];
 for(const day of ['2026-11-02','2026-11-06','2026-11-07']){const counts=Object.fromEntries(ids.map(id=>[id,{visible:0,sleep:0}]));let lobby=0,total=0;
  for(let seconds=7*3600;seconds<22*3600;seconds+=60){total++;const now=at(day,seconds),staff=model.snapshot(now,{chairmanPresent:false}),before=JSON.stringify(staff),states=r.snapshot(now,staff);assert.equal(JSON.stringify(staff),before);
   for(const p of states.filter(p=>p.pet)){counts[p.id].visible++;if(p.pose==='sleep')counts[p.id].sleep++;if(p.id==='pet-bori'){assert.equal(p.floor,seconds>=13*3600&&seconds<15*3600?'2f':'1f');if(p.floor==='1f')lobby++}}
  }
  assert.ok(counts['pet-bori'].visible/total>=.95);assert.ok(lobby/total>=.8);assert.ok(counts['pet-bori'].sleep/total>=.6);for(const id of ids.filter(id=>id!=='pet-bori'))assert.ok(counts['pet-bori'].sleep>counts[id].sleep);evidence.push({day,total,lobby,counts});
 }
 fs.writeFileSync(new URL('../artifacts/pet-bori-live/schedule-evidence.json',import.meta.url),JSON.stringify(evidence,null,2));assert.deepEqual(x.writes,[]);
});
test('Bori: clear routes exclude furniture, staff chairs, other pets, queen, barista, tree and gifts',async()=>{
 const x=await mount(),model=x.f.context.HaniBuildingScene,r=model.residents;
 const spots=['resident_bori_lobby_a','resident_bori_lobby_b','resident_bori_night_a','resident_bori_night_b','resident_bori_lounge_a','resident_bori_lounge_b'];
 for(const id of spots){const a=r.spot(id);assert.ok(a,id);assert.ok(r.safe(a.floor,[a.x,a.y],a.visual));for(const peer of r.people.filter(p=>p.pet&&p.id!=='pet-bori'))for(const sid of peer.places[a.floor]||[]){const b=r.spot(sid);assert.ok(Math.hypot((a.visual[0]-b.visual[0])*16.72,(a.visual[1]-b.visual[1])*9.41)>=96)}}
 const protectedRects=[[1171,73,1347,180],[1536,650,1581,706],[437,299,549,435],[496,407,544,443]];let walks=0,samples=0;
 for(const day of ['2026-11-06','2026-12-24'])for(let second=0;second<86400;second+=17.3){const now=at(day,second),states=r.snapshot(now,model.snapshot(now,{chairmanPresent:false})),p=states.find(p=>p.id==='pet-bori');if(!p)continue;samples++;assert.equal(r.safe(p.floor,p.point,p.position),true);if(p.walking)walks++;
  for(const q of states.filter(q=>q.id!==p.id&&q.floor===p.floor))assert.ok(Math.hypot((p.position[0]-q.position[0])*16.72,(p.position[1]-q.position[1])*9.41)>=96);
  if(p.floor==='1f'){const px=p.position[0]*16.72,py=p.position[1]*9.41;for(const [l,t,r,b]of protectedRects)assert.ok(px+46<l||px-46>r||py+8<t||py-88>b)}
 }
 assert.ok(samples>9000);assert.ok(walks>0,'real walks sampled');assert.deepEqual(x.writes,[]);
});
test('Bori: 25–45 second cycles, longer rests, short 12px/s walks slower than Mochi',async()=>{
 const x=await mount(),r=x.f.context.HaniBuildingScene.residents;
 for(const day of ['2026-11-02','2026-11-06','2026-11-07']){const b=r.rhythm('pet-bori',day,36000),m=r.rhythm('pet-rabbit',day,36000);assert.ok(b.period>=25&&b.period<=45);assert.ok(b.rest>=10&&b.rest>m.rest);
  const a=r.spot('resident_bori_lobby_a'),z=r.spot('resident_bori_lobby_b'),motion=r.motion('pet-bori',day,1,a,z,.5),rabbit=r.motion('pet-rabbit',day,1,a,z,.5);assert.ok(motion.walking);assert.ok(motion.speed<rabbit.speed);assert.ok(motion.distance<=26);assert.ok(motion.duration<5);
 }assert.deepEqual(x.writes,[]);
});
test('Bori: tap uses his existing bubble and ten warm lines while napping',async()=>{
 const x=await mount({seconds:36000}),pet=x.f.visible().find(a=>a.dataset.person==='pet-bori');assert.ok(pet);assert.equal(pet.dataset.sprite,'pet-bori');const r=x.f.context.HaniBuildingScene.residents,p=r.people.find(p=>p.id==='pet-bori');assert.equal(p.lines.length,10);
 for(const line of p.lines){assert.ok([...line].length<=22);assert.doesNotMatch(line,/undefined|뚱|못생/);x.tap(pet);assert.equal(x.panel.hidden,false);assert.ok(x.panel.textContent.includes('보리'));assert.ok(x.panel.textContent.includes(line));x.down(x.f.map);assert.equal(x.panel.hidden,true)}
 const before=x.history.length;await x.advance(100);assert.equal(x.panel.hidden,true,'round 1 dismissal cannot reopen next tick');assert.equal(x.history.length,before);assert.deepEqual(x.writes,[]);
});
test('Bori: reduced motion freezes him; hidden and offscreen floors retain no advancing state',async()=>{
 for(const floor of ['1f','2f']){const seconds=floor==='1f'?36000:50400,x=await mount({reduced:true,floor,seconds}),p=x.f.visible().find(a=>a.dataset.person==='pet-bori');assert.ok(p);const initial=plain(p.officePosition);for(let i=0;i<60;i++){await x.advance(1000);assert.deepEqual(plain(p.officePosition),initial);assert.equal(p.dataset.walking,'false');assert.equal(p.dataset.life,undefined);assert.equal(p.dataset.motion,undefined);assert.equal(p.style['--pet-bob'],'0px')}assert.deepEqual(x.writes,[])}
 const x=await mount(),p=x.f.visible().find(a=>a.dataset.person==='pet-bori');x.f.click('3f');await flush();const state=p.officeResidentState;for(let i=0;i<20;i++)await x.advance(100);assert.equal(p.officeResidentState,state);x.f.hide();assert.equal(x.f.root.dataset.paused,'true');await x.advance(5000);assert.equal(p.officeResidentState,state);assert.deepEqual(x.writes,[]);
});
test('Bori: eligible for a three-way chat; four present pets keep the original nearby trio',async()=>{
 const x=await mount(),r=x.f.context.HaniBuildingScene.residents;const states=ids.map((id,i)=>({id,pet:true,floor:'1f',position:[43+i*6,55],pose:id==='pet-rabbit'?'sleep':'sitting',walking:false}));states.find(p=>p.id==='pet-bori').position=[55,55];
 const lines=r.trioChat(states);assert.equal(lines.length,3);assert.ok(lines.some(p=>p.id==='pet-bori'));states.find(p=>p.id==='pet-rabbit').pose='sitting';assert.deepEqual(plain(r.trioChat(states).map(p=>p.id)),['pet-dog','pet-cat','pet-rabbit']);assert.deepEqual(x.writes,[]);
});
test('Bori: no persistence, staff plan owner, timers, listeners and nodes remain unchanged',()=>{
 const before=read('artifacts/pet-bori-live/baseline-hani-office-live.js.txt'),after=restoreBarista273Source(read('hani-office-live.js'));
 const staff=s=>{const a=s.indexOf('  const residentNames='),b=s.indexOf('  function createPresence('),c=s.indexOf('/* Read-only Living Office.');return s.slice(0,a)+s.slice(b,c)};assert.equal(staff(after),staff(before));
 for(const regex of [/document\.addEventListener\(/g,/addEventListener\(/g,/createElement\(/g,/setInterval\(/g,/setTimeout\(/g,/requestAnimationFrame\(/g,/\bfetch\(/g])assert.equal([...after.matchAll(regex)].length,[...before.matchAll(regex)].length);assert.doesNotMatch(after,/localStorage|sessionStorage|supabase|\bsave\s*\(/);
});
