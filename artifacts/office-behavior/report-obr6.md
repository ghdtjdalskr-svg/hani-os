# obr6 — 하루 첫 계획 성능 회복

2026-10-23 KST / 도연(Codex). 상태: 구현·지정 검증 완료 / 로컬 Git 쓰기 차단으로 미커밋 인계.

## 작업 기준과 보존

- worktree `obr`, branch `hani/release-train-20261023`, 시작 HEAD `d5642fc1a92b7afff2d61b5845535d47d44994a2`.
- GitHub 연결 도구로 최신 main `d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf` 확인. 로컬 origin/main과 동일. 셸 원격 조회는 프록시 연결 실패. merge/rebase 없음.
- 서윤의 다섯 번째 선택적 metadata URL(`office-places.json`)과 별도 fetch 제거는 유지했다. 기존 `behavior-browser.json` 수정 및 기존 untracked artifacts도 보존했다.
- runtime 수정은 `hani-office-live.js`의 메모리 계산·조회에 한정했다. index·표시 버전·`?v=`·마스코트·`data/`·행동 JSON은 HEAD 대비 변경0. 로컬 표시/cache 2.9.232, 마지막 script `hani-launch-greeting.js` 유지. push/PR/Notion 금지 준수.
- 최종 runtime SHA-256: `c107037831425beddd3ec929603d78c53b6bd83285842feb484675220403bd1e`.

## 원인 측정

`scripts/hani-office-obr6-report.mjs --profile -o <결과.json>`으로 VM/scene 준비 이후 첫 `plan + blockPlan` 구간만 V8 CPU profile로 수집했다. 기존 성능 테스트의 코드·한도·측정 구간은 변경하지 않았다.

- 수정 전 profile: formal 247.66ms + outing 296.55ms = 544.21ms. profile 수집 부담이 포함되므로 성능 게이트의 단독 측정값과 구분한다. CPU self time 상위는 reserve 43.95ms, plan 39.78ms, attempt 39.63ms, route 39.32ms, ledgerOverlaps 28.35ms, slot 27.79ms, travelSeconds 25.48ms였다.
- 같은 수정 전 소스에서 명부만 다온·윤슬 제외/포함한 계수 비교(화면 actor19→21, scheduler 명부18→20): formal 8,238→8,252, outing 563→595, reserve 호출 9,510→9,577, stateAt 호출 108,296→123,413(약14% 증가). 두 명 추가가 formal 건수보다 이동 충돌 검사 프레임과 캐시 조회 비용을 크게 늘렸다. 이 계수 실험에는 측정용 counter가 있으므로 출력 시간은 성능 합격 근거로 사용하지 않았다.
- 최종 수정 후 profile: formal 153.29ms + outing 167.26ms = 320.55ms. profile 없이 실행한 기존 성능 게이트와 아래 단독 3회 결과로 합격 여부를 판단한다.
- 근거: `obr6-before.json(.cpuprofile)`, `obr6-after-final-v3.json(.cpuprofile)`, `obr6-roster-cause.json`, `obr6-profile-final-summary.json`. profile 해석: `node scripts/hani-office-obr6-profile.mjs <profile>`.

## 변경 내용

- 동일한 경로 edge 가중치를 source별 Dijkstra에서 재계산하지 않고 scene 메모리에 보관한다. Dijkstra의 open 집합 최솟값 선형 탐색은 heap으로 바꾸되 동일 거리는 기존 Set 삽입 순번으로 비교하고 stale entry를 버린다. 가중치 산식·경로 선택 순서를 유지한다.
- 예약 검색용 내부 bucket을 600→60초로 좁혀 짧은 일정 조회에서 불필요한 후보를 줄인다. outing의 600초 블록·체류·예약·cooldown 규칙은 그대로다.
- path/slot/travel/targets 캐시는 긴 문자열 결합 대신 출발점·도착점, anchor·pose, 날짜·action·subject·home시간대의 중첩 Map으로 조회한다. targets의 6,000개 초과 시 폐기 조건은 유지한다. 인물 조회는 고정 명부 Map을 사용한다.
- 시간대에 따라 home이 바뀌는 인물만 home 점유 검사에 넣는다. 같은 card/time의 결정적 slot 순서는 한 번만 계산한다. 난수 seed와 정렬 동점 순서는 유지한다.
- 연속 선형 충돌 검사에서 이미 전체 경로로 보호한 정지 home의 표정 일정 경계와, 궤적의 층이 전혀 겹치지 않는 예약은 다시 분할하지 않는다. 비교 대상 이동·자리 비움의 모든 궤적/도착/복귀/층 이동 양측 경계는 유지하며, 20/24px 기준과 그룹 내부 검사는 유지한다. 프레임 내 같은 pixel 좌표는 두 번 환산하지 않는다.
- outing cap 검사도 같은 interval index를 사용하고, 같은 180초 시점의 formal busy 집합은 층마다 재생성하지 않는다.
- 검토 중 효과가 없던 사전 geometry 기각 shortcut은 최종 코드에 넣지 않았다.

## 수정 전 계획 고정과 동일성

runtime 수정 전에 formal/outing ledger 및 해당 순간 snapshot을 JSON으로 저장했다. gzip은 저장 용량만 줄이며 비교는 압축 해제한 원본으로 수행한다. 고정 fixture는 이미 존재하면 재생성을 거부한다.

| 경우 | 날짜·시각(KST) | 재실 옵션 | formal | outing |
|---|---|---|---:|---:|
| 평일 | 2026-10-22 09:00 | 기본 명부 | 8,252 | 595 |
| 주말 | 2026-10-24 12:30 | 기본 명부 | 5,991 | 592 |
| 심야 | 2026-10-23 01:40 | 서윤·도현·세린·유리·아린·히나·유나·민지 | 6,001 | 305 |

`scripts/hani-office-obr6.test.mjs` 4개 모두 PASS. 날짜3개는 동일 날짜·재실 옵션으로 JSON 문자열 전체 byte 일치와 parsed `deepEqual`을 모두 검사한다. snapshot도 함께 비교하고 local/session storage 쓰기·삭제 호출0을 검사한다. 네 번째는 수정 전 소스로 생성한 고정 row별 SHA-256과 전체331×331=109,561개 경로를 비교하여 Dijkstra 동점 선택까지 확인한다. 근거: `obr6-equivalence-final.txt`.

- fixture: `scripts/fixtures/office-obr6-plans.json.gz`.
- 압축 전 fixture SHA-256: `6d9a5ba005b5607e5c856dc1b96e77d2be493a28e1bbbe831f86719e9543c794`.
- 수정 전 소스 SHA-256: `e46d98716baf53ffaaa69b30c1413675d53fcb596b17f5199baedc29c322410a`. `obr6-before.js`와 고정 fixture에 연결된다. `obr6-baseline-source.mjs`는 HEAD 원문에 서윤의 시작 metadata 변경만 복원한 뒤 이 SHA로 확인한다.
- 경로 fixture: `scripts/fixtures/office-obr6-routes.json`. 생성기도 기존 fixture 덮어쓰기를 거부한다.

## 최종 검증

단독 성능은 기존 명령 `node --test --test-isolation=none scripts/hani-office-lively-v2.test.mjs`를 동일 최종 runtime으로, 다른 검사 동시 실행 없이 연속3회 수행했다. 각 실행은 원래8개 테스트 전체를 실행했고 모두8 PASS/0 FAIL이다.

| 단독 실행 | 첫 formal+outing(ms), 기준 <400 | warm snapshot(ms), 기준 <3 | 근거 |
|---|---:|---:|---|
| 1 | 267.7203 | 0.4810819 | `obr6-standalone-v3-1.txt` |
| 2 | 288.7471 | 0.5377006 | `obr6-standalone-v3-2.txt` |
| 3 | 284.1318 | 0.5191843 | `obr6-standalone-v3-3.txt` |

중간 구현의408.16ms 및402.50/380.14/402.31ms 실패 로그도 보존했다. 실패를 합격으로 바꾸거나 같은 코드의 통과 표본만 고른 것이 아니라, 추가 코드 최적화 후 위 새 identity로3회 전체를 재측정했다.

추가 최적화 뒤 단독339.83/340.27/385.10ms로 통과했지만, 전체 회귀에서 메모리 `Map.clear()` 한 곳이 기존 무쓰기 정적 검사4건에 걸렸다(`obr6-all-tests-final-v2.txt`). 검사를 변경하지 않고 원래 key별 delete 폐기 방식으로 수정했다. 위 v3는 그 수정까지 포함한 최종 source의 새3회다.

| 최종 검사 | 결과 | 근거 |
|---|---|---|
| `powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1` | 124개 / 121 PASS / 0 FAIL / 기존 browser3 SKIP, 122.21초 | `obr6-all-tests-final-v3.txt` |
| 기존 전체 회귀 안의 성능 게이트 | first 225.5774ms / warm 0.4834467ms PASS | 같은 로그 |
| `node docs/drafts/office-behavior-redesign/audit.mjs .` | 54,000 snapshot; frozen/mismatch/stuckSeconds/near30/near24 = 0/0/0/0/0, 공유 engine6 PASS | `obr6-audit-final.txt` |
| 수정 전 계획·snapshot3일 + 전체 경로 | 4 PASS / 0 FAIL | `obr6-equivalence-final.txt` |
| 문법·diff·보호 파일 | Node 실행 파싱, `git diff --check`, index/main/data/마스코트/행동 JSON HEAD 대비 diff0 | Git/검사 결과 |
| 기계 판독 한국어 결과 | 위 한도·회귀·감사 결과를 assertion으로 재확인하고 UTF-8 JSON 저장 | `obr6-results.json` |

한국어 `-o` 결과 재현: `node artifacts/office-behavior/obr6-finalize.mjs -o artifacts/office-behavior/obr6-results.json`. 이 명령은 실제 로그와 최종 runtime SHA-256을 확인하며 PASS 값을 임의 입력하지 않는다. PowerShell UTF-16 로그도 BOM에 맞춰 읽는다.

최초 전체 회귀는 123개/119 PASS/1 FAIL/3 browser SKIP(131.58초)이었다. 유일 실패는 219의 `spawnSync git EPERM`. 이 실행의 기존 성능 테스트는 first 362.61ms/warm 0.518ms로 통과했다. 환경 보완 재실행에서는 기존 obr5의 읽기 전용 Git export 공급기를 재사용한다. native Git으로 원문78개의 객체 ID를 다시 비교해78/78 일치 확인했다(`obr6-git-exports-verified.json`). 공급기는 SHA-256도 검사한다. Git oracle나 원본 테스트는 수정하지 않는다.

재현: `HANI_OBR5_GIT_EXPORTS=<obr>/artifacts/office-behavior/obr5-git-exports`, `NODE_OPTIONS=--require ./artifacts/office-behavior/obr5-git-preload.cjs`를 설정하고 `powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1`. 일반 Git spawn 환경에서는 보조 설정 없이 원래 명령을 사용한다. NODE_OPTIONS의 절대 Windows 역슬래시 경로를 넣은 첫 보완 시도는 경로 파싱으로 실패했으며, 상대 경로로 바로잡았다.

## 경계와 인계

- storage write·Cloud write/schema·migration 경로 추가/변경0. 새로운 DOM/event/renderer layer 없음. 근접·예약·결정성 기준 완화0.
- 브라우저3개는 기존 환경에 따라 SKIP. 실제 Preview/실기기·package/One-Pass/독립 HINA/main merge/Pages/Production read-back은 미실행이며 배포 완료가 아니다.
- 버전 검사는 기능 담당의 사용자 명시 금지에 따라 N/A. 출발 후보 버전·배포 검증은 서윤 담당이다.
- 이전 obr3/obr4의 평일3인 동행·관계 seed 관련 미해결 범위는 이번 성능 작업으로 해결했다고 주장하지 않는다. 계획 원본과 동일하므로 기존 결과도 그대로다.
- Notion은 사용자 명시 금지로 미반영. 별도 서버 Edge Function·설정 배포 없음.
- 로컬 Git: 명시한 신규 테스트·fixture·도구·인수인계만 `git add` 시도했으나 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/obr/index.lock: Permission denied`. 신규 commit/staged 변경 없이 시작 HEAD 유지. 권한 우회나 사용자 metadata의 별도 stage/commit은 하지 않았다. source·테스트·보고·인수인계 모두 작업 트리에서 인계한다.
- 서윤의 다음 행동: 최종 source/fixture/test와 본 보고를 열차 Candidate에 반영하고 기존 Freeze→Candidate gate→Preview/승인 절차로 진행한다. 이번 검증은 배포 승인 또는 Production 완료 선언이 아니다.
