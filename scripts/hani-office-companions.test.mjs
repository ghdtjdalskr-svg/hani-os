import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {restoreCompanions276Source} from './hani-office-companions-276-source.mjs';
import {projectPrePatrolSource} from './hani-office-chairman-patrol-278-source.mjs';
const read=f=>projectPrePatrolSource(fs.readFileSync(f,'utf8'),f),plain=x=>JSON.parse(JSON.stringify(x)),{scene,table}=loadScene({transform:projectPrePatrolSource}),r=scene.residents;
const chair=(floor='4f',extra={})=>({floors:[{id:floor,people:[{id:'seongmin',floor,position:[51,66],pose:'standing',walking:false,...extra}]}]});
const ids=s=>s.map(p=>p.id),pets=r.companions.filter(p=>p.pet),kids=r.companions.filter(p=>p.kid);

test('KST calendar weekdays select exactly one companion Monday through Friday, weekend selects siblings and five independent pets',()=>{
 for(let d=2;d<=8;d++){const now=new Date('2026-11-'+String(d).padStart(2,'0')+'T10:00:00+09:00'),states=r.companionSnapshot(now,chair());assert.deepEqual(plain(ids(states)),d<7?[pets[d-2].id]:plain(ids(r.companions)));assert.ok(states.filter(p=>p.kid||d<7).every(p=>p.following&&p.floor==='4f'));}
});
test('KST midnight boundaries use the calendar day including Friday/Saturday and Sunday/Monday rather than the resident 07:00 day',()=>{
 for(const [utc,want] of [['2026-11-01T14:59:59.999Z',7],['2026-11-01T15:00:00Z','companion-frog'],['2026-11-02T14:59:59.999Z','companion-frog'],['2026-11-02T15:00:00Z','companion-penguin'],['2026-11-06T14:59:59.999Z','companion-fox'],['2026-11-06T15:00:00Z',7],['2026-11-08T14:59:59.999Z',7],['2026-11-08T15:00:00Z','companion-frog']]){const states=r.companionSnapshot(new Date(utc),chair());if(typeof want==='number')assert.equal(states.length,want);else assert.deepEqual(plain(ids(states)),[want]);}
});
test('weekday absent chairman hides companions; weekend siblings hide but all five pets remain',()=>{
 assert.deepEqual(plain(r.companionSnapshot(new Date('2026-11-02T10:00:00+09:00'),{floors:[]})),[]);
 for(const day of ['2026-11-07','2026-11-08'])assert.deepEqual(plain(ids(r.companionSnapshot(new Date(day+'T10:00:00+09:00'),{floors:[]}))),plain(ids(pets)));
 assert.deepEqual(plain(r.companionSnapshot(new Date(),chair(),false)),[]);
});
test('followers change floors with chairman, sit next to seated chairman, and use live walk frames without changing staff snapshot',()=>{
 for(const day of ['2026-11-02','2026-11-06','2026-11-07'])for(const floor of scene.floors.map(f=>f.id)){
  const now=new Date(day+'T10:00:00+09:00'),staff=chair(floor,{pose:'sitting'}),before=JSON.stringify(staff),states=r.companionSnapshot(now,staff).filter(p=>p.following);assert.equal(states.length,day.endsWith('07')?2:1);assert.ok(states.every(p=>p.floor===floor&&p.pose==='sitting'));assert.equal(JSON.stringify(staff),before);
  const walking=r.companionSnapshot(now,chair(floor,{walking:true})).filter(p=>p.following);assert.ok(walking.every(p=>p.walking&&/^walk-/.test(p.pose)));
  assert.ok(r.companionSnapshot(now,chair(floor,{walking:true}),true,true).every(p=>!p.walking));
 }
});
test('real scheduled chairman desk keeps all followers present, beside actual furniture without overlapping footprints',()=>{
 for(const day of ['2026-11-02','2026-11-06','2026-11-07']){const now=new Date(day+'T10:00:00+09:00'),staff=scene.snapshot(now,{chairmanPresent:true}),states=r.companionSnapshot(now,staff).filter(p=>p.following),ceo=staff.floors.flatMap(f=>f.people).find(p=>p.id==='seongmin'),v=ceo.position||[ceo.seat.x,ceo.seat.y];assert.equal(states.length,day.endsWith('07')?2:1);for(const p of states){assert.ok(r.companionSafe(p.floor,p.position,p.kid));assert.ok(Math.hypot((p.position[0]-v[0])*scene.art.width/100,(p.position[1]-v[1])*scene.art.height/100)<300);assert.equal(p.pose,'sitting');}}
});
test('weekend penguin patrol visits all floors, otter stays near 1F cafe, and every animal has actual movement',()=>{
 const floors=new Set(),moved=new Set();for(let t=36000;t<40500;t+=.5){const states=r.companionSnapshot(at('2026-11-07',t),{floors:[]});assert.equal(states.length,5);floors.add(states.find(p=>p.id==='companion-penguin').floor);assert.equal(states.find(p=>p.id==='companion-otter').floor,'1f');for(const p of states)if(p.walking)moved.add(p.id);}
 assert.equal(floors.size,5);assert.deepEqual([...moved].sort(),plain(ids(pets)).sort());
});
test('sibling proximity gives occasional reactions only to nearby present weekend staff',()=>{
 const staff=chair('4f'),base=r.companionSnapshot(at('2026-11-07',36000),staff).find(p=>p.kid);staff.floors[0].people.push({id:'hani',floor:'4f',position:[base.position[0]+3,base.position[1]],walking:false});
 assert.ok(r.companionSnapshot(at('2026-11-07',36000),staff).some(p=>p.reaction?.line==='어머, 수연이 왔어?'));assert.ok(!r.companionSnapshot(at('2026-11-07',36006),staff).some(p=>p.reaction));assert.ok(!r.companionSnapshot(at('2026-11-02',36000),staff).some(p=>p.reaction));assert.equal(r.companionReactions.length,5);
});
test('shared atlas cells and sit frames encode book-reading brother and waving sister; all dialogues retain approved exact lines',()=>{
 assert.deepEqual(plain(kids.map(p=>p.lines)),[['…지금 말고.','가방? 그냥 들어 준 거야.','아빠, 얘 좀 떼 줘.'],['아빠아아!','나 커서 아빠랑 결혼할 거야!','오빠는 맨날 아닌 척해!']]);
 for(const p of r.companions){const atlas=r.companionAtlas(p);assert.deepEqual(plain(atlas.cell),[96,144]);assert.equal(atlas.frames.length,p.kid?8:10);assert.ok(atlas.frames.some(f=>f.name==='sitting-left'));assert.ok(atlas.frames.some(f=>f.name==='walk-b-right'));assert.equal(p.lines.length,3);if(p.pet)assert.ok(p.lines.every(l=>l.includes('회장님')));}
});
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('actual persistent DOM slots rotate all seven tap dialogues via existing bubble with zero storage writes and survive floor changes',async()=>{
 const writes=[],deny=(...a)=>{writes.push(a);throw Error('forbidden companion persistence')},manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
 const f=fixture('10:00',false,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:manifest},HaniOfficePresence:{chairman:'active'},localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny},setTimeout:()=>0},projectPrePatrolSource);
 f.context.window.HaniOfficePresence={chairman:'active'};const all=f.ids.get('haniOfficeActors').children,slots=all.filter(a=>a.dataset.companion==='true');assert.equal(slots.length,7);const tick=()=>f.timers.find(t=>t.ms===100).fn();
 for(const [d,want] of [[2,pets[0]],[3,pets[1]],[4,pets[2]],[5,pets[3]],[6,pets[4]],[7,kids[0]],[7,kids[1]]]){
  f.setDateTime('2026-11-'+String(d).padStart(2,'0')+'T10:02:20+09:00');f.click('4f');tick();await settle();const actor=slots.find(a=>a.dataset.person===want.id);assert.equal(actor.hidden,false,want.id);assert.equal(actor.dataset.avatar,'v2');const bubble=f.map.children.find(a=>a.className==='hani-office-character-bubble');
  for(let i=0;i<3;i++){f.ids.get('haniOfficeActors').events.click({target:actor,isTrusted:true});assert.ok(bubble.children[0].textContent.includes(want.lines[i]),bubble.children[0].textContent);tick();assert.ok(bubble.children[0].textContent.includes(want.lines[i]));}
  f.click('1f');f.click('4f');assert.ok(f.ids.get('haniOfficeActors').children.every((a,i)=>a===all[i]));
 }
 assert.deepEqual(writes,[]);f.context.window.HaniOfficePresence={chairman:'inactive'};f.setDateTime('2026-11-02T10:03:00+09:00');tick();assert.ok(slots.every(a=>a.hidden));
});
test('276 adds no timer/listener or storage path, preserves every scheduler byte, and adds at most two runtime files',async()=>{
 const current=read('hani-office-live.js'),base=restoreCompanions276Source(current),count=(s,re)=>[...s.matchAll(re)].length;
 for(const re of [/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:localStorage|sessionStorage)\b/g,/\bsupabase\b/g])assert.equal(count(current,re),count(base,re),String(re));
 const a=current.slice(current.indexOf('  function createScheduler('),current.indexOf('  function snapshot(now=new Date(),options={})')),b=base.slice(base.indexOf('  function createScheduler('),base.indexOf('  function snapshot(now=new Date(),options={})'));assert.equal(a,b);
 const closure=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>fs.readFileSync(f)}),before=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>['hani-office-live.js','hani-office-live.css'].includes(f)?restoreCompanions276Source(read(f),f):fs.readFileSync(f)});assert.deepEqual(closure.missing,[]);assert.deepEqual(closure.files.filter(f=>!before.files.includes(f)).sort(),['assets/office-companions/companions-v1.webp','assets/office-companions/kids-v1.webp']);assert.equal(closure.files.length,before.files.length+2);
});

test('both runtime atlases decode with alpha, exact pet cell grids, unique frames and fully transparent outer borders',async()=>{
 const require=createRequire(import.meta.url),sharp=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
 for(const [file,width,height]of [['companions-v1.webp',480,1440],['kids-v1.webp',384,576]]){const input='assets/office-companions/'+file,meta=await sharp(input).metadata();assert.equal(meta.width,width);assert.equal(meta.height,height);assert.equal(meta.hasAlpha,true);const cells=new Set();for(let y=0;y<height;y+=144)for(let x=0;x<width;x+=96){const raw=await sharp(input).extract({left:x,top:y,width:96,height:144}).ensureAlpha().raw().toBuffer();let visible=0;for(let i=3;i<raw.length;i+=4)if(raw[i])visible++;assert.ok(visible>300&&visible<10000);cells.add(createHash('sha256').update(raw).digest('hex'));for(let xx=0;xx<96;xx++)for(const yy of [0,143])assert.equal(raw[(yy*96+xx)*4+3],0);for(let yy=0;yy<144;yy++)for(const xx of [0,95])assert.equal(raw[(yy*96+xx)*4+3],0);}assert.ok(cells.size>=width/96*height/144-2);}
});
