import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {helper275Delta as delta,restoreHelper275Source} from './hani-helper-275-source.mjs';
import {affinity274Delta,restoreAffinity274Source} from './hani-office-affinity-274-source.mjs';
import {normalizeReleaseVersion} from './hani-reviewed-release-baseline.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const hash=x=>createHash('sha256').update(x).digest('hex');
test('275 exact complete ordered disjoint pairs reject missing, duplicate and unlisted bytes',()=>{
 assert.equal(delta.version,'2.9.275');
 assert.deepEqual(delta.files.map(r=>r.file),['hani-ui-v02992.js','hani-style-08.css']);
 for(const row of delta.files){
  const source=read(row.file),before=restoreHelper275Source(source,row.file);let forward=before,beforeEnd=0,afterEnd=0;
  assert.ok(row.replacements.length);
  for(const r of row.replacements){
   assert.ok(r.before.length&&r.after.length);assert.notEqual(r.before,r.after);
   assert.equal(before.split(r.before).length-1,1);assert.equal(source.split(r.after).length-1,1);
   const a=before.indexOf(r.before),b=source.indexOf(r.after);assert.ok(a>=beforeEnd&&b>=afterEnd,'ordered disjoint pairs');beforeEnd=a+r.before.length;afterEnd=b+r.after.length;
   forward=forward.replace(r.before,()=>r.after);
   assert.throws(()=>restoreHelper275Source(source.replace(r.after,()=>r.before),row.file),'missing pair rejected');
   assert.throws(()=>restoreHelper275Source(source+r.after,row.file),'duplicate pair rejected');
  }
  assert.equal(forward,source,'entire current blob reproduced');assert.equal(hash(forward),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  const blob=Buffer.from(before);assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from('blob '+blob.length+'\0'),blob])).digest('hex'),row.beforeBlobSha1,'original Git blob identity');
  for(const mutation of [source+'\n',source.slice(1),source+source,source.replace(row.replacements[0].after,'unregistered helper bytes')])assert.throws(()=>restoreHelper275Source(mutation,row.file));
  assert.throws(()=>restoreHelper275Source(before,row.file),'base cannot masquerade as current source');
 }
 assert.throws(()=>restoreHelper275Source(read('hani-office-live.js'),'hani-office-live.js'),'unregistered file rejected');
});
test('275 -> 274 helper restoration preserves every original affinity pin and rejects tampering',()=>{
 const file='hani-ui-v02992.js',current=read(file),base=restoreHelper275Source(current,file),pin=affinity274Delta.files.find(r=>r.file===file);
 assert.equal(hash(base),pin.afterSha256);
 assert.equal(hash(restoreAffinity274Source(current,file)),pin.beforeSha256);
 assert.equal(restoreAffinity274Source(current,file),restoreAffinity274Source(base,file));
 assert.throws(()=>restoreAffinity274Source(current+'\n',file));
});
test('275 index/main retain fixed 507c344 bytes allowing only canonical release projection',()=>{
 assert.deepEqual(delta.unchangedRuntime.map(r=>r.file),['index.html','hani-main.js']);
 for(const row of delta.unchangedRuntime){
  const current=read(row.file),restored=normalizeReleaseVersion(current,'2.9.274');
  assert.equal(hash(restored),row.normalizedSha256);assert.equal(restored.split('2.9.274').length-1,row.normalizedVersionCount);
  assert.equal(hash(normalizeReleaseVersion(normalizeReleaseVersion(current,'2.9.275'),'2.9.274')),row.normalizedSha256);
  for(const mutation of [current+'\n',current.slice(1),current+current,current+' 2.9.275'])assert.notEqual(hash(normalizeReleaseVersion(mutation,'2.9.274')),row.normalizedSha256);
 }
});
test('275 fixed Git base independently proves complete UI/CSS diffs and unchanged release owners',()=>{
 const opts={cwd:new URL('../',import.meta.url),encoding:'utf8',maxBuffer:32*1024*1024};
 for(const row of delta.files){
  const before=execFileSync('git',['show',delta.baseCommit+':'+row.file],opts);assert.equal(hash(before),row.beforeSha256);assert.equal(restoreHelper275Source(read(row.file),row.file),before);
  let forward=before;for(const r of row.replacements){assert.equal(forward.split(r.before).length-1,1);forward=forward.replace(r.before,()=>r.after);}assert.equal(forward,read(row.file));
 }
 for(const row of delta.unchangedRuntime){const before=execFileSync('git',['show',delta.baseCommit+':'+row.file],opts);assert.equal(hash(before),row.sha256);assert.equal(normalizeReleaseVersion(read(row.file),'2.9.274'),normalizeReleaseVersion(before,'2.9.274'));}
});
