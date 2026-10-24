# train233 잔여 2종 원인·수정·검증

2026-10-24 KST / Codex 단일 Agent / `hani/train233-verify` / 시작 HEAD `18916a02c82e1ff06e7598b8b2b94166b2010080`.

**최소 수정과 Node targeted 검증 완료. 수정 후 Edge·실화면은 미검증.** 기존 `artifacts/train233-browser-3/`의 Remote 3종·PWA PASS는 시작 HEAD의 결과이며 수정 후 PASS로 재사용하지 않는다. Edge 실행·다른 프로필·CDP·브라우저 우회 없음.

## 분류와 실제 수정

| 실패 | 분류 | 원인과 수정 | 남은 검증 |
|---|---|---|---|
| QA UI `1440/tasks taskDue clientWidth=139` | B: 날짜 CSS의 테두리 여유 부족 | 기존 owner는 140px track + 6px gap + 40px toggle = 186px. 검사는 테두리를 제외한 clientWidth다. 입력 track/min-width를 144px, wrapper/task/form 최소 폭을 190px로 맞춤. native 좌우 2px border까지 제외해도 clientWidth 140px를 확보하는 계산. padding 8px는 clientWidth에 포함되며 그대로 보존. 기존 선언 4줄만 변경 | 실제 computed border·grid 할당·반올림 및 390/412/1440 cream/black 실측 필요. 현재 환경의 계산만으로 UI PASS를 선언하지 않음 |
| settings225 `all original control attrs, property handlers and conditional handlers preserved` | A: 비교 fixture가 승인된 QA handler까지 제거 | before 페이지가 `readReviewedCurrentSource`로 main의 QA 통합까지 역변환하여 `goalRegistryApprove`의 `saveEntry` wrapper를 없앰. **main만 현재 통합 소스에서 settings presentation을 되돌리고**, HTML/CSS의 겹치는 presentation hunk는 기존 exact oracle을 유지. `shapes` 전체 deepEqual 및 event registration 비교 assertion은 그대로 | 수정된 before/candidate 실제 Edge 비교·mapped IDs·원래 action dispatch는 미실행 |

날짜 assertion `width >= 140`, overflow 허용치 및 PWA 검사는 완화하지 않았다. QA UI에 412px와 해당 home/tasks의 view overflow 검사를 추가했다. 다음 실행에서 border-box/clientWidth/border/padding/wrapper/grid tracks/gap/parent tracks와 view 폭을 결과에 함께 남긴다. 412px의 home viewWidth 380은 viewport가 아니라 실제 view 폭으로 비교해야 한다.

## 설정 handler·CRITICAL 경계 확인

- 현재 main의 `saveEntry` onclick 등록은 총 **42개**, 설정의 정적·계획된 조건부 ID와 교차한 대상은 **`goalRegistryApprove` 한 개**다. 전체 ID 목록은 [audit.json](audit.json)에 있다.
- 설정에 속한 property handler 등록 **36개**를 승인 release 원문과 비교했다. `goalRegistryApprove` 외 등록 owner/순서·handler는 동일하다. 해당 컨트롤의 wrapper 두 번째 인자(실제 기존 handler)는 **모든 바이트가 원문과 동일**하다. 이 승인 handler는 목표 저장/삭제 Preview 양쪽에서 원래 사용되며, 처리 내용은 수정하지 않았다.
- 해당 guarded 등록은 고정 QA commit `688c6a4e4bf779022ba97daa60414856acb02ca3`와도 정확히 같다. 원본/부모 main은 Git archive로 읽고 blob ID를 대조했다. 기존 backup/restore/reset/import/export/media/delete handler에 새 wrapper를 추가하지 않았다.
- `save`, `commit`, `freshState`, `normalizeState`, `exportData`, `bindCloudBridgeControls` 원문 동일을 검사했다. 이번 수정에서 main 전체를 포함한 JS7개·Remote CSS·index는 시작 HEAD의 바이트/EOL과 동일하다. 신규 runtime JS/event/renderer layer 0개.
- 실제 binding과 실제 내부 승인 handler를 VM에서 실행했다. 승인 시 synthetic save spy 1회, draft 제거 후 재클릭 시 추가 호출 0회, invalid 입력·stale draft·취소 시 save 0회, 실패 시 원래 registry 참조 복원, 재진입 시 내부 handler 1회, 정상/예외 후 disabled·aria-busy 해제를 확인했다. 기존 QA10은 실제 책/시청 async save의 pending 중복 차단·reject/retry·버튼 교체 후 release까지 검사한다.
- VM에는 storage/Cloud/network가 없으며 save는 메모리 spy다. 브라우저 설정의 confirm/삭제/복원 action이나 운영 데이터는 실행하지 않았다. 실제 저장·Cloud 왕복을 PASS로 보고하지 않는다.
- handler 비교를 무조건 통과시키는 일반 normalization/예외는 추가하지 않았다. 잘못된 버튼, 내부 handler 변경, export에 추가 wrapper, guard 제거를 주입하면 새 전용 검사에서 거절된다.

## Exact baseline과 증거 공급

`train233-integrations.json`의 기존 속성·integration SHA·fragment·hash는 그대로 보존했다. `browserResidual`에 **고정 18916a0 원문 → CSS 4줄 보정**만 추가했다. 전체 CSS SHA-256은 `8f3fc89d4a4138dce379f5ffd194505048aea85b8e395a0ada5c24246decb10b`. 최신 date delta → 기존 18916a0 보정 → f27be17 → 원래 integration 순으로 역변환한다. Git oracle, 과거 release chain과 내부 baseline은 변경하지 않았다. before/after full hash·양방향 exact delta·누락/중복/변조/위치/EOL 검사를 유지한다.

Node의 Git subprocess는 기존과 같이 `spawnSync git EPERM`으로 차단된다. 직접 실행을 PASS라고 표시하지 않는다. [test-only loader](git-snapshot-loader.mjs)는 shell `git archive` 원문 **123개**를 `git ls-tree` blob ID와 대조한 뒤 고정 `git show` 입력만 공급한다. 원래 test body/assertion은 그대로 실행한다. runtime reader에 우회 코드를 넣지 않았다. [manifest](snapshot-manifest.json).

## 실제 실행한 검사

| 명령 | 결과 |
|---|---|
| `node --test --test-isolation=none scripts/hani-qa-1st.test.cjs` | 직접 실행 10/10 PASS. [로그](qa-node.log) |
| `node --import ./artifacts/train233-two-failures/git-snapshot-loader.mjs --test --test-isolation=none scripts/hani-reviewed-release-baseline.test.mjs scripts/hani-settings-225-qa-guard.test.mjs` | 12 + 3 = 15/15 PASS, 검증된 Git 추출 입력 사용. [로그](reviewed-and-guard.log) |
| 위 loader + `--test --test-isolation=none scripts/hani-ocr-accuracy-224.test.mjs` | 14/14 PASS, 실제 OCR/Cloud 미호출. [로그](ocr.log) |
| 위 loader + `scripts/hani-settings-225.test.mjs --static` | Node 4묶음 PASS: exact delta/syntax/write/version, status projection/write0, static ID127·planned109/control/notice, 설정 guard36. browser 미실행. [로그](settings-static.log) |
| `node --import ./artifacts/train233-two-failures/safety-path-loader.mjs scripts/hani-qa-1st-safety.mjs artifacts/train233-two-failures/base` | PASS. 실제 18916a0 raw baseline과 이번 diff 사용, 이전 증거 파일을 보존하기 위해 diff/output 경로만 공급. runtime JS7 syntax, canonical persistence·storage/Cloud·version/cache 불변, graph68·기존 중복8 보존, unchanged16,893줄/EOL. [결과](safety-results.json) |
| 위 Git loader + `artifacts/train233-two-failures/audit.mjs` | PASS. JS7+Remote CSS+index 원문 동일, 수정 tracked 파일 unchanged2,744줄/EOL 보존, QA 원본 등록 일치, 이전 fixture 내용 동일. [결과](audit.json) |
| 수정/신규 검사 JS6개 `node --check`, `git -c core.whitespace=cr-at-eol diff --check` | PASS |
| 최종 결합 실행: 위 Git loader + reviewed/settings guard/OCR/QA 4개 test 파일 | **39/39 PASS**, 실패0. [최종 로그](final-targeted.log). QA10 직접 실행 결과도 별도로 보존 |
| Edge/스크린샷/Preview | 미실행, 새 PNG 0. UI/AA/실측·browser action dispatch 미검증 |
| Candidate build/One-Pass/HINA/Production | 요청 범위 밖, 미실행 |

## Git·다음 행동

- `git -c core.autocrlf=false add -- <수정파일 명시>` 1회가 `.git/worktrees/t233/index.lock: Permission denied`로 실패했다. commit 미실행, HEAD18916a0 유지. 재시도·권한 우회·직접 index 조작 없음. push/PR/main/배포/Notion 작업 0. 원문 snapshot/tar는 stage 대상에서 제외했다.
- 원격 main 조회 연결 실패. 로컬 origin/main `a1e97d77d611a698e9dcd203510d54541b301a7c`만 확인, merge/rebase 없음.
- 로컬 표시/cache 2.9.232 및 마지막 script `hani-launch-greeting.js` 보존. 열차 목표 2.9.233과 운영 확인을 구분한다. Production 표시·실제 로딩은 이번 작업에서 미확인.
- 다음 담당: Edge 허용 환경에서 QA UI와 settings225 browser 검사 재실행. 390/412/1440의 날짜 폭과 overflow, 특히 412 home view 폭을 확인하고 관련 PWA targeted regression을 실행한다. UI가 확인되기 전 잔여 실패 전체 해결/Release PASS로 보고하지 않는다.
- Notion은 이번 대표님 명시 금지로 미갱신. CURRENT/DECISIONS 및 타 담당 기록 보존.
