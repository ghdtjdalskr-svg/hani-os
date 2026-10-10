# Relationship Seed 게시판 연결 인수인계

## 작업 식별

- 작업 ID / 제목: HANI-44 / 승인된 Relationship Seed 게시판 연결
- 갱신 시각(KST): 2026-10-10
- 담당 도구 / 검토 담당: 도연(Codex), 개발 Agent 1명
- 상태: 구현·V8 targeted 검증 완료 / 미커밋 로컬 인계 / Node·실제 브라우저 검증 대기
- 저장소 / branch / worktree: hani-os / hani/board-sync-guard / board-guard
- base SHA / candidate SHA: HEAD 2cf4545991bda9be9ce6a124aca8dbe14549da7f / 미생성. 원격 main 17dd426edb37403b5aa2a4fdd7a387973ff2ca03 API 조회 확인.
- 목표 / 완료 조건: JSON에서 runtime 생성·check, Seed 우선 페르소나/관련 참여/관계 호칭, Phase 3 에너지 보존 및 보드·Cloud 모의 회귀.
- 수정할 파일·범위: hani-board.js, index.html, hani-relationship-seed.js, scripts/hani-relationship-seed-build.mjs 및 테스트, 본 문서. 기존 작업 파일 보존. CODEMAP_MISS: 게시판 owner 항목 없음, 실제 함수 검색으로 확인.
- 사용자 승인 근거 / 승인되지 않은 경계: 대표님 2026-10-10 Seed 확정 및 이번 연결 요청. 커밋 금지, 버전/cache 증가·main 병합·배포 없음.

## 결과와 증거

- 변경: 승인 JSON에서 hani-relationship-seed.js를 생성하는 scripts/hani-relationship-seed-build.mjs 및 --check 추가. JSON의 18명·57관계 유지, JS/HTML delimiter와 line separator escape. index에서 같은 v2.9.200 패턴으로 보드 앞에 로드.
- 페르소나: voice/quirks/hobbies/axis/publicMode/privateMode/commentStyle/reactionTriggers/avoidTopics Seed 우선, 누락 필드는 기존 Archive/Editorial/roster fallback. 명칭·직급·팀은 roster 유지. Seed만 있어도 댓글 엔진 준비됨.
- 참여: 제목·본문·분류·소스 댓글 trigger 점수 + 글쓴이/참여자 관계 점수 + callback/insideJoke hit − avoidTopics 점수. 주제/콜백/명시 멘션 연결 없는 사람 제외, 최대 6명 중 Phase 3 에너지대로 답글 생성. 자기 자신에게 답하는 aside 방지. Preview·자동 댓글·투표 같은 경로 사용.
- 말투·호칭: 관계 방향별 nickname, interactionTone 변형, 공개/사적 모드 반영. 수아→매니저님, 서윤→대표님, 그 외 Seed 회장님. 오빠는 hani/jieun/haru/naeun/hina/seoyun + Seed flag + LIFE/LOUNGE + 기존 12% 확률/누적 15% cap에 한정. WORK/공지/투자/주식/정산/업무 차단. 콜백 10분의 1 기회 및 thread 빈도 제한, 오빠 포함 콜백/quirk 배제. MIR rank tooltip에 AI ENTITY · SPECIAL MEMBER 표시.
- owner: personaMap/staffAddress/queueReplies/storyTemplate/publicationReplies 기존 경로 수정. DOM/event/timer layer 추가 없음. HTML 렌더의 escape 유지.
- 기준선: 표시/cache 2.9.200, index 마지막 JS hani-ai-budget.js?v=2.9.200. 운영 실제 로딩 미검증.
- 환경: 지정 Node --version 및 아래 --test 실행 모두 Access is denied. 권한 확대 미수행. V8 도구에서 실제 테스트 모듈 본문과 실제 runtime/추출 main 함수를 실행. Node fs/URL/VM/assert는 메모리 fixture adapter, structuredClone은 JSON 복제, TextEncoder/SHA256은 JS fixture(abc SHA256 알려진 값 확인)로 대체. Node/native VM/실제 WebCrypto 또는 브라우저 PASS로 해석 금지. Git PATH 없음, .git ref 및 GitHub API로 기준 확인.
- 실행 시도 명령(PowerShell): `& 'C:\Users\홍성민\AppData\Local\Programs\nodejs\node.exe' --test scripts/hani-board.test.mjs scripts/hani-board-community.test.mjs scripts/hani-board-living.test.mjs scripts/hani-board-guard.test.mjs scripts/hani-board-relationship.test.mjs scripts/hani-relationship-seed-build.test.mjs scripts/hani-cloud-egress-save-sim.test.mjs` → 실행 시작 차단.
- V8 검증: board 136, guard 208, community+living 30,972, relationship(실제 board 기반 fixture 포함) 43,560, build/check 127, cloud-egress 45 assertion PASS. community가 dynamic import로 living 전체를 실행함. 보드와 다른 서버 경영회의실 boardroom 검사는 범위 N/A.
- 검증 내용: Seed load/cache invalidation, 전체 관계 ID, byte-identical artifact/check, delimiter escape/load order, 관계 nickname 실제 답글, 수아/서윤 호칭, 허용 6명/분류/누적 cap, Seed 문구 통한 오빠 우회 방지, avoid 감점·affinity/callback 점수, 기술 글 무관 직원 제외/무관 글 0명, callback occasional, partial Seed fallback, Preview 무저장, 실제 MIR DOM tooltip 결과.
- 기존 회귀: 원본 보존/실패 rollback/backup/Cloud conflict/hash, 실제 delegated events/escaped XSS/18 portraits/hash navigation, sync STOP·준비 전 0 write, Phase 3 일별 rotation·예약·중복 방지·재개·review/auto·poll/출석 PASS. 모의 90 thread: 0개 11 / 1~3개 50 / 10초과 10 / 최대 23. Seed 연결 40개 기술 thread에서도 quiet/active 및 관련 참여 확인.
- Cloud 모의 결과: 3번 저장 응답 412 bytes, 전체 state 재조회 0회, 동시 변경 및 revision race에서 양쪽 데이터 보존. 실제 네트워크/운영 데이터 접근 없음.
- 안전 diff: persist/savePost/saveComment/deleteOwn/writeBlockReason/threadEnergy 함수가 시작 snapshot과 동일. hani-main.js, 보호 key, 내부 VERSION, Cloud write/schema/migration 경로 변경 없음. 새 파일/보드에 localStorage 신규 write/remove 및 금지 clear 호출 없음.
- Notion: HANI-44 진행 카드 최초 작성 및 read-back 확인. https://app.notion.com/p/3f5c527570748187b303d69a08b36861 . 종료 시 update_properties(탑승 대기/결과 요약)·insert_content(검증/인계 상세)는 모두 “MCP tool call requires approval, but approval policy is never”로 거부됨. **결과 갱신 대기**이며 카드의 완료/탑승 상태 갱신을 주장하지 않음. 갱신 대기 내용은 이 문서 전체 구현/검증/미커밋·seed PR/Node blocker/다음 행동.
- 미검증: 지정 Node/native 실행, 실제 로그인 브라우저·모바일/화면 말투 체감, Candidate build/One-Pass/HINA, Production read-back. DOM은 fixture 렌더 근거이며 실화면 Preview 승인 아님. 기능 담당 버전 증가 N/A(열차 담당이 증가).
- 변경 파일: hani-board.js, index.html, scripts/hani-board-community.test.mjs(전원 그룹 강제 참여 assertion을 실제 관련성 assertion으로 정정).
- 신규 파일: hani-relationship-seed.js, scripts/hani-relationship-seed-build.mjs, scripts/hani-relationship-seed-build.test.mjs, scripts/hani-board-relationship.test.mjs, 본 인수인계. 생성용 일시 helper 파일은 제거.
- PR / Preview / 배포 원문: 미생성. **신규 runtime hani-relationship-seed.js는 seed PR 포함 필요.** 대표님 커밋 금지에 따라 commit/push 없음. 미커밋 파일을 배포 담당에게 인계. 서버 Edge Function/설정 동반 변경 없음, JSON → builder → runtime/check → 열차 통합 순서.
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: main merge·Pages·운영 미실행. 로컬 표시/cache 유지, 실제 운영 로딩 미검증. 배포 완료 선언 없음.

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: hani-board.js personaMap/staffAddress/queueReplies/storyTemplate, Seed JSON/build.
- 다음 한 가지 행동: 배포 담당이 미커밋 범위와 신규 runtime seed PR을 포함하고, 실행 가능한 Node 환경에서 위 테스트 및 builder --check를 재실행한 뒤 실제 Preview/열차 Candidate 절차 진행.
- blocker / 필요한 사용자 결정: 지정 Node 접근 거부. 현재 승인 범위 안 구현은 완료, 추가 승인 질문 없음. 커밋·push·Candidate·배포는 이번에 수행하지 않음.
- CURRENT / DECISIONS: 공통 현황·다른 담당 기록 보존.
