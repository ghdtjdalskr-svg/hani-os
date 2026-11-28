import release from './hani-release-324-source.cjs';
import reviewed from './hani-release-324-reviewed-input.cjs';
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
const {layer,hash,restore,project,readRawFileSync:read}=release,raw=f=>read(new URL(f,root));
const actualHead=repository.reference('HEAD'),actualOrigin=repository.reference('origin/main');
const actualMergeBase=repository.readOnly(['merge-base','HEAD','origin/main']).trim();
function git(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}return repository.object(tree).data}

test('324 exact version/history/bootstrap inverse and forward replay match independent Git bytes',()=>{
 assert.equal(layer.release,'49400a0ef49a7fe7c45e1a216034ef9cbd5b7beb');assert.equal(layer.base,'ee83d200979e3aee18aeaa20fbe3747cb7d90c2b');assert.equal(layer.feature,'8410057096417e0ae3626cc1f64266c788428434');
 assert.deepEqual(Object.keys(layer.files).sort(),['hani-main.js','index.html','scripts/hani-building-324-source.cjs']);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(before,git(file===layer.bootstrap.file?layer.head:layer.feature,file),file+' independent origin');
  assert.deepEqual(project(source,file),before);assert.equal(restore(source.toString(),file),before.toString());
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length)}assert.equal(forward,source.toString());
  if(file!==layer.bootstrap.file)assert.deepEqual(source,git(layer.release,file));
 }
 for(const [file,count]of [['index.html',62],['hani-main.js',1]]){const source=raw(file).toString();assert.equal(source.split(layer.to).length-1,count);assert.equal(source.replaceAll(layer.to,layer.from),restore(source,file))}
 assert.equal(raw(layer.bootstrap.file).toString(),layer.bootstrap.line+git(layer.head,layer.bootstrap.file));
});

test('324 history entry ships from the feature input; the release adds no history edit',()=>{
 const file='assets/data/hani-history-releases-v1.json',after=JSON.parse(raw(file));
 assert.equal(Object.hasOwn(layer.files,file),false);
 assert.equal(after.entries[0].id,'v2.9.324');assert.equal(after.entries[0].title,'1층 교대 장면 (걸어서 인수인계)');assert.equal(after.entries[0].date,'2026-11-28');
 assert.equal(after.entries[1].id,'v2.9.323');
});

test('324 rejects stale input, EOL, duplicate bytes, bad count/span/output and frozen fixture drift',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString();
  for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){assert.notEqual(bad,source);assert.throws(()=>restore(bad,file));assert.strictEqual(project(bad,file),bad)}
  const pin=row.beforeSha256,count=row.count,start=row.replacements[0].start;
  try{row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(source,file),/exact pre324 output/);row.beforeSha256=pin;row.count++;assert.throws(()=>restore(source,file),/edit count/);row.count=count;row.replacements[0].start=-1;assert.throws(()=>restore(source,file),/edit bounds/)}finally{row.beforeSha256=pin;row.count=count;row.replacements[0].start=start}
 }
 for(const file of ['unknown','__proto__','constructor','hani-attendance-core.js']){const source=Buffer.from('unrelated');assert.strictEqual(project(source,file),source);assert.throws(()=>restore(source,file),/known release-324 owner/)}
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-324-source.cjs').toString(),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/release-324-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen release-324 fixture/);
});

test('324 complete owner and ancestry gates reject metadata, runtime, fixture, test, protected and registration drift',()=>{
 const query=['merge-base','HEAD','origin/main'];assert.equal(reviewed.actualReadOnly(query),actualMergeBase);assert.equal(reviewed.readOnly(query),layer.base);
 const drift=[...Object.keys(layer.files),'scripts/hani-office-shift-handover.test.mjs','scripts/hani-building-324-preload.cjs','scripts/hani-building-324-layer.test.mjs','scripts/fixtures/building-324-layer.json','scripts/hani-release-323-source.cjs','scripts/hani-release-323-reviewed-input.cjs','scripts/fixtures/release-323-layer.json','scripts/fixtures/building-323-layer.json','scripts/hani-context-remote.test.mjs','AGENTS.md','.gitignore','dev-center/codemap.json',layer.helper.file,...release.outerFiles];
 for(const file of new Set(drift)){
  const target=fileURLToPath(new URL(file,root)),source=raw(file);
  assert.ok(Object.hasOwn(layer.files,file)||Object.hasOwn(layer.owners,file)||file===layer.helper.file||release.outerFiles.includes(file),file+' covered');
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1)])assert.equal(reviewed.selectBase(layer.release,f=>f===target?bad:read(f)),layer.release,file+' byte drift');
 }
 for(const ref of [actualOrigin,actualMergeBase,actualHead]){assert.equal(reviewed.acceptsRemote(ref),true);assert.equal(reviewed.selectBase(ref),layer.base)}
 for(const ref of [layer.base,'0'.repeat(40)])assert.equal(reviewed.selectBase(ref,()=>assert.fail('unrelated input reads')),ref);
 assert.equal(reviewed.selectBase(layer.release,()=>assert.fail('unrelated remote reads'),'0'.repeat(40)),layer.release);
 assert.throws(()=>reviewed.selectBase(layer.release,()=>{throw Error('read failure')}),/read failure/);
 const unrelated='1'.repeat(40);for(const parents of [[],[unrelated]])assert.equal(reviewed.acceptsRemote(unrelated,{commit:()=>({parents})}),false);
 assert.throws(()=>reviewed.acceptsRemote(unrelated,{commit:()=>{throw Error('ancestry failure')}}),/ancestry failure/);
 assert.equal(reviewed.acceptsRemote('0'.repeat(40),new Proxy({},{get(){assert.fail('zero ref reads')}})),false);
 for(const args of [['rev-parse','HEAD'],['show',layer.release+':hani-main.js'],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.release]])assert.equal(reviewed.readOnly(args),reviewed.actualReadOnly(args));
 assert.equal(reviewed.readOnly(['rev-parse','origin/main']),layer.base);assert.equal(repository.reference('origin/main'),actualOrigin,'import alone never installs history');assert.equal(reviewed.actualReference('HEAD'),actualHead);
 assert.throws(()=>reviewed.readOnly(['merge-base','origin/main','HEAD']));
 const simulated={exports:{}},protocol={...repository,reference:name=>name==='origin/main'?'0'.repeat(40):reviewed.actualReference(name),readOnly:args=>args.join(' ')==='merge-base HEAD origin/main'?layer.base:args.join(' ')==='rev-parse origin/main'?'0'.repeat(40):reviewed.actualReadOnly(args)};
 vm.runInNewContext(raw('scripts/hani-release-324-reviewed-input.cjs').toString(),{module:simulated,__dirname:dirname,require:n=>n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-324-source.cjs'?release:n==='node:path'?path:n==='node:fs'?fs:assert.fail(n)});
 assert.equal(simulated.exports.reference('origin/main'),'0'.repeat(40));assert.equal(simulated.exports.readOnly(['rev-parse','origin/main']),'0'.repeat(40),'passthrough base cannot authorize refs');
});

test('324 helper and historical directory remove only one complete pinned new-file block',()=>{
 const helper=raw(layer.helper.file),block=release.outerBlock(),before=release.projectHelper(helper);
 assert.equal(helper.toString().split(block).length,2);assert.deepEqual(before,git(layer.head,layer.helper.file));
 for(const bad of [Buffer.concat([helper,Buffer.from('\n')]),Buffer.concat([helper,Buffer.from(block)]),Buffer.from(helper.toString().replace('tooling324 outer boundaries','altered boundary')),before])assert.strictEqual(release.projectHelper(bad),bad);
 for(const dir of ['scripts','scripts/fixtures'])for(const objects of [false,true]){
  const names=release.outerFiles.filter(f=>path.posix.dirname(f)===dir).map(f=>path.posix.basename(f));
  const entries=[...names,'unrelated.test.mjs'].map(name=>objects?{name}:name),want=entries.filter(e=>(objects?e.name:e)==='unrelated.test.mjs');
  assert.deepEqual(release.directory(new URL(dir,root),entries),want);
  for(const file of release.outerFiles){const target=fileURLToPath(new URL(file,root)),drift=f=>f===target?Buffer.concat([read(f),Buffer.from('\n')]):read(f);assert.strictEqual(release.projectHelper(helper,drift),helper);if(path.posix.dirname(file)===dir)assert.ok(release.directory(new URL(dir,root),entries,drift).some(e=>(objects?e.name:e)===path.posix.basename(file)))}
  const target=fileURLToPath(new URL(layer.helper.file,root));assert.deepEqual(release.directory(new URL(dir,root),entries,f=>f===target?Buffer.concat([read(f),Buffer.from('\n')]):read(f)),entries);
 }
 const entries=['anything'];assert.strictEqual(release.directory(new URL('data',root),entries),entries);assert.strictEqual(release.directory(42,entries),entries);
});

test('324 preload preserves sync/callback/promise URL/string Buffer/text/fd and error contracts',async()=>{
 const names=[...Object.keys(layer.files),layer.helper.file,'hani-attendance-core.js'],originals=new Map(names.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString():bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=0,installed=0;
 vm.runInNewContext(raw('scripts/hani-release-324-preload.cjs').toString(),{__dirname:dirname,URL,process:{argv:['node',path.join(dirname,'hani-release-324.test.mjs')]},require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced++}}:n==='./hani-release-324-source.cjs'?release:n==='./hani-release-324-reviewed-input.cjs'?{installHistoricalInputs(){installed++}}:assert.fail(n)});
 assert.equal(synced,1);assert.equal(installed,1);
 for(const name of names)for(const file of [new URL(name,root),fileURLToPath(new URL(name,root))])for(const encoding of [undefined,'utf8']){const expected=name===layer.helper.file?release.projectHelper(raw(name)):project(raw(name),name),want=encoding?expected.toString():expected;assert.deepEqual(fake.readFileSync(file,encoding),want);assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want)}
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));assert.deepEqual(await fake.promises.readFile(42),Buffer.from('fd'));await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller');let calls=0;assert.throws(()=>fake.readFile(new URL('hani-main.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-main.js'],pin=row.beforeSha256;try{row.beforeSha256='0'.repeat(64);await new Promise(resolve=>fake.readFile(new URL('hani-main.js',root),(e,b)=>{assert.match(e.message,/exact pre324 output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(new URL('hani-main.js',root)),/exact pre324 output/)}finally{row.beforeSha256=pin}
});

test('original tests, fixtures, protected paths and all runtime files retain independent Git bytes',async()=>{
 const top=repository.tree(repository.commit(layer.head).tree),scripts=repository.tree(top.find(r=>r.name==='scripts').sha);
 for(const row of scripts.filter(r=>r.name.endsWith('.test.mjs')))assert.deepEqual(project(raw('scripts/'+row.name),'scripts/'+row.name),repository.object(row.sha).data,row.name+' unchanged');
 function walk(tree,prefix){for(const row of repository.tree(tree)){const file=prefix+row.name;if(row.mode==='40000')walk(row.sha,file+'/');else assert.deepEqual(raw(file),repository.object(row.sha).data,file+' preserved')}}
 walk(scripts.find(r=>r.name==='fixtures').sha,'scripts/fixtures/');for(const name of ['.github','dev-center','supabase'])walk(top.find(r=>r.name===name).sha,name+'/');
 for(const file of ['AGENTS.md','.gitignore','scripts/hani-context-remote.test.mjs','scripts/hani-runtime-closure.mjs','scripts/hani-release-package.mjs','scripts/hani-release-preqa.mjs','scripts/hani-ci-scope.mjs','scripts/hani-board-library-build.mjs'])assert.deepEqual(raw(file),git(layer.head,file));
 for(const row of scripts.filter(r=>r.name.startsWith('hani-one-pass-')&&r.name.endsWith('.mjs')))assert.deepEqual(raw('scripts/'+row.name),repository.object(row.sha).data);
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:raw});assert.equal(closure.files.length,layer.closureCount);assert.deepEqual(closure.missing,[]);for(const file of closure.files)assert.deepEqual(raw(file),git(layer.release,file),file+' released324 runtime');
 for(const file of ['data/board-library/part-a.json','data/board-library/part-b.json'])assert.deepEqual(raw(file),git(layer.head,file));
 for(const file of release.outerFiles)assert.ok(release.outerBlock().includes("['"+file+"','"+hash(raw(file))+"']"),file+' exact registration');
});


test('324 complete frozen owner cohort is independently anchored to the original HEAD tree',()=>{
 assert.equal(repository.commit(layer.release).parents[0],layer.base);
 assert.equal(layer.head,'ceca64ba7de1f5624371916839f6f1007bbc3aa6');
 for(const [file,pin]of Object.entries(layer.owners)){
  assert.equal(hash(git(layer.head,file)),pin,file+' independent frozen Git owner');
  assert.equal(hash(raw(file)),pin,file+' complete current owner');
 }
});

test('real capture chain is324 -> building-324 ->323 -> building-323 ->322 -> building-322; actual refs and objects remain available',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:raw});
 require('./hani-attendance-preload.cjs');
 const building=require('./hani-building-324-source.cjs'),r323=require('./hani-release-323-source.cjs'),b323=require('./hani-building-323-source.cjs'),r322=require('./hani-release-322-source.cjs'),b322=require('./hani-building-322-source.cjs');
 for(const file of [...closure.files,...Object.keys(layer.files)]){
  let bytes=raw(file);
  for(const [adapter,previous]of [[building,release],[r323,building],[b323,r323],[r322,b323],[b322,r322]]){
   bytes=previous.project(bytes,file);
   assert.equal(hash(adapter.readRawFileSync(new URL(file,root))),hash(bytes),file+' '+adapter.layer.layer+' capture');
  }
 }
 assert.equal(reviewed.actualReference('HEAD'),actualHead);assert.equal(reviewed.actualReference('origin/main'),actualOrigin);
 assert.equal(reviewed.actualReadOnly(['merge-base','HEAD','origin/main']),actualMergeBase);
 assert.equal(reviewed.actualReadOnly(['show',layer.release+':hani-main.js']),git(layer.release,'hani-main.js').toString());
 assert.notDeepEqual(raw('index.html'),fs.readFileSync(new URL('index.html',root)));
});
