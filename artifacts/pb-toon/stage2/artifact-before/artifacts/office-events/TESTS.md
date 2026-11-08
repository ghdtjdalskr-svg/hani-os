# 전체 office 테스트 결과 · 2026-11-06

실행: Codex 번들 Node v24.22.1로 `node --test-reporter=tap scripts/hani-office-*.test.mjs` 각 파일을 별도 프로세스로 순차 실행. 실행 파일 경로와 반복 명령은 [run-office-tests.ps1](run-office-tests.ps1), 원본 결과는 [resume-test-results.json](resume-test-results.json)에 보존했습니다.

42파일 중 전체 통과 21, 단언 실패 포함 8, 환경 차단 포함 16입니다(실패·차단이 함께 있는 3파일 중복). 집계된 검사: **통과 431 / 실패 13 / Git EPERM 차단 12**. 추가 6파일은 검사 등록 전 Git EPERM으로 시작 차단됐습니다. 공유 fixture 검사 중복을 포함합니다. EPERM은 실패에 포함하지 않았습니다.

| 파일 | 결과 | 통과 | 실패 | Git 차단 |
|---|---|---:|---:|---:|
| [hani-office-219.test.mjs](resume-tests/hani-office-219.test.log) | 차단 | 0 | 0 | 시작 차단 |
| [hani-office-actions-216.test.mjs](resume-tests/hani-office-actions-216.test.log) | 차단 | 14 | 0 | 1 |
| [hani-office-actions-221.test.mjs](resume-tests/hani-office-actions-221.test.log) | 통과 | 20 | 0 | 0 |
| [hani-office-behavior.test.mjs](resume-tests/hani-office-behavior.test.log) | 통과 | 10 | 0 | 0 |
| [hani-office-cafe-rest.test.mjs](resume-tests/hani-office-cafe-rest.test.log) | 차단 | 3 | 0 | 1 |
| [hani-office-chairman-234.test.mjs](resume-tests/hani-office-chairman-234.test.log) | 차단 | 0 | 0 | 시작 차단 |
| [hani-office-consult.test.mjs](resume-tests/hani-office-consult.test.log) | 실패 + 차단 | 18 | 1 | 1 |
| [hani-office-crowded-labels.test.mjs](resume-tests/hani-office-crowded-labels.test.log) | 통과 | 19 | 0 | 0 |
| [hani-office-drama.test.mjs](resume-tests/hani-office-drama.test.log) | 통과 | 20 | 0 | 0 |
| [hani-office-fix-218.test.mjs](resume-tests/hani-office-fix-218.test.log) | 통과 | 6 | 0 | 0 |
| [hani-office-floor-bubble.test.mjs](resume-tests/hani-office-floor-bubble.test.log) | 통과 | 18 | 0 | 0 |
| [hani-office-hd-224.test.mjs](resume-tests/hani-office-hd-224.test.log) | 통과 | 10 | 0 | 0 |
| [hani-office-icons.test.mjs](resume-tests/hani-office-icons.test.log) | 실패 | 14 | 1 | 0 |
| [hani-office-labels-qa.test.mjs](resume-tests/hani-office-labels-qa.test.log) | 통과 | 17 | 0 | 0 |
| [hani-office-lively.test.mjs](resume-tests/hani-office-lively.test.log) | 통과 | 13 | 0 | 0 |
| [hani-office-lively-v2.test.mjs](resume-tests/hani-office-lively-v2.test.log) | 실패 + 차단 | 6 | 1 | 1 |
| [hani-office-motion-1.test.mjs](resume-tests/hani-office-motion-1.test.log) | 실패 | 15 | 1 | 0 |
| [hani-office-motion-2.test.mjs](resume-tests/hani-office-motion-2.test.log) | 통과 | 24 | 0 | 0 |
| [hani-office-obr10.test.mjs](resume-tests/hani-office-obr10.test.log) | 통과 | 4 | 0 | 0 |
| [hani-office-obr12.test.mjs](resume-tests/hani-office-obr12.test.log) | 차단 | 0 | 0 | 시작 차단 |
| [hani-office-obr14.test.mjs](resume-tests/hani-office-obr14.test.log) | 차단 | 4 | 0 | 1 |
| [hani-office-obr15.test.mjs](resume-tests/hani-office-obr15.test.log) | 차단 | 13 | 0 | 1 |
| [hani-office-obr16.test.mjs](resume-tests/hani-office-obr16.test.log) | 통과 | 12 | 0 | 0 |
| [hani-office-obr17.test.mjs](resume-tests/hani-office-obr17.test.log) | 통과 | 3 | 0 | 0 |
| [hani-office-obr18.test.mjs](resume-tests/hani-office-obr18.test.log) | 통과 | 12 | 0 | 0 |
| [hani-office-obr19.test.mjs](resume-tests/hani-office-obr19.test.log) | 통과 | 3 | 0 | 0 |
| [hani-office-obr21.test.mjs](resume-tests/hani-office-obr21.test.log) | 실패 + 차단 | 3 | 1 | 2 |
| [hani-office-obr3.test.mjs](resume-tests/hani-office-obr3.test.log) | 통과 | 5 | 0 | 0 |
| [hani-office-obr4.test.mjs](resume-tests/hani-office-obr4.test.log) | 차단 | 8 | 0 | 2 |
| [hani-office-obr6.test.mjs](resume-tests/hani-office-obr6.test.log) | 차단 | 0 | 0 | 시작 차단 |
| [hani-office-obr7.test.mjs](resume-tests/hani-office-obr7.test.log) | 차단 | 0 | 0 | 시작 차단 |
| [hani-office-obr8.test.mjs](resume-tests/hani-office-obr8.test.log) | 차단 | 2 | 0 | 1 |
| [hani-office-obr9.test.mjs](resume-tests/hani-office-obr9.test.log) | 차단 | 0 | 0 | 시작 차단 |
| [hani-office-residents.test.mjs](resume-tests/hani-office-residents.test.log) | 실패 | 31 | 5 | 0 |
| [hani-office-seats-215.test.mjs](resume-tests/hani-office-seats-215.test.log) | 통과 | 12 | 0 | 0 |
| [hani-office-snack.test.mjs](resume-tests/hani-office-snack.test.log) | 통과 | 26 | 0 | 0 |
| [hani-office-tap-lines.test.mjs](resume-tests/hani-office-tap-lines.test.log) | 통과 | 15 | 0 | 0 |
| [hani-office-tlayout.test.mjs](resume-tests/hani-office-tlayout.test.log) | 실패 | 11 | 2 | 0 |
| [hani-office-top-labels.test.mjs](resume-tests/hani-office-top-labels.test.log) | 통과 | 7 | 0 | 0 |
| [hani-office-v2-215.test.mjs](resume-tests/hani-office-v2-215.test.log) | 차단 | 17 | 0 | 1 |
| [hani-office-visitors-cafe.test.mjs](resume-tests/hani-office-visitors-cafe.test.log) | 통과 | 5 | 0 | 0 |
| [hani-office-zoom.test.mjs](resume-tests/hani-office-zoom.test.log) | 실패 | 11 | 1 | 0 |

## 비통과 항목

- **차단** · hani-office-219.test.mjs: 검사 등록 전 spawnSync git EPERM.
- **차단** · hani-office-actions-216.test.mjs: approved catalog projects exactly 98 core actions, 37 disabled, original family weights and frozen contract (spawnSync git EPERM).
- **차단** · hani-office-cafe-rest.test.mjs: cafe route uses clear lower-right floor, retains the lounge and sign mounting surface (spawnSync git EPERM).
- **차단** · hani-office-chairman-234.test.mjs: 검사 등록 전 spawnSync git EPERM.
- **차단** · hani-office-consult.test.mjs: consult: sofa wording, counter words, safety owners and runtime timers (spawnSync git EPERM).
- **실패** · hani-office-consult.test.mjs: consult: separately authored full plans and reverse snapshots retain exact identity in both presence states (assertion/source pin).
- **실패** · hani-office-icons.test.mjs: icons: scheduler, home clearance, public snapshots and both label geometry owners are byte identical to 15747bc (assertion/source pin).
- **차단** · hani-office-lively-v2.test.mjs: obr2: deterministic query order, reduced motion and frozen spatial bytes (spawnSync git EPERM).
- **실패** · hani-office-lively-v2.test.mjs: obr2: warm snapshot <3ms, first full daily formal+outing plan <400ms (성능 기준 초과 401.8ms / 기준 <400ms).
- **실패** · hani-office-motion-1.test.mjs: approved consultation scheduler source stays frozen, including every route and arrival calculation (assertion/source pin).
- **차단** · hani-office-obr12.test.mjs: 검사 등록 전 spawnSync git EPERM.
- **차단** · hani-office-obr14.test.mjs: 235 authored immutable six complete ledgers and 84 snapshots, exact source/CSS and query-order determinism (spawnSync git EPERM).
- **차단** · hani-office-obr15.test.mjs: obr15 historical source identities retained; cafe/rest source and full absent ledgers frozen separately (spawnSync git EPERM).
- **실패** · hani-office-obr21.test.mjs: obr21 authored full absent/present plans and reverse snapshots match frozen delta (assertion/source pin).
- **차단** · hani-office-obr21.test.mjs: obr21 fixed pre-patch collision witnesses fail on base and clear on current, including reduced motion/cancellation (spawnSync git EPERM).
- **차단** · hani-office-obr21.test.mjs: obr21 cached gathering/index decisions equal full index rebuilds (spawnSync git EPERM).
- **차단** · hani-office-obr4.test.mjs: obr4: all 326 canon anchors/coordinates stay frozen; both registered owners render in 2F with no planned rows (spawnSync git EPERM).
- **차단** · hani-office-obr4.test.mjs: obr4: released 2.9.232 runtime tolerates canon arriving first, with all 326 art coordinates and both home seats (spawnSync git EPERM).
- **차단** · hani-office-obr6.test.mjs: 검사 등록 전 spawnSync git EPERM.
- **차단** · hani-office-obr7.test.mjs: 검사 등록 전 spawnSync git EPERM.
- **차단** · hani-office-obr8.test.mjs: obr8/obr13: frozen formal plans include approved chairman delta; errands have full 8–25s stays, ≤60s round trips, present colleagues, shared reservations and no leisure words (spawnSync git EPERM).
- **차단** · hani-office-obr9.test.mjs: 검사 등록 전 spawnSync git EPERM.
- **실패** · hani-office-residents.test.mjs: eight approved atlases decode, match their manifest hashes, load through the real owner and enter the closure (assertion/source pin).
- **실패** · hani-office-residents.test.mjs: interaction routes and dwell spots clear full furniture envelopes and staff snapshots/plans remain byte-identical on and off (assertion/source pin).
- **실패** · hani-office-residents.test.mjs: actual delegated pet taps show both speakers, automatic scene uses existing bubble, and all persistence/AI paths remain unused (assertion/source pin).
- **실패** · hani-office-residents.test.mjs: every original source byte and staff/visitor plan, outing and snapshot stays identical with residents on or off (assertion/source pin).
- **실패** · hani-office-residents.test.mjs: trio rejects missing/different-floor/sleeping pets and staff-blocked floor; plan and snapshot bytes stay frozen (assertion/source pin).
- **실패** · hani-office-tlayout.test.mjs: only the five pinned source fragments change; protected home and label owners are byte identical (assertion/source pin).
- **실패** · hani-office-tlayout.test.mjs: 16 separately authored complete plan/outings/reverse-snapshot outputs have no exclusions (assertion/source pin).
- **차단** · hani-office-v2-215.test.mjs: frozen 326-anchor canon file (+5 window spots and 2 coffee service anchors), active registered staff only, exact home floor/seat and posture (spawnSync git EPERM).
- **실패** · hani-office-zoom.test.mjs: zoom: scheduler, snapshots and all three protected geometry functions stay byte identical to task base (assertion/source pin).

## 인수인계

- `office-tlayout-data-delta.json`·`office-residents-source-delta.json` 및 icons/zoom/residents의 기존 소스·타이머·노드 고정값은 서윤 담당으로 유지했습니다. 고정 해시에서 중단된 검사의 뒤쪽 단언은 미검증입니다.
- 실제 이벤트 코드의 정적 createElement 호출은 57→59, DOM은 기존 간식 버튼 대비 +6개, setTimeout 4→4·setInterval 2→2입니다. 기존 간식 타이머 2개를 eventEndTimer/eventCooldownTimer로 일반화했습니다. 해당 테스트의 snack 이름 단언은 삭제하거나 완화하지 않았습니다.
- 219의 main 기존 실패는 작업 지시의 사전 정보입니다. 여기서는 Git EPERM 시작 차단으로 원래 검사를 실행하지 못했습니다.
- 누락된 snack baseline.json은 c301a13 원본 소스·데이터 입력 총 6개의 원격 Git blob 해시를 대조해 복원했습니다. 기대값을 현재 이벤트 소스에서 생성하지 않았습니다. 복원 과정은 baseline-inputs.json·restore-snack-baseline.mjs·baseline-restore.log 참조.
- 성능 항목은 전체 검사에서 401.8ms로 <400ms 기준에 실패했습니다. 전체 검사 종료 후 같은 Node와 같은 소스에서 `node --test-name-pattern "warm snapshot" --test-reporter=tap scripts/hani-office-lively-v2.test.mjs` 단독 재측정은 1/1 통과했습니다([로그](resume-performance.log)). 최초 실패를 전체 표에서 지우거나 기준을 완화하지 않았습니다.
- 이전 실행 로그와 test-results.json은 과거 증거로 보존했습니다. 최종 재실행 결과는 이 표와 resume-tests/를 기준으로 합니다.
