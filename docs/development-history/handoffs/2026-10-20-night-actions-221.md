# night-actions-221 · 본사 야간·주말 행동

## 2026-10-20 · launch-221 전체 회귀 후속 시작

- 담당 도연(Codex), `hani/night-actions-221`, 시작 HEAD `88808cc0da633a97ce07d5594801e6e425611222`, 로컬 origin/main/base `4a913303afb3de11e948c899387b4760810684c1`. Git 원격 조회는 네트워크 차단으로 최신성 미확인. 표시 v2.9.220, index 마지막 JS `hani-launch-greeting.js` 유지.
- 성민 대표님 승인 범위: 자동화 감지로 자동 인사 억제 + 전용 테스트 명시 force, 정적 감사 launch 파일 기대, 그 외 신규 실패 최소 수정, 실행 가능한 Node 검사, 커밋 시도. 같은 branch, 버전/cache·Cloud·main·배포 변경 없음. 타 담당 QA 산출물 보존.
- CODEMAP_MISS: launch/login/theme 항목 없음. 실제 owner `hani-launch-greeting.js`의 start·기존 gate transition/observer 실행 경로와 launch Node/browser 검사를 확인. 새 event/renderer layer 없음.
- 계획: 원천 start eligibility 1곳 수정, 전용 fixture에 boolean force, 정적 목록/캐시 태그 예외를 신규 파일 둘로 한정. 17개에 per-test 우회 추가하지 않음. Node 전용/혼합 unit 모드 실행 후 실제 Edge 목록 인계.
- Notion 계획 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 계획·최종 결과 갱신 대기는 이 절에 보존.

### 전체 회귀 후속 결과 · 2026-10-20 03:39 KST

- 상태: 구현/Node 검증 완료, **서윤 실제 Edge 재검증 대기**. Candidate/PR/main/Pages/Production 완료 아님. 담당 도연(Codex), 단일 Agent. 위 시작 HEAD 기준의 미커밋 변경이며 기존 작업·타 담당 QA 자료 보존.
- 기준선 보완: GitHub 연결 도구의 `git/ref/heads/main`에서 최신 SHA `4a913303afb3de11e948c899387b4760810684c1` 일치 확인. 원격 main index에서 표시 `v2.9.220`, 마지막 script `hani-ai-budget.js?v=2.9.220` 확인. 이는 정적 원문 확인이며 Production 실제 로딩/read-back은 미수행.
- `hani-launch-greeting.js`: 기존 `start()` eligibility 한 곳에서 `navigator.webdriver === true`이면 자동 표시 취소. **전용 테스트가 로드 전 `window.__HANI_LAUNCH_GREETING_FORCE__ = true`를 설정한 경우만 이 억제를 해제**. 문자열 `"true"`는 강제 아님. force도 로그인 gate·off·KST 하루1회·기존 dialog·재잠금·이미지 timeout 규칙을 우회하지 않음. 억제 시 이미지 요청/패널/seen write/클릭 가로채기 없음, observer/transition cleanup. 일반 사용자 동작 유지. URL query 옵션은 추가하지 않음.
- launch Node fixture에 navigator/force 입력과 정상/억제/boolean force/하루1회/off 검증 추가. browser fixture만 init script force 기본 true, 같은 전용 suite 안 force false에서 실제 webdriver true·gate 해제·요청0/overlay0/prefs write0 검증 추가. 17개 브라우저 테스트에 개별 우회 없음.
- `hani-app-216-audit.test.cjs`: CSS 순서에 신규 launch CSS, 마지막 단일 launch JS 기대 추가. 기존 runtime 태그 필수 유지, **정확한 신규 JS/CSS bare URL 두 개만 열차 태깅 전 허용**. 이후 열차가 태그를 붙여도 검사 가능. index/표시버전/cache 원문은 수정하지 않음.
- `hani-brand-heroes-218.test.mjs`: 구형 v218 고정 비교를 현재 승인 `origin/main` 버전/cache 비교로 교정. index의 승인 네 연결만 기존 `withoutLaunchGreeting` 검증 helper로 제외한 뒤 기존 DOM/route/EOL 보존 검사. 역사적 원본/데이터/저장 owner 비교는 그대로 유지.
- `hani-qa-210.test.mjs`: HEAD에 launch 연결이 이미 커밋된 경우 baseline도 동일 네 연결을 정규화. launch 없는 과거 raw fixture도 지원하며 나머지 exact-byte 비교 유지. 기존 current-only 정규화가 HEAD와 불일치하는 실패 재현 후 수정.

#### 실행한 검사와 한계

- NORMAL targeted QA. `node scripts/hani-launch-greeting-221-unit.test.mjs`: **36 PASS**. `node scripts/hani-app-216-audit.test.cjs`: **7 PASS**. brand **3 PASS**, QA210 **9 PASS**. 실제 모듈 실행에서 자동화 억제·일반 사용자 표시·force와 gate/시간/설정/저장 보호 검증. 해당 최종 로그는 `artifacts/launch-221-regression/final-{unit,audit,brand,qa}.log`.
- Node 실행 대상 **134개 파일 시도 → 126개 Node 범위 통과 / 환경 차단6 / 별도 입력 필요2 / 남은 실행 가능 Node 실패0**. 혼합 suite의 Node-only 모드 포함; 공통 imported tests 중복 포함. 선택 UI 및 기존 skipped case는 PASS 건수로 합산하지 않음. `dash-218`/`simplify-218` 각 기존 skip1, `office-v2-215` 선택 Edge2 skip. 브라우저 전체 PASS를 의미하지 않음.
- 직접 실행: `node scripts/<file>`; ilbo/newstaff/polish는 `--unit`, PWA는 `--static`. 전체 실행 명령·개별 로그·최종 분류: `artifacts/launch-221-regression/final-node-results.json` 및 `run-node.ps1`/`summarize.mjs`. `.js` Node 검사5개도 추가 실행(유나 smoke/일정·news material·portfolio completeness·asset update smoke).
- Git 하위 프로세스 EPERM 검사는 host Git이 export한 원문 **156개 blob을 `git hash-object`/원래 blob SHA로 일치 확인** 후 `node --import ./artifacts/launch-221-regression/git-read.mjs scripts/<test>` 실행. 읽기 공급만 대체하고 assertion/runtime은 그대로. `snapshots.json`에 원문 spec/blob 경로 보존. QA210·brand·followup·login·white·office219·media-core·gate-capacity 및 proactive/UI203b 보존 검사 재실행 통과. proactive/UI203b는 기존 환경변수와 정확한 raw diff 파일 사용.
- 안전 검사: HEAD88808cc 원문으로 building206·investment research·polish205 safety PASS. 이번 제품 diff는 인사 억제 guard3줄 추가/기존 조건1줄 확장뿐이며 index/auth/data/storage write/Cloud/schema/night-actions 원문 변경 없음. 신규 storage write 없음.
- 차단6: `hani-boardroom-cross-review.test.mjs`, `hani-boardroom-voice-contract.test.mjs`, `hani-drive-vault-precheck.test.mjs`, `hani-meeting-character-voice.test.mjs`, `hani-meeting-engine-v2-batch1.test.mjs`, `hani-protected-gate-integration.test.mjs` — Node/Git subprocess spawn EPERM. drive의 in-process 검사는 실행됐지만 CLI 통합은 미검증. routing 검사는 현재 Edge 원문을 입력해 격리 Node PASS(배포/Cloud 호출 없음).
- 별도 입력2: `hani-deploy-package-intake-test.mjs`는 frozen Candidate PACKAGE.json 필요(Candidate 빌드 미요청). `hani-invest-split-safety.test.mjs`는 당시 pre-split raw fixture가 필요하며 현재 HEAD snapshot은 이전 core marker와 호환되지 않아 해당 assert 실패; 제품 회귀로 판정하지 않음. 원래 과거 fixture 없이 PASS로 표시하지 않음.
- 수정한 JS/test6개 `node --check` 및 `git diff --check` PASS. 버전 증가 N/A(기능 담당 금지), Candidate Build/One-Pass/HINA/아린/Production 미수행. 서버 Edge Function·설정·Cloud 배포 필요 없음.
- 새 Edge probe 실제 결과 **`browserType.launch: spawn EPERM`** (`browser-probe.json`). 사용자 기존 screenshots/results는 덮어쓰지 않음. 본 패치 후 실제 pixels/clicks/console0는 서윤 재실행 전 미검증.

#### 서윤 재실행 목록 · 제보 17개 분류

| 종류 | 파일(모두 scripts/) | 이번 결과 / 다음 실행 |
|---|---|---|
| Node 전용3 | `hani-app-216-audit.test.cjs`, `hani-brand-heroes-218.test.mjs`, `hani-qa-210.test.mjs` | 각각7/3/9 PASS. QA210 실브라우저 검사는 별도 `hani-qa-210-edge.mjs`이며 제보된 파일 자체는 Node 전용 |
| 혼합3 | `hani-ilbo-213.test.mjs`, `hani-newstaff-215.test.mjs`, `hani-polish-215.test.mjs` | `--unit` 모두 PASS. 실제 Edge mode는 아래 명령으로 재실행 필요 |
| 브라우저 전용11 | `hani-ai-budget-browser.test.mjs`, `hani-goal-media-budget-ui.test.mjs`, `hani-goal-progress-ui.test.mjs`, `hani-ilbo-banner-215.test.mjs`, `hani-invest-split-ui.test.mjs`, `hani-investment-research-ui.test.mjs`, `hani-navigation-state-ui.test.mjs`, `hani-remote-media-219.test.mjs`, `hani-report-common-ui.test.mjs`, `hani-second-opinion-ui.test.mjs`, `hani-yuna-schedule-ui.test.mjs` | 이번 환경에서는 실제 Edge 차단, 서윤 재실행 필요 |

- 다음 한 가지 행동: 서윤이 위 **브라우저11 + 혼합3 + 전용 launch suite**를 `node scripts/<file> <playwright/index.mjs> <msedge.exe>`로 재실행. 일반 suite에는 force init을 추가하지 않음. launch suite만 자체 init force true/false 검증과 기존12장 캡처 실행. 수정 후 실브라우저 결과로 남은 실패가 있을 때만 최소 후속 수정.
- Notion 갱신 대기 내용: 최신 main 확인·자동화 억제/전용 force·정적 감사와 baseline 교정·Node134 시도/126 통과/6차단/2입력·브라우저14+launch 재검증 대기·버전/Cloud/배포 없음·Git 시도 결과. 최초 계획 append 자동 승인 정책 never 거절로 미반영. 최종 기록 시도와 Git 결과는 아래 추가.
- Git 실제 결과: 이번 수정8파일만 `git add -- ...` **exit128**, 이어 `git commit --only -m 'fix(ui): isolate launch greeting from automated regressions' -- ...` **exit128**. 둘 다 외부 worktree 메타데이터 `index.lock` 생성 Permission denied. HEAD **88808cc0da633a97ce07d5594801e6e425611222 유지**, staged diff 없음. 대표님 지시대로 **8파일 미커밋 보존**, push/PR/main/배포 없음. 로그 `artifacts/launch-221-regression/git-{add,commit}.log`.
- Notion 최종 결과 추가도 자동 승인 검토 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 완료 아님. 이 절의 계획·최종 결과 요약을 접근 가능한 다음 담당이 Notion에 반영해야 함. CURRENT에는 확인된 구현/검증/미커밋/실제 Edge 대기만 기록.

## 2026-10-20 · launch-221 Edge 제보 후속 수정 시작

- 담당 도연(Codex), 기존 branch `hani/night-actions-221`, 시작 HEAD `efa9e5be612fd4eecdb22716a63a460229599cf1`, 로컬 origin/main `4a913303afb3de11e948c899387b4760810684c1`. `git ls-remote origin refs/heads/main`은 네트워크 차단으로 실패해 원격 최신성 미확인. merge/rebase 없음.
- 서윤 실제 Edge 제보: 종료 후 title focus 실패, 유일한 캡처에 login gate 페이드만 보임. 이전 Node PASS는 실제 화면 PASS가 아님.
- 수정 범위: `hani-launch-greeting.js`·CSS, launch Node/browser tests 및 이 인수인계. 기존 gate의 transition 완료에 연결하고 불투명 상단 표시·포커스 fallback·decode/paint/hit-test 검증. 기존 auth owner·night-actions·버전/cache·Cloud·보호 저장 경로 변경 없음. 승인 UI 키 `hani_theme_settings_v1` 유지.
- 검증 계획: launch Node targeted·syntax·diff, 서윤 실제 Edge 재실행 대기. 같은 브랜치에서 commit 시도, 차단되면 미커밋 보존.
- Notion: 기존 chibi 카드 읽기 성공, 이번 계획 append도 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 계획·결과 갱신 대기 내용을 이 절에 보존.

### Edge 제보 후속 수정 결과 (위 시작 HEAD 기준)

- 원인: `.is-hidden`은 게이트의 opacity/visibility 220ms transition 시작이며 완료 신호가 아님. 기존 인사 z-index90은 게이트100000보다 낮고, 패널 자체 fade가 앱을 투과시킴. body/포커스 불가 요소의 `.focus()`는 실효가 없어 activeElement가 body에 남음.
- `hani-launch-greeting.js`: 기존 게이트 자신의 `transitionend`를 수신하고 computed visibility:hidden + opacity:0(또는 display:none) 뒤에만 이미지 요청/인사 시작. 기존 MutationObserver는 blocker/relock·무전환/이미 숨김 경로에 재사용. polling·새 auth 이벤트·로그인 owner 변경 없음. 종료 시 transition listener도 해제.
- CSS: z-index2147483647, Finish의 불투명 canvas 배경과 opacity1 유지. 패널 fade in/out 및 이미지 opacity0 프레임 제거; 그림의 짧은 이동/확대만 유지, reduced-motion 정적 표시. 기존2100/1200ms 종료 유지.
- 포커스: 열리기 직전 실제 focused control을 우선 복원. body/none·detached/inert/loginGate·실제 focus 실패 시 `#title`에 tabindex=-1 후 focus. 새 dialog/재잠금의 focus는 빼앗지 않음.
- browser test: 이미지 decode + requestAnimationFrame2회 뒤 캡처. `elementFromPoint` 패널 중심이 자신/자손인지, 게이트 완전 숨김·패널/그림 opacity1·배경 alpha255·실제1600px decode 확인. 이미지 decode가 게이트 페이드 중 시작하면 실패. 기존12개 viewport/theme/day-night 검증 유지, 이전 control/body fallback 실브라우저 사례 추가.
- 실행: `node scripts/hani-launch-greeting-221-unit.test.mjs` **28 PASS** (신규5개: 게이트 transition 대기/버블 무시, 실제 control 복원, body/detached/focus실패 fallback). 생활 sentinel 보존·승인 UI 키 외 쓰기0. 증거 `artifacts/launch-221/unit-gate-fix.log`.
- 실행: `node --check` runtime·Node test·browser test, `git diff --check` PASS. `node scripts/hani-login-a-204.test.mjs` DOM/Season/preview 저장0/대비 검사 PASS, Git 원문 보존 비교는 `spawn EPERM`으로 SKIP하여 전체 PASS로 보고하지 않음.
- 미검증: 수정 후 실제 Edge/캡처는 서윤 재실행 대기. 기존 실패 screenshot/results는 보존하며 새 PASS 근거로 사용하지 않음. Candidate/아린/HINA/build/Production 미수행. 기능 탭 버전 증가는 N/A(금지), 보호 storage/Cloud/schema/auth owner 변경 없음. 기존 night-actions 작업 보존.
- 다음 한 가지 행동: 서윤이 `node scripts/hani-launch-greeting-221.test.mjs [playwright/index.mjs] [msedge.exe]` 재실행 → 새 results.json/12장 및 focus/topmost assertions 확인 후 열차 담당에게 인계.
- Notion 갱신 대기: 위 수정 원인/결과·Node28 PASS·실제 Edge 대기·원격 최신성 미확인·commit 결과. 자동 승인 검토 거절로 미반영, 연결/갱신 완료 아님.
- Git 실제 결과: 지정5파일 `git add -- ...` exit128, 이어 `git commit --only -m "fix(ui): wait for login gate paint and restore launch focus" -- ...` exit1. 모두 외부 worktree metadata의 `index.lock` 생성 Permission denied. 권한 우회 없이 **5파일 미커밋 보존**, HEAD `efa9e5b`·기존 branch 유지. push/merge/배포 없음.

## 2026-10-20 · launch-221 추가 작업 시작 (기존 night-actions 보존)

- 담당 도연(Codex), branch `hani/night-actions-221`, 시작 HEAD `d78b61f552372c5150f0f7a51734ddac22237b24`, base/조회 main `4a913303afb3de11e948c899387b4760810684c1` 일치. 표시 v2.9.220 / 마지막 기존 JS `hani-ai-budget.js?v=2.9.220`(index 기준; 운영 미조회).
- 승인: 치비 아트 ‘좋아’, 별도 Theme Studio UI JSON 키 신규 저장, 앱 연결·테스트·commit 시도. 보호 키·Cloud·버전/cache·main/배포 제외.
- 범위: 신규 canonical launch JS/CSS, index의 토글/로딩 연결, 승인된 assets/launch, 신규 browser 검사 및 증거. `hani-main.js` 로그인/저장 owner 변경 없음.
- CODEMAP_MISS: login/aura/theme/launch 항목 없음 → index의 #loginGate/#aura, hani-main.js의 unlockLoginGate/lockLoginGate 및 기존 theme 저장 owner만 탐색.
- 기존 테마 저장은 h22th/계절/finish 문자열 전용. 재사용할 JSON theme prefs 없음 → 승인된 `hani_theme_settings_v1` 사용. storage 실패 시 메모리에서 세션 1회 제한.
- 상태: 구현 진행 중. Notion 기존 chibi 카드 계획 append는 자동 승인 검토의 `MCP tool call requires approval, but approval policy is never`로 거절, 갱신 대기.

## 작업 식별

- 갱신 시각(KST): 2026-10-20 / 담당: 도연(Codex), 단일 개발 Agent
- 상태: 개발·targeted 검증 완료 / NORMAL · READ-ONLY scene patch. 실제 Edge·office-219·커밋 상태는 아래 구분.
- branch/worktree: `hani/night-actions-221` / `night221`
- base SHA: `4a913303afb3de11e948c899387b4760810684c1` (GitHub API 원격 main 일치 확인)
- 표시 버전/마지막 UI JS: v2.9.220 / `hani-ai-budget.js?v=2.9.220` (index 기준, 운영 화면 미확인)
- 승인: 대표님 요청의 신규 221 데이터·기존 canonical scheduler/loader·targeted tests·커밋 시도. 버전 증가·LocalStorage·Cloud·main 병합·배포 제외.
- 수정 범위: 신규 `assets/data/office-actions-221.json`, `hani-office-live.js`, 221 생성기·테스트, 새 로더에 맞는 기존 테스트 기대, 작업 기록.
- 관련 CODEMAP: `living-office` owner는 유효. scheduler/windows anchor와 신규 office targeted tests가 없어 `CODEMAP_MISS` → 해당 owner/functions/tests만 fallback 탐색.
- 참고: 요청한 docs/drafts 3개 파일은 현재 checkout에 없음. `docs/character-bible-m9-mir.md` 및 216 캐릭터 대사·override 참고.

## 결과와 증거

- `assets/data/office-actions-221.json`: schema `office-actions-221-v1`, 98개 보존 + 신규22개 = 120개. 기존37개 disabled 유지. 출퇴근·점심과 업무 회의의 시간창은 유지하며, 80개 기존 비회의/사회적 행동을 매일 야간·주말로 확장. 부모 family의 eligibility도 함께 확장.
- 신규22개: 층별3종×4층의 짧은 메모·코딩·별빛·대화 표정12개 + 야식 라면·편의점 봉투·커피 머신 한마디·기지개/하품·야경·짧은 쪽잠·주말 화분·책 읽기·MIR 별빛 정리·수연 지도10개.
- 빈도: 짧은 업무/표정은 **층 전체**가 평일40초/주말55초(최대3초 jitter) 예산 하나를 공유. 오래 쉬거나 먹는 행동은 기존 개인 비업무 합산2700초, 층간 이동5400초 및 원래 가족별 budget/cooldown을 그대로 적용. 주말 일반 행동 확률은 기존의60%. 비어 있거나 전원 예약 중이면 skip.
- `hani-office-live.js`: 221→216→base-work 로더, schema와98~300개 sane count/필수 배열 확인. 기존 canonical scheduler의 opportunity·예약·렌더 경로만 사용, 새 handler/timer/layer 없음. 자정 wrap은 해당 KST 날짜의 [0,end)/[start,24)로 평가, 평일/주말/매일 구분. 전날 가능한 행동의 보수적 상한으로 자정 이후 cooldown도 보존(지난 날 전체 plan 재생·재귀·저장 없음).
- 재실: 218 기준 매일01시 전17명/01~07시5명 유지. 예약 전체의 재실·부모 참여자를 검사해 부재 동료가 끼는 장면 차단. 유나/민지의 밤 라운지 두 자리를 이동 출발점·복귀점·idle에 공통 사용. MIR stand/가상 소품·대사, 회장님은 presence active에서만 개구리 비주얼 유지.
- 기존 검사 수정: actions216의 fetch 기대에221 선행 요청 추가, fix218은 실제216 fallback의 기본 재실 계약을 명시적으로 검사. 공통 DOM fixture는221도 주입 가능하게 확장. 구형 행동 budget 기대를221 기준으로 느슨하게 바꾸지 않음.

| 명령 | 결과 / 범위 |
|---|---|
| `node scripts/hani-office-actions-221.test.mjs` | **20 PASS**, 공통 engine6개 포함. 요청6시각 각 재실층 실제 non-base 출력, 재실/예약 충돌·자정 wrap/02시 끝 경계·주말 빈도·연속7일 cooldown·취소/소집·MIR/회장·로더 성공/실패·persistent DOM 검증 |
| `node scripts/hani-office-actions-216.test.mjs` | **15 PASS**, 기존120일 budget·97개 reachability·실제 renderer·fallback 포함 |
| `node scripts/hani-office-fix-218.test.mjs` | **6 PASS**, 실제 HTTP 메타데이터/216 fallback·재실 경계 |
| `node scripts/hani-office-seats-215.test.mjs` | **12 PASS** |
| `node scripts/hani-office-v2-215.test.mjs` | **18 PASS / 2 optional Edge SKIP** |
| `node scripts/hani-building-206.test.mjs` | **21 PASS** |
| `node scripts/hani-office-219.test.mjs` | **차단**: `spawnSync git EPERM` (217 baseline 로딩 단계). PASS 아님 |
| `node scripts/hani-office-actions-221.browser.mjs` | **차단**: 실제 Edge155 `browserType.launch: spawn EPERM`, 캡처0장. PASS 아님 |
| `node scripts/hani-building-206-safety.test.mjs artifacts/night-actions-221/baseline` | **PASS**, 기준 HEAD raw blob과 Storage/protected owner/version/cache/DOM id/기존 줄별 EOL 비교 |
| `node --check` (runtime·생성기·browser), `git diff --check` | **PASS** |

- 환경: Windows PowerShell / Node24.20.0, 실제 owner VM + DOM doubles + 실제 JSON/메타데이터 HTTP. 공통 engine import의 중복 결과를 독립 검사로 합산하지 않음.
- 01:40 3F: 실제 owner/타이머를 가짜 시각으로1초씩 진행해 **2초 뒤 서윤 `night-dev-code`** emoji/status/name icon 표시 확인. 이것은 DOM 실행 증거이며 실제 Edge 픽셀 검증을 대신하지 않음.
- 증거: [요약](../../../artifacts/night-actions-221/README.md), [6시각/renderer](../../../artifacts/night-actions-221/targeted.json), [Edge 차단](../../../artifacts/night-actions-221/browser.json), `artifacts/night-actions-221-*.log`. raw baseline은 local 증거용이며 commit 대상 제외.
- 신규 JSON: 218,503 bytes / SHA256 `3f99d6118e6fbdb4b23398df083066d4627e63f563869762bfd09e3b4357e94c`.
- runtime SHA256: `c3c9e3db14976a4098cc1d82af017509413fc2acc7c83e6a4a8497039651bf97`.
- 실제 Edge 모바일/데스크톱·실기기 Android·로그인 통합 미검증. 전체 build/Candidate/One-Pass/독립 HINA·아린/운영 read-back은 기능 개발 단계이므로 미수행. 버전 증가 검사는 열차 후보 담당자 수행 대기(이 patch에서 금지).
- 데이터 영향: 생활 데이터·Storage·Cloud·schema·migration 없음. 장식용 정적 JSON만 추가.
- Git: 커밋 시도 결과는 마지막 절. PR·main 병합·Pages·Production 모두 미수행.
- Notion: 현황판 읽기 성공. 계획 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 갱신 대기 요약을 이 문서에 보존.

## 다음 담당에게

- 신규 데이터는 **seed PR로 main에 먼저 추가**해야 함. 216 파일 수정 금지. 런타임 변경은 배포 담당 Claude 열차로 인계.
- 다음 행동: 허용된 환경에서 `node scripts/hani-office-actions-221.browser.mjs`로390/1440의01:40 3F 90초 실화면 검사, 기존office219 baseline 검사 재실행. 그 후 배포 담당 Claude가 열차에 통합.
- Seed 순서: **신규 `assets/data/office-actions-221.json`만 seed PR로 선행 추가** → runtime/검사 변경을 열차에 포함 → 후보 버전/캐시1회 증가 → Candidate gate/대표님 Preview 승인 → 기존 canonical 배포. Edge Function·서버 설정·schema 변경 없음. 별도 운영 PR 작성하지 않음.
- 잠재 제약: 첫 일간 계획 생성은 이 PC에서 약1.2초, 이후 메모리 cache 사용. 이전 날 미노출 행동도 cooldown 보수적 상한에 포함하므로 자정 직후 긴 휴식은 줄어들 수 있음. 빠른 표정/업무 빈도에는 영향 없음.
- Notion 갱신 대기 내용: 도연/2026-10-20, 야간·주말120행·스케줄러·fallback 개발검증 완료, Edge/office219/커밋 차단 여부, seed JSON 선행 및 Claude 열차 인계. append 자동 승인 정책 거절로 저장/read-back 미완료.
- CURRENT: 이번 작업의 확인 결과만 최상단에 추가, 기존 다른 담당 기록 보존. DECISIONS 신규 정책 변경 없음.
- main/Pages/Production 미반영. 승인되지 않은 후속 배포 단계로 진행하지 않음.

## Git 최종 결과

- 지정한 작업 파일만 `git add -- ...` 시도 → **exit1**, 외부 Git 메타데이터 `HANI_OS_DEV/.git/worktrees/night221/index.lock` 생성 권한 거절.
- 이어 `git commit --only -m "fix(office): animate present staff on nights and weekends" -- ...` 시도 → **exit1**, add하지 못한 신규 파일의 pathspec 미등록으로 거절.
- HEAD `4a913303afb3de11e948c899387b4760810684c1`, index diff 없음. 대표님 지시대로 **미커밋 상태로 worktree에 보존**. 권한 우회·main 수정·push/PR/merge/배포 없음.
- 단계: 기능 개발/targeted 검증 완료 → 커밋/push 차단 → **열차 탑승 준비 대기**. 현재 탑승 완료/운영 완료가 아님.

## 2026-10-20 · launch-221 구현·검증 인수인계

- 담당: 도연(Codex), 단일 Agent. branch `hani/night-actions-221`, 시작/현재 HEAD `d78b61f552372c5150f0f7a51734ddac22237b24`, base/main `4a913303afb3de11e948c899387b4760810684c1`. 위의 이전 night-actions 커밋 실패 기록은 당시 시점이며, 현재 기존 작업은 HEAD에 보존되어 있습니다. 이번 작업에서 merge/rebase하지 않았습니다.
- 승인 근거: 성민 대표님 치비 런치 아트 ‘좋아’ + 이번 요청의 새 UI 키 승인, 테마 토글·실제 앱 연결·테스트·커밋 시도. **버전/cache·생활 데이터·Cloud·main/배포 승인 아님.** 표시 v2.9.220 유지, 마지막 신규 JS는 `hani-launch-greeting.js`(캐시 태그 없음; 열차에서 일괄 추가).
- 구현: canonical 신규 JS/CSS, index 네 연결(스타일·토글·inert 이미지 template·마지막 스크립트), 제공 assets/launch 6개. Greeter는 사용하지 않고 시간별 단체 그림 하나만 사용. 기존 auth/bootstrap/sync/renderer·night-actions 원문 변경 없음.
- 조건/시간: 기존 게이트와 app inert/locked 상태가 모두 해제된 뒤 KST 하루1회. 21:00–05:59 밤 그림, 나머지 낮. 아침06–11/오후12–17/저녁18–21/심야22–05, 모든 인사에 회장님. 다른 modal/dialog/popup/popover가 있으면 이 open은 skip; 로딩 중/표시 중 발생하거나 재잠금 시 즉시 취소, 그 open에서 재시도하지 않음.
- 동작: off-DOM 선택 이미지 decode,800ms 실패/지연 skip. 180/320ms 등장과160ms 퇴장,2100ms hidden. Reduced motion 정적1200ms. 화면 click/tap·Esc·모든 key 즉시 종료, 종료 시 listener·observer 정리. `role=dialog`/aria-label, trap/inert 추가 없음. 원래 포커스로 복귀하되 새 modal/로그인에 포커스를 빼앗지 않음.
- 저장: root JS 전체 theme 키 조사에서 JSON prefs owner 없음(계절/finish/legacy 문자열만 존재). 승인된 `hani_theme_settings_v1`에 `{launchLastSeen,launchEnabled}` 저장, 기본ON. 모든 접근 try/catch. 같은 키의 sessionStorage로 localStorage 실패 시 새 문서/익일까지 세션1회 제한과 off 보존. 둘 다 차단되면 현재 문서 메모리만 가능하며, 새로고침 너머 영속 보장은 불가. 보호 키 read/write 경로와 Cloud 등록 없음.
- 기존 검사 보정: login204가 최신 integrated baseline의 remote update를 일방적으로 제거하던 오류 수정, white215 cache 기준을v218 고정에서현재 main으로 변경. QA210/office219 whole-index 비교는 승인된 네 연결이 정확히1개씩 있는지 검사해 제거한 뒤 나머지 전체 바이트/EOL을 비교. 원본 보호 assertions를 삭제하거나 현재 파일을 기대값으로 대신하지 않음.

| 검증 | 결과 / 증거 |
|---|---|
| `node scripts/hani-launch-greeting-221-unit.test.mjs` | 실제 module VM23 PASS, life sentinel 보존·쓰기0 / `artifacts/launch-221/unit.log` |
| `hani-login-a-204.test.mjs`, `hani-theme-white-215.test.mjs` | 전체 Node PASS, 로그인·저장 owner 원문·기존 팔레트·버전/cache·EOL 비교 |
| `hani-qa-210.test.mjs` | 9 PASS / 각 로그 `artifacts/launch-221/` |
| office actions221/216, seats215, v2, fix218, office219, building206 | 각각20/15/12/18(+optional2 SKIP)/6/6/21 PASS. 공통 engine 중복 포함 |
| WebP6개 실제 pixel decode | PASS / `assets.json` |
| 기존 release `collectReferences`의 신규4경로 | PASS / `runtime-references.json`. Inert template은 실제 선행 preload를 하지 않음 |
| JS syntax·git diff check | PASS. 보호 auth/data owner·기존 night-actions 변경 없음 |
| `hani-launch-greeting-221.test.mjs` (browser) | **차단: launch spawn EPERM**, 캡처0 / `results.json`, `browser.log` |
| login204-ui, navlogin-ui, white215 browser / office 실제화면 | **차단: launch spawn EPERM**. 실제 화면·console0·터치·스크린리더·AA 검증 PASS 아님 |

- Git 읽기 하위 프로세스 EPERM은 host Git이 export한 정확한 원문으로 기존 git show 요청만 공급하여 Node 검사를 실행. 원문·보조 adapter는 artifacts 안에 보존, 제품 runtime과 분리. 재현 방법/테스트 로그: [증거 안내](../../../artifacts/launch-221/README.md).
- 미검증/위험: 실제390/884/1440 light/dark×day/night12장, 사용자 계정/Android/스크린리더, 독립 아린/HINA·Candidate package/One-Pass·Production. 실제 앱 browser test는 준비했으나 실행 완료 아님. 버전 증가는 기능 탭 규칙에 따라 N/A(열차 담당 수행).
- Notion: 기존 chibi 카드 읽기는 성공, 계획 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. **계획/최종 결과 미반영·갱신 대기**, 이 절이 공유할 요약의 원본. 자동 동기화 완료 아님.
- 다음 한 가지 행동: 브라우저 허용 환경에서 신규 browser suite 및 기존 login/navlogin/white UI를 실행해12장·실제console0을 확인한 뒤 Claude 열차에 인계. 이 차단이 해결되기 전 Preview/탑승 완료로 표시하지 않음.
- 배포 순서: 신규 JS/CSS·단체 이미지2개를 같은 열차 패키지에 포함(선행 seed를 택하면 먼저 두 이미지 추가). 제공 greeter4개는 미사용. 신규 파일 cache tag는 열차 버전1회 증가 때 부여. 서버 Edge Function·Cloud·schema·설정 선행 작업 없음.
- main merge·Pages·운영 표시 버전·최신 JS 실제 로딩·Production read-back: 모두 **미수행**. 현재 브랜치 기능 코드 준비 및 Node targeted 검증과 구분.

### launch-221 Git 최종 결과

- 지정한 launch 파일만 `git add -- ...` 시도: **exit128**, 외부 메타데이터 `.git/worktrees/night221/index.lock` 생성 permission denied. `artifacts/launch-221/git-add.log`.
- 이어 `git commit --only -m "feat(ui): greet after login with daily chibi launch art" -- ...` 실제 시도: **exit1**, 신규 파일이 stage되지 않아 pathspec 미등록. `git-commit.log`.
- HEAD `d78b61f552372c5150f0f7a51734ddac22237b24` 유지, staged diff 없음. 대표님 지시대로 **미커밋 worktree에 보존**, 기존 night-actions 두 커밋 유지. push/Draft PR/merge/배포 없음. 권한 우회 없음.
- 최종 상태: 코드 준비·Node targeted 검증 완료 / 실제 browser·스크린샷 검증 차단 / commit·push 및 Notion 갱신 대기. 배포 열차 탑승 완료나 Production 완료로 보고하지 않음.
