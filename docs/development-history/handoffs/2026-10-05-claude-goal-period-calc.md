# 작업 인수인계 · 분기·연간 합계와 목표 달성률 계산 (순수 모듈)

## 작업 식별

- 작업 ID / 제목: CLAUDE-20261005-02 / PeriodMetric·GoalProgress 순수 계산 모듈 + 신규 지표 어댑터
- 갱신 시각(KST): 2026-10-05
- 담당 도구 / 검토 담당: Claude Code / 대표님 검토
- 상태: 승인 대기 (PR)
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / `hani/claude-goal-period-calc` / `~/Documents/HANI_OS_DEV_CLAUDE/goal-period-calc`
- base SHA / candidate SHA: `f33146f` / PR head 참조
- 목표 / 완료 조건: [정의서](../2026-10-05-common-data-contract.md) §5.2·§5.3과 결정 D-20261005-06~10을 따르는 순수 함수와 테스트. 기존 Data Hub 엔진(`hani-main.js` core)의 월간 행을 입력으로 사용하고, 실제 엔진과 함께 실행하는 통합 테스트 포함
- 수정할 파일·범위 / 다른 담당과 겹치는 범위: 신규 `data-hub/period-goal.mjs`, 신규 `scripts/hani-goal-period.test.mjs`, 이 인수인계. **`hani-main.js`·`index.html` 수정 없음, 앱에서 불러오지 않음.** 분기 Conference Room(누락된 QA 탭)과 주제는 겹치지만 파일은 겹치지 않음
- 사용자 승인 근거 / 승인되지 않은 경계: 대표님 결정 D-20261005-06~10과 “추천대로 하시면 다음 작업 시작” 안내에 대한 결정 회신(2026-10-05). 앱 연결·운영 배포·저장 구조 변경·main 병합은 승인되지 않음

## 결과와 증거

- 변경한 내용 / 파일:
  - `data-hub/period-goal.mjs`: `periodMonths`, `periodRange`, `metricPeriod`(core 동일 규칙), `aggregatePeriod`(PeriodMetric), `resolvePeriodGoal`, `goalProgress`(GoalProgress, 누적 목표 진행 속도 포함), `suggestMonthlyBudget`(가계부 월 목표 + 15%), `EXTRA_DEFINITIONS`·`EXTRA_ADAPTERS`(체지방률·운동한 날 수·시청 편수)
  - `scripts/hani-goal-period.test.mjs`: 16개 테스트. `hani-main.js`의 실제 Data Hub core를 읽기 전용으로 불러와 통합 검증
- 실행한 검증:
  - `node --test scripts/hani-goal-period.test.mjs`: 16/16 PASS (Node 24, 로컬, base f33146f)
  - `hani-release-package.mjs build` + `hani-one-pass-release.mjs`: preflight PASS, release_kind `DEV_TOOLING_ONLY`, 15개 검사 PASS, `pc_mobile_smoke` MANUAL(앱 미변경)
  - 참고: docs 전용 pre-QA는 `data-hub/`가 문서 경로가 아니어서 BLOCKED. CI에서는 docs-only가 아니므로 이 단계가 실행되지 않음
- 실행하지 않은 검증 / 남은 위험:
  - 앱 연결, 실제 운영 데이터, 화면 검증은 하지 않음(이번 범위 밖)
  - 운동한 날 수 기준: **거리 > 0 또는 근력 체크**인 날만 셉니다. 걸음만 입력한 날은 제외. 대표님 확인 필요
  - 시청 편수: 시청 완료인데 시청일이 없거나 잘못된 기록이 있으면 매달 `INVALID_DATE`로 PARTIAL 표시(완독 기준과 동일한 방식)
  - 분기 기간에는 분기 목표만, 연간 기간에는 연간 목표만 사용(대체 적용 없음)
- 데이터·저장소·Cloud·schema 영향: 없음(읽기 전용 순수 함수, 앱 미연결)
- PR / Preview / 배포 원문 링크: 작성 중
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 앱 미연결로 N/A

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: `data-hub/period-goal.mjs`, 테스트 파일, 정의서 §5.2·§5.3
- 다음 한 가지 행동: 분기·연간 보고서 담당(누락된 QA 탭)과 연결 지점 합의 → 앱 번들 연결과 목표 등록 화면에 신규 3개 지표·예산 제안값 추가(runtime 변경이므로 버전 증가·Preview·승인 필요)
- blocker / 필요한 사용자 결정: 운동한 날 수의 기준 확인
- 다른 작업에 영향을 주는 사항: 분기 Conference Room·연간 뷰어는 이 모듈의 PeriodMetric/GoalProgress를 숫자 원천으로 사용할 수 있음. Data Hub 번들 생성 스크립트(`scripts/hani-data-hub-bundle.mjs`)는 main에 없어 앱 연결 방식은 별도 결정 필요
- CURRENT / DECISIONS 갱신 내용: 결정은 PR193에서 기록
