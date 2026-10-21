"use strict";
(()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const app=$("#app");
  if(!app||$("#haniContextRemote"))return;

  const defaults={
    work:{primary:"현재 화면 보기",agent:"SUA",recent:"최근 항목",recentTarget:"#work",sections:[["현재 화면","#work"]]},
    aiBudget:{primary:"현재 화면 보기",agent:"SEOYUN",recent:"최근 항목",recentTarget:"#aiBudget",sections:[["현재 화면","#aiBudget"]]},
    geminiReports:{primary:"현재 화면 보기",agent:"SERIN",recent:"최근 항목",recentTarget:"#geminiReports",sections:[["현재 화면","#geminiReports"]]},
    aiWork:{primary:"현재 화면 보기",agent:"DOHYUN",recent:"최근 항목",recentTarget:"#aiWork",sections:[["현재 화면","#aiWork"]]},
    ilbo:{primary:"현재 화면 보기",agent:"MINJI",recent:"최근 항목",recentTarget:"#ilbo",sections:[["현재 화면","#ilbo"]]},
    home:{primary:"오늘 할 일",action:{view:"tasks"},agent:"HANI",recent:"최근 활동",recentTarget:"#recentActivity",sections:[["시장","#lifeMarketGrid"],["자산",".home-dashboard-grid"],["AI TEAM","#homeDialogueText"]]},
    intake:{primary:"새 기록 접수",focus:"#yunaInput,#intakeSourceText",agent:"YUNA",recent:"최근 접수",recentTarget:"#yunaConversation,#intakePreview",sections:[["빠른 접수","#yunaInput,#intakeSourceText"],["Preview","#yunaConversation,#intakePreview"]]},
    agentReview:{primary:"새 안건 접수",focus:"#agentRequestInput",agent:"HANI",recent:"최근 결재안",recentTarget:"#agentCaseList",alert:"#agentCaseCount",alertLabel:"검토 안건",sections:[["안건","#agentCaseList"],["회의·검토","#agentCaseDetail"],["새 접수","#agentRequestInput"]]},
    monthlyReport:{primary:"보고 월 선택",focus:"#monthlyReportMonth",agent:"HANI",recent:"월간 보고 목록",recentTarget:"#monthlyReportArchive",sections:[["핵심 요약","#monthlyReportKpis"],["HANI Insight","#monthlyReportInsight"],["영역별 보고","#monthlyReportDomains"]]},
    policy:{primary:"규정 새로고침",click:"#agentRefreshPolicies",agent:"SUA",recent:"현재 규정",recentTarget:"#agentPolicyRegistry",sections:[["Registry","#agentPolicyRegistry"],["상태","#agentPolicyRegistryState"]]},
    deployment:{primary:"배포 상태 확인",click:"#deployExecRefreshBtn",agent:"SEOYUN",recent:"Release Queue",recentTarget:"#deployExecutiveCard",sections:[["현황","#deployExecutiveCard"],["Inbox","#deployInboxRefreshBtn"],["HINA QA","#deployHinaQaBtn"]]},
    investment:{primary:"자산 업데이트",action:{view:"investmentIntake"},agent:"HANI",recent:"최근 월간 기록",recentTarget:"#investMonthly",sections:[["현황","#investOverview"],["월간 기록","#investMonthly"],["종목 관리","#investManage"]]},
    investmentCommittee:{primary:"포트폴리오 보기",action:{view:"investment"},agent:"HANI",recent:"월간 리포트",recentTarget:"#icMonthly",sections:[["종목 리포트","#icResearch"],["월간 리포트","#icMonthly"]]},
    investmentIntake:{primary:"업데이트 입력",focus:"#ledgerImportRaw",agent:"HANI",recent:"입력 안내",recentTarget:"#ledgerImportResult",sections:[["복붙 입력","#ledgerImportRaw"],["미리보기","#ledgerImportResult"]]},
    asset:{primary:"자산 업데이트",action:{view:"investmentIntake"},agent:"JIEUN",recent:"자산 현황",recentTarget:"#assetOverviewPanel",sections:[["현황","#assetOverviewPanel"],["계좌","#assetAccounts"]]},
    ledger:{primary:"거래 입력",action:{view:"investmentIntake"},agent:"JIEUN",recent:"최근 결산",recentTarget:"#ledgerMonthArchive",sections:[["월간 결산","#ledgerMonthly"],["소비 리뷰","#ledgerReviews"],["상세내역","#ledgerItemRows"]]},
    newsroom:{primary:"최신 뉴스 확인",click:"#investmentNewsRefresh",agent:"HANI",recent:"최근 뉴스",recentTarget:"#investmentNewsFeed",sections:[["주간 브리핑","#investmentNewsMarketBrief"],["종목 뉴스","#investmentNewsFeed"]]},
    diet:{primary:"체중 기록",focus:"#bodyWeight",agent:"NAEUN",recent:"최근 측정",recentTarget:"#bodyRows",sections:[["측정","#bodyWeight"],["추이","#bodyChart"]]},
    exercise:{primary:"운동 기록",focus:"#exerciseSteps",agent:"NAEUN",recent:"최근 운동",recentTarget:"#exerciseRows",sections:[["기록","#exerciseSteps"],["목록","#exerciseRows"]]},
    reading:{primary:"책 등록",focus:"#bookTitle",agent:"HARU",recent:"최근 책",recentTarget:"#readBooks",sections:[["책 등록","#bookTitle"],["나의 서재","#readBooks"],["읽기 목록","#wishBooks"]]},
    study:{primary:"학습 프로젝트 추가",click:"#studyProjectNew",agent:"HINA",recent:"최근 학습",recentTarget:"#studyHistoryPanel",sections:[["프로젝트","#studyProjectList"],["학습 기록","#studyHistoryPanel"]]},
    university:{primary:"과목 확인",target:"#campusCourseSections,#campusEmpty",recent:"학기·과목",recentTarget:"#campusCourseSections,#campusEmpty",agent:"HINA",sections:[["학기","#campusSemesterSelect"],["과목","#campusCourseSections,#campusEmpty"],["일정","#campusEventList"]]},
    certificate:{primary:"자격증 등록",focus:"#certificateName",agent:"HINA",recent:"최근 자격증",recentTarget:"#certificateList",sections:[["등록","#certificateName"],["목록","#certificateList"]]},
    wishlist:{primary:"Wish 등록",click:"#wishlistAdd",agent:"HARU",recent:"최근 Wish",recentTarget:"#wishlistGrid",alert:"#wishlistCount",alertLabel:"Wish 항목",sections:[["현황","#wishlistGrid"],["검색","#wishlistSearch"]]},
    travel:{primary:"여행 만들기",click:"#travelAddTrip",agent:"SOOYEON",recent:"최근 여행",recentTarget:"#travelTripGrid",sections:[["완료 여행","#travelTripGrid"],["장소","#travelArchiveGrid"],["갈 여행","#travelWishGrid"]]},
    movie:{primary:"시청 기록 추가",focus:"#movieTitle",agent:"MINJI",recent:"최근 시청",recentTarget:"#watchedMovies",sections:[["등록","#movieTitle"],["아카이브","#watchedMovies"],["관람 예정","#wishMovies"]]},
    game:{primary:"최신 결과 보기",target:"#sportsPanel-home",recent:"최근 경기",recentTarget:"#sportsPanel-home",agent:"SOOYEON",sections:[["팀 현황","#sportsPanel-home"]]},
    diary:{primary:"새 일기",focus:"#diaryTitle",agent:"HARU",recent:"최근 일기",recentTarget:"#diaryList",sections:[["일기 작성","#diaryTitle"],["나의 일기장","#diaryList"]]},
    tasks:{primary:"할 일 추가",focus:"#taskText",agent:"YUNA",recent:"최근 할 일",recentTarget:"#taskList",alert:"#taskCount",alertLabel:"할 일",sections:[["새 할 일","#taskText"],["목록","#taskList"],["Calendar","#taskCalendarHub"]]},
    calendar:{primary:"오늘 일정",recent:"캘린더",recentTarget:"#calendar",agent:"YUNA",sections:[["캘린더","#calendar"]]},
    drive:{primary:"Drive 열기",recent:"Drive",recentTarget:"#drive",agent:"SUA",sections:[["Drive","#drive"]]},
    aura:{primary:"색상 고르기",click:'.aura-tabs [data-panel="auraFinishes"]',recent:"나의 색 · 우리들의 계절",recentTarget:"#auraCurrentCombination",agent:"HANI",sections:[["AURA 쇼룸","#aura"]]},
    settings:{primary:"백업",click:"#quickBackup",recent:"저장·Cloud 상태",recentTarget:"#storageStats",agent:"YUNA",sections:[["저장","#storageStats"],["Cloud","#cloudBridgeCard"]]},
    dev:{primary:"Release 확인",action:{view:"deployment"},recent:"개발센터",recentTarget:"#dev",agent:"SEOYUN",sections:[["Release","#dev"]]}
  };

  const rail=document.createElement("aside");
  rail.id="haniContextRemote";rail.className="hani-context-remote";rail.setAttribute("aria-label","HANI Context Remote");
  rail.innerHTML=`<div class="hani-remote-head"><span class="hani-remote-brand">HANI REMOTE</span><button type="button" class="hani-remote-collapse" aria-label="HANI Remote 접기">›</button><button type="button" class="hani-remote-close" aria-label="HANI Remote 닫기">×</button></div>
    <section class="hani-remote-media" aria-label="지금 보는 화면">
      <img class="hani-remote-media-image" alt="" loading="lazy" decoding="async">
      <span class="hani-remote-media-chip">지금 보는 화면</span>
      <div class="hani-remote-media-content"><h2 data-remote-media-title></h2><p class="hani-remote-media-staff" data-remote-media-staff></p><p class="hani-remote-media-line" data-remote-media-line></p>
        <div class="hani-remote-media-actions">
          <div><button type="button" data-remote-action="primary" aria-label="주 작업"><span aria-hidden="true">＋</span></button><span>주 작업</span></div>
          <div><button type="button" data-remote-action="yuna" aria-label="유나에게 빠른 입력"><span aria-hidden="true">ϟ</span></button><span>빠른 입력</span></div>
          <div><button type="button" data-remote-action="agent" aria-label="담당 직원 프로필"><span aria-hidden="true">♙</span></button><span>담당</span></div>
          <div><button type="button" data-remote-action="recent" aria-label="최근 항목"><span aria-hidden="true">↶</span></button><span>최근</span></div>
        </div>
      </div>
    </section>
    <nav class="hani-remote-nav" aria-label="현재 화면 빠른 작업">
      <p class="hani-remote-group-label">현재 화면 · 빠른 작업</p>
      <button type="button" class="hani-remote-item is-current" data-remote-action="current"><span class="hani-remote-icon">⌖</span><span class="hani-remote-copy"><b>현재 섹션</b><small data-remote-current></small></span></button>
      <button type="button" class="hani-remote-item is-primary" data-remote-action="primary"><span class="hani-remote-icon">＋</span><span class="hani-remote-copy"><b data-remote-primary></b><small>Context Primary Action</small></span></button>
      <button type="button" class="hani-remote-item is-yuna" data-remote-action="yuna"><span class="hani-remote-icon">⚡</span><span class="hani-remote-copy"><b>유나에게 빠른 입력</b><small data-remote-yuna></small></span></button>
      <button type="button" class="hani-remote-item" data-remote-action="agent"><span class="hani-remote-icon">♙</span><span class="hani-remote-copy"><b data-remote-agent></b><small>프로필 · 관련 업무</small></span></button>
      <button type="button" class="hani-remote-item" data-remote-action="recent"><span class="hani-remote-icon">↶</span><span class="hani-remote-copy"><b data-remote-recent></b><small>현재 Domain 최근 항목</small></span></button>
      <button type="button" class="hani-remote-item is-alert" data-remote-action="alert" hidden><span class="hani-remote-icon">♢</span><span class="hani-remote-copy"><b data-remote-alert></b><small>확인이 필요합니다</small></span><span class="hani-remote-count" data-remote-count></span></button>
    </nav>
    <section class="hani-remote-today" aria-label="오늘 할 일">
      <button type="button" class="hani-remote-item" data-remote-action="tasks"><span class="hani-remote-icon">✓</span><span class="hani-remote-copy"><b>오늘 할 일</b><small data-remote-today-summary>할 일 확인</small></span><span class="hani-remote-count" data-remote-today-count hidden></span></button>
      <div class="hani-remote-quizzes" data-remote-quizzes hidden></div>
    </section>
    <section class="hani-remote-section"><span class="hani-remote-section-label">SECTION SHORTCUTS</span><div class="hani-remote-links" data-remote-links><button type="button" class="hani-remote-link" hidden></button><button type="button" class="hani-remote-link" hidden></button><button type="button" class="hani-remote-link" hidden></button><button type="button" class="hani-remote-link" hidden></button></div></section>
    <div class="hani-remote-utility"><p class="hani-remote-group-label">화면 설정 · 이동</p><button type="button" class="hani-remote-item" data-remote-action="theme"><span class="hani-remote-icon">✦</span><span class="hani-remote-copy"><b>테마 스튜디오</b><small>AURA</small></span></button><button type="button" class="hani-remote-item" data-remote-action="top"><span class="hani-remote-icon">↑</span><span class="hani-remote-copy"><b>맨 위로</b><small>Utility</small></span></button></div>`;
  app.append(rail);
  const mobileTrigger=document.createElement("button");mobileTrigger.type="button";mobileTrigger.className="hani-remote-mobile-trigger";mobileTrigger.innerHTML="<span>✦</span> HANI Remote";mobileTrigger.setAttribute("aria-controls",rail.id);mobileTrigger.setAttribute("aria-expanded","false");app.append(mobileTrigger);

  const viewId=()=>document.body.dataset.view||$(".view.active")?.id||"home";
  // On the market screen use its existing toolbar, not a floating chart overlay.
  const placeMobileTrigger=()=>{const mobile=innerWidth<=850,view=viewId(),marketSlot=mobile&&view==='investment'&&document.querySelector('#investOverview.active #investOverviewStocks.active')?document.querySelector('#assetMarket .market-toolbar'):null,intakeSlot=mobile&&view==='intake'?document.querySelector('header.top .top-actions'):null;const target=marketSlot||intakeSlot||app;if(mobileTrigger.parentElement!==target)target.append(mobileTrigger);mobileTrigger.classList.toggle('is-market-inline',!!marketSlot);mobileTrigger.classList.toggle('is-intake-inline',!!intakeSlot)};
  const config=()=>defaults[viewId()]||{primary:"현재 화면 보기",agent:"HANI",recent:"최근 항목",recentTarget:`#${viewId()}`,sections:[["현재 화면",`#${viewId()}`]]};
  // Resolve alternatives in the current view first (never a hidden input on another route).
  const visibleTarget=selector=>{try{const nodes=selector?[...document.querySelectorAll(selector)]:[],local=nodes.filter(n=>n.closest('.view')?.id===viewId());return [...local,...nodes.filter(n=>!n.closest('.view'))].find(n=>n.checkVisibility({checkVisibilityCSS:true}))||local[0]||nodes.find(n=>!n.closest('.view'))||null}catch{return null}};
  const goView=id=>{if(typeof showView==='function'){showView(id);return viewId()===id.split('/')[0]}const nav=$('#sidebar [data-view="'+id+'"]');if(nav){nav.click();return true}return false};
  const owner=()=>window.HANI_MAIN_CHARACTER_BANNER?.get(viewId())?.owner||String(config().agent||'hani').toLowerCase();
  const profileRoute=()=>window.HaniOrganizationRoster?.people.some(p=>p.id===owner())&&typeof window.HaniOrganizationHub?.openPerson==='function'?'organization/people/'+owner():null;
  // Existing tab controls remain the owners of panel visibility and rendering.
  const targetTabs={
    '#studyProjectNew':'[data-study-tab="board"]','#studyHistoryPanel':'[data-study-tab="history"]',
    '#sportsPanel-home':'[data-sports-tab="home"]','#investmentNewsMarketBrief':'[data-newsroom-mode="general"]',
    '#investmentNewsFeed':'[data-newsroom-mode="interest"]','#monthlyReportMonth':'[data-report-board="monthly"]',
    '#monthlyReportArchive':'[data-report-board="monthly"]','#storageStats':'[data-settings-tab="data"]',
    '#cloudBridgeCard':'[data-settings-tab="data"]'
  };
  const targetAvailable=selector=>{const el=visibleTarget(selector);return !!el&&(el.checkVisibility({checkVisibilityCSS:true})||!!targetTabs[selector]||!!el.closest('details')||[...el.closest('.view')?.querySelectorAll('[data-panel]')||[]].some(b=>el.closest('#'+b.dataset.panel))||viewId()==='investmentCommittee')};
  const resolveTarget=selector=>{
    if(targetTabs[selector]){const tab=visibleTarget(targetTabs[selector]);if(tab&&!tab.matches('.active,.is-active,[aria-selected="true"]'))tab.click()}
    if(viewId()==='investmentCommittee'&&(selector==='#icResearch'||selector==='#icMonthly'))window.HaniInvestmentCommittee?.select(selector==='#icMonthly'?'monthly':'research');
    let el=visibleTarget(selector);if(!el)return null;
    const ancestors=[];for(let n=el;n&&n!==document.body;n=n.parentElement)ancestors.unshift(n);
    for(const n of ancestors){if(n.matches('details'))n.open=true;if(n.matches('.panel[id]'))document.querySelector('#'+viewId()+' [data-panel="'+n.id+'"]')?.click()}
    el=visibleTarget(selector);
    if(!el?.checkVisibility({checkVisibilityCSS:true}))return null;
    // Empty record tables still have a useful, visible record card.
    if(el.matches('tbody')||!el.getBoundingClientRect().height)el=el.closest('.card')||el.parentElement;
    return el;
  };
  const moveTo=selector=>{const el=resolveTarget(selector);if(!el)return false;el.scrollIntoView({behavior:"smooth",block:"start"});return true};
  const focusTarget=selector=>{const el=resolveTarget(selector);if(!el)return false;el.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>el.focus?.({preventScroll:true}),260);return true};
  const actionAvailable=(action,c)=>action==='agent'?!!profileRoute():action==='yuna'?!!document.querySelector('#intake #yunaInput,#intake #intakeSourceText'):action==='recent'?targetAvailable(c.recentTarget||'#'+viewId()):c.action?.view?!!document.getElementById(c.action.view):targetAvailable(c.click||c.focus||c.target||'#'+viewId());
  const countFrom=selector=>{const text=visibleTarget(selector)?.textContent||"";const match=text.replaceAll(",","").match(/\d+/);return match?Number(match[0]):0};
  const season=()=>["spring","summer","autumn","winter"].includes(document.documentElement.dataset.season)?document.documentElement.dataset.season:"spring";
  const greetings={spring:["히나 · 🌸","햇살 좋은 날엔, 새로운 한 페이지부터 시작해요."],summer:["나은 · 🧊","물 한 잔, 시원한 숨 한 번. 오늘도 무리하지 말아요."],autumn:["하루 · ☕","따뜻한 커피랑 책 한 페이지, 오늘은 천천히 즐겨봐."],winter:["하니 · 🧣","따뜻한 머그 옆에서, 오늘의 기록을 함께 마무리하자."]};
  // Scene focal points from the approved bright-card mock; all sources stay cover.
  const mediaFocal={reading:"57% 22%",investment:"51% 24%",exercise:"53% 32%",geminiReports:"63% 38%"};
  const updateBanner=(c,title)=>{
    const hero=window.HANI_MAIN_CHARACTER_BANNER?.get(viewId()),s=season();
    // Resolve only the current image. Reuse the banner's source, speaker and quote.
    const seasonal=window.HANI_MAIN_CHARACTER_BANNER?.get("home");
    const src=hero?.sceneImage||seasonal?.sceneImage||$("#sidebarSeasonArtwork")?.getAttribute("src"),img=$(".hani-remote-media-image",rail);
    if(src&&img.getAttribute("src")!==src)img.src=src;
    img.style.objectPosition=mediaFocal[viewId()]||"50% 30%";
    img.alt=hero?.sceneAlt||seasonal?.sceneAlt||"HANI OS 계절 아트";
    $("[data-remote-media-title]",rail).textContent=title;
    $("[data-remote-media-staff]",rail).textContent=`담당 직원 · ${hero?.speaker||c.agent||"HANI"}`;
    $("[data-remote-media-line]",rail).textContent=hero?.quote||greetings[s][1];
    for(const [action,label] of [["primary",c.primary],["recent",c.recent]]){
      const button=$(`.hani-remote-media [data-remote-action="${action}"]`,rail);
      button.setAttribute("aria-label",label||"현재 화면 보기");button.title=label||"현재 화면 보기";
    }
  };
  const updateToday=()=>{
    const study=window.HANI_STUDY_V02984_TEST,day=typeof careKoreaPeriod==='function'?careKoreaPeriod().day:new Date(Date.now()+9*3600000).toISOString().slice(0,10);
    const quizzes=[...(study?.pendingLearningQuizzes?.()||[])].sort((a,b)=>String(study.quizDate(a)).localeCompare(String(study.quizDate(b))));
    const tasks=typeof state==='object'?(state.tasks||[]).filter(t=>!t.done&&t.due===day):[];
    const total=typeof taskReadModel==='function'?taskReadModel(day).count:tasks.length+quizzes.filter(q=>study.quizDate(q)===day).length;
    const section=$('.hani-remote-today',rail),badge=$('[data-remote-today-count]',rail),box=$('[data-remote-quizzes]',rail);
    section.classList.toggle('is-today',total>0);badge.hidden=!total;badge.textContent=String(total);
    $('[data-remote-today-summary]',rail).textContent=`할 일 ${total}개 · 전체 미완료 퀴즈 ${quizzes.length}개`;
    const signature=JSON.stringify(quizzes.map(q=>[q.id,q.title,study.quizDate(q),q.status]));
    box.hidden=!quizzes.length;
    if(box.dataset.signature===signature)return;
    box.dataset.signature=signature;box.replaceChildren();
    for(const quiz of quizzes){
      const button=document.createElement('button');button.type='button';button.className='hani-remote-link';button.dataset.remoteQuiz=quiz.id;
      button.textContent=(quiz.title||'미완료 퀴즈')+' · '+(study.quizDate(quiz)===day?'오늘':study.quizDate(quiz)||'날짜 미지정');box.append(button);
    }
  };
  let lastView="";
  const update=()=>{updateToday();const c=config(),title=$("#title")?.textContent?.trim()||viewId();$("[data-remote-current]",rail).textContent=title;$("[data-remote-primary]",rail).textContent=c.primary||"현재 화면 보기";$("[data-remote-yuna]",rail).textContent=`${title} Context로 시작`;$("[data-remote-agent]",rail).textContent=`담당 Agent · ${window.HANI_MAIN_CHARACTER_BANNER?.get(viewId())?.speaker||c.agent||"HANI"}`;$("[data-remote-recent]",rail).textContent=c.recent||"최근 항목";const sections=(c.sections||[]).filter(([,target])=>targetAvailable(target)).slice(0,4);$('[data-remote-links]',rail).querySelectorAll('button').forEach((b,i)=>{const section=sections[i];b.hidden=!section;if(section){b.textContent=section[0];b.dataset.target=section[1]}});const alert=$("[data-remote-action=alert]",rail),count=countFrom(c.alert);alert.hidden=!c.alert||count<1;if(!alert.hidden){$("[data-remote-alert]",rail).textContent=c.alertLabel||"확인 필요";$("[data-remote-count]",rail).textContent=String(count)}for(const action of ["primary","yuna","agent","recent"]){const available=actionAvailable(action,c);rail.querySelectorAll(`[data-remote-action="${action}"]`).forEach(b=>{b.hidden=!available;if(b.closest(".hani-remote-media"))b.parentElement.hidden=!available})}updateBanner(c,title);placeMobileTrigger();if(lastView!==viewId()){setMobile(false);lastView=viewId()}};

  rail.addEventListener("click",e=>{const quiz=e.target.closest('[data-remote-quiz]');if(quiz){window.HANI_STUDY_V02984_TEST?.openPendingQuiz(quiz.dataset.remoteQuiz);setMobile(false);return}const shortcut=e.target.closest(".hani-remote-link");if(shortcut){moveTo(shortcut.dataset.target);return}const action=e.target.closest("[data-remote-action]")?.dataset.remoteAction;if(!action)return;if(action==="tasks"){goView("tasks");setMobile(false);return}const c=config();if(action==="current")moveTo(`#${viewId()}`);if(action==="primary"){if(c.action?.view)goView(c.action.view);else if(c.click){const target=resolveTarget(c.click);if(target){target.focus();target.click()}}else if(c.focus)focusTarget(c.focus);else moveTo(c.target||`#${viewId()}`)}if(action==="yuna"){goView("intake");setTimeout(()=>focusTarget("#yunaInput,#intakeSourceText"),180)}if(action==="agent"){const route=profileRoute();if(route)goView(route);setMobile(false)}if(action==="theme"){goView("aura");setMobile(false)}if(action==="recent")moveTo(c.recentTarget||`#${viewId()}`);if(action==="alert")moveTo(c.recentTarget||c.alert);if(["primary","yuna","recent","current"].includes(action))setMobile(false);if(action==="top")window.scrollTo({top:0,behavior:"smooth"})});
  $(".hani-remote-collapse",rail).addEventListener("click",()=>{const mini=app.classList.toggle("hani-remote-mini");$(".hani-remote-collapse",rail).textContent=mini?"‹":"›";$(".hani-remote-collapse",rail).setAttribute("aria-label",mini?"HANI Remote 펼치기":"HANI Remote 접기")});
  const setMobile=open=>{rail.dataset.open=open?"true":"false";mobileTrigger.setAttribute("aria-expanded",String(open))};
  mobileTrigger.addEventListener("click",()=>setMobile(rail.dataset.open!=="true"));
  $(".hani-remote-close",rail).addEventListener("click",()=>setMobile(false));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")setMobile(false)});
  document.addEventListener("click",e=>{const route=e.target.closest("[data-view]");if(route&&route!==document.body)setMobile(false);else if(e.target.closest("[data-task-check],[data-task-delete]"))setTimeout(updateToday,0);else if(e.target.closest(".investment-tabs-main,.investment-overview-tabs,[data-asset-market-link],[data-ic=portfolio]"))setTimeout(placeMobileTrigger,0)});
  window.addEventListener("resize",()=>{if(innerWidth>850)setMobile(false);placeMobileTrigger()},{passive:true});
  placeMobileTrigger();
  update();
  window.HANI_CONTEXT_REMOTE_V1=Object.freeze({update});
})();
