# AI budget Antigravity 후속 개발

## 작업 식별
- 갱신 시각(KST): 2026-10-11 / 담당 Codex
- 상태: 구현·targeted 테스트 완료 / 실제 화면·live 조회 미검증 / NORMAL
- branch/worktree: `hani/budget3-20261011` / `budget3`
- base SHA: `7d77f2307b424ea1be6c8907356b58082ba1c658`
- 원격 main: GitHub branches/main API `9f48074202b972f36dab3f15274227b261224b57` 확인. git ls-remote 네트워크 제한 실패. budget2 commit `75c68d3`은 현재 기준선에 포함, main에는 아직 미포함.
- 로컬 표시 버전/마지막 UI JS: `2.9.201` / `hani-ai-budget.js?v=2.9.201`. 운영 로딩 미검증.
- 목표: agy TSV 수집, Google AI Pro 및 Antigravity Claude/GPT 잔여 한도·KST reset, 시간당 1회·60초 timeout·실패 보존.
- 수정 범위: 기존 bridge/core/UI, 관련 fixture 및 targeted test, 운영 안내. CODEMAP_MISS: budget anchor 없음; 실제 collectSummary/createBridge → core normalize/merge → 기존 render 및 delegated event owner 확인.
- 사용자 승인: 구현·테스트, 커밋 금지·버전 변경 금지. main 병합/배포 승인 없음.

## 결과와 증거
- 변경 파일: `scripts/hani-ai-budget-bridge.mjs`, `hani-ai-budget-core.js`, `hani-ai-budget.js`, `index.html`, 두 기존 테스트, 신규 `scripts/hani-ai-budget-antigravity.test.mjs`와 `scripts/fixtures/hani-antigravity-usage.tsv`, `dev-center/ai-weekly-budget.md`, 이 인수인계. 새 배포 runtime 파일 없음.
- collector: LOCALAPPDATA 우선/PATH fallback, shell 없이 `agy -p /usage`, 60초 timeout·64KiB stdout 한도·stderr 비보존. 두 service의 complete weekly/session 관측만 반영. malformed/out-of-range/중복 충돌은 실패 안내, 기존 요약 보존.
- 실행 제한: 전용 private cache에 CLI 시작 전에 attempt 시각 예약; 실패/재시작에도 시간당 1회. 실행 중 Map single-flight 및 exclusive lock. 캐시 재사용으로 관측 시각을 새로 만들지 않음. 실패/불완전 서비스는 기존 완전 관측 유지.
- UI: Google AI Pro 및 Antigravity Claude/GPT 카드, 주간·5시간 잔여율/초기화 KST, CLI 무료 카드는 보조로 유지. 설치/로그인 미완료/timeout 안내. 기존 renderer와 이벤트 경로만 수정, 새 DOM ID/event layer 없음. 브라우저 대기 80초로 CLI timeout과 기존 수집 대기 포함.
- Node `v24.20.0`, `C:\Users\홍성민\AppData\Local\Programs\nodejs\node.exe`.
- `& '<node.exe>' scripts/hani-ai-budget-antigravity.test.mjs`: PASS. 제공 TSV fixture의 remaining→used, weekly/session/reset, ANSI/CRLF/malformed/percent range/duplicate, LOCALAPPDATA/PATH/missing, subprocess args/no shell/hidden/timeout/output cap, 시간당 cooldown/concurrency/persisted cache/실패 보존, 불완전 관측 보존, 실제 bridge GET endpoint, 실제 UI JS VM의 6카드/KST/expired/안내/생활키 불변 검증.
- `& '<node.exe>' scripts/hani-ai-budget.test.mjs`: 기존 회귀 PASS. CLI 외부 실행 없는 fixture 주입. Claude/Gemini local log bounded collection 및 수동 한도/bridge/렌더 회귀 유지.
- 변경 JS 6개 `node --check` 및 `git diff --check`: PASS.
- HEAD 대비 ID literal·생활키 참조·`.clear(` 호출 수·index 캐시태그 불변 guard PASS. Node 내부 subprocess로 git을 읽는 보조 guard는 spawnSync EPERM으로 실행되지 않아, 같은 비교를 PowerShell에서 수행해 확인함.
- 실제 UI 시도: `& '<node.exe>' scripts/hani-ai-budget-browser.test.mjs 'C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs' 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'` → BLOCKED `browserType.launch: spawn EPERM`. 테스트에는 390/1440 6카드·TSV 잔여율/KST·실패 안내·ID 중복·overflow 검사 추가했으나 브라우저 실행/화면/스크린샷 PASS 아님.
- 실제 collector 1회 시도: 실행 파일 존재 확인, `collectAntigravity()`는 `antigravity_usage_unavailable` 반환. 실제 로그인된 agy 출력 read-back은 미검증. 개인 한도/로그인 출력 복사 없음. 실패 시 기존 요약을 보존하고 시간당 제한 예약됨. 이 worktree 전용 Git 제외 cache 생성.
- `hani_os_life_v23` 및 내부 데이터 기준 버전·Cloud write/schema/auth/migration 변경 없음. 기존 AI 요약키 write 로직 유지. 버전/캐시태그 변경 없음(기능 탭·사용자 규칙).
- Candidate/패키지/One-Pass/독립 HINA/실제 로그인/Android/main/Pages/Production read-back 미실행. 서버 Edge Function 변경 N/A.
- Notion 계획 갱신 시도: 읽기 성공, 쓰기 도구가 `MCP tool call requires approval, but approval policy is never`로 거부됨. 갱신 대기.

## 다음 담당에게
- 먼저 읽기: bridge `parseAntigravityUsage/findAntigravity/readAntigravity/collectAntigravity/collectSummary/createBridge`, core slots/normalize/windowState, 기존 UI render/refresh.
- 다음: CLI/Edge 실행 가능한 환경에서 live usage read-back 및 browser test 실행 후 Claude 배포 열차에 인계. bridge는 기존 로컬 Node 도우미 재시작 후 반영되며, 이 작업에서는 상시 프로세스 재시작/로그인/자동 실행 설정 변경 없음.
- 사용자 커밋 금지 요청에 따라 로컬 미커밋 변경분으로 인계. commit/push/PR/merge/배포 없음. 정식 탑승 등록 전이며 변경분 인수와 열차 gate·최종 승인 필요.
- Notion 갱신 대기: 계획/최종 구현·검증·미검증/기준 SHA/로컬 미커밋 상태/이 문서 원문을 현황판에 기록해야 함. 도구가 승인을 요구하고 현재 approval policy never라 쓰기 거부, 저장·읽기 확인 완료로 보고하지 않음.
- CURRENT 공통 기록은 다른 담당 기록 보호를 위해 유지.
