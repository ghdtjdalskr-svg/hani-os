// Exercise the mounted office owner, existing actor/roster events and fake clock.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {restoreBubblePlace278Source} from './hani-office-chairman-patrol-278-source.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';

const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve()};
async function setup({reduced=false,hidden=false,locked=false,table=null,environment={},transform=s=>s}={}){
  let next=0;const pending=new Map(),history=[];
  const f=fixture('10:00',reduced,null,table,{
    setTimeout(fn,ms){const timer={id:++next,fn,ms};pending.set(timer.id,timer);history.push(timer);return timer.id},
    clearTimeout(id){pending.delete(id)},...environment
  },transform);
  let lock=locked;
  f.ids.set('app',{classList:{contains:()=>lock}});
  f.document.hidden=hidden;f.document.visibilityState=hidden?'hidden':'visible';
  await flush();
  const panel=f.root.querySelector('.hani-office-character-bubble');
  const icons=(values=['💬','📱'])=>{
    const visible=f.visible();
    for(const [i,a] of visible.entries()){
      a.officeTravel=null;a.dataset.walking='false';a.dataset.pose='sitting';
      a.querySelector('.hani-office-prop').textContent=values[i]||'';
    }
    return visible;
  };
  icons();
  const run=ms=>{const timers=[...pending.values()].filter(t=>t.ms===ms);for(const t of timers){pending.delete(t.id);t.fn()}return timers.length};
  const tap=actor=>f.ids.get('haniOfficeActors').events.click({target:actor});
  const speaker=()=>f.visible().find(a=>a.dataset.speaking==='true');
  return {f,panel,pending,history,icons,run,tap,speaker,lock:value=>{lock=value}};
}

test('floor bubble: entry waits for rendered floor, opens once and closes through existing path after 4s',async()=>{
  const x=await setup();assert.equal(x.panel.hidden,true);assert.equal(x.pending.size,1);
  assert.equal(x.run(450),1);assert.equal(x.panel.hidden,false);assert.ok(x.speaker());
  assert.equal(x.pending.size,1);assert.equal(x.run(450),0);
  assert.equal(x.run(4000),1);assert.equal(x.panel.hidden,true);assert.equal(x.speaker(),undefined);
  assert.equal(x.pending.size,0);
});

test('floor bubble: no nonempty head icon means no bubble',async()=>{
  const x=await setup();x.icons([]);x.run(450);assert.equal(x.panel.hidden,true);assert.equal(x.pending.size,0);
});

test('floor bubble: day/floor selection is deterministic and prefers conversation/phone icons',async()=>{
  const a=await setup(),b=await setup();
  a.icons(['☕','📱','💬','☕']);b.icons(['☕','📱','💬','☕']);
  a.run(450);b.run(450);
  assert.equal(a.speaker().dataset.person,b.speaker().dataset.person);
  assert.ok(['💬','📱'].includes(a.speaker().querySelector('.hani-office-prop').textContent));
  const c=await setup();c.icons(['☕']);c.run(450);assert.equal(c.speaker(),c.f.visible()[0]);
});

test('floor bubble: same floor remains quiet for 60s and is eligible afterwards',async()=>{
  const x=await setup();x.run(450);x.run(4000);
  x.f.setTime('10:00');x.f.click('4f');await flush();x.icons();
  assert.equal(x.run(450),0);assert.equal(x.panel.hidden,true);
  x.f.setTime('10:01');x.f.click('4f');await flush();x.icons();
  assert.equal(x.run(450),1);assert.equal(x.panel.hidden,false);
});

test('floor bubble: tapping before delay cancels auto; tapping an auto bubble replaces it without hiding',async()=>{
  const x=await setup(),actor=x.f.visible()[0],delay=x.history.find(t=>t.ms===450);
  x.tap(actor);assert.equal(x.pending.size,1);delay.fn();assert.equal(x.speaker(),actor);
  assert.equal(x.history.some(t=>t.ms===4000),false);
  const y=await setup();y.run(450);const stale=y.history.find(t=>t.ms===4000);
  const target=y.f.visible().find(a=>a!==y.speaker());
  let hidden=y.panel.hidden,hides=0;
  Object.defineProperty(y.panel,'hidden',{get:()=>hidden,set:value=>{if(value)hides++;hidden=value}});
  y.tap(target);assert.equal(hides,0);assert.equal(y.speaker(),target);assert.equal(y.pending.size,1);
  stale.fn();assert.equal(y.panel.hidden,false);assert.equal(y.speaker(),target);
  y.run(3000);assert.equal(y.panel.hidden,true);
});

test('floor bubble: recent roster tap suppresses floor entry and existing bubble is retained',async()=>{
  const x=await setup();const actor=x.f.visible()[0];actor.officeRow.events.click();
  x.f.show();await flush();x.run(450);assert.equal(x.speaker(),actor);
  x.f.click('3f');await flush();x.icons();assert.equal(x.run(450),0);assert.equal(x.panel.hidden,true);
});

test('floor bubble: reduced motion, hidden tab and login lock stay quiet',async()=>{
  for(const options of [{reduced:true},{hidden:true},{locked:true}]){
    const x=await setup(options);x.run(450);assert.equal(x.panel.hidden,true,JSON.stringify(options));
  }
  for(const mode of ['reduced','hidden','locked']){
    const x=await setup();
    if(mode==='reduced')x.f.setReduced(true);
    if(mode==='hidden')x.f.document.hidden=true;
    if(mode==='locked')x.lock(true);
    x.run(450);assert.equal(x.panel.hidden,true,mode+' rechecked at deadline');
  }
});

test('floor bubble: walking and travelling people are excluded even with preferred icons',async()=>{
  const x=await setup(),actors=x.icons(['💬','📱','☕','💬']);
  actors[0].dataset.walking='true';actors[1].officeTravel={};actors[3].dataset.pose='walk-a';
  x.run(450);assert.equal(x.speaker(),actors[2]);
  const y=await setup();for(const a of y.icons(['💬','📱','💬','📱']))a.dataset.walking='true';
  y.run(450);assert.equal(y.panel.hidden,true);
});

test('floor bubble: floor switch clears delay/close and stale callbacks cannot close the next bubble',async()=>{
  const x=await setup(),old=x.history.find(t=>t.ms===450);
  x.f.click('3f');await flush();x.icons();assert.equal(x.pending.size,1);
  old.fn();assert.equal(x.panel.hidden,true);x.run(450);assert.equal(x.panel.hidden,false);
  const close=x.history.find(t=>t.ms===4000);x.f.click('2f');await flush();x.icons();
  assert.equal(x.pending.size,1);x.run(450);close.fn();assert.equal(x.panel.hidden,false);
});

test('floor bubble: leaving and reentering office uses the existing visibility owner',async()=>{
  const x=await setup();x.f.hide();assert.equal(x.pending.size,0);
  x.f.show();await flush();x.icons();assert.equal(x.run(450),1);assert.equal(x.panel.hidden,false);
});

test('floor bubble: a slow floor image must commit before the entry delay is armed',async()=>{
  const loads=[];class Image{set src(value){loads.push(()=>this.onload())}}
  const x=await setup({environment:{Image}});assert.equal(x.pending.size,0);assert.equal(x.panel.hidden,true);
  for(const done of loads.splice(0))done();await flush();
  assert.equal(x.pending.size,1);x.run(450);assert.equal(x.panel.hidden,false);
});

test('floor bubble: real scheduler entries and renderer head icons feed the same selection path',async()=>{
  const table=JSON.parse(fs.readFileSync(new URL('../assets/data/office-actions-221.json',import.meta.url),'utf8'));
  const x=await setup({table}),s=x.f.context.HaniBuildingScene.scheduler,day='2026-11-02';
  const event=s.plan(day,{chairmanPresent:false}).find(e=>e.layer===2&&e.performEnd>e.performStart);
  assert.ok(event);const now=new Date(Date.parse(day+'T00:00:00+09:00')+(event.performStart+event.performEnd)*500);
  x.f.setDateTime(now.toISOString());x.f.click(event.floors[0]);await flush();
  const eligible=x.f.visible().filter(a=>a.dataset.walking!=='true'&&!a.officeTravel&&!a.dataset.pose?.startsWith('walk')&&a.querySelector('.hani-office-prop').textContent.trim());
  assert.ok(eligible.length,'real rendered stationary icons');x.run(450);
  assert.ok(eligible.includes(x.speaker()));assert.equal(x.panel.hidden,false);
});

// Exercise the canonical fit function, including its read-free moving-speaker path.
const currentSource=fs.readFileSync('hani-office-live.js','utf8'),baselineSource=restoreBubblePlace278Source(currentSource);
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
function placement(source,{phone=false,box=rect(12,20,34,50),bubbleSize=[260,64]}={}){
 let reads=0;const person={officePosition:[8,10],officeBubbleBox:{left:4,right:100,top:8,bottom:106},getBoundingClientRect(){reads++;return box}},actorBubble={hidden:false,dataset:{},style:{setProperty(){}},getBoundingClientRect(){reads++;return rect(0,0,...bubbleSize)}},floor=rect(0,0,phone?390:1000,phone?220:562.5);
 const fn=source.slice(source.indexOf('  function fitBubble('),source.indexOf('  function closeBubble('));
 const fit=vm.runInNewContext(fn+';fitBubble',{actorBubble,bubblePerson:'speaker',actors:new Map([['speaker',person]]),map:{getBoundingClientRect(){reads++;return floor}},building:{motion:{stableActorBox:a=>a.getBoundingClientRect()}},matchMedia:()=>({matches:phone})});
 fit();return {fit,person,actorBubble,floor,reads:()=>reads};
}
test('PC upper-edge automatic bubble flips below the full speaker sprite/name/status envelope and clamps left/right',()=>{
 for(const x of [0,12,960]){
  const p=placement(currentSource,{box:rect(x,20,34,50)}),b=p.actorBubble;
  assert.equal(Number.parseFloat(b.style.top),112);assert.ok(Number.parseFloat(b.style.top)>=p.person.officeBubbleBox.bottom+6);
  assert.ok(Number.parseFloat(b.style.left)>=4);assert.ok(Number.parseFloat(b.style.left)+260<=p.floor.width-4);
 }
 const p=placement(currentSource);p.person.officePosition=[8,60];const reads=p.reads();p.fit(true);
 assert.equal(p.reads(),reads,'moving frame never reads layout');assert.ok(Number.parseFloat(p.actorBubble.style.top)+64<=8+281.25-6,'moving speaker flips back above when room exists');
});
test('phone compact initial/follow positions exactly match the original owner at both boundaries',()=>{
 for(const x of [0,180,380])for(const y of [0,80,200]){
  const options={phone:true,box:rect(x,y,34,50),bubbleSize:[280,36]},a=placement(currentSource,options),b=placement(baselineSource,options);
  for(const dy of [0,-30,30]){a.person.officePosition=[12,10+dy];b.person.officePosition=[12,10+dy];if(dy){a.fit(true);b.fit(true)}assert.equal(a.actorBubble.style.left,b.actorBubble.style.left);assert.equal(a.actorBubble.style.top,b.actorBubble.style.top)}
 }
});
test('mounted automatic bubble reuses final packed speaker boxes with no new timer/listener/layout read sites',async()=>{
 const x=await setup({transform:s=>s.replace('  function fitBubble(', '  window.officeBubbleQA={fitBubble,fitStatusLabels};\n  function fitBubble(')});x.f.map.getBoundingClientRect=()=>rect(0,0,1000,562.5);x.panel.getBoundingClientRect=()=>rect(0,0,260,64);
 for(const [i,a]of x.f.ids.get('haniOfficeActors').children.entries()){
  // DOMRect geometry lives on prototype getters, so spreading it loses width/height.
  const nativeRect=(...args)=>Object.create(Object.defineProperties({},Object.fromEntries(Object.entries(rect(...args)).map(([k,v])=>[k,{get:()=>v}]))));
  a.getBoundingClientRect=()=>rect(15+i*28,12,30,48);a.querySelector('.hani-office-name').getBoundingClientRect=()=>nativeRect(5+i*28,2,54,18);a.querySelector('.hani-office-status').getBoundingClientRect=()=>nativeRect(5+i*28,60,64,18);
 }
 x.f.click('4f');x.icons();x.run(450);assert.equal(x.panel.hidden,false);const a=x.speaker(),box=a.officeBubbleBox;
 assert.ok(box);assert.ok(box.top<=12&&box.bottom>=60,JSON.stringify(box));assert.ok(Number.parseFloat(x.panel.style.top)>=box.bottom+6,'actual automatic floor bubble is below its packed speaker');
 a.getBoundingClientRect=()=>rect(15,0,30,48);x.f.context.window.officeBubbleQA.fitStatusLabels();assert.ok(Number.parseFloat(x.panel.style.top)>=a.officeBubbleBox.bottom+6,'later label commit refits the same cached slot');assert.equal(x.panel.style.width,'max-content','PC position changes cannot change shrink-to-fit wrapping');
 const section=s=>s.slice(s.indexOf('  function fitStatusLabels('),s.indexOf('  if(buildingChairmanSlot())people.push'));
 assert.equal((section(currentSource).match(/getBoundingClientRect/g)||[]).length,6);
 for(const re of [/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:localStorage|sessionStorage)\b/g,/\bsupabase\b/g,/getBoundingClientRect/g])assert.equal([...currentSource.matchAll(re)].length,[...baselineSource.matchAll(re)].length);
});
