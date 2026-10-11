# building-206 UI 회귀 수정 · 도연(Codex)

## 작업 식별

- 갱신: 2026-10-11 KST / 담당: 도연(Codex), 개발 1명 + 자동 검사
- 상태: 테스트 수정 완료 / 실제 Edge 재검증 대기 / 미커밋
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/building-206 / w206
- 시작 HEAD: 134f160cb8740d1124984afe25d204b70cdf9b24
- base / 조회 main: 94e59cb7438e1230f9c917912ccda4cde83fbc81 (GitHub API 확인; shell 네트워크 실패)
- 표시 / 마지막 runtime: v2.9.205 / hani-ai-budget.js?v=2.9.205 (로컬 HTML; 운영 로딩 미검증)
- 목표: ../w206-fail.txt의 UI 실패 3건을 승인된 v204 메뉴 복원·대표실 건물과 대조하여 해결
- 수정 범위: scripts/hani-earnings-report-ui-test.mjs, scripts/hani-investment-research-ui.test.mjs, scripts/hani-ui-203b-ui.test.mjs, 본 인수인계
- 승인: 기대값 정정 또는 실제 앱 결함 수정. 안전·무쓰기 검사 유지. 데이터 변경·버전 증가·커밋·push·main/배포 없음.
- 다른 담당의 기존 artifacts/qa-evidence 변경은 보존.

## 결과와 증거

- 기존 building-206 인수인계와 nav-groups 계약 확인. 사이드바 층 제목·중복 바로가기 제거, 투자 리포트는 재무 그룹, AI 주간 예산은 개발·운영 그룹, 테마 스튜디오는 하단.
- 새 층 이미지 부재는 기존 fallback 설계에 명시됨. earnings 테스트는 동일 로컬 origin의 정확한 floor-[1-4]f-v1.webp 경로가 실제 파일 부재로 404일 때만 따로 기록합니다. 최종 console gate 앞에서 기존 fallback src·complete·naturalWidth>0·dataset.art를 확인합니다. 다른 경로/500/파일이 존재하는데 발생한 404는 그대로 실패합니다.
- 실패별 분류/수정: earnings의 이전 오피스 12메뉴 기대값 → 승인된 5메뉴 순서; Research의 사이드바 4개 층 제목 → 제목 0개 및 7그룹/각 view 정확한 순서; 제거된 data-go 바로가기 → 단일 data-view 링크로 이동/제목/상태 및 write 횟수 불변 검사; 203b NEW 부모 office/finance 2개 → office/finance/development 3개. 메뉴 배지 5개·반복 렌더·만료·무쓰기 검사는 유지.
- 수정 파일은 UI 테스트 3개와 작업 기록뿐입니다. 확인된 앱 결함은 없으며 운영 코드 패치 없음.
- 데이터·저장소·Cloud·schema 영향: 변경 없음.
- 대상: 시작 HEAD 134f160의 이번 미커밋 변경 / Node v24.20.0.
- `node scripts/hani-nav-groups.test.mjs` — PASS.
- `node --test --test-isolation=none scripts/hani-building-206.test.mjs scripts/hani-building-206-engine.test.mjs` — 27 PASS. 실제 owner + DOM double의 새 아트/fallback·기존 회의·지속 슬롯 포함; 실 Edge 증거 아님.
- `node scripts/hani-building-206-safety.test.mjs .ai-budget-private/building-206-baseline` — PASS, 기존 보호 원본·storage·id·version/cache·혼합 EOL 검사 변경 없음.
- `node scripts/hani-investment-research.test.cjs` — 15 PASS / `node scripts/hani-investment-committee.test.cjs` — 8 PASS.
- `node scripts/hani-ui-203b.test.mjs .ai-budget-private/206-regression/base` — PASS. 최초 Git subprocess EPERM은 native shell의 실제 `git diff --unified=0 -- hani-main.js hani-organization-hub.js index.html`을 기존 지원 diff.txt 입력으로 공급하여 해결. 원본 raw baseline 사용, 검사 코드는 수정하지 않음.
- `node .ai-budget-private/206-regression/verify.cjs` — PASS. 시작 raw 7개 운영 파일 바이트 불변, UI 테스트 retained EOL·fixture/write/assert 보존·clear/id 추가 없음, 실제 badge owner를 실제 sidebar 그룹 DOM double에 실행(5개 메뉴/3개 부모/idempotency/expiry), 정확한 optional-art error 분류 확인. UI 실화면과 구분.
- 변경 UI 테스트 3개의 `node --check`, `git -c core.whitespace=cr-at-eol diff --check` — PASS.
- 실제 Edge 시도: `node scripts/hani-ui-203b-ui.test.mjs "C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"` — BLOCKED: browserType.launch spawn EPERM. 같은 환경의 earnings/Research 실 Edge 재시도는 실행하지 않음. 3개 모두 수정 후 실제 1440/390 UI 결과 미검증, PASS로 보고하지 않음.
- Full Package/Candidate/HINA/운영 read-back은 이번 기능 테스트 수정 범위에서 미실행.
- PR / Preview / main / Pages / 운영 read-back: 이번 작업 미실행.

## 다음 담당에게

- 먼저 읽을 파일: 원래 building-206 인수인계, 위 UI 테스트 3개, scripts/hani-nav-groups.test.mjs.
- 다음 행동: Claude의 실제 Edge 환경에서 실패 로그에 해당하는 UI 테스트 3개를 같은 runtime/Edge 인자로 재실행. Research는 1440/390 × porcelain-cream/midnight-black, 나머지는 1440/390. 새 실패가 나오면 해당 실제 경로를 수정.
- Notion 현황판 기록 추가는 자동 승인 검토의 approval policy never 거절로 미반영. 계획·검증 결과 갱신 대기.
- CURRENT: 이번 확인 결과 요약 추가, 과거 기록 보존. DECISIONS 변경 없음.

## ?? Edge ?? ?? ? 2026-10-11 KST

- ??: ??(Codex), branch hani/building-206 / HEAD 134f160cb8740d1124984afe25d204b70cdf9b24. GitHub API ?? main 94e59cb7438e1230f9c917912ccda4cde83fbc81 ??, CLI ???? ??.
- ?? ../w206-fail.txt: Research UI? ?? ?? work ?? ??? ??? 1?. ?? ??? ?? UI ??? ???? ?? ??. ?? ??? ??/?? ?? artifacts ??.
- ??: main?? ???? hani-ui-cleanup-v02971.js removeWorkBoardUI? hani-stability-polish-v02972.js redirectLegacyWorkLinks? work ??? ??. HTML ?? ??? ?? ? UI ??? ???? ???? ???? ??.
- ??: ?? ?? ??? ??/? ?? ?? ??. ???push???/cache???? ?? ??, ?? ?????? ?? ??.
- Notion ?? append ?? ?? ??? approval policy never? ??. ?? ??.

### ?? ??

- scripts/hani-investment-research-ui.test.mjs? ?? ? ?? ??? tasks ? calendar ? drive? ??? ??. ?? 6??????? ????? ???navigation ???? QA1 ?? ???/?? ??? ??? ??. ?? ?? ?? 1?? ??? ????? ??, ? ?? ??.
- node --check scripts/hani-investment-research-ui.test.mjs / node scripts/hani-nav-groups.test.mjs / node .ai-budget-private/206-regression/verify.cjs / git -c core.whitespace=cr-at-eol diff --check ? PASS.
- node scripts/hani-investment-research.test.cjs ? 15 PASS. node scripts/hani-building-206-safety.test.mjs .ai-budget-private/building-206-baseline ? PASS.
- node stdin ?? ? ?? root runtime JS/CSS/HTML SHA256 ??, ?? ? UI ???? ??? ??? 1?? ??(EOL ??), ?? cleanup/stability owner ?? ?? ? ?? 7??? UI ???? ??. DOM ?? ???? ?? ?? ?? ??. ?? ??? location? ?? ??? ? hash fixture ???? ??, ? ?? ??. ?? ??: .ai-budget-private/206-regression-followup/{runtime-hashes.json,research-before.mjs}.
- node scripts/hani-investment-research-ui.test.mjs "C:/Users/???/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" ".ai-budget-private/206-regression-followup/ui-evidence" ? BLOCKED: browserType.launch spawn EPERM. ?? ? ?? 1440/390 ? 2?? UI ??? ???.
- ?????push???/cache???? ?? ??. Candidate/??/?? read-back N/A(??? ??). Notion append ?? ?? ?? never ??? ????? ?? ??.
- ?? ??: Claude ?? Edge ???? ? Research UI ?? ???. ?? 3? UI ??? ??? ? ?? artifacts? ??.
