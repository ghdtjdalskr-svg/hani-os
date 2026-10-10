import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {assignCodexSlot,codexAccount,claudeAccount,writeSummary,readSummary,allowedOrigin,createBridge} from './hani-ai-budget-bridge.mjs';
const core=createRequire(import.meta.url)('../hani-ai-budget-core.js');
const now=Date.now(),observedAt=new Date(now).toISOString(),fingerprint='a'.repeat(64);
const a={id:'codex-1',provider:'codex',source:'codex-app-server',fingerprint,observedAt,windows:[{kind:'weekly',usedPercent:0,resetsAt:new Date(now+3600000).toISOString()}],secret:'must-not-survive'};
const s=core.normalize({schemaVersion:1,accounts:[a],token:'secret'});
assert.equal(s.accounts[0].windows[0].usedPercent,0);assert.equal(JSON.stringify(s).includes('secret'),false);
assert.equal(core.windowState(s.accounts[0],s.accounts[0].windows[0],now),'fresh');
assert.equal(core.windowState(s.accounts[0],s.accounts[0].windows[0],now+16*60000),'stale');
assert.equal(core.windowState(s.accounts[0],s.accounts[0].windows[0],now+3600001),'expired');
for(const v of [undefined,'0',-1,101,NaN])assert.throws(()=>core.normalize({schemaVersion:1,accounts:[{...a,windows:[{usedPercent:v}]}]}));
assert.equal(core.windowState(a,{usedPercent:null},now),'unknown');
assert.throws(()=>core.normalize({schemaVersion:1,accounts:[a,{...a,id:'codex-2'}]}));
assert.throws(()=>core.normalizeAccount({...a,provider:'claude'}));
assert.equal(assignCodexSlot(s,fingerprint),'codex-1');assert.equal(assignCodexSlot(s,'b'.repeat(64)),'codex-2');
const two=core.merge(s,{schemaVersion:1,accounts:[{...a,id:'codex-2',fingerprint:'b'.repeat(64)}]});
assert.throws(()=>assignCodexSlot(two,'c'.repeat(64)));
assert.equal(core.merge(s,{schemaVersion:1,accounts:[{...a,observedAt:new Date(now-1000).toISOString(),windows:[]}]}).accounts[0].windows.length,1);
assert.equal(codexAccount('codex-1',{rateLimitsByLimitId:{codex:{primary:{usedPercent:10,windowDurationMins:300,resetsAt:Math.floor(now/1000)+300}}}},fingerprint).windows[0].kind,'session');
assert.throws(()=>codexAccount('codex-1',{rateLimitsByLimitId:{other:{}}},fingerprint));
assert.equal(claudeAccount({rate_limits:{seven_day:{used_percentage:40,resets_at:Math.floor(now/1000)+100}}}).windows[0].usedPercent,40);
assert.throws(()=>claudeAccount({context_window:{used_percentage:90}}));
assert.equal(allowedOrigin('https://evil.example'),false);assert.equal(allowedOrigin('https://ghdtjdalskr-svg.github.io'),true);
const dir=await mkdtemp(path.join(os.tmpdir(),'hani-budget-test-'));
try{
 await writeSummary(s,dir);assert.deepEqual(await readSummary(dir),s);assert.equal((await readFile(path.join(dir,'summary.json'),'utf8')).includes('secret'),false);
 let calls=0;const port=18894;const server=createBridge({dir,port,collect:async()=>{calls++;throw Error('failure');}});await new Promise(r=>server.listen(port,'127.0.0.1',r));
 try{
  const url=`http://127.0.0.1:${port}/api/ai-budget`,headers={Origin:'http://127.0.0.1:8795','X-Hani-Ai-Budget':'read-only-v1'};
  assert.equal((await fetch(url,{headers:{...headers,Origin:'https://evil.example'}})).status,403);
  assert.equal((await fetch(url,{headers:{Origin:headers.Origin}})).status,403);
  assert.equal((await fetch(url,{method:'POST',headers})).status,405);
  const result=await (await fetch(url,{headers})).json();assert.equal(result.accounts[0].windows[0].usedPercent,0);assert.equal(result.collectorStatus,'codex_read_failed');await fetch(url,{headers});assert.equal(calls,1);assert.deepEqual(await readSummary(dir),s);
 }finally{await new Promise(r=>server.close(r));}
}finally{await rm(dir,{recursive:true,force:true});}
console.log('PASS: allowlist, null/zero, stale/reset, account isolation, older-summary preservation, provider adapters, private persistence, origin/method/header guards, bounded failure retries.');
