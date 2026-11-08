import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {projectPrePatrolSource} from './hani-office-chairman-patrol-278-source.mjs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';import {assets}from './hani-office-v2-fixture.mjs';
import {restoreVisits278Source,projectPreStaffChatSource}from './hani-office-chairman-patrol-278-source.mjs';import {resolveRuntimeClosure}from './hani-office-kids-pose-b-closure.mjs';
const {scene,table}=loadScene(),r=scene.residents,day='2026-11-07',plain=x=>JSON.parse(JSON.stringify(x)),options={chairmanPresent:true};
function frame(sec,staff=scene.snapshot(at(day,sec),options),reduced=false){const now=at(day,sec),existing=r.snapshot(now,staff),states=[...existing,...r.companionSnapshot(now,staff,true,reduced,existing)];return {now,staff,states}}
const targets=new Set(),visits=[];
test('actual 10 minute schedule completes >=8 visits with >=4 distinct people and returns both children safely',()=>{
 const owner=r.createKidsVisits(),completed=new Set();let previous=null;
 for(let sec=36000;sec<=36600;sec+=.25){const f=frame(sec),visit=owner.update(f.now,f.staff,f.states);if(visit){targets.add(visit.actorId);if(!visits.some(p=>p.key===visit.key))visits.push({key:visit.key,actorId:visit.actorId,started:sec});assert.ok(f.states.filter(p=>p.kid).every(p=>r.companionSafe(p.floor,p.position,true)));if(visit.line){assert.equal(visit.line.text,visit.lines[visit.index].text);assert.ok(visit.index>=0&&visit.index<5)}}if(previous&&!visit)completed.add(previous);previous=visit?.key;}
 assert.ok(completed.size>=8,completed.size);assert.ok(targets.size>=4,[...targets].join(','));assert.ok(visits.slice(1).every((p,i)=>p.started-visits[i].started>=30&&p.started-visits[i].started<=60));console.log('10m visits '+JSON.stringify({started:visits.length,completed:completed.size,targets:[...targets]}));
});
test('each actual patrol floor completes >=3 visits, diverse when available, with Seoyun first on 3F once a day',()=>{
 const owner=r.createKidsVisits(),events=scene.scheduler.blockPlan(day,0,scene.scheduler.plan(day,options),options).filter(e=>e.patrol),evidence=[];
 for(const e of events){const seen=new Map();for(let sec=e.performStart;sec<Math.min(e.performEnd,e.performStart+220);sec+=1){const f=frame(sec),visit=owner.update(f.now,f.staff,f.states);if(visit?.line)seen.set(visit.key,visit.actorId)}const distinct=[...new Set(seen.values())];assert.ok(seen.size>=3,e.card.floor+' visits '+seen.size);if(e.card.floor==='5f')assert.deepEqual(distinct,['pet-cat'],'actual rooftop has only one available mapped target');else assert.ok(distinct.length>=3,e.card.floor+' '+distinct.join(','));if(e.card.floor==='3f')assert.equal(distinct[0],'seoyun');evidence.push({floor:e.card.floor,visits:seen.size,targets:distinct});}console.log('patrol '+JSON.stringify(evidence));
});
test('all 25 source sets preserve text and map to actual roster, resident or the single day/night barista slot',()=>{
 const pairs=JSON.parse(fs.readFileSync('docs/drafts/kids-hidden-lines-v1.json','utf8')).pairs;assert.equal(r.kidsVisitLines.length,25);const known=new Set([...scene.canon.people.map(p=>p.id),...r.people.map(p=>p.id),'iseul','eunha']);
 for(const p of r.kidsVisitLines){assert.ok(known.has(p.actorId),p.staffId+' -> '+p.actorId);const original=pairs.find(q=>q.staffId===p.staffId);assert.deepEqual(plain(p.lines),original.lines);assert.deepEqual(plain(p.rare),original.rare);assert.equal(p.staffName,original.staffName)}
 for(const [id,actorId]of [['suyeon_staff','sooyeon'],['dohyun','dohyun'],['chaewon','taeo'],['yunseul','yoonseul'],['isle','iseul'],['bori','pet-bori']])assert.equal(r.kidsVisitLines.find(p=>p.staffId===id).actorId,actorId);
});
test('nearest same-floor target wins a child tap and no target retains fallback; no staff on another floor can win',()=>{
 const f=frame(36010),child=f.states.find(p=>p.id==='kid-suyeon'),floor=child.floor,staff={floors:[{id:floor,people:[f.staff.floors.flatMap(p=>p.people).find(p=>p.id==='seongmin'),{id:'yuna',floor,position:[child.position[0]-7,child.position[1]],walking:false},{id:'seoyun',floor:'3f',position:child.position}]}]},owner=r.createKidsVisits();
 const visit=owner.request(f.now,staff,f.states,'kid-suyeon');assert.equal(visit?.actorId,'yuna');
 const absent={floors:[{id:floor,people:staff.floors[0].people.slice(0,1)}]};assert.equal(r.createKidsVisits().request(f.now,absent,f.states.filter(p=>p.kid),'kid-suhyeon'),null);
});
test('rare is exactly one in ten consecutive seeded turns and comes after all four unchanged normal lines',()=>{
 const f=frame(36010),chair=f.staff.floors.flatMap(p=>p.people).find(p=>p.id==='seongmin'),child=f.states.find(p=>p.id==='kid-suyeon'),staff={floors:[{id:chair.floor,people:[chair,{id:'yuna',floor:chair.floor,position:[child.position[0]-7,child.position[1]],walking:false}]}]},owner=r.createKidsVisits();let rare=0;
 for(let i=0;i<100;i++){const v=owner.request(at(day,36010+i),staff,plain(f.states.filter(p=>p.kid)),'kid-suyeon');assert.ok(v);if(v.rare){rare++;assert.equal(v.lines.length,5);assert.equal(v.lines[4].text,r.kidsVisitLines.find(p=>p.actorId==='yuna').rare.text)}else assert.equal(v.lines.length,4);assert.deepEqual(plain(v.lines.slice(0,4).map(p=>p.text)),plain(r.kidsVisitLines.find(p=>p.actorId==='yuna').lines.map(p=>p.text)));}assert.equal(rare,10);
});
test('KST date reset restores seeded order; reduced motion shares dialogues with zero bounce and real movement',()=>{
 for(const reduced of [false,true]){const a=r.createKidsVisits(),b=r.createKidsVisits();let moved=false,last=null;for(let sec=36000;sec<36100;sec+=.5){const f=frame(sec,undefined,reduced),g=frame(sec,undefined,reduced),x=a.update(f.now,f.staff,f.states,reduced),y=b.update(g.now,g.staff,g.states,reduced);assert.deepEqual(plain(x),plain(y));if(x){const child=f.states.find(p=>p.id==='kid-suyeon');if(last&&last!==child.position.join(','))moved=true;last=child.position.join(',');if(reduced){assert.equal(child.walking,false);assert.equal(child.motion,undefined)}}}assert.ok(moved)}
 const owner=r.createKidsVisits(),f=frame(36000);owner.update(f.now,f.staff,f.states);owner.update(at('2026-11-08',36000),f.staff,f.states);const fresh=r.createKidsVisits();for(const sec of [36001,36061]){const f=frame(sec);assert.deepEqual(plain(owner.update(f.now,f.staff,f.states)),plain(fresh.update(f.now,f.staff,plain(f.states))))}
});
function mounted(width=1280){const callbacks=[],writes=[];let clock=at(day,36000).getTime();const deny=(...args)=>{writes.push(args);throw Error('forbidden persistence')};const manifest=JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json'));
 const f=fixture('10:00',false,()=>true,table,{innerWidth:width,HaniOfficeV2Assets:{...assets,spritesV3:manifest},setTimeout:(fn,ms)=>{callbacks.push({fn,due:clock+ms,active:true});return callbacks.length},clearTimeout:id=>{if(callbacks[id-1])callbacks[id-1].active=false},localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny}});f.context.window.HaniOfficePresence={chairman:'active'};
 const tick=f.timers.find(t=>t.ms===100).fn,bubble=f.map.children.find(p=>p.className==='hani-office-character-bubble');function step(sec){clock=at(day,sec).getTime();f.setDateTime(new Date(clock).toISOString());for(const t of callbacks.filter(p=>p.active&&p.due<=clock)){t.active=false;t.fn()}tick();}
 step(36000);f.click('4f');return {...f,step,bubble,writes};}
test('mounted desktop/phone renders every visit line at ~2.2s on one bubble, using persistent actor slots and zero writes',()=>{
 for(const width of [1280,390]){const f=mounted(width),slots=f.ids.get('haniOfficeActors').children.slice(),shown=[];for(let sec=36000;sec<36065;sec+=.1){f.step(sec);const kids=slots.filter(a=>a.dataset.person?.startsWith('kid-'));if(kids.some(a=>a.officeResidentState?.visit?.phase==='talk')&&!f.bubble.hidden){const text=f.bubble.children[0].textContent;if(shown.at(-1)?.text!==text)shown.push({sec,text});}assert.ok(slots.filter(a=>a.dataset.speaking==='true').length<=1)}const pair=r.kidsVisitLines.find(p=>p.actorId==='mir');assert.deepEqual(shown.slice(0,4).map(p=>p.text),plain(pair.lines.map(l=>(l.speaker==='staff'?'미르':l.speaker==='suyeon'?'수연':'수현')+' · '+l.text)));for(let i=1;i<4;i++)assert.ok(Math.abs(shown[i].sec-shown[i-1].sec-2.2)<.15);assert.deepEqual(f.ids.get('haniOfficeActors').children,slots);assert.deepEqual(f.writes,[]);assert.equal(f.timers.length,2)}
});
test('raw mounted child taps choose a nearby visit; when none can be reached the original tap line still appears',()=>{
 const f=mounted(),actor=f.ids.get('haniOfficeActors').children.find(a=>a.dataset.person==='kid-suyeon');for(let sec=36000;sec<=36040;sec+=.5)f.step(sec);const previous=actor.officeResidentState.visit?.key;assert.ok(previous);
 f.ids.get('haniOfficeActors').events.click({target:actor,isTrusted:true});assert.ok(actor.officeResidentState.visit,'actual delegated click starts a visit');assert.notEqual(actor.officeResidentState.visit.key,previous);assert.equal(actor.officeResidentState.visit.actorId,'mir');
 let spoken=false;for(let sec=36040;sec<36052;sec+=.25){f.step(sec);if(!f.bubble.hidden&&f.bubble.children[0].textContent.includes(' · '))spoken=true}assert.ok(spoken);
 const g=mounted(),kid=g.ids.get('haniOfficeActors').children.find(a=>a.dataset.person==='kid-suyeon');g.step(36002);kid.officeResidentState.position=[99,99];g.ids.get('haniOfficeActors').events.click({target:kid,isTrusted:true});assert.equal(g.bubble.children[0].textContent,'수연 · 아빠아아!');assert.deepEqual(g.writes,[]);
});
test('moving target cancels speech and retraces the furniture-safe approach; chairman absence and floor transfers cancel ownership',()=>{
 const owner=r.createKidsVisits();let active=null,last;
 for(let sec=36000;sec<36040;sec+=.25){const f=frame(sec);active=owner.update(f.now,f.staff,f.states);if(active){last=f;break}}
 assert.ok(active);const started=active.started;let cancelled=false;
 for(let sec=36034;sec<36045;sec+=.25){const f=frame(sec);const target=f.staff.floors.flatMap(p=>p.people).find(p=>p.id===active.actorId);if(target)target.walking=true;const v=owner.update(f.now,f.staff,f.states);if(v){cancelled||=v.cancelled;assert.equal(v.line,null);for(const k of f.states.filter(p=>p.kid))assert.ok(r.companionSafe(k.floor,k.position,true));}}
 assert.ok(cancelled);const f=frame(36050);assert.equal(owner.update(f.now,{floors:[]},f.states.filter(p=>!p.kid)),null);assert.ok(started);
});
test('raw runtime preserves timer/listener/storage/cloud counts, all scheduler bytes, CSS/index/main and <=200 closure files',async()=>{
 const source=fs.readFileSync('hani-office-live.js','utf8'),base=restoreVisits278Source(source),count=(s,re)=>[...s.matchAll(re)].length;
 for(const re of [/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:localStorage|sessionStorage)\b/g,/\bsupabase\b/g])assert.equal(count(source,re),count(base,re));
 const scheduler=s=>{s=projectPreStaffChatSource(s);return s.slice(s.indexOf('  function createScheduler('),s.indexOf('  function snapshot(now=new Date(),options={})'))};assert.equal(scheduler(source),scheduler(base));for(const file of ['hani-office-live.css','index.html','hani-main.js'])assert.deepEqual(file==='hani-office-live.css'?Buffer.from(projectPrePatrolSource(fs.readFileSync(file,'utf8'),file)):fs.readFileSync(file),fs.readFileSync('artifacts/kids-visit/baseline/'+file));
 const read=f=>fs.readFileSync(f),closure=await resolveRuntimeClosure({exists:fs.existsSync,read}),prior=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>f==='hani-office-live.js'?base:read(f)});assert.deepEqual(closure.files,prior.files);assert.deepEqual(closure.missing,[]);assert.ok(closure.files.length<=200);console.log('closure '+closure.files.length);
});
