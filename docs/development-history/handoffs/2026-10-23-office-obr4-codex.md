# 작업 인수인계 — obr4 다온·윤슬 본사 착석

## 작업 식별

- 갱신: 2026-10-23 KST / 담당 도연(Codex), 브라우저·최종 열차 담당 서윤(Claude).
- 상태: 구현·지정 Node 검증 완료 / 최신 main 조정·실제 브라우저 검증 대기. branch `hani/release-train-20261023`, 시작/유지 HEAD `65cd8a071d657741319b54c063d1ba8c5ab6aefb`, main 기준 `4ac6b6c`(2.9.232). Git index.lock 권한 거절로 미커밋.
- 승인 근거: 사용자 obr4 명세. 본사 canon 등록·좌석, 행동 참여자, art 라벨·경로, 장소 선호·문구와 관련 검사·보고서만 수정.
- 경계: storage/Cloud/schema/migration, 버전/cache/HANI_DISPLAY_VERSION, mascot runtime, reviewed-release-baseline 수정 없음. push/PR/Notion/브라우저 실행 금지.
- 기존 tracked diff 없음. 기존 untracked artifacts 보존.
- 원격 main: git ls-remote 프록시 연결 실패. 로컬 origin/main은 4ac6b6c, index cache 2.9.232, 마지막 script hani-launch-greeting.js. 원격 최신성·운영 실제 로딩 미확인. merge/rebase 없음.
- CODEMAP living-office owner 확인. scheduler/등록 anchor 누락은 CODEMAP_MISS로 실제 eligible → seatMaps → createScheduler → snapshot → persistent actor/plannedRows를 확인.
- 계획: 무수정 전체 회귀 → 등록·착석·전원 행동/장소 정보 → 기존 안전 기준 유지 회귀·감사 → closure/승인 baseline 진단 → 보고서.
- 자료 누락: 관계 seed에는 두 사람 정보 없음. 취향 출처를 확인 요청했고 응답이 없어 승인된 232 도감의 업무 영역·성격·말투만 사용했다. hobbies는 창작하지 않고 affinityEvidence의 source/interests/quirks/voice로 출처 차이를 명시했다. seed 원본 불변.

## 결과와 증거

- 수정 전 회귀: 116개 중 110 PASS / 3 FAIL / 3 browser SKIP, `artifacts/office-behavior/obr4-baseline-tests.txt`. 명부 17/19 불일치와 오래된 safety/index baseline 2건을 확인했다.
- 실제 변경: canon 등록·rendererSeat.owner, 216/221 people·전원 행동·2F 미세 행동, art 예정 라벨·prop, 장소 선호/문구. 기존 projection을 2F 재직 인원 8명까지 표시하도록 조정. home/canon 좌표·326 anchor 유지, art 공용 junction_finance.y만 60.38→57로 조정해 새 보호 좌석과의 17.63px 진입 경로 충돌 및 97행 도달 회귀를 해결.
- 검증: 전체 명령 `powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1` → **120개 / 117 PASS / 0 FAIL / 3 browser SKIP (133.63초)**. 216 97행·208일, 120일 caps/cooldowns, 221 연속7일, lively v2, obr3 PASS. 첫 하루 355.90ms/400ms, warm 0.386ms/3ms. 한도 완화 없음.
- `node docs/drafts/office-behavior-redesign/audit.mjs .` → 54,000 snapshot, frozen/mismatch/stuckSeconds/near30/near24 0/0/0/0/0. `obr4-audit-final.txt`.
- `node --test --test-isolation=none scripts/hani-office-obr4.test.mjs` → 10 PASS(공통 engine6+신규4). 실제 232 JS+새 canon만 선행하는 VM 호환, 미수정 마스코트의 data-planned=false, 2F 8명 표시·plannedRows0 실행 확인.
- 보존: index/hani-main/마스코트/reviewed baseline/관계 seed diff0. canonical 원본 SHA를 고정해 명시 등록 delta 외 전체 구조 exact 비교. 운영 JS 신규 event/DOM/timer layer·storage/Cloud 경로 추가 없음.
- `node scripts/hani-office-obr4-report.mjs` → **closure 127/128, missing0**, 수정 전도127. 10/23 다온 정식3+카드26=29회, 윤슬 정식5+카드26=31회 외출. 기존 family.limits/rules exact, 120일 group97→96/노출94→94; 예산·쿨다운 기대값 변화 없음.
- 상세 파일·기대값·명령·수치·위험은 [report-obr4.md](../../../artifacts/office-behavior/report-obr4.md), `obr4-metrics.json`, `obr4-budget-comparison.json` 참조.
- 종료 시 원격 재검증: GitHub 연결 도구의 main **7a10595f2a0890e63cd04dbc95c057edbbd3d5b0**, 4ac6b6c 대비 #338 테스트·문서 1커밋/17파일. 운영 파일 변화 없음. 이번 206/219 테스트와 겹치므로 자동 merge/rebase하지 않았다. `obr4-main-drift.json`에 비교 근거 보존. 위 PASS는 지정65cd8a0 위 작업 트리이며 최신 main 결합 결과가 아니다.
- reviewed baseline 결과만 인계: 로컬 trainBase230/approved230, 원격7a10595는 trainBase231/approved231이며 232는 pending join 정규화. 최종232 승인 chain/버전 정리가 필요하다. 해당 파일은 수정하지 않았다. 219 index oracle도 현재232에 고정되어 최종 버전 증가 시 관련 검사 조정·재실행 필요.
- 로컬 작은 기능 커밋을 시도했지만 git add/commit 모두 `.git/worktrees/obr/index.lock` Permission denied로 실패. 새 커밋·push·PR 없음. 생성한 source/검사/보고를 미커밋으로 보존한다.
- Preview/실제 UI/Production: 미검증, 서윤 담당. Notion 미반영은 사용자 명시 금지.

## 다음 담당에게

- 다음 행동: 서윤이 원격7a10595의 겹치는206/219 테스트와 승인 baseline을 먼저 대조하고 통합 → 실제 브라우저 확인 → 마지막 열차 버전/승인 baseline 정리. 원격의 '본사17명 보존' 정규화는 이번 본사19명 착석과 함께 조정해야 한다.
- 남은 위험: Edge·390/1440 label/좌석·실제 이미지 decode·모바일 체감 미검증. 관계 seed의 두 사람 원문 부재, 기존 obr3 평일3인 동행 선택 요건 미해결. Candidate/서버 HINA/운영 read-back은 미실행. 함께 배포할 Edge Function/설정 없음.
- CURRENT/DECISIONS 공통 기록은 보존. 작업별 보고·인수인계만 갱신.
