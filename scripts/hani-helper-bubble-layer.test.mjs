import inverse from './hani-helper-bubble-source.cjs';
import './hani-ui-polish-1-preload.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import history from './hani-helper-bubble-reviewed-input.cjs';
import release305 from './hani-release-305-source.cjs';
import history305 from './hani-release-305-reviewed-input.cjs';
import release304 from './hani-release-304-source.cjs';
import ui from './hani-ui-polish-1-source.cjs';
import release303 from './hani-release-303-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {layer,hash,restore,project,readRawFileSync:read}=inverse;
const root=new URL('../',import.meta.url),diskRoot=fileURLToPath(root),dirname=fileURLToPath(new URL('.',import.meta.url)),raw=f=>read(new URL(f,root));
const runtime=['hani-main.js','hani-style-08.css','hani-ui-v02992.js'];
function gitBytes(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}return repository.object(tree).data}

test('helper-bubble exact inverse reproduces independent main305 bytes and its bootstrap',()=>{
 assert.equal(layer.base,'ca76e21ee71359e83e2c278f683d6b3066184a96');
 assert.equal(layer.head,'9ec0733b45958807523d905738bbe4f4da594c00');
 assert.equal(layer.projectedBase,release305.layer.release);
 assert.ok(repository.commit(layer.head).parents.includes(layer.base));
 assert.deepEqual(Object.keys(layer.files).sort(),[...runtime,'scripts/hani-release-305-source.cjs'].sort());
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(before,Buffer.from(repository.read(layer.base,file)),file+' independent Git before');
  assert.equal(restore(source.toString('utf8'),file),before.toString('utf8'));
  assert.deepEqual(project(source,file),before);
  assert.deepEqual(release305.readRawFileSync(new URL(file,root)),before,'helper inverse precedes305 capture');
  let forward=before.toString('utf8');
  for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){
   assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);
   forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length);
  }
  assert.equal(forward,source.toString('utf8'),'complete forward reconstruction');
  if(runtime.includes(file))assert.deepEqual(source,Buffer.from(repository.read(layer.head,file)),'authored runtime preserved');
  else assert.equal(source.toString('utf8'),"require('./hani-helper-bubble-preload.cjs'); // Helper bubble precedes every305 capture.\n"+repository.read(layer.base,file));
 }
 for(const [file,pin]of Object.entries(layer.owners))assert.equal(pin,hash(gitBytes(layer.base,file)),file+' independent owner blob identity');
});

test('helper-bubble rejects drift EOL duplicates old input unknown owners and malformed edits',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString('utf8');
  for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.notEqual(source,bad);assert.throws(()=>restore(bad,file),/exact helper-bubble input/);assert.strictEqual(project(bad,file),bad);
  }
  const pin=row.beforeSha256,count=row.count,beforeBytes=row.beforeBytes,afterBytes=row.afterBytes,edit=row.replacements[0],start=edit.start,after=edit.after;
  try{
   row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(raw(file),file),/exact pre-helper-bubble output/);row.beforeSha256=pin;
   row.count++;assert.throws(()=>restore(raw(file),file),/complete helper-bubble edit count/);row.count=count;
   row.beforeBytes++;assert.throws(()=>restore(raw(file),file),/complete pre-helper-bubble output bytes/);row.beforeBytes=beforeBytes;
   row.afterBytes++;assert.throws(()=>restore(raw(file),file),/complete helper-bubble input bytes/);row.afterBytes=afterBytes;
   edit.start=-1;assert.throws(()=>restore(raw(file),file),/ordered helper-bubble edit bounds/);
   edit.start=start+1;assert.throws(()=>restore(raw(file),file),/helper-bubble edit (?:bounds|position)/);
   edit.start=start;edit.after='';assert.throws(()=>restore(raw(file),file),/nonempty exact helper-bubble edit/);
  }finally{row.beforeSha256=pin;row.count=count;row.beforeBytes=beforeBytes;row.afterBytes=afterBytes;edit.start=start;edit.after=after}
 }
 for(const file of ['unknown','__proto__','constructor','hani-design-system.css','scripts/hani-runtime-closure.mjs']){
  const bytes=Buffer.from('unrelated');assert.strictEqual(project(bytes,file),bytes);assert.throws(()=>restore(bytes,file),/known helper-bubble owner/);
 }
});

test('helper-bubble corrupt fixture and previous fixture fail before projections install',()=>{
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-helper-bubble-source.cjs').toString('utf8'),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/helper-bubble-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen helper-bubble fixture/);
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-helper-bubble-reviewed-input.cjs').toString('utf8'),{__dirname:dirname,require:n=>n==='./hani-test-repository-evidence.cjs'?{}:n==='./hani-helper-bubble-source.cjs'?{...inverse,readRawFileSync:()=>Buffer.from('drift')}:n==='node:path'?path:n==='node:assert/strict'?assert:assert.fail(n)}),/frozen helper-bubble previous boundary/);
});

test('helper-bubble history requires every frozen owner and retains raw refs and objects',()=>{
 const query=['merge-base','HEAD','origin/main'];
 assert.equal(history.rawReadOnly(query),layer.base);assert.equal(history.readOnly(query),layer.projectedBase);
 assert.equal(history305.rawReadOnly(query),layer.projectedBase);assert.equal(history305.readOnly(query),release305.layer.base);
 for(const file of new Set([...Object.keys(layer.files),...Object.keys(layer.owners)])){
  const target=path.join(diskRoot,file),source=raw(file),bad=Buffer.concat([source,Buffer.from('\n')]);
  assert.equal(history.selectBase(layer.base,f=>f===target?bad:read(f)),layer.base,file+' drift cannot authorize history');
 }
 for(const base of [layer.projectedBase,release305.layer.base,'0'.repeat(40)])assert.equal(history.selectBase(base,()=>assert.fail('unrelated base reads owners')),base);
 assert.throws(()=>history.selectBase(layer.base,()=>{throw Error('read failure')}),/read failure/);
 for(const ref of ['HEAD','origin/main']){
  const args=['rev-parse',ref];assert.equal(history.readOnly(args),repository.reference(ref));assert.equal(history.rawReadOnly(args),repository.reference(ref));
 }
 for(const args of [['show',layer.base+':hani-main.js'],['rev-parse',layer.base],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.base]])assert.equal(history.readOnly(args),history.rawReadOnly(args));
 assert.throws(()=>history.readOnly(['merge-base','origin/main','HEAD']));
 let mergeBase=layer.base;const simulated={exports:{}},head='1'.repeat(40),origin='2'.repeat(40);
 const protocol={...repository,readOnly:args=>args.join(' ')==='merge-base HEAD origin/main'?mergeBase:args.join(' ')==='rev-parse HEAD'?head:args.join(' ')==='rev-parse origin/main'?origin:history.rawReadOnly(args)};
 vm.runInNewContext(raw('scripts/hani-helper-bubble-reviewed-input.cjs').toString('utf8'),{module:simulated,__dirname:dirname,require:n=>n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-helper-bubble-source.cjs'?inverse:n==='node:path'?path:n==='node:assert/strict'?assert:assert.fail(n)});
 assert.equal(simulated.exports.readOnly(query),layer.projectedBase);
 for(const [ref,actual]of [['HEAD',head],['origin/main',origin]])assert.equal(simulated.exports.readOnly(['rev-parse',ref]),actual);
 mergeBase='0'.repeat(40);assert.equal(simulated.exports.readOnly(query),mergeBase);
});

test('helper-bubble preload preserves sync callback promise URL Buffer string fd and error semantics',async()=>{
 const files=[...Object.keys(layer.files),'hani-design-system.css','hani-board.js'];
 const originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString('utf8'):bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false;const protocol={};
 vm.runInNewContext(raw('scripts/hani-helper-bubble-preload.cjs').toString('utf8'),{__dirname:dirname,URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-helper-bubble-source.cjs'?inverse:n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-helper-bubble-reviewed-input.cjs'?history:assert.fail(n)});
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
 try{row.beforeSha256='0'.repeat(64);assert.throws(()=>fake.readFileSync(url),/exact pre-helper-bubble output/);await new Promise(resolve=>fake.readFile(url,(e,b)=>{assert.match(e.message,/exact pre-helper-bubble output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(url),/exact pre-helper-bubble output/)}finally{row.beforeSha256=pin}
 // An unreviewed source must remain raw even when its pathname is a known owner.
 const target=fileURLToPath(url),original=originals.get(target),drift=Buffer.concat([original,Buffer.from('\n')]);
 try{originals.set(target,drift);assert.deepEqual(fake.readFileSync(url),drift);assert.deepEqual(await fake.promises.readFile(url),drift)}finally{originals.set(target,original)}
});

test('helper-bubble runtime closure and305/304/UI/303 captures match independent Git boundaries',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});
 const historical=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>project(raw(f),f)});
 assert.equal(closure.files.length,174);assert.deepEqual(closure.missing,[]);assert.deepEqual(historical.files,closure.files);assert.deepEqual(historical.missing,[]);
 for(const file of closure.files){
  const actual=raw(file),preHelper=project(actual,file),pre305=release305.project(preHelper,file),pre304=release304.project(pre305,file),preUI=ui.project(pre304,file);
  assert.deepEqual(preHelper,gitBytes(layer.base,file));
  assert.deepEqual(pre305,gitBytes(release305.layer.base,file));
  assert.deepEqual(preUI,gitBytes(release304.layer.base,file));
  assert.deepEqual(release305.readRawFileSync(new URL(file,root)),preHelper);
  assert.deepEqual(release304.readRawFileSync(new URL(file,root)),pre305);
  assert.deepEqual(ui.readRawFileSync(new URL(file,root)),pre304);
  assert.deepEqual(release303.readRawFileSync(new URL(file,root)),preUI);
 }
});

test('helper-bubble leaves older fixtures and existing assertion bodies byte-identical',()=>{
 function fixtures(dir){for(const entry of fs.readdirSync(new URL(dir,root),{withFileTypes:true})){
  const name=dir+entry.name;
  if(entry.isDirectory())fixtures(name+'/');
  else if(!['scripts/fixtures/helper-bubble-layer.json','scripts/fixtures/release-306-layer.json'].includes(name))assert.equal(hash(raw(name)),hash(gitBytes(layer.base,name)),name+' complete fixture bytes');
 }}
 fixtures('scripts/fixtures/');
 for(const file of fs.readdirSync(new URL('scripts/',root)).filter(f=>f.endsWith('.test.mjs'))){
  if(['hani-helper-bubble-layer.test.mjs','hani-helper-bubble.test.mjs','hani-release-306.test.mjs'].includes(file))continue;
  const name='scripts/'+file,before=repository.read(layer.base,name),source=raw(name).toString('utf8');
  assert.ok(source===before||source==="import './hani-helper-bubble-preload.cjs'; // Exact helper bubble inverse before historical readers.\n"+before,name+' only one import may change');
 }
 assert.deepEqual(raw('scripts/hani-context-remote.test.mjs'),Buffer.from(repository.read(layer.base,'scripts/hani-context-remote.test.mjs')));
 assert.deepEqual(raw('scripts/hani-helper-bubble.test.mjs'),Buffer.from(repository.read(layer.head,'scripts/hani-helper-bubble.test.mjs')));
});
