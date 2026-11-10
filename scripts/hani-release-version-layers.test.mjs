import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import outer from './hani-save-guard-source.cjs';
import layers from './hani-release-version-layers.cjs';
import {pbDelta,restoreChibitoonSource} from './hani-pb-chibitoon-source.mjs';
const {hash,readRawFileSync:read,restoreVersionLayer:restore,projectVersionSource,projectReleaseSource}=layers;
const raw=file=>outer.projectPreSaveGuard286Source(read(new URL('../'+file,import.meta.url),'utf8'),file);

test('283 pins still equal the independently frozen feature manifest',()=>{
 for(const [file,row]of Object.entries(pbDelta.release283)){
  assert.deepEqual(layers.getLayer('2.9.283').files[file],{after:row.afterSha256,before:row.beforeSha256,count:row.count});
 }
});

test('every version and history owner restores full bytes and rejects drift and repeated inverse',()=>{
 for(const layer of layers.layers)for(const [file,row]of Object.entries(layer.files)){
  const source=projectReleaseSource(raw(file),file,layer.to);
  assert.equal(hash(source),row.after);
  const before=restore(source,file,layer.to);
  assert.equal(hash(before),row.before);
  assert.deepEqual(restore(Buffer.from(source),file,layer.to),Buffer.from(before));
  const forward=row.replacements?row.replacements.reduce((s,e)=>s.replace(e.before,()=>e.after),before):before.replaceAll(layer.from,layer.to);
  assert.equal(forward,source,'all mixed EOL and unrelated bytes round-trip');
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(layer.to,layer.from)])assert.throws(()=>restore(bad,file,layer.to),/exact release-.* input/);
 }
});

test('token counts, edit uniqueness and output SHA256 are independent guards',()=>{
 const row=layers.getLayer('2.9.284').files['index.html'],source=projectReleaseSource(raw('index.html'),'index.html','2.9.284'),count=row.count,before=row.before;
 try{
  row.count=count+1;assert.throws(()=>restore(source,'index.html','2.9.284'),/complete version token count/);
  row.count=count;row.before='0'.repeat(64);assert.throws(()=>restore(source,'index.html','2.9.284'),/exact release-283 output/);
 }finally{row.count=count;row.before=before;}
 const history=layers.getLayer('2.9.284').files['assets/data/hani-history-releases-v1.json'],edit=history.replacements[0],after=edit.after;
 const historySource=projectReleaseSource(raw('assets/data/hani-history-releases-v1.json'),'assets/data/hani-history-releases-v1.json','2.9.284');
 try{edit.after='not-present';assert.throws(()=>restore(historySource,'assets/data/hani-history-releases-v1.json','2.9.284'),/unique complete release metadata/);}
 finally{edit.after=after;}
});

test('ordered dispatch composes versions and feature inverses, refusing wrong order',()=>{
 for(const file of ['index.html','hani-main.js']){
  assert.throws(()=>restore(raw(file),file,'2.9.283'),/exact release-283 input/);
  const at283=restore(projectReleaseSource(raw(file),file,'2.9.284'),file,'2.9.284');
  assert.equal(projectReleaseSource(raw(file),file,'2.9.282'),restore(at283,file,'2.9.283'));
 }
 for(const [file,row]of Object.entries(pbDelta.files)){
  assert.equal(hash(layers.projectFeatureSource(raw(file),file,'2.9.284')),row.afterSha256,'feature boundary retains feature bytes');
  const before=projectReleaseSource(raw(file),file,'2.9.282');
  assert.equal(hash(before),row.beforeSha256);
  assert.deepEqual(projectReleaseSource(Buffer.from(raw(file)),file,'2.9.282'),Buffer.from(before));
  assert.equal(before,restoreChibitoonSource(raw(file),file));
  assert.throws(()=>restoreChibitoonSource(before,file),/exact chibitoon input/);
 }
 const temp=new URL('./fixtures/index.html',import.meta.url);
 assert.equal(projectVersionSource('unknown bytes','index.html','2.9.283'),'unknown bytes','dispatch cannot bless drift');
 assert.throws(()=>restore('',temp.pathname,'2.9.284'),/known release version owner/);
 assert.throws(()=>projectVersionSource('','index.html','2.9.999'),/known release target/);
});

test('a future release and feature need one manifest row without editing legacy tests',()=>{
 const files={};
 const current=layers.layers[0].to,next='2.9.'+(Number(current.split('.')[2])+1);
 for(const file of ['index.html','hani-main.js']){
  const before=raw(file),after=before.replaceAll(current,next);
  files[file]={count:before.split(current).length-1,before:hash(before),after:hash(after)};
 }
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hani-release-future-'));
 const file='hani-procrastination-board.js',before=raw(file),future=before+'\n// synthetic future feature\n';
 const fixture=path.join(dir,'delta.json'),module=path.join(dir,'inverse.cjs');
 fs.writeFileSync(fixture,JSON.stringify({files:{[file]:{afterSha256:hash(future),beforeSha256:hash(before),before}}}));
 fs.writeFileSync(module,`const assert=require('node:assert/strict'),{createHash}=require('node:crypto'),delta=require(${JSON.stringify(fixture)});exports.restore=(source,file)=>{const row=delta.files[file];assert.equal(createHash('sha256').update(source).digest('hex'),row.afterSha256);return row.before;};`);
 const featureBefore=layers.projectFeatureSource(before,file,'2.9.284');
 layers.layers.unshift({from:current,to:next,files,feature:{module,fixture,restore:'restore'}});
 try{
  for(const file of Object.keys(files)){
   const future=raw(file).replaceAll(current,next);
   assert.equal(projectReleaseSource(future,file,'2.9.282'),projectReleaseSource(raw(file),file,'2.9.282'));
   assert.throws(()=>restore(future+'\n',file,next),new RegExp('exact release-'+next.split('.')[2]+' input'));
  }
  assert.equal(layers.projectFeatureSource(future,file,'2.9.284'),featureBefore,'newer feature is peeled while the original feature remains raw');
  assert.deepEqual(layers.projectFeatureSource(Buffer.from(future),file,'2.9.284'),Buffer.from(featureBefore));
  assert.equal(projectReleaseSource(future,file,'2.9.282'),projectReleaseSource(before,file,'2.9.282'));
  assert.equal(restoreChibitoonSource(future,file),restoreChibitoonSource(before,file));
 }finally{
  layers.layers.shift();
  assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));
  assert.ok(path.basename(dir).startsWith('hani-release-future-'));
  fs.rmSync(dir,{recursive:true,force:true});
 }
});

test('save-guard outer inverse preserves the exact 286 layer, Buffer bytes and strict drift rejection',()=>{
 const file='hani-main.js',source=read(new URL('../'+file,import.meta.url),'utf8');
 const before=outer.restoreSaveGuard286Source(source,file);
 assert.equal(hash(before),layers.getLayer('2.9.286').files[file].after);
 assert.deepEqual(outer.restoreSaveGuard286Source(Buffer.from(source),file),Buffer.from(before));
 assert.equal(outer.projectPreSaveGuard286Source(source,file),before);
 assert.equal(projectReleaseSource(source,file,'2.9.286'),before);
 assert.equal(projectReleaseSource(source,file,'2.9.285'),outer.restoreSaveGuard284(source,file));
 for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
  assert.throws(()=>outer.restoreSaveGuard286Source(bad,file),/exact save-guard input/);
  assert.equal(outer.projectPreSaveGuard286Source(bad,file),bad);
 }
 // A later exact version inverse can expose the guarded 286 input mid-chain.
 const current=layers.layers[0].to,next='2.9.'+(Number(current.split('.')[2])+1);
 const future=source.replaceAll(current,next);
 layers.layers.unshift({from:current,to:next,files:{[file]:{count:source.split(current).length-1,before:hash(source),after:hash(future)}}});
 try{assert.equal(projectReleaseSource(future,file,'2.9.285'),outer.restoreSaveGuard284(source,file));}
 finally{layers.layers.shift();}
 assert.equal(read(new URL('../'+file,import.meta.url),'utf8'),source);
});
