# 2026-10-20 · Egress 읽기·재시도 수정

## 2026-10-20 · 서윤 실제 Edge 회귀 후속 (도연)

- 시작 branch `hani/egress-fix`, HEAD `84e1c48f65201a4be1761ac31f84f2c3110659b2`: 기존 egress 작업은 커밋되어 있음. 아래 초기 미커밋 기록은 과거 시점이며 보존한다.
- 기준 `origin/main` 및 비교 main220 HEAD `4a913303afb3de11e948c899387b4760810684c1` / v220. 원격 ls-remote는 네트워크 차단, 임의 merge/rebase 없음.
- 승인 범위: 대표님의 EOL/뉴스룸 Node VM 회귀 수정, 오래된 4테스트 갱신, 8지정+egress/Cloud 안전 Node 재실행 및 commit 시도. 버전/cache·Cloud write·Storage 경로 변경 금지 유지.
- hani-main의 EOL 7줄(내용 동일 4줄 + 신규 동일 문장 3줄) 복원, 실제 의미 변경은 `renderInvestmentNews`의 body/dataset optional guard 한 줄. origin/main과 내용 동일한 8,171줄 모두 EOL 포함 바이트 일치. index/polish 기존 커밋 원문 유지.
- 4테스트 stale 기준: brand의 v218 버전 목록→origin/main, login의 이미 통합된 Remote 호출 제거→전체 함수 비교, office index v218→origin/main, theme의 구형 auth/테마·v218 cache→origin/main. 기존 gate는 egress의 정확한 delta만 허용하는 공유 기대값으로 전체 비교하며, 보호 owner/쓰기 검사는 유지.
- egress 테스트의 원본 비교도 HEAD→origin/main으로 정정하여 기존 egress 커밋이 비교 원본이 되지 않도록 함.
- **Node 14명령 exit0**: 지정8(QA210 9/followup14/proactive21/mission/brand3/login/office/theme), egress25, cloud-first40/conflict-choice/egress-sync/save-sim, navlogin45. 변경한 4테스트는 main220 runtime 입력에서도 exit0. syntax/diff-check PASS. skip 없음.
- 증거·stale assertion별 설명·명령·최종 hash: [회귀 인수인계](../../../artifacts/egress-regression-220/README.md), byte-check.json 및 개별 로그. 기존 egress 증거는 이전 hash 시점으로 보존하며 이번 수정 후 브라우저 PASS로 재사용하지 않는다.
- **브라우저는 서윤 재실행 대기**. 실제 Cloud/실계정·열차/운영 미검증. 배포/버전 상승/Cloud·Storage 쓰기 변경 없음. 다음: 서윤 Edge 결과→배포 담당에게 같은 수정본 인계.
- Notion 진행 append는 자동 승인 검토 `approval policy is never`로 거절, 미반영. 후속 결과/커밋 상태/browser 대기 요약을 기록 대기로 보존. 기존 다른 담당/완료 기록은 수정하지 않음.
- Git: 선택한 작업 파일의 add는 공용 gitdir index.lock Permission denied(exit128), 전체 파일 commit --only는 신규 파일 pathspec 실패(exit1). 부분 커밋 없음. HEAD84e1c48·기존 egress 커밋 유지, 후속 미커밋·미push 보존. 다른 담당 산출물은 stage/복원하지 않음.

## 작업 식별

- 담당: 도연(Codex), 개발 Agent 1명 + 자동 검사.
- 상태: 구현·targeted 검증 완료. **Git 권한 차단으로 미커밋·미push 보존**, 열차 탑승 전 인수인계.
- branch/worktree: `hani/egress-fix` / `egressfix`.
- base: `4a913303afb3de11e948c899387b4760810684c1`, GitHub 원격 main 조회 일치. v2.9.220, index의 JS/cache 태그 유지.
- 승인 근거: 이 세션의 P0-a/b/c 및 P1 구현·테스트·commit 시도 요청.
- 범위: hani-main.js의 lifecycle/read/retry/gate 판단/Newsroom 읽기, legacy resume 제거, 신규 테스트 및 이 문서.
- 경계: Cloud write/upsert/schema, cloud-first conflict 정책, 보호 키 write/migration, 버전/cache 변경 및 배포 승인 없음.
- CODEMAP: cloud-sync/newsroom owner 확인. legacy resume와 gate/detail anchor는 좁은 실제 코드 검색으로 보충. codemap의 Local-first 테스트 설명은 현 cloud-first와 불일치(CODEMAP_MISS), 실제 정책 유지.

## 결과와 증거

- `hani-stability-polish-v02972.js`: legacy resume 함수와 focus/visible/pageshow listener 및 뉴스 전체 재조회 제거. 새 event layer 없음.
- `hani-main.js`: 기존 lifecycle owner에 pageshow 추가, resume-*도 metadata-first로 처리. 3초 안 중복·busy lifecycle을 합치고, 모든 lifecycle에서 실제 Local hash가 기준과 다른 경우 기존 sync decision으로 진행. cloud-first 정책 그대로.
- bfcache는 기존 `loginGateResumeSession`의 cookie/session/getUser/계정/복구 검증을 그대로 거친 뒤, 이미 lifecycle이 연결된 세션만 `resume-pageshow`로 합류. 최초 로그인·reload는 기존 확인 흐름 유지. 인증·복구 guard 함수 원문 불변.
- 402/429/5xx 공통 circuit: 자동 poll/focus/resume/queued/local-save/view-* 차단, 1→2→5→15→60분(이후 60분) backoff. Retry-After 초/HTTP-date 중 더 긴 대기 존중. 타이머 또는 기존 ‘다시 시도’ 버튼은 가벼운 metadata probe 1개만 허용하며, 성공 뒤에만 기존 판단 재개. 실패/중복 pending 요청은 circuit을 우회하지 못함.
- REST transport는 요청·응답을 변형하지 않고 장애 status/Retry-After만 관찰. write/upsert 호출·body·필터·revision/정책 코드는 변경하지 않음. circuit 중 일반 읽기는 로컬에서 차단. sync/Newsroom 읽기의 SDK 초단기 자체 retry는 `.retry(false)`로 끄고 위 circuit이 소유. 장애가 없는 write 전송·응답은 동일 객체로 통과하는 테스트 포함.
- 기존 네트워크 오류의 OFFLINE/online/focus 복구 동작 유지. Cloud 상태는 기존 pill/header/message에서 ‘Cloud 일시 중단 · 이 기기에 안전하게 저장 중’, 기존 동기화 버튼은 ‘다시 시도’. 자동 alert/modal 없음.
- gate: 인증된 현재 owner/client/attempt를 재확인한 후, Cloud 장애/네트워크 오류에 한해 유효한 의미 있는 Local이 있으면 입장. recovery/load recovery/backup import 및 다른 탭 hold/choice/로컬 읽기 실패/계정 교체는 계속 차단. 인증 자체를 확인할 수 없는 상태에서 getUser를 우회하는 기능은 아님.
- Newsroom: 최신 목록 50행, 본문/하니 의견/댓글/전체 payload 객체 제외. 화면 분류에 필요한 작은 scalar만 JSON 경로 alias로 서버에서 추출. 읽음 상태도 이번 post id 최대50개만 조회. opened item의 본문·댓글은 owner+id로 1행 조회, in-flight·메모리 cache 공유. 기존 접힌 아카이브·행·weekly/F/U UI 구조 유지. 미수신 댓글 수는 잘못된 0 대신 ‘…’, 열린 상세에서 기존 댓글 수/내용 표시.
- 과거 목록은 기존 ‘다음’에서 published_at+id cursor, 갱신은 updated_at+id cursor. 새/변경 행을 메모리에서 합치며 기존 상세는 해당 updated_at 변경 때만 무효화. 초기/과거 cursor는 별도로 보존하여 오래된 행 수정이 과거 페이지를 건너뛰지 않음. 선택 주간/화면에 열린 최신 F/U만 상세 hydration. 계정/client 교체와 늦은 응답은 격리.
- 기존 테스트 모형 5파일은 새 read modifier/메모리 scheduler 상태를 지원하도록 보완. 검사 assertion을 제거하거나 쓰기 검사를 완화하지 않음.

### 요청 수 전후 (격리 전체 앱, 합성 HTTP 응답)

원본은 `git show HEAD`의 main·polish를 동일 fixture에 로드. 초기 legacy throttle 2.5초 경과 후 focus/pageshow/visible 동시 발생. 실제 사용자 state/토큰/Cloud는 사용하지 않음. 숫자는 요청 건수이며 운영 전송 byte 측정값이 아님.

| 시나리오 | 수정 전 (기준 main) | 수정 후 |
|---|---|---|
| 동일 revision 복귀 burst | metadata 1 + full 1 = 2회 | metadata 1 + full 0 = 1회 (390/1440) |
| 인증된 bfcache pageshow+focus | 미측정 | metadata 1 + full 0 (390/1440) |
| revision 변경, 내용은 동일 | 미측정 | metadata 1 + full 1 (390/1440) |
| 402 첫 실패 후 focus×10 + poll/resume/queued/view | 공통 circuit 없음(정적 확인), 동일 묶음 실행 수 미측정 | 첫 metadata 1회 뒤 추가 0회 (390/1440) |
| Newsroom 첫 목록 | wide columns, limit500 (소스 확인) | summary 목록 1회, limit50 + 해당 id 읽음 조회 1회 |
| 뉴스 항목 열기 | 별도 detail 요청 없음(목록에 포함) | 해당 id 상세 1회, 중복 열기는 cache 사용 |

### 실행한 검증

- 신규 `scripts/hani-egress-fix.test.mjs`: **25 합성 시나리오 PASS**. metadata/full 요청 수, resume/bfcache, Local dirty의 기존 push 결정, 402/429/500/503, 자동 timer 및 단일 probe, backoff/Retry-After, gate 8종 차단, summary·detail·cursor·계정 race. 매 시나리오 `hani_os_life_v23` raw byte 동일·예상 밖 write 금지.
- 신규 전체 앱: **390/1440 각 6개 동작 + 원본 비교 PASS**. 일반/bfcache 복귀, revision 변경, 402 입장·반복 요청 억제, network 입장, 실제 접힌 아카이브 summary 클릭→뉴스 row 클릭→본문/댓글 표시·열림 유지. 각 측정 전후 보호 키 동일·pageerror0. 기존 navigation을 하는 준비 단계는 별도로 seed/snapshot.
- `hani-cloud-stability-runtime.test.mjs`: **34 PASS** (390/1440), reconnect/conflict/hold/revision/auth/new-device restore/snapshot denial.
- `hani-backup-history-runtime.test.mjs`: **11 PASS**. `hani-quality-data-runtime.test.mjs`: **28 PASS**.
- `hani-cloud-first.test.mjs`: **40 PASS**. `hani-cloud-conflict-choice.test.mjs`: **PASS**. `hani-cloud-egress-sync.test.mjs`: **PASS**. `hani-cloud-egress-save-sim.test.mjs`: **PASS**, 3저장 full read0·응답412B(합성 약200KB state). 예상 revision race의 오류 로그는 정상 음성 테스트 결과이며 최종 native exit0.
- `hani-navlogin.test.mjs`: **45 PASS**. `hani-navlogin-ui.test.mjs`: **390/1440 PASS**. `hani-login-session-ui.test.mjs`: **390/1440 재실행 PASS**, reload/tab/logout/invalid session·원문 보존. `hani-login-a-204-ui.test.mjs`: **3폭·6finish×4계절 PASS**.
- `hani-login-a-204.test.mjs`: **기존 baseline 실패**. Git PATH를 설정한 최종 실행에서 `canonical artwork sync preserves baseline behavior alongside integrated features` assertion 실패. 시험이 현재 함수에서 기존 Remote update 줄만 제거한 뒤 baseline 함수와 비교하므로 이미 Remote가 통합된 main에서도 동일 실패. **HEAD의 hani-main.js 원문으로 별도 재실행해 동일 실패(exit1) 확인**, 해당 `syncSeasonCollection` 함수 byte-identical도 신규 검사로 확인. 로그 `login-a-unit.log`/`login-a-baseline.log`. 초기 PATH 없는 실행의 preservation skip은 PASS 근거로 사용하지 않음. 범위 밖 테스트/그림 기능은 수정하지 않음.
- `hani-newsroom-followup-smoke.mjs`: **desktop/mobile PASS**.
- JS syntax 및 CRLF를 허용한 `git diff --check`: **PASS**. 보호 write/apply/push/decision/save/source guard·auth/recovery/read-upsert/그림 동기화 13함수는 기준 HEAD와 **EOL 포함 byte-identical** 검사 PASS. index/version/cache/server/schema 변경 없음. 기존 테스트가 재생성한 공용 `qa-evidence` 파일은 시작 원본으로 되돌리고 이 작업 근거만 `artifacts/egress-221`에 보존.
- 환경: Windows, Node v24.19.0, runtime Playwright, 설치된 Edge. 명령·원문 SHA256·로그 위치는 `artifacts/egress-221/README.md`, 계측값은 `browser-results.json` 참조. 외부는 합성 응답 이외 모두 차단.

### 미검증·남은 경계

- 실제 Supabase 402/Retry-After CORS 노출/SDK+운영 RLS·실계정·장치별 네트워크·Android 실기기 및 운영 payload byte는 미검증. API/DB/schema·server 배포 없음.
- full-read 성공 뒤 Cloud 내용이 실제로 다를 때는 기존 cloud-first apply 경로가 Local을 안전 보관 후 적용함. 이번 raw 불변 테스트의 revision 변경은 내용 동일 조건이며, 성공 pull 자체가 Local 불변이라는 주장이 아님. 원래 apply·snapshot·conflict 안전성은 기존 회귀 검사로 별도 확인.
- 인증 자체 실패는 원래 gate 보호를 유지. 이번 접근 허용은 인증이 확인된 사용자에 대한 state 읽기 장애 판단에 한정.
- circuit·cache·coalescing은 탭별 메모리 상태. 다중 탭 leader election/새 storage key/영속 장애 상태는 추가하지 않음. reload 후에는 새 세션에서 다시 확인.
- 버전/cache 증가, package/One-Pass/HINA/운영 Preview·PR·main merge·Pages·Production read-back은 열차 담당의 후속 경계이며 이번에 수행하지 않음.
- Notion: 현황판 읽기는 성공. 계획 append는 **자동 승인 검토가 policy never로 거절**하여 미반영. 새 카드/종료 요약·상태 갱신도 미반영이며 아래 내용을 갱신 대기로 인계: 2026-10-20 도연 / Egress 읽기·재시도 구현·검증 완료 / 위 branch·base와 파일·증거 / commit 결과 / 실제 Cloud·기기·열차 검증 대기 / 이 원문 링크. 연결·저장 완료로 보고하지 않음.

## 다음 담당에게

- 먼저 읽기: 이 문서, `artifacts/egress-221/README.md`, `hani-main.js`의 cloudSyncCycle/cloudProbeOutage/loginGateEnterApp/investmentNewsArchiveLoad/Detail.
- 다음 한 가지 행동: 배포 담당 Claude가 commit/push 상태를 확인하고 최신 main 위 열차에 통합한 뒤 해당 targeted 검사 재실행. 기능 충돌은 이 담당에게 반환.
- 서버 Edge Function·설정 동반 배포/배포 순서: 없음.
- CURRENT/DECISIONS: 과거·다른 담당 기록은 수정하지 않음. 이 작업별 원문이 현재 근거. Notion 갱신은 위 사유로 대기.

## Git 종료 결과

- 선택한 작업 파일만 `git add -- ...` 시도: worktree 외부 공용 gitdir의 `index.lock` 생성 **Permission denied**. 권한 우회/외부 gitdir 수정 없음.
- 요청대로 `git commit --only -m 'fix: coalesce cloud reads and back off outages' -- ...`도 시도. add가 차단되어 신규 test/docs/artifact 파일이 index에 등록되지 않아 pathspec 오류로 실패. commit 생성 없음.
- HEAD/base `4a913303afb3de11e948c899387b4760810684c1` 유지. 변경은 이 worktree에 미커밋 상태로 남김. 사용자 제공 `artifacts/egress-221/report.md` 원문은 수정하지 않았고 임의로 stage하지 않음.
- 다음 담당은 쓰기 가능한 Git 환경에서 runtime2파일·테스트6파일·이 문서와 작업 증거를 검토 후 함께 commit/push. 공통 qa-evidence/다른 담당 파일/버전·캐시 변경은 포함하지 말 것.
