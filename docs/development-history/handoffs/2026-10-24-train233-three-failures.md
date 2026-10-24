# train233 잔여 3종 후속 · Codex

## 작업 식별

- 갱신 시각(KST): 2026-10-24. 담당: Codex 단일 Agent.
- 상태: 최소 CSS 수정·Node 검증 완료 / 수정 후 Edge 검증 대기 / Git add 권한 차단으로 미커밋. branch/worktree `hani/train233-verify` / `t233`.
- base/시작 HEAD: `f27be17c1b3ea989fec3b4886f36b3b32c4caa27`.
- 원격 main: 조회 연결 실패. 로컬 origin/main `a1e97d77d611a698e9dcd203510d54541b301a7c`. 자동 merge/rebase 없음.
- 표시/cache: 로컬 2.9.232 유지, 마지막 script `hani-launch-greeting.js`. 운영 화면/로딩 미확인.
- 목표: 기존 Edge 로그의 ledger 대비, Remote 테마 픽셀, exact baseline 실패를 분류·최소 수정·Node 검증.
- 범위: 기존 owner CSS2개, exact preservation fixture/검사, targeted UI 검사와 작업별 증거. CODEMAP에 QA/Remote anchor 부재(CODEMAP_MISS), 실제 CSS/renderer 경로로 fallback.
- 승인: 이번 대표님 요청의 로컬 수정·검증·commit. push/PR/main/배포/Notion 금지. 데이터/Cloud/저장소/버전/cache 변경 금지. 새 JS layer 없음.

## 결과와 증거

- 기존 근거: `artifacts/train233-browser-2/summary.txt`, 관련 `.log.err`, `artifacts/remote-219/card-390-reading-*.png`.
- ledger: B. QA 1차의 밝은 고정 글자가 밝은 테마에서도 !important로 적용됨. 기존 owner 색상 선언3개를 Finish ink로 수정. 이전 certificate 실패가 뒤의 ledger 실패를 가렸음. 실화면 대비 미검증.
- Remote: B. 헤더 내부 패널 제목에 legacy `.top h2:after`가 적용됨(높이4px/폭42px/theme primary). 기존 PNG의 delta124가 원래 비교 interior의 x24–54/y104–107 124픽셀에만 존재함을 재현. 기존 media owner에서 pseudo 장식만 차단. 테마 픽셀 assertion 완화 없음.
- baseline: A. f27be17 CSS3개가 이전 fixed fixture에 등록되지 않음. 해당 고정 Git 원문과 이번 보정2개의 exact before/after·full SHA로 등록. 최신 보정→f27be17→기존 integration/Milestones 역변환, 기존 Git release chain 불변. 실제 Milestones 훼손 아님.
- Edge 실행/우회/재시도 없음. 수정 후 실화면 PASS를 선언하지 않음.
- 변경: CSS2 + tooling3파일, runtime JS0. 데이터·Storage·Cloud·보호키·표시/cache·내부 baseline 변경0. main/index/Remote runtime JS는 f27be17 바이트 동일.
- 검증: 직접 QA10·Remote Node·QA safety(runtime JS7/graph68/16,892줄 EOL/저장·Cloud·version 불변) PASS. reviewed11·OCR14·settings static PASS는 Git 추출 원문 adapter 사용: 직접 Git subprocess는 EPERM, 별도 shell에서 추출한 fixed ref25/blob122개를 Git object ID로 검증한 뒤 원본 테스트 본문 실행. 직접 실행 PASS와 구분. 추가 unchanged2,539줄/EOL 감사·JS syntax·diff-check PASS.
- 원문·실행 명령·hash·분류·제한·다음 검증: [보고서](../../../artifacts/train233-three-failures/report.md), [diff](../../../artifacts/train233-three-failures/patch.diff), [감사](../../../artifacts/train233-three-failures/audit.json).
- Git: core.autocrlf=false add1회가 index.lock Permission denied로 실패. commit 미실행, HEAD f27be17 유지. 재시도/직접 index 조작 없음. push/PR/main/배포 없음.

## 다음 담당에게

- 먼저 읽을 파일: 위 report 및 CSS2파일 diff. 기존 `.top h2:after`와 QA ledger !important 소유 경로 확인.
- 다음 행동: Edge 허용 환경에서 QA1차 UI·Remote219·Remote224·context-remote UI·settings browser 검증. cream/black ×390/1440 실제 대비·Remote action/scroll/pixel/AA 확인 후 권한 가능한 환경에서 로컬 commit. 원문 tar/snapshot 디렉터리 일괄 commit 금지.
- blocker: Edge 검증 가능한 실행환경, Git index 쓰기 권한, 원격 main 최신성. 대표님 Preview/열차 승인은 미수행. 이번 작업은 구현/Node 단계이며 배포 완료 아님.
- Notion: 이번 요청의 금지 범위로 미갱신. CURRENT/DECISIONS 보존.
- Candidate/Release/운영 read-back 미진행.
