import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const local=path.join(import.meta.dirname,'local'),shards=Number(process.argv[2]||4);
const read=name=>JSON.parse(fs.readFileSync(path.join(local,name),'utf8'));
const plan=read('test-inventory.json'),rows=Array.from({length:shards},(_,i)=>read('results-current-'+i+'.json')).flat();
if(fs.existsSync(path.join(local,'results-current-selected.json')))rows.push(...read('results-current-selected.json').filter(r=>!rows.some(b=>b.file===r.file)));
assert.deepEqual(rows.map(r=>r.file).sort(),plan.entries.filter(e=>!e.reason).map(e=>e.file).sort(),'complete nonduplicated tooling299 plus audit inventory');
const baseline=read('results-baseline-0.json');
const contract=createHash('sha256').update(fs.readFileSync('scripts/fixtures/audit-1-delta.json')).digest('hex');
assert.ok(rows.every(r=>r.contract===contract),'one final contract for all current results');
const metric=a=>({files:a.length,passedFiles:a.filter(r=>r.exit===0).length,failedFiles:a.filter(r=>r.exit!==0).length,pass:a.reduce((s,r)=>s+r.pass,0),fail:a.reduce((s,r)=>s+r.fail,0),skip:a.reduce((s,r)=>s+r.skip,0),scriptPass:a.reduce((s,r)=>s+r.scriptPass,0)});
const oldFailure=r=>r.knownLegacy||r.file.includes('exam-popup-214');
const discovered=r=>r.file==='scripts/hani-lounge-billboard.test.mjs';
const legacy=rows.filter(r=>oldFailure(r)||discovered(r)),unexpected=rows.filter(r=>r.exit&&!oldFailure(r)&&!discovered(r));
assert.ok(rows.find(discovered)?.pass>1,'lounge main-guard body actually executed');
const regressions=legacy.filter(r=>{const b=baseline.find(b=>b.file===r.file);return !b||['exit','pass','fail','skip','scriptPass'].some(k=>r[k]!==b[k])||JSON.stringify(r.failureNames)!==JSON.stringify(b.failureNames)});
for(const r of legacy){
 const b=baseline.find(b=>b.file===r.file);assert.ok(b,'legacy baseline '+r.file);
 const signature=row=>fs.readFileSync(row.log,'utf8').split(/\r?\n/).filter(l=>/^\s*(?:error:|name:)/.test(l));assert.deepEqual(signature(r),signature(b),'same error signature '+r.file);
}
const summary={base:'2220b61',contract,all:metric(rows),originalInventory:metric(rows.filter(r=>!r.added)),office:metric(rows.filter(r=>r.office)),tooling:metric(rows.filter(r=>r.tooling&&!r.knownLegacy)),added:rows.filter(r=>r.added).map(r=>({file:r.file,pass:r.pass,fail:r.fail})),legacy:legacy.filter(oldFailure).map(r=>({file:r.file,pass:r.pass,fail:r.fail})),additionalBaselineFailures:legacy.filter(discovered).map(r=>({file:r.file,pass:r.pass,fail:r.fail,baseline:baseline.find(b=>b.file===r.file),releaseGate:'UNRESOLVED_BASELINE_FAILURE'})),unexpectedFailures:unexpected.map(r=>r.file),newRegressions:regressions.map(r=>r.file),gitDelegated:plan.entries.filter(e=>e.reason==='GIT_DELEGATED').map(e=>e.file),browserDelegated:plan.entries.filter(e=>e.reason==='BROWSER_DELEGATED').map(e=>e.file),excluded:plan.entries.filter(e=>e.reason==='ORIGINAL_FAILURE_DO_NOT_TOUCH').map(e=>e.file)};
fs.writeFileSync(path.join(local,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));if(unexpected.length||regressions.length||summary.additionalBaselineFailures.some(r=>r.fail))process.exitCode=1;
