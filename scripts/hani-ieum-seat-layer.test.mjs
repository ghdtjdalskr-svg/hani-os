// Raw seat-swap evidence stays outside the legacy projection chain.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import seat from './hani-ieum-seat-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
const {delta,hash,restore,project,readRawFileSync:read}=seat;
const root=new URL('../',import.meta.url),raw=f=>read(new URL(f,root));
const main='ad95b84376edb9d132338a50a9b1423209b46c63',feature='386a880f7bee1ab3f298425985f43d251c797b5e';

test('six seat owners invert to independent main bytes with exact forward round trips',()=>{
 assert.equal(delta.base,main);assert.equal(delta.feature,feature);
 assert.deepEqual(Object.keys(delta.files).sort(),['assets/data/office-actions-216.json','assets/data/office-actions-221.json','data/hani-building/art-map-v1.json','data/hani-building/office-places.json','data/hani-building/spatial-contract.json','hani-office-live.js']);
 for(const [file,row]of Object.entries(delta.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(source,Buffer.from(repository.read(feature,file)),file+' committed swap');
  assert.deepEqual(before,Buffer.from(repository.read(main,file)),file+' independent main');
  assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(restore(source.toString('utf8'),file),before.toString('utf8'));
  let forward=before.toString('utf8');
  for(const e of row.edits){assert.equal(forward.slice(e.start,e.start+e.before.length),e.before);forward=forward.slice(0,e.start)+e.after+forward.slice(e.start+e.before.length);}
  assert.equal(forward,source.toString('utf8'),'full forward round trip '+file);
 }
});

test('strict input and output pins reject drift, repeated inverse, EOL and corrupt hunks',()=>{
 for(const [file,row]of Object.entries(delta.files)){
  const source=raw(file).toString('utf8'),before=restore(source,file);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   if(bad===source)continue;assert.throws(()=>restore(bad,file),/exact ieum-seat input/);assert.equal(project(bad,file),bad);
  }
  const pin=row.beforeSha256,start=row.edits[0].start;
  try{row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(source,file),/exact main300 output/);row.beforeSha256=pin;row.edits[0].start++;assert.throws(()=>restore(source,file),/complete ieum-seat hunk/);}finally{row.beforeSha256=pin;row.edits[0].start=start;}
  assert.deepEqual(project(raw(file),file),Buffer.from(before));
 }
 for(const file of ['unknown','__proto__','scripts/hani-runtime-closure.mjs','dev-center/codemap.json']){const bytes=Buffer.from('unrelated');assert.strictEqual(project(bytes,file),bytes);assert.throws(()=>restore(bytes,file),/known ieum-seat owner/);}
});

test('preload preserves sync, callback, promise, Buffer, URL, fd and error behavior without writes',async()=>{
 const files=[...Object.keys(delta.files),'scripts/hani-runtime-closure.mjs','scripts/hani-one-pass-rules.mjs','scripts/fixtures/release-300-layer.json'];
 const originals=new Map(files.map(file=>[fileURLToPath(new URL(file,root)),raw(file)])),readError=new Error('synthetic read failure');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString('utf8'):bytes;};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(readError):done(null,disk(file,args[0]));},promises:{readFile:async(file,...args)=>{if(file==='error')throw readError;return disk(file,...args);}}};let synced=false;
 vm.runInNewContext(raw('scripts/hani-ieum-seat-preload.cjs').toString('utf8'),{__dirname:fileURLToPath(new URL('.',import.meta.url)),URL,require:name=>name==='node:fs'?fake:name==='node:path'?path:name==='node:url'?{fileURLToPath}:name==='node:module'?{syncBuiltinESMExports(){synced=true;}}:name==='./hani-ieum-seat-source.cjs'?seat:assert.fail(name)});
 assert.ok(synced);
 for(const name of files){const url=new URL(name,root),source=originals.get(fileURLToPath(url)),expected=project(source,name);
  for(const file of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){
   const want=encoding?expected.toString('utf8'):expected;
   assert.deepEqual(fake.readFileSync(file,encoding),want);
   assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);
   assert.deepEqual(await fake.promises.readFile(file,encoding),want);
  }
  assert.deepEqual(raw(name),source,'disk unchanged '+name);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile('error',(error,bytes)=>{assert.equal(error,readError);assert.equal(bytes,undefined);resolve();}));
 await assert.rejects(fake.promises.readFile('error'),error=>error===readError);
});

test('release300 captures main bytes after the seat inverse while the raw reader retains new seats',async()=>{
 const release=(await import('./hani-release-300-source.cjs')).default;
 for(const file of Object.keys(delta.files)){
  assert.equal(release.readRawFileSync(new URL(file,root),'utf8'),repository.read(main,file),'release300 boundary '+file);
  assert.equal(read(new URL(file,root),'utf8'),repository.read(feature,file),'raw seat boundary '+file);
 }
 const canon=JSON.parse(raw('data/hani-building/spatial-contract.json'));
 assert.equal(canon.people.find(p=>p.id==='ieum').homeAnchor,'desk_yuna');
 assert.equal(canon.people.find(p=>p.id==='yuna').homeAnchor,'reception');
});
