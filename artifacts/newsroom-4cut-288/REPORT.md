# 뉴스룸 주간 4컷 PC 오른쪽 칸 · nr288

## 작업 식별

- 담당: Codex / 검토·커밋·push: 서윤. 2026-11-11 KST.
- worktree: nr288 / branch: hani/newsroom-4cut-size (Git HEAD 참조 파일로 읽어 확인).
- 전달 base: origin/main 06fef7e + 서윤 CSS 커밋 1개. 로컬 참조 파일 읽기: HEAD 2a84d5be8d951b626bd0671e711c87b99c32761d, origin/main 06fef7e94622e7880b43f889f45b06327bbc60b7. Git 명령 금지에 따라 원격 최신성 새 확인 없음.
- 상태: 기능 구현·개발 검증 결과 서윤 인계. **1호 cuts 근거 대기·Edge 환경 차단으로 요구사항 전체 완료는 아님.** 사용자 ../nr288-task.md 전체 수행 승인. main 병합·배포·버전 변경 권한 없음.
- 범위: 4cut owner JS·issues.json·CSS·필요 HTML, 전용 시험·정확한 시험 바깥 inverse, 이 보고서·화면 증거.
- CODEMAP_MISS: newsroom 항목에 4cut owner 없음. 실제 hani-newsroom-4cut.js issuePanels/renderIssuePanels/render, index.html의 기존 layout/comic/context/sources 경로 확인.
- 데이터·보호 저장소·Cloud·schema 읽기/쓰기 추가 없음. 라이브 뉴스 조회 추가 없음.
- 계획: 지정 실패20개 양쪽 비교 → 기존 owner에서 facts/cuts 및 CSS grid 배치 → 관련 시험·office·M9·Edge 화면 검증 → 부산물 복원.
- Notion: 현황판 읽기 성공, 착수 insert_content 자동 승인 거절(`MCP tool call requires approval, but approval policy is never`). 갱신 대기, 아래 최종 인수인계로 미반영 보존.

## 사전 실패 비교

지정 20시험을 nr288 및 ../tl287에서 실행 완료. Git child 호출은 명시적인 no-git preload로 실행 전에 차단. CSS 변경 전 통과/후 실패는 newsroom-285-source 하나. 나머지 19개는 tl287에서도 실패 또는 Git 검증 차단. 상세 표와 최종 결과는 아래에 기록.

## 다음 담당에게

- 1호 alt에는 컷별 장면 없음. 지정 초안은 다른 주간(10/19~23), 실제 1호 그림에도 회장님이 존재. 사용자 질의를 보냈으나 답변 없음. 'alt 장면만 요약·회장님 미등장' 경계를 지키기 위해 1호 cuts는 우선 생략. 이는 **각 호 cuts 4개 요구의 미완료 항목**이며 1호 기자 장면 근거 또는 그림 기반 요약 허용 답변이 필요함. 1호 alt·이미지는 수정하지 않음.
- 버전·캐시·표시 값 유지. Candidate·HINA·Production 검증은 이 기능 작업에서 실행하지 않음.

## 구현과 실행 경로

- `issuePanels`가 지수 외 숫자와 장면을 explicit facts/cuts 필드에서만 받음. 기존 지수 추출 경로 유지. 문자열 label/value 또는 reporter/scene이 없으면 해당 행을 렌더하지 않음.
- 기존 `renderIssuePanels`에서 지수 표 아래 같은 section 카드 스타일로 다른 숫자·①~④ 기자/장면을 생성. 모든 새 콘텐츠는 textContent. 별도 renderer/event/listener/timer/storage 경로 없음.
- 기존 aside 슬롯의 hidden을 지수/facts/cuts 유무로 정하고 같은 결과로 has-context 설정. 같은 호 재진입은 repaint하지 않고 지난 호·최신 호 전환만 내용 갱신.
- HTML에서 기존 출처 details를 comic 바로 다음 형제로 한 번만 선언. JS DOM 이동 없음. 900px 이상 has-context에서 comic은 왼쪽 2행 span, aside는 오른쪽 첫 행, 출처는 오른쪽 마지막 행. 작은 화면은 comic → 출처 → context 순서와 기존 간격을 유지하도록 CSS 조정.
- 2호 facts: 원/달러 1,356.6원(11/6 서울 15:30 종가), 미국 10월 비농업 고용 +165,000명, 실업률 4.1%. cuts: 하니 전광판 → 지은 미끄럼틀 난간 → 민지 지도 부감 → 세 기자 고용/다음 주 준비. 1호 facts는 alt의 원/달러 1,334.3원·한국 3분기 GDP 1.0%만.
- 새 `newsroom-288-delta.json`과 `hani-newsroom-288-source.cjs`는 전체 입력/출력 SHA256·고정 edit/EOL을 확인하는 시험 전용 exact inverse. CSS는 서윤 size 커밋까지 제거해 tl287 원문과 연결. 기존 285 fixture/pin/assertion은 보존.
- 변경한 기존 시험/공유 helper 5개는 새 outer 연결만 되돌렸을 때 사전 snapshot과 전체 바이트가 같음을 확인. 기존 assertion·pin·EOL 삭제/완화 없음.
- 공유 release dispatcher 및 pre-287 outer 입구에서 새 inverse를 먼저 적용. 285/layers 전용 reader와 230의 고정 catalog에만 opt-in 연결. 신규 288 시험은 raw JS/JSON으로 실제 enter/render·아카이브 handler를 실행.

## Edge 화면 검증 · 차단

- 준비한 runner: `%TEMP%/hani-nr288/edge.mjs`. 실제 index를 로컬 HTTP로 제공하고 로그인 게이트를 숨긴 뒤 showView('newsroom'), 외부 네트워크 차단, 1440/1280/390, 원본 snapshot과 현재 원문 비교를 수행하도록 준비.
- Playwright → Edge launch: `spawn EPERM`.
- PowerShell `Start-Process -WindowStyle Hidden` → Edge CDP: 연결 직후 끊김/30초 timeout. 별도 임시 profile의 stderr에서 Windows sandbox 권한 및 `FATAL mojo/platform_channel.cc:187 ... 액세스가 거부되었습니다 (0x5)` 확인. 추가 브라우저 권한 변경 없음. 해당 임시 Edge 프로세스는 종료 확인.
- **새 PNG 0장. 1440·1280·390 가로 넘침, 카드 실제 높이, 그림 대비 높이 차이, 실제 화면/모달/출처 위치는 미검증. 높이 수치를 추정하여 기재하지 않음.** CSS 의도와 VM renderer 결과를 실제 Edge 검증으로 취급하지 않음.
- 다음 담당이 허용된 Edge 환경에서 같은 runner를 실행해 `artifacts/newsroom-4cut-288/`에 캡처를 남기고 context/image 높이·overflow를 이 보고서에 보강해야 함.

## 안전·경계 확인

- `hani-main.js` 전체 바이트 보존. 표시 v2.9.287, index의 버전·캐시 토큰 목록 동일. 마지막 script 선언은 기존 `hani-launch-greeting.js`; 실제 Edge 로딩은 미검증.
- issues.json의 기존 호·제목·날짜·week·image·alt·sources를 새 facts/cuts 제거 후 원본 JSON과 deepEqual 확인.
- 운영 4cut JS에 localStorage/sessionStorage/Cloud/Supabase/innerHTML 경로 없음. 신규·기존 VM 시험의 저장 접근은 금지 stub 또는 기록으로 확인. 운영 데이터·이미지·서버·schema 변경 없음.
- JS syntax와 JSON parse 확인. CSS는 괄호 균형 정적 확인만 수행했으며 실제 CSS 계산·그림 높이·overflow를 PASS로 쓰지 않음.
- preload 없는 raw runtime closure는 사전 snapshot과 동일 164개, 누락 0. 런타임 파일 참조 추가 없음.
- release 버전 증가/Full package/One-Pass/HINA/main merge/Pages/Production read-back은 기능 담당 작업의 N/A. commit/push는 서윤 담당, Git 명령 실행 없음.

## CSS 변경 후 지정 실패 20개 · 사전 비교 상세

명령: `node --test-reporter=tap scripts/hani-<이름>.test.mjs`, 양쪽 cwd에서 동일 실행. `NODE_OPTIONS`의 임시 no-git preload가 Git 실행을 차단하며 assertion을 변경하지 않음. 표는 통과/실패 subtest 수(시작 전 모듈 오류는 0/0).

| 시험 | nr288 변경 전 | tl287 | 판정 |
|---|---:|---:|---|
| brand-heroes-218 | 0/0 · exit 1 | 0/0 · exit 1 | 양쪽 기존 실패 |
| dash-218 | 2/1 · exit 1 | 2/1 · exit 1 | 양쪽 기존 실패 |
| fun-top3 | 0/0 · exit 1 | 0/0 · exit 1 | 양쪽 기존 실패 |
| hero-restore | 3/1 · exit 1 | 3/1 · exit 1 | 양쪽 기존 실패 |
| ilbo-213 | 0/0 · exit 1 | 0/0 · exit 1 | 양쪽 기존 실패 |
| invest-split-ui | 0/0 · exit 1 | 0/0 · exit 1 | 양쪽 기존 실패 |
| investment-research-ui | 0/0 · exit 1 | 0/0 · exit 1 | 양쪽 기존 실패 |
| lounge-billboard | 25/2 · exit 1 | 25/2 · exit 1 | 양쪽 기존 실패 |
| mascots-poster | 19/3 · exit 1 | 19/3 · exit 1 | 양쪽 기존 실패 |
| nav-groups | 0/0 · exit 1 | 0/0 · exit 1 | 양쪽 기존 실패 |
| newsroom-285-source | 1/1 · exit 1 | 2/0 · exit 0 | CSS size 커밋으로 새 실패 → 288 exact inverse |
| owner-verification-ui | 0/0 · exit 1 | 0/0 · exit 1 | 양쪽 기존 실패 |
| qa-210 | 8/1 · exit 1 | 7/2 · exit 1 | Git 의존 차단 (다른 실패 포함 가능) |
| qa-design-b4 | 21/3 · exit 1 | 21/3 · exit 1 | 양쪽 기존 실패 |
| qa-report-fixes | 5/5 · exit 1 | 5/5 · exit 1 | 양쪽 기존 실패 |
| remote-media-219 | 0/0 · exit 1 | 0/0 · exit 1 | 양쪽 기존 실패 |
| reviewed-release-baseline | 1/16 · exit 1 | 1/16 · exit 1 | Git 의존 차단 (다른 실패 포함 가능) |
| simplify-225 | 0/0 · exit 1 | 0/0 · exit 1 | Git 의존 차단 (다른 실패 포함 가능) |
| theme-white-215 | 0/0 · exit 1 | 0/0 · exit 1 | Git 의존 차단 (다른 실패 포함 가능) |
| ui-203b | 0/0 · exit 1 | 0/0 · exit 1 | 양쪽 기존 실패 |

- tl287의 qa-210 추가 1실패는 sandbox 밖 artifacts/qa-210 mkdir EPERM. Git 차단과 별개인 실행환경 제한이며 CSS 회귀 아님.
- brand/hero는 hero restore hunk drift, dash는 기존 보고서 6개 기대, qa-design-b4는 기존 QA-10/128 closure 기대, qa-report-fixes는 기존 report state 경로 실패. 나머지 기존 모듈·fixture 오류도 변경하지 않음.
- 사전 snapshot과 tl287의 top-level hani JS/CSS·index 및 data JSON 선택 비교 79개에서 차이는 서윤 CSS size 커밋 1개뿐. 원격 최신성 증거로 사용하지 않음.

## 최종 검증 결과

- Node v24.20.0 / Windows PowerShell. 선택 기준: scripts 최상위 `*.test.mjs`·`*.test.cjs` 중 지정 4파일을 직접 참조하는 시험, 모든 `hani-office-*` 시험, 필수 지정 시험의 합집합. 총 190개 명령을 전부 실행. 브라우저 실행을 포함한 시험은 환경 차단을 PASS로 세지 않음.
- 전체(최종 targeted 재실행 반영): `{"commands":190,"success":87,"failed":103,"pass":1147,"fail":78,"gitBlocked":41}`. 숫자는 Node TAP subtest 합계이며 별도 자체 assertion runner는 subtest 0으로 집계.
- office 73개 전부 실행: `{"commands":73,"success":44,"failed":29,"pass":784,"fail":30,"gitBlocked":29}`.
- 핵심 5명령 최종 38/38 PASS. 230은 `HANI_MAIN_BASELINE=%TEMP%/hani-nr288/snapshot`으로 사전 index/JS/CSS 원문을 대조(원격 baseline 아님). 모든 명령에서 no-git preload로 Git child 실행 차단.

| 필수 시험 | 결과 |
|---|---:|
| `node --test-reporter=tap scripts/hani-newsroom-4cut-288.test.mjs` | 6/6 · exit 0 |
| `node --test-reporter=tap scripts/hani-newsroom-4cut-230.test.mjs --node` | 8/8 · exit 0 |
| `node --test-reporter=tap scripts/hani-newsroom-285-source.test.mjs` | 2/2 · exit 0 |
| `node --test-reporter=tap scripts/hani-release-version-layers.test.mjs` | 7/7 · exit 0 |
| `node --test-reporter=tap --require ./scripts/hani-m9-polish-preload.cjs --require ./scripts/hani-m9-link-preload.cjs scripts/hani-seoyun-m9.test.mjs` | 15/15 · exit 0 |

신규 288은 전체 bytes inverse·drift/EOL 거부, raw 실제 enter/render 2호 facts3/cuts4, 필드 부재/독립 context, XSS 문자열 textContent, 잘못된 필드/alt 추론 금지, 실제 지난 호/최신 handler 슬롯 재사용을 검증. M9는 기존 polish→link exact inverse preload를 명시해 15/15(동일 legacy pin 유지).

### 전체 실행 목록

PASS와 실패/차단을 분리. 기존 실패는 고치지 않았으며 Git oracle·실제 브라우저 미검증은 별도 남김. `P/F`는 TAP 통과/실패.

| 시험 | P/F | exit | 판정 |
|---|---:|---:|---|
| hani-access-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-ai-budget-browser.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-ai-work-status.test.mjs | 0/0 | 0 | PASS |
| hani-app-216-audit.test.cjs | 6/1 | 1 | 변경 전 동일 실패 재현 |
| hani-app-216-practical.test.cjs | 12/0 | 0 | PASS |
| hani-backup-history-runtime.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-banners-203-ui.test.mjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-board-203a.test.mjs | 0/0 | 0 | PASS |
| hani-board-community.test.mjs | 0/0 | 0 | PASS |
| hani-board-living.test.mjs | 0/0 | 0 | PASS |
| hani-board-views-211.test.mjs | 7/0 | 0 | PASS |
| hani-board.test.mjs | 0/0 | 0 | PASS |
| hani-brand-heroes-218.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-building-206-safety.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-building-206-ui.test.mjs | 0/0 | 0 | PASS |
| hani-character-archive-integration.test.cjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-character-archive.test.cjs | 0/0 | 0 | PASS |
| hani-chart-toss-212.test.mjs | 0/0 | 0 | PASS |
| hani-cloud-stability-runtime.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-context-remote-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-dash-218.test.mjs | 2/1 | 1 | 변경 전 동일 실패 재현 |
| hani-dashboard-period-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-desk-mascots.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-duplicate-id-guard.test.mjs | 1/1 | 1 | Git 금지 차단 |
| hani-egress-fix.test.mjs | 0/0 | 0 | PASS |
| hani-exam-popup-214.test.mjs | 0/0 | 0 | PASS |
| hani-fix-208-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-fun-chat-fortune.test.mjs | 4/1 | 1 | 변경 전 동일 실패 재현 |
| hani-fun-top3.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-goal-media-budget-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-goal-progress-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-google-drive-212-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-google-drive-212.test.mjs | 11/0 | 0 | PASS |
| hani-hana-intake-224.test.mjs | 15/0 | 0 | PASS |
| hani-helper-275-pins.test.mjs | 2/2 | 1 | Git 차단 + 변경 전 동일 실패 |
| hani-helper-bot.test.mjs | 27/2 | 1 | 변경 전 동일 실패 재현 |
| hani-hero-cast-218.test.mjs | 0/0 | 0 | PASS |
| hani-hero-restore.test.mjs | 3/1 | 1 | 변경 전 동일 실패 재현 |
| hani-history-226.test.mjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-history-coverage.test.mjs | 0/0 | 0 | PASS |
| hani-history-unify.test.mjs | 14/0 | 0 | PASS |
| hani-ilbo-213.test.mjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-ilbo-banner-215.test.mjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-invest-split-safety.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-invest-split-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-invest-split.test.mjs | 0/0 | 0 | PASS |
| hani-investment-research-safety.test.cjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-investment-research-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-investment-research.test.cjs | 15/0 | 0 | PASS |
| hani-kiwoom-code-224.test.mjs | 10/0 | 0 | PASS |
| hani-launch-greeting-221.test.mjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-life-bundle-source.test.mjs | 5/0 | 0 | PASS |
| hani-login-a-204-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-login-a-204.test.mjs | 0/0 | 1 | Git 금지 차단 |
| hani-login-session-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-lounge-billboard.test.mjs | 25/2 | 1 | 변경 전 동일 실패 재현 |
| hani-mascots-poster.test.mjs | 19/3 | 1 | 변경 전 동일 실패 재현 |
| hani-milestones-grade-ui.test.mjs | 0/0 | 0 | PASS |
| hani-milestones-v1.test.mjs | 0/0 | 0 | PASS |
| hani-mission-203a.test.mjs | 0/0 | 0 | PASS |
| hani-monthly-report-design-212.test.mjs | 0/0 | 0 | PASS |
| hani-nav-groups.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-navigation-state-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-navlogin-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-navlogin.test.mjs | 0/0 | 0 | PASS |
| hani-newsroom-285-source.test.mjs | 2/0 | 0 | PASS |
| hani-newsroom-4cut-230.test.mjs | 8/0 | 0 | PASS |
| hani-newsroom-4cut-288.test.mjs | 6/0 | 0 | PASS |
| hani-newstaff-215.test.mjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-ocr-accuracy-224.test.mjs | 13/1 | 1 | 변경 전 동일 실패 재현 |
| hani-office-219.test.mjs | 0/0 | 1 | Git 금지 차단 |
| hani-office-actions-216.test.mjs | 14/1 | 1 | Git 금지 차단 |
| hani-office-actions-221.test.mjs | 20/0 | 0 | PASS |
| hani-office-affinity-274-pins.test.mjs | 2/1 | 1 | Git 금지 차단 |
| hani-office-affinity-cap.test.mjs | 19/0 | 0 | PASS |
| hani-office-affinity-storage.test.mjs | 3/0 | 0 | PASS |
| hani-office-affinity.test.mjs | 21/0 | 0 | PASS |
| hani-office-barista-night-273-pins.test.mjs | 4/1 | 1 | Git 금지 차단 |
| hani-office-barista-night.test.mjs | 13/0 | 0 | PASS |
| hani-office-barista.test.mjs | 10/0 | 0 | PASS |
| hani-office-behavior.test.mjs | 10/0 | 0 | PASS |
| hani-office-bori-m9.test.mjs | 2/0 | 0 | PASS |
| hani-office-bori-stroll.test.mjs | 13/1 | 1 | Git 금지 차단 |
| hani-office-bubble-close.test.mjs | 17/0 | 0 | PASS |
| hani-office-cafe-rest.test.mjs | 3/1 | 1 | Git 금지 차단 |
| hani-office-chairman-234.test.mjs | 0/0 | 7 | Git 금지 차단 |
| hani-office-chairman-patrol-278-pins.test.mjs | 6/6 | 1 | Git 금지 차단 |
| hani-office-chairman-patrol.test.mjs | 15/0 | 0 | PASS |
| hani-office-companion-homes.test.mjs | 15/1 | 1 | Git 금지 차단 |
| hani-office-companions-276-pins.test.mjs | 2/1 | 1 | Git 금지 차단 |
| hani-office-companions.test.mjs | 17/0 | 0 | PASS |
| hani-office-consult.test.mjs | 19/1 | 1 | Git 금지 차단 |
| hani-office-crowded-labels.test.mjs | 19/0 | 0 | PASS |
| hani-office-drama.test.mjs | 20/0 | 0 | PASS |
| hani-office-fix-218.test.mjs | 6/0 | 0 | PASS |
| hani-office-floor-bubble.test.mjs | 21/0 | 0 | PASS |
| hani-office-hd-224.test.mjs | 10/0 | 0 | PASS |
| hani-office-icons.test.mjs | 14/1 | 1 | Git 금지 차단 |
| hani-office-kids-286-source.test.mjs | 3/0 | 0 | PASS |
| hani-office-kids-lively.test.mjs | 15/0 | 0 | PASS |
| hani-office-kids-merge.test.mjs | 10/0 | 0 | PASS |
| hani-office-kids-pose-b.test.mjs | 13/0 | 0 | PASS |
| hani-office-kids-visit.test.mjs | 16/0 | 0 | PASS |
| hani-office-kids-weekday.test.mjs | 19/0 | 0 | PASS |
| hani-office-labels-qa.test.mjs | 17/0 | 0 | PASS |
| hani-office-lively-v2.test.mjs | 7/1 | 1 | Git 금지 차단 |
| hani-office-lively.test.mjs | 13/0 | 0 | PASS |
| hani-office-mascot-label.test.mjs | 9/1 | 1 | Git 금지 차단 |
| hani-office-motion-1.test.mjs | 16/0 | 0 | PASS |
| hani-office-motion-2.test.mjs | 24/0 | 0 | PASS |
| hani-office-obr10.test.mjs | 4/0 | 0 | PASS |
| hani-office-obr12.test.mjs | 0/0 | 1 | Git 금지 차단 |
| hani-office-obr14.test.mjs | 4/1 | 1 | Git 금지 차단 |
| hani-office-obr15.test.mjs | 13/1 | 1 | Git 금지 차단 |
| hani-office-obr16.test.mjs | 12/0 | 0 | PASS |
| hani-office-obr17.test.mjs | 3/0 | 0 | PASS |
| hani-office-obr18.test.mjs | 12/0 | 0 | PASS |
| hani-office-obr19.test.mjs | 3/0 | 0 | PASS |
| hani-office-obr21.test.mjs | 4/2 | 1 | Git 금지 차단 |
| hani-office-obr3.test.mjs | 5/0 | 0 | PASS |
| hani-office-obr4.test.mjs | 8/2 | 1 | Git 금지 차단 |
| hani-office-obr6.test.mjs | 0/0 | 1 | Git 금지 차단 |
| hani-office-obr7.test.mjs | 0/0 | 1 | Git 금지 차단 |
| hani-office-obr8.test.mjs | 2/1 | 1 | Git 금지 차단 |
| hani-office-obr9.test.mjs | 0/0 | 1 | Git 금지 차단 |
| hani-office-pet-bori-272-pins.test.mjs | 3/1 | 1 | Git 금지 차단 |
| hani-office-pet-bori.test.mjs | 14/0 | 0 | PASS |
| hani-office-pets-268-pins.test.mjs | 0/1 | 1 | Git 금지 차단 |
| hani-office-pets-bubble.test.mjs | 21/1 | 1 | Git 금지 차단 |
| hani-office-props.test.mjs | 11/0 | 0 | PASS |
| hani-office-release-projection.test.mjs | 2/0 | 0 | PASS |
| hani-office-residents.test.mjs | 49/0 | 0 | PASS |
| hani-office-seats-215.test.mjs | 12/0 | 0 | PASS |
| hani-office-snack.test.mjs | 26/0 | 0 | PASS |
| hani-office-staff-chat.test.mjs | 17/0 | 0 | PASS |
| hani-office-tap-lines.test.mjs | 15/0 | 0 | PASS |
| hani-office-tlayout.test.mjs | 13/0 | 0 | PASS |
| hani-office-top-labels.test.mjs | 7/0 | 0 | PASS |
| hani-office-v2-215.test.mjs | 17/1 | 1 | Git 금지 차단 |
| hani-office-visitors-cafe.test.mjs | 5/0 | 0 | PASS |
| hani-office-xmas-269-pins.test.mjs | 1/1 | 1 | Git 금지 차단 |
| hani-office-xmas.test.mjs | 12/1 | 1 | Git 금지 차단 |
| hani-office-zoom.test.mjs | 12/0 | 0 | PASS |
| hani-offline-entry-223.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-offline-transport-223.test.mjs | 0/0 | 1 | Git 금지 차단 |
| hani-owner-verification-runtime.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-owner-verification-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-photo-backup-222.test.mjs | 0/0 | 0 | PASS |
| hani-polish-205-safety.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-polish-215.test.mjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-post-audit-mobile-overlap.test.cjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-proactive-204-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-proactive-204.test.mjs | 19/2 | 1 | Git 금지 차단 |
| hani-proactive-care-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-procrastination-board.test.mjs | 6/0 | 0 | PASS |
| hani-profile-thumbs-ui.test.cjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-protected-gate-integration.test.mjs | 0/0 | 1 | Git 금지 차단 |
| hani-pwa-213.test.mjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-pwa-release-paths.test.mjs | 0/0 | 0 | PASS |
| hani-qa-1st-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-qa-210.test.mjs | 8/1 | 1 | Git 금지 차단 |
| hani-qa-design-b4.test.mjs | 22/2 | 1 | 변경 전 동일 실패 재현 |
| hani-qa-easy-cleanup.test.mjs | 12/0 | 0 | PASS |
| hani-qa-report-fixes.test.mjs | 5/5 | 1 | 변경 전 동일 실패 재현 |
| hani-quality-data-runtime.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-relationship-seed-build.test.mjs | 0/0 | 0 | PASS |
| hani-release-version-layers.test.mjs | 7/0 | 0 | PASS |
| hani-remote-card-224.test.mjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-remote-media-219.test.mjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-report-common-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-reviewed-release-baseline.test.mjs | 1/16 | 1 | Git 금지 차단 |
| hani-runtime-closure-ilbo.test.mjs | 3/0 | 0 | PASS |
| hani-save-guard.test.mjs | 10/0 | 0 | PASS |
| hani-second-opinion-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-seoyun-m9.test.mjs | 15/0 | 0 | PASS |
| hani-server-owner-guard.test.mjs | 13/0 | 0 | PASS |
| hani-settings-225-qa-guard.test.mjs | 0/3 | 1 | Git 차단 + 변경 전 동일 실패 |
| hani-settings-225.test.mjs | 0/0 | 1 | Git 금지 차단 |
| hani-simplify-218.test.cjs | 4/0 | 0 | PASS |
| hani-simplify-225.test.mjs | 0/0 | 1 | Git 금지 차단 |
| hani-staff-floors-214.test.mjs | 7/3 | 1 | 환경/fixture 차단 |
| hani-street-journal-closure.test.mjs | 1/0 | 0 | PASS |
| hani-tasks-qa-212.test.mjs | 6/1 | 1 | 변경 전 동일 실패 재현 |
| hani-theme-white-215.test.mjs | 0/0 | 1 | Git 금지 차단 |
| hani-toss-intake-224.test.mjs | 10/0 | 0 | PASS |
| hani-transaction-runtime.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-ui-203b-ui.test.mjs | 0/0 | 1 | 환경/fixture 차단 |
| hani-ui-203b.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |
| hani-wishlist-quick-add.test.mjs | 7/0 | 0 | PASS |
| hani-yuna-schedule-ui.test.mjs | 0/0 | 1 | 변경 전 동일 실패 재현 |

### 현재 런타임 identity

| 파일 | SHA256 |
|---|---|
| hani-newsroom-4cut.js | 4d9d37f1f371ac6275aa8aea63f288fd647efc083ec930013a985707b247cd66 |
| assets/data/newsroom-4cut/issues.json | fc00d303d972e575a16a602f91410ea88f236c296630767602c7808407378ece |
| hani-design-system.css | 0cf7c23d996fd50bd5c08e723a83642fd98b0f553c8a8b942d7986aa35c61f97 |
| index.html | af3a9dcf2b6eafb48b6a3bb698cbff441105227e2546c89060d71decbf8c5a17 |
| scripts/fixtures/newsroom-288-delta.json | 5bfae0250ad3659f1db405bb95f5cdfd4c260c18460d9e57298136048411754a |

## 종료·서윤 인수인계

- 2026-11-11 20:45 KST / Node v24.20.0. 운영 4파일 + 기존 시험/공유 helper 5파일 + 신규 시험/inverse/fixture 4파일 + 이 보고서 = 변경 14파일. commit/push/merge/배포 없음. Candidate SHA 없음(미커밋 작업).
- 시험 부산물 19파일 정리: 기존 JSON 4개 원문 복원, 신규 결과 JSON 15개 제거. `.ai-budget-private/staff-floors-214/result.json`도 해당 시험이 생성한 status임을 owner에서 확인 후 제거. 새 빈 결과 폴더 정리. 재감사에서 범위 밖 변경·새 파일·원본 누락 모두 0. 이 작업 artifacts에는 REPORT.md 하나, 새 PNG 0.
- 일반 실패는 독립적인 사전 runtime 바이트로 41+26명령을 추가 대조. 최종 실패를 새 코드 회귀로 바꿔 숨기지 않았고, 기존 실패를 수정하지 않음. qa-design-b4는 사전 21/3 → 현재 22/2로 한 기존 실패가 해소됐지만 남은 2개도 원본에서 재현. 현재 변경으로 추가된 미해결 시험 실패는 확인되지 않음. Git·브라우저 등 차단을 통과로 간주하지 않음.
- 다음 행동 1: 허용된 Edge 환경에서 `%TEMP%/hani-nr288/edge.mjs` 실행(준비한 runner는 임시 폴더에만 있음). 1440·1280·390 새 캡처와 가로 넘침·그림/오른쪽 높이 실측을 본 보고서에 기록. 이 확인 전 UI 완료/Preview 승인 상태로 올리지 않음.
- 다음 행동 2: 1호 컷 장면의 허용 근거 또는 그림 기반 기자 요약 허용 답변 확인 후 cuts 4개 추가. JSON 변경 시 새 288 inverse fixture/pin과 raw 288 시험을 갱신하고 영향받은 targeted 검사 재실행. 현재 1호 alt·실제 그림에 대한 '회장님 미등장'은 사실로 보고하지 않음.
- 이후 서윤이 Git 가능 환경에서 차단된 원문 대조를 실행하고 변경 검토·커밋·push. release train에서 버전 증가와 Candidate Freeze/One-Pass/HINA/대표님 승인/배포를 별도로 수행. 별도 Edge Function·서버 설정·Cloud schema 배포 없음.
- 상세 임시 증거/runner/사전 snapshot: `%TEMP%/hani-nr288/` (worktree 밖). 근거 저장소: `ghdtjdalskr-svg/hani-os`, branch `hani/newsroom-4cut-size`, base `06fef7e`, 로컬 HEAD `2a84d5b`. 원격 최신성 새 확인·PR 링크 없음.
- **Notion 갱신 대기 원고:** 2026-11-11 KST / Codex / 뉴스룸 주간 4컷 PC 오른쪽 칸. 호별 명시 facts·2호 cuts, 기존 renderer의 textContent 카드, PC 출처 grid 배치. 핵심 38/38, 전체190 실행(87명령 성공·103실패/차단, TAP1147통과/78실패), office73 실행(44성공·29Git차단, TAP784통과/30차단), raw closure164/누락0. 기존 실패 비교·assertion/pin 보존·부산물19정리. 1호 cuts 근거와 Edge 실측/PNG 미완료. 버전·Git·배포 없음, 서윤 인계. 원문 이 보고서 및 위 branch/base/HEAD. 착수 쓰기가 자동 승인 검토에서 `approval policy is never`로 거절되어 실제 저장·read-back 없음. 접근 가능한 담당자가 기존 현황을 보존하며 이 요약을 반영하고 읽어 확인해야 함.
- CURRENT/DECISIONS는 다른 담당 기록을 보존하기 위해 변경하지 않음. 본 보고서 한 파일에 현황·미검증·승인 경계·인수인계를 통합.
