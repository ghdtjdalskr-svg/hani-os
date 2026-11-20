# 히어로 배너 다크 마감 미리보기안 보고 (`BANNER-PREVIEW`)

- **대상 파일**: `hani-design-system.css` 맨 끝 `hero banner dark preview` 절 (2271–2372행)
- **적용 범위**: `html[data-finish="midnight-black"]`, `html[data-finish="titanium-graphite"]` 2종에서만 적용 (밝은 마감 4종 `porcelain-cream` · `pure-white` · `sakura-pink` · `alpine-blue` 무변경)
- **전환 방법 (미리보기 전용)**:
  - `<html data-banner-variant="a">` 또는 속성 없음 → **A안 (부드럽게)**
  - `<html data-banner-variant="b">` → **B안 (그림 살리기)**
  - JS · 데이터 · 저장(`localStorage` 등) · 이미지 파일 변경 없음

---

## 1. A안 vs B안 비교

| 항목 | A안 (부드럽게 · 기본) | B안 (그림 살리기) |
|---|---|---|
| **배너 바탕** | 마감의 `--surface-panel` / `--surface-canvas` 어두운 패널 바탕 위에 메뉴 분류색(`--mcb-tone`)을 **8~11% 수준의 옅은 빛**(`9%` 선형 바탕 + `11%` 좌상단 방사형 글로우)으로만 남김 | 배너 전체(`--mcb-scene-width: 100%`, `object-fit: cover`, `--mcb-scene-mask: none`)를 **그림 중심**으로 채우고 `--surface-panel`은 로딩/폴백 바탕 역할만 수행 |
| **그림·그라데이션 / 스크림** | 기존처럼 그림을 오른쪽에 자연스럽게 두고(`--mcb-scene-width: auto`, `--mcb-scene-mask` 유지), 왼쪽 글 바탕에서 그림 쪽으로 어둡게 이어지는 그라데이션(`--mcb-overlay`) 적용 | 그림 전체 위에 **글 영역(좌측 0~54%)에만 어두운 반투명 스크림**(`--surface-canvas` 88%→84%→54%→16%→투명)을 깔아 오른쪽 일러스트를 가리지 않음. PC(`min-width:701px`)에서 `:after` 폭을 `100% 100%`로 통일 |
| **글자·분류색** | 제목·본문 `--text-primary` / `--text-secondary` 밝은 글자, 분류별 `--mcb-accent` 명도 보정 (eyebrow·화자 이름 4.5:1 이상 확보) | 제목·본문 밝은 글자 + `text-shadow` 보강, `--mcb-muted`를 `color-mix(in srgb, var(--text-primary) 86%, var(--text-secondary))`로 한 단계 밝혀 밝은 배경 위 스크림에서도 가독성 확보 |
| **테두리·그림자** | 분류색을 22% 섞은 어두운 테두리(`--border-subtle` 기반) + `--surface-canvas` 기반 그림자 | 마감 토큰 직접 사용(`--mcb-border: var(--border-strong)`, `--surface-canvas` 그림자 + `--structure-accent` 상단 미세 하이라이트) |
| **`○○ 한마디` 말풍선 & 사진 상자** | 어두운 `--surface-raised` 바탕에 분류색 8% 틴트 + 꼬리(`:after`) 동일 불투명 색(이음새 없음), 사진 상자 흰 테두리(`#fff`)를 다크 테두리로 교체 | `--surface-raised` 88% + `--surface-canvas` 12% 불투명 다크 바탕 + `--border-strong` 테두리, 사진 상자 테두리·그림자 어두운 톤 통일 |
| **모바일(`<=700px`)** | 기존 `contain` 프레임 유지(잘림 방지) + 어두운 바탕/오버레이로 여백 흰 띠 제거 | `--mcb-scene-fit-mobile: cover!important`로 모바일에서도 그림이 배너를 채우고 상하/좌우 스크림 위에서 글자 대비 유지 |

---

## 2. 추가·재정의한 CSS 선택자 (`hani-design-system.css:2271-2372`)

기존 규칙 중 `#app #home>.ds-main-character-banner`(932행), `#app #milestones>.ds-main-character-banner`(1872–1873행, `titanium-graphite` 누락), `body[data-finish-active] #app :is(..., .ds-main-character-banner, ...)`(462–473행 라이트 잉크 고정), `.ai-avatar` · `.ai-quote` · `.ai-quote:after` · `.ai-quote b`(364–368행 `!important` 흰 말풍선/테두리)를 **다크 마감 2종에서만** 안전하게 덮어쓰기 위해 아래 선택자를 추가했습니다.

1. **공통 다크 토큰·상태 뱃지·모드 리셋**
   - `:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"]) #app :is(.ds-main-character-banner,#home>.ds-main-character-banner,#milestones>.ds-main-character-banner)`
   - `:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"]) #app .view>.ds-main-character-banner .sub`
   - `--text`, `--ink`, `--ds-ink`, `--ds-muted`, `--mcb-ink`, `--mcb-muted`, `--mcb-up` (`#ff8a9b`), `--mcb-down` (`#8ac2ff`), `--mcb-status-bg`, `--mcb-status-line`, `color-scheme: dark` 재정의
2. **분류별 톤 9종 + 마일스톤 골드 포인트**
   - `:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"]) #app :is(.ds-main-character-banner,#home>.ds-main-character-banner).ds-tone-{office,finance,health,growth,life,work,company,system,sports}`
   - `:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"]) #app #milestones>.ds-main-character-banner.ds-tone-company` (`titanium-graphite`에서도 골드 톤 유지)
3. **A안 전용 (`:not([data-banner-variant="b"])`)**
   - `:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"]):not([data-banner-variant="b"]) #app :is(.ds-main-character-banner,#home>.ds-main-character-banner,#milestones>.ds-main-character-banner)`
4. **B안 전용 (`[data-banner-variant="b"]`)**
   - `:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"])[data-banner-variant="b"] #app :is(.ds-main-character-banner,#home>.ds-main-character-banner,#milestones>.ds-main-character-banner)`
   - `:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"])[data-banner-variant="b"] #app .ds-main-character-banner :is(.ds-main-character-banner__title,.ds-main-character-banner__description)` (`text-shadow`)
   - `@media(min-width:701px)` `...:after` (`background-size: 100% 100%`)
   - `@media(max-width:700px)` `... #app .view>:is(.ds-main-character-banner,#home>.ds-main-character-banner)` (`--mcb-scene-fit: cover`, `--mcb-scene-fit-mobile: cover!important`, `--mcb-scene-mask: none`)
5. **말풍선 · 담당자 사진 상자 (A/B 공통)**
   - `:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"]) #app .ds-main-character-banner .ai-avatar`
   - `:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"]) #app .ds-main-character-banner .ai-quote`
   - `:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"]) #app .ds-main-character-banner .ai-quote:after`
   - `:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"]) #app .ds-main-character-banner .ai-quote b`

---

## 3. 걱정되는 화면 · 미리보기 검수 포인트

실제 브라우저 스크린샷 없이 CSS·설정(`hani-ui-v02992.js:423-1182`) 분석 기준으로 확인이 필요한 화면들입니다.

1. **그림 자체가 어두운 메뉴 (`diary` — `일기`)**
   - `diary-night-desk-v1.webp`("밤의 책상") 자체가 어두운 야간 일러스트여서, **A안**에서는 어두운 바탕과 밤 배경이 이어져 안정적이지만 분위기가 다소 가라앉아 보일 수 있고, **B안**에서는 좌측 스크림이 어두운 방 이미지와 겹쳐 그림 경계가 덜 구분될 수 있습니다. 글자 대비 자체는 밝은 글자(`--text-primary`)를 써서 묻히지 않습니다.
2. **밝은 실내/주광 일러스트 메뉴 (`travel` · `diet` · `reading` · `wishlist` · `certificate`)**
   - "밝은 주방 장면"(`diet`), "밝은 계획실 장면"(`travel`)처럼 배경 채도·명도가 높은 그림은 **B안**에서 좌측 스크림 페이드 구간(`38%~66%`)으로 글자가 넘어갈 때 가독성 저하 위험이 가장 큽니다. 특히 `1101px~1250px` 폭 데스크톱에서 `.ds-main-character-banner__description`(`white-space: nowrap`)가 긴 메뉴는 문장 끝이 `45%` 부근으로 닿을 수 있어, 스크림 농도(좌측 88%→84%)와 `text-shadow`로 보완해 두었으니 실제 화면에서 끝 글자 시인성을 확인해 주세요.
   - **A안**에서도 아주 밝은 좌측 일러스트(`travel`, `diet`)는 그라데이션 전환 구간(`40%~72%`) 경계가 자연스럽게 이어지는지 확인이 필요합니다.
3. **단체 장면 / 9인 구도 메뉴 (`home` · `organization` · `milestones` · `aiTeam` · `game`)**
   - **B안**에서는 그림을 100% 폭(`object-fit: cover`)으로 펼치면서 `--mcb-scene-mask`를 끄므로, 구도상 왼쪽~중앙에 서 있는 인물이 좌측 스크림 및 `.ai-quote` 말풍선 뒤로 가려지거나, 아주 넓은 PC 창에서 3:1 이미지 상하단이 약간 크롭될 수 있습니다.
   - 반대로 **A안**은 기존처럼 오른쪽 정렬(`--mcb-scene-width: auto`)을 유지하므로 인물 잘림은 적으나, `home`처럼 `16:9` 사진(`hani-team-office-active-v2.jpg`)을 쓰는 화면은 좌측 페이드 정도를 확인해 주세요.
4. **모바일(`<=700px`) B안 `cover` 전환**
   - B안 모바일에서 `--mcb-scene-fit-mobile: cover!important`를 적용해 레터박스 없이 그림을 채우도록 했습니다. 대부분 메뉴의 `scenePositionMobile`이 `76%~83% center`로 오른쪽 인물을 향하고 있으나, 세로가 짧아진 배너(`min-height: 168px`)에서 인물 머리 위 여백이 좁은 메뉴(`university`, `reading`, `organization`)는 머리 끝이 잘리지 않는지 확인이 필요합니다.
5. **기타(작업 범위 외 확인 사항)**
   - 본문 안의 흰 말풍선(`.home-dialogue-shell`, `.ds-agent-comment`, `.ds-jieun`, `#ledgerJieunComment`)과 좌측 사이드바 하단 로고/우측 `HANI REMOTE` 등은 지시에 따라 손대지 않았습니다.

---

## 4. 검증 현황

- **확인한 항목**: `hani-design-system.css` 기존 선택자 특이성(specificity) · `!important` 충돌 여부 · 다크 마감 2종 토큰(`#15171c`/`#1b1e24`, `#2d2f33`/`#36383d`) 대비 계산 · `hani-ui-v02992.js` 내 36개 배너 설정(`work` 런타임 제거 포함 35개 실메뉴) 대조.
- **미검증 항목 (환경 제약)**: 셸/브라우저 실행 불가 조건으로 인해 실제 Chrome/Playwright 렌더링 스크린샷 및 런타임 DOM 검사는 수행하지 않았습니다. 서윤의 미리보기 캡처에서 A/B 및 다크 2종 · 라이트 4종 무변경 여부를 최종 확인해야 합니다.
