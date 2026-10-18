// Compare raw source from the unchanged base; no Git subprocess or real storage.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const baseline=process.argv[2];assert.ok(baseline,'usage: node scripts/hani-app-216-safety.cjs <raw baseline directory>');
const files=['hani-main.js','index.html','hani-investment-committee.js','hani-design-system.css','scripts/hani-access-ui.test.mjs'];
const root=path.join(__dirname,'..');
for(const file of files){
 const before=fs.readFileSync(path.join(baseline,path.basename(file)),'utf8'),after=fs.readFileSync(path.join(root,file),'utf8');
 const unique=s=>{const m=new Map();for(const line of s.match(/[^\n]*\n|[^\n]+$/g)||[]){const key=line.replace(/\r?\n$/,'');m.set(key,m.has(key)?null:line)}return m};
 const old=unique(before),next=unique(after);let kept=0;
 for(const [key,line] of old)if(line&&next.get(key)){assert.equal(next.get(key),line,file+': unchanged line EOL');kept++}
 const writes=s=>Array.from(s.matchAll(/(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|removeItem|clear)\s*\([^;]*/g),m=>m[0]);assert.deepEqual(writes(after),writes(before),file+': storage write paths');
 if(file.endsWith('.js')){
  const versions=s=>Array.from(s.matchAll(/(?:HANI_DISPLAY_VERSION|2\.9\.15-safe-baseline-bootstrap)[^\r\n]*/g),m=>m[0]);assert.deepEqual(versions(after),versions(before));
 }
 if(file==='index.html')assert.deepEqual(Array.from(after.matchAll(/\?v=[^"']+/g),m=>m[0]),Array.from(before.matchAll(/\?v=[^"']+/g),m=>m[0]),'cache tags unchanged');
 if(file==='hani-main.js'){
  const block=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
  for(const [a,b] of [['function save({recover=false}={}){','// Goal Registry:'],['function commit(message,notify=true){','// HANI OS v2.9.56']]){
   assert.ok(before.includes(a)&&before.indexOf(b,before.indexOf(a))>before.indexOf(a),a+' safety anchor');
   assert.equal(block(after,a,b),block(before,a,b),a+': persistence owner byte-identical');
  }
  // The importer and its only apply/save path remain exact, up to the next event owner.
  const a='$("ledgerImportRaw").oninput=',b='$("campusSemesterSave").onclick=';
  assert.ok(before.includes(a)&&before.includes(b),'import owner anchors');assert.equal(block(after,a,b),block(before,a,b));
  const cloud=block(before,'async function cloudReadRow(','function cloudBindLifecycle(');assert.ok(cloud.length>10000);assert.equal(block(after,'async function cloudReadRow(','function cloudBindLifecycle('),cloud,'Cloud owner unchanged');
  const oldCalls=Array.from(before.matchAll(/\bcommit\([^;\r\n]*/g),m=>m[0]),newCalls=Array.from(after.matchAll(/\bcommit\([^;\r\n]*/g),m=>m[0]);assert.deepEqual(newCalls,oldCalls,'all existing commit calls unchanged');
 }
 console.log('PASS '+file+': '+kept+' unique unchanged EOLs, existing storage/version/cache boundaries');
}
