# tooling-308 · 실패·미검증 목록

302개 단독 명령: 성공 201, 실패/미검증 101. 전체 로그는 commit 제외 `local/final/`, 상세 집계는 `local/summary.json`에 보존.

초기149개 직접 대조: 실패31개 해소, 새 실패 파일/개별 단언0. 나머지153개의 변경 전 전체 실행 대조는 수행하지 않았으므로 전 범위 새 회귀0으로 단정하지 않음.

## Git EPERM 미검증 · 33

- `scripts/hani-boardroom-voice-contract.test.mjs` — Git EPERM · 미검증
- `scripts/hani-media-core.test.mjs` — Git EPERM · 미검증
- `scripts/hani-meeting-character-voice.test.mjs` — Git EPERM · 미검증
- `scripts/hani-meeting-engine-v2-batch1.test.mjs` — Git EPERM · 미검증
- `scripts/hani-office-actions-216.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-affinity-274-pins.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-barista-night-273-pins.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-bori-stroll.test.mjs` — Git EPERM · 미검증
- `scripts/hani-office-cafe-rest.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-chairman-234.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-chairman-patrol-278-pins.test.mjs` — Git EPERM · 미검증
- `scripts/hani-office-companion-homes.test.mjs` — Git EPERM · 미검증
- `scripts/hani-office-companions-276-pins.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-consult.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-icons.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-lively-v2.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-mascot-label.test.mjs` — Git EPERM · 미검증
- `scripts/hani-office-obr12.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-obr14.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-obr15.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-obr21.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-obr4.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-obr6.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-obr7.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-obr8.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-obr9.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-pet-bori-272-pins.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-pets-268-pins.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-pets-bubble.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-v2-215.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-office-xmas-269-pins.test.mjs` — Git EPERM 뒤 기존 URL cwd 처리 오류 · 미검증
- `scripts/hani-offline-transport-223.test.mjs` — Git EPERM · 미검증
- `scripts/hani-protected-gate-integration.test.mjs` — Git EPERM · 미검증

## 그 밖의 프로세스/브라우저 미검증 · 39

- `scripts/hani-access-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-ai-budget-browser.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-backup-history-runtime.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-banners-203-ui.test.mjs` — 브라우저 EPERM · 미검증
- `scripts/hani-boardroom-cross-review.test.mjs` — 자식 프로세스 EPERM · 미검증
- `scripts/hani-cloud-stability-runtime.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-context-remote-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-dashboard-period-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-fix-208-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-goal-media-budget-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-goal-progress-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-google-drive-212-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-history-226.test.mjs` — 브라우저 EPERM · 미검증
- `scripts/hani-ilbo-213.test.mjs` — 브라우저 EPERM · 미검증
- `scripts/hani-ilbo-banner-215.test.mjs` — 브라우저 EPERM · 미검증
- `scripts/hani-investment-research-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-invest-split-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-launch-greeting-221.test.mjs` — 브라우저 EPERM · 미검증
- `scripts/hani-login-a-204-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-login-session-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-navigation-state-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-navlogin-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-newsroom-4cut-230.test.mjs` — 브라우저 EPERM · 미검증
- `scripts/hani-offline-entry-223.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-owner-verification-runtime.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-owner-verification-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-polish-215.test.mjs` — 브라우저 EPERM · 미검증
- `scripts/hani-proactive-204-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-proactive-care-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-pwa-213.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-qa-1st-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-quality-data-runtime.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-remote-card-224.test.mjs` — 브라우저 EPERM · 미검증
- `scripts/hani-remote-media-219.test.mjs` — 브라우저 EPERM · 미검증
- `scripts/hani-report-common-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-second-opinion-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-transaction-runtime.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증
- `scripts/hani-ui-203b-ui.test.mjs` — 브라우저 EPERM · 미검증
- `scripts/hani-yuna-schedule-ui.test.mjs` — 브라우저/실행 경로·의존성 미충족 · 미검증

## 남은 단언·fixture 실패 · 29

- `scripts/hani-board.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-board-203a.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-board-community.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-board-living.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-board-november.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-board-relationship.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-board-views-211.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-board-vocative.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-context-remote.test.mjs` — 보호된 context-remote 기존 단언 실패
- `scripts/hani-desk-mascots.test.mjs` — desk-mascots 멤버 목록 단언 실패(ieum)
- `scripts/hani-drive-vault-precheck.test.mjs` — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
- `scripts/hani-exam-popup-214.test.mjs` — 기존 VM fixture: renderChibiNote 누락
- `scripts/hani-fun-chat-fortune.test.mjs` — AssertionError [ERR_ASSERTION]: ieum duty voice
- `scripts/hani-helper-bot.test.mjs` — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
- `scripts/hani-history-unify.test.mjs` — AssertionError [ERR_ASSERTION]: The input did not match the regular expression /기존 기록/. Input:
- `scripts/hani-lounge-billboard.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-lounge-fun-211.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-lounge-natural-211.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-m9-link.test.mjs` — AssertionError [ERR_ASSERTION]: exact post-link input: data/hani-ilbo/issues.json
- `scripts/hani-m9-polish.test.mjs` — AssertionError [ERR_ASSERTION]: exact post-polish input: hani-organization-hub.js
- `scripts/hani-nav-groups.test.mjs` — AssertionError [ERR_ASSERTION]: procrastination speaker coverage
- `scripts/hani-newstaff-215.test.mjs` — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
- `scripts/hani-qa-210.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-qa-210-followup.test.mjs` — 기존 VM fixture: syncThemeCollections 누락
- `scripts/hani-qa-report-fixes.test.mjs` — 기존 VM fixture: renderChibiNote 누락
- `scripts/hani-settings-225.test.mjs` — AssertionError [ERR_ASSERTION]: train version cannot roll back
- `scripts/hani-settings-225-qa-guard.test.mjs` — AssertionError [ERR_ASSERTION]: train version cannot roll back
- `scripts/hani-simplify-225.test.mjs` — AssertionError [ERR_ASSERTION]: train version cannot roll back
- `scripts/hani-theme-white-215.test.mjs` — AssertionError [ERR_ASSERTION]: train version cannot roll back

카페 성능은 최초 및 재시도2회 모두 기존 최솟값<400ms 단언 PASS. 파일 전체는 독립 Git 대조 EPERM 때문에 실패 유지. 203b UI --static PASS는 Node 검사이며 실제 브라우저 PASS가 아님.
