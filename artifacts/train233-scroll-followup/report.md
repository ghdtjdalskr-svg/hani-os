# train233 모바일 sticky header / 입력 스크롤 후속

- 담당: Codex 단일 Agent, 2026-10-24 KST.
- branch/worktree: `hani/train233-fix5` / `t233b`.
- 시작·검증 기준: `a29ff905be5a3458a0f6971c107c183d96c6b965` + 이번 diff.
- 상태: 최소 CSS 및 진단 보강 완료, Node targeted 검증 완료, **실제 Edge 8종 재검증 대기**.
- Git: `git -c core.autocrlf=false add -- <명시 변경/보고서/선택증거>` 1회가 공유 Git 경로의 `index.lock: Permission denied`로 실패했다. commit 미실행, HEAD a29ff90 유지. 우회·재시도 없음.
- 원격 main 조회 실패(연결 거절). 로컬 origin/main `a1e97d77d611a698e9dcd203510d54541b301a7c`만 확인. merge/rebase 없음.

## 실패 원인에 관한 확인 범위

기존 `artifacts/train233-browser-6/hani-qa-1st-ui.test.mjs.log.err`는 `390/investmentIntake: Remote covers controls`, actual `assetCaptureAccount`를 보고한다. 이 로그에는 실패 시 scrollY/field/trigger/header rect가 없어 실제 sticky 겹침과 화면 전환 중간 측정을 확정적으로 구분할 수 없다. browser-6의 다른 7종 PASS는 이번 수정 후 결과로 재사용하지 않는다.

확인한 실행 경로는 `hani-main.js::showView` → 기존 `HANI_CONTEXT_REMOTE_V1.update/placeMobileTrigger`와 `setupMobileTopStatus`이다. 닫힌 Remote는 sticky/48px/스크롤 및 포커스 숨김 owner를 사용하고, 열린 Remote만 relative/static 문서 흐름을 사용한다. CODEMAP의 investment-research owner를 먼저 확인했으며 모바일 헤더 전용 anchor는 CODEMAP_MISS로 실제 코드를 검색했다.

`hani-style-01.css`에는 `html{scroll-behavior:smooth}`가 있다. `showView`와 QA의 `scrollTo(0,0)` 뒤 80ms 고정 대기는 이전 화면 마지막 버튼으로 이동한 스크롤의 중간 위치를 읽을 수 있다. 별도로 root에는 sticky header를 예약하는 scroll-padding이 없었다. 두 경로는 코드로 확인했지만 **browser-6 실패의 단일 원인이라고 확정하지 않는다**.

## 변경

운영 파일은 `hani-design-system.css` 하나다. 기존 `@media screen and (max-width:768px)`의 48px header 블록에 주석과 아래 두 선언만 삽입했다.

```css
html{scroll-padding-top:calc(56px + env(safe-area-inset-top))}
#app .view :is(input,select,textarea,button,[tabindex]){scroll-margin-top:8px}
```

48px header와 여유 공간·safe area를 native anchor/focus 스크롤에 예약한다. header 위치/높이/숨김, trigger 배치 및 touch 크기, Remote 열림/닫힘 선언은 그대로다. 다른 9개 baseline 운영 파일 전체 bytes/EOL 보존을 검사했다. 신규 runtime JS/event/renderer layer는 없다.

기존 QA UI는 390/412/1440 × cream/black × 16화면 및 overlap `[]`/날짜/대비/home/money/clip/overflow/열림·닫힘/보호 데이터 assertion 19개를 그대로 유지한다. 80ms 시점 overlap·scrollY·focus도 기록하고, 이후 native smooth scroll을 끄지 않고 8개 연속 animation frame의 정지를 기다려 초기 geometry를 측정한다. 초기 PNG는 해당 측정 시점에 찍는다. 투자 입력 계좌 select와 intake 첫 select/textarea에는 실제 `scrollIntoView(start)` → 위로 24px 스크롤을 추가해 전체 header 및 trigger 겹침 없음, bar 재표시, 48px, trigger 44px 이상, control viewport 도달을 검사한다. 실패 시 마지막 geometry가 JSON에 남는다. **이 보강된 browser 검사는 아직 실행하지 않았다.**

## Exact baseline

기존 `train233-integrations.json` 속성·고정 SHA·hash·fragment를 모두 보존하고 `browserScroll`만 추가했다. 기준은 고정 a29ff90이며 CSS 전체 해시는 다음과 같다.

- before: `8f3fc89d4a4138dce379f5ffd194505048aea85b8e395a0ada5c24246decb10b`
- after: `f38f2b9a3cd7d55becadadea904a1fbe4d6b76090083b4edcba2c9ebcebbe002`

reviewed normalization은 scroll → sticky → date → 기존 corrections 순서로만 역변환한다. 옛 date endpoint 검사는 새 scroll hunk만 역변환한 뒤 원래 고정 hash와 비교하고, mutation은 전체 현재 source에서 실행한다. Git release oracle/내부 baseline은 바꾸지 않았다. 전체 hash/양방향 복원과 누락·중복·값 변조·768→850 확대·이동·EOL 변경 거절을 검사했다.

## 실제 검증

| 명령/범위 | 결과 |
|---|---|
| `node --test --test-isolation=none scripts/hani-qa-1st.test.cjs` | 직접 10/10 PASS, `qa-node.log` |
| `scripts/hani-reviewed-release-baseline.test.mjs` | 고정 Git 입력으로 14/14 PASS, `reviewed-node.log` |
| `scripts/hani-ocr-accuracy-224.test.mjs` | 고정 Git 입력으로 14/14 PASS, `ocr-node.log`; 합성 자료, 실제 OCR 미호출 |
| `scripts/hani-settings-225-qa-guard.test.mjs` | 고정 Git 입력으로 3/3 PASS, `settings-guard-node.log` |
| `scripts/hani-settings-225.test.mjs --static` | 고정 Git 입력으로 4묶음 PASS, `settings-static.log`; browser NOT RUN |
| QA safety: a29ff90 raw baseline | PASS, `safety-results.json`; runtime JS7 syntax, persistence/storage/Cloud/version/cache 보존, source graph68·기존 중복8, unchanged16,897줄/EOL |
| 원문/fixture/기존 QA assertion/EOL 감사 | PASS, `audit.json`; 운영9파일 전체 bytes 보존, 이전 fixture 동일, assertion19 보존, 변경5파일 unchanged2,609줄/EOL |
| tooling JS3 `node --check`, `git -c core.whitespace=cr-at-eol diff --check` | PASS |

Git oracle 직접 실행은 `spawnSync git EPERM`으로 14개 모두 차단됐다(`reviewed-direct.log`). 이를 직접 PASS로 보고하지 않는다. 위 고정 입력 검사는 기존에 Git blob으로 검증한 124개 입력과 이번 a29ff90 CSS/fixture 2개 raw Git export를 사용했다. `git ls-tree` object ID와 SHA-1 blob identity를 비교했으며 실제 runtime 및 검사 assertion은 대체하지 않았다. 공통 접두사는 `node --import ./artifacts/train233-scroll-followup/git-snapshot-loader.mjs`, test는 각각 `--test --test-isolation=none <파일>`로 단독 실행한다. raw archive/base와 작업 스크립트는 로컬 증거용이며 stage 대상에서 제외한다.

QA safety는 기존 검사에 `--import ./artifacts/train233-scroll-followup/safety-path-loader.mjs`와 baseline 인자 `artifacts/train233-scroll-followup/base`를 사용했다. 이 loader는 diff/result 출력 경로만 이번 작업 폴더로 바꾸어 기존 증거를 보존한다.

## 허용 환경의 다음 검사

Edge 실행·대체 browser·권한 우회·새 PNG 생성은 하지 않았다. 다음 8종을 동일한 최종 diff에서 다시 실행해야 한다.

1. `hani-investment-research-ui.test.mjs`: sticky/48px/scroll-up/IC header 겹침.
2. `hani-qa-1st-ui.test.mjs`: 390/412/1440, 모든 view/date/contrast/home/money/clip 및 초기/anchor/scroll-up geometry.
3. `hani-remote-card-224.test.mjs`.
4. `hani-remote-media-219.test.mjs`.
5. `hani-context-remote-ui.test.mjs`.
6. `hani-pwa-213.test.mjs`.
7. `hani-market-browser-smoke.cjs`.
8. `hani-banners-203-ui.test.mjs`.

QA CLI: `node scripts/hani-qa-1st-ui.test.mjs <playwright/index.mjs> <msedge.exe>`; 투자리포트는 같은 인자 뒤 evidence 폴더를 지정한다. 나머지 기존 CLI는 유지한다. QA 초기 진단의 `early.overlap`/`early.scrollY`와 `settled`/field/header/launcher rect를 비교해야 원인을 구분할 수 있다. 8종 통과 전 실화면 해결/Release PASS로 보고하지 않는다.

데이터/Storage/Cloud/schema/보호키/표시버전/cache 변경 없음. local 표시/cache 2.9.232·마지막 UI script `hani-launch-greeting.js` 보존. build/One-Pass/HINA/Preview/main/Pages/Production read-back은 범위 밖 미실행. push/PR/main/배포/Notion 작업 없음. Git 결과는 [작업 인수인계](../../docs/development-history/handoffs/2026-10-24-train233-scroll-followup.md)에 남긴다.
