const fs=require('node:fs');
const root='artifacts/m9-rebase281/';
const read=f=>fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'');
const exits=JSON.parse(read(root+'office-exits.json'));
const rows=exits.map(row=>{
 const text=read(root+'office-logs/'+row.file+'.log');
 const count=name=>Number(text.match(new RegExp('^# '+name+' (\\d+)','m'))?.[1]||0);
 const blocks=text.split(/(?=^not ok \d+ - )/m).slice(1);
 const failures=blocks.map(block=>{
  const name=block.match(/^not ok \d+ - (.*)/m)?.[1];
  const match=block.match(/^  error: (.*)\r?$/m);
  let error=match?.[1]||'';
  if(error.trim()==='|-')error=block.slice(match.index+match[0].length).split(/\r?\n/).filter(l=>l.startsWith('    ')).slice(0,8).map(l=>l.trim()).join(' ').slice(0,700);
  const code=block.match(/^\s+code: (.*)/m)?.[1]||'';
  const classification=/EPERM/.test(code+' '+error)?'환경 차단':/exact|restor|fixed|baseline|authored|sha256|bytes accepted|whole source|only approved/i.test(error)?'고정 기준 불일치':'assertion 실패';
  return {name,error,code,classification};
 });
 return {...row,tests:count('tests'),pass:count('pass'),fail:count('fail'),skip:count('skipped'),cancelled:count('cancelled'),failures};
});
const totals=rows.reduce((a,r)=>{for(const k of ['tests','pass','fail','skip','cancelled'])a[k]+=r[k];return a},{files:rows.length,tests:0,pass:0,fail:0,skip:0,cancelled:0});
totals.blocked=rows.flatMap(r=>r.failures).filter(f=>f.classification==='환경 차단').length;
totals.nonBlockedFailures=totals.fail-totals.blocked;
const result={command:'node --require ./scripts/hani-m9-polish-preload.cjs --require ./scripts/hani-m9-link-preload.cjs --test --test-isolation=none --test-timeout=30000 --test-reporter=tap scripts/<hani-office-*.test.mjs> (one file at a time)',runtimeHead:'33dc1d9038f34ac1b05d81859da7cdb879aaa7e1',baseline:'43eda9e2e3f69115c3569f585506904965c26c18',totals,rows};
fs.writeFileSync(root+'office-summary.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(totals));
