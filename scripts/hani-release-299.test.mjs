import test from 'node:test';
import assert from 'node:assert/strict';
import release299 from './hani-release-299-source.cjs';
import layers from './hani-release-version-layers.cjs';
import design2 from './hani-design-polish-2-source.cjs';
import release298 from './hani-release-298-source.cjs';
import helper from './hani-helper-toggle-source.cjs';
import frozen from './hani-design-polish-2-main299-input.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const {hash,readRawFileSync:read}=release299,root=new URL('../',import.meta.url);
const raw=file=>read(new URL(file,root),'utf8'),release='1881888a2ca970ab86adda9b193a90256027be1c',previous='98cc7debbf9bf365b5db97aabac9b616b2889d20';

test('299 version/history is the outermost exact inverse, retaining the frozen design2 feature',()=>{
 const layer=layers.getLayer('2.9.299');assert.equal(layers.layers[0],layer);assert.deepEqual(layer,release299.layer);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 assert.deepEqual(layer.feature,{module:'./hani-design-polish-2-source.cjs',fixture:'./fixtures/design-polish-2-delta.json',restore:'restore'});
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=release299.restore(source,file);
  assert.equal(source,repository.read(release,file));assert.equal(before,repository.read(previous,file));
  assert.equal(hash(source),row.after);assert.equal(hash(before),row.before);
  assert.equal(layers.restoreVersionLayer(source,file,'2.9.299'),before);
  assert.deepEqual(release299.restore(Buffer.from(source),file),Buffer.from(before));
  assert.deepEqual(layers.restoreVersionLayer(Buffer.from(source),file,'2.9.299'),Buffer.from(before));
  assert.equal(layers.projectReleaseSource(source,file,'2.9.299'),source);
  assert.equal(layers.projectFeatureSource(source,file,'2.9.299'),before);
  assert.equal(layers.projectReleaseSource(source,file,'2.9.298'),before);
  assert.equal(layers.projectVersionSource(source,file,'2.9.298'),before);
  assert.equal(layers.projectPreRelease299Source(source,file),before);
  assert.deepEqual(layers.projectPreRelease299Source(Buffer.from(source),file),Buffer.from(before));
  assert.equal(layers.projectPreRelease298Source(source,file),release298.restore(before,file));
  assert.throws(()=>release298.restore(source,file),/exact release-298 input/,'299 precedes298');
  const forward=row.replacements?row.replacements.reduce((s,e)=>{assert.equal(s.split(e.before).length-1,1);return s.replace(e.before,()=>e.after)},before):before.replaceAll(layer.from,layer.to);
  assert.equal(forward,source,'complete byte round trip');assert.equal(raw(file),source);
 }
 const file='hani-design-system.css',source=raw(file),before=repository.read(previous,file);
 assert.equal(source,repository.read(release,file));assert.equal(hash(source),design2.delta.files[file].afterSha256);
 assert.equal(release299.project(source,file),source,'version-only inverse retains design2');
 assert.equal(design2.restore(source,file),before);
 assert.equal(layers.projectReleaseSource(source,file,'2.9.299'),source,'299 boundary retains CSS');
 assert.equal(layers.projectFeatureSource(source,file,'2.9.299'),source,'299 version inverse retains CSS');
 assert.equal(layers.projectReleaseSource(source,file,'2.9.298'),before,'design2 precedes298');
 assert.deepEqual(layers.projectReleaseSource(Buffer.from(source),file,'2.9.298'),Buffer.from(before));
 for(const file of Object.keys(helper.delta.files)){
  const source=raw(file),at298=layers.projectReleaseSource(source,file,'2.9.298');
  assert.equal(at298,repository.read(previous,file));assert.equal(hash(at298),helper.delta.files[file].afterSha256);
  assert.equal(layers.projectReleaseSource(source,file,'2.9.297'),helper.restore(at298,file));
 }
});

test('299 history owns exactly the new entry and complete298 source metadata',()=>{
 const file='assets/data/hani-history-releases-v1.json',now=JSON.parse(raw(file)),before=JSON.parse(release299.restore(raw(file),file));
 assert.equal(now.entries[0].id,'v2.9.299');assert.equal(now.entries[0].title,'디자인 다듬기 2차');
 assert.deepEqual(now.entries[0].source,{commit:'',subject:'release: v2.9.299 디자인 다듬기 2차'});
 assert.equal(now.entries[1].id,'v2.9.298');
 assert.deepEqual(now.entries[1].source,{commit:previous,subject:'release: v2.9.298 도우미 끄기·켜기 스위치 (#514)'});
 assert.deepEqual(before.entries[0].source,{commit:'',subject:'release: v2.9.298 도우미 끄기·켜기 스위치'});
 assert.deepEqual(now.entries.slice(2),before.entries.slice(1));assert.deepEqual({...now,entries:[]},{...before,entries:[]});
});

test('299 strict inverse rejects byte/token/EOL drift, duplicate and repeated inverse',()=>{
 for(const file of Object.keys(release299.layer.files)){
  const source=raw(file),before=release299.restore(source,file);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'),source.replace('2.9.299','2.9.298')]){
   assert.throws(()=>release299.restore(bad,file),/exact release-299 input/);
   assert.throws(()=>layers.restoreVersionLayer(bad,file,'2.9.299'),/exact release-299 input/);
   assert.equal(release299.project(bad,file),bad);assert.equal(layers.projectPreRelease299Source(bad,file),bad);
   if(bad!==before)assert.equal(layers.projectReleaseSource(bad,file,'2.9.289'),bad);
  }
 }
 assert.equal(release299.project('unknown','not-an-owner'),'unknown');assert.throws(()=>release299.restore('unknown','not-an-owner'),/known release299 owner/);
});

test('299 counts, metadata uniqueness and output pins independently reject malformed contracts',()=>{
 for(const inverse of [{row:layers.getLayer('2.9.299').files,restore:(s,f)=>layers.restoreVersionLayer(s,f,'2.9.299')},{row:release299.layer.files,restore:release299.restore}]){
  const file='index.html',row=inverse.row[file],count=row.count,before=row.before;
  try{row.count++;assert.throws(()=>inverse.restore(raw(file),file),/complete version token count/);row.count=count;row.before='0'.repeat(64);assert.throws(()=>inverse.restore(raw(file),file),/exact release-298 output/);}finally{row.count=count;row.before=before;}
  const history='assets/data/hani-history-releases-v1.json',meta=inverse.row[history],edit=meta.replacements[0],after=edit.after,oldCount=meta.count;
  try{meta.count++;assert.throws(()=>inverse.restore(raw(history),history),/complete release metadata edit count/);meta.count=oldCount;edit.after='not-present';assert.throws(()=>inverse.restore(raw(history),history),/unique complete release metadata/);edit.after='';assert.throws(()=>inverse.restore(raw(history),history),/nonempty exact metadata edit/);}finally{edit.after=after;meta.count=oldCount;}
 }
});

test('current runtime is independently deployed299; every lower closure remains exact',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>read(new URL(f,root))});
 assert.equal(closure.files.length,173);assert.deepEqual(closure.missing,[]);
 for(const file of closure.files){
  let sha=repository.commit(release).tree;for(const name of file.split('/'))sha=repository.tree(sha).find(row=>row.name===name).sha;
  assert.deepEqual(read(new URL(file,root)),repository.object(sha).data,file);
  assert.equal(layers.projectReleaseSource(raw(file),file,'2.9.298'),repository.read(previous,file),'independent main298 '+file);
 }
 const counts=[];
 for(const version of ['2.9.299','2.9.298','2.9.297','2.9.296','2.9.295','2.9.294','2.9.293','2.9.289']){
  const c=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>layers.projectReleaseSource(read(new URL(f,root)),f,version)});counts.push(c.files.length);assert.deepEqual(c.missing,[]);
 }
 assert.deepEqual(counts,[173,173,173,172,172,171,168,164]);
});

test('outer tooling hunks restore independent91913ce bytes, old rows and all prior assertions',()=>{
 for(const [file,row]of Object.entries(frozen.contract.files)){
  const source=raw(file),before=repository.read('91913ce',file);
  assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(frozen.projectTooling(source,file),before);
  assert.deepEqual(frozen.projectTooling(Buffer.from(source),file),Buffer.from(before));
  for(const bad of [source+'\n',source.slice(1),source+source])assert.equal(frozen.projectTooling(bad,file),bad);
 }
 const file='scripts/fixtures/release-version-layers.json',before=repository.read('91913ce',file);
 assert.deepEqual(layers.layers.slice(1),JSON.parse(before).layers);
 assert.ok(raw(file).endsWith(before.slice(before.indexOf('    {'))),'all lower manifest bytes preserved');
 const suite='scripts/hani-release-298.test.mjs';
 assert.equal(raw(suite).replace("from './hani-release-298-input.cjs'","from './hani-release-version-layers.cjs'").replace("from './hani-design-polish-2-main299-input.cjs'","from './hani-design-polish-2-source.cjs'"),repository.read('91913ce',suite));
 for(const file of ['scripts/fixtures/design-polish-2-delta.json','scripts/hani-design-polish-2-source.cjs','scripts/fixtures/design-polish-2-main298-input.json','scripts/fixtures/design-polish-2-main297-input.json'])assert.equal(raw(file),repository.read('91913ce',file));
});

test('299 isolated preload preserves sync/callback/promise Buffer, strings, errors and disk bytes',async()=>{
 const url=new URL('hani-main.js',root),source=read(url),expected=release299.project(source,'hani-main.js'),error=new Error('read failed');
 const disk=(_f,encoding)=>encoding==='utf8'?source.toString('utf8'):source;
 const fake={readFileSync:disk,readFile(f,...args){const done=args.pop();f==='error'?done(error):done(null,disk(f,args[0]))},promises:{readFile:async(...args)=>disk(...args)}};
 let synced=false;
 const sandbox={__dirname:fileURLToPath(new URL('.',import.meta.url)),URL,require:name=>name==='node:fs'?fake:name==='node:path'?path:name==='node:url'?{fileURLToPath}:name==='node:module'?{syncBuiltinESMExports(){synced=true}}:name==='./hani-release-299-source.cjs'?release299:assert.fail(name)};
 vm.runInNewContext(read(new URL('./hani-release-299-preload.cjs',import.meta.url),'utf8'),sandbox);assert.ok(synced);
 for(const file of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){
  const want=encoding?expected.toString('utf8'):expected;assert.deepEqual(fake.readFileSync(file,encoding),want);
  assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
 }
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));assert.deepEqual(read(url),source);
});
