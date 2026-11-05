# qa-b13b · 반려동물 변경 후 fixture 복원 경로

## 작업 식별

- 갱신일(KST): 2026-11-05 / 담당: Codex 단독 / 상태: 구현·지정 검사 완료, Git 환경 차단 6건 미검증 / 미커밋.
- 저장소 / branch / worktree: hani-os / 사용자 지정 `hani/pets-affection` / qa-b13.
- base SHA: 사용자 지정 `c301a13` (기존 인수인계 전체 SHA `c301a1391f06eb636cb369e43bba7260c883bc04`). Git 금지로 원격 최신성 재확인 없음.
- 승인 근거: `../qa-b13b-task.md` 전체 UTF-8 읽기·실행 지시. 한글 정상. fixture/loader 수정과 지정 테스트 실행만 수행. Git·commit·push·런타임 파일 수정 금지.
- 목표: 모든 residents 복원 호출자의 순서를 통일하고 strict guard·역사적 delta·사용자가 갱신한 scene pin 유지.
- 변경: `scripts/hani-office-residents-source.mjs` 및 중복 조합이 있는 residents/icons/consult/obr8/obr15/obr21 테스트의 import·wrapper. `scripts/hani-mascots-poster.test.mjs`에는 비교용 scene의 tlayout 재적용 import·transform만 수정. 사용자의 scene pin은 원문 그대로 보존.
- Scoped discovery: CODEMAP living-office owner 확인. 최신 fixture anchor는 CODEMAP_MISS이며 지정 파일과 호출자 검색으로 fallback. START-HERE·CURRENT·pets-affection 인수인계 확인.

## 결과와 증거

- 원인: 포스터는 현재 전체 source(d6aeea8e…)를 residents delta(입력 2d79f463…)에 직접 전달. 다른 호출자는 tlayout 복원 후 residents 복원. labels는 그 뒤 역사적 delta를 적용하는 별도 경로로 유지.
- 공통 helper에서 `tlayout → residents` 순서로 복원하며 모든 소비자의 중복 wrapper 제거. labels는 이어서 기존 delta를 적용하는 경로 그대로 유지.
- 정확한 복원 hash: `d6aeea8e… → 2d79f463… → 672b4fa6… → 406937ae…`. 기존 fixture의 after/before SHA가 모두 맞으므로 delta 수정 없음. 원래 residents guard 본문·고정 pin은 byte 동일.
- 비교용 실행 scene은 기존 residents 테스트처럼 복원 후 tlayout만 재적용해야 현재 공간 설정에서 직원·방문객 계획을 비교할 수 있다. 포스터도 동일하게 재적용하며 scheduling assertion 유지.
- 사용자 scene pin `87f000063cef143edcc6350bb469b65a1283e5e5d0cfa0925183e5aba5c2b25d`은 실제 source에서 `/* Read-only Living Office.` 앞부분의 SHA256과 정확히 일치. 변경 없음(추가 import로 기존 270행은 271행으로 이동).
- 수정 전 포스터 **21통과·1실패**(사용자 지적 hash 불일치) 재현. 1차 수정 후 hash 검사를 지나 tlayout이 제거된 비교 scene의 outing 차이를 발견했고, 위 재적용으로 해결. 최종 포스터 **22통과·0실패**.
- 최종 지정12파일 **175통과·6실패·0skip**, 명령7성공·5실패. 실패6건은 모두 기존 Git 기준 소스를 읽는 `spawnSync git EPERM`이며 guard나 검사를 건너뛰지 않음. 전체 PASS 아님.
- `node --check` 변경한 JS8파일 **8통과·0실패**. 별도 검증에서 source 변조·추가 개행·잘못된 중간 단계 입력4건 전부 거부, runtime/CSS/index/main·delta3개 총7파일 byte 보존 확인. 테스트의 모든 기존 assertion과 원래 줄의 EOL은 유지.
- 증거: `artifacts/qa-b13b-fixture-restore/tests-summary.json`, `verification.json`, `before-mascots-poster.log`, `final-*.log`, 시작 hash/검사 소스 snapshot. `node artifacts/qa-b13b-fixture-restore/verify.mjs`로 보존·pin·guard·최종 결과 집계 재확인 가능. 로그는 PowerShell UTF-16LE, 문서/JSON/소스는 UTF-8.
- 보존 검증 첫 실행에서 새 import 삽입 개행이 기존 LF와 달라 실패한 것을 발견하여 기존 LF로 바로잡고 재검증 PASS. syntax8/8 및 최종 보존 검증 결과만 유효 근거로 사용.
- 런타임·CSS·index·main 및 delta·포스터 파일의 시작 hash 보존 기록.
- 미검증: 브라우저·원격 최신성·Production. 개발도구 전용이라 runtime 버전 증가·Full Build·One-Pass·HINA·배포 N/A.
- 데이터·LocalStorage·Cloud·schema·migration·서버 영향 없음.
- PR / Preview / main / Pages / 운영 read-back: 수행하지 않음.

## 다음 담당에게

- 먼저 읽을 파일: 이 문서, `scripts/hani-office-residents-source.mjs`, 기존 pets-affection 인수인계.
- 다음 행동: Git 실행이 허용되는 환경에서 차단6건 재실행 후 기존 pets-affection Preview·열차 절차를 담당자가 이어 진행. 이 후속은 runtime 변경 없음.
- blocker: Notion 착수 쓰기는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 미완료. Git subprocess가 필요한 기존 검사는 환경 차단 가능.
- CURRENT / DECISIONS: 과거·타 담당 기록 보존.

## Notion 갱신 대기

2026-11-05 KST / Codex / qa-b13b fixture 복원 경로 통일 완료 / hani/pets-affection / base c301a13(사용자 지정, 원격 최신성 미검증). 공통 helper에서 tlayout → residents 복원, 중복 wrapper 제거, 포스터 비교 scene에는 현재 tlayout 재적용. 기존 guard·역사적 delta·runtime·버전/cache·사용자 scene pin 보존. 포스터21/1→22/0, 지정12파일175통과6실패0skip(모두 기존 Git EPERM), syntax8/0·변조입력4건거부·보존7파일 PASS. 변경은 helper1·테스트7 및 이 후속 문서/증거뿐. Git·commit·push·merge·배포 없음. 브라우저/운영 미검증. 다음 허용 환경에서 차단6건 재실행, 기존 pets Preview·열차 절차. Notion 쓰기는 자동 승인 검토가 approval policy never로 거절, 저장/read-back 미완료. 원문은 이 인수인계 및 artifacts/qa-b13b-fixture-restore/tests-summary.json·verification.json.

## 테스트 상세

공통 명령: `node --test --test-reporter=tap --test-isolation=none --test-force-exit --test-timeout=60000 scripts/hani-<suite>.test.mjs`. Node `v24.20.0`, 원격/브라우저 없이 로컬 실행. 아래 수치는 import된 공통 테스트를 포함하는 각 파일의 Node 결과다.

| suite | 통과 | 실패 | 실패 사유 |
|---|---:|---:|---|
| mascots-poster | 22 | 0 | — |
| office-residents | 39 | 0 | — |
| office-icons | 14 | 1 | Git EPERM |
| office-tlayout | 13 | 0 | — |
| office-labels-qa | 17 | 0 | — |
| office-top-labels | 7 | 0 | — |
| office-obr8 | 2 | 1 | Git EPERM |
| office-obr15 | 13 | 1 | Git EPERM |
| office-obr21 | 4 | 2 | Git EPERM |
| office-consult | 19 | 1 | Git EPERM |
| office-chairman-234 | 6 | 0 | — |
| office-crowded-labels | 19 | 0 | — |
| 합계 | **175** | **6** | skip 0 |
