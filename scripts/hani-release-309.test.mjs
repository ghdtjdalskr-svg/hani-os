import release from './hani-release-309-source.cjs';
import reviewed from './hani-release-309-reviewed-input.cjs';
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
function gitBytes(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}return repository.object(tree).data}

test('309 exact version/history and bootstrap inverse replay independent pre309 Git bytes',()=>{
 assert.equal(layer.release,'c367660a969163ea05c1176ffb8b1d4b96242543');assert.equal(layer.base,'28065ff8f62546568dd4851ae7ee3d810f31a0bf');
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html','scripts/hani-ai-budget-view-source.cjs']);
 for(const [file,row]of Object.entries(layer.files)){
  const after=raw(file),before=restore(after,file),ref=file.startsWith('scripts/')?layer.head:file.startsWith('assets/')?layer.base:layer.viewHead;
  assert.deepEqual(before,gitBytes(ref,file));assert.equal(restore(after.toString(),file),before.toString());assert.deepEqual(project(after,file),before);
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length)}assert.equal(forward,after.toString());
  if(!file.startsWith('scripts/'))assert.deepEqual(after,gitBytes(layer.release,file));
 }
 for(const [file,count]of [['index.html',60],['hani-main.js',1]]){const after=raw(file).toString();assert.equal(after.split(layer.to).length-1,count);assert.equal(after.replaceAll(layer.to,layer.from),restore(after,file))}
 assert.equal(raw(layer.bootstrap.file).toString(),layer.bootstrap.line+gitBytes(layer.head,layer.bootstrap.file).toString());
});

test('309 history adds only309 and fills the308 commit and subject',()=>{
 const file='assets/data/hani-history-releases-v1.json',after=JSON.parse(raw(file)),before=JSON.parse(restore(raw(file),file));
 assert.equal(after.entries[0].id,'v2.9.309');assert.equal(after.entries[0].title,'AI 예산 화면 · 4컷 문구 정리');assert.equal(after.entries[0].date,'2026-11-22');
 assert.deepEqual(after.entries[1].source,{commit:'ee6e617c1b3fb88ba85ee8f19df776613c559d6f',subject:'release: v2.9.308 사무실 움직임 · 새 5층 오픈 (#537)'});
 assert.deepEqual({...after.entries[1],source:null},{...before.entries[0],source:null});assert.deepEqual(after.entries.slice(2),before.entries.slice(1));assert.deepEqual({...after,entries:[]},{...before,entries:[]});
});

test('309 complete owner gate rejects metadata/runtime/tooling/test/fixture drift and retains actual queries',()=>{
 const query=['merge-base','HEAD','origin/main'];assert.equal(reviewed.rawReadOnly(query),layer.release);assert.equal(reviewed.readOnly(query),layer.base);
 const drift=[...Object.keys(layer.files),'hani-ai-budget.js','hani-ai-budget.css','hani-newsroom-4cut.js','hani-office-live.js','scripts/hani-release-308-source.cjs','scripts/hani-ai-budget-view-reviewed-input.cjs','scripts/hani-context-remote.test.mjs','scripts/fixtures/ai-budget-view-layer.json','AGENTS.md','dev-center/codemap.json'];
 for(const file of drift){const target=fileURLToPath(new URL(file,root)),source=raw(file);assert.ok(layer.files[file]||layer.owners[file],file+' gated');
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1)])assert.equal(reviewed.selectBase(layer.release,f=>f===target?bad:read(f)),layer.release,file+' drift');
 }
 for(const base of [layer.base,'0'.repeat(40)])assert.equal(reviewed.selectBase(base,()=>assert.fail('unrelated base reads')),base);
 assert.throws(()=>reviewed.selectBase(layer.release,()=>{throw Error('read failure')}),/read failure/);
 for(const args of [['rev-parse','HEAD'],['rev-parse','origin/main'],['show',layer.release+':hani-main.js'],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.release]])assert.equal(reviewed.readOnly(args),reviewed.rawReadOnly(args));
 assert.equal(repository.reference('HEAD'),reviewed.rawReadOnly(['rev-parse','HEAD']));assert.equal(repository.reference('origin/main'),layer.release);assert.throws(()=>reviewed.readOnly(['merge-base','origin/main','HEAD']));
 function isolated(entry,remote=layer.release){
  const module={exports:{}},protocol={...repository,readOnly:args=>reviewed.rawReadOnly(Array.from(args)),reference:name=>name==='origin/main'?remote:repository.reference(name)};
  vm.runInNewContext(raw('scripts/hani-release-309-reviewed-input.cjs').toString(),{__dirname:dirname,process:{argv:['node',path.join(dirname,entry)]},module,require:n=>n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-309-source.cjs'?release:n==='node:fs'?fs:n==='node:path'?path:assert.fail(n)});
  return {adapter:module.exports,protocol};
 }
 const moved=isolated('hani-release-309.test.mjs','0'.repeat(40));assert.equal(moved.adapter.selectBase(layer.release,()=>assert.fail('moved remote reads owners')),layer.release);
 const historical=isolated('hani-release-308.test.mjs');historical.adapter.installHistoricalInputs();
 assert.equal(historical.adapter.readOnly(['rev-parse','HEAD']),layer.authored308);assert.equal(historical.protocol.reference('HEAD'),layer.authored308);
 assert.equal(historical.adapter.actualReference('HEAD'),repository.reference('HEAD'),'independent actual ref remains available');
 assert.equal(historical.protocol.reference('origin/main'),layer.release);assert.equal(repository.reference('HEAD'),reviewed.rawReadOnly(['rev-parse','HEAD']),'historical HEAD adapter is isolated to308 entry');
});

test('309 inverse fails closed for stale input, EOL, duplicates, invalid spans/counts and fixture tampering',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString();for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){assert.notEqual(source,bad);assert.throws(()=>restore(bad,file));assert.strictEqual(project(bad,file),bad)}
  const pin=row.beforeSha256,count=row.count,start=row.replacements[0].start;
  try{row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(source,file),/exact pre309 output/);row.beforeSha256=pin;row.count++;assert.throws(()=>restore(source,file),/edit count/);row.count=count;row.replacements[0].start=-1;assert.throws(()=>restore(source,file),/edit bounds/)}finally{row.beforeSha256=pin;row.count=count;row.replacements[0].start=start}
 }
 for(const name of ['unknown','__proto__','constructor','hani-ai-budget.js']){const source=Buffer.from('unrelated');assert.strictEqual(project(source,name),source);assert.throws(()=>restore(source,name),/known release-309 owner/)}
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-309-source.cjs').toString(),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/release-309-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen release-309 fixture/);
});

test('309 preload preserves sync/callback/promise URL/string Buffer/text/fd and error behavior',async()=>{
 const files=[...Object.keys(layer.files),'hani-ai-budget.js'],originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString():bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false,installed=false;const protocol={};
 vm.runInNewContext(raw('scripts/hani-release-309-preload.cjs').toString(),{__dirname:dirname,URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-release-309-source.cjs'?release:n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-309-reviewed-input.cjs'?{...reviewed,installHistoricalInputs(){installed=true}}:assert.fail(n)});
 assert.ok(synced&&installed);assert.equal(protocol.readOnly,reviewed.readOnly);
 for(const name of files)for(const file of [new URL(name,root),fileURLToPath(new URL(name,root))])for(const encoding of [undefined,'utf8']){const expected=project(raw(name),name),want=encoding?expected.toString():expected;assert.deepEqual(fake.readFileSync(file,encoding),want);assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want)}
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller');let calls=0;assert.throws(()=>fake.readFile(new URL('hani-main.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-main.js'],pin=row.beforeSha256;try{row.beforeSha256='0'.repeat(64);await new Promise(resolve=>fake.readFile(new URL('hani-main.js',root),(e,b)=>{assert.match(e.message,/exact pre309 output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(new URL('hani-main.js',root)),/exact pre309 output/)}finally{row.beforeSha256=pin}
});

test('every existing test/fixture and complete runtime/protected tree retains actual HEAD Git bytes',async()=>{
 const scripts=repository.tree(repository.commit(layer.head).tree).find(r=>r.name==='scripts');
 for(const row of repository.tree(scripts.sha).filter(r=>r.name.endsWith('.test.mjs')))assert.deepEqual(raw('scripts/'+row.name),repository.object(row.sha).data,row.name+' original assertions/imports');
 function walk(tree,prefix){for(const row of repository.tree(tree)){const file=prefix+row.name;if(row.mode==='40000')walk(row.sha,file+'/');else assert.deepEqual(raw(file),repository.object(row.sha).data,file+' unchanged')}}
 walk(repository.tree(scripts.sha).find(r=>r.name==='fixtures').sha,'scripts/fixtures/');
 for(const prefix of ['.github','dev-center','supabase'])walk(repository.tree(repository.commit(layer.head).tree).find(r=>r.name===prefix).sha,prefix+'/');
 for(const file of ['AGENTS.md','.gitignore','scripts/hani-context-remote.test.mjs','scripts/hani-runtime-closure.mjs','scripts/hani-release-package.mjs','scripts/hani-release-preqa.mjs','scripts/hani-ci-scope.mjs','scripts/hani-board-library-build.mjs'])assert.deepEqual(raw(file),gitBytes(layer.head,file));
 for(const row of repository.tree(scripts.sha).filter(r=>r.name.startsWith('hani-one-pass-')&&r.name.endsWith('.mjs')))assert.deepEqual(raw('scripts/'+row.name),repository.object(row.sha).data);
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});assert.equal(closure.files.length,layer.closureCount);assert.deepEqual(closure.missing,[]);for(const file of closure.files)assert.deepEqual(raw(file),gitBytes(layer.release,file),file+' actual released309');
});

test('real capture chain is309 -> view ->308 ->v2data ->Phase2 ->Phase1 ->307',async()=>{
 const view=require('./hani-ai-budget-view-source.cjs'),r308=require('./hani-release-308-source.cjs'),v2=require('./hani-building-v2data-source.cjs'),p2=require('./hani-building-phase2-source.cjs'),p1=require('./hani-building-phase1-source.cjs');
 require('./hani-building-phase1-preload.cjs');const r307=require('./hani-release-307-source.cjs');
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});
 for(const file of closure.files){let bytes=raw(file);for(const [adapter,next]of [[view,release],[r308,view],[v2,r308],[p2,v2],[p1,p2],[r307,p1]]){bytes=next.project(bytes,file);assert.equal(hash(adapter.readRawFileSync(new URL(file,root))),hash(bytes),file+' '+adapter.layer.layer+' capture')}
  assert.deepEqual(bytes,gitBytes(r308.layer.base,file),file+' independent307 boundary');
 }
});
