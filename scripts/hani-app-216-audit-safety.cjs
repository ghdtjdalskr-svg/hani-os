// Compare with this task's raw start snapshot. No storage execution and no Git writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const baseline=process.argv[2];assert.ok(baseline,'usage: node scripts/hani-app-216-audit-safety.cjs <raw baseline>');
const match=(s,re)=>[...s.matchAll(re)].map(m=>m[0]);
const block=(s,a,b)=>{const start=s.indexOf(a),end=s.indexOf(b,start);assert.ok(start>=0&&end>start,a);return s.slice(start,end)};
for(const file of ['hani-main.js','index.html','hani-yuna-helpdesk.js','hani-ilbo.js','hani-character-archive.js']){
 const before=fs.readFileSync(path.join(baseline,file),'utf8'),after=fs.readFileSync(file,'utf8');
 const unique=s=>{const map=new Map;for(const line of s.match(/[^\n]*\n|[^\n]+$/g)||[]){const key=line.replace(/\r?\n$/,'');map.set(key,map.has(key)?null:line)}return map};
 const old=unique(before),next=unique(after);for(const [key,line]of old)if(line&&next.get(key))assert.equal(next.get(key),line,file+': unchanged line EOL');
 for(const re of [/(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|removeItem|clear)\s*\([^;]*/g,/\b(?:commit|learningCommit)\([^;\r\n]*/g,/(?:const HANI_DISPLAY_VERSION=|const VERSION=)[^\r\n]*/g])assert.deepEqual(match(after,re),match(before,re),file+': write/version paths');
 if(file==='index.html'){
  const refs=s=>new Map([...s.matchAll(/(?:src|href)="([^"?]+)(\?v=[^"]+)?"/g)].map(m=>[m[1],m[2]]));
  const a=refs(before),b=refs(after);for(const [url,version]of a)if(version)assert.equal(b.get(url),version,'existing cache tag '+url);
  assert.deepEqual(match(after,/v2\.9\.215/g).length>=match(before,/v2\.9\.215/g).length,true);
 }
 const ranges=file==='hani-main.js'?[
  ['function validateStoredRecords(','function writeProtectedState('],['function writeProtectedState(','// Goal Registry:'],
  ['function commit(message,notify=true){','// HANI OS v2.9.56'],['async function cloudReadRow(','function cloudBindLifecycle('],
  ['function normalizeLedgerItem(','function loadState('],['function normalizeState(','function save('],
  ['$("ledgerImportRaw").oninput=','$("campusSemesterSave").onclick='],['$("saveBook").onclick=','const MOVIE_CONTENT_TYPES='],['$("saveMovie").onclick=','function diary'],
  ['async function deployBridgeApi(','function deployNormalizeReleasePath('],['function deployLoadSession(','function deployClass(']
 ]:file==='hani-yuna-helpdesk.js'?[
  ['function persist(){','function loadPersisted('],['function saveApproved(','function ']
 ]:[];
 for(const [a,b]of ranges){if(b==='function '){const start=after.indexOf(a);assert.ok(start>=0);const end=after.indexOf('\nfunction ',start+1);assert.equal(after.slice(start,end),before.slice(before.indexOf(a),before.indexOf('\nfunction ',before.indexOf(a)+1)))}else assert.equal(block(after,a,b),block(before,a,b),file+': '+a)}
 console.log('PASS '+file+': unchanged EOL/write/version/protected owners');
}
