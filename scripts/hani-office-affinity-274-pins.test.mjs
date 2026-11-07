import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {affinity274Delta as delta,restoreAffinity274Source} from './hani-office-affinity-274-source.mjs';
import {restoreBarista273Source} from './hani-office-barista-night-273-source.mjs';
import {restoreBori272Source} from './hani-office-pet-bori-272-source.mjs';
import {restoreXmas269Source} from './hani-office-xmas-269-source.mjs';
import {restorePets268Source} from './hani-office-pets-268-source.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'),hash=x=>createHash('sha256').update(x).digest('hex');
test('274 exact complete pairs, ordered disjoint; reject missing, duplicate and unrelated bytes',()=>{
 assert.equal(delta.version,'2.9.274');assert.deepEqual(delta.files.map(r=>r.file),['hani-office-live.js','hani-office-live.css','hani-ui-v02992.js']);
 for(const row of delta.files){const source=read(row.file),before=restoreAffinity274Source(source,row.file);let forward=before,end=0;
  for(const r of row.replacements){assert.ok(r.before.length&&r.after.length);assert.notEqual(r.before,r.after);assert.equal(before.split(r.before).length-1,1);assert.equal(source.split(r.after).length-1,1);const i=before.indexOf(r.before);assert.ok(i>=end);end=i+r.before.length;forward=forward.replace(r.before,r.after);assert.throws(()=>restoreAffinity274Source(source.replace(r.after,r.before),row.file));assert.throws(()=>restoreAffinity274Source(source+r.after,row.file))}
  assert.equal(forward,source);assert.equal(hash(forward),row.afterSha256);assert.throws(()=>restoreAffinity274Source(source+'\n',row.file));assert.throws(()=>restoreAffinity274Source(before,row.file));
 }
 const source=read('hani-office-live.js');for(const token of ['function createScheduler(','function visualPoint(','function placeStatusLabels(']){assert.ok(source.includes(token));assert.throws(()=>restoreAffinity274Source(source.replace(token,token+'changed')))}
});
test('274 -> 273 -> 272 -> 269 -> 268 strict restoration remains enforced',()=>{
 for(const file of ['hani-office-live.js','hani-office-live.css']){const source=read(file),base=restoreAffinity274Source(source,file);assert.equal(hash(base),delta.files.find(r=>r.file===file).beforeSha256);assert.equal(restoreBarista273Source(source,file),restoreBarista273Source(base,file));assert.equal(restoreBori272Source(source,file),restoreBori272Source(base,file));assert.equal(restoreXmas269Source(source,file),restoreXmas269Source(base,file));if(file.endsWith('.js'))assert.equal(restorePets268Source(source),restorePets268Source(base))}
});
test('274 base commit independently proves the entire original JS/CSS/helper blobs',()=>{
 for(const row of delta.files){const before=execFileSync('git',['show',delta.baseCommit+':'+row.file],{cwd:new URL('../',import.meta.url),encoding:'utf8',maxBuffer:32*1024*1024});assert.equal(hash(before),row.beforeSha256);assert.equal(restoreAffinity274Source(read(row.file),row.file),before)}
});
