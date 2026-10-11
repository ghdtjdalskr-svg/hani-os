const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const baseline=path.resolve(process.argv[2]||'artifacts/green-209/git-baseline');
const read=p=>fs.readFileSync(p,'utf8');
const result=[];
for(const file of ['hani-investment-committee.js','hani-investment-committee.css','hani-main.js','index.html']){
  const old=read(path.join(baseline,file)),now=read(file);
  const lines=s=>s.match(/[^\n]*(?:\n|$)/g).filter(Boolean).map(l=>[l.replace(/\r?\n$/,''),l.endsWith('\r\n')?'CRLF':l.endsWith('\n')?'LF':'EOF']);
  const map=new Map(),ambiguous=new Set();for(const [content,eol] of lines(old)){if(map.has(content)&&map.get(content)!==eol)ambiguous.add(content);map.set(content,eol);}for(const line of ambiguous)map.delete(line);
  for(const [content,eol] of lines(now))if(map.has(content))assert.equal(eol,map.get(content),file+' retained line EOL');
  if(['hani-main.js','index.html'].includes(file))assert.equal(now,old,file+' byte-identical (data, versions, tags, all owner paths)');
  else{
    for(const pattern of [/\bid=["'][^"']+["']/g,/\b(?:localStorage|sessionStorage)\.[\w]+\(/g,/\.clear\(/g])assert.deepEqual(now.match(pattern)||[],old.match(pattern)||[],file+' unchanged IDs/storage/destructive calls');
  }
  result.push({file,status:'PASS'});
}
// Downloaded deployment originals, then only allowed generation regions differ.
for(const slug of ['hani-newsroom-publisher','hani-agent-orchestrator']){
  const old=read('artifacts/green-209/server-baseline/'+slug+'/index.ts'),now=read('supabase/functions/'+slug+'/index.ts');
  const strip=s=>{
    s=s.replace(/^import .*;\r?\n/gm,'');
    if(slug==='hani-newsroom-publisher'){
      s=s.replace(/const COMMENT_SCHEMA=[\s\S]*?(?=const WEEKLY_SCHEMA)/,'');
      s=s.replace(/function drawCommentCount\(\)[^\n]*\r?\n/,'');
      s=s.replace(/async function runInterestSearch[\s\S]*?(?=async function runWeeklySearch)/,'');
    }else{
      s=s.replace(/const INVESTMENT_NEWS_SCHEMA[\s\S]*?(?=function canonicalNewsUrl)/,'');
      s=s.replace(/async function runInvestmentNews[\s\S]*?(?=async function runMarketResearch)/,'');
    }
    return s;
  };
  assert.equal(strip(now),strip(old),slug+' all auth, archive/write and other features byte-identical');
  const writes=s=>s.match(/\.(?:insert|update|delete|upsert)\([^\n]*/g)||[];
  assert.deepEqual(writes(now),writes(old),slug+' write surfaces unchanged');
  assert.equal((now.match(/\.clear\(/g)||[]).length,(old.match(/\.clear\(/g)||[]).length);
  if(slug==='hani-agent-orchestrator')assert.equal(now.replace(/\r\n/g,'').includes('\n'),false,'manual CRLF preserved');
  result.push({slug,status:'PASS'});
}
fs.writeFileSync('artifacts/green-209/safety-results.json',JSON.stringify(result,null,2));
console.log('PASS: protected client owners/version/cache byte-identical, retained mixed EOL, no new IDs/storage/clear, both server auth and writes byte-identical outside generation.');
