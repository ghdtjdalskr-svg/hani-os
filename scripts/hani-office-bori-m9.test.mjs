import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import m9 from './hani-seoyun-m9-source.cjs';
import {boriStrollDelta,restoreBoriStrollSource,projectPreBoriStrollSource} from './hani-office-bori-stroll-source.mjs';
import {patrol278Delta,restoreCompanionHomesSource,projectPrePatrolSource} from './hani-office-chairman-patrol-278-source.mjs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const raw=fs.readFileSync('hani-office-live.js','utf8'),plain=x=>JSON.parse(JSON.stringify(x));

test('merged exact inverses run M9 then Bori then homes through every unchanged 278 layer',()=>{
 const bori=m9.restoreSeoyunM9Source(raw),homes=restoreBoriStrollSource(bori);
 assert.equal(m9.hash(bori),boriStrollDelta.afterSha256);
 assert.equal(m9.hash(homes),patrol278Delta.companionHomesExtension.afterSha256);
 assert.equal(restoreBoriStrollSource(raw),homes);
 assert.equal(projectPreBoriStrollSource(raw),homes);
 assert.equal(m9.hash(restoreCompanionHomesSource(raw)),patrol278Delta.companionHomesExtension.beforeSha256);
 assert.equal(m9.hash(projectPrePatrolSource(raw)),patrol278Delta.files.find(r=>r.file==='hani-office-live.js').beforeSha256);
 for(const bad of [raw+'\n',raw.slice(1),raw+raw]){
  assert.throws(()=>m9.restoreSeoyunM9Source(bad));
  assert.throws(()=>restoreBoriStrollSource(bad));
  assert.throws(()=>restoreCompanionHomesSource(bad));
 }
});

test('merged Bori affection runs on actual daytime snapshots and preserves all pre-M9 rhythm, motion and positions',()=>{
 const merged=loadScene().scene,prior=loadScene({transform:m9.restoreSeoyunM9Source}).scene;
 const r=merged.residents,before=prior.residents,line='…멍. (꼬리를 툭 한 번)';
 const counts={sleep:0,walking:0,stroll:0,awake:0,special:0};
 for(let sec=32400;sec<75600;sec+=2){
  const now=at('2026-11-03',sec),states=r.snapshot(now,{floors:[]}),old=before.snapshot(now,{floors:[]});
  assert.deepEqual(plain(states),plain(old),'M9 does not change existing resident rhythm');
  const pet=states.find(p=>p.id==='pet-bori');if(!pet)continue;
  if(pet.pose==='sleep')counts.sleep++;else if(pet.walking)counts.walking++;else counts.awake++;
  if(pet.stroll)counts.stroll++;
  // Execute the canonical affection owner with the actual current pose, motion,
  // stroll and floor. The synthetic peer is the only added scene input.
  const peer={id:'seoyun',floor:pet.floor,position:[pet.position[0]+150/merged.art.width*100,pet.position[1]],walking:false,activity:'work',state:'AT_HOME'};
  const a=r.affection(now,[plain(pet)],[peer])[0],b=before.affection(now,[plain(pet)],[peer])[0];
  assert.deepEqual(plain({...a,affection:undefined}),plain({...b,affection:undefined}));
  if(a.affection){
   assert.ok(!pet.stroll&&!pet.walking&&!pet.motion?.active&&pet.pose!=='sleep');
   assert.ok(b.affection);assert.equal(a.affection.partnerId,'seoyun');
   if(a.affection.petLine===line){counts.special++;assert.equal(b.affection.petLine,'큰 머리 살짝 기대도 될까요, 멍.');}
   else assert.deepEqual(plain(a.affection),plain(b.affection));
  }
  for(const other of [{...peer,id:'yuna'},{...peer,floor:pet.floor==='1f'?'3f':'1f'},{...peer,walking:true},{...peer,position:[pet.position[0]+400/merged.art.width*100,pet.position[1]]}]){
   assert.notEqual(r.affection(now,[plain(pet)],[other])[0].affection?.petLine,line);
  }
 }
 for(const [kind,count] of Object.entries(counts))assert.ok(count>0,kind+' actually observed');
 console.log('Merged actual Bori samples',JSON.stringify(counts));
});
