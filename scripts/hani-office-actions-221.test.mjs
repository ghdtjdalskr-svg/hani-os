import test from 'node:test';
import {assertResources} from './hani-office-place-assertions.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {assets} from './hani-office-v2-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {nightTable} from './hani-office-actions-221-data.mjs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('hani-office-live.js'),table=JSON.parse(read('assets/data/office-actions-221.json')),old=JSON.parse(read('assets/data/office-actions-216.json'));
const plain=v=>JSON.parse(JSON.stringify(v));
function scene(instant='2026-10-20T10:00:00+09:00',data=table){
  class Clock extends Date{constructor(...args){super(...(args.length?args:[instant]))}static now(){return Date.parse(instant)}}
  const c=vm.createContext({Date:Clock,HaniOfficeV2Assets:assets,HaniOfficeActions221:data,document:{getElementById:()=>null},window:{}});
  vm.runInContext(source,c);return c.HaniBuildingScene;
}
const api=scene(),s=api.scheduler;
const at=(day,seconds)=>new Date(Date.parse(day+'T00:00:00+09:00')+seconds*1000);
const evidence=[];
test('221 preserves 98 released actions, adds 22, keeps disabled/identity/rest/movement budgets and reproduces exactly',()=>{
  assert.deepEqual(table,nightTable(old));assert.equal(table.schemaVersion,'office-actions-221-v1');
  assert.equal(table.actions.length,120);assert.equal(new Set(table.actions.map(a=>a.id)).size,120);
  assert.deepEqual(table.disabled,old.disabled);assert.deepEqual(table.people,old.people);assert.deepEqual(table.identity,old.identity);
  assert.deepEqual(table.rules.personalNonWork,old.rules.personalNonWork);assert.deepEqual(table.rules.floorChanging,old.rules.floorChanging);
  for(const a of old.actions){const row=table.actions.find(x=>x.id===a.id);assert.deepEqual(row.participants,a.participants);assert.deepEqual(row.places,a.places);assert.equal(row.frequencyFamilyId,a.frequencyFamilyId)}
  for(const f of old.families)assert.deepEqual(table.families.find(x=>x.id===f.id).limits,f.limits);
  assert.ok(table.actions.filter(a=>a.conditions.days==='매일').length>80);
  for(const a of table.actions.slice(98)){
    for(const p of a.places){assert.ok(api.anchors.has(p.anchorId));assert.equal(p.floor,api.anchors.get(p.anchorId).floor)}
    assert.equal(a.automaticReady,true);assert.deepEqual(a.conditions.triggerIds,[]);
    if(/ramen|coffee|nap|stretch|window|water|reading|bag|doodle/.test(a.id))assert.equal(a.personalNonWork,true,a.id);
  }
  assert.doesNotMatch(source,/localStorage|sessionStorage|supabase|Math\.random/);
});

for(const [day,time] of [['2026-10-20','10:00'],['2026-10-20','21:00'],['2026-10-21','00:30'],['2026-10-21','02:00'],['2026-10-24','15:00'],['2026-10-25','23:30']]){
  test(`fake clock ${day} ${time} KST: every occupied floor has an eligible visible action within 90s`,()=>{
    const now=day+'T'+time+':00+09:00',model=scene(now),snapshot=model.snapshot(),seconds=snapshot.seconds;
    assert.equal(snapshot.day,day);assert.equal(snapshot.minutes,Number(time.slice(0,2))*60+Number(time.slice(3)));
    const present=snapshot.entries.map(p=>p.id).sort();assert.equal(present.length,time==='02:00'?5:19);
    if(time==='02:00')assert.deepEqual(present,['dohyun','minji','mir','seoyun','yuna']);
    const checks=[];
    for(const floor of snapshot.floors.filter(f=>f.people.length)){
      const event=model.scheduler.plan(day).find(e=>e.floors.includes(floor.id)&&e.performEnd>seconds&&e.performStart<=seconds+90);
      assert.ok(event,`${floor.id}: no visible event within 90 seconds`);
      const when=Math.max(seconds,event.performStart+.01),visible=model.snapshot(at(day,when)).floors.find(f=>f.id===floor.id).visible;
      assert.ok(visible.some(p=>p.actionId===event.actionId&&p.emoji&&p.line));
      checks.push({floor:floor.id,action:event.actionId,delaySeconds:Math.max(0,event.performStart-seconds)});
    }
    evidence.push({day,time,present,checks});
  });
}

test('all scheduled actors/parents remain present for the entire excursion, no actor/anchor conflicts; rest and floor budgets hold',()=>{
  for(const day of ['2026-10-21','2026-10-24']){
    const plan=s.plan(day),active=[],lastRest=new Map(),lastMove=new Map(),floorTicks=new Map();
    assert.equal(new Set(plan.map(e=>e.id)).size,plan.length);
    for(const e of plan){
      assert.ok(e.start>=0&&e.end<=86400);assert.ok(e.people.every(p=>p.id!=='seongmin'));
      for(const p of e.people){
        for(const t of [e.start,e.end-.001,3600,7*3600])if(t>=e.start&&t<e.end)assert.ok(s.presentAt(p.id,t),day+' '+p.id);
        if(e.personalNonWork){assert.ok(e.start-(lastRest.get(p.id)??-Infinity)>=2700);lastRest.set(p.id,e.end)}
        if(api.anchors.get(p.seat.anchor).floor!==p.home.floor){assert.ok(e.start-(lastMove.get(p.id)??-Infinity)>=5400);lastMove.set(p.id,e.end)}
      }
      const family=table.families.find(f=>f.id===e.familyId);
      if(family.limits.scope==='scene')for(const id of family.parent.participants)assert.ok(s.presentAt(id,e.start)&&s.presentAt(id,e.end-.001));
      if(family.limits.cadenceSeconds){
        assert.equal(e.people.length,1);assert.equal(e.floors[0],family.limits.floor);
        const previous=floorTicks.get(e.familyId);if(previous!==undefined)assert.ok(e.start-previous>=30);floorTicks.set(e.familyId,e.start);
      }
      for(let i=active.length-1;i>=0;i--)if(active[i].end<=e.start)active.splice(i,1);
      for(const other of active){assert.ok(!other.people.some(p=>e.people.some(q=>p.id===q.id)));assertResources(s,e,other)}active.push(e);
    }
    // Sample real projections at departures, lounge switches, midnight and late night.
    for(const t of [0,3599.9,3600,6000,7200,25199.9,25200,64799.9,64800,86399.9]){
      const snap=s.snapshot(at(day,t));
      assert.ok(snap.events.every(e=>e.people.every(p=>snap.entries.some(q=>q.id===p.id))));
      const seats=snap.entries.filter(p=>!p.walking).map(p=>p.seat.anchor);assert.equal(new Set(seats).size,seats.length);
    }
  }
});

test('wrapped time windows, weekend-only/weekday-only/local day boundaries and exact 02:00 exclusion execute in the scheduler',()=>{
  const probe=structuredClone(table.actions.find(a=>a.id==='night-ramen'));
  probe.conditions={days:'매일',timeWindows:[['22:00','02:00']],triggerIds:[]};
  assert.deepEqual(plain(s.windows(probe,true)),[[0,7200],[79200,86400]]);
  assert.deepEqual(plain(s.windows(probe,false)),[[0,7200],[79200,86400]]);
  probe.conditions.days='주말';assert.deepEqual(plain(s.windows(probe,true)),[]);assert.equal(s.windows(probe,false).length,2);
  probe.conditions.days='평일';assert.equal(s.windows(probe,true).length,2);assert.deepEqual(plain(s.windows(probe,false)),[]);
  const data=structuredClone(table),action=data.actions.find(a=>a.id==='night-dev-code'),family=data.families.find(f=>f.id==='ambient-3f');
  data.families=[family];family.parent.conditions={days:'매일',timeWindows:[['22:00','02:00']],triggerIds:[]};family.memberActionIds=[action.id];action.conditions=structuredClone(family.parent.conditions);
  const scheduler=scene(undefined,data).scheduler,events=scheduler.plan('2026-10-21');
  assert.ok(events.some(e=>e.start<7200));assert.ok(events.some(e=>e.start>=79200));
  assert.ok(events.every(e=>e.end<=7200||e.start>=79200));
  const lastEarly=events.filter(e=>e.end<=7200).at(-1);assert.ok(lastEarly.start>7100);
  assert.ok(scheduler.snapshot(at('2026-10-21',lastEarly.performStart+.01)).events.length>0);
  assert.equal(scheduler.snapshot('2026-10-21T02:00:00+09:00').events.length,0);
  assert.equal(scheduler.snapshot('2026-10-21T21:59:59+09:00').events.length,0);
  assert.equal(scheduler.snapshot('2026-10-20T15:00:00Z').day,'2026-10-21');
});

test('floor cadence is shared, weekend lighter, deterministic, and late exclusions/empty presence/summons cancel atomically',()=>{
  const day='2026-10-21',plan=s.plan(day),replay=scene().scheduler.plan(day);assert.deepEqual(plain(plan),plain(replay));
  for(const [day,cadence] of [['2026-10-21',40],['2026-10-24',55]]){
    const times=s.plan(day).filter(e=>e.familyId==='ambient-3f'&&e.start>=7200&&e.start<10800).map(e=>e.start),gaps=times.slice(1).map((t,i)=>t-times[i]);
    assert.ok(times.length>=Math.floor(3600/cadence)-2);assert.ok(gaps.every(g=>g>=cadence-3&&g<=cadence+3));
  }
  assert.equal(s.plan(day,{presentIds:[]}).length,0);
  const subset=s.plan(day,{presentIds:['seoyun','dohyun']});assert.ok(subset.length);assert.ok(subset.every(e=>e.people.every(p=>['seoyun','dohyun'].includes(p.id))));
  const event=plan.find(e=>e.start>=6000&&e.familyId==='ambient-3f'),now=at(day,event.performStart+.01);
  const cancelled=s.snapshot(now,{cancelled:new Set([event.id])});assert.ok(cancelled.events.every(e=>e.id!==event.id));
  const summoned=s.snapshot(now,{summoned:[event.people[0].id]});assert.ok(summoned.events.every(e=>e.id!==event.id));
});

test('seven consecutive KST days including weekday/weekend transitions preserve family, rest and floor cooldowns across midnight',()=>{
  const scheduler=scene().scheduler,lastFamily=new Map(),lastRest=new Map(),lastMove=new Map();
  for(let n=0;n<7;n++){
    const day=new Date(Date.UTC(2026,9,20+n)).toISOString().slice(0,10);
    for(const e of scheduler.plan(day)){
      const f=table.families.find(f=>f.id===e.familyId),key=f.id+'|'+(f.limits.cadenceSeconds?'floor':f.limits.scope==='scene'?'scene':e.people[0].id),start=Date.parse(day)/1000+e.start,end=Date.parse(day)/1000+e.end;
      assert.ok(start-(lastFamily.get(key)??-Infinity)>=f.limits.cooldownSeconds,key);lastFamily.set(key,start);
      for(const p of e.people){
        if(e.personalNonWork){assert.ok(start-(lastRest.get(p.id)??-Infinity)>=2700,day+' '+p.id);lastRest.set(p.id,end)}
        if(api.anchors.get(p.seat.anchor).floor!==p.home.floor){assert.ok(start-(lastMove.get(p.id)??-Infinity)>=5400,day+' '+p.id);lastMove.set(p.id,end)}
      }
    }
  }
});

test('MIR stays virtual and standing; frog chairman acts only with explicit presence',()=>{
  const day='2026-10-21',plan=s.plan(day),mir=plan.filter(e=>e.people.some(p=>p.id==='mir'));
  assert.ok(mir.length>100);
  for(const e of mir){const a=s.actions.get(e.actionId);assert.equal(a.actorOverrides?.mir?.pose||a.performance.pose,'stand');assert.ok(!/^night-.*(ramen|coffee-chat|nap|stretch)/.test(a.id))}
  const e=mir.find(e=>e.start>6000&&e.actionId.startsWith('night-exec')),p=s.snapshot(at(day,e.performStart+.01)).entries.find(p=>p.id==='mir');
  assert.equal(p.pose,'standing');assert.ok(!/🍜|☕|🥤|🍽/.test(p.emoji));assert.match(p.line,/연결|별빛|조금 더/);
  const chair=scene().scheduler.plan(day,{chairmanPresent:true}).find(e=>e.people.some(p=>p.id==='seongmin'));
  assert.ok(chair);assert.ok(s.snapshot(at(day,chair.performStart+.01)).entries.every(p=>p.id!=='seongmin'));
  assert.ok(s.snapshot(at(day,chair.performStart+.01),{chairmanPresent:true}).entries.some(p=>p.id==='seongmin'));
  assert.equal(s.identity.seongmin.officeVisual,'ceo_frog');
});

test('real loader selects 221, rejects invalid schema/count/JSON and falls back to 216, then offline base-work',async()=>{
  const url221='./assets/data/office-actions-221.json',url216='./assets/data/office-actions-216.json';
  for(const mode of ['221','404','schema','short','oversized','json','offline']){
    const calls=[],c=vm.createContext({HaniOfficeV2Assets:assets,window:{},document:{getElementById:()=>null},fetch:async url=>{
      calls.push(url);if(mode==='offline')throw Error('offline');
      if(url===url216)return {ok:true,json:async()=>old};
      if(mode==='404')return {ok:false};
      return {ok:true,json:async()=>{if(mode==='json')throw Error('bad JSON');if(mode==='schema')return {...table,schemaVersion:'wrong'};if(mode==='short')return {...table,actions:table.actions.slice(0,1)};if(mode==='oversized')return {...table,actions:Array(301).fill(table.actions[0])};return table}};
    }});
    await vm.runInContext(source,c);
    assert.deepEqual(calls,mode==='221'?[url221]:[url221,url216]);
    assert.equal(c.HaniBuildingScene.scheduler?.actions.size,mode==='221'?120:mode==='offline'?undefined:98);
    if(mode==='offline')assert.ok(c.HaniBuildingScene.snapshot('2026-10-21T02:00:00+09:00').floors.flatMap(f=>f.people).every(p=>p.actionId==='base-work'));
    else if(mode!=='221')assert.equal(c.HaniBuildingScene.scheduler.plan('2026-10-24').length,0);
  }
});

test('actual renderer at 01:40 on 3F visibly updates the existing emoji/status slots within 90 seconds, no extra timer or actor',()=>{
  const f=fixture('01:40',false,()=>true,table),nodes=[...f.ids.get('haniOfficeActors').children],start=Date.parse('2026-10-21T01:40:00+09:00');
  f.setDateTime(start);f.click('3f');const frame=f.timers.find(t=>t.ms===100);let found;
  for(let seconds=0;seconds<=90;seconds++){
    f.setDateTime(start+seconds*1000);frame.fn();
    const actor=f.visible().find(a=>a.dataset.action!=='base-work'&&(a.dataset.emoji||a.dataset.walking==='true'));
    if(actor){assert.ok(actor.querySelector('.hani-office-status').textContent);assert.ok(actor.querySelector('.hani-office-activity-icon').textContent);found={seconds,person:actor.dataset.person,action:actor.dataset.action};break;}
  }
  assert.ok(found);assert.deepEqual(f.ids.get('haniOfficeActors').children,nodes);assert.equal(f.timers.length,2);
  const before=f.visible()[0].style.left;f.hide();f.setDateTime(start+90000);frame.fn();assert.equal(f.visible()[0].style.left,before);
  fs.mkdirSync(new URL('../artifacts/night-actions-221/',import.meta.url),{recursive:true});
  fs.writeFileSync(new URL('../artifacts/night-actions-221/targeted.json',import.meta.url),JSON.stringify({result:'pass',fakeClocks:evidence,renderer:found,scope:'actual owner with DOM doubles; pixels require browser'},null,2));
});
