# train233 모바일 sticky bar 회귀 후속 · Codex

## 작업 식별

- 갱신 시각(KST): 2026-10-24. 담당: Codex 단일 Agent.
- 상태: 한 줄 CSS 패치·Node targeted 검증 완료 / 수정 후 Edge 실화면 검증 대기 / Git index.lock 권한 거절로 미커밋.
- branch/worktree: `hani/train233-fix5` / `t233b`.
- base/시작 HEAD: `c026b630a94802415c1c868fba2d5ea0dadf05b6`.
- 로컬 origin/main: `a1e97d77d611a698e9dcd203510d54541b301a7c`. 원격 ls-remote 연결 실패, 최신성 미확인. merge/rebase 없음.
- 목표: 닫힌 Remote 상태의 sticky·스크롤 숨김/재표시·48px 복원, 열린 Remote 패널/trigger의 기존 문서 흐름 보존.
- 변경 범위: CSS1·기존 tooling5·작업별 증거/문서. 다른 담당 파일/worktree 수정 없음.
- 승인 근거: 대표님의 c026b63 투자리포트 회귀 원인 분석·최소 CSS 수정·Node 검증·로컬 commit 시도 요청.
- 금지 경계: Edge 실행/우회, push/PR/main/배포/Notion, 데이터·Cloud·Storage·보호키·표시버전/cache 변경, 신규 runtime JS/event/renderer layer.
- CODEMAP: investment-research owner/targeted 검사 확인. mobile header/Remote 세부 anchor는 CODEMAP_MISS; 실제 owner와 이벤트 경로로 fallback.

## 결과와 증거

- 기존 실패: `artifacts/train233-browser-5/hani-investment-research-ui.test.mjs.log.err`. 390 cream scroll-up에서 hidden=false이나 bar y=-469, scrollY=488, visibleBar=null, 높이50.
- 원인: f27be17의 무조건 relative/top:auto/height:auto/transform:none 규칙이 canonical sticky·48px·숨김 규칙을 덮음.
- owner: `hani-main.js::setupMobileTopStatus`의 기존 scroll/focus/resize 이벤트 + `hani-design-system.css`의 sticky/hidden/PWA CSS. `hani-ui-v02992.js`의 소유로 추정하지 않고 실제 코드 확인.
- 운영 수정: `hani-context-remote.css:198`의 `:has(.hani-context-remote)`에 `[data-open="true"]`만 추가. 닫힌 상태는 기존 owner, 열린 패널은 기존 relative/자동높이/wrap 규칙 사용. trigger/top-actions/panel 선언·JS 원문 불변.
- 기존 투자리포트 검사에 computed sticky assertion, QA UI에 닫힘 sticky → 열림 relative·본문 앞 배치 → 닫힘 sticky assertion 보강. 기존 높이48/overlap/대비/날짜/overflow assertion 유지.
- exact fixture: 기존 모든 속성·SHA·fragment·hash 그대로, `browserSticky`에 고정 c026b63→한 줄 selector delta만 추가. 최신 delta부터 역변환, 기존 Git oracle/release chain/내부 baseline 유지.
- CSS SHA-256: `b543f80d8301c5427f1c44d631b831b76e60e1b657f7ee076c6be290c9b36a68`.
- 검증: QA Node10 직접 PASS. reviewed13·OCR14·settings guard3 PASS(합계40), settings static4묶음 PASS. Git oracle 의존 검사는 검증된 고정 Git 입력124개 adapter 사용; 직접 reviewed는 Node Git subprocess EPERM으로 차단되어 PASS 아님.
- Safety: runtime JS7 syntax, canonical persistence/Storage/Cloud/version/cache 불변, graph68·기존중복8·unchanged16,896줄/EOL PASS. 추가 감사: baseline9파일 원문 동일·기존 fixture 속성 동일·수정6파일 unchanged1,481줄/EOL PASS. tooling4개 syntax·diff-check PASS.
- 상세 명령·diff·검증·재실행: [보고서](../../../artifacts/train233-sticky-followup/report.md), [감사](../../../artifacts/train233-sticky-followup/audit.json), [안전 결과](../../../artifacts/train233-sticky-followup/safety-results.json).
- 미검증: 실제 Edge 실측·scroll-up/숨김·panel 전환·AA·Preview. 새 PNG0. c026b63의 기존 browser PASS를 수정 후 PASS로 재사용하지 않음.
- main/Pages/Production read-back·Candidate/build/One-Pass/HINA: 요청 범위 밖, 미실행. 로컬 표시/cache2.9.232·마지막 script `hani-launch-greeting.js` 보존.
- 데이터·저장소·Cloud/schema 영향: runtime CSS 한 줄 외 운영 원문 불변, write 경로 변경0.
- Notion: 대표님 명시 금지로 미갱신; 공유할 요약은 이 문서에 보존.
- Git: `git -c core.autocrlf=false add -- <수정6+인수인계+선택한 보고서/증거>` 1회가 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/t233b/index.lock: Permission denied`로 실패(exit128). commit 미실행, 시작 HEAD c026b63 유지. 재시도/우회/직접 index 조작 없음. 원문 snapshot/tar와 기존 미추적 browser 결과는 stage 대상으로 지정하지 않음. push/PR/main/배포 없음.

## 다음 담당에게

- 먼저 읽을 파일: 위 report와 최종 CSS 모바일 블록, `setupMobileTopStatus`.
- 다음 행동: Edge 허용 환경에서 투자리포트·QA390/412/1440·Remote3종·PWA·market·banners 총8종 재실행. 명령/확인점은 보고서 참조.
- 필요한 확인: 닫힌 Remote는 sticky/48px이고 아래 스크롤 때 숨김·위 스크롤 때 노출됨. 열림 relative/static 패널이 본문 위에 배치되며 trigger/controls 겹침·가로 overflow 없음.
- blocker: Git index 쓰기 권한·Edge 허용 환경·원격 main 최신성. 권한 가능한 담당자가 명시한 파일만 로컬 commit하고 browser 8종을 재실행해야 함. 실제 화면 확인 전 Release PASS로 보고하지 않음.
- CURRENT/DECISIONS: 다른 담당·과거 기록 보존, 변경 없음.
