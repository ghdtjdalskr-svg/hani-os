# 밝은 마감 4종 1차 수정 보고서 (LIGHT-FIX-1)

- 대상 마감: `porcelain-cream`, `pure-white`, `sakura-pink`, `alpine-blue`
- 수정 파일: `hani-design-system.css` 끝부분 `/* light finish fix 1 */` 섹션 (CSS 전용 패치)
- 검증 테스트 추가: `scripts/hani-theme-light-fix.test.mjs`
- 비고: 이 세션은 파일 읽기/쓰기 도구만 허용되어 셸 테스트(`node --test`)는 직접 실행하지 않았습니다.

---

## 1. L1 — 하드코딩된 파란색 / 보라색 / 남색 / 청록 포인트를 마감 토큰으로 통일

### 바꾼 선택자
- 전역 금융 버튼·탭·퀵점프:
  - `.btn.finance`, `.view .tabs`, `.view .tabs .tab:not(.active)`, `.view .tabs .tab.active`, `.quick-jump-icon`, `.quick-jump-item:hover`, `.quick-jump-item:focus`
- 배포 센터(`#deployment`):
  - `.deploy-btn.primary`, `.deploy-kicker`, `.deploy-mode`, `.deploy-step`, `.deploy-progress span.active`, `.hina-qa-badge:not(.pass):not(.fail)`
- 공부(`#study.hani-study-v02984`):
  - `--study`, `--study-soft`, `.study-subtab.is-active`, `.study-project-row.is-active`, `.study-card-v02984`, `.learning-derived`
- 에이전트 리뷰 / 하니 오피스(`#agentReview`):
  - `.hani-office-live-head small`, `.hani-office-live-actions span`, `.hani-building-tabs [aria-selected="true"]`, `.agent-summary`, `.agent-case-item:hover`, `.agent-case-item.active`, `.agent-step.current`
- 조직도(`#organization`, `#haniOrganizationHub`):
  - `.organization-tabs [role="tab"][aria-selected="true"]`, `--ogh-ink`, `--ogh-muted`, `--ogh-paper`, `--ogh-line`, `--ogh-soft`, `--ogh-inverse`, `.ogh-hero h1 em`, `.ogh-team-tabs button[aria-selected="true"]`, `.ogh-cta`, `.ogh-seal`
- 투자위원회(`#investmentCommittee`), 여행(`#travel`), 유나 접수처(`#intake.yuna-helpdesk`), 개발 기록(`#dev`), 영화/시리즈(`#movie`), 보드(`#board`), 설정(`#aura`), 식단/운동 5번째 카드(`#dietStats .stat:nth-child(5)`, `#exercise .stat:nth-child(5)`):
  - `--ic-navy`/`--ic-cobalt`/`--ic-gold`, `--travel-deep`/`--travel-warm`/`--travel-sand`/`.travel-tabs`, `--yuna-lavender*`/`.yuna-status`/`.yuna-chips`/`.yuna-send`/`.intake-route-strip`, `.hani-history-kpis b`/`.hani-history-toolbar`/`.hani-history-status`/`.hani-history-marker`, `.series-archive-v2`/`.series-episode-list i`, `.board-tabs`/`.board-tab[aria-pressed="true"]`, `#launchGreetingEnabled` `accent-color` / `#aura .aura-tabs .tab.active`

### 어느 사진의 어느 부분이었는지
- `artifacts/theme-audit/shots/pc/sakura-pink__ledger.jpg`: 상단 `이번 달`·`가계부 확정본 붙여넣기 >` 등 `.btn.finance` 버튼과 활성 탭이 코발트 블루로 뜸
- `artifacts/theme-audit/shots/pc/sakura-pink__investment.jpg`: 금융 포인트 버튼 및 활성 탭
- `artifacts/theme-audit/shots/pc/porcelain-cream__deployment.jpg`: `AUTO` 배지(`.deploy-step`), 실행 버튼(`.deploy-btn.primary`) 보라색
- `artifacts/theme-audit/shots/pc/sakura-pink__study.jpg`: 서브탭, 선택된 프로젝트/카드, 파생 학습 박스의 보라색(`#6d5bd0`)
- `artifacts/theme-audit/shots/pc/sakura-pink__agentReview.jpg`: 하니 오피스 건물 탭과 live 액션 배지 보라색
- `artifacts/theme-audit/shots/pc/sakura-pink__organization.jpg`: 조직도 탭, `.ogh-hero h1 em`, `.ogh-cta`, `.ogh-seal` 남색/파랑
- `artifacts/theme-audit/shots/pc/sakura-pink__investmentCommittee.jpg`: 위원회 카드/배지 남색·코발트 포인트
- `artifacts/theme-audit/shots/pc/sakura-pink__travel.jpg`: `여행 아카이브` 활성 탭과 청록 포인트
- `artifacts/theme-audit/shots/pc/sakura-pink__intake.jpg`: 유나 데스크 라벤더 칩·상태 배지·전송 버튼
- `artifacts/theme-audit/shots/pc/sakura-pink__dev.jpg`: 개발 기록 KPI 숫자·툴바·마커 보라색
- `artifacts/theme-audit/shots/pc/sakura-pink__board.jpg`: 보드 탭 활성 버튼
- `artifacts/theme-audit/shots/pc/alpine-blue__aura.jpg`: 시작 인사 체크박스(`#launchGreetingEnabled`) 기본 브라우저 파랑(`#4285f4` 계열)과 탭
- `artifacts/theme-audit/shots/pc/alpine-blue__diet.jpg`: 5번째 `목표` 통계 카드의 파란 테두리·텍스트

---

## 2. L2 — 둥근 배지(`.pill`)와 학기 상태칩 통일

### 바꾼 선택자
- `#app .pill:not(.danger):not(.cloud-ok):not(.cloud-warn):not(.cloud-error):not(.health)`
- `#app #university .campus-semester-status:not(.archived)` / `.campus-semester-status.archived`

### 어느 사진의 어느 부분이었는지
- `artifacts/theme-audit/shots/pc/sakura-pink__travel.jpg`: 상단 `0회` 등 기본 `.pill`의 연보라 바탕
- `artifacts/theme-audit/shots/pc/sakura-pink__investment.jpg`: `MONTHLY PICKS` 등 `.pill.finance`의 파란 바탕
- `artifacts/theme-audit/shots/pc/sakura-pink__university.jpg`: 학기 상태 배지(`.campus-semester-status`)의 파란/고정 색감

---

## 3. L3 — 마감 색과 어긋나는 흰색(`#fff`) / 크림색(`#fbf6ee` / `#fffaf2`) 고정 박스 정리

### 바꾼 선택자
- 로컬 `--surface-panel: #fff` / `--surface-raised: #f8f9fc` 덮어쓰기 초기화(`inherit`) 및 배경·테두리 토큰 재적용
- `#milestones > .ds-main-character-banner`, `#ilbo .ilbo-nameplate-illustrated`, `.ilbo-nameplate-copy`
- `#deployment .deploy-exec-status:not([data-state="done"]):not([data-state="failed"])`
- `#aura :is(.aura-preview, .aura-poster-signature)` (`@media (min-width: 801px)` 내부 `background: none` 유지)
- `#home > .ds-main-character-banner`, `.home-dialogue-shell`, `#homeDialogueText`, `.home-dialogue-line`, `.ds-jieun > div`, `.ds-agent-comment > div`, `#lifeMarketBanner .mood-copy`
- `#procrastination` (`--pb-card`, `--pb-bubble`, `--pb-muted`, `--pb-accent`)
- `#travel .module-kpi`, `#aiWork :is(.ui26-member, .ai-team-profile-role)`, `#investment :is(.investment-tabs-main, .investment-live, .broker-stats)`, `#study .study-main-empty`
- `#diary [data-diary-view]`, `#newsroom .newsroom-4cut-context td.is-down`, `#newsroom .company-followup-preview`, `.date-mode-toggle`
- `#ledger :is(.ledger-jieun-comment, #ledgerJieunComment, #ledgerJieunEdit)` (`white-space: nowrap` 포함)
- `.sidebar-corporate-lockup` (`img`에 `mix-blend-mode: multiply` 적용해 흰 배경 로고 박스 완화)
- `#game` 탭·노트, `#reading/#movie .phase1-collapsible-form`

### 어느 사진의 어느 부분이었는지
- `artifacts/theme-audit/shots/pc/pure-white__milestones.jpg`: 마일스톤 캐릭터 배너 크림색 배경
- `artifacts/theme-audit/shots/pc/alpine-blue__ilbo.jpg`: 하니일보 제호 카드(`#fffaf2`)
- `artifacts/theme-audit/shots/pc/porcelain-cream__deployment.jpg`: 실행 상태 박스(`.deploy-exec-status`) 크림색
- `artifacts/theme-audit/shots/pc/alpine-blue__aura.jpg`: 마감 프리뷰 카드(`.aura-preview`) 크림/라벤더 톤
- `artifacts/theme-audit/shots/pc/sakura-pink__home.jpg`: 홈 캐릭터 배너·대사창(`#homeDialogueText`)·코멘트 말풍선
- `artifacts/theme-audit/shots/pc/sakura-pink__procrastination.jpg`: 미루기 보드 카드/말풍선 크림색
- `artifacts/theme-audit/shots/pc/sakura-pink__travel.jpg`: `.module-kpi` 흰 카드
- `artifacts/theme-audit/shots/pc/sakura-pink__aiWork.jpg`: AI 팀 프로필 역할 카드 흰 바탕
- `artifacts/theme-audit/shots/pc/sakura-pink__investment.jpg`: `.investment-live`, `.investment-tabs-main`, `.broker-stats`의 흰 `#fff!important` 박스
- `artifacts/theme-audit/shots/pc/sakura-pink__study.jpg`: 공부 메인 빈 상태 카드 흰 바탕
- `artifacts/theme-audit/shots/pc/sakura-pink__ledger.jpg`: 지은 코멘트 박스 흰 배경, `코멘트 수정` 버튼 2줄 줄바꿈, 왼쪽 하단 로고(`.sidebar-corporate-lockup`) 흰 사각 박스
- `artifacts/theme-audit/shots/pc/porcelain-cream__monthlyReport.jpg`: 상단 `.date-mode-toggle` 흰 박스

---

## 4. L4 — 흐린 글자, 월간 보고서 어두운 카드, 식단 목표 줄바꿈, 제미나이 보고서 잘림

### 바꾼 선택자
- `#app .footer`, `.period-basis`, `.exercise-basis`, `#milestones .ms-year` (`color: var(--text-secondary); opacity: 1;`)
- `#monthlyReport`: `--report-*` 변수, `.monthly-report-shell`, 탭, 기간 입력, 아카이브, 대기 버튼(`:disabled` 대비 포함), 히어로, KPI, 인사이트, 도메인 카드, 미래 카드까지 밝은 마감 토큰으로 전환
- `#diet .stats` (`@media (min-width: 1101px)`에서 `grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(200px, 1.55fr)`), `#dietStats .stat:nth-child(5) .value` (`clamp(14px, 1.25vw, 16px)`)
- `#geminiReports` / `.gemini-report-table-wrap` / `.gemini-report-detail` / `.gemini-report-detail table`: 데스크톱 `min-width: 0` 및 가로 스크롤 컨테이너 지정, `@media (max-width: 760px)`에서 테이블 `min-width: 480px`

### 어느 사진의 어느 부분이었는지
- `artifacts/theme-audit/shots/pc/sakura-pink__travel.jpg`, `alpine-blue__aura.jpg`: 하단 `.footer` 및 안내 문구(`opacity`로 지나치게 흐린 회색)
- `artifacts/theme-audit/shots/pc/porcelain-cream__monthlyReport.jpg`: 어두운 남색 `.monthly-report-shell` 덩어리, 활성 탭 대비 부족, 흐린 비활성 `보고서 생성` 버튼, 어두운 월 선택 입력칸
- `artifacts/theme-audit/shots/pc/alpine-blue__diet.jpg`: 5번째 `목표` 카드가 좁고 글씨가 커서 `1차 110kg · 2차 100kg`가 `·` 단독 줄 포함 3줄로 꺾임
- `artifacts/theme-audit/shots/pc/sakura-pink__geminiReports.jpg`: `min-width: 760px`로 인해 표 우측 `내용` 열이 카드 경계에서 잘림

---

## 5. 손대지 않은 것과 이유

- **어두운 마감 2종(`midnight-black`, `titanium-graphite`) 및 기존 다크 패치**: 모든 새 규칙에 `:root:not([data-finish="midnight-black"]):not([data-finish="titanium-graphite"])` 가드를 두었고, 기존 `/* dark finish fix 1 */`, `/* dark finish fix 2 */`, `hero banner dark finish` 블록은 수정하지 않았습니다.
- **L5 영어 제목 및 전역 폰트 크기**: 지시 사항에 따라 1차 범위에서 제외했습니다.
- **회장님 리포트 3건(투자 KPI 카드, 조직도 히어로, HANI REMOTE)**: 이 폴더에 이미 반영되어 있어 중복 수정하지 않았습니다.
- **의미 기반 상태색·고유 위젯**: 상승/하락 빨강·파랑, `.btn.health`, `.pill.danger`/`.health`/`.cloud-*`, `.deploy-exec-status[data-state="done"|"failed"]`, `.study-project-state.completed`/`.paused`, `.hani-history-status.is-released`/`.is-pages`/`.is-process`, 스포츠 구단 고유색 카드 4종, `.ledger-market-board`(JISPI 다크 보드), `monthlyReport` 내부 키노트/스토리 씬 배경은 정보 의미를 보존하기 위해 유지했습니다.
- **JS / 데이터 / `localStorage`(`hani_os_life_v23`) / HTML / 이미지 / 기존 테스트·해시·픽스처**: CSS 전용 패치 범위를 지키기 위해 수정하지 않았습니다.
