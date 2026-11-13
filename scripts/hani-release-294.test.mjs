import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import layers from './hani-release-version-layers.cjs';
import thaw from './hani-theme-thaw-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {hash,readRawFileSync:read}=layers;
const raw=file=>read(new URL('../'+file,import.meta.url),'utf8');
const release='846e8d2dbda63be75822f9b56c1d85e6bf5c8b6d';

test('294 version/history exact inverse independently matches deployed bytes and every unchanged inner pin',()=>{
 const layer=layers.getLayer('2.9.294');
 assert.equal(layers.layers[0],layer);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 assert.equal(layer.feature.fixture,'./fixtures/theme-thaw-main293-delta.json');
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=layers.restoreVersionLayer(source,file,'2.9.294');
  assert.equal(source,repository.read(release,file),'independent approved release object');
  assert.equal(hash(source),row.after);
  const expected=file==='hani-main.js'?thaw.delta.files[file].afterSha256:layers.getLayer('2.9.293').files[file].after;
  assert.equal(hash(before),expected,'unchanged frozen inner pin');
  assert.deepEqual(layers.restoreVersionLayer(Buffer.from(source),file,'2.9.294'),Buffer.from(before));
  assert.equal(layers.projectReleaseSource(source,file,'2.9.294'),source,'current release stays raw');
  assert.equal(layers.projectFeatureSource(source,file,'2.9.294'),before,'current feature stays raw after version inverse');
  if(file==='hani-main.js')assert.throws(()=>thaw.restore(source,file),/exact THAW input/,'strict frozen inverse still rejects 294 version bytes');
  const inner=file==='hani-main.js'?thaw.restore(before,file):before;
  assert.equal(hash(inner),layers.getLayer('2.9.293').files[file].after);
  assert.equal(thaw.project(source,file),inner);
  assert.equal(layers.projectReleaseSource(source,file,'2.9.293'),inner);
  assert.deepEqual(layers.projectReleaseSource(Buffer.from(source),file,'2.9.293'),Buffer.from(inner));
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.throws(()=>layers.restoreVersionLayer(bad,file,'2.9.294'),/exact release-294 input/);
   assert.equal(layers.projectPreRelease294Source(bad,file),bad);
  }
  assert.equal(layers.projectReleaseSource(source+'\n',file,'2.9.289'),source+'\n','drift cannot enter lower layers');
  assert.equal(raw(file),source,'disk remains raw');
 }
 const current=JSON.parse(raw('assets/data/hani-history-releases-v1.json'));
 const before=JSON.parse(layers.projectPreRelease294Source(raw('assets/data/hani-history-releases-v1.json'),'assets/data/hani-history-releases-v1.json'));
 assert.equal(current.entries[0].id,'v2.9.294');
 assert.equal(current.entries[0].title,'THAW · 해빙의 정원 예고');
 assert.equal(current.entries[1].source.commit,'9d6ecdd389186e467143f5dde05d14cfae67042d');
 assert.equal(current.entries[1].source.subject,'release: v2.9.293 빈 화면에 하니 치비 그림 1탄 (#500)');
 assert.equal(before.entries[0].id,'v2.9.293');assert.equal(before.entries[0].source.commit,'');
 assert.deepEqual(current.entries.slice(2),before.entries.slice(1));
});

test('294 CSS feature boundary, raw171 -> main293 168 -> frozen289 164 closure, and root JSON preservation',async()=>{
 const css='hani-design-system.css',source=raw(css),row=thaw.delta.files[css];
 assert.equal(hash(source),row.afterSha256);
 assert.equal(layers.projectReleaseSource(source,css,'2.9.294'),source);
 assert.equal(layers.projectFeatureSource(source,css,'2.9.294'),source);
 assert.equal(hash(layers.projectReleaseSource(source,css,'2.9.293')),row.beforeSha256);
 const root=new URL('../',import.meta.url),exists=file=>fs.existsSync(new URL(file,root));
 const closure=project=>resolveRuntimeClosure({exists,read:file=>project(read(new URL(file,root)),file)});
 const current=await closure(bytes=>bytes),main=await closure((bytes,file)=>layers.projectReleaseSource(bytes,file,'2.9.293'));
 const frozen=await closure((bytes,file)=>layers.projectReleaseSource(bytes,file,'2.9.289'));
 assert.deepEqual([current.files.length,main.files.length,frozen.files.length],[171,168,164]);
 for(const result of [current,main,frozen])assert.deepEqual(result.missing,[]);
 assert.deepEqual(current.files.filter(file=>!main.files.includes(file)),thaw.delta.added.map(row=>row.file));
 assert.ok(!current.files.includes('hani-theme-collections.json'));
 assert.equal(raw('hani-theme-collections.json'),repository.read(release,'hani-theme-collections.json'));
});
