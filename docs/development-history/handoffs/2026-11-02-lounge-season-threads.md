# 11월 라운지 시즌 스레드 · qa-b9b

## 재개·재검증 기록 (2026-11-02 KST)

- 담당 Codex. 성민 대표님의 `../qa-b9b-task.md` 전체 UTF-8 읽기·실행 지시를 다시 확인했다. 한글 정상. 기존 구현과 이 인수인계가 이미 존재하며 `.serin-queen-copy.md`는 이전 작업에서 삭제된 상태여서, 다른 초안을 대신 가져오거나 기존 작업을 덮어쓰지 않았다.
- Git subprocess 없이 실제 HEAD/ref를 읽어 `hani/lounge-queen-v2` / `4cd4bb10aecb8895813fb3ada22cc67c7ffb1652`를 확인했다. 원격 main 최신성은 미확인. 브라우저/Git·commit/push·버전/cache·office-live 수정 금지를 유지했다.
- 기존 `part-e.json`의 시즌8편·수상 패턴1편과 표시/날짜 제한·수상자 치환 경로, 전용 테스트를 확인했다. 문구 수정 내역과 폐기0편은 아래 기존 검수표와 `copy-review.json`에 보존한다. 이번 재개에서 추가 문구·runtime 코드 패치는 하지 않았다.
- `node scripts/hani-board-library-build.mjs` 재실행 성공: 5 source files / 230 threads. `node artifacts/lounge-season-threads/check-safety.mjs` 재실행 **8 PASS / 0 FAIL**: 기존221글·18개 소유 함수·금지 파일·HEAD 보존, closure136/160·누락0, 초안 삭제 상태 확인.
- 아래 최종 검사표의 테스트14개·syntax5개·library `--check`1개를 모두 재실행해 **20명령 성공 / 0실패**. 테스트 명령만 **14성공 / 0실패**, 사례 수를 출력한4파일 합계 **51 PASS / 0 FAIL**(billboard27·November5·views7·cleanup12). 중복 import assertion은 다시 합산하지 않았다. 새 실행 출력은 `artifacts/lounge-season-threads/reverification-results.json`에 보존했다.
- Git subprocess 의존 boardroom3개는 기존과 같은 이유로 미실행이며 PASS/FAIL에 포함하지 않았다. 브라우저·실계정 Cloud/AI·원격/Production·release gate 미검증 경계도 유지한다. commit/push/PR/main/Pages/배포 없음.
- Notion 현황판 읽기는 성공했으나 이번 재검증 요약의 `insert_content`는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절했다. 저장/read-back 미완료. 위 branch/base·문구 검수8편·수상 표시·최종20명령 및 미검증·다음 행동을 담은 요약은 **Notion 갱신 대기**로 남긴다. 승인 우회·반복 재시도는 하지 않는다.
- 다음 행동: 허용 환경에서 기존 인수인계의 날짜별 목록·상세 Preview를 확인한 뒤, 성민 대표님의 후속 지시에 따라 검토·열차 인계. CURRENT의 기존 요약은 이번 결과와 일치하므로 타 담당·과거 기록을 보존했다. 이번 재검증은 새 배포 승인이나 독립 UI/HINA 검토가 아니다.

## 작업 식별

- 갱신 시각(KST): 2026-11-02 / 담당 Codex / 상태: 구현·targeted Node 검증 완료, 미커밋 검토 대기.
- 저장소: ghdtjdalskr-svg/hani-os / worktree qa-b9 / branch `hani/lounge-queen-v2`.
- 작업 base·로컬 HEAD: `4cd4bb10aecb8895813fb3ada22cc67c7ffb1652`. Git subprocess 없이 HEAD/ref 파일로 확인. origin/main 로컬 캐시 `b30b98823ca78977c9656aa7092dae2920f532fe`이며 원격 최신성·통합 영향은 미확인. 현재 commit에서 작업하라는 사용자 지시에 따라 merge/rebase 없이 진행.
- 승인 근거: `../qa-b9b-task.md` 전체 UTF-8 정상 판독. 초안 8편 규칙 검수·수정, 기존 library 형식 추가/재빌드, 계산된 당선자의 다음 달 소감·왕관 인수인계 표시, 지정 Node 검사, 초안 삭제와 인수인계.
- 수정 범위: `data/board-library/`, generated library, board의 기존 표시/콘텐츠 선택 경로, builder validation, billboard 및 관련 library regression 기대값, 작업 기록/증거. Risk NORMAL.
- 경계: commit/push/merge·브라우저/Git subprocess·버전/cache 변경 금지. `hani-office-live.*` 수정 금지. 데이터/Cloud/schema·새 쓰기 경로 금지. 기존 v2 작업과 다른 담당 파일 보존.
- CODEMAP_MISS: lounge/queen owner 없음. 실제 `dailyThread/publicationThread/libraryEligible/generateDaily`, `listPosts/openPost/render`, `queenTally/queenStandings`를 소유 경로로 확인.
- 방향: 8편 날짜 유지, 실제 집계에 종속되는 정적 사실은 제거. winner 템플릿은 일반 생성/저장 후보에서 제외하고 기존 목록·상세에서 읽기 전용으로 계산해 표시.
- Notion: 착수 append를 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 미완료. 아래 최종 결과까지 갱신 대기 보존 예정.

## 결과와 증거

- **초안 검수:** 8편 모두 수정 후 유지, 폐기 0편. 실제 재직 명부의 댓글 작성자 ID는 처음부터 모두 유효했다. 착수 commentary의 ID 불일치 언급은 검수 후 정정했다. 실존 인물·투자 권유·회장님 별칭·회장님 후보 추가는 없다. 단순 단어 검사와 별도로 8편 제목·본문·댓글 전부를 읽고 의미를 검수했다.

| 글 | 수정 내용 |
| --- | --- |
| s01 · 11/05 | 신체 표현과 미투표 인원 암시를 제거하고 운영 점검·감사 메모로 변경 |
| s02 · 11/08 | 눈빛 표현·근거 없는 1.4배 수치·이미 투표했다는 댓글을 제거, 응원 협약 유지 |
| s03 · 11/12 | 유나의 낮은 득표 단정·외모로 읽힐 수 있는 수식·투자 비유를 제거, 색견표 오타를 색인표로 수정, 무리 없는 협업 쿠폰으로 변경 |
| s04 · 11/16 | 익명이더라도 집계와 충돌할 수 있는 선두 교체 소문·한 표 도착 주장을 삭제, 중간 점검 티타임으로 변경 |
| s05 · 11/20 | 외모·신체 표현을 제거, 기존 10월 서윤 수상 사실과 비상용 소감 메모 주제 유지 |
| s06 · 11/24 | 히나 중위권 주장·손목 도장·외모 수식을 제거, 투표와 무관한 메모지 응원 부스로 변경 |
| s07 · 11/27 | 현재 표 분산/상위권 간격·캐스팅보트 확률 주장을 제거, 최다 동률 후보 중 회장님 선택이 있는 조건만 설명, 댓글은 감사와 응원으로 정리 |
| s08 · 11/30 | 신체 반응·외모 표현을 제거하고, 다음 달 발표는 집계할 결과가 있을 때 표시된다는 조건 추가 |

- **정적 콘텐츠:** 기존 형식의 `data/board-library/part-e.json`에 날짜를 유지한 8편과 통합 수상 패턴 1편을 추가했다. 기존 4개 source는 바이트 불변. canonical build script로 `hani-board-library.js` 재생성: 5 source files / 230 threads. 기존 221개 thread가 전부 그대로임을 실행 비교했다. 수정 전후 문구는 `artifacts/lounge-season-threads/copy-review.json`에 남겼으며 `.serin-queen-copy.md`는 삭제했다.
- **콘텐츠 실행 경로:** 기존 `dailyThread`와 `publicationThread`에서 새 시즌 글이 랜덤 잡담·다른 댓글로 치환되지 않도록 했다. 기존 `libraryEligible` 날짜·월 제한과 `publicationReplies → materialize` 예약 경로를 사용한다. 일반 생성·직원 투표 저장 소유 경로는 유지한다.
- **작은 수상 패턴 1개:** `queen-2026-11-winner`, `2026-12-01`. 수상 소감과 왕관 인수인계를 한 편으로 합쳤다. 기존 형식 검증을 위한 정적 `authorId: hani`는 표시 작성자가 아니다. `queenResultThreads`가 실제 공개된 해당 월 poll의 월말 `queenStandings/queenTally` 결과로 작성자와 `{winner}`를 매번 치환한다. 19명 모두·11월/12월의 서로 다른 수상 결과에서 확인했다. 아직 마감 전이거나 공개 poll·유효 집계가 없으면 아무 글도 표시하지 않는다. 이후에도 읽을 수 있다.
- **읽기 전용 표시:** 기존 `listPosts/openPost/render`의 목록·상세 읽기만 `displayPosts`를 사용한다. `posts()`와 저장 함수는 원문 그대로이며 수상 글을 일반 생성 후보에서 제외한다. 이 패턴이 library exhaustion을 막지 않도록 일일 생성용 library에서도 제외하고 90일 재사용을 실행 검증했다. 수상 글의 댓글·추천·reaction 저장 컨트롤은 비활성이다. 새 handler·renderer layer·저장 키·write·Cloud 호출을 추가하지 않았다.
- **안전 근거:** 시작 파일 hash와 실제 실행 비교로 main/index/board CSS/office-live 두 파일/기존 source 4개/builder **10파일 불변**, 저장·AI·집계·예약 소유 함수 **18개 원문 불변**, storage/Cloud 호출 불변, 이전221글 불변, HEAD/개행 유지, 초안 삭제를 확인했다. 보존 **8그룹 PASS / 0 FAIL**. runtime closure **136/160, 누락 0**, 파일 추가 없음. `baseline.json`, `board-before.txt`, `check-safety.mjs`, `safety.json` 참조.

### 최종 검사

| 명령 | PASS | FAIL |
| --- | ---: | ---: |
| `node scripts/hani-lounge-billboard.test.mjs` | 27 cases | 0 |
| `node scripts/hani-board-november.test.mjs` | 5 cases | 0 |
| `node scripts/hani-board-views-211.test.mjs` | 7 cases | 0 |
| `node scripts/hani-qa-easy-cleanup.test.mjs` | 12 cases | 0 |
| `node scripts/hani-board.test.mjs` | 1 command | 0 |
| `node scripts/hani-board-203a.test.mjs` | 1 command | 0 |
| `node scripts/hani-board-community.test.mjs` | 1 command | 0 |
| `node scripts/hani-board-guard.test.mjs` | 1 command | 0 |
| `node scripts/hani-board-library.test.mjs` | 1 command | 0 |
| `node scripts/hani-board-living.test.mjs` | 1 command | 0 |
| `node scripts/hani-board-relationship.test.mjs` | 1 command | 0 |
| `node scripts/hani-board-vocative.test.mjs` | 1 command | 0 |
| `node scripts/hani-boardroom-live-meeting.test.mjs` | 1 command | 0 |
| `node scripts/hani-boardroom-recovery.test.mjs` | 1 command | 0 |
| `node --check` board JS / library JS / billboard test / November test / builder | 5 files | 0 |
| `node scripts/hani-board-library-build.mjs --check` | 1 command | 0 |

- 테스트 **14명령 성공 / 0실패**. case 수를 출력한 4파일만 합쳐 **51 PASS / 0 FAIL**. syntax와 build check를 합치면 총 **20명령 성공 / 0실패**. 보존 검사는 별도 8/8. 중복 import된 assertion은 case 수에 다시 더하지 않았다. 명령·출력: `artifacts/lounge-season-threads/test-results.json`.
- 전용 신규 검사: 8편+수상 패턴의 명부·톤·금칙·비집계성, KST 공개일 직전/당일, 실제 댓글 예약/문구 보존, 20가지 회장님 선택(미선택 포함)×28일의 변하는 선두에서도 댓글 중립, 다음 달 경계·결과 없음·미공개 poll·빈 집계 비표시, 두 달×직원19명 수상자 치환, canonical DOM 목록·상세·검색·제어 비활성·무쓰기, 일반 90일 재사용 보존.
- 초기 전용 검사 4건은 중립 문구를 더 단순하게 수정하고 테스트 fixture의 uid·한글 표시명 기대를 보완해 해결했다. 안전 보조 스크립트의 closure 호출 인자 오류도 수정했다. 최종 미해결 실패 없음.
- **3개 미실행:** `hani-boardroom-cross-review.test.mjs`, `hani-boardroom-voice-contract.test.mjs`, `hani-boardroom-routing.test.mjs <rebuilt-source>`. 앞의 두 검사는 Git subprocess를 직접 또는 하위 rebuild에서 실행하고, routing은 그 rebuild 원본이 필요하다. 사용자 금지를 지켰으며 PASS/FAIL 수에 넣지 않았다.

### 미검증과 경계

- 브라우저·모바일/desktop 실화면·실계정 Cloud/AI·원격 main 최신성·Production 표시 버전/실제 JS 로딩은 사용자 제한으로 미검증이다. Node DOM fixture 결과를 브라우저 Preview 통과로 보고하지 않는다.
- 현재 branch/HEAD는 `4cd4bb10...` 그대로다. 표시 버전·cache·내부 baseline·보호 key·Cloud/schema·migration 불변. 커밋/push/PR/main 병합·Pages·배포·운영 read-back 없음. 버전 증가 검증은 기능 담당 열차 규칙과 작업 지시로 N/A.
- 수상자는 기존 월말 집계 함수로 표시 시 계산한다. 기존 저장 투표 데이터가 나중에 바뀌는 상황까지 결과를 고정하는 snapshot/write는 추가하지 않았다. 이전 v2 인수인계의 직접 투표 호출/결과 고정 경계를 유지한다.
- Notion 착수 append는 자동 승인 검토가 `approval policy is never`로 거절했다. 저장/read-back 미완료. 이 문서의 목적·현재 base/branch·8편 수정표·수상 표시·최종 검사·미검증·다음 행동을 현황판에 옮기는 작업이 **갱신 대기**다. 승인 질문이나 반복 우회 호출은 하지 않았다.

## 다음 담당에게

- 먼저 읽을 파일: 이 기록, `2026-11-02-lounge-queen-v2.md`, billboard test.
- 다음 행동: 허용 환경에서 11월 각 공개일과 12월 1일의 실제 목록·상세를 Preview 확인한 뒤, 대표님의 후속 지시에 따라 커밋/열차 인계를 진행한다. 현재 작업의 commit/push 금지를 우선한다.
- Preview·main·Pages·Production 미실행. 문서 공유는 배포 승인이 아님.
- 함께 배포할 Edge Function·설정 변경 없음. 기존 기능과 함께 board JS·library JS만 runtime 변경이며 버전/cache는 배포 담당이 열차 후보에서 처리한다.
- CURRENT에 확인된 완료 요약을 추가, 기존 v2 인수인계에 후속 링크를 추가했다. DECISIONS 승인 기록은 추가하지 않았다.
