# 이음·유나 자리 교체 작업 보고서

## 1. 변경 파일 (데이터 vs 런타임 분리)

### 데이터 파일
- [spatial-contract.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/data/hani-building/spatial-contract.json)
  - `canon.anchors` 수(`326`) 유지(추가·삭제 없음).
  - `4f.rooms.secretariat` 라벨: `"회장 비서실 · 가은/MUSE · 유나"` → `"회장 비서실 · 가은/MUSE · 이음"`.
  - `anchors.desk_yuna`: `label: "이음 · 사원"`, `occupant: "ieum"`, `rendererSeat.owner: "ieum"`으로 변경 (`approach_desk_yuna`, `side_desk_yuna` 라벨도 `이음`으로 변경).
  - `anchors.reception`: `label: "안내데스크 · 유나 사원"`, `occupant: "yuna"`, `rendererSeat.owner: "yuna"`로 변경 (`approach_reception` 라벨도 `"접근 · 안내데스크 · 유나 사원"`으로 변경).
  - `canon.people`: `yuna.homeAnchor`/`workAnchor` → `"reception"`, `ieum.homeAnchor`/`workAnchor` → `"desk_yuna"`. (`rendererIntegration`의 과거 v2.1.5 `sourceSeatMaps`/`planSeatMaps`는 런타임 미사용 스냅샷이므로 유지).
- [office-places.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/data/hani-building/office-places.json)
  - `desk_ieum`, `side_desk_ieum`, `approach_desk_ieum` 위치(4F `hani_office`)와 간선 유지, `runtimeAssignable` 등 새 속성 추가 없음.
  - `desk_ieum`을 `label: "빈 자리"`, `occupant: null`, `rendererSeat.owner: null`로 비움 (`side_desk_ieum`: `"측면 접근 · 빈 자리"`, `approach_desk_ieum`: `"접근 · 빈 자리"`).
  - `assignSeats` 판단: 빈 `desk_ieum`은 `zone: "desk"`, `owner: null`이므로 `assignSeats('4f', ...)` 호출 시 다른 직원이 여유석으로 앉을 수 있으나, 일상 `snapshot`은 각자 `homeAt`을 쓰므로 문제없고 여유석 활용도 OK.
- [art-map-v1.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/data/hani-building/art-map-v1.json)
  - `4f.homeFurniture.desk_yuna`에 `seatNote: "회장 비서실 · 동쪽 책상 · 이음 사원"` 추가.
  - `4f.homeFurniture.desk_ieum.seatNote`: `"전략기획실 · 하니 전무님 옆 · 오른쪽 기존 의자"` → `"전략기획실 · 하니 전무님 옆 · 빈 자리 (여유석)"` (CRLF 유지).
  - `4f.deskProps`의 `yuna-217.webp`는 런타임 `DESK_PROP_ART.yuna` 및 4F 책상 좌표에 묶여 있어 유지.
- [office-actions-216.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/assets/data/office-actions-216.json)
  - `people`: `yuna.home` → `1f/lobby/reception`, `ieum.home` → `4f/secretariat/desk_yuna`.
  - `base-work`, `base-read`, `base-phone`, `base-organize`, `base-think`(actions 및 families)의 유나·이음 `places` 갱신.
  - `base-stretch`의 유나 슬롯 `side_desk_yuna` → `1f/lobby/approach_reception`.
  - `base-lobby-umbrella`(수아)의 `reception` → `approach_reception`(소유자 충돌 회피).
  - 유나 전용/관련 액션(`sig-yuna-2/3/4`, `base-desk-note`, `scene-paper-delivery` 및 `routeByPerson`, `scene-secretary-tabs`)의 `desk_yuna` → `1f/lobby/reception`.
- [office-actions-221.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/assets/data/office-actions-221.json)
  - 위 `216` 동일 항목 반영.
  - `ambient-4f`(`night-exec-starlight`, `night-exec-page`, `night-exec-connection` 및 family `ambient-4f.parent`): 참여자·위치를 `yuna` → `ieum`(`4f/secretariat/desk_yuna`)로 교체.
  - `night-lobby-note/story/lights`, `night-store-bag`, `night-stretch-yawn`, `night-sofa-nap`: 유나 기준 `places`를 `1f/lobby/reception`으로 갱신.
  - `night-ramen`, `night-coffee-chat`: 유나 `room`을 `lobby`로 정리.
  - `night-window-view`: 유나를 `4f/window_4f_1` → `1f/window_1f_1`로 변경.

### 런타임 파일
- [hani-office-live.js](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/hani-office-live.js)
  - 4275줄 `eventLines.cheer.ieum`의 두 번째 문장만 최소 수정(파일 전체 재작성 없음, 기존 CRLF/LF 유지).

### 테스트 파일 (신규 작성)
- [hani-ieum-seat.test.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-ieum-seat.test.mjs)
  - 새 자리(`ieum`=`desk_yuna`, `yuna`=`reception`), 326 anchor 수 유지, `desk_ieum` 빈 자리(새 속성 없음), 거주자·좌표·경로·스케줄러 스냅샷 중복 없음, `office-actions-216/221` 정합성, VM 배열 `[...x]` 비교를 검증하도록 재작성.

---

## 2. `displacedHomesById` 저녁/야간 이동 판단

- [hani-office-live.js](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/hani-office-live.js#L529)의 `displacedHomesById`(`18:00~07:00` 동안 `yuna`→`lobby-nw`, `minji`→`lobby-ne`)는 **수정하지 않고 유지**함 (`minji`도 미변경).
- 근거:
  - 유나의 기본 자리가 `1f lobby`의 `reception`(서서 응대하는 안내대)으로 옮겨진 뒤에도, 일과 후 저녁/야간(18~07시)에는 안내대 카운터를 벗어나 같은 1F 로비 소파(`lobby-nw`)로 이동해 `minji`(`lobby-ne`)와 나란히 앉는 편이 `night-sofa-nap`("잠깐 눈 붙이기"), `lounge` 상태 대사(`"라운지에서 야근 이야기 중"` / `"라운지에서 조용히 쉬는 중"`), 저녁 시간대 배달 기사(`visitor-rider`, `17:30~20:00`, target=`reception`) 동선과 자연스럽게 맞물림.
  - 같은 `1f` 내부 이동이므로 층별 재실(`ambient-1f`, `lateWorkers`)도 일관되게 유지됨.

---

## 3. 바뀐 대사 전후

- [hani-office-live.js](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/hani-office-live.js#L4275) (`eventLines.cheer.ieum`)
  - 전: `"하니 전무님 옆에서 열심히 배울게요."`
  - 후: `"4층 비서실 자리에서 열심히 배울게요."`
- `hani-office-live.js` 내 `yuna` 대사(`roleActions`, `actionPool`, `staffChatLines` `chat-05`/`chat-24`/`chat-34`/`chat-35`, `chairmanVoice`, `eventLines`)에는 `"4층"`/`"비서실"`/`"회장님 옆"` 고정 표현이 없음(`chat-24`는 이미 `"1층 방문객 접수"` 기준).
- 참고(범위 외 미수정): [office-tap-lines-v1.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/assets/data/office-tap-lines-v1.json#L4)(`"하니 전무님 옆에서 차근차근 배울게요."`), [office-drama-v1.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/assets/data/office-drama-v1.json#L10)(`"4층 안내 데스크"`), `hani-main.js` / `hani-character-archive-data.js`(`"하니 전무님 옆"`)에는 이전 소개 문구가 남아 있음.

---

## 4. 영향 받는 기존 `scripts/` 테스트 목록 (미수정)

아래 기존 테스트·픽스처는 이전 자리(`yuna`=`desk_yuna` 4F, `ieum`=`desk_ieum`, `reception` `owner: null`) 또는 고정 파일 해시를 검증하므로 그대로 두었음:
- [hani-office-v2-215.test.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-office-v2-215.test.mjs): `assertOnboardedCanon()`, `yuna: 'secretariat'`, `desk_yuna` 가구/prop(`yuna-217.webp`), `reception` 비점유 가정.
- [hani-office-onboarding-232-assertions.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-office-onboarding-232-assertions.mjs): `spatial-contract.json` SHA-256 및 326 anchor 원문 일치 단언.
- [hani-join-ieum.test.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-join-ieum.test.mjs): `ieum`=`desk_ieum` 홈, `join-ieum-delta.json` exact-inverse 검증.
- [hani-join-ieum.browser.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-join-ieum.browser.mjs): `ieum` 4F(`desk_ieum` 기준) 브라우저 검증.
- [hani-office-actions-216.test.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-office-actions-216.test.mjs): `office-actions-216.json`의 `runtimeTable(catalog)` 원문 일치 및 `assertOnboardedCanon()` 검증.
- [hani-office-actions-221.test.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-office-actions-221.test.mjs): `office-actions-221.json`의 `nightTable(216)` 원문 일치·`216` 동일성 검증.
- [hani-office-actions-216-data.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-office-actions-216-data.mjs), [hani-office-actions-221-data.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-office-actions-221-data.mjs): `216`/`221` 생성기.
- [hani-office-219.test.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-office-219.test.mjs): `spatial-contract.json`, `art-map-v1.json`, `office-actions-216.json`, `hani-office-live.js`의 고정 릴리스 해시·좌표 비교.
- [hani-office-companion-homes.test.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-office-companion-homes.test.mjs) 및 연쇄 source 역투영 스크립트(`hani-office-bori-stroll-source.mjs`, `hani-office-chairman-patrol-278-source.mjs`, `hani-office-companions-276-source.mjs`, `hani-office-affinity-274-source.mjs`, `hani-seoyun-m9-source.cjs`): `hani-office-live.js` 바이트 SHA-256 핀.
- 공용 투영/픽스처: [hani-office-v2-fixture.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-office-v2-fixture.mjs), [hani-office-lively-fixture.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-office-lively-fixture.mjs), [hani-join-ieum-source.cjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-join-ieum-source.cjs), [hani-join-ieum-preload.cjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-join-ieum-preload.cjs), [hani-office-tlayout-fixture.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ieumseat/scripts/hani-office-tlayout-fixture.mjs).

---

## 5. 막힌 것 / 미검증 항목

- **테스트·구문 검사 미실행**: 셸 명령을 사용할 수 없는 조건으로 인해 `node --test scripts/hani-ieum-seat.test.mjs`, JSON 유효성 검사, `hani-office-live.js` 문법 검사 및 실제 브라우저 화면 확인을 실행하지 못함. 작업 완료 후 별도 `node --test scripts/hani-ieum-seat.test.mjs` 실행 확인 필요.
- **범위 외 참고 항목**: `art-map-v1.json`의 `4f.deskProps` (`yuna-217.webp`가 `desk_yuna`에 계속 표시됨), `office-tap-lines-v1.json`(4줄 `ieum.morning`), `office-drama-v1.json`(10줄), `hani-main.js` / `hani-character-archive-data.js`의 `"하니 전무님 옆"` 소개 문구는 이번 작업 범위에 포함하지 않아 그대로 남아 있음.
