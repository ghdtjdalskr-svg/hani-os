import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),core=require('../hani-ai-budget-core.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const privateDir=process.env.HANI_AI_BUDGET_DIR||path.join(root,'.ai-budget-private');
const hash=s=>createHash('sha256').update(s).digest('hex');
export async function readSummary(dir=privateDir){try{return core.normalize(JSON.parse(await fs.readFile(path.join(dir,'summary.json'),'utf8')));}catch(e){if(e.code==='ENOENT')return {schemaVersion:1,accounts:[]};throw Error('private_summary_invalid');}}
export async function writeSummary(summary,dir=privateDir){
  const clean=core.normalize(summary);await fs.mkdir(dir,{recursive:true,mode:0o700});
  const target=path.join(dir,'summary.json'),temp=path.join(dir,randomUUID()+'.tmp');
  try{await fs.writeFile(temp,JSON.stringify(clean,null,2),{mode:0o600,flag:'wx'});await fs.rename(temp,target);}finally{await fs.rm(temp,{force:true});}
}
export async function importSummary(raw,{dir=privateDir,now=Date.now()}={}){
  const clean=core.normalizeImport(raw,now),summary=await readSummary(dir);
  const next=core.merge(summary,clean,now);await writeSummary(next,dir);return next;
}
export function assignCodexSlot(summary,fingerprint){
  if(!/^[a-f0-9]{64}$/.test(fingerprint))throw Error('identity_unavailable');
  const match=summary.accounts.find(a=>a.provider==='codex'&&a.fingerprint===fingerprint);if(match)return match.id;
  const free=core.slots.find(s=>s.provider==='codex'&&!summary.accounts.some(a=>a.id===s.id));
  if(!free)throw Error('codex_slots_full');return free.id;
}
export function codexAccount(id,payload,fingerprint,observedAt=new Date().toISOString()){
  const buckets=payload.rateLimitsByLimitId;
  const limit=buckets?buckets.codex:Object.hasOwn(payload,'rateLimits')?payload.rateLimits:null;
  if(!limit)throw Error('codex_limits_unavailable');
  const windows=[limit.primary,limit.secondary].filter(Boolean).map(w=>({kind:w.windowDurationMins===10080?'weekly':w.windowDurationMins===1440?'daily':w.windowDurationMins===300?'session':'other',usedPercent:w.usedPercent??null,resetsAt:Number.isFinite(w.resetsAt)?new Date(w.resetsAt*1000).toISOString():null}));
  if(!windows.length)throw Error('codex_limits_unavailable');
  return core.normalizeAccount({id,provider:'codex',observedAt,source:'codex-app-server',fingerprint,windows});
}
export function claudeAccount(input,observedAt=new Date().toISOString()){
  const r=input.rate_limits,windows=[];
  for(const [key,kind] of [['five_hour','session'],['seven_day','weekly']])if(r?.[key])windows.push({kind,usedPercent:r[key].used_percentage??null,resetsAt:Number.isFinite(r[key].resets_at)?new Date(r[key].resets_at*1000).toISOString():null});
  if(!windows.length)throw Error('claude_limits_unavailable');
  return core.normalizeAccount({id:'claude-1',provider:'claude',observedAt,source:'claude-statusline',windows});
}
const HOUR=3600000,DAY=24*HOUR;
const antigravityErrors=['antigravity_cli_not_found','antigravity_login_required','antigravity_timeout','antigravity_usage_unavailable','antigravity_pending'];
export function parseAntigravityUsage(raw,now=Date.now()){
  const groups=new Map([['Gemini Models',{id:'gemini-pro',windows:[]}],['Claude and GPT models',{id:'antigravity-cg',windows:[]}]]);
  for(const line of raw.replace(/\x1b\[[0-9;]*m/g,'').split(/\r?\n/)){
    const fields=line.split('\t').map(v=>v.trim());if(fields.length!==4)continue;
    const [group,label,remaining,reset]=fields,account=groups.get(group);
    const kind=label==='Weekly Limit Remaining'?'weekly':label==='Five Hour Limit Remaining'?'session':null;
    if(!account||!kind||!/^\d+(?:\.\d+)?%$/.test(remaining))continue;
    const percent=core.percent(Number(remaining.slice(0,-1))),resetsAt=core.stamp(reset);
    if(percent===null||!resetsAt)continue;
    // Conflicting duplicate rows are not reliable usage observations.
    const old=account.windows.find(w=>w.kind===kind),usedPercent=100-percent;
    if(old){if(old.usedPercent!==usedPercent||old.resetsAt!==resetsAt)throw Error('antigravity_usage_unavailable');continue;}
    account.windows.push({kind,usedPercent,resetsAt});
  }
  // An incomplete group cannot replace a previously complete account observation.
  const accounts=[...groups.values()].filter(a=>a.windows.length===2).map(a=>core.normalizeAccount({...a,provider:'antigravity',source:'antigravity',observedAt:new Date(now).toISOString()},now));
  if(!accounts.length)throw Error(/(?:not\s+(?:logged|signed)\s+in|unauthenticated|login\s+required|please\s+(?:log|sign)\s+in)/i.test(raw)?'antigravity_login_required':'antigravity_usage_unavailable');
  return {accounts,errors:accounts.length===2&&accounts.every(a=>a.windows.length===2)?[]:['antigravity_usage_unavailable']};
}
export async function findAntigravity({env=process.env,access=fs.access}={}){
  const candidates=[];
  if(env.LOCALAPPDATA)candidates.push(path.join(env.LOCALAPPDATA,'agy','bin','agy.exe'));
  for(const folder of (env.PATH||env.Path||'').split(path.delimiter).filter(Boolean))candidates.push(path.join(folder.replace(/^"|"$/g,''),'agy.exe'));
  for(const file of candidates)try{await access(file);return file;}catch{}
  throw Error('antigravity_cli_not_found');
}
export async function readAntigravity({find=findAntigravity,spawnProcess=spawn,timeoutMs=60000}={}){
  const entry=await find();
  return new Promise((resolve,reject)=>{
    let child,output='',ended=false,timer;
    const finish=(error)=>{if(ended)return;ended=true;clearTimeout(timer);if(error){child?.kill();reject(Error(error));}else resolve(output);};
    try{child=spawnProcess(entry,['-p','/usage'],{cwd:os.tmpdir(),windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});}catch{finish('antigravity_usage_unavailable');return;}
    timer=setTimeout(()=>finish('antigravity_timeout'),Math.min(60000,timeoutMs));
    child.on('error',e=>finish(e.code==='ENOENT'?'antigravity_cli_not_found':'antigravity_usage_unavailable'));
    child.stdout.on('data',chunk=>{output+=chunk.toString('utf8');if(Buffer.byteLength(output)>65536)finish('antigravity_usage_unavailable');});
    // Never store or print stderr: login output can contain sensitive details.
    child.stderr.resume();
    child.on('close',code=>finish(code===0?null:/(?:not\s+(?:logged|signed)\s+in|unauthenticated|login\s+required|please\s+(?:log|sign)\s+in)/i.test(output)?'antigravity_login_required':'antigravity_usage_unavailable'));
  });
}
const antigravityFlights=new Map();
export async function collectAntigravity({dir=privateDir,read=readAntigravity,now=Date.now}={}){
  const key=path.resolve(dir);if(antigravityFlights.has(key))return antigravityFlights.get(key);
  const flight=(async()=>{
    await fs.mkdir(dir,{recursive:true,mode:0o700});
    const cacheFile=path.join(dir,'antigravity-cache.json'),lockFile=path.join(dir,'antigravity.lock');
    const cached=async()=>{try{
      const raw=JSON.parse(await fs.readFile(cacheFile,'utf8'));
      return {attemptedAt:core.stamp(raw.attemptedAt),accounts:core.normalize({schemaVersion:1,accounts:raw.accounts},now()).accounts.filter(a=>a.source==='antigravity'),errors:(raw.errors||[]).filter(e=>antigravityErrors.includes(e))};
    }catch{return {attemptedAt:null,accounts:[],errors:[]};}};
    let previous=await cached(),lock;
    if(previous.attemptedAt&&now()-Date.parse(previous.attemptedAt)<HOUR)return {accounts:previous.accounts,errors:previous.errors};
    try{lock=await fs.open(lockFile,'wx',0o600);}catch(e){
      if(e.code!=='EEXIST')throw e;
      // A crashed process may leave a lock. Leave it quiet until its hour expires.
      const stat=await fs.stat(lockFile).catch(()=>null);
      if(stat&&now()-stat.mtimeMs>=HOUR){await fs.rm(lockFile,{force:true});return {accounts:previous.accounts,errors:['antigravity_pending']};}
      return {accounts:previous.accounts,errors:['antigravity_pending']};
    }
    const storeCache=async value=>{const temp=path.join(dir,randomUUID()+'.tmp');try{await fs.writeFile(temp,JSON.stringify(value),{flag:'wx',mode:0o600});await fs.rename(temp,cacheFile);}finally{await fs.rm(temp,{force:true});}};
    try{
      previous=await cached();if(previous.attemptedAt&&now()-Date.parse(previous.attemptedAt)<HOUR)return {accounts:previous.accounts,errors:previous.errors};
      const attemptedAt=new Date(now()).toISOString();
      // Reserve the attempt before spawning: restarts and failures share the hourly limit.
      let result={attemptedAt,accounts:previous.accounts,errors:['antigravity_pending']};await storeCache(result);
      try{const parsed=parseAntigravityUsage(await read(),now());result={attemptedAt,accounts:core.merge({schemaVersion:1,accounts:previous.accounts},{schemaVersion:1,accounts:parsed.accounts},now()).accounts,errors:parsed.errors};}
      catch(e){result={attemptedAt,accounts:previous.accounts,errors:[antigravityErrors.includes(e.message)?e.message:'antigravity_usage_unavailable']};}
      await storeCache(result);return {accounts:result.accounts,errors:result.errors};
    }finally{await lock.close();await fs.rm(lockFile,{force:true});}
  })();
  antigravityFlights.set(key,flight);try{return await flight;}finally{antigravityFlights.delete(key);}
}
// These parsers retain only counts, timestamps and ephemeral deduplication IDs.
const eventTime=(value,now,maxAge=8*DAY)=>{const iso=core.stamp(value),time=iso?Date.parse(iso):NaN;return time>=now-maxAge&&time<=now?time:null;};
function jsonLines(raw){return raw.split('\n').flatMap(line=>{try{const row=JSON.parse(line);return row&&typeof row==='object'?[row]:[];}catch{return [];}});}
export function parseClaudeTranscript(raw,now=Date.now()){
  const events=[];
  for(const row of jsonLines(raw)){
    if(row.type!=='assistant'||row.message?.role&&row.message.role!=='assistant')continue;
    // Recent files may also contain older turns needed for the personal four-week peak.
    const time=eventTime(row.timestamp,now,28*DAY),u=row.message?.usage;if(time===null||!u||typeof u!=='object')continue;
    const values=['input_tokens','cache_creation_input_tokens','cache_read_input_tokens','output_tokens'].map(k=>u[k]??0);
    if(!values.every(n=>Number.isSafeInteger(n)&&n>=0)||!Object.hasOwn(u,'output_tokens'))continue;
    const inputTokens=values[0]+values[1]+values[2];if(!Number.isSafeInteger(inputTokens))continue;
    events.push({time,inputTokens,outputTokens:values[3],key:typeof row.message.id==='string'?hash(row.message.id):hash(`${time}:${inputTokens}:${values[3]}`)});
  }
  return events;
}
export function parseGeminiLog(raw,now=Date.now()){
  let rows;try{const parsed=JSON.parse(raw);rows=Array.isArray(parsed)?parsed:Array.isArray(parsed?.messages)?parsed.messages:[parsed];}catch{rows=jsonLines(raw);}
  return rows.flatMap(row=>{
    if(!row||!['user'].includes(row.type??row.role??row.message?.role))return [];
    const time=eventTime(row.timestamp,now);return time===null?[]:[{time}];
  });
}
const pacificDate=ms=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(ms);
export function pacificDay(now=Date.now()){
  const day=pacificDate(now);
  // Binary search date transitions rather than assuming a fixed UTC offset (DST days are 23/25h).
  const boundary=(lo,hi,predicate)=>{while(hi-lo>1){const mid=Math.floor((lo+hi)/2);predicate(mid)?hi=mid:lo=mid;}return hi;};
  const start=boundary(now-2*DAY,now,ms=>pacificDate(ms)>=day),end=boundary(now,now+2*DAY,ms=>pacificDate(ms)>day);
  return {dayStartsAt:new Date(start).toISOString(),resetsAt:new Date(end).toISOString()};
}
export function claudeTranscriptAccount(events,previous=null,now=Date.now(),limited=false){
  const unique=new Map();for(const e of events){const old=unique.get(e.key);if(!old||e.outputTokens>old.outputTokens||e.outputTokens===old.outputTokens&&e.time>old.time)unique.set(e.key,e);}
  const sorted=[...unique.values()].sort((a,b)=>a.time-b.time);
  const sum=duration=>sorted.filter(e=>e.time>=now-duration).reduce((s,e)=>({inputTokens:s.inputTokens+e.inputTokens,outputTokens:s.outputTokens+e.outputTokens,assistantTurns:s.assistantTurns+1}),{inputTokens:0,outputTokens:0,assistantTurns:0});
  const firstDay=new Date(now-27*DAY).toISOString().slice(0,10),today=new Date(now).toISOString().slice(0,10);
  const daily=new Map((previous?.transcriptUsage?.dailyMaxima||[]).filter(d=>d.day>=firstDay&&d.day<=today).map(d=>[d.day,d.maxTokens]));
  let left=0,total=0;for(let right=0;right<sorted.length;right++){
    const e=sorted[right];total+=e.inputTokens+e.outputTokens;
    while(sorted[left].time<e.time-5*HOUR){total-=sorted[left].inputTokens+sorted[left].outputTokens;left++;}
    const day=new Date(e.time).toISOString().slice(0,10);if(day>=firstDay)daily.set(day,Math.max(daily.get(day)||0,total));
  }
  const dailyMaxima=[...daily].sort(([a],[b])=>a.localeCompare(b)).map(([day,maxTokens])=>({day,maxTokens}));
  const quotaObservation=previous?.quotaObservation||(['manual','claude-statusline','official-screen'].includes(previous?.source)?{source:previous.source,observedAt:previous.observedAt}:null);
  return core.normalizeAccount({id:'claude-1',provider:'claude',source:'claude-code-transcripts',observedAt:new Date(now).toISOString(),windows:quotaObservation?previous.windows:[],quotaObservation,
    transcriptUsage:{observedAt:new Date(now).toISOString(),fiveHours:sum(5*HOUR),sevenDays:sum(7*DAY),lastActivityAt:sorted.length?new Date(sorted.at(-1).time).toISOString():null,fourWeekMaxFiveHourTokens:Math.max(0,...daily.values()),dailyMaxima,limited}},now);
}
export function geminiLogAccount(events,now=Date.now(),limited=false){
  const times=events.map(e=>e.time).sort((a,b)=>a-b),day=pacificDay(now),start=Date.parse(day.dayStartsAt),today=times.filter(t=>t>=start).length;
  return core.normalizeAccount({id:'gemini-cli',provider:'gemini',source:'gemini-cli-logs',observedAt:new Date(now).toISOString(),windows:[{kind:'daily',usedPercent:Math.min(100,today/20*100),resetsAt:day.resetsAt}],
    cliUsage:{today,sevenDays:times.filter(t=>t>=now-7*DAY).length,dailyCap:20,lastRequestAt:times.length?new Date(times.at(-1)).toISOString():null,...day,limited}},now);
}
async function recentLogs(dir,accept,{now,maxFileBytes=8*1024*1024,maxTotalBytes=64*1024*1024,maxFiles=500}={}){
  const files=[];let limited=false,entries=0;
  async function walk(folder,depth){
    if(depth>8){limited=true;return;}
    let handle;try{handle=await fs.opendir(folder);}catch(e){if(e.code==='ENOENT')return;throw Error('local_logs_unavailable');}
    for await(const entry of handle){if(++entries>10000){limited=true;break;}const file=path.join(folder,entry.name);
      if(entry.isDirectory())await walk(file,depth+1);
      else if(entry.isFile()&&accept(file)){try{const stat=await fs.stat(file);if(stat.mtimeMs>=now-8*DAY)files.push({file,stat});}catch{limited=true;}}
    }
  }
  await walk(dir,0);files.sort((a,b)=>b.stat.mtimeMs-a.stat.mtimeMs);if(files.length>maxFiles)limited=true;
  const chunks=[];let bytes=0;
  for(const {file,stat} of files.slice(0,maxFiles)){
    if(stat.size===0)continue;
    const size=Math.min(stat.size,maxFileBytes,maxTotalBytes-bytes);if(size<=0){limited=true;break;}
    if(size<stat.size)limited=true;
    let handle;try{handle=await fs.open(file,'r');const buffer=Buffer.alloc(size),result=await handle.read(buffer,0,size,stat.size-size);let raw=buffer.toString('utf8',0,result.bytesRead);if(size<stat.size){const newline=raw.indexOf('\n');raw=newline===-1?'':raw.slice(newline+1);}chunks.push({raw,group:path.relative(dir,file).split(path.sep)[0]});bytes+=size;}catch{limited=true;}finally{await handle?.close();}
  }
  return {chunks,limited};
}
export async function collectLocalUsage(summary,{home=os.homedir(),now=Date.now(),...bounds}={}){
  const accounts=[],errors=[];
  try{const logs=await recentLogs(path.join(home,'.claude','projects'),file=>file.endsWith('.jsonl'),{now,...bounds});accounts.push(claudeTranscriptAccount(logs.chunks.flatMap(c=>parseClaudeTranscript(c.raw,now)),summary.accounts.find(a=>a.id==='claude-1'),now,logs.limited));}catch{errors.push('claude_logs_unavailable');}
  try{
    const logs=await recentLogs(path.join(home,'.gemini','tmp'),file=>/session-[^/\\]+\.jsonl$/.test(file)||path.basename(file)==='logs.json',{now,...bounds});
    // Session and prompt logs overlap. Deduplicate timestamps per project, without retaining prompt text.
    const seen=new Set(),events=[];for(const chunk of logs.chunks)for(const e of parseGeminiLog(chunk.raw,now)){const key=chunk.group+':'+e.time;if(!seen.has(key)){seen.add(key);events.push(e);}}
    // Preserve same-time requests in distinct projects using the already deduplicated count list.
    accounts.push(geminiLogAccount(events,now,logs.limited));
  }catch{errors.push('gemini_logs_unavailable');}
  return {accounts,errors};
}
export async function collectSummary({dir=privateDir,collect=readCodex,localCollect=collectLocalUsage,antigravityCollect=()=>collectAntigravity({dir})}={}){
  let summary=await readSummary(dir);const errors=[];
  try{const {fingerprint,result}=await collect(),id=assignCodexSlot(summary,fingerprint);summary=core.merge(summary,{schemaVersion:1,accounts:[codexAccount(id,result,fingerprint)]});}catch(e){errors.push(['codex_slots_full','codex_account_changed','codex_account_not_connected','codex_cli_not_found'].includes(e.message)?e.message:'codex_read_failed');}
  try{const local=await localCollect(summary);summary=core.merge(summary,{schemaVersion:1,accounts:local.accounts});errors.push(...local.errors);}catch{errors.push('local_logs_unavailable');}
  try{const agy=await antigravityCollect();summary=core.merge(summary,{schemaVersion:1,accounts:agy.accounts});errors.push(...agy.errors);}catch{errors.push('antigravity_usage_unavailable');}
  // Re-read so a statusline/import saved during log collection is preserved.
  summary=core.merge(await readSummary(dir),summary);
  await writeSummary(summary,dir);return {summary,collectorStatus:errors.join(',')||'ready'};
}
// Only initialize and two account reads. No model calls, login/logout or reset calls.
export async function readCodex({entry=process.env.HANI_CODEX_ENTRY,timeoutMs=10000}={}){
  if(!entry){const candidates=[path.join(process.env.APPDATA||'','npm/node_modules/@openai/codex/bin/codex.js'),path.join(path.dirname(process.execPath),'node_modules/@openai/codex/bin/codex.js')];for(const p of candidates)try{await fs.access(p);entry=p;break;}catch{}}
  if(!entry)throw Error('codex_cli_not_found');
  const child=spawn(process.execPath,[entry,'app-server','--stdio'],{cwd:os.tmpdir(),windowsHide:true,stdio:['pipe','pipe','pipe']});
  let seq=0,buffer='',ended=false;const pending=new Map();
  const rejectAll=()=>{ended=true;for(const [id,p] of pending){p.reject(Error('codex_connection_failed'));pending.delete(id);}};
  child.on('error',rejectAll);child.on('exit',rejectAll);child.stderr.resume();
  child.stdout.on('data',chunk=>{buffer+=chunk;if(buffer.length>1024*1024){child.kill();rejectAll();return;}let n;while((n=buffer.indexOf('\n'))!==-1){const line=buffer.slice(0,n);buffer=buffer.slice(n+1);let msg;try{msg=JSON.parse(line);}catch{continue;}const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(Error('codex_read_rejected')):p.resolve(msg.result);}}});
  const rpc=(method,params={})=>new Promise((resolve,reject)=>{if(ended)return reject(Error('codex_connection_failed'));const id=++seq;pending.set(id,{resolve,reject});child.stdin.write(JSON.stringify({method,id,params})+'\n');});
  const timeout=setTimeout(()=>{child.kill();rejectAll();},timeoutMs);
  try{
    await rpc('initialize',{clientInfo:{name:'hani_ai_budget',title:'HANI AI Budget',version:'1.0.0'}});child.stdin.write(JSON.stringify({method:'initialized',params:{}})+'\n');
    const before=await rpc('account/read',{refreshToken:false});
    const identity=a=>a?.account?.type==='chatgpt'&&typeof a.account.email==='string'?hash(a.account.email.trim().toLowerCase()):null;
    const fingerprint=identity(before);if(!fingerprint)throw Error('codex_account_not_connected');
    const result=await rpc('account/rateLimits/read');
    const after=await rpc('account/read',{refreshToken:false});if(identity(after)!==fingerprint)throw Error('codex_account_changed');
    return {fingerprint,result};
  }finally{clearTimeout(timeout);child.stdin.end();child.kill();rejectAll();}
}
export function allowedOrigin(origin){
  if(origin==='https://ghdtjdalskr-svg.github.io')return true;
  try{const u=new URL(origin);return u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)&&u.origin===origin;}catch{return false;}
}
export function createBridge({dir=privateDir,collect=readCodex,localCollect=collectLocalUsage,antigravityCollect=()=>collectAntigravity({dir}),port=8794}={}){
  let inFlight=null,lastAttempt=0,lastError=null;
  async function refresh(){
    if(inFlight)return inFlight;if(Date.now()-lastAttempt<5*60000)return;
    lastAttempt=Date.now();inFlight=(async()=>{try{const result=await collectSummary({dir,collect,localCollect,antigravityCollect});lastError=result.collectorStatus==='ready'?null:result.collectorStatus;}catch{lastError='summary_unavailable';}finally{inFlight=null;}})();return inFlight;
  }
  const server=http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    const origin=req.headers.origin;
    if(req.headers.host!==`127.0.0.1:${port}`&&req.headers.host!==`localhost:${port}`){res.writeHead(403);return res.end();}
    if(!allowedOrigin(origin)){res.writeHead(403);return res.end();}
    res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
    if(req.url!=='/api/ai-budget'){res.writeHead(404);return res.end();}
    if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET');res.setHeader('Access-Control-Allow-Headers','X-Hani-Ai-Budget');res.setHeader('Access-Control-Allow-Private-Network','true');res.writeHead(204);return res.end();}
    if(req.method!=='GET'){res.writeHead(405);return res.end();}
    if(req.headers['x-hani-ai-budget']!=='read-only-v1'){res.writeHead(403);return res.end();}
    try{await refresh();const summary=await readSummary(dir);res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({...summary,collectorStatus:lastError||'ready'}));}catch{res.writeHead(503);res.end('{"error":"summary_unavailable"}');}
  });
  return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const mode=process.argv[2]||'serve';
  try{
    if(mode==='collect'){const result=await collectSummary();console.log(`사용량 집계 저장 완료: ${result.collectorStatus}`);if(result.collectorStatus!=='ready')process.exitCode=1;}
    else if(mode==='claude-statusline'){let raw='';for await(const chunk of process.stdin){raw+=chunk;if(raw.length>1024*1024)throw Error('input_too_large');}const a=claudeAccount(JSON.parse(raw)),summary=await readSummary();await writeSummary(core.merge(summary,{schemaVersion:1,accounts:[a]}));console.log('HANI AI 예산 · 한도 기록 완료');}
    else if(mode==='import'){const file=process.argv[3];if(!file)throw Error('summary_file_required');const stat=await fs.stat(file);if(stat.size>65536)throw Error('input_too_large');await importSummary(JSON.parse(await fs.readFile(file,'utf8')));console.log('사용량 요약 저장 완료');}
    else if(mode==='serve'){const server=createBridge();server.listen(8794,'127.0.0.1',()=>console.log('HANI AI 사용량 도우미: 127.0.0.1:8794 (읽기 전용)'));server.on('error',()=>{console.error('도우미 포트를 열지 못했습니다.');process.exitCode=1;});}
    else throw Error('unknown_command');
  }catch(e){console.error(['codex_slots_full','codex_account_changed','codex_account_not_connected','codex_cli_not_found','claude_limits_unavailable'].includes(e.message)?e.message:'사용량 조회 또는 저장 실패. 기존 요약을 보존했습니다.');process.exitCode=1;}
}
