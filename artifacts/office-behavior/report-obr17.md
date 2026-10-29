# obr17 · 235 후속 / persistent 쌍 속성 및 readiness

2026-10-30 KST · 도연(Codex) 단독. branch `hani/train235-fix`, base `64a8ae40a79710c73001c0509e497f92825f676a` = 로컬 `origin/hani/office-235-lively-labels`.

**구현·지정 Node 검증 완료 / 서윤 Edge 재실행 대기.** 최초 성능 실패와 수정 전 재현 FAIL도 보존했다. main/Pages/운영 반영 완료가 아니다.

## 착수 / 승인 범위

성민 대표님 후속 지시: 기존 office owner의 쌍 속성 갱신과 browser readiness helper를 최소 수정하고 Node 재현·회귀·감사·성능 확인. JS와 scripts 테스트/fixture 및 이 보고서/증거만 변경. 기존 helper 미커밋 수정과 서윤 browser 결과·PNG 보존. CSS 변경 불필요 시 유지.

원격 main 조회는 프록시 127.0.0.1 연결 실패로 최신성 미확인. 로컬 origin/main 캐시 `d6a88bc52406d93b92fd16641c4750ba3b35141c`. 로컬 표시 상수 `2.9.234`, index 마지막 JS `hani-launch-greeting.js` 확인; 실제 운영 로딩 확인은 아님. merge/rebase 없음. CODEMAP living-office owner JS/CSS 확인, updateBuilding/쌍 속성 anchor 부재는 CODEMAP_MISS로 실제 경로 검색.

금지 보존: 브라우저 실행, push/PR/main/배포/Notion, Storage/Cloud/보호 저장키·버전/cache 변경, 새 runtime/layer/timer 없음. 계획: 수정 전 Node FAIL 근거 → owner 최소 수정 → 승인 baseline pending after만 반영 → 지정 Node 전부 → 로컬 commit 시도 → 서윤 Edge 인계.

## 결과와 증거 — 실제 원인

원인은 **(b) 다른 층으로 돌아간 직원의 hidden persistent slot 속성 잔존**이다. scheduler가 보고 partner를 남기는 (a)나, entries에 포함된 직원의 floor click 경로가 partner를 빼먹는 (c)가 아니다.

- 원본 `64a8ae4`의 `hani-office-live.js:1766`은 모든 actor를 숨기면서 called만 초기화했다. `:1767` 이후 현재 층 entries만 갱신하고 `:1773`에서 partner/greeting/facing을 썼다. 따라서 absent snapshot에서 원래 층으로 돌아간 직원은 해당 update loop에서 빠져 이전 속성을 유지했다.
- obr15와 같은 첫 cross-floor report는 **서윤(seoyun), 09:21:31.113 KST (seconds 33691.113507497634)**. present snapshot에서 4F 보고 → 같은 시각 absent snapshot에서 3F, `deskPartner` 없음, chairman entry 없음. 수정 전 실제 owner DOM에서는 서윤 actor가 hidden인데 `partner='seongmin'`, `facing='right'`였다. [수정 전 FAIL](obr17-before.log) / [수정 후 PASS](obr17-after.log).
- 수정 전 테스트 fixture 준비 과정에서 첫 presence를 보고 시각에 잡으면 기존의 늦은 도착 gate가 보고를 취소했다. **obr15처럼 09:00 도착을 먼저 확립한 뒤** 재현했다. 원래 gate는 유지하며, absent 후 보고 시각에 재입장하면 취소되는 것과 09:00부터 다시 진행하면 보고 쌍이 복원되는 것도 확인했다.

## diff 요약

- `hani-office-live.js:1755–1757`: 기존 updateBuilding에서 현재 표시 entries를 Map으로 만들고 **모든 persistent actor의 partner/greeting/facing을 매 update에 덮어쓴다**. entries에 없으면 `'' / 'false' / ''`. layoutKey early return(`:1759`)보다 먼저 수행하여 캐시 경로도 적용한다. 기존 entries loop 안의 중복 assignment 한 줄을 옮겼으며 새 handler/renderer/timer/runtime은 없다. CSS 변경 없음.
- `scripts/hani-office-label-browser-ready.mjs:17`: suffix 비교 대신 `status.dataset.full === (data-emoji가 있으면 emoji+' ', 없으면 '') + data-line` 정확 비교. 임의 접두사/틀린 아이콘/중복 공백/오래된 문구를 허용하지 않는다. sprite/art/font/mascot/placement 준비 조건과 노출률·겹침 기준은 유지했다.
- 아이콘 출처: 실제 경로는 `hani-office-live.js:1363`의 `assets/data/office-actions-221.json` 내 `action.actorOverrides[id].emoji || action.performance.emoji` → `:1777`의 actor.dataset.emoji(기본 work·selected는 빈 값) → `:1780`의 label 호출 → `:1569–1571`의 status.dataset.full이다. 질문의 `bubble()` 아이콘 목록은 `:218`의 zone별 desk💻/lounge☕/meeting📑/reception👋/server🖥이며, 현재 updateBuilding 상태 문구의 호출 경로가 아니다. 💭 등은 action catalog에서 온다. helper는 **obr14·obr15 browser 두 개**가 공유한다.
- `scripts/hani-office-obr17.test.mjs`: 같은 시각 present→absent, 보고 종료 후 시간 역행, 재입장 gate, 층 전환/hidden 쌍 속성, cached timer 갱신, 인사 종료, persistent identity·timer2개, catalog emoji 전부와 잘못된 readiness 값 검증. DOM double이며 화면 픽셀 검사가 아니다.
- `scripts/hani-office-obr17-compare-metrics.mjs`: 최초 성능 실패 진단용 기준본/수정본 동일 입력 비교. 정식 metrics gate와 임계값을 대체하거나 변경하지 않는다. 아래 source export가 비교 입력이며 실행 중 runtime 파일을 바꾸지 않는다.
- `scripts/fixtures/office-lively-labels-235.json`: 명시적으로 승인된 235 pending JS after/해시와 설명만 갱신. 234 before·CSS before/after·기존 chain·immutable ledger/snapshot oracle은 유지했다.

## Node 검증

환경: Node v24.20.0, PowerShell. historical Git export 202개 준비 후 `NODE_OPTIONS='--require ./scripts/hani-office-234-git-preload.cjs'` 사용. read-only Git export이며 원본 기대값 변경 없음.

|검사|결과|증거|
|---|---|---|
|obr17 전용3 + import engine6|수정 전 6 PASS / 3 FAIL → 수정 후 **9 PASS / 0 FAIL**|[before](obr17-before.log), [after](obr17-after.log)|
|obr16 전용6 + import engine6|**12 PASS / 0 FAIL**|[로그](obr17-obr16.log)|
|office/building 파일별 전체 Node|**28파일 / 253 executions = 250 PASS / 0 FAIL / 3 SKIP** (browser 미실행). import engine 중복 포함|[로그](obr17-regression.log), [파일별 결과](obr17-results.json)|
|reviewed release baseline|**14 PASS / 0 FAIL**; 누락/변형/중복/이동/EOL 부정검사 유지|[로그](obr17-approved.log)|
|audit absent|54,000 snapshot, frozen/mismatch/stuckSeconds/near30/near24 **모두 0**|[로그](obr17-audit-absent.log)|
|audit --chairman|54,000 snapshot, frozen/mismatch/stuckSeconds/near30/near24 **모두 0**|[로그](obr17-audit-present.log)|
|obr16 metrics 최종|best 부재 **328.983ms** / 재실 **354.948ms**, warm 최대 부재 **0.993ms** / 재실 **1.687ms** — best<400 / warm<3 **PASS**|[로그](obr17-metrics-final.log), [원표](obr17-metrics-final.json)|

최초 정식 metrics는 부재 best387.900ms PASS, 재실 best437.517ms FAIL였다(warm 모두 PASS). [최초 실패 원표](obr17-metrics-first-fail.json)와 [실패 로그](obr17-metrics-first-fail.log)를 보존했다. 실패 원인을 확인하기 위해 기준본/수정본을 같은 입력으로 번갈아 독립 프로세스3회씩 측정했다: 기준본 재실 cold371.852/384.456/347.814ms, 수정본361.531/354.174/353.456ms. [진단 원표](obr17-compare-metrics.json). 이후 같은 runtime·기준·Node 환경에서 정식 metrics를 **한 번 재실행**하여 위 최종 PASS를 얻었다. 임계값·scheduler·측정 코드는 변경하지 않았다. 최초 지연의 정확한 외부 원인은 단정하지 않으며, 한 번에 모든 성능 측정이 PASS였다고 보고하지 않는다.

Node 재실행 명령(브라우저 실행 아님):

```powershell
# export가 없을 때 NODE_OPTIONS를 설정하기 전에 실행
powershell -NoProfile -File scripts/hani-office-234-export-git.ps1
$env:NODE_OPTIONS='--require ./scripts/hani-office-234-git-preload.cjs'
node --test --test-isolation=none scripts/hani-office-obr17.test.mjs
node --test --test-isolation=none scripts/hani-office-obr16.test.mjs
powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1
node --test --test-isolation=none scripts/hani-reviewed-release-baseline.test.mjs
node docs/drafts/office-behavior-redesign/audit.mjs .
node docs/drafts/office-behavior-redesign/audit.mjs . --chairman
# 다른 검사 종료 후 단독 실행
powershell -NoProfile -File scripts/hani-office-obr16-metrics.ps1
```

성능 진단 재현(필요한 경우에만):

```powershell
cmd /d /c "git show 64a8ae40a79710c73001c0509e497f92825f676a:hani-office-live.js > artifacts/office-behavior/obr17-base.txt"
foreach($taskSample in 1..3){foreach($taskMode in @('base','patched')){node scripts/hani-office-obr17-compare-metrics.mjs $taskMode $taskSample}}
```

syntax(JS/helper/test/진단도구)·`git -c core.autocrlf=false diff --check` PASS. **scheduler·presence·public scene 전체 136,858 bytes가 base `64a8ae4`와 byte 동일**이며 SHA256 `3e39b97ab259dd6e18aa3b8f03e2cd57ea15f3767508221aaf2b253a0ce95a76`. [안전 identity](obr17-safety.json). absent의 234 계획 byte 동일도 기존 obr14/obr15/chairman frozen 회귀 PASS로 확인했다(고정6 ledgers+84 snapshots, absent 전체 계획/역순 snapshots 포함).

runtime SHA256 `c8d80301715eedd0c06a637ed17d8ce5a6b8d8443abf26ce92a928ca944cee8d`, CSS `73bea672bff15ff2aa4963ae29e8f9ed752284cc808ceefcada4cd4475468c9d`. LF 유지(1868), CRLF0. index·hani-main·data/·assets/·mascot·CSS base 대비 diff0. Storage/Cloud/schema/migration 영향 없음. 서버 Edge Function·설정·배포 순서 추가 없음.

## 미검증 / 승인 경계

- 브라우저는 사용자 금지에 따라 **실행하지 않았다**. 기존 서윤 결과(64a8ae4): obr14 90 checks/PNG30 PASS, obr15 line60 FAIL. 해당 JSON·PNG는 보존했고 이번 runtime의 화면 PASS로 재사용하지 않는다.
- UI 실제 노출률·겹침·회전·서윤 Edge 재실행은 남는다. Node synthetic 배치와 DOM double을 실제 화면 증거로 대체하지 않는다.
- NORMAL targeted patch. Candidate/package/One-Pass/HINA/Preview 승인/main/Pages/Production read-back은 범위 밖·미실행. 버전 증가 검사는 배포 열차 담당 범위로 N/A.
- push/PR/Notion은 명시적 금지로 시도하지 않았다. Notion 갱신 대기를 이 보고서로 인계한다. 공통 CURRENT/DECISIONS와 타 담당 인수인계는 변경하지 않는다.

## 다음 담당에게 — 서윤 Edge 재실행

먼저 이 보고서와 updateBuilding(`hani-office-live.js:1744`)을 읽는다. 기존 브라우저 fixture·서윤 환경에서 다음 두 명령으로 재검증한다. 실제 Playwright/Edge 위치가 다르면 각 명령 끝에 `<playwright/index.mjs> <msedge.exe>`를 붙인다.

```powershell
$env:HANI_OFFICE_BROWSER_TAG='obr17-labels'
node scripts/hani-office-obr14.browser.mjs
$env:HANI_OFFICE_BROWSER_TAG='obr17-dialogue'
node scripts/hani-office-obr15.browser.mjs
```

첫 검사 90 checks/PNG30 및 기존 노출·겹침 기준, 두 번째 실제 도착/보고 쌍/종료/absent/노드 identity/무쓰기 확인이 다음 행동이다. `obr17-labels-browser.json`, `obr17-dialogue-browser.json`으로 기존 JSON은 보존한다. PNG는 기존 공용 `obr14-shots/`, `obr15-shots/` 경로를 사용한다. push/PR/main/배포/Notion 권한을 이 인수인계로 확대하지 않는다.

## 로컬 commit

`git -c core.autocrlf=false add -- <명시 파일>` 단계가 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/v235/index.lock: Permission denied`로 실패했다. 따라서 commit 명령은 실행되지 않았고 **미커밋**이다. [오류 로그](obr17-git-add.log). 권한·index 우회/재시도/push 없음. HEAD는 시작 base 유지.

인계할 변경 파일:

- `hani-office-live.js`
- `scripts/hani-office-label-browser-ready.mjs` (서윤의 기존 미커밋 수정 방향을 정확 비교로 보완)
- `scripts/hani-office-obr17.test.mjs`
- `scripts/hani-office-obr17-compare-metrics.mjs`
- `scripts/fixtures/office-lively-labels-235.json`
- `artifacts/office-behavior/report-obr17.md`
- 이 보고서에 연결한 `obr17-{before,after,obr16,regression,approved,audit-absent,audit-present,metrics-first-fail,metrics-final,git-add}.log`
- 이 보고서에 연결한 `obr17-{results,safety,metrics-first-fail,metrics-final,compare-metrics}.json`

historical export(`obr13-git/`, `git-baseline/`, `lively-baseline/`, `safety-baseline/`)·`obr17-base.txt`·개별 진단 sample은 재생성 가능한 검사 입력/중간 출력으로 commit 대상에서 제외한다. `obr16-layout-node.json`, `obr16-metrics.json`, `obr16-perf-*.json`은 지정 기존 검사 도구의 출력이다. 기존 타 담당 `diag-browser.json`, obr16 browser JSON·PNG는 보존하며 이번 stage 대상에서 제외했다.
