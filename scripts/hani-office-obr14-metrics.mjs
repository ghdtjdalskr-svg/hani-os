import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {loadScene,at,readAt} from './hani-office-lively-fixture.mjs';
export const base234='33d39892c2a5c0a1779650e440a2dd5068b44495';
export function measure(scene,day,options={}){
 const s=scene.scheduler,rows=Object.fromEntries(['1f','2f','3f','4f','5f'].map(f=>[f,{active:0,people:0,walking:0,guests:0,maxGuests:0,lines:new Set(),seconds:0}]));
 for(let sec=32400;sec<68400;sec++){
  const snap=s.snapshot(at(day,sec),options);
  for(const [floor,r]of Object.entries(rows)){
   const staff=snap.entries.filter(p=>p.floor===floor),guests=(snap.visitors||[]).filter(p=>p.floor===floor),walk=staff.filter(p=>p.walking).length;
   r.seconds++;r.people+=staff.length+guests.length;r.walking+=walk;r.guests+=guests.length;r.maxGuests=Math.max(r.maxGuests,guests.length);r.active+=Boolean(walk||guests.length);for(const p of staff)r.lines.add(p.line);
  }
 }
 return Object.fromEntries(Object.entries(rows).map(([f,r])=>[f,{activeRatio:r.active/r.seconds,peopleMean:r.people/r.seconds,walkingMean:r.walking/r.seconds,guestMean:r.guests/r.seconds,maxGuests:r.maxGuests,distinctLines:r.lines.size}]));
}
if(process.argv[1]?.endsWith('hani-office-obr14-metrics.mjs')){
 const day='2026-10-22',results={day,runtimeSha256:createHash('sha256').update(fs.readFileSync('hani-office-live.js')).digest('hex'),comparisons:[],performance:[]};
 const previous=process.argv.includes('--reuse-fixed-baselines')?JSON.parse(fs.readFileSync('artifacts/office-behavior/obr14-metrics.json')):null;
 for(const [label,ref]of [['230','04fb2b377f28958aec1480ca09244f4567c3a339'],['234',base234],['235',null]]){
  let row;
  if(ref&&previous?.day===day){const fixed=previous.comparisons.find(r=>r.label===label&&r.ref===ref);if(fixed)row={...fixed,reusedFixedRef:true}}
  if(!row){const {scene}=loadScene({ref});row={label,ref,floors:measure(scene,day)}}
  row.sourceSha256=createHash('sha256').update(readAt('hani-office-live.js',ref)).digest('hex');results.comparisons.push(row);console.log(label,JSON.stringify(row.floors));
 }
 for(const chairmanPresent of [false,true]){const cold=[],warm=[];for(let run=0;run<3;run++){const {scene}=loadScene(),s=scene.scheduler,start=performance.now(),f=s.plan(day,{chairmanPresent});s.blockPlan(day,0,f,{chairmanPresent});cold.push(performance.now()-start);const begin=performance.now();for(let i=0;i<1000;i++)s.snapshot(at(day,50400+i),{chairmanPresent});warm.push((performance.now()-begin)/1000)}results.performance.push({chairmanPresent,cold,warm,best:Math.min(...cold),maxWarm:Math.max(...warm)});console.log('performance',results.performance.at(-1))}
 const detail={day,staff:[],rhythm:[],recording:[]};
 for(const [label,ref]of [['234',base234],['235',null]]){
  const {scene}=loadScene({ref}),s=scene.scheduler,f=s.plan(day),out=s.blockPlan(day,0,f),staff=out.filter(e=>!e.visitor&&e.start>=32400&&e.start<68400);
  detail.staff.push({label,crossFloorTo1F:staff.filter(e=>e.card.floor==='1f'&&e.people.some(t=>t.home.floor!=='1f')).length,errands1F:staff.filter(e=>e.card.floor==='1f'&&e.card.kind==='errand').length,hosts1F:staff.filter(e=>e.guestId).length});if(ref)continue;
  for(const [period,begin,end]of [['morning',9,10],['lunch',11.5,13.5],['afternoon',13,17]]){
   const guests=out.filter(e=>e.visitor&&e.start>=begin*3600&&e.start<end*3600);detail.rhythm.push({period,total:guests.length,kinds:Object.fromEntries(['courier','rider','client','candidate','generic'].map(k=>[k,guests.filter(e=>e.visitor.kind===k).length]))});let chosen;
   for(let seconds=begin*3600;seconds<end*3600;seconds++){const snap=s.snapshot(at(day,seconds)),staff=snap.entries.filter(p=>p.floor==='1f'),score=snap.visitors.length*10+staff.filter(p=>p.walking).length*5+staff.filter(p=>p.visitorPartner).length*3;if(!chosen||score>chosen.score)chosen={seconds,time:new Date(at(day,seconds).getTime()+32400000).toISOString().slice(11,19),score,staff:staff.map(p=>({id:p.id,line:p.line,walking:p.walking})),guests:snap.visitors.map(p=>({id:p.id,kind:p.kind,line:p.line}))};if(score>=25)break}
   detail.recording.push({period,...chosen});
  }
 }
 fs.writeFileSync('artifacts/office-behavior/obr14-detail.json',JSON.stringify(detail,null,2)+'\n');
 fs.writeFileSync('artifacts/office-behavior/obr14-metrics.json',JSON.stringify(results,null,2)+'\n');
 if(results.performance.some(p=>p.best>=400||p.maxWarm>=3))process.exitCode=1;
}
