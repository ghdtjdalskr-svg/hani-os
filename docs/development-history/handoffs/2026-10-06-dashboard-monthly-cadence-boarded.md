# 대시보드 월간 입력 주기 · 배포 열차 인수인계

## 작업 식별

- 갱신일: 2026-10-06 KST / 담당 Codex. 상태: **탑승 대기 (개발·targeted test 완료, 운영 배포 아님)**.
- 승인: 대표님 “투자랑 소비 데이터는 원래 1달에 한번밖에 입력안해” → 최근 확정 기록/실제 기준월 표시 제안에 “응 그렇게 개선해줘”, 이후 “탑승대기까지 이어서 작업해줘”. 직접 배포/운영 PR 권한 없음.
- branch `hani/dashboard-report-followup-20261006`, worktree `.worktrees/dashboard-report-followup-20261006`.
- base `57719dcac0b221392dbe0a5ee3f5c7fb6e58cc02` / runtime commit `98decce92d8e21a6965679e1187a10794cde4623`.
- 최신 origin/main 읽기 `22c002136a12be9af94a61061a0f143b839d1ccb` (코드 v2.9.188). 현재 개발 base의 표시 버전185·캐시태그는 올리지 않았음. 임의 merge/rebase/history rewrite 없음.
- 독립 탑승 범위: 대시보드 조회월·빈 기록 안내·안전한 검증 단계 code + 투자·소비 월간 입력 기준 표시. 기존 보고 후보 `hani/earnings-predeploy-v182` / `5b1d7d6`와 보고 QA는 포함하지 않음.

## 변경과 검증

- runtime 변경 파일: `hani-main.js` 기존 generated dashboard `createDashboardRuntime`/`dashboardText` 및 `dataHubRenderDashboard`, `index.html` 조회월/안내 슬롯 및 자산·소비 meta 줄바꿈.
- 검사: `scripts/hani-dashboard-period.test.mjs`, `scripts/hani-dashboard-period-ui.test.mjs`.
- 투자: 조회 월 이하 최근 실제 confirmed snapshot의 canonical 총액·실제 snapshot 날짜. 소비: 조회 월 이하이며 실제 오늘까지 종료된 18→17 결산의 최근 유효 입력. draft/future/open 결산/invalid/stale 값·미확인 빈 ledger의 0을 확정값으로 채택하지 않음.
- 실제 관측 row.month/as_of/결산기간 유지. 투자 비교는 그 기준월의 정확한 전월, 예산/목표는 그 기준월의 유효한 등록값. 없는 전월/목표는 추정하지 않음. 다른 지표는 조회 월 그대로. 원본 coverage 미확인은 PARTIAL 유지.
- 가상 환경에서 원본 없음/비배열도 다른 지표 전체 계산을 중단시키지 않고 해당 지표 빈 값으로 처리. 소유 검증 거부는 6개 수치 모두 차단. 실패 code는 allowlist/phase enum만 표시.
- PASS (runtime98decce 내용): `node --check hani-main.js`; `git -c core.whitespace=cr-at-eol diff --check`; `node scripts/hani-dashboard-period.test.mjs` (기존 period7/latest-date3/safe code + 월간 날짜·정확한 전월·분기 예산·과거 조회·open/closed·draft/future·빈 ledger·비배열 원본·다른 지표 scope·원본 불변).
- PASS: `node scripts/hani-dashboard-period-ui.test.mjs <playwright/index.mjs> <chrome.exe>` 실제 전체 앱의 격리 가상 profile PC1440/모바일390. 기존 renderer/event·월 선택·투자 날짜/소비 기간 표시·검증 거부·protected storage 불변·selector fit. 화면 근거 `qa-evidence/dashboard-monthly-cadence-{1440,390}.png` (로컬, 개인 원본 없음, commit 제외). 실제 인증을 우회한 운영 QA가 아니라 독립 가상 계정 검사임.
- 회귀 PASS: `node --test scripts/hani-goal-period.test.mjs` 19건, `node scripts/hani-owner-verification-diagnostic.test.mjs` 7건.
- 실행 환경: bundled Node24.19 / Playwright / installed Chrome, 외부 통신 차단 격리 UI. 검사 명령의 런타임 경로는 기존 후속 인수인계/검사 스크립트 참고.

## 보호·미검증

- protected key/내부 데이터 버전·원본 구조·auth/Cloud write/schema/복원/backup 수정 없음. 새 저장 키·protected write 추가 없음. 기존 파생 캐시 generation에 실제 기준월과 전월을 포함하는 기존 계산 경로만 사용.
- 서버 Edge Function 변경/추가/재배포: **없음**, 함께 배포할 서버나 순서 없음. 기존 보고 서버의 QA를 이번 범위 PASS로 주장하지 않음.
- 소유 검증의 초기 자동 startup에서 발생한 문제를 고쳤다는 의미 아님. 실제 계정 로그인/재검증 안정성, 운영 표시/실제 JS/기능 read-back은 미검증. 가상 계정 PASS를 실제 사용자 PASS로 재사용하지 않음.
- bundle generator가 main에 없으므로 재생성 재현은 미검증. 재생성할 때 이 기존 dashboard 영역의 변경을 보존해야 함.
- 최종 package/One-Pass/서버 HINA/열차 Preview/대표님 승인/운영 read-back은 배포 담당 단계이며 이번 기능 개발에서 실행하지 않음.

## 다음 담당 (Claude)

- 먼저 이 문서와 `2026-10-06-dashboard-report-followup.md`를 읽고 base→HEAD의 dashboard 변경만 통합. 기존 보고 후보5b1d7d6 전체를 이 작업과 함께 배포하지 않음.
- 최신 main drift는 목표 한 건 삭제·공부/일정·버전/캐시태그 경로였음. base185→22c0021의 기존 dashboard runtime/카드 영역 변경은 확인되지 않았으나 실제 통합 후보에서 재검사 필요. 이 사실은 최신 main에서 기능 실행 PASS가 아님.
- hani-main/index는 다른 열차와 공유 파일이므로 최신 운영 내용을 보존. 버전/cache만 열차 담당이 결정하며 기능 충돌은 담당에게 반환.
- 위 targeted test를 열차 후보에서 다시 실행 → 실제 로그인 Preview에서 조회10월/최근9월 카드의 기준 날짜·기간, 과거 조회, 기록 없음/미확인, 원본 검증 차단 확인 → 필수 열차 gate/승인 → 배포 후 read-back.
- 추가 기능 개발 blocker는 없음. 운영 통합·실제 인증 Preview·최종 gate는 남아 있음. 운영 완료/배포 승인을 뜻하지 않음.
