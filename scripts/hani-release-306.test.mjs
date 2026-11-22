import './hani-menu-badges-preload.cjs'; // Exact menu badge inverse before historical readers.
import release from './hani-release-306-source.cjs';
import './hani-ui-polish-1-preload.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import history from './hani-release-306-reviewed-input.cjs';
import helper from './hani-helper-bubble-source.cjs';
import helperHistory from './hani-helper-bubble-reviewed-input.cjs';
import release305 from './hani-release-305-source.cjs';
import release304 from './hani-release-304-source.cjs';
import ui from './hani-ui-polish-1-source.cjs';
import release303 from './hani-release-303-source.cjs';
import queen from './hani-lounge-queen-v3-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {layer,hash,restore,project,readRawFileSync:read}=release;
const root=new URL('../',import.meta.url),diskRoot=fileURLToPath(root),dirname=fileURLToPath(new URL('.',import.meta.url)),raw=f=>read(new URL(f,root));
function gitBytes(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}return repository.object(tree).data}

test('306 version/history inverse and helper runtime equal independent released Git bytes',()=>{
 assert.equal(layer.release,'077df04dea15d27d530ba957ad544381cf45ae60');
 assert.equal(layer.base,helper.layer.base);assert.equal(layer.helperHead,helper.layer.head);
 assert.deepEqual(repository.commit(layer.release).parents,[layer.base]);
 assert.deepEqual(repository.changedFiles(layer.release),['assets/data/hani-history-releases-v1.json','hani-main.js','hani-style-08.css','hani-ui-v02992.js','index.html']);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html','scripts/hani-helper-bubble-source.cjs']);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  if(file.startsWith('scripts/'))assert.equal(source.toString(),"require('./hani-release-306-preload.cjs'); // Released306 metadata precedes the helper inverse.\n"+before.toString());
  else{
   assert.deepEqual(source,gitBytes(layer.release,file));
   assert.deepEqual(before,gitBytes(file==='hani-main.js'?layer.helperHead:layer.base,file));
  }
  assert.equal(restore(source.toString(),file),before.toString());assert.deepEqual(project(source,file),before);
  assert.deepEqual(helper.readRawFileSync(new URL(file,root)),before,'306 precedes helper capture');
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length)}assert.equal(forward,source.toString());
 }
 for(const file of ['index.html','hani-main.js'])assert.equal(raw(file).toString().replaceAll(layer.to,layer.from),restore(raw(file),file).toString());
 assert.equal(raw('index.html').toString().split(layer.to).length-1,60);assert.equal(raw('hani-main.js').toString().split(layer.to).length-1,1);
 for(const file of ['hani-main.js','hani-style-08.css','hani-ui-v02992.js'])assert.deepEqual(project(raw(file),file),gitBytes(layer.helperHead,file),'released helper runtime');
 for(const [file,pin]of Object.entries(history.owners)){
  const bytes=file==='scripts/hani-release-305-source.cjs'?Buffer.from("require('./hani-helper-bubble-preload.cjs'); // Helper bubble precedes every305 capture.\n"+repository.read(layer.base,file)):gitBytes(Object.hasOwn(helper.layer.files,file)?layer.helperHead:layer.base,file);
  assert.equal(hash(bytes),pin,file+' independent helper owner');
 }
});

test('306 history adds only306 and fills the305 commit and subject',()=>{
 const file='assets/data/hani-history-releases-v1.json',after=JSON.parse(raw(file)),before=JSON.parse(restore(raw(file),file));
 assert.deepEqual(after.entries[0],{id:'v2.9.306',date:'2026-11-21',status:'released',title:'도우미 한마디 말풍선',category:'도우미 · 사용성',credits:[],source:{commit:'',subject:'release: v2.9.306 도우미 한마디 말풍선'}});
 assert.equal(after.entries[1].id,'v2.9.305');assert.deepEqual(after.entries[1].source,{commit:release305.layer.release,subject:'release: v2.9.305 뉴스룸 시황 4컷 3호 (#531)'});
 assert.deepEqual(before.entries[0].source,{commit:'',subject:'release: v2.9.305 뉴스룸 시황 4컷 3호'});
 assert.deepEqual({...after.entries[1],source:null},{...before.entries[0],source:null});assert.deepEqual(after.entries.slice(2),before.entries.slice(1));assert.deepEqual({...after,entries:[]},{...before,entries:[]});
});

test('306 history gate requires every exact owner and preserves raw refs and objects',()=>{
 const query=['merge-base','HEAD','origin/main'];assert.equal(history.rawReadOnly(query),layer.release);assert.equal(history.readOnly(query),layer.base);
 assert.equal(helperHistory.rawReadOnly(query),layer.base);assert.equal(helperHistory.readOnly(query),helper.layer.projectedBase);
 for(const file of new Set([...Object.keys(layer.files),...Object.keys(history.owners)])){
  const target=path.join(diskRoot,file),source=raw(file);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1)])assert.equal(history.selectBase(layer.release,f=>f===target?bad:read(f)),layer.release,file+' drift cannot authorize history');
 }
 for(const base of [layer.base,helper.layer.projectedBase,'0'.repeat(40)])assert.equal(history.selectBase(base,()=>assert.fail('unrelated base reads owners')),base);
 assert.throws(()=>history.selectBase(layer.release,()=>{throw Error('read failure')}),/read failure/);
 for(const ref of ['HEAD','origin/main']){const args=['rev-parse',ref];assert.equal(history.readOnly(args),repository.reference(ref));assert.equal(history.rawReadOnly(args),repository.reference(ref));assert.equal(queen.rawReadOnly(args),release303.layer.release)}
 for(const args of [['show',layer.release+':hani-main.js'],['rev-parse',layer.release],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.release]])assert.equal(history.readOnly(args),history.rawReadOnly(args));
 assert.throws(()=>history.readOnly(['merge-base','origin/main','HEAD']));
 let base=layer.release;const simulated={exports:{}},head='1'.repeat(40),origin='2'.repeat(40);
 const protocol={...repository,readOnly:args=>args.join(' ')==='merge-base HEAD origin/main'?base:args.join(' ')==='rev-parse HEAD'?head:args.join(' ')==='rev-parse origin/main'?origin:history.rawReadOnly(args)};
 vm.runInNewContext(raw('scripts/hani-release-306-reviewed-input.cjs').toString(),{module:simulated,__dirname:dirname,require:n=>n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-306-source.cjs'?release:n==='node:path'?path:n==='node:assert/strict'?assert:assert.fail(n)});
 assert.equal(simulated.exports.readOnly(query),layer.base);for(const [ref,actual]of [['HEAD',head],['origin/main',origin]])assert.equal(simulated.exports.readOnly(['rev-parse',ref]),actual);
 base='0'.repeat(40);assert.equal(simulated.exports.readOnly(query),base);
});

test('306 corrupt fixture and helper boundary fail before projections install',()=>{
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-306-source.cjs').toString(),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/release-306-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen release-306 fixture/);
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-306-reviewed-input.cjs').toString(),{__dirname:dirname,require:n=>n==='./hani-test-repository-evidence.cjs'?{}:n==='./hani-release-306-source.cjs'?{...release,readRawFileSync:()=>Buffer.from('drift')}:n==='node:path'?path:n==='node:assert/strict'?assert:assert.fail(n)}),/frozen release-306 helper boundary/);
});

test('306 runtime closure and helper/305/304/UI/303/queen captures equal Git boundaries',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});assert.equal(closure.files.length,174);assert.deepEqual(closure.missing,[]);
 const historical=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>project(raw(f),f)});assert.deepEqual(historical.files,closure.files);assert.deepEqual(historical.missing,[]);
 for(const file of closure.files){
  const source=raw(file),pre306=project(source,file),preHelper=helper.project(pre306,file),pre305=release305.project(preHelper,file),pre304=release304.project(pre305,file),preUI=ui.project(pre304,file),pre303=release303.project(preUI,file),preQueen=queen.project(pre303,file);
  assert.deepEqual(source,gitBytes(layer.release,file));assert.deepEqual(pre306,gitBytes(Object.hasOwn(helper.layer.files,file)?layer.helperHead:layer.base,file));assert.deepEqual(preHelper,gitBytes(layer.base,file));assert.deepEqual(pre305,gitBytes(release305.layer.base,file));assert.deepEqual(preUI,gitBytes(release304.layer.base,file));assert.deepEqual(preQueen,gitBytes(release303.layer.base,file));
  for(const [adapter,expected]of [[helper,pre306],[release305,preHelper],[release304,pre305],[ui,pre304],[release303,preUI],[queen,pre303]])assert.deepEqual(adapter.readRawFileSync(new URL(file,root)),expected);
 }
});

test('306 preserves old fixtures tests and305 bootstrap byte for byte',()=>{
 function fixtures(dir){for(const entry of fs.readdirSync(new URL(dir,root),{withFileTypes:true})){const file=dir+entry.name;if(entry.isDirectory())fixtures(file+'/');else if(!['scripts/fixtures/helper-bubble-layer.json','scripts/fixtures/release-306-layer.json'].includes(file))assert.deepEqual(raw(file),gitBytes(layer.release,file))}}fixtures('scripts/fixtures/');
 for(const name of fs.readdirSync(new URL('scripts/',root)).filter(f=>f.endsWith('.test.mjs'))){if(['hani-helper-bubble-layer.test.mjs','hani-helper-bubble.test.mjs','hani-release-306.test.mjs'].includes(name))continue;assert.deepEqual(raw('scripts/'+name),gitBytes(layer.release,'scripts/'+name))}
 assert.equal(raw('scripts/hani-release-305-source.cjs').toString(),"require('./hani-helper-bubble-preload.cjs'); // Helper bubble precedes every305 capture.\n"+repository.read(layer.release,'scripts/hani-release-305-source.cjs'));
 assert.deepEqual(raw('scripts/hani-helper-bubble.test.mjs'),gitBytes(layer.helperHead,'scripts/hani-helper-bubble.test.mjs'));
});

test('release-306 rejects drift EOL duplicates old input unknown owners and malformed edits',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString('utf8');
  for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.notEqual(source,bad);assert.throws(()=>restore(bad,file),/exact release-306 input/);assert.strictEqual(project(bad,file),bad);
  }
  const pin=row.beforeSha256,count=row.count,beforeBytes=row.beforeBytes,afterBytes=row.afterBytes,edit=row.replacements[0],start=edit.start,after=edit.after;
  try{
   row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(raw(file),file),/exact pre306 output/);row.beforeSha256=pin;
   row.count++;assert.throws(()=>restore(raw(file),file),/complete release-306 edit count/);row.count=count;
   row.beforeBytes++;assert.throws(()=>restore(raw(file),file),/complete pre306 output bytes/);row.beforeBytes=beforeBytes;
   row.afterBytes++;assert.throws(()=>restore(raw(file),file),/complete release-306 input bytes/);row.afterBytes=afterBytes;
   edit.start=-1;assert.throws(()=>restore(raw(file),file),/ordered release-306 edit bounds/);
   edit.start=start+1;assert.throws(()=>restore(raw(file),file),/release-306 edit (?:bounds|position)/);
   edit.start=start;edit.after='';assert.throws(()=>restore(raw(file),file),/nonempty exact release-306 edit/);
  }finally{row.beforeSha256=pin;row.count=count;row.beforeBytes=beforeBytes;row.afterBytes=afterBytes;edit.start=start;edit.after=after}
 }
 for(const file of ['unknown','__proto__','constructor','hani-design-system.css','scripts/hani-runtime-closure.mjs']){
  const bytes=Buffer.from('unrelated');assert.strictEqual(project(bytes,file),bytes);assert.throws(()=>restore(bytes,file),/known release-306 owner/);
 }
});

test('release-306 preload preserves sync callback promise URL Buffer string fd and error semantics',async()=>{
 const files=[...Object.keys(layer.files),'hani-design-system.css','hani-board.js'];
 const originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString('utf8'):bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false;const protocol={};
 vm.runInNewContext(raw('scripts/hani-release-306-preload.cjs').toString('utf8'),{__dirname:dirname,URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-release-306-source.cjs'?release:n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-306-reviewed-input.cjs'?history:assert.fail(n)});
 assert.ok(synced);assert.equal(protocol.readOnly,history.readOnly);
 for(const name of files){const url=new URL(name,root),source=raw(name),expected=project(source,name);
  for(const file of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){
   const want=encoding?expected.toString('utf8'):expected;assert.deepEqual(fake.readFileSync(file,encoding),want);
   assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
  }assert.deepEqual(raw(name),source);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));
 assert.deepEqual(await fake.promises.readFile(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile(42,(e,b)=>{assert.equal(e,null);assert.deepEqual(b,Buffer.from('fd'));resolve()}));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller callback threw');let calls=0;assert.throws(()=>fake.readFile(new URL('hani-main.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-main.js'],pin=row.beforeSha256,url=new URL('hani-main.js',root);
 try{row.beforeSha256='0'.repeat(64);assert.throws(()=>fake.readFileSync(url),/exact pre306 output/);await new Promise(resolve=>fake.readFile(url,(e,b)=>{assert.match(e.message,/exact pre306 output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(url),/exact pre306 output/)}finally{row.beforeSha256=pin}
 // An unreviewed source must remain raw even when its pathname is a known owner.
 const target=fileURLToPath(url),original=originals.get(target),drift=Buffer.concat([original,Buffer.from('\n')]);
 try{originals.set(target,drift);assert.deepEqual(fake.readFileSync(url),drift);assert.deepEqual(await fake.promises.readFile(url),drift)}finally{originals.set(target,original)}
});
