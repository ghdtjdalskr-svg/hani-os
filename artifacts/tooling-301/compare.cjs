const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const local=path.join(__dirname,'local'),read=label=>JSON.parse(fs.readFileSync(path.join(local,label+'-results.json')));
const base=read('baseline'),current=read('current'),byName=new Map(current.map(r=>[r.file,r]));
for(const rows of [base,current])assert.equal(rows.length,new Set(rows.map(r=>r.file)).size,'no duplicate result');
for(const [rows,root]of [[base,path.join(local,'baseline')],[current,path.resolve(__dirname,'../..')]])assert.deepEqual(rows.map(r=>r.file).sort(),fs.readdirSync(path.join(root,'scripts')).filter(f=>f.endsWith('.test.mjs')).sort(),'every test file has exactly one result');
const failed=r=>r.exit!==0||r.timeout;
const failureTitles=(label,file)=>[...new Set(fs.readFileSync(path.join(local,label+'-logs',file+'.log'),'utf8').split(/\r?\n/).flatMap(line=>{const m=line.match(/^\s*(?:✖\s+|not ok \d+\s*-\s*)(.+?)\s*$/);if(!m||m[1]==='failing tests:')return [];return [m[1].replace(/\s+\([\d.]+(?:m?s)\)$/,'')];}))];
const changed=[],regressions=[],missing=[],newFailureTitles=[];
for(const a of base){const b=byName.get(a.file);if(!b){missing.push(a.file);continue;}
 if(a.exit!==b.exit||a.timeout!==b.timeout||a.pass!==b.pass||a.fail!==b.fail||a.skip!==b.skip||a.scriptPass!==b.scriptPass)changed.push({file:a.file,baseline:a,current:b});
 const oldTitles=failureTitles('baseline',a.file),addedTitles=failureTitles('current',a.file).filter(t=>!oldTitles.includes(t));
 if(addedTitles.length)newFailureTitles.push({file:a.file,titles:addedTitles});
 if(!failed(a)&&failed(b)||!a.timeout&&(b.fail>a.fail||b.pass<a.pass)||b.scriptPass<a.scriptPass||addedTitles.length)regressions.push(a.file);
}
const summary=rows=>({files:rows.length,exit0:rows.filter(r=>!failed(r)).length,failed:rows.filter(r=>failed(r)&&!r.timeout).length,timeout:rows.filter(r=>r.timeout).length,pass:rows.reduce((n,r)=>n+r.pass,0),fail:rows.reduce((n,r)=>n+r.fail,0),skip:rows.reduce((n,r)=>n+r.skip,0),scriptPass:rows.reduce((n,r)=>n+r.scriptPass,0)});
const report={baseline:summary(base),current:summary(current),missing,changed,regressions,newFailureTitles,newFiles:current.filter(r=>!base.some(a=>a.file===r.file))};
fs.writeFileSync(path.join(__dirname,'comparison.json'),JSON.stringify(report,null,2)+'\n');
const cell=r=>r?`${r.timeout?'timeout':r.exit} / ${r.pass}·${r.fail}·${r.skip}`:'—';
const lines=['# tooling-301 · 시험별 결과','','기준 ad95b84와 현재 폴더에서 각 `node scripts/<파일>` 순차 실행. 숫자: 종료 코드 / Node PASS·FAIL·SKIP. 0·0·0은 단언 요약 미출력일 수 있으며 종료 코드로 파일 성공 여부를 별도 판단. timeout은 90초 제한에서 미완료. script PASS 표식도 별도 대조. 전체 로그·복사본은 local/ 아래 보존(커밋 제외).','','| 시험 | main ad95b84 | 현재 | script PASS (기준/현재) |','|---|---|---|---|'];
for(const file of [...new Set([...base,...current].map(r=>r.file))].sort()){const a=base.find(r=>r.file===file),b=byName.get(file);lines.push(`| ${file} | ${cell(a)} | ${cell(b)} | ${a?.scriptPass??'—'}/${b?.scriptPass??'—'} |`);}
fs.writeFileSync(path.join(__dirname,'TEST-RESULTS.md'),lines.join('\n')+'\n');
console.log(JSON.stringify(report));
