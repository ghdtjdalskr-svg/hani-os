import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
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

for(const width of [1280,1920])test(`mouse ${width}: map/card/page/header/sidebar close; staff, pets, barista and event controls work`,async()=>{
 const x=await mount({width}),a=x.staff()[0];assert.ok(a);
 const targets=[x.f.map,x.f.root,...['page','header','sidebar'].map(name=>{const el=x.f.document.createElement('div');el.id=name;return el})];
 for(const target of targets){x.tap(a);await flush();assert.equal(x.panel.hidden,false);const stale=x.history.at(-1);x.down(target);assert.equal(x.panel.hidden,true,target.id);stale.fn();await x.advance(100);assert.equal(x.panel.hidden,true,'stale timer/tick cannot reopen');}
 x.tap(a);x.tap(x.panel.querySelector('p'));assert.equal(x.panel.hidden,true);
 x.tap(a);x.tap(x.panel.querySelector('.hani-office-bubble-close'));assert.equal(x.panel.hidden,true);
 x.tap(a);x.down(x.f.ids.get('haniOfficeEvents'));x.f.ids.get('haniOfficeEvents').events.click();assert.equal(x.panel.hidden,true);assert.equal(x.f.ids.get('haniOfficeEventPanel').hidden,false);
 x.down(x.f.ids.get('haniOfficeSnack'));assert.equal(x.f.ids.get('haniOfficeEventPanel').hidden,false);
 x.tap(x.f.ids.get('haniOfficeBarista'));assert.equal(x.panel.hidden,false);assert.ok(x.panel.textContent.includes('바리스타 이슬'));
 const pet=x.f.visible().find(a=>a.dataset.resident==='pet');assert.ok(pet);x.tap(pet);assert.equal(x.panel.hidden,false);
 x.tap(a);assert.equal(a.dataset.speaking,'true');assert.deepEqual(x.writes,[]);
});

test('existing pointer owner runs before a descendant stopPropagation, without adding document listeners',async()=>{
 const source=read('hani-office-live.js'),line=source.split('\n').find(s=>s.includes("for(const type of ['pointerdown','keydown','wheel','touchstart'])")),registrations=[];
 vm.runInNewContext(line,{document:{addEventListener:(type,fn,options)=>registrations.push({type,options})}});
 const pointers=registrations.filter(r=>r.type==='pointerdown');assert.equal(pointers.length,1);assert.equal(pointers[0].options.capture,true);
 const x=await mount(),a=x.staff()[0];x.tap(a);let stopped=false;
 const event={target:x.f.root,stopPropagation(){stopped=true}};
 // DOM capture reaches document first; a card's bubbling owner then swallows it.
 if(pointers[0].options.capture)x.f.document.events.pointerdown(event);
 event.stopPropagation();if(!stopped)x.f.document.events.pointerdown(event);
 assert.equal(x.panel.hidden,true);assert.deepEqual(x.writes,[]);
});

test('real cause: dismissing a manually opened pet trio cannot immediately trigger the automatic trio',async()=>{
 // Real resident schedule: 17:03:47 KST, all three pets are nearby and stationary.
 const x=await mount({seconds:61426});const a=x.staff()[0];assert.ok(a);x.tap(a);await x.advance(1000);
 const pets=x.f.visible().filter(a=>a.dataset.resident==='pet');assert.equal(pets.length,3);
 x.tap(pets[0]);assert.equal(x.panel.hidden,false);const stale=x.history.at(-1);
 x.down(x.f.map);assert.equal(x.panel.hidden,true);stale.fn();await x.advance(100);
 assert.equal(x.panel.hidden,true,'resident auto trio used to reopen on the very next shared tick');
 await x.advance(5100);assert.equal(x.panel.hidden,true,'the same trio beat remains dismissed');
 x.tap(a);assert.equal(a.dataset.speaking,'true');assert.deepEqual(x.writes,[]);
});

test('pets: bounded idle motion fills pauses, preserves clock paths, and reduced/offscreen rules stop it',async()=>{
 const css=read('hani-office-live.css');
 const idle=css.match(/(\.hani-office-actor\[data-resident="pet"\][^{]*\{animation:hani-pet-idle[^}]+\})/);assert.ok(idle,'persistent pet sprite idle rule');
 for(const excluded of ['data-walking="true"','data-pose="sleep"','data-motion','data-life','data-affection'])assert.ok(idle[1].includes(':not(['+excluded+'])'));
 assert.match(css,/@keyframes hani-pet-idle\{0%,100%\{transform:scale\(1\)\}[^\n]+scale\(\.98,\.97\)/);
 assert.match(css,/\[data-paused="true"\] \*\{animation-play-state:paused!important\}/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.hani-office-actor\[data-resident="pet"\] \.hani-office-sprite\{animation:none!important;transition:none!important;transform:none!important;rotate:none!important\}/);
 for(const reduced of [false,true]){
  const x=await mount({reduced});const model=x.f.context.HaniBuildingScene;
  for(const [floor,id]of [['1f','pet-cat'],['2f','pet-dog'],['3f','pet-rabbit']]){
   x.f.click(floor);await flush();const pet=x.f.visible().find(a=>a.dataset.person===id);assert.ok(pet,id);
   const expected=model.residents.snapshot(new x.f.context.Date(),model.snapshot(new x.f.context.Date(),{chairmanPresent:false}),true,reduced).find(p=>p.id===id);
   assert.deepEqual(JSON.parse(JSON.stringify(pet.officePosition)),JSON.parse(JSON.stringify(expected.position)),id+' follows existing safe placement');
   const position=pet.officePosition.slice();await x.advance(100);
   if(reduced){assert.deepEqual(pet.officePosition,position);assert.equal(pet.dataset.life,undefined);assert.equal(pet.dataset.motion,undefined);assert.equal(pet.style['--pet-bob'],'0px');}
  }
  x.f.hide();assert.equal(x.f.root.dataset.paused,'true');assert.deepEqual(x.writes,[]);
 }
});

test('model plan/blockPlan/snapshot and all model helpers stay byte identical; no extra loops, listeners or nodes',()=>{
 const before=read('artifacts/office-pets-bubble/before-source.txt'),after=read('hani-office-live.js'),boundary='/* Read-only Living Office.';
 assert.equal(after.slice(0,after.indexOf(boundary)),before.slice(0,before.indexOf(boundary)));
 for(const regex of [/document\.addEventListener\(/g,/addEventListener\(/g,/createElement\(/g,/setInterval\(/g,/setTimeout\(/g])assert.equal([...after.matchAll(regex)].length,[...before.matchAll(regex)].length,regex.toString());
 for(const regex of [/localStorage\.[a-zA-Z]+\(/g,/sessionStorage\.[a-zA-Z]+\(/g])assert.deepEqual(after.match(regex),before.match(regex));
});

// Round 2 adds checks; the round 1 assertions above remain verbatim, including
// its now-stale whole-model pin. Staff-only preservation is checked separately.
const petIds=['pet-cat','pet-dog','pet-rabbit'];
const plain=x=>JSON.parse(JSON.stringify(x));
test('round2: a manual pet tap takes priority over the pending entrance gesture',async()=>{
 const x=await mount({seconds:36003}),pet=x.f.visible().find(a=>a.dataset.resident==='pet'&&a.dataset.walking==='false');assert.ok(pet);
 x.tap(pet);await x.advance(100);assert.equal(pet.dataset.motion,'hop');assert.equal(x.panel.hidden,false);assert.deepEqual(x.writes,[]);
});
test('round2: sleeping pets do not greet automatically, but a manual tap still gets one hop',async()=>{
 const x=await mount({seconds:10800}),pets=x.f.visible().filter(a=>a.dataset.resident==='pet');assert.equal(pets.length,3);
 for(let i=0;i<60;i++){await x.advance(100);for(const pet of pets){assert.equal(pet.dataset.pose,'sleep');assert.equal(pet.dataset.motion,undefined)}}
 x.tap(pets[0]);await x.advance(100);assert.equal(pets[0].dataset.motion,'hop');assert.deepEqual(x.writes,[]);
});
test('round2: every visible pet starts a queued gesture within ten seconds of entering its floor',async()=>{
 for(const seconds of [36000,36003,46800,61426,61427,72000])for(const floor of ['1f','2f','3f','5f']){
  const x=await mount({seconds,floor}),pets=x.f.visible().filter(a=>a.dataset.resident==='pet'),started=new Set();
  for(const pet of pets)assert.equal(pet.officePetFloor,floor,'entrance gesture armed on the visible floor');
  for(let t=0;t<100;t++){await x.advance(100);for(const pet of pets)if(pet.dataset.motion)started.add(pet.dataset.person)}
  for(const pet of pets)assert.ok(started.has(pet.dataset.person),`${seconds} ${floor} ${pet.dataset.person}`);
  assert.deepEqual(x.writes,[]);
 }
});

test('round2: six-second gestures are staggered, use all four kinds and change existing atlas rows',async()=>{
 const x=await mount({seconds:72000}),r=x.f.context.HaniBuildingScene.residents,starts=new Map(),kinds=new Set(),previous=new Map();
 for(const id of petIds)previous.set(id,r.life(at('2026-11-06',72000),[{id,pet:true,pose:'sitting'}],false)[0].life?.key);
 for(let sec=72000;sec<72060;sec+=.1){
  for(const id of petIds){const p=r.life(at('2026-11-06',sec),[{id,pet:true,pose:'sitting'}],false)[0];
   if(p.life&&previous.get(id)!==p.life.key){previous.set(id,p.life.key);kinds.add(p.life.kind);const times=starts.get(id)||[];times.push(sec);starts.set(id,times)}
  }
 }
 assert.deepEqual([...kinds].sort(),['hop','sit-stand','turn','wag']);
 for(const times of starts.values()){assert.ok(times.length>=9);for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=4&&times[i]-times[i-1]<=8)}
 const all=[...starts].flatMap(([id,times])=>times.map(t=>({id,t}))).sort((a,b)=>a.t-b.t);
 for(let i=1;i<all.length;i++)assert.ok(all[i].t-all[i-1].t>=1.9,'different pets start two seconds apart');
 const pet=x.f.visible().find(a=>a.dataset.resident==='pet'),sprite=pet.querySelector('.hani-office-sprite'),frames=new Map();
 for(let t=0;t<300;t++){await x.advance(100);if(pet.dataset.life==='turn')frames.set(pet.dataset.facing,sprite.style.backgroundPosition)}
 assert.equal(frames.size,2,'left and right atlas frames both rendered');assert.equal(new Set(frames.values()).size,2);
 assert.deepEqual(x.writes,[]);
 const css=read('hani-office-live.css');assert.match(css,/@keyframes hani-pet-hop\{[^\n]+translateY\(-3px\)/);assert.match(css,/@keyframes hani-pet-wag\{[^\n]+rotate\(7deg\)/);
});

test('round2: walks start within the new windows and every sampled body stays on existing safe routes',async()=>{
 const x=await mount(),model=x.f.context.HaniBuildingScene,r=model.residents;
 for(const day of ['2026-11-02','2026-11-06','2026-11-07'])for(const start of [36000,46800,72000]){
  const starts=new Map(petIds.map(id=>[id,[]])),last=new Map();
  for(let t=0;t<=140;t+=.2){
   const now=at(day,start+t),states=r.snapshot(now,null,true,false,false);
   for(const pet of states.filter(p=>p.pet)){
    assert.equal(r.safe(pet.floor,pet.point,pet.position),true,pet.id+' safe whole body');
    assert.ok(r.people.find(p=>p.id===pet.id).places[pet.floor],pet.id+' stays on an allowed floor');
    const beat=r.rhythm(pet.id,day,start+t).beat;
    if(pet.walking&&last.get(pet.id)!==beat){starts.get(pet.id).push(t);last.set(pet.id,beat)}
   }
  }
  for(const id of petIds){const times=starts.get(id),max=id==='pet-rabbit'?45:30,min=id==='pet-rabbit'?25:15;
   assert.ok(times.length>=2,id+' repeated walks');assert.ok(times[0]<=max,id+' first walk');
   for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=min-.21&&times[i]-times[i-1]<=max+.21,`${id} interval ${times[i]-times[i-1]}`);
   const rhythm=r.rhythm(id,day,start);assert.ok(rhythm.period>=min&&rhythm.period<=max);
  }
 }
 assert.deepEqual(x.writes,[]);
});

test('round2: reduced motion fixes pets for a full minute and hidden floors retain no advancing state',async()=>{
 for(const [floor,seconds] of [['1f',46800],['2f',36000],['3f',36000],['5f',46800]]){
  const x=await mount({floor,seconds,reduced:true}),pets=x.f.visible().filter(a=>a.dataset.resident==='pet'),positions=pets.map(a=>plain(a.officePosition));
  for(let i=0;i<60;i++){await x.advance(1000);pets.forEach((pet,n)=>{assert.deepEqual(plain(pet.officePosition),positions[n]);assert.equal(pet.dataset.life,undefined);assert.equal(pet.dataset.motion,undefined);assert.equal(pet.dataset.walking,'false');assert.equal(pet.style['--pet-bob'],'0px')})}
  assert.deepEqual(x.writes,[]);
 }
 const x=await mount(),pets=x.f.ids.get('haniOfficeActors').children.filter(a=>a.dataset.resident==='pet');
 const hidden=pets.filter(a=>a.hidden),before=hidden.map(a=>a.officeResidentState);
 for(let i=0;i<100;i++)await x.advance(100);hidden.forEach((a,i)=>assert.equal(a.officeResidentState,before[i]));
 x.f.hide();const states=pets.map(a=>a.officeResidentState);for(let i=0;i<100;i++)await x.advance(100);pets.forEach((a,i)=>assert.equal(a.officeResidentState,states[i]));assert.equal(x.f.root.dataset.paused,'true');assert.deepEqual(x.writes,[]);
});

test('round2: all three pets are present for at least 95 percent of working-day samples',async()=>{
 const x=await mount(),model=x.f.context.HaniBuildingScene,r=model.residents;
 for(const day of ['2026-11-02','2026-11-06','2026-11-07']){
  const counts=Object.fromEntries(petIds.map(id=>[id,0]));let samples=0;
  for(let seconds=9*3600;seconds<18*3600;seconds+=60){samples++;const now=at(day,seconds),staff=model.snapshot(now,{chairmanPresent:false}),bytes=JSON.stringify(staff),pets=r.snapshot(now,staff).filter(p=>p.pet);
   assert.equal(JSON.stringify(staff),bytes,'resident snapshots do not mutate staff input');
   for(const pet of pets){counts[pet.id]++;assert.equal(r.safe(pet.floor,pet.point,pet.position),true);if(pet.id==='pet-rabbit')assert.equal(pet.floor,seconds<43200?'3f':'1f')}
  }
  for(const id of petIds)assert.ok(counts[id]/samples>=.95,day+' '+id+' '+counts[id]+'/'+samples);
 }
 assert.deepEqual(x.writes,[]);
});

test('round2: staff scheduler and snapshot source bytes stay identical; timer/listener/node/storage paths do not increase',()=>{
 const before=read('artifacts/office-pets-bubble/round2-before-source.txt'),after=read('hani-office-live.js');
 const section=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i);assert.ok(i>=0&&j>i);return s.slice(i,j)};
 for(const [a,b]of [['  function createScheduler(','  // Read-only label geometry'],['  function snapshot(now=new Date()','  function profile('],['  function createPresence(','/* Read-only Living Office.']])assert.equal(section(after,a,b),section(before,a,b),a);
 for(const regex of [/document\.addEventListener\(/g,/addEventListener\(/g,/createElement\(/g,/setInterval\(/g,/setTimeout\(/g,/requestAnimationFrame\(/g,/\bfetch\(/g])assert.equal([...after.matchAll(regex)].length,[...before.matchAll(regex)].length,regex.toString());
 assert.doesNotMatch(after,/localStorage|sessionStorage|supabase|\bsave\s*\(/);
});

test('round2: the existing label packer reserves the full pet gesture envelope at PC and phone scale',async()=>{
 for(const width of [390,1280]){
  const x=await mount({width,seconds:72000}),owner=x.f.context.HaniBuildingScene,captured=[];
  const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
  x.f.map.getBoundingClientRect=()=>rect(0,0,width,width*941/1672);
  for(const a of x.f.ids.get('haniOfficeActors').children){
   const height=Math.max(40,width*.068);a.getBoundingClientRect=()=>rect(parseFloat(a.style.left)*width/100-height/3,parseFloat(a.style.top)*width*941/167200-height,height*2/3,height);
   for(const n of a.querySelectorAll('*'))n.getBoundingClientRect=()=>rect(0,0,24,10);
  }
  x.f.context.HaniBuildingScene={...owner,labels:{...owner.labels,place(floor,groups,obstacles){captured.push(...groups);return owner.labels.place(floor,groups,obstacles)}}};
  x.f.click('1f');assert.ok(captured.some(g=>g.id==='pet-rabbit'));
  for(const g of captured){const actor=x.f.ids.get('haniOfficeActors').children.find(a=>a.dataset.person===g.id),base=owner.motion.stableSpriteBox(actor,owner.motion.stableActorBox(actor));
   if(actor.dataset.resident==='pet'){const pad=Math.max(4,base.height*.14);assert.equal(g.sprite.top,base.top-pad);assert.equal(g.sprite.width,base.width+2*pad);assert.ok(pad>=3,'hop clearance');assert.ok(pad>=base.height*Math.sin(7*Math.PI/180),'wiggle clearance')}
   else assert.deepEqual(plain(g.sprite),plain(base));
  }
  assert.deepEqual(x.writes,[]);
 }
});
