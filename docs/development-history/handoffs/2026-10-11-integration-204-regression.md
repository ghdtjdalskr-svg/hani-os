# 통합 204 회귀 수정 · 도연

## 작업 식별

- 갱신: 2026-10-11 KST / 담당 도연(Codex), 단일 Agent
- 상태: 요청 오류 수정 완료, 가능한 Node 검증 완료; 실제 브라우저 QA 및 후보 전용 검사 보류
- 저장소 / branch / worktree: HANI OS / hani/integration-204 / int204
- base/HEAD: ddbbf841509d9859b2e85289f3f84201a44416db (작업 종료에도 동일)
- origin/main 로컬: b23829b268b19b44fb3de81058374866287a9741. 원격 ls-remote 네트워크 실패로 최신성 미확인; merge/rebase 없음
- 표시/캐시 v2.9.203, 마지막 index script hani-ai-budget.js?v=2.9.203 유지. 실제 Production 로딩 미검증
- 승인: 이번 대표님 요청의 통합 회귀 수정과 가능한 모든 Node 테스트. commit 금지, mixed EOL 보존, 중복 id 및 신규 삭제 API 금지, 데이터 변경 금지
- 기존 다른 담당 작업 및 QA 산출물 보존. 테스트 실행이 생성한 산출물은 이번 코드 변경과 구분

## 결과와 증거

- CODEMAP 투자/보고서 owner 확인 후 실제 symbol과 DOM/event 소유 경로 조사. 실패 근거 ../int204-fail.txt
- hani-main.js: showView에서 투자위원회 상수를 guarded lookup. 분리 VM의 home/intake 이동도 선제 카드 renderer 존재 여부를 확인. 전체 앱에서는 기존 상수/renderer와 동일 실행
- hani-asset-market-view.js: 기존 종목별 helper가 있으면 canonical 투자 경로, helper 부재 시 기존 자산 이동 fallback. 새 event/renderer/storage 경로 없음
- scripts/hani-mission-203a.test.mjs: 분리 후 자산 안내 버튼의 실제 문구로 단일 기대값 갱신. 게시판 5개 테스트는 수정하지 않음
- scripts/hani-login-a-204.test.mjs: 인자 없으면 git show origin/main:<file>, maxBuffer 64MiB. Git 실행 불가(ENOENT/EPERM/EACCES)만 명시 SKIP 및 PARTIAL PASS, 잘못된 ref/기준선/검증 실패는 throw. 명시 baseDir의 기존 전체 파일 보존 검사는 유지. 기본 경로는 관련 sync/auth/save/commit/보호 write owner 및 보호 key/internal/display version와 retained EOL을 비교하여 다른 통합 UI 변경을 허용
- scripts/hani-goal-delete-test.js: Playwright/브라우저 경로 인자 지원, 인자 없으면 설치 module 또는 공용 Codex runtime, 설치된 Chrome/Edge 탐색. 기본 실행의 MODULE_NOT_FOUND 해결 확인; 실제 브라우저 spawn EPERM
- scripts/hani-report-common-ui.test.mjs: 분기 목표 탭 클릭 후 data-quarter-goal-guidance에서 BMI 제안 선택, 실적 탭으로 돌아와 overflow/screenshot 검사. guidance는 quarterGoalReport 밖의 canonical 목표 탭 소유. 브라우저 launch 실패 시에도 server를 닫도록 finally 보완. 앱의 데이터/보고서 계산은 변경하지 않음
- 변경 JS syntax 및 git -c core.whitespace=cr-at-eol diff --check PASS. 기본 diff --check의 CRLF 끝 CR 경고는 mixed EOL 보존에 따른 것이며 줄끝을 일괄 변환하지 않음

### 실행 결과

- scripts의 test 102개 및 smoke 9개, 총 111개 실행 시도. raw 최초 결과와 재검증을 구분하여 보존
- 최종 파일 단위: PASS 60개, 환경/필수 입력 차단 48개, 로그인 기본 실행 PARTIAL 1개, 과거 보존 test의 기준선/추출 범위 실패 2개
- 게시판 5개, hani-mission-203a, hani-invest-split, navlogin, nav-groups, banners, Cloud-first 40, 투자 Research 14, Monthly 8, portfolio, report-common, protected-write-contract 등 PASS
- hani-proactive-204.test.mjs: git archive HEAD raw baseline + HANI_PROACTIVE_TEST_BASELINE으로 21/21 PASS. 기본 실행에서는 Node git subprocess EPERM으로 보존 2개가 막힘
- hani-ui-203b.test.mjs .ai-budget-private/integration-204/head-base: retained EOL/추가 write 없음 포함 PASS
- 로그인 기본 기준선 보존: 실제 git archive origin/main 원본을 execFileSync 의존성에 공급한 격리 harness PASS. git show 인자/ref/root/maxBuffer도 assertion 확인. 실제 Git subprocess 실행은 EPERM이라 별도 미검증
- 보호 원문 별도 검증: origin/main과 실제 함수 종료 경계로 비교한 25개 storage/state/Cloud/calculation owner와 IC data core bytes/EOL 동일 PASS
- hani-invest-split-safety.test.mjs 및 hani-investment-research-safety.test.cjs에 origin/main 원본을 공급한 추가 실행: migrateV22에서 실패. 기존 region()이 다음 function까지 잘라 migrateV22 뒤의 여러 unrelated UI handler까지 포함하며, 이미 통합된 proactive/split 변경을 data owner 변경으로 판정. 두 테스트는 PASS로 처리하지 않음. 이번 diff는 showView/market link만 변경하고 실제 migrateV22 및 25개 owner 원문은 보존
- boardroom-routing은 rebuilt Edge source 인자 부재, deploy-package-intake는 frozen PACKAGE 인자 부재. 후보 build/서버 재구축은 요청 범위 밖이라 수행하지 않음
- drive-vault-precheck는 하위 CLI spawnSync 상태 null(환경 EPERM 계열). 다른 Git/Node subprocess 검사와 함께 차단으로 구분
- 목표 삭제/보고서 Edge UI 및 다른 브라우저 검사는 spawn EPERM. 실제 화면/모바일/console 검증을 PASS로 표시하지 않음
- 증거: .ai-budget-private/integration-204/final-results.json, regression-run.json, smoke-run.json, 개별 .log, login-default-offline.mjs, protected-owners.log, origin-main-base 및 head-base raw git archive (ignored; commit 대상 아님)

## 경계 및 미반영

- 운영 데이터/localStorage key/internal version/save/Cloud/schema/migration 변경 없음. duplicate static id 추가 없음. 신규 삭제 API 없음
- commit/push/PR/main merge/버전 증가/배포/Candidate build/독립 HINA/Production read-back 수행하지 않음
- Notion 현황판 읽기 성공. 착수 append는 자동 승인 검토가 approval policy is never를 이유로 거절하여 미반영. 이 인수인계의 착수/수정/검증/미검증/다음 행동 요약 갱신 대기
- CURRENT: 이번 작업 요약과 원문 링크만 추가, 과거/다른 담당 근거 보존. DECISIONS: 새 대표님 결정 없음

## 다음 담당에게

- Claude 배포 담당: 미커밋 수정 6파일과 본 인수인계를 검토. 두 과거 보존 테스트의 function boundary/통합 기준선을 확인하고, 브라우저 실행 가능한 환경에서 목표 삭제 및 분기 목표 제안 이동 UI를 재검증
- 재실행: node scripts/hani-goal-delete-test.js [playwright index path] [browser exe]; node scripts/hani-report-common-ui.test.mjs <playwright index.mjs> <browser exe>; node scripts/hani-login-a-204.test.mjs
- 데이터/배포 승인 요건은 유지. 대표님에게 추가 승인을 요청하거나 배포 완료로 보고하지 않음
