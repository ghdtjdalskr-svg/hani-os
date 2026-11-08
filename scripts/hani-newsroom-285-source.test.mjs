import test from 'node:test';
import assert from 'node:assert/strict';
import inverse from './hani-newsroom-285-source.cjs';
import releases from './hani-release-version-layers.cjs';
const {delta,restoreNewsroom285Source:restore}=inverse;
const read=file=>releases.readRawFileSync(new URL('../'+file,import.meta.url),'utf8');

test('285 newsroom inverse restores full pinned 284 bytes and rejects drift, partial, duplicate and repeated input',()=>{
 for(const [file,row] of Object.entries(delta.files)){
  const current=read(file),before=restore(current,file);
  assert.equal(releases.hash(before),row.beforeSha256);
  assert.deepEqual(restore(Buffer.from(current),file),Buffer.from(before));
  const lines=before.match(/[^\n]*\n|[^\n]+$/g)||[];
  for(const edit of row.edits){
   const oldLines=edit.before.match(/[^\n]*\n|[^\n]+$/g)||[];
   const newLines=edit.after.match(/[^\n]*\n|[^\n]+$/g)||[];
   const at=edit.at;
   assert.equal(lines.slice(at,at+oldLines.length).join(''),edit.before);
   lines.splice(at,oldLines.length,...newLines);
  }
  assert.equal(lines.join(''),current,'exact forward round-trip');
  for(const bad of [current+'\n',current.slice(1),current+current,before,current.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')])assert.throws(()=>restore(bad,file),/exact newsroom-285 input/);
  assert.equal(releases.projectFeatureSource(current,file,'2.9.285'),current);
  assert.equal(releases.projectFeatureSource(current,file,'2.9.284'),before);
  assert.deepEqual(releases.projectFeatureSource(Buffer.from(current),file,'2.9.284'),Buffer.from(before));
 }
 assert.throws(()=>restore('','unknown'),/known release-285 newsroom owner/);
});

test('285 version then newsroom then 284 dispatch retains every legacy pin and leaves unrecognized drift unblessed',()=>{
 assert.deepEqual(releases.layers.slice(0,3).map(r=>r.to),['2.9.285','2.9.284','2.9.283']);
 for(const file of Object.keys(releases.getLayer('2.9.285').files)){
  const raw=read(file),at284=releases.restoreVersionLayer(raw,file,'2.9.285');
  assert.equal(releases.projectReleaseSource(raw,file,'2.9.284'),at284);
  assert.throws(()=>releases.restoreVersionLayer(raw,file,'2.9.284'),/exact release-284 input/);
 }
 for(const file of Object.keys(delta.files)){
  const raw=read(file),bad=raw+'\n';
  assert.equal(releases.projectReleaseSource(bad,file,'2.9.282'),bad);
  assert.notEqual(releases.hash(bad),delta.files[file].beforeSha256);
 }
});
