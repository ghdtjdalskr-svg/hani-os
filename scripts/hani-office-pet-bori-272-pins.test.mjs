import './hani-life-bundle-preload.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {restoreBarista273Source} from './hani-office-barista-night-273-source.mjs';
import {bori272Delta as delta,restoreBori272Source} from './hani-office-pet-bori-272-source.mjs';
import {restoreXmas269Source,xmas269Delta} from './hani-office-xmas-269-source.mjs';
import {restorePets268Source,pets268Delta} from './hani-office-pets-268-source.mjs';
const read=f=>{const source=fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');return ['hani-office-live.js','hani-office-live.css'].includes(f)?restoreBarista273Source(source,f):source};
const hash=x=>createHash('sha256').update(x).digest('hex');
test('272: exact ordered pairs are the complete fixed-271 JS/CSS diff, rejecting all unlisted bytes',()=>{
 assert.equal(delta.version,'2.9.272');assert.deepEqual(delta.files.map(f=>[f.file,f.replacements.length]),[['hani-office-live.js',20],['hani-office-live.css',2]]);
 for(const row of delta.files){
  const source=read(row.file),before=restoreBori272Source(source,row.file);let forward=before,previousBeforeEnd=0,previousAfterEnd=0;
  for(const r of row.replacements){
   assert.ok(r.before.length&&r.after.length);assert.notEqual(r.before,r.after);
   assert.equal(before.split(r.before).length-1,1,r.name+' unique before');assert.equal(source.split(r.after).length-1,1,r.name+' unique after');
   const a=before.indexOf(r.before),b=source.indexOf(r.after);assert.ok(a>=previousBeforeEnd&&b>=previousAfterEnd,'ordered disjoint pairs');previousBeforeEnd=a+r.before.length;previousAfterEnd=b+r.after.length;
   forward=forward.replace(r.before,r.after);
   assert.throws(()=>restoreBori272Source(source.replace(r.after,r.before),row.file),'missing pair rejected');assert.throws(()=>restoreBori272Source(source+r.after,row.file),'duplicate pair rejected');
  }
  assert.equal(forward,source,'every current byte reproduced');assert.equal(hash(forward),row.afterSha256);
  assert.throws(()=>restoreBori272Source(source+'\n',row.file));assert.throws(()=>restoreBori272Source(before,row.file),'prior release cannot masquerade as new Bori source');
 }
 assert.throws(()=>restoreBori272Source(read('hani-office-live.js').replace('function createScheduler(','function changedScheduler(')));
 assert.throws(()=>restoreBori272Source(read('hani-office-live.css').replace('z-index:4','z-index:99'),'hani-office-live.css'));
});
test('272 -> 269 -> 268: all stacked source hashes and literal pairs remain enforced',()=>{
 const source=read('hani-office-live.js');assert.equal(hash(restoreXmas269Source(source)),xmas269Delta.files[0].beforeSha256);assert.equal(hash(restorePets268Source(source)),pets268Delta.beforeSha256);
 assert.equal(hash(restoreXmas269Source(read('hani-office-live.css'),'hani-office-live.css')),xmas269Delta.files[1].beforeSha256);
});
test('272: only the release version (2.9.272 or later) -> 2.9.271 is allowed in index/main',()=>{
 for(const pin of delta.unchangedRuntime){const current=read(pin.file),restored=current.replace(/2\.9\.(27[2-9]|2[89]\d)\b/g,'2.9.271');assert.equal(hash(restored),pin.sha256);assert.equal(restored.split('2.9.271').length-1,pin.versionCount);assert.notEqual(hash(restored+'\n'),pin.sha256)}
});
test('272: fixed Git release blobs independently prove every baseline pin and complete diff',()=>{
 const opts={cwd:new URL('../',import.meta.url),encoding:'utf8',maxBuffer:32*1024*1024};
 for(const row of delta.files){const before=execFileSync('git',['show',delta.baseCommit+':'+row.file],opts);assert.equal(hash(before),row.beforeSha256);assert.equal(restoreBori272Source(read(row.file),row.file),before);let forward=before;for(const r of row.replacements){assert.equal(forward.split(r.before).length-1,1);forward=forward.replace(r.before,r.after)}assert.equal(forward,read(row.file))}
 for(const pin of delta.unchangedRuntime){const before=execFileSync('git',['show',delta.baseCommit+':'+pin.file],opts);assert.equal(hash(before),pin.sha256);assert.equal(read(pin.file).replace(/2\.9\.(27[2-9]|2[89]\d)\b/g,'2.9.271'),before)}
});
