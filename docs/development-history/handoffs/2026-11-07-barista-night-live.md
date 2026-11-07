# 은하 야간 바리스타 Preview 인수인계

## 작업 식별

- 2026-11-07 KST · Codex · `hani/barista-night-live` · 이 worktree 한정.
- base/HEAD·조회 원격 main: `03b639bd9d7f9a460c7b2555bb795f41fabde565` (#442). pin 원본: v272 고정 `c338bdab8589676979f85e1a5626fca2af5b86d8`.
- 상태: 구현·PC/폰 화면 검증·office 전체 54파일 실행 완료, 재핀·차단 검사 및 아트·Preview 승인 대기.
- 범위: `hani-office-live.js/.css`, `assets/office-season/barista-night.webp`, 273 pin/테스트·기존 pin 연결. NORMAL 표시 패치.
- 승인: 11/7 교대 아이디어. 아트/배포 승인 아님. task 원문 `../barista-night-live-task.md`; commit/push/merge/version bump/Notion/data 편집 금지 준수.

## 결과와 증거

- 이슬 07–19시 / 은하 19–07시(KST). 19–02시 미소, 02–07시 졸음, 탭하면 3초 커피. 기존 말풍선 timer·닫기 owner 재사용; 폰의 5초 말풍선은 보존.
- map의 기존 prop layer 바로 앞 persistent span 1개. 원본 (1500,610) 120×110, 3프레임 불투명 atlas byte-exact 34,896B. props/배우/라벨/말풍선 층위·hitbox 보존.
- 교대·경계·tap·닫기·loading/fallback·단일 생성·reduced motion·무쓰기 검사 통과. 상세 결과는 [REPORT](../../../artifacts/barista-night-live/REPORT.md)와 [로그](../../../artifacts/barista-night-live/test-results.json).
- Edge 실제 office owner/CSS/art 격리 harness: 1280×900·390×844, 12:00/21:00/03:00 6장 + 깨우기 2장, page error·overflow·storage write 0. 전체 앱 로그인/운영 QA는 아님.
- staff/펫 모델 원문 동일. `data/`14개 포함 보호26파일 원문 동일. storage/Cloud/schema write·새 timer loop·event listener 없음. 도움봇 사무실 안내에 바리스타 언급 없어 미수정.
- 273 → 272 → 269 → 268 엄격한 literal-pair/full-hash 복원. 기존 기대값/거절 assertion 보존. 273은 pin 명칭이며 실제 표시·cache는 v2.9.272 유지.
- fixed272 JS/CSS/index/main의 GitHub blob SHA-1 및 로컬 SHA-256 일치: [근거](../../../artifacts/barista-night-live/fixed-release-evidence.json).
- 전체54명령:27성공·27비정상, 최종551 PASS/32 FAIL/3 SKIP + 시작차단6. Git 차단24건·G/주민 재핀14건. 원래 로그 보존, pets 생성 횟수 보존2항목만 strict273 복원 후 targeted 2/2 PASS.
- Git subprocess `spawnSync git EPERM`은 BLOCKED. 219의 알려진 contrast 실패는 그 앞 Git 차단으로 이번 재현 불가.
- main/Pages/Production read-back·package/Candidate/HINA·독립 Arin 리뷰: 미실행. commit/push/merge/배포 없음.

## 다음 담당에게

- 서윤: G/tlayout·residents-source 계층을 새 outer273 기준으로 재핀 후 관련 실패 재실행. 구체 실패명/전체 결과는 REPORT와 JSON 참조. 기존 assertion 삭제·완화 없음.
- Git 허용 환경에서 차단 검사 재실행. 다음 성민 대표님 결정은 아트·Preview 확인. 이후 배포 담당이 열차 통합·정식 Candidate gate 진행.
- 공통 CURRENT/DECISIONS와 다른 담당 기록은 수정하지 않음. Notion은 작업별 명시 금지로 편집하지 않음. 서버 Edge Function/설정 동반 배포 없음.
