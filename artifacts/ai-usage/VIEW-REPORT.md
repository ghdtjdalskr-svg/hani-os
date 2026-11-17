# AI 주간 예산 화면 개선 보고서 (`hani/ai-budget-view`)

- **작성일**: 2026-11-17 (KST)
- **작업 범위**: 화면 표시(`render`) 및 표시용 CSS만 수정 (`hani_ai_budget_summary_v1` 저장 형식·시점·`merge` 규칙, `hani-ai-budget-core.js`, `hani_os_life_v23`, Cloud, Supabase, `scripts/hani-ai-budget-bridge.mjs`, 기존 시험/해시/픽스처 미수정)
- **실행 제약**: 파일 읽기/쓰기 도구만 사용 가능하고 쉘/Git 실행이 금지된 환경이므로, 아래 테스트 결과와 브라우저 레이아웃(390px, 어두운 마감 대비)은 코드 정적 검토 기준이며 **실제 Node/브라우저 실행은 미검증**입니다.

---

## 1. 바꾼 곳

| 파일 | 변경 내용 | 비고 |
|---|---|---|
| [`hani-ai-budget.js`](../../hani-ai-budget.js) | 1) `hiddenSlots`에서 `'codex-2'` 제거 (`['gemini-cli']`만 유지), `slotLabels`로 `GPT 주 계정`/`GPT 보조 계정` 표시<br>2) `<select id="aiBudgetAccount">`에 `codex-2` 포함(`visibleSlots` 기준)<br>3) `relativeAge`, `isSixHoursOld`, `accountRefTime`, `resetChipText`, `slotFetchFailed` 추가: 카드마다 `마지막 갱신 N분 전 / N시간 전`, 6시간 초과 시 회색 `⏳ 오래된 값` 칩, 가져오기 실패(`refreshFailed` 또는 해당 provider의 `collectorStatus` 오류) 시 `이번에는 못 가져왔어요 · 이전 값 표시 중` 칩 1줄 표시<br>4) 데이터 없는 슬롯(`!a`)은 `아직 수집 전` + `미확인` 빈 상태 표시(진행 바 미렌더), `usedPercent == null` 창과 `claudeUsage`의 개인 최대 기록 부재 시에도 진행 바 미렌더 + `미확인` 표시<br>5) `claudeUsage`, `antigravityHint`, 토큰 안내 문구를 `<details class="budget-info-details">` `ⓘ` 접기로 축소<br>6) 읽기 전용 `renderDashboard()` 추가: `localStorage.getItem('hani_ai_budget_summary_v1')`만 읽어 `#homeAiFuelRows`/`#homeAiFuelStatus` 렌더링(`setItem` 호출 0) | `localStorage.setItem`은 기존 `save()` 단 1곳만 유지 |
| [`hani-ai-budget.css`](../../hani-ai-budget.css) | 1) 상태 칩(`.budget-chip-age`, `.budget-chip-stale`, `.budget-chip-fail`, `.budget-chip-reset`, `.budget-chip-unknown`), 빈 상태(`.budget-empty`), `is-old` 스타일, `ⓘ` `<details>`(`.budget-info-details`) 스타일 추가<br>2) 대시보드 `"AI 연료"` 카드(`.home-ai-fuel-card`, `.home-ai-fuel-row`, `.home-ai-fuel-bar`, `.home-ai-fuel-pct`, `.home-ai-fuel-unconfirmed`) 스타일 추가<br>3) `midnight-black`, `titanium-graphite`, `[data-theme="dark"]` 어두운 마감 대비 4.5:1 이상 확보 및 `@media(max-width:480px)` 390px 폰 대응 | 표시용 CSS만 수정 |
| [`index.html`](../../index.html#L384-L387) | 1) `#home .home-lower-grid` 내 `.home-team-panel-wide` 직전에 `<button type="button" class="card home-ai-fuel-card" id="homeAiFuelCard" data-go="aiBudget">` 추가 (`grid-column: 1 / -1`로 기존 2열 배치 보존)<br>2) `#aiBudgetConnected` 초기 표기 `0 / 6` → `0 / 5`, `#aiBudgetAccount` 초기 `<option>` 라벨 정리<br>3) `#aiBudget .budget-note`의 긴 설명 문구를 `<details class="activity-trend-info budget-info-details">` `ⓘ 표시 기준 · 연결 방법` 접기로 축소 | 기존 ID와 중복 없음 |
| [`hani-main.js`](../../hani-main.js#L2022) | `showView(id)`에서 `id === "home"`일 때도 `window.HaniAiBudget?.render()` 호출, `renderHome()` 끝에서 `window.HaniAiBudget?.render()` 호출 | 읽기 전용 렌더 갱신만 추가 |
| [`scripts/hani-ai-budget-view.test.mjs`](../../scripts/hani-ai-budget-view.test.mjs) | 신규 UI·대시보드 회귀 테스트 작성 | 신규 추가 |

---

## 2. 전 / 후 비교

### (1) 오래된 값 및 가져오기 실패 표시
- **전**: 카드 하단에 `마지막 확인 <절대 날짜>`만 작게 표시되어 얼마나 오래된 값인지 바로 보이지 않았습니다. `refresh()`가 실패(`catch`)해도 `render()`를 호출하지 않고 상단 알림 한 줄만 바꿔, 카드 자체는 조용히 옛 값만 남겼습니다.
- **후**:
  - 모든 데이터 보유 카드 상단에 `마지막 갱신 N분 전` 또는 `마지막 갱신 N시간 전` 칩을 표시합니다.
  - 기준 시각(`quota`가 있는 Claude는 `quotaObservation.observedAt`, 그 외는 `observedAt`)이 6시간(`6 * 3600000ms`)을 넘기면 회색 `⏳ 오래된 값` 칩과 `.is-old` 음영을 적용합니다.
  - 브리지 연결 실패(`refreshFailed = true`) 또는 부분 수집 실패(`collectorStatus` 내 해당 provider 오류) 시 카드에 `이번에는 못 가져왔어요 · 이전 값 표시 중` 칩 1줄을 표시하며, 이때 `localStorage.setItem`은 호출하지 않습니다.

### (2) GPT 2계정 표시 및 `gemini-cli` 유지
- **전**: `hiddenSlots = ['gemini-cli', 'codex-2']`로 `codex-2`가 카드와 수동 입력 `<select>`에서 모두 숨겨져 있었고, `codex-1`은 `Codex 주력`으로만 표시되었습니다.
- **후**:
  - `hiddenSlots = ['gemini-cli']`로 변경해 `codex-1`(`GPT 주 계정`)과 `codex-2`(`GPT 보조 계정`)가 2열 그리드 첫 줄에 나란히 표시되며 수동 입력 선택지에도 포함됩니다.
  - 데이터가 없는 슬롯(`!a`)은 진행 바 없이 `아직 수집 전` · `미확인` 빈 상태를 보여줍니다.
  - `gemini-cli`(무료)는 `#aiBudgetCards`, `#aiBudgetAccount`, 대시보드 카드 모두에서 계속 숨깁니다.

### (3) 한눈에 보기 (진행 바 + 리셋 칩 + 추정 금지)
- **전**: 값이 없는 창(`usedPercent == null`)이나 개인 최대값이 없는 Claude 로컬 집계에서도 `width: 0%`의 `.budget-meter`를 그렸습니다.
- **후**:
  - `usedPercent`가 있는 창에만 `0~100%` 사용률 진행 바(`.budget-meter`, `role="meter"`)와 `⏱ 리셋 N일/시간/분 남음`(또는 `⏱ 리셋 시각 경과` / `⏱ 리셋 미확인`) 칩을 표시합니다.
  - 값이 없으면 진행 바를 그리지 않고 `미확인`으로 표시합니다.

### (4) 홈 대시보드 `"AI 연료"` 작은 카드
- **전**: 홈 대시보드(`#home`)에 AI 사용량 요약 카드가 없었습니다.
- **후**:
  - `#home .home-lower-grid`에서 1행 2열(`.home-planner-card` + `.home-monthly-check-card`)을 건드리지 않고, 그 아래 `grid-column: 1 / -1` 전체 폭 1카드로 `#homeAiFuelCard`(`data-go="aiBudget"`)를 배치했습니다.
  - 계정별 1줄로 `[계정 이름] [진행 바] [사용률%]`를 표시하며, 값이 없으면 바를 그리지 않고 `미확인`을 표시합니다.
  - `localStorage['hani_ai_budget_summary_v1']`를 **읽기만**(`getItem`) 하며 클릭 시 `aiBudget` 화면으로 이동합니다.
  - `midnight-black`(`#15171c` / `#20242c`), `titanium-graphite`(`#2d2f33` / `#20242c`) 등 어두운 마감에서도 전경/배경 대비 4.5:1 이상(`#f4f5f8`, `#d3d8e3` 등)을 유지하도록 별도 스타일을 지정했고, `@media(max-width:480px)`에서 390px 폰 폭에 맞춰 넘침 없이 줄어들도록 구성했습니다.

### (5) 긴 설명 문구 접기
- **전**: `#aiBudget` 하단 `.budget-note`, `claudeUsage`, `antigravityHint`, 토큰 안내의 긴 안내 문구가 항상 펼쳐져 있었습니다.
- **후**: 모두 `<details class="budget-info-details">` (`ⓘ ...`)로 접어 필요한 경우에만 펼쳐 보도록 정리했습니다(기존 테스트가 확인하는 텍스트는 DOM 안에 유지).

---

## 3. 깨지는 기존 시험 목록 (정적 분석)

기존 시험·해시·픽스처는 지시에 따라 수정하지 않았습니다. 코드 대조 결과 깨지는 기존 시험과 사유는 다음과 같습니다.

1. [`scripts/hani-ai-budget.test.mjs`](../../scripts/hani-ai-budget.test.mjs#L121) (**121행**)
   - 기존 단언:
     - `assert.match(node('aiBudgetCards').innerHTML,/Codex 주력/);`
     - `assert.doesNotMatch(node('aiBudgetCards').innerHTML,/Codex 보조|data-budget-slot="codex-2"/);`
     - `assert.doesNotMatch(node('aiBudgetAccount').innerHTML,/codex-2/);`
   - 깨지는 이유: 요구사항 2번에 따라 `codex-1` 표시명을 `GPT 주 계정`으로 바꾸고 `codex-2`(`GPT 보조 계정`)를 카드와 입력 선택지에 다시 노출했기 때문입니다. (124~138행은 기존 문자열·동작을 유지해 통과 예상)

2. [`scripts/hani-ai-budget-antigravity.test.mjs`](../../scripts/hani-ai-budget-antigravity.test.mjs#L71) (**71행**)
   - 기존 단언:
     - `assert.deepEqual([...node('aiBudgetCards').innerHTML.matchAll(/data-budget-slot="([^"]+)"/g)].map(m=>m[1]),['codex-1','claude-1','gemini-pro','antigravity-cg']);`
   - 깨지는 이유: `hiddenSlots`에서 `'codex-2'`를 제거해 렌더링 슬롯 목록이 `['codex-1','codex-2','claude-1','gemini-pro','antigravity-cg']` 5개로 바뀌었기 때문입니다. (69행 `/로그인/` 및 72~82행은 통과 예상)

3. 참고 — 통과 예상 기존 시험 (쉘 미실행으로 실제 실행은 미확인)
   - [`scripts/hani-ai-budget-plan.test.mjs`](../../scripts/hani-ai-budget-plan.test.mjs)
   - [`scripts/hani-nav-groups.test.mjs`](../../scripts/hani-nav-groups.test.mjs)
   - 신규 시험: [`scripts/hani-ai-budget-view.test.mjs`](../../scripts/hani-ai-budget-view.test.mjs)

---

## 4. 후속 안내: `scripts/hani-ai-budget-bridge.mjs`의 `CODEX_HOME` 수정 방법 (이번 범위 외)

현재 [`scripts/hani-ai-budget-bridge.mjs`](../../scripts/hani-ai-budget-bridge.mjs#L201-L230)는 `readCodex()`가 `env` 지정 없이 기본 `CODEX_HOME` 하나만 읽어 `collectSummary()`에서 단 1개의 Codex 계정만 수집합니다. 두 계정(`codex-1`, `codex-2`)을 실제로 모두 수집하려면 다음 수정이 필요합니다.

1. **`readCodex()`에 `codexHome` 인자 추가 (`bridge.mjs:211-214`)**
   - `readCodex({entry = process.env.HANI_CODEX_ENTRY, timeoutMs = 10000, codexHome} = {})` 형태로 받고,
   - `spawn(process.execPath, [entry, 'app-server', '--stdio'], { cwd: os.tmpdir(), env: codexHome ? { ...process.env, CODEX_HOME: codexHome } : process.env, windowsHide: true, stdio: ['pipe','pipe','pipe'] })`로 각 계정의 `CODEX_HOME`을 격리 실행합니다.
2. **로컬 전용 슬롯–`CODEX_HOME` 매핑 읽기 (저장소 커밋 금지)**
   - `.ai-budget-private/config.json`(또는 환경변수 `HANI_CODEX_HOMES`)에서 `[{ slot: 'codex-1', codexHome: '...' }, { slot: 'codex-2', codexHome: '...' }]` 목록을 읽습니다.
   - 설정이 없으면 기존처럼 기본 `CODEX_HOME` 1회 조회(`assignCodexSlot`)로 하위 호환을 유지합니다.
3. **`collectSummary()`에서 슬롯별 순회 수집 (`bridge.mjs:203`)**
   - 매핑된 각 엔트리를 순회하며 `readCodex({ codexHome })`를 호출하고, 지정된 `slot` ID(또는 `assignCodexSlot`)로 `codexAccount(id, result, fingerprint)`를 생성해 `core.merge()`합니다.
   - 두 계정의 `fingerprint`가 같으면 `core.normalize()`가 중복 계정을 차단(`codex[0].fingerprint === codex[1].fingerprint`)하므로 오류(`codex_account_duplicate` 등)로 기록하고 기존 정상 슬롯을 보존합니다.
   - 한 계정이 미로그인/오프라인이어도 다른 계정은 계속 수집하고, 실패한 슬롯만 `collectorStatus`에 반영합니다.
4. **(선택) 세션 JSONL 읽기 전용 fallback (`SURVEY.md §3-1 A`)**
   - `app-server` 조회가 실패할 때만 해당 `CODEX_HOME/sessions/**/rollout-*.jsonl`의 최신 `token_count` / `rate_limits` 스냅샷을 읽기 전용으로 보조 파싱하되, `observedAt`에는 현재 시각이 아니라 로그 이벤트의 실제 타임스탬프를 기록해야 UI의 `>6시간 오래된 값` 판정이 정확하게 동작합니다.
