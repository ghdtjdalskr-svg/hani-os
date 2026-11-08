import fs from 'node:fs';
import {loadScene,at} from '../../scripts/hani-office-lively-fixture.mjs';
const {scene}=loadScene(),r=scene.residents,owner=r.createKidsVisits(),counts={},examples=[];
const start=Number(process.argv[2]||42690),end=Number(process.argv[3]||42830),step=.25;
for(let t=start;t<end;t+=step){
 const now=at('2026-11-08',t),staff=scene.snapshot(now,{chairmanPresent:true}),existing=r.snapshot(now,staff),states=[...existing,...r.companionSnapshot(now,staff,true,false,existing)];
 owner.update(now,staff,states);
 for(const kid of states.filter(p=>p.kid)){
  const key=kid.id+':'+(kid.artPose||kid.pose);counts[key]=(counts[key]||0)+1;
  if(kid.id==='kid-suyeon'&&kid.artPose==='cling'&&examples.length<5)examples.push({seconds:t,floor:kid.floor,position:kid.position});
 }
}
const result={sampleIntervalSeconds:step,startSeconds:start,endSeconds:end,day:'2026-11-08',counts,examples};
fs.writeFileSync(new URL('natural-pose-evidence.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
