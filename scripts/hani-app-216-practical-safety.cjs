// Raw, session-start baseline. No Git dependency and no real storage access.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const baseline=process.argv[2];assert.ok(baseline,'usage: node scripts/hani-app-216-practical-safety.cjs <raw baseline>');
const block=(s,a,b)=>{const start=s.indexOf(a),end=s.indexOf(b,start);assert.ok(start>=0&&end>start,a);return s.slice(start,end)};
for(const file of ['hani-main.js','index.html','hani-design-system.css','hani-study-v02984.js','hani-drive-vault.js']){
 const before=fs.readFileSync(path.join(baseline,file),'utf8'),after=fs.readFileSync(file,'utf8');
 const unique=s=>{const map=new Map();for(const line of s.match(/[^\n]*\n|[^\n]+$/g)||[]){const key=line.replace(/\r?\n$/,'');map.set(key,map.has(key)?null:line)}return map};
 const old=unique(before),next=unique(after);for(const [key,line]of old)if(line&&next.get(key))assert.equal(next.get(key),line,file+': unchanged mixed EOL');
 const matches=(s,re)=>Array.from(s.matchAll(re),m=>m[0]);
 for(const re of [/(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|removeItem|clear)\s*\([^;]*/g,/\b(?:commit|learningCommit)\([^;\r\n]*/g,/(?:HANI_DISPLAY_VERSION|2\.9\.15-safe-baseline-bootstrap)[^\r\n]*/g,/\?v=[^"'\s)]+/g])assert.deepEqual(matches(after,re),matches(before,re),file+': existing write/version/cache paths');
 const boundaries=file==='hani-main.js'?[['function save({recover=false}={}){','// Goal Registry:'],['function commit(message,notify=true){','// HANI OS v2.9.56'],['async function cloudReadRow(','function cloudBindLifecycle('],['$("ledgerImportRaw").oninput=','$("campusSemesterSave").onclick='],['$("saveBook").onclick=','const MOVIE_CONTENT_TYPES='],['$("saveMovie").onclick=','function diary']]:file==='hani-study-v02984.js'?[['  function persistWrongUpdate(','  function hinaQuizItems(']]:file==='hani-drive-vault.js'?[['  async function record(','  function status('],['  async function backup(','  function schedule(']]:[];
 for(const [a,b]of boundaries)assert.equal(block(after,a,b),block(before,a,b),file+': '+a);
 console.log('PASS '+file+': mixed EOL, storage/commit/version, protected owners');
}
