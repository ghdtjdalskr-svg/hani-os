// Raw and independent repository evidence: no Git executable or browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import inverse from './hani-chibi-pack-1-source.cjs';
import releases from './hani-release-version-layers.cjs';
import repository from './hani-test-repository-evidence.cjs';
const {hash,readChibiRawFileSync:read}=inverse;
const raw=file=>inverse.projectPreRelease293Source(read(new URL('../'+file,import.meta.url),'utf8'),file);

for(const [label,manifest]of [['main291',inverse.main291],['main292',inverse.main292]]){
 test(label+' chibi inverse restores independent main bytes and rejects partial, duplicate, EOL, content drift and repeated inverse',()=>{
  for(const [file,row]of Object.entries(manifest.files)){
   const before=repository.read(manifest.base,file);assert.equal(hash(before),row.beforeSha256);
   let source=before;for(const edit of row.edits){assert.equal(source.split(edit.before).length-1,1);source=source.replace(edit.before,()=>edit.after);}
   assert.equal(hash(source),row.afterSha256);
   if(label==='main292')assert.equal(source,raw(file));
   assert.equal(inverse.restoreChibiPack1Source(source,file),before);
   assert.deepEqual(inverse.restoreChibiPack1Source(Buffer.from(source),file),Buffer.from(before));
   for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(row.edits[0].after,()=>row.edits[0].before),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
    assert.notEqual(bad,source);assert.throws(()=>inverse.restoreChibiPack1Source(bad,file),/exact chibi-pack-1 input/);
    assert.equal(inverse.projectPreChibiPack1Source(bad,file),bad);
   }
  }
 });
}

test('already present release 292 restores independent 291 objects before canonical 291/290 layers',()=>{
 for(const [file,row]of Object.entries(inverse.release292.files)){
  const source=repository.read(inverse.release292.base,file),before=repository.read(inverse.release292.release,file);
  assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(inverse.restoreRelease292Source(source,file),before);
  assert.deepEqual(inverse.restoreRelease292Source(Buffer.from(source),file),Buffer.from(before));
  assert.equal(inverse.projectMain291Source(raw(file),file),before);
  assert.deepEqual(inverse.projectMain291Source(Buffer.from(raw(file)),file),Buffer.from(before));
  if(releases.getLayer('2.9.291').files[file])assert.equal(hash(before),releases.getLayer('2.9.291').files[file].after);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(row.edits[0].after,()=>row.edits[0].before),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.throws(()=>inverse.restoreRelease292Source(bad,file),/exact release-292 input/);
   assert.equal(inverse.projectMain291Source(bad,file),bad);
  }
 }
});

test('frozen legacy 289 implementation and canonical main layer restore identical bytes, buffers and strict pins',()=>{
 assert.deepEqual(Object.keys(inverse.delta.baseline289).sort(),Object.keys(releases.getLayer('2.9.289').files).sort());
 for(const [file,row]of Object.entries(inverse.delta.baseline289)){
  const source=releases.projectReleaseSource(inverse.projectMain291Source(raw(file),file),file,'2.9.289');
  const canonical=releases.getLayer('2.9.289').files[file];
  assert.equal(row.afterSha256,canonical.after);assert.equal(row.beforeSha256,canonical.before);
  assert.equal(row.count??row.edits.length,canonical.count);
  assert.equal(hash(source),row.afterSha256);
  const old=inverse.restoreFrozenBaseline289Source(source,file),main=inverse.restoreBaseline289Source(source,file);
  assert.equal(main,old);assert.equal(hash(main),row.beforeSha256);
  assert.deepEqual(inverse.restoreFrozenBaseline289Source(Buffer.from(source),file),inverse.restoreBaseline289Source(Buffer.from(source),file));
  for(const bad of [source+'\n',source.slice(1),source+source,main]){
   assert.throws(()=>inverse.restoreFrozenBaseline289Source(bad,file),/exact release-289 input/);
   assert.throws(()=>inverse.restoreBaseline289Source(bad,file),/exact release-289 input/);
  }
 }
});

test('canonical 292 dispatcher equals the independently pinned outer inverse, with strict feature/version order',()=>{
 for(const [file,row]of Object.entries(inverse.release292.files)){
  const source=repository.read(inverse.release292.base,file),before=inverse.restoreRelease292Source(source,file);
  assert.equal(releases.projectReleaseSource(source,file,'2.9.291'),before);
  assert.deepEqual(releases.projectReleaseSource(Buffer.from(source),file,'2.9.291'),Buffer.from(before));
  assert.equal(releases.projectReleaseSource(source,file,'2.9.292'),source);
  assert.equal(releases.projectFeatureSource(source,file,'2.9.292'),file==='hani-office-live.js'?source:before);
  if(releases.getLayer('2.9.292').files[file])assert.equal(releases.restoreVersionLayer(source,file,'2.9.292'),before);
  assert.equal(hash(before),row.beforeSha256);
  for(const bad of [source+'\n',source.slice(1),source+source])assert.equal(releases.projectReleaseSource(bad,file,'2.9.291'),bad);
 }
});

test('frozen chibi 289 inverse still restores its original full-byte pins',()=>{
 for(const [file,row]of Object.entries(inverse.delta.files)){
  const source=inverse.projectFrozenChibiSource(raw(file),file);
  assert.equal(hash(source),row.afterSha256);
  assert.equal(hash(inverse.restoreFrozenChibiPack1Source(source,file)),row.beforeSha256);
 }
});
