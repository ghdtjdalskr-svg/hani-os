# test-maint-230 · 도연 (Codex)

## 작업 식별

- 갱신: 2026-10-22 KST / 구현·지정 검증 완료, Git 권한 차단으로 미커밋 보존
- 담당: 도연(Codex), 실제 Edge 재검증: 서윤
- branch: `hani/test-maint-230`; base/시작 HEAD: `fec691838aec695b575708e3ad7dda7828ea96d0` (main v2.9.229)
- origin/main 로컬 캐시도 fec6918. `git ls-remote origin refs/heads/main`은 네트워크 연결 실패로 원격 최신성 미확인. merge/rebase 없음.
- 범위: 사용자 지정 회귀 10종의 실패 재현·stale 기대값/실제 앱 회귀 구분·최소 수정·Node 재실행.
- 승인: 이번 사용자 요청. 버전/cache/Storage/Cloud 변경 및 main merge/배포 승인 없음. `scripts/hani-office-219.test.mjs` 변경 금지.
- 기존 다른 담당 artifact/QA 이미지 변경과 미추적 자료는 보존하며 stage하지 않는다.
- CODEMAP: investment-research의 owner/targeted tests 확인. 탭 수는 후속 street-journal 배포로 달라져 실제 owner와 git 이력 기준으로 조사.

## 결과와 증거

- 초기 실행 로그: `artifacts/test-maint-230/*.before.log`. 기본 PATH에는 Git/Node가 없어 bundled 실행 경로로 해결했다. Git child-process EPERM도 `HANI_GIT`에 실행 경로를 지정한 뒤 해소했다. 실제 assertion 재현은 `*.reproduced.log`, `split-ui.browser-attempt.log`, `research-ui.browser-attempt.log`에 별도 보존했다.
- 기준선: `hani-main.js:7215` 표시 상수 v2.9.229, index cache v2.9.229, 마지막 외부 JS `hani-launch-greeting.js`(기존 unversioned). runtime/표시 버전/cache 변경 0.
- Notion 허브 조회 성공. 착수 append는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 미완료; 작업 요약 반영 대기.
- 아래 분류는 이 worktree에서 직접 재현한 실패 기준이다. **b(실제 앱 회귀)는 이번 검사에서 발견하지 않았다.** a에는 오래된 pin 외에 새 worktree에서 재현된 누락 fixture 두 건도 명시적으로 구분했다. 서윤의 이전 환경에 fixture가 있었다고 추정하여 다른 assertion을 만들어 기록하지 않았다.

### 10종 분류표

| test | 정확한 실패 / 원인과 도입 근거 | a/b | 변경 및 재실행 |
|---|---|---|---|
| `hani-app-216-audit.test.cjs` | line63 `deepEqual(styles(index),expectedStyles)`에서 실제 목록에 `./hani-street-journal.css` 추가. v227 `a306df1`/PR323의 의도된 CSS 연결 | a | committee CSS 바로 다음 journal CSS 하나를 정확한 순서로 허용. 나머지 cascade·head-only·cache·lazy worker·배포 승인 검사는 유지. Node PASS |
| `hani-brand-heroes-218.test.mjs` | line46 `hani-ui-v02992.js only exact reviewed hero/remote delta allowed`: 현재만 `withoutHeroRestore`한 결과를 hero가 포함된 merge-base(main228 이후) 원문과 비교. v228 `902b5ab`/PR326 이후 비대칭 | a | 양쪽에 같은 exact hero 역변환. HEAD 자기 비교를 v225 Git 원문+명시적 후속 release allow-list로 교체. voice·15 owner 전체 나머지 바이트 보존. Node 3 PASS |
| `hani-hero-restore.test.mjs` | line26 `ENOENT artifacts/hero-restore/new-art.json`. PR327 `4a6c440` 테스트가 미추적 생성 artifact에 의존. 이미지/renderer assertion 실패는 아님 | a (fixture 누락) | 원래 11장 목록을 추적되는 `scripts/fixtures/hero-restore-new-art.json`으로 이동. 실제 파일 크기·목록 크기 일치·SHA256도 추가 검증. 기존 decode/비율/배역/217 oracle/반복 slot/write0 유지. Node 4 PASS |
| `hani-invest-split-ui.test.mjs` | 실제 Edge line29 탭 수 `3 !== 2`. v227 `a306df1`에서 Street Journal 세 번째 persistent panel 도입 | a | 3개 정확한 label+aria-controls 순서를 비교. 기존 투자 금액·현금·시세 기준·map/chart·legacy4패널·상태/저장/DOM 동일성·오류 검사를 모두 실행. Edge 1440/390 PASS |
| `hani-invest-split.test.mjs` | line38 `nav.children.length`, `3 !== 2`. 같은 v227 변경 | a | 3탭 정확한 label+ARIA 계약, End→journal mount/hash/다른 panel hidden, ArrowRight→research 순환을 실제 선택 owner에서 추가 실행. 기존 keyboard/route/4legacy paths/polling/canonical asset link/unique-id 검사 유지. Node PASS |
| `hani-investment-research-ui.test.mjs` | 실제 Edge line52 `tabs.getByRole('tab').count()`, `3 !== 2`. 같은 v227 변경 | a | 정확한 3탭 label+ARIA 계약. 생성/편집/재로드·GPT 계속/취소·적립계좌·stale 초안 차단·확정/수정/기존 snapshot 보존·인쇄·header geometry·overflow/console 검사를 그대로 끝까지 실행. Edge 1440/390×cream/black 네 조합 PASS |
| `hani-ocr-accuracy-224.test.mjs` | 우선 `ENOENT artifacts/ocr-accuracy-224/corpus.json`; 세 입력 fixture가 PR321 `3908ff8`에 미포함. 복구 후 기존 main/index 전파일 hash는 `06519be`에 고정(main `98349e08…` vs 현재 `8e91fe38…`, index `4ef0315b…` vs 현재 `0aa7aef3…`). v224–229의 버전/후속 UI 변경이 포함된 정상 drift. 출력 폴더 없으면 metrics 쓰기도 ENOENT | a (pin+fixture) | 원래 corpus/parser/write manifest를 fixtures로 추적, 출력 폴더 자동 생성. 원래 hash는 Git06519be 출처 검증으로 보존하고 현재 main/index는 v225+명시적 release 변경과 전바이트 비교. 보호11함수/write-call/non-Vision Edge hash는 **변경하지 않음**. Node13 PASS, 합성22건330필드305→330 일치(실 AI 인식률 아님) |
| `hani-qa-210.test.mjs` | line123 `hani-context-remote-v1.js preserved version/save paths`: hero/remote exact delta를 현재만 역변환해 baseline과 version literal 집합이 달라짐. v228 이후 | a | 버전/save/id/EOL·index 전체 비교의 양쪽에 같은 exact 역변환. v225+허용 release oracle. contrast 부정검사와 저장 owner·Vault 나머지 바이트 보존. Node 전체 PASS |
| `hani-settings-225.test.mjs` | line33 `hani-design-system.css reviewed UI source`: expected hash는 hero 포함 main에서 만들고 current는 hero 역변환하여 불일치. v228 이후 | a | 양쪽 exact hero 역변환+v225/후속 Git oracle. status projection, control/notice/reset·보호 문구 변조 거부, 원래 settings delta·write/version 비교 유지. `--static` PASS |
| `hani-simplify-225.test.mjs` | line23 `index.html reviewed source`: expected `d03b47c6…`, actual `9b341156…`; line45 역변환 hash도 `2b754697…` vs `99d582ed…`. v225 고정 전체 hash가 v226 cache/입력→v227 journal→v228 hero→v229 cache 변경을 거절 | a | 단일 frozen hash를 v225 Git 원문+파일별 명시적 release allow-list에 교체. 양쪽 exact settings/hero 역변환, 원래 simplify delta·control/write/notice/approval/EOL 부정검사 유지. Node4 PASS |

### 엄격성 / 다음 release 대응

- 신규 `scripts/hani-reviewed-release-baseline.mjs`: 통합 기준 release225 `776752c971f2ce48edf376a707eb345ae57da98c`에서 시작한다. 후속 226 `94ead73`(입력), 227 `a306df1`(저널/사무실), 228 `902b5ab`(hero/remote), 229 `83391f0`(사무실)만 **full SHA + 해당 변경 파일 + 이유**로 허용한다.
- 각 허용 commit의 parent 파일이 직전 예상 파일과 완전히 같아야 다음 snapshot을 적용한다. HEAD/origin/main 자체를 expected로 만들지 않는다. 나열되지 않은 중간 변경은 거부한다. Git history가 없는 shallow checkout은 해당 객체를 준비해야 하며, 검사를 SKIP하지 않는다.
- 다음 train의 단순 cache/표시 버전 증가는 정해진 `?v=2.9.229`, canonical constant, 기존 HANI 표시 문구만 현재 표시 버전에 맞춘다. 보호 내부 버전·과거 문구·일반 version literal은 유지하고 rollback/malformed version은 거부한다. 다음 기능 변경은 근거 있는 release allow-list 갱신이 필요하다. 무조건 미래 변경을 통과시키지 않는다.
- 신규 baseline 검사3종: release 체인/현재 byte 일치, 다음 v230 cache+모든 표시 문구와 내부 버전 보존, control/notice/write/ARIA/EOL 변조 거절 PASS. 기존 테스트의 허용 문자열 역변환은 넓은 regex나 owner 전체 삭제로 교체하지 않았다.
- fixture는 기존 작업 폴더의 원본을 복구했으며 현재 runtime에서 새 expected를 생성하지 않았다. OCR baseline parser의 corpus SHA256 및 main/index의 Git06519be 원본 hash를 그대로 검증한다. hero 11장의 기존 hash를 실제 자산 바이트로 추가 대조한다.

### 실행 명령 / 증거

- 환경: Windows / Node `v24.19.0` / Microsoft Edge `155.0.4283.62` headless / Playwright bundled. 브라우저 외부 요청 차단, 합성 state/격리 context 사용. 실제 계정·운영 기록·실제 Cloud 연결 없음.
- Node: `node scripts/<위 표 8개 Node 테스트>` (`hani-settings-225.test.mjs`만 `--static`), 추가 `node scripts/hani-reviewed-release-baseline.test.mjs`. **9개 명령 exit0**, skipped 없음. 변경된 10개 테스트+신규 helper/test/fixture mapper syntax PASS. `git -c core.whitespace=cr-at-eol diff --check` PASS.
- UI: `node scripts/hani-invest-split-ui.test.mjs <playwright/index.mjs> <msedge.exe>` 및 `node scripts/hani-investment-research-ui.test.mjs <playwright/index.mjs> <msedge.exe> artifacts/test-maint-230/research-ui` 모두 exit0. 즉 지정10종 전체(8 Node+2 full UI) 재실행 PASS. 실 Edge 실행은 이번 환경에서 도연이 직접 한 것이며 독립 검토/서윤 재검증 완료로 바꿔 기록하지 않는다.
- Node 로그 `artifacts/test-maint-230/*.final.log`, 초기/중간 실패는 같은 폴더 `*.before.log`, `*.reproduced.log`, `*.after1.log`. 최종 목록은 `results.json`, source/test identity는 `identity.json`, OCR 원래 pin 대조는 `ocr-old-pins.json`.
- 투자분할 PNG: `.ai-budget-private/invest-split-204/{1440,390}-{stocks,committee}.png`. 리서치 PNG24장: `artifacts/test-maint-230/research-ui/`. 모바일 stocks PNG도 직접 열어 확인했다. 실제 Android, 실제 AI/시세 API, 실제 인증/Cloud, 나머지 테스트의 브라우저 모드는 미검증이며 PASS로 표시하지 않는다.
- `index.html`, `hani-main.js`, IC/market owner, 금지된 `scripts/hani-office-219.test.mjs`는 HEAD 대비 원문·SHA256 동일. 운영 JS/CSS/Supabase 소스 변경0. 버전/cache/Storage/Cloud/schema/migration/main/배포 변경0. research UI의 기존 합성 localStorage save 회귀는 격리 브라우저에서만 실행했다.
- `git add`는 지정18파일만 시도했으며 `.git/worktrees/testmaint/index.lock: Permission denied` exit128. staged 파일0. 이어 같은18파일의 `git commit --only -m "test: align v229 regression contracts with reviewed releases" -- <files>` 실제 시도는 신규8파일이 index 미등록이라 pathspec 오류 exit1. **HEAD fec6918 유지, 수정·fixture·인수인계 전부 미커밋 보존.** 로그 `git-add.log`, `git-commit.log`. 기존 타 담당 artifacts/QA 이미지는 보존했다. push/PR/main merge/배포 없음.
- Notion 갱신 대기 요약: 도연 test-maint-230, basefec6918/v229, 지정10종 모두 a(누락 fixture 명시), source0·8Node+2Edge/신규oracle3검사 PASS, commit 권한 차단, 서윤 재검증/허용 환경 commit 필요. 착수 append 거절 이후 동일 차단을 반복 호출하지 않았다.

## 다음 담당에게

- 먼저 읽기: 이 표와 `scripts/hani-reviewed-release-baseline.mjs`, `scripts/fixtures/ocr-accuracy-224/README.md`.
- 다음 행동: 서윤이 동일 작업 파일에서 실제 Edge 회귀를 재실행하고 허용된 환경에서 지정18파일 commit/push 및 Notion 저장·read-back. 도연의 격리 Edge PASS와 독립 재실행을 구분한다.
- blocker: Git index.lock 쓰기 권한, Notion 자동 승인 never, 원격 최신성 네트워크 차단. 추가 코드 수정/데이터/배포 승인은 요청하지 않는다.
- Preview/Production: 배포용 Preview/Candidate를 만들지 않았고 실제 운영 검증은 N/A. 구현·검증 완료와 main/Pages/운영 완료를 구분한다.
- CURRENT/DECISIONS: 공통 원장·정책은 변경하지 않고 작업별 인수인계만 추가했다. 서버 Edge Function/설정 동반 배포 없음. 테스트·문서 PR은 runtime 열차/버전 증가 N/A.
- 버전 증가/build/One-Pass/HINA/main/Pages/read-back: 이번 범위 N/A.
