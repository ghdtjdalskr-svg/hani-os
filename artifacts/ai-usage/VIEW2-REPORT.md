# AI 예산 뷰(`#aiBudget`) · 대시보드 AI 연료 카드(`#homeAiFuelCard`) UI Polish 1 정합 점검 보고 (2차)

- 작성: 세린 (Gemini)
- 기준 브랜치: `hani/ai-budget-view` (최신 `main` `2.9.305` / `UI Polish 1` 머지 상태)
- 작업 제약: 파일 읽기/쓰기/편집 도구만 사용 (`run_command` 미사용, 커밋·테스트 실행은 서윤 담당)

## 회장님용 3줄 요약
1. 대시보드 `AI 연료` 카드가 PC·모바일 모두 라이프 마켓 지표(`#lifeMarketGrid` 계열) 바로 아래 오도록 `#home` 직속 승격 및 `order:-15` 규칙(PC·모바일 각 1줄)을 반영했습니다.
2. 어두운 마감 2종(`midnight-black`, `titanium-graphite`)에서 4.5:1 미달이던 진행 바(`3.79:1~4.25:1`)와 저대비 테두리·칩을 마감 토큰(`--surface-canvas`, `--surface-raised`, `--structure-accent`, `--text-primary/secondary/muted`, `--border-strong`)으로 교체해 모두 4.5:1 이상을 확보했습니다.
3. `#aiBudget` 버튼 충돌 없음(`--structure-accent` 통일 준수)과 저장소 불변(`hani_ai_budget_summary_v1` 단독 쓰기·`hani_os_life_v23`/Cloud 무변경)을 코드 수준으로 재확인했습니다.

---

## 1. `#homeAiFuelCard` 위치 점검 및 수정
- **원인**: `index.html:374-389`에서 `#homeAiFuelCard`가 `.home-lower-grid` 내부에 위치해 있습니다. `UI Polish 1`(`hani-design-system.css:2784-2863`)은 `#home.active`를 flex column으로 배치하며 `.home-lower-grid`에 PC `order:-25`, `#lifeMarketGrid`에 `order:-18` (`#lifeMarketBanner` `-17`, `#lifeMarketFeatured` `-16`), `.home-dashboard-grid`에 `order:-10`을 지정합니다. 모바일(`@media(max-width:700px)`)은 `.home-lower-grid{display:contents!important}`(`2844행`)라 자식 `order`가 먹지만, PC는 `.home-lower-grid`가 `grid` 컨테이너여서 내부 자식에 `order`만 줘서는 `#lifeMarketGrid` 아래로 내려갈 수 없었습니다.
- **수정 (`UI Polish 1` 블록 무수정)**:
  - `hani-ai-budget.js:175-176`: 초기 로드 시 `#homeAiFuelCard`의 부모가 `#home`이 아니고 `homeNode.appendChild`가 존재할 때만 `#home` 직속 자식으로 1회 이동합니다(저장소 쓰기 없음, Node VM 최소 mock 안전). *참고: `index.html` 1~390행의 CRLF/LF 혼재로 다중행 `edit_file`이 매칭되지 않아 `index.html` 대규모 재작성을 피하고 최소 JS 승격을 선택했습니다.*
  - `hani-ai-budget.css:43`: `#app #home>.home-ai-fuel-card{...;order:-15}` (PC용 1줄)
  - `hani-ai-budget.css:97`: `@media(max-width:700px){#app #home>.home-ai-fuel-card{order:-15}...}` (모바일용 1줄)
  - 결과 순서: `#lifeMarketGrid(-18)` → `#lifeMarketBanner(-17)` → `#lifeMarketFeatured(-16)` → **`#homeAiFuelCard(-15)`** → `.home-dashboard-grid(-10)`

## 2. 어두운 마감 2종(`midnight-black`, `titanium-graphite`) WCAG AA 대비 점검 (>= 4.5:1)
기준 토큰 (`hani-design-system.css:542-543`):
- `midnight-black`: `--surface-canvas:#0e0f12` / `--surface-panel:#15171c` / `--surface-raised:#1b1e24` / `--text-primary:#f5f2ed` / `--text-secondary:#b9bac0` / `--text-muted:#a8a9ae` / `--structure-accent:#c0b6a5`
- `titanium-graphite`: `--surface-canvas:#242528` / `--surface-panel:#2d2f33` / `--surface-raised:#36383d` / `--text-primary:#f1f0ed` / `--text-secondary:#b8b7b2` / `--text-muted:#b0b0b6` / `--structure-accent:#b7b2a6`

### 수정 전 미달·부조화 항목 (CSS 값 계산)
- `#aiBudget .budget-meter i` (`#9f92ff`) vs 트랙 (`#3a4152`): **3.90:1** (4.5:1 미달)
- `#home .home-ai-fuel-bar i` (`#9f92ff`) vs 트랙 (`#3c4352`): **3.79:1** (4.5:1 미달)
- 만료/오래된 바: `#9ca3af` vs `#3a4152` (**4.02:1**), `#a3aab8` vs `#3c4352` (**4.25:1**) (모두 4.5:1 미달)
- `.home-ai-fuel-row` 배경 `#20242c`는 `titanium-graphite` 패널(`#2d2f33`)보다 어둡고 테두리 `#444b5a` 대비가 낮았음(약 1.5:1). 칩 테두리(`#4a556b`, `#576073`, `#535c6e`)도 `#2d2f33` 위에서 약 1.76:1~2.09:1로 약했음.

### 마감 토큰 교체 후 (`hani-ai-budget.css:60-95`)
- **진행 바 트랙** (`.budget-meter`, `.home-ai-fuel-bar`): `var(--surface-canvas)` + `inset 0 0 0 1px var(--border-strong)`
- **진행 바 채움**:
  - 기본 (`--structure-accent`): `midnight-black` **9.51:1** / `titanium-graphite` **7.25:1** (트랙 대비)
  - 고사용 경고 (`#f0a352`): `midnight-black` **9.19:1** / `titanium-graphite` **7.35:1**
  - 오래됨·만료 (`--text-muted`): `midnight-black` **8.16:1** / `titanium-graphite` **7.12:1**
- **칩 (`.budget-chip-*`)**:
  - `age` (`--surface-raised` / `--text-primary` / `--border-strong`): **14.5:1** / **10.29:1**
  - `stale` (`--surface-canvas` / `--text-primary` / `--border-strong`): **17.4:1** / **13.4:1**
  - `reset` (`--surface-raised` / `--structure-accent` / `--structure-accent`): **8.28:1** / **5.55:1**
  - `unknown` (`--surface-canvas` / `--text-secondary` / `--border-strong`): **9.74:1** / **7.63:1**
  - `fail` (`#3d1e27` / `#ffd6dc` / `#c96e84`): **11.24:1** (오류 시인성 유지, 테두리 보강)
- **텍스트·카드 행**: `--budget-accent:var(--structure-accent)` 지정; `.home-ai-fuel-row`를 `var(--surface-raised)` + `var(--border-strong)`으로 교체; 보조 문구 `var(--text-secondary)` 적용(`midnight-black` **8.5:1+**, `titanium-graphite` `--surface-raised` **5.84:1**, `--surface-panel` **6.67:1**).
- `[data-theme="dark"]` 단독 사용 시 라이트 루트 토큰이 섞이지 않도록 `:not([data-finish="midnight-black"]):not([data-finish="titanium-graphite"])`로 AA 다크 헥사 fallback(`#181c24` 트랙 위 `#9f92ff` 6.48:1 / `#b4bac6` 8.53:1)을 분리 유지했습니다.

## 3. UI Polish 1 (요구사항 4) 버튼 통일 규칙 충돌 여부
- `hani-design-system.css:2899-2906`은 `#investmentIntake`, `#deployment`만 제외하고 `.btn.primary` 등에 `var(--structure-accent)` / `var(--structure-on-accent)`를 적용합니다.
- `#aiBudget`의 `index.html:1661,1668` 및 `hani-ai-budget.js:132` 버튼(`.btn`, `.btn.primary`, `.btn.sm`)과 `hani-ai-budget.css:7,39`를 전수 확인한 결과 **고정색·`!important` 충돌 규칙 0건**으로, `--structure-accent` 통일 규칙을 그대로 따릅니다.

## 4. 저장소 불변 재검증 근거 (읽기 전용 감사)
- `hani-ai-budget-core.js:1-99`: `schemaVersion: 1`, `slots`(6개 정의, `hani-ai-budget.js:12`에서 `codex-2`·`gemini-cli` 숨김 유지), `normalize`, `normalizeImport`, `merge`(`observedAt` 비교 및 Claude `transcriptUsage`/`quotaObservation` 분리 보존) 변경 없음.
- `hani-ai-budget.js:3,60,67-72,78-101,148,163,168`: `KEY = 'hani_ai_budget_summary_v1'` 단일 키 유지. `localStorage.setItem`은 `save()`(`60행`) 1곳에만 존재하며 `refresh()` 성공(`148행`), 수동 저장(`163행`), JSON 가져오기(`168행`) 시에만 호출. 초기 로드(`72행`) 및 `renderDashboard()`/`readSummaryReadOnly()`(`67-71, 78-101행`)는 `getItem`만 수행.
- `hani_os_life_v23`·Cloud: `hani-ai-budget-core.js`, `hani-ai-budget.js`에 `hani_os_life_v23` 또는 Supabase/Cloud 쓰기 참조 0건. 신규 storage 키 0건.

## 5. 테스트 보강 및 미실행 범위
- `scripts/hani-ai-budget-view.test.mjs:219-249`: 기존 assertion 삭제·완화 없이, `#homeAiFuelCard`의 `#home` 직속 승격 동작 및 0-write 검증, PC·모바일 `order:-15` CSS 규칙, 다크 마감 `--structure-accent` 진행 바 토큰, `#aiBudget .btn` `!important` 비충돌 assertion을 추가했습니다.
- **미검증 사항**: `run_command` 금지 제약으로 `node scripts/hani-ai-budget-view.test.mjs`, `node scripts/hani-ai-budget.test.mjs` 및 실제 브라우저(`midnight-black` / `titanium-graphite`, PC·모바일 뷰포트) 시각 확인은 실행하지 못했습니다. 서윤 측 테스트 실행을 권장합니다.
