import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const {scene}=loadScene(),day='2026-10-22';
// These are forbidden standalone activity labels, including obr18's lossy ones.
const banned=new Set(['업무','조용','확인','이동','대기','검증','검토','수정','집필','분석','조율','정리','대화','휴식','인사','커피','업무중','조용히','확인중']);
test('obr19 full source produces concrete 2–6 character actions; no generic words or clipping',()=>{
 const examples=[['보고서 작성 중','보고서작성'],['팬트리에서 커피 내리는 중','커피내리기'],['예산 점검 중','예산검산'],['창밖 구경 중','창밖구경'],['기사 구상 중','기사구상'],['회장님께 배포 일정 보고 중','배포보고'],['회장님께 오늘 안건 보고 중','안건보고'],['네, 범위와 순서를 정리할게요','보고답변'],['회장님, 다음 일정 챙겨 뒀어요','도착인사']];
 for(const [line,expected]of examples)assert.equal(scene.labels.short(line),expected);
 const source=examples.map(([line])=>line);
 for(const line of source){const short=scene.labels.short(line);assert.ok([...short].length>=2&&[...short].length<=6,JSON.stringify({line,short}));assert.ok(!banned.has(short),short);assert.doesNotMatch(short,/…|\.\.\./)}
});
test('obr19 same-floor authored activity alternatives avoid simultaneous duplicates; full original unchanged',()=>{
 const summary={snapshots:0,people:0,duplicates:[],invalid:[]};
 for(const chairmanPresent of [false,true])for(let sec=28800;sec<82800;sec+=37){
  const snap=scene.scheduler.snapshot(at(day,sec),{chairmanPresent});summary.snapshots++;
  for(const floor of scene.floors){const people=[...snap.entries,...snap.visitors].filter(p=>p.floor===floor.id),used=new Set();
   for(const p of people){const full=p.line,short=scene.labels.short(full,used);summary.people++;if([...short].length<2||[...short].length>6||banned.has(short))summary.invalid.push({sec,id:p.id,full,short});assert.equal(p.line,full);}
   if(used.size!==people.length)summary.duplicates.push({chairmanPresent,sec,floor:floor.id,people:people.map(p=>({id:p.id,line:p.line})),short:[...used]});
  }
 }
 fs.writeFileSync('artifacts/office-behavior/obr19-vocabulary.json',JSON.stringify(summary,null,2)+'\n');assert.deepEqual(summary.invalid,[]);assert.deepEqual(summary.duplicates,[]);
});
test('obr19 CSS restores the exact original minimum40 rule and adds no phone scale override',()=>{
 const css=fs.readFileSync('hani-office-live.css','utf8');assert.match(css,/--actor-height:max\(40px,6\.8cqw\)/);assert.doesNotMatch(css,/--actor-height:20px/);
});
