# 어두운 마감 색 고치기 1차 (FIX-1)

- **기준 문서**: `.agy-task.md`, `artifacts/theme-audit/REVIEW-dark.md`
- **대상 범위**: `REVIEW-dark.md` Top 2, Top 3, Top 4, Top 5, Top 8, Top 10(대비만)
- **수정 파일**:
  - `hani-design-system.css` (`/* dark finish fix 1 */` 섹션 추가, `2271–2548`행)
  - `hani-study-v02984.js` (`style()` 내부 동적 `<style>` 문자열 끝부분에 다크 마감 오버라이드 추가, `805–838`행)
  - `scripts/hani-theme-dark-fix.test.mjs` (신규 검증 테스트 작성)
- **설계 원칙**:
  - 추가된 모든 CSS 규칙은 `:root[data-finish="midnight-black"]`와 `:root[data-finish="titanium-graphite"]`로만 시작하도록 제한해 밝은 마감 4종(`ivory-paper`, `warm-linen`, `mist-silver`, `champagne-silk`)에 영향이 없도록 격리했다.
  - 표면·글자·테두리·강조 색은 모두 기존 마감 토큰(`--surface-*`, `--text-*`, `--border-*`, `--structure-*`, `--invest-*`, `--collection-light`, `inherit`)만 사용했으며 하드코딩 색상을 추가하지 않았다.
  - JS 로직, 데이터/스토리지(`hani_os_life_v23`, `localStorage`, Cloud), 기존 테스트/해시/픽스처는 수정하지 않았다.

---

## 1. Top별 수정 내역 (`파일:선택자`)

### Top 2: 강제 `#fff` / 어두운 잉크(`#283044`, `#28374c`) 다크 마감 오버라이드
`hani-design-system.css` 말미(`2272–2391`행)에서 `body[data-finish-active]` 및 개별 뷰의 강제 화이트 배경·어두운 글자 오버라이드를 다크 마감 토큰으로 재정의했다.
- `hani-design-system.css`: `:root[data-finish="midnight-black" | "titanium-graphite"] #app .ai-team-profile-role` (`#f6f4fa`/`#49385f!important` -> `var(--surface-raised)`/`var(--text-primary)`)
- `hani-design-system.css`: `:root[data-finish="midnight-black" | "titanium-graphite"] body[data-finish-active] :is(.asset-dashboard-card,.home-briefing-panel,.home-board-shell,.home-panel,.board-card,.board-panel,.ai-card,.ai-brief-card,.ai-log-card,.intake-card,.intake-panel,.ledger-card,.ledger-panel,.panel,.card,...,.package-card)` (`--surface-panel`/`--text-primary` 등 변수를 `inherit`로 복원해 순환 참조 없이 `var(--surface-panel)`/`var(--text-primary)`/`var(--border-subtle)` 적용)
- `hani-design-system.css`: `:root[data-finish="midnight-black" | "titanium-graphite"] body[data-finish-active] :is(.stat,#assetComposition .item,.module-kpi)` (`var(--surface-raised)`, `var(--text-primary)`, `var(--border-subtle)`)
- `hani-design-system.css`: `:root[data-finish="midnight-black" | "titanium-graphite"] body[data-finish-active] :is(.home-briefing-panel,...,.milestone-card) :is(h1,h2,h3,h4,h5,p,span,strong,b,label,dt,dd,td,th,li,a,button,input,select,textarea,summary,small,.sub,.muted,.kicker,.meta,.caption)`
- `hani-design-system.css`: `:root[data-finish="midnight-black" | "titanium-graphite"] #app :is(#asset,#home) .account-card .account-value` (`#283044!important` 혼합 -> `var(--text-primary)` 혼합)
- `hani-design-system.css`: `#app #yunaTargetHelp`, `#app #assetStats .stat:has(.asset-evaluation)`
- `hani-design-system.css`: `#app #travel .module-kpi`, `#app #travel :is(.travel-tabs,.travel-card,.travel-wish-copy,.travel-planning-note,.travel-place-row,.travel-source-note)`, `#app #travel .travel-tabs button`, `#app #travel .travel-tabs button.active`, `#travelTripDetailModal :is(.modal-card,.travel-detail-box,table,th,td,tr)`
- `hani-design-system.css`: `#app #investment .invest-tabs`, `#app #investment .invest-tab`, `#app #investment .invest-tab.active`, `#app #investment :is(.invest-live,.invest-live-head,.broker-stats,.invest-broker-card,.invest-holding-row,.invest-order-row)`, `#app #investment :is(.stat,.broker-stat-card,.kpi-chip) :is(...)`
- `hani-design-system.css`: `#app #investmentIntake :is(.asset-capture-account-first,.asset-paste-zone,.asset-capture-preview header,.asset-preview-actions,.asset-account-edit-row,.asset-holding-preview,.asset-position-row,.asset-position-confirm)` (`hani-style-07.css:653-659` 대응)
- `hani-design-system.css`: `#app #study .study-main-empty`, `#app #diary [data-diary-view]`, `#app #diary [data-diary-view].active`
- `hani-design-system.css`: `#app #home .home-cal-day`, `#app #home .home-task-mini-item i`, `#app #home .home-update-item.is-done`, `#app #home .home-update-item.is-wait`
- `hani-design-system.css`: `#app :is(#reading,#movie,#diary) .phase1-collapsible-form`, `#app :is(#reading,#movie) :is(.media-work-row,.media-work-placeholder,.media-episode-row,.series-archive-v2,.series-progress-card)`, `#app #movie :is(.series-progress-summary span,.series-episode-list>span)`
- `hani-design-system.css`: `#app #wishlist :is(.wishlist-review-state,.wishlist-ai)`
- `hani-design-system.css`: `#app #game :is(.sports-view-tabs,.sports-update-policy,.sports-legacy-note,.team-madrid)`, `#app #game :is(.sports-home-logo,.sports-team-logo,.sports-match-logo)` (검은색 `dplus-kia.svg` 식별 유지를 위해 `color-mix(in srgb,var(--text-primary) 85%,var(--surface-panel))` 적용), `#app #game :is(.sports-home-team em,.sports-result strong)`
- `hani-design-system.css`: `#app #aura .tabs`, `#app #aura .tab`, `#app #aura .tab.active`, `#app #aura :is(.aura-preview,.aura-poster-signature)`
- `hani-design-system.css`: `#app :is(#diet,#certificate) .date-mode-toggle`, `#app :is(#diet,#certificate) .date-mode-toggle button.active`, `#app :is(input[type="date"],input[type="time"],input[type="datetime-local"],select,textarea,input)` (`color-scheme:dark`)

### Top 3: 좌측 사이드바 (로고 박스·백색 아이콘 대비·낙엽 띠)
`hani-design-system.css` (`2394–2431`행):
- `#sidebar .sidebar-team-mini`, `#sidebar .sidebar-corporate-lockup`, `#sidebar .hani-brand-logo-frame`, `#sidebar .sidebar-corporate-copy`, `#sidebar .sidebar-corporate-copy small`, `#sidebar .sidebar-team-face` (흰 로고/임원 카드 박스 어둡게 정리)
- `#sidebar .nav-home .nav-btn`, `#sidebar .nav-home .nav-btn.active`
- `#sidebar .dashboard-nav .ico`, `#sidebar .nav-home .nav-btn .ico`, `#sidebar :is(.group-body,.side-bottom) .nav-btn .ico`, `#sidebar .nav-btn.active .ico` (기존 `hani-style-01.css:1070`의 `#fff!important` 배경 위에 `color:var(--text-primary)!important`가 올라가 흰 배경+흰 아이콘이 되던 문제를 다크 배경 토큰으로 교정)
- `#sidebar .nav-aura:before`
- `.season-frame-band` (어두운 마감 위 반복 SVG 낙엽 띠를 `var(--collection-light, var(--structure-accent))` 기반 수평 그라데이션 라인으로 치환; DOM 숨김 없이 장식 톤 정리)

### Top 4: `titanium-graphite` 및 `[data-theme="dark"]` 누락 (`milestones`, `agentReview`, `ilbo`, `procrastination`)
`hani-design-system.css` (`2434–2472`행):
- `milestones` (`titanium-graphite` 전용 보완): `:root[data-finish="titanium-graphite"] #app #milestones > .ds-main-character-banner`, `:root[data-finish="titanium-graphite"] #app #milestones .ms-tier` (`midnight-black`만 매칭하던 기존 `:1873`, `:1939` 보완)
- `agentReview`: `#app #agentReview .hani-office-live`, `.hani-office-live-head p`, `:is(.hani-building-rooms,.hani-building-roster li,.hani-office-meeting)`, `.hani-building-tabs button`, `.hani-building-tabs [aria-selected="true"]`, `:is(.hani-building-tabs small,.hani-building-floor-label,.hani-building-overflow)`, `.hani-building-roster b`, `.hani-office-participants span`
- `ilbo`: `#app #ilbo :is(.ilbo-nameplate-illustrated,.ilbo-nameplate-copy,.ilbo-sheet,.ilbo-lead,.ilbo-brief,.ilbo-card,.ilbo-kpi,.ilbo-sidecard)`, `#app #ilbo .ilbo-eyebrow`
- `procrastination`: `#app #procrastination`, `#app #procrastination [data-pb-card]` (`--pb-bg`, `--pb-card`, `--pb-soft`, `--pb-line`, `--pb-ink`, `--pb-muted`, `--pb-tint` 재정의)

### Top 5: 뒤늦게 로드/주입되는 기능 CSS (`intake`, `dev`, `deployment`, `organization`, `study`)
- **`hani-design-system.css` (`2475–2497`행)**: `:root[data-finish="..."] #app ...`의 높은 명시도(`(0,2,0)`+`#app`)로 후순위 로드 스타일시트(`hani-yuna-helpdesk.css`, `hani-development-history.css`, `hani-style-07.css`, `hani-organization-hub.css`)를 덮어씀:
  - `intake`: `#app #intake :is(.yuna-desk,.yuna-conversation,.yuna-preview,.yuna-route,.yuna-resume,.yuna-mobile-head,.yuna-composer,.yuna-composer textarea,.yuna-category-row select,.yuna-chips button)`, `#app #intake .yuna-chips button.active`
  - `dev`: `#app #dev :is(.hani-development-snapshot,.hani-dev-history-overview,.hani-history-kpis>div,.hani-history-toolbar,.hani-history-row,.hani-history-row code,.hani-history-status)`
  - `deployment`: `#app #deployment :is(.deploy-exec-status,.deploy-exec-icon,.deploy-mode,.deploy-status,.deploy-progress span,.deploy-inbox-kpi,.deploy-inbox-summary,.deploy-queue-card,.deploy-result,.deploy-file-zone,.deploy-approval-strip,.deploy-advanced,.deploy-package-ingest,.hina-qa-card,.hina-qa-check,.hina-qa-badge)`, `#app #deployment .deploy-progress span.active`
  - `organization`: `#app #haniOrganizationHub :is(.ogh-person-image,.ogh-placeholder,.ogh-detail-portrait,.ogh-detail-team-art,.ogh-stats>div,.ogh-employee)`, `#app #haniOrganizationHub .ogh-detail-link`, `#app #haniOrganizationHub :is(.ogh-team-copy>small,.ogh-person-caption>small)` *(Top 7 대상 `.ogh-hero-copy`, `.ogh-hero-art>img` 제외)*
- **`hani-study-v02984.js` (`805–838`행)**: 런타임에 `<head>` 말미로 `<style id="hani-study-v02984-style">`가 주입되는 구조상 `style()` 내 CSS 문자열 끝에만 다크 마감 규칙 추가:
  - `#study.hani-study-v02984` 변수(`--study`, `--study-soft`, `--study-line`, `--panel`, `--line`)
  - `:is(.study-chip,.study-subtabs,.study-card-v02984,.study-project-row,.study-project-form input,.study-project-form select,.study-focus-chip,.study-today-card,.study-board,.study-board th,.study-board td,.study-question,.study-choice,.study-explanation,.study-dispute textarea,.study-submit-wrap,.study-wrong-row,.study-wrong-meta span,.study-wrong-group,.study-wrong-answer div,.study-retry,.study-history-card,.study-status)`
  - `.study-subtab.is-active`, `.study-project-row.is-active`, `.study-focus-chip:has(input:checked)`, `.study-board-row:hover`, `.study-board-row.is-active`, `.study-board-no`, `.study-board-score`, `.study-kicker`, `.study-wrong-group summary:after`, `.study-project-row .study-project-state(.paused)`, `.study-question.is-graded .study-choice.is-correct/.is-wrong`, `.study-popup-exam [data-exam-stamp] strong`, `.home-task-mini-item.learning-derived`, `.home-task-mini-item.learning-derived>i`

### Top 8: 홈 대화상자·공유 말풍선·가계부 지은 코멘트
`hani-design-system.css` (`2500–2527`행):
- `#app .home-dialogue-shell`, `.home-dialogue-avatar`, `.home-dialogue-copy h3`, `.home-dialogue-speaker`, `#homeDialogueText`, `.home-dialogue-line`
- `#app :is(.ds-agent-comment>div,.ds-jieun>div)`, `#app :is(.ds-agent-comment>img,.ds-comment-portrait)`
- `#app .ledger-jieun-comment`, `#app #ledgerJieunComment`, `#app .ledger-comment-head :is(span,h4)`

### Top 10 (대비만): 어두운 배경 위 저대비 텍스트(`#7656b3`, `#e0393e`) 교정
`hani-design-system.css` (`2530–2548`행) 및 `hani-study-v02984.js`:
- `#app .phase1-collapsible-form>summary em` (`#diary` 등 `"열기"`/`"접기"` 글자가 `--ds-season:#7656b3`으로 떨어져 `#2d2f33` 위 ~2.04:1이던 문제를 `var(--structure-accent)`로 올려 >= 4.5:1 확보)
- `#app .wishlist-item-card details summary`, `#app .media-work-identity span`, `#app .media-work-row>details>summary`, `#app #newsroom .newsroom-4cut .newsroom-4cut-cuts b` -> `var(--structure-accent)`
- `#app .phase1-collapsible-form>summary small` -> `var(--text-secondary)`
- `#app #newsroom .newsroom-4cut-context td.is-up` -> `var(--invest-up)`, `td.is-down` -> `var(--invest-down)!important`

---

## 2. 의도적으로 고치지 않은 항목과 이유

| 항목 | 미수정 사유 |
| :--- | :--- |
| **Top 1** (`.ds-main-character-banner`, `.ds-page-hero`) | `.agy-task.md` 명시적 범위 제외(단, Top 4 요청분인 `titanium-graphite`의 `#milestones > .ds-main-character-banner`만 예외 보완). |
| **Top 6** (`investment` KPI 중복 영역) | `.agy-task.md` 명시적 범위 제외(레이아웃·DOM 변경 금지). |
| **Top 7** (`organization` `.ogh-hero-copy`, `.ogh-hero-art>img`) | `.agy-task.md` 명시적 범위 제외. |
| **Top 9** (`HANI REMOTE` 상태/동기화 UI) | `.agy-task.md` 명시적 범위 제외. |
| **Top 10 중 영어 라벨/문구** (`Investment Live`, `HANI LIFE ·`, `NEWSROOM` 등) | `.agy-task.md` 금지 사항("영어 문구를 번역하거나 바꾸지 마라", 대비만 수정). |
| **글꼴 크기 전역 변경** | `.agy-task.md` 금지 사항("글꼴 크기를 전반적으로 바꾸지 마라"). |
| **밝은 마감 4종** (`ivory-paper`, `warm-linen`, `mist-silver`, `champagne-silk`) | 추가한 모든 규칙을 `:root[data-finish="midnight-black"]`, `:root[data-finish="titanium-graphite"]`로만 제한해 기존 동작 100% 보존. |
| **JS 로직 / `hani_os_life_v23` / `localStorage` / Cloud / `index.html`** | `.agy-task.md` 금지 사항. `hani-study-v02984.js`도 `style()` 내부 CSS 문자열만 수정. |
| **기존 테스트 / 해시 / 픽스처** | `.agy-task.md` 금지 사항("기존 테스트나 해시, 픽스처를 건드리지 마라"). |

---

## 3. 기존 테스트 영향 목록 (`hani-design-system.css` / `hani-study-v02984.js` 해시·역변환 고정)

이번 수정으로 `hani-design-system.css`와 `hani-study-v02984.js`의 바이트/SHA-256이 변경되었으므로, 기존 릴리스 봉인(exact-input inverse / SHA-256 pin)을 검증하는 아래 기존 테스트들은 실패할 것으로 예상된다(요구사항에 따라 기존 테스트·해시·픽스처는 수정하지 않고 그대로 유지함):

1. `scripts/hani-release-299.test.mjs` — `hani-release-299-source.cjs`의 `afterSha256` 및 `exact release-299 input` 역변환으로 `hani-design-system.css`와 `hani-study-v02984.js` 바이트 일치 여부를 직접 검사.
2. `scripts/hani-design-polish-2.test.mjs` — `hani-design-polish-2-source.cjs`에서 `hani-design-system.css`의 정확한 편집 전후 바이트·SHA-256 역변환 검사.
3. `scripts/hani-design-polish-2-main297.test.mjs` — `hani-design-system.css`의 2.9.297 기준선 역변환 체인 검사.
4. `scripts/hani-release-298.test.mjs` — `hani-release-version-layers.cjs`를 통해 `hani-study-v02984.js` 및 `hani-design-system.css`의 릴리스 레이어 역변환 검사.
5. `scripts/hani-release-297.test.mjs` — `hani-design-system.css`의 2.9.297 릴리스 레이어·SHA-256 역변환 검사.
6. `scripts/hani-release-296.test.mjs` — `hani-design-system.css`의 2.9.296 릴리스 레이어 역변환 검사.
7. `scripts/hani-design-polish-1.test.mjs` — `hani-design-system.css`의 `design-polish-1` 역변환 체인 검사.
8. `scripts/hani-design-polish-1-main295.test.mjs` — `hani-design-system.css`의 `2.9.295` 기준선 역변환 체인 검사.

---

## 4. 검증 현황

- 신규 정적 검증 테스트 파일 `scripts/hani-theme-dark-fix.test.mjs`를 작성해, 다크 마감 접두사 격리, Top 2·3·4·5·8·10 대상 선택자 포함 여부, 토큰 사용(선언 내부 하드코딩 hex/rgb 미포함), 범위 외 선택자/스토리지 키 미포함, `hani-study-v02984.js` `style()` 범위 내 CSS 삽입 여부를 검증하도록 구성했다.
- **실행 상태**: 작업 제약상 셸 명령이 비활성화되어 있어 `node --test scripts/hani-theme-dark-fix.test.mjs` 및 기존 테스트 스위트는 직접 실행하지 못했다(정적 파일 읽기 기반 확인만 완료).

## 2차 손보기

서윤 `after/<finish>__<menu>.jpg` 및 `ba-*.png` 재검토 결과를 반영해 `hani-design-system.css`(`/* dark finish fix 1 */` 홈 대화 상자·뉴스룸 블록 보정 및 `/* dark finish fix 2 */` 추가)와 `scripts/hani-theme-dark-fix.test.mjs`에 회귀 방지 규칙을 반영했다. 모든 추가 선택자는 `:root[data-finish="midnight-black"]` / `:root[data-finish="titanium-graphite"]` 접두사로 격리되며 기존 라이트 마감, 데이터/JS 로직, `localStorage`/`hani_os_life_v23`, Supabase에는 영향이 없다.

### 1. 홈 대화 상자 / 인포데스크 / 투자 / 좌측 로고(주요 항목 1~4)

- **홈(`after/midnight-black__home.jpg`, `after/titanium-graphite__home.jpg`, `ba-home.png`) — 하니 대화 말풍선 내부·대사 pill 가독성 복원**:
  - 1차 패치가 `#homeDialogueText`·`.home-dialogue-line`·`.home-dialogue-speaker`에 `color`만 지정해 연보라(`color-mix` / `#f7f5ff` / `#f2edff`) 및 흰색 pill 바탕 위에 밝은 글자가 올라가는 역전 회귀가 발생했다.
  - 수정 선택자: `.home-dialogue-speaker`, `#homeDialogueText`, `.home-dialogue-line` (같은 다크 선언 블록에 `background:var(--surface-panel)!important;border-color:var(--border-subtle)!important;color:var(--text-primary)!important` 통합), `.home-dialogue-line b` / `.home-dialogue-line span`.
- **인포데스크(`after/midnight-black__intake.jpg`, `after/titanium-graphite__intake.jpg`, `ba-intake.png`) — 대상 안내 흰 띠 제거 및 유나 환영 말풍선·상태 배지 다크화**:
  - 1차 패치 `#app #yunaTargetHelp`가 `#app #intake .yuna-desk #yunaTargetHelp`(명시도+`background:#fff`)에 패배했고, `.yuna-welcome>div:last-child`·`.yuna-bubble`·`.yuna-status`·`.yuna-chips button.is-active` 등이 누락되어 연보라 말풍선 위에 밝은 제목과 어두운 본문이 혼재했다.
  - 수정 선택자: `#app #intake .yuna-desk #yunaTargetHelp`, `#app #intake :is(.yuna-welcome>div:last-child,.yuna-bubble,.yuna-plus,.yuna-photo,.yuna-voice,.yuna-preview-top,.yuna-preview-actions,.yuna-preview-actions button:not(.is-primary),.yuna-file-pill)`, `#app #intake .yuna-status`, `#app #intake .yuna-welcome b`, `#app #intake .yuna-welcome p`, `#app #intake .yuna-chips button.is-active`.
- **투자(`after/midnight-black__investment.jpg`, `after/titanium-graphite__investment.jpg`, `ba-investment.png`) — 상단 4 KPI 흰 패널과 두 탭 바, 픽 배지 교정**:
  - 1차 패치가 실제 클래스(`.investment-tabs-main`, `.investment-overview-tabs`, `.investment-live`, `.page-nav-context-v02992`, `.tabs`) 대신 `.invest-tabs`·`.invest-live`를 사용해 2214~2216행의 `background:#fff!important` 및 190행의 `.tab.active` 라이트 강조가 그대로 남아 있었다.
  - 수정 선택자: `#app #investment :is(.investment-live,.live-stat,.broker-stats,.broker-kpi,.page-nav-context-v02992,.investment-tabs-main,.investment-overview-tabs,.tabs)`, `.tab:not(.active)`, `.tab.active`, `:is(.investment-live small,.live-stat small,.broker-stats .label,.broker-kpi .label)`, `#app #investment .pill`.
- **좌측 사이드바(`after/*` 공통 좌측 상단 `HANI GROUP · AI TEAM` 브랜드 박스)**:
  - `assets/brand/hani-group-ci-official.webp`가 불투명 흰 바탕 위 보라 로고여서 `.hani-brand-logo-frame` 안에 흰 사각 박스가 노출됐다.
  - 수정 선택자: `#sidebar .hani-brand-logo-frame` (`background:var(--surface-raised)!important;border-color:transparent!important`), `#sidebar .hani-brand-logo-frame>img` (`filter:invert(1) hue-rotate(180deg) saturate(1.1);mix-blend-mode:screen`).

### 2. `after/` 전수 확인 기반 추가 회귀·대비 교정

- **미룸 방지(`after/midnight-black__procrastination.jpg`, `after/titanium-graphite__procrastination.jpg`) — 흰 말풍선 속 흰 글씨 역전**:
  - 1차 패치가 `--pb-bubble`을 재정의하지 않아 `.pb-speech` 바탕이 `#fff`로 유지되고 글자색만 `--text-primary`가 되어 대사가 보이지 않았다.
  - 수정 선택자: `#app #procrastination` (`--pb-bubble:var(--surface-panel);--pb-tint:var(--surface-panel)`), `#app #procrastination .pb-speech`, `#app #procrastination .pb-footer .btn`.
- **뉴스룸(`after/midnight-black__newsroom.jpg`, `after/titanium-graphite__newsroom.jpg`) — 하락 수치 흰 바탕·미정의 토큰 투명화 회귀**:
  - 2222행 `background:#fff!important` 위에 `--invest-down`(자산 뷰 한정 변수)이 미정의 상태로 적용되어 `midnight-black`에서 하락 셀(`11.71% 하락`)이 흰 바탕 위 흰 글자로 소실됐다.
  - 수정 선택자: `#app #newsroom .newsroom-4cut-context td.is-up`, `#app #newsroom .newsroom-4cut-context td.is-down` (`background:transparent!important`, 전역 `:root` `--color-data-up`/`--color-data-down` 기반 `color-mix(..., var(--text-primary))` 사용으로 raw hex 없이 고대비 확보).
- **자산·개발기록·위시리스트·홈 KPI(`after/midnight-black__asset.jpg`, `after/titanium-graphite__asset.jpg`, `after/*__dev.jpg`, `after/*__wishlist.jpg`) — `#app` 명시도 패배 교정**:
  - 645~646행 `body[data-finish-active] #app :is(...)` 및 2167행 `#app #asset #assetStats .stat:has(.asset-evaluation)`이 `#app`이 빠진 1차 패치 규칙(2276~2280·2291행)을 이겨 흰 카드·로컬 `--surface-raised:#f8f9fc`가 복원됐다.
  - 수정 선택자: `:root[data-finish="..."] body[data-finish-active] #app :is(...)`, `#app #asset #assetStats .stat:has(.asset-evaluation)` + `.label`/`.value.asset-evaluation`, `#app #dev .hani-history-kpis b`/`small`, `#app #dev .hani-history-list .hani-history-row` 및 메타 텍스트, `#app #wishlist :is(.wishlist-kpis>div,#wishlistCount,.wishlist-guide-icon)`.
- **아우라(`after/midnight-black__aura.jpg`, `after/titanium-graphite__aura.jpg`) — 프리뷰 어두운 본문·활성 탭 라이트 강조**:
  - 수정 선택자: `#app #aura .aura-preview :is(figcaption,h3)`, `:is(.aura-preview-kicker,.aura-campaign-description,.aura-campaign-cast,.aura-poster-signature,.aura-poster-signature>span)`, `#app #aura .aura-tabs`, `#app #aura .tab.active`.
- **배포센터(`after/midnight-black__deployment.jpg`, `after/titanium-graphite__deployment.jpg`) — 실행 상태 안내·큐 카드 어두운 글자·미적용 배지**:
  - 수정 선택자: `#app #deployment .deploy-exec-copy h3`, `:is(p,.deploy-exec-note,.deploy-exec-kicker)`, `:is(.deploy-queue-card,.deploy-inbox-card,.deploy-step,.deploy-queue-head em,.deploy-queue-meta span,.deploy-mini,.deploy-result)`, `.deploy-queue-head b`, `:is(.deploy-queue-head span,.deploy-queue-card p,.deploy-mini span,.deploy-card-head p)`.
- **여행 / 게임 / 독서·영화·다이어리 / 날짜 모드 토글(`after/titanium-graphite__travel.jpg`, `game.jpg`, `reading.jpg`, `movie.jpg`, `monthlyReport.jpg`, `ledger.jpg`)**:
  - 여행 KPI 보조 문구: `#app #travel .module-kpi :is(small,.sub)`.
  - 게임 레알 마드리드 패널 어두운 팀 변수(`#131927`) 및 WIN/LOSS 배지: `#app #game .sports-home-panel.team-madrid`, `.sports-home-team em`(`.win`/`.loss`), `:is(.sports-home-foot>small,.sports-update-policy span)`.
  - 접힘 폼 흰 바탕·배지: `#app :is(#reading,#movie,#diary) .phase1-collapsible-form`, `>summary`, `>summary em` (`!important`).
  - 전역 `.date-mode-toggle`(월간 리포트·가계부 등 포함): `#app .date-mode-toggle`, `.date-mode-toggle button.active`.

### 3. 검증 및 실행 상태

- `scripts/hani-theme-dark-fix.test.mjs` 하단에 2차 회귀 방지 테스트 2건(홈 대화 상자 `#homeDialogueText`·`.home-dialogue-line`·`.home-dialogue-speaker`의 바탕·글자색 동일 다크 블록 공존 검증, 2차 수정 대상 선택자 전수 포함 및 괄호 균형·접두사 격리 검증)을 기존 테스트 변경 없이 추가했다.
- **실행 상태**: 작업 제약상 셸 명령을 사용할 수 없어 `node --test scripts/hani-theme-dark-fix.test.mjs`는 실행하지 못했으며, 수정된 CSS·테스트 파일 전체를 다시 읽어 구문, 중괄호/괄호 균형, 다크 접두사 격리, raw hex/rgb 미사용 여부를 정적으로만 확인했다. 실제 `after/` 스크린샷 재렌더 및 `node --test` 실행은 이후 환경에서 필요하다.
