# 모바일 독서 접수·상태바 206

## 작업 식별

- 갱신 시각(KST): 2026-10-11, 구현·targeted test 완료 / 미커밋 인계
- 담당: 도연(Codex), 단일 개발자 + 자동 검사. 독립 아린/HINA 검토 미실행.
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/remote-206 / w206r
- 작업 시작 HEAD: 55435c0cef301b7f3e45a4192908bb2232f9936a (기존 Remote 패널 커밋 보존)
- base / 원격 main: 94e59cb7438e1230f9c917912ccda4cde83fbc81. git ls-remote는 네트워크 제한 실패, GitHub connector branches/main GET으로 동일 SHA 확인.
- 범위: hani-main.js intakeNaturalBook 및 setupQuickJump의 기존 헤더 경로, hani-yuna-helpdesk.js 책 Preview, index.html 헤더 구조, hani-design-system.css 모바일 헤더, Node/Edge 검사. hani-style-01.css 최종 변경 없음.
- 대표님 승인: 2026-10-11 요청의 두 문제 수정 및 targeted test. 커밋·버전 증가·main 병합·배포·새 저장 키·storage/Cloud write 변경 금지.
- 시작 상태: tracked 파일 clean, artifacts/remote-206/ untracked 기존 근거 보존.

## 결과와 증거

- NORMAL: 기존 독서 파서·Preview·승인 저장 경로와 모바일 헤더 UI에 한정.
- CODEMAP: yuna-intake/reading owner 및 intakeNaturalBook/parseBook/saveApproved 앵커 확인. 헤더는 CODEMAP owner 부재로 실제 .ui26-top/setupQuickJump/storage-strip 검색 fallback.
- 재현: 시작 HEAD의 실제 intakeNaturalBook/intakeBuildOne 및 유나 parse를 Node VM에서 실행. 요청 5문장과 추가 완독/진행 3문장 모두 제목·상태·날짜 등의 계약 실패 재현. 책 칩 전달은 정상이고 텍스트 접수에 Cloud/AI 호출은 없었음. 원인: 미지원 동사/따옴표/소유격과 유나의 좁은 완독 판정·날짜 누락.
- 수정: `김대식의 인간 vs 기계 책을 봤어` → 제목 인간 vs 기계 / 지은이 김대식 / 완독 / 오늘 KST. 읽었어·다 읽었어·봤어, 읽고 있어·읽는 중, 『』·「」·따옴표, 별점 4 지원. 지은이 근거가 없으면 빈 값. 진행 중은 기존 wish 상태+review/시작일 표현을 사용하며 새 schema/status 없음.
- 저장 전 확인: 기존 Preview에 제목·지은이·상태·평점·날짜 표시. 수정 버튼과 기존 필드별 correction 유지. 기기에서 해석했다는 안내와 누락 정보 질문 유지. 실제 Edge에서 평점 수정 후 명시적 저장 → intakeApplyRow 1회 → commit 1회 및 저장 read-back 확인. 저장 버튼 전 Life 데이터/보호 키 변화 없음.
- 모바일 상태바: 기존 디자인 시스템 헤더 owner에 ≤768px 규칙. 44px 한 줄, 저장 dot/짧은 시각, 검색 버튼→기존 input/결과, ⋯→기존 백업/테마. page scroll down/up에서 transform으로 숨김/복귀, 공간 유지. main 입력 focus/키보드에 숨김, 헤더 검색 focus는 검색 유지. Local 실패/원본 보호/Cloud error/STOP/CHECK는 빨간 dot+상세 메시지이며 scroll로 숨기지 않음. 입력 가림 방지가 오류 scroll 고정보다 우선. 대화 renderer의 자동 내부 scroll은 page scroll로 취급하지 않음.
- Node PASS: `node scripts/hani-mobile-intake-206.test.cjs` — 실제 main/YUNA/intake의 독서 8문장, 편집, UTC 16:49→다음 날 KST 날짜, 승인 전 저장 0회, 시청 칩. `--baseline`은 artifacts/mobile-intake-206/baseline의 55435c0 원문으로 8/8 실패 재현.
- 기존 회귀 PASS: `node scripts/hani-yuna-smoke.js`, `node scripts/hani-yuna-schedule.test.js`. 변경 JS syntax 및 `git -c core.whitespace=cr-at-eol diff --check` PASS.
- Edge PASS: `node scripts/hani-mobile-intake-206-edge.mjs <playwright index.mjs> <browser exe>`; root는 요청한 fileURLToPath(new URL('../', import.meta.url)) 기준. 외부 요청 차단, unlockLoginGate()+showView('intake'). 390×844에서 44px·모든 컨트롤 행 내부·가로 넘침 없음·scroll down/up·layout offset 유지·입력 focus 숨김·저장 오류 빨간 dot/상세·Cloud 충돌 빨간 dot·오류 중 focus 숨김·검색·overflow 메뉴·독서 Preview/수정/기존 경로 저장·시청 칩·reduced motion·중복 DOM id 0·pageerror 0 확인. 320/768px 넘침 없음, 1440px desktop 상태/백업/테마 가시성 확인.
- 환경: Windows Edge 155.0.4283.45. Playwright `%USERPROFILE%/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`, Edge `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`. 기본 shell browser spawn EPERM 후 제공 Node REPL execFile로 동일 파일/인자를 실행해 실제 Edge 완료. 외부 차단으로 생긴 기존 Cloud 오류를 확인한 뒤 일반 scroll 검사는 정상 Local fixture로 분리. 오류/충돌은 기존 renderer로 주입.
- 증거: artifacts/mobile-intake-206/edge-results.json, mobile-normal-390x844.png, book-preview-390x844.png, mobile-390x844.png, source-safety.json. source-check.cjs에서 변경 없는 unique line의 원래 EOL과 save/commit/intakeApplyRow/saveApproved/persist byte-identical 확인.
- 데이터·저장소·Cloud·schema: 기존 intakeApplyRow → commit 함수와 보호 storage 저장 함수 변경 없음. 새 storage write/remove/clear·키·migration·Cloud write/schema 변경 없음. 실제 저장 검사는 격리 offline browser context의 합성 데이터만 사용.
- 미검증: 실제 Android Chrome/IME/키보드/운영 데이터·Cloud 동기화, 독립 아린/HINA, 최종 열차 candidate/preflight/배포. 해당 항목을 PASS로 기록하지 않음.
- 버전: v2.9.205/캐시 태그 유지. 최신 정적 JS 태그 hani-ai-budget.js?v=2.9.205. 운영 사이트 실제 로딩 미검증.
- main / Pages / 운영 read-back: 수행 안 함.

## 다음 담당에게

- 먼저 읽을 함수: intakeNaturalBook/intakeReadingToday/intakeBuildOne, 유나 parseBook/previewMarkup/patchBookDraft/saveApproved, setupQuickJump/setupMobileTopStatus, 디자인 시스템 Mobile header media 규칙.
- 다음 행동: 대표님 Preview 확인 후 배포 담당이 열차 통합 시점에 인수. 커밋·push 허용과 열차 승인 범위는 별도 확인. 동반 Edge Function/서버 설정 배포 필요 없음.
- 커밋·push·PR·배포: 대표님 요청대로 수행 안 함.
- Notion: 현황판 fetch 성공. 계획 insert_content는 “MCP tool call requires approval, but approval policy is never” 자동 승인 검토 거절로 미반영. 갱신 대기: 2026-10-11 도연 / 모바일 독서·상태바206 / hani/remote-206, base94e59cb·시작55435c0 / 독서8·기존유나/일정·390px Edge PASS / 커밋·버전·배포 없음 / Android 실기기·열차 QA 미검증 / 이 원문 참조. Notion 저장/read-back 완료로 보고하지 않음.
- CURRENT / DECISIONS: 다른 작업 기록 변경 없음.
