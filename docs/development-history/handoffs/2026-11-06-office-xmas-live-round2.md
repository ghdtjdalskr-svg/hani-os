# 작업 식별

- 작업: 크리스마스 장식 2차 수정 / 2026-11-06 KST / Codex 단독 개발
- 상태: UI 수정·targeted 검증 완료 / 기존 테스트 실패 및 실행 차단 인계
- branch / worktree: `hani/office-xmas-live` / `xmas-live`
- base·HEAD: `f81f170cef43d02b9a269fa96024f3c204d54855`
- origin/main: `f753c66af9d2b6a7535924e8d237e8b1980ae67a` (GitHub connector 조회 일치, v2.9.268)
- 수정 범위: 기존 `hani-office-live.css` 레이어 순서, `hani-office-live.js` 선물·눈꽃 좌표, 작업별 검증 artifacts. CODEMAP living-office owner 확인, 최신 장식 앵커는 좁은 실제 검색으로 확인.
- 승인 근거: `../xmas-fix-task.md` 전체 UTF-8 정상 읽기. commit/push/merge/버전 증가 금지. atlas 77,544B 변경 금지. 기존 assertion 삭제·완화 금지.

# 결과와 증거

- 작업 전 파일 SHA256: `artifacts/office-xmas-live/round2-baseline.json`.
- 변경: `hani-office-live.css` 기존 actor host z-index 4·눈 CSS filter, `hani-office-live.js` 선물 `(520,443),48×36`·눈 `(1580,230),160×204` 두 행. atlas 77,544B 불변, 버전/캐시 불변.
- 최종 검증: 12월24일 20시·12시 KST × 1F·5F × 1280×900·390×844 화면 8종, 576 paint-order 검사·모션 감소·클릭 통과·모찌 라벨 비겹침 통과. JS syntax·정확한 patch 비교·보호 파일49개(기존 assertion 파일46개 포함) SHA256 일치. closure153/160·누락0.
- 전체 office46파일: 475통과·45실패·3skip, 시작 전 Git EPERM 6파일 별도. 실패45 중 Git EPERM12, pin/기존 기대값22, 기존 주민 동작/기대값11. pets-bubble 요청 파일 없음으로 MODULE_NOT_FOUND 차단.
- 수정 전 읽기 전용 재현: residents31통과18실패·props8통과3실패, 최종과 실패 이름 동일. xmas는 수정 전12통과1실패→최종11통과2실패(승인된 좌표의 literal pin 추가 불일치). 원래 assertion 수정/삭제/완화 없음.
- 최종 source SHA256: JS `DBC449E861D78F8ECFA7B05FDA83BF5B8C7FF811D86C2EFDE3320E7B78FE8E9B`, CSS `6DACE7444EF33A861C55883D240E763C6845873CB0285F4C7CED60CD936D437C`. 전체 테스트 results identity와 일치.
- 증거: `artifacts/office-xmas-live/REPORT2.md`, `ROUND2-TESTS.md`, `round2-summary.json`, `round2-source-check.json`, `round2-browser-check.json`, `round2-tests/`.
- 미검증: 로그인 운영 앱·전 시간대 실제 동행/방문·release gate·운영. 실제 owner/CSS/아트 harness 결과를 운영 완료로 보고하지 않음.
- 데이터·저장·Cloud·schema 변경 없음. main/Pages/운영 read-back 미수행.
- Notion 착수 기록 쓰기: 자동 승인 검토 `approval policy never` 거절. 갱신 대기: 기준 SHA·작업 범위·결과·다음 행동을 허브에 요약할 것.

# 다음 담당에게

- 먼저 읽을 파일: `artifacts/office-xmas-live/REPORT2.md`, `ROUND2-TESTS.md`.
- 다음 행동: 서윤이 기존 pin/기대값과 누락된 pets-bubble 테스트 위치를 검토. 이 작업의 원래 assertion은 그대로 보존.
- blocker: Git subprocess EPERM·요청 테스트 파일 없음·기존 pin/주민 기대값 실패. Notion 최종 요약 저장 대기(쓰기 자동 승인 거절). 기능 수정 범위 추가나 배포 승인은 받지 않음.
- commit/push/merge/버전 증가 없음. Preview PNG8종만 확인 가능한 로컬 결과이며 배포 열차 탑승이나 Production 완료 아님.
- 공통 CURRENT·DECISIONS 및 다른 담당 파일은 수정하지 않음.
