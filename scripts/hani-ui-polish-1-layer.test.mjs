import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import inverse from './hani-ui-polish-1-source.cjs';
import history from './hani-ui-polish-1-reviewed-input.cjs';
import repository from './hani-test-repository-evidence.cjs';
const {layer,hash,restore,project,readRawFileSync:read}=inverse;
const root=new URL('../',import.meta.url),diskRoot=fileURLToPath(root),raw=f=>read(new URL(f,root));

test('UI Polish 1 exact suffix and import inverses reproduce independent main303 Git bytes',()=>{
 assert.equal(layer.base,'09ba997070b6262dd9194db4a4430d5a91225c7d');
 assert.equal(layer.feature,'ed0881c31e948678c75541e15941274f41e4f3a6');
 assert.deepEqual(repository.commit(layer.feature).parents,[layer.base]);
 assert.deepEqual(repository.changedFiles(layer.feature),['artifacts/ui-polish-1/REPORT.md','artifacts/ui-polish-1/preview-pc.jpg','artifacts/ui-polish-1/preview-phone.jpg','hani-design-system.css','scripts/hani-ui-polish-1.test.mjs']);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(before,Buffer.from(repository.read(layer.base,file)),file+' independent before bytes');
  assert.equal(restore(source.toString('utf8'),file),before.toString('utf8'));
  assert.deepEqual(project(source,file),before);
  const forward=row.position==='append'?Buffer.concat([before,Buffer.from(row.added)]):Buffer.concat([Buffer.from(row.added),before]);
  assert.deepEqual(forward,source,'complete forward reconstruction');
  if(file==='hani-design-system.css'){
   assert.equal(row.position,'append');assert.equal(row.beforeBytes,340851);assert.equal(row.afterBytes,356854);
   assert.ok(row.added.includes('UI Polish 1 (11/15, 11/17, 11/20)'));assert.ok(!row.added.includes('\r'));
   assert.deepEqual(source,Buffer.from(repository.read(layer.feature,file)),'runtime CSS remains authored feature bytes');
  }else{
   assert.match(file,/^scripts\/hani-.+\.test\.mjs$/);assert.equal(row.position,'prepend');
   assert.equal(row.added,"import './hani-ui-polish-1-preload.cjs'; // Exact UI Polish 1 inverse before historical readers.\n");
  }
 }
});

test('UI inverse rejects drift duplicate EOL repeated inverse and unknown inherited owners',()=>{
 for(const file of Object.keys(layer.files)){
  const source=raw(file).toString('utf8'),before=restore(source,file);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.notEqual(source,bad);assert.throws(()=>restore(bad,file),/exact UI Polish 1 input/);assert.strictEqual(project(bad,file),bad);
  }
 }
 for(const file of ['unknown','__proto__','constructor','hani-main.js','index.html','scripts/hani-ui-polish-1.test.mjs']){
  const bytes=Buffer.from('unrelated');assert.strictEqual(project(bytes,file),bytes);assert.throws(()=>restore(bytes,file),/known UI Polish 1 owner/);
 }
});

test('UI hunk boundary byte counts and output pins fail closed',()=>{
 const file='hani-design-system.css',row=layer.files[file],saved={...row};
 const check=(key,value,pattern)=>{try{row[key]=value;assert.throws(()=>restore(raw(file),file),pattern);}finally{Object.assign(row,saved)}};
 check('afterBytes',row.afterBytes+1,/complete UI Polish 1 input bytes/);
 check('added','',/nonempty UI Polish 1 addition/);
 check('added','missing',/unique complete UI Polish 1 addition/);
 check('position','other',/known UI Polish 1 addition position/);
 check('position','prepend',/exact UI Polish 1 addition boundary/);
 check('beforeBytes',row.beforeBytes+1,/complete main303 output bytes/);
 check('beforeSha256','0'.repeat(64),/exact main303 output/);
});

test('UI merge-base projection requires every exact outer input and frozen303 owner',()=>{
 const query=['merge-base','HEAD','origin/main'];
 assert.equal(history.rawReadOnly(query),layer.base,'actual main09 remains independently accessible');
 assert.equal(history.readOnly(query),layer.projectedBase,'only reviewed input supplies released303 merge-base');
 assert.equal(layer.projectedBase,'af76a87f9456a0b0b25676fda5178aec75f91afc');
 for(const file of new Set([...Object.keys(layer.files),...Object.keys(layer.owners)])){
  const target=path.join(diskRoot,file),bytes=read(target),bad=Buffer.concat([bytes,Buffer.from('\n')]);
  assert.equal(history.selectBase(layer.base,f=>f===target?bad:read(f)),layer.base,file+' drift cannot authorize projection');
 }
 const old=f=>Buffer.from(repository.read(layer.base,path.relative(diskRoot,f).replaceAll('\\','/')));
 assert.equal(history.selectBase(layer.base,old),layer.base,'pre-feature bytes cannot authorize projection');
 for(const base of [layer.projectedBase,'0'.repeat(40)])assert.equal(history.selectBase(base,()=>assert.fail('unrelated base reads files')),base);
 assert.throws(()=>history.selectBase(layer.base,()=>{throw Error('read failure')}),/read failure/);
 for(const args of [['show',layer.base+':hani-main.js'],['rev-parse','HEAD'],['rev-parse','origin/main'],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.feature]])assert.equal(history.readOnly(args),history.rawReadOnly(args));
});

test('UI fixture corruption is rejected before projection installs',()=>{
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-ui-polish-1-source.cjs').toString('utf8'),{
  __dirname:fileURLToPath(new URL('.',import.meta.url)),require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/ui-polish-1-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)
 }),/frozen UI Polish 1 fixture/);
});

test('UI preload preserves sync callback promise URL Buffer fd errors and callback exceptions',async()=>{
 const files=[...Object.keys(layer.files),'hani-main.js','index.html','scripts/hani-ui-polish-1.test.mjs'];
 const originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString('utf8'):bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false;const protocol={};
 vm.runInNewContext(raw('scripts/hani-ui-polish-1-preload.cjs').toString('utf8'),{
  __dirname:fileURLToPath(new URL('.',import.meta.url)),URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-ui-polish-1-source.cjs'?inverse:n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-ui-polish-1-reviewed-input.cjs'?history:assert.fail(n)
 });
 assert.ok(synced);assert.equal(protocol.readOnly,history.readOnly);
 for(const name of files){const url=new URL(name,root),source=originals.get(fileURLToPath(url)),expected=project(source,name);
  for(const file of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){
   const want=encoding?expected.toString('utf8'):expected;assert.deepEqual(fake.readFileSync(file,encoding),want);
   assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
  }assert.deepEqual(raw(name),source,'disk unchanged');
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller callback threw');let calls=0;
 assert.throws(()=>fake.readFile(new URL('hani-design-system.css',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-design-system.css'],pin=row.beforeSha256,url=new URL('hani-design-system.css',root);
 try{row.beforeSha256='0'.repeat(64);assert.throws(()=>fake.readFileSync(url),/exact main303 output/);await new Promise(resolve=>fake.readFile(url,(e,b)=>{assert.match(e.message,/exact main303 output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(url),/exact main303 output/);}finally{row.beforeSha256=pin;}
});
