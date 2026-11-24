# 대공사 Phase 4 '살아 있는 행동 엔진' 상세 설계서 (구현 전 설계 v1)

- **문서 구분**: HANI 그룹 본사 Phase 4 행동·동선·상호작용·성능·검증 아키텍처 설계서 (구현 전 설계 전용, 운영 파일 미수정)
- **작성**: 세린 연구원 (Gemini)
- **보고 대상**: 성민 대표님(회장님) / 하니 전무님(기획) / 서윤(개발 리드) / 도연 선임님(개발·아트) / 유리 책임(QA) / 아린 선임(UI/UX)
- **기준 저장소**: `floor5art` ([hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-office-live.js) `4,851`줄, [hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-office-live.css) `349`줄, [office-actions-221.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/assets/data/office-actions-221.json), [office-places.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/data/hani-building/office-places.json))
- **연계 설계**: [building-master-plan-v2.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-master-plan-v2.md) §4·§6, [building-creative-floor-v1.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-creative-floor-v1.md) §9~§11, [building-museum-floor-v1.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-museum-floor-v1.md), [chairman-control-v1.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/chairman-control-v1.md), [building-story-pack-v1.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/drafts/building-story-pack-v1.json)

> **회장님 요구 (11/22)**:
> *"직원이나 사람이 많아지니까 행동도 훨씬 많이 구현해야 할 텐데 꼬이지 않게 잘 해줘. 초기 설계 및 제작은 오래 걸리더라도, 구현됐을 땐 문제없었으면 좋겠어. 지금처럼 너무 조악하지 않게 동선이나 동작, 상호 대화나 작용도 잘 구현해줘."*

---

## 목차 (Table of Contents)

- [0. 회장님용 쉬운 요약 (5줄)](#0-회장님용-쉬운-요약-5줄)
- [1. 현재 엔진 구조도 & '조악함' 원인 분석 (실제 코드 줄 근거)](#1-현재-엔진-구조도--조악함-원인-분석-실제-코드-줄-근거)
- [2. 목표 아키텍처 (꼬이지 않는 통합 행동 엔진)](#2-목표-아키텍처-꼬이지-않는-통합-행동-엔진)
- [3. 성능 예산 & Cold 첫날 계획 개선안](#3-성능-예산--cold-첫날-계획-개선안)
- [4. 검증 계획 — 7일 연속 시뮬레이션 시험 설계](#4-검증-계획--7일-연속-시뮬레이션-시험-설계)
- [5. 구현 단계 (작게 쪼갠 5단계 순서 & Preview 지점)](#5-구현-단계-작게-쪼갠-5단계-순서--preview-지점)
- [6. 위험 표 & '이번에 안 하는 것'](#6-위험-표--이번에-안-하는-것)
- [최종 3줄 요약](#최종-3줄-요약)

---

## 0. 회장님용 쉬운 요약 (5줄)

1. **지금은 직원 원장, 펫/NPC, 남매, 수다, 바리스타가 서로 다른 5개의 별도 규칙으로 따로 움직여서** 사람이 늘어날수록 길에서 겹치거나, 대화할 때 서로 안 보고 앞만 보거나, 갑자기 순간이동하는 현상이 생깁니다.
2. **앞으로는 직원·NPC·펫·방문객·남매가 '단 하나의 예약·충돌 원장' 위에서 움직이게** 통일해, 한 사람은 한 시각에 한 장소만 점유하고, 누가 양보할지 서열표(회장님 조작/회의 > 남매 > 이벤트 > 직원 이야기 > 일상/NPC)대로 질서 있게 비켜줍니다.
3. **움직임과 대화를 게임처럼 정교하게 다듬습니다**: 문과 엘리베이터 앞에 대기 줄을 세우고, 복도는 우측통행 2차선으로 비켜가며, 대화를 할 때는 **다가가기 → 서로 마주 보기 → 번갈아 말풍선 주고받기 → 고개 끄덕임 리액션 → 헤어지기** 5단계 안무를 밟습니다.
4. **대사 반복과 첫 화면 버벅임을 함께 잡습니다**: 같은 대사는 하루 최대 횟수와 쿨다운으로 막고(`building-story-pack-v1.json`의 연속 행동·케미·희귀 장면 반영), 앱 켤 때 하루치를 한꺼번에 계산하던 구조를 **100ms 틱은 보이는 층만, 계획은 필요한 시간 창만** 계산하도록 바꿔 휴대폰에서도 부드럽게 돌아갑니다.
5. **구현 전 '7일 연속 시뮬레이션 자동 시험'부터 설계했습니다**: 1주일(60만 초) 동안 매 초 **겹침 0 · 순간이동 0 · 이중 예약 0 · 정원 초과 0 · 마주 보기 100% · 대사 반복 한도 · 수현/수연 보존 · 성능 예산**을 통과해야만 다음 단계로 넘어가며, `hani_os_life_v23` 저장과 AI 호출은 0입니다.

---

## 1. 현재 엔진 구조도 & '조악함' 원인 분석 (실제 코드 줄 근거)

### 1.1 현재 엔진 데이터 흐름도 (As-Is Architecture)

현재 [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-office-live.js)는 **두 개의 거대한 독립 IIFE**(`HaniBuildingScene` 모델 `L222-3858` + DOM 렌더러 `L3860-4849`) 안에 **5갈래의 독립 행동 소유자**가 병존하는 구조입니다.

```text
[정적 카탈로그 · KST 시계]
  ├── office-actions-221.json + office-places.json + spatial-contract.json
  │
  ├─(갈래 1: 정식 일정 원장)─────────────────────────────────────────────────┐
  │   createScheduler.plan(day) [L744-869]                                   │
  │     → 86,400초 전체 기회 정렬 → reserve() [L1325] (clearSweep / 자원 구간) │
  │                                                                          │
  ├─(갈래 2: 외출 · 순찰 · 보고 · 방문객 · 심부름)──────────────────────────────┤
  │   createScheduler.blockPlan(day) [L1450-2009]                            │
  │     → 순찰(4회) → 보고(6회) → 방문객(visitor/2) → 호스트 → 외출 → 심부름      │
  │                                                                          ▼
  ├─(갈래 3: 수다 오버레이)─── createStaffChats().update() [L2182-2260] ──▶ snapshot() [L2025-2178]
  │                               (별도 active 이벤트, 1층씩 순환)           │  + idleFlavour() [L926]
  │                                                                          │  + updateBuilding() [L4570]
  ├─(갈래 4: 상주 펫 & NPC)──── residentSnapshot() [L3712-3772] ─────────────┤  (200ms마다 재투영)
  │                               (자체 free()·residentStops·petPrev 스냅)  │
  │                                                                          │
  └─(갈래 5: 동행 & 남매)────── companionSnapshot() + createKidsVisits() ────┘
                                  [L3291-3362], [L3194-3288]                   │
                                                                               ▼
[단일 100ms 시계: setInterval(..., 100) L4816-4847]
  ├── 200ms마다 updateBuilding(false, false) → DOM 속성/라벨 갱신
  ├── 100ms마다 updateResidents(now) → 펫·NPC·동행·남매·직원수다·트리오 갱신
  ├── 100ms마다 sampleMotion() / moveActor() → actor.style.left/top (%) 덮어쓰기
  ├── 100ms마다 fitBubble(true) / changed 시 fitStatusLabels() (9패스+빔서치)
  └── 4200ms마다 changeOne() [L4848]
```

### 1.2 지금 '조악하게' 보이는 원인 7가지 (실측 코드 줄 근거)

| # | 증상 (회장님 체감) | 실제 코드 원인 & 줄 근거 | 구조적 한계 |
| --- | --- | --- | --- |
| **1** | **사람이 늘면 겹치고 서로를 못 피함** | 직원 원장 `reserve()`(`L1325`)와 주민 `residentSnapshot()`(`L3712`)·동행 `companionSnapshot()`(`L3291`)이 **예약 원장을 공유하지 않음**. `screenOverlap`(`L1227-1238`)은 **`1f`만** 검사(`floor==='1f'`, `L1229, L1260`)하며, `2F~5F`(신설 5F/6F/7F)에는 모바일 발바닥 겹침 방지가 없음. 또한 `travelOrder()`(`L956-972`)는 그룹 내 선후 출발만 맞추고 **서로 다른 그룹·NPC·복도 맞은편 보행자의 교차 회피가 없음**. | 2층 `10명` 합류, 1층 편의점+보안+점원+손님, 5층 크리에이티브 추가 시 복도·문·카운터에서 겹침 급증. |
| **2** | **층 이동·충돌·취소 시 순간이동(Teleport)** | ① **층간 이동**: `travelSeconds()`(`L973`)는 다른 층 간선에 무조건 `1.6초`를 배정하고, `stateAt()`(`L984`)는 출발 층에서 `walking:false, waiting:true`로 세워뒀다가 1.6초 뒤 도착 층에 **즉시 출현**. 엘리베이터 탑승·도착 연출 없음.<br>② **`slewCompanion()` 폴백 버그(`L3710`)**: `companionSafe` 검사가 연속 실패하면 **`return {position: to, moved: false, dx}`로 목표 좌표에 1프레임 만에 순간이동**.<br>③ **주민/펫 스냅(`L3759-3764`)**: `holdStart` 유예 `2500ms` 초과 후 `free()`가 false면 `fallback` 스팟으로 점프하거나 `return []`로 소멸.<br>④ **`kid-suyeon` 뒤집기 점프(`L3308`)**: 회장님이 걷기 시작하면 `behind` 부호가 `-1`로 즉시 반전되어 뒤↔앞으로 목표점이 196px 점프.<br>⑤ **`kidsVisits` 즉시 삭제(`L3263`)**: 회장님이 걸으면 진행 중이던 남매 방문을 `active=null`로 즉시 끊어 원위치 스냅.<br>⑥ **`selectFloor()`(`L4748`)**: 층 탭 전환 시 `finishTravel()`(`L3924`)이 이동 중인 배우를 좌석에 즉시 스냅. | 동선이 자연스럽게 이어지지 않고 "뿅 사라졌다 나타남"으로 보임. |
| **3** | **대화할 때 서로 안 보고 정면만 봄** | `snapshot()`(`L2176`)에서 `p.facing` 마주 보기 회전은 **`if(p.deskPartner && (p.id==='seongmin' || p.deskPartner==='seongmin'))`일 때만** 실행됨! 일반 직원 간 `deskPairs`(`L2089-2098`), `gathering`(`L2129-2135`), `group`(`L2068`), `staffChats`(`L2182`)에서는 서로를 마주 보지 않음. 심지어 `hani-office-live.css:182-183`의 `data-facing`은 `-4deg`/`4deg` 기울기뿐이며, 걷기 중엔 `rotate:none`(`L188`)으로 꺼짐. | 2명이 수다를 떨어는데 둘 다 화면 앞을 보고 혼잣말하는 것처럼 조악함. |
| **4** | **반복 대사 & 기계적 치환** | ① `office-places.json`(`L286-394`)의 `atByPerson` 다수가 `"<장소>에서 <직무> 이야기 메모 중"` 기계적 치환.<br>② `idlePools`+`extraIdle`(`L875-914`)을 전 직원이 공용 순환하고 `idleFlavour()`(`L926-952`)에 **하루 반복 한도/최근 대사 기억 링이 없음**.<br>③ `placeLine()`(`L2015-2024`)은 90초 초과 체류 시 중간에 딱 1번만 대사를 바꿈.<br>④ `staffChatLines`(`L464-508`) 43종 외에는 도착 후 상호작용 턴 안무가 없고, 전역 말풍선 `#actorBubble`(`L4039`) 1개만 쓰므로 자동 말풍선·탭·수다·트리오가 서로 말풍선을 빼앗고, 차단되면 `staffChats.cancel()`(`L2234`) 후 말없이 복귀 시각까지 서 있음. | 몇 분만 보고 있어도 같은 문장이 계속 돌고, 여러 명이 모였을 때 대화가 살아있는 느낌 부족. |
| **5** | **동시 출발·군무 동기화** | `idleFlavour`의 고정 `BEAT=2.4s`, `ACTIVE_BEATS=4.5`(10.8s), `MIN_CYCLE=12`(`L874`), `blockPlan`의 `at+=180` / `45` 격자(`L1869`), `residentLife`의 `period=6s, slot*2` 교대 박자(`L3515-3516`), `snapshot()`의 `Math.floor(seconds*5)%2` 보행 프레임(`L2083`)이 고정 시계에 묶여 여럿이 같은 박자로 움직이고 멈춤. *(참고: 최근 11/21 모션 다듬기로 `distanceGait` `step=45` `L3797`, `easeRun` `L311`, `compileCurve` `L319`, `companionActivity` 전체 경로 `petEase` `L3408`, CSS `left/top .1s linear` `hani-office-live.css:348`는 개선되었으나, 정면 전용 4프레임 아틀라스 `manifest-v3.json:6` 및 위 동기화 문제는 잔존.)* | 여러 직원이 로봇처럼 같은 타이밍에 섰다 앉았다 함. |
| **6** | **단일 행동(1-Step) 위주 & 사내 맥락 단절** | 일반 직원은 대부분 `홈 → 장소 → 홈` 1단계 왕복뿐이며, `building-story-pack-v1.json`이 설계한 **2~3단계 시퀀스(`microArcs`), 단짝 외출(`buddyOutings`), NPC 케미(`chemistries`), 사내 이벤트 반응(배포/일보/시황4컷/퀸/생일/계절), 희귀 장면(`rareScenes`)**을 연결할 상태 머신이 없음. | 수현·수연(`companionActivity` 6종+특수포즈 4종+4줄 티키타카+10% 희귀대사)에 비해 일반 직원 20명의 서사 밀도가 크게 낮음. |
| **7** | **Cold 첫날 계획 성능 임계치 초과 위험** | `artifacts/fix278/REPORT.md`(`L11-17`) 실측상 현재 5층+20명 상태에서도 `lively-v2` 성능이 **`324.4~340.4ms` (개별 최대 `429.6ms`, 합격선 `<400ms`)**. `plan()`/`blockPlan()`이 하루 `86,400초` 전체의 모든 외출·심부름·스위프 경로를 Cold에 한꺼번에 풀고(`L744-869`, `L1450-2009`), `updateResidents()`가 매 틱 실행되며, `fitStatusLabels()`가 9패스+빔서치(`L2390-2420`)와 `getBoundingClientRect()`를 반복 호출함. | 직원·NPC·층(6~7층)이 늘면 휴대폰에서 Cold 400ms 초과 및 100ms 틱 드랍 확실. |

---

## 2. 목표 아키텍처 (꼬이지 않는 통합 행동 엔진)

설계의 핵심은 **"새로운 레이어를 덧대지 않고, 기존 `HaniBuildingScene` 안에 4개의 책임이 분리된 결정적 모듈 계층을 세우는 것"**입니다.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Data & Registry Layer (무저장 · 정적 JSON)                              │
│    FloorRegistry · Room/Seat/DialogueSlot · VoiceProfile · StoryPack    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. Unified Occupancy & Priority Ledger (통합 예약·점유 원장)               │
│    1인 1시각 1장소 · 좌석/방/코어 정원 · P0~P7 우선순위 & 안전한 양보         │
└───────────────┬───────────────────────────────┬─────────────────────────┘
                ▼                               ▼
┌───────────────────────────────┐ ┌───────────────────────────────────────┐
│ 3. Spatial & Congestion Layer │ │ 4. Choreography & Dialogue Layer      │
│  - 복도 2차선 우측통행 오프셋    │ │  - 5단계 안무 FSM (다가가기→마주보기→     │
│  - 문/엘리베이터 대기열 슬롯     │ │    턴제말풍선→리액션→헤어지기)            │
│  - 전 층 최소 거리(42px) 그리드 │ │  - 대사 쿨다운/하루 N회 제한 링           │
│  - 2.2s 승강기 탑승/하차 연출   │ │  - Micro-Arcs(2~3스텝) & 희귀장면 게이트 │
└───────────────┬───────────────┘ └───────────────┬───────────────────────┘
                └───────────────┬─────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. View-Culled 100ms Clock & Persistent DOM Slot Renderer               │
│    보이는 activeFloor만 좌표/애니메이션 샘플링 · rAF 선택 보간 · 쓰기 0      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 통합 예약·점유 모델 (`Unified Occupancy Ledger`)

직원(`staff`), 상주 NPC(`npc`), 상주 펫(`pet`), 동행(`companion`·`kid`), 외부 방문객(`visitor`) **모두가 동일한 점유 원장 레코드**를 사용합니다. (단, 데이터·친밀도·명부 소속 플래그 `kind`는 엄격히 분리 유지)

#### A. 3대 불변식
1. **1인 1시각 1장소 (`perActorMaxConcurrent === 1`)**: 임의의 시각 `t`에서 `actorId`는 오직 하나의 `ActivityToken`과 하나의 물리 위치(`floorId`, `anchorId` 또는 `walkSegment`)만 소유합니다.
2. **장소·좌석·대화석 정원 (`Slot Capacity`)**:
   - **단일 좌석/콘솔 (`desk`, `counter`, `ramen_seat`, `treadmill`, `mat`, `cushion`)**: `capacity: 1`. `owner`가 지정된 홈 데스크는 본인 외 점유 금지(기존 `L424, L638` 유지).
   - **대화석 (`DialogueSpot`)**: 2인/3인 상호작용 시 `hostAnchor` 1개만 잡는 것이 아니라 **쌍/삼인 슬롯 묶음(`[slotA, slotB]` 또는 `anchor + approachOffset`)을 원자적으로(Atomic) 예약**해 제3자가 대화 중간에 끼어들지 못하게 차단.
   - **방(`room.capacity`) 및 층(`floor.maxCapacity`)**: 상한 초과 시 신규 P4~P6 예약 거부(`reject`, 텔레포트 재시도 금지).
3. **종류별 접근 제어 (`access`)**: 기존 `visitor`는 `1f` 공용/상업 구역(`access: 'public' | 'all'`)만 허용, `5f/6f/7f` 및 업무층 출입 금지. `mir`는 음식 섭취/의자 착석 액션 제외(`pose: 'stand'` 고정, `L635`).

#### B. 우선순위 서열표 & 충돌·양보(Preemption) 규칙

높은 계층(낮은 P 번호)이 낮은 계층과 **동일 인물 또는 동일 1인 슬롯**에서 충돌하면, 낮은 계층이 양보합니다.

| 우선순위 | 계층 이름 | 포함 대상 | 충돌 시 처리 & 양보 프로토콜 (텔레포트 0 보장) |
| --- | --- | --- | --- |
| **P0** | **시스템 잠금 · 재실 경계** | `login-locked`, `ABSENT`, 심야 `02:00~06:59`(심야 5인·은하·야간점원 외 퇴근) | `02:00` 경계에 걸리는 신규 예약 자체를 원장에서 거부(`presentAt(id, end-.001)` 계승). 잠금 발생 시 즉시 비표시. |
| **P1** | **회의 소집 & 회장 직접 조작** | `Agent Case`(`SUMMONING`/`meeting`), 회장님 `MANUAL_ACTIVE` (`chairman-control-v1.md`) | ① **회의 소집**은 회장님 수동 조작(`MANUAL_ACTIVE`)마저 `AUTO`로 되돌리고 최우선 집결.<br>② 소집된 직원이 P3~P6에 있으면 즉시 `abortChoreography()` 호출 → **현재 위치에서 바로** 회의실/엘리베이터로 경로 재탐색(스냅 0).<br>③ 회장 수동 조작 중에는 자동 `staffChats`·자동 바닥 말풍선 차단. |
| **P2** | **수현·수연 남매 & 동행** | `kidsVisits`, 주말/평일 18~22시 남매, 회장 강아지 동행 | ① 회장님이 정지 중일 때 P4~P6보다 우선해 직원/펫에게 다가감. 피방문 직원이 P4/P5 외출 출발 직전이면 대기(`yield`).<br>② 회장님이 걷기 시작하면 남매는 `active=null` 삭제 대신 **`cancel(now)` 귀환 경로를 따라 회장님 대열로 걸어 복귀**(`L3259` 개선). |
| **P3** | **사내 이벤트 & 회장 순찰/보고** | 회장 `ownerEvents`(간식/야식/회식/생일), `patrol`, `report`, `office-actions` `layer:3` 정식 장면, **희귀 장면(`rareScenes`)** | 회장 `patrol`/`report`와 정식 `layer:3` 장면을 일일 원장에 먼저 고정. 동일 인물/좌석을 점유한 P4~P6는 예약 단계에서 탈락하거나 출발 전 취소. |
| **P4** | **직원 서사 & 상호작용** | **`Micro-Arcs`(2~3스텝 고유 행동)**, **`buddyOutings`(단짝 외출)**, `staffChats`(43종+), **`deskDropBy`(동료 자리 12초 질문/장난)** | `P0~P3`이 이미 점유한 인물/슬롯이면 다른 후보 쌍/슬롯으로 우회, 대안 없으면 깔끔히 skip. `45분(2700s)` 비업무 / `90분(5400s)` 타층 이동 불변식 준수. |
| **P5** | **일반 휴식 · 심부름 · 방문객** | `base-coffee`, `cafe`, `convenience` 들름, `errand`, `visitor` / `visitor-2` | P1~P4의 잔여 정원과 좌석만 사용. 1F 호스트(`sua`, `taeo`)가 `2F`로 이주해도 `visitor` 접수는 `errand` 원장 우선순위로 안정 예약. |
| **P6** | **NPC 일과 & 순찰** | 편의점 점원(주/야), 보안원, 스튜디오 스태프, 트레이너, 사서, 학예사, 청소부, 정원사, 알바 3명 | 자기 거점 슬롯은 전용(`owner` 격리)이라 직원과 안 겹침. 순찰 중 직원/남매/회장님과 통로가 겹치면 **NPC가 0.5초 비켜 서거나 양보 인사** 후 이동. |
| **P7** | **기본 근무 / 펫 기본 쉼터** | `base-work`(홈 데스크), 펫 기본 쿠션 | 위 P0~P6 일정이 없을 때의 기본 복귀 상태. |

> **양보 시 텔레포트 금지 원칙**: 어떤 우선순위 인터럽트도 이미 화면에 보이는 액터의 좌표를 1프레임 만에 바꿀 수 없습니다. 인터럽트 시점에 엔진은 현재 화면 좌표 `curPos`를 시작점으로 삼아 새 목적지(복귀 자리 또는 소집 장소)까지 `walkGridRoute` / `route` 경로를 즉시 생성합니다.

---

### 2.2 동선·혼잡 제어 (겹침 0 · 대기열 · 양방향 비켜가기 · 승강기 연출)

#### A. 전 층 공통 최소 거리 불변식 (Same-Cell Ban)
- 기존 1F 전용 `screenOverlap`(`L1237`)을 **모든 층(`1F~7F`)**으로 일반화합니다.
- **최소 이격 거리 (`1672×941` 아트 픽셀 기준)**:
  - **보행 ↔ 보행 / 보행 ↔ 정지(서기)**: 중심 간 유클리드 거리 **`>= 42 art-px`** (342px 휴대폰 맵에서 약 `8.6px` 이상, 몸폭 30px 기준 얼굴/몸통 완전 분리; Y차가 `>= 44 screen-px` 즉 `>= 215 art-px` 이상으로 위아래 층위가 다를 때는 X가 가까워도 겹치지 않는 것으로 간주할 수 있으나, **같은 복도/방 동일 Y선상(`|dy| < 48 art-px`)에서는 `|dx| >= 44 art-px` 강제**).
  - **남매/펫 안전 반경**: 기존 `companionSafe`(`L2506`) 및 `kidsVisits`(`L3208`: 회장 `78px`, 타인 `82px`)·`residentSnapshot`(`L3723`: `96~100px`) 그대로 보존.
  - **좌석 착석(`sitting`) 예외**: 이미 `art-map-v1.json`으로 검증된 인접 책상 의자 간 거리는 고정 홈(`homeAnchor`)으로 인정하되, **비좌석 임시 스팟(대화석·관람석·편의점 매대)은 서로 `>= 46 art-px` 이격**된 앵커만 등록.

#### B. 문(`door_*`) 및 엘리베이터(`elevator_*`) 대기열 (Slot Queue)
현재는 여러 명이 같은 문이나 엘리베이터를 동시에 통과하려 할 때 겹쳐서 통과하거나 `1.5s` 고정 스태거만 둡니다(`L1703`). 이를 **자원 점유 큐(FIFO Slot Queue)**로 교체합니다.

1. **문 통과 게이트 (`doorWidth = 44`)**:
   - 문 1개당 동시 통과 정원 `capacity = 1` (단, 동일 방향 직렬 통과 간격 `0.5s`).
   - 문 양쪽(`corridorSide`, `roomSide`)에 각 2칸의 대기 스팟(`door_<room>_q1`, `door_<room>_q2`, 문턱에서 `44px`, `88px` 뒤)을 자동 도출.
   - 선행 액터가 문을 통과 중(`0.5s` 구간)이면 후발 액터는 `q1` → `q2` 슬롯에 `standing` 자세로 잠시 멈춰 기다렸다가 문이 비면 순차 통과.
2. **엘리베이터 홀 대기열 (`elevator_<floor>`)**:
   - 승강기 1대 동시 탑승 정원 `4` (`spatial-contract.json` `capacity: 4` 준수).
   - 문 앞(`elev_door`), 대기 슬롯 4칸(`elev_wait_1..4`: 문 좌우·전방 `44px` 격자)으로 분리해 여러 명이 엘리베이터를 기다릴 때도 나란히 서서 기다림.

#### C. 복도 양방향 비켜가기 (Corridor Lane Offset + Local Sidestep)
- **고정 2차선 차선 오프셋(Lane Bias)**:
  - **가로 중앙 복도**(`1F~7F` 공통 밴드): 경로 웨이포인트가 복도 구간(`corridor_*`)을 지날 때, 진행 방향 벡터 `dx`의 부호에 따라 Y좌표를 자동 오프셋합니다.
    - `dx > 0` (좌→우 이동): **`y + 14 art-px`** (아래쪽 차선)
    - `dx < 0` (우→좌 이동): **`y - 14 art-px`** (위쪽 차선)
  - **세로 복도/홀**(`2F~7F` `x ≈ 47%~55%`): 진행 방향 `dy`의 부호에 따라 X좌표 오프셋 (`dy > 0` 하행: `x - 12 art-px`, `dy < 0` 상행: `x + 12 art-px`).
  - 효과: 복도에서 마주 오는 두 사람이 **별도 회피 계산 없이도 자연스럽게 서로 비껴 지나감(28px 횡간격 확보)**!
- **단거리 로컬 비켜섬 (Local Sidestep)**:
  - 100ms 틱에서 보이는 층 내 두 보행자의 향후 `0.6초` 예측 위치 거리가 `< 44 art-px`이고 진행 방향이 마주 보거나(내적 `< -0.3`) 추월 중이면:
    - 우선순위 낮은 쪽(P 숫자 큰 쪽, 동순위면 `id` 큰 쪽)이 `0.5초`간 정지(`sidestepWait`)하거나 수직 법선 방향으로 `±20 art-px` 안전 여백 내 슬라이드 회피.
    - `2.5초` 이상 교착되면(양쪽 모두 막힘) 한쪽이 가장 가까운 비어 있는 대기 노드(`junction`)로 1칸 양보.

#### D. 층 이동 연출 (엘리베이터 도착·출발 4단계 · 총 2.2s)
기존 `L984`의 `1.6초 정지 → 뿅 소멸/출현`을 아래 4단계 연속 연출로 대체합니다.

| 구간 | 시간 | 물리 층 | 시각/포즈/상태 |
| --- | --- | --- | --- |
| **1. 호출·대기** | `0.0 ~ 0.5s` | 출발 층 (`from`) | `elev_wait` → `elev_door` 앞 도착, `standing`, 상태 `"승강기 기다리는 중"` |
| **2. 탑승·문 닫힘** | `0.5 ~ 1.1s` | 출발 층 (`from`) | 승강기 내부 슬롯(`elevator_cab`, `y - 8px`)으로 0.4s 진입하며 `opacity: 1 → 0` + `scale: 1 → 0.94` 페이드 아웃 |
| **3. 승강기 이동** | `1.1 ~ 1.6s` | `TRANSIT` (비표시) | 양쪽 층 모두 `hidden = true` (겹침 0). 선택적으로 엘리베이터 위 작은 층 표시기(`▲ 5F`) 점등 |
| **4. 도착·하차** | `1.6 ~ 2.2s` | 도착 층 (`to`) | `elevator_<to>` 문 안쪽에서 `opacity: 0 → 1` 페이드 인하며 `elev_wait` 앞 `44px` 지점으로 걸어 나옴(`walk-a/b`) |

*(참고: `prefers-reduced-motion: reduce` 모드에서는 1~4단계 애니메이션 없이 즉시 목적 층 승강기 앞 안전 위치로 전환.)*

---

### 2.3 상호작용 안무 (Choreography 5단계 상태 기계)

직원 간 대화(`staffChats`, `buddyOutings`, `deskDropBy`), 직원 ↔ NPC 케미(`chemistries`), 회장님 근접 대화(`chairman-control-v1`), 남매 방문(`kidsVisits`)을 모두 **공통 안무 엔진 `ChoreographySession`**으로 통합합니다.

```text
[APPROACH] ──(양측 도착 & 거리 48~96px 확보)──▶ [ALIGN_FACE]
     │                                               │
 (상위 P0~P2 인터럽트)                          (0.25s 시선 맞춤)
     ▼                                               ▼
  [ABORT] ◀──(중간 취소)── [REACTION_POSE] ◀── [EXCHANGE_TURNS]
     │                           │              (턴별 화자 전환 · 2.0~3.2s)
     └──────────┬────────────────┘
                ▼
            [DISPERSE] ──(원래 경로 복귀 or 새 목적지 이동)
```

1. **`APPROACH` (다가가기)**:
   - **동반 외출/대화석 형**(`buddyOutings`, `cafe`/`convenience` 수다): 두 사람이 각자 예약된 대화석 2인 슬롯(`[slotA, slotB]`)으로 걸어감. 먼저 도착한 사람은 상대 쪽을 보며 `standing`/`sitting`으로 대기(`"기다리는 중"`).
   - **방문형**(`deskDropBy`, `chemistries`, `kidsVisits`): 상대(`target`)는 자기 자리에 머물고, 방문자(`initiator`)가 상대의 **비어 있는 인접 접근 노드(`approach_slot`, `56~88 art-px` 거리)**까지 걸어감. (노드가 타인에게 막혀 있으면 인접 대안 4방향 중 `companionSafe` 통과 지점 선택, 모두 막히면 취소).
2. **`ALIGN_FACE` (서로 마주 보기 — 전 인원 의무화)**:
   - 기존 `L2176`의 회장님 한정 조건을 제거하고, **모든 안무 세션에서 양측 `data-facing`을 X좌표 기준으로 강제 정렬**:
     - `actorA.x < actorB.x` → `actorA.dataset.facing = 'right'`, `actorB.dataset.facing = 'left'` (동일 X열에 세로로 섰을 때는 각자 직전 방향 유지 또는 우/좌 엇갈림 배치 방지 위해 `APPROACH` 단계에서 X좌표가 최소 `32px` 이상 어긋난 슬롯을 선택!).
   - 아틀라스에 좌/우 프레임이 있는 개체(펫·남매·4방향 확장 캐릭터)는 실제 좌/우 바라보는 프레임을 출력하고, 정면 4프레임만 있는 직원은 `data-facing` CSS 기울기(`±4deg`, `hani-office-live.css:182-183`) + 대화 시 상체 반응(`lean` 방향을 상대 쪽으로, 기존 `L4621` `--response-lean` 일반화)을 적용.
3. **`EXCHANGE_TURNS` (말풍선 순서 · 턴제 연출)**:
   - **한 층 동시 활성 대화 1쌍 제한**: 화면이 산만해지지 않도록 현재 `activeFloor`에서 동시에 말풍선 대화를 진행하는 쌍은 최대 1쌍으로 제한(대기 중인 쌍은 `APPROACH` 후 조용히 `standing` 상태 아이콘만 띄우거나 턴 대기).
   - **턴 타이밍**: 턴 `i` 지속 시간 = `clamp(2000, 1400 + text.length * 55, 3200)` ms.
   - **화자 강조**: 턴 `i`의 화자만 `data-speaking="true"`, `actorBubble`이 화자의 머리 위(`fitBubble`)로 이동해 대사 출력 + 화자는 `tap` 또는 `lean` 1회, 청자는 `0.3s` 뒤 `nod` 1회 리액션(`createReactions`, `L3825` 패턴 확장!).
4. **`REACTION_POSE` (리액션 포즈 · `0.7s`)**:
   - 대화 종료 직후 양측이 짧은 여운 포즈(`nod`, `tap`, 펫은 `hop`/`wag` + 하트, 수연은 `wave`)를 취해 대화가 뚝 끊기지 않게 마무리.
5. **`DISPERSE` (헤어지기 & 중간 취소 `ABORT`)**:
   - 정상 종료 시: `0.3s` 간격으로(`L2223` `i * 1.6` 시차) 각자 홈 또는 다음 시퀀스 스텝으로 `RETURNING`.
   - 중간 취소(`ABORT`) 시: P0/P1/P2 인터럽트나 사용자 말풍선 닫기(`closeBubble(explicit=true)`) 시 즉시 `activeDialogue`를 닫고 점유 슬롯 해제 후 **현재 좌표에서 즉시 경로 재계산**(텔레포트 0).

---

### 2.4 대사 시스템 (대사 풀 · 쿨다운 · 하루 반복 제한 · 말투)

[building-story-pack-v1.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/drafts/building-story-pack-v1.json)과 기존 `office-tap-lines-v1.json`, `office-drama-v1.json`, `staffChatLines`를 통합하는 계층형 대사 선택기 `DialogueSelector`를 둡니다.

#### A. 대사 선택 우선순위 (4단계)
1. **사건·이벤트·희귀 장면 대사 (`Priority 1`)**:
   - `rareScenes`(확률 3~5%, `cooldownDays: 3~7일`, 하루 전사 최대 1~2건).
   - 사내 신호 반응(`eventReactions`): 오늘 배포(`HaniReleaseCatalog` 날짜=오늘), 일보 발행일, 금요일 4컷, 퀸 시즌(매월 25일~말일), 직원 생일(`staffBirthdays`), 계절(`12월 xmas`, `1~2월 THAW`).
   - 탭 시 기존 `office-drama-v1.json` 1일 1회 드라마 대사 우선 규칙(`L197-204`) 100% 유지.
2. **안무·관계 대사 (`Priority 2`)**:
   - `microArcs` 스텝 대사, `buddyOutings`(15종+), `staffChats`(43종+), `npc.chemistries`, `kidsVisitLines`(29종).
3. **장소·시간·성격 혼잣말 (`Priority 3`)**:
   - 기계적 `"<장소>에서 <직무> 이야기 메모 중"` 치환을 제거하고, **① 개인 `deskVoice` + ② 장소별 개인 반응(`place.linesByPerson` 예: 편의점 컵라면 도연/서윤/미르) + ③ NPC `monologues` + ④ 시간대별 `idlePools`(`day/evening/late/lounge`)**에서 선택.
4. **기본 직무 fallback (`Priority 4`)**: `workLines[id]`.

#### B. 반복 제한 & 쿨다운 규약 (메모리 전용 링버퍼)
- **일일 반복 한도 (`dailyMax`)**:
  - `rareScenes`: **하루 최대 1~2회**(전사 합산), 동일 `sceneId`는 KST 날짜 해시로 **`cooldownDays`(3~7일) 이내 재등장 금지**.
  - `buddyOutings` / `staffChats` / `npc.chemistries`: 동일 쌍·동일 대화 ID **하루 최대 1회** (`pairDailyMax <= 2`, 동일 `chatId`는 `uses.get(id) === 0` 우선).
  - 일반 `deskVoice` / `idlePools` / `npc.monologues`: **동일 `lineId` 하루 최대 2회**(기본값), **같은 사람 연속 동일 대사 0회**(`recentActorLines[id]` 직전 5개 배제), **같은 층 동시 화면 중복 0회**(`shownLines` 계승 `L2145-2156`).
- **최소 재말하기 쿨다운 (`actorSpeechCooldown`)**:
  - 동일 직원의 자동 혼잣말(`idleFlavour`) 간격에 캐릭터별 **비대칭 지터(Jitter)** 부여!
    - 기존의 획일적 `BEAT=2.4s` 전 층 동기화 대신, 각 인물별 주기 `period = 14 + seed(day|id)%11`초 + 개인 위상 `phase = seed(id)%period`를 사용해 **한 층 안에서도 제각각 자연스러운 리듬으로** 말하고 동작함(수현·수연 `residentRhythm` `L3458`의 성공 비결을 전 직원에 적용).
- **문장·표현 불변식**:
  - 모든 대사 **공백 포함 30자 이내** (모바일 390px 2줄 클램프 준수), 개행 금지, 외모/체형/연애 묘사 금지, 남매 경쟁/투표/친밀도 편입 금지.
  - 직원별 말투 시그니처(`voiceProfiles`) 보존: 하니(`♡`), 서윤(`💜`/`정리하면`), 도연(`☕`/`재현`/`통과요`), 세린(`!!`/`📊`/`✨`/`패턴`), 유리(`~입니다`/`PASS ✅`), 아린(`✨`/`🎨`/`숨 쉬게`), 다온(`혹시…😅`), 윤슬(`이거 아세요? 📚🔖`), 히나(`~용♡🐰`), 미르(`왜?`/`연결되네`/`헤헤`), 이음(`…맞죠?`/`이어볼게요`), 수아(`ㅎㅎ`/`기한 내`), 채원(`~입니다`/`세 가지`).

---

### 2.5 NPC 일과 & 교대 규칙 (직원 엔진과 동일 규칙 위에서)

[building-master-plan-v2.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-master-plan-v2.md) §4 및 [building-museum-floor-v1.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-museum-floor-v1.md) §5의 NPC들을 별도 예외 루프(`residentSnapshot`)로 떼어두지 않고, **통합 엔진의 `kind: 'npc'` 프로파일**로 수용합니다.

| NPC ID | 명칭 | 층 · 구역 | 출현 시간 (KST) | 일과 & 동선 | 데이터 격리 |
| --- | --- | --- | --- | --- | --- |
| `npc-conv-day` | 편의점 점원 (주간) | `1F` `convenience` | `07:00~19:00` | 계산대 상주 + 냉장고/진열대 순회 정리 + `19:00` 야간 점원과 1턴 교대 인사 후 `arrival_gate` 퇴장 | `resident="npc"` · 명부/친밀도/투표 **제외** |
| `npc-conv-night` | 편의점 점원 (야간) | `1F` `convenience` | `19:00~07:00` | 야간 물류 정리 + 컵라면 온수 체크 + 심야 5인 케미 + `07:00` 주간 점원과 교대 퇴장 | 동일 |
| `npc-security` | 로비 보안·안내원 | `1F` `lobby` | `08:00~22:00` | `arrival_gate` ↔ 로비 ↔ `parcel_box` ↔ 편의점 앞 순찰 루프 (P6 양보) | 동일 |
| `npc-studio-crew` | 스튜디오 스태프 | `5F` `studio` | `08:30~17:30` | 카메라/조명 체크, 촬영 직원(`minji`, `hani`, `jieun`) 입장 시 케미 턴 진행 | 동일 |
| `npc-trainer` | 웰니스 트레이너 | `5F` `fitness` | `12:00~13:30`, `18:00~20:30` | 매트/러닝머신 점검, 운동 방문 직원과 코칭 케미 | 동일 |
| `npc-librarian` | 도서관·시네마 사서 | `5F` `library_cinema` | `10:00~19:00` | 서가 정리·시네마 조명 준비, `yoonseul`·`hina`·`arin`과 책/영화 케미 | 동일 |
| `npc-curator` | 박물관 학예사 *(6F 신설 시)* | `6F` `museum` | `08:00~20:00` | 안내대 ↔ 4전시실 저속 순회, 주말 남매/직원 안내 | 동일 |
| `npc-cleaner`, `npc-gardener`, `npc-temp-a/b/c` | 기존 상주 NPC 5인 | `1F~6F/7F` | 기존 시간표 유지 (청소부에 `5F`/`6F` 순회 추가) | 통합 점유 원장(겹침 0, 대기열) 규칙으로 편입 | 동일 |

- **교대 전환 무순간이동**: `07:00`, `19:00` 등 교대 시각 3분 전에 후임이 `arrival_gate`에서 걸어 들어와 거점 앞에서 전임과 1~2턴 교대 인사 안무를 수행한 뒤, 전임이 `arrival_gate`로 걸어 나가며 퇴장합니다. (앱을 교대 시각 한가운데에 켰을 때는 이미 해당 시간대 점원만 배치).
- **기존 `iseul`/`eunha`(바리스타) 보존**: 두 바리스타는 `hani_office_affinity_v1`에 이미 포함되어 있으므로(`L116-117`) 기존 `baristaButton` 및 친밀도 경로를 그대로 유지하고, 케미 대화 안무에만 참여합니다.

---

### 2.6 결정적(Deterministic) · 저장 0 · AI 호출 0 규약

1. **시간·시드 결정성**: `Math.random()`, `crypto.randomUUID()` 사용 전면 금지. 모든 확률/순서/대사 선택은 FNV-1a `seed(kstDay + '|' + contextKey + '|' + actorId)`로 결정. 같은 KST 날짜·시각과 같은 재실 조건으로 시뮬레이션을 두 번 돌리면 **바이트 단위로 동일한 결과**를 보장(`deterministicReplay`).
2. **저장소 0원칙**:
   - `hani_os_life_v23`: 읽기·쓰기·삭제 **전부 금지**(단, 박물관/이야기조각의 읽기 전용 투영도 `state` 직접 변이 금지).
   - `hani_office_affinity_v1`: 기존 `createOfficeAffinity()`(`L90-166`)의 `isTrusted` 사용자 클릭/Enter 경로만 유지. 행동 엔진 자체는 `localStorage` / `sessionStorage` / Supabase에 단 1바이트도 쓰지 않음.
3. **AI 호출 0**: 모든 대사·시퀀스·케미·희귀 장면은 정적 JSON/코드 카탈로그에서 조합(토큰 비용 `0원`, 오프라인 동작 100%).

---

## 3. 성능 예산 & Cold 첫날 계획 개선안

현재 `artifacts/fix278/REPORT.md`의 `lively-v2` 실측 **`324.4~340.4ms` (단일 최대 `429.6ms`, 합격선 `<400ms`)** 상태를 개선하여, **직원 20명 + NPC 10명+ + 6~7개 층**으로 커져도 휴대폰(`390px`)에서 쾌적하게 돌도록 다음 예산과 아키텍처를 확정합니다.

### 3.1 성능 수치 목표 (Performance Budget)

| 항목 | 현재 상태 (`5층 · 20명`) | 목표 예산 (`6~7층 · 30명+`) | 측정 기준 |
| --- | --- | --- | --- |
| **Cold 1일 계획 초기화 (`plan` + 초기 청크)** | `324.4 ~ 340.4ms` (최대 `429.6ms`) | **best-of-three `< 150ms`**, 단일 최대 `< 220ms` | Node 벤치마크 3회 |
| **100ms 틱 연산 시간 (`tick`)** | 비가시 층 포함 전수 루프 + 수시 `fitStatusLabels` | **평균 `<= 4ms`**, **p99 `<= 12ms`** | 보이는 층 10명 동시 보행 기준 |
| **틱 내부 Layout Read (`getBoundingClientRect`)** | `changed=true` 시 매 틱 `fitStatusLabels` 실행 가능 | **보행/일반 틱 내 `0회`** (디바운스 배치 전용) | DOM 더블 계측 |
| **메모리 상한 (세션 캐시)** | `cache.size<=4`, `blocks.size<=4`, `pickCache<=4000` | 총 세션 캐시 상한 유지 (`<= 2MB` 힙) | 7일 연속 시뮬레이션 중 GC 안정 |
| **동시 활성 액터 상한 (`floor.maxCapacity`)** | 1~5F 제한 분산 | **`1F ≤ 10`, `2F ≤ 12`, `3F ≤ 8`, `4F ≤ 8`, `5F ≤ 7`, `6F(박물관) ≤ 5`, `7F(옥상) ≤ 6`** | 390px 라벨 패커 `< 8ms` 보장 |

### 3.2 Cold 첫날 계획 병목 해소 5대 설계 (결정성 100% 보존)

1. **2단계 지연 계획 (Skeleton-First + Rolling Window Materialization)**:
   - *기존 문제*: `plan(day)`(`L744`)와 `blockPlan(day)`(`L1450`)가 자정~자정 `86,400초` 전체의 모든 `route()`, `compileCurve()`, `clearSweep()`, `screenReservations()`를 앱 로드 직후 1회 호출에 몰아서 계산함.
   - *개선안*:
     - **1단계 — 경량 하루 뼈대(`buildDaySkeleton(day)`, 목표 `< 15ms`)**: `route()`/스위프 없이 "누가 몇 시에 어떤 액션/외출을 할지" 시간 슬롯·쿨다운(`45분/90분`, `maxPerDay`)·`hinaBalance`만 결정해 경량 타임라인 배열로 확정(따라서 **어느 시각에 앱을 열어도 하루 전체 결정성 100% 불변!**).
     - **2단계 — 롤링 윈도우 구체화(`materializeWindow(day, windowIndex)`)**: 하루를 **1시간(3,600초) 청크 24개**로 나누고, 현재 시각이 속한 청크 `[H, H+1)`과 직전/직후 경계 이벤트만 `route()`·`clearSweep()`·대기열 슬롯을 실제 계산(`1청크 < 8ms`). 다음 시간 창에 접근할 때 lazy 캐시.
2. **보이는 층(`activeFloor`) 컬링 (Active-Floor-Only Tick)**:
   - `100ms` 틱에서 `updateResidents`와 `sampleMotion`은 **현재 화면에 보이는 `activeFloor`에 속한 액터만** 곡선 위치(`sampleCurve`), 걸음 반동(`distanceGait`), 로컬 회피, 안무 보간을 수행.
   - 비가시 층 액터는 `start/end` 타임스탬프 비교만 수행하고, 사용자가 층 탭(`selectFloor`)을 누른 즉시 해당 층 액터의 현재 좌표를 1회 계산.
3. **고정 크기 점유 그리드 (`SpatialOccupancyGrid`)**:
   - `1672×941` 맵을 `32×32px` 격자(`53×30 = 1,590` 셀)로 나눈 층별 `Int16Array` 버퍼 1개씩만 재사용(할당 0).
   - 매 틱 `O(N²)` 거리 루프 대신 자기 셀 주변 `3×3` 셀만 조회해 `O(1)`로 42px 최소 거리 및 로컬 비켜섬 판정.
4. **라벨 패커(`fitStatusLabels`) Dirty-Check + `300ms` 스로틀**:
   - 보행 중인 액터는 매 `100ms`마다 `fitStatusLabels()`를 호출하지 않고, ① 상태/대사/가시성/층이 바뀌었을 때, 또는 ② 보행 액터 누적 이동 거리가 `>= 24 art-px`(최소 `300ms` 간격)일 때만 재배치 실행.
5. **정적 인덱스 사전 컴파일**:
   - `office-actions-221`, `office-places`, `building-story-pack`의 시간창·인물별 가용 카드·인접 대기 노드를 초기화 시 `Map`으로 1회 인덱싱해 틱 내 `.filter()`/`Array.flatMap()` 할당 최소화.

---

## 4. 검증 계획 — 7일 연속 시뮬레이션 시험 설계

> **유리 책임 QA 원칙**: *"단순 문자열 존재 여부나 샘플 1분 찍기로 PASS 처리하지 않는다. 7일(604,800초) 연속 시뮬레이션에서 매 초 단위로 8대 불변식을 검증하고, 실패 시 정확히 재현 가능한 리포트를 남긴다."*

### 4.1 시뮬레이션 범위 및 시나리오 구성

- **시뮬레이션 기간**: 연속 **7일 (KST 월요일 `00:00:00` ~ 일요일 `23:59:59`, 총 `604,800초`)** — 평일 5일 + 주말 2일 + 자정 넘김(22:00~02:00 심야, 02:00 퇴근 경계, 07:00/19:00 NPC 교대) 전 구간 포함.
- **샘플링 해상도**:
  - **거시 검사 (`dt = 1s`, 604,800 스텝)**: 7일 전 구간의 예약 원장·인원 정원·대사 한도·남매 보존 검증.
  - **미시 보행·충돌 검사 (`dt = 0.1s`, 주요 혼잡 시간창 집중 샘플)**: 평일 출근(`08:45~09:15`), 점심(`11:50~13:10`), 교대(`18:55~19:10`), 심야 편의점(`22:00~22:30`), 주말 남매(`10:30~11:30`) 각 30분씩 + **회장님 직접 조작/회의 소집 인터럽트 주입 시나리오**에서 `100ms` 틱 단위 궤적 전수 검사.

### 4.2 매 초/매 틱 검사하는 8대 절대 불변식 (Pass Criteria)

| # | 불변식 이름 | 검증 수식 및 조건 | 허용 오차 (Pass 기준) |
| --- | --- | --- | --- |
| **1** | **겹침 0 (`zeroOverlap`)** | 동일 층에서 둘 다 `visible && !inElevatorTransit`인 임의의 쌍 `(a, b)`:<br>- 둘 다 `sitting` 고정 홈 의자가 아닌 이상, 아트 픽셀 거리 `dist(a.pos, b.pos) >= 42` (둘 다 `sitting`이면 동일 `anchorId` 점유 금지; `kid`/`pet` 포함 쌍은 `>= 72` 또는 `companionSafe` 기준). | **위반 0건** |
| **2** | **순간이동 0 (`zeroTeleport`)** | 동일 층에 연속 존재(`prevVisible && currVisible && !justExitedElevator && !reducedMotion`)하는 모든 액터:<br>`dist(currPos, prevPos) / dt <= maxSpeed + 15` (`staff/npc/kid` `180 px/s`, `companion` `240 px/s`). | **위반 0건** |
| **3** | **이중 예약 0 (`zeroDoubleBooking`)** | 매 초 어떤 `actorId`도 활성 `ActivityToken` / 점유 `Slot`을 `<= 1`개만 소유. | **위반 0건** |
| **4** | **정원 초과 0 (`zeroOverCapacity`)** | 매 초 `occupancy(anchor) <= anchor.capacity(1)`, `occupancy(room) <= room.capacity`, `occupancy(elevator) <= 4`, `occupancy(floor) <= floor.maxCapacity`. | **위반 0건** |
| **5** | **대화 상대 마주 봄 (`mutualFacingInDialogue`)** | `choreographyState === 'EXCHANGE_TURNS' || 'REACTION_POSE'`인 모든 쌍 `(a, b)`:<br>`Math.abs(a.x - b.x) >= 16` 이고 `(a.x < b.x ? a.facing === 'right' && b.facing === 'left' : a.facing === 'left' && b.facing === 'right')`. | **100% 일치 (위반 0건)** |
| **6** | **대사 반복 한도 (`dialogueRepetitionCap`)** | ① KST 1일 내 동일 `lineId` 노출 `<= maxPerDay`(일반 `2`, 수다/케미 `1`, 희귀 `1` 및 `cooldownDays` 준수)<br>② 동일 액터 연속 동일 `lineId` `0건`<br>③ 동일 층 동시 노출 중복 `0건`<br>④ 모든 대사 길이 `<= 30자` | **위반 0건** |
| **7** | **수현·수연 & 기존 안전 불변식 보존 (`legacyAndKidsPreserved`)** | ① 주말 & 평일 18~22시 깜짝 방문 시 남매 정상 출현, `kidsVisits` 7일간 누락 없이 발동, `kidsVisitLines` 원문 100% 일치, `companionSafe` 100% 통과<br>② `personalNonWork >= 2700s`, `crossFloor >= 5400s`, `hinaBalance` `teacherCompleted >= selfieCompleted`, `MIR` `standing` & 무섭취 유지 | **위반 0건** |
| **8** | **성능 & 무저장 예산 (`performanceAndSafetyBudget`)** | ① Cold 1일 계획 best-of-three `< 150ms` (개별 `< 220ms`)<br>② `100ms` 틱 `p99 <= 12ms`, 평균 `<= 4ms`<br>③ `localStorage.setItem/removeItem/clear` 호출 `0건`, `Math.random` 호출 `0건`, `fetch/network` `0건` | **전 항목 기준 내** |

### 4.3 시험 파일 구조 (Module Layout)

```text
scripts/
├── hani-office-behavior-7day.sim.mjs      # 7일(604,800초) + 0.1s 집중 구간 통합 시뮬레이터 (8대 불변식 검사)
├── hani-office-choreography.test.mjs      # 5단계 안무 FSM, 마주 보기 정렬, P1/P2 중간 취소 & 무텔레포트 단위 테스트
├── hani-office-dialogue-budget.test.mjs   # 대사 하루 한도, 쿨다운, 30자 상한, 말투/금기어, 희귀 장면 주기 검증
├── hani-office-npc-isolation.test.mjs     # NPC 07/19시 교대, Roster·Affinity·HaniBoard·hani_os_life_v23 격리 검증
└── hani-office-perf-budget.test.mjs       # Cold <150ms, 100ms tick p99 <12ms, 0-layout-read 벤치마크
```

### 4.4 실패 시 보고 형식 (Failure Report Schema)

시뮬레이션이 실패하더라도 첫 에러에서 바로 죽지 않고 8대 불변식별 **최초 발생 시각·원인 스냅샷·총 위반 건수·즉시 재현 명령**을 `artifacts/office-behavior/sim-7day-report.json`과 콘솔 요약으로 출력합니다.

```json
{
  "result": "FAIL",
  "engineVersion": "behavior-engine-v1",
  "simulatedSpan": { "startKst": "2026-11-23T00:00:00+09:00", "days": 7, "ticksChecked": 604800 },
  "summary": {
    "zeroOverlap": { "pass": false, "violations": 2 },
    "zeroTeleport": { "pass": true, "violations": 0 },
    "zeroDoubleBooking": { "pass": true, "violations": 0 },
    "zeroOverCapacity": { "pass": true, "violations": 0 },
    "mutualFacingInDialogue": { "pass": false, "violations": 1 },
    "dialogueRepetitionCap": { "pass": true, "violations": 0 },
    "legacyAndKidsPreserved": { "pass": true, "violations": 0 },
    "performanceAndSafetyBudget": { "pass": true, "coldBestMs": 94.2, "tickP99Ms": 6.8 }
  },
  "firstFailures": [
    {
      "invariant": "zeroOverlap",
      "kst": "2026-11-25T12:14:33.200+09:00",
      "secondOfDay": 44073.2,
      "floor": "1f",
      "expected": ">= 42.0 art-px between non-seated actors",
      "actual": "18.4 art-px",
      "actors": [
        { "id": "haru", "priority": "P4", "state": "GOING", "anchor": "door_convenience", "pos": [235, 300], "facing": "left" },
        { "id": "npc-security", "priority": "P6", "state": "PATROL", "anchor": "corridor_1f", "pos": [230, 317], "facing": "right" }
      ],
      "replayCmd": "node scripts/hani-office-behavior-7day.sim.mjs --at 2026-11-25T12:14:30+09:00 --window 15 --floor 1f"
    }
  ]
}
```

---

## 5. 구현 단계 (작게 쪼갠 5단계 순서 & Preview 지점)

`AGENTS.md` §11(배포 열차)을 준수하여 각 단계는 독립 PR/브랜치로 작게 쪼개고(기능 브랜치에서 표시 버전 증가 없음), **기반부터** 순서대로 검증 후 쌓습니다.

| 단계 | 작업 내용 (Scope) | 화면에서 좋아지는 점 | 시험 통과 조건 (Gate) | 회장님 미리보기 지점 |
| --- | --- | --- | --- | --- |
| **1단계: 기반** *(예약·점유 + 겹침 0 + 대기열 + 성능 분리)* | - `Unified Occupancy Ledger` & P0~P7 우선순위 도입<br>- `SpatialOccupancyGrid` 전 층 `42px` 최소 거리 적용<br>- 문/엘리베이터 FIFO 대기열 + `2.2s` 승강기 탑승/하차 연출<br>- `slewCompanion` 순간이동 폴백(`L3710`) 및 `holdPrev` 스냅 제거<br>- 2단계 지연 계획(Skeleton + 1시간 청크) & 가시 층 컬링 | - 캐릭터가 문·복도에서 **겹치지 않음**<br>- 엘리베이터 타고 내리는 모습이 자연스러움<br>- 펫/남매 순간이동 해소, 첫 진입 버벅임 감소 | - `7day.sim` 중 **겹침 0, 순간이동 0, 이중 예약 0, 정원 초과 0, 남매 보존**<br>- `perf-budget` Cold `<150ms`, 틱 `p99 <= 12ms`<br>- 기존 `office` 테스트 100% PASS | **★ Preview 1**: 1F/2F/4F 점심·출근 동선 & 엘리베이터 이동 확인 |
| **2단계: 안무** *(대화 5단계 + 마주 보기 + 중간 취소)* | - `ChoreographySession` 5단계 FSM(`APPROACH → ALIGN_FACE → EXCHANGE_TURNS → REACTION_POSE → DISPERSE`)<br>- 전 인원 대화 시 X좌표 마주 보기(`data-facing`)<br>- 턴제 화자 따라다니는 말풍선 + 청자 `nod` 리액션<br>- P1 회의 소집/수동 조작 시 텔레포트 없는 `ABORT` 복귀 | - 직원끼리 대화할 때 **다가가서 서로 쳐다보고** 번갈아 말풍선·고개 끄덕임 후 헤어짐<br>- 회의 소집해도 텔레포트 없이 바로 회의실로 이동 | - `choreography.test` 100% PASS<br>- `7day.sim` `mutualFacingInDialogue` 100% PASS<br>- 390px 모바일 말풍선 클리핑/라벨 겹침 0 | **★ Preview 2**: 1F 카페·4F·2F 직원 대화 및 회의 소집 인터럽트 시연 |
| **3단계: 대사·서사** *(쿨다운 + Micro-Arcs + 이벤트·희귀 장면)* | - `DialogueSelector` 4계층 풀 & 하루 `maxPerDay`/최근 5개 배제 링<br>- `idleFlavour` 개인별 비대칭 리듬(`14~24s` 지터) 전환<br>- [building-story-pack-v1.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/drafts/building-story-pack-v1.json) `microArcs`(2~3스텝), `buddyOutings`, `eventReactions`, `rareScenes` 연결 | - 같은 대사 도배 사라짐<br>- 직원들이 제각각 자연스런 박자로 움직이고, 민지 촬영·나은 운동·심야 라면 회동 등 연속 이야기가 펼쳐짐 | - `dialogue-budget.test` PASS (하루 한도·30자·말투·금기어)<br>- `7day.sim` 8대 Gate 중 구현분 100% PASS | **★ Preview 3**: 아침/점심/심야/주말 4시간대 연속 행동 & 희귀 장면 감상 |
| **4단계: NPC 통합** *(교대·순찰·케미·데이터 격리)* | - `npc-conv-day/night`, `npc-security`, `npc-studio-crew`, `npc-trainer`, `npc-librarian` *(및 6F 준비 시 `npc-curator`)* 통합 원장 편입<br>- `07:00/19:00` 도보 교대 인사 연출<br>- `chemistries` 안무 연결 & `visitor` `convenience_guest` 추가 | - 1F 편의점·로비, 5F 스튜디오·피트니스·도서관에 담당 NPC가 시간 맞춰 교대하며 직원과 케미 대사를 나눔<br>- 직원 명부/친밀도/퀸 투표와 100% 분리 유지 | - `npc-isolation.test` PASS (`Roster`/`Affinity`/`HaniBoard`/`hani_os_life_v23` 0접근)<br>- `7day.sim` 전 항목 PASS | **★ Preview 4**: `07:00`/`19:00` 편의점 교대 및 1F·5F NPC 케미 확인 |
| **5단계: 동선 다듬기 & 아트 연결** *(2차선 비켜가기 + 4방향 확장)* | - 복도 2차선 오프셋(`±14px`) + 단거리 `sidestep` 회피<br>- *(도연 선임님 아트 준비분부터)* `manifest-v3.json` 빈 행의 `left/right/back` 4방향 프레임 연결<br>- 390px / 1440px Edge 시각 QA | - 마주 오는 직원이 자연스럽게 비켜 지나감<br>- 4방향 시트 적용 인물은 옆/뒤를 보며 걸어 게걸음 완전 해소 | - `7day.sim` **8대 Gate 전수 0 위반 PASS**<br>- Edge 390px/1440px 캡처 및 `localStorage` 쓰기 0 확인 | **★ Preview 5 (최종)**: 전 층·전 시간대 Preview 승인 → 배포 열차 탑승 |

---

## 6. 위험 표 & '이번에 안 하는 것'

### 6.1 위험 분석표 (Risk Register)

| 위험 | 발생 조건 | 영향 | 예방 및 완화책 (Design Guard) |
| --- | --- | --- | --- |
| **1. 수현·수연 명장면 훼손** | 통합 원장이 남매 대열(`companionSnapshot`)이나 `kidsVisits`에 P3/P4를 잘못 우선 적용하거나 `companionSafe`를 건드림 | 회장님이 가장 아끼는 남매 티키타카·깜짝 방문이 줄거나 가구에 겹침 | 남매는 **P2 최상위(회장 조작/소집 다음)** 고정, `kidsVisitLines` 원문 29종 100% 불변, 7일 시뮬레이션 7번 불변식으로 회귀 자동 차단. |
| **2. 성능 400ms 초과** | 30명+·7층에서 하루 전체 경로/스위프를 Cold에 한 번에 계산하거나 100ms 틱마다 전 층/라벨 패커 실행 | 모바일 버벅임·배터리 발열·One-Pass 성능 게이트 실패 | 3장 **2단계 지연 계획(Skeleton + 1시간 청크)** + **보이는 층만 틱 계산** + `SpatialOccupancyGrid` + `fitStatusLabels` 300ms 디바운스 강제. |
| **3. 기존 테스트 대규모 충돌** | `hani-office-actions-221.test.mjs`, `hani-office-companions.test.mjs`, `hani-office-v2-215.test.mjs` 등이 구 `residentPeople` 수·고정 좌표·함수를 직접 검증 | 기존 office 46+ 테스트 파일 실패 | 1단계에서 기존 공개 `HaniBuildingScene` API 시그니처(`snapshot`, `plan`, `residents`, `scheduler`)는 유지하고 내부 엔진만 점진 교체. Canon v2 / 신규 인원 변경분만 테스트 이관 PR 분리. |
| **4. 1F·2F 과밀로 390px 라벨 숨김 급증** | 1F 점심(점원+보안+바리스타+방문객+직원+펫 ≤ 10명), 2F(상주 10명)에서 라벨 패커가 `dot` 축소 과다 발생 | 휴대폰에서 직원 이름 대신 점(`.`)만 많이 보임 | `floor.maxCapacity` 하드 상한 엄수(`1F ≤ 10`, `2F ≤ 12`), 대화/안무 중인 인물의 `statusLabelPriority` `3` 부여(`L2266`), 비좌석 대화 슬롯 간 최소 `46px` 이격. |
| **5. NPC·데이터 오염** | 신규 NPC가 `HaniOrganizationRoster`, `createOfficeAffinity().secrets`, `HaniBoard` 퀸 후보에 잘못 섞이거나 `hani_os_life_v23`에 쓰기 발생 | 직원 명부·친밀도·생활 기록 오염 (CRITICAL) | `kind === 'npc'` + `dataset.resident === 'npc'` + `profileLink.hidden = true` 강제. 모든 테스트에 `denyWrite` Proxy(`localStorage`/`sessionStorage`) 의무 탑재. |
| **6. 4방향 아틀라스 바이트 초과** | 20명 전체에 4방향 프레임을 성급히 넣다 `manifest-v3` 용량 상한(`maxSpriteBytes: 1,475,000 B`) 또는 `200` 파일 상한 초과 | 배포 차단 (One-Pass BLOCK) | 엔진은 정면 4포즈+기울기로 먼저 1~4단계를 완성하고, 4방향 아틀라스는 **기존 시트 빈 행(파일 수 +0)**에 용량 검수 통과분부터 5단계에서 점진 연결. |

### 6.2 이번에 안 하는 것 (Non-Goals / 범위 가드)

1. **AI(LLM) 실시간 API 호출 금지**: 대사나 행동 결정을 생성형 AI API로 호출하지 않습니다(비용 0원, 결정적 100%, 오프라인 동작).
2. **`hani_os_life_v23` · Cloud `hani_state` · Supabase 스키마 변경 금지**: 행동 엔진은 완전 무저장(세션 메모리 + KST 시드)이며, 친밀도는 기존 승인된 `window.HaniOfficeAffinity`(`hani_office_affinity_v1`, `isTrusted` 클릭) 경로만 그대로 사용합니다.
3. **영구 도감(`hani_office_codex_v1`)·소품 영구 저장 신설 보류**: 희귀 장면 목격/대화 이력은 세션 메모리로만 두고, 영구 저장 키 신설은 추후 회장님 별도 명시 승인 후 진행합니다.
4. **전 직원 20명 4방향 아틀라스 동시 제작 강제 안 함**: 아트 제작 병목으로 엔진 전체가 멈추지 않도록, 아틀라스가 없어도 동작하는 1~4단계(이동·대기열·마주보기·안무·대사·NPC)를 먼저 완성하고 4방향 시트는 5단계에서 꽂습니다.
5. **물리 엔진(매 프레임 연속 강체 충돌·전 맵 A* 재탐색) 도입 안 함**: 100ms 틱 예산을 지키기 위해 그래프 + 32px 점유 그리드 + 로컬 2차선 오프셋/대기열로 가볍고 결정적으로 해결합니다.

---

## 최종 3줄 요약

1. 현재 `hani-office-live.js`는 직원 원장·주민/펫·동행/남매·수다·바리스타가 **5갈래로 분리**되어 있어 겹침·순간이동·정면만 보는 대화·반복 대사·Cold 340~430ms 성능 문제가 발생하며, 이를 **통합 예약·점유 원장(P0~P7 우선순위) + 2차선 동선/문·승강기 대기열(2.2s 연출) + 5단계 상호작용 안무(다가가기→마주 보기→턴제 말풍선→리액션→헤어지기) + 하루 반복 제한 대사 엔진**으로 통합 설계했습니다.
2. 대공사로 인원과 층(6~7층)이 늘어나도 휴대폰에서 끊기지 않도록 **2단계 지연 계획(경량 하루 뼈대 `<15ms` + 1시간 청크 구체화)과 보이는 층(`activeFloor`) 틱 컬링, `32px` 점유 그리드, 라벨 패커 디바운스**로 Cold `<150ms`·100ms 틱 `p99 <= 12ms` 목표 예산을 수립했습니다.
3. 구현에 앞서 **7일(604,800초) 연속 시뮬레이션 자동 시험**(`겹침 0 · 순간이동 0 · 이중 예약 0 · 정원 초과 0 · 마주 보기 100% · 대사 반복 한도 · 수현/수연 보존 · 성능/무저장 예산`)과 5단계 분할 PR 순서를 확정해, `hani_os_life_v23` 저장과 AI 호출 0인 상태에서 안전하게 단계별 Preview를 거쳐 구현할 수 있게 했습니다.
