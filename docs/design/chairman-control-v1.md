# Phase 5: 회장님 직접 조작 상세 설계 사양서 (화면·조작감 v1)

- **작성자**: 세린 연구원 (Gemini)
- **작성일**: 2026-11-21 (KST)
- **대상 범위**: HANI GROUP Living Office (`hani-office-live.js`, `hani-office-live.css`) Phase 5 — 성민 회장님 직접 조작·동행 강아지·상호작용·이벤트
- **전제 및 원칙 (`AGENTS.md` 준수)**:
  1. **저장 없음(Zero New Persistence)**: 11/21 승인 범위에 따라 걷기·말 걸기·이벤트는 **세션 메모리 전용**으로만 동작한다. `hani_os_life_v23`, `2.9.15-safe-baseline-bootstrap`, Cloud 동기화는 절대 수정·호출하지 않는다. (도감·소품 영구 저장은 추후 별도 승인 시 진행)
  2. **친밀도만 기존 승인 경로 재사용**: `window.HaniOfficeAffinity` (`hani_office_affinity_v1`, KST 하루 2회 상한) 경로와 `event.isTrusted === true` 요건을 그대로 사용한다.
  3. **정체성·동행 승계**: 회장님 캐릭터는 공식 개구리 **성민 회장(`seongmin`)**이며, 회장님 전용 강아지(견종·이름 미정)가 기존 개구리 동행 마스코트(`companion-frog`) 자리를 이어받는다.
  4. **기존 구조 우선**: 새 `setInterval`/`requestAnimationFrame` 루프나 별도 이벤트 레이어를 덧대지 않고, 기존 **100ms 시계**와 **canonical `activateActor` 위임 경로**, **persistent DOM slot** 위에서 구현한다.

---

## 0. 선행 코드 조사 (근거 및 줄 번호)

### 0.1 `hani-office-live.js` 핵심 소유 경로

| 영역 | 코드 위치(줄 번호) | 현재 동작 및 설계상 시사점 |
|---|---|---|
| **회장님 정체성·출근/재실** | `L3779–3795` (`createPresence`), `L3865`, `L3890` (`visualIdentity`) | `createPresence`가 로그인 잠금(`locked()`), 가시성(`visible()`), `window.HaniOfficePresence` 오버라이드, 10분(`grace = 600000`ms) 무입력 유예로 `chairmanPresent`, `chairmanSince`, `chairmanArrivalAt`을 계산한다. |
| **회장님 자리·기본 행동** | `L266`, `L418` (`homeSeat`), `L424` (`assignSeats`), `L624`, `L692–700`, `L2110–2121` | `ceo-reserved` (`22.5%, 27.8%` / `art-map-v1.json L1867`: `22.5%, 28%`)는 `owner: "chairman"` 전용으로 직원 자동 배정에서 제외된다. `base-arrive-leave` 출퇴근 이동에서는 제외(`L624`)되며, 4F 최초 입장 시 `chairman-greeting`(`L2110–2121`)으로 주변 직원 1~2명이 인사한다. `sig-seongmin-1`은 하루 3회(`32700 + [0, 14400, 25200][n]`, 즉 09:05·13:05·16:05경) 예약된다(`L692–700`). |
| **순찰(`patrol`) & 보고(`report`)** | `L543–558`, `L1730–1780`, `L2041–2044`, `L2074–2078`, `L2101–2109`, `L2164–2172` | `blockPlan`이 KST 하루 4회 순찰을 예약한다(평일 10:30 `sofa-3f`, 13:10 `coffee-1f`, 15:00 `garden-5f`, 16:40 `pantry-seats-2f` / 주말 11:00·12:30·14:00·16:00, 체류 900~1200초). 보고(`report`, 일 6회)는 회장님이 `ceo-reserved`에 앉아 있을 때만 직원이 방문한다(`L1750–1752`). |
| **동행 마스코트(`companion-frog`)** | `L2478–2486` (`companionPeople`), `L2500–2505` (`companionAtlas`), `L3291–3362` (`companionSnapshot`), `L3699–3711` (`slewCompanion`) | `companion-frog`('아기 개구리', `atlasRow: 0`)은 평일 월요일(`weekday === 1`, `L3299` `person.atlasRow === weekday - 1`)에 회장님을 `98px` 거리로 추종한다(`L3308`). 비동행 요일에는 `4F` 전략기획실 마스코트로 상주(`L3324`). `updateResidents`에서 `slewCompanion`이 `240px/s` 속도로 목표 좌표를 부드럽게 추적한다(`L4654`, `L3702`). |
| **`kidsVisits` 및 남매 보호** | `L3194–3288` (`createKidsVisits`), `L3363–3442` (`companionActivity`), `L3297–3299` | 주말 종일 및 평일 18~22시(`surprise`, 1명 교대) 등장한다. **중요 규칙**: 회장님이 걷고 있거나 부재(`chair.walking || chair.state==='ABSENT'`)면 `peers()`가 빈 배열을 반환하고(`L3202`), 진행 중이던 방문도 `active = null`로 중단한다(`L3263`). 경로 탐색은 32px 격자 BFS + 직선 `clear()` 검사(`L3207–3221`)로 `seongmin`과 최소 `78~80px` 거리를 유지한다(`L3208`, `L3366`). |
| **클릭·탭 Canonical Event Path** | `L3865`, `L4039`, `L4052–4055`, `L4177–4190`, `L4231–4269`, `L4445–4488`, `L4749–4750` | `document` capture `pointerdown`(`L3865`)은 `officePresence.interact` 및 `activateActor(event, true)`(`dismissOnly`)를 호출한다. 실제 상호작용 진입점은 `#haniOfficeActors`(`actorLayer`)에 위임된 `click`/`keydown(Enter|Space)` → `activateActor(event, false)`(`L4177–4187`) 하나다. 개별 버튼(`baristaButton`, `queenFrame`, `eventButton`/`eventPanel`, `tabs`, `roster`)은 각각 persistent slot에 바인딩되어 있다. |
| **100ms 이동 시계** | `L4816–4847` (`setInterval(..., 100)`), `L4848` (`changeOne` 4200ms) | 단일 100ms 시계가 `affinity.flush()`, `200ms` 간격 스케줄 투영(`updateBuilding(false, false)`), `updateResidents()`, 각 액터 위치/gait 갱신, `updateAtmosphere()`, `officeMascotMotion()`을 모두 소유한다. |
| **경로 탐색 `route()`** | `L385–416` (`route`), `L319–370` (`compileCurve`/`sampleCurve`), `L954` (`SCREEN_SPEED=180`) | `route(from, to)`는 `canon.edges` 기반 Dijkstra(`stairs` 제외, 층간 `elevator` 가중치 180)이며, **`a.rendererSeat`를 중간 경유지로 통과 금지(`L406`)**한다. 단, 앵커 간 이동 전용이므로 자유 바닥 좌표 클릭 이동에는 `kidsVisits.route()`(`L3207–3221`)의 32px 격자 BFS + `compileCurve`(`L319`) 방식이 적합하다. |
| **층 전환 `selectFloor()`** | `L4748` (`selectFloor(id, animate=false)`) | 이벤트 패널·말풍선을 닫고, 진행 중인 `officeTravel`을 종료(`finishTravel`)한 뒤, 다른 층이면 `clearEventReaction()` 후 `activeFloor = id`로 전환하고 `updateBuilding(true, animate)`를 실행한다. |
| **친밀도(`affinity`) & 이벤트(`ownerEvents`)** | `L90–166` (`createOfficeAffinity`), `L4040–4051`, `L4151–4156`, `L4437–4488` | `affinity.tap(id, event)`는 `event.isTrusted === true`인 `click`/`Enter`만 인정하며 KST 일 2회 상한. 현재 `secrets`(`L92–118`)에 등록된 대상은 기존 직원 19명(※ `ieum` 제외), `pet-cat/dog/rabbit/bori`, `iseul`, `eunha`이다. `ownerEvents`는 현재 `snack`, `coffee`, `applause`, `cheer`, `birthday` 5종이며 세션 `eventCooldowns` Map으로 10분 쿨다운을 관리한다. |

### 0.2 `hani-office-live.css` 액터·레이아웃 근거

- **맵 & 비율**: `.hani-office-map` (`L7`, `L46`, `L102`)은 `aspect-ratio: 1672/941`, `container-type: inline-size`, `overflow: hidden`으로 모든 요소를 `%` 좌표와 `cqw`로 배치한다.
- **레이어(`z-index`) 질서**: 배경(`0`) → 분위기(`1`) → 바리스타·퀸액자·책상소품·라이브프롭(`2`) → 룸플레이트(`3`) → `#haniOfficeActors`·`.hani-office-sprite`·`:before` 히트박스(`4`) → 이름표(`5`) → 상태칩(`6`) → 전경가림·하트(`8`) → 말풍선(`10`) → 층 라벨(`15`).
- **액터 박스 & 보간**: `.hani-office-actor` (`L20`, `L156`)는 `--actor-height: max(40px, 6.8cqw)`, 발바닥 피벗(`margin-left`, `margin-top`), `[role="button"]:before`로 최소 `40×40px` 터치 영역 확보. 걷기 중에는 `L348`에서 `transition: opacity .3s, left .1s linear, top .1s linear`로 100ms 시계 스텝을 부드럽게 잇는다.
- **390px 휴대폰 레이아웃**: `max-width: 700px`(`L39`, `L58–66`), `max-width: 600px`(`L73–87`, 압축 라벨 `pill`/`name`/`dot` 전환), `max-width: 480px`(`L282–288`, 말풍선 2줄 클램프·확대 스프라이트 숨김), `max-width: 1024px`(`L119`, 하단 네비 여백 `padding-bottom: 64px`). 맵 실측 폭이 약 `342px`(`L1221` 주석 근거)이므로 `40px` 최소 높이 기준이 유지된다.
- **모션 감소(`prefers-reduced-motion: reduce`)**: `L41`, `L179`, `L184`, `L207–210`, `L251`, `L271`, `L276`, `L312–314`, `L330–332`, `L343`, `L349`에서 모든 CSS 애니메이션/회전/트랜지션을 비활성화한다.

### 0.3 공간·에셋 메타데이터 근거

- **엘리베이터 좌표 비대칭**: `spatial-contract.json` 논리 좌표는 1F~5F 모두 `x: 925, y: 240`이나, `art-map-v1.json` 시각 좌표는 **`1F`가 `(35%, 29%)`(`L2704–2705`)**, **`2F~5F`가 `(51%, 12%)`(`L2382–2383`, `L2110–2111`, `L1745–1746`, `L1534–1535`)**로 다르다. 엘리베이터 UI 슬롯은 반드시 층별 `art.anchors['elevator_' + floor]`를 읽어야 한다.
- **회장님(`seongmin`) 스프라이트 현 상태**: `assets/sprites-v3/manifest-v3.json` (`L2257–2387`)에 `1152×1536` 아틀라스(셀 `144×192`, 피벗 `[72, 183]`)의 row 0 정면 4프레임(`standing`, `sitting`, `walk-a`, `walk-b`)만 수록되어 있고 나머지 행은 투명 예약 영역이다(`L6`).
- **기존 상주 강아지와의 구분**: 1F/2F에 상주하는 `pet-dog`(**크림**, `L2468`)과 `pet-bori`(**보리**, `L2470`)는 회사 공용 상주 동물(`residentPeople`)이며, 회장님 전용 동행 강아지는 `companionPeople`(`L2478–2486`)의 `companion-frog` 자리를 승계하는 별도 개체다.

---

## 1. 조작 방식 (걷기·시선·층 이동·자동 복귀)

### 1.1 조종 상태 머신 (세션 메모리 전용)

```
  [AUTO] ──(조종 모드 ON + 이동/키 입력)──▶ [MANUAL_ACTIVE]
    ▲                                              │
    │                               (30초 무입력 / 수동 종료)
    │                                              ▼
    └────(4F 자리 도착 or 즉시 복귀)────── [MANUAL_RETURNING]
```

- **`AUTO` (기본값)**: 기존 결정적 스케줄러(`snapshot(now)`)가 `seongmin`과 동행 강아지를 100% 소유한다.
- **`MANUAL_ACTIVE`**: `chairmanController`가 `seongmin`의 `floor`, `position`, `facing`, `pose`, `walking`, `curve`, `travel`을 소유한다. 회장님이 다른 층을 구경(상단 층 탭 클릭)하는 동안에도 회장님 캐릭터의 논리 층(`controller.floor`)은 유지되며, `controller.floor === activeFloor`일 때만 화면에 렌더링된다.
- **`MANUAL_RETURNING`**: 30초 무입력 또는 '자리로' 종료 시, 현재 층에서 자연스럽게 복귀한다(같은 층 `4F`면 `ceo-reserved`까지 도보 복귀, 타 층이면 `elevator_<floor>`까지 걸어간 뒤 4F 엘리베이터에서 내려 `ceo-reserved`로 도보 복귀). 도착 즉시 `AUTO`로 전환한다. (회의 소집이나 로그인 잠금이 발생하면 즉시 `AUTO`로 전환해 지연 없이 양보한다.)

### 1.2 바닥 탭/클릭 → 경로 따라 걷기

- **Canonical Event Path 통합 (`activateActor` 단일 진입점 확장)**:
  - `actorLayer` / `#haniOfficeMap`에 새 중복 리스너를 쌓지 않고, 기존 `activateActor(event, dismissOnly=false)` (`L4177–4185`) 내부 분기로 통합한다.
  - 우선순위 판정 순서:
    1. `eventPanel` 외부 닫기 / `baristaButton` / `queenFrame` / `actorBubble` 클릭 → 기존 동작 유지.
    2. `.hani-office-elevator-btn` 클릭(조종 모드 ON) → 엘리베이터 이동/층 선택 팝오버.
    3. `.hani-office-actor` 클릭:
       - **조종 모드 OFF**: 기존처럼 즉시 `tapActor(actor, event)` → 말풍선·친밀도.
       - **조종 모드 ON**: 대상이 **근접 반경 내**면 즉시 상호작용(`tapActor` + 근접 액션 바 표시). **원거리**에 있으면 대상 앞 가장 가까운 안전한 통로 바닥까지 걸어간 뒤 도착 시 자동으로 말풍선·액션 바 오픈(`pendingInteraction = actorId`, 이동 중 다른 곳을 클릭하면 취소).
    4. 맵 빈 바닥 클릭(조종 모드 ON & 순수 탭 판정 통과):
       - `map.getBoundingClientRect()`를 클릭 시점에 **단 1회** 읽어 백분율 좌표 `(pctX, pctY)`로 변환한다.
       - 말풍선이 열려 있으면 `closeBubble(true, true)` 후 해당 지점으로 걷기 시작.
- **경로 탐색 및 안전 영역 스냅 (32px 격자 BFS + 스무딩)**:
  - 기존 `route()`(`L399`)는 `canon.anchors` 노드 전용이라 임의 바닥 클릭에 직접 쓸 수 없으므로, `createKidsVisits().route()`(`L3207–3221`)가 검증한 **32px 격자 BFS (`1672×941` → 약 `53×30` 셀)**를 공용 순수 헬퍼 `walkGridRoute(floorId, fromPos, toPos, occupied)`로 일반화한다.
  - **안전 판정(`chairmanSafe(floorId, pos)`)**:
    - `canon.floors[floorId].walkable` 폴리곤 내부 && `!noWalk`
    - `art.floors[floorId].homeFurniture` 및 `freeDesks`의 `seatBounds`/`deskBounds` 침범 금지 (`half=36px, height=110px` 또는 기존 `companionSafe` 발바닥 여백 기준)
    - 타 액터의 현재 발바닥 위치와 최소 `36px` 이상 이격(책상·의자 위 정지 금지)
  - **오차 스냅**: 사용자가 벽이나 책상 가장자리를 살짝 눌렀을 때(반경 `<= 64px`), BFS로 도달 가능한 가장 가까운 안전 셀로 자동 스냅한다. 도달 불가능한 완전히 막힌 방/벽 너머라면 이동하지 않고 도착 표시 원 대신 짧은 안내("여기는 지나갈 수 없어요")를 1.5초 표시.
  - **곡선 스무딩 & 속도**: 찾은 격자 경로에 기존 `compileCurve(waypoints)`(`L319–357`) + `easeRun(u, duration)`(`L311–318`) + `SCREEN_SPEED = 180` px/s(`L954`)를 그대로 적용한다.
- **도착 표시 원 (Destination Marker)**:
  - `#haniOfficeMap` 내부에 persistent slot 1개(`<span class="hani-office-dest-ring" hidden aria-hidden="true">`)를 둔다(`z-index: 3`, 액터 아래·바닥 위).
  - 이동 목표가 정해지면 `left`/`top`을 목표 `%`로 설정하고 `hidden = false`, 도착·취소 시 `hidden = true`로 되돌린다.
  - CSS: `28px` 원형 보라색/금색 점선 링(`#7656c4`), 도착 전까지 1.2s 부드러운 `scale` 펄스(`prefers-reduced-motion`에서는 정적 테두리만).

### 1.3 PC 방향키 / WASD (선택 보조 조작)

- **활성 조건**:
  - 조종 모드 ON 상태이고, 현재 포커스가 입력 요소(`INPUT`, `TEXTAREA`, `SELECT`, `[contenteditable]`)에 있지 않을 때만 동작한다. (특히 `#agentRequestInput` 작성 중 방해 절대 금지!)
  - `keydown` / `keyup`에서 `ArrowUp/Down/Left/Right` 또는 `W/A/S/D`를 `heldKeys` Set에 기록(`blur` / `visibilitychange` 시 Set 초기화).
- **100ms 시계 내 이동**:
  - `heldKeys.size > 0`이면 기존 바닥 클릭 `activePath`를 즉시 취소하고, 정규화 방향 벡터 `(dx, dy)` × `180 px/s × 0.1s (= 18px)`만큼 전진 시도.
  - 벽/책상에 부딪히면 기존 `slewCompanion` (`L3706–3709`)과 동일하게 **X축 우선 / Y축 대안 분리 검사**로 벽을 타고 부드럽게 미끄러진다.
  - 방향키를 떼면 즉시 `standing` 포즈로 멈춘다.

### 1.4 휴대폰 390px 스크롤·핀치 충돌 방지

390px 모바일에서 맵 위를 세로 스크롤하거나 두 손가락 핀치 줌할 때 캐릭터가 의도치 않게 이동하지 않도록 **3중 방어**를 적용한다.

1. **명시적 '🚶 직접 걷기' 토글 버튼 (기본 OFF)**:
   - 위치: `.hani-building-floor-caption` (또는 `.hani-office-live-actions`) 내부에 `44×44px` 이상 터치 버튼 `#haniOfficeControlToggle` 배치 (`aria-pressed="false"`).
   - OFF 상태: 바닥을 터치해도 캐릭터가 움직이지 않으며 기존 스크롤·핀치·직원 말풍선 열기만 100% 유지된다.
   - ON 상태: 버튼 활성 강조 + 캡션에 `조종 중 · 바닥을 눌러 이동` 짧은 안내.
2. **제스처 의도 판별 (Tap vs Scroll / Pinch)**:
   - 조종 모드 ON에서도 `touch-action: pan-y pinch-zoom`을 맵에 유지해 브라우저 네이티브 세로 스크롤과 핀치 줌을 절대 가로채지 않는다(`preventDefault()` 금지).
   - `pointerdown` 시 `pointerId`, `clientX/Y`, `timeStamp` 기록 (멀티터치 감지 시 즉시 무효화 `cancelled = true`).
   - `pointerup` 시 다음 조건을 **모두** 만족하는 **순수 단일 탭**일 때만 바닥 걷기를 실행:
     - `isPrimary === true` && 멀티터치 아님
     - 포인터 이동 거리 `Math.hypot(dx, dy) < 8` px (스크롤 스와이프 제외)
     - 누른 시간 `duration < 350` ms (길게 눌러 스크롤 대기/텍스트 선택 제외)
3. **390px 가독성**: 조종 중에는 회장님 이름표 우선순위를 `statusLabelPriority` 최고 등급(`3`, `L2266`)으로 유지해 390px에서도 회장님 위치가 점(`.`)으로 축소되지 않게 보호한다.

### 1.5 엘리베이터 탭으로 층 이동

- **시각 슬롯**: 각 층의 `art.anchors['elevator_' + floor]` 좌표(`1F: 35%, 29%`, `2F~5F: 51%, 12%`)에 persistent 버튼(`.hani-office-elevator-btn`, `z-index: 4`, 최소 `44×44px`)을 둔다. 조종 모드 OFF에서는 `hidden=true`, ON일 때만 활성화된다.
- **동작 흐름**:
  1. 엘리베이터 버튼 탭 → 회장님이 현재 위치에서 `elevator_<activeFloor>` 앞까지 먼저 걸어감(이미 `<= 48px` 거리면 즉시).
  2. 도착 시 엘리베이터 바로 아래/옆에 **5버튼 층 선택 팝오버**(`.hani-office-floor-picker`, `1F`~`5F` 각 `44×44px` 이상, 현재 층 `aria-current="true"` 비활성) 표시. `Escape`나 바깥 클릭으로 취소 가능.
  3. 목표 층 선택 시:
     - `selectFloor(targetFloor)` 호출로 화면 전환.
     - 회장님 `controller.floor = targetFloor`, 위치는 `elevator_<targetFloor>` 앞 안전 스팟에 배치(문 앞에서 한 걸음 걸어 나오는 짧은 0.4s 연출, `reduced`에서는 즉시 배치).
     - 동행 강아지도 같은 층 엘리베이터 옆 안전 스팟에 함께 등장.
- **상단 층 탭(`.hani-building-tabs`)과의 관계**:
  - 상단 5개 층 탭은 **"카메라 시점 이동(다른 층 구경)"**으로 유지한다. 회장님이 4F에 있을 때 상단 탭으로 2F를 눌러도 회장님이 순간이동하지 않는다.
  - 단, 회장님과 다른 층을 보고 있을 때 조종 배지에 `[회장님 층(4F)으로 보기]` 또는 `[여기로 호출]` 보조 버튼을 제공해 길을 잃지 않게 한다.

### 1.6 자동 순찰(`AUTO`) 복귀 조건

다음 중 하나라도 충족되면 `MANUAL_ACTIVE`에서 자동 순찰(`AUTO`)로 전환한다.

| 조건 | 동작 | 비고 |
|---|---|---|
| **무입력 30초 경과** | `MANUAL_RETURNING` 전환 → 4F `ceo-reserved`로 복귀 완료 후 `AUTO` | 바닥 탭·방향키·상호작용·층 이동 시 타이머 리셋 (`lastControlAt = now`). |
| **조종 토글 OFF / `Escape` 2회** | 말풍선 열려 있으면 첫 `Escape`로 닫고, 두 번째 `Escape` 또는 토글 OFF로 복귀 | 토글 OFF 시 즉시 `AUTO`로 스냅하거나 걸어서 복귀(토글 툴팁에 명시; 권장: **걸어서 복귀**, `reduced`는 즉시 `AUTO`). |
| **AI 회의 소집(`openMeeting` / `SUMMONING`)** | **즉시** 조종 해제 및 `AUTO` 전환 | 1순위 우선순위 보호. |
| **화면 숨김/이탈** | `!sceneVisible()` 또는 `document.hidden` 60초 초과 시 `AUTO` 초기화 | 백그라운드 복귀 시 엉뚱한 위치 고립 방지. |
| **로그인 잠금(`login-locked`)** | 즉시 조종 해제 및 `AUTO` 초기화 | 안전 규칙 준수. |

---

## 2. 강아지 동행 (개구리 `companion-frog` 자리 승계)

### 2.1 `companion-frog` 승계 및 코드 위치

- **승계 대상**: `hani-office-live.js` `L2478–2486` `companionPeople`의 첫 번째 항목인 `companion-frog`(`atlasRow: 0`, `'아기 개구리'`).
- **교체 및 확장 방식**:
  1. `companionPeople[0]`을 회장님 전용 강아지(가칭 `companion-dog`, 견종·이름 확정 후 반영)로 교체한다.
  2. `companionSnapshot` (`L3291–3362`)의 `follows` 판정(`L3299`):
     - **`AUTO` 모드**: 기존 월요일 동행(`atlasRow === 0`, `weekday === 1`)을 그대로 잇고, 평상시 비동행 요일(`화~금`)에는 기존 `4F` 부서 상주(`L3324`) 규칙을 활용해 **4F 회장실 낮잠 자리**에 머문다.
     - **`MANUAL_ACTIVE` 모드**: 요일·시간과 무관하게 **회장님이 직접 조종을 시작하면 강아지가 항상 깨어나 회장님을 따라다닌다**(단, 주말 또는 평일 18~22시 `kidsVisits` 중 남매와 함께 있는 경우에는 아래 충돌 규칙을 따른다).
  3. **기존 1F/2F 상주 펫(치즈·크림·모찌·보리)과 분리**: `pet-dog`(**크림**)과 `pet-bori`(**보리**)는 `residentPeople`(`L2468, L2470`)에 그대로 남아 1F/2F에서 기존처럼 생활한다.

### 2.2 따라오는 거리·속도·경로·대기 행동

- **따라오는 거리**:
  - 회장님 진행 방향 뒤쪽 **`56~72px`** (기본 `64px` 뒤 + Y축 살짝 `8px` 아래로 겹침 방지).
  - 정지 시에는 회장님 왼쪽/오른쪽 옆 **`48~58px`** 대각선 안전 자리로 다가와 나란히 선다.
  - 기존 `companionSnapshot` `free()` (`L3304`)의 `seongmin` 거리 기준(`80px`)은 동행 강아지에 한해 **`44px`**으로 완화해 좁은 문(`44px` 폭)과 복도에서도 회장님 바로 뒤에 붙을 수 있게 한다.
- **속도 및 추종 방식**:
  - 속도: **`230~240 px/s`** (`slewCompanion` `L3702`의 `240 * dt` 그대로 사용, 회장님 `180 px/s`보다 약 33% 빨라 뒤처지지 않음).
  - **빵부스러기(Trail) 추종**: 회장님이 코너나 문을 돌아 이동할 때 강아지가 벽에 걸리지 않도록, 회장님의 최근 이동 좌표(24px 간격 최대 12개)를 세션 메모리 큐에 저장하고 강아지가 직선 `clear()` 실패 시 이 큐의 다음 점을 향해 따라오도록 한다.
- **대기 행동 (회장님 정지 시)**:
  - `0 ~ 2초`: `standing`, 회장님 방향(`facing`) 바라보기.
  - `2 ~ 15초`: `sitting` 기본 자세 + 기존 `residentLife`(`L3512–3524`)의 `wag`(꼬리 흔들기), `turn`(고개 돌리기), `hop`(반짝 뜀) 주기를 재사용해 살아있는 반응 표현.
  - `15초 이상` & 위치가 `4F ceo` 방일 때: 낮잠 자리로 토도독 이동해 `sleep` 포즈 전환.

### 2.3 쓰다듬기 반응

- 강아지 액터(`data-person="companion-dog"`) 탭 또는 근접 컨텍스트 바 `[🐾 쓰다듬기]` 클릭 시:
  - 기존 `.hani-office-pet-heart` (`hani-office-live.css L240–251`, `L4024` `actor.officeHeart`)와 `data-affection="dog"` (`L243`, `L247`) 및 `officeReactions.request('hop', now, true)`를 그대로 실행한다.
  - 분홍/빨강 하트(`💕`)가 떠오르고 강아지가 2번 깡충(`hani-office-hop`)하며 짧은 반응 말풍선(세션 순환 대사 4~5종, 예: "멍! 꼬리가 멈추질 않아요!", "회장님 손길이 제일 따뜻해요!")을 3초간 띄운다.
  - 저장 없음 단계이므로 `hani_office_affinity_v1`에는 기록하지 않는다(추후 도감·소품 영구 저장 승인 시 확장).

### 2.4 회장실 낮잠 자리

- **좌표**: 4F `ceo` 방(`spatial-contract.json L384–396`: `x:40..280, y:50..300`) 내부, 회장님 책상(`deskBounds: [178, 252, 570, 400]`, `art-map-v1.json L310`) 오른쪽 옆 빈 바닥(예: 4F 아트 기준 **`x: 34~36%, y: 31~34%`**, `companionSafe` 통과 지점 1곳을 구현 시 좌표 검증으로 확정).
- **동작**:
  - `AUTO` 상태에서 평일(월 제외)이거나 회장님이 `ceo-reserved`에 오래 앉아 일할 때, 강아지는 이 낮잠 자리에서 `sleep` 포즈 + `.hani-office-sprite` 숨쉬기(`hani-pet-sleep`, `L261, L270`)로 쉰다.
  - 조종 모드 ON 및 첫 이동 시 즉시 `standing`으로 일어나 쫓아온다.

### 2.5 수현·수연과 놀기

- 주말 또는 평일 18~22시(`surprise`)에 수현·수연(`kid-suyeon`, `kid-suhyeon`)과 같은 층에 있을 때:
  - 회장님이 **멈춰 서 있는 동안(`!walking`)** 30~60초 주기로(또는 아이/강아지 탭 시) 1회 짧은 놀이 상호작용 발생.
  - 수연이 강아지 쪽(`84px` 거리, `companionSafe` 준수)으로 다가가 손을 흔들고(`wave` 포즈), 수현은 "…실내에선 살살 쓰다듬어야 해."라고 한마디 거든 뒤 강아지가 `hop`/`wag`으로 화답한다.
  - 회장님이 다시 걷기 시작하면 즉시 놀이를 마무리하고 각자 동행 대형으로 복귀한다.

---

## 3. 말 걸기·칭찬·간식 (상호작용 & 친밀도)

### 3.1 근접 거리 및 대상 포착

- **근접 반경**:
  - 일반 바닥/복도 내 대상(서 있는 직원, 동행 강아지, 상주 동물, 남매, 방문객): 아트 픽셀 거리 **`<= 110px`**.
  - 책상에 앉아 있는 직원(넓은 `deskBounds` 때문에 몸이 바로 붙기 어려운 `office_hani`, `dev-lead` 등): **`<= 135px`** (책상 앞 통로/접근 노드에서 자연스럽게 닿는 거리).
- **포착 규칙**:
  - 100ms 틱마다(조종 모드 ON일 때만) 현재 층 `activeFloor`의 보이는 액터 중 근접 반경 안의 가장 가까운 **단 1명**을 `nearestTarget`으로 지정한다.
  - 해당 액터에 `data-in-range="true"`를 부여해 은은한 포커스 링(CSS `drop-shadow`)을 표시하고, 맵 하단/상단 고정 **근접 액션 바**(`.hani-office-proximity-bar`, persistent slot)를 활성화한다.

### 3.2 대상별 반응 및 대사 경로

| 대상 구분 | 제공 액션 (최대 3버튼) | 연출 및 대사 소스 | 친밀도(`HaniOfficeAffinity`) |
|---|---|---|---|
| **직원 (20명)** | `💬 말 걸기` · `👏 칭찬` · `🍪 간식` | **말 걸기**: 기존 `tapLines.tap()` (`toChairman` / 시간대별 / `drama` / `tripleTap`)<br>**칭찬**: `eventLines.applause[id]` + `nod` 모션<br>**간식**: `eventLines.snack[id]` + `tap` 모션 + 3초 `🍪` 머리 아이콘 | 기존 `affinity.tap(id, event)` 호출 (하루 2회 상한, `isTrusted` 필수). ※ `ieum`은 `secrets` 미등록 상태라 저장 단계 전까지 반응만 표시. |
| **미르 (`mir`)** | `💬 말 걸기` · `👏 칭찬` · `✨ 마음 나누기` | 기존 규칙 유지: 음식 섭취 모션 없이 `standing` 유지, 관찰/연결 화법 응답 (`office-tap-lines-v1.json` + `eventLines.applause/snack.mir`). | `affinity.tap('mir', event)` 그대로 적용. |
| **1F 바리스타 (`iseul`/`eunha`)** | `💬 말 걸기` · `☕ 커피 한 잔` | 주간(`iseul`) / 야간(`eunha`, 02~07시 `baristaAwake` 깨우기 `L4255`) 기존 `baristaLines`/`baristaNightLines` 재사용. | `affinity.tap(id, event)` 그대로 적용. |
| **상주 동물 (`치즈/크림/모찌/보리`)** | `🐾 쓰다듬기` · `🍖 간식` | 종별 모션(`data-affection="cat|dog|rabbit|bori"`, 하트 `.hani-office-pet-heart`) + `residentVoice` / 전용 간식 반김 대사. | `affinity.tap(id, event)` 그대로 적용. |
| **회장님 강아지 (`companion-dog`)** | `🐾 쓰다듬기` · `🍖 간식` | 2회 깡충(`hop`) + 하트 + 강아지 전용 대사(세션 메모리). | **저장 없음** (`secrets` 미추가, 추후 승인 시 확장). |
| **수현·수연 (`kid-*`)** | `💬 말 걸기` · `🍪 간식` | 수연(`wave`/하트)/수현(책/무심한 미소) 전용 다정한 아빠 대사 + `kidsVisits` 트리거 연결 가능. | **적용 안 함** (`L4046` `companion!=='true'` 유지). |
| **NPC · 외부 방문객** | `💬 말 걸기` | `residentPeople` / `visitor` 대사(`L2471–2475`, `L1443–1449`) 1회 출력. | **적용 안 함** (`L4046` 유지). |

- **시선 마주보기**: 근접 상호작용 중에는 두 캐릭터(`seongmin`과 대상)가 서로의 X좌표를 기준으로 `data-facing`을 마주 보게 잠깐 회전(`nod`/`lean`)하고, 3초 뒤 원래 방향을 회복한다.
- **신규 저장 0원칙**: 칭찬/간식/쓰다듬기 횟수나 "누구에게 몇 번 간식을 줬는지"는 **전혀 저장하지 않는다**. 오직 기존 승인된 `affinity.tap(id, event)`만 통과하며, 하루 2회 상한에 도달해도 대사와 모션은 정상 출력된다(단 `+1 ♡` 플로팅과 `hani_office_affinity_v1` 카운트 증가만 멈춤).

---

## 4. 이벤트 버튼 (회장님 직접 발동 이벤트 3종)

기존 `#haniOfficeEvents` 버튼 및 `#haniOfficeEventPanel` (`L4445–4488`, `eventCooldowns` 세션 `Map`) 안에 아래 3종 이벤트를 통합한다(기존 `snack`, `coffee`, `applause`, `cheer`, `birthday`와 공존하거나 `깜짝 간식`은 기존 `snack`을 고도화해 중복 방지).

| 이벤트 | 쿨다운 (세션 전용) | 시간대 제한 (KST) | 대상 및 장소 | 연출 순서 |
|---|---|---|---|---|
| **1. 🍻 회식 소집 (옥상)** | **30분** (`1,800,000`ms) | **18:00 ~ 23:00** (주간에는 버튼 비활성 + `18시 이후 가능` 표시) | `5F` 옥상 테라스/행사 구역 (`rooftop_table_slot_1~6` + `rooftop_event` 주변, 최대 6명 + 회장님 + 강아지) | ① 버튼 클릭 → `selectFloor('5f')`로 옥상 이동<br>② 회장님·강아지가 옥상 중앙에 자리 잡고, 현재 재실 중 비회의/비방문객 직원 최대 6명이 세션 오버레이로 옥상 슬롯에 합류<br>③ 12초간 `🍻 옥상 회식 중` 상태 + 3초 간격 릴레이 건배/소감 말풍선(3명)<br>④ 종료 후 원래 층·스케줄로 즉시 복원(원본 `scheduler` 미변경) |
| **2. 🍜 편의점 야식 돌리기** | **20분** (`1,200,000`ms) | **19:00 ~ 02:00** (주간에는 버튼 비활성 + `19시~02시 가능` 표시; 해당 층/건물에 야간 잔류 직원이 1명 이상 있을 때 활성) | 현재 층(또는 야근 중인 3F·1F·4F) 정지 직원 (특히 `seoyun`, `dohyun`, `mir`, `yuna`, `minji`) + 강아지 | ① 클릭 → 회장님 위치(또는 현재 보고 있는 층)의 야간 근무자 전원 `🍜 야식 먹는 중` 전환 (10초)<br>② 야근자 전용 감사 말풍선 1~2회 순차 표시 + 미르는 관찰 대사(음식 모션 없음)<br>③ 강아지는 간식 뼈다귀/반김 모션(`wag`)<br>④ 10초 뒤 원래 야근/휴식 상태로 복귀 |
| **3. 🍪 깜짝 간식** | **10분** (`600,000`ms) *(기존 `snack`과 동일)* | **제한 없음** (상시) | 현재 층 `activeFloor`의 정지 중인 직원 전원 + 강아지 (기존 `eventStationary` `L4464` 기준 확장) | ① 기존 `runOwnerEvent('snack')` 경로 승계<br>② 조종 중이면 회장님 `tap` 손짓 모션 + 강아지 `hop` 추가<br>③ 해당 층 정지 직원 전원 8초간 `🍪 간식 먹는 중` + `snackLines` 말풍선 1개(4초)<br>④ 8초 뒤 자동 해제 |

> **저장 없음 원칙**: `eventCooldowns` Map은 페이지 새로고침 시 초기화되며 `localStorage`나 Supabase에 기록하지 않는다.

---

## 5. 기존 기능과 충돌 방지 (우선순위 및 예외 규칙)

### 5.1 전체 우선순위 서열

1. **로그인 잠금(`login-locked`) & AI 안건 회의 소집(`openMeeting` / `liveStage === 'SUMMONING'`, `L4807`, `L4812`)**:
   - 회의 소집이 시작되거나 `agentReview` 안건 회의로 들어가면 **회장님 조종 모드와 진행 중인 5F 회식/야식 연출을 즉시 종료**하고 `AUTO` 상태로 복귀한다.
2. **배포/보고/방문객 등 외부·업무 결정적 흐름**:
   - 다른 20명 직원과 1F 방문객(`visitor`, `visitor-2`)의 `scheduler.plan()` / `blockPlan()` 데이터는 절대 수정하지 않는다.
   - `MANUAL_ACTIVE` 중 4F `ceo-reserved`가 비어 있을 때 `report` 시간(`L1750`)이 겹치면, 직원이 빈 의자에 보고하지 않도록(`L1751` 원칙) `MANUAL_ACTIVE` 동안만 `report` 표시를 건너뛴다.
3. **회장님 직접 조작(`MANUAL_ACTIVE`) 및 회장님 이벤트**:
   - `MANUAL_ACTIVE` 동안에는 **`staffChats.update()`의 `blocked` 플래그(`L4580`)에 조종/근접상호작용 상태를 포함**해, 사용자가 직원에게 말을 거는 도중 자동 수다가 말풍선을 가로채지 않게 한다.
   - `scheduleFloorBubble()`(`L4064`)의 자동 말풍선도 `MANUAL_ACTIVE` 동안은 일시 멈춘다.
4. **`kidsVisits` 및 수현·수연 보호**:
   - 기존 코드(`L3202`, `L3263`)대로 회장님이 **걷는 중(`walking === true`)에는 `kidsVisits`를 시작하지 않고**, 이미 진행 중이었다면 `kidsVisits.cancel(now)`로 안전하게 원위치 복귀시킨다.
   - 회장님이 **정지 상태**로 섰을 때만 `kidsVisits`나 강아지-남매 놀이가 동작한다.
   - 회장님 직접 이동 시에도 수현·수연의 위치(`78px` 반경)를 피하거나 아이들이 안전 여백(`companionSafe`) 밖으로 밀리지 않도록 충돌 회피한다.
   - `회식 소집(5F)` 등 성인 회식 연출 시 수현·수연에게는 술/회식 건배 대사를 붙이지 않고 주스·간식 또는 제외 처리한다.
5. **결정적 일정과의 관계 ("회장님이 조종하는 동안만 예외")**:
   - `AUTO` 상태에서는 `building.scheduler.snapshot(now)`가 계산하는 **결정적 순찰(`patrol`)·착석(`sig-seongmin-1`)·동행 일정을 100% 그대로** 따른다.
   - 오직 `MANUAL_ACTIVE` / `MANUAL_RETURNING` 구간에서만 `seongmin`(과 동행 강아지)의 좌표·포즈·대사를 세션 컨트롤러 값으로 오버라이드한다. 조종이 끝나 `AUTO`로 돌아오면 즉시 해당 시각의 결정적 스케줄로 자연스럽게 합류한다.

---

## 6. 성능 및 접근성

### 6.1 성능 원칙

- **새 타이머 추가 금지**: 기존 `hani-office-live.js` `L4816`의 단일 `setInterval(..., 100)` 안에서 조종 이동 보간, 방향키 스텝, 강아지 추종, 근접 대상 판정, 30초 무입력 타이머 체크(`now >= idleDeadline`), 이벤트 종료/쿨다운 동기화(`now >= eventUntil`)를 모두 타임스탬프 비교로 처리한다. (추가 `setInterval` 0개, 추가 `requestAnimationFrame` 0개)
- **Layout Read 분리 (Zero Thrash)**: `getBoundingClientRect()`는 `pointerdown`/`pointerup` 시점 1회와 기존 `fitStatusLabels()`/`fitBubble()` 배치 내에서만 읽는다. 100ms 틱 내부에서는 `%`와 논리 픽셀(`1672×941`) 계산만 수행한다.
- **격자 BFS 캐시**: 층별 `walkable`/`noWalk`/`homeFurniture` 정적 장애물 비트맵(약 `53×30` 셀)은 층당 최초 1회만 생성해 `Map`에 캐시한다.

### 6.2 접근성 (`A11y` & `prefers-reduced-motion`)

- **키보드 접근**:
  - '직접 걷기' 토글 버튼, 엘리베이터 버튼(1F~5F), 층 선택 팝오버, 근접 액션 바 버튼 모두 `<button type="button">`으로 구성해 `Tab` 이동, `Enter`/`Space` 실행, `Escape` 닫기 지원.
  - PC 방향키/WASD 이동은 조종 모드 ON & 입력 필드 미포커스일 때만 소비하며, `Tab`은 방해하지 않는다.
  - 스크린리더용 `aria-live="polite"` 안내 슬롯(기존 `presenceNote` 또는 전용 상태 영역)은 매 틱 좌표가 아니라 **모드 전환·도착·층 이동·상호작용 발생 시에만** 간결한 한국어 문장 1회 출력(예: `"3층 AI플랫폼개발실에 도착했습니다"`, `"서윤에게 말을 걸었습니다"`).
- **`prefers-reduced-motion: reduce`**:
  - 기존 `reduced` 미디어 쿼리(`L3882`) 연동.
  - 이동 시 걷기 바운스/기울기(`--step-bounce`, `--step-lean`) 및 CSS 0.1s 트랜지션(`L349`) 제거.
  - 목적지 클릭 시 부드러운 중간 보간 대신 짧은 확인 후 목적지(또는 엘리베이터 전환 위치)로 즉시 배치, 도착 링·하트 애니메이션도 정적 표시만 유지.

---

## 7. 구현 단계(PR 순서), 시험 계획 및 그림 필요 목록

### 7.1 작게 쪼갠 PR 순서 (`AGENTS.md` §11 배포 열차 준수 · PR 내 버전 증가 없음)

1. **PR 1 · 경로 탐색 분리 + 조종 토글 & 바닥 걷기**:
   - `walkGridRoute()`(32px 격자 BFS + `compileCurve`) 순수 헬퍼 분리, `#haniOfficeControlToggle`('직접 걷기') 버튼 + 390px 탭/스크롤 제스처 분리 + 도착 표시 원 + 100ms 틱 이동 + 30초 무입력 복귀. *(기존 정면 스프라이트 4종으로 즉시 동작 가능)*
2. **PR 2 · 엘리베이터 층 이동 + PC 방향키 + 충돌 방지**:
   - 각 층 `elevator_*` 좌표 기반 버튼 및 1~5F 층 선택 팝오버, PC 방향키/WASD 스텝 이동, 회의 소집·`kidsVisits`·`staffChats` 우선순위 차단 로직 연결.
3. **PR 3 · 회장님 전용 강아지 동행 & 낮잠 자리**:
   - `companion-frog` → `companion-dog` 승계, 빵부스러기 추종 경로 및 `240px/s` 속도, 대기 앉기/꼬리 흔들기, 쓰다듬기 하트 반응, 4F 회장실 낮잠 자리, 수현·수연과 놀이 연결. *(에셋 준비 전에는 임시 placeholder/기존 dog 시트 매핑 테스트 가능)*
4. **PR 4 · 근접 말 걸기·칭찬·간식 & 이벤트 3종**:
   - 근접 반경(110~135px) 포착 및 persistent 컨텍스트 액션 바, `window.HaniOfficeAffinity` 연동(`isTrusted` 유지), `회식 소집(5F)` · `편의점 야식 돌리기` · `깜짝 간식` 연출 및 세션 쿨다운.
5. **PR 5 · 아트 최종 연결 & 다듬기**:
   - 회장님 옆/뒤 걷기 프레임(`seongmin.webp`) 및 확정된 회장님 강아지 시트 반영, 390px/1440px UI 검수.

### 7.2 시험 계획

| 검증 구분 | 검증 항목 및 방법 | 통과 기준 |
|---|---|---|
| **구문·정적 계약** | `node --check hani-office-live.js`, 기존 `office` Node 테스트 묶음 | 구문 오류 0건, `AUTO` 상태에서 `scheduler.snapshot()` 결과 기존과 100% 일치. |
| **안전·저장 불변** | 조종·상호작용·이벤트 3종 실행 전후 `localStorage` 및 네트워크 감시 | `hani_os_life_v23` write 0건, 신규 localStorage 키 0건, `hani_office_affinity_v1`은 실제 `isTrusted` 클릭에서만 일 2회 상한 내 증가. |
| **경로·충돌** | 각 층 책상/벽 클릭 스냅, 방향키 벽 슬라이딩, 회의 소집·`kidsVisits` 중 이동 | 벽·책상 위 정지 0건, 회의 소집 시 0ms 지연 없이 `AUTO` 복귀, `kidsVisits` 중 걷기 시작 시 안전 복귀. |
| **모바일 390px / PC 1440px** | Edge/Playwright 실측 (390px 스와이프 스크롤 vs 단일 탭, 44px 터치 타깃, 말풍선 클리핑) | 조종 OFF·스와이프 시 오작동 이동 0건, 모든 조종 버튼 `>= 44×44px`, 라벨·말풍선 겹침/잘림 0건. |
| **성능·모션 감소** | `setInterval` 호출 횟수 점검, 100ms 틱 내 layout read 점검, `prefers-reduced-motion: reduce` 테스트 | 새 `setInterval` 0개, 틱 내 `getBoundingClientRect` 0회, reduced 모드에서 애니메이션/트랜지션 0건. |

### 7.3 그림 필요 목록 (Asset Checklist)

| 에셋 | 현재 상태 (코드 근거) | 필요한 산출물 |
|---|---|---|
| **1. 회장님(`seongmin`) 추가 방향 프레임** | `assets/sprites-v3/manifest-v3.json` (`L2257–2387`)에 `1152×1536` 시트(셀 `144×192`, 피벗 `[72, 183]`) 중 정면 4프레임(`standing`, `sitting`, `walk-a`, `walk-b`)만 존재 | - **옆모습**(좌/우 또는 1방향 반전): `standing-side`, `walk-a-side`, `walk-b-side`<br>- **뒷모습**: `standing-back`, `walk-a-back`, `walk-b-back`<br>- 기존 정장·빨간 넥타이 공식 개구리 규격(`144×192`, 하단 그림자 포함) 유지 |
| **2. 회장님 전용 강아지 시트** | 현재 `companions-v1.webp` row 0은 `companion-frog` 차지, 견종·이름 **미정** | - 견종·이름 확정(성민 대표님 선택) 후 `96×144` 셀, 피벗 `[48, 135]` 기준 좌/우 2방향 × 5포즈(`sitting`, `standing`, `walk-a`, `walk-b`, `sleep`) 총 10프레임 (`480×288` 단독 시트 또는 `companions-v1.webp` row 0 교체)<br>- 기존 1F/2F `크림`(`pet-dog`)·`보리`(`pet-bori`)와 색·실루엣이 명확히 구분되도록 제작 |

---

## 8. 성민 대표님(회장님)용 쉬운 요약

1. **원할 때만 직접 걸어 다니기**: 평상시엔 지금처럼 회장님이 알아서 출근·순찰·결재를 하시고, **'직접 걷기'** 버튼을 누르면 바닥을 톡 눌러서 원하는 곳으로 걸어가실 수 있습니다(30초 동안 조작을 멈추면 알아서 자리로 돌아갑니다).
2. **휴대폰·PC 모두 편한 조작**: 휴대폰(390px)에서는 화면을 위아래로 쓸어내릴 때 실수로 걷지 않도록 '직접 걷기'를 켰을 때 가볍게 한 번 탭할 때만 움직이고, PC에서는 방향키로도 산책하실 수 있으며 엘리베이터를 눌러 1층부터 5층 옥상까지 오르내리실 수 있습니다.
3. **전용 강아지 비서 동행**: 아기 개구리 마스코트 자리를 **회장님 전용 강아지**가 이어받아(견종·이름은 대표님 확정 후 결정) 회장님 뒤를 졸졸 따라다니고, 멈추면 옆에 앉아 꼬리를 흔들며, 4층 회장실 낮잠 자리에서 쉬거나 주말엔 수현·수연이와도 어울립니다.
4. **가까이 가서 말 걸기·이벤트 3종**: 직원이나 동물·아이들에게 가까이 다가가 말 걸기·칭찬·간식·쓰다듬기를 할 수 있고(친밀도는 기존 하루 2회 규칙 그대로), **옥상 회식 소집(저녁)**·**편의점 야식 돌리기(밤)**·**깜짝 간식** 버튼으로 사무실 분위기를 띄우실 수 있습니다.
5. **안전과 저장 없는 1차 출시**: 이번 Phase 5 1차 설계는 내 기록(`hani_os_life_v23`)이나 Cloud를 전혀 건드리지 않고 새로고침하면 초기화되는 안전한 놀이 기능부터 구현하며, 그림은 회장님 옆·뒤 걷기 컷과 강아지 시트가 추가로 필요합니다.

---

### 마지막 요약 (3줄)
1. 기존 100ms 시계·`activateActor` 위임 경로·32px 격자 BFS와 `window.HaniOfficeAffinity`를 그대로 재사용해, 저장 변경 없이 회장님 직접 걷기·엘리베이터 층 이동·근접 상호작용·이벤트 3종(옥상 회식/야식/깜짝 간식)을 구현하는 상세 사양을 정리했습니다.
2. 휴대폰 390px 스크롤·핀치 보호를 위해 '직접 걷기' 토글과 순수 탭 판정(`<8px`, `<350ms`)을 두고, 회의 소집·`kidsVisits`·결정적 스케줄(`AUTO`)을 최우선으로 보호하도록 충돌 규칙을 확정했습니다.
3. 회장님 전용 강아지(견종·이름 미정)가 `companion-frog` 자리를 승계하며, 5단계 작은 PR 순서와 함께 회장님 옆/뒤 걷기 프레임 및 강아지 시트 에셋 목록을 도출했습니다.
