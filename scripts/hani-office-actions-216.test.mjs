import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {assets} from './hani-office-v2-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {runtimeTable} from './hani-office-actions-216-data.mjs';
import {assertResources} from './hani-office-place-assertions.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const table=JSON.parse(read('assets/data/office-actions-216.json')),catalog=JSON.parse(read('docs/design/office-actions-v1.3.json'));
const source=read('hani-office-live.js'),plain=x=>JSON.parse(JSON.stringify(x));
function scene(data=table){const c=vm.createContext({HaniOfficeActions216:data,HaniOfficeV2Assets:assets,document:{getElementById:()=>null},window:{}});vm.runInContext(source,c);return c.HaniBuildingScene;}
const api=scene(),scheduler=api.scheduler,replayScheduler=scene().scheduler,base=Date.parse('2026-10-19T00:00:00+09:00');
const at=(day,seconds)=>new Date(Date.parse(day+'T00:00:00+09:00')+seconds*1000);
const collision=(a,b)=>a.start<b.end&&b.start<a.end;

test('approved catalog projects exactly 98 core actions, 37 disabled, original family weights and frozen contract',()=>{
  assert.deepEqual(table,runtimeTable(catalog));assert.equal(table.actions.length,98);assert.equal(table.disabled.length,37);
  assert.ok(table.actions.every(a=>a.automaticReady&&!a.conditions.triggerIds.length&&!a.manualPreviewOnlyIn216));assert.ok(table.disabled.every(a=>a.automaticReady===false));
  assert.equal(catalog.frequencyFamilies.length,77);
  for(const f of table.families){const original=catalog.frequencyFamilies.find(x=>x.id===f.id);assert.deepEqual(f.memberActionIds,original.memberActionIds);assert.deepEqual(f.limits,original.limits);}
  for(const a of table.actions)assert.ok(read('docs/design/office-actions-v1.3.md').includes('`'+a.id+'`'));
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../data/hani-building/spatial-contract.json',import.meta.url))).digest('hex'),'d02426b44c49db169efebd782e110226fd1d719d016bc5912516753f3df8841d');
  assert.match(source,/fetch\('\.\/assets\/data\/office-actions-216\.json'\)/);
  assert.doesNotMatch(source,/localStorage|sessionStorage|supabase|Math\.random/);
});

test('120 deterministic simulated days enforce all shared caps, cooldowns, parent eligibility and atomic path reservations',()=>{
  const seen=new Set(),lastAcrossDays=new Map();let groupTotal=0;
  for(let n=0;n<120;n++){
    const day=new Date(base+n*86400000+32400000).toISOString().slice(0,10),plan=scheduler.plan(day,{chairmanPresent:true});
    assert.deepEqual(plain(plan),plain(replayScheduler.plan(day,{chairmanPresent:true})));
    if([0,6].includes(new Date(day).getUTCDay())){assert.equal(plan.length,0);continue;}
    const counts=new Map(),lastFamily=new Map(),lastRest=new Map(),lastMove=new Map();let teachers=0,selfies=0;
    assert.ok(plan.filter(e=>e.layer===3).length<=3);groupTotal+=plan.filter(e=>e.layer===3).length;
    for(let i=0;i<plan.length;i++){
      const e=plan[i],a=table.actions.find(a=>a.id===e.actionId),f=table.families.find(f=>f.id===e.familyId),key=f.id+'|'+(f.limits.scope==='scene'?'scene':e.people[0].id);
      seen.add(a.id);assert.ok(a.automaticReady);assert.ok(e.duration<=f.durationCeilingSeconds);assert.ok(e.end>e.start);
      const seconds=t=>Number(t.slice(0,2))*3600+Number(t.slice(3))*60;
      assert.ok(a.conditions.timeWindows.some(([start,end])=>e.start>=seconds(start)&&e.end<=seconds(end)),'entire excursion must fit the selected action window');
      counts.set(key,(counts.get(key)||0)+1);assert.ok(counts.get(key)<=f.limits.maxPerDay);
      assert.ok(e.start-(lastFamily.get(key)??-Infinity)>=f.limits.cooldownSeconds);lastFamily.set(key,e.start);
      const absolute=Date.parse(day)/1000+e.start;assert.ok(absolute-(lastAcrossDays.get(key)??-Infinity)>=f.limits.cooldownSeconds,key);lastAcrossDays.set(key,absolute);
      if(e.layer===3)assert.equal(f.limits.probabilityPerDay,.15);
      for(const p of e.people){
        assert.ok(!['daon','yoonseul'].includes(p.id));
        if(e.personalNonWork){assert.ok(e.start-(lastRest.get(p.id)??-Infinity)>=2700);lastRest.set(p.id,e.end);}
        if(api.anchors.get(p.seat.anchor).floor!==p.home.floor){assert.ok(e.start-(lastMove.get(p.id)??-Infinity)>=5400);lastMove.set(p.id,e.end);}
        for(const route of [p.outbound,p.inbound])for(let j=1;j<route.length;j++)assert.ok(assets.canon.edges.some(edge=>edge.kind!=='stairs'&&(edge.from===route[j-1].id&&edge.to===route[j].id||edge.bidirectional&&edge.to===route[j-1].id&&edge.from===route[j].id)));
      }
      for(const other of plan.slice(0,i))if(collision(e,other)){
        assert.ok(!other.people.some(p=>e.people.some(q=>q.id===p.id)),'actor double-booked');
        assertResources(scheduler,e,other);
        if(e.layer===other.layer&&[2,3].includes(e.layer))assert.ok(!e.floors.some(f=>other.floors.includes(f)),'floor cap');
      }
      if(table.rules.hinaBalance.teacherActionIds.includes(a.id))teachers++;
      if(table.rules.hinaBalance.selfieActionIds.includes(a.id)){selfies++;assert.ok(teachers>=selfies);}
      const middle=at(day,(e.performStart+e.performEnd)/2),s=scheduler.snapshot(middle,{chairmanPresent:true});
      for(const person of e.people){const rendered=s.entries.find(p=>p.id===person.id);assert.equal(rendered.actionId,a.id);assert.equal(rendered.seat.anchor,person.seat.anchor);assert.ok(rendered.line);}
      const spots=s.entries.map(p=>p.floor+'|'+(p.position||[p.seat.x,p.seat.y]).map(x=>Math.round(x*1000)).join(','));assert.equal(new Set(spots).size,spots.length,'two characters share a visual spot');
    }
  }
  assert.ok(groupTotal>50,'group gates are active');assert.ok(seen.size>=85,'variants are reachable without frequency inflation');
  fs.mkdirSync(new URL('../artifacts/l216-2/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../artifacts/l216-2/simulation-status.json',import.meta.url),JSON.stringify({days:120,groupTotal,exposedActionCount:seen.size,missingActionIds:table.actions.filter(a=>a.id!=='base-work'&&!seen.has(a.id)).map(a=>a.id),result:'pass'},null,2));
});

test('KST seed, day boundaries, chairman identity/presence, MIR limits and independent daily 15% gates',()=>{
  assert.equal(scheduler.seed('hello'),1335831723);
  assert.equal(scheduler.snapshot('2026-10-18T15:00:00Z').day,'2026-10-19');
  assert.equal(scheduler.snapshot('2026-10-18T14:59:59Z').day,'2026-10-18');
  const ordinary=scheduler.snapshot('2026-10-19T09:00:00+09:00');assert.ok(ordinary.entries.every(p=>p.id!=='seongmin'));
  const chairman=scheduler.snapshot('2026-10-19T09:00:00+09:00',{chairmanPresent:true});assert.ok(chairman.entries.some(p=>p.id==='seongmin'&&p.seat.anchor==='ceo-reserved'));
  assert.equal(scheduler.identity.seongmin.entity,'human_user');assert.equal(scheduler.identity.seongmin.officeVisual,'ceo_frog');
  assert.equal(api.homeSeat('seongmin'),undefined,'human identity never becomes a registered AI staff member');
  for(let n=0;n<60;n++){const day=new Date(base+n*86400000+32400000).toISOString().slice(0,10),plan=scheduler.plan(day);assert.ok(plan.filter(e=>e.actionId==='sig-mir-1').length<=2);for(const e of plan.filter(e=>e.layer===3))assert.ok(scheduler.seed(day+'|'+e.familyId)/4294967296<.15);}
});

test('every one of the 97 scheduled core rows is reachable; base-work remains the default 98th row',()=>{
  const seen=new Set();let days=0;
  for(;days<208&&seen.size<97;days++){
    const day=new Date(base+days*86400000+32400000).toISOString().slice(0,10);
    for(const event of scheduler.plan(day,{chairmanPresent:true}))seen.add(event.actionId);
  }
  assert.deepEqual(table.actions.filter(a=>a.id!=='base-work'&&!seen.has(a.id)).map(a=>a.id),[]);
  assert.equal(scheduler.actions.get('base-work').frequencyFamilyId,'base-work');
  fs.writeFileSync(new URL('../artifacts/l216-2/reachability-status.json',import.meta.url),JSON.stringify({days,scheduledRows:seen.size,defaultState:'base-work',result:'pass'},null,2));
});

test('blocked parents/slots never rescue with a variant; disabled and data-triggered rows cannot execute',()=>{
  const data=structuredClone(table);data.actions.forEach(a=>{if(a.id!=='base-work')a.automaticReady=false});
  assert.equal(scene(data).scheduler.plan('2026-10-19').length,0);
  const actions=structuredClone(table);actions.actions.forEach(a=>a.conditions.triggerIds=['not_approved']);assert.equal(scene(actions).scheduler.plan('2026-10-19').length,0);
  const missing=['hani','yuna','jieun','haru','naeun','hina','minji','sooyeon','sua','seoyun','dohyun','serin','yuri','arin','gaeun','taeo','mir'];
  for(const person of missing){const plan=scheduler.plan('2026-10-19',{presentIds:missing.filter(id=>id!==person)});for(const e of plan){const family=table.families.find(f=>f.id===e.familyId);if(family.limits.scope==='scene')assert.ok(!family.parent.participants.includes(person),'missing parent participant must block variant');assert.ok(e.people.every(p=>p.id!==person));}}
});

test('random access snapshots skip missed events; summoned and cancelled events stay out; reduced motion is static',()=>{
  const day='2026-10-19',event=scheduler.plan(day).find(e=>e.people.some(p=>p.out.length)&&e.duration>10),mid=at(day,(event.performStart+event.performEnd)/2);
  assert.ok(event);
  const expected=scheduler.snapshot(mid);scheduler.snapshot(at(day,event.end+3600));assert.deepEqual(plain(scheduler.snapshot(mid)),plain(expected));
  const summoned=scheduler.snapshot(mid,{summoned:[event.people[0].id]});assert.ok(summoned.events.every(e=>e.id!==event.id));assert.ok(summoned.entries.every(p=>p.id!==event.people[0].id));
  const cancelled=scheduler.snapshot(mid,{cancelled:new Set([event.id])});assert.ok(cancelled.events.every(e=>e.id!==event.id));
  const moving=at(day,event.people.find(p=>p.out.length).out[0].start+.01),staticA=scheduler.snapshot(moving,{reducedMotion:true}),staticB=scheduler.snapshot(at(day,event.performStart+1),{reducedMotion:true});
  for(const p of event.people){const a=staticA.entries.find(e=>e.id===p.id),b=staticB.entries.find(e=>e.id===p.id);assert.equal(a.walking,false);assert.equal(a.position,null);assert.equal(b.seat.anchor,p.seat.anchor);assert.ok(!a.pose.startsWith('walk'));
    if(p.out.length){assert.equal(a.seat.anchor,p.home.anchorId,'reduced motion stays home until the reserved arrival');assert.equal(a.state,'GOING');assert.match(a.line,/가는 중$/)}
    else{assert.equal(a.seat.anchor,b.seat.anchor);assert.equal(a.line,b.line)}
  }
});

test('actual renderer uses persistent actor/prop/bubble slots, tap/keyboard/profile, visible-only motion and case priority',async()=>{
  const f=fixture('09:00',false,()=>true,table),nodes=[...f.ids.get('haniOfficeActors').children],day='2026-10-19';
  assert.equal(nodes.length,19);assert.equal(nodes.find(a=>a.dataset.person==='seongmin').hidden,true);assert.ok(nodes.some(a=>a.dataset.person==='visitor'),'one persistent 1F guest slot (lively-3)');
  const e=f.context.HaniBuildingScene.scheduler.plan(day).find(e=>e.layer===3),time=at(day,(e.performStart+e.performEnd)/2);
  f.setDateTime(time);f.click(e.floors[0]);const actor=f.visible().find(a=>a.dataset.action===e.actionId);assert.ok(actor);assert.ok(actor.querySelector('.hani-office-prop').textContent);
  f.ids.get('haniOfficeActors').events.click({target:actor});const bubble=f.root.querySelector('.hani-office-character-bubble');assert.equal(bubble.hidden,false);assert.ok(bubble.querySelector('p').textContent.includes(actor.dataset.line));assert.equal(bubble.querySelector('a').textContent,'프로필 ↗');
  let view=null;f.context.showView=id=>{view=id};bubble.querySelector('a').events.click({preventDefault(){}});assert.equal(view,'organization/people/'+actor.dataset.person);assert.equal(bubble.querySelector('a').href,'#'+view);
  f.ids.get('haniOfficeActors').events.keydown({key:'Escape',target:actor});assert.equal(bubble.hidden,true);
  f.hide();const previous=actor.style.left;f.setDateTime(at(day,e.end+60));f.timers.find(t=>t.ms===100).fn();assert.equal(actor.style.left,previous);f.show();assert.ok(f.visible().every(a=>a.dataset.action!==e.actionId));
  f.context.window.haniOfficeLiveUpdate({case:{id:'216',title:'실제 안건'},reviews:[{agent_key:'JIEUN',review_round:1,summary:'검토'}]});
  // Existing meeting animation tests cover route completion; reduced mode completes immediately.
  const reduced=fixture('09:00',true,()=>true,table);reduced.setDateTime('2026-10-19T09:00:00+09:00');reduced.click('4f');reduced.context.window.haniOfficeLiveUpdate({case:{id:'216'},reviews:[]});await reduced.ids.get('haniOfficeMeetingOpen').events.click();assert.ok(reduced.visible().every(a=>a.dataset.action==='agent-case'));
  // Time advances during a real meeting. Missed decorative scenes must never resume.
  reduced.setDateTime(time);await reduced.ids.get('haniOfficeReturn').events.click();reduced.click(e.floors[0]);assert.ok(reduced.visible().every(a=>a.dataset.action!==e.actionId));
  for(const floor of ['1f','2f','3f','4f','5f'])f.click(floor);assert.deepEqual(f.ids.get('haniOfficeActors').children,nodes);assert.equal(f.timers.length,2);
});

test('literal runtime fetch executes and an offline table settles into safe base work',async()=>{
  for(const ok of [true,false]){
    const calls=[],c=vm.createContext({HaniOfficeV2Assets:assets,window:{},document:{getElementById:()=>null},fetch:async url=>{calls.push(url);if(!ok)throw Error('offline');return {ok:true,json:async()=>table}}});
    await vm.runInContext(source,c);assert.deepEqual(calls,['./assets/data/office-actions-221.json','./assets/data/office-actions-216.json']);
    assert.equal(Boolean(c.HaniBuildingScene.scheduler),ok);assert.ok(c.HaniBuildingScene.snapshot('2026-10-19T09:00:00+09:00').floors.flatMap(f=>f.people).every(p=>p.actionId==='base-work'));
  }
});

test('canonical animation samples the reserved path, pauses other floors, and snaps on a motion preference change',()=>{
  const moves=l=>api.anchors.get(l.from).floor===api.anchors.get(l.to).floor&&l.end-l.start>.4&&(api.art.anchors[l.from].x!==api.art.anchors[l.to].x||api.art.anchors[l.from].y!==api.art.anchors[l.to].y);
  const day='2026-10-19',f=fixture('09:00',false,()=>true,table),e=f.context.HaniBuildingScene.scheduler.plan(day).find(e=>e.people.some(p=>p.out.some(moves)));
  const person=e.people.find(p=>p.out.some(moves)),leg=person.out.find(moves),floor=api.anchors.get(leg.from).floor;
  f.setDateTime(at(day,leg.start+.1));f.click(floor);const actor=f.visible().find(a=>a.dataset.person===person.id),before=[actor.style.left,actor.style.top],timer=f.timers.find(t=>t.ms===100);
  f.setDateTime(at(day,leg.start+.3));timer.fn();assert.notDeepEqual([actor.style.left,actor.style.top],before);assert.match(actor.dataset.pose,/walk-/);
  f.click(floor==='1f'?'4f':'1f');const paused=[actor.style.left,actor.style.top];f.setDateTime(at(day,leg.start+.4));timer.fn();assert.deepEqual([actor.style.left,actor.style.top],paused);
  f.click(floor);f.setReduced(true);assert.ok(!actor.dataset.pose.startsWith('walk'));const snapped=[actor.style.left,actor.style.top];f.setDateTime(at(day,leg.start+.5));timer.fn();assert.deepEqual([actor.style.left,actor.style.top],snapped);
  f.context.window.HaniOfficePresence={chairman:'active'};f.setDateTime('2026-10-19T09:00:00+09:00');f.click('4f');const chairman=f.visible().find(a=>a.dataset.person==='seongmin');assert.ok(chairman);f.context.window.HaniOfficePresence={chairman:'absent'};f.click('4f');assert.ok(f.visible().every(a=>a.dataset.person!=='seongmin'));
});
