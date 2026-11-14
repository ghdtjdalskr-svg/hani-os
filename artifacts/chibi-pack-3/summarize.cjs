const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=__dirname,plan=require('./plan.json').plan;
const initial=JSON.parse(fs.readFileSync(path.join(dir,'local/results.json'),'utf8'));
const additional=JSON.parse(fs.readFileSync(path.join(dir,'local/additional-results.json'),'utf8'));
const value=JSON.parse(fs.readFileSync(path.join(dir,'local/latest-feature-results.json'),'utf8'));
const feature=Array.isArray(value)?value:[value];
const latest=new Map([...initial,...additional,...feature].map(r=>[r.file,r]));
const ready=plan.filter(r=>r.status==='READY'),rows=ready.map(r=>latest.get(r.file)||{file:r.file,missing:true});
const missing=rows.filter(r=>r.missing),failed=rows.filter(r=>!r.missing&&r.exit!==0);
const sum=rows=>({files:rows.length,pass:rows.reduce((s,r)=>s+(r.pass||0),0),fail:rows.reduce((s,r)=>s+(r.fail||0),0),skip:rows.reduce((s,r)=>s+(r.skip||0),0)});
const result={base:'7a91982',status:missing.length||failed.length?'INCOMPLETE':'PASS',...sum(rows),successfulFiles:rows.filter(r=>r.exit===0).length,office:sum(rows.filter(r=>r.office)),chibi3:sum(rows.filter(r=>r.file.includes('chibi-pack-3'))),missing,failed,
 gitDelegated:plan.filter(r=>r.status==='GIT_REQUIRED').map(r=>r.file),browserDelegated:plan.filter(r=>r.status==='BROWSER_DELEGATED').map(r=>r.file),knownUntouched:plan.filter(r=>r.status==='KNOWN_FAILURE_UNTOUCHED').map(r=>r.file),rows};
fs.writeFileSync(path.join(dir,'regression-results.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(dir,'TEST-RESULTS.md'),'# 치비3 지정·관련 회귀 시험\n\n각 파일을 별도 Node 프로세스로 실행, 외부 inverse preload 없음. Git/브라우저 자식 실행은 deny-process로 차단. 출력 보존용 output.cjs만 추가 사용. 표 숫자는 Node TAP 집계(자체 실행형은 파일 단위 TAP 포함).\n\n| 파일 | PASS | FAIL | SKIP | exit |\n| --- | ---: | ---: | ---: | ---: |\n'+rows.map(r=>'| '+r.file+' | '+(r.pass||0)+' | '+(r.fail||0)+' | '+(r.skip||0)+' | '+(r.exit??'미실행')+' |').join('\n')+'\n\n## 브라우저 전용 인계\n\n'+result.browserDelegated.map(f=>'- `'+f+'`').join('\n')+'\n\n월간보고 smoke 최초 시도는 Playwright 미설치로 시작 실패(실제 브라우저 실행 0), 이후 전용 브라우저 항목으로 분리. 지정 기존 실패는 미실행·미수정.\n');
console.log(JSON.stringify({...result,rows:undefined,gitDelegated:result.gitDelegated.length,browserDelegated:result.browserDelegated.length,knownUntouched:result.knownUntouched.length},null,2));
assert.equal(result.status,'PASS');
