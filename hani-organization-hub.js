/* Organization Hub: static, read-only presentation. No app state or storage access. */
(() => {
  'use strict';
  const root = document.getElementById('haniOrganizationHub');
  if (!root || root.dataset.mounted) return;
  root.dataset.mounted = 'true';
  const teams = [
    {id:'strategy',name:'전략기획실',en:'STRATEGY',color:'#685486',tint:'#eee7f4',symbol:'✳',line:'생각을 방향으로. 방향을 실행으로.',tags:['전략','조율','운영'],mood:'전체를 보면서, 작은 맥락도 놓치지 않습니다.',collab:'모든 팀의 전문성을 연결하는 운영 허브',scene:'ai-approval-boardroom-v1.webp'},
    {id:'platform',name:'AI플랫폼개발실',en:'AI PLATFORM',color:'#43637f',tint:'#e6edf3',symbol:'⌘',line:'가능성을, 작동하는 제품으로.',tags:['개발','QA','자동화'],mood:'아이디어보다 한 걸음 더. 실제로 작동하게.',collab:'전략기획실과 제품화 · 히나와 사용자 관점 검수',scene:'development-studio-v1.webp'},
    {id:'finance',name:'재무자산관리실',en:'FINANCE',color:'#836445',tint:'#f2e9db',symbol:'◈',line:'더 나은 선택에는, 탄탄한 기준이.',tags:['자산','예산','소비'],mood:'숫자 뒤에 있는 선택의 이유까지 살핍니다.',collab:'라이프&엔터테인먼트와 생활 계획·예산 조율',scene:'investment-market-room-v1.webp'},
    {id:'life',name:'라이프&엔터테인먼트',en:'LIFE & CULTURE',color:'#42675e',tint:'#e5eee7',symbol:'❋',line:'잘 사는 일도, 우리 팀의 일.',tags:['건강','학습','경험'],mood:'가장 자유로워 보이지만, 회장 케어 최전선.',collab:'재무자산관리실과 실행 계획 · 개발실과 학습 QA',scene:'travel-route-planning-v1.webp'},
    {id:'business',name:'기업솔루션사업부',en:'BUSINESS',color:'#815962',tint:'#f2e6e8',symbol:'↗',line:'좋은 제안을, 확실한 다음 단계로.',tags:['B2B','제안','실행'],mood:'대화가 끝난 뒤에도, 다음 행동은 이어집니다.',collab:'전략기획실과 우선순위 · 개발실과 기술 검토',scene:'tasks-kanban-v1.webp'}
  ];
  const rows = [
    ['hani','하니','전무','strategy','전략 · 총괄','각자의 전문성이 한 방향으로 향하도록.','조율 · 오케스트레이션 · 의사결정','M9'],
    ['yuna','유나','사원','strategy','운영 · 안내','작은 요청도, 놓치지 않는 시작점.','안내 · 일정 · 연결','M9'],
    ['mir','미르','스페셜리스트','strategy','맥락 · 특수 지원','흩어진 생각 사이에서 연결점을 찾습니다.','맥락 · 탐색 · 독립 지원','AI STAFF'],
    ['seoyun','서윤','개발 리드','platform','Claude · 설계/통합','복잡한 요구를 명확한 설계로.','설계 · 통합 · 리뷰','AI STAFF'],
    ['dohyun','도현','개발 선임','platform','Codex · 구현/테스트','설계를 실제로 움직이는 코드로.','구현 · 테스트 · 개선','AI STAFF'],
    ['serin','세린','연구원','platform','Gemini · 분석/자동화','넓게 살피고, 반복은 줄입니다.','분석 · 리서치 · 자동화','AI STAFF'],
    ['yuri','유리','QA 책임','platform','품질 · 사전 검증','완료라는 말에, 확인의 근거를 더합니다.','검증 · 회귀 · 품질','AI STAFF'],
    ['arin','아린','UI/UX 선임','platform','사용성 · 디자인 리뷰','보기 좋은 것에서, 쓰기 좋은 것으로.','사용성 · 접근성 · 디자인','AI STAFF'],
    ['gaeun','가은','비주얼 스페셜리스트','platform','Muse · 비주얼','같은 이야기에도, 더 좋은 인상이 있도록.','브랜딩 · 이미지 · 비주얼','AI STAFF'],
    ['jieun','지은','부장','finance','재무 · 자산','오늘의 숫자에서 내일의 여유를 찾습니다.','예산 · 현금흐름 · 리스크','M9'],
    ['haru','하루','대리','finance','소비 · 구매 검토','갖고 싶은 것과 필요한 것 사이의 좋은 선택.','소비 판단 · 비교 · 구매','M9'],
    ['naeun','나은','차장','life','건강 · 루틴','지속할 수 있는 변화가 가장 좋은 변화.','건강 · 운동 · 일상','M9'],
    ['hina','히나','과장','life','학습 · 최종 리뷰','이해가 될 때까지, 한 번 더 살펴봅니다.','학습 · 검수 · 사용자 관점','M9'],
    ['minji','민지','대리','life','콘텐츠 · 문화','평범한 하루에도, 기억할 한 장면을.','콘텐츠 · 문화 · 기록','M9'],
    ['sooyeon','수연','주임','life','여행 · 스포츠','일상 밖에서 다음 에너지를 찾습니다.','여행 · 스포츠 · 경험','M9'],
    ['sua','수아','과장','business','B2B · 고객 대응','제안부터 후속 실행까지, 빈틈없이.','고객 · 제안 · 클라우드/CDN/보안','M9']
  ];
  const people = rows.map(([id,name,rank,team,role,line,keywords,group])=>({id,name,rank,team,role,line,keywords,group})).sort((a,b)=>Number(b.group==='M9')-Number(a.group==='M9'));
  const teamOf = id => teams.find(t=>t.id===id);
  const members = id => people.filter(p=>p.team===id);
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const portrait = (p,cls='') => p.group==='M9'
    ? `<img class="ogh-portrait ${cls}" src="./assets/profiles/hani-profile-${p.id}.webp" alt="${p.name} 프로필" loading="lazy" width="360" height="440">`
    : `<span class="ogh-placeholder ${cls}" role="img" aria-label="${p.name} 프로필 이미지 준비 중"><span>${p.name.slice(0,1)}</span><small>PORTRAIT PENDING</small></span>`;
  const avatar = p => `<button type="button" class="ogh-avatar" data-person="${p.id}" aria-label="${p.name} ${p.rank} 소개">${portrait(p)}<span>${p.name}</span></button>`;
  const tags = items => `<div class="ogh-tags">${items.map(s=>`<span>${esc(s)}</span>`).join('')}</div>`;
  root.className='ogh';
  root.innerHTML = `
    <header class="ogh-mast"><span class="ogh-wordmark">HANI GROUP</span><nav aria-label="조직 소개 섹션"><button type="button" data-scroll="ogh-chart">Organization</button><button type="button" data-scroll="ogh-teams">Teams</button><button type="button" data-scroll="ogh-people">People</button></nav><span class="ogh-edition">THE PEOPLE EDITION / 01</span></header>
    <section class="ogh-hero" aria-labelledby="ogh-title"><div class="ogh-hero-copy"><span class="ogh-kicker">PERSONAL LIFE. COLLECTIVE INTELLIGENCE.</span><h1 id="ogh-title">좋은 일상은,<br><em>좋은 팀</em>에서.</h1><p>아홉 명의 개성. 다섯 개의 전문성.<br>성민 회장의 더 나은 내일을 함께 설계합니다.</p><button type="button" class="ogh-cta" data-scroll="ogh-chart">우리의 연결 살펴보기 <span>↘</span></button><div class="ogh-signature">HANI GROUP <span>Since your next idea.</span></div></div><figure class="ogh-hero-art"><img src="./assets/team/hani-team-office.webp" alt="하니와 M9 아홉 멤버의 오피스 단체 사진" width="1439" height="810"><figcaption><span>MEET THE M9</span><span>서로 다른 우리가, 하나의 팀으로.</span></figcaption><span class="ogh-seal" aria-hidden="true">ONE<br>TEAM<br>✳</span></figure></section>
    <div class="ogh-strip"><span>01 — STRATEGY</span><span>02 — TECHNOLOGY</span><span>03 — FINANCE</span><span>04 — LIFE</span><span>05 — BUSINESS</span></div>
    <section id="ogh-chart" class="ogh-section" aria-labelledby="ogh-chart-title"><div class="ogh-section-head"><div><span class="ogh-kicker">01 / ORGANIZATION</span><h2 id="ogh-chart-title">위계보다, 연결.</h2></div><p>다섯 전문 조직, 같은 방향.<br>팀과 얼굴을 눌러 만나보세요.</p></div><div class="ogh-org"><div class="ogh-chair"><span class="ogh-chair-icon" aria-hidden="true">S</span><div><small>CHAIRMAN</small><strong>성민 <span>회장</span></strong></div><span class="ogh-chair-note">방향과 최종 의사결정</span></div><div class="ogh-branches">${teams.map((t,i)=>`<article class="ogh-node" style="--team:${t.color};--tint:${t.tint}"><button type="button" class="ogh-node-title" data-team="${t.id}" aria-label="${t.name} 팀 소개"><span class="ogh-node-symbol" aria-hidden="true">${t.symbol}</span><small>0${i+1} / ${t.en}</small><h3>${t.name}</h3><span class="ogh-node-arrow" aria-hidden="true">↗</span></button><div class="ogh-node-people">${members(t.id).map(avatar).join('')}</div></article>`).join('')}</div><div class="ogh-org-foot"><span><i></i> M9 · 기존 캐릭터</span><span><i class="ogh-dashed"></i> AI STAFF · 확장 배치안</span><span>히나 ↔ AI플랫폼개발실 <b>학습 QA · 사용자 관점 연결</b></span></div></div></section>
    <section id="ogh-teams" class="ogh-section" aria-labelledby="ogh-teams-title"><div class="ogh-section-head"><div><span class="ogh-kicker">02 / OUR TEAMS</span><h2 id="ogh-teams-title">각자의 무대.<br>하나의 가능성.</h2></div><p>전문성은 다르게.<br>함께 만드는 일상은 더 풍부하게.</p></div><div class="ogh-teams-grid">${teams.map((t,i)=>`<button type="button" class="ogh-team-card" data-team="${t.id}" style="--team:${t.color};--tint:${t.tint}" aria-label="${t.name} 자세히 보기"><div class="ogh-team-visual"><img src="./assets/banner-preview-v1/${t.scene}" alt="" loading="lazy" width="2172" height="724"><span class="ogh-team-number">0${i+1}</span><span class="ogh-team-open" aria-hidden="true">↗</span></div><div class="ogh-team-copy"><small>${t.en}</small><h3>${t.name}</h3><p>${t.line}</p><div class="ogh-team-bottom">${tags(t.tags)}<span class="ogh-tiny-faces" aria-hidden="true">${members(t.id).slice(0,3).map(p=>portrait(p)).join('')}</span></div></div></button>`).join('')}<div class="ogh-manifesto"><span class="ogh-kicker">THE WAY WE WORK</span><span class="ogh-flower" aria-hidden="true">✳</span><h3>좋은 연결이<br>좋은 결과를.</h3><p>M9의 캐릭터와 AI의 전문성.<br>역할은 나누고, 맥락은 함께합니다.</p></div></div></section>
    <section id="ogh-people" class="ogh-section" aria-labelledby="ogh-people-title"><div class="ogh-section-head"><div><span class="ogh-kicker">03 / OUR PEOPLE</span><h2 id="ogh-people-title">우리 팀을 소개합니다.</h2></div><p>함께할수록 선명해지는 개성.</p></div><div class="ogh-controls"><div class="ogh-filters" role="group" aria-label="인원 구분">${['ALL','M9','AI STAFF'].map((g,i)=>`<button type="button" data-group="${g}" aria-pressed="${i===0}">${g}</button>`).join('')}</div><label class="ogh-select-label"><span>팀</span><select id="ogh-team-filter" aria-label="팀별 보기"><option value="all">모든 팀</option>${teams.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select></label><label class="ogh-search-label"><span aria-hidden="true">⌕</span><input id="ogh-search" type="search" placeholder="이름, 역할 검색" aria-label="이름 또는 역할 검색" maxlength="100"></label></div><div class="ogh-result-line"><span id="ogh-count" role="status" aria-live="polite"></span><span>신규 AI 이름·역할은 Preview 제안안입니다.</span></div><div class="ogh-people-grid">${people.map(p=>{const t=teamOf(p.team);return `<button type="button" class="ogh-person" data-person="${p.id}" data-card-person="${p.id}" style="--team:${t.color};--tint:${t.tint}"><div class="ogh-person-image">${portrait(p)}<span class="ogh-person-badge">${p.group==='M9'?'M9':'AI · 제안'}</span><span class="ogh-person-arrow" aria-hidden="true">↗</span></div><div class="ogh-person-caption"><small>${t.name}</small><h3>${p.name}<span>${p.rank}</span></h3><p>${p.role}</p></div></button>`;}).join('')}</div><div class="ogh-empty" hidden><p>조건에 맞는 팀원이 없습니다.</p><button type="button" data-reset>전체 팀원 보기</button></div></section>
    <footer class="ogh-footer"><span class="ogh-wordmark">HANI GROUP</span><p>Different talents. Shared possibilities.</p><span>ORGANIZATION HUB · DESIGN PREVIEW</span></footer>
    <dialog class="ogh-dialog" aria-labelledby="ogh-detail-title"><button type="button" class="ogh-close" aria-label="소개 닫기">×</button><div class="ogh-detail"></div></dialog>`;
  const dialog=root.querySelector('dialog'), detail=root.querySelector('.ogh-detail');
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
  }
  function showDetail(type,id) {
    const item=(type==='person'?people:teams).find(x=>x.id===id);
    if(!item) return;
    const t=type==='person'?teamOf(item.team):item;
    dialog.style.setProperty('--team',t.color);dialog.style.setProperty('--tint',t.tint);
    detail.innerHTML=type==='person'
      ? `<div class="ogh-detail-portrait">${portrait(item)}</div><div class="ogh-detail-copy"><span class="ogh-kicker">${item.group} / ${t.en}</span><h2 id="ogh-detail-title">${item.name} <small>${item.rank}</small></h2><p class="ogh-detail-role">${item.role}</p><p class="ogh-detail-line">${item.line}</p>${tags(item.keywords.split(' · '))}<p class="ogh-detail-note">${item.group==='M9'?'기존 캐릭터 이미지와 직급을 유지합니다.':'신규 이름·역할은 제안안입니다. 캐릭터 바이블 및 프로필 이미지 확정 전입니다.'}</p><button type="button" class="ogh-detail-link" data-team="${t.id}">${t.name} 소개 ↗</button></div>`
      : `<div class="ogh-detail-scene"><img src="./assets/banner-preview-v1/${t.scene}" alt="${t.name} 업무 분위기 이미지"></div><div class="ogh-detail-copy"><span class="ogh-kicker">${t.en}</span><h2 id="ogh-detail-title">${t.name}</h2><p class="ogh-detail-line">${t.line}</p>${tags(t.tags)}<p>${t.mood}</p><p class="ogh-detail-note">${t.collab}</p><div class="ogh-detail-members">${members(t.id).map(avatar).join('')}</div><small class="ogh-detail-note">장면은 기존 HANI 이미지의 재사용이며 실제 소속은 위 멤버 기준입니다.</small></div>`;
    if(!dialog.open) dialog.showModal();
    root.querySelector('.ogh-close').focus();
  }
  root.addEventListener('click',e=>{
    const button=e.target.closest('button'); if(!button||!root.contains(button))return;
    if(button.matches('.ogh-close'))dialog.close();
    else if(button.dataset.person)showDetail('person',button.dataset.person);
    else if(button.dataset.team)showDetail('team',button.dataset.team);
    else if(button.dataset.scroll)root.querySelector(`#${button.dataset.scroll}`).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    else if(button.dataset.group){group=button.dataset.group;filterPeople();}
    else if(button.hasAttribute('data-reset')){group='ALL';search.value='';select.value='all';filterPeople();}
  });
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  search.addEventListener('input',filterPeople);select.addEventListener('change',filterPeople);
  filterPeople();
})();
