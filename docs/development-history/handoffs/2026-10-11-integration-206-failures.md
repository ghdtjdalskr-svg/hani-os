# 통합 206 실패 수정 · 도연(Codex)

## 작업 식별

- 갱신: 2026-10-11 KST / 담당 도연(Codex), 단일 개발 Agent / 상태 targeted 검증 완료, 미커밋 인계.
- branch/worktree: hani/integration-206 / int206. 시작·현재 HEAD e22e0a99298c2f8f87c87cc37b07e6253b078b29.
- base/main: 94e59cb7438e1230f9c917912ccda4cde83fbc81, GitHub connector main 조회로 일치 확인. shell Git 네트워크 차단, merge/rebase 없음.
- 대표님 승인: ../int206-fail.txt 각 실패를 실제 앱 오류 또는 승인된 UI 기대값으로 구분해 수정. IC 헤더는 보이는 새 모바일 바와의 실제 겹침 검사. 커밋·버전·데이터 변경 금지.
- 범위: hani-design-system.css 모바일 media 2곳과 scripts/hani-investment-research-ui.test.mjs 헤더 검사. 기존 다른 담당 artifacts 보존.
- CODEMAP investment-research owner 확인. 모바일 헤더 owner 미등록 CODEMAP_MISS, setupMobileTopStatus/디자인 CSS 실코드 fallback.

## 결과와 증거

- 실패 1건(UI 원래442행): 390px print에서 모바일 display:flex!important가 기존 인쇄 display:none!important보다 구체적이라 상태바 노출. 앱 CSS 모바일 규칙과 reduced-motion 규칙을 screen 매체로 한정. 기존 인쇄 기대값 그대로 통과, 신규 CSS/이벤트/renderer layer 없음.
- IC 헤더 검사: CSS 전환 종료까지 대기, checkVisibility의 opacity/visibility와 viewport clipping으로 보이는 바만 측정. 초기·anchor scroll·위로 스크롤해 바 재표시 3단계. 재표시 바 존재·44px 높이를 요구하며 실제 겹침 금지. 추가 무쓰기 검사는 state/보호 storage/전체 write 수 모두 비교. 기존 safety/no-write/frozen/print/reload assertion은 헤더 블록 밖 byte-identical.
- 실제 헤더 가림 없음: PC 바 하단80px, 헤더 시작96px 이상. 모바일 바 하단44px, 헤더 시작133px 이상. IC 앱 header/scroll owner 및 IC CSS 변경 없음.
- 실제 Edge155.0.4283.45 PASS: Research UI 1440/390 × porcelain-cream/midnight-black 4조합, 인쇄 숨김·모바일 표·정상 저장/read-back·초안 무쓰기·freeze/수정본/원본변경 guard·GPT·reload·console 오류0.
- 실제 Edge 모바일 회귀 PASS: 390×844의44px/단일행/scroll 숨김·복귀/입력focus/검색/메뉴/Local 오류·Cloud 충돌/독서Preview 명시저장/320·768px/reduced motion/1440desktop. 실제4층 scene UI1440/390 PASS: persistent slots·넘침·meeting bridge·hidden pause·보호데이터 불변.
- 실행 방식: native execFile은 spawn EPERM. Node REPL에서 Playwright CJS 실제 Edge launch 성공. 테스트 원문에서 Node import 및 import.meta URL/argv만 제공하고 vm.runInThisContext로 실행, assertion 수정·mock 브라우저 없음. 초기 runInNewContext 실행의 realm prototype 차이 실패는 제외하고 동일 Node realm의 전체 재실행 PASS만 최종 증거로 사용.
- Node v24.20.0 PASS: hani-investment-research.test.cjs15, hani-investment-committee.test.cjs8, hani-ic-polish-205.test.cjs11, hani-ic-report-205.test.cjs10, hani-ic-accumulation.test.cjs10, hani-building-206.test.mjs21, hani-mobile-intake-206.test.cjs독서8+무쓰기. 각 파일 직접 node 실행.
- node --check scripts/hani-investment-research-ui.test.mjs 및 git -c core.whitespace=cr-at-eol diff --check PASS. 기존 줄 EOL·storage write호출·ID literal·보호버전·cache 토큰 보존 PASS, CSS역치환은 원문 byte-identical. git ls-files --eol 두 파일 mixed/mixed 유지.
- 증거: artifacts/integration-206-failures/{research.log,mobile.log,building.log,ui-results.json,source-safety.json,verification-summary.json}; research/390-porcelain-cream-report-print.png 실화면 확인. 기존 artifacts는 덮어쓰지 않음.
- 데이터/Cloud/schema/migration/auth owner·운영 데이터 영향 없음. 합성 offline 브라우저 context에서만 기존 저장 테스트 수행. JS runtime/index 변경 없음.
- 표시/cache v2.9.205 유지, 내부2.9.15-safe-baseline-bootstrap 및 보호키 유지. 마지막 정적 JS hani-ai-budget.js?v=2.9.205; 실제 운영 화면·로딩 미검증.
- 미검증: native CLI의 browser launch, Android/IME 실기기, 운영 로그인/Cloud, Candidate build/One-Pass/독립HINA/Preview 승인/열차 gate. 기능 patch 범위이므로 버전 증가·Candidate/Production 검사는 N/A, 운영완료 아님.
- 커밋/push/PR/main merge/Pages/Production read-back 수행 없음.

## 다음 담당에게

- 다음 행동: Claude가 이 미커밋 CSS/test 수정과 증거를 검토해 배포 열차에 반영. native 실행 명령: node scripts/hani-investment-research-ui.test.mjs <playwright/index.mjs> <Edge.exe>; 기존 모바일·building UI 검사도 동일 인자. 동반 서버/Edge Function/설정 배포 없음.
- 사용자 결정 blocker 없음. commit·merge·배포 권한은 이번 요청에서 부여되지 않음.
- Notion 현황판 fetch 성공. 계획 insert_content는 자동 승인 검토가 MCP tool call requires approval, but approval policy is never로 거절. 저장/read-back 미완료, 재시도 없음. 갱신 대기: 이 작업 요약/2파일수정/실제Edge3묶음PASS/Node83항목PASS/원문안전·mixed EOL/미커밋·버전유지·미배포/Android·열차QA미검증/branch·HEAD·main·원문 링크.
- CURRENT에 확인된 결과만 추가, 과거 타 담당 기록 및 DECISIONS 보존.
