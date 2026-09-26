"use strict";
(()=>{
  if(window.HANI_DEVELOPMENT_HISTORY_V1)return;
  const HISTORY=Object.freeze([
    {id:"v2.9.135",date:"2026-09-27",status:"preview",title:"Context Remote · Seasonal Character Rail",summary:"화면별 주요 작업·유나 빠른 입력·담당 Agent·최근 항목·조건부 알림을 묶은 Context Remote와 공식 9인 프로필 기반 사계절 세로 배너 8장을 추가했습니다.",ref:"c631d7d"},
    {id:"Meeting Preview",date:"2026-09-27",status:"preview",title:"Meeting Deliberation · Cross Review",summary:"실제 안건을 기준으로 Agent 소집, 상호 검토와 결론 흐름을 연결하는 회의 Preview를 준비했습니다.",ref:"f7117cf"},
    {id:"Design System P1",date:"2026-09-21",status:"preview",title:"Global Frame · Sidebar · Top Utility",summary:"전역 프레임 토큰, 사이드바 정보 구조, 상단 Utility와 주요 화면의 시각 계층을 일관된 디자인 시스템으로 정리했습니다.",ref:"df73d3a"},
    {id:"v2.9.134",date:"2026-09-26",status:"released",title:"Learning Quiz Partial Regeneration",summary:"통과한 문제는 보존하고 부족하거나 중복된 문항만 다시 생성하도록 Quiz 재생성 피드백과 중복 회피 흐름을 강화했습니다.",ref:"2152453"},
    {id:"Workflow",date:"2026-09-26",status:"process",title:"HANI 개발 Flow 정립",summary:"요구사항 정리부터 Static Test, 유리·히나 QA, Preview, 대표 승인, Production read-back까지의 안전한 개발 절차를 문서화했습니다.",ref:"730657b"},
    {id:"v2.9.133",date:"2026-09-21",status:"released",title:"Daily Quiz Duplicate Guard",summary:"최근 문제와 같은 세트의 중복 문항을 차단하고 유효 문항을 부분 재생성하는 안전장치를 보강했습니다.",ref:"6d1016a"},
    {id:"v2.9.132",date:"2026-09-21",status:"released",title:"Living Office · Actual Case Meeting",summary:"성민 오피스의 캐릭터 활동을 실제 AI 결재 Case와 연결하고 회의 장면과 상태 표현을 확장했습니다.",ref:"61b5df3"},
    {id:"v2.9.131",date:"2026-09-21",status:"released",title:"YUNA Helpdesk · Preview Correction",summary:"유나 인포데스크의 자연어 접수 흐름을 정리하고 독서 Preview 수정 내용을 구조화 상태로 안전하게 보존했습니다.",ref:"bf3ef76"},
    {id:"Travel Places",date:"2026-09-20",status:"released",title:"Independent Travel Places Library",summary:"여행 일정과 분리된 장소 아카이브, 후기·평점·재방문 의사와 독립 브라우저 검증을 추가했습니다.",ref:"a0b7665"},
    {id:"v2.9.129",date:"2026-09-20",status:"released",title:"Asset Account-first Review",summary:"증권사 캡처를 반영하기 전에 기존 계좌를 먼저 선택하고 Preview에서 대상 계좌를 재확인하도록 자산 입력 안전성을 높였습니다.",ref:"f19a635"},
    {id:"v2.9.128",date:"2026-09-20",status:"released",title:"Weekly Company Follow-up",summary:"보유 종목과 분리된 기업·산업 Follow-up 보드를 추가하고 주간 핵심 변화만 간결하게 추적하도록 구성했습니다.",ref:"020c59f"},
    {id:"v2.9.127",date:"2026-09-20",status:"released",title:"Movie Season · Episode Parser",summary:"시청 자연어 입력에서 작품명과 시즌·회차를 분리해 아카이브에 정확히 반영하도록 파서를 수정했습니다.",ref:"121ec88"},
    {id:"v2.9.126",date:"2026-09-20",status:"released",title:"Meeting Engine v2 · Batch 1",summary:"추가 질문과 답변을 회의 Preview 안에서 이어가고 Decision Readiness에 따라 다음 단계로 이동하는 흐름을 적용했습니다.",ref:"8b7f364"},
    {id:"v2.9.125",date:"2026-09-20",status:"released",title:"Safe Account Screenshot Update",summary:"여러 계좌 캡처의 귀속을 확인하고 불확실한 계좌 자동 생성을 막으며 계좌 정리 전 백업·검증 절차를 강화했습니다.",ref:"01efcec"},
    {id:"v2.9.123",date:"2026-09-20",status:"released",title:"Learning Board UX · Quiz Reliability",summary:"프로젝트별 학습 보드와 시험지 UX를 정리하고 Quiz 생성·제출·오답 흐름의 안정성을 높였습니다.",ref:"4f011be"},
    {id:"v2.9.122",date:"2026-09-19",status:"released",title:"Screenshot-only Account Update",summary:"자산 캡처 입력과 클립보드 붙여넣기를 연결하고 저장 전 계좌·보유종목 Preview 확인을 강화했습니다.",ref:"3f02818"},
    {id:"v2.9.121",date:"2026-09-19",status:"released",title:"Sports Background Sync",summary:"스포츠 결과를 서버 기반으로 점검하고 공식 출처와 최신 완료 경기 상태를 화면에 안전하게 동기화했습니다.",ref:"83c6368"},
    {id:"v2.9.120",date:"2026-09-15",status:"released",title:"Library · Watch Archive",summary:"독서와 시청 기록을 아카이브 중심으로 재구성하고 목록 탐색과 상세 기록 가독성을 개선했습니다.",ref:"654af6b"}
  ]);
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const statusLabel={preview:"PREVIEW",released:"운영 반영",process:"PROCESS"};
  const row=entry=>`<article class="hani-history-row" data-history-status="${esc(entry.status)}"><div class="hani-history-marker" aria-hidden="true"></div><div class="hani-history-copy"><div class="hani-history-meta"><span class="hani-history-version">${esc(entry.id)}</span><span class="hani-history-status is-${esc(entry.status)}">${esc(statusLabel[entry.status]||entry.status)}</span><time datetime="${esc(entry.date)}">${esc(entry.date.replaceAll("-","."))}</time></div><h4>${esc(entry.title)}</h4><p>${esc(entry.summary)}</p></div><code>${esc(entry.ref)}</code></article>`;
  const openDev=()=>{const nav=document.querySelector('.nav-btn[data-view="dev"]');if(nav)nav.click();else if(typeof showView==="function")showView("dev");setTimeout(()=>document.querySelector("#haniDevelopmentHistory")?.scrollIntoView({behavior:"smooth",block:"start"}),80)};
  function mountHome(){
    const home=document.querySelector("#home"),lower=home?.querySelector(".home-lower-grid");if(!home||!lower||document.querySelector("#haniDevelopmentSnapshot"))return;
    const slot=document.createElement("section");slot.id="haniDevelopmentSnapshot";slot.className="hani-development-snapshot card";slot.innerHTML=`<div class="hani-history-head"><div><span>HANI DEVELOPMENT LOG</span><h3>최근 개발 업데이트</h3><p>Codex 작업과 운영 반영 상태를 한눈에 확인합니다.</p></div><button type="button" class="btn sm" data-history-open>개발센터 전체보기 ›</button></div><div class="hani-history-compact">${HISTORY.slice(0,4).map(row).join("")}</div>`;
    lower.after(slot);slot.querySelector("[data-history-open]")?.addEventListener("click",openDev);
  }
  function mountDev(){
    const dev=document.querySelector("#dev");if(!dev||document.querySelector("#haniDevelopmentHistory"))return;
    [...dev.children].filter(child=>!child.classList.contains("ds-main-character-banner")).forEach(child=>child.remove());
    const shell=document.createElement("section");shell.id="haniDevelopmentHistory";shell.className="hani-dev-history-shell";
    const released=HISTORY.filter(item=>item.status==="released").length,preview=HISTORY.filter(item=>item.status==="preview").length;
    shell.innerHTML=`<div class="hani-dev-history-overview"><div><span>HANI OS · DEVELOPMENT HISTORY</span><h3>Codex 개발 히스토리</h3><p>최근 구현·검증·운영 반영 기록을 최신순으로 정리했습니다. Preview는 대표 승인 전 후보이며 운영 반영과 구분됩니다.</p></div><div class="hani-history-kpis"><div><b>${HISTORY.length}</b><small>기록</small></div><div><b>${released}</b><small>운영 반영</small></div><div><b>${preview}</b><small>Preview</small></div></div></div><div class="hani-history-toolbar" role="group" aria-label="개발 히스토리 필터"><button type="button" class="is-active" data-history-filter="all">전체</button><button type="button" data-history-filter="released">운영 반영</button><button type="button" data-history-filter="preview">Preview</button><button type="button" data-history-filter="process">Process</button></div><div class="hani-history-list">${HISTORY.map(row).join("")}</div>`;
    dev.append(shell);
    shell.querySelectorAll("[data-history-filter]").forEach(button=>button.addEventListener("click",()=>{const filter=button.dataset.historyFilter;shell.querySelectorAll("[data-history-filter]").forEach(item=>item.classList.toggle("is-active",item===button));shell.querySelectorAll(".hani-history-row").forEach(item=>item.hidden=filter!=="all"&&item.dataset.historyStatus!==filter)}));
  }
  const mount=()=>{mountHome();mountDev()};mount();setTimeout(mount,180);
  window.HANI_DEVELOPMENT_HISTORY_V1=Object.freeze({entries:HISTORY,mount,openDev});
})();
