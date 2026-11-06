import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {xmas269Delta as delta,restoreXmas269Source} from './hani-office-xmas-269-source.mjs';

const hash=x=>createHash('sha256').update(x).digest('hex');
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('v2.9.269: ordered unique pairs are the complete JS/CSS diff and reject unlisted edits',()=>{
 assert.equal(delta.version,'2.9.269');
 assert.deepEqual(delta.files.map(r=>[r.file,r.replacements.length]),[['hani-office-live.js',7],['hani-office-live.css',2]]);
 for(const row of delta.files){
  const source=read(row.file),before=restoreXmas269Source(source,row.file);
  let forward=before,previousBeforeEnd=0,previousAfterEnd=0;
  for(const r of row.replacements){
   assert.ok(r.before.length&&r.after.length,r.name);assert.notEqual(r.before,r.after,r.name);
   assert.equal(before.split(r.before).length-1,1,'unique before: '+r.name);
   assert.equal(source.split(r.after).length-1,1,'unique after: '+r.name);
   const a=before.indexOf(r.before),b=source.indexOf(r.after);
   assert.ok(a>=previousBeforeEnd&&b>=previousAfterEnd,'ordered disjoint pairs: '+r.name);
   previousBeforeEnd=a+r.before.length;previousAfterEnd=b+r.after.length;
   forward=forward.replace(r.before,r.after);
   assert.throws(()=>restoreXmas269Source(source.replace(r.after,r.before),row.file),'missing listed hunk rejected: '+r.name);
   assert.throws(()=>restoreXmas269Source(source+r.after,row.file),'duplicate listed hunk rejected: '+r.name);
  }
  assert.equal(forward,source,'exact pairs reproduce every current byte: '+row.file);
  assert.equal(hash(forward),row.afterSha256);
  assert.throws(()=>restoreXmas269Source(source+'\n',row.file),'unlisted insertion rejected');
  assert.throws(()=>restoreXmas269Source(before,row.file),'prior source cannot masquerade as current');
 }
 assert.throws(()=>restoreXmas269Source(read('hani-office-live.js').replace('function createScheduler(','function changedScheduler(')),'staff change rejected');
 assert.throws(()=>restoreXmas269Source(read('hani-office-live.css').replace('z-index:4','z-index:99'),'hani-office-live.css'),'unlisted CSS edit rejected');
});

test('v2.9.269: restored files equal actual Git blobs at the fixed v2.9.268 release commit',()=>{
 const options={cwd:new URL('../',import.meta.url),encoding:'utf8',maxBuffer:32*1024*1024};
 for(const row of delta.files){
  const before=execFileSync('git',['show',delta.baseCommit+':'+row.file],options);
  assert.equal(hash(before),row.beforeSha256,'fixed release blob sha256: '+row.file);
  assert.equal(restoreXmas269Source(read(row.file),row.file),before,'restored full file equals fixed release blob');
  let forward=before;
  for(const r of row.replacements){assert.equal(forward.split(r.before).length-1,1,r.name);forward=forward.replace(r.before,r.after)}
  assert.equal(forward,read(row.file),'the pairs are the complete diff from the fixed Git blob');
 }
 for(const pin of delta.unchangedRuntime){
  const before=execFileSync('git',['show',delta.baseCommit+':'+pin.file],options);
  assert.equal(hash(before),pin.sha256,'runtime baseline comes from the same fixed release');
  // v2.9.269 release bump only: the 268 files contain no '2.9.269', so this restores the exact 268 bytes.
  assert.equal(read(pin.file).replaceAll('2.9.269','2.9.268'),before,'269 changes no runtime file outside office JS/CSS');
  assert.equal(before.split('2.9.268').length-1,pin.versionCount);
 }
});
