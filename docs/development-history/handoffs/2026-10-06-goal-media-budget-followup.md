# 목표 미완성 항목 후속 · 시청 작품 수 / 월 예산 제안

- 담당 Codex / 개발·검증 완료, 탑승 대기. branch `hani/goal-media-budget-followup`, base `c43ba2f1ce24c05e2cb16338e920fcf73731de0a` (작업 시작 원격 최신 main, 운영 v2.9.190).
- 근거: 대표님 “진행해줘”와 남은 분야별 목표 완성 후속 지시, D-20261005-07(월 예산 +15% 입력 제안), D-20261005-10(시청 편수 추가). D-20261005-12 운동일 목표 보류 유지.
- 수정 범위: `hani-main.js` GOAL_METRICS/초안 입력 검증/기존 form onchange 및 입력 제안 슬롯, `hani-goal-progress.mjs` 표시 지표/공통 제안 함수 노출, `data-hub/goal-period-view.mjs` 시청 실적 조회 준비 상태. 기존 generator로 `hani-goal-progress.js` 재생성. 목표 승인/삭제/save/Cloud/auth/복구 handler 변경 없음.
- 미완성 근거: media_watched_count 정의·adapter와 suggestMonthlyBudget은 기존 순수 모듈에 있으나 목표 등록/화면 연결이 없음. 보고서 UI는 QA 탭 소유로 수정하지 않음.
- 데이터 모델: 기존 goalRegistry의 같은 필드 계약과 Preview→승인 저장 흐름 재사용. 새 storage/write path, schema/migration, 자동 목표 생성/legacy backfill 없음. 새 media metric_id는 기존 공통 정의의 동일 ID.
- 예산 기준: 현재 결산 라벨월 이하에서 가장 최근의 유효한 기존 ledgerMonths.targetT를 표시해 사용자가 +15% 제안값을 입력칸에 선택. 미래/잘못된/중복/비양수 기준이면 제안 중단. 원래 가계부 목표를 수정하지 않음.
- 완료 조건: 시청 목표 Preview/기존 승인 경로, 실제 관측 기반 기간 실적·달성률, 예산 제안 input-only와 취소/기준 없음·중복·미래 거부, 기존 BMI/삭제 회귀, PC/모바일, 원본 검증 gate·데이터 보존 검사.
- 버전/cache/HANI_DISPLAY_VERSION 증가, 운영 PR/main 병합/배포 금지. 완료 후 push·Notion 탑승 대기 읽기 확인. 서버 동시 배포 없음.

## 구현 결과

- 시청 작품 수를 9번째 목표로 등록·조회. 양의 정수만 허용, 화면 단위는 편, 저장 단위는 기존 계약 `title`. 날짜가 유효한 watched 작품만 실적으로 계산하며 관측이 없으면 0으로 단정하지 않음.
- 월 예산은 기존 가계부 목표 기준 +15%를 안내하고 선택 시 입력칸만 채움. Preview→대표님 승인이라는 기존 저장 절차 유지. 입력 변경 시 오래된 Preview 승인 상태를 해제.
- 분기·연간 보고서에서 기존 공통 읽기 API를 재사용할 수 있음. 보고서 UI 자체의 완성·QA는 별도 소유 작업이며 이번 완료 범위가 아님. 운동일 목표는 2027년 보류 유지.

## 변경 파일

- 운영: `hani-main.js`, `hani-goal-progress.mjs`, 생성된 `hani-goal-progress.js`, `data-hub/goal-period-view.mjs`.
- 개발 도구·테스트: `scripts/hani-goal-month-core.mjs`, `scripts/hani-goal-progress-ui.test.mjs`, `scripts/hani-goal-media-budget.test.mjs`, `scripts/hani-goal-media-budget-ui.test.mjs`.
- 인수인계: 이 문서. 화면 캡처는 로컬 `artifacts/goal-media-budget/`에 있으며 commit 제외.

## 검증 결과

- `node --test scripts/hani-goal-media-budget.test.mjs scripts/hani-goal-period.test.mjs scripts/hani-goal-period-view.test.mjs`: 27/27 PASS. 목표 정수 검증, 예산 기준 선택·오류 거부, 관측 기반 실적과 원본 유지.
- `scripts/hani-goal-media-budget-ui.test.mjs`: PC 1440 / 모바일 390 × Porcelain Cream / Midnight Black 4조합 PASS. 제안 입력·취소, Preview 갱신, 승인 중복 방지, 저장 실패 복구, BMI 회귀, 기준 없음, 화면 넘침·console 검사.
- 추가 격리 브라우저에서 실제 기존 save() 경로 PASS: Preview 보호 키 쓰기 0회, 승인 쓰기 1회, 저장 JSON read-back으로 시청 목표와 알 수 없는 필드·다른 원본 데이터 보존 확인. 합성 데이터만 사용.
- 기존 `scripts/hani-goal-progress-ui.test.mjs`: 4조합 PASS, 9개 목표 및 quarter/annual 읽기·검증 gate·데이터 불변 확인.
- 기존 `scripts/hani-goal-delete-test.js`: PASS, 취소/실패 복구/승인 1회/중복 차단/관계없는 데이터 보존.
- generator `--check`, 운영 JS syntax, `git diff --check`: PASS. 기존 save 및 승인 handler는 기준선 대비 변경 없음.

## 배포 담당 인수인계

- Claude Code가 최신 main과 통합하고 최종 후보 package/preflight/HINA 및 운영 read-back 수행. 기능 작업에서 운영 PR·버전 증가·main 병합·배포는 수행하지 않음.
- 함께 배포할 서버 기능: 없음. Cloud schema/migration/auth/복구 로직 변경 없음.
- 실제 운영 데이터·Cloud 쓰기·Production 화면은 이번 격리 테스트 대상이 아니며 미검증. 배포 후 시청 목표 등록과 예산 제안 선택을 실제 화면에서 read-back 필요.
