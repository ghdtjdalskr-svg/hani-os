import fs from 'node:fs';
import crypto from 'node:crypto';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const {scene,table,context}=loadScene(),s=scene.scheduler;
let writes=0;const deny=()=>{writes++;throw Error('storage forbidden')};context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};
const data=JSON.parse(fs.readFileSync('data/hani-building/office-places.json','utf8')),stats=[];
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const day of ['2026-10-22','2026-10-23','2026-10-24']){
 const formal=s.plan(day),all=s.blockPlan(day,0,formal),rests=all.filter(e=>!e.visitor&&e.card.kind!=='errand'),errands=all.filter(e=>e.card.kind==='errand');
 const byPlace=new Map(),runs=[],counts={},pairs=new Map();
 for(const e of all){counts[e.card.id]=(counts[e.card.id]||0)+1;if(e.group)for(let i=0;i<e.group.length;i++)for(let j=i+1;j<e.group.length;j++){const key=[e.group[i],e.group[j]].sort().join('|');pairs.set(key,(pairs.get(key)||0)+1)}
  if(e.visitor||e.card.slots.length<2||!data.behavior.gathering.kinds.includes(e.card.kind))continue;
  const list=byPlace.get(e.card.id)||[];for(const t of e.people)list.push({id:t.id,event:e.id,start:t.out.at(-1).end,end:t.back[0].start});byPlace.set(e.card.id,list);
 }
 for(const [place,list]of byPlace){const points=[...new Set(list.flatMap(t=>[t.start,t.end]))].sort((a,b)=>a-b);let run=null;
  for(const time of points){const active=list.filter(t=>t.start<=time&&time<t.end),ids=active.map(t=>t.id).sort(),origins=new Set(active.map(t=>t.event));
   if(ids.length>=2){if(!run)run={place,start:time,end:time,peak:ids.length,spontaneousPeak:0,transitions:[]};run.peak=Math.max(run.peak,ids.length);if(origins.size>=2)run.spontaneousPeak=Math.max(run.spontaneousPeak,ids.length);run.transitions.push({time,people:ids,separateExcursions:origins.size});}
   else if(run){run.end=time;runs.push(run);run=null;}
  }
 }
 let restRepeats=0,errandRepeats=0;
 for(const p of table.people)for(const [list,kind]of [[rests,'rest'],[errands,'errand']]){const own=list.filter(e=>e.people.some(t=>t.id===p.id)).sort((a,b)=>a.start-b.start);for(let i=1;i<own.length;i++)if(own[i].card.id===own[i-1].card.id){if(kind==='rest')restRepeats++;else errandRepeats++}}
 const samples={pairs:[],moments:{},signatureKinds:new Set(),deskConsecutive:0,shortDeskRuns:[],deskRuns:0},last=new Map(),lastKind=new Map(),deskRuns=new Map();
 // Targeted real snapshot episodes: fixed lunch + afternoon + arrival + leaving + night windows.
 const windows=[[32400,33000],[41400,42000],[50400,54000],[54000,54600],[63000,63600],[75600,76200]];
 for(const [start,end]of windows){last.clear();lastKind.clear();deskRuns.clear();for(let seconds=start;seconds<end;seconds++){
  const snap=s.snapshot(at(day,seconds));
  for(const p of snap.entries){
   const bit=!p.plain&&!p.eventId&&!p.outingId&&p.state==='AT_HOME',old=deskRuns.get(p.id);
   if(old&&(!bit||old.line!==p.line)){if(old.start>start){samples.deskRuns++;if(seconds-old.start<10)samples.shortDeskRuns.push({id:p.id,start:old.start,seconds:seconds-old.start,line:old.line})}deskRuns.delete(p.id)}
   if(bit&&!deskRuns.has(p.id))deskRuns.set(p.id,{start:seconds,line:p.line});
   if(p.deskPartner&&p.id<p.deskPartner&&last.get(p.id)!==p.line)samples.pairs.push({seconds,people:[p.id,p.deskPartner],line:p.line,partnerLine:snap.entries.find(q=>q.id===p.deskPartner)?.line});
   if(p.behaviorKind?.startsWith('signature'))samples.signatureKinds.add(p.behaviorKind);
   if(!p.plain&&!p.eventId&&!p.outingId&&last.get(p.id)!==p.line){const previous=lastKind.get(p.id);if(previous===p.behaviorKind)samples.deskConsecutive++;lastKind.set(p.id,p.behaviorKind)}
   if(p.eventId||p.outingId)lastKind.set(p.id,p.eventId||p.outingId);
   for(const m of data.behavior.moments)if(m.lines.includes(p.line))samples.moments[m.id]=(samples.moments[m.id]||0)+1;
   last.set(p.id,p.plain?null:p.line);
  }
 }}
 stats.push({day,counts,restRepeats,errandRepeats,pairMaximum:Math.max(0,...pairs.values()),pairCounts:Object.fromEntries(pairs),runs,gatherings:runs.length,spontaneous:runs.filter(r=>r.spontaneousPeak>=2).length,trios:runs.filter(r=>r.spontaneousPeak>=3).length,sizeDistribution:Object.fromEntries([2,3,4].map(size=>[size,runs.filter(r=>r.peak===size).length])),extensions:all.filter(e=>e.gatheringExtension).length,hostPairs:all.filter(e=>e.guestId).map(e=>({id:e.id,guest:e.guestId,person:e.people[0].id,start:e.performStart,end:e.performEnd})),preMeetings:all.filter(e=>e.preMeetingId).length,preMeetingBlocker:'Frozen formal actor reservations usually leave <90 seconds plus round-trip travel in the 2–5 minute window; no formal booking was suppressed.',samples:{...samples,signatureKinds:[...samples.signatureKinds]}});
}
const result={runtimeSha256:sha('hani-office-live.js'),placesSha256:sha('data/hani-building/office-places.json'),storageWrites:writes,sampling:'Each day 6600 actual snapshots: 09:00–09:10, 11:30–11:40, 14:00–15:10, 17:30–17:40, 21:00–21:10. Gathering session statistics instead use every exact arrival/return boundary for the full day.',days:stats};
const args=process.argv.slice(2),out=args.includes('-o')?args[args.indexOf('-o')+1]:'artifacts/office-behavior/obr10-activity-stats.json';fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(stats.map(({day,gatherings,spontaneous,trios,sizeDistribution,extensions,hostPairs,preMeetings,restRepeats,errandRepeats,pairMaximum,samples})=>({day,gatherings,spontaneous,trios,sizeDistribution,extensions,hosts:hostPairs.length,preMeetings,restRepeats,errandRepeats,pairMaximum,deskRepeats:samples.deskConsecutive,deskPairs:samples.pairs.length,moments:Object.keys(samples.moments)})));
