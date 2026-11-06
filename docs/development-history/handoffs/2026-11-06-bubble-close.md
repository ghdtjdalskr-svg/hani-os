# 오피스 말풍선 닫기 인수인계

## 작업 식별
- 담당: Codex / 2026-11-06 KST / 구현·targeted 검증 완료 / pin·차단 검사 남음
- branch: hani/cafe-barista / HEAD·base: 7c2acfd4b6e1bfa232ea23dd3e6565219772cd85
- origin/main 로컬 캐시: 813cedc5aaaa372d569d7d882a1d98cececc6b42 (base와 다름, 원격 최신성 미검증). merge/rebase 없음.
- 승인: ../bubble-close-task.md. 말풍선 owner JS/CSS·신규 테스트·증거만 수정. commit/push/merge/버전·Notion·assets/data 수정 금지.
- CODEMAP: living-office owner 확인, bubble anchor 없음(CODEMAP_MISS), 실제 symbol 좁은 검색 사용.
- 표시 버전: 2.9.263 유지. index 마지막 UI 부가 script: hani-launch-greeting.js. 실제 브라우저 로딩 미검증.

## 결과와 증거
- 최종 원인·변경·검증·미검증: artifacts/bubble-close/REPORT.md.
- 확대 CSS가 hidden을 덮는 문제를 실제 touch Edge로 재현·수정. 폰5초·PC3초(기존 자동4초), 단일 bubbleTimer 재사용.
- 신규17/17·실제폰/PC PASS. 전체44파일 시도, TAP459통과27실패(Git12·pin14·기존hash1), Git시작차단6·behavior미종료1.
- runtime JS/CSS, 신규 bubble-close test, 본 인수인계·artifacts만 변경. 보호 모델/함수 바이트·저장/Cloud·버전/cache 보존.
- 서윤 담당 pin/count와 차단 검사 재실행 필요. 독립 QA·릴리스 완료 아님.

## 다음 담당에게
- 테스트 assertion과 source pin은 완화하지 않음. Notion은 사용자 지시로 미수정.
