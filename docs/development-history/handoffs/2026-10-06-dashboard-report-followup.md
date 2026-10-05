# 대시보드 조회 안내 · 보고 QA 후속

- 담당: Codex / 날짜 2026-10-06 KST
- 승인 근거: 대표님 직접 요청을 Gemini 프로젝트 채팅에서 전달받음. 개발·검증만 수행, 배포 열차 인계. 재전달·다른 채팅 답장 권한 없음.
- branch `hani/dashboard-report-followup-20261006`, base `57719dcac0b221392dbe0a5ee3f5c7fb6e58cc02` (코드 표시 v2.9.185).
- 기존 탑승 대기 `hani/earnings-predeploy-v182` / `5b1d7d6` 보존. 임의 merge/rebase 없음.
- 소유 범위: hani-main.js의 대시보드 조회/UI 앵커(dataHubRenderDashboard 및 해당 조회 월 선택 이벤트), index.html의 dashboard 조회 슬롯, 관련 CSS/targeted tests. 기존 원본 검증 차단 원인 읽기 조사만 수행, OWNER_BINDING_BLOCKED 우회 금지.
- Gemini 소유 Cloud Sync 안정화·충돌 해결 UX·새 기기 복원·백업 복구 및 auth/storage 원본 검증 구현은 수정하지 않음. 해당 경로 수정이 원인 해결에 필요하면 조사 근거를 남기고 담당 조정 전 중단.
- 보고 소유 후속: 최신 main과 기존 보고 후보의 목표 패널 충돌 확인 → 기존 실제 답변 PPT·목표 화면·인증 연간 파일 read-back/수정본 복구 검증. 실제 운영 파일 쓰기는 명시 승인 및 인증된 사용자 UI 필요, 비밀정보 복제/우회 금지.
- 상태: scoped discovery 시작. 기능/테스트 완료 아님. 운영 화면 표시/최신 JS 실제 로딩 확인은 아직 미실행(코드 기준선만 확인).
- 버전·캐시 태그 변경/운영 PR/main 병합/직접 배포 없음. 서버 변경 계획 없음.
- Notion 후속 카드 상태 갱신 예정. 이전 탑승 대기 후보와 새 진행 중 후속을 구분해 기록.

## 1차 패치 / 실제 결과

- 변경: hani-main.js의 기존 Data Hub dashboard runtime 월 선택(getMonth)·paint, index.html 조회 월 input/안내/최근 입력 월 슬롯. 실제 as-of 날짜·소유 검증·storage 계약 유지. 월 변경 시 기존 캐시 view invalidation 및 재검증, 비동기 월 변경 결과 게시 차단. 미래/잘못된 월 거부. 빈 값은 이전 값/0으로 채우지 않음.
- 생성 bundle 안의 dashboard 계산 경로만 최소 변경. main에 bundle generator가 없으므로 재생성 재현은 미검증; 다음 담당은 해당 변경을 재생성 시 보존해야 함. core/metrics store/owner/auth/Cloud Sync·복원·백업 구현 변경 없음.
- 최신 입력 월 안내는 VERIFIED 상태에서만 표시. 단순 입력 날짜 안내이며 확정 지표나 전체 원본 완전성으로 주장하지 않음.
- PASS: `node --check hani-main.js`; `git -c core.whitespace=cr-at-eol diff --check`; `node scripts/hani-dashboard-period.test.mjs` 7 period + 3 latest-date 사례; `node --test scripts/hani-goal-period.test.mjs` 19건; `node scripts/hani-owner-verification-diagnostic.test.mjs` 7건.
- PASS: `node scripts/hani-owner-verification-runtime.test.mjs <playwright/index.mjs> <chrome.exe>` PC1440/모바일390 격리 계정검증·원본 보존. `node scripts/hani-dashboard-period-ui.test.mjs <playwright/index.mjs> <chrome.exe>` 동일 2폭 실제 renderer·runtime·월 변경 이벤트 및 차단 안내, selector fit. 실제 계정 아닌 독립 가상 profile/인증 fixture. 전체 overflow·실기기 결과 아님.
- 실패/미검증: 처음 전체 앱 startup+가상 cloudClient→dataHubRefresh 조합에서 runtime VERIFIED 기다림 timeout. 별도 가상 진단 owner verifier는 VERIFIED였으나 지표 runtime BLOCKED. 계산 예외라고 단정할 수 없음(예외 진단에서도 오류명 미관측). 현재 UI 검사에서는 owner verification을 별도 검사로 분리하고 runtime에 명시 synthetic binding을 주입함; 이 분리 PASS는 startup/auth/Data Hub 전체 통합 PASS가 아님. 실제 OWNER_BINDING_BLOCKED 재발 원인 해결 완료 아님. 담당 보호 경로 변경 없이 후속 조사 필요.
- 분기·연간 보고 후보는 이 branch에 아직 이식하지 않음. 기존 5b1d7d6 보존. 목표 패널 복원(v185)과 기존 보고 후보의 충돌 조정 및 실제 답변 PPT·인증 연간 등록/복구 검증 남음.
- 운영 UI/표시 버전/JS read-back·로그인 실사용·서버 기능 read-back 미검증. 서버 변경/함께 배포할 새 함수 없음. 보고 서버 dialogue v1/annual v2는 기존 후보 인계 확인 대상.
- 상태: **후속 진행 중, 탑승 가능 완성본 아님**. 버전185 및 캐시태그 유지. 운영 PR/main/배포 없음. 원본·qa-evidence는 commit 제외.

## 대표님 지표 미표시 제보 · 2026-10-06

- 첨부 화면은 조회9월·6개 카드 모두 OWNER_BINDING_BLOCKED. 빈 월 NO_DATA와 다른 검증 차단이며, 데이터 삭제/Local·Cloud 실제 불일치 원인은 화면만으로 확정 불가.
- 추가 패치: dashboard runtime의 실패 단계를 메모리 reason으로 보존하여 상태줄에 안전 코드만 표시. owner reason allowlist + 계산 phase enum만 사용, exception message/개인 원본/계정/비밀정보 노출 없음. 수치 차단/원본 비교·인증 및 저장 로직 유지. 실패 reason은 진단용이며 binding 권한 아님.
- 신규 테스트: 임의/private 오류 내용은 OWNER_CHECK로 제한. 가상 startup 경로 첫 이벤트는 NOT_VERIFIED 상태 지속이 재현됐으나, 이후 기존 runtime.refresh 재검증으로 실제 가상 source 일치와 6지표 VERIFIED 확인. PC1440/390. fake Cloud 원본 없음 시 완료된 거부(초기 NOT_VERIFIED가 아님)와 원본 보존도 확인.
- 이 결과는 초기 자동 검증 안정성 해결 PASS가 아님. 실제 대표님 계정에서 지표 검증·갱신 및 새 확인 코드/read-only 원본 진단 결과 필요. Cloud/복원/backup 담당 구현 수정 없음. 분기/연간 QA는 여전히 남음.
- 실행: `node scripts/hani-dashboard-period.test.mjs`; `node scripts/hani-dashboard-period-ui.test.mjs <playwright> <chrome> --startup`. PASS 범위는 가상 사용자 검증/재검증·월 선택·거부 결과 및 보존, 실제 계정/운영 PASS 아님.

## 월 1회 투자·소비 입력 주기 개선 / 2026-10-06

- 대표님 승인: 투자·소비는 매달 한 번 입력하므로 최근 확정 기록을 실제 기준월과 함께 표시하도록 개선. 개발·검증만, 배포 열차 유지.
- 변경 파일: `hani-main.js` 기존 dashboard runtime/renderer, `index.html` 투자·소비 meta 줄바꿈, `scripts/hani-dashboard-period.test.mjs`, `scripts/hani-dashboard-period-ui.test.mjs`, 이 인수인계.
- 투자: 조회 월 이하 최근 실제 confirmed 비포지션 snapshot의 canonical 총액. 소비: 실제 오늘까지 종료된 18→17 결산 중 조회 월 이하 최근 유효 입력. 조회 월을 과거로 바꾸면 그 이후 기록을 가져오지 않음. 종료되지 않은 소비 결산·invalid/stale·미확인 빈 ledger의 0은 확정 기록으로 채택하지 않음.
- 원본 관측의 row.month/as_of/결산기간을 그대로 유지. 해당 기준월의 정확한 전월 및 목표를 비교하며, 없는 전월/과거 목표를 추정하지 않음. 일별 지표는 선택 월 그대로. Coverage 미확인은 PARTIAL 유지(결산기간 종료가 원본 완전성 인증은 아님). 검증 차단 우회 없음.
- 기존 월간 엔진·저장 schema·protected source·auth·Cloud write 변경 없음. 필요한 실제 기준월과 전월을 기존 파생 캐시 generation에 포함하며 새 저장 키/경로 없음. 현재 bundle generator 부재 위험은 앞 기록과 동일.
- PASS: `node scripts/hani-dashboard-period.test.mjs` 기존 period 7/latest-date 3/안전 code + 월간 입력·기준 날짜·정확한 전월·분기 경계 예산·과거 조회·draft/future·소비 open/closed·빈 ledger·다른 지표 scope·원본 불변 실행 검증. `node --check hani-main.js`; `git -c core.whitespace=cr-at-eol diff --check`.
- PASS: `node scripts/hani-dashboard-period-ui.test.mjs <playwright> <chrome>` 가상 PC1440/모바일390 실제 renderer/event·최근 자산/소비 기간 표시·다른 지표 선택 월 유지·검증 거부·protected storage 불변. 기준 날짜가 ellipsis로 잘리던 부분은 기존 meta 슬롯 줄바꿈으로 수정 후 재검증. 격리 QA 화면은 `qa-evidence/dashboard-monthly-cadence-{1440,390}.png` (commit 제외). 실제 계정/운영 화면 PASS 아님.
- 회귀 PASS: `node --test scripts/hani-goal-period.test.mjs` 19건; `node scripts/hani-owner-verification-diagnostic.test.mjs` 7건.
- 이번 월간 표시 개선 개발·targeted test 완료. 전체 후속 상태는 **진행 중**: 실제 계정 초기 검증·보고 후보 이식/실제 답변 PPT·인증 연간 QA는 아직 남음. 새 서버 함수/배포 순서 변경 없음. 버전185·캐시태그 유지, main/운영 PR/배포 없음. Claude 열차 인계 시 이 범위와 전체 미검증을 구분해야 함.
