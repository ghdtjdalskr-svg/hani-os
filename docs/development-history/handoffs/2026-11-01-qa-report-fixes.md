# Conference Room QA-4 / QA-17

## 작업 식별

- 갱신일(KST): 2026-11-01
- 담당: Codex / 검토·실제 브라우저: 서윤
- 상태: 구현·Node targeted test 완료, 미커밋 검토·실제 브라우저 검증 대기
- worktree: qa-b1 / branch: hani/qa-report-fixes
- base: c7b2c202eb9eed0d2ebc7449525c1d913ddf8ebf (HEAD/ref 파일 읽기로 확인, Git subprocess 미사용)
- 운영 기준: 2.9.245 (사용자 제공, 로컬 index 캐시 태그 확인)
- 범위: hani-main.js 월간 생성·보관 렌더, hani-goal-progress.js 공통 월간·기간 UI, hani-design-system.css KPI, index.html 월간 추이·분기 순서, 해당 테스트.
- 승인: 사용자 QA-4/QA-17 구현·Node 검증만. 커밋/push/merge/버전·캐시 변경/브라우저·Git subprocess 금지. 새 runtime 파일 금지.
- 미승인: 데이터 구조·보호 저장 경로·Cloud/schema/calculation 변경·배포.

## 결과와 증거

- 원격 최신 main / 운영 read-back: 사용자 지정 기준선 사용, 미확인. Git·브라우저 제한 우회 없음.
- CODEMAP: monthly-report 먼저 확인. 공통 계산 경로에 대한 notes가 오래되어 실제 owner 경로 확인으로 fallback(CODEMAP_MISS).
- Notion: 현황판 읽기 성공. 착수 append는 자동 승인 검토(approval policy never) 거절로 미반영. 종료 요약 갱신 대기.
- 데이터·저장소·Cloud/schema: 변경 금지, 기존 성공 시 보고서 저장 호출만 유지.

### 구현 결과

1. 생성: 단일 실행 잠금·버튼 대기 표시. 검증 실패 시 기존 dataHubRefresh 1회 후 재조회. 차단/예외/build false/저장 실패 이유를 pending의 plain Korean status에 보존하며 재도색에도 유지. 재생성 confirm 유지. 검증 대기 중 월 변경은 저장 취소, 동시에 추가된 다른 보고서는 보존. 실패 시 기존 보고서와 원본 보존.
2. 공통 월간 한마디: 9개 지표별 기존 담당 말투와 오빠 호칭. 해당 검증 값만 사용하며 null이면 무기록 안내. 전월 비교 없음. 최근 관측/결산기간 안내 포함. 확정 결산 아님은 집계 기준에 유지. KPI는 선택 월 기록 기준, 목표 행은 월간 목표/설정 안 함.
3. KPI 색: 기존 finance/money/health/activity/culture/learning 색 재사용. 새 보고서와 저장 보고서 모두 적용. 보관 렌더는 label에서 tone을 유도하며 [label,value,meta] 형식 유지. #171f31 대비 각각 5.43 / 7.80 / 8.56 / 7.36 / 6.12 / 11.41:1, #121929 대비도 4.5 이상.
4. 월간 독서 추이: index 슬롯과 월간 render 호출 제거. 서재·시청 슬롯 보존. activityTrendHtml의 report-only 안내는 기존 hani-simplify-218.test.cjs가 호출·검증하므로 원문 보존.
5. 기간 UI: 분기/연간/설정의 controls를 최초 1회 생성. 결과 슬롯은 markup이 바뀔 때만 갱신. 컨트롤 DOM과 focus 보존. guidance는 입력 중 갱신을 미루며, 다른 사실이 바뀌거나 검증 대기 후 복귀해도 지표/다음 기간 키별 미저장 입력값 보존. 기존 목표 승인·이동 이벤트 경로 유지.
6. 분기 순서: keynote → earningsQuarterly → 기본 닫힌 details의 quarterGoalReport. summary는 resolved 목표/전체 facts 개수 또는 원본 검증 대기, 같은 요소에서 갱신. goals 탭 summary와 단일 editor 이동 유지. annual board markup 원문 보존.

### 변경 파일

- runtime 기존 4개: hani-main.js, hani-goal-progress.js, hani-design-system.css, index.html.
- 신규 개발 테스트 1개: scripts/hani-qa-report-fixes.test.mjs (새 runtime 파일 없음).
- 기존 테스트 6개: scripts/hani-proactive-204.test.mjs, scripts/hani-proactive-204-ui.test.mjs, scripts/hani-report-common-ui.test.mjs, scripts/hani-monthly-report-smoke.mjs, scripts/hani-app-216-practical.test.cjs, scripts/hani-app-216-practical-edge.mjs.
- 문서: 이 인수인계, docs/development-history/CURRENT.md.

### 실행한 검증 (Node v24.20.0 / 미커밋 작업본)

| 명령 | 통과 / 실패 | 근거·제한 |
| --- | --- | --- |
| node scripts/hani-monthly-report-aggregation-test.mjs | 1 검증 묶음 / 0 | 실제 기존 snapshot·renderer, immutable source |
| node scripts/hani-monthly-report-design-212.test.mjs | 1 검증 묶음 / 0 | Node snapshot 검증만. 선택적 browser QA 미실행 |
| node scripts/hani-report-common-ui.test.mjs | 0 / 시작 오류 1 | Playwright 모듈 인자가 없어 ERR_INVALID_ARG_TYPE. 브라우저 기동 없음 |
| node scripts/hani-proactive-204.test.mjs | 19 / 2 | 둘 다 Git baseline 조회 spawnSync git EPERM. 수정 전 작업본에서도 정확히 19/2 확인. 제한 우회·baseline 대체 없음 |
| node scripts/hani-proactive-204-ui.test.mjs | 0 / 시작 오류 1 | 필수 Playwright/browser 인자 없음. 브라우저 기동 없음 |
| node scripts/hani-app-216-practical.test.cjs | 12 / 0 | 기존 12개 모두 통과 |
| node scripts/hani-qa-report-fixes.test.mjs | 10 / 0 | tree fake DOM+vm에서 실제 생성/공통 engine/render/capture/archive 경로. 잠금·재시도·실패 무저장·NULL·선택 요소 동일성·무변경 repaint write0·guidance·summary·순서·AA |
| node --check (변경 runtime JS 2개 + 변경/신규 테스트 7개) | 9 파일 / 0 | 전부 syntax 통과 |
| node --test --test-name-pattern="actual report rendering" scripts/hani-proactive-204.test.mjs | 0 / 시작 오류 1 | 추가 단일 검사 실행 시도. Node test runner 자체의 자식 프로세스 spawn EPERM으로 시작하지 못함. 직접 node 실행의 19/2 결과와 구분 |

- 보호 확인: 수정 시작 때 보존한 파일과 비교해 save(), monthlyReportCaptureView(), dataHubRefresh(), activityTrendHtml()~renderReading() 앞 원문 동일. hani-goal-progress.js의 const names 이전 계산 engine 원문 동일. runtime 4파일의 변경하지 않은 줄 EOL drift 0, 버전 토큰·?v= 태그 동일. 추가/변경 줄에 직접 localStorage/Cloud write 연산 없음.
- 원격 Git/실제 브라우저/운영 조회, package build/후보 gate는 수행하지 않음. Candidate/Release 단계 아님.

### 기존 테스트 변경 근거 (검사 완화 없음)

- app-216-practical.test.cjs: monthlyReadingActivityTrend id가 1개라는 기존 assertion만 0개로 변경. 나머지 서재·시청 unique id assertion 유지.
- app-216-practical-edge.mjs: 월간 추이 visible/text assertion을 월간 슬롯 count 0으로 변경. 기존 화면 캡처 유지.
- report-common-ui.test.mjs: generic 공통 문장 assertion만 오빠 포함·기존 generic 문장 없음으로 변경. deliberate voice 변경 반영. 닫힌 details 열기와 async 생성 await 및 pending 실패 안내 검사 추가.
- monthly-report-smoke.mjs: 닫힌 details 검사와 열기 추가, 기존 9개 fact assertion 유지.
- proactive-204-ui.test.mjs: 같은 기존 goal link를 누르기 전 닫힌 details 열기만 추가.
- proactive-204.test.mjs: fake DOM에 persistent slot·contains·onclick/native click 표현과 실제 helper 로딩 추가. 기존 assertion 전부 유지. Git 의존 보호 검사 변경 없음.

### 미검증 / 서윤에게

- hani-monthly-report-smoke.mjs 및 hani-app-216-practical-edge.mjs는 Playwright/브라우저 필요, 실행하지 않음.
- report-common-ui/proactive-ui를 필수 인자와 함께 허용 환경에서 실행. design-212의 선택적 브라우저 경로도 미검증.
- 실제 dropdown을 연 상태의 Cloud/Data Hub repaint, 폰의 year 입력·guidance 값·details open 유지, 실패 안내·재시도, archive 색/기존 한마디, 분기 스크롤/배치 및 실제 화면 contrast 확인.
- Git 의존 두 검사는 정상 Git 환경에서 재실행. 이 작업에서는 성공으로 표시하지 않음.
- 추가 --test runner 방식도 자식 프로세스 제한으로 시작하지 못했으며 우회하지 않음.
- hani-goal-progress.js 상단은 generated 표기이므로, 향후 해당 bundle 재생성 시 이번 owner UI 수정이 유지되는지 배포 담당 확인 필요.
- main/Pages/최신 JS 로딩/Production read-back 전부 미실행. 버전은 2.9.245 유지, commit/push/merge/배포 없음.

## 다음 담당에게

- 서윤이 미커밋 diff 검토 후 허용 환경에서 실제 브라우저 검증.
- 자동 승인 검토가 거절한 Notion 현황 갱신을 허용 환경에서 반영하고 저장 후 읽기 확인.
