# polish-205 후속 회귀 수정 · 도연(Codex)

## 작업 식별

- 갱신 시각(KST): 2026-10-11. 담당 도연, 단일 개발 Agent.
- 상태: 수정 완료 / 실제 Edge 검증 대기. branch/worktree `hani/polish-205` / `w205`.
- 시작 HEAD/base: `4de750a6a6eed909d4c37cd135246efbee6accaa`. 로컬 origin/main `c4d65a1526178f26a9ea7033e3ab11eb5424d392`; git ls-remote 네트워크 실패로 최신성 미확인. 자동 merge/rebase 없음.
- 로컬 표시/cache 기준 v2.9.204. 운영 최신 JS/read-back 재확인 미수행.
- 승인 근거: 대표님 요청 `../w205-fail.txt`의 승인된 명칭·IA 기대값 보정 또는 실제 앱 오류 수정. 커밋 금지, mixed EOL·기존 작업 보존, 새 duplicate id literal·clear 호출·데이터 변경 금지. main·배포·버전 변경 미승인.
- 범위: 기존 cleanup NAV_LABELS owner, 배너 표시, nav/runtime 회귀 검사, IC UI의 변경된 보고 문구, 로그인 테스트 인자 및 proactive 버전 보존 검사. 안전/무저장 검사는 유지.

## 결과와 증거

- HTML/menu/pageMeta는 대표실·배포센터인데 `hani-ui-cleanup-v02971.js`의 renameNavigation이 DOMContentLoaded에 구형 이름으로 덮어씀. 실제 NAV_LABELS의 두 문구와 `hani-ui-v02992.js` 배포센터 배너 한 문구 수정. 이벤트/renderer/data owner 추가 없음. earnings 메뉴 기대값은 이미 승인된 IA와 일치하므로 유지.
- nav-groups 테스트는 실제 cleanup NAV_LABELS/renameNavigation을 VM에서 두 번 실행해 대표실·배포센터가 보존되는지 검사. 구형 NEW 부모 그룹 수 3은 현재 office/finance 두 그룹으로 보정하고 그룹 identity·pill 개수·반복 렌더·만료·viewport 검사를 유지.
- IC UI 테스트의 구형 `INVESTMENT COMMITTEE` 제목을 투자 리포트로, frozen row의 action REDUCE 표시를 `행동 비중 축소`로 보정. Rating History의 REDUCE는 원본 Rating이므로 유지. 현재 종목/월간 리포트 tab·button/floor 기대값은 이미 승인된 이름과 일치하여 그대로 유지. compaction·overflow·console·print·무저장 assertions 유지.
- 로그인 Node 테스트는 공유 runner의 Playwright/browser 인자를 인식·파일 존재 검증하며 baseline 디렉터리와 구분. 이미 login artwork가 포함된 통합 기준선은 syncSeasonCollection 전체 함수를 비교. 원래 pre-artwork baseline 디렉터리의 엄격한 전체 원문 비교와 auth/write/EOL/버전 검사는 유지. `HANI_LOGIN_TEST_BASELINE`은 Git 실행 제한 환경에서 export된 통합 원문 기준선을 읽기 위한 선택 입력.
- proactive의 v203 고정 검사를 현재 기준선의 모든 버전 token 및 cache tag 배열 정확 비교로 변경. 보호 key/internal VERSION/EOL/신규 write/ID 검사는 유지. 버전값을 인위적으로 204→205 바꾼 별도 합성 baseline은 로그인/proactive 모두 예상 실패로 거절하여 검사 유효성 확인.
- Node v24.20.0에서 93개 사례 + 독립 4개 검사 PASS: proactive21, navlogin35, IC report10, research15, monthly8, report-common4; login-a, nav-groups, banners-203, ui-203b. 로그인은 실제 local origin/main raw export 및 시작 HEAD export에 대해 모두 보존 검사까지 PASS(최종 결과 SKIP 없음).
- 명령: `node scripts/hani-nav-groups.test.mjs`, `node scripts/hani-banners-203.test.mjs`, `node scripts/hani-navlogin.test.mjs`, `node scripts/hani-ic-report-205.test.cjs`, `node scripts/hani-investment-research.test.cjs`, `node scripts/hani-investment-committee.test.cjs`, `node scripts/hani-report-common.test.mjs`, `node scripts/hani-ui-203b.test.mjs .ai-budget-private/205-regression/head-base`. proactive는 `HANI_PROACTIVE_TEST_BASELINE=.ai-budget-private/205-regression/head-base`, login은 `HANI_LOGIN_TEST_BASELINE=.ai-budget-private/205-regression/main-base`를 실제 절대 경로로 설정 후 실행. 환경변수는 shell process 범위이며 제품 코드에 추가하지 않음.
- 변경 파일 7개 원문 검증: diff hunk 밖 2,561줄 bytes/EOL 보존, 기존 ID literal 집합·clear 호출 수 불변, 신규 direct LocalStorage/Cloud write 없음. 실제 runtime diff는 위 문구 3개만. main/index는 시작 HEAD raw bytes와 동일해 데이터·표시 버전·cache owner 변화 없음. 수정 JS2/테스트5 syntax 및 `git -c core.whitespace=cr-at-eol diff --check` PASS. ignored 보조 도구/원문/negative logs 위치 `.ai-budget-private/205-regression/` 및 `.ai-budget-private/205-regression-*.cjs`.
- Edge 직접 재실행: spawn EPERM. 실제 desktop/390 화면·overflow·console·print 미검증. 승인 우회 없음.
- 기존 artifacts 및 qa-evidence는 작업 시작부터 있었으며 덮어쓰지 않음.
- Notion 계획 추가 시 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 읽기는 성공, 저장/read-back 미완료.

## 다음 담당에게

- 다음 행동: Claude의 허용된 Edge 환경에서 아래 UI 세 파일 재실행. 이번 환경은 동일한 browser launch EPERM이라 나머지 두 파일을 반복 실행하지 않음. 실제 UI PASS·Production 완료로 간주하지 않음.
- `node scripts/hani-earnings-report-ui-test.mjs <playwright/index.mjs> <browser.exe>`
- `node scripts/hani-investment-research-ui.test.mjs <playwright/index.mjs> <browser.exe> .ai-budget-private/205-regression/screenshots`
- `node scripts/hani-ui-203b-ui.test.mjs <playwright/index.mjs> <browser.exe>`
- `node scripts/hani-login-a-204.test.mjs <playwright/index.mjs> <browser.exe>`는 실제 Node runner에서 git 허용 시 추가 export 없이 보존 검사 수행. 이 제한 환경에서 초기 직접 실행은 git EPERM으로 PARTIAL PASS였고, 이후 raw 기준선 export를 지정한 최종 실행은 모든 검사 PASS.
- Candidate/One-Pass/HINA/main/Pages/Production은 개발 범위 밖이며 수행하지 않음. 별도 Edge Function/서버 설정 없음.
- CURRENT/DECISIONS는 다른 담당 기록을 보존하고 작업별 문서에 확인 결과 기록.
- Notion 갱신 대기: 도연 / 2026-10-11 KST / hani/polish-205 / 시작4de750a / cleanup 실제 nav 덮어쓰기 수정3문구·IC 승인 문구 기대값 보정·NEW 두 부모 정확 검사·login 인자/통합 baseline 처리·proactive 전체 버전/cache 보존. Node93+4·negative controls·syntax·2,561줄 EOL·ID/clear/write 보존 PASS. Edge spawn EPERM으로 실제 화면·overflow·console·print 미검증. 원격 최신 main 연결 실패, commit/push/PR/merge/버전/데이터/배포 없음. 다음 Claude 실제 Edge 재검증. 원문은 본 로컬 파일(미push)이며 원격 링크 내용 일치를 주장하지 않음. Notion 대상 기존 페이지 `https://app.notion.com/p/3f6c527570748179b7eacf5941afd748`; 자동 승인 거절로 계획 및 최종 기록 저장/read-back 미완료.

## 실제 Edge 추가 실패 후속 · 2026-10-11 KST

- 담당 도연(Codex), 단일 Agent. branch/worktree hani/polish-205 / w205, 시작 HEAD/base 4de750a6a6eed909d4c37cd135246efbee6accaa. 원격 main 조회는 연결 실패, local origin/main c4d65a1526178f26a9ea7033e3ab11eb5424d392 유지. merge/rebase 없음.
- 상태: 테스트 수정 완료 / 실제 Edge 재검증 대기. 승인 근거는 대표님의 갱신 w205-fail.txt 실패 처리 요청이며 커밋·데이터·버전·배포 변경 미승인. 기존 혼합 변경 및 artifacts 보존.
- 이번 로그에는 IC UI 222행 행동 기대값 실패 1건. fixture.cards[0].action은 HOLD, GPT report는 rating만 REDUCE로 override한다. prepareSnapshot은 card를 clone하고 frozenRows는 rating pill과 actionLabel(c.action)을 별도 표시한다. 실제 REDUCE + 행동 보유 유지는 정상. 위 이전 기록의 행동 비중 축소 기대값 설명은 오류이며 본 후속에서 정정한다.
- 이번 수정 파일: scripts/hani-investment-research-ui.test.mjs와 본 인수인계. 운영 파일 추가 수정 없음. 65,000 KRW 검사 유지, frozen 원본 rating REDUCE/action HOLD를 정확 비교하고 화면의 .ic-rating은 REDUCE, .ic-action-plan은 행동 보유 유지로 각각 검사. 과거 월 선택 → Rating History → 닫기/월간 탭 복귀 전체의 state 원문·write 횟수 불변 검사를 추가. 기존 overflow·console·print·기록 freeze·무저장 검사는 유지.
- 실제 Node v24.20.0 검증: research15 + monthly8 + IC report10 = 33개 PASS. 명령 node scripts/hani-investment-research.test.cjs, node scripts/hani-investment-committee.test.cjs, node scripts/hani-ic-report-205.test.cjs. 이번 수정 JS syntax 및 git -c core.whitespace=cr-at-eol diff --check PASS.
- 추가 실행 근거: .ai-budget-private/205-edge-followup/verify.cjs에서 실제 fixture → applyBatch → committeeDraft/confirmCommittee → 실제 frozenRows owner를 실행. 이후 live rating BUY/FV70000 변경에도 frozen 의견 REDUCE·행동 HOLD·FV65000 보존, 렌더 state/commit 불변 PASS. 잘못된 행동 비중 축소는 실제 HTML에 없음을 검사. UI 파일은 이번 추가 assertion을 역변환하면 시작 파일과 모든 bytes/EOL이 일치. ID literal/clear 호출 수 불변, index/main 원문·표시/cache v2.9.204 불변, 기존 runtime 변경은 이전 인수인계의 3문구만 유지.
- 브라우저 실행은 실제 Playwright + Edge 경로로 시도했으나 launch spawn EPERM. 이번 UI 전체 실제 화면·overflow·console·print·새 조회 무저장 assertion 실행은 미검증. 위 Node renderer 증거를 실제 Edge PASS로 간주하지 않는다. Claude가 제공한 로그로 실패 전 실행 결과는 확인했지만 실패 이후 검사의 통과를 추정하지 않는다.
- 다음 한 가지 행동: Claude 허용 환경에서 아래 명령으로 IC UI 전체 1440/390 × cream/black 재실행. 별도 서버/Edge Function 설정 변경 없음. Candidate/One-Pass/HINA/PR/main/Pages/Production은 범위 밖이며 미수행. 커밋·push 없음.

~~~powershell
node scripts/hani-investment-research-ui.test.mjs 'C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs' 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' .ai-budget-private/205-edge-followup/screenshots
~~~

- Notion: 기존 IC polish-205 페이지 https://app.notion.com/p/3f6c527570748179b7eacf5941afd748 읽기 성공. 진행 기록 append는 자동 승인 검토가 MCP tool call requires approval, but approval policy is never로 거절해 저장/read-back 미완료. 같은 차단에 반복 요청하지 않음. 갱신 대기 요약: 도연/2026-10-11 KST/hani/polish-205/4de750a/의견-행동 혼동한 IC 기대값 정정·과거 조회 state/write 불변 강화/Node33·실제 frozen renderer·mixed EOL·syntax PASS/Edge EPERM·원격 main 최신성 미확인/미커밋·데이터·버전·main·배포 변경 없음/다음 Claude Edge 재실행. 원문은 본 로컬 파일이며 원격 반영을 주장하지 않는다.
