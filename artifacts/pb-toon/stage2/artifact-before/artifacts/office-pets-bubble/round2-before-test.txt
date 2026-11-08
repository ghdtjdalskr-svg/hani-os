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
