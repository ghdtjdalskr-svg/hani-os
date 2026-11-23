import toon from './hani-toon-313-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const require=createRequire(import.meta.url),root=new URL('../',import.meta.url),dirname=fileURLToPath(new URL('.',import.meta.url));
const {layer,hash,restore,project,readRawFileSync:read}=toon,raw=file=>read(new URL(file,root));
function git(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}return repository.object(tree).data}

test('toon313 exact menu/bootstrap inverse and forward replay match independent Git bytes, including mixed EOL',()=>{
 assert.equal(layer.head,'b65b4b0c03cad8ee76d4721fde02a4877a1d8855');assert.equal(layer.base,'6868fa386218e1eecc1f93b376974e3e7d30a7e2');
 assert.deepEqual(Object.keys(layer.files).sort(),['hani-main.js','index.html','scripts/hani-release-312-source.cjs']);
 assert.equal(layer.files['index.html'].count,4);assert.equal(layer.files['hani-main.js'].count,3);assert.equal(layer.files[layer.bootstrap.file].count,1);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(before,git(file===layer.bootstrap.file?layer.head:layer.base,file));assert.deepEqual(project(source,file),before);assert.equal(restore(source.toString(),file),before.toString());
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length)}assert.equal(forward,source.toString());
  if(file!==layer.bootstrap.file){assert.deepEqual(source,git(layer.head,file));assert.ok(source.includes(Buffer.from('\r\n')));assert.ok(source.toString().replaceAll('\r\n','').includes('\n'));}
 }
 assert.equal(raw(layer.bootstrap.file).toString(),layer.bootstrap.line+git(layer.head,layer.bootstrap.file));
});

test('toon313 rejects stale/EOL/duplicate input, unknown owners, bad count/span/output and frozen fixture drift',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString();
  for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){assert.notEqual(bad,source);assert.throws(()=>restore(bad,file));assert.strictEqual(project(bad,file),bad)}
  const pin=row.beforeSha256,count=row.count,start=row.replacements[0].start;
  try{row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(source,file),/exact pre-toon313 output/);row.beforeSha256=pin;row.count++;assert.throws(()=>restore(source,file),/edit count/);row.count=count;row.replacements[0].start=-1;assert.throws(()=>restore(source,file),/edit bounds/)}finally{row.beforeSha256=pin;row.count=count;row.replacements[0].start=start}
 }
 for(const file of ['unknown','__proto__','constructor','hani-toons.js']){const source=Buffer.from('unrelated');assert.strictEqual(project(source,file),source);assert.throws(()=>restore(source,file),/known toon-313 owner/)}
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-toon-313-source.cjs').toString(),{__dirname:dirname,require:name=>name==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/toon-313-layer.json'),Buffer.from('\n')])}:name==='node:path'?path:name==='node:assert/strict'?assert:name==='node:crypto'?{createHash}:assert.fail(name)}),/frozen toon-313 fixture/);
});

test('complete pinned outer registration is removed exactly once; changed files remain visible',()=>{
 const helper=raw(layer.helper.file),block=toon.outerBlock(),before=toon.projectHelper(helper);
 assert.equal(helper.toString().split(block).length,2);assert.deepEqual(before,git(layer.head,layer.helper.file));
 for(const bad of [Buffer.concat([helper,Buffer.from('\n')]),Buffer.concat([helper,Buffer.from(block)]),Buffer.from(helper.toString().replace('toon313 outer boundaries','altered boundary')),before])assert.strictEqual(toon.projectHelper(bad),bad);
 for(const file of toon.outerFiles){
  const target=fileURLToPath(new URL(file,root)),drift=f=>f===target?Buffer.concat([read(f),Buffer.from('\n')]):read(f);
  assert.strictEqual(toon.projectHelper(helper,drift),helper,file+' drift cannot remove registration');
 }
 for(const dir of ['scripts','scripts/fixtures'])for(const objects of [false,true]){
  const names=toon.outerFiles.filter(f=>path.posix.dirname(f)===dir).map(f=>path.posix.basename(f));
  const entries=[...names,'unrelated.test.mjs'].map(name=>objects?{name}:name),want=entries.filter(e=>(objects?e.name:e)==='unrelated.test.mjs');
  assert.deepEqual(toon.directory(new URL(dir,root),entries),want);
  for(const file of toon.outerFiles.filter(f=>path.posix.dirname(f)===dir)){
   const target=fileURLToPath(new URL(file,root)),drift=f=>f===target?Buffer.concat([read(f),Buffer.from('\n')]):read(f);
   assert.ok(toon.directory(new URL(dir,root),entries,drift).some(e=>(objects?e.name:e)===path.posix.basename(file)));
  }
  const target=fileURLToPath(new URL(layer.helper.file,root));assert.deepEqual(toon.directory(new URL(dir,root),entries,f=>f===target?Buffer.concat([read(f),Buffer.from('\n')]):read(f)),entries);
 }
 const entries=['anything'];assert.strictEqual(toon.directory(new URL('assets',root),entries),entries);assert.strictEqual(toon.directory(42,entries),entries);
});

test('toon313 preload preserves sync/callback/promise URL/string Buffer/text/fd/error contracts and historical directory scope',async()=>{
 const names=[...Object.keys(layer.files),layer.helper.file,'hani-toons.js'],originals=new Map(names.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString():bytes};
 const entries=['hani-toons.test.mjs','unrelated.test.mjs'];
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}},readdirSync:()=>entries};let synced=0;
 vm.runInNewContext(raw('scripts/hani-toon-313-preload.cjs').toString(),{__dirname:dirname,URL,process:{argv:['node',path.join(dirname,'hani-helper-bubble-layer.test.mjs')]},require:name=>name==='node:fs'?fake:name==='node:path'?path:name==='node:url'?{fileURLToPath}:name==='node:module'?{syncBuiltinESMExports(){synced++}}:name==='./hani-toon-313-source.cjs'?toon:assert.fail(name)});
 assert.equal(synced,1);assert.deepEqual(fake.readdirSync(new URL('scripts',root)),['unrelated.test.mjs']);assert.strictEqual(fake.readdirSync(new URL('assets',root)),entries);
 for(const name of names)for(const file of [new URL(name,root),fileURLToPath(new URL(name,root))])for(const encoding of [undefined,'utf8']){
  const expected=name===layer.helper.file?toon.projectHelper(raw(name)):project(raw(name),name),want=encoding?expected.toString():expected;
  assert.deepEqual(fake.readFileSync(file,encoding),want);assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));assert.deepEqual(await fake.promises.readFile(42),Buffer.from('fd'));await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=Error('caller');let calls=0;assert.throws(()=>fake.readFile(new URL('hani-main.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-main.js'],pin=row.beforeSha256;try{row.beforeSha256='0'.repeat(64);await new Promise(resolve=>fake.readFile(new URL('hani-main.js',root),(e,b)=>{assert.match(e.message,/exact pre-toon313 output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(new URL('hani-main.js',root)),/exact pre-toon313 output/)}finally{row.beforeSha256=pin}
});

test('all frozen owners, original tests/fixtures/protected/runtime bytes remain independently anchored to HEAD',()=>{
 for(const [file,pin]of Object.entries(layer.owners)){assert.equal(hash(git(layer.head,file)),pin,file+' independent owner');assert.equal(hash(raw(file)),pin,file+' current owner')}
 assert.equal(hash(toon.projectHelper(raw(layer.helper.file))),hash(git(layer.head,layer.helper.file)));
 for(const file of toon.outerFiles)assert.ok(toon.outerBlock().includes("['"+file+"','"+hash(raw(file))+"']"),file+' exact registration');
 // Assets introduced by #550 remain real runtime inputs; no exists/readdir/closure
 // hook hides these files. Only menu bytes and test scaffolding have an inverse.
 for(const file of ['hani-toons.js','hani-toons.css','assets/data/hani-toons-v1.json','assets/toons/build-3.webp'])assert.deepEqual(raw(file),git(layer.base,file));
 assert.equal(Object.keys(layer.files).some(f=>f.includes('closure')||f.includes('history')),false);
});

test('real capture order is toon313 ->312 ->procrast-312 ->311 ->light-311; actual refs/objects remain accessible',async()=>{
 const actualHead=repository.reference('HEAD'),actualOrigin=repository.reference('origin/main');
 const r312=require('./hani-release-312-source.cjs');
 assert.deepEqual(r312.readRawFileSync(new URL('index.html',root)),project(raw('index.html'),'index.html'));
 assert.deepEqual(r312.readRawFileSync(new URL(layer.bootstrap.file,root)),git(layer.head,layer.bootstrap.file));
 const closure=await resolveRuntimeClosure({read:file=>r312.readRawFileSync(new URL(file,root)),exists:file=>fs.existsSync(new URL(file,root))});
 assert.equal(closure.files.length,183);assert.deepEqual(closure.missing,[]);
 require('./hani-procrast-312-source.cjs');
 const procrast=require('./hani-procrast-312-source.cjs'),r311=require('./hani-release-311-source.cjs'),light=require('./hani-light-311-source.cjs');
 for(const file of [...closure.files,...Object.keys(layer.files)]){
  let bytes=raw(file);
  for(const [adapter,previous]of [[r312,toon],[procrast,r312],[r311,procrast],[light,r311]]){bytes=previous.project(bytes,file);assert.equal(hash(adapter.readRawFileSync(new URL(file,root))),hash(bytes),file+' '+adapter.layer.layer+' capture')}
 }
 // The outer layer never rewrites repository evidence. Historical ref handling
 // belongs to the unchanged lower release layers, whose actual refs remain here.
 const reviewed=require('./hani-release-312-reviewed-input.cjs');
 assert.equal(reviewed.actualReference('HEAD'),actualHead);assert.equal(reviewed.actualReference('origin/main'),actualOrigin);
 assert.deepEqual(git(layer.head,'hani-toons.js'),raw('hani-toons.js'));
});
