import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const current=fs.readFileSync(new URL('hani-main.js',root),'utf8');
const base=execFileSync('git',['show','85c8110ee310c1d0cb4aa3cdbf3275a07e5593e6:hani-main.js'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
// These existing multiline declarations end with an unindented closing brace.
// Fail rather than silently reuse evidence if their declaration shape changes.
const extract=(code,name)=>{
  const start=code.indexOf('function '+name+'('),end=code.indexOf('\n}',start);
  assert.ok(start>=0&&end>start,name+' declaration boundary missing');
  return code.slice(start,end+2);
};
for(const name of ['save','commit','cloudSaveSyncMeta','cloudApplyRemoteRow','cloudPushLocalRow','cloudSyncDecision','cloudSyncCycle','cloudFirstCopy','cloudRestoreToLocal','cloudManualSync']) {
  assert.equal(extract(current,name),extract(base,name),name+' write semantics changed');
}
assert.ok(current.includes('const STORAGE_KEY="hani_os_life_v23"'));
assert.ok(current.includes('const VERSION="2.9.15-safe-baseline-bootstrap"'));
const module=fs.readFileSync(new URL('data-hub/dashboard-runtime.mjs',root),'utf8');
assert.ok(!/localStorage|\.upsert\(|\.insert\(|\.delete\(/.test(module));
assert.ok(!/save\(|normalizeState\(|cloudSyncCycle\(|cloudApplyRemoteRow\(/.test(extract(current,'dataHubRefresh')));
console.log('PASS: 10 original source/Cloud write functions byte-identical to base; protected key/version preserved; adapter has no operational write path');
