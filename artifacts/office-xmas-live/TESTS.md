# 최종 사무실 테스트

동일한 최종 JS/CSS로 46개 파일을 실행했습니다. 기존 assertion은 수정하지 않았습니다.
명령: `node --test-reporter=tap scripts/hani-office-*.test.mjs`를 파일별 실행. 성능 검사는 아래 2개만 같은 소스로 단독 재검사했습니다.
병렬 원본 결과는 `final-tests/results.json`, 단독 보완 결과를 반영한 집계는 `test-summary.json`입니다.

집계: 492 통과 / 28 실패 / 3 건너뜀. 공통 engine import 중복 포함. 시작 전 Git 차단 6개 파일은 이 subtest 집계 밖입니다.

| 파일 | 통과 / 실패 / 건너뜀 | 근거 |
|---|---|---|
| hani-office-219.test.mjs | 시작 전 Git EPERM 차단 | [로그](final-tests/hani-office-219.test.log) |
| hani-office-actions-216.test.mjs | 14 / 1 / 0 | [로그](final-tests/hani-office-actions-216.test.log) |
| hani-office-actions-221.test.mjs | 20 / 0 / 0 | [로그](final-tests/hani-office-actions-221.test.log) |
| hani-office-barista.test.mjs | 10 / 0 / 0 | [로그](final-tests/hani-office-barista.test.log) |
| hani-office-behavior.test.mjs | 10 / 0 / 0 | [로그](final-tests/hani-office-behavior.test.log) |
| hani-office-bubble-close.test.mjs | 17 / 0 / 0 | [로그](final-tests/hani-office-bubble-close.test.log) |
| hani-office-cafe-rest.test.mjs | 3 / 1 / 0 | [로그](final-tests/cafe-rest-serial.log) |
| hani-office-chairman-234.test.mjs | 시작 전 Git EPERM 차단 | [로그](final-tests/hani-office-chairman-234.test.log) |
| hani-office-consult.test.mjs | 18 / 2 / 0 | [로그](final-tests/hani-office-consult.test.log) |
| hani-office-crowded-labels.test.mjs | 19 / 0 / 0 | [로그](final-tests/hani-office-crowded-labels.test.log) |
| hani-office-drama.test.mjs | 20 / 0 / 0 | [로그](final-tests/hani-office-drama.test.log) |
| hani-office-fix-218.test.mjs | 6 / 0 / 0 | [로그](final-tests/hani-office-fix-218.test.log) |
| hani-office-floor-bubble.test.mjs | 18 / 0 / 0 | [로그](final-tests/hani-office-floor-bubble.test.log) |
| hani-office-hd-224.test.mjs | 10 / 0 / 0 | [로그](final-tests/hani-office-hd-224.test.log) |
| hani-office-icons.test.mjs | 14 / 1 / 0 | [로그](final-tests/hani-office-icons.test.log) |
| hani-office-labels-qa.test.mjs | 17 / 0 / 0 | [로그](final-tests/hani-office-labels-qa.test.log) |
| hani-office-lively-v2.test.mjs | 7 / 1 / 0 | [로그](final-tests/lively-v2-serial.log) |
| hani-office-lively.test.mjs | 13 / 0 / 0 | [로그](final-tests/hani-office-lively.test.log) |
| hani-office-motion-1.test.mjs | 15 / 1 / 0 | [로그](final-tests/hani-office-motion-1.test.log) |
| hani-office-motion-2.test.mjs | 24 / 0 / 0 | [로그](final-tests/hani-office-motion-2.test.log) |
| hani-office-obr10.test.mjs | 4 / 0 / 0 | [로그](final-tests/hani-office-obr10.test.log) |
| hani-office-obr12.test.mjs | 시작 전 Git EPERM 차단 | [로그](final-tests/hani-office-obr12.test.log) |
| hani-office-obr14.test.mjs | 4 / 1 / 0 | [로그](final-tests/hani-office-obr14.test.log) |
| hani-office-obr15.test.mjs | 13 / 1 / 0 | [로그](final-tests/hani-office-obr15.test.log) |
| hani-office-obr16.test.mjs | 12 / 0 / 0 | [로그](final-tests/hani-office-obr16.test.log) |
| hani-office-obr17.test.mjs | 3 / 0 / 0 | [로그](final-tests/hani-office-obr17.test.log) |
| hani-office-obr18.test.mjs | 12 / 0 / 0 | [로그](final-tests/hani-office-obr18.test.log) |
| hani-office-obr19.test.mjs | 3 / 0 / 0 | [로그](final-tests/hani-office-obr19.test.log) |
| hani-office-obr21.test.mjs | 3 / 3 / 0 | [로그](final-tests/hani-office-obr21.test.log) |
| hani-office-obr3.test.mjs | 5 / 0 / 0 | [로그](final-tests/hani-office-obr3.test.log) |
| hani-office-obr4.test.mjs | 8 / 2 / 0 | [로그](final-tests/hani-office-obr4.test.log) |
| hani-office-obr6.test.mjs | 시작 전 Git EPERM 차단 | [로그](final-tests/hani-office-obr6.test.log) |
| hani-office-obr7.test.mjs | 시작 전 Git EPERM 차단 | [로그](final-tests/hani-office-obr7.test.log) |
| hani-office-obr8.test.mjs | 2 / 1 / 0 | [로그](final-tests/hani-office-obr8.test.log) |
| hani-office-obr9.test.mjs | 시작 전 Git EPERM 차단 | [로그](final-tests/hani-office-obr9.test.log) |
| hani-office-props.test.mjs | 9 / 2 / 0 | [로그](final-tests/hani-office-props.test.log) |
| hani-office-residents.test.mjs | 42 / 7 / 0 | [로그](final-tests/hani-office-residents.test.log) |
| hani-office-seats-215.test.mjs | 12 / 0 / 0 | [로그](final-tests/hani-office-seats-215.test.log) |
| hani-office-snack.test.mjs | 26 / 0 / 0 | [로그](final-tests/hani-office-snack.test.log) |
| hani-office-tap-lines.test.mjs | 15 / 0 / 0 | [로그](final-tests/hani-office-tap-lines.test.log) |
| hani-office-tlayout.test.mjs | 11 / 2 / 0 | [로그](final-tests/hani-office-tlayout.test.log) |
| hani-office-top-labels.test.mjs | 7 / 0 / 0 | [로그](final-tests/hani-office-top-labels.test.log) |
| hani-office-v2-215.test.mjs | 17 / 1 / 2 | [로그](final-tests/hani-office-v2-215.test.log) |
| hani-office-visitors-cafe.test.mjs | 5 / 0 / 0 | [로그](final-tests/hani-office-visitors-cafe.test.log) |
| hani-office-xmas.test.mjs | 13 / 0 / 0 | [로그](final-tests/hani-office-xmas.test.log) |
| hani-office-zoom.test.mjs | 11 / 1 / 1 | [로그](final-tests/hani-office-zoom.test.log) |

## 실패 항목

`icons` 1개, `zoom` 1개, `residents` 7개는 기존 복원 helper의 source pin, `props` 2개는 전체 슬롯이 7개라는 가정입니다. 서윤 담당으로 남겼습니다.
같은 source pin이 `motion-1` 1개, `tlayout` 2개, `consult` 1개, `obr21` 1개도 차단합니다. 보호 함수 바이트 자체는 `source-check.json`과 새 전용 테스트로 별도 일치 확인했습니다.
`hani-office-219` contrast는 지시 파일에서 main의 기존 실패로 알려졌습니다. 이번 실행은 Git EPERM으로 시작 전 차단되어 contrast를 직접 재검증하지 못했습니다.

- `hani-office-actions-216.test.mjs` — Git EPERM 실행 차단: approved catalog projects exactly 98 core actions, 37 disabled, original family weights and frozen contract
- `hani-office-cafe-rest.test.mjs` — Git EPERM 실행 차단: cafe route uses clear lower-right floor, retains the lounge and sign mounting surface
- `hani-office-consult.test.mjs` — Git EPERM 실행 차단: consult: sofa wording, counter words, safety owners and runtime timers
- `hani-office-consult.test.mjs` — 기존 source pin 또는 소품 개수 가정: consult: separately authored full plans and reverse snapshots retain exact identity in both presence states
- `hani-office-icons.test.mjs` — 기존 source pin 또는 소품 개수 가정: icons: scheduler, home clearance, public snapshots and both label geometry owners are byte identical to 15747bc
- `hani-office-lively-v2.test.mjs` — Git EPERM 실행 차단: obr2: deterministic query order, reduced motion and frozen spatial bytes
- `hani-office-motion-1.test.mjs` — 기존 source pin 또는 소품 개수 가정: approved consultation scheduler source stays frozen, including every route and arrival calculation
- `hani-office-obr14.test.mjs` — Git EPERM 실행 차단: 235 authored immutable six complete ledgers and 84 snapshots, exact source/CSS and query-order determinism
- `hani-office-obr15.test.mjs` — Git EPERM 실행 차단: obr15 historical source identities retained; cafe/rest source and full absent ledgers frozen separately
- `hani-office-obr21.test.mjs` — 기존 source pin 또는 소품 개수 가정: obr21 authored full absent/present plans and reverse snapshots match frozen delta
- `hani-office-obr21.test.mjs` — Git EPERM 실행 차단: obr21 fixed pre-patch collision witnesses fail on base and clear on current, including reduced motion/cancellation
- `hani-office-obr21.test.mjs` — Git EPERM 실행 차단: obr21 cached gathering/index decisions equal full index rebuilds
- `hani-office-obr4.test.mjs` — Git EPERM 실행 차단: obr4: all 326 canon anchors/coordinates stay frozen; both registered owners render in 2F with no planned rows
- `hani-office-obr4.test.mjs` — Git EPERM 실행 차단: obr4: released 2.9.232 runtime tolerates canon arriving first, with all 326 art coordinates and both home seats
- `hani-office-obr8.test.mjs` — Git EPERM 실행 차단: obr8/obr13: frozen formal plans include approved chairman delta; errands have full 8–25s stays, ≤60s round trips, present colleagues, shared reservations and no leisure words
- `hani-office-props.test.mjs` — 기존 source pin 또는 소품 개수 가정: props: one persistent map layer and seven persistent, map-relative slots across floors and clocks
- `hani-office-props.test.mjs` — 기존 source pin 또는 소품 개수 가정: props: reduced-motion owner remains persistent, floor-scoped and write-free
- `hani-office-residents.test.mjs` — 기존 source pin 또는 소품 개수 가정: eight approved atlases decode, match their manifest hashes, load through the real owner and enter the closure
- `hani-office-residents.test.mjs` — 기존 source pin 또는 소품 개수 가정: interaction routes and dwell spots clear full furniture envelopes and staff snapshots/plans remain byte-identical on and off
- `hani-office-residents.test.mjs` — 기존 source pin 또는 소품 개수 가정: actual delegated pet taps show both speakers, automatic scene uses existing bubble, and all persistence/AI paths remain unused
- `hani-office-residents.test.mjs` — 기존 source pin 또는 소품 개수 가정: every original source byte and staff/visitor plan, outing and snapshot stays identical with residents on or off
- `hani-office-residents.test.mjs` — 기존 source pin 또는 소품 개수 가정: trio rejects missing/different-floor/sleeping pets and staff-blocked floor; plan and snapshot bytes stay frozen
- `hani-office-residents.test.mjs` — 기존 source pin 또는 소품 개수 가정: seeded Cheese and Cream spots change within two minutes; NPC quarters and all staff plans stay frozen
- `hani-office-residents.test.mjs` — 기존 source pin 또는 소품 개수 가정: real pet hearts reuse one mounted node, pair taps override trio during affection, and reduced motion is still with zero writes
- `hani-office-tlayout.test.mjs` — 기존 source pin 또는 소품 개수 가정: only the five pinned source fragments change; protected home and label owners are byte identical
- `hani-office-tlayout.test.mjs` — 기존 source pin 또는 소품 개수 가정: 16 separately authored complete plan/outings/reverse-snapshot outputs have no exclusions
- `hani-office-v2-215.test.mjs` — Git EPERM 실행 차단: frozen 326-anchor canon file (+5 window spots and 2 coffee service anchors), active registered staff only, exact home floor/seat and posture
- `hani-office-zoom.test.mjs` — 기존 source pin 또는 소품 개수 가정: zoom: scheduler, snapshots and all three protected geometry functions stay byte identical to task base

## 성능 단독 재검사

- `cafe-rest`: 병렬 400ms 실패 → 같은 소스 단독 실행에서 기존 400ms assertion 통과. 남은 실패 1개는 Git EPERM.
- `lively-v2`: 병렬 성능 실패 → 같은 소스 단독 실행에서 기존 warm snapshot <3ms / first plan <400ms assertion 통과. 남은 실패 1개는 Git EPERM.
- 개발 중 harness의 60초 제한으로 중단된 `obr14`는 최종 실행에서 기존 assertion 변경 없이 약 109초에 종료했습니다. 4통과·Git EPERM 1실패.
