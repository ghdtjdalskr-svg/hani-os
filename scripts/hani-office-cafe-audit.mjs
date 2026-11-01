import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {at} from './hani-office-lively-fixture.mjs';
import {assertResources} from './hani-office-place-assertions.mjs';
import {spriteBox,boxesOverlap} from './hani-office-obr21-geometry.mjs';
const dir='artifacts/office-cafe/',read=f=>fs.readFileSync(f,'utf8'),json=f=>JSON.parse(read(f));
function load(phase){
 const before=phase==='before',assets={canon:json(before?dir+'spatial-contract.before.json':'data/hani-building/spatial-contract.json'),art:json(before?dir+'art-map.before.json':'data/hani-building/art-map-v1.json'),places:json(before?dir+'office-places.before.json':'data/hani-building/office-places.json'),sprites:json('assets/sprites-v2/manifest.json')};
 const context=vm.createContext({HaniOfficeV2Assets:assets,HaniOfficeActions221:json('assets/data/office-actions-221.json'),document:{getElementById:()=>null},window:{}});
 vm.runInContext(read(before?dir+'hani-office-live.before.txt':'hani-office-live.js'),context);return context.HaniBuildingScene;
}
const result={method:'20 weekdays 2026-11-02..27, every minute 09:00..18:00 KST, actual staff floor must match the episode line; visitors excluded',drama:[],resources:[],performance:[]};
const drama=json('assets/data/office-drama-v1.json');
for(const phase of ['before','after'])for(const chairmanPresent of [true,false]){
 const scene=load(phase),s=scene.scheduler,found=new Set(),allDayFound=new Set(),missing=[];
 for(let w=0;w<4;w++)for(let d=0;d<5;d++){
  const day=new Date(Date.UTC(2026,10,2+w*7+d)).toISOString().slice(0,10),lines=drama.weeks[w].days[d].lines;
  for(let sec=32400;sec<=64800;sec+=60){const snap=s.snapshot(at(day,sec),{chairmanPresent});for(const [i,line]of lines.entries())if(snap.entries.some(p=>p.id===line.staffId&&p.floor===line.floor))found.add(w+'|'+d+'|'+i)}
  const formal=s.plan(day,{chairmanPresent}),events=[...formal,...s.blockPlan(day,0,formal,{chairmanPresent})];
  for(const [i,line]of lines.entries()){
   if(line.staffId==='seongmin'&&!chairmanPresent)continue;
   const person=json('assets/data/office-actions-221.json').people.find(p=>p.id===line.staffId),key=w+'|'+d+'|'+i;
   if([0,3600,25200,64800].some(sec=>s.presentAt(person.id,sec)&&s.homeAt(person,sec).floor===line.floor)){allDayFound.add(key);continue}
   if(events.some(e=>e.people.some(t=>t.id===line.staffId&&[e.performStart+.001,...[...t.out,...t.back].map(l=>(l.start+l.end)/2)].some(sec=>sec>=0&&sec<86400&&s.presentAt(t.id,sec)&&s.stateAt(e,t,sec).floor===line.floor))))allDayFound.add(key);
  }
  lines.forEach((line,i)=>{if(!found.has(w+'|'+d+'|'+i))missing.push({day,...line})});
 }
 result.drama.push({phase,chairmanPresent,reachable:found.size,allDayReachable:allDayFound.size,total:100,missing});
 console.log(JSON.stringify({phase,chairmanPresent,reachable:found.size,allDayReachable:allDayFound.size}));
}
const scene=load('after'),s=scene.scheduler;
for(const chairmanPresent of [true,false])for(const day of ['2026-11-02','2026-11-04','2026-11-07','2026-11-08']){
 const begin=performance.now(),f=s.plan(day,{chairmanPresent}),out=s.blockPlan(day,0,f,{chairmanPresent}),events=[...f,...out].sort((a,b)=>a.start-b.start),active=[];let pairs=0;
 for(const e of events){for(let i=active.length-1;i>=0;i--)if(active[i].end<=e.start)active.splice(i,1);for(const q of active){assertResources(s,e,q);assert.ok(!e.people.some(p=>q.people.some(t=>t.id===p.id)),'actor double booking');pairs++}active.push(e)}
 result.resources.push({day,chairmanPresent,events:events.length,pairs,violations:0,coldMs:performance.now()-begin});
}
// The two service slots must fit independent 342px phone sprite boxes.
const a={seat:s.slot('coffee_counter','stand'),visitor:true},b={seat:s.slot('coffee_pickup','stand'),visitor:true};assert.ok(!boxesOverlap(spriteBox(a),spriteBox(b)));
result.coffeeSeparation={anchors:[a.seat,b.seat],phoneBoxes:[spriteBox(a),spriteBox(b)]};
for(const chairmanPresent of [false,true]){const scene=load('after'),s=scene.scheduler,options={chairmanPresent},begin=performance.now(),f=s.plan('2026-11-02',options),out=s.blockPlan('2026-11-02',0,f,options),cold=performance.now()-begin,warm=performance.now();for(let i=0;i<1000;i++)s.snapshot(at('2026-11-02',50400+i),options);result.performance.push({chairmanPresent,coldMs:cold,warmMs:(performance.now()-warm)/1000,events:f.length+out.length})}
fs.writeFileSync(dir+'audit.json',JSON.stringify(result,null,2)+'\n');
for(const row of result.drama.filter(r=>r.phase==='after'))assert.ok(row.reachable>=(row.chairmanPresent?93:88),'weekly drama reachability regressed');
