# launch-221 저장소 실패 fallback 보완

## 작업 식별

- 갱신 날짜(KST): 2026-10-20. 담당: 도연(Codex), 단일 Agent.
- 상태: source 수정 완료, Node 검증 완료, 서윤 browser 재검증 대기. branch `hani/night-actions-221`, HEAD `e734cf4f045711882f0d14013eb63bf5680b4546`.
- base/origin/main 캐시: `4a913303afb3de11e948c899387b4760810684c1`. `git ls-remote origin refs/heads/main`은 GitHub 연결 실패로 최신성 미확인. merge/rebase 없음.
- 표시 기준 v2.9.220, 마지막 UI script `hani-launch-greeting.js`(기존 인수인계/index 연결 기준); 운영 화면·실제 로딩은 이번 요청 범위 밖으로 재확인하지 않음.
- 승인: 대표님 이번 요청의 source fallback·fixture 보완·Node 검증·커밋 시도. 버전/cache·Cloud·보호 데이터·배포 변경 없음.
- 수정 범위: `hani-launch-greeting.js`, browser/unit launch-221 검사, 이 인수인계와 CURRENT의 이번 작업 요약. 서윤의 visible heading focus·focus assertion·2600/1700ms tolerance와 기존 다른 작업 전부 보존.
- CODEMAP_MISS: `dev-center/codemap.json`에 launch/greeting/221 owner anchor 없음. 실제 module의 readPrefs/writePrefs/start 및 browser fixture 확인으로 fallback.

## 결과와 증거

- 원인: browser fixture는 `Storage.prototype`을 수정하여 localStorage와 sessionStorage 모두의 UI key 접근을 차단하면서 reload 이후에도 세션 1회를 기대함. 두 저장소 차단 시 페이지 메모리만 사용 가능.
- 변경: source에서 session의 seen 날짜도 복구하고, localStorage 실패 후에는 해당 store 쓰기를 재시도하지 않음. `alreadySeen`으로 세션 기록 및 closure의 `seenInMemory` 확인을 통합. 두 store 접근 모두 try/catch 유지.
- browser fixture: 기존 `throwing:'both'`는 get/set 실패를 뜻하며 기본적으로 localStorage만 차단. `failSession:true`를 별도 추가하여 두 store 차단 시 문서당 1회(다음 문서에서 총 요청2), 그 외 탭 세션당 1회(익일 reload 후에도 총 요청1)로 검증. 기존 포커스 assertion·타이밍 허용범위 유지.
- Node fixture: 서윤 focus 코드에 필요한 `hasAttribute` DOM double 추가. storage 오류별 reload·새 탭 검증 강화, 양쪽 실패 시 write0·새 페이지에서 1회 및 같은 페이지 relock 중복 없음 확인.
- 검증: `node scripts/hani-launch-greeting-221-unit.test.mjs` 실제 module VM **30 PASS / 0 FAIL / 0 SKIP**. 실행 로그는 `artifacts/launch-221/storage-fallback-node.log`. `node --check hani-launch-greeting.js`, `node --check scripts/hani-launch-greeting-221.test.mjs`, `node --check scripts/hani-launch-greeting-221-unit.test.mjs`, `git diff --check` PASS.
- 보호 데이터: 모든 VM fixture에서 life sentinel 유지, UI key 외 write 없음 확인. 버전/cache·Cloud·기존 다른 owner 파일 diff 없음. read-only 실패도 session만 사용하며 기존 Local 정상 원문을 삭제·초기화하지 않음.
- Git 시도 결과: 위 5개 작업 파일을 지정한 `git add -- ...`는 외부 `.git/worktrees/night221/index.lock` 생성 permission denied(exit1). 이어 `git commit --only -m "fix(ui): preserve launch greeting fallback per tab session" -- ...`도 신규 인수인계 pathspec 미등록으로 실패(exit1). HEAD 유지, 대표님 지시대로 미커밋 보존. push/PR/merge/배포 없음.
- 실제 Edge 재검증: 서윤 담당. 기존 12 screenshot은 이전 실행 근거이며 수정 후 PASS 증거로 재사용하지 않음.
- 데이터·저장소 영향: 승인된 UI prefs `hani_theme_settings_v1`만 사용. `hani_os_life_v23` write/remove/clear 경로 추가·수정 없음. Cloud/schema/migration 없음.
- main/Pages/Production read-back: 미수행. 버전 증가는 기능 담당 금지로 열차 담당 단계 대기.

## 다음 담당에게

- 서윤: 수정 후 `node scripts/hani-launch-greeting-221.test.mjs` 실제 Edge 재실행.
- Notion: 현황판 읽기 성공. 이번 계획 append는 자동 승인 검토의 `MCP tool call requires approval, but approval policy is never` 거절로 미반영. 추가 권한 요청/우회 없음. 갱신 대기 요약: source·fixture fallback 보완 및 Node PASS, 서윤 browser 재실행 대기, Git 결과는 아래 참조, 버전·Cloud·보호 데이터·배포 변경 없음. 읽어 확인한 저장 결과가 없으므로 갱신 완료 아님.
- CURRENT/DECISIONS: 완료 후 확인한 상태만 CURRENT에 추가, 정책 결정 변경 없음.
