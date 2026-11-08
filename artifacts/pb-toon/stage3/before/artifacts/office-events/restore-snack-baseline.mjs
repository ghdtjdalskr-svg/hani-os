// Restore the missing snack fixture from independently fetched c301a13 source.
// Refuse current assets unless their Git blob IDs match the original commit tree.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadScene,at} from '../../scripts/hani-office-lively-fixture.mjs';
const dir='artifacts/office-events/',inputs=JSON.parse(fs.readFileSync(dir+'baseline-inputs.json','utf8'));
const sha256=s=>createHash('sha256').update(s).digest('hex');
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
for(const row of inputs.files){
 const file=row.path==='hani-office-live.js'?dir+'c301a13-hani-office-live.js.txt':row.path;
 let bytes=fs.readFileSync(file);
 // apply_patch may append a terminal blank line to the fetched text artifact.
 if(row.path==='hani-office-live.js'&&blob(bytes)!==row.sha&&bytes.at(-1)===10&&blob(bytes.subarray(0,-1))===row.sha){bytes=bytes.subarray(0,-1);fs.writeFileSync(file,bytes)}
 assert.equal(blob(bytes),row.sha,row.path+' must match independently fetched c301a13 Git tree');
}
const source=fs.readFileSync(dir+'c301a13-hani-office-live.js.txt','utf8');
const anchors=[['scheduler','  function createScheduler(','  // Read-only label geometry'],['view snapshot','  function snapshot(now=new Date()','  function profile('],['screenHomeClear','    function screenHomeClear(','    function stationaryStops('],['placeStatusLabels','  function placeStatusLabels(','  const scheduler='],['fitStatusLabels','  function fitStatusLabels(','  if(buildingChairmanSlot())people.push'],['residents model','  const residentNames=','  function createPresence('],['residents renderer','  function updateResidents(now){','  function selectFloor(']];
const sections=anchors.map(([name,start,end])=>{const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,name);return {name,start,end,sha256:sha256(source.slice(a,b))}});
const {scene}=loadScene({transform:()=>source}),models=[];
for(const day of ['2026-01-17','2026-07-23','2026-11-05','2026-11-06'])for(const chairmanPresent of [false,true]){
 const options={chairmanPresent},s=scene.scheduler,plan=s.plan(day,options);
 const snapshots=[0,10800,25200,36000,43200,64800,82800,86399].map(seconds=>({seconds,scheduler:sha256(JSON.stringify(s.snapshot(at(day,seconds),options))),view:sha256(JSON.stringify(scene.snapshot(at(day,seconds),options)))}));
 models.push({day,options,plan:sha256(JSON.stringify(plan)),blockPlan:sha256(JSON.stringify(s.blockPlan(day,0,plan,options))),snapshots});
}
const baseline={ref:inputs.ref,sourceBlob:inputs.files.find(f=>f.path==='hani-office-live.js').sha,sourceSha256:sha256(source),inputs:inputs.files,sections,models};
fs.writeFileSync('artifacts/office-snack/baseline.json',JSON.stringify(baseline,null,2)+'\n');
console.log(JSON.stringify({ref:baseline.ref,sourceSha256:baseline.sourceSha256,inputs:inputs.files.length,sections:sections.length,models:models.length,snapshots:models.reduce((n,m)=>n+m.snapshots.length,0)}));
