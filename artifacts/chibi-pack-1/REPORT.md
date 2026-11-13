성민 대표님, 기존 치비 시트만 재사용해 네 후보를 구현했습니다.
가계부·자산/투자·시청 빈 상태와 월말 점검·월간 보고서에 작은 그림을 붙였습니다.
오류 안내와 새 소식 후보는 복구 화면·기존 당번 도움말과 겹칠 위험으로 보류했습니다.
새 시험 10/10, M9 15/15, 저장 안전장치 10/10, 버전 레이어 8/8이 통과했습니다.
Edge는 Windows 접근 거부로 촬영하지 못했습니다. Git·버전 변경·배포는 하지 않았습니다.

# 치비툰 1탄 · ch292

## 작업 식별

- 날짜·담당: 2026-11-12 KST / Codex 단독. 별도 역할 이름으로 독립 검증을 주장하지 않음.
- 상태: 구현 완료 / 181파일 회귀 실행 완료(기존 실패·차단 별도) / 실제 화면 검증 BLOCKED / 미커밋.
- 저장소·branch·worktree: PROJECT HANI / hani/chibi-pack-1 / ch292.
- base·착수 HEAD·로컬 origin/main: 7769fbe0fedd760f39493af3a97fe7b377977acb. .git 연결 파일과 ref만 읽었음. Git 금지로 원격 최신성은 미확인.
- 작업 지시 ../ch292-task.md를 Get-Content -Raw -Encoding UTF8로 전체 읽었고 한글은 정상. ../ch292-ref/chibi-audit-REPORT.md의 1탄 후보를 기준으로 함.
- 승인: 2026-11-12 「1탄ㄱㄱ」 — branch 작업·미리보기까지. 배포는 별도 승인. commit·push는 서윤 담당.
- 수정 경계: 기존 hani-main.js renderer, 기존 hani-street-journal.css, 시험 도구. hani-office-live.js·조직도·hani-design-system.css는 수정하지 않음.
- CODEMAP: investment, media-archive, monthly-report의 owner hani-main.js 확인. 가계부 상세·월말 점검·Cloud 안내·도움말 news는 CODEMAP_MISS로 실제 함수·DOM 검색에 fallback.
- 표시·캐시 2.9.289 / 내부 2.9.15-safe-baseline-bootstrap 유지. HTML UI 선언 hani-ui-v02992.js?v=2.9.289, 마지막 script hani-launch-greeting.js. 실제 브라우저 로딩은 미검증.

## 구현·보류

| 후보 | 실제 owner·상태 | 결과 |
| --- | --- | --- |
| 02 가계부 | renderLedger → 선택 월 items.length === 0 → #ledgerDetailTable 앞 | 지은 생각 1개. 다른 월에만 기록이 있는 경우 표시. 선택 월 기록이 있으면 필터 결과 0건이어도 숨김. 0원 항목도 기록으로 취급. 기존 표·필터·전체 보기·수정 버튼 유지 |
| 03 자산·투자 | renderAssets / renderPortfolio → 기존 investmentAmountKnown(latest)가 false → #assetComposition / #overviewAccounts 앞 | 각 화면 지은 생각 1개. 기존 확정 자료·거래·기초 현금 판정을 재사용. 확정된 0원 자료나 0원 거래도 빈 상태로 바꾸지 않음. 기존 미확인 금액·자료 기준 유지 |
| 06 시청 | renderMovies → state.movies.length === 0 → #watchedMovies 앞 | 민지 생각 1개. 전체 아카이브가 비었을 때만 표시. 예정작·관람작이 있거나 검색·유형·평점 필터 때문에 결과가 비었으면 첫 기록 안내 숨김 |
| 15 오류·오프라인 | renderCloudPanel의 #cloudMessage·#cloudStatePill, 로그인·복구 안내 | 보류. Cloud 상태문은 textContent 갱신 소유이고 전용 그림 슬롯이 없음. 인증·복구·차이 확인·재시도 영역을 바꾸지 않고 넣을 위치를 확정하지 못함. 오류·데이터 안전 단정 문구 추가 없음 |
| 16 월말 정산 | renderSettlementCheck → 기존 15~21일 visible 분기 | 지은 생각 1개를 기존 점검 본문·버튼 뒤에 표시. 기존 날짜 판정을 유지하고 .hani-settlement-content만 갱신하여 그림 슬롯과 본문 wrapper를 유지. 기존 확인 버튼과 저장하지 않는다는 설명 유지 |
| 16 월간 보고 | renderMonthlyReport → #monthlyReportPending 뒤 | 하니 설명 1개를 기존 상태·생성/재시도 버튼 뒤에 표시. 빈 달·기록 있는 달·보관 보고서 표지 안내. 생성 진행·해당 월 오류에는 숨김. 기존 생성 가능 조건·오류·생성시각·자동 갱신 안 됨 문구 유지. 보고서 저장 view에 그림을 포함하지 않음 |
| 20 새 소식·알림 | HaniHelperBot.news → 기존 .hani-helper-news 및 당번 얼굴 | 보류. 이미 당번 직원·동물 얼굴과 새 소식 점을 표시하는 도움말 안에 있음. 하니를 더 넣으면 담당 중복·당번 불일치·폰 말풍선 공간 충돌 위험. 새 알림층·버튼·폴링 없음 |

- renderChibiNote는 기존 owner가 호출하는 읽기 전용 DOM 보조 함수. 고유 ID 슬롯을 최초 1회 생성한 뒤 hidden·그림 클래스·textContent만 갱신.
- 각 표시 상태에 치비 1개. 본문 교체 시 그림을 반복 create/delete하지 않음. 저장·Cloud·auth·이벤트·타이머 판정 추가 없음.
- 크기: PC 72×72px / 600px 이하 56×56px. 짧은 한국어 안내, 장식은 aria-hidden. 표·입력 위에 겹치는 absolute/fixed 배치 없음.
- 기존 CSS의 하니 설명 0% 0%, 지은 생각 0% 100%, 민지 생각 75% 100% 규칙에 selector를 공유함. 새 좌표 추정·개별 이미지 참조 없음.
- 월간 표지의 그림은 오른쪽에 배치. 인쇄에서는 새 치비 안내를 숨겨 기존 출력 영역을 보존함. 실제 인쇄·화면 배치는 Edge 차단으로 미검증.

## 바꾼 파일

| 파일 | 목적 |
| --- | --- |
| hani-main.js | 기존 renderer 6곳과 읽기 전용 persistent slot 보조 함수 |
| hani-street-journal.css | 기존 시트 좌표 공유와 .hani-chibi-note 스타일 한 묶음 |
| scripts/hani-chibi-pack-1.test.mjs | raw owner 실행·중복/상태/저장 안전·CSS·정적 참조 및 inverse 10개 시험 |
| scripts/hani-chibi-pack-1.browser.mjs | 외부 통신을 막는 임시 Edge 프로필로 실제 앱·showView·1440/390 캡처 및 반복 렌더 시험 |
| scripts/hani-chibi-pack-1-source.cjs | 전체 SHA와 정확한 편집을 검증하는 시험 전용 바깥 inverse |
| scripts/hani-chibi-pack-1-preload.cjs | 기존 시험에만 정확한 이전 바이트를 메모리로 제공. browser에서는 사용하지 않음 |
| scripts/fixtures/chibi-pack-1-delta.json | 이번 두 runtime 변경 및 기존 289→288의 정확한 시험 기준 |
| scripts/hani-m9-polish-preload.cjs | 기존 preload 맨 바깥에 이번 inverse 1줄 연결 |
| artifacts/chibi-pack-1/REPORT.md | 이 보고서와 작업 인수인계. 추가 보고서 없음 |

기존 시험 파일·assertion·frozen fixture pin을 삭제하거나 완화하지 않음. 운영 기준은 289지만 기존 release dispatcher가 288에서 끝나므로, 289의 index/main 버전 및 연혁 metadata를 정확한 바깥 층에서만 되돌림. 결과는 기존 release-version-layers.json의 독립 288 SHA와 일치해야 함. 임의 파일·줄바꿈·부분 변경은 허용하지 않음.

## 검증

Risk Tier: LIGHT 읽기 전용 장식 UI. 기존 상태 분기는 NORMAL 수준 owner 회귀도 병행. 저장/auth/Cloud/Release pipeline 코드 변경 없음.

- 새 raw 상태 시험: 10/10 PASS. 실제 owner 함수와 저장 접근 시 throw하는 격리 DOM을 실행. 선택 월 없음/필터 0건/0원 항목/자산 확정 0원/거래 있음/예정작 있음/월말 visible 분기/월간 보관·오류·생성 중/반복 렌더에서 슬롯 동일성과 중복 없음 확인.
- M9: 요청한 명령 그대로 15/15 PASS.
- save-guard: 10/10 PASS. release-version-layers: 8/8 PASS.
- 기존 street-journal 및 closure: 11/11 PASS.
- 기존 monthly-report aggregation: PASS. 실제 browser smoke는 Playwright 모듈 부재로 BLOCKED.
- JS syntax: 수정·추가 JS/MJS/CJS 6파일 PASS.
- 격리 DOM 시험은 실제 Edge 화면 검증을 대신하지 않음. 인쇄·다크/테마·버튼 겹침·폰 터치·실데이터·로그인·Cloud 연결은 미검증.
- 일반 개발 UI 패치이며 Candidate Freeze·Package Build·One-Pass·HINA·배포·Production read-back은 N/A. 기능 탭은 버전·캐시를 올리지 않는 배포 열차 규칙을 따름.

### 전체 실행 결과

- 선택: scripts의 office/building 시험 전부와 변경 owner 파일을 직접 참조하는 test/smoke, CODEMAP 관련 시험. 총 181파일. 파일별 별도 Node 프로세스에서 실행해 시험 간 전역 상태 혼합을 피함.
- 공통 실행: node --require ./scripts/hani-chibi-pack-1-preload.cjs --test --test-isolation=none --test-reporter=tap scripts/<시험파일>. M9는 위의 요청 명령으로 별도 실행.
- Git 명령 금지를 지키기 위해 worktree 밖 Node 사전 로딩 guard가 child_process의 Git 실행 요청을 호출 전에 EPERM/BLOCKED_GIT로 거부함. 실제 Git 실행 0. Node 안에서 다른 Node를 띄우는 방식도 EPERM이어서 PowerShell에서 각 Node를 직접 실행함.

| 범위 | 실행 파일 / 명령 성공 | Node 통과 | Git 차단 | 환경·입력 차단 | 별도 실패 | skip |
| --- | --- | --- | --- | --- | --- | --- |
| 전체 | 181 / 111 | 1254 | 66 | 9 | 26 | 7 |
| office/building | 77 / 47 | 814 | 35 | 1 | 3 | 4 |

Node의 fail 101개에는 Git·환경 차단도 포함됨. 전체 PASS로 보고하지 않음. 위 표는 181파일 공통 실행 1회 집계이며 아래 재검증 숫자를 중복 가산하지 않음.

- 일반 실패 24개(16파일): 수정 전 main/CSS를 메모리로 제공해 재실행했고 실패 이름·통과/실패 개수가 동일함. CSS 순서·옛 hero/275 pin·보고서 fixture·128개 closure 기대·QA VM의 renderHaniCareHome stub 누락 등. 이번 UI 구현 때문이라고 판단하지 않음.
- office 별도 실패 3개: building-206의 기존 층별 art 기대 1개는 수정 전에도 동일. cafe-rest 400ms 성능 1개는 최종 코드와 수정 전 코드에서 단독으로도 실패. lively-v2 400ms 성능 1개는 전체 실행에서 실패했으나 양쪽 단독 재검증에서 PASS(최종 firstMs 349.76/332.79/318.10ms, warm 0.805ms). 성능 변동 원인은 미확정이며 400ms/3ms assertion을 유지함.
- cafe-rest 최종 단독 측정(회장님 있음): 449.22/444.99/401.85ms. 수정 전 단독도 FAIL. office 코드 자체는 수정하지 않았음.
- office-219: 요청한 기존 실패 항목이지만 이번 환경에서는 Git 기준 읽기가 차단돼 해당 원래 assertion까지 진행하지 못함. PASS로 처리하지 않음.
- M9-link는 공통 실행에서 preload 순서 차이 3개와 package 포함 실패 1개가 나옴. 올바른 polish preload로 별도 재실행하니 기능 9/9 PASS, package 1FAIL만 남음. 포함 누락 4경로는 기존 issues.json·extra-m9.json·extra-m9-comic.webp·seoyun-m9-special-cut.webp. 이번 patch에서 Gate/서버/배포 목록을 바꾸지 않음.
- 환경·입력 차단 9개: Playwright 모듈 또는 Edge spawn 환경, 기존 검사가 요구하는 별도 raw historical baseline·PACKAGE.json 인자 부재. 현재 작업 전 snapshot을 과거의 독립 기준으로 가장해 넣지 않음. 과거 baseline export는 Git 금지와 파일 부재로 준비하지 못함.
- legacy 결과는 exact inverse가 전달한 동일한 기준 바이트에 대한 검증임. 최종 raw UI 위치 변경은 신규 10개, M9 15개, save/version 18개를 다시 실행해 통과 확인. 검사 문턱·assertion·기존 pin 수정 없음.

환경·입력 차단 파일:
- hani-annual-report-ui-test.mjs
- hani-building-206-safety.test.mjs
- hani-deploy-package-intake-test.mjs
- hani-invest-split-safety.test.mjs
- hani-investment-research-safety.test.cjs
- hani-monthly-report-smoke.mjs
- hani-newsroom-4cut-230.test.mjs
- hani-newstaff-215.test.mjs
- hani-polish-205-safety.test.mjs

<details>
<summary>181파일 전체 결과 · 숫자는 통과 / Node fail / skip</summary>

| 시험 파일 (scripts/) | 통과 / fail / skip | 결과 |
| --- | --- | --- |
| hani-ai-work-status.test.mjs | 1 / 0 / 0 | PASS |
| hani-annual-report-ui-test.mjs | 0 / 1 / 0 | 환경·인자 차단 1 |
| hani-app-216-audit.test.cjs | 6 / 1 / 0 | 수정 전 재현 1 |
| hani-app-216-practical.test.cjs | 12 / 0 / 0 | PASS |
| hani-app-216.test.cjs | 1 / 0 / 0 | PASS |
| hani-asset-intake-v2-AB.test.mjs | 9 / 0 / 0 | PASS |
| hani-asset-intake-v2-C.test.mjs | 13 / 0 / 0 | PASS |
| hani-asset-intake-v2-ease.test.mjs | 6 / 0 / 0 | PASS |
| hani-board-guard.test.mjs | 1 / 0 / 0 | PASS |
| hani-board.test.mjs | 1 / 0 / 0 | PASS |
| hani-boardroom-live-meeting.test.mjs | 1 / 0 / 0 | PASS |
| hani-boardroom-recovery.test.mjs | 1 / 0 / 0 | PASS |
| hani-brand-heroes-218.test.mjs | 0 / 1 / 0 | 수정 전 재현 1 |
| hani-building-206-engine.test.mjs | 6 / 0 / 0 | PASS |
| hani-building-206-safety.test.mjs | 0 / 1 / 0 | 환경·인자 차단 1 |
| hani-building-206-ui.test.mjs | 0 / 0 / 1 | PASS |
| hani-building-206.test.mjs | 20 / 1 / 0 | 수정 전 재현 1 |
| hani-character-archive.test.cjs | 1 / 0 / 0 | PASS |
| hani-chibi-pack-1.test.mjs | 10 / 0 / 0 | PASS |
| hani-cloud-conflict-choice.test.mjs | 1 / 0 / 0 | PASS |
| hani-cloud-egress-save-sim.test.mjs | 1 / 0 / 0 | PASS |
| hani-cloud-egress-sync.test.mjs | 1 / 0 / 0 | PASS |
| hani-cloud-first.test.mjs | 1 / 0 / 0 | PASS |
| hani-dash-218.test.mjs | 2 / 1 / 1 | 수정 전 재현 1 |
| hani-dashboard-period.test.mjs | 1 / 0 / 0 | PASS |
| hani-deploy-package-intake-test.mjs | 0 / 1 / 0 | 환경·인자 차단 1 |
| hani-dev-report-generate.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-drive-vault.test.mjs | 1 / 0 / 0 | PASS |
| hani-egress-fix.test.mjs | 1 / 0 / 0 | PASS |
| hani-existing-pr-qa-test.mjs | 1 / 0 / 0 | PASS |
| hani-fix-208.test.mjs | 7 / 0 / 0 | PASS |
| hani-fixes-213-oauth.test.mjs | 7 / 0 / 0 | PASS |
| hani-fun-top3.test.mjs | 0 / 1 / 0 | 수정 전 재현 1 |
| hani-gemini-reports-build.test.mjs | 1 / 0 / 0 | PASS |
| hani-goal-delete-test.js | 1 / 0 / 0 |  |
| hani-goal-media-budget.test.mjs | 3 / 0 / 0 | PASS |
| hani-goal-period-view.test.mjs | 4 / 0 / 0 | PASS |
| hani-goal-period.test.mjs | 20 / 0 / 0 | PASS |
| hani-google-drive-212.test.mjs | 11 / 0 / 0 | PASS |
| hani-hana-intake-224.test.mjs | 15 / 0 / 0 | PASS |
| hani-helper-275-pins.test.mjs | 2 / 2 / 0 | Git 차단 1 · 수정 전 재현 1 |
| hani-history-unify.test.mjs | 14 / 0 / 0 | PASS |
| hani-ic-polish-205.test.cjs | 10 / 1 / 0 | 수정 전 재현 1 |
| hani-ic-report-205.test.cjs | 10 / 0 / 0 | PASS |
| hani-ilbo-213.test.mjs | 1 / 0 / 0 |  |
| hani-intake-audit-206.test.cjs | 1 / 0 / 0 | PASS |
| hani-invest-basis.test.cjs | 1 / 0 / 0 | PASS |
| hani-invest-split-safety.test.mjs | 0 / 1 / 0 | 환경·인자 차단 1 |
| hani-invest-split.test.mjs | 1 / 0 / 0 | PASS |
| hani-investment-research-safety.test.cjs | 0 / 1 / 0 | 환경·인자 차단 1 |
| hani-investment-research.test.cjs | 15 / 0 / 0 | PASS |
| hani-kiwoom-code-224.test.mjs | 10 / 0 / 0 | PASS |
| hani-life-bundle-source.test.mjs | 5 / 0 / 0 | PASS |
| hani-login-a-204.test.mjs | 1 / 0 / 0 | PASS |
| hani-lounge-ai-213.test.mjs | 12 / 0 / 0 | PASS |
| hani-lounge-billboard.test.mjs | 1 / 0 / 0 | PASS |
| hani-m9-link.test.mjs | 6 / 4 / 0 | 수정 전 재현 4 |
| hani-media-c-controls.test.mjs | 1 / 0 / 0 | PASS |
| hani-media-core.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-meeting-engine-v2-batch1.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-meeting-engine-v2-client.test.mjs | 1 / 0 / 0 | PASS |
| hani-milestones-v1.test.mjs | 1 / 0 / 0 | PASS |
| hani-mission-203a.test.mjs | 1 / 0 / 0 | PASS |
| hani-mobile-intake-206.test.cjs | 1 / 0 / 0 | PASS |
| hani-monthly-report-aggregation-test.mjs | 1 / 0 / 0 | PASS |
| hani-monthly-report-smoke.mjs | 0 / 1 / 0 | 환경·인자 차단 1 |
| hani-nav-groups.test.mjs | 0 / 1 / 0 | 수정 전 재현 1 |
| hani-navlogin.test.mjs | 1 / 0 / 0 | PASS |
| hani-newface-217.test.mjs | 0 / 1 / 0 | 수정 전 재현 1 |
| hani-newsroom-4cut-230.test.mjs | 7 / 2 / 0 | Git 차단 1 · 환경·인자 차단 1 |
| hani-newstaff-215.test.mjs | 0 / 1 / 0 | 환경·인자 차단 1 |
| hani-ocr-accuracy-224.test.mjs | 13 / 1 / 0 | 수정 전 재현 1 |
| hani-office-219.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-office-actions-216.test.mjs | 14 / 1 / 0 | Git 차단 1 |
| hani-office-actions-221.test.mjs | 20 / 0 / 0 | PASS |
| hani-office-affinity-274-pins.test.mjs | 2 / 1 / 0 | Git 차단 1 |
| hani-office-affinity-cap.test.mjs | 19 / 0 / 0 | PASS |
| hani-office-affinity-storage.test.mjs | 3 / 0 / 0 | PASS |
| hani-office-affinity.test.mjs | 21 / 0 / 0 | PASS |
| hani-office-barista-night-273-pins.test.mjs | 4 / 1 / 0 | Git 차단 1 |
| hani-office-barista-night.test.mjs | 13 / 0 / 0 | PASS |
| hani-office-barista.test.mjs | 10 / 0 / 0 | PASS |
| hani-office-behavior.test.mjs | 10 / 0 / 0 | PASS |
| hani-office-bori-m9.test.mjs | 2 / 0 / 0 | PASS |
| hani-office-bori-stroll.test.mjs | 13 / 1 / 0 | Git 차단 1 |
| hani-office-bubble-close.test.mjs | 17 / 0 / 0 | PASS |
| hani-office-cafe-rest.test.mjs | 2 / 2 / 0 | Git 차단 1 · 성능 실패 1 |
| hani-office-chairman-234.test.mjs | 6 / 0 / 0 | PASS |
| hani-office-chairman-patrol-278-pins.test.mjs | 6 / 6 / 0 | Git 차단 6 |
| hani-office-chairman-patrol.test.mjs | 15 / 0 / 0 | PASS |
| hani-office-companion-homes.test.mjs | 15 / 1 / 0 | Git 차단 1 |
| hani-office-companions-276-pins.test.mjs | 2 / 1 / 0 | Git 차단 1 |
| hani-office-companions.test.mjs | 17 / 0 / 0 | PASS |
| hani-office-consult.test.mjs | 19 / 1 / 0 | Git 차단 1 |
| hani-office-crowded-labels.test.mjs | 19 / 0 / 0 | PASS |
| hani-office-drama.test.mjs | 20 / 0 / 0 | PASS |
| hani-office-fix-218.test.mjs | 6 / 0 / 0 | PASS |
| hani-office-floor-bubble.test.mjs | 21 / 0 / 0 | PASS |
| hani-office-hd-224.test.mjs | 10 / 0 / 0 | PASS |
| hani-office-icons.test.mjs | 14 / 1 / 0 | Git 차단 1 |
| hani-office-kids-286-source.test.mjs | 3 / 0 / 0 | PASS |
| hani-office-kids-lively.test.mjs | 15 / 0 / 0 | PASS |
| hani-office-kids-merge.test.mjs | 10 / 0 / 0 | PASS |
| hani-office-kids-pose-b.test.mjs | 13 / 0 / 0 | PASS |
| hani-office-kids-visit.test.mjs | 16 / 0 / 0 | PASS |
| hani-office-kids-weekday.test.mjs | 19 / 0 / 0 | PASS |
| hani-office-labels-qa.test.mjs | 17 / 0 / 0 | PASS |
| hani-office-lively-v2.test.mjs | 6 / 2 / 0 | Git 차단 1 · 성능 실패 1 |
| hani-office-lively.test.mjs | 13 / 0 / 0 | PASS |
| hani-office-mascot-label.test.mjs | 9 / 1 / 0 | Git 차단 1 |
| hani-office-motion-1.test.mjs | 16 / 0 / 0 | PASS |
| hani-office-motion-2.test.mjs | 24 / 0 / 0 | PASS |
| hani-office-obr10.test.mjs | 4 / 0 / 0 | PASS |
| hani-office-obr12.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-office-obr14.test.mjs | 4 / 1 / 0 | Git 차단 1 |
| hani-office-obr15.test.mjs | 13 / 1 / 0 | Git 차단 1 |
| hani-office-obr16.test.mjs | 12 / 0 / 0 | PASS |
| hani-office-obr17.test.mjs | 3 / 0 / 0 | PASS |
| hani-office-obr18.test.mjs | 12 / 0 / 0 | PASS |
| hani-office-obr19.test.mjs | 3 / 0 / 0 | PASS |
| hani-office-obr21.test.mjs | 4 / 2 / 0 | Git 차단 2 |
| hani-office-obr3.test.mjs | 5 / 0 / 0 | PASS |
| hani-office-obr4.test.mjs | 8 / 2 / 0 | Git 차단 2 |
| hani-office-obr6.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-office-obr7.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-office-obr8.test.mjs | 2 / 1 / 0 | Git 차단 1 |
| hani-office-obr9.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-office-pet-bori-272-pins.test.mjs | 3 / 1 / 0 | Git 차단 1 |
| hani-office-pet-bori.test.mjs | 14 / 0 / 0 | PASS |
| hani-office-pets-268-pins.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-office-pets-bubble.test.mjs | 21 / 1 / 0 | Git 차단 1 |
| hani-office-props.test.mjs | 11 / 0 / 0 | PASS |
| hani-office-release-projection.test.mjs | 2 / 0 / 0 | PASS |
| hani-office-residents.test.mjs | 49 / 0 / 0 | PASS |
| hani-office-seats-215.test.mjs | 12 / 0 / 0 | PASS |
| hani-office-snack.test.mjs | 26 / 0 / 0 | PASS |
| hani-office-staff-chat.test.mjs | 17 / 0 / 0 | PASS |
| hani-office-tap-lines.test.mjs | 15 / 0 / 0 | PASS |
| hani-office-tlayout.test.mjs | 13 / 0 / 0 | PASS |
| hani-office-top-labels.test.mjs | 7 / 0 / 0 | PASS |
| hani-office-v2-215.test.mjs | 17 / 1 / 2 | Git 차단 1 |
| hani-office-visitors-cafe.test.mjs | 5 / 0 / 0 | PASS |
| hani-office-xmas-269-pins.test.mjs | 1 / 1 / 0 | Git 차단 1 |
| hani-office-xmas.test.mjs | 12 / 1 / 0 | Git 차단 1 |
| hani-office-zoom.test.mjs | 12 / 0 / 1 | PASS |
| hani-offline-transport-223.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-owner-verification-diagnostic.test.mjs | 1 / 0 / 0 | PASS |
| hani-photo-backup-222.test.mjs | 1 / 0 / 0 | PASS |
| hani-polish-205-safety.test.mjs | 0 / 1 / 0 | 환경·인자 차단 1 |
| hani-polish-215.test.mjs | 1 / 0 / 0 |  |
| hani-positions-only-test.cjs | 1 / 0 / 0 | PASS |
| hani-post-audit-investment.test.mjs | 1 / 0 / 0 | PASS |
| hani-proactive-204.test.mjs | 19 / 2 / 0 | Git 차단 2 |
| hani-procrastination-board.test.mjs | 6 / 0 / 0 | PASS |
| hani-pwa-213.test.mjs | 1 / 0 / 0 |  |
| hani-pwa-release-paths.test.mjs | 1 / 0 / 0 | PASS |
| hani-qa-210-followup.test.mjs | 13 / 1 / 0 | Git 차단 1 |
| hani-qa-210.test.mjs | 8 / 1 / 0 | Git 차단 1 |
| hani-qa-design-b4.test.mjs | 22 / 2 / 0 | 수정 전 재현 2 |
| hani-qa-easy-cleanup.test.mjs | 12 / 0 / 0 | PASS |
| hani-qa-report-fixes.test.mjs | 5 / 5 / 0 | 수정 전 재현 5 |
| hani-release-version-layers.test.mjs | 8 / 0 / 0 | PASS |
| hani-remote-card-224.test.mjs | 1 / 0 / 0 |  |
| hani-remote-media-219.test.mjs | 1 / 0 / 0 |  |
| hani-reviewed-release-baseline.test.mjs | 1 / 16 / 0 | Git 차단 16 |
| hani-save-guard.test.mjs | 10 / 0 / 0 | PASS |
| hani-seoyun-m9.test.mjs | 15 / 0 / 0 | PASS |
| hani-server-owner-guard.test.mjs | 13 / 0 / 0 | PASS |
| hani-settings-225-qa-guard.test.mjs | 0 / 3 / 0 | Git 차단 2 · 수정 전 재현 1 |
| hani-settings-225.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-simplify-218.test.cjs | 4 / 0 / 1 | PASS |
| hani-simplify-225.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-street-journal-closure.test.mjs | 1 / 0 / 0 | PASS |
| hani-street-journal.test.cjs | 10 / 0 / 0 | PASS |
| hani-tasks-qa-212.test.mjs | 6 / 1 / 1 | 수정 전 재현 1 |
| hani-theme-white-215.test.mjs | 0 / 1 / 0 | Git 차단 1 |
| hani-toss-intake-224.test.mjs | 10 / 0 / 0 | PASS |
| hani-transaction-date.test.mjs | 1 / 0 / 0 | PASS |
| hani-ui-203b.test.mjs | 0 / 1 / 0 | 수정 전 재현 1 |
| hani-wishlist-quick-add.test.mjs | 7 / 0 / 0 | PASS |
| hani-yuna-smoke.js | 1 / 0 / 0 | PASS |

</details>

실패별 전체 로그와 수정 전 비교는 worktree 밖 %TEMP%/hani-ch292-chibi-pack-1/에 보존함. 원본 예외·실패를 문자열 존재만으로 PASS 전환하지 않았음.


### 재실행 명령

작업 공간 ch292에서 실행:

~~~powershell
node --test --test-isolation=none scripts/hani-chibi-pack-1.test.mjs
node --require ./scripts/hani-m9-polish-preload.cjs --require ./scripts/hani-m9-link-preload.cjs --test --test-isolation=none scripts/hani-seoyun-m9.test.mjs
node --require ./scripts/hani-chibi-pack-1-preload.cjs --test --test-isolation=none scripts/hani-save-guard.test.mjs scripts/hani-release-version-layers.test.mjs
node --require ./scripts/hani-chibi-pack-1-preload.cjs --test --test-isolation=none scripts/hani-street-journal.test.cjs scripts/hani-street-journal-closure.test.mjs
node --require ./scripts/hani-m9-polish-preload.cjs --test --test-isolation=none scripts/hani-m9-link.test.mjs
~~~

## 정적 참조·데이터 보존

| 항목 | 이전 → 이후 |
| --- | --- |
| index.html부터 실제 정적 참조 목록 | 164 → 164, 경로 목록 완전 동일 |
| 참조 파일 총 크기 | 18,965,734 → 18,968,352바이트 (+2,618바이트 / 약 2.56KiB) |
| hani-main.js | 1,401,607 → 1,403,404바이트 (+1,797) |
| hani-street-journal.css | 8,953 → 9,774바이트 (+821) |
| 누락 파일 | 0 → 0 |
| 새 이미지·배포 파일 순증 | 0장 / 0개 |
| 기존 시트 | assets/street-journal/chibi-sheet-v1.webp, 168,748바이트, 이전·이후 포함 |
| localStorage setItem / removeItem / clear 문자열 호출 수 | 18/5/0 → 18/5/0 |
| addEventListener / setTimeout / setInterval 호출 수 | 68/46/1 → 68/46/1 |

위 단순 개수만으로 안전 PASS를 선언하지 않음. 전체 편집 inverse의 이전 바이트 일치와 raw owner 실행의 저장 접근 거부도 함께 확인함. 보호 키·내부 버전·기존 저장/삭제/복원/Cloud·Supabase write·schema·migration은 변경하지 않음. 새 시트 요청은 기존 시트가 아직 캐시되지 않은 화면에서 최대 168,748바이트 발생할 수 있음.

최종 runtime SHA256:
- hani-main.js: f32c01315a6b4f4bb6468fb6a49b6ff712d52809e6118be424b94204cade0b8f
- hani-street-journal.css: 58ff4221c8d5f2b3daf37a68e19d8795a026f55ef1b0c9a73f1a1549e4d5c66c
- index.html(미수정): 1dcf2866e037ce20d73a7e2f2990b2bd02a079e06f206684834d99d7f468d625

## 화면 · BLOCKED

실제 새 PNG: 0장. Edge 시작 직후 exit 2147483651, CreateFile 액세스 거부 0x5 및 FATAL mojo/platform_channel.cc:187. DevTools 연결 전 종료되어 로그인 게이트 숨기기·showView·캡처·실제 브라우저 assertion은 실행되지 않음. 브라우저 시험 코드의 실제 동작도 검증되지 않았으므로 PASS로 표시하지 않음.

시도한 명령:
~~~powershell
node scripts/hani-chibi-pack-1.browser.mjs
~~~

### 서윤이 돌려야 할 명령 · 스크린샷·브라우저 시험

Git/빌드 preload를 적용하지 않고 raw 앱으로 실행:
~~~powershell
node scripts/hani-chibi-pack-1.browser.mjs "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
~~~

외부 통신 차단·worktree 밖 새 임시 프로필·빈 합성 데이터·로그인 게이트 숨김·showView·반복 렌더·저장 영향·화면 경계·기존 시트 로딩을 확인하도록 준비함. 실제 계정·운영 생활 데이터는 사용하지 않음. 다음 각 상태를 1440×900, 390×900 두 크기로 촬영할 예정이며, 아래 파일은 아직 없음.

| 상태 | 예정 파일명 (각 -1440.png / -390.png) |
| --- | --- |
| 가계부 선택 월 없음 | ledger-empty |
| 투자 자료 없음 | investment-empty |
| 자산 자료 없음 | asset-empty |
| 시청 전체 목록 없음 | movie-empty |
| 월말 15~21일 점검 | settlement |
| 월간 보고서 없음 | monthly-empty |
| 보관된 월간 보고서 표지 | monthly-stored |
| 가계부 0원 항목 있음·필터 결과 없음 | ledger-filter-miss |
| 시청 기록 있음·검색 결과 없음 | movie-filter-miss |
| 월간 원본 검증 오류 안내 | monthly-error |

수치·문구·기존 버튼이 그림에 가려지지 않는지, 폰에서 문장이 지나치게 길지 않은지, 다크/사용 테마·인쇄·실기기 사용성을 추가 확인할 것. 자동 캡처 PASS와 아린/대표님 Preview 승인은 서로 다름.

## 다음 담당에게 · 인수인계

- 먼저 읽을 파일: 이 보고서, renderChibiNote / renderLedger / renderPortfolio / renderAssets / renderMovies / renderSettlementCheck / renderMonthlyReport, 새 시험과 browser runner.
- 다음 한 가지 행동: 서윤이 허용 환경에서 위 browser 명령을 실행하고 20장 증거와 기존 Git 의존 검사를 확인한 뒤 커밋·push 준비.
- 알려진 blocker: Edge 시작 거부, Git 기준 검사는 명시적 Git 금지, Playwright 의존 UI 시험은 설치 모듈 없음. 원격 main 최신성 미확인.
- 타 작업: join-ieum의 office·조직도 파일 및 theme-contrast의 디자인 시스템 CSS 수정 없음. 이 branch의 기존 main renderer와 street-journal CSS 변경만 통합할 것. 다른 branch/worktree를 임의 merge/rebase하지 않음.
- 승인 경계: branch 구현·미리보기까지 승인됨. merge·배포는 승인되지 않음. main 병합 / Pages / 운영 표시 버전 / 최신 JS 실제 로딩 / 기능 read-back 모두 수행하지 않음.
- CURRENT / DECISIONS는 수정하지 않음. 요청한 단일 REPORT에 작업별 사실·검증·남은 위험을 보존함.
- Notion HANI-88 기존 카드 읽기 성공. 착수 insert_content는 자동 승인 검토가 “MCP tool call requires approval, but approval policy is never”로 거절. 저장·read-back 완료 아님. 카드 상태를 탑승 대기로 바꿨다고 보고하지 않음.
- Notion 갱신 대기 전달문: 2026-11-12 / Codex / 치비툰1탄 ch292·hani/chibi-pack-1·base7769fbe / 02·03·06·16 구현, 15·20 보류 / 새10·M915·save10·release8 PASS / 정적164불변·+2,618바이트 / 실제 Edge·PNG0 BLOCKED / 전체 시험 상세는 이 보고서 / 저장·Cloud·버전·Git·배포 변경 없음 / 승인 「1탄ㄱㄱ」 branch·Preview까지 / 다음 서윤 실제 화면·Git 기준 확인·커밋·push / 원문 artifacts/chibi-pack-1/REPORT.md.

## 부산물 복원·종료 확인

- 기존 검사 JSON 4개를 작업 전 바이트로 복원: artifacts/office-behavior/obr16-layout-node.json, artifacts/office-behavior/obr17-layout-node.json, artifacts/office-behavior/obr19-layout-node.json, artifacts/office-drama/reachability.json.
- 새 검사 부산물 8개 제거: artifacts/newstaff-215/status.json, artifacts/ocr-accuracy-224/metrics.json, artifacts/polish-215/status.json, artifacts/pwa-213/run-status.json, artifacts/qa-210/node-evidence.json, artifacts/remote-219/after.json, artifacts/remote-card-224/after.json, artifacts/street-journal-v1/package-check.json.
- 복원 후 전체 파일 hash 비교에서 허용한 9파일만 남았고 범위 밖 파일 변경·추가 0. 기존 assertion/fixture·다른 담당 파일 보존.
- 임시 snapshot·로그·guard·Edge 프로필은 worktree 밖 TEMP에만 생성. artifacts/chibi-pack-1/에는 REPORT.md 하나, 실제 PNG 0장.
- 종료 시 .git ref 재확인: hani/chibi-pack-1 및 로컬 origin/main은 모두 7769fbe0fedd760f39493af3a97fe7b377977acb 유지. 원격 최신성은 별도 미확인.
- commit·push·PR·merge·Pages·Production은 수행하지 않음. 서윤에게 검토·실제 화면·Git 기준 재검증·커밋·push를 인계함. 결합 후 입력 SHA가 달라지면 strict inverse/영향 검사를 새 기준에서 다시 고정하고 검증할 것.
