// Byte snapshots from git show HEAD:<file>, not text-mode shell redirection.
// node scripts/hani-google-drive-212-safety.mjs <baseline-directory>
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),base=path.resolve(process.argv[2]);
const read=(dir,file)=>fs.readFileSync(path.join(dir,file),'utf8');
const before=read(base,'hani-main.js'),after=read(root,'hani-main.js');
const start=after.indexOf('// Google Drive FILE LIBRARY:'),end=after.indexOf('const GOOGLE_CALENDAR_FUNCTION=');assert.ok(start>0&&end>start);
const restored=(after.slice(0,start)+after.slice(end))
 .replace('drive:["Drive","Google Drive 파일과 폴더를 확인합니다.","work"]','drive:["Drive","Google Drive로 바로 이동합니다.","work"]')
 .replace('  if(id===GOOGLE_DRIVE_VIEW)googleDriveEnter();\n','')
 .replace('    if(event==="SIGNED_OUT"||googleDriveRuntime.owner!==session?.user?.id)googleDriveInvalidate();\n','')
 .replace('  googleDriveRender();\n','');
assert.equal(restored,before,'all original JS bytes retained except four authorized hooks/label + isolated Drive block');
for(const file of ['hani-main.js','index.html','hani-design-system.css']){
 const old=read(base,file),now=read(root,file),writes=s=>[...s.matchAll(/\b(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|removeItem|clear)\s*\([^\n]*/g)].map(m=>m[0]);assert.deepEqual(writes(now),writes(old),'existing storage paths untouched: '+file);
 for(const token of ['hani_os_life_v23','2.9.15-safe-baseline-bootstrap'])assert.equal(now.split(token).length,old.split(token).length,'protected token unchanged: '+file);
 assert.equal((now.match(/\.clear\s*\(/g)||[]).length,(old.match(/\.clear\s*\(/g)||[]).length,'no new clear calls: '+file);
 assert.deepEqual(now.match(/(?:v=|v)2\.9\.\d+/g),old.match(/(?:v=|v)2\.9\.\d+/g),'display/cache versions unchanged: '+file);
 const eols=new Map(),ambiguous=new Set();for(const line of old.match(/[^\n]*(?:\n|$)/g).filter(Boolean)){const key=line.replace(/\r?\n$/,'');if(eols.has(key)&&eols.get(key)!==line)ambiguous.add(key);eols.set(key,line)}for(const line of now.match(/[^\n]*(?:\n|$)/g).filter(Boolean)){const key=line.replace(/\r?\n$/,'');if(eols.has(key)&&!ambiguous.has(key))assert.ok(eols.get(key)===line,'mixed EOL retained: '+file)}
}
const html=read(root,'index.html'),oldHtml=read(base,'index.html'),oldSection=oldHtml.match(/<section id="drive"[\s\S]*?<\/section>/)[0];assert.equal(html.replace(/<section id="drive"[\s\S]*?<\/section>/,oldSection),oldHtml,'only Drive section changed');
assert.ok(read(root,'hani-design-system.css').startsWith(read(base,'hani-design-system.css')),'existing stylesheet retained byte-for-byte');
assert.ok(fs.readFileSync(path.join(root,'hani-drive-vault.js')).equals(fs.readFileSync(path.join(base,'hani-drive-vault.js'))),'Drive backup Vault untouched');
console.log('PASS storage paths / protected data & version / original JS outside Drive hooks / mixed EOL / old CSS prefix / only Drive markup / unchanged Vault');
