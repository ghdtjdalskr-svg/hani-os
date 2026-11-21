import './hani-ui-polish-1-preload.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import release from './hani-release-305-source.cjs';
import history from './hani-release-305-reviewed-input.cjs';
import previous from './hani-release-304-source.cjs';
import previousHistory from './hani-release-304-reviewed-input.cjs';
import ui from './hani-ui-polish-1-source.cjs';
import release303 from './hani-release-303-source.cjs';
import queen from './hani-lounge-queen-v3-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {layer,hash,restore,project,readRawFileSync:read}=release;
const root=new URL('../',import.meta.url),diskRoot=fileURLToPath(root),dirname=fileURLToPath(new URL('.',import.meta.url)),raw=f=>read(new URL(f,root));
const runtimeFiles=['assets/data/hani-history-releases-v1.json','assets/data/newsroom-4cut/issues.json','hani-main.js','index.html'];

test('305 exact inverse reproduces independent304 Git bytes before every304 capture',()=>{
 assert.equal(layer.release,'8a46ac79705ac515da41d0dccf9ef72283bfad50');
 assert.equal(layer.base,previous.layer.release);
 assert.equal(layer.head,'1062879952a9ca4a3ecce08bc013c8bc7c76f4e2');
 assert.deepEqual(repository.commit(layer.release).parents,[layer.base]);
 assert.deepEqual(repository.commit(layer.head).parents,[repository.resolve('737717b'),layer.release]);
 assert.deepEqual(repository.changedFiles(layer.release),runtimeFiles);
 assert.deepEqual(Object.keys(layer.files).sort(),[...runtimeFiles,'scripts/hani-release-304-source.cjs'].sort());
 assert.equal(layer.files['index.html'].count,60);assert.equal(layer.files['hani-main.js'].count,1);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(source,Buffer.from(file.startsWith('scripts/')?row.replacements[0].after+repository.read(layer.head,file):repository.read(layer.release,file)));
  assert.deepEqual(before,Buffer.from(repository.read(file.startsWith('scripts/')?layer.head:layer.base,file)));
  assert.deepEqual(previous.readRawFileSync(new URL(file,root)),before,'305 precedes304 raw capture');
  assert.equal(restore(source.toString('utf8'),file),before.toString('utf8'));
  const forward=row.replacements?row.replacements.reduce((s,e)=>{assert.equal(s.slice(e.start,e.start+e.before.length),e.before);return s.slice(0,e.start)+e.after+s.slice(e.start+e.before.length)},before.toString('utf8')):before.toString('utf8').replaceAll(layer.from,layer.to);
  assert.equal(forward,source.toString('utf8'));
  if(Object.hasOwn(previous.layer.files,file)){assert.equal(row.before,previous.layer.files[file].after);assert.throws(()=>previous.restore(source,file),/exact release-304 input/)}
 }
});

test('305 history adds one entry and completes only304 provenance',()=>{
 const file='assets/data/hani-history-releases-v1.json',after=JSON.parse(raw(file)),before=JSON.parse(restore(raw(file),file));
 assert.deepEqual(after.entries[0],{id:'v2.9.305',date:'2026-11-21',status:'released',title:'뉴스룸 시황 4컷 3호',category:'뉴스룸',credits:[],source:{commit:'',subject:'release: v2.9.305 뉴스룸 시황 4컷 3호'}});
 assert.equal(after.entries[1].id,'v2.9.304');
 assert.deepEqual(after.entries[1].source,{commit:layer.base,subject:'release: v2.9.304 화면 다듬기 1차 (#530)'});
 assert.deepEqual(before.entries[0].source,{commit:'',subject:'release: v2.9.304 화면 다듬기 1차'});
 assert.deepEqual({...after.entries[1],source:null},{...before.entries[0],source:null});
 assert.deepEqual(after.entries.slice(2),before.entries.slice(1));assert.deepEqual({...after,entries:[]},{...before,entries:[]});
});

test('305 catalog inverse removes exactly issue3 while retaining every issue1/2 byte',()=>{
 const file='assets/data/newsroom-4cut/issues.json',source=raw(file),before=restore(source,file),afterJSON=JSON.parse(source),beforeJSON=JSON.parse(before);
 assert.deepEqual(afterJSON.issues.map(i=>i.number),[1,2,3]);assert.deepEqual(beforeJSON.issues.map(i=>i.number),[1,2]);
 assert.deepEqual(afterJSON.issues.slice(0,2),beforeJSON.issues);
 assert.deepEqual({...afterJSON,issues:[]},{...beforeJSON,issues:[]});
 assert.equal(afterJSON.issues[2].image,'003');assert.equal(afterJSON.issues[2].publishDate,'2026-11-22');
 assert.deepEqual(before,Buffer.from(repository.read(layer.base,file)));
 assert.deepEqual(ui.readRawFileSync(new URL(file,root)),before);
 assert.deepEqual(release303.readRawFileSync(new URL(file,root)),before);
 const edit=layer.files[file].replacements[0];assert.equal(edit.before,'');assert.equal(edit.after.startsWith(',\n    {\n      "number": 3,'),true);
 assert.equal(source.toString('utf8').replace(edit.after,''),before.toString('utf8'));
});

test('305 inverse rejects drift EOL duplicates old input inherited owners and malformed pins',()=>{
 for(const file of Object.keys(layer.files)){
  const source=raw(file).toString('utf8');
  for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.notEqual(source,bad);assert.throws(()=>restore(bad,file),/exact release-305 input/);assert.strictEqual(project(bad,file),bad);
  }
  const row=layer.files[file],pin=row.before;
  try{row.before='0'.repeat(64);assert.throws(()=>restore(raw(file),file),/exact pre305 output/)}finally{row.before=pin}
 }
 for(const file of ['unknown','__proto__','constructor','hani-design-system.css','scripts/hani-runtime-closure.mjs']){
  const bytes=Buffer.from('unrelated');assert.strictEqual(project(bytes,file),bytes);assert.throws(()=>restore(bytes,file),/known release305 owner/);
 }
 const row=layer.files['index.html'],count=row.count;
 try{row.count++;assert.throws(()=>restore(raw('index.html'),'index.html'),/complete release305 version token count/)}finally{row.count=count}
 for(const file of Object.keys(layer.files).filter(f=>layer.files[f].replacements)){
  const row=layer.files[file],count=row.count,edit=row.replacements[0],after=edit.after,start=edit.start;
  try{row.count++;assert.throws(()=>restore(raw(file),file),/complete release305 metadata edit count/);row.count=count;edit.after='missing';assert.throws(()=>restore(raw(file),file),/unique complete release305 metadata/);edit.after='';assert.throws(()=>restore(raw(file),file),/nonempty exact release305 metadata/);edit.after=after;edit.start++;assert.throws(()=>restore(raw(file),file),/exact release305 metadata position/)}finally{row.count=count;edit.after=after;edit.start=start}
 }
});

test('305 corrupt fixture and prior/UI boundaries fail before installing projections',()=>{
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-305-source.cjs').toString('utf8'),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/release-305-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen release305 fixture/);
 for(const target of ['release-304-layer.json','ui-polish-1-layer.json'])assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-305-reviewed-input.cjs').toString('utf8'),{__dirname:dirname,require:n=>n==='./hani-test-repository-evidence.cjs'?{}:n==='./hani-release-305-source.cjs'?{...release,readRawFileSync:f=>String(f).endsWith(target)?Buffer.from('drift'):read(f)}:n==='node:path'?path:n==='node:assert/strict'?assert:assert.fail(n)}),/frozen release305 (?:previous|UI) boundary/);
});

test('305 historical Git view requires every exact owner and preserves raw refs and objects',()=>{
 const query=['merge-base','HEAD','origin/main'];
 assert.equal(history.rawReadOnly(query),layer.release);assert.equal(history.readOnly(query),layer.base);
 assert.equal(previousHistory.rawReadOnly(query),layer.base);assert.equal(previousHistory.readOnly(query),ui.layer.base);
 for(const ref of ['HEAD','origin/main']){
  const args=['rev-parse',ref];assert.equal(history.readOnly(args),repository.reference(ref));assert.equal(history.rawReadOnly(args),repository.reference(ref));
  assert.equal(previousHistory.readOnly(args),release303.layer.release);assert.equal(queen.rawReadOnly(args),release303.layer.release);
 }
 for(const file of new Set([...Object.keys(layer.files),...Object.keys(history.owners)])){
  const target=path.join(diskRoot,file),source=raw(file);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1)])assert.equal(history.selectBase(layer.release,f=>f===target?bad:read(f)),layer.release,file+' drift cannot authorize history');
 }
 for(const base of [layer.base,ui.layer.base,'0'.repeat(40)])assert.equal(history.selectBase(base,()=>assert.fail('unrelated base reads owners')),base);
 assert.throws(()=>history.selectBase(layer.release,()=>{throw Error('read failure')}),/read failure/);
 for(const args of [['show',layer.release+':hani-main.js'],['rev-parse',layer.release],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.release]])assert.equal(history.readOnly(args),history.rawReadOnly(args));
 assert.throws(()=>history.readOnly(['merge-base','origin/main','HEAD']));
 const file='index.html',pin=layer.files[file].after;
 try{layer.files[file].after='0'.repeat(64);assert.equal(history.readOnly(query),layer.release);for(const ref of ['HEAD','origin/main'])assert.equal(history.readOnly(['rev-parse',ref]),repository.reference(ref))}finally{layer.files[file].after=pin}
 // A future tooling HEAD may move while its reviewed runtime stays fixed.
 let mergeBase=layer.release;const simulated={exports:{}},head='1'.repeat(40),origin='2'.repeat(40);
 const protocol={...repository,readOnly:args=>args.join(' ')==='merge-base HEAD origin/main'?mergeBase:args.join(' ')==='rev-parse HEAD'?head:args.join(' ')==='rev-parse origin/main'?origin:history.rawReadOnly(args)};
 vm.runInNewContext(raw('scripts/hani-release-305-reviewed-input.cjs').toString('utf8'),{module:simulated,__dirname:dirname,require:n=>n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-305-source.cjs'?release:n==='node:path'?path:n==='node:assert/strict'?assert:assert.fail(n)});
 assert.equal(simulated.exports.readOnly(query),layer.base);
 for(const [ref,actual]of [['HEAD',head],['origin/main',origin]])assert.equal(simulated.exports.readOnly(['rev-parse',ref]),actual);
 mergeBase='0'.repeat(40);assert.equal(simulated.exports.readOnly(query),mergeBase);
});

test('305 preload preserves sync callback promise URL Buffer string fd and error semantics',async()=>{
 const files=[...Object.keys(layer.files),'hani-design-system.css','hani-board.js'];
 const originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString('utf8'):bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false;const protocol={};
 vm.runInNewContext(raw('scripts/hani-release-305-preload.cjs').toString('utf8'),{__dirname:dirname,URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-release-305-source.cjs'?release:n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-305-reviewed-input.cjs'?history:assert.fail(n)});
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
 try{row.before='0'.repeat(64);assert.throws(()=>fake.readFileSync(url),/exact pre305 output/);await new Promise(resolve=>fake.readFile(url,(e,b)=>{assert.match(e.message,/exact pre305 output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(url),/exact pre305 output/)}finally{row.before=pin}
});

test('305 runtime closure and304/UI/303/queen boundaries equal independent Git bytes',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});
 assert.equal(closure.files.length,174);assert.deepEqual(closure.missing,[]);
 const historical=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>project(raw(f),f)});
 assert.equal(historical.files.length,174);assert.deepEqual(historical.missing,[]);assert.ok(!historical.files.includes('assets/newsroom-4cut/003.webp'));
 // Catalog image IDs resolve dynamically, outside the static closure. Verify
 // all referenced image blobs separately, including the pre-released003 art.
 for(const issue of JSON.parse(raw('assets/data/newsroom-4cut/issues.json')).issues){
  const file='assets/newsroom-4cut/'+issue.image+'.webp';let tree=repository.commit(layer.release).tree;
  for(const name of file.split('/'))tree=repository.tree(tree).find(row=>row.name===name).sha;
  assert.deepEqual(raw(file),repository.object(tree).data,'independent catalog image blob '+file);
 }
 for(const file of closure.files){
  const actual=raw(file).toString('utf8'),post305=project(actual,file),post304=previous.project(post305,file),postUI=ui.project(post304,file),post303=release303.project(postUI,file),postQueen=queen.project(post303,file);
  assert.equal(actual,repository.read(layer.release,file));assert.equal(post305,repository.read(layer.base,file));
  assert.equal(postUI,repository.read(previous.layer.base,file));assert.equal(postQueen,repository.read(release303.layer.base,file));
  assert.equal(previous.readRawFileSync(new URL(file,root),'utf8'),post305);
  assert.equal(ui.readRawFileSync(new URL(file,root),'utf8'),post304);
  assert.equal(release303.readRawFileSync(new URL(file,root),'utf8'),postUI);
  assert.equal(queen.readRawFileSync(new URL(file,root),'utf8'),post303);
 }
});
