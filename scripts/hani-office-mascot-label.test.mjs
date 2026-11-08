import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import inverse from './hani-office-mascot-label-source.cjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';

const source=fs.readFileSync('hani-office-live.js','utf8'),base=inverse.restoreMascotLabelSource(source);
const expected={'companion-frog':'전략기획실 마스코트','companion-penguin':'개발실 마스코트','companion-chick':'라이프&엔터 마스코트','companion-fox':'재무실 마스코트','companion-otter':'기업솔루션 마스코트'};
const homes={'companion-frog':'4f','companion-penguin':'3f','companion-chick':'2f','companion-fox':'2f','companion-otter':'1f'};
const read=f=>fs.readFileSync(f,'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const table=JSON.parse(read('assets/data/office-actions-221.json')),manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const box=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
function mount(phone=false,reduced=false,old=false){
 const writes=[],deny=(...args)=>{writes.push(args);assert.fail('unexpected mascot persistence')};
 const f=fixture('10:00',reduced,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:manifest},HaniOfficePresence:{chairman:'active'},localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},matchMedia:q=>({matches:q==='(max-width:600px)'?phone:q.includes('reduced-motion')&&reduced,addEventListener(){}}),setTimeout:()=>0},old?inverse.projectPreMascotLabelSource:s=>s);
 f.context.window.HaniOfficePresence={chairman:'active'};
 const width=phone?390:1280,height=width*941/1672,actors=f.ids.get('haniOfficeActors').children;
 f.map.getBoundingClientRect=()=>box(0,0,width,height);
 for(const node of f.root.querySelectorAll('*'))if(!node.getBoundingClientRect)node.getBoundingClientRect=()=>box(0,0,0,0);
 f.root.querySelector('.hani-office-character-bubble').getBoundingClientRect=()=>box(4,4,110,40);
 for(const a of actors){
  a.getBoundingClientRect=()=>box(parseFloat(a.style.left||0)*width/100-15,parseFloat(a.style.top||0)*height/100-40,30,40);
  a.querySelector('.hani-office-sprite').getBoundingClientRect=()=>a.getBoundingClientRect();
  a.querySelector('.hani-office-name').getBoundingClientRect=()=>{const r=a.getBoundingClientRect(),lines=[a.officeName.textContent,a.officeCompact.textContent],w=Math.max(...lines.map(l=>[...l].length))*(phone?5:7)+12;return box(r.left+15-w/2,r.bottom,w,lines[1]?24:12)};
  a.querySelector('.hani-office-status').getBoundingClientRect=()=>box(0,0,80,14);
 }
 const tick=()=>f.timers.find(t=>t.ms===100).fn();
 return Object.assign(f,{actors,writes,tick,actor:id=>actors.find(a=>a.dataset.person===id),async show(day,floor){f.setDateTime(day+'T10:02:20+09:00');f.click(floor);tick();await new Promise(r=>setImmediate(r));tick()}});
}

test('outer exact inverse independently restores fixed affinity HEAD and rejects partial/duplicate/unrelated edits',()=>{
 assert.equal(base,execFileSync('git',['show',inverse.delta.baseCommit+':hani-office-live.js'],{encoding:'utf8',maxBuffer:32*1024*1024}));
 let forward=base;for(const p of inverse.delta.replacements){assert.notEqual(p.before,p.after);assert.equal(base.split(p.before).length-1,1);forward=forward.replace(p.before,()=>p.after);assert.throws(()=>inverse.restoreMascotLabelSource(source.replace(p.after,()=>p.before)));assert.throws(()=>inverse.restoreMascotLabelSource(source+p.after))}assert.equal(forward,source);
 for(const bad of [base,source+'\n',source.slice(1),source+source])assert.throws(()=>inverse.restoreMascotLabelSource(bad));assert.throws(()=>inverse.restoreMascotLabelSource(source,'hani-main.js'));
});

test('five home labels and weekday following labels execute in the existing PC/390 owner with full accessible text and phone shortening',async()=>{
 for(const phone of [false,true])for(const reduced of [false,true]){
  const f=mount(phone,reduced),slots=[...f.actors];
  f.context.window.HaniOfficePresence={chairman:'inactive'};
  for(const [id,label]of Object.entries(expected)){
   await f.show('2026-11-07',homes[id]);const a=f.actor(id),name=a.querySelector('.hani-office-name');assert.equal(a.hidden,false,id);assert.equal(a.officeCompact.textContent,label);assert.equal(a.officeCompact.style.display,'block');assert.equal(name.title,a.dataset.name+' · '+label);assert.equal(name.getAttribute('aria-label'),name.title);assert.equal(a.getAttribute('aria-label'),name.title);assert.equal(a.officeResidentState.following,false);
  }
  f.context.window.HaniOfficePresence={chairman:'active'};
  for(const [i,id]of ['companion-frog','companion-penguin','companion-otter','companion-chick','companion-fox'].entries()){
   await f.show('2026-11-0'+(i+2),'4f');const a=f.actor(id);assert.equal(a.hidden,false,id);assert.equal(a.officeResidentState.following,true);assert.equal(a.officeCompact.textContent,(phone?'동행 · ':'오늘의 동행 · ')+expected[id]);assert.equal(a.querySelector('.hani-office-name').title,a.dataset.name+' · 오늘의 동행 · '+expected[id]);assert.doesNotMatch(a.officeCompact.textContent,/\?|…/);if(phone)assert.ok([...a.officeCompact.textContent].length<=16);
  }
  await f.show('2026-11-07','4f');assert.equal(f.actor('companion-frog').officeCompact.textContent,expected['companion-frog'],'following prefix clears on weekend');assert.deepEqual(f.actors,slots);assert.deepEqual(f.writes,[]);
 }
});

test('other pets, NPCs and siblings retain name/title/aria/auxiliary text; mascot delegated taps keep one bubble and zero writes',async()=>{
 for(const phone of [false,true]){
  const f=mount(phone),prior=mount(phone,false,true);
  for(const day of ['2026-11-02','2026-11-07'])for(const floor of ['1f','2f','3f','4f','5f']){
   await f.show(day,floor);await prior.show(day,floor);
   for(const a of f.actors.filter(a=>a.dataset.resident&&!expected[a.dataset.person]&&!a.hidden)){
    const old=prior.actor(a.dataset.person),name=a.querySelector('.hani-office-name'),oldName=old.querySelector('.hani-office-name');assert.equal(a.officeName.textContent,old.officeName.textContent);assert.equal(a.officeCompact.textContent,old.officeCompact.textContent);assert.equal(name.title,oldName.title);assert.equal(name.getAttribute('aria-label'),oldName.getAttribute('aria-label'));assert.equal(a.getAttribute('aria-label'),old.getAttribute('aria-label'));
   }
  }
  for(const [id,floor]of Object.entries(homes)){
   await f.show('2026-11-07',floor);const a=f.actor(id);f.ids.get('haniOfficeActors').events.click({target:a,isTrusted:true});const bubble=f.root.querySelector('.hani-office-character-bubble');assert.equal(bubble.hidden,false);assert.ok(bubble.querySelector('p').textContent.includes(a.dataset.name));assert.equal(f.root.querySelectorAll('.hani-office-character-bubble').length,1);f.ids.get('haniOfficeActors').events.keydown({key:'Escape'});
  }
  const listeners=x=>[x.document,...x.root.querySelectorAll('*')].map(n=>Object.keys(n.events||{}).sort());assert.deepEqual(listeners(f),listeners(prior));assert.deepEqual(f.timers.map(t=>t.ms),prior.timers.map(t=>t.ms));assert.deepEqual(f.writes,[]);
 }
});

test('all week movement/floors/following/dialogue states are identical; timer/listener/storage owners and runtime closure are unchanged',async()=>{
 const current=loadScene().scene,old=loadScene({transform:inverse.projectPreMascotLabelSource}).scene;
 for(let d=2;d<=8;d++)for(const seconds of [0,25200,36000,50400,72000,86399])for(const present of [false,true]){
  const now=at('2026-11-0'+d,seconds),staff=current.snapshot(now,{chairmanPresent:present}),res=current.residents.snapshot(now,staff);assert.deepEqual(plain(staff),plain(old.snapshot(now,{chairmanPresent:present})));assert.deepEqual(plain(res),plain(old.residents.snapshot(now,staff)));assert.deepEqual(plain(current.residents.companionSnapshot(now,staff,true,false,res)),plain(old.residents.companionSnapshot(now,staff,true,false,res)));
 }
 for(const re of [/\bsetTimeout\s*\(/g,/\bsetInterval\s*\(/g,/\baddEventListener\s*\(/g,/\brequestAnimationFrame\s*\(/g,/\b(?:localStorage|sessionStorage|supabase)\b/g])assert.equal([...source.matchAll(re)].length,[...base.matchAll(re)].length);
 const owner=s=>s.slice(s.indexOf('  function createOfficeAffinity(){'),s.indexOf('  function createTapLines('));assert.equal(owner(source),owner(base));
 const opts={exists:fs.existsSync,read:f=>fs.readFileSync(f)},closure=await resolveRuntimeClosure(opts),before=await resolveRuntimeClosure({...opts,read:f=>f==='hani-office-live.js'?Buffer.from(base):fs.readFileSync(f)});assert.deepEqual(closure.files,before.files);assert.deepEqual(closure.missing,[]);assert.deepEqual(before.missing,[]);for(const file of closure.files)if(file!=='hani-office-live.js')assert.equal(inverse.hash(closure.contents.get(file)),inverse.hash(before.contents.get(file)),file);
});
