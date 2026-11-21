# tooling-300 · 300 출시 후 시험 층

2026-11-19 KST · 도연/Codex · `hani/tooling-300` / base `9f49286` · 구현·비교 완료, 서윤 인계(미커밋).

- **가져옴:** `git show origin/hani/queen-last-month:<path>`로 확인한 `1af6992`의 audit-1 source/preload/direct-input/test·delta 5파일과 기존 도구 6곳의 연결 1줄. `hani-board-library-build.mjs`는 보존.
- **새 층:** `scripts/hani-release-300-{source,preload,reviewed-input}.cjs`, `hani-release-300-direct-input.mjs`, `hani-release-300.test.mjs`, `fixtures/release-300-layer.json`. 순서 **300 version/history → audit-1 → 299 → 디자인2 → 이하**. 표시·캐시 60/1토큰과 연혁 맨 위 ‘점검 반영 1차’·299 commit 1881888 보완만 역변환. 기존 manifest·fixture는 무변경.
- **입력 연결:** 고정 300 원문일 때만 역사 비교를 고정 2220b61 범위로 맞춤. regression baseline import·legacy 시험 전용 연결·Node/서버 원문 일치 및 Ieum 최초 읽기 경계 보완. 운영 build/gate 진입은 이 legacy 어댑터 대상이 아님.

각 시험을 cwd=해당 폴더에서 `node scripts/<파일>`로 별도 순차 실행. Node v24.20.0, Windows PowerShell. 종료 0/비0과 Node 단언 누적은 별도 집계(단언 수 미출력 스크립트는 종료 코드만 기록).

| 대상 | 파일 수 (종료0/비0) | Node PASS/FAIL/SKIP |
|---|---|---|
| 출시 전 2220b61 | 274 (173/101) | 1549/59/10 |
| 작업본 | 276 (175/101) | 1573/59/10 |

**새 회귀 0, 누락·중복 0, script PASS 표식 138→138 유지. audit-1 14/14 · 새300 10/10 · JS syntax 18/18 · diff whitespace PASS.** [시험별 숫자](TEST-RESULTS.md) · [집계](test-summary.json) · [보존 증거](preservation.json).

기존 시험 301개·fixture 120개와 운영 파일 보존, 저장·Cloud write 경로 변경 0. raw runtime 174파일이 독립 배포300 Git 원문과 일치하고 하위 closure 173→173→173→172→172→171→168→164·누락0. 지정 JSON 4개는 시작 바이트로 복구. 버전 증가 N/A(시험 도구 전용).

**남은 위험:** 기존 실패·Git child-process EPERM·브라우저/필수 인자 제약은 남아 있음(전부 PASS 아님). 실제 브라우저·Preview·Production 미검증. 원격 최신성 조회는 네트워크 차단으로 실패하여 전달 기준 SHA에 한정. baseline의 외부 원본 이미지 참조는 동일 파일 복사로 환경을 맞춘 뒤 재검증. commit·push·배포·Notion 미실행(요청대로 서윤 담당). `local/`는 로그·기준선·생성 자료이므로 통째로 commit 제외.

## 보정

2026-11-19 KST · 도연/Codex · `hani/tooling-300` / base `9f49286`. 승인 근거: `../tooling300b-task.md`. 아래 결과가 위 1차 집계를 대체한다.

- 새 300 source/preload/test 3파일 보정, 불필요한 `hani-release-300-direct-input.mjs` 삭제. 관문 import 역변환을 제거하고 보호 원문·Node/서버 resolver 일치·세 가지 읽기 경로를 검증한다. CODEMAP_MISS로 실제 import 경로 확인.
- 전체 **276개**를 cwd=tool300에서 각 `node scripts/<파일>`로 순차 실행: **175 종료0 / 101 기존 비0**, Node **1574 PASS / 58 FAIL / 10 SKIP**. 원문·외부 이미지 동일성을 재확인한 2220b61 기존 274개 로그와 대조해 **기존 통과 파일의 새 실패 0**, 누락·중복 0, script PASS 표식 138 유지.
- **audit-1 14/14 · release-300 10/10 · runtime-closure-ilbo 3/3 · 변경 파일 syntax 3/3 · diff whitespace 통과.** 기존 실패인 history-unify(10/4→13/1), lounge-billboard(23/4→21/6)의 단언 변화(PASS/FAIL)는 지시대로 유지.
- 보호 목록·금지 디렉터리 포함 **17파일 main 원문 동일**, 기존 시험 **301개**·fixture **120개**와 audit-1·300 fixture/hash 보존. 지정 JSON **4개 시작 바이트 복구**. 이번 보정 외 착수 파일 변경 0, 저장·Cloud·운영 코드 변경 0, 버전 검증 N/A(개발 도구 전용).
- [보정 시험별 결과](CORRECTION-TEST-RESULTS.md) · [집계](correction-summary.json) · [보존 증거](correction-preservation.json). 전체 새 로그·복구 전 JSON·기준선 확인은 `local/correction/`에 보존(commit 제외).
- 원격 최신성은 연결 실패로 미확인. 실제 UI·Preview·Production 미검증(범위 밖). commit·push·배포·Notion 미실행. 다음 행동: 서윤이 보정 diff와 증거 확인. 보호 파일을 수정하는 1차 구축 스크립트는 실행하지 않음.
