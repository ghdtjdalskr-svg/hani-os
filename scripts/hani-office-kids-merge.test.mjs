// Verify the actual combined 284 runtime independently of legacy projections.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readRawLifeFile} from './hani-life-bundle-source.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {at} from './hani-office-lively-fixture.mjs';
import kids from './hani-office-kids-pose-b-source.cjs';
import mascot from './hani-office-mascot-label-source.cjs';
import release284 from './hani-release-284-source.cjs';
import release283 from './hani-release-283-source.cjs';
const read=f=>readRawLifeFile(f,'utf8'),raw=read('hani-office-live.js'),main=kids.restoreKidsPoseBSource(raw);

test('284 exact version inverse retains all 283 pins and rejects unrelated, partial, duplicated and EOL edits',()=>{
 for(const file of Object.keys(release284.delta.files)){
  const source=read(file),lower=release284.restoreRelease284(source,file);
  assert.equal(kids.hash(lower),release283.files[file].after);
  for(const bad of [source+'\n',source.slice(1),source+source,source.replace('2.9.284','2.9.283'),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')])assert.throws(()=>release284.restoreRelease284(bad,file));
 }
});

test('full kids inverse recovers pinned main; affinity owner, storage keys, Cloud and timer/listener owners remain byte-identical',()=>{
 assert.equal(kids.hash(main),mascot.delta.afterSha256);
 const owner=s=>s.slice(s.indexOf('  function createOfficeAffinity(){'),s.indexOf('  function createTapLines('));assert.equal(owner(raw),owner(main));
 for(const re of [/\b(?:localStorage|sessionStorage)\b/g,/\b(?:localStorage|sessionStorage)\.(?:setItem|removeItem|clear)\s*\(/g,/\b(?:supabase|cloudClient)\b/g,/\b(?:setInterval|setTimeout|addEventListener)\s*\(/g])assert.deepEqual([...raw.matchAll(re)].map(m=>m[0]),[...main.matchAll(re)].map(m=>m[0]));
 for(const file of ['hani-office-live.js','hani-office-live.css']){
  const source=read(file);for(const bad of [source+'\n',source.slice(1),source+source])assert.throws(()=>kids.restoreKidsPoseBSource(bad,file));
 }
});

test('raw 284 closure keeps life bundle and launch assets; only kids atlas changes against pinned main',async()=>{
 const options={exists:fs.existsSync,read:f=>readRawLifeFile(f)};
 const a=await resolveRuntimeClosure(options),b=await resolveRuntimeClosure({...options,read:f=>kids.delta.files.some(row=>row.file===f)?Buffer.from(kids.restoreKidsPoseBSource(read(f),f)):readRawLifeFile(f)});
 assert.equal(a.files.length,164);assert.equal(b.files.length,164);assert.deepEqual(a.missing,[]);assert.deepEqual(b.missing,[]);
 assert.deepEqual(a.files.filter(f=>!b.files.includes(f)),['assets/office-companions/kids-v2.webp']);assert.deepEqual(b.files.filter(f=>!a.files.includes(f)),['assets/office-companions/kids-v1.webp']);
 for(const file of ['hani-launch-greeting.js','hani-launch-greeting.css','assets/launch/chibi-launch-v1-day.webp','assets/launch/chibi-launch-v1-night.webp','hani-procrastination-board.js'])assert.ok(a.files.includes(file),file);
});

test('same mounted weekday scene retains B visitor, mascot metadata and daily two-point cap on PC/phone without a persistence flush',async()=>{
 const table=JSON.parse(read('assets/data/office-actions-221.json')),manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
 for(const width of [1280,390]){
  const writes=[],deny=(...args)=>{writes.push(args);throw Error('unexpected storage')};
  const f=fixture('16:00',false,()=>true,table,{innerWidth:width,matchMedia:q=>({matches:q==='(max-width:600px)'&&width===390,addEventListener(){}}),HaniOfficeV2Assets:{...assets,spritesV3:manifest},setTimeout:()=>0,localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny}},()=>raw);
  f.context.window.HaniOfficePresence={chairman:'active'};f.setDateTime(at('2026-01-02',57600).toISOString());f.click('4f');
  for(let n=0;n<16;n++)await Promise.resolve();
  const slots=f.ids.get('haniOfficeActors').children,kid=slots.find(p=>p.dataset.person==='kid-suhyeon');
  assert.equal(kid.hidden,false);assert.ok(kid.querySelector('.hani-office-sprite').style.backgroundImage.includes('kids-v2.webp'));
  assert.equal(f.context.HaniBuildingScene.residents.companions.find(p=>p.id==='companion-frog').mascot,'전략기획실 마스코트');
  const staff=slots.find(p=>p.dataset.person==='hani');for(let n=0;n<4;n++){staff.hidden=false;staff.dataset.action='base-work';staff.dataset.walking='false';delete staff.dataset.event;staff.officeTravel=null;f.ids.get('haniOfficeActors').events.click({type:'click',target:staff,isTrusted:true});}
  assert.equal(f.context.window.HaniOfficeAffinity.get('hani').count,2);assert.deepEqual(writes,[]);
 }
});
