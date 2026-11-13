// Read-only scope audit against this follow-up's exact starting workspace bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),read=f=>fs.readFileSync(path.join(root,f)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const initial=JSON.parse(read('artifacts/design-polish-1/browser-fix/start-hashes.json'));
const allowed=new Set(['hani-design-system.css','scripts/hani-design-polish-1.browser.mjs','scripts/hani-design-polish-1-source.cjs','scripts/fixtures/design-polish-1-delta.json','docs/development-history/CURRENT.md']);
const task=f=>f.startsWith('artifacts/design-polish-1/')||f==='docs/development-history/handoffs/2026-11-14-design-polish-1-browser-fix.md';
const changed=[],added=[],missing=[],unexpected=[];
for(const [file,sha]of Object.entries(initial)){
 if(!fs.existsSync(path.join(root,file))){missing.push(file);continue;}
 if(hash(read(file))!==sha){changed.push(file);if(!allowed.has(file)&&!task(file))unexpected.push(file);}
}
function walk(folder=''){
 for(const e of fs.readdirSync(path.join(root,folder),{withFileTypes:true})){
  if(['.git','node_modules','.agents','.codex','.aws'].includes(e.name))continue;
  const f=folder?folder+'/'+e.name:e.name;if(e.isDirectory()){walk(f);continue;}
  if(!e.isFile()||initial[f])continue;added.push(f);
  if(!task(f)&&!['scripts/hani-design-polish-1-contrast.mjs','scripts/hani-design-polish-1-contrast.test.mjs'].includes(f))unexpected.push(f);
 }
}
walk();
const css=read('hani-design-system.css').toString('utf8'),current='min-height:44px!important;padding:10px 12px;line-height:1.4',previous='min-height:44px;padding:10px 12px;line-height:1.4';
assert.equal(css.split(current).length,2);assert.equal(hash(css.replace(current,previous)),initial['hani-design-system.css'],'only one !important added in CSS');
assert.equal(hash(read('hani-main.js')),initial['hani-main.js'],'runtime JS including previous month title is unchanged');
const fixtures=Object.keys(initial).filter(f=>f.startsWith('scripts/fixtures/')&&f!=='scripts/fixtures/design-polish-1-delta.json');
const fixtureDrift=fixtures.filter(f=>hash(read(f))!==initial[f]);
const oldBrowser=Object.keys(initial).filter(f=>/^artifacts\/design-polish-1\/(?:before-|after-|browser-results\.json$)/.test(f));
const browserDrift=oldBrowser.filter(f=>hash(read(f))!==initial[f]);
const tests=Object.keys(initial).filter(f=>/^scripts\/.*[.-]test\.[cm]?js$/.test(f));
const testDrift=tests.filter(f=>hash(read(f))!==initial[f]);
const result={result:missing.length||unexpected.length||fixtureDrift.length||browserDrift.length||testDrift.length?'FAIL':'PASS',changed,added,missing,unexpected,existingFixtures:fixtures.length,fixtureDrift,existingTestFiles:tests.length,testDrift,originalBrowserEvidence:oldBrowser.length,browserDrift,runtimeChanged:changed.filter(f=>/^(?:index\.html|hani-.*\.(?:js|css))$/.test(f)),cssChange:'one min-height !important in the existing search patch',sourceHashes:Object.fromEntries(['hani-design-system.css','hani-main.js','scripts/fixtures/design-polish-1-delta.json','scripts/hani-design-polish-1.browser.mjs','scripts/hani-design-polish-1-contrast.mjs'].map(f=>[f,hash(read(f))]))};
fs.writeFileSync(path.join(__dirname,'scope-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));if(result.result!=='PASS')process.exitCode=1;
