# audit-1 · 점검 반영 1차

2026-11-19 KST · 도연 / Codex · 전달 branch `hani/queen-last-month`, base `2220b6129c63721906a3788ee9a7681f197c4523`.
Git·Edge·commit/push·merge·배포 없이 작업 폴더에 보존했습니다. 원격 최신성은 새로 조회하지 않았습니다.

## 변경

| 항목 | 파일 / 전 → 후 |
|---|---|
| 기존 퀸 2곳 | `hani-board.js`, `hani-office-live.js`: 지난달(N월)의 퀸. 기존 `d1b2827` 바이트 그대로 보존, audit-1 inverse에만 포함 |
| #2 체크/라디오 | `hani-design-system.css`: 모바일 40px 및 뒤쪽 18px 규칙 → 공부·Drive·테마 스튜디오 22px. min/max/flex·native 모양 우선순위 보정 |
| #12 공부 | `hani-study-v02984.js`: 왼쪽에서… → 프로젝트 설정에서 만들면 오늘의 퀴즈… |
| #13 쉬운 말 | `index.html`, `hani-main.js`, `hani-asset-update-v1.js`: accountId → 고른 계좌, OAuth/Supabase 안내 → 구글 연결 정보는 안전한 서버에만 보관, Preview/Commit·Pilot/Agent DB → 승인 전 기록 보존·기존 업무 기록 |
| 홈 코드 | `hani-development-history-v1.js`: 긴 commit ref → 화면에서 7자리. 원본 값 보존 |
| #16 가계부 | `hani-main.js`, `hani-ui-v02992.js`: 0건의 절약 신고가·-100% → 카드와 상단 배너 모두 기록 없음. 실제 0원 거래가 있는 경우는 기존 비교 유지 |
| #20 스포츠 | `hani-main.js`, `index.html`: 마지막 경기 30일 이상이며 알려진 미래 경기가 없으면 홈·팀 상세에 시즌 종료. 오래된 9월 정적 대체 화면도 표시, 새 캐시를 받으면 기존 renderer가 갱신 |
| 책 붙여넣기 | `index.html`: 제공 해석기를 main·유나보다 먼저 로드. `hani-main.js`, `hani-yuna-helpdesk.js`: 자동 분류·두 해석 경로·미리보기 후처리 연결. 제목 아주 작은 습관의 힘 / 저자 제임스 클리어 / 더 읽었어는 읽는 중. 서점 평점·출간일을 내 평점·독서 날짜로 쓰지 않음 |
| 개발 히스토리 | `hani-organization-hub.js`: `.every` 전체 실패 → 유효 행만 filter. schema 오류는 실패, 제목 24자 제한 유지. `assets/data/hani-history-releases-v1.json`: v292 제목 → 직원 말풍선 가끔 안 뜨던 문제 수정 (`histfix`와 바이트 일치) |

건너뜀: #1 PNG→WebP는 cwebp·ImageMagick·ffmpeg·sharp 등 변환 도구가 없어 생략했습니다. 원본 PNG와 참조를 유지했습니다. #14 `ai-team-status.json` 날짜, 버전 2.9.299·캐시 태그·그 외 history는 지시대로 변경하지 않았습니다. 제공 `hani-book-share-parse.js`와 기존 7개 시험도 수정하지 않았습니다.

## 시험 층

`audit-1 → 299 version/history → 디자인2 → 298 → 도우미 끄기 → 297 → 치비3 → 296 → 디자인1 → 295 …`

신규 source/preload/fixture/`hani-audit-1.test.mjs` 추가. 디자인2 preload와 release299 source의 시작점에서 audit-1을 먼저 설치해 직접 import 때도 capture 순서를 보장합니다. 14개 owner의 36개 정확한 hunk를 독립 로컬 객체의 main299 바이트로 복원합니다. 기존 fixture 120개·시험/스모크 336개 원문, 단언·숫자·hash 보존.

최종 contract SHA256: `4a0ca4db399bc95d3ea0d8e88e951c20498e87e810f13284e0f9896b2aea4f01`.

## 검증

- 새 audit-1 14/14 PASS: 퀸 실제 함수, CSS 우선순위 선언, 쉬운 말·7자리 출력, 가계부 카드/배너, 스포츠 30일 경계/미래 일정, 책 3가지와 완독·fallback, 히스토리 부분 실패/schema, strict inverse·sync/callback/promise·closure.
- 지정 tooling299 96파일: **968 PASS / 기존 7 FAIL / skip 4**, 기준 실행과 실패 이름·오류 signature 동일. office 46파일 **610 PASS**, tooling 81파일 **868 PASS**.
- 추가 5파일 포함 101파일: **1,014 PASS / 11 FAIL / skip 4**, 97파일 성공·4파일 실패. 새 회귀 0. 추가: audit-1 14/14, 제공 해석기 7/7, 유나 smoke·스포츠 contract 각각 실행 성공, 라운지 23 PASS/4 FAIL.
- 저장·Cloud mutation 호출 AST 전후 일치, 원본 1,699파일의 범위 밖 변경/누락 0. 퀸 두 파일·보호 키·버전/cache·기존 줄바꿈 보존. 현재 runtime closure 174개, inverse main299 173개, 누락 0.
- JS syntax 20파일(기존 owner/연결 11 + 신규 9), PowerShell syntax 1파일 PASS. DOM/event 관련 기존 targeted 시험은 유지했고, 실제 화면 검증은 아래처럼 미실시입니다.
- Edge 화면·실기기·로그인·운영 데이터·Production·Git 필요 시험은 미실시. 화면 모양은 서윤 Preview 확인 대기이며 PASS로 간주하지 않습니다.
- 새 로그·snapshot·보존 사본은 모두 `local/` 아래이며 commit 대상에서 제외해야 합니다. `.gitignore`는 변경하지 않았습니다.

**미해결 blocker: 라운지 4건.** 시험의 `process.argv[1]` 가드 때문에 상대 경로 실행은 본문 검사를 하지 않았습니다. 실행기에 절대 경로를 적용해 실제 27개 검사를 실행했고, 퀸 문구를 포함한 23개는 PASS입니다. 나머지 4건은 독립 고정 main299 객체를 입력한 별도 실행에서도 같은 이름·오류로 재현했습니다.

- 게시물 builder의 최신 일보/시장 뉴스 목록과 `hani-board-library.js`에 들어 있는 목록 불일치 1건.
- 월간 투표의 현재 조직 명단과 생성된 library의 이음 포함 여부 불일치 1건.
- 기존 board 시험 환경에서 `syncThemeCollections` 누락 2건.

이 항목들은 audit-1의 퀸/표시 변경 전에도 존재하며, library·콘텐츠 원본/기존 시험 환경에 걸칩니다. 허용된 운영 파일 범위 밖의 library·데이터를 바꾸거나 기존 단언을 완화하지 않았습니다. **전체 PASS 요청은 이 4건 때문에 미완료이며 집계기는 exit 1을 유지합니다.** 증거: `local/summary.json`, `local/lounge-main299-independent.log`, `local/current/test-logs/`, `local/baseline/test-logs/`. 초기 중단 실행과 기존 preload 조합 실험 로그도 local에 보존했습니다.

## 서윤 다음 실행

```powershell
& artifacts/audit-1/run.ps1 -Baseline
& artifacts/audit-1/run.ps1
node artifacts/audit-1/summarize.mjs 1
node artifacts/audit-1/verify.mjs
& artifacts/audit-1/run.ps1 -GitOnly -AllowProcesses
```

Git 27개·브라우저 위임 6개 목록은 [GIT-TESTS.md](GIT-TESTS.md). 원래 실패 제외 목록은 `local/test-inventory.json`에 보존하며 수정하지 않았습니다. Baseline/집계의 exit 1은 위 라운지 blocker를 숨기지 않은 결과입니다. 보존 검사는 이 작업 폴더의 local 착수 사본을 사용합니다.

데이터 JSON 제목 수정은 서윤의 별도 데이터 PR을 릴리스보다 먼저 병합할 대상입니다. Edge Function·서버 설정 변경은 없습니다. 이후 버전/history·Candidate·실제 Edge·Git·commit/push·배포는 서윤 담당입니다.

Notion 착수 카드는 생성 후 read-back 확인했습니다. 진행·최종 갱신은 도구가 승인 필요로 판정했고 승인 정책 `never`로 거절되어 미반영입니다. 갱신 대기 내용은 [인수인계](../../docs/development-history/handoffs/2026-11-19-audit-1.md)에 보존합니다.

## 2차 보강

2026-11-19 KST · 도연 / Codex · 성민 대표님의 `../audit1b-task.md` 전체 지시를 UTF-8로 읽고 수행했습니다. 한글 정상 확인. 전달 branch `hani/queen-last-month`, 고정 main `2220b6129c63721906a3788ee9a7681f197c4523`. Git 명령·commit·push·배포·Notion은 실행하지 않았습니다. 고정 객체는 기존 read-only 객체 검증기로 읽었습니다. 원격 최신성·Production은 조회하지 않았습니다.

### 시험별 원인과 수정한 층

원인은 기존 디자인2 preload를 거치지 않는 직접 실행 경로에서 audit-1 변경 바이트가 하위 frozen 층으로 들어간 것이었습니다. 기존 시험·단언·숫자·hash·fixture를 고치지 않고, 기존 audit-1 exact inverse를 읽기 경계 앞에 연결했습니다. `CODEMAP_MISS`: codemap에 이 시험 층의 anchor가 없어 실제 import/reader 경로를 따라 확인했습니다.

| 시험 | 원인 / 연결한 층 | 결과 |
|---|---|---|
| `hani-brand-heroes-218` | `readReviewedCurrentSource`가 audit 변경 HTML 등을 직접 읽음. `hani-reviewed-release-baseline.mjs` 첫 줄에서 audit preload 설치 | 3/3 PASS |
| `hani-helper-toggle` | helper source가 audit 변경 UI를 raw reader로 먼저 capture. `hani-helper-toggle-source.cjs`의 capture 전에 preload 설치 | 8/8 PASS |
| `hani-ocr-accuracy-224` | 쉬운 안내 문구가 포함된 asset owner 전체 바이트를 승인된 release oracle과 비교. 같은 reviewed-release entry에서 먼저 main299로 복원 | 14/14 PASS |
| affinity/patrol/companions/pets의 274/278/276/268 pin 4파일 | 퀸 문구 때문에 전체 office hash가 달라져 cap·M9 이하 projection을 건너뛰고 kids 278 hash에서 실패. `hani-office-affinity-cap-source.cjs` 앞에서 preload 설치 | 기존 round-trip·변조 거절 단언 통과. 실제 Git 호출은 금지 범위로 차단; 아래 독립 객체 대조로 별도 보완 |
| `hani-office-affinity-storage` | cap inverse가 hash 불일치로 적용되지 않아 승인된 이전 owner 문자열을 찾지 못함. 위 cap entry 연결로 해소 | 3/3 PASS |
| `hani-office-motion-1` | tlayout/companions 복원 경로가 audit office 바이트를 받음. 같은 office entry에서 해소 | 16/16 PASS |
| `hani-reviewed-release-baseline` | asset 등 audit owner가 승인된 release225 + 이후 명시 변경 바이트와 불일치. oracle 앞에 outer inverse 설치 | 18/18 PASS; 보고된 신규 실패 6건 해소 |
| `hani-office-bori-m9` | M9 전체 파일 inverse에 audit office 바이트가 들어감. cap entry 연결 후 strict inverse와 실제 21,600개 daytime snapshot 검사까지 완료 | 2/2 PASS, 약 69.3초. 단순 시간초과를 PASS로 바꾸지 않았음 |
| 추가 발견: `hani-lounge-billboard` | 직접 실행에는 1차 실행기의 전역 preload가 없어 퀸 문구 단언 2건 추가 실패 | 복원 후 23 PASS / 기존 4 FAIL |
| 추가 발견: `hani-history-unify` | audit의 부분 행 허용 loader를 이전 shape-failure 단언에 그대로 입력 | 복원 후 10 PASS / 기존 4 FAIL |

**affinity-storage는 실제 저장 동작 변화가 아니었습니다.** 이 시험은 승인 owner 문자열과 외부 storage guard를 검사합니다. 정확한 main299 바이트를 입력하면 기존 단언이 그대로 3/3 통과합니다. 운영 저장 함수·키·payload·Cloud write 경로는 수정하지 않았습니다.

수정한 기존 층은 다음 5파일의 첫 import/require **1줄씩**입니다. 각 파일의 나머지 모든 바이트는 독립 고정 main 객체와 일치합니다.

- `scripts/hani-reviewed-release-baseline.mjs`
- `scripts/hani-helper-toggle-source.cjs`
- `scripts/hani-office-affinity-cap-source.cjs`
- `scripts/hani-board-library-build.mjs`
- `scripts/hani-one-pass-rules.mjs`

마지막 두 공유 도구는 새 `scripts/hani-audit-1-direct-input.mjs`를 연결합니다. **정확히 라운지·히스토리 시험을 직접 실행한 argv일 때만** preload를 설치합니다. 일반 library build와 Release Gate import에서는 원래 fs reader·candidate 바이트를 유지함을 실제 모듈 import로 확인했습니다. builder/Gate 함수·판정·contract는 변경하지 않았습니다. 기존 audit fixture와 source/preload 구현도 그대로입니다.

### 전체 실행과 main 대조

`scripts/*.test.mjs` **276개 전체**를 cwd=queenlabel, 파일별 별도 Node 프로세스로 순차 실행했습니다. main에는 274개가 있고, 현행에는 audit-1·제공 책 해석기 시험 2개가 추가되어 있습니다. main의 기존 274개 시험 원문은 고정 객체와 모두 일치합니다. current 실행에는 audit inverse를 전역 주입하지 않았습니다. reporter·Git/browser 실행 차단·출력 격리만 공통 적용했습니다.

| 구분 | 결과 |
|---|---|
| 현행 전체 | **276파일: 종료 성공 174 / 실패·차단·시간초과 102** |
| 현행 TAP 단언 | **1,557 PASS / 58 FAIL / skip 10** |
| 기존 main 시험 274개만 | 성공 172 / 실패·차단·시간초과 102, 1,536 PASS / 58 FAIL / skip 10 |
| 신규 2개 | audit-1 14/14, 책 해석기 7/7, 총 21/21 PASS |
| 고정 main 재현 | 현행 실패 102파일 모두 다시 실행하여 **102개 모두 실패 재현**. 종료 코드·시간초과 여부·실패 단언 이름/숫자 전부 동일 |
| 새 회귀 | **새 실패 파일 0 / 새로 실패한 TAP 단언 0** |

현재 통과한 파일은 main을 반복 실행하지 않았습니다. main 대조에서는 현행 실패 파일을 전부 선택하고, TAP 시험은 실패한 단언 이름만 정확히 골라 재실행했습니다. 이름 없는 script 오류와 시간초과는 파일 전체를 실행했습니다. 이는 전체 main 재실행의 PASS 집계가 아니라, 현행의 모든 실패가 기존 main에서도 발생하는지 확인한 결과입니다. 종료 성공 174파일에는 TAP 집계가 없는 49개와 전체 SKIP 1개가 포함됩니다. 이 파일들을 TAP PASS 숫자에 더하지 않았습니다.

**전체 PASS로 보고하지 않습니다.** 102파일에는 프로세스 차단이 기록된 44개, 양쪽 모두 180초에 걸린 `hani-office-bori-stroll.test.mjs` 1개가 포함됩니다. 나머지 57개도 고정 main에서 실패를 재현했습니다. Git 및 실제 브라우저 검증은 미실시입니다. 특히 pin 시험의 실제 Git 호출은 PASS로 계산하지 않았습니다. 대신 별도 `second-pass-pins.mjs`가 고정 객체의 identity를 검증하며 audit 14 owner·affinity/companions/patrol·278 확장·pets의 **27건 전체 바이트 및 blob 대조 PASS**를 남겼습니다. 이 별도 근거를 원래 Git 시험의 PASS로 합산하지 않았습니다.

### 보존 및 재실행 근거

- 2차 착수 보존 대상 768파일 중 변경은 위 entry 5곳뿐. 착수 시 시험 301개(`.test.mjs`/`.test.cjs`)와 fixture 121개 원문 보존. audit delta contract SHA256 `4a0ca4db399bc95d3ea0d8e88e951c20498e87e810f13284e0f9896b2aea4f01` 유지.
- 1차 착수 원본 1,699파일도 합산 범위 밖 변경 0 / 누락 0. 이 2차에서 운영 14 owner·저장/Cloud/schema·버전/cache 변경 0.
- `artifacts/office-behavior/obr16-layout-node.json`, `obr17-layout-node.json`, `obr19-layout-node.json`, `artifacts/office-drama/reachability.json`은 실행 전 사본과 마지막 SHA256이 동일합니다. 시험 출력은 local로 격리했고 원본 JSON을 직접 편집하지 않았습니다.
- 수정·신규 JS 8파일 syntax 및 PowerShell 실행기 syntax 확인. 공유 builder/Gate의 일반 import reader 불변 확인. runtime build·버전 증가·실제 UI·Candidate/HINA·Preview·Production은 이 시험 도구 작업의 수행 범위 밖이며 PASS로 간주하지 않습니다.
- 실행기 초기 child-process EPERM, 종료 코드 capture, PowerShell JSON 배열 처리 중단 시도는 local의 초기 폴더에 보존했으며 최종 수치에 포함하지 않았습니다. 수정 후 실제 종료 코드와 102개 선택을 확인한 결과만 집계했습니다.

```powershell
& artifacts/audit-1/full-suite.ps1 -Phase current
# 소스 보강 후 재검사한 6파일은 current/selected.json에 별도 보존
& artifacts/audit-1/full-suite.ps1 -Phase current -Only @('hani-history-unify.test.mjs','hani-lounge-billboard.test.mjs','hani-navlogin.test.mjs','hani-one-pass-protected-surface.test.mjs','hani-pwa-release-paths.test.mjs','hani-runtime-closure-ilbo.test.mjs')
& artifacts/audit-1/full-suite.ps1 -Phase baseline -CompareFailures
node artifacts/audit-1/second-pass-summary.mjs
node --require ./scripts/hani-design-polish-2-execution-guard.cjs artifacts/audit-1/second-pass-pins.mjs
```

최종 원문: `local/second-pass/summary.json`, `current/results-final.json`, `baseline/results.json`, 파일별 log, `independent-pins.json`, `builder-isolation.json`, `preservation.json`. 1차 verify의 고정 범위·단언은 수정하지 않았고, 추가된 2차 범위는 새 `second-pass-summary.mjs`로 검증합니다. 모든 로그·사본·생성 출력은 `artifacts/audit-1/local/`에 있으며 commit 제외 대상입니다. `.gitignore` 변경 없음.

인수인계: `docs/development-history/handoffs/2026-11-19-audit-1-second-pass.md`. Notion은 이번 지시가 명시적으로 금지하므로 접근·갱신하지 않았습니다. Git·실제 브라우저·배포는 후속 담당 범위이며, 현재 작업은 코드 보강과 허용된 회귀 검증까지 완료했습니다.
