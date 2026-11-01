# 이달의 퀸 v2 · 날짜별 투표와 월간 단독 이미지

## 작업 식별

- 갱신: 2026-11-02 KST / 담당 Codex / 상태: 구현·targeted Node 검증 완료, 미커밋 검토 대기.
- 저장소 ghdtjdalskr-svg/hani-os / worktree qa-b9 / branch `hani/lounge-queen-v2`.
- base·로컬 branch·origin/main 캐시: `a5bc2e35a358ebf8f95ed58ba7eb7fd90311f861`. Git subprocess 없이 ref 파일로 확인. 원격 최신성·Production은 미확인.
- 승인 근거: `../qa-b9-task.md` 전체 UTF-8 정상 판독. 이 worktree 구현·이미지 생성·지정 Node 검사만. commit/push/merge·브라우저/Git subprocess·버전/cache 변경 금지.
- 범위: board JS/CSS, 정적 library/builder, index의 이미지 preload 1줄, `assets/queen/2026-10.webp`, 비교 이미지·검증 근거, billboard test, 작업 기록. office-live·연혁 원장 제외.
- CODEMAP_MISS: lounge/queen owner 항목 없음. 실제 `interactiveMarkup/queenTally/queenSlides/publicationReplies/materialize`와 builder `monthlyQueenThread`를 확인.
- 방향: 동일 seed/date의 표시 전용 집계, 기존 날짜별 댓글 예약 경로 사용, 대표님 `votePoll/persist/save` 유지. state/Cloud/schema·새 localStorage·runtime AI 호출 없음.
- Notion: 착수 append가 자동 승인 검토에서 `approval policy is never`로 거절됨. 저장·read-back 미완료, 작업 종료 결과까지 갱신 대기.

## 결과와 증거

- **10월 결과 유지:** 기존 고정 수상자와 문구를 보존. 월→이미지 테이블에 10월 단독 이미지를 연결했다. 없는 월은 기존 초상을 `contain`으로 오른쪽에 표시하며 계절 gradient를 사용한다. 수상 이미지에도 `contain`을 적용해 화면 너비와 관계없이 원본을 자르지 않는다. 기존 전광판 DOM·점·timer·링크 소유 경로를 유지했다.
- **새 이미지:** `assets/queen/2026-10.webp`, 1600×400, **88,808 bytes (약86.7 KiB)**. built-in image_gen 사용. 수상자 초상 첫 번째, 하니 초상·organization/newsroom hero를 뒤에 둔 **4개 참조**. 가을 카페 거리·낙엽·작은 왕관·오른쪽 단독 인물·왼쪽 문구 여백. 생성물을 자르지 않고 비율 유지 축소·오른쪽 정렬·왼쪽 여백 후 WebP 변환했다. 원본 참조·생성물·저장 비교 이미지를 시각 확인했으며 브라우저 실화면 확인과 구분한다.
- 비교: `artifacts/lounge-queen-v2/2026-10-compare.png`. 최종 프롬프트·참조·처리 정보: `image-generation.json`. Prompt 요약: “October 2026 HANI colleague award; reference1 identity, references2–4 style; warm autumn cafe street/leaves/small crown; entire subject right, quiet left, complete autumn outfit, no text/logo/watermark”. 전체 원문은 JSON에 보존.
- **직원 표·댓글:** `monthlyQueenThread`가 월·직원 ID 고정 seed로 11/3~11/30 안 서로 다른 날짜와 시각을 만든다. 기존 `afterMin → publicationReplies.scheduledAt → materialize → applyStaffVotes` 경로 사용. queen 댓글만 월간 원본 날짜를 기준으로 예약한다. 일반 댓글 timing과 저장 owner는 유지. force refresh도 미래 library 표를 조기 공개하지 못함을 실제 함수로 확인했다.
- **기존 표 보존:** 이미 월초에 저장된 직원 표·댓글은 수정하지 않는다. 집계는 원본 library의 직원별 투표일/선택을 읽고 도래한 표만 센다. 기존 공개 댓글의 화면 날짜도 같은 투표일로 투영하며 미래 댓글은 보이지 않는다. 정상 신규 댓글은 원래 예약 경로에서 공개된다. 저장 차단/검토 mode의 댓글 공개 정책은 기존 정책을 따른다.
- **익명 직원:** 월별 고정 선호 가중치·직원별 도착일/선택 seed로 가상의 익명 직원40명을 표시할 때 계산한다. state·댓글·저장 키·network/AI 호출 추가 없음. 화면에는 `익명 직원 N명 포함`으로만 표시한다. 실존 직원 또는 실측 참여 인원으로 기록하지 않는다.
- **공통 집계:** `queenStandings`가 날짜별 named+anonymous+기존 회장님 표를 합산한다. `interactiveMarkup`의 progress 막대/인원·`queenSlides` 진행 인원·`queenTally` 수상자에 같은 함수를 사용한다. 예: `지금까지 N명 참여 · 11월 30일 마감`. 11월 말59명+회장님1표=60명. 월말 이후 날짜는 월말 마지막 ms로 제한한다. 11월 중 선두가 실제로 변하는 seed 결과를 확인했다. 동률의 기존 회장님 선택→roster 순서를 유지했다.
- **실제 회장님 경로:** 합성 메모리 저장소에서 원래 `votePoll → persist → save → writeProtectedState → loadState` 실행. 표시 집계가 해당 선택에서 정확히1표 늘고 저장·재로드·중복투표/쓰기를 검증했다. 익명 표40개는 저장된 poll.votes/댓글에 추가되지 않는다. 실제 생활 원본·계정 Cloud는 열거나 변경하지 않았다.
- **Runtime closure:** **135 → 136 / 한도160 / 누락0 / 삭제0**, 추가는 `assets/queen/2026-10.webp` 하나. 월별 literal 테이블과 index의 실제 이미지 preload literal로 패키지 추적을 확인했다. 전체 목록·diff는 `closure.json`, `closure-diff.json`. 기존 QA 테스트 이름의 “128”은 이전 명칭이며 실제 assertion 한도는160이다.
- **보존 13 PASS / 0 FAIL:** `save` 포함 main 전체·office-live 두 파일·연혁 JSON 바이트 동일. `persist/votePoll/applyStaffVotes/materialize` 원문 동일. board 허용 표시/예약 범위 밖 바이트 동일. 기존220글·bulletin 동일, queen 글은 댓글 timing만 변경. state shape·보호 키·Cloud/schema·내부 baseline·표시 버전·cache tags 유지. index는 preload1줄만 추가. 기존 혼합 개행 유지: main CRLF5182/LF3616 그대로, index CRLF1125 보존/LF739→740. 그 외 변경 코드의 원래 LF 유지. 근거 `safety.json`, `baseline.json`.

### 최종 검사

| 명령 | PASS | FAIL | 비고 |
| --- | ---: | ---: | --- |
| `node scripts/hani-lounge-billboard.test.mjs` | 20 cases | 0 | 날짜 전 표 제외·누적·결정성·월말/수상자 동일·실제 회장님 path·무쓰기·이미지/fallback |
| `node scripts/hani-board.test.mjs` | 1 command | 0 | 기존 저장/소유권 |
| `node scripts/hani-board-203a.test.mjs` | 1 command | 0 | 기존 답글 |
| `node scripts/hani-board-community.test.mjs` | 1 command | 0 | 기존 UI/생성 |
| `node scripts/hani-board-guard.test.mjs` | 1 command | 0 | 저장 차단 |
| `node scripts/hani-board-library.test.mjs` | 1 command | 0 | compiler |
| `node scripts/hani-board-living.test.mjs` | 1 command | 0 | 예약 댓글 |
| `node scripts/hani-board-november.test.mjs` | 5 cases | 0 | 기존 November |
| `node scripts/hani-board-relationship.test.mjs` | 1 command | 0 | 관계 |
| `node scripts/hani-board-views-211.test.mjs` | 7 cases | 0 | 조회/추천 |
| `node scripts/hani-board-vocative.test.mjs` | 1 command | 0 | 호칭 |
| `node scripts/hani-qa-easy-cleanup.test.mjs` | 12 cases | 0 | 기존 QA |
| `node scripts/hani-boardroom-live-meeting.test.mjs` | 1 command | 0 | wildcard에 포함된 관련 외 회귀 |
| `node scripts/hani-boardroom-recovery.test.mjs` | 1 command | 0 | wildcard에 포함된 관련 외 회귀 |
| `node --check <file>` | 4 files | 0 | board JS, library JS, builder, billboard test |
| `node scripts/hani-board-library-build.mjs --check` | 1 command | 0 | 4 source files / 221 threads |

- 테스트 **14명령 성공/0실패**, case 수를 출력한4파일만 합쳐 **44 PASS / 0 FAIL**. syntax4/4와 보존13/13은 별도 집계. 상세 명령·출력은 `artifacts/lounge-queen-v2/test-results.json`.
- `hani-boardroom-cross-review.test.mjs`, `hani-boardroom-voice-contract.test.mjs`, `hani-boardroom-routing.test.mjs <rebuilt-source>` **3개 미실행**: 앞의 두 검사는 직접/하위 rebuild에서 Git subprocess를 실행하고, routing은 같은 Git rebuild 원본이 필요하다. 사용자 Git 금지를 지키기 위해 실행하지 않았다. 실패 또는 PASS로 세지 않았다.
- 개발 첫 전광판 실행은 이전 기대값4개 실패(월초19표·1일 내 댓글·초상 경로·단순2표)였으며 새 요구사항에 맞춘 실제 경계 검증으로 갱신한 뒤20/20 통과. 패치 보조 도구의 LF anchor/PowerShell 인자 오류도 수정했고 최종 위 검사에 미해결 실패 없음.

### 미검증과 경계

- 브라우저·모바일/desktop 실화면·실제 이미지 로딩·키보드·overflow·최종 AA 실측은 사용자 제한으로 미검증. 이미지 자체와 비교 PNG만 확인했다.
- 직접 `votePoll` 함수는 요청대로 불변이므로 월말 이후 직접 호출 차단이나 저장된 결과 snapshot은 추가하지 않았다. **동일한 저장 회장님 표·library·roster에서** 최종일 집계와 다음 달 발표가 같다. UI는 마감 후 투표 버튼을 제거한다. 마감 후 외부 직접 호출/데이터 변경까지 결과를 고정하려면 별도 승인 범위가 필요하다.
- 원격 main 최신성·Production 표시/최신 JS·실계정 Cloud·최종 Candidate/package/One-Pass/HINA 미실행. 로컬 ref와 index 기준2.9.255만 확인. Preview/main/Pages/운영 read-back 미실행이며 배포 완료가 아니다.
- Notion 착수 요약 쓰기를 자동 승인 검토가 `approval policy: never`로 거절했다. 저장/read-back 미완료. 이 문서의 착수·완료 결과를 현황판에 추가할 작업이 대기 중이다.

## 다음 담당에게

- 먼저 읽을 파일: 이 기록, billboard test, `queenTally/queenSlides/publicationReplies`.
- 다음 한 가지 행동: 허용 환경에서 360/390/desktop Preview로 10월 단독 이미지·이미지 없는 월의 contain·11월 초/중/말 인원·12월 발표를 확인한다.
- 대표님 승인 범위를 배포 승인으로 확장하지 않는다.
- commit/push/merge·열차 탑승·버전 변경 없음. 원래 11/1 인수인계·CURRENT에는 이번 후속 근거 링크만 추가하고 과거 기록을 보존한다. DECISIONS의 승인 기록 추가 없음.

### 다음 달 이미지 절차

1. 해당 월 종료 후 같은 `queenTally` 집계에서 수상자를 확인한다. 고정10월 결과는 바꾸지 않는다.
2. 수상자 본인 초상을 첫 입력으로, `assets/profiles/`·`assets/heroes/`의 화풍 참조를 합해3~5개 전달해 built-in image_gen으로 그달에 다른 계절/업무 축하 concept의 단독 배너를 만든다. 오른쪽 전체 인물·작은 왕관·왼쪽 문구 여백·완전한 복장·글자 없는 이미지를 요청한다.
3. 원본 비율을 유지해 전체가 들어가게1600×400 정도로 변환하고 `assets/queen/YYYY-MM.webp`에200KB 미만으로 저장한다. 원본 초상/수정 전/새 이미지 비교 파일을 만들어 확인한다.
4. `queenImages` 월→literal 경로 테이블과 index image preload에 해당 literal을 추가한다. 이미지가 없으면 기존 contain fallback을 그대로 쓴다. 이미지 매핑을 위해 수상 결과를 바꾸지 않는다.
5. 다음 투표는 월별 `queen-YYYY-MM`/정확한 공개일 template을 정적 source에 추가한다. builder가 같은 방식으로 직원 선택/월간 날짜를 만들므로 generated bundle은 직접 편집하지 않고 `node scripts/hani-board-library-build.mjs`로 갱신한다.
6. 같은 전용/게시판 targeted 검사·closure160/누락0·실화면을 확인하고 인수인계한다. 기능 탭은 버전/cache·배포를 처리하지 않는다.
