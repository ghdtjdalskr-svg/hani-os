import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import source from './hani-stale39-source.cjs';
import evidence from './hani-test-repository-evidence.cjs';
import releases from './hani-release-version-layers.cjs';
const {manifest,hash,restore,project}=source;
test('historical layers reproduce independent committed objects and reject byte drift',()=>{
 for(const [target,layer]of Object.entries(manifest.layers))for(const [file,row]of Object.entries(layer.files)){
  // Expected bytes come from fixed commit objects, never from HEAD/worktree.
  const current=evidence.read(manifest.base,file),before=evidence.read(layer.ref,file);
  assert.equal(hash(current),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(restore(current,file,target),before);
  assert.deepEqual(restore(Buffer.from(current),file,target),Buffer.from(before));
  assert.equal(project(current,file,target),before);assert.equal(project(before,file,target),before);
  // Exact offsets refer to the deployed side; reconstruct by applying the
  // inverse edit list as ordered source chunks, including insertion-only edits.
  const a=current.match(/[^\n]*\n|[^\n]+$/g)||[];let cursor=0;const chunks=[];
  for(const edit of row.edits){assert.ok(edit.at>=cursor);chunks.push(a.slice(cursor,edit.at).join(''),edit.before);cursor=edit.at+edit.remove;}
  chunks.push(a.slice(cursor).join(''));assert.equal(chunks.join(''),before);
  for(const bad of [current+'\n',current.slice(1),current+current,current.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.notEqual(bad,current);assert.throws(()=>restore(bad,file,target),/exact deployed input/);
   assert.throws(()=>project(bad,file,target),/exact deployed input/);
  }
  if(current!==before)assert.throws(()=>restore(before,file,target),/exact deployed input/);
  const disk=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.equal(releases.projectReleaseSource(disk,file,'2.9.289'),current,'disk exposes the pinned boundary through registered release inverses only');
 }
});
test('repository evidence rejects unknown objects, refs, paths and mutating commands',()=>{
 assert.throws(()=>evidence.object('0'.repeat(40)),/evidence unavailable/);
 assert.throws(()=>evidence.read(manifest.base,'../hani-main.js'),/relative repository path/);
 assert.throws(()=>evidence.reference('../main'),/read-only reference/);
 assert.throws(()=>evidence.readOnly(['reset','--hard']),/Unsupported read-only/);
 assert.equal(evidence.reference('49096de'),manifest.base);
});
test('a future registered release composes with frozen historical layers without refreshing their pins',()=>{
 const current=releases.layers[0].to,next='2.9.'+(Number(current.split('.').at(-1))+1),files={},futureFiles={};
 for(const file of ['index.html','hani-main.js']){
  const before=releases.readRawFileSync(new URL('../'+file,import.meta.url),'utf8'),after=before.replaceAll(current,next);
  futureFiles[file]=after;
  files[file]={before:hash(before),after:hash(after),count:before.split(current).length-1};
 }
 releases.layers.unshift({from:current,to:next,files});
 try{
  for(const [target,layer]of Object.entries(manifest.layers))for(const file of Object.keys(files))if(layer.files[file]){
   const future=futureFiles[file],expected=evidence.read(layer.ref,file);
   assert.equal(restore(future,file,target),expected);
   assert.deepEqual(project(Buffer.from(future),file,target),Buffer.from(expected));
   assert.throws(()=>project(future+'\n',file,target),/exact deployed input/);
  }
 }finally{releases.layers.shift();}
});
