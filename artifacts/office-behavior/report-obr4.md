# obr4 — 다온·윤슬 본사 착석 및 232 결합 회귀

2026-10-23 KST · 도연(Codex) · `hani/release-train-20261023` · 시작/유지 HEAD `65cd8a071d657741319b54c063d1ba8c5ab6aefb`(운영 main `4ac6b6c` + 본사 재설계 결합).

구현과 지정 Node 검증을 완료했다. **전체 120개 중 117 PASS / 0 FAIL / 브라우저 3 SKIP**, 최종 감사 54,000 snapshot에서 결함 0이다. 실제 브라우저·Preview·최신 main 통합·배포는 완료하지 않았다. Git index.lock 권한 거절로 **미커밋**이며 push/PR/Notion 실행은 없다.

## 기준선과 최신 main

- 수정 전 지정 전체 회귀를 먼저 실행했다: 116개 중 110 PASS / 3 FAIL / 3 SKIP. `obr4-baseline-tests.txt`.
- 실패 3건: 232 조직도의 19명과 본사 canon의 17명 불일치, 기존 safety의 과거 EOL/owner 기준, office219의 230 index 기준과 현재 232 간 불일치였다.
- CLI `git ls-remote`는 프록시 연결 실패. 이후 GitHub 연결 도구로 확인한 실제 원격 main은 **`7a10595f2a0890e63cd04dbc95c057edbbd3d5b0`**. 지정 main 4ac6b6c보다 테스트·문서 1커밋(#338), 17파일이 앞선다. 운영 파일 변경은 없다.
- 이번 수정과 겹치는 원격 파일: `scripts/hani-building-206.test.mjs`, `scripts/hani-office-219.test.mjs`. 자동 merge/rebase하지 않았다. 원격 206 검사는 본사 17명을 보존하려고 조직도 정식 입사분을 역정규화하지만, 이번 착석 이후에는 실제 명부 19명을 검증해야 한다. 원격 219의 엄격한 metadata 보존과 이번 승인된 착석 delta도 조정 대상이다.
- 아래 PASS는 **지정 65cd8a0 위 작업 트리**의 결과다. 원격 후속 테스트까지 합친 결과가 아니다. 비교 근거는 `obr4-main-drift.json`.
- 로컬 표시·cache는 2.9.232, 마지막 index script는 `hani-launch-greeting.js`. 실제 운영 화면 표시·최신 JS 로딩은 실행하지 않았다.

## 변경 파일

운영 데이터·코드 6개:

- `data/hani-building/spatial-contract.json`: 두 사람 active/registered, 각 rendererSeat.owner 본인, runtimeAssignable=false 제거. 기존 입사일 필드가 없어 새 필드는 만들지 않았다. staffPolicy의 두 사람 미등록 설명도 정리했다.
- `data/hani-building/art-map-v1.json`: 두 책상 prop의 planned=false, homeFurniture seatNote·anchor furniture의 예정/빈 자리 표현 제거. home 좌표는 유지. 재무실 공용 경로 점 `junction_finance.y`만 60.38→57로 이동했다.
- `data/hani-building/office-places.json`: 두 사람의 장소별 affinity·atByPerson 및 출처 근거 추가. 기존 직원의 문구·선호·장소 체류·동행 관계는 보존했다.
- `assets/data/office-actions-216.json`, `office-actions-221.json`: people 18→20(직원 19+회장), 전원 공통 12행 및 family parent에 두 사람 추가. 221의 2F 미세 행동 3행과 전원 커피/창밖 행동에도 참여한다. 신규 시그니처 행동은 없다.
- `hani-office-live.js`: 기존 projection의 표시 상한을 해당 층 재직 인원까지 확보한다. 2F는 6→8, 다른 층은 기존 6 유지. 새 DOM/event/timer/renderer layer는 추가하지 않았다.

생성 도구:

- `scripts/hani-office-onboarding-232.mjs` 신규: 과거 승인 카탈로그를 보존하며 등록·참여자 delta만 투영한다.
- `scripts/hani-office-actions-216-data.mjs`, `hani-office-actions-221-data.mjs`, `hani-office-lively-data.mjs`: 위 변경을 재생성할 수 있도록 수정했다.

검사·증거:

- `scripts/hani-office-onboarding-232-assertions.mjs`, `hani-office-obr4.test.mjs`, `hani-office-obr4-report.mjs` 신규.
- 기존 검사 수정: `hani-building-206.test.mjs`, `hani-building-206-engine.test.mjs`, `hani-office-219.test.mjs`, `hani-office-actions-216.test.mjs`, `hani-office-actions-221.test.mjs`, `hani-office-fix-218.test.mjs`, `hani-office-hd-224.test.mjs`, `hani-office-lively-v2.test.mjs`, `hani-office-seats-215.test.mjs`, `hani-office-v2-215.test.mjs`, `hani-office-behavior-run-tests.ps1`(모두 scripts/).
- 브라우저 준비만 수정: `scripts/hani-office-actions-216.browser.mjs` actor 21개 대기, `hani-office-217.browser.mjs` 두 책상 prop 불투명도 1 기대. 실제 실행은 하지 않았다.
- 작업 인수인계: `docs/development-history/handoffs/2026-10-23-office-obr4-codex.md`.

## 착석과 거리

|층|기존 재직 인원|현재 재직 인원|
|---|---:|---:|
|1F|2|2|
|2F|6|8|
|3F|5|5|
|4F|4|4|
|5F|0|0|

- 직원은 MIR 포함 19명, 회장은 별도다. scheduler renderer는 **기존 19→21 슬롯**(직원 19+회장 1+방문객 1), 테이블 없는 fallback은 17→19 슬롯이다. 직원 외 회장/방문객을 재직 인원에 넣지 않았다.
- 다온: 2F finance / `desk_daon` / renderer id `finance-lead`, owner daon, desk/sitting, art **(30.6, 63.5)**.
- 윤슬: 2F life / `desk_yoonseul` / renderer id `desk_yoonseul`, owner yoonseul, desk/sitting, art **(41.9, 88.5)**.
- 실제 renderer를 메모리 DOM으로 실행해 2F 직원 8명 표시, 두 사람의 기존 좌석 위치·owner, plannedRows 0을 확인했다. 시각적 픽셀 검증은 아니다.
- **`hani-desk-mascots.js`는 수정하지 않았다.** 실제 모듈 실행으로 두 사람 모두 `data-planned="false"`, 2F 장식 표시·기존 오프셋 좌표를 확인했다.
- canon은 **326 anchors**, 모든 canon 좌표·edge·다른 계약 필드 보존. 초기 계약 SHA256 `d02426b44c49db169efebd782e110226fd1d719d016bc5912516753f3df8841d`를 고정하고 명시적 등록/owner/policy delta만 적용한 전체 구조와 비교한다. 현재 파일 hash를 무조건 새 기대값으로 교체하지 않았다.
- 두 home이 보호 좌석이 된 뒤 기존 door_finance→junction_finance 경로가 다온과 17.63px까지 접근했다. 예약 거절로 216 장기 도달이 91행으로 줄었다. art 경로점 하나를 조정해 해결했으며 home을 옮기거나 **이동 24px·정지 20px** 기준을 완화하지 않았다. 이후 97행·208일 도달을 복구했다.
- 배포 순서 호환: **실제 4ac6b6c의 2.9.232 JS + 당시 art/221 + 새 canon만** VM에서 실행했다. 326 art 좌표 존재, 두 homeSeat owner, 09:00/12:30/23:00 snapshot의 유효 좌석을 확인했다. 구 JS의 6명 표시 한계는 새 JS가 와야 해소되지만 예외/좌표 누락은 없다.

## 두 사람 하루 외출

221, KST **2026-10-23 00:00–24:00**, 회장 명시 재실 옵션 없음. 자리를 실제 떠나는 이벤트를 인물별 1회로 센다. home 미세 행동은 제외한다. 공유 동행도 인물별 1회다.

|사람|정식 행동 외출|장소 카드 외출|합계|09–18시 장소 카드 외출|하루 장소 카드 종류|
|---|---:|---:|---:|---:|---:|
|다온|3|26|29|13|12|
|윤슬|5|26|31|13|10|

- 다온 장소: 2F 팬트리 좌석·창가·팬트리·회의실, 1F 커피 카운터·카페 좌석·창가·택배 자리, 3F 소파, 4F 창가·소파, 5F 테라스.
- 윤슬 장소: 2F 창가·팬트리 좌석·팬트리·회의실, 1F 커피 카운터·카페 좌석·택배 자리, 3F 회의실·창가, 5F 전망 난간.
- 정식 행동 목적지와 각 외출의 초 단위 시각은 `obr4-metrics.json`의 people.*.formalActions/destinations에 보존했다. 하루 수치는 seed·예약에 따른 해당 날짜 표본이며 매일 같은 횟수를 보장하는 계약이 아니다.

## 취향 출처의 누락과 처리

`data/hani-relationship-seed-v1.json`에는 두 사람이 없다. 사용자에게 대체 출처를 확인 요청했고 응답이 없는 상태에서, 이미 232에 승인된 도감의 영역·성격·말투를 사용했다. **관계 seed 원본은 수정하지 않았고 새로운 취미를 창작하지 않았다.** 장소 affinityEvidence에 source=`character-archive-232`, interests/quirks/voice로 구분했다. 다온은 침착함·반대 근거 확인, 윤슬은 호기심·공부 자료·독서 정리를 반영했다. 모든 신규 도착 문구는 장소를 포함하며 파일 확장자 문자열은 없다. 향후 실제 관계 seed가 추가되면 seed 근거로 재생성할 수 있다.

## 검증과 기대값

|검증|결과·근거|
|---|---|
|수정 전 전체 회귀|110 PASS / 3 FAIL / 3 SKIP, `obr4-baseline-tests.txt`|
|최종 전체 회귀|**117 PASS / 0 FAIL / 3 SKIP (120 tests, 133.63초)**, `obr4-all-tests-final.txt`|
|obr4 targeted|**10 PASS / 0 FAIL**, engine 공통 6+신규 4, `obr4-targeted-final.txt`|
|216|98 core/37 disabled 유지, **97 예약 행·208일 도달**, 120일 deterministic·예산·쿨다운·원자 예약 PASS|
|221|120행 유지, 연속 7일 자정·평일/주말·재실·family/rest/floor 쿨다운 PASS|
|lively v2|기존 전체 기준 PASS. 모든 직원 업무 시간 장소 ≥4·문구 ≥10, 평균 외출 간격 25–50분 유지|
|obr3|기존 5검사 모두 PASS. 정식 외출 체류 하한/상한·동행 시간/층 제한·회장 보호 유지|
|성능|첫 하루 **355.90ms <400ms**, warm **0.386ms <3ms**, 기존 한도 유지|
|최종 감사|**54,000 snapshot**, frozen/mismatch/stuckSeconds/near30/near24 **0/0/0/0/0**, `obr4-audit-final.txt`|
|구 232 코드 + 새 canon|326 좌표·homeSeat·세 시간대 snapshot 실행 PASS|
|마스코트|수정 없는 실제 모듈의 두 data-planned=false PASS|
|보존|index·hani-main·마스코트·reviewed baseline·관계 seed 원문 diff 0. 변경 전 파일의 동일 문구 21,373줄 EOL 보존 확인. `git -c core.whitespace=cr-at-eol diff --check` PASS|
|실제 브라우저/모바일|**미실행**, 사용자 지시로 서윤 담당. 준비한 browser 두 파일 syntax만 확인|

실행 명령:

```powershell
powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1
node --test --test-isolation=none scripts/hani-office-obr4.test.mjs
node docs/drafts/office-behavior-redesign/audit.mjs .
node scripts/hani-office-obr4-report.mjs
```

기대값 변경 이유:

- AI 직원 17→19, 2F 6→8, scheduler actor 19→21, fallback actor 17→19, 아직 로딩하지 않은 avatar 13→15, 초기 sprite 요청 17→19. 소집 2명 제외 결과 15→17. 심야 고정 5명은 유지했다.
- 두 사람의 homeSeat undefined/예약석·planned prop 기대를 본인 owner/실제 actor/불투명도 1로 바꿨다.
- 09:00 loaded table 검사에는 새 다온의 base-arrive-leave가 정확히 그 시각 실행될 수 있어, 전원 base-work 고정 대신 해당 사람·행동·시간이 실제 계획 안에 있는지를 검증한다. **offline이면 여전히 전원 base-work**를 요구한다.
- safety oracle은 실행 중 HEAD가 아니라 고정 **65cd8a0**의 결합 전 스냅샷으로 갱신했다. index는 고정 운영 **4ac6b6c**와 전체 바이트 비교한다. 보호 owner·무쓰기·version/cache·EOL assertion은 유지한다.
- **216/221의 예산·쿨다운 기대값은 바꾸지 않았다.** 216 120일 비교에서 인원 18→20, 정식 group 97→96, 노출 행 94→94. 공통 rules와 모든 family.limits는 전후 exact 동일(`obr4-budget-comparison.json`). 결과의 1건 차이는 신규 참여자·좌석 보호로 예약 경쟁이 바뀐 것이며 그룹 일일 상한 3·15% gate, 개인 휴식 2700초·층 이동 5400초·생활 외출 600초는 그대로다.

## Runtime closure와 승인 baseline

- `resolveRuntimeClosure({entrypoints:["index.html"], exists, read})`의 기본 index 진입 경로로 실제 파일을 읽었다: **127 / 상한 128, missing 0**. 같은 방식으로 수정 전 65cd8a0 내용도 127개임을 확인했다. 이번 패치의 closure 증가 0, 여유 1개다. 파일 목록은 `obr4-metrics.json`.
- 로컬 `scripts/hani-reviewed-release-baseline.mjs`: `trainBaseVersion=2.9.230`, 마지막 approved=04fb2b3(230), 232 SHA 미포함. 실제 표시 232와의 불일치를 진단했다. version projection 동작은 실행 확인했다. **파일을 수정하지 않았다**(SHA256 `0c74e6d467b4c40fd5b4aa1aa33d69b80672c8f225e93d503a46b8d640f28877`).
- 원격 후속 7a10595는 이미 231 approved 항목·trainBaseVersion=2.9.231로 갱신했지만, 232는 pending join 정규화로 다룬다. 따라서 서윤은 그 최신 변경을 먼저 대조하고 **정식 232를 승인 chain에 넣을지·trainBaseVersion을 232로 옮길지** 정리해야 한다. 로컬 230 파일을 그대로 최신 main 위에 덮어쓰면 안 된다.
- 219의 index 바이트 oracle은 현재 232에 고정되어 있다. 최종 열차에서 버전을 올릴 때 승인 baseline과 함께 버전 projection 경로를 조정한 뒤 관련 검사를 재실행해야 한다. 기존 전체 비교를 제거하거나 완화하지 않는다.

## 남은 위험과 다음 담당

- 실제 Edge 화면·390/1440 레이아웃·라벨 겹침·여덟 명 체감·마스코트 이미지 decode/시각 확인은 서윤이 실행해야 한다. 메모리 DOM 결과를 실제 화면 PASS로 보고하지 않는다.
- 원격 7a10595와의 테스트 충돌·승인 baseline 조정은 미통합이다. 기능 코드 충돌은 이번 비교에서 없지만 통합 후 동일 targeted 회귀가 필요하다.
- 취향 출처는 관계 seed 대신 승인 도감이다. 별도 정식 hobbies/quirks/voice 자료가 있으면 해당 범위 재생성이 필요하다.
- 기존 obr3의 평일 3인 동행 선택 요건은 이번 범위에서 해결하지 않았다. 기존 거리·예약 제한을 유지했다.
- Git add/commit을 로컬 기능 단위로 시도했으나 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/obr/index.lock` 생성 권한 거절. 미커밋 변경을 보존했다. push/PR/Notion 금지는 준수했다.
- 표시 버전·`?v=`·HANI_DISPLAY_VERSION·storage/Cloud/schema/migration·main 수정/merge·배포는 없다. 함께 배포할 Edge Function/설정도 없다.
- 다음 행동: 서윤이 이 작업 트리를 확인 → 원격 테스트 변경과 조정 → 실제 브라우저 검증 → 마지막 열차 버전/승인 baseline 정리. Candidate/서버 HINA/운영 read-back은 별도 단계다.
