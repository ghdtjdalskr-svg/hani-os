import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {loadScene,readAt,at} from './hani-office-lively-fixture.mjs';
const before=readAt('hani-office-live.js','ecc1384');
// Retain the historical text-only contract on immutable obr7. Current obr8
// physical changes are frozen by obr6/obr8 and exercised in obr8.test, rather
// than pretending they satisfy obr7's obsolete no-movement-change claim.
const obr7=readAt('hani-office-live.js','84cadbd');
assert.equal(crypto.createHash('sha256').update(obr7).digest('hex'),'cce544474a1bb90c6220127e4656f61e47d0b8b4fb9dec5a93fde6c40a6c6e6d');
assert.equal(crypto.createHash('sha256').update(before).digest('hex'),'c107037831425beddd3ec929603d78c53b6bd83285842feb484675220403bd1e','actual immutable obr6 commit');
const plain=v=>JSON.parse(JSON.stringify(v));
const exceptWords=snapshot=>{const value=plain(snapshot);for(const p of value.entries)delete p.line;return value};
const forbidden=/창밖|창가|화이트보드|소파|팬트리|커피 내리|화분|라운지/;
test('obr7 historical oracle: three day ledgers stay byte-identical; deterministic sampled snapshots change ONLY idle words, storage 0',()=>{
 const old=loadScene({transform:()=>before}),current=loadScene({transform:()=>obr7});let writes=0,wordChanges=0;
 const fail=()=>{writes++;throw Error('storage write forbidden')};
 for(const f of [old,current])f.context.localStorage=f.context.sessionStorage={setItem:fail,removeItem:fail,clear:fail};
 for(const day of ['2026-10-22','2026-10-24','2026-10-23']){
  const a=old.scene.scheduler,b=current.scene.scheduler,options={chairmanPresent:true};
  const af=a.plan(day,options),bf=b.plan(day,options);assert.equal(JSON.stringify(af),JSON.stringify(bf),'formal bytes');
  assert.equal(JSON.stringify(a.blockPlan(day,0,af,options)),JSON.stringify(b.blockPlan(day,0,bf,options)),'outing bytes');
  for(let sec=0;sec<86400;sec+=97){
   const first=a.snapshot(at(day,sec),options),second=b.snapshot(at(day,sec),options);
   assert.deepEqual(exceptWords(second),exceptWords(first),'same poses, walking, places, active events, presence at '+day+' '+sec);
   for(const p of second.entries){const oldP=first.entries.find(q=>q.id===p.id);
    if(p.line!==oldP.line){wordChanges++;assert.ok(!p.eventId&&!p.outingId&&!p.plain,'only visible idle words change');}
    if(p.state==='AT_HOME'&&!['lobby-nw','lobby-ne'].includes(p.seat.anchor))assert.doesNotMatch(p.line,forbidden);
   }
   const formalLines=new Set(second.entries.filter(p=>!p.plain&&(p.eventId||p.outingId)).map(p=>p.floor+'|'+p.line));
   const idleLines=second.entries.filter(p=>!p.plain&&!p.eventId&&!p.outingId).map(p=>p.floor+'|'+p.line);
   assert.equal(new Set(idleLines).size,idleLines.length,'no simultaneous idle line repeats');
   assert.ok(idleLines.every(line=>!formalLines.has(line)),'formal words win');
   assert.equal(JSON.stringify(second),JSON.stringify(b.snapshot(at(day,sec),options)),'query order independent');
  }
 }
 assert.ok(wordChanges>1000);assert.equal(writes,0);
});
test('obr7: summon/cancel/reduced motion retain the original physical and event state',()=>{
 for(const options of [{reducedMotion:true},{summoned:['jieun','daon','yoonseul']},{presentIds:['seoyun','dohyun','yuna','minji']},{cancelled:new Set(['2026-10-22|ambient-2f|100'])}]){
  const old=loadScene({transform:()=>before}).scene.scheduler,current=loadScene({transform:()=>obr7}).scene.scheduler;
  for(const sec of [6000,32400,41400,45000,54000,68373])assert.deepEqual(exceptWords(current.snapshot(at('2026-10-22',sec),options)),exceptWords(old.snapshot(at('2026-10-22',sec),options)));
 }
});
