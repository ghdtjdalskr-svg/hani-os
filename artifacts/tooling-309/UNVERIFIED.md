# tooling-309 · 실패 및 미검증

최초 전체 실행은 `local/final-logs/`. 이후 단독 재검사 파일은 아래에 근거 label을 표시하고, 최신 결과를 집계했습니다. 모든 원문과 집계는 `local/summary.json`에서 찾습니다. Git EPERM은 통과로 계산하지 않았습니다. 한 파일에 서로 다른 원인이 함께 있을 수 있으므로 이유와 원문을 함께 확인합니다.

착수 원본 대조35개도 모두 실패했습니다. 다만 `hani-settings-225-qa-guard.test.mjs`는 착수 원본에서 첫 항목 PASS·마지막 항목 FAIL, 현재는 첫 항목과 마지막 항목이 모두 `train version cannot roll back`으로 FAIL입니다. 이 원인은 기존 `artifacts/tooling-308/UNVERIFIED.md`에도 기록돼 있으며 이번 요청의 필수 수정 대상 밖으로 남겼습니다. 추가 실패 항목1개를 인계합니다. `local/other-comparison.json` 및 `local/unchanged-baseline-logs/`를 확인하세요. 전 범위 동일 원본 실행 대조는 수행하지 않았습니다.

## 브라우저/프로세스/입력 · 미검증

- `hani-access-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-ai-budget-browser.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-backup-history-runtime.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-banners-203-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · browserType.launch: spawn EPERM
- `hani-boardroom-cross-review.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
- `hani-cloud-stability-runtime.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-context-remote-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-dashboard-period-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-fix-208-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-goal-media-budget-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-goal-progress-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-google-drive-212-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-history-226.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
- `hani-ilbo-213.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
- `hani-ilbo-banner-215.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
- `hani-launch-greeting-221.test.mjs` · final · pass 0 / fail 0 / skip 0 · browserType.launch: spawn EPERM
- `hani-login-session-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined
- `hani-navigation-state-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-navlogin-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-newsroom-4cut-230.test.mjs` · final · pass 8 / fail 1 / skip 0 · browserType.launch: spawn EPERM
- `hani-office-actions-216.test.mjs` · final · pass 14 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-affinity-274-pins.test.mjs` · final · pass 2 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-barista-night-273-pins.test.mjs` · final · pass 4 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-cafe-rest.test.mjs` · perf-retry-2 · pass 3 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-chairman-234.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-companions-276-pins.test.mjs` · final · pass 2 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-consult.test.mjs` · final · pass 19 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-icons.test.mjs` · final · pass 14 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-lively-v2.test.mjs` · perf-retry-2 · pass 7 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-obr12.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-obr14.test.mjs` · final · pass 4 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-obr15.test.mjs` · final · pass 13 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-obr21.test.mjs` · final · pass 4 / fail 2 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-obr4.test.mjs` · final · pass 8 / fail 2 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-obr6.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-obr7.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-obr8.test.mjs` · final · pass 2 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-obr9.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-pet-bori-272-pins.test.mjs` · final · pass 3 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-pets-268-pins.test.mjs` · final · pass 0 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-pets-bubble.test.mjs` · final · pass 21 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-v2-215.test.mjs` · final · pass 17 / fail 1 / skip 2 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-office-xmas-269-pins.test.mjs` · final · pass 1 / fail 1 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received an instance of URL
- `hani-offline-entry-223.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined
- `hani-owner-verification-runtime.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-owner-verification-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-polish-215.test.mjs` · final · pass 0 / fail 0 / skip 0 · browserType.launch: spawn EPERM
- `hani-proactive-care-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-quality-data-runtime.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-remote-card-224.test.mjs` · final · pass 0 / fail 0 / skip 0 · browserType.launch: spawn EPERM
- `hani-remote-media-219.test.mjs` · final · pass 0 / fail 0 / skip 0 · browserType.launch: spawn EPERM
- `hani-report-common-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-second-opinion-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-transaction-runtime.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
- `hani-ui-203b-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · browserType.launch: spawn EPERM
- `hani-yuna-schedule-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined

## 단언/fixture 실패

- `hani-board.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-board-203a.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-board-community.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-board-living.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-board-november.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-board-relationship.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-board-views-211.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-board-vocative.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-context-remote.test.mjs` · final · pass 0 / fail 0 / skip 0 · AssertionError [ERR_ASSERTION]: The input did not match the regular expression /\[data-remote-action="current"\]\{--remote-chip:#[0-9a-f]{6}\}/. Input:
- `hani-desk-mascots.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
- `hani-drive-vault-precheck.test.mjs` · final · pass 0 / fail 0 / skip 0 · AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
- `hani-exam-popup-214.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: renderChibiNote is not defined
- `hani-fun-chat-fortune.test.mjs` · final · pass 3 / fail 2 / skip 1 · AssertionError [ERR_ASSERTION]: ieum duty voice / AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
- `hani-helper-bot.test.mjs` · final · pass 25 / fail 4 / skip 1 · AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: / AssertionError [ERR_ASSERTION]: main view help: procrastination
- `hani-history-unify.test.mjs` · final · pass 13 / fail 1 / skip 0 · AssertionError [ERR_ASSERTION]: The input did not match the regular expression /기존 기록/. Input:
- `hani-investment-research-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · Error: Usage: node scripts/hani-investment-research-ui.test.mjs <playwright index.mjs> <browser exe>
- `hani-invest-split-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · Error: Usage: node scripts/hani-invest-split-ui.test.mjs <playwright index.mjs> <browser exe>
- `hani-login-a-204-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · AssertionError [ERR_ASSERTION]: args: <playwright index.mjs> <browser exe>
- `hani-lounge-billboard.test.mjs` · final · pass 21 / fail 6 / skip 0 · AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: / AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
- `hani-lounge-fun-211.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-lounge-natural-211.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-m9-link.test.mjs` · final · pass 7 / fail 3 / skip 0 · AssertionError [ERR_ASSERTION]: exact post-link input: data/hani-ilbo/issues.json / AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
- `hani-m9-polish.test.mjs` · final · pass 0 / fail 2 / skip 0 · AssertionError [ERR_ASSERTION]: exact post-polish input: hani-organization-hub.js
- `hani-nav-groups.test.mjs` · final · pass 0 / fail 0 / skip 0 · AssertionError [ERR_ASSERTION]: procrastination speaker coverage
- `hani-newstaff-215.test.mjs` · final · pass 0 / fail 0 / skip 0 · AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
- `hani-proactive-204-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · Error: Pass playwright/index.mjs and browser executable
- `hani-pwa-213.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
- `hani-qa-1st-ui.test.mjs` · final · pass 0 / fail 0 / skip 0 · Error: Usage: node scripts/hani-qa-1st-ui.test.mjs <playwright index.mjs> <browser exe>
- `hani-qa-210.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-qa-210-followup.test.mjs` · final · pass 0 / fail 0 / skip 0 · ReferenceError: syncThemeCollections is not defined
- `hani-qa-report-fixes.test.mjs` · final · pass 1 / fail 9 / skip 0 · ReferenceError: renderChibiNote is not defined
- `hani-settings-225.test.mjs` · final · pass 0 / fail 0 / skip 0 · AssertionError [ERR_ASSERTION]: train version cannot roll back
- `hani-settings-225-qa-guard.test.mjs` · final · pass 1 / fail 2 / skip 0 · AssertionError [ERR_ASSERTION]: train version cannot roll back
- `hani-simplify-225.test.mjs` · final · pass 0 / fail 0 / skip 0 · AssertionError [ERR_ASSERTION]: train version cannot roll back
- `hani-theme-white-215.test.mjs` · final · pass 0 / fail 0 / skip 0 · AssertionError [ERR_ASSERTION]: train version cannot roll back

## Git EPERM 포함 · 미검증

- `hani-boardroom-voice-contract.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
- `hani-media-core.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
- `hani-meeting-character-voice.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
- `hani-meeting-engine-v2-batch1.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
- `hani-office-bori-stroll.test.mjs` · long · pass 13 / fail 1 / skip 0 · ✖ stroll inverse independently matches the fixed Git base (1.2516ms)
- `hani-office-chairman-patrol-278-pins.test.mjs` · final · pass 6 / fail 6 / skip 0 · ✖ 278 independent fixed Git blobs prove pre-patrol bytes (1.62ms)
- `hani-office-companion-homes.test.mjs` · final · pass 15 / fail 1 / skip 0 · ✖ home extension independently matches the specified fixed Git base (1.3711ms)
- `hani-office-mascot-label.test.mjs` · final · pass 9 / fail 1 / skip 0 · ✖ outer exact inverse independently restores fixed affinity HEAD and rejects partial/duplicate/unrelated edits (1.5365ms)
- `hani-offline-transport-223.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
- `hani-protected-gate-integration.test.mjs` · final · pass 0 / fail 0 / skip 0 · 원문 로그 확인
