// Raw clean-worktree snapshots, supplied explicitly. No Git child process or user data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),base=process.argv[2];
if(!base)throw Error('Usage: node scripts/hani-invest-split-safety.test.mjs <raw baseline directory>');
const read=(dir,file)=>fs.readFileSync(path.join(dir,file),'utf8');
const before=read(base,'hani-main.js'),after=read(root,'hani-main.js');
function region(source,name){let start=source.indexOf('function '+name+'(');if(start<0)start=source.indexOf('const '+name+'=');assert.ok(start>=0,name);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?source.length:end);}
const owners=['save','commit','writeProtectedState','removeProtectedState','calculate','brokerCalc','brokerHoldingCalc','saveBroker','saveMonthlySnapshot','renderPortfolio','renderAssets','normalizeBrokerHolding','normalizeBrokerAccount','normalizeBrokerSnapshot','cloudPushLocalRow','cloudReadRow','cloudApplyRemoteRow','cloudSyncCycle','cloudSyncFingerprintState','buildBackupPayload','migrateV22','freshState','validateStoredRecords','normalizeState','cloudHasMeaningfulLocalData'];
for(const name of owners)assert.equal(region(after,name),region(before,name),name+' bytes/EOL/state/save/Cloud owner unchanged');
for(const name of ['VERSION','STORAGE_KEY','HANI_DISPLAY_VERSION','NAVIGATION_KEY','GROUP_COLLAPSE_KEY']){const re=new RegExp('const '+name+'=[^;\\n]+');assert.equal(after.match(re)?.[0],before.match(re)?.[0],name);}
const icOld=read(base,'hani-investment-committee.js'),icNew=read(root,'hani-investment-committee.js');
assert.equal(icNew.slice(0,icNew.indexOf('  // This module owns')),icOld.slice(0,icOld.indexOf('  // Browser UI is mounted')),'entire research/monthly data core identical');
const marketOld=read(base,'hani-asset-market-view.js'),marketNew=read(root,'hani-asset-market-view.js'),marker='/* HANI PORTFOLIO READ-ONLY BUNDLE START */';
const analyticsEnd='/* Read-only Phase B;';
assert.equal(marketNew.slice(marketNew.indexOf(marker),marketNew.indexOf('/* Display-only basis labels.')),marketOld.slice(marketOld.indexOf(marker),marketOld.indexOf(analyticsEnd)),'canonical portfolio analytics identical; display labels are scoped follow-up');
assert.doesNotMatch(marketNew.slice(marketNew.indexOf('/* Display-only basis labels.')),/localStorage|sessionStorage|writeProtectedState|\bcommit\(|\bsave\(|\.(?:setItem|removeItem|insert|upsert|fetch)\(/,'display helper and existing renderer remain read-only');
// Compare retained lines by text, including relocated nodes; ambiguous repeated blank lines excluded.
for(const file of ['hani-main.js','index.html']){
  const old=read(base,file),now=read(root,file),lines=s=>s.match(/[^\n]*(?:\n|$)/g).filter(Boolean),byText=new Map(),ambiguous=new Set();
  for(const line of lines(old)){const key=line.replace(/\r?\n$/,'');if(byText.has(key)&&byText.get(key)!==line)ambiguous.add(key);byText.set(key,line);}
  for(const key of ambiguous)byText.delete(key);
  let count=0;for(const line of lines(now)){const key=line.replace(/\r?\n$/,'');if(byText.has(key)){assert.equal(line,byText.get(key),file+' retained EOL: '+key.slice(0,80));count++;}}
  const caches=s=>[...s.matchAll(/(?:src|href)="([^"\n]+\?v=[^"\n]+)"/g)].map(m=>m[1]).sort();
  assert.deepEqual(caches(now),caches(old),file+' cache tags identical');
  console.log('PASS '+file+' retained per-line mixed EOL: '+count+' lines, cache tags unchanged');
}
console.log('PASS '+owners.length+' protected/state owners, IC core, portfolio analytics byte-identical; protected storage keys/internal/display version unchanged.');
