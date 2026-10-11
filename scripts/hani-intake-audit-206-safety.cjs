const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/intake-audit-206'),results=[];
for(const file of ['hani-yuna-helpdesk.js','hani-yuna-helpdesk.css','hani-main.js','index.html']){
 const before=fs.readFileSync(path.join(out,'baseline',file)),after=fs.readFileSync(path.join(root,file));
 if(['hani-main.js','index.html'].includes(file))assert.deepEqual(after,before,`${file}: existing parser/save/storage/Cloud/version/cache byte-identical`);
 const text=after.toString(),original=before.toString(),unique=new Map();for(const line of original.match(/[^\n]*\n|[^\n]+$/g)||[]){const key=line.replace(/\r?\n$/,'');unique.set(key,unique.has(key)?null:line)}
 const currentCounts=new Map();for(const line of text.match(/[^\n]*\n|[^\n]+$/g)||[]){const key=line.replace(/\r?\n$/,'');currentCounts.set(key,(currentCounts.get(key)||0)+1)}
 let matches=0;for(const line of text.match(/[^\n]*\n|[^\n]+$/g)||[]){const key=line.replace(/\r?\n$/,''),old=unique.get(key);if(old&&currentCounts.get(key)===1){assert.equal(line,old,`${file}: unchanged EOL`);matches++}}
 if(file==='hani-yuna-helpdesk.js'){
  assert.ok(!text.includes('.clear('));assert.ok(!/localStorage\.(?:setItem|removeItem)/.test(text));
  const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'no duplicate ID literals');
  const storagePaths=s=>[...s.matchAll(/sessionStorage\.(?:setItem|removeItem)\([^;]+/g)].map(m=>m[0]);assert.deepEqual(storagePaths(text),storagePaths(original),'existing session persistence paths');
  assert.equal((text.match(/intakeApplyRow\(row\)/g)||[]).length,1);assert.equal((text.match(/const ok=commit\(/g)||[]).length,1,'one existing explicit save boundary');
 }
 results.push({file,bytes:after.length,sha256:crypto.createHash('sha256').update(after).digest('hex'),unchangedUniqueLineEols:matches,unchanged:after.equals(before)});
}
fs.writeFileSync(path.join(out,'source-safety.json'),JSON.stringify({status:'PASS',base:'45b3c4db77b777d494078581213bf2e395ceaf99',results},null,2));console.log('PASS: main/index exact bytes; mixed EOL retained; unique ID literals; no protected storage/clear path; existing session paths and single save boundary');
