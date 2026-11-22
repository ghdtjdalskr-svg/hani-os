import release from './hani-release-308-source.cjs';
import v2 from './hani-building-v2data-source.cjs';
import phase2 from './hani-building-phase2-source.cjs';
import phase1 from './hani-building-phase1-source.cjs';
import release307 from './hani-release-307-source.cjs';
import history from './hani-release-308-reviewed-input.cjs';
import repository from './hani-test-repository-evidence.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {layer,hash,restore,project,restoreEol,readRawFileSync:read}=release;
const root=new URL('../',import.meta.url),diskRoot=fileURLToPath(root),dirname=fileURLToPath(new URL('.',import.meta.url)),raw=f=>read(new URL(f,root));
function gitBytes(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}return repository.object(tree).data}

test('308 exact metadata inverse and both bootstrap connections reconstruct independent307 bytes',()=>{
 assert.equal(layer.release,'ee6e617c1b3fb88ba85ee8f19df776613c559d6f');assert.equal(layer.base,release307.layer.release);
 assert.deepEqual(repository.changedFiles(layer.release),['assets/data/hani-history-releases-v1.json','hani-main.js','hani-office-live.css','hani-office-live.js','index.html']);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html','scripts/hani-building-v2data-source.cjs','scripts/hani-ieum-seat.test.mjs','scripts/hani-release-307-source.cjs']);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  if(!file.startsWith('scripts/')){assert.deepEqual(source,gitBytes(layer.release,file));assert.deepEqual(before,gitBytes(layer.base,file))}
  else assert.deepEqual(before,gitBytes(file==='scripts/hani-release-307-source.cjs'?repository.reference('HEAD'):file==='scripts/hani-ieum-seat.test.mjs'?layer.base:repository.reference('HEAD'),file));
  assert.equal(restore(source.toString(),file),before.toString());assert.deepEqual(project(source,file),before);
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length)}assert.equal(forward,source.toString());
 }
 for(const [file,count]of [['index.html',60],['hani-main.js',1]]){assert.equal(raw(file).toString().split(layer.to).length-1,count);assert.equal(raw(file).toString().replaceAll(layer.to,layer.from),restore(raw(file),file).toString())}
});

test('308 history adds only308 and fills the307 commit and subject',()=>{
 const file='assets/data/hani-history-releases-v1.json',after=JSON.parse(raw(file)),before=JSON.parse(restore(raw(file),file));
 assert.deepEqual(after.entries[0],{id:'v2.9.308',date:'2026-11-21',status:'released',title:'사무실 움직임 · 새 5층 오픈',category:'하니 그룹 · 대공사',credits:[],source:{commit:'',subject:'release: v2.9.308 사무실 움직임 · 새 5층 오픈'}});
 assert.deepEqual(after.entries[1].source,{commit:layer.base,subject:'release: v2.9.307 메뉴 NEW 배지 · 봤으면 꺼지기 (#535)'});
 assert.deepEqual({...after.entries[1],source:null},{...before.entries[0],source:null});assert.deepEqual(after.entries.slice(2),before.entries.slice(1));assert.deepEqual({...after,entries:[]},{...before,entries:[]});
});

test('308 gate checks complete owners, actual refs, drift and unrelated ancestry',()=>{
 const query=['merge-base','HEAD','origin/main'];assert.equal(history.rawReadOnly(query),layer.release);assert.equal(history.readOnly(query),layer.base);
 for(const ref of ['HEAD','origin/main']){const args=['rev-parse',ref];assert.equal(history.readOnly(args),repository.reference(ref));assert.equal(history.rawReadOnly(args),repository.reference(ref))}
 for(const file of [...Object.keys(layer.files),...Object.keys(layer.boundaries),'hani-office-live.js','hani-office-live.css','data/hani-building/spatial-contract.json','data/hani-building/art-map-v1.json','scripts/hani-lounge-queen-v3.test.mjs']){
  const target=path.join(diskRoot,file),source=raw(file);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1)])assert.equal(history.selectBase(layer.release,f=>f===target?bad:read(f)),layer.release,file+' drift cannot authorize historical input');
 }
 for(const base of [layer.base,'0'.repeat(40)])assert.equal(history.selectBase(base,()=>assert.fail('unrelated base reads owners')),base);
 assert.throws(()=>history.selectBase(layer.release,()=>{throw Error('read failure')}),/read failure/);
 for(const args of [['show',layer.release+':hani-main.js'],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.release]])assert.equal(history.readOnly(args),history.rawReadOnly(args));
 assert.throws(()=>history.readOnly(['merge-base','origin/main','HEAD']));
});

test('308 ->v2data ->Phase2 ->Phase1/motion ->307 preserves every runtime capture and independent Git boundary',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});assert.equal(closure.files.length,174);assert.equal(layer.closureCount,174);assert.deepEqual(closure.missing,[]);
 for(const file of closure.files){
  const source=raw(file),pre308=project(source,file),preV2=v2.project(pre308,file),preP2=phase2.project(preV2,file),preP1=phase1.project(preP2,file);
  assert.deepEqual(source,gitBytes(layer.release,file),file+' raw released308');assert.deepEqual(preP1,gitBytes(layer.base,file),file+' exact307 after building inverses');
  for(const [adapter,expected]of [[v2,pre308],[phase2,preV2],[phase1,preP2],[release307,preP1]])assert.deepEqual(adapter.readRawFileSync(new URL(file,root)),expected,file+' capture ordering');
 }
});

test('308 rejects drift, old input, duplicate, wrong EOL, unknown owners and invalid spans',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString();for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){assert.notEqual(source,bad);assert.throws(()=>restore(bad,file));assert.strictEqual(project(bad,file),bad)}
  const pin=row.beforeSha256,count=row.count,start=row.replacements[0].start;
  try{row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(raw(file),file),/exact pre308 output/);row.beforeSha256=pin;row.count++;assert.throws(()=>restore(raw(file),file),/complete release-308 edit count/);row.count=count;row.replacements[0].start=-1;assert.throws(()=>restore(raw(file),file),/ordered release-308 edit bounds/)}finally{row.beforeSha256=pin;row.count=count;row.replacements[0].start=start}
 }
 for(const file of ['unknown','__proto__','constructor','hani-office-live.js']){const bytes=Buffer.from('unrelated');assert.strictEqual(project(bytes,file),bytes);assert.throws(()=>restore(bytes,file),/known release-308 owner/)}
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-308-source.cjs').toString(),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/release-308-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen release-308 fixture/);
});

test('203b inverse changes exactly the retained renderer header LF to CRLF and leaves every other byte intact',()=>{
 const source=raw('hani-main.js').toString(),before=restoreEol(source);
 assert.notEqual(before,source);assert.equal(before.replace('function renderNavNewBadges(now=Date.now()){\r\n','function renderNavNewBadges(now=Date.now()){\n'),source);
 assert.equal(hash(before),layer.eol.beforeSha256);assert.equal(Buffer.byteLength(before),Buffer.byteLength(source)+1);assert.deepEqual(restoreEol(Buffer.from(source)),Buffer.from(before));
 for(const bad of [source+'\n',source.slice(1),source+source,before])assert.strictEqual(restoreEol(bad),bad);
});

test('308 preload keeps sync callback promise URL Buffer fd, errors and callback exceptions',async()=>{
 const files=[...Object.keys(layer.files),'hani-office-live.js'],originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString():bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false,eolInstalled=false;const protocol={};
 vm.runInNewContext(raw('scripts/hani-release-308-preload.cjs').toString(),{__dirname:dirname,URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-release-308-source.cjs'?release:n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-308-reviewed-input.cjs'?{...history,installEolBaseline(){eolInstalled=true}}:assert.fail(n)});
 assert.ok(synced&&eolInstalled);assert.equal(protocol.readOnly,history.readOnly);
 for(const name of files)for(const file of [new URL(name,root),fileURLToPath(new URL(name,root))])for(const encoding of [undefined,'utf8']){
  const expected=project(raw(name),name),want=encoding?expected.toString():expected;assert.deepEqual(fake.readFileSync(file,encoding),want);assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));assert.deepEqual(await fake.promises.readFile(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller error');let calls=0;assert.throws(()=>fake.readFile(new URL('hani-main.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-main.js'],pin=row.beforeSha256;try{row.beforeSha256='0'.repeat(64);await new Promise(resolve=>fake.readFile(new URL('hani-main.js',root),(e,b)=>{assert.match(e.message,/exact pre308 output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(new URL('hani-main.js',root)),/exact pre308 output/)}finally{row.beforeSha256=pin}
});

test('all existing tests except the authorized Phase1 ledger and all runtime/protected files preserve Git bytes',()=>{
 const head=repository.reference('HEAD'),scripts=repository.tree(repository.commit(head).tree).find(r=>r.name==='scripts');
 for(const row of repository.tree(scripts.sha).filter(r=>r.name.endsWith('.test.mjs')&&r.name!=='hani-building-phase1.test.mjs'))assert.deepEqual(raw('scripts/'+row.name),repository.object(row.sha).data,row.name+' original assertion body');
 for(const file of ['AGENTS.md','scripts/hani-context-remote.test.mjs','scripts/hani-runtime-closure.mjs','scripts/hani-release-package.mjs','scripts/hani-release-preqa.mjs','scripts/hani-ci-scope.mjs','scripts/hani-board-library-build.mjs'])assert.deepEqual(raw(file),gitBytes(head,file),file+' preserved');
 for(const [file,pin]of Object.entries(layer.boundaries))assert.equal(hash(raw(file)),pin);
 const fixtures=repository.tree(scripts.sha).find(r=>r.name==='fixtures');
 function walk(tree,prefix){for(const row of repository.tree(tree)){const file=prefix+row.name;if(row.mode==='40000')walk(row.sha,file+'/');else if(file!=='scripts/fixtures/building-phase1-layer.json')assert.deepEqual(raw(file),repository.object(row.sha).data,file+' original fixture/hash')}}walk(fixtures.sha,'scripts/fixtures/');
 const file='scripts/fixtures/building-phase1-layer.json',before=JSON.parse(gitBytes(head,file)),after=JSON.parse(raw(file)),owner='scripts/hani-release-305-source.cjs';
 const changed=after.stages[0].files[owner];assert.equal(changed.beforeSha256,hash(gitBytes(layer.base,owner)));assert.equal(changed.afterSha256,hash(gitBytes(head,owner)));
 after.stages[0].files[owner]=before.stages[0].files[owner];assert.deepEqual(after,before,'only the authorized bootstrap boundary ledger changes');
});
