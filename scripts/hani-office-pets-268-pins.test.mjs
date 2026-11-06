import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pets268Delta as delta,restorePets268Source} from './hani-office-pets-268-source.mjs';
import {restoreXmas269Source} from './hani-office-xmas-269-source.mjs';

test('v2.9.268: exact fixture pairs are the complete diff from pinned origin/main, with no other source edits',()=>{
 const currentSource=fs.readFileSync(new URL('../hani-office-live.js',import.meta.url),'utf8');
 const source=restoreXmas269Source(currentSource);
 const before=restorePets268Source(currentSource),hash=x=>createHash('sha256').update(x).digest('hex');
 assert.equal(delta.baseRef,'origin/main');assert.equal(delta.version,'2.9.268');assert.equal(delta.replacements.length,23);
 let forward=before,previousBeforeEnd=0,previousAfterEnd=0;
 for(const r of delta.replacements){
  assert.ok(r.before.length&&r.after.length,r.name);assert.notEqual(r.before,r.after,r.name);
  assert.equal(before.split(r.before).length-1,1,'unique before bytes: '+r.name);
  assert.equal(source.split(r.after).length-1,1,'unique after bytes: '+r.name);
  const a=before.indexOf(r.before),b=source.indexOf(r.after);
  assert.ok(a>=previousBeforeEnd&&b>=previousAfterEnd,'ordered, disjoint pairs: '+r.name);
  previousBeforeEnd=a+r.before.length;previousAfterEnd=b+r.after.length;
  forward=forward.replace(r.before,r.after);
 }
 assert.equal(forward,source,'applying exactly these pairs reproduces every current byte');
 assert.equal(hash(forward),delta.afterSha256);
 assert.throws(()=>restorePets268Source(currentSource+'\n'),'unlisted insertion rejected');
 assert.throws(()=>restorePets268Source(currentSource.replace('function createScheduler(','function changedScheduler(')),'staff change rejected');
 const options={cwd:new URL('../',import.meta.url),encoding:'utf8',maxBuffer:32*1024*1024};
 const origin=execFileSync('git',['show','461dfdff4d26275a4d6d61c177280fd2d6ed35fe:hani-office-live.js' /* pre-v2.9.268 main */],options);
 assert.equal(hash(origin),delta.beforeSha256,'actual origin/main blob is the pinned base');
 assert.equal(before,origin,'restoring the complete fixture equals actual origin/main');
 const blob=execFileSync('git',['rev-parse','461dfdff4d26275a4d6d61c177280fd2d6ed35fe:hani-office-live.js' /* pre-v2.9.268 main */],options).trim();
 assert.equal(blob,delta.baseBlob,'origin/main blob identity');
});
