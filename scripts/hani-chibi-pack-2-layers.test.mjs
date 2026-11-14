import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import chibi2 from './hani-chibi-pack-2-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import releases from './hani-release-version-layers.cjs';
import thaw from './hani-theme-thaw-source.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {hash}=chibi2;
// Preserve the original chibi2 boundary after the new exact outer version layer.
const read=releases.createReleaseReader('2.9.295',true);
const raw=file=>read(new URL('../'+file,import.meta.url),'utf8');

test('chibi2 -> 294 version/history -> THAW -> 293 -> chibi1 -> 292 keeps every frozen boundary exact',()=>{
 assert.equal(chibi2.delta.base,'cb119351ff7b0a01b77fdc04d6f0b1ba0c2b54dc');
 const file='hani-main.js',source=raw(file),main294=chibi2.restore(source,file);
 assert.equal(main294,repository.read(chibi2.delta.base,file));
 assert.throws(()=>releases.restoreVersionLayer(source,file,'2.9.294'),/exact release-294 input/);
 const withThaw=releases.restoreVersionLayer(main294,file,'2.9.294');
 assert.equal(hash(withThaw),thaw.delta.files[file].afterSha256);
 const main293=thaw.restore(withThaw,file);
 assert.equal(hash(main293),releases.getLayer('2.9.293').files[file].after);
 const withChibi1=releases.restoreVersionLayer(main293,file,'2.9.293');
 const chibi1=JSON.parse(read(new URL('./fixtures/chibi-pack-1-main292-delta.json',import.meta.url),'utf8'));
 assert.equal(hash(withChibi1),chibi1.files[file].afterSha256);
 const preChibi1=releases.projectReleaseSource(main294,file,'2.9.292');
 assert.equal(hash(preChibi1),chibi1.files[file].beforeSha256);
 assert.equal(hash(preChibi1),releases.getLayer('2.9.292').files[file].after);
 for(const bad of [source+'\n',source.slice(1),source+source]){
  assert.equal(chibi2.project(bad,file),bad);
  assert.equal(releases.projectReleaseSource(bad,file,'2.9.289'),bad);
 }
 assert.equal(raw(file),source,'raw disk remains untouched by test adapters');
});

test('independent raw chibi2 closure is 172, inverse main294 171, main293 168 and frozen289 164',async()=>{
 const root=new URL('../',import.meta.url),exists=file=>fs.existsSync(new URL(file,root));
 const closure=project=>resolveRuntimeClosure({exists,read:file=>project(read(new URL(file,root)),file)});
 const current=await closure(bytes=>bytes);
 const main294=await closure((bytes,file)=>chibi2.project(bytes,file));
 const main293=await closure((bytes,file)=>releases.projectReleaseSource(chibi2.project(bytes,file),file,'2.9.293'));
 const frozen289=await closure((bytes,file)=>releases.projectReleaseSource(chibi2.project(bytes,file),file,'2.9.289'));
 assert.deepEqual([current.files.length,main294.files.length,main293.files.length,frozen289.files.length],[172,171,168,164]);
 assert.deepEqual(current.files.filter(file=>!main294.files.includes(file)),['assets/street-journal/chibi-sheet-v2.webp']);
 for(const result of [current,main294,main293,frozen289])assert.deepEqual(result.missing,[]);
});
