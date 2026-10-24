// Scope: previous CLI PASS files that directly or transitively read either changed owner.
// Mixed tests run their Node branch only, with no Playwright/browser arguments.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),previous=JSON.parse(fs.readFileSync(path.join(root,'artifacts/train233-verify/comparison.json'),'utf8'));
const priorInventory=JSON.parse(fs.readFileSync(path.join(root,'artifacts/train233-verify/inventory.json'),'utf8'));
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
function dependency(file,seen=new Set()){
 if(seen.has(file)||!fs.existsSync(path.join(root,file)))return null;seen.add(file);
 const text=read(file);
 if(/hani-main\.js|hani-asset-update-v1\.js/.test(text))return [file];
 // Runtime closure and duplicate-ID graph helpers read the scripts in index.html.
 if(/(?:async function resolveRuntimeClosure|function literalIds)\b/.test(text))return [file,'index.html → runtime graph'];
 const imports=[...text.matchAll(/(?:from\s*|require\s*\(\s*|import\s*\(\s*|import\s*)['"](\.[^'"]+\.(?:mjs|cjs|js))['"]/g)];
 for(const match of imports){const next=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));if(!next.startsWith('scripts/'))continue;const tail=dependency(next,seen);if(tail)return [file,...tail];}
 return null;
}
const required=['hani-reviewed-release-baseline.test.mjs','hani-ocr-accuracy-224.test.mjs','hani-toss-intake-224.test.mjs','hani-asset-intake-v2-AB.test.mjs','hani-asset-intake-v2-C.test.mjs','hani-asset-intake-v2-ease.test.mjs','hani-kiwoom-code-224.test.mjs','hani-hana-intake-224.test.mjs','hani-asset-update-smoke.js','hani-qa-1st.test.cjs','hani-milestones-v1.test.mjs'].map(f=>'scripts/'+f);
const selection=previous.filter(r=>r.candidate.status==='PASS').map(({file})=>({file,dependency:dependency(file)}));
const files=new Set([...selection.filter(r=>r.dependency).map(r=>r.file),...required]);
const inventory=[...files].sort().map(file=>({file,browser:false,nodeOnly:true,args:file==='scripts/hani-staff-floors-214.test.mjs'?['--static']:[],hasOptionalBrowser:priorInventory.find(r=>r.file===file)?.browser||false,reason:required.includes(file)?'explicit request':'previous PASS owner dependency',dependency:dependency(file)}));
fs.writeFileSync(path.join(__dirname,'inventory.json'),JSON.stringify(inventory,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'selection.json'),JSON.stringify({previousPassFiles:selection.length,selectedPreviousPassFiles:selection.filter(r=>r.dependency).length,required,selection},null,2)+'\n');
console.log(JSON.stringify({selected:inventory.length,previousPass:selection.length,affectedPreviousPass:selection.filter(r=>r.dependency).length,optionalBrowserNodeOnly:inventory.filter(r=>r.hasOptionalBrowser).map(r=>r.file)}));
