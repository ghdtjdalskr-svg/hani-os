# 뉴스룸 「주간 시황 4컷」

## 작업 식별

- 갱신(KST): 2026-10-22 / 담당: 도연(Codex), 단일 개발자.
- 상태: 기능 구현/targeted QA 완료, 원화·편집·closure 경로 해결 전 탑승 보류. 운영 반영 완료 아님.
- 저장소/branch/worktree: ghdtjdalskr-svg/hani-os / hani/newsroom-4cut / news4cut.
- base SHA: fec691838aec695b575708e3ad7dda7828ea96d0 (로컬 origin/main 동일).
- 원격 main: GitHub 연결 도구에서 `fec691838aec695b575708e3ad7dda7828ea96d0` 일치, index.html runtime 태그 v2.9.229 확인. 로컬 HANI_DISPLAY_VERSION=2.9.229, 마지막 script는 hani-launch-greeting.js, 마지막 공통 UI 모듈은 hani-ui-v02992.js. Production 화면/read-back은 이번 개발 범위에서 미실행.
- 승인: 성민 대표님의 이번 요청, 읽기 전용 4컷 슬롯·catalog·targeted tests·커밋 시도.
- 범위: index.html persistent slot, hani-main.js showView 진입 한 곳, hani-newsroom-4cut.js 단일 renderer, hani-design-system.css, assets/data/newsroom-4cut/issues.json, 테스트/fixture/증거, 이 인수인계.
- 표시 버전/cache 유지. localStorage/Cloud/schema/migration/운영 데이터 변경, main merge/배포 승인 없음.

## 결과와 증거

- NORMAL: scoped discovery → patch → targeted regression. CODEMAP newsroom 소유 함수/DOM 확인. 기존 UX observer나 event delegation 추가 없음.
- 원화 파일 assets/newsroom-4cut/001.webp, 최종 제목/alt/출처는 서윤 추가 예정. 현재 catalog는 미래 발행 placeholder, 테스트 fixture는 운영 경로에 넣지 않음.
- 구현: `showView('newsroom')` 한 곳에서만 enter, literal `fetch('assets/data/newsroom-4cut/issues.json')`. 첫 진입 동시 호출은 1회로 합치고 이후 메모리 재사용. KST 날짜별 published 정렬, 미발행/오류/빈 목록은 카드 숨김, 오류는 다음 진입 재시도. latest 및 지난 8호, 안전한 HTTP(S) 출처, 네이티브 dialog 닫기/ESC/focus 복원. 정적 slot·기존 단일 진입 경로, 새 observer/전역 이벤트 레이어 없음.
- 검증 환경: Node v24.19.0, Playwright+실제 Headless Edge, 가상 시계, 호스트 timezone America/Los_Angeles에서도 KST 경계 검증. 외부 API는 차단했고 기존 뉴스 자동 조회/저장은 테스트에서만 stub. 실제 계정 로그인/Cloud 정상 동작 검증과 구분.
- `node scripts/hani-newsroom-4cut-230.test.mjs`: Node 5 + browser 1 통과. 10/24 숨김·10/25 표시/캐시 자정 재진입, 빈 목록, 주차/제목/문구/출처, 과거 순서8개/선택/최신 복귀, 다른 뷰 catalog 요청0·뉴스룸1, slot identity 유지, 저장소 쓰기0, 신규 중복 ID0, dialog 확대·ESC/focus, 390/884/1440 × pure-white/midnight-black 가로 넘침0·AA 확인.
- `node scripts/hani-newsroom-persona.test.mjs`: 4 통과.
- `node scripts/hani-newsroom-followup-smoke.mjs`: desktop1440/mobile390 통과 (로컬 서버8774).
- `node scripts/hani-duplicate-id-guard.test.mjs`: 2 통과. index/참조 JS/CSS 65파일, baseline64, 기존 중복8 유지·신규0. 신규 guard가 실제 collectReferences로 catalog 포함도 확인.
- `node --check hani-main.js`, `node --check hani-newsroom-4cut.js`, `git diff --check`: 통과. HEAD 대비 main은 진입1행 외 바이트/EOL 일치, index는 slot/script 외 바이트/EOL 일치, CSS 기존 전체 prefix 일치. 버전/cache 및 보호 write 원문 불변.
- 증거: `artifacts/newsroom-4cut-230/browser-results.json`에 runtime 5파일 SHA-256, 텍스트 대비 13.74(light)/16.06(dark), 안내문6.59/9.26, overflow0·storageWrites0. 카드 PNG6장(고정 global chrome만 촬영 중 숨김), 실제 원본 dialog viewport PNG2장, 기존 F/U PNG2장. 테스트 SVG719bytes는 scripts/fixtures에만 있으며 최종 원화 품질 검증 근거가 아님. 카드 390/light·1440/dark 및 dialog1440 시각 확인.
- 미검증: 실제 원화/최종 편집·실제 기사 출처 정확성, 실제 계정/Cloud/Android, 아린 독립 UI review, frozen package/One-Pass/HINA 및 Production. 기능 담당 Development Mode로 full package는 만들지 않았고 gate를 우회하지 않음.
- PR/Preview/main/Pages/Production read-back: 미실행. 표시 v2.9.229 유지, final candidate gate는 배포 담당 단계.

## 다음 담당에게

- 먼저 읽을 함수: showView → HaniNewsroom4cut.enter → render; main renderInvestmentNews는 다른 화면에서도 호출되므로 catalog fetch 연결 금지.
- 다음: 서윤 원화·최종 제목/alt/출처 추가 및 아래 catalog 경로 조정 결정 → targeted test 재실행 → 배포 담당 열차.
- blocker 1: 원화/최종 제목/출처 없는 placeholder 상태는 발행 준비 완료 아님. 2026-10-25부터 catalog 기준 노출되므로 발행 전 원화/편집 완료 필수.
- blocker 2: 기존 `collectReferences('assets/data/newsroom-4cut/issues.json', catalog)`는 image의 루트형 `assets/newsroom-4cut/001.webp`를 **`assets/data/newsroom-4cut/assets/newsroom-4cut/001.webp`로 해석**한다. literal fetch로 catalog 자체 수집은 확인했지만, 원화를 올바른 폴더에 추가해도 이 참조 문제는 별도로 남는다. release tooling/bridge는 수정하지 않았다. 대표님께 catalog-relative `../../../newsroom-4cut/001.webp` + 화면의 안전한 root 해석 제안을 질문했으며, 답변 전에는 요청한 원문 형식을 유지한다. full release closure PASS로 간주하지 말 것.
- 함께 배포할 서버 Edge Function/설정: 없음. 경로 표현 조정만으로 해결 가능하며 release resolver 수정이 선택되면 별도 CRITICAL 범위·게이트 필요.
- Git: 커밋 시도 결과 아래 종료 기록 참조. 임의 push/PR/main merge/배포 없음.
- Notion: 현황판 읽기 성공. 계획 append는 자동 승인 검토 approval policy never 거절, 미반영. 종료 요약도 저장소에 보존해 갱신 대기.
- CURRENT: 이번 기능/검증·발행 전 blocker만 선두 요약. DECISIONS 미변경(경로 제안을 승인으로 기록하지 않음).
- 착수 시 존재하던 `assets/comic-trial/`, `docs/drafts/comic-news4-boxes.json`, `docs/drafts/newsroom-4cut-001-draft.json`는 이 작업 수정/commit 범위에서 제외.

## 재실행

일반 Node/Playwright 환경에서 위 명령을 실행한다. 이 기기에서는 PATH에 도구가 없어 다음 환경을 사용했다.

```powershell
$env:HANI_GIT_PATH='C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe'
& 'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' scripts/hani-newsroom-4cut-230.test.mjs
```

`--node` / `--browser`로 분리 가능. F/U smoke에는 `NODE_PATH=<동일 runtime>/dependencies/node/node_modules`, `HANI_BROWSER_PATH=C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`, `HANI_PREVIEW_OUTPUT_DIR=artifacts/newsroom-4cut-230/followup`, 로컬 서버8774 사용. 운영 catalog는 원화 경로를 보존하고 브라우저 route에서만 SVG를 제공한다.

## 종료 기록

- 지정 파일만 `git add -- ...` 시도 → worktree Git metadata의 `index.lock` 생성 Permission denied. 이어 `git commit --only ...` 시도 → 신규 파일 pathspec 미등록으로 실패. **미커밋·미push**, HEAD/base 유지. index 권한 우회/다른 worktree 수정 없음.
- 최종 신규 통합 명령 `node scripts/hani-newsroom-4cut-230.test.mjs`: 6/6 PASS. 증거 해시는 최종 runtime과 일치. 기존 관련 검증 결과도 위와 같고, 문서 변경으로 runtime 증거를 반복 생성하지 않음.
- Notion 종료 갱신은 같은 자동 승인 차단 조건으로 갱신 대기. 계획·결과를 이 문서와 CURRENT에 보존, Notion 반영 완료로 표시하지 않음.

## 2026-10-23 통합 테스트 보정 착수 · 도연(Codex)

- branch/worktree: `hani/train-231` / `train231`; 시작 HEAD `3c48f33a21fa3e3aa6d60305d2612b06d14d93e2`, main 기준 `ad3c2f3ed7716f97b81e1b0b66f3f4238a7aa04d` (v2.9.230).
- 대표님 승인: 지정 14종+desk-mascots unit 실행, 승인 newsroom 추가분의 중앙 보존 검사 연결, 빈 목록/발행 fixture 검사, 테스트 전용 커밋. 실제 런타임 회귀 발견 시 중단.
- 수정 범위: `scripts/` 테스트·preservation helper 및 이 인수인계. runtime/버전/cache/storage/Cloud/main/배포 변경 없음. 기존 dirty artifact와 untracked comic 원화는 제외.
- CODEMAP newsroom entry 확인; 4cut anchor는 미등록(CODEMAP_MISS), 실제 `showView → HaniNewsroom4cut.enter → render` 확인.
- 원격 main 조회는 GitHub 연결 차단으로 실패. 로컬 origin/main은 위 기준과 일치. 표시 `HANI_DISPLAY_VERSION=2.9.230`, 마지막 script `hani-launch-greeting.js`, 최신 공통 UI `hani-ui-v02992.js` 유지. Production 확인은 범위 밖.
- Git Node subprocess EPERM으로 oracle 검사가 차단됨. 직접 Git에서 내보낸 동일 blob으로 실행하는 검증 harness 준비 중. Edge는 별도 실제 실행 시도 예정.
- Notion 현황판 읽기 성공, 착수 append는 자동 승인 검토가 approval policy never로 거절. 요약 갱신 대기 내용을 이 문서에 보존.

### 결과와 증거 · 테스트 전용 후속

- 상태: 지정 14종 Node/정적 명령 및 desk-mascots `--unit` 모두 exit 0. 실제 런타임 회귀는 이 실행 범위에서 발견되지 않음. 브라우저는 실행 차단으로 미검증이며 전체 실화면 suite PASS로 보고하지 않음.
- 중앙 경로: 기존 `pendingApprovedConnections`에 `hani-newsroom-4cut-preservation.mjs` 연결. CURRENT의 정확한 newsroom block/script/진입행/CSS를 각각 1회만 처리. script는 media-core 다음/main 이전, 진입은 ilbo 다음/geminiReports 이전, CSS는 맨 끝 위치까지 고정. Git release225→명시된 release230 승인 chain은 변경하지 않음.
- 보고서: 승인된 현재 catalog 행 SHA-256 `0448b75712d4582ae1dd23615b0dd031e5dc7df0fc001dd63d034ddb1dd9919a`만 허용. 고정 release230 `04fb2b377f28958aec1480ca09244f4567c3a339`의 원본 catalog 행 해시 `a06b7ea267dd3f7fd716127ff0c7ce84b1a2ad7a08e0c6935035e6558d05dc14` 확인 후 복원. 보고서 renderer나 bundle 전체를 지우지 않음. 보고서 추가4건과 새 newsroom JS/catalog 파일은 명명 allow-list만 허용.
- mutation 검사 7/7 PASS: 보호 control/notice/storage/EOL, 승인 영역 안팎의 코드·CSS·catalog 변형, 누락·중복·태그 변경·script/event/cascade 이동을 거부. normalize를 과거 Git oracle에 적용하는 것도 거부. 신규 helper는 현재 파일을 읽어 기대값을 만들지 않음.
- 4cut: 운영 `{"issues":[]}`는 발행일 후에도 숨김·이미지 DOM 접근0·catalog 1요청·write0·예외0을 확인. 첫 호는 운영 catalog와 독립된 완전한 fixture(number/date/week/image/alt/title/sources) 사용. 발행 경계·렌더·출처·지난8호·재시도·영속 슬롯 검사를 유지. 브라우저에도 빈 목록 이미지요청0/오류0/src0/write0 검사와 fixture 발행 검사 준비.

| 테스트(원래 assertion 위치) | 정확한 실패 원인 | 변경 / 최종 Node 결과 |
|---|---|---|
| `hani-app-216-audit.test.cjs:68` | `assert.match(m[1],/\?v=/,m[1])`: 미태그 `./hani-newsroom-4cut.js` | 명명 pending 파일 allow-list 확장 / 7 PASS |
| `hani-brand-heroes-218.test.mjs:46` | `assert.equal(current,baseline(file),file+' only exact reviewed hero/remote delta allowed; all other bytes preserved')` | 기존 중앙 current reader로 정확한 추가분 정규화 / 3 PASS |
| `hani-dash-218.test.mjs:30` | 최근 보고서 수 `assert.equal(...length,6)`, actual10 | 원래6 유지+명명 추가4 파일 확인 / 3 PASS, 기존 raw baseline 미존재 검사1 SKIP |
| `hani-login-a-204.test.mjs:82` | `assert.equal(line,old.get(text),file+' retained EOL ...')`: 새 `        </button>` LF와 기존 CRLF 동형 줄 충돌 | CURRENT 보존 루프만 중앙 reader 사용 / PASS(보호 owner 검사 포함) |
| `hani-newsroom-4cut-230.test.mjs:59,74,90` | 빈 catalog 첫 항목 `.number` 접근 및 발행/재시도 후 `hidden===false` 기대 | 독립 발행 fixture+실제 빈 목록 분리 / 6 PASS |
| `hani-ocr-accuracy-224.test.mjs:32` | `assert.equal(read(p),readReviewedReleaseBaseline(p),p+' release225 plus explicit approved later changes')`: main 진입행/catalog | 중앙 처리, write/Edge 검사는 변경 없음 / 13 PASS |
| `hani-office-219.test.mjs:79` | 정규화한 index와 승인 release230 index의 `assert.equal(...,f+' preserved')` | mascot 전용 제거를 같은 중앙 reader로 전환 / source/model+6 PASS |
| `hani-proactive-204.test.mjs:166` | `assert.ok(byText.get(t).has(...),file+' EOL ...')`: 새 닫는 버튼 LF | CURRENT 보존 루프만 중앙 reader / 21 PASS |
| `hani-qa-210.test.mjs:123` | `assert.deepEqual(current.match(pattern),old.match(pattern),file+' preserved version/save paths')`: 새 보고서 역사 버전 문자열 | 정확한 catalog 행만 중앙 처리 / 9 PASS |
| `hani-reviewed-release-baseline.test.mjs:8,34,43` | release225+명시 승인 chain 대비 CURRENT 전체 바이트 불일치 | pending 경로 확장·다중 owner 및 부정 mutation 검사 보강 / 7 PASS |
| `hani-settings-225.test.mjs:34` | `assert.equal(hash(source),entry.afterHash,file+' reviewed UI source')` | 중앙 처리, 테스트 자체 완화 없음 / `--static` PASS(127 source IDs/109 planned IDs·write0) |
| `hani-simplify-225.test.mjs:21,43` | reviewed `afterHash` 및 역변환 `beforeHash` 불일치 | 중앙 처리, hash/control/write 검사는 그대로 / 4 PASS |
| `hani-theme-white-215.test.mjs:50` | exact settings/simplify/offline/mascot 정규화 index equality | mascot 전용 제거를 중앙 reader로 전환 / Node PASS |
| `hani-ui-203b.test.mjs:84` | `assert.equal(line,oldByText.get(text),file+' retained line ending ...')`: 새 닫는 버튼 LF | CURRENT 보존 루프만 중앙 reader / PASS |
| `hani-desk-mascots.test.mjs --unit` | 추가 회귀 검사 | 변경 없음 / 실제 DOM 실행+6 PASS |

- 실행 환경: Node v24.20.0. Node에서 Git subprocess가 `spawnSync git EPERM`으로 차단되어, PowerShell의 직접 `git archive`로 **각 고정 ref의 원래 blob 바이트**를 임시 폴더에 내보내 실행했다. Git oracle을 CURRENT/HEAD로 대체하지 않았으며 원본 EOL 그대로다. 임시 preload는 `git show`/고정 merge-base/두 diff 요청만 해당 캡처로 제공하고 미캡처 명령은 오류 처리한다. 제품 코드·검증 기대값을 stub하지 않음. `git archive` 및 Git 명령 자체는 성공, 원격 통신은 실패.
- 로컬 증거: `%TEMP%/hani-train231-git-evidence/`(ref별 원문·임시 preload·diff), `%TEMP%/final-<test filename>`(15개 종료 로그), `%TEMP%/browser-<test filename>`(5개 launch 차단 로그). 서윤의 정상 실행 환경에는 이 임시 harness가 필요 없음.
- 실제 browser 재실행 시도: newsroom230 / OCR224 / office219 / settings225 / theme-white215 모두 지정 Playwright `index.mjs`와 실제 Edge 경로로 호출했으나 **`browserType.launch: spawn EPERM`**. DOM/화면/레이아웃/AA/browser 이미지 요청은 미검증. Playwright import/경로 없음 오류와 구분. 서윤 재실행 대기.
- 최종 targeted 명령: 위 14종 각각 `node scripts/<filename>`; newsroom은 `--node`, settings는 `--static`. login/ui203b는 공유 runner의 `<playwright index.mjs> <browser exe>` 인자도 검증. 별도로 `node scripts/hani-desk-mascots.test.mjs --unit`. syntax/공백 검증은 commit 전 수행.
- 범위 보존: `index.html`, `hani-main.js`, `hani-design-system.css`, `hani-newsroom-4cut.js`, 운영 `issues.json`, 버전·storage·Cloud 수정0. `assets/comic-trial/newsroom-4cut-001-v1.png` 및 기존 dirty/untracked artifact는 stage 대상에서 제외. 버전 증가/build/Candidate/HINA/main/Pages/Production은 테스트 전용 작업으로 N/A 또는 미실행.

### 다음 담당 · 서윤

- 먼저 중앙 pending 연결/helper를 읽고 정상 Git+Edge 환경에서 지정 14종 및 mascot unit을 실행. browser 5종 중 office219만 `--browser <pw> <edge>`, 나머지는 `<pw> <edge>`를 추가한다. newsroom의 `--node`/settings의 `--static`은 browser 실행 시 제거한다.
- 실화면에 실제 회귀가 보이면 런타임 담당으로 반환. 원화 미발행 상태는 의도된 것이므로 운영 catalog에 테스트 그림/첫 호를 채우지 않는다.
- Notion 갱신 대기: 이번 표의 목적·테스트 수정·Node 성공·browser 차단·SHA·다음 행동. 착수 append 자동 승인 검토 거절 때문에 갱신 완료 아님. CURRENT/DECISIONS와 다른 담당 기록은 수정하지 않음.
- 운영/열차 승인 추가 없음. main merge·개별 배포·push는 수행하지 않음. 이 후속의 커밋 시도 결과는 아래에 기록.

### 테스트 전용 후속 종료

- 변경 scripts 11파일 `node --check` 및 `git diff --check` PASS. 런타임5파일은 `git diff --exit-code HEAD -- index.html hani-main.js hani-design-system.css hani-newsroom-4cut.js assets/data/newsroom-4cut/issues.json` exit0으로 원문 불변 확인.
- 지정 12경로(테스트/helper11+이 인수인계)만 `git add -- ...` 시도했으나 worktree metadata `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/train231/index.lock` 생성 Permission denied. 이어 같은 경로로 `git commit --only -m "test: preserve approved newsroom additions in train 231" -- ...` 시도는 신규 helper가 stage에 등록되지 않아 pathspec 미등록 오류. **미커밋·미push**, HEAD `3c48f33a21fa3e3aa6d60305d2612b06d14d93e2` 유지. stage 비어 있음. 외부 Git metadata 권한을 우회하거나 타 worktree를 수정하지 않음.
- 서윤: 허용된 Git 환경에서 위 12경로만 stage/commit. 기존 dirty artifact·untracked 원화 제외. 그 뒤 browser5종을 재실행하고 실제 결과로 열차 인수 여부 판단.
- Notion은 읽기만 확인됐으며 이번 후속 계획/결과 쓰기는 자동 승인 검토의 approval policy never 거절로 미반영. 위 결과와 blocker를 현황판에 반영할 내용으로 보존.

## 2026-10-31 제1호 발행 준비 · 서윤(Claude)

- 대상 주: 2026-10-26~10-30 (10/19~23 초안은 지난 내용이라 폐기). publishDate 2026-11-01. 원화는 빈 말풍선 판을 재사용하고 대사·자막만 교체.
- 사실 확인: 세린 연구원님 수집값을 기사·공식 일정과 재대조. Vertex 임시 URL은 앱에 넣지 않고 실제 기사 주소로 교체.
- blocker 2 해결: catalog의 image는 경로가 아닌 id("001"), hani-newsroom-4cut.js가 assets/newsroom-4cut/<id>.webp로 조합. 경로를 JSON에 넣으면 closure가 JSON 기준으로 해석해 missing이 되어 이후 release가 막힘.
- 배포 결과: 001.webp seed PR #355 → 런타임 release v2.9.238(PR #357, 2026-10-31 merge). issues.json과 renderer는 release에 포함했고, 운영 Pages에서 2.9.238 표시·최신 JS 로딩·카드 렌더링을 확인했다.
- 2026-10-31 추가: 회장님 피드백(토론 장면만 반복)으로 원화를 v2로 다시 그림. 강풍 현장·시소·항구 전망대·라운지. 대사·숫자 동일. 원본 판과 좌표는 hani/newsroom-4cut-001 worktree의 assets/comic-trial, docs/drafts/comic-news4-v2-boxes.json (runtime 비포함).
