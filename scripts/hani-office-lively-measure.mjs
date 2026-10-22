// Measures visible-change frequency per floor from the real scheduler (read-only, no DOM timers).
import fs from 'node:fs';
import {fixture} from './hani-building-206-engine.test.mjs';
const table=JSON.parse(fs.readFileSync(new URL('../assets/data/office-actions-221.json',import.meta.url),'utf8'));
export function measure(day,from,to,step=1){
  const f=fixture('09:00',false,null,table),scene=f.context.HaniBuildingScene,s=scene.scheduler;
  const result={};let prev=null;const floors=['1f','2f','3f','4f'];
  for(const fl of floors)result[fl]={changes:0,longestStatic:0,lastChange:null,people:0,lines:new Set()};
  const start=Date.parse(`${day}T${from}:00+09:00`),end=Date.parse(`${day}T${to}:00+09:00`);
  for(let t=start;t<end;t+=step*1000){
    const snap=s.snapshot(new Date(t),{}),cur=new Map(snap.entries.map(e=>[e.id,e]));
    if(new Set(snap.entries.map(e=>e.seat.anchor)).size!==snap.entries.length)throw new Error('shared seat at '+new Date(t).toISOString());
    for(const e of snap.entries)if(e.stroll&&!e.walking)result.strollSeconds=(result.strollSeconds||0)+step;
    for(const fl of floors){
      const r=result[fl],ids=[...cur.values()].filter(e=>e.floor===fl).map(e=>e.id).sort();
      r.people=Math.max(r.people,ids.length);for(const id of ids)r.lines.add(cur.get(id).line);
      if(r.lastChange===null)r.lastChange=t;
      if(prev){const changed=ids.some(id=>{const a=prev.get(id),b=cur.get(id);return !a||a.floor!==fl||a.line!==b.line||a.pose!==b.pose||a.seat.anchor!==b.seat.anchor||a.walking!==b.walking})||[...prev.values()].some(e=>e.floor===fl&&cur.get(e.id)?.floor!==fl);
        if(changed){r.changes++;r.longestStatic=Math.max(r.longestStatic,(t-r.lastChange)/1000);r.lastChange=t}}
    }
    prev=cur;
  }
  const span=(end-start)/1000;
  console.log('stroll-at-spot seconds',result.strollSeconds||0);
  return Object.fromEntries(floors.map(fl=>{const r=result[fl];r.longestStatic=Math.max(r.longestStatic,(end-r.lastChange)/1000);return [fl,{people:r.people,changesPerMin:+(r.changes/span*60).toFixed(2),avgGapSec:r.changes?+(span/r.changes).toFixed(1):span,longestStaticSec:r.longestStatic,distinctLines:r.lines.size}]}));
}
if(process.argv[1]?.endsWith('hani-office-lively-measure.mjs')){
  for(const [label,day,a,b] of [['weekday day','2026-10-21','14:00','15:00'],['weekday evening','2026-10-21','19:00','20:00'],['weekday late','2026-10-21','23:00','23:59'],['weekend day','2026-10-24','14:00','15:00']])console.log(label,JSON.stringify(measure(day,a,b)));
}
