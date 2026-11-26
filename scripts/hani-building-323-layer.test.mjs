import layerSource from './hani-building-323-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import fs from 'node:fs';
const require=createRequire(import.meta.url),root=new URL('../',import.meta.url);
const {layer,hash,restore,project,readRawFileSync:read}=layerSource,raw=f=>read(new URL(f,root));
function git(ref,file){let tree=repository.commit(ref).tree;for(const name of file.split('/')){const row=repository.tree(tree).find(r=>r.name===name);assert.ok(row,file+' independent Git entry');tree=row.sha}return repository.object(tree).data}

test('building323 exact inverse returns main bytes and forward replay rebuilds the branch bytes',()=>{
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/sprites-v3/manifest-v3.json','hani-character-archive-data.js','hani-main.js','hani-office-live.css','hani-office-live.js','hani-organization-hub.js','hani-ui-v02992.js','index.html','scripts/hani-board-library-build.mjs','scripts/hani-release-322-source.cjs']);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=restore(source,file);
  assert.deepEqual(before,git(file==='assets/sprites-v3/manifest-v3.json'?layer.seedBase:layer.base,file),file+' independent main origin');
  assert.deepEqual(project(source,file),before);assert.equal(restore(source.toString(),file),before.toString());
  let forward=before.toString();for(const edit of [...row.replacements].sort((a,b)=>b.beforeStart-a.beforeStart))forward=forward.slice(0,edit.beforeStart)+edit.after+forward.slice(edit.beforeStart+edit.before.length);
  assert.equal(forward,source.toString(),file+' forward replay');
 }
 for(const one of [layer.bootstrap,...layer.imports])assert.equal(raw(one.file).toString(),one.line+git(layer.base,one.file).toString(),one.file+' exactly one added line');
 for(const f of ['data/hani-building/art-map-v2.json','data/hani-building/spatial-contract-v2.json','data/hani-building/office-places.json','assets/data/office-actions-221.json','assets/sprites-v3/manifest-v3.json'])assert.deepEqual(raw(f),git(layer.base,f),f+' live data stays main bytes');
});

test('building323 rejects stale input, EOL drift, unknown owners and fixture drift',()=>{
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file).toString();
  for(const bad of [source+'\n',source.slice(1),restore(source,file),source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){assert.notEqual(bad,source);assert.throws(()=>restore(bad,file));assert.strictEqual(project(bad,file),bad)}
  const pin=row.beforeSha256;try{row.beforeSha256='0'.repeat(64);assert.throws(()=>restore(source,file),/exact pre-building323 output/)}finally{row.beforeSha256=pin}
 }
 for(const file of ['unknown','__proto__','hani-board.js']){const source=Buffer.from('unrelated');assert.strictEqual(project(source,file),source);assert.throws(()=>restore(source,file),/known building-323 owner/)}
});

test('building323 helper removes exactly one complete pinned block and hides only registered files',()=>{
 const helper=raw(layer.helper.file),block=layerSource.outerBlock(),before=layerSource.projectHelper(helper);
 assert.equal(helper.toString().split(block).length,2);assert.equal(hash(before),layer.helper.beforeSha256);
 for(const bad of [Buffer.concat([helper,Buffer.from('\n')]),Buffer.concat([helper,Buffer.from(block)]),before])assert.strictEqual(layerSource.projectHelper(bad),bad);
 for(const dir of ['scripts','scripts/fixtures']){
  const names=layerSource.outerFiles.filter(f=>path.posix.dirname(f)===dir).map(f=>path.posix.basename(f));
  assert.deepEqual(layerSource.directory(new URL(dir,root),[...names,'unrelated.test.mjs']),['unrelated.test.mjs']);
 }
 for(const file of layerSource.outerFiles)assert.ok(block.includes("['"+file+"','"+hash(raw(file))+"']"),file+' exact registration');
});

test('real capture: released322 reads building323-projected bytes for every runtime closure file',async()=>{
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:raw});
 assert.deepEqual(closure.missing,[]);
 const r322=require('./hani-release-322-source.cjs');
 for(const file of [...closure.files,...Object.keys(layer.files)])assert.equal(hash(r322.readRawFileSync(new URL(file,root))),hash(project(raw(file),file)),file+' building323 capture');
 assert.equal(repository.commit(layer.head).parents.length>0,true);
});
