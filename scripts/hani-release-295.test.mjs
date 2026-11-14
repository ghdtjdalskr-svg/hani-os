import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import layers from './hani-release-version-layers.cjs';
import chibi2 from './hani-chibi-pack-2-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {hash,readRawFileSync:read}=chibi2;
const raw=file=>read(new URL('../'+file,import.meta.url),'utf8');
const release='396511a28ca227e1f77c9bcba96965af7d077478';

test('295 exact version/history bytes independently match release objects, then compose frozen chibi2 before 294',()=>{
 const layer=layers.getLayer('2.9.295');
 assert.equal(layers.layers[0],layer);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 assert.deepEqual(layer.feature,{module:'./hani-chibi-pack-2-source.cjs',fixture:'./fixtures/chibi-pack-2-delta.json',restore:'restore'});
 assert.equal(raw('hani-study-v02984.js').includes('2.9.295'),false,'study has no deployed version token');
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=layers.restoreVersionLayer(source,file,'2.9.295');
  assert.equal(source,repository.read(release,file),'independent approved release bytes');
  assert.equal(hash(source),row.after);
  assert.equal(hash(before),chibi2.delta.files[file]?.afterSha256||layers.getLayer('2.9.294').files[file].after,'unchanged inner pin');
  assert.deepEqual(layers.restoreVersionLayer(Buffer.from(source),file,'2.9.295'),Buffer.from(before));
  const forward=row.replacements?row.replacements.reduce((s,e)=>{assert.equal(s.split(e.before).length-1,1);return s.replace(e.before,()=>e.after)},before):before.replaceAll(layer.from,layer.to);
  assert.equal(forward,source,'mixed EOL and unrelated bytes round-trip');
  assert.equal(layers.projectReleaseSource(source,file,'2.9.295'),source);
  assert.equal(layers.projectFeatureSource(source,file,'2.9.295'),before);
  const inner=chibi2.project(before,file);
  assert.equal(inner,repository.read(chibi2.delta.base,file),'independent main294 bytes');
  assert.equal(layers.projectReleaseSource(source,file,'2.9.294'),inner);
  assert.deepEqual(layers.projectReleaseSource(Buffer.from(source),file,'2.9.294'),Buffer.from(inner));
  if(file==='hani-main.js'){
   assert.throws(()=>chibi2.restore(source,file),/exact chibi-pack-2 input/,'version must precede strict feature inverse');
   assert.throws(()=>layers.restoreVersionLayer(before,file,'2.9.294'),/exact release-294 input/,'chibi2 must precede 294');
  }
  assert.equal(hash(layers.restoreVersionLayer(inner,file,'2.9.294')),layers.getLayer('2.9.294').files[file].before);
  assert.equal(raw(file),source,'disk stays raw295');
 }
 for(const file of ['hani-study-v02984.js','hani-street-journal.css']){
  const source=raw(file);
  assert.equal(source,repository.read(release,file));
  assert.equal(hash(source),chibi2.delta.files[file].afterSha256);
  assert.equal(layers.projectFeatureSource(source,file,'2.9.295'),source,'version-free feature remains intact');
  assert.equal(layers.projectReleaseSource(source,file,'2.9.294'),repository.read(chibi2.delta.base,file));
 }
});

test('295 history removes only its entry and restores the complete approved 294 source metadata',()=>{
 const file='assets/data/hani-history-releases-v1.json',source=raw(file),current=JSON.parse(source);
 const before=JSON.parse(layers.projectPreRelease295Source(source,file));
 assert.equal(current.entries[0].id,'v2.9.295');
 assert.equal(current.entries[0].title,'치비 2탄 독서·퀴즈·여행');
 assert.equal(current.entries[1].source.commit,'846e8d2dbda63be75822f9b56c1d85e6bf5c8b6d');
 assert.equal(current.entries[1].source.subject,'release: v2.9.294 THAW · 해빙의 정원 예고 (#504)');
 assert.equal(before.entries[0].id,'v2.9.294');
 assert.deepEqual(before.entries[0].source,{commit:'',subject:'release: v2.9.294 THAW · 해빙의 정원 예고'});
 assert.deepEqual(current.entries.slice(2),before.entries.slice(1));
 assert.deepEqual({...current,entries:[]},{...before,entries:[]},'all non-entry history metadata preserved');
});

test('295 strict input, count, unique metadata and output pins reject drift and double inverse',()=>{
 const layer=layers.getLayer('2.9.295');
 for(const file of Object.keys(layer.files)){
  const source=raw(file),before=layers.restoreVersionLayer(source,file,'2.9.295');
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'),source.replace('2.9.295','2.9.294')]){
   assert.throws(()=>layers.restoreVersionLayer(bad,file,'2.9.295'),/exact release-295 input/);
   assert.equal(layers.projectPreRelease295Source(bad,file),bad);
   if(bad!==before)assert.equal(layers.projectReleaseSource(bad,file,'2.9.289'),bad,'drift never enters a frozen layer');
  }
 }
 const file='index.html',row=layer.files[file],source=raw(file),count=row.count,before=row.before;
 try{
  row.count=count+1;assert.throws(()=>layers.restoreVersionLayer(source,file,'2.9.295'),/complete version token count/);
  row.count=count;row.before='0'.repeat(64);assert.throws(()=>layers.restoreVersionLayer(source,file,'2.9.295'),/exact release-294 output/);
 }finally{row.count=count;row.before=before;}
 const history='assets/data/hani-history-releases-v1.json',edit=layer.files[history].replacements[0],after=edit.after;
 try{edit.after='not-present';assert.throws(()=>layers.restoreVersionLayer(raw(history),history,'2.9.295'),/unique complete release metadata/);}
 finally{edit.after=after;}
 assert.equal(layers.projectPreRelease295Source('unknown bytes','not-an-owner'),'unknown bytes');
});

test('raw295 172 -> frozen chibi2 172 -> main294 171 -> main293 168 -> frozen289 164 closure has no missing files',async()=>{
 const root=new URL('../',import.meta.url),exists=file=>fs.existsSync(new URL(file,root));
 const closure=project=>resolveRuntimeClosure({exists,read:file=>project(read(new URL(file,root)),file)});
 const current=await closure(bytes=>bytes),feature=await closure((b,f)=>layers.projectFeatureSource(b,f,'2.9.295'));
 const main294=await closure((b,f)=>layers.projectReleaseSource(b,f,'2.9.294'));
 const main293=await closure((b,f)=>layers.projectReleaseSource(b,f,'2.9.293'));
 const frozen=await closure((b,f)=>layers.projectReleaseSource(b,f,'2.9.289'));
 assert.deepEqual([current.files.length,feature.files.length,main294.files.length,main293.files.length,frozen.files.length],[172,172,171,168,164]);
 for(const result of [current,feature,main294,main293,frozen])assert.deepEqual(result.missing,[]);
 assert.deepEqual(current.files.filter(f=>!main294.files.includes(f)),['assets/street-journal/chibi-sheet-v2.webp']);
 assert.deepEqual(feature.files,current.files);
});
