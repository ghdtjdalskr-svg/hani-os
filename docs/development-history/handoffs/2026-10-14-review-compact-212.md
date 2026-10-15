# 검토 요약·월간 투자 보고서 212

## 작업 식별

- 갱신: 2026-10-15 KST (10/14 중단 작업 재개)
- 담당: 도연 (Codex), 개발 Agent 1명. 역할 이름을 바꾼 독립 리뷰 없음.
- 상태: Part A + Part B 구현·targeted QA 완료, 로컬 미커밋. 운영 반영 아님.
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/review-compact-212 / rc212
- base/HEAD: 4dea5f6823549e9f13d1e15b6f716600951c4685. 새 세션 원격 main API 조회와 일치. merge/rebase 없음.
- 승인 근거: 대표님 재개 요청 + ../review-compact-task.md의 Part A + 10/15 확정 월간 보고서 디자인 Part B.
- 경계: commit/push/버전 증가/PR/main merge/배포 없음. 신규 storage key·Cloud·schema·migration 없음. 기존 저장 owner만 사용.
- 수정 파일: hani-investment-committee.js/.css, scripts/hani-second-opinion.test.mjs, hani-second-opinion-ui.test.mjs, hani-investment-research-ui.test.mjs, hani-review-compact-212.test.mjs, hani-monthly-report-design-212.test.mjs, 본 인수인계. artifacts 두 작업 폴더에 합성 검증 증거.
- CODEMAP: investment-research owner·월간 이벤트 확인. 211 second/final anchor 미등재는 CODEMAP_MISS로 좁은 실제 코드 검색. 다른 담당 파일 덮어쓰기 없음.

## Part A · 검토 요약과 수정본 초안

- 이전 미커밋 작업을 유지·검증. 카드당 검토 요약 1개, Gemini 동의/적정가 chip, 하니 최종 badge·변경 표시·반영/기각 건수, 제목에 전체 문장이 있는 한 줄 결론(600px 이하 2줄).
- native details 자세히 안에 이전 Gemini/하니 최종 본문·우려·빠진 위험·반영/기각과 이유·전체 근거·다음 확인 포인트를 모두 보존. HTML escape 및 stale/account/session 무효화 유지.
- 기존 메모 저장 버튼은 접힌 상태에도 노출. 설명은 title로 이동. 명시 확인 이후 기존 saveSecondOpinionNote → applyBatch → commit만 사용.
- 수정본 추가 시 현재 월의 유효 세션 최종 의견 또는 선택 월에 저장된 최신 메모에서 종목별 짧은 근거를 executiveSummary 초안에 추가. 기존 결론과 사용자 편집 보존, 중복 줄 제외. 확정 전 저장 없음.
- 상향/하향 대상별 카드 Rating에도 반영은 기존 openEditor에 목표 Rating/변경 이유를 미리 선택. 카드 저장은 별도의 명시 Research 저장. 월간 초안은 그대로 유지하고, 그 초안에서 연 카드의 정상 저장에 한해서만 원본 기준을 갱신. 원본 변경 거절은 기존 경로 유지.
- 실측: 긴 의견 fixture에서 카드 전체 높이는 v211 대비 13.8~15.8%, 검토 블록은 4.2~4.7%. 모든 조합에서 1/3 이하, 가로 넘침 없음.
- 증거: artifacts/review-compact-212/{compact-ui.log,height.log,height-metrics.json}, collapsed/expanded/long-*/revision-session 1440·884·412 × porcelain-cream/midnight-black PNG.

## Part B · 확정 월간 보고서 읽기 전용 디자인

- canonical renderMonthly의 확정 snapshot 경로만 confirmedReportHtml로 구성. 초안은 헤더 class를 살짝 맞추며 기존 form·event owner·저장 유지.
- 표지: HANI MONTHLY INVESTMENT REPORT, 큰 YYYY.MM, 확정본/수정본 badge, KST 확정 시각. 기존 Finish surface·cobalt·gold 토큰의 옅은 finance gradient.
- KPI: snapshot의 포트폴리오 판단, 검토 종목 수, 평균 확신도, 전월 대비 Rating 상향/하향. 전월 비교는 직전 달 최신 snapshot과 공통 ID가 있을 때만. 평가액은 frozen holdingsRefs 전체에 같은 통화의 유효 기록 평가액이 있을 때만 합산. 누락·혼합 통화는 숨김. live 시세/계좌로 KPI 보완하지 않음.
- 이번 달 결론 pull-quote와 기존 시장 관점·핵심 요약·하니의 제안·변경/행동 목록·역할/테마·적립식/점검 내용 보존.
- RATINGS 순서 STRONG BUY/BUY/HOLD/REDUCE/EXIT와 기존 pill 색을 재사용한 분포 bar/범례.
- 종목 카드: 이름·ticker·Rating, frozen Low/Mid/High/현재가 범위(동일 통화·정상 순서의 양수 값이 모두 있을 때), 0~100% 경계 내 marker, 확신도 meter, title로 전체를 읽을 수 있는 한 줄 thesis. 기존 가격 기준일·상하방·직전 Rating·하니 의견·행동·상세 버튼 보존.
- 수정본 horizontal stepper는 기존 data-monthly=revision/data-snapshot 및 monthlyHost click owner 사용. 현재 항목 aria-current=step. 최신 수정본 보기·수정본 추가·종목 상세/history 핸들러 유지.
- 1440/884/412 responsive, 두 Finish AA. print에서 흰 바탕·버튼 숨김·카드 페이지 나눔 회피. 스크린샷 때만 unrelated fixed OS chrome을 숨겨 보고서 원문이 가려지지 않게 캡처.
- 증거: artifacts/monthly-report-212/{design-ui.log,results.json}, confirmed-*/minimal-* 12 PNG + print 두 테마 PNG. 최저 검사 대비 5.12:1, 가로 넘침 0, 읽기/수정본 조회/초안 취소 persist 0.

## 실행한 검증 / 재실행 방법

환경: Windows, 제공 Node v24.19.0 + Playwright + 실제 Edge headless, 합성 fixture만. 실제 사용자 계정/원격 LLM/Cloud 데이터에 쓰지 않음.

실행기 약어(아래 명령은 rc212 루트):

~~~powershell
$runtime='C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies'
$node="$runtime\node\bin\node.exe"
$pw="$runtime\node\node_modules\playwright\index.mjs"
$edge='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
~~~

- Node 97/97 PASS, 실패/skip 0: 아래 14파일 --test. artifacts/monthly-report-212/node-tests.log.

~~~powershell
& $node --test scripts/hani-investment-committee.test.cjs scripts/hani-investment-research.test.cjs scripts/hani-post-audit-investment.test.mjs scripts/hani-second-opinion.test.mjs scripts/hani-final-review.test.mjs scripts/hani-review-compact-212.test.mjs scripts/hani-monthly-report-design-212.test.mjs scripts/hani-ic-accumulation.test.cjs scripts/hani-ic-polish-205.test.cjs scripts/hani-ic-report-205.test.cjs scripts/hani-invest-basis.test.cjs scripts/hani-invest-split.test.mjs scripts/hani-market-data-test.cjs scripts/hani-portfolio-completeness-test.js
& $node scripts/hani-second-opinion-ui.test.mjs $pw $edge
& $node scripts/hani-monthly-report-design-212.test.mjs $pw $edge
& $node scripts/hani-investment-research-ui.test.mjs $pw $edge artifacts/monthly-report-212/regression
& $node artifacts/review-compact-212/verify-height.mjs $pw $edge
& $node artifacts/monthly-report-212/verify-safety.cjs
& $node scripts/hani-investment-research-safety.test.cjs artifacts/monthly-report-212/baseline/hani-main.js artifacts/monthly-report-212/baseline/index.html
& $node --check hani-investment-committee.js
~~~

- compact UI: 6조합 PASS. session/memo prefill·수정·취소·명시 card save·월간 확정·old snapshot 보존·0 console error 포함.
- 새 디자인 UI: 6조합 PASS. optional KPI 숨김·분포·range 경계·수정본/history·초안 편집/취소·AA·print·무쓰기·0 console error.
- 기존 investment-research UI: 1440/390 × 두 Finish 4조합 PASS. 실제 기존 저장/재진입·freeze·수정본·source-change guard·적립식·기존 DOM/데이터 보존·print 확인. 마지막 CSS 정리 후 재실행 결과는 research-ui.log.
- 안전 검사 PASS: hani-main.js/index.html Git 원본 byte 동일, 보호 owner 21개 유지, existing applyBatch/prepareBatch/prepareSnapshot/confirmCommittee/saveSecondOpinionNote/saveAccumulationAccounts 원문 동일, 저장소 키·내부 VERSION·표시 v2.9.211·cache 그대로. 마지막 script hani-ai-budget.js?v=2.9.211 유지.
- mixed EOL: 기존 고유 동일 구문/줄의 EOL 보존 확인. git -c core.whitespace=cr-at-eol diff --check PASS(기존 CRLF를 trailing whitespace로 바꾸지 않음). 신규 runtime 파일/id literal/storage/Cloud 경로 없음.
- 최종 수정 파일 SHA-256: artifacts/monthly-report-212/tested-files.json. 미커밋이므로 candidate/package identity로 보고하지 않음.

## 미검증 / 다음 담당에게

- 실제 로그인 계정·실제 Gemini/하니 응답·Android/Z Fold 실기기·실제 종이 pagination은 미검증. 브라우저 폭 시뮬레이션 및 print media만 검증.
- 아린 독립 UI 검토·Candidate freeze/package/One-Pass/서버 HINA·운영 read-back은 미수행. 이 작업에서 배포 후보를 요청받지 않았고, 성민 대표님 commit/버전 증가 금지 유지.
- main merge / Pages / 운영 표시 버전 / 운영 최신 JS / 기능 read-back: 모두 이번 변경 미반영, 운영 완료 아님.
- 서버 Edge Function·설정·배포 순서: 추가 변경 없음.
- 다음 행동: 성민 대표님이 스크린샷/로컬 Preview로 UI 확인. 이후 별도 commit 지시를 받으면 변경을 commit/push하여 배포 담당 Claude에게 열차 인계. 현 상태를 이미 push한 탑승본으로 취급하지 않음.
- Notion: 현황판 읽기 성공. 시작/재개 요약 insert_content는 자동 승인 검토가 approval policy is never로 거절. 현재 구현/검증 완료 요약 및 탑승 대기 전 로컬 미커밋 상태를 Notion에 반영해야 함. 갱신 완료로 보고하지 않음. 재시도/권한 우회 없음.
- CURRENT/DECISIONS: 다른 담당/과거 기록 보존, 본 작업별 인수인계만 갱신. 자동 동기화·운영 승인으로 해석하지 않음.

## Part C · 상단 보고서 개선 착수 · 2026-10-15 KST

- 담당 도연(Codex), branch hani/review-compact-212 / HEAD 3965d39667a8051dd36a1d3ab790e425e11eea61. 원격 main 4dea5f6 확인, 기준 변화 없음.
- 범위: confirmedReportHtml / reportKpisHtml / reportDistributionHtml 및 확정본 역할 표 표시, CSS, design-212 targeted test, 합성 screenshot. 기존 이벤트·저장 owner와 다른 담당 파일 보존.
- 대표님 승인: 표지·카드·분포·미지정 역할 표시 전용 수정. commit/push/버전 증가/새 storage key/배포 금지 유지.
- Notion 착수 기록 append는 자동 승인 검토의 approval policy never로 거절됨. 완료 요약 갱신 대기를 본 인수인계에 보존.

### Part C · 구현 및 검증 결과

- 상태: 상단 개선 구현·디자인 targeted QA 및 기존 UI 회귀 완료. 위 Part A/B의 미커밋 표기는 과거 기록이며 해당 구현은 현재 HEAD 3965d39에 존재합니다. 이번 Part C 변경만 미커밋이며 commit/push/main merge/배포는 하지 않았습니다.
- 표지: 기존 assets/heroes/investment.png 재사용, navy/cobalt 테마 토큰 기반 finance gradient, soft fade, kicker, 큰 YYYY.MM과 월별 한국어 제목. 기존 conclusionLines 첫 줄을 cover headline으로 이동하고 확정 시각(KST)·검토 종목 수·수정본 meta, 이중 테두리 stamp 적용. 원문을 중복 렌더링하지 않고 나머지 결론 두 줄 보존.
- KPI: 기존 누락값 숨김 규칙 보존. 아이콘·라벨·큰 값·caption·유형별 accent의 개별 카드와 확신도 mini ring. Rating 상향 빨강/하향 파랑 및 방향 글자·화살표 병기. 1440/884/412에서 5/3/2열, 전체 카드 동일 높이. 884의 실제 보고서 폭 320px에서도 month 줄바꿈과 숫자 넘침이 없도록 container query 적용.
- 분포: RATINGS 순서와 count 비율 보존, 높은 채도의 segment 안에 count 표시, 아래 legend chip. 20% 균등 분포·BUY 2개 40%·HOLD 단독 100% 실행 검증.
- 역할: 확정본에서 모든 역할이 미지정이면 표 대신 muted 한 줄. 실제 지정 역할이 하나라도 있으면 표 유지, 공통 테마와 중복 경고 보존. 초안의 역할 표 동작은 유지.
- 변경 파일: hani-investment-committee.js/.css, scripts/hani-monthly-report-design-212.test.mjs. 기존 scripts/hani-ic-report-205.test.cjs 및 hani-investment-research-ui.test.mjs의 미지정 표/표지/결론 위치 기대값도 승인된 표시 동작에 맞춰 수정. 저장·freeze·guard assertion은 유지.
- 검증 PASS: Node 97/97 (14파일, 앞의 실행 명령 동일); 실제 Edge design-212 6조합, headline/meta/기존 이미지 로딩·KPI 누락 숨김·5/3/2열/동일 높이·한 줄 month·분포 숫자/비율·미지정/지정 역할·테마 보존·수정본/history/초안 편집 취소·print·원본 불변·persist 0·console error 0.
- 대비: 두 테마 전 조합 최소 5.12:1. cover 두 gradient endpoint, 좁은 화면에서 겹칠 수 있는 artwork의 최악 흰 픽셀 합성 상한까지 검사. 문서/보고서/자식 요소 가로 넘침 0.
- 안전 PASS: hani-main.js/index.html 원본 byte 동일, 기존 보호 owner 21개와 persistence/snapshot owner 원문 동일, ID literal·storage API 경로 추가/중복 없음, 표시 v2.9.211/cache/internal version 유지. 변경 5개 코드·테스트의 기존 동일 줄 EOL 보존 및 git -c core.whitespace=cr-at-eol diff --check PASS.
- 기존 investment-research UI 4조합 최종 PASS: 실제 Edge 1440/390 × 두 Finish. 명시 저장/재진입·freeze·수정본·source-change guard·적립식·기존 데이터/DOM·print·console error 0 유지. 이 검사는 합성 원본의 기존 명시 저장을 포함하며 새 보고서 표시 경로의 persist 0 검사와 구분합니다.
- 증거: artifacts/monthly-report-212/results.json, design-ui.log, node-tests.log, research-ui.log, top-safety.log, top-safety-results.json, tested-files.json. confirmed-{412,884,1440}-{porcelain-cream,midnight-black}.png 6장과 minimal 6장·print 2장 갱신. 합성 fixture만 사용, 실제 운영 데이터 쓰기 없음.
- 미검증: 실제 사용자 로그인/Cloud/Android·종이 pagination·아린 독립 UI·Candidate/package/One-Pass/HINA·운영 read-back. 이 요청은 개발 단계이며 배포 승인으로 해석하지 않음.
- Notion: 현황판 fetch 성공, 착수 append는 자동 승인 검토에서 approval policy never로 거절. 이번 Part C 완료 요약·97 Node/6조합 UI·무쓰기·미커밋 상태 및 본 원문을 Notion에 갱신 대기. 우회/재시도하지 않음.
- 다음 한 가지 행동: 성민 대표님이 갱신 screenshot으로 디자인 확인. 현재 blocker는 Notion 갱신 제한이며 코드 변경에는 없음. 별도 commit 지시 전 미커밋 유지, 배포 담당 Claude의 열차 인계·승인/배포 단계는 수행하지 않음.
