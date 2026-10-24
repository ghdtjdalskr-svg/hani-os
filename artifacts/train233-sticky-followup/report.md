# train233 · 닫힌 Remote의 모바일 sticky bar 회귀 수정

- 담당: Codex 단일 Agent / 2026-10-24 KST
- branch/worktree: `hani/train233-fix5` / `t233b`
- 시작·검증 기준 HEAD: `c026b630a94802415c1c868fba2d5ea0dadf05b6` + 이 작업 diff
- 위험 범위: LIGHT CSS 변경, 공통 모바일 헤더 영향에 맞춰 기존 targeted 검사 보강
- 원격 `main` 조회는 연결 실패. 로컬 `origin/main=a1e97d77d611a698e9dcd203510d54541b301a7c`만 확인했으며 merge/rebase 없음.

## 원인과 변경

기존 `artifacts/train233-browser-5/hani-investment-research-ui.test.mjs.log.err`에서 390px cream의 scroll-up 이후 `hidden=false`이지만 bar `y=-469`, `scrollY=488`, `visibleBar=null`이다. `f27be17`의 Remote CSS가 닫힌 상태에도 `position:relative!important;top:auto!important;transform:none!important`를 강제하여 스크롤 표시 클래스가 풀려도 bar가 viewport로 돌아오지 않는다. 같은 규칙의 `height:auto`도 닫힌 상태에서 기존 PWA의 48px 높이를 덮는다(기존 실패 로그의 실제 높이 50px).

실제 owner는 `hani-main.js::setupMobileTopStatus`의 기존 scroll/focus/resize 이벤트와 `hani-design-system.css`의 sticky·`.is-mobile-hidden`·48px 규칙이다. `hani-ui-v02992.js`에는 이 스크롤 handler가 없다. CODEMAP의 investment-research 경로는 확인했으며 mobile header/Remote 세부 anchor는 CODEMAP_MISS로 실제 owner를 확인했다.

운영 수정은 `hani-context-remote.css:198` 선택자에 `[data-open="true"]`를 추가한 **한 줄**이다. relative/height/wrap/transform/visibility 강제값은 열린 패널에만 적용하고, 닫힌 상태는 기존 sticky/48px/숨김 owner가 처리한다. trigger의 static 배치·top-actions wrap·열린 패널의 static/grid/overflow 규칙은 원문 그대로다. 신규 runtime JS/event/renderer layer는 없다.

기존 투자리포트 browser 검사에 computed `position:sticky` 확인을 추가했다. QA UI의 기존 390/412/1440·cream/black 조건과 날짜/대비/overflow 검사는 유지하고, 모바일 닫힘 sticky → 열림 relative·패널이 본문 앞에 배치됨 → 닫힘 sticky 확인을 보강했다. 원래 overlap·bar 노출·높이 assertion을 완화하지 않았다. **이 browser 검사들은 수정 후 실행하지 않았다.**

## Exact baseline

`scripts/fixtures/train233-integrations.json`의 모든 기존 속성·SHA·fragment·hash를 보존하고 `browserSticky`만 추가했다. 고정 c026b63 원문에서 선택자 한 곳을 변경하는 양방향 delta이며 전체 CSS hash는 아래와 같다.

- before: `6ec52443784833f7c09b5c16318342b038534b8f5819694fe8360989d8039e4c`
- after: `b543f80d8301c5427f1c44d631b831b76e60e1b657f7ee076c6be290c9b36a68`

역변환 순서는 이번 selector → 날짜 border → 기존 correction → f27be17 → 기존 integration 순서다. Git oracle/release chain/내부 baseline은 변경하지 않았다. 전체 hash·양방향 복원·누락/중복/변조/이동/EOL 검사를 유지하고, 이번 selector 조건 제거도 거절되는 것을 확인했다.

## 실제 검증

| 명령·범위 | 결과·증거 |
|---|---|
| `node --test --test-isolation=none scripts/hani-qa-1st.test.cjs` | 직접 **10/10 PASS**, [로그](qa-node.log) |
| reviewed baseline 단독 실행 | **13/13 PASS**, [로그](reviewed-node.log) |
| OCR224 단독 실행 | **14/14 PASS**, [로그](ocr-node.log). 합성 22 fixtures/330 fields; 실제 OCR·계정·Cloud 미호출 |
| settings225 QA guard 단독 실행 | **3/3 PASS**, [로그](settings-guard-node.log) |
| settings225 `--static` | **4묶음 PASS**, [로그](settings-static.log); 127 unique IDs/109 planned IDs/36 handler assignments |
| QA safety, c026b63 raw baseline | **PASS**, [결과](safety-results.json). runtime JS7 syntax, canonical persistence/storage/Cloud/version/cache 불변, graph68·기존 중복8 유지, unchanged16,896줄/EOL |
| 원문/fixture/EOL 감사 | **PASS**, [결과](audit.json). CSS 외 baseline9파일 전체 원문 보존, 기존 fixture 속성 동일, 수정6파일 unchanged1,481줄/EOL |
| 변경 tooling JS4개 `node --check`; `git -c core.whitespace=cr-at-eol diff --check` | PASS |

QA10을 제외한 Git oracle 의존 검사는 아래 **고정 입력 adapter**를 사용했다. 직접 reviewed 실행은 `spawnSync git EPERM`으로 차단되어 PASS로 보고하지 않는다. 고정 과거 Git archive와 이번 c026b63 CSS 원문을 shell `git ls-tree` blob ID와 대조한 **124개** 입력만 공급했고, 원래 검사 assertion과 runtime reader는 유지했다. 검증 명령의 공통 접두사는 `node --import ./artifacts/train233-sticky-followup/git-snapshot-loader.mjs`이다. test 파일은 각각 `--test --test-isolation=none <파일>`로 실행했다. settings는 `scripts/hani-settings-225.test.mjs --static`이다.

개발 환경에서 테스트 파일 여러 개를 한 번에 넘긴 실행은 최종 근거로 쓰지 않는다. OCR 스크립트는 두 번째 위치 인자를 browser 의존성으로 해석하므로 **OCR Node 검사는 단독 명령**을 사용한다. 재실행 도중 중단한 결합 실행은 PASS 합계에 포함하지 않았다.

QA safety는 원래 검사·assertion을 실행하고 diff/result 파일 경로만 작업별 artifact로 연결하여 과거 증거를 보존했다. 로컬 표시/cache는 `2.9.232` 그대로이며 열차 목표 `2.9.233`과 구분한다.

## 미검증과 다음 실행

Edge 실행·권한 우회·신규 PNG 생성은 하지 않았다. 수정 후 실제 sticky/scroll-up/trigger 크기·패널 전환·대비·각 화면 결과는 미검증이다. 과거 c026b63에서 통과한 Remote/PWA/market/banners 결과를 수정 후 PASS로 재사용하지 않는다.

Edge 허용 환경의 담당자가 다음 8종을 실행해야 한다. 기존 script CLI와 로그 경로는 보존한다.

1. `scripts/hani-investment-research-ui.test.mjs` — scroll-up bar 노출·48px·IC header overlap, cream/black 390/1440
2. `scripts/hani-qa-1st-ui.test.mjs` — 390/412/1440, Remote/날짜/certificate/대비/열림·닫힘
3. `scripts/hani-remote-card-224.test.mjs`
4. `scripts/hani-remote-media-219.test.mjs`
5. `scripts/hani-context-remote-ui.test.mjs`
6. `scripts/hani-pwa-213.test.mjs`
7. `scripts/hani-market-browser-smoke.cjs`
8. `scripts/hani-banners-203-ui.test.mjs`

투자리포트 CLI: `node scripts/hani-investment-research-ui.test.mjs <playwright/index.mjs> <msedge.exe> artifacts/train233-sticky-edge/investment-research`. QA UI도 기존 두 위치 인자를 사용한다. 브라우저 통과 후에만 이번 실패 해결을 확정한다.

Candidate Freeze/build/One-Pass/HINA/Preview/Production read-back은 범위 밖으로 미실행했다. push/PR/main/배포/Notion 갱신 없음. 데이터·localStorage·보호키·Cloud/schema·버전/cache 변경 없음.

## Git 인계

`git -c core.autocrlf=false add -- <수정6+인수인계+선택한 보고서/증거>`를 1회 시도했으나 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/t233b/index.lock: Permission denied`(exit128)로 실패했다. commit은 실행하지 않았으며 시작 HEAD `c026b63`을 유지한다. 권한 우회·재시도·직접 index 조작은 하지 않았다. snapshot/tar·기존 browser 결과는 stage 대상으로 지정하지 않았다. 수정과 증거는 현재 worktree에 미커밋으로 보존한다.

[운영 CSS·tooling diff](patch.diff), [작업별 인수인계](../../docs/development-history/handoffs/2026-10-24-train233-sticky-followup.md). 기존 browser-5/investment-research 결과는 보존했다. OCR Node 검사가 만든 합성 artifact도 운영 데이터와 별개로 보존한다.
