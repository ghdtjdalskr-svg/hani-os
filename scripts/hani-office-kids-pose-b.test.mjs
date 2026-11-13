import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';import {assets} from './hani-office-v2-fixture.mjs';
import inverse from './hani-office-kids-pose-b-source.cjs';
import weekday from './hani-office-kids-weekday-source.cjs';
import {projectPrePatrolSource} from './hani-office-chairman-patrol-278-source.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {scene,table}=loadScene(),r=scene.residents,plain=x=>JSON.parse(JSON.stringify(x)),raw=weekday.projectPreKidsWeekdaySource(fs.readFileSync('hani-office-live.js','utf8'));
const chair=(walking=false)=>({floors:[{id:'5f',people:[{id:'seongmin',floor:'5f',position:[51,70],pose:walking?'walk-a':'sitting',walking,facing:'right'}]}]});

test('B outer inverse restores fixed base, rejects every incomplete/duplicate/unrelated mutation, and retains the older inverse chain',()=>{
 for(const row of inverse.delta.files){const current=weekday.projectPreKidsWeekdaySource(fs.readFileSync(row.file,'utf8'),row.file),before=inverse.restoreKidsPoseBSource(current,row.file);assert.equal(before,fs.readFileSync('artifacts/kids-visit-b/baseline/'+row.file,'utf8'));
  let forward=before;for(const pair of row.replacements){assert.equal(before.split(pair.before).length-1,1);forward=forward.replace(pair.before,()=>pair.after);assert.throws(()=>inverse.restoreKidsPoseBSource(current.replace(pair.after,()=>pair.before),row.file));assert.throws(()=>inverse.restoreKidsPoseBSource(current+pair.after,row.file));}
  assert.equal(forward,current);for(const bad of [current+'\n',current.slice(1),current+current,before])assert.throws(()=>inverse.restoreKidsPoseBSource(bad,row.file));
  assert.equal(projectPrePatrolSource(current,row.file),projectPrePatrolSource(before,row.file));
 }assert.throws(()=>inverse.restoreKidsPoseBSource(raw,'hani-main.js'));
});
test('atlas keeps every old frame rectangle and pivot, adds direction-specific B frames within the exact 4-column grid',()=>{
 const old=loadScene({transform:inverse.restoreKidsPoseBSource}).scene.residents;
 for(const person of r.companions){const entry=r.companionAtlas(person),before=old.companionAtlas(person);if(!person.kid){assert.deepEqual(plain(entry),plain(before));continue}
  assert.deepEqual(plain(entry.frames.slice(0,8)),plain(before.frames));assert.equal(entry.frames.length,16);assert.deepEqual(plain(entry.cell),[96,144]);assert.deepEqual(plain(entry.atlas),[384,1152]);assert.ok(entry.file.endsWith('kids-v2.webp'));
  for(const f of entry.frames){assert.deepEqual(plain(f.pivot),[48,135]);assert.ok(f.rect[0]+96<=384&&f.rect[1]+144<=1152);}
 }
});
test('B sheet decodes with alpha, complete nonempty cells, transparent gutters and exactly preserved visible original pixels',async()=>{
 const require=createRequire(import.meta.url),sharp=require(process.env.HANI_SHARP_MODULE||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
 const file='assets/office-companions/kids-v2.webp',meta=await sharp(file).metadata();assert.equal(meta.width,384);assert.equal(meta.height,1152);assert.equal(meta.hasAlpha,true);
 const a=await sharp('assets/office-companions/kids-v1.webp').ensureAlpha().raw().toBuffer(),b=await sharp(file).ensureAlpha().raw().toBuffer();
 let differences=0;for(let i=0;i<a.length;i+=4)if(a[i+3]||b[i+3])for(let c=0;c<4;c++)if(a[i+c]!==b[i+c])differences++;assert.equal(differences,0);
 for(let y=0;y<8;y++)for(let x=0;x<4;x++){let visible=0;for(let yy=0;yy<144;yy++)for(let xx=0;xx<96;xx++){const alpha=b[((y*144+yy)*384+x*96+xx)*4+3];if(alpha)visible++;if(xx===0||xx===95||yy===0||yy===143)assert.equal(alpha,0,`cell ${x},${y} gutter`)}assert.ok(visible>300&&visible<10000);}
});
test('actual weekend snapshots use every B pose, cling only safely beside idle chairman, keep walks, reduced motion, pets and weekdays',()=>{
 const seen=new Set(),old=loadScene({transform:inverse.restoreKidsPoseBSource}).scene.residents;let clings=0;
 for(let t=36000;t<36240;t+=.25){const snap=chair(),states=r.companionSnapshot(at('2026-11-08',t),snap),before=old.companionSnapshot(at('2026-11-08',t),snap);assert.deepEqual(plain(states.filter(p=>p.pet)),plain(before.filter(p=>p.pet)));
  for(const child of states.filter(p=>p.kid)){assert.ok(r.companionSafe(child.floor,child.position,true));if(child.artPose){seen.add(child.artPose);assert.ok(r.companionAtlas(r.companions.find(p=>p.id===child.id)).frames.some(f=>f.name===child.artPose+'-'+child.facing));}
   if(child.id==='kid-suyeon'&&child.artPose==='cling'){clings++;const dx=(child.position[0]-51)*scene.art.width/100,dy=(child.position[1]-70)*scene.art.height/100;assert.ok(Math.hypot(dx,dy)>=80&&Math.hypot(dx,dy)<100);assert.equal(child.walking,false);assert.equal(child.facing,dx<0?'right':'left');assert.equal(child.motion,undefined);}
  }
  const moving=r.companionSnapshot(at('2026-11-08',t),chair(true)).filter(p=>p.kid);assert.ok(moving.every(p=>!p.artPose));
  const reduced=r.companionSnapshot(at('2026-11-08',t),snap,true,true).filter(p=>p.kid);assert.ok(reduced.every(p=>!p.motion&&!p.walking&&p.artPose!=='cling'));
 }for(const pose of ['wave','seat-b','startled','cling'])assert.ok(seen.has(pose),pose);assert.ok(clings>0);
 assert.equal(r.companionSnapshot(at('2026-11-09',36000),chair()).filter(p=>p.kid).length,0);
});
test('real mounted persistent slots select B atlas frames through original tick, preserve taps and floor changes, zero new writes/timers/listeners',()=>{
 const writes=[],deny=(...a)=>{writes.push(a);throw Error('forbidden write')},manifest=JSON.parse(fs.readFileSync('assets/sprites-v3/manifest-v3.json'));
 const f=fixture('10:00',false,()=>true,table,{HaniOfficeV2Assets:{...assets,spritesV3:manifest},setTimeout:()=>0,localStorage:{getItem:()=>null,setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny}});
 f.context.window.HaniOfficePresence={chairman:'active'};f.setDateTime(at('2026-11-08',36000).toISOString());f.click('4f');const slots=f.ids.get('haniOfficeActors').children.slice(),tick=f.timers.find(t=>t.ms===100).fn,seen=new Set();
 let visits=0;for(let t=36000;t<36120;t++){f.setDateTime(at('2026-11-08',t).toISOString());tick();for(const actor of slots.filter(p=>p.dataset.person?.startsWith('kid-')&&!p.hidden)){if(actor.officeResidentState.visit){visits++;assert.equal(actor.officeResidentState.artPose,undefined,'visit owner clears idle art before walking/talk/return')}if(actor.officeResidentState.artPose){seen.add(actor.dataset.pose);assert.equal(actor.dataset.pose,actor.officeResidentState.artPose)}}}
 assert.ok(visits>0,'actual staff visits execute');
 assert.ok(seen.has('wave')&&seen.has('seat-b'));f.click('1f');f.click('4f');assert.deepEqual(f.ids.get('haniOfficeActors').children,slots);assert.equal(f.timers.length,2);assert.deepEqual(writes,[]);
 const before=inverse.restoreKidsPoseBSource(raw),count=(s,re)=>[...s.matchAll(re)].length;for(const re of [/\bsetInterval\s*\(/g,/\bsetTimeout\s*\(/g,/\baddEventListener\s*\(/g,/\b(?:localStorage|sessionStorage)\b/g,/\bsupabase\b/g])assert.equal(count(raw,re),count(before,re));
});
test('actual scheduled 4F idle stop produces sister cling after staff visits, then resumes ordinary walking',()=>{
 const owner=r.createKidsVisits();let clings=0,walksAfter=false;
 for(let t=42690;t<42830;t+=.25){const now=at('2026-11-08',t),staff=scene.snapshot(now,{chairmanPresent:true}),existing=r.snapshot(now,staff),states=[...existing,...r.companionSnapshot(now,staff,true,false,existing)];owner.update(now,staff,states);
  const sister=states.find(p=>p.id==='kid-suyeon');if(sister.artPose==='cling'){clings++;const chair=staff.floors.flatMap(f=>f.people).find(p=>p.id==='seongmin'),center=chair.position||[chair.seat.x,chair.seat.y];assert.equal(chair.walking,false);assert.equal(sister.visit,undefined);assert.ok(r.companionSafe(sister.floor,sister.position,true));assert.ok(Math.hypot((sister.position[0]-center[0])*scene.art.width/100,(sister.position[1]-center[1])*scene.art.height/100)<100);}
  else if(clings&&sister.walking)walksAfter=true;
 }assert.ok(clings>0,'natural scheduled cling must actually occur');assert.ok(walksAfter,'following/visit walk resumes');
});
test('runtime closure has only the intended atlas replacement and no missing files',async()=>{
 const a=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>fs.readFileSync(f)}),b=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>inverse.projectPreKidsPoseBSource(fs.readFileSync(f).toString(),f)});
 assert.deepEqual(a.missing,[]);assert.equal(a.files.length,b.files.length);assert.deepEqual(a.files.filter(f=>!b.files.includes(f)),['assets/office-companions/kids-v2.webp']);assert.deepEqual(b.files.filter(f=>!a.files.includes(f)),['assets/office-companions/kids-v1.webp']);
});
