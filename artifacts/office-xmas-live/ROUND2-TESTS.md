# 2차 사무실 테스트 상세

명령: `node --test-reporter=tap scripts/<파일>` (46개 전체). 원래 assertion 파일은 SHA256 46개 일치, 수정 0개.

총 475통과 / 45실패 / 3건너뜀. 시작 전 Git 차단 6개 파일은 집계형 subtest 수와 별개.

## 서윤 확인 및 Git 차단

| 파일 / subtest | 분류 | 실패 이름·근거 |
|---|---|---|
| barista.test.mjs #10 | pin/기존 기대값 확인 (서윤) | barista: plan, blockPlan, snapshot outputs and protected owner bytes preserve the pre-patch baseline — model (all schedules, snapshots, geometry, label placement) + actual - expected  + '6ff742bc17df74ce3f5cc7bc8d201549cc8709e4b09e779850d3bac97a4034e5' - '7d666366cf953df1fb7e18927dd9a203b21d09e2d20afe2a59a90d9360eae6ff' |
| bubble-close.test.mjs #17 | pin/기존 기대값 확인 (서윤) | bubble close: protected owner bytes, global listeners and timer allocations are unchanged — entire model including plan, blockPlan and snapshot + actual - expected ... Skipped lines  '/* V2 metadata is read-only; a failed metadata request keeps the production renderer. */\n' + |
| cafe-rest.test.mjs #1 | Git EPERM 차단 | cafe route uses clear lower-right floor, retains the lounge and sign mounting surface — 'spawnSync git EPERM' |
| consult.test.mjs #14 | Git EPERM 차단 | consult: sofa wording, counter words, safety owners and runtime timers — 'spawnSync git EPERM' |
| consult.test.mjs #15 | pin/기존 기대값 확인 (서윤) | consult: separately authored full plans and reverse snapshots retain exact identity in both presence states — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| actions-216.test.mjs #7 | Git EPERM 차단 | approved catalog projects exactly 98 core actions, 37 disabled, original family weights and frozen contract — 'spawnSync git EPERM' |
| icons.test.mjs #14 | pin/기존 기대값 확인 (서윤) | icons: scheduler, home clearance, public snapshots and both label geometry owners are byte identical to 15747bc — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| motion-1.test.mjs #2 | pin/기존 기대값 확인 (서윤) | approved consultation scheduler source stays frozen, including every route and arrival calculation — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| lively-v2.test.mjs #6 | Git EPERM 차단 | obr2: deterministic query order, reduced motion and frozen spatial bytes — 'spawnSync git EPERM' |
| obr15.test.mjs #7 | Git EPERM 차단 | obr15 historical source identities retained; cafe/rest source and full absent ledgers frozen separately — 'spawnSync git EPERM' |
| obr4.test.mjs #7 | Git EPERM 차단 | obr4: all 326 canon anchors/coordinates stay frozen; both registered owners render in 2F with no planned rows — 'spawnSync git EPERM' |
| obr4.test.mjs #8 | Git EPERM 차단 | obr4: released 2.9.232 runtime tolerates canon arriving first, with all 326 art coordinates and both home seats — 'spawnSync git EPERM' |
| obr8.test.mjs #1 | Git EPERM 차단 | obr8/obr13: frozen formal plans include approved chairman delta; errands have full 8–25s stays, ≤60s round trips, present colleagues, shared reservations and no leisure words — 'spawnSync git EPERM' |
| props.test.mjs #7 | pin/기존 기대값 확인 (서윤) | props: one persistent map layer and seven persistent, map-relative slots across floors and clocks — Expected values to be strictly equal:  12 !== 7  code: 'ERR_ASSERTION' |
| props.test.mjs #10 | pin/기존 기대값 확인 (서윤) | props: reduced-motion owner remains persistent, floor-scoped and write-free — "Cannot read properties of undefined (reading '2')" |
| props.test.mjs #11 | pin/기존 기대값 확인 (서윤) | props: scheduler/plan/blockPlan/snapshot/labels/home-clear source bytes and all six assets are unchanged — fitStatusLabels + actual - expected  + '638089f0ae1fe6f0f46a8c267f1c574b4a2409ba7e1223f4242651cac786f1dd' - 'e7f807dd9110c0e44fd613c528b2cdf8c2f75df3e442ded716f768b9bdd0c3ac' |
| obr21.test.mjs #1 | pin/기존 기대값 확인 (서윤) | obr21 authored full absent/present plans and reverse snapshots match frozen delta — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| obr21.test.mjs #4 | Git EPERM 차단 | obr21 fixed pre-patch collision witnesses fail on base and clear on current, including reduced motion/cancellation — 'spawnSync git EPERM' |
| obr21.test.mjs #5 | Git EPERM 차단 | obr21 cached gathering/index decisions equal full index rebuilds — 'spawnSync git EPERM' |
| snack.test.mjs #16 | pin/기존 기대값 확인 (서윤) | snack: scheduler/snapshot/geometry/residents bytes and complete sampled model JSON preserve c301a13 — fitStatusLabels + actual - expected  + '638089f0ae1fe6f0f46a8c267f1c574b4a2409ba7e1223f4242651cac786f1dd' - 'e7f807dd9110c0e44fd613c528b2cdf8c2f75df3e442ded716f768b9bdd0c3ac' |
| tlayout.test.mjs #11 | pin/기존 기대값 확인 (서윤) | only the five pinned source fragments change; protected home and label owners are byte identical — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| tlayout.test.mjs #12 | pin/기존 기대값 확인 (서윤) | 16 separately authored complete plan/outings/reverse-snapshot outputs have no exclusions — hani-office-live.js exact input + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| v2-215.test.mjs #7 | Git EPERM 차단 | frozen 326-anchor canon file (+5 window spots and 2 coffee service anchors), active registered staff only, exact home floor/seat and posture — 'spawnSync git EPERM' |
| xmas.test.mjs #9 | pin/기존 기대값 확인 (서윤) | xmas: all five map-relative slots are created once, floor-scoped and tap-through at both widths — Expected values to be strictly equal: + actual - expected  + '94.49760765550239%' - '95.69377990430623%' |
| xmas.test.mjs #12 | pin/기존 기대값 확인 (서윤) | xmas: source patch has no storage/Cloud/AI path; protected function and runtime baseline bytes are unchanged — fitStatusLabels + actual - expected  + '638089f0ae1fe6f0f46a8c267f1c574b4a2409ba7e1223f4242651cac786f1dd' - 'e7f807dd9110c0e44fd613c528b2cdf8c2f75df3e442ded716f768b9bdd0c3ac' |
| residents.test.mjs #9 | 기존 동작/기대값 불일치 (서윤, 수정 전 재현) | resident occupancy stays separate for multiple days and moving as well as resting residents — shared stops cannot fit both bodies: later resident waits offscreen  3 !== 2  code: 'ERR_ASSERTION' |
| residents.test.mjs #10 | 기존 동작/기대값 불일치 (서윤, 수정 전 재현) | unchanged residents perform no DOM writes on the shared clock — Expected values to be strictly equal:  56 !== 0  code: 'ERR_ASSERTION' |
| residents.test.mjs #14 | pin/기존 기대값 확인 (서윤) | eight approved atlases decode, match their manifest hashes, load through the real owner and enter the closure — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| residents.test.mjs #21 | 기존 동작/기대값 불일치 (서윤, 수정 전 재현) | stable quarter-hour visits use only resting staff on the same floor and never visitors or travellers — "Cannot read properties of null (reading 'partnerId')" |
| residents.test.mjs #24 | pin/기존 기대값 확인 (서윤) | interaction routes and dwell spots clear full furniture envelopes and staff snapshots/plans remain byte-identical on and off — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| residents.test.mjs #25 | pin/기존 기대값 확인 (서윤) | actual delegated pet taps show both speakers, automatic scene uses existing bubble, and all persistence/AI paths remain unused — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| residents.test.mjs #26 | 기존 동작/기대값 불일치 (서윤, 수정 전 재현) | all decoded pose tops drive the existing label flow at phone and desktop widths without frame layout reads — packing uses real art top + actual - expected  + 94.10087719298244 - 98.10087719298244 |
| residents.test.mjs #28 | pin/기존 기대값 확인 (서윤) | every original source byte and staff/visitor plan, outing and snapshot stays identical with residents on or off — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| residents.test.mjs #30 | 기존 동작/기대값 불일치 (서윤, 수정 전 재현) | existing delegated tap/keyboard bubbles use short local lines, pet hop, no profile or writes; hidden/reduced clocks stay still — Expected values to be strictly equal:  undefined !== 'hop'  code: 'ERR_ASSERTION' |
| residents.test.mjs #32 | 기존 동작/기대값 불일치 (서윤, 수정 전 재현) | Mochi schedule covers quiet 3F mornings, 4F days, 1F evenings, midnight continuity and 02..07 sleep — Expected values to be strictly equal:  '1f' !== '4f'  code: 'ERR_ASSERTION' |
| residents.test.mjs #33 | 기존 동작/기대값 불일치 (서윤, 수정 전 재현) | Mochi uses eased hops around 18px/sec every 120..180 seconds, with longer rests and whole-body clearance — Expected values to be strictly equal:  true !== false  code: 'ERR_ASSERTION' |
| residents.test.mjs #36 | pin/기존 기대값 확인 (서윤) | trio rejects missing/different-floor/sleeping pets and staff-blocked floor; plan and snapshot bytes stay frozen — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| residents.test.mjs #37 | pin/기존 기대값 확인 (서윤) | seeded Cheese and Cream spots change within two minutes; NPC quarters and all staff plans stay frozen — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| residents.test.mjs #39 | pin/기존 기대값 확인 (서윤) | real pet hearts reuse one mounted node, pair taps override trio during affection, and reduced motion is still with zero writes — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| residents.test.mjs #40 | 기존 동작/기대값 불일치 (서윤, 수정 전 재현) | life signs repeat every 10..20 seconds, cover four gestures, and sleep or reduced motion suppresses them — The expression evaluated to a falsy value:  assert.ok(times[i]-times[i-1]>=9.9&&times[i]-times[i-1]<=20.1)  code: 'ERR_ASSERTION' |
| residents.test.mjs #42 | 기존 동작/기대값 불일치 (서윤, 수정 전 재현) | pet nominal speeds vary per leg around Cream 48, Cheese 40 and Mochi 18 while periods remain stable over days — The expression evaluated to a falsy value:  assert.ok(period>=(id==='pet-rabbit'?120:60)&&period<=(id==='pet-rabbit'?180:120))  code: 'ERR_ASSERTION' |
| residents.test.mjs #44 | 기존 동작/기대값 불일치 (서윤, 수정 전 재현) | pet easing moves less at both ends than in the middle, with seeded per-leg speeds and variable launch rests — The expression evaluated to a falsy value:  assert.ok(rests.size>1)  code: 'ERR_ASSERTION' |
| residents.test.mjs #45 | 기존 동작/기대값 불일치 (서윤, 수정 전 재현) | a seeded day includes reproducible one-to-three second mid-route pauses followed by onward movement — 'pet-rabbit has an actual paused snapshot' |
| zoom.test.mjs #12 | pin/기존 기대값 확인 (서윤) | zoom: scheduler, snapshots and all three protected geometry functions stay byte identical to task base — only the approved G source is accepted + actual - expected  + 'dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b' - '6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7' |
| obr14.test.mjs #1 | Git EPERM 차단 | 235 authored immutable six complete ledgers and 84 snapshots, exact source/CSS and query-order determinism — 'spawnSync git EPERM' |

## 시작 전 차단

- `hani-office-219.test.mjs`: `spawnSync git EPERM`.
- `hani-office-chairman-234.test.mjs`: `spawnSync git EPERM`.
- `hani-office-obr12.test.mjs`: `spawnSync git EPERM`.
- `hani-office-obr6.test.mjs`: `spawnSync git EPERM`.
- `hani-office-obr7.test.mjs`: `spawnSync git EPERM`.
- `hani-office-obr9.test.mjs`: `spawnSync git EPERM`.

- `node scripts/hani-office-pets-bubble.test.mjs`: 파일 없음 (`MODULE_NOT_FOUND`), 실행 차단. 현재 배포 변경은 residents/bubble-close 테스트에 일부 포함되어 있으며 요청 파일을 새로 만들거나 통과로 대체하지 않음.

## 수정 전 재현

실행: `node --test-reporter=tap --require ./artifacts/office-xmas-live/round2-baseline-loader.cjs scripts/hani-office-{residents,props,xmas}.test.mjs` (파일별 각각 실행).

테스트 assertion은 그대로 두고 JS/CSS 읽기만 착수 시 원본으로 치환한 읽기 전용 검증.
- residents: 수정 전 {'pass': 31, 'fail': 18}, 수정 후 {'pass': 31, 'fail': 18}; 실패 이름 동일=True.
- props: 수정 전 {'pass': 8, 'fail': 3}, 수정 후 {'pass': 8, 'fail': 3}; 실패 이름 동일=True.
- xmas: 수정 전 {'pass': 12, 'fail': 1}, 수정 후 {'pass': 11, 'fail': 2}; 실패 이름 동일=False.

xmas의 추가 1건은 승인된 선물/눈꽃 좌표와 이전 literal 기대값의 불일치. 기존 보호 baseline은 v2.9.268 통합 변경을 반영하지 않아 수정 전에도 실패. 기존 assertion을 삭제·완화하거나 pin을 갱신하지 않음.

주민 18실패에는 hash pin 외에도 인원/DOM write/방문/pose top/낮 층/주기·속도·pause 기대값 불일치가 포함됨. 전부 pin 실패라고 부르지 않음. 수정 전 18개 실패 이름이 동일함.

최종 소스 SHA256은 `round2-tests/results.json`의 identity와 일치. 중간 소스 검사는 최종 집계에 사용하지 않음. 전체 로그는 `round2-tests/`, 기계 집계는 `round2-summary.json`.
