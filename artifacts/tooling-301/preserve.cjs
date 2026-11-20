// Restore only the four explicitly authorized generated artifacts, then audit.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),local=path.join(__dirname,'local');
const repo=require('../../scripts/hani-test-repository-evidence.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const generated=['artifacts/office-behavior/obr16-layout-node.json','artifacts/office-behavior/obr17-layout-node.json','artifacts/office-behavior/obr19-layout-node.json','artifacts/office-drama/reachability.json'];
const allowed=new Set(['scripts/hani-ieum-seat-source.cjs','scripts/hani-ieum-seat-reviewed-input.cjs','scripts/hani-ieum-seat-history.test.mjs']);
const start=JSON.parse(fs.readFileSync(path.join(local,'start-hashes.json'))),changedGenerated=[];
for(const f of generated){const dest=path.join(root,f);if(hash(fs.readFileSync(dest))!==start[f])changedGenerated.push(f);fs.copyFileSync(path.join(local,'originals',path.basename(f)),dest);assert.equal(hash(fs.readFileSync(dest)),start[f]);}
const changed=[],missing=[],preserved=[];
for(const [f,pin]of Object.entries(start)){
 if(!fs.existsSync(path.join(root,f))){missing.push(f);continue;}
 if(hash(fs.readFileSync(path.join(root,f)))!==pin)changed.push(f);else preserved.push(f);
}
const unexpected=changed.filter(f=>!allowed.has(f));
const report={snapshot:Object.keys(start).length,changed,unexpected,missing,restoredGenerated:changedGenerated,generatedOriginals:generated,existingTestsPreserved:preserved.filter(f=>/^scripts\/.*\.test\.(mjs|cjs|js)$/.test(f)).length,fixturesPreserved:preserved.filter(f=>f.startsWith('scripts/fixtures/')).length,runtimeChanged:changed.filter(f=>!f.startsWith('scripts/')),protectedChanged:changed.filter(f=>/^(\.github\/|AGENTS\.md$|dev-center\/|supabase\/)/.test(f)||['scripts/hani-one-pass-rules.mjs','scripts/hani-one-pass-release.mjs','scripts/hani-release-package.mjs','scripts/hani-runtime-closure.mjs','scripts/hani-release-preqa.mjs','scripts/hani-ci-scope.mjs','scripts/hani-board-library-build.mjs'].includes(f))};
const walk=(sha,prefix='')=>repo.tree(sha).flatMap(r=>r.mode==='40000'?walk(r.sha,prefix+r.name+'/'):[{file:prefix+r.name,sha:r.sha}]);
const baseRows=walk(repo.commit('ad95b84').tree),baseDrift=[];
for(const r of baseRows){const target=path.join(local,'baseline',r.file);if(!fs.existsSync(target)||hash(fs.readFileSync(target))!==hash(repo.object(r.sha).data))if(!generated.includes(r.file))baseDrift.push(r.file);}
report.baselineFiles=baseRows.length;report.baselineUnexpectedDrift=baseDrift;
fs.writeFileSync(path.join(__dirname,'preservation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));assert.deepEqual(missing,[]);assert.deepEqual(unexpected,[]);assert.deepEqual(report.protectedChanged,[]);assert.deepEqual(baseDrift,[]);
