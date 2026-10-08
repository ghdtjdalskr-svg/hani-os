/* Shared allowlist: subscription limits are not token balances. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HaniAiBudgetCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const slots=Object.freeze([
    {id:'codex-1',provider:'codex',label:'Codex 1',url:'https://chatgpt.com/codex/settings/usage'},
    {id:'codex-2',provider:'codex',label:'Codex 2',url:'https://chatgpt.com/codex/settings/usage'},
    {id:'claude-1',provider:'claude',label:'Claude',url:'https://claude.ai/settings/usage'},
    {id:'gemini-1',provider:'gemini',label:'Gemini',url:'https://gemini.google.com/'}
  ]);
  const sources=['codex-app-server','codex-app','claude-statusline','official-screen','gemini-cli','manual'];
  const percent=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100?v:null;
  const count=v=>Number.isSafeInteger(v)&&v>=0?v:null;
  function stamp(v){if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT/.test(v))return null;const n=Date.parse(v);return Number.isFinite(n)?new Date(n).toISOString():null;}
  function normalizeAccount(raw,now=Date.now()){
    const slot=slots.find(s=>s.id===raw?.id);if(!slot)throw Error('알 수 없는 계정입니다.');
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
    return {id:slot.id,provider:slot.provider,observedAt,source:raw.source,fingerprint,windows,tokens};
  }
  function normalize(raw,now=Date.now()){
    if(raw?.schemaVersion!==1||!Array.isArray(raw.accounts)||raw.accounts.length>4)throw Error('사용량 요약 파일 형식이 올바르지 않습니다.');
    const accounts=raw.accounts.map(a=>normalizeAccount(a,now));
    if(new Set(accounts.map(a=>a.id)).size!==accounts.length)throw Error('계정 칸이 중복되어 있습니다.');
    const codex=accounts.filter(a=>a.provider==='codex'&&a.fingerprint);
    if(codex.length===2&&codex[0].fingerprint===codex[1].fingerprint)throw Error('두 Codex 칸에 같은 계정이 연결되어 있습니다.');
    return {schemaVersion:1,accounts};
  }
  function merge(previous,incoming,now=Date.now()){
    const next=normalize(incoming,now),old=normalize(previous,now);
    const accounts=slots.map(s=>{const a=old.accounts.find(x=>x.id===s.id),b=next.accounts.find(x=>x.id===s.id);if(a&&b&&Date.parse(b.observedAt)<Date.parse(a.observedAt))return a;return b||a;}).filter(Boolean);
    return normalize({schemaVersion:1,accounts},now);
  }
  function windowState(account,w,now=Date.now()){
    if(!account||w?.usedPercent==null)return 'unknown';
    if(w.resetsAt&&Date.parse(w.resetsAt)<=now)return 'expired';
    if(now-Date.parse(account.observedAt)>15*60000)return 'stale';
    return w.usedPercent>=100?'limited':w.usedPercent>=80?'low':'fresh';
  }
  return {slots,sources,percent,stamp,normalize,normalizeAccount,merge,windowState};
});
