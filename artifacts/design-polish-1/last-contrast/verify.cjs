// Compare exact initial bytes without invoking Git or a browser.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),read=f=>fs.readFileSync(path.join(root,f)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const initial=JSON.parse(read('artifacts/design-polish-1/last-contrast/start-hashes.json'));
const allowed=new Set(['hani-design-system.css','scripts/hani-design-polish-1.test.mjs','scripts/hani-design-polish-1-source.cjs','scripts/fixtures/design-polish-1-delta.json','docs/development-history/CURRENT.md','artifacts/design-polish-1/patch.css','artifacts/design-polish-1/REPORT.md','artifacts/design-polish-1/test-plan.json','artifacts/design-polish-1/test-results.json','artifacts/design-polish-1/test-summary.json']);
const task=f=>f.startsWith('artifacts/design-polish-1/last-contrast/')||f.startsWith('artifacts/design-polish-1/test-logs/')||f==='docs/development-history/handoffs/2026-11-14-design-polish-1-last-contrast.md';
const changed=[],added=[],missing=[],unexpected=[];
for(const [file,sha]of Object.entries(initial)){
 if(!fs.existsSync(path.join(root,file))){missing.push(file);continue;}
 if(hash(read(file))!==sha){changed.push(file);if(!allowed.has(file)&&!task(file))unexpected.push(file);}
}
function walk(folder=''){
 for(const e of fs.readdirSync(path.join(root,folder),{withFileTypes:true})){
  if(['.git','node_modules','.agents','.codex','.aws'].includes(e.name))continue;
  const f=folder?folder+'/'+e.name:e.name;if(e.isDirectory()){walk(f);continue;}
  if(!e.isFile()||initial[f])continue;added.push(f);if(!task(f))unexpected.push(f);
 }
}
walk();
const old='.pb-header .pb-intro{color:var(--text-secondary)!important}',next='.pb-header .pb-intro{color:color-mix(in srgb,var(--text-secondary) 96%,var(--text-primary))!important}';
for(const file of ['hani-design-system.css','artifacts/design-polish-1/patch.css']){
 const text=read(file).toString('utf8');assert.equal(text.split(next).length,2);
 assert.equal(hash(text.replace(next,old)),initial[file],'exactly one color declaration changed: '+file);
}
const fixture='scripts/fixtures/design-polish-1-delta.json',delta=JSON.parse(read(fixture)),pin=hash(read(fixture));
const row=delta.files['hani-design-system.css'];row.edits[0].after=row.edits[0].after.replace(next,old);row.afterSha256=initial['hani-design-system.css'];
assert.equal(hash(JSON.stringify(delta,null,2)+'\n'),initial[fixture],'only own CSS suffix/after pin changed');
const source='scripts/hani-design-polish-1-source.cjs';
assert.equal(hash(read(source).toString('utf8').replace(pin,initial[fixture])),initial[source],'source fixture pin only');
const ownTest='scripts/hani-design-polish-1.test.mjs';
const newAssertion=String.raw`assert.match(block,/\.pb-header \.pb-intro\{color:color-mix\(in srgb,var\(--text-secondary\) 96%,var\(--text-primary\)\)!important\}/);`;
const oldAssertion=String.raw`assert.match(block,/\.pb-header \.pb-intro\{color:var\(--text-secondary\)!important\}/);`;
assert.equal(hash(read(ownTest).toString('utf8').replace(newAssertion,oldAssertion)),initial[ownTest],'only own color expectation changed');
const fixtures=Object.keys(initial).filter(f=>f.startsWith('scripts/fixtures/')&&f!==fixture);
const tests=Object.keys(initial).filter(f=>/^scripts\/.*[.-]test\.[cm]?js$/.test(f)&&f!==ownTest);
const browser=Object.keys(initial).filter(f=>f.startsWith('artifacts/design-polish-1/browser-fixed/')||/^artifacts\/design-polish-1\/(?:before-|after-|browser-results\.json$)/.test(f));
const drift=files=>files.filter(f=>hash(read(f))!==initial[f]);
const result={result:missing.length||unexpected.length?'FAIL':'PASS',changed,added,missing,unexpected,existingFixtures:fixtures.length,fixtureDrift:drift(fixtures),existingTestsExceptOwn:tests.length,testDrift:drift(tests),originalBrowserEvidence:browser.length,browserDrift:drift(browser),runtimeChanged:changed.filter(f=>/^(?:index\.html|hani-.*\.(?:js|css))$/.test(f)),cssChange:'one existing pb-intro declaration: secondary 96%, primary 4%',sourceHashes:Object.fromEntries(['hani-design-system.css','hani-main.js',fixture,source,ownTest].map(f=>[f,hash(read(f))]))};
assert.deepEqual(result.runtimeChanged,['hani-design-system.css']);
for(const key of ['fixtureDrift','testDrift','browserDrift','unexpected','missing'])assert.deepEqual(result[key],[],key);
fs.writeFileSync(path.join(__dirname,'scope-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,changed:result.changed.length,added:result.added.length}));
