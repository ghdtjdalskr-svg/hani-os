import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out='artifacts/tooling-283',hash=b=>createHash('sha256').update(b).digest('hex');
const initial=JSON.parse(fs.readFileSync(out+'/initial-files.json')),restore=JSON.parse(fs.readFileSync(out+'/restore-files.json'));
const files=['artifacts/l216-2/simulation-status.json','artifacts/l216-2/reachability-status.json','artifacts/night-actions-221/targeted.json','artifacts/bori-fix/daily-evidence.json','artifacts/bori-fix/tour-evidence.json','artifacts/bori-fix/dom-40x.json','artifacts/office-behavior/obr19-vocabulary.json','artifacts/office-behavior/obr21-stationary.json','artifacts/pet-bori-live/schedule-evidence.json','artifacts/office-tlayout-apply/phone-boxes.json','artifacts/m9-link/closure.json'];
const evidence=[];
for(const file of files){const row=initial.find(r=>r.file===file);if(!row){evidence.push({file,initiallyAbsent:true});continue;}
 if(restore.includes(file)){assert.equal(hash(fs.readFileSync(out+'/before/'+file)),row.sha256);evidence.push({file,source:'previously verified snapshot',sha256:row.sha256});continue;}
 const source=[file,'../life-bundle/'+file].find(f=>fs.existsSync(f)&&hash(fs.readFileSync(f))===row.sha256);
 assert.ok(source,file+' matching original snapshot');
 fs.mkdirSync(path.dirname(out+'/before/'+file),{recursive:true});fs.copyFileSync(source,out+'/before/'+file);if(!restore.includes(file))restore.push(file);evidence.push({file,source,sha256:row.sha256});
}
fs.writeFileSync(out+'/restore-files.json',JSON.stringify(restore,null,2));
fs.writeFileSync(out+'/output-snapshot-evidence.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence));
