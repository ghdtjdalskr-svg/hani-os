# tooling-302 · 출시 후 시험 층

## 작업 식별

- 2026-11-20 KST · 도연 / Codex 단일 Agent · 로컬 구현·검증 완료, 서윤 인계. `hani/tooling-302` @ `d748920f90dd200dddec2befd262fee0959047a0`; 비교 기준 `37ad7aac8d0e0a92d3a14154c19c2bb1f0c2ea10`.
- 승인: `../tooling302-task.md` UTF-8 전체 정상 확인. CODEMAP_MISS로 기존301/dark owner 경로 직접 분석. 원격 main 조회는 연결 실패; 로컬 HEAD/origin/main 일치. 실운영 최신성은 미확인.
- 새302 5파일: `scripts/hani-release-302-{source,preload,reviewed-input}.cjs`, `hani-release-302.test.mjs`, `fixtures/release-302-layer.json`. **302 version/history → dark-bundle → 301 → ieum-seat → 300 → audit-1 → 299 이하**.
- 표시·캐시60개/상수1개와 history 새302·301 provenance만 exact inverse. dark 런타임6파일은 실제302 Git·기존 fixture와 바이트 일치, fixture 수정0. 실제 main merge-base `d748920`은 owner15개가 모두 정확할 때만 `37ad7aa → 0558dc3`으로 투영. 실제 Git 원문/refs는 별도 raw 함수로 보존·검증.
- 복사된 dark 3파일만 연결 보완(source의302 preload, reviewed-input의302 history, fixture 변조 VM의 새 dependency mock). 기존301 import 및 모든 하위 시험·fixture·단언·숫자/hash 보존.

## 결과와 증거

| 전체 단독 실행 | 결과 |
|---|---|
| main37ad7aa 독립 Git 객체 복사본 | 280파일 / 종료0 171·실패 108·시간초과 1 / Node 1561 PASS·69 FAIL·10 SKIP |
| 현재 폴더 | 284파일 / 종료0 182·실패 101·시간초과 1 / Node 1606 PASS·57 FAIL·10 SKIP |

- 비교: 허용 예외 외 새 회귀 후보 0, 누락 0. 알려진 예외 1: **hani-context-remote.test.mjs 단독 실패**(옛 hex 디자인 단언). 이 파일은 원본 바이트 보존; preload 보조 결과로 단독 결과를 대체하지 않음.
- 오류 변화1건 검토: proactive-204의 같은 기존 실패 subtest(양쪽20 PASS/1 FAIL)는 버전 단언이 해결되어 다음 raw Git 호출의 EPERM까지 진행. 기능 회귀로 분류하지 않으며 Git diff 기반 후속 저장/Cloud 검사는 미검증 유지. 원문·실행 위치는 comparison.json의 errorSignatureReview에 보존.
- 명령: `& artifacts/tooling-302/local/run.ps1 -Phase baseline -TimeoutSeconds 180`, `-Phase current -TimeoutSeconds 180`; 각 cwd에서 `node scripts/<파일>` 한 파일씩 순차 실행. Windows PowerShell / Node v24.20.0. 전체 결과·실패 제목 비교는 [local/TEST-RESULTS.md](local/TEST-RESULTS.md), [local/comparison.json](local/comparison.json).

- 핵심: 새302 8/8, dark-bundle 9/9, 기존301 7/7·300 10/10·audit-1 14/14, ieum-seat 11/11, dark-fix 7/7·UI polish 3/3 PASS.

- 사무실 6회 재시도: **50 PASS·6 FAIL, 실패는 모두 기존 Git EPERM**. cafe/lively 400ms 단언4회·lively warm<3ms 2회 모두PASS. residents49/49·staff-chat17/17은 기준/현재 전체 실행 모두PASS. [local/performance.json](local/performance.json).
- 보존: 착수 2420파일 감사, 허용 범위 외 변경 0·누락 0; 기존 시험 309·fixture 125·보호 파일 32 보존. 지정 JSON4개 원본 SHA-256 확인, 추가 생성 출력도 원본 복원. 기준 복사본 2367파일 drift 0. [local/preservation.json](local/preservation.json).
- 시험이 만든 새 자료는 hash 확인 후 `local/generated/`, 덮어쓴 결과 원문은 `local/generated-overwrites/`에 보존. 큰 복사본·로그·증거는 모두 `artifacts/tooling-302/local/`에만 두고 새 `.gitignore`로 커밋 제외. 기존 root .gitignore 보존.
- 런타임·표시/cache·저장·Cloud·schema 변경0. 버전 증가 N/A(도구 전용). JS7파일 syntax·PowerShell 실행기 parser·입력8파일 hash/whitespace PASS(검증 시점 identity 유지).
- 공통180초 시간초과: `hani-office-bori-stroll.test.mjs` 1건. 미완료이므로 PASS로 처리하지 않음.
- 미검증: 기존 환경/의존성/Git·브라우저 실패와 180초 미완료 항목은 미해결. 전체 PASS 선언 없음. 실브라우저/Preview·Build·Candidate/One-Pass/HINA·main/Pages/Production 실제 JS·기능 read-back은 범위 밖, 미실행.

## 다음 담당에게

- 다음 한 가지 행동: 서윤이 실제 diff·이 보고서·local 실패 근거 확인 후 commit/push·Notion 담당. 본 작업은 **commit·push·merge·배포·Notion 실행0**, 서버 동반 배포 없음. CURRENT·DECISIONS·다른 담당 문서 보존.
