import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {restoreBori272Source} from './hani-office-pet-bori-272-source.mjs';
// 274 is an independently pinned outer layer; all 273 pairs/hashes remain exact.
import {restoreAffinity274Source} from './hani-office-affinity-274-source.mjs';
import {normalizeReleaseVersion} from './hani-reviewed-release-baseline.mjs';
import {barista273Files,approvedOfficeRuntimeAdditions} from './hani-office-runtime-additions.mjs';
import {barista273Delta as delta,restoreBarista273Source} from './hani-office-barista-night-273-source.mjs';
import {restoreXmas269Source,xmas269Delta} from './hani-office-xmas-269-source.mjs';
import {restorePets268Source,pets268Delta} from './hani-office-pets-268-source.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const hash=x=>createHash('sha256').update(x).digest('hex');
test('273: exact ordered pairs are the complete fixed-272 JS/CSS diff, rejecting all unlisted bytes',()=>{
 assert.equal(delta.version,'2.9.273');assert.deepEqual(delta.files.map(f=>[f.file,f.replacements.length]),[['hani-office-live.js',5],['hani-office-live.css',1]]);
 for(const row of delta.files){
  const source=restoreAffinity274Source(read(row.file),row.file),before=restoreBarista273Source(source,row.file);let forward=before,previousBeforeEnd=0,previousAfterEnd=0;
  for(const r of row.replacements){
   assert.ok(r.before.length&&r.after.length);assert.notEqual(r.before,r.after);
   assert.equal(before.split(r.before).length-1,1,r.name+' unique before');assert.equal(source.split(r.after).length-1,1,r.name+' unique after');
   const a=before.indexOf(r.before),b=source.indexOf(r.after);assert.ok(a>=previousBeforeEnd&&b>=previousAfterEnd,'ordered disjoint pairs');previousBeforeEnd=a+r.before.length;previousAfterEnd=b+r.after.length;
   forward=forward.replace(r.before,r.after);
   assert.throws(()=>restoreBarista273Source(source.replace(r.after,r.before),row.file),'missing pair rejected');assert.throws(()=>restoreBarista273Source(source+r.after,row.file),'duplicate pair rejected');
  }
  assert.equal(forward,source,'every current byte reproduced');assert.equal(hash(forward),row.afterSha256);
  assert.throws(()=>restoreBarista273Source(source+'\n',row.file));assert.throws(()=>restoreBarista273Source(before,row.file),'prior release cannot masquerade as night barista source');
 }
 assert.throws(()=>restoreBarista273Source(read('hani-office-live.js').replace('function createScheduler(','function changedScheduler(')));
 assert.throws(()=>restoreBarista273Source(read('hani-office-live.css').replace('z-index:4','z-index:99'),'hani-office-live.css'));
});
test('273 -> 272 -> 269 -> 268: all stacked source hashes and literal pairs remain enforced',()=>{
 const source=read('hani-office-live.js');assert.equal(hash(restoreBarista273Source(source)),delta.files[0].beforeSha256);assert.equal(hash(restoreBori272Source(source)),xmas269Delta.files[0].afterSha256);assert.equal(hash(restoreXmas269Source(source)),xmas269Delta.files[0].beforeSha256);assert.equal(hash(restorePets268Source(source)),pets268Delta.beforeSha256);
 assert.equal(hash(restoreXmas269Source(read('hani-office-live.css'),'hani-office-live.css')),xmas269Delta.files[1].beforeSha256);
});
test('273: index/main remain fixed-272 bytes, allowing only canonical release projection',()=>{
 for(const row of delta.unchangedRuntime){const current=read(row.file),restored=normalizeReleaseVersion(current,'2.9.272');assert.equal(hash(restored),row.normalizedSha256);assert.equal(restored.split('2.9.272').length-1,row.normalizedVersionCount);for(const mutation of [current+'\n',current.slice(1),current+current])assert.notEqual(hash(normalizeReleaseVersion(mutation,'2.9.272')),row.normalizedSha256)}
});
test('273: the single approved runtime addition retains its exact atlas bytes and dimensions',()=>{
 assert.deepEqual(barista273Files,['assets/office-season/barista-night.webp']);
 assert.deepEqual(delta.runtimeAdditions.map(r=>r.file),barista273Files);
 for(const row of delta.runtimeAdditions){const bytes=fs.readFileSync(new URL('../'+row.file,import.meta.url));assert.equal(hash(bytes),row.sha256);assert.equal(bytes.length,row.sizeBytes);assert.deepEqual([row.width,row.height],[360,110]);assert.ok(approvedOfficeRuntimeAdditions.includes(row.file))}
});
test('273: fixed Git release blobs independently prove every baseline pin and complete diff',()=>{
 const opts={cwd:new URL('../',import.meta.url),encoding:'utf8',maxBuffer:32*1024*1024};
 for(const row of delta.files){const before=execFileSync('git',['show',delta.baseCommit+':'+row.file],opts);assert.equal(hash(before),row.beforeSha256);assert.equal(restoreBarista273Source(read(row.file),row.file),before);let forward=before;for(const r of row.replacements){assert.equal(forward.split(r.before).length-1,1);forward=forward.replace(r.before,r.after)}assert.equal(forward,restoreAffinity274Source(read(row.file),row.file))}
 for(const pin of delta.unchangedRuntime){const before=execFileSync('git',['show',delta.baseCommit+':'+pin.file],opts);assert.equal(hash(before),pin.sha256);assert.equal(normalizeReleaseVersion(read(pin.file),'2.9.272'),normalizeReleaseVersion(before,'2.9.272'))}
});
