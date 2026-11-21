# Phase 2 · 단독 시험 결과

각 파일을 별도 Node 프로세스로 실행. 293개 명령: PASS 191 / 기존 FAIL 30 / 미검증 72. 미제공 브라우저 인자·전체 skip도 미검증으로 보수 분류했다. 실패는 독립 Phase 1 Git 입력과 첫 오류·실패 검사명을 대조했다.

| 파일 | 결과 | 통과/실패 단언 | 근거 |
| --- | --- | --- | --- |
| hani-access-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-ai-budget-antigravity.test.mjs | PASS | 0/0 |  |
| hani-ai-budget-browser.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-ai-budget-plan.test.mjs | PASS | 0/0 |  |
| hani-ai-budget.test.mjs | PASS | 0/0 |  |
| hani-ai-work-status.test.mjs | PASS | 0/0 |  |
| hani-asset-intake-v2-AB.test.mjs | PASS | 9/0 |  |
| hani-asset-intake-v2-C.test.mjs | PASS | 13/0 |  |
| hani-asset-intake-v2-ease.test.mjs | PASS | 6/0 |  |
| hani-audit-1.test.mjs | PASS | 14/0 |  |
| hani-backup-history-runtime.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-banners-203-ui.test.mjs | UNVERIFIED | 0/0 | EPERM |
| hani-banners-203.test.mjs | PASS | 0/0 |  |
| hani-board-203a.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-board-community.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-board-guard.test.mjs | PASS | 0/0 |  |
| hani-board-library.test.mjs | PASS | 0/0 |  |
| hani-board-living.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-board-november.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-board-relationship.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-board-views-211.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-board-vocative.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-board.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-boardroom-cross-review.test.mjs | UNVERIFIED | 0/0 | EPERM |
| hani-boardroom-live-meeting.test.mjs | PASS | 0/0 |  |
| hani-boardroom-recovery.test.mjs | PASS | 0/0 |  |
| hani-boardroom-routing.test.mjs | PASS | 0/0 |  |
| hani-boardroom-voice-contract.test.mjs | UNVERIFIED | 0/0 | Git EPERM / existing Git adapter |
| hani-brand-heroes-218.test.mjs | PASS | 3/0 |  |
| hani-building-206-engine.test.mjs | PASS | 6/0 |  |
| hani-building-206-safety.test.mjs | PASS | 0/0 |  |
| hani-building-206-ui.test.mjs | UNVERIFIED | 0/0 | all assertions skipped |
| hani-building-206.test.mjs | PASS | 21/0 |  |
| hani-building-phase1.test.mjs | PASS | 10/0 |  |
| hani-building-phase2.test.mjs | PASS | 14/0 |  |
| hani-chart-toss-212.test.mjs | PASS | 0/0 |  |
| hani-chibi-pack-1-layers.test.mjs | PASS | 6/0 |  |
| hani-chibi-pack-1-release293.test.mjs | PASS | 3/0 |  |
| hani-chibi-pack-1.test.mjs | PASS | 10/0 |  |
| hani-chibi-pack-2-layers.test.mjs | PASS | 2/0 |  |
| hani-chibi-pack-2.test.mjs | PASS | 7/0 |  |
| hani-chibi-pack-3-layers.test.mjs | PASS | 3/0 |  |
| hani-chibi-pack-3.test.mjs | PASS | 9/0 |  |
| hani-cloud-conflict-choice.test.mjs | PASS | 0/0 |  |
| hani-cloud-egress-save-sim.test.mjs | PASS | 0/0 |  |
| hani-cloud-egress-sync.test.mjs | PASS | 0/0 |  |
| hani-cloud-first.test.mjs | PASS | 0/0 |  |
| hani-cloud-stability-runtime.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-context-remote-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-context-remote.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-dark-bundle-layer.test.mjs | PASS | 9/0 |  |
| hani-dash-217.test.mjs | PASS | 0/0 |  |
| hani-dash-218.test.mjs | PASS | 3/0 |  |
| hani-dashboard-period-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-dashboard-period.test.mjs | PASS | 0/0 |  |
| hani-design-polish-1-contrast.test.mjs | PASS | 4/0 |  |
| hani-design-polish-1-main295.test.mjs | PASS | 4/0 |  |
| hani-design-polish-1.test.mjs | PASS | 6/0 |  |
| hani-design-polish-2-main297.test.mjs | PASS | 4/0 |  |
| hani-design-polish-2.test.mjs | PASS | 8/0 |  |
| hani-desk-mascots.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-dev-report-generate.test.mjs | PASS | 0/0 |  |
| hani-drive-vault-precheck.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-drive-vault.test.mjs | PASS | 0/0 |  |
| hani-duplicate-id-guard.test.mjs | PASS | 2/0 |  |
| hani-egress-fix.test.mjs | PASS | 0/0 |  |
| hani-exam-popup-214.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-final-review.test.mjs | PASS | 5/0 |  |
| hani-fix-208-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-fix-208.test.mjs | PASS | 7/0 |  |
| hani-fixes-213-market.test.mjs | PASS | 8/0 |  |
| hani-fixes-213-oauth.test.mjs | PASS | 7/0 |  |
| hani-fun-chat-fortune.test.mjs | FAIL | 3/2 | independent Phase 1 input: same first error and failing names |
| hani-fun-top3.test.mjs | PASS | 0/0 |  |
| hani-gemini-reports-build.test.mjs | PASS | 0/0 |  |
| hani-goal-media-budget-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-goal-media-budget.test.mjs | PASS | 3/0 |  |
| hani-goal-period-view.test.mjs | PASS | 4/0 |  |
| hani-goal-period.test.mjs | PASS | 20/0 |  |
| hani-goal-progress-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-google-drive-212-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-google-drive-212.test.mjs | PASS | 11/0 |  |
| hani-hana-intake-224.test.mjs | PASS | 15/0 |  |
| hani-helper-275-pins.test.mjs | PASS | 4/0 |  |
| hani-helper-bot.test.mjs | FAIL | 25/4 | independent Phase 1 input: same first error and failing names |
| hani-helper-toggle.test.mjs | PASS | 8/0 |  |
| hani-hero-cast-218.test.mjs | PASS | 0/0 |  |
| hani-hero-restore.test.mjs | PASS | 4/0 |  |
| hani-history-226.test.mjs | UNVERIFIED | 0/0 | EPERM |
| hani-history-coverage.test.mjs | PASS | 0/0 |  |
| hani-history-unify.test.mjs | FAIL | 13/1 | independent Phase 1 input: same first error and failing names |
| hani-ieum-seat-history.test.mjs | PASS | 2/0 |  |
| hani-ieum-seat-layer.test.mjs | PASS | 4/0 |  |
| hani-ieum-seat.test.mjs | PASS | 5/0 |  |
| hani-ilbo-213.test.mjs | UNVERIFIED | 0/0 | EPERM |
| hani-ilbo-banner-215.test.mjs | UNVERIFIED | 0/0 | EPERM |
| hani-invest-split-safety.test.mjs | PASS | 0/0 |  |
| hani-invest-split-ui.test.mjs | UNVERIFIED | 0/0 | browser CLI arguments unavailable |
| hani-invest-split.test.mjs | PASS | 0/0 |  |
| hani-investment-research-ui.test.mjs | UNVERIFIED | 0/0 | browser CLI arguments unavailable |
| hani-join-ieum.test.mjs | PASS | 17/0 |  |
| hani-kiwoom-code-224.test.mjs | PASS | 10/0 |  |
| hani-launch-greeting-221-unit.test.mjs | PASS | 36/0 |  |
| hani-launch-greeting-221.test.mjs | UNVERIFIED | 0/0 | EPERM |
| hani-learning-quiz-quality.test.mjs | PASS | 13/0 |  |
| hani-learning-quiz-v04.test.mjs | PASS | 0/0 |  |
| hani-life-bundle-source.test.mjs | PASS | 5/0 |  |
| hani-login-a-204-ui.test.mjs | UNVERIFIED | 0/0 | browser CLI arguments unavailable |
| hani-login-a-204.test.mjs | PASS | 0/0 |  |
| hani-login-session-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-lounge-216.test.mjs | PASS | 6/0 |  |
| hani-lounge-ai-213.test.mjs | PASS | 12/0 |  |
| hani-lounge-billboard.test.mjs | FAIL | 21/6 | independent Phase 1 input: same first error and failing names |
| hani-lounge-fun-211.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-lounge-natural-211.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-lounge-qa-212.test.mjs | PASS | 3/0 |  |
| hani-lounge-queen-v3.test.mjs | PASS | 24/0 |  |
| hani-m9-link.test.mjs | FAIL | 7/3 | independent Phase 1 input: same first error and failing names |
| hani-m9-polish.test.mjs | FAIL | 0/2 | independent Phase 1 input: same first error and failing names |
| hani-mascots-poster.test.mjs | PASS | 22/0 |  |
| hani-media-c-controls.test.mjs | PASS | 0/0 |  |
| hani-media-core.test.mjs | UNVERIFIED | 0/0 | Git EPERM / existing Git adapter |
| hani-meeting-character-voice.test.mjs | UNVERIFIED | 0/0 | Git EPERM / existing Git adapter |
| hani-meeting-engine-v2-batch1.test.mjs | UNVERIFIED | 0/0 | Git EPERM / existing Git adapter |
| hani-meeting-engine-v2-client.test.mjs | PASS | 0/0 |  |
| hani-milestones-grade-ui.test.mjs | PASS | 0/0 |  |
| hani-milestones-v1.test.mjs | PASS | 0/0 |  |
| hani-mission-203a.test.mjs | PASS | 0/0 |  |
| hani-monthly-report-design-212.test.mjs | PASS | 0/0 |  |
| hani-nav-groups.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-navigation-state-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-navlogin-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-navlogin.test.mjs | PASS | 0/0 |  |
| hani-newface-217.test.mjs | PASS | 0/0 |  |
| hani-newsroom-285-source.test.mjs | PASS | 2/0 |  |
| hani-newsroom-4cut-230.test.mjs | UNVERIFIED | 8/1 | EPERM |
| hani-newsroom-4cut-288.test.mjs | PASS | 7/0 |  |
| hani-newsroom-persona.test.mjs | PASS | 4/0 |  |
| hani-newstaff-215.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-ocr-accuracy-224.test.mjs | PASS | 14/0 |  |
| hani-office-219.test.mjs | PASS | 6/0 |  |
| hani-office-actions-216.test.mjs | UNVERIFIED | 14/1 | Git EPERM / existing Git adapter |
| hani-office-actions-221.test.mjs | PASS | 20/0 |  |
| hani-office-affinity-274-pins.test.mjs | UNVERIFIED | 2/1 | Git EPERM / existing Git adapter |
| hani-office-affinity-cap.test.mjs | PASS | 19/0 |  |
| hani-office-affinity-storage.test.mjs | PASS | 3/0 |  |
| hani-office-affinity.test.mjs | PASS | 21/0 |  |
| hani-office-barista-night-273-pins.test.mjs | UNVERIFIED | 4/1 | Git EPERM / existing Git adapter |
| hani-office-barista-night.test.mjs | PASS | 13/0 |  |
| hani-office-barista.test.mjs | PASS | 10/0 |  |
| hani-office-behavior.test.mjs | PASS | 10/0 |  |
| hani-office-bori-m9.test.mjs | PASS | 2/0 |  |
| hani-office-bori-stroll.test.mjs | UNVERIFIED | 13/1 | Git EPERM / existing Git adapter |
| hani-office-bubble-close.test.mjs | PASS | 17/0 |  |
| hani-office-cafe-rest.test.mjs | UNVERIFIED | 2/2 | Git EPERM / existing Git adapter |
| hani-office-chairman-234.test.mjs | UNVERIFIED | 0/0 | Git EPERM / existing Git adapter |
| hani-office-chairman-patrol-278-pins.test.mjs | UNVERIFIED | 6/6 | Git EPERM / existing Git adapter |
| hani-office-chairman-patrol.test.mjs | PASS | 15/0 |  |
| hani-office-companion-homes.test.mjs | UNVERIFIED | 15/1 | Git EPERM / existing Git adapter |
| hani-office-companions-276-pins.test.mjs | UNVERIFIED | 2/1 | Git EPERM / existing Git adapter |
| hani-office-companions.test.mjs | PASS | 17/0 |  |
| hani-office-consult.test.mjs | UNVERIFIED | 19/1 | Git EPERM / existing Git adapter |
| hani-office-crowded-labels.test.mjs | PASS | 19/0 |  |
| hani-office-drama.test.mjs | PASS | 20/0 |  |
| hani-office-fix-218.test.mjs | PASS | 6/0 |  |
| hani-office-floor-bubble.test.mjs | PASS | 21/0 |  |
| hani-office-hd-224.test.mjs | PASS | 10/0 |  |
| hani-office-icons.test.mjs | UNVERIFIED | 14/1 | Git EPERM / existing Git adapter |
| hani-office-kids-286-source.test.mjs | PASS | 3/0 |  |
| hani-office-kids-lively.test.mjs | PASS | 15/0 |  |
| hani-office-kids-merge.test.mjs | PASS | 10/0 |  |
| hani-office-kids-pose-b.test.mjs | PASS | 13/0 |  |
| hani-office-kids-visit.test.mjs | PASS | 16/0 |  |
| hani-office-kids-weekday.test.mjs | PASS | 19/0 |  |
| hani-office-labels-qa.test.mjs | PASS | 17/0 |  |
| hani-office-lively-v2.test.mjs | UNVERIFIED | 6/2 | Git EPERM / existing Git adapter |
| hani-office-lively.test.mjs | PASS | 13/0 |  |
| hani-office-mascot-label.test.mjs | UNVERIFIED | 9/1 | Git EPERM / existing Git adapter |
| hani-office-motion-1.test.mjs | PASS | 16/0 |  |
| hani-office-motion-2.test.mjs | PASS | 24/0 |  |
| hani-office-motion-polish-2.test.mjs | PASS | 10/0 |  |
| hani-office-obr10.test.mjs | PASS | 4/0 |  |
| hani-office-obr12.test.mjs | UNVERIFIED | 0/0 | Git EPERM / existing Git adapter |
| hani-office-obr14.test.mjs | UNVERIFIED | 4/1 | Git EPERM / existing Git adapter |
| hani-office-obr15.test.mjs | UNVERIFIED | 13/1 | Git EPERM / existing Git adapter |
| hani-office-obr16.test.mjs | PASS | 12/0 |  |
| hani-office-obr17.test.mjs | PASS | 3/0 |  |
| hani-office-obr18.test.mjs | PASS | 12/0 |  |
| hani-office-obr19.test.mjs | PASS | 3/0 |  |
| hani-office-obr21.test.mjs | UNVERIFIED | 4/2 | Git EPERM / existing Git adapter |
| hani-office-obr3.test.mjs | PASS | 5/0 |  |
| hani-office-obr4.test.mjs | UNVERIFIED | 8/2 | Git EPERM / existing Git adapter |
| hani-office-obr6.test.mjs | UNVERIFIED | 0/0 | Git EPERM / existing Git adapter |
| hani-office-obr7.test.mjs | UNVERIFIED | 0/0 | Git EPERM / existing Git adapter |
| hani-office-obr8.test.mjs | UNVERIFIED | 2/1 | Git EPERM / existing Git adapter |
| hani-office-obr9.test.mjs | UNVERIFIED | 0/0 | Git EPERM / existing Git adapter |
| hani-office-pet-bori-272-pins.test.mjs | UNVERIFIED | 3/1 | Git EPERM / existing Git adapter |
| hani-office-pet-bori.test.mjs | PASS | 14/0 |  |
| hani-office-pets-268-pins.test.mjs | UNVERIFIED | 0/1 | Git EPERM / existing Git adapter |
| hani-office-pets-bubble.test.mjs | UNVERIFIED | 21/1 | Git EPERM / existing Git adapter |
| hani-office-props.test.mjs | PASS | 11/0 |  |
| hani-office-release-projection.test.mjs | PASS | 2/0 |  |
| hani-office-residents.test.mjs | PASS | 49/0 |  |
| hani-office-seats-215.test.mjs | PASS | 12/0 |  |
| hani-office-snack.test.mjs | PASS | 26/0 |  |
| hani-office-staff-chat.test.mjs | PASS | 17/0 |  |
| hani-office-tap-lines.test.mjs | PASS | 15/0 |  |
| hani-office-tlayout.test.mjs | PASS | 13/0 |  |
| hani-office-top-labels.test.mjs | PASS | 7/0 |  |
| hani-office-v2-215.test.mjs | UNVERIFIED | 17/1 | Git EPERM / existing Git adapter |
| hani-office-visitors-cafe.test.mjs | PASS | 5/0 |  |
| hani-office-xmas-269-pins.test.mjs | UNVERIFIED | 1/1 | Git EPERM / existing Git adapter |
| hani-office-xmas.test.mjs | PASS | 13/0 |  |
| hani-office-zoom.test.mjs | PASS | 12/0 |  |
| hani-offline-entry-223.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-offline-transport-223.test.mjs | UNVERIFIED | 0/0 | Git EPERM / existing Git adapter |
| hani-one-pass-protected-surface.test.mjs | PASS | 0/0 |  |
| hani-owner-verification-diagnostic.test.mjs | PASS | 0/0 |  |
| hani-owner-verification-runtime.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-owner-verification-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-pb-chibitoon.test.mjs | PASS | 5/0 |  |
| hani-photo-backup-222.test.mjs | PASS | 0/0 |  |
| hani-polish-205-safety.test.mjs | PASS | 0/0 |  |
| hani-polish-215.test.mjs | UNVERIFIED | 0/0 | EPERM |
| hani-post-audit-investment.test.mjs | PASS | 0/0 |  |
| hani-proactive-204-ui.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-proactive-204.test.mjs | PASS | 21/0 |  |
| hani-proactive-care-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-procrastination-board.test.mjs | PASS | 6/0 |  |
| hani-protected-gate-integration.test.mjs | UNVERIFIED | 0/0 | Git EPERM / existing Git adapter |
| hani-protected-write-contract.test.mjs | PASS | 0/0 |  |
| hani-pwa-213.test.mjs | UNVERIFIED | 0/0 | module unavailable |
| hani-pwa-release-paths.test.mjs | PASS | 0/0 |  |
| hani-qa-1st-ui.test.mjs | UNVERIFIED | 0/0 | browser CLI arguments unavailable |
| hani-qa-210-followup.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-qa-210.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-qa-design-b4.test.mjs | PASS | 24/0 |  |
| hani-qa-easy-cleanup.test.mjs | PASS | 12/0 |  |
| hani-qa-report-fixes.test.mjs | FAIL | 1/9 | independent Phase 1 input: same first error and failing names |
| hani-quality-data-runtime.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-quiz-autogen-216.test.mjs | PASS | 8/0 |  |
| hani-quiz-quality-210.test.mjs | PASS | 16/0 |  |
| hani-relationship-seed-build.test.mjs | PASS | 0/0 |  |
| hani-release-294.test.mjs | PASS | 2/0 |  |
| hani-release-295.test.mjs | PASS | 4/0 |  |
| hani-release-296.test.mjs | PASS | 5/0 |  |
| hani-release-297.test.mjs | PASS | 6/0 |  |
| hani-release-298.test.mjs | PASS | 7/0 |  |
| hani-release-299.test.mjs | PASS | 7/0 |  |
| hani-release-300.test.mjs | PASS | 10/0 |  |
| hani-release-301.test.mjs | PASS | 7/0 |  |
| hani-release-302.test.mjs | PASS | 8/0 |  |
| hani-release-303.test.mjs | PASS | 8/0 |  |
| hani-release-304.test.mjs | PASS | 7/0 |  |
| hani-release-305.test.mjs | PASS | 8/0 |  |
| hani-release-version-layers.test.mjs | PASS | 11/0 |  |
| hani-remote-card-224.test.mjs | UNVERIFIED | 0/0 | EPERM |
| hani-remote-media-219.test.mjs | UNVERIFIED | 0/0 | EPERM |
| hani-report-common-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-report-common.test.mjs | PASS | 4/0 |  |
| hani-review-compact-212.test.mjs | PASS | 3/0 |  |
| hani-reviewed-release-baseline.test.mjs | PASS | 18/0 |  |
| hani-runtime-closure-ilbo.test.mjs | PASS | 3/0 |  |
| hani-save-guard.test.mjs | PASS | 10/0 |  |
| hani-second-opinion-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-second-opinion.test.mjs | PASS | 18/0 |  |
| hani-seoyun-m9.test.mjs | PASS | 15/0 |  |
| hani-server-owner-access.test.mjs | PASS | 0/0 |  |
| hani-server-owner-guard.test.mjs | PASS | 13/0 |  |
| hani-settings-225-qa-guard.test.mjs | FAIL | 1/2 | independent Phase 1 input: same first error and failing names |
| hani-settings-225.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-simplify-225.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-sports-sync-contract.test.mjs | PASS | 0/0 |  |
| hani-staff-floors-214.test.mjs | PASS | 10/0 |  |
| hani-stale39-source.test.mjs | PASS | 4/0 |  |
| hani-street-journal-closure.test.mjs | PASS | 1/0 |  |
| hani-study-retry.test.mjs | PASS | 26/0 |  |
| hani-study-tutor-215.test.mjs | PASS | 3/0 |  |
| hani-tasks-qa-212.test.mjs | PASS | 7/0 |  |
| hani-theme-dark-fix.test.mjs | PASS | 7/0 |  |
| hani-theme-thaw-source.test.mjs | PASS | 4/0 |  |
| hani-theme-thaw.test.mjs | PASS | 13/0 |  |
| hani-theme-white-215.test.mjs | FAIL | 0/0 | independent Phase 1 input: same first error and failing names |
| hani-toss-intake-224.test.mjs | PASS | 10/0 |  |
| hani-transaction-date.test.mjs | PASS | 0/0 |  |
| hani-transaction-runtime.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
| hani-ui-203b-ui.test.mjs | UNVERIFIED | 0/0 | EPERM |
| hani-ui-203b.test.mjs | PASS | 0/0 |  |
| hani-ui-polish-1-layer.test.mjs | PASS | 6/0 |  |
| hani-ui-polish-1.test.mjs | PASS | 4/0 |  |
| hani-ui-polish-three.test.mjs | PASS | 3/0 |  |
| hani-wishlist-quick-add.test.mjs | PASS | 7/0 |  |
| hani-yuna-schedule-ui.test.mjs | UNVERIFIED | 0/0 | existing URL/path adapter |
