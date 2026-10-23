# 작업 인수인계 — obr2 살아 있는 사무실

## 작업 식별

- 갱신 시각(KST): 2026-10-23
- 담당: 도연(Codex), 검토·브라우저·Notion 담당: 서윤(Claude)
- 상태: 자동 검증 완료 / 서윤 UI·요건 해석 검토 대기 / 미커밋
- branch / worktree: `hani/office-behavior-redesign` / `HANI_OS_DEV_CLAUDE/obr`
- base SHA: `dae2a419166c0ca9cfee9c57aa128f451f972601`; 비교 운영 기준 `ad3c2f3`
- 원격 main: `git ls-remote origin refs/heads/main` 네트워크 연결 실패. 로컬 origin/main `ad3c2f3`, 표시 2.9.230, 마지막 UI JS `hani-launch-greeting.js` (그 앞 `hani-ai-budget.js?v=2.9.230`). 최신 원격·운영 runtime 미확인.
- 범위: 기존 scheduler/reserve/blockPlan, 장소 seed, 행동 대조·템포 검사, 실제 시계 녹화 도구. CODEMAP living-office owner 확인; scheduler anchor 없음 → CODEMAP_MISS로 실제 함수 검색.
- 승인 근거: 사용자 obr2 명세. 저장소·Cloud 쓰기, spatial-contract, 버전·cache·index·mascot 수정 금지. push/PR/Notion/브라우저 실행 금지. 로컬 작은 커밋만 허용.

## 결과와 증거

- 계획: 하루 외출 예약으로 블록 잘림 제거 → seed 근거 affinity/개별 문구 → atomic 동행 → 대조표·수치·회귀 → 녹화 스크립트 작성.
- 실행한 검증: 최종 `scripts/hani-office-behavior-run-tests.ps1` 111 tests / 108 PASS / 0 FAIL / 3 SKIP(명시적 브라우저 검사). 원문 `artifacts/office-behavior/obr2-final.txt`.
- 구현: 하루 외출 장부(30초·10분 경계 제한 제거), 데이터 affinity/atByPerson, 관계 score 기반 2–3인 atomic 후보, 실제 shared-resource FIFO, 정식+새 외출의 공통 층 상한, 최소 체류·재방문 금지·10분 쿨다운·자정 완충 구간, sparse-floor cadence 위상 보정, 10.8초 책상 문구+중간 자세 변화.
- 정식 경로: scene-coffee-menu의 상대 좌석 근접 원인을 입장·복귀 경로 의존 순서로 해결. 정지 20px / 이동 24px 및 연속 swept 검사 유지. 216의 97행은 208일 이내 도달, 테스트 상한도 208로 강화.
- 감사: 54,000시각 frozen/mismatch/stuck/near30/near24 전부 0. 원문 `artifacts/office-behavior/obr2-audit-verified.txt`.
- 최종 분리 측정: 첫 하루 계획 393.20ms / 웜 snapshot 평균 0.322ms. 근무자 16인 평균 외출 간격 25.65–45.55분, 장소 최소 5종·문구 최소 35종, 평일 동행 10회. 정식+새 외출 합산 층 상한과 162개 근무 창의 외출 하한 통과.
- 대조: 3일 합산 소실 0 / 날짜별 미노출 5. 정식 카탈로그의 기존 짧은 수행 시간은 유지, 카드 외출/방문객에 최소 체류 적용. 실제 3인 채택은 미관측. 이 세 해석·완료 범위는 아래 및 최종 보고서에 명시.
- 상세 수치·선호 표·동행 표·전체 행동 대조·기대값 변경·미검증: [최종 보고서](../../../artifacts/office-behavior/report-obr2.md), [행동 대조표](../../../artifacts/office-behavior/character-actions.md).
- 실행 환경: Windows / Node v24.20.0, 실제 owner VM+DOM doubles. Node child spawn EPERM 때문에 공식 `--test-isolation=none` 사용. 실제 브라우저 PASS를 의미하지 않음.
- 변경 파일 identity: `artifacts/office-behavior/obr2-verified-files.json`. 본사 runtime은 기존 파일 하나, 장소 데이터 및 개발 도구/검사만 변경. actor DOM/CSS/renderer layer 추가 없음.
- 브라우저: 미실행(사용자 지시), 서윤 실행 예정.
- 데이터·저장소·Cloud·schema 영향: 없음, scene 전용 메모리와 정적 장소 메타데이터만. 보호 저장소/owner/version/cache Self-Protection PASS. `index.html`, `hani-desk-mascots.js`, `spatial-contract.json` diff 0. 공간 계약 326 / SHA d02426b44c49db169efebd782e110226fd1d719d016bc5912516753f3df8841d 유지.
- commit: git add/commit 모두 `.git/worktrees/obr/index.lock: Permission denied`. 명세대로 미커밋 보존. push/PR 없음.
- main / Pages / Production read-back: 미수행, 배포 담당 범위.

## 다음 담당에게

- 먼저 읽을 파일: 최종 보고서·character-actions.md → hani-office-live.js의 reserve/floorCapacity/blockPlan/render → 장소 JSON.
- 다음 행동: 서윤이 실제 시계 6분 before/after 녹화·UI 리뷰. `scripts/hani-office-lively-record.browser.mjs --ref ad3c2f3 --floor 3f --label before`, 현재 작업은 `--ref` 없이 `--label after`. 기본 경로가 다르면 `--playwright`와 `--chrome` 지정.
- 남은 판단: 3일 합산 소실과 날짜별 미노출 차이의 구별, 카드 최소 체류를 원래 정식 카탈로그의 짧은 수행에도 확대할지, 실제 채택 미관측인 3인 외출을 필수로 할지. 보고서에서 미달/미검증을 숨기지 않음.
- 실제 2인 근거: 추가 7개 평일의 커피/소파/회의실/테라스 조합 및 2026-10-21 14:30 서윤+유리 소파 코드 리뷰 팁. `obr2-group-week.json`. 3인 atomic 후보는 구현됐으나 70일 탐색에서 채택 0, 실제 연출 완료로 보고하지 않음.
- 함께 배포할 Edge Function/서버 설정: 없음. office-places.json은 기존 시드 PR 순서에 함께 싣고 배포 담당이 버전·cache·Candidate gate를 수행. 이 탭의 data 변경은 생활 데이터 migration이 아님.
- Notion: 사용자 지시로 호출하지 않음, 서윤 담당.
- CURRENT / DECISIONS: 공통 과거 기록 보존. 작업별 결과만 이 파일에 기록.
