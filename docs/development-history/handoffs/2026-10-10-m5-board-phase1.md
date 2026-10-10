# M5 · HANI GROUP BOARD Phase 1 · diff 인수인계

## 작업 식별
- 갱신일(KST): 2026-10-10
- 담당: 도연(Codex) / 관리자: 서윤(Claude Code)
- 상태: 검증 대기, 읽기 전용 diff 제출 / branch 생성·파일 변경 없음
- 저장소: ghdtjdalskr-svg/hani-os / worktree: five
- base: f56e1bbd3fe76a3ce7e67d3f6e0acf725d53bbf7 / candidate: 미생성
- 범위: 게시판 화면·두 목록·읽기 전용 조직 명부 API·백업/Cloud 집계·테스트
- 승인: HANI-38, 2026-10-09 새 목록 추가 저장 승인. 기존 데이터·schema·배포 승인 아님.

## 결과와 증거
- diff만 제출. 일기·보호 키·내부 VERSION·표시 버전·캐시 태그 변경 없음.
- 조직도 실제 명단은 17명/5팀. 기존 직원 id 그대로 사용, 회장 id seongmin을 조직도 API에 정의.
- 글 삭제는 해당 글만 삭제. 연결 댓글은 다른 작성자의 기록도 포함하므로 보존, 자동 연쇄 삭제 없음.
- 메모리 검증: 제안 JS 문법, 실제 게시판/save/백업/Cloud 함수, 저장 실패 복원, 소유권, unknown fields, FNV hash/충돌/집계 통과.
- 실행용 검사: node scripts/hani-board.test.mjs. Node VM·SHA-256 검사는 Node 실행 파일을 찾지 못해 미실행.
- 미검증: 실제 브라우저·dark finish·인증 Cloud 왕복·기존 full safety audit·Preview/아린·열차 gate.
- HEAD와 저장된 origin/main은 base와 일치. 원격 최신성과 production read-back 미확인.
- PR·main·Pages·배포: 수행하지 않음.
- Notion: HANI-38 읽기 성공. 진행 기록 추가는 자동 승인 검토가 approval policy never로 거부. 갱신 대기.

## 다음 담당에게
- 다음 행동: 관리자 전용 hani/... branch에 diff 적용 후 위 Node 테스트와 실제 Preview 검증.
- 테스트의 unrelated legacy normalizer는 stub이며 해당 기능 회귀 증거로 사용 금지.
- CRITICAL 저장 승인 범위 재사용. 기존 Cloud write/schema 경로 추가 없음.
- 표시 버전은 배포 담당이 열차 후보에서 한 번만 증가. 기존 safety/rollback·release gate 유지.
- CURRENT/DECISIONS 변경 없음. Notion에 계획·검증·미검증과 원문 SHA를 추가하고 읽어 확인 필요.
