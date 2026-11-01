# QA-20 · 라운지 전광판 / 월간 퀸 투표 후속 구현

> 2026-11-02 Codex 후속: `qa-b9` / `hani/lounge-queen-v2` / base `a5bc2e3`. 월간 날짜별 직원표·익명40명 표시 집계·10월 단독 이미지 구현, 전광판20/20·지정/추가14명령 성공·syntax4/4·보존13/13, closure135→136/160. Git 의존 boardroom3개·브라우저/운영 미검증, Notion 쓰기 자동 승인 never 거절로 갱신 대기. 미커밋·버전/배포 변경 없음. 최신 근거·다음 달 절차는 [퀸 v2 인수인계](2026-11-02-lounge-queen-v2.md). 아래11/1의 당시 기록은 보존한다.

## 현재 작업 식별 — 2026-11-01 KST

- 담당 Codex / 상태: 구현·Node 검증 완료, 미커밋 검토 대기. 아래 이전 라운드의 중단 기록은 이 후속 결과로 대체한다.
- 저장소 ghdtjdalskr-svg/hani-os / qa-b4 / branch `hani/lounge-billboard`.
- 작업 기준·로컬 HEAD: `ee88f6adb2ec2bf6953f64f411a5e14a46929a28` (커밋된 전광판). 로컬 origin/main 캐시 `583cc97960d0e41e975d633b27b1e60d322bcfc4`. 원격 최신성 미확인, 자동 merge/rebase 없음.
- 대표님 승인: 정적 라이브러리 poll/voteChoice 전달, 기존 저장·로드 경로의 실제 검증, 표시 전용 월말 마감, 11월 투표와 다음 달 전광판 발표. commit/push/merge·버전/cache 변경·브라우저/Git subprocess 실행은 금지.
- 변경 파일: `hani-board.js`, `hani-board.css`, `hani-board-library.js`, `scripts/hani-board-library-build.mjs`, `data/board-library/part-d.json`, `scripts/hani-lounge-billboard.test.mjs`, `scripts/hani-board-november.test.mjs`, `scripts/hani-board-guard.test.mjs`, `scripts/hani-qa-easy-cleanup.test.mjs`, 이 인수인계·CURRENT·검증 근거.

## 현재 결과와 증거

- **회장님 표는 실제로 보존된다.** 검증한 경로는 `generateDaily → votePoll → persist → save → writeProtectedState → 저장값 재확인 → loadState → validateStoredRecords → normalizeState`. 실제 함수와 합성 메모리 저장소를 사용했고, 재로드 후 같은 선택을 확인했다. 재로드·같은 선택 재투표는 추가 쓰기 0회다. 실사용 원본 저장소를 열거나 변경하지 않았다.
- 전체 라이브러리로 `refreshLiving → publicationReplies → materialize → applyStaffVotes → persist`를 실행해 직원 19표를 반영하고, 회장님 1표 추가 후 저장·재로드에서 총 20명 표를 확인했다. 기존 투표글은 재생성하거나 표를 초기화하지 않는다.
- 정적 `poll`·댓글 `voteChoice`를 검증·전달하고, poll 중첩 객체도 freeze한다. 런타임 생성 시 두 필드만 기존 경로로 전달하며, poll은 잡담 변형 대상에서 제외한다.
- `👑 11월의 퀸 투표`: 2026-11-03. 현행 roster의 여성 직원 19명(여성 AI 동료 포함)이 후보이며 회장님은 제외. 기존 canon의 말투·관계·관심사와 글 ID 기반 고정 seed로 직원별 한 표·댓글을 빌드한다. 자기 투표 0. 사내 인기상·동료 응원 문구만 사용한다.
- 투표글은 해당 월 안에서 날짜가 도래하면 우선 생성한다. 늦게 처음 열어도 원본 투표일을 유지한다. 첫 방문 전 자동 저장·생성을 보장하는 별도 스케줄러는 추가하지 않았다.
- KST 월말 이후 **표시되는 poll 안에 투표 버튼이 없다**. 결과는 텍스트로 렌더하며 저장된 표는 고치지 않는다. 일반 투표 UI는 기존 동작을 유지한다. 마감은 대표님이 요청한 화면 정책이며 `votePoll` 직접 호출의 시간 제한이나 월말 결과 스냅샷을 추가하지 않았다.
- 표시 집계는 게시글의 `poll.votes`를 읽는다. 최다 득표 → 동률이면 회장님 선택 → 그래도 동률이면 roster 순서다. 회장님 표도 득표 수에 포함한다.
- 전광판: 전월 수상자 → 당월 진행 투표 → 이달의 직원 → 일보 → 베스트 → 시장4컷 → 광고2개. 11월에는 전월 고정 결과를 먼저 보여주고, 11월 투표글이 공개된 뒤 두 번째 슬라이드로 연결한다. 11월 결과는 12월에만 표시한다. 고정 결과표에 새 인물 이름을 문서로 공개하지 않는다.
- 이름·직급·한 줄 장난·왕관·해당 월 계절 gradient를 표시한다. closure에 있는 기존 초상만 쓰고, 나머지는 기존 office 이미지로 대체한다. 가능한 모든 후보의 수상 이미지가 closure에 포함되는지 확인했다. Gradient의 흰색 글자 계산 최소 대비 4.76:1; 실제 화면 측정은 미검증.
- **보존 감사:** `votePoll`, `persist`, `applyStaffVotes`, AI/Cloud 블록 원문 동일. `hani-main.js`·`index.html` 전체 바이트 동일. 허용한 generation/display 블록 밖 `hani-board.js`의 모든 바이트·개행 동일. state shape·save/load·보호 키·내부 기준 버전·Cloud/Supabase/schema·office 파일·표시 버전·cache 변경 없음. 기존 220글 내용 동일, 새 poll 1개로 221글.
- Runtime closure 128 → 128, 누락 0, 전후 파일 목록 동일. 새 runtime 파일·이미지·fetch·AI 호출 추가 없음. 실제 AI 호출도 수행하지 않음.

### 최종 검증 — 실패 0

| 명령 | 결과 |
| --- | --- |
| `node scripts/hani-lounge-billboard.test.mjs` | 13 PASS / 0 FAIL |
| `node scripts/hani-board.test.mjs` | 명령 PASS / exit 0 |
| `node scripts/hani-board-203a.test.mjs` | 명령 PASS / exit 0 |
| `node scripts/hani-board-community.test.mjs` | 명령 PASS / exit 0 |
| `node scripts/hani-board-guard.test.mjs` | 명령 PASS / exit 0 |
| `node scripts/hani-board-library.test.mjs` | 명령 PASS / exit 0 |
| `node scripts/hani-board-living.test.mjs` | 명령 PASS / exit 0 |
| `node scripts/hani-board-november.test.mjs` | 5 PASS / 0 FAIL |
| `node scripts/hani-board-relationship.test.mjs` | 명령 PASS / exit 0 |
| `node scripts/hani-board-views-211.test.mjs` | 7 PASS / 0 FAIL |
| `node scripts/hani-board-vocative.test.mjs` | 명령 PASS / exit 0 |
| `node scripts/hani-qa-easy-cleanup.test.mjs` | 12 PASS / 0 FAIL |
| `node scripts/hani-board-library-build.mjs --check` | PASS · 4 source files / 221 threads |

- 게시판 10명령 + 전광판·기존 QA 2명령 = **12명령 PASS / 0 FAIL**. case 수를 출력한 4파일만 합산하면 **37 PASS / 0 FAIL**. 나머지는 명령 성공으로만 집계했다. 회의실(boardroom) 검사는 이 게시판 기능 범위에 포함하지 않았다.
- `node --check` 다음 7파일: `hani-board.js`, `hani-board-library.js`, builder, billboard test, november test, guard test, QA easy test → **7 PASS / 0 FAIL**.
- 기존 November 검사는 기존 220글 보존을 그대로 확인하며 새 poll을 마지막 1개로 허용한다. QA-7은 앞에 추가한 수상자 슬라이드와 직원 위치에 맞췄다.
- Guard 검사의 실제 banner timer가 본문 PASS 뒤 프로세스를 유지해 최초 직접 실행을 종료했다. timer 수명 검사는 전광판 fixture가 담당하므로 guard fixture에 가짜 timer를 주입했다. 이후 원래 명령으로 종료 코드 0 확인. assertion을 생략하는 강제 종료 래퍼는 최종 명령에 사용하지 않는다.
- 개발 중 fixture uid 누락·추가 문자열의 셸 인코딩 문제·기존 슬라이드 기대값 실패를 수정하고 관련 검사를 다시 통과했다. Node 안에서 하위 Node를 띄운 초기 묶음 실행은 EPERM으로 10개 모두 시작하지 못해 각각 직접 실행했다. 이 차단 시도는 PASS로 세지 않았다.
- 최종 요약 근거: `artifacts/lounge-queen/verification.json`, `artifacts/lounge-queen/board-results.json`.

### 미검증 / 경계

- 브라우저·모바일/desktop 실화면·키보드/overflow·이미지 실제 로딩은 사용자 제한으로 미검증.
- 실제 계정 Cloud 왕복·운영 데이터·기존 AI 댓글 보충 경로의 실서버 동작은 미검증. 해당 Cloud/AI 구현은 변경하지 않았다.
- 원격 main·Production 표시/JS·최종 Candidate/package/One-Pass/HINA는 미검증. 이번 작업은 배포 완료가 아니다.
- Notion 착수 요약 append를 자동 승인 검토가 `approval policy: never`로 거절했다. 저장·read-back 미완료. 계획·완료 결과·branch/base·테스트12명령/문법7개·화면 전용 마감·미검증을 현황판에 추가하는 작업이 대기 중이다.

## 다음 담당에게 — 현재

- 먼저 볼 곳: builder `monthlyQueenThread`, board `dailyThread/generateDaily/publicationReplies`, `interactiveMarkup`, `queenTally/queenSlides`, `loungeBannerItems`.
- 다음 행동: 허용 브라우저에서 11월 초·투표 공개일·KST 월말·12월을 분리해 모바일/desktop Preview 확인. 기존 동기화 준비/차단 상태와 이미지 fallback도 확인한다.
- 검토 후 대표님의 다음 지시까지 미커밋으로 보존한다. commit/push/merge·열차 탑승·버전 증가·배포 권한은 부여받지 않았다.
- CURRENT는 후속 구현·검증 결과로 갱신. DECISIONS의 승인 기록은 새로 만들지 않음. Notion은 승인 거절 때문에 갱신 대기이며 다른 담당 기록은 보존했다.

---

## 이전 라운드 기록 — 전광판 구현 / 퀸 중단 당시

## 작업 식별

- 갱신: 2026-11-01 13:09 KST / 담당 Codex / 검토·브라우저 확인: 지정 검토 담당.
- 상태: 전광판 구현·Node 검사 완료, 퀸 투표는 명시된 중단 조건 적용. 미커밋 검토 대기.
- 저장소 ghdtjdalskr-svg/hani-os / qa-b4 / branch hani/lounge-billboard.
- base·로컬 branch ref·로컬 origin/main: 583cc97960d0e41e975d633b27b1e60d322bcfc4.
- 원격 최신성·Production 2.9.246은 직접 확인하지 않음. Git subprocess·브라우저는 사용자 지시대로 실행하지 않음.
- 승인: 2026-11-01 QA-20 요청의 이 worktree 미커밋 수정·targeted 검사. commit/push/merge/배포·버전/cache 변경 권한 없음.
- 범위: hani-board.js, hani-board.css, index.html의 .board-promo, 기존 라이브러리와 빌더, 신규 전광판 검사, 기존 QA 배너 검사, 작업 기록.

## 결과와 증거

### 전광판

- persistent slot을 이미지 전광판으로 변경. desktop 200px / 480px 이하 168px. kicker·큰 제목·한 줄 copy·점 선택·작은 pause. 넓은 텍스트 버튼 두 개 제거.
- 이미지 cover, 흰색 글자 뒤 검정 gradient 최소 불투명도 .72: 흰 이미지에서도 계산상 AA 4.5:1 이상. 실화면·실측은 미검증.
- 단일 6000ms timer, 화면 이탈/문서 숨김/pagehide 중지, focus 중 전환 유예 유지. reduced motion에서 자동 전환 없음, 점 수동 선택 가능, pause는 disabled로 유지.
- 현재 순서: 이달의 직원 → 최신 발행 일보 → 실제 weeklyBest 첫 글 → 최신 발행 시장 4컷 → 날짜별 가상 광고 2개. 데이터 없는 항목 생략.
- 일보는 data/hani-ilbo/issues.json 및 해당 issue 원본, 4컷은 assets/data/newsroom-4cut/issues.json에서 빌드 시 제목·호수·날짜만 기존 hani-board-library.js에 투영. 런타임 KST 발행일·초안 필터. 새 fetch·AI 호출 없음. 발행 원본 변경 시 기존 라이브러리 빌더 재실행 필요.
- 요청 광고 문구 6종 유지, KST 날짜로 서로 다른 2개 선택. 광고만 가상 광고 chip. 실제 agentReview/dev/investmentCommittee로 이동. 베스트는 기존 openPost UI 경로.
- 연속극은 생략: 원본 JSON은 있지만 허용 범위에서 실제 주차와 synopsis를 연결하는 공개 경로를 확인하지 못함. 새 fetch·추정 주차를 만들지 않음. 금지된 office-live/building 파일 미수정.

### 퀸 투표: 중단 / 미구현

일반 투표의 post.poll.options/votes, 생성 댓글 voteChoice, applyStaffVotes, votePoll은 존재한다. 그러나 아래 연결이 없다.

1. generateDaily가 라이브러리 글의 poll을 생성 글에 전달하지 않는다.
2. publicationReplies가 원본 댓글의 voteChoice를 예약 댓글에 전달하지 않는다.
3. votePoll은 옵션·쓰기 준비만 검사하며 월말 마감·투표 시각을 검사/기록하지 않는다. applyStaffVotes에도 월말 확정 경계가 없다. 버튼만 막아서는 공개 투표 함수의 마감 후 변경과 다음 달 결과 고정을 보장할 수 없다.

실제 생성 함수에 synthetic poll/comment를 넣어 1·2를 Node로 재현했다. 기존 함수 변경 없이 월말 확정까지 보장할 수 없어, 요청의 “기존 poll 경로로 불가능하면 그 부분 중단”을 적용했다. 필드 전달만 추가한 불완전한 기능은 넣지 않았다.

- votePoll·applyStaffVotes·글/댓글 생성·저장 함수 원문 유지.
- 11월 3일 월간 투표글·직원 표 생성·동률/회장님 선택 집계·월말 마감·다음 달 발표·10월 수상자 고정표/슬라이드 모두 미추가.
- 동률·회장님 표로 결과 변경·자기 투표 금지·다음 달만 발표 검사는 미구현/N/A. PASS로 계산하지 않음. 신규 검사는 중단 원인의 실제 생성 재현만 포함.
- 후속 결정: 라이브러리 필드 전달과 canonical poll 마감 경계에 허용할 변경 범위를 정해야 함. 이번 작업에서는 수행하지 않음.

### 사용 이미지 / 패키지

추가 이미지 0, 추가 runtime 파일 0. 아래 12개는 모두 작업 전 closure에 존재한다.

- assets/team/hani-team-office.webp
- assets/heroes/newsroom-218.webp
- assets/heroes/investment-218.webp
- assets/profiles/hani-profile-hani.webp
- assets/profiles/hani-profile-haru.webp
- assets/profiles/hani-profile-hina.webp
- assets/profiles/hani-profile-jieun.webp
- assets/profiles/hani-profile-minji.webp
- assets/profiles/hani-profile-naeun.webp
- assets/profiles/hani-profile-sooyeon.webp
- assets/profiles/hani-profile-yuna.webp
- assets/profiles/hani-profile-sua-id.webp

closure 내 초상이 있는 직원만 해당 초상 사용, 다른 직원은 office 이미지. closure 128 → 128 / missing 0 / 전후 목록 동일. 기존 library threads 220개 내용 동일.

### 검증

지정 테스트 8명령 통과 / 실패 0. case 수를 출력하지 않는 기존 스크립트는 명령 통과로만 표시.

| 명령 | 최종 결과 |
| --- | --- |
| node scripts/hani-lounge-billboard.test.mjs | 9 PASS / 0 FAIL |
| node scripts/hani-board.test.mjs | 명령 PASS / exit 0 |
| node scripts/hani-board-living.test.mjs | 명령 PASS / exit 0 |
| node scripts/hani-board-community.test.mjs | 명령 PASS / exit 0 |
| node scripts/hani-board-203a.test.mjs | 명령 PASS / exit 0 |
| node scripts/hani-board-views-211.test.mjs | 7 PASS / 0 FAIL |
| node scripts/hani-board-library.test.mjs | 명령 PASS / exit 0 |
| node scripts/hani-qa-easy-cleanup.test.mjs | 12 PASS / 0 FAIL |

- node --check: hani-board.js, hani-board-library.js, scripts/hani-board-library-build.mjs, scripts/hani-lounge-billboard.test.mjs, scripts/hani-qa-easy-cleanup.test.mjs → 5 PASS / 0 FAIL.
- node scripts/hani-board-library-build.mjs --check → PASS, 3 source files / 220 threads.
- 첫 개발 실행의 builder 괄호 오타와 새 fixture의 DOM/lexical mock 오류 수정 후 위 결과. 최종 미해결 실패 0.
- 신규 검사: 실제 slide/weeklyBest/employee·광고·발행 원본·chip·점/링크·focus/visibility/page lifecycle/reduced motion·write/network 거부 환경·closure·최소 contrast·퀸 중단 원인.
- 기존 테스트 수정: scripts/hani-qa-easy-cleanup.test.mjs의 QA-7 배너만. 실제 함수 공용 fixture, 발행호 kicker, 삭제된 next 대신 dot, reduced-motion pause hidden 대신 disabled. 다른 검사·기대값 유지.
- byte audit: hani-board.js의 배너/배너 이벤트 분기 밖 원문 동일, index.html의 promo 밖 원문 동일. 개행 형식 유지. version/cache/HANI_DISPLAY_VERSION·save/state shape/보호 키·Cloud/Supabase/schema 변경 없음.
- 베스트 열기의 기존 조회 기록은 유지. 전광판 paint/선택/timer 자체는 저장하지 않음.
- browser·360px/desktop 실화면·키보드/overflow·이미지 실제 로딩·Production·최종 Candidate/package/HINA 미실행. runtime release 완료 아님.

## 다음 담당에게

- 먼저 볼 곳: hani-board.js의 loungeBannerItems/paintLoungeBanner/syncBanner/click 분기, 빌더 publicationBulletins.
- 다음 행동: 미커밋 diff 검토 후 허용 브라우저에서 360px/desktop 높이·넘침·문구/초상·44px 점·pause·링크·숨김 timer 확인.
- 퀸 기능은 별도 범위 결정 필요. 완료 기능으로 취급하지 않음.
- CURRENT에는 검증 결과·중단만 요약. DECISIONS에 대표님 결정을 새로 만들지 않음.
- Notion 갱신 대기: 이 작업의 계획/결과·branch/base·8명령/문법5개·전광판 완료/퀸 중단·브라우저 대기 요약. 현황판 fetch 성공, append는 도구가 승인을 요구하고 승인 정책 never여서 자동 승인 검토 거절. 쓰기/read-back 미완료.
- commit/push/merge/배포 없음. 기존 2.9.246·cache tags 유지. 검토 완료를 배포 승인으로 추정하지 않음.

## 2026-11-01 퀸 투표 후속 착수

- 담당 Codex / hani/lounge-billboard / base·로컬 HEAD ee88f6adb2ec2bf6953f64f411a5e14a46929a28 (커밋된 전광판). 로컬 origin/main 583cc97; 원격 최신성·브라우저는 사용자 제한으로 미확인.
- 승인: 정적 poll/voteChoice 전달·실제 저장/로드 검증·표시 전용 마감·11월 투표·다음 달 발표. votePoll/persist/save/state shape/Cloud·office·버전/cache 유지. commit/push/merge 없음.
- 범위: 기존 builder/library/board JS·CSS·전광판 테스트·정적 콘텐츠·작업 기록. CODEMAP에 board owner 항목이 없어 실제 함수 anchor로 fallback.
- Notion 착수 append: 자동 승인 검토가 policy never로 거절. 갱신 대기.

- 2026-11-01 서윤: main b653a17(2.9.247)을 합침. 360px 실화면 확인: 높이 168px, 점·멈춤 44px, 가로 넘침 0, 이미지 5종 로딩, 긴 일보 제목은 두 줄로 조정. 로그인 후 화면, 실제 Cloud 저장, 11/3 글 표시는 미검증.
