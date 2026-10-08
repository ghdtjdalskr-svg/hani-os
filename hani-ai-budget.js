(function(){
  'use strict';
  const core=window.HaniAiBudgetCore,KEY='hani_ai_budget_summary_v1';
  const section=document.getElementById('aiBudget');if(!core||!section)return;
  let summary={schemaVersion:1,accounts:[]},busy=false,memoryOnly=false,sequence=0;
  const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=v=>v?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(v)):'확인 불가';
  const source={ 'codex-app-server':'Codex 공식 조회','codex-app':'Codex 앱 조회','claude-statusline':'Claude Code 제공','official-screen':'공식 화면 확인','gemini-cli':'Gemini CLI 세션','manual':'직접 기록'};
  const states={unknown:'확인 불가',expired:'회복 시각 경과 · 재조회 필요',stale:'갱신 필요',limited:'한도 도달',low:'잔여 한도 적음',fresh:'최근 확인'};
  const kinds={session:'세션 한도',weekly:'주간 한도',daily:'일간 한도',other:'기타 한도'};
  function countdown(v){if(!v)return '회복 시각 확인 불가';const n=Date.parse(v)-Date.now();if(n<=0)return '시각 경과 · 실제 회복 확인 필요';const min=Math.ceil(n/60000),day=Math.floor(min/1440),h=Math.floor(min%1440/60),m=min%60;return `${day?day+'일 ':''}${h?h+'시간 ':''}${m}분 남음`;}
  function notify(message){$('aiBudgetNotice').textContent=message;}
  function save(next){summary=core.normalize(next);try{localStorage.setItem(KEY,JSON.stringify(summary));memoryOnly=false;}catch(_){memoryOnly=true;}render();}
  try{const raw=localStorage.getItem(KEY);if(raw)summary=core.normalize(JSON.parse(raw));}catch(_){notify('저장된 사용량 요약을 읽지 못했습니다. 원본은 그대로 두고 새 조회를 기다립니다.');}
  function render(){
    const count=summary.accounts.filter(a=>a.windows.some(w=>['fresh','low','limited'].includes(core.windowState(a,w)))).length;
    $('aiBudgetConnected').textContent=`${count} / 4`;
    $('aiBudgetSaveState').textContent=memoryOnly?'현재 화면에만 보관 중 · 요약 내보내기로 보관해 주세요.':'사용량 요약은 이 브라우저에 보관합니다. 생활 기록과 별도로 관리합니다.';
    $('aiBudgetCards').innerHTML=core.slots.map(slot=>{
      const a=summary.accounts.find(x=>x.id===slot.id);
      const windows=a?.windows?.length?a.windows:[{kind:slot.provider==='gemini'?'daily':'weekly',usedPercent:null,resetsAt:null}];
      return `<article class="budget-account card" data-budget-slot="${slot.id}"><div class="budget-account-head"><div><span class="eyebrow">${slot.provider.toUpperCase()}</span><h3>${slot.label}</h3></div><span class="budget-symbol">${slot.provider==='codex'?'⌘':slot.provider==='claude'?'✳':'✦'}</span></div>${windows.map(w=>{const status=core.windowState(a,w),live=['fresh','low','limited'].includes(status),value=w.usedPercent;return `<div class="budget-window ${status}"><div class="budget-window-head"><b>${kinds[w.kind]}</b><span>${states[status]}</span></div><div class="budget-value">${value==null?'—':esc(100-value)+'%'}<small>${value==null?'아직 확인하지 않았어요':live?'남음':'지난 조회의 잔여율'}</small></div><div class="budget-meter" ${value==null?'':'role="meter" aria-label="'+kinds[w.kind]+' 사용률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+value+'"'}><i style="width:${value??0}%"></i></div><p>${value==null?'실제 확인 전에는 0%로 표시하지 않습니다.':'사용 '+value+'% · '+esc(countdown(w.resetsAt))}</p><p>회복 예정 ${date(w.resetsAt)} <small>(한국 시간)</small></p></div>`;}).join('')}${a?.tokens?.value!=null?`<p class="budget-token">${a.tokens.scope==='session'?'현재 CLI 세션 토큰':'제공된 누적 토큰'} <b>${a.tokens.value.toLocaleString('ko-KR')}</b><br><small>구독의 남은 토큰 수와는 다릅니다.</small></p>`:''}<p class="sub budget-source">${a?`${source[a.source]} · 마지막 확인 ${date(a.observedAt)}`:'연결 또는 기록 대기'}</p><div class="budget-actions"><button type="button" class="btn sm" data-budget-edit="${slot.id}">사용량 기록</button><a class="btn sm" href="${slot.url}" target="_blank" rel="noopener noreferrer">공식 화면 ↗</a></div></article>`;
    }).join('');
  }
  function openEditor(id){
    $('aiBudgetAccount').value=id;const a=summary.accounts.find(x=>x.id===id);
    for(const kind of ['session','weekly','daily']){const w=a?.windows.find(w=>w.kind===kind);$(`budget-${kind}-used`).value=w?.usedPercent??'';$(`budget-${kind}-reset`).value=w?.resetsAt?new Date(Date.parse(w.resetsAt)+9*3600000).toISOString().slice(0,16):'';}
    $('aiBudgetEditor').hidden=false;$('aiBudgetAccount').focus();
  }
  async function refresh(){
    if(busy)return;busy=true;const epoch=++sequence;$('aiBudgetRefresh').disabled=true;notify('이 PC의 사용량 연결을 확인 중입니다…');
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
    try{
      const res=await fetch('http://127.0.0.1:8794/api/ai-budget',{method:'GET',cache:'no-store',credentials:'omit',headers:{'X-Hani-Ai-Budget':'read-only-v1'},signal:controller.signal});
      if(!res.ok)throw Error('연결 실패');const raw=await res.text();if(raw.length>65536)throw Error('큰 응답');
      const payload=JSON.parse(raw),next=core.normalize(payload);
      if(epoch!==sequence)return;save(core.merge(summary,next));
      notify(payload.collectorStatus&&payload.collectorStatus!=='ready'?'Codex의 새 사용량 조회를 완료하지 못했습니다. 보관된 요약만 가져왔으니 마지막 확인 시각을 확인해 주세요.':next.accounts.length?'가져온 사용량을 반영했습니다. 각 카드의 조회 시각을 확인해 주세요.':'연결된 사용량이 없습니다. 계정 연결 또는 공식 화면 기록을 기다립니다.');
    }catch(_){if(epoch===sequence)notify('이 PC의 사용량 연결에 닿지 못했습니다. 기존 요약은 보존했습니다. 휴대폰에서는 요약 파일 가져오기 또는 직접 기록을 사용할 수 있습니다.');}
    finally{clearTimeout(timeout);busy=false;$('aiBudgetRefresh').disabled=false;}
  }
  section.addEventListener('click',e=>{const b=e.target.closest('[data-budget-edit]');if(b)openEditor(b.dataset.budgetEdit);});
  $('aiBudgetRefresh').addEventListener('click',refresh);
  $('aiBudgetCancel').addEventListener('click',()=>{$('aiBudgetEditor').hidden=true;});
  $('aiBudgetForm').addEventListener('submit',e=>{
    e.preventDefault();try{
      const id=$('aiBudgetAccount').value,slot=core.slots.find(s=>s.id===id),windows=[];
      for(const kind of ['session','weekly','daily']){const used=$(`budget-${kind}-used`).value.trim(),reset=$(`budget-${kind}-reset`).value;if(used===''&&reset==='')continue;if(used==='')throw Error('회복 시각과 함께 사용률을 입력해 주세요.');windows.push({kind,usedPercent:Number(used),resetsAt:reset?new Date(reset+':00+09:00').toISOString():null});}
      if(!windows.length)throw Error('확인한 사용률을 한 개 이상 입력해 주세요.');
      const a={id,provider:slot.provider,source:'manual',observedAt:new Date().toISOString(),windows};
      sequence++;save(core.merge(summary,{schemaVersion:1,accounts:[a]}));$('aiBudgetEditor').hidden=true;notify('직접 기록한 사용량을 저장했습니다. 자동 조회 정보와 구분해 표시합니다.');
    }catch(err){notify(err.message);}
  });
  $('aiBudgetImport').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{if(file.size>65536)throw Error('사용량 요약은 64KB 이하 파일만 가져올 수 있습니다.');const incoming=core.normalize(JSON.parse(await file.text()));sequence++;save(core.merge(summary,incoming));notify('요약을 가져왔습니다. 더 오래된 계정 정보는 기존 값으로 보존했습니다.');}catch(err){notify(err.message||'파일을 확인해 주세요.');}finally{e.target.value='';}
  });
  $('aiBudgetExport').addEventListener('click',()=>{
    const exported=core.normalize(summary);exported.accounts.forEach(a=>{a.fingerprint=null;});const url=URL.createObjectURL(new Blob([JSON.stringify(exported,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='hani-ai-budget-summary.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('사용량과 조회 시각만 내보냈습니다. 계정 로그인 정보는 포함하지 않습니다.');
  });
  setInterval(()=>{if(section.classList.contains('active'))render();},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&section.classList.contains('active'))render();});
  window.HaniAiBudget=Object.freeze({render});render();
})();
