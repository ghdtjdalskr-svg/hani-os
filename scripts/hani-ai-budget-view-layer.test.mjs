import view from './hani-ai-budget-view-source.cjs';
import reviewed from './hani-ai-budget-view-reviewed-input.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const require=createRequire(import.meta.url),root=new URL('../',import.meta.url),dirname=fileURLToPath(new URL('.',import.meta.url));
const {layer,hash,restore,project,readRawFileSync:read}=view,raw=f=>read(new URL(f,root));
function gitBytes(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' Git entry');tree=row.sha}return repository.object(tree).data}

test('frozen budget view inverse and forward replay match independent tooling-308 / HEAD Git bytes',()=>{
 assert.equal(layer.head,'ee3e652399f9b8e83ade662d2146f090216c2f92');assert.equal(layer.base,'28065ff8f62546568dd4851ae7ee3d810f31a0bf');
 assert.deepEqual(Object.keys(layer.files).sort(),['hani-ai-budget.css','hani-ai-budget.js','hani-main.js','hani-newsroom-4cut.js','index.html','scripts/hani-release-308-source.cjs']);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(before,gitBytes(file.startsWith('scripts/')?layer.head:layer.base,file));
  if(!file.startsWith('scripts/'))assert.deepEqual(source,gitBytes(layer.head,file));
  else assert.equal(source.toString(),layer.bootstrap.line+gitBytes(layer.head,file).toString());
  assert.equal(restore(source.toString(),file),before.toString());assert.deepEqual(project(source,file),before);
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){assert.equal(forward.slice(edit.beforeStart,edit.beforeStart+edit.before.length),edit.before);forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length)}assert.equal(forward,source.toString());
 }
});

test('inverse rejects drift, stale bytes, repeated application, wrong EOL, spans, counts and fixture tampering',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString();
  for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){assert.notEqual(source,bad);assert.throws(()=>restore(bad,file));assert.strictEqual(project(bad,file),bad)}
  const pin=row.beforeSha256,count=row.count,start=row.replacements[0].start;
  try{row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(raw(file),file),/exact pre-view output/);row.beforeSha256=pin;row.count++;assert.throws(()=>restore(raw(file),file),/edit count/);row.count=count;row.replacements[0].start=-1;assert.throws(()=>restore(raw(file),file),/edit bounds/)}finally{row.beforeSha256=pin;row.count=count;row.replacements[0].start=start}
 }
 for(const file of ['unknown','__proto__','constructor','hani-ai-budget-core.js']){const bytes=Buffer.from('unrelated');assert.strictEqual(project(bytes,file),bytes);assert.throws(()=>restore(bytes,file),/known ai-budget-view owner/)}
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-ai-budget-view-source.cjs').toString(),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/ai-budget-view-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen ai-budget-view fixture/);
});

test('reviewed input checks every complete owner and real refs, leaving unrelated repository queries actual',()=>{
 const query=['merge-base','HEAD','origin/main'];assert.equal(reviewed.rawReadOnly(query),layer.base);assert.equal(reviewed.readOnly(query),layer.release);
 for(const file of [...Object.keys(layer.files),...Object.keys(layer.owners)]){
  const target=fileURLToPath(new URL(file,root)),source=raw(file);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1)])assert.equal(reviewed.selectBase(layer.base,f=>f===target?bad:read(f)),layer.base,file+' drift cannot select historical base');
 }
 for(const base of [layer.release,'0'.repeat(40)])assert.equal(reviewed.selectBase(base,()=>assert.fail('unrelated base reads owners')),base);
 assert.throws(()=>reviewed.selectBase(layer.base,()=>{throw Error('read failure')}),/read failure/);
 for(const args of [['rev-parse','HEAD'],['rev-parse','origin/main'],['show',layer.base+':hani-main.js'],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.base]])assert.equal(reviewed.readOnly(args),reviewed.rawReadOnly(args));
 assert.throws(()=>reviewed.readOnly(['merge-base','origin/main','HEAD']));
 const module={exports:{}};let remote=layer.base;
 vm.runInNewContext(raw('scripts/hani-ai-budget-view-reviewed-input.cjs').toString(),{__dirname:dirname,module,require:n=>n==='./hani-test-repository-evidence.cjs'?{...repository,reference:name=>name==='HEAD'?'f'.repeat(40):name==='origin/main'?remote:repository.reference(name)}:n==='./hani-ai-budget-view-source.cjs'?view:n==='node:fs'?fs:n==='node:path'?path:assert.fail(n)});
 assert.equal(module.exports.selectBase(layer.base),layer.release,'tooling-only HEAD advance with the same owners remains testable');
 remote='0'.repeat(40);assert.equal(module.exports.selectBase(layer.base,()=>assert.fail('moved remote reads owners')),layer.base,'remote drift cannot authorize frozen input');
});

test('preload preserves sync/callback/promise, URL/string, Buffer/text/fd and original errors',async()=>{
 const originals=new Map(Object.keys(layer.files).map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString():bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false;const protocol={};
 vm.runInNewContext(raw('scripts/hani-ai-budget-view-preload.cjs').toString(),{__dirname:dirname,URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-ai-budget-view-source.cjs'?view:n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-ai-budget-view-reviewed-input.cjs'?reviewed:assert.fail(n)});
 assert.ok(synced);assert.equal(protocol.readOnly,reviewed.readOnly);
 for(const name of Object.keys(layer.files))for(const file of [new URL(name,root),fileURLToPath(new URL(name,root))])for(const encoding of [undefined,'utf8']){
  const expected=project(raw(name),name),want=encoding?expected.toString():expected;assert.deepEqual(fake.readFileSync(file,encoding),want);assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));assert.deepEqual(await fake.promises.readFile(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 let calls=0;const thrown=new Error('caller error');assert.throws(()=>fake.readFile(new URL('hani-main.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-main.js'],pin=row.beforeSha256;try{row.beforeSha256='0'.repeat(64);await new Promise(resolve=>fake.readFile(new URL('hani-main.js',root),(e,b)=>{assert.match(e.message,/exact pre-view output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(new URL('hani-main.js',root)),/exact pre-view output/)}finally{row.beforeSha256=pin}
});

test('actual budget renderer and existing save events keep identical summary writes and zero new/life/Cloud access',async()=>{
 const core=require('../hani-ai-budget-core.js'),now=Date.now(),at=d=>new Date(now+d).toISOString(),KEY='hani_ai_budget_summary_v1';
 class FixedDate extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
 const account={id:'codex-1',provider:'codex',source:'manual',observedAt:at(-1000),windows:[{kind:'weekly',usedPercent:35,resetsAt:at(3600000)}]},seed=core.normalize({schemaVersion:1,accounts:[account]});
 async function scenario(source,initial=JSON.stringify(seed),failWrite=false){
  const nodes=new Map(),writes=[],accesses=[],timers=[],events={},storage=new Map([[KEY,initial],['hani_os_life_v23','LIFE_UNTOUCHED']]);let payload={schemaVersion:1,accounts:[{...account,observedAt:at(0)}]},failure=false;
  const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,classList:{contains:()=>true},handlers:{},addEventListener(t,fn){this.handlers[t]=fn},focus(){}});return nodes.get(id)};
  const check=key=>{accesses.push(key);assert.equal(key,KEY,'only existing budget summary key may be accessed')};
  const context=vm.createContext({window:{HaniAiBudgetCore:core},document:{getElementById:node,addEventListener(t,fn){events[t]=fn}},localStorage:{getItem(k){check(k);return storage.get(k)??null},setItem(k,v){check(k);writes.push([k,v]);if(failWrite)throw Error('storage unavailable');storage.set(k,v)},removeItem(){assert.fail('remove')},clear(){assert.fail('clear')}},Date:FixedDate,Intl,AbortController,setInterval(fn){timers.push(fn)},setTimeout(){return 1},clearTimeout(){},fetch:async(url,options)=>{assert.equal(url,'http://127.0.0.1:8794/api/ai-budget');assert.equal(options.method,'GET');if(failure)throw Error('offline');return {ok:true,text:async()=>JSON.stringify(payload)}}});
  Object.defineProperty(context.window,'supabase',{get(){assert.fail('Cloud access')}});
  vm.runInContext(source,context);assert.equal(writes.length,0,'mount read only');
  for(const fn of timers)fn();events.visibilitychange();context.window.HaniAiBudget?.render();assert.equal(writes.length,0,'timer, visibility and home render read only');
  await node('aiBudgetRefresh').handlers.click();assert.equal(writes.length,1);
  const saved=storage.get(KEY);failure=true;await node('aiBudgetRefresh').handlers.click();assert.equal(writes.length,1);assert.equal(storage.get(KEY),saved,'failed fetch preserves summary');failure=false;
  node('aiBudgetAccount').value='codex-1';node('budget-session-used').value='25';node('budget-session-reset').value='';node('aiBudgetForm').handlers.submit({preventDefault(){}});assert.equal(writes.length,2);
  payload={schemaVersion:1,accounts:[{...account,observedAt:at(0),windows:[{kind:'weekly',usedPercent:60,resetsAt:at(7200000)}]}]};
  const imported=text=>node('aiBudgetImport').handlers.change({target:{files:[{size:1000,text:async()=>text}],value:'fixture'}});
  await imported(JSON.stringify(payload));assert.equal(writes.length,3);
  const count=writes.length;await imported('{bad');node('budget-session-used').value='bad';node('aiBudgetForm').handlers.submit({preventDefault(){}});assert.equal(writes.length,count,'invalid input writes zero');
  for(const [key,text]of writes){assert.equal(key,KEY);assert.deepEqual(JSON.parse(text),core.normalize(JSON.parse(text),now));assert.deepEqual(Object.keys(JSON.parse(text)).sort(),['accounts','schemaVersion'])}
  assert.equal(storage.get('hani_os_life_v23'),'LIFE_UNTOUCHED');assert.ok(accesses.length);return {writes,stored:storage.get(KEY)};
 }
 const current=raw('hani-ai-budget.js').toString(),before=restore(current,'hani-ai-budget.js');
 assert.equal(current.match(/function save\(next\)\{[^\n]+/)[0],before.match(/function save\(next\)\{[^\n]+/)[0],'canonical save body unchanged');
 assert.equal((current.match(/localStorage\.setItem\(/g)||[]).length,1);assert.doesNotMatch(current,/hani_os_life_v23|supabase|localStorage\.(?:clear|removeItem)/);
 assert.deepEqual(await scenario(current),await scenario(before),'all successful serialized writes equal pre-view baseline');
 assert.deepEqual(await scenario(current,'{invalid'),await scenario(before,'{invalid'),'corrupt saved summary retained until explicit save');
 assert.deepEqual(await scenario(current,JSON.stringify(seed),true),await scenario(before,JSON.stringify(seed),true),'storage failure keeps same memory-only save path');
 assert.deepEqual(raw('hani-ai-budget-core.js'),gitBytes(layer.base,'hani-ai-budget-core.js'));assert.deepEqual(raw('scripts/hani-ai-budget-bridge.mjs'),gitBytes(layer.base,'scripts/hani-ai-budget-bridge.mjs'));
});

test('all existing tests, fixtures, runtime and protected owners retain independent HEAD bytes',async()=>{
 const scripts=repository.tree(repository.commit(layer.head).tree).find(r=>r.name==='scripts');
 for(const row of repository.tree(scripts.sha).filter(r=>r.name.endsWith('.test.mjs')))assert.deepEqual(raw('scripts/'+row.name),repository.object(row.sha).data,row.name+' original assertions');
 function walk(tree,prefix){for(const row of repository.tree(tree)){const file=prefix+row.name;if(row.mode==='40000')walk(row.sha,file+'/');else assert.deepEqual(raw(file),repository.object(row.sha).data,file+' original bytes')}}
 walk(repository.tree(scripts.sha).find(r=>r.name==='fixtures').sha,'scripts/fixtures/');
 for(const [file,pin]of Object.entries(layer.owners))assert.equal(hash(raw(file)),pin,file+' frozen owner');
 for(const file of ['AGENTS.md','scripts/hani-context-remote.test.mjs','scripts/hani-runtime-closure.mjs','scripts/hani-release-package.mjs','scripts/hani-release-preqa.mjs','scripts/hani-ci-scope.mjs','scripts/hani-board-library-build.mjs'])assert.deepEqual(raw(file),gitBytes(layer.head,file));
 for(const prefix of ['.github','dev-center','supabase']){const row=repository.tree(repository.commit(layer.head).tree).find(r=>r.name===prefix);if(row)walk(row.sha,prefix+'/')}
 for(const row of repository.tree(scripts.sha).filter(r=>r.name.startsWith('hani-one-pass-')&&r.name.endsWith('.mjs')))assert.deepEqual(raw('scripts/'+row.name),repository.object(row.sha).data);
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});assert.equal(closure.files.length,layer.closureCount);assert.deepEqual(closure.missing,[]);
 for(const file of closure.files)assert.deepEqual(raw(file),gitBytes(layer.head,file),file+' actual runtime unchanged');
 assert.deepEqual(raw('assets/data/hani-history-releases-v1.json'),gitBytes(layer.head,'assets/data/hani-history-releases-v1.json'));
});

test('real bootstrap capture order is ai-budget-view ->308 ->v2data ->Phase2 ->Phase1 ->307',async()=>{
 const release=require('./hani-release-308-source.cjs'),v2=require('./hani-building-v2data-source.cjs'),phase2=require('./hani-building-phase2-source.cjs'),phase1=require('./hani-building-phase1-source.cjs');
 // The frozen308 inverse also restores the307 CJS bootstrap text; install its
 // canonical Phase1 preload before requiring that projected source explicitly.
 require('./hani-building-phase1-preload.cjs');
 const r307=require('./hani-release-307-source.cjs');
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});
 for(const file of closure.files){const source=raw(file),preView=project(source,file),pre308=release.project(preView,file),preV2=v2.project(pre308,file),preP2=phase2.project(preV2,file),preP1=phase1.project(preP2,file);
  assert.deepEqual(preView,gitBytes(layer.base,file),file+' exact pre-view tooling308');
  assert.deepEqual(preP1,gitBytes(release.layer.base,file),file+' exact307 after all building inverses');
  for(const [adapter,expected]of [[release,preView],[v2,pre308],[phase2,preV2],[phase1,preP2],[r307,preP1]])assert.equal(hash(adapter.readRawFileSync(new URL(file,root))),hash(expected),file+' '+adapter.layer.layer+' capture ordering');
 }
});
