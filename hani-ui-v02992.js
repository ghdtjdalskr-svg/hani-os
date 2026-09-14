/* HANI OS v2.9.119 · Library and viewing archive density refinement */
(() => {
  'use strict';
  if (window.HANI_UI_V02992) return;
  window.HANI_UI_V02992 = true;
  const q=(s,r=document)=>r?.querySelector?.(s)||null, qa=(s,r=document)=>r?.querySelectorAll?Array.from(r.querySelectorAll(s)):[];
  const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const number=v=>Number(v)||0, currentMonth=()=>new Date().toLocaleDateString('en-CA').slice(0,7);
  const money=v=>`${Math.round(number(v)).toLocaleString('ko-KR')}원`;
  const menuLabel=id=>q(`.nav-btn[data-view="${id}"] .txt`)?.textContent?.trim()||pageMeta[id]?.[0]||id;
  const titled=(id,title)=>{const label=menuLabel(id);return !title||title===label?label:`${label} - ${title}`};
  // Canonical presentation metadata. No state writes; scenes and speakers live here.
  const companions={
    hasdaq:{agent:'hani',name:'하니',role:'투자 담당',scene:'asset',line:'숫자는 차분하게, 내일은 조금 더 든든하게.'},
    ne100:{agent:'naeun',name:'나은',role:'건강 담당',scene:'naeun-running',line:'몸무게만 보지 말고, 몸이 바뀌는 과정도 함께 보자!'},
    hinaJones:{agent:'hina',name:'히나',role:'문화 담당',scene:'hina-cinema',line:'좋은 이야기는 책장에도, 스크린에도 있어!'},
    harukei:{agent:'haru',name:'하루',role:'활동 담당',scene:'steps',line:'잠깐 바람 쐬러 갈까? 오늘의 걸음도 쌓이고 있어.'},
    jispi:{agent:'jieun',name:'지은',role:'생활 자산관리사',scene:'spending',line:'잘 쓴 돈도 기록해 두자. 우리 생활의 취향이니까.'},
    hinkei:{agent:'hina',name:'히나',role:'학습 담당',scene:'learning',line:'틀린 문제도 다음 정답으로 가는 힌트야!'}
  };
  const designSceneSrc=key=>q('img[data-design-scene="'+key+'"]',q('#haniDesignAssets')?.content)?.getAttribute('src')||'';
  const profile=agent=>canonicalProfileImages[agent]||canonicalProfileImages.hani;
  function speakerMarkup(agent,name,role,line){return `<img src="${profile(agent)}" alt="${safe(name)}" width="64" height="64"><div><small>${safe(name)} · ${safe(role)}</small><p>${safe(line)}</p></div>`}
  const mainCharacterBannerVariants=new Set(['single-character','duo-or-trio','group']);
  // Banner layers: Seasonal Theme (CSS) -> Category Theme -> Sidebar Menu Scene.
  // Internal tabs may change copy and data, but never own or swap scene assets.
  const mainCharacterCategoryThemes=Object.freeze({
  office: {
    tone: "office"
  },
  finance: {
    tone: "finance"
  },
  health: {
    tone: "health"
  },
  growth: {
    tone: "growth"
  },
  life: {
    tone: "life"
  },
  work: {
    tone: "work"
  },
  independent: {
    tone: "company"
  },
  sports: {
    tone: "sports"
  }
});
  const mainCharacterSidebarMenuConfig=Object.freeze({
    "home":Object.freeze({
  sidebarMenuKey: "home",
  category: "independent",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Chief of Staff",
  eyebrow: "DASHBOARD · HANI OS",
  title: "대시보드 - HANI OS",
  description: "아홉 명의 팀이 각자의 자리에서 움직이는 오늘의 회사 운영 화면입니다.",
  quote: "각자의 일이 연결되도록 오늘의 흐름부터 정리해둘게요.",
  sceneImage: "./assets/team/hani-team-office-active-v2.jpg",
  scenePosition: "right center",
  scenePositionMobile: "64% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneWidth: "min(64%, 820px)",
  sceneVariant: "dashboard-command",
  sceneAlt: "HANI OS 아홉 명의 팀원이 회사에서 각자 업무를 수행하는 장면",
  variant: "group",
  tone: "company"
}),
    "intake":Object.freeze({
  sidebarMenuKey: "intake",
  category: "office",
  owner: "yuna",
  profile: "yuna",
  speaker: "유나",
  role: "Info Desk",
  eyebrow: "OFFICE · AI INTAKE DESK",
  title: "인포데스크 - INTAKE DESK",
  description: "자료와 요청을 빠르게 접수하고 필요한 Draft까지 정리하는 AI 데스크입니다.",
  quote: "말씀해 주세요. 필요한 것만 정리해서 바로 보여드릴게요.",
  sceneImage: "./assets/banner-preview-v1/infodesk-ai-desk-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "infodesk",
  sceneAlt: "유나가 AI 인포데스크에서 자료와 메모를 분류하는 장면",
  variant: "single-character",
  tone: "office"
}),
    "agentReview":Object.freeze({
  sidebarMenuKey: "agentReview",
  category: "office",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Chief of Staff",
  eyebrow: "OFFICE · HANI DECISION BOARD",
  title: "AI 결재실 - DECISION BOARD",
  description: "하니가 필요한 전문가를 불러 안건을 검토하고 결정을 준비하는 보드룸입니다.",
  quote: "확인할 건 직원들이 확인하고, 결정할 건 대표가 결정합니다.",
  sceneImage: "./assets/banner-preview-v1/ai-approval-boardroom-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "approval",
  sceneAlt: "하니가 수아와 유나와 함께 안건을 검토하는 보드룸 장면",
  variant: "duo-or-trio",
  tone: "office"
}),
    "policy":Object.freeze({
  sidebarMenuKey: "policy",
  category: "office",
  owner: "sua",
  profile: "sua",
  speaker: "수아",
  role: "Operations Lead",
  eyebrow: "OFFICE · OPERATIONS GUIDE",
  title: "사내 규칙 - OPERATIONS GUIDE",
  description: "팀의 운영 원칙과 체크리스트를 실제 업무에 맞게 관리하는 가이드 공간입니다.",
  quote: "규칙은 일을 막는 문서가 아니라 판단을 빠르게 만드는 기준이에요.",
  sceneImage: "./assets/banner-preview-v1/company-rules-board-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "rules",
  sceneAlt: "수아가 운영 문서와 체크리스트 보드를 정리하는 장면",
  variant: "single-character",
  tone: "office"
}),
    "deployment":Object.freeze({
  sidebarMenuKey: "deployment",
  category: "office",
  owner: "sua",
  profile: "sua",
  speaker: "수아",
  role: "Release Ops",
  eyebrow: "OFFICE · RELEASE CONTROL",
  title: "배포 센터 - RELEASE CONTROL",
  description: "Preview부터 승인과 배포 상태까지 한 흐름으로 확인하는 릴리스 공간입니다.",
  quote: "Preview와 승인 기록이 맞는지 확인하고 안전하게 넘길게요.",
  sceneImage: "./assets/banner-preview-v1/deployment-control-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "deployment",
  sceneAlt: "하니와 수아가 배포 상태판과 승인 흐름을 확인하는 장면",
  variant: "duo-or-trio",
  tone: "office"
}),
    "investment":Object.freeze({
  sidebarMenuKey: "investment",
  category: "finance",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Investment Lead",
  eyebrow: "FINANCE · HANI INVESTMENT DESK",
  title: "투자 - HASDAQ BOARD",
  description: "시장 흐름과 계좌별 자산을 차분하게 읽는 투자 분석 공간입니다.",
  quote: "차트보다 먼저 흐름을 볼게요. 중요한 변화만 같이 확인해요.",
  sceneImage: "./assets/banner-preview-v1/investment-market-room-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "investment",
  sceneAlt: "하니와 지은이 현대적인 시장 분석실에서 투자 데이터를 검토하는 장면",
  variant: "duo-or-trio",
  tone: "finance"
}),
    "investmentIntake":Object.freeze({
  sidebarMenuKey: "investmentIntake",
  category: "finance",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Finance Lead",
  eyebrow: "FINANCE · MONTH-END UPDATE",
  title: "자산 업데이트 - 월말정산",
  description: "가계부 확정본과 투자 계좌 정보를 한곳에서 차분하게 갱신하는 공간입니다.",
  quote: "이번 달 기록을 맞춰두면 다음 달 판단이 훨씬 편해져요.",
  sceneImage: "./assets/banner-preview-v1/month-end-reconciliation-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "asset-update",
  sceneAlt: "하니가 원장과 계좌 명세서, 계산기를 대조하며 월말 정산을 진행하는 장면",
  variant: "single-character",
  tone: "finance"
}),
    "asset":Object.freeze({
  sidebarMenuKey: "asset",
  category: "finance",
  owner: "jieun",
  profile: "jieun",
  speaker: "지은",
  role: "Asset Manager",
  eyebrow: "FINANCE · LONG-TERM ASSET INDEX",
  title: "자산 - 성민 국채 10년물",
  description: "장기 자산의 축적과 변화 흐름을 안정적으로 읽는 자산 관리 공간입니다.",
  quote: "자산은 한 번에 커지지 않아. 안 새는 돈이 쌓여서 체력이 돼.",
  sceneImage: "./assets/banner-preview-v1/long-term-asset-archive-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "assets",
  sceneAlt: "지은이 장기 자산 원장과 태블릿을 비교하는 차분한 자산 아카이브 장면",
  variant: "single-character",
  tone: "finance"
}),
    "ledger":Object.freeze({
  sidebarMenuKey: "ledger",
  category: "finance",
  owner: "jieun",
  profile: "jieun",
  speaker: "지은",
  role: "Life Finance",
  eyebrow: "FINANCE · MONTHLY SPENDING",
  title: "가계부 - JISPI MARKET",
  description: "영수증과 월간 소비를 정리해 다음 달을 편하게 만드는 소비 리뷰 공간입니다.",
  quote: "후회보다 패턴을 찾자. 다음 달에 편해질 한 가지만 남기면 돼.",
  sceneImage: "./assets/design-system-v1/spending.webp",
  scenePosition: "66% center",
  scenePositionMobile: "70% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "ledger",
  sceneAlt: "지은과 동료들이 영수증과 계산기를 보며 소비를 정리하는 장면",
  variant: "duo-or-trio",
  tone: "finance"
}),
    "newsroom":Object.freeze({
  sidebarMenuKey: "newsroom",
  category: "finance",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Market Editor",
  eyebrow: "FINANCE · MARKET NEWS DESK",
  title: "뉴스룸 - MARKET NEWS DESK",
  description: "종합 시장과 관심종목의 의미 있는 변화만 브리핑하는 뉴스 공간입니다.",
  quote: "뉴스의 양보다 판단을 바꾸는 재료가 있는지 먼저 볼게요.",
  sceneImage: "./assets/banner-preview-v1/market-news-editor-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "newsroom",
  sceneAlt: "하니가 신문과 시장 브리핑 자료를 검토하는 뉴스 편집 데스크 장면",
  variant: "single-character",
  tone: "finance"
}),
    "diet":Object.freeze({
  sidebarMenuKey: "diet",
  category: "health",
  owner: "naeun",
  profile: "naeun",
  speaker: "나은",
  role: "Health Mate",
  eyebrow: "HEALTH · DAILY NUTRITION",
  title: "다이어트 - N&E 100",
  description: "식단과 체중 흐름을 부담 없이 이어가는 생활 밀착형 건강 공간입니다.",
  quote: "완벽한 하루보다 다시 기록하는 하루가 몸을 더 오래 바꿔요.",
  sceneImage: "./assets/banner-preview-v1/nutrition-tracking-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "diet",
  sceneAlt: "나은이 균형 잡힌 식사를 준비하고 식단 노트에 기록하는 밝은 주방 장면",
  variant: "single-character",
  tone: "health"
}),
    "exercise":Object.freeze({
  sidebarMenuKey: "exercise",
  category: "health",
  owner: "naeun",
  profile: "naeun",
  speaker: "나은",
  role: "Health Mate",
  eyebrow: "HEALTH · ACTIVE ROUTINE",
  title: "운동 - HARUKEI 10K",
  description: "걷기와 스트레칭부터 꾸준한 운동 루틴까지 기록하는 활동 공간입니다.",
  quote: "한 끼로 살찌지도, 한 번 굶어서 빠지지도 않아. 추세를 보자.",
  sceneImage: "./assets/design-system-v1/naeun-running-canonical.webp",
  scenePosition: "65% center",
  scenePositionMobile: "67% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "exercise",
  sceneAlt: "나은과 동료들이 햇살 좋은 산책길에서 가볍게 운동하는 장면",
  variant: "duo-or-trio",
  tone: "health"
}),
    "reading":Object.freeze({
  sidebarMenuKey: "reading",
  category: "growth",
  owner: "minji",
  profile: "minji",
  speaker: "민지",
  role: "Archive Mate",
  eyebrow: "GROWTH · LIBRARY ARCHIVE",
  title: "독서·서재 - LIBRARY INDEX",
  description: "읽은 책과 남기고 싶은 문장을 차분하게 보관하는 개인 서재입니다.",
  quote: "좋았던 문장은 접어두지 말고, 나중의 나를 위해 남겨두자.",
  sceneImage: "./assets/banner-preview-v1/personal-library-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "reading",
  sceneAlt: "민지가 개인 서재에서 책을 읽고 좋아하는 문장을 기록하는 장면",
  variant: "single-character",
  tone: "growth"
}),
    "study":Object.freeze({
  sidebarMenuKey: "study",
  category: "growth",
  owner: "hina",
  profile: "hina",
  speaker: "히나",
  role: "Learning Mate",
  eyebrow: "GROWTH · JAPANESE STUDY ROOM",
  title: "공부 - HINKEI 225",
  description: "일본 감성과 학습 목적이 함께 보이는 조용한 JLPT 공부 공간입니다.",
  quote: "예쁘게 시작해도 좋아. 오늘 외운 한 단어가 내일의 실력이야!",
  sceneImage: "./assets/banner-preview-v1/study-jlpt-room-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "study",
  sceneAlt: "히나가 일본풍 서재에서 JLPT 문제집과 단어장을 펼쳐 공부하는 장면",
  variant: "single-character",
  tone: "growth"
}),
    "university":Object.freeze({
  sidebarMenuKey: "university",
  category: "growth",
  owner: "haru",
  profile: "haru",
  speaker: "하루",
  role: "Campus Mate",
  eyebrow: "GROWTH · CAMPUS PLANNER",
  title: "대학교 관리 - CAMPUS PLANNER",
  description: "학기 일정과 수업, 과제 진행을 한곳에서 정리하는 학생 플래너입니다.",
  quote: "마감부터 보이면 마음이 복잡해져. 이번 주 한 칸씩 먼저 채우자.",
  sceneImage: "./assets/banner-preview-v1/campus-planner-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "campus",
  sceneAlt: "하루가 캠퍼스 책상에서 학기 플래너와 과제 카드를 정리하는 장면",
  variant: "single-character",
  tone: "growth"
}),
    "certificate":Object.freeze({
  sidebarMenuKey: "certificate",
  category: "growth",
  owner: "hina",
  profile: "hina",
  speaker: "히나",
  role: "Learning Mate",
  eyebrow: "GROWTH · EXAM ROADMAP",
  title: "자격증 - LEVEL UP BOARD",
  description: "시험 일정과 준비 상태, 합격 목표를 현실적으로 관리하는 학습 공간입니다.",
  quote: "접수일 놓치고 공부만 열심히 하면 정말 슬퍼. 일정부터 확인!",
  sceneImage: "./assets/banner-preview-v1/certification-roadmap-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "certificate",
  sceneAlt: "히나가 자격증 시험 로드맵과 모의시험 자료를 확인하는 준비실 장면",
  variant: "single-character",
  tone: "growth"
}),
    "wishlist":Object.freeze({
  sidebarMenuKey: "wishlist",
  category: "life",
  owner: "haru",
  profile: "haru",
  speaker: "하루",
  role: "Wish Mate",
  eyebrow: "LIFE · WISH PLANNING LAB",
  title: "Wish-list - WISH LAB",
  description: "갖고 싶은 것과 해보고 싶은 경험을 후보별로 비교하는 계획 공간입니다.",
  quote: "바로 사지 말고, 왜 갖고 싶은지부터 예쁘게 붙여두자.",
  sceneImage: "./assets/banner-preview-v1/wishlist-planning-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "wishlist",
  sceneAlt: "하루와 수연이 사진과 후보 카드를 비교하며 위시리스트를 정리하는 장면",
  variant: "duo-or-trio",
  tone: "life"
}),
    "travel":Object.freeze({
  sidebarMenuKey: "travel",
  category: "life",
  owner: "sooyeon",
  profile: "sooyeon",
  speaker: "수연",
  role: "Travel Coach",
  eyebrow: "LIFE · TRAVEL PLANNING",
  title: "여행 - TRAVEL COMPASS",
  description: "지도와 티켓, 일정표를 펼쳐 여행의 동선을 설계하는 계획 공간입니다.",
  quote: "예쁜 곳은 많아. 이동이 편한 순서로 묶으면 여행이 더 오래 기억나.",
  sceneImage: "./assets/banner-preview-v1/travel-route-planning-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "travel",
  sceneAlt: "수연이 지도와 티켓을 펼쳐 여행 동선을 설계하는 밝은 계획실 장면",
  variant: "single-character",
  tone: "life"
}),
    "movie":Object.freeze({
  sidebarMenuKey: "movie",
  category: "life",
  owner: "minji",
  profile: "minji",
  speaker: "민지",
  role: "Daily Mate",
  eyebrow: "LIFE · CINEMA ARCHIVE",
  title: "시청 아카이브 - CINEMA LOG",
  description: "영화와 드라마의 기억을 편안하게 쌓아두는 홈시네마 공간입니다.",
  quote: "좋았던 장면은 남겨두자. 다음에 다시 꺼내 볼 수 있게.",
  sceneImage: "./assets/design-system-v1/hina-cinema-canonical.webp",
  scenePosition: "67% center",
  scenePositionMobile: "70% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "media",
  sceneAlt: "민지와 동료들이 영화관에서 영화에 몰입해 감상하는 장면",
  variant: "duo-or-trio",
  tone: "life"
}),
    "diary":Object.freeze({
  sidebarMenuKey: "diary",
  category: "life",
  owner: "haru",
  profile: "haru",
  speaker: "하루",
  role: "Daily Archive",
  eyebrow: "LIFE · PERSONAL JOURNAL",
  title: "일기 - DAILY JOURNAL",
  description: "밤의 조용한 책상에서 오늘의 감정과 장면을 남기는 개인 기록 공간입니다.",
  quote: "오늘을 다 설명하지 않아도 돼. 기억하고 싶은 것부터 적어보자.",
  sceneImage: "./assets/banner-preview-v1/diary-night-desk-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "diary",
  sceneAlt: "하루가 따뜻한 스탠드 아래 밤의 책상에서 일기를 쓰는 장면",
  variant: "single-character",
  tone: "life"
}),
    "tasks":Object.freeze({
  sidebarMenuKey: "tasks",
  category: "work",
  owner: "sua",
  profile: "sua",
  speaker: "수아",
  role: "Operations Lead",
  eyebrow: "WORK · ACTION BOARD",
  title: "할 일 - ACTION BOARD",
  description: "업무와 개인 할 일을 우선순위와 진행 상태로 나누는 실행 공간입니다.",
  quote: "해야 할 일은 머리에 두지 말고, 지금 움직일 한 칸으로 바꿔둘게요.",
  sceneImage: "./assets/banner-preview-v1/tasks-kanban-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "tasks",
  sceneAlt: "수아가 칸반 보드와 체크카드로 할 일을 정리하는 장면",
  variant: "single-character",
  tone: "work"
}),
    "calendar":Object.freeze({
  sidebarMenuKey: "calendar",
  category: "work",
  owner: "sua",
  profile: "sua",
  speaker: "수아",
  role: "Operations Lead",
  eyebrow: "WORK · SCHEDULE BOARD",
  title: "캘린더 - SCHEDULE BOARD",
  description: "월간 일정과 중요한 약속을 한눈에 배치하는 스케줄 관리 공간입니다.",
  quote: "겹치는 일정부터 풀어두면 이번 달이 훨씬 덜 복잡해져요.",
  sceneImage: "./assets/banner-preview-v1/calendar-planning-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "calendar",
  sceneAlt: "수아와 민지가 월간 일정판에 색상 카드를 배치하는 장면",
  variant: "duo-or-trio",
  tone: "work"
}),
    "drive":Object.freeze({
  sidebarMenuKey: "drive",
  category: "work",
  owner: "sua",
  profile: "sua",
  speaker: "수아",
  role: "Operations Lead",
  eyebrow: "WORK · FILE LIBRARY",
  title: "Drive - FILE LIBRARY",
  description: "문서와 폴더를 안전하게 분류하고 다시 찾기 쉽게 보관하는 자료 공간입니다.",
  quote: "저장만 해두면 창고가 돼. 다시 찾을 기준까지 같이 붙여둘게요.",
  sceneImage: "./assets/banner-preview-v1/drive-archive-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "drive",
  sceneAlt: "유나와 수아가 문서 폴더와 클라우드 자료를 정리하는 장면",
  variant: "duo-or-trio",
  tone: "work"
}),
    "dev":Object.freeze({
  sidebarMenuKey: "dev",
  category: "work",
  owner: "sua",
  profile: "sua",
  speaker: "수아",
  role: "Development Ops",
  eyebrow: "WORK · DEVELOPMENT CONTROL",
  title: "개발센터 - DEV CONTROL",
  description: "개발 상태와 로그, 점검 결과를 실제 실행 흐름으로 확인하는 실무 공간입니다.",
  quote: "새 기능보다 먼저 지금 흐름이 안전한지 점검하고 이어갈게요.",
  sceneImage: "./assets/banner-preview-v1/development-studio-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "development",
  sceneAlt: "수아와 수연이 개발 화면과 점검 대시보드를 함께 확인하는 장면",
  variant: "duo-or-trio",
  tone: "work"
}),
    "aiTeam":Object.freeze({
  sidebarMenuKey: "aiTeam",
  category: "independent",
  owner: "hani",
  profile: "hani",
  speaker: "하니",
  role: "Chief of Staff",
  eyebrow: "HANI OS · PERSONAL AI COMPANY",
  title: "AI 팀 - HANI GROUP",
  description: "아홉 명의 역할과 관계가 하나의 회사 세계관으로 이어지는 중심 공간입니다.",
  quote: "각자 잘하는 일이 달라서, 함께 움직일 때 회사가 완성돼요.",
  sceneImage: "./assets/brand/hani-group-company-profile-v1.webp",
  scenePosition: "right center",
  scenePositionMobile: "center 38%",
  sceneFit: "contain",
  sceneFitMobile: "cover",
  sceneVariant: "ai-team",
  sceneAlt: "HANI AI TEAM 아홉 명이 함께 있는 공식 회사 장면",
  variant: "group",
  tone: "company"
}),
    "settings":Object.freeze({
  sidebarMenuKey: "settings",
  category: "independent",
  owner: "yuna",
  profile: "yuna",
  speaker: "유나",
  role: "System Desk",
  eyebrow: "HANI OS · SYSTEM VAULT",
  title: "설정·데이터 - SYSTEM VAULT",
  description: "설정과 백업, 저장 상태를 따뜻하지만 명확한 시스템 언어로 관리하는 공간입니다.",
  quote: "저장 상태와 백업 위치를 먼저 확인하고 안전하게 정리해둘게요.",
  sceneImage: "./assets/banner-preview-v1/settings-data-vault-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "settings",
  sceneAlt: "유나와 지은이 백업 장치와 데이터 보관함을 점검하는 장면",
  variant: "duo-or-trio",
  tone: "system"
}),
    "work":Object.freeze({
  sidebarMenuKey: "work",
  category: "work",
  owner: "sua",
  profile: "sua",
  speaker: "수아",
  role: "Operations Lead",
  eyebrow: "WORK · DAILY ASSISTANT",
  title: "업무 보조 - WORK ASSISTANT",
  description: "반복 업무와 참고 메모를 정리해 바로 실행할 수 있게 돕는 실무 공간입니다.",
  quote: "필요한 자료와 다음 행동을 한 흐름으로 정리해둘게요.",
  sceneImage: "./assets/banner-preview-v1/tasks-kanban-v1.webp",
  scenePosition: "center center",
  scenePositionMobile: "72% center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneVariant: "work",
  sceneAlt: "수아가 업무 카드와 실행 순서를 정리하는 실무 보드 장면",
  variant: "single-character",
  tone: "work"
}),
    "game":Object.freeze({
  sidebarMenuKey: "game",
  category: "sports",
  owner: "sooyeon",
  profile: "sooyeon",
  speaker: "수연",
  role: "Head Coach",
  eyebrow: "HANI OS · SPORTS LOUNGE",
  title: "스포츠 - SPORTS HUB",
  description: "야구는 매일, 축구와 e스포츠는 주 1회 흐름을 확인하는 응원 라운지입니다.",
  quote: "감독님, 오늘은 어느 팀부터 확인할까요?",
  sceneImage: "./assets/sports/hani-sports-hero-v1.webp",
  scenePosition: "right center",
  scenePositionMobile: "center center",
  sceneFit: "cover",
  sceneFitMobile: "cover",
  sceneWidth: "min(64%, 760px)",
  sceneVariant: "sports-lounge",
  sceneAlt: "수연과 HANI OS 팀이 스포츠 라운지에서 함께 경기를 응원하는 웹툰 장면",
  variant: "group",
  tone: "sports"
})
  });
  const mainCharacterInternalContent=Object.freeze({
    game:Object.freeze({
      yankees:Object.freeze({
        eyebrow:'SPORTS LOUNGE · MLB',title:'NEW YORK YANKEES',
        description:'뉴욕 양키스의 최근 경기 결과를 매일 갱신해 확인합니다.',
        quote:'핀스트라이프의 오늘, 최근 경기부터 차분히 볼게요.'
      }),
      kia:Object.freeze({
        eyebrow:'SPORTS LOUNGE · KBO',title:'KIA TIGERS',
        description:'KIA 타이거즈의 최근 경기 결과를 매일 갱신해 확인합니다.',
        quote:'타이거즈의 흐름, 마지막 경기와 소식부터 확인해요.'
      }),
      madrid:Object.freeze({
        eyebrow:'SPORTS LOUNGE · FOOTBALL',title:'REAL MADRID',
        description:'레알 마드리드의 최근 결과와 주요 소식을 주 1회 갱신합니다.',
        quote:'베르나베우의 오늘도 결과와 장면을 함께 챙겨볼까요?'
      }),
      dplus:Object.freeze({
        eyebrow:'SPORTS LOUNGE · ESPORTS',title:'DPLUS KIA',
        description:'Dplus KIA의 최근 결과와 주요 소식을 주 1회 갱신합니다.',
        quote:'경기 결과와 팀 소식, 중요한 것부터 빠르게 볼게요.'
      })
    })
  });
  function mainCharacterBannerConfig(sidebarMenuKey,internalView='home'){
    const sidebarMenu=mainCharacterSidebarMenuConfig[sidebarMenuKey];
    const theme=mainCharacterCategoryThemes[sidebarMenu?.category];
    const contentByView=mainCharacterInternalContent[sidebarMenuKey]||{};
    if(!sidebarMenu||!theme)return null;
    const resolvedView=internalView==='home'||contentByView[internalView]?internalView:'home';
    return {...theme,...sidebarMenu,...(contentByView[resolvedView]||{}),internalView:resolvedView};
  }
  const mainCharacterInternalViewExists=(sidebarMenuKey,internalView)=>internalView==='home'||Boolean(mainCharacterInternalContent[sidebarMenuKey]?.[internalView]);
  function mainCharacterBanner(id,config){
    const root=q(`#${id}`);if(!root||!config)return null;
    let el=q(':scope > .ds-main-character-banner',root);
    if(!el){
      el=document.createElement('section');
      el.dataset.mainCharacterBanner=id;
      el.innerHTML='<figure class="ds-main-character-banner__scene"><img width="2172" height="724"></figure><span class="ds-main-character-banner__seasonal-fx" aria-hidden="true"></span><div class="ds-main-character-banner__copy"><span class="ds-main-character-banner__eyebrow"></span><h2 class="ds-main-character-banner__title"></h2><p class="ds-main-character-banner__description"></p><span class="ds-main-character-banner__status" hidden></span><div class="ds-main-character-banner__agent" data-main-character-banner-agent-slot></div></div>';
      root.prepend(el);
    }
    const variant=mainCharacterBannerVariants.has(config.variant)?config.variant:'single-character';
    el.className=`ds-main-character-banner ds-main-character-banner--${variant} ds-tone-${config.tone||'work'}`;
    el.dataset.owner=config.owner||'';el.dataset.category=config.category||'';el.dataset.menu=config.sidebarMenuKey||id;el.dataset.internalView=config.internalView||'';el.dataset.sceneVariant=config.sceneVariant||'';el.removeAttribute('data-scene-fallback');
    [['--mcb-scene-position',config.scenePosition],['--mcb-scene-position-mobile',config.scenePositionMobile],['--mcb-scene-width',config.sceneWidth],['--mcb-scene-fit',config.sceneFit],['--mcb-scene-fit-mobile',config.sceneFitMobile]].forEach(([property,value])=>value?el.style.setProperty(property,value):el.style.removeProperty(property));
    const titleId=`${id}MainCharacterBannerTitle`;
    el.setAttribute('role','group');el.setAttribute('aria-labelledby',titleId);
    const title=q('.ds-main-character-banner__title',el);title.id=titleId;title.textContent=config.title||titled(id,'');
    q('.ds-main-character-banner__eyebrow',el).textContent=config.eyebrow||'';
    q('.ds-main-character-banner__description',el).textContent=config.description||'';
    const image=q('.ds-main-character-banner__scene img',el);
    if(image.getAttribute('src')!==config.sceneImage)image.setAttribute('src',config.sceneImage||'');
    image.alt=config.sceneAlt||'';image.onerror=()=>{if(el.dataset.sceneFallback)return;el.dataset.sceneFallback='1';image.src='./assets/team/hani-team-office.webp';image.alt='HANI OS 팀 기본 장면';};
    return el;
  }
  function syncMainCharacterBannerAgent(id,config){
    const root=q(`#${id}`),el=q(':scope > .ds-main-character-banner',root),banner=q('#aiBanner');
    if(!root?.classList.contains('active')||!el||!banner||!el.contains(banner)||!config)return;
    const agent=config.profile||config.owner||'hani',avatar=q('#aiAvatar',banner),quote=q('#aiQuote',banner),image=profile(agent);
    if(avatar){avatar.className=`ai-avatar has-photo agent-${agent}`;avatar.style.backgroundImage=`url(${image})`;avatar.textContent=''}
    if(quote){let label=q(':scope > span',quote),body=q(':scope > b',quote);if(!label||!body){quote.replaceChildren();label=document.createElement('span');body=document.createElement('b');quote.append(label,body)}label.textContent=`${config.speaker||'하니'} 한마디`;body.textContent=`“${config.quote||''}”`}
    const kicker=q('#aiKicker',banner),name=q('#aiName',banner),message=q('#aiMessage',banner),role=q('#aiRole',banner);
    if(kicker)kicker.textContent=String(config.category||'HANI OS').toUpperCase();if(name)name.textContent=titled(id,config.title);if(message)message.textContent=config.description||'';if(role)role.textContent=`${config.speaker||'하니'} · ${config.role||''}`;
  }
  function currentSportsMenu(){const root=q('#game'),key=root?.dataset.sportsMenu||q('[data-sports-tab].active',root)?.dataset.sportsTab||'home';return mainCharacterInternalViewExists('game',key)?key:'home'}
  function renderSportsBanner(menu=currentSportsMenu()){
    const config=mainCharacterBannerConfig('game',menu),el=mainCharacterBanner('game',config);syncMainCharacterBannerAgent('game',config);return el;
  }
  function mountDesignSlots(){
    const active=q('.view.active'),banner=q('#aiBanner'),target=q(':scope > :is(.hani-master-hero,.ds-main-character-banner)',active),agentSlot=target?(q('[data-main-character-banner-agent-slot]',target)||target):null;
    if(banner){banner.classList.toggle('ds-integrated-agent',!!target);if(agentSlot&&banner.parentElement!==agentSlot)agentSlot.append(banner);else if(!target&&banner.parentElement!==q('main.main'))q('main.main > header').after(banner)}
    if(active?.id==='game')renderSportsBanner();else if(active?.id&&mainCharacterSidebarMenuConfig[active.id])syncMainCharacterBannerAgent(active.id,mainCharacterBannerConfig(active.id,'home'));
    if(active?.id==='intake'){q('#aiAvatar').style.backgroundImage='url('+profile('yuna')+')';q('#aiQuote span').textContent='유나 한마디';q('#aiQuote b').textContent='말씀해 주세요. 저장 전 꼭 보여드릴게요.';const h=q('.hani-master-title',target);if(h)h.textContent='유나 인포데스크'}
    const home=q('#home');
    q(':scope > .ds-team-hero',home)?.remove();
    const actions=q('.home-welcome-actions'),yuna=q('#homeYunaQuick');if(actions&&yuna&&!actions.contains(yuna))actions.append(yuna);
    const side=q('.home-mix-card');if(side&&!q('.ds-companion-scene',side)){const scene=document.createElement('figure');scene.className='ds-companion-scene';scene.innerHTML='<img alt="" width="2172" height="724"><figcaption class="ds-agent-comment"></figcaption>';q('.sh',side).after(scene)}
    const recent=q('.home-activity-card'),lower=q('.home-lower-grid');if(recent&&lower&&!lower.contains(recent))lower.insertBefore(recent,q('.home-team-panel',lower));
    const ledger=q('#investmentIntake .ledger-import');if(ledger&&!q('.ds-agent-comment',ledger)){const comment=document.createElement('div');comment.className='ds-agent-comment ds-jieun';comment.innerHTML=speakerMarkup('jieun','지은','생활 자산관리사','이번 달도 수고했어! 붙여넣고 미리보기에서 같이 확인하자.');ledger.append(comment)}
    const account=q('#assetAccountManager');if(account&&!q('.ds-account-comment')){const comment=document.createElement('div');comment.className='ds-agent-comment ds-account-comment';comment.innerHTML=speakerMarkup('hani','하니','투자 담당','계좌 화면은 하나씩 차근차근. 원본과 숫자를 맞춘 다음 확정하자!');account.before(comment)}
    const comment=q('.ledger-jieun-comment');if(comment&&!q('.ds-comment-portrait',comment)){const img=document.createElement('img');img.className='ds-comment-portrait';img.src=profile('jieun');img.alt='지은';q('#ledgerJieunComment').before(img)}
    if(comment)comment.classList.toggle('is-editing',!q('#ledgerJieunEditor').hidden);
  }
  function updateCompanion(selected){const data=companions[selected]||companions.hasdaq,slot=q('.ds-companion-scene');if(!slot||slot.dataset.index===selected)return;slot.dataset.index=selected;const image=q('img',slot);image.src=designSceneSrc(data.scene);image.alt=`${data.name}와 동료들의 ${data.role} 웹툰 장면`;q('figcaption',slot).innerHTML=speakerMarkup(data.agent,data.name,data.role,data.line)}
  const heroImages={asset:"./assets/heroes/asset.png",monthEnd:"./assets/heroes/month-end.png",ledger:"./assets/heroes/ledger.png",diet:"./assets/heroes/diet.png",exercise:"./assets/heroes/exercise.png",reading:"./assets/heroes/reading.png",movie:"./assets/heroes/movie.png",study:"./assets/heroes/study.png",campus:"./assets/heroes/campus.png",travel:"./assets/heroes/travel.png",investment:"./assets/heroes/investment.png",newsroom:"./assets/heroes/newsroom.png",portraitHani:"./assets/profiles/hani-profile-hani.webp",portraitHina:"./assets/profiles/hani-profile-hina.webp",portraitHaru:"./assets/profiles/hani-profile-haru.webp",portraitMinji:"./assets/profiles/hani-profile-minji.webp",portraitSua:"./assets/profiles/hani-profile-sua.webp",portraitYuna:"./assets/profiles/hani-profile-yuna.webp",teamOffice:"./assets/team/hani-team-office.webp",teamPicnic:"./assets/team/hani-team-picnic.webp",lifeMarket:"./assets/design-system-v1/srx.webp",learningScene:"./assets/design-system-v1/learning.webp"};
  const genericHeroScenes={intake:'portraitYuna',agentReview:'teamOffice',policy:'portraitHani',deployment:'portraitHani',certificate:'learningScene',wishlist:'lifeMarket',diary:'portraitMinji',tasks:'portraitSua',calendar:'portraitSua',work:'portraitSua',drive:'portraitYuna',dev:'teamOffice',aiTeam:'teamPicnic',settings:'portraitHani'};
  const lifeMarketImages=[designSceneSrc("srx")];
  const lifeMarketDateKey=new Date().toLocaleDateString('en-CA');
  const lifeMarketImageSeed=[...lifeMarketDateKey].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
  const lifeMarketImage=lifeMarketImages[lifeMarketImageSeed%lifeMarketImages.length];
  function quizMetrics(){return homeQuizMetrics()}
  function hero(id,{tone,kicker,title,copy,value='기록 없음',change='',scene=tone}){
    const root=q(`#${id}`);if(!root)return null;let el=q(':scope > .index-hero-v02992',root);
    if(!el){el=document.createElement('div');root.prepend(el);el.innerHTML='<div class="hani-master-copy"><span class="hani-master-eyebrow"></span><div class="hani-master-titleline"><h2 class="hani-master-title"></h2><strong class="hani-master-metric"></strong><span class="hani-master-change"></span></div><p class="hani-master-description"></p></div><div class="hani-master-scene"><img alt=""></div>'}
    const className=`index-hero-v02992 hani-master-hero ds-page-hero ds-tone-${tone} spatial-scene-${scene}`;if(el.className!==className)el.className=className;
    const direction=change&&/(^|[\s·:])[-−↓]/.test(change.trim())?'down':change&&/(^|[\s·:])[+↑]/.test(change.trim())?'up':'neutral';
    const updateText=(selector,value)=>{const node=q(selector,el);if(node.textContent!==value)node.textContent=value};
    updateText('.hani-master-eyebrow',kicker);
    updateText('.hani-master-title',titled(id,title));
    const metric=q('.hani-master-metric',el),delta=q('.hani-master-change',el);
    updateText('.hani-master-metric',value);metric.hidden=!value;updateText('.hani-master-change',change);delta.hidden=!change;if(delta.className!==`hani-master-change ${direction}`)delta.className=`hani-master-change ${direction}`;
    updateText('.hani-master-description',copy);
    const sceneRoot=q('.hani-master-scene',el),src=heroImages[scene]||'';let image=q(':scope > img',sceneRoot);if(!image){sceneRoot.innerHTML='<img alt="">';image=q(':scope > img',sceneRoot)}
    sceneRoot.hidden=!src;if(src){if(image.getAttribute('src')!==src)image.setAttribute('src',src)}else image.removeAttribute('src');
    return el;
  }
  // Display only: do not change the selected input or persistent UI state.
  function ledgerHeroRecord(){
    const records=state.ledgerMonths||[],selected=q('#ledgerMonth')?.value;
    return records.find(x=>x.month===selected)||[...records].sort((a,b)=>String(a.month).localeCompare(String(b.month))).at(-1)||null;
  }
  function brokerRows(){return typeof officialBrokerSorted==='function'?officialBrokerSorted():[]}
  function brokerSummary(){const rows=brokerRows(),last=rows.at(-1),prev=rows.at(-2),c=last&&typeof brokerCalc==='function'?brokerCalc(last):null,p=prev&&typeof brokerCalc==='function'?brokerCalc(prev):null,d=c&&p?c.total-p.total:null,r=d!==null&&p.total?d/p.total*100:null;return {rows,last,c,d,r}}
  function mainCharacterStatus(id){
    if(id==='investment'){const s=brokerSummary();return s.r===null?null:{text:`전월 대비 ${s.r>=0?'+':''}${s.r.toFixed(2)}%`,direction:s.r>=0?'up':'down'}}
    if(id==='asset'){const s=brokerSummary();return s.d===null?null:{text:`전월 대비 ${s.d>=0?'+':''}${money(s.d)} · ${s.r>=0?'+':''}${(s.r||0).toFixed(2)}%`,direction:s.d>=0?'up':'down'}}
    if(id==='ledger'){const rec=ledgerHeroRecord(),c=rec&&typeof ledgerCalc==='function'?ledgerCalc(rec):null;if(!rec||!c)return null;const over=c.jispiT-c.targetT,ratio=c.targetT?over/c.targetT*100:null;return {text:`${rec.month} · 목표 대비 ${over>=0?'+':''}${ratio===null?'-':ratio.toFixed(1)+'%'} · ${ledgerJispiStatus(c.jispiT,c.targetT)}`,direction:over<=0?'down':'up'}}
    if(id==='diet'){const rows=[...(state.body||[])].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))),now=rows.at(-1),before=rows.at(-2);if(!now)return null;const delta=before?number(now.weight)-number(before.weight):null;return {text:`현재 ${number(now.weight).toFixed(2)}kg${delta===null?'':` · 직전 ${delta>=0?'+':''}${delta.toFixed(2)}kg`}`,direction:delta===null?'neutral':delta<=0?'down':'up'}}
    if(id==='exercise'){const rows=[...(state.exercise||[])].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).slice(-30).filter(x=>number(x.steps)>0);if(!rows.length)return null;const avg=Math.round(rows.reduce((sum,x)=>sum+number(x.steps),0)/rows.length);return {text:`최근 ${rows.length}일 평균 · ${avg.toLocaleString()}보`,direction:'neutral'}}
    if(id==='study'){const qm=quizMetrics();return {text:qm.rate===null?`Quiz ${(state.learningQuizzes||[]).length}개 · 제출 대기`:`정답률 ${qm.rate}% · 미완료 ${qm.pending}개`,direction:'neutral'}}
    if(id==='university'){const sem=typeof campusActiveSemester==='function'?campusActiveSemester():null;return sem?{text:`${sem.term||'현재 학기'} · 과목 ${(sem.courses||[]).length}개`,direction:'neutral'}:null}
    return null;
  }
  function mountSkeletons(){
    Object.keys(mainCharacterSidebarMenuConfig).forEach(id=>{
      const root=q(`#${id}`);if(!root)return;
      q(':scope > .index-hero-v02992',root)?.remove();
      const internal=id==='game'?currentSportsMenu():'home',config=mainCharacterBannerConfig(id,internal),el=mainCharacterBanner(id,config);
      const status=q('.ds-main-character-banner__status',el),data=mainCharacterStatus(id);
      if(status){status.hidden=!data;status.textContent=data?.text||'';status.className=`ds-main-character-banner__status ${data?.direction||'neutral'}`}
      el?.classList.toggle('has-status',Boolean(data));
    });
    q('#investNews > .hani-master-hero')?.remove();
    q('.ledger-import .sh h3')?.replaceChildren(document.createTextNode('가계부 확정본 Import'));
    qa('#asset .asset-dashboard-card .sh h3').forEach(x=>x.textContent='자산 핵심 지표');
  }
  function arrangeNavigation(){
    const ledger=q('#ledger'),tabs=q('#ledger > .tabs')||q('#ledger > .page-nav-context-v02992 .tabs'),picker=q('#ledger .money-month-picker');q('#ledger .money-intro')?.remove();
    if(ledger&&tabs){let nav=q('#ledger > .page-nav-context-v02992');if(!nav){nav=document.createElement('div');nav.className='page-nav-context-v02992';tabs.before(nav);nav.append(tabs);const context=document.createElement('div');context.className='page-context-v02992';nav.append(context);if(picker)context.append(picker)}const banner=q('#ledger > .ds-main-character-banner');if(banner&&nav&&banner.nextElementSibling!==nav)banner.after(nav)}
    const inv=q('#investment'),invTabs=q('#investment > .investment-tabs-main');if(inv&&invTabs&&!q('#investment > .page-nav-context-v02992')){const nav=document.createElement('div');nav.className='page-nav-context-v02992';invTabs.before(nav);nav.append(invTabs)}
    const overviewHead=q('#investment .investment-overview-head'),year=q('#overviewYearSelect')?.closest('.field'),select=q('#overviewYearSelect'),invNav=q('#investment > .page-nav-context-v02992');
    if(year&&invNav){let context=q('.page-context-v02992',invNav);if(!context){context=document.createElement('div');context.className='page-context-v02992';invNav.append(context)}context.append(year);const values=select?Array.from(select.options).map(x=>x.value).filter(Boolean):[];let fixed=q('.investment-year-static',year);if(values.length<=1){if(!fixed){fixed=document.createElement('strong');fixed.className='investment-year-static';year.append(fixed)}fixed.textContent=`${values[0]||new Date().getFullYear()}년`;if(select)select.hidden=true}else{fixed?.remove();if(select)select.hidden=false}}
    if(overviewHead){q(':scope > div:first-child',overviewHead)?.remove();if(!overviewHead.children.length)overviewHead.remove()}
  }
  function improveLifeMarket(){
    const moodImage=q('#lifeMarketImage'),brandImage=q('#lifeMarketBrandImage');[moodImage,brandImage].forEach(image=>{if(image&&image.src!==new URL(lifeMarketImage,document.baseURI).href)image.src=lifeMarketImage});
    const qm=quizMetrics(),h=q('#homeHinkei');if(h)h.textContent=qm.rate===null?'제출 없음':`${qm.rate}%`;const hm=q('#homeHinkeiMeta');if(hm)hm.textContent=qm.rate===null?`퀴즈 ${(state.learningQuizzes||[]).length} · 제출 대기`:`퀴즈 ${qm.completed.length} · 오답 ${qm.wrong}`;
    const ledger=[...(state.ledgerMonths||[])].sort((a,b)=>String(a.month||'').localeCompare(String(b.month||''))),last=ledger.at(-1),prev=ledger.at(-2);let rate=null;if(last&&prev&&typeof ledgerCalc==='function'){const a=ledgerCalc(last).jispiT,b=ledgerCalc(prev).jispiT;rate=b?(a-b)/b*100:null}const card=q('[data-life-index="jispi"]');if(card){q('.life-card-move',card)?.remove();q('.life-card-spark',card)?.remove();q('.life-card-graph-empty',card)?.remove();card.classList.add('has-mini-visual');const status=last&&typeof ledgerCalc==='function'?ledgerJispiStatus(ledgerCalc(last).jispiT,ledgerCalc(last).targetT):'결산 대기',meta=q('#homeJispiMeta',card);if(meta)meta.textContent=last?`${last.month.replace('-','년 ')}월 결산`:'월간 소비 결산';const values=typeof ledgerCalc==='function'?ledger.slice(-5).map(x=>ledgerCalc(x).jispiT):[],max=Math.max(...values,1),graph=values.length>=2?`<div class="life-card-spark" aria-label="최근 ${values.length}개월 JISPI 추이">${values.map((value,index)=>`<i style="--h:${Math.max(18,Math.round(value/max*100))}%" title="${safe(ledger.slice(-5)[index].month)} · ${safe(money(value))}"></i>`).join('')}</div>`:'<span class="life-card-graph-empty">전월 비교 데이터 없음</span>';card.insertAdjacentHTML('beforeend',`<span class="life-card-move ${rate!==null&&rate<=0?'up':'down'}"><b>${safe(status)}</b></span>${graph}`)}const studyCard=q('[data-life-index="hinkei"]');if(studyCard){q('.life-card-move',studyCard)?.remove();q('.life-card-spark',studyCard)?.remove();q('.life-card-graph-empty',studyCard)?.remove();studyCard.classList.add('has-mini-visual');const scores=qm.completed.slice(-5).map(x=>{const total=number(x.total)||(x.questions||[]).length,correct=Number.isFinite(Number(x.correctCount))?number(x.correctCount):null;return Number.isFinite(Number(x.score))?number(x.score):(total&&correct!==null?Math.round(correct/total*100):0)}),graph=scores.length?`<div class="life-card-spark" aria-label="최근 ${scores.length}개 Quiz 점수">${scores.map((score,index)=>`<i style="--h:${Math.max(12,Math.min(100,score))}%" title="Quiz ${index+1} · ${score}%"></i>`).join('')}</div>`:'<span class="life-card-graph-empty">완료 Quiz 데이터 없음</span>';studyCard.insertAdjacentHTML('beforeend',`<span class="life-card-move up"><b>${qm.rate===null?'Quiz 제출 대기':`정답률 ${qm.rate}%`}</b></span>${graph}`)}
    const grid=q('.home-dashboard-grid');const selected=q('[data-life-index].is-selected')?.dataset.lifeIndex||'hasdaq';if(grid)grid.dataset.selectedIndex=selected;updateCompanion(selected);
    const kicker=q('#homeSecondaryKicker'),mix=q('#homeMixDonut'),legend=q('#homeMixLegend'),total=q('#homeMixTotal'),unit=q('#homeMixUnit');if(!kicker||!mix)return;kicker.textContent={hasdaq:'ACCOUNT MIX',ne100:'GOAL PROGRESS',hinaJones:'CONTENT MIX',harukei:'10K PROGRESS',jispi:'SPENDING MIX',hinkei:'QUIZ SCORE'}[selected]||'STATUS';
    const detail={hasdaq:['계좌별 자산 비중','원'],ne100:['몸의 변화 · 신체 구성','kg'],hinaJones:['Book · Media 현황','건'],harukei:['1만보 달성률 · 평균','보'],jispi:['고정·유동·특별·금융 구성','원'],hinkei:['정답률 · 오답 · 미완료','%']}[selected];if(detail){const title=q('#homeSecondaryTitle');if(title)title.textContent=detail[0]}
    mix.classList.add('secondary-widget-v02992');mix.style.background='none';let value='-',progress=0,items=[];
    if(selected==='hasdaq'){const b=brokerSummary(),accounts=b.c?.accounts||[],sum=accounts.reduce((a,x)=>a+number(x.assets||x.total),0);value=b.c?money(b.c.total):'-';progress=accounts.length&&sum?number(accounts[0].assets||accounts[0].total)/sum*100:0;items=accounts.map(x=>[x.accountName||'계좌',money(x.assets||x.total),sum?number(x.assets||x.total)/sum*100:0]).slice(0,6)}
    if(selected==='ne100'){const rows=[...(state.body||[])].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))),x=rows.at(-1),g=number(state.goals?.weight2||state.goals?.weight1),start=number(rows[0]?.weight);progress=x&&g&&start!==g?Math.max(0,Math.min(100,(start-number(x.weight))/(start-g)*100)):0;value=x?`${number(x.weight).toFixed(1)}kg`:'-';items=[['BMI',x?.bmi!=null?number(x.bmi).toFixed(1):'미기록'],['골격근량',x?.muscle!=null?`${number(x.muscle).toFixed(1)}kg`:'미기록'],['체지방량',x?.fatMass!=null?`${number(x.fatMass).toFixed(1)}kg`:'미기록'],['체지방률',x?.fat!=null?`${number(x.fat).toFixed(1)}%`:'미기록']]}
    if(selected==='hinaJones'){const books=(state.books||[]).filter(x=>x.status==='read'),movies=(state.movies||[]).filter(x=>x.status==='watched'),b=books.filter(x=>String(x.readDate||x.completedDate||'').startsWith(currentMonth())).length,m=movies.filter(x=>String(x.watchedDate||'').startsWith(currentMonth())).length,bestBook=[...books].filter(x=>number(x.rating)>0).sort((a,b)=>number(b.rating)-number(a.rating)||String(b.completedDate||'').localeCompare(String(a.completedDate||'')))[0],bestMovie=[...movies].filter(x=>number(x.rating)>0).sort((a,b)=>number(b.rating)-number(a.rating)||String(b.watchedDate||'').localeCompare(String(a.watchedDate||'')))[0];value=`${b+m}건`;progress=b+m?b/(b+m)*100:0;items=[['이번 달 BOOK',`${b}권`],['이번 달 MEDIA',`${m}편`],...(bestBook?[['BEST BOOK',`${bestBook.title} · ${number(bestBook.rating).toFixed(1)}점`]]:[]),...(bestMovie?[['BEST MEDIA',`${bestMovie.title} · ${number(bestMovie.rating).toFixed(1)}점`]]:[])]}
    if(selected==='harukei'){const month=currentMonth(),rows=(state.exercise||[]).filter(x=>number(x.steps)>0&&String(x.date||'').startsWith(month)),hit=rows.filter(x=>number(x.steps)>=10000).length,avg=rows.length?Math.round(rows.reduce((a,x)=>a+number(x.steps),0)/rows.length):0;value=rows.length?`${Math.round(avg/100)}%`:'-';progress=rows.length?Math.min(100,avg/100):0;items=[['이번 달 일평균',`${avg.toLocaleString()}보`],['10,000보 달성',`${hit}/${rows.length}일`],['목표 대비',rows.length?`${Math.round(avg/100)}%`:'-']]}
    if(selected==='jispi'&&last&&typeof ledgerCalc==='function'){const c=ledgerCalc(last),sum=c.fixed+c.variable+c.special+c.finance;value=money(c.jispiT);progress=sum?c.fixed/sum*100:0;items=[['고정',money(c.fixed),sum?c.fixed/sum*100:0],['유동',money(c.variable),sum?c.variable/sum*100:0],['특별',money(c.special),sum?c.special/sum*100:0],['금융',money(c.finance),sum?c.finance/sum*100:0]]}
    if(selected==='hinkei'){const projects=(state.learningProjects||[]).filter(x=>x.status!=='archived').sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||''))).slice(0,2);value=qm.rate===null?'-':`${qm.rate}%`;progress=qm.rate||0;items=[...projects.map((x,i)=>[`프로젝트 ${i+1}`,x.name||x.title||'이름 없음']),['완료',`${qm.completed.length}회`],['오답',`${qm.wrong}개`],['미완료',`${qm.pending}`]]}
    mix.dataset.widget=selected;const monthSteps=(state.exercise||[]).filter(x=>number(x.steps)>0&&String(x.date||'').startsWith(currentMonth())),colors=selected==='jispi'?['#315f95','#37a3a5','#dd8a3c','#795ea7']:['#735cf4','#35a77d','#ef9241','#ef7657','#3f9fe8','#b164aa'],ring=`<div class="secondary-score-ring" style="--score:${progress}%"><b>${safe(value)}</b></div>`;let start=0,parts=items.map((x,i)=>{const end=start+(x[2]??100/(items.length||1)),part=`${colors[i%colors.length]} ${start.toFixed(2)}% ${Math.min(100,end).toFixed(2)}%`;start=end;return part}),visual=ring;if(selected==='hasdaq'||selected==='jispi')visual=`<div class="secondary-donut" style="background:conic-gradient(${parts.join(',')})"><i></i></div>`;if(selected==='hinaJones')visual=`<div class="secondary-content-visual" aria-hidden="true"><span>▤</span><i>BOOK</i><span>▶</span><i>MEDIA</i></div>`;if(selected==='harukei')visual=`<div class="secondary-week-bars">${monthSteps.slice(-7).map(x=>`<i style="--bar:${Math.max(8,Math.min(100,number(x.steps)/100))}%" title="${safe(x.date)} · ${number(x.steps).toLocaleString()}보"></i>`).join('')}</div>`;
    const hasVisual=items.length&&(selected!=='harukei'||monthSteps.length)&&(selected!=='hinkei'||qm.completed.length);mix.innerHTML=`<div class="secondary-widget-visual"><strong class="secondary-widget-value">${safe(value)}</strong>${hasVisual?visual:'<span class="secondary-empty">비교 데이터 없음</span>'}${selected==='ne100'&&items.length?`<div class="secondary-progress-track"><i style="--p:${progress}%"></i></div>`:''}</div><div class="secondary-widget-details">${items.length?items.slice(0,6).map(([a,b])=>`<div><small>${safe(a)}</small><b title="${safe(b)}">${safe(b)}</b></div>`).join(''):'<div class="secondary-empty">해당 지수의 기록이 아직 없습니다.</div>'}</div>`;if(total)total.hidden=true;if(unit)unit.hidden=true;if(legend)legend.innerHTML='';
    const badge=q('#homeTrendBadge'),latest=(selected==='hasdaq'?brokerSummary().rows:(selected==='ne100'?state.body:selected==='harukei'?state.exercise:selected==='jispi'?state.ledgerMonths:selected==='hinkei'?qm.completed:[...(state.books||[]),...(state.movies||[])])).length;if(badge){badge.hidden=!latest;badge.textContent=latest?value:''}const footerGoal=q('#homeInvestGoal'),footerPeriod=q('#homeLatestPeriod');if(footerGoal)footerGoal.textContent={hasdaq:money(state.goals?.investment),ne100:`${number(state.goals?.weight2||state.goals?.weight1)||'-'}kg`,hinaJones:'월간 완료',harukei:'10,000보',jispi:last?money(typeof ledgerCalc==='function'?ledgerCalc(last).targetT:0):'목표 미설정',hinkei:'정답률 100%'}[selected]||'-';if(footerPeriod)footerPeriod.textContent={hasdaq:brokerSummary().last?.period||'-',ne100:state.body?.at(-1)?.date||'-',hinaJones:currentMonth(),harukei:state.exercise?.at(-1)?.date||'-',jispi:last?.month||'-',hinkei:qm.completed.at(-1)?.updatedAt?.slice(0,10)||'-'}[selected]||'-';
  }
  function phase1CollapsibleForm(viewId,selector,label,description){
    const root=q('#'+viewId),card=q(selector,root);if(!root||!card||card.closest('.phase1-collapsible-form'))return;
    const details=document.createElement('details');details.className='phase1-collapsible-form card full';details.dataset.phase1Form=viewId;
    const summary=document.createElement('summary');summary.innerHTML=`<span><b>${safe(label)}</b><small>${safe(description)}</small></span><em>열기</em>`;
    card.before(details);details.append(summary,card);card.classList.remove('card','sidec','wide','full');card.classList.add('phase1-form-body');
    details.addEventListener('toggle',()=>{q('summary em',details).textContent=details.open?'접기':'열기'});
  }
  function organizePhase1Layouts(){
    phase1CollapsibleForm('reading','.reading-input-card','독서 기록 입력','필요할 때 열어 읽을 책과 완독 기록을 등록합니다.');
    phase1CollapsibleForm('movie','.movie-input-card','시청 기록 입력','필요할 때 열어 작품·시즌·회차를 등록합니다.');
    phase1CollapsibleForm('diary','.diary-form','일기 작성','필요할 때 열어 오늘의 기록을 작성합니다.');
    const diaryStats=q('#diary .compact-dashboard');if(diaryStats)diaryStats.hidden=true;
    const series=q('#movieSeriesSection');if(series)series.hidden=true;
  }
  function cleanupNewsroom(){const news=q('#newsroom'),tabs=q('.newsroom-mode-tabs',news),tools=q('.newsroom-content-actions',news);if(tabs&&tools&&!q('.ds-news-navigation',news)){const nav=document.createElement('div');nav.className='ds-news-navigation page-nav-context-v02992';tabs.before(nav);nav.append(tabs,tools)}q('#haniLifeMarketV02979')?.remove();const nav=q('#haniWeeklyArchiveNavV02970'),actions=q('.newsroom-content-actions');if(nav&&actions&&!actions.contains(nav)){nav.classList.add('compact');actions.prepend(nav)}const usage=q('#investmentNewsUsage');if(usage)usage.textContent='뉴스 데이터는 Life OS 핵심 원장과 분리되어 안전하게 유지됩니다.'}
  function bindSportsBoard(){
    const root=q('#game');if(!root)return;
    const select=requested=>{
      const key=mainCharacterInternalViewExists('game',requested)?requested:'home';root.dataset.sportsMenu=key;
      qa('[data-sports-tab]',root).forEach(btn=>{const active=btn.dataset.sportsTab===key;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',String(active));btn.tabIndex=active?0:-1});
      qa('[data-sports-panel]',root).forEach(panel=>panel.hidden=panel.dataset.sportsPanel!==key);
      renderSportsBanner(key);
    };
    if(root.dataset.sportsBound){renderSportsBanner(currentSportsMenu());return}
    root.dataset.sportsBound='1';
    qa('[data-sports-tab]',root).forEach(btn=>{const key=btn.dataset.sportsTab;btn.setAttribute('role','tab');btn.id=`sportsTab-${key}`;btn.setAttribute('aria-controls',`sportsPanel-${key}`);btn.addEventListener('click',()=>select(key))});
    qa('[data-sports-panel]',root).forEach(panel=>{const key=panel.dataset.sportsPanel;panel.id=`sportsPanel-${key}`;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',`sportsTab-${key}`)});
    qa('[data-sports-open]',root).forEach(btn=>btn.addEventListener('click',()=>select(btn.dataset.sportsOpen)));
    select(currentSportsMenu());
  }
  let queued=false;function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mountSkeletons();arrangeNavigation();mountDesignSlots();organizePhase1Layouts();improveLifeMarket();cleanupNewsroom();bindSportsBoard();if(q('#exercise.active')&&typeof drawExercise==='function')requestAnimationFrame(drawExercise)})}
  document.addEventListener('click',()=>setTimeout(refresh,0));document.addEventListener('change',()=>setTimeout(refresh,0));
  refresh();setTimeout(refresh,120);
  console.info('[HANI OS] v2.9.119 Library and viewing archive UX ready');
})();
