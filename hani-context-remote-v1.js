"use strict";
(()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const app=$("#app");
  if(!app||$("#haniContextRemote"))return;

  const banners={
    spring:["spring-1.jpg","spring-2.jpg"],summer:["summer-1.jpg","summer-2.jpg"],
    autumn:["autumn-1.jpg","autumn-2.jpg"],winter:["winter-1.jpg","winter-2.jpg"]
  };
  const bannerMembers={
    spring:["HINA · JIEUN · MINJI · SUA","HANI · HARU · SOOYEON · YUNA"],
    summer:["MINJI · NAEUN · SUA","HANI · HINA · SOOYEON · YUNA"],
    autumn:["JIEUN · NAEUN · SUA","HANI · HARU · HINA · MINJI · YUNA"],
    winter:["HINA · MINJI · NAEUN · SUA · YUNA","HANI · HARU · JIEUN · SOOYEON"]
  };
  const defaults={
    home:{primary:"오늘 할 일",action:{view:"tasks"},agent:"HANI",recent:"최근 활동",recentTarget:"#homeRecentActivity",sections:[["시장","#lifeMarketGrid"],["자산","#homeDashboardGrid"],["AI TEAM","#homeDialogueText"]]},
    intake:{primary:"새 기록 접수",focus:"#yunaInput,#intakeSourceText",agent:"YUNA",recent:"최근 접수",recentTarget:"#yunaConversation,#intakePreview",sections:[["빠른 접수","#yunaInput,#intakeSourceText"],["Preview","#yunaConversation,#intakePreview"]]},
    agentReview:{primary:"새 안건 접수",focus:"#agentRequestInput",agent:"HANI",recent:"최근 결재안",recentTarget:"#agentCaseList",alert:"#agentCaseCount",alertLabel:"검토 안건",sections:[["안건","#agentCaseList"],["회의·검토","#agentCaseDetail"],["새 접수","#agentRequestInput"]]},
    policy:{primary:"규정 새로고침",click:"#agentRefreshPolicies",agent:"HANI",recent:"현재 규정",recentTarget:"#agentPolicyRegistry",sections:[["Registry","#agentPolicyRegistry"],["상태","#agentPolicyRegistryState"]]},
    deployment:{primary:"배포 상태 확인",click:"#deployExecRefreshBtn",agent:"HINA",recent:"Release Queue",recentTarget:"#deployExecutiveCard",sections:[["현황","#deployExecutiveCard"],["Inbox","#deployInboxRefreshBtn"],["HINA QA","#deployHinaQaBtn"]]},
    investment:{primary:"자산 업데이트",action:{view:"investmentIntake"},agent:"HANI",recent:"최근 월간 기록",recentTarget:"#investmentMonthly",sections:[["현황","#investmentOverview"],["월간 기록","#investmentMonthly"],["종목 관리","#investmentManage"]]},
    investmentIntake:{primary:"업데이트 입력",focus:"#ledgerImportRaw",agent:"YUNA",recent:"입력 안내",recentTarget:"#ledgerImportResult",sections:[["복붙 입력","#ledgerImportRaw"],["미리보기","#ledgerImportResult"]]},
    asset:{primary:"자산 업데이트",action:{view:"investmentIntake"},agent:"HANI",recent:"자산 현황",recentTarget:"#assetDashboard",sections:[["현황","#assetDashboard"],["계좌","#assetAccounts"]]},
    ledger:{primary:"거래 입력",focus:"#ledgerImportRaw",agent:"JIEUN",recent:"최근 결산",recentTarget:"#ledgerMonthArchive",sections:[["월간 결산","#ledgerMonthly"],["소비 리뷰","#ledgerReviews"],["상세내역","#ledgerItemRows"]]},
    newsroom:{primary:"최신 뉴스 확인",click:"#investmentNewsRefresh",agent:"HANI",recent:"최근 뉴스",recentTarget:"#investmentNewsFeed",sections:[["주간 브리핑","#investmentNewsMarketBrief"],["종목 뉴스","#investmentNewsFeed"]]},
    diet:{primary:"체중 기록",focus:"#bodyWeight",agent:"NAEUN",recent:"최근 측정",recentTarget:"#bodyHistory",sections:[["측정","#bodyWeight"],["추이","#bodyChart"]]},
    exercise:{primary:"운동 기록",focus:"#exerciseType",agent:"NAEUN",recent:"최근 운동",recentTarget:"#exerciseList",sections:[["기록","#exerciseType"],["목록","#exerciseList"]]},
    reading:{primary:"책 등록",focus:"#bookTitle",agent:"HARU",recent:"최근 책",recentTarget:"#readBooks",sections:[["책 등록","#bookTitle"],["나의 서재","#readBooks"],["읽기 목록","#wishBooks"]]},
    study:{primary:"학습 기록",focus:"#studySubject",agent:"HARU",recent:"최근 학습",recentTarget:"#studyArchive",sections:[["프로젝트","#studyProjectList"],["학습 기록","#studyArchive"]]},
    university:{primary:"과목 확인",recent:"학기·과목",recentTarget:"#campusCourses",agent:"HINA",sections:[["학기","#campusSemesters"],["과목","#campusCourses"],["일정","#campusCalendar"]]},
    certificate:{primary:"자격증 등록",focus:"#certificateName",agent:"HARU",recent:"최근 자격증",recentTarget:"#certificateList",sections:[["등록","#certificateName"],["목록","#certificateList"]]},
    wishlist:{primary:"Wish 등록",click:"#wishlistAdd",agent:"YUNA",recent:"최근 Wish",recentTarget:"#wishlistGrid",alert:"#wishlistCount",alertLabel:"Wish 항목",sections:[["현황","#wishlistGrid"],["검색","#wishlistSearch"]]},
    travel:{primary:"여행 만들기",click:"#travelAddTrip",agent:"YUNA",recent:"최근 여행",recentTarget:"#travelTripGrid",sections:[["완료 여행","#travelTripGrid"],["장소","#travelArchiveGrid"],["갈 여행","#travelWishGrid"]]},
    movie:{primary:"시청 기록 추가",focus:"#movieTitle",agent:"HINA",recent:"최근 시청",recentTarget:"#watchedMovies",sections:[["등록","#movieTitle"],["아카이브","#watchedMovies"],["관람 예정","#wishMovies"]]},
    game:{primary:"최신 결과 보기",recent:"최근 경기",recentTarget:"#sportsHomeOverview",agent:"SOOYEON",sections:[["팀 현황","#sportsHomeOverview"],["상세 결과","#sportsTeamGrid"]]},
    diary:{primary:"새 일기",focus:"#diaryTitle",agent:"YUNA",recent:"최근 일기",recentTarget:"#diaryList",sections:[["일기 작성","#diaryTitle"],["나의 일기장","#diaryList"]]},
    tasks:{primary:"할 일 추가",focus:"#taskText",agent:"SUA",recent:"최근 할 일",recentTarget:"#taskList",alert:"#taskCount",alertLabel:"할 일",sections:[["새 할 일","#taskText"],["목록","#taskList"],["Calendar","#taskCalendarHub"]]},
    calendar:{primary:"오늘 일정",recent:"캘린더",recentTarget:"#calendar",agent:"SUA",sections:[["캘린더","#calendar"]]},
    drive:{primary:"Drive 열기",recent:"Drive",recentTarget:"#drive",agent:"SUA",sections:[["Drive","#drive"]]},
    aiTeam:{primary:"팀 프로필 보기",recent:"AI Executive Team",recentTarget:"#teamList",agent:"HANI",sections:[["팀 소개","#teamList"],["프로필","#teamProfilePanel"]]},
    settings:{primary:"백업",click:"#quickBackup",recent:"저장·Cloud 상태",recentTarget:"#storagePanel",agent:"HANI",sections:[["저장","#storagePanel"],["Cloud","#cloudPanel"]]},
    dev:{primary:"Release 확인",action:{view:"deployment"},recent:"개발센터",recentTarget:"#dev",agent:"SUA",sections:[["Release","#dev"]]}
  };

  const rail=document.createElement("aside");
  rail.id="haniContextRemote";rail.className="hani-context-remote";rail.setAttribute("aria-label","HANI Context Remote");
  rail.innerHTML=`<div class="hani-remote-head"><span class="hani-remote-brand">HANI REMOTE</span><button type="button" class="hani-remote-collapse" aria-label="HANI Remote 접기">›</button><button type="button" class="hani-remote-close" aria-label="HANI Remote 닫기">×</button></div>
    <figure class="hani-remote-scene"><img alt="HANI OS 공식 프로필 계절 배너"><figcaption><span data-remote-season></span><b data-remote-members></b></figcaption></figure>
    <nav class="hani-remote-nav" aria-label="현재 화면 빠른 작업">
      <button type="button" class="hani-remote-item is-current" data-remote-action="current"><span class="hani-remote-icon">⌖</span><span class="hani-remote-copy"><b>현재 섹션</b><small data-remote-current></small></span></button>
      <button type="button" class="hani-remote-item is-primary" data-remote-action="primary"><span class="hani-remote-icon">＋</span><span class="hani-remote-copy"><b data-remote-primary></b><small>Context Primary Action</small></span></button>
      <button type="button" class="hani-remote-item is-yuna" data-remote-action="yuna"><span class="hani-remote-icon">⚡</span><span class="hani-remote-copy"><b>유나에게 빠른 입력</b><small data-remote-yuna></small></span></button>
      <button type="button" class="hani-remote-item" data-remote-action="agent"><span class="hani-remote-icon">♙</span><span class="hani-remote-copy"><b data-remote-agent></b><small>프로필 · 관련 업무</small></span></button>
      <button type="button" class="hani-remote-item" data-remote-action="recent"><span class="hani-remote-icon">↶</span><span class="hani-remote-copy"><b data-remote-recent></b><small>현재 Domain 최근 항목</small></span></button>
      <button type="button" class="hani-remote-item is-alert" data-remote-action="alert" hidden><span class="hani-remote-icon">♢</span><span class="hani-remote-copy"><b data-remote-alert></b><small>확인이 필요합니다</small></span><span class="hani-remote-count" data-remote-count></span></button>
    </nav>
    <section class="hani-remote-section"><span class="hani-remote-section-label">SECTION SHORTCUTS</span><div class="hani-remote-links" data-remote-links></div></section>
    <div class="hani-remote-utility"><button type="button" class="hani-remote-item" data-remote-action="top"><span class="hani-remote-icon">↑</span><span class="hani-remote-copy"><b>맨 위로</b><small>Utility</small></span></button></div>`;
  app.append(rail);
  const mobileTrigger=document.createElement("button");mobileTrigger.type="button";mobileTrigger.className="hani-remote-mobile-trigger";mobileTrigger.innerHTML="<span>✦</span> HANI Remote";mobileTrigger.setAttribute("aria-controls",rail.id);mobileTrigger.setAttribute("aria-expanded","false");app.append(mobileTrigger);

  const viewId=()=>document.body.dataset.view||$(".view.active")?.id||"home";
  const config=()=>defaults[viewId()]||{primary:"현재 화면 보기",agent:"HANI",recent:"최근 항목",recentTarget:`#${viewId()}`,sections:[["현재 화면",`#${viewId()}`]]};
  const visibleTarget=selector=>{try{return selector?$(selector):null}catch{return null}};
  const goView=id=>{const nav=$(`[data-view="${id}"]`);if(nav){nav.click();return true}return false};
  const moveTo=selector=>{const el=visibleTarget(selector);if(!el)return false;el.scrollIntoView({behavior:"smooth",block:"start"});return true};
  const focusTarget=selector=>{const el=visibleTarget(selector);if(!el)return false;el.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>el.focus?.({preventScroll:true}),260);return true};
  const countFrom=selector=>{const text=visibleTarget(selector)?.textContent||"";const match=text.replaceAll(",","").match(/\d+/);return match?Number(match[0]):0};
  const season=()=>["spring","summer","autumn","winter"].includes(document.documentElement.dataset.season)?document.documentElement.dataset.season:"spring";
  const variant=()=>{const start=new Date(new Date().getFullYear(),0,0);const day=Math.floor((new Date()-start)/86400000);return (day+Object.keys(defaults).indexOf(viewId()))%2};
  const updateBanner=()=>{const s=season(),i=Math.max(0,variant()),img=$(".hani-remote-scene img",rail);img.src=`./assets/context-remote/${banners[s][i]}`;img.alt=`HANI OS 공식 프로필 ${s} 계절 배너 · ${bannerMembers[s][i]}`;$("[data-remote-season]",rail).textContent=({spring:"SPRING",summer:"SUMMER",autumn:"AUTUMN",winter:"WINTER"})[s];$("[data-remote-members]",rail).textContent=bannerMembers[s][i]};
  const update=()=>{const c=config(),title=$("#title")?.textContent?.trim()||viewId();$("[data-remote-current]",rail).textContent=title;$("[data-remote-primary]",rail).textContent=c.primary||"현재 화면 보기";$("[data-remote-yuna]",rail).textContent=`${title} Context로 시작`;$("[data-remote-agent]",rail).textContent=`담당 Agent · ${c.agent||"HANI"}`;$("[data-remote-recent]",rail).textContent=c.recent||"최근 항목";const links=$("[data-remote-links]",rail);links.innerHTML="";(c.sections||[]).filter(([,target])=>visibleTarget(target)).slice(0,4).forEach(([label,target])=>{const b=document.createElement("button");b.type="button";b.className="hani-remote-link";b.textContent=label;b.dataset.target=target;links.append(b)});const alert=$("[data-remote-action=alert]",rail),count=countFrom(c.alert);alert.hidden=!c.alert||count<1;if(!alert.hidden){$("[data-remote-alert]",rail).textContent=c.alertLabel||"확인 필요";$("[data-remote-count]",rail).textContent=String(count)}updateBanner()};

  rail.addEventListener("click",e=>{const shortcut=e.target.closest(".hani-remote-link");if(shortcut){moveTo(shortcut.dataset.target);return}const action=e.target.closest("[data-remote-action]")?.dataset.remoteAction;if(!action)return;const c=config();if(action==="current")moveTo(`#${viewId()}`);if(action==="primary"){if(c.action?.view)goView(c.action.view);else if(c.click)visibleTarget(c.click)?.click();else if(c.focus)focusTarget(c.focus);else moveTo(`#${viewId()}`)}if(action==="yuna"){goView("intake");setTimeout(()=>focusTarget("#yunaInput,#intakeSourceText"),180)}if(action==="agent")goView("aiTeam");if(action==="recent")moveTo(c.recentTarget||`#${viewId()}`);if(action==="alert")moveTo(c.recentTarget||c.alert);if(action==="top")window.scrollTo({top:0,behavior:"smooth"})});
  $(".hani-remote-collapse",rail).addEventListener("click",()=>{const mini=app.classList.toggle("hani-remote-mini");$(".hani-remote-collapse",rail).textContent=mini?"‹":"›";$(".hani-remote-collapse",rail).setAttribute("aria-label",mini?"HANI Remote 펼치기":"HANI Remote 접기")});
  const setMobile=open=>{rail.dataset.open=open?"true":"false";mobileTrigger.setAttribute("aria-expanded",String(open))};
  mobileTrigger.addEventListener("click",()=>setMobile(rail.dataset.open!=="true"));
  $(".hani-remote-close",rail).addEventListener("click",()=>setMobile(false));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")setMobile(false)});
  new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:["data-view"]});
  new MutationObserver(updateBanner).observe(document.documentElement,{attributes:true,attributeFilter:["data-season"]});
  document.addEventListener("click",e=>{const route=e.target.closest("[data-view]");if(route&&route!==document.body)setTimeout(()=>{update();setMobile(false)},0)});
  window.addEventListener("resize",()=>{if(innerWidth>850)setMobile(false)},{passive:true});
  update();
  window.HANI_CONTEXT_REMOTE_V1=Object.freeze({update});
})();
