# history-226 월별 기본 표시 축소

## 작업 식별

- 갱신: 2026-10-21 KST / 담당: 도연(Codex), 브라우저 검토: 서윤.
- 상태: 구현·targeted Node 검사 완료 / 서윤 브라우저 검증 대기. 같은 `hani/history-design` / worktree `history226` 사용.
- 시작 HEAD: `0fb0b85adc61044d562c55e95c06e334326f66df` (history226·226b 보존).
- 로컬 origin/main: `331291eb29ec73b2cd5ca3f07eb2d02436e9d1ea`. `git ls-remote origin refs/heads/main`은 네트워크 연결 실패. 최신 원격/Production 표시·최신 JS 실로딩 미확인. 기존 기준 v2.9.223 유지.
- 목표: 각 월 주요 순간 + 최신 일반 5건, 나머지 제자리 접기/펼치기. 기존 최신 2개월 표시 유지. 1440 기본 높이 약 1800px 이하·390 가로 overflow 없음은 서윤 실화면 재검증.
- 범위: `hani-organization-hub.js`, `hani-organization-hub.css`, `scripts/hani-history-226.test.mjs`, 작업 기록/증거.
- 승인: 성민 대표님의 이번 요청. 버전·cache·Storage·Cloud 변경, main merge·배포는 범위 밖. 기존 미추적 artifacts 보존.
- CODEMAP_MISS: `dev-center/codemap.json`에 연혁 owner/anchor/test 없음. 기존 226 인계와 실제 검색으로 canonical `renderOverview` 및 단일 root click 경로 확인.

## 결과와 증거

- 구현: canonical `renderOverview` 안에서 각 월 일반 릴리스 최신 5개를 제외한 행에 `hidden` 적용. 주요 순간은 전부 보존. 같은 월 버튼 하나의 `aria-expanded`와 문구를 갱신. 메모리 Set으로 월별 독립 상태 유지. native button의 Enter/Space 기본 동작과 기존 단일 delegated click 사용. 월/행/버튼 재생성 없음. 같은 날 묶기는 선택 요구이므로 추가하지 않음.
- 실제 카탈로그 95건 유지. 기본 10월 8건(주요 3 + 일반 5), 숨김 66건. 9월 8건(주요 3 + 일반 5), 숨김 13건. 제목/주요 순간/담당/집계 원문 불변. 최신 2개월 및 이전 달 더 보기 유지.
- CSS: desktop 일반 행의 상하 padding 17→12px, 월별 버튼 줄·44px 조작 영역·줄바꿈·focus 표시 추가. 기존 mobile 규칙 보존.
- `node scripts/hani-history-226.test.mjs --unit-only`: PASS. 실제 기본 8+8건, 정확한 최신 일반 5건, 66/13 숨김 문구, 반복 펼침/접기·월별 독립·aria 상태·행/버튼 identity·원본 불변·write 0. 일반 1/5/6건 경계, 이전 월 toggle과 월별 상태 보존, 기존 실패/집계/기여자/escape 회귀 포함. 증거: `artifacts/history-226/unit.json` (현재 JS/CSS hash 포함).
- `node scripts/hani-ui-203b.test.mjs .ai-budget-private/history226-regression`: PASS. read-only overview/KST/활동 집계/원본·EOL 보존/추가 write 없음.
- `node --check hani-organization-hub.js`, `node --check scripts/hani-history-226.test.mjs`, `git diff --check`: PASS.
- Browser 검사 코드 보강: 기본 8+8건·버튼 66/13건·Enter 펼침/Space 접기·focus/DOM 보존·1440 연혁 높이 ≤1800px·390/1440 기본 및 펼침 상태 문서 가로 넘침 없음. **이번 실행은 Node 부분만 수행. 실제 height/overflow/키보드/AA/스크린샷 미검증, 서윤 재실행 담당.**
- 버전/cache·Storage/Cloud·정적 카탈로그·일보·main JS 등은 이번 diff에 없음. 데이터 migration/schema/server/Edge Function 변경·배포 순서 없음. Release 버전 증가는 기능 담당 금지 규칙 적용.
- Git: 지정 파일 `git add`와 `git commit --only -m "fix: collapse monthly history after five regular releases" -- <tracked files>` 모두 `.git/worktrees/history226/index.lock: Permission denied`로 실패(exit 1). HEAD `0fb0b85adc61044d562c55e95c06e334326f66df` 유지. **후속 수정 미커밋·미push 보존**, 기존 history226·226b commit 유지. 임의 권한 변경·우회·merge/rebase 없음.
- Notion: 기존 작업 페이지 읽기 성공. 착수 기록 추가는 자동 승인 검토 `requires approval, but approval policy is never`로 거절. 갱신 대기. [기존 카드](https://app.notion.com/p/400c527570748178a4ebe4a69824e2ec).
- main/Pages/Production read-back: 수행하지 않음. Candidate/One-Pass/HINA: 기능 패치 단계 N/A.

## 다음 담당에게

- 먼저 읽기: `hani-organization-hub.js`의 `renderOverview`와 root click, `scripts/hani-history-226.test.mjs`.
- 서윤: `node scripts/hani-history-226.test.mjs` (필요 시 `--cdp=http://127.0.0.1:9226`)로 실제 브라우저/스크린샷 재검증. 기존 after PNG/after-browser.json은 이번 변경 증거로 재사용하지 않음. `--before` 재실행은 필요 없음.
- CURRENT: 이번 8+8 기본 표시·검사/미검증 및 인수인계 링크를 최상단에 추가. 기존 226/226b 기록 보존.
- Notion 갱신 대기 내용: 시작 HEAD/branch·월별 8+8건/66·13건 토글·Node PASS·서윤 실화면 대기·Git 결과·버전/데이터/배포 변경 없음. 자동 승인 검토 거절로 재승인 요청 없이 저장소에 보존.

## 2026-10-21 · int-225 서윤 결정 후속 / 도연(Codex)

- 상태: 진행 중. branch `hani/int-225`, 시작 HEAD `ad83ed38e103b8822c7753eb4548d3bb16b3e435`, base/로컬 origin/main `331291eb29ec73b2cd5ca3f07eb2d02436e9d1ea`.
- 원격 fetch/ls-remote는 GitHub 연결 실패. 최신 원격·Production 화면/JS 실로딩은 미확인. 로컬 main index의 표시/cache v2.9.223, 마지막 script `hani-launch-greeting.js` 확인. merge/rebase 없이 기준 유지.
- 승인: 대표님이 전달한 서윤 결정 2건. resolver는 origin/main 바이트로 원복, 연혁 집계는 일보 owner의 기존 카탈로그 읽기 전용 getter/준비 알림 재사용, owner runtime test는 접힌 details를 가시성/촬영 전에 열기. 데이터 보호 assertion 유지.
- 범위: `scripts/hani-runtime-closure.mjs`, `hani-ilbo.js`, `hani-organization-hub.js`, 관련 history/closure/owner 테스트와 이 인수인계. 기존 타 작업 artifacts는 보존. CODEMAP_MISS로 실제 owner/실행 순서 분석.
- 버전/cache·Storage·Cloud·`supabase/functions/hani-deploy-bridge` 수정, main 병합/배포 금지. 서버 배포 순서 없음.
- Notion 현황판 읽기 성공. 착수 append는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never`로 거절되어 갱신 대기. 결과/다음 행동도 이 절에 보존.

### 후속 결과와 검증

- `scripts/hani-runtime-closure.mjs`를 `git show origin/main:<path>`의 원본 바이트로 복원. main blob과 작업 파일 blob 모두 `a56f02471ec0870d42e2b039b2cf407e674ccbad`; `git diff origin/main --exit-code -- scripts/hani-runtime-closure.mjs` PASS. 보호 서버 resolver·gate 파일 변경 0.
- `hani-ilbo.js`: 기존 메모리 `entries`·`ready`를 읽는 `publishedCount(now)` 추가. 미준비/실패는 `null`, 준비 후 KST 발행일 기준 중복 없는 호수. getter는 fetch/저장/렌더를 실행하지 않음. 기존 카탈로그 읽기 성공 직후 `hani-ilbo-ready` 알림.
- `hani-organization-hub.js`: 일보 manifest fetch와 복제 metadata 처리 제거. 기존 getter/준비 알림으로 집계. 미준비는 `하니일보 —호`, 준비 후 기존 chip의 strong text만 갱신. 연혁 행·월 토글·chip DOM 유지, 새 fetch 경로 literal 없음.
- owner runtime test: 클릭·가시성·촬영 전에 대상의 모든 details 조상을 열기. 기존 `#cloudBridgeCard`는 settings CSS의 `display:contents`로 자체 촬영 박스가 없으므로 실제 소유권 버튼을 포함하는 가장 가까운 `.card`를 촬영. 원본 key 동일·retained binding 없음·Data Hub cache 없음·신규 오류 없음 assertion 전부 보존.
- 테스트/fixture 수정: history 실제 일보 owner API 및 지연 준비·미로드·실패·KST 경계·추가 fetch 없음·persistent chip/행 검증. ilbo lifecycle fixture는 실제 ready Event와 읽기 전용 getter 검증. 기존 resolver 변경을 전제로 하던 closure test를 현 canonical 경로/음성 검사로 교체.

| 명령 / 항목 | 결과 |
|---|---|
| `node scripts/hani-history-226.test.mjs --unit-only` | PASS: 실제 95건·17명·발행1호/미래 제외, 지연 owner 준비·미준비/실패, chip/행 identity, 월별 토글, write0 |
| `node scripts/hani-owner-verification-runtime.test.mjs --static` | PASS: 기존 event binding 및 실제 diagnostic 7 fixture, 보호 함수·무저장·미보관 |
| `node scripts/hani-settings-225.test.mjs --static` | PASS: exact UI delta·보호/version 표면·상태·127 unique ID/109 planned static ID·원래 안내/분류 |
| `node scripts/hani-ilbo-213.test.mjs --unit` | PASS: 기존 11 검증 그룹, async retry/ready·publishedCount/fetch0·날짜 경계 포함 |
| `node scripts/hani-runtime-closure-ilbo.test.mjs` | PASS 3: 실제 작업 트리 closure 누락0, Node/서버 canonical source parity, **변경 없는 One-Pass evaluatePackage의 runtime_closure PASS**, 카탈로그 누락 시 BLOCKED |
| `node scripts/hani-ui-203b.test.mjs .ai-budget-private/int225-followup` | PASS: 시작 HEAD의 main/index 바이트와 현재 diff를 shell에서 보존해 기존 fixture 인자로 제공; KST/활동/read-only/원문 EOL/추가 write0 |
| 변경 JS/MJS 6파일 `node --check`, `git diff --check` | PASS |
| `node scripts/hani-release-package.mjs test --candidate HEAD` | BLOCKED: Node/서버 parity fixture 구간 이후 `spawnSync git EPERM` |
| `node scripts/hani-release-package.mjs build --base origin/main --candidate HEAD --output artifacts/regression-225/int225-followup-package.json` | BLOCKED: 첫 `git rev-parse HEAD` subprocess EPERM, package 생성 없음 |
| history-226 / settings-225 / owner runtime 실제 Edge | 실행 시도 모두 `browserType.launch: spawn EPERM`; 새 화면/PNG 미검증 |

- 위 One-Pass 결과는 **현재 미커밋 작업 트리의 closure 항목만 검증**한 결과이며, frozen HEAD package build·전체 One-Pass·HINA·배포 PASS가 아님. release 버전 검사는 기능 담당의 버전 유지 규칙으로 이번 작업 N/A; 열차 담당이 수행.
- extra 203b 초기 부분 추출 fixture에 ready 등록이 포함되던 오류는 등록을 renderer 정의 뒤로 옮겨 해결. 이후 검증은 최종 소스 기준 PASS. 별도 Git subprocess EPERM은 기존 지원 baseline 입력으로 해결했으며 runner/정책 변경 없음.
- 데이터·Storage·Cloud/schema·auth·운영 원본·버전/cache·보호 deploy bridge 변경 0. main/Pages/Production 단계 미수행. 별도 Edge Function/설정 배포 없음.
- Git staging 및 `git commit --only -m "fix: reuse ilbo catalog and reveal owner diagnostic card" -- <인수 파일>` 시도 모두 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/int225/index.lock: Permission denied`로 실패(exit1). HEAD `ad83ed38e103b8822c7753eb4548d3bb16b3e435` 유지. **후속 수정 미커밋·미push 보존**. 기존 타 작업 artifacts/PNG 및 미추적 파일은 덮어쓰거나 stage하지 않음. 브라우저 시도에 따른 history/settings 검사 결과 JSON만 해당 runner가 갱신.

### 다음 담당에게 / Notion 갱신 대기

- 서윤: 최종 작업 트리에서 `node scripts/hani-history-226.test.mjs`, `node scripts/hani-settings-225.test.mjs`, `node scripts/hani-owner-verification-runtime.test.mjs <playwright/index.mjs> <Edge exe>` 실행. owner는 실제 진단 card 박스/390·1440 및 두 finish 캡처 확인. 기존 PNG를 이번 수정 PASS로 재사용하지 않음.
- Git 허용 환경에서 아래 파일들만 commit 후 새 HEAD로 위 package build와 `node scripts/hani-release-package.mjs test --candidate HEAD` 실행. Full Candidate/버전/HINA/배포는 배포 담당 열차 절차.
- 인수 파일: `hani-ilbo.js`, `hani-organization-hub.js`, `scripts/hani-runtime-closure.mjs`, `scripts/hani-history-226.test.mjs`, `scripts/hani-ilbo-213.test.mjs`, `scripts/hani-owner-verification-runtime.test.mjs`, `scripts/hani-runtime-closure-ilbo.test.mjs`, 이 인수인계, `CURRENT.md`.
- Notion 대기 요약: int-225 후속2건 구현·지정 Node/One-Pass closure PASS, Edge 및 frozen package CLI 환경 차단, Git 결과, 버전/데이터/Cloud/gate·배포 변경 없음. 착수 추가가 자동 승인 정책 never로 거절됐으므로 갱신 완료로 보고하지 않음.
- 저장소 원문: `docs/development-history/handoffs/2026-10-21-history-226-compact.md`의 이 절. branch `hani/int-225`, base `331291eb`, 시작 HEAD `ad83ed38`. PR 없음. 대표님 승인 범위는 이번 두 수정/검증/commit 시도까지이며 release 승인으로 확대하지 않음.
