# office-v2-215 · 아트 경로 정합성 수정

## 작업 식별

- 갱신 날짜(KST): 2026-10-18. 담당: 도연(Codex), 단일 개발자 + 자동 검사.
- 상태: 정적 수정·targeted 검사 완료, 실제 Edge 검증 및 commit 차단. 미커밋.
- branch / worktree: `hani/office-v2-215` / `ov215`.
- 시작 HEAD: `f04079d9105cf38912f4c23ac4fd744765d9a17e`.
- 로컬 origin/main: `1d212cf3730cd33295067bcc1e33299af4988066`. 원격 git 조회는 네트워크 차단으로 실패했으나 GitHub connector의 branch API로 동일 최신 main 확인. main 전용 두 commit은 asset seed(#282/#283); 자동 merge/rebase 없음. main HTML 표시 v214와 마지막 JS도 동일 확인.
- 표시/cache: v2.9.214, 마지막 UI JS `hani-ai-budget.js?v=2.9.214` 유지.
- 승인: 대표님 이번 요청의 기존 staged 변경 보존, 1F–4F `-215` 경로 및 관련 검증 정합성 수정, 요청 테스트 4종, 로컬 commit 시도. 버전·Storage·Cloud 변경, push/main/배포는 범위 밖.
- 수정 범위: 기존 office owner·art map 및 관련 engine/browser 테스트. CODEMAP living-office owner 확인; 신규 아트 경로 검사는 CODEMAP에 없어 실제 코드 검색으로 보완.
- 서윤의 시작 staged 13파일은 보존. 다른 담당의 untracked artifacts는 수정/commit 대상에서 제외.
- Notion 계획 생성 및 읽기 확인 완료: https://app.notion.com/p/3fcc52757074813a934bc1db320c669d

## 결과와 증거

- 원인: 공통 engine 테스트가 `floor-3f-v1.webp`만 로딩 성공하도록 설정한 채 renderer의 새 `-215` 경로를 실행해 fallback 발생. 실제 파일을 읽는 fixture의 5층 로딩 검사는 이미 통과.
- 수정: `hani-building-206-engine.test.mjs`의 성공 이미지와 assertion을 `floor-3f-215.webp`로 변경. `hani-office-v2-215.test.mjs`의 browser URL 부분 비교를 정확한 1F–4F `-215` / 5F `v1` 경로 비교로 변경하고 `dataset.art === 'floor'` 확인 추가. 원래 이미지 decode·크기·mask·sprite 조건 유지.
- 수정: `hani-building-206-ui.test.mjs`, `hani-earnings-report-ui-test.mjs`의 좁은 optional-art 404 분류 경로를 새 이름으로 교체. 조건 확대 없음. staff-floors 테스트 설명과 runtime의 부정확한 closure 주석 정정. renderer/event/저장 로직은 변경하지 않음.
- 검색 범위: runtime JS/CSS/HTML, data/art map, assets, scripts. 나머지 1F–4F v1 참조는 과거 rooftop 제작 문서의 원본 출처로만 남김. 현재 5F v1 유지. dims/bytes/hash 별도 파일명 테이블 누락 없음; 기존 값 그대로 실제 새 파일 검사 통과.
- 초기 staff-floors 실행: 9 PASS / engine 1 FAIL / browser 1 SKIP (`spawn EPERM`).
- 최종 검증 환경: Node v24.20.0, 요청 Playwright `index.mjs`와 Edge 경로 사용. 각 실행에 `HANI_CHROME_PATH` 설정.
  - `node scripts/hani-office-v2-215.test.mjs --browser <pw> <edge> --final-polish`: 정적17 PASS / 실제 browser1 FAIL (`browserType.launch: spawn EPERM`). 기존 2개 실패 중 아트 경로 assertion 실패는 해소, browser 차단만 남음. 전체 PASS 아님.
  - `node scripts/hani-staff-floors-214.test.mjs <pw> <edge>`: 10 PASS / 실제 browser1 SKIP (`spawn EPERM`). 실제 화면 통과 주장 없음.
  - `node scripts/hani-building-206.test.mjs`: 21/21 PASS.
  - `node scripts/hani-office-seats-215.test.mjs --browser <pw> <edge>`: 12/12 PASS. 이 파일은 browser 실행 코드를 제공하지 않으므로 Node 검증 결과임.
  - 수정 JS/MJS6파일 `node --check` PASS. 추가 코드 diff 및 기존 staged diff에 `git -c core.whitespace=cr-at-eol diff [--cached] --check` PASS. 기본 cached diff 검사의 art-map4줄 CR 경고는 기존 staged CRLF이며 원문 보존.
  - 이번 수정6파일의 변경을 메모리에서 역치환한 Git blob SHA-1이 시작 index와 각각 일치: 수정 밖 모든 바이트/혼합 EOL 보존.
  - 1F–4F 기존 v1과 5F v1 파일의 Git blob이 origin/main과 모두 일치. `git diff origin/main --numstat -- assets/building`에서 기존 v1 바이너리 없음, 신규 `-215`4개만 남음(기존 rooftop 문서는 별도).
  - 아트 SHA-256/furniture 검사 및 WebP1672×941·크기·합계 상한 검사 PASS. runtime closure118파일/누락0, closure+검사대상 아트20,430,160 bytes <25MB. 배포 패키지 인증 결과가 아님.
- 로그: `.ai-budget-private/office-art-paths-215/results.json`. 기존 browser 상태: `artifacts/office-v1art-215/browser-status.json`, `.ai-budget-private/staff-floors-214/result.json`. 새 screenshot은 생성되지 않음.
- 데이터·Storage·Cloud·schema 변경 없음. main/Pages/Production 검증 및 Candidate gate 미실행.

## 다음 담당에게

- commit 준비의 `git add -- <수정6파일> <handoff>`가 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/ov215/index.lock: Permission denied`로 실패. 기존 staged13파일 원문/객체는 그대로, 추가6파일과 문서는 unstaged/untracked로 보존. 일부 staged 내용만 commit하지 않음. HEAD `f04079d` 유지.
- 다음 행동: Git 쓰기 허용 환경에서 기존 staged 변경과 추가6파일·본 handoff/CURRENT를 함께 commit하고 두 browser 검사를 실제 Edge로 재실행. 신규 `-215`4이미지가 main에 별도 seed됐는지 서윤 확인 후 승인된 배포 흐름 진행. 이번 조회 main에는 신규4파일 미포함.
- 브라우저는 샌드박스 `spawn EPERM`으로 차단. 허용 환경의 실제 Edge UI read-back은 미검증.
- Notion 계획 생성/read-back은 완료. 최종 결과 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절하여 **미반영**. 위 원인·수정6파일·검증/브라우저 차단·commit 차단·다음 행동을 같은 Notion 페이지에 추가하는 일 대기.
- CURRENT는 이번 정적 완료/환경 차단만 prepend. 과거·타 담당 기록 보존, DECISIONS 변경 없음.
