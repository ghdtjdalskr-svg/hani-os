# tooling-310 실패·미검증 목록

고유311파일 중 성공210 / 실패·미검증101. 이 목록은 PASS가 아닙니다. 원문·명령·최신 실행 구분은 local/summary.json과 각 *-logs/에 보존했습니다.

**Git EPERM 미검증 (10파일)**

- hani-boardroom-voice-contract.test.mjs: PASS 0 / FAIL 0; final-logs/ 원문.
- hani-media-core.test.mjs: PASS 0 / FAIL 0; final-logs/ 원문.
- hani-meeting-character-voice.test.mjs: PASS 0 / FAIL 0; final-logs/ 원문.
- hani-meeting-engine-v2-batch1.test.mjs: PASS 0 / FAIL 0; final-logs/ 원문.
- hani-office-bori-stroll.test.mjs: PASS 13 / FAIL 1; final-logs/ 원문.
- hani-office-chairman-patrol-278-pins.test.mjs: PASS 6 / FAIL 6; final-logs/ 원문.
- hani-office-companion-homes.test.mjs: PASS 15 / FAIL 1; final-logs/ 원문.
- hani-office-mascot-label.test.mjs: PASS 9 / FAIL 1; final-logs/ 원문.
- hani-offline-transport-223.test.mjs: PASS 0 / FAIL 0; final-logs/ 원문.
- hani-protected-gate-integration.test.mjs: PASS 0 / FAIL 0; final-logs/ 원문.

**그 외 기존 실패·환경 미검증**

- hani-access-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-ai-budget-browser.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-backup-history-runtime.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-banners-203-ui.test.mjs: Chrome 실행 EPERM; PASS 0 / FAIL 0; browserType.launch: spawn EPERM.
- hani-board.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-board-203a.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-board-community.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-board-living.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-board-november.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-board-relationship.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-boardroom-cross-review.test.mjs: 프로세스 EPERM; PASS 0 / FAIL 0; <ref *1> Error: spawnSync C:\Users\홍성민\AppData\Local\Programs\nodejs\node.exe EPERM.
- hani-board-views-211.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-board-vocative.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-cloud-stability-runtime.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-context-remote.test.mjs: PASS 0 / FAIL 0; AssertionError [ERR_ASSERTION]: The input did not match the regular expression /\[data-remote-action="current"\]\{--remote-chip:#[0-9a-f]{6}\}/. Input:.
- hani-context-remote-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-dashboard-period-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-desk-mascots.test.mjs: PASS 0 / FAIL 0; 종료 코드/전체 로그 확인.
- hani-drive-vault-precheck.test.mjs: PASS 0 / FAIL 0; AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:.
- hani-exam-popup-214.test.mjs: PASS 0 / FAIL 0; ReferenceError: renderChibiNote is not defined.
- hani-fix-208-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-fun-chat-fortune.test.mjs: PASS 3 / FAIL 2; ✖ real pools: 30 complete conversations, 60 unique positive cards, public voices only (4.7031ms).
- hani-goal-media-budget-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-goal-progress-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-google-drive-212-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-helper-bot.test.mjs: PASS 25 / FAIL 4; ✖ KST midnight, deterministic fair 23-day rotation, 19 staff + 4 separated pets (1.6755ms).
- hani-history-226.test.mjs: Chrome 실행 EPERM; PASS 0 / FAIL 0; {"phase":"after","status":"BLOCKED","cases":[],"screenshots":[],"error":"browserType.launch: spawn EPERM\nCall log:\n\u001b[2m  - <launching> C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-edgeupdater --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,BlockOriginHeaderModificationOnRedirect,Translate,AutoDeElevate,OptimizationHints,msForceBrowserSignIn,msEdgeUpdateLaunchServicesPreferredVersion --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --disable-updater-scheduler --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=C:\\Users\\홍성민\\AppData\\Local\\Temp\\playwright_chromiumdev_profile-YkGqnK --remote-debugging-pipe --no-startup-window\u001b[22m\n"}.
- hani-history-unify.test.mjs: PASS 13 / FAIL 1; ✖ shared loader shape failure keeps legacy data, shows a short notice, and caches the failed request (3.9688ms).
- hani-ilbo-213.test.mjs: Chrome 실행 EPERM; PASS 0 / FAIL 0; BLOCKED browserType.launch: spawn EPERM.
- hani-ilbo-banner-215.test.mjs: Chrome 실행 EPERM; PASS 0 / FAIL 0; BLOCKED browserType.launch: spawn EPERM.
- hani-investment-research-ui.test.mjs: PASS 0 / FAIL 0; Error: Usage: node scripts/hani-investment-research-ui.test.mjs <playwright index.mjs> <browser exe>.
- hani-invest-split-ui.test.mjs: PASS 0 / FAIL 0; Error: Usage: node scripts/hani-invest-split-ui.test.mjs <playwright index.mjs> <browser exe>.
- hani-launch-greeting-221.test.mjs: Chrome 실행 EPERM; PASS 0 / FAIL 0; browserType.launch: spawn EPERM.
- hani-login-a-204-ui.test.mjs: PASS 0 / FAIL 0; AssertionError [ERR_ASSERTION]: args: <playwright index.mjs> <browser exe>.
- hani-login-session-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined.
- hani-lounge-billboard.test.mjs: PASS 21 / FAIL 6; ✖ slide order uses published module sources, actual employee and weeklyBest (24.313ms).
- hani-lounge-fun-211.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-lounge-natural-211.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-m9-link.test.mjs: PASS 7 / FAIL 3; ✖ exact inverse restores every base byte and rejects unrelated edits (25.1749ms).
- hani-m9-polish.test.mjs: PASS 0 / FAIL 2; ✖ exact polish inverse round-trips all bytes and rejects unrelated, partial and duplicate changes (3.6979ms).
- hani-nav-groups.test.mjs: PASS 0 / FAIL 0; AssertionError [ERR_ASSERTION]: procrastination speaker coverage.
- hani-navigation-state-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-navlogin-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-newsroom-4cut-230.test.mjs: Chrome 실행 EPERM; PASS 8 / FAIL 1; ✖ actual browser: route lazy loading, dates, archive, modal, themes, AA, storage, layouts and screenshots (374.2195ms).
- hani-newstaff-215.test.mjs: PASS 0 / FAIL 0; AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:.
- hani-office-actions-216.test.mjs: PASS 14 / FAIL 1; ✖ approved catalog projects exactly 98 core actions, 37 disabled, original family weights and frozen contract (406.8582ms).
- hani-office-affinity-274-pins.test.mjs: PASS 2 / FAIL 1; ✖ 274 base commit independently proves the entire original JS/CSS/helper blobs (2.3723ms).
- hani-office-barista-night-273-pins.test.mjs: PASS 4 / FAIL 1; ✖ 273: fixed Git release blobs independently prove every baseline pin and complete diff (2.4124ms).
- hani-office-cafe-rest.test.mjs: PASS 2 / FAIL 2; ✖ cafe route uses clear lower-right floor, retains the lounge and sign mounting surface (2.227ms).
- hani-office-chairman-234.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL.
- hani-office-companions-276-pins.test.mjs: PASS 2 / FAIL 1; ✖ 276 fixed Git base independently proves every original blob (1.9546ms).
- hani-office-consult.test.mjs: PASS 19 / FAIL 1; ✖ consult: sofa wording, counter words, safety owners and runtime timers (78.4939ms).
- hani-office-icons.test.mjs: PASS 14 / FAIL 1; ✖ icons: scheduler, home clearance, public snapshots and both label geometry owners are byte identical to 15747bc (291.5518ms).
- hani-office-lively-v2.test.mjs: PASS 6 / FAIL 2; ✖ obr2: deterministic query order, reduced motion and frozen spatial bytes (1.8796ms).
- hani-office-obr12.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL.
- hani-office-obr14.test.mjs: PASS 4 / FAIL 1; ✖ 235 authored immutable six complete ledgers and 84 snapshots, exact source/CSS and query-order determinism (1043.1717ms).
- hani-office-obr15.test.mjs: PASS 13 / FAIL 1; ✖ obr15 historical source identities retained; cafe/rest source and full absent ledgers frozen separately (1170.5764ms).
- hani-office-obr21.test.mjs: PASS 4 / FAIL 2; ✖ obr21 fixed pre-patch collision witnesses fail on base and clear on current, including reduced motion/cancellation (3.5292ms).
- hani-office-obr4.test.mjs: PASS 8 / FAIL 2; ✖ obr4: all 326 canon anchors/coordinates stay frozen; both registered owners render in 2F with no planned rows (2.9465ms).
- hani-office-obr6.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL.
- hani-office-obr7.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL.
- hani-office-obr8.test.mjs: PASS 2 / FAIL 1; ✖ obr8/obr13: frozen formal plans include approved chairman delta; errands have full 8–25s stays, ≤60s round trips, present colleagues, shared reservations and no leisure words (1151.8697ms).
- hani-office-obr9.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL.
- hani-office-pet-bori-272-pins.test.mjs: PASS 3 / FAIL 1; ✖ 272: fixed Git release blobs independently prove every baseline pin and complete diff (4.185ms).
- hani-office-pets-268-pins.test.mjs: PASS 0 / FAIL 1; ✖ v2.9.268: exact fixture pairs are the complete diff from pinned origin/main, with no other source edits (966.3903ms).
- hani-office-pets-bubble.test.mjs: PASS 21 / FAIL 1; ✖ resident model differs from origin/main only in approved Mochi hours, rhythm, life and snapshot sections (2.664ms).
- hani-office-v2-215.test.mjs: PASS 17 / FAIL 1; ✖ frozen 326-anchor canon file (+5 window spots and 2 coffee service anchors), active registered staff only, exact home floor/seat and posture (2.4161ms).
- hani-office-xmas-269-pins.test.mjs: PASS 1 / FAIL 1; ✖ v2.9.269: restored files equal actual Git blobs at the fixed v2.9.268 release commit (1.8826ms).
- hani-offline-entry-223.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined.
- hani-owner-verification-runtime.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-owner-verification-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-polish-215.test.mjs: Chrome 실행 EPERM; PASS 0 / FAIL 0; browserType.launch: spawn EPERM.
- hani-proactive-204-ui.test.mjs: PASS 0 / FAIL 0; Error: Pass playwright/index.mjs and browser executable.
- hani-proactive-care-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-pwa-213.test.mjs: PASS 0 / FAIL 0; 종료 코드/전체 로그 확인.
- hani-qa-1st-ui.test.mjs: PASS 0 / FAIL 0; Error: Usage: node scripts/hani-qa-1st-ui.test.mjs <playwright index.mjs> <browser exe>.
- hani-qa-210.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-qa-210-followup.test.mjs: PASS 0 / FAIL 0; ReferenceError: syncThemeCollections is not defined.
- hani-qa-report-fixes.test.mjs: PASS 1 / FAIL 9; ✖ blocked generation refreshes once, persists Korean reason through repaint, writes nothing (7.7913ms).
- hani-quality-data-runtime.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-remote-card-224.test.mjs: Chrome 실행 EPERM; PASS 0 / FAIL 0; browserType.launch: spawn EPERM.
- hani-remote-media-219.test.mjs: Chrome 실행 EPERM; PASS 0 / FAIL 0; browserType.launch: spawn EPERM.
- hani-report-common-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-second-opinion-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-settings-225.test.mjs: PASS 0 / FAIL 0; AssertionError [ERR_ASSERTION]: train version cannot roll back.
- hani-settings-225-qa-guard.test.mjs: PASS 1 / FAIL 2; ✖ settings QA guard retains original handlers and executes memory-only approval and failure paths (6034.1961ms).
- hani-simplify-225.test.mjs: PASS 0 / FAIL 0; AssertionError [ERR_ASSERTION]: train version cannot roll back.
- hani-theme-white-215.test.mjs: PASS 0 / FAIL 0; AssertionError [ERR_ASSERTION]: all storage/write expressions preserved across integrated features.
- hani-transaction-runtime.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.
- hani-ui-203b-ui.test.mjs: Chrome 실행 EPERM; PASS 0 / FAIL 0; browserType.launch: spawn EPERM.
- hani-yuna-schedule-ui.test.mjs: PASS 0 / FAIL 0; TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined.

**대조 조건과 남은 위험**

- 최초 시작 입력215개 대조에서 성공→실패 전환0, fatal 메시지 변화0. settings guard는 별도 출시 전 대조를 함께 사용했습니다. 원본 시작 결과는 삭제·교체하지 않았습니다.
- settings guard: 실제 pre310 Git HEAD 82c3362a623710398436164a3881bf9666f7c43e, origin 6ed927a3de99f4f32d05bae1c160ea07685eb65b; 실제 refs를 건드리지 않은 local/ 고립 스냅샷. 기존 시험 그대로 1PASS/2FAIL 재현. 현재와 projected main·HTML SHA, 기준 2220b6129c63721906a3788ee9a7681f197c4523, 오류가 완전히 같습니다.
  - hani-main.js: 0730c64fd4073d5eb756348041d9e933d178710d99724802a603f0f872a93912
  - index.html: 63ee4c3ad3891ff6c1baa4148e1b37cbc305fd3fabc74a53b0f373454a0ffd20
- 근거: local/settings-equivalence.json, pre310-control-identity.json, pre310-settings.utf8.log, probe-settings-{current,pre310}.json. 310 층으로 새로 생긴 실패로 세지 않지만, settings guard 자체는 여전히 실패입니다.
- cafe-rest·lively-v2는 각각 최초+2회 재시도. 마지막 cold 최소537.738ms / 556.403ms로400ms 실패 지속; warm0.806ms는3ms 통과. 기존 단언·기준값은 그대로입니다.
- 실제 Chrome/Edge UI, Git 프로세스가 차단된 비교, Preview·Production read-back은 미검증입니다. 개발도구 작업이라 runtime build·버전 증가·배포는 N/A입니다.
