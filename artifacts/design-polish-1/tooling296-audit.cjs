// Task-start byte preservation and independent runtime audit. No Git executable.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),local=path.join(__dirname,'tooling296-local'),start=JSON.parse(fs.readFileSync(path.join(local,'start.json'),'utf8'));
const repository=require('../../scripts/hani-test-repository-evidence.cjs');
const hash=b=>createHash('sha256').update(b).digest('hex'),current={};
function walk(dir=''){
 for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  if(['.git','node_modules','.agents','.codex','.aws','tooling296-local'].includes(e.name))continue;
  const f=dir?dir+'/'+e.name:e.name;if(e.isDirectory())walk(f);else if(e.isFile())current[f]=hash(fs.readFileSync(path.join(root,f)));
 }
}
walk();
const changed=Object.keys(start.files).filter(f=>current[f]!==start.files[f]),added=Object.keys(current).filter(f=>!start.files[f]);
const currentFile='docs/development-history/CURRENT.md',currentBytes=fs.readFileSync(path.join(root,currentFile)),previousHeading=Buffer.from('# 2026-11-14 · design295 ·');
const previousAt=currentBytes.indexOf(previousHeading);assert.ok(previousAt>=0,'original CURRENT heading retained');
assert.equal(hash(currentBytes.subarray(previousAt)),start.files[currentFile],'all prior CURRENT bytes retained');
assert.deepEqual([...changed,...added].filter(f=>!['scripts/','docs/','artifacts/'].some(p=>f.startsWith(p))),[],'only authorized directories changed');
const runtime=f=>/^(?:[^/]+\.(?:js|css)|index\.html|assets\/|data\/)/.test(f);
assert.deepEqual([...changed,...added].filter(runtime),[],'no runtime files changed or added');
const fixtures=Object.keys(start.files).filter(f=>f.startsWith('scripts/fixtures/')&&f!=='scripts/fixtures/release-version-layers.json');
assert.deepEqual(fixtures.filter(f=>current[f]!==start.files[f]),[],'all existing frozen fixtures unchanged');
const manifestFile='scripts/fixtures/release-version-layers.json',text=fs.readFileSync(path.join(root,manifestFile),'utf8'),manifest=JSON.parse(text),outer=manifest.layers[0];
assert.equal(outer.to,'2.9.296');assert.equal(outer.from,'2.9.295');
const insertion='\n'+JSON.stringify(outer,null,2).split('\n').map(s=>'    '+s).join('\n')+',';
const oldManifest=text.replace('"layers": ['+insertion,'"layers": [');
assert.equal(hash(oldManifest),start.files[manifestFile],'old manifest bytes/rows/pins preserved exactly');
const testChanges=changed.filter(f=>/test\.[cm]?js$/.test(f)).sort();
assert.deepEqual(testChanges,['scripts/hani-design-polish-1-main295.test.mjs','scripts/hani-release-295.test.mjs']);
for(const [f,from,to]of [
 ['scripts/hani-design-polish-1-main295.test.mjs',"from './hani-design-polish-1-main295-input.cjs'","from './hani-design-polish-1-main295-source.cjs'"],
 ['scripts/hani-release-295.test.mjs',"from './hani-release-295-input.cjs'","from './hani-release-version-layers.cjs'"]
])assert.equal(hash(fs.readFileSync(path.join(root,f),'utf8').replace(from,to)),start.files[f],'existing test body/assertions/numbers/hash byte-identical '+f);
const runtimeRows=[];
function visit(tree,prefix=''){
 for(const row of repository.tree(tree)){
  const f=prefix+row.name;
  if(row.mode==='40000'){if(prefix||['assets','data'].includes(f))visit(row.sha,f+'/');}
  else if(runtime(f))runtimeRows.push({file:f,sha256:hash(repository.object(row.sha).data)});
 }
}
visit(repository.commit('56c3105').tree);
assert.deepEqual(runtimeRows.filter(r=>current[r.file]!==r.sha256),[],'all runtime bytes equal independent release296 objects');
const inputFiles=Object.keys(current).filter(f=>f.startsWith('scripts/')&&(changed.includes(f)||added.includes(f)));
const results={base:repository.resolve('56c3105'),branch:start.branch,changed,added,runtimeFiles:runtimeRows.length,runtimeDrift:[],existingFrozenFixtures:fixtures.length,fixtureDrift:[],oldManifestBytes:'identical',testChanges,testBodies:'identical except input import',inputHashes:Object.fromEntries(inputFiles.map(f=>[f,current[f]])),note:'Git/Edge/process read-back not executed; fixed repository objects read without Git commands.'};
fs.writeFileSync(path.join(__dirname,'tooling296-audit.json'),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify({runtimeFiles:runtimeRows.length,runtimeDrift:0,existingFrozenFixtures:fixtures.length,fixtureDrift:0,oldManifestBytes:results.oldManifestBytes,testBodies:results.testBodies,changed,added}));
