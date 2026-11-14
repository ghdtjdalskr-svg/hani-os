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
const tests=fs.readdirSync(path.join(root,'scripts')).filter(f=>/[.-]test\.[cm]?js$/.test(f));
const plan=tests.filter(f=>{
 const source=fs.readFileSync(path.join(root,'scripts',f),'utf8');
 return /haniHelperBot|hani_helper_pos_v1/.test(source)||/^hani-(office|helper|save-guard|release-296|design-polish-1|chibi-pack-[12]|theme-thaw|release-version-layers|seoyun-m9|settings)/.test(f)||['hani-app-216-audit.test.cjs','hani-qa-easy-cleanup.test.mjs'].includes(f);
}).sort().map(file=>{
 const nodes=dependencies(path.join(root,'scripts',file));
 const git=nodes.filter(n=>/\b(?:execFileSync|execSync|spawnSync|execFile|spawn)\s*\(\s*['"`]git(?:['"`\s])/.test(n.source)).filter(n=>n.file!=='scripts/hani-office-lively-fixture.mjs'||nodes.filter(x=>x!==n).some(x=>/\breadAt\s*\([^\n]*,|\bloadScene\s*\(\s*\{\s*ref\b/.test(x.source)));
 return {file:'scripts/'+file,office:file.startsWith('hani-office'),status:known.some(k=>file.includes(k))?'KNOWN_FAILURE_UNTOUCHED':git.length?'GIT_REQUIRED':'READY',gitOwners:git.map(n=>n.file)};
});
fs.writeFileSync(path.join(__dirname,'plan.json'),JSON.stringify({base:'7a91982',known,plan},null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'GIT-TESTS.md'),'# 서윤 Git 필요 시험 · Codex 미실행\n\n'+plan.filter(r=>r.status==='GIT_REQUIRED').map(r=>'- `node '+r.file+'` · '+r.gitOwners.join(', ')).join('\n')+'\n');
console.log(JSON.stringify({total:plan.length,ready:plan.filter(r=>r.status==='READY').length,git:plan.filter(r=>r.status==='GIT_REQUIRED').length,known:plan.filter(r=>r.status==='KNOWN_FAILURE_UNTOUCHED').length}));
