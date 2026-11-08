import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out='artifacts/kids-visit-b/merge-evidence',manifest=out+'/protected-artifacts.json';
function scan(folder,rows=[]){for(const e of fs.readdirSync(folder,{withFileTypes:true})){
 const file=folder+'/'+e.name;if(file.startsWith(out)||file.startsWith('artifacts/kids-visit-b/merge-shots')||file.includes('/node_modules/')||file.includes('/.git/'))continue;
 if(e.isDirectory())scan(file,rows);else if(e.isFile()&&file.endsWith('.json'))rows.push(file);
}return rows;}
if(process.argv[2]==='save'){
 if(fs.existsSync(manifest))throw Error('do not overwrite evidence backup');
 fs.writeFileSync(manifest,JSON.stringify(scan('artifacts').map(file=>({file,bytes:fs.readFileSync(file).toString('base64')}))));
}else{
 const rows=JSON.parse(fs.readFileSync(manifest)),known=new Set(rows.map(r=>r.file)),changed=[];
 const allowed=new Set(['artifacts/office-219/label-unit-results.json','artifacts/l216-2/simulation-status.json','artifacts/l216-2/reachability-status.json','artifacts/night-actions-221/targeted.json','artifacts/bori-fix/daily-evidence.json','artifacts/bori-fix/tour-evidence.json','artifacts/bori-fix/dom-40x.json','artifacts/office-drama/reachability.json','artifacts/fix-218/clock-results.json','artifacts/office-behavior/obr16-layout-node.json','artifacts/office-behavior/obr17-layout-node.json','artifacts/office-behavior/obr19-layout-node.json','artifacts/office-behavior/obr19-vocabulary.json','artifacts/office-behavior/obr21-stationary.json','artifacts/pet-bori-live/schedule-evidence.json','artifacts/office-tlayout-apply/phone-boxes.json']);
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 for(const row of rows){const bytes=Buffer.from(row.bytes,'base64');if(!fs.existsSync(row.file)||!fs.readFileSync(row.file).equals(bytes)){
  assert.ok(allowed.has(row.file),'unowned artifact changed; preserve it: '+row.file);
  const after=fs.existsSync(row.file)?hash(fs.readFileSync(row.file)):null;fs.writeFileSync(row.file,bytes);assert.ok(fs.readFileSync(row.file).equals(bytes));changed.push({file:row.file,before:hash(bytes),testOutput:after,restored:true});
 }}
 const added=scan('artifacts').filter(file=>!known.has(file));
 for(const file of added){assert.ok(allowed.has(file),'unowned new artifact; preserve it: '+file);const name=out+'/generated/'+file;fs.mkdirSync(name.slice(0,name.lastIndexOf('/')),{recursive:true});fs.copyFileSync(file,name);fs.unlinkSync(file);}
 fs.writeFileSync(out+'/artifact-restoration.json',JSON.stringify({changed,added},null,2)+'\n');console.log(JSON.stringify({restored:changed.length,newOutputsRelocated:added.length}));
}
