// Real deterministic scheduler, no browser, Git, persistence or network.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const phase=process.argv[2]||'after',{scene,table,context}=loadScene(),s=scene.scheduler;
let writes=0;const deny=()=>{writes++;throw Error('forbidden persistence/network')};
context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};context.fetch=deny;
const floors=['1f','2f','3f','4f','5f'],dates=['2026-11-02','2026-11-04','2026-11-07','2026-11-08'];
const leisure=new Set(['coffee','sofa','garden','terrace','window']);
const result={phase,method:'KST; hourly snapshots 09:00–18:00 inclusive; minute samples 09:00–17:59; non-work outings including travel, formal personalNonWork, rooftop/lounge occupants; excludes visitors/MIR and errands/reports/meetings/board/server',sourceSha256:createHash('sha256').update(fs.readFileSync('hani-office-live.js')).digest('hex'),dates:[]};
for(const day of dates){
 const options={chairmanPresent:true},formal=s.plan(day,options),out=s.blockPlan(day,0,formal,options),events=[...formal,...out];
 const isBreak=p=>{
  if(p.id==='mir')return false;
  const e=events.find(e=>e.id===(p.outingId||p.eventId));
  if(e)return e.card?leisure.has(e.card.kind):!!s.actions.get(e.actionId)?.personalNonWork;
  return p.floor==='5f'||p.activity==='rest';
 };
 const rows=[];for(let sec=32400;sec<=64800;sec+=60){
  const snap=s.snapshot(at(day,sec),options),people=snap.entries.filter(isBreak),byFloor=Object.fromEntries(floors.map(f=>[f,people.filter(p=>p.floor===f).length]));
  rows.push({time:String(Math.floor(sec/3600)).padStart(2,'0')+':'+String(Math.floor(sec%3600/60)).padStart(2,'0'),byFloor,total:people.length,ids:people.map(p=>p.id)});
 }
 const summarize=rows=>({samples:rows.length,mean:+(rows.reduce((n,r)=>n+r.total,0)/rows.length).toFixed(3),min:Math.min(...rows.map(r=>r.total)),max:Math.max(...rows.map(r=>r.total)),threeToFive:rows.filter(r=>r.total>=3&&r.total<=5).length,rooftopUsed:rows.filter(r=>r.byFloor['5f']>0).length,distribution:Object.fromEntries([...new Set(rows.map(r=>r.total))].sort((a,b)=>a-b).map(n=>[n,rows.filter(r=>r.total===n).length]))});
 result.dates.push({day,weekday:new Date(day).getUTCDay(),hourly:rows.filter(r=>r.time.endsWith(':00')),outsideLunch:summarize(rows.slice(0,-1).filter(r=>r.time<'11:30'||r.time>='13:00')),lunch:summarize(rows.filter(r=>r.time>='11:30'&&r.time<'13:00')),minutes:rows});
}
result.forbiddenCalls=writes;fs.mkdirSync('artifacts/office-cafe',{recursive:true});fs.writeFileSync('artifacts/office-cafe/breaks-'+phase+'.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.dates.map(({day,hourly,outsideLunch,lunch})=>({day,hourly:hourly.map(r=>r.total),outsideLunch,lunch})),null,2));
