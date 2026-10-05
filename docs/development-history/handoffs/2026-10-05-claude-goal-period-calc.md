# 작업 인수인계 · 분기·연간 합계와 목표 달성률 계산 (순수 모듈)

## 작업 식별

- 작업 ID / 제목: CLAUDE-20261005-02 / PeriodMetric·GoalProgress 순수 계산 모듈 + 신규 지표 어댑터
- 갱신 시각(KST): 2026-10-05
- 담당 도구 / 검토 담당: Claude Code / 대표님 검토
- 상태: 진행 중
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / `hani/claude-goal-period-calc` / `~/Documents/HANI_OS_DEV_CLAUDE/goal-period-calc`
- base SHA / candidate SHA: `f33146f` / PR head 참조
- 목표 / 완료 조건: [정의서](../2026-10-05-common-data-contract.md) §5.2·§5.3과 결정 D-20261005-06~10을 따르는 순수 함수와 테스트. 기존 Data Hub 엔진(`hani-main.js` core)의 월간 행을 입력으로 사용하고, 실제 엔진과 함께 실행하는 통합 테스트 포함
- 수정할 파일·범위 / 다른 담당과 겹치는 범위: 신규 `data-hub/period-goal.mjs`, 신규 `scripts/hani-goal-period.test.mjs`, 이 인수인계. **`hani-main.js`·`index.html` 수정 없음, 앱에서 불러오지 않음.** 분기 Conference Room(누락된 QA 탭)과 주제는 겹치지만 파일은 겹치지 않음
- 사용자 승인 근거 / 승인되지 않은 경계: 대표님 결정 D-20261005-06~10과 “추천대로 하시면 다음 작업 시작” 안내에 대한 결정 회신(2026-10-05). 앱 연결·운영 배포·저장 구조 변경·main 병합은 승인되지 않음

## 결과와 증거

- 변경한 내용 / 파일: 작성 중
- 실행한 검증: 작성 중
- 실행하지 않은 검증 / 남은 위험: 작성 중
- 데이터·저장소·Cloud·schema 영향: 없음(읽기 전용 순수 함수, 앱 미연결)
- PR / Preview / 배포 원문 링크: 작성 중
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 앱 미연결로 N/A

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: 작성 중
- 다음 한 가지 행동: 작성 중
- blocker / 필요한 사용자 결정: 작성 중
- 다른 작업에 영향을 주는 사항: 작성 중
- CURRENT / DECISIONS 갱신 내용: 결정은 PR193에서 기록
