# 1층 카운터 NPC 교대(Shift Handover) 구현 보고서

## 1. 수정한 파일과 핵심 함수
- `hani-office-live.js`
  - `shiftHandoverPairs`: 편의점(`SCN-N01`: 다솜↔나래, 07:00/19:00), 안내데스크(`SCN-N02`: 소담↔하람, 09:00/18:00), 카페(`SCN-N03`: 이슬↔은하, 07:00/19:00) 설정 및 `<= 16`자 교대 대사 정의.
  - `shiftCurve(waypoints)`: 기존 `detourRun('1f', ...)`과 `compileCurve(...)`를 재사용해 1층 가구/장애물(`floorObstacles['1f']`)을 우회하는 곡선 경로 캐시.
  - `residentShiftHandover(person, day, wallSeconds, clock)`: 교대 창 `[T - 180s, T + 180s)` 동안 기존 `residentSeed`와 `easeRun`/`sampleCurve`/`distanceGait`로 `approach → face → talk → reaction → disperse` 5단계를 결정론적으로 계산. `reduced` 모드에서는 기존 시간표대로 즉시 교대.
  - `residentSnapshot(...)`: `person.hours` 체크 전 `!reduced` 분기에서 `residentShiftHandover`를 호출해 후임 조기 등장·접근·대화 및 전임 입구 도착 후 퇴장을 처리하고, 은하(`npc-barista-eunha`)의 `doze`('sitting')는 교대 창 외 야간 시간대에서 그대로 유지.
  - `updateResidents(now)`: 카운터 NPC가 `resident_post_*`에 있을 때만 `actor.dataset.post`를 유지하고, 로비 접근/퇴장 이동 중에는 임시 해제해 하반신 클리핑 없이 자연스럽게 걷도록 조정.

## 2. 사용한 1층 입구와 대기 지점 좌표 및 선택 이유
- **1층 입구**: `arrival_gate` (`[50, 86.6]`, `art-map-v4.json` 1F 정문 앵커)
  - 07:00/19:00 동시 교대(편의점 + 카페) 시 `arrival_gate` 겹침(`>= 30px`)을 막기 위해 편의점 후임은 `T - 180s`(전임 퇴장 `T + 6s`), 카페 후임은 `T - 170s`(전임 퇴장 `T + 18s`)로 시차를 분리.
- **대기 지점** (모두 `floorObstacles['1f']` 바깥이며 카운터 포스트와 `>= 42px` 이격):
  - `post_shift_wait_store`: `[31.8, 45.0]` — 편의점 포스트(`[20, 67.5]`)와 약 `290px` 거리. 편의점 문 앞 복도(`x=27.2%` 통로) 위쪽 안전한 위치이며 `resident_cat_lobby([33, 55])`와도 `>= 96px` 이격.
  - `post_shift_wait_reception`: `[45.5, 46.8]` — 안내데스크 포스트(`[50.19, 33.4]`)와 약 `144px` 거리. 데스크 전면(`floorObstacles` `[39,28,61,43]` 남쪽)에 위치해 좌우 대면이 명확하고 `approach_reception([50.8, 46.8])` 및 전임 퇴장 동선(`[52, 46.5]`)과 비충돌.
  - `post_shift_wait_cafe`: `[81.8, 78.5]` — 카페 포스트(`[92.823, 79.4899]`)와 약 `184px` 거리. 카페 카운터 앞 빈 바닥이며 `residentFurniture['1f']` 및 보리 정지/산책 동선과 `>= 45px` 이격.

## 3. 새로 작성한 테스트 및 검증 항목
- `scripts/hani-office-shift-handover.test.mjs`
  - `spatial-contract-v4.json` + `art-map-v4.json` + `sprites-v3/manifest-v3.json` 기반 `fixture`로 3개 카운터 6개 교대 시각(07:00, 09:00, 18:00, 19:00) 전체 검증.
  - `T - 200s`(현임 단독), `T - 60s`(양쪽 1층 존재, 거리 `>= 42px`, 마주보기, 대사), `T + 200s`(후임 단독) 스냅샷 및 렌더러 DOM(`f.visible()`) 검증.
  - 1초 단위 루프(`-200s..+200s`)로 5단계 `beat`, 모든 대사 `<= 16`자, 초당 이동 `<= 200px`, 배우 간 거리 `>= 30px`, `arrival_gate` 도달 후 퇴장, `floorObstacles['1f']` 비침범 확인.
  - 동일 시각 결정론, `reduced` 모션 즉시 전환, 은하 새벽 `doze`('sitting') 유지, `Math.random` 미사용 검증.
- **실행 여부 안내**: 현재 환경에 셸 도구가 없어 테스트 파일은 직접 실행하지 않았으며, 코드·좌표·규칙 정합성 검토까지 완료했습니다.

## 4. 기존 시험 및 남은 위험 / 주의사항
- **기존 소스 해시 핀 테스트 영향 (실패 예상)**:
  - `scripts/hani-office-residents.test.mjs`(L144, L287, L316, L375, L481, L485, L497, L532)와 `scripts/hani-office-residents-source.mjs` / `scripts/hani-office-chairman-patrol-278-source.mjs`는 `hani-office-live.js`의 이전 레이어 바이트를 역투영한 뒤 **고정된 SHA-256 해시**를 검증합니다.
  - 본 작업은 `hani-office-live.js`에 새 교대 로직을 추가하므로, 기존 delta fixture가 갱신되기 전까지 해당 SHA-256 단언이 있는 `hani-office-residents.test.mjs` 등의 레이어 역투영 테스트는 `only exact ... bytes accepted` 오류로 실패할 수 있습니다. (기존 테스트 assert는 지시에 따라 수정하지 않았습니다.)
- **비 v2 1F 아트 호환성**:
  - `residentShiftHandover`는 `residentSpot('resident_post_*')`가 유효할 때(`floor-1f-v2`)만 활성화되므로 `art-map-v1.json`을 쓰는 구형 픽스처 동작을 깨뜨리지 않습니다.
- **안내데스크 앞 스프라이트 높이 경계**:
  - `post_shift_wait_reception([45.5, 46.8])`은 보행 장애물(`floorObstacles['1f']`) 바깥이지만, 카운터 바로 앞이므로 `residentSafe(..., height=164)` 기준으로는 머리 상단이 데스크 픽셀 박스와 겹칩니다(기존 `approach_reception`과 동일).

## 5. 2차 수정 (서윤 팀장님 화면 검증 피드백 반영)

### 5-1. 바꾼 대기 지점 좌표 및 경로와 이유 (`hani-office-live.js` `shiftHandoverPairs`, `residentShiftHandover`)
모든 1차/2차 대기 지점은 `floorObstacles['1f']` 사각형 바깥이며, 기존 `occupied` 판정(반경 `90px` 이내에 교대 당사자 외 다른 직원·방문자·상주 인물이 있는 경우) 시 미리 정한 두 번째 지점(`waitAlt`)으로 전환합니다.

- **HANI 24 편의점 (`post: 'store'`, 포스트 `[20, 67.5]`)**:
  - **1차 대기 지점**: `[31.8, 45.0]`(포스트와 약 `290px`) → **`[16.0, 70.8]`**(포스트와 **`73.7px`**).
    - HANI 24 편의점 안 계산대(`[17,64,25,77]`) 왼쪽 바로 옆 손님 쪽 바닥이며, 진열대(`[12,52,21,68]`)·냉장고(`[6,52,12,72]`)·커피 테이블(`[3,72,15,82]`) 등 `floorObstacles['1f']`를 침범하지 않습니다.
  - **2차 대기 지점(occupied 시)**: **`[25.2, 69.5]`**(포스트와 **`89.0px`**).
    - `convenience_browse([16.1, 79.2])`에 직원이 서 있을 때(거리 `79.1px < 90px`) 계산대 오른쪽 입구 안쪽 바닥으로 비켜서며, `[17,64,25,77]`·`[24.5,46,26,63]`·`[28,58,30,95]`를 모두 피합니다.
  - **진입/교대 동선**: `enterCurve`가 편의점 문(`enterClear`: `[27.2, 56.5] → [27.2, 64]`, 1차 지점인 경우 계산대 앞 `[26.5, 78.5] → [16.0, 78.5]` 경유)을 통해 안쪽으로 들어가고, `postCurve`도 카운터 앞을 돌아 포스트로 교대 진입합니다.
  - *(참고)* `residentFurniture['1f']`의 `[0, 435, 455, 815]`(`0~27.2%`, `46.2~86.6%`)는 펫(`residentSafe`) 출입을 막기 위한 편의점 방 전체 경계이므로(직원 `convenience_browse`와 동일), 편의점 내부 포스트·대기 지점은 `residentSafe` 대신 `floorObstacles['1f']` 기준으로 장애물 회피를 검증합니다.

- **HANI Coffee 카페 (`post: 'cafe'`, 포스트 `[92.823, 79.4899]`)**:
  - **1차 대기 지점**: `[81.8, 78.5]`(포스트와 `184px`, 직원 방문 자리 `coffee_counter([83, 79.5])`와 인접) → **`[96.0, 84.3]`**(포스트와 **`69.8px`**).
    - 이슬 쪽 카운터 오른쪽 끝 전면 바닥이며, 직원 방문 자리(`coffee_counter`/`coffee_pickup`)와 `217~222px` 떨어져 겹치지 않고 `[87,48,100,84]`와 `[74,85,100,95]` 사이의 빈 바닥 통로에 위치합니다.
  - **2차 대기 지점(occupied 시)**: **`[89.5, 84.3]`**(포스트와 **`71.7px`**).
    - 카운터 왼쪽 앞 통로(`coffee_counter`와 `117.7px` 이격, `[87,48,100,84]`·`[74,85,100,95]` 바깥)로 전환됩니다.
  - **진입/교대 동선**: `enterClear` `[85.5, 84.2]`를 경유해 카운터 앞 통로로 들어가며, `postCurve`는 카운터 왼쪽 끝(`[86.5, 84.2] → [86.5, 79.5]`)을 돌아 카운터 뒤로 진입합니다.
  - *(참고)* `residentFurniture['1f']`의 `[1440, 555, 1672, 815]`(`86.1~100%`, `59.0~86.6%`) 역시 펫 제한용 카페 영역 전체 박스이므로 `floorObstacles['1f']` 기준으로 검증합니다.

- **안내데스크 (`post: 'reception'`, 포스트 `[50.19, 33.4]`)**:
  - **1차 대기 지점**: `[45.5, 46.8]` → **`[45.8, 49.0]`**(`y`를 `2.2%` 내려 데스크 전면과 머리 겹침 완화, 포스트와 `164.1px`).
  - **2차 대기 지점(occupied 시)**: **`[54.2, 49.0]`**(포스트와 `161.4px`, 1차 지점과 `140.4px` 이격).
  - 두 지점 모두 안내데스크 앞 로비 바닥(`floorObstacles['1f']` `[39,28,61,43]` 아래와 턴스타일 `[39.5/48.5/57.5, 51, ..., 61]` 위, `residentFurniture['1f']` 바깥)에 위치합니다.
  - *(기하 참고)* 안내데스크 장애물(`[39,28,61,43]`) 자체가 포스트(`y=33.4%`) 아래 `90.3px`까지 내려오고, 머리 겹침 해소를 위해 `y > 46.8%`로 더 내렸기 때문에 안내데스크 대기 지점과 포스트 거리는 `~161~164px`가 됩니다.

### 5-2. 말풍선 미표시 원인 및 수정 방법 (`residentShiftHandover`, `updateResidents`, `activateActor`)
- **원인**:
  1. `residentShiftHandover`가 약 30~41초 구간(`talk0`, `talk1`, `talk2`, `react`)마다 고정 `scene.key`를 1회만 발급하고 `updateResidents`는 `showBubble(..., 3000, true)`로 **3초만 표시**한 뒤 닫았기 때문에 대화 구간 대부분에서 말풍선이 꺼져 있었습니다.
  2. 19:00 동시 교대 시 편의점과 카페가 같은 `actorBubble`을 두고 경쟁할 때 한쪽이 닫힌 뒤 다른 쪽이 이어받더라도 짧은 3초 창이 지나면 다음 대사까지 30초 가까이 공백이 생겼습니다.
  3. `1F` 탭을 클릭할 때 `document` capture `pointerdown` → `activateActor(..., true)`가 말풍선이 이미 닫혀 있는 상태에서도 `closeBubble(true, true)`를 호출해 `lastBubbleTap = Date.now()`를 기록하므로, 층 이동 직후 5초간 `updateResidents`의 `Date.now() - lastBubbleTap >= 5000` 조건에 막혔습니다.
  4. 다른 층에서 `staffChats`가 진행 중일 때도 `!staffChats?.current()`가 `false`가 되어 1층 교대 말풍선을 차단했습니다.
- **수정**:
  - `residentShiftHandover`: 대화·반응 구간에서 `scene.key`에 서브 비트(`talkBeat`, 편의점/카페는 `8초` 주기에 카페 `+4초` 시차, 안내데스크는 `5초` 주기)를 포함시켜 기존 `state.scene` → `updateResidents` → `showBubble` 경로 그대로 교대 창 전체 동안 두 카운터가 번갈아 말풍선을 띄우도록 개선했습니다(새 레이어·저장·난수 없음).
  - `updateResidents`: `state.scene.handover`일 때 타 층 `staffChats`에는 막히지 않게 하고(`staffChats.current().staffChat?.floor === activeFloor`일 때만 양보), 표시 시간을 `3600ms`로 조정했습니다.
  - `activateActor`: 이미 말풍선·방문·대화가 모두 닫혀 있을 때는 `pointerdown`에서 `closeBubble(true, true)`를 호출하지 않아 `1F` 탭 전환 클릭이 5초 억제(`lastBubbleTap`)를 유발하지 않도록 수정했습니다.

### 5-3. 시험 속도 개선 및 추가 검증 (`scripts/hani-office-shift-handover.test.mjs`)
- 기존 `places` 로딩(L6~16)과 기존 assert는 그대로 유지했습니다.
- 추적 루프를 교대 창(`-180s..+40s`) 내로 한정해 접근/퇴장(`<-164s`, `>=4s`)은 1초, 중간 대화 구간(`-164s..+4s`)은 2초 간격으로 축소하고, 루프 내 `scheduler.snapshot()`은 30초 버킷 캐시 및 `residents.snapshot(..., false)`를 사용해 실행 시간을 대폭 단축했습니다.
- **추가 단언**:
  - 6개 교대 모두 기본 대기 지점·`occupied` 시 두 번째 대기 지점이 `floorObstacles['1f']` 바깥이고 포스트 거리 조건(편의점·카페 `60~100px`, 안내데스크 `60~175px` 및 `y > 46.8%`)을 만족하는지 검증.
  - `18:58:10` / `18:58:40` / `18:59:10`에 `1F`에서 `ms <= 1000` 타이머만 실행해 기존 `actorBubble` 경로로 교대 말풍선이 실제로 표시(`hidden === false`)되는지 검증.
- **실행 여부**: 현재 환경에 셸 도구가 없어 테스트는 직접 실행하지 못했습니다.
