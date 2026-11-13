import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {readRawLifeFile} from './hani-life-bundle-source.mjs';
import outer284 from './hani-save-guard-source.cjs';
import {projectPrePatrolSource} from './hani-office-chairman-patrol-278-source.mjs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';import {fixture} from './hani-building-206-engine.test.mjs';import {assets} from './hani-office-v2-fixture.mjs';
import {restoreStaffChats278Source} from './hani-office-chairman-patrol-278-source.mjs';import {resolveRuntimeClosure} from './hani-office-kids-pose-b-closure.mjs';
const {scene,table}=loadScene(),s=scene.scheduler,day='2026-11-09',options={chairmanPresent:true},plain=x=>JSON.parse(JSON.stringify(x));
function simulate(date=day,opts=options){const owner=s.createStaffChats(),events=[],seen=new Set();for(let sec=0;sec<86400;sec+=15){const e=owner.update(at(date,sec),opts);if(e&&!seen.has(e.id)){seen.add(e.id);events.push(plain(e))}}return events}
const events=simulate();
test('40 embedded sets exactly preserve all original names, places, conditions, speakers and Unicode text with actual actor IDs',()=>{
 const original=JSON.parse(fs.readFileSync('docs/drafts/staff-chats-v1.json','utf8')).chats;assert.equal(s.staffChatLines.length,40);
 const ids=new Set([...scene.canon.people.map(p=>p.id),'iseul','eunha']);
 for(const p of s.staffChatLines){const {aId,bId,...source}=plain(p);assert.deepEqual(source,original.find(o=>o.id===p.id));assert.ok(ids.has(aId),p.a);assert.ok(ids.has(bId),p.b);assert.notEqual(aId,'kid-suyeon');assert.notEqual(bId,'kid-suyeon')}
 for(const [name,id]of [['도연','dohyun'],['수연','sooyeon'],['채원','taeo'],['가은','gaeun'],['윤슬','yoonseul']])assert.ok(s.staffChatLines.some(p=>p.a===name&&p.aId===id||p.b===name&&p.bId===id));
});
test('actual whole-day simulation starts several conversations on every floor; cadence is 20–40 minutes plus recorded safe deferrals',()=>{
 const counts={},cadence={};for(const f of scene.floors){const list=events.filter(e=>e.card.floor===f.id),gaps=list.slice(1).map((e,i)=>e.start-list[i].start);counts[f.id]=list.length;assert.ok(list.length>=8,f.id+' '+list.length);assert.ok(gaps.every(g=>g>=1200));cadence[f.id]={within40:gaps.filter(g=>g<=2400).length,deferred:gaps.filter(g=>g>2400).length,maxMinutes:Math.round(Math.max(...gaps)/60)};assert.ok(gaps.filter(g=>g<=2400).length>=Math.floor(gaps.length*.5),f.id+' cadence')}
 assert.ok(new Set(events.map(e=>e.staffChat.id)).size>=20);console.log('staff-chat day '+JSON.stringify({counts,cadence,unique:new Set(events.map(e=>e.staffChat.id)).size}));
});
test('independent KST time oracle checks every event at both travel boundaries, including night worker and daytime barista',()=>{
 for(const e of events)for(const sec of [e.start,e.end-.001]){const h=sec/3600,p=e.staffChat;assert.ok(({morning:h>=9&&h<12,day:h>=12&&h<18,evening:h>=18&&h<22,night:h>=19||h<7,any:true})[p.time],p.id+' '+h);if([p.aId,p.bId].includes('eunha'))assert.ok(h>=19||h<7);if([p.aId,p.bId].includes('iseul'))assert.ok(h>=9&&h<19);for(const t of e.people)assert.ok(s.presentAt(t.id,sec))}
 assert.ok(events.some(e=>e.staffChat.bId==='eunha'));assert.ok(events.some(e=>e.staffChat.bId==='iseul'));
});
test('all reserved staff conversations leave existing work, rest, drama, public service and patrol events intact',()=>{
 const formal=s.plan(day,options),old=s.blockPlan(day,0,formal,options),prior=plain([...formal,...old]);
 for(const e of events){assert.ok(!e.people.some(t=>t.id==='seongmin'));for(const other of [...formal,...old])if(e.start<other.end&&other.start<e.end){assert.ok(!other.people.some(t=>e.people.some(q=>q.id===t.id)),e.staffChat.id+' actor conflict '+other.id);assert.ok(!other.patrol);assert.ok(!other.report);assert.ok(!other.card?.targetPerson||!e.people.some(t=>t.id===other.card.targetPerson));}}
 assert.deepEqual(plain([...s.plan(day,options),...s.blockPlan(day,0,formal,options)]),prior);
});
test('each higher-priority blocker postpones without consuming a turn, then resumes in a safe reserved gap',()=>{
 for(const kind of ['chairman-patrol','kids-visit','chairman-event','manual-bubble','hidden-view','meeting']){const owner=s.createStaffChats();for(let sec=9*3600;sec<10*3600;sec+=15)assert.equal(owner.update(at(day,sec),{...options,blocked:true,kind}),null);let resumed=null;for(let sec=36000;sec<36600;sec+=15){resumed=owner.update(at(day,sec),options);if(resumed)break}assert.ok(resumed,kind);assert.ok(resumed.start>=36000)}
});
test('interrupting approach or speech mutes lines, preserves proven return legs, and leaves that set eligible for retry',()=>{
 for(const phase of ['approach','talk']){const owner=s.createStaffChats();let e;for(let sec=32400;sec<36000;sec+=15)if(e=owner.update(at(day,sec),options))break;assert.ok(e);const when=phase==='approach'?e.start+.1:e.performStart+.1,prior=plain(e.people);owner.cancel(at(day,when));const cancelled=owner.update(at(day,when),{...options,blocked:true});assert.ok(cancelled.staffChat.cancelled);assert.deepEqual(plain(cancelled.people),prior);assert.equal(cancelled.end,e.end);assert.equal(owner.update(at(day,e.end+.1),{...options,blocked:true}),null)}
});
test('one shared active conversation, exact 2.2s line windows, canonical travel sample, and return to original homes',()=>{
 for(const e of events){assert.ok(e.people.length>=1&&e.people.length<=2);assert.ok(Math.abs(e.performEnd-e.performStart-e.staffChat.lines.length*2.2)<1e-7);for(const t of e.people){const initial=s.stateAt(e,t,e.start),talk=s.stateAt(e,t,e.performStart+.1),end=s.stateAt(e,t,e.end+.001);assert.equal(initial.floor,t.home.floor);assert.equal(talk.floor,e.card.floor);assert.equal(talk.walking,false);assert.equal(end.seat.anchor,t.home.anchorId);for(const leg of [...t.out,...t.back]){const mid=s.stateAt(e,t,(leg.start+leg.end)/2);if(scene.anchors.get(leg.from).floor===scene.anchors.get(leg.to).floor){assert.equal(mid.walking,true);assert.ok(mid.position.every(Number.isFinite))}}}}
 for(let i=1;i<events.length;i++)assert.ok(events[i].start>=events[i-1].end,'one active event globally');
});
test('KST date seed and least-used rotation are deterministic without persistent state',()=>{
 assert.deepEqual(simulate(),events);assert.notDeepEqual(simulate('2026-11-10').map(e=>[e.staffChat.id,e.start]),events.map(e=>[e.staffChat.id,e.start]));const owner=s.createStaffChats(),fresh=s.createStaffChats();owner.update(at(day,36000),options);for(let sec=32400;sec<32600;sec+=15)assert.deepEqual(plain(owner.update(at('2026-11-10',sec),options)),plain(fresh.update(at('2026-11-10',sec),options)));
});
function mounted(width=1280){const callbacks=[],writes=[];let clock=at(day,32400).getTime();const deny=(...args)=>{writes.push(args);throw Error('unexpected persistence')};
 const f=fixture('09:00',false,()=>true,table,{innerWidth:width,HaniOfficeV2Assets:{...assets,spritesV3:JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json'))},setTimeout:(fn,ms)=>{callbacks.push({fn,due:clock+ms,active:true});return callbacks.length},clearTimeout:id=>{if(callbacks[id-1])callbacks[id-1].active=false},localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny}});f.context.window.HaniOfficePresence={chairman:'absent'};
 const tick=f.timers.find(t=>t.ms===100).fn,bubble=f.map.children.find(p=>p.className==='hani-office-character-bubble');function step(sec){clock=at(day,sec).getTime();f.setDateTime(new Date(clock).toISOString());for(const t of callbacks.filter(p=>p.active&&p.due<=clock)){t.active=false;t.fn()}tick()}
 step(32400);return {...f,step,bubble,writes};}
test('mounted desktop and phone show the original conversation through one persistent bubble and existing actor/travel slots',()=>{
 for(const width of [1280,390]){const f=mounted(width),slots=f.ids.get('haniOfficeActors').children.slice(),shown=[];f.click('3f');for(let sec=32400;sec<36000;sec+=.2){f.step(sec);const text=f.bubble.children[0].textContent;if(!f.bubble.hidden&&text.includes(' · ')&&s.staffChatLines.find(p=>p.id==='chat-07').lines.some(l=>text.endsWith(l.text))&&shown.at(-1)?.text!==text)shown.push({sec,text});if(shown.length>=4)break;assert.ok(slots.filter(a=>a.dataset.speaking==='true').length<=1)}const pair=s.staffChatLines.find(p=>p.id==='chat-07');assert.deepEqual(shown.map(p=>p.text),plain(pair.lines.map(l=>pair[l.speaker]+' · '+l.text)));for(let i=1;i<4;i++)assert.ok(Math.abs(shown[i].sec-shown[i-1].sec-2.2)<.25);assert.deepEqual(f.ids.get('haniOfficeActors').children,slots);assert.equal(f.timers.length,2);assert.deepEqual(f.writes,[])}
});
test('mounted cafe alternates the original barista slot and Hani for all three lines, then returns Hani without writes',async()=>{
 for(const width of [1280,390]){const f=mounted(width),slots=f.ids.get('haniOfficeActors').children.slice(),pair=s.staffChatLines.find(p=>p.id==='chat-25');f.click('1f');for(let i=0;i<20;i++)await Promise.resolve();let event;
  for(let sec=32400;sec<39600;sec+=15){f.step(sec);event=slots.map(a=>a.officeSchedule?.event).find(e=>e?.staffChat?.id===pair.id);if(event)break}assert.ok(event,'actual cafe booking');const shown=[];
  for(let sec=event.performStart;sec<event.performEnd+.1;sec+=.1){f.step(sec);const text=f.bubble.children[0].textContent;if(!f.bubble.hidden&&pair.lines.some(l=>text.endsWith(l.text))&&shown.at(-1)?.text!==text)shown.push({sec,text});assert.ok(slots.filter(a=>a.dataset.speaking==='true').length<=1)}
  assert.deepEqual(shown.map(p=>p.text),plain(pair.lines.map(l=>pair[l.speaker]+' · '+l.text)));for(let i=1;i<3;i++)assert.ok(Math.abs(shown[i].sec-shown[i-1].sec-2.2)<.2);f.step(event.end+.3);assert.notEqual(slots.find(a=>a.dataset.person==='hani').officeSchedule?.event?.id,event.id);assert.deepEqual(f.ids.get('haniOfficeActors').children,slots);assert.deepEqual(f.writes,[]);
 }
});
test('raw source adds zero timer/listener/storage/cloud references and keeps runtime closure and CSS/index/main unchanged',async()=>{
 const source=fs.readFileSync('hani-office-live.js','utf8'),base=restoreStaffChats278Source(source),count=(s,re)=>[...s.matchAll(re)].length;
 const fit=source.slice(source.indexOf('  function fitStatusLabels('),source.indexOf('  if(buildingChairmanSlot())people.push'));assert.ok(fit.includes("bubbleSelection?.kidsVisit||bubbleSelection?.staffChat)){const b=actorBubble.getBoundingClientRect();"));assert.equal((fit.match(/getBoundingClientRect/g)||[]).length,6);
 for(const re of [/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:localStorage|sessionStorage)\b/g,/\bsupabase\b/g])assert.equal(count(source,re),count(base,re));
 for(const file of ['hani-office-live.css','index.html','hani-main.js'])assert.deepEqual(file==='hani-office-live.css'?Buffer.from(projectPrePatrolSource(fs.readFileSync(file,'utf8'),file)):Buffer.from(outer284.projectPreSaveGuard286Source(readRawLifeFile(file).toString('utf8'),file)),fs.readFileSync('artifacts/kids-visit/baseline/'+file));
 const read=f=>readRawLifeFile(f),closure=await resolveRuntimeClosure({exists:fs.existsSync,read}),prior=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>f==='hani-office-live.js'?base:read(f)});assert.deepEqual(closure.files,prior.files);assert.deepEqual(closure.missing,[]);console.log('staff-chat closure '+closure.files.length);
});
