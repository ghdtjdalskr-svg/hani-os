// Read-only comparison to raw `git show HEAD:<file>` copies in the supplied directory.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const baseline=process.argv[2];assert.ok(baseline,'Pass the directory containing .tmp-base-<file> copies');
const files=['hani-main.js','hani-ui-v02992.js','hani-board.js','hani-context-remote-v1.js','hani-asset-market-view.js','hani-design-system.css','index.html'];
const root=path.resolve(__dirname,'..'),sources=[];
function ids(s){const result=new Map();for(const m of s.matchAll(/\bid\s*=\s*["']([^"']+)["']/g))result.set(m[1],(result.get(m[1])||0)+1);return result}
function calls(s){return [...s.matchAll(/\blocalStorage\s*\.\s*(?:setItem|removeItem|clear)\s*\([^\n]*/g)].map(m=>m[0])}
const oldIds=new Map(),newIds=new Map();
for(const file of files){
  const before=fs.readFileSync(path.join(baseline,'.tmp-base-'+file),'utf8'),after=fs.readFileSync(path.join(root,file),'utf8');sources.push(after);
  assert.deepEqual(calls(after),calls(before),file+': localStorage write surfaces preserved');
  assert.equal((after.match(/\.clear\s*\(/g)||[]).length,(before.match(/\.clear\s*\(/g)||[]).length,file+': no new clear calls');
  for(const [id,total]of ids(before))oldIds.set(id,(oldIds.get(id)||0)+total);
  for(const [id,total]of ids(after))newIds.set(id,(newIds.get(id)||0)+total);
  if(file==='hani-main.js'||file==='index.html'){
    const lines=s=>{const map=new Map();for(const m of s.matchAll(/([^\r\n]*)(\r?\n|$)/g)){if(!m[0])continue;const list=map.get(m[1])||[];list.push(m[2]);map.set(m[1],list)}return map};
    const old=lines(before),now=lines(after);let checked=0;
    for(const [text,eols]of old){
      const current=now.get(text);if(!current)continue;
      if(current.length===eols.length)assert.deepEqual(current,eols,file+': retained line endings');
      else {const short=current.length<eols.length?current:eols,long=current.length<eols.length?eols:current;let index=0;for(const ending of long)if(ending===short[index])index++;assert.equal(index,short.length,file+': repeated retained line endings');}
      checked+=Math.min(current.length,eols.length);
    }
    assert.ok(checked>before.split('\n').length*.95,'at least 95% of retained lines checked');
    console.log('PASS: '+file+' retained EOLs ('+checked+' lines)');
    for(const literal of ['2.9.15-safe-baseline-bootstrap','hani_os_life_v23','2.9.202'])assert.equal(after.split(literal).length,before.split(literal).length,file+': protected/version literal count');
  }
}
for(const [id,total]of newIds)assert.ok(total<=1||total<=(oldIds.get(id)||0),'no new duplicate id literal: '+id);
console.log('PASS: unchanged localStorage/clear call surfaces, protected key/internal/display versions, no new duplicate id literals');
