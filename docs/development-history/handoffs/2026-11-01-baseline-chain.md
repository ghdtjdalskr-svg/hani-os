# 승인 기준선 검사 정리 · 도연(Codex)

- 작업일: 2026-11-01 KST
- 상태: 구현·targeted 검증 완료. commit 시도 결과는 아래 기록. main 병합·배포 작업 아님.
- branch: `hani/tooling-baseline-chain`
- base / 시작 HEAD / 로컬 origin/main: `53db8f60ed8b362a77af77d2f989da20abdbd722`
- 표시 버전: 로컬 `2.9.243`. 원격 최신 조회는 네트워크 차단으로 실패.
- 승인 범위: scripts 검사 도구·fixtures 및 이 인수인계 문서. 런타임·버전·데이터·Cloud 변경, push/PR/main/배포/Notion/Edge 실행 금지.
- CODEMAP: 해당 baseline 도구 anchor 없음(CODEMAP_MISS), 직접 owner/importer 검색으로 전환.
- 계획: Git release 원본과 기존 fixture의 역사적 증명을 보존하고, origin/main의 연속된 release PR만 따라가는 체인을 검증한다. 현재 작업 파일을 기대값으로 사용하지 않는다.

## Git 기준선과 drift

시작 시 HEAD와 로컬 origin/main은 모두 `53db8f6`(243)이었고 clean 상태였다. 작업 중 다른 담당이 origin/main을 `275a39ce7780cbf84fa915e18cdbb9f9ad9ae46d`(244 / #369)로 갱신한 것을 확인했다. HEAD와 작업 기준은 `53db8f6` 그대로다. merge/rebase/fetch/push/PR/배포/Notion/Edge 실행은 하지 않았다. 원격 직접 조회(`git ls-remote origin refs/heads/main`)는 연결 실패였으므로, 여기서 main 증거는 로컬에 실제 존재하는 origin/main 이력이다. Production 244 반영 여부는 검증하지 않았다.

현재 작업의 비교 결과는 243 공통 기준점에 속한다. 별도로 임시 폴더에서 실제 244 Git 원본도 검사했다. 운영 버전·마지막 UI JS의 서버 로딩 확인은 개발도구 전용 작업이므로 N/A이며, 로컬 index의 마지막 script는 `hani-launch-greeting.js`이다.

## 원인표

수정 전 53db8f6의 도구/소스는 **4 PASS / 10 FAIL**을 재현했다. `0e34544`의 도구 2개와 런타임 원본을 임시 폴더에서 재현하자 **7 PASS / 7 FAIL**이었다. 아래 번호는 수정 전 14개 테스트 순서다. 문자열 존재만으로 추정하지 않고 Git 원본으로 실행한 결과다.

| 기존 실패 | 최초 원인·Git 증거 | 영향 파일·실패 이유 |
|---|---|---|
| 1 현재 바이트 재현 | 235 `0e34544` #349 | 235에서는 index의 마일스톤 hero/collection 연결이 233 기대값과 달랐다. 현재는 237 `8e1d1b1`의 main 변경도 먼저 걸린다. UI/CSS 후속 변경 역시 미등록이다. |
| 3 버전 projection | 235 `0e34544` #349 | 이미 235인 HTML을 233→234 전용 함수로 처리해 234 title을 기대했다. 현재 버전 243에도 같은 낡은 기대다. |
| 4 control/storage/source/EOL 거부 | 235 `0e34544` #349 | index 정상 입력부터 기존 233 기대값과 달라, 실제 변조 검사에 도달하지 못했다. |
| 5 index 미등록 삽입 거부 | 235 `0e34544` #349 | index 정상 입력과 기대값의 불일치가 삽입 변조 전에 발생했다. |
| 6 pending 누락/중복/변조 | 240 `19f9fad` #361 이후 office 변경 | `office-lively-labels-235`의 전체 JS after는 실제 236 `4eafeb7`에 배포됐다. 240의 라벨 변경 및 241~243 후속 변경 때문에 현재 JS는 그 frozen after가 아니다. CURRENT에서 옛 전체 파일을 strip하려다 실패한다. |
| 9 office/staff/move | 위와 동일: 236 fixture를 CURRENT에 적용, 240 이후 불일치 | `hani-office-live.js` 첫 pending 정규화가 실패해 나머지 staff/move 검증 전에 중단됐다. |
| 10 numeric fix 원본 보존 | 237 `8e1d1b1` #356 | f2df938/7471e5a의 숫자 라인은 남아 있지만 main의 숨은 canvas guard·investment 탭 전환·운동 빈 기록 문구가 정식 변경됐다. main 전체를 233 기준으로 비교하는 정상 입력이 먼저 실패했다. |
| 11 f27be17 CSS follow-up | 235 `0e34544` #349 | `hani-design-system.css`의 마일스톤 collection 카드 변경을 233 correction hash와 직접 비교했다. 236·237·239에도 같은 owner가 바뀐다. |
| 12 date border | 235 `0e34544` #349 | 현재 design-system에서 scroll만 되돌려도 233 date-stage hash가 되지 않는다. 승인된 235 이후 CSS가 포함돼 있기 때문이다. |
| 14 mobile scroll | 235 `0e34544` #349 | 현재 design-system 전체를 고정 233 after hash와 비교했다. 235 이후 CSS 변경과 역사 증명을 혼동했다. |

235의 7건은 **1·3·4·5·11·12·14**이다. 이후 추가된 것은 **237의 10**, **240 이후의 6·9**이다. 234 chairman 자체는 기존 pending으로 되돌릴 수 있었으나, 실제 배포 후에도 pending에 남아 있었다.

다음은 `git log --first-parent`와 각 `git diff-tree`에서 얻은 승인 release 체인이다. 모두 실제 release PR 제목·40자리 SHA·해당 커밋의 canonical 표시 버전이 일치한다. 각 release에는 표의 기능 owner 외에 main/index 표시·캐시 변경이 있다.

| 버전 / PR | SHA | 기능 owner 변경 |
|---|---|---|
| 234 / #345 | `ead7eff653bcbf3055003088bd5764149ee484e3` | office-live.js: chairman |
| 235 / #349 | `0e34544d514b06c1f90b5d0dddc18e31102c3ff2` | design-system.css, milestones.js, ui-v02992.js, index: collection/hero 연결 |
| 236 / #353 | `4eafeb7d87cf8b6d827f49b5ab34a01a1ddd404d` | design-system.css, milestones.js, office-live.js/css: lively/labels |
| 237 / #356 | `8e1d1b1ecb5b3699cd1e02ddc19ac9bc9e3db8fc` | design-system.css, development-history.css, organization-hub.css, main.js: 대비·canvas/빈 화면 |
| 238 / #357 | `5122c7cd8c3de3bd1dad70255abc48bcc5d11e6e` | newsroom-4cut.js: issue 1 catalog |
| 239 / #360 | `f82f5d18e8052ed65ad75f0834ff401d59967acd` | design-system.css, ilbo.css, milestones.js: 카드 이미지·글꼴 |
| 240 / #361 | `19f9fad4f8f2b9eed785b94e9d2938bb6d9cd7f0` | office-live.js: 상단 라벨 |
| 241 / #363 | `b6656b43ecd9595367c177c569ea34a810f7a71d` | office-live.js/css: 혼잡 라벨 |
| 242 / #365 | `39ce4a137a20c7531b96e6e539dfe53762223138` | desk-mascots.js, office-live.js/css: 캐릭터 움직임 |
| 243 / #367 | `86a153b509d91b479ed384c55d9d07623e5cfcdb` | office-live.js/css: 빛·옥상 밤 |
| 244 / #369 (작업 중 갱신) | `275a39ce7780cbf84fa915e18cdbb9f9ad9ae46d` | office-live.js/css: 주간 연속극 |

## 변경 요약과 신뢰 경계

- `scripts/hani-merged-release-chain.mjs` 추가: origin/main **first-parent**에 실제 들어온 `release: v2.9.N … (#PR)`만 선택한다. 233 anchor, 연속 버전, 중복 PR 거부, release 제목과 main 표시 버전 일치, main/index 변경 포함을 검증한다.
- 브랜치와 main의 공통 조상은 **main release 목록의 끝점 선택**에만 사용한다. HEAD나 작업 파일을 기대값으로 채택하지 않는다. main이 244로 진행해도 243 기반 기능 브랜치에는 243 체인이 적용된다. 공통 조상이 main first-parent에 없으면 거부한다.
- 파일별로 직전 승인 기대값 = 다음 release의 부모 파일을 먼저 확인하고, 일치한 경우에만 그 release SHA의 원본으로 전진한다. 마지막 release 이후 선택 기준점의 파일도 일치해야 한다. 릴리스 사이/이후의 미등록 변경은 그대로 실패한다.
- 기존 225→232 allow-list, 233의 모든 fixture·hash·merge identity·양방향 증명을 유지한다. 234 chairman과 **실제 배포 버전 236**인 lively-labels-235를 `releasedOfficeConnections`로 옮기고, 두 release 원본을 이전 승인 원본으로 정확히 역검증한다. fixture JSON 수정 없음. `pendingApprovedConnections=[]`, 현재 원본을 strip하지 않는다.
- 233 CSS/숫자 역사 증명은 고정 `beffc38` 원본에서 수행한다. 현재 바이트 비교는 별도의 merged-release oracle로 수행한다. title projection도 고정 233 HTML에 대해 검사하므로 234라는 역사적 기대를 최신 HTML에 강요하지 않는다.
- 보호 파일은 기존 owner를 유지하며 release에서 바뀐 root runtime owner를 포함해 현재 28개다. 기존 보호 assets/data 3종도 release 파일 목록에 포함할 수 있다. 233에 없는 새 owner의 출발 원본은 자동 추정하지 않고 실패한다. 새 source origin은 Git 근거로 별도 검토해야 한다.
- 보호 저장소·Cloud·schema·런타임·버전·캐시 태그 변경 없음. `trainBaseVersion=2.9.233`은 역사 projection 상수로 유지하고, 최신 비교에는 선택된 release의 실제 버전을 사용한다.

## 약화 없음: 부정 테스트별 근거

기존 테스트 14개를 삭제·skip하지 않았고 새 테스트 3개를 추가해 총 17개다. 단순히 예외가 나면 성공하는 상황을 막기 위해 현재 owner의 정상 입력을 먼저 통과시키고, 변조가 실제로 바이트를 바꿨는지도 확인한다.

| 검증 대상 | 유지/강화한 거부 증거 |
|---|---|
| control·보호 안내·storage·source·EOL | resetBtn, 원본 보호 안내, localStorage 호출, 위원회 control, CRLF→LF 변조 거부 유지. 정상 입력 통과 후 실행한다. |
| 미등록 script 삽입 | index의 정상 바이트 비교 PASS 후 unlisted-third 삽입을 byte assertion에서 거부한다. |
| office fixture 누락·중복·변조 | 빈 pending 반복문으로 대체하지 않았다. released 234/236의 실제 전체 after를 각 fixture로 역검증하고, 모든 addition의 누락·중복·변조를 정규화 단계에서 거부한다. 연결 수/owner 목록도 고정 검증한다. |
| newsroom EOL·report data·control·storage | 기존 10종 변조 유지. 현재 전체 owner positive 및 추가 5종 byte 변조가 별도로 보강한다. |
| script/event/cascade 위치 | newsroom 3종 이동 거부 유지. office의 역사 fragment 이동은 이전 원본과 달라짐을 확인하며 현재 office도 직접 byte 비교한다. |
| staff rank·입사일·identity | 기존 5종 현재 staff 변경 거부 유지. |
| numeric fix | f2df938/7471e5a SHA·한 줄 delta·정확한 233 라인 확인. before 복원·삭제·중복·return 값 변조·EOL·이동 모두 고정 233 oracle에서 거부한다. |
| CSS follow-up/correction | 고정 SHA/hash·forward/reverse·기존 correction 전개 유지. 현재 CSS 추가 및 EOL 변조도 positive 후 직접 거부한다. |
| date border | 고정 stage hash·양방향 전개 유지. 그 stage의 삭제·중복·변조가 실제로 다름을 확인하고 거부한다. 최신 전체 CSS도 별도 엄격 비교한다. |
| open-only Remote | 기존 before/after hash·selector 제거·누락·중복·추가·역정규화 유지. 현재 Remote owner도 byte 변조 전부 거부한다. |
| mobile scroll | 기존 fixture identity·hash·forward/reverse 및 삭제·중복·추가·padding/margin/breakpoint·이동·EOL 변조를 고정 233에서 모두 거부한다. 최신 design-system 전체도 별도 비교한다. |
| 모든 현재 owner (신규) | 28개 각각 positive → 첫 바이트 삭제/전체 중복/추가/첫 바이트 이동/EOL 변경 5종(총 140종)을 실제 byte assertion에서 거부한다. |
| 승인 목록·Git 경계 (신규) | release 누락·중복·PR 제목 누락·표시 버전 불일치·PR 중복·version owner 누락·233 anchor 부재·무관한 base 거부. release 전/후의 미등록 control/EOL과 목록에 없는 owner 변경도 거부한다. |

## 테스트 결과와 재현

환경: Windows PowerShell, Node `v24.20.0`. Node의 child Git spawn은 sandbox `EPERM`이다. 따라서 bare 명령은 이 환경에서 실행 경로가 차단된다. 테스트를 약화하거나 Git 기대값을 현재 파일로 대체하지 않고, 임시 폴더의 read-only Git broker를 사용했다. broker는 PowerShell에서 실제 `git show/log/diff-tree/merge-base/diff`를 실행하고 stdout 바이트를 그대로 Node에 전달한다. 실패를 PASS로 바꾸거나 테스트 소스를 바꾸는 기능은 없다.

명령:

```powershell
# 정상 Git spawn 환경에서의 canonical 명령
node --test --test-isolation=none scripts/hani-reviewed-release-baseline.test.mjs
node --test --test-isolation=none scripts/hani-qa-1st.test.cjs

# 이번 sandbox에서 실제 사용: broker worker 실행 상태
$env:HANI_BASELINE_GIT_BROKER = Join-Path $env:TEMP 'hani-baseline-chain-broker'
node --require "$env:HANI_BASELINE_GIT_BROKER/preload.cjs" --test --test-isolation=none --test-reporter=tap scripts/hani-reviewed-release-baseline.test.mjs
```

| 실행 대상 | 결과 |
|---|---|
| 원본 235 도구+런타임 | 7 PASS / 7 FAIL 재현 (`release235-baseline.log`) |
| 시작 53db8f6 원본 | 4 PASS / 10 FAIL 재현 (`before-baseline.log`) |
| 수정 후 243 브랜치, main 244 drift 포함 | **17 PASS / 0 FAIL** (`after-baseline.log`) |
| 모의 244: pinned 243 Git 원본에서 244 태그·office delta 생성 | **17 PASS / 0 FAIL** (`future-baseline.log`, drift 대응 전 검증) |
| 실제 244 `275a39c` 원본 | **17 PASS / 0 FAIL** (`actual244-baseline.log`) |
| hani-qa-1st.test.cjs | **10 PASS / 0 FAIL**, broker 없이 실행 (`qa-1st.log`) |
| hani-ui237.test.cjs | **미실행: 파일 없음**. 시작 HEAD와 origin/main Git 트리 및 scripts 검색에서 해당/유사 237 테스트를 찾지 못했다. 임의 테스트 생성이나 PASS 표시 안 함. |
| 변경 mjs 3종 `node --check` | PASS |
| 기존 도구의 유지된 행 EOL 비교 | baseline 100행 / test 147행 PASS. 원본 mixed EOL을 전체 정규화하지 않았다. |
| `git diff --check` 및 runtime/fixtures 경로 diff | PASS, 런타임·기존 fixture 변경 0 |

실제 244 검사는 임시 복제 폴더의 runtime 4개를 `275a39c`에서 바이트 그대로 읽어 덮고, 공통 기준점 조회만 244 checkout으로 모사했다. release 목록·파일·바이트는 실제 Git을 사용했다. 실제 작업 브랜치에 244 코드를 합치지 않았다. 운영 화면/Production/PR 승인 재검증은 수행하지 않았다.

다른 importer는 산출물이 저장소에 생기지 않도록 임시 복제 폴더에서 **동일한 시작 243 runtime**에 대해 원본 도구/수정 도구를 각각 실행했다. assets/data/js 등은 읽기 참조만 사용했고 artifacts 출력은 임시 폴더에 남겼다. `building-206-safety`는 시작 SHA에서 export한 raw snapshot을 `HANI_BUILDING_SAFETY_BASELINE`으로 지정했다. settings225만 `--static`, 나머지는 브라우저 인자 없이 실행했다.

| baseline importer | 원본 main → 수정 후 | 기존 실패 원인 / 비고 |
|---|---|---|
| hani-app-216-audit.test.cjs | 7/7 → 7/7 PASS | 유지 |
| hani-building-206.test.mjs | 21/21 → 21/21 PASS | 유지 |
| hani-building-206-safety.test.mjs | FAIL → PASS | stale main 기대값 해소 |
| hani-login-a-204.test.mjs | PASS → PASS | 유지 |
| hani-proactive-204.test.mjs | 21/21 → 21/21 PASS | 유지 |
| hani-ui-203b.test.mjs | PASS → PASS | 유지 |
| hani-brand-heroes-218.test.mjs | FAIL → 동일 FAIL | ui-v02992 hero hunk drift |
| hani-hero-restore.test.mjs | 3 PASS/1 FAIL → 동일 | ui-v02992 hero hunk drift |
| hani-ocr-accuracy-224.test.mjs | 13 PASS/1 FAIL → 동일 | mergeWithExistingHoldings immutable origin hunk 불일치 |
| hani-office-219.test.mjs | FAIL → 동일 FAIL | pose 함수 보존 기대 불일치 |
| hani-qa-210.test.mjs | 8 PASS/1 FAIL → 동일 | design-system hero hunk drift |
| hani-settings-225.test.mjs --static | FAIL → 동일 FAIL | index settings hunk 불일치 |
| hani-settings-225-qa-guard.test.mjs | 1 PASS/2 FAIL → 동일 | explicit QA guard 목록·settings hunk 불일치 |
| hani-simplify-225.test.mjs | FAIL → 동일 FAIL | ui-v02992 hero hunk drift |
| hani-theme-white-215.test.mjs | FAIL → 동일 FAIL | index settings hunk 불일치 |
| hani-office-obr4-report.mjs | 실행 차단 → 동일 | 원본 artifacts/l216-2/reachability-status.json 없음. closure 파일은 임시 복제에서 읽기 가능하도록 구성. 별도 역사 보고서이며 테스트 PASS로 표시 안 함. |

15개 importer 검사에 신규 실패 없음. report importer 1개는 동일한 필수 증거 부재다. 기존 실패는 요청 범위 밖이므로 수정하지 않았다. 실행 로그는 `$env:TEMP/hani-baseline-chain-broker/` 아래 `main-*`, `after-*`에 있다.

## 다음 담당에게

- 먼저 읽을 파일: 이 보고서, `scripts/hani-merged-release-chain.mjs`, `scripts/hani-reviewed-release-baseline.mjs`.
- #369는 작업 도중 로컬 origin/main에 실제 들어왔다. 정상 Git 환경에서 최신 main/244 checkout에 이번 도구 변경만 적용하고 canonical baseline 17개와 QA 1st를 다시 실행하면 된다. 244용 fixture나 버전 수정은 필요 없다. 실제 244 Git 원본의 17 PASS 근거는 위에 있다.
- feature branch는 공통 기준점까지만 따라간다. 새 main을 자동 merge/rebase하지 않는다. main의 release PR 제목·연속 버전·표시 버전 계약이 달라지거나, 233에 없던 새 owner/seed 출처가 필요하면 실패를 유지하고 Git 근거로 검토한다.
- `hani-ui237.test.cjs` 원본이 다른 작업 폴더에만 있다면, 해당 원본을 받은 담당이 추가 실행해야 한다. 현재 저장소에는 없다.
- 승인 경계: 개발도구만 허용. push/PR/main 병합/배포/Notion은 계속 금지. CURRENT·DECISIONS는 변경하지 않았다.
- Preview/화면 검증: N/A(운영 UI 변경 없음). runtime 버전 증가·Full build·One-Pass·HINA·운영 read-back: N/A(개발도구 전용).

## commit / 파일 인계

`git -c core.autocrlf=false add -- <위 4개 파일>` 및 `git -c core.autocrlf=false commit --only -m 'test: follow merged releases in reviewed baseline chain' -- <위 4개 파일>`을 시도했다. add는 Git worktree 관리 디렉터리의 `index.lock` 생성이 Permission denied로 거절됐다. 이어진 commit도 신규 파일 2개의 미등록 pathspec 때문에 실패해 **미커밋**이다. 저장소 밖 `.git/worktrees/baseline-fix` 권한을 변경하거나 우회하지 않았다. HEAD는 `53db8f6`, 로컬 origin/main은 `275a39c`이며 파일본만 인계한다.

변경 파일:

- `scripts/hani-reviewed-release-baseline.mjs`
- `scripts/hani-reviewed-release-baseline.test.mjs`
- `scripts/hani-merged-release-chain.mjs` (신규)
- `baseline-fix-report.md` (이 인수인계)
