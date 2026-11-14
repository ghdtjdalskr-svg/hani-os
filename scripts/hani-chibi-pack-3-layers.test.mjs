import test from 'node:test';
import assert from 'node:assert/strict';
import inverse from './hani-chibi-pack-3-source.cjs';
import release296 from './hani-release-296-source.cjs';
import layers from './hani-release-version-layers.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const {readRawFileSync:read,hash,project}=inverse,root=new URL('../',import.meta.url);
test('chibi3 is outside main296; original 296/design295/295/chibi2/294/THAW and all closure boundaries stay exact',async()=>{
 const file='hani-main.js',raw=read(new URL(file,root),'utf8'),main296=project(raw,file);
 assert.equal(main296,repository.read(inverse.delta.base,file));
 assert.equal(hash(main296),release296.layer.files[file].after);
 assert.throws(()=>release296.restore(raw,file),/exact release-296 input/);
 assert.equal(release296.restore(main296,file),layers.projectFeatureSource(main296,file,'2.9.296'));
 const projects=[b=>b,(b,f)=>project(b,f),(b,f)=>release296.project(project(b,f),f),
  (b,f)=>layers.projectReleaseSource(project(b,f),f,'2.9.295'),
  (b,f)=>layers.projectFeatureSource(project(b,f),f,'2.9.295'),
  (b,f)=>layers.projectReleaseSource(project(b,f),f,'2.9.294'),
  (b,f)=>layers.projectReleaseSource(project(b,f),f,'2.9.293'),
  (b,f)=>layers.projectReleaseSource(project(b,f),f,'2.9.289')];
 const counts=[];for(const p of projects){const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>p(read(new URL(f,root)),f)});counts.push(closure.files.length);assert.deepEqual(closure.missing,[]);}
 assert.deepEqual(counts,[173,172,172,172,172,171,168,164]);assert.equal(read(new URL(file,root),'utf8'),raw,'physical feature bytes preserved');
});
test('captured main296 reader preserves Buffer/string boundaries and rejects unknown input pins',()=>{
 for(const file of Object.keys(inverse.delta.files)){
  const url=new URL(file,root),raw=read(url),expected=project(raw,file);
  // Existing adapters may project further; use the outer layer directly for its boundary.
  assert.equal(hash(expected),inverse.delta.files[file].beforeSha256);
  assert.equal(project(raw.toString('utf8'),file),expected.toString('utf8'));
  assert.equal(release296.readRawFileSync(url,'utf8'),expected.toString('utf8'));
  assert.equal(hash(read(url)),inverse.delta.files[file].afterSha256);
 }
 const source=read(new URL('hani-main.js',root),'utf8');
 for(const bad of [source+'\n',source.slice(1),source+source]){assert.equal(project(bad,'hani-main.js'),bad);assert.equal(release296.project(bad,'hani-main.js'),bad);}
});
test('isolated outer adapter handles real sync/callback/promise API shapes before lower adapters',async()=>{
 const fileURL=new URL('hani-main.js',root),raw=read(fileURL),expected=project(raw,'hani-main.js');
 const disk=(_file,encoding)=>encoding==='utf8'?raw.toString('utf8'):raw;
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();done(null,disk(file,args[0]))},promises:{readFile:async(...args)=>disk(...args)}};
 let synced=false;const sandbox={__dirname:fileURLToPath(new URL('.',import.meta.url)),URL,
  require:name=>name==='node:fs'?fake:name==='node:path'?path:name==='node:url'?{fileURLToPath}:name==='node:module'?{syncBuiltinESMExports(){synced=true}}:name==='./hani-chibi-pack-3-source.cjs'?inverse:assert.fail('unexpected import '+name)};
 vm.runInNewContext(read(new URL('./hani-chibi-pack-3-preload.cjs',import.meta.url),'utf8'),sandbox);
 assert.ok(synced);
 for(const target of [fileURL,fileURLToPath(fileURL)])for(const encoding of [undefined,'utf8']){
  const want=encoding?expected.toString('utf8'):expected;
  assert.deepEqual(fake.readFileSync(target,encoding),want);
  assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(target,encoding,(error,b)=>error?reject(error):resolve(b))),want);
  assert.deepEqual(await fake.promises.readFile(target,encoding),want);
 }
 assert.deepEqual(read(fileURL),raw);
});
