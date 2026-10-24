# obr11 — 2.9.233 열차 최종 점검

2026-10-24 KST · 도연 / Codex 단독 · A·B·C·D 점검 완료, **전체 Release PASS 판정 아님**.

열차 \HANI_OS_DEV_CLAUDE\obr / `hani/release-train-20261023` / HEAD `1147062df22061d49f4ca72fe8a1b78adc789b4d` + 본사 안전 테스트 1개 수정. 비교 main은 지정된 로컬 `origin/main d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf`이다. main233은 해당 SHA의 별도 detached worktree다. 원격 GitHub 조회는 프록시 연결 실패로 최신성 미확인이다. 로컬 main 표시 2.9.232, 마지막 UI JS는 hani-ui-v02992.js, 마지막 script는 hani-launch-greeting.js다. **운영 화면·실제 JS 로딩을 확인한 것은 아니다.**

버전·캐시 태그·HANI_DISPLAY_VERSION·운영 JS/CSS·보호 저장 로직 변경 0. push/PR/Notion/main merge/배포 없음. 열차 로컬 add는 index.lock Permission denied로 실패하여 **열차 변경은 미커밋**이다. 권한 우회·재시도 없음. 시드 별도 branch는 로컬 커밋 완료.

## A. 전체 파일별 테스트

|구분|main|열차|
|---|---:|---:|
|파일 수|154|164|
|PASS|114|124|
|기존 실패|3|3|
|SKIP / 환경 차단|37|37|
|180초 TIMEOUT|0|0|
|main에 없는 신규 테스트|N/A 10|10개 모두 PASS|

각 파일은 별도 Node 프로세스로 실행했고 파일당 180초 제한을 적용했다. main에 없는 10개 열차 테스트는 main에서 N/A로 표시했다. 선택 Node/static 모드는 파일의 기존 옵션을 사용했다. 선택 브라우저 분기를 실행하지 않은 Node PASS는 UI PASS가 아니다. 필수 인자가 없는 테스트는 명세대로 SKIP이다. 초기 실행 실패와 재검증 로그를 모두 보존했다.

실행 도구: `obr11-run-tests.ps1 -Root <worktree> -Label <이름> [-Only <정규식>] [-ExactGitExports]`. 원본 로그는 `obr11-tests/{main,main-exports,main-final,main-args,train,train-fixes,train-final,train-args}/`, 최종 통합은 [obr11-comparison.json](obr11-comparison.json), CSV는 [obr11-comparison.csv](obr11-comparison.csv)다.

Node의 Git subprocess가 EPERM인 환경에서는 기존 obr5 읽기 전용 preload에 native Git으로 내보낸 **정확한 137개 역사 blob**을 공급했다. 각 blob은 git rev-parse 대 git hash-object 일치 및 SHA-256을 확인했다. 현재 소스를 역사 원본으로 대체하지 않았고 기대값·assertion은 변경하지 않았다. branch 비교는 실제 merge-base 7a10595(train) / d19aa0b(main), HEAD 비교는 고정 HEAD export, runtime.diff는 실제 native git diff 결과를 사용했다. Git apply·기타 Node subprocess가 필요한 검사는 여전히 SKIP이다.

### 수정한 새 실패

- **hani-building-206-safety.test.mjs 1개**: 마일스톤 연결 script 태그·승인된 main 연결을 raw 완전 불변으로 비교하여 열차만 실패했다. index.html / hani-main.js 두 파일에 기존 readReviewedCurrentSource를 적용해, 별도로 검증되는 고정 승인 fixture의 정확한 조각만 역변환한다. 기존 저장 호출·baseline 키·버전/캐시·owner 전체 바이트·EOL·ID assertion은 유지했다. 고정 fixture·누락/중복/변조 거부를 확인하는 reviewed-release-baseline 8개 검사 PASS, 본사 통합 suite도 PASS다.
- 성능 파일 최초 실행의 첫 계획 474.0ms 실패는 기록을 보존했다. 코드 수정 없이 아래 단독 3회와 전체 본사 suite에서 같은 assertion을 재검증했다. 성능 수치 변동 위험은 남는다.

### 기존 실패 — 수정하지 않음

|파일|main과 열차에서 같은 원인|
|---|---|
|hani-brand-heroes-218.test.mjs|art-map-v1.json이 release225 보존 기대값과 다름. **지정 main d19aa0b와 열차의 art-map은 byte 동일**이므로 이번 새 실패가 아님|
|hani-desk-mascots.test.mjs --unit|다온·윤슬의 planned 기대값 true 대 실제 false. main의 정식 입사 상태와 오래된 단위 fixture 불일치|
|hani-newface-217.test.mjs|정식 입사된 desk_daon에 대해 기존 미등록 자리 undefined를 기대함|

### 본사 suite·승인 기록·감사·성능

- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/hani-office-behavior-run-tests.ps1` (동일 역사 blob preload): **131 PASS / 0 FAIL / 3 기존 browser SKIP**, 총 134. [원문](obr11-office-suite.log)
- `hani-reviewed-release-baseline.test.mjs`: **8 PASS / 0 FAIL**. 승인 목록·고정 origin·정확한 fragment 및 역변환·변조 거부 기준 유지. 대표님 승인을 새로 생성한 것은 아님.
- `node docs/drafts/office-behavior-redesign/audit.mjs <obr 절대 경로>`: **54000 snapshot**, frozen 0, mismatch 0, stuckSeconds 0, near30 0, near24 0. [원문](obr11-audit.log)
- 단독 성능 명령: `node --test-name-pattern='warm snapshot' scripts/hani-office-lively-v2.test.mjs`. 첫 계획은 formal+하루 outings 전체, 파일 읽기/JS 파싱 제외, warm은 1,000 snapshot 평균이다. 같은 프로세스에서 계획을 재사용한 3회가 아니라 **새 프로세스 3회**다.

|회차|첫 계획 ms (<400)|warm ms (<3)|
|---|---:|---:|
|1|396.9376|0.6179|
|2|397.4489|0.5917|
|3|399.1541|0.6330|

단독 3회 PASS, 통합 suite 첫 계획 **344.4117ms** / warm **0.6360ms** PASS. 다만 파일별 최초 실행 474.0ms 및 별도 --test --test-isolation=none wrapper 단독 506.33/485.06/418.31ms FAIL도 보존한다. 직접 실행 최소 여유는 **0.85ms**뿐이다. 플랫폼·실행 모드에 따른 재실패 가능성을 숨기지 않는다. 계산 최적화 후보는 메모리에서만 조사했고 **runtime에 적용하지 않았다**. 400ms·3ms 기준 변경 0.

### 파일별 비교표

|파일 (scripts/)|main|열차|분류|
|---|---|---|---|
|`hani-access-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-ai-budget-antigravity.test.mjs`|PASS|PASS|PASS|
|`hani-ai-budget-browser.test.mjs`|SKIP|SKIP|SKIP|
|`hani-ai-budget-plan.test.mjs`|PASS|PASS|PASS|
|`hani-ai-budget.test.mjs`|PASS|PASS|PASS|
|`hani-ai-work-status.test.mjs`|PASS|PASS|PASS|
|`hani-backup-history-runtime.test.mjs`|SKIP|SKIP|SKIP|
|`hani-banners-203-ui.test.mjs`|PASS|PASS|PASS|
|`hani-banners-203.test.mjs`|PASS|PASS|PASS|
|`hani-board-203a.test.mjs`|PASS|PASS|PASS|
|`hani-board-community.test.mjs`|PASS|PASS|PASS|
|`hani-board-guard.test.mjs`|PASS|PASS|PASS|
|`hani-board-library.test.mjs`|PASS|PASS|PASS|
|`hani-board-living.test.mjs`|PASS|PASS|PASS|
|`hani-board-relationship.test.mjs`|PASS|PASS|PASS|
|`hani-board-views-211.test.mjs`|PASS|PASS|PASS|
|`hani-board-vocative.test.mjs`|PASS|PASS|PASS|
|`hani-board.test.mjs`|PASS|PASS|PASS|
|`hani-boardroom-cross-review.test.mjs`|SKIP|SKIP|SKIP|
|`hani-boardroom-live-meeting.test.mjs`|PASS|PASS|PASS|
|`hani-boardroom-recovery.test.mjs`|PASS|PASS|PASS|
|`hani-boardroom-routing.test.mjs`|SKIP|SKIP|SKIP|
|`hani-boardroom-voice-contract.test.mjs`|SKIP|SKIP|SKIP|
|`hani-brand-heroes-218.test.mjs`|FAIL|FAIL|기존 실패|
|`hani-building-206-engine.test.mjs`|PASS|PASS|PASS|
|`hani-building-206-safety.test.mjs`|PASS|PASS|새 실패 수정|
|`hani-building-206-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-building-206.test.mjs`|PASS|PASS|PASS|
|`hani-chart-toss-212.test.mjs`|PASS|PASS|PASS|
|`hani-cloud-conflict-choice.test.mjs`|PASS|PASS|PASS|
|`hani-cloud-egress-save-sim.test.mjs`|PASS|PASS|PASS|
|`hani-cloud-egress-sync.test.mjs`|PASS|PASS|PASS|
|`hani-cloud-first.test.mjs`|PASS|PASS|PASS|
|`hani-cloud-stability-runtime.test.mjs`|SKIP|SKIP|SKIP|
|`hani-context-remote-ui.test.mjs`|PASS|PASS|PASS|
|`hani-context-remote.test.mjs`|PASS|PASS|PASS|
|`hani-dash-217.test.mjs`|PASS|PASS|PASS|
|`hani-dash-218.test.mjs`|PASS|PASS|PASS|
|`hani-dashboard-period-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-dashboard-period.test.mjs`|PASS|PASS|PASS|
|`hani-desk-mascots.test.mjs`|FAIL|FAIL|기존 실패|
|`hani-drive-vault-precheck.test.mjs`|SKIP|SKIP|SKIP|
|`hani-drive-vault.test.mjs`|PASS|PASS|PASS|
|`hani-duplicate-id-guard.test.mjs`|PASS|PASS|PASS|
|`hani-egress-fix.test.mjs`|PASS|PASS|PASS|
|`hani-exam-popup-214.test.mjs`|PASS|PASS|PASS|
|`hani-final-review.test.mjs`|PASS|PASS|PASS|
|`hani-fix-208-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-fix-208.test.mjs`|PASS|PASS|PASS|
|`hani-fixes-213-market.test.mjs`|PASS|PASS|PASS|
|`hani-fixes-213-oauth.test.mjs`|PASS|PASS|PASS|
|`hani-gemini-reports-build.test.mjs`|PASS|PASS|PASS|
|`hani-goal-media-budget-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-goal-media-budget.test.mjs`|PASS|PASS|PASS|
|`hani-goal-period-view.test.mjs`|PASS|PASS|PASS|
|`hani-goal-period.test.mjs`|PASS|PASS|PASS|
|`hani-goal-progress-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-google-drive-212-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-google-drive-212.test.mjs`|PASS|PASS|PASS|
|`hani-hana-intake-224.test.mjs`|PASS|PASS|PASS|
|`hani-hero-cast-218.test.mjs`|PASS|PASS|PASS|
|`hani-hero-restore.test.mjs`|PASS|PASS|PASS|
|`hani-history-226.test.mjs`|PASS|PASS|PASS|
|`hani-ilbo-213.test.mjs`|PASS|PASS|PASS|
|`hani-ilbo-banner-215.test.mjs`|SKIP|SKIP|SKIP|
|`hani-invest-split-safety.test.mjs`|SKIP|SKIP|SKIP|
|`hani-invest-split-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-invest-split.test.mjs`|PASS|PASS|PASS|
|`hani-investment-research-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-kiwoom-code-224.test.mjs`|PASS|PASS|PASS|
|`hani-launch-greeting-221-unit.test.mjs`|PASS|PASS|PASS|
|`hani-launch-greeting-221.test.mjs`|SKIP|SKIP|SKIP|
|`hani-learning-quiz-quality.test.mjs`|PASS|PASS|PASS|
|`hani-learning-quiz-v04.test.mjs`|PASS|PASS|PASS|
|`hani-login-a-204-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-login-a-204.test.mjs`|PASS|PASS|PASS|
|`hani-login-session-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-lounge-216.test.mjs`|PASS|PASS|PASS|
|`hani-lounge-ai-213.test.mjs`|PASS|PASS|PASS|
|`hani-lounge-fun-211.test.mjs`|PASS|PASS|PASS|
|`hani-lounge-natural-211.test.mjs`|PASS|PASS|PASS|
|`hani-lounge-qa-212.test.mjs`|PASS|PASS|PASS|
|`hani-media-c-controls.test.mjs`|PASS|PASS|PASS|
|`hani-media-core.test.mjs`|PASS|PASS|PASS|
|`hani-meeting-character-voice.test.mjs`|SKIP|SKIP|SKIP|
|`hani-meeting-engine-v2-batch1.test.mjs`|SKIP|SKIP|SKIP|
|`hani-meeting-engine-v2-client.test.mjs`|PASS|PASS|PASS|
|`hani-milestones-v1.test.mjs`|N/A|PASS|신규 테스트 PASS|
|`hani-mission-203a.test.mjs`|PASS|PASS|PASS|
|`hani-monthly-report-design-212.test.mjs`|PASS|PASS|PASS|
|`hani-nav-groups.test.mjs`|PASS|PASS|PASS|
|`hani-navigation-state-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-navlogin-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-navlogin.test.mjs`|PASS|PASS|PASS|
|`hani-newface-217.test.mjs`|FAIL|FAIL|기존 실패|
|`hani-newsroom-4cut-230.test.mjs`|PASS|PASS|PASS|
|`hani-newsroom-persona.test.mjs`|PASS|PASS|PASS|
|`hani-newstaff-215.test.mjs`|PASS|PASS|PASS|
|`hani-ocr-accuracy-224.test.mjs`|PASS|PASS|PASS|
|`hani-office-219.test.mjs`|PASS|PASS|PASS|
|`hani-office-actions-216.test.mjs`|PASS|PASS|PASS|
|`hani-office-actions-221.test.mjs`|PASS|PASS|PASS|
|`hani-office-behavior.test.mjs`|N/A|PASS|신규 테스트 PASS|
|`hani-office-fix-218.test.mjs`|PASS|PASS|PASS|
|`hani-office-hd-224.test.mjs`|PASS|PASS|PASS|
|`hani-office-lively-v2.test.mjs`|N/A|PASS (재검증)|신규 테스트 PASS|
|`hani-office-lively.test.mjs`|PASS|PASS|PASS|
|`hani-office-obr10.test.mjs`|N/A|PASS|신규 테스트 PASS|
|`hani-office-obr3.test.mjs`|N/A|PASS|신규 테스트 PASS|
|`hani-office-obr4.test.mjs`|N/A|PASS|신규 테스트 PASS|
|`hani-office-obr6.test.mjs`|N/A|PASS|신규 테스트 PASS|
|`hani-office-obr7.test.mjs`|N/A|PASS|신규 테스트 PASS|
|`hani-office-obr8.test.mjs`|N/A|PASS|신규 테스트 PASS|
|`hani-office-obr9.test.mjs`|N/A|PASS|신규 테스트 PASS|
|`hani-office-seats-215.test.mjs`|PASS|PASS|PASS|
|`hani-office-tap-lines.test.mjs`|PASS|PASS|PASS|
|`hani-office-v2-215.test.mjs`|PASS|PASS|PASS|
|`hani-offline-entry-223.test.mjs`|SKIP|SKIP|SKIP|
|`hani-offline-transport-223.test.mjs`|PASS|PASS|PASS|
|`hani-one-pass-protected-surface.test.mjs`|PASS|PASS|PASS|
|`hani-owner-verification-diagnostic.test.mjs`|PASS|PASS|PASS|
|`hani-owner-verification-runtime.test.mjs`|SKIP|SKIP|SKIP|
|`hani-owner-verification-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-photo-backup-222.test.mjs`|PASS|PASS|PASS|
|`hani-polish-205-safety.test.mjs`|SKIP|SKIP|SKIP|
|`hani-polish-215.test.mjs`|PASS|PASS|PASS|
|`hani-post-audit-investment.test.mjs`|PASS|PASS|PASS|
|`hani-proactive-204-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-proactive-204.test.mjs`|PASS|PASS|PASS|
|`hani-proactive-care-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-protected-gate-integration.test.mjs`|SKIP|SKIP|SKIP|
|`hani-protected-write-contract.test.mjs`|PASS|PASS|PASS|
|`hani-pwa-213.test.mjs`|PASS|PASS|PASS|
|`hani-pwa-release-paths.test.mjs`|PASS|PASS|PASS|
|`hani-qa-210-followup.test.mjs`|PASS|PASS|PASS|
|`hani-qa-210.test.mjs`|PASS|PASS|PASS|
|`hani-quality-data-runtime.test.mjs`|SKIP|SKIP|SKIP|
|`hani-quiz-autogen-216.test.mjs`|PASS|PASS|PASS|
|`hani-quiz-quality-210.test.mjs`|PASS|PASS|PASS|
|`hani-relationship-seed-build.test.mjs`|PASS|PASS|PASS|
|`hani-remote-card-224.test.mjs`|PASS|PASS|PASS|
|`hani-remote-media-219.test.mjs`|PASS|PASS|PASS|
|`hani-report-common-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-report-common.test.mjs`|PASS|PASS|PASS|
|`hani-review-compact-212.test.mjs`|PASS|PASS|PASS|
|`hani-reviewed-release-baseline.test.mjs`|PASS|PASS|PASS|
|`hani-runtime-closure-ilbo.test.mjs`|PASS|PASS|PASS|
|`hani-second-opinion-ui.test.mjs`|SKIP|SKIP|SKIP|
|`hani-second-opinion.test.mjs`|PASS|PASS|PASS|
|`hani-server-owner-access.test.mjs`|PASS|PASS|PASS|
|`hani-settings-225.test.mjs`|PASS|PASS|PASS|
|`hani-simplify-225.test.mjs`|PASS|PASS|PASS|
|`hani-sports-sync-contract.test.mjs`|PASS|PASS|PASS|
|`hani-staff-floors-214.test.mjs`|PASS|PASS|PASS|
|`hani-street-journal-closure.test.mjs`|PASS|PASS|PASS|
|`hani-study-tutor-215.test.mjs`|PASS|PASS|PASS|
|`hani-tasks-qa-212.test.mjs`|PASS|PASS|PASS|
|`hani-theme-white-215.test.mjs`|PASS|PASS|PASS|
|`hani-toss-intake-224.test.mjs`|PASS|PASS|PASS|
|`hani-transaction-date.test.mjs`|PASS|PASS|PASS|
|`hani-transaction-runtime.test.mjs`|SKIP|SKIP|SKIP|
|`hani-ui-203b-ui.test.mjs`|PASS|PASS|PASS|
|`hani-ui-203b.test.mjs`|PASS|PASS|PASS|
|`hani-yuna-schedule-ui.test.mjs`|SKIP|SKIP|SKIP|

### SKIP 상세

SKIP은 통과가 아니다. Node만 실행하는 파일의 선택 브라우저 분기도 별도로 미검증이다.

|파일|미검증 사유|
|---|---|
|`hani-access-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-ai-budget-browser.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-backup-history-runtime.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-boardroom-cross-review.test.mjs`|브라우저／Node／Git 하위 프로세스 권한 차단|
|`hani-boardroom-routing.test.mjs`|명시적인 과거 원본 또는 브라우저 인자 필요|
|`hani-boardroom-voice-contract.test.mjs`|브라우저／Node／Git 하위 프로세스 권한 차단|
|`hani-building-206-ui.test.mjs`|테스트 내부 전체 SKIP|
|`hani-cloud-stability-runtime.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-dashboard-period-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-drive-vault-precheck.test.mjs`|Node spawnSync EPERM 환경에서 CLI status=null (98행); 앞선 assertion과 별개|
|`hani-fix-208-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-goal-media-budget-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-goal-progress-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-google-drive-212-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-ilbo-banner-215.test.mjs`|브라우저／Node／Git 하위 프로세스 권한 차단|
|`hani-invest-split-safety.test.mjs`|명시적인 과거 원본 또는 브라우저 인자 필요|
|`hani-invest-split-ui.test.mjs`|명시적인 과거 원본 또는 브라우저 인자 필요|
|`hani-investment-research-ui.test.mjs`|명시적인 과거 원본 또는 브라우저 인자 필요|
|`hani-launch-greeting-221.test.mjs`|브라우저／Node／Git 하위 프로세스 권한 차단|
|`hani-login-a-204-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-login-session-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-meeting-character-voice.test.mjs`|브라우저／Node／Git 하위 프로세스 권한 차단|
|`hani-meeting-engine-v2-batch1.test.mjs`|브라우저／Node／Git 하위 프로세스 권한 차단|
|`hani-navigation-state-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-navlogin-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-offline-entry-223.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-owner-verification-runtime.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-owner-verification-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-polish-205-safety.test.mjs`|명시적인 과거 원본 또는 브라우저 인자 필요|
|`hani-proactive-204-ui.test.mjs`|명시적인 과거 원본 또는 브라우저 인자 필요|
|`hani-proactive-care-ui.test.mjs`|명시적인 과거 원본 또는 브라우저 인자 필요|
|`hani-protected-gate-integration.test.mjs`|브라우저／Node／Git 하위 프로세스 권한 차단|
|`hani-quality-data-runtime.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-report-common-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-second-opinion-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-transaction-runtime.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|
|`hani-yuna-schedule-ui.test.mjs`|필수 Playwright·브라우저 인자 및 실행환경 없음|

## B. 마일스톤 저장소 안전 (CRITICAL)

**판정: 승인 범위 내 소스 감사·합성 실행 PASS_SCOPED. 실제 Cloud/기기 왕복은 미검증.** 재개 안내에 따라 milestones와 기존 save의 표준 메타만 허용했다. save()·writeProtectedState()·freshState()·normalizeState()·Cloud 비교/hash·안전 snapshot·큐/pull/push/revision 판단·동기화 cycle의 해당 본문은 main과 byte 동일임을 별도 assertion으로 확인했다.

|경로 / owner|키·필드 / 쓰는 시점|보존·삭제·동작 판정|
|---|---|---|
|hani-milestones.js appState / savedRows / merged (306~320)|메모리 state.milestones 조회|없는 목록은 화면에서 빈 저장 목록+코드 seed로 투영. freshState에 milestones 기본값 없음. 조회는 저장하지 않음|
|마일스톤 직접 I/O|localStorage/sessionStorage get/set/remove/clear, fetch, cloudClient 직접 호출 **0**|직접 primary·새 키·Supabase write 경로 없음. 검색과 실행 경로를 함께 확인|
|writeBlockReason (321~331)|로그인·원본 보호·복원 hold·Cloud recovery·auto ready·sync ON·Local 의미 검사|차단 조건이면 save 호출 0. 전용 milestones Node 검사에 기존 7조건 포함|
|persist (333~342)|선택 state.milestones 교체 후 기존 save|다른 top-level 참조/값 유지, meta 복사. 실패/예외면 이전 state 객체 복구. 첫 저장에만 목록 생성|
|submit / remove (399~430)|추가·수정·댓글·사용자 확인 삭제 후 선택 목록 저장|다른 목록·primary 키 삭제 아님. 손상 object 행은 목록에서만 숨기며 추가 시 기존 행도 유지|
|hani-main.js save (1331)|state.version 기존 VERSION, meta.lastSavedAt 갱신, 없는 lastBackupAt/lastImportAt 기본값|재개 승인 범위. 기존 meta의 다른 사용자 필드와 기존 backup/import 값은 보존|
|writeProtectedState (1215)|hani_os_life_v23에 전체 JSON setItem 후 read-back|공통 경로 그대로. 마일스톤 전용 remove/clear 없음. 내부 baseline **2.9.15-safe-baseline-bootstrap 유지**|
|loadState / validateStoredRecords (1177/1204)|v23 read; milestones 없으면 허용. 비배열/원시행/배열행 등 구조 손상 검사|원본 primary 유지. 기존 hani_os_load_quarantine_v1_<length>_<hash> 키에 원문 1회 보존, 확인 후에도 recovery 상태에서는 마일스톤 저장 차단|
|normalizeState (1256)|기존 전체 state normalize의 spread로 optional milestones 유지|정상 목록을 강제 생성하지 않음. 의미상 잘못된 object 행은 UI에서 숨기고 저장 원본 보존. 동일 normalize owner를 쓰는 운영 232와 호환|
|cloudQueueSync (5656) / cycle (5893)|save 성공 후 기존 큐 예약, revision·hash 확인|합성에서는 큐 호출 확인, 네트워크 미실행. sync/hash 기준 버전 변경 없음|
|cloudSyncFingerprintState (5353)|기존 hash 입력에서 ui/meta/version 제외, milestones 포함|조회·seed 표시만으로 hash 입력을 확장하지 않음. 실제 선택 목록 저장/수정은 기존 데이터 변경으로 감지|
|cloudPushLocalRow (5698)|기존 hani_state 행의 state JSON·device update; user_id와 기대 revision 조건|milestones도 기존 JSON 내부에 전달. revision +1 검증/경합 중단 유지. 테이블·컬럼·정책·서버 schema 변경 **0**, Supabase 코드 diff 0|
|cloudApplyRemoteRow (5663)|기존 안전 snapshot 후 remote.state normalize → v23 전체 write/read-back|다른 기기에서 먼저 생긴 milestones를 그대로 받음. 오래된 revision은 중단. 목록별 병합 기능을 새로 만들지 않음|
|기존 Cloud 안전 사본 (5459)|hani_os_cloud_safety_snapshot_v1, IndexedDB hani_safety_backups_v1, payload.savedAt/reason/storageKey/state|수신/교체 전 기존 공통 백업. 신규 마일스톤 전용 키 아님. primary 삭제를 위한 경로 아님|
|기존 Cloud 동기화 메타 (5610)|hani_os_cloud_meta_v1: revision/appliedRevision/hash/기기·push/pull/검증 시간|동기화 시 기존 별도 메타 갱신. v23의 다른 생활 필드 변경 아님. 기존 키·구조 그대로|

다른 기기에서 먼저 생성된 목록은 기존 전체-state 동기화 정책을 따른다. baseline 이후 양쪽이 바뀌면 기존 cloud-first는 **원본 안전 snapshot 후 Cloud 쪽 전체 state 수신**, manual은 conflict다. 목록별 자동 병합을 보장하지 않는다. 기존 Media Guard와 동기화 owner도 변경하지 않았다. 실제 다기기 동시 수정·복구·Media Guard 왕복은 이번에 실행하지 않았다.

### 실행 증명

명령 `node artifacts/office-behavior/obr11-storage-repro.mjs` → exit 0 / PASS_SCOPED. 실제 source 함수 본문을 Node VM에서 실행하고 저장소만 Map, UI/Cloud는 통제한 stub으로 격리했다. 실사용자 데이터·계정·네트워크 접근 0. [실행 코드](obr11-storage-repro.mjs) / [결과 JSON](obr11-storage-repro.json).

|합성 시나리오|확인 결과|
|---|---|
|정상 기존 v23 + 완전 meta·책·거래·확장 필드|첫 저장 변경은 milestones + meta.lastSavedAt만. 나머지 필드 JSON byte 동일|
|부분 meta / meta 없는 저장 경계 입력|기존 save 표준 기본값만 추가. 기존 meta 값·custom meta·그 밖의 필드 JSON byte 동일|
|위 3개 샘플 조회만 수행|primary 원문 문자열·state 동일, write 0|
|실제 loadState → normalize → 조회, milestones 없음|저장 문자열·write 0, 메모리에도 milestones 강제 생성 없음|
|milestones = null / object / string / [null] / [number] / [array]|6개 모두 primary 원문 보존·quarantine 사본 read-back·저장 차단|
|구조상 object지만 내용이 손상된 행|조회에서 숨긴 개수 1, raw/write 0. 유효 행 추가 후에도 손상 행 전체 JSON 보존|
|저장 공간 부족 예외|이전 state 객체·meta·primary 원문 복구/불변|
|다른 기기 목록 및 revision 판단|실제 normalize에서 목록/확장 필드 보존; remote-only pull, both-changed cloud-first pull/manual conflict, stale revision stop|

첫 저장의 “byte 동일”은 milestones 및 허용 표준 메타 외 **각 필드 JSON 직렬화 byte 비교**다. 원문 공백·서로 다른 숫자 표기까지 전체 JSON 문자열이 그대로라는 주장은 하지 않는다. 저장하지 않은 시나리오는 primary 원문 문자열 전체를 비교했다. 승인 범위 밖 신규 write 발견 없음, 보호 write 구현 수정 0.

## C. 두 번째 데이터 시드

- branch **hani/seed-233b-office-places**, worktree **../seed233b**, base **d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf**.
- 로컬 commit **fbe68c17523bfeb249ddd566c665a7ed041b10ed**. 변경은 **data/hani-building/office-places.json 1개**(1912 추가 / 49 삭제), 열차 파일과 byte 동일. push/PR/main merge 없음.
- art-map 및 spatial-contract는 main/열차 byte 동일. 각각 SHA-256 **910c96d135a92bc42ef1db05d9c9c8ad4461ffe88f3ffc860e538b5b9cfb0438**, **ed221b2405b2f41641b96055fc26f88a3a8d1a97b2fd1d4b40bf7d2e94e96e50**.
- main의 canonical closure에 office-places 없음, 운영 232 hani-office-live.js에 파일명/로더 전역 참조 없음. 실제 main 코드를 기존/새 places로 각각 실행해 **전체 계획 5개 + snapshot 240개 byte 동일, write 0**. [증명](obr11-seed-proof.json)
- 시드 변경 후 main의 본사/건물 관련 **13개 파일 개별 명령 exit 0**: Node 12개 PASS + 브라우저 전용 1개 내부 SKIP. 기존 main의 같은 13개 결과와 비교해 새 실패 0, 기대값 갱신 **0**. [결과](obr11-tests/seed/results.json)
- 동반 서버 Edge Function·설정 배포 없음. 배포 담당의 순서는 시드 승인·main 반영 후 열차 Candidate 통합이다. 이 로컬 커밋을 운영 반영으로 표시하지 않는다.

## D. Runtime closure

명령 `node artifacts/office-behavior/obr11-closure.mjs`. canonical resolveRuntimeClosure, entrypoint index.html, 현재 실제 파일 사용. 전체 목록은 [obr11-closure.json](obr11-closure.json).

|항목|main|열차|판정|
|---|---:|---:|---|
|closure 파일|126|127|상한 128 충족, 여유 1|
|data/ 경로|0|0|0 충족|
|누락|0|0|0 충족|
|총 byte|15232510|15359738|현재 worktree 바이트|

신규 runtime 파일: **hani-milestones.js 1개**, 제거 0. CSS는 기존 hani-design-system.css 안에 있으며 별도 새 runtime 파일 없음. 원 담당의 과거 128 수치는 이번 identity의 실측값으로 재사용하지 않았다. 이번 canonical 실측은 **127**이다. 전체 package Build/Freeze를 수행한 수치가 아니다.

## 남은 위험과 인수인계

1. 기존 실패 3개는 명세대로 그대로 보존했다. 전체 164개 PASS라고 보고하지 않는다.
2. SKIP 37개 및 선택 브라우저 분기: 실제 UI·auth·실제 Cloud 왕복·기기 충돌 검증 미완료. 특히 마일스톤 실제 기기 저장→다른 기기 read-back은 배포 담당/대표님 단계에 남는다.
3. 첫 계획은 단독 3회 및 통합 suite PASS지만 실행 모드별 변동과 매우 작은 여유가 있어 성능 위험이 남는다. 초기 실패 로그도 반드시 함께 인계한다.
4. 원격 최신 main·Pages·실제 운영 JS/화면 확인 없음. 표시/캐시 2.9.232 유지. Candidate Freeze/Build/One-Pass/HINA/Preview 승인/merge/배포를 수행하지 않았다.
5. 열차 test 수정·감사 도구·보고서는 index.lock 권한 거절로 미커밋 보존. 시드만 별도 로컬 커밋 완료. push/PR/Notion은 사용자 명시 금지로 미실행.
6. 다음 담당은 고정 main·열차·시드 identity와 미커밋 test diff를 확인한 후 수용한다. 원격 main 진행 시 임의 merge/rebase하지 않는다. 표준 Candidate 및 대표님 승인 절차는 유지한다.
