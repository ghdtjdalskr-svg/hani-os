import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import os from 'node:os';import path from 'node:path';import vm from 'node:vm';
import {parseAntigravityUsage,findAntigravity,readAntigravity,collectAntigravity,collectSummary,createBridge,readSummary,writeSummary} from './hani-ai-budget-bridge.mjs';
const core=createRequire(import.meta.url)('../hani-ai-budget-core.js'),raw=await readFile(new URL('./fixtures/hani-antigravity-usage.tsv',import.meta.url),'utf8');
const HOUR=3600000,base=Date.parse('2026-10-10T18:00:00Z');
const parsed=parseAntigravityUsage(raw,base);assert.deepEqual(parsed.errors,[]);
assert.deepEqual(parsed.accounts.map(a=>[a.id,a.provider,a.source,a.windows.map(w=>[w.kind,w.usedPercent,w.resetsAt])]),[
 ['gemini-pro','antigravity','antigravity',[['weekly',1,'2026-10-11T06:30:26.000Z'],['session',1,'2026-10-10T20:24:04.000Z']]],
 ['antigravity-cg','antigravity','antigravity',[['weekly',0,'2026-10-17T15:25:59.000Z'],['session',0,'2026-10-10T20:25:59.000Z']]]
]);
assert.equal(core.windowState(parsed.accounts[0],parsed.accounts[0].windows[0],base+59*60000),'fresh');
assert.equal(core.windowState(parsed.accounts[0],parsed.accounts[0].windows[0],base+61*60000),'stale');
assert.equal(core.windowState(parsed.accounts[0],parsed.accounts[0].windows[1],Date.parse('2026-10-10T20:24:04Z')),'expired');
assert.deepEqual(parseAntigravityUsage('\x1b[32m'+raw.replaceAll('\n','\r\n')+'\x1b[0m',base),parsed);
assert.deepEqual(parseAntigravityUsage('header\nnull\nunknown\tWeekly Limit Remaining\t10%\t2026-10-11T00:00:00Z\n'+raw+'\n'+raw,base),parsed);
assert.equal(parseAntigravityUsage(raw.replace('99%','99.5%'),base).accounts[0].windows[0].usedPercent,.5);
for(const invalid of ['-1%','101%','99','NaN%','<img onerror=x>%'])assert.deepEqual(parseAntigravityUsage(raw.replace('99%',invalid),base).accounts.map(a=>a.id),['antigravity-cg']);
assert.equal(parseAntigravityUsage(raw.replace('2026-10-11T06:30:26Z','bad'),base).errors[0],'antigravity_usage_unavailable');
assert.throws(()=>parseAntigravityUsage(raw+'\n'+raw.split('\n')[0].replace('99%','50%'),base),/antigravity_usage_unavailable/);
assert.throws(()=>parseAntigravityUsage('Please sign in',base),/antigravity_login_required/);
assert.throws(()=>parseAntigravityUsage('header only',base),/antigravity_usage_unavailable/);
const env={LOCALAPPDATA:path.join(os.tmpdir(),'local-app'),PATH:path.join(os.tmpdir(),'path-bin')},preferred=path.join(env.LOCALAPPDATA,'agy','bin','agy.exe'),fallback=path.join(env.PATH,'agy.exe'),lookups=[];
assert.equal(await findAntigravity({env,access:async p=>{lookups.push(p);if(p!==preferred)throw Error();}}),preferred);assert.deepEqual(lookups,[preferred]);
assert.equal(await findAntigravity({env,access:async p=>{if(p!==fallback)throw Error();}}),fallback);
await assert.rejects(findAntigravity({env,access:async()=>{throw Error();}}),/antigravity_cli_not_found/);
function childFixture(action){const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.killed=false;child.kill=()=>{child.killed=true;};setImmediate(()=>action(child));return child;}
let spawned;
const output=await readAntigravity({find:async()=>preferred,spawnProcess:(entry,args,options)=>{assert.equal(entry,preferred);assert.deepEqual(args,['-p','/usage']);assert.equal(options.windowsHide,true);assert.equal(options.shell,false);spawned=childFixture(c=>{c.stderr.write('PRIVATE_LOGIN_OUTPUT');c.stdout.write(raw);c.emit('close',0);});return spawned;}});
assert.equal(output,raw);assert.equal(output.includes('PRIVATE_'),false);assert.equal(spawned.killed,false);
await assert.rejects(readAntigravity({find:async()=>preferred,spawnProcess:()=>childFixture(c=>c.emit('error',{code:'ENOENT'}))}),/antigravity_cli_not_found/);
await assert.rejects(readAntigravity({find:async()=>preferred,spawnProcess:()=>childFixture(c=>{c.stdout.write('Not logged in');c.emit('close',1);})}),/antigravity_login_required/);
await assert.rejects(readAntigravity({find:async()=>preferred,spawnProcess:()=>childFixture(c=>c.emit('close',1))}),/antigravity_usage_unavailable/);
let timedChild;await assert.rejects(readAntigravity({find:async()=>preferred,timeoutMs:5,spawnProcess:()=>timedChild=childFixture(()=>{})}),/antigravity_timeout/);assert.equal(timedChild.killed,true);
await assert.rejects(readAntigravity({find:async()=>preferred,spawnProcess:()=>childFixture(c=>c.stdout.write('x'.repeat(65537)))}),/antigravity_usage_unavailable/);
const dir=await mkdtemp(path.join(os.tmpdir(),'hani-agy-'));
try{
 let time=Date.now()-4*HOUR,calls=0;const now=()=>time,read=async()=>{calls++;return raw;};
 const [first,concurrent]=await Promise.all([collectAntigravity({dir,read,now}),collectAntigravity({dir,read,now})]);assert.deepEqual(first,concurrent);assert.equal(calls,1);
 const seen=first.accounts[0].observedAt;time+=HOUR-1;
 assert.deepEqual(await collectAntigravity({dir,read,now}),first);assert.equal(calls,1);assert.equal(first.accounts[0].observedAt,seen);
 time++;assert.equal((await collectAntigravity({dir,read,now})).errors.length,0);assert.equal(calls,2);
 time+=HOUR;const failed=await collectAntigravity({dir,now,read:async()=>{calls++;throw Error('antigravity_login_required');}});
 assert.equal(failed.accounts.length,2);assert.deepEqual(failed.errors,['antigravity_login_required']);assert.equal(calls,3);
 assert.deepEqual(await collectAntigravity({dir,read,now}),failed);assert.equal(calls,3);
 const cache=JSON.parse(await readFile(path.join(dir,'antigravity-cache.json'),'utf8'));assert.equal(JSON.stringify(cache).includes('Gemini Models'),false);assert.equal(JSON.stringify(cache).includes('PRIVATE_'),false);
 // Independent clock/state instance reads persisted throttle; an exclusive lock blocks another process.
 time+=HOUR;await writeFile(path.join(dir,'antigravity.lock'),'');assert.deepEqual((await collectAntigravity({dir,read,now})).errors,['antigravity_pending']);
 assert.equal(calls,3);await rm(path.join(dir,'antigravity.lock'));
 const current=parseAntigravityUsage(raw),summary={schemaVersion:1,accounts:current.accounts};await writeSummary(summary,dir);
 const collected=await collectSummary({dir,collect:async()=>{throw Error();},localCollect:async()=>({accounts:[],errors:[]}),antigravityCollect:async()=>current});assert.deepEqual(collected.summary,summary);
 const partial=parseAntigravityUsage(raw.replace('99%','bad'),Date.parse(current.accounts[0].observedAt));
 const incomplete=await collectSummary({dir,collect:async()=>{throw Error();},localCollect:async()=>({accounts:[],errors:[]}),antigravityCollect:async()=>partial});assert.deepEqual(incomplete.summary.accounts.find(a=>a.id==='gemini-pro'),summary.accounts.find(a=>a.id==='gemini-pro'));
 const preserved=await collectSummary({dir,collect:async()=>{throw Error();},localCollect:async()=>({accounts:[],errors:[]}),antigravityCollect:async()=>({accounts:[],errors:['antigravity_cli_not_found']})});assert.deepEqual(preserved.summary,summary);assert.match(preserved.collectorStatus,/antigravity_cli_not_found/);
 const server=createBridge({dir,port:18896,collect:async()=>{throw Error();},localCollect:async()=>({accounts:[],errors:[]}),antigravityCollect:async()=>current});await new Promise(r=>server.listen(18896,'127.0.0.1',r));
 try{const response=await fetch('http://127.0.0.1:18896/api/ai-budget',{headers:{Origin:'http://127.0.0.1:8795','X-Hani-Ai-Budget':'read-only-v1'}}),payload=await response.json();assert.deepEqual(payload.accounts,summary.accounts);assert.equal(payload.collectorStatus,'codex_read_failed');}finally{await new Promise(r=>server.close(r));}
 assert.deepEqual(await readSummary(dir),summary);
}finally{await rm(dir,{recursive:true,force:true});}
// Run the actual renderer/events with isolated storage and TSV-derived bridge data.
const nodes=new Map(),storage=new Map([['hani_os_life_v23','UNCHANGED']]);
function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,classList:{contains:()=>true},handlers:{},addEventListener(k,fn){this.handlers[k]=fn;},focus(){}});return nodes.get(id);}
let payload={schemaVersion:1,accounts:parseAntigravityUsage(raw).accounts,collectorStatus:'ready'};
const context=vm.createContext({window:{HaniAiBudgetCore:core},document:{getElementById:node,addEventListener(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem(k,v){assert.equal(k,'hani_ai_budget_summary_v1');storage.set(k,v);}},Intl,Date,setInterval(){},setTimeout,clearTimeout,AbortController,fetch:async()=>({ok:true,text:async()=>JSON.stringify(payload)})});
vm.runInContext(await readFile(new URL('../hani-ai-budget.js',import.meta.url),'utf8'),context);
const card=id=>node('aiBudgetCards').innerHTML.match(new RegExp(`<article[^>]*data-budget-slot="${id}"[\\s\\S]*?</article>`))[0];
assert.match(card('gemini-pro'),/로그인/);await node('aiBudgetRefresh').handlers.click();
assert.equal((node('aiBudgetCards').innerHTML.match(/data-budget-slot=/g)||[]).length,6);
assert.match(card('gemini-pro'),/Google AI Pro/);assert.match(card('gemini-pro'),/99%/);assert.match(card('gemini-pro'),/5시간 한도/);assert.match(card('antigravity-cg'),/Antigravity · Claude\/GPT/);assert.match(card('antigravity-cg'),/100%/);assert.match(card('gemini-cli'),/보조/);
const date=v=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v));
assert.ok(card('gemini-pro').includes(date('2026-10-11T06:30:26Z')));assert.match(card('gemini-pro'),/KST/);
payload.accounts[0].observedAt=new Date().toISOString();payload.accounts[0].windows[1].resetsAt=new Date(Date.now()-HOUR).toISOString();await node('aiBudgetRefresh').handlers.click();
assert.match(card('gemini-pro'),/expired/);assert.match(card('gemini-pro'),/99%/); // A past reset never fabricates full quota.
const before=storage.get('hani_ai_budget_summary_v1');
for(const [status,hint] of [['antigravity_cli_not_found',/찾지 못했습니다/],['antigravity_login_required',/로그인하면/],['antigravity_timeout',/늦어졌습니다/]]){
 payload={schemaVersion:1,accounts:[],collectorStatus:status};await node('aiBudgetRefresh').handlers.click();assert.match(card('gemini-pro'),hint);assert.match(card('antigravity-cg'),hint);assert.match(card('gemini-pro'),/99%/);assert.equal(storage.get('hani_ai_budget_summary_v1'),before);
}
payload={schemaVersion:1,accounts:parseAntigravityUsage(raw).accounts};payload.accounts[0].prompt='<img onerror=x>';
await node('aiBudgetRefresh').handlers.click();assert.equal(node('aiBudgetCards').innerHTML.includes('onerror'),false);assert.equal(storage.get('hani_os_life_v23'),'UNCHANGED');
console.log('PASS: Antigravity TSV, executable discovery/spawn/timeout, persisted hourly limit/failure preservation, bridge endpoint, six-card renderer/KST/hints/life-key safety.');
