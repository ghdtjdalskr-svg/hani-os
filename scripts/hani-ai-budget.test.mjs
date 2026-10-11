import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {mkdtemp,rm,readFile,mkdir,writeFile,utimes} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {assignCodexSlot,codexAccount,claudeAccount,writeSummary,readSummary,allowedOrigin,createBridge as bridgeCreate,parseClaudeTranscript,parseGeminiLog,claudeTranscriptAccount,geminiLogAccount,pacificDay,collectLocalUsage,collectSummary as bridgeCollect} from './hani-ai-budget-bridge.mjs';
// Existing regression fixtures must never spawn installed account CLIs.
const antigravityCollect=async()=>({accounts:[],errors:[]}),collectSummary=options=>bridgeCollect({...options,antigravityCollect}),createBridge=options=>bridgeCreate({...options,antigravityCollect});
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
const HOUR=3600000,DAY=24*HOUR,at=delta=>new Date(now+delta).toISOString();
const claudeLine=(id,delta,input=10,output=5)=>JSON.stringify({type:'assistant',timestamp:at(delta),message:{id,role:'assistant',content:[{text:'PRIVATE_PROMPT_NEVER_RETAIN'}],usage:{input_tokens:input,cache_creation_input_tokens:2,cache_read_input_tokens:3,output_tokens:output}},cwd:'PRIVATE_PATH'});
const transcript=[claudeLine('recent',-HOUR),claudeLine('five-edge',-5*HOUR),claudeLine('outside-five',-5*HOUR-1),claudeLine('week-edge',-7*DAY),claudeLine('outside-week',-7*DAY-1),claudeLine('too-old',-8*DAY-1),claudeLine('future',1),'{bad', 'null',JSON.stringify({type:'user',timestamp:at(0),message:{usage:{input_tokens:999,output_tokens:999}}}),claudeLine('negative',0,-1),claudeLine('string',0,'10'),claudeLine('recent',-HOUR)].join('\n');
const events=parseClaudeTranscript(transcript,now),transcriptAccount=claudeTranscriptAccount(events,null,now);
assert.deepEqual(transcriptAccount.transcriptUsage.fiveHours,{inputTokens:30,outputTokens:10,assistantTurns:2});
assert.deepEqual(transcriptAccount.transcriptUsage.sevenDays,{inputTokens:60,outputTokens:20,assistantTurns:4});
assert.equal(transcriptAccount.transcriptUsage.lastActivityAt,at(-HOUR));assert.equal(transcriptAccount.windows.length,0);
assert.equal(JSON.stringify(events).includes('PRIVATE_'),false);assert.equal(JSON.stringify(transcriptAccount).includes('PRIVATE_'),false);
const manual=core.normalizeAccount({id:'claude-1',provider:'claude',source:'manual',observedAt:at(-HOUR),windows:[{kind:'session',usedPercent:40,resetsAt:at(HOUR)}]});
const combined=claudeTranscriptAccount(events,manual,now);
assert.equal(combined.windows[0].usedPercent,40);assert.equal(core.windowState(combined,combined.windows[0],now),'stale');assert.equal(combined.quotaObservation.observedAt,at(-HOUR));
const laterManual=core.merge({schemaVersion:1,accounts:[combined]},{schemaVersion:1,accounts:[{...manual,observedAt,windows:[{kind:'weekly',usedPercent:60,resetsAt:at(DAY)}]}]});
assert.deepEqual(laterManual.accounts[0].transcriptUsage,combined.transcriptUsage);
const freshLogs=claudeTranscriptAccount(events,null,now+1000);
const refreshed=core.merge(laterManual,{schemaVersion:1,accounts:[freshLogs]},now+1000).accounts[0];
assert.equal(refreshed.windows[0].usedPercent,60);assert.equal(refreshed.quotaObservation.observedAt,observedAt);
assert.equal(refreshed.transcriptUsage.observedAt,at(1000));
const staleQuota=claudeTranscriptAccount(events,manual,now+2000);
assert.equal(core.merge({schemaVersion:1,accounts:[refreshed]},{schemaVersion:1,accounts:[staleQuota]},now+2000).accounts[0].windows[0].usedPercent,60);
const newestQuota=claudeAccount({rate_limits:{five_hour:{used_percentage:15,resets_at:Math.floor((now+HOUR)/1000)}}},at(3000));
const quotaMerged=core.merge({schemaVersion:1,accounts:[refreshed]},{schemaVersion:1,accounts:[newestQuota]},now+3000).accounts[0];
assert.equal(quotaMerged.windows[0].usedPercent,15);assert.equal(quotaMerged.transcriptUsage.observedAt,at(1000));
assert.equal(core.normalizeAccount({...freshLogs,windows:[{kind:'session',usedPercent:99,resetsAt:null}]},now+1000).windows.length,0);
const maxima=claudeTranscriptAccount(events,{...combined,transcriptUsage:{...combined.transcriptUsage,dailyMaxima:[{day:at(-28*DAY).slice(0,10),maxTokens:99999},{day:at(-10*DAY).slice(0,10),maxTokens:300}]}},now);
assert.equal(maxima.transcriptUsage.fourWeekMaxFiveHourTokens,300);assert.equal(maxima.transcriptUsage.dailyMaxima.some(d=>d.maxTokens===99999),false);
const historical=parseClaudeTranscript([claudeLine('personal-peak',-20*DAY,1000,200),claudeLine('expired-peak',-29*DAY,99999,99999)].join('\n'),now);
assert.equal(historical.length,1);const firstScan=claudeTranscriptAccount([...events,...historical],null,now);
assert.equal(firstScan.transcriptUsage.fourWeekMaxFiveHourTokens,1205);assert.deepEqual(firstScan.transcriptUsage.sevenDays,transcriptAccount.transcriptUsage.sevenDays);
const updated=claudeTranscriptAccount([...events, ...parseClaudeTranscript(claudeLine('recent',-HOUR,10,8),now)],null,now);
assert.equal(updated.transcriptUsage.fiveHours.assistantTurns,2);assert.equal(updated.transcriptUsage.fiveHours.outputTokens,13);
for(const [instant,start,end] of [
 ['2026-01-15T20:00:00Z','2026-01-15T08:00:00.000Z','2026-01-16T08:00:00.000Z'],
 ['2026-07-15T20:00:00Z','2026-07-15T07:00:00.000Z','2026-07-16T07:00:00.000Z'],
 ['2026-03-08T12:00:00Z','2026-03-08T08:00:00.000Z','2026-03-09T07:00:00.000Z'],
 ['2026-11-01T12:00:00Z','2026-11-01T07:00:00.000Z','2026-11-02T08:00:00.000Z']])assert.deepEqual(pacificDay(Date.parse(instant)),{dayStartsAt:start,resetsAt:end});
const day=pacificDay(now),start=Date.parse(day.dayStartsAt);
const userLine=time=>JSON.stringify({id:'x',type:'user',timestamp:new Date(time).toISOString(),content:'PRIVATE_PROMPT_NEVER_RETAIN'});
const geminiRaw=[userLine(now),userLine(start),userLine(start-1),userLine(now-7*DAY),userLine(now-7*DAY-1),userLine(now-8*DAY-1),userLine(now+1),'{broken','null',JSON.stringify({type:'gemini',timestamp:observedAt,content:'PRIVATE_RESPONSE'})].join('\n');
const geminiEvents=parseGeminiLog(geminiRaw,now),gemini=geminiLogAccount(geminiEvents,now);
assert.equal(gemini.cliUsage.today,2);assert.equal(gemini.cliUsage.sevenDays,4);assert.equal(gemini.windows[0].usedPercent,10);assert.equal(gemini.cliUsage.lastRequestAt,observedAt);assert.equal(JSON.stringify(geminiEvents).includes('PRIVATE_'),false);
assert.equal(parseGeminiLog(JSON.stringify([{type:'user',timestamp:observedAt,message:'PRIVATE_LOG_TEXT'},{type:'assistant',timestamp:observedAt}]),now).length,1);
assert.equal(parseGeminiLog(JSON.stringify({messages:[{role:'user',timestamp:observedAt,text:'PRIVATE_LOG_TEXT'}]}),now).length,1);
assert.equal(pacificDay(start).dayStartsAt,day.dayStartsAt);
assert.equal(geminiLogAccount([{time:start-1},{time:start}],start).cliUsage.today,1);
assert.equal(geminiLogAccount(Array.from({length:21},()=>({time:now})),now).windows[0].usedPercent,100);
assert.equal(core.normalizeAccount({...gemini,cliUsage:{...gemini.cliUsage,content:'PRIVATE_',dailyCap:100}}).cliUsage.dailyCap,20);
const legacy=core.normalizeAccount({id:'gemini-1',provider:'gemini',source:'manual',observedAt,windows:[]});assert.equal(legacy.id,'gemini-1');
assert.equal(core.merge({schemaVersion:1,accounts:[legacy]},{schemaVersion:1,accounts:[gemini]}).accounts.length,1);
const dir=await mkdtemp(path.join(os.tmpdir(),'hani-budget-test-'));
try{
 const home=path.join(dir,'fixture-home'),claudeDir=path.join(home,'.claude','projects','project','subagents'),geminiDir=path.join(home,'.gemini','tmp','project','chats');
 await mkdir(claudeDir,{recursive:true});await mkdir(geminiDir,{recursive:true});
 const claudeFile=path.join(claudeDir,'session.jsonl'),geminiFile=path.join(geminiDir,'session-fixture.jsonl');
 await writeFile(claudeFile,transcript);await writeFile(geminiFile,geminiRaw);await writeFile(path.join(geminiDir,'..','logs.json'),JSON.stringify([{type:'user',timestamp:observedAt,message:'PRIVATE_LOG_TEXT'}]));
 const oldFile=path.join(claudeDir,'old.jsonl');await writeFile(oldFile,claudeLine('ignored-mtime',0,500));await utimes(oldFile,new Date(now-9*DAY),new Date(now-9*DAY));
 const emptyFile=path.join(claudeDir,'empty.jsonl');await writeFile(emptyFile,'');await utimes(emptyFile,new Date(now+1000),new Date(now+1000));
 const localCollect=summary=>collectLocalUsage(summary,{home,now}),local=await localCollect(s);
 assert.deepEqual(local.errors,[]);assert.equal(local.accounts[0].transcriptUsage.fiveHours.assistantTurns,2);assert.equal(local.accounts[1].cliUsage.today,2);
 assert.equal(local.accounts[0].transcriptUsage.limited,false);
 const otherGeminiDir=path.join(home,'.gemini','tmp','other-project','chats');await mkdir(otherGeminiDir,{recursive:true});await writeFile(path.join(otherGeminiDir,'session-other.jsonl'),userLine(now));
 assert.equal((await localCollect(s)).accounts[1].cliUsage.today,3);
 await rm(path.join(home,'.gemini','tmp','other-project'),{recursive:true,force:true});
 const capped=await collectLocalUsage(s,{home,now,maxFileBytes:50,maxTotalBytes:100});assert.equal(capped.accounts[0].transcriptUsage.limited,true);assert.equal(capped.accounts[1].cliUsage.limited,true);
 const cappedFiles=await collectLocalUsage(s,{home,now,maxFiles:0});assert.equal(cappedFiles.accounts[0].transcriptUsage.limited,true);
 const beforeLogs=await readFile(claudeFile,'utf8');
 await writeSummary(s,dir);assert.deepEqual(await readSummary(dir),s);assert.equal((await readFile(path.join(dir,'summary.json'),'utf8')).includes('secret'),false);
 const collected=await collectSummary({dir,collect:async()=>{throw Error('failure');},localCollect});assert.equal(collected.summary.accounts.length,3);assert.equal(collected.collectorStatus,'codex_read_failed');assert.equal(await readFile(claudeFile,'utf8'),beforeLogs);assert.equal((await readFile(path.join(dir,'summary.json'),'utf8')).includes('PRIVATE_'),false);
 let calls=0;const port=18894;const server=createBridge({dir,port,localCollect,collect:async()=>{calls++;throw Error('failure');}});await new Promise(r=>server.listen(port,'127.0.0.1',r));
 try{
  const url=`http://127.0.0.1:${port}/api/ai-budget`,headers={Origin:'http://127.0.0.1:8795','X-Hani-Ai-Budget':'read-only-v1'};
  assert.equal((await fetch(url,{headers:{...headers,Origin:'https://evil.example'}})).status,403);
  assert.equal((await fetch(url,{headers:{Origin:headers.Origin}})).status,403);
  assert.equal((await fetch(url,{method:'POST',headers})).status,405);
  const result=await (await fetch(url,{headers})).json();assert.equal(result.accounts[0].windows[0].usedPercent,0);assert.equal(result.collectorStatus,'codex_read_failed');assert.equal(result.accounts.find(a=>a.id==='claude-1').transcriptUsage.fiveHours.assistantTurns,2);assert.equal(result.accounts.find(a=>a.id==='gemini-cli').cliUsage.today,2);await fetch(url,{headers});assert.equal(calls,1);assert.deepEqual(await readSummary(dir),collected.summary);
 }finally{await new Promise(r=>server.close(r));}
 const failed=await collectSummary({dir,collect:async()=>{throw Error('failure');},localCollect:async()=>{throw Error('fixture read failure');}});assert.deepEqual(failed.summary,collected.summary);assert.equal(failed.collectorStatus,'codex_read_failed,local_logs_unavailable');
 const duringCollect=await collectSummary({dir,collect:async()=>{throw Error('failure');},localCollect:async summary=>{
  const result=await localCollect(summary),quota=claudeAccount({rate_limits:{five_hour:{used_percentage:35,resets_at:Math.floor((now+HOUR)/1000)}}});
  await writeSummary(core.merge(await readSummary(dir),{schemaVersion:1,accounts:[quota]}),dir);return result;
 }});
 const concurrentClaude=duringCollect.summary.accounts.find(a=>a.id==='claude-1');assert.equal(concurrentClaude.windows[0].usedPercent,35);assert.equal(concurrentClaude.transcriptUsage.fiveHours.assistantTurns,2);
}finally{await rm(dir,{recursive:true,force:true});}

// Execute the actual UI renderer and its registered handlers without a browser process.
// This verifies HTML output and data effects; layout/real DOM remain the browser test's responsibility.
const nodes=new Map(),storage=new Map([['hani_os_life_v23','LIFE_FIXTURE_UNCHANGED']]),writes=[];
function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,classList:{contains:()=>true},handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},focus(){}});return nodes.get(id);}
const ui=vm.createContext({window:{HaniAiBudgetCore:core},document:{getElementById:node,addEventListener(){}},localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){writes.push(key);storage.set(key,value);}},setInterval(){},setTimeout,clearTimeout,AbortController,Intl,Date,console,fetch:async()=>({ok:true,text:async()=>JSON.stringify(uiPayload)})});
let uiPayload={schemaVersion:1,accounts:[transcriptAccount,gemini],collectorStatus:'ready'};
uiPayload.accounts[0].transcriptUsage.fourWeekMaxFiveHourTokens=80;
vm.runInContext(await readFile(new URL('../hani-ai-budget.js',import.meta.url),'utf8'),ui);
assert.match(node('aiBudgetCards').innerHTML,/Codex 주력/);assert.match(node('aiBudgetCards').innerHTML,/Codex 보조/);
await node('aiBudgetRefresh').handlers.click();
const card=id=>node('aiBudgetCards').innerHTML.match(new RegExp(`<article[^>]*data-budget-slot="${id}"[\\s\\S]*?</article>`))[0];
assert.match(card('claude-1'),/최근 5시간/);assert.match(card('claude-1'),/입력 \+ 캐시 <strong>30<\/strong> 토큰 · 출력 <strong>10<\/strong>/);
assert.match(card('claude-1'),/최근 7일/);assert.match(card('claude-1'),/응답 2회/);assert.match(card('claude-1'),/width:50%/);
assert.match(card('claude-1'),/aria-valuemax="80"/);assert.equal(card('claude-1').includes('budget-value'),false);
assert.equal(node('aiBudgetCards').innerHTML.includes('data-budget-slot="gemini-cli"'),false,'CLI data remains compatible but is hidden');
assert.match(card('claude-1'),/사용 추정/);
node('aiBudgetAccount').value='claude-1';node('budget-session-used').value='25';node('budget-session-reset').value='';
node('aiBudgetForm').handlers.submit({preventDefault(){}});
assert.match(card('claude-1'),/75%/);assert.match(card('claude-1'),/플랜 사용률/);assert.equal(JSON.parse(storage.get('hani_ai_budget_summary_v1')).accounts.find(a=>a.id==='claude-1').transcriptUsage.fiveHours.assistantTurns,2);
const later=Date.now();uiPayload={schemaVersion:1,accounts:[claudeTranscriptAccount(events,null,later),geminiLogAccount(geminiEvents,later)]};
await node('aiBudgetRefresh').handlers.click();assert.match(card('claude-1'),/75%/);assert.match(card('claude-1'),/직접 기록/);
const injected='<img src=x onerror=window.budgetInjected=true>';
uiPayload.accounts[0].transcriptUsage.prompt=injected;uiPayload.accounts[0].transcriptUsage.fiveHours.inputTokens=injected;
await node('aiBudgetImport').handlers.change({target:{files:[{size:1000,text:async()=>JSON.stringify(uiPayload)}],value:'fixture'}});
assert.equal(node('aiBudgetCards').innerHTML.includes('onerror'),false);assert.equal(storage.get('hani_ai_budget_summary_v1').includes('onerror'),false);
assert.equal(storage.get('hani_os_life_v23'),'LIFE_FIXTURE_UNCHANGED');assert.ok(writes.every(key=>key==='hani_ai_budget_summary_v1'));
console.log('PASS: parsers/windows/DST/reset, bounded read-only log collection, no text retained, manual/statusline preservation, bridge refresh/guards/failure preservation, actual UI renderer and handlers (browser layout not covered).');
