# MISSION 203b · 모바일 NEW 검사 후속 · 도연(Codex)

## 작업 식별

- 날짜(KST): 2026-10-11 / 담당: 도연(Codex), 단일 Agent.
- 상태: harness 최소 수정 및 Node 집중 검증 완료. 실제 Edge 재실행 대기, 미커밋.
- branch/worktree: `hani/integration-203` / `int203`.
- base/원격 main SHA: `b93925fe75f5e746a6101ed492e950516746fadc` (GitHub API 확인; git ls-remote 프록시 연결 실패).
- 작업 HEAD: `720e7740c57596336e7be640e63d160b954fd00d` + 기존 미커밋 작업 보존.
- 표시/캐시: v2.9.202, 마지막 UI 파일 `hani-ui-v02992.js?v=2.9.202`. 운영 화면/실제 로딩 미검증.
- 목적/승인: 대표님 제공 `../int203-ui-fail.txt`의 4 !== 0 원인을 최소 수정, assertion 전 진단 출력. 커밋·버전 증가 금지, mixed EOL 보존.
- 수정 범위: `scripts/hani-ui-203b-ui.test.mjs`의 NEW 표시 검사와 이 작업별 인수인계. 기존 타 담당 파일/산출물은 수정하지 않음.
- CODEMAP_MISS: NEW/모바일 sidebar owner anchor 없음. 해당 assertion와 `hani-style-01.css:44`, `hani-main.js`의 renderNavNewBadges/mobileMenu/showView로 좁혀 확인.

## 결과와 증거

- 로그 stack `scripts/hani-ui-203b-ui.test.mjs:49:12`: 모바일390에서 `#sidebar .nav-btn .nav-new-pill:visible` count가4, 기대0.
- 원인: harness의 표시 판정. 모바일 닫힌 sidebar는 `translateX(-105%)`로 화면 밖 이동하며 display/visibility/크기는 유지. Playwright :visible은 화면 밖 요소도 포함. showView는 mobile-open을 제거하며 NEW renderer는 정상적으로4개 유지.
- 방향: :visible 조건을 유지하고 배지 bounding rect가 화면 가로 범위와 교차하는지 추가 검사. 세로로 긴 sidebar의 정상 스크롤 가능 배지는 기존처럼 집계. 모바일0/PC4 기대값 및 중복/부모/만료 검사는 유지.
- 진단: assertion 전 메뉴 ID/배지 text/좌우 좌표/가로 화면 교차 여부 및 viewport 폭 출력.
- 실행한 검증: Node v24.20.0, HEAD720e7740 + 미커밋 변경에서 `node --check scripts/hani-ui-203b-ui.test.mjs`, scoped `git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check`, `node scripts/hani-ui-203b.test.mjs .ai-budget-private/integration-203/base`, `node scripts/hani-nav-groups.test.mjs` PASS. 실제 수정 assertion 블록을 Node VM에서 실행해 PC4/모바일0 성공, 모바일1px 노출·PC 배지 화면 밖·활성 배지 누락·화면 밖 중복 실패 유지 총6사례 확인. 모든 실패 전에 메뉴 ID/좌표 진단 출력 확인. 기존 assert 교체 블록 외 원시 바이트 동일, 삽입 줄 EOL은 기존 교체 줄과 동일. 근거 `.ai-budget-private/integration-203-ui-new/verify.mjs`와 `verification.json` (gitignored). VM 가상좌표 검사는 실제 화면 PASS가 아님.
- 실제 Edge UI: 대표님이 명시한 EPERM으로 여기서 재시도하지 않음. Claude 환경에서 수정된 harness 실행 필요.
- 데이터/Cloud/schema/앱 runtime 변경 없음. PR/main/Pages/운영 read-back 없음.
- Notion: 현황판 읽기 성공. 이번 후속 결과 append는 자동 승인 검토에서 `MCP tool call requires approval, but approval policy is never`로 거절. 갱신 대기 내용: 49행 모바일 NEW false positive/harness 가로 교차 수정/진단 로그/위 Node PASS/실제 Edge 미검증/미커밋·v202 유지/Claude Edge 전체 재실행.

## 다음 담당에게

- 먼저 읽을 파일/함수: UI test NEW assertion, hani-style-01.css 모바일 side transform.
- 다음 행동: Claude의 실제 Edge 환경에서 `scripts/hani-ui-203b-ui.test.mjs` 전체 재실행; 진단 출력으로 실패 메뉴 확인.
- blocker: 여기서는 실제 Edge spawn EPERM. 커밋·버전 증가 금지 유지.
- CURRENT/DECISIONS 및 다른 담당 기록 변경 없음.