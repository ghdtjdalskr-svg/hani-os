# QA-5·QA-13·QA-14 · 연혁 단일 원장

## 작업 식별

- 갱신일(KST): 2026-11-01
- 담당: Codex / 미커밋 검토·브라우저 확인: 서윤
- 상태: 구현·Node targeted 검증 완료, 서윤의 미커밋 검토·실화면 확인 대기 (Candidate/Release 작업 아님).
- worktree: `C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/qa-b3`
- branch: `.git` HEAD 직접 읽기로 `hani/qa-history-unify` 확인.
- base SHA: `1ff9c9346b36a70fa90694618a7189523add52ec`. `hani/qa-easy-cleanup` ref와 동일. Git subprocess 없이 ref를 읽었으며 ancestry·원격 최신성은 미검증.
- 승인 근거: 사용자 Task의 카탈로그 보완·공유 조회·Node 검사·인수인계 작성. commit/push/merge/배포·표시 버전·cache 변경 금지. 미커밋 보존.
- 범위: 공통 release JSON, 기존 개발센터·조직 허브·AI 업무 조회 renderer, 신규 Node 테스트·릴리스 체크 문서. 작성된 개발 보고서는 보존.
- 보호 경계: 저장/state/Cloud/Supabase/schema 변경 없음. office-live JS/CSS·building 데이터 미수정. 새 runtime 파일 없음.
- CODEMAP_MISS: 연혁·AI 업무 전용 anchor 없음. 실제 HISTORY, loadHistoryReleases, loadAiTeamStatus, teamMeta 경로만 targeted 조사.

## 결과와 증거

- 제공 근거: worktree 밖 `qa-b3-releases.txt` (main sha|date|subject). 제목 외 기능 세부사항·담당자 추정 금지.
- 정적 표시 버전 2.9.245, 마지막 script 선언 `./hani-launch-greeting.js`. 실제 브라우저 로딩과 구분.
- 카탈로그: v2.9.224~245 **22건 추가**, 전체 **117건**. asOf `2026-11-01`, base `c7b2c202eb9eed0d2ebc7449525c1d913ddf8ebf`. 날짜·source commit·subject는 제공 목록과 일치하며 짧은 제목·분류 외 기능 설명이나 담당자를 추정하지 않음. 신규 credits 전부 빈 배열. 근거 목록은 `scripts/fixtures/history-unify-releases.txt`에 보존.
- 새 구간 v224~245에는 누락 버전 없음. 기존 빈 구간 v124·130·140·141·142·143은 기존 카탈로그와 제공 목록 모두 항목이 없어 `excluded`에 사유 추가. 기존 v176·179·182의 후보/작업 이력만 있고 main 배포 근거 없음 사유는 그대로 보존. v120~245는 각 버전이 release 또는 명시적 excluded 중 하나에 속함.
- 기존 회사 연혁의 `loadHistoryReleases`를 공유 API `window.HaniReleaseCatalog.load`로 공개. literal `fetch('./assets/data/hani-history-releases-v1.json',...)`는 조직 허브의 한 곳만 유지. cached Promise를 회사 연혁·개발센터·AI 업무가 함께 사용. 기존 validation 보존.
- 개발센터·홈: 기존 HISTORY 배열 원문 보존. 카탈로그 우선 id 병합, 날짜 내림차순·동일 날짜 numeric version 내림차순. P0/Workflow/Meeting Preview 등 카탈로그에 없는 기록 보존. persistent shell과 기존 필터 handler 유지. 실패 시 기존 목록과 짧은 안내. 소스 subject/commit만 변경 설명·참조로 사용.
- AI 업무: 요약의 운영 버전·릴리스 날짜는 최신 released 항목을 사용. 구성원 카드·상세에는 `업무 내용은 2026-10-16 기준` 표시. 과거 작업 본문·개인별 now/recent/next·JSON 두 파일은 그대로이며 과거 문장에 포함된 당시 버전도 보존. 릴리스 조회 실패는 최신 버전 추정 없이 안내.
- 개발 보고서: 작성된 보고서 카탈로그와 본문 byte 동일. 월간 작성 작업 변경 없음.
- Coverage guard: `scripts/hani-history-coverage.test.mjs`는 One-Pass의 `versionSnapshot(index.html).title`로 표시 버전을 읽음. 현재 v245 PASS, 임시 index의 v246은 실제 CLI exit 1과 파일 갱신 안내 확인. 가짜 버전은 운영 파일에 쓰지 않음.
- 체크리스트: `dev-center/one-pass-release.md`에 릴리스 커밋에서 카탈로그 항목 작성 및 AI 업무 JSON 원본·twin 갱신 규칙 추가.
- 안전 검증: index·AI 업무 JSON 2개·office-live JS/CSS byte 동일. main은 AI 업무 표시 owner 밖 prefix/suffix byte 동일(저장·월간 보고서·작성 보고서 포함). 기존 HISTORY 배열·기존 카탈로그 95건 원문/값 동일. runtime closure **변경 전후 목록 동일 128개, missing 0**. `.git` index를 읽기만 하여 확인한 기존 tracked 변경은 아래 8파일뿐. index/ref 쓰기 없음.
- 미검증: 브라우저·Git subprocess 차단으로 실화면·원격 main 최신성·Production read-back 미수행.
- main 병합 / Pages / 운영 read-back: 모두 미수행.

## 다음 담당에게

- 서윤: 미커밋 diff 검토 후 허용된 브라우저에서 회사 연혁·개발센터·AI 업무 화면을 확인.
- protected release gate는 변경하지 않음. 아래 YAML 추가 위치와 미검증 항목 확인.
- Notion: 현황판 조회 성공. 착수 내용 append는 자동 승인 검토가 `approval policy is never`로 거절하여 미반영. 최종 내용과 함께 갱신 대기.

## 변경 파일

- 기존 runtime 4개: `assets/data/hani-history-releases-v1.json`, `hani-development-history-v1.js`, `hani-organization-hub.js`, `hani-main.js`.
- 기존 테스트 3개: `scripts/hani-history-226.test.mjs`, `scripts/hani-ai-work-status.test.mjs`, `scripts/hani-polish-215.test.mjs` (변경 사유 아래).
- 신규 개발 테스트 2개: `scripts/hani-history-coverage.test.mjs`, `scripts/hani-history-unify.test.mjs`. 새 runtime 파일 아님.
- 근거 fixture 1개: `scripts/fixtures/history-unify-releases.txt` (사용자 제공 원문 24줄).
- 문서: `dev-center/one-pass-release.md`, 이 인수인계, `docs/development-history/CURRENT.md` 상단 요약. 다른 담당 기록 보존.
- 실행 증거: `artifacts/qa-history-unify/node-results.json`. 관련 테스트가 작성하는 기존 artifacts 경로의 결과도 참고. 결과 artifact는 runtime에 포함되지 않음.

## 검증 명령과 결과

환경 Node `v24.20.0`, Windows sandbox. 아래는 최종 파일 내용에 대한 결과이며 중간 실패를 수정한 뒤의 재검증이다. `node --test`는 자식 프로세스 spawn EPERM이라 Node test 파일을 `node scripts/<file>`로 직접 실행했다. 테스트를 skip하거나 약화하지 않았으며 browser 모드는 별도 미검증으로 구분했다.

### 지정·신규 검사: 7명령 통과 / 0실패

| 명령 | 통과 / 실패 |
| --- | --- |
| `node scripts/hani-history-unify.test.mjs` | **14 / 0** (실제 merge/mount/filter/shared loader/AI renderer/guard, late owner와 fetch failure 포함) |
| `node scripts/hani-history-coverage.test.mjs` | **1명령 / 0**, v2.9.245 항목 존재 |
| `node scripts/hani-history-226.test.mjs --unit-only` | **1 assertion 묶음 / 0**, 실제 owner·월 필터·카운트·실패·클릭·read-only |
| `node scripts/hani-ai-work-status.test.mjs` | **1 assertion 묶음 / 0**, 7명 실제 프로필 포함 |
| `node scripts/hani-polish-215.test.mjs --unit` | **4그룹 / 0** |
| `node scripts/hani-qa-easy-cleanup.test.mjs` | **12 / 0** |
| `node scripts/hani-qa-report-fixes.test.mjs` | **10 / 0** |

- `node --check <file>`: runtime JS 3개와 신규·기존 테스트 JS 5개, **8명령 통과 / 0실패**. 각 경로는 위 변경 파일 목록의 `.js`·`.mjs` 8개.
- 부정 검사: `node scripts/hani-history-coverage.test.mjs --index .tmp-history-newer.html` → **기대한 exit 1**, v2.9.246 없음 + `assets/data/hani-history-releases-v1.json` 작성 안내. 임시 파일 제거. 테스트 내부에서는 같은 CLI body도 VM으로 실행해 성공/실패를 검사.
- 변경 전 임시 스냅샷을 이용한 byte/closure 검증 **PASS**, 검사용 임시 스크립트 제거. 혼합 개행 main의 비변경 원문 유지. hub·history의 기존 LF 유지.

### 관련 추가 검사: 21명령 중 11통과 / 9실패 / 1미종료

아래 경로는 모두 `scripts/` 아래이며 명령은 `node <경로> <옵션>`이다. 실패한 검사를 PASS로 세지 않는다.

| 파일·옵션 | 통과 / 실패·미검증 |
| --- | --- |
| `hani-app-216-audit.test.cjs` | 7 / 0 |
| `hani-board.test.mjs` | 1 assertion 묶음 / 0 |
| `hani-building-206-engine.test.mjs` | 6 / 0 |
| `hani-building-206.test.mjs` | 21 / 0 |
| `hani-ilbo-213.test.mjs --unit` | 11그룹 / 0 |
| `hani-lounge-216.test.mjs` | 6 / 0 |
| `hani-lounge-ai-213.test.mjs` | 12 / 0 |
| `hani-lounge-qa-212.test.mjs` | 3 / 0 |
| `hani-milestones-v1.test.mjs` | 14그룹 / 0 |
| `hani-newstaff-215.test.mjs --unit` | 3그룹 / 0 |
| `hani-runtime-closure-ilbo.test.mjs` | 3 / 0 |
| `hani-brand-heroes-218.test.mjs` | 시작 실패 1: 기존 hero restore hunk drift |
| `hani-desk-mascots.test.mjs --unit` | 자체 assertion 묶음 실패 1 (`false !== true`); import된 office 검사 6/6 통과와 구분 |
| `hani-newface-217.test.mjs` | assertion 실패 1: 기존 daon desk anchor가 undefined 예상과 다름 |
| `hani-staff-floors-214.test.mjs --static` | 9 / 1 / browser skip 1: 기존 fixture의 `portraitSource is not defined` |
| `hani-nav-groups.test.mjs` | Git subprocess EPERM으로 완료 불가 1 |
| `hani-reviewed-release-baseline.test.mjs` | 0 / 14: 모두 Git subprocess EPERM |
| `hani-simplify-225.test.mjs` | Git subprocess EPERM으로 시작 실패 1 |
| `hani-ui-203b-ui.test.mjs --static` | import 단계 Git subprocess EPERM으로 시작 실패 1 |
| `hani-ui-203b.test.mjs` | Git subprocess EPERM으로 시작 실패 1 |
| `hani-board-guard.test.mjs` | 본문 PASS 출력 후 timer로 종료되지 않아 중단; **완료 PASS 아님** |

- Git 외 실패 4명령은 변경 전 스냅샷 파일만 read overlay로 읽는 방식으로 동일하게 재현했다. 수정 전후 동일 오류이며 이 작업에서 해당 테스트·owner·fixture를 고치지 않았다. 보호 Git gate의 실패를 우회하지 않았다.
- 순수 browser 검사 `scripts/check-organization-hub.mjs`, `scripts/hani-login-session-ui.test.mjs`와 mixed 테스트의 browser 모드, 연혁/업무 PC·휴대폰 화면은 sandbox 제한으로 미실행. 실제 overflow·색상·네트워크/콘솔·스크린샷 PASS 주장 없음.

## 기존 테스트 변경 사유 (3개만)

1. `hani-history-226.test.mjs`: 10/21 고정 fixture에서 같은 날짜 v224·225·226이 추가되어 최신 id v223→v226, 해당 시점 총95→98, 10월74→77, 접힘66→69로 **수치 기대값만** 갱신. browser assertion의 같은 수치도 갱신했으나 browser는 실행하지 않음. 날짜·필터·정렬·보호 검사 유지.
2. `hani-ai-work-status.test.mjs`: 공통 카탈로그가 없는 기존 VM에서 업무 JSON의 v214를 현재 운영 버전으로 표시하라는 오래된 assertion 한 줄을, 릴리스 조회 실패 안내 및 v214를 운영 버전으로 표시하지 않는 assertion으로 변경. 성공 시 v245/date 표시는 신규 실제 통합 함수 테스트가 검증.
3. `hani-polish-215.test.mjs`: 같은 VM의 `2026-10-16 · 운영 v214` 기대값만 릴리스 unavailable + 원래 업무 작성일 안내로 변경. v214 미표시도 검사. JSON 원본의 v214 assertion은 과거 원문 보존 검증이므로 그대로 유지. 실패 처리·프로필·그림·보호 assertions 미변경.

## 서윤: 보호 Gate 연결

`.github/workflows/hani-dev-center-self-protect.yml`의 protectedPaths에 기존 gate workflow가 포함되어 있어 **gate 파일은 수정하지 않았다**. 기존 `.github/workflows/hani-dev-center-gate.yml` 42행 self-test의 `run` 다음, 43행 `Build frozen runtime package` step 앞에 아래 step을 추가한다. 이 조건은 runtime 릴리스마다 누락 검사를 수행하고 문서 전용 경로는 제외한다.

```yaml
      - name: Check release history coverage
        if: steps.scope.outputs.docs_only != 'true'
        run: node scripts/hani-history-coverage.test.mjs
```

게이트 자동 연결은 현재 미완료이며 위 수정은 보호 Gate 절차에 따라 서윤이 검토해야 한다. 이 작업은 배포 승인이나 Gate 변경 승인을 포함하지 않는다.

## Notion 갱신 대기 내용

- 현황판에 이 작업의 구현 완료·서윤 미커밋 검토 대기, branch/base, 22개 릴리스 추가·제외9개, 공통 loader·업무 작성일 표시, 검사7명령/신규14/QA22/syntax8 통과, 추가 검사11통과·9실패·1미종료, browser·원격·배포 미검증을 반영할 것.
- 원문: 이 인수인계와 `artifacts/qa-history-unify/node-results.json`. PR 없음. commit/push/merge/배포 없음.
- 자동 승인 검토가 append 쓰기를 `approval policy is never`로 거절하여 저장/read-back 미완료. Notion 갱신 완료라고 보고하지 않음.
