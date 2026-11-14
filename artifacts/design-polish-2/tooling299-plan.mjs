import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'../..'),out=path.join(import.meta.dirname,'tooling299-local');
fs.mkdirSync(out,{recursive:true});
const original=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'test-inventory.json'),'utf8'));
const tooling=JSON.parse(fs.readFileSync(path.join(root,'artifacts/chibi-pack-3/tooling297-plan.json'),'utf8'));
const entries=original.map(r=>({...r,tooling:false}));
for(const row of tooling.plan){
 const reason={READY:null,GIT_REQUIRED:'GIT_DELEGATED',BROWSER_DELEGATED:'BROWSER_DELEGATED',KNOWN_FAILURE_UNTOUCHED:'ORIGINAL_FAILURE_DO_NOT_TOUCH'}[row.status];
 const existing=entries.find(e=>e.file===row.file);
 if(existing){existing.tooling=row.status==='READY';if(reason)existing.reason=reason;}
 else entries.push({file:row.file,args:row.args,office:row.office,reason,tooling:row.status==='READY'});
}
for(const name of fs.readdirSync(path.join(root,'scripts')).filter(f=>/^hani-design-polish-2.*\.test\.mjs$/.test(f)).concat(['hani-release-299.test.mjs','hani-release-298.test.mjs','hani-helper-toggle.test.mjs','hani-helper-bot.test.mjs','hani-fun-chat-fortune.test.mjs']))if(!entries.some(e=>e.file==='scripts/'+name))entries.push({file:'scripts/'+name,args:[],office:false,reason:null,tooling:false});
const excluded=['settings-225','ilbo-banner-215','study-news-material','pb-chibitoon','brand-heroes-218','dash-218','fun-top3','hero-restore','ilbo-213','invest-split-ui','investment-research-ui','mascots-poster','nav-groups','owner-verification-ui','qa-210','qa-design-b4','qa-report-fixes','remote-media-219','reviewed-release-baseline','simplify-225','theme-white-215','ui-203b'];
for(const e of entries){if(excluded.some(s=>e.file.includes(s)))e.reason='ORIGINAL_FAILURE_DO_NOT_TOUCH';if(/hani-(helper-bot|fun-chat-fortune)\.test/.test(e.file)){e.reason=null;e.knownLegacy=true;}}
entries.sort((a,b)=>a.file.localeCompare(b.file));
fs.writeFileSync(path.join(out,'test-inventory.json'),JSON.stringify({base:'1881888a2ca970ab86adda9b193a90256027be1c',entries},null,2)+'\n');
fs.writeFileSync(path.join(out,'git-delegated.json'),JSON.stringify(entries.filter(e=>e.reason==='GIT_DELEGATED'),null,2)+'\n');
fs.writeFileSync(path.join(import.meta.dirname,'tooling299-git-tests.json'),JSON.stringify(entries.filter(e=>e.reason==='GIT_DELEGATED'),null,2)+'\n');
if(process.argv.includes('--collect')){
 const {shards}=JSON.parse(fs.readFileSync(path.join(out,'run-config-current.json'),'utf8'));
 assert.ok(Number.isSafeInteger(shards)&&shards>0,'known complete shard configuration');
 const results=Array.from({length:shards},(_,i)=>JSON.parse(fs.readFileSync(path.join(out,'results-current-'+i+'.json'),'utf8'))).flat();
 const expected=entries.filter(e=>!e.reason).map(e=>e.file).sort();assert.deepEqual(results.map(r=>r.file).sort(),expected,'complete nonduplicated inventory');
 const metric=rows=>({files:rows.length,passedFiles:rows.filter(r=>r.exit===0).length,failedFiles:rows.filter(r=>r.exit!==0).length,pass:rows.reduce((n,r)=>n+r.pass,0),fail:rows.reduce((n,r)=>n+r.fail,0),skip:rows.reduce((n,r)=>n+r.skip,0),scriptPass:rows.reduce((n,r)=>n+r.scriptPass,0)});
 const baseline=JSON.parse(fs.readFileSync(path.join(out,'results-baseline-0.json'),'utf8'));
 const regressions=results.filter(r=>r.knownLegacy||r.file.includes('exam-popup-214')).filter(r=>{
  const b=baseline.find(b=>b.file===r.file);return !b||['exit','pass','fail','skip','scriptPass'].some(k=>r[k]!==b[k])||JSON.stringify(r.failureNames)!==JSON.stringify(b.failureNames);
 });
 const unexpected=results.filter(r=>r.exit!==0&&!r.knownLegacy&&!r.file.includes('exam-popup-214'));
 for(const file of ['scripts/hani-exam-popup-214.test.mjs']){
  const a=results.find(r=>r.file===file),b=baseline.find(r=>r.file===file);
  const signature=r=>fs.readFileSync(path.join(root,r.log),'utf8').split(/\r?\n/).filter(l=>/^\s*(?:error:|name:)/.test(l));
  assert.deepEqual(signature(a),signature(b),'unchanged popup error signature');
 }
 const summary={current:metric(results),regular:metric(results.filter(r=>!r.knownLegacy)),office:metric(results.filter(r=>r.office)),tooling:metric(results.filter(r=>r.tooling&&!r.knownLegacy)),legacy:results.filter(r=>r.knownLegacy),baseline,unexpectedFailures:unexpected.map(r=>r.file),newRegressions:regressions,gitDelegated:entries.filter(e=>e.reason==='GIT_DELEGATED').map(e=>e.file),browserDelegated:entries.filter(e=>e.reason==='BROWSER_DELEGATED').map(e=>e.file),excluded:entries.filter(e=>e.reason==='ORIGINAL_FAILURE_DO_NOT_TOUCH').map(e=>e.file)};
 fs.writeFileSync(path.join(out,'test-results.json'),JSON.stringify(results,null,2)+'\n');fs.writeFileSync(path.join(out,'test-summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({...summary,legacy:summary.legacy.map(r=>({file:r.file,pass:r.pass,fail:r.fail})),baseline:baseline.map(r=>({file:r.file,pass:r.pass,fail:r.fail})),gitDelegated:summary.gitDelegated.length,browserDelegated:summary.browserDelegated.length,excluded:summary.excluded.length}));
 if(unexpected.length||regressions.length)process.exitCode=1;
}else console.log(JSON.stringify({run:entries.filter(e=>!e.reason).length,git:entries.filter(e=>e.reason==='GIT_DELEGATED').length,browser:entries.filter(e=>e.reason==='BROWSER_DELEGATED').length}));
