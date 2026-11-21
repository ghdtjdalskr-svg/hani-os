import './hani-ui-polish-1-preload.cjs'; // Exact UI Polish 1 inverse before historical readers.
import test from 'node:test';
import assert from 'node:assert/strict';
import release from './hani-release-301-source.cjs';
import seat from './hani-ieum-seat-source.cjs';
import seatHistory from './hani-ieum-seat-reviewed-input.cjs';
import history from './hani-release-301-reviewed-input.cjs';
import repository from './hani-test-repository-evidence.cjs';
import release300 from './hani-release-300-source.cjs';
import reviewed300 from './hani-release-300-reviewed-input.cjs';
import audit from './hani-audit-1-source.cjs';
import layers from './hani-release-version-layers.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const {layer,hash,readRawFileSync:read}=release,root=new URL('../',import.meta.url),raw=f=>read(new URL(f,root));
const diskRoot=fileURLToPath(root);

test('301 metadata is an exact independent outer inverse before committed seats and frozen300',()=>{
 assert.equal(layer.release,'0558dc341827e578f956e396fd952be80ead14a7');
 assert.equal(layer.base,seat.delta.base);assert.equal(layer.feature,seat.delta.feature);
 assert.deepEqual(Object.keys(layer.files).sort(),['assets/data/hani-history-releases-v1.json','hani-main.js','index.html']);
 assert.equal(layer.files['index.html'].count,60);assert.equal(layer.files['hani-main.js'].count,1);
 for(const [file,row]of Object.entries(layer.files)){
  const source=raw(file),before=release.restore(source,file);
  assert.deepEqual(source,Buffer.from(repository.read(layer.release,file)),'raw actual release');
  assert.deepEqual(before,Buffer.from(repository.read(layer.feature,file)),'independent main300 with committed seats');
  assert.equal(hash(before),row.before);assert.equal(release300.layer.files[file].after,row.before);
  assert.deepEqual(seat.readRawFileSync(new URL(file,root)),before,'301 precedes seat capture');
  assert.deepEqual(release300.readRawFileSync(new URL(file,root)),before,'300 sees exact300 metadata');
  assert.equal(release.restore(source.toString('utf8'),file),before.toString('utf8'));
  const forward=row.replacements?row.replacements.reduce((s,e)=>s.replace(e.before,()=>e.after),before.toString('utf8')):before.toString('utf8').replaceAll(layer.from,layer.to);
  assert.equal(forward,source.toString('utf8'));
  assert.throws(()=>release300.restore(source,file),/exact release-300 input/);
 }
 for(const [file,row]of Object.entries(seat.delta.files)){
  assert.equal(hash(raw(file)),row.afterSha256,'released301 seat matches existing frozen feature');
  assert.equal(raw(file).toString('utf8'),repository.read(layer.feature,file));
  assert.equal(release300.readRawFileSync(new URL(file,root),'utf8'),repository.read(layer.base,file));
 }
 assert.equal(layers.layers[0].to,'2.9.299');
});

test('301 history owns exactly the new entry and completed300 provenance',()=>{
 const file='assets/data/hani-history-releases-v1.json',after=JSON.parse(raw(file)),before=JSON.parse(release.restore(raw(file),file));
 assert.deepEqual(after.entries[0],{id:'v2.9.301',date:'2026-11-20',status:'released',title:'이음·유나 자리 교체',category:'하니 그룹',credits:[],source:{commit:'',subject:'release: v2.9.301 이음·유나 자리 교체'}});
 assert.equal(after.entries[1].id,'v2.9.300');
 assert.deepEqual(after.entries[1].source,{commit:'9f49286882e2efacd128e2920cc12f38d473a8e9',subject:'release: v2.9.300 점검 반영 1차 (#519)'});
 assert.deepEqual(before.entries[0].source,{commit:'',subject:'release: v2.9.300 점검 반영 1차'});
 assert.deepEqual(after.entries.slice(2),before.entries.slice(1));assert.deepEqual({...after,entries:[]},{...before,entries:[]});
});

test('301 inverse rejects input drift, duplicate, EOL, wrong version, repeated inverse and unknown owners',()=>{
 for(const file of Object.keys(layer.files)){
  const source=raw(file).toString('utf8'),before=release.restore(source,file);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'),source.replace('2.9.301','2.9.300')]){
   assert.throws(()=>release.restore(bad,file),/exact release-301 input/);assert.equal(release.project(bad,file),bad);
  }
 }
 for(const file of ['unknown','__proto__','constructor','scripts/hani-runtime-closure.mjs']){
  const source=Buffer.from('unknown');assert.strictEqual(release.project(source,file),source);assert.throws(()=>release.restore(source,file),/known release301 owner/);
 }
});

test('301 malformed metadata, counts and output pins fail closed',()=>{
 const file='index.html',row=layer.files[file],count=row.count,pin=row.before;
 try{row.count++;assert.throws(()=>release.restore(raw(file),file),/complete release301 version token count/);row.count=count;row.before='0'.repeat(64);assert.throws(()=>release.restore(raw(file),file),/exact main300 metadata output/);}finally{row.count=count;row.before=pin;}
 const f='assets/data/hani-history-releases-v1.json',meta=layer.files[f],edit=meta.replacements[0],after=edit.after;
 try{meta.count++;assert.throws(()=>release.restore(raw(f),f),/complete release301 metadata edit count/);meta.count--;edit.after='missing';assert.throws(()=>release.restore(raw(f),f),/unique complete release301 metadata/);edit.after='';assert.throws(()=>release.restore(raw(f),f),/nonempty exact release301 metadata/);}finally{meta.count=1;edit.after=after;}
});

test('301 history selects fixed300 only for all nine exact owner bytes and preserves raw Git evidence',()=>{
 assert.equal(repository.readOnly(['merge-base','HEAD','origin/main']),layer.release);
 assert.equal(history.readOnly(['merge-base','HEAD','origin/main']),layer.base);
 assert.equal(seatHistory.readOnly(['merge-base','HEAD','origin/main']),release300.layer.release);
 assert.equal(reviewed300.readOnly(['merge-base','HEAD','origin/main']),release300.layer.base);
 for(const file of [...Object.keys(layer.files),...Object.keys(seat.delta.files)]){
  const target=path.join(diskRoot,file),source=read(target);
  for(const bad of [Buffer.concat([source,Buffer.from('\n')]),source.subarray(1),Buffer.from(source.toString('utf8').replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'))]){
   assert.notDeepEqual(source,bad);assert.equal(history.selectBase(layer.release,f=>f===target?bad:read(f)),layer.release,file+' drift cannot authorize an older base');
  }
 }
 for(const base of [layer.base,layer.feature,release300.layer.release,'0'.repeat(40)])assert.equal(history.selectBase(base),base);
 assert.throws(()=>history.selectBase(layer.release,()=>{throw Error('read failure')}),/read failure/);
 for(const args of [['show',layer.release+':hani-main.js'],['log','--first-parent','--format=%H%x09%s','origin/main'],['rev-parse','HEAD'],['diff-tree','--no-commit-id','--name-only','-r',layer.release]])assert.equal(history.readOnly(args),repository.readOnly(args));
});

test('301 raw closure and every older input boundary preserve exact assets without missing files',async()=>{
 const peel=(s,f)=>audit.project(release300.project(seat.project(release.project(s,f),f),f),f);
 const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>raw(f)});
 assert.equal(closure.files.length,174);assert.deepEqual(closure.missing,[]);
 for(const file of closure.files){
  assert.equal(raw(file).toString('utf8'),repository.read(layer.release,file));
  assert.equal(release300.readRawFileSync(new URL(file,root),'utf8'),repository.read(release300.layer.release,file));
 }
 const counts=[];
 for(const version of ['2.9.299','2.9.298','2.9.297','2.9.296','2.9.295','2.9.294','2.9.293','2.9.289']){
  const c=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>layers.projectReleaseSource(peel(raw(f),f),f,version)});counts.push(c.files.length);assert.deepEqual(c.missing,[]);
 }
 assert.deepEqual(counts,[173,173,173,172,172,171,168,164]);
});

test('301 preload preserves sync callback promise Buffer string URL fd errors and raw disk',async()=>{
 const files=[...Object.keys(layer.files),'hani-office-live.js','scripts/hani-runtime-closure.mjs'];
 const originals=new Map(files.map(f=>[fileURLToPath(new URL(f,root)),raw(f)])),error=new Error('read failed');
 const disk=(file,encoding)=>{if(file===42)return Buffer.from('fd');const bytes=originals.get(file instanceof URL?fileURLToPath(file):file);assert.ok(bytes);return encoding==='utf8'?bytes.toString('utf8'):bytes};
 const fake={readFileSync:disk,readFile(file,...args){const done=args.pop();file==='error'?done(error):done(null,disk(file,args[0]))},promises:{readFile:async(file,...args)=>{if(file==='error')throw error;return disk(file,...args)}}};let synced=false;
 vm.runInNewContext(raw('scripts/hani-release-301-preload.cjs').toString('utf8'),{__dirname:fileURLToPath(new URL('.',import.meta.url)),URL,require:name=>name==='node:fs'?fake:name==='node:path'?path:name==='node:url'?{fileURLToPath}:name==='node:module'?{syncBuiltinESMExports(){synced=true}}:name==='./hani-release-301-source.cjs'?release:assert.fail(name)});
 assert.ok(synced);
 for(const name of files){const url=new URL(name,root),source=originals.get(fileURLToPath(url)),expected=release.project(source,name);
  for(const file of [url,fileURLToPath(url)])for(const encoding of [undefined,'utf8']){
   const want=encoding?expected.toString('utf8'):expected;assert.deepEqual(fake.readFileSync(file,encoding),want);
   assert.deepEqual(await new Promise((resolve,reject)=>fake.readFile(file,encoding,(e,b)=>e?reject(e):resolve(b))),want);assert.deepEqual(await fake.promises.readFile(file,encoding),want);
  }assert.deepEqual(raw(name),source);
 }
 assert.deepEqual(fake.readFileSync(42),Buffer.from('fd'));
 await new Promise(resolve=>fake.readFile('error',(e,b)=>{assert.equal(e,error);assert.equal(b,undefined);resolve()}));
 await assert.rejects(fake.promises.readFile('error'),e=>e===error);
});
