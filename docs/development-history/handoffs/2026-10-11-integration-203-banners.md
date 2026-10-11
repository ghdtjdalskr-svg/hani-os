# 배너 5종 앱 연결 · 도연(Codex)

## 작업 식별

- 날짜(KST): 2026-10-11. 담당: 도연(Codex), 단일 개발 Agent.
- 상태: 구현·Node 집중 검증 완료, 실제 화면 검증 차단. 미커밋. branch/worktree: hani/integration-203 / int203.
- base/작업 HEAD: bf01c81c3eaf216155eb3b8780bb34e8d4e25aae. 로컬 origin/main: b93925fe75f5e746a6101ed492e950516746fadc. 원격 최신성: git ls-remote 네트워크 실패로 미확인.
- 승인 근거: 대표님 5종 배너를 기존 공통 배너 방식으로 연결 요청. 커밋·버전 증가 금지, mixed EOL 보존.
- 범위: hani-ui-v02992.js 공통 메뉴 배너 설정/이미지 속성, 신규 배너 Node/UI 테스트, 이 인수인계. 기존 타 담당 산출물 보존.
- CODEMAP_MISS: 메뉴별 배너 설정 anchor 없음. 기존 자산명 검색으로 mainCharacterSidebarMenuConfig/mainCharacterBanner/mountSkeletons 확인.

## 결과와 증거

- 변경: board/aiWork/geminiReports/aiBudget 설정 추가, monthlyReport 이미지 교체. 공통 mainCharacterBanner/mountSkeletons/기존 CSS 사용. 공통 이미지 loading=lazy/decoding=async 추가. 예산 카드 소유 파일·index.html 변경 없음, agentReview 이미지 유지. CSS/이벤트 레이어 추가 없음.
- `node scripts/hani-banners-203.test.mjs`: PASS. 실제 config를 VM에서 실행해 5개 매핑·내부 탭 fallback·표준 반응형 설정·파일 존재/WebP 헤더·단일 메뉴 설정·기존 경영회의실 이미지·공통 이미지 속성 확인.
- `node scripts/hani-nav-groups.test.mjs`, `node scripts/hani-mission-203a.test.mjs`: PASS.
- `node scripts/hani-ui-203b.test.mjs .ai-budget-private/integration-203-banners/base`: PASS. 기본 실행은 Node→git spawnSync EPERM으로 실패했으나, shell git show/diff로 동일 HEAD의 원시 baseline/diff를 저장한 뒤 기존 baseline 인자로 정상 완료. assertion 변경 없음.
- `node scripts/hani-board-203a.test.mjs`, `hani-board-community.test.mjs`, `hani-board-guard.test.mjs`, `hani-board-library.test.mjs`, `hani-board-living.test.mjs`, `hani-board-relationship.test.mjs`, `hani-board.test.mjs`: 7개 모두 PASS.
- hani-board* glob에 함께 잡힌 boardroom 추가 검사: live-meeting/recovery PASS. cross-review/voice-contract는 Node child-process EPERM 차단, routing은 필수 rebuilt Edge source 인자 없음으로 실패. 배너 수정과 무관한 서버 rebuild 검사이며 PASS로 보고하지 않음.
- `node --check hani-ui-v02992.js`, 신규 Node/UI test syntax, scoped `git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check`: PASS.
- `.ai-budget-private/integration-203-banners/verify.cjs`: PASS. 정확한 설정 추가/이미지 교체/속성 변경을 역변환하면 HEAD 원시 바이트와 동일. 기존 per-line mixed EOL 보존, id literal/clear 호출 추가 없음, hani-main.js/index.html 바이트 동일.
- `node scripts/hani-banners-203-ui.test.mjs`: Chrome launch spawn EPERM으로 차단. 1440/390 실제 이미지 decode·기존 intake와 같은 레이아웃·전체 페이지/배너 가로 overflow·예산 카드·단일 DOM ID·보호 키 불변을 확인하는 harness 준비. **실제 화면/제목 겹침/모바일 크롭/overflow는 미검증**, UI PASS 아님. 스크린샷 생성 없음.
- 환경: Node v24.20.0, HEAD bf01c81c + 이번 미커밋 변경. 근거: 신규 테스트와 gitignored `.ai-budget-private/integration-203-banners/` baseline/byte 검증. 원격 main/운영 미검증.
- 데이터·저장소·Cloud·schema 영향 없음. 표시/캐시 v2.9.202 유지, 신규 runtime layer 없음.
- main/Pages/운영 read-back/PR/commit/push: 수행 없음. 최종 Candidate/독립 아린/HINA: 범위 밖.

## 다음 담당에게

- 먼저 읽기: mainCharacterSidebarMenuConfig/mainCharacterBanner/mountSkeletons, 신규 배너 테스트.
- 다음 행동: 브라우저 spawn 가능한 배포 담당 환경에서 `node scripts/hani-banners-203-ui.test.mjs [playwright/index.mjs] [Chrome 또는 Edge 실행파일]` 실행해 1440/390 화면 확인 후 열차에 포함. 서버 설정/Edge 배포 변경 없음.
- Notion 현황판/기존 배너 페이지 읽기 성공. 착수 append가 자동 승인 검토에서 “MCP tool call requires approval, but approval policy is never”로 거절되어 갱신 대기.
- CURRENT/DECISIONS 및 다른 담당 기록 변경 없음.
- Notion 갱신 대기 요약: integration-203@bf01c81c에서 5개 canonical banner 연결/기존 예산·경영회의실 보존, Node 매핑·nav·203b·mission·게시판7종·syntax·원시EOL PASS, 실제 UI spawn EPERM·원격 main 조회 제한, 미커밋·v202 유지·미배포. 로컬 원문: 이 인수인계.
