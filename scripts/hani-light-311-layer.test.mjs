import light from './hani-light-311-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const require=createRequire(import.meta.url),root=new URL('../',import.meta.url),dirname=fileURLToPath(new URL('.',import.meta.url));
const {layer,hash,restore,project,readRawFileSync:read}=light,raw=f=>read(new URL(f,root));
const actualHead=repository.reference('HEAD'),actualOrigin=repository.reference('origin/main');
const runtime=['hani-attendance-board.css','hani-attendance-board.js','hani-board-library.js','hani-design-system.css'];
function git(ref,file){
 let tree=repository.commit(ref).tree;
 for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}
 return repository.object(tree).data;
}

test('light-311 exact inverse and forward replay match independent main310 and branch Git bytes',()=>{
 assert.equal(layer.base,'e707d3ada03f106c5b17c834fa5cf1a40e28754b');
 assert.deepEqual(Object.keys(layer.files).sort(),[...runtime,layer.bootstrap.file,...Object.keys(layer.imports)].sort());
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(before,git(layer.base,file),file+' independent main bytes');
  assert.deepEqual(project(source,file),before);assert.equal(restore(source.toString(),file),before.toString());
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){
   assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);
   forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length);
  }
  assert.equal(forward,source.toString(),'complete forward replay '+file);
  if(runtime.includes(file))assert.deepEqual(source,git(layer.head,file),'authored feature bytes');
 }
 assert.equal(raw(layer.bootstrap.file).toString(),layer.bootstrap.line+git(layer.base,layer.bootstrap.file));
 for(const [file,line]of Object.entries(layer.imports))assert.equal(raw(file).toString(),line+git(layer.base,file));
 assert.match(raw('hani-design-system.css').toString(),/\/\* light finish fix 1 \*\//);
});

test('strict inverse rejects stale, partial, duplicate, EOL, count, span and output-pin drift',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString();
  for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.notEqual(bad,source);assert.throws(()=>restore(bad,file));assert.strictEqual(project(bad,file),bad);
  }
  const pin=row.beforeSha256,count=row.count,start=row.replacements[0].start;
  try{
   row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(source,file),/exact pre-light-311 output/);row.beforeSha256=pin;
   row.count++;assert.throws(()=>restore(source,file),/edit count/);row.count=count;
   row.replacements[0].start=-1;assert.throws(()=>restore(source,file),/edit bounds/);
  }finally{row.beforeSha256=pin;row.count=count;row.replacements[0].start=start}
 }
 for(const name of ['unknown','__proto__','constructor','hani-attendance-core.js']){
  const source=Buffer.from('unrelated');assert.strictEqual(project(source,name),source);assert.throws(()=>restore(source,name),/known light-311 owner/);
 }
});

test('fixture pin rejects tampering before interpreting edits',()=>{
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-light-311-source.cjs').toString(),{
  __dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/light-311-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)
 }),/frozen light-311 fixture/);
});

test('outer registration removes only one complete hash-pinned new-file block',()=>{
 const helper=raw(layer.helper.file),block=light.outerBlock(),before=light.projectHelper(helper);
 assert.equal(helper.toString().split(block).length,2);assert.deepEqual(before,git(layer.base,layer.helper.file));
 for(const file of light.outerFiles)assert.ok(block.includes("['"+file+"','"+hash(raw(file))+"']"),file+' exact outer pin');
 for(const bad of [Buffer.concat([helper,Buffer.from('\n')]),Buffer.concat([helper,Buffer.from(block)]),Buffer.from(helper.toString().replace('light311 outer boundaries','changed boundary')),before])assert.strictEqual(light.projectHelper(bad),bad);
 for(const file of light.outerFiles){
  const target=fileURLToPath(new URL(file,root));
  assert.strictEqual(light.projectHelper(helper,f=>f===target?Buffer.concat([read(f),Buffer.from('\n')]):read(f)),helper,'changed registration input remains visible');
 }
});

test('preload preserves sync/callback/promise URL/string Buffer/text/fd and error contracts',async()=>{
 const names=[...Object.keys(layer.files),layer.helper.file,'hani-attendance-core.js'];
 const originals=new Map(names.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString():bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=0;
 vm.runInNewContext(raw('scripts/hani-light-311-preload.cjs').toString(),{
  __dirname:dirname,URL,process:{argv:['node',path.join(dirname,'hani-light-311-layer.test.mjs')]},require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced++}}:n==='./hani-light-311-source.cjs'?light:assert.fail(n)
 });
 assert.equal(synced,1);
 for(const name of names)for(const file of [new URL(name,root),fileURLToPath(new URL(name,root))])for(const encoding of [undefined,'utf8']){
  const expected=name===layer.helper.file?light.projectHelper(raw(name)):project(raw(name),name),want=encoding?expected.toString():expected;
  assert.deepEqual(fake.readFileSync(file,encoding),want);assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));assert.deepEqual(await fake.promises.readFile(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller');let calls=0;assert.throws(()=>fake.readFile(new URL('hani-attendance-board.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-attendance-board.js'],pin=row.beforeSha256;
 try{row.beforeSha256='0'.repeat(64);await new Promise(resolve=>fake.readFile(new URL('hani-attendance-board.js',root),(e,b)=>{assert.match(e.message,/exact pre-light-311 output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(new URL('hani-attendance-board.js',root)),/exact pre-light-311 output/)}finally{row.beforeSha256=pin}
});

test('historical directory input hides only registered complete files and rejects file or helper drift',()=>{
 for(const dir of ['scripts','scripts/fixtures'])for(const objects of [false,true]){
  const names=light.outerFiles.filter(f=>path.posix.dirname(f)===dir).map(f=>path.posix.basename(f));
  const entries=[...names,'unrelated.test.mjs'].map(name=>objects?{name}:name);
  const want=entries.filter(e=>(objects?e.name:e)==='unrelated.test.mjs');
  assert.deepEqual(light.directory(new URL(dir,root),entries),want);
  for(const file of light.outerFiles.filter(f=>path.posix.dirname(f)===dir)){
   const target=fileURLToPath(new URL(file,root));
   const actual=light.directory(new URL(dir,root),entries,f=>f===target?Buffer.concat([read(f),Buffer.from('\n')]):read(f));
   assert.ok(actual.some(e=>(objects?e.name:e)===path.posix.basename(file)),'changed outer file remains visible');
  }
  const helperTarget=fileURLToPath(new URL(layer.helper.file,root));
  assert.deepEqual(light.directory(new URL(dir,root),entries,f=>f===helperTarget?Buffer.concat([read(f),Buffer.from('\n')]):read(f)),entries,'complete helper drift remains visible');
 }
 const entries=['anything'];assert.strictEqual(light.directory(new URL('data',root),entries),entries);assert.strictEqual(light.directory(42,entries),entries);
});

test('original assertions, fixtures, protected paths and authored runtime retain independent Git bytes',async()=>{
 const top=repository.tree(repository.commit(layer.base).tree),scripts=repository.tree(top.find(r=>r.name==='scripts').sha);
 for(const row of scripts.filter(r=>r.name.endsWith('.test.mjs'))){const file='scripts/'+row.name;assert.deepEqual(project(raw(file),file),repository.object(row.sha).data,row.name+' assertions unchanged')}
 function walk(tree,prefix){for(const row of repository.tree(tree)){const file=prefix+row.name;if(row.mode==='40000')walk(row.sha,file+'/');else assert.deepEqual(raw(file),repository.object(row.sha).data,file+' preserved')}}
 walk(scripts.find(r=>r.name==='fixtures').sha,'scripts/fixtures/');for(const name of ['.github','dev-center','supabase'])walk(top.find(r=>r.name===name).sha,name+'/');
 for(const file of ['AGENTS.md','.gitignore','scripts/hani-context-remote.test.mjs','scripts/hani-runtime-closure.mjs','scripts/hani-release-package.mjs','scripts/hani-release-preqa.mjs','scripts/hani-ci-scope.mjs','scripts/hani-board-library-build.mjs'])assert.deepEqual(raw(file),git(layer.base,file));
 for(const row of scripts.filter(r=>r.name.startsWith('hani-one-pass-')&&r.name.endsWith('.mjs')))assert.deepEqual(raw('scripts/'+row.name),repository.object(row.sha).data);
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:raw});
 assert.equal(closure.files.length,177);assert.deepEqual(closure.missing,[]);
 for(const file of closure.files)assert.equal(hash(raw(file)),hash(git(layer.head,file)),file+' authored runtime unchanged');
 for(const file of ['index.html','hani-main.js','assets/data/hani-history-releases-v1.json','data/board-library/part-a.json','data/board-library/part-b.json'])assert.deepEqual(raw(file),git(layer.base,file),'version/history/data unchanged');
});

test('real capture chain is light-311 ->310 ->attendance ->309 and actual Git evidence stays actual',async()=>{
 require('./hani-attendance-preload.cjs');
 const r310=require('./hani-release-310-source.cjs'),attendance=require('./hani-attendance-source.cjs'),r309=require('./hani-release-309-source.cjs');
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:raw});
 for(const file of closure.files){
  const before=project(raw(file),file),pre310=r310.project(before,file),preAttendance=attendance.project(pre310,file);
  assert.deepEqual(r310.readRawFileSync(new URL(file,root)),before,file+'310 capture');
  assert.deepEqual(attendance.readRawFileSync(new URL(file,root)),pre310,file+'attendance capture');
  assert.deepEqual(r309.readRawFileSync(new URL(file,root)),preAttendance,file+'309 capture');
 }
 const reviewed=require('./hani-release-310-reviewed-input.cjs');
 assert.equal(reviewed.actualReference('origin/main'),actualOrigin);assert.equal(reviewed.actualReference('HEAD'),actualHead);
 assert.deepEqual(git(layer.base,'hani-design-system.css'),project(raw('hani-design-system.css'),'hani-design-system.css'));
 assert.notDeepEqual(raw('hani-attendance-board.js'),fs.readFileSync(new URL('hani-attendance-board.js',root)),'test input is projected while raw disk remains authored');
});
