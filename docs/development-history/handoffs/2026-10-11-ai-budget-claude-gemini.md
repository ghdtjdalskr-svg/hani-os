# AI 예산 Claude·Gemini 로컬 집계 보완

## 작업 식별
- 갱신 시각: 2026-10-11 KST / 담당 Codex
- 상태: 구현·targeted 집계/렌더 검증 완료 / Edge 화면 검증 차단 / 로컬 변경분 인계
- branch/worktree: `hani/ai-budget-claude-gemini`, `budget2`
- base SHA / 조회한 원격 main: `9f48074202b972f36dab3f15274227b261224b57` (재개 시 GitHub branches/main API 재확인, Git ls-remote는 연결 제한으로 실패). drift 없음.
- 중단 재개 점검: 6개 기존 수정 파일과 이 인수인계를 확인해 이어서 보완함. 이전 작성 내용 중복 생성/초기화 없음. 담당 Codex, 기존 2026-10-08 AI 예산 인수인계와 실제 owner 경로 확인.
- 범위: `scripts/hani-ai-budget-bridge.mjs`, `hani-ai-budget-core.js`, `hani-ai-budget.js`, CSS, 두 targeted test 및 이 인수인계.
- 승인: 사용자 요청의 로컬 로그 읽기/집계·UI·테스트. 원문 전송/저장 금지, 커밋 금지, 버전/캐시 증가 없음.
- 위험 등급: NORMAL. 생활키·Cloud·auth·schema·migration·로그인 자동 실행 설정 변경 없음.
- CODEMAP_MISS: codemap에 AI budget anchor 없음. 실제 owner: bridge collect/createBridge → core normalize/merge → UI render/기존 delegated click/form 이벤트.

## 결과와 증거
- bridge `collectSummary`와 기존 `createBridge` refresh 경로에 두 로컬 집계기를 연결. Codex 조회 실패에도 확인 가능한 로컬 집계 반영, 실패한 provider의 기존 요약 보존.
- Claude JSONL: 최근 5시간/7일 입력+캐시·출력 토큰, assistant 응답 수, 마지막 활동. 메시지 ID는 메모리 내 해시로 중복 제거하고 요약에는 저장하지 않음. 최근 수정 파일에 포함된 과거 기록과 기존 일별 최대값으로 최대 28일 개인 5시간 최대 사용량 보존. 처음 수집할 때 미수집 과거 전체 기록의 복원은 보장하지 않으며 UI에 수집된 기록 기준 표시.
- Claude 공식/수동 한도와 로그 집계는 시각을 독립 비교. UI 새로고침·statusline/import 시 최신 한도와 기존 토큰 집계 보존. 수집 중 별도 기록이 저장되는 경우에도 저장 직전 요약을 다시 읽어 병합. 한도 기록 없으면 구독 % 표시 없음.
- Gemini session JSONL와 logs.json의 user timestamp 집계, 프로젝트+시각으로 중복 제거. Pacific midnight/DST 기준 오늘·7일·마지막 요청·KST 초기화, 무료 CLI 20회 기준 %만 표시. 프롬프트 수 추정이며 실제 API 재시도/도구 호출과 다름을 명시. Gemini Pro 웹/앱 한도와 구분.
- 두 로그 수집기 공통: mtime 최근 8일 파일만 열기, 파일당 8MiB/서비스당 64MiB/최대 500파일/디렉터리 깊이·항목 제한. malformed line 건너뛰기, 큰 JSONL은 tail의 완전한 행만 읽기, 빈 파일 건너뛰기. 부분 수집은 카드에서 안내. 로그 원문에 쓰기 없음, 집계 요약은 숫자·시각·allowlist 메타데이터만 보관.
- 기존 Codex 주력/보조 카드 유지. Claude 개인 비교 막대·Gemini CLI 무료 카드 및 도움말 추가, 기존 이벤트 경로 사용. 기존 대기 RPC Map 정리를 delete 순회로 바꾸어 `.clear(` 호출 없음.
- 로컬 표시 버전 `2.9.201`, index 마지막 UI JS `hani-ai-budget.js?v=2.9.201`. 운영 실제 로딩 미검증.
- Node `v24.20.0`, 실행 파일 `C:\Users\홍성민\AppData\Local\Programs\nodejs\node.exe`.
- `& '<node.exe>' scripts/hani-ai-budget.test.mjs`: PASS. fixture JSONL/JSON의 5시간·7일 경계, 4주 최대/만료, malformed/중복, Pacific 표준시·서머타임·23/25시간 날짜·자정, mtime/읽기 용량/빈 파일, 원문 비보존·로그 불변, 수동/statusline 및 수집 중 기록 보존, 서버 GET/CORS/refresh/실패 보존 검사.
- 같은 테스트에서 실제 UI JS를 Node VM의 격리 DOM 어댑터로 실행: 네 슬롯·토큰/응답 수·개인 막대·CLI 요청수/%·KST 초기화·수동 제출 후 자동 갱신·가져오기 입력 제거·생활키 불변 PASS. 실제 DOM/레이아웃 검증과 구분.
- `& '<node.exe>' scripts/hani-ai-budget-browser.test.mjs 'C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs' 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'`: 실행 시도, FAIL/BLOCKED `browserType.launch: spawn EPERM`. 최종 코드에서도 같은 차단 확인. Edge 프로세스를 시작하지 못해 390/1440 실제 화면·DOM·넘침·스크린샷 미검증. 과거 QA 이미지는 이번 변경의 증거로 재사용하지 않음.
- 변경 JS 5파일 `node --check`, `git diff --check`: PASS.
- 실제 홈 로그는 `collectLocalUsage`로 읽기만 수행하여 두 서비스 집계 생성 확인. 개인 사용량·원문은 이 문서/Notion에 복사하지 않음. Claude는 용량 제한에 따라 부분 집계, Gemini는 제한 플래그 없음.
- 생활키/new storage key/내부 기준 버전/Cloud write/schema/auth/migration 변경 없음. 별도 AI 요약의 기존 키 유지. 버전·캐시 증가는 기능 탭 규칙과 사용자 요청에 따라 미수행(열차 담당 범위).
- Candidate/build/독립 HINA/실제 인증/Android/main/Pages/Production read-back: 미실행. 서버 변경 N/A.

## 다음 담당에게
- 먼저 읽을 파일: 위 owner 파일과 테스트.
- 서버 Edge Function 없음. 기존 로그인 실행되는 로컬 Node 도우미가 변경된 bridge를 다시 로드해야 적용됨.
- 사용자 요청으로 커밋/push하지 않음. 정식 탑승 등록 전인 로컬 변경분이며 PR 없음. 배포 담당이 변경분 인수 후 열차 통합·gate·승인·배포 필요.
- 다음 행동: Edge 실행 가능한 검증 환경에서 위 browser test를 실행해 실제 화면 근거 확보 후 배포 담당에게 인계. 기존 로그인 도우미 프로세스는 이번 작업에서 재시작하지 않았으므로 새 bridge 코드의 상시 프로세스 적용도 배포 담당 확인 필요.
- Notion 갱신 대기: 재개 시 현황판 읽기 성공. 이전 실행에서 쓰기 도구가 approval policy never로 거부되었으며 같은 승인 정책이 유지됨. 계획·최종 구현/검증·화면 차단·미커밋 상태·기준 SHA·이 문서 원문 링크를 현황판에 반영해야 함. 쓰기/읽기 확인 완료로 보고하지 않음.
- CURRENT 공통 파일은 다른 담당 기록 보호를 위해 수정하지 않고 작업별 인수인계로 전달.
