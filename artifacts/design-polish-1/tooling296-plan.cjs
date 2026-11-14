const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'../..');
const known=['settings-225','ilbo-banner-215','study-news-material','pb-chibitoon','brand-heroes-218','dash-218','fun-top3','hero-restore','ilbo-213','invest-split-ui','investment-research-ui','mascots-poster','nav-groups','owner-verification-ui','qa-210','qa-design-b4','qa-report-fixes','remote-media-219','reviewed-release-baseline','simplify-225','theme-white-215','ui-203b'];
function dependencies(file,seen=new Set()){
 if(seen.has(file)||!fs.existsSync(file)||!fs.statSync(file).isFile())return [];
 seen.add(file);const source=fs.readFileSync(file,'utf8'),rows=[{file:path.relative(root,file).replaceAll('\\','/'),source}];
 for(const m of source.matchAll(/(?:from\s*|import\s*\(|require\s*\(|import\s*)['"](\.\.?\/[^'"]+)['"]/g)){
  let f=path.resolve(path.dirname(file),m[1]);if(!path.extname(f))f+='.js';
  if(/\.[cm]?js$/.test(f)&&f.startsWith(root+path.sep))rows.push(...dependencies(f,seen));
 }
 return rows;
}
const files=fs.readdirSync(path.join(root,'scripts')).filter(f=>/[.-]test\.[cm]?js$/.test(f)&&(
 /^hani-office.*\.test\.mjs$/.test(f)||/^hani-(?:design-polish-1|release-29[456]|chibi-pack-[12]|theme-thaw|release-version-layers|seoyun-m9|save-guard|join-ieum|street-journal|history-226)/.test(f)||/quiz|study/.test(f)||['hani-app-216-audit.test.cjs','hani-qa-easy-cleanup.test.mjs'].includes(f)));
const plan=files.sort().map(file=>{
 const nodes=dependencies(path.join(root,'scripts',file));
 const git=nodes.filter(n=>/\b(?:execFileSync|execSync|spawnSync|execFile|spawn)\s*\(\s*['"`]git(?:['"`\s])/.test(n.source)).filter(n=>n.file!=='scripts/hani-office-lively-fixture.mjs'||nodes.filter(x=>x!==n).some(x=>/\breadAt\s*\([^\n]*,|\bloadScene\s*\(\s*\{\s*ref\b/.test(x.source)));
 return {file:'scripts/'+file,args:file==='hani-history-226.test.mjs'?['--unit-only']:[],office:file.startsWith('hani-office'),status:known.some(k=>file.includes(k))?'KNOWN_FAILURE_UNTOUCHED':git.length?'GIT_REQUIRED':'READY',gitOwners:git.map(n=>n.file)};
});
fs.writeFileSync(path.join(__dirname,'tooling296-plan.json'),JSON.stringify({base:'56c3105',known,plan},null,2)+'\n');
const git=plan.filter(r=>r.status==='GIT_REQUIRED');
fs.writeFileSync(path.join(__dirname,'TOOLING-296-GIT-TESTS.md'),'# 서윤 Git 필요 시험 (Codex 미실행)\n\n'+git.map(r=>'- `node '+r.file+r.args.map(a=>' '+a).join('')+'` · '+r.gitOwners.join(', ')).join('\n')+'\n');
console.log(JSON.stringify({total:plan.length,ready:plan.filter(r=>r.status==='READY').length,git:git.length,known:plan.filter(r=>r.status==='KNOWN_FAILURE_UNTOUCHED').length}));
