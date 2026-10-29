import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {loadScene,at,readAt} from './hani-office-lively-fixture.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),day='2026-10-22',out='artifacts/office-behavior/';
const result={runtimeSha256:hash(fs.readFileSync('hani-office-live.js')),node:process.version,day,performance:[],chairman:[],disappeared:[]};
for(const chairmanPresent of [false,true]){
 const options={chairmanPresent},cold=[],warm=[];
 for(let run=0;run<3;run++){
  const {scene}=loadScene(),s=scene.scheduler,start=performance.now(),formal=s.plan(day,options),outings=s.blockPlan(day,0,formal,options);cold.push(performance.now()-start);
  const begin=performance.now();for(let i=0;i<1000;i++)s.snapshot(at(day,14*3600+i),options);warm.push((performance.now()-begin)/1000);
  if(run===0)console.log('counts',{chairmanPresent,formal:formal.length,outings:outings.length});
 }
 const row={chairmanPresent,coldMs:cold,bestMs:Math.min(...cold),warmMs:warm,maxWarmMs:Math.max(...warm)};row.pass=row.bestMs<400&&row.maxWarmMs<3;result.performance.push(row);console.log('234 performance',row);
}
const {scene,context}=loadScene(),s=scene.scheduler,options={chairmanPresent:true},formal=s.plan(day,options),outings=s.blockPlan(day,0,formal,options),actions=new Map(),places=new Map(),lines=new Set(),partners=new Set();let socialSeconds=0;
let writes=0;const deny=()=>{writes++;throw Error('forbidden write/network')};context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};context.fetch=deny;
for(let sec=32400;sec<64800;sec++){
 const p=s.snapshot(at(day,sec),options).entries.find(p=>p.id==='seongmin');
 if(!p)throw Error('chairman disappeared during presence');
 if(!actions.has(p.actionId))actions.set(p.actionId,{id:p.actionId,seconds:0,lines:new Set()});const a=actions.get(p.actionId);a.seconds++;a.lines.add(p.line);lines.add(p.line);
 if(p.placeId)places.set(p.placeId,(places.get(p.placeId)||0)+1);
 if(p.gatheringIds||p.groupIds){socialSeconds++;for(const id of p.gatheringIds||p.groupIds)if(id!=='seongmin')partners.add(id)}
}
result.chairman=[...actions.values()].map(a=>({...a,lines:[...a.lines]}));result.places=[...places];result.distinctLines=lines.size;result.storageWrites=writes;result.socialSeconds=socialSeconds;result.socialPartners=[...partners];
const before=readAt('hani-office-live.js','beffc38'),old=loadScene({transform:()=>before}).scene.scheduler;
const previous=old.plan(day,options).filter(e=>e.start>=32400&&e.start<64800&&e.people.some(t=>t.id==='seongmin'));
const current=new Set(formal.filter(e=>e.start>=32400&&e.start<64800&&e.people.some(t=>t.id==='seongmin')).map(e=>e.actionId));
result.disappeared=[...new Set(previous.map(e=>e.actionId))].filter(id=>!current.has(id));
result.chairmanOutings=outings.filter(e=>e.people.some(t=>t.id==='seongmin')).map(e=>({id:e.card.id,kind:e.card.kind,start:e.start,group:e.group,stay:e.performEnd-e.performStart}));
fs.writeFileSync(out+'obr13-metrics.json',JSON.stringify(result,null,2)+'\n');
console.log('234 chairman day',{actions:result.chairman.map(a=>[a.id,a.seconds]),lines:result.distinctLines,disappeared:result.disappeared,writes});
if(result.performance.some(p=>!p.pass)||result.disappeared.length||writes)process.exitCode=1;
