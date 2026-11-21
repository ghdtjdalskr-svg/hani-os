# 화면 다듬기 1차 (회장님 11/15 · 11/17 · 11/20 결정분) 작업 리포트

## 회장님 3줄 요약
1. 대시보드는 2안(배너 168px 한 줄 코멘트 → 하니 브리핑 → 오늘 할 일/이번 달 챙길 것 → 지표 → 추이 → 소식 → 나머지, 폰에서는 오늘 할 일이 하니 브리핑 위로 이동, 역할색 배경·제목·세로 바·모서리 포인트, **글자 크기 변경 없음**)으로 `hani-design-system.css`에 정리했습니다.
2. 숫자·입력 중심 화면 대표 배너는 `120px`(설명글 숨김)로 줄이고, 주 버튼(`.btn.primary`, `.btn.finance`, `.btn.health`)은 마감 6종 × 계절 4종(24조합) 모두 AA 대비 4.5:1 이상이 나오는 `--structure-accent` / `--structure-on-accent` 토큰으로 통일했습니다.
3. 어두운 마감 제보(투자 현황 흰 박스·흰 띠·중복 KPI 줄·반원 장식, 회사 소개 단체사진 치우침·텍스트 겹침, 리모컨 정리, 폰 어두운 테마 대시보드 하단 카드 흰 배경)를 읽기 전용 CSS로 수정했고, 보호 대상(`#investmentIntake`, `#deployment`, `#loginGate`, Cloud/storage)은 전혀 건드리지 않았습니다.

---

## 1. 이미 반영되어 중복 적용하지 않은 항목
현재 기준선(`2.9.296`, `2.9.299`, `2.9.302`)을 확인한 결과 아래 항목은 이미 코드에 반영되어 있어 중복 구현하지 않았습니다.

| 구분 | 이미 반영된 내용 | 확인 파일 |
|---|---|---|
| `2.9.296` | 모바일 배너 기본 168px(`object-fit:contain`), 도우미 안전 여백, `#tasks` 모바일 입력 상단, 어두운 마감 `#aiWork`/`#board`/`#reading`/`#movie`/`#diary` 대비 | `hani-design-system.css` |
| `2.9.302` | 어두운 마감(`midnight-black`, `titanium-graphite`) 배너 A안, `#assetStats` 어두운 바탕, `#home` 일부 항목(`.home-dialogue-shell`, `.home-cal-day`, `.home-task-mini-item`) 어두운 바탕 | `hani-design-system.css` |
| 사이드바 리모컨 | `"화면 바로가기"` 한글 라벨, 오늘의 퀴즈 3개 제한 및 `<details>` 접힘(`quizzes.slice(0,3)`), 하단 `.hani-remote-utility`("화면 설정 · 이동") | `hani-context-remote-v1.js` |

---

## 2. 변경 파일 및 주요 선택자 목록

| 파일 | 역할 | 주요 선택자 / 내용 |
|---|---|---|
| [hani-design-system.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/uipolish1/hani-design-system.css) | canonical 디자인·마감 CSS (읽기 전용 UI 패치) | `#app #home.active` 2안 순서/역할색/세로 바(`.sh h3::before`), `#app #home>.ds-main-character-banner` 168px 유지, 숫자·Command 화면 `:is(#investment,#investmentCommittee,#asset,...)>.ds-main-character-banner` 120px 및 `__description` 숨김, `:not(#investmentIntake):not(#deployment) :is(.btn.primary,.btn.finance,.btn.health)` 토큰 통일, `#investment #brokerDashboardStats{display:none!important}` 및 어두운 마감 정리, `#organization>.ds-main-character-banner`·`#haniOrganizationHub .ogh-hero` 겹침 방지, `#haniContextRemote` CSS 보강, 모바일 어두운 `#home` 하단 카드 마감색 통일 |
| [hani-ui-polish-1.test.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/uipolish1/scripts/hani-ui-polish-1.test.mjs) | 신규 정적 검증 테스트 (`node:test`) | 대시보드 168px/2안 순서/font-size 미포함, 120px 대상·제외 화면 검증, 마감 6종 버튼 AA 대비 수학 검증, `#investment`/`#organization`/`#haniContextRemote`/모바일 `#home`·무저장성 검증 |
| [REPORT.md](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/uipolish1/artifacts/ui-polish-1/REPORT.md) | 작업 보고서 | 본 문서 |

> **참고**: `hani-context-remote.test.mjs`의 strict contract를 보호하기 위해 `hani-context-remote-v1.js`와 `hani-context-remote.css`는 수정하지 않았고, `index.html`/버전/`localStorage`/`#investmentIntake`/`#deployment`/`#loginGate` 역시 수정하지 않았습니다.

---

## 3. 버튼 대비 계산표 (마감 6종 × 계절 4종 = 24조합)

주 버튼(`.btn.primary`, `.btn.finance`, `.btn.health`)은 계절 토큰(`--season-accent`) 대신 각 마감의 `--structure-accent`(배경)와 `--structure-on-accent`(글자)만 사용하므로 **4계절(`spring`, `summer`, `autumn`, `winter`) 모두 동일한 AA 이상 대비**를 유지합니다.

| 마감 (Finish) | 버튼 배경(`--structure-accent`) | 버튼 글자(`--structure-on-accent`) | 봄 (spring) | 여름 (summer) | 가을 (autumn) | 겨울 (winter) | AA(>= 4.5:1) 판정 |
|---|---|---|---|---|---|---|---|
| `porcelain-cream` | `#79674c` | `#ffffff` | **5.44:1** | **5.44:1** | **5.44:1** | **5.44:1** | PASS |
| `pure-white` | `#7562d9` | `#ffffff` | **4.66:1** | **4.66:1** | **4.66:1** | **4.66:1** | PASS |
| `midnight-black` | `#c0b6a5` | `#111318` | **9.27:1** | **9.27:1** | **9.27:1** | **9.27:1** | PASS |
| `titanium-graphite` | `#b7b2a6` | `#292b2f` | **6.71:1** | **6.71:1** | **6.71:1** | **6.71:1** | PASS |
| `sakura-pink` | `#98647c` | `#ffffff` | **4.72:1** | **4.72:1** | **4.72:1** | **4.72:1** | PASS |
| `alpine-blue` | `#537994` | `#ffffff` | **4.64:1** | **4.64:1** | **4.64:1** | **4.64:1** | PASS |

---

## 4. 사이드바 리모컨 버튼 → 화면 경로 대조표

| 리모컨 영역 | 요소 / 선택자 | 연결 기능 · 화면 경로 | 비고 |
|---|---|---|---|
| 상단 4개 둥근 버튼 | `[data-remote-action="primary"]` | 현재 화면 주 작업 / 핵심 액션(`tasks` 등) | 유지 |
| 상단 4개 둥근 버튼 | `[data-remote-action="yuna"]` | 유나 인포데스크 (`#intake`) | 유지 |
| 상단 4개 둥근 버튼 | `[data-remote-action="agent"]` | 직원 사무실 (`#agentReview`) | 유지 |
| 상단 4개 둥근 버튼 | `[data-remote-action="recent"]` | 최근 방문 화면 되돌아가기 | 유지 |
| 본문 요약 / 알림 | `.hani-remote-alert-banner`, `.hani-remote-today` | 오늘 할 일(`tasks`), 오늘의 퀴즈 상위 3개 + 접힘(`<details>`) | 3개 초과 항목 접힘/숨김 |
| 하단 유틸리티 | `.hani-remote-utility` (`theme`, `top`) | 화면 테마·마감 설정 / 맨 위로 | `order:99`로 맨 아래 고정 |
| 숨긴 항목 | `.hani-remote-media-actions` 외부에 중복 노출된 `primary`/`yuna`/`agent`/`recent` 버튼 | 상단 4개 둥근 버튼과 동일 경로 | 기능 누락 없음 |

---

## 5. 서윤 실행 · 캡처 체크리스트

1. **자동 테스트 실행**:
   - `node --test scripts/hani-ui-polish-1.test.mjs`
   - `node --test scripts/hani-context-remote.test.mjs`
2. **PC 1440px 캡처 (밝은 마감 + 어두운 마감 `midnight-black`)**:
   - `#home` (배너 168px → 하니 브리핑 → 오늘 할 일/이번 달 챙길 것 → 지표 → 추이 → 소식 순서, 역할색 배경·제목, `.sh h3` 왼쪽 세로 바, 모서리 원 포인트)
   - `#investment` (상·하단 중복 KPI 한 줄만 표시, 흰 박스/흰 띠/첫 칸 밝음/흰 알약 탭/반원 장식 제거 확인)
   - `#organization` (단체사진 가운데·비율 정렬 및 텍스트 겹침 없음 확인)
   - `#haniContextRemote` (둥근 버튼 4개, 한글 제목 `"화면 바로가기"`, 상위 3개 제한, 하단 설정)
   - 120px 대상 화면(`#diet`, `#asset`, `#tasks`) 배너 120px & 설명글 숨김 vs 세계관 화면(`#reading`, `#board`)·대시보드(`#home`) 기존 배너 크기 유지
   - 보호 화면(`#investmentIntake`) 미변경 대조
3. **폰 390px 캡처 (밝은 마감 + 어두운 마감 `midnight-black`)**:
   - `#home`에서 `오늘 할 일`이 `하니 브리핑` 위로 올라가는지 확인
   - `#home` 어두운 테마 하단 인덱스·목록 카드에 흰 배경이 남아 있지 않은지 확인
   - `#organization` 폰 390px에서 단체사진과 텍스트 박스가 세로로 분리되어 겹치지 않는지 확인

---

## 마무리 3줄 요약
1. 요청 1~6번을 `hani-design-system.css` 끝에 `UI Polish 1` 블록으로 읽기 전용·무폰트변경(`font-size` 0건) 원칙대로 반영했습니다.
2. 신규 정적 테스트(`scripts/hani-ui-polish-1.test.mjs`)와 보고서(`artifacts/ui-polish-1/REPORT.md`)를 작성했으며, 기존 테스트/버전/스토리지/보호 화면은 건드리지 않았습니다.
3. 셸 실행 도구가 비활성화된 환경이므로 서윤이 `node --test` 실행 및 PC(1440)·폰(390) 밝은/어두운 마감 실캡처를 진행하면 바로 검증 완료됩니다.
