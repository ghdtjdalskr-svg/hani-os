import test from 'node:test';
import assert from 'node:assert/strict';
import release298 from './hani-release-298-source.cjs';
import layers from './hani-release-version-layers.cjs';
import helper from './hani-helper-toggle-source.cjs';
import release297 from './hani-release-297-source.cjs';
import design2 from './hani-design-polish-2-source.cjs';
import frozen from './hani-design-polish-2-main298-input.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const {hash,readRawFileSync:read}=release298,root=new URL('../',import.meta.url);
const raw=file=>read(new URL(file,root),'utf8'),release='98cc7debbf9bf365b5db97aabac9b616b2889d20',previous='bc3b22c8fdaab3bd786980a5e0ca61e28ee3acde';

test('298 outer version/history restores independent297 and retains the unchanged helper inverse',()=>{
 const layer=layers.getLayer('2.9.298');assert.equal(layers.layers[0],layer);assert.deepEqual(layer,release298.layer);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 assert.deepEqual(layer.feature,{module:'./hani-helper-toggle-source.cjs',fixture:'./fixtures/helper-toggle-delta.json',restore:'restore'});
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=release298.restore(source,file);
  assert.equal(source,repository.read(release,file),'independent deployed298 bytes');
  assert.equal(before,repository.read(previous,file),'independent main297 bytes');
  assert.equal(hash(source),row.after);assert.equal(hash(before),row.before);
  assert.equal(layers.restoreVersionLayer(source,file,'2.9.298'),before);
  assert.deepEqual(release298.restore(Buffer.from(source),file),Buffer.from(before));
  assert.deepEqual(layers.restoreVersionLayer(Buffer.from(source),file,'2.9.298'),Buffer.from(before));
  assert.equal(layers.projectReleaseSource(source,file,'2.9.298'),source);
  assert.equal(layers.projectFeatureSource(source,file,'2.9.298'),before);
  assert.equal(layers.projectVersionSource(source,file,'2.9.297'),before);
  assert.equal(layers.projectReleaseSource(source,file,'2.9.297'),before);
  assert.equal(layers.projectPreRelease298Source(source,file),before);
  assert.deepEqual(layers.projectPreRelease298Source(Buffer.from(source),file),Buffer.from(before));
  assert.equal(layers.projectPreRelease297Source(source,file),release297.restore(before,file));
  assert.throws(()=>release297.restore(source,file),/exact release-297 input/,'298 precedes297');
  const forward=row.replacements?row.replacements.reduce((s,e)=>{assert.equal(s.split(e.before).length-1,1);return s.replace(e.before,()=>e.after)},before):before.replaceAll(layer.from,layer.to);
  assert.equal(forward,source,'complete mixed EOL round-trip');assert.equal(raw(file),source);
 }
 for(const file of Object.keys(helper.delta.files)){
  const source=raw(file),before=repository.read(previous,file);
  assert.equal(source,repository.read(release,file));assert.equal(hash(source),helper.delta.files[file].afterSha256);
  assert.equal(release298.project(source,file),source,'version-only inverse retains helper');
  assert.equal(helper.restore(source,file),before);assert.deepEqual(helper.restore(Buffer.from(source),file),Buffer.from(before));
  assert.equal(layers.projectFeatureSource(source,file,'2.9.298'),source);
  assert.equal(layers.projectReleaseSource(source,file,'2.9.297'),before);
  assert.deepEqual(layers.projectReleaseSource(Buffer.from(source),file,'2.9.297'),Buffer.from(before));
  for(const bad of [source+'\n',source.slice(1),source+source,before]){assert.throws(()=>helper.restore(bad,file),/exact helper toggle input/);assert.equal(helper.project(bad,file),bad);}
 }
});

test('298 history owns only298 and complete297 source metadata',()=>{
 const file='assets/data/hani-history-releases-v1.json',now=JSON.parse(raw(file)),before=JSON.parse(release298.restore(raw(file),file));
 assert.equal(now.entries[0].id,'v2.9.298');assert.equal(now.entries[0].title,'도우미 끄기·켜기 스위치');
 assert.deepEqual(now.entries[0].source,{commit:'',subject:'release: v2.9.298 도우미 끄기·켜기 스위치'});
 assert.equal(now.entries[1].id,'v2.9.297');assert.deepEqual(now.entries[1].source,{commit:previous,subject:'release: v2.9.297 치비 3탄 생일·일기·시청 (#512)'});
 assert.deepEqual(before.entries[0].source,{commit:'',subject:'release: v2.9.297 치비 3탄 생일·일기·시청'});
 assert.deepEqual(now.entries.slice(2),before.entries.slice(1));assert.deepEqual({...now,entries:[]},{...before,entries:[]});
});

test('298 strict pins reject byte/token/EOL drift, duplicates and double inverse',()=>{
 for(const file of Object.keys(release298.layer.files)){
  const source=raw(file),before=release298.restore(source,file);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'),source.replace('2.9.298','2.9.297')]){
   assert.throws(()=>release298.restore(bad,file),/exact release-298 input/);assert.throws(()=>layers.restoreVersionLayer(bad,file,'2.9.298'),/exact release-298 input/);
   assert.equal(release298.project(bad,file),bad);assert.equal(layers.projectPreRelease298Source(bad,file),bad);
   if(bad!==before)assert.equal(layers.projectReleaseSource(bad,file,'2.9.289'),bad);
  }
 }
 assert.equal(release298.project('unknown','not-an-owner'),'unknown');assert.throws(()=>release298.restore('unknown','not-an-owner'),/known release298 owner/);
});

test('298 count, metadata uniqueness and output pins independently reject malformed contracts',()=>{
 for(const inverse of [{row:layers.getLayer('2.9.298').files,restore:(s,f)=>layers.restoreVersionLayer(s,f,'2.9.298')},{row:release298.layer.files,restore:release298.restore}]){
  const file='index.html',row=inverse.row[file],count=row.count,before=row.before;
  try{row.count++;assert.throws(()=>inverse.restore(raw(file),file),/complete version token count/);row.count=count;row.before='0'.repeat(64);assert.throws(()=>inverse.restore(raw(file),file),/exact release-297 output/);}finally{row.count=count;row.before=before;}
  const history='assets/data/hani-history-releases-v1.json',meta=inverse.row[history],edit=meta.replacements[0],after=edit.after,oldCount=meta.count;
  try{meta.count++;assert.throws(()=>inverse.restore(raw(history),history),/complete release metadata edit count/);meta.count=oldCount;edit.after='not-present';assert.throws(()=>inverse.restore(raw(history),history),/unique complete release metadata/);edit.after='';assert.throws(()=>inverse.restore(raw(history),history),/nonempty exact metadata edit/);}finally{edit.after=after;meta.count=oldCount;}
 }
});

test('current runtime is independent main298 plus unchanged design2 CSS; all release closures stay exact',async()=>{
 const readDisk=design2.readRawFileSync,closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>readDisk(new URL(f,root))});
 assert.equal(closure.files.length,173);assert.deepEqual(closure.missing,[]);
 for(const file of closure.files){
  let sha=repository.commit(release).tree;for(const name of file.split('/'))sha=repository.tree(sha).find(row=>row.name===name).sha;
  assert.deepEqual(design2.project(readDisk(new URL(file,root)),file),repository.object(sha).data,file);
 }
 assert.equal(readDisk(new URL('scripts/hani-design-polish-2-source.cjs',root),'utf8'),repository.read('d23724d','scripts/hani-design-polish-2-source.cjs'));
 assert.equal(readDisk(new URL('scripts/fixtures/design-polish-2-delta.json',root),'utf8'),repository.read('d23724d','scripts/fixtures/design-polish-2-delta.json'));
 const targets=['2.9.298','2.9.297','2.9.296','2.9.295','2.9.294','2.9.293','2.9.289'],counts=[];
 for(const version of targets){const c=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>layers.projectReleaseSource(readDisk(new URL(f,root)),f,version)});counts.push(c.files.length);assert.deepEqual(c.missing,[]);}
 assert.deepEqual(counts,[173,173,172,172,171,168,164]);
});

test('outer tooling input is exact, preserves old assertions and rows, and rejects drift',()=>{
 const readDisk=design2.readRawFileSync;
 for(const [file,row]of Object.entries(frozen.contract.files)){
  const source=readDisk(new URL(file,root),'utf8'),base=/hani-(helper-bot|fun-chat-fortune)\.test/.test(file)?'22fedb3':'d23724d',before=repository.read(base,file);
  assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(frozen.projectTooling(source,file),before);assert.deepEqual(frozen.projectTooling(Buffer.from(source),file),Buffer.from(before));
  for(const bad of [source+'\n',source.slice(1),source+source])assert.equal(frozen.projectTooling(bad,file),bad);
 }
 const old=JSON.parse(repository.read('d23724d','scripts/fixtures/release-version-layers.json'));assert.deepEqual(layers.layers.slice(1),old.layers);
 for(const file of ['scripts/hani-design-polish-2-main297.test.mjs','scripts/hani-release-297.test.mjs']){
  const now=readDisk(new URL(file,root),'utf8'),before=repository.read('d23724d',file);
  const adapted=file.includes('main297')?now.replace("from './hani-design-polish-2-main298-input.cjs'","from './hani-design-polish-2-source.cjs'"):now.replace("from './hani-release-297-input.cjs'","from './hani-release-version-layers.cjs'");assert.equal(adapted,before,'only input import changes '+file);
 }
});

test('298 isolated adapter preserves sync/callback/promise Buffer, string, errors and disk bytes',async()=>{
 const url=new URL('hani-main.js',root),source=read(url),expected=release298.project(source,'hani-main.js'),error=new Error('read failed');
 const disk=(_f,encoding)=>encoding==='utf8'?source.toString('utf8'):source;
 const fake={readFileSync:disk,readFile(f,...args){const done=args.pop();f==='error'?done(error):done(null,disk(f,args[0]))},promises:{readFile:async(...args)=>disk(...args)}};
 let synced=false;
 const sandbox={__dirname:fileURLToPath(new URL('.',import.meta.url)),URL,require:name=>name==='node:fs'?fake:name==='node:path'?path:name==='node:url'?{fileURLToPath}:name==='node:module'?{syncBuiltinESMExports(){synced=true}}:name==='./hani-release-298-source.cjs'?release298:assert.fail(name)};
 vm.runInNewContext(read(new URL('./hani-release-298-preload.cjs',import.meta.url),'utf8'),sandbox);assert.ok(synced);
 for(const file of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){
  const want=encoding?expected.toString('utf8'):expected;assert.deepEqual(fake.readFileSync(file,encoding),want);
  assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
 }
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));assert.deepEqual(read(url),source);
});
