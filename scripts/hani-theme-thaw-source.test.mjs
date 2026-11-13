import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import inverse from './hani-theme-thaw-source.cjs';
import releases from './hani-release-version-layers.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {delta,hash,restore,project,readRawFileSync:read}=inverse;
// Keep the frozen THAW assertions on their original 293-versioned JS input.
// History is already frozen with the complete 294 entry/293 commit metadata.
const raw=file=>{
 const source=read(new URL('../'+file,import.meta.url),'utf8');
 return file==='hani-main.js'?releases.projectPreRelease294Source(source,file):source;
};
test('THAW inverse restores independently identified main293 bytes, exact CSS suffix and four JS additions',()=>{
 assert.equal(delta.base,'bcc588ba634cc28ca9922210153f1cffec6d9e91');
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
test('THAW release history metadata restores exact seeded main293 bytes without changing disk or older fixture pins',()=>{
 assert.deepEqual(Object.keys(delta.metadata),['assets/data/hani-history-releases-v1.json']);
 for(const [file,row]of Object.entries(delta.metadata)){
  const source=raw(file),before=repository.read(delta.base,file);
  assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(restore(source,file),before);assert.deepEqual(restore(Buffer.from(source),file),Buffer.from(before));
  assert.equal(project(source,file),before);assert.equal(project(before,file),before);
  assert.equal(row.edits.reduce((text,edit)=>text.replace(edit.after,()=>edit.before),source),before);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
   assert.throws(()=>restore(bad,file),/exact THAW input/);assert.equal(project(bad,file),bad);
  }
  assert.equal(raw(file),source,'no disk mutation');
 }
});
test('exact source projection removes only the three new closure files, retaining all independent main file names',async()=>{
 const root=new URL('../',import.meta.url),exists=f=>fs.existsSync(new URL(f,root));
 const current=await resolveRuntimeClosure({exists,read:f=>read(new URL(f,root))});
 const lower=await resolveRuntimeClosure({exists,read:f=>project(read(new URL(f,root)),f)});
 assert.deepEqual(current.missing,[]);assert.deepEqual(lower.missing,[]);
 assert.deepEqual(current.files.filter(f=>!lower.files.includes(f)),delta.added.map(r=>r.file));
 assert.deepEqual(lower.files.filter(f=>!current.files.includes(f)),[]);
 assert.equal(current.files.length,171);assert.equal(lower.files.length,168);
 assert.equal(current.files.includes('hani-theme-collections.json'),false,'seeded root JSON is no longer reachable');
 const moved='assets/theme-collections/collections.json';
 assert.equal(current.files.filter(f=>f===moved).length,1);
 assert.deepEqual(current.files.filter(f=>/^assets\/theme-collections\/.*\.webp$/.test(f)),delta.added.filter(r=>r.file.endsWith('.webp')).map(r=>r.file));
 const original=JSON.parse(raw('hani-theme-collections.json')),definitions=JSON.parse(raw(moved));
 assert.deepEqual(definitions,original.map(item=>({...item,art:item.art.replace('./assets/theme-collections/',''),mobileArt:item.mobileArt.replace('./assets/theme-collections/','')})));
 assert.equal(raw('hani-theme-collections.json'),repository.read(delta.base,'hani-theme-collections.json'),'root seed remains byte-identical to main');
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
