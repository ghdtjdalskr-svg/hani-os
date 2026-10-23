// Wildcard runs use the same immutable baseline directory as the train harness.
// Raw pre-task snapshots: node scripts/hani-building-206-safety.test.mjs <baseline dir>
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),base=path.resolve(process.env.HANI_BUILDING_SAFETY_BASELINE||process.argv[2]);
const files=['index.html','hani-office-live.js','hani-office-live.css','hani-style-01.css','scripts/hani-nav-groups.test.mjs','hani-main.js','hani-ui-cleanup-v02971.js','hani-investment-committee.js'];
const ids=s=>Array.from(s.matchAll(/\bid\s*=\s*["']([^"']+)["']/g),m=>m[1]);
const before=[],after=[];
for(const file of files){
 const old=fs.readFileSync(path.join(base,file.replaceAll('/','-')),'utf8'),now=fs.readFileSync(path.join(root,file),'utf8');before.push(...ids(old));after.push(...ids(now));
 const writes=s=>Array.from(s.matchAll(/\b(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|removeItem|clear)\s*\([^\n]*/g),m=>m[0]);assert.deepEqual(writes(now),writes(old),file+' unchanged storage writes');
 for(const token of ['hani_os_life_v23','2.9.15-safe-baseline-bootstrap','.clear('])assert.equal(now.split(token).length,old.split(token).length,file+' preserved '+token);
 const lines=new Map(),ambiguous=new Set();for(const line of old.match(/[^\n]*(?:\n|$)/g).filter(Boolean)){const key=line.replace(/\r?\n$/,'');if(lines.has(key)&&lines.get(key)!==line)ambiguous.add(key);lines.set(key,line)}
 for(const line of now.match(/[^\n]*(?:\n|$)/g).filter(Boolean)){const key=line.replace(/\r?\n$/,'');if(lines.has(key)&&!ambiguous.has(key))assert.equal(line,lines.get(key),file+' retained mixed EOL '+key.slice(0,70))}
 if(['hani-main.js','hani-ui-cleanup-v02971.js','hani-investment-committee.js'].includes(file))assert.equal(now,old,file+' untouched data/approval owner');
 if(file==='index.html'){const versions=s=>s.match(/(?:v=|v)2\.9\.\d+/g);assert.deepEqual(versions(now),versions(old),'no version/cache bump');assert.equal(new Set(ids(now)).size,ids(now).length,'unique markup ids')}
}
for(const id of new Set(after))assert.ok(after.filter(x=>x===id).length<=Math.max(1,before.filter(x=>x===id).length),'no new duplicate id literal '+id);
console.log('PASS building safety: storage/protected owner/version/cache unchanged, unique ids, retained mixed EOL');
