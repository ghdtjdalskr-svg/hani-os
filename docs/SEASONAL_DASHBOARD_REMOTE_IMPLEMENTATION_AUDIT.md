# HANI Seasonal Dashboard + Remote Implementation Audit

검토일: 2026-10-02 KST. 범위: Batch A, 읽기 전용 코드/원본 이미지 감사와 제작 명세. 런타임 수정 없음.

## 1. Baseline

- `git fetch origin main` 성공 후 기준선: `ff8c9ea22ba990d0771b390972e7ccb39610d097`.
- `HANI_DISPLAY_VERSION`: `2.9.154` (`hani-main.js:3873`). 내부 VERSION 변경 없음.
- 신규 브랜치: `hani/seasonal-dashboard-remote`.
- 별도 worktree: `C:/Users/홍성민/Documents/HANI_OS_DEV/.worktrees/seasonal-dashboard-remote`.
- `index.html`: `hani-ui-v02992.js?v=2.9.152`, `hani-design-system.css?v=2.9.154`, `hani-context-remote-v1.js?v=2.9.146`, `hani-context-remote.css?v=2.9.147`. 이 뒤 development-history JS도 로드됨.
- 현재 작업 중인 다른 checkout은 변경하지 않음. Production 배포/표시 버전은 이번 감사에서 확인하지 않았음.

## 2. Prerequisite Status

**PARTIAL — Full Implementation BLOCKED.**

- main #139는 Dashboard/Diet canvas/glow를 중립화함 (`hani-design-system.css:442–444`). 파일럿의 좁은 범위는 반영됨.
- 일반 card/toolbar는 여전히 `--season-card`, `--season-line`을 사용함 (`:447`). Remote 표면도 season token에 의존함 (`hani-context-remote.css:8,14–16,58`).
- Hero에 꽃잎/낙엽/눈/ripple 애니메이션 규칙과 DOM이 남아 있음 (`hani-design-system.css:462–475`, `hani-ui-v02992.js:705`). reduced-motion에서 애니메이션만 정지하는 것으로 정적 환경 중심 전환이 완료되지는 않음.
- `applySeasonTheme()`는 `data-theme`을 삭제하고 theme-color meta와 여러 차트를 갱신함 (`hani-main.js:709–717`). 기존 dark CSS가 `data-theme`을 사용하므로 Finish 독립성에 대한 선행 계약이 필요함. 계획 중인 Galaxy 구현의 완료/동작을 가정하지 않음.
- 따라서 Seasonal Visual Theme Refresh와 Season/Finish 분리가 모두 완료됐다고 판정할 수 없음. 이 작업에서 선행 작업까지 임의 확장하지 않음.

## 3. Current Dashboard Hero

- 실제 파일: `assets/team/hani-team-office-active-v2.jpg`, **2172 × 724**, **377,520 bytes**, 3:1. 이미지 헤더와 원본 시각 확인.
- 소유 경로: `mainCharacterSidebarMenuConfig.home` → `mainCharacterBannerConfig()` → `mainCharacterBanner()`; `mountDesignSlots()`에서 호출. `refresh()`는 click/change 후 재실행됨.
- Persistent section: `#home > .ds-main-character-banner`; 이미지: `.ds-main-character-banner__scene img`.
- 설정: desktop `cover`, `right center`, `min(64%,820px)`; mobile `cover`, `64% center`.
- CSS: `hani-design-system.css:341–348` 기본 높이 232px, absolute scene, 왼쪽 mask. `:544–545` ≤760px 높이 236px, 전체 폭, mask 제거. `:732–733` ≤700px image width/fit/position 강제 적용.
- Home 전용 overlay는 `:663–671`. desktop 왼쪽부터 보라색 gradient, mobile은 왼쪽 약 98%, 중간 약 93%, 오른쪽 약 66% 불투명도로 artwork를 덮음. `saturate(.96) contrast(1.02)` 필터도 있음.
- 원본은 왼쪽에 넓은 창/외부 공간, 중앙~오른쪽에 아홉 인물. 오른쪽 크롭과 overlay 때문에 원본 왼쪽의 계절 단서만 바꾸는 편집은 취약함.
- fallback: 공통 `assets/team/hani-team-office.webp`로 한 번 전환. 이 파일도 실패하면 이미지를 숨기는 최종 단계 없음. 재렌더 시 fallback flag가 제거되어 오류 반복 가능성도 테스트 필요.
- `<img width="2172" height="724">`, lazy/fetchpriority 명시 없음. 생성 시 src 할당. 현재 Hero 전용 preload 없음. index에는 별도의 기존 legacy hero/profile preload가 있으므로 이번 범위에서 일괄 정리하지 않음.
- 1440/390의 실제 computed bounds와 브라우저 screenshot은 미실시. 위 geometry는 소스 규칙이며 화면 QA PASS가 아님.

## 4. Current Remote

- `assets/context-remote/`: 계절별 2장 × 4 = 8장, 공통 4장. 모두 실제 파일 존재.
- 계절 자산 이름: `spring-1/2.jpg`, `summer-1/2.jpg`, `autumn-1/2.jpg`, `winter-1/2.jpg`.
- 공통: `life-office-lounge-v1.jpg`, `life-book-cafe-v1.jpg`, `life-brunch-v1.jpg`, `life-media-night-v1.jpg`.
- `banners`는 계절 2장+공통 4장, `variant()`는 6개 중 균등 선택. 계절별 선택 확률 약 1/3.
- 선택은 `bannerPicks` Map의 `season:viewId` 키에 메모리 보관. 같은 메뉴 재방문은 같은 그림, 새 메뉴는 새로운 선택. **시간 기반 rotation은 없음.** 지난 감사의 rotation 표현은 이 메뉴별 변주와 구분해야 함.
- 메뉴별 action/담당자/바로가기는 `defaults`가 관리. 이미지 자체의 명시적인 메뉴 의미 매핑은 없음.
- 시즌은 `document.documentElement.dataset.season`; 유효하지 않으면 spring. `MutationObserver`가 시즌 변경을 받아 즉시 updateBanner.
- 현재 세션의 실제 선택값은 미조회. 저장 선택이 없으면 defaultSeasonTheme()가 월 기준 선택하며 10월은 autumn.
- img onerror, 전용 preload/lazy, 다음 이미지 preload 없음. 생성 시 숨겨진 모바일 Remote에도 src 할당.
- 이미지 `object-fit:contain`, center; desktop scene 높이는 viewport에 따라 290px 또는 clamp(330px,42vh,430px). ≤850px 하단 sheet; ≤420px 일반 scene은 76×112px. mini-state selector 조합에서는 92×118 규칙도 있어 실제 상태별 computed size QA 필요.
- 모바일은 잘림보다 **작게 보이는 것**이 계절 인지 위험. 텍스트 캡션도 숨김.

## 5. Dashboard Seasonal Asset Brief

### 공통 제작 계약

- 4개 독립 최종 이미지, **3:1**, 최소 **2172×724**, 작업 원본 권장 **3264×1088**. 업스케일만으로 세부 품질을 보충하지 않음.
- 제공된 canonical 이미지와 승인된 캐릭터 프로필을 참조. 동일 아홉 인물의 얼굴/헤어/복장/인원/역할/대략적 위치, 카메라, 실내 가구와 회사 공간 유지.
- 새 인물 생성, 인물 누락/복제, 전체 장면 색 필터, 이미지 안 UI 문구 금지.
- 공통 prompt: “Edit the supplied canonical HANI GROUP office scene. Preserve exactly the same nine character identities, clothing, office function, camera angle, furniture geometry and approximate subject positions. Change only outdoor vegetation, daylight, shadows and small environmental props. Keep the original visual quality. Deliver one 3:1 scene, not a collage. No labels, UI, particles or holiday decoration.”
- text-safe: 왼쪽 영역은 기존 copy가 덮는 영역으로 취급하고 핵심 계절 단서를 그곳에만 두지 않음. 글자는 이미지에 굽지 않음.
- crop-safe 초안: 원본의 **x=55–78%, y=8–45%** 창/환경 영역에도 명확한 계절 단서를 확보하고, 왼쪽 큰 창은 보조 단서로 사용. 이는 코드와 원본 기반 제작 가이드이며 확정 브라우저 안전 영역은 아님.
- 인물 가림 때문에 이 구간에 충분한 환경이 보이지 않는다면 인물을 임의 이동하지 말고 composition 검토로 되돌림.
- 기존 mobile overlay가 단서를 덮으므로 artwork만으로 해결된다고 보장하지 않음. 선행 surface/overlay 정책 정리 후 실제 1440/390 렌더에서 crop-safe를 확정.
- 최종 압축 JPG/WebP는 시각 품질 우선으로 선택. 목표는 현재 377,520-byte 기준과 비슷하거나 작은 크기; 디테일을 망가뜨리면서 맞추는 절대 제한은 아님.

### Spring

- Environment: 창밖 동일 수목의 새잎과 성긴 연녹색 수관. 작은 봄 가지/꽃 1개는 보조.
- Lighting: 밝고 부드러운 확산광, 부드러운 그림자.
- Seasonal clue: 여름의 짙은 빽빽한 녹음과 구분되는 새잎 구조가 주요 단서.
- Composition/crop: 공통 구도 유지, 지정 창 영역에서도 새잎 가지가 읽힐 것.
- Prompt extension: “Early spring outside the same office windows, fresh small leaves on visible branches, airy light-green foliage, soft bright diffuse daylight, gentle shadows, a single restrained spring branch detail indoors.”
- Avoid: 전체 핑크 tint, 벚꽃 축제, 꽃잎 비, 과도한 실내 꽃.

### Summer

- Environment: 같은 수목의 무성하고 짙은 녹음, 밝은 외부와 차분한 실내.
- Lighting: 강한 자연광, 선명한 잎/창틀 그림자. 과노출로 식생이 사라지지 않게 함.
- Seasonal clue: 빽빽한 수관+명확한 빛/그림자, 차가운 음료는 보조.
- Composition/crop: 공통 창 영역에서 수관과 빛 단서가 함께 유지.
- Prompt extension: “Midsummer outside the same office windows, dense deep-green foliage, strong clean daylight, crisp window and foliage shadows, a comfortable cool interior and one understated cold drink.”
- Avoid: 해변, 야자수, 휴양지, 파란 화면 filter, 비/물결 애니메이션.

### Autumn

- Environment: 같은 수목의 잎이 줄어든 갈색/앰버 수관, 가지가 일부 드러남.
- Lighting: 낮은 각도의 오후광과 긴 그림자. 따뜻한 빛은 국소적으로 표현.
- Seasonal clue: 성긴 단풍 수관+빛의 각도. 머그는 보조.
- Composition/crop: 지정 창 영역에 잎과 가지가 모두 보이고 인물 얼굴색은 보존.
- Prompt extension: “Autumn outside the same office windows, sparse muted amber and brown foliage with visible branches, lower afternoon daylight and longer soft shadows, one warm drink, neutral faithful character skin tones.”
- Avoid: 전체 주황 filter, 호박, Halloween, 낙엽 파티클.

### Winter

- Environment: 앙상한 가지와 차갑고 맑은 외부 공간, 눈 없이도 겨울로 읽힘.
- Lighting: 차가운 외부광과 따뜻한 실내 조명 대비, 밤 장면으로 변경하지 않음.
- Seasonal clue: 뚜렷한 낙엽수 가지 구조+실내외 빛 대비. 담요/머그는 보조.
- Composition/crop: 같은 창 영역의 bare branches를 유지, 작은 장식에만 의존하지 않음.
- Prompt extension: “Winter outside the same office windows, clearly bare deciduous branches, cool outdoor daylight contrasted with warm interior lamps, an understated mug or folded blanket, no snow required, same daytime office composition.”
- Avoid: Christmas, 트리, 전구 장식, 눈송이 overlay, 전체 blue filter.

### 제작 승인 조건

- 계절명 없는 한 장의 실제 화면을 각각 보고 계절을 구분할 수 있어야 함. 4장 병렬 비교만으로 PASS 금지.
- Remote를 접은 390px Home에서도 배경 단서가 남아 있어야 함.
- 봄/여름처럼 가까운 두 계절을 포함해 확인. 겨울/여름만 구분되는 것으로 전체 PASS 금지.
- 같은 데이터/Finish/viewport, 동일 Hero 높이로 비교. 정보 가독성 유지.
- 관찰자가 구분하지 못하면 텍스트 라벨 추가로 통과시키지 말고 artwork/가시 영역을 재검토.

## 6. Asset Availability

**NOT PROVIDED.** 최신 main의 assets에서 Dashboard 전용 사계절 4개 파일은 확인되지 않음. 존재하는 seasonal 파일은 Remote용 8개. 이번 첨부는 지시문이며 신규 이미지가 아님.

실제 Dashboard 이미지가 준비되기 전에는 가상의 runtime path나 빈 asset map을 추가하지 않음. 이 명세는 제작 준비물이며 이미지 생성/제작 완료가 아님.

## 7. Proposed Dashboard Resolver

- 기존 `hani_os_season_theme_v1` → `applySeasonTheme()` → `html.dataset.season` 흐름 재사용.
- Dashboard는 dataset만 읽고 storage를 별도로 읽거나 쓰지 않음. 신규 season state/key 없음.
- 실제 검증된 파일이 준비된 후 `mainCharacterBannerConfig('home')`에서 home sceneImage만 resolve. 다른 메뉴 config는 그대로 유지.
- 같은 Persistent image slot을 갱신. 기존 renderer 내부의 시즌 observer가 home 이미지 갱신만 수행하도록 통합하며 renderer layer를 추가하지 않음.
- fallback 순서: 실제 seasonal 파일 → 기존 active-v2.jpg → img 숨김+중립 scene surface. 마지막 실패까지 처리해 broken icon/반복 fallback 방지.
- 계절 변경 도중 이전 요청의 load/error가 늦게 도착해 새 이미지에 영향을 주지 않게 요청 identity 확인. season switch 재진입/동일 src 재렌더 QA 포함.

## 8. Proposed Remote Change

- 기존 defaults, `season:view` 캐시, observer 및 image slot 보존.
- 첫 **실제 가시 노출**과 계절 변경 직후 첫 가시 노출은 현재 시즌 2장 중 선택. 모바일 sheet가 닫혀 있는 동안 다른 메뉴를 방문해도 첫 가시 노출 상태를 소비하지 않음.
- 이후 다른 메뉴에서 기존 혼합 pool 허용. 기존 메뉴별 선택 안정성을 유지; common 이미지도 도달 가능하게 검증.
- 기존에 시간 rotation은 없으므로 새 timer를 만들지 않음. 사양의 subsequent rotation은 우선 기존 메뉴별 변주로 구현 계획.
- fallback: 요청 seasonal/common → 검증된 공통 canonical `life-office-lounge-v1.jpg` → img 숨김/중립 슬롯. 실제 표시 이미지에 맞춰 alt/member caption도 갱신. 실패한 경로 재귀 호출 금지.
- fallback 시 비계절 이미지가 보이는 것은 오류 복구 예외로 보고하고 정상 첫 노출 PASS와 구분.

## 9. Expected Changed Files

이번 변경: 이 문서만. 아래는 선행 조건과 자산 준비 후의 예상 범위.

| File | Function / Selector | Reason |
|---|---|---|
| hani-ui-v02992.js | mainCharacterBannerConfig / mainCharacterBanner / home img | home-only season mapping, shared state update, bounded fallback |
| hani-context-remote-v1.js | variant / updateBanner / setMobile / visibility lifecycle | first visible seasonal priority, mixed pool retention, fallback |
| hani-design-system.css | #home > .ds-main-character-banner 및 scene | 필요할 때만 Home overlay/crop 및 최종 neutral fallback; geometry 보존 |
| assets/team/ 하위 실제 신규 파일 4개 | validated artwork | canonical naming convention에 맞춘 실제 파일만 연결 |
| index.html / 기존 display-version owner | load/cache version | 운영 코드 후보 시 당시 latest 기준 next patch; 지금 예약/증가 안 함 |
| 기존 관련 QA 또는 범위 제한 QA script | 1440/390, fallback/network/season change | 실제 동작을 검증하는 targeted test |

Living Office, data, voice, Boardroom, cloud code 변경 없음. main에 없는 다른 작업의 Finish 코드를 가져오거나 merge하지 않음.

## 10. Performance Plan

- Dashboard current season 파일 하나만 요청; inactive 3개 preload 금지.
- 우선 img 요청 시점을 측정. 별도 preload가 꼭 필요할 때만 같은 resolver의 active URL을 사용해 중복/잘못된 preload 방지.
- 다음 Remote 이미지가 미리 정해져 있지 않은 현재 구조에서는 speculative preload 추가 안 함.
- width/height, scene geometry 고정. image error에서도 슬롯 높이 유지.
- baseline/candidate 동일 환경에서 image request 개수, 전송량, image-load/레이아웃 변화 비교. 아직 측정 전이며 performance PASS 아님.

## 11. HANI GALAXY Compatibility

- 데이터 계약은 Season(dataset.season)과 Finish의 표면 설정을 독립 유지. 어떤 Finish든 동일한 4개 artwork 사용.
- 현재 applySeasonTheme의 data-theme 삭제는 선행 호환성 이슈. Galaxy 실제 contract 확정/반영 이후 재검증 필요.
- 미구현 Finish를 CSS로 가짜 구현하거나 5개 Finish 호환 PASS라고 보고하지 않음. 실제 제공된 Finish만 동작 검증, 나머지는 pending.

## 12. Living Office Feasibility

**CONDITIONAL. 코드 변경 없음.**

- 원본 `assets/ai-approval-concepts/v3-office-background-empty-8-seats.webp` 시각 확인. 창은 왼쪽 가장자리, 상단 중앙, 오른쪽 상단 라운지에 존재; 내부 유리 벽과 외부 창 구분 필요.
- source 기준 지도 aspect 1672/941, min-width 920px, horizontal scroll. background z0, clipped furniture foreground z8, 고정 좌표 actors.
- 넓은 라운지 창은 원본 오른쪽 영역에 있으므로 mobile 최초 좌측 viewport에서는 보이지 않을 가능성이 큼. 좌측에는 좁은 창만 있음.
- desktop 전체 지도에서는 환경 교체 여지가 있으나 정확한 window mask 면적/실제 viewport 노출은 아직 측정하지 않음. mobile 유효성 PASS 금지.
- 도입한다면 외부 창 전용 mask만 변경; 배경 전체 재생성, actor paths, foreground clipping, Boardroom 연동 수정 금지.

## 13. Implementation Plan

- Batch A: 최신 main 감사 + 이 제작 명세 완료. 선행 조건 PARTIAL, 이미지 NOT PROVIDED 기록.
- Batch B: 선행 변경 완료와 실제 4개 자산 제공 후 파일/인지성/crop 확인, home-only resolver 구현.
- Batch C: Remote first-visible/season-change priority와 기존 context 변주 보존.
- Batch D: Dashboard/Remote bounded fallback 및 오류/빠른 시즌 변경 QA.
- Batch E: 1440/390 × 4 seasons, label-hidden / Remote-collapsed 검사, 실제 Finish compatibility, 변경 JS 문법과 관련 회귀. 실패/미검증 항목 구분.
- Batch F: Office feasibility는 이 보고서로 기록; 구현 제외.
- 대표 Preview 후 승인된 release boundary에서 candidate freeze, One-Pass/HINA, 별도 승인된 merge/배포 흐름. 현재 runtime 후보 없음.

## 14. Recommendation

**BLOCKED (Full Implementation): 선행 Seasonal Visual Theme Refresh/Finish 분리 미완료 + Dashboard 계절 이미지 미제공.**

제작 brief는 준비됨. 그림의 left-only 배경 변경은 피하고 crop/overlay와 함께 단일 화면 인지성을 확인해야 함. 선행 작업 완료 전에 이 브랜치에서 구조 중립화나 Finish 구현까지 확장하지 않음.

검증 범위: latest main fetch, source owner/선택 로직/경로 확인, JPG 크기 측정, canonical Hero와 Office 원본 시각 확인. browser 1440/390, live current season, production read-back, perceptual test는 미실시. 문서 전용으로 JS syntax/runtime version bump/One-Pass/HINA는 N/A.
