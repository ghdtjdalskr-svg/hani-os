// Independent deployed-byte proof for the new outer layer, without Git processes.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import releases from './hani-release-version-layers.cjs';
import chibi from './hani-chibi-pack-1-source.cjs';
import office from './hani-release-292-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
// Explicit outer feature projection; all deployed 293 assertions remain frozen.
import thaw from './hani-theme-thaw-source.cjs';
const raw=file=>thaw.project(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),file);
const current='9d6ecdd389186e467143f5dde05d14cfae67042d',parent=chibi.main292.base;

test('293 version/history inverse matches independent release and parent+chibi bytes with Buffer parity and drift rejection',()=>{
 const layer=releases.getLayer('2.9.293');
 assert.equal(repository.commit(current).parents[0],parent);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=releases.restoreVersionLayer(source,file,'2.9.293');
  assert.equal(source,repository.read(current,file));assert.equal(releases.hash(source),row.after);
  let expected=repository.read(parent,file);
  for(const edit of chibi.main292.files[file]?.edits||[])expected=expected.replace(edit.before,()=>edit.after);
  assert.equal(before,expected);assert.equal(releases.hash(expected),row.before);
  assert.deepEqual(releases.restoreVersionLayer(Buffer.from(source),file,'2.9.293'),Buffer.from(expected));
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,s=>s==='\n'?'\r\n':'\n')]){
   assert.throws(()=>releases.restoreVersionLayer(bad,file,'2.9.293'),/exact release-293 input/);
   assert.equal(chibi.projectPreRelease293Source(bad,file),bad);
  }
 }
});

test('293 -> chibi -> 292 office -> 291 composes in full bytes while strict lower inverses retain their pins',()=>{
 for(const file of new Set([...Object.keys(releases.getLayer('2.9.293').files),...Object.keys(chibi.main292.files),...Object.keys(office.delta.files)])){
  const source=raw(file),at292=releases.projectReleaseSource(source,file,'2.9.292');
  assert.equal(at292,repository.read(parent,file));
  assert.deepEqual(releases.projectReleaseSource(Buffer.from(source),file,'2.9.292'),Buffer.from(at292));
  const at291=releases.projectReleaseSource(source,file,'2.9.291');
  assert.equal(at291,repository.read('213ffc8',file));
  assert.deepEqual(releases.projectReleaseSource(Buffer.from(source),file,'2.9.291'),Buffer.from(at291));
  assert.equal(releases.projectReleaseSource(source+'\n',file,'2.9.291'),source+'\n');
 }
 for(const file of Object.keys(chibi.main292.files))if(file==='hani-main.js')assert.throws(()=>chibi.restoreChibiPack1Source(raw(file),file),/exact chibi-pack-1 input/);
});

test('the existing frozen office inverse is exactly PR499, with no extra office edits or changed legacy hashes',()=>{
 const changed=repository.changedFiles('99bedbe').filter(file=>file==='hani-office-live.js'||file==='hani-office-live.css');
 assert.deepEqual(changed,['hani-office-live.js']);
 for(const file of changed){
  const source=repository.read('99bedbe',file),before=repository.read('213ffc8',file);
  assert.equal(raw(file),source);assert.equal(office.restore(source,file),before);
  assert.deepEqual(office.restore(Buffer.from(source),file),Buffer.from(before));
  assert.throws(()=>office.restore(source+'\n',file),/exact release-292 input/);
 }
 const source=raw('assets/data/hani-history-releases-v1.json'),before=chibi.projectPreRelease293Source(source,'assets/data/hani-history-releases-v1.json');
 assert.equal(JSON.parse(source).entries[1].source.commit,'99bedbe2d694f3c81fd33e9d1540eb38cc57957c');
 assert.equal(JSON.parse(before).entries[0].source.commit,'');
 assert.equal(JSON.parse(before).entries[0].source.subject,'release: v2.9.292 사무실 직원 탭 말풍선 수정');
});
