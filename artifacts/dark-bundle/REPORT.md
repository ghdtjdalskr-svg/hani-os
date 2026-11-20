# 다크 묶음 시험 층

- 도연 / Codex 단일 Agent · 2026-11-20 11:45 KST. 허용 범위 구현·검증·복원 완료. **원본 단독 실행 연결 제약1건 남음.**
- branch `hani/theme-dark-bundle` / HEAD `d7231cda04f409d4e1cb9d0b4dd9255fd3cc019f` / 기준 main `37ad7aac8d0e0a92d3a14154c19c2bb1f0c2ea10`. 종료 identity 동일. 원격 조회는 연결 실패로 미확인.
- 승인 근거: `../darkbundle2-task.md` UTF-8 전체 정상 확인. commit·push·merge·배포·Notion 미실행(서윤 담당). 버전 증가 N/A, 서버 동반 배포 없음.
- 신규: `scripts/hani-dark-bundle-source.cjs`, `scripts/hani-dark-bundle-preload.cjs`, `scripts/hani-dark-bundle-reviewed-input.cjs`, `scripts/hani-dark-bundle-layer.test.mjs`, `scripts/fixtures/dark-bundle-layer.json`.
- 기존301 source/reviewed-input의 최외곽 import 각1줄만 변경. 순서 **dark-bundle → 301 version/history → ieum-seat → 300 → audit-1 → 299 이하**. CODEMAP_MISS로 기존 층 직접 분석, codemap 보존.

| 개별 실행 | 파일 | 종료0 | 실패 | 90초 시간초과 | Node PASS / FAIL / SKIP |
|---|---:|---:|---:|---:|---:|
| 고정 main37ad7aa Git 객체 복사본 | 280 | 167 | 109 | 4 | 1487 / 70 / 10 |
| 현재 폴더 | 283 | 178 | 101 | 4 | 1525 / 57 / 10 |

- 각 cwd에서 `node scripts/<파일>`로 전부 순차 실행. 시간초과의 부분 단언은 합계 제외. 새 층9/9·기존 다크7/7·UI polish3/3 PASS. Git 원문·정/역변환·변조 거부·fs·history·closure 검증 포함.
- **원본 단독 실행 새 실패1건:** `hani-context-remote.test.mjs`는 층 import가 없어 기존 hex 토큰 단언과 새 토큰이 충돌. 지시§2 “기존 시험·단언·hash·fixture 수정 금지”에 따라 원본 보존. 예외 질의에 회신이 없어 외부 preload로 추가 실행했고 **종료0/PASS**. 원본 전체 실행 숫자는 보정하지 않음. 그 외 새 회귀0·누락0.
- 외부 실행: cwd=저장소, `NODE_OPTIONS=--require ./scripts/hani-dark-bundle-preload.cjs` 환경에서 `node scripts/hani-context-remote.test.mjs`. 기본 단독 실행의 연결에는 이 실행 환경 채택 또는 원본 import1줄의 예외 승인이 필요함.
- 성능 재시험: cafe-rest·companion-homes·lively-v2·residents를 기준/현재 각각2회, 총16회(180초 제한). residents4회 모두49/49 PASS. 나머지12회는 기존 Git EPERM1건씩 동일. cafe/lively의 400ms 단언8회 모두PASS, 새 성능 회귀0. staff-chat은 최초 양쪽17/17 PASS.
- 다크 묶음 자체 수정 **없음**. 런타임·버전/cache·저장·localStorage·Cloud/schema 변경0.
- 보존: 초기2508파일 중 허용 import2곳 외 변경·누락0. 기존시험282·fixture124·보호 경로 원문 보존. 지정JSON4개와 추가 시험 결과 원본 복원. 기준 복사본1788파일 및 역변환6파일의 raw Buffer가 실제 main37 Git bytes와 동일. JS syntax6·git diff --check PASS.
- 남은 위험: preload 없는 원본 단독 실행1건, 기존 Git/브라우저·의존성 실패. bori-stroll·kids-weekday·obr14는 양쪽90초 미완료로 미검증. 실브라우저·Preview·Build·Candidate/HINA·Production 미실행. 전체 PASS/배포 완료로 선언하지 않음.
- 증거: `local/comparison.json`, `performance-summary.json`, `remote-external-results.json`, `preservation.json`, `preservation-check.json`, `baseline-preservation.json` 및 개별 로그. 큰 임시 자료는 모두 `local/`에 보존, `local/.gitignore`로 커밋 제외.
- 다음: 서윤이 실제 diff와 단독 시험 연결 방식을 검토. 신규5파일·진입 import2곳·이 보고서가 인계 범위이며 commit/push·Notion·배포는 본 작업에서 수행하지 않음.

## 2차 보정

- 도연 / Codex 단일 Agent · 2026-11-20 KST. `../darkbundle3-task.md` UTF-8 전체 한글 정상 확인. branch `hani/theme-dark-bundle` / HEAD `d7231cd` / 기준 main `37ad7aa` 유지. 원격 최신성은 연결 실패로 미확인.
- 새 `hani-dark-bundle-reviewed-input.cjs`에서 정확한 owner 15개 검증을 유지하고 공용 객체의 `merge-base HEAD origin/main` 직접 호출도 `37ad7aa → 0558dc3`으로 보정. 실제 Git 읽기는 `rawReadOnly`로 보존하고, 새 층 시험에서 실제 merge-base와 보정값을 각각 검증. 이번 코드 변경은 신규 층 2파일뿐이며 기존 301 import 2곳은 전달 상태 그대로.
- **301 단독 7/7, 새 층 9/9, 직접 호출·변조 거부 56조건 PASS.** 기존 시험·fixture·hash 수정0. syntax·`git diff --check` PASS.
- **283개 전부 cwd=현재 폴더에서 `node scripts/<파일>` 단독 순차 실행**(각 180초 한도): 종료 성공181 / 실패101 / 시간초과1, 완료된 Node 단언 1598 PASS·57 FAIL·10 SKIP. tool301의 보관 단독 결과와 대조하고, 종전 시간초과였던 obr14는 main37 Git 원문 복사본에서 새로 단독 실행해 동일한 4 PASS·1 FAIL(Git EPERM)을 확인. 전체 기준을 새로 실행한 결과로 표기하지 않음.
- **허용 예외 외 새 회귀0·누락0.** `hani-context-remote.test.mjs` 원본은 바이트 그대로 보존하고, 옛 리모컨 디자인 단언으로 인한 단독 실패1건을 서윤 결정에 따른 알려진 예외로 기록. 외부 preload 결과로 기본 단독 결과를 대체하지 않음.
- 사무실 cafe-rest·companion-homes·lively-v2 각각2회 재시도(총6회): 50 PASS·6 FAIL, 실패는 모두 기준과 같은 Git EPERM 1건씩. 400ms 성능 단언4회 모두 PASS. 전체 실행의 residents49/49·staff-chat17/17·kids-weekday19/19 PASS. bori-stroll은 180초 시간초과로 미검증 유지. 기존 환경 실패가 남아 전체 PASS로 선언하지 않음.
- 착수2519파일 감사: 기존 시험282/282·fixture125/125·보호 파일32/32 보존, 허용 범위 밖 변경·누락0. 지정 JSON4개와 추가 시험 결과7개를 원본대로 복원하고 SHA-256 재확인. 런타임·버전/cache·저장·Cloud/schema 변경0. 버전 검사는 도구 전용 N/A.
- 근거: `local/round2/comparison.json`, `performance.json`, `direct-bridge.json`, `preservation-restored.json`, `preservation-check.json`, `baseline-evidence.json`; 전체 실행 로그·결과는 `local/round2-*-logs/`, `local/round2-*-results.json`. 큰 임시 자료는 모두 `artifacts/dark-bundle/local/`에만 보존.
- commit·push·merge·배포·Notion 미실행(명시 금지). UI/Preview·Build·Candidate/HINA·Production 미실행. 다음: 서윤이 신규 층 2파일 diff와 이 결과를 검토.
