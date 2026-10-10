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
// Only initialize and two account reads. No model calls, login/logout or reset calls.
export async function readCodex({entry=process.env.HANI_CODEX_ENTRY,timeoutMs=10000}={}){
  if(!entry){const candidates=[path.join(process.env.APPDATA||'','npm/node_modules/@openai/codex/bin/codex.js'),path.join(path.dirname(process.execPath),'node_modules/@openai/codex/bin/codex.js')];for(const p of candidates)try{await fs.access(p);entry=p;break;}catch{}}
  if(!entry)throw Error('codex_cli_not_found');
  const child=spawn(process.execPath,[entry,'app-server','--stdio'],{cwd:os.tmpdir(),windowsHide:true,stdio:['pipe','pipe','pipe']});
  let seq=0,buffer='',ended=false;const pending=new Map();
  const rejectAll=()=>{ended=true;for(const p of pending.values())p.reject(Error('codex_connection_failed'));pending.clear();};
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
export function createBridge({dir=privateDir,collect=readCodex,port=8794}={}){
  let inFlight=null,lastAttempt=0,lastError=null;
  async function refresh(){
    if(inFlight)return inFlight;if(Date.now()-lastAttempt<5*60000)return;
    lastAttempt=Date.now();inFlight=(async()=>{try{const {fingerprint,result}=await collect(),summary=await readSummary(dir),id=assignCodexSlot(summary,fingerprint);await writeSummary(core.merge(summary,{schemaVersion:1,accounts:[codexAccount(id,result,fingerprint)]}),dir);lastError=null;}catch(e){lastError=['codex_slots_full','codex_account_changed','codex_account_not_connected','codex_cli_not_found'].includes(e.message)?e.message:'codex_read_failed';}finally{inFlight=null;}})();return inFlight;
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
    if(mode==='collect'){const {fingerprint,result}=await readCodex(),summary=await readSummary(),id=assignCodexSlot(summary,fingerprint);await writeSummary(core.merge(summary,{schemaVersion:1,accounts:[codexAccount(id,result,fingerprint)]}));console.log(`사용량 조회 저장 완료: ${id}`);}
    else if(mode==='claude-statusline'){let raw='';for await(const chunk of process.stdin){raw+=chunk;if(raw.length>1024*1024)throw Error('input_too_large');}const a=claudeAccount(JSON.parse(raw)),summary=await readSummary();await writeSummary(core.merge(summary,{schemaVersion:1,accounts:[a]}));console.log('HANI AI 예산 · 한도 기록 완료');}
    else if(mode==='import'){const file=process.argv[3];if(!file)throw Error('summary_file_required');const stat=await fs.stat(file);if(stat.size>65536)throw Error('input_too_large');const clean=core.normalize(JSON.parse(await fs.readFile(file,'utf8'))),summary=await readSummary();await writeSummary(core.merge(summary,clean));console.log('사용량 요약 저장 완료');}
    else if(mode==='serve'){const server=createBridge();server.listen(8794,'127.0.0.1',()=>console.log('HANI AI 사용량 도우미: 127.0.0.1:8794 (읽기 전용)'));server.on('error',()=>{console.error('도우미 포트를 열지 못했습니다.');process.exitCode=1;});}
    else throw Error('unknown_command');
  }catch(e){console.error(['codex_slots_full','codex_account_changed','codex_account_not_connected','codex_cli_not_found','claude_limits_unavailable'].includes(e.message)?e.message:'사용량 조회 또는 저장 실패. 기존 요약을 보존했습니다.');process.exitCode=1;}
}
