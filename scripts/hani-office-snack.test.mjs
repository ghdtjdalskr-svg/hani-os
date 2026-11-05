import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const table=JSON.parse(read('assets/data/office-actions-221.json'));
const manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const {scene}=loadScene(),day='2026-11-05';
const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve()};
async function mount({floor='3f',time=at(day,10*3600),reduced=false,width=1280,real=false,locked=false}={}){
 let clock=+time,next=0,lock=locked;const pending=new Map(),history=[],writes=[];
 const deny=(...args)=>{writes.push(args);throw Error('unexpected persistence')};
 const f=fixture('10:00',reduced,()=>true,real?table:null,{
  HaniOfficeV2Assets:{...assets,spritesV3:manifest},
  matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:width<=Number(q.match(/max-width:\s*(\d+)/)?.[1]||0),addEventListener(){}}),
  setTimeout(fn,ms){const t={id:++next,fn,ms,at:clock+ms};pending.set(t.id,t);history.push(t);return t.id},
  clearTimeout:id=>pending.delete(id),
  localStorage:{setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny},save:deny
 });
 f.ids.set('app',{classList:{contains:()=>lock}});f.context.window.HaniOfficePresence={chairman:'absent'};
 f.setDateTime(new Date(clock).toISOString());f.click(floor);await flush();
 const button=f.ids.get('haniOfficeSnack'),panel=f.root.querySelector('.hani-office-character-bubble');
 const all=()=>[...f.ids.get('haniOfficeActors').children];
 const stationary=a=>!a.hidden&&!a.dataset.resident&&a.dataset.visitor!=='true'&&a.dataset.person!=='seongmin'&&!a.officeTravel&&a.dataset.walking!=='true'&&!a.dataset.pose?.startsWith('walk')&&!['GOING','RETURNING'].includes(a.dataset.behavior);
 const tick=()=>f.timers.find(t=>t.ms===100).fn();
 async function advance(ms){clock+=ms;f.setDateTime(new Date(clock).toISOString());for(const t of [...pending.values()].sort((a,b)=>a.at-b.at))if(pending.has(t.id)&&t.at<=clock){pending.delete(t.id);t.fn()}tick();await flush()}
 return {f,button,panel,all,stationary,pending,history,writes,tick,advance,snack:()=>button.events.click(),tap:a=>f.ids.get('haniOfficeActors').events.click({target:a}),speaker:()=>all().find(a=>a.dataset.speaking==='true'),lock:v=>{lock=v;f.show()}};
}
const status=a=>a.querySelector('.hani-office-status');
const prop=a=>a.querySelector('.hani-office-prop');
const display=a=>({line:a.dataset.line,emoji:a.dataset.emoji,full:status(a).dataset.full,text:status(a).textContent,prop:prop(a).textContent});
function eventTime(predicate){
 const s=scene.scheduler,options={chairmanPresent:false},formal=s.plan(day,options),events=[...formal,...s.blockPlan(day,0,formal,options)];
 for(const e of events)for(const sec of [(e.performStart+e.performEnd)/2,...e.people.flatMap(p=>[...p.out,...p.back].map(l=>(l.start+l.end)/2))]){
  if(!Number.isFinite(sec))continue;const now=at(day,sec),snap=s.snapshot(now,options),match=predicate(snap);
  if(match)return {time:now,...match};
 }
 throw Error('real schedule candidate missing');
}

test('snack: mounted persistent caption button reacts only to stationary staff on this floor',async()=>{
 const x=await mount(),selected=x.all().filter(x.stationary),others=x.all().filter(a=>!selected.includes(a)),before=new Map(others.map(a=>[a,display(a)]));
 assert.ok(selected.length>0);assert.equal(x.button.textContent,'🍪 간식 돌리기');assert.equal(x.button.className,'btn hani-office-snack');
 const model=x.f.context.HaniBuildingScene,modelBefore=JSON.stringify(model.snapshot(new x.f.context.Date(),{chairmanPresent:false}));
 assert.equal(x.button.parentElement.className,'hani-building-floor-caption');x.snack();
 assert.equal(JSON.stringify(model.snapshot(new x.f.context.Date(),{chairmanPresent:false})),modelBefore,'mounted scene output remains byte identical during reaction');
 for(const a of selected){assert.equal(prop(a).textContent,'🍪');assert.equal(status(a).dataset.full,'간식 먹는 중');assert.equal(status(a).textContent,'🍪 간식 먹는 중')}
 for(const a of others)assert.deepEqual(display(a),before.get(a),a.dataset.person);
 assert.equal(x.button.textContent,'간식 다 먹는 중…');assert.equal(x.button.disabled,true);
 const expected=selected.map(a=>a.dataset.person).sort()[0];assert.equal(x.speaker().dataset.person,expected);assert.equal(x.panel.hidden,false);
 assert.ok(x.panel.textContent.includes(JSON.parse(read('artifacts/office-snack/lines-serin.json'))[expected][0]));
});

test('snack: phone exact short form is shared by everyone, including reduced motion with no new effect',async()=>{
 for(const reduced of [false,true]){const x=await mount({width:390,reduced});let requests=0;
  const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
  x.f.map.getBoundingClientRect=()=>rect(0,0,390,220);
  for(const [i,a]of x.all().entries()){
   a.getBoundingClientRect=()=>rect(30+(i%5)*65,80+Math.floor(i/5)*50,20,35);
   for(const node of a.querySelectorAll('*'))node.getBoundingClientRect=()=>rect(0,0,45,12);
  }
  x.panel.getBoundingClientRect=()=>rect(0,0,180,45);
  for(const a of x.all())a.officeReactions.request=()=>{requests++};x.snack();
  for(const a of x.all().filter(x.stationary)){assert.equal(status(a).textContent,'🍪 간식먹기');assert.equal(a.officeCompact.textContent,' · 🍪 간식먹기')}
  assert.equal(requests,0);assert.equal(x.panel.hidden,false);assert.equal(x.panel.dataset.zoom,'false');
 }
});

test('snack: real walking staff keep the same motion path; visitors, NPCs and pets never react',async()=>{
 const candidate=eventTime(snap=>{for(const p of snap.entries.filter(p=>p.walking))if(snap.entries.some(q=>q.floor===p.floor&&!q.walking&&q.id!=='seongmin'))return {floor:p.floor,walker:p.id}});
 const x=await mount({...candidate,real:true}),walker=x.all().find(a=>a.dataset.person===candidate.walker),before=display(walker),position=walker.officePosition.slice();
 assert.equal(walker.dataset.walking,'true');x.snack();assert.deepEqual(display(walker),before);assert.deepEqual(walker.officePosition,position);assert.equal(walker.dataset.walking,'true');
 assert.ok(x.all().some(a=>a.dataset.snack==='true'));await x.advance(100);assert.equal(walker.dataset.walking,'true');assert.notDeepEqual(walker.officePosition,position);
 const guest=eventTime(snap=>snap.visitors.find(v=>!v.walking)&&{floor:'1f'}),y=await mount({...guest,real:true});
 const z=await mount({floor:'2f',real:true}),excluded=[...y.all().filter(a=>!a.hidden&&(a.dataset.visitor==='true'||a.dataset.resident)),...z.all().filter(a=>!a.hidden&&a.dataset.resident==='npc')];
 assert.ok(excluded.some(a=>a.dataset.visitor==='true'));assert.ok(excluded.some(a=>a.dataset.resident==='pet'));assert.ok(excluded.some(a=>a.dataset.resident==='npc'));
 const original=new Map(excluded.map(a=>[a,display(a)]));y.snack();z.snack();for(const a of excluded){assert.notEqual(prop(a).textContent,'🍪');assert.deepEqual(display(a),original.get(a),a.dataset.person)}
});

test('snack: after exactly 8 seconds icon/status restore in place without an intermediate schedule flash',async()=>{
 const x=await mount(),targets=x.all().filter(x.stationary),original=new Map(targets.map(a=>[a,display(a)])),nodes=targets.map(a=>[status(a),prop(a)]);
 x.snack();await x.advance(7999);for(const a of targets)assert.equal(prop(a).textContent,'🍪');
 const changes=[];for(const a of targets){const node=status(a),data=node.dataset;node.dataset=new Proxy(data,{set(o,k,v){if(k==='full')changes.push(v);o[k]=v;return true}})}
 // A forced renderer update while active must never write a scheduled label first.
 x.f.click('3f');assert.ok(changes.every(v=>v==='간식 먹는 중'));await x.advance(1);
 for(const [i,a]of targets.entries()){assert.deepEqual(display(a),original.get(a));assert.equal(status(a),nodes[i][0]);assert.equal(prop(a),nodes[i][1])}
 assert.equal(x.button.disabled,true);
});

test('snack: schedule advances during overlay and expiry restores the current schedule',async()=>{
 const time=at(day,10*3600+599),x=await mount({real:true,time}),control=await mount({real:true,time});
 x.snack();await x.advance(8000);await control.advance(8000);
 for(const a of x.all().filter(a=>!a.dataset.resident))assert.deepEqual(display(a),display(control.all().find(b=>b.dataset.person===a.dataset.person)),a.dataset.person);
});

test('snack: ten-minute floor cooldown survives floor changes, both timers clear, stale end cannot affect another floor',async()=>{
 const x=await mount();x.snack();const old=x.history.find(t=>t.ms===8000),oldCooldown=x.history.find(t=>t.ms===600000);
 x.snack();assert.equal(x.history.filter(t=>t.ms===8000).length,1);x.f.click('1f');
 assert.equal(x.pending.has(old.id),false);assert.equal(x.pending.has(oldCooldown.id),false);assert.equal(x.button.disabled,false);
 x.snack();old.fn();assert.ok(x.all().filter(x.stationary).every(a=>prop(a).textContent==='🍪'));
 x.f.click('3f');assert.equal(x.button.disabled,true);assert.ok(x.all().filter(x.stationary).every(a=>prop(a).textContent!=='🍪'));
 await x.advance(599999);assert.equal(x.button.disabled,true);await x.advance(1);assert.equal(x.button.disabled,false);assert.equal(x.button.textContent,'🍪 간식 돌리기');x.snack();assert.equal(x.button.disabled,true);
});

test('snack: viewer tap wins over thank-you, including stale bubble timer and pending async loads',async()=>{
 const x=await mount();x.snack();const old=x.history.find(t=>t.ms===4000),target=x.all().filter(x.stationary).find(a=>a!==x.speaker());
 x.tap(target);await flush();assert.equal(x.speaker(),target);old.fn();assert.equal(x.speaker(),target);assert.equal(x.panel.hidden,false);
 await x.advance(8000);assert.notEqual(x.speaker()?.dataset.person,x.all().filter(x.stationary).map(a=>a.dataset.person).sort()[0]);
 const y=await mount();const chosen=y.all().filter(y.stationary).at(-1);y.tap(chosen);y.snack();assert.equal(y.speaker(),chosen);
});

test('snack: no node allocation on repeated taps, floor switches or expiry; no storage writes; reload clears memory',async()=>{
 const x=await mount();const button=x.button,children=x.f.root.querySelectorAll('*');let created=0;
 const create=x.f.document.createElement;x.f.document.createElement=(...args)=>{created++;return create(...args)};
 for(let i=0;i<3;i++){x.snack();await x.advance(600000);x.f.click('1f');x.snack();await x.advance(600000);x.f.click('3f')}
 assert.equal(created,0);assert.equal(x.f.ids.get('haniOfficeSnack'),button);assert.deepEqual(x.f.root.querySelectorAll('*'),children);assert.deepEqual(x.writes,[]);
 const fresh=await mount();assert.equal(fresh.button.disabled,false);
});

test('snack: login lock hides button and rejects clicks; no scene interaction when hidden',async()=>{
 const x=await mount({locked:true});assert.equal(x.button.hidden,true);x.snack();assert.equal(x.history.some(t=>t.ms===8000),false);
 x.lock(false);assert.equal(x.button.hidden,false);x.f.hide();x.snack();assert.equal(x.history.some(t=>t.ms===8000),false);
 assert.match(read('hani-office-live.css'),/\.login-locked \.hani-office-snack\{display:none\}/);
});

test('snack: scheduler/snapshot/geometry/residents bytes and complete sampled model JSON preserve c301a13',()=>{
 const hash=x=>createHash('sha256').update(x).digest('hex'),source=read('hani-office-live.js'),baseline=JSON.parse(read('artifacts/office-snack/baseline.json'));
 for(const {name,start,end,sha256}of baseline.sections){const i=source.indexOf(start),j=source.indexOf(end,i);assert.ok(i>=0&&j>i,name);assert.equal(hash(source.slice(i,j)),sha256,name)}
 for(const row of baseline.models){const s=scene.scheduler,f=s.plan(row.day,row.options);assert.equal(hash(JSON.stringify(f)),row.plan);assert.equal(hash(JSON.stringify(s.blockPlan(row.day,0,f,row.options))),row.blockPlan);
  for(const snap of row.snapshots){assert.equal(hash(JSON.stringify(s.snapshot(at(row.day,snap.seconds),row.options))),snap.scheduler);assert.equal(hash(JSON.stringify(scene.snapshot(at(row.day,snap.seconds),row.options))),snap.view)}
 }
 const start=source.indexOf('  const snackLines='),end=source.indexOf('  const snackButton=',start),lines=vm.runInNewContext(source.slice(start,end)+';snackLines');
 assert.deepEqual(JSON.parse(JSON.stringify(lines)),JSON.parse(read('artifacts/office-snack/lines-serin.json')));
 assert.deepEqual(Object.keys(lines).sort(),assets.canon.people.filter(p=>p.id!=='seongmin').map(p=>p.id).sort());for(const list of Object.values(lines))assert.ok(list.length>=1&&list.length<=3);
});
