import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {restorePets268Source} from './hani-office-pets-268-source.mjs';

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
function eventTime(predicate,day='2026-11-05'){
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
 assert.equal(x.button.parentElement.className,'hani-office-event-panel');assert.equal(x.button.parentElement.parentElement.className,'hani-building-floor-caption');x.snack();
 assert.equal(JSON.stringify(model.snapshot(new x.f.context.Date(),{chairmanPresent:false})),modelBefore,'mounted scene output remains byte identical during reaction');
 for(const a of selected){assert.equal(prop(a).textContent,'🍪');assert.equal(status(a).dataset.full,'간식 먹는 중');assert.equal(status(a).textContent,'🍪 간식 먹는 중')}
 for(const a of others)assert.deepEqual(display(a),before.get(a),a.dataset.person);
 assert.equal(x.button.textContent,'🍪 간식 돌리기 (10분 뒤)');assert.equal(x.button.disabled,true);
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
 // v2.9.268: exact inverse delta for old pins; preserve the owner's already
 // repinned renderer row and all existing plan/blockPlan/snapshot output hashes.
 const comparableSource=restorePets268Source(source);
 for(const {name,start,end,sha256}of baseline.sections){const text=name==='residents renderer'?source:comparableSource;const i=text.indexOf(start),j=text.indexOf(end,i);assert.ok(i>=0&&j>i,name);assert.equal(hash(text.slice(i,j)),sha256,name)}
 for(const row of baseline.models){const s=scene.scheduler,f=s.plan(row.day,row.options);assert.equal(hash(JSON.stringify(f)),row.plan);assert.equal(hash(JSON.stringify(s.blockPlan(row.day,0,f,row.options))),row.blockPlan);
  for(const snap of row.snapshots){assert.equal(hash(JSON.stringify(s.snapshot(at(row.day,snap.seconds),row.options))),snap.scheduler);assert.equal(hash(JSON.stringify(scene.snapshot(at(row.day,snap.seconds),row.options))),snap.view)}
 }
 const start=source.indexOf('  const snackLines='),end=source.indexOf('  const eventLines=',start),lines=vm.runInNewContext(source.slice(start,end)+';snackLines');
 assert.deepEqual(JSON.parse(JSON.stringify(lines)),JSON.parse(read('artifacts/office-snack/lines-serin.json')));
 assert.deepEqual(Object.keys(lines).sort(),assets.canon.people.filter(p=>p.id!=='seongmin').map(p=>p.id).sort());for(const list of Object.values(lines))assert.ok(list.length>=1&&list.length<=3);
});

const eventSpecs={snack:['🍪 간식 돌리기','🍪','간식 먹는 중','간식먹기'],coffee:['☕ 커피 쏘기','☕','커피 마시는 중','커피타임'],applause:['👏 칭찬 박수','👏','칭찬 받는 중','칭찬받기'],cheer:['📣 깜짝 응원','📣','화이팅 외치는 중','화이팅'],birthday:['🎂 생일 축하','🎉','생일 축하 중','생일축하']};
const eventButton=(x,id)=>x.f.ids.get(id==='snack'?'haniOfficeSnack':'haniOfficeEvent-'+id);
const runEvent=(x,id)=>{const toggle=x.f.ids.get('haniOfficeEvents');x.f.document.events.pointerdown({target:toggle});toggle.events.click();x.f.document.events.pointerdown({target:eventButton(x,id)});eventButton(x,id).events.click()};
for(const [id,[title,icon,line,short]]of Object.entries(eventSpecs)){
 test(`events ${id}: stationary floor scope, exact status at both widths, 8s restore, viewer priority and no writes`,async()=>{
  for(const width of [1280,390])for(const reduced of [false,true]){
   const x=await mount({time:at('2026-11-06',36000),width,reduced});
   const selected=x.all().filter(x.stationary),others=x.all().filter(a=>!selected.includes(a)),before=new Map(x.all().map(a=>[a,display(a)]));
   assert.ok(selected.length>1);runEvent(x,id);assert.equal(x.f.ids.get('haniOfficeEventPanel').hidden,true);
   for(const a of selected){assert.equal(prop(a).textContent,icon);assert.equal(status(a).dataset.full,line);assert.equal(status(a).textContent,icon+' '+(width===390?short:line))}
   for(const a of others)assert.deepEqual(display(a),before.get(a));
   assert.equal(eventButton(x,id).textContent,title+' (10분 뒤)');assert.equal(eventButton(x,id).disabled,true);
   assert.equal(x.history.filter(t=>t.ms===8000).length,1);const oldBubble=x.history.find(t=>t.ms===4000),target=selected.find(a=>a!==x.speaker());
   x.tap(target);await flush();assert.equal(x.speaker(),target);oldBubble.fn();assert.equal(x.speaker(),target);
   await x.advance(7999);for(const a of selected)assert.equal(prop(a).textContent,icon);
   await x.advance(1);for(const a of selected)assert.deepEqual(display(a),before.get(a));assert.deepEqual(x.writes,[]);
   const y=await mount({time:at('2026-11-06',36000)}),chosen=y.all().filter(y.stationary).at(-1);y.tap(chosen);runEvent(y,id);await flush();assert.equal(y.speaker(),chosen);
  }
 });
}

test('events: independent event/floor cooldowns share two timer slots; stale callbacks cannot clear a replacement',async()=>{
 const x=await mount({time:at('2026-11-06',36000)}),ids=Object.keys(eventSpecs);
 for(const [index,id]of ids.entries()){
  assert.equal(eventButton(x,id).disabled,false);runEvent(x,id);
  const end=x.history.filter(t=>t.ms===8000).at(-1);eventButton(x,id).events.click();assert.equal(x.history.filter(t=>t.ms===8000).at(-1),end);
  assert.equal([...x.pending.values()].filter(t=>t.ms===8000).length,1);assert.equal([...x.pending.values()].filter(t=>t.ms>8000).length,1);
  for(const used of ids.slice(0,index+1))assert.equal(eventButton(x,used).disabled,true);
  await x.advance(1000);
 }
 for(const stale of x.history.filter(t=>t.ms===8000).slice(0,-1))stale.fn();assert.ok(x.all().filter(x.stationary).every(a=>a.dataset.ownerEvent==='birthday'));
 x.f.click('1f');for(const id of ids)assert.equal(eventButton(x,id).disabled,false);runEvent(x,'coffee');
 x.f.click('3f');for(const id of ids)assert.equal(eventButton(x,id).disabled,true);
 await x.advance(595000);assert.equal(eventButton(x,'snack').disabled,false);for(const id of ids.slice(1))assert.equal(eventButton(x,id).disabled,true);
 for(const id of ids.slice(1)){await x.advance(1000);assert.equal(eventButton(x,id).disabled,false)}
 assert.deepEqual(x.writes,[]);
});

test('events: persistent panel/buttons, outside pointer, keyboard, floors, lock and reload',async()=>{
 const x=await mount({time:at('2026-11-06',36000)}),toggle=x.f.ids.get('haniOfficeEvents'),panel=x.f.ids.get('haniOfficeEventPanel'),nodes=x.f.root.querySelectorAll('*');
 assert.equal(toggle.textContent,'🎉 회장님 이벤트');assert.equal(panel.hidden,true);assert.equal(panel.children.length,5);assert.equal(toggle.parentElement.className,'hani-building-floor-caption');
 let created=0;const create=x.f.document.createElement;x.f.document.createElement=(...a)=>{created++;return create(...a)};
 for(const id of Object.keys(eventSpecs)){
  toggle.events.click();assert.equal(panel.hidden,false);assert.equal(toggle.getAttribute('aria-expanded'),'true');
  x.f.document.events.pointerdown({target:eventButton(x,id)});assert.equal(panel.hidden,false);eventButton(x,id).events.click();assert.equal(panel.hidden,true);
  toggle.events.click();x.f.document.events.pointerdown({target:x.f.map});assert.equal(panel.hidden,true);assert.equal(toggle.getAttribute('aria-expanded'),'false');
  toggle.events.click();panel.events.keydown({key:'Escape'});assert.equal(panel.hidden,true);assert.equal(x.f.document.activeElement,toggle);
  await x.advance(600000);
 }
 toggle.events.click();x.f.click('1f');assert.equal(panel.hidden,true);toggle.events.click();x.lock(true);assert.equal(panel.hidden,true);assert.equal(toggle.hidden,true);
 x.lock(false);toggle.events.click();x.f.hide();assert.equal(panel.hidden,true);
 assert.equal(created,0);assert.deepEqual(x.f.root.querySelectorAll('*'),nodes);assert.deepEqual(x.writes,[]);
 const fresh=await mount({time:at('2026-11-06',36000)});for(const id of Object.keys(eventSpecs))assert.equal(eventButton(fresh,id).disabled,false);
});

test('events: birthday uses final dates, KST midnight, own and colleague lines, absence and stationary scope',async()=>{
 const dates={hani:'01-17',gaeun:'09-25',yuna:'02-20',mir:'05-14',seoyun:'03-12',dohyun:'06-18',serin:'07-23',yuri:'09-11',arin:'04-24',jieun:'04-09',haru:'05-29',daon:'11-21',naeun:'07-08',hina:'08-21',minji:'10-08',sooyeon:'11-06',yoonseul:'03-26',sua:'12-12',taeo:'02-06'};
 for(const [id,date]of Object.entries(dates)){
  const x=await mount({time:at('2026-'+date,36000)}),p=x.f.context.HaniBuildingScene.snapshot(new x.f.context.Date()).floors.find(f=>f.people.some(p=>p.id===id));
  assert.ok(p,id);x.f.click(p.id);assert.equal(eventButton(x,'birthday').hidden,false,id);runEvent(x,'birthday');assert.equal(x.speaker().dataset.person,id);assert.equal(prop(x.speaker()).textContent,'🎂');
  assert.ok(x.panel.textContent.includes(eventTable().birthday[id][0]));for(const a of x.all().filter(x.stationary))assert.equal(prop(a).textContent,a.dataset.person===id?'🎂':'🎉');
 }
 const away=await mount({time:at('2026-11-06',36000),floor:'3f'});runEvent(away,'birthday');assert.notEqual(away.speaker().dataset.person,'sooyeon');assert.ok(away.panel.textContent.includes(eventTable().birthday.sooyeon[1]));
 const edge=await mount({time:new Date('2026-11-05T14:59:59Z')});assert.equal(eventButton(edge,'birthday').hidden,true);await edge.advance(1000);edge.f.show();assert.equal(eventButton(edge,'birthday').hidden,false);await edge.advance(86400000);edge.f.show();assert.equal(eventButton(edge,'birthday').hidden,true);
 // The actual birthday selector must reject a birthday person absent for the entire day.
 const source=read('hani-office-live.js'),start=source.indexOf('  function birthdayPerson(){'),end=source.indexOf('  function syncEventButtons()',start);
 class BirthdayClock extends Date{static now(){return +at('2026-11-06',36000)}}
 const select=vm.runInNewContext("let birthdayDay='',birthdayPresent=new Set();"+source.slice(start,end)+';birthdayPerson',{Date:BirthdayClock,staffBirthdays:{sooyeon:'11-06'},officePresence:{read:()=>({})},actors:new Map([['sooyeon',{hidden:true}]]),building:{snapshot:()=>({floors:[{people:[]}]})}});
 assert.equal(select(),null);
 const night=await mount({time:at('2026-11-06',3*3600),real:true,floor:'3f'});assert.equal(eventButton(night,'birthday').hidden,false,'birthday colleague is in the building that day even if home overnight');
 const noBirthday=await mount();assert.equal(eventButton(noBirthday,'birthday').hidden,true);runEvent(noBirthday,'birthday');assert.equal(noBirthday.history.some(t=>t.ms===8000),false);
});

test('events: every event excludes actual walking staff, visitors and residents without changing their paths',async()=>{
 const candidate=eventTime(snap=>{for(const p of snap.entries.filter(p=>p.walking))if(snap.entries.some(q=>q.floor===p.floor&&!q.walking&&q.id!=='seongmin'))return {floor:p.floor,walker:p.id}},'2026-11-06');
 for(const id of Object.keys(eventSpecs)){
  const x=await mount({...candidate,real:true}),walker=x.all().find(a=>a.dataset.person===candidate.walker),before=display(walker),position=walker.officePosition.slice();
  const excluded=x.all().filter(a=>a.dataset.resident||a.dataset.visitor==='true'),original=new Map(excluded.map(a=>[a,display(a)]));
  assert.equal(walker.dataset.walking,'true');runEvent(x,id);assert.deepEqual(display(walker),before);assert.deepEqual(walker.officePosition,position);
  for(const a of excluded)assert.deepEqual(display(a),original.get(a),id+' '+a.dataset.person);
  assert.ok(x.all().some(a=>a.dataset.ownerEvent===id));await x.advance(100);assert.equal(walker.dataset.walking,'true');assert.notDeepEqual(walker.officePosition,position);
 }
});

function eventTable(){const source=read('hani-office-live.js'),start=source.indexOf('  const snackLines='),end=source.indexOf('  const ownerEvents=',start);return JSON.parse(JSON.stringify(vm.runInNewContext(source.slice(start,end)+';eventLines')))}
test('events: authored table preserves every short line and records every necessary shortening',()=>{
 const table=eventTable(),original=JSON.parse(read('artifacts/office-snack/events-serin.json')),changes=JSON.parse(read('artifacts/office-events/shortened-lines.json'));
 original.birthday={};for(const row of read('artifacts/office-snack/birthdays-proposal.md').split('\n').filter(s=>s.startsWith('| `'))){const c=row.split('|').map(s=>s.trim());original.birthday[c[1].replaceAll('`','')]=[c[5],c[6]]}
 assert.deepEqual(table.snack,JSON.parse(read('artifacts/office-snack/lines-serin.json')));
 let count=0;for(const [event,people]of Object.entries(original)){assert.deepEqual(Object.keys(table[event]).sort(),Object.keys(table.snack).sort());for(const [id,lines]of Object.entries(people))lines.forEach((line,i)=>{const actual=table[event][id][i];assert.ok([...actual].length<=24);if([...line].length<=24)assert.equal(actual,line);else{count++;assert.ok(changes.some(c=>c.id===id&&c.before===line&&c.after===actual))}})}assert.equal(count,20);assert.equal(changes.length,count);
});
