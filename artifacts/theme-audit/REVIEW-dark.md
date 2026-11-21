# HANI OS 다크 마감(Titanium Graphite · Midnight Black) 테마 QA 리포트

- **점검 대상**: `shots/pc/` PC 스크린샷 37개 메뉴 × 다크 2종 마감 (`titanium-graphite__*`, `midnight-black__*`, 총 74장) + 비교 기준 (`porcelain-cream__home`, `porcelain-cream__work`)
- **점검 범위**: `index.html`, `hani-design-system.css`, `hani-style-01.css`~`08.css`, `hani-context-remote.css`, `hani-context-remote-v1.js`, `hani-organization-hub.css`, `hani-procrastination-board.css`, `hani-yuna-helpdesk.css`, `hani-development-history.css`, `hani-ilbo.css`, `hani-office-live.css`, `hani-study-v02984.js`, `hani-ui-cleanup-v02971.js`, `hani-ui-v02992.js`
- **전제**: 계산·저장·데이터 로직(`localStorage`, `hani_os_life_v23`, Supabase 등)은 건드리지 않고, CSS 토큰·선택자 및 UI 표현 수준 개선안만 제시함.
- **특이사항 (`work` 메뉴)**: `hani-ui-cleanup-v02971.js:208-220` (`removeWorkBoardUI`)가 런타임에 `.nav-btn[data-view="work"]`와 `#work`를 제거하므로 `shots/pc/*__work.jpg` 2종 모두 실제 화면은 **대시보드(`home`)**가 캡처됨.

---

## 1. 회장님 지적 3건 확인 결과

1. **투자(`investment`) — 숫자 박스 제목 흰 띠 + KPI 줄 2회 중복**: **사실 확인 완료 (심각도: 상)**
   - **흰 상자·흰 띠**: `hani-design-system.css:2214-2217`에서 다크 마감 구분 없이 `#app #investment :is(.investment-tabs-main,.investment-live,.broker-stats){background:#fff!important;color:#28374c!important}`와 `#app #investment :is(.investment-live small,.broker-stats .label){color:#4d4660!important;background:#fff!important}`를 강제하고 있어, 다크 카드 안에서 `.investment-live`·`.broker-stats` 전체 또는 라벨(`small`, `.label`)이 흰 상자·흰 띠로 뜸. 추가로 `hani-design-system.css:646`에서도 `#investment .stat`에 `--surface-panel:#fff`를 강제함.
   - **KPI 줄 중복**: `index.html:390-395`의 `#investment .investment-live`(`최근 총자산 · 평가금액 · 평가손익`)와 바로 아래 `index.html:402`의 `#brokerDashboardStats`(월간 결산 패널 내 KPI: `총자산 · 평가금액 · 평가손익`)가 첫 화면에 나란히 동시에 노출되어 동일한 핵심 수치가 2번 표시됨.

2. **회사 소개(`organization`) — 메인 그림 가로 여백 + 밝은 글상자 겹침**: **사실 확인 완료 (심각도: 상)**
   - **가로 미채움**: `hani-organization-hub.css:387-388`의 `.ogh-hero-art>img`가 `object-fit:contain`으로 지정되어 가로가 넓은 히어로 프레임 좌우에 빈 여백 띠가 남음.
   - **밝은 글상자 겹침**: `hani-organization-hub.css:378`의 `.ogh-hero-copy`가 `background:rgba(255,255,255,.94);color:#111c32`로 고정되어 단체 사진 위 왼쪽 하단을 흰 불투명 상자로 가림.

3. **오른쪽 사이드바 리모컨(`HANI REMOTE`) — 복잡함, 버튼 중복, 영어 혼용**: **사실 확인 완료 (심각도: 중)**
   - **제목·라벨 영어**: `hani-context-remote-v1.js:46`의 `HANI REMOTE`, `:72`의 `SECTION SHORTCUTS`, 및 기본 단축키 라벨(`Preview`, `Release`, `Release Queue`, `Inbox`, `HINA QA`, `Registry`, `Calendar`, `AURA 쇼룸`, `HANI Insight`)이 영어로 노출됨.
   - **버튼·기능 중복**: `:51-56`(`.hani-remote-media-actions` 원형 아이콘 4개: `주 작업 / 빠른 입력 / 담당 / 최근`) 바로 아래 `:59-66`(`.hani-remote-nav`)이 **동일한 4개 작업**(`primary`, `유나에게 빠른 입력`, `담당`, `최근`)을 텍스트 버튼으로 한 번 더 반복함. 게다가 `home` 화면에서는 `:13`의 `primary: "오늘 할 일"`이 바로 아래 `:68-70`(`.hani-remote-today`, `오늘 할 일`)과 겹쳐 **‘오늘 할 일’이 리모컨 한 곳에서 2~3번 중복**됨.
   - **접기 버튼 흰 배경**: `hani-context-remote.css:13`의 `.hani-remote-collapse`가 `background:#fff`로 고정되어 다크 바 상단에서 동떨어짐.

---

## 2. 고칠 순서 Top 10

| 순위 | 대상 | 영향 범위 | 핵심 원인 요약 | 기대 효과 |
|---|---|---|---|---|
| **1** | **전역 히어로 배너 다크화** (`.ds-main-character-banner`, `#home > .ds-main-character-banner`) | 약 35개 메뉴 공통 (설정 제외 거의 전체) | `hani-design-system.css:462-464, 576-584, 932-938`이 배너 배경과 `--text`를 파스텔 흰/크림/검정 잉크로 고정 (`.ds-tone-system`만 다크) | 다크 화면 첫인상을 해치는 거대한 밝은 배너 35곳 일괄 해소 |
| **2** | **`hani-design-system.css` 강제 `#fff` 일괄 해제** (`:645-656`, `:2200-2228`) | `investment`, `asset`, `travel`, `study`, `wishlist`, `diary`, `diet`, `certificate` 등 | "고정 밝은 표면"을 이유로 다크 마감에서도 `--surface-panel:#fff` 및 `background:#fff!important`를 강제함 | 투자 숫자 박스 흰 띠·탭·자산 카드·여행 KPI·위시리스트·달력 토글 흰 상자 일괄 제거 |
| **3** | **좌측 사이드바 3종 결함 수정** (`.sidebar-corporate-lockup`, `.dashboard-nav .ico`, `.season-frame-band`) | 모든 37개 메뉴 공통 프레임 | `:864-865` 흰 로고 박스, `hani-style-01.css:1068` + `:666` 흰 바탕 위 흰 아이콘(대비 붕괴), `:674` 가을 잎 반복(`Ø` 모양) | 대시보드/마일스톤 비활성 아이콘 가독성 회복 + 좌측 패널 완전 다크화 |
| **4** | **다크 마감 선택자 누락 보완** (`[data-theme="dark"]` & `midnight-black` 단독 매칭) | `milestones`, `agentReview`, `ilbo`, `procrastination` | 다크 마감이 `[data-finish="midnight-black"]`, `[data-finish="titanium-graphite"]` 속성을 쓰는데 일부 CSS가 `[data-theme="dark"]`나 `midnight-black`만 매칭 | 티타늄 그라파이트 전용 흰/크림 깨짐(`milestones`, `agentReview`) 및 `ilbo`·`procrastination` 흰 카드 제거 |
| **5** | **`CSS` 로드 순서·후발 feature CSS 다크 오버라이드 추가** | `intake`, `dev`, `deployment`, `organization`, `study` | `hani-yuna-helpdesk.css`, `hani-development-history.css`, `hani-organization-hub.css`, `hani-style-07.css`, `hani-study-v02984.js` 동적 `<style>`이 하드코딩 `#fff` 사용 | 인포데스크·개발센터·배포센터·공부 화면의 전면 흰 카드/탭 문제 해결 |
| **6** | **투자(`investment`) KPI 중복 제거** | `investment` | `#investment .investment-live`와 `#investMonthly #brokerDashboardStats` 동시 표시 | 첫 화면 중복 KPI 제거(한 곳만 상단 요약으로 남기거나 월간 패널과 역할 분리) |
| **7** | **회사 소개(`organization`) 히어로 이미지·글상자 정비** | `organization` | `.ogh-hero-art>img`의 `object-fit:contain` + `.ogh-hero-copy` 흰 배경 겹침 | 이미지 가로 풀블리드(`cover`) + 다크 반투명 그라데이션 스크림 |
| **8** | **대시보드(`home`) 대화 박스 & 공통 말풍선 다크화** | `home`, `investmentIntake`, `ledger` 등 | `.home-dialogue-shell`(`#fff!important`), `#homeDialogueText`, `.ds-agent-comment>div`, `.ds-jieun>div`, `#ledgerJieunComment` | 대시보드 첫 화면의 대형 흰 말풍선 박스와 계좌 업데이트/가계부 흰 코멘트 박스 해소 |
| **9** | **`HANI REMOTE` 중복 버튼 정리 및 한글화** | 모든 37개 메뉴 우측 사이드바 | `hani-context-remote-v1.js`의 원형 4버튼 + 텍스트 4버튼 중복, `today` 중복, 영어 헤더(`HANI REMOTE`, `SECTION SHORTCUTS`) | 리모컨 시인성·단순화·영어 제거 |
| **10** | **화면 노출 영어 제목·개발 용어 한국어화 + 저대비 보정** | `reading`, `movie`, `game`, `diary`, `deployment`, 배너 `eyebrow`/`role` | `RECORD INPUT`, `WIN/LOSS`, `HANI RELEASE STATUS`, `SUPABASE RELEASE QUEUE`, `LOCAL FIRST`, `#diary` `열기` 저대비 등 | 대표님 화면 기준 자연스러운 한국어 UI 및 4.5:1 이상 대비 확보 |

---

## 3. 공통 원인 묶음 (다수 메뉴 반복)

| 공통 원인 ID | 원인 설명 | 영향 받는 메뉴 | 추정 원인 위치 (파일 · 선택자) |
|---|---|---|---|
| **C1. 상단 히어로 배너 라이트 고정** | 설정(`settings`)의 `.ds-tone-system`만 다크 배너가 적용되어 있고, 나머지 tone(`office`, `finance`, `health`, `growth`, `life`, `work`, `company`, `sports`) 및 `#home` 히어로는 파스텔 그라데이션 + `#28374c` 잉크로 고정. 또한 `milestones`는 `midnight-black`만 다크 오버라이드가 있어 `titanium-graphite`에서 크림색 유지. | `settings` 제외 **35개 메뉴** (`work` 제외 실화면 34개) | `hani-design-system.css:462-464`, `:576-584`, `:932-938`, `:1872-1873` |
| **C2. 히어로·모듈 내 영어 eyebrow/role 노출** | 모든 배너 데이터에 `FINANCE · PORTFOLIO`, `Chief of Staff`, `Schedule Desk` 등 영문 직함/분류가 그대로 출력됨. 상단 상태바에도 `LOCAL FIRST · CLOUD · READY` 노출. | 전 메뉴 공통 | `hani-ui-v02992.js:1000-1099` 등 배너 메타데이터, `index.html` 상단 상태바(`LOCAL FIRST`) |
| **C3. 좌측 사이드바 3종 공통 결함** | ① 하단 `AI TEAM` 카드 흰 배경(`#fff`), ② 비활성 `대시보드`/`마일스톤` 아이콘 원형 바탕이 거의 흰색(`color-mix(...#fff)`)인데 아이콘 글자색이 다크 `--text-primary`(#f1f0ed)로 덮여 **흰 바탕 위 흰 아이콘**(가독 불가), ③ 상단 가을 시즌 띠가 `Ø Ø Ø` 모양으로 반복되어 낯선 기호처럼 보임. | **37개 메뉴 전체** | ① `hani-design-system.css:864-870` (`#app .sidebar-corporate-lockup`, `.hani-brand-logo-frame`)<br>② `hani-style-01.css:1068-1071` (`.dashboard-nav .ico`) + `hani-design-system.css:666` (`.nav-home .nav-btn :is(.ico,...)`)<br>③ `hani-design-system.css:640, 642, 674` (`.season-frame-band`) |
| **C4. 우측 `HANI REMOTE` 중복·영어·흰 버튼** | 원형 4버튼(`.hani-remote-media-actions`)과 아래 4버튼(`.hani-remote-nav`)이 기능 중복, `home`에서 `오늘 할 일` 중복, `HANI REMOTE` / `SECTION SHORTCUTS` 등 영어 노출, 접기 버튼 `>` 흰 원형(`#fff`). | **37개 메뉴 전체** | `hani-context-remote-v1.js:13, 46, 51-56, 59-72`, `hani-context-remote.css:13` (`.hani-remote-collapse`) |
| **C5. `#fff` / `#fff!important` 강제 표면 오버라이드** | 다크 마감(`body[data-finish-active]`)을 켠 상태에서 특정 패널/KPI/탭을 명시적으로 `#fff`로 고정해 어두운 배경 위에 흰 조각이 뜸. | `investment`, `asset`, `travel`, `study`, `wishlist`, `diary`, `diet`, `certificate`, `monthlyReport`, `ledger` | `hani-design-system.css:645-656`, `:1818-1827`, `:2201-2228`, `hani-style-01.css:2269` (`.date-mode-toggle`) |
| **C6. `[data-theme="dark"]` vs `[data-finish]` 선택자 불일치 및 `titanium-graphite` 누락** | 다크 마감이 `html[data-finish="midnight-black"]` / `html[data-finish="titanium-graphite"]`를 사용하는데, 일부 파일은 `[data-theme="dark"]`를 기대하거나 `midnight-black`만 조건에 넣음. | `milestones`, `agentReview`, `ilbo`, `procrastination` | `hani-design-system.css:1872-1873, 1939`, `hani-office-live.css:111-117`, `hani-ilbo.css:16`, `hani-procrastination-board.css:3, 39-44` |
| **C7. 말풍선·코멘트 박스 라이트 파스텔/화이트 고정** | 에이전트 코멘트·지은 코멘트 박스·유나/하루 대화 상자가 `#fff` / `#f9f3ff` / `#fff8ef`로 고정됨. | `home`, `investmentIntake`, `ledger` (해당 코멘트 노출 뷰 전반) | `hani-design-system.css:92` (`.ds-agent-comment>div`), `:124` (`.ds-jieun>div`), `:195,199` (`.ledger-jieun-comment`, `#ledgerJieunComment`), `:663` (`#homeDialogueText`), `hani-style-01.css:1639` (`.home-dialogue-shell`) |

---

## 4. 메뉴 × 마감 점검 표 (전체 37개 메뉴)

> **범례**:
> - 모든 메뉴에 **C1~C4(공통 배너·좌측 사이드바 3종·우측 HANI REMOTE)**가 기본 적용되므로, 아래 표에서는 **해당 메뉴 고유의 문제**와 **공통 원인 중 특히 두드러지는 마감 차이** 중심으로 정리함.
> - **심각도**: **상** = 읽기 어려움·대비 붕괴·겹침·대형 흰 면적 / **중** = 흰 상자·띠·중복·불일치로 눈에 띔 / **하** = 사소한 영어 라벨·용어·작은 뱃지.

| 메뉴 (`data-view`) | 마감 (`TG`: 티타늄 그라파이트 / `MB`: 미드나잇 블랙) | 발견된 문제 | 심각도 | 추정 원인 위치 (파일 · 선택자) |
|---|---|---|---|---|
| **대시보드 (`home`)** | TG · MB 공통 | 1. 상단 히어로 배너가 연보라 그라데이션(#f2eaff→#ddd2f1)으로 밝음 + 좌측 사이드바 비활성 아이콘 흰색 겹침<br>2. 본문 상단 `오늘의 대시보드` 대화 카드(`.home-dialogue-shell`)가 거대한 **순백색 박스**로 뜨고, 아바타 자리가 보라색 빈 박스로 보임(이미지 미로드 또는 배경 노출)<br>3. 하위 `.home-update-item`, `.home-account-grid .account-card`, `.home-calendar-mini`, `.home-task-mini-item` 등 파스텔/흰 표면 규칙 잔존<br>4. 공통 C1~C4 (`HANI REMOTE`에서 `오늘 할 일` 2~3회 중복 포함) | **상** | `hani-style-01.css:1639` (`.home-dialogue-shell`), `hani-design-system.css:184, 663` (`#homeDialogueText`), `:932-938` (`#home>.ds-main-character-banner`), `:645-656`, `hani-context-remote-v1.js:13, 68-70` (아바타 빈 박스는 `#homeDialogueAvatar` CSS/JS `추측`) |
| **마일스톤 (`milestones`)** | **TG 전용(심각)** / MB(공통 C1 제외 양호) | **TG에서만** 상단 히어로 배너가 밝은 크림색(`#fbf6ee`)으로 남음 (`MB`는 어두운 오버라이드 정상 적용). TG/MB 공통으로 일부 필터·상태 알약 및 공통 C2~C4 존재 | **중** (TG) / **하** (MB 본문) | `hani-design-system.css:1872-1873, 1939` (`:root[data-finish="midnight-black"]`만 지정하고 `titanium-graphite` 누락) |
| **인포데스크 (`intake`)** | TG · MB 공통 | 1. 유나 데스크 영역 전체(`.yuna-desk`), 대화창(`.yuna-conversation`), 예시 칩(`.yuna-chips button`), 입력창(`.yuna-composer`), 분류 선택박스(`.yuna-category-row select`)가 **모두 흰색(#fff/#fafafa)** 카드·표면으로 뜸<br>2. 영어 문구(`QUICK DESK`, `Preview 확인 후`) 노출<br>3. 공통 C1~C4 | **상** | `hani-yuna-helpdesk.css:14-19` (다크 마감 오버라이드 없음; `index.html:93`에서 `hani-design-system.css`보다 뒤에 로드됨) |
| **임원실 (`agentReview`)** | **TG 전용(심각)** / MB(양호) | **TG에서만** 1층~5층 건물 층별 탭/카드(`.hani-building-tabs button`)가 **전부 흰 카드(#fff)** 로 노출됨 (`MB`는 어두운 톤 정상 적용). 공통 C1~C4 (`OFFICE`, `HANI GROUP`) | **상** (TG) / **하** (MB 본문) | `hani-office-live.css:43, 111-117` (`.hani-building-tabs button` 다크 규칙이 `:root[data-finish="midnight-black"]`만 지정하고 `titanium-graphite` 누락) |
| **월간 경영 보고 (`monthlyReport`)** | TG · MB 공통 | 1. 상단 월 선택 옆 모드 전환 버튼(`.date-mode-toggle`)이 **밝은 흰색 사각 박스**로 뜸<br>2. 탭 영어 부제(`MONTHLY`, `EARNINGS CALL`, `SHAREHOLDER MEETING`) 노출<br>3. 공통 C1~C4 | **중** | `hani-style-01.css:2269` (`.date-mode-toggle{background:rgba(255,255,255,.86)}`), `hani-design-system.css:1117`·`index.html` (`추측`: 탭 영문 sub) |
| **회사 소개 (`organization`)** | TG · MB 공통 | 1. **(회장님 지적)** 히어로 팀 이미지가 가로 칸을 다 못 채우고 좌우에 어두운 여백이 남음 (`object-fit:contain`)<br>2. **(회장님 지적)** 사진 좌측 하단 위에 **밝은 반투명 흰 글상자**(`rgba(255,255,255,.94)`)가 겹쳐 있음<br>3. 상단 영어 목차 띠(`01 — STRATEGY`, `05 — BUSINESS`) 및 공통 C1~C4 | **상** | `hani-organization-hub.css:378` (`.ogh-hero-copy`), `:387-388` (`.ogh-hero-art>img`), `hani-organization-hub.js` (`01 — STRATEGY` 등) |
| **하니 일보 (`ilbo`)** | TG · MB 공통 | 신문 상단 제호 박스(`.ilbo-nameplate-illustrated`, `.ilbo-nameplate-copy`)만 **크림색(`#fffaf2`) 큰 상자**로 남아, 바로 아래 어두운 본문 신문 영역(`.ilbo-paper`)과 극명하게 어긋남. 공통 C1~C4 | **상** | `hani-ilbo.css:10, 13, 16` (`html[data-theme="dark"]`만 체크해 `[data-finish]`에서 미적용) |
| **회의실 (`board`)** | TG · MB 공통 | 본문 카드·탭은 다크 오버라이드(`:2243-2246`)로 비교적 잘 맞춰짐. 단 분류 탭 영어(`WORK`, `LIFE`, `MEMORY`, `LOUNGE`) 및 공통 C1~C4 존재 | **하** (본문) | `index.html:1103-1106` (영어 카테고리명), `hani-design-system.css:2243-2246` |
| **투자 (`investment`)** | TG · MB 공통 | 1. **(회장님 지적)** 투자 상단 탭(`.investment-tabs-main`), 상단 라이브 바(`.investment-live`), 월간 브로커 KPI(`.broker-stats`) 및 숫자 박스 제목(`small`, `.label`)에 **흰 상자·흰 띠** 발생<br>2. **(회장님 지적)** 위 `.investment-live`(`최근 총자산·평가금액·평가손익`)와 아래 `#brokerDashboardStats`(`총자산·평가금액·평가손익`) **KPI 줄이 2번 중복** 출력됨<br>3. `#investment .stat` 다크 표면 복원 누락 + `MONTHLY PICKS` 영어 뱃지 + 공통 C1~C4 | **상** | `hani-design-system.css:2214-2217`, `:646` (`#investment .stat`), `index.html:390-395` & `:402` (`#investment .investment-live` vs `#brokerDashboardStats`) |
| **투자위원회 (`investmentCommittee`)** | TG · MB 공통 | 본문 카드·탭·버튼은 다크 마감에 잘 어우러짐. `+ Research 작성` 영어 혼합 버튼 및 공통 C1~C4(`FINANCE · INVESTMENT REPORT`) 존재 | **하** (본문) | `hani-investment-committee*` (`추측`, 본문 HTML은 JS 동적 생성) |
| **자산 업데이트 (`investmentIntake`)** | TG · MB 공통 | 1. 안내 배너(`.asset-capture-intro`)와 `1. 업데이트할 계좌` 선택 영역이 **흰 박스/밝은 박스**로 뜸<br>2. 에이전트/지은 말풍선(`.ds-agent-comment>div`, `.ds-jieun>div`)이 **연보라(`#f9f3ff`)·크림(`#fff8ef`) 흰 상자**로 뜸<br>3. 영어 뱃지(`TSV ONLY`), 공통 C1~C4 | **상** | `hani-design-system.css:92` (`.ds-agent-comment>div`), `:124` (`.ds-jieun>div`), `:1818` (`.asset-capture-intro`), `index.html:708` (`TSV ONLY`), `:716` (`.asset-capture-account-first` 흰 배경 규칙은 `hani-style-08.css` 또는 `hani-design-system.css` 내 세부 규칙 `추측`) |
| **자산 (`asset`)** | TG · MB 공통 | 최상단 `통합 자산 대시보드 · 저장 기록` 카드(`.asset-dashboard-card`)와 내부 4개 KPI 박스(`총자산·투자상품·현금·평가손익`)가 **통째로 흰 카드·밝은 회색(#fff/#f8f9fc)** 으로 떠 아래 어두운 `계좌별 자산` 영역과 대비됨. 공통 C1~C4 | **상** | `hani-design-system.css:645-646` (`.asset-dashboard-card`, `#asset .stat`), `:650` (`#assetComposition>.item`, `#asset .account-card`) |
| **가계부 (`ledger`)** | TG · MB 공통 | 1. 어두운 `JISPI 종합 지수` 카드 안에 `JIEUN'S COMMENT` 박스(`.ledger-jieun-comment`, `#ledgerJieunComment`)만 **크림/순백색 상자**로 돌출 + 영어 제목(`JIEUN'S COMMENT`, `JISPI`, `4 CATEGORIES · JISPI`)<br>2. 결산 월 옆 `.date-mode-toggle` **흰 정사각 버튼**<br>3. 공통 C1~C4 | **상** | `hani-design-system.css:195, 199` (`.ledger-jieun-comment`, `#ledgerJieunComment`), `hani-style-01.css:2269` (`.date-mode-toggle`), `index.html:749, 756` |
| **뉴스룸 (`newsroom`)** | TG · MB 공통 | 본문 카드·기사 영역은 다크 톤으로 정상. 공통 C1~C4만 해당 | **하** (본문 이상 없음) | 공통 원인 C1~C4 |
| **식단 (`diet`)** | TG · MB 공통 | 날짜 전환 버튼(`.date-mode-toggle`) 흰 배경 강제, `Preview` 영어 표기, 공통 C1~C4 | **하~중** | `hani-design-system.css:2227-2228` (`#diet .date-mode-toggle`) |
| **운동 (`exercise`)** | TG · MB 공통 | 본문 영역 특이 결함 거의 없음 (공통 C1~C4 제외 시 안정적) | **하** (본문 이상 없음) | 공통 원인 C1~C4 (`:1825` `#exercise .stat`은 `--appearance-raised` 상속으로 다크 유지 확인 필요) |
| **독서 (`reading`)** | TG · MB 공통 | 상단 접이식 `+ 기록 추가` 바(`.phase1-collapsible-form`)가 **큰 흰/반투명 흰 띠**로 뜨며 영어 라벨 `RECORD INPUT` 노출. 공통 C1~C4 | **중** | `hani-design-system.css:978-982` (`#app :is(#reading,#movie) .phase1-collapsible-form`, `>summary span:before{content:"RECORD INPUT"}`) |
| **공부 (`study`)** | TG · MB 공통 | 1. 상단 칩(`프로젝트 0 · 퀴즈 0 · 오답 0`, `.study-chip`), 서브탭 바(`학습 / 오답노트 / 학습 기록`, `.study-subtabs`), 카드(`.study-card-v02984`), 빈 상태 박스(`.study-main-empty`)까지 **본문 UI 전체가 흰색/연보라 라이트 모드** 그대로 노출<br>2. 영어 문구(`Quiz 0개`, `Learning Board`, `HANI OS · MOCK EXAM`, `WRONG ANSWERS`, `PROJECT HISTORY`) + 공통 C1~C4 | **상** | `hani-study-v02984.js:760-807` (JS가 `<head>`에 `#hani-study-v02984-style` 동적 주입: `.study-chip`, `.study-subtabs`, `.study-card-v02984`, `.study-main-empty`, `.study-project-row`, `.study-board` 등 전부 `#fff`/`#f8f6ff` 하드코딩), `hani-design-system.css:2218-2219` (`#app #study .study-main-empty{background:#fff!important}`) |
| **대학교 (`university`)** | TG · MB 공통 | 상단 학기 상태 뱃지(`#campusSemesterStatus`, `학기 없음`)가 밝은 흰/회색 알약으로 보임(경미). 나머지 본문은 다크 톤 안정. 공통 C1~C4 | **하** | `index.html:1400` (`#campusSemesterStatus`, 배경색 규칙 `추측`) |
| **자격증 (`certificate`)** | TG · MB 공통 | 본문 대부분 다크 톤 양호. `.date-mode-toggle` 강제 `#fff` 규칙이 걸려 있으며 공통 C1~C4 해당 | **하** | `hani-design-system.css:2227-2228` (`#certificate .date-mode-toggle`) |
| **위시리스트 (`wishlist`)** | TG · MB 공통 | 1. KPI 필터 알약 4개(`.wishlist-kpis>div`: `전체 0`, `검토중 0`, `구매/실행 예정 0`, `완료 0`)가 **흰 배경 박스**로 뜸<br>2. 제목·필터 영어(`Wish-list`, `ITEM`) + `#wishlistCount`(`0개`) 밝은 뱃지 + 공통 C1~C4 | **중** | `hani-design-system.css:645` (`.wishlist-kpis>div` `--surface-panel:#fff`), `index.html:1419-1421` (`#wishlistCount` 뱃지는 `추측`) |
| **여행 (`travel`)** | TG · MB 공통 | 1. 상단 3개 탭(`.travel-tabs`: `여행 아카이브 / 맛집 & 명소 / 갈 여행`)이 **흰 띠 배경**<br>2. 하위 KPI 4칸(`.module-kpis > .module-kpi`)이 **전부 흰 카드(#fff!important)** 로 뜸<br>3. 공통 C1~C4 | **상** | `hani-design-system.css:270` (`#app #travel .travel-tabs{background:#fff}`), `:273` (`.module-kpi`), `:2201` (`#app #travel .module-kpi{background:#fff!important;color:#28374c!important}`) |
| **영화 (`movie`)** | TG · MB 공통 | `reading`과 동일하게 상단 `+ 기록 추가` 바(`.phase1-collapsible-form`)가 **흰 띠** + 영어 `RECORD INPUT` 노출. 공통 C1~C4 | **중** | `hani-design-system.css:978-982` |
| **게임 (`game`)** | TG · MB 공통 | 1. 상단 뷰 전환 탭(`.sports-view-tabs`, active 탭 `#fff`)과 하단 갱신 안내 뱃지(`.sports-update-policy span`)가 **밝은 흰 박스**<br>2. `Real Madrid` 팀 카드(`.team-madrid`)와 4개 팀 로고 바탕(`.sports-home-logo`), 승패 뱃지 바탕(`.sports-home-team em`)이 **흰 배경**으로 뜸<br>3. 영어 다수(`SPORTS HOME`, `WIN`, `LOSS`, `DAILY UPDATE`, `LALIGA · UEFA` 등) + 공통 C1~C4 | **상** | `hani-design-system.css:879-881` (`.sports-view-tabs`), `:886` (`.team-madrid`), `:891` (`.sports-home-logo`), `:896` (`.sports-home-team em`), `:986` (`.sports-update-policy span`), `index.html:1500-1534` |
| **일기 (`diary`)** | TG · MB 공통 | 1. `일기 작성` 접이식 헤더 오른쪽 `열기` 글자가 어두운 카드 배경 위에서 **어두운 보라색으로 저대비**(읽기 어려움)<br>2. 빈/목록 카드(`[data-diary-view]`) 규칙에 `#fff!important` 잔존 + 공통 C1~C4 | **중~상** | `hani-design-system.css:2220` (`#app #diary [data-diary-view]{background:#fff!important;color:#49385f!important}`), `열기` 텍스트 색상 선택자(`hani-diary*` 또는 `.phase1-collapsible-form` 유사 토글 `추측`) |
| **할 일 (`tasks`)** | TG · MB 공통 | 본문 다크 톤 양호. `Google Calendar Sync` / `Embed URL` 등 연동 영어 라벨 및 공통 C1~C4만 존재 | **하** (본문) | `index.html` (`#tasks` 캘린더 연동 문구 `추측`), 공통 C1~C4 |
| **미루기 탈출 (`procrastination`)** | TG · MB 공통 | 본문 전체(`.pb-card`, `.pb-legend span`, `#procrastinationCount`, `.pb-speech` 등)에 **다크 테마가 전혀 적용되지 않아 흰/크림 상자**로 뜸 + 영어 제목(`A LITTLE NUDGE / HANI GROUP`) + 공통 C1~C4 | **상** | `hani-procrastination-board.css:3, 39-44` (`[data-theme="dark"] #procrastination` 선택자를 사용해 `[data-finish]`에서 전부 미적용) |
| **캘린더 (`calendar`)** | TG · MB 공통 | 본문 다크 톤 양호. `Google Calendar` / `Embed URL` 영어 안내 및 공통 C1~C4 존재 | **하** (본문) | `index.html`, 공통 C1~C4 |
| **업무 (`work`)** | TG · MB 공통 | *(비고)* 런타임에 메뉴 자체가 제거되어 스크린샷이 **대시보드(`home`)** 화면으로 촬영됨 (문제 내역은 `home`과 동일) | — | `hani-ui-cleanup-v02971.js:208-220` (`removeWorkBoardUI`) |
| **Drive (`drive`)** | TG · MB 공통 | 본문 다크 톤 양호. 메뉴명·버튼 `Google Drive` 외 특이 결함 없음 (공통 C1~C4 제외 시 이상 없음) | **하** (본문 이상 없음) | 공통 원인 C1~C4 |
| **AI 협업 (`aiWork`)** | TG · MB 공통 | 본문 다크 톤 양호. `개발 지원` 상태 알약 밝기 경미 차이 외 특이 결함 없음 (공통 C1~C4 제외 시 이상 없음) | **하** (본문 이상 없음) | 공통 원인 C1~C4 |
| **개발센터 (`dev`)** | TG · MB 공통 | 상단 개요 카드(`.hani-dev-history-overview`), KPI 칸(`.hani-history-kpis>div`), 툴바(`.hani-history-toolbar`), 이력 행(`.hani-history-list .hani-history-row`) 등 **본문 대부분이 흰색·연보라(#fff, #f5f2ff)** 로 노출. 공통 C1~C4 | **상** | `hani-development-history.css:25, 28, 30, 34` (`index.html:92`에서 `hani-design-system.css`보다 뒤에 로드되며 다크 마감 규칙 부재) |
| **AI 리포트 (`geminiReports`)** | TG · MB 공통 | 본문 카드·리스트 다크 톤 양호 (공통 C1~C4 제외 시 이상 없음) | **하** (본문 이상 없음) | 공통 원인 C1~C4 |
| **배포센터 (`deployment`)** | TG · MB 공통 | 1. 상단 대표 요약 카드(`.deploy-exec-status`)가 **밝은 크림→흰 그라데이션(`#fffaf0 → #fff`)**<br>2. 내부 `PREVIEW BEFORE COMMIT` 뱃지(`.deploy-mode`), 진행 단계 바(`.deploy-progress span`), 인박스 KPI(`.deploy-inbox-kpi`)가 **전부 흰/밝은 회색(#fff/#f2f3f7)**<br>3. 영어·개발 용어 다수(`HANI RELEASE STATUS`, `SUPABASE RELEASE QUEUE`, `Queue 비어 있음`, `AUTO`, `CLEAR`, `VERSION`, `PR`, `HINA`, `SHA`, `Release Queue`) + 공통 C1~C4 | **상** | `hani-style-07.css:9, 17, 19-20, 24-28`, `index.html:1565-1598` |
| **AI 예산 (`aiBudget`)** | TG · MB 공통 | 본문 다크 톤 양호 (공통 C1~C4 제외 시 이상 없음) | **하** (본문 이상 없음) | 공통 원인 C1~C4 |
| **테마 스튜디오 (`aura`)** | TG · MB 공통 | 1. 상단 마감/시즌 전환 탭 바(`.aura-tabs`)가 **밝은 흰 띠**로 노출<br>2. 미리보기 카드(`.aura-preview`)가 **크림→연보라 라이트 그라데이션(`#fffaf3 → #f2edf8`)** 으로 뜸<br>3. 영어 문구(`SIGNATURE FINISHES`, `CORE FINISHES`, `FINISH`, `SEASON`, `TITANIUM GRAPHITE × AUTUMN`) + 공통 C1~C4 | **상** | `hani-design-system.css:687-693` (`.aura-preview`), `.aura-tabs` 흰 띠 배경은 `hani-style-01.css:30` `.tabs` 상속 또는 `hani-design-system.css` 내 별도 규칙 `추측` |
| **설정 (`settings`)** | TG · MB 공통 | 히어로 배너(`.ds-tone-system`)까지 유일하게 다크 톤이 적용되어 **가장 완성도 높음**. 단 공통 C2~C4(좌측 사이드바 3종 + 우측 `HANI REMOTE` + 배너 `SYSTEM · DATA CONTROL`)와 `LOCAL` 뱃지 등 일부 영어 용어만 남음 | **하** (본문 이상 없음) | `hani-design-system.css:583` (`.ds-tone-system`), 공통 원인 C2~C4 |

---

## 5. 이상 없음 목록

> **중요 전제**: 모든 37개 화면 공통으로 **① 좌측 사이드바(C3)**, **② 우측 `HANI REMOTE`(C4)**, **③ 상단 상태바·배너 영문 표기(C2)**, 그리고 `settings` 외 35개 화면 **④ 히어로 배너 라이트 배경(C1)** 이 나타나므로, **완벽한 무결함 메뉴는 0개**입니다.  
> 단, **메뉴 본문 영역(공통 프레임 제외)** 기준으로 시인성·흰 상자·레이아웃 결함이 없는 메뉴는 다음과 같습니다.

- **본문 이상 없음 (9개)**:
  1. `settings` (설정 — 유일하게 히어로 배너까지 다크 완성)
  2. `newsroom` (뉴스룸)
  3. `exercise` (운동)
  4. `drive` (Drive)
  5. `aiWork` (AI 협업)
  6. `geminiReports` (AI 리포트)
  7. `aiBudget` (AI 예산)
  8. `calendar` (캘린더 — `Google Calendar Embed URL` 영문 라벨만 존재)
  9. `tasks` (할 일 — `Google Calendar` 영문 라벨만 존재)
- **본문 다크 톤 양호 · 경미한 영어 라벨/소형 뱃지(`하`)만 있음 (4개)**:
  - `board` (회의실 — `WORK/LIFE/MEMORY/LOUNGE` 영어 탭)
  - `investmentCommittee` (투자위원회 — `+ Research 작성` 영어 혼합 버튼)
  - `university` (대학교 — `학기 없음` 뱃지 밝기 경미)
  - `certificate` (자격증 — `.date-mode-toggle` 규칙 잔존 여부 외 본문 양호)
- **비활성 메뉴 (1개)**:
  - `work` (업무 — 런타임 제거로 `home`과 동일 화면 촬영됨)

---

## 6. CSS 토큰 · 선택자 수준 수정 제안 (계산·데이터·저장 무변경)

다크 마감 2종(`titanium-graphite`, `midnight-black`)은 공통 선택자 `:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"])` 또는 `body[data-finish-active="true"]` 스코프로 일관되게 처리해야 `titanium-graphite`만 빠지는 버그(C6)가 재발하지 않습니다.

### A. 공통 토큰 & 다크 히어로 배너 (`hani-design-system.css`)

```css
/* 1) 다크 마감 2종 공통 선택자 별칭 정의 */
/* C1 해소: .ds-main-character-banner 및 #home 히어로를 .ds-tone-system 수준 어두운 서피스로 통일 */
:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"]) body #app :is(
  .ds-main-character-banner,
  #home > .ds-main-character-banner
) {
  --text: var(--text-primary);
  --mcb-bg: linear-gradient(135deg, var(--surface-raised) 0%, var(--surface-panel) 100%);
  --mcb-overlay: linear-gradient(90deg, rgba(16, 19, 28, .92) 0%, rgba(16, 19, 28, .68) 48%, rgba(16, 19, 28, .12) 100%);
  --mcb-border: var(--border-subtle, rgba(255, 255, 255, .10));
  color-scheme: dark;
  color: var(--text-primary);
}

/* 2) C5 해소: 다크 마감에서 #fff / #fff!important 강제 해제 → CSS 변수 위임 */
:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"]) #app :is(
  .asset-dashboard-card,
  #assetComposition > .item,
  #asset .account-card,
  .home-account-grid .account-card,
  .home-calendar-mini,
  #home .home-update-item,
  .wishlist-kpis > div,
  .wishlist-reason,
  .deploy-inbox-summary,
  .home-accounts-wrap,
  .home-task-summary,
  .home-task-mini-item,
  .agent-life-actions,
  #asset .stat,
  #investment .stat,
  #travel .travel-tabs,
  #travel .module-kpi,
  #investment .investment-tabs-main,
  #investment .investment-live,
  #investment .broker-stats,
  #study .study-main-empty,
  #diary [data-diary-view],
  #diet .date-mode-toggle,
  #certificate .date-mode-toggle,
  .date-mode-toggle
) {
  --surface-panel: var(--appearance-panel, #1e212b);
  --surface-raised: var(--appearance-raised, #262a36);
  background: var(--surface-raised) !important;
  color: var(--text-primary) !important;
  border-color: rgba(255, 255, 255, .10) !important;
  color-scheme: dark;
}

:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"]) #app #investment :is(
  .investment-live small,
  .broker-stats .label,
  .investment-tabs-main .tab:not(.active)
) {
  background: transparent !important;
  color: var(--text-secondary, #b8becb) !important;
}
```

### B. 좌측 사이드바 & 말풍선 & `home` (`hani-design-system.css`, `hani-style-01.css`)

```css
/* C3-1) AI TEAM 로고 카드 다크화 */
:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"]) #app .sidebar-corporate-lockup,
:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"]) #app .hani-brand-logo-frame {
  background: var(--surface-raised, #242834);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, .10);
}

/* C3-2) 비활성 대시보드/마일스톤 아이콘 대비 붕괴(흰 배경 + 흰 글자) 수정 */
:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"]) #app #sidebar .dashboard-nav .ico {
  background: color-mix(in srgb, var(--season-accent) 22%, #1d2029) !important;
  color: var(--text-primary) !important;
}

/* C7) 대시보드 대화 박스 및 에이전트/지은 코멘트 말풍선 다크화 */
:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"]) #app :is(
  .home-dialogue-shell,
  #homeDialogueText,
  .ds-agent-comment > div,
  .ds-jieun > div,
  .ledger-jieun-comment,
  #ledgerJieunComment,
  :is(#reading, #movie) .phase1-collapsible-form
) {
  background: var(--surface-raised, #242834) !important;
  color: var(--text-primary) !important;
  border-color: rgba(255, 255, 255, .10) !important;
}
```

### C. `titanium-graphite` 누락 및 `[data-theme="dark"]` 선택자 불일치 수정 (C6)

- **`hani-design-system.css:1872-1873, 1939`** (`milestones`): `:root[data-finish="midnight-black"]`를 `:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"])`로 확장.
- **`hani-office-live.css:111-117`** (`agentReview`): 동일하게 `.hani-building-tabs button` 다크 규칙에 `[data-finish="titanium-graphite"]` 추가.
- **`hani-ilbo.css:16`** (`ilbo`): `html[data-theme="dark"]` → `:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"])`로 변경.
- **`hani-procrastination-board.css:3, 39-44`** (`procrastination`): `[data-theme="dark"]` → `:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"])`로 변경.

### D. Feature 전용 CSS/동적 스타일 다크 마감 규칙 추가

- **`hani-yuna-helpdesk.css:14-19`** (`intake`): `.yuna-desk`, `.yuna-conversation`, `.yuna-chips button`, `.yuna-composer`, `.yuna-category-row select`에 다크 마감용 `background: var(--surface-raised); color: var(--text-primary); border-color: rgba(255,255,255,.12);` 추가.
- **`hani-development-history.css:25-34`** (`dev`): `.hani-dev-history-overview`, `.hani-history-kpis>div`, `.hani-history-toolbar`, `.hani-history-list .hani-history-row`에 다크 마감 오버라이드 추가.
- **`hani-style-07.css:9-28`** (`deployment`): `.deploy-exec-status`, `.deploy-mode`, `.deploy-progress span`, `.deploy-inbox-kpi`에 다크 마감 오버라이드 추가.
- **`hani-study-v02984.js:779-801`** (`study`): 동적 `<style id="hani-study-v02984-style">` 내 하드코딩 `#fff`/`#f8f6ff`/`#fbfaff`를 `var(--surface-panel)` / `var(--surface-raised)` / `var(--text-primary)` 토큰으로 치환.
- **`hani-organization-hub.css:378, 387-388`** (`organization`):
  - `.ogh-hero-art > img`: `object-fit: contain` → `object-fit: cover; width: 100%; height: 100%;` (컨테이너 비율 조정과 병행).
  - `.ogh-hero-copy`: 다크 마감에서 `background: linear-gradient(90deg, rgba(17,20,28,.88), rgba(17,20,28,.65)); color: var(--text-primary);`로 반전.
- **`hani-design-system.css:687-693`** (`aura`) & **`879-896, 986`** (`game`): `.aura-preview`, `.sports-view-tabs`, `.sports-update-policy span`, `.team-madrid` 등에 다크 마감 변수 적용.
- **`hani-context-remote.css:13`** & **`hani-context-remote-v1.js:46-72`** (`HANI REMOTE`):
  - `.hani-remote-collapse` 배경을 `var(--surface-raised)`로 변경.
  - `.hani-remote-media-actions`(원형 4버튼)와 `.hani-remote-nav`(텍스트 4버튼) 중 하나를 제거해 중복 해소, `home`에서 `.hani-remote-today`와 겹치는 `오늘 할 일` 항목 통합, `HANI REMOTE` / `SECTION SHORTCUTS`를 한국어(`빠른 리모컨`, `화면 바로가기`)로 통일.

### E. `investment` KPI 중복 및 영문 라벨 정리

- **`investment` KPI 중복 (`index.html:390-395` vs `:402`)**: `#investment` 상단 `.investment-live`와 월간 패널 내 `#brokerDashboardStats` 중 하나를 숨기거나 역할 분리(예: `.investment-live`는 "전체 보유 요약", 월간 패널은 "월간 증감·수익률"만 표시; 계산·저장 로직 무변경, 표시 슬롯만 조정).
- **영어·개발 용어 한국어화** (`index.html` 및 JS 렌더러 UI 텍스트): `HANI REMOTE` → `빠른 리모컨`, `SECTION SHORTCUTS` → `화면 바로가기`, `RECORD INPUT` → `기록 추가`, `JIEUN'S COMMENT` → `지은의 한마디`, `TSV ONLY` → `표 복사 붙여넣기`, `WIN/LOSS` → `승/패`, `HANI RELEASE STATUS` / `SUPABASE RELEASE QUEUE` / `VERSION` / `PR` / `SHA` → 대표님 화면용 한국어 상태 표기.
