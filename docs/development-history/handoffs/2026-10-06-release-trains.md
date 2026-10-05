# 배포 열차 기록 · 2026-10-06 (배포 담당 Claude Code)

AGENTS.md §11에 따른 첫 운영 기록입니다.

## 1호 · v2.9.185 · PR206 (merge 57719dc)

- 탑승: 설정/데이터 화면의 「목표 관리」·「Data Hub · 기록 보관함」 빈 칸 복구. v2.9.180(#192)이 `renderStoragePanel`의 렌더 호출 2줄을 다른 코드로 바꾼 회귀. 대표님 운영 제보.
- PR205는 테스트 파일 포함·배포센터 manifest 형식(Base, Mode, Package-Paths, Index-SHA) 누락으로 배포센터 BLOCKED(서버 HINA 자체는 PASS) → 런타임 2파일만 담은 PR206으로 교체.
- 대표님이 배포센터에서 승인·배포. 운영 read-back: v2.9.185 표시, `hani-main.js?v=2.9.185` 로딩, 「설정 / 데이터」 메뉴 클릭 시 두 칸 렌더·콘솔 오류 없음.
- 이 기록과 함께 회귀 테스트(`scripts/hani-goal-period.test.mjs`의 renderStoragePanel 검사, 수정 전 FAIL/수정 후 PASS)를 main에 추가.

## 2호 · v2.9.186 · PR207 (merge ab5bbbf)

- 탑승: 공부 실제 뉴스 출제(테마 작업 탭, `hani/release-study-news-v185` runtime `b065b58`). `hani-study-v02984.js`만 가져오고 버전·캐시 태그를 2.9.186으로 1회 정리. PR201은 대체되어 닫음.
- 검증: study syntax, 뉴스 소재 테스트(운영 0.4.1 서버 소스 기준), v04 회귀, One-Pass PASS, 배포센터 서버 HINA PASS(운영본 독립 비교).
- 대표님 지시 “승인요청하지말고 배포할수있는건 해줘”(2026-10-06)와 Claude 브라우저 창 로그인에 따라 Claude가 배포센터에서 「✓ 대표 승인 & 배포」와 확인 대화상자(후보 d1506628cc)를 실행.
- 운영 read-back: 배포센터 “🟢 배포 완료 v2.9.186”, `index.html`이 `hani-main.js?v=2.9.186`·`hani-study-v02984.js?v=2.9.186` 참조, 운영 `hani-study-v02984.js` 바이트가 main과 동일(SHA-256 일치), 공부 화면 렌더 정상.
- 서버 `hani-learning-quiz` 0.4.1은 테마 작업 탭이 이미 운영 배포·read-back 완료(재배포 없음). 이 기록과 함께 그 소스(`b9f5adb`)와 0.4.1용 테스트를 main에 반영해 저장소와 운영을 일치시킴.

## 3호 · v2.9.187 · PR209 (merge e0e9da1)

- 탑승: YUNA 일정 의도·날짜 범위 해석 Preview(`hani/yuna-schedule-contract` 24b3a6c). 일정 저장은 없음(승인 범위).
- 1차 HINA FAIL “새 중복 DOM ID: yunaEdit” — 일정/일반 미리보기가 같은 버튼 리터럴을 각각 가짐(런타임에는 배타적). 배포 담당이 `YUNA_EDIT_BUTTON` 상수로 공유, 렌더 HTML 동일. 재검증 후 HINA PASS.
- 1차 시도 직전 GitHub API 한도(계정 5000/h) 초과로 배포센터 검사 403 → 해제 후 진행.
- 운영 read-back: v2.9.187, YUNA JS 운영본=main, 운영 화면에서 일정 문장 → 일정/12-12~12-13/종일, 저장 버튼 없음, 데이터 변경 없음.

## 4호 · v2.9.188 · PR210 (merge 0a12cae)

- 탑승: 목표 한 건 삭제 Preview/승인(`hani/goal-delete-followup-20261006` 72093bd). 기존 save() 경로, 실패 rollback, 목록 변경 시 중단.
- HINA 중복 ID 사전 대응: 등록/삭제 Preview의 취소·승인 버튼을 `goalRegistryActions(label)` 하나로 공유. HINA 1회 PASS.
- 격리 localhost 합성 데이터 검증: 취소 write 없음, 승인 1건만 제거, 체중 기록·다른 목표 보존, 중복 클릭 무시, 목록 변경 시 중단, BMI 등록 회귀 정상.
- 운영 read-back: v2.9.188, `hani-main.js` 운영본=main, 로그인 운영 화면에서 목표 이력 행마다 「삭제 Preview」 표시 → Preview 후 취소, 목표 이력 불변(실제 삭제하지 않음).

## 함께 정리

- v2.9.183 BMI 목표: 대표님이 저장. 저장 결과는 2026년 4분기 BMI 25(10/06~12/31)이며 대표님이 “그대로 둬”로 유지 결정.
- 원 탭 Playwright 테스트(`hani-goal-delete-test.js`, `hani-yuna-schedule-ui.test.mjs`)는 이 PC에 Playwright가 없어 실행하지 못했고, 같은 시나리오를 브라우저 창에서 수동 재현.
- 운영 페이지 최초 로드 때 `/hani-os/undefined` 404 1건이 관찰됨(v2.9.185 로드). 이번 변경과 무관해 보이며 원인 미조사.
- 탑승 대기 잔여: 분기 발표회의실·PPT·연간 뷰어(누락된 QA 탭) — 그 탭이 QA 미완료로 운영 반영 불가라고 기록.
