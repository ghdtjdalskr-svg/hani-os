import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {companions276Delta as delta,restoreCompanions276Source as restore} from './hani-office-companions-276-source.mjs';
import {restoreAffinity274Source} from './hani-office-affinity-274-source.mjs';
import {projectPrePatrolSource} from './hani-office-chairman-patrol-278-source.mjs';
const read=f=>projectPrePatrolSource(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),f),hash=x=>createHash('sha256').update(x).digest('hex');
test('276 exact complete ordered disjoint replacements reject missing, duplicate, unrelated and base bytes',()=>{
 assert.equal(delta.version,'2.9.276');assert.deepEqual(delta.files.map(r=>r.file),['hani-office-live.js','hani-office-live.css']);
 for(const row of delta.files){const current=read(row.file),before=restore(current,row.file);let forward=before,aEnd=0,bEnd=0;
  for(const r of row.replacements){assert.ok(r.before.length&&r.after.length);assert.notEqual(r.before,r.after);assert.equal(before.split(r.before).length-1,1);assert.equal(current.split(r.after).length-1,1);const a=before.indexOf(r.before),b=current.indexOf(r.after);assert.ok(a>=aEnd&&b>=bEnd);aEnd=a+r.before.length;bEnd=b+r.after.length;forward=forward.replace(r.before,()=>r.after);assert.throws(()=>restore(current.replace(r.after,()=>r.before),row.file));assert.throws(()=>restore(current+r.after,row.file));}
  assert.equal(forward,current);assert.equal(hash(before),row.beforeSha256);assert.equal(hash(current),row.afterSha256);const bytes=Buffer.from(before);assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex'),row.beforeBlobSha1);
  for(const bad of [current+'\n',current.slice(1),current+current,before])assert.throws(()=>restore(bad,row.file));assert.equal(restoreAffinity274Source(current,row.file),restoreAffinity274Source(before,row.file));
 }
 assert.throws(()=>restore(read('hani-main.js'),'hani-main.js'));
});
test('276 fixed Git base independently proves every original blob',()=>{for(const row of delta.files){const before=execFileSync('git',['show',delta.baseCommit+':'+row.file],{cwd:new URL('../',import.meta.url),encoding:'utf8',maxBuffer:32*1024*1024});assert.equal(hash(before),row.beforeSha256);assert.equal(restore(read(row.file),row.file),before)}});
test('276 two exact runtime atlas identities are pinned',()=>{assert.deepEqual(delta.assets.map(r=>r.file),['assets/office-companions/companions-v1.webp','assets/office-companions/kids-v1.webp']);for(const row of delta.assets){const bytes=fs.readFileSync(new URL('../'+row.file,import.meta.url));assert.equal(bytes.length,row.sizeBytes);assert.equal(hash(bytes),row.sha256)}});
