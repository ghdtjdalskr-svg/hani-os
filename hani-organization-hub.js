/* Organization Hub: static, read-only presentation. No app state or storage access. */
(() => {
  'use strict';
  // One title id shared by the person and team dialogs (only one is open at a time).
  const DETAIL_TITLE_OPEN='<h2 id="ogh-detail-title">';
  const root = document.getElementById('haniOrganizationHub');
  if (!root || root.dataset.mounted) return;
  root.dataset.mounted = 'true';
  const teams = [
    {id:'strategy',name:'전략기획실',en:'STRATEGY',color:'#685486',tint:'#eee7f4',symbol:'✳',line:'그룹 전략과 실행 우선순위를 설계합니다.',tags:['전략','조율','운영'],mood:'전체를 보면서, 작은 맥락도 놓치지 않습니다.',collab:'모든 팀의 전문성을 연결하는 운영 허브',scene:'ai-approval-boardroom-v1.webp'},
    {id:'platform',name:'AI플랫폼개발실',en:'AI PLATFORM',color:'#43637f',tint:'#e6edf3',symbol:'⌘',line:'AI 제품과 자동화 시스템을 개발합니다.',tags:['개발','QA','자동화'],mood:'아이디어보다 한 걸음 더. 실제로 작동하게.',collab:'전략기획실과 제품화 · 히나와 사용자 관점 검수',scene:'development-studio-v1.webp'},
    {id:'finance',name:'재무자산관리실',en:'FINANCE',color:'#836445',tint:'#f2e9db',symbol:'◈',line:'자산과 현금흐름을 통합 관리합니다.',tags:['자산','예산','소비'],mood:'숫자 뒤에 있는 선택의 이유까지 살핍니다.',collab:'라이프&엔터테인먼트와 생활 계획·예산 조율',scene:'investment-market-room-v1.webp'},
    {id:'life',name:'라이프&엔터테인먼트',en:'LIFE & CULTURE',color:'#42675e',tint:'#e5eee7',symbol:'❋',line:'건강·학습·문화 경험을 지원합니다.',tags:['건강','학습','경험'],mood:'가장 자유로워 보이지만, 회장 케어 최전선.',collab:'재무자산관리실과 실행 계획 · 개발실과 학습 QA',scene:'travel-route-planning-v1.webp'},
    {id:'business',name:'기업솔루션사업부',en:'BUSINESS',color:'#815962',tint:'#f2e6e8',symbol:'↗',line:'고객 과제를 기술 솔루션으로 연결합니다.',tags:['B2B','제안','실행'],mood:'대화가 끝난 뒤에도, 다음 행동은 이어집니다.',collab:'전략기획실과 우선순위 · 개발실과 기술 검토',scene:'tasks-kanban-v1.webp'}
  ];
  const rows = [
    ['hani','하니','전무','strategy','전략 · 총괄','각자의 전문성이 한 방향으로 향하도록.','조율 · 오케스트레이션 · 의사결정','M9'],
    ['yuna','유나','사원','strategy','운영 · 안내','작은 요청도, 놓치지 않는 시작점.','안내 · 일정 · 연결','M9'],
    ['mir','MIR · 미르','AI 스페셜리스트','strategy','AI · 맥락/특수 지원','인간이 아닌 AI 동료로서, 흩어진 생각 사이의 연결점을 찾습니다.','맥락 · 탐색 · 독립 지원','AI STAFF'],
    ['seoyun','서윤','개발 리드','platform','Claude · 설계/통합','복잡한 요구를 명확한 설계로.','설계 · 통합 · 리뷰','AI STAFF'],
    ['dohyun','도연','개발 선임','platform','Codex · 구현/테스트','설계를 실제로 움직이는 코드로.','구현 · 테스트 · 개선','AI STAFF'],
    ['serin','세린','연구원','platform','Gemini · 분석/자동화','넓게 살피고, 반복은 줄입니다.','분석 · 리서치 · 자동화','AI STAFF'],
    ['yuri','유리','QA 책임','platform','품질 · 사전 검증','완료라는 말에, 확인의 근거를 더합니다.','검증 · 회귀 · 품질','AI STAFF'],
    ['arin','아린','UI/UX 선임','platform','사용성 · 디자인 리뷰','보기 좋은 것에서, 쓰기 좋은 것으로.','사용성 · 접근성 · 디자인','AI STAFF'],
    ['gaeun','뮤즈 · 가은','회장 비서','strategy','Muse · 일정/회의 지원','회장님의 생각이 다음 행동으로 이어지도록, 일정과 요청을 정리합니다.','일정 · 회의 준비 · 요청 정리 · 후속 확인','AI STAFF'],
    ['jieun','지은','부장','finance','재무 · 자산','오늘의 숫자에서 내일의 여유를 찾습니다.','예산 · 현금흐름 · 리스크','M9'],
    ['haru','하루','대리','finance','소비 · 구매 검토','갖고 싶은 것과 필요한 것 사이의 좋은 선택.','소비 판단 · 비교 · 구매','M9'],
    ['naeun','나은','차장','life','건강 · 루틴','지속할 수 있는 변화가 가장 좋은 변화.','건강 · 운동 · 일상','M9'],
    ['hina','히나','과장','life','학습 · 최종 리뷰','이해가 될 때까지, 한 번 더 살펴봅니다.','학습 · 검수 · 사용자 관점','M9'],
    ['minji','민지','대리','life','콘텐츠 · 문화','평범한 하루에도, 기억할 한 장면을.','콘텐츠 · 문화 · 기록','M9'],
    ['sooyeon','수연','주임','life','여행 · 스포츠','일상 밖에서 다음 에너지를 찾습니다.','여행 · 스포츠 · 경험','M9'],
    ['sua','수아','과장','business','B2B · 고객 대응','제안부터 후속 실행까지, 빈틈없이.','고객 · 제안 · 클라우드/CDN/보안','M9']
    ,['taeo','채원','솔루션 매니저','business','Claude · 기업 업무','고객 요구를 분석하고 제안과 후속 실행을 지원합니다.','B2B · 제안 · 기술 검토','AI STAFF']
  ];
  const people = rows.map(([id,name,rank,team,role,line,keywords,group])=>({id,name,rank,team,role,line,keywords,group})).sort((a,b)=>Number(b.group==='M9')-Number(a.group==='M9'));
  const teamOf = id => teams.find(t=>t.id===id);
  const leaders={strategy:'hani',platform:'seoyun',finance:'jieun',life:'naeun',business:'sua'};
  const leaderBadge=p=>leaders[p.team]===p.id?'<span class="ogh-leader-badge">팀장</span>':'';
  const members = id => people.filter(p=>p.team===id);
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Static portrait assets; labels remain real text for legibility and accessibility.
  const portrait = (p,cls='') => `<img class="ogh-portrait ${cls}" src="./assets/profiles/${p.group==='M9'?'hani-profile-'+p.id+'.webp':'hani-staff-'+p.id+(p.id==='seoyun'?'-v7.webp':'-v5.webp')}" alt="${p.name} · ${p.role}" loading="lazy" width="720" height="720">`;
  const avatar = p => `<button type="button" class="ogh-avatar" data-person="${p.id}" aria-label="${p.name} · ${p.role} 소개">${portrait(p)}<span class="ogh-nameplate"><strong>${p.name} ${leaderBadge(p)}</strong><small>${p.role}</small></span></button>`;
  const tags = items => `<div class="ogh-tags">${items.map(s=>`<span>${esc(s)}</span>`).join('')}</div>`;
  const scenePaths = {
    strategy:'./assets/team/hani-org-strategy-v1.webp',
    platform:'./assets/team/hani-org-platform-v1.webp',
    finance:'./assets/team/hani-org-finance-v1.webp',
    life:'./assets/team/hani-org-life-v1.webp',
    business:'./assets/team/hani-org-business-v1.webp'
  };
  const teamBanner = t => `<figure class="ogh-team-banner"><img src="${scenePaths[t.id]}" alt="${t.name}: ${members(t.id).map(p=>p.name).join(', ')}의 협업 장면" loading="lazy" width="1672" height="941"><figcaption><span>${t.en} / AT WORK</span><span>${members(t.id).map(p=>p.name).join(' · ')}</span></figcaption></figure>`;
  root.className='ogh';
  root.dataset.typography='tech';
  function renderTeamPanels(){
    return `<div class="ogh-team-tabs" role="tablist" aria-label="팀별 소개">${teams.map((t,i)=>`<button type="button" role="tab" id="ogh-tab-${t.id}" aria-controls="ogh-panel-${t.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-team-tab="${t.id}"><span>0${i+1}</span>${t.name}</button>`).join('')}</div>
      <div class="ogh-team-panels">${teams.map((t,i)=>`<article class="ogh-team-panel" id="ogh-panel-${t.id}" role="tabpanel" aria-labelledby="ogh-tab-${t.id}" tabindex="0" ${i===0?'':'hidden'} style="--team:${t.color};--tint:${t.tint}">
        ${teamBanner(t)}
        <div class="ogh-panel-summary"><div><span class="ogh-kicker">${t.en}</span><h3>${t.name}</h3><p>${t.line}</p>${tags(t.tags)}</div><span class="ogh-panel-index" aria-hidden="true">0${i+1}</span></div>
        <div class="ogh-panel-meta"><span>TEAM MEMBERS / ${String(members(t.id).length).padStart(2,'0')}</span><p>${t.collab}</p></div>
        <div class="ogh-panel-members">${members(t.id).map(p=>`<div class="ogh-panel-member">${avatar(p)}<small>${p.rank}</small><p>${p.role}</p></div>`).join('')}</div>
      </article>`).join('')}</div>`;
  }
  root.innerHTML = `
    <header class="ogh-mast"><span class="ogh-wordmark">HANI GROUP</span><nav aria-label="조직 소개 섹션"><button type="button" data-scroll="ogh-chart">Organization</button><button type="button" data-scroll="ogh-teams">Teams</button><button type="button" data-scroll="ogh-people">People</button></nav><span class="ogh-edition">ORGANIZATION / PEOPLE / TECHNOLOGY</span></header>
    <section class="ogh-hero" aria-labelledby="ogh-title"><div class="ogh-hero-copy"><span class="ogh-kicker">HANI GROUP / PERSONAL AI COMPANY</span><h1 id="ogh-title">사람의 전문성.<br><em>AI의 실행력.</em></h1><p>전략, 기술, 재무, 라이프, 비즈니스.<br>다섯 전문 조직을 하나의 AI 운영 체계로 연결합니다.</p><button type="button" class="ogh-cta" data-scroll="ogh-chart">조직 구조 살펴보기 <span>↘</span></button><div class="ogh-signature">HANI GROUP <span>Expertise. Technology. Execution.</span></div></div><figure class="ogh-hero-art"><img src="./assets/team/hani-org-demo-day-v1.webp" alt="M9 아홉 멤버가 제품 시연 현장에서 발표·기록·검토하는 협업 장면" width="1439" height="810"><figcaption><span>INSIDE HANI / DEMO DAY</span><span>M9 · IN ACTION</span></figcaption><span class="ogh-seal" aria-hidden="true">ONE<br>TEAM<br>✳</span></figure></section>
    <div class="ogh-strip"><span>01 — STRATEGY</span><span>02 — TECHNOLOGY</span><span>03 — FINANCE</span><span>04 — LIFE</span><span>05 — BUSINESS</span></div>
    <section id="ogh-chart" class="ogh-section" aria-labelledby="ogh-chart-title"><div class="ogh-section-head"><div><span class="ogh-kicker">01 / ORGANIZATION</span><h2 id="ogh-chart-title">하나의 그룹. 다섯 전문 조직.</h2></div><p>다섯 전문 조직, 같은 방향.<br>팀과 얼굴을 눌러 만나보세요.</p></div><div class="ogh-org"><div class="ogh-chair"><img class="ogh-chair-icon" src="./assets/team/hani-org-chair-v1.webp" alt="성민 회장 실루엣" width="80" height="80"><div><small>CHAIRMAN</small><strong>성민 <span>회장</span></strong></div><span class="ogh-chair-note">방향과 최종 의사결정</span></div><div class="ogh-branches">${teams.map((t,i)=>`<article class="ogh-node" style="--team:${t.color};--tint:${t.tint}"><button type="button" class="ogh-node-title" data-team="${t.id}" aria-label="${t.name} 팀 소개"><span class="ogh-node-symbol" aria-hidden="true">${t.symbol}</span><small>0${i+1} / ${t.en}</small><h3>${t.name}</h3><span class="ogh-node-arrow" aria-hidden="true">↗</span></button><div class="ogh-node-people">${members(t.id).map(avatar).join('')}</div></article>`).join('')}</div><div class="ogh-org-foot"><span><i></i> M9 · 기존 캐릭터</span><span><i class="ogh-dashed"></i> AI STAFF · 확장 배치안</span><span>히나 ↔ AI플랫폼개발실 <b>학습 QA · 사용자 관점 연결</b></span></div></div></section>
    <section id="ogh-teams" class="ogh-section" aria-labelledby="ogh-teams-title"><div class="ogh-section-head"><div><span class="ogh-kicker">02 / OUR TEAMS</span><h2 id="ogh-teams-title">Teams & capabilities</h2></div><p>팀을 선택해 역할과 구성원을 확인하세요.</p></div>${renderTeamPanels()}</section>
    <section id="ogh-people" class="ogh-section" aria-labelledby="ogh-people-title"><div class="ogh-section-head"><div><span class="ogh-kicker">03 / OUR PEOPLE</span><h2 id="ogh-people-title">People at HANI</h2></div><p>전문 분야별 핵심 인력과 AI 파트너</p></div><div class="ogh-controls"><div class="ogh-filters" role="group" aria-label="인원 구분">${['ALL','M9','AI STAFF'].map((g,i)=>`<button type="button" data-group="${g}" aria-pressed="${i===0}">${g}</button>`).join('')}</div><label class="ogh-select-label"><span>팀</span><select id="ogh-team-filter" aria-label="팀별 보기"><option value="all">모든 팀</option>${teams.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select></label><label class="ogh-search-label"><span aria-hidden="true">⌕</span><input id="ogh-search" type="search" placeholder="이름, 역할 검색" aria-label="이름 또는 역할 검색" maxlength="100"></label></div><div class="ogh-result-line"><span id="ogh-count" role="status" aria-live="polite"></span><span>신규 AI 이름·역할은 Preview 제안안입니다.</span></div><div class="ogh-people-grid">${people.map(p=>{const t=teamOf(p.team);return `<button type="button" class="ogh-person" data-person="${p.id}" data-card-person="${p.id}" style="--team:${t.color};--tint:${t.tint}"><div class="ogh-person-image">${portrait(p)}<span class="ogh-person-badge">${p.group==='M9'?'M9':'AI · 제안'}</span><span class="ogh-person-arrow" aria-hidden="true">↗</span></div><div class="ogh-person-caption"><small>${t.name}</small><h3>${p.name}<span>${p.rank}</span></h3><p>${p.role}</p></div></button>`;}).join('')}</div><div class="ogh-empty" hidden><p>조건에 맞는 팀원이 없습니다.</p><button type="button" data-reset>전체 팀원 보기</button></div></section>
    <footer class="ogh-footer"><span class="ogh-wordmark">HANI GROUP</span><p>Expertise. Technology. Execution.</p><span>ORGANIZATION HUB · DESIGN PREVIEW</span></footer>
    <dialog class="ogh-dialog" aria-labelledby="ogh-detail-title"><button type="button" class="ogh-close" aria-label="소개 닫기">×</button><div class="ogh-detail"></div></dialog>`;
  const dialog=root.querySelector('dialog'), detail=root.querySelector('.ogh-detail');
  root.querySelectorAll('.ogh-node').forEach((node,i)=>node.dataset.department=teams[i].id);
  const directory=root.querySelector('#ogh-people');
  const directoryLayout=document.createElement('div');directoryLayout.className='ogh-directory-layout';
  const teamRail=document.createElement('nav');teamRail.className='ogh-team-rail';teamRail.setAttribute('aria-label','인원 목록 팀 필터');
  teamRail.innerHTML='<span class="ogh-kicker">TEAMS</span><button type="button" data-filter-team="all" aria-pressed="true"><span class="ogh-rail-icon" aria-hidden="true">⊞</span><span>모든 팀<small>17 PEOPLE</small></span></button>'+teams.map(t=>`<button type="button" data-filter-team="${t.id}" aria-pressed="false" style="--team:${t.color};--tint:${t.tint}"><span class="ogh-rail-icon" aria-hidden="true">${t.symbol}</span><span>${t.name}<small>${members(t.id).length} PEOPLE</small></span></button>`).join('');
  const directoryMain=document.createElement('div');directoryMain.className='ogh-directory-main';
  ['.ogh-controls','.ogh-result-line','.ogh-people-grid','.ogh-empty'].forEach(s=>directoryMain.append(directory.querySelector(s)));
  directoryLayout.append(teamRail,directoryMain);directory.append(directoryLayout);
  people.forEach(p=>{if(leaders[p.team]===p.id)root.querySelector('[data-card-person="'+p.id+'"] .ogh-person-caption h3').insertAdjacentHTML('beforeend',leaderBadge(p));});
  const typeControls=document.createElement('div');
  typeControls.className='ogh-type-controls';
  typeControls.innerHTML='<span>TYPOGRAPHY / 제목 스타일</span><div role="group" aria-label="제목 글꼴 스타일"><button type="button" data-typography="tech" aria-pressed="true">테크</button><button type="button" data-typography="editorial" aria-pressed="false">에디토리얼</button><button type="button" data-typography="classic" aria-pressed="false">클래식</button></div><small>현재 화면에만 적용</small>';
  root.querySelector('.ogh-mast').after(typeControls);
  const search=root.querySelector('#ogh-search'), select=root.querySelector('#ogh-team-filter');
  let group='ALL';
  function filterPeople() {
    const query=search.value.trim().toLocaleLowerCase();
    let count=0;
    for (const p of people) {
      const match=(group==='ALL'||p.group===group)&&(select.value==='all'||p.team===select.value)&&`${p.name} ${p.role} ${p.rank} ${p.keywords} ${teamOf(p.team).name}`.toLocaleLowerCase().includes(query);
      root.querySelector(`[data-card-person="${p.id}"]`).hidden=!match;
      if(match) count++;
    }
    root.querySelector('#ogh-count').textContent=`${String(count).padStart(2,'0')} PEOPLE`;
    root.querySelector('.ogh-empty').hidden=count!==0;
    root.querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===group)));
    teamRail.querySelectorAll('[data-filter-team]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filterTeam===select.value)));
  }
  function showDetail(type,id) {
    const item=(type==='person'?people:teams).find(x=>x.id===id);
    if(!item) return;
    const t=type==='person'?teamOf(item.team):item;
    dialog.style.setProperty('--team',t.color);dialog.style.setProperty('--tint',t.tint);
    detail.innerHTML=type==='person'
      ? `<div class="ogh-detail-portrait">${portrait(item)}</div><div class="ogh-detail-copy"><span class="ogh-kicker">${item.group} / ${t.en}</span>${DETAIL_TITLE_OPEN}${item.name} <small>${item.rank}</small></h2><p class="ogh-detail-role">${item.role}</p><p class="ogh-detail-line">${item.line}</p>${tags(item.keywords.split(' · '))}<p class="ogh-detail-note">${item.group==='M9'?'기존 캐릭터 이미지와 직급을 유지합니다.':'신규 이름·역할은 제안안입니다. 프로필은 M9 그림체를 바탕으로 개별 설계한 시안입니다.'}</p><button type="button" class="ogh-detail-link" data-team="${t.id}">${t.name} 소개 ↗</button></div>`
      : `${teamBanner(t)}<div class="ogh-detail-copy"><span class="ogh-kicker">${t.en}</span>${DETAIL_TITLE_OPEN}${t.name}</h2><p class="ogh-detail-line">${t.line}</p>${tags(t.tags)}<p>${t.mood}</p><p class="ogh-detail-note">${t.collab}</p><div class="ogh-detail-members">${members(t.id).map(avatar).join('')}</div></div>`;
    if(!dialog.open) dialog.showModal();
    root.querySelector('.ogh-close').focus();
  }
  function selectTeam(id,focus=false){
    root.querySelectorAll('[data-team-tab]').forEach(tab=>{
      const selected=tab.dataset.teamTab===id;
      tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
      root.querySelector('#ogh-panel-'+tab.dataset.teamTab).hidden=!selected;
      if(selected&&focus)tab.focus();
    });
  }
  root.querySelector('.ogh-team-tabs').addEventListener('keydown',e=>{
    const tabs=[...root.querySelectorAll('[data-team-tab]')],index=tabs.indexOf(e.target);
    if(index<0)return;
    let next;
    if(e.key==='ArrowRight')next=(index+1)%tabs.length;
    else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
    else if(e.key==='Home')next=0;
    else if(e.key==='End')next=tabs.length-1;
    else return;
    e.preventDefault();selectTeam(tabs[next].dataset.teamTab,true);
  });
  root.addEventListener('click',e=>{
    const button=e.target.closest('button'); if(!button||!root.contains(button))return;
    if(button.matches('.ogh-close'))dialog.close();
    else if(button.dataset.typography){
      root.dataset.typography=button.dataset.typography;
      typeControls.querySelectorAll('[data-typography]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    }
    else if(button.dataset.teamTab)selectTeam(button.dataset.teamTab);
    else if(button.dataset.person)showDetail('person',button.dataset.person);
    else if(button.dataset.team)showDetail('team',button.dataset.team);
    else if(button.dataset.scroll)root.querySelector(`#${button.dataset.scroll}`).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    else if(button.dataset.group){group=button.dataset.group;filterPeople();}
    else if(button.dataset.filterTeam){select.value=button.dataset.filterTeam;filterPeople();}
    else if(button.hasAttribute('data-reset')){group='ALL';search.value='';select.value='all';filterPeople();}
  });
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  search.addEventListener('input',filterPeople);select.addEventListener('change',filterPeople);
  filterPeople();
})();
