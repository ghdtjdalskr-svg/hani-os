# 대공사 Phase 1(층 등록부 기초 공사) 사전 검수 보고서 (유리 Pre-QA)

- **검수 대상**: `artifacts/building-phase1/review-src/`
  - [hani-office-live.js.before](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/floor5art/artifacts/building-phase1/review-src/hani-office-live.js.before) / [hani-office-live.js.after](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/floor5art/artifacts/building-phase1/review-src/hani-office-live.js.after)
  - [hani-office-live.css.before](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/floor5art/artifacts/building-phase1/review-src/hani-office-live.css.before) / [hani-office-live.css.after](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/floor5art/artifacts/building-phase1/review-src/hani-office-live.css.after)
  - [REPORT.md](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/floor5art/artifacts/building-phase1/review-src/REPORT.md)
- **검수 방식**: 정적 소스 대조(셸·Git·브라우저 미사용, 운영 파일 수정 없음)

---

## 1. 핵심 점검 항목별 결과

### 1) 326 고정 검사 → `validateSpatial` 전환
- **현재 데이터 호환**: `floorDefaults`의 층별 `anchorCount` 합계가 `50(5f) + 81(4f) + 64(3f) + 74(2f) + 57(1f) = 326`으로 기존 326개와 일치한다(`hani-office-live.js.after` 5~11행). `validateSpatial(30~57행)`은 기존 검사(`contractVersion`, `326`, `art.anchors[a.id]`)에 더해 층 순서(`order`) 유한·중복 검사, `art.anchors` 여분 키(전단사) 검사, 층별 앵커 수 일치, `elevator`/`stairs` 인접층 왕복 연결, `hallAnchor`/`elevatorAnchor`/`stairsAnchor` 존재, `rendererSeat` 차단 포함 BFS 도달 가능성, `people[].homeAnchor` 존재까지 검증한다.
- **오류 데이터 시 동작(경고·fallback·빈 화면 위험)**:
  - 앵커 누락·중복·`art` 불일치 시 `validateSpatial`이 `false`를 반환하고(36~38, 56행), 70행에서 `assets`가 `null`로 유지된 채 **콘솔 경고(`console.warn`/`error`) 없이 조용히 옛 4층 화면(`legacyFloors` 1F~4F, `legacySeatMaps`, `legacySprite`)으로 fallback**된다.
  - `assets === null` 상태에서도 `floorRegistry`가 `floorDefaults`로 생성되므로 런타임 크래시로 화면이 비지는 않는다. **단, fallback 시 `floorRegistry.floors`는 5개인데 `legacyFloors` 탭 버튼은 4개(`4f~1f`)만 생성되어, CSS `--hani-floor-cols`가 `5`로 설정되면서(4087행) 데스크톱 탭 바 오른쪽 1칸이 비는 불일치**가 있다.
  - 또한 `buildFloorRegistry`가 `defaultFloorId: '4f'`를 고정 반환하고(27행) `validateSpatial`은 `'4f'` 존재 여부를 검증하지 않아, 향후 `'4f'`가 없는 데이터가 들어오면 `getFloor('4f')`가 `undefined`가 되어 화면 렌더링이 실패할 수 있다.

### 2) 층 등록부 도입 및 잔존 하드코딩
- **전환 완료**: `validDramaBank`의 `/^[1-5]f$/` → `floorRegistry.hasFloor(row.floor)`(141행), `officeBackground`의 `floor.id === '5f'` 제거(115행), `FLOOR_ART` → `floorDefaults` 통합(5~11행), `rooms`/`plates`/`maxVisible`/`elevatorAnchor`/`foregroundMasks` 조회 등록부 이관(579, 2107, 2508, 3663, 4250, 4551, 4565, 4577, 4611, 4817행), CSS `repeat(5,...)` → `repeat(var(--hani-floor-cols,5),...)`, `:last-child` → `:nth-child(odd):last-child`, `[data-floor="3f"]` → `[data-foreground="floor"]`(`hani-office-live.css.after` 42, 118, 237행). `parseInt(floor)`는 본 파일 내 존재하지 않음.
- **남은 하드코딩 / 주의 지점**:
  1. `hani-office-live.js.after` 1551행 `withinCap`: `f.charCodeAt(0) - 48` 비트마스크 사용. `'1f'..'5f'`는 안전하나 Phase 2에서 `'creative'`·`'rooftop'` 같은 영문 시작 ID를 쓰면 비트 시프트가 32비트 래핑되어 기존 층(`'2f'` 등)과 캐시 키 충돌 위험이 있다.
  2. 27행 `defaultFloorId: '4f'` 고정.
  3. 21행 `anchorCount: f.anchorCount ?? base.anchorCount ?? counts.get(f.id) ?? 0`: Phase 2에서 새 층 JSON에 `anchorCount`를 누락하면 실제 개수 `counts.get(f.id)`가 그대로 들어가 38행 개수 검사가 무력화됨.
  4. 2110행 `destination.floor.toUpperCase()` (`code` 미사용), 2127행 `patrol` 문구 맵 `({'3f':..., '1f':..., '5f':..., '2f':...})[state.floor]` (미등록 층 순찰 시 `undefined` → 2226행 `shortLine`에서 `TypeError` 가능).
  5. 의도적 도메인/장소/UI 고정(Phase 2+ 검토 대상): `1f` 로비/모바일 화면 예약/출퇴근/안내(`577, 585, 588, 652, 1279, 1310, 1314, 1326, 1640, 1667, 1669, 1688, 1715, 1729, 1885, 1888, 1998, 2242`), `2f` 회의실/배달 상한(`2040, 4635, 4858`), `4f` 회장실·그리팅·회의(`606, 2166, 4635`), 상주 NPC/반려동물 시간표·배치·배제 영역(`2517~2525, 3253, 3374, 3384~3385, 3629~3659`), 1F 퀸/바리스타/소품(`4275, 4299, 4337~4356`).

### 3) 100ms 루프 성능 · 새 타이머 · 리스너 · 저장 접근
- **100ms 루프(`4867~4898행`)**: 새로 추가된 무거운 계산 없음. 오히려 `updateAtmosphere`의 `floors.find(...)`가 `getFloor(activeFloor)` `Map` 조회(4551행)로, `residentSafe`의 `canon.floors.find(...)`가 `floorRegistry.get(floorId)` `Map` 조회(3663행)로 바뀌어 탐색 비용이 줄었다.
- **타이머·리스너·저장**: 신규 `setTimeout`/`setInterval`, 신규 `addEventListener`/Observer, 신규 `localStorage`/`sessionStorage`/`hani_os_life_v23` 접근 **0건**.

### 4) 수현·수연 원문 보존
- `kidsVisitLines`(`.before` 2515~3191행 vs `.after` 2565~3241행), `createKidsVisits`(`.before` 3194~3288행 vs `.after` 3244~3338행), `companionActivity`(`.before` 3363~3442행 vs `.after` 3413~3492행) 모두 정확히 +50행 오프셋으로 **원문 100% 동일 보존** 확인.

### 5) 줄바꿈·인코딩 손상 및 큰 덩어리 재작성 흔적
- 한글 대사·이모지·주석의 인코딩 깨짐 없음. 기존 파일에 혼재하던 일부 CRLF 구간(`staffChatLines`, `barista`, 일부 CSS 규칙) 외에 Phase 1 변경으로 추가된 줄바꿈 손상 없음.
- CSS는 349행 중 정확히 3줄만 최소 치환, JS는 4851행 → 4902행(+51행)으로 등록부·검증 헬퍼 추가 외 모두 1~3줄 단위 최소 치환이며 큰 덩어리 재작성 흔적 없음.

---

## 2. 발견 사항 표

| 심각도 | 위치(근거 줄) | 발견 내용 | 제안 |
| --- | --- | --- | --- |
| 중간 | `hani-office-live.js.after` 30~57, 70~71행 | `validateSpatial` 실패 시 `console.warn` 등 경고 로그 없이 조용히 `legacyFloors`(1~4층)로 fallback됨 | `validateSpatial` 실패 지점 또는 70행 `else`에서 `console.warn` 1회 출력해 데이터 회귀를 즉시 인지할 수 있게 보강 |
| 중간 | `hani-office-live.js.after` 281, 331~332, 4087, 4583행 | `assets` 실패 fallback 시 `floorRegistry.floors`는 5층(`floorDefaults`), `building.floors`(`legacyFloors`)는 4층이라 `--hani-floor-cols`가 `5`로 잡혀 4버튼·5열 빈 칸 발생 | 4087행에서 `building.floors.length`를 사용하거나 fallback 시 `floorRegistry`와 탭 목록 기준 일치 |
| 중간 | `hani-office-live.js.after` 1551행 | `withinCap` 캐시 키가 `f.charCodeAt(0) - 48` 비트마스크 사용. Phase 2에서 `'creative'`·`'rooftop'` 등 영문 ID 추가 시 `'2f'` 등과 비트 충돌 가능 | `floorRegistry.order(f)` 기반 시프트 또는 `e.floors.slice().sort().join(',')` 문자열 키로 교체 |
| 낮음 | `hani-office-live.js.after` 27, 4371, 4551, 4642행 | `defaultFloorId: '4f'` 하드코딩 및 `validateSpatial`의 기본 층 존재 미검증으로 `'4f'` 없는 데이터 유입 시 `TypeError` 위험 | `validateSpatial`에 `registry.hasFloor('4f')` 추가 또는 `defaultFloorId`를 `rows.find(f=>f.id==='4f')?.id \|\| rows[0]?.id`로 안전 fallback |
| 낮음 | `hani-office-live.js.after` 21, 38행 | `anchorCount`가 `canon.floors`와 `floorDefaults` 둘 다에 없으면 `counts.get(f.id)`로 자체 대입되어 Phase 2 신규 층의 앵커 개수 검사가 무력화됨 | `f.anchorCount ?? base.anchorCount`만 허용해 `anchorCount` 미기재 신규 층은 검증 실패 처리 |
| 낮음 | `hani-office-live.js.after` 2110, 2127행 | 이동 문구에 `destination.floor.toUpperCase()` 사용, 순찰 문구 맵이 `'1f','2f','3f','5f'` 고정(미등록 층 순찰 시 `undefined` → 2226행 `TypeError`) | `floorRegistry.get(destination.floor)?.code` 사용 및 `patrol` 문구 기본값(`floorRegistry.get(state.floor)?.label` 등) 추가 |
| 낮음 | `REPORT.md` 19, 25, 29행 | Edge `EPERM`으로 390/1440px 실화면·overflow 미검증, cold 첫날 계획 성능 gate(>400ms, 기존 입력 포함) 미통과 상태 | 정상 환경에서 390/1440px 픽셀/overflow 및 cold 성능 검증 후 배포 열차 탑승 |

---

## 3. 한 줄 판정 & 회장님용 요약

- **배포해도 되는가 (한 줄 판정)**: **보류 (Phase 2 착수는 조건부 PASS, 현 상태 단독 운영 배포는 비권장)** — 현재 5층 동작·100ms 루프·수현·수연 원문은 안전하게 보존됐으나, 메타데이터 오류 시 무경고 fallback 및 5열/4탭 불일치·Phase 2 확장 함정 보완과 미검증인 390/1440px 실화면 확인 후 배포해야 합니다.

### 회장님용 3줄 요약
1. 층 등록부 기초 공사는 기존 5층 화면·100ms 루프·수현·수연 대사를 훼손하지 않고 깔끔하게 정리됐으며, 새 타이머나 저장 접근도 없습니다.
2. 다만 데이터 오류 시 콘솔 경고 없이 옛 4층 화면(5열 칸에 4탭)으로 조용히 내려가는 점과, 다음 6층(`creative` 등) 추가 시 캐시 키가 겹칠 수 있는 부분은 보완이 필요합니다.
3. 브라우저 실화면(390/1440px) 확인이 환경 제한으로 아직 남아 있어, 위 2건 보완과 실화면 검증을 마친 뒤 배포 열차에 태우는 것이 안전합니다.
