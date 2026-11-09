import './hani-life-bundle-preload.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';import {assets} from './hani-office-v2-fixture.mjs';
import mainOffice from './hani-office-kids-main-source.cjs';
import daily from './hani-office-kids-daily-source.cjs';
import inverse from './hani-office-kids-weekday-source.cjs';import poseB from './hani-office-kids-pose-b-source.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const dailyRaw=fs.readFileSync('hani-office-live.js','utf8'),raw=daily.restoreKidsDailySource(dailyRaw),base=inverse.restoreKidsWeekdaySource(raw),plain=x=>JSON.parse(JSON.stringify(x));
const {scene,table}=loadScene(),r=scene.residents,old=loadScene({transform:inverse.projectPreKidsWeekdaySource}).scene;
const previous=loadScene({transform:daily.restoreKidsDailySource}).scene.residents;
const chair=(floor='4f',extra={})=>({floors:[{id:floor,people:[{id:'seongmin',floor,position:[51,70],pose:'sitting',walking:false,facing:'right',...extra}]}]});
const homes={'companion-frog':'4f','companion-penguin':'3f','companion-otter':'1f','companion-chick':'2f','companion-fox':'2f'};
const days=Array.from({length:365},(_,i)=>new Date(Date.UTC(2026,0,i+1)).toISOString().slice(0,10));
const weekdays=days.filter(day=>![0,6].includes(new Date(day).getUTCDay()));
const visiting=weekdays.filter(day=>r.companionSnapshot(at(day,57600),chair(),true,true).some(p=>p.kid));
function weekendEqual(actual,before){
 const a=plain(actual),b=plain(before);
 for(const child of a.filter(p=>p.scene?.sibling)){
  assert.ok(child.kid);assert.match(child.scene.key,/\|siblings\|/);assert.ok(child.scene.line.length>5);
  child.scene=b.find(p=>p.id===child.id).scene;
 }
 assert.deepEqual(a,b);
}

test('daily exact outer inverse round-trips mixed EOL bytes, keeps frozen weekday/B/main assertions and rejects all drift',()=>{
 const bytes=fs.readFileSync('hani-office-live.js'),before=daily.restoreKidsDailySource(bytes);
 assert.deepEqual(before,Buffer.from(raw));assert.equal(daily.hash(before),daily.delta.beforeSha256);
 assert.equal(daily.delta.replacements.length,1);
 let forward=raw;
 for(const pair of daily.delta.replacements){
  assert.equal(forward.split(pair.before).length-1,1);forward=forward.replace(pair.before,()=>pair.after);
  assert.throws(()=>daily.restoreKidsDailySource(dailyRaw.replace(pair.after,()=>pair.before)));
  assert.throws(()=>daily.restoreKidsDailySource(dailyRaw+pair.after));
 }
 assert.equal(forward,dailyRaw);assert.equal(dailyRaw.length,raw.length-41);
 assert.equal((dailyRaw.match(/\r\n/g)||[]).length,(raw.match(/\r\n/g)||[]).length);
 assert.equal((dailyRaw.match(/\n/g)||[]).length,(raw.match(/\n/g)||[]).length);
 for(const bad of [dailyRaw+'\n',dailyRaw.slice(1),dailyRaw+dailyRaw,raw,dailyRaw.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'),dailyRaw.replace('kids-weekday-child','changed-child')])assert.throws(()=>daily.restoreKidsDailySource(bad));
 assert.throws(()=>daily.restoreKidsDailySource(dailyRaw,'hani-main.js'));
 assert.equal(inverse.restoreKidsWeekdaySource(dailyRaw),base);
 assert.equal(poseB.projectPreKidsPoseBSource(dailyRaw),poseB.projectPreKidsPoseBSource(raw));
});

test('exact outer inverse restores every bbe71c0 byte, preserves B contract, rejects incomplete/duplicate/unrelated changes',()=>{
 assert.equal(mainOffice.restoreMainOfficeSource(base),fs.readFileSync('artifacts/kids-weekday/baseline/hani-office-live.js','utf8'));
 assert.equal(poseB.projectPreKidsPoseBSource(raw),poseB.projectPreKidsPoseBSource(base));
 let forward=base;
 for(const pair of inverse.delta.replacements){assert.equal(base.split(pair.before).length-1,1);forward=forward.replace(pair.before,()=>pair.after);assert.throws(()=>inverse.restoreKidsWeekdaySource(raw.replace(pair.after,()=>pair.before)));assert.throws(()=>inverse.restoreKidsWeekdaySource(raw+pair.after));}
 assert.equal(forward,raw);for(const bad of [raw+'\n',raw.slice(1),raw+raw,base])assert.throws(()=>inverse.restoreKidsWeekdaySource(bad));assert.throws(()=>inverse.restoreKidsWeekdaySource(raw,'hani-main.js'));
});
test('main office outer layer preserves exact weekday baseline and rejects drift, duplicate, partial and repeated inverse',()=>{
 const before=mainOffice.restoreMainOfficeSource(base);
 assert.deepEqual(mainOffice.restoreMainOfficeSource(Buffer.from(base)),Buffer.from(before));
 for(const bad of [base+'\n',base.slice(1),base+base,before,base.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')])assert.throws(()=>mainOffice.restoreMainOfficeSource(bad),/exact merged main office input/);
 assert.throws(()=>mainOffice.restoreMainOfficeSource(base,'hani-main.js'),/known merged main office owner/);
});

test('365 KST dates give daily weekday visits across fresh scenes and ISO representations, both children visit; weekends stay identical',()=>{
 const fresh=loadScene({transform:s=>'Math.random=()=>{throw Error("random forbidden")};\n'+s}).scene.residents,children=new Set();
 for(const day of days){const now=at(day,57600),a=r.companionSnapshot(now,chair(),true,true),b=fresh.companionSnapshot(new Date(now.toISOString()),chair(),true,true);assert.deepEqual(plain(a),plain(b));assert.deepEqual(plain(a),plain(r.companionSnapshot(now,chair(),true,true)));if(weekdays.includes(day)){assert.equal(a.filter(p=>p.kid).length,1,day);for(const p of a.filter(p=>p.kid))children.add(p.id);}else{assert.equal(a.filter(p=>p.kid).length,2,day);assert.deepEqual(plain(a),plain(previous.companionSnapshot(now,chair(),true,true)));}}
 const ratio=visiting.length/weekdays.length;assert.equal(visiting.length,weekdays.length);assert.equal(ratio,1);assert.deepEqual([...children].sort(),['kid-suhyeon','kid-suyeon']);
 console.log('weekday year simulation '+JSON.stringify({year:2026,weekdays:weekdays.length,visits:visiting.length,ratio,first:visiting[0]}));
});
test('all weekday boundary milliseconds use [15:00,19:00) KST, outside hours stay unchanged and follower count never grows',()=>{
 for(const day of weekdays)for(const seconds of [0,53999.999,54000,57600,68399.999,68400,86399.999]){
  const now=at(day,seconds),staff=chair(),saved=JSON.stringify(staff),states=r.companionSnapshot(now,staff,true,true),expected=seconds>=54000&&seconds<68400;
  assert.equal(states.filter(p=>p.kid).length,expected?1:0,day+' '+seconds);assert.equal(states.filter(p=>p.following).length,1);assert.equal(JSON.stringify(staff),saved);
  if(expected){assert.equal(states.find(p=>p.following).kid,true);for(const p of states.filter(p=>p.pet))assert.equal(p.floor,homes[p.id]);}
  else assert.deepEqual(plain(states),plain(old.residents.companionSnapshot(now,staff,true,true)));
 }
});
test('every minute of every weekday visit window has exactly one child; every weekend sample matches the pre-daily runtime',()=>{
 let minutes=0;const children=new Set();
 for(const day of weekdays)for(let seconds=54000;seconds<68400;seconds+=60){
  const states=r.companionSnapshot(at(day,seconds),chair(),true,true),kids=states.filter(p=>p.kid);
  assert.equal(kids.length,1,day+' '+seconds);assert.equal(states.filter(p=>p.following).length,1);
  assert.equal(kids[0].following,true);assert.equal(kids[0].weekdayArrival.day,day);children.add(kids[0].id);minutes++;
 }
 assert.equal(minutes,weekdays.length*240);assert.deepEqual([...children].sort(),['kid-suhyeon','kid-suyeon']);
 for(const day of days.filter(day=>!weekdays.includes(day)))for(const seconds of [0,53999.999,54000,57600,68399.999,68400,86399.999]){
  const now=at(day,seconds),a=r.companionSnapshot(now,chair(),true,true),b=previous.companionSnapshot(now,chair(),true,true);
  assert.equal(a.filter(p=>p.kid).length,2);assert.deepEqual(plain(a),plain(b));
 }
 console.log('daily full-window evidence '+JSON.stringify({weekdays:weekdays.length,minuteSnapshots:minutes,weekends:days.length-weekdays.length,children:[...children].sort()}));
});
test('visit-day actual schedule on every minute preserves safe slots, reduced motion, absence, disabled scene and resident output',()=>{
 for(const day of visiting.slice(0,2))for(let seconds=0;seconds<86400;seconds+=60){
  const now=at(day,seconds),staff=scene.snapshot(now,{chairmanPresent:true}),residents=r.snapshot(now,staff),states=r.companionSnapshot(now,staff,true,false,residents),expected=seconds>=54000&&seconds<68400;
  assert.equal(states.filter(p=>p.kid).length,expected?1:0,day+' '+seconds);assert.equal(states.filter(p=>p.following).length,1);assert.deepEqual(plain(residents),plain(old.residents.snapshot(now,staff)));
  for(const p of states.filter(p=>p.kid))assert.ok(r.companionSafe(p.floor,p.position,true));
 }
 for(const floor of scene.floors.map(f=>f.id))for(const reduced of [false,true]){
  const now=at(visiting[0],57600),states=r.companionSnapshot(now,chair(floor,{walking:true}),true,reduced),kid=states.find(p=>p.kid);assert.equal(kid.floor,floor);if(reduced)assert.ok(!kid.motion&&!kid.walking);
 }
 const now=at(visiting[0],57600);for(const staff of [{floors:[]},chair('4f',{state:'ABSENT'})])assert.equal(r.companionSnapshot(now,staff).filter(p=>p.kid||p.following).length,0);
 assert.deepEqual(plain(r.companionSnapshot(now,chair(),false)),[]);
});
test('weekend movement and staff visits match fixed baseline; only requested sibling speech expands',()=>{
 for(const day of ['2026-11-07','2026-11-08']){
  for(let seconds=0;seconds<86400;seconds+=60){const now=at(day,seconds),staff=scene.snapshot(now,{chairmanPresent:true}),states=r.companionSnapshot(now,staff),before=old.residents.companionSnapshot(now,staff);assert.equal(states.filter(p=>p.kid).length,2);weekendEqual(states,before);}
  const a=r.createKidsVisits(),b=old.residents.createKidsVisits();
  for(let seconds=36000;seconds<36120;seconds++){const now=at(day,seconds),staff=scene.snapshot(now,{chairmanPresent:true}),states=r.companionSnapshot(now,staff),before=old.residents.companionSnapshot(now,staff);assert.deepEqual(plain(a.update(now,staff,states)),plain(b.update(now,staff,before)));weekendEqual(states,before);}
 }
 for(const time of ['2026-11-06T23:59:59.999+09:00','2026-11-07T00:00:00+09:00','2026-11-08T23:59:59.999+09:00','2026-11-09T00:00:00+09:00'])assert.deepEqual(plain(r.companionSnapshot(new Date(time),chair())),plain(old.residents.companionSnapshot(new Date(time),chair())));
});
test('all old general lines remain in order, six new lines each and three deterministic dad greetings each are reachable',()=>{
 const greetings=new Map();
 for(const person of r.companions.filter(p=>p.kid)){
  const original=old.residents.companions.find(p=>p.id===person.id).lines;
  assert.deepEqual(plain(person.lines.slice(0,original.length)),plain(original));assert.equal(person.lines.length,original.length+6);
  assert.ok(person.lines.slice(original.length).every(line=>!line.includes('회장님')));
  greetings.set(person.id,new Set());
 }
 for(const day of visiting){const child=r.companionSnapshot(at(day,57600),chair()).find(p=>p.kid);assert.equal(child.weekdayArrival.day,day);assert.match(child.weekdayArrival.line,/아빠/);assert.doesNotMatch(child.weekdayArrival.line,/회장님/);greetings.get(child.id).add(child.weekdayArrival.line);}
 for(const lines of greetings.values())assert.equal(lines.size,3);
});
test('three sibling exchanges share the existing scene queue with brother then sister, never a lone weekday child',()=>{
 const exchanges=new Set();
 for(let seconds=36150;seconds<39750;seconds+=180){
  const states=r.companionSnapshot(at('2026-11-08',seconds),chair(),true,true),kids=states.filter(p=>p.kid);
  assert.equal(kids.length,2);assert.ok(kids.every(p=>p.scene.sibling));
  const brother=kids.find(p=>p.id==='kid-suhyeon'),sister=kids.find(p=>p.id==='kid-suyeon');assert.equal(sister.scene.notBefore-brother.scene.notBefore,3000);
  exchanges.add(brother.scene.line+' / '+sister.scene.line);
 }
 assert.equal(exchanges.size,3);
 for(const day of visiting)assert.ok(r.companionSnapshot(at(day,57750),chair()).filter(p=>p.kid).every(p=>!p.scene?.sibling));
});
test('mounted existing tick/bubble greets once per KST day only when visible, keeps taps, slots, timers/listeners, and performs zero writes',()=>{
 const writes=[],deny=(...args)=>{writes.push(args);throw Error('persistence forbidden')},manifest=JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json'));
 const mount=transform=>{const pending=new Map();let serial=0;const f=fixture('10:00',false,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:manifest},setTimeout:fn=>{pending.set(++serial,fn);return serial},clearTimeout:id=>pending.delete(id),localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny}},s=>'globalThis.__weekdayShown=[];\n'+transform(s).replace('function showBubble(actor,selection,duration=3000,automatic=false){','function showBubble(actor,selection,duration=3000,automatic=false){if(selection?.weekdayArrival)globalThis.__weekdayShown.push({id:actor.dataset.person,line:selection.line,day:new Date().toISOString()});'));f.expireBubbles=()=>{const rows=[...pending.values()];pending.clear();for(const fn of rows)fn()};return f};
 const f=mount(s=>s),prior=mount(inverse.projectPreKidsWeekdaySource),slots=f.ids.get('haniOfficeActors').children.slice(),tick=f.timers.find(t=>t.ms===100).fn;
 f.context.window.HaniOfficePresence={chairman:'active'};const bubble=f.map.children.find(a=>a.className==='hani-office-character-bubble');
 for(const [index,day]of visiting.slice(0,2).entries()){
  f.document.hidden=true;f.setDateTime(at(day,57600).toISOString());f.click('4f');tick();assert.equal(f.context.__weekdayShown.length,index);
  f.expireBubbles();f.document.hidden=false;f.document.events.visibilitychange();tick();assert.equal(f.context.__weekdayShown.length,index+1);
  const arrival=f.context.__weekdayShown.at(-1),actor=slots.find(p=>p.dataset.person===arrival.id);assert.equal(actor.hidden,false);assert.ok(bubble.children[0].textContent.includes(arrival.line));tick();assert.ok(bubble.children[0].textContent.includes(arrival.line),'tick preserves first greeting');
  f.ids.get('haniOfficeActors').events.click({target:actor,isTrusted:true});assert.ok(bubble.children[0].textContent.includes(r.companions.find(p=>p.id===arrival.id).lines[0]));
  for(const line of r.companions.find(p=>p.id===arrival.id).lines.slice(1)){f.ids.get('haniOfficeActors').events.click({target:actor,isTrusted:true});assert.ok(bubble.children[0].textContent.includes(line));tick();assert.ok(bubble.children[0].textContent.includes(line));}
  f.click('1f');f.setDateTime(at(day,57610).toISOString());f.click('4f');tick();assert.equal(f.context.__weekdayShown.length,index+1);
  f.setDateTime(at(day,68400).toISOString());tick();assert.ok(slots.filter(p=>p.dataset.person?.startsWith('kid-')).every(p=>p.hidden));
 }
 assert.deepEqual(f.ids.get('haniOfficeActors').children,slots);assert.deepEqual(f.timers.map(t=>t.ms),prior.timers.map(t=>t.ms));assert.deepEqual(Object.keys(f.document.events),Object.keys(prior.document.events));assert.deepEqual(writes,[]);
});
test('mounted weekend sibling exchange actually speaks brother then sister through the one existing bubble',()=>{
 const day='2026-11-08';let start,expected;
 for(let seconds=36150;seconds<68400;seconds+=180){
  const stable=Array.from({length:8},(_,i)=>{const now=at(day,seconds+i),staff=scene.snapshot(now,{chairmanPresent:true});return r.companionSnapshot(now,staff,true,true).filter(p=>p.kid)});
  if(stable.every(kids=>kids.length===2&&kids.every(p=>p.scene?.sibling))){start=seconds;expected=stable[0];break}
 }
 assert.ok(start,'real scheduled weekend exchange found');
 const pending=new Map();let serial=0;const f=fixture('10:00',true,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json'))},setTimeout:fn=>{pending.set(++serial,fn);return serial},clearTimeout:id=>pending.delete(id)},s=>'globalThis.__spoken=[];\n'+s.replace('function showBubble(actor,selection,duration=3000,automatic=false){','function showBubble(actor,selection,duration=3000,automatic=false){globalThis.__spoken.push({id:actor.dataset.person,line:selection?.line});'));
 const expire=()=>{const callbacks=[...pending.values()];pending.clear();for(const fn of callbacks)fn()},tick=f.timers.find(t=>t.ms===100).fn;
 f.context.window.HaniOfficePresence={chairman:'active'};f.setDateTime(at(day,start).toISOString());f.click(expected[0].floor);expire();
 f.setDateTime(at(day,start+1).toISOString());tick();
 const brother=expected.find(p=>p.id==='kid-suhyeon'),sister=expected.find(p=>p.id==='kid-suyeon');assert.equal(f.context.__spoken.at(-1).line,brother.scene.line);
 expire();f.setDateTime(at(day,start+4).toISOString());tick();assert.equal(f.context.__spoken.at(-1).line,sister.scene.line);
});
test('weekday delta preserves runtime closure, scheduler, CSS/assets/version and timer/listener/storage call counts',async()=>{
 const count=(s,re)=>[...s.matchAll(re)].length;for(const re of [/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:localStorage|sessionStorage)\b/g,/\bsupabase\b/g,/\bMath\.random\b/g])assert.equal(count(raw,re),count(base,re));
 const scheduler=s=>s.slice(s.indexOf('  function createScheduler('),s.indexOf('  function snapshot(now=new Date(),options={})'));assert.equal(scheduler(raw),scheduler(base));
 const a=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>fs.readFileSync(f)}),b=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>f==='hani-office-live.js'?base:fs.readFileSync(f)});assert.deepEqual(a.files,b.files);assert.deepEqual(a.missing,b.missing);assert.equal(a.files.length,161);assert.deepEqual(a.missing,[]);
 for(const file of a.files)assert.ok(file==='hani-office-live.js'?inverse.restoreKidsWeekdaySource(a.contents.get(file).toString())===b.contents.get(file):a.contents.get(file).equals(b.contents.get(file)),file+' bytes preserved');
});
