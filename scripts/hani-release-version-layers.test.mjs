// The canonical dispatcher owns 293 version -> chibi -> 292/office ordering.
// Keep its reader raw so this test exercises every outer release as well.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import outer from './hani-save-guard-source.cjs';
import {restoreNewsroom288Source} from './hani-newsroom-288-source.cjs';
import layers from './hani-release-version-layers.cjs';
import joinInverse from './hani-join-ieum-source.cjs';
import contrast from './hani-contrast-291-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {pbDelta,restoreChibitoonSource} from './hani-pb-chibitoon-source.mjs';
const {hash,readRawFileSync:read,restoreVersionLayer:restore,projectVersionSource,projectReleaseSource}=layers;
const raw=file=>read(new URL('../'+file,import.meta.url),'utf8');

test('287 outer projection matches the supplied 286 baselines without accepting drift or changing strict guard inverses',()=>{
 // This frozen contract sees 287 only after the exact 288 version/feature layer.
 const raw=file=>projectReleaseSource(read(new URL('../'+file,import.meta.url),'utf8'),file,'2.9.287');
 for(const file of ['index.html','hani-main.js']){
  const source=raw(file),baseline=read(new URL('../artifacts/save-guard/baseline/'+file,import.meta.url),'utf8');
  assert.equal(hash(baseline),layers.getLayer('2.9.287').files[file].before,'independent supplied 286 bytes');
  assert.equal(restore(source,file,'2.9.287'),baseline);
  assert.deepEqual(restore(Buffer.from(source),file,'2.9.287'),Buffer.from(baseline));
  assert.equal(outer.projectPreRelease287Source(source,file),baseline);
  assert.equal(layers.projectFeatureSource(source,file,'2.9.287'),baseline,'287 feature boundary retains the guarded 286 bytes');
  assert.deepEqual(outer.projectPreRelease287Source(Buffer.from(source),file),Buffer.from(baseline));
  assert.throws(()=>outer.restoreSaveGuard284(source,file),/exact save-guard input/,'287 is outside the frozen guard inverse');
  for(const bad of [source+'\n',source.slice(1),source+source,baseline,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.throws(()=>restore(bad,file,'2.9.287'),/exact release-287 input/);
   assert.equal(outer.projectPreRelease287Source(bad,file),bad,'projection cannot bless unknown bytes');
  }
  assert.equal(raw(file),source,'disk bytes remain raw 287');
 }
});

test('288 outer projection peels exact deployed versions/history before the unchanged newsroom inverse',()=>{
 const layer=layers.getLayer('2.9.288');
 const newsroom=JSON.parse(read(new URL('./fixtures/newsroom-288-delta.json',import.meta.url),'utf8'));
 for(const [file,row]of Object.entries(layer.files)){
  // This frozen 288 contract sees disk bytes only after the exact 289 version layer.
  const disk=read(new URL('../'+file,import.meta.url)),current=layers.projectPreRelease289Source(raw(file),file),bytes=layers.projectPreRelease289Source(disk,file),before=restore(current,file,'2.9.288');
  const pin=file==='index.html'?newsroom.files[file].afterSha256:layers.getLayer('2.9.287').files[file].after;
  assert.equal(hash(before),pin,'independent frozen 287/feature bytes');
  assert.equal(layers.projectPreRelease288Source(current,file),before);
  assert.deepEqual(layers.projectPreRelease288Source(bytes,file),Buffer.from(before));
  assert.equal(projectReleaseSource(current,file,'2.9.288'),current,'current feature remains raw at its release');
  assert.equal(layers.projectFeatureSource(current,file,'2.9.288'),before,'version-only inverse retains this feature');
  for(const bad of [current+'\n',current.slice(1),current+current,before,current.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.throws(()=>restore(bad,file,'2.9.288'),/exact release-288 input/);
   assert.equal(layers.projectPreRelease288Source(bad,file),bad,'unknown bytes cannot become an approved 287 input');
  }
  assert.deepEqual(read(new URL('../'+file,import.meta.url)),disk,'disk bytes stay raw');
 }
 assert.throws(()=>restoreNewsroom288Source(raw('index.html'),'index.html'),/exact newsroom-288 input/,'strict feature inverse still rejects deployed bytes');
 assert.equal(layers.projectPreRelease288Source('unknown bytes','not-an-owner'),'unknown bytes');
});

test('289 outer projection peels only exact deployed versions/history to the pinned 288 bytes',()=>{
 const layer=layers.getLayer('2.9.289');
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html'],'version/history owners only');
 for(const [file,row]of Object.entries(layer.files)){
  const disk=read(new URL('../'+file,import.meta.url)),current=projectReleaseSource(raw(file),file,'2.9.289'),before=restore(current,file,'2.9.289');
  assert.equal(hash(current),row.after,'deployed 289 bytes');
  assert.equal(hash(before),layers.getLayer('2.9.288').files[file].after,'independent 288 pin');
  assert.equal(layers.projectPreRelease289Source(current,file),before);
  assert.deepEqual(layers.projectPreRelease289Source(disk,file),Buffer.from(before));
  assert.equal(projectReleaseSource(current,file,'2.9.288'),before);
  for(const bad of [current+'\n',current.slice(1),current+current,before,current.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.throws(()=>restore(bad,file,'2.9.289'),/exact release-289 input/);
   assert.equal(layers.projectPreRelease289Source(bad,file),bad,'unknown bytes cannot become an approved 288 input');
  }
  assert.deepEqual(read(new URL('../'+file,import.meta.url)),disk,'disk bytes stay raw 289');
 }
 assert.equal(layers.projectPreRelease289Source('unknown bytes','not-an-owner'),'unknown bytes');
});

test('290 outer version/history inverse precedes the unchanged Ieum delta and rejects every drift',()=>{
 const layer=layers.getLayer('2.9.290'),join=JSON.parse(read(new URL('./fixtures/join-ieum-delta.json',import.meta.url),'utf8'));
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 for(const [file,row]of Object.entries(layer.files)){
  const disk=read(new URL('../'+file,import.meta.url)),source=projectReleaseSource(raw(file),file,'2.9.290'),before=restore(source,file,'2.9.290');
  const feature=join.files.find(row=>row.file===file);
  assert.equal(hash(before),feature?feature.afterSha256:layers.getLayer('2.9.289').files[file].after,'independent frozen feature/289 pin');
  assert.equal(layers.projectPreRelease290Source(source,file),before);
  assert.deepEqual(layers.projectPreRelease290Source(disk,file),Buffer.from(before));
  assert.equal(projectReleaseSource(source,file,'2.9.290'),source);
  assert.equal(layers.projectFeatureSource(source,file,'2.9.290'),before);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.throws(()=>restore(bad,file,'2.9.290'),/exact release-290 input/);
   assert.equal(layers.projectPreRelease290Source(bad,file),bad);
  }
  if(feature){
   const inverse=joinInverse;
   assert.throws(()=>inverse.restore(source,file),/exact Ieum input/,'strict feature inverse rejects deployed 290 bytes');
   assert.equal(hash(inverse.restore(before,file)),layers.getLayer('2.9.289').files[file].after);
  }else{
   const now=JSON.parse(source),old=JSON.parse(before);
   assert.equal(now.entries[0].id,'v2.9.290');assert.equal(old.entries[0].id,'v2.9.289');
   assert.equal(old.entries[0].source.commit,'');assert.equal(now.entries[1].source.commit,'91d4943d2386a25d7ed49dc56de25c4d1ab5bd8f');
   assert.equal(old.entries[0].source.subject,now.entries[1].source.subject.replace(' (#487)',''));
   assert.deepEqual(now.entries.slice(2),old.entries.slice(1),'older history is untouched');
  }
  assert.deepEqual(read(new URL('../'+file,import.meta.url)),disk);
 }
 assert.equal(layers.projectPreRelease290Source('unknown bytes','not-an-owner'),'unknown bytes');
});

test('291 approved objects independently prove version/history and contrast inverses, preserving the frozen 290/289 pins',()=>{
 const release='55942f120fc06a87649009c21776a572fb8081e6',parent='46cb7a69c4beeff3cce3bbe788be6f952e7b99e9';
 assert.equal(contrast.delta.release,release);assert.equal(contrast.delta.parent,parent);
 assert.deepEqual(Object.keys(contrast.delta.files),['hani-design-system.css']);
 assert.deepEqual(Object.keys(layers.getLayer('2.9.291').files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 for(const [file,row]of Object.entries(layers.getLayer('2.9.291').files)){
  const current=repository.read(release,file),before=repository.read(parent,file);
  assert.equal(hash(current),row.after);assert.equal(hash(before),row.before);
  assert.equal(restore(current,file,'2.9.291'),before);
  assert.deepEqual(restore(Buffer.from(current),file,'2.9.291'),Buffer.from(before));
  assert.equal(hash(before),layers.getLayer('2.9.290').files[file].after,'independent frozen 290 input');
  assert.equal(projectReleaseSource(current,file,'2.9.290'),before);
  if(file.endsWith('.json')){
   const now=JSON.parse(current),old=JSON.parse(before);
   assert.equal(now.entries[0].id,'v2.9.291');assert.equal(old.entries[0].id,'v2.9.290');
   assert.equal(now.entries[1].source.commit,'9e3fe97f5e58cb7a5ebc1f5796f6b523d417e5a1');
   assert.deepEqual(now.entries.slice(2),old.entries.slice(1));
  }
 }
 for(const [file,row]of Object.entries(contrast.delta.files)){
  const current=repository.read(release,file),before=repository.read(parent,file);
  assert.equal(hash(current),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(contrast.restore(current,file),before);
  assert.deepEqual(contrast.restore(Buffer.from(current),file),Buffer.from(before));
  assert.equal(projectReleaseSource(current,file,'2.9.290'),before);
  assert.equal(projectReleaseSource(current,file,'2.9.291'),current,'current contrast remains at its release boundary');
  assert.equal(hash(projectReleaseSource(raw(file),file,'2.9.289')),hash(repository.read('49096deb9ca99790c48106bbff7ec275273b1b52',file)));
  for(const bad of [current+'\n',current.slice(1),current+current,before,current.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'),current.replace('color:var(--text-primary);background:var(--surface-panel)!important','color:#ffffff;background:var(--surface-panel)!important')]){
   assert.notEqual(bad,current);
   assert.throws(()=>contrast.restore(bad,file),/exact contrast-291 input/);
   assert.equal(projectReleaseSource(bad,file,'2.9.290'),bad,'unapproved colour/byte drift cannot be blessed');
  }
 }
 assert.throws(()=>contrast.restore('unknown','index.html'),/known contrast-291 owner/);
});

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
 const file='hani-main.js',raw287=read(new URL('../'+file,import.meta.url),'utf8'),source=outer.projectPreRelease287Source(raw287,file);
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
 const future=raw287.replaceAll(current,next);
 layers.layers.unshift({from:current,to:next,files:{[file]:{count:raw287.split(current).length-1,before:hash(raw287),after:hash(future)}}});
 try{assert.equal(projectReleaseSource(future,file,'2.9.285'),outer.restoreSaveGuard284(source,file));}
 finally{layers.layers.shift();}
 assert.equal(read(new URL('../'+file,import.meta.url),'utf8'),raw287);
});
