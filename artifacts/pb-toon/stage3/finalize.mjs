import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out='artifacts/pb-toon/stage3';
const json=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
let rows=json(out+'/results.json');
// Retain the diagnostic run, then bind the corrected raw-source command to its log.
fs.copyFileSync(out+'/results.json',out+'/initial-run-results.json');
const reruns=json(out+'/rerun-results.json');
assert.equal(reruns.length,7);
rows=rows.map(row=>reruns.find(r=>r.file===row.file)||row);
const raw=rows.find(row=>row.file==='hani-life-bundle-source.test.mjs');
raw.command='node --require ./artifacts/pb-toon/stage2/no-git.cjs --test --test-isolation=none --test-reporter=tap scripts/hani-life-bundle-source.test.mjs';
const rawLog=fs.readFileSync(out+'/'+raw.file+'.log','utf8');
assert.match(rawLog,/^# pass 5\r?$/m);assert.match(rawLog,/^# fail 0\r?$/m);
raw.exit=0;raw.summary=rawLog.split(/\r?\n/).filter(s=>/^# (tests|pass|fail|skipped)/.test(s));raw.rerun='No legacy preload: main now tests exact raw release-283 input';
const expected=fs.readdirSync('scripts').filter(f=>/^hani-office-.*\.test\.mjs$/.test(f)&&f!=='hani-office-219.test.mjs').sort();
assert.deepEqual(rows.filter(r=>r.group==='office').map(r=>r.file).sort(),expected);
const blocked=[],other=[];
for(const row of rows){
  const log=fs.readFileSync(out+'/'+row.file+'.log','utf8');
  const count=key=>Number(log.match(new RegExp('^# '+key+' (\\d+)','m'))?.[1]||0);
  row.counts={tests:count('tests'),pass:count('pass'),fail:count('fail'),skipped:count('skipped')};
  row.failedAssertions=log.split(/\r?\n/).filter(s=>/^not ok /.test(s));
  // Git blocks are not PASS; every reported failing block must name the guard.
  const failingBlocks=log.split(/(?=^not ok )/m).slice(1).map(s=>s.split(/(?=^(?:ok |# Subtest:|1\.\.))/m)[0]);
  const isGitOnly=row.exit!==0&&failingBlocks.length>0&&failingBlocks.every(s=>s.includes('USER_GIT_DISABLED'));
  if(row.exit!==0)(isGitOnly?blocked:other).push(row.file);
  row.status=row.exit===0?'PASS':isGitOnly?'GIT_BLOCKED':'FAIL';
}
const total=group=>{const selected=rows.filter(r=>r.group===group);return {files:selected.length,successfulFiles:selected.filter(r=>r.status==='PASS').length,gitBlockedFiles:selected.filter(r=>r.status==='GIT_BLOCKED').length,otherFailedFiles:selected.filter(r=>r.status==='FAIL').length,...Object.fromEntries(['tests','pass','fail','skipped'].map(key=>[key,selected.reduce((sum,r)=>sum+r.counts[key],0)]))}};
const summary={feature:total('feature'),office:total('office'),excluded:['hani-office-219.test.mjs'],gitBlockedFiles:blocked,otherFailedFiles:other,results:rows};
fs.writeFileSync(out+'/results.json',JSON.stringify(rows,null,2));fs.writeFileSync(out+'/summary.json',JSON.stringify(summary,null,2));
fs.writeFileSync(out+'/git-blocked-files.md','# Git 금지로 미완료인 office 시험\n\n'+blocked.map(f=>'- `scripts/'+f+'`').join('\n')+'\n\n`hani-office-219.test.mjs`는 사용자 지시로 제외. 차단 항목의 assertion은 그대로 두었으며 통과로 계산하지 않았다.\n');
const before=json(out+'/before.json'),restored=[],created=[];
for(const [file,digest]of Object.entries(before.artifactHashes)){
  if(fs.existsSync(file)&&hash(fs.readFileSync(file))===digest)continue;
  if(fs.existsSync(file)){const generated=out+'/generated/'+file;fs.mkdirSync(path.dirname(generated),{recursive:true});fs.copyFileSync(file,generated)}
  fs.copyFileSync(out+'/before/'+file,file);assert.equal(hash(fs.readFileSync(file)),digest);restored.push(file);
}
const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=dir+'/'+entry.name;
  if(file===out||file==='artifacts/pb-toon/REPORT-3.md'||file.endsWith('/edge-profile'))continue;
  if(entry.isDirectory())walk(file);else if(entry.isFile()&&/\.(json|md|txt|log|html|mjs|ps1|cjs)$/.test(file)&&!Object.hasOwn(before.artifactHashes,file)){
    const generated=out+'/generated/'+file;fs.mkdirSync(path.dirname(generated),{recursive:true});fs.copyFileSync(file,generated);fs.unlinkSync(file);created.push(file);
  }
}};walk('artifacts');
for(const [file,digest]of Object.entries(before.artifactHashes))assert.equal(hash(fs.readFileSync(file)),digest,'restore exact artifact '+file);
fs.writeFileSync(out+'/artifact-restoration.json',JSON.stringify({baselineFiles:Object.keys(before.artifactHashes).length,restored,createdMovedBackToTask:created,remainingOutsideTask:0},null,2));
console.log(JSON.stringify({feature:summary.feature,office:summary.office,otherFailed:other,restored,createdMovedBackToTask:created},null,2));
assert.deepEqual(other,[],'no non-Git failures');
