import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {spriteBox,boxesOverlap} from './hani-office-obr21-geometry.mjs';
const {scene,context}=loadScene(),s=scene.scheduler;
const read=f=>fs.readFileSync(f,'utf8');
test('cafe route uses clear lower-right floor, retains the lounge and sign mounting surface',()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(scene.art.anchors.coffee_counter)),{x:83,y:60,furniture:'standing interaction'});
 assert.deepEqual(JSON.parse(JSON.stringify(scene.art.anchors.approach_coffee_counter)),{x:77,y:58});
 const baseline=JSON.parse(read('artifacts/office-cafe/art-map.before.json'));
 for(const id of ['lobby-nw','lobby-ne','lobby-sw','lobby-se','door_cafe','junction_cafe'])assert.deepEqual(JSON.parse(JSON.stringify(scene.art.anchors[id])),baseline.anchors[id]);
 assert.deepEqual(JSON.parse(JSON.stringify(scene.art.floors['1f'].plates)),baseline.floors['1f'].plates);
 // Native-art furniture footprints, including the new counter and the old sofa lounge.
 const obstacles=[[655,275,1018,408],[1150,265,1265,375],[1380,265,1500,380],[1160,375,1265,506],[1380,380,1525,508],[1260,350,1390,430],[1435,530,1665,790]];
 for(const target of ['coffee_counter','coffee_pickup']){
  const route=scene.route('arrival_gate',target);assert.ok(route.length>2);assert.ok(!route.some(n=>n.id==='junction_cafe'),'service branch avoids sofa lounge');
  for(let i=1;i<route.length;i++){
   const p=scene.visualPoint(route[i-1]),q=scene.visualPoint(route[i]);
   for(let j=0;j<=100;j++){
    const x=(p[0]+(q[0]-p[0])*j/100)*16.72,y=(p[1]+(q[1]-p[1])*j/100)*9.41;
    assert.ok(!obstacles.some(([l,t,r,b])=>x>l&&x<r&&y>t&&y<b),route[i-1].id+' → '+route[i].id+' enters furniture at '+x+','+y);
   }
  }
 }
});
test('two real takeaway customers can stay at distinct non-overlapping service slots',()=>{
 let simultaneous=0;
 for(const day of ['2026-11-02','2026-11-04','2026-11-07','2026-11-08']){
  const options={chairmanPresent:true},f=s.plan(day,options),out=s.blockPlan(day,0,f,options),coffee=out.filter(e=>e.visitor?.kind==='generic');
  for(let i=0;i<coffee.length;i++)for(const b of coffee.slice(i+1)){
   const a=coffee[i],start=Math.max(a.performStart,b.performStart),end=Math.min(a.performEnd,b.performEnd);if(start>=end)continue;
   const snap=s.snapshot(at(day,(start+end)/2),options),p=snap.visitors.find(p=>p.id===a.people[0].id),q=snap.visitors.find(p=>p.id===b.people[0].id);
   assert.ok(p&&q);assert.notEqual(p.seat.anchor,q.seat.anchor);assert.ok(!boxesOverlap(spriteBox(p),spriteBox(q)));simultaneous++;
  }
 }
 assert.ok(simultaneous>0);console.log('simultaneous takeaway stays',simultaneous);
});
test('approved workday cadence and exact frozen placement code stay intact',()=>{
 const source=read('hani-office-live.js');
 const placement=s=>s.slice(s.indexOf('  function placeStatusLabels('),s.indexOf('  const scheduler=',s.indexOf('  function placeStatusLabels(')));
 assert.equal(createHash('sha256').update(placement(source).replace(/\r/g,'')).digest('hex'),'5070f7e62556b89410bc7588600fefe80ba99579e945ae49bab89def98bec6f0','exact current placement code, unchanged throughout finish work');
 assert.doesNotMatch(source,/localStorage|sessionStorage|supabase/);
 const rules=JSON.parse(read('data/hani-building/office-places.json')).outingRules;assert.equal(rules.deskAmbientSeconds,300);
 assert.equal(createHash('sha256').update(fs.readFileSync('assets/building/floor-1f-217.webp')).digest('hex'),scene.art.floors['1f'].backgroundSha256);
});

test('first full daily plan stays below the unchanged 400ms limit, chairman absent and present',()=>{
 for(const chairmanPresent of [false,true]){
  const samples=[];
  for(let i=0;i<3;i++){const api=loadScene().scene.scheduler,t=performance.now();api.blockPlan('2026-11-02',0,api.plan('2026-11-02',{chairmanPresent}),{chairmanPresent});samples.push(performance.now()-t)}
  console.log('cafe cold plan',{chairmanPresent,samples});assert.ok(Math.min(...samples)<400,JSON.stringify({chairmanPresent,samples}));
 }
});
