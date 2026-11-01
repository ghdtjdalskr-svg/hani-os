// Exercise the mounted office owner, existing actor/roster events and fake clock.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './hani-building-206-engine.test.mjs';

const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve()};
async function setup({reduced=false,hidden=false,locked=false,table=null,environment={}}={}){
  let next=0;const pending=new Map(),history=[];
  const f=fixture('10:00',reduced,null,table,{
    setTimeout(fn,ms){const timer={id:++next,fn,ms};pending.set(timer.id,timer);history.push(timer);return timer.id},
    clearTimeout(id){pending.delete(id)},...environment
  });
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
