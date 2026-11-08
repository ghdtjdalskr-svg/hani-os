import fs from 'node:fs';
const out='artifacts/kids-visit-b/merge-evidence';
const json=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const list=x=>Array.isArray(x)?x:[x];
const rows=new Map(list(json(out+'/office-summary.json')).map(row=>[row.file,row]));
for(const file of ['repaired-summary.json','merged-summary.json','phone-final-summary.json','performance-final-summary.json'])for(const row of list(json(out+'/'+file)))if(row.file.startsWith('hani-office-'))rows.set(row.file,row);
const expected=fs.readdirSync('scripts').filter(f=>/^hani-office-.*\.test\.mjs$/.test(f)).sort();
const missing=expected.filter(f=>!rows.has(f));if(missing.length)throw Error('office files not executed: '+missing.join(', '));
const result=[];
for(const file of expected){
 const row={...rows.get(file),gitFailures:0,otherFailures:0};
 if(row.exit!==0){
  const bytes=fs.readFileSync(out+'/'+file+'.failure.tap');
  const text=(bytes[0]===255&&bytes[1]===254?bytes.subarray(2).toString('utf16le'):bytes.toString('utf8')).replace(/^\uFEFF/,'');
  const blocks=[...text.matchAll(/^not ok \d+ - .*$/gm)].map(m=>{const tail=text.slice(m.index),end=tail.search(/\r?\n  \.\.\.(?:\r?\n|$)/);return end<0?tail:tail.slice(0,end);});
  for(const block of blocks){if(block.includes('USER_GIT_DISABLED')||row.fail===1&&row.gitBlocked)row.gitFailures++;else row.otherFailures++;}
  if(row.fail!==row.gitFailures+row.otherFailures)throw Error('unclassified failure '+file);
 }
 result.push(row);
}
const total=key=>result.reduce((n,r)=>n+r[key],0);
const m9=list(json(out+'/repaired-summary.json')).find(r=>r.file==='hani-seoyun-m9.test.mjs');
const summary={files:result.length,pass:total('pass'),gitBlockedAssertions:total('gitFailures'),otherFailures:total('otherFailures'),skipped:total('skipped'),gitBlockedFiles:result.filter(r=>r.gitFailures).map(r=>r.file),m9,results:result};
fs.writeFileSync(out+'/final-summary.json',JSON.stringify(summary,null,2)+'\n');
const table=['# office 전체 · 최종 결과','',`지정 main 5c375d9 / runtime 7e941be508a5efea0c309c8c689cd32bf976d3122a49ac34c7579e33acf67f36. Git 명령 실행 0회. 성공 실행 로그는 남기지 않고 결과만 집계했다. 재검사 결과는 같은 파일의 이전 실패를 대체하며 중복 합산하지 않았다.`, '', '| 시험 파일 | 통과 | Git 차단 | 기타 실패 | skip |','|---|---:|---:|---:|---:|',...result.map(r=>`| ${r.file} | ${r.pass} | ${r.gitFailures} | ${r.otherFailures} | ${r.skipped} |`),'',`합계 ${result.length}파일: ${summary.pass}통과 / ${summary.gitBlockedAssertions} Git 차단 / ${summary.otherFailures} 기타 실패 / ${summary.skipped} skip.`, '', '219는 대표님 지정 기존 실패다. 이번에는 Git 차단으로 기존 실패 assertion 자체를 재현하지 않았으며 PASS로 집계하지 않았다.', '', '## Git 차단 파일', '',...summary.gitBlockedFiles.map(f=>'- '+f),'', '실행 명령은 final-summary.json에 있다. Git 차단 뒤 같은 검사 안의 나머지 assertion은 미검증이다.'];
fs.writeFileSync(out+'/results.md',table.join('\n')+'\n');
console.log(JSON.stringify({...summary,results:undefined,m9:{pass:m9.pass,fail:m9.fail}}));
