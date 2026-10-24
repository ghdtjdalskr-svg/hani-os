const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const task=__dirname,root=path.resolve(task,'../..');
const json=file=>JSON.parse(fs.readFileSync(path.join(task,file),'utf8'));
const rows=json('logs/results.json');
const initialFailures=rows.filter(r=>r.status!=='PASS').map(r=>({...r,reason:'Missing original HANI_BUILDING_SAFETY_BASELINE; rechecked using native release232 exports, assertions unchanged.'}));
for(const [phase,rechecks] of [['building-recheck',json('building-recheck/results.json')],['final-exact',json('final-exact/results.json')],['final-static',json('final-static/results.json')]]){
 for(const r of rechecks){const i=rows.findIndex(x=>x.file===r.file);if(i<0)throw Error('unexpected recheck');rows[i]={...r,log:phase+'/'+path.basename(r.log)};}
}
for(const r of rows){
 const log=fs.readFileSync(path.join(task,r.log),'utf8');r.counts={};
 for(const m of log.matchAll(/(?:#|\u2139) (tests|pass|fail|skipped) (\d+)/g))r.counts[m[1]]=Number(m[2]);
 const custom=log.match(/Node checks: (\d+) PASS/);if(custom)r.nodeChecks=Number(custom[1]);
 r.sourceSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,r.file))).digest('hex');r.browser='NOT_RUN';
}
const safety=json('test-output/candidate/artifacts/qa-1st/safety-results.json');
fs.writeFileSync(path.join(task,'qa-safety-results.json'),JSON.stringify(safety,null,2)+'\n');
rows.push({file:'scripts/hani-qa-1st-safety.mjs',status:safety.status,command:'node --require ./artifacts/train233-verify-followup/git-read-cache.cjs scripts/hani-qa-1st-safety.mjs artifacts/train233-verify-followup/exports/pre-qa',baseline:'1cdf07f',browser:'NOT_RUN',result:safety});
const finalCounts=rows.reduce((n,r)=>(n[r.status]=(n[r.status]||0)+1,n),{});
fs.writeFileSync(path.join(task,'results.json'),JSON.stringify({candidate:'7d0fa05e873d09bb7b7eb070bea7c8271a6cfa5c',base:'b5a64e5',rows,initialFailures,browser:'No browser process started. Initial staff-floors auto branch reached the pre-spawn guard and skipped; rechecked with existing --static option, browser branch skipped before import/launch.',newInputFixtureCorrection:'PowerShell stdin initially replaced Korean literals; corrected to Unicode escapes, final OCR14/14 PASS.',finalCounts},null,2)+'\n');
fs.writeFileSync(path.join(task,'tests.md'),'# Node test results · 7d0fa05\n\nBrowser branches were not run. Commands use the exact native Git export adapter.\n\n| Test file | Result | Node counts | Log |\n|---|---|---|---|\n'+rows.map(r=>'| `'+r.file+'` | '+r.status+' | '+(r.counts?.tests?r.counts.pass+'/'+r.counts.tests+'; skipped '+r.counts.skipped:r.nodeChecks?r.nodeChecks+' PASS':'CLI assertions PASS')+' | '+(r.log?'`'+r.log+'`':'qa-safety-results.json')+' |').join('\n')+'\n');
console.log(JSON.stringify({files:rows.length,finalCounts,required:rows.filter(r=>/reviewed-release|ocr-accuracy|toss-intake|asset-intake|kiwoom|hana-intake|qa-1st|milestones/.test(r.file)).map(r=>({file:r.file,counts:r.counts,nodeChecks:r.nodeChecks,status:r.status}))}));
