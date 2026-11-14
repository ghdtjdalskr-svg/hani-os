import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolveRuntimeClosure} from '../../scripts/hani-runtime-closure.mjs';
import repository from '../../scripts/hani-test-repository-evidence.cjs';
// Raw disk audit, independently of the legacy inverse chain.
const root=path.resolve(import.meta.dirname,'../..'),base='7a91982de08a54452f6b9057f906d651f63a65ca';
const read=f=>fs.readFileSync(path.join(root,f)),hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(read('artifacts/helper-toggle/baseline.json'));
const runtime=f=>/^(?:[^/]+\.(?:js|css)|index\.html|assets\/|data\/)/.test(f),rows=[];
function visit(tree,prefix=''){
 for(const row of repository.tree(tree)){
  const f=prefix+row.name;
  if(row.mode==='40000'){if(prefix||['assets','data'].includes(f))visit(row.sha,f+'/');}
  else if(runtime(f))rows.push({file:f,before:hash(repository.object(row.sha).data),after:hash(read(f))});
 }
}
visit(repository.commit(base).tree);
const scriptsTree=repository.tree(repository.commit(base).tree).find(r=>r.name==='scripts').sha;
const scriptRows=repository.tree(scriptsTree),frozenFixtureRows=[];
function inspectFixtures(tree,prefix){
 for(const row of repository.tree(tree)){
  const f=prefix+row.name;
  if(row.mode==='40000')inspectFixtures(row.sha,f+'/');
  else {assert.deepEqual(read(f),repository.object(row.sha).data,'complete frozen fixture '+f);frozenFixtureRows.push(f);}
 }
}
inspectFixtures(scriptRows.find(r=>r.name==='fixtures').sha,'scripts/fixtures/');
const allTestRows=scriptRows.filter(r=>r.mode!=='40000'&&/[.-]test\.[cm]?js$/.test(r.name));
for(const row of allTestRows){
 const raw=read('scripts/'+row.name).toString(),before=repository.object(row.sha).data.toString();
 const actual=['hani-helper-bot.test.mjs','hani-fun-chat-fortune.test.mjs'].includes(row.name)?raw.replace("import './hani-helper-toggle-preload.cjs';\n",''):raw;
 assert.equal(actual,before,'all original assertions and inputs preserved '+row.name);
}
const runtimeChanges=rows.filter(r=>r.before!==r.after).map(r=>r.file).sort();
assert.deepEqual(runtimeChanges,['hani-style-08.css','hani-ui-v02992.js']);
for(const [f,pin]of Object.entries(baseline.fixtures))assert.equal(hash(read('scripts/fixtures/'+f)),pin,'existing fixture '+f);
const testChanges=[];
for(const [f,pin]of Object.entries(baseline.tests)){
 const text=read('scripts/'+f).toString();if(hash(text)===pin)continue;testChanges.push(f);
 assert.equal(hash(text.replace("import './hani-helper-toggle-preload.cjs';\n",'')),pin,'sole input import '+f);
}
assert.deepEqual(testChanges.sort(),['hani-fun-chat-fortune.test.mjs','hani-helper-bot.test.mjs']);
for(const f of ['scripts/hani-release-296-source.cjs','scripts/hani-design-polish-1-source.cjs']){
 const text=read(f).toString();assert.equal(text.replace("require('./hani-helper-toggle-preload.cjs');\n",''),repository.read(base,f),'sole preload connection '+f);
}
for(const [f,bytes]of Object.entries(baseline.rootJSON))assert.deepEqual(read(f),Buffer.from(bytes,'base64'),'root JSON '+f);
const ui=read('hani-ui-v02992.js').toString(),old=repository.read(base,'hani-ui-v02992.js');
const block=s=>s.slice(s.indexOf('  function readPosition()'),s.indexOf('  function viewportBox()'));
assert.equal(block(ui),block(old),'position read/write byte-identical');
const newStorage=[...ui.matchAll(/localStorage\.(\w+)\(([^\n;]*)/g)].map(m=>m[0]);
const oldStorage=[...old.matchAll(/localStorage\.(\w+)\(([^\n;]*)/g)].map(m=>m[0]);
assert.deepEqual(newStorage.filter(s=>!s.includes('HIDDEN_KEY')),oldStorage);
assert.equal(newStorage.length-oldStorage.length,2,'only preference read/write added');
for(const token of ['addEventListener(', 'setInterval(', 'setTimeout(', 'MutationObserver(', 'supabase.', 'localStorage.removeItem(', 'localStorage.clear('])assert.equal(ui.split(token).length,old.split(token).length,token);
const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:async f=>read(f)});
const before=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:async f=>repository.read(base,f)});
assert.deepEqual(closure.missing,[]);assert.deepEqual(closure.files,before.files);
const result={base,runtimeFiles:rows.length,runtimeChanges,runtimeHashes:Object.fromEntries(rows.filter(r=>r.before!==r.after).map(r=>[r.file,r.after])),existingTests:allTestRows.length,testChanges,testBodies:'byte-identical except one input import each',existingFixtures:frozenFixtureRows.length,fixtureDrift:[],preloadConnections:2,protectedOwnerChanges:[],positionReadWrite:'byte-identical',newStoragePaths:2,newStorageKey:'hani_helper_hidden_v1',listenersTimersCloudPatternChanges:0,closure:{before:before.files.length,after:closure.files.length,missing:closure.missing},actualEdge:'NOT_RUN',production:'NOT_RUN'};
fs.writeFileSync(path.join(import.meta.dirname,'audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
