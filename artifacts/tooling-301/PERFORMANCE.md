# tooling-301 · 성능 재실행

숫자: 종료 코드 / Node PASS·FAIL·SKIP. timeout은90초 미완료. 최초 로그도 보존.

작업본에서 실패한 cafe-rest·companion-homes·lively-v2를 각각 2회 추가 실행했다. 6회 모두 Git 원문 조회의 spawnSync git EPERM 1건만 실패했다. 카페·lively-v2의 400ms 성능 단언은 2회 모두 통과했다. residents·staff-chat은 전체 실행에서 기준/현재 모두 통과했다.

| 실행 | 시험 | 종료 / PASS·FAIL·SKIP | 초 |
|---|---|---|---|
| baseline | hani-office-cafe-rest.test.mjs | 1 / 3·1·0 | 3.9 |
| baseline | hani-office-companion-homes.test.mjs | 1 / 15·1·0 | 75.72 |
| baseline | hani-office-lively-v2.test.mjs | 1 / 7·1·0 | 21.03 |
| baseline | hani-office-residents.test.mjs | 0 / 49·0·0 | 87.02 |
| baseline | hani-office-staff-chat.test.mjs | 0 / 17·0·0 | 79.76 |
| current | hani-office-cafe-rest.test.mjs | 1 / 3·1·0 | 3.94 |
| current | hani-office-companion-homes.test.mjs | 1 / 15·1·0 | 75.01 |
| current | hani-office-lively-v2.test.mjs | 1 / 7·1·0 | 20.59 |
| current | hani-office-residents.test.mjs | 0 / 49·0·0 | 86.83 |
| current | hani-office-staff-chat.test.mjs | 0 / 17·0·0 | 78.59 |
| perf-current-1 | hani-office-cafe-rest.test.mjs | 1 / 3·1·0 | 4.07 |
| perf-current-1 | hani-office-companion-homes.test.mjs | 1 / 15·1·0 | 80.39 |
| perf-current-1 | hani-office-lively-v2.test.mjs | 1 / 7·1·0 | 20.66 |
| perf-current-2 | hani-office-cafe-rest.test.mjs | 1 / 3·1·0 | 3.98 |
| perf-current-2 | hani-office-companion-homes.test.mjs | 1 / 15·1·0 | 75.71 |
| perf-current-2 | hani-office-lively-v2.test.mjs | 1 / 7·1·0 | 19.97 |
