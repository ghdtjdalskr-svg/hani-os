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

## 2차(시험 층)

- 2026-11-19 · 도연 / Codex. `hani/ieum-seat-2`, HEAD `386a880`, 고정 main `ad95b84`. 재시작 전 완료 로그(main194/현재183개)는 동일 Node·원본 확인 후 이어서 사용. 위 5절의 시험·구문 미실행 상태를 아래 결과로 갱신한다.
- 새 층: `scripts/hani-ieum-seat-source.cjs`, `hani-ieum-seat-preload.cjs`, `fixtures/ieum-seat-layer.json`, `hani-ieum-seat-layer.test.mjs`. 기존 `hani-release-300-source.cjs` 맨 앞에 연결 1줄만 추가. **자리 교체 → release-300 → audit-1 이하** 순서로 6개 owner의 정확한 main 바이트를 메모리에서 복원하며, 기존 본문·단언·hash·fixture는 보존했다.
- 전체 `scripts/*.test.mjs`를 각 폴더 cwd에서 `node scripts/<파일>`로 개별 순차 실행했다(Node `v24.20.0`).

| 기준 | 파일 수 | 종료 성공 / 실패 | Node PASS / FAIL / SKIP |
|---|---:|---:|---:|
| main `ad95b84` 독립 복사 | 276 | 169 / 107 | 1558 / 68 / 10 |
| 현재 자리 교체 + 시험 층 | 278 | 171 / 107 | 1567 / 68 / 10 |

- **신규 회귀0**, 기존276개 종료 코드·검사 수·결과 이름 변화0, 누락·중복0. 별도 script PASS 표식은 양쪽136개. 자리 교체 시험 **5/5**, 새 층 시험 **4/4**, syntax **11파일 PASS**.
- 실제 교체 데이터를 역투영 없이 검사: 216·221 액션표/평일·주말 **384스냅샷 정착 좌표 겹침0**, 직원 홈 경로 **40/40** 연결. 자리 교체 자체의 추가 버그 수정0.
- 지정 생성 JSON4개 원문 복원. 보호 경로31개·운영/데이터514개·기존 시험304개·fixture122개 바이트 보존. 저장·Cloud·schema 경로 변경0, 표시/cache `2.9.300` 유지(시험 도구 작업으로 버전 증가 N/A). 시험 부산물15개는 삭제 없이 로컬 증거 폴더로 옮겼다.
- 남은 위험: 기존107개 실패는 유지되어 전체 PASS는 아니다(브라우저 인자/의존성, `spawnSync git EPERM`, 기존 `renderChibiNote`·기준선 단언 등). 실제 브라우저 화면·운영 read-back은 미검증이며, 위 범위 외 그림·소개 문구도 그대로다. 원격 최신 main 조회는 네트워크 차단으로 미확인. commit·push·merge·배포·Notion은 수행하지 않았다.
- 근거: [전체 결과표](TEST-RESULTS.md), [대조 집계](test-summary.json), [원본 보존](preservation.json), [실제 자리 검사](runtime-check.json). 실행·집계·보존 도구는 이 폴더에, 원본 로그·독립 main·생성 부산물은 `.ai-budget-private/ieum-seat-2/`에 보존했다.

## 3차

- 2026-11-19~20 · 도연 / Codex, branch `hani/ieum-seat-2`, HEAD `386a880`, 고정 main `ad95b84`. Git 이력 선택기가 release commit `9f49286`만 인식하여 tooling merge `ad95b84`에서는 현재 299 투영 입력과 300 이력이 충돌했다.
- 새 바깥 어댑터 `scripts/hani-ieum-seat-reviewed-input.cjs`와 새 시험 `hani-ieum-seat-history.test.mjs` 추가. 기존 `hani-release-300-reviewed-input.cjs`의 require 연결 1줄만 교체했다. 고정 base·교체 commit의 부모·자리/metadata 소유 파일 9개 exact hash가 모두 맞을 때만 기존 release300 선택기로 넘긴다. Git object 원문과 하위 단언·hash·fixture는 보존했다.
- 최종 재검증: 기존 주요 6개 파일(brand-heroes/login/ocr/office-219/release-300/reviewed-release-baseline) 모두 PASS, 새 부정 시험 2/2 PASS. 전체 실행의 자리 시험 5/5·기존 층 4/4 PASS. JS 9파일·PowerShell 구문 PASS.
- **전체 통과 조건은 미충족이다.** 지정 `seoyun-runall.cjs`는 이 환경의 `spawnSync(node)` EPERM을 모두 timeout으로 분류했다(현재279/main276). 별도 PowerShell 실행으로 각 새 Node·cwd·90초 제한을 유지해 279개 전부 실행: **175 PASS / 98 FAIL / 6 timeout**. 제공 main PASS209개 중171개 PASS,35개 FAIL(34개 명시적 EPERM·1개 자식 종료상태 null),3개 timeout. 누락0. [전체 대조](comparison-3.json), [실행기 제한](runner-3-diagnostic.json).
- 성능: cafe 400ms 단언은 초기 두 번 PASS(전체 실행 최저 부재274/참석333ms), 후반 단독 재실행은 현재521ms·main557ms로 양쪽 FAIL. 시험의 legacy 입력6개가 main과 바이트까지 동일함을 확인했다. 실제 원본 교체 데이터/런타임 비교 중앙값은 부재 main591→교체531ms, 참석599→579ms로 자리 교체 특유의 저하는 관측하지 못했다. CPU·시스템 부하는 미계측이라 변동 원인은 단정하지 않는다. [측정](performance-3.json).
- `pets-bubble`, `residents`, `staff-chat`의 90초 timeout은 고정 main 복사본에서도 모두 재현됐다. 현재 전체 실행의 다른 timeout3개(bori-stroll/kids-weekday/obr14)는 제공 main에서도 timeout이다. [main 대조](seoyun-baseline-timing-3-shell.json). 기준 복사본2335파일은 지정 생성 JSON4개 외 Git blob 일치.
- 지정 생성 JSON4개 원본 복원, 기존 시험304·fixture122·보호 파일31·운영/데이터514개 바이트 보존. 저장·Cloud·schema·버전/cache 변경0. [보존 감사](preservation-3.json). commit·push·배포·Notion 미실행. 남은 행동은 자식 실행이 허용되는 환경에서 동일 지정 실행기로 최종 재검증하는 것이다. 원본 로그·생성 출력은 `.ai-budget-private/ieum-seat-3/`, 상세 [인수인계](../../docs/development-history/handoffs/2026-11-19-ieum-seat-3.md)에 보존했다.
