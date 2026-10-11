# fix-208 오래된 테스트 기대값 후속 · 도연(Codex)

## 작업 식별

- 갱신: 2026-10-11 KST. 담당: 도연(Codex), 단독 개발. 상태: 구현·targeted 검증 완료, 미커밋 인계.
- branch/worktree: `hani/fix-208` / `w208`. 시작 HEAD: `551c5439358d8c897e5154851e616dbc94abfb73`.
- base/main: `e9536016526dfff4a3623659354a8a4a760a134d`. git ls-remote는 네트워크 차단, GitHub branches/main 읽기로 최신 일치 확인. 기준 표시 v2.9.207, 마지막 UI JS `hani-ui-v02992.js?v=2.9.207`.
- 목표: Claude의 `../w208-fail.txt` 2건을 승인 변경과 대조해 최소 수정하고 targeted 재검증.
- 수정 범위: `scripts/hani-ai-work-status.test.mjs`, `scripts/hani-proactive-204-ui.test.mjs`, `scripts/hani-fix-208-ui.test.mjs`, `hani-style-08.css`, 이 인수인계/공통 현황. 실제 Edge에서 확인한 카드 active 축소에 의한 checkbox 클릭 충돌을 기존 hani-style-08.css selector 한 곳에서 수정.
- 승인 근거: 성민 대표님 현재 요청. 커밋·버전/cache 변경·데이터 변경·중복 ID 리터럴·새 clear 호출·main merge·배포 금지, 안전/무쓰기 검사 유지.
- 기존 다른 담당의 tracked/untracked QA artifacts 보존. 앱 원문 초기 변경 없음.
- CODEMAP: study-daily-quiz owner `hani-study-v02984.js`, dependency `hani-main.js`; 알림 카드/AI 업무 개별 anchor는 CODEMAP_MISS로 실제 소유 함수 검색.

## 결과와 증거

- 로그 1: AI 업무 후보 문구 v2.9.205 기대와 실제 v2.9.207 불일치. catalog 날짜는 고정 2026-10-11, 오늘 날짜로 간주하지 않음.
- 로그 2: proactive UI의 유일한 project가 paused인데 퀴즈 2개 badge/card를 기다려 timeout. 승인 기준은 기존 비중지/비보관 프로젝트만 집계, 프로젝트별 표시, orphan 제외.
- 방향: 현재 후보 문구를 정확하게 검사하고 active/paused/archived/orphan fixture 및 카드별 집계를 검증. 기존 state 보존·save 0·storage 무쓰기 assertion 유지.
- 초기 검증: 진행 중 기록; 최종 결과는 아래 완료 증거 참조. 실제 사용자 데이터/Cloud·Android·Release Candidate/운영 read-back 미검증.
- Notion: 기존 fix-208 카드 읽기 성공. 계획 append 자동 승인 검토에서 `MCP tool call requires approval, but approval policy is never`로 거절, 갱신 대기. 다른 쓰기 경로로 우회하지 않음.
- 데이터/Cloud/schema/버전/cache: 변경 예정 없음. 커밋/push/PR/main/배포 수행 안 함.

## 다음 담당에게

- 먼저 읽기: 두 test, `pendingLearningQuizzes`/`pendingQuizProjects`, `renderHaniCareCards`, 기존 fix-208 handoff.
- 다음 행동: 수정 후 실제 Edge 및 Node targeted 검사, 근거와 최종 결과를 이 파일에 추가.
- blocker: Notion 쓰기 정책. 미커밋 변경은 Claude에게 인계. 새 결정 없음.

- 진행 중 발견한 앱 결함: checkbox 중앙 x381.5에서 mouse-down 뒤 input left가 375→382.78px로 이동, label이 pointer를 가로챔. 기존 card active selector는 button만 제외하여 input/label 활성화도 카드를 축소함. 기존 selector의 제외 대상만 native 입력·라벨·링크·summary/role button으로 확대; 새 CSS layer/event/write 경로 없음.

## 최종 결과와 증거

- 수정 1: AI 업무 HTML은 이미 v2.9.207이므로 test의 v2.9.205 기대만 정확히 갱신. catalog 기준일은 고정 2026-10-11이며 실제 오늘 날짜와 비교하지 않음. 7명·recent 버전·실제 profile renderer·무쓰기 검사 유지.
- 수정 2: proactive UI fixture를 active 2프로젝트와 completed/paused/archived/missing/empty-projectId 퀴즈로 구성. 정확한 pending ID 3개, home/intake 총 3개·2+1 breakdown, 제외 대상 미표시·state 불변·save 0·기존 rollback/storage assertion 검증.
- 실제 앱 결함: card active scale이 checkbox hit target을 이동시켜 label pointer interception 발생. 기존 hani-style-08.css 한 selector에서 native 입력·label·link·summary/role button을 누를 때 부모 card 축소 제외. 버튼/일반 카드 효과와 reduced-motion 규칙 유지, JS/event/renderer layer 추가 없음.
- 클릭 회귀: 실제 mouse-down 중 부모 scale none과 checkbox boundingBox exact equality, mouse-up 실제 선택, 기존 uncheck/check 및 form 제출 결과를 4조합 모두 검증. force click 사용 없음.
- 후속 regression 기대값: fix-208 UI off-switch가 asset 화면에서 hidden #saveBook을 anchor로 사용하여 효과 생성 조건 실패. 현재 보이는 #assetStats .value로 변경. 기존 effect-active/count-up-active/즉시 중단/최종 숫자/toast/no duplicate ID assertions는 원문 유지.
- 원문 실패 재현: AI 업무 Node assert 실패, proactive 원문 실제 Edge waitForFunction timeout. 후속 checkbox pointer interception도 실제 Edge에서 재현 후 수정. 미세 효과 hidden anchor 실패도 원인과 대조해 수정.
- PASS Edge 155.0.4283.45: proactive 1440/390 × porcelain-cream/midnight-black 4조합; fix-208 sidebar/motion 1440/1024 × 동일 테마 4조합. 모든 기존 assertion 유지. browser pageerror 0, 실제 화면 390 밝은/1440 어두운 screenshot 직접 확인.
- 실행 명령: node scripts/hani-proactive-204-ui.test.mjs <playwright/index.mjs> <msedge.exe>, node scripts/hani-fix-208-ui.test.mjs <playwright/index.mjs> <msedge.exe>. CLI browser spawn EPERM이라 허용된 Node REPL의 실제 Playwright/Edge로 실행. vm.runInThisContext에서 import/argv/import.meta/evidence path만 주입; assertion/앱/브라우저 mock 없음. tmp 증거를 PowerShell Copy-Item으로 workspace에 보존. 초기 AsyncFunction 진입은 REPL codegen 제한, 실제 vm 실행 결과만 PASS 근거로 사용.
- PASS Node 24.20.0: node scripts/hani-ai-work-status.test.mjs; node --test --test-isolation=none scripts/hani-fix-208.test.mjs (7/7); HANI_PROACTIVE_TEST_BASELINE=.ai-budget-private/stale208-head-baseline, node --test --test-isolation=none scripts/hani-proactive-204.test.mjs (21/21); node scripts/hani-nav-groups.test.mjs; node scripts/hani-learning-quiz-v04.test.mjs; node scripts/hani-study-news-material.test.js.
- 보호 검사 baseline은 HEAD git show를 raw byte stream으로 저장. Node Git subprocess EPERM 때문에 기존 baseline 입력 기능 사용; runtime.diff가 빈 것은 해당 owner들의 실제 git diff가 없음도 확인. 기존 safety/no-write test 수정 없음.
- PASS node --check 수정 test 3개; git -c core.whitespace=cr-at-eol diff --check; .ai-budget-private/stale208-audit.cjs. runtime JS/HTML 6개 HEAD 바이트 일치, CSS exact one-selector replacement만 허용·혼합 EOL 유지, test LF 유지, literal ID inventory/새 clear 없음·기존 safety statement 보존.
- 증거: artifacts/fix-208-stale-tests/run-status.json (PASS, branch/base/head와 변경파일 SHA256), proactive screenshot 4개, motion screenshot/geometry 4개와 PASS run-status, checkbox-before.png. 기존 artifacts/fix-208-failures/sidebar-mini 및 타 담당 변경은 보존.
- 데이터/저장소/Cloud/schema 영향: 없음. 새 write path·storage 키·migration 없음. 표시/내부 버전·cache tag 변경 없음. CSS runtime 변경은 배포 열차에서 후보 버전을 한 번 올릴 대상.
- 미검증: 운영 계정/사용자 데이터·실Cloud·Android·후보 package/One-Pass/HINA·Preview 대표님 승인·main/Pages/Production read-back. 이번 targeted QA를 Release/운영 완료로 보고하지 않음.
- Notion 계획 append 자동 승인 검토 거절(policy never); 최종 결과도 미반영 상태로 기록. 접근 가능한 담당이 기존 카드에 이 원문의 결과/증거/미커밋/미검증을 반영하고 read-back할 것. 우회 쓰기 없음.

## 최종 인계

- 먼저 읽기: 이 파일, hani-style-08.css active selector, 변경 test 3개, artifacts/fix-208-stale-tests/run-status.json.
- 다음 행동: Claude가 미커밋 변경을 검토하여 hani/fix-208에 반영하고 열차 통합. 도연은 사용자 지시대로 commit/push/PR/main merge/배포하지 않음.
- 상태: 미커밋·미push·미배포. 서버 Edge Function/설정 변경 또는 배포 순서 의존성 없음.
- CURRENT: 확인된 완료와 Notion 갱신 대기 요약만 선두 추가, 기존 다른 담당 기록의 bytes 보존. DECISIONS: 새 결정 없음.
