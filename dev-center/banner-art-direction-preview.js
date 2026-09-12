(() => {
  'use strict';

  const profile = name => `../assets/profiles/hani-profile-${name}.webp`;
  const generated = name => `../assets/banner-preview-v1/${name}`;
  const existing = name => `../assets/${name}`;

  const categories = [
    {id:'office',label:'성민 오피스',kicker:'OFFICE SYSTEM',summary:'접수·결재·규칙·배포가 이어지는 회사 운영 공간',accent:'#7358ba',soft:'#f0ecfb'},
    {id:'finance',label:'재무',kicker:'FINANCE',summary:'기록과 흐름을 차분하게 읽는 생활 금융 공간',accent:'#7b67cf',soft:'#efedff'},
    {id:'health',label:'건강',kicker:'HEALTH',summary:'과한 압박 없이 꾸준한 생활 변화를 만드는 건강 공간',accent:'#169a7c',soft:'#e8f8f2'},
    {id:'growth',label:'성장',kicker:'GROWTH',summary:'읽고 배우고 준비하는 개인 성장 공간',accent:'#d17187',soft:'#fff0f4'},
    {id:'life',label:'라이프',kicker:'LIFE',summary:'원하는 것과 추억, 계획과 감정을 쌓는 생활 공간',accent:'#348ba1',soft:'#e9f7f8'},
    {id:'work',label:'업무 / 시스템',kicker:'WORK SYSTEM',summary:'할 일·일정·자료·개발 상태를 움직이는 실무 공간',accent:'#4d75b5',soft:'#ebf1fa'},
    {id:'independent',label:'독립 메뉴',kicker:'HANI OS',summary:'AI 회사 세계관과 시스템 기반을 보여주는 중심 공간',accent:'#a25f94',soft:'#f8edf5'}
  ];

  const previews = [
    {
      id:'infodesk',category:'office',theme:'office',menu:'인포데스크',eyebrow:'OFFICE · AI INTAKE DESK',title:'인포데스크 - INTAKE DESK',
      description:'자료와 요청을 빠르게 접수하고 필요한 Draft까지 정리하는 AI 데스크입니다.',agent:'유나',role:'Info Desk',avatar:profile('yuna'),
      quote:'말씀해 주세요. 필요한 것만 정리해서 바로 보여드릴게요.',scene:generated('infodesk-ai-desk-v1.webp'),sceneAlt:'유나가 AI 인포데스크에서 자료와 메모를 분류하는 장면',
      characters:'YUNA',assetStatus:'New',assetNote:'신규 생성 · AI 접수 데스크',content:[['INBOX','새 요청'],['DRAFT','정리 중'],['READY','확인 준비']]
    },
    {
      id:'approval',category:'office',theme:'office',menu:'AI 결재실',eyebrow:'OFFICE · HANI DECISION BOARD',title:'AI 결재실 - DECISION BOARD',
      description:'하니가 필요한 전문가를 불러 안건을 검토하고 결정을 준비하는 보드룸입니다.',agent:'하니',role:'Chief of Staff',avatar:profile('hani'),
      quote:'확인할 건 직원들이 확인하고, 결정할 건 대표가 결정합니다.',scene:generated('ai-approval-boardroom-v1.webp'),sceneAlt:'하니가 수아와 유나와 함께 안건을 검토하는 보드룸 장면',
      characters:'HANI · SUA · YUNA',assetStatus:'New',assetNote:'신규 생성 · 다인 의사결정 Scene',content:[['REVIEW','검토 대기'],['APPROVED','승인 안건'],['HOLD','보류 안건']]
    },
    {
      id:'rules',category:'office',theme:'office',menu:'사내 규칙',eyebrow:'OFFICE · OPERATIONS GUIDE',title:'사내 규칙 - OPERATIONS GUIDE',
      description:'팀의 운영 원칙과 체크리스트를 실제 업무에 맞게 관리하는 가이드 공간입니다.',agent:'수아',role:'Operations Lead',avatar:profile('sua'),
      quote:'규칙은 일을 막는 문서가 아니라 판단을 빠르게 만드는 기준이에요.',scene:generated('company-rules-board-v1.webp'),sceneAlt:'수아가 운영 문서와 체크리스트 보드를 정리하는 장면',
      characters:'SUA',assetStatus:'New',assetNote:'신규 생성 · 실무 규칙 보드',content:[['PRINCIPLE','운영 원칙'],['CHECKLIST','확인 항목'],['HISTORY','변경 기록']]
    },
    {
      id:'deployment',category:'office',theme:'office',menu:'배포 센터',eyebrow:'OFFICE · RELEASE CONTROL',title:'배포 센터 - RELEASE CONTROL',
      description:'Preview부터 승인과 배포 상태까지 한 흐름으로 확인하는 릴리스 공간입니다.',agent:'수아',role:'Release Ops',avatar:profile('sua'),
      quote:'Preview와 승인 기록이 맞는지 확인하고 안전하게 넘길게요.',scene:generated('deployment-control-v1.webp'),sceneAlt:'하니와 수아가 배포 상태판과 승인 흐름을 확인하는 장면',
      characters:'HANI · SUA',assetStatus:'New',assetNote:'신규 생성 · Preview-to-Release Scene',content:[['PREVIEW','검토 중'],['GATE','승인 상태'],['RELEASE','배포 기록']]
    },
    {
      id:'investment',category:'finance',theme:'finance',menu:'투자',eyebrow:'FINANCE · HANI INVESTMENT DESK',title:'투자 - HASDAQ BOARD',
      description:'시장 흐름과 계좌별 자산을 차분하게 읽는 투자 분석 공간입니다.',agent:'하니',role:'Investment Lead',avatar:profile('hani'),
      quote:'차트보다 먼저 흐름을 볼게요. 중요한 변화만 같이 확인해요.',scene:generated('investment-market-room-v1.webp'),sceneAlt:'하니와 지은이 현대적인 시장 분석실에서 투자 데이터를 검토하는 장면',
      characters:'HANI · JIEUN',assetStatus:'New',assetNote:'신규 생성 · 시장 분석 Scene',content:[['ACCOUNT','계좌별 자산'],['MONTHLY','월간 흐름'],['WATCHLIST','등록 종목']]
    },
    {
      id:'asset-update',category:'finance',theme:'finance',menu:'자산 업데이트',eyebrow:'FINANCE · MONTH-END UPDATE',title:'자산 업데이트 - 월말정산',
      description:'가계부 확정본과 투자 계좌 정보를 한곳에서 차분하게 갱신하는 공간입니다.',agent:'하니',role:'Finance Lead',avatar:profile('hani'),
      quote:'이번 달 기록을 맞춰두면 다음 달 판단이 훨씬 편해져요.',scene:existing('heroes/month-end.png'),sceneAlt:'체크 문서와 계산기가 놓인 월말 정산 책상',
      characters:'HANI',assetStatus:'Needs Character',assetNote:'기존 월말정산 배경만 있음 · 캐릭터 Scene 보완 필요',scenePosition:'68% center',sceneMobile:'66% center',content:[['LEDGER','가계부 확정'],['ACCOUNTS','계좌 업데이트'],['CHECK','저장 전 확인']]
    },
    {
      id:'assets',category:'finance',theme:'finance',menu:'자산',eyebrow:'FINANCE · LONG-TERM ASSET INDEX',title:'자산 - 성민 국채 10년물',
      description:'장기 자산의 축적과 변화 흐름을 안정적으로 읽는 자산 관리 공간입니다.',agent:'지은',role:'Asset Manager',avatar:profile('jieun'),
      quote:'자산은 한 번에 커지지 않아. 안 새는 돈이 쌓여서 체력이 돼.',scene:existing('design-system-v1/asset.webp'),sceneAlt:'지은과 동료들이 자산 리포트와 태블릿을 함께 확인하는 장면',
      characters:'JIEUN · HANI · HINA',assetStatus:'Near Duplicate',assetNote:'가계부와 동일 3인·유사 구도 · 장면 분리 필요',scenePosition:'66% center',sceneMobile:'70% center',content:[['NET ASSET','순자산'],['FLOW','월간 변화'],['HISTORY','장기 기록']]
    },
    {
      id:'ledger',category:'finance',theme:'finance',menu:'가계부',eyebrow:'FINANCE · MONTHLY SPENDING',title:'가계부 - JISPI MARKET',
      description:'영수증과 월간 소비를 정리해 다음 달을 편하게 만드는 소비 리뷰 공간입니다.',agent:'지은',role:'Life Finance',avatar:profile('jieun'),
      quote:'후회보다 패턴을 찾자. 다음 달에 편해질 한 가지만 남기면 돼.',scene:existing('design-system-v1/spending.webp'),sceneAlt:'지은과 동료들이 영수증과 계산기를 보며 소비를 정리하는 장면',
      characters:'JIEUN · HANI · HINA',assetStatus:'Near Duplicate',assetNote:'자산과 동일 3인·유사 구도 · 소비 Scene 분리 필요',scenePosition:'66% center',sceneMobile:'70% center',content:[['JISPI-T','실질 지출'],['JISPI-C','핵심 소비'],['COMMENT','지은 코멘트']]
    },
    {
      id:'newsroom',category:'finance',theme:'finance',menu:'뉴스룸',eyebrow:'FINANCE · MARKET NEWS DESK',title:'뉴스룸 - MARKET NEWS DESK',
      description:'종합 시장과 관심종목의 의미 있는 변화만 브리핑하는 뉴스 공간입니다.',agent:'하니',role:'Market Editor',avatar:profile('hani'),
      quote:'뉴스의 양보다 판단을 바꾸는 재료가 있는지 먼저 볼게요.',scene:existing('heroes/newsroom.png'),sceneAlt:'신문과 머그컵이 놓인 차분한 시장 뉴스 데스크',
      characters:'HANI',assetStatus:'Needs Character',assetNote:'기존 뉴스룸 배경만 있음 · 캐릭터 Scene 보완 필요',scenePosition:'68% center',sceneMobile:'67% center',content:[['MARKET','종합 뉴스'],['WATCHLIST','관심종목'],['ARCHIVE','주간 시황']]
    },
    {
      id:'diet',category:'health',theme:'health',menu:'다이어트',eyebrow:'HEALTH · DAILY NUTRITION',title:'다이어트 - N&E 100',
      description:'식단과 체중 흐름을 부담 없이 이어가는 생활 밀착형 건강 공간입니다.',agent:'나은',role:'Health Mate',avatar:profile('naeun'),
      quote:'완벽한 하루보다 다시 기록하는 하루가 몸을 더 오래 바꿔요.',scene:existing('heroes/diet.png'),sceneAlt:'샐러드와 건강 식재료가 준비된 밝은 주방',
      characters:'NAEUN',assetStatus:'Needs Character',assetNote:'기존 식단 배경만 있음 · 캐릭터 Scene 보완 필요',scenePosition:'68% center',sceneMobile:'66% center',content:[['WEIGHT','현재 체중'],['MEAL','오늘 식단'],['TREND','기간 변화']]
    },
    {
      id:'exercise',category:'health',theme:'health',menu:'운동',eyebrow:'HEALTH · ACTIVE ROUTINE',title:'운동 - HARUKEI 10K',
      description:'걷기와 스트레칭부터 꾸준한 운동 루틴까지 기록하는 활동 공간입니다.',agent:'나은',role:'Health Mate',avatar:profile('naeun'),
      quote:'한 끼로 살찌지도, 한 번 굶어서 빠지지도 않아. 추세를 보자.',scene:existing('design-system-v1/naeun-running-canonical.webp'),sceneAlt:'나은과 동료들이 햇살 좋은 산책길에서 가볍게 운동하는 장면',
      characters:'NAEUN · HANI · JIEUN',assetStatus:'Reuse + Crop',assetNote:'기존 canonical 운동 Scene 재사용',scenePosition:'65% center',sceneMobile:'67% center',content:[['STEPS','오늘 걸음'],['ROUTINE','운동 기록'],['DISTANCE','누적 거리']]
    },
    {
      id:'reading',category:'growth',theme:'growth',menu:'독서·서재',eyebrow:'GROWTH · LIBRARY ARCHIVE',title:'독서·서재 - LIBRARY INDEX',
      description:'읽은 책과 남기고 싶은 문장을 차분하게 보관하는 개인 서재입니다.',agent:'민지',role:'Archive Mate',avatar:profile('minji'),
      quote:'좋았던 문장은 접어두지 말고, 나중의 나를 위해 남겨두자.',scene:existing('heroes/reading.png'),sceneAlt:'햇살이 들어오는 조용한 책장과 독서 공간',
      characters:'MINJI',assetStatus:'Needs Character',assetNote:'기존 서재 배경만 있음 · 캐릭터 Scene 보완 필요',scenePosition:'66% center',sceneMobile:'65% center',content:[['READING','읽는 중'],['BOOKSHELF','나의 서재'],['NOTES','문장 기록']]
    },
    {
      id:'study',category:'growth',theme:'growth',menu:'공부',eyebrow:'GROWTH · JAPANESE STUDY ROOM',title:'공부 - HINKEI 225',
      description:'일본 감성과 학습 목적이 함께 보이는 조용한 JLPT 공부 공간입니다.',agent:'히나',role:'Learning Mate',avatar:profile('hina'),
      quote:'예쁘게 시작해도 좋아. 오늘 외운 한 단어가 내일의 실력이야!',scene:generated('study-jlpt-room-v1.webp'),sceneAlt:'히나가 일본풍 서재에서 JLPT 문제집과 단어장을 펼쳐 공부하는 장면',
      characters:'HINA',assetStatus:'New',assetNote:'확정 B안 기반 신규 생성',content:[['TODAY','오늘의 학습'],['QUIZ','최근 제출'],['PROGRESS','정답률 추이']]
    },
    {
      id:'campus',category:'growth',theme:'growth',menu:'대학교 관리',eyebrow:'GROWTH · CAMPUS PLANNER',title:'대학교 관리 - CAMPUS PLANNER',
      description:'학기 일정과 수업, 과제 진행을 한곳에서 정리하는 학생 플래너입니다.',agent:'하루',role:'Campus Mate',avatar:profile('haru'),
      quote:'마감부터 보이면 마음이 복잡해져. 이번 주 한 칸씩 먼저 채우자.',scene:existing('heroes/campus.png'),sceneAlt:'강의실과 교재가 보이는 차분한 캠퍼스 공간',
      characters:'HARU',assetStatus:'Needs Character',assetNote:'기존 캠퍼스 배경만 있음 · 캐릭터 Scene 보완 필요',scenePosition:'68% center',sceneMobile:'65% center',content:[['SEMESTER','학기 현황'],['ASSIGNMENT','과제 일정'],['COURSE','수업 관리']]
    },
    {
      id:'certificate',category:'growth',theme:'growth',menu:'자격증',eyebrow:'GROWTH · EXAM ROADMAP',title:'자격증 - LEVEL UP BOARD',
      description:'시험 일정과 준비 상태, 합격 목표를 현실적으로 관리하는 학습 공간입니다.',agent:'히나',role:'Learning Mate',avatar:profile('hina'),
      quote:'접수일 놓치고 공부만 열심히 하면 정말 슬퍼. 일정부터 확인!',scene:existing('heroes/study.png'),sceneAlt:'교재와 노트가 놓인 밝고 정돈된 시험 준비 책상',
      characters:'HINA',assetStatus:'Needs Character',assetNote:'기존 학습 배경만 있음 · 캐릭터 Scene 보완 필요',scenePosition:'68% center',sceneMobile:'66% center',content:[['EXAM','다가오는 시험'],['PLAN','학습 계획'],['RESULT','결과 기록']]
    },
    {
      id:'wishlist',category:'life',theme:'life',menu:'Wish-list',eyebrow:'LIFE · WISH PLANNING LAB',title:'Wish-list - WISH LAB',
      description:'갖고 싶은 것과 해보고 싶은 경험을 후보별로 비교하는 계획 공간입니다.',agent:'하루',role:'Wish Mate',avatar:profile('haru'),
      quote:'바로 사지 말고, 왜 갖고 싶은지부터 예쁘게 붙여두자.',scene:generated('wishlist-planning-v1.webp'),sceneAlt:'하루와 수연이 사진과 후보 카드를 비교하며 위시리스트를 정리하는 장면',
      characters:'HARU · SOOYEON',assetStatus:'New',assetNote:'신규 생성 · 후보 비교 Scene',content:[['WISH','원하는 것'],['COMPARE','후보 비교'],['ARCHIVE','완료 기록']]
    },
    {
      id:'travel',category:'life',theme:'life',menu:'여행',eyebrow:'LIFE · TRAVEL PLANNING',title:'여행 - TRAVEL COMPASS',
      description:'지도와 티켓, 일정표를 펼쳐 여행의 동선을 설계하는 계획 공간입니다.',agent:'수연',role:'Travel Coach',avatar:profile('sooyeon'),
      quote:'예쁜 곳은 많아. 이동이 편한 순서로 묶으면 여행이 더 오래 기억나.',scene:existing('heroes/travel.png'),sceneAlt:'여행 가방과 일정 노트가 놓인 밝은 여행 계획 테이블',
      characters:'SOOYEON',assetStatus:'Needs Character',assetNote:'기존 여행 계획 배경만 있음 · 캐릭터 Scene 보완 필요',scenePosition:'66% center',sceneMobile:'67% center',content:[['TRIP','여행 계획'],['ROUTE','일정표'],['PLACE','명소 보관']]
    },
    {
      id:'media',category:'life',theme:'life',menu:'시청 아카이브',eyebrow:'LIFE · CINEMA ARCHIVE',title:'시청 아카이브 - CINEMA LOG',
      description:'영화와 드라마의 기억을 편안하게 쌓아두는 홈시네마 공간입니다.',agent:'민지',role:'Daily Mate',avatar:profile('minji'),
      quote:'좋았던 장면은 남겨두자. 다음에 다시 꺼내 볼 수 있게.',scene:existing('design-system-v1/hina-cinema-canonical.webp'),sceneAlt:'민지와 동료들이 영화관에서 영화에 몰입해 감상하는 장면',
      characters:'MINJI · HINA · HARU',assetStatus:'Reuse + Crop',assetNote:'기존 canonical 영화관 Scene 재사용',scenePosition:'67% center',sceneMobile:'70% center',content:[['THIS MONTH','이번 달 감상'],['WATCHLIST','보고 싶은 작품'],['RECENT','최근 기록']]
    },
    {
      id:'diary',category:'life',theme:'life',menu:'일기',eyebrow:'LIFE · PERSONAL JOURNAL',title:'일기 - DAILY JOURNAL',
      description:'밤의 조용한 책상에서 오늘의 감정과 장면을 남기는 개인 기록 공간입니다.',agent:'하루',role:'Daily Archive',avatar:profile('haru'),
      quote:'오늘을 다 설명하지 않아도 돼. 기억하고 싶은 것부터 적어보자.',scene:generated('diary-night-desk-v1.webp'),sceneAlt:'하루가 따뜻한 스탠드 아래 밤의 책상에서 일기를 쓰는 장면',
      characters:'HARU',assetStatus:'New',assetNote:'신규 생성 · 야간 일기 Scene',content:[['WRITE','오늘의 기록'],['ARCHIVE','나의 일기장'],['RECENT','최근 기록']]
    },
    {
      id:'tasks',category:'work',theme:'work',menu:'할 일',eyebrow:'WORK · ACTION BOARD',title:'할 일 - ACTION BOARD',
      description:'업무와 개인 할 일을 우선순위와 진행 상태로 나누는 실행 공간입니다.',agent:'수아',role:'Operations Lead',avatar:profile('sua'),
      quote:'해야 할 일은 머리에 두지 말고, 지금 움직일 한 칸으로 바꿔둘게요.',scene:generated('tasks-kanban-v1.webp'),sceneAlt:'수아가 칸반 보드와 체크카드로 할 일을 정리하는 장면',
      characters:'SUA',assetStatus:'New',assetNote:'신규 생성 · Action Kanban Scene',content:[['TODAY','오늘 할 일'],['PROGRESS','진행 중'],['DONE','완료 기록']]
    },
    {
      id:'calendar',category:'work',theme:'work',menu:'캘린더',eyebrow:'WORK · SCHEDULE BOARD',title:'캘린더 - SCHEDULE BOARD',
      description:'월간 일정과 중요한 약속을 한눈에 배치하는 스케줄 관리 공간입니다.',agent:'수아',role:'Operations Lead',avatar:profile('sua'),
      quote:'겹치는 일정부터 풀어두면 이번 달이 훨씬 덜 복잡해져요.',scene:generated('calendar-planning-v1.webp'),sceneAlt:'수아와 민지가 월간 일정판에 색상 카드를 배치하는 장면',
      characters:'SUA · MINJI',assetStatus:'New',assetNote:'신규 생성 · 월간 일정 Scene',content:[['MONTH','월간 일정'],['UPCOMING','다가오는 약속'],['FOCUS','중요 일정']]
    },
    {
      id:'drive',category:'work',theme:'work',menu:'Drive',eyebrow:'WORK · FILE LIBRARY',title:'Drive - FILE LIBRARY',
      description:'문서와 폴더를 안전하게 분류하고 다시 찾기 쉽게 보관하는 자료 공간입니다.',agent:'수아',role:'Operations Lead',avatar:profile('sua'),
      quote:'저장만 해두면 창고가 돼. 다시 찾을 기준까지 같이 붙여둘게요.',scene:generated('drive-archive-v1.webp'),sceneAlt:'유나와 수아가 문서 폴더와 클라우드 자료를 정리하는 장면',
      characters:'YUNA · SUA',assetStatus:'New',assetNote:'신규 생성 · Digital Archive Scene',content:[['RECENT','최근 문서'],['FOLDER','폴더 관리'],['SHARED','공유 자료']]
    },
    {
      id:'development',category:'work',theme:'work',menu:'개발센터',eyebrow:'WORK · DEVELOPMENT CONTROL',title:'개발센터 - DEV CONTROL',
      description:'개발 상태와 로그, 점검 결과를 실제 실행 흐름으로 확인하는 실무 공간입니다.',agent:'수아',role:'Development Ops',avatar:profile('sua'),
      quote:'새 기능보다 먼저 지금 흐름이 안전한지 점검하고 이어갈게요.',scene:generated('development-studio-v1.webp'),sceneAlt:'수아와 수연이 개발 화면과 점검 대시보드를 함께 확인하는 장면',
      characters:'SUA · SOOYEON',assetStatus:'New',assetNote:'신규 생성 · 개발 점검 Scene',content:[['BUILD','개발 상태'],['LOG','실행 로그'],['CHECK','점검 결과']]
    },
    {
      id:'ai-team',category:'independent',theme:'company',menu:'AI 팀',eyebrow:'HANI OS · PERSONAL AI COMPANY',title:'AI 팀 - HANI GROUP',
      description:'아홉 명의 역할과 관계가 하나의 회사 세계관으로 이어지는 중심 공간입니다.',agent:'하니',role:'Chief of Staff',avatar:profile('hani'),
      quote:'각자 잘하는 일이 달라서, 함께 움직일 때 회사가 완성돼요.',scene:existing('brand/hani-group-company-profile-v1.webp'),sceneAlt:'HANI AI TEAM 아홉 명이 함께 있는 공식 회사 장면',
      characters:'HANI AI TEAM · 9',assetStatus:'Reuse + Crop',assetNote:'공식 9인 Company Profile 재사용',scenePosition:'right center',sceneMobile:'center 38%',sceneFit:'contain',sceneFitMobile:'cover',content:[['MEMBERS','9명 프로필'],['ROLES','담당 영역'],['WORLD','회사 세계관']]
    },
    {
      id:'settings',category:'independent',theme:'system',menu:'설정·데이터',eyebrow:'HANI OS · SYSTEM VAULT',title:'설정·데이터 - SYSTEM VAULT',
      description:'설정과 백업, 저장 상태를 따뜻하지만 명확한 시스템 언어로 관리하는 공간입니다.',agent:'유나',role:'System Desk',avatar:profile('yuna'),
      quote:'저장 상태와 백업 위치를 먼저 확인하고 안전하게 정리해둘게요.',scene:generated('settings-data-vault-v1.webp'),sceneAlt:'유나와 지은이 백업 장치와 데이터 보관함을 점검하는 장면',
      characters:'YUNA · JIEUN',assetStatus:'New',assetNote:'신규 생성 · Backup & Data Scene',content:[['STORAGE','저장 상태'],['BACKUP','백업 관리'],['SYSTEM','설정 확인']]
    }
  ].map((item,index) => ({...item,number:String(index + 1).padStart(2,'0')}));

  // The menu/scene ownership map is shared by the full catalog and the
  // seasonal comparison page. Preview pages remain read-only.
  window.HANI_BANNER_PREVIEW_DATA = Object.freeze({categories,previews});

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const categoryById = Object.fromEntries(categories.map(item => [item.id,item]));

  const banner = item => `<section class="main-character-banner theme-${esc(item.theme)}" data-menu-scene="${esc(item.id)}" style="--scene-position:${esc(item.scenePosition || 'center center')};--scene-position-mobile:${esc(item.sceneMobile || '72% center')};--scene-fit:${esc(item.sceneFit || 'cover')};--scene-fit-mobile:${esc(item.sceneFitMobile || item.sceneFit || 'cover')}" role="group" aria-label="${esc(item.menu)} 배너 시안">
    <figure class="main-character-banner__scene"><img src="${esc(item.scene)}" alt="${esc(item.sceneAlt)}"></figure>
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

  const contentPeek = item => `<div class="content-peek" aria-label="${esc(item.menu)} 본문 시작 위치">${item.content.map(([kicker,label]) => `<div><small>${esc(kicker)}</small><b>${esc(label)}</b></div>`).join('')}</div>`;

  const card = item => {
    const category = categoryById[item.category];
    return `<article class="art-card" id="concept-${esc(item.id)}" style="--art-accent:${esc(item.accent || category.accent)};--art-soft:${esc(item.soft || category.soft)}">
      <header class="art-card-head">
        <div class="art-title-row"><span class="art-number">${esc(item.number)}</span><div><h3>${esc(item.menu)} Banner Art Direction</h3><p>${esc(item.assetNote)}</p></div></div>
        <div class="art-meta"><span>${esc(category.label)} Category</span><span>${esc(item.characters)}</span><span class="asset-status" data-status="${esc(item.assetStatus)}">${esc(item.assetStatus)}</span></div>
      </header>
      <div class="preview-pair">
        <div class="preview-frame desktop"><div class="preview-frame-label"><span>DESKTOP</span><b>Unified height · 232px</b></div>${banner(item)}${contentPeek(item)}</div>
        <div class="preview-frame mobile"><div class="preview-frame-label"><span>MOBILE</span><b>390px</b></div>${banner(item)}${contentPeek(item)}</div>
      </div>
    </article>`;
  };

  const categorySection = category => {
    const items = previews.filter(item => item.category === category.id);
    return `<section class="category-section" id="category-${esc(category.id)}" data-category="${esc(category.id)}">
      <header class="category-head" style="--category-accent:${esc(category.accent)};--category-soft:${esc(category.soft)}">
        <div><span>${esc(category.kicker)}</span><h2>${esc(category.label)}</h2><p>${esc(category.summary)}</p></div><b>${items.length} MENUS</b>
      </header>
      <div class="category-cards">${items.map(card).join('')}</div>
    </section>`;
  };

  const list = document.querySelector('#previewList');
  if (!list) return;
  const nav = document.querySelector('#jumpNav');
  const filter = document.querySelector('#categoryFilter');
  list.innerHTML = categories.map(categorySection).join('');
  nav.innerHTML = categories.map(category => `<a href="#category-${esc(category.id)}">${esc(category.label)}</a>`).join('');
  filter.innerHTML = `<option value="all">전체 25개 메뉴</option>${categories.map(category => `<option value="${esc(category.id)}">${esc(category.label)}</option>`).join('')}`;

  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    document.body.dataset.mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(item => item.classList.toggle('active',item === button));
  }));
  document.querySelector('#seasonSelect').addEventListener('change', event => { document.body.dataset.season = event.target.value; });
  filter.addEventListener('change', event => {
    const selected = event.target.value;
    document.querySelectorAll('.category-section').forEach(section => { section.hidden = selected !== 'all' && section.dataset.category !== selected; });
  });
  if (matchMedia('(max-width:760px)').matches) {
    document.body.dataset.mode = 'mobile';
    document.querySelectorAll('[data-mode]').forEach(item => item.classList.toggle('active',item.dataset.mode === 'mobile'));
  }
})();
