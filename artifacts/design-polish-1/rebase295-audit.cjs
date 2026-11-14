// Byte-level preservation audit. No Git process, runtime writes or assertion edits.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const repo=require('../../scripts/hani-test-repository-evidence.cjs'),root=path.resolve(__dirname,'../..');
const start=JSON.parse(fs.readFileSync(path.join(__dirname,'rebase295-start.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const runtime=f=>/^(?:[^/]+\.(?:js|css)|index\.html|assets\/|data\/)/.test(f);
const current={};
function walk(dir=''){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
 if(['.git','node_modules','.agents','.codex','.aws'].includes(e.name))continue;
 const f=dir?dir+'/'+e.name:e.name;if(e.isDirectory())walk(f);else if(e.isFile())current[f]=hash(fs.readFileSync(path.join(root,f)));
}}
walk();
const changed=Object.keys(start.files).filter(f=>current[f]!==start.files[f]),added=Object.keys(current).filter(f=>!start.files[f]);
const allowed=new Set(['docs/development-history/CURRENT.md','scripts/hani-chibi-pack-2-source.cjs','scripts/hani-design-polish-1-preload.cjs','scripts/hani-design-polish-1-source.cjs','scripts/hani-design-polish-1.browser.mjs','scripts/hani-design-polish-1.test.mjs','scripts/hani-release-version-layers.cjs','scripts/hani-theme-thaw-source.cjs','scripts/hani-theme-thaw.test.mjs']);
assert.deepEqual(changed.filter(f=>!allowed.has(f)&&!f.startsWith('artifacts/design-polish-1/')),[],'no unrelated existing file changes after output restoration');
assert.deepEqual(added.filter(f=>!f.startsWith('artifacts/design-polish-1/')&&!['scripts/hani-design-polish-1-frozen-preload.cjs','scripts/hani-design-polish-1-main295-source.cjs','scripts/hani-design-polish-1-main295.test.mjs','scripts/hani-design-polish-1-baseline.mjs','scripts/fixtures/design-polish-1-main295-delta.json','docs/development-history/handoffs/2026-11-14-design-polish-1-rebase295.md'].includes(f)),[],'no unrelated new files after output restoration');
const runtimeRows=[];
function visit(tree,prefix=''){for(const row of repo.tree(tree)){
 const f=prefix+row.name;if(row.mode==='40000'){if(['assets','data'].includes(f)||prefix)visit(row.sha,f+'/');}
 else if(runtime(f))runtimeRows.push({file:f,sha256:hash(repo.object(row.sha).data)});
}}
visit(repo.commit(start.base).tree);
const runtimeDiff=runtimeRows.filter(r=>current[r.file]!==r.sha256).map(r=>r.file);
assert.deepEqual(runtimeDiff.sort(),['hani-design-system.css','hani-main.js']);
assert.deepEqual(changed.filter(runtime),[],'runtime bytes unchanged during this task');
assert.deepEqual(added.filter(runtime),[],'no new runtime files');
const fixtures=Object.keys(start.files).filter(f=>f.startsWith('scripts/fixtures/'));
assert.deepEqual(fixtures.filter(f=>current[f]!==start.files[f]),[],'all pre-existing fixture pins retained');
const testChanges=changed.filter(f=>/test\.[cm]?js$/.test(f));
assert.deepEqual(testChanges,['scripts/hani-design-polish-1.test.mjs','scripts/hani-theme-thaw.test.mjs']);
const old=repo.read(start.head,'scripts/hani-design-polish-1.test.mjs'),now=fs.readFileSync(path.join(root,testChanges[0]),'utf8');
assert.equal(now.slice(now.indexOf("import test from 'node:test';")),old.slice(old.indexOf("import test from 'node:test';")),'all frozen test assertions and bodies byte-identical');
const thawBefore=repo.read(start.base,'scripts/hani-theme-thaw.test.mjs'),thawAfter=fs.readFileSync(path.join(root,'scripts/hani-theme-thaw.test.mjs'),'utf8');
assert.equal(thawAfter.replace("from './hani-design-polish-1-baseline.mjs'","from './hani-regression-baseline.mjs'"),thawBefore,'THAW changes its baseline input import only; every assertion is byte-identical');
const markerFiles=['docs/development-history/CURRENT.md','scripts/hani-release-version-layers.cjs','scripts/hani-theme-thaw-source.cjs'];
for(const f of markerFiles)assert.doesNotMatch(fs.readFileSync(path.join(root,f),'utf8'),/^(?:<<<<<<<|=======|>>>>>>>)/m,'conflict removed '+f);
assert.equal(repo.reference('HEAD'),start.head);assert.equal(repo.reference('origin/main'),start.main);
const result={base:start.base,head:start.head,changed,added,runtimeFiles:runtimeRows.length,runtimeDiff,existingFixtures:fixtures.length,fixtureDrift:[],frozenTestBody:'byte-identical',runtimeChangedDuringTask:[],conflicts:0};
fs.writeFileSync(path.join(__dirname,'rebase295-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({base:result.base,runtimeFiles:result.runtimeFiles,runtimeDiff:result.runtimeDiff,existingFixtures:result.existingFixtures,fixtureDrift:result.fixtureDrift,frozenTestBody:result.frozenTestBody,runtimeChangedDuringTask:result.runtimeChangedDuringTask,conflicts:result.conflicts,changed:result.changed}));
