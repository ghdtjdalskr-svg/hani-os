// Main comparison: 583cc97960d0e41e975d633b27b1e60d322bcfc4, chairman present.
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const baseline=[['2026-11-02',66,37,165,258,122],['2026-11-04',64,39,175,252,103],['2026-11-07',83,0,193,270,128],['2026-11-08',96,0,194,268,116]];
const s=loadScene().scene.scheduler,options={chairmanPresent:true},days=[];
function coverage(events,a,b){let until=36000,covered=0,gap=0;for(const e of [...events].sort((x,y)=>x[a]-y[a])){const start=Math.max(36000,e[a]),end=Math.min(57600,e[b]);if(start>=end)continue;gap=Math.max(gap,start-until);if(end>until){covered+=end-Math.max(start,until);until=end}}return {ratio:covered/21600,gap:Math.max(gap,57600-until)}}
for(const [day,...main] of baseline)test('cafe visitors: main-relative counts and visible appointments '+day,()=>{
 const formal=s.plan(day,options),out=s.blockPlan(day,0,formal,options),guests=out.filter(e=>e.visitor),kinds=['client','candidate','courier','rider','generic'],counts=kinds.map(k=>guests.filter(e=>e.visitor.kind===k).length);
 assert.ok(counts[0]>=main[0],'clients at least main');
 if(main[1])assert.ok(counts[1]>=main[1]*.9&&counts[1]<=main[1]*1.1,'weekday candidates within 10%');else assert.equal(counts[1],0);
 assert.ok(counts[2]>=main[2]*.75&&counts[2]<=main[2]*1.25,'couriers within 25%');
 for(const i of [3,4])assert.ok(counts[i]<=main[i]*1.25,kinds[i]+' no more than main +25%');
 const business=guests.filter(e=>['client','candidate'].includes(e.visitor.kind));
 for(const e of business)for(const t of e.people)assert.ok([...t.outbound,...t.inbound].every(a=>a.floor==='1f'),'whole business route stays on 1F');
 assert.ok(coverage(business,'start','end').ratio>=.75,'appointments on floor for at least 75% of 10–16h');
 assert.ok(coverage(business,'performStart','performEnd').ratio>=.70,'stationary appointments for at least 70%');
 assert.ok(coverage(business,'start','end').gap<=360,'no appointment gap exceeds six minutes');
 days.push({day,formal,out});console.log({day,counts,onFloor:coverage(business,'start','end')});
});
test('cafe visitors: weekday breaks and rooftop time retain REPORT-2 levels',()=>{
 const rows=[],leisure=new Set(['coffee','sofa','garden','terrace','window']);
 for(const {day,formal,out} of days.slice(0,2)){const events=[...formal,...out];for(let sec=32400;sec<64800;sec+=60){const people=s.snapshot(at(day,sec),options).entries.filter(p=>{if(p.id==='mir')return false;const e=events.find(e=>e.id===(p.outingId||p.eventId));return e?e.card?leisure.has(e.card.kind):!!s.actions.get(e.actionId)?.personalNonWork:p.floor==='5f'||p.activity==='rest'});rows.push({lunch:sec>=41400&&sec<46800,n:people.length,roof:people.some(p=>p.floor==='5f')})}}
 assert.equal(rows.length,1080);const outside=rows.filter(r=>!r.lunch),lunch=rows.filter(r=>r.lunch),mean=rs=>rs.reduce((n,r)=>n+r.n,0)/rs.length,roof=outside.filter(r=>r.roof).length/outside.length;
 assert.ok(mean(outside)>=3.4&&mean(outside)<=3.85,'about 3.6 outside lunch');assert.ok(mean(lunch)>=6.7&&mean(lunch)<=7.2,'about 6.9 at lunch');assert.ok(roof>=.45&&roof<=.55,'rooftop about half of non-lunch minutes');console.log({outside:mean(outside),lunch:mean(lunch),rooftop:roof});
});
