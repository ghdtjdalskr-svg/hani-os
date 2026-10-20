# int-222 통합 회귀 6건 · 도연

## 작업 식별

- 갱신: 2026-10-20 KST. 담당 도연(Codex), 단일 Agent. 상태 진행 중.
- branch/worktree: `hani/int-222` / `int222`.
- 시작 HEAD: `22d41802ce7f42ee121e705bfa801f54997937c3`.
- 로컬 origin/main: `3919a257abec42b4b6ea68ecc9b9d6e68431cf47` (v2.9.221). 원격 Git 조회는 연결 차단으로 최신성 미확인. merge/rebase 없음.
- 승인: 대표님 요청의 비의도 EOL 복원, QA210 정확한 assertion 수정, brand218/office219에서 승인된 launch 네 연결만 허용, 지정 Node 검사와 커밋 시도. 버전/cache·Cloud·storage·main·배포 변경 없음.
- 범위: `hani-main.js`, 필요 시 `index.html` 삽입행 EOL, 지정 test 및 기존 launch preservation helper, 이 인수인계. 기존 타 담당 QA 산출물 보존.
- CODEMAP_MISS: photo-backup/launch-greeting 항목 없음. 요청된 owner와 테스트의 실제 assertion으로 fallback.

## 결과와 증거

- 계획: origin/main 원문 blob과 라인 단위 바이트 비교 → 비의도 EOL 복원 → 허용 연결을 정확히 확인/제거한 나머지 전체 index 바이트 보존 → 지정 Node 회귀.
- 원격 최신성·Production 실제 로딩/read-back 미검증. 브라우저 부분은 서윤이 재실행.
- Notion 계획 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 계획/최종 결과 갱신 대기는 이 문서에 보존.

## 다음 담당에게

- 지정 회귀와 바이트 비교 증거를 확인하고 서윤 실제 Edge 재검증으로 연결. Candidate/배포는 요청 범위 밖.

## 최종 구현·검증 · 2026-10-20 KST

- 구현/Node targeted 검증 완료. 원격 최신성 보완: GitHub 연결 도구 `git/ref/heads/main`의 SHA가 로컬 `3919a257abec42b4b6ea68ecc9b9d6e68431cf47`과 일치. 그 blob의 표시 `v2.9.221`, 마지막 JS `hani-ai-budget.js?v=2.9.221` 확인. 실제 Production 로딩 검증은 아님. 통합 index의 마지막 추가 JS는 `./hani-launch-greeting.js` 유지.
- `hani-main.js`: `driveVaultContext` 선언/return, `HANI_DRIVE_BACKUP` 선언/context 총4줄에 누락된 CR 바이트만 복원. 작업 시작 HEAD 대비 **4바이트 추가 외 동일**, 사진 adapter 로직 변경0. origin/main 대비 사진 기능의 의도된 내용 변경3 hunk 외 **8,380줄 전체 바이트/EOL 일치**.
- `index.html`: 인사 label/template/script 3줄의 LF를 앞 삽입 anchor와 같은 CRLF로 복원. CSS 삽입행은 이웃 stylesheet block과 같은 LF 유지. 그 외 시작 HEAD 바이트 변경0.
- 중요한 원문 차이: main에는 사진 UI가 아직 없으며 시작 HEAD에는 `5b71e63`에서 이미 커밋된 사진 UI도 존재. 따라서 **‘인사 네 연결 외 모두 main과 동일’은 원래 성립하지 않음**. 사진 UI를 삭제하지 않고, 기존 사진 UI의 정확한4행 변환(안내/버튼 교체2, 설명/상태 삽입2)과 인사 네 연결을 검증해 제거한 나머지가 origin/main과 전체 바이트 동일함을 확인.
- brand218/office219: 기존 launch helper로 CSS·토글·template·script 각각 정확히1개 필수. 새 `hani-photo-backup-222-preservation.mjs`로 기존 사진 UI의 전체 문구/마크업/EOL과1회 존재를 검증. 나머지 전체 index 바이트와 기존 route/control·기타 owner 검사는 유지. 임의 ID whitelist나 광범위 regex 삭제 없음. 기존 launch helper 자체 원문은 변경 없음.
- QA210의 정확한 최초 실패: `scripts/hani-qa-210.test.mjs:96`, `HANI_DRIVE_VAULT_CORE` 키 deep-equal. 승인된 사진 기능 export `safeTitle`, `writePhotos` 두 개만 기대 배열에 추가. public schedule/readStatus 및 board attachment 금지 assertion 유지. 스타일·스크립트 목록 실패가 아니었음.
- byte-audit의5개 부정 검증: 관계없는 body 속성, 잘못된 토글 ID, 잘못된 CSS URL, 잘못된 사진 버튼 ID, 추가 script가 모두 거절됨. 런타임·테스트·문서 모두 byte-preserving 범위 편집.

### 실행 결과

명령: `$env:HANI_GIT='git'; node --import ./artifacts/int-222-regression/git-read.mjs scripts/<파일>.test.mjs`.
Node의 Git 하위 프로세스는 실제 `spawnSync git EPERM`으로 차단됨. host PowerShell Git으로 **140개 ref/file 원문을 export하고 `git hash-object --no-filters`가 원본 blob SHA와 동일함을 각각 검증**한 후 adapter로 Git 읽기만 공급. assertion/runtime은 그대로 실행. `snapshots.json`, `export.ps1`, `git-read.mjs` 및 개별 로그를 `artifacts/int-222-regression/`에 보존. 이 증거 디렉터리는 커밋 대상에서 제외.

| 요청 검사 | Node 결과 |
|---|---|
| hani-login-a-204 | PASS, 원본 보호/EOL 검사 포함 |
| hani-proactive-204 | 21 PASS |
| hani-qa-210-followup | 14 PASS |
| hani-qa-210 | 9 PASS |
| hani-brand-heroes-218 | 3 PASS |
| hani-office-219 | source/model PASS, 공통 engine 검사 포함 |
| hani-launch-greeting-221 | **Node counterpart `hani-launch-greeting-221-unit.test.mjs`: 36 PASS** |
| hani-office-actions-221 | 20 PASS |
| hani-photo-backup-222 | Node PASS, inline/ref·중복·증분·누락·충돌·MIME·해시·guard |
| hani-egress-fix | Node 25 시나리오 PASS, 보호 함수 main 바이트 비교 활성화 |

- 위 결과 exit0 모두10종. 공통 imported tests는 중복될 수 있으므로 합산 총계로 보고하지 않음. `results.json`, `final-*.log` 참조.
- `node artifacts/int-222-regression/byte-audit.mjs`: PASS (`byte-audit.json`, `main-content.diff`). 모든 비변경 main 라인 순서/바이트, index 전체 바이트, 삽입행 EOL,5개 부정 검증 포함.
- 변경 JS/test/helper5파일 `node --check`: PASS. `git -c core.whitespace=cr-at-eol diff --check`: PASS. 기본 diff check는 원래 CRLF 복원을 trailing whitespace로 오인하므로 CR-at-EOL 설정으로 검사.
- 미검증: `hani-launch-greeting-221.test.mjs`는 브라우저 전용이므로 여기서 PASS로 계산하지 않음. launch·office-actions·photo-backup·egress 및 기존6개 관련 실제 Edge 부분은 **서윤 재실행 대기**. 화면/클릭/캡처/console을 새로 PASS 처리하지 않음.
- 데이터·보호 저장소·Cloud·schema·auth·버전/cache 의미 변경0. 서버 Edge Function·설정·배포 순서 변경 없음. Candidate Build/One-Pass/HINA/아린/Preview/PR/main merge/Pages/운영 read-back은 미수행(N/A: 기능 회귀 패치 범위). 기능 탭이므로 버전 증가는 N/A, 열차 담당 소관.
- 승인 범위는 이 회귀 패치 및 커밋 시도까지. 기존 QA 변경4파일과 기존 untracked 산출물은 커밋 대상에서 제외·보존.
- 다음 행동: 서윤이 동일 worktree 또는 이 변경을 가져온 branch에서 실제 Edge 재검증 후 배포 담당 열차에 인계. 권한 차단 시 커밋/push는 다음 담당이 수행.
- Notion 갱신 대기: 이번 정확한 실패 원인·수정·10종 Node PASS·바이트 비교·브라우저 대기·Git 시도 결과. 계획 append 자동 승인 거절로 저장/read-back 미완료. CURRENT에는 이 작업의 확인된 결과만 추가.

### Git 최종 결과

- 작업7경로만 `git add -- ...` 시도: **exit128**, 외부 worktree 메타데이터 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/int222/index.lock` 생성 Permission denied.
- 이어 같은7경로 `git commit --only -m 'fix: preserve integration EOL and exact approved UI deltas' -- ...` 실제 시도: **exit1**, add 실패로 신규 helper·인수인계 pathspec 미등록.
- HEAD `22d41802ce7f42ee121e705bfa801f54997937c3` 유지, staged diff 없음. 대표님 지시대로 **모든 수정 미커밋 보존**, push/PR/merge/배포 없음. Git 로그는 증거 디렉터리의 `git-add.log`, `git-commit.log`.
- CURRENT에는 이 결과를 추가. DECISIONS 정책 변경 없음. Notion은 자동 승인 검토가 거절한 상태이므로 우회 없이 갱신 대기 보존.
