# ui237 UI 수정 인수인계

## 작업 식별

- 작업: 2026-10-31 UI 감사 후속 / 담당 도연(Codex), LIGHT, 개발 및 Node 검사만 승인.
- 상태: 구현·Node 검증 완료. 서윤 Edge 재촬영 대기. Candidate/배포 완료 아님.
- worktree: ui237 / branch `hani/ui-fix-after-236`.
- 요청 base: `dd0d880` (2.9.235). 실제 시작 HEAD 및 origin/main 캐시: `cefa62554e520c42acdc8310dd8f00f4dac0148a`.
- 차이: 미참조 이미지 `assets/milestone-cards/milestone-card-sheet-v2.webp` 추가 1건뿐. UI 소스 동일. merge/rebase 없이 현재 기준 유지.
- 원격 최신성: `git ls-remote origin refs/heads/main` 네트워크 연결 실패. 운영 화면 및 최신 JS 실제 로딩은 이번 범위에서 미검증. index 표시/cache 2.9.235, 마지막 script hani-launch-greeting.js.
- 범위: 기존 CSS의 공통 밝은 표면/글자색 경계, 기존 팀 초상화 크기, 모바일 표 CSS, 빈 차트 표면. 필요 시 기존 canvas 글자색 조회만 교정.
- 금지 범위: push/PR/main/배포/Notion, 버전/cache, 저장/Cloud 경로, 새 런타임 파일/JS layer/event/timer, hani-office-live.js/css.
- 근거: `../uiaudit236/uiaudit236-findings.md`, `../uiaudit236b/*.png`; investment/ledger/milestones/exercise는 `../uiaudit236/*.png` 재확인.
- 제외: ilbo 만화, aiWork 초상화 빈칸(촬영 시점 착시), aiWork 오래된 문구.

## 결과와 증거

### 공통 원인과 선택 근거

1. `hani-main.js:2242–2260`의 실제 `applySignatureFinish → updateFinishScope`가 root의 finish와 body의 `data-finish-active`를 설정한다. `hani-design-system.css:532–536`은 dark finish에서 `--text-primary/secondary`, `--text/--muted`, `--appearance-ink`, `--ds-ink`, `--ui-sub`를 밝은 값으로 연결한다.
2. 반면 `hani-style-01.css:337`의 자산 대시보드·지표·계좌는 흰색/파스텔 **background-image**를 가진다. 공통 `.card` 규칙(`hani-design-system.css:538`)은 background-color만 바꾸므로 그 위의 흰 그라데이션은 남는다. 계좌 기관명·번호의 `.sub`도 밝아진 `--muted`를 읽는다. 같은 유형의 흰 표면은 home 달력(`hani-style-01.css:319`), 월말 업데이트(`:926–934`), wishlist 집계·사유(`hani-style-07.css:225`), 배포 Inbox(`:20`), 개발 이력(`hani-development-history.css:2–8`)에 있다.
3. `688c6a4`는 표면/글자색을 함께 바꾸려 했지만 누락된 하위 표면이 있었다. `ef92639`는 자산 틴트를 의도적으로 복원하고 `.stat .label/.value`를 `var(--appearance-ink)`로 지정했다. dark finish에서 그 값은 밝은 잉크이므로 밝은 카드와 충돌한다. JISPI의 고정 남색 표면에 테마 잉크를 적용했던 것과 같은 **실제 표면과 잉크의 불일치**다.
4. 따라서 틴트를 다시 지우지 않고 `hani-design-system.css:633–649` **공통 밝은 표면 경계 한 곳**에서 표면·잉크와 compatibility alias를 함께 고정했다. 상위에서 이미 계산된 alias는 하위 `--text-primary`만 바꿔도 갱신되지 않으므로 `--text/--muted/--appearance-ink/--ds-ink/--ui-sub`도 같은 경계에서 다시 연결했다. 밝은 테마도 동일한 밝은 표면을 유지한다. 어두운 표면을 사용하는 settlementQuickCheck와 일반 account manager는 이 경계에서 제외했다.

### 개별 원인

- tasks: QA 1차 규칙이 `.pill` 글자만 어둠 테마 잉크로 강제하고 pill 배경은 연보라로 남겼다. 해당 강제 대상을 제거하고 task hub의 pill 배경·잉크를 함께 theme 표면으로 연결했다(`hani-design-system.css:1801–1804`).
- home 마지막 두 카드: `teamCard`가 실제 `<img data-development-portrait>`를 만들지만(`hani-main.js:4737,4760`), 기존 크기 제한은 `.is-planned-member`에만 적용됐다. 정식 입사한 다온·윤슬은 원본 이미지 크기가 grid 셀을 넘어 본문을 덮었다. 기존 portrait CSS owner에서 모든 member-visual의 img를 100%/cover로 제한하고 visual 안에서 clip했다(`hani-organization-hub.css:370–372`).
- 모바일 investment/ledger: 요약 모드가 9/8개 열 중 4개만 숨김 없이 두면서, 원래 colspan을 가진 빈 행과 fixed table layout을 함께 사용한다. 사진에서 헤더가 왼쪽에 몰리고 `overflow-wrap:anywhere`로 한 글자씩 쌓인다. 기존 요약 모드만 4개 grid track으로 맞추고 헤더 nowrap·빈 행 전체 폭을 부여했다(`hani-design-system.css:1489–1504`). 전체 보기 토글 및 desktop 표는 기존 경로다.
- monthlyReport: 실제 안내는 `.monthly-report-controls>.sub`인데 과거 수정은 `.earnings-controls`를 대상으로 했다. 고정 남색 보드의 실제 안내 selector를 기존 밝은 잉크 규칙에 포함했다(`hani-design-system.css:1820`).
- milestones 선택 메뉴: nav 배경은 finish 표면으로 바뀌지만 기존 active 아이콘/보조 문구/화살표의 밝은 색이 남았다. nav-home의 자식들도 같은 표면의 text-primary를 사용한다(`hani-design-system.css:656`).
- exercise: `drawLines`는 숨겨진 canvas이면 반환한다(`hani-main.js:3507`). 초기 renderExercise는 숨겨진 화면에서 실행되지만 기존 `showView`에는 exercise 재그리기 호출이 없다. 기존 분기에 동기 `drawExercise()`를 연결했다(`:1982`). 빈 안내를 짧게 바꾸고(`:3926`), 색상은 실제 canvas의 상속된 finish에서 읽는다(`:3507`). 흰 차트 표면도 공통 chart 규칙에서 finish 표면으로 연결했다(`hani-design-system.css:537`). 새 layer/event/timer 없음.

### 파일별 diff 요약

| 파일 | 변경 |
|---|---|
| `hani-design-system.css` | 밝은 카드 공통 surface/ink 경계, 계좌 숫자 색의 진한 변형, tasks pill 짝, 선택 바로가기 보조 글자, 모바일 요약표 4열, 실제 월간보고 안내, chart 표면 |
| `hani-development-history.css` | 고정 밝은 이력 카드의 `ⓘ 변경 내용`이 카드 내부의 text-secondary를 사용 |
| `hani-organization-hub.css` | 기존 member portrait selector 범위와 크기/clip 보완. 상세 초상화 경로 보존 |
| `hani-main.js` | 기존 showView에 운동 그리기 호출 1개, drawLines 색상 조회 owner root→canvas, 운동 빈 상태 안내 축약. 3줄만 변경 |
| `scripts/fixtures/ui237-readability.json` | 고정 base SHA·4개 runtime owner의 전후 SHA-256·정확한 before/after hunk 11개. EOL 포함 |
| `scripts/hani-reviewed-release-baseline.mjs` | 위 UI diff만 먼저 역변환해 기존 release oracle로 전달. 기존 release SHA/office pending 목록/235 미등록 실패는 보존 |
| `scripts/hani-ui237.test.cjs` | 고정 Git 기준 exact diff·부정 변형·저장/event/timer 보존·팔레트 대비·실제 함수 VM 실행 4종 |
| `artifacts/ui237/` | Git EPERM 환경용 read-only oracle export/preload, 기존 QA safety의 출력 경로 격리 runner, 요청 목록·digest·검증 요약. 큰 Git cache/원문 복사/로그는 `.gitignore`로 commit 제외 |
| `ui237-report.md` | 본 인수인계 |

### 같은 공통 원인으로 함께 처리한 화면

요청된 asset/home/wishlist/deployment/dev 외에 다음 사용처를 코드로 확인했다. 아래는 구현 적용 범위이며 실화면 PASS 선언이 아니다.

- **investment:** 기존 틴트 `.stat`의 label/value. 자산과 같은 QA 1차 잉크 규칙 사용.
- **asset 구성 카드:** `#assetComposition>.item`의 밝은 현금/투자상품 배경과 `.sub` 안내.
- **home:** 기존 계좌 요약 `.home-account-grid .account-card`, `.home-accounts-wrap`, `.home-task-summary`, `.home-task-mini-item`.
- **wishlist 상세:** 고정 밝은 `.wishlist-reason` 안 사유 본문.
- **공통 후속 작업 안내:** `.agent-life-actions`의 밝은 배경과 테마 상속 문구.
- **aiTeam:** home과 같은 `teamCard/member-visual`을 사용하는 정식 입사 직원의 img 크기 제한. aiWork의 촬영 착시/내용은 변경하지 않음.
- **공통 canvas 차트:** 투자·계좌·신체·가계부의 기존 `drawLines`도 실제 canvas의 finish 잉크를 읽음. 공통 `.chart`는 finish 표면을 사용. 그래프 데이터/축 계산은 동일.
- **sidebar 대시보드 바로가기:** milestones와 같은 nav-home 표면/보조 문구 경로.

CODEMAP은 dashboard/investment/monthly-report의 실제 owner와 anchor를 먼저 확인했다. finish CSS, wishlist, deployment, portrait, 모바일 표의 직접 anchor는 없어 `CODEMAP_MISS`로 보고 관련 실제 코드/로드 순서를 검색했다. CODEMAP은 수정하지 않았다.

### Node 검증과 한계

| 명령 | 결과 |
|---|---|
| `node scripts/hani-qa-1st.test.cjs` | **10 PASS, 0 FAIL** |
| `node scripts/hani-design-system-qa.mjs` | **PASS** — 실제 dashboard 계산 및 비변경 데이터 확인 |
| `node --require ./artifacts/ui237/git-oracle.cjs scripts/hani-ui237.test.cjs` | **4 PASS, 0 FAIL** — 4파일 exact 역변환, 수정/삭제/중복/이동/EOL 부정검증, 보호 함수·호출 보존, palette 대비, 실제 applySignatureFinish→showView→drawExercise 실행 |
| `node artifacts/ui237/qa-safety-runner.cjs` | 기존 `scripts/hani-qa-1st-safety.mjs` **PASS**. runtime JS 7개 syntax, canonical 저장 함수/Storage·Cloud 호출/version·cache 보존, 68개 파일 duplicate ID 증가 0, 비변경 16,955줄 EOL 바이트 동일 |
| `node --require ./artifacts/ui237/git-oracle.cjs scripts/hani-reviewed-release-baseline.test.mjs` | **이전 7 PASS/7 FAIL → 이후 7 PASS/7 FAIL**, 실패 이름 7개 동일. 235 baseline 미등록 등 기존 실패는 PASS로 바꾸지 않음 |
| `node --check hani-main.js` 및 baseline helper/신규 test | **PASS** |
| `git -c core.autocrlf=false -c core.whitespace=cr-at-eol diff --check` | **PASS**. 기존 CRLF를 공백 오류로 제거하지 않음 |

- 직접 `node --test`는 test worker spawn EPERM, 직접 baseline 실행도 Node의 Git spawnSync EPERM이다. test runner 자체의 기대값은 그대로 두고 PowerShell `git cat-file --batch`로 **고정 과거 Git blob**을 추출해 `git show` 읽기만 대체했다. 현재 working tree를 oracle로 사용하지 않는다. 재실행: `& ./artifacts/ui237/export-oracle.ps1` 후 위 preload 명령. 최초 수정 전 baseline 로그와 이후 실패 이름을 비교했다.
- QA safety runner는 원래 검사의 base와 diff-map/결과 파일 경로만 ui237 artifact로 격리한다. 원래 검사의 AST/저장 함수/호출 비교/EOL assertion을 실행했다.
- 선택한 밝은 카드의 primary/secondary 잉크×명시적 파스텔 바탕 조합 최저 **5.67:1**. 계좌의 기존 12가지 series 색은 진한 혼합값으로 4.5:1 이상, black/graphite의 chart/pill 글자 및 남색 보고 안내도 수치상 4.5:1 이상이다. 큰 글자 3:1 기준도 충족한다. **이는 색상 수치 검사이며 실제 CSS cascade·합성 픽셀의 AA 검증은 아님.**
- VM은 실제 함수 소스로 cream/black/graphite × 빈 상태/기록 1건을 실행해 화면 활성화 후 canvas 문구·축/범례 그리기를 확인했다. 실제 브라우저 렌더링 결과를 대신하지 않는다.
- CSS의 브라우저 parser·실제 font 폭·grid/table 접근성·터치 스크롤·사진 비교는 미검증. 지정 browser QA는 실행하지 않았다. Full Build/One-Pass/HINA/Production read-back은 기능 담당 LIGHT 작업이므로 N/A(배포 승인/완료 아님).
- 기계 판독 요약: `artifacts/ui237/verification.json`, `qa-safety-results.json`. 원문 로그는 동일 폴더의 `ui237-node.log`, `qa-1st.log`, `qa-safety.log`, `reviewed-before.log`, `reviewed-after.log`.

### 데이터·승인 경계

- 보호 저장 키/내부 baseline/저장 함수/Local·Cloud write·schema/버전·cache 변경 없음. `hani-office-live.js/css`와 index.html은 base와 바이트 동일.
- push/PR/main merge/배포/Notion/브라우저 실행 없음. 운영 표시·JS 실제 로딩·기능 read-back은 이번 작업에서 미검증.
- Git commit 결과는 마지막 절에 기록한다.

## 다음 담당에게

- 서윤: 390/1440 × midnight-black/porcelain-cream 재촬영 및 실제 대비/레이아웃 검사.
- 브라우저는 대표님 지시로 실행하지 않는다. 현재 사진은 수정 전 근거이며 수정 후 PASS 근거가 아니다.
- Notion은 이번 작업 명시 금지에 따라 갱신하지 않는다. CURRENT/DECISIONS 및 타 담당 기록은 보존한다.
- commit은 core.autocrlf=false로 시도하고 실패하면 파일만 보존한다.

### 서윤 Edge 재확인 목록

**기본 390/1440 × midnight-black/porcelain-cream**, 실제 `applySignatureFinish` 경로로 전환하고 이미지 decode 후 촬영한다. 숫자 0/미확인뿐 아니라 기존 데이터 fixture가 있는 상태도 읽기 전용으로 확인한다.

1. **asset:** 핵심 지표 제목·label/value, ISA/연금/IRP/위탁/토스 이름, 기관명·계좌번호·현금/보유 안내, account-value 숫자, 구성 카드 안내. 기존 틴트와 계좌 색상 stripe 보존 확인.
2. **home:** 최근 개발 업데이트 제목/변경 내용, 월말 자산·가계부 제목/본문, 미니 달력 연월/오늘/요일. 내 라이프 파트너 마지막 두 카드 얼굴이 visual 칸 안에 있고 이름·직책·설명을 덮지 않는지 확인.
3. **wishlist:** 집계 4칩의 label/숫자, 기존 항목을 열었을 때 사유 본문.
4. **tasks:** Google Calendar `Cloud 로그인 필요` pill. 로그인/연결 상태는 허용된 기존 fixture만 사용하고 동기화 버튼 실행은 이 UI QA에서 불필요.
5. **deployment:** `승인 대기 릴리스 없음` 제목/안내. 승인·배포·재시도 등 쓰기 버튼은 UI 확인에 불필요.
6. **investment/ledger 390:** 빈 표와 데이터 표 모두 4열 헤더가 가로로 읽히고 빈 행은 전체 폭인지, 가로 본문·수량/금액/날짜가 잘리는지, 전체 보기 토글을 왕복할 때 원래 전체 표/스크롤로 복귀하는지. 1440 표 회귀도 확인. grid display의 접근성 트리도 확인.
7. **dev:** `ⓘ 변경 내용` 가독성과 기존 native details 열기. 상세 내용/바깥 이력 카드가 어두운 글자·밝은 표면으로 맞는지.
8. **monthlyReport 밝은 테마:** 보고 월 아래 읽기 전용 안내의 남색 바탕 대비.
9. **milestones 1440:** 선택된 바로가기 아이콘·보조 설명·화살표. home 바로가기도 함께 확인.
10. **exercise:** 다른 화면에서 처음 진입한 빈 상태에 어두운 표면/안내가 즉시 나오는지, 기간 전환 빈 상태, 기존 기록이 있는 축·범례·선. 신규 저장 없이 검사. 가계부/투자/신체 canvas의 밝은/어두운 테마도 함께 확인.
11. **aiTeam/home 추가 공통 영역:** 다온·윤슬 및 예정 직원 fallback/다른 직원 카드 크기, 기존 계좌/할 일 요약·agent-life-actions가 있는 화면의 밝은 카드 안 문구·버튼.

일반 글자 **4.5:1**, 큰 글자 **3:1**을 실제 computed color와 합성된 배경/스크린샷으로 확인한다. black 우선 뒤 cream 회귀, 가능하면 graphite도 확인. 미통과 항목은 PASS로 기록하지 않고 이 보고서의 selector/owner 기준으로 도연에게 전달한다.

## Git 마무리 / 보존 파일

`git -c core.autocrlf=false add`는 외부 Git worktree의 `index.lock: Permission denied`로 실패했다. 이어서 같은 옵션의 commit을 시도했으나 신규 파일이 index에 등록되지 않아 pathspec 오류로 실패했다. commit SHA 없음. 기존 branch/HEAD를 유지하며 아래 파일만 인수인계한다.

- `hani-design-system.css`
- `hani-development-history.css`
- `hani-main.js`
- `hani-organization-hub.css`
- `scripts/hani-reviewed-release-baseline.mjs`
- `scripts/fixtures/ui237-readability.json`
- `scripts/hani-ui237.test.cjs`
- `ui237-report.md`
- `artifacts/ui237/.gitignore`
- `artifacts/ui237/export-oracle.ps1`
- `artifacts/ui237/git-oracle.cjs`
- `artifacts/ui237/git-requests.json`
- `artifacts/ui237/git-oracle-digests.json`
- `artifacts/ui237/qa-safety-runner.cjs`
- `artifacts/ui237/qa-safety-results.json`
- `artifacts/ui237/verification.json`

큰 `git-blobs.json`, base 원문 복사, diff와 로그는 재현용 로컬 자료이며 commit 대상에서 제외했다. 다음 담당은 이 목록의 파일과 실제 worktree를 사용하고, 배포 열차·후보 승인 절차는 별도로 진행한다.
