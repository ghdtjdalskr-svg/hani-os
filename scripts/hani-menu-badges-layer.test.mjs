import inverse from './hani-menu-badges-source.cjs';
import './hani-ui-polish-1-preload.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import history from './hani-menu-badges-reviewed-input.cjs';
import release306 from './hani-release-306-source.cjs';
import history306 from './hani-release-306-reviewed-input.cjs';
import helper from './hani-helper-bubble-source.cjs';
import release305 from './hani-release-305-source.cjs';
import release304 from './hani-release-304-source.cjs';
import ui from './hani-ui-polish-1-source.cjs';
import release303 from './hani-release-303-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {layer,hash,restore,project,readRawFileSync:read}=inverse;
const root=new URL('../',import.meta.url),diskRoot=fileURLToPath(root),dirname=fileURLToPath(new URL('.',import.meta.url)),raw=f=>read(new URL(f,root));
const runtime=['hani-design-system.css','hani-ilbo.js','hani-main.js','hani-style-08.css'];
const bootstrap="require('./hani-menu-badges-preload.cjs'); // Menu badges precede every306 capture.\n";
function gitBytes(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}return repository.object(tree).data}
const same=(a,b,label)=>assert.equal(hash(a),hash(b),label);

test('menu inverse reproduces independent main306 bytes and bootstrap in both directions',()=>{
 assert.equal(layer.base,'cd916e28466a17dfe5723fbce41ab3d0930522ec');
 assert.equal(layer.head,'6cda54ea3875677ea932c5ce47326757abd2daf3');
 assert.equal(layer.projectedBase,release306.layer.release);
 assert.ok(repository.commit(layer.head).parents.includes(layer.base));
 assert.deepEqual(Object.keys(layer.files).sort(),[...runtime,'scripts/hani-release-306-source.cjs'].sort());
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  same(before,gitBytes(layer.base,file),file+' independent Git before');
  assert.equal(restore(source.toString(),file),before.toString());same(project(source,file),before);
  same(release306.readRawFileSync(new URL(file,root)),before,'menu precedes306 capture');
  let forward=before.toString();
  for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){
   assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);
   forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length);
  }
  assert.equal(forward,source.toString(),'complete forward reconstruction');
  if(runtime.includes(file))same(source,gitBytes(layer.head,file),'authored runtime preserved');
  else assert.equal(source.toString(),bootstrap+repository.read(layer.base,file));
 }
 for(const [file,pin]of Object.entries(layer.owners))assert.equal(pin,hash(gitBytes(layer.base,file)),file+' independent owner blob');
});

test('menu inverse rejects drift EOL duplicates old input unknown owners and malformed edits',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString();
  for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.notEqual(hash(source),hash(bad));assert.throws(()=>restore(bad,file),/exact menu-badges input/);assert.strictEqual(project(bad,file),bad);
  }
  const pin=row.beforeSha256,count=row.count,beforeBytes=row.beforeBytes,afterBytes=row.afterBytes,edit=row.replacements[0],start=edit.start,after=edit.after;
  try{
   row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(raw(file),file),/exact pre-menu-badges output/);row.beforeSha256=pin;
   row.count++;assert.throws(()=>restore(raw(file),file),/complete menu-badges edit count/);row.count=count;
   row.beforeBytes++;assert.throws(()=>restore(raw(file),file),/complete pre-menu-badges output bytes/);row.beforeBytes=beforeBytes;
   row.afterBytes++;assert.throws(()=>restore(raw(file),file),/complete menu-badges input bytes/);row.afterBytes=afterBytes;
   edit.start=-1;assert.throws(()=>restore(raw(file),file),/ordered menu-badges edit bounds/);
   edit.start=start+1;assert.throws(()=>restore(raw(file),file),/menu-badges edit (?:bounds|position)/);
   edit.start=start;edit.after='';assert.throws(()=>restore(raw(file),file),/nonempty exact menu-badges edit/);
  }finally{row.beforeSha256=pin;row.count=count;row.beforeBytes=beforeBytes;row.afterBytes=afterBytes;edit.start=start;edit.after=after}
 }
 for(const file of ['unknown','__proto__','constructor','index.html','scripts/hani-runtime-closure.mjs']){
  const bytes=Buffer.from('unrelated');assert.strictEqual(project(bytes,file),bytes);assert.throws(()=>restore(bytes,file),/known menu-badges owner/);
 }
});

test('menu corrupt fixture and306 boundary fail before projections install',()=>{
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-menu-badges-source.cjs').toString(),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/menu-badges-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen menu-badges fixture/);
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-menu-badges-reviewed-input.cjs').toString(),{__dirname:dirname,require:n=>n==='./hani-test-repository-evidence.cjs'?{}:n==='./hani-menu-badges-source.cjs'?{...inverse,readRawFileSync:()=>Buffer.from('drift')}:n==='node:path'?path:n==='node:assert/strict'?assert:assert.fail(n)}),/frozen menu-badges previous boundary/);
});

test('menu history requires all exact owners while real refs objects and directory entries stay raw',()=>{
 const query=['merge-base','HEAD','origin/main'];assert.equal(history.rawReadOnly(query),layer.base);assert.equal(history.readOnly(query),layer.projectedBase);
 assert.equal(history306.rawReadOnly(query),layer.projectedBase);assert.equal(history306.readOnly(query),release306.layer.base);
 for(const file of new Set([...Object.keys(layer.files),...Object.keys(layer.owners)])){
  const target=path.join(diskRoot,file),source=raw(file);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1)])assert.equal(history.selectBase(layer.base,f=>f===target?bad:read(f)),layer.base,file+' drift cannot authorize history');
 }
 for(const base of [layer.projectedBase,release306.layer.base,'0'.repeat(40)])assert.equal(history.selectBase(base,()=>assert.fail('unrelated base reads owners')),base);
 assert.throws(()=>history.selectBase(layer.base,()=>{throw Error('read failure')}),/read failure/);
 for(const ref of ['HEAD','origin/main']){const args=['rev-parse',ref];assert.equal(history.readOnly(args),repository.reference(ref));assert.equal(history.rawReadOnly(args),repository.reference(ref))}
 for(const args of [['show',layer.base+':hani-main.js'],['rev-parse',layer.base],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.base]])assert.equal(history.readOnly(args),history.rawReadOnly(args));
 assert.throws(()=>history.readOnly(['merge-base','origin/main','HEAD']));
 assert.ok(fs.readdirSync(new URL('scripts/',root)).includes('hani-menu-badges-layer.test.mjs'));
 assert.ok(fs.readdirSync(new URL('scripts/fixtures/',root)).includes('menu-badges-layer.json'));
});

test('menu preload preserves sync callback promise URL Buffer string fd and error semantics',async()=>{
 const files=[...Object.keys(layer.files),'index.html','hani-board.js'];
 const originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString('utf8'):bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false;const protocol={};
 vm.runInNewContext(raw('scripts/hani-menu-badges-preload.cjs').toString(),{__dirname:dirname,URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-menu-badges-source.cjs'?inverse:n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-menu-badges-reviewed-input.cjs'?history:assert.fail(n)});
 assert.ok(synced);assert.equal(protocol.readOnly,history.readOnly);
 for(const name of files){const url=new URL(name,root),source=raw(name),expected=project(source,name);
  for(const file of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){
   const want=encoding?expected.toString():expected;assert.deepEqual(fake.readFileSync(file,encoding),want);
   assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
  }same(raw(name),source);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));assert.deepEqual(await fake.promises.readFile(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile(42,(e,b)=>{assert.equal(e,null);assert.deepEqual(b,Buffer.from('fd'));resolve()}));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller callback threw');let calls=0;assert.throws(()=>fake.readFile(new URL('hani-main.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-main.js'],pin=row.beforeSha256,url=new URL('hani-main.js',root);
 try{row.beforeSha256='0'.repeat(64);assert.throws(()=>fake.readFileSync(url),/exact pre-menu-badges output/);await new Promise(resolve=>fake.readFile(url,(e,b)=>{assert.match(e.message,/exact pre-menu-badges output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(url),/exact pre-menu-badges output/)}finally{row.beforeSha256=pin}
 const target=fileURLToPath(url),original=originals.get(target),drift=Buffer.concat([original,Buffer.from('\n')]);
 try{originals.set(target,drift);assert.deepEqual(fake.readFileSync(url),drift);assert.deepEqual(await fake.promises.readFile(url),drift)}finally{originals.set(target,original)}
});

test('menu ->306 ->helper ->305 ->304 ->UI ->303 captures equal independent Git runtime boundaries',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});
 const historical=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>project(raw(f),f)});
 assert.equal(closure.files.length,174);assert.deepEqual(closure.missing,[]);assert.deepEqual(historical.files,closure.files);assert.deepEqual(historical.missing,[]);
 for(const file of closure.files){
  const source=raw(file),preMenu=project(source,file),pre306=release306.project(preMenu,file),preHelper=helper.project(pre306,file),pre305=release305.project(preHelper,file),pre304=release304.project(pre305,file),preUI=ui.project(pre304,file);
  same(source,gitBytes(layer.head,file),file+' raw HEAD');same(preMenu,gitBytes(layer.base,file),file+' main306');
  same(preHelper,gitBytes(helper.layer.base,file),file+' main305');same(pre305,gitBytes(release305.layer.base,file),file+' pre305');same(preUI,gitBytes(release304.layer.base,file),file+' preUI');
  for(const [adapter,want]of [[release306,preMenu],[helper,pre306],[release305,preHelper],[release304,pre305],[ui,pre304],[release303,preUI]])same(adapter.readRawFileSync(new URL(file,root)),want,file+' ordered capture');
 }
});

test('all prior fixtures assertion bodies protected context and runtime bytes are preserved',()=>{
 function walk(tree,prefix){for(const row of repository.tree(tree)){const file=prefix+row.name;if(row.mode==='40000')walk(row.sha,file+'/');else same(raw(file),repository.object(row.sha).data,file+' unchanged fixture')}}
 const scripts=repository.tree(repository.commit(layer.head).tree).find(r=>r.name==='scripts');
 walk(repository.tree(scripts.sha).find(r=>r.name==='fixtures').sha,'scripts/fixtures/');
 for(const row of repository.tree(scripts.sha).filter(r=>r.name.endsWith('.test.mjs'))){
  const file='scripts/'+row.name,source=raw(file).toString(),before=repository.object(row.sha).data.toString();
  assert.ok(source===before||source==="import './hani-menu-badges-preload.cjs'; // Exact menu badge inverse before historical readers.\n"+before,file+' only one import may change');
 }
 same(raw('scripts/hani-context-remote.test.mjs'),gitBytes(layer.head,'scripts/hani-context-remote.test.mjs'));
 for(const file of runtime)same(raw(file),gitBytes(layer.head,file),file+' runtime unmodified');
 for(const file of ['index.html','assets/data/hani-history-releases-v1.json','AGENTS.md'])same(raw(file),gitBytes(layer.head,file),file+' protected/version/history');
});

test('real showView and renderer only access approved menu key and never protected storage or Cloud',()=>{
 const mainSource=raw('hani-main.js').toString(),procSource=raw('hani-procrastination-board.js').toString(),seenTest=raw('scripts/hani-menu-seen.test.mjs').toString();
 const start=seenTest.indexOf('function createStorageMock('),end=seenTest.indexOf("test('NEW badge turns on");assert.ok(start>=0&&end>start);
 const sandbox=vm.createContext({mainSource,procSource,assert,vm});
 vm.runInContext(seenTest.slice(start,end)+'\nthis.load=loadMenuSeenHarness;',sandbox);
 for(const options of [{},{initialStorage:{hani_menu_seen_v1:'{broken'}},{throwOnGet:true,throwOnSet:true}]){
  const h=sandbox.load(options);h.runtimeState.boardPosts=[{id:'p',publishedAt:'2026-11-18T08:00:00+09:00'}];
  h.ctx.renderNavNewBadges();assert.equal(h.storage.calls.setItem.length,0,'render has no writes');
  for(const view of ['home','tasks','study','procrastination'])h.ctx.showView(view);
  assert.equal(h.storage.calls.setItem.length,0,'non NEW navigation has no writes');
  for(const view of ['board','ilbo','newsroom'])assert.doesNotThrow(()=>h.ctx.showView(view));
  assert.equal(h.storage.calls.setItem.length,3,'only explicit NEW navigation writes');
  assert.ok(h.storage.calls.getItem.every(k=>k==='hani_menu_seen_v1'));
  assert.ok(h.storage.calls.setItem.every(c=>c.key==='hani_menu_seen_v1'));
  assert.equal(h.storage.calls.removeItem.length,0);assert.equal(h.storage.calls.clear.length,0);
 }
 const added=Object.entries(layer.files).filter(([f])=>runtime.includes(f)).flatMap(([,r])=>r.replacements.map(e=>e.after)).join('\n');
 assert.doesNotMatch(added,/hani_os_life_v23|sessionStorage|removeItem|localStorage\.clear|supabase|\bfetch\s*\(|\bcloud\w*\s*\(/i);
 assert.deepEqual([...added.matchAll(/localStorage\.(\w+)\(([^,)]+)/g)].map(m=>[m[1],m[2]]),[['getItem','MENU_SEEN_KEY'],['setItem','MENU_SEEN_KEY']]);
 assert.match(added,/const MENU_SEEN_KEY="hani_menu_seen_v1";/);
});
