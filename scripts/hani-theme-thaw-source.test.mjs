import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import inverse from './hani-theme-thaw-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {delta,hash,restore,project,readRawFileSync:read}=inverse;
const raw=file=>read(new URL('../'+file,import.meta.url),'utf8');
test('THAW inverse restores independently identified main293 bytes, exact CSS suffix and four JS additions',()=>{
 assert.equal(delta.base,'e1f3ac7e944484b09fe102464b22ef6e66204d9a');
 assert.equal(delta.files['hani-main.js'].edits.length,4);
 assert.equal(delta.files['hani-design-system.css'].edits.length,1);
 for(const [file,row]of Object.entries(delta.files)){
  const source=raw(file),before=repository.read(delta.base,file);
  assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(restore(source,file),before);assert.deepEqual(restore(Buffer.from(source),file),Buffer.from(before));
  assert.equal(project(source,file),before);assert.equal(project(before,file),before);
  assert.equal(row.edits.reduce((s,e)=>{assert.equal(e.before,'');return s.replace(e.after,()=>e.before)},source),before);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.throws(()=>restore(bad,file),/exact THAW input/);assert.equal(project(bad,file),bad);
  }
  assert.equal(raw(file),source,'no disk mutation');
 }
 assert.throws(()=>restore('unknown','unknown'),/known THAW owner/);
});
test('exact source projection removes only the three new closure files, retaining all independent main file names',async()=>{
 const root=new URL('../',import.meta.url),exists=f=>fs.existsSync(new URL(f,root));
 const current=await resolveRuntimeClosure({exists,read:f=>read(new URL(f,root))});
 const lower=await resolveRuntimeClosure({exists,read:f=>project(read(new URL(f,root)),f)});
 assert.deepEqual(current.missing,[]);assert.deepEqual(lower.missing,[]);
 assert.deepEqual(current.files.filter(f=>!lower.files.includes(f)),delta.added.map(r=>r.file));
 assert.deepEqual(lower.files.filter(f=>!current.files.includes(f)),[]);
 const main=await resolveRuntimeClosure({exists,read:f=>Buffer.from(repository.read(delta.base,f))});
 assert.deepEqual(lower.files,main.files);
 for(const row of delta.added)assert.equal(hash(read(new URL(row.file,root))),row.sha256);
 assert.equal(raw('hani-design-system.css').indexOf('/* Theme contrast:' )<raw('hani-design-system.css').indexOf('/* Quarterly campaign'),true);
});
test('actual home and view owners retain canonical THAW slots on latest main without additional event layers',()=>{
 const source=raw('hani-main.js'),before=repository.read(delta.base,'hani-main.js');
 const home=s=>{const start=s.indexOf('function renderHome(){'),end=s.indexOf('function homeQuizMetrics(){',start);assert.ok(start>=0&&end>start,'complete actual home owner boundaries');return s.slice(start,end)};
 assert.equal(home(source).replace('  syncThemeCollections();\n',''),home(before));
 assert.equal(source.split('anchor.after(card)').length-1,1);assert.equal(source.split('if(id==="home"||id==="aura")syncThemeCollections();').length-1,1);
 const block=source.slice(source.indexOf('const THEME_COLLECTIONS='),source.indexOf('function syncSeasonCollection(){'));
 assert.doesNotMatch(block,/localStorage|addEventListener|setInterval|setTimeout/);
 new vm.Script(source);
});
