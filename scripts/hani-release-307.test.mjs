import release from './hani-release-307-source.cjs';
import './hani-ui-polish-1-preload.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import history from './hani-release-307-reviewed-input.cjs';
import menu from './hani-menu-badges-source.cjs';
import menuHistory from './hani-menu-badges-reviewed-input.cjs';
import release306 from './hani-release-306-source.cjs';
import helper from './hani-helper-bubble-source.cjs';
import release305 from './hani-release-305-source.cjs';
import release304 from './hani-release-304-source.cjs';
import ui from './hani-ui-polish-1-source.cjs';
import release303 from './hani-release-303-source.cjs';
import queen from './hani-lounge-queen-v3-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {layer,hash,restore,project,readRawFileSync:read}=release;
const root=new URL('../',import.meta.url),diskRoot=fileURLToPath(root),dirname=fileURLToPath(new URL('.',import.meta.url)),raw=f=>read(new URL(f,root));
const bootstrap="require('./hani-release-307-preload.cjs'); // Released307 metadata precedes the menu inverse.\n";
function gitBytes(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}return repository.object(tree).data}

test('307 version/history inverse reconstructs exact released and authored Git bytes in both directions',()=>{
 assert.equal(layer.release,'4c3761da46ff1d1618555cc39fc0ddfe458b675a');
 assert.equal(layer.base,menu.layer.base);assert.equal(layer.menuHead,menu.layer.head);
 assert.deepEqual(repository.commit(layer.release).parents,[layer.base]);
 assert.deepEqual(repository.changedFiles(layer.release),['assets/data/hani-history-releases-v1.json','hani-design-system.css','hani-ilbo.js','hani-main.js','hani-style-08.css','index.html']);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html','scripts/hani-menu-badges-source.cjs']);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  if(file.startsWith('scripts/'))assert.equal(source.toString(),bootstrap+before.toString());
  else {assert.deepEqual(source,gitBytes(layer.release,file));assert.deepEqual(before,gitBytes(file==='hani-main.js'?layer.menuHead:layer.base,file))}
  assert.equal(restore(source.toString(),file),before.toString());assert.deepEqual(project(source,file),before);
  assert.deepEqual(menu.readRawFileSync(new URL(file,root)),before,'307 precedes menu capture');
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length)}assert.equal(forward,source.toString());
 }
 for(const [file,count]of [['index.html',60],['hani-main.js',1]]){assert.equal(raw(file).toString().split(layer.to).length-1,count);assert.equal(raw(file).toString().replaceAll(layer.to,layer.from),restore(raw(file),file).toString())}
 for(const file of Object.keys(menu.layer.files).filter(f=>!f.startsWith('scripts/')))assert.deepEqual(project(raw(file),file),gitBytes(layer.menuHead,file),'released menu bytes');
});

test('307 history adds only307 and fills the306 release commit and subject',()=>{
 const file='assets/data/hani-history-releases-v1.json',after=JSON.parse(raw(file)),before=JSON.parse(restore(raw(file),file));
 assert.deepEqual(after.entries[0],{id:'v2.9.307',date:'2026-11-21',status:'released',title:'메뉴 NEW 배지 · 봤으면 꺼지기',category:'메뉴 · 사용성',credits:[],source:{commit:'',subject:'release: v2.9.307 메뉴 NEW 배지 · 봤으면 꺼지기'}});
 assert.equal(after.entries[1].id,'v2.9.306');assert.deepEqual(after.entries[1].source,{commit:release306.layer.release,subject:'release: v2.9.306 도우미 한마디 말풍선 (#533)'});
 assert.deepEqual(before.entries[0].source,{commit:'',subject:'release: v2.9.306 도우미 한마디 말풍선'});
 assert.deepEqual({...after.entries[1],source:null},{...before.entries[0],source:null});assert.deepEqual(after.entries.slice(2),before.entries.slice(1));assert.deepEqual({...after,entries:[]},{...before,entries:[]});
});

test('307 history needs every exact owner; outer refs objects and unsupported commands stay real',()=>{
 const query=['merge-base','HEAD','origin/main'];assert.equal(history.rawReadOnly(query),layer.release);assert.equal(history.readOnly(query),layer.base);
 assert.equal(menuHistory.rawReadOnly(query),layer.base);assert.equal(menuHistory.readOnly(query),menu.layer.projectedBase);
 for(const file of new Set([...Object.keys(layer.files),...Object.keys(history.owners)])){
  const target=path.join(diskRoot,file),source=raw(file);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1)])assert.equal(history.selectBase(layer.release,f=>f===target?bad:read(f)),layer.release,file+' drift cannot authorize history');
 }
 for(const base of [layer.base,menu.layer.projectedBase,'0'.repeat(40)])assert.equal(history.selectBase(base,()=>assert.fail('unrelated base reads owners')),base);
 assert.throws(()=>history.selectBase(layer.release,()=>{throw Error('read failure')}),/read failure/);
 for(const ref of ['HEAD','origin/main']){const args=['rev-parse',ref];assert.equal(history.readOnly(args),repository.reference(ref));assert.equal(history.rawReadOnly(args),repository.reference(ref));assert.equal(queen.rawReadOnly(args),release303.layer.release)}
 for(const args of [['show',layer.release+':hani-main.js'],['rev-parse',layer.release],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.release]])assert.equal(history.readOnly(args),history.rawReadOnly(args));
 assert.throws(()=>history.readOnly(['merge-base','origin/main','HEAD']));
 let base=layer.release;const simulated={exports:{}},head='1'.repeat(40),origin='2'.repeat(40);
 const protocol={...repository,readOnly:args=>args.join(' ')==='merge-base HEAD origin/main'?base:args.join(' ')==='rev-parse HEAD'?head:args.join(' ')==='rev-parse origin/main'?origin:history.rawReadOnly(args)};
 vm.runInNewContext(raw('scripts/hani-release-307-reviewed-input.cjs').toString(),{module:simulated,__dirname:dirname,require:n=>n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-307-source.cjs'?release:n==='node:path'?path:n==='node:assert/strict'?assert:assert.fail(n)});
 assert.equal(simulated.exports.readOnly(query),layer.base);for(const [ref,actual]of [['HEAD',head],['origin/main',origin]])assert.equal(simulated.exports.readOnly(['rev-parse',ref]),actual);
 base='0'.repeat(40);assert.equal(simulated.exports.readOnly(query),base);
});

test('307 corrupt fixture and menu boundary fail before projection installation',()=>{
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-307-source.cjs').toString(),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/release-307-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen release-307 fixture/);
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-release-307-reviewed-input.cjs').toString(),{__dirname:dirname,require:n=>n==='./hani-test-repository-evidence.cjs'?{}:n==='./hani-release-307-source.cjs'?{...release,readRawFileSync:()=>Buffer.from('drift')}:n==='node:path'?path:n==='node:assert/strict'?assert:assert.fail(n)}),/frozen release-307 menu boundary/);
});

test('307 -> menu ->306 ->helper ->305 ->304 ->UI ->303 ->queen runtime and captures match Git',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});assert.equal(closure.files.length,174);assert.deepEqual(closure.missing,[]);
 const historical=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>project(raw(f),f)});assert.deepEqual(historical.files,closure.files);assert.deepEqual(historical.missing,[]);
 for(const file of closure.files){
  const source=raw(file),pre307=project(source,file),preMenu=menu.project(pre307,file),pre306=release306.project(preMenu,file),preHelper=helper.project(pre306,file),pre305=release305.project(preHelper,file),pre304=release304.project(pre305,file),preUI=ui.project(pre304,file),pre303=release303.project(preUI,file),preQueen=queen.project(pre303,file);
  assert.deepEqual(source,gitBytes(layer.release,file));assert.deepEqual(pre307,gitBytes(Object.hasOwn(menu.layer.files,file)?layer.menuHead:layer.base,file));assert.deepEqual(preMenu,gitBytes(layer.base,file));assert.deepEqual(preHelper,gitBytes(helper.layer.base,file));assert.deepEqual(pre305,gitBytes(release305.layer.base,file));assert.deepEqual(preUI,gitBytes(release304.layer.base,file));assert.deepEqual(preQueen,gitBytes(release303.layer.base,file));
  for(const [adapter,expected]of [[menu,pre307],[release306,preMenu],[helper,pre306],[release305,preHelper],[release304,pre305],[ui,pre304],[release303,preUI],[queen,pre303]])assert.deepEqual(adapter.readRawFileSync(new URL(file,root)),expected);
 }
});

test('307 leaves existing fixture hashes assertions protected owners and runtime byte-identical',()=>{
 function walk(tree,prefix){for(const row of repository.tree(tree)){const file=prefix+row.name;if(row.mode==='40000')walk(row.sha,file+'/');else assert.deepEqual(raw(file),repository.object(row.sha).data,file)}}
 const scripts=repository.tree(repository.commit(layer.release).tree).find(r=>r.name==='scripts');
 walk(repository.tree(scripts.sha).find(r=>r.name==='fixtures').sha,'scripts/fixtures/');
 for(const row of repository.tree(scripts.sha).filter(r=>r.name.endsWith('.test.mjs'))){const file='scripts/'+row.name,before=repository.object(row.sha).data.toString(),source=raw(file).toString();assert.ok(source===before||menu.connectedTests.has(file)&&source===menu.connection+before,file+' exact existing body')}
 for(const file of ['AGENTS.md','scripts/hani-context-remote.test.mjs','scripts/hani-runtime-closure.mjs','scripts/hani-release-package.mjs','scripts/hani-release-preqa.mjs','scripts/hani-ci-scope.mjs','scripts/hani-board-library-build.mjs',...Object.keys(layer.files).filter(f=>!f.startsWith('scripts/'))])assert.deepEqual(raw(file),gitBytes(layer.release,file),file+' preserved');
 assert.ok(fs.readdirSync(new URL('scripts/',root)).includes('hani-release-307.test.mjs'));
 assert.ok(fs.readdirSync(new URL('scripts/fixtures/',root)).includes('release-307-layer.json'));
});

test('release-307 rejects drift EOL duplicates old input unknown owners and malformed edits',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString('utf8');
  for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.notEqual(source,bad);assert.throws(()=>restore(bad,file),/exact release-307 input/);assert.strictEqual(project(bad,file),bad);
  }
  const pin=row.beforeSha256,count=row.count,beforeBytes=row.beforeBytes,afterBytes=row.afterBytes,edit=row.replacements[0],start=edit.start,after=edit.after;
  try{
   row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(raw(file),file),/exact pre307 output/);row.beforeSha256=pin;
   row.count++;assert.throws(()=>restore(raw(file),file),/complete release-307 edit count/);row.count=count;
   row.beforeBytes++;assert.throws(()=>restore(raw(file),file),/complete pre307 output bytes/);row.beforeBytes=beforeBytes;
   row.afterBytes++;assert.throws(()=>restore(raw(file),file),/complete release-307 input bytes/);row.afterBytes=afterBytes;
   edit.start=-1;assert.throws(()=>restore(raw(file),file),/ordered release-307 edit bounds/);
   edit.start=start+1;assert.throws(()=>restore(raw(file),file),/release-307 edit (?:bounds|position)/);
   edit.start=start;edit.after='';assert.throws(()=>restore(raw(file),file),/nonempty exact release-307 edit/);
  }finally{row.beforeSha256=pin;row.count=count;row.beforeBytes=beforeBytes;row.afterBytes=afterBytes;edit.start=start;edit.after=after}
 }
 for(const file of ['unknown','__proto__','constructor','hani-design-system.css','scripts/hani-runtime-closure.mjs']){
  const bytes=Buffer.from('unrelated');assert.strictEqual(project(bytes,file),bytes);assert.throws(()=>restore(bytes,file),/known release-307 owner/);
 }
});

test('release-307 preload preserves sync callback promise URL Buffer string fd and error semantics',async()=>{
 const files=[...Object.keys(layer.files),'hani-design-system.css','hani-board.js'];
 const originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString('utf8'):bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false;const protocol={};
 vm.runInNewContext(raw('scripts/hani-release-307-preload.cjs').toString('utf8'),{__dirname:dirname,URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-release-307-source.cjs'?release:n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-release-307-reviewed-input.cjs'?history:assert.fail(n)});
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
 try{row.beforeSha256='0'.repeat(64);assert.throws(()=>fake.readFileSync(url),/exact pre307 output/);await new Promise(resolve=>fake.readFile(url,(e,b)=>{assert.match(e.message,/exact pre307 output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(url),/exact pre307 output/)}finally{row.beforeSha256=pin}
 // An unreviewed source must remain raw even when its pathname is a known owner.
 const target=fileURLToPath(url),original=originals.get(target),drift=Buffer.concat([original,Buffer.from('\n')]);
 try{originals.set(target,drift);assert.deepEqual(fake.readFileSync(url),drift);assert.deepEqual(await fake.promises.readFile(url),drift)}finally{originals.set(target,original)}
});
