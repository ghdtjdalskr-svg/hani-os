import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {runBoardCases,makeBoardFixture,runRenderCases} from './hani-procrastination-cases.mjs';
import {pbDelta,pbHash,restoreChibitoonSource,restoreRelease283Source} from './hani-pb-chibitoon-source.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const source=read('hani-procrastination-board.js'),css=read('hani-procrastination-board.css');
const load=code=>{const window={};vm.runInNewContext(code,{window});return window.HaniProcrastination};
const api=load(source),before=load(restoreChibitoonSource(source,'hani-procrastination-board.js'));

test('raw runtime passes every original functional and persistent-render assertion',()=>{
  assert.ok(runBoardCases(api,assert)>=120);
  runRenderCases(source,assert,(code,env)=>vm.runInNewContext(code,env));
  assert.doesNotMatch(source,/localStorage|sessionStorage|\.setItem\(|\.removeItem\(|\.clear\(|\bfetch\(|\bcommit\(|\bsave\(|\.from\(|\.upsert\(|\.insert\(|\.delete\(|addEventListener|setTimeout|setInterval|MutationObserver/);
});

test('legacy assertions are retained verbatim; the synthetic DOM only gains setAttribute support',()=>{
  const normalize=value=>value.replace(/\r\n/g,'\n');
  const original=normalize(read('artifacts/pb-toon/stage3/original-hani-procrastination-board.test.mjs'));
  assert.equal(pbHash(original),'643c216fb7ca396c60f5c0f01fc05fefb16be8d213f4c9727e0411c198e3b03a','frozen origin/main dca9ecf legacy test');
  assert.equal(normalize(read('scripts/hani-procrastination-board.test.mjs')).replace("import './hani-pb-chibitoon-legacy-preload.mjs';\n",''),original);
  const cases=normalize(read('scripts/hani-procrastination-cases.mjs')).replace("onclick:null,attributes:{},setAttribute(name,value){this.attributes[name]=value}","onclick:null");
  assert.equal(cases,normalize(read('artifacts/pb-toon/stage2/original-hani-procrastination-cases.mjs')));
});

test('all dialogue, labels, stage calculations, routes and read models remain identical except retired images',()=>{
  for(const fixture of [makeBoardFixture(),{},null,{ledgerMonths:[{items:[{}]}]}]){
    const removeImage=items=>JSON.parse(JSON.stringify(items)).map(row=>{delete row.staff.image;return row});
    assert.deepEqual(removeImage(api.project(fixture,'2026-11-08')),removeImage(before.project(fixture,'2026-11-08')));
  }
  const calculation=code=>code.slice(code.indexOf('  const SPECS = ['),code.indexOf('  function render(state)'));
  assert.equal(calculation(source),calculation(restoreChibitoonSource(source,'hani-procrastination-board.js')));
  assert.doesNotMatch(source,/image:|assets\/profiles|assets\/street-journal/);
  assert.doesNotMatch(css,/assets\/profiles|assets\/street-journal|filter:|transform:/);
});

test('outer inverses restore complete bytes and reject drift, duplicate and repeated restoration',()=>{
  for(const file of Object.keys(pbDelta.files)){
    const current=read(file),restored=restoreChibitoonSource(current,file);
    assert.equal(pbHash(restored),pbDelta.files[file].beforeSha256);
    for(const bad of [current+'\n',current.slice(1),current+current,restored])assert.throws(()=>restoreChibitoonSource(bad,file),/exact chibitoon input/);
  }
  for(const file of Object.keys(pbDelta.release283)){
    const current=read(file),restored=restoreRelease283Source(current,file);
    assert.equal(pbHash(restored),pbDelta.release283[file].beforeSha256);
    for(const bad of [current+'\n',current.slice(1),current+current,restored])assert.throws(()=>restoreRelease283Source(bad,file),/exact release283 input/);
  }
});

test('one byte-identical literal sheet is reachable; raw closure reports exact additions/removals',async()=>{
  const sheet='assets/procrastination/pb-chibi-sheet-v1.webp';
  assert.deepEqual(fs.readFileSync(new URL('../'+sheet,import.meta.url)),fs.readFileSync(new URL('../artifacts/pb-toon/drafts/pb-chibi-sheet-v1.webp',import.meta.url)));
  const current=await resolveRuntimeClosure({exists:file=>fs.existsSync(new URL('../'+file,import.meta.url)),read:file=>fs.readFileSync(new URL('../'+file,import.meta.url))});
  const old=JSON.parse(read('artifacts/pb-toon/stage2/baseline.json'));
  assert.deepEqual(current.missing,[]);
  assert.deepEqual(current.files.filter(f=>!old.closure.files.includes(f)),[sheet]);
  assert.ok(current.files.length<=200);
  const changed=Object.entries(old.files).filter(([file,hash])=>pbHash(fs.readFileSync(new URL('../'+file,import.meta.url)))!==hash).map(([file])=>file).sort();
  assert.deepEqual(changed,['hani-procrastination-board.css','hani-procrastination-board.js']);
  fs.writeFileSync(new URL('../artifacts/pb-toon/stage2/closure.json',import.meta.url),JSON.stringify({before:old.closure.files.length,after:current.files.length,added:current.files.filter(f=>!old.closure.files.includes(f)),removed:old.closure.files.filter(f=>!current.files.includes(f)),missing:current.missing,files:current.files,changed},null,2));
});
