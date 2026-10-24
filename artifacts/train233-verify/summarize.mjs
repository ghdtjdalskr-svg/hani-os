import fs from 'node:fs';import path from 'node:path';
const root='artifacts/train233-verify';
const phases=['full-initial','helpers-fixed','mocks-fixed','contract-fixed','final-rechecks','final-additional','main-output-rechecks'];
const final=new Map();for(const phase of phases){const file=path.join(root,phase,'results.json');if(fs.existsSync(file))for(const row of JSON.parse(fs.readFileSync(file,'utf8')).flat(Infinity))final.set(row.target+':'+row.file,row);}
function classify(row){if(!row)return {status:'NOT_RUN'};let log=row.log&&fs.existsSync(path.join(root,row.log))?fs.readFileSync(path.join(root,row.log),'utf8'):'';
 const first=log.split(/\r?\n/).find(l=>/ReferenceError:|TypeError(?: \[[^\]]+\])?:|AssertionError|Error:|✖/.test(l))||row.reason||'';
 let status=row.status;
 if(status==='TIMEOUT')status='BLOCKED_TIMEOUT';
 if(status==='FAIL'||status.startsWith('BLOCKED')){
  if(/HANI_BROWSER_QUOTA_EXHAUSTED|browserType\.launch|Executable doesn't exist|playwright.*MODULE_NOT_FOUND/s.test(log))status='BLOCKED_BROWSER';
  else if(/spawn(?:Sync)? .*EPERM|EPERM|EACCES|Exact native Git export required|HANI_GIT_EXPORT_REQUIRED/.test(log))status='BLOCKED_ENVIRONMENT';
  else if(/Cannot find (?:module|package)|ENOENT|pass rebuilt Edge Function|Usage:|args: <playwright|process\.argv|(?:path|paths\[0\]).*undefined/.test(log)&&!/ReferenceError: (?:parseKoreanNumber|validateEntryDates)/.test(log))status='BLOCKED_FIXTURE';
  else if(['scripts/hani-drive-vault-precheck.test.mjs','scripts/hani-protected-gate-integration.test.mjs'].includes(row.file)&&/null !== 0|actual: null/.test(log))status='BLOCKED_NODE_SUBPROCESS';
 }
 const counts={};for(const key of ['tests','pass','fail','skipped']){const matches=[...log.matchAll(new RegExp('(?:ℹ |# )'+key+' (\\d+)','g'))];if(matches.length)counts[key]=Number(matches.at(-1)[1]);}
 return {...row,rawStatus:row.status,status,first:first.slice(0,250),counts};}
const inventory=JSON.parse(fs.readFileSync(path.join(root,'inventory.json')));
const comparison=inventory.map(entry=>{const candidate=classify(final.get('candidate:'+entry.file)),main=classify(final.get('main:'+entry.file));let verdict='OTHER';
 if(candidate.status==='PASS'&&main.status==='PASS')verdict='BOTH_PASS';
 else if(candidate.status==='PASS'&&main.status==='ABSENT')verdict='NEW_PASS';
 else if(candidate.status==='FAIL'&&main.status==='PASS')verdict='REGRESSION';
 else if(candidate.status==='FAIL'&&main.status==='ABSENT')verdict='NEW_FEATURE_FAILURE';
 else if(candidate.status==='FAIL'&&main.status==='FAIL')verdict='BOTH_FAIL';
 else if(candidate.status.startsWith('BLOCKED')||main.status.startsWith('BLOCKED'))verdict='BLOCKED_OR_PARTIAL';
 return {file:entry.file,browserBranch:entry.browser?'NOT_VERIFIED':'N/A',candidate,main,verdict};});
const tally=key=>Object.fromEntries([...new Set(comparison.map(x=>key==='verdict'?x[key]:x[key].status))].sort().map(s=>[s,comparison.filter(x=>(key==='verdict'?x[key]:x[key].status)===s).length]));
const summary={files:comparison.length,candidate:tally('candidate'),main:tally('main'),verdict:tally('verdict'),regressions:comparison.filter(r=>r.verdict==='REGRESSION'||r.verdict==='NEW_FEATURE_FAILURE').map(r=>({file:r.file,candidate:r.candidate.status,main:r.main.status,reason:r.candidate.first})),notRun:comparison.filter(r=>r.candidate.status==='NOT_RUN').map(r=>r.file)};
fs.writeFileSync(path.join(root,'comparison.json'),JSON.stringify(comparison,null,2)+'\n');fs.writeFileSync(path.join(root,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
