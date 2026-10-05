# Post-Audit Stabilization 후속 인수인계

## 작업 경계

- 담당: Codex · HANI 안정화 핫픽스 수행 탭
- branch: `hani/post-audit-stabilization-followup-20261006`
- base: `57719dcac0b221392dbe0a5ee3f5c7fb6e58cc02` (`origin/main`, v2.9.185)
- 목적: 최신 main에서 실제로 남은 투자 계산 정확성과 보호 저장소 쓰기 의미 검사를 최소 수정하고, 모바일 HANI Remote 겹침은 재현 여부만 검증합니다.
- 수정 예정 앵커: `hani-main.js`의 `brokerCalc`, `hani-asset-update-v1.js`의 `baseForDate`, `scripts/hani-one-pass-rules.mjs`의 `protectedSurface`, 관련 targeted test.
- 비수정 경계: Gemini 프로젝트가 담당하는 Cloud Sync, 충돌 해결 UX, 새 기기 복원, 백업·복구 경로. Supabase schema와 Edge Function도 변경하지 않습니다.

## 현재 Fact Check

- Batch 1: 새 월 첫 계좌 업데이트 시 같은 달 기록이 없으면 빈 스냅샷을 만들며, `brokerCalc`가 미확인 값을 숫자 0으로 합산하는 문제가 최신 main에도 남아 있습니다.
- Batch 2: 로드 실패 fail-close는 v2.9.180 이후 구현되어 중복 수정하지 않습니다.
- Batch 3: Deploy Bridge 소유자 권한 검사가 구현되어 중복 수정하지 않습니다.
- Batch 4: 정확한 후보·패키지 보호 계약은 존재하지만 `protectedSurface`의 단순 정규식이 별칭·괄호 표기·공백 변형을 놓칩니다.
- Batch 5: Intake 화면의 Remote 버튼은 모바일에서 `is-intake-inline`으로 이미 고정 버튼이 아닌 inline 배치입니다. 390px 실제 실행 검사로 겹침 재현 여부를 확정합니다.

## 배포 열차 경계

- 표시 버전, `?v=` 캐시 태그, `HANI_DISPLAY_VERSION`은 올리지 않습니다.
- 운영 PR, main 병합, 배포센터 실행은 하지 않습니다.
- 개발과 targeted test가 끝나면 branch를 push하고 이 문서와 Notion 카드를 `탑승 대기`로 갱신해 Claude 배포 열차에 인계합니다.

## 구현 결과

- `hani-main.js`: `brokerCalc`가 미확인 holding/account 값을 0으로 합산하지 않도록 nullable 합계를 적용했습니다. 명시적으로 저장된 0은 그대로 0입니다.
- `hani-asset-update-v1.js`: 새 월 첫 계좌 업데이트가 같은 달 기록이 없을 때 직전 확정 actual 스냅샷의 다른 계좌를 새 snapshot identity로 이어받습니다. 원본 snapshot과 flowSummary는 변경·재사용하지 않습니다.
- `scripts/hani-one-pass-rules.mjs`: 보호 키 write/remove/clear와 `hani_state` Cloud mutation을 공백, bracket notation, `localStorage` 별칭까지 탐지하도록 의미 검사를 보강했습니다. 승인 계약과 fail-closed 판정은 그대로입니다.
- 모바일 HANI Remote: 최신 코드의 Intake inline 배치로 390px에서 YUNA composer/send 및 toast와 겹치지 않음을 확인했습니다. 재현되지 않아 runtime CSS/JS는 수정하지 않았습니다.

## 변경 파일

- Runtime: `hani-main.js`, `hani-asset-update-v1.js`
- Release tooling: `scripts/hani-one-pass-rules.mjs`
- Tests: `scripts/hani-asset-update-smoke.js`, `scripts/hani-post-audit-investment.test.mjs`, `scripts/hani-one-pass-protected-surface.test.mjs`, `scripts/hani-post-audit-mobile-overlap.test.cjs`
- Handoff: 이 문서

## 검증 결과

- JS syntax: `hani-main.js`, `hani-asset-update-v1.js`, `scripts/hani-one-pass-rules.mjs`, 신규 모바일 검사 PASS.
- `node scripts/hani-post-audit-investment.test.mjs`: PASS — null/명시적 0/일부 계좌 미확인 구분.
- `node scripts/hani-one-pass-protected-surface.test.mjs`: PASS — formatting/bracket/alias/remove/clear/Cloud mutation 탐지.
- `node scripts/hani-asset-update-smoke.js`: PASS — 직전 확정 월 선택·새 snapshot identity·원본 불변 포함.
- `node scripts/hani-one-pass-release.mjs --self-test`: PASS.
- `node scripts/hani-release-preqa.mjs --self-test`: PASS.
- `node scripts/hani-protected-write-contract.test.mjs`: PASS.
- `node scripts/hani-protected-gate-integration.test.mjs`: PASS.
- `node scripts/hani-asset-update-browser-smoke.js`: PASS — 기존 계좌 보존, reload, 실패 rollback, 390px overflow 0, page error 0.
- `node scripts/hani-post-audit-mobile-overlap.test.cjs`: PASS — 390px Remote inline, composer/toast 비겹침, overflow 0.
- `git diff --check`: PASS.
- 표시 버전·`?v=`·`HANI_DISPLAY_VERSION`: 변경하지 않음.

## Drift와 인계 주의

- 개발 시작 base는 당시 최신 `57719dc` (v2.9.185)였습니다.
- 검증 종료 전 `origin/main`이 `0a12cae59922722532597e9828473b7d75226c9b` (v2.9.188)로 진행됐습니다. 규칙에 따라 merge/rebase하지 않았습니다.
- v185→v188은 `hani-main.js`의 Goal Registry 삭제 기능과 표시 버전 등을 변경하지만 `brokerCalc` 앵커는 변경하지 않았습니다. `hani-asset-update-v1.js`와 `scripts/hani-one-pass-rules.mjs`는 해당 구간에서 변경되지 않았습니다.
- Claude 배포 열차는 최신 main에 탑승시킨 뒤 이 targeted test를 다시 실행해야 합니다. 기능 충돌이 생기면 임의 해결하지 말고 이 작업으로 돌려보냅니다.

## 서버·승인·미검증

- 함께 배포할 Supabase Edge Function 또는 설정: 없음.
- Supabase schema, Cloud Sync, 백업·복구, 보호 저장소 key/internal VERSION 변경: 없음.
- 실제 Android 실기기와 Production read-back: 미검증. 이번 기능 branch 단계에서는 N/A이며 배포 열차 Candidate/운영 단계에서 확인합니다.
- Full package, One-Pass Candidate, HINA, 운영 배포: 배포 담당 단계이므로 미수행.
