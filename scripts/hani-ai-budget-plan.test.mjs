import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {importSummary,readSummary,writeSummary,claudeTranscriptAccount,collectAntigravity} from './hani-ai-budget-bridge.mjs';
const core=createRequire(import.meta.url)('../hani-ai-budget-core.js'),now=Date.now();
const raw=JSON.parse(await fs.readFile(new URL('./fixtures/hani-claude-plan-usage.json',import.meta.url),'utf8'));
const clean=core.normalizeImport(raw,now),claude=clean.accounts[0];
assert.deepEqual(core.normalizeImport(clean,now),clean,'normalized export can be re-imported');
assert.deepEqual(claude.windows.map(w=>w.kind),['weekly','session']);assert.equal(claude.source,'claude-plan-usage');
assert.equal(claude.observedAt,new Date(now).toISOString());assert.equal(claude.quotaObservation.observedAt,claude.observedAt);
const clone=()=>structuredClone(raw);
for(const mutate of [
 x=>x.accounts[0].windows[0].usedPercent='65',x=>x.accounts[0].windows[0].usedPercent=-1,
 x=>x.accounts[0].windows[0].usedPercent=101,x=>x.accounts[0].windows[0].usedPercent=null,
 x=>x.accounts[0].windows[0].id='daily',x=>x.accounts[0].windows[0].resetsAt='bad',
 x=>x.accounts[0].windows[0].resetsAt=null,x=>x.accounts[0].windows.push(x.accounts[0].windows[0]),
 x=>x.accounts[0].windows[1].id='weekly',x=>x.accounts[0].id='codex-1',x=>x.accounts[0].provider='antigravity',
 x=>x.accounts[0].observedAt=new Date(now+120000).toISOString(),x=>x.accounts[0].prompt='private',
 x=>x.accounts[0].windows[0].secret='private',x=>x.secret='private',x=>x.accounts.push(x.accounts[0])
]){const bad=clone();mutate(bad);assert.throws(()=>core.normalizeImport(bad,now));}
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'hani-plan-fixture-'));
try{
  const logs=claudeTranscriptAccount([{key:'mock',time:now-1000,inputTokens:1200,outputTokens:300}],null,now);
  await writeSummary({schemaVersion:1,accounts:[logs]},dir);
  const next=await importSummary(raw,{dir,now});assert.equal(next.accounts[0].windows[0].usedPercent,65);
  assert.deepEqual(core.normalizeImport(next,now),next,'full export with preserved transcripts remains importable');
  const freshLogs=claudeTranscriptAccount([{key:'mock',time:now,inputTokens:1500,outputTokens:400}],null,now+1000);
  const merged=core.merge(next,{schemaVersion:1,accounts:[freshLogs]},now+1000).accounts[0];
  assert.equal(merged.windows[0].usedPercent,65);assert.equal(merged.quotaObservation.observedAt,claude.observedAt);
  assert.equal(merged.transcriptUsage.fiveHours.inputTokens,1500,'new logs preserve imported plan observation');
  assert.equal(next.accounts[0].transcriptUsage.fiveHours.inputTokens,1200,'import preserves transcript');
  const before=await fs.readFile(path.join(dir,'summary.json'),'utf8'),bad=clone();bad.accounts[0].windows[0].usedPercent=101;
  await assert.rejects(importSummary(bad,{dir,now}));assert.equal(await fs.readFile(path.join(dir,'summary.json'),'utf8'),before);
  assert.deepEqual(await readSummary(dir),next);
  // Actual collector shape: weekly/session kind and usedPercent converted from remaining%.
  const collected=await collectAntigravity({dir,now:()=>now,read:()=>fs.readFile(new URL('./fixtures/hani-antigravity-usage.tsv',import.meta.url),'utf8')});
  assert.deepEqual(collected.accounts.map(a=>a.id),['gemini-pro','antigravity-cg']);
  for(const a of collected.accounts)assert.deepEqual(a.windows.map(w=>w.kind),['weekly','session']);
  const nodes=new Map(),storage=new Map([['hani_os_life_v23','sentinel']]),writes=[];
  const node=id=>nodes.get(id)||nodes.set(id,{innerHTML:'',textContent:'',value:'',classList:{contains:()=>true},handlers:{},addEventListener(t,fn){this.handlers[t]=fn;},focus(){}}).get(id);
  let payload={schemaVersion:1,accounts:[logs,...collected.accounts],collectorStatus:'ready'};
  const ctx=vm.createContext({window:{HaniAiBudgetCore:core},document:{getElementById:node,addEventListener(){}},localStorage:{getItem:k=>storage.get(k),setItem(k,v){writes.push(k);storage.set(k,v)}},setInterval(){},setTimeout,clearTimeout,AbortController,Intl,Date,fetch:async()=>({ok:true,text:async()=>JSON.stringify(payload)})});
  vm.runInContext(await fs.readFile(new URL('../hani-ai-budget.js',import.meta.url),'utf8'),ctx);
  await node('aiBudgetRefresh').handlers.click();
  const card=id=>node('aiBudgetCards').innerHTML.match(new RegExp('<article[^>]*data-budget-slot="'+id+'"[^]*?</article>'))[0];
  for(const text of ['사용 추정','최근 5시간','최근 7일','1,200','300','1턴','마지막 활동'])assert.ok(card('claude-1').includes(text),text);
  assert.doesNotMatch(card('claude-1'),/플랜 사용률 ·/);
  assert.match(card('gemini-pro'),/Gemini Pro \(Google AI Pro\)/);assert.match(card('antigravity-cg'),/Antigravity · Claude\/GPT/);
  for(const id of ['gemini-pro','antigravity-cg']){
    assert.match(card(id),/주간 한도/);assert.match(card(id),/5시간 한도/);assert.match(card(id),/KST/);
    for(const w of collected.accounts.find(a=>a.id===id).windows){assert.ok(card(id).includes('사용 '+w.usedPercent+'%'));assert.ok(card(id).includes(new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(w.resetsAt))));}
  }
  assert.doesNotMatch(node('aiBudgetCards').innerHTML,/data-budget-slot="gemini-cli"/);
  await node('aiBudgetImport').handlers.change({target:{files:[{size:500,text:async()=>JSON.stringify(raw)}],value:'fixture'}});
  assert.match(card('claude-1'),/플랜 사용률 · Claude 플랜 사용률 가져오기/);assert.match(card('claude-1'),/사용 65%/);assert.match(card('claude-1'),/사용 24%/);
  assert.ok(card('claude-1').includes(new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(claude.observedAt))));
  assert.equal(storage.get('hani_os_life_v23'),'sentinel');assert.ok(writes.every(k=>k==='hani_ai_budget_summary_v1'));
}finally{await fs.rm(dir,{recursive:true,force:true});}
console.log('PASS Claude minimal plan import: strict invalid fixtures, helper write/read-back, transcript preservation, collector window mapping, actual fallback/plan/Gemini UI, no life writes');
