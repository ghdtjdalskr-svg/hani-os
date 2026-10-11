/* Shared allowlist: subscription limits are not token balances. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HaniAiBudgetCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const slots=Object.freeze([
    {id:'codex-1',provider:'codex',label:'Codex 주력',url:'https://chatgpt.com/codex/settings/usage'},
    {id:'codex-2',provider:'codex',label:'Codex 보조',url:'https://chatgpt.com/codex/settings/usage'},
    {id:'claude-1',provider:'claude',label:'Claude',url:'https://claude.ai/settings/usage'},
    {id:'gemini-pro',provider:'antigravity',label:'Gemini Pro (Google AI Pro)',url:'https://antigravity.google/'},
    {id:'antigravity-cg',provider:'antigravity',label:'Antigravity · Claude/GPT',url:'https://antigravity.google/'},
    {id:'gemini-cli',provider:'gemini',label:'Gemini · CLI(무료)',url:'https://gemini.google.com/'}
  ]);
  const sources=['codex-app-server','codex-app','claude-statusline','claude-plan-usage','claude-code-transcripts','official-screen','gemini-cli','gemini-cli-logs','antigravity','manual'];
  const percent=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100?v:null;
  const count=v=>Number.isSafeInteger(v)&&v>=0?v:null;
  function stamp(v){if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT/.test(v))return null;const n=Date.parse(v);return Number.isFinite(n)?new Date(n).toISOString():null;}
  const slotId=id=>id==='gemini-1'?'gemini-cli':id; // Legacy summary stays readable; no life-data migration.
  function transcriptUsage(raw){
    if(!raw)return null;
    const window=w=>({inputTokens:count(w?.inputTokens),outputTokens:count(w?.outputTokens),assistantTurns:count(w?.assistantTurns)});
    const dailyMaxima=(Array.isArray(raw.dailyMaxima)?raw.dailyMaxima:[]).slice(-28).filter(d=>/^\d{4}-\d\d-\d\d$/.test(d?.day)&&count(d.maxTokens)!==null).map(d=>({day:d.day,maxTokens:d.maxTokens}));
    return {observedAt:stamp(raw.observedAt),fiveHours:window(raw.fiveHours),sevenDays:window(raw.sevenDays),lastActivityAt:stamp(raw.lastActivityAt),fourWeekMaxFiveHourTokens:count(raw.fourWeekMaxFiveHourTokens),dailyMaxima,limited:raw.limited===true};
  }
  function cliUsage(raw){
    if(!raw)return null;
    return {today:count(raw.today),sevenDays:count(raw.sevenDays),dailyCap:20,lastRequestAt:stamp(raw.lastRequestAt),dayStartsAt:stamp(raw.dayStartsAt),resetsAt:stamp(raw.resetsAt),limited:raw.limited===true};
  }
  function normalizeAccount(raw,now=Date.now()){
    const slot=slots.find(s=>s.id===slotId(raw?.id));if(!slot)throw Error('알 수 없는 계정입니다.');
    if(raw.provider!==slot.provider)throw Error('계정과 서비스가 일치하지 않습니다.');
    const observedAt=stamp(raw.observedAt);if(!observedAt||Date.parse(observedAt)>now+60000)throw Error('조회 시각을 확인해 주세요.');
    if(!sources.includes(raw.source))throw Error('지원하지 않는 출처입니다.');
    const windows=(Array.isArray(raw.windows)?raw.windows:[]).slice(0,8).map(w=>{
      const kind=['session','weekly','daily','other'].includes(w?.kind)?w.kind:'other';
      const usedPercent=percent(w?.usedPercent),resetsAt=w?.resetsAt===null?null:stamp(w?.resetsAt);
      if(w?.usedPercent!==null&&usedPercent===null)throw Error('사용률은 0~100 사이 숫자여야 합니다.');
      if(w?.resetsAt!=null&&!resetsAt)throw Error('회복 시각 형식이 올바르지 않습니다.');
      return {kind,usedPercent,resetsAt};
    });
    const fingerprint=typeof raw.fingerprint==='string'&&/^[a-f0-9]{64}$/.test(raw.fingerprint)?raw.fingerprint:null;
    const tokens=raw.tokens&&['session','reported-total'].includes(raw.tokens.scope)?{scope:raw.tokens.scope,value:count(raw.tokens.value)}:null;
    const quotaObservation=slot.provider==='claude'?( ['claude-statusline','claude-plan-usage','manual','official-screen'].includes(raw.source)?{source:raw.source,observedAt}:['claude-statusline','claude-plan-usage','manual','official-screen'].includes(raw.quotaObservation?.source)&&stamp(raw.quotaObservation?.observedAt)&&Date.parse(raw.quotaObservation.observedAt)<=now+60000?{source:raw.quotaObservation.source,observedAt:stamp(raw.quotaObservation.observedAt)}:null):null;
    return {id:raw.id,provider:slot.provider,observedAt,source:raw.source,fingerprint,windows,tokens,
      ...(slot.provider==='claude'&&!quotaObservation?{windows:[]}:{}),quotaObservation,
      transcriptUsage:slot.provider==='claude'?transcriptUsage(raw.transcriptUsage):null,
      cliUsage:raw.id==='gemini-cli'&&raw.source==='gemini-cli-logs'?cliUsage(raw.cliUsage):null};
  }
  function normalize(raw,now=Date.now()){
    if(raw?.schemaVersion!==1||!Array.isArray(raw.accounts)||raw.accounts.length>slots.length)throw Error('사용량 요약 파일 형식이 올바르지 않습니다.');
    const accounts=raw.accounts.map(a=>normalizeAccount(a,now));
    if(new Set(accounts.map(a=>slotId(a.id))).size!==accounts.length)throw Error('계정 칸이 중복되어 있습니다.');
    const codex=accounts.filter(a=>a.provider==='codex'&&a.fingerprint);
    if(codex.length===2&&codex[0].fingerprint===codex[1].fingerprint)throw Error('두 Codex 칸에 같은 계정이 연결되어 있습니다.');
    return {schemaVersion:1,accounts};
  }
  function normalizeImport(raw,now=Date.now()){
    if(!raw||!Array.isArray(raw.accounts)||(!raw.accounts.length&&raw.schemaVersion===undefined)||raw.accounts.length>slots.length)throw Error('사용량 요약 파일 형식이 올바르지 않습니다.');
    const minimal=raw.schemaVersion===undefined;
    if(minimal&&Object.keys(raw).some(k=>k!=='accounts'))throw Error('지원하지 않는 요약 필드입니다.');
    const accounts=raw.accounts.map(a=>{
      if(a?.source!=='claude-plan-usage'){
        if(minimal)throw Error('최소 요약은 Claude 플랜 사용률만 지원합니다.');
        return a;
      }
      const fields=['id','provider','source','windows','observedAt',...(!minimal?['fingerprint','tokens','quotaObservation','transcriptUsage','cliUsage']:[])];
      if(a.id!=='claude-1'||a.provider!=='claude'||Object.keys(a).some(k=>!fields.includes(k)))throw Error('Claude 플랜 계정 형식이 올바르지 않습니다.');
      if(!Array.isArray(a.windows)||!a.windows.length||a.windows.length>2)throw Error('Claude 플랜 한도를 확인해 주세요.');
      const windows=a.windows.map(w=>{
        if(!w||Object.keys(w).some(k=>!['id','kind','usedPercent','resetsAt'].includes(k)))throw Error('Claude 플랜 한도 필드가 올바르지 않습니다.');
        const kind=w.id??w.kind;
        if(!['weekly','session'].includes(kind)||(w.id&&w.kind&&w.id!==w.kind)||percent(w.usedPercent)===null||!stamp(w.resetsAt))throw Error('Claude 플랜 사용률·회복 시각이 올바르지 않습니다.');
        return {kind,usedPercent:w.usedPercent,resetsAt:stamp(w.resetsAt)};
      });
      if(new Set(windows.map(w=>w.kind)).size!==windows.length)throw Error('Claude 플랜 한도가 중복되어 있습니다.');
      return {...a,observedAt:a.observedAt===undefined?new Date(now).toISOString():a.observedAt,windows};
    });
    return normalize({...raw,schemaVersion:minimal?1:raw.schemaVersion,accounts},now);
  }
  function merge(previous,incoming,now=Date.now()){
    const next=normalize(incoming,now),old=normalize(previous,now);
    const accounts=slots.map(s=>{
      const a=old.accounts.find(x=>slotId(x.id)===s.id),b=next.accounts.find(x=>slotId(x.id)===s.id);
      if(!a||!b)return b||a;
      const latest=Date.parse(b.observedAt)<Date.parse(a.observedAt)?a:b;
      if(s.provider!=='claude')return latest;
      // Log collection and official/manual quota observations have independent clocks.
      const usage=[a.transcriptUsage,b.transcriptUsage].filter(Boolean).sort((x,y)=>(Date.parse(y.observedAt)||0)-(Date.parse(x.observedAt)||0))[0]||null;
      const quota=[b,a].filter(x=>x.quotaObservation).sort((x,y)=>Date.parse(y.quotaObservation.observedAt)-Date.parse(x.quotaObservation.observedAt))[0];
      return {...latest,transcriptUsage:usage,windows:quota?.windows||[],quotaObservation:quota?.quotaObservation||null};
    }).filter(Boolean);
    return normalize({schemaVersion:1,accounts},now);
  }
  function windowState(account,w,now=Date.now()){
    if(!account||w?.usedPercent==null)return 'unknown';
    if(w.resetsAt&&Date.parse(w.resetsAt)<=now)return 'expired';
    if(now-Date.parse(account.quotaObservation?.observedAt||account.observedAt)>(account.source==='antigravity'?60:15)*60000)return 'stale';
    return w.usedPercent>=100?'limited':w.usedPercent>=80?'low':'fresh';
  }
  return {slots,sources,percent,stamp,slotId,normalize,normalizeAccount,normalizeImport,merge,windowState};
});
