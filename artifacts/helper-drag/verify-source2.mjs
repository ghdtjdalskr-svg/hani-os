// Independent read-only proof from fixed loose Git objects; no Git subprocess.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {helper275Delta,restoreHelper275Source} from '../../scripts/hani-helper-275-source.mjs';
import {normalizeReleaseVersion} from '../../scripts/hani-reviewed-release-baseline.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const workGit=fs.readFileSync(path.join(root,'.git'),'utf8').trim().slice(8);
const common=path.resolve(workGit,fs.readFileSync(path.join(workGit,'commondir'),'utf8').trim());
const hash=(b,algo='sha256')=>createHash(algo).update(b).digest('hex');
function object(id){
 const bytes=inflateSync(fs.readFileSync(path.join(common,'objects',id.slice(0,2),id.slice(2))));
 assert.equal(hash(bytes,'sha1'),id,'independent Git object integrity');
 return bytes.subarray(bytes.indexOf(0)+1);
}
function filesAt(commit){
 const tree=object(object(commit).toString().match(/^tree ([a-f0-9]{40})/)[1]),files={};let p=0;
 while(p<tree.length){const zero=tree.indexOf(0,p),name=tree.subarray(p,zero).toString().split(' ')[1];files[name]=tree.subarray(zero+1,zero+21).toString('hex');p=zero+21;}
 return files;
}
const base='507c344775c70eb25bf4f4e8107cbb3169cd489e';
assert.equal(helper275Delta.baseCommit,base);const baseFiles=filesAt(base),proved=[];
for(const row of helper275Delta.files){
 const before=object(baseFiles[row.file]),current=fs.readFileSync(path.join(root,row.file),'utf8');
 assert.equal(baseFiles[row.file],row.beforeBlobSha1);assert.equal(hash(before),row.beforeSha256);
 assert.equal(restoreHelper275Source(current,row.file),before.toString('utf8'));
 let forward=before.toString('utf8');for(const r of row.replacements)forward=forward.replace(r.before,()=>r.after);assert.equal(forward,current);
 proved.push({file:row.file,blob:baseFiles[row.file],beforeSha256:hash(before),afterSha256:hash(current)});
}
for(const row of helper275Delta.unchangedRuntime){const before=object(baseFiles[row.file]);assert.equal(hash(before),row.sha256);assert.equal(normalizeReleaseVersion(fs.readFileSync(path.join(root,row.file),'utf8'),'2.9.274'),normalizeReleaseVersion(before.toString('utf8'),'2.9.274'));}
const head='349fda9311ca7012158a9450fad628f3b3a279dd',headFiles=filesAt(head),unchanged=[];
assert.equal(fs.readFileSync(path.join(common,'refs/heads/hani/helper-drag'),'utf8').trim(),head,'fixed task HEAD');
for(const file of ['hani-ui-v02992.js','hani-style-08.css','hani-office-live.js','hani-office-live.css','hani-main.js','index.html']){
 const current=fs.readFileSync(path.join(root,file));assert.deepEqual(current,object(headFiles[file]),file+' task runtime unchanged');unchanged.push({file,sha256:hash(current)});
}
const result={base,head,proved,runtimeUnchangedFromTaskHead:unchanged,canonicalDisplayVersion:'2.9.274',method:'SHA-1-verified fixed loose Git objects; Git subprocess tests remain blocked'};
fs.writeFileSync(path.join(root,'artifacts/helper-drag/source2-verification.json'),JSON.stringify(result,null,2));
console.log('PASS: fixed 507c344 complete diff and Git blob identities; six runtime owners unchanged from task HEAD');
