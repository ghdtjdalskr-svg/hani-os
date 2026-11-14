// Real disk bytes enter the newest exact inverse before all frozen release tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import outer from './hani-design-polish-1-main295-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import frozen from './hani-design-polish-1-source.cjs';
import layers from './hani-release-version-layers.cjs';
import chibi2 from './hani-chibi-pack-2-source.cjs';
import thaw from './hani-theme-thaw-source.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {delta,hash,restore,project,readRawFileSync:read}=outer;
const root=new URL('../',import.meta.url),raw=file=>read(new URL(file,root),'utf8');

test('design295 strict inverse restores independently identified main295 bytes with only the frozen two edits',()=>{
 assert.equal(delta.base,repository.resolve('dfe8194'));
 assert.deepEqual(Object.keys(delta.files).sort(),['hani-design-system.css','hani-main.js']);
 for(const [file,row]of Object.entries(delta.files)){
  const source=raw(file),before=repository.read(delta.base,file);
  assert.deepEqual(row.edits,frozen.delta.files[file].edits,'approved design edits unchanged');
  assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(restore(source,file),before);assert.deepEqual(restore(Buffer.from(source),file),Buffer.from(before));
  assert.equal(project(source,file),before);assert.equal(project(before,file),before);
  const forward=row.edits.reduce((s,e)=>e.before?s.replace(e.before,()=>e.after):s+e.after,before);
  assert.equal(source,forward,'mixed EOL and unrelated bytes preserved');
  assert.equal(raw(file),source,'real disk untouched');
 }
});

test('design295 pins reject drift, duplicate input, EOL changes and double inverse',()=>{
 for(const file of Object.keys(delta.files)){
  const source=raw(file),before=restore(source,file);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.throws(()=>restore(bad,file),/exact design-polish-1 main295 input/);
   assert.equal(project(bad,file),bad);
  }
 }
 assert.throws(()=>restore('unknown','not-an-owner'),/known design-polish-1 main295 owner/);
 assert.equal(project('unknown','not-an-owner'),'unknown');
});

test('design1 -> 295 -> chibi2 -> 294 -> THAW retains each strict pin and closure 172/172/171/168/164',async()=>{
 for(const file of Object.keys(delta.files)){
  const source=raw(file),main295=restore(source,file);
  assert.equal(layers.projectReleaseSource(source,file,'2.9.295'),main295);
  assert.equal(chibi2.readRawFileSync(new URL(file,root),'utf8'),main295,'chibi2 raw boundary is outside 295, inside design');
  assert.equal(layers.projectReleaseSource(source,file,'2.9.294'),repository.read(frozen.delta.base,file));
  assert.equal(hash(layers.projectReleaseSource(source,file,'2.9.293')),thaw.delta.files[file].beforeSha256);
  if(file==='hani-main.js'){
   assert.throws(()=>layers.restoreVersionLayer(source,file,'2.9.295'),/exact release-295 input/);
   const before295=layers.restoreVersionLayer(main295,file,'2.9.295');
   assert.equal(hash(before295),chibi2.delta.files[file].afterSha256);
   assert.equal(chibi2.restore(before295,file),repository.read(frozen.delta.base,file));
   assert.equal(layers.projectPreRelease295Source(source,file),before295);
  }
 }
 const lengths=[];
 for(const version of [null,'2.9.295','2.9.294','2.9.293','2.9.289']){
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>{const b=read(new URL(f,root));return version?layers.projectReleaseSource(b,f,version):b}});
  lengths.push(closure.files.length);assert.deepEqual(closure.missing,[]);
 }
 assert.deepEqual(lengths,[172,172,171,168,164]);
});

test('design preload callback/promise readers return exact main295 while original raw reader retains design',async()=>{
 for(const [file,row]of Object.entries(delta.files)){
  const name=new URL(file,root);
  assert.equal(hash(await fs.promises.readFile(name)),row.beforeSha256);
  assert.equal(hash(await new Promise((resolve,reject)=>fs.readFile(name,(e,b)=>e?reject(e):resolve(b)))),row.beforeSha256);
  assert.equal(hash(read(name)),row.afterSha256);
 }
});
