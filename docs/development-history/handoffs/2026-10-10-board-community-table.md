# 사내 게시판 커뮤니티 목록 인수인계

## 작업 식별

- 작업 ID / 제목: board-community-table / 한국 커뮤니티 스타일 사내 게시판
- 갱신 시각(KST): 2026-10-10 22:48
- 담당 도구 / 검토 담당: 도연(Codex), 개발 Agent 1명. 독립 리뷰 미수행
- 상태: 로컬 구현 완료 / Node 및 실제 화면 검증 대기
- 저장소 / branch / worktree: hani-os / hani/board-sync-guard / board-guard
- base SHA: 17dd426edb37403b5aa2a4fdd7a387973ff2ca03. 착수 시 원격 main API와 동일 확인
- candidate SHA / PR: 없음. 대표님 지시로 커밋·push·main 병합·배포하지 않음
- 승인 근거: 대표님 이번 요청의 STEP 0 sandbox 정합, 커뮤니티 표 목록·본문/hash·직원 자동 게시·정적 프로필 표시. 기존 readiness guard 유지, 버전 증가 금지
- Risk Tier: NORMAL. 기존 보호 guard/persist와 main save/Cloud/schema는 변경하지 않음
- CODEMAP_MISS: 사내 게시판 owner anchor 없음. 실제 hani-board.js renderer/delegated event 및 main showView를 직접 확인

## 결과와 증거

### 변경 내용 / 파일

- STEP 0을 먼저 수행: scripts/hani-board.test.mjs의 로그인·Cloud ready/ON·hold 해제 fixture, community/living의 의미 있는 기존 books fixture만 정합. 이 단계에서는 assertions 변경 없음. 원래 게시판 코드 + 수정 fixture를 V8에서 31,345 assertion으로 확인한 뒤 UI 구현 진행
- hani-board.js / hani-board.css: 6열 표(말머리·제목·글쓴이·날짜·조회·추천), 공지 상단, 선택 행, 댓글 굵은 숫자, 투표/연재 아이콘, 말줄임, 40px 행, KST HH:mm/MM.DD, ≤600px 두 줄 계약. 기존 목록 정렬·검색·pagination 보존
- index.html: 본문/댓글 card를 목록 위로 이동, 닫기 추가. 인기·전체·WORK·LIFE·MEMORY·LOUNGE 색상 탭을 상단에 배치. 주간 활동/BEST는 목록 아래에서 유지. syncNotice 정적 Persistent Slot 제공
- hani-main.js: 기존 showView에서 board/post-id를 board로 해석하고 post hash 보존. 다른 view 동작 유지. 기존 storage writer/Cloud 코드는 수정하지 않음
- 제목 클릭: 기존 delegated handler → openPost. hash push, 본문 focus/scroll, 현재 행 강조. 닫기/브라우저 back/forward·새로고침 복원은 기존 showView를 호출하는 게시판 한정 history adapter 사용. 새 router 없음
- 최초 hash 진입의 일일 자동 생성·조회 집계를 기존 persist 한 번에 결합. 실패 시 기존 상태/조회 marker 보존, 다음 기존 render에서 재시도. 잘못된 post hash가 이전 글을 표시하지 않음
- 직원 설정: 직원 새 글·답글 / 자동 게시(기본) / 미리보기 후 게시. 기존 replyMode 필드 재사용. 새 글 기본 자동 게시, 투표 예약·답글 예약도 같은 save에 포함. 과거 초안의 일괄 변환 없음
- 미리보기 mode에서만 tray 표시. 올리기 / 나중에 / 삭제로 명칭 변경. 나중에는 기존 archived disposition으로 tray 내부 보관 구역에 남으며 복원 가능
- 프로필: roster 18명 정적 경로 존재 확인. M9는 기존 128 thumb, AI STAFF/MIR/회장은 조직도 기존 portrait fallback. 모든 img lazy/async 및 28px(목록·댓글)/40px(본문) 크기, 실패 시 이니셜 표시. 이미지 URL을 state에 저장하지 않음
- 테스트 3개 확장: 표/공지/선택 행, 날짜, 모바일 class, 모든 avatar/fallback, 실제 showView hash 처리, 제목/닫기/back/reload, 자동 게시·preview tray·단일 저장·rollback 검증. living의 기존 초안 검사는 명시적인 review fixture로 유지하고 자동 답글 구간은 auto를 명시. guard의 not-ready assertion은 유지하고 ready의 3개 생성 결과만 새 기본값(게시 3개, 초안 0개)에 맞춤
- [격리 미리보기](../../preview/hani-board-community-table.html): 실제 게시판 DOM/CSS/JS와 예시 기록. protected localStorage·Cloud 접근 없이 메모리에만 변경. 브라우저 실제 렌더링은 미검증

### 실행한 검증

- 지정 Node 명령(착수 및 최종 각각 시도):
  - C:\Users\홍성민\AppData\Local\Programs\nodejs\node.exe scripts/hani-board.test.mjs
  - C:\Users\홍성민\AppData\Local\Programs\nodejs\node.exe scripts/hani-board-community.test.mjs
  - C:\Users\홍성민\AppData\Local\Programs\nodejs\node.exe scripts/hani-board-living.test.mjs
  - C:\Users\홍성민\AppData\Local\Programs\nodejs\node.exe scripts/hani-board-guard.test.mjs
- **Node 4개 모두 BLOCKED: Access is denied, 테스트 프로세스 시작 실패. Node PASS로 표시하지 않음**
- 별도 node_repl도 Windows sandbox setup helper 오류로 kernel 시작 실패
- 도구 V8 대체 실행: main → community(내부 living import) → guard, 최종 21그룹 / 31,184 assertion PASS
- living 단독 흐름(main → living → guard)도 V8 16그룹 / 30,924 assertion PASS. 마지막 scroll 캡처 한 줄 수정 전 결과이며 해당 마지막 수정은 community의 scroll 복원 검사를 포함한 최종 전체 V8 실행으로 다시 검증
- 대체 환경의 범위: 실제 로컬 테스트/board/roster/archive 소스 사용. main은 테스트가 요구하는 freshState/실제 저장·검증·백업·Cloud helper 및 변경 showView 함수만 추출. 테스트 assertions 실행, vm 경계는 with(env) adapter, 파일 읽기는 제공한 실제 소스 mapping, native structuredClone/TextEncoder는 fixture adapter 사용, SHA-256은 .NET 실제 해시 사용. Node vm/전체 main syntax/브라우저 QA와 동일한 결과로 해석하지 않음
- 실행 경로: 실제 save/backup/read-back/rollback, 단일 Cloud queue, unknown fields 보존, 공지 정렬, 댓글/답글·poll/reaction/search/pagination, 월간 사내 대화 시뮬레이션, 자동 게시 예약/중복 방지/실패 재시도, hash/조회 집계, guard 차단 시 저장 0회
- JS syntax: board 전체, 변경 main 함수와 필요한 helper, preview inline script PASS(V8)
- 보호 비교: 기존 writeBlockReason / persist / saveComment / deleteOwn / toggleLike / setReplyMode 함수 내용 동일 확인
- 프로필 URL 18개 실파일 존재. 동적 ID 중복·escaping·금지 write/clear 호출 검사 PASS
- 표시 버전 2.9.200 및 마지막 index JS hani-ai-budget.js?v=2.9.200 유지. 기능 담당 버전 증가 N/A(열차 담당이 통합 시 한 번 증가)

### 미검증 / 남은 위험

- 지정 Node 4개, 실제 로그인 PC/Android 화면, CSS layout의 실제 시각 결과, native dialog·history scroll, 이미지 실제 로딩은 미검증
- Build/One-Pass/HINA/아린 독립 Preview/운영 read-back 미수행. 기능 개발 단계이며 Release Candidate/배포 승인으로 해석하지 않음
- 새 이미지 asset 파일 없음. 생성 도구 실행 제한으로 128 thumb 미생성 9개: mir, seoyun, dohyun, serin, yuri, arin, gaeun, taeo, seongmin
- 향후 필요한 이름: assets/profiles/thumb/hani-profile-<rosterId>-128.webp (위 9 ID). 이번에는 기존 portrait URL fallback. 새 썸네일을 만드는 후속 작업은 seed PR 후 열차 포함 필요
- 데이터·저장소·Cloud·schema: 기존 보호 key/internal VERSION/save/Cloud/Supabase/schema/migration 경로 변경 없음. 신규 storage key 없음. 예시 데이터만 사용
- Notion: 현황판 읽기 성공. 계획 insert_content가 “MCP tool call requires approval, but approval policy is never”로 거부됨. 최종 저장/read-back 없음, 연결 완료나 갱신 완료로 보고하지 않음. 이 문서의 착수·결과·검증 제한·다음 행동 갱신 대기

### 최종 로컬 파일 identity (SHA-256)

| 파일 | SHA-256 |
| --- | --- |
| hani-board.js | 18352c3495df8080cb922c58fcef6c909be7e39a22ade9466da14514c4835031 |
| hani-board.css | 9e4b67720778266187a62c6cc2bb1217f2e5f75f966f9cbb0a55c070e2c06e98 |
| hani-main.js | 54dd62c191079ce79f9ed5d8783d1d1d53b64d7de29edea83880bc572a899e9f |
| index.html | 9da0f000c5520e06e65e105252cd120f0c7a0edb4f1f51420f8cb8430718d596 |
| scripts/hani-board.test.mjs | 435e1b7b15ededda452fbe0c8f45502bb60d8273db5180a26a123d6a66067888 |
| scripts/hani-board-community.test.mjs | 69f92378dc01a2b56421cbb63e2b3f37ce6f1ccfaf686e35b2f7d4482f48d60c |
| scripts/hani-board-living.test.mjs | 755fa226661e05caf9c0bda4e461b7e50f12c0c38a4af232b3f5ef5b5033f8bc |
| scripts/hani-board-guard.test.mjs | 2c5ebef20f829e731442450980dd8257a5d64645a52ddaef4244aa1ca42b5a2f |
| docs/preview/hani-board-community-table.html | c9355d8315d9e6ea50b6de57fa01dcf3751c228f53a3ae5198906cf047d624ef |

위 파일 해시는 commit/candidate/package identity가 아니라 미커밋 작업 파일의 검증 대상이다.

## 다음 담당에게

- 먼저 읽을 파일·함수: 본 문서, hani-board.js render/renderBoard/openPost/viewChange/refreshLiving/publicationReplies/paintLiving, hani-main.js showView
- 다음 한 가지 행동: 실행 가능한 환경에서 Node 4개와 실제 PC/≤600px Preview 확인 후 배포 담당에게 위 미커밋 변경 및 기존 readiness fix를 함께 인계
- 승인 경계: 커밋·push 금지 지시 유지. main 병합·개별 배포·버전 증가 승인 없음. 필요 시 대표님 승인 범위 확인 후 Claude 열차에 통합
- 함께 배포할 서버 Edge Function/설정: 없음. 기존 Cloud/schema/서버 변경 없음
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 원격 기준 main과 로컬 v200/cache만 확인. 이 변경의 main 병합·Pages 반영·운영 JS 로딩·기능 read-back은 모두 미수행
- CURRENT/DECISIONS 및 다른 담당 인수인계는 덮어쓰지 않음. Notion 미반영 사유와 갱신할 요약은 본 문서에 보존
