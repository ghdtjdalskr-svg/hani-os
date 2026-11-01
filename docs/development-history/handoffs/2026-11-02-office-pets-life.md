# 본사 치즈·크림 생활 · qa-b10

## 작업 식별

- 갱신 시각(KST): 2026-11-02 / 담당 Codex 단독 / 구현·targeted Node 검증 완료, 아래 안전 제한 및 실화면 확인 대기 / 미커밋.
- 저장소 / branch / worktree: hani-os / `hani/office-pets-life` / qa-b10.
- base·HEAD·로컬 origin/main·GitHub API main: `b30b98823ca78977c9656aa7092dae2920f532fe` 일치. Git subprocess 미사용.
- 승인: `../qa-b10-task.md` UTF-8 전체 읽기·실행 지시. 한글 정상.
- 범위: 기존 JS 주민 블록·tap/update 소형 hook, residents test·exact-line fixture/helper, 검증 증거·이 인수인계. 다른 탭 floor-entry bubble과 합칠 줄 범위를 최종 기록.
- 금지: 직원·방문객 plan byte 변경, 저장·AI 호출·새 runtime 파일, commit/push/merge, 표시 버전 2.9.255·cache 변경. 브라우저·Git subprocess 차단 유지.
- Scoped Discovery: codemap living-office 확인. 주민 세부 anchor는 CODEMAP_MISS로 residentSnapshot·residentSafe·residentPath·updateResidents·openBubble 및 기존 source 역변환 검사를 직접 조사.

## 결과와 증거

- 기준 source와 exact-line fixture 및 수정 전·후 로그를 `artifacts/office-pets-life/`에 보존했다.
- Production 2.9.255는 사용자 제공 기준이며 로컬 index에서도 확인. 마지막 제품 script `./hani-launch-greeting.js`. 브라우저 차단으로 실제 Production 표시·최신 JS 로딩·기능 read-back 미검증.
- Notion 현황판 읽기 성공. 착수 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 미완료.

## 다음 담당에게

- 다음 행동: 아래 제한을 유지한 상태로 허용된 환경에서 Preview를 확인하고, 다른 탭의 floor-entry bubble과 resident hook만 합친 뒤 최종 source delta를 재생성한다.
- PR/main/Pages/운영: 미수행. Full package·One-Pass·HINA·버전 증가는 기능 담당 단계 N/A.
- 서버 설정·Edge Function 없음. CURRENT/DECISIONS 및 타 담당 파일 보존.
- Notion 갱신 대기 원문은 아래 최종 결과를 사용한다. 저장·배포 승인으로 확대하지 않음.

## 구현 결과

- 02:00~07:00만 수면, 그 외 기존 15분 주기의 안전 보행 유지. 반려동물의 하루와 seed는 07:00에 바뀌며 23:59→00:00에는 날짜·층·좌표가 끊기지 않는다. NPC의 날짜·시간 계산은 기존과 동일하다.
- 두 동물 모두 명시적인 `22..26` 단일 시간창으로 1F 라운지 옆에 머문다. 전용 네 지점은 치즈 `(54,55)↔(55.5,55)`, 크림 `(61.5,55)↔(62.5,55)`이다. 서로 최소 96 native px 이상이며 라운지 모서리 `(1105,525)`에서 230 native px 이내. 기존 직원 anchors·edges 및 기존 18개 지점 byte는 변경하지 않았다.
- 직원 snapshot을 읽어 같은 층의 휴식 중이고 이동 중이 아닌 직원을 15분 seed로 선택한다. 방문객·이동/복귀 중 직원·업무 중 직원은 제외한다. 직원 좌석/현재 이동 위치와 거리를 확보하고, 가구·noWalk 및 접근 경로를 검증한다. 상대가 떠나거나 자리가 막히면 주민이 양보한다.
- 치즈5·크림5·canonical 직원/회장님20, 총30개 짧은 대사 추가(각22자 이하). 기존 단일 bubble의 두 화자 대사, 기존 delegated tap/keyboard의 쌍 대사 사용. 직원 snapshot·직원 status·일정은 수정하지 않는다. 다른 bubble이 열려 있으면 자동 장면이 가로채지 않는다. 상대가 사라지면 낡은 쌍 대사를 제거한다.
- 치즈는 쉬는 직원의 실제 monitor deskBounds 옆 안전한 바닥에서 가끔 앉는다. 모니터/책상 위에 놓지 않는다. 크림은 깨어 있는 동안 앉아 있거나 걷는 회장님의 층으로 따라가고, 안전한 옆자리가 있으면 같은 15분 구간 동안 머문다. 회장님 호칭은 `회장님`뿐이며 별명 없음.
- 우선순위: 22~02시는 두 동물의 1F 창, 02~07시는 수면이 회장님 동행보다 우선한다.

### 명확한 안전 제한

- **기본 4F `ceo-reserved` 고정 의자 바로 옆 동행은 미충족이다.** 기존 painted furniture exclusion과 몸통 clearance로 320 native px 이내의 안전 지점을 찾지 못한다. 크림은 4F 안전 통로 `(51,66)`에서 기다린다. 가구 검사를 완화하거나 직원/회장님 위치를 바꾸지 않았다. 이 제한을 무조건적인 ‘회장님 옆 동행 완료’로 보고하지 않는다.
- 2~5F의 안전한 좌표에서 앉은/걷는 회장님 옆 동행·5분 이상 유지·보행자 양보는 실행 검증했다. 이는 통제된 snapshot 검사이며 실제 회장실 옆자리의 실화면 PASS가 아니다. 동선/가구가 막힌 경우의 fallback은 정상 안전 분기로 유지한다.
- 브라우저 차단 지시로 screenshot0, 모바일/실제 앱 가림·말풍선 체감·Production 기능 read-back은 미검증이다.

## 최종 검증

환경 Node `v24.20.0`. 아래 결과는 최종 JS SHA `682d9ea4fdad1c1c640ef8a3ec31a240b7cb9143eac1e73b67be48054c2b72ef`에서 실행했다.

공통 명령: `node --test --test-isolation=none --test-force-exit --test-timeout=60000 scripts/hani-office-<suite>.test.mjs`.

| suite | 통과 | 실패 |
|---|---:|---:|
| residents | 30 | 0 |
| labels-qa | 14 | 0 |
| top-labels | 7 | 0 |
| icons | 13 | 2 |
| crowded-labels | 19 | 0 |
| obr8 | 2 | 1 |
| obr15 | 13 | 1 |
| obr21 | 4 | 2 |
| hd-224 | 10 | 0 |
| consult | 19 | 1 |
| 합계 | **131** | **7** |

- 명령10개: 5성공·5실패. 수정 전 동일10묶음은124통과·7실패. 최종 실패7개 모두 기존 `spawnSync git EPERM`와 검사명이 동일하며 **새 실패0**. 역사적 source 조회를 성공으로 바꾸지 않았고, 기존 plan oracle·hash pins 및 테스트 기준을 완화하지 않았다. 공통 owner 중복 실행 수 포함.
- `node --check`: runtime JS·residents test·source helper·freeze/verify/report 도구, **6통과·0실패**. 증거 [syntax.json](../../../artifacts/office-pets-life/syntax.json).
- 새 검사7개: 야간 각성/수면·양쪽 라운지 위치·야간 보행, 자정 seed/좌표 연속성, 휴식/동층/안정 quarter 선택·방문객/이동 배제, 대사30개/monitor 바닥, 회장님 동행/유지/양보와 기본 의자 fallback, 실제 staff/visitor plan·blockPlan·snapshot on/off byte 동일 및 가구 전체 몸통 검사, 실제 delegated tap·기존 자동 bubble·상대 퇴장·저장/AI 호출0. 기존 수면 테스트는 02~07시 요구로 변경했다.
- **직원·방문객 전체 원문 보존**: 과거와 동일한 complete-line LCS 방식으로 이전 fixture를 그대로 재현한 후 이번 fixture를 재생성했다. 전체 역변환 SHA는 이전과 같은 `4f03c015fe3996d546afe1710a41c19a44d3a4d63c621ef132fb8ac255e06c6f`. fixture SHA `c700c4da7d3a34d00265ab16141f33bf512e909c6392b7c533d11408b20fd594`. `restoreResidentsSource`의 authored delta hash만 갱신했으며 과거 직원 plan/hash pin fixture들은 byte 동일하다.
- Git subprocess 없이 index blob SHA를 직접 비교: tracked1,354개 중 아래 승인4개만 변경. JS 변경 줄은 주민 블록·resident tap·update hook뿐이다. index/version/cache·CSS·data/building·기존 assets 및 resident 전용 test·delta/helper 이외 기존 oracle/test byte 보존. 변경 줄 whitespace 검사 PASS.
- 실제 runtime closure135/missing0, 이전 목록 대비 추가 runtime 파일0. 저장·Cloud·schema·migration·AI·추가 timer/event/fetch0. 서버/Edge Function·설정 변경 없음.
- 증거: [tests.json](../../../artifacts/office-pets-life/tests.json), [preservation.json](../../../artifacts/office-pets-life/preservation.json), [patch-lines.json](../../../artifacts/office-pets-life/patch-lines.json), `before-*.log`, `final-*.log`. 재현: `node artifacts/office-pets-life/verify.mjs`, `node artifacts/office-pets-life/report.mjs`. freeze는 명시적 authoring 도구이며 테스트가 oracle를 재생성하지 않는다.

## floor-entry bubble 병합용 줄 범위

기준은 `b30b988` 원문 대비 현재 미커밋 JS이며, 실제 정확한12개 hunk는 `patch-lines.json`에 before/after complete lines와 SHA로 보존했다. 아래는 읽기 쉬운 묶음이다.

| 내용 | 기준 JS 줄 | 최종 JS 줄 |
|---|---|---|
| 동물 시간창 | 2065~2066 | 2065~2066 |
| residentClock·night spots 명단·대사 | 2074 앞 삽입 | 2074~2081 |
| 라운지 옆 전용4지점 | 2093 | 2101~2104 |
| residentVisit/cache/path·snapshot 및 export | 2122~2149 내부만 | 2133~2204 내부만 |
| `openBubble`의 기존 resident 분기 한 줄 | 2424 | **2479** |
| `updateResidents`에서 state 대입 직후3줄 삽입 | 2645 앞 | **2700~2702** |

- 기존 `bubbleText`, `showBubble`, 직원 tap 분기, `updateBuilding`, 층 진입 이벤트·renderer에는 패치를 넣지 않았다. 다른 탭의 층 진입 bubble은 해당 원문과 함께 보존하고 위 resident 분기만 결합한다.
- 통합 뒤 새 source에 대해 exact-line delta/hash를 다시 만들고 해당 검사를 실행해야 한다. 다른 source SHA에 이번 PASS/fixture pin을 그대로 재사용하면 안 된다. 다른 탭의 실제 diff는 이 작업에서 받지 않았으므로 통합 검증은 미수행이다.

## 변경 파일·종료 상태

- tracked 수정4개: `hani-office-live.js`, `scripts/hani-office-residents.test.mjs`, `scripts/hani-office-residents-source.mjs`, `scripts/fixtures/office-residents-source-delta.json`.
- 추가 개발 증거: 이 작업별 handoff 및 `artifacts/office-pets-life/` 원문·도구·로그·JSON. 운영에 로드되는 파일 추가 없음.
- commit/push/PR/merge/배포 없음. branch·HEAD 유지. 사용자 금지로 탑승용 push도 하지 않았으며, 상태는 로컬 인수인계/Preview 검토 대기이다. 운영 반영 완료가 아니다.
- 다른 탭 파일·CURRENT/DECISIONS 보존. 다음 담당은 이 인수인계·`patch-lines.json`을 읽고 floor-entry bubble과 소형 hook 병합 및 허용 환경 Preview를 확인한다.

## Notion 최종 갱신 대기 원문

2026-11-02 KST / Codex / 본사 치즈·크림 야간 생활 qa-b10 / hani/office-pets-life / base b30b988. qa-b10-task.md UTF-8 실행 승인. 02~07시 수면·22~02시 두 동물1F 라운지 전용4지점·07시 일일seed·자정 연속성, snapshot 휴식/동층 동행·모니터 옆 치즈·대사30개·기존 bubble/tap 쌍 대사·크림 회장님 층 동행 구현. 기본4F 회장 고정 의자는 가구 clearance 때문에 바로 옆 동행 미충족이며 안전통로 대기, 가구/직원 위치 변경 없음. 주민30/0·지정10묶음131통과7실패(기존동일Git EPERM7·새실패0), syntax6/0, exact-line 전체 역변환·직원/방문객 plans 보존·tracked1,354중 승인4개만 변경·closure135/추가runtime0·저장/AI/timer/event추가0. JS682d9ea4. 브라우저/운영 미검증·미커밋·버전2.9.255/cache·push/merge/배포 없음. 다음 floor-entry bubble hook 통합·Preview. 원문 docs/development-history/handoffs/2026-11-02-office-pets-life.md 및 artifacts/office-pets-life/tests.json·preservation.json·patch-lines.json. Notion append는 자동 승인 검토의 approval policy is never 거절로 저장/read-back 미완료.
