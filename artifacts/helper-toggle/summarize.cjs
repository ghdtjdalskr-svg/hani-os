const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),rows=JSON.parse(fs.readFileSync(path.join(__dirname,'local/results.json'),'utf8'));
const plan=JSON.parse(fs.readFileSync(path.join(__dirname,'plan.json'),'utf8'));
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'baseline-failures.json'),'utf8'));
const count=items=>({files:items.length,pass:items.reduce((s,r)=>s+r.pass,0),fail:items.reduce((s,r)=>s+r.fail,0),skip:items.reduce((s,r)=>s+r.skip,0)});
const expected=new Map([['scripts/hani-helper-bot.test.mjs',original.find(r=>r.file==='helper')],['scripts/hani-fun-chat-fortune.test.mjs',original.find(r=>r.file==='fun')]]);
assert.equal(rows.length,plan.plan.filter(r=>r.status==='READY').length,'all planned non-Git files executed');
for(const row of rows){
 assert.equal(row.blocked,false,'no delegated process was attempted '+row.file);
 const prior=expected.get(row.file);
 if(prior){
  const log=fs.readFileSync(path.join(root,row.log),'utf8'),failures=log.split(/\r?\n/).filter(l=>l.startsWith('not ok '));
  assert.deepEqual(failures,prior.failures,'same failures as independent main296 '+row.file);
  const metrics=['pass','fail','skipped'].map(k=>log.match(new RegExp('^# '+k+' \\d+','m'))?.[0]);
  assert.deepEqual(metrics,prior.counts,'same original counts '+row.file);
 }else{assert.equal(row.exit,0,'nonbaseline file passes '+row.file);assert.equal(row.fail,0);}
}
const summary={base:'7a91982de08a54452f6b9057f906d651f63a65ca',total:plan.plan.length,nonGit:count(rows),passingFiles:rows.filter(r=>r.exit===0).length,originalFailureFiles:rows.filter(r=>r.exit!==0).map(r=>r.file),newRegressions:0,office:count(rows.filter(r=>r.office)),newToggle:count(rows.filter(r=>r.file==='scripts/hani-helper-toggle.test.mjs')),gitDelegated:plan.plan.filter(r=>r.status==='GIT_REQUIRED').length,knownExcluded:plan.plan.filter(r=>r.status==='KNOWN_FAILURE_UNTOUCHED').map(r=>r.file),note:'The two failing files reproduce exact main296 subtest statuses/counts. No old assertion, number or hash was relaxed. Edge/PNG not run.'};
fs.writeFileSync(path.join(__dirname,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
