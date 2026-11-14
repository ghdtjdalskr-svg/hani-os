// Current raw main297 + design2 contract; frozen suites use explicit lower inputs.
import test from 'node:test';
import assert from 'node:assert/strict';
import inverse from './hani-design-polish-2-main298-input.cjs';
import layers from './hani-release-version-layers.cjs';
import frozen from './hani-design-polish-2-main297-input.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import fs from 'node:fs';
const {readRawFileSync:read,hash}=inverse,root=new URL('../',import.meta.url),base='22fedb33cbd67923cc499ba99f55e8902a66ecb2';
const raw=f=>read(new URL(f,root),'utf8');

test('unchanged design2 fixture and pins invert actual CSS to independent main297+#513 exactly',()=>{
 const file='hani-design-system.css',before=repository.read(base,file),after=raw(file);
 assert.equal(raw('scripts/fixtures/design-polish-2-delta.json'),repository.read('247ddec','scripts/fixtures/design-polish-2-delta.json'));
 assert.equal(raw('scripts/hani-design-polish-2-source.cjs'),repository.read('247ddec','scripts/hani-design-polish-2-source.cjs'));
 assert.equal(before,repository.read(inverse.delta.base,file),'297 has no CSS delta');
 assert.equal(after,before+inverse.delta.files[file].edits[0].after);
 assert.equal(inverse.restore(after,file),before);assert.deepEqual(inverse.restore(Buffer.from(after),file),Buffer.from(before));
 for(const bad of [after+'\n',after.slice(1),after+after,before]){assert.throws(()=>inverse.restore(bad,file),/exact design-polish-2 input/);assert.equal(inverse.project(bad,file),bad);}
});

test('current raw runtime closure is main297 plus CSS only; each lower boundary keeps its exact closure',async()=>{
 const current=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>read(new URL(f,root))});
 assert.equal(current.files.length,173);assert.deepEqual(current.missing,[]);
 for(const file of current.files){
  const actual=read(new URL(file,root)),expected=repository.object((()=>{let sha=repository.commit(base).tree;for(const name of file.split('/'))sha=repository.tree(sha).find(r=>r.name===name).sha;return sha})()).data;
  assert.deepEqual(inverse.project(actual,file),expected,'independent deployed297 '+file);
 }
 const counts=[];
 for(const version of ['2.9.297','2.9.296','2.9.295','2.9.294','2.9.293','2.9.289']){
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>layers.projectReleaseSource(read(new URL(f,root)),f,version)});
  counts.push(closure.files.length);assert.deepEqual(closure.missing,[]);
 }
 assert.deepEqual(counts,[173,172,172,171,168,164]);
 assert.equal(layers.projectReleaseSource(raw('hani-design-system.css'),'hani-design-system.css','2.9.297'),repository.read(base,'hani-design-system.css'));
});

test('main297 frozen fixtures and all existing assertions/counts/pins remain unchanged; design2 only changes its input import',()=>{
 function fixtures(tree,prefix){for(const row of repository.tree(tree)){const file=prefix+row.name;if(row.mode==='40000')fixtures(row.sha,file+'/');else assert.deepEqual(read(new URL(file,root)),repository.object(row.sha).data,file)}}
 const scripts=repository.tree(repository.commit(base).tree).find(r=>r.name==='scripts');
 fixtures(repository.tree(scripts.sha).find(r=>r.name==='fixtures').sha,'scripts/fixtures/');
 for(const row of repository.tree(scripts.sha).filter(r=>/[.-]test\.[cm]?js$/.test(r.name)))assert.equal(raw('scripts/'+row.name),repository.object(row.sha).data.toString('utf8'),row.name);
 const file='scripts/hani-design-polish-2.test.mjs';
 assert.equal(raw(file).replace("from './hani-design-polish-2-main297-input.cjs'","from './hani-design-polish-2-source.cjs'"),repository.read('247ddec',file));
});

test('explicit frozen tooling input is an exact inverse, rejects drift, and leaves the actual disk reader raw',()=>{
 for(const [file,row]of Object.entries(frozen.contract.files)){
  const source=raw(file),before=repository.read(frozen.contract.frozen,file);
  assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(frozen.projectTooling(source,file),before);
  assert.deepEqual(frozen.projectTooling(Buffer.from(source),file),Buffer.from(before));
  for(const bad of [source+'\n',source.slice(1),source+source])assert.equal(frozen.projectTooling(bad,file),bad);
  assert.equal(frozen.readRawFileSync(new URL(file,root),'utf8'),before);assert.equal(raw(file),source);
 }
 for(const file of ['index.html','hani-main.js','hani-street-journal.css','assets/data/hani-history-releases-v1.json'])assert.equal(frozen.readRawFileSync(new URL(file,root),'utf8'),repository.read(inverse.delta.base,file));
});
