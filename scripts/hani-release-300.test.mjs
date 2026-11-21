import './hani-ui-polish-1-preload.cjs'; // Exact UI Polish 1 inverse before historical readers.
import test from 'node:test';
import assert from 'node:assert/strict';
import release300 from './hani-release-300-source.cjs';
import audit from './hani-audit-1-source.cjs';
import release299 from './hani-release-299-source.cjs';
import layers from './hani-release-version-layers.cjs';
import repository from './hani-test-repository-evidence.cjs';
import reviewed from './hani-release-300-reviewed-input.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const {layer,hash,readRawFileSync:read}=release300,root=new URL('../',import.meta.url),raw=f=>read(new URL(f,root),'utf8');
const base='2220b6129c63721906a3788ee9a7681f197c4523',release='9f49286882e2efacd128e2920cc12f38d473a8e9';
const peel=(s,f)=>audit.project(release300.project(s,f),f);
const objectBytes=(ref,file)=>{let sha=repository.commit(ref).tree;for(const name of file.split('/'))sha=repository.tree(sha).find(row=>row.name===name).sha;return repository.object(sha).data;};

test('300 metadata is an independent exact outer layer before unchanged audit-1 and299',()=>{
 assert.equal(layer.release,repository.commit(release).sha);assert.equal(layer.base,base);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 assert.equal(layer.files['index.html'].count,60);assert.equal(layer.files['hani-main.js'].count,1);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),atAudit=release300.restore(source,file);assert.equal(source,repository.read(release,file));
  assert.equal(hash(source),row.after);assert.equal(hash(atAudit),audit.delta.files[file].afterSha256);
  assert.deepEqual(release300.restore(Buffer.from(source),file),Buffer.from(atAudit));
  assert.equal(audit.restore(atAudit,file),repository.read(base,file));
  assert.throws(()=>audit.restore(source,file),/exact audit-1 input/,'300 must precede audit-1');
  assert.equal(release299.readRawFileSync(new URL(file,root),'utf8'),repository.read(base,file),'legacy raw boundary');
  const forward=row.replacements?row.replacements.reduce((s,e)=>s.replace(e.before,()=>e.after),atAudit):atAudit.replaceAll(layer.from,layer.to);
  assert.equal(forward,source,'complete forward round trip');
 }
 assert.equal(layers.layers[0].to,'2.9.299','frozen lower manifest is unchanged');
});

test('300 history owns only the new title and complete299 release provenance',()=>{
 const file='assets/data/hani-history-releases-v1.json',current=JSON.parse(raw(file)),before=JSON.parse(release300.restore(raw(file),file));
 assert.equal(current.entries[0].id,'v2.9.300');assert.equal(current.entries[0].title,'점검 반영 1차');
 assert.deepEqual(current.entries[0].source,{commit:'',subject:'release: v2.9.300 점검 반영 1차'});
 assert.equal(current.entries[1].id,'v2.9.299');
 assert.deepEqual(current.entries[1].source,{commit:'1881888a2ca970ab86adda9b193a90256027be1c',subject:'release: v2.9.299 디자인 다듬기 2차 (#515)'});
 assert.deepEqual(before.entries[0].source,{commit:'',subject:'release: v2.9.299 디자인 다듬기 2차'});
 assert.deepEqual(current.entries.slice(2),before.entries.slice(1));assert.deepEqual({...current,entries:[]},{...before,entries:[]});
 assert.equal(before.entries.find(e=>e.id==='v2.9.292').title,'직원 말풍선 가끔 안 뜨던 문제 수정','audit-1 still owns its title edit');
});

test('300 inverse rejects byte, token, EOL, duplicate, unknown and repeated input drift',()=>{
 for(const file of Object.keys(layer.files)){
  const source=raw(file),before=release300.restore(source,file);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'),source.replace('2.9.300','2.9.299')]){
   assert.throws(()=>release300.restore(bad,file),/exact release-300 input/);assert.equal(release300.project(bad,file),bad);
  }
 }
 assert.equal(release300.project('unknown','unknown'),'unknown');assert.throws(()=>release300.restore('unknown','unknown'),/known release300 owner/);
});

test('300 malformed count, metadata uniqueness and output pin fail closed',()=>{
 const row=layer.files['index.html'],count=row.count,before=row.before;
 try{row.count++;assert.throws(()=>release300.restore(raw('index.html'),'index.html'),/complete version token count/);row.count=count;row.before='0'.repeat(64);assert.throws(()=>release300.restore(raw('index.html'),'index.html'),/exact audit-1 output/);}finally{row.count=count;row.before=before;}
 const file='assets/data/hani-history-releases-v1.json',meta=layer.files[file],edit=meta.replacements[0],after=edit.after;
 try{meta.count++;assert.throws(()=>release300.restore(raw(file),file),/complete release metadata edit count/);meta.count--;edit.after='missing';assert.throws(()=>release300.restore(raw(file),file),/unique complete release metadata/);edit.after='';assert.throws(()=>release300.restore(raw(file),file),/nonempty exact metadata edit/);}finally{meta.count=1;edit.after=after;}
});

test('raw released300 closure and every older release boundary retain exact assets',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>read(new URL(f,root))});
 assert.equal(closure.files.length,174);assert.deepEqual(closure.missing,[]);
 for(const file of closure.files){assert.deepEqual(read(new URL(file,root)),objectBytes(release,file),'raw deployed300 '+file);if(file!=='hani-book-share-parse.js')assert.deepEqual(peel(read(new URL(file,root)),file),objectBytes(base,file),'exact main299 '+file);}
 const counts=[];
 for(const version of ['2.9.299','2.9.298','2.9.297','2.9.296','2.9.295','2.9.294','2.9.293','2.9.289']){
  const c=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>layers.projectReleaseSource(peel(read(new URL(f,root)),f),f,version)});counts.push(c.files.length);assert.deepEqual(c.missing,[]);
 }
 assert.deepEqual(counts,[173,173,173,172,172,171,168,164]);
});

test('existing tests, fixtures, lower dispatcher and board-library-build are byte preserved',()=>{
 const treeFiles=(sha,prefix='')=>repository.tree(sha).flatMap(row=>row.mode==='40000'?treeFiles(row.sha,prefix+row.name+'/'):[{file:prefix+row.name,sha:row.sha}]);
 for(const row of treeFiles(repository.commit(base).tree).filter(r=>r.file.startsWith('scripts/fixtures/')||/^scripts\/.*\.test\.(?:mjs|cjs|js)$/.test(r.file)||['scripts/hani-release-version-layers.cjs','scripts/hani-board-library-build.mjs'].includes(r.file)))assert.deepEqual(read(new URL(row.file,root)),repository.object(row.sha).data,row.file);
 for(const f of ['scripts/fixtures/audit-1-delta.json','scripts/hani-audit-1.test.mjs','scripts/hani-audit-1-preload.cjs','scripts/hani-audit-1-direct-input.mjs'])assert.equal(raw(f),repository.read('1af6992',f),'exact imported audit-1 '+f);
});

test('historical oracle selects fixed main299 only for exact deployed300 owners',()=>{
 assert.equal(reviewed.selectBase(release),base);
 assert.equal(reviewed.readOnly(['merge-base','HEAD','origin/main']),base);
 assert.equal(reviewed.selectBase(base),base);
 assert.equal(reviewed.selectBase(release,f=>Buffer.concat([read(f),Buffer.from('\n')])),release,'unknown input cannot choose the older prefix');
 assert.equal(reviewed.readOnly(['show',release+':hani-main.js']),repository.read(release,'hani-main.js'),'Git object reads remain independent');
});

test('direct shared-tool adapter runs only for the two named legacy test entries',()=>{
 const source=raw('scripts/hani-audit-1-direct-input.mjs').replace(/^import .*;\r?\n/gm,'').replace('import.meta.url',"'file:///synthetic.mjs'");
 for(const entry of ['hani-lounge-billboard.test.mjs','hani-history-unify.test.mjs','hani-board-library-build.mjs','hani-one-pass-release.mjs','hani-join-ieum.test.mjs','hani-release-300.test.mjs','']){
  const calls=[];vm.runInNewContext(source,{path,process:{argv:['node',entry]},createRequire:()=>name=>calls.push(name)});
  assert.deepEqual(calls,['hani-lounge-billboard.test.mjs','hani-history-unify.test.mjs'].includes(entry)?['./hani-audit-1-preload.cjs']:[],entry);
 }
});

test('protected gates stay byte exact with independent frozen Node/server resolver parity',()=>{
 const workflow=repository.read(release,'.github/workflows/hani-dev-center-self-protect.yml');
 const protectedBlock=workflow.match(/const protectedPaths = new Set\(\[([\s\S]*?)\]\);/);assert.ok(protectedBlock,'frozen protected path inventory');
 const protectedPaths=[...protectedBlock[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]);assert.ok(protectedPaths.length);
 for(const file of protectedPaths){
  const source=read(new URL(file,root));assert.deepEqual(source,objectBytes(release,file),'unchanged protected gate '+file);
  assert.strictEqual(release300.project(source,file),source,'300 does not project protected bytes');
  assert.deepEqual(fs.readFileSync(new URL(file,root)),source,'legacy reads preserve protected bytes');
 }
 const file='scripts/hani-runtime-closure.mjs',source=raw(file),before=repository.read(base,file);
 assert.equal(source,before,'resolver needs no tooling inverse');
 assert.equal(raw('supabase/functions/hani-deploy-bridge/runtime-closure.ts').replace(/\r\n/g,'\n').split('\n').slice(2).join('\n'),before);
});

test('300 isolated preload preserves sync callback promise string Buffer errors and raw bytes',async()=>{
 const files=['hani-main.js','scripts/hani-runtime-closure.mjs','scripts/hani-one-pass-rules.mjs'],error=new Error('read failed');
 const originals=new Map(files.map(file=>[fileURLToPath(new URL(file,root)),read(new URL(file,root))]));
 const disk=(file,encoding)=>{const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes,'known fake disk file');return encoding==='utf8'?bytes.toString('utf8'):bytes};
 const fake={readFileSync:disk,readFile(f,...args){const done=args.pop();f==='error'?done(error):done(null,disk(f,args[0]))},promises:{readFile:async(...args)=>disk(...args)}};let synced=false;
 vm.runInNewContext(raw('scripts/hani-release-300-preload.cjs'),{__dirname:fileURLToPath(new URL('.',import.meta.url)),URL,require:name=>name==='node:fs'?fake:name==='node:path'?path:name==='node:url'?{fileURLToPath}:name==='node:module'?{syncBuiltinESMExports(){synced=true}}:name==='./hani-release-300-source.cjs'?release300:assert.fail(name)});assert.ok(synced);
 for(const name of files){const url=new URL(name,root),source=originals.get(fileURLToPath(url)),expected=release300.project(source,name);
 for(const file of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){
  const want=encoding?expected.toString('utf8'):expected;assert.deepEqual(fake.readFileSync(file,encoding),want);
  assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
 }
 assert.deepEqual(read(url),source);}
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));
});
