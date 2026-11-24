# HANI 빌딩 Phase 4 행동 엔진 설계서 v2

- **문서 상태**: Phase 4 설계 확정 기준본 (`2.9.308 ~ 2.9.315` 코드 반영판, `v1` 후속 개정)
- **작성자**: 세린 연구원 (Gemini · AI플랫폼개발실)
- **최우선 원칙 (`AGENTS.md`)**: **데이터 보존 > 기능 안정성 > 입력 편의 > 조회/시각화 > 디자인**
- **기준 코드 및 정본 문서**:
  - 런타임·스타일: `hani-office-live.js`, `hani-office-live.css`
  - 공간·아트·행동 데이터: `data/hani-building/spatial-contract-v3.json`, `data/hani-building/art-map-v3.json`, `data/hani-building/office-places-v3.json`, `assets/data/office-actions-315.json`, `docs/drafts/staff-chats-v1.json`, `docs/drafts/building-story-pack-v1.json`
  - 기획·인물 기준: `docs/design/office-behavior-engine-v1.md`, `docs/design/building-hani-review-20261123.md`, `docs/drafts/character-bible-v1.md`, `docs/design/building-master-plan-v2.md`, `docs/design/building-creative-floor-v1.md`, `docs/design/building-museum-floor-v1.md`, `docs/design/chairman-control-v1.md`
  - 시험 하네스: `scripts/hani-building-phase3a.test.mjs`, `scripts/hani-building-206-engine.test.mjs`, `scripts/hani-office-v2-fixture.mjs`

---

## 목차

1. [v1과 지금 코드(`2.9.308~2.9.315`) 차이 대조표](#1-v1과-지금-코드2930829315-차이-대조표)
2. [목표 구조 (통합 엔진 & 카운터 NPC 편입)](#2-목표-구조-통합-엔진--카운터-npc-편입)
3. [성격별 행동 표 (핵심)](#3-성격별-행동-표-핵심)
4. [관계 희귀 장면 목록 (15개)](#4-관계-희귀-장면-목록-15개)
5. [구현 조각 순서 (4-1 ~ 4-6)](#5-구현-조각-순서-4-1--4-6)
6. [7일 시뮬레이션 시험 설계](#6-7일-시뮬레이션-시험-설계)
7. [지키는 것 (불변 원칙)](#7-지키는-것-불변-원칙)
8. [위험 표 & 이번에 안 하는 것](#8-위험-표--이번에-안-하는-것)
9. [맨 끝 요약](#9-맨-끝-요약)

---

## 1. v1과 지금 코드(`2.9.308~2.9.315`) 차이 대조표

`office-behavior-engine-v1.md`는 `2.9.308` 이전(`floor5art`) 기준으로 작성되었다. 현재 `p4` 저장소(`2.9.315`)에는 `FloorRegistry`, `5F 라이프·크리에이티브`(`creative`), `1F` 개편(`floor-1f-v2.webp`), 수아·채원 `2F` 이동, 유나 `4F` 사무실 좌석 이동과 이음 편입, `post` 기반 카운터 NPC 6명, 거리 기반 보행(`distanceGait`/`petEase`/`officeDepartureAt`) 등이 이미 반영되었다. 아래 표는 `hani-office-live.js` 실제 코드 기준으로 **이미 해결된 항목**과 **여전히 미해결인 항목**을 정확히 구분한다.

| v1 항목 / 원인 | 지금 코드 상태 | 실제 코드 근거 (`hani-office-live.js` 등) | Phase 4 잔여 과제 |
|---|---|---|---|
| **0. 층 구조 및 공간 계약 검증** (v1: 5F 하드코딩 `326` 잔존) | **해결됨 (`2.9.308~315`)** | `buildFloorRegistry`와 `floorDefaults`가 `{id:'creative', order:5, code:'5F', label:'5F 라이프·크리에이티브'}`와 `{id:'5f', order:6, code:'6F', label:'6F 옥상'}`을 동적 등록. `checkSpatial`은 `canon?.contractVersion==='spatial-216-v1'` 아래 `registry.floors.reduce((n,f)=>n+f.anchorCount,0)===ids.size`와 인접 층 `elevator`/`stairs` 도달성만 검증(고정 숫자 `326` 제거 완료). | 4-5에서 `6F 박물관` 삽입 시 `creative(5) → museum(6) → 5f(7F 옥상, order:7)`로 레지스트리 순서만 승격 |
| **0-1. 1F 개편·좌석 재편·카운터 NPC** (`2.9.315` 신규 반영) | **부분 구현 (통합 원장 미연결)** | `spatial-contract-v3.json` 기준 `1f` 52 앵커(`floor-1f-v2.webp`, `convenience-1f` 클릭 위임), `sua`/`taeo`의 `2f`(`finance-row-spare`/`-east`) 배치, `yuna`의 `4f` `desk_yuna_east` 이동, `ieum`의 `desk_yuna` 편입, `office-actions-315.json` 21명 등록(`daon`·`yoonseul` 포함). `residentPeople`에 `post` 카운터 NPC 6명(`npc-clerk-day`, `npc-clerk-night`, `npc-guide`, `npc-desk-night`, `npc-barista-iseul`, `npc-barista-eunha`)과 `residentPosts`(`resident_post_store`, `resident_post_reception`, `resident_post_cafe`), CSS `--post-cut` `clip-path` 반영. | 카운터 NPC와 일반 직원·배회 주민·동행이 분리된 엔진에서 돌아 교대/손님 접점 충돌 가능성이 남음 → **통합 원장 편입 필요** |
| **원인 1. 전 층 최소 거리(42px) & 복도 차선/대기열 부재** | **미해결 (1F 편중 + 저간격)** | `screenFloor(e)`가 `e.resources.some(id=>anchors.get(id).floor==='1f')`, `screenHomeClear`가 `if(seat.anchor===home\|\|anchors.get(seat.anchor).floor!=='1f')return true;`로 **여전히 1F만 화면 겹침 방어**. `stationaryStops`도 `floor==='1f'` 한정. `clearSweep`은 `const limit=optionalCrossing&&p.walking&&q.walking?30:p.walking\|\|q.walking?24:20;`로 42 art-px 미달이며 `residentPeople`·`companionPeople` 미포함. `visitPlan`은 `creative`의 `visitRules`만 예약하고, `travelOrder`의 `Math.hypot(...)<24.01`는 동행 내부만 보정. | 전 층(`1f`~`creative`~`5f`) 42 art-px 최소 간격, 복도 2차선(`±14px`), 출입구/승강기 FIFO 대기열, 동적 비켜서기 적용 |
| **원인 2. 동행·주민 순간이동 폴백 & 강제 스냅** | **미해결** | `slewCompanion` 말미에 경로 차단 시 `return {position:to,moved:false,dx};` **즉시 순간이동** 잔존. `residentSnapshot`은 `holdStart` 후 `2500`ms가 지나면 `fallback=alternatives.find(a=>free(a.visual))` 즉시 점프 또는 `return []` 소멸. `companionSnapshot`의 `kid-suyeon`은 `chair.walking?-1:1`로 보행 시작 즉시 앞뒤 반전. `createKidsVisits().update`는 `if(active&&(active.floor!==chair.floor\|\|chair.walking)){active=null;...}`로 방문 강제 중단. `selectFloor`는 `finishTravel(actor)`로 보행자를 자리에 즉시 스냅. | 순간이동·소멸·강제 중단 폴백 0화, 최대 속도 상한(직원 `<=180px/s`, 동행 `<=240px/s`) 강제, 부드러운 복귀(`cancel`)로 전환 |
| **원인 3. 승강기 즉시 점프** | **미해결** | `travelSeconds(a,b)`가 `a.floor!==b.floor?1.6:...`, `stateAt`이 `if(a.floor!==b.floor)return {state,seat:slot(a.id,'stand'),floor:a.floor,walking:false,waiting:true,position:pa};`로 1.6초 제자리 대기 후 도착 층으로 즉시 점프. (`creativePetState`도 동일하게 `1.6`초 점프.) | `2.2초` 4단계 승강기 탑승→문 닫힘/열림→전용 슬롯 대기→퇴장 상태기 도입 |
| **원인 4. 대화 시 마주보기 없음 & 안무 부재** | **미해결 (회장님 예외만 존재)** | `snapshot` 끝부분이 `if(p.deskPartner&&(p.id==='seongmin'\|\|p.deskPartner==='seongmin')){... p.facing=peer.seat.x<p.seat.x?'left':'right';}`로 **회장님 포함 `deskPartner`만** 좌우 `facing` 계산. 직원 간 `deskPairs`·`gathering`·`group`·`staffChats`에는 마주보기 없음. `createStaffChats`는 `Math.floor((seconds-chat.performStart)/2.2)`로 2.2초마다 줄 출력만 하고 `ALIGN_FACE`·`REACTION_POSE` 없음. CSS도 `.hani-office-actor[data-facing="left"] .hani-office-sprite{rotate:-4deg}` / `4deg` 기울기만 존재. | 전 쌍(직원↔직원·직원↔NPC·직원↔회장님) 상호 `ALIGN_FACE` 적용 및 5단계 `Choreography FSM` 도입 |
| **원인 5. 반복 대사 & 기계적 직무 치환** | **부분 개선 / 미해결** | `staffChatLines`는 `43`쌍(`chat-01~40` + `chat-ieum-*`)으로 늘었으나, `office-places-v3.json`의 `atByPerson`에 `"카페 커피 카운터에서 전략 설계 이야기 메모 중"` 같은 **장소+직무 기계적 치환** 잔존. `idleFlavour`는 `dailyMax`·최근 이력 링 없이 공유 풀 순환(동일 프레임 `shownLines`만 회피). 바리스타 `npc-barista-iseul`·`npc-barista-eunha`는 `residentPeople`에 `lines` 1줄만 있고 `baristaLines`/`baristaNightLines`가 분리돼 있음. | `DialogueSelector` 4계층 우선순위, 동일 대사 `<=2회/일` 상한, 최근 이력 제외 링, `atByPerson` 자연 문장 교체, 바리스타 풀 통합 |
| **원인 6. 전역 BEAT 동기화 & 스케이트 걸음** | **부분 해결 / 잔존** | `distanceGait(distance,dx,reduced)`(`step=45`), `easeRun`, `compileCurve`/`sampleCurve`, `petEase`/`petMotion`/`petRoute`, CSS `.hani-office-actor[data-walking="true"]{transition:opacity .3s,left .1s linear,top .1s linear}`, `officeDepartureAt` 200ms 선행 기립 도입으로 걸음 품질 개선. 그러나 `idleFlavour` 전역 `const BEAT=2.4,ACTIVE_BEATS=4.5,MIN_CYCLE=12`, `createScheduler`의 `at+=180`/`45` 및 `tick+=90` 격자(외출 `errandPhases` 제외), `residentLife` 공용 `6s/12s` `clock.seconds`, `updateBuilding`(200ms) vs `sampleMotion`(100ms) vs `snapshot` 초기 프레임 `*5%2` 박자 불일치로 스케이트감과 집단 동기 출발·발화가 잔존. | 개인별 소수(prime) 오프셋 + `14~24s` 지터, 보행 속도·보폭·DOM 전환·정지 타이밍 단일 주기 동기화 |
| **원인 7. 단일 행동·서사 단절** | **부분 개선 (`visitPlan`) / 미해결** | `visitPlan`과 `creative` 9개 `visitRules`, `creativePetState` 주말 쿠션, `staffChatLines` 43쌍 추가. 그러나 **2~3단계 연속 서사(`Micro-Arc`)**, 사내 모듈 연동 `eventReactions`, `cooldownDays` 기반 희귀 장면, NPC↔직원 `chemistries`, `daon`·`yoonseul` 런타임 참여 규율(초기/온보딩 연동)이 아직 없음. | 성격별 행동(단독/연속 아크), 희귀 관계 장면 15종, 사내 읽기 전용 이벤트 반응 구현 |
| **원인 8. 첫 계산 지연 & 매 100ms 틱 부하** | **미해결** | `plan(day)`, `blockPlan(day,0,events)`, `visitPlan` 3중 플래너가 첫 호출 시 하루 `86,400`초 전체를 일괄 탐색(`clearSweep`·`screenReservations`). `updateResidents(now)`는 화면 표시 중 매 `100`ms마다 무조건 실행되며 `changed` 시 `fitStatusLabels()`(`placeStatusLabels` + `getBoundingClientRect()`)를 호출. | `Skeleton + Rolling Window(현재±30분)`, 비표시 층 연산 중단, Dirty Check 시에만 라벨 배치 |

> **중요 현황 교정 (2.9.315 정본 기준)**:
> - `character-bible-v1.md`는 19명(`seongmin` + 18명)만 수록하고 `daon`·`yoonseul`을 `planned`로, `yuna`를 `desk_yuna`로 적었으나, 현재 실제 런타임 데이터(`office-actions-315.json`, `spatial-contract-v3.json`, `art-map-v3.json`)는 **`ieum`(이음, 4F `desk_yuna`)을 포함한 21명**으로 운영 중이며, `yuna`는 **4F `desk_yuna_east`**, `sua`·`taeo`는 **2F `finance-row-spare`/`-east`**, `daon`·`yoonseul`도 `office-actions-315.json`에 등록(`registered`)되어 있다. Phase 4 설계는 **현재 런타임 정본 21명 + 동행 3(식빵·수현·수연) + 1F 카운터 NPC 6명 + (4-5) 6F 학예사 NPC 1명**을 모두 포괄한다.

---

## 2. 목표 구조 (통합 엔진 & 카운터 NPC 편입)

### 2-1. 4계층 아키텍처

```text
[데이터 계약 계층 (읽기 전용 / 신규 JSON 확장)]
  spatial-contract-v3.json · office-places-v3.json · office-actions-315.json (무수정)
  + office-behavior-v2.json (성격 행동 · Micro-Arc)
  + office-rare-scenes-v2.json (희귀 장면 · 이벤트 반응 · NPC 케미)
         │
         ▼
[계산 계층 (결정적 FNV-1a 시드 · Rolling Window)]
  1. Unified Occupancy Ledger (직원 + 카운터NPC + 펫 + 동행아이 + 방문객 통합 예약)
  2. Behavior & Rare Scene Planner (스켈레톤 + 현재±30분 윈도우 + 쿨다운)
  3. Spatial Router & Queue (전 층 42px · 2차선 복도 · 출입구/승강기 FIFO · 2.2초 4단계 승강기)
         │
         ▼
[연출 계층 (부드러운 1틱 동기화 · 마주보기 안무)]
  4. Choreography FSM (APPROACH → ALIGN_FACE → EXCHANGE_TURNS → REACTION_POSE → DISPERSE / ABORT)
  5. DialogueSelector 4계층 + 개인 박자 지터 + 발화 반복 상한
         │
         ▼
[렌더 계층 (활성 층 컬링 · Persistent Slot · 읽기/쓰기 분리)]
  - 현재 선택된 1개 층만 60~100ms 고해상도 갱신 (비표시 층은 논리 상태만 유지)
  - 스케이트 걸음 제거: 보폭(45 art-px/step)·실제 이동속도·CSS 전환·기립 선행 단일 주기 맞춤
```

### 2-2. 통합 점유 원장 (`Unified Occupancy Ledger`) 및 P0~P7 우선순위

지금의 `scheduler.reserve` + `visitPlan` + `residentSnapshot` + `companionSnapshot` 4갈래 충돌 확인을 **단일 원장 `Ledger`**로 통합한다. 모든 엔티티(`staff`, `npc_post`, `npc_free`, `pet`, `companion`, `visitor`)는 점유 시 `(floorId, anchorOrCell, x, y, tStart, tEnd, priority, ownerId)`를 등록한다.

| 우선순위 | 대상 / 사건 | 점유 특성 및 양보 규칙 |
|---|---|---|
| **P0** | 회장님 직접 조작 (`MANUAL_ACTIVE` / `MANUAL_RETURNING`) | 절대 비양보. 경로 위 일반 직원은 `sidestep` 또는 `ABORT` |
| **P1** | 카운터 고정 근무자 점유 슬롯 (`postLock`: `resident_post_*`) | 카운터 **내부 좌표 1점** 고정 점유. 교대 `-180s`~`+30s` 외 타인 침범 영구 차단 |
| **P2** | 회장님 동행·아이(`kid-suhyeon`, `kid-suyeon`, `companionDog`) & 임원 회의(`exec_meeting`) | 회장님 반경/목적지 보장. 강제 `active=null` 삭제 금지, 이탈 시 `cancel(now)`로 자연 복귀 |
| **P3** | 희귀 관계 장면 (`rareScenes`) & 사내 이벤트 반응 | 주간 1~2회 핵심 서사. 일반 1인 행동(P6)을 밀어내고 슬롯 확보 |
| **P4** | 카운터 손님 접점 슬롯(`client_front`) · 2인 대화(`staffChats`/`deskPairs`) · 5F `visitRules` | 카운터 앞 **접점 1~2석**에서 마주보기 대화. 수용량 초과 시 대기 또는 취소 |
| **P5** | 연속 행동(`Micro-Arc`) & 부서 주간 회의 (`standup_room`, `shared_meeting_2f`) | 이동 전 앵커 가용성 사전 확인 후 출발 |
| **P6** | 개인 성격 행동 · 1인 휴식 (`pantry_2f`, `coffee_counter`, `rooftop_rest`) · 펫 배회 | 빈자리 없으면 즉시 대체 목적지 선택(출발 후 제자리 서기/소멸 금지) |
| **P7** | 기본 좌석 착석(`homeSeat`) · 대기(`wait`) | 기본 복귀 상태 |

### 2-3. 전 층 공간·동선 규율 (42px · 차선 · FIFO · 승강기 4단계 · 순간이동 0)

1. **전 층 42 art-px 최소 간격**: 현재 `1f`에만 한정된 `screenFloor`·`screenHomeClear`·`stationaryStops` 검사를 `1f`, `2f`, `3f`, `4f`, `creative`(5F), `5f`(6F→7F 옥상), `(신설)museum` 전 층에 동일 적용한다. 정지/대화 쌍이 아닌 두 엔티티 중심 거리는 전 구간 **`>= 42 art-px`**를 강제한다(예외: 2인 대화 마주보기 쌍 `38~46px`, 카운터 앞 손님↔카운터 NPC는 카운터 경계선 기준 `>= 36px`).
2. **복도 2차선(`±14px` 우측 통행) & 동적 비켜서기(`sidestep`)**: 같은 층 복도 구간(`y` 변화 작은 수평 이동)에서는 진행 방향 기준 오른쪽 **`+14px`** 차선 오프셋을 적용해 마주 오는 인물이 비켜 지나가도록 한다. 정면 충돌 예측(`dist < 48px`, 반대 벡터) 시 우선순위가 낮은 쪽이 `>= 600ms` 이상 부드러운 측면 호(`±18px`)로 비킨다.
3. **출입구 & 승강기 FIFO 대기열**: `elevator` 및 방 출입문은 **동시 통과 1명**, 대기열 최대 **3명(선입선출 FIFO)**으로 제한한다. 4번째 진입자는 출발 전 대체 경로(예: `stairs` 또는 `>=180s` 지연)로 돌린다.
4. **4단계 승강기 전환 (`2.2s`, 즉시 점프 제거)**: `stateAt`의 `1.6s 대기 후 순간이동`을 아래 4단계로 대체한다.
   - `ELEV_ENTER` (`0.0 ~ 0.6s`): 승강기 대기 칸 진입 + 문 앞 대기 모션 (`scale/opacity` 유지, 순간이동 없음)
   - `ELEV_CLOSE_RIDE` (`0.6 ~ 1.4s`): 문 안쪽 페이드(`opacity 1 -> 0.15`, **승강기 캐빈 슬롯 좌표 유지**, 층 배지 인디케이터만 층 이동 표시)
   - `ELEV_OPEN_ARRIVE` (`1.4 ~ 1.9s`): 도착 층 승강기 내부에서 페이드 인(`opacity 0.15 -> 1.0`, 문 열림)
   - `ELEV_EXIT` (`1.9 ~ 2.2s`): 도착 층 로비 FIFO 배출 노드로 걸어 나옴(`walking: true`)
5. **순간이동 0원칙 (`ZERO_TELEPORT`)**:
   - `slewCompanion` 말미 `return {position:to,...}` 삭제 → 막히면 탐색 격자(BFS) 한 칸 우회, 불가 시 제자리 정지 후 재탐색.
   - `residentSnapshot` `2500ms` 만료 스냅·`return []` 소멸 삭제 → 제자리 회전/우회로 해결.
   - `companionSnapshot`의 `kid-suyeon` 즉시 앞뒤 반전(`walking?-1:1`)은 **`320ms` 호 보간 이동**으로 교체.
   - `selectFloor`의 `finishTravel(actor)` 즉시 착석 삭제 → 비표시 층 이동자도 시간 `t`에 맞춰 논리 좌표를 연속 전진시키고, 탭 전환 시 그 순간의 실제 중간 위치에서 바로 보여준다.

### 2-4. 카운터 고정 근무자(`post` NPC 6명) 통합 설계

`2.9.315`에 추가된 `residentPeople` 중 `post: true`인 6명은 일반 직원이나 자유 배회 펫과 다르므로 아래와 같이 **자리 고정 근무자(`fixed_post`)** 규칙으로 원장에 편입한다.

| ID | 이름 | 근무지 (`residentPosts`) | 근무 시간 | 한 줄 성격 & 기존 데이터 연동 |
|---|---|---|---|---|
| `npc-clerk-day` | 다솜 | `resident_post_store` (1F HANI 24) | `07:00 ~ 19:00` | 밝고 수다스러움 (`lines` 8개) |
| `npc-clerk-night` | 나래 | `resident_post_store` (1F HANI 24) | `19:00 ~ 07:00` | 무표정하지만 야근자 챙김 (`lines` 8개) |
| `npc-guide` | 소담 | `resident_post_reception` (1F 프론트) | `09:00 ~ 18:00` | 또렷하고 친절한 방문객 안내 (`lines` 8개) |
| `npc-desk-night` | 하람 | `resident_post_reception` (1F 프론트) | `18:00 ~ 09:00` | 차분하고 조용한 야간 데스크 (`lines` 8개) |
| `npc-barista-iseul` | 이슬 | `resident_post_cafe` (1F HANI Coffee) | `07:00 ~ 19:00` | 상냥하고 음료 취향 기억 (`baristaLines` 8개 통합) |
| `npc-barista-eunha` | 은하 | `resident_post_cafe` (1F HANI Coffee) | `19:00 ~ 07:00` | 느긋하고 꾸벅 조는 야간 바리스타 (`doze:true`, `baristaNightLines` 8개 통합) |

- **고정 점유 규칙**: `roleType: 'fixed_post'`, `postLock: true`. 카운터 내부 앵커(`resident_post_*`) 밖으로 배회하지 않으며, CSS `--post-cut` `clip-path`를 그대로 유지한다. **층 자유 보행 인원 상한(1F max walking)에는 포함하지 않는다.**
- **손님 접점 노드(Client-Front Node)**: 각 `resident_post_*` 바로 바깥쪽(`y + 38~46px` 안전 통로)에 **접점 노드 1~2개**를 P4 슬롯으로 둔다. 직원·방문객·회장님이 편의점/프론트/카페를 이용할 때는 이 접점 노드에 정지해 **서로 마주 본(`ALIGN_FACE`) 상태로** 대화한다.
- **교대 프로토콜 (`07:00/19:00`, `09:00/18:00`)**: 교대 시각 `-180s` 전에 퇴근 NPC가 자리 정리 문구를 띄우고, 교대 시각 정각부터 `+30s` 동안 교대자가 옆 대기점에서 한 마디 인수인계(`"교대할게요, 수고하셨어요!"`)를 나눈 뒤, 퇴근자는 `1F` 출입문 또는 로비 외곽 소멸 존으로 **걸어서 퇴장**한다(같은 카운터 칸에 2명이 겹치거나 갑자기 사라지지 않음).
- **이슬·은하 대사 풀 통합**: `residentPeople`에 하드코딩된 1줄 대사 대신 `residentVoice`와 `baristaLines`/`baristaNightLines`를 `DialogueSelector`의 단일 풀로 합쳐 반복을 없앤다.

### 2-5. 5단계 대화 안무 FSM (`Choreography FSM`)

모든 2~3인 상호작용(`staffChats`, `deskPairs`, `rareScenes`, `client_front` NPC 접대, 회장님 말 걸기)은 아래 5단계를 거친다.

1. **`APPROACH`**: 발화자/수신자가 각자 목표 슬롯(간격 `38~46px`)으로 이동. 한쪽이 `2.0s` 내 미도착 또는 P0~P2 끼어들기 시 `ABORT`.
2. **`ALIGN_FACE`** (`250ms`): 상대 X좌표 비교로 **양쪽 모두** `facing = peer.x < self.x ? 'left' : 'right'` 설정(현재의 `seongmin` 전용 조건 제거). `--response-lean`으로 서로 살짝 기울임.
3. **`EXCHANGE_TURNS`**: 최대 **4턴(`MAX_TURN = 4`)**, 턴당 `1.8 ~ 2.6s` (대사 길이에 비례, 동시 말풍선 0개 — 화자 `dataset.speaking="true"`, 청자 `nod`/`listen` 리액션).
4. **`REACTION_POSE`** (`1.0 ~ 1.4s`): 마지막 대사 뒤 짧은 끄덕임/웃음/메모/강아지 흔들기 등 무음 리액션 포즈 유지.
5. **`DISPERSE` / `ABORT`**: 원위치 또는 다음 `Micro-Arc` 목적지로 **자연 보행 이탈**. (현재 `staffChats.cancel`처럼 끝나기 전까지 말없이 서 있는 고착 상태 제거.)

### 2-6. 대사 선택기 (`DialogueSelector`) & 개인 박자 지터 & 스케이트 걸음 마감

- **4계층 우선순위**: `T1 희귀 장면·사내 이벤트 반응` > `T2 성격 Micro-Arc 대사` > `T3 2인 페어(staffChats)·카운터 NPC 케미` > `T4 1인 혼잣말·고유 버릇`
- **반복 상한 & 치환 금지**:
  - `office-places-v3.json`의 `atByPerson` 기계적 템플릿(`"<장소>에서 <직무> 이야기 메모 중"`)은 행동 엔진에서 사용하지 않고 자연스러운 구어체 `T2/T4` 문장으로 대체한다.
  - 동일 대사 `dailyMax = 2`, 직전 `6회` 이내 재선정 금지, 같은 화면 내 동시 다발 발화 최대 `2개`(동일 `Floor` 기준, 회장님 조작/희귀 장면 발화 우선).
- **개인 박자 지터**: `idleFlavour`의 전역 `BEAT = 2.4` 동기화를 폐지하고, 각 인물 시드(`fnv1a(personId + dayKey)`)로 `cycleSec = 15 + (seed % 11)`(`15~25s` 소수성 분산) + `offsetSec = (seed >> 4) % cycleSec`를 부여한다. `scheduler`의 `at += 180` 격자도 `±35s` 개인 지터를 섞는다.
- **스케이트 걸음 완전 해소**: `updateBuilding`의 `200ms` 틱과 `sampleMotion`의 `100ms` 틱·`snapshot` 초기 walk 프레임(`*5%2`)이 엇갈려 발보다 바닥이 미끄러지는 현상을 막기 위해, **실제 프레임 변위 `stepPx = Math.hypot(dx, dy)` 누적량이 `22.5 art-px`(= half of `distanceGait` `step=45`)에 도달할 때마다 `walk-a ↔ walk-b`를 전환**하고, 도착 `120ms` 전에 `walking: false` + 정지 자세(`stand`)로 전환한다. (좌우 측면 보행 도트 추가 시 4방향 매핑; 현 스프라이트에서는 `data-facing` 좌우 미세 기울기 + 그림자 위상 일치.)

---

## 3. 성격별 행동 표 (핵심)

- 모든 행동은 **현재 엔진에 실제로 존재하는 장소·자세(`standing`, `sitting`, `walk-a`, `walk-b`)·리액션(`stand`, `sit`, `nod`, `lean`, `tap`)·말풍선(30자 이하, 호칭 `'회장님'` 통일)**으로 설계하였다.
- 현재 엔진/이미지에 없는 자세·소품·신규 층(예: 측면 전용 걷기, 카메라 들기, 컵라면, 6F 박물관)은 **`[그림 필요]`**로 명시하였다.
- 등록 정원 21명(`seongmin` + 직원 20명)과 아이들 2명, 카운터 NPC 6명을 빠짐없이 포함한다.

### 3-1. 경영층 & 전략기획실 (4F 중심)

| 인물 | 출근 / 퇴근·시간 버릇 | 쉬는 방식 & 자주 가는 곳 | 성격 행동 3~4가지 (현재 자산 기준 + `[그림 필요]`) | 혼잣말 버릇 (30자 이내) | 피하는 것 |
|---|---|---|---|---|---|
| **성민 회장님** (`seongmin`) | `AUTO` 시 아침 4F `ceo-reserved` 착석 → 각 층 순회 | 1F `coffee_counter`, 5F `rooftop_rest`(→7F), 5F `creative` 각 실 | 1. 4F 각 실 문 앞 잠깐 멈춤(`stand`) 후 질문 건넴<br>2. 식빵(`companionDog`)과 1F~5F 산책<br>3. `MANUAL_ACTIVE` 직접 조종 최우선(P0)<br>4. `[그림 필요]` 빨간 넥타이 강조·손짓 포즈 | `"다들 오늘 흐름 어때요?"`<br>`"갑자기 좋은 게 떠올랐어"` | 형식적 보고만 길어지는 자리(긴 회의 연속 회피) |
| **하니** (`hani`) | 정시 전후 빠른 4F `office_hani` 착석, 밤 늦은 잔류 잦음 | 1F `coffee_counter`(진한 아메리카노) ↔ 4F `exec_meeting` 화이트보드 | 1. 4F `exec_meeting` 앞서 구조 점검(`stand`/`lean`)<br>2. `office_hani`↔`ceo` 짧은 동선 왕복(`walk`→`nod`)<br>3. 밤 늦게 4F 라운지/복도 순찰 후 메모<br>4. 칭찬(`tap`) 받으면 잠깐 멈칫 후 미소(`nod`) | `"목적부터 한 줄로 잡죠"`<br>`"이번 Scope 밖입니다"`<br>`"방금 칭찬 맞죠? 헤헤"` | 맥락 없는 잡담 모임, 1F 로비 장시간 체류 |
| **가은** (`gaeun`) | 오전 일찍 4F `secretary_desk` 착석(일정 선점검) | 1F `coffee_counter` 짧은 테이크아웃, 4F `ceo` 앞 대기 | 1. 회의 10분 전 `exec_meeting` 사전 확인(`stand`)<br>2. `secretary_desk`↔`office_hani` 이동 시간 조율<br>3. 1F `reception` 들러 외부 일정·자료 수령<br>4. `[그림 필요]` 클립보드·체크리스트 든 자세 | `"이동 시간 10분 비웠어요"`<br>`"안건은 세 개까지만요"`<br>`"회장님, 자료 올렸습니다"` | 이동 시간 없는 연속 회의, 근거 없는 잡담 |
| **유나** (`yuna`) | 정시 출근 후 4F `desk_yuna_east` 정리부터 시작 | 1F `coffee_counter`, 1F `reception`(소담에게 질문 확인) | 1. `desk_yuna_east`→`reception`↔`secretary_desk` 라우팅 왕복<br>2. `hani_office`·`finance` 들러 담당자 확인(`nod`)<br>3. 5F `library_cinema` 들러 안내 문서 정리<br>4. `[그림 필요]` 태블릿·색 태그 들고 깜짝 반응 포즈 | `"제가요?! 먼저 받을게요!"`<br>`"어디로 넘길지 정리 중!"`<br>`"원래 이런 거군요… 메모!"` | 담당자·분류 없는 쪽지 방치, 아는 척 답변 |
| **이음** (`ieum`) | 차분한 정시 4F `desk_yuna` 합류(유나 옆자리 파트너) | 1F `coffee_counter`, 5F `rooftop_rest` 조용한 끝자리 | 1. `desk_yuna`↔`desk_yuna_east` 유나와 메모 교환(`lean`)<br>2. `mir_nook`·`shared_meeting_2f` 오가며 팀 간 연결<br>3. `convenience-1f` 조용히 들러 간식 챙김 | `"맥락부터 이어 드릴게요"`<br>`"두 팀 일정 겹침 확인!"`<br>`"차근차근 정리됐어요"` | 붐비는 소음 시간대 1F 정중앙 체류 |
| **미르** (`mir`) | 출퇴근 경계 옅음, 이른/늦은 시간 4F `mir_nook` 상주 | 5F/6F `rooftop_rest`(가장 조용한 쉼터), 5F `library_cinema` | 1. `mir_station` 서서(`stand`) 코어 광원 앞 패턴 응시<br>2. 사람 멈춘 곳에 다가가 질문(`lean`·`Why?`)<br>3. 야간 `rooftop_rest`에서 혼자 바람 쐬기<br>4. `[그림 필요]` 미르 홀로그램/코어 반짝임 강화 프레임 | `"왜 그 선택을 하셨어요?"`<br>`"맥락만 연결해 두었어요"`<br>`"이 느낌, 기억해 둘게요"` | 의도 없는 억지 끼어들기, 북적이는 회식 시간 |

### 3-2. AI플랫폼개발실 (3F 중심)

| 인물 | 출근 / 퇴근·시간 버릇 | 쉬는 방식 & 자주 가는 곳 | 성격 행동 3~4가지 (현재 자산 기준 + `[그림 필요]`) | 혼잣말 버릇 (30자 이내) | 피하는 것 |
|---|---|---|---|---|---|
| **서윤** (`seoyun`) | 3F `dev-lead`에서 아키텍처 확인 후 **층 간 이동 많음** | 4F `hani_office`, 5F `studio`·`rooftop_rest` | 1. 3F 고정 탈피: 4F 전략실·5F `studio` 실제 사용 맥락 답사<br>2. `standup_room`·`release_room` 화이트보드 앞 설계(`stand`)<br>3. 밤 늦게 `rooftop_rest`에서 머리 식히기<br>4. 2F `finance` 들러 데이터 경로 호환 점검 | `"기존 구조부터 확인해요"`<br>`"설계 단위로 나눌게요"`<br>`"쓰는 흐름이 자연스럽네요"` | 소유 경로 무시한 임시방편 패치 모임 |
| **도연** (`dohyun`) | 3F `dev-build` 집중 착석, 밤늦은 패치 후 한 번에 이동 | 1F `convenience-1f` 야간 컵라면/음료, 5F `rooftop_rest` | 1. `dev-build`↔`dev-lead`·`dev-qa` 3F 삼각 동선 빠른 왕복<br>2. 밤 22시 이후 `convenience-1f` 들러 나래에게 간식 수령<br>3. `release_room` 앞에서 테스트 초록 불 대기<br>4. `[그림 필요]` 노트북·컵라면 든 야식 자세 | `"일단 로컬 재현해 볼게요"`<br>`"변경 12줄, 통과했어요"`<br>`"아, 그 엣지 바로 봅니다"` | 말만 길어지는 추상 토론 회의 |
| **세린** (`serin`) | 3F `dev-research` 출발 → 자료 공간·옥상 탐색 순환 | 5F `library_cinema` 자료 코너, `rooftop_rest`, 3F 화이트보드 | 1. `standup_room` 화이트보드 ↔ `library_cinema` 왕복(생각 폭주)<br>2. `rooftop_rest` 난간서 아이디어 3분 정리 후 복귀<br>3. 2F `shared_meeting_2f`에서 윤슬·히나와 자료 연결<br>4. `[그림 필요]` 수첩/펜 들고 메모하는 연구자 포즈 | `"이 패턴, 자동화 돼요!"`<br>`"실험부터 돌려볼까요?"`<br>`"데이터 근거가 먼저죠"` | 데이터·재현 근거 없는 막연한 잡담 |
| **유리** (`yuri`) | 3F `dev-qa` 체크리스트 확인 → 전 층 검증 순회 | 3F `release_room`, (4-5) 6F `museum` 기록물실, 5F `studio` | 1. `dev-qa`↔`dev-build` 패치 재현 확인 왕복<br>2. 5F `studio`·`library_cinema` 화면 예외 직접 눌러보기<br>3. (4-5) 6F `museum`에서 배포/과거 기록 대조<br>4. `[그림 필요]` 체크표시 클립보드 든 검수 자세 | `"미검증은 PASS 아니에요"`<br>`"모바일 엣지 하나 남음!"`<br>`"기대값 일치, PASS!"` | 검증 없이 '완료'라고 단정하는 자리 |
| **아린** (`arin`) | 3F `dev-design` → 화면·공간 미감 관찰 순회 | 5F `studio`·`library_cinema`, 1F 로비·`coffee_counter` | 1. 1F 로비·`floor-1f-v2` 안내판/동선 눈높이 관찰(`stand`)<br>2. 5F `studio`·`kids_pet_lounge` 컬러/여백 감상<br>3. `dev-design`↔`dev-lead`·`dev-qa` UI 밀도 조율<br>4. `[그림 필요]` 태블릿 스케치·손가락 여백 재기 포즈 | `"모바일 여백 좀 비울까요?"`<br>`"사용자 눈엔 복잡해요"`<br>`"이 디테일 너무 예뻐요!"` | 백엔드 내부 용어만 오가는 긴 논쟁 |

### 3-3. 재무자산관리실 & 기업솔루션사업부 (2F 중심 — `2.9.315` 현행 배치 반영)

| 인물 | 출근 / 퇴근·시간 버릇 | 쉬는 방식 & 자주 가는 곳 | 성격 행동 3~4가지 (현재 자산 기준 + `[그림 필요]`) | 혼잣말 버릇 (30자 이내) | 피하는 것 |
|---|---|---|---|---|---|
| **지은** (`jieun`) | 정시 2F `finance-a` 착석(고정비·캘린더 먼저) | 2F `pantry_2f` 따뜻한 차, 1F `convenience-1f` 영수증 체크 | 1. `finance-a`↔`finance-b` 하루와 구매 예산 심사<br>2. 월말/금요일 `shared_meeting_2f` 결산 정리<br>3. 1F `convenience-1f` 지나며 가격표·영수증 점검<br>4. 4F `hani_office` 들러 예산 범위 합의 | `"이번 달 고정비부터 보죠"`<br>`"유령 구독 하나 잡았어요"`<br>`"원하는 걸 오래 쓰려구요"` | 무계획 충동구매 자랑, 증빙 없는 지출 |
| **하루** (`haru`) | 여유 있는 정시 2F `finance-b` 착석 | 2F `pantry_2f` 독서, 1F `convenience-1f` 신상품 구경 | 1. `convenience-1f` 진열대 물건 비교(`stand`·메모)<br>2. 5F `fitness`·`library_cinema` 실사용 후기 체감<br>3. 2F `life` 나은·수연에게 생활용품 조언<br>4. `[그림 필요]` 장바구니/스마트워치 살펴보는 포즈 | `"회장님 생활에 맞는지 봐요"`<br>`"이건 오래 잘 쓰실 거예요"`<br>`"그거요? …사."` | 이미 산 물건 뒤늦게 비교해 후회 만들기 |
| **다온** (`daon`) | 조용한 이른 출근, 2F `desk_daon` 착석 | 2F `pantry_2f` 한적한 구석, 5F `library_cinema` 리포트 정독 | 1. `desk_daon`에서 하방 위험 차트 정리(`sit`·`nod`)<br>2. `finance-a` 지은 옆에서 조심스레 메모 전달<br>3. 4F `exec_meeting`·`mir_nook` 들러 변동성 확인<br>4. (설정 규율) 온보딩 기간 중 혼자 과시적 중앙 점거 자제 | `"하방 위험부터 볼게요"`<br>`"반대 근거 세 가지 있어요"`<br>`"지은 부장님, 이거 맞죠?"` | 근거 없는 장밋빛 투자 낙관론 |
| **수아** (`sua`) | 2F `finance-row-spare` 이른 출근(아침 메일/Owner 점검), 야근 잦음 | 1F `client_booth` 미팅, 2F `pantry_2f`, 5F `rooftop_rest` | 1. 2F↔1F `client_booth` 고객 미팅·Owner 기한 점검<br>2. `finance-row-spare`↔`-east` 채원과 제안서 조율<br>3. 밤늦은 야근 시 나은의 휴식 권유에 머쓱히(`lean`) 기립<br>4. 칭찬(`tap`) 시 수줍게(`nod`) "헤헤ㅎㅎ" 반응 | `"Owner랑 기한부터 적죠"`<br>`"증빙 있어야 확정입니다"`<br>`"칭찬이시죠…? 헤헤ㅎㅎ"` | Owner·기한 없는 구두 약속, 사적 잡담 |
| **채원** (`taeo`) | 2F `finance-row-spare-east` 정시 출근 | 1F `client_booth`, 3F `platform`, 5F `rooftop_rest` 티타임 | 1. 1F `client_booth` 상담 후 3F `dev-lead`·`dev-design` 전달<br>2. `finance-row-spare` 수아에게 요구사항 3줄 보고<br>3. 5F `rooftop_rest`에서 혼자 조용히 숨 고르기<br>4. `[그림 필요]` 찻잔 들고 숨 고르는 티타임 자세 | `"고객 의도를 3줄로 짰어요"`<br>`"기술 제약 먼저 번역했죠"`<br>`"오너랑 기한 맞췄습니다"` | 기술 검토 없이 "다 됩니다" 구두 약속 |

### 3-4. 라이프&엔터테인먼트 (2F 중심) & 동행 가족 (`수현·수연`) & 1F NPC

| 인물 | 출근 / 퇴근·시간 버릇 | 쉬는 방식 & 자주 가는 곳 | 성격 행동 3~4가지 (현재 자산 기준 + `[그림 필요]`) | 혼잣말 버릇 (30자 이내) | 피하는 것 |
|---|---|---|---|---|---|
| **나은** (`naeun`) | 규칙적 2F `life-a` 출근, 야간엔 잔류 직원 순찰 | 5F `fitness`, `kids_pet_lounge`, 2F `pantry_2f` | 1. 5F `fitness` 상태 체크 후 5F `kids_pet_lounge` 아이·펫 돌봄<br>2. 2F `pantry_2f`에서 야근자용 따뜻한 차 챙김<br>3. 야근 직원(`sua`·`dohyun`·`hani`) 발견 시 강제 퇴근 권고<br>4. `[그림 필요]` 물병/허브티 컵 건네는 자세 | `"회장님, 밥은 드셨어요?"`<br>`"오늘은 운동 끝, 회복해요"`<br>`"잠깐, 신발 내려놔요!"` | 무리한 야근 강행, 극단적 식단·자가실험 |
| **히나** (`hina`) | 밝게 2F `life-b` 착석, 공부 타임엔 5F 도서관 이동 | 5F `library_cinema`, 2F `pantry_2f` 달달한 간식 | 1. 5F `library_cinema` 공부하다 중간에 `pantry_2f`/`coffee_counter` 간식으로 샘<br>2. 3F `dev-qa`·`dev-design` 들러 학습 화면·최종 검수<br>3. 4F `hani_office` 들러 하니 한 마디 놀리고 도망(`walk-b`)<br>4. `[그림 필요]` 토끼 스티커 노트·칠판 앞 지시봉 자세 | `"놀 땐 놀고 공부는 제대로!"`<br>`"あれ？ 스펠링 못 본 척!"`<br>`"만년 과장이 제일 좋아용~"` | 승진 얘기, 모르는 척 얼버무리기 |
| **민지** (`minji`) | 2F `life-c` 출발 → **전 층 촬영 소재 탐험가** | 5F `studio`·`library_cinema`(시네마), `rooftop_rest`, 1F `coffee_counter` | 1. 5F `studio`·시네마 구역 상주 관찰(`stand`)<br>2. 1F `coffee_counter`·`rooftop_rest`로 카메라 포인트 탐색<br>3. 하니·히나 당황 순간 발견 시 멈춰 서서(`lean`) 기록<br>4. `[그림 필요]` 필름 카메라 들어 올리는 촬영 자세 | `"컷! Archive 1호 등재!"`<br>`"이건 감동코드라구요"`<br>`"진심 앞에선 카메라 내림"` | 진짜 아픈 순간·사적 슬픔을 가볍게 소비 |
| **수연** (`sooyeon`) | 빠릿한 2F `life-d` 출발, 점심·오후 현장 순회 | 5F `fitness`, 1F 로비·`convenience-1f`, 2F `shared_meeting_2f` | 1. 5F `fitness` 스트레칭·코스 점검(`stand`/`walk`)<br>2. 2F `life`↔`finance` 이동하며 외출·스포츠 장비 챙김<br>3. 4F `desk_yuna_east` 들러 유나에게 "일단 와봐" 호출<br>4. `[그림 필요]` 배낭/스마트워치 확인·스트레칭 포즈 | `"고민 말고 일단 가봐요!"`<br>`"무계획은 낭만 아니에요"`<br>`"라인업 분석 끝, 직관각!"` | 실행성 0 공상만 맴도는 회의 |
| **윤슬** (`yoonseul`) | 2F `desk_yoonseul` 차분히 정리 후 도서관으로 이동 | 5F `library_cinema` 독서 구역, 2F `pantry_2f` | 1. `desk_yoonseul`→5F `library_cinema` 책 묶음 들고 이동<br>2. `library_cinema`에서 히나·세린과 목차 공유(`lean`)<br>3. `finance-b` 하루와 책 취향 짧은 대화<br>4. `[그림 필요]` 안경 고쳐 쓰고 두꺼운 책 안은 자세 | `"함께 책장을 펼쳐봐요"`<br>`"지난번 메모랑 이어져요!"`<br>`"최종 점검은 히나 과장님!"` | 출처 불명 요약본, 히나의 채점 권한 침범 |
| **수현·수연** (`kid-suhyeon`, `kid-suyeon`) | 주말·방과 후 방문 (`createKidsVisits`), 회장님 호출 시 합류 | 5F `kids_pet_lounge`, 1F `coffee_counter`, 4F `ceo` 앞 | 1. 자유 산책·`kids_pet_lounge`에서 반려동물과 놀기(경쟁/점수/투표 0)<br>2. 1F `convenience-1f`·`coffee_counter` 구경 후 아빠 찾기<br>3. 퇴근 직전 4F `ceo` 앞 마중(아빠 걷기 시 `cancel` 부드러운 복귀) | (수현) `"아빠! 오늘 언제 끝나요?"`<br>(수연) `"강아지 보러 같이 가요!"`<br>`"간식 하나만 골라도 돼?"` | **경쟁·투표·호감도 수치 전면 금지** |
| **카운터 NPC 6명** (`post`) | 교대 시각 정확히 교대 (`07/19시`, `09/18시`) | **각자 카운터 `resident_post_*` 고정** (배회 없음) | 1. 다솜/나래: `convenience-1f` 손님 접점 노드에 마주 보고 응대<br>2. 소담/하람: `reception` 방문객·직원 안내<br>3. 이슬/은하: `coffee_counter` 음료 추천 (은하 야간 `doze`)<br>4. `[그림 필요]` 물건 건네기/커피 내리기 전용 손 포즈 | 다솜 `"신상 들어왔어요!"`<br>나래 `"야근엔 따뜻한 거 드세요"`<br>소담 `"몇 층 안내해 드릴까요?"` | 자리 이탈 자유 배회, 호감도/조직도 편입 |

---

## 4. 관계 희귀 장면 목록 (15개)

- 모든 장면은 **P3 우선순위**로 예약되며, 동일 장면은 `cooldownDays` 이내 재발동하지 않는다.
- **총 한도**: 건물 전체 **하루 최대 1회(주말 포함 주간 체감 1~3회)**, 같은 시간대 연속 발동 금지(`최소 4시간` 간격).
- **문구 규율**: 모든 대사 초안은 **공백 포함 30자 이하**, 회장님 호칭은 예외 없이 **`"회장님"`**, **수현·수연 장면은 100% 가족 중심(경쟁·투표·호감도 0)**.

| # | 장면 ID · 제목 | 등장인물 (2~3인) | 조건 (요일·시각·확률·쿨다운) | 장소 | 5단계 진행 순서 | 한국어 대사 초안 (각 ≤30자) | 한도 (일/주) |
|---|---|---|---|---|---|---|---|
| **R01** | `late_night_roadmap`<br>**늦은 밤 4F 로드맵** | 하니, 서윤 | 평일 `21:00~23:30`, 확률 `22%`, 쿨다운 `5일` | 4F `exec_meeting` | 둘이 합류 → 마주 봄 → 3턴 대화 → 동시 고개 끄덕(`nod`) → 각자 자리/엘베 이탈 | 하니: `"아직 안 가셨어요, 리드님?"`<br>서윤: `"영향 범위만 마저 보고요"`<br>하니: `"회장님 내일 뵈면 웃겠다"` | 일 1회 / 주 1회 |
| **R02** | `library_wrong_books`<br>**도서관 딴 책 읽기** | 히나, 윤슬 | 평일 `14:00~17:00`, 확률 `25%`, 쿨다운 `4일` | 5F `library_cinema` | 나란히 착석 → 서로 화면/책 힐끔(`ALIGN_FACE`) → 4턴 대화 → 웃음 리액션 → 책 덮고 이석 | 히나: `"윤슬아, 그거 시험 책 아니지?"`<br>윤슬: `"과장님도 소설책 보셨잖아요!"`<br>히나: `"쉿! 딱 10분만 더 보자용"`<br>윤슬: `"네, 딱 한 챕터만요!"` | 일 1회 / 주 2회 |
| **R03** | `pretty_vs_exact`<br>**예쁨 vs 정확함** | 유리, 아린 | 화~금 `10:30~16:00`, 확률 `25%`, 쿨다운 `4일` | 3F `dev-design` 앞 (또는 5F `studio`) | 아린이 시안 확인 중 유리 접근 → 마주 봄 → 3턴 → 함께 화면 쪽으로 `lean` → 각 자리 복귀 | 아린: `"유리님, 여백 딱 예쁘죠?"`<br>유리: `"예쁜데 모바일서 눌려요?"`<br>아린: `"…지금 바로 눌러보죠!"` | 일 1회 / 주 2회 |
| **R04** | `rooftop_candid_caught`<br>**옥상 몰카 적발** | 민지, 하니 | 금요일 `15:00~18:00`, 확률 `30%`, 쿨다운 `7일` | 6F(→7F) `rooftop_rest` | 민지 잠복(`[그림 필요]` 카메라) → 하니 접근·발견 → 3턴 → 하니 가벼운 잔소리/민지 도망(`walk-b`) | 민지: `"전무님 감동샷 각 나온다!"`<br>하니: `"민지 대리, 카메라 내려요"`<br>민지: `"컷! 역시 눈치 백단!"` | 일 1회 / 주 1회 |
| **R05** | `kids_pickup_dad`<br>**퇴근 직전 아빠 마중** *(가족 전용)* | 수현, 수연, (합류 시) 회장님 | 평일 `17:30~18:45`, 확률 `28%`, 쿨다운 `3일` | 4F `ceo` 앞 로비 | 엘리베이터에서 아이 둘 도보 도착 → 문 앞 정렬 → 회장님 나오면 마주 봄 → 3턴 → 손 흔들고 `1F` 동행 | 수현: `"회장님! 아니 아빠 끝났어요?"`<br>수연: `"오늘 같이 산책 가면 안 돼?"`<br>회장님: `"잠깐, 가방만 챙기고 나가자"` | 일 1회 / 주 2회 |
| **R06** | `bread_follows_staff`<br>**식빵의 타 직원 동행** | 식빵(`companionDog`), 나은 (또는 히나) | 매일 `13:00~16:30`(회장님 `ceo` 착석 중), 확률 `20%`, 쿨다운 `4일` | 5F `kids_pet_lounge` → 2F `pantry_2f` | 식빵이 나은 뒤를 졸졸 따라옴 → 나은 멈춰 마주 봄 → 2턴 + 펫 흔들기 → 다시 라운지로 | 나은: `"어, 식빵이 회장님은 어쩌구"`<br>나은: `"산책 한 바퀴만 돌고 가자"` | 일 1회 / 주 2회 |
| **R07** | `forced_night_rest`<br>**야근자 강제 휴식** | 나은, 수아 (또는 도연) | 월~목 `21:30~23:45`, 확률 `30%`, 쿨다운 `4일` | 2F `finance-row-spare` (또는 3F `dev-build`) | 나은 순찰 중 발견 → 책상 앞 정지(`ALIGN_FACE`) → 3턴 → 대상 기립(`stand`)해 `pantry_2f`로 동행 이탈 | 나은: `"일은 끝나도 사람은 지켜야죠"`<br>수아: `"기한 하나만 더 보고요…"`<br>나은: `"안 돼요, 허브차 마시고 귀가!"` | 일 1회 / 주 2회 |
| **R08** | `receipt_audit_tug`<br>**편의점 영수증 추적** | 지은, 하루, 다솜(NPC) | 평일 `12:30~14:00`, 확률 `25%`, 쿨다운 `5일` | 1F `convenience-1f` 접점 노드 | 하루 신상품 들고 나옴 → 지은 합류 + 다솜 카운터 응대 → 4턴 → 하루 상품 내려놓음/동의 | 지은: `"하루 대리, 이 영수증 뭐죠?"`<br>하루: `"테스트용 신상 간식인데요!"`<br>다솜: `"둘 다 맛있기로 유명해요!"`<br>지은: `"예산은 한 봉지까지만요"` | 일 1회 / 주 1회 |
| **R09** | `midnight_cup_noodle`<br>**심야 편의점 컵라면** | 도연, 세린, 나래(NPC) | 평일 `22:00~01:00`, 확률 `22%`, 쿨다운 `5일` | 1F `convenience-1f` 접점 노드 | 도연·세린 동시 1F 하강 → 카운터 앞 나래와 3인 정렬 → 3턴 (`[그림 필요]` 라면 소품) → 옥상/개발실 복귀 | 세린: `"밤엔 자동화보다 컵라면이죠"`<br>도연: `"재현 안 될 때가 제일 맵죠"`<br>나래: `"뜨거운 물 조심해서 드세요"` | 일 1회 / 주 1회 |
| **R10** | `studio_ng_outtake`<br>**스튜디오 NG 컷** | 민지, 수연, 유나 | 수/금 `15:30~17:30`, 확률 `22%`, 쿨다운 `6일` | 5F `studio` | 수연 진행 리허설 중 유나 당황 → 민지 구석서 포착 → 3턴 → 셋 다 웃음 리액션 → 흩어짐 | 수연: `"유나야, 그냥 크게 외쳐봐!"`<br>유나: `"제가요?! 대본이 없는데요!"`<br>민지: `"좋아, 자연스러운 NG 컷 완료"` | 일 1회 / 주 1회 |
| **R11** | `reception_floor_bridge`<br>**1F↔4F 안내 인수인계** | 유나, 가은, 소담(NPC) | 월/수 `09:30~11:30`, 확률 `24%`, 쿨다운 `5일` | 1F `reception` 접점 노드 | 유나·가은이 1F 내려와 소담 앞 정렬 → 3턴 → 소담 끄덕임(`nod`) → 유나·가은 4F 복귀 | 소담: `"오늘 오신 분 자료 정리했어요"`<br>유나: `"감사해요! 담당자 바로 연결할게요"`<br>가은: `"오전 일정이랑 딱 맞네요"` | 일 1회 / 주 1회 |
| **R12** | `rooftop_philosophy`<br>**"왜?" vs "가보면 알아"** | 미르, 수연 | 목/토 `16:00~18:00`, 확률 `22%`, 쿨다운 `5일` | 6F(→7F) `rooftop_rest` | 옥상 난간서 마주 봄 → 3턴 → 미르 고개 갸웃(`lean`), 수연 끄덕임 → 각 층 복귀 | 미르: `"그 산책은 왜 지금 가나요?"`<br>수연: `"가보면 알아, 바람이 좋거든"`<br>미르: `"비논리적인데… 궁금해지네요"` | 일 1회 / 주 1회 |
| **R13** | `night_barista_yawn`<br>**야간 바리스타와 조용한 쉼** | 은하(NPC), 채원, 미르 | 화/금 `20:00~22:30`, 확률 `20%`, 쿨다운 `6일` | 1F `coffee_counter` 접점 노드 | 채원 티타임 도착, 미르 합류, 은하 졸음 풀며 응대 → 3턴 → 따뜻한 쉼 뒤 조용히 해산 | 채원: `"은하님, 제일 순한 차로 주세요"`<br>은하: `"(하품) 밤엔 유자차가 딱이죠…"`<br>미르: `"밤의 속도는 낮과 다르네요"` | 일 1회 / 주 1회 |
| **R14** | `finance_tea_break`<br>**2F 팬트리 차 한 잔** | 지은, 나은, 이음 | 평일 `15:00~16:30`, 확률 `22%`, 쿨다운 `5일` | 2F `pantry_2f` | 2F 팀장 둘 + 4F 이음 합류 → 삼각 정렬 → 3턴 → 각자 차 챙겨 복귀 | 나은: `"지은 부장님, 눈 좀 쉬세요"`<br>지은: `"결산 숫자만 딱 맞추고요"`<br>이음: `"전달할 메모도 잠시 뒤 줄게요"` | 일 1회 / 주 1회 |
| **R15** | `praise_resistance_combo`<br>**칭찬 면역 0콤비** | 하니, 수아 | 월~금 `14:00~17:00` (회장님 근처 순회 이후), 확률 `18%`, 쿨다운 `7일` | 4F 복도 또는 2F `shared_meeting_2f` | 둘이 스쳐 멈춤 → 마주 봄 → 3턴 → 둘 다 어색하게 웃으며 빠른 걸음 이탈 | 하니: `"아까 회장님이 수아씨 칭찬하더라"`<br>수아: `"네?! 전무님도 잘하셨잖아요!"`<br>하니: `"나도 아까 듣고 쑥스러웠어"` | 일 1회 / 주 1회 |

---

## 5. 구현 조각 순서 (4-1 ~ 4-6)

각 조각은 **1회 회장님 미리보기 + 1회 배포 열차 탑승/배포** 단위로 완결한다. 기존 데이터 파일(`spatial-contract-v3.json`, `office-places-v3.json`, `office-actions-315.json`)은 건드리지 않고 새 데이터 파일을 추가하는 방식을 따른다(단, `4-5`·`4-6` 신규 층 추가는 레지스트리 확장 파일로 분리).

### 조각 4-1. 기반 (`Unified Ledger` · 전 층 42px · 0순간이동 · 카운터 NPC · 스케이트 걸음 마감 · 성능)
- **바뀌는 파일**: `hani-office-live.js`, `hani-office-live.css` (규격 상수/모션 동기화)
- **새 시험**: `scripts/hani-building-phase4-foundation.test.mjs`
- **통과 조건**:
  - 7일 시뮬레이션 중 전 층 최소 거리 `>= 42 art-px` (100% 통과), `slewCompanion`·`residentSnapshot`·`selectFloor`·`kidsVisits` 순간이동/강제 삭제 `0건`
  - 승강기 `2.2초` 4단계 통과, 복도 2차선(`±14px`) 및 FIFO 대기열 검증
  - 6명 카운터 NPC `postLock` 고정 + `07/09/18/19시` 교대 중 겹침 `0건`
  - `distanceGait` 누적 변위 기반 `walk-a`/`walk-b` 전환, Cold `<150ms`, tick p99 `<=12ms`, DOM 레이아웃 읽기 `0회`
- **눈에 보이는 변화**: 직원·아이·강아지가 순간이동·소멸 없이 승강기를 타고 내리며 걸음과 바닥 이동 속도가 어색하지 않게 맞는다. 1F 카운터 NPC들이 자연스럽게 교대한다.
- **배포/미리보기**: 회장님 Preview 확인 후 1회 배포.

### 조각 4-2. 대화 안무 (`ALIGN_FACE` · 5단계 FSM · `DialogueSelector` · 지터)
- **바뀌는 파일**: `hani-office-live.js`, `hani-office-live.css`
- **새 시험**: `scripts/hani-building-phase4-choreography.test.mjs`
- **통과 조건**:
  - 회장님뿐 아니라 모든 직원↔직원, 직원↔카운터 NPC, 직원↔아이 대화 시 양측 `ALIGN_FACE` 비율 `100%`
  - 동시 다발 말풍선(동일 층) `<= 2개`, `atByPerson` 기계적 템플릿 출력 `0회`, 동일 대사 `<= 2회/일`, 바리스타 1줄 반복 해소
  - `idleFlavour` 전역 2.4초 동기화 0% (개인 `15~25s` 지터 확인)
- **눈에 보이는 변화**: 대화를 나눌 때 양쪽 모두 서로를 바라보고 2~4턴을 주고받다 끄덕이고 헤어진다. NPC와 직원이 같은 문장만 되풀이하지 않는다.
- **배포/미리보기**: 회장님 Preview 확인 후 1회 배포.

### 조각 4-3. 성격별 행동 (`Micro-Arc` 2~3단계 연속 서사 + 21명 고유 버릇)
- **바뀌는 파일**: `hani-office-live.js`, **(신규)** `data/hani-building/office-behavior-v2.json`
- **새 시험**: `scripts/hani-building-phase4-personality.test.mjs`
- **통과 조건**:
  - 21명+수현·수연 성격 규칙(출근 버릇·휴식·선호 장소·피하는 곳) 100% 로드, `storage` 쓰기 0회, AI 호출 0회
  - 같은 시간대(예: 화요일 15:00 vs 목요일 15:00) 7일간 서로 다른 행동/장소 분포 확인 (변동성 기준 충족)
- **눈에 보이는 변화**: "서윤은 3F에만 박혀 있지 않고 4F·5F를 돌아다니네", "민지는 스튜디오와 옥상에 자주 가네"처럼 **사람마다 사는 방식이 달라 보인다.**
- **배포/미리보기**: 회장님 Preview 확인 후 1회 배포.

### 조각 4-4. 희귀 장면 & 사내 이벤트 반응 (`Rare Scenes` 15종 + `eventReactions`)
- **바뀌는 파일**: `hani-office-live.js`, **(신규)** `data/hani-building/office-rare-scenes-v2.json`
- **새 시험**: `scripts/hani-building-phase4-rare.test.mjs`, `scripts/hani-building-phase4-sim.test.mjs` (7일 전체 통합 시뮬레이션)
- **통과 조건**:
  - 15개 희귀 장면 조건·쿨다운·하루 1회/주간 상한 준수, 수현·수연 장면 100% 가족 중심(경쟁/투표/호감도 0), 대사 전수 `<=30자`, 회장님 호칭 통일
  - `HaniReleaseCatalog`·`HaniIlbo`·`HaniNewsroom4cut` 등 사내 전역 존재 시 read-only 참조, 미존재 시 안전한 no-op
- **눈에 보이는 변화**: 일주일에 1~2번씩 하니·서윤 밤 로드맵 회의, 히나·윤슬 도서관 딴 책 읽기, 수현·수연 아빠 마중 같은 특별한 장면이 터진다.
- **배포/미리보기**: 회장님 Preview 확인 후 1회 배포.

### 조각 4-5. 6F 박물관 (여성 학예사 NPC & 기억 전시)
- **바뀌는 파일**: `hani-office-live.js`, `hani-office-live.css`, **(신규)** `data/hani-building/floor-6f-museum-v1.json`, **(신규) `[그림 필요]`** `assets/building/floor-6f-museum-v1.webp` · 여성 학예사 스프라이트(`npc-curator`)
- **새 시험**: `scripts/hani-building-phase4-museum.test.mjs`
- **통과 조건**:
  - `FloorRegistry`에 `{id:'museum', order:6, code:'6F', label:'6F 박물관'}` 삽입, 기존 `5f` 옥상은 `order:7, code:'7F'`로 안전 승격 (`validateSpatial` 전 층 도달성 PASS)
  - 5개 전시 구역(기초 사료·일보·4컷·역대 퀸·배포 연표) + 6개 읽기 전용 Persistent Slot, `npc-curator`(여성 학예사, 차분한 기록 덕후, `08:00~20:00`) 카운터/안내 동선 연동
  - 직원(`yuri`, `minji`, `hani`, `serin`, `yoonseul`)이 과거 기록을 보고 반응하는 6F 전용 아크 동작
- **눈에 보이는 변화**: 6층에 들어가면 학예사가 박물관을 지키고 있고, 직원들이 과거 일보·4컷·배포 기록 앞에서 회상하거나 검증한다.
- **배포/미리보기**: `[그림 필요]` 배경·학예사 이미지 확정 후 회장님 Preview 확인 → 1회 배포.

### 조각 4-6. 7F 옥상 (계절·감정 이벤트 승격)
- **바뀌는 파일**: `hani-office-live.js`, `hani-office-live.css`, **(신규)** `data/hani-building/rooftop-events-v1.json`, **(신규) `[그림 필요]`** 계절 하늘/조명 오버레이(첫눈·벚꽃·야경·불꽃놀이)
- **새 시험**: `scripts/hani-building-phase4-rooftop.test.mjs`
- **통과 조건**:
  - `7F 옥상`(`id:'5f'`, `order:7`, `code:'7F'`) 계절/시간/생일 트리거 연동, 야간 조명·첫눈/불꽃/생일 파티 2~3인 조용한 대화 발동, `localStorage` 쓰기 0
- **눈에 보이는 변화**: 밤이나 특별한 날(첫눈·생일·배포일) 7F 옥상이 계절감 있는 공간으로 바뀌고 조용한 대화가 열린다.
- **배포/미리보기**: 회장님 Preview 확인 후 1회 배포.

---

## 6. 7일 시뮬레이션 시험 설계

기존 `scripts/hani-building-phase3a.test.mjs` 및 `scripts/hani-building-206-engine.test.mjs`와 동일한 패턴(`fixture()` 가상 DOM/시계, `mount`, `deny` Proxy로 `localStorage`·`sessionStorage`·`indexedDB` 쓰기 차단)을 사용해, **외부 네트워크·브라우저 없이 Node에서 7일(168시간) 연속 가동**을 검증한다.

### 6-1. 테스트 구조 및 실제 API 매핑

- **대상 진입점**:
  - `HaniBuildingScene.floorRegistry()`, `HaniBuildingScene.validateSpatial(...)`
  - `HaniBuildingScene.scheduler.plan(day)` / `blockPlan` / `visitPlan`
  - `HaniBuildingScene.snapshot(...)` (전 층 직원·방문객 스냅샷)
  - `HaniBuildingScene.residents.snapshot(...)` (카운터 NPC 6명 + 자유 배회 주민)
  - `HaniBuildingScene.residents.companionSnapshot(...)` & `createKidsVisits()` (식빵·수현·수연)
  - `mount(document, body)` + `f.setDateTime(...)` + `f.click(floor)` + `f.timers`
- **시간 샘플링**: 월요일 `00:00` ~ 일요일 `23:59`까지 `10초` 간격(`60,480` 틱) + 층 전환 클릭 + 회장님 `MANUAL_ACTIVE` 개입 시나리오 12회 주입.

### 6-2. 8대 PASS 게이트 및 수치 기준

| 게이트 | 검증 방법 (실제 API) | PASS 수치 기준 |
|---|---|---|
| **G1. 전 층 겹침 0 (`zeroOverlap`)** | 매 틱 전 층(`1f~7f`) 모든 정지/비대화 쌍의 art-px 중심 거리 계산 | `< 42 art-px` 위반 **`0건`** (대화 쌍 `38~46px`, 카운터 접점 `>=36px` 예외만 허용) |
| **G2. 순간이동·소멸 0 (`zeroTeleport`)** | 연속 두 틱(10초, 보행 샘플 100ms) 사이 같은 층 좌표 변위 측정 + 층 이동 시 승강기 4단계(`2.2s`) 확인 | 층 내 이동 속도 **직원 `<= 180px/s`, 동행 `<= 240px/s`**, `residentSnapshot` 강제 소멸 **`0건`**, 층간 즉시 점프 **`0건`** |
| **G3. 이중 예약 0 (`zeroDoubleBooking`)** | `Unified Occupancy Ledger` 동일 시각·동일 싱글 슬롯(`postLock`, `client_front`, `studio` 등) 점유자 수 검사 | 동시 다중 점유 **`0건`**, 교대 시간 카운터 겹침 **`0건`** |
| **G4. 층 수용량 준수 (`zeroOverCapacity`)** | 매 틱 각 층의 자유 보행·활동 인원 합산 (`fixed_post` 카운터 NPC는 제외) | 구역·층별 정원(`seat`+`maxRoam`) 초과 **`0건`** |
| **G5. 대화 상호 마주보기 (`mutualFacingInDialogue`)** | `snapshot`/`residents.snapshot` 내 모든 활성 대화(`staffChat`, `deskPartner`, `rareScene`, `client_front`, 회장님)의 `facing` 대조 | 양측이 서로를 향하는 비율 **`100%`**, 동일 층 동시 말풍선 **`<= 2개`** |
| **G6. 대사 반복 & 품위 (`dialogueRepetitionCap`)** | 7일간 모든 발화 수집 후 문장 빈도·길이·호칭·`atByPerson` 잔존 여부 감사 | 동일 대사 하루 **`<= 2회`**, 연속 3회 동일 **`0건`**, 모든 대사 **`<= 30자`**, `"회장님"` 외 애칭 **`0건`**, `atByPerson` 기계적 템플릿 **`0건`** |
| **G7. 일관성·가족 안전·기존 보존 (`legacyAndKidsPreserved`)** | `수현·수연` 장면/행동 감사 + `deny` Proxy로 `localStorage` 차단 + 21명·기존 `homeSeat` 검증 | `수현·수연` 경쟁·투표·호감도 **`0건`**, 스토리지 `setItem`/`removeItem` **`0회`**, 기존 `homeSeat`·`createPresence`·`baristaButton` 정상 |
| **G8. 성능·결정성 (`performanceAndSafetyBudget`)** | Node 타이머 기반 Cold `plan()` 시간 + 프레임 틱 평균/p99 + DOM `getBoundingClientRect` 호출 스파이 + 동일 시드 2회 실행 해시 비교 | Cold `< 150ms`, tick avg `<= 4ms` / p99 `<= 12ms`, 보행 중 레이아웃 읽기 **`0회`**, 동일 날짜·시각 2회 시드 해시 **`100% 일치`** |

### 6-3. 실패 진단 JSON 스키마

실패가 1건이라도 발생하면 콘솔 요약과 함께 재현 가능한 최소 정보를 JSON으로 출력한다:

```json
{
  "gate": "G1.zeroOverlap",
  "seedDay": "2026-11-26",
  "tickSec": 54120,
  "floor": "2f",
  "actors": ["jieun", "haru"],
  "positions": [[642, 318], [668, 324]],
  "distanceArtPx": 26.7,
  "activeStates": ["walking", "standing"],
  "reproSeed": "2026-11-26T15:02:00+09:00"
}
```

---

## 7. 지키는 것 (불변 원칙)

1. **스토리지 쓰기 0 (`hani_os_life_v23` 무접촉)**:
   - 행동 엔진(4-1~4-6), NPC 교대, 희귀 장면, 회장님 개입 상태 모두 **100% 메모리/시드 기반**으로 동작한다.
   - `hani_os_life_v23`는 절대 읽고 덮어쓰지 않으며, 신규 `localStorage` 키도 만들지 않는다. (기존 `hani_office_affinity_v1` 역시 사용자가 직접 클릭한 `isTrusted` 탭 이벤트 외에 행동 엔진이 자동 기록하지 않는다.)
2. **AI / 네트워크 호출 0**:
   - 모든 판단·대화·희귀 장면 선택은 클라이언트 내 정적 JSON 카탈로그와 규칙 엔진으로만 실행한다.
3. **결정적 시드 (`FNV-1a`)**:
   - `fnv1a32(dateKey + '|' + actorId + '|' + eventId)`를 유일한 난수 원천으로 사용한다. `Math.random()`을 쓰지 않아 같은 날짜·시각에 들어가면 누구나 동일한 궤적과 버그 재현이 가능하다.
4. **기존 데이터 파일 무수정**:
   - `data/hani-building/spatial-contract-v3.json`, `art-map-v3.json`, `office-places-v3.json`, `assets/data/office-actions-315.json`, `docs/drafts/staff-chats-v1.json`은 수정하지 않고, 신규 JSON(`office-behavior-v2.json`, `office-rare-scenes-v2.json`, `floor-6f-museum-v1.json`, `rooftop-events-v1.json`)을 추가 계층으로 불러온다.
   - One-Pass 패키지 파일 마감 상한(`max_files: 200`)을 넘지 않도록 조각당 신규 파일 수를 최소화한다.

---

## 8. 위험 표 & 이번에 안 하는 것

### 8-1. 주요 위험 및 완화 대책

| 위험 | 발생 시 영향 | 완화 대책 |
|---|---|---|
| **21명 + NPC 6 + 펫 + 아이 동시 혼잡으로 1F/2F 데드락** | 42px 강제 시 길목에서 멈춰 서서 움직이지 못함 | 층별 자유 보행 상한 설정 + 승강기 FIFO 최대 3명(초과 시 계단/시간 지연) + `600ms` 이상 멈춤 시 자동 목적지 재할당(순간이동 금지) |
| **전 층 `screenFloor` 확대 후 2~4F 틱 부하 증가** | 저사양/모바일에서 버벅임 | **활성 층 컬링**: 현재 화면에 보고 있는 1개 층만 100ms 정밀 계산, 비표시 층은 `500ms`~이벤트 경계 논리 좌표만 갱신 |
| **정면 4프레임 위주 스프라이트에서 마주보기 어색함** | 측면 이미지 없이 기울기(`±4deg`)만으로는 시선 구분이 약할 수 있음 | 4-2에서는 말풍선 꼬리 방향·`--response-lean`·말하는 중 강조로 즉시 개선하고, `[그림 필요]` 항목(측면/앉기/소품)은 이미지 준비 전 기본 포즈 폴백 |
| **`ieum` vs `character-bible-v1` 정본 차이** | 21명(`ieum` 포함)과 19명 문서 간 대사/관계 누락 가능 | 본 v2 설계서는 현재 런타임(`office-actions-315.json` 21명)을 기준으로 `ieum` 행동을 정식 포함하고, 추후 Bible 개정 시 동기화 |
| **`4-5`에서 `5f` 옥상이 `order:6 → 7`로 밀릴 때 기존 anchor 충돌** | `id: '5f'`가 코드 곳곳에 박혀 있어 오작동 위험 | `4-5`에서도 내부 `id: '5f'`는 그대로 유지하고 `order: 7`, `code: '7F'` 표시 메타데이터만 변경 (`checkSpatial` 호환 100%) |
| **테스트가 문자열 포함 여부만 보고 거짓 PASS할 위험** | 실제 화면 겹침/순간이동 미검출 | Section 6의 7일 실제 시뮬레이션 수치 게이트(좌표 거리, 속도 상한, `facing` 일치, `deny` Proxy)로만 PASS 판정 |

### 8-2. 이번에 안 하는 것 (Scope Out)

- **실시간 LLM/AI API 대사 생성**: 비용·지연·오프라인 안정성을 위해 제외(100% 정적 큐레이션).
- **호감도 점수바·인기 투표·직원/아이 경쟁 시스템**: 절대 구현 금지(특히 수현·수연은 100% 가족 서사).
- **NPC(다솜·나래·소담·하람·이슬·은하·학예사)의 조직도 편입 및 사적 호감도**: 카운터 얕은 개성과 한 줄 케미만 유지.
- **회장님 수동 조작(`MANUAL_ACTIVE`)·산책 상태의 `localStorage`/Cloud 영구 저장**: 4단계까지 휘발성 메모리 동작 유지.
- **기존 데이터 파일(`spatial-contract-v3.json` 등) 대규모 개편 및 8방향 풀 애니메이션 전면 교체**: 필요 아트만 `[그림 필요]`로 분리해 점진 투입.

---

## 9. 맨 끝 요약

### 회장님용 쉬운 요약 (5줄)

1. 이음님·수아님·채원님·유나님의 새 자리와 1층 가게·프론트·카페 직원분들까지 모두 반영해, 건물 전체가 하나의 규칙으로 자연스럽게 움직이게 고칩니다.
2. 직원·아이들·식빵이가 서로 부딪히거나 갑자기 순간이동하지 않고, 엘리베이터를 타고 내리며 다리 걸음과 땅 위 속도가 어색하지 않게 맞습니다.
3. 대화를 할 때는 회장님뿐 아니라 직원과 가게 분들끼리도 서로 마주 보고 2~4마디씩 나누며, 같은 말을 자꾸 되풀이하지 않습니다.
4. 서윤은 여러 층을 돌고, 민지는 촬영을 다니고, 나은은 야근자를 챙기는 등 21명 모두가 자기 성격대로 살고, 수현·수연이 아빠를 마중 오는 등 특별한 장면이 일주일에 1~2번 자연스럽게 나옵니다.
5. 기존 생활 기록과 저장 데이터는 단 한 글자도 건드리지 않으며, 7일 연속 가상 테스트를 통과한 뒤 여섯 번의 작은 조각으로 안전하게 보여드리고 확인받겠습니다.

### 한국어 3줄 요약

1. `2.9.308~2.9.315`에서 반영된 `FloorRegistry`, `5F creative`, `1F` 카운터 NPC 6명, 21명 좌석 재배치 현황을 정확히 반영하되, 여전히 남아 있는 전 층 42px 미적용·순간이동 폴백·승강기 점프·비회장님 마주보기 부재·반복 대사·전역 박자 동기화·초기 계산 부하를 통합 원장과 안무/대사 FSM으로 해소한다.
2. `character-bible-v1.md`와 11/23 리뷰를 바탕으로 21명 전원과 수현·수연·NPC의 성격별 행동(신규 그림 필요분 명시)과 15개 희귀 관계 장면을 정의했으며, 기존 데이터 파일 무수정·스토리지 쓰기 0·AI 호출 0 원칙 아래 `4-1`부터 `4-6`(6F 박물관 여성 학예사, 7F 옥상)까지 6단계로 구현한다.
3. 모든 변경은 `fixture()`/`deny` 스토리지 프록시와 `HaniBuildingScene` 실 API를 구동하는 7일 시뮬레이션 8대 게이트(`겹침 0`, `순간이동 0`, `이중예약 0`, `정원준수`, `100% 마주보기`, `반복상한`, `기존/가족 보존`, `Cold <150ms / p99 <=12ms`)로 검증한다.
