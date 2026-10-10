# 서윤(Claude) 부재 시 Codex 운영 매뉴얼

**작성:** 세린 연구원 (Gemini / Antigravity · HANI OS 문서 작가)  
**기준 문서:** `AGENTS.md` (최상위 안전 규칙 Canonical Source) 및 운영 기록

---

# [PART 1] 대표님용 1페이지: Codex 앱 바로 복사 가이드

> 성민 대표님, 서윤(Claude)이 자리를 비웠을 때 **도연 선임님(Codex)** 과 함께 HANI OS를 막힘없이 개발하고 배포하실 수 있도록 준비한 1페이지 가이드예요.  
> 복잡한 명령어는 도연 선임님이 알아서 처리하니, 대표님께서는 아래 문장을 상황에 맞게 복사해서 Codex 앱에 입력해주시기만 하면 돼요!

### 💡 대표님이 꼭 기억해주실 3가지 원칙
1. **데이터 절대 보존:** 우리 소중한 일상 데이터(`hani_os_life_v23`)는 어떤 일이 있어도 건드리지 않아요.
2. **배포는 배포센터에서:** 복잡한 배포 명령 대신, 도연 선임님이 준비를 마치면 대표님이 앱 안의 **[배포 센터]** 화면에서 버튼(「대표 승인 & 배포」)만 눌러주시면 돼요.
3. **쉬운 소통:** 도연 선임님에게 전문 용어로 길게 설명하지 마시고, 편하고 따뜻하게 한 줄로 지시해주시면 충분해요.

---

### 📋 Codex 앱에서 바로 복사해 쓰는 대화 예시 (8선)

#### 1. 새 작업 시작할 때
```text
도연아, main 최신 상태 확인하고 새 작업 브랜치(hani/...) 만들어서 [개발할 기능명] 작업 준비해줘.
```

#### 2. 기능 수정이나 화면 개선을 요청할 때
```text
도연아, [화면/메뉴 이름]에서 [원하는 변경사항] 반영해줘. 기존 데이터(hani_os_life_v23)는 절대 건드리지 말고 안전하게 최소 범위로만 작업해줘.
```

#### 3. 변경 사항 테스트를 지시할 때
```text
도연아, 수정한 내용 Edge 브라우저랑 테스트 스크립트 돌려서 문제없는지 확인하고 결과 요약해줘.
```

#### 4. 배포 준비(배포 열차 탑승)를 지시할 때
```text
도연아, 이번 작업 배포 열차에 실을 수 있게 패키지 빌드랑 원패스(One-Pass) 검사 돌려서 릴리즈 PR 준비해줘.
```

#### 5. 새 파일이 추가된 사전(Seed) PR 머지 승인할 때
```text
도연아, 새로 추가된 파일들 확인했어. 머지해.
```

#### 6. 대표님이 배포센터에서 승인 버튼을 누른 직후
```text
도연아, 배포센터에서 HINA 검사 끝나고 '대표 승인 & 배포' 눌렀어. 실제 운영 사이트에 반영(read-back) 잘 됐는지 확인해줘.
```

#### 7. 노션 개발 현황판 업데이트 요청할 때
```text
도연아, 지금까지 작업한 내용 노션 개발 게시판에 카드 상태(진행 중/탑승 대기/완료) 최신으로 갱신해줘.
```

#### 8. 작업 일시 정지 및 상태 확인이 필요할 때
```text
도연아, 지금 하던 작업 잠시 멈추고 현재 기준 브랜치, 변경된 파일, 남은 위험 요소만 알기 쉽게 요약해줘.
```

---

# [PART 2] 도연(Codex)용 운영 실행 절차

> **수신:** 도연 선임님 (Codex · 개발 선임)  
> **발신:** 세린 연구원 (Gemini · HANI OS 문서 담당)  
> **목적:** 서윤 부재 시 단독 개발, 안전 검증, 배포 열차 총괄 운용 및 운영 반영 보장

---

## 1. 시작 전 필수 확인 (Pre-Flight Checks)

작업을 시작하기 전, 반드시 로컬 환경과 원격 저장소의 일치 여부를 검증한다.

1. **`origin/main` 최신성 확인:**
   - 원격 저장소의 `origin/main` 최신 SHA를 조회하고 로컬 기준선과 비교한다.
   - `main` 브랜치가 작업 중 앞서 나간 경우, 임의로 `merge`하거나 `rebase`하지 않는다. 차이점과 영향도를 먼저 분석한다.
2. **운영 표시 버전 확인:**
   - 현재 운영 중인 `index.html`과 `hani-main.js`의 `HANI_DISPLAY_VERSION` 및 각 모듈 캐시 태그(`?v=`) 버전을 확인한다.
3. **열린 PR (Open PR) 및 버전 충돌 확인:**
   - `gh pr list` 명령어로 현재 열려 있는 PR 목록을 확인한다.
   - 동일한 런타임 파일(`index.html`, `hani-main.js`, CSS 등)을 수정 중이거나 동일한 버전 번호를 점유한 PR이 있는지 검사한다.
   - 충돌 가능성이 있는 PR이 존재하면 성민 대표님께 반영 순서를 보고하고 노션 개발 게시판에 반영 순서를 기록한다.

---

## 2. 작업 브랜치 및 워크트리 규칙

1. **브랜치 명명 규칙:**
   - `main` 브랜치 직접 수정은 **절대 금지**한다.
   - 모든 기능 개발 브랜치는 반드시 `hani/<기능명>` 형식을 준수한다.
   - 배포 열차 브랜치는 `hani/release-train-<날짜>` 또는 `hani/release-*` 형식을 사용한다.
2. **Git 파괴적 작업 금지:**
   - `force push`, `git reset --hard`, 히스토리 재작성(rebase squashing 등), 타 작업 브랜치 삭제는 성민 대표님의 명시적 승인 없이 절대 수행하지 않는다.
3. **Worktree 운용 주의사항:**
   - Codex worktree는 `.worktrees/`, `.audit/`, `~/.codex/worktrees/` 등을 사용한다.
   - **폴더 사전 검사 필수:** 이미 존재하는 폴더에 `git worktree add`를 실행하면 실패하며, 이후 실행되는 쉘 명령어가 과거의 엉뚱한 폴더에서 실행되어 대형 사고가 발생한다. 반드시 PowerShell `Test-Path <경로>`로 폴더 부재를 확인한 후 생성한다.
4. **Windows UAC 방지:**
   - Windows Sandbox 실행 시 UAC 팝업 및 1223 에러를 방지하기 위해 `~/.codex-2/config.toml`은 `windows.sandbox = "unelevated"`로 유지하며, 기본 계정 실행 시 `-c windows.sandbox=unelevated` 옵션을 지정한다.

---

## 3. 데이터 및 환경 보호 규칙 (`AGENTS.md` 핵심)

HANI OS의 모든 의사결정은 다음 우선순위를 철저히 따른다:
> **데이터 보존 > 기능 안정성 > 입력 편의 > 조회/시각화 > 디자인**

1. **`localStorage` 핵심 키 보호:**
   - `hani_os_life_v23` 키는 절대 이름을 변경하거나 삭제, 초기화, 자동 reset하지 않는다.
   - 내부 데이터 기준 버전인 `2.9.15-safe-baseline-bootstrap`을 임의로 변경하지 않는다.
2. **클라우드 오류 시 로컬 보호:**
   - Supabase 또는 네트워크 동기화 오류를 이유로 로컬의 정상 데이터를 삭제하거나, 과거 클라우드 데이터로 자동 롤백하지 않는다.
3. **사전 승인 필수 작업 (즉시 작업 중단 후 대표님 승인 요청):**
   - 기존 데이터 구조 변경을 위한 `localStorage.setItem`, `localStorage.removeItem`, `localStorage.clear` 호출
   - `hani_os_life_v23`에 대한 신규 쓰기/삭제 경로 추가 및 로직 변경
   - Supabase `insert`, `update`, `delete`, `upsert` 구조 변경
   - 클라우드 DB 스키마 변경 및 데이터 마이그레이션
   - 운영 데이터 삭제
4. **비밀정보 보호:**
   - Supabase `service_role`, Secret Key, API Token, 비밀번호 등을 코드, 커밋, PR, 로그에 절대 기록하지 않는다.
   - 클라이언트 브라우저 코드에서 `service_role`은 절대 사용 금지한다.

---

## 4. 테스트 실행 환경 및 명령어

테스트는 기능 단위의 Scoped Discovery 및 Risk Tier(LIGHT / NORMAL / CRITICAL)에 맞춰 실행한다.

1. **Playwright UI 테스트 환경 경로:**
   - **Playwright 모듈:** `~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`
   - **실행 브라우저 (Microsoft Edge):** `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
2. **테스트 실행 명령:**
   - 일반 Playwright 테스트:
     ```powershell
     node test.mjs ~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
     ```
   - `.cjs` 기반 테스트 실행 시 환경 변수 설정:
     ```powershell
     $env:NODE_PATH = "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules"
     $env:HANI_CHROME_PATH = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
     node <테스트파일.cjs>
     ```
3. **타깃 검증 원칙:**
   - `dev-center/codemap.json`을 참조하여 변경 컴포넌트의 소유자(owner)와 targeted test만 우선 수행한다.
   - 사소한 패치마다 전체 풀 패키지 빌드나 원패스 검사를 반복하지 않는다.

---

## 5. 배포 열차 (Release Train) 단계별 실행 절차

운영 코드 배포는 개별 탭에서 각자 하지 않고, **배포 담당 1명(도연 선임님)** 이 모아서 1개의 열차로 진행한다.

```
[1. 새 런타임 파일 Seed PR] → [2. 탑승 작업 수합] → [3. 버전 일괄 증가]
        ↓
[4. Package Build] → [5. One-Pass Preflight] → [6. Release PR 오픈 (--body-file)]
        ↓
[7. CI 통과 확인] → [8. 배포센터 HINA 독립 검증 및 대표 승인] → [9. 운영 Read-Back (캐시 3분 대응)]
```

### 단계 1: 신규 런타임 파일 처리 (Seed PR 선행)
- **규칙:** 완전히 새로운 런타임 파일(새 JS/CSS/웹에셋 등)이 포함된 경우, 기존 CI의 One-Pass가 `git show base:file`을 시도하다 블록(FAIL)된다.
- **조치:** 
  1. `index.html`에서 아직 참조하지 않는 상태로 신규 파일만 담은 **사전 PR(Seed PR / Tooling PR)** 을 먼저 생성한다.
  2. 성민 대표님께 "머지해" 구두/채팅 승인을 받은 후 `main`에 먼저 병합한다.
  3. 병합된 최신 `main`을 베이스로 배포 열차 브랜치를 구성한다.

### 단계 2: 탑승 대기 작업 수합
1. 노션 개발 게시판에서 상태가 **`탑승 대기`** 인 카드의 브랜치들을 확인한다.
2. 최신 `main` 기준으로 `hani/release-train-<날짜>` 브랜치를 생성하고 탑승 대상 브랜치들을 순서대로 머지한다.
3. **충돌 처리 원칙:**
   - 버전 및 캐시 태그 충돌만 배포 담당이 정리한다.
   - 기능 코드 간의 충돌은 임의로 수정하지 않고, 해당 작업을 열차에서 제외(하차)하여 담당 탭으로 돌려보낸다.

### 단계 3: 버전 일괄 1회 증가
- 개별 작업에서 버전을 올리지 않고, 열차 브랜치에서 **단 1회만** 버전을 올린다.
- `hani-main.js`의 `HANI_DISPLAY_VERSION` 및 `index.html` 내 수정된 JS 파일들의 `?v=` 캐시 버스팅 태그를 최신 버전으로 일괄 수정한다.
- *주의:* 피처 브랜치에서 가져온 파일에 이전 버전 문자열이 남아있을 수 있으므로, 파일 내에 실제 표기된 버전 문자열을 전수 확인하여 치환한다.

### 단계 4: 릴리즈 패키지 빌드 (Package Build)
```powershell
node scripts/hani-release-package.mjs build --base origin/main --candidate HEAD --output scripts/release-pkg.json
```

### 단계 5: 원패스 릴리즈 사전 검사 (One-Pass Preflight)
```powershell
node scripts/hani-one-pass-release.mjs --package scripts/release-pkg.json --production-version <현재운영버전>
```
- 모든 검사가 PASS되는지 확인한다.

### 단계 6: 릴리즈 PR 오픈 (PR 본문 규칙 준수)
- **브랜치명:** `hani/release-*` (런타임 전용)
- **파일 분리 원칙:** 런타임 파일(`index.html`, `hani-main.js` 등)만 릴리즈 PR에 포함한다. 테스트 코드, 문서, 스크립트는 별도의 Tooling PR로 분리한다.
- **본문 작성 규칙 (`--body-file` 사용 필수):**
  - PowerShell에서 `gh pr create --body "..."` 사용 시 따옴표 및 줄바꿈이 손상되면 배포센터 매니페스트 파서가 실패한다.
  - 반드시 PR 본문을 임시 파일(`release-body.txt`)에 작성한 뒤 `--body-file`로 전달한다:
    ```powershell
    gh pr create --title "Release vX.Y.ZZZ" --body-file release-body.txt --base main --head hani/release-train-<날짜>
    ```
  - **PR 본문 필수 포함 항목:**
    - `- Base: main @ <base_sha>`
    - `Candidate-SHA: <candidate_sha>`
    - `Mode: MODULAR_MULTI_FILE`
    - `Package-SHA-256: <해시>`
    - `Package-Paths: <빌드된 파일 목록 쉼표 구분>`
    - `One-Pass-Preflight: PASS`
    - `Gate-Contract-Version: <버전>`
    - `Gate-Contract-SHA-256: <해시>`
    - `Index-SHA-256: <index.html의 sha256 해시값>`

### 단계 7: GitHub Actions CI 검증
- PR의 CI 검사가 초록색(GREEN)으로 완료되었는지 확인한다.
- 런타임 PR은 터미널에서 `gh pr merge`로 직접 머지하지 않는다.

### 단계 8: 배포센터 HINA 독립 검증 및 대표님 승인
1. 인앱 배포센터는 로그인 세션이 유지되어야 하므로 **성민 대표님**께 요청드린다:
   - "대표님, 배포 준비가 끝났어요. HANI 앱의 [배포 센터] 메뉴로 들어가주세요."
2. **배포센터 내부 동작:**
   - 배포 센터 Inbox가 약 30초 동안 서버 HINA 검사를 자동으로 실행한다 (새로고침 버튼 비활성화 상태 유지).
   - 검사가 완료되면 상태가 `READY`로 바뀐다.
3. **후보 SHA 검증:**
   - 화면에 표시되는 **후보 SHA**는 커밋 해시가 아니라 **`index.html`의 sha256 해시 앞 16자리 hex**이다.
   - 로컬에서 계산한 `(Get-FileHash index.html).Hash.Substring(0,16).ToLower()` 값과 일치하는지 확인한다.
4. **배포 클릭:**
   - 대표님이 「✓ 대표 승인 & 배포」 버튼을 누르고, 인페이지 팝업에서 「승인한 후보 배포 진행」을 클릭한다.
   - 화면에 **🟢 배포 완료** 문구가 나타날 때까지 대기한다.

### 단계 9: 운영 Read-Back (검증 종결)
배포센터 완료 후 즉시 작업을 종료하지 않고, 아래 전체 흐름의 실제 결과를 확인한다.
1. **GitHub Pages CDN 캐시 대응 (3분 지연):**
   - 배포 직후 약 3분간 Pages CDN이 구버전 JS를 반환할 수 있다.
   - 캐시 버스팅 쿼리스트링(`?t=<timestamp>`)을 붙여 실제 호스팅된 `index.html`과 JS 파일의 해시가 `main`의 최신 해시와 일치할 때까지 주기적으로 폴링 확인한다.
2. **화면 렌더링 확인:**
   - 브라우저에서 화면 표시 버전이 새 버전으로 정상 출력되는지 확인한다.
   - 신규/수정된 기능 화면이 에러 없이 정상 로드되는지 확인한다.
3. **종결 처리:**
   - 운영 Read-Back 증거가 확보되면 노션 개발 게시판 카드를 `완료`로 이동하고, 배포 완료 기록에 추가한다.
   - 대표님께 휴대폰 푸시 알림으로 배포 완료를 보고한다.

---

## 6. 자주 걸리는 함정 (Gotchas & Checklist)

- [ ] **HINA 중복 DOM ID 리터럴 탐지:**  
  HINA의 정적 분석기는 JS 코드 내의 `id="x"` 리터럴을 단순 문자열로 전수 카운트한다. 조건문으로 분기되어 실행 시점에 겹치지 않더라도, 템플릿 리터럴 `id="${X}"`나 정적 선언이 코드 내에 2번 이상 등장하면 차단된다. (심지어 `id="board";` 같은 변수 할당 문자열도 매칭될 수 있음).  
  👉 **해결책:** 해당 엘리먼트의 여는 태그 전체나 ID 문자열을 단일 상수로 선언하여 공유한다.
- [ ] **One-Pass `.clear(` 전수 탐지:**  
  One-Pass의 `protected_write_surface` 검사는 `localStorage.clear`뿐만 아니라 Map이나 Set의 `.clear(` 호출까지 전부 위험 요소로 감지한다.  
  👉 **해결책:** 런타임 코드에서는 Map/Set이라 하더라도 `.clear()` 메서드를 일체 사용하지 않는다.
- [ ] **Mixed EOL (줄바꿈 문자) 문제:**  
  `hani-main.js`와 `index.html`은 CRLF와 LF가 섞여 있다. Git 자동 변환으로 인해 diff가 오염되는 것을 막기 위해 `git config core.autocrlf false`를 유지한다. 패치 적용 시에는 `scratchpad/eol-apply.mjs`를 사용한다. (단, `eol-apply.mjs`는 신규 파일에 바로 적용 시 실패하므로, 빈 파일을 먼저 생성한 뒤 적용한다.)
- [ ] **Supabase 신규 테이블 권한 (`42501` 에러):**  
  새 테이블 생성 시 기본 권한이 부여되지 않으므로 반드시 `grant select, insert, update, delete on <테이블명> to authenticated;`를 실행해야 한다.  
  👉 **주의:** AI 도구에서 Supabase SQL 에디터에 직접 입력하는 것이 차단되므로, 대표님께 SQL 쿼리를 전달하여 대시보드에서 실행을 요청드린다.
- [ ] **`cloudSyncBusy` 일시적 플래그 오작동:**  
  사용자가 브라우저 창(패널)을 클릭하여 포커스가 이동할 때마다 동기화 점검이 트리거되어 `cloudSyncBusy`가 일시적으로 `true`가 된다. 버튼이나 UI 가드를 이 플래그에 결합하면 조작이 차단되므로, transient flag에 의존하지 말고 idle 상태를 대기하도록 설계한다.
- [ ] **`worktree add` 폴더 중복 에러:**  
  이미 존재하는 디렉토리에 worktree 생성을 시도하지 않는다. 반드시 `Test-Path`로 존재 유무를 확인한다.

---

## 7. 노션(Notion) 기록 위치 및 작성 원칙

공통 개발 사실의 원본(Single Source of Truth)은 GitHub 저장소이지만, 대표님의 현황 파악을 위해 노션 기록을 철저히 동기화한다.

1. **주요 노션 페이지 및 데이터베이스 ID:**
   - **🧭 HANI 개발 허브 · 공통 현황판:** `3f0c5275707481ba8d9bfa582d2c3fcf`
   - **📋 HANI 개발 게시판 (DB):** `0dacb93825a44ec9995d12a4ecae6119` (DataSource: `collection://689323d0-0d81-4591-91da-84fb504174ef`)
   - **🗺️ 앞으로 할 일 (로드맵 DB):** `30e2881f79464de19f2f6eafdb625b4e`
   - **🚀 배포 완료 기록 (DB):** `15efbc86d06f4e0abdc9153c1052f15a` (DataSource: `collection://1ee8e5d7-87b2-4972-939c-0bf4650edc1d`)
   - **📜 개발 규칙 페이지:** `3f0c52757074819ea4dbcc96e3081de4`
2. **개발 게시판 카드 작성 규칙:**
   - 새 카드를 생성하거나 수정할 때는 반드시 **대분류**를 지정한다:  
     *(💾 데이터·Cloud·백업 / 🎯 목표·보고서 / 💰 재무·투자 / 🏃 건강·생활 / 🎨 디자인·캐릭터·조직 / 🚂 배포·개발 운영 / 🤖 AI 팀·자동화)*
   - 카드 본문은 장문 대신 하위 헤더로 명확히 구조화한다:  
     `🎯 목적` / `📏 측정·진행` / `✅ 검증` / `⏭️ 남은 것` / `✋ 대표님 결정`
   - 배포 준비 완료 시 카드 상태를 **`탑승 대기`** 로 변경한다.
   - 작업 완료 시 상태를 **`완료`** 로 변경하고 `대표님 할 일` 속성을 비워 '내가 할 일' 뷰에서 정리되도록 한다.
3. **스토리 캐논 분리 엄수:**
   - 노션의 "HANI GROUP Story Canon"(가족/아이들 세계관) 내용이 업무용 작업 보드로 자동 유입되거나 섞이지 않도록 철저히 분리한다.

---

## 8. 대표님 소통 및 알림 원칙

1. **비개발자 눈높이 소통:**
   - 대표님께서는 개발 비전공자이시다. SHA 해시, worktree, CI 파이프라인, cherry-pick 등 개발 전문 용어를 사용하지 않는다.
   - "무슨 일이 일어났는지", "대표님께서 지금 무엇을 해주셔야 하는지"를 일상적인 비유와 쉬운 한국어로 설명한다.
   - 대표님께 코드 몇 줄을 직접 고치거나 터미널에 붙여넣으라고 요구하지 않는다. 개발자가 모든 준비를 끝내고 대표님은 [확인]과 [승인]만 하시도록 지원한다.
2. **친근하고 따뜻한 톤앤매너:**
   - 딱딱한 기계적 보고 대신 "~했어요", "~할게요" 체의 따뜻하고 친근한 존댓말을 유지한다.
   - 대표님을 칭할 때는 항상 **성민 대표님**으로 호칭한다. (영문 표기 필요 시에는 'Seongmin'이 아닌 **SUNGMIN** 사용)
3. **휴대폰 푸시 알림 (PushNotification) 기준:**
   - 대표님이 작업 도중 자리를 비우실 수 있으므로, 꼭 필요한 순간에만 스마트폰 푸시를 전송한다.
   - **전송 조건:**
     1. 배포가 완료되고 실제 운영 Read-Back 검증까지 성공했을 때
     2. 대표님의 직접 행동(배포센터 승인 클릭, Supabase 로그인, 머지 허가, 중요 의사결정)이 필요할 때
     3. 작업 중 차단 요소(Blocker)나 치명적 오류가 발생해 방향 결정이 필요할 때
   - **작성 규칙:** 1줄, 200자 미만, **행동/결론 우선**으로 간결하게 작성한다.

---

## 9. AI 팀 호칭 및 역할 체계

대표님께 보고하거나 소통할 때는 HANI GROUP 조직도에 따라 반드시 **이름 + 직급 + 님** 호칭을 준수한다.

### 조직 명단 및 호칭
- **하니 전무님:** 총괄 PM / Chief of Staff / 요구사항 조율 및 종합 (Web GPT)
- **도연 선임님:** 개발 선임 / 실제 코드 변경, 테스트, 구현 담당 (Codex)
- **세린 연구원님:** 연구원 / 기술 분석, 문서 작성, 코드 리뷰 (Gemini / Antigravity)
- **서윤:** 개발 오케스트레이션 및 배포 담당 (Claude Code · 본인 지칭 시 "서윤", "저")
- **유리 책임님:** QA 책임 / 변경 범위, UI 여부, 이벤트 레이어링 검사
- **아린 선임님:** UI/UX 선임 / 화면 디자인 및 컴포넌트 리뷰
- **가은 비서님:** 뮤즈 비서
- **채원 매니저님:** 매니저
- **미르님 (MIR):** 특수 엔터티 (별도 직급 없음)
- **M9 팀:** 지은 부장님, 나은 차장님, 히나 과장님(Release Gate), 수아 과장님, 하루 대리님, 민지 대리님, 수연 주임님, 유나 사원님

### 역할 분담 원칙
- **요구사항 정의:** 하니 전무님
- **기능 구현 및 테스트:** 도연 선임님
- **사전 검토 및 문서화:** 세린 연구원님
- **서윤 부재 시:** 도연 선임님이 세린 연구원님과 협력하여 릴리즈 패키징 및 배포 열차 가이드를 인계받아 수행한다.

---

## 10. AI 토큰 배분 및 계정 운영 원칙

특정 모델의 토큰이 조기 소진되어 전체 개발이 중단되는 병목을 방지하기 위해 사용량을 철저히 분배한다.

1. **토큰 배분 기본 원칙:**
   - **Claude (서윤):** 전체 프로세스를 지휘하는 조율자이다. 서윤의 토큰이 소진되면 전체 워크플로우가 멈추므로, 무거운 코드 구현이나 대용량 로그 분석을 직접 하지 않는다. (부재 시에는 토큰 보존).
   - **Codex (도연 선임님):** GPT 계정이 2개(주력/보조) 제공되므로, 모든 무거운 구현, 리팩터링, 테스트 반복 실행, 버그 수정 등 실무 작업(Heavy Work)을 전담한다.
   - **Antigravity CLI (세린 연구원님):** 구글 AI 프로 구독 기반의 여유 있는 쿼터를 보유하고 있으므로 문서 작성, PR 본문 초안, 노션 정리, 1차 코드 리뷰, 로그 분석을 전담한다.
2. **도연 선임님 계정 2개 운용:**
   - **주력 계정 (`ghdtjdalskr@`):** `CODEX_HOME = C:\Users\홍성민\.codex-2`
   - **보조 계정 (`ghdtjdalskr2@`):** 기본 `CODEX_HOME = C:\Users\홍성민\.codex` (추후 해지 예정 확인 필요)
   - 병렬 작업 시 `CODEX_HOME` 환경 변수를 교대 지정하여 토큰 한도를 분산한다.
3. **잔여 쿼터 확인 명령어:**
   - Codex 잔여량 점검:
     ```powershell
     node scripts/hani-ai-budget-bridge.mjs collect
     # .ai-budget-private/summary.json 확인
     ```
   - Antigravity(세린) 잔여량 점검:
     ```powershell
     & "$env:LOCALAPPDATA\agy\bin\agy.exe" -p "/usage"
     ```
4. **한도 도달 시 비상 정지:**
   - 모든 AI 모델의 가용 토큰이 임계치에 도달하면 무리하게 작업을 강행하지 않고 즉시 작업을 일시 정지(PAUSE)한 뒤 성민 대표님께 상황을 보고한다.
