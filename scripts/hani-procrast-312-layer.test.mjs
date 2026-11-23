import inverse from './hani-procrast-312-source.cjs';
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
const {layer,hash,restore,project,readRawFileSync:read}=inverse,raw=f=>read(new URL(f,root));
const actualHead=repository.reference('HEAD'),actualOrigin=repository.reference('origin/main');
const runtime=['hani-procrastination-board.js','hani-procrastination-board.css','hani-office-live.js','hani-attendance-board.js'];
function git(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const e=repository.tree(tree).find(e=>e.name===name);assert.ok(e,file+' independent Git entry');tree=e.sha}return repository.object(tree).data}

test('procrast-312 complete inverse and forward replay match independent tooling311 and authored Git bytes',()=>{
 assert.equal(layer.base,'1868d1068ff6664ca42517a1594b72f0ce8420fd');assert.equal(layer.head,'34e19c724eef9b115b7aaa34932f2bca73107b03');
 assert.deepEqual(Object.keys(layer.files).sort(),[...runtime,layer.bootstrap.file,...Object.keys(layer.imports)].sort());
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(before,git(layer.base,file),'independent base '+file);assert.deepEqual(project(source,file),before);assert.equal(restore(source.toString(),file),before.toString());
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){
   assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);
   forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length);
  }
  assert.equal(forward,source.toString(),'complete forward replay '+file);
  if(runtime.includes(file))assert.deepEqual(source,git(layer.head,file),'unchanged authored feature '+file);
 }
 assert.equal(raw(layer.bootstrap.file).toString(),layer.bootstrap.line+git(layer.base,layer.bootstrap.file));
 for(const [file,line]of Object.entries(layer.imports))assert.equal(raw(file).toString(),line+git(layer.head,file),'only the listed import line '+file);
});
test('inverse rejects stale, partial, duplicate, EOL, count, bounds and output pin drift',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString();
  for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,n=>n==='\n'?'\r\n':'\n')]){
   assert.notEqual(bad,source);assert.throws(()=>restore(bad,file));assert.strictEqual(project(bad,file),bad);
  }
  const pin=row.beforeSha256,count=row.count,start=row.replacements[0].start;
  try{
   row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(source,file),/exact pre-procrast-312 output/);row.beforeSha256=pin;
   row.count++;assert.throws(()=>restore(source,file),/edit count/);row.count=count;
   row.replacements[0].start=-1;assert.throws(()=>restore(source,file),/edit bounds/);
  }finally{row.beforeSha256=pin;row.count=count;row.replacements[0].start=start}
 }
 for(const file of ['unknown','__proto__','constructor','hani-attendance-core.js']){
  const s=Buffer.from('unrelated');assert.strictEqual(project(s,file),s);assert.throws(()=>restore(s,file),/known procrast-312 owner/);
 }
});
test('fixture bytes are pinned before parsing edits',()=>{
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-procrast-312-source.cjs').toString(),{
  __dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/procrast-312-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)
 }),/frozen procrast-312 fixture/);
});
test('only one complete hash-pinned outer registration is removed; changed files stay visible',()=>{
 const helper=raw(layer.helper.file),block=inverse.outerBlock(),before=inverse.projectHelper(helper);
 assert.equal(helper.toString().split(block).length,2);assert.deepEqual(before,git(layer.base,layer.helper.file));
 assert.deepEqual(inverse.outerFiles,[
  'scripts/hani-procrast-312-source.cjs','scripts/hani-procrast-312-preload.cjs','scripts/hani-procrast-312-layer.test.mjs',
  'scripts/fixtures/procrast-312-layer.json','scripts/hani-procrastination-2.test.mjs','scripts/hani-attendance-bonus.test.mjs'
 ]);
 for(const file of inverse.outerFiles){
  assert.ok(block.includes("['"+file+"','"+hash(raw(file))+"']"),file+' hash pin');
  const target=fileURLToPath(new URL(file,root));
  assert.strictEqual(inverse.projectHelper(helper,f=>f===target?Buffer.concat([read(f),Buffer.from('\n')]):read(f)),helper);
 }
 for(const bad of [Buffer.concat([helper,Buffer.from('\n')]),Buffer.concat([helper,Buffer.from(block)]),Buffer.from(helper.toString().replace('procrast312 outer boundaries','changed')),before])assert.strictEqual(inverse.projectHelper(bad),bad);
});
test('preload preserves sync/callback/promise URL/string Buffer/text/fd and error contracts',async()=>{
 const names=[...Object.keys(layer.files),layer.helper.file,'hani-attendance-core.js'];
 const originals=new Map(names.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(f,encoding)=>{if(f===42)return Buffer.from('fd');const b=originals.get(f instanceof URL?fileURLToPath(f):f);assert.ok(b);return encoding==='utf8'?b.toString():b};
 const fake={readFileSync:disk,readFile(f,...args){const done=args.pop();f==='error'?done(error):done(null,disk(f,args[0]))},promises:{readFile:async(f,...args)=>{if(f==='error')throw error;return disk(f,...args)}}};let synced=0;
 vm.runInNewContext(raw('scripts/hani-procrast-312-preload.cjs').toString(),{
  __dirname:dirname,URL,process:{argv:['node',path.join(dirname,'hani-procrast-312-layer.test.mjs')]},require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced++}}:n==='./hani-procrast-312-source.cjs'?inverse:assert.fail(n)
 });assert.equal(synced,1);
 for(const name of names)for(const file of [new URL(name,root),fileURLToPath(new URL(name,root))])for(const encoding of [undefined,'utf8']){
  const expected=name===layer.helper.file?inverse.projectHelper(raw(name)):project(raw(name),name),want=encoding?expected.toString():expected;
  assert.deepEqual(fake.readFileSync(file,encoding),want);assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));assert.deepEqual(await fake.promises.readFile(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller');let calls=0;assert.throws(()=>fake.readFile(new URL('hani-office-live.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-office-live.js'],pin=row.beforeSha256;
 try{row.beforeSha256='0'.repeat(64);await new Promise(resolve=>fake.readFile(new URL('hani-office-live.js',root),(e,b)=>{assert.match(e.message,/exact pre-procrast-312 output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(new URL('hani-office-live.js',root)),/exact pre-procrast-312 output/)}finally{row.beforeSha256=pin}
});
test('directory projection hides precisely complete registered outer files and rejects helper drift',()=>{
 for(const dir of ['scripts','scripts/fixtures'])for(const objects of [false,true]){
  const names=inverse.outerFiles.filter(f=>path.posix.dirname(f)===dir).map(f=>path.posix.basename(f)),entries=[...names,'unrelated.test.mjs'].map(name=>objects?{name}:name);
  assert.deepEqual(inverse.directory(new URL(dir,root),entries),entries.filter(e=>(objects?e.name:e)==='unrelated.test.mjs'));
  for(const file of inverse.outerFiles.filter(f=>path.posix.dirname(f)===dir)){
   const target=fileURLToPath(new URL(file,root)),actual=inverse.directory(new URL(dir,root),entries,f=>f===target?Buffer.concat([read(f),Buffer.from('\n')]):read(f));
   assert.ok(actual.some(e=>(objects?e.name:e)===path.posix.basename(file)),'changed outer file visible');
  }
  const helper=fileURLToPath(new URL(layer.helper.file,root));
  assert.deepEqual(inverse.directory(new URL(dir,root),entries,f=>f===helper?Buffer.concat([read(f),Buffer.from('\n')]):read(f)),entries);
 }
 const entries=['anything'];assert.strictEqual(inverse.directory(42,entries),entries);assert.strictEqual(inverse.directory(new URL('data',root),entries),entries);
});
test('existing assertions/fixtures/protected owners and runtime retain independent HEAD bytes',async()=>{
 const top=repository.tree(repository.commit(layer.head).tree),scripts=repository.tree(top.find(r=>r.name==='scripts').sha);
 for(const row of scripts.filter(r=>r.name.endsWith('.test.mjs'))){const file='scripts/'+row.name;assert.deepEqual(project(raw(file),file),repository.object(row.sha).data,'unchanged assertions '+row.name)}
 function walk(tree,prefix){for(const r of repository.tree(tree)){const f=prefix+r.name;r.mode==='40000'?walk(r.sha,f+'/'):assert.deepEqual(raw(f),repository.object(r.sha).data,'preserved '+f)}}
 walk(scripts.find(r=>r.name==='fixtures').sha,'scripts/fixtures/');for(const name of ['.github','dev-center','supabase'])walk(top.find(r=>r.name===name).sha,name+'/');
 for(const f of ['AGENTS.md','.gitignore','scripts/hani-context-remote.test.mjs','scripts/hani-runtime-closure.mjs','scripts/hani-release-package.mjs','scripts/hani-release-preqa.mjs','scripts/hani-ci-scope.mjs','scripts/hani-board-library-build.mjs'])assert.deepEqual(raw(f),git(layer.head,f));
 for(const r of scripts.filter(r=>r.name.startsWith('hani-one-pass-')&&r.name.endsWith('.mjs')))assert.deepEqual(raw('scripts/'+r.name),repository.object(r.sha).data);
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:raw});assert.deepEqual(closure.missing,[]);
 for(const f of closure.files)assert.equal(hash(raw(f)),hash(git(layer.head,f)),f+' authored runtime');
 for(const f of ['index.html','hani-main.js','assets/data/hani-history-releases-v1.json','data/board-library/part-a.json','data/board-library/part-b.json'])assert.deepEqual(raw(f),git(layer.head,f),'unchanged version/history/data');
});
test('real captures follow procrast-312 ->311 ->light-311 ->310 while actual Git evidence stays actual',()=>{
 const r311=require('./hani-release-311-source.cjs');require('./hani-light-311-preload.cjs');require('./hani-release-310-source.cjs');
 const light=require('./hani-light-311-source.cjs'),r310=require('./hani-release-310-source.cjs');
 for(const f of [...runtime,'index.html','hani-main.js']){
  const pre312=project(raw(f),f),pre311=r311.project(pre312,f),preLight=light.project(pre311,f);
  assert.deepEqual(r311.readRawFileSync(new URL(f,root)),pre312,f+'311 capture');
  assert.deepEqual(light.readRawFileSync(new URL(f,root)),pre311,f+'light capture');
  assert.deepEqual(r310.readRawFileSync(new URL(f,root)),preLight,f+'310 capture');
 }
 const reviewed=require('./hani-release-311-reviewed-input.cjs');
 assert.equal(reviewed.actualReference('HEAD'),actualHead);assert.equal(reviewed.actualReference('origin/main'),actualOrigin);
 assert.notDeepEqual(raw('hani-office-live.js'),fs.readFileSync(new URL('hani-office-live.js',root)));
});
