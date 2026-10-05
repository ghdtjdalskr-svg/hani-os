# YUNA Schedule Intent & Date Range Fix Report

> 최신 상태 (2026-10-06 KST): 대표님이 실제 저장 문제가 아니라 입력 해석 문제라고 정정하고 “그렇게 수정해줘”로 Preview-only 수정을 승인. 아래 10-05 진단은 당시 기록이며, 현재는 승인 범위 구현·targeted 검증 완료, 배포 열차 탑승 대기. 실제 일정 저장 계약은 여전히 후속 작업이다.

- 담당: Codex / 2026-10-05 KST.
- branch: `hani/yuna-schedule-contract`.
- base/latest main 확인: `8ba5056f91e905bb4e7d1caf0d051e1869fc98f1` (PR204).
- 코드 표시 버전: `2.9.184`; YUNA script cache tag: `2.9.136`. 브라우저의 실제 Production 로딩은 이번 진단에서 미검증.
- 상태: **BLOCKED — 사용자가 명시한 §2 canonical event contract hard gate**. 운영 코드·버전·저장/Cloud 경로 수정 없음. 다른 worktree 변경 없음.

## Root Cause

왜 기존 입력이 task로 갔는가: `hani-yuna-helpdesk.js:25`의 inferKind는 book/movie/travelWish/diary 외 입력을 task로 반환한다. ‘할일은’ 키워드의 우선순위 문제가 아니라 schedule intent 자체가 없다. DIRECT_TARGETS와 LABELS/DESTINATIONS에도 schedule이 없다.

왜 첫 날짜만 남는가: `explicitDate`는 첫 ISO 또는 월/일 match 하나를 반환한다. `parseTask`는 이를 due 하나로 보관하고 시작/종료일을 만들지 않는다. 제목 처리는 제한된 앞/뒤 문구만 제거하여 날짜 범위와 일정 요청을 제목에 남긴다.

## Existing Canonical Schedule Contract

- 발견 여부: latest main의 state 기본 구조/normalization, YUNA/Intake, Calendar/Task renderer, 저장소의 JS·data-hub·서버 소스에서 독립 event/schedule contract 없음.
- storage: `state.tasks`는 `{id,text,due,done,createdAt}` 및 선택적인 `googleCalendar` 동기화 metadata. `state.calendarUrl`은 iframe URL 설정이다. 수강 curriculum과 여행 itinerary의 기간은 해당 도메인의 데이터이며 일반 일정 계약이 아니다.
- renderer: `renderTasks`는 마감일을 표시한다. `renderCalendar`는 calendarUrl의 외부 iframe을 표시하고 자체 event 목록을 읽지 않는다.
- calendar integration: `googleCalendarSyncTasks`는 task id/text/due/event_id를 `hani-google-calendar`의 `sync_tasks`로 보낸다. state에 남는 eventId는 동기화 식별자이며 일반 일정의 start/end/allDay model이 아니다.
- 서버 `hani-google-calendar` 구현은 이 main 저장소에 없음. 배포 서버의 내부 계약/종료일 inclusive 또는 exclusive는 검증할 수 없으며 추정하지 않는다.
- 근거: `hani-main.js:1000,1003,1221,3241–3306,5011,5116`; `index.html:757,1083`; `dev-center/codemap.json` yuna-intake anchor; `hani-yuna-helpdesk.js:5,13,25,103`.

## Smallest Safe Implementation Proposal (미구현)

1. 먼저 schedule intent와 semantic range/title의 Preview-only 설계를 확정한다. task의 deadline 의미와 분리하고 명시된 일정 등록 요청을 우선하되 ‘송년회 준비물 사기 …까지’는 task로 둔다. 모호한 날짜·시간·연도는 확인 필요로 표시한다.
2. 실제 저장 없이 schedule Preview와 지원되지 않는 저장 안내로 잘못된 task 저장을 방지하는 좁은 수정안을 별도 승인한다. ‘일정’ 저장 category는 저장 계약 확정 전 추가하지 않는다.
3. 실제 일정 등록은 별도 canonical schedule contract를 먼저 설계·승인한다. Local 영속 데이터 위치, 기존 데이터 보존/복구, Cloud snapshot 보존, renderer, 승인 저장/중복 방지 및 Google Calendar adapter의 inclusive→exclusive 변환을 명시한다. 기존 tasks에 일정을 밀어 넣거나 임의 top-level events/schedule/calendar를 생성하지 않는다.

## Data / Cloud Impact and Approval

- 이번 진단: 저장/Cloud write·schema·migration 변경 0, Google 외부 요청 0.
- Preview-only 수정: 승인 전 영속 write 없음이 요구되며 실제 구현 시 관련 regression·Preview state hash·UI를 검증한다.
- 실제 일정 저장: 현재 없는 영속 계약/보호 저장소 write 경로가 필요하므로 AGENTS §2/§5의 명시 승인 대상. Google 서버 확장은 별도 API/write semantics 변경 승인과 서버 소스 확인 필요.
- 별도 승인 필요: **예**. 먼저 Preview-only 안전 차단을 진행할지, 별도 일정 저장 계약 설계를 먼저 진행할지 결정 필요. 실제 저장/Cloud 변경을 현재 요청으로 승인됐다고 해석하지 않는다.

## Implementation

- 변경 파일: 이 진단·인수인계 문서만. intent/date/title/preview/save path 변경 없음.
- 표시 버전·캐시 태그 변경 없음. 운영 PR 생성/main 병합/배포 없음.
- 함께 배포할 서버 기능: 없음(진단만). 향후 실제 등록에는 hani-google-calendar 계약/원본 확인 필요.

## Reproduction Case

입력: `12월 12일 토요일부터 12월 13일 일요일까지야 / 할일은 "찐막채 송년회"로 일정 올려줘`.

- 현재 실행 결과: kind/target `task`; text 전체 입력; due `2026-12-12`; start/end/allDay 없음. schedule 요구 **FAIL**.
- 원하는 결과(미구현): schedule / 찐막채 송년회 / 2026-12-12 / 2026-12-13 / allDay true.
- 단일 일정 및 축약 범위 입력도 task로 분류됨. `보고서 제출 …까지`, `내일까지 HDMI 젠더 챙기기`, `송년회 준비물 사기 …까지`는 task를 유지. 보고서 제출의 날짜 문구 제거는 기존 parser에서 불완전함.

## Regression and Tests

- 명령: `node scripts/hani-yuna-smoke.js` — **PASS** (기존 Book correction A–H, text/Vision, Place, media, finance routing, isolated draft key). 변경 후 테스트가 아니라 기준선 검사다.
- VM 진단: Date를 2026-10-05 KST로 고정, 실제 YUNA exported parse를 6개 입력에 실행. 일정 3개 오류 재현, deadline task 3개 분류 유지. parse write spy 0회, 합성 state hash 보존.
- Task: 분류/단일 due 진단 통과, 원하는 제목 추출 전체 PASS 아님.
- Book/Movie/Place: 기존 smoke **PASS**.
- Diary: 별도 실행 회귀 미검증. 새 기능 구현 전 hard gate로 중단.

## Data Safety

- Preview state mutation: parser 진단에서 NO, 실제 DOM Preview는 미검증.
- Existing data changed: NO(실제 사용자 데이터 접근·저장 없음).
- Protected state preserved: 코드 미수정, 합성 state hash 보존. 실제 사용자 state hash는 접근하지 않아 미검증.
- 승인 후 1건 저장/중복 방지/Cloud: 일정 계약이 없어 미구현·미검증.

## UI QA

- Desktop 1440 / Mobile 390 / Porcelain / Midnight: 미검증. schedule UI를 만들지 않고 hard gate에서 중단.

## Notion

- 개발 게시판에 hard gate·결정 필요를 기록하고 저장 후 읽기 확인한다. 구현/검증 완료가 아니므로 ‘탑승 대기’로 표시하지 않는다.

## Production

**NOT DEPLOYED**

## Next

**BLOCKED — canonical 일정 계약이 없어 사용자가 요청한 STOP 조건 충족. 최소 구현안/별도 승인 범위 결정 후 재개.**

## 2026-10-06 — 승인된 Preview-only 수정 / 탑승 인수인계

- 담당 Codex, branch `hani/yuna-schedule-contract`, base `8ba5056f91e905bb4e7d1caf0d051e1869fc98f1`. 최초 진단 commit `9331e372e5f0bc18bc4e9b23990bad30591e25bf` 이후 구현. 최종 SHA는 branch HEAD/Notion 카드 참조.
- 승인 근거: 대표님 “지금도 할일로 저장하진 않아. 다만 입력한 내용을 제대로 못읽고 텍스트 전부를 할일로 입력하는게 문제야” → “그렇게 수정해줘”. 입력 의도/제목/기간 해석과 Preview만 승인. 실제 일정 저장·Cloud/schema 변경 승인 아님.
- 운영 변경 파일: `hani-yuna-helpdesk.js` 하나. 새 schedule intent/range parser, schedule-preview 분리, 전용 Preview 및 제목/날짜 수정. 기존 전문 탭 라우팅을 우선 유지. 새 handler/renderer layer를 추가하지 않고 기존 parse/render/edit 경로를 사용.
- 테스트 파일: `scripts/hani-yuna-schedule.test.js`, `scripts/hani-yuna-schedule-ui.test.mjs`. 문서: 이 인수인계.
- 실제 요청 문장의 결과: 일정 / 제목 `찐막채 송년회` / 시작 `2026-12-12` / 종료 `2026-12-13` / 종일 `true`. 종료일은 사용자에게 보여주는 포함 종료일이며, 서버 Calendar의 exclusive end 계약으로 사용하지 않는다.
- 범위: 월/일 두 날짜·축약 13일까지·물결·하이픈·ISO·연도 명시 지원. 단일 날짜는 시작=종료. 잘못된 날짜/역전/불명확한 기간/시간은 경고. 전문 탭 라우팅과 일반 마감 할 일 유지. 일정 저장 버튼 없음, 기존 saveApproved mode guard 그대로 유지.
- 저장 안전: 보호 LocalStorage/commit/intakeApplyRow/Cloud/schema 수정 없음. 기존 sessionStorage 초안 보존만 재사용. 실제 사용자 데이터 접근 없음.

### 실행한 검사와 Preview 근거

1. `node --check hani-yuna-helpdesk.js` — PASS.
2. `node scripts/hani-yuna-smoke.js` — PASS, 기존 Book correction A-H / text·Vision / Place / media / finance routing.
3. `node scripts/hani-yuna-schedule.test.js` — PASS, 고정 Date 2026-10-06, 대표 입력·6개 기간 표현·단일 일정·task deadline 3개·Book/Movie/Place/Diary·오류 날짜/연도/시간·전문 라우팅. parser write 0, 합성 state 보존.
4. `node scripts/hani-yuna-schedule-ui.test.mjs <playwright index.mjs> <Chrome executable>` — PASS, 실제 index/JS/CSS를 별도 로컬 서버에서 로드, 외부 서비스 차단·격리 브라우저의 합성 데이터 사용. 1440/390 × Porcelain Cream/Midnight Black 총 4 조합: 대표 입력 필드, 저장 버튼 없음, 제목/날짜 수정, 모바일 수정/새 접수 접근, 가로 overflow 없음, deadline Task 저장 버튼 유지. Preview/수정 중 합성 application state 동일·localStorage write 0·intakeApplyRow 호출 0.
5. 증거 이미지: 로컬 `artifacts/yuna-schedule/{1440,390}-{porcelain-cream,midnight-black}.png`. 실제 화면 육안 확인: 제목·기간·종일·미지원 안내 표시. 이 화면은 개발 Preview이며 Production 결과 아님. 이미지 자체는 branch에 포함하지 않으며 위 UI 검사로 재생성 가능.

### 배포 담당에게

- 표시 버전 `2.9.184`, YUNA cache tag `2.9.136`, `HANI_DISPLAY_VERSION` 변경 없음. 운영 PR/main 병합/배포 없음.
- 함께 배포할 서버 Edge Function·설정·schema: **없음**. Frontend 변경만 열차에 통합 후 배포 담당이 버전/cache를 한 번 올린다.
- 통합 후 위 targeted 검사를 다시 실행하고 열차의 package/HINA/승인/Production read-back을 수행한다. 이 기능 담당의 targeted 검사는 release QA를 대신하지 않는다.
- 미검증/제약: 실제 일정 저장·Google Calendar·Cloud·중복/동기화는 구현하지 않음. 실제 모바일 키보드/음성/OCR 일정 해석은 미검증. 규칙 기반 parser로 모든 자연어 표현을 보장하지 않음. 기존 YUNA 표면은 Midnight에서도 밝은 카드 스타일을 유지하며 이번 작업은 테마 변경이 아님.
- Notion HANI-23: 제목/요약/승인 범위/검증/다음 행동을 갱신하고 저장 후 읽기 확인. 상태 **탑승 대기**. 대표님 새 데이터 승인 요청 없음; 열차 후보 Preview·배포 승인은 배포 담당 흐름에서 수행.
