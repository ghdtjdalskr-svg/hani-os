import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import release from './hani-release-302-source.cjs';
import history from './hani-release-302-reviewed-input.cjs';
import dark from './hani-dark-bundle-source.cjs';
import darkHistory from './hani-dark-bundle-reviewed-input.cjs';
import release301 from './hani-release-301-source.cjs';
import reviewed301 from './hani-release-301-reviewed-input.cjs';
import seat from './hani-ieum-seat-source.cjs';
import reviewedSeat from './hani-ieum-seat-reviewed-input.cjs';
import release300 from './hani-release-300-source.cjs';
import reviewed300 from './hani-release-300-reviewed-input.cjs';
import audit from './hani-audit-1-source.cjs';
import layers from './hani-release-version-layers.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {layer,hash,readRawFileSync:read}=release,root=new URL('../',import.meta.url),diskRoot=fileURLToPath(root),raw=f=>read(new URL(f,root));

test('302 metadata independently inverts actual release to frozen main301 before the dark-bundle capture',()=>{
 assert.equal(layer.release,'d748920f90dd200dddec2befd262fee0959047a0');
 assert.equal(layer.base,dark.delta.base);assert.equal(layer.feature,dark.delta.feature);
 assert.deepEqual(repository.commit(layer.release).parents,[layer.base]);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 assert.equal(layer.files['index.html'].count,60);assert.equal(layer.files['hani-main.js'].count,1);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=release.restore(source,file);
  assert.deepEqual(source,Buffer.from(repository.read(layer.release,file)),'actual released302 bytes');
  assert.deepEqual(before,Buffer.from(repository.read(layer.base,file)),'independent main301 metadata');
  assert.equal(before.toString('utf8'),repository.read(layer.feature,file));assert.equal(hash(before),row.before);
  assert.equal(row.before,release301.layer.files[file].after);
  assert.deepEqual(dark.readRawFileSync(new URL(file,root)),before,'302 precedes dark-bundle capture');
  assert.deepEqual(release301.readRawFileSync(new URL(file,root)),before,'301 sees exact301 metadata');
  assert.equal(release.restore(source.toString('utf8'),file),before.toString('utf8'));
  const forward=row.replacements?row.replacements.reduce((s,e)=>s.replace(e.before,()=>e.after),before.toString('utf8')):before.toString('utf8').replaceAll(layer.from,layer.to);
  assert.equal(forward,source.toString('utf8'));assert.throws(()=>release301.restore(source,file),/exact release-301 input/);
 }
 for(const [file,row]of Object.entries(dark.delta.files)){
  assert.equal(hash(raw(file)),row.afterSha256,'actual302 retains frozen dark feature bytes');
  assert.equal(raw(file).toString('utf8'),repository.read(layer.feature,file));
  assert.deepEqual(dark.readRawFileSync(new URL(file,root)),raw(file),'302 passes feature owner bytes through');
  assert.equal(release301.readRawFileSync(new URL(file,root),'utf8'),repository.read(layer.base,file),'dark inverse precedes301 capture');
 }
});

test('302 history owns only its new entry and the completed301 provenance',()=>{
 const file='assets/data/hani-history-releases-v1.json',after=JSON.parse(raw(file)),before=JSON.parse(release.restore(raw(file),file));
 assert.deepEqual(after.entries[0],{id:'v2.9.302',date:'2026-11-20',status:'released',title:'어두운 테마 다듬기',category:'화면·디자인',credits:[],source:{commit:'',subject:'release: v2.9.302 어두운 테마 다듬기'}});
 assert.equal(after.entries[1].id,'v2.9.301');
 assert.deepEqual(after.entries[1].source,{commit:release301.layer.release,subject:'release: v2.9.301 이음·유나 자리 교체 (#522)'});
 assert.deepEqual(before.entries[0].source,{commit:'',subject:'release: v2.9.301 이음·유나 자리 교체'});
 assert.deepEqual({...after.entries[1],source:null},{...before.entries[0],source:null});
 assert.deepEqual(after.entries.slice(2),before.entries.slice(1));assert.deepEqual({...after,entries:[]},{...before,entries:[]});
});

test('302 inverse rejects drift, EOL, duplicate, wrong version, repeated inverse and inherited owners',()=>{
 for(const file of Object.keys(layer.files)){
  const source=raw(file).toString('utf8'),before=release.restore(source,file);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'),source.replace('2.9.302','2.9.301')]){
   assert.notEqual(source,bad);assert.throws(()=>release.restore(bad,file),/exact release-302 input/);assert.strictEqual(release.project(bad,file),bad);
  }
 }
 for(const file of ['unknown','__proto__','constructor','hani-context-remote-v1.js','scripts/hani-runtime-closure.mjs']){
  const source=Buffer.from('unrelated');assert.strictEqual(release.project(source,file),source);assert.throws(()=>release.restore(source,file),/known release302 owner/);
 }
});

test('302 malformed metadata, counts and output pins fail closed',()=>{
 const file='index.html',row=layer.files[file],count=row.count,pin=row.before;
 try{row.count++;assert.throws(()=>release.restore(raw(file),file),/complete release302 version token count/);row.count=count;row.before='0'.repeat(64);assert.throws(()=>release.restore(raw(file),file),/exact main301 metadata output/);}finally{row.count=count;row.before=pin;}
 const f='assets/data/hani-history-releases-v1.json',meta=layer.files[f],metaCount=meta.count,edit=meta.replacements[0],after=edit.after;
 try{meta.count++;assert.throws(()=>release.restore(raw(f),f),/complete release302 metadata edit count/);meta.count=metaCount;edit.after='missing';assert.throws(()=>release.restore(raw(f),f),/unique complete release302 metadata/);edit.after='';assert.throws(()=>release.restore(raw(f),f),/nonempty exact release302 metadata/);}finally{meta.count=metaCount;edit.after=after;}
});

test('only exact302 metadata, all dark owners and seats may select the fixed dark history on main',()=>{
 const query=['merge-base','HEAD','origin/main'];
 assert.equal(history.rawReadOnly(query),layer.release,'actual Git merge-base on main stays independently accessible');
 assert.equal(history.readOnly(query),layer.base,'302 projects main302 to fixed main301 boundary');
 assert.equal(darkHistory.rawReadOnly(query),layer.base,'dark history receives post302 boundary');
 assert.equal(darkHistory.readOnly(query),release301.layer.release);
 assert.equal(repository.readOnly(query),release301.layer.release,'legacy direct shared query receives exact301');
 assert.equal(reviewed301.readOnly(query),release301.layer.base);
 assert.equal(reviewedSeat.readOnly(query),release300.layer.release);assert.equal(reviewed300.readOnly(query),release300.layer.base);
 const all=[...Object.keys(layer.files),...Object.keys(dark.delta.files),...Object.keys(seat.delta.files)];
 assert.equal(all.length,15);assert.equal(new Set(all).size,15);
 for(const file of all){const target=path.join(diskRoot,file),source=read(target);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1),Buffer.from(source.toString('utf8').replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'))]){
   assert.notDeepEqual(source,bad);assert.equal(history.selectBase(layer.release,f=>f===target?bad:read(f)),layer.release,file+' drift cannot authorize an older base');
  }
 }
 const old=f=>Buffer.from(repository.read(layer.base,path.relative(diskRoot,f).replaceAll('\\','/')));
 assert.equal(history.selectBase(layer.release,old),layer.release,'old baseline cannot authorize302 projection');
 for(const base of [layer.base,layer.feature,release301.layer.release,'0'.repeat(40)])assert.equal(history.selectBase(base),base);
 assert.throws(()=>history.selectBase(layer.release,()=>{throw Error('read failure')}),/read failure/);
 for(const args of [['show',layer.release+':hani-main.js'],['log','--first-parent','--format=%H%x09%s','origin/main'],['rev-parse','HEAD'],['diff-tree','--no-commit-id','--name-only','-r',layer.release]]){
  assert.equal(history.readOnly(args),history.rawReadOnly(args));assert.equal(history.readOnly(args),repository.readOnly(args));
 }
});

test('302 fixture identity is checked before any projection',()=>{
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-302-source.cjs').toString('utf8'),{__dirname:fileURLToPath(new URL('.',import.meta.url)),require:name=>name==='./hani-lounge-queen-v3-preload.cjs'?{}:name==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/release-302-layer.json'),Buffer.from('\n')])}:name==='node:path'?path:name==='node:assert/strict'?assert:name==='node:crypto'?{createHash}:assert.fail(name)}),/frozen release302 fixture/);
});

test('302 preload preserves sync callback promise Buffer string URL fd errors and callback exceptions without writes',async()=>{
 const files=[...Object.keys(layer.files),'hani-context-remote-v1.js','hani-office-live.js','scripts/hani-runtime-closure.mjs'];
 const originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString('utf8'):bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false;
 vm.runInNewContext(raw('scripts/hani-release-302-preload.cjs').toString('utf8'),{__dirname:fileURLToPath(new URL('.',import.meta.url)),URL,require:name=>name==='node:fs'?fake:name==='node:path'?path:name==='node:url'?{fileURLToPath}:name==='node:module'?{syncBuiltinESMExports(){synced=true}}:name==='./hani-release-302-source.cjs'?release:assert.fail(name)});
 assert.ok(synced);
 for(const name of files){const url=new URL(name,root),source=originals.get(fileURLToPath(url)),expected=release.project(source,name);
  for(const file of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){
   const want=encoding?expected.toString('utf8'):expected;assert.deepEqual(fake.readFileSync(file,encoding),want);
   assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
  }assert.deepEqual(raw(name),source);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller callback threw');let calls=0;
 assert.throws(()=>fake.readFile(new URL('index.html',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['index.html'],pin=row.before,url=new URL('index.html',root);
 try{row.before='0'.repeat(64);assert.throws(()=>fake.readFileSync(url),/exact main301 metadata output/);await new Promise(resolve=>fake.readFile(url,(e,b)=>{assert.match(e.message,/exact main301 metadata output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(url),/exact main301 metadata output/);}finally{row.before=pin;}
});

test('raw302 closure and every older input boundary preserve independent bytes with no missing assets',async()=>{
 const peel=(s,f)=>audit.project(release300.project(seat.project(release301.project(dark.project(release.project(s,f),f),f),f),f),f);
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});
 assert.equal(closure.files.length,174);assert.deepEqual(closure.missing,[]);
 for(const file of closure.files){
  assert.equal(raw(file).toString('utf8'),repository.read(layer.release,file));
  const post302=release.project(raw(file).toString('utf8'),file),postDark=dark.project(post302,file);
  assert.equal(post302,repository.read(layer.feature,file),'302 boundary equals frozen feature');
  assert.equal(postDark,repository.read(layer.base,file),'dark boundary equals frozen main301');
  assert.equal(dark.readRawFileSync(new URL(file,root),'utf8'),post302);
  assert.equal(release301.readRawFileSync(new URL(file,root),'utf8'),postDark);
  assert.equal(release300.readRawFileSync(new URL(file,root),'utf8'),repository.read(release300.layer.release,file));
 }
 const counts=[];
 for(const version of ['2.9.299','2.9.298','2.9.297','2.9.296','2.9.295','2.9.294','2.9.293','2.9.289']){
  const c=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>layers.projectReleaseSource(peel(raw(f),f),f,version)});counts.push(c.files.length);assert.deepEqual(c.missing,[]);
 }
 assert.deepEqual(counts,[173,173,173,172,172,171,168,164]);
});
