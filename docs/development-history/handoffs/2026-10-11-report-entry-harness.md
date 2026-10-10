# 컨퍼런스 룸 테스트 입장 준비 조사

## 후속 작업 착수 · 2026-10-11 KST

- 담당 도연(Codex), 단독 개발. 동일 branch `hani/integration-202`, base/HEAD `f59723d450d1b55c6b1e1ccc83e2e7f644354177`. 커밋 금지 및 기존 미커밋 작업/증거 보존.
- 대표님 후속 근거: Claude 실제 Edge에서 unlock 직후 entry assertion 실패. 기존 코드/합성 DOM 검증만으로 충분하지 않았음을 반영해 하네스 보정.
- 원격 main `9f48074202b972f36dab3f15274227b261224b57`을 GitHub branch API로 재확인(로컬 origin/main 동일). shell 네트워크 제한. merge/rebase 없음. 표시/캐시 v2.9.201, index 마지막 UI script hani-ai-budget.js 유지; 브라우저 실제 로딩은 미확인.
- CODEMAP monthly-report owner hani-main.js 확인; 로그인 anchor는 CODEMAP_MISS로 symbol 검색.
- 수정 범위: earnings test의 외부 네트워크 격리, 초기화 대기, canonical unlock/showView, CSS 전환 대기와 잠금 assertion. annual은 기존 합성 페이지/모의 Cloud 격리 확인 및 지정 인자 재실행. 앱/auth/보호 write/schema 변경은 하지 않음.
- 계획: 통과 중인 report-common/goal-progress UI 테스트의 localhost-only route + unlockLoginGate/showView 방식 재사용. 새로운 runtime test hook 없이 적용. Risk NORMAL(하네스), runtime version/build/Candidate/Production N/A.
- Notion 계획 append: 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 미완료, 후속 최종 요약 갱신 대기.

### 후속 결과 및 다음 담당

- 상태: 하네스 수정 완료 / syntax·diff·로그인 회귀 PASS / 실제 Edge UI 검증 BLOCKED. 미커밋·미push·미배포.
- 재잠금 코드 조사: `initLoginGate`는 초기 lock 및 pagehide→cloudLogout, BFCache pageshow→lock을 설치한다. `initCloudBridge`는 getSession 뒤 기존 인증 세션을 local signOut하고 gate session을 지운다(B안). `cloudBindAuthEvents`의 SIGNED_OUT은 `lockLoginGate`를 다시 호출한다. 이 경로는 실제 사용자에게 의도된 동작이며 원문 그대로 보존. 현재 브라우저에서는 Claude 실패의 특정 callback 발동을 실증하지 못했으므로 경합 가능성으로 기록한다.
- 추가 확정 원인: hani-style-01.css의 `.login-gate`는 `opacity .22s ease, visibility .22s ease` 전환을 사용한다. 기존 `isVisible()` 즉시 assertion은 unlock이 성공해도 전환 완료 전 실패할 수 있다. 종전 합성 DOM 증거는 CSS transition/비동기 Auth를 검증하지 못했으므로 그 결과로 브라우저 정상 동작을 단정하지 않는다.
- 사용한 방식은 (a), 기존 UI 테스트 접근 재사용: report-common/goal-progress와 동일한 localhost-only route로 외부 SDK/Auth/Cloud를 차단, 기존 `unlockLoginGate(); showView('monthlyReport')` 사용. `loginGateInitialized` 및 보고서 runtime ready 대기 후 cloudClient/user/session이 null/null/false임을 검사. gate `waitFor({state:'hidden'})`로 CSS 전환 완료 후 gate·inert/class/ARIA 검사, 450ms 후 숨김 유지 재검사. 런타임 신규 hook·가짜 로그인 토큰·로그인 요구 완화 없음.
- earnings의 기존 sports read/Q&A mock route는 fallback 차단보다 우선한다. 외부 요청은 그 모의 응답 외에는 차단되고 PPT 이미지/로컬 runtime asset은 허용한다. 의도적으로 차단한 URL의 ERR_BLOCKED_BY_CLIENT만 console error 목록에서 제외하고 다른 기존 error/assertion은 유지.
- annual은 원래 전체 앱을 로드하지 않는 합성 페이지 + 메모리 owner/Cloud mock이다. 동일 localhost-only route를 추가해 격리를 명시했다. 로그인 훅 불필요; 실제 Cloud 쓰기 없음.
- 변경 파일은 scripts/hani-earnings-report-ui-test.mjs, scripts/hani-annual-report-ui-test.mjs와 이 인수인계. hani-main.js/auth/CSS/보호 write/Cloud schema/migration/버전/캐시 변경 없음.
- 후속 검증(Node v24.20.0 / 동일 base + 최종 미커밋 diff): 두 mjs `node --check` PASS, `git diff --check` PASS, `node scripts/hani-navlogin.test.mjs` 35건 PASS.
- 지정 Playwright/Edge 인자로 earnings와 annual 모두 실행: `browserType.launch: spawn EPERM`으로 UI assertion 도달 전 BLOCKED. 위 기존 인수인계의 실행 명령 사용. UI PASS/Preview 증거 갱신 없음, 기존 artifacts는 보존.
- 미검증: 실제 Edge 1440/390 startup/전환·보고서 클릭·PDF/PPT/Q&A와 모의 Cloud 전체 실행. 실제 계정 로그인/Cloud/운영 read-back은 범위 밖. runtime version/build/Candidate/main merge/Pages/Production N/A.
- 다음 한 가지 행동: Claude의 Edge subprocess 허용 환경에서 위 두 테스트를 지정 인자로 재실행하고 전체 기존 assertion 결과를 기록. 실패가 남으면 그 stack과 gate 상태를 기준으로 추가 하네스 조사. 승인된 범위 유지; 커밋하지 않음.
- Notion 최종 갱신 대기: 2026-10-11 KST 도연, integration-202 base f59723d/main 9f48074. 로그인 B안 SIGNED_OUT/초기화 경로 및 CSS .22s transition 조사. 기존 통과 UI 테스트의 네트워크 격리와 canonical unlock/showView 재사용, boot/hidden 대기 추가, annual 모의 환경 외부 차단. 문법/diff/navlogin35 PASS, earnings/annual Edge UI는 spawn EPERM BLOCKED. 앱·인증·보호 write/schema·버전 변경/commit/merge/배포 없음. 원문은 이 로컬 인수인계, 공유는 미완료. 자동 승인 검토의 never 거절로 저장/read-back 불가; 재시도 우회 없음.
- CURRENT/DECISIONS는 다른 작업 기록을 보존해 수정하지 않음. 후속 결과는 이 작업별 인수인계에 기록.

## 작업 식별

- 갱신 시각(KST): 2026-10-11 / 담당: 도연(Codex), 단독 개발 + 자동 검사
- 상태: harness 최소 수정 완료 / Node 검사 PASS / 브라우저 검증 차단. 미커밋·미push·미배포.
- branch/worktree: `hani/integration-202` / int202
- base/HEAD: `f59723d450d1b55c6b1e1ccc83e2e7f644354177`; candidate 없음
- 원격 main: GitHub 연결 도구로 `9f48074202b972f36dab3f15274227b261224b57` 확인, 로컬 origin/main과 동일. shell 원격 조회는 네트워크 제한 실패. merge/rebase 없음.
- 목표: quarterly 클릭 실패의 사용자 회귀/구형 harness 여부 판별, 최소 수정, 지정 6개 테스트 실행.
- 범위: 우선 scripts/hani-earnings-report-ui-test.mjs 입장 setup와 실행 인자, 필요 시 annual 테스트 실행 인자; 앱 owner는 읽기 조사. 기존 untracked 증거 보존.
- 승인: 대표님의 이번 조사·최소 수정·검증 지시. 커밋 금지; push/main merge/배포/보호 데이터·Cloud write/schema 변경 없음.

## 결과와 증거

- CODEMAP monthly-report owner: hani-main.js / monthlyReportRenderBoard, showView, unlockLoginGate 실행 경로 조사. navigation/login은 CODEMAP_MISS로 실제 symbol 검색.
- 원인 판정: 코드 및 실제 owner 함수를 실행한 synthetic DOM 검사 기준 **구형 harness**. index.html의 #app은 처음부터 inert이며 lockLoginGate도 inert=true로 잠근다. 기존 earnings setup은 gate의 CSS만 숨기고 app class/ARIA만 바꿔 inert와 body scroll lock 및 loginGateUnlocked를 남겼다. 실제 사용자의 loginGateEnterApp은 Cloud 확인·race/readiness guards 뒤 unlockLoginGate에서 모든 잠금을 해제한다. showView('monthlyReport')는 renderMonthlyReport를 호출하고 기존 monthlyReportRenderBoard가 탭 onclick/ARIA/panel을 소유한다. 메뉴 재배치는 이 경로를 제거하지 않았다. 실제 브라우저의 사용자 회귀 없음은 미실증.
- 변경 파일: scripts/hani-earnings-report-ui-test.mjs — CSS 우회 대신 기존 unlockLoginGate 호출, gate 숨김 및 inert/class/ARIA 해제 assertion 추가. 보고서·export·Q&A·보호 데이터 assertion은 모두 보존.
- 실행 인자 지원: earnings 및 scripts/hani-annual-report-ui-test.mjs가 지정 Playwright module과 Edge 경로를 사용하도록 수정. annual PDF fixture는 같은 runtime의 pdf-lib를 resolve. 인자 없이 실행하는 기존 기본 경로도 보존.
- 런타임 앱·로그인 B안·Cloud-first·표시 버전·캐시·보호 storage/Cloud/schema 수정 없음. Risk tier NORMAL(test harness); runtime version/build/Candidate/Production N/A.
- 최초 earnings 실행: 전달한 Playwright 인자를 기존 harness가 사용하지 않아 MODULE_NOT_FOUND(playwright) 발생.
- 기존 표시/캐시 v2.9.201 유지. 운영 브라우저 read-back은 이번 개발 범위 밖이며 미실행.
- 지정 테스트 결과(Node v24.20.0 / 위 base + 미커밋 test diff):
  - hani-earnings-report-ui-test.mjs: BLOCKED — Edge browserType.launch: spawn EPERM, UI assertion 미도달.
  - hani-annual-report-ui-test.mjs: BLOCKED — 동일, PDF fixture/module 준비까지 성공, UI assertion 미도달.
  - hani-report-common-ui.test.mjs: BLOCKED — 동일, UI assertion 미도달.
  - hani-navigation-state-ui.test.mjs: BLOCKED — 동일, UI assertion 미도달.
  - hani-goal-progress-ui.test.mjs: BLOCKED — 동일, 선행 closure/allowlist 검사는 실행됐으나 UI assertion 미도달.
  - hani-nav-groups.test.mjs: PASS — nav groups, speaker coverage/rotation/bridge, collapse aria and layout contract.
- 실행 명령: `& 'C:\Users\홍성민\AppData\Local\Programs\nodejs\node.exe' scripts/<위 UI 파일> 'C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs' 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'`. nav-groups는 같은 Node로 인자 없이 실행.
- 추가 검증 PASS: 수정 mjs 2파일 node --check, git diff --check, hani-navlogin.test.mjs 35건(Cloud-before-entry/retry/guards/logout races/memory auth/lifecycle/aliases/design picker).
- 추가 실행 증거: Node vm으로 **실제 unlockLoginGate 및 monthlyReportRenderBoard 원문**을 synthetic DOM에 실행. 구형 setup의 inert 잔류 → canonical unlock의 inert/class/ARIA/body 잠금 해제 및 quarterly/annual/monthly onclick의 panel/ARIA/navigation persistence 전환 PASS. 브라우저 렌더링/실제 클릭 검증 대체로 주장하지 않음.
- Notion: 현황판 읽기 성공. 계획 append는 자동 승인 검토가 **MCP tool call requires approval, but approval policy is never**로 거절. 저장/read-back 미완료; 최종 요약도 로컬에 갱신 대기로 보존. 반복 쓰기/권한 우회 없음.
- Notion 갱신 대기 요약: 도연 / 2026-10-11 / integration-202 base f59723d, main 9f48074. 컨퍼런스 룸 실패는 구형 earnings CSS unlock이 새 inert를 해제하지 않은 harness 문제(코드/owner 실행 근거). 기존 unlock hook과 잠금 assertion으로 보정, earnings/annual의 Playwright·Edge 인자 지원. nav groups·navlogin35·syntax/diff·synthetic owner 전환 PASS; UI5개는 spawn EPERM으로 차단/미검증. 앱/B안/Cloud/write/schema 변경 없음, 미커밋·미push·미배포. 다음: 허용 환경에서 지정 UI5개 재실행. 원문은 이 로컬 인수인계(미push).

## 다음 담당에게

- 먼저 읽을 함수: unlockLoginGate/lockLoginGate/showView/monthlyReportRenderBoard와 earnings setup.
- 다음 행동: Edge subprocess가 허용된 환경에서 지정 UI 5개를 동일 인자로 실행하고 기존 모든 assertion 결과 확인. 이 sandbox에서는 EPERM을 우회하지 않음.
- 미검증/남은 위험: 실제 브라우저의 잠금 해제·컨퍼런스 룸 클릭·화면·PPT/PDF·실사용 로그인/Cloud. synthetic DOM/Node PASS를 브라우저 PASS로 해석하지 않음.
- CURRENT/DECISIONS: 공통 현황 및 기존 다른 담당 기록 변경 없음. 작업별 결과는 이 인수인계에 보존.
- PR/Preview/main merge/Pages/Production read-back: 이번 요청 범위 밖, 미실행. commit 금지 유지.
