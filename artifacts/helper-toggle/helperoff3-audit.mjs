// Read-only source/fixture/runtime audit for the main297+#513 outer re-layer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import inverse from '../../scripts/hani-helper-toggle-source.cjs';
import repository from '../../scripts/hani-test-repository-evidence.cjs';
import release297 from '../../scripts/hani-release-297-source.cjs';
import {resolveRuntimeClosure} from '../../scripts/hani-runtime-closure.mjs';
const root=path.resolve(import.meta.dirname,'../..'),base='22fedb33cbd67923cc499ba99f55e8902a66ecb2';
const read=f=>inverse.readRawFileSync(path.join(root,f)),hash=b=>createHash('sha256').update(b).digest('hex');
const start=JSON.parse(read('artifacts/helper-toggle/local/helperoff3/start.json'));
assert.equal(start.base,base);
const owners=Object.keys(inverse.delta.files).sort(),runtime=[],fixtures=[],tests=[];
function visit(tree,prefix=''){
 for(const row of repository.tree(tree)){
  const file=prefix+row.name;
  if(row.mode==='40000'){if(prefix||['assets','data','scripts'].includes(file))visit(row.sha,file+'/');continue;}
  const before=repository.object(row.sha).data;
  if(/^(?:[^/]+\.(?:js|css)|index\.html|assets\/|data\/)/.test(file)){
   const bytes=read(file);assert.equal(hash(bytes),start.files[file],'runtime untouched since start '+file);
   if(owners.includes(file)){
    assert.equal(before.toString(),repository.read(inverse.delta.base,file),'main297 owner equals frozen provenance '+file);
    assert.deepEqual(inverse.restore(bytes,file),before,'exact inverse independently restores main297 '+file);
    assert.deepEqual(release297.readRawFileSync(path.join(root,file)),before,'297 capture follows helper inverse '+file);
   }else assert.deepEqual(bytes,before,'unchanged main297 runtime '+file);
   runtime.push(file);
  }
  if(file.startsWith('scripts/fixtures/')){assert.deepEqual(read(file),before,'complete main297 fixture preserved '+file);fixtures.push(file);}
  if(/^scripts\/[^/]+[.-]test\.[cm]?js$/.test(file)){
   let actual=read(file).toString();
   if(['scripts/hani-helper-bot.test.mjs','scripts/hani-fun-chat-fortune.test.mjs'].includes(file))actual=actual.replace("import './hani-release-297-preload.cjs';\n",'');
   assert.equal(actual,before.toString(),'original assertions, numbers and hashes unchanged '+file);tests.push(file);
  }
 }
}
visit(repository.commit(base).tree);
for(const file of ['scripts/hani-release-296-source.cjs','scripts/hani-design-polish-1-source.cjs'])assert.equal(read(file).toString(),repository.read(base,file),'main chibi3 entry restored '+file);
const source297=read('scripts/hani-release-297-source.cjs').toString();
assert.equal(source297.replace("require('./hani-helper-toggle-preload.cjs');\n",''),repository.read(base,'scripts/hani-release-297-source.cjs'),'only outer preload added');
for(const file of ['scripts/fixtures/helper-toggle-delta.json','scripts/hani-helper-toggle.test.mjs','scripts/hani-helper-toggle-fixture.mjs','scripts/hani-helper-toggle-preload.cjs','scripts/hani-helper-toggle.browser.mjs'])assert.equal(hash(read(file)),start.files[file],'helperoff2 bytes preserved '+file);
const raw=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:async f=>read(f)});
const restored=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:async f=>inverse.project(read(f),f)});
assert.deepEqual(raw.missing,[]);assert.deepEqual(restored.missing,[]);assert.deepEqual(raw.files,restored.files);
const results=JSON.parse(read('artifacts/helper-toggle/local/results.json'));
const baseline=[];
for(const [name,file]of [['helper-bot','scripts/hani-helper-bot.test.mjs'],['fun-chat-fortune','scripts/hani-fun-chat-fortune.test.mjs']]){
 const log=read('artifacts/helper-toggle/local/helperoff3/'+name+'-main297.tap').toString();
 const projected=read(results.find(r=>r.file===file).log).toString();
 const statuses=s=>s.split(/\r?\n/).filter(l=>/^(?:not )?ok \d+ - /.test(l));
 const counts=s=>['pass','fail','skipped'].map(k=>s.match(new RegExp('^# '+k+' \\d+','m'))?.[0]);
 assert.ok(statuses(log).length,'independent original suite executed');
 assert.deepEqual(statuses(projected),statuses(log),'every main297 subtest status matches '+file);
 assert.deepEqual(counts(projected),counts(log),'all main297 counts match '+file);
 baseline.push({file,statuses:statuses(log),counts:counts(log)});
}
const tooling=JSON.parse(read('artifacts/chibi-pack-3/tooling297-plan.json'));
const ready=tooling.plan.filter(r=>r.status==='READY'),toolingRows=ready.map(r=>results.find(x=>x.file===r.file));
assert.ok(toolingRows.every(Boolean),'every #513 READY file executed');
assert.ok(toolingRows.every(r=>r.exit===0&&r.fail===0&&!r.blocked),'all #513 non-Git regressions pass');
const total=rows=>({files:rows.length,pass:rows.reduce((s,r)=>s+r.pass,0),fail:rows.reduce((s,r)=>s+r.fail,0),skip:rows.reduce((s,r)=>s+r.skip,0)});
const result={base,headAtStart:start.head,runtimeFiles:runtime.length,runtimeChangesSinceStart:0,helperOwners:owners,deltaAndPins:'unchanged; exact main297 inverse independently verified',existingTests:tests.length,existingFixtures:fixtures.length,originalAssertions:'all preserved',outerOrder:'helper toggle -> 297 version/history -> chibi3 -> 296 -> design1 -> 295 -> lower layers',closure:{raw:raw.files.length,helperRestored:restored.files.length,missing:[]},independentMain297:baseline,tooling297:total(toolingRows),office:total(results.filter(r=>r.office)),git:'NOT_RUN',edge:'NOT_RUN',production:'NOT_RUN',currentDocument:'pre-existing conflict markers; unchanged; Seoyun handoff'};
fs.writeFileSync(path.join(import.meta.dirname,'helperoff3-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,independentMain297:baseline.map(r=>({file:r.file,counts:r.counts}))}));
