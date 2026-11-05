import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {at} from './hani-office-lively-fixture.mjs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const table=JSON.parse(read('assets/data/office-actions-221.json'));
const manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve()};
// Same mounted-owner loader and fake clock as hani-office-snack.test.mjs.
async function mount({width=390,reduced=false}={}){
 let clock=+at('2026-11-06',36000),next=0;const pending=new Map(),history=[],writes=[],views=[];
 const deny=(...args)=>{writes.push(args);throw Error('unexpected persistence')};
 const f=fixture('10:00',reduced,()=>true,table,{
  HaniOfficeV2Assets:{...assets,spritesV3:manifest},innerWidth:width,
  fetch:async url=>url.endsWith('/office-tap-lines-v1.json')?{ok:true,json:async()=>JSON.parse(read('assets/data/office-tap-lines-v1.json'))}:{ok:false},
  matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:width<=Number(q.match(/max-width:\s*(\d+)/)?.[1]||0),addEventListener(){}}),
  setTimeout(fn,ms){const t={id:++next,fn,ms,at:clock+ms};pending.set(t.id,t);history.push(t);return t.id},clearTimeout:id=>pending.delete(id),
  localStorage:{setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny},save:deny,showView:view=>views.push(view)
 });
 f.ids.set('app',{classList:{contains:()=>false}});f.context.window.HaniOfficePresence={chairman:'absent'};
 f.document.visibilityState='visible';f.setDateTime(new Date(clock).toISOString());f.click('1f');await flush();
 const panel=f.root.querySelector('.hani-office-character-bubble'),link=panel.querySelector('a'),close=panel.querySelector('.hani-office-bubble-close');
 const staff=()=>f.visible().filter(a=>!a.dataset.resident&&a.dataset.visitor!=='true'&&a.dataset.person!=='seongmin');
 const down=target=>f.document.events.pointerdown({target,pointerType:'touch',isPrimary:true});
 // Dispatch the touchstart and compatibility click after pointerdown; DOM doubles do not bubble.
 function tap(target){down(target);f.document.events.touchstart({target});const event={target,preventDefault(){this.defaultPrevented=true}};
  if(panel.contains(target)){if(target===link)link.events.click(event);panel.onclick?.(event)}
  else if(target.closest?.('.hani-office-actor'))f.ids.get('haniOfficeActors').events.click(event);
  else target.onclick?.(event);
 }
 async function advance(ms){clock+=ms;f.setDateTime(new Date(clock).toISOString());for(const t of [...pending.values()].sort((a,b)=>a.at-b.at))if(pending.has(t.id)&&t.at<=clock){pending.delete(t.id);t.fn()}f.timers.find(t=>t.ms===100).fn();await flush()}
 return {f,panel,link,close,staff,down,tap,advance,pending,history,writes,views,speaker:()=>f.visible().find(a=>a.dataset.speaking==='true')};
}

for(const width of [390,480,481,1280])for(const reduced of [false,true]){
 test(`bubble close: pointer/tap, profile, switch, Escape and expiry at ${width}px reduced=${reduced}`,async()=>{
  const x=await mount({width,reduced}),[a,b]=x.staff();assert.ok(a&&b);let reactions=0;for(const actor of x.staff())actor.officeReactions.request=()=>{reactions++};
  x.tap(a);await flush();assert.equal(x.panel.hidden,false);assert.equal(x.speaker(),a);
  x.down(x.f.map);assert.equal(x.panel.hidden,true,'touch pointerdown on map closes immediately');
  x.tap(a);x.down(x.f.tabs);assert.equal(x.panel.hidden,true,'outside map also closes');
  x.tap(a);x.tap(x.panel.querySelector('p'));assert.equal(x.panel.hidden,true,'bubble text tap closes');
  x.tap(a);x.tap(x.panel);assert.equal(x.panel.hidden,true,'bubble padding tap closes');
  x.tap(a);assert.ok(x.close);assert.equal(x.close.type,'button');assert.equal(x.close.textContent,'✕');assert.equal(x.close.getAttribute('aria-label'),'말풍선 닫기');x.tap(x.close);assert.equal(x.panel.hidden,true);
  x.tap(a);assert.equal(x.link.hidden,false);const href=x.link.href;x.tap(x.link);assert.equal(x.panel.hidden,false);assert.equal(x.link.href,href);assert.deepEqual(x.views,['organization/people/'+a.dataset.person]);
  const stale=x.history.at(-1);x.tap(b);await flush();assert.equal(x.speaker(),b);assert.ok(x.panel.querySelector('p').textContent.includes(b.dataset.name));stale.fn();assert.equal(x.panel.hidden,false);
  assert.equal(x.f.root.querySelectorAll('.hani-office-character-bubble').length,1);
  x.f.document.events.keydown({key:'Escape',target:x.f.map});assert.equal(x.panel.hidden,true,'Escape works outside actor focus');
  x.tap(a);const duration=width<=480?5000:3000;assert.equal(x.history.at(-1).ms,duration);await x.advance(duration-1);assert.equal(x.panel.hidden,false);await x.advance(1);assert.equal(x.panel.hidden,true);
  if(reduced)assert.equal(reactions,0,'reduced motion adds no tap reaction');assert.deepEqual(x.writes,[]);
 });
}

test('bubble close: phone timeout drops deferred speech; explicit dismiss defeats async replay and action end',async()=>{
 const x=await mount(),event=x.f.context.HaniBuildingScene.scheduler.plan('2026-10-21').find(e=>e.layer===2&&e.performEnd+1<18*3600&&e.performStart>11*3600);
 assert.ok(event);const instant=sec=>new Date(Date.parse('2026-10-21T00:00:00+09:00')+sec*1000).toISOString();
 x.f.setDateTime(instant((event.performStart+event.performEnd)/2));x.f.click(event.floors[0]);await flush();
 const actor=x.f.visible().find(a=>a.dataset.event===event.id);assert.ok(actor);x.tap(actor);await flush();
 assert.equal(x.history.at(-1).ms,5000);x.history.at(-1).fn();assert.equal(x.panel.hidden,true);
 x.f.setDateTime(instant(event.end+.01));x.f.timers.find(t=>t.ms===4200).fn();await flush();assert.equal(x.panel.hidden,true,'action end cannot reopen timed-out phone selection');
 x.tap(actor);x.down(x.f.map);await flush();assert.equal(x.panel.hidden,true,'late catalog continuation cannot reopen');
 assert.deepEqual(x.writes,[]);
});

test('bubble close: barista shares close/timer, switch, persistent controls and no writes',async()=>{
 for(const width of [390,1280]){
  const x=await mount({width}),barista=x.f.ids.get('haniOfficeBarista'),nodes=x.f.root.querySelectorAll('*');assert.equal(barista.hidden,false);
  let created=0;const create=x.f.document.createElement;x.f.document.createElement=(...args)=>{created++;return create(...args)};
  for(let i=0;i<5;i++){
   x.tap(barista);assert.equal(x.panel.hidden,false);assert.ok(x.panel.querySelector('p').textContent.includes('바리스타 이슬'));assert.equal(x.link.hidden,true);
   x.tap(x.close);assert.equal(x.panel.hidden,true);x.tap(barista);x.tap(x.panel);assert.equal(x.panel.hidden,true);
   x.tap(barista);x.down(x.f.map);assert.equal(x.panel.hidden,true);
   x.tap(barista);x.tap(x.staff()[0]);assert.equal(x.link.hidden,false);x.tap(barista);assert.equal(x.link.hidden,true);
   await x.advance(width<=480?5000:3000);assert.equal(x.panel.hidden,true);
  }
  assert.equal(created,0);assert.equal(x.f.root.querySelectorAll('.hani-office-bubble-close').length,1);assert.equal(x.panel.querySelector('.hani-office-bubble-close'),x.close);assert.deepEqual(x.f.root.querySelectorAll('*'),nodes);assert.deepEqual(x.writes,[]);
 }
});

test('bubble close: protected owner bytes, global listeners and timer allocations are unchanged',()=>{
 const source=read('hani-office-live.js'),before=read('artifacts/bubble-close/before-source.txt');
 assert.equal(source.slice(0,source.indexOf('/* Read-only Living Office.')),before.slice(0,before.indexOf('/* Read-only Living Office.')),'entire model including plan, blockPlan and snapshot');
 const baseline=JSON.parse(read('artifacts/cafe-barista/baseline.json'));
 for(const {name,start,end} of baseline.sections){const i=source.indexOf(start),j=source.indexOf(end,i),a=before.indexOf(start),b=before.indexOf(end,a);assert.ok(i>=0&&j>i,name);assert.equal(source.slice(i,j),before.slice(a,b),name)}
 for(const pattern of [/document\.addEventListener\(/g,/setInterval\(/g,/setTimeout\(/g])assert.equal([...source.matchAll(pattern)].length,[...before.matchAll(pattern)].length,pattern.toString());
 assert.doesNotMatch(source,/localStorage|sessionStorage|supabase|\.setItem\(|\.removeItem\(/);
 const css=read('hani-office-live.css');assert.match(css,/width:32px;height:32px;min-width:32px;min-height:32px/);assert.match(css,/@media\(max-width:480px\)/);assert.match(css,/-webkit-line-clamp:2/);assert.match(css,/\.hani-office-character-bubble\[hidden\]\{display:none\}/);assert.ok(css.lastIndexOf('.hani-office-character-bubble[hidden]{display:none}')>css.lastIndexOf('.hani-office-character-bubble[data-zoom="true"]{display:flex}'),'hidden follows every zoom display variant');
});
