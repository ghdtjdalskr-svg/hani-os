import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture as mountFixture} from './hani-building-206-engine.test.mjs';import {assets} from './hani-office-v2-fixture.mjs';
import {restoreKids278Source,projectPreKidsSource,projectPreVisitsSource,projectPreStaffChatSource} from './hani-office-chairman-patrol-278-source.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const fixture=(...args)=>{while(args.length<5)args.push(undefined);return mountFixture(...args,projectPreVisitsSource)};
const {scene,table}=loadScene(),r=scene.residents,plain=x=>JSON.parse(JSON.stringify(x)),day='2026-11-07',options={chairmanPresent:true};
const chair=(floor='4f',extra={})=>({floors:[{id:floor,people:[{id:'seongmin',floor,position:[51,70],pose:'sitting',walking:false,facing:'right',...extra}]}]});
const kids=(sec,snap=chair(),reduced=false)=>r.companionSnapshot(at(day,sec),snap,true,reduced).filter(p=>p.kid);
const delta=(a,b)=>Math.hypot((a[0]-b[0])*scene.art.width/100,(a[1]-b[1])*scene.art.height/100);

test('live 60s desk and patrol snapshots give sister >=5 real actions, brother >=1 and fewer; all safe and deterministic',()=>{
 const e=scene.scheduler.blockPlan(day,0,scene.scheduler.plan(day,options),options).find(e=>e.patrol),records=[];
 for(const [label,start,snapshot]of [['desk',36000,sec=>scene.snapshot(at(day,sec),options)],['patrol',e.performStart+30,sec=>scene.snapshot(at(day,sec),options)]]){
  const keys=[new Set(),new Set()],positions=[new Set(),new Set()];
  for(let t=0;t<=60;t+=.5){const sec=start+t,snap=snapshot(sec),states=kids(sec,snap);assert.equal(states.length,2);
   for(const [i,p]of states.entries()){keys[i].add(p.activity.key);positions[i].add(p.position.map(n=>n.toFixed(2)).join(','));assert.ok(r.companionSafe(p.floor,p.position,true));assert.ok(p.activity.period>=(i?6:20)&&p.activity.period<=(i?12:40));assert.deepEqual(plain(p),plain(kids(sec,snap)[i]));}
  }
  assert.ok(keys[1].size-1>=5,label);assert.ok(keys[0].size-1>=1);assert.ok(keys[0].size<keys[1].size);assert.ok(positions[1].size>5,'sister visibly moves');assert.ok(positions[0].size>1,'brother actually changes reading position');records.push({label,brotherActions:keys[0].size-1,sisterActions:keys[1].size-1,positions:positions.map(p=>p.size)});
 }console.log('kids 60s evidence '+JSON.stringify(records));
});
test('all six sister behaviors and brother caution execute using existing poses; excursion returns and routes avoid furniture',()=>{
 const seen=new Set(),poses=new Set();let returned=false;
 for(let t=36000;t<36240;t+=.2){const states=kids(t,chair('5f'));for(const p of states){seen.add(p.activity.kind);poses.add(p.pose);assert.ok(r.companionSafe(p.floor,p.position,true));}const a=states[1];if(a.activity.elapsed>a.activity.period*.85&&['explore','visit','orbit'].includes(a.activity.kind))returned=true;}
 for(const kind of ['bounce','wave','explore','book','check','beside'])assert.ok(seen.has(kind),kind);assert.ok(returned);for(const pose of poses)assert.match(pose,/^(standing|sitting|walk-a|walk-b)$/);
});
test('reduced motion has no bounce/lean/spin and retains slower continuous position changes',()=>{
 const a=[],b=[];for(let t=36000;t<36060;t+=.1){a.push(kids(t,chair('5f'),true)[1]);b.push(kids(t,chair('5f'))[1]);}
 assert.ok(a.every(p=>!p.motion&&!p.walking));assert.ok(new Set(a.map(p=>p.position.join(','))).size>10);
 const sameCycle=(rows)=>rows.slice(1).flatMap((p,i)=>p.activity.key===rows[i].activity.key?[delta(p.position,rows[i].position)]:[]);
 assert.ok(Math.max(...sameCycle(a))<Math.max(...sameCycle(b)),'slower reduced-motion travel');
});
test('live walking leads and looks back while brother follows, floor/presence remain authoritative and pets unchanged',()=>{
 let looked=false,led=false;const frozen=loadScene({transform:projectPreKidsSource}).scene.residents;
 for(let t=50400;t<50420;t+=.2)for(const facing of ['left','right']){const snap=chair('5f',{walking:true,pose:'walk-a',facing,patrol:{window:50400},state:'GOING'}),states=kids(t,snap),sister=states[1];assert.ok(states.every(p=>p.floor==='5f'));assert.equal(states[0].activity.kind,'follow');assert.equal(sister.activity.kind,'lead-look');if(sister.facing!==facing)looked=true;if((sister.position[0]-51)*(facing==='left'?-1:1)>0)led=true;}
 assert.ok(looked&&led);assert.equal(kids(36000,{floors:[]}).length,0);
 for(const sec of [36000,36007,36030]){const snap=chair(),now=at(day,sec);assert.deepEqual(plain(r.companionSnapshot(now,snap).filter(p=>p.pet)),plain(frozen.companionSnapshot(now,snap).filter(p=>p.pet)));}
});
test('latest real patrol departure/transfer/arrival/return paths retain chairman ownership and safe siblings',()=>{
 const events=scene.scheduler.blockPlan(day,0,scene.scheduler.plan(day,options),options).filter(e=>e.patrol);
 for(const e of events)for(const sec of [e.start,e.performStart+1,e.performStart+30,e.performEnd+1,e.end-.001,...e.people[0].out.flatMap(l=>[l.start+.001,(l.start+l.end)/2,l.end-.001])]){
  const snap=scene.snapshot(at(day,sec),options),original=JSON.stringify(snap),ceo=snap.floors.flatMap(f=>f.people).find(p=>p.id==='seongmin'),states=kids(sec,snap);assert.equal(states.length,2);assert.equal(JSON.stringify(snap),original);
  for(const p of states){assert.equal(p.floor,ceo.floor);assert.ok(r.companionSafe(p.floor,p.position,true));assert.ok(['standing','sitting','walk-a','walk-b'].includes(p.pose));}if(ceo.walking)assert.equal(states[0].walking,true);
  const slow=kids(sec,snap,true);assert.ok(slow.every(p=>!p.walking&&!p.motion));
 }
});
test('same-floor pet visit names the actual animal; staff visit gives the actual peer a short reaction',()=>{
 let animal=false,reaction=false;for(let t=36000;t<36120;t+=.25){
  const snap=chair('5f');snap.floors[0].people.push({id:'hani',floor:'5f',position:[38,72],walking:false});
  const state=kids(t,snap)[1];if(state.reaction?.line==='수연아, 반가워! 천천히 다녀와.'){assert.equal(state.reaction.id,'hani');assert.equal(state.activity.partnerId,'hani');reaction=true;}
  const other=chair('5f');other.floors[0].people.push({id:'companion-penguin',pet:true,floor:'5f',position:[38,72],walking:false});const p=kids(t,other)[1];if(p.activity.partnerId==='companion-penguin'){assert.equal(p.scene.line,'펭귄이다!!');animal=true;}
 }assert.ok(animal);assert.ok(reaction);
});
test('latest mounted slots rotate every new dialogue, retain taps/bubble, reduced motion, zero writes/timer/listener additions',()=>{
 const writes=[],deny=(...args)=>{writes.push(args);throw Error('forbidden persistence')},manifest=JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json'));
 for(const reduced of [false,true]){
  const f=fixture('10:00',reduced,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:manifest},setTimeout:()=>0,localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny}});f.context.window.HaniOfficePresence={chairman:'active'};f.setDateTime(at(day,36002).toISOString());f.click('4f');const tick=f.timers.find(t=>t.ms===100).fn;tick();
  const slots=f.ids.get('haniOfficeActors').children.slice(),bubble=f.map.children.find(a=>a.className==='hani-office-character-bubble');
  for(const person of r.companions.filter(p=>p.kid)){const actor=slots.find(a=>a.dataset.person===person.id);assert.equal(actor.hidden,false);for(const line of person.lines){f.ids.get('haniOfficeActors').events.click({target:actor,isTrusted:true});assert.ok(bubble.children[0].textContent.includes(line));tick();assert.ok(bubble.children[0].textContent.includes(line));}}
  for(let i=0;i<60;i++){f.setDateTime(at(day,36003+i).toISOString());tick();if(reduced)for(const actor of slots.filter(a=>a.dataset.person?.startsWith('kid-')))assert.equal(actor.style['--pet-bob'],'0px');}
  f.click('1f');f.click('4f');assert.deepEqual(f.ids.get('haniOfficeActors').children,slots);assert.equal(f.timers.length,2);
 }assert.deepEqual(writes,[]);
 const source=fs.readFileSync('hani-office-live.js','utf8'),base=restoreKids278Source(source),count=(s,re)=>[...s.matchAll(re)].length;
 for(const re of [/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:localStorage|sessionStorage)\b/g,/\bsupabase\b/g])assert.equal(count(source,re),count(base,re));
 const projected=projectPreStaffChatSource(source);assert.equal(projected.slice(projected.indexOf('  function createScheduler('),projected.indexOf('  function snapshot(now=new Date(),options={})')),base.slice(base.indexOf('  function createScheduler('),base.indexOf('  function snapshot(now=new Date(),options={})')));
 assert.equal(r.companions.find(p=>p.id==='kid-suyeon').lines.length,10);assert.equal(r.companions.find(p=>p.id==='kid-suhyeon').lines.length,6);
});
test('kids add no runtime files or atlas/CSS bytes',async()=>{
 const read=f=>fs.readFileSync(f),a=await resolveRuntimeClosure({exists:fs.existsSync,read}),b=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>f==='hani-office-live.js'?restoreKids278Source(read(f).toString()):read(f)});assert.deepEqual(a.files,b.files);assert.deepEqual(a.missing,[]);assert.equal(fs.readFileSync('hani-office-live.css','utf8'),fs.readFileSync('artifacts/kids-lively/baseline/hani-office-live.css','utf8'));
});

test('actual staff response survives the child bubble duration through the single mounted owner',()=>{
 const manifest=JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json')),callbacks=[];let clock=at(day,45130).getTime();
 const f=fixture('10:00',false,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:manifest},setTimeout:(fn,ms)=>{callbacks.push({fn,due:clock+ms,active:true});return callbacks.length},clearTimeout:id=>{if(callbacks[id-1])callbacks[id-1].active=false}});
 f.context.window.HaniOfficePresence={chairman:'active'};const bubble=f.map.children.find(a=>a.className==='hani-office-character-bubble'),tick=f.timers.find(t=>t.ms===100).fn,shown=[];
 for(let t=45130;t<=45170;t+=.25){clock=at(day,t).getTime();f.setDateTime(new Date(clock).toISOString());for(const timer of callbacks.filter(p=>p.active&&p.due<=clock)){timer.active=false;timer.fn()}if(t===45130)f.click('3f');tick();if(!bubble.hidden)shown.push(bubble.children[0].textContent);}
 assert.ok(shown.some(p=>p.includes('나 왔어! 같이 놀자!')),JSON.stringify([...new Set(shown)]));assert.ok(shown.some(p=>p.includes('수연아, 반가워! 천천히 다녀와.')),JSON.stringify([...new Set(shown)]));assert.equal(f.timers.length,2);
});
