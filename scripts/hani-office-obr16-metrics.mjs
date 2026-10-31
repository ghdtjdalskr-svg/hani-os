import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const day='2026-10-22',result={node:process.version,runtimeSha256:createHash('sha256').update(fs.readFileSync('hani-office-live.js')).digest('hex'),day,performance:[],reports:[]};
const sampleIndex=process.argv.indexOf('--sample');
if(sampleIndex>=0){
 const chairmanPresent=process.argv[sampleIndex+1]==='true',run=Number(process.argv[sampleIndex+2]);assert.ok([1,2,3].includes(run));
 const {scene}=loadScene(),s=scene.scheduler,o=chairmanPresent?{chairmanPresent,chairmanSince:at(day,32400).getTime(),chairmanArrivalAt:at(day,32400).getTime()}:{chairmanPresent};
 const start=performance.now(),f=s.plan(day,o),out=s.blockPlan(day,0,f,o),cold=performance.now()-start,begin=performance.now();
 for(let i=0;i<1000;i++)s.snapshot(at(day,50400+i),o);
 const row={node:result.node,runtimeSha256:result.runtimeSha256,day,chairmanPresent,run,cold,warm:(performance.now()-begin)/1000,reports:out.filter(e=>e.report).map(e=>({id:e.report,start:e.start,performStart:e.performStart,performEnd:e.performEnd,end:e.end,home:e.people[0].home.floor,target:e.people[0].seat.anchor,topic:s.snapshot(at(day,e.performStart+.001),o).entries.find(p=>p.id===e.report).reportTopic}))};
 fs.writeFileSync(`artifacts/office-behavior/obr16-perf-${chairmanPresent}-${run}.json`,JSON.stringify(row,null,2)+'\n');console.log(JSON.stringify({...row,reports:row.reports.length}));
}else{
 result.method='six independent fresh Node processes; 3 cold plans/presence; 1000 warm snapshots/process; actual since/arrival options';
 for(const chairmanPresent of [false,true]){const rows=[1,2,3].map(run=>JSON.parse(fs.readFileSync(`artifacts/office-behavior/obr16-perf-${chairmanPresent}-${run}.json`)));for(const row of rows){assert.equal(row.runtimeSha256,result.runtimeSha256);assert.equal(row.node,result.node);assert.equal(row.day,day);assert.equal(row.chairmanPresent,chairmanPresent);}const cold=rows.map(r=>r.cold),warm=rows.map(r=>r.warm);result.performance.push({chairmanPresent,cold,warm,best:Math.min(...cold),maxWarm:Math.max(...warm)});if(chairmanPresent)result.reports=rows[0].reports;}
 fs.writeFileSync('artifacts/office-behavior/obr16-metrics.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.performance));for(const r of result.performance){assert.ok(r.best<400,'first best-of-3 <400ms '+r.chairmanPresent);assert.ok(r.maxWarm<3,'warm <3ms '+r.chairmanPresent);}
}
