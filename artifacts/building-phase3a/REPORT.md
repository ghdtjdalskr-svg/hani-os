# HANI BUILDING Phase 3a 보고서 — 1F 편의점 로비 개편 & 기업솔루션 2F 이사

- 작성: 세린 연구원 (Gemini) · 브랜치: `hani/building-5f` · NPC(점원·경비) 제외 범위

## 1. 바꾼 곳

| 파일 | 변경 요약 |
| --- | --- |
| [`art-map-v1.json`](../../data/hani-building/art-map-v1.json) | `1f` 배경 `./assets/building/floor-1f-v2.webp` 교체, 4개 구역 이름표 배치, 1F 15개 `furnitureBounds` 신설, 1F 앵커 좌표를 새 그림 기준 재정렬, `2f` 빈 책상 `finance-row-spare`/`finance-row-spare-east`를 `sua`/`taeo` 지정석으로 연결(`freeDesks: []`, `deskProps` 이동) |
| [`spatial-contract.json`](../../data/hani-building/spatial-contract.json) | `1f` `business` 구역을 `convenience`(HANI 24 편의점, `menuLink -> ledger`)로 개편, `convenience_browse` 앵커·간선 추가, `sua`/`taeo` `homeAnchor`·`workAnchor`·`meetingAnchor`·`breakAnchor` 및 엣지 2F 이동, `seatMapByFloor` `1f`/`2f` 갱신 |
| [`office-places.json`](../../data/hani-building/office-places.json) | `convenience-1f` 장소 추가, `sua`/`taeo` signature 장소를 `window-2f`/`pantry-2f`로 이동, `visitor-host-junction_consult` 상담실 방문 응대 카드 추가 |
| [`office-actions-221.json`](../../assets/data/office-actions-221.json) | `sua`/`taeo` `people.home` 및 `base-*`·`sig-*`·`night-window-view` 2F 이동, 야간 `ambient-1f`에서 `sua`/`taeo` 제외 후 `ambient-2f`에 추가 |
| [`hani-office-live.js`](../../hani-office-live.js) | `floorDefaults`(1F 배경/`anchorCount` `52`, 2F `80`/거주자), `legacySeatMaps`, `monitorScreens`, `errandPlaces`(`hall_convenience`), `visitorKinds`(`client_booth_slot_1`), `visitorTargets`, `reserveHosts`(`1f`·`2f` 허용 및 `at+75`), `companionSafe`/`residentSafe` `furnitureBounds` 검사 추가, `residentFurniture['1f']` 및 1F `residentStops` 남·서측 열린 로비로 재배치, `queenFrame` 좌측 엘리베이터 옆 액자 위치 정렬, `liveProps` `coffee-desk` 라면바 위치 보정 |
| [`hani-building-phase3a.test.mjs`](../../scripts/hani-building-phase3a.test.mjs) | 1F 배경·4이름표·가계부 클릭·수아/채원 2F 자리·방문형 상담 응대·앵커 무결성·1F `residentSafe`/`companionSafe`·저장소/타이머 0 검증 시험 신설 |

> **안전 유지**: `localStorage`/`Cloud`/`hani_os_life_v23` write 0, `hani_office_affinity_v1` `personId`(`sua`, `taeo`) 불변, 새 `setInterval`/리스너 0, `createKidsVisits`·`companionActivity`·`kidsVisitLines` 원문 무수정.

## 2. 1F 구역 · 앵커 표 (`floor-1f-v2.webp`)

### HTML 이름표 4개 (`plates`)

| 구역 (`room`) | 라벨 | 영문 (`english`) | 좌표 (`x%`, `y%`, `width%`) | 동작 |
| --- | --- | --- | --- | --- |
| `convenience` | `HANI 24 편의점` | `HANI 24` | `14`, `49.5`, `11` | `<button>` 클릭 → `showView('ledger')` |
| `lobby` (`detail`) | `안내데스크` | `INFO DESK` | `40.5`, `24.5`, `8.5` | `<span>` 비클릭 |
| `lobby` | `로비` | `LOBBY` | `50`, `12.5`, `8.5` | `<span>` 비클릭 (기존 CI 오버라이드 없음) |
| `cafe` | `HANI Coffee` | `CAFE` | `94.5`, `49.5`, `8.5` | `<span>` 비클릭 (기존 카페 유지) |

### 주요 1F 앵커 (`52`개)

| 앵커 ID | 구역 | `art-map` 좌표 (`x%`, `y%`) | 용도 |
| --- | --- | --- | --- |
| `elevator_1f` / `stairs_1f` / `hall_1f` | 코어/복도 | `21.9, 27.8` / `9.6, 34` / `21.9, 40.4` | 승강기·계단·1F 복도 중심 |
| `convenience_browse` | `convenience` | `16.1, 79.2` | HANI 24 편의점 앞 스탠딩 (`furniture: standing interaction`) |
| `reception` / `approach_reception` | `lobby` | `49, 33.5` / `50.8, 46.8` | 유나 안내데스크 (평일 고정 `1f` 근무자 1인) |
| `ilbo_board` / `parcel_box` | `lobby` | `76.5, 27.5` / `83.5, 27.5` | 일보판 / 택배함 |
| `arrival_gate` / `approach_arrival_gate` | `lobby` | `50, 86.6` / `49.8, 62.5` | 정문 / 보안 게이트 북측 접근 |
| `client_booth_slot_1..4` / `junction_consult` | `consult` | `63.5..69.5, 38..43` / `74, 50.5` | 방문 전용 상담석 / 응대 호스트 입구(손님과 `211px` 이격) |
| `lobby-nw..se` / `coffee_counter` | `cafe` | `75..86.5, 38..50.5` / `83, 79.5` | 카페 테이블 좌석 / 카운터 |

### 1F 안전 동선 좌표 요약 (`residentStops`, `1672×941`)

- 청소(`resident_cleaner_1f`): `32.9%, 68%` (편의점·게이트 사이 열린 통로)
- 치즈·크림·밤(`cat`, `dog`): `44..48%, 74~76%` / `56..60%, 74~76%` (게이트 남측 중앙 홀)
- 모찌·보리(`rabbit`, `bori`): `68..70%, 72~76%` / `79.5..81%, 72~81%` (라운지 남측 및 카페 서측 복도)

## 3. 수아 · 채원 새 자리 (`2F 재무자산관리실`)

| 직원 | 새 앵커 ID | `2f` art 좌표 | 접근 앵커 | 비고 |
| --- | --- | --- | --- | --- |
| 수아 (`sua`) | `finance-row-spare` | `10.6%, 63.5%` | `approach_desk_sua` (`10.6, 60.38`), `side_desk_sua` (`10.6, 54.5`) | 기존 2F 빈 책상 1번, 모니터/캐릭터 소품 배치 |
| 채원 (`taeo`) | `finance-row-spare-east` | `40.5%, 63.5%` | `approach_desk_taeo` (`40.5, 60.38`), `side_desk_taeo` (`40.5, 54.5`) | 기존 2F 빈 책상 2번, 모니터/캐릭터 소품 배치 |

- 1F 고객·면접 방문 시(`10:00~17:00`) `reserveHosts`가 `['1f', '2f']` 호스트를 허용하며, `sua`/`taeo`가 2F 자리에서 `elevator_2f -> elevator_1f -> junction_consult`로 내려와 응대 후 복귀합니다.

## 4. 서윤이 볼 화면 (시간대 · 층 점검)

1. **평일 10:00 · 1F**: `floor-1f-v2.webp` 배경, 4개 이름표(HANI 24 편의점/안내데스크/로비/HANI Coffee), 편의점 클릭 시 가계부(`ledger`) 전환, HANI Coffee 비링크 유지, 유나·바리스타·퀸 액자·라면바 스팀(`coffee-desk`) 위치 정렬, 상담실 고객 도착 시 유나 또는 2F 수아/채원 응대 동선.
2. **평일 10:00 · 2F**: 수아(`finance-row-spare`)·채원(`finance-row-spare-east`) 착석, 기존 재무·라이프 6인과 겹침 없음.
3. **평일 22:00 · 1F (`회장님 active`)**: 야간 바리스타 전환 및 크림/치즈/모찌/보리 + 수현·수연이 편의점 진열대·게이트·카페 카운터·라운지 의자 위에 겹치지 않는지 확인(데스크톱 + 모바일 360px).
4. **주말 11:00 · 1F/2F**: 자유 루틴(편의점·카페·2F 팬트리) 및 `floor` 전환 동작 확인.

## 5. 깨질 것 같은 기존 시험

*(기존 시험·fixture·해시는 규칙상 미수정)*
- [`scripts/hani-office-v2-215.test.mjs`](../../scripts/hani-office-v2-215.test.mjs): 1F 앵커 수(`57` 고정), `business-west`/`east`, 2F `freeDesks` 2석 기대, 1F 구 `backgroundSha256` 및 3개 이름표 기준 assertion 실패 예상.
- [`scripts/hani-building-phase1.test.mjs`](../../scripts/hani-building-phase1.test.mjs): 1F(`57`)·2F(`74`) 앵커 수 및 Phase 1 기준선 대조 assertion 실패 예상.
- [`scripts/hani-building-phase2.test.mjs`](../../scripts/hani-building-phase2.test.mjs): `hani-building-phase2-source.cjs`의 `afterSha256` 역투영 해시 검사 및 Phase 2 기준 `canon.people`/`anchors` 동일성 assertion 실패 예상.
- [`scripts/hani-office-actions-221.test.mjs`](../../scripts/hani-office-actions-221.test.mjs): `office-actions-216.json`(무수정)과 수정된 `office-actions-221.json`의 `sua`/`taeo` `home`/`ambient-1f`/`ambient-2f` 정합성 비교 assertion 실패 예상.

> **미검증**: 이 작업 세션에서는 셸 도구 제한으로 `node --test` 및 브라우저 실측을 직접 실행하지 않았습니다. 서윤이 `node --test scripts/hani-building-phase3a.test.mjs` 및 실화면 확인을 진행합니다.

---

### 3줄 요약
1F 배경을 `floor-1f-v2.webp`로 교체하고 **HANI 24 편의점(가계부 연결)**·**안내데스크**·**로비**·**HANI Coffee** 4개 HTML 이름표와 새 앵커·가구 회피 안전 영역(`residentFurniture`, `furnitureBounds`)을 반영했습니다.
기업솔루션사업부 수아(`sua`)·채원(`taeo`)의 `home` 자리·일정·경로를 2F 빈 책상 2석(`finance-row-spare`, `finance-row-spare-east`)으로 이전하고, 1F 상담 부스를 1F·2F 호스트가 응대하는 방문형 동선으로 연결했습니다.
저장소·Cloud·타이머·수현/수연 장면(`createKidsVisits`/`companionActivity`/`kidsVisitLines`) 무변경 검증용 [`hani-building-phase3a.test.mjs`](../../scripts/hani-building-phase3a.test.mjs)를 작성했으며, 셸 미사용으로 실제 테스트 실행과 브라우저 검수는 서윤 단계에 넘깁니다.

---

## 2차

대상 실패 6건의 원인과 수정 내역입니다 (셸 제한으로 직접 실행 대신 코드·좌표·수치 대조로 검증함).

1. [`scripts/hani-building-phase3a.test.mjs:49`](../../scripts/hani-building-phase3a.test.mjs#L49) (`1F background`): `scene.getFloor('1f')`에는 `.art`가 없고 `.background`/`.production`만 있으며 `.art`는 `scene.floorRegistry.get('1f')`에 있고, `fallback` 마운트의 `loadArt=()=>false`가 이미지 로드 자체를 실패시켜 `floor.fallback`으로 떨어졌으므로 [`scripts/hani-building-phase3a.test.mjs`](../../scripts/hani-building-phase3a.test.mjs)에서 `floorRegistry.get('1f').art.background`, `getFloor('1f').background`/`.production`, `HaniOfficeV2Assets: null` + `loadArt=()=>true` 폴백을 검증하도록 수정했습니다.
2. [`scripts/hani-building-phase3a.test.mjs:72`](../../scripts/hani-building-phase3a.test.mjs#L72) (`plates.map` deepEqual): `vm` 컨텍스트에서 생성된 배열을 호스트 배열과 `assert.deepEqual`로 비교해 프로토타입 불일치가 발생했으므로 [`scripts/hani-building-phase3a.test.mjs`](../../scripts/hani-building-phase3a.test.mjs)에서 `plain(...)`으로 감싸 비교하도록 수정했습니다.
3. [`scripts/hani-building-phase3a.test.mjs:145`](../../scripts/hani-building-phase3a.test.mjs#L145) (`consultGuests` 및 2F 호스트): 1F 고객·호스트는 `visitPlan`(5F 전용)이 아닌 `blockPlan`(`outings`)에 기록되고 `seat`에는 `.room`/`.floor`가 없으며, 2F `door_finance` (`46, 65`) → `junction_finance` (`25, 57`) 직선이 `taeo`의 `finance-row-spare-east` (`40.5, 63.5`)와 5.6px 거리로 겹쳐 `blockedByHome`(< 24.01px)이 2F 재무실 출입을 차단했으므로 [`art-map-v1.json`](../../data/hani-building/art-map-v1.json)의 `door_finance`를 `(46, 57)`(좌석 열 북쪽 61.17px 이격)으로 옮기고 테스트가 `outings` 및 `scene.anchors.get(...)`을 조회하도록 수정했습니다.
4. [`scripts/hani-building-phase3a.test.mjs:161`](../../scripts/hani-building-phase3a.test.mjs#L161) (`1f` `anchorCount`): `scene.getFloor('1f')`에는 `anchorCount`가 없고 `scene.floorRegistry.get('1f')`에만 있으며 [`spatial-contract.json`](../../data/hani-building/spatial-contract.json)의 `1f`/`2f` 층 객체에도 `anchorCount`가 빠져 있었으므로 `1f: 52`, `2f: 80`을 추가하고 테스트가 `scene.floorRegistry.get('1f'|'2f').anchorCount`를 조회하도록 수정했습니다.
5. [`scripts/hani-building-phase3a.test.mjs:202`](../../scripts/hani-building-phase3a.test.mjs#L202) (`companionSafe('1f', [44, 74], true)`): `1f` 보안 게이트 박스 `[650, 485, 1000, 585]`의 하단 여유(`r[3] + 8 = 593`)가 `[44, 74]` 아이 히트박스 상단(`y - 104 = 592.34`)과 `0.66px` 겹쳐 `false`를 반환했으므로 [`art-map-v1.json`](../../data/hani-building/art-map-v1.json) `1f.furnitureBounds`와 [`hani-office-live.js`](../../hani-office-live.js#L3719) `residentFurniture['1f']`의 게이트 하단을 `580`으로 조정했습니다.
6. [`scripts/hani-building-phase2.test.mjs:70`](../../scripts/hani-building-phase2.test.mjs#L70) (`creative-lunch-cinema`): `taeo`의 `finance-row-spare-east` (`40.5, 63.5`) 배치로 `junction_finance <-> door_finance` 구간이 `blockedByHome`에 걸려 같은 방 `haru`의 `creative-lunch-cinema` 이동이 차단되었으므로(3번과 동일 원인), `door_finance`를 `(46, 57)`로 이동해 재무실 4인(`sua`·`haru`·`daon`·`taeo`) 외출 경로를 복구했습니다.

> **미검증**: 이 2차 작업에서도 셸 도구 제한으로 `node --test`는 직접 실행하지 못했습니다. 서윤이 `node --test scripts/hani-building-phase3a.test.mjs` 및 `hani-building-phase2.test.mjs`를 실행해 최종 확인합니다.
