// Independent raw feature evidence, outside the legacy projection chain.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import dark from './hani-dark-bundle-source.cjs';
import history from './hani-dark-bundle-reviewed-input.cjs';
import repository from './hani-test-repository-evidence.cjs';
import release from './hani-release-301-source.cjs';
import reviewed301 from './hani-release-301-reviewed-input.cjs';
import seat from './hani-ieum-seat-source.cjs';
import reviewedSeat from './hani-ieum-seat-reviewed-input.cjs';
import release300 from './hani-release-300-source.cjs';
import reviewed300 from './hani-release-300-reviewed-input.cjs';
import audit from './hani-audit-1-source.cjs';
import layers from './hani-release-version-layers.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {delta,hash,restore,project,readRawFileSync:read}=dark;
const root=new URL('../',import.meta.url),diskRoot=fileURLToPath(root),raw=f=>read(new URL(f,root));
const owners=['hani-context-remote-v1.js','hani-context-remote.css','hani-design-system.css','hani-organization-hub.css','hani-study-v02984.js','hani-style-01.css'];

test('six dark-bundle owners invert to independent main37ad7aa bytes and round trip every hunk',()=>{
 assert.equal(delta.base,'37ad7aac8d0e0a92d3a14154c19c2bb1f0c2ea10');
 assert.equal(delta.feature,'d7231cda04f409d4e1cb9d0b4dd9255fd3cc019f');
 assert.ok(repository.commit(delta.feature).parents.includes(delta.base),'fixed main is the merged feature parent');
 assert.deepEqual(Object.keys(delta.files).sort(),owners.toSorted());
 for(const [file,row]of Object.entries(delta.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(source,Buffer.from(repository.read(delta.feature,file)),file+' independent committed feature');
  assert.deepEqual(before,Buffer.from(repository.read(delta.base,file)),file+' independent main');
  assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(restore(source.toString('utf8'),file),before.toString('utf8'));
  let forward=before.toString('utf8'),end=0;
  assert.ok(row.edits.length);
  for(const e of row.edits){
   assert.ok(Number.isSafeInteger(e.start)&&e.start>=end,'ordered nonoverlapping exact hunks');
   assert.notEqual(e.before,e.after);assert.equal(forward.slice(e.start,e.start+e.before.length),e.before);
   forward=forward.slice(0,e.start)+e.after+forward.slice(e.start+e.before.length);end=e.start+e.after.length;
  }
  assert.equal(forward,source.toString('utf8'),'full forward round trip '+file);
  assert.deepEqual(project(source,file),before);
 }
});

test('strict pins reject drift, EOL, duplication, repeated inverse, unknown and inherited owners',()=>{
 for(const file of owners){
  const source=raw(file).toString('utf8'),before=restore(source,file);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.notEqual(source,bad);assert.throws(()=>restore(bad,file),/exact dark-bundle input/);
   assert.strictEqual(project(bad,file),bad,'projection never blesses drift');
  }
 }
 for(const file of ['unknown','__proto__','constructor','index.html','scripts/hani-runtime-closure.mjs','dev-center/codemap.json']){
  const source=Buffer.from('unrelated');assert.strictEqual(project(source,file),source);
  assert.throws(()=>restore(source,file),/known dark-bundle owner/);
 }
});

test('corrupt hunk position, payload and output hash fail closed',()=>{
 for(const [file,row]of Object.entries(delta.files)){
  const source=raw(file),pin=row.beforeSha256,e=row.edits.find(e=>e.after.length),{start,after,before}=e;
  try{
   row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(source,file),/exact main301 output/);row.beforeSha256=pin;
   e.start++;assert.throws(()=>restore(source,file),/complete dark-bundle hunk/);e.start=start;
   e.after+='unexpected';assert.throws(()=>restore(source,file),/complete dark-bundle hunk/);e.after=after;
   e.before+='unexpected';assert.throws(()=>restore(source,file),/exact main301 output/);
  }finally{row.beforeSha256=pin;Object.assign(e,{start,after,before});}
 }
});

test('fixture identity is checked before accepting any transform',()=>{
 const file='scripts/hani-dark-bundle-source.cjs',source=raw(file).toString('utf8');
 assert.throws(()=>vm.runInNewContext(source,{__dirname:fileURLToPath(new URL('.',import.meta.url)),require:name=>name==='./hani-release-302-preload.cjs'?{}:name==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/dark-bundle-layer.json'),Buffer.from('\n')])}:name==='node:path'?path:name==='node:assert/strict'?assert:name==='node:crypto'?{createHash}:assert.fail(name)}),/frozen dark-bundle fixture/);
});

test('preload preserves sync callback promise Buffer string URL fd errors and raw disk without writes',async()=>{
 const files=[...owners,'index.html','hani-office-live.js','scripts/hani-runtime-closure.mjs','scripts/fixtures/release-301-layer.json'];
 const originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString('utf8'):bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false;
 vm.runInNewContext(raw('scripts/hani-dark-bundle-preload.cjs').toString('utf8'),{__dirname:fileURLToPath(new URL('.',import.meta.url)),URL,require:name=>name==='node:fs'?fake:name==='node:path'?path:name==='node:url'?{fileURLToPath}:name==='node:module'?{syncBuiltinESMExports(){synced=true}}:name==='./hani-dark-bundle-source.cjs'?dark:assert.fail(name)});
 assert.ok(synced);
 for(const name of files){const url=new URL(name,root),source=originals.get(fileURLToPath(url)),expected=project(source,name);
  for(const file of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){
   const want=encoding?expected.toString('utf8'):expected;assert.deepEqual(fake.readFileSync(file,encoding),want);
   assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);
   assert.deepEqual(await fake.promises.readFile(file,encoding),want);
  }assert.deepEqual(raw(name),source);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));
 await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller callback threw');let calls=0;
 assert.throws(()=>fake.readFile(new URL(owners[0],root),()=>{calls++;throw thrown}),e=>e===thrown);
 assert.equal(calls,1,'caller exceptions propagate without invoking its callback twice');
 const row=delta.files[owners[0]],pin=row.beforeSha256,url=new URL(owners[0],root);
 try{
  row.beforeSha256='0'.repeat(64);
  assert.throws(()=>fake.readFileSync(url),/exact main301 output/);
  await new Promise(resolve=>fake.readFile(url,(e,b)=>{assert.match(e.message,/exact main301 output/);assert.equal(b,undefined);resolve()}));
  await assert.rejects(fake.promises.readFile(url),/exact main301 output/);
 }finally{row.beforeSha256=pin;}
});

test('only exact dark-bundle plus all released metadata and seats may select frozen301 history',()=>{
 assert.equal(history.rawReadOnly(['merge-base','HEAD','origin/main']),delta.base);
 assert.equal(repository.readOnly(['merge-base','HEAD','origin/main']),release.layer.release);
 assert.equal(history.readOnly(['merge-base','HEAD','origin/main']),release.layer.release);
 assert.equal(reviewed301.readOnly(['merge-base','HEAD','origin/main']),release.layer.base);
 assert.equal(reviewedSeat.readOnly(['merge-base','HEAD','origin/main']),release300.layer.release);
 assert.equal(reviewed300.readOnly(['merge-base','HEAD','origin/main']),release300.layer.base);
 const all=[...owners,...Object.keys(release.layer.files),...Object.keys(seat.delta.files)];
 for(const file of all){
  const target=path.join(diskRoot,file),source=read(target);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1),Buffer.from(source.toString('utf8').replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'))]){
   assert.notDeepEqual(source,bad);assert.equal(history.selectBase(delta.base,f=>f===target?bad:read(f)),delta.base,file+' drift cannot authorize older history');
  }
 }
 const baseline=f=>Buffer.from(repository.read(delta.base,path.relative(diskRoot,f).replaceAll('\\','/')));
 assert.equal(history.selectBase(delta.base,baseline),delta.base,'unmodified main is not the pending feature');
 for(const base of [delta.feature,release.layer.release,release.layer.base,'0'.repeat(40)])assert.equal(history.selectBase(base),base);
 assert.throws(()=>history.selectBase(delta.base,()=>{throw Error('read failure')}),/read failure/);
 for(const args of [['show',delta.base+':hani-context-remote-v1.js'],['log','--first-parent','--format=%H%x09%s','origin/main'],['rev-parse','HEAD'],['diff-tree','--no-commit-id','--name-only','-r',delta.base]])assert.equal(history.readOnly(args),repository.readOnly(args),'raw Git evidence');
});

test('capture order is dark-bundle then301 then seats then300 then audit and older versions',()=>{
 for(const file of owners){
  assert.equal(release.readRawFileSync(new URL(file,root),'utf8'),repository.read(delta.base,file),'301 captures exact independent main301');
  assert.equal(seat.readRawFileSync(new URL(file,root),'utf8'),release.project(repository.read(delta.base,file),file));
  const before=restore(raw(file),file);
  assert.throws(()=>restore(before,file),/exact dark-bundle input/);
 }
 for(const file of [...Object.keys(release.layer.files),...Object.keys(seat.delta.files)]){
  assert.equal(release300.readRawFileSync(new URL(file,root),'utf8'),repository.read(release300.layer.release,file),'301 and seat boundaries precede300');
 }
 assert.equal(layers.layers[0].to,'2.9.299');
});

test('unchanged standalone remote assertions pass when the exact outer input adapter is loaded',async()=>{
 await import('./hani-context-remote.test.mjs');
});

test('raw closure and all older version boundaries retain independent bytes and no missing assets',async()=>{
 const fs=(await import('node:fs')).default;
 const peel=(s,f)=>audit.project(release300.project(seat.project(release.project(dark.project(s,f),f),f),f),f);
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});
 assert.equal(closure.files.length,174);assert.deepEqual(closure.missing,[]);
 for(const file of closure.files){
  assert.equal(raw(file).toString('utf8'),repository.read(delta.feature,file));
  assert.equal(dark.project(raw(file).toString('utf8'),file),repository.read(delta.base,file));
 }
 const counts=[];
 for(const version of ['2.9.299','2.9.298','2.9.297','2.9.296','2.9.295','2.9.294','2.9.293','2.9.289']){
  const c=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>layers.projectReleaseSource(peel(raw(f),f),f,version)});
  counts.push(c.files.length);assert.deepEqual(c.missing,[]);
 }
 assert.deepEqual(counts,[173,173,173,172,172,171,168,164]);
});
