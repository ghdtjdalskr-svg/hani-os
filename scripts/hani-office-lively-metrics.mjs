import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {loadScene,at,root} from './hani-office-lively-fixture.mjs';
export function metrics(day='2026-10-22'){
 const {scene,table}=loadScene(),s=scene.scheduler;
 let begin=performance.now();const formal=s.plan(day);const formalMs=performance.now()-begin;
 begin=performance.now();const outings=s.blockPlan(day,0,formal);const outingMs=performance.now()-begin;
 const staff=outings.filter(e=>!e.visitor),people={};
 for(const p of table.people.filter(p=>!['mir','seongmin'].includes(p.id))){
  const trips=staff.filter(e=>e.people.some(t=>t.id===p.id)),work=trips.filter(e=>e.start>=32400&&e.start<64800);
  people[p.id]={trips:trips.length,workTrips:work.length,cards:[...new Set(work.map(e=>e.card.id))],minCooldown:trips.length>1?Math.min(...trips.slice(1).map((e,i)=>e.start-trips[i].end)):null,intervals:work.slice(1).map((e,i)=>e.start-work[i].start),lines:0};
 }
 const lines=Object.fromEntries(Object.keys(people).map(id=>[id,new Set()]));
 begin=performance.now();for(let sec=32400;sec<64800;sec+=1)for(const p of s.snapshot(at(day,sec)).entries)lines[p.id]?.add(p.line);
 const warmMs=(performance.now()-begin)/32400;
 for(const [id,set]of Object.entries(lines))people[id].lines=set.size;
 const byKind={};for(const e of outings){const kind=e.visitor?'visitor-'+e.visitor.kind:e.card.kind;(byKind[kind]||=[]).push(e.people.map(t=>(t.back[0]?.start??e.end)-(t.out.at(-1)?.end??e.start)))}
 const stay=Object.fromEntries(Object.entries(byKind).map(([k,v])=>[k,{count:v.length,min:Math.min(...v.flat()),max:Math.max(...v.flat())}]));
 const rhythms={};for(const [name,a,b]of [['morning',9,10],['lunch',11.5,13],['afternoon',15,16],['evening',18,21]]){
  const list=staff.filter(e=>e.start>=a*3600&&e.start<b*3600);rhythms[name]={trips:list.length,coffeeTerrace:list.filter(e=>['coffee','terrace'].includes(e.card.kind)).length,kinds:Object.fromEntries([...new Set(list.map(e=>e.card.kind))].map(k=>[k,list.filter(e=>e.card.kind===k).length]))};
 }
 const groups=staff.filter(e=>e.group).map(e=>({start:e.start,end:e.end,people:e.group,card:e.card.id}));
 const caps={normal:{units:0,people:0},lunch:{units:0,people:0},late:{units:0,people:0}},missingWindows=[];
 const budget=[...staff,...formal.filter(e=>e.people.some(t=>t.seat.anchor!==t.home.anchorId)).map(e=>({...e,floors:[...new Set(e.people.flatMap(t=>[t.home.floor,scene.anchors.get(t.seat.anchor).floor]))]}))];
 const ticks=[...new Set(budget.flatMap(e=>[e.start,e.end-.00001]))];
 for(const sec of ticks)for(const f of ['1f','2f','3f','4f','5f']){
  const active=budget.filter(e=>e.start<=sec&&sec<e.end&&e.floors.includes(f)),period=sec>=3600&&sec<25200?'late':sec>=41400&&sec<46800?'lunch':'normal';
  caps[period].units=Math.max(caps[period].units,active.length);caps[period].people=Math.max(caps[period].people,active.reduce((n,e)=>n+e.people.length,0));
 }
 for(let start=32400;start<64800;start+=600)for(const f of ['2f','3f','4f'])if(!staff.some(e=>e.floors.includes(f)&&e.start<start+600&&start<e.end))missingWindows.push({floor:f,start});
 for(const p of Object.values(people)){p.meanIntervalMinutes=p.intervals.length?p.intervals.reduce((n,v)=>n+v,0)/p.intervals.length/60:null;p.minIntervalMinutes=Math.min(...p.intervals)/60;p.maxIntervalMinutes=Math.max(...p.intervals)/60}
 const result={day,formalMs,outingMs,firstPlanMs:formalMs+outingMs,warmMs,formal:formal.length,outings:outings.length,people,stay,rhythms,groups,caps,missingWindows};
 fs.writeFileSync(new URL('artifacts/office-behavior/lively-v2-metrics.json',root),JSON.stringify(result,null,2)+'\n');return result;
}
if(process.argv[1]?.endsWith('hani-office-lively-metrics.mjs'))console.log(JSON.stringify(metrics(),null,2));
