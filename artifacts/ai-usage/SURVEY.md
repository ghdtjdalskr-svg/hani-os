# AI 주간 예산(`#aiBudget`) 현황 조사 및 자동 수집·대시보드 설계안

- **작성일**: 2026-11-17 (KST)
- **조사 범위**: `histfix` 저장소 읽기 전용 코드 조사 (운영 파일 미수정, 쉘 명령 미사용)
- **표기 규칙**: 코드에서 직접 확인되지 않은 런타임/로컬 디스크 상태는 **`추측`** 으로 표기했고, 추가 확인이 필요한 항목은 마지막 **`질문`** 섹션에 모았습니다. 새 저장 키·`hani_os_life_v23` 변경·새 Cloud 테이블/스키마 변경이 필요한 선택지는 **`회장님 승인 필요`** 로 구분했습니다.

---

## 1. 지금 구조

### 1-1. 관련 파일과 핵심 역할

| 구분 | 파일 | 핵심 심볼 / 역할 |
|---|---|---|
| 화면 마크업 | [`index.html`](../../index.html#L1655-L1666) | 사이드바 메뉴(`data-view="aiBudget"`, `index.html:286`), `<section id="aiBudget">` (`1655~1666행`), 연결 상태 배지(`#aiBudgetConnected`), `이 PC에서 사용량 가져오기`(`#aiBudgetRefresh`), `요약 파일 가져오기`(`#aiBudgetImport`), `요약 내보내기`(`#aiBudgetExport`), 카드 컨테이너(`#aiBudgetCards`), 직접 입력 폼(`#aiBudgetEditor`), CSS/JS 로드(`10행`, `1870~1871행`) |
| 코어 스키마·병합·상태판정 | [`hani-ai-budget-core.js`](../../hani-ai-budget-core.js) | `slots`(`4~11행`), `sources`(`12행`), `normalize`/`normalizeImport`(`57~77행`), `merge`(`78~91행`), `windowState`(`92~97행`) |
| 브라우저 UI·로컬 저장 | [`hani-ai-budget.js`](../../hani-ai-budget.js) | `KEY = 'hani_ai_budget_summary_v1'`(`3행`), `hiddenSlots = ['gemini-cli', 'codex-2']`(`11행`), `render()`(`39~51행`), `refresh()`(`58~69행`), 수동 입력 폼(`74~82행`), JSON 가져오기/내보내기(`83~87행`) |
| 스타일 | [`hani-ai-budget.css`](../../hani-ai-budget.css) | `.budget-grid`, `.budget-card`, `.budget-meter`, `.expired .budget-meter i`, `.stale .budget-meter i` (`1~20행`) |
| 메인 앱 연결 | [`hani-main.js`](../../hani-main.js) | `pageMeta.aiBudget`(`1655행`), `showView()` 내 `if(id==="aiBudget")window.HaniAiBudget?.render()`(`2022행`). `renderAll()`(`8591행`) 및 Cloud 동기화(`cloudSyncFingerprintState`, `5836~5864행`)와는 **연결되어 있지 않음** |
| PC 로컬 수집기·브리지 | [`scripts/hani-ai-budget-bridge.mjs`](../../scripts/hani-ai-budget-bridge.mjs) | `collectSummary`(`188~207행`), `readCodex`(`211~230행`), `readAntigravity`/`collectAntigravity`(`71~116행`), `claudeTranscriptAccount`(`148~163행`), `geminiLogAccount`(`164~168행`), `createBridge`(`235~254행`, `127.0.0.1:8794`), CLI 진입점 `collect` / `claude-statusline` / `import` / `serve`(`255~264행`) |
| 개발 지도 / 테스트 | `dev-center/codemap.json`, `scripts/hani-ai-budget*.test.mjs` | `codemap.json`에는 `aiBudget` 항목 미등록(`CODEMAP_MISS`). 단위·스모크 테스트(`hani-ai-budget.test.mjs`, `hani-ai-budget-antigravity.test.mjs`, `hani-ai-budget-plan.test.mjs`, `hani-ai-budget-browser.mjs`) 보유 |

### 1-2. 데이터 저장소 및 Cloud 분리 현황

- **브라우저 저장소**: `localStorage['hani_ai_budget_summary_v1']` (`hani-ai-budget.js:3`).
- **`hani_os_life_v23` 및 Supabase Cloud와 완전 격리**:
  - `hani-main.js:957~958`의 `STORAGE_KEY = "hani_os_life_v23"` 및 `cloudSyncFingerprintState` (`hani-main.js:5836~5864`)는 `hani_ai_budget_summary_v1`을 읽거나 쓰지 않습니다.
  - Cloud 테이블(`hani_state`)이나 Supabase Edge Function을 호출하는 경로가 AI 주간 예산 코드 전체에 **존재하지 않습니다**. (`index.html:1665` 안내 문구: `"계정별 숫자 요약만 이 브라우저에 저장되며 Cloud에는 올라가지 않습니다."`)
- **PC 로컬 저장소**: `scripts/hani-ai-budget-bridge.mjs:11~18`의 `privateDir` (`process.env.HANI_AI_BUDGET_DIR || <repo>/.ai-budget-private`) 아래에 `summary.json`, `antigravity-cache.json`, `antigravity.lock` 파일로 저장됩니다.

### 1-3. 슬롯(카드)별 출처와 UI 노출 현황

`hani-ai-budget-core.js:4~11`에는 총 6개 슬롯이 정의되어 있으나, `hani-ai-budget.js:11`의 `hiddenSlots = ['gemini-cli', 'codex-2']` 때문에 현재 UI 카드에는 **4개만 노출**됩니다.

| 슬롯 ID | UI 표시 여부 | 카드명 (`core.js`) | 실제 데이터 소스 (`source`) | 수집 방식 (`bridge.mjs` / `hani-ai-budget.js`) |
|---|---|---|---|---|
| `codex-1` | **표시** | Codex 주력 | `codex-app-server` / `manual` | `@openai/codex` CLI의 `app-server --stdio` RPC (`account/read`, `account/rateLimits/read`) |
| `codex-2` | **숨김** (`v2.9.289`) | Codex 보조 | `codex-app-server` / `manual` | 위와 동일 (`hiddenSlots` 및 `<select>` 필터 `s.id!=='codex-2'`로 UI에서 제외, `hani-ai-budget.js:11, 71`) |
| `claude-1` | **표시** | Claude | `claude-code-transcripts` (활동량) + `claude-statusline` / `claude-plan-usage` / `manual` (플랜 사용률) | 로컬 JSONL 집계와 플랜 사용률(`quotaObservation`)이 독립 시계로 병합됨 |
| `gemini-pro` | **표시** | Gemini Pro (Google AI Pro) | `antigravity` / `manual` | `agy.exe -p /usage` 출력의 `'Gemini Models'` 행 파싱 (1시간 캐시) |
| `antigravity-cg` | **표시** | Antigravity · Claude/GPT | `antigravity` / `manual` | `agy.exe -p /usage` 출력의 `'Claude and GPT models'` 행 파싱 (1시간 캐시) |
| `gemini-cli` | **숨김** | Gemini · CLI(무료) | `gemini-cli-logs` / `manual` | `~/.gemini/tmp/**/session-*.jsonl`, `logs.json` 토큰·요청 집계 |

### 1-4. `"이 PC에서 사용량 가져오기"` 버튼 및 주요 수집 경로

1. **`이 PC에서 사용량 가져오기` (`#aiBudgetRefresh`, `hani-ai-budget.js:58~69`)**
   - 브라우저에서 `GET http://127.0.0.1:8794/api/ai-budget`를 호출합니다 (헤더 `X-Hani-Ai-Budget: read-only-v1`, 타임아웃 80초).
   - 로컬에서 `node scripts/hani-ai-budget-bridge.mjs serve`가 켜져 있으면 `createBridge()` (`bridge.mjs:235~254`)가 요청을 받아 `refresh()` → `collectSummary()` (`188~207행`)를 실행합니다.
   - 단, `bridge.mjs:238`에 **5분 쿨다운**(`Date.now() - lastAttempt < 5*60000`)이 있어서 5분 이내 재클릭 시 재수집하지 않고 캐시된 `summary.json`을 그대로 반환합니다.
   - 응답을 받으면 브라우저는 `core.merge(summary, next)` (`core.js:78~91`)로 기존 `localStorage` 데이터와 병합·저장합니다. 연결 자체에 실패(`catch`)하면 기존 `localStorage` 데이터를 유지한 채 `"이 PC의 사용량 연결에 닿지 못했습니다..."` 안내만 띄웁니다.

2. **`Codex 공식 조회` (`codex-app-server`, `bridge.mjs:211~230`)**
   - `readCodex()`가 로컬 Node/PATH에서 `@openai/codex/bin/codex.js`를 찾아 `app-server --stdio` 모드로 실행합니다 (`cwd: os.tmpdir()`, 별도 `CODEX_HOME` 지정 없음).
   - JSON-RPC로 `initialize` → `initialized` → `account/read {refreshToken:false}` → `account/rateLimits/read` → `account/read`를 호출합니다 (`bridge.mjs:221~222`).
   - 응답의 `email`을 소문자 SHA-256 해시해 `fingerprint`를 만들고(`bridge.mjs:223`), `assignCodexSlot(summary, fingerprint)` (`bridge.mjs:23~28`)로 `codex-1` 또는 `codex-2`에 배정합니다.
   - `primary`(5시간)와 `secondary`(주간) `usedPercent`, `resetsAt`을 채웁니다 (`bridge.mjs:29~36`).

3. **`Claude Code 로컬 집계` (`claude-code-transcripts`, `bridge.mjs:120~163`)**
   - `collectSummary()` 실행 시 `collectLocalUsage()`가 `~/.claude/projects/**/*.jsonl`에서 최근 8일 이내(`mtimeMs >= now - 8*86400000`) 파일 최대 500개(개당 8MB, 합계 64MB 상한)를 읽어 토큰(`input`, `cacheCreation`, `cacheRead`, `output`)과 메시지 수를 집계합니다 (`bridge.mjs:148~163`).
   - 이 경로는 **플랜 사용률(%)을 전혀 알 수 없으므로** `windows: []`를 반환합니다 (`bridge.mjs:162`).

4. **`Claude 플랜 사용률 가져오기` (`claude-plan-usage` / `claude-statusline` / `manual`)**
   - **`claude-statusline`** (`bridge.mjs:37~42, 259행`): `node scripts/hani-ai-budget-bridge.mjs claude-statusline` 명령에 표준입력(stdin)으로 Claude Code statusline JSON(`rate_limits.five_hour`, `rate_limits.seven_day`)을 파이프할 때만 `summary.json`의 `claude-1`에 공식 비율(`quotaObservation`)이 저장됩니다.
   - **`claude-plan-usage`** (`hani-ai-budget.js:83~86`, `core.js:57~77`, `bridge.mjs:260행`): UI의 `요약 파일 가져오기`(`#aiBudgetImport`) 또는 CLI `import <파일>`로 JSON을 가져옵니다. (`{accounts:[{id:'claude-1', provider:'claude', source:'claude-plan-usage', windows:[...]}]}` 형태의 최소 JSON도 지원)
   - **`manual`**: UI의 `직접 수정`(`#aiBudgetEditor`, `hani-ai-budget.js:74~82`)에서 수동 입력합니다.

5. **`Antigravity /usage 조회` (`antigravity`, `bridge.mjs:45~116`)**
   - `collectSummary()` 실행 시 `readAntigravity()` (`71~84행`)가 `%LOCALAPPDATA%\agy\bin\agy.exe` 등을 찾아 `agy.exe -p /usage`를 실행합니다(60초 타임아웃, `antigravity-cache.json`에 1시간 캐시).
   - TSV 출력(`Gemini Models`, `Claude and GPT models`)에서 `Weekly Limit Remaining`, `Five Hour Limit Remaining`, ISO 리셋 시각을 파싱해 `usedPercent = 100 - percent`로 `gemini-pro`, `antigravity-cg`를 갱신합니다.

---

## 2. 값이 일정하지 않은 원인 후보

회장님이 11/17 제보하신 증상(*Codex 주력이 10.18에 멈춰 있음, Claude 플랜 사용률이 10.11에 멈춰 있음, Gemini·Antigravity는 최근 값*)은 버그 1건이 아니라 **수집 실패 시 이전 값 보존 구조 + Claude의 이중 시계·표시 분기 + Codex 2계정 숨김/단일 `CODEX_HOME` 구조**가 겹쳐 발생한 결과로 보입니다.

### 후보 1. 수집 실패 또는 브리지 미연결 시 "옛날 값"을 계속 화면에 남기는 구조 (핵심 원인)
- **브라우저 측 (`hani-ai-budget.js:67`)**: `http://127.0.0.1:8794` 연결에 실패해도 `catch` 블록이 기존 `localStorage['hani_ai_budget_summary_v1']`를 그대로 화면에 남겨 둡니다.
- **로컬 수집기 측 (`scripts/hani-ai-budget-bridge.mjs:203`)**: `collectSummary()`는 `readCodex()`가 예외(`codex_cli_not_found`, `codex_account_not_connected`, `codex_read_rejected`, `codex_connection_failed`, `codex_slots_full`, `codex_read_failed`)를 던지면 `errors` 배열에만 기록하고, **`summary.json`에 남아 있던 기존 `codex-1` (`2026.10.18`) 항목을 덮어쓰거나 비우지 않고 그대로 응답에 실어 보냅니다.**
- **병합 규칙 (`hani-ai-budget-core.js:83`)**: `Date.parse(b.observedAt) < Date.parse(a.observedAt) ? a : b` 로직으로, 새 조회가 빠져 `b`에 오래된 값만 오거나 `b`가 실패하면 `a`(브라우저에 캐시된 10/18 값)가 살아남습니다. (반대로 오래된 JSON이 최신 값을 덮어쓰지는 못하게 막혀 있습니다.)
- **UI 표시 규칙 (`hani-ai-budget.js:45`)**: `windowState()`가 `'expired'`(회복 시각 경과)나 `'stale'`(15분 경과, Antigravity는 60분 경과)을 반환해도 UI는 **과거의 `(100 - usedPercent)%` 숫자와 지난 `resetsAt` 날짜(`10/19·10/25`)를 그대로 출력**합니다(`지난 조회의 잔여율`, `회복 시각 경과 · 재조회 필요`). CSS(`hani-ai-budget.css:12~13`)도 게이지 막대 색만 `#8992a7`로 바꾸고 카드 전체나 숫자·날짜를 흐리게 구분하지 않아 최신 값처럼 보이기 쉽습니다.

### 후보 2. Codex 2계정(주력·보조) 구조적 충돌 및 `codex-2` 숨김 (`v2.9.289`)
- **단일 기본 `CODEX_HOME`만 조회 (`bridge.mjs:214`)**: `readCodex()`는 `os.tmpdir()`에서 별도 `CODEX_HOME` 환경변수 전환 없이 `@openai/codex` app-server를 1회만 실행합니다. 즉, **실행 시점에 기본 CLI에 로그인되어 있는 단 1개 계정만 조회**할 수 있고, 두 계정 폴더(주력·보조)를 동시에 읽지 못합니다.
- **보조 계정이 로그인된 상태에서 조회 시 `codex-1`이 갱신되지 않음 (`bridge.mjs:23~28`, `hani-ai-budget.js:11`)**:
  - `assignCodexSlot()`은 이메일 SHA-256 `fingerprint`로 슬롯을 배정합니다.
  - **`추측`**: 10월 18일 당시 로그인되어 있던 계정이 `codex-1`에 저장된 뒤, 이후 PC의 기본 Codex 로그인이 **두 번째 계정(보조)** 으로 전환되었다면, `bridge.mjs`는 새 조회 결과를 **`codex-2`에 기록**합니다.
  - 그런데 `v2.9.289` (`assets/data/hani-history-releases-v1.json`, 2026-11-12 `#487`)에서 `hani-ai-budget.js:11`이 `hiddenSlots = ['gemini-cli', 'codex-2']`로 `codex-2` 카드를 숨겨 버렸기 때문에, 화면에 보이는 `codex-1` 카드는 10/18 이후 한 번도 갱신되지 못한 채 멈춰 있고, 실제 갱신된 `codex-2`는 보이지 않는 현상이 발생할 수 있습니다.
  - 또한 **`추측`**: 현재 두 계정이 각각 별도 `CODEX_HOME` 폴더로 분리 운용되고 있다면, 기본 경로가 아닌 보조 폴더의 계정은 아예 `readCodex()` 대상에서 빠지게 됩니다.
  - 참고로 `hani-main.js:1655` (`pageMeta.aiBudget`) 설명 문구는 여전히 `"Codex 두 계정과 Claude·Gemini의 사용 한도..."`로 남아 있어 UI(`codex-2` 숨김)와 불일치합니다.

### 후보 3. Claude 플랜 사용률이 `"확인 2026.10.11"`에 고정되는 구조
- **자동 수집은 토큰 합산만 수행 (`bridge.mjs:148~163`)**: `collectLocalUsage()`가 실행하는 `claude-code-transcripts`는 `~/.claude/projects/**/*.jsonl`에서 최근 8일 토큰량만 세고 `windows: []`를 반환합니다. 구독 플랜의 5시간/주간 사용률(%)은 **`claude-statusline` 훅이 호출되거나, `claude-plan-usage` JSON을 가져오거나, 직접 입력(`manual`)할 때만** 갱신됩니다.
- **이중 시계 병합 (`core.js:85~88`)**: `core.merge()`는 `claude` 슬롯에 대해 `transcriptUsage` 시계와 `quotaObservation` 시계를 분리해 보관합니다. 10월 11일(v2.9.205 배포 시점, `docs/development-history/handoffs/2026-10-11-polish-205-session-budget-work.md`) 이후 `claude-statusline` 또는 `claude-plan-usage` 입력이 없었다면 `quotaObservation`은 영구히 `2026.10.11`로 유지됩니다.
- **표시 분기 때문에 최신 로컬 집계가 가려짐 (`hani-ai-budget.js:42, 47, 50`)**:
  - `hani-ai-budget.js:42`는 `slot.provider === 'claude' && !a?.windows?.length` 일 때만 로컬 토큰 집계(`claudeUsage(a)`)를 그립니다.
  - 즉, 10월 11일에 한 번이라도 `windows`가 들어가면 그 뒤로 로컬 JSONL 집계가 매일 새로 수집되어도 **카드 본문에서는 로컬 집계가 숨겨지고 10/11의 `플랜 사용률 · 확인 2026.10.11`만 계속 표시**됩니다.
  - 게다가 카드 하단(`50행`)은 `a.observedAt`(이중 시계 중 더 최신인 `transcriptUsage` 시각)을 찍어 `"Claude Code 로컬 집계 · 마지막 확인 ..."`으로 보일 수 있어, 상단의 `확인 2026.10.11`과 시각이 어긋나 보입니다.

### 후보 4. Antigravity(`gemini-pro`, `antigravity-cg`)만 최신으로 보이는 이유
- `collectAntigravity()` (`bridge.mjs:71~116`)는 로그인된 Codex CLI나 statusline 훅에 의존하지 않고 로컬 `agy.exe -p /usage`를 직접 호출하므로, `bridge.mjs`가 실행될 때마다(1시간 캐시 만료 시) 자동으로 두 카드가 최신 상태로 갱신됩니다.
- 참고로 `gemini-cli` (`~/.gemini/tmp`)도 매번 수집되지만 `hiddenSlots` (`hani-ai-budget.js:11`)로 숨겨져 있습니다.

### 후보 5. KST(한국 시간) 처리 점검 결과
- UI 포맷터(`hani-ai-budget.js:7`)는 `timeZone: 'Asia/Seoul'`을 일관되게 사용하고 있고, 수동 입력(`77행`)은 `+09:00`을 명시하며, `openEditor()`(`55행`)도 `Date.parse(w.resetsAt) + 9*3600000`으로 KST 입력값을 복원합니다.
- Codex(`app-server` epoch seconds * 1000 → `toISOString()`)와 Antigravity(ISO 문자열 파싱), Gemini CLI(`America/Los_Angeles` 자정 기준 DST 보정 `bridge.mjs:141~147`) 모두 UTC ISO 정규화 후 표시 시점에만 KST로 변환합니다.
- 따라서 **1개월 전 날짜(`10.11`, `10.18`)가 뜨는 원인은 KST 타임존 버그가 아니라 위 후보 1~3의 수집 누락·오래된 캐시 보존 때문**입니다.

### 후보 6. 브리지 5분 쿨다운과 자동 재시도 부재
- `bridge.mjs:238`에서 HTTP `GET /api/ai-budget`는 5분 내 재요청 시 새 수집을 건너뛰고 직전 `summary.json`을 반환합니다. Codex 로그인 상태를 바꾼 직후 5분 내에 `가져오기`를 다시 눌러도 즉시 반영되지 않습니다.

---

## 3. 자동 수집 설계안 (제안만)

목표: 이 PC에서 주기적으로 각 도구의 사용량·한도 상태를 안전하게 수집해 `.ai-budget-private/summary.json`을 최신으로 유지하고, 앱은 그 결과를 받아 보여줍니다. (**비밀번호·OAuth 토큰·`service_role` 키·계정 이메일 원문은 저장소에 절대 기록하지 않습니다.**)

### 3-1. 도구·계정별 로컬 수집 방식

#### A. Codex 2개 계정 (주력 · 보조)
현재 구조의 한계(단일 기본 `CODEX_HOME`만 `app-server`로 읽고 `codex-2`를 숨김)를 해결하기 위해 두 계정의 `CODEX_HOME` 폴더(예: 환경변수 `HANI_CODEX_HOMES` 또는 `.ai-budget-private/config.json`의 로컬 전용 매핑 `[ { slot: 'codex-1', codexHome: '...' }, { slot: 'codex-2', codexHome: '...' } ]`)를 분리 관리하는 전제를 둡니다.

1. **방식 A-1 (권장 1순위 · 1차 파싱): 각 계정 폴더의 최근 세션 로그(`sessions/.../*.jsonl`)에서 `rate_limits` 읽기**
   - **`추측` / 확인 필요**: OpenAI Codex CLI 세션 JSONL(`sessions/YYYY/MM/DD/rollout-*.jsonl`)에는 통상 `event_msg`(`payload.type === 'token_count'`) 안에 `rate_limits.primary` / `rate_limits.secondary` (`used_percent`, `window_minutes`, `resets_at`) 스냅샷이 기록됩니다. 다만 현재 작업 제약상 저장소 외부의 실제 `~/.codex` 폴더를 직접 열지 못했으므로 **이 PC의 실제 Codex 세션 JSONL 필드명 존재 여부 확인이 필요**합니다.
   - **장점**: 완전 **읽기 전용(Read-Only)** 이며, 별도 프로세스 실행·토큰 갱신·로그인 충돌 위험이 없고, 두 계정 폴더가 각각 독립된 `sessions/` 트리를 가지므로 계정이 번갈아 사용되어도 마지막 대화 시점의 잔여 한도와 회복 시각을 바로 추출할 수 있습니다.
   - **한계**: 해당 계정으로 **세션을 전혀 실행하지 않은 기간**(예: 완전 소진 후 `11/19 03:02 KST` 리셋이 막 지난 직후)에는 로그가 새 리셋 이후 상태를 반영하지 못하므로 `expired` 처리 또는 방식 A-2 보완이 필요합니다.

2. **방식 A-2 (공식 조회 보완): 슬롯별 `CODEX_HOME`을 주입한 `codex app-server --stdio` RPC**
   - 현재 `bridge.mjs:211~230`이 이미 사용하는 공식 경로(`account/read` + `account/rateLimits/read`)는 LLM 요청을 보내지 않고 계정 한도만 조회합니다(`bridge.mjs:210` 주석 확인).
   - `execFile`/`spawn` 시 `env: { ...process.env, CODEX_HOME: entry.codexHome }`를 슬롯별로 지정해 실행하면, **세션을 돌리지 않았거나 리셋 직후(11/19 03:02 이후)에도** 두 계정 모두 실시간 `usedPercent`와 `resetsAt`을 받을 수 있습니다.
   - **적용 전략**: 1차로 `CODEX_HOME`별 `app-server` 공식 조회를 시도하고, 미로그인·오프라인 등으로 실패 시 해당 슬롯의 최근 세션 JSONL `rate_limits`를 보조(fallback)로 읽되 **`observedAt`을 로그 이벤트 시각으로 정확히 기록**합니다. 또한 `hani-ai-budget.js:11, 71`의 `hiddenSlots`에서 `'codex-2'`를 제거해야 두 계정(주력·보조)을 모두 볼 수 있습니다.

#### B. Claude (`claude-1`)
- **실시간/사용 중 공식 % 수집 (기존 경로 활성화)**: Claude Code 설정의 `statusLine` 훅이 `node "<repo>/scripts/hani-ai-budget-bridge.mjs" claude-statusline`을 호출(또는 기존 statusline 스크립트 끝에서 stdin을 tee 파이프)하도록 연결하면, Claude Code를 쓸 때마다 `rate_limits.five_hour` / `seven_day`가 `summary.json`에 자동 반영됩니다.
- **사용하지 않는 시간대 백그라운드 수집 한계**: 저장소 코드 기준 Claude Pro/Max 웹 플랜 비율(`claude.ai/settings/usage`)을 비밀번호·쿠키 스크래핑 없이 백그라운드에서 직접 긁어오는 공식 CLI 경로는 확인되지 않았습니다. (`claude` CLI에서 비대화형 usage 출력이 가능한지는 **확인 필요**). 보안상 브라우저 쿠키/세션 토큰을 저장소나 스크립트에 하드코딩하는 방식은 채택하지 않습니다.
- **UI·병합 보완**: `quotaObservation`이 `expired`이거나 오래되었을 때(`> 24h` 등), `hani-ai-budget.js:42`에서 로컬 토큰 집계(`claudeUsage`)를 완전히 숨기지 않고 **최근 7일 로컬 집계와 오래된 플랜 스냅샷을 함께 표시**하면 `"10.11에서 멈춘 카드"`처럼 보이는 혼란을 없앨 수 있습니다.

#### C. Gemini / Antigravity (`gemini-pro`, `antigravity-cg`, 선택적으로 `gemini-cli`)
- **기존 경로 유지**: `collectAntigravity()` (`bridge.mjs:71~116`)가 `agy.exe -p /usage`를 1시간 캐시로 자동 수집하고 있으므로 주기 실행기만 연결하면 그대로 동작합니다.
- `gemini-cli` (`~/.gemini/tmp`)는 이미 `collectSummary()`가 수집 중이므로 무료 CLI 한도도 보고 싶다면 `hiddenSlots` 조정만으로 추가 수집 작업 없이 노출할 수 있습니다.

### 3-2. PC 주기 스케줄링 및 에러 처리 개선

1. **Windows 작업 스케줄러 (`schtasks`) + 상주 브리지**
   - 15~30분 간격으로 `node scripts/hani-ai-budget-bridge.mjs collect` 실행 (출력은 `.ai-budget-private/summary.json`에만 기록, 파일 권한은 소유자 전용 유지).
   - 로그인 시 백그라운드로 `node scripts/hani-ai-budget-bridge.mjs serve`를 자동 기동해 두면, 브라우저에서 `가져오기`를 누르거나 대시보드를 열 때 즉시 `http://127.0.0.1:8794/api/ai-budget`로 읽을 수 있습니다.
2. **부분 실패 가시화 (`bridge.mjs` & `core.js`)**
   - 특정 슬롯 수집이 실패했을 때 기존 값을 무작정 지울 필요는 없지만, **어느 슬롯이 왜 실패했는지(`slotErrors`)와 마지막 성공 시각(`observedAt`)을 분리**해 UI가 오래된 데이터임을 명확히 경고하게 해야 합니다.
   - `bridge.mjs:238`의 5분 쿨다운은 수동 새로고침(`?force=1` 등) 시 우회할 수 있도록 구분하는 것이 좋습니다.

### 3-3. 앱으로 전달하는 경로 비교 (기존 재사용 vs 승인 필요 항목)

| 구분 | 전달 경로 | 동작 방식 | 장점 / 한계 | 승인 여부 |
|---|---|---|---|---|
| **안 1 (기존 경로 재사용)** | **로컬 브리지 HTTP (`127.0.0.1:8794`) + `localStorage['hani_ai_budget_summary_v1']`** | PC 스케줄러가 `.ai-budget-private/summary.json` 갱신 → HANI OS가 열릴 때(또는 새로고침 클릭 시) `127.0.0.1:8794`에서 읽어 기존 `localStorage` 키에 병합 | 기존 코드·키 그대로 재사용, 데이터 안전. 단, **다른 기기(모바일 등)에서는 자동 동기화되지 않으며** JSON 수동 내보내기/가져오기 필요 | **불필요** (기존 경로·기존 키 재사용) |
| **안 2 (Drive / 기존 Vault 활용 시 주의)** | Google Drive / 파일 공유 등 | PC 스케줄러가 요약 JSON을 개인 클라우드 파일에 올리고 앱이 읽기 | **새 외부 연동/저장 키 추가 여부**에 따라 판단 필요 (`hani_os_life_v23` 외 저장소 변경 시 검토 필요) | 범위 확정 시 검토 |
| **안 3 (다기기 실시간 동기화)** | **`hani_os_life_v23` 내부 필드로 편입** (`hani_state` Cloud Sync) | `state` 객체 안에 `aiBudget` 추가하여 기존 `cloudPushLocalRow` 활용 | 모바일 포함 자동 동기화되지만 **보호 대상 키 `hani_os_life_v23` 스키마·Cloud payload 변경** 발생 (`AGENTS.md §2, §5`) | **`회장님 승인 필요`** (핵심 저장소·동기화 구조 변경) |
| **안 4 (다기기 실시간 동기화 · 분리형)** | **새 Supabase 테이블 (예: `hani_ai_budget`) + 새 Edge Function** | PC 스케줄러가 Edge Function(또는 사용자 인증 세션)으로 요약 JSON만 upsert → 앱이 read-only로 fetch (`service_role` 키는 저장소/클라이언트 금지) | `hani_os_life_v23`를 건드리지 않고 모바일에서도 최신 사용량 조회 가능 | **`회장님 승인 필요`** (**새 Cloud 테이블 · schema 변경 · Edge Function 추가**) |

> **권장 단계**: 1단계에서는 **안 1 (기존 `127.0.0.1:8794` + `hani_ai_budget_summary_v1` 재사용)** 으로 PC 자동 수집·정확한 계정 분리·오래됨 판정을 먼저 안정화하고, 모바일에서도 같은 카드가 꼭 필요할 때 **안 4(분리형 Cloud 테이블/Edge Function)** 에 대해 **회장님 승인**을 받아 확장하는 편이 `AGENTS.md` 데이터 보존 원칙에 가장 부합합니다.

---

## 4. 대시보드 카드 제안 (`#home` 작은 `"AI 사용량"` 카드)

### 4-1. 배치 위치 및 구현 원칙

- **배치 후보 (`index.html:320~386`, `hani-main.js:5397~5412`)**:
  - **1순위 추천**: `#home .home-lower-grid` (`index.html:363~385`) 상단 또는 `.home-monthly-check-card` 옆/아래에 `<section class="card home-ai-usage-card" id="homeAiUsageCard">` 배치 (`READ-ONLY UI PATCH`).
  - 이유: `#homeActions`는 긴급 알림·체크리스트 영역이고 `.life-market-grid`는 가계/자산 6대 KPI이므로, HANI 팀/월간 체크와 나란히 두는 `.home-lower-grid`가 시선 흐름과 레이아웃 밀도에 가장 자연스럽습니다.
- **데이터 읽기 원칙**:
  - `renderHome()` 또는 `showView('home')` 시점에 `localStorage['hani_ai_budget_summary_v1']`를 **동기적으로 즉시 읽어** 렌더링합니다(`hani_os_life_v23` 읽기/쓰기 일절 없음).
  - PC 환경에서 사용자가 카드 내 작은 `↻` 새로고침 버튼을 누르거나(또는 옵션으로 백그라운드 1.5초 짧은 타임아웃 ping 시), `http://127.0.0.1:8794/api/ai-budget`에서 최신값을 당겨와 갱신합니다. (모바일/오프라인 환경에서 80초 대기로 홈 렌더링이 멈추지 않도록 짧은 타임아웃 또는 수동 버튼 적용)

### 4-2. 카드 구성안 및 항목 설계

- **헤더**: `AI 사용량` · 마지막 전체 갱신 요약 + `[↻]` (PC 브리지 새로고침) + `[자세히 보기 ›]` (`data-go="aiBudget"` 또는 `showView('aiBudget')`)
- **계정별 1줄(컴팩트 2단) 요약**: 한눈에 **계정명 / 남은 비율(%) / 회복 시각 / 마지막 확인 시각**을 확인합니다.

```text
+-------------------------------------------------------------------+
| AI 사용량                           [↻ PC 갱신]   [전체 보기 ›]    |
+-------------------------------------------------------------------+
| ● Codex 주력          남은   0%  | 회복 11/19 03:02  | 확인 11/17 01:55 |
|   [....................] 5시간/주간 한도 도달 (D-2)                  |
| ● Codex 보조          남은   0%  | 회복 11/19 03:02  | 확인 11/17 01:55 |
|   [....................] 5시간/주간 한도 도달 (D-2)                  |
| ○ Claude       [오래됨] 남은  62% | 회복 10/18 09:00 | 확인 10/11 14:20 |  <-- 회색 음영 처리
|   [████████░░░░░░░░░░░░] 확인 시각 경과 · 최근 7일 로컬 토큰만 집계중     |
| ● Gemini Pro          남은  84%  | 회복 11/24 00:00  | 확인 11/17 01:50 |
|   [█████████████████░░░] 정상                                       |
| ● Antigravity · C/G   남은  70%  | 회복 11/17 06:00  | 확인 11/17 01:50 |
|   [██████████████░░░░░░] 5시간 기준                                  |
+-------------------------------------------------------------------+
```

### 4-3. `"오래됨"`(Stale / Expired) 판정 및 회색 시각화 기준

기존 `hani-ai-budget-core.js:92~97`의 `windowState()`와 정합성을 맞춥니다.

| 상태 | 조건 (KST 기준 판정) | 대시보드 카드 시각 처리 |
|---|---|---|
| **정상 (`fresh` / `low` / `limited`)** | `resetsAt`이 아직 지나지 않았고, 확인 시각(`quotaObservation?.observedAt \|\| observedAt`)이 기준 이내(Codex/Claude 15분~1시간, Antigravity 60분 — 스케줄 주기에 맞춰 조정 가능) | 정상 텍스트 색 + 상태 막대(녹/주황/적), `남은 X% · 회복 MM/DD HH:MM · 확인 MM/DD HH:MM` |
| **오래됨 (`stale` / `expired`)** | ① `resetsAt <= now` (**이미 회복 시각이 지나 과거 잔여율이 무효함**) 또는 ② 마지막 확인 시각이 기준 시간 초과(예: Antigravity 60분 초과, 그 외 15~30분 초과 또는 `24시간` 이상 경과) | **행 전체 회색 톤 다운** (`.is-stale` 클래스: 텍스트 `#7a8399`, 카드 배경 톤다운, 진행 막대 `#8992a7`), 명시적 **`오래됨`** 회색 배지 표시, 숫자 옆에 `(과거 기록)` 또는 `회복 경과` 표시해 최신 값과 오인되지 않게 함 |
| **미수집 (`unknown`)** | 해당 슬롯 기록 없음 | 회색 행 + **`미확인`** 배지 + `PC 연결 또는 직접 입력 필요` |

- **대표 윈도우 선택 규칙**: 계정에 `session`(5시간)과 `weekly`(주간) 두 창이 모두 있을 때는 **남은 비율이 더 적은(먼저 막히는) 창**을 대표 행으로 보여주고, 툴팁/보조 문구로 나머지 창을 병기하면 좁은 대시보드 카드에서도 실용적입니다.

---

## 5. 질문 / 확인 필요 사항 (조사 제약으로 직접 못 본 항목)

현재 작업 조건(파일 읽기/쓰기만 허용, 쉘 실행 및 `histfix` 외부 파일 열람 금지)으로 인해 아래 로컬 환경 사실은 직접 확인하지 못했습니다. 구현 착수 전 확인이 필요합니다.

1. **PC의 `.ai-budget-private/summary.json` 실제 내용**: 현재 이 PC의 `.ai-budget-private/summary.json` 안에 `codex-1`과 `codex-2`가 어떻게 들어가 있는지(혹시 `codex-2`에 최근 값이 들어가고 `codex-1`만 10.18로 남아 있는지, 아니면 `errors`에 실패 사유가 찍혀 있는지).
2. **Codex 두 계정의 폴더 경로 및 로그인/세션 로그 구조**:
   - 주력·보조 계정이 실제로 각각 어떤 `CODEX_HOME` 폴더로 분리되어 있는지.
   - 그 폴더 안의 `sessions/YYYY/MM/DD/rollout-*.jsonl` 파일에 실제로 `token_count` / `rate_limits` JSON 필드가 최신으로 남는지.
   - 두 폴더 모두 `codex app-server` 조회 시 만료되지 않은 세션을 유지하는지.
3. **Claude Code `statusLine` 설정 여부**: 현재 PC의 Claude Code 설정(`settings.json`)에 `hani-ai-budget-bridge.mjs claude-statusline` 파이프가 연결되어 있는지, 그리고 `claude` CLI가 비대화형으로 `/usage`를 출력할 수 있는지.
4. **대시보드 및 `codex-2` 표시 범위 확인**:
   - `#aiBudget`과 대시보드 카드에서 `v2.9.289` 때 숨겼던 `Codex 보조(codex-2)`를 다시 표시할지, `Gemini CLI(무료)`는 계속 숨길지.
5. **동기화 범위 결정 (`회장님 승인 필요` 여부)**:
   - 이 PC 브라우저에서만 최신이면 충분한지(승인 불필요한 기존 로컬 브리지 경로), 아니면 모바일 HANI OS에서도 PC가 수집한 AI 사용량을 보고 싶으신지(새 Cloud 테이블/Edge Function 또는 `hani_os_life_v23` 변경 → **회장님 승인 필요**).
