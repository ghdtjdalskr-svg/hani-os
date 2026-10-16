# closure-manifest-214 · 작업 인수인계

## 작업 식별

- 갱신: 2026-10-16 KST / 담당: 도연(Codex), 단일 개발 Agent.
- 상태: closure 수정 및 targeted 검증 완료. 전체 게이트는 아래 기존 문제로 PASS 아님. 커밋·push·버전 증가·main 병합·배포 없음.
- 저장소: ghdtjdalskr-svg/hani-os / branch `hani/closure-manifest-214` / worktree `cl214`.
- base/HEAD: `d3f3721a751aac216472c895eab98106d91201a6`; GitHub main 조회 일치. Frozen candidate 없음.
- 목표: JSON/webmanifest 메타 문자열의 잘못된 closure 참조를 제거하고 실제 파일 누락 차단은 보존.
- 승인 근거: 대표님 현재 요청으로 보호 gate 두 파일의 최소 수정·검증 및 PWA 임시 결합 검증 승인. 커밋 금지, 버전 증가 금지.
- 범위: `scripts/hani-runtime-closure.mjs`, `supabase/functions/hani-deploy-bridge/runtime-closure.ts`, 기존 package self-test, 이 인수인계. 저장·Cloud·schema·auth·gate 계약/한도 변경 없음.
- CODEMAP: release-center 의존 경로 확인. closure 세부 anchor는 없어 `CODEMAP_MISS`로 실제 import/walker 경로를 확인.

## 결과와 증거

- `scripts/hani-runtime-closure.mjs` / `supabase/functions/hani-deploy-bridge/runtime-closure.ts`: JSON 문자열은 공백·scheme·절대 URL·MIME·크기 토큰·디렉터리를 제외하고, 자산 확장자 또는 `./`, `../`, `assets/`, `data/`, `js/` 경로만 수집. webmanifest는 `icons[].src`와 자산 확장자가 있는 `start_url`만 수집. `./?source=pwa` 제외. HTML/JS/CSS와 기존 normalize/resolve 로직 불변.
- `scripts/hani-release-package.mjs test`: 두 구현의 원문/실행 동일성, manifest 3아이콘만 수집, 파일 start_url, 메타/디렉터리/외부 URL 제외, 확장자와 중첩 JSON 기존 참조, 실제 아이콘/JSON 누락 차단, HTML/JS/CSS 회귀 추가.
- 증거: [검증 요약](../../../artifacts/closure-manifest-214/run-status.json), [실제 PWA before/after 및 gate 결과](../../../artifacts/closure-manifest-214/pwa-validation.json). 작업 폴더 기준 증거이며 frozen Candidate/HINA 결과가 아님.
- 시작 작업 폴더 clean. Git `fetch`는 외부 Git 관리 경로의 `FETCH_HEAD` 쓰기 권한 거부, shell 원격 연결도 차단. GitHub read API로 main SHA 확인.
- 기준 index의 표시/캐시 `v2.9.212`, 마지막 UI JS `hani-ai-budget.js?v=2.9.212`; 실제 운영 화면/JS read-back은 미검증.
- Notion 계획 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 현황판 갱신 대기: 위 계획 및 최종 검증/제약을 작업 카드에 기록해야 함. 기존 Notion 기록 보존.

### 실행한 검사와 환경 제약

- Node `v24.20.0`, Windows PowerShell. Node에서 Git 하위 프로세스는 `spawnSync git EPERM`. 따라서 해당 명령의 **native 실행은 환경 차단**이며 PASS로 표시하지 않음.
- 검증 보완: shell의 실제 `git archive`로 baseline/과거 commit/임시 결합 tree의 원문 바이트를 추출. 임시 read-only adapter가 `rev-parse/show/cat-file` 조회만 그 원문으로 공급하여 **기존 검사 소스·assertion을 바꾸지 않고 실행**. 미지원 명령은 거절. 테스트용 adapter/원문 snapshot/패키지는 검증 후 제거하고 작은 결과 JSON만 남김.
- `node --check scripts/hani-runtime-closure.mjs`, bridge `.ts`, `scripts/hani-release-package.mjs`: PASS.
- `node scripts/hani-release-package.mjs test`: adapter 실행 PASS. 실제 main closure **111파일**, 이전 구현과 경로/누락 결과 동일.
- `node scripts/hani-one-pass-release.mjs --self-test`: adapter 실행 **6항목 PASS**. nested build는 실제 CLI로 각각 생성한 두 패키지를 재사용. 독립 두 build의 package SHA `bf58a0874eea4b8e034d4b5711717b08e9ea62e8e6e3efd66b63951c0e663286` 동일, 111파일/18,751,943B. 이 self-test를 실제 PR Candidate preflight로 해석하지 않음.
- `node scripts/hani-gate-capacity-test.mjs` 및 실제 baseline package 인자 실행: adapter PASS. 기존 contract `2.0.9`, 한도128파일/25,000,000B/단일5,000,000B 및 hash/인증/서버 parity 보존.
- `node scripts/hani-release-preqa.mjs --self-test`: PASS.
- `node scripts/hani-release-flow.mjs --self-test`: 15/15 PASS.
- `node scripts/hani-one-pass-protected-surface.test.mjs`: PASS.
- `node scripts/hani-protected-write-contract.test.mjs`: 부정19 및 Node/server contract parity PASS.
- `node scripts/hani-ci-scope.mjs --self-test`: 13/13 PASS.
- `node scripts/hani-release-package.mjs verify --input <baseline-package>` 및 `<PWA-package>`: 각각 111/115파일 PASS.
- `git -c core.whitespace=cr-at-eol diff --check`: PASS. Node 파일 LF, bridge 기존 CRLF 보존. 기본 `git diff --check`는 bridge 추가 줄의 CR을 whitespace로 판단하므로 위 옵션을 사용.
- **기존 검사 문제 1:** `node scripts/hani-protected-gate-integration.test.mjs`는 native EPERM, adapter에서도 과거 고정 base `90b7440`에 현재 `hani-ai-budget.css`가 없어 중단. 실제 `git cat-file -e 90b7440:hani-ai-budget.css`도 누락 확인. 검사/과거 원문을 임의 보정하지 않음.
- **기존 검사 문제 2:** `node scripts/hani-deploy-package-intake-test.mjs <baseline-package>`는 마지막 총량 overflow fixture에서 첫 이미지에 남은 용량을 모두 추가하여 단일 파일5MB를 넘기므로 line65 `grown <= max_single_file_bytes` 실패. 앞선 정상 intake/tamper/파일수/단일파일 차단 assertion은 실행됨. 이 fixture는 수정하지 않음.

### PWA 결합 검증 및 원복

- 대상 local branch `hani/pwa-213@368e80e0afcc2e1edd1e01a907ce3629547fe4f0`.
- 요청된 `git merge --no-commit --no-ff hani/pwa-213`은 외부 Git 관리 경로 `ORIG_HEAD.lock` 권한 거부로 실행되지 못함. main/branch/ref 변경 없음.
- 대체로 `git merge-tree --write-tree HEAD hani/pwa-213`을 실행하되 `GIT_OBJECT_DIRECTORY`는 작업 폴더 안의 임시 디렉터리, 원래 objects는 읽기 전용 alternate로 사용. **commit 없이 실제 Git 결합 tree** `6897a9187597a62db1351ac668e439777fdf35fa`를 생성. 충돌 없음. PWA 변경11파일만 작업 폴더에 임시 반영.
- **중요:** 원래 명령 `node scripts/hani-release-package.mjs build --base origin/main --candidate HEAD --output tmp.json`의 HEAD는 커밋된 원문만 읽음. 일반 `--no-commit` merge 중에도 HEAD는 이전 commit이므로 그 명령 성공만으로 PWA를 검증했다고 볼 수 없음. HEAD 입력은 baseline111파일 build PASS.
- PWA 증명은 같은 CLI의 `--candidate 6897a9187597a62db1351ac668e439777fdf35fa --output tmp.json`에 실제 결합 tree 원문을 공급한 adapter 실행으로 수행: **build PASS, 115파일, 18,853,359B, 누락0**, package SHA `f7c2efbf3efdb2d2b64898678cb9afa179540adb7944907cf2b32c165458b83b`. 이어 `node scripts/hani-release-package.mjs verify --input tmp.json`도 PASS. 이 tree SHA를 릴리스용 frozen commit identity로 사용하면 안 됨.
- 기존 walker로 정확히 `192x192`, `512x512`, `any`, `HANI OS`, `image/png`, `ko`, `maskable`, `standalone` 누락8개 재현. 수정 후 누락0 및 Node/bridge closure115파일 일치. manifest 참조는 PNG3개뿐.
- 임시 `node scripts/hani-pwa-213.test.mjs --static`: 4그룹 PASS. 실제 UI/설치 검증 없음.
- 원복: index.html·두 CSS는 HEAD archive 원문과 byte equality 확인, 새 PWA 파일8개·검사 산출물·tmp.json 제거. HEAD/base/branch 불변. 최종 tracked diff는 closure 두 파일 및 package self-test뿐.

### 남은 릴리스 경계

- **PWA package build는 통과하지만 전체 릴리스는 아직 차단:** 현재 `one-pass-gate-contract.json` 및 client/server release 경로에 `manifest.webmanifest` 허용이 없음. 실제 `evaluatePackage`의 `runtime_closure` PASS / `release_paths` BLOCKED, PWA package intake도 같은 경로 거절 확인. 범위를 넓혀 allowlist·계약·hash를 바꾸지 않음. 배포 담당이 별도 승인 범위로 해결해야 함.
- PWA 표시 v212는 요청대로 유지하여 `version_forward` BLOCKED. 릴리스 열차에서 한 번 증가할 항목.
- 기존 HTML `<link rel=icon>` 제외 규칙을 보존하여 Apple180 touch icon은 closure에 포함되지 않음. PNG3개는 포함. Apple 아이콘 포함은 별도 보완 범위이며 이번 fix가 해결했다고 보고하지 않음.
- 데이터·`hani_os_life_v23` 쓰기·Cloud·schema·migration·auth·계약·한도 변경 없음. 운영 UI/캐시/버전 변경 없음.
- UI Preview·실제 Deno/배포 bridge·독립 HINA·PR/Pages/Production read-back 미검증. 개발용 검사 통과가 배포 승인이 아님.

## 다음 담당에게

- **보호 gate PR이므로 대표님의 `hani-gate-change-approved` label 필수.** 이번 개발 요청을 라벨 부여나 main 병합 승인으로 대신하지 않음.
- 순서: **closure PR → bridge deploy → PWA 파일 seed PR → release**.
- 다음 행동: 변경3파일/검사 및 아래 남은 경계를 검토하고, 대표님 요청 시 commit/보호 gate PR을 준비. 현재 명시적 커밋 금지를 유지함.
- Bridge 배포는 대표님이 아래 명령으로 실행:

```powershell
supabase functions deploy hani-deploy-bridge --project-ref qmgikfdwjzmhkwadycxk --use-api --no-verify-jwt
```

- 배포 후 서버 closure가 새 판정 로직인지 확인하고 PWA seed/release를 진행. 로컬 스크립트 수정만으로 이미 배포된 bridge가 바뀌지 않음.
- 승인 대기/미검증: PR 라벨, main 병합, 실제 bridge 배포, Preview/서버 HINA/Pages/Production read-back.
- CURRENT/DECISIONS: 다른 담당 기록 변경 없음. 이 작업 인수인계에 근거 보존.

## 2026-10-16 후속 · PWA 허용 경로와 기존 게이트 실패 수정

### 작업 식별·승인·현재 상태

- 담당: 도연(Codex), 단일 개발 Agent. Risk: CRITICAL(릴리스 검사/접수 경로). 위 기록은 이전 실행 이력이며 아래가 후속 결과다.
- 실제 branch/worktree: `hani/closure-manifest-214` / `cl214`. 시작·종료 HEAD 모두 `b449d48ed6cf15b8ba53ce9a3eac3177a915ee1b`.
- 대표님 승인: origin/main 병합, main 계약 2.0.9/25MB 파일 보존, manifest/PWA 경로 및 기존 실패 2건 수정, 지정 검사와 PWA 임시 병합/build/원복. **새 커밋·버전 증가 금지 유지.** push·PR·서버 배포·main 반영 없음.
- 확인 main: `ed65047c0bac75de37634f72b60955bff7978920`(PR #275). GitHub `GET git/ref/heads/main`과 local origin/main 일치 확인. main index/JS는 v2.9.213, 원래 cl214의 v2.9.212를 임의 증가시키지 않음. 운영 화면 read-back은 미실행.
- **원래 cl214의 main 병합은 환경 차단으로 미완료.** `git fetch origin`은 외부 Git 관리 경로의 `FETCH_HEAD`, `git merge --no-commit origin/main`은 `ORIG_HEAD.lock` 쓰기 권한 거부. Git 관리 경로는 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/cl214`, 허용 쓰기 범위는 cl214 내부뿐이다. 승인 요청/우회·원래 `.git` 포인터 변경 없음.
- 원본을 훼손하지 않고 허용 범위 안의 `artifacts/closure-manifest-214/followup-work`에 shared clone을 만들고, 원본의 **refs/remotes/origin/main**을 명시적으로 가져와 최신 main을 실제 `git merge --no-commit --no-ff origin/main`로 검증했다. 충돌 없음, main 결합 index tree `6608bea0f57f2ca56ced7bae829c49dc06edc099`. 임시 clone의 병합 성공을 원래 worktree의 병합 완료로 보고하지 않는다.
- CODEMAP release-center owner/의존 경로 확인, 세부 허용 경로·테스트 anchor는 실제 함수에서 확인. 다른 담당 파일을 root에 병합/덮어쓰지 않고 요청 범위 패치만 남김.

### 변경 내용

- `scripts/hani-one-pass-rules.mjs`, `supabase/functions/hani-deploy-bridge/index.ts`의 `isAllowedReleasePath`, `hani-main.js`의 `deployPackagePathAllowed`: 정확한 루트 `manifest.webmanifest`를 허용. `assets/pwa/*.png`는 기존 assets 이미지 allowlist가 이미 허용하므로 중복 또는 광범위한 확장자 규칙을 추가하지 않음. 클라이언트 수정은 기존 canonical 접수 함수 1줄뿐이며 이벤트/renderer 추가 없음.
- main의 `dev-center/one-pass-gate-contract.json` **바이트 그대로**, contract `2.0.9`, 128파일/25,000,000B/단일5,000,000B 및 hash `54e6143a92443084d77353a23c19a1996c4ade60ae2f19a80b1d9d5e23160520` 유지. bridge의 계약 상수·hash·인증·한도 변경 없음. 고정 계약 JSON을 변경하지 않도록 manifest의 최소 허용은 세 실행 경로의 코드에 동일 적용했다.
- `scripts/hani-protected-gate-integration.test.mjs`: 과거 base `90b7440`에 최신 candidate 파일 목록을 요구하던 fixture 오류 수정. 과거 HTML에서 **그 base 자신의 JS/CSS 목록**을 읽어 실제 과거 원문으로 비교. 누락 파일을 빈 문자열로 대체하거나 보호 assertion을 완화하지 않음.
- 위 테스트의 다음 실제 실패도 코드에서 수정: `protectedStorageCounts`가 `localStorage.getItem(...)` 반환값까지 storage alias로 전파해 무관한 `clear()` 75건을 집계하던 오탐. 직접 storage 객체 대입만 alias로 수집하도록 최소 수정. 실제 storage write/remove/clear·Cloud 로직은 변경하지 않음.
- `scripts/hani-one-pass-protected-surface.test.mjs`: 직접/연쇄 alias·개행 대입 탐지 유지, dot/bracket getItem 결과 및 그 결과의 clear/setItem 오탐 회귀 추가. 기존 부정/보호 assertion 유지.
- `scripts/hani-deploy-package-intake-test.mjs`: 총량 overflow를 이미지 여러 개와 필요 시 추가 허용 이미지로 분배. 정확히 **25,000,001B**를 구성하고 모든 파일이 단일 한도 이하임을 먼저 검증. 파일수·단일파일·변조 거부 assertion 유지.
- 신규 `scripts/hani-pwa-release-paths.test.mjs`: Node/배포센터/bridge 경로 판정, 다른 manifest·잘못된 확장자/경로 거부, Node/bridge recursive closure 동일성, 실제 아이콘 누락 차단 회귀.
- 기존 b449d48의 closure Node/bridge 복사본은 그대로 재사용, 양쪽 동일성/실행 parity 재검증. 저장·보호 key/내부 버전·Cloud write/schema·migration·auth 변경 없음.

### 검증 결과와 증거

- 실행 환경: Windows PowerShell, 번들 Node `v24.19.0` 및 Git. **이번 실행은 native CLI/실제 Git 객체 사용, 이전 read-only adapter/replayed subprocess 사용 없음.**
- [후속 전체 결과](../../../artifacts/closure-manifest-214/followup-status.json), [PWA 판정](../../../artifacts/closure-manifest-214/followup-pwa-evaluation.json), 개별 `followup-*.log`에 보존. main/PWA 결합 검사는 위 임시 clone에서 실행, 원래 branch HEAD를 바꾸지 않음.

| 요청 항목 / 관련 검사 | 결과 |
|---|---|
| `node scripts/hani-release-package.mjs test` | PASS: Node/bridge closure parity·manifest metadata·실제 누락 차단 |
| `node scripts/hani-gate-capacity-test.mjs` | PASS: 계약/hash/서버·인증 및 128/129, 25MB/+1, 단일5MB 경계 |
| `node scripts/hani-one-pass-release.mjs --self-test` | PASS: 6항목, 실제 nested package build 2회·결정적 hash |
| `node scripts/hani-protected-gate-integration.test.mjs` | PASS: 기존 실패 해소, 실제 local/server 경로 12항목 |
| `node scripts/hani-deploy-package-intake-test.mjs <PWA-package>` | PASS: 정상 binary 접수·변조·파일수·단일/총량 거부 |
| `node scripts/hani-pwa-release-paths.test.mjs` | PASS: 세 경로 판정·두 closure·누락 아이콘 거부 |
| `node scripts/hani-one-pass-protected-surface.test.mjs` | PASS: 기존 탐지 유지·alias 오탐 회귀 |
| `node scripts/hani-release-preqa.mjs --self-test` | PASS |
| `node scripts/hani-release-flow.mjs --self-test` | PASS: 15/15 |
| `node scripts/hani-protected-write-contract.test.mjs` | PASS: 부정19·Node/server contract parity |
| `node scripts/hani-ci-scope.mjs --self-test` | PASS: 13/13 |
| 변경 JS/TS 7파일 syntax, `git -c core.whitespace=cr-at-eol diff --check` | PASS |

### 실제 PWA 임시 병합·dry build·원복

- main 결합 검사 후 임시 clone의 변경을 알려진 경로만 복구하고 main merge를 abort. 임시 clone을 `origin/main@ed65047`에 detached checkout한 뒤 **실제** `git merge --no-commit --no-ff origin/hani/pwa-213` 수행.
- PWA branch `368e80e0afcc2e1edd1e01a907ce3629547fe4f0`. `index.html` head 블록 충돌 1건: PWA manifest/theme/apple meta와 touch icon 유지, main의 budget CSS cache **v2.9.213 유지**. 다른 기능 변경/버전 증가 없음. cl214 closure fix 및 이번 최소 패치를 overlay한 index를 `git write-tree`로 snapshot.
- tree `4fddd4d388d6eb97e29ca0e1924ade43891c4057`; 새 commit을 만들지 않은 개발 검증용 tree이며 릴리스용 frozen commit이 아니다.
- `node scripts/hani-release-package.mjs build --base origin/main --candidate 4fddd4d388d6eb97e29ca0e1924ade43891c4057 --output <PWA-package>` **PASS**. no-commit merge의 HEAD는 PWA를 포함하지 않으므로, 이전 HEAD를 검증한 결과로 대신하지 않음.
- **117파일 / 18,886,844B**, package SHA `34746ba40172af38481d408232295937fd0df827cbe55f3e4ee29ddd92a57f0f`. manifest 및 PNG3개 포함, 누락0. `verify`, 실제 PWA package capacity/intake, PWA tree 지정 closure test, PWA 상태 protected integration 및 `hani-pwa-213.test.mjs --static` 4그룹 **모두 PASS**.
- 실제 package의 `evaluatePackage` 개발 same-version 모드(`baselineOnly:true`)는 자동15항목 PASS, `pc_mobile_smoke` MANUAL. **일반 릴리스 모드도 별도 실행하여 `version_forward`만 BLOCKED 확인**(v213→v213). 버전 증가 금지 요청 때문에 정상 유지되는 차단이며, runtime 후보를 tooling-only로 배포하거나 release gate를 우회한 것이 아니다. self-test의 frozen fixture 판정 역시 실제 릴리스 freeze 증거로 사용하지 않는다.
- 기존 `<link rel=icon>`/apple-touch-icon 제외 규칙은 이번 범위에서 유지. Apple touch PNG는 package closure에 포함되지 않으며, 이 기존 경계를 해결했다고 주장하지 않음.
- 임시 PWA merge **abort/원복 PASS**: 임시 clone HEAD `ed65047`, tracked clean, manifest 없음. 원래 cl214 HEAD `b449d48`·branch 유지, merge 진행 상태 없음, PWA 파일 없음. 임시 clone/큰 package 정리 명령은 자동 승인 검토가 `blocked by policy`로 거절하여 실행되지 않음. `artifacts/closure-manifest-214/followup-work`와 `followup-pwa-package.json` 및 검증 도구·로그는 로컬에 남음. 삭제 거절을 우회하지 않음.

### 다음 담당에게 / 미검증·차단

- **필수 다음 단계:** 외부 Git 관리 경로에 쓸 수 있는 정상 환경에서 원래 cl214에 `git merge origin/main`을 완료한 뒤 현재 미커밋 패치를 보존·검토해야 한다. 현재 root 변경6파일 + 신규 회귀1파일 + 이 인수인계이며, 다른 main 기능 파일은 root에 임의 이식하지 않았다.
- 이번 요청의 개발 검사와 dry build는 통과. 실제 frozen runtime 릴리스 전체 PASS/배포 완료는 아니다. 버전/cache 증가는 배포 담당 열차 후보에서 1회 진행하고, 승인·최종 Candidate/서버 HINA·실제 Preview·Pages/Production read-back은 기존 절차를 유지한다.
- 보호 gate 승인 label `hani-gate-change-approved`, 실제 bridge 배포는 별도 필요. 기존 순서 **closure/allow-path fix 반영 → bridge deploy/read-back → PWA seed/release** 유지. 테스트 성공을 배포 승인으로 바꾸지 않음.
- Browser Preview·Android 설치·실제 Deno/서버 HINA·운영 Cloud/Pages/read-back 미실행. UI event·storage writer를 변경한 작업은 아니며 이 검증을 수행했다고 보고하지 않음.
- Notion은 현황판 읽기 성공. 후속 계획 append는 **자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절**하여 갱신 대기. 위 변경·PASS·원래 main merge 권한 차단·정상 version gate/미검증을 Notion에 기록해야 함. 저장/읽기 확인 없는 갱신 완료 주장 없음.
- CURRENT/DECISIONS 및 다른 담당 인수인계는 변경하지 않음. 이 파일에 후속 근거를 추가함.
