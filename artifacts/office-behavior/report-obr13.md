# obr13 — 회장님 재실 연결·동료 방문 간격·긴 체류 문구

2026-10-24 착수 / 2026-10-25 완료 KST · 도연/Codex 단독 · branch `hani/office-234-chairman` · 시작 HEAD `46bd9d2` · 운영 기준 `beffc38`.

기능 개발과 Node 검증 완료. **전체 office 회귀 210 PASS / 0 FAIL / 선택 브라우저 3 SKIP**, 승인 baseline 14 PASS. 브라우저 파일은 작성·syntax 확인만 했으며 서윤 실행 대기다. 배포 완료가 아니다.

## 범위와 재실 규칙

- GitHub 연결 도구로 원격 main beffc3850ea890ec84ce623579b26b4b5a3cd35c 확인. 현재 branch는 여기에 tooling233을 합친 46bd9d2이며 merge/rebase하지 않았다. Git HTTPS는 프록시 연결 실패였다.
- CODEMAP living-office owner는 유효하지만 현 scheduler/test anchor는 없어 CODEMAP_MISS 후 canonical 경로를 검색했다. updateBuilding → snapshot → plan/blockPlan → reserve → 기존 actor 갱신을 유지했다.
- `hani-office-live.js:1358 createPresence`: 외부 HaniOfficePresence가 있으면 chairman=active 여부를 최우선 적용한다. 외부 객체를 생성·수정하지 않는다. 기본값은 #app 존재·login-locked 없음, visibilityState=visible, 최근 10분 입력이다. 로그인된 보이는 페이지는 최초 즉시 present다.
- 로그인 잠금은 명세의 잠금 테스트에 맞춰 즉시 absent다. 무활동은 마지막 입력으로부터 정확히 600,000ms에 absent, 숨김은 visibilitychange에서 숨김 시작을 기록하고 600,000ms 뒤 absent다. 처음부터 숨긴 페이지는 absent다. 잠금 해제·보임·입력이 회복되면 present다. 숨김 중 입력 시각만 바뀌어도 absent를 복귀시키지 않는다.
- `1378–1379`: pointerdown/keydown/wheel/touchstart에 동일 callback 하나를 passive로 등록한다(이벤트 종류별 등록 4개). callback은 메모리 시각만 기록한다. 추가 interval/timeout/observer 없음. 기존 4200ms update와 visibilitychange를 재사용한다. 보이는 일반 모드는 기존 frame update도 사용한다.
- `1476 cancelScheduledDuringMeeting`, `1603 updateBuilding`은 같은 officePresence.read()를 쓴다. 화면이 본사 밖이어도 기존 update 주기에서 메모리 판단을 갱신하고, 본사로 돌아올 때 현재 상태를 읽는다.
- 동일 날짜의 있음/없음은 기존 roster cache key 두 개로 분리된다. 반복 read·짧은 숨김/보임·교차 조회가 값을 흔들거나 동일 roster 계획을 다시 만들지 않는지 검사했다.

## 회장님 근무 하루: 2026-10-22 09:00–18:00, 1초 간격

- 홈 4F ceo-reserved, human_user/chairman/ceo_frog, spriteId seongmin을 유지했다. AI 직원 등록으로 바꾸지 않았다. 실제 owner DOM에서도 actor를 재생성하지 않고 재실·잠금·무활동·재입력·override에 따라 숨김/표시했다.
- 기존 221 회장님 가족은 하루 max=1이어서 세 variant를 같은 날 모두 보여줄 수 없었다. 221에 한해 기존 세 variant를 09:05/13:05/16:05 부근(day seed 0–59초)에 각 1회 제안한다. 같은 canonical opportunity/reserve를 사용하며 3시간 cooldown·개인 비업무 45분·근접·공간·동시 예약 거절은 유지한다. transient 거절은 같은 행동을 30초씩 최대 2회 재시도한다. 216 fallback의 원래 예산·208일 reachability 검사는 그대로 유지했다.
- 기본 업무 포함 11개 actionId, 문구 60종. 기존 233 근무시간에 나온 회장님 actionId 중 현재 0이 된 종류 **0**. 수행 초는 해당 actionId의 실제 snapshot 초이며, base-work에는 장소 외출·이동 상태도 포함된다.

|행동|ID|관측 초|실제 문구 예|
|---|---|---:|---|
|기본 업무|`base-work`|30228|옥상 테라스에서 AI 이야기 메모 중|
|night-exec-starlight|`night-exec-starlight`|613|밤의 메모를 차곡차곡 모으는 중.|
|night-exec-page|`night-exec-page`|655|다음 장도 천천히 볼까요.|
|서류 결재 도장|`sig-seongmin-1`|20|확인하고 차분히 이어가죠.|
|night-exec-connection|`night-exec-connection`|598|이 생각은 어디로 이어질까요?|
|커피|`base-coffee`|60|잠깐 커피 한 잔|
|읽기|`base-read`|103|한 장씩 확인 중|
|생각 정리|`base-think`|18|생각 정리 중|
|산책|`base-walk`|45|잠깐 걸을게요|
|커피 한 모금|`sig-seongmin-4`|15|잠깐 보고 이어가죠.|
|직원들 사이 순시|`sig-seongmin-5`|45|각자 페이스대로 이어가세요.|

- 회장님 외출 89건(전일). 회의실·소파·창가 affinity를 기존 장소 JSON에서 읽으며 다른 직원과 같은 자원/동시 예약/20·24px 검사를 적용한다. 근무시간 실제 gathering 합류 126초, 상대 ID: dohyun. 같은 시점에 출발하는 회장님 그룹 외출은 이번 날짜 0건이며, 동료와 실제 같은 장소에서 만난 결과와 구분한다. 회장님 전용 관계 데이터를 추가하지 않았다.
- 전일 외출 상세는 [obr13-metrics.json](obr13-metrics.json)의 chairmanOutings, 근무시간 장소 체류는 places를 참조한다. 실제 동료 방문과 동행 이름의 위치를 검증했다.

## 아린 제안

- `hani-office-live.js:239`: 동료 자리 용무에만 실제 홈과 ≥32px인 기존 junction을 후보로 사용한다. 가로 접근을 우선하도록 세로 차이 오름차순·가로 차이 내림차순으로 정렬한다. 다른 정지 20px·이동 24px·기존 optional crossing 30px·체류 하한은 그대로다.
- 회장님 있음 10/22 전일 동료 방문 928건을 실제 동료 snapshot과 대조: 최소 **34.985755px**(1672×941 기준). 접근 슬롯 정렬·동료 이름/홈/현재 위치·목표 anchor·예약을 함께 검사했다.
- `1234 placeLine`, `1302–1320`: 실제 개인 도착부터 개인 복귀 출발까지 90초를 넘는 AT_PLACE는 그 중간 시점에 같은 장소의 atByPerson/at 중 초기 문구와 다른 문구로 한 번 전환한다. seed로 선택해 역순 조회에도 같다. signature도 같은 경로를 쓰고, 동행/gathering은 실제 동료 이름을 보존하면서 승인된 장소 문구로 전환한다. 이동/먼저 도착해 기다림/복귀 문구는 기존 상태 분기를 유지했다.
- 혼자 긴 체류 174건, 사회적 긴 체류 33건에서 midpoint 전후·장소/문구·가짜 문구 거절·결정성을 검사했다. 사회적 동료 구성 변경은 기존 실제 입퇴장 경계에서 계속 반영한다.

## 검증과 성능

- 회귀: `powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1`. Node 동시 묶음을 제거하고 파일별 단독 실행으로 바꿨다. [최종 전체 로그](obr13-regression-verified.log). 공통 engine import에 따른 중복 실행을 포함한 실행 횟수이며 고유 테스트 수로 부풀리지 않는다.
- 승인: `node --require ./scripts/hani-office-234-git-preload.cjs --test --test-isolation=none scripts/hani-reviewed-release-baseline.test.mjs`, [14 PASS 로그](obr13-approval-final.log). 233은 beffc38 Git 원본으로 전환했고 기존 225→232 chain과 233 scoped fixture도 모두 역검증한다. 새 pending234는 hani-office-live.js 정확한 전체 before/after 한 쌍만 허용한다. 기존 233 fixture 파일 변경0. 누락·변경·중복·이동·EOL·unlisted owner 부정 검증 유지.
- obr6/obr12의 기존 바이트 최적화 검사는 shipped 233 원본 hash 6cd4b68f…에 연결해 보존했다. 변경된 234에는 별도 authored frozen oracle로 6개 전체 formal/outing 장부와 84 snapshot을 byte/deepEqual 비교한다. 원본 oracle 재생성/기준 완화 없음. obr8은 세 날짜의 명시적 234 formal delta를 exact fixture와 비교하며 나머지 예약·체류·문구 검사를 계속 실제 234에 수행한다.
- Node Git spawnSync EPERM 환경이므로 `scripts/hani-office-234-export-git.ps1`로 역사 Git 객체만 원문 export한 후 read-only preload를 사용했다. 매 read에 Git blob SHA-1을 검증한다. 현재 소스를 역사 원본으로 대체하지 않는다. export manifest/실패 원본 로그도 로컬 보존한다. 최종 suite 실행 시 NODE_OPTIONS=--require ./scripts/hani-office-234-git-preload.cjs를 사용했다.

|재실|cold 3회(ms)|best-of-3(ms), 기준 <400|warm 3회 평균(ms/회), 기준 <3|
|---|---|---:|---|
|없음|304.792 / 276.876 / 285.856|276.876 PASS|0.560 / 0.539 / 0.605 PASS|
|있음|277.219 / 286.848 / 277.116|277.116 PASS|0.609 / 0.597 / 0.605 PASS|

- `node --require ./scripts/hani-office-234-git-preload.cjs scripts/hani-office-chairman-234-metrics.mjs`: 각 fresh engine에서 전체 formal+outing 첫 계획을 측정한 뒤 1,000 snapshot 평균을 측정했다. cold 원표본 3개를 모두 보고하며 best-of-3라는 요청 기준으로 판정했다. 기존 obr12의 3회 최대 ≤300ms 목표는 이번 명세의 판정 기준으로 바꾸어 재사용하지 않았다.

|감사 상태|snapshot|0px 보행|말/위치 불일치|정체 초|near30|near24|
|---|---:|---:|---:|---:|---:|---:|
|회장님 없음|54000|0|0|0|0|0|
|회장님 있음|54000|0|0|0|0|0|

- 감사 명령: `node docs/drafts/office-behavior-redesign/audit.mjs <repo> [--chairman]`. [없음](obr13-audit-absent.log), [있음](obr13-audit-present.log). 기존 감사 기준을 그대로 두고 presence 옵션만 추가했다.
- syntax/diff --check 및 금지 파일 원문 SHA 비교 PASS. [최종 identity·보호 파일·검증 JSON](obr13-results.json). runtime SHA256: `cd2940908b8d5739107b58594cd316e1c56daa80bd61062d86948b71b9830679`.

## 남은 위험과 인계

- `scripts/hani-office-chairman-234.browser.mjs`는 390/1440에서 실제 office markup/loader/renderer·개구리 seongmin.webp 로딩·잠금/무활동/재입력·write0·persistent actor를 검증하도록 작성했다. **작성·syntax만 확인, 실행/스크린샷/실기기 체감은 미검증**. 서윤이 실행해야 한다. 이 fixture는 본사 DOM을 격리하며 실제 계정 인증/Cloud 통합을 검증하지 않는다.
- data/hani-building/office-places.json 수정0 → 추가 data seed PR 불필요. spatial-contract/art-map/mascot/index/main/version/cache 태그 수정0. 새 runtime 파일0, storage/Cloud write0, 신규 네트워크0. 기존 metadata/sprite 로더의 읽기는 유지한다.
- 버전 증가·Candidate/package/One-Pass/HINA·Preview 실화면·main merge·Pages·운영 JS/read-back은 이번 기능 개발 범위 밖이다. push/PR/Notion은 사용자 명시 금지로 수행하지 않았다. 서버 Edge Function/설정 동반 배포 없음.
- 로컬 커밋 결과는 [작업 인수인계](../../docs/development-history/handoffs/2026-10-24-office-obr13.md)에 남긴다. Git 차단이면 사용자 지시대로 미커밋 보존하며 권한 우회하지 않는다.
- 다음 행동: 서윤 브라우저 실행 → 390/1440 Preview 확인 → 배포 담당이 열차 통합/버전 증가/정식 Candidate 절차 수행. 본 작업 기록을 main/배포 승인으로 해석하지 않는다.
