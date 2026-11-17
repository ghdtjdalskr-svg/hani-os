(function(){
  'use strict';
  const core=window.HaniAiBudgetCore,KEY='hani_ai_budget_summary_v1';
  const section=document.getElementById('aiBudget');if(!core||!section)return;
  let summary={schemaVersion:1,accounts:[]},busy=false,memoryOnly=false,sequence=0,collectorStatus='',refreshFailed=false;
  const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=v=>v?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v)):'확인 불가';
  const source={ 'codex-app-server':'Codex 공식 조회','codex-app':'Codex 앱 조회','claude-statusline':'Claude Code 제공','claude-plan-usage':'Claude 플랜 사용률 가져오기','claude-code-transcripts':'Claude Code 로컬 집계','official-screen':'공식 화면 확인','gemini-cli':'Gemini CLI 세션','gemini-cli-logs':'Gemini CLI 로컬 집계','antigravity':'Antigravity /usage 조회','manual':'직접 기록'};
  const states={unknown:'미확인',expired:'회복 시각 경과 · 재조회 필요',stale:'갱신 필요',limited:'한도 도달',low:'잔여 한도 적음',fresh:'최근 확인'};
  const STALE_OLD_MS=6*3600000;
  // gemini-cli and codex-2 stay hidden (GPT 보조 계정 해지, 회장님 11/18); core slot schema unchanged.
  const hiddenSlots=['gemini-cli','codex-2'],visibleSlots=core.slots.filter(s=>!hiddenSlots.includes(s.id));
  const slotLabels={};
  const slotLabel=s=>slotLabels[s.id]||s.label;
  const dashboardLabels={'codex-1':'GPT','claude-1':'Claude','gemini-pro':'Gemini Pro','antigravity-cg':'Antigravity · C/G'};
  const dashboardLabel=s=>dashboardLabels[s.id]||slotLabel(s);
  const kinds={session:'5시간 한도',weekly:'주간 한도',daily:'일간 한도',other:'기타 한도'};
  function relativeAge(v,now=Date.now()){
    if(!v)return null;const t=Date.parse(v);if(!Number.isFinite(t))return null;
    const min=Math.max(0,Math.floor((now-t)/60000));
    return min<60?`${min}분 전`:`${Math.floor(min/60)}시간 전`;
  }
  function isSixHoursOld(v,now=Date.now()){
    if(!v)return false;const t=Date.parse(v);return Number.isFinite(t)&&(now-t)>STALE_OLD_MS;
  }
  function accountRefTime(a){
    if(!a)return null;
    return a.windows?.length&&a.quotaObservation?.observedAt?a.quotaObservation.observedAt:(a.observedAt||a.transcriptUsage?.observedAt||null);
  }
  function countdown(v,now=Date.now()){
    if(!v)return '회복 시각 확인 불가';const n=Date.parse(v)-now;if(!Number.isFinite(n))return '회복 시각 확인 불가';
    if(n<=0)return '시각 경과 · 실제 회복 확인 필요';const min=Math.ceil(n/60000),day=Math.floor(min/1440),h=Math.floor(min%1440/60),m=min%60;
    return `${day?day+'일 ':''}${h?h+'시간 ':''}${m}분 남음`;
  }
  function resetChipText(v,now=Date.now()){
    if(!v)return '리셋 미확인';const n=Date.parse(v)-now;if(!Number.isFinite(n))return '리셋 미확인';
    if(n<=0)return '리셋 시각 경과';const min=Math.ceil(n/60000),day=Math.floor(min/1440),h=Math.floor(min%1440/60),m=min%60;
    return `리셋 ${day?day+'일 ':''}${h?h+'시간 ':''}${m}분 남음`;
  }
  function slotFetchFailed(slot){
    if(refreshFailed)return true;
    const list=collectorStatus?collectorStatus.split(',').filter(Boolean):[];
    if(slot.provider==='codex')return list.some(s=>s.startsWith('codex_'));
    if(slot.provider==='antigravity')return list.some(s=>s.startsWith('antigravity_'));
    if(slot.provider==='claude')return list.some(s=>s==='claude_logs_unavailable'||s==='local_logs_unavailable');
    return false;
  }
  function notify(message){$('aiBudgetNotice').textContent=message;}
  const number=v=>v==null?'확인 불가':esc(v.toLocaleString('ko-KR'));
  function claudeUsage(a){
    const u=a?.transcriptUsage;
    const win=(title,w)=>`<div class="budget-window"><b>${title}</b><p>입력 + 캐시 <strong>${number(w?.inputTokens)}</strong> 토큰 · 출력 <strong>${number(w?.outputTokens)}</strong> 토큰</p><p>응답 ${number(w?.assistantTurns)}회</p></div>`;
    const total=u?.fiveHours?.inputTokens!=null&&u?.fiveHours?.outputTokens!=null?u.fiveHours.inputTokens+u.fiveHours.outputTokens:null,max=u?.fourWeekMaxFiveHourTokens;
    const hasPersonalMeter=total!=null&&max>0,width=hasPersonalMeter?Math.min(100,total/max*100):0;
    const meterHtml=hasPersonalMeter
      ?`<div class="budget-personal-meter"><div class="budget-meter" role="meter" aria-label="개인 4주 최대 5시간 토큰 대비" aria-valuemin="0" aria-valuemax="${esc(max)}" aria-valuenow="${esc(Math.min(total,max))}"><i style="width:${width}%"></i></div><p>개인 4주 최대 5시간 사용량 ${number(max)} 토큰 대비 · 수집된 기록 기준</p></div>`
      :`<div class="budget-personal-meter"><p class="budget-unconfirmed-line">개인 4주 최대 대비 · <b>미확인</b></p></div>`;
    return `<details class="budget-info-details"><summary>ⓘ 사용 추정 안내</summary><p class="budget-hint">로컬 기록의 토큰·턴 집계이며 플랜 사용률이 아닙니다.</p></details>${win('최근 5시간 · 입력 + 캐시 / 출력 토큰',u?.fiveHours)}${meterHtml}${win('최근 7일',u?.sevenDays)}<p class="sub budget-source">마지막 활동 ${esc(date(u?.lastActivityAt))}<br>집계 시각 ${esc(date(u?.observedAt))}${u?.observedAt&&Date.now()-Date.parse(u.observedAt)>15*60000?' · 갱신 필요':''}${u?.limited?'<br>일부 로그만 집계되어 실제 사용량보다 적을 수 있습니다.':''}</p>`;
  }
  function save(next){summary=core.normalize(next);try{localStorage.setItem(KEY,JSON.stringify(summary));memoryOnly=false;}catch(_){memoryOnly=true;}render();}
  function antigravityHint(a){
    const status=collectorStatus.split(',').find(s=>s.startsWith('antigravity_'));
    const hints={antigravity_cli_not_found:'이 PC에서 Antigravity CLI를 찾지 못했습니다. 설치 후 연결할 수 있어요.',antigravity_login_required:'Antigravity CLI에서 로그인하면 한도를 확인할 수 있어요.',antigravity_timeout:'이번 조회가 조금 늦어졌습니다. 다음 정기 조회를 기다립니다.',antigravity_usage_unavailable:'이번 조회에서 일부 한도를 확인하지 못했습니다. CLI의 로그인 상태를 확인해 주세요.',antigravity_pending:'Antigravity 한도를 확인 중입니다. 잠시 후 다시 가져올 수 있어요.'};
    const msg=`${status?hints[status]:a?'Antigravity에서 제공하는 한도입니다. 자동 조회는 최대 시간당 한 번 진행합니다.':'Antigravity CLI가 설치되고 로그인되어 있으면 주간·5시간 한도를 확인할 수 있어요.'}${status&&a?' 보관된 조회값과 시각을 표시합니다.':''}`;
    return `<details class="budget-info-details"><summary>ⓘ ${esc(status?'수집 상태 안내':'한도 안내')}</summary><p class="budget-hint">${esc(msg)}</p></details>`;
  }
  function readSummaryReadOnly(){
    if(memoryOnly)return summary;
    try{const raw=localStorage.getItem(KEY);if(raw)return core.normalize(JSON.parse(raw));}catch(_){}
    return summary;
  }
  try{const raw=localStorage.getItem(KEY);if(raw)summary=core.normalize(JSON.parse(raw));}catch(_){notify('저장된 사용량 요약을 읽지 못했습니다. 원본은 그대로 두고 새 조회를 기다립니다.');}
  function primaryWindow(a){
    const valid=(a?.windows||[]).filter(w=>w&&w.usedPercent!=null);
    if(!valid.length)return null;
    return valid.slice().sort((x,y)=>y.usedPercent-x.usedPercent)[0];
  }
  function renderDashboard(now=Date.now()){
    const rowsNode=$('homeAiFuelRows'),statusNode=$('homeAiFuelStatus');
    if(!rowsNode&&!statusNode)return;
    const dashSummary=readSummaryReadOnly();
    const visibleAccounts=visibleSlots.map(s=>dashSummary.accounts.find(x=>core.slotId(x.id)===s.id)).filter(Boolean);
    const latestMs=visibleAccounts.map(a=>Date.parse(accountRefTime(a)||'')).filter(Number.isFinite).sort((a,b)=>b-a)[0];
    if(statusNode){
      if(refreshFailed)statusNode.textContent='이번에는 못 가져왔어요 · 이전 값 표시 중';
      else if(Number.isFinite(latestMs))statusNode.textContent=`마지막 갱신 ${relativeAge(new Date(latestMs).toISOString(),now)}`;
      else statusNode.textContent='아직 수집 전';
    }
    if(!rowsNode)return;
    rowsNode.innerHTML=visibleSlots.map(slot=>{
      const a=dashSummary.accounts.find(x=>core.slotId(x.id)===slot.id);
      const w=primaryWindow(a),refIso=accountRefTime(a);
      if(!w){
        return `<div class="home-ai-fuel-row is-empty" data-fuel-slot="${esc(slot.id)}"><span class="home-ai-fuel-name">${esc(dashboardLabel(slot))}</span><span class="home-ai-fuel-unconfirmed">${esc(!a?'아직 수집 전 · 미확인':'미확인')}</span></div>`;
      }
      const pct=Math.max(0,Math.min(100,w.usedPercent)),pctText=`${Number(pct.toFixed(1))}%`;
      const state=core.windowState(a,w,now),stale=state==='expired'||state==='stale'||isSixHoursOld(refIso,now);
      const tone=stale?'is-stale':pct>=80?'is-high':'is-normal';
      return `<div class="home-ai-fuel-row ${tone}" data-fuel-slot="${esc(slot.id)}"><span class="home-ai-fuel-name">${esc(dashboardLabel(slot))}</span><span class="home-ai-fuel-bar" role="meter" aria-label="${esc(dashboardLabel(slot))} 사용률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></span><span class="home-ai-fuel-pct">${esc(pctText)}${stale?' <small class="home-ai-fuel-old">⏳</small>':''}</span></div>`;
    }).join('');
  }
  function render(){
    const now=Date.now();
    const count=summary.accounts.filter(a=>visibleSlots.some(s=>s.id===core.slotId(a.id))).filter(a=>a.windows.some(w=>['fresh','low','limited'].includes(core.windowState(a,w,now)))||a.transcriptUsage?.observedAt&&now-Date.parse(a.transcriptUsage.observedAt)<=15*60000||a.cliUsage&&now-Date.parse(a.observedAt)<=15*60000).length;
    $('aiBudgetConnected').textContent=`${count} / ${visibleSlots.length}`;
    $('aiBudgetSaveState').textContent=memoryOnly?'현재 화면에만 보관 중 · 요약 내보내기로 보관해 주세요.':'사용량 요약은 이 브라우저에 보관합니다. 생활 기록과 별도로 관리합니다.';
    $('aiBudgetCards').innerHTML=visibleSlots.map(slot=>{
      const a=summary.accounts.find(x=>core.slotId(x.id)===slot.id);
      const refIso=accountRefTime(a),ageText=relativeAge(refIso,now),old6h=isSixHoursOld(refIso,now),failed=slotFetchFailed(slot);
      const chips=[
        ageText?`<span class="budget-chip budget-chip-age">마지막 갱신 ${esc(ageText)}</span>`:`<span class="budget-chip budget-chip-unknown">아직 수집 전</span>`,
        old6h?`<span class="budget-chip budget-chip-stale">⏳ 오래된 값</span>`:'',
        failed?`<span class="budget-chip budget-chip-fail">이번에는 못 가져왔어요 · 이전 값 표시 중</span>`:'',
        a&&slot.provider==='claude'&&!a.windows?.length?`<span class="budget-chip budget-chip-unknown">플랜 사용률 미확인</span>`:''
      ].filter(Boolean).join('');
      const chipRow=`<div class="budget-chips">${chips}</div>`;
      const windows=!a?[]:slot.id==='gemini-cli'?[]:a.windows?.length?a.windows:slot.provider==='claude'?[]:slot.provider==='antigravity'?['weekly','session'].map(kind=>({kind,usedPercent:null,resetsAt:null})):[{kind:'weekly',usedPercent:null,resetsAt:null}];
      const usage=a&&slot.provider==='claude'&&!a.windows?.length?claudeUsage(a):'';
      const emptyBox=!a?`<div class="budget-empty"><div class="budget-empty-head"><b>아직 수집 전</b><span class="budget-chip budget-chip-unknown">미확인</span></div><p>사용률 값이 없어 진행 바를 그리지 않습니다.</p></div>`:'';
      const quota=windows.map(w=>{
        const status=core.windowState(a,w,now),live=['fresh','low','limited'].includes(status),value=w.usedPercent,title=slot.provider==='antigravity'&&w.kind==='session'?'5시간 한도':kinds[w.kind];
        if(value==null){
          return `<div class="budget-window ${status}"><div class="budget-window-head"><b>${esc(title)}</b><span>${states[status]}</span></div><div class="budget-window-unconfirmed"><strong>미확인</strong><small>아직 확인하지 않았어요</small></div><div class="budget-window-chips"><span class="budget-chip budget-chip-reset">⏱ ${esc(resetChipText(w.resetsAt,now))}</span></div><p>실제 확인 전에는 진행 바와 0%를 표시하지 않습니다.</p><p>회복 예정 ${esc(date(w.resetsAt))} <small>(KST · 한국 시간)</small></p></div>`;
        }
        const pct=Math.max(0,Math.min(100,value));
        return `<div class="budget-window ${status}${old6h?' is-old':''}"><div class="budget-window-head"><b>${esc(title)}</b><span>${states[status]}</span></div><div class="budget-value">${esc(Number((100-value).toFixed(2)))}%<small>${live?'남음':'지난 조회의 잔여율'}</small></div><div class="budget-meter" role="meter" aria-label="${esc(title)} 사용률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div><div class="budget-window-chips"><span class="budget-chip budget-chip-reset">⏱ ${esc(resetChipText(w.resetsAt,now))}</span></div><p>사용 ${esc(Number(value.toFixed(2)))}% · ${esc(countdown(w.resetsAt,now))}</p><p>회복 예정 ${esc(date(w.resetsAt))} <small>(KST · 한국 시간)</small></p></div>`;
      }).join('');
      const quotaSource=a?.quotaObservation?`<p class="sub">플랜 사용률 · ${esc(source[a.quotaObservation.source])} · 확인 ${esc(date(a.quotaObservation.observedAt))}</p>`:'';
      const plan=slot.id==='gemini-pro'?'Google AI Pro · Antigravity':slot.id==='antigravity-cg'?'Claude/GPT · Antigravity':slot.provider==='codex'?'GPT · Plus':slot.provider==='claude'?'Claude · Pro':'보조 · Gemini CLI 무료 API';
      const logo=slot.id==='antigravity-cg'?'openai':slot.id==='gemini-pro'?'gemini':slot.provider==='codex'?'openai':slot.provider;
      const tokenBox=a?.tokens?.value!=null?`<div class="budget-token"><span>${a.tokens.scope==='session'?'현재 CLI 세션 토큰':'제공된 누적 토큰'} <b>${number(a.tokens.value)}</b></span><details class="budget-info-details"><summary>ⓘ 토큰 안내</summary><p class="budget-hint">구독의 남은 토큰 수와는 다릅니다.</p></details></div>`:'';
      return `<article class="budget-account card${old6h?' is-old':''}${!a?' is-empty':''}" data-budget-slot="${esc(slot.id)}"><div class="budget-account-head"><div><h3>${esc(slotLabel(slot))}</h3><span class="budget-plan">${esc(plan)}</span></div><span class="budget-symbol"><img src="./assets/ai-budget/${esc(logo)}.png" alt="${esc(logo)} 로고" width="44" height="44"></span></div>${chipRow}${emptyBox}${usage}${quota}${quotaSource}${slot.provider==='antigravity'?antigravityHint(a):''}${tokenBox}<p class="sub budget-source">${a?`${esc(source[a.source])} · 마지막 확인 ${esc(date(a.observedAt))}`:'연결 또는 기록 대기'}</p><div class="budget-actions"><button type="button" class="btn sm" data-budget-edit="${esc(slot.id)}">사용량 기록</button><a class="btn sm" href="${esc(slot.url)}" target="_blank" rel="noopener noreferrer">공식 화면 ↗</a></div></article>`;
    }).join('');
    renderDashboard(now);
  }
  function openEditor(id){
    $('aiBudgetAccount').value=id;const a=summary.accounts.find(x=>core.slotId(x.id)===id);
    for(const kind of ['session','weekly','daily']){const w=a?.windows.find(w=>w.kind===kind);$(`budget-${kind}-used`).value=w?.usedPercent??'';$(`budget-${kind}-reset`).value=w?.resetsAt?new Date(Date.parse(w.resetsAt)+9*3600000).toISOString().slice(0,16):'';}
    $('aiBudgetEditor').hidden=false;$('aiBudgetAccount').focus();
  }
  async function refresh(){
    if(busy)return;busy=true;const epoch=++sequence;$('aiBudgetRefresh').disabled=true;notify('이 PC의 사용량 연결을 확인 중입니다…');
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),80000);
    try{
      const res=await fetch('http://127.0.0.1:8794/api/ai-budget',{method:'GET',cache:'no-store',credentials:'omit',headers:{'X-Hani-Ai-Budget':'read-only-v1'},signal:controller.signal});
      if(!res.ok)throw Error('연결 실패');const raw=await res.text();if(raw.length>65536)throw Error('큰 응답');
      const payload=JSON.parse(raw),next=core.normalize(payload);
      if(epoch!==sequence)return;refreshFailed=false;collectorStatus=typeof payload.collectorStatus==='string'?payload.collectorStatus:'';save(core.merge(summary,next));
      notify(payload.collectorStatus&&payload.collectorStatus!=='ready'?'일부 서비스의 새 사용량 조회를 완료하지 못했습니다. 보관된 요약과 확인 가능한 집계를 표시합니다.':next.accounts.length?'가져온 사용량을 반영했습니다. 각 카드의 조회 시각을 확인해 주세요.':'연결된 사용량이 없습니다. 계정 연결 또는 공식 화면 기록을 기다립니다.');
    }catch(_){if(epoch===sequence){refreshFailed=true;notify('이 PC의 사용량 연결에 닿지 못했습니다. 기존 요약은 보존했습니다. 휴대폰에서는 요약 파일 가져오기 또는 직접 기록을 사용할 수 있습니다.');render();}}
    finally{clearTimeout(timeout);busy=false;$('aiBudgetRefresh').disabled=false;}
  }
  section.addEventListener('click',e=>{const b=e.target.closest('[data-budget-edit]');if(b)openEditor(b.dataset.budgetEdit);});
  $('aiBudgetAccount').innerHTML=visibleSlots.map(s=>`<option value="${esc(s.id)}">${esc(slotLabel(s))}</option>`).join('');
  $('aiBudgetRefresh').addEventListener('click',refresh);
  $('aiBudgetCancel').addEventListener('click',()=>{$('aiBudgetEditor').hidden=true;});
  $('aiBudgetForm').addEventListener('submit',e=>{
    e.preventDefault();try{
      const id=$('aiBudgetAccount').value,slot=core.slots.find(s=>s.id===id),windows=[];
      for(const kind of ['session','weekly','daily']){const used=$(`budget-${kind}-used`).value.trim(),reset=$(`budget-${kind}-reset`).value;if(used===''&&reset==='')continue;if(used==='')throw Error('회복 시각과 함께 사용률을 입력해 주세요.');windows.push({kind,usedPercent:Number(used),resetsAt:reset?new Date(reset+':00+09:00').toISOString():null});}
      if(!windows.length)throw Error('확인한 사용률을 한 개 이상 입력해 주세요.');
      const a={id,provider:slot.provider,source:'manual',observedAt:new Date().toISOString(),windows};
      sequence++;refreshFailed=false;collectorStatus='';save(core.merge(summary,{schemaVersion:1,accounts:[a]}));$('aiBudgetEditor').hidden=true;notify('직접 기록한 사용량을 저장했습니다. 자동 조회 정보와 구분해 표시합니다.');
    }catch(err){notify(err.message);}
  });
  $('aiBudgetImport').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{if(file.size>65536)throw Error('사용량 요약은 64KB 이하 파일만 가져올 수 있습니다.');const incoming=core.normalizeImport(JSON.parse(await file.text()));sequence++;refreshFailed=false;collectorStatus='';save(core.merge(summary,incoming));notify('요약을 가져왔습니다. 더 오래된 계정 정보는 기존 값으로 보존했습니다.');}catch(err){notify(err.message||'파일을 확인해 주세요.');}finally{e.target.value='';}
  });
  $('aiBudgetExport').addEventListener('click',()=>{
    const exported=core.normalize(summary);exported.accounts.forEach(a=>{a.fingerprint=null;});const url=URL.createObjectURL(new Blob([JSON.stringify(exported,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='hani-ai-budget-summary.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('사용량과 조회 시각만 내보냈습니다. 계정 로그인 정보는 포함하지 않습니다.');
  });
  setInterval(()=>{if(section.classList.contains('active')||$('home')?.classList.contains('active'))render();},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&(section.classList.contains('active')||$('home')?.classList.contains('active')))render();});
  window.HaniAiBudget=Object.freeze({render});render();
})();
