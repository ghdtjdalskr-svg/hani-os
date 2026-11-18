// Compare per-process direct-script runs and verify the second pass's scope.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import repository from '../../scripts/hani-test-repository-evidence.cjs';
const local=path.join(import.meta.dirname,'local/second-pass');
const hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(fs.readFileSync(path.join(local,'baseline/results.json')));
const firstCurrent=JSON.parse(fs.readFileSync(path.join(local,'current/results.json')));
const rechecks=JSON.parse(fs.readFileSync(path.join(local,'current/selected.json')));
const current=firstCurrent.map(r=>rechecks.find(check=>check.file===r.file)||r);
fs.writeFileSync(path.join(local,'current/results-final.json'),JSON.stringify(current,null,2)+'\n');
const originals=Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(local,'preservation.json')))).map(([file,pin])=>[file.replaceAll('\\','/'),pin]));
const changed=Object.keys(originals).filter(f=>!fs.existsSync(f)||hash(fs.readFileSync(f))!==originals[f]);
const initial=JSON.parse(fs.readFileSync(path.join(local,'../preservation-before.json')));
const initialMissing=Object.keys(initial).filter(f=>!fs.existsSync(f));
const initialChanged=Object.keys(initial).filter(f=>fs.existsSync(f)&&hash(fs.readFileSync(f))!==initial[f]);
const allowed=['scripts/hani-reviewed-release-baseline.mjs','scripts/hani-helper-toggle-source.cjs','scripts/hani-office-affinity-cap-source.cjs','scripts/hani-board-library-build.mjs','scripts/hani-one-pass-rules.mjs'];
assert.deepEqual(changed.sort(),allowed.sort(),'only the five input-layer entry modules changed');
const scope=new Set([...allowed,...Object.keys(JSON.parse(fs.readFileSync('scripts/fixtures/audit-1-delta.json')).files),'scripts/hani-design-polish-2-preload.cjs','scripts/hani-release-299-source.cjs','docs/development-history/handoffs/2026-11-19-audit-1.md']);
assert.deepEqual(initialMissing,[],'no original missing');
assert.deepEqual(initialChanged.filter(f=>!scope.has(f)),[],'no change outside combined first/second-pass scope');
for(const file of allowed){
 const old=fs.readFileSync(path.join(local,'original',file));
 assert.deepEqual(old,Buffer.from(repository.read('2220b6129c63721906a3788ee9a7681f197c4523',file)),'independent original module bytes: '+file);
 const now=fs.readFileSync(file),newline=now.indexOf(10)+1;
 assert.ok(now.subarray(newline).equals(old),'only one outer-layer import, all original bytes retained: '+file);
}
const base='2220b6129c63721906a3788ee9a7681f197c4523';
const tree=repository.tree(repository.tree(repository.commit(base).tree).find(e=>e.name==='scripts').sha);
const oldNames=tree.filter(e=>e.name.endsWith('.test.mjs')).map(e=>e.name).sort();
assert.equal(current.length,fs.readdirSync('scripts').filter(f=>f.endsWith('.test.mjs')).length);
for(const file of oldNames)assert.deepEqual(fs.readFileSync('scripts/'+file),Buffer.from(repository.read(base,'scripts/'+file)),'immutable main test: '+file);
const oldCurrent=current.filter(r=>oldNames.includes(r.file));
const added=current.filter(r=>!oldNames.includes(r.file));
assert.deepEqual(oldCurrent.map(r=>r.file).sort(),oldNames,'complete fixed main test inventory executed on candidate');
const failedCurrent=oldCurrent.filter(r=>r.exit!==0||r.timeout);
assert.deepEqual(baseline.map(r=>r.file).sort(),failedCurrent.map(r=>r.file).sort(),'every candidate failure independently rerun on fixed main');
assert.ok([...baseline,...current].every(r=>Number.isInteger(r.exit)),'all real process exit codes captured');
const byFile=new Map(baseline.map(r=>[r.file,r]));
const regressions=[];
for(const row of current){
 const before=byFile.get(row.file);
 if(!before){assert.ok(row.exit===0&&!row.timeout,'unpaired candidate must pass');continue;}
 assert.equal(row.exit,before.exit,'identical paired exit: '+row.file);
 assert.equal(row.timeout,before.timeout,'identical paired timeout: '+row.file);
 assert.deepEqual([...row.names].sort(),[...before.names].sort(),'identical paired failing assertions: '+row.file);
 if(before.exit===0&&!before.timeout&&(row.exit!==0||row.timeout))regressions.push({file:row.file,reason:'new failing process'});
 const names=row.names.filter(n=>!before.names.includes(n));
 if(names.length)regressions.push({file:row.file,reason:'new failing assertions',names});
 if(!before.timeout&&!row.timeout&&row.fail>before.fail)regressions.push({file:row.file,reason:'increased assertion failures'});
}
const totals=rows=>({files:rows.length,success:rows.filter(r=>r.exit===0&&!r.timeout).length,failed:rows.filter(r=>r.exit!==0||r.timeout).length,pass:rows.reduce((n,r)=>n+r.pass,0),fail:rows.reduce((n,r)=>n+r.fail,0),skip:rows.reduce((n,r)=>n+r.skip,0),scriptSuccess:rows.filter(r=>r.exit===0&&!r.timeout&&r.pass===0&&r.skip===0).length,allSkipped:rows.filter(r=>r.exit===0&&!r.timeout&&r.pass===0&&r.skip>0).length,delegated:rows.filter(r=>r.delegated).length,timeouts:rows.filter(r=>r.timeout).map(r=>r.file)});
const output={base,contract:hash(fs.readFileSync('scripts/fixtures/audit-1-delta.json')),baseline:totals(baseline),current:totals(current),oldCurrent:totals(oldCurrent),added,regressions,changed,originalFiles:Object.keys(originals).length,oldTestFiles:Object.keys(originals).filter(f=>/\.test\.(?:mjs|cjs)$/.test(f)).length,fixtures:Object.keys(originals).filter(f=>f.startsWith('scripts/fixtures/')).length,failures:current.filter(r=>r.exit!==0||r.timeout).map(r=>({file:r.file,exit:r.exit,timeout:r.timeout,delegated:r.delegated,names:r.names,baseline:byFile.get(r.file)}))};
Object.assign(output,{initialOriginalFiles:Object.keys(initial).length,initialChanged,initialMissing,rechecks:rechecks.map(r=>r.file)});
fs.writeFileSync(path.join(local,'summary.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({...output,failures:undefined}));
assert.deepEqual(regressions,[],'no new failures versus independently fixed main299 runtime');
