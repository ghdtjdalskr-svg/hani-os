# 단독 실행 결과

- 명령: 각 파일에 대해 `node scripts/<파일명>.test.mjs`, cwd=`tool304`. 외부 preload/통합 `--test` 실행 없음.
- Node.js v24.20.0 / Windows PowerShell. 실제 입력 HEAD=cb1b937, origin/main은 작업 중 8a46ac7(v305)로 진행.
- 파일 단위 성공 187 / 기존 실패 28 / Git 미검증 33 / 환경 미검증 41 / 시간 제한 0.
- Git 미검증은 PASS가 아닙니다. 일부 Node subtest가 통과했더라도 Git 단언이 막힌 파일 전체를 별도 분류했습니다.
- Git EPERM 직후 기존 queen fallback의 `path.resolve(URL)`이 실패하는 경우도 Git 미검증입니다. 해당 평가 경로는 먼저 `error.code === EPERM`을 통과해야 합니다.
- Node 자식 프로세스도 독립 `spawnSync(node, ["--version"])`에서 status=null / EPERM을 확인했습니다.
- 기준 입력: local/baseline-identity.json. 기존 일반 실패는 UI 적용 전 Git 객체의 운영 메타데이터·CSS와 기존 scripts로 재실행해 실패 이름·오류를 대조했습니다. Git refs는 실제 저장소 참조를 유지했습니다.

## Git 미검증 (서윤 인계)

- `node scripts/hani-boardroom-voice-contract.test.mjs`
- `node scripts/hani-media-core.test.mjs`
- `node scripts/hani-meeting-character-voice.test.mjs`
- `node scripts/hani-meeting-engine-v2-batch1.test.mjs`
- `node scripts/hani-office-actions-216.test.mjs`
- `node scripts/hani-office-affinity-274-pins.test.mjs`
- `node scripts/hani-office-barista-night-273-pins.test.mjs`
- `node scripts/hani-office-bori-stroll.test.mjs`
- `node scripts/hani-office-cafe-rest.test.mjs`
- `node scripts/hani-office-chairman-234.test.mjs`
- `node scripts/hani-office-chairman-patrol-278-pins.test.mjs`
- `node scripts/hani-office-companion-homes.test.mjs`
- `node scripts/hani-office-companions-276-pins.test.mjs`
- `node scripts/hani-office-consult.test.mjs`
- `node scripts/hani-office-icons.test.mjs`
- `node scripts/hani-office-lively-v2.test.mjs`
- `node scripts/hani-office-mascot-label.test.mjs`
- `node scripts/hani-office-obr12.test.mjs`
- `node scripts/hani-office-obr14.test.mjs`
- `node scripts/hani-office-obr15.test.mjs`
- `node scripts/hani-office-obr21.test.mjs`
- `node scripts/hani-office-obr4.test.mjs`
- `node scripts/hani-office-obr6.test.mjs`
- `node scripts/hani-office-obr7.test.mjs`
- `node scripts/hani-office-obr8.test.mjs`
- `node scripts/hani-office-obr9.test.mjs`
- `node scripts/hani-office-pet-bori-272-pins.test.mjs`
- `node scripts/hani-office-pets-268-pins.test.mjs`
- `node scripts/hani-office-pets-bubble.test.mjs`
- `node scripts/hani-office-v2-215.test.mjs`
- `node scripts/hani-office-xmas-269-pins.test.mjs`
- `node scripts/hani-offline-transport-223.test.mjs`
- `node scripts/hani-protected-gate-integration.test.mjs`

## 전체 파일

| 파일 | 결과 | 근거 |
|---|---|---|
| `hani-access-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-ai-budget.test.mjs` | PASS | PASS / 실제 브라우저 미검증 |
| `hani-ai-budget-antigravity.test.mjs` | PASS | PASS |
| `hani-ai-budget-browser.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-ai-budget-plan.test.mjs` | PASS | PASS |
| `hani-ai-work-status.test.mjs` | PASS | PASS |
| `hani-asset-intake-v2-AB.test.mjs` | PASS | PASS |
| `hani-asset-intake-v2-C.test.mjs` | PASS | PASS |
| `hani-asset-intake-v2-ease.test.mjs` | PASS | PASS |
| `hani-audit-1.test.mjs` | PASS | PASS |
| `hani-backup-history-runtime.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-banners-203.test.mjs` | PASS | PASS |
| `hani-banners-203-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-board.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-board-203a.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-board-community.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-board-guard.test.mjs` | PASS | PASS |
| `hani-board-library.test.mjs` | PASS | PASS |
| `hani-board-living.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-board-november.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-board-relationship.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-boardroom-cross-review.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-boardroom-live-meeting.test.mjs` | PASS | PASS |
| `hani-boardroom-recovery.test.mjs` | PASS | PASS |
| `hani-boardroom-routing.test.mjs` | PASS | PASS |
| `hani-boardroom-voice-contract.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-board-views-211.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-board-vocative.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-brand-heroes-218.test.mjs` | PASS | PASS |
| `hani-building-206.test.mjs` | PASS | PASS |
| `hani-building-206-engine.test.mjs` | PASS | PASS |
| `hani-building-206-safety.test.mjs` | PASS | PASS |
| `hani-building-206-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-chart-toss-212.test.mjs` | PASS | PASS |
| `hani-chibi-pack-1.test.mjs` | PASS | PASS |
| `hani-chibi-pack-1-layers.test.mjs` | PASS | PASS |
| `hani-chibi-pack-1-release293.test.mjs` | PASS | PASS |
| `hani-chibi-pack-2.test.mjs` | PASS | PASS |
| `hani-chibi-pack-2-layers.test.mjs` | PASS | PASS |
| `hani-chibi-pack-3.test.mjs` | PASS | PASS |
| `hani-chibi-pack-3-layers.test.mjs` | PASS | PASS |
| `hani-cloud-conflict-choice.test.mjs` | PASS | PASS |
| `hani-cloud-egress-save-sim.test.mjs` | PASS | PASS |
| `hani-cloud-egress-sync.test.mjs` | PASS | PASS |
| `hani-cloud-first.test.mjs` | PASS | PASS |
| `hani-cloud-stability-runtime.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-context-remote.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (AssertionError [ERR_ASSERTION]: The input did not match the regular expression /\[data-remote-action="current"\]\{--remo) |
| `hani-context-remote-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-dark-bundle-layer.test.mjs` | PASS | PASS |
| `hani-dash-217.test.mjs` | PASS | PASS |
| `hani-dash-218.test.mjs` | PASS | PASS (내부 skip 1개) |
| `hani-dashboard-period.test.mjs` | PASS | PASS |
| `hani-dashboard-period-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-design-polish-1.test.mjs` | PASS | PASS |
| `hani-design-polish-1-contrast.test.mjs` | PASS | PASS |
| `hani-design-polish-1-main295.test.mjs` | PASS | PASS |
| `hani-design-polish-2.test.mjs` | PASS | PASS |
| `hani-design-polish-2-main297.test.mjs` | PASS | PASS |
| `hani-desk-mascots.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (기존 정적 계약 불일치) |
| `hani-dev-report-generate.test.mjs` | PASS | PASS |
| `hani-drive-vault.test.mjs` | PASS | PASS |
| `hani-drive-vault-precheck.test.mjs` | 환경 미검증 | Node 자식 프로세스 EPERM, CLI status=null |
| `hani-duplicate-id-guard.test.mjs` | PASS | PASS |
| `hani-egress-fix.test.mjs` | PASS | PASS |
| `hani-exam-popup-214.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: renderChibiNote is not defined) |
| `hani-final-review.test.mjs` | PASS | PASS |
| `hani-fix-208.test.mjs` | PASS | PASS |
| `hani-fix-208-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-fixes-213-market.test.mjs` | PASS | PASS |
| `hani-fixes-213-oauth.test.mjs` | PASS | PASS |
| `hani-fun-chat-fortune.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (✖ real pools: 30 complete conversations, 60 unique positive cards, public voices only (2.1678ms)) |
| `hani-fun-top3.test.mjs` | PASS | PASS |
| `hani-gemini-reports-build.test.mjs` | PASS | PASS |
| `hani-goal-media-budget.test.mjs` | PASS | PASS |
| `hani-goal-media-budget-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-goal-period.test.mjs` | PASS | PASS |
| `hani-goal-period-view.test.mjs` | PASS | PASS |
| `hani-goal-progress-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-google-drive-212.test.mjs` | PASS | PASS |
| `hani-google-drive-212-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-hana-intake-224.test.mjs` | PASS | PASS |
| `hani-helper-275-pins.test.mjs` | PASS | PASS |
| `hani-helper-bot.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (✖ KST midnight, deterministic fair 23-day rotation, 19 staff + 4 separated pets (0.7696ms)) |
| `hani-helper-toggle.test.mjs` | PASS | PASS |
| `hani-hero-cast-218.test.mjs` | PASS | PASS |
| `hani-hero-restore.test.mjs` | PASS | PASS |
| `hani-history-226.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-history-coverage.test.mjs` | PASS | PASS |
| `hani-history-unify.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (✖ shared loader shape failure keeps legacy data, shows a short notice, and caches the failed request (1.4605ms)) |
| `hani-ieum-seat.test.mjs` | PASS | PASS |
| `hani-ieum-seat-history.test.mjs` | PASS | PASS |
| `hani-ieum-seat-layer.test.mjs` | PASS | PASS |
| `hani-ilbo-213.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-ilbo-banner-215.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-investment-research-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-invest-split.test.mjs` | PASS | PASS |
| `hani-invest-split-safety.test.mjs` | PASS | PASS |
| `hani-invest-split-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-join-ieum.test.mjs` | PASS | PASS |
| `hani-kiwoom-code-224.test.mjs` | PASS | PASS |
| `hani-launch-greeting-221.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-launch-greeting-221-unit.test.mjs` | PASS | PASS |
| `hani-learning-quiz-quality.test.mjs` | PASS | PASS |
| `hani-learning-quiz-v04.test.mjs` | PASS | PASS |
| `hani-life-bundle-source.test.mjs` | PASS | PASS |
| `hani-login-a-204.test.mjs` | PASS | PASS |
| `hani-login-a-204-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-login-session-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-lounge-216.test.mjs` | PASS | PASS |
| `hani-lounge-ai-213.test.mjs` | PASS | PASS |
| `hani-lounge-billboard.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (  ReferenceError: syncThemeCollections is not defined) |
| `hani-lounge-fun-211.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-lounge-natural-211.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-lounge-qa-212.test.mjs` | PASS | PASS |
| `hani-lounge-queen-v3.test.mjs` | PASS | PASS |
| `hani-m9-link.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (✖ exact inverse restores every base byte and rejects unrelated edits (13.8417ms)) |
| `hani-m9-polish.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (✖ exact polish inverse round-trips all bytes and rejects unrelated, partial and duplicate changes (2.452ms)) |
| `hani-mascots-poster.test.mjs` | PASS | PASS |
| `hani-media-c-controls.test.mjs` | PASS | PASS |
| `hani-media-core.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-meeting-character-voice.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-meeting-engine-v2-batch1.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-meeting-engine-v2-client.test.mjs` | PASS | PASS |
| `hani-milestones-grade-ui.test.mjs` | PASS | PASS |
| `hani-milestones-v1.test.mjs` | PASS | PASS / 실제 브라우저 미검증 |
| `hani-mission-203a.test.mjs` | PASS | PASS |
| `hani-monthly-report-design-212.test.mjs` | PASS | PASS / 실제 브라우저 미검증 |
| `hani-nav-groups.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (AssertionError [ERR_ASSERTION]: procrastination speaker coverage) |
| `hani-navigation-state-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-navlogin.test.mjs` | PASS | PASS |
| `hani-navlogin-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-newface-217.test.mjs` | PASS | PASS |
| `hani-newsroom-285-source.test.mjs` | PASS | PASS |
| `hani-newsroom-4cut-230.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-newsroom-4cut-288.test.mjs` | PASS | PASS |
| `hani-newsroom-persona.test.mjs` | PASS | PASS |
| `hani-newstaff-215.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:) |
| `hani-ocr-accuracy-224.test.mjs` | PASS | PASS (내부 skip 1개) |
| `hani-office-219.test.mjs` | PASS | PASS / 실제 브라우저 미검증 |
| `hani-office-actions-216.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-actions-221.test.mjs` | PASS | PASS |
| `hani-office-affinity.test.mjs` | PASS | PASS |
| `hani-office-affinity-274-pins.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-affinity-cap.test.mjs` | PASS | PASS |
| `hani-office-affinity-storage.test.mjs` | PASS | PASS |
| `hani-office-barista.test.mjs` | PASS | PASS |
| `hani-office-barista-night.test.mjs` | PASS | PASS |
| `hani-office-barista-night-273-pins.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-behavior.test.mjs` | PASS | PASS |
| `hani-office-bori-m9.test.mjs` | PASS | PASS |
| `hani-office-bori-stroll.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-bubble-close.test.mjs` | PASS | PASS |
| `hani-office-cafe-rest.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-chairman-234.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-chairman-patrol.test.mjs` | PASS | PASS |
| `hani-office-chairman-patrol-278-pins.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-companion-homes.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-companions.test.mjs` | PASS | PASS |
| `hani-office-companions-276-pins.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-consult.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-crowded-labels.test.mjs` | PASS | PASS |
| `hani-office-drama.test.mjs` | PASS | PASS |
| `hani-office-fix-218.test.mjs` | PASS | PASS |
| `hani-office-floor-bubble.test.mjs` | PASS | PASS |
| `hani-office-hd-224.test.mjs` | PASS | PASS / 실제 브라우저 미검증 |
| `hani-office-icons.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-kids-286-source.test.mjs` | PASS | PASS |
| `hani-office-kids-lively.test.mjs` | PASS | PASS |
| `hani-office-kids-merge.test.mjs` | PASS | PASS |
| `hani-office-kids-pose-b.test.mjs` | PASS | PASS |
| `hani-office-kids-visit.test.mjs` | PASS | PASS |
| `hani-office-kids-weekday.test.mjs` | PASS | PASS |
| `hani-office-labels-qa.test.mjs` | PASS | PASS |
| `hani-office-lively.test.mjs` | PASS | PASS |
| `hani-office-lively-v2.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-mascot-label.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-motion-1.test.mjs` | PASS | PASS |
| `hani-office-motion-2.test.mjs` | PASS | PASS |
| `hani-office-obr10.test.mjs` | PASS | PASS |
| `hani-office-obr12.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-obr14.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-obr15.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-obr16.test.mjs` | PASS | PASS |
| `hani-office-obr17.test.mjs` | PASS | PASS |
| `hani-office-obr18.test.mjs` | PASS | PASS |
| `hani-office-obr19.test.mjs` | PASS | PASS |
| `hani-office-obr21.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-obr3.test.mjs` | PASS | PASS |
| `hani-office-obr4.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-obr6.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-obr7.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-obr8.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-obr9.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-pet-bori.test.mjs` | PASS | PASS |
| `hani-office-pet-bori-272-pins.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-pets-268-pins.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-pets-bubble.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-props.test.mjs` | PASS | PASS |
| `hani-office-release-projection.test.mjs` | PASS | PASS |
| `hani-office-residents.test.mjs` | PASS | PASS |
| `hani-office-seats-215.test.mjs` | PASS | PASS |
| `hani-office-snack.test.mjs` | PASS | PASS |
| `hani-office-staff-chat.test.mjs` | PASS | PASS |
| `hani-office-tap-lines.test.mjs` | PASS | PASS |
| `hani-office-tlayout.test.mjs` | PASS | PASS |
| `hani-office-top-labels.test.mjs` | PASS | PASS |
| `hani-office-v2-215.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-visitors-cafe.test.mjs` | PASS | PASS |
| `hani-office-xmas.test.mjs` | PASS | PASS |
| `hani-office-xmas-269-pins.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-office-zoom.test.mjs` | PASS | PASS (내부 skip 1개) |
| `hani-offline-entry-223.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-offline-transport-223.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-one-pass-protected-surface.test.mjs` | PASS | PASS |
| `hani-owner-verification-diagnostic.test.mjs` | PASS | PASS |
| `hani-owner-verification-runtime.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-owner-verification-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-pb-chibitoon.test.mjs` | PASS | PASS |
| `hani-photo-backup-222.test.mjs` | PASS | PASS / 실제 브라우저 미검증 |
| `hani-polish-205-safety.test.mjs` | PASS | PASS |
| `hani-polish-215.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-post-audit-investment.test.mjs` | PASS | PASS |
| `hani-proactive-204.test.mjs` | PASS | PASS |
| `hani-proactive-204-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-proactive-care-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-procrastination-board.test.mjs` | PASS | PASS |
| `hani-protected-gate-integration.test.mjs` | Git 미검증 | Git EPERM: 서윤 재실행 필요 |
| `hani-protected-write-contract.test.mjs` | PASS | PASS |
| `hani-pwa-213.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-pwa-release-paths.test.mjs` | PASS | PASS |
| `hani-qa-1st-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-qa-210.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-qa-210-followup.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (ReferenceError: syncThemeCollections is not defined) |
| `hani-qa-design-b4.test.mjs` | PASS | PASS |
| `hani-qa-easy-cleanup.test.mjs` | PASS | PASS |
| `hani-qa-report-fixes.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (  ReferenceError: renderChibiNote is not defined) |
| `hani-quality-data-runtime.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-quiz-autogen-216.test.mjs` | PASS | PASS |
| `hani-quiz-quality-210.test.mjs` | PASS | PASS |
| `hani-relationship-seed-build.test.mjs` | PASS | PASS |
| `hani-release-294.test.mjs` | PASS | PASS |
| `hani-release-295.test.mjs` | PASS | PASS |
| `hani-release-296.test.mjs` | PASS | PASS |
| `hani-release-297.test.mjs` | PASS | PASS |
| `hani-release-298.test.mjs` | PASS | PASS |
| `hani-release-299.test.mjs` | PASS | PASS |
| `hani-release-300.test.mjs` | PASS | PASS |
| `hani-release-301.test.mjs` | PASS | PASS |
| `hani-release-302.test.mjs` | PASS | PASS |
| `hani-release-303.test.mjs` | PASS | PASS |
| `hani-release-304.test.mjs` | PASS | PASS |
| `hani-release-version-layers.test.mjs` | PASS | PASS |
| `hani-remote-card-224.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-remote-media-219.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-report-common.test.mjs` | PASS | PASS |
| `hani-report-common-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-review-compact-212.test.mjs` | PASS | PASS |
| `hani-reviewed-release-baseline.test.mjs` | PASS | PASS |
| `hani-runtime-closure-ilbo.test.mjs` | PASS | PASS |
| `hani-save-guard.test.mjs` | PASS | PASS |
| `hani-second-opinion.test.mjs` | PASS | PASS |
| `hani-second-opinion-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-seoyun-m9.test.mjs` | PASS | PASS |
| `hani-server-owner-access.test.mjs` | PASS | PASS |
| `hani-server-owner-guard.test.mjs` | PASS | PASS |
| `hani-settings-225.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (AssertionError [ERR_ASSERTION]: train version cannot roll back) |
| `hani-settings-225-qa-guard.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (✖ settings QA guard retains original handlers and executes memory-only approval and failure paths (1127.8328ms)) |
| `hani-simplify-225.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (AssertionError [ERR_ASSERTION]: train version cannot roll back) |
| `hani-sports-sync-contract.test.mjs` | PASS | PASS |
| `hani-staff-floors-214.test.mjs` | PASS | PASS (내부 skip 1개) |
| `hani-stale39-source.test.mjs` | PASS | PASS |
| `hani-street-journal-closure.test.mjs` | PASS | PASS |
| `hani-study-retry.test.mjs` | PASS | PASS |
| `hani-study-tutor-215.test.mjs` | PASS | PASS |
| `hani-tasks-qa-212.test.mjs` | PASS | PASS (내부 skip 1개) |
| `hani-theme-dark-fix.test.mjs` | PASS | PASS |
| `hani-theme-thaw.test.mjs` | PASS | PASS |
| `hani-theme-thaw-source.test.mjs` | PASS | PASS |
| `hani-theme-white-215.test.mjs` | 기존 FAIL | 09ba997 대조: 동일 실패 (AssertionError [ERR_ASSERTION]: train version cannot roll back) |
| `hani-toss-intake-224.test.mjs` | PASS | PASS |
| `hani-transaction-date.test.mjs` | PASS | PASS |
| `hani-transaction-runtime.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-ui-203b.test.mjs` | PASS | PASS |
| `hani-ui-203b-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |
| `hani-ui-polish-1.test.mjs` | PASS | PASS |
| `hani-ui-polish-1-layer.test.mjs` | PASS | PASS |
| `hani-ui-polish-three.test.mjs` | PASS | PASS |
| `hani-wishlist-quick-add.test.mjs` | PASS | PASS |
| `hani-yuna-schedule-ui.test.mjs` | 환경 미검증 | 브라우저 실행 EPERM / 의존성·실행 인자 미제공 (local 로그 참조) |

원문 stdout/stderr·시각·exit·부분 subtest 수·재시도는 `.gitignore`된 `local/` 안에 보존했습니다.
