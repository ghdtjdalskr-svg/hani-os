import './hani-ui-polish-1-preload.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import release from './hani-release-304-source.cjs';
import history from './hani-release-304-reviewed-input.cjs';
import ui from './hani-ui-polish-1-source.cjs';
import uiHistory from './hani-ui-polish-1-reviewed-input.cjs';
import release303 from './hani-release-303-source.cjs';
import reviewed303 from './hani-release-303-reviewed-input.cjs';
import queen from './hani-lounge-queen-v3-source.cjs';
import release302 from './hani-release-302-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {layer,hash,restore,project,readRawFileSync:read}=release,root=new URL('../',import.meta.url),diskRoot=fileURLToPath(root),raw=f=>read(new URL(f,root));

test('304 metadata exactly inverts independent released Git bytes before UI and303 capture',()=>{
 assert.equal(layer.release,'cb1b9376aac575eb3f60a98f01afbe3855282798');
 assert.deepEqual(repository.commit(layer.release).parents,[layer.base]);
 assert.deepEqual(repository.changedFiles(layer.release),[...Object.keys(layer.files),'hani-design-system.css'].sort());
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 assert.equal(layer.files['index.html'].count,60);assert.equal(layer.files['hani-main.js'].count,1);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(source,Buffer.from(repository.read(layer.release,file)));
  assert.deepEqual(before,Buffer.from(repository.read(layer.base,file)));
  assert.deepEqual(before,Buffer.from(repository.read(ui.layer.base,file)));
  assert.equal(row.before,release303.layer.files[file].after);
  assert.deepEqual(ui.readRawFileSync(new URL(file,root)),before,'304 precedes UI capture');
  assert.deepEqual(release303.readRawFileSync(new URL(file,root)),before,'UI precedes303 capture');
  assert.equal(restore(source.toString('utf8'),file),before.toString('utf8'));
  const forward=row.replacements?row.replacements.reduce((s,e)=>s.replace(e.before,()=>e.after),before.toString('utf8')):before.toString('utf8').replaceAll(layer.from,layer.to);
  assert.equal(forward,source.toString('utf8'));
  assert.throws(()=>release303.restore(source,file),/exact release-303 input/);
 }
});

test('304 history adds one entry and completes only303 provenance',()=>{
 const file='assets/data/hani-history-releases-v1.json',after=JSON.parse(raw(file)),before=JSON.parse(restore(raw(file),file));
 assert.deepEqual(after.entries[0],{id:'v2.9.304',date:'2026-11-21',status:'released',title:'화면 다듬기 1차',category:'디자인 · 대시보드',credits:[],source:{commit:'',subject:'release: v2.9.304 화면 다듬기 1차'}});
 assert.equal(after.entries[1].id,'v2.9.303');
 assert.deepEqual(after.entries[1].source,{commit:release303.layer.release,subject:'release: v2.9.303 이달의 퀸 레이스 중계 (#526)'});
 assert.deepEqual(before.entries[0].source,{commit:'',subject:'release: v2.9.303 이달의 퀸 레이스 중계'});
 assert.deepEqual({...after.entries[1],source:null},{...before.entries[0],source:null});
 assert.deepEqual(after.entries.slice(2),before.entries.slice(1));assert.deepEqual({...after,entries:[]},{...before,entries:[]});
});

test('304 and UI round trips reject drift EOL duplicate old input and inherited owners',()=>{
 for(const file of Object.keys(layer.files)){
  const source=raw(file).toString('utf8');
  for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'),source.replace(layer.to,layer.from)]){
   assert.notEqual(source,bad);assert.throws(()=>restore(bad,file),/exact release-304 input/);assert.strictEqual(project(bad,file),bad);
  }
 }
 for(const file of ['unknown','__proto__','constructor','hani-design-system.css','scripts/hani-runtime-closure.mjs']){
  const source=Buffer.from('unrelated');assert.strictEqual(project(source,file),source);assert.throws(()=>restore(source,file),/known release304 owner/);
 }
 const file='hani-design-system.css',source=raw(file);assert.equal(hash(source),ui.layer.files[file].afterSha256);
 assert.deepEqual(source,Buffer.from(repository.read(ui.layer.feature,file)));
 assert.strictEqual(project(source,file),source);assert.deepEqual(ui.restore(source,file),Buffer.from(repository.read(layer.base,file)));
});

test('304 malformed metadata counts hunks output pins and corrupt fixtures fail closed',()=>{
 const file='index.html',row=layer.files[file],saved={...row};
 try{row.count++;assert.throws(()=>restore(raw(file),file),/complete release304 version token count/);row.count=saved.count;row.before='0'.repeat(64);assert.throws(()=>restore(raw(file),file),/exact pre304 metadata output/);}finally{Object.assign(row,saved)}
 const f='assets/data/hani-history-releases-v1.json',meta=layer.files[f],count=meta.count,edit=meta.replacements[0],after=edit.after;
 try{meta.count++;assert.throws(()=>restore(raw(f),f),/complete release304 metadata edit count/);meta.count=count;edit.after='missing';assert.throws(()=>restore(raw(f),f),/unique complete release304 metadata/);edit.after='';assert.throws(()=>restore(raw(f),f),/nonempty exact release304 metadata/);}finally{meta.count=count;edit.after=after}
 const dirname=fileURLToPath(new URL('.',import.meta.url));
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-304-source.cjs').toString('utf8'),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/release-304-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen release304 fixture/);
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-304-reviewed-input.cjs').toString('utf8'),{__dirname:dirname,require:n=>n==='./hani-test-repository-evidence.cjs'?{}:n==='./hani-release-304-source.cjs'?{...release,readRawFileSync:()=>Buffer.from('drift')}:n==='node:path'?path:n==='node:assert/strict'?assert:assert.fail(n)}),/frozen release304 UI boundary/);
});

test('304 historical merge and queen ref views require every exact owner while actual Git evidence stays raw',()=>{
 const query=['merge-base','HEAD','origin/main'];
 assert.equal(history.rawReadOnly(query),layer.release);
 assert.equal(history.readOnly(query),ui.layer.base);
 assert.equal(uiHistory.rawReadOnly(query),ui.layer.base);assert.equal(uiHistory.readOnly(query),release303.layer.release);
 assert.equal(reviewed303.rawReadOnly(query),release303.layer.release);assert.equal(reviewed303.readOnly(query),queen.delta.base);
 assert.equal(queen.rawReadOnly(query),queen.delta.base);assert.equal(queen.readOnly(query),release302.layer.release);
 for(const ref of ['HEAD','origin/main']){
  const args=['rev-parse',ref];assert.equal(history.rawReadOnly(args),repository.reference(ref));
  assert.equal(history.readOnly(args),release303.layer.release);assert.equal(queen.rawReadOnly(args),release303.layer.release);
 }
 const files=new Set([...Object.keys(layer.files),...Object.keys(layer.passthrough),...Object.keys(history.ui.files),...Object.keys(history.ui.owners)]);
 for(const file of files){const target=path.join(diskRoot,file),source=raw(file);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1)])assert.equal(history.selectBase(layer.release,f=>f===target?bad:read(f)),layer.release,file+' drift cannot authorize history');
 }
 for(const base of [layer.base,ui.layer.base,release303.layer.release,'0'.repeat(40)])assert.equal(history.selectBase(base,()=>assert.fail('unrelated base read owners')),base);
 assert.throws(()=>history.selectBase(layer.release,()=>{throw Error('read failure')}),/read failure/);
 for(const args of [['show',layer.release+':hani-main.js'],['rev-parse',layer.release],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.release]])assert.equal(history.readOnly(args),history.rawReadOnly(args));
 assert.throws(()=>history.readOnly(['merge-base','origin/main','HEAD']));
 // Also prove ref queries fail closed through the protocol, not just selectBase.
 const target=Object.keys(layer.files)[0],saved=layer.files[target].after;
 try{layer.files[target].after='0'.repeat(64);for(const ref of ['HEAD','origin/main'])assert.equal(history.readOnly(['rev-parse',ref]),history.rawReadOnly(['rev-parse',ref]));}finally{layer.files[target].after=saved}
 // A later tooling commit may move HEAD without changing these frozen inputs.
 // Exercise that state without touching real refs or invoking Git.
 let mergeBase=layer.release;const simulated={exports:{}},head='1'.repeat(40),origin='2'.repeat(40);
 const protocol={...repository,readOnly:args=>args.join(' ')==='merge-base HEAD origin/main'?mergeBase:args.join(' ')==='rev-parse HEAD'?head:args.join(' ')==='rev-parse origin/main'?origin:history.rawReadOnly(args)};
 vm.runInNewContext(raw('scripts/hani-release-304-reviewed-input.cjs').toString('utf8'),{module:simulated,__dirname:fileURLToPath(new URL('.',import.meta.url)),require:n=>n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-304-source.cjs'?release:n==='node:path'?path:n==='node:assert/strict'?assert:assert.fail(n)});
 for(const [ref,actual]of [['HEAD',head],['origin/main',origin]]){assert.equal(simulated.exports.rawReadOnly(['rev-parse',ref]),actual);assert.equal(simulated.exports.readOnly(['rev-parse',ref]),release303.layer.release)}
 mergeBase='0'.repeat(40);for(const [ref,actual]of [['HEAD',head],['origin/main',origin]])assert.equal(simulated.exports.readOnly(['rev-parse',ref]),actual,'unrelated ancestry cannot project refs');
});

test('304 preload preserves sync callback promise Buffer string URL fd errors and callback exceptions',async()=>{
 const files=[...Object.keys(layer.files),'hani-design-system.css','hani-board.js'];
 const originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString('utf8'):bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false;const protocol={};
 vm.runInNewContext(raw('scripts/hani-release-304-preload.cjs').toString('utf8'),{__dirname:fileURLToPath(new URL('.',import.meta.url)),URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-release-304-source.cjs'?release:n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-304-reviewed-input.cjs'?history:assert.fail(n)});
 assert.ok(synced);assert.equal(protocol.readOnly,history.readOnly);
 for(const name of files){const url=new URL(name,root),source=raw(name),expected=project(source,name);
  for(const file of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){
   const want=encoding?expected.toString('utf8'):expected;assert.deepEqual(fake.readFileSync(file,encoding),want);
   assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
  }assert.deepEqual(raw(name),source);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller callback threw');let calls=0;assert.throws(()=>fake.readFile(new URL('index.html',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['index.html'],pin=row.before,url=new URL('index.html',root);
 try{row.before='0'.repeat(64);assert.throws(()=>fake.readFileSync(url),/exact pre304 metadata output/);await new Promise(resolve=>fake.readFile(url,(e,b)=>{assert.match(e.message,/exact pre304 metadata output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(url),/exact pre304 metadata output/);}finally{row.before=pin}
});

test('304 runtime closure matches independent Git at each boundary and #529 assets remain unreferenced',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});
 assert.equal(closure.files.length,174);assert.deepEqual(closure.missing,[]);
 for(const file of closure.files){
  const actual=raw(file).toString('utf8'),post304=project(actual,file),postUI=ui.project(post304,file),post303=release303.project(postUI,file),postQueen=queen.project(post303,file);
  assert.equal(actual,repository.read(layer.release,file),'actual released runtime');
  assert.equal(postUI,repository.read(layer.base,file),'independent pre304 runtime');
  assert.equal(postUI,repository.read(ui.layer.base,file),'UI baseline runtime');
  assert.equal(postQueen,repository.read(release303.layer.base,file),'queen baseline runtime');
  assert.equal(ui.readRawFileSync(new URL(file,root),'utf8'),post304);
  assert.equal(release303.readRawFileSync(new URL(file,root),'utf8'),postUI);
  assert.equal(queen.readRawFileSync(new URL(file,root),'utf8'),post303);
  assert.equal(release302.readRawFileSync(new URL(file,root),'utf8'),postQueen);
 }
 assert.deepEqual(Object.keys(layer.passthrough).sort(),repository.changedFiles(layer.base));
 for(const [file,pin]of Object.entries(layer.passthrough)){
  const source=raw(file);assert.equal(hash(source),pin);assert.strictEqual(project(source,file),source);assert.ok(!closure.files.includes(file));
  let tree=repository.commit(layer.release).tree;
  for(const name of file.split('/'))tree=repository.tree(tree).find(row=>row.name===name).sha;
  assert.deepEqual(source,repository.object(tree).data,'binary-safe independent #529 blob');
 }
});
