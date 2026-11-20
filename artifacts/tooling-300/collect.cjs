// Reparse original UTF-8 logs, including Node's default spec reporter. No tests
// or assertions are rewritten; scalar script outcomes stay separate from tests.
const fs=require('node:fs'),path=require('node:path');
const here=__dirname,local=path.join(here,'local');
function collect(phase){
 const rows=JSON.parse(fs.readFileSync(path.join(local,phase+'-results.json'),'utf8'));
 for(const row of rows){
  const log=fs.readFileSync(path.join(local,phase+'-logs',row.file+'.log'),'utf8');
  row.framework=/^[#ℹ]\s*tests\s+\d+/m.test(log);
  for(const [key,label]of [['pass','pass'],['fail','fail'],['skip','skipped']]){
   const matches=[...log.matchAll(new RegExp('^[#ℹ]\\s*'+label+'\\s+(\\d+)\\s*$','gm'))];row[key]=matches.length?Number(matches.at(-1)[1]):0;
  }
  const head=log.split(/^[#ℹ]\s*tests\s+\d+/m)[0];
  row.failures=[...new Set([...head.matchAll(/^✖ (.*?) \([\d.]+m?s\)/gm)].map(m=>m[1]))];
  row.positiveMarkers=[...log.matchAll(/^(?:PARTIAL )?PASS\b[^\n]*/gm)].map(m=>m[0]);
  row.blocked=/EPERM|EACCES|playwright.*(?:path|module)|Usage:|usage:|browser(?:\.exe)?(?: path| executable)|requires?.*(?:playwright|browser)/i.test(log);
  row.error=log.match(/(?:ReferenceError|TypeError|AssertionError(?: \[ERR_ASSERTION\])?|Error):[^\n]*/)?.[0]||'';
 }
 fs.writeFileSync(path.join(here,phase+'-results.json'),JSON.stringify(rows,null,2)+'\n');return rows;
}
const baseline=collect('baseline'),current=collect('current'),old=new Map(baseline.map(r=>[r.file,r]));
const regressions=[],changed=[];
for(const row of current){const before=old.get(row.file);if(!before)continue;
 const newFailures=row.failures.filter(name=>!before.failures.includes(name));
 const why=[];if(before.exit===0&&row.exit!==0)why.push('new nonzero exit');
 if(before.framework&&(row.fail>before.fail||row.pass<before.pass))why.push('worse case totals');
 if(newFailures.length)why.push('new failed cases');
 if(row.positiveMarkers.length<before.positiveMarkers.length)why.push('lost positive script markers');
 if(why.length)regressions.push({file:row.file,why,before,after:row});
 if(row.exit!==before.exit||row.pass!==before.pass||row.fail!==before.fail||row.skip!==before.skip||newFailures.length)changed.push({file:row.file,before:[before.exit,before.pass,before.fail,before.skip],after:[row.exit,row.pass,row.fail,row.skip],newFailures});
}
const sum=rows=>({files:rows.length,success:rows.filter(r=>r.exit===0).length,nonzero:rows.filter(r=>r.exit!==0).length,frameworkFiles:rows.filter(r=>r.framework).length,pass:rows.reduce((a,r)=>a+r.pass,0),fail:rows.reduce((a,r)=>a+r.fail,0),skip:rows.reduce((a,r)=>a+r.skip,0),positiveMarkers:rows.reduce((a,r)=>a+r.positiveMarkers.length,0),blockedNonzero:rows.filter(r=>r.exit!==0&&r.blocked).length});
const inventory=fs.readdirSync(path.resolve(here,'../../scripts')).filter(f=>f.endsWith('.test.mjs')).sort();
const baselineInventory=fs.readdirSync(path.join(local,'baseline/scripts')).filter(f=>f.endsWith('.test.mjs')).sort();
const summary={node:process.version,base:'9f49286882e2efacd128e2920cc12f38d473a8e9',baselineSha:'2220b6129c63721906a3788ee9a7681f197c4523',baseline:sum(baseline),current:sum(current),missing:inventory.filter(f=>!current.some(r=>r.file===f)),baselineMissing:baselineInventory.filter(f=>!old.has(f)),duplicates:current.filter((r,i)=>current.findIndex(x=>x.file===r.file)!==i).map(r=>r.file),regressions,changed,added:current.filter(r=>!old.has(r.file))};
fs.writeFileSync(path.join(here,'test-summary.json'),JSON.stringify(summary,null,2)+'\n');
const fmt=r=>r?`${r.exit} / ${r.framework?r.pass+' / '+r.fail+' / '+r.skip:'— / — / —'}`:'신규';
fs.writeFileSync(path.join(here,'TEST-RESULTS.md'),`# tooling-300 시험별 결과\n\n각 명령: cwd=해당 폴더, \`node scripts/<파일>\`. 기준은 독립 2220b61 원문 폴더.\n숫자: 종료 코드 / PASS / FAIL / SKIP. —는 Node 단언 수 미출력. 별도 script PASS 표식은 브라우저 차단 전에 끝난 단위 검사도 확인한다.\n\n| 시험 | 2220b61 | 현재 | script PASS 표식 (기준/현재) |\n|---|---|---|---|\n`+current.slice().sort((a,b)=>a.file.localeCompare(b.file)).map(r=>`| ${r.file} | ${fmt(old.get(r.file))} | ${fmt(r)} | ${old.get(r.file)?.positiveMarkers.length??'신규'}/${r.positiveMarkers.length} |`).join('\n')+'\n');
console.log(JSON.stringify({...summary,regressions:regressions.map(r=>({file:r.file,why:r.why})),added:summary.added.map(r=>({file:r.file,pass:r.pass,fail:r.fail}))},null,2));
