// Node-only evidence. No browser, storage, network, or production writes.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {loadScene,root,at,readAt} from './hani-office-lively-fixture.mjs';
const write=(name,value)=>fs.writeFileSync(new URL('artifacts/office-behavior/'+name,root),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');
const {scene,table}=loadScene(),s=scene.scheduler,day='2026-10-22';
const first=performance.now(),formal=s.plan(day),trips=s.blockPlan(day,0,formal),firstPlanMs=performance.now()-first;
let begin=performance.now();for(let i=0;i<1000;i++)s.snapshot(at(day,50400+i));const warmSnapshotMs=(performance.now()-begin)/1000;
const duration=(e,t)=>t.back[0].start-t.out.at(-1).end;
const samples={before:{},after:{}};
for(const [label,ref]of [['before','aa7cd35'],['after',null]])for(const catalog of [216,221]){
 const engine=loadScene({ref,catalog}).scene.scheduler;
 // 208 days cover the canonical 97 rows; the 221 week also covers night/weekend.
 const count=catalog===216?208:7;
 for(let n=0;n<count;n++){
  const date=new Date(Date.UTC(2026,9,19+n)).toISOString().slice(0,10);
  for(const e of engine.plan(date,{chairmanPresent:true}))for(const t of e.people){
   if(t.seat.anchor===t.home.anchorId)continue;
   const key=catalog+'/'+e.actionId,seconds=duration(e,t);
   const row=samples[label][key]||={min:Infinity,max:-Infinity,count:0};
   row.min=Math.min(row.min,seconds);row.max=Math.max(row.max,seconds);row.count++;
  }
 }
}
const week=[],distribution={},groups=[],gaps=[];
const period=sec=>sec<25200?'00:00–07:00':sec<32400?'07:00–09:00':sec<41400?'09:00–11:30':sec<46800?'11:30–13:00':sec<70200?'13:00–19:30':'19:30–24:00';
for(let n=0;n<7;n++){
 const date=new Date(Date.UTC(2026,9,19+n)).toISOString().slice(0,10),f=s.plan(date),list=s.blockPlan(date,0,f).filter(e=>!e.visitor),daily=list.filter(e=>e.group),cross={};
 for(const e of daily){
  const key=period(e.start);distribution[key]||={count:0,places:{},crossFloor:0};const d=distribution[key];d.count++;d.places[e.card.id]=(d.places[e.card.id]||0)+1;
  const changing=e.people.filter(t=>t.home.floor!==e.card.floor);if(changing.length)d.crossFloor++;
  for(const t of changing)cross[t.id]=(cross[t.id]||0)+1;
  groups.push({day:date,start:e.start,end:e.end,people:e.group,place:e.card.id,crossFloor:changing.length>0});
 }
 week.push({day:date,groups:daily.length,trios:daily.filter(e=>e.group.length===3).length,crossFloorByPerson:cross});
 if(n<5)for(const r of JSON.parse(readAt('data/hani-building/office-places.json')).companions.filter(r=>r.people.length===3)){
  let cursor=41400,maxGap=0;
  for(const e of f.filter(e=>e.end>41400&&e.start<46800&&e.people.some(t=>r.people.includes(t.id))).sort((a,b)=>a.start-b.start)){maxGap=Math.max(maxGap,e.start-cursor);cursor=Math.max(cursor,e.end)}
  maxGap=Math.max(maxGap,46800-cursor);gaps.push({day:date,people:r.people,maxGap});
 }
}
// Diagnostic only: try all five related trios BEFORE optional solo outings,
// every 15s over lunch. Preserve the exact production attempt/reserve path.
const probe=`
 if(weekday)for(let time=41400;time<46800&&!result.some(e=>e.group?.length===3);time+=15){
  for(const r of placeTable.companions.filter(r=>r.people.length===3)){
   const people=r.people.map(id=>physical.find(p=>p.id===id));if(people.some(p=>!p))continue;
   globalThis.obr3Probe.attempts++;globalThis.obr3Probe.active=true;const ok=attempt(people,time);globalThis.obr3Probe.active=false;if(ok)break;
  }
 }
`;
const diagnostic=loadScene({transform:src=>src
 .replace('      for(let at=0;at<86400;at+=180){',probe+'      for(let at=0;at<86400;at+=180){')
 .replace('if(deadline-at<(people.length>1?60*rules.groupStayScale:30))return false;',"if(deadline-at<(people.length>1?60*rules.groupStayScale:30)){if(globalThis.obr3Probe?.active)globalThis.obr3Probe.shortGap++;return false;}")
 .replace('for(const card of cards){',"if(globalThis.obr3Probe?.active&&!cards.length)globalThis.obr3Probe.noCard++;for(const card of cards){")
 .replace('if(ceiling<range[0])continue;',"if(ceiling<range[0]){if(globalThis.obr3Probe?.active)globalThis.obr3Probe.travelGap++;continue;}")
 .replace('if(trips.some(t=>!t))continue;',"if(trips.some(t=>!t)){if(globalThis.obr3Probe?.active)globalThis.obr3Probe.noExcursion++;continue;}")
 .replace('if(e.end>deadline||!visitor&&!withinCap(e)||visitor&&result.some(q=>q.visitor&&overlap(q,e)))continue;',"if(e.end>deadline||!visitor&&!withinCap(e)||visitor&&result.some(q=>q.visitor&&overlap(q,e))){if(globalThis.obr3Probe?.active)globalThis.obr3Probe.fifoOrCap++;continue;}")
 .replace('if(!reserve(e,ledger,allowed))continue;',"if(!reserve(e,ledger,allowed)){if(globalThis.obr3Probe?.active)globalThis.obr3Probe.reservation++;continue;}")});
diagnostic.context.obr3Probe={attempts:0,shortGap:0,noCard:0,travelGap:0,noExcursion:0,fifoOrCap:0,reservation:0};const probeDays=[];
for(let n=0;n<5;n++){
 const date=new Date(Date.UTC(2026,9,19+n)).toISOString().slice(0,10),engine=diagnostic.scene.scheduler;
 probeDays.push({day:date,trios:engine.blockPlan(date,0,engine.plan(date)).filter(e=>e.group?.length===3).length});
}
const fileHashes={};
for(const file of ['index.html','hani-office-live.js','data/hani-building/spatial-contract.json','data/hani-building/office-places.json','assets/data/office-actions-216.json','assets/data/office-actions-221.json','assets/data/office-tap-lines.json']){
 const url=new URL(file,root);if(fs.existsSync(url))fileHashes[file]=crypto.createHash('sha256').update(fs.readFileSync(url)).digest('hex');
}
const result={base:'aa7cd35',performance:{day,firstPlanMs,warmSnapshotMs},formalSamples:samples,week,distribution,groups,trioCommonGaps:gaps,trioProbe:{...diagnostic.context.obr3Probe,days:probeDays},fileHashes};
write('obr3-metrics.json',result);
const fmt=n=>n.toFixed(2),range=r=>r?fmt(r.min)+'–'+fmt(r.max):'미관측';
write('obr3-formal-stays.md','|카탈로그 / 행동 id|전 AT_PLACE(초)|후 AT_PLACE(초)|후 표본|\n|---|---:|---:|---:|\n'+Object.keys({...samples.before,...samples.after}).sort().map(id=>'|'+id+'|'+range(samples.before[id])+'|'+range(samples.after[id])+'|'+(samples.after[id]?.count||0)+'|').join('\n')+'\n');
console.log(JSON.stringify({performance:result.performance,week,trioProbe:result.trioProbe,formalRows:Object.keys(samples.after).length},null,2));
