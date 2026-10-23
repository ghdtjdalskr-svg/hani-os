// Same clock, presence and sampler for release230 / pre-obr7 / current runtime.
// Counts episodes, not every second of a continuously displayed sentence.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {loadScene,at,root,readAt} from './hani-office-lively-fixture.mjs';
export const periods=[['출근',9,10],['오전',10,12],['점심',11.5,13],['오후',13,15],['졸린 오후',15,17],['저녁',18,21],['심야',1,7]];
const floors=['1f','2f','3f','4f','5f'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
const q=(a,p)=>a.length?[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)]:null;
const make=()=>({seconds:0,personSeconds:0,maxPeople:0,changes:0,lastChange:0,longestStatic:0,uniqueSum:0,uniquePerPersonSum:0,lineSeconds:0,multiLineSeconds:0,duplicateSeconds:0,duplicateExcess:0,starts:0,lineRepeats:0,placeRepeats:0,intervals:[],kinds:{standing:0,walking:0,outing:0,group:0,formal:0},minutes:0,noWalkingMinutes:0,noChangeMinutes:0,visitors:0,visitorSeconds:0,ids:new Set(),lines:new Set()});
const freshWindow=(day,floor,start)=>({...make(),day,floor,start,end:start+600,lineSeen:new Set(),placeSeen:new Set()});
const finish=r=>({seconds:r.seconds,peopleMax:r.maxPeople,peopleMean:r.personSeconds/r.seconds,peopleIds:[...r.ids],avgGapSec:r.changes?r.seconds/r.changes:r.seconds,longestStaticSec:r.longestStatic,changes:r.changes,changesPerPersonMinute:r.personSeconds?r.changes/r.personSeconds*60:0,distinctLines:r.lines.size,distinctLinesPerPerson:r.ids.size?r.lines.size/r.ids.size:0,visibleUniqueMean:r.uniqueSum/r.seconds,visibleUniquePerPerson:r.uniquePerPersonSum/r.seconds,duplicateRate:r.lineSeconds?r.duplicateSeconds/r.lineSeconds:0,duplicateRateWith2Lines:r.multiLineSeconds?r.duplicateSeconds/r.multiLineSeconds:0,duplicateExcessPerPerson:r.personSeconds?r.duplicateExcess/r.personSeconds:0,lineEpisodes:r.starts,lineRepeats:r.lineRepeats,placeRepeats:r.placeRepeats,lineRepeatsPerPerson:r.ids.size?r.lineRepeats/r.ids.size:0,placeRepeatsPerPerson:r.ids.size?r.placeRepeats/r.ids.size:0,samePersonRepeatGapMean:mean(r.intervals),samePersonRepeatGapMin:r.intervals.length?Math.min(...r.intervals):null,samePersonRepeatGapP10:q(r.intervals,.1),shares:Object.fromEntries(Object.entries(r.kinds).map(([k,v])=>[k,r.personSeconds?v/r.personSeconds:0])),noWalkingMinutes:r.noWalkingMinutes,noChangeMinutes:r.noChangeMinutes,minutes:r.minutes,visitorEpisodes:r.visitors,visitorSeconds:r.visitorSeconds});
export function simulate(label,day){
 const is230=label==='230',source=is230?readAt('hani-office-live.js','ad3c2f3'):label==='前'?fs.readFileSync(new URL('artifacts/office-behavior/obr7-before.js',root),'utf8'):readAt('hani-office-live.js');
 // 230 does not export homeAt; expose that existing pure function for measurement only.
 const instrumented=is230?source.replace('return Object.freeze({plan,snapshot,seed,slot,actions,windows,presentAt,identity:', 'return Object.freeze({homeAt,plan,snapshot,seed,slot,actions,windows,presentAt,identity:'):source;
 assert.ok(!is230||instrumented!==source,'230 measurement adapter anchor');
 const {scene,table,context}=loadScene({ref:is230?'ad3c2f3':null,transform:()=>instrumented}),s=scene.scheduler,options={chairmanPresent:true};
 let writes=0;const forbidden=()=>{writes++;throw Error('storage write forbidden')};context.localStorage=context.sessionStorage={setItem:forbidden,removeItem:forbidden,clear:forbidden};
 const people=new Map(table.people.map(p=>[p.id,p]));
 const records=Object.fromEntries(floors.map(f=>[f,Object.fromEntries(periods.map(([name])=>[name,make()]))]));
 const windows=[],current={},prevSign={},prev=new Map(),lastLines=new Map(),daily=Object.fromEntries(table.people.map(p=>[p.id,{id:p.id,name:p.name,home:p.home.floor,seconds:0,lines:new Set(),places:new Set(),actions:new Set(),episodes:0,repeatGaps:[]}])) ,minute={};
 for(const f of floors){current[f]=freshWindow(day,f,0);minute[f]={walk:false,change:false,people:false}}
 const formal=s.plan(day,options),outings=s.blockPlan?.(day,0,formal,options)||[];
 let guestPrev=null;
 for(let sec=0;sec<86400;sec++){
  const snap=s.snapshot(at(day,sec),options),entries=snap.entries,visitors=snap.visitors||[];
  const buckets=Object.fromEntries(floors.map(f=>[f,entries.filter(p=>p.floor===f)]));
  const periodsNow=periods.filter(([,a,b])=>a*3600<=sec&&sec<b*3600).map(([name])=>name);
  const repeatEpisodes=new Map();
  for(const p of entries){const d=daily[p.id];d.seconds++;if(!p.plain&&p.line){d.lines.add(p.line);const old=prev.get(p.id);if(!old||old.plain||old.line!==p.line){d.episodes++;const k=p.id+'\0'+p.line;if(lastLines.has(k)){const gap=sec-lastLines.get(k);d.repeatGaps.push(gap);repeatEpisodes.set(p.id,gap)}lastLines.set(k,sec)}}
   const home=s.homeAt(people.get(p.id),sec);if(!p.walking&&!p.waiting&&(p.stroll||p.eventId)&&p.seat.anchor!==home.anchorId)d.places.add(p.seat.anchor);
   if(p.actionId!=='base-work')d.actions.add(p.actionId);else if(p.stroll)d.actions.add('outing');else if(!p.plain)d.actions.add(p.pose==='standing'?'idle-stand':'idle-sit');
  }
  for(const f of floors){
   if(sec&&sec%600===0){const w=current[f];w.longestStatic=Math.max(w.longestStatic,sec-w.lastChange);windows.push({...finish(w),day,floor:f,start:w.start,end:sec});current[f]=freshWindow(day,f,sec);current[f].lastChange=sec}
   const list=buckets[f],guests=visitors.filter(p=>p.floor===f),all=[...list,...guests];
   // Exactly the original lively signature (plus the visitor slot); no every-frame XY inflation.
   const signature=all.map(p=>[p.id,p.line,p.pose,p.seat.anchor,!!p.walking].join('|')).sort().join('\n');
   const changed=sec>0&&signature!==prevSign[f];prevSign[f]=signature;
   const shown=list.filter(p=>!p.plain&&p.line),lines=shown.map(p=>p.line),unique=new Set(lines);
   const starts=shown.filter(p=>{const old=prev.get(p.id);return !old||old.plain||old.floor!==f||old.line!==p.line});
   const placeStarts=list.flatMap(p=>{
    const old=prev.get(p.id),home=s.homeAt(people.get(p.id),sec);
    const card=!p.walking&&!p.waiting&&(p.stroll||p.eventId)&&p.seat.anchor!==home.anchorId?p.seat.anchor:null;
    const prior=old&&!old.walking&&!old.waiting&&(old.stroll||old.eventId)&&old.seat.anchor!==home.anchorId?old.seat.anchor:null;
    return card&&card!==prior?[[p.id,card]]:[];
   });
   const categories={standing:list.filter(p=>p.pose==='standing'&&!p.walking).length,walking:list.filter(p=>p.walking).length,outing:list.filter(p=>p.stroll).length,group:list.filter(p=>p.groupIds?.length>1||snap.events.some(e=>e.people.length>1&&e.people.some(t=>t.id===p.id))).length,formal:list.filter(p=>p.eventId).length};
   const targets=[current[f],...periodsNow.map(name=>records[f][name])];
   const m=minute[f];m.walk||=categories.walking>0;m.change||=changed;m.people||=list.length>0;
   for(const r of targets){
    if(!r.seconds)r.lastChange=sec;
    r.seconds++;r.personSeconds+=list.length;r.maxPeople=Math.max(r.maxPeople,list.length);for(const p of list)r.ids.add(p.id);
    if(changed){r.changes++;r.longestStatic=Math.max(r.longestStatic,sec-r.lastChange);r.lastChange=sec}
    r.uniqueSum+=unique.size;r.uniquePerPersonSum+=list.length?unique.size/list.length:0;r.lineSeconds+=!!lines.length;r.multiLineSeconds+=lines.length>=2;
    if(lines.length>unique.size)r.duplicateSeconds++;r.duplicateExcess+=lines.length-unique.size;for(const line of unique)r.lines.add(line);
    for(const [kind,n]of Object.entries(categories))r.kinds[kind]+=n;
    r.starts+=starts.length;
    for(const p of starts)if(repeatEpisodes.has(p.id))r.intervals.push(repeatEpisodes.get(p.id));
    r.visitorSeconds+=guests.length;if(guests.length&&!guestPrev)r.visitors++;
    if(sec%60===59&&m.people){r.minutes++;if(!m.walk)r.noWalkingMinutes++;if(!m.change)r.noChangeMinutes++}
   }
   const w=current[f];for(const p of starts){if(w.lineSeen.has(p.line))w.lineRepeats++;w.lineSeen.add(p.line)}
   for(const [,card]of placeStarts){if(w.placeSeen.has(card))w.placeRepeats++;w.placeSeen.add(card)}
   if(sec%60===59)minute[f]={walk:false,change:false,people:false};
  }
  guestPrev=visitors.length?visitors[0]:null;prev.clear();for(const p of entries)prev.set(p.id,p);
 }
 for(const f of floors){const w=current[f];w.longestStatic=Math.max(w.longestStatic,86400-w.lastChange);windows.push({...finish(w),day,floor:f,start:w.start,end:86400});
  for(const [name,a,b]of periods){const r=records[f][name],ws=windows.filter(w=>w.floor===f&&w.start>=a*3600&&w.end<=b*3600);r.longestStatic=Math.max(r.longestStatic,b*3600-r.lastChange);r.lineRepeats=ws.reduce((n,w)=>n+w.lineRepeats,0);r.placeRepeats=ws.reduce((n,w)=>n+w.placeRepeats,0);records[f][name]={...finish(r),tenMinuteWindows:ws.length,lineRepeatsPer10m:mean(ws.map(w=>w.lineRepeats)),placeRepeatsPer10m:mean(ws.map(w=>w.placeRepeats))}}
 }
 assert.equal(writes,0);
 return {label,day,sourceSha256:hash(source),stepSeconds:1,options,roster:table.people.map(p=>p.id),formal:formal.length,outings:outings.length,storageWrites:writes,records,windows,daily:Object.values(daily).map(d=>({...d,lines:[...d.lines],places:[...d.places],actions:[...d.actions],repeatGaps:undefined,repeatGapMean:mean(d.repeatGaps),repeatGapMin:d.repeatGaps.length?Math.min(...d.repeatGaps):null}))};
}
const args=process.argv.slice(2);
if(args.includes('--run')){
 const label=args[args.indexOf('--run')+1],out=args[args.indexOf('-o')+1];assert.ok(out);
 const result=[];for(const day of ['2026-10-22','2026-10-24']){console.log(label,day,'매초 시뮬레이션 시작');result.push(simulate(label,day));console.log(label,day,'86,400초 완료')}
 fs.writeFileSync(new URL(out,root),JSON.stringify(result,null,2)+'\n');
}
