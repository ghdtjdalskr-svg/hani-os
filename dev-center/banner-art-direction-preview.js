(() => {
  'use strict';
  const previews = [
    {
      id:'investment',number:'01',menu:'투자',category:'재무',theme:'finance',
      eyebrow:'FINANCE · HANI INVESTMENT DESK',title:'투자 - HASDAQ BOARD',
      description:'시장 흐름과 계좌별 자산을 차분하게 읽는 투자 분석 공간입니다.',
      agent:'하니',role:'Investment Lead',avatar:'../assets/profiles/hani-profile-hani.webp',
      quote:'차트보다 먼저 흐름을 볼게요. 중요한 변화만 같이 확인해요.',
      scene:'../assets/banner-preview-v1/investment-market-room-v1.webp',sceneAlt:'하니와 지은이 현대적인 시장 분석실에서 투자 데이터를 검토하는 장면',
      characters:'HANI · JIEUN',assetStatus:'New Asset',assetNote:'신규 생성 · 메뉴 전용 Scene',accent:'#8065d2',soft:'#f0ecff',content:[['ACCOUNT SUMMARY','계좌별 자산'],['MONTHLY FLOW','월간 흐름'],['WATCHLIST','등록 종목']]
    },
    {
      id:'study',number:'02',menu:'공부',category:'성장',theme:'growth',
      eyebrow:'GROWTH · JAPANESE STUDY ROOM',title:'공부 - HINKEI 225',
      description:'일본 감성과 학습 목적이 함께 보이는 조용한 JLPT 공부 공간입니다.',
      agent:'히나',role:'Learning Mate',avatar:'../assets/profiles/hani-profile-hina.webp',
      quote:'예쁘게 시작해도 좋아. 오늘 외운 한 단어가 내일의 실력이야!',
      scene:'../assets/banner-preview-v1/study-jlpt-room-v1.webp',sceneAlt:'히나가 일본풍 서재에서 JLPT 문제집과 단어장을 펼쳐 공부하는 장면',
      characters:'HINA',assetStatus:'New Asset',assetNote:'확정 B안 기반 신규 생성',accent:'#c96d87',soft:'#fff0f4',content:[['TODAY','오늘의 학습'],['QUIZ','최근 제출'],['PROGRESS','정답률 추이']]
    },
    {
      id:'media',number:'03',menu:'시청 아카이브',category:'라이프',theme:'media',
      eyebrow:'LIFE · CINEMA ARCHIVE',title:'시청 아카이브 - CINEMA LOG',
      description:'영화와 드라마의 기억을 편안하게 쌓아두는 홈시네마 공간입니다.',
      agent:'민지',role:'Daily Mate',avatar:'../assets/profiles/hani-profile-minji.webp',
      quote:'좋았던 장면은 남겨두자. 다음에 다시 꺼내 볼 수 있게.',
      scene:'../assets/design-system-v1/hina-cinema-canonical.webp',sceneAlt:'민지와 동료들이 홈시네마에서 영화에 몰입해 감상하는 장면',
      characters:'MINJI · HINA · HARU',assetStatus:'Reuse + Crop',assetNote:'기존 canonical 자산 · 우측 중심 crop',accent:'#a94f73',soft:'#faedf3',scenePosition:'67% center',content:[['THIS MONTH','이번 달 감상'],['WATCHLIST','보고 싶은 작품'],['RECENT','최근 기록']]
    },
    {
      id:'diary',number:'04',menu:'일기',category:'라이프',theme:'diary',
      eyebrow:'LIFE · PERSONAL JOURNAL',title:'일기 - DAILY JOURNAL',
      description:'밤의 조용한 책상에서 오늘의 감정과 장면을 남기는 개인 공간입니다.',
      agent:'하루',role:'Daily Archive',avatar:'../assets/profiles/hani-profile-haru.webp',
      quote:'오늘을 다 설명하지 않아도 돼. 기억하고 싶은 것부터 적어보자.',
      scene:'../assets/banner-preview-v1/diary-night-desk-v1.webp',sceneAlt:'하루가 따뜻한 스탠드 아래 밤의 책상에서 일기를 쓰는 장면',
      characters:'HARU',assetStatus:'New Asset',assetNote:'신규 생성 · 메뉴 전용 Scene',accent:'#5878aa',soft:'#edf2fa',content:[['WRITE','오늘의 기록'],['ARCHIVE','나의 일기장'],['RECENT','최근 기록']]
    },
    {
      id:'approval',number:'05',menu:'AI 결재실',category:'성민 오피스',theme:'office',
      eyebrow:'OFFICE · HANI DECISION BOARD',title:'AI 결재실 - DECISION BOARD',
      description:'하니가 필요한 전문가를 불러 안건을 검토하고 결정을 준비하는 보드룸입니다.',
      agent:'하니',role:'Chief of Staff',avatar:'../assets/profiles/hani-profile-hani.webp',
      quote:'확인할 건 직원들이 확인하고, 결정할 건 대표가 결정합니다.',
      scene:'../assets/banner-preview-v1/ai-approval-boardroom-v1.webp',sceneAlt:'하니가 수아와 유나와 함께 안건을 검토하며 회의를 이끄는 보드룸 장면',
      characters:'HANI · SUA · YUNA',assetStatus:'New Asset',assetNote:'신규 생성 · 다인 대표 시안',accent:'#7058b8',soft:'#efebfb',content:[['REVIEW','검토 대기'],['APPROVED','승인 안건'],['HOLD','보류 안건']]
    }
  ];

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const banner=item=>`<section class="main-character-banner theme-${esc(item.theme)}" style="--scene-position:${esc(item.scenePosition||'center center')}" role="group" aria-label="${esc(item.menu)} 배너 시안">
    <figure class="main-character-banner__scene"><img src="${esc(item.scene)}" alt="${esc(item.sceneAlt)}" width="2172" height="724"></figure>
    <div class="main-character-banner__copy">
      <span class="banner-eyebrow">${esc(item.eyebrow)}</span>
      <h3 class="banner-title">${esc(item.title)}</h3>
      <p class="banner-description">${esc(item.description)}</p>
      <div class="banner-agent">
        <img src="${esc(item.avatar)}" alt="${esc(item.agent)} 프로필" width="720" height="720">
        <div class="banner-quote"><small>${esc(item.agent)} · ${esc(item.role)}</small><strong>“${esc(item.quote)}”</strong></div>
      </div>
    </div>
  </section>`;
  const contentPeek=item=>`<div class="content-peek" aria-label="${esc(item.menu)} 본문 시작 위치">${item.content.map(([kicker,label])=>`<div><small>${esc(kicker)}</small><b>${esc(label)}</b></div>`).join('')}</div>`;

  const card=item=>`<article class="art-card" id="concept-${esc(item.id)}" style="--art-accent:${esc(item.accent)};--art-soft:${esc(item.soft)}">
    <header class="art-card-head">
      <div class="art-title-row"><span class="art-number">${esc(item.number)}</span><div><h2>${esc(item.menu)} Banner Art Direction</h2><p>${esc(item.assetNote)}</p></div></div>
      <div class="art-meta"><span>${esc(item.category)} Category</span><span>${esc(item.characters)}</span><span class="asset-status">${esc(item.assetStatus)}</span></div>
    </header>
    <div class="preview-pair">
      <div class="preview-frame desktop"><div class="preview-frame-label"><span>DESKTOP</span><b>Unified height · 232px</b></div>${banner(item)}${contentPeek(item)}</div>
      <div class="preview-frame mobile"><div class="preview-frame-label"><span>MOBILE</span><b>390px</b></div>${banner(item)}${contentPeek(item)}</div>
    </div>
  </article>`;

  const list=document.querySelector('#previewList');
  const nav=document.querySelector('#jumpNav');
  list.innerHTML=previews.map(card).join('');
  nav.innerHTML=previews.map(item=>`<a href="#concept-${esc(item.id)}">${esc(item.number)} · ${esc(item.menu)}</a>`).join('');

  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
    document.body.dataset.mode=button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(item=>item.classList.toggle('active',item===button));
  }));
  document.querySelector('#seasonSelect').addEventListener('change',event=>{document.body.dataset.season=event.target.value});
  if(matchMedia('(max-width:760px)').matches){document.body.dataset.mode='mobile';document.querySelectorAll('[data-mode]').forEach(item=>item.classList.toggle('active',item.dataset.mode==='mobile'))}
})();
