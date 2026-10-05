# 작업 인수인계 · BMI·체지방률 목표 등록 (v2.9.183)

## 작업 식별

- 작업 ID / 제목: CLAUDE-20261005-03 / Goal Registry에 BMI·체지방률 지표 추가, 미래 기간 적용일 자동 설정
- 갱신 시각(KST): 2026-10-05
- 담당 도구 / 검토 담당: Claude Code / 대표님 Preview 승인
- 상태: 승인 대기 (PR, Preview 확인 완료)
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / `hani/claude-bmi-goal` / `~/Documents/HANI_OS_DEV_CLAUDE/bmi-goal`
- base SHA / candidate SHA: `a7bb913` (v2.9.181) / PR head 참조
- 목표 / 완료 조건: 대표님이 “2027년 1분기 BMI 25” 목표를 목표 등록 화면에서 Preview → 승인으로 저장할 수 있음
- 수정할 파일·범위 / 다른 담당과 겹치는 범위: `hani-main.js`의 `GOAL_METRICS`·`goalRegistryBuildDraft` 검증 1줄·`renderGoalRegistry` 날짜 동기화, 표시 버전 2.9.183(`index.html`·`HANI_DISPLAY_VERSION`), `data-hub/period-goal.mjs`(BMI 정의·어댑터), 테스트. 목표 삭제(자산 업데이트실 탭)와 같은 화면이지만 삭제 경로는 건드리지 않음
- 사용자 승인 근거 / 승인되지 않은 경계: 대표님 “BMI 25를 목표로 하는건 좋을것같아”, 기간 “내년 1분기정도”, 진행 “지금 시작”. main 병합·배포는 Preview 승인 후

## 결과와 증거

- 변경한 내용 / 파일:
  - 목표 지표에 `body_bmi`(BMI · kg/m², point_target)와 `body_fat_percent`(체지방률 · %, point_target) 추가
  - BMI 목표값 허용 범위 10~60 (오입력 방지)
  - 연도·분기·기간을 바꾸면 적용일이 `max(오늘, 기간 시작일)`로 자동 설정. 예: 2027년 1분기 → 2027-01-01. 기존 규칙(과거 소급 불가, 기간 안 적용일)은 그대로
  - 표시 버전 v2.9.183. v2.9.182는 열린 PR197이 사용 중이라 건너뜀
- 실행한 검증:
  - `node --test scripts/hani-goal-period.test.mjs`: 19/19 PASS. 실제 `hani-main.js`의 `goalRegistryBuildDraft`로 2027 Q1 BMI 25 초안 생성, BMI 70·체지방 120 거부, 기간 전 적용일 거부를 확인
  - 로컬 package + One-Pass: RUNTIME, preflight PASS. `display_version`·`version_forward`(2.9.183 > 2.9.181)·`protected_write_surface` unchanged·`duplicate_dom`·`js_syntax` PASS
  - Preview(로컬 정적 서버, 격리 브라우저): PC·모바일 375px에서 BMI 선택 → 2027 → 1분기 → 적용일 2027-01-01 자동 → Preview “기존 미설정 → 변경 25 kg/m²” 표시. 가로 넘침 없음, 콘솔 오류 없음. 연도를 2026으로 되돌리면 적용일이 오늘로 복귀
  - 저장 버튼은 누르지 않음(미리보기 브라우저에도 저장 0건)
- 실행하지 않은 검증 / 남은 위험:
  - 로그인 화면은 계정 정보 없이 우회해 목표 패널만 확인. 로그인 후 실제 화면, 실제 저장, Cloud 동기화 read-back은 미검증
  - BMI 값은 신체 기록 저장 시점의 키 설정으로 계산된 값을 사용(키를 바꾸면 이후 기록부터 반영)
  - Data Hub 대시보드·분기 보고서에는 아직 BMI 진행률이 표시되지 않음(계산 모듈만 준비)
- 데이터·저장소·Cloud·schema 영향: 새 저장 경로 없음. 기존 `goalRegistry` 저장 흐름(Preview→승인→`save()`) 그대로. 새 metric_id 2개가 기록될 수 있음(기존 Data Hub core는 모르는 metric_id를 무시)
- PR / Preview / 배포 원문 링크: PR 생성 후 기록
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 승인 후 진행

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: `GOAL_METRICS`, `goalRegistryBuildDraft`, `renderGoalRegistry`, `data-hub/period-goal.mjs`
- 다음 한 가지 행동: 대표님 승인 → main 병합 → Pages 반영 → 표시 버전 2.9.183·최신 JS 로딩 확인 → 대표님이 실제로 BMI 목표 저장 후 이력 read-back
- blocker / 필요한 사용자 결정: 없음
- 다른 작업에 영향을 주는 사항: PR197(v2.9.182)이 이 PR 뒤에 병합되면 버전을 2.9.184 이상으로 올려야 함. 반대 순서면 이 PR이 영향 없음
- CURRENT / DECISIONS 갱신 내용: 결정 기록 정리 PR에서 함께 기록
