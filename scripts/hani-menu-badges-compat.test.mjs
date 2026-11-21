import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import inverse from './hani-menu-badges-source.cjs';
import historical from './hani-menu-badges-historical-input.cjs';
import repository from './hani-test-repository-evidence.cjs';
const root=fileURLToPath(new URL('../',import.meta.url)),scripts=path.join(root,'scripts');
const read=inverse.readRawFileSync,raw=f=>read(path.join(root,f));

test('four legacy connections invert only complete independent Git blobs',()=>{
 for(const file of inverse.connectedTests){
  const before=repository.read(inverse.layer.base,file),source=raw(file);
  assert.equal(source.toString(),inverse.connection+before,'only one import added');
  assert.deepEqual(inverse.project(source,file),Buffer.from(before));
  assert.equal(inverse.project(source.toString(),file),before);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1),Buffer.concat([Buffer.from(inverse.connection),source])])
   assert.strictEqual(inverse.project(bad,file),bad,'drift must stay visible');
  assert.strictEqual(inverse.project(source,'scripts/hani-context-remote.test.mjs'),source);
 }
});

test('historical directory omits only exact menu files and retains every older or unknown entry',()=>{
 for(const dir of ['scripts','scripts/fixtures'])for(const withFileTypes of [false,true]){
  const url=new URL(dir+'/',new URL('../',import.meta.url)),entries=fs.readdirSync(url,{withFileTypes});
  const projected=historical.directory(url,entries),name=e=>typeof e==='string'?e:e.name;
  assert.deepEqual(projected,entries.filter(e=>!historical.outerFiles.has(dir+'/'+name(e))));
  for(const file of historical.outerFiles.keys())if(path.posix.dirname(file)===dir){
   const target=path.join(root,file),bytes=raw(file);
   const drift=f=>f===target?Buffer.concat([bytes,Buffer.from('\n')]):read(f);
   assert.ok(historical.directory(url,entries,drift).some(e=>name(e)===path.posix.basename(file)));
  }
 }
 const entries=['menu-badges-layer.json','unreviewed-layer.json','release-306-layer.json'];
 assert.deepEqual(historical.directory(path.join(scripts,'fixtures'),entries),entries.slice(1));
 assert.strictEqual(historical.directory(root,entries,()=>assert.fail('unrelated read')),entries);
 assert.strictEqual(historical.directory(Buffer.from(scripts),entries),entries);
 const bufferNames=[Buffer.from('hani-menu-badges-layer.test.mjs')];
 assert.deepEqual(historical.directory(scripts,bufferNames),bufferNames);
 assert.throws(()=>historical.directory(scripts,['hani-menu-badges.test.mjs'],()=>{throw Error('read failure')}),/read failure/);
 // The menu's own validation process still sees all real outer files.
 assert.ok(fs.readdirSync(scripts).includes('hani-menu-badges-layer.test.mjs'));
});

const args=['diff','--unified=0',inverse.layer.base,'--',...historical.diffOwners];
const options={cwd:root,encoding:'utf8',maxBuffer:64*1024*1024};
test('proactive diff is empty only after exact inverse equals all five independent Git blobs',()=>{
 assert.equal(historical.emptyHistoricalDiff('git',args,options),'');
 assert.deepEqual(historical.emptyHistoricalDiff('git',args,{cwd:root}),Buffer.alloc(0));
 for(const file of historical.diffOwners){
  const target=path.join(root,file);
  assert.equal(historical.emptyHistoricalDiff('git',args,options,f=>f===target?Buffer.concat([read(f),Buffer.from('\nlocalStorage.clear();\n')]):read(f)),null,file+' drift cannot authorize diff');
 }
 assert.throws(()=>historical.emptyHistoricalDiff('git',args,options,()=>{throw Error('read failure')}),/read failure/);
});

test('unsupported diff commands refs paths encodings and options stay native',()=>{
 const noRead=()=>assert.fail('unsupported request must not inspect owners');
 for(const [command,query,opts]of [
  ['node',args,options],['git',args.slice(0,-1),options],['git',['diff','--unified=1',...args.slice(2)],options],
  ['git',args.map((x,i)=>i===2?'0'.repeat(40):x),options],['git',[...args,'extra.js'],options],
  ['git',args,{...options,cwd:scripts}],['git',args,{...options,encoding:'hex'}],
  ['git',args,{...options,env:{}}],['git',args,undefined],['git',undefined,options]
 ])assert.equal(historical.emptyHistoricalDiff(command,query,opts,noRead),null);
});

test('legacy installers preserve directory options errors refs native fallthrough and caller exceptions',()=>{
 const cp={execFileSync(){throw Error('native execution')}},module={exports:{}};
 vm.runInNewContext(raw('scripts/hani-menu-badges-historical-input.cjs').toString(),{__dirname:scripts,module,URL,Buffer,require:n=>
  n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='./hani-menu-badges-source.cjs'?inverse:
  n==='./hani-test-repository-evidence.cjs'?repository:n==='node:child_process'?cp:assert.fail(n)});
 const compat=module.exports,entries=['hani-menu-badges-layer.test.mjs','older.test.mjs'];let received;
 const original=function(...values){received=values;return entries},fake={readdirSync:original};
 compat.install(fake,path.join(scripts,'hani-helper-bubble-layer.test.mjs'));
 const opts={withFileTypes:false};assert.deepEqual(fake.readdirSync(scripts,opts),['older.test.mjs']);assert.deepEqual(received,[scripts,opts]);
 const error=new Error('native directory failure'),broken={readdirSync(){throw error}};
 compat.install(broken,path.join(scripts,'hani-release-306.test.mjs'));assert.throws(()=>broken.readdirSync(scripts),e=>e===error);
 const untouched={readdirSync:original};compat.install(untouched,path.join(scripts,'hani-menu-badges-layer.test.mjs'));assert.equal(untouched.readdirSync,original);
 compat.install(untouched,path.join(scripts,'hani-proactive-204.test.mjs'));
 assert.equal(cp.execFileSync('git',args,options),'');
 assert.throws(()=>cp.execFileSync('git',['rev-parse','HEAD'],options),/native execution/);
 assert.throws(()=>cp.execFileSync('git',[...args,'extra.js'],options),/native execution/);
});
