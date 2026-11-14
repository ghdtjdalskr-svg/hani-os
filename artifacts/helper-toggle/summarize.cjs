const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),rows=JSON.parse(fs.readFileSync(path.join(__dirname,'local/results.json'),'utf8'));
const plan=JSON.parse(fs.readFileSync(path.join(__dirname,'plan.json'),'utf8'));
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'baseline-failures.json'),'utf8'));
const count=items=>({files:items.length,pass:items.reduce((s,r)=>s+r.pass,0),fail:items.reduce((s,r)=>s+r.fail,0),skip:items.reduce((s,r)=>s+r.skip,0)});
const expected=new Map([['scripts/hani-helper-bot.test.mjs',original.find(r=>r.file==='helper')],['scripts/hani-fun-chat-fortune.test.mjs',original.find(r=>r.file==='fun')]]);
assert.equal(rows.length,plan.plan.filter(r=>r.status==='READY').length,'all planned non-Git files executed');
assert.equal(new Set(rows.map(r=>r.file)).size,rows.length,'no duplicate results');
const tooling=JSON.parse(fs.readFileSync(path.join(root,'artifacts/chibi-pack-3/tooling297-plan.json'),'utf8'));
const toolingRows=tooling.plan.filter(r=>r.status==='READY').map(r=>rows.find(x=>x.file===r.file));
assert.ok(toolingRows.every(Boolean),'all main297+#513 non-Git files included');
for(const row of toolingRows){assert.equal(row.exit,0,'tooling297 pass '+row.file);assert.equal(row.fail,0);}
for(const row of rows){
 assert.equal(row.blocked,false,'no delegated process was attempted '+row.file);
 assert.ok(row.pass+row.fail+row.skip>0,'test cases actually executed '+row.file);
 const prior=expected.get(row.file);
 if(prior){
  const log=fs.readFileSync(path.join(root,row.log),'utf8'),failures=log.split(/\r?\n/).filter(l=>l.startsWith('not ok '));
  assert.deepEqual(failures,prior.failures,'same failures as independent main297+#513 '+row.file);
  const metrics=['pass','fail','skipped'].map(k=>log.match(new RegExp('^# '+k+' \\d+','m'))?.[0]);
  assert.deepEqual(metrics,prior.counts,'same original counts '+row.file);
  const independent=fs.readFileSync(path.join(__dirname,'local/helperoff3',path.basename(row.file).replace(/^hani-/,'').replace('.test.mjs','-main297.tap')),'utf8');
  const statuses=s=>s.split(/\r?\n/).filter(l=>/^(?:not )?ok \d+ - /.test(l));
  assert.ok(statuses(independent).length,'independent main297 original suite executed');
  assert.deepEqual(statuses(log),statuses(independent),'every main297 original subtest status '+row.file);
 }else{assert.equal(row.exit,0,'nonbaseline file passes '+row.file);assert.equal(row.fail,0);}
}
const summary={base:'22fedb33cbd67923cc499ba99f55e8902a66ecb2',total:plan.plan.length,nonGit:count(rows),passingFiles:rows.filter(r=>r.exit===0).length,originalFailureFiles:rows.filter(r=>r.exit!==0).map(r=>r.file),newRegressions:0,office:count(rows.filter(r=>r.office)),newToggle:count(rows.filter(r=>r.file==='scripts/hani-helper-toggle.test.mjs')),gitDelegated:plan.plan.filter(r=>r.status==='GIT_REQUIRED').length,knownExcluded:plan.plan.filter(r=>r.status==='KNOWN_FAILURE_UNTOUCHED').map(r=>r.file),note:'The two failing files reproduce exact main297+#513 subtest statuses/counts. No old assertion, number or hash was relaxed. Edge/PNG not run.'};
summary.tooling297=count(toolingRows);
summary.browserDelegated=plan.plan.filter(r=>r.status==='BROWSER_DELEGATED').map(r=>r.file);
fs.writeFileSync(path.join(__dirname,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
