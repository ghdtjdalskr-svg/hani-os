# 라운지 댓글 첫 호칭 정리

## 작업 식별
- 날짜: 2026-10-11 KST / 담당: 도연(Codex), 단일 개발 Agent
- 상태: 구현·targeted 검증 완료, 미커밋 인계 대기
- branch/worktree: hani/green-209 / w209
- base SHA: 8f707d7ab5404639cbb1b65d6784db1fa826df0b
- 조회 원격 main: 3e923c10a647efaac79ab83e96bf4f3c8dd6d614 (GitHub connector). Git 네트워크 연결 실패. 자동 merge/rebase 없음.
- 표시/cache: v2.9.207, index 마지막 UI JS hani-ai-budget.js. 운영 실제 표시/로딩 미검증.
- 범위: hani-board.js 표시 전용 호칭 정리, data/board-library 댓글 본문·재생성 runtime, 정리 script/test, 뉴스룸·세린 생성 지침.
- 승인: 대표님 요청 범위만. 커밋/버전/저장 경로/배포 변경 금지. 기존 다른 담당 artifacts/qa-evidence 변경 보존.
- CODEMAP_MISS: board feature 항목 없음. 실제 commentMarkup/조직 roster/board tests 좁은 검색으로 확인.

## 결과와 증거
- 변경: hani-board.js stripLeadingVocative/commentMarkup이 조직 roster의 이름·별칭·직급/직급 끝 호칭으로 첫머리만 정리. 원댓글은 글 작성자, 답글은 부모 작성자/글 작성자를 대상으로 함. 답글의 중복 @mention 제거, 회장님/대표님/성민 일반 호칭 보존. 기존 HTML escaping 유지.
- 라이브러리: scripts/hani-board-vocative-clean.mjs가 실제 runtime 함수를 격리 VM으로 재사용. 댓글 320개 변경(part-a 199 / part-b 121), 스레드 본문/metadata/author/replyTo 및 JSON 줄바꿈 그대로. scripts/hani-board-library-build.mjs로 compact JSON runtime 재생성(180 스레드).
- 지침: newsroomCommentInstructions 및 scripts/serin-tone.mjs prompt에 “댓글을 상대 이름 부르기로 시작하지 말 것” 추가. 세린 실행은 하지 않음(해당 파일이 읽는 SERIN-TASK.md는 이 checkout에 없음).
- 새 테스트: scripts/hani-board-vocative.test.mjs — 한글 이름, 전체·끝 직급, 님/씨/아/야, 쉼표/전각 쉼표/느낌표, 회장 호칭, 중간 이름, 멘션 중복, escaping/무저장. scripts/hani-board-community.test.mjs 실제 DOM render 회귀 추가.
- 검증 명령: node scripts/hani-board-203a.test.mjs / hani-board-community.test.mjs / hani-board-guard.test.mjs / hani-board-library.test.mjs / hani-board-living.test.mjs / hani-board-relationship.test.mjs / hani-board-vocative.test.mjs / hani-board.test.mjs — 8개 전부 PASS (Node v24.20.0, synthetic/VM DOM).
- 추가 검증: node scripts/hani-newsroom-persona.test.mjs PASS; node scripts/hani-board-library-build.mjs --check PASS; node scripts/hani-board-vocative-clean.mjs --check 0 bodies pending; 변경 JS/MJS node --check 및 git diff --check PASS.
- 원문 비교: persist/savePost/saveComment/deleteOwn/writeBlockReason 함수 동일, index.html 표시/cache 동일, 신규 clear/DOM id literal 없음. JSON 변경은 댓글 body 320개뿐, JSON EOL sequence와 기존 unchanged line EOL 보존. artifacts/board-vocative/preservation.json 및 테스트 로그 참고. Node→Git subprocess EPERM은 native shell로 baseline 원문을 직접 redirect하여 비교 완료.
- 미검증: 실제 로그인 브라우저/모바일 시각 QA, live AI 생성 결과, Candidate/One-Pass/HINA/운영 read-back. 이번 DOM render PASS는 실화면 승인 아님. 보호 키/내부 버전/Cloud write/schema/migration 변경 없음.
- 데이터·Cloud·schema: 저장 경로 변경 없음, 기존 저장 본문은 표시 시에만 가공.
- Notion: 읽기 성공. 계획 append는 자동 승인 검토에서 “MCP tool call requires approval, but approval policy is never”로 거절. 계획/완료 내용 갱신 대기.
- PR/main/Pages/운영 read-back: 미실행.

## 다음 담당에게
- 먼저 읽을 파일: hani-board.js stripLeadingVocative/commentMarkup, scripts/hani-board-vocative-clean.mjs, 신규 테스트.
- 다음 행동: 배포 담당이 미커밋 변경을 최신 main 후보에 통합하고 targeted test/Preview·열차 gate 진행. 대표님 커밋 금지에 따라 commit/push/PR 없음.
- 동반 서버 파일: supabase/functions/hani-newsroom-publisher/comment-persona.mjs는 prompt 한 줄 변경. 서버 hani-newsroom-publisher 배포 시 새 생성 지침 적용(프런트 strip과 배포 순서 의존 없음). 서버 배포 승인/실행은 이번 작업에 포함하지 않음.
- Notion 갱신 대기: 이 문서의 구현/320개 변경/검증/미검증/다음 행동. 자동 승인 검토 거절로 반영 완료를 주장하지 않음.
- CURRENT: 작업별 완료·미커밋·Notion 대기 요약을 추가. DECISIONS 변경 없음. 다른 담당 파일 보존.
