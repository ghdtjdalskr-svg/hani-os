import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import release from '../../../scripts/hani-release-284-source.cjs';
const evidence=[];
for(const file of ['index.html','hani-main.js']){
 const name='artifacts/kids-visit/baseline/'+file,before=fs.readFileSync(name,'utf8'),row=release.delta.files[file];
 assert.equal(release.hash(before),row.before,'existing independently pinned raw 283 baseline');
 assert.equal(before.split('2.9.283').length-1,row.count);
 const after=before.replaceAll('2.9.283','2.9.284');assert.equal(release.hash(after),row.after);
 const backup='artifacts/kids-visit-b/merge-evidence/originals/'+name;fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,before);
 fs.writeFileSync(name,after);evidence.push({file:name,before:row.before,after:row.after,versionTokens:row.count});
}
fs.writeFileSync('artifacts/kids-visit-b/merge-evidence/raw-baseline-refresh.json',JSON.stringify(evidence,null,2)+'\n');
