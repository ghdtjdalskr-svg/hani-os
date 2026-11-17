# UI Polish 3차 작업 보고서

- 기준 작업 폴더: `polish3` (`hani/ui-polish-three`, `v2.9.299` 복사본)
- 작업 방식: 파일 읽기/쓰기 도구만 사용 (Shell / Git 명령 미사용)
- 데이터·저장소·Cloud·버전 불변: `hani_os_life_v23`, `save`/`commit`, Cloud 동기화, 표시 버전, 기존 테스트·해시·fixture 미수정, 새 `localStorage` 키 0개

---

## 1. 이슈별 변경 내역

### 이슈 1 · 투자 첫 화면 KPI 중복 정리 (`#investment`)

**방안 선택 및 근거**
- 상단 4개 카드(`.investment-live`: `최근 총자산`, `총매입금액`, `총평가금액`, `평가손익`)는 유지하고, 하단 `#brokerDashboardStats`(`#investMonthly` 내 6개 카드)에서 겹치는 3개(`최근 총자산`, `총평가금액`, `평가손익`)를 CSS로 숨겨 **겹치지 않는 3개(`전월 대비`, `보유 종목`, `기록 월`)만 3열로 표시**했습니다.
- **선정 이유**: 상단 4개는 `총매입금액`까지 포함한 총괄 KPI이고 투자 하위 탭 전반에서 실시간 요약 슬롯으로 쓰이며, `renderBrokerDashboard()`의 계산·DOM 생성·`annualInvestmentStats` 경로를 100% 보존하면서 화면 중복만 제거할 수 있습니다.

**변경 파일 및 선택자**
- `hani-style-01.css`
  - `.live-stat` (line 26): 카드 모서리 반원 장식 `.live-stat:after{...}` 제거
  - `#investment .live-stat small` (line 1750): `#68748b!important` → `var(--text-secondary,var(--muted,#68748b))!important`
  - `#investment .live-stat strong` (line 1757), `#investment .broker-kpi .value` (line 1810): `white-space:nowrap` 추가 (`"기록 없음"` 2줄 줄바꿈 방지)
  - `#investment #brokerDashboardStats` (lines 1815–1823): 데스크톱 `grid-template-columns:repeat(3,minmax(0,1fr))!important`, 중복 카드 `:nth-child(1)`, `:nth-child(3)`, `:nth-child(4)`에 `display:none`, `@media(max-width:700px)` 2열(`기록 월` `grid-column:1/-1`) 및 `font-size:clamp(16px,4.4vw,22px)!important` 적용
- `hani-design-system.css`
  - `#app #investment :is(.investment-live small,.broker-stats .label)` (line 2216): `color:var(--text-secondary,#4d4660)!important;background:transparent!important` (흰 띠 제거, 마감 잉크 토큰 사용)
  - `#app #investment .investment-live small` (line 2217): `display:block;padding:0!important;line-height:1.35!important`
  - 참고: `line 2214`의 흰 판 배경 규칙은 `hani/theme-dark-fix` 충돌 방지를 위해 건드리지 않았습니다.

---

### 이슈 2 · 회사 소개 메인 배너 (`#organization`, `.ogh-hero-*`)

**변경 파일 및 선택자**
- `hani-organization-hub.css`
  - `#haniOrganizationHub .ogh-hero` (line 378): 기존 겹침 레이아웃(`position:absolute` 배경 위에 반투명 흰 박스 `rgba(255,255,255,.94)`)을 **비겹침 2열 그리드**(`grid-template-columns:minmax(0,1fr) minmax(0,1.15fr)`, `gap:clamp(16px,2.5vw,28px)`)로 변경, `background:var(--surface-panel,var(--ogh-paper))`, `border:1px solid var(--ogh-line)`, `max-width:100%;min-width:0` 적용
  - `#haniOrganizationHub .ogh-hero-copy` (lines 379–387): `background:transparent`, `color:var(--ogh-ink)`, `width:100%;min-width:0;max-width:100%`, `word-break:keep-all;overflow-wrap:anywhere`, `.ogh-cta`에 `var(--control-accent)` / `var(--control-on-accent,#fff)` 적용
  - `#haniOrganizationHub .ogh-hero-art` & `>img` (lines 388–389): `position:relative` 그리드 슬롯으로 전환, `object-fit:cover;object-position:center top`으로 빈 여백 없이 꽉 채우되 얼굴 상단 잘림 방지
  - `@media(max-width:850px)` (line 391): `390px` 폰 폭에서 `grid-template-columns:minmax(0,1fr)` 1열 세로 배치 + `min-height:220px` + `object-fit:cover;object-position:center top`으로 가로 넘침 0 구조 적용
  - 강조 파란색 하드코딩 제거 (lines 228–229, 243, 308–310, 382–383): `#4562e6`, `#334fa7`, `#b798ed`, `#215ad5`, `#f3f7ff`, `#8ea3ff`를 모두 `var(--control-accent)`, `var(--control-soft)`, `var(--structure-accent)`로 치환

---

### 이슈 3 · 사이드바 리모컨 정리 (`hani-context-remote-v1.js`, `hani-context-remote.css`)

**변경 요약**
1. **중복 리스트 제거 & 경로 유실 0**: `.hani-remote-nav` 전체(6개 리스트 버튼)를 제거하고 `.hani-remote-media-actions` 둥근 버튼 4개(`primary`, `yuna`, `agent`, `recent`)를 유지했습니다. 제거 리스트에만 있던 `current`는 상단 배너 칩(`<button class="hani-remote-media-chip" data-remote-action="current">`)으로, `alert`는 조건부 배너(`<button class="hani-remote-item is-alert hani-remote-alert-banner" data-remote-action="alert" hidden>`)로 보존했습니다. `update()`에서 삭제된 `.hani-remote-nav` DOM 참조를 제거해 null 오류를 방지하고 `.hani-remote-media` 버튼 `aria-label`/`title` 동적 갱신을 보강했습니다.
2. **이미지 박스 높이 축소**: `.hani-remote-media` 데스크톱 높이를 `410px` → `310px` (세로 `<=820px` 화면 `276px`)로 축소했습니다.
3. **"오늘 할 일" 목록 제한 (`updateToday`)**: 1줄 요약 버튼 + 미완료 퀴즈 상위 3개만 직접 노출하고, 4번째 이상은 기본 접힘 `<details class="hani-remote-today-more">` (`나머지 N개 더 보기`) 안에 배치했습니다 (`localStorage` 저장 없음).
4. **영어 문구 한국어화**: `HANI REMOTE` → `리모컨`, `SECTION SHORTCUTS` → `화면 바로가기`, 모바일 버튼 `HANI Remote` → `리모컨`, `aria-label`(`화면 리모컨`, `리모컨 접기/펼치기/닫기`), `defaults` 내 영어 바로가기·라벨(`Preview`→`미리보기`, `HANI Insight`→`하니 인사이트`, `Registry`→`규정 목록`, `Release Queue`→`배포 대기열`, `Inbox`→`수신함`, `HINA QA`→`히나 QA`, `Wish`→`위시`, `Calendar`→`캘린더`, `Drive`→`드라이브`, `AURA 쇼룸`→`아우라 스튜디오`, `Cloud`→`클라우드`, `Release`→`배포`, `AI TEAM`→`AI 팀`), 담당 직원 기본 표기도 한국어 성명 조회 우선(`HaniOrganizationRoster`)으로 정리했습니다.
5. **하단 유틸 기본 접힘 (저장소 키 0개)**: `.hani-remote-utility`를 기본 닫힘 상태의 네이티브 `<details class="hani-remote-utility">` (`<summary>화면 설정 · 이동</summary>`, 내부에 `테마 스튜디오`, `맨 위로`)로 감쌌으며 `localStorage`를 전혀 사용하지 않습니다.
6. **하드코딩 색 제거**: `hani-context-remote.css`의 `--remote-primary:#ffead5`, `--remote-current:#edf0fa`, `--remote-yuna:#fff4e5`, `--remote-alert:#fff0f3`, `#5b4396`, 다크 모드 별도 하드코딩 색, `--remote-chip` 개별 주황/노랑/자주색, `.hani-remote-collapse` `background:#fff`를 `var(--surface-raised)`, `var(--surface-panel)`, `var(--control-soft)`, `var(--control-accent)`, `var(--control-on-accent)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-subtle)` 마감 토큰으로 통일했습니다.

#### 리모컨 전후 내비게이션 경로 매핑 테이블

| 경로 키 (`data-remote-action` / 구분) | 변경 전 위치 | 변경 후 위치 | 실행 동작 / 이동 대상 | 유실 여부 |
|---|---|---|---|---|
| `current` (현재 섹션) | `.hani-remote-nav` 버튼 1 | `.hani-remote-media-chip` 버튼 (`지금 보는 화면`) | `moveTo('#' + viewId())` | 유지 (0) |
| `primary` (주 작업) | `.hani-remote-media-actions` + `.hani-remote-nav` 중복 | `.hani-remote-media-actions` 1번 원형 버튼 | `c.action.view` / `c.click` / `c.focus` / `c.target` | 유지 (0) |
| `yuna` (빠른 입력) | `.hani-remote-media-actions` + `.hani-remote-nav` 중복 | `.hani-remote-media-actions` 2번 원형 버튼 | `goView('intake')` + `#yunaInput` 포커스 | 유지 (0) |
| `agent` (담당 직원) | `.hani-remote-media-actions` + `.hani-remote-nav` 중복 | `.hani-remote-media-actions` 3번 원형 버튼 | `goView('organization/people/' + owner())` | 유지 (0) |
| `recent` (최근 항목) | `.hani-remote-media-actions` + `.hani-remote-nav` 중복 | `.hani-remote-media-actions` 4번 원형 버튼 | `moveTo(c.recentTarget \|\| '#' + viewId())` | 유지 (0) |
| `alert` (검토/할일/위시 알림) | `.hani-remote-nav` 버튼 6 (조건부 표시) | `.hani-remote-alert-banner` 단독 조건부 버튼 (`count > 0`일 때만 노출) | `moveTo(c.recentTarget \|\| c.alert)` | 유지 (0) |
| `tasks` (오늘 할 일) | `.hani-remote-today` 요약 버튼 | `.hani-remote-today` 1줄 요약 버튼 | `goView('tasks')` | 유지 (0) |
| `quiz` (미완료 퀴즈) | `[data-remote-quizzes]` 전체 나열 | 상위 3개 직접 노출 + 4번째~ `<details class="hani-remote-today-more">` | `HANI_STUDY_V02984_TEST.openPendingQuiz(id)` | 유지 (0) |
| `section` (화면 내 바로가기) | `.hani-remote-section` (`SECTION SHORTCUTS`) | `.hani-remote-section` (`화면 바로가기`) | `moveTo(section[1])` | 유지 (0) |
| `theme` (테마 스튜디오) | `.hani-remote-utility` (펼침) | `<details class="hani-remote-utility">` 내부 (기본 접힘) | `goView('aura')` | 유지 (0) |
| `top` (맨 위로) | `.hani-remote-utility` (펼침) | `<details class="hani-remote-utility">` 내부 (기본 접힘) | `window.scrollTo({top:0,behavior:'smooth'})` | 유지 (0) |

---

## 2. 신규 테스트 및 검증 현황

- **신규 테스트 작성**: [`scripts/hani-ui-polish-three.test.mjs`](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/polish3/scripts/hani-ui-polish-three.test.mjs)
  - 이슈 1: 상단 4 KPI + 하단 비겹침 3 KPI만 표시(1·3·4 숨김), `.live-stat:after` 제거, `white-space:nowrap`, 라벨 흰 띠 제거 검증
  - 이슈 2: `.ogh-hero-art>img` `object-fit:cover` + `center top`, 비겹침 2열/모바일 1열 그리드, 파란색 하드코딩 제거 및 마감 토큰 검증
  - 이슈 3: `.hani-remote-nav` 제거 및 4개 원형 버튼 유지, 모든 경로 클릭 실행(0 유실), 영어 제목 제거, 오늘 할 일 3개+`<details>` 제한, `.hani-remote-utility` 기본 접힘, 마감 토큰 적용, `localStorage`/`sessionStorage` 쓰기 0회 검증
- **실행 상태**: 본 환경에서는 Shell 명령 실행이 제한되어 Node 테스트 및 Edge 브라우저 실화면 캡처는 아직 실행하지 않았습니다(코드 작성 및 정적 교차 점검만 완료). 다음 실행 환경에서 아래 명령으로 확인해야 합니다:
  ```powershell
  node --test scripts/hani-ui-polish-three.test.mjs
  ```

---

## 3. 깨지는 기존 테스트 목록 (수정하지 않고 원문 보존)

본 작업은 기존 테스트·해시·fixture를 수정하지 않았습니다. 아래 기존 테스트들은 **`v2.9.299` 배포 시점의 바이트/SHA-256 해시를 직접 고정(pin)** 하고 있어, 이번 UI/CSS/JS 변경으로 인해 실패하게 됩니다(새 릴리스 계층 또는 열차 통합 전 정상적인 현상).

| 테스트 파일 | 깨지는 이유 (직접 고정 대상) |
|---|---|
| `scripts/hani-release-299.test.mjs` | 전체 173개 런타임 파일이 `v2.9.299` 커밋(`1881888...`) 바이트와 일치해야 하며 `hani-design-system.css`의 `afterSha256`도 대조함 (`hani-style-01.css`, `hani-design-system.css`, `hani-organization-hub.css`, `hani-context-remote-v1.js`, `hani-context-remote.css` 모두 불일치) |
| `scripts/hani-release-298.test.mjs` | `design2.project` 적용 후 전체 173개 런타임 파일이 `v2.9.298` 바이트와 일치해야 함 (`hani-style-01.css`, `hani-organization-hub.css`, `hani-context-remote-v1.js`, `hani-context-remote.css` 및 `hani-design-system.css` 불일치) |
| `scripts/hani-design-polish-2.test.mjs` | `hani-design-system.css`가 `main296 + design2 block`과 바이트·SHA-256 완전 일치해야 함 (`lines 2216-2217` 수정으로 실패) |
| `scripts/hani-design-polish-1.test.mjs` | `design2` 프리로드가 정확 일치 시에만 역투영하므로 `hani-design-system.css` 핀 불일치 연쇄 발생 |
| `scripts/hani-design-polish-1-main295.test.mjs` | `hani-design-system.css` 역투영 입력 SHA-256 불일치 연쇄 발생 |
| `scripts/hani-release-296.test.mjs` | `hani-design-system.css`의 `2.9.296` / `design295` 바이트 일치 단언 연쇄 실패 |
| `scripts/hani-release-294.test.mjs` | `hani-design-system.css`의 `thaw.delta.files[css].afterSha256` 단언 실패 |
| `scripts/hani-theme-thaw-source.test.mjs` | `hani-design-system.css`의 `THAW` `afterSha256` 및 역변환(`restore`) 단언 실패 |

- 참고: 브라우저 전용 대조 스크립트 `scripts/hani-design-polish-2.browser.mjs`는 투자 라벨을 `#fff` 바탕 기준으로 샘플링하는 항목이 있으나 `BROWSER_DELEGATED` 대상이므로 본 단계에서 실행·수정하지 않았습니다.
