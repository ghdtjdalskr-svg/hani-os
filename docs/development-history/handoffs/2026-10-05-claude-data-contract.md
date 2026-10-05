# 작업 인수인계 · 공통 데이터 정의서 + 목표 빈칸 조사

## 작업 식별

- 작업 ID / 제목: CLAUDE-20261005-01 / 공통 데이터 정의서(초안) + 분야별 목표 빈칸 조사
- 갱신 시각(KST): 2026-10-05
- 담당 도구 / 검토 담당: Claude Code / 대표님 검토
- 상태: 승인 대기 (문서 PR)
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / `hani/claude-data-contract-v1` / `~/Documents/HANI_OS_DEV_CLAUDE/data-contract`
- base SHA / candidate SHA: `882057c` / PR head 참조
- 목표 / 완료 조건: 목표·실적·기간·보고서의 현재 구조와 차이를 코드 근거로 정리하고, 공통 계약 초안과 목표 후보 목록을 제출
- 수정할 파일·범위 / 다른 담당과 겹치는 범위: `docs/development-history/` 신규 문서 3개만. 운영 코드 수정 없음. 분기 Conference Room·목표 초안(누락된 QA 탭), 목표 삭제(자산 업데이트실 탭)와 **주제는 겹치지만 파일은 겹치지 않음**
- 사용자 승인 근거 / 승인되지 않은 경계: 대표님 “너가 말한 1,2번 모두 진행해줘”(2026-10-05, Claude 대화). 문서 작성·PR 준비 범위. main 병합·runtime 구현·schema·migration은 승인되지 않음

## 결과와 증거

- 변경한 내용 / 파일:
  - `docs/development-history/2026-10-05-common-data-contract.md` (정의서 초안, 발견 G1~G8, 결정 요청 D1~D4)
  - `docs/development-history/2026-10-05-goal-coverage-audit.md` (목표 후보 A/B/C)
  - 이 인수인계 파일
- 실행한 검증: 코드 읽기(`hani-main.js` Data Hub core 1~430행, Goal Registry 1205~1263행, 월간 보고서 5589~5700행, 기존 목표 경로). 문서 CI는 PR에서 확인
- 실행하지 않은 검증 / 남은 위험: 운영 데이터·실기기 미확인. 다른 탭의 미병합 코드 미확인. CODEMAP에 goal/data-hub 항목 없음(`CODEMAP_MISS`)
- 데이터·저장소·Cloud·schema 영향: 없음
- PR / Preview / 배포 원문 링크: https://github.com/ghdtjdalskr-svg/hani-os/pull/187 (첫 head 2f47d09: 로컬 pre-QA 12/12 PASS, CI 2/2 PASS)
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 문서 전용으로 N/A

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: 정의서 §4(G1~G8), `calculateMonth`·`resolveGoal`·`compareMetric`, `monthlyReportSnapshot`
- 다음 한 가지 행동: 대표님 D1~D4 결정 → `DECISIONS.md` 기록 → PeriodMetric·GoalProgress 순수 함수와 테스트(앱 미연결) 작성
- blocker / 필요한 사용자 결정: D1~D4, 추가할 목표 분야 선택
- 다른 작업에 영향을 주는 사항: 분기·연간 보고서 담당은 G5·G6(계산 경로 이원화, 저장본 문구만 보관)을 참고해 연결 지점을 정할 것. 목표 삭제 담당은 G8(상태값)과 맞출 것
- CURRENT / DECISIONS 갱신 내용: 이 PR에서는 갱신하지 않음. 결정 후 반영
- 추가 제안: `dev-center/codemap.json`에 `goal-registry`·`data-hub`·`monthly-report` 항목 추가(별도 패치)
