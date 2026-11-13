import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out='artifacts/life-bundle/283',hash=b=>createHash('sha256').update(b).digest('hex');
const walk=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]):[];
const results=[];
for(const dir of [out+'/before/artifacts',out+'/before-later/artifacts'])for(const snapshot of walk(dir)){
 const file=path.relative(dir,snapshot).replaceAll('\\','/'),dest='artifacts/'+file;
 const original=fs.readFileSync(snapshot),current=fs.readFileSync(dest);
 const changed=hash(current)!==hash(original);
 if(changed){
  const saved=out+'/generated-office/'+file;
  fs.mkdirSync(path.dirname(saved),{recursive:true});fs.writeFileSync(saved,current);
  fs.writeFileSync(dest,original);
 }
 assert.equal(hash(fs.readFileSync(dest)),hash(original));
 results.push({file:dest,changed,restored:true,beforeSha256:hash(original),testSha256:hash(current)});
}
const retained=['artifacts/l216-2/simulation-status.json','artifacts/l216-2/reachability-status.json','artifacts/night-actions-221/targeted.json','artifacts/bori-fix/daily-evidence.json','artifacts/bori-fix/tour-evidence.json','artifacts/bori-fix/dom-40x.json','artifacts/wishlist/edge-results.json',...walk('artifacts/wishlist').filter(f=>f.endsWith('.png')),...walk('artifacts/procrastination').filter(f=>f.endsWith('.png'))];
fs.writeFileSync(out+'/artifact-cleanup.json',JSON.stringify({restoredSnapshots:results,retainedOutputs:retained.map(file=>({file,exists:fs.existsSync(file),sha256:fs.existsSync(file)?hash(fs.readFileSync(file)):null,note:'test output retained; no claim of tracked Git diff without Git'}))},null,2)+'\n');
console.log(JSON.stringify({snapshotsChecked:results.length,changedAndRestored:results.filter(r=>r.changed).map(r=>r.file),retained:retained.length}));
