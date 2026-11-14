// Read-only preservation checks; does not run Git, build a package or launch Edge.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),local=path.join(__dirname,'tooling297-local');
const hash=b=>createHash('sha256').update(b).digest('hex'),read=f=>fs.readFileSync(path.join(root,f));
const snapshot=JSON.parse(fs.readFileSync(path.join(local,'snapshot.json'),'utf8'));
const changed=Object.keys(snapshot).filter(f=>hash(read(f))!==snapshot[f]);
const expected=['scripts/fixtures/release-version-layers.json','scripts/hani-chibi-pack-3-source.cjs','scripts/hani-release-296.test.mjs','scripts/hani-release-version-layers.cjs'];
assert.deepEqual(changed.slice().sort(),expected.slice().sort(),'only authorized existing tooling changes');
const production=Object.keys(snapshot).filter(f=>!f.startsWith('scripts/'));
assert.ok(production.every(f=>hash(read(f))===snapshot[f]),'all captured runtime/data/root JSON files preserved');
const fixtures=Object.keys(snapshot).filter(f=>f.startsWith('scripts/fixtures/')&&f!=='scripts/fixtures/release-version-layers.json');
assert.ok(fixtures.every(f=>hash(read(f))===snapshot[f]),'all existing frozen fixtures unchanged');
const tests=Object.keys(snapshot).filter(f=>f.startsWith('scripts/')&&/[.-]test\.[cm]?js$/.test(f));
for(const file of tests){
 let source=read(file);
 if(file==='scripts/hani-release-296.test.mjs')source=Buffer.from(source.toString('utf8').replace("import layers from './hani-release-296-input.cjs';","import layers from './hani-release-version-layers.cjs';"));
 assert.equal(hash(source),snapshot[file],'original test body/assertions unchanged '+file);
}
const before=fs.readFileSync(path.join(local,'release-version-layers.json.before'),'utf8'),after=read('scripts/fixtures/release-version-layers.json').toString('utf8');
const oldStart=before.indexOf('    {');
// The existing first row starts immediately after the newly inserted complete row.
const oldTail=before.slice(oldStart);assert.ok(after.endsWith(oldTail),'all existing manifest rows byte-for-byte unchanged');
const oldManifest=JSON.parse(before),manifest=JSON.parse(after);
assert.deepEqual(manifest.layers.slice(1),oldManifest.layers);
const source=read('scripts/hani-chibi-pack-3-source.cjs').toString('utf8').replace("require('./hani-release-297-preload.cjs');\n",'');
assert.equal(hash(source),snapshot['scripts/hani-chibi-pack-3-source.cjs'],'only outer input preload, no inverse/hash changes');
const repository=require('../../scripts/hani-test-repository-evidence.cjs');
const release=repository.resolve('bc3b22c');
for(const file of ['index.html','hani-main.js','hani-street-journal.css','assets/data/hani-history-releases-v1.json'])assert.equal(read(file).toString('utf8'),repository.read(release,file),'independent release297 runtime owner '+file);
const index=read('index.html').toString('utf8');assert.equal(index.match(/hani-main\.js\?v=([^"']+)/)[1],'2.9.297');
const move=JSON.parse(fs.readFileSync(path.join(local,'evidence-move.json'),'utf8'));
assert.equal(hash(read(move.to)),move.sha256,'imported comparison PNG bytes preserved');
assert.equal(fs.existsSync(path.join(root,move.from)),false);
function checkEvidence(dir){for(const row of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,row.name);if(row.isDirectory())checkEvidence(file);else if(/\.(?:png|log)$/i.test(row.name))assert.ok(file.startsWith(local+path.sep),'PNG/log stays in tooling297-local '+file);}}
checkEvidence(__dirname);
const newScripts=fs.readdirSync(path.join(root,'scripts')).filter(f=>!snapshot['scripts/'+f]&&fs.statSync(path.join(root,'scripts',f)).isFile()).map(f=>'scripts/'+f);
const report={status:'PASS',base:release,changed,newScripts,productionUnchanged:production.length,frozenFixturesUnchanged:fixtures.length,existingTestsAssertionsUnchanged:tests.length,existingTestsByteIdentical:tests.length-1,manifestLowerRowsByteIdentical:true,sourceOnlyOuterPreload:true,comparisonPng:move,allTaskPngLogsInLocal:true,runtimeVersion:'2.9.297',git:'NOT_RUN',edge:'NOT_RUN'};
fs.writeFileSync(path.join(__dirname,'tooling297-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
