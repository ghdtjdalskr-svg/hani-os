import attendance from './hani-attendance-source.cjs';
import reviewed from './hani-attendance-reviewed-input.cjs';
import repository from './hani-test-repository-evidence.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const require=createRequire(import.meta.url),root=new URL('../',import.meta.url),dirname=fileURLToPath(new URL('.',import.meta.url));
const {layer,hash,restore,project,readRawFileSync:read}=attendance,raw=f=>read(new URL(f,root));
const actualOrigin=reviewed.actualReference('origin/main');
function gitBytes(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}return repository.object(tree).data}

test('attendance removes exactly four wiring lines and one tooling import, with independent Git replay',()=>{
 assert.equal(layer.base,'6ed927a3de99f4f32d05bae1c160ea07685eb65b');
 assert.deepEqual(Object.keys(layer.files).sort(),['hani-main.js','index.html','scripts/hani-release-309-source.cjs']);
 for(const [file,row]of Object.entries(layer.files)){
  const after=raw(file),before=restore(after,file);assert.deepEqual(before,gitBytes(layer.base,file));
  assert.equal(restore(after.toString(),file),before.toString());assert.deepEqual(project(after,file),before);
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart)){assert.equal(edit.before,'');forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart)}assert.equal(forward,after.toString());
 }
 assert.equal(layer.files['hani-main.js'].count,1);assert.equal(layer.files['index.html'].count,3);assert.equal(layer.files[layer.bootstrap.file].count,1);
 assert.equal(raw(layer.bootstrap.file).toString(),layer.bootstrap.line+gitBytes(layer.base,layer.bootstrap.file).toString());
 for(const [file,pin]of Object.entries(layer.prelanded)){assert.equal(hash(raw(file)),pin);assert.deepEqual(raw(file),gitBytes(layer.head,file));assert.strictEqual(project(raw(file),file).toString(),raw(file).toString())}
});

test('inverse rejects stale, partial, duplicate, EOL, span/count and frozen fixture drift',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString();for(const bad of [source+'\n',source.slice(1),source+source,restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){assert.notEqual(bad,source);assert.throws(()=>restore(bad,file));assert.strictEqual(project(bad,file),bad)}
  const pin=row.beforeSha256,count=row.count,start=row.replacements[0].start;
  try{row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(source,file),/exact pre-attendance output/);row.beforeSha256=pin;row.count++;assert.throws(()=>restore(source,file),/edit count/);row.count=count;row.replacements[0].start=-1;assert.throws(()=>restore(source,file),/edit bounds/)}finally{row.beforeSha256=pin;row.count=count;row.replacements[0].start=start}
 }
 for(const file of ['unknown','__proto__','constructor','hani-attendance-core.js']){const source=Buffer.from('unrelated');assert.strictEqual(project(source,file),source);assert.throws(()=>restore(source,file),/known attendance owner/)}
 assert.throws(()=>vm.runInNewContext(raw('scripts/hani-attendance-source.cjs').toString(),{__dirname:dirname,require:n=>n==='node:fs'?{readFileSync:()=>Buffer.concat([raw('scripts/fixtures/attendance-layer.json'),Buffer.from('\n')])}:n==='node:path'?path:n==='node:assert/strict'?assert:n==='node:crypto'?{createHash}:assert.fail(n)}),/frozen attendance fixture/);
});

test('preload preserves sync/callback/promise URL/string Buffer/text/fd and error contracts',async()=>{
 const names=[...Object.keys(layer.files),...Object.keys(layer.prelanded),'hani-ai-budget.js'];
 const originals=new Map(names.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString():bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false,installed=0;
 vm.runInNewContext(raw('scripts/hani-attendance-preload.cjs').toString(),{__dirname:dirname,URL,require:n=>n==='node:fs'?fake:n==='node:path'?path:n==='node:url'?{fileURLToPath}:n==='node:module'?{syncBuiltinESMExports(){synced=true}}:n==='./hani-attendance-source.cjs'?attendance:n==='./hani-attendance-reviewed-input.cjs'?{installHistoricalInputs(){installed++}}:assert.fail(n)});
 assert.ok(synced);assert.equal(installed,1);
 for(const name of names)for(const file of [new URL(name,root),fileURLToPath(new URL(name,root))])for(const encoding of [undefined,'utf8']){const expected=project(raw(name),name),want=encoding?expected.toString():expected;assert.deepEqual(fake.readFileSync(file,encoding),want);assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want)}
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));assert.deepEqual(await fake.promises.readFile(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile('error'),e=>e===error);
 const thrown=new Error('caller');let calls=0;assert.throws(()=>fake.readFile(new URL('hani-main.js',root),()=>{calls++;throw thrown}),e=>e===thrown);assert.equal(calls,1);
 const row=layer.files['hani-main.js'],pin=row.beforeSha256;try{row.beforeSha256='0'.repeat(64);await new Promise(resolve=>fake.readFile(new URL('hani-main.js',root),(e,b)=>{assert.match(e.message,/exact pre-attendance output/);assert.equal(b,undefined);resolve()}));await assert.rejects(fake.promises.readFile(new URL('hani-main.js',root)),/exact pre-attendance output/)}finally{row.beforeSha256=pin}
});

test('reviewed boundary gates complete owners and leaves actual Git evidence accessible',()=>{
 const query=['merge-base','HEAD','origin/main'],base=reviewed.actualReadOnly(query).trim();
 assert.ok(base===layer.base||base===actualOrigin);assert.equal(reviewed.acceptsRemote(actualOrigin),true);
 assert.equal(reviewed.selectBase(base),layer.release);assert.equal(reviewed.readOnly(query),layer.release);
 for(const file of [...Object.keys(layer.files),...Object.keys(layer.prelanded),'hani-office-live.js','scripts/hani-attendance-board.test.mjs','scripts/hani-context-remote.test.mjs','scripts/fixtures/release-309-layer.json','AGENTS.md','dev-center/codemap.json']){
  assert.ok(layer.files[file]||layer.prelanded[file]||layer.owners[file]);const target=fileURLToPath(new URL(file,root)),source=raw(file);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1)])assert.equal(reviewed.selectBase(base,f=>f===target?bad:read(f)),base,file+' complete owner drift');
 }
 assert.equal(reviewed.selectBase('0'.repeat(40),()=>assert.fail('unrelated reads')), '0'.repeat(40));
 assert.throws(()=>reviewed.selectBase(base,()=>{throw Error('read failure')}),/read failure/);
 for(const args of [['rev-parse','HEAD'],['show',layer.base+':hani-main.js'],['log','--first-parent','--format=%H%x09%s','origin/main'],['diff-tree','--no-commit-id','--name-only','-r',layer.base]])assert.equal(reviewed.readOnly(args),reviewed.actualReadOnly(args));
 assert.equal(repository.reference('origin/main'),actualOrigin,'adapter import alone does not install historical refs');
 assert.throws(()=>reviewed.readOnly(['merge-base','origin/main','HEAD']));
});

test('main may contain exactly the three prelanded files or none; partial, changed and unrelated trees fail closed',()=>{
 const baseTop=repository.tree(repository.commit(layer.base).tree),headTop=repository.tree(repository.commit(layer.head).tree);
 const extras=Object.keys(layer.prelanded).map(name=>headTop.find(r=>r.name===name));
 function isolated(top){
  const module={exports:{}},remote='f'.repeat(40),tree='e'.repeat(40),protocol={...repository,commit:ref=>ref===remote?{tree}:repository.commit(ref),tree:sha=>sha===tree?top:repository.tree(sha)};
  vm.runInNewContext(raw('scripts/hani-attendance-reviewed-input.cjs').toString(),{__dirname:dirname,module,require:n=>n==='./hani-test-repository-evidence.cjs'?protocol:n==='./hani-attendance-source.cjs'?attendance:n==='node:path'?path:n==='node:fs'?fs:assert.fail(n)});
  return {adapter:module.exports,remote};
 }
 for(const top of [baseTop,[...baseTop,...extras]]){const {adapter,remote}=isolated(top);assert.equal(adapter.acceptsRemote(remote),true);assert.equal(adapter.selectBase(layer.base,read,remote),layer.release)}
 const changed=baseTop.map(r=>r.name==='hani-main.js'?{...r,sha:extras[0].sha}:r);
 for(const top of [[...baseTop,extras[0]],[...baseTop,...extras.slice(1)],baseTop.slice(1),changed,[...baseTop,...extras,{...extras[0],name:'unrelated.js'}],[...baseTop,...extras.map((r,i)=>i? r:{...r,mode:'100755'})]]){const {adapter,remote}=isolated(top);assert.equal(adapter.acceptsRemote(remote),false);assert.equal(adapter.selectBase(layer.base,()=>assert.fail('unreviewed tree reads owners'),remote),layer.base)}
 assert.equal(reviewed.acceptsRemote(layer.head),false,'attendance wiring is not an unreferenced preland');
});

test('all original test assertions, fixtures, runtime and protected files match independent Git bytes',()=>{
 const top=repository.tree(repository.commit(layer.head).tree),scripts=repository.tree(top.find(r=>r.name==='scripts').sha);
 for(const row of scripts.filter(r=>r.name.endsWith('.test.mjs')))assert.deepEqual(raw('scripts/'+row.name),repository.object(row.sha).data,row.name+' unchanged');
 function walk(tree,prefix){for(const row of repository.tree(tree)){const file=prefix+row.name;if(row.mode==='40000')walk(row.sha,file+'/');else assert.deepEqual(raw(file),repository.object(row.sha).data,file+' preserved')}}
 walk(scripts.find(r=>r.name==='fixtures').sha,'scripts/fixtures/');for(const name of ['.github','dev-center','supabase'])walk(top.find(r=>r.name===name).sha,name+'/');
 for(const file of ['AGENTS.md','.gitignore','scripts/hani-context-remote.test.mjs','scripts/hani-runtime-closure.mjs','scripts/hani-release-package.mjs','scripts/hani-release-preqa.mjs','scripts/hani-ci-scope.mjs','scripts/hani-board-library-build.mjs'])assert.deepEqual(raw(file),gitBytes(layer.head,file));
 for(const row of scripts.filter(r=>r.name.startsWith('hani-one-pass-')&&r.name.endsWith('.mjs')))assert.deepEqual(raw('scripts/'+row.name),repository.object(row.sha).data);
 for(const [file,pin]of Object.entries(layer.owners)){assert.equal(hash(raw(file)),pin,file+' gated');assert.deepEqual(raw(file),gitBytes(layer.head,file))}
 const helper='scripts/hani-menu-badges-historical-input.cjs',source=raw(helper).toString(),block=source.match(/ \/\/ attendance outer boundaries\r?\n[\s\S]*? \/\/ attendance outer boundaries end\r?\n/);
 assert.ok(block,'one explicit outer registration block');assert.equal(source.replace(block[0],''),gitBytes(layer.head,helper).toString());
 for(const file of ['scripts/hani-attendance-board.test.mjs','scripts/hani-attendance-core.test.mjs','scripts/hani-attendance-layout.test.mjs','scripts/hani-attendance-layer.test.mjs','scripts/fixtures/attendance-layer.json'])assert.ok(block[0].includes("['"+file+"','"+hash(raw(file))+"']"),file+' exact outer pin');
});

function safetyDom(){
 function element(tag){
  const classes=new Set(),attrs=new Map(),listeners=new Map();
  const el={tagName:tag.toUpperCase(),children:[],parentNode:null,style:{},hidden:false,disabled:false,textContent:'',
   get id(){return attrs.get('id')||''},set id(v){attrs.set('id',v)},get className(){return [...classes].join(' ')},set className(v){classes.clear();for(const c of v.split(/\s+/))if(c)classes.add(c)},
   classList:{contains:c=>classes.has(c),add(...cs){cs.forEach(c=>classes.add(c))},toggle(c,force){const on=force===undefined?!classes.has(c):!!force;on?classes.add(c):classes.delete(c);return on}},
   setAttribute(k,v){attrs.set(k,String(v))},getAttribute:k=>attrs.get(k)??null,removeAttribute:k=>attrs.delete(k),
   append(...nodes){nodes.forEach(n=>el.insertBefore(n,null))},insertBefore(node,ref){if(node.parentNode)node.parentNode.children.splice(node.parentNode.children.indexOf(node),1);node.parentNode=el;let i=ref?el.children.indexOf(ref):-1;if(i<0)i=el.children.length;el.children.splice(i,0,node);return node},
   get nextElementSibling(){return el.parentNode?.children[el.parentNode.children.indexOf(el)+1]||null},
   contains(target){return target===el||el.children.some(c=>c.contains(target))},addEventListener(t,fn){assert.ok(!listeners.has(t),'one canonical '+t+' handler');listeners.set(t,fn)},click(){listeners.get('click')?.({target:el})}};
  return el;
 }
 const home=element('section');home.id='home';const actions=element('div');actions.id='homeActions';home.append(actions);
 const find=(node,id)=>node.id===id?node:node.children.map(n=>find(n,id)).find(Boolean)||null;
 return {home,actions,document:{createElement:element,getElementById:id=>find(home,id)}};
}
test('actual board render and stamp events access only attendance storage; affinity and Cloud are isolated',()=>{
 const coreSource=raw('hani-attendance-core.js').toString(),boardSource=raw('hani-attendance-board.js').toString();
 assert.doesNotMatch(coreSource+boardSource,/hani_os_life_v23|hani_office_affinity_v1|removeItem|\.clear\(|supabase|cloudClient|fetch\(|XMLHttpRequest/);
 for(const mode of ['normal','corrupt','quota','blocked']){
  const dom=safetyDom(),accesses=[],writes=[],affinity=[],violations=[];let day=0;
  const store=new Map([['hani_attendance_v1',mode==='corrupt'?'{broken':null],['hani_os_life_v23','LIFE_UNTOUCHED'],['hani_office_affinity_v1','AFFINITY_UNTOUCHED']]);
  class Clock extends Date{constructor(...args){super(...(args.length?args:[Date.UTC(2026,10,16+day,12)]))}static now(){return Date.UTC(2026,10,16+day,12)}}
  const check=k=>{accesses.push(k);if(k!=='hani_attendance_v1'){violations.push(k);throw Error('forbidden key')}};
  const localStorage={getItem(k){check(k);if(mode==='blocked')throw Error('blocked');return store.get(k)??null},setItem(k,v){check(k);writes.push([k,v]);if(mode==='quota')throw Error('quota');store.set(k,v)},removeItem(){violations.push('remove')},clear(){violations.push('clear')}};
  const api=Object.freeze({get(id){affinity.push(['get',id]);return 0}});
  const ctx=vm.createContext({Date:Clock,document:dom.document,localStorage,HaniOfficeAffinity:api});ctx.window=ctx;ctx.globalThis=ctx;
  for(const key of ['supabase','cloudClient','fetch','XMLHttpRequest'])Object.defineProperty(ctx,key,{get(){violations.push(key);throw Error('Cloud forbidden')}});
  vm.runInContext(coreSource,ctx);vm.runInContext(boardSource,ctx);const board=ctx.HaniAttendanceBoard;
  board.render();const slot=dom.document.getElementById('attendanceBoard'),button=slot?._attRefs.btn;assert.ok(slot&&button);
  for(let i=0;i<3;i++)board.render();assert.equal(writes.length,0,'mount and repeat render are read only');assert.equal(store.get('hani_attendance_v1'),mode==='corrupt'?'{broken':null);
  for(day=0;day<30;day++){
   board.render();const before=writes.length;button.click();assert.equal(writes.length,before+1,'one attendance save attempt per first click');button.click();board.render();assert.equal(writes.length,before+1,'same-day click and render never save again');
   assert.strictEqual(dom.document.getElementById('attendanceBoard'),slot,'persistent slot');assert.strictEqual(slot._attRefs.btn,button,'persistent button');
  }
  assert.equal(dom.home.children.filter(n=>n.id==='attendanceBoard').length,1);assert.strictEqual(slot.nextElementSibling,dom.actions);
  for(const [key,text]of writes){assert.equal(key,'hani_attendance_v1');assert.equal(JSON.parse(text).v,1)}
  assert.ok(accesses.length);assert.deepEqual(violations,[]);assert.deepEqual(affinity,[],'current runtime announces affinity only; it does not award +2');
  assert.equal(store.get('hani_os_life_v23'),'LIFE_UNTOUCHED');assert.equal(store.get('hani_office_affinity_v1'),'AFFINITY_UNTOUCHED');
  if(mode==='normal'||mode==='corrupt'){const saved=JSON.parse(store.get('hani_attendance_v1'));assert.deepEqual(saved.unlocked,[3,7,14,30]);assert.equal(saved.days.length,30);assert.equal(saved.lastBonusDay,'2026-11-22')}
 }
});

test('raw closure177 projects to174 before309 and the real capture chain preserves independent runtime bytes',async()=>{
 const exists=f=>fs.existsSync(new URL(f,root)),closure=await resolveRuntimeClosure({exists,read:raw}),before=await resolveRuntimeClosure({exists,read:f=>project(raw(f),f)});
 assert.equal(closure.files.length,177);assert.deepEqual(closure.missing,[]);assert.equal(before.files.length,174);assert.deepEqual(before.missing,[]);
 assert.deepEqual(closure.files.filter(f=>!before.files.includes(f)).sort(),Object.keys(layer.prelanded).sort());
 require('./hani-release-309-preload.cjs');const release=require('./hani-release-309-source.cjs'),view=require('./hani-ai-budget-view-source.cjs'),r308=require('./hani-release-308-source.cjs');
 for(const file of before.files){const bytes=project(raw(file),file);assert.deepEqual(bytes,gitBytes(layer.base,file));assert.deepEqual(release.readRawFileSync(new URL(file,root)),bytes,'309 captures attendance output');assert.deepEqual(view.readRawFileSync(new URL(file,root)),release.project(bytes,file),'view captures309 output');assert.deepEqual(r308.readRawFileSync(new URL(file,root)),view.project(release.project(bytes,file),file),'308 captures view output')}
 assert.equal(reviewed.actualReference('origin/main'),actualOrigin,'actual Git ref stays actual after installation');
});
