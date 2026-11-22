# 홈 출석 스탬프판(`#attendanceBoard`) 배치 점검 및 수정 보고서

## 회장님용 3줄 요약
1. 홈 출석 스탬프판(`#attendanceBoard`)에 PC(`order: -24`) 및 모바일 `max-width: 700px`(`order: -25`) 전용 배치 규칙을 추가해 **오늘 할 일·이번 달 요약 바로 아래, 지표(라이프 마켓) 위**에 오도록 맞췄습니다.
2. 어두운 마감(`midnight-black`, `titanium-graphite`)에서도 카드와 스탬프 셀이 흰 배경과 충돌하지 않도록 Design System Finish 토큰(`--surface-panel`, `--surface-raised`, `--text-primary`, `--text-secondary`, `--border-subtle`)에 연결했습니다.
3. 저장 경로(`hani_attendance_v1` 단독 사용, `hani_os_life_v23` 미접촉)와 호감도 읽기 전용 안내 경로를 읽기 검사로 재확인했고, 레이아웃 검증 테스트 파일(`scripts/hani-attendance-layout.test.mjs`)을 새로 작성했습니다. (셸 미사용 제약으로 실행은 서윤/CI 단계로 인계합니다.)

---

## 1. `#attendanceBoard` 삽입 위치 및 `order` 배치 수정

### DOM 삽입 및 렌더 호출 경로
- `hani-attendance-board.js` `buildSlot(homeActions)`(418~556행)에서 `<section id="attendanceBoard" class="att-board">`를 생성해 `homeActions.parentNode.insertBefore(section, homeActions)`(554행, `ensureSlot()` 558~572행에서도 동일 위치 유지)로 삽입합니다.
- `index.html`에서 `#homeActions`(336행)는 `<section id="home" class="view active ui26-home">`(321행)의 직계 자식입니다. 따라서 `#attendanceBoard`는 `#app #home` flex column 컨테이너의 직계 자식으로 마운트됩니다.
- `hani-main.js` `renderHome()`(5450~5452행)에서 `window.HaniAttendanceBoard?.render()`를 호출합니다.
- `index.html`에서 `hani-attendance-board.css`(98행)는 `hani-design-system.css`(86행)보다 뒤에서 로드됩니다.

### `2.9.304`/`2.9.305` `#home` flex-column `order` 대조 및 수정
`hani-design-system.css`의 `UI Polish 1 (11/15, 11/17, 11/20)` 블록은 건드리지 않고, `hani-attendance-board.css`에만 아래 `order` 규칙을 추가했습니다.

- **PC (`> 700px`)**: `hani-design-system.css`(2784~2806행) 기준
  - `.home-lower-grid` (오늘 할 일 / 이번 달 할 일 / 이번 달 업데이트): `order: -25`
  - **`.att-board` (`#app #home > #attendanceBoard`)**: `order: -24`, `margin: 0` 추가 (`hani-attendance-board.css` 35~38행)
  - `.home-source-controls`: `order: -23` / `#dataHubPeriodHelp, #dataHubLatestRecord`: `order: -22`
  - `.life-market-head` (지표 · 라이프 마켓): `order: -20`
  - `.home-today-title`는 `phone-only` 클래스(`index.html` 322행)로 PC에서는 비노출되며, 기존 `order: 0` 상태에서 맨 아래(`.seasonal-life-banner` 부근)로 내려가던 현상을 해소했습니다.
- **모바일 (`@media (max-width: 700px)`)**: `hani-design-system.css`(2842~2863행) 기준
  - `.home-lower-grid`: `display: contents !important`
  - `.home-planner-card` (오늘 할 일 · 이번 달 할 일): `order: -28`
  - `.home-dialogue-shell`: `order: -27`
  - `.home-monthly-check-card` (이번 달 업데이트): `order: -26`
  - **`#app #home > #attendanceBoard`**: `order: -25` 추가 (`hani-attendance-board.css` 382~386행)
  - `.home-today-title`: `order: -24` / `.home-source-controls`: `order: -23` / `.life-market-head`: `order: -20`

---

## 2. 어두운 마감(`midnight-black`, `titanium-graphite`) 토큰 정렬 확인

- `hani-design-system.css`(542~543행)의 `midnight-black`, `titanium-graphite` Finish 토큰(`--surface-panel`, `--surface-raised`, `--text-primary`, `--text-secondary`, `--border-subtle`)을 기준으로 `hani-attendance-board.css`를 점검했습니다.
- 기존 `hani-attendance-board.css`(50~68행)는 다크 모드/Finish 묶음에 고정 hex 색상을 사용하고 있었으며, 카드(`.bubble` 202~212행), 스탬프 셀(`.att-cell` 234~247행, `.att-cell.stamped` 264~268행, `.att-cell.rest` 274~278행), 비활성 버튼(`.att-btn:disabled` 333~339행), 안내 박스(`.att-notice` 341~356행) 모두 `--att-*` 변수를 참조해 흰 배경(`#ffffff`)이 남는 요소는 없었습니다.
- 여기에 두 어두운 마감과 표면·텍스트·경계 대비를 정확히 맞추기 위해 `hani-attendance-board.css` 71~79행에 `:root:is([data-finish="midnight-black"], [data-finish="titanium-graphite"]) #attendanceBoard` 규칙을 추가해 `--att-bg`/`--att-surface-soft`는 `var(--surface-panel)`, `--att-surface`/`--att-bubble`은 `var(--surface-raised)`, `--att-ink`는 `var(--text-primary)`, `--att-muted`는 `var(--text-secondary)`, `--att-line`은 `var(--border-subtle)`에 연결했습니다.

---

## 3. 저장 및 호감도 경로 재확인 (읽기 전용, 코드 무수정)

| 점검 항목 | 파일 및 줄 번호 근거 | 확인 결과 |
| --- | --- | --- |
| 출석 전용 `localStorage` 키 | `hani-attendance-core.js` 8행 (`const KEY = "hani_attendance_v1"`), 128~135행 (`load`, `save`) | `hani_attendance_v1` 외 신규 `localStorage` 키 없음 |
| 본 데이터 키 보호 | `hani-attendance-core.js` 전체, `hani-attendance-board.js` 전체 | `hani_os_life_v23` 참조 0건, `removeItem`/`clear`/Supabase 호출 0건 |
| 보드 저장 위임 | `hani-attendance-board.js` 364~370행(`getStorage`), 394~416행, 574~618행 | 직접 `localStorage.setItem` 없이 `core.load`/`core.save`만 사용 |
| 호감도 읽기 전용 경계 | `hani-office-live.js` 90~166행(`createOfficeAffinity`, `hani_office_affinity_v1`), 3922행(`Object.freeze({get:affinity.get})`)<br>`hani-attendance-board.js` 630행 | `HaniOfficeAffinity`는 `get`만 공개된 읽기 전용이며, 7일 보너스도 `630행`에서 읽기 전용 안내 문구만 표시하고 `hani_office_affinity_v1`에 쓰지 않음 |

---

## 4. 변경 파일 및 테스트 인계 현황

- **수정 파일**: [hani-attendance-board.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/hani-attendance-board.css)
- **신규 테스트 파일**: [scripts/hani-attendance-layout.test.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/scripts/hani-attendance-layout.test.mjs)
  - `#attendanceBoard` DOM 마운트 및 스타일 로드 순서, Desktop(`-24`)/Mobile(`-25`) CSS `order` 범위, Finish 토큰 5종 매핑, 저장소/호감도 안전 경계를 파일 읽기 기반 `node:test` 단언으로 검증합니다.
- **기존 파일 무수정 유지**: `hani-design-system.css`(`UI Polish 1`), `hani-attendance-core.js`, `hani-attendance-board.js`, `scripts/hani-attendance-board.test.mjs`, `scripts/hani-attendance-core.test.mjs`
- **미실행 사유**: 작업 제약상 셸 명령을 사용하지 않고 파일 읽기/쓰기 도구만 사용했으므로 `node --test scripts/hani-attendance-layout.test.mjs` 및 브라우저 실화면 Preview는 서윤/CI에서 실행이 필요합니다.
