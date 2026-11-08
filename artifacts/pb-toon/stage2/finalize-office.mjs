import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..');process.chdir(root);
const out='artifacts/pb-toon/stage2';
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const rows=readJSON(out+'/office-results.json');
const expected=fs.readdirSync('scripts').filter(file=>/^hani-office-.*\.test\.mjs$/.test(file)).sort();
assert.deepEqual(rows.map(row=>row.file).sort(),expected,'every requested office file ran once');
let pass=0,fail=0,skipped=0;
const blocked=[],other=[];
for(const row of rows){
  const log=fs.readFileSync(out+'/office-'+row.file+'.log','utf8');
  const count=key=>Number(log.match(new RegExp('^# '+key+' (\\d+)','m'))?.[1]||0);
  pass+=count('pass');fail+=count('fail');skipped+=count('skipped');
  row.counts={pass:count('pass'),fail:count('fail'),skipped:count('skipped')};
  if(row.exit!==0)(log.includes('USER_GIT_DISABLED')?blocked:other).push(row.file);
}
const summary={files:rows.length,successfulFiles:rows.filter(row=>row.exit===0).length,gitBlockedFiles:blocked.length,otherFailedFiles:other.length,pass,fail,skipped,gitBlocked:blocked,otherFailed:other,known219:'User-designated existing failure; Git prohibition stopped this run before its original assertion',results:rows};
fs.writeFileSync(out+'/office-summary.json',JSON.stringify(summary,null,2));
fs.writeFileSync(out+'/git-blocked-files.md','# Git 실행 금지로 차단된 office 시험\n\n'+blocked.map(file=>'- `scripts/'+file+'`').join('\n')+'\n\n원래 assertion은 변경하지 않았고 Git 프로세스는 실행하지 않았다. 219는 사용자 지정 기존 실패지만 이번 실행은 Git 차단이 먼저 발생했다.\n');
const baseline=readJSON(out+'/artifact-before.json'),hash=value=>createHash('sha256').update(value).digest('hex');
const restored=[];
for(const [file,digest]of Object.entries(baseline)){
  if(fs.existsSync(file)&&hash(fs.readFileSync(file))===digest)continue;
  if(fs.existsSync(file)){
    const generated=path.join(out,'generated-office',file);fs.mkdirSync(path.dirname(generated),{recursive:true});fs.copyFileSync(file,generated);
  }
  fs.copyFileSync(path.join(out,'artifact-before',file),file);
  assert.equal(hash(fs.readFileSync(file)),digest,'preserve pre-existing artifact '+file);
  restored.push(file);
}
const created=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(file.replaceAll('\\','/').startsWith('artifacts/pb-toon/'))continue;if(entry.isDirectory())walk(file);else if(/\.(json|txt|md)$/.test(file)&&!Object.hasOwn(baseline,file))created.push(file)}}
walk('artifacts');
fs.writeFileSync(out+'/artifact-restoration.json',JSON.stringify({baselineFiles:Object.keys(baseline).length,restored,createdOutsideTask:created},null,2));
console.log(JSON.stringify({files:summary.files,successfulFiles:summary.successfulFiles,gitBlockedFiles:summary.gitBlockedFiles,otherFailedFiles:summary.otherFailedFiles,pass,fail,skipped,restored,createdOutsideTask:created},null,2));
