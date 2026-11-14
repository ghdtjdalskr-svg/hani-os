import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import release296 from './hani-release-296-source.cjs';
import layers from './hani-release-version-layers.cjs';
import design from './hani-design-polish-1-main295-source.cjs';
import frozenDesign from './hani-design-polish-1-source.cjs';
import chibi2 from './hani-chibi-pack-2-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {hash,readRawFileSync:read}=release296,root=new URL('../',import.meta.url);
const raw=file=>read(new URL(file,root),'utf8'),release='56c3105391cec207d9c55a4a3bbf76906749a0a4';

test('296 version/history is the outermost exact inverse and composes the unchanged design295 before 295/chibi2',()=>{
 const layer=layers.getLayer('2.9.296');assert.equal(layers.layers[0],layer);
 assert.deepEqual(layer,release296.layer);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 assert.deepEqual(layer.feature,{module:'./hani-design-polish-1-main295-source.cjs',fixture:'./fixtures/design-polish-1-main295-delta.json',restore:'restore'});
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=layers.restoreVersionLayer(source,file,'2.9.296');
  assert.equal(source,repository.read(release,file),'independent deployed296 object');
  assert.equal(hash(source),row.after);assert.equal(hash(before),row.before);
  assert.equal(before,release296.restore(source,file));
  assert.deepEqual(layers.restoreVersionLayer(Buffer.from(source),file,'2.9.296'),Buffer.from(before));
  assert.deepEqual(release296.restore(Buffer.from(source),file),Buffer.from(before));
  assert.equal(layers.projectPreRelease296Source(source,file),before);
  assert.deepEqual(layers.projectPreRelease296Source(Buffer.from(source),file),Buffer.from(before));
  assert.equal(layers.projectReleaseSource(source,file,'2.9.296'),source,'release296 retains its design');
  assert.equal(layers.projectFeatureSource(source,file,'2.9.296'),before,'peel version only at feature boundary');
  const main295=design.project(before,file);
  assert.equal(main295,repository.read(design.delta.base,file),'design inverse reaches independent main295');
  assert.equal(layers.projectReleaseSource(source,file,'2.9.295'),main295);
  assert.deepEqual(layers.projectReleaseSource(Buffer.from(source),file,'2.9.295'),Buffer.from(main295));
  const before295=layers.restoreVersionLayer(main295,file,'2.9.295');
  assert.equal(layers.projectPreRelease295Source(source,file),before295);
  assert.equal(chibi2.project(before295,file),repository.read(chibi2.delta.base,file));
  const forward=row.replacements?row.replacements.reduce((s,e)=>{assert.equal(s.split(e.before).length-1,1);return s.replace(e.before,()=>e.after)},before):before.replaceAll(layer.from,layer.to);
  assert.equal(forward,source,'mixed EOL and unrelated bytes round-trip');
  assert.equal(raw(file),source,'disk stays raw296');
  if(file==='hani-main.js'){
   assert.equal(hash(before),design.delta.files[file].afterSha256,'existing design295 pin retained');
   assert.throws(()=>design.restore(source,file),/exact design-polish-1 main295 input/,'296 must precede design inverse');
   assert.throws(()=>layers.restoreVersionLayer(before,file,'2.9.295'),/exact release-295 input/,'design must precede 295');
  }
 }
 for(const file of ['hani-design-system.css','hani-study-v02984.js','hani-street-journal.css']){
  const source=raw(file);assert.equal(source,repository.read(release,file));
  assert.equal(release296.project(source,file),source,'version-free owner unchanged at outer inverse');
  assert.equal(layers.projectFeatureSource(source,file,'2.9.296'),source);
  assert.equal(layers.projectReleaseSource(source,file,'2.9.295'),repository.read(design.delta.base,file));
 }
});

test('296 history removes only its entry and restores complete approved 295 source metadata',()=>{
 const file='assets/data/hani-history-releases-v1.json',current=JSON.parse(raw(file)),before=JSON.parse(release296.restore(raw(file),file));
 assert.equal(current.entries[0].id,'v2.9.296');assert.equal(current.entries[0].title,'디자인 다듬기 1차');
 assert.deepEqual(current.entries[0].source,{commit:'',subject:'release: v2.9.296 디자인 다듬기 1차'});
 assert.equal(current.entries[1].id,'v2.9.295');
 assert.deepEqual(current.entries[1].source,{commit:'396511a28ca227e1f77c9bcba96965af7d077478',subject:'release: v2.9.295 치비 2탄 독서·퀴즈·여행 (#507)'});
 assert.deepEqual(before.entries[0].source,{commit:'',subject:'release: v2.9.295 치비 2탄 독서·퀴즈·여행'});
 assert.deepEqual(current.entries.slice(2),before.entries.slice(1));
 assert.deepEqual({...current,entries:[]},{...before,entries:[]});
 assert.equal(JSON.stringify(before),JSON.stringify(JSON.parse(repository.read(design.delta.base,file))));
});

test('296 rejects byte/token/EOL drift, duplicate input and double inverse without blessing unknown data',()=>{
 for(const file of Object.keys(release296.layer.files)){
  const source=raw(file),before=release296.restore(source,file);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'),source.replace('2.9.296','2.9.295')]){
   assert.throws(()=>layers.restoreVersionLayer(bad,file,'2.9.296'),/exact release-296 input/);
   assert.throws(()=>release296.restore(bad,file),/exact release-296 input/);
   assert.equal(layers.projectPreRelease296Source(bad,file),bad);
   assert.equal(release296.project(bad,file),bad);
   if(bad!==before)assert.equal(layers.projectReleaseSource(bad,file,'2.9.289'),bad);
  }
 }
 assert.equal(release296.project('unknown bytes','not-an-owner'),'unknown bytes');
 assert.equal(layers.projectPreRelease296Source('unknown bytes','not-an-owner'),'unknown bytes');
 assert.throws(()=>release296.restore('unknown bytes','not-an-owner'),/known release296 owner/);
});

test('296 counts, metadata uniqueness and output pins independently reject malformed contracts',()=>{
 for(const inverse of [{row:layers.getLayer('2.9.296').files,restore:(s,f)=>layers.restoreVersionLayer(s,f,'2.9.296')},{row:release296.layer.files,restore:release296.restore}]){
  const file='index.html',row=inverse.row[file],count=row.count,before=row.before;
  try{row.count++;assert.throws(()=>inverse.restore(raw(file),file),/complete version token count/);row.count=count;row.before='0'.repeat(64);assert.throws(()=>inverse.restore(raw(file),file),/exact release-295 output/);}
  finally{row.count=count;row.before=before;}
  const history='assets/data/hani-history-releases-v1.json',meta=inverse.row[history],edit=meta.replacements[0],after=edit.after,oldCount=meta.count;
  try{meta.count++;assert.throws(()=>inverse.restore(raw(history),history),/complete release metadata edit count/);meta.count=oldCount;edit.after='not-present';assert.throws(()=>inverse.restore(raw(history),history),/unique complete release metadata/);edit.after='';assert.throws(()=>inverse.restore(raw(history),history),/nonempty exact metadata edit/);}
  finally{edit.after=after;meta.count=oldCount;}
 }
});

test('raw296 -> design295 -> main295 -> frozen chibi2 -> main294 -> main293 -> frozen289 closure stays 172/172/172/172/171/168/164',async()=>{
 const projects=[b=>b,(b,f)=>release296.project(b,f),(b,f)=>layers.projectReleaseSource(b,f,'2.9.295'),(b,f)=>layers.projectFeatureSource(b,f,'2.9.295'),(b,f)=>layers.projectReleaseSource(b,f,'2.9.294'),(b,f)=>layers.projectReleaseSource(b,f,'2.9.293'),(b,f)=>layers.projectReleaseSource(b,f,'2.9.289')];
 const counts=[];
 for(const project of projects){const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>project(read(new URL(f,root)),f)});counts.push(closure.files.length);assert.deepEqual(closure.missing,[]);}
 assert.deepEqual(counts,[172,172,172,172,171,168,164]);
 assert.equal(raw('hani-study-v02984.js').includes('2.9.296'),false);
 assert.deepEqual(design.delta.files['hani-main.js'].edits,frozenDesign.delta.files['hani-main.js'].edits);
});
