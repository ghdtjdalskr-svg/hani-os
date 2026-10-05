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

## 함께 정리

- v2.9.183 BMI·체지방률 목표(PR198): 운영 화면 확인은 v2.9.185 복구 이후 가능. 대표님 실제 저장·이력 read-back은 아직 대기.
- 운영 페이지 최초 로드 때 `/hani-os/undefined` 404 1건이 관찰됨(v2.9.185 로드). 이번 변경과 무관해 보이며 원인 미조사.
- 탑승 대기 잔여: 분기 발표회의실·PPT·연간 뷰어(누락된 QA 탭) — 그 탭이 QA 미완료로 운영 반영 불가라고 기록.
