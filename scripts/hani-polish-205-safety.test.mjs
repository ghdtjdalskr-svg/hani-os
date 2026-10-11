/* Read-only safety comparison against raw pre-task files. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'..');
const files=['hani-main.js','index.html','hani-ai-budget.js','hani-ai-budget-core.js','hani-investment-committee.js','scripts/hani-ai-budget-bridge.mjs'];
const beforeIds=new Map(),afterIds=new Map();
for(const file of files){
  const old=fs.readFileSync(path.join(dir,file.replaceAll('/','-')),'utf8'),now=fs.readFileSync(path.join(root,file),'utf8');
  const calls=s=>Array.from(s.matchAll(/\blocalStorage\s*\.\s*(?:setItem|removeItem|clear)\s*\([^\n]*/g),m=>m[0]);
  assert.deepEqual(calls(now),calls(old),file+' no new or changed app localStorage writes');
  assert.equal((now.match(/\.clear\s*\(/g)||[]).length,(old.match(/\.clear\s*\(/g)||[]).length,file+' no new clear');
  for(const token of ['hani_os_life_v23','2.9.15-safe-baseline-bootstrap'])assert.equal(now.split(token).length,old.split(token).length,file+' protected literal');
  for(const [source,ids] of [[old,beforeIds],[now,afterIds]])for(const m of source.matchAll(/\bid\s*=\s*["']([^"']+)["']/g))ids.set(m[1],(ids.get(m[1])||0)+1);
  const eols=new Map(),ambiguous=new Set();
  for(const line of old.match(/[^\n]*(?:\n|$)/g).filter(Boolean)){
    const text=line.replace(/\r?\n$/,'');if(eols.has(text)&&eols.get(text)!==line)ambiguous.add(text);eols.set(text,line);
  }
  for(const text of ambiguous)eols.delete(text);
  for(const line of now.match(/[^\n]*(?:\n|$)/g).filter(Boolean)){
    const text=line.replace(/\r?\n$/,'');if(eols.has(text))assert.equal(line,eols.get(text),file+' retained EOL '+text.slice(0,60));
  }
}
for(const [id,count] of afterIds)assert.ok(count<=1||count<=(beforeIds.get(id)||0),'no new duplicate id literal '+id);
console.log('PASS polish-205 safety: 6 runtime files, unchanged app storage writes/protected literals, no new clear/duplicate id literals, retained mixed EOL');
