import release from './hani-release-310-source.cjs';
import reviewed from './hani-release-310-reviewed-input.cjs';
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
const attendance=JSON.parse(raw('scripts/fixtures/attendance-layer.json'));
function gitBytes(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}return repository.object(tree).data}

test('310 exact version/history/bootstrap inverse replays independent released and attendance Git bytes',()=>{
 assert.equal(layer.release,'71a46417a7985c32e3ecf7ead2ac71ae846f007b');assert.equal(layer.base,'644a6b4e8c4ae3dc88232c33fbf8869e81af349b');
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html','scripts/hani-attendance-source.cjs']);
 for(const [file,row]of Object.entries(layer.files)){
  const after=raw(file),before=restore(after,file),ref=file.startsWith('scripts/')?layer.head:file.startsWith('assets/')?layer.base:attendance.head;
  assert.deepEqual(before,gitBytes(ref,file));assert.equal(restore(after.toString(),file),before.toString());assert.deepEqual(project(after,file),before);
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length)}assert.equal(forward,after.toString());
  if(!file.startsWith('scripts/'))assert.deepEqual(after,gitBytes(layer.release,file));
 }
 for(const [file,count]of [['index.html',60],['hani-main.js',1]]){const after=raw(file).toString();assert.equal(after.split(layer.to).length-1,count);assert.equal(after.replaceAll(layer.to,layer.from),restore(after,file));assert.equal(hash(restore(after,file)),attendance.files[file].afterSha256)}
 assert.equal(raw(layer.bootstrap.file).toString(),layer.bootstrap.line+gitBytes(layer.head,layer.bootstrap.file).toString());
});

test('310 history adds only310 and fills only the309 commit and subject',()=>{
 const file='assets/data/hani-history-releases-v1.json',after=JSON.parse(raw(file)),before=JSON.parse(restore(raw(file),file));
 assert.equal(after.entries[0].id,'v2.9.310');assert.equal(after.entries[0].title,'주간 출석 도장판');assert.equal(after.entries[0].date,'2026-11-22');
 assert.deepEqual(after.entries[1].source,{commit:'c367660a969163ea05c1176ffb8b1d4b96242543',subject:'release: v2.9.309 AI 예산 화면 · 4컷 문구 정리 (#539)'});
 assert.deepEqual({...after.entries[1],source:null},{...before.entries[0],source:null});assert.deepEqual(after.entries.slice(2),before.entries.slice(1));assert.deepEqual({...after,entries:[]},{...before,entries:[]});
});

test('310 complete owner and exact remote gate rejects runtime, metadata, fixture, test and outer registration drift',()=>{
 const query=['merge-base','HEAD','origin/main'];assert.equal(reviewed.actualReadOnly(query),actualMergeBase);assert.equal(reviewed.readOnly(query),layer.base);
 const drift=[...Object.keys(layer.files),...Object.keys(attendance.prelanded),'assets/heroes/asset-218.webp','hani-office-live.js','scripts/hani-attendance-layer.test.mjs','scripts/hani-attendance-reviewed-input.cjs','scripts/hani-release-309-source.cjs','scripts/fixtures/attendance-layer.json','scripts/hani-context-remote.test.mjs','AGENTS.md','dev-center/codemap.json',layer.helper.file,...release.outerFiles];
 for(const file of new Set(drift)){
  const target=fileURLToPath(new URL(file,root)),source=raw(file);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1)])assert.equal(reviewed.selectBase(layer.release,f=>f===target?bad:read(f)),layer.release,file+' complete byte drift');
 }
 const helperTarget=fileURLToPath(new URL(layer.helper.file,root)),helper=raw(layer.helper.file);
 for(const bad of [release.projectHelper(helper),Buffer.concat([helper,Buffer.from(release.outerBlock())])])assert.equal(reviewed.selectBase(layer.release,f=>f===helperTarget?bad:read(f)),layer.release,'missing/duplicate outer registration');
 for(const base of [layer.base,'0'.repeat(40)])assert.equal(reviewed.selectBase(base,()=>assert.fail('unrelated base reads')),base);
 assert.equal(reviewed.selectBase(layer.release,()=>assert.fail('moved remote reads'),'0'.repeat(40)),layer.release);
 assert.throws(()=>reviewed.selectBase(layer.release,()=>{throw Error('read failure')}),/read failure/);
 for(const args of [['rev-parse','HEAD'],['show',layer.release+':hani-main.js'],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.release]])assert.equal(reviewed.readOnly(args),reviewed.actualReadOnly(args));
 assert.equal(reviewed.readOnly(['rev-parse','origin/main']),layer.base);assert.equal(reviewed.actualReference('origin/main'),actualOrigin);assert.equal(repository.reference('origin/main'),actualOrigin,'import alone never installs historical refs');
 assert.throws(()=>reviewed.readOnly(['merge-base','origin/main','HEAD']));
});

test('310 inverse fails closed for stale input, EOL, duplicate bytes, invalid count/span and frozen fixture tampering',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString();for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){assert.notEqual(source,bad);assert.throws(()=>restore(bad,file));assert.strictEqual(project(bad,file),bad)}
  const pin=row.beforeSha256,count=row.count,start=row.replacements[0].start;
  try{row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(source,file),/exact pre310 output/);row.beforeSha256=pin;row.count++;assert.throws(()=>restore(source,file),/edit count/);row.count=count;row.replacements[0].start=-1;assert.throws(()=>restore(source,file),/edit bounds/)}finally{row.beforeSha256=pin;row.count=count;row.replacements[0].start=start}
 }
 for(const name of ['unknown','__proto__','constructor','hani-attendance-core.js']){const source=Buffer.from('unrelated');assert.strictEqual(project(source,name),source);assert.throws(()=>restore(source,name),/known release-310 owner/)}
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-310-source.cjs').toString(),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/release-310-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen release-310 fixture/);
});

test('310 preload preserves sync/callback/promise URL/string Buffer/text/fd and error contracts',async()=>{
 const names=[...Object.keys(layer.files),'hani-attendance-core.js',layer.helper.file],originals=new Map(names.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString():bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false,installed=false;
 vm.runInNewContext(raw('scripts/hani-release-310-preload.cjs').toString(),{__dirname:dirname,URL,process:{argv:['node',path.join(dirname,'hani-release-310.test.mjs')]},require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-release-310-source.cjs'?release:n==='./hani-release-310-reviewed-input.cjs'?{installHistoricalInputs(){installed=true}}:assert.fail(n)});
 assert.ok(synced&&installed);
 for(const name of names)for(const file of [new URL(name,root),fileURLToPath(new URL(name,root))])for(const encoding of [undefined,'utf8']){const expected=project(raw(name),name),want=encoding?expected.toString():expected;assert.deepEqual(fake.readFileSync(file,encoding),want);assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want)}
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller');let calls=0;assert.throws(()=>fake.readFile(new URL('hani-main.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-main.js'],pin=row.beforeSha256;try{row.beforeSha256='0'.repeat(64);await new Promise(resolve=>fake.readFile(new URL('hani-main.js',root),(e,b)=>{assert.match(e.message,/exact pre310 output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(new URL('hani-main.js',root)),/exact pre310 output/)}finally{row.beforeSha256=pin}
});

test('all original assertions, fixtures, runtime and protected files retain independent HEAD bytes; outer pins are exact',async()=>{
 const top=repository.tree(repository.commit(layer.head).tree),scripts=repository.tree(top.find(r=>r.name==='scripts').sha);
 for(const row of scripts.filter(r=>r.name.endsWith('.test.mjs')))assert.deepEqual(raw('scripts/'+row.name),repository.object(row.sha).data,row.name+' unchanged');
 function walk(tree,prefix){for(const row of repository.tree(tree)){const file=prefix+row.name;if(row.mode==='40000')walk(row.sha,file+'/');else assert.deepEqual(raw(file),repository.object(row.sha).data,file+' preserved')}}
 walk(scripts.find(r=>r.name==='fixtures').sha,'scripts/fixtures/');for(const name of ['.github','dev-center','supabase'])walk(top.find(r=>r.name===name).sha,name+'/');
 for(const file of ['AGENTS.md','.gitignore','scripts/hani-context-remote.test.mjs','scripts/hani-runtime-closure.mjs','scripts/hani-release-package.mjs','scripts/hani-release-preqa.mjs','scripts/hani-ci-scope.mjs','scripts/hani-board-library-build.mjs'])assert.deepEqual(raw(file),gitBytes(layer.head,file));
 for(const row of scripts.filter(r=>r.name.startsWith('hani-one-pass-')&&r.name.endsWith('.mjs')))assert.deepEqual(raw('scripts/'+row.name),repository.object(row.sha).data);
 const helper=raw(layer.helper.file),before=release.projectHelper(helper);assert.notDeepEqual(helper,before);assert.deepEqual(before,gitBytes(layer.head,layer.helper.file));
 const helperText=helper.toString();assert.equal(helperText.split(release.outerBlock()).length,2);for(const file of release.outerFiles)assert.ok(helperText.includes("['"+file+"','"+hash(raw(file))+"']"),file+' registered');
 for(const bad of [Buffer.concat([helper,Buffer.from('\n')]),Buffer.from(helperText.replace('tooling310 outer boundaries','altered boundary'))])assert.strictEqual(release.projectHelper(bad),bad);
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:raw});assert.equal(closure.files.length,177);assert.deepEqual(closure.missing,[]);for(const file of closure.files)assert.deepEqual(raw(file),gitBytes(layer.release,file),file+' released310 runtime');
});

test('real capture chain is310 -> attendance ->309 -> budget view ->308 with independent runtime bytes and actual refs',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:raw});
 require('./hani-attendance-preload.cjs');const att=require('./hani-attendance-source.cjs'),r309=require('./hani-release-309-source.cjs'),view=require('./hani-ai-budget-view-source.cjs'),r308=require('./hani-release-308-source.cjs');
 for(const file of closure.files){let bytes=raw(file);for(const [adapter,next]of [[att,release],[r309,att],[view,r309],[r308,view]]){bytes=next.project(bytes,file);assert.equal(hash(adapter.readRawFileSync(new URL(file,root))),hash(bytes),file+' '+adapter.layer.layer+' capture')}
  if(!Object.hasOwn(attendance.prelanded,file))assert.deepEqual(bytes,gitBytes(r309.layer.base,file),file+' independent308 boundary');
 }
 assert.equal(reviewed.actualReference('origin/main'),actualOrigin);assert.equal(reviewed.actualReference('HEAD'),actualHead,'installation preserves the actual HEAD, including a later tooling commit');
});

test('post310 data accepts only the independently pinned complete commit and rejects mixed bytes, extra files and mode drift',()=>{
 assert.equal(reviewed.acceptsRemote(layer.release),true);
 const evidence={commit:repository.commit,tree:repository.tree,object:repository.object,changedFiles:repository.changedFiles};
 for(const [remote,record]of Object.entries(layer.dataCommits)){
  assert.equal(remote,'9ef1e2425ae85472a1d24f983f823d50215edd02');
  assert.deepEqual(Object.keys(record.files).sort(),['data/board-library/part-a.json','data/board-library/part-b.json']);
  assert.equal(reviewed.verifyDataCommit(remote),true);assert.equal(reviewed.selectBase(layer.release,read,remote),layer.base);
  for(const [file,row]of Object.entries(record.files)){
   assert.equal(hash(gitBytes(layer.release,file)),row.beforeSha256);assert.equal(hash(gitBytes(remote,file)),row.afterSha256);assert.notEqual(row.beforeSha256,row.afterSha256);
   assert.equal(layer.owners[file],row.beforeSha256);
  }
  const files=Object.keys(record.files),targets=new Map(files.map(file=>[fileURLToPath(new URL(file,root)),file]));
  assert.ok(['beforeSha256','afterSha256'].some(key=>files.every(file=>hash(raw(file))===record.files[file][key])),'working data retains one complete independently pinned cohort');
  for(const ref of [layer.release,remote])assert.equal(reviewed.selectBase(layer.release,f=>targets.has(f)?gitBytes(ref,targets.get(f)):read(f),remote),layer.base,'complete known data cohort');
  assert.equal(reviewed.selectBase(layer.release,f=>targets.has(f)?gitBytes(targets.get(f)===files[0]?remote:layer.release,targets.get(f)):read(f),remote),layer.release,'mixed data commits cannot authorize history');
  for(const file of files)assert.equal(reviewed.selectBase(layer.release,f=>targets.has(f)?Buffer.concat([gitBytes(layer.release,targets.get(f)),Buffer.from(targets.get(f)===file?'\n':'')]):read(f),remote),layer.release,'unrecognized local data bytes');
  assert.equal(reviewed.verifyDataCommit(remote,{...evidence,commit:ref=>ref===remote?{...evidence.commit(ref),parents:['0'.repeat(40)]}:evidence.commit(ref)}),false);
  for(const files of [[],[...Object.keys(record.files),'hani-main.js'],Object.keys(record.files).slice(1)])assert.equal(reviewed.verifyDataCommit(remote,{...evidence,changedFiles:()=>files}),false);
  assert.equal(reviewed.verifyDataCommit(remote,{...evidence,object:sha=>{const blob=evidence.object(sha);return blob.type===3?{...blob,data:Buffer.concat([blob.data,Buffer.from('\n')])}:blob}}),false);
  assert.equal(reviewed.verifyDataCommit(remote,{...evidence,tree:sha=>evidence.tree(sha).map(row=>row.name==='part-a.json'?{...row,mode:'100755'}:row)}),false);
  assert.throws(()=>reviewed.verifyDataCommit(remote,{...evidence,commit:()=>{throw Error('Git read failure')}}),/Git read failure/);
 }
 assert.equal(reviewed.acceptsRemote('0'.repeat(40),new Proxy({},{get(){assert.fail('unknown remote reads')}})),false);
});

test('frozen310 prefix survives forward first-parent refs without importing their runtime bytes or hiding actual Git evidence',()=>{
 for(const ref of [actualOrigin,actualMergeBase,'92cdcecf24106331eeb6c110b8e23981e25b8038']){
  assert.equal(reviewed.acceptsRemote(ref),true);assert.equal(reviewed.selectBase(ref,read,actualOrigin),layer.base);
 }
 assert.equal(reviewed.actualReference('origin/main'),actualOrigin);assert.equal(reviewed.actualReference('HEAD'),actualHead);
 for(const args of [['show',actualOrigin+':hani-main.js'],['log','--first-parent','--format=%H%x09%s','origin/main']])assert.equal(reviewed.readOnly(args),reviewed.actualReadOnly(args));
 const evidence={commit:repository.commit};
 assert.equal(reviewed.acceptsRemote(layer.base,evidence),false,'older unrelated prefix');
 const ref='1'.repeat(40);
 assert.equal(reviewed.acceptsRemote(ref,{commit:()=>({parents:[]})}),false);
 assert.equal(reviewed.acceptsRemote(ref,{commit:()=>({parents:[ref]})}),false,'cyclic evidence fails closed');
 assert.throws(()=>reviewed.acceptsRemote(ref,{commit:()=>{throw Error('ancestry read failure')}}),/ancestry read failure/);
 const simulated={exports:{}},unrelated='0'.repeat(40),protocol={...repository,reference:name=>name==='origin/main'?unrelated:reviewed.actualReference(name),readOnly:args=>args.join(' ')==='merge-base HEAD origin/main'?layer.base:args.join(' ')==='rev-parse origin/main'?unrelated:reviewed.actualReadOnly(args)};
 vm.runInNewContext(raw('scripts/hani-release-310-reviewed-input.cjs').toString(),{module:simulated,__dirname:dirname,require:name=>name==='./hani-test-repository-evidence.cjs'?protocol:name==='./hani-release-310-source.cjs'?release:name==='node:path'?path:name==='node:fs'?fs:assert.fail(name)});
 assert.equal(simulated.exports.reference('origin/main'),unrelated,'a passthrough base value never bypasses owner and ancestry authorization');
 assert.equal(simulated.exports.readOnly(['rev-parse','origin/main']),unrelated);
 for(const file of ['hani-main.js','index.html','scripts/hani-attendance-source.cjs']){
  const target=fileURLToPath(new URL(file,root)),bad=Buffer.concat([raw(file),Buffer.from('\n')]);
  assert.equal(reviewed.selectBase(actualOrigin,f=>f===target?bad:read(f),actualOrigin),actualOrigin,'new refs never authorize unpinned runtime');
 }
});
