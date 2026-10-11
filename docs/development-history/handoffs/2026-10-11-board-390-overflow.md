# 게시판 390px 가로 넘침 · 도연(Codex)

## 작업 식별

- 갱신일(KST): 2026-10-11. 담당: 도연(Codex), 단일 개발 Agent.
- 상태: 최소 CSS 수정 및 Node 회귀 완료, 실제 Edge UI 검증 대기. 미커밋.
- branch/worktree: `hani/integration-203` / `int203`.
- 작업 HEAD/base: `0ed30d3b6ff8db6611d6b1f543cc7a2029f1ab66`. 로컬 origin/main: `b93925fe75f5e746a6101ed492e950516746fadc`. `git ls-remote origin refs/heads/main`은 프록시 연결 실패로 원격 최신성 미확인. merge/rebase 없음.
- 표시/캐시 v2.9.202 및 `hani-ui-v02992.js` 유지. 운영 표시/실제 JS 로딩 미검증.
- 승인: 대표님의 게시판 390px 넘침 최소 CSS 수정 및 assertion 직전 진단 로그 추가 요청. commit 금지, 기존 EOL 및 미커밋 작업 보존, 중복 ID literal 추가 없음.
- 시작 범위: `hani-board.css`, `scripts/hani-banners-203-ui.test.mjs`, 이 작업별 인수인계. 기존 harness 변경과 타 작업 산출물 보존.
- CODEMAP_MISS: 게시판 모바일 표/배너 owner anchor 없음. 실제 CSS 및 `hani-board.js` 목록·댓글 renderer, `hani-ui-v02992.js` canonical banner renderer로 좁혀 확인.

## 결과와 증거

- 원인: `hani-style-01.css:32`의 공통 `table{min-width:760px}`가 `hani-board.css`의 모바일 `display:block` 표에도 남음. `hani-board.js`는 이미 `board-table board-mobile-two-line`으로 렌더하므로 새 renderer/DOM/event가 필요하지 않음.
- CSS: 게시판 표에 `min-width:0;max-width:100%`, 헤더 flex 줄바꿈 및 자식 축소/긴 문자열 줄바꿈, 설정 toolbar label 축소, 기존 모바일 행 마지막 track에 `minmax(0,1fr)` 적용. 페이지 overflow를 숨기지 않음.
- 배너: 공통 design-system의 폭 100%/border-box 및 copy min-width:0 경로 유지. 댓글과 @mention 본문은 기존 `.board-body{overflow-wrap:anywhere}` 유지. 접힌 details는 진단에 가장 가까운 details의 open 상태를 포함.
- 테스트 진단: document overflow assertion 바로 전에 `right > innerWidth`이고 크기가 있는 요소 전체를 출력. tag/id/class/data-board, 좌우 좌표, client/scroll 너비, display/min/max 너비, grid 열, overflow/white-space, details open 상태 포함. 기존 assertion 변경 없음.
- PASS: `node --check scripts/hani-banners-203-ui.test.mjs`.
- PASS: `node scripts/hani-banners-203.test.mjs`.
- PASS: `node scripts/hani-board-community.test.mjs` 및 이 테스트가 실행하는 기존 게시판 회귀.
- PASS: `git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check`.
- PASS: 테스트는 진단 블록을 제거하면 작업 시작 원시 문자열과 동일. 변경한 두 파일은 시작/종료 모두 LF이며 다른 mixed EOL 파일은 수정하지 않음. 작업 전 사본은 `.ai-budget-private/integration-203-banners/*.overflow-baseline`.
- BLOCKED: 실제 Edge UI 테스트 수정 전/후 모두 `browserType.launch: spawn EPERM`. 로그: `.ai-budget-private/integration-203-banners/overflow-before.log`, `overflow-after.log`. 390px 실제 좌표·넘침 해소·1440px 화면을 PASS로 보고하지 않음.
- 실행 환경: Node v24.20.0, 실제 runtime/CSS UI harness + 격리 freshState, 외부 트래픽 차단. 화면 테스트는 launch에서 중단됨.
- 데이터·보호 저장소·Cloud·schema·JS renderer·버전 변경 없음. PR/commit/push/main/Pages/운영 read-back 없음.

## 다음 담당에게

- 다음 행동: Edge 실행이 가능한 환경에서 `node scripts/hani-banners-203-ui.test.mjs C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"` 전체 실행. 게시판 390px 및 다섯 화면 1440/390 결과를 확인하고 남는 overflow 요소는 새 진단으로 판단.
- 승인 경계: 이번 요청은 개발 수정이며 commit·열차 후보·merge·배포 승인이 아님.
- Notion: 현황판 읽기 성공. 배너 작업 카드 `3f6c527570748130bf81c3507fc84e5f`에 착수 요약 추가 시 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 갱신 대기: 위 원인/CSS/진단 변경, Node 회귀 PASS, 실제 Edge EPERM·UI 미검증, 미커밋·v202 유지, 다음 Edge 전체 재실행 및 이 인수인계 링크.
- CURRENT/DECISIONS 및 다른 담당 기록은 수정하지 않음.
