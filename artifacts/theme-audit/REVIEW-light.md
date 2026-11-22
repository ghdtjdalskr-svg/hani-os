# HANI OS 밝은 마감(4종) 전수 QA 리포트

- **점검자**: 세린 연구원
- **점검 대상**: 밝은 마감 4종 — `porcelain-cream`(포슬린 크림) · `pure-white`(퓨어 화이트) · `sakura-pink`(사쿠라 핑크) · `alpine-blue`(알파인 블루)
- **점검 범위**: `shots/pc/<마감>__<메뉴>.jpg` 37개 메뉴 × 4종 = **148장** (1280×900 데스크톱 · 빈 데이터 상태 · 상단 뷰포트 기준)
- **작성 기준**: [REVIEW-dark.md](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/artifacts/theme-audit/REVIEW-dark.md)에 이미 기록된 **C1~C6(어두운 마감 중심 공통 이슈)은 중복 나열하지 않고**, **밝은 마감 전용 문제**와 **마감 간 색 불일치**(예: 사쿠라 핑크/포슬린 크림 안의 파랑·보라 버튼, 순백/크림 박힘 등)를 중심으로 정리함.
- **전제**: 계산·데이터·저장(`localStorage` `hani_os_life_v23`, Cloud Sync, Schema) 로직은 일절 변경하지 않으며, 보고서의 모든 수정 제안은 CSS 토큰·선택자·마크업 구조 정리 수준에 한정함.

---

## 고칠 순서 Top 10

| 순위 | 대상 | 핵심 문제 | 심각도 | 기대 효과 |
|---|---|---|---|---|
| **1** | **전역 액션·탭 색 (L1)** `.btn.finance`, `.deploy-btn.primary`, `#study`, `#agentReview`, `#organization`, `#investmentCommittee`, `#travel`, `#aura` | `body[data-finish-active] .btn.finance`가 **고정 코발트 블루(`#245eb5`)**이고, 배포센터(`#6f5de7`)·스터디(`#6d5bd0`)·살아있는 오피스(`#7656c4`/`#8363b8`)·회사 소개(`#215ad5`/`#4562e6`)·투자위(`#142640`/`#295bd5`)·여행(`#237c80`)이 모두 마감 토큰을 무시함. **사쿠라 핑크·포슬린 크림에서 파란/보라 버튼이 강하게 튐** | **상** | 10개 이상 메뉴의 버튼·탭·강조색이 4종 마감 팔레트(`--control-accent` / `--control-soft`)와 즉시 통일됨 |
| **2** | **`investment` 투자** (회장님 제보 ①) | 밝은 마감 4종 모두에서 **KPI 줄 2중 중복**(`.investment-live` + `#brokerDashboardStats`) 지속 + 첫 번째 스탯 `기록 없음` 2줄 줄바꿈(`기록 없`/`음`) + `.investment-live`/`.investment-tabs-main`/`.broker-stats` `#fff!important` 강제로 크림·핑크·블루 위 순백 섬 현상 | **상** | 투자 상단 시선 분산 및 카드 깨짐 해소, 마감 서피스 일체감 확보 |
| **3** | **`organization` 회사 소개** (회장님 제보 ②) | 밝은 마감 4종 모두에서 **히어로 단체사진 좌우 미채움(`object-fit:contain`) + 반투명 흰 텍스트 박스(`rgba(255,255,255,.94)`)가 사진 위에 겹침** + 밑줄(`#4562e6`)·활성 탭(`#215ad5`) 파랑 고정 | **상** | 회장님 제보 2번 핵심 구조 결함 해결 및 4종 마감 톤 일치 |
| **4** | **`HANI REMOTE` 우측 사이드바** (회장님 제보 ③) | 밝은 마감 4종 모두에서 **원형 4개 + 네비 4개 중복 버튼**·`home` 기준 **`오늘 할 일` 2~3중 중복**·영문 헤더(`HANI REMOTE`, `SECTION SHORTCUTS`) 지속 + `--remote-primary:#ffead5`(주황 크림)·`--remote-current:#edf0fa`(연보라 청) 하드코딩으로 4종 마감과 색 불일치 | **상** | 전 메뉴 공통 우측 리모컨 혼잡·영문·크림/주황 이질감 일괄 해소 |
| **5** | **전역 크림 고정 & 순백 강제 서피스 (L3)** `#milestones`, `#ilbo`, `#deployment`, `#aura`, `#home`, `#asset`, `#travel`, `#board`, `#study`, `#diary`, `#aiWork`, 사이드바 로고락업 | `hani-design-system.css:645-647, 2201-2228`이 여러 패널을 `#fff!important`로 덮어 크림·핑크·블루 질감을 지우고, `milestones`(`#fbf6ee`)·`ilbo`(`#fffaf2`)·`deployment`(`#fffaf0`)·`home`(`#fff8ef`/`#f9f3ff`)·`aura`(`#fffaf3→#f2edf8`)는 크림/라벤더로 고정됨 | **상** | 마감 전환 시 페이지 전체 서피스가 해당 마감(`--surface-panel` / `--surface-raised`)을 따라 자연스럽게 바뀜 |
| **6** | **전역 `.pill`·상태 뱃지 색 고정 (L2)** `reading`, `movie`, `wishlist`, `travel`, `drive`, `aiWork`, `investment`, `investmentIntake`, `certificate`, `university` | `hani-style-01.css:29` `.pill{background:#efedff;color:var(--primary)}` 및 `.pill.finance`(`#eaf3ff`)·`.pill.growth`(`#fff4e5`)·`.campus-semester-status`(`#eaf3ff`)가 4종 마감 무관하게 연보라·연파랑·연주황으로 뜸 | **중** | 11개 이상 메뉴의 작은 뱃지 색 불일치 일괄 제거 |
| **7** | **`monthlyReport` 월간 보고서** | 밝은 마감 4종에서 본문이 **어두운 네이비 셸(`#0b101d~#111827`)**로 고정되어 마감과 단절됨 + `.monthly-report-pending button:disabled`에 `opacity:.5`가 남아 비활성 버튼 텍스트 저대비 + `.date-mode-toggle`만 순백 박스(`#fff`)로 붕 뜸 | **중** | 밝은 마감 내 짙은 네이비 이질감 완화 및 비활성 버튼 가독성 확보 |
| **8** | **하단 `.footer` & 보조 문구 대비 누락 (L4)** `university`, `wishlist`, `travel`, `diary`, `calendar`, `procrastination`, `milestones`, `aura`, `diet`, `exercise` | `:root[data-finish="pure-white"]`에만 `#app .footer{color:var(--text-primary);opacity:1}` 대비 보강이 적용되고(`hani-design-system.css:1453`), 나머지 3종(크림·핑크·블루)에서는 `.footer`와 `--pb-muted`/`--ms-note`/`.period-basis` 등이 흐릿함 | **중** | 퓨어 화이트 외 3종 마감의 하단·보조 텍스트 4.5:1 이상 대비 확보 |
| **9** | **`geminiReports` 개발 보고서 & `diet` 식단 레이아웃** | `geminiReports`는 `.gemini-report-detail table{min-width:760px}`(`index.html:76`) 때문에 1280px 화면에서 우측 `내용` 열이 잘림. `diet`는 5열 KPI(`#diet .stats`) 탓에 마지막 `목표` 카드(`#dietStats .stat:nth-child(5)`)가 좁아져 3줄 줄바꿈 + 고정 파랑(`#4285f4`/`#eef5ff`) 적용 | **중** | 텍스트 잘림·과도한 줄바꿈 해소 |
| **10** | **밝은 화면 영문/개발자 용어 정리 (L5)** 전 메뉴 (`ledger`, `monthlyReport`, `investment`, `investmentIntake`, `deployment`, `study`, `game`, `aura`, `wishlist`, `reading`, `movie`, `procrastination`, `home`) | 회장님이 바로 쓰시는 밝은 화면에 `JISPI`, `JIEUN'S COMMENT`, `EARNINGS CALL`, `SHAREHOLDER MEETING`, `MONTHLY PICKS`, `TSV ONLY`, `AUTO`/`CLEAR`/`SUPABASE RELEASE QUEUE`, `SPORTS HOME`, `WIN`/`LOSS`, `Quiz 0개`, `SIGNATURE FINISHES`, `PORCELAIN CREAM × AUTUMN`, `Preview` 등 영문·개발 용어가 다수 노출됨 | **하** | 회장님 체감 완성도 및 한국어 일관성 향상 |

---

## 회장님 제보 3건 검증 결과 (밝은 마감 4종 기준)

| 제보 항목 | 어두운 마감 vs 밝은 마감 4종 재현 여부 | 밝은 마감에서의 구체적 상태 및 추가 발견 | 원인 위치 |
|---|---|---|---|
| **① `investment` (투자)**<br>- 스탯 제목 흰띠<br>- KPI 줄 중복 | - **흰띠**: 밝은 마감 4종은 카드 배경이 흰/밝은색이라 어두운 마감처럼 흰띠로 두드러지지 않음<br>- **KPI 줄 중복**: **밝은 마감 4종 모두 그대로 재현** | 1) 상단 `.investment-live` 4칸(`총자산·평가금액·평가손익·기록 기준`)과 본문 `#brokerDashboardStats` KPI 줄이 여전히 2중 중복됨.<br>2) `#brokerDashboardStats` 첫 번째 카드의 `기록 없음` 값이 좁은 폭에서 **`기록 없` / `음` 2줄로 깨짐**.<br>3) `porcelain-cream`·`sakura-pink`·`alpine-blue`에서 `.investment-live`, `.investment-tabs-main`, `.broker-stats`가 `#fff!important`로 고정되어 바탕색 위에 순백 사각형으로 붕 뜸. | [index.html](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/index.html#L390-L402)<br>[hani-design-system.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L645-L647)<br>[hani-design-system.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L2201-L2228) |
| **② `organization` (회사 소개)**<br>- 히어로 이미지 폭 미채움<br>- 텍스트 박스 이미지 겹침 | - **이미지 미채움**: **밝은 마감 4종 모두 재현**<br>- **텍스트 박스 겹침**: **밝은 마감 4종 모두 재현** | 1) `.ogh-hero-art>img`가 `object-fit:contain`이라 4종 마감 모두 좌우 여백이 남음.<br>2) `.ogh-hero-copy`가 `rgba(255,255,255,.94)` 밝은 박스로 인물 사진 하단·좌측을 가림.<br>3) **마감 색 불일치**: 히어로 강조 밑줄(`#4562e6`/`#334fa7`)과 활성 탭(`개요`, `#215ad5`/`#f3f7ff`)이 `porcelain-cream`·`sakura-pink`에서도 선명한 코발트 블루로 고정됨. | [hani-organization-hub.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-organization-hub.css#L2)<br>[hani-organization-hub.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-organization-hub.css#L228-L243)<br>[hani-organization-hub.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-organization-hub.css#L316-L317)<br>[hani-organization-hub.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-organization-hub.css#L378-L388) |
| **③ 우측 `HANI REMOTE`**<br>- 버튼 중복·혼잡<br>- 영어 제목 | - **버튼 중복·혼잡**: **밝은 마감 4종 모두 재현**<br>- **영어 제목**: **밝은 마감 4종 모두 재현** | 1) 상단 원형 빠른 이동 버튼 4개와 아래 목록 4개가 기능 중복, `home`에서는 `오늘 할 일`이 2~3회 중복 노출됨.<br>2) `HANI REMOTE`, `SECTION SHORTCUTS` 영문 표기 유지.<br>3) **밝은 마감 색 불일치**: `--remote-primary:#ffead5`(주황·크림), `--remote-current:#edf0fa`(연보라·청), `--remote-yuna:#fff4e5`, `.hani-remote-collapse{background:#fff}` 등이 4종 마감 전환을 전혀 따르지 않아 특히 `sakura-pink`·`alpine-blue`에서 색감이 어긋남. | [hani-context-remote.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-context-remote.css#L13)<br>[hani-context-remote.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-context-remote.css#L23-L35)<br>[hani-context-remote-v1.js](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-context-remote-v1.js#L13)<br>[hani-context-remote-v1.js](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-context-remote-v1.js#L46-L72) |

---

## 공통 원인 (밝은 마감 전용 · 마감 간 색 불일치)

> 아래 5개 공통 원인은 `REVIEW-dark.md`의 C1~C6를 제외한 **밝은 마감 4종 특유 문제**를 묶은 것입니다. 공통 원인의 CSS 규칙만 교정해도 다수 메뉴가 동시에 정리됩니다.

### L1. 마감 전환을 무시하는 고정 파랑·보라·틸·주황 액션/탭/강조색
- **현상**: 밝은 마감 4종은 각각 고유한 `--control-accent`(`porcelain-cream` `#806337`, `pure-white` `#7562d9`, `sakura-pink` `#a84d75`, `alpine-blue` `#356e98`)와 `--control-soft`를 갖고 있으나([hani-design-system.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L541-L568)), 개별 화면 CSS가 이를 덮어쓰거나 독자 색을 하드코딩함.
  - `.btn.finance`가 `body[data-finish-active] #app .view .btn.finance{background:#245eb5!important}`로 고정되어, **사쿠라 핑크·포슬린 크림에서도 새파란 버튼**이 뜸 (`ledger` `이번 달` / `가계부 확정본 붙여넣기 >`, `investmentCommittee` `+ Research 작성`, `investmentIntake`, `investment`).
  - 기능별 독자 색 하드코딩: `deployment`(`#6f5de7` 보라), `study`(`#6d5bd0` 보라), `agentReview`(`#7656c4`/`#8363b8` 보라), `organization`(`#215ad5`/`#4562e6` 파랑), `investmentCommittee` 탭(`#142640` 짙은 남색), `travel` 탭(`#237c80` 틸), `ledger` `JISPI 종합 지수` 카드(고정 남색 블록), `diet`/`exercise`(`.exercise-tone` `#4285f4` 파랑), `aura` 체크박스 `#launchGreetingEnabled`(`accent-color` 미지정으로 브라우저 기본 파랑).
- **근본 원인**: [hani-design-system.css:669](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L669), [hani-style-07.css:12-28](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-07.css#L12-L28), [hani-study-v02984.js:779-801](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-study-v02984.js#L779-L801), [hani-office-live.css:1-45](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-office-live.css#L1-L45), [hani-organization-hub.css:228-317](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-organization-hub.css#L228-L317), [hani-investment-committee.css:2-11](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-investment-committee.css#L2-L11), [hani-design-system.css:269-277](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L269-L277), [hani-design-system.css:2239](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L2239).

### L2. 고정 연보라·연파랑·연주황 `.pill` 및 상태 뱃지
- **현상**: 사쿠라 핑크·포슬린 크림·알파인 블루 어느 마감을 선택해도 `reading`/`movie`(`판정 보류`, `목표 없음`), `wishlist`(`0개`), `travel`(`0회`), `drive`(`읽기 전용`), `aiWork`(`개발 지원`), `investmentIntake`(`TSV ONLY`, `저장 전 확인`)의 `.pill`이 모두 연보라(`#efedff`)로 표시됨. 또한 `.pill.finance`(`#eaf3ff` 연파랑 — `investment` `MONTHLY PICKS`), `.pill.growth`(`#fff4e5` 연주황 — `certificate` `0개`), `.campus-semester-status`(`#eaf3ff` 연파랑 — `university` `학기 없음`)도 마감을 따르지 않음.
- **근본 원인**: [hani-style-01.css:29](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L29), [hani-style-01.css:1568](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L1568).

### L3. 크림/라벤더 고정 서피스 & `#fff!important` 순백 강제 덮어쓰기
- **현상**:
  1) **크림/라벤더 고정**: `milestones` 상단 배너(`--mcb-bg:#fbf6ee`), `ilbo` 제호(`#fffaf2`), `deployment` 상태 바(`#fffaf0→#fff`), `aura` 미리보기 카드(`#fffaf3→#f2edf8`), `home` 지은/에이전트 말풍선(`.ds-jieun>div` `#fff8ef`, `.ds-agent-comment>div` `#f9f3ff`), `procrastination`(`--pb-card:#fffcf8`), `intake`(`#f4f0ff`), `dev`(`#f5f2ff`)가 4종 마감 전환에도 동일하게 유지됨.
  2) **순백(`#fff!important`) 강제**: `hani-design-system.css:645-647`과 `2201-2228`이 `asset`, `investment`, `travel`, `board`, `study`, `diary`, `newsroom`, `diet`/`certificate`(`.date-mode-toggle`), `aiWork`(`#f6f4fa!important`), 사이드바 로고 박스(`.sidebar-corporate-lockup` `#fff`)를 순백/고정색으로 덮어, `pure-white`에서는 자연스럽지만 **`porcelain-cream`·`sakura-pink`·`alpine-blue`에서는 캔버스/카드 위에 흰 스티커를 붙인 듯 붕 떠 보임**.
- **근본 원인**: [hani-design-system.css:92, 124, 645-647, 687-693, 864-870, 1872, 2201-2228](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L645-L647), [hani-ilbo.css:10-13](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-ilbo.css#L10-L13), [hani-style-07.css:24](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-07.css#L24), [hani-procrastination-board.css:1-47](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-procrastination-board.css#L1-L47).

### L4. `pure-white`에만 걸린 대비 보강 누락 · 밝은 배경 저대비 · 잘림/줄바꿈
- **현상**:
  - `hani-design-system.css:1434-1455`의 대비 보강 규칙(예: `:1453` `#app .footer{color:var(--text-primary);opacity:1}`)이 `:root[data-finish="pure-white"]`에만 선언되어 있어, `porcelain-cream`·`sakura-pink`·`alpine-blue`에서는 하단 `.footer` 글씨가 흐릿하게 죽음.
  - `monthlyReport`의 다크 네이비 셸(`#0b101d~#111827`)은 밝은 마감 4종 모두에서 화면 톤과 단절되며, 내부 `.monthly-report-pending button:disabled`에 `opacity:.5`가 적용되어(`:1145`) 비활성 버튼 글씨가 어둡게 잠김.
  - `procrastination`(`--pb-muted:#6d6376`), `milestones`(`달성 대기`), `aura`(좌하단 `나의 색 · 우리의 계절`), `diet`/ `exercise`(`.period-basis` `#9098aa`) 등 보조 안내 문구의 명도 대비가 낮음.
  - `geminiReports` 표 최소폭(`min-width:760px`)으로 우측 `내용` 열 텍스트가 카드 경계에서 잘림.
  - `diet` 5열 KPI(`#diet .stats`) 때문에 마지막 `목표` 카드 내용이 3줄로 줄바꿈됨.
- **근본 원인**: [hani-design-system.css:1109-1145, 1434-1455, 1833](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L1434-L1455), [index.html:76](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/index.html#L76), [hani-style-01.css:42, 851-864](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L851-L864).

### L5. 밝은 화면 전반의 영어 제목·개발자 용어 노출
- **현상**: 회장님이 일상적으로 여시는 밝은 화면 전반에 내부 코드/영문 대제목·상태 뱃지가 그대로 노출됨(`HANI REMOTE`, `SECTION SHORTCUTS`, `MONTHLY`, `EARNINGS CALL`, `SHAREHOLDER MEETING`, `MONTHLY PICKS`, `TSV ONLY`, `JISPI`, `JIEUN'S COMMENT`, `AUTO`/`CLEAR`/`SUPABASE RELEASE QUEUE`, `SPORTS HOME`, `WIN`/`LOSS`, `RECORD INPUT`, `JAPANESE STUDY ROOM`, `Quiz 0개`, `Wish-list`, `SIGNATURE FINISHES`, `CORE FINISHES`, `PORCELAIN CREAM × AUTUMN`, `Preview` 등).

---

## 메뉴 × 마감 점검 표 (전체 37개 메뉴)

> 표기 기준: **공통(4종)** = `porcelain-cream`·`pure-white`·`sakura-pink`·`alpine-blue` 모두 동일 발생 / **크림·핑크·블루** = `pure-white`에서는 자연스러우나 유색 밝은 마감 3종에서 어긋남 / **크림·핑크** 등 특정 마감 명기.

| 메뉴 | 마감 | 문제 | 심각도 | 추정 원인 위치 |
|---|---|---|---|---|
| **home** (홈) | 공통(4종)<br>크림·핑크·블루 | 1) 상단 `.home-dialogue-avatar` 영역이 빈 연보라 사각형으로 비어 있음(이미지 미표시)<br>2) 대화 버블(`.home-dialogue-shell`) `#fff!important` 및 `#homeDialogueText` 시즌 연보라·`.ds-jieun` 크림(`#fff8ef`)·`.ds-agent-comment` 연보라(`#f9f3ff`) 고정으로 핑크/블루/크림 마감과 톤 불일치<br>3) 메인 배너(`#home>.ds-main-character-banner`) 연보라 고정(`#f2eaff→#ddd2f1`)<br>4) 우측 `HANI REMOTE` `오늘 할 일` 2~3중 중복·영어 제목(L5) | **중** | [hani-style-01.css:1639](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L1639)<br>[hani-design-system.css:45, 92, 124, 184, 932-936](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L92)<br>[hani-context-remote-v1.js:46-72](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-context-remote-v1.js#L46-L72) |
| **milestones** (마일스톤) | 공통(4종)<br>화이트·핑크·블루 | 1) 상단 캐릭터 배너가 `#fbf6ee` **크림색에 고정**되어 퓨어 화이트·사쿠라 핑크·알파인 블루에서도 노란 크림 띠로 보임<br>2) `달성 대기`(.ms-year) 보조 문구 대비가 밝은 마감 바탕에서 다소 흐릿함(L4) | **중** | [hani-design-system.css:1872](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L1872)<br>`hani-design-system.css` 마일스톤 `.ms-year` (추측) |
| **intake** (통합 입력) | 공통(4종)<br>크림·핑크·블루 | 1) `대기 중` 상태 뱃지 및 유나 헬프데스크 버블이 고정 라벤더(`--yuna-lavender-soft:#f4f0ff`)·`#29244f→#634d98` 보라 그라데이션 사용(L1·L2)<br>2) 작업 카드가 `#fff`로 고정되어 크림·핑크·블루에서 붕 뜸(L3)<br>3) `Preview` 등 영문 용어 노출(L5) | **중** | [hani-yuna-helpdesk.css:1, 14-19](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-yuna-helpdesk.css#L1-L19) |
| **agentReview** (살아있는 오피스) | 공통(4종)<br>크림·핑크·블루 | 1) `HANI GROUP · LIVING OFFICE` 영문 아이브로우와 활성 층 탭(`4F 경영층`)이 고정 보라(`#7656c4`/`#8363b8`/`#eee7f8`)를 써서 크림·핑크·블루와 색이 어긋남(L1)<br>2) 배경 카드(`#fffdfb→#f7f4fc`) 라벤더-크림 고정(L3) | **중** | [hani-office-live.css:1, 3, 5, 43-45](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-office-live.css#L1-L45) |
| **monthlyReport** (월간 보고서) | 공통(4종) | 1) 밝은 마감 4종에서도 본문 전체가 **어두운 네이비 셸(`#0b101d~#111827`)**로 고정되어 페이지와 단절감 심함<br>2) 하단 비활성 `보고서 생성` 버튼(`opacity:.5` on `#896bf0`) 텍스트가 흐려 저대비<br>3) 기준 날짜 토글(`.date-mode-toggle`)만 짙은 네이비 위 순백 박스(`#fff`)로 붕 뜸<br>4) 활성 탭이 고정 틸/블루/앰버 색 사용 + `MONTHLY`, `EARNINGS CALL`, `SHAREHOLDER MEETING` 영문 노출(L5) | **중** | [hani-design-system.css:1109-1145, 1840](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L1109-L1145)<br>[hani-style-01.css:2269](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L2269) |
| **organization** (회사 소개) | 공통(4종)<br>크림·핑크 | **[회장님 제보 ②]**<br>1) 히어로 단체사진이 `object-fit:contain`이라 **4종 모두 좌우 여백 남음**<br>2) 반투명 흰 텍스트 박스(`.ogh-hero-copy`, `rgba(255,255,255,.94)`)가 **사진 위에 겹침**<br>3) 밑줄 강조(`#4562e6`/`#334fa7`)와 활성 탭(`개요`, `#215ad5`/`#f3f7ff`)이 **사쿠라 핑크·포슬린 크림에서도 파랑 고정**(L1) | **상** | [hani-organization-hub.css:2, 228-243, 316-317, 378-388](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-organization-hub.css#L228-L388) |
| **ilbo** (하니 일보) | 화이트·핑크·블루 | 1) 제호 영역(`.ilbo-nameplate-illustrated`, `.ilbo-nameplate-copy`)이 `#fffaf2` **크림색에 고정**되어 퓨어 화이트·사쿠라 핑크·알파인 블루 바탕과 색 경계가 생김(L3) | **중** | [hani-ilbo.css:10, 13](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-ilbo.css#L10-L13) |
| **board** (사내 게시판) | 크림·핑크·블루<br>공통(4종) | 1) `.board-tabs`와 `.board-tab`이 `#fff!important`로 덮여 유색 밝은 마감(크림·핑크·블루)에서 흰 띠로 붕 뜸(L3)<br>2) 탭 글씨 색이 마감과 무관하게 `#c44747`/`#397bc1`/`#3b866b`/`#9670b0`/`#bd7b36`으로 고정, `인기` 비활성 상태 시인성이 다소 약함(L1) | **하** | [hani-design-system.css:2201-2228](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L2201-L2228)<br>[hani-board.css:100-108](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-board.css#L100-L108) |
| **investment** (투자) | 공통(4종)<br>크림·핑크·블루 | **[회장님 제보 ①]**<br>1) 상단 `.investment-live`와 `#brokerDashboardStats` **KPI 줄 2중 중복** 지속<br>2) `#brokerDashboardStats` 첫 번째 카드 `기록 없음` 2줄 줄바꿈(`기록 없`/`음`)<br>3) `.investment-live`·`.investment-tabs-main`·`.broker-stats` `#fff!important` 강제로 크림·핑크·블루 위 순백 박스 붕 뜸(L3)<br>4) `MONTHLY PICKS` 영문 + `.pill.finance` 고정 연파랑(L2·L5) | **상** | [index.html:390-402](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/index.html#L390-L402)<br>[hani-design-system.css:645-647, 2201-2228](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L645-L647)<br>[hani-style-01.css:29](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L29) |
| **investmentCommittee** (투자 리포트) | 공통(4종)<br>크림·핑크 | 1) `+ Research 작성` 버튼(`.btn.finance`)이 **사쿠라 핑크·포슬린 크림에서도 파랑(`#245eb5`) 고정**(L1)<br>2) 활성 탭(`종목 리포트`)과 내부 포인트가 짙은 남색(`--ic-navy:#142640`)·코발트(`--ic-cobalt:#295bd5`) 고정(L1) | **중** | [hani-design-system.css:669](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L669)<br>[hani-investment-committee.css:2-11](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-investment-committee.css#L2-L11) |
| **investmentIntake** (투자 계좌 업데이트) | 공통(4종)<br>크림·핑크·블루 | 1) 지은 말풍선(`.ds-jieun>div`) `#fff8ef` 크림색 고정(L3)<br>2) `TSV ONLY`, `저장 전 확인` 뱃지(`.pill`) 연보라 고정 + 영문 `TSV ONLY`(L2·L5)<br>3) `.btn.finance` 파랑 버튼 고정(L1) | **중** | [hani-design-system.css:124, 669](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L124)<br>[hani-style-01.css:29](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L29) |
| **asset** (자산) | 크림·핑크·블루 | 1) `.asset-dashboard-card`, `#asset .account-card`, `#asset .stat`이 `--surface-panel:#fff` / `--surface-raised:#f8f9fc`로 고정되어 유색 밝은 마감 3종에서 캔버스 톤을 잃음(L3)<br>2) `.btn.finance` 파랑 고정(L1) | **하** | [hani-design-system.css:645-647, 669](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L645-L647) |
| **ledger** (가계부) | 공통(4종)<br>크림·핑크 | 1) **`이번 달` 및 `가계부 확정본 붙여넣기 >` 버튼이 `.btn.finance`(`#245eb5`)로 파랑 고정** — 사쿠라 핑크·포슬린 크림에서 가장 눈에 띄는 색 충돌(L1)<br>2) `JISPI 종합 지수` 카드가 밝은 마감 4종 내에서도 어두운 남색 블록으로 박힘(L1)<br>3) `코멘트 수정` 버튼 텍스트가 좁아 **2줄(`코멘트 수`/`정`)로 줄바꿈** + `#ledgerJieunComment` `#fff!important` 강제(L3)<br>4) `JISPI`, `JIEUN'S COMMENT` 영문 노출(L5) | **상** | [hani-design-system.css:195-199, 669](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L669)<br>가계부 `JISPI` 남색 블록 CSS (추측) |
| **newsroom** (뉴스룸) | 크림·핑크·블루 | 1) `#newsroom .newsroom-4cut-context td.is-down` 및 회사 팔로업 패널 내부 카드들이 `#fff` 중심으로 고정됨(L3)<br>2) 본문 구조·가독성은 4종 모두 깔끔한 편이나 `WEEKLY` 등 일부 영문 보조 레이블 존재(L5) | **하** | [hani-design-system.css:781-801, 2201-2228](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L2201-L2228) |
| **diet** (식단 · 체중) | 공통(4종)<br>크림·핑크·블루 | 1) `#diet .stats` 5열 배치로 마지막 `목표` 카드(`#dietStats .stat:nth-child(5)`)가 좁아져 **`1차 110kg · 2차 100kg`이 3줄로 줄바꿈** + 배경이 `#fff→#eef5ff`, 글씨가 `#4285f4` 파랑 고정(L1·L4)<br>2) `.date-mode-toggle` `#fff!important` 강제(L3) 및 `.period-basis`(`#9098aa`) 흐림(L4)<br>3) 일부 `Preview` 영문 표기(L5) | **중** | [hani-style-01.css:851-864](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L851-L864)<br>[hani-design-system.css:1833, 2201-2228](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L1833) |
| **exercise** (운동) | 크림·핑크·블루 | 1) `.exercise-tone` 카드가 `#4285f4` / `#eef5ff` 파랑 고정(L1)<br>2) `.exercise-basis` / `.period-basis`(`#9098aa`) 및 `pure-white` 외 3종 마감 하단 `.footer` 흐림(L4)<br>3) 본문 레이아웃 이상 없음 | **하** | [hani-style-01.css:42, 850, 856-862](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L850)<br>[hani-design-system.css:1453](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L1453) |
| **reading** (독서) | 공통(4종)<br>크림·핑크·블루 | 1) `판정 보류`, `목표 없음` `.pill`이 연보라(`#efedff`) 고정(L2)<br>2) `RECORD INPUT` 영문 아이브로우 노출(L5) | **하** | [hani-style-01.css:29](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L29)<br>HTML 섹션 아이브로우 (추측) |
| **study** (공부) | 공통(4종)<br>크림·핑크·블루 | 1) 활성 탭(`학습`)·칩·`.study-subtabs`(`#f8f6ff`)·`--study:#6d5bd0`가 **4종 마감 모두 보라색 고정**(L1)<br>2) `.study-main-empty`, `.study-card-v02984` `#fff!important` 강제(L3)<br>3) `JAPANESE STUDY ROOM`, `Quiz 0개` 영문 혼용(L5) | **중** | [hani-study-v02984.js:779-801](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-study-v02984.js#L779-L801)<br>[hani-design-system.css:2201-2228](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L2201-L2228) |
| **university** (대학교) | 공통(4종)<br>크림·핑크·블루 | 1) `학기 없음` 뱃지(`.campus-semester-status`)가 `#eaf3ff`/`#3473c8` 파랑 고정(L2)<br>2) 크림·핑크·블루에서 하단 `.footer` 대비 보강 누락으로 글씨 흐림(L4) | **하** | [hani-style-01.css:42, 1568](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L1568)<br>[hani-design-system.css:1453](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L1453) |
| **certificate** (자격증) | 공통(4종)<br>크림·핑크·블루 | 1) `0개` `.pill.growth`가 `#fff4e5`/`#c97716` 주황 고정(L2)<br>2) `.date-mode-toggle` `#fff!important` 강제(L3) | **하** | [hani-style-01.css:29](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L29)<br>[hani-design-system.css:2201-2228](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L2201-L2228) |
| **wishlist** (위시리스트) | 공통(4종)<br>크림·핑크·블루 | 1) `0개` `.pill`이 `#efedff` 연보라 고정(L2)<br>2) `.wishlist-kpis>div`가 `#fff`/`#f8f9fc` 고정(L3)<br>3) 크림·핑크·블루에서 하단 `.footer` 흐림(L4)<br>4) `Wish-list` 영문 표기(L5) | **하** | [hani-style-01.css:29, 42](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L29)<br>[hani-design-system.css:645-647, 1453](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L645-L647) |
| **travel** (여행) | 공통(4종)<br>크림·핑크·블루 | 1) `.travel-tabs` 활성 탭(`여행 아카이브`)이 마감과 무관하게 **틸(`#237c80`)** 고정 + 배경 `#fff` 고정(L1)<br>2) `#travel .module-kpi` `#fff!important` 강제 및 `--travel-sand:#fbf4e8` 크림 고정(L3)<br>3) `0회` `.pill` 연보라 고정(L2) 및 크림·핑크·블루 하단 `.footer` 흐림(L4) | **중** | [hani-design-system.css:269-277, 1453, 2201-2228](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L269-L277)<br>[hani-style-01.css:29, 42](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L29) |
| **movie** (영화) | 공통(4종)<br>크림·핑크·블루 | 1) `판정 보류`, `목표 없음` `.pill`이 `#efedff` 연보라 고정(L2)<br>2) `.series-archive-v2`·`.series-progress-card`가 `#fff`/`#f8f5ff`/`#7658bd`/`#735cf4` 연보라 고정(L1·L3)<br>3) `RECORD INPUT` 영문 표기(L5) | **하** | [hani-style-01.css:29](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L29)<br>[hani-design-system.css:912-917](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L912-L917) |
| **game** (스포츠 · 게임) | 공통(4종)<br>크림·핑크·블루 | 1) `.sports-view-tabs`가 `#f7f8fa`/`#fff` 회백색 고정 + 구단 카드(`.team-kia` 빨강, `.team-madrid` `#fff→#f4f1e9`)가 마감 전환에 반응하지 않고 로고 배경도 `#fff` 고정(L3)<br>2) `SPORTS HOME`, `WIN`/`LOSS`, `LALIGA · UEFA` 등 영문 다수 노출(L5) | **하** | [hani-design-system.css:879-911](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L879-L911) |
| **diary** (일기) | 크림·핑크·블루 | 1) `#diary [data-diary-view]` 버튼·영역이 `#fff!important`로 덮임(L3)<br>2) 크림·핑크·블루에서 하단 `.footer` 대비 보강 누락으로 글씨 흐림(L4) | **하** | [hani-design-system.css:1453, 2201-2228](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L2201-L2228)<br>[hani-style-01.css:42](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L42) |
| **tasks** (할 일) | 공통(4종) | 1) 구조·대비 양호하나 `Google Calendar Sync` 등 영문 보조 표기 노출(L5)<br>2) 본문 밝은 마감 전용 결함 없음 | **하** | 영문 라벨 마크업 (추측) |
| **procrastination** (미루기 보드) | 공통(4종)<br>크림·핑크·블루 | 1) 카드 배경 `--pb-card:#fffcf8` 크림 고정(L3)<br>2) `.pb-intro`, `.pb-legend span`, `.pb-owner span`, `.pb-basis`가 `--pb-muted:#6d6376`를 써서 밝은 바탕 대비가 다소 흐릿함(L4)<br>3) 상단 `.pb-eyebrow` `A LITTLE NUDGE / HANI GROUP` 영문 노출(L5) | **중** | [hani-procrastination-board.css:1-47](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-procrastination-board.css#L1-L47) |
| **calendar** (캘린더) | 크림·핑크·블루 | 1) 크림·핑크·블루에서 하단 `.footer` 흐림(L4) 및 `Google Calendar` 영문 표기(L5)<br>2) 본문 캘린더 그리드 이상 없음 | **하** | [hani-style-01.css:42](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L42)<br>[hani-design-system.css:1453](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L1453) |
| **work** (업무 보조) | 해당 없음(공통) | 런타임(`removeWorkBoardUI`)에 의해 제거되어 `shots/pc/*__work.jpg` 4장 모두 `home` 화면이 촬영됨(독립 화면 미노출) | **이상 없음(리다이렉트)** | JS `removeWorkBoardUI` (추측) |
| **drive** (구글 드라이브) | 공통(4종)<br>크림·핑크·블루 | 1) `읽기 전용` `.pill`이 `#efedff` 연보라 고정(L2)<br>2) `Google Drive` 영문 표기(L5), 본문 구조 이상 없음 | **하** | [hani-style-01.css:29](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L29) |
| **aiWork** (AI 팀 업무) | 공통(4종)<br>크림·핑크·블루 | 1) `#aiWork .ui26-member`와 `.ai-team-profile-role`이 `#f6f4fa!important` 연보라 고정(L3)<br>2) `개발 지원` 등 `.pill`이 `#efedff` 연보라 고정(L2) | **하** | [hani-design-system.css:2201-2228](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L2201-L2228)<br>[hani-style-01.css:29](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-01.css#L29) |
| **dev** (개발 히스토리) | 공통(4종)<br>크림·핑크·블루 | 1) `.hani-dev-history-overview`(`#f5f2ff`), `.hani-history-kpis b`(`#4f3fa4`), 칩(`#eee9ff`), `.hani-history-row`(`#fff`)가 **고정 보라·순백**으로 4종 마감에 무반응(L1·L3) | **하** | [hani-development-history.css:8, 15, 25, 28-34](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-development-history.css#L8-L34)<br>[hani-design-system.css:645-647](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L645-L647) |
| **geminiReports** (개발 보고서) | 공통(4종) | 1) **우측 상세 표 텍스트 잘림**: `.gemini-report-detail table{min-width:760px}` 고정 때문에 1280px 데스크톱 폭에서 우측 `내용` 열 문장이 카드 경계 밖으로 잘림(L4) | **중** | [index.html:76](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/index.html#L76) |
| **deployment** (배포 센터) | 공통(4종)<br>크림·핑크·블루 | 1) `.deploy-exec-status`가 `#fffaf0→#fff` **크림 그라데이션 고정**(L3)<br>2) `상태 새로고침`, `Release Queue 새로고침` 버튼(`.deploy-btn.primary`) 및 `.deploy-kicker`/`mode`가 **`#6f5de7` 보라색 고정**이라 크림·핑크·블루에서 크게 튐(L1)<br>3) `AUTO`, `CLEAR`, `SUPABASE RELEASE QUEUE` 영문·개발 용어 노출(L5) | **중** | [hani-style-07.css:9, 12, 17, 19-20, 24-28](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-style-07.css#L9-L28) |
| **aiBudget** (AI 사용량 · 예산) | 공통(4종) | 1) 본문 카드 색·대비는 4종 마감에서 양호하나 영문 아이브로우·일부 모델명/레이블 노출(L5)<br>2) 밝은 마감 전용 구조 결함 없음 | **하** | 영문 라벨 마크업 (추측) |
| **aura** (테마 스튜디오) | 공통(4종)<br>화이트·핑크·블루 | 1) `.aura-preview`와 `.aura-poster-signature`가 `#fffaf3→#f2edf8` **크림/라벤더 고정**이어서, 퓨어 화이트·사쿠라 핑크·알파인 블루를 선택해도 미리보기 배경이 크림으로 보임(L3)<br>2) 하단 `#launchGreetingEnabled` 체크박스가 마감 색을 안 따르고 브라우저 **기본 파랑**으로 표시됨(L1)<br>3) 좌하단 `나의 색 · 우리의 계절` 보조 문구 저대비(L4)<br>4) `SIGNATURE FINISHES`, `CORE FINISHES`, `PORCELAIN CREAM × AUTUMN` 등 영문 대제목 다수 노출(L5) | **중** | [hani-design-system.css:687-693, 707-733, 2239](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L687-L733) |
| **settings** (설정) | 공통(4종) | 상단 어두운 시스템 배너는 의도된 다크 Hero 영역이며, 본문 카드·대비·버튼 모두 4종 마감에 맞춰 깔끔함(`Cloud` 영문 표기 정도만 경미) | **이상 없음** | — |

> **공통 사이드바(전 메뉴 노출)**: 좌측 사이드바 하단 브랜드 락업(`.sidebar-corporate-lockup`)이 `#fff` 바탕 + `#5e418c` 보라 글씨로 고정되어([hani-design-system.css:864-870](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L864-L870)) 유색 밝은 마감(크림·핑크·블루) 사이드바와 톤이 어긋남. 우측 `HANI REMOTE`는 상단 **회장님 제보 ③** 참고.

---

## 이상 없음 목록 (밝은 마감 전용 결함 기준)

- **완전 양호**: **`settings` (설정)** — 4종 마감 모두 본문 카드 색감·대비·정렬 이상 없음(사소한 `Cloud` 영문 표기만 제외).
- **리다이렉트(비활성 메뉴)**: **`work` (업무 보조)** — `home`으로 우회되어 별도 화면 없음.
- **본문 구조 양호(단, L2/L4 푸터/L5 영문 등 경미한 공통 항목만 해당)**: **`tasks`**, **`calendar`**, **`drive`**, **`aiBudget`**, **`exercise`**, **`newsroom`** — 각 화면 본문 카드 배치·밝은 마감 대비에는 큰 깨짐이 없으며, 위 표의 경미(`하`) 공통 항목만 정리하면 완료 수준임.

---

## CSS 토큰 · 선택자 수준 수정 제안

> 아래 제안은 모두 **계산·데이터·저장(`localStorage`·Cloud·Schema)을 전혀 건드리지 않고**, CSS/마크업 표현 계층만 정리하는 방향입니다.

### 1. [L1] 마감 토큰(`--control-accent`, `--control-soft`)으로 파랑/보라/틸 하드코딩 통일
`body[data-finish-active]` 블록([hani-design-system.css:669](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-design-system.css#L669) 및 개별 CSS)에서 고정 색을 제거하고 마감 토큰에 연결합니다.

```css
/* 1) .btn.finance의 고정 코발트(#245eb5) 제거 -> 마감 강조색 사용 */
body[data-finish-active] #app .view .btn.finance {
  background: var(--control-accent) !important;
  border-color: var(--control-accent) !important;
  color: #fff !important;
}

/* 2) 배포센터 / 투자위 / 회사소개 / 스터디 / 오피스 / 여행 / 아우라 체크박스 마감 연동 */
body[data-finish-active] #app .deploy-btn.primary {
  background: var(--control-accent);
  border-color: var(--control-accent);
}
body[data-finish-active] #app .deploy-kicker,
body[data-finish-active] #app .deploy-mode {
  color: var(--control-accent);
}
body[data-finish-active] #app #haniOrganizationHub .ogh-team-tabs button[aria-selected="true"] {
  color: var(--control-accent);
  border-bottom-color: var(--control-accent);
  background: var(--control-soft);
}
body[data-finish-active] #app #travel .travel-tabs .tab.active {
  background: var(--control-soft) !important;
  color: var(--control-accent) !important;
}
body[data-finish-active] #app #launchGreetingEnabled {
  accent-color: var(--control-accent);
}
/* ic-navy(#142640), study(--study:#6d5bd0), office-live(#7656c4/#8363b8)도
   body[data-finish-active]에서 --control-accent / --control-soft로 오버라이드 */
```

### 2. [L2] `.pill` 및 `.campus-semester-status` 연보라/연파랑 고정 해제
```css
/* hani-style-01.css:29, 1568 대안: 밝은 마감 활성 시 마감 팔레트 기반 뱃지 */
body[data-finish-active] #app .pill {
  background: var(--control-soft);
  color: var(--control-accent);
}
body[data-finish-active] #app .campus-semester-status {
  background: var(--control-soft);
  color: var(--control-accent);
}
```

### 3. [L3] 크림 고정(`#fffaf2`/`#fbf6ee`) 및 `#fff!important` 서피스 해제
```css
/* hani-design-system.css:645-647, 1872, 2201-2228 보완 */
body[data-finish-active] #app #milestones > .ds-main-character-banner {
  --mcb-bg: var(--surface-panel);
  --mcb-ink: var(--text-primary);
}
body[data-finish-active] #app .ilbo-nameplate-illustrated,
body[data-finish-active] #app .ilbo-nameplate-copy,
body[data-finish-active] #app .deploy-exec-status {
  background: var(--surface-panel);
}
body[data-finish-active] #app :is(
  .asset-dashboard-card, #asset .account-card, .wishlist-kpis>div, .hani-history-row,
  #asset .stat, #investment .stat,
  #travel .module-kpi, #board .board-tabs,
  #investment :is(.investment-tabs-main, .investment-live, .broker-stats),
  #study .study-main-empty, #diary [data-diary-view],
  :is(#diet, #certificate) .date-mode-toggle,
  #aiWork .ui26-member, .ai-team-profile-role,
  .sidebar-corporate-lockup
) {
  background: var(--surface-raised) !important;
}
```

### 4. [L4] 전 밝은 마감 `.footer` 대비 확장 + `monthlyReport`·`diet`·`geminiReports` 수정
```css
/* 1) pure-white에만 있던 footer 대비 보강을 밝은 마감 4종 전체로 확장 (hani-design-system.css:1453) */
body[data-finish-active] #app .footer {
  color: var(--text-secondary);
  opacity: 1;
}

/* 2) monthlyReport 비활성 버튼 저대비 해소 (hani-design-system.css:1145 대안) */
#app #monthlyReport .monthly-report-pending button:disabled {
  opacity: 1;
  color: #e0e5f5;
  background: #313d56;
  border-color: #8793ad;
}

/* 3) diet 5번째 목표 카드 3줄 줄바꿈 완화 (hani-style-01.css:851, 863) */
#app #diet .stats {
  grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(190px, 1.35fr);
}
body[data-finish-active] #app #dietStats .stat:nth-child(5) {
  background: var(--surface-raised);
}
body[data-finish-active] #app #dietStats .stat:nth-child(5) .value {
  color: var(--control-accent);
}

/* 4) geminiReports 1280px 테이블 우측 잘림 해소 (index.html:76) */
#app .gemini-report-detail {
  overflow-x: auto;
}
#app .gemini-report-detail table {
  min-width: 0;
  table-layout: fixed;
  overflow-wrap: anywhere;
}
```

### 5. 회장님 제보 3건 전용 수정
1. **`investment` KPI 중복 및 줄바꿈** ([index.html:390-402](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/index.html#L390-L402)):
   - 상단 `.investment-live` 요약 스트립과 본문 `#brokerDashboardStats` 중 **상단 `.investment-live`를 유지할 경우 `#brokerDashboardStats` 상단 요약 행을 숨기거나 통합**해 1개 행만 노출(계산 로직 변경 없이 표시 슬롯 1곳으로 일원화).
   - `기록 없음` 줄바꿈 방지를 위해 `#brokerDashboardStats .stat .value` 또는 `#investmentLiveCash`에 `white-space:nowrap` 적용 및 첫 칸 최소 폭 확보.
2. **`organization` 히어로 이미지·텍스트 분리** ([hani-organization-hub.css:228-243, 378-388](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-organization-hub.css#L228-L243)):
   - 데스크톱 히어로를 `display:grid; grid-template-columns:minmax(0, 1fr) minmax(320px, 1.15fr); gap:20px` 2단 배치로 분리하여 `.ogh-hero-copy`가 사진 위를 덮지 않도록 변경.
   - `.ogh-hero-art > img`는 `width:100%; height:100%; object-fit:cover; object-position:center top`으로 변경해 좌우 여백 제거.
3. **`HANI REMOTE` 마감 색 연동·중복 정리** ([hani-context-remote.css:13-35](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-context-remote.css#L13-L35), [hani-context-remote-v1.js:13-72](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/themeaudit/hani-context-remote-v1.js#L13-L72)):
   - `body[data-finish-active]`에서 `--remote-row:var(--surface-raised)`, `--remote-current:var(--control-soft)`, `--remote-primary:var(--control-soft)`, `--remote-primary-line:var(--control-accent)`, `--remote-focus:var(--control-accent)`로 치환해 4종 마감 색과 일치시킴.
   - 상단 원형 4버튼과 하단 네비 중복 및 `home`에서의 `오늘 할 일` 2~3중 출현을 1세트로 통합하고, `HANI REMOTE` → `빠른 리모컨`, `SECTION SHORTCUTS` → `화면 바로가기`로 한국어화.
