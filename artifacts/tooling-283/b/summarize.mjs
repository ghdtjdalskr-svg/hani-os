import fs from 'node:fs';
import assert from 'node:assert/strict';
const out='artifacts/tooling-283/b';
const rows=JSON.parse(fs.readFileSync(out+'/office-results.json'));
assert.equal(rows.length,fs.readdirSync('scripts').filter(f=>/^hani-office-.*\.test\.mjs$/.test(f)).length,'every office file executed');
const previous=JSON.parse(fs.readFileSync('artifacts/tooling-283/office-results.json'));
const formerlyPassing=previous.filter(r=>r.exit===0).map(r=>r.file);
const regressed=formerlyPassing.filter(file=>rows.find(r=>r.file===file)?.exit!==0);
const targets=JSON.parse(fs.readFileSync(out+'/targets.json')).map(f=>f.replace('scripts/',''));
let pass=0,fail=0,skip=0;const failures=[];
for(const row of rows){
 const text=fs.readFileSync(row.log,'utf8');
 const count=name=>Number(text.match(new RegExp('^# '+name+' (\\d+)$','m'))?.[1]||0);
 pass+=count('pass');fail+=count('fail');skip+=count('skipped');
 for(const block of text.split(/^not ok /m).slice(1)){
  const section=block.split(/^(?:# Subtest:|ok |not ok )/m)[0];
  failures.push({file:row.file,test:section.split('\n')[0],gitBlocked:section.includes('USER_GIT_DISABLED')});
 }
 if(targets.includes(row.file))assert.ok(!row.command.includes('--import'),'target is self-contained '+row.file);
}
const unexpected=failures.filter(f=>!f.gitBlocked);
assert.equal(failures.length,fail,'every failed assertion classified');
const result={files:rows.length,successful:rows.filter(r=>r.exit===0).length,blocked:rows.filter(r=>r.exit!==0).length,pass,gitBlocked:failures.filter(f=>f.gitBlocked).length,skip,unexpected,formerlyPassing:formerlyPassing.length,regressed,targets:rows.filter(r=>targets.includes(r.file)).map(({file,exit,command,summary})=>({file,exit,command,summary})),failures};
fs.writeFileSync(out+'/summary.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,targets:result.targets.map(({file,exit})=>({file,exit})),failures:undefined}));
assert.deepEqual(regressed,[]);assert.deepEqual(unexpected,[]);
