import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='artifacts/life-bundle/283';
const read=file=>JSON.parse(fs.readFileSync(dir+'/'+file,'utf8').replace(/^\uFEFF/,''));
const features=read('features-results.json'),regression=read('regression-results.json'),ui=read('ui-results.json');
const nav=read('final-checks.json').find(r=>r.name==='nav-final');
const final=regression.map(r=>r.file===nav.file?{...nav,initialAttempt:r}:r);
const office=final.filter(r=>r.file.startsWith('hani-office-'));
assert.equal(office.length,69,'all office files must finish before summary');
const metric=(log,key)=>Number(new RegExp('^# '+key+' (\\d+)','m').exec(log)?.[1]||0);
const cases=office.map(r=>{
 const log=fs.readFileSync(dir+'/regression-'+r.file+'.log','utf8').replace(/^\uFEFF/,'');
 const failures=log.split(/^not ok /m).slice(1).map(s=>({name:s.split('\n')[0].trim(),reason:s.slice(0,s.indexOf('\n  ...')>=0?s.indexOf('\n  ...'):s.length).match(/error: ([^\n]*)/)?.[1]||'',gitBlocked:s.slice(0,s.indexOf('\n  ...')>=0?s.indexOf('\n  ...'):s.length).includes('USER_GIT_DISABLED')}));
 return {...r,tests:metric(log,'tests'),pass:metric(log,'pass'),fail:metric(log,'fail'),skipped:metric(log,'skipped'),failures,classification:r.exit===0?'PASS':failures.length&&failures.every(f=>f.gitBlocked)?'GIT_BLOCKED':'FAIL'};
});
const summary={features,regression:final,ui,office:{files:cases.length,successfulFiles:cases.filter(r=>r.exit===0).length,gitBlockedFiles:cases.filter(r=>r.classification==='GIT_BLOCKED').length,otherFailedFiles:cases.filter(r=>r.classification==='FAIL').length,passedTests:cases.reduce((n,r)=>n+r.pass,0),failedOrBlockedTests:cases.reduce((n,r)=>n+r.fail,0),skippedTests:cases.reduce((n,r)=>n+r.skipped,0),cases},browserAdditional:read('navlogin-comparison.json'),criticalBoundary:'No Git executed; no commit/push/merge/version/deploy/storage/cloud/schema change. Release gates not run.'};
fs.writeFileSync(dir+'/all-results.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({...summary.office,cases:undefined},null,2));
for(const r of cases.filter(r=>r.classification==='FAIL'))console.log(JSON.stringify({file:r.file,failures:r.failures}));
