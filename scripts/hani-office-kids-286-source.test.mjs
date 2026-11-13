import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import outer from './hani-save-guard-source.cjs';
import inverse from './hani-office-kids-286-source.cjs';
import allReleases from './hani-release-version-layers.cjs';
const releases={...allReleases,layers:allReleases.layers.slice(allReleases.layers.findIndex(row=>row.to==='2.9.286'))};
import view285 from './hani-release-285-test-source.cjs';
const read=file=>outer.projectPreSaveGuard286Source(releases.readRawFileSync(new URL('../'+file,import.meta.url),'utf8'),file);

test('286 feature composes every frozen daily/weekday/B inverse with full hashes, buffer parity and strict drift rejection',()=>{
 for(const [file,row] of Object.entries(inverse.delta.files)){
  const raw=read(file),before=inverse.restoreKids286Source(raw,file);
  assert.equal(releases.hash(before),row.beforeSha256);
  assert.deepEqual(inverse.restoreKids286Source(Buffer.from(raw),file),Buffer.from(before));
  assert.equal(releases.projectFeatureSource(raw,file,'2.9.286'),raw);
  assert.equal(releases.projectReleaseSource(raw,file,'2.9.285'),before);
  for(const bad of [raw+'\n',raw.slice(1),raw+raw,before,raw.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')])assert.throws(()=>inverse.restoreKids286Source(bad,file),/exact kids-286 input/);
 }
 assert.throws(()=>inverse.restoreKids286Source('','index.html'),/known release-286 kids owner/);
});

test('286 exact history then 285 and 284 metadata inverses preserve all lower pins and the original 285 contract view',()=>{
 assert.deepEqual(releases.layers.slice(0,4).map(row=>row.to),['2.9.286','2.9.285','2.9.284','2.9.283']);
 for(const file of Object.keys(releases.getLayer('2.9.286').files)){
  const raw=read(file),before=releases.restoreVersionLayer(raw,file,'2.9.286');
  assert.equal(releases.hash(before),releases.getLayer('2.9.285').files[file].after);
  assert.equal(view285.readRawFileSync(new URL('../'+file,import.meta.url),'utf8'),before);
  assert.deepEqual(view285.readRawFileSync(new URL('../'+file,import.meta.url)),Buffer.from(before));
  assert.equal(releases.projectReleaseSource(raw,file,'2.9.285'),before);
 }
 const history='assets/data/hani-history-releases-v1.json',raw=read(history);
 for(const version of ['2.9.285','2.9.284'])assert.equal(releases.hash(releases.projectReleaseSource(raw,history,version)),releases.getLayer(version).files[history].after);
 assert.equal(releases.hash(releases.projectReleaseSource(raw,history,'2.9.283')),releases.getLayer('2.9.284').files[history].before);
 const bad=raw+'\n';assert.equal(releases.projectReleaseSource(bad,history,'2.9.283'),bad);
 assert.deepEqual(view285.layers,releases.layers.slice(1));
});

test('285 input view leaves temporary and baseline names untouched and never mutates the raw release module',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hani-kids286-view-'));
 try{
  const file=path.join(dir,'index.html'),raw=read('index.html');fs.writeFileSync(file,raw);
  assert.equal(view285.readRawFileSync(file,'utf8'),raw);
  assert.deepEqual(view285.readRawFileSync(file),Buffer.from(raw));
  assert.equal(outer.projectPreRelease287Source(releases.readRawFileSync(new URL('../index.html',import.meta.url),'utf8'),'index.html'),raw);
  assert.equal(releases.layers[0].to,'2.9.286');
 }finally{assert.equal(path.dirname(dir),os.tmpdir());fs.rmSync(dir,{recursive:true,force:true})}
});
