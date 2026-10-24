# train233 browser 실패 후속 · Codex

## 작업 식별

- 갱신 시각(KST): 2026-10-24. 담당: Codex, 단일 개발 Agent.
- 상태: 최소 패치 작성 / Node targeted 검증 완료 / 실제 browser·Release gate 검증 대기. 미커밋.
- branch / worktree: `hani/train233-verify` / `t233`.
- base: `2cbbe6ed0c14954008208f0db2316b5f09228c2a`, 시작 HEAD: `5a665a3`.
- origin/main 로컬 참조: `a1e97d7`. 원격 조회는 GitHub 연결 실패로 최신성 미확인. merge/rebase 없음.
- 로컬 index cache: v2.9.232, 마지막 script: `hani-launch-greeting.js`. Production 표시/실제 로딩 미확인.
- 목표: 지정 browser 실패 10종을 승인 변경에 따른 기대값(A), 실제 표시/동작 결함(B), flaky/환경(C)으로 분류하고 최소 수정 및 가능한 targeted 검증.
- 범위: t233 내 관련 테스트 및 기존 CSS/JS owner, 작업별 증거. 다른 worktree 수정 금지.
- 승인 근거: 현재 대표님 요청. push/PR/main/배포/Notion 작업 없음. storage/Cloud/schema/version/cache 및 baseline fixture 변경 없음.

## 결과와 증거

- 기존 근거: `artifacts/train233-browser/` 로그 및 summary. 원본을 보존하고 후속 증거는 `artifacts/train233-browser-followup/`에 기록.
- CODEMAP: investment/asset owner 확인. remote/organization/hero 및 신규 QA 세부 anchor는 CODEMAP_MISS, 관련 인수인계 및 실제 renderer/event 경로로 fallback.
- 분류: A6(배너 desktop crop, HANI-77 overview hero 2종, Milestones nav count, settings before fixture, market Remote 위치) / B4(Remote scroll2, PWA date overflow, QA overlap/금액) / C는 Edge·Git subprocess 환경 차단. flaky로 확정한 항목 없음.
- 변경: CSS3개(`hani-context-remote.css`, `hani-design-system.css`, `hani-portfolio-preview.css`)와 browser 테스트6개, 총9개 tracked 파일 +33/-16. Remote 기존 mobile block3줄, date grid3줄, mobile portfolio summary1줄만 runtime 수정. JS/event/renderer layer 추가 없음.
- 실제 검증: QA Node10·navlogin45·배너 Node·Milestones Node14·Remote Node/persistent25/write0·history unit PASS. 변경 browser6개 syntax PASS. untouched 원문/EOL2,781줄 및 main/index 바이트 보존 감사 PASS. git diff --check PASS.
- 별도 결과: hero-restore3 PASS/1 exact fragment FAIL(추가 CSS), brand1 PASS/2 Git EPERM 차단, settings static Git EPERM 차단. settings 원래 route 오류/수정 변환/변조 검출은 고정 HEAD에서 정적 실행 PASS이며 browser PASS 아님.
- 환경: Edge 실제 launch1회 `spawn EPERM`, 이후 재시도 없음. 수정 후 browser10종·관련 owner UI·새 screenshot0/실화면 미검증. 기존 로그·PNG 보존.
- 데이터·Storage·Cloud·schema·runtime JS·표시/cache·내부 baseline 변경0. fixture/reviewed-release-baseline 변경0. 원문 보존 Git 비교 rc0.
- 상세 분류·근거·명령·미검증·후속: [보고서](../../../artifacts/train233-browser-followup/report.md), [정적 감사](../../../artifacts/train233-browser-followup/audit.json), [diff](../../../artifacts/train233-browser-followup/patch.diff).
- Git: `git -c core.autocrlf=false add` 1회가 `.git/worktrees/t233/index.lock: Permission denied`로 실패. commit 미실행, 재시도/우회 없음, HEAD5a665a3 유지. push/PR/main/배포 없음.
- Feature 검증과 Candidate 검증을 구분: exact fragment mismatch를 숨기지 않았으며 Candidate freeze/build/One-Pass/HINA/Production 검증은 미진행.

## 다음 담당에게

- 먼저 읽을 파일: 위 보고서의 실패10종 표와 기존 owner CSS diff. CODEMAP_MISS fallback 경로는 시작 기록 참조.
- 다음 한 가지 행동: Edge 허용 환경에서 동일 diff를 targeted browser 재검증하고 1440/390 screenshot 확보. 관련 명령·우선 확인사항은 보고서에 기록.
- blocker: browser launch/Git subprocess 및 Git index 권한. 실화면·전체 보존 gate·commit 미완료. 새 CSS를 승인 fixture로 임의 등록하지 않았으므로 release 담당의 검토/새 candidate identity 정리가 필요.
- Notion: 이번 요청의 금지 범위에 따라 미갱신. 공유 필요 내용은 이 문서에 보존.
- CURRENT / DECISIONS: 공통 과거 기록 보존, 변경 없음.
