# 메뉴 NEW·카운트 배지 및 `#aiWork` 초상화 크롭 수정 보고서

## 1. 적용 배지 목록 및 데이터 필드·근거

모든 배지는 신규 저장소(`localStorage`, Cloud) 쓰기 없이 기존 `state` / 메모리 `runtime`에서 읽기 전용으로만 계산합니다(`computeMenuBadges`, KST `+09:00` 기준).

| 메뉴 (`data-view`) | 배지 형태 | 데이터 키 / 출처 | 판별 기준 (검증 근거) |
|---|---|---|---|
| **HANI 라운지** (`board`) | `NEW` | `state.boardPosts` (`hani-main.js`, `hani-board.js`) | `!boardMeta && !pending && !draft && !disposition` 인 글 중 `publishedAt \|\| createdAt` KST 날짜가 오늘인 글 존재 시 표시 |
| **HANI 일보** (`ilbo`) | `NEW` | `window.HaniIlbo.hasTodayIssue()` / `issueDates()` (`hani-ilbo.js` · `data/hani-ilbo/issues.json`) | `issues`·`extras` 매니페스트의 `date` 중 오늘 KST 날짜(`YYYY-MM-DD`) 발행분이 있으면 표시 (`hani-ilbo-ready` 이벤트로 비동기 로드 직후 갱신) |
| **뉴스룸** (`newsroom`) | `NEW` | `investmentNewsArchiveRuntime.posts` & `readSet` (`hani-main.js`) | `event_at \|\| published_at \|\| created_at` KST 날짜가 오늘이면서 메모리 `readSet`에 포함되지 않은 기사가 있으면 표시 |
| **미룬 일** (`procrastination`) | 카운트 (`99+` 상한) | `window.HaniProcrastination.project(state, now)` (`hani-procrastination-board.js`) | 기존 projection 결과를 그대로 재사용해 `Number.isInteger(item.level) && item.level >= 1` 인 1단계 이상 대기 항목 수 표시 |
| **할 일** (`tasks`) | 카운트 (`99+` 상한) | `state.tasks` (`hani-main.js` `taskReadModel` 기준) | `!done` 이면서 `dueAt \|\| due` 의 KST 날짜가 오늘인 미완료 할 일 수 표시 |
| **공부** (`study`) | 카운트 (`99+` 상한) | `state.learningQuizzes` (`hani-main.js`, `hani-study-v02984.js`) | 순수 계산 함수 `computeMenuBadges`에는 오늘(`scheduledDate \|\| date \|\| createdAt`) 미완료 퀴즈 수를 포함했고, DOM에서는 기존 `[data-study-pending]` 슬롯이 이미 존재하는 경우 중복 배지를 붙이지 않고 기존 owner를 유지 |

### UI 배치·갱신·스타일
- **Persistent Slot + Update**: `renderNavNewBadges()`가 각 대상 `.nav-btn[data-view]`의 `.txt` 뒤에 `<span class="nav-new-pill" data-menu-badge="new|count">` 슬롯 1개만 유지·갱신하며 메뉴 DOM을 재생성하지 않습니다.
- **데스크톱 접힘(`.sidebar-mini`) / Fold(`700px~900px`) / 모바일 드로어(`.app.mobile-open`)**: `.sidebar-mini` 및 Fold rail에서는 `.ico` 우상단에 `NEW`는 8px 원형 점, 카운트는 소형 뱃지로 표시하며, 모바일 드로어에서는 확장형 사이드바와 동일하게 메뉴명 우측에 표시합니다. Finish 토큰(`--structure-accent`, `--structure-on-accent`)을 사용해 `midnight-black`, `titanium-graphite` 등 다크 테마에서도 대비를 유지합니다.
- **갱신 시점**: `showView()`, `renderAll()`(저장 후 재렌더), `hani-ilbo-ready` 이벤트 및 기존 자정 KST `setTimeout` 1회에서만 갱신하며 `setInterval`·`MutationObserver`를 추가하지 않았습니다.

---

## 2. 제외된 메뉴 및 사유

| 메뉴 (`data-view`) | 제외 사유 |
|---|---|
| `diary`, `diet`, `exercise`, `reading`, `movie`, `wishlist` | 사용자가 직접 입력하는 개인 기록 영역으로, 당일 미확인 알림(`NEW`)이나 처리 대기 카운트 성격에 맞지 않음 |
| `university`, `certificate` | 2일/14일/30일 등 항목별 임계치가 서로 다르며, 이미 홈·인포데스크 선제 안내 카드(`renderHaniCareCards`)가 담당하고 있음 |
| `milestones` | `hani-milestones.js` 내부 데이터/JSON 날짜 스키마를 본 작업 범위에서 검증하지 않아 불확실한 메뉴 제외 원칙에 따라 제외 |
| `agentReview` | 서버(`agentReviewRuntime`) 비동기 안건 목록으로, 초기 부트 시 로컬 `state`만으로 즉시 일관 판정할 수 없어 제외 |
| `aiWork`, `geminiReports`, `dev`, `deployment`, `aiBudget` | 정적 번들 카탈로그·릴리스 스냅샷 중심 정보이며 일일 사용자 미확인 도착 카운트 대상 아님 |
| `calendar`, `drive` | 외부 iframe(`calendarUrl`) / Google Drive API 기반 화면으로 로컬 `state` 대기 건수 없음 |
| `home`, `intake`, `monthlyReport`, `organization`, `investment`, `investmentCommittee`, `investmentIntake`, `asset`, `ledger`, `travel`, `game`, `work`, `aura`, `settings` | 대시보드·조회·설정 화면으로 별도 도착/대기 배지 대상 아님 (단, 기존 `NAV_NEW_DATES` 항목은 만료 전이면 그대로 지원) |

---

## 3. `#aiWork` (`#developmentTeamList`) 초상화 크롭 수정 내용

- **원인**: `hani-ui-cleanup-v02971.js`의 런타임 `<style>`이 `#developmentTeamList .member-visual { width: 100%; height: 160px }`와 `#aiWork [data-development-portrait] { object-fit: cover; object-position: center top }`을 적용해, 가로폭이 넓은 데스크톱 카드에서 정사각 프로필 이미지의 상단 160px(이마~눈)만 남고 코·입·턱이 잘리는 현상이 발생했습니다.
- **수정 (`hani-design-system.css` 말미)**:
  - 모든 셀렉터를 `#app #aiWork` 하위로 엄격히 제한해 `#home`, `#organization` 등 타 화면의 `.member-visual` / `.ui26-member`에 영향이 없도록 했습니다.
  - `#app #aiWork #developmentTeamList .member-visual`: `width: 100%; height: auto; aspect-ratio: 1 / 1; background-image: none!important;`
  - `#app #aiWork #developmentTeamList [data-development-portrait]`, `#app #aiWork .ai-team-profile-avatar [data-development-portrait]`: `object-fit: cover; object-position: center 20%;` (이마부터 턱까지 얼굴 전체 노출)
  - 390px 모바일 가로 넘침 방지를 위해 `#app #aiWork` 내부 카드/텍스트 컨테이너에 `min-width: 0; max-width: 100%; overflow-wrap: anywhere; word-break: keep-all;` 및 `@media(max-width:480px)` 간격·아바타 폭 조정을 추가했습니다.

---

## 4. 수정 / 생성 파일 목록

- **수정**
  - `hani-main.js` — `menuBadgeKstDay`, `menuBadgeDateToKstDay`, `formatMenuBadgeCount`, `computeMenuBadges`, `window.HaniMenuBadges`, `hani-ilbo-ready` 리스너, `renderNavNewBadges()` 슬롯 갱신, `renderAll()` 호출 추가
  - `hani-ilbo.js` — `window.HaniIlbo`에 읽기 전용 `hasTodayIssue`, `issueDates` 헬퍼 추가
  - `hani-style-08.css` — `#app.sidebar-mini #sidebar .nav-btn` 에서 `[data-menu-badge]` 숨김 예외 처리
  - `hani-design-system.css` — Fold(`700px~900px`)·`.sidebar-mini`·확장 사이드바 배지 스타일 및 `#app #aiWork` 초상화/390px 레이아웃 수정
- **생성**
  - `artifacts/menu-badges/ai-team-status-draft.json` — `2026-11-17` 기준 7인 팀 현황 초안 (`data/ai-team-status.json` 원본 미수정)
  - `scripts/hani-menu-badges.test.mjs` — 가짜 `state`/프록시 storage 감시 기반 배지 계산 및 정적 가드 테스트
  - `artifacts/menu-badges/REPORT.md` — 본 보고서

---

## 5. 깨질 수 있는 기존 테스트 (수정하지 않고 보고만 함)

- `scripts/hani-procrastination-board.test.mjs`: `scripts/hani-life-bundle-source.mjs`의 `readLifeSource('hani-main.js', 'procrastination')`가 `scripts/fixtures/life-bundle-layers.json` 및 `scripts/hani-release-283-source.cjs`(`hani-release-version-layers.cjs`)의 고정 SHA-256 해시를 검증합니다. `hani-main.js` 변경으로 인해 릴리스 열차 통합 시 기준 해시가 갱신되기 전까지 해시 불일치로 실패할 수 있습니다.
- `scripts/hani-life-bundle-source.mjs` / `scripts/hani-release-version-layers.cjs`를 import하여 `hani-main.js`, `hani-design-system.css`, `hani-style-08.css`, `hani-ilbo.js`의 고정 바이트 해시를 검사하는 기타 회귀 테스트도 동일하게 릴리스 통합 전 해시 불일치가 발생할 수 있습니다.

---

## 6. 서윤(배포 팀장) 실행용 검증 명령

본 환경에서는 셸 명령 실행이 비활성화되어 있어 테스트를 직접 실행하지 못했습니다. 통합 전 아래 명령으로 신규 테스트 및 관련 회귀 테스트를 확인해 주세요.

```bash
node --test scripts/hani-menu-badges.test.mjs
node scripts/hani-nav-groups.test.mjs
node scripts/hani-banners-203.test.mjs
node scripts/hani-design-system-qa.mjs
node scripts/hani-release-package.mjs preflight --candidate HEAD
```


---

## 2차: AI 업무현황 "담당자 상세" 다듬기 및 단위 테스트 실패 수정 (2026-11-17)

### 1. #aiWork "담당자 상세" 좌측 잘림 원인 및 프로필 사진·레이아웃 수정

- **좌측 보라색 세로 바(`h3:before`) 및 카드 좌측 경계 잘림/쏠림 원인**:
  - `hani-style-01.css:2360`의 `.ai-team-profile-card{padding:0!important;overflow:hidden}`가 `#app .view .card{padding:22px}`를 덮어쓰면서, 카드 상단 `<div class="sh"><h3>담당자 상세</h3>...</div>`에 상·좌·우 여백이 0이 되었고 카드 모서리 `border-radius` + `overflow:hidden`에 의해 `h3:before` 보라색 바가 카드 좌측 상단 경계에 붙어 잘리는 현상이 발생함.
- **조치 (`hani-design-system.css:2282-2306`)**:
  - 1차 `#app #aiWork #developmentTeamList` 규칙(`2271-2280`)은 그대로 유지하고, `#app #aiWork .ai-team-profile-card` 및 `#app #aiWork #developmentTeamProfilePanel` 전용 2차 CSS 블록을 분리·추가함.
  - `#app #aiWork .ai-team-profile-card`에 `margin-inline:0;transform:none;width:100%;min-width:0;max-width:100%;box-sizing:border-box` 적용.
  - `#app #aiWork .ai-team-profile-card>.sh`에 데스크톱 `padding:20px 22px 14px`(760px 이하 `padding:16px 17px 14px`) 및 `margin:0;width:100%;box-sizing:border-box`를 부여하고 `h3`/`h3:before`의 `margin:0;transform:none`을 고정해 좌측 보라색 바가 다른 카드 헤더와 동일한 안쪽 위치에 정렬되도록 수정.
  - 좌측 패널 초상화(`.ai-team-profile-avatar`)는 `hani-ui-cleanup-v02971.js`의 `#aiWork .ai-team-profile-avatar{max-width:360px}`(ID 1개)보다 높은 특이도(`#app #aiWork #developmentTeamProfilePanel`, ID 3개)로 `width:100%;max-width:min(100%,520px);aspect-ratio:4/5;border-radius:24px` 적용, 이미지 `[data-development-portrait]`는 `object-fit:cover;object-position:center 15%`로 얼굴 상단이 잘리지 않게 조정.
  - 980px 이하 1열 전환 및 480px 이하(390px 폰 폭 대응)에서 기존 `240px` 상한을 제거하고 `.ai-team-profile-visual{padding:14px}`, `.ai-team-profile-avatar{width:100%;max-width:100%;aspect-ratio:4/5;border-radius:20px}`, `.ai-team-profile-body{padding:16px}` 및 하위 요소 `min-width:0;max-width:100%;box-sizing:border-box`를 적용해 가로 오버플로우 0으로 맞춤.

### 2. Draft JSON 확인

- `artifacts/menu-badges/ai-team-status-draft.json` 확인 완료: `"updatedAt": "2026-11-17"`, `"productionVersion": "2.9.299"`, 7명(`seoyun`, `dohyun`, `serin`, `hani`, `yuri`, `arin`, `hina`) 반영, `"2.9.215"` 미포함.
- `data/ai-team-status.json`은 수정하지 않음.

### 3. `scripts/hani-menu-badges.test.mjs` 실패 2건 원인 및 수정

- **실패 1 (`scripts/hani-menu-badges.test.mjs:145`, `readNews.newsroom.active`)**:
  - **한 줄 원인**: `hani-main.js:2195`의 `rt.newsReadSet instanceof Set`가 Node `vm.runInNewContext` 샌드박스 경계(cross-realm)에서 외부 `new Set(['n1'])`를 `false`로 판정해 읽은 뉴스가 미읽음(`active: true`)으로 처리됨.
  - **수정 (`hani-main.js:2196`)**: `rt.newsReadSet && typeof rt.newsReadSet.has === "function" ? rt.newsReadSet : null`로 덕타이핑(cross-realm 안전) 판별.
- **실패 2 (`scripts/hani-menu-badges.test.mjs:155`, `expectedStage1Plus === 0`) + 런타임 숫자 `now` 전달 보완**:
  - **한 줄 원인**: `hani-procrastination-board.js:51`의 `dayNumber(value)`가 `typeof value !== 'string'`이면 `null`을 반환하는데, 테스트(`scripts/hani-menu-badges.test.mjs:152-153`)와 `hani-main.js`가 숫자 타임스탬프(`Date.parse(...)`/`Date.now()`)를 `projectProcrastination`에 그대로 넘겨 `level`이 전부 `null`이 됨.
  - **수정**:
    - `hani-main.js:2162` (`navMenuIsNew`)에서 문자열/숫자 `now` 모두 파싱하도록 보완하고, `hani-main.js:2198-2199`에서 `rt.projectProcrastination(data, procNow)` 호출 전 숫자 `now`를 `.toISOString()` 문자열로 변환.
    - `scripts/hani-menu-badges.test.mjs:152-158`에서 `projectProcrastination(fixture, fixtureNowIso)`에는 ISO 문자열(`'2026-11-08T03:00:00Z'`)을 전달하고, `computeMenuBadges`에는 숫자 `fixtureNow`를 그대로 전달해 두 경로를 함께 검증하도록 수정.

### 4. 검증 및 미확인 사항

- **정적 확인 완료**:
  - `hani-main.js:2158-2218`, `scripts/hani-menu-badges.test.mjs:145-166`, `hani-design-system.css:2268-2320` 재확인: 괄호/문법 오류 없음, `localStorage`/`sessionStorage`/`setInterval`/`MutationObserver` 미사용, `scripts/hani-menu-badges.test.mjs:217-218`의 1차 `#developmentTeamList` 정규식 2건 유지 확인, `HANI_DISPLAY_VERSION`/`?v=` 캐시 태그 미변경.
- **미실행(환경 제약)**:
  - 현재 작업 환경에서 셸 명령 실행 도구가 비활성화되어 `node --test scripts/hani-menu-badges.test.mjs` 실제 실행 및 브라우저 실화면(390px/1440px) 확인은 수행하지 못함. 배포·QA 환경에서 테스트 및 화면 확인 필요.

---

## 3차 – 봤으면 꺼지기 (2026-11-17)

### 1. 저장 형식 (`localStorage` 신규 키 1개)

- **키 이름**: `hani_menu_seen_v1` (`MENU_SEEN_KEY`, 허용 대상 메뉴 `MENU_SEEN_VIEWS = Set(["board", "ilbo", "newsroom"])`)
- **값 구조**:
  ```json
  {
    "v": 1,
    "seen": {
      "board": "2026-11-18T09:30:00.000+09:00",
      "ilbo": "2026-11-18T09:31:00.000+09:00",
      "newsroom": "2026-11-18T09:32:00.000+09:00"
    }
  }
  ```
- 메뉴 ID → 마지막으로 `showView(id)`로 해당 화면을 연 시각(KST ISO, `+09:00`)만 저장하며, 글 내용·개수·개인 기록은 저장하지 않습니다.
- `hani_os_life_v23`, Cloud, Supabase, `NAV_NEW_DATES` 고정 NEW, 숫자 배지(`procrastination`, `tasks`, `study`)는 변경하지 않았습니다.

### 2. 바꾼 곳

- **`hani-main.js:1995-1997` (`showView`)**:
  - 라우트(`board/...` 포함) 및 fallback(`home`) 확정 직후 `markMenuSeen(id)`로 `board`/`ilbo`/`newsroom`의 열람 시각을 저장하고 즉시 `renderNavNewBadges()`를 호출해 기존 Persistent Slot(`<span class="nav-new-pill">`)을 갱신해 배지를 끕니다.
- **`hani-main.js:2158-2204` (`hani_menu_seen_v1` 읽기·쓰기 헬퍼)**:
  - `menuSeenFormatKstIso`, `menuSeenValidTimestamp`, `readMenuSeen`, `markMenuSeen` 추가.
  - 읽기·쓰기는 모두 `try/catch`로 감싸 저장 실패 시 오류 없이 기존 화면 동작을 유지합니다.
  - JSON 손상·버전 불일치·날짜/달력 형식 오류 시 해당 값을 무시하고 `removeItem`이나 덮어쓰기를 하지 않으며, 다음 정상 `showView` 저장 시 새 유효 값으로 대체됩니다.
  - 쓰기는 `showView(id)`가 대상 메뉴를 열 때만 실행되며 `renderNavNewBadges`, `renderAll`, `setInterval`에서는 쓰지 않습니다.
- **`hani-main.js:2227-2325` (`menuBadgeTimestampMs`, `menuBadgeSeenMs`, `computeMenuBadges`, `renderNavNewBadges`)**:
  - `computeMenuBadges`는 순수 계산 함수로 유지하고 `runtime.menuSeen`을 전달받아 판단합니다(`localStorage` 미접근).
  - `seen[id]`가 없으면 기존 "오늘(KST) 생긴 것" 기준을 유지하고, `seen[id]`가 있으면 "마지막으로 본 시각 이후 새로 생긴 것"이 있을 때만 `NEW`를 켭니다(단, `ilbo` 날짜 문자열 `YYYY-MM-DD`는 오늘 날짜 이하 발행분만 대상).
  - `renderNavNewBadges()`가 `readMenuSeen()` 결과를 `runtime.menuSeen`으로 전달해 DOM을 갱신합니다.
- **`scripts/hani-menu-seen.test.mjs` (신규 테스트)**:
  - 키 이름 단일성(`hani_menu_seen_v1`), `hani_os_life_v23` 쓰기 0회, 보기 전 ON → `showView` 직후 OFF(Persistent Slot 재사용) → 새 항목 추가 후 재점등, 깨진 값 무시 및 `removeItem` 0회, 숫자 배지 및 `NAV_NEW_DATES` 불변 검증을 추가했습니다(기존 테스트·해시·픽스처 미수정).

### 3. 검증 및 미확인 사항

- **정적 확인**: `hani-main.js:1978-2006`, `2158-2350` 및 `scripts/hani-menu-seen.test.mjs` 코드 대조 완료. 기존 `scripts/hani-menu-badges.test.mjs`의 순수성 정규식 경계(`menuBadgeKstDay` ~ `savedCollapsedGroups` 내 `localStorage` 미포함) 유지 확인.
- **미실행(환경 제약)**: 본 환경에서는 셸 명령 실행이 비활성화되어 있어 `node --test scripts/hani-menu-seen.test.mjs` 및 `node --test scripts/hani-menu-badges.test.mjs` 실제 실행은 수행하지 못했습니다. 통합 전 실행 확인이 필요합니다.
