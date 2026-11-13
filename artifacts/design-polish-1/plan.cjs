// Enumerate requested tests plus every CSS-reading test; never launches Git/Edge.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),scripts=path.join(root,'scripts');
const known=['settings-225','ilbo-banner-215','study-news-material','pb-chibitoon','brand-heroes-218','dash-218','fun-top3','hero-restore','ilbo-213','invest-split-ui','investment-research-ui','mascots-poster','nav-groups','owner-verification-ui','qa-210','qa-design-b4','qa-report-fixes','remote-media-219','reviewed-release-baseline','simplify-225','theme-white-215','ui-203b'];
const graph=new Map();
function dependencies(file,seen=new Set()){
 if(seen.has(file)||!fs.existsSync(file)||!fs.statSync(file).isFile())return [];
 seen.add(file);const s=fs.readFileSync(file,'utf8'),rows=[{file:path.relative(root,file).replaceAll('\\','/'),source:s}];
 for(const m of s.matchAll(/(?:from\s*|import\s*\(|require\s*\(|import\s*)['"](\.\.?\/[^'"]+)['"]/g)){
  let f=path.resolve(path.dirname(file),m[1]);if(!path.extname(f))f+='.js';
  if(/\.[cm]?js$/.test(f)&&f.startsWith(root+path.sep))rows.push(...dependencies(f,seen));
 }
 return rows;
}
const tests=fs.readdirSync(scripts).filter(f=>/[.-]test\.[cm]?js$/.test(f));
const requested=tests.filter(f=>/^hani-office.*\.test\.mjs$/.test(f)||/^hani-(?:theme-thaw|theme-contrast|contrast-291|release-294|release-version-layers|seoyun-m9|save-guard|join-ieum|chibi-pack-1|app-216-audit|qa-easy-cleanup|history-226|street-journal|design-polish-1)/.test(f));
const cssReaders=tests.filter(f=>fs.readFileSync(path.join(scripts,f),'utf8').includes('hani-design-system.css'));
const plan=[...new Set([...requested,...cssReaders])].sort().map(file=>{
 const nodes=dependencies(path.join(scripts,file));graph.set(file,nodes);
 const git=nodes.filter(n=>/\b(?:execFileSync|execSync|spawnSync|execFile|spawn)\s*\(\s*['"`]git(?:['"`\s])/.test(n.source)).filter(n=>{
  // Many tests import only at(), or loadScene() without a historical ref.
  // This fixture's Git fallback runs exclusively for explicit ref arguments.
  if(n.file!=='scripts/hani-office-lively-fixture.mjs')return true;
  return nodes.filter(x=>x!==n).some(x=>/\breadAt\s*\([^\n]*,|\bloadScene\s*\(\s*\{\s*ref\b/.test(x.source));
 });
 const direct=nodes[0].source;
 const browser=/process\.argv\[2\]/.test(direct)&&/await\s+(?:chromium\.)?launch|await\s+import\(pathToFileURL\(process\.argv\[2\]\)/.test(direct)&&!/(--browser|--unit-only)/.test(direct);
 const args=file==='hani-history-226.test.mjs'?['--unit-only']:file==='hani-newsroom-4cut-230.test.mjs'?['--node']:[];
 return {file:'scripts/'+file,args,preload:file!=='hani-design-polish-1.test.mjs',office:file.startsWith('hani-office'),cssReader:cssReaders.includes(file),knownFailure:known.some(k=>file.includes(k)),status:git.length?'GIT_REQUIRED':browser?'BROWSER_DELEGATED':'READY',gitOwners:git.map(n=>n.file)};
});
const cssReferences=fs.readdirSync(scripts).filter(f=>/\.[cm]?js$/.test(f)&&fs.readFileSync(path.join(scripts,f),'utf8').includes('hani-design-system.css')).map(file=>({file:'scripts/'+file,inPlan:plan.some(r=>r.file==='scripts/'+file),role:file.includes('browser')||file==='hani-design-system-phase1-qa.mjs'?'browser delegated':file.includes('safety')?'historical safety CLI requires separate baseline':file.includes('preload')||file.includes('preservation')||file==='hani-reviewed-release-baseline.mjs'?'adapter/helper':'support/export utility'}));
fs.writeFileSync(path.join(__dirname,'test-plan.json'),JSON.stringify({base:'cb11935',requested:requested.length,cssReaders:cssReaders.length,cssReferences,knownFailures:known,plan},null,2)+'\n');
console.log(JSON.stringify({files:plan.length,ready:plan.filter(r=>r.status==='READY').length,git:plan.filter(r=>r.status==='GIT_REQUIRED').length,browser:plan.filter(r=>r.status==='BROWSER_DELEGATED').length}));
