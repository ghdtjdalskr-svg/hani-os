# train233 모바일 sticky header / 입력 컨트롤 스크롤 후속

## 작업 식별

- 갱신: 2026-10-24 KST / 담당: Codex 단일 Agent.
- 상태: 최소 CSS/QA 진단 수정·Node targeted 검증 완료, Edge 재검증 대기. Git index.lock 권한 거절로 미커밋. branch `hani/train233-fix5`, worktree `t233b`.
- base/시작 HEAD: `a29ff905be5a3458a0f6971c107c183d96c6b965`.
- 로컬 origin/main: `a1e97d77d611a698e9dcd203510d54541b301a7c`. 원격 ls-remote 연결 실패로 최신성 미확인. merge/rebase 없음.
- 목표: sticky/48px/숨김 owner를 보존하고 모바일 입력 anchor 스크롤의 헤더 공간 확보. 기존 overlap assertion 유지, 초기/anchor/scroll-up 실제 geometry 진단 보강.
- 범위: 기존 CSS owner, 기존 QA UI 및 exact reviewed-baseline tooling, 작업별 문서/증거.
- CODEMAP: investment-research owner/targeted 검사 확인. mobile header/Remote 전용 anchor는 CODEMAP_MISS, 실제 코드로 fallback.
- 승인 근거: 대표님의 a29ff90/browser-6 QA 잔여 실패 원인 분석·최소 수정·Node 검증·로컬 commit 시도 요청.
- 경계: Edge 실행/우회 금지, push/PR/main/배포/Notion 금지. 데이터/Cloud/Storage/보호키/버전/cache 및 신규 runtime JS/event/renderer layer 변경 금지.

## 결과와 증거

- 기존 Edge 결과: `artifacts/train233-browser-6/` 7종 PASS, QA UI는 `390/investmentIntake: Remote covers controls`, actual `assetCaptureAccount`. 수정 후 PASS로 재사용하지 않음.
- 실제 Edge 실행은 이 환경에서 하지 않음. 수정 후 브라우저 8종은 허용 환경 담당자가 재실행해야 함.
- Notion은 이번 요청의 명시적 금지로 미갱신, 공유 요약은 이 문서에 보존.
- 운영 변경: `hani-design-system.css` 기존 <=768px/48px header 블록에 root scroll-padding(56px + safe area), view controls scroll-margin(8px) 및 주석 3줄 추가. sticky/높이/숨김/Remote 배치 원문 보존. runtime JS 변경 없음.
- QA 변경: 초기 80ms의 overlap/scrollY/focus 기록, native smooth 스크롤 정지 후 기존 assertion19 유지, 투자 입력/intake anchor 및 scroll-up geometry/48px/44px/reachable 검사. 기존 browser width/theme/view/date/contrast/home/money/clip 조건 보존.
- 원인 범위: browser-6 실패 로그에는 좌표/scrollY가 없어 단일 원인 확정 불가. global smooth scroll+80ms 중간 측정 가능성과 sticky offset 부재를 코드로 확인. 수정 후 실제 원인은 Edge 진단으로 구분해야 함.
- Exact fixture: 고정 a29ff90의 `browserScroll`만 추가. 기존 모든 속성/SHA/hash/fragment 동일; CSS full hash·양방향 복원·변조/이동/누락/중복/EOL 거절. Git oracle/release chain/내부 baseline 불변.
- Node: QA10 직접 PASS; reviewed14·OCR14·settings guard3는 검증된 고정 Git 입력(기존124+신규2 blob)으로 PASS. 총41개. settings static4묶음 PASS. reviewed 직접 실행은 Git subprocess EPERM으로 차단, 직접 PASS 아님.
- Safety PASS: runtime JS7 syntax, canonical persistence/Storage/Cloud/version/cache 동일; graph68/기존 중복8, unchanged16,897줄/EOL. 추가 감사: 운영9파일 전체 bytes/EOL·기존 assertion19·이전 fixture 동일, 변경5파일 unchanged2,609줄/EOL. tooling3 syntax·diff-check PASS.
- 증거·명령·실행하지 않은 8종: [보고서](../../../artifacts/train233-scroll-followup/report.md), [감사](../../../artifacts/train233-scroll-followup/audit.json), [안전](../../../artifacts/train233-scroll-followup/safety-results.json), `artifacts/train233-scroll-followup/*-node.log`, `settings-static.log`, `patch.diff`.
- 미검증: 수정 후 실제 Edge/스크롤·focus·native select·touch·화면 대비 및 PNG. 8종을 허용 환경에서 재실행할 때까지 실패 해결 확정 아님.
- main/Pages/Production read-back·Candidate/build/One-Pass/HINA: 범위 밖 미실행. local 표시/cache2.9.232, 마지막 UI script `hani-launch-greeting.js` 보존. 데이터/Cloud/schema 영향0.

## 다음 담당에게

- 먼저 읽을 파일: 위 report, `hani-design-system.css`의 기존 48px mobile header 블록, `scripts/hani-qa-1st-ui.test.mjs`.
- 다음 한 가지 행동: 동일 최종 diff로 Edge 8종 재실행. QA의 early/settled/anchor/scroll-up geometry를 비교해 초기 중간 스크롤인지 지속 겹침인지 구분한다.
- Git: `git -c core.autocrlf=false add -- <운영1+tooling4+인수인계+보고서/선택증거>` 1회가 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/t233b/index.lock: Permission denied`로 실패(exit1). commit 미실행, HEAD a29ff90 유지. raw archive/base/작업 스크립트 및 기존 browser artifact는 stage 대상으로 지정하지 않았다. 우회/재시도/직접 index 조작 없음. push/PR/main/배포 없음.
- blocker: Git index 쓰기 권한, Edge 실행 금지/환경 제한 및 원격 main 최신성 미확인. 권한 허용 담당자가 이번 명시 변경만 commit하고 동일 diff로 browser8종을 재실행해야 한다. 추가 데이터·배포 승인으로 추정하지 않는다.
- CURRENT/DECISIONS: 다른 담당과 과거 기록 보존, 변경 없음.
