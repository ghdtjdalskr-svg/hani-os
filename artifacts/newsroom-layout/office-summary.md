## office 전체 최종 결과

기존 runner와 같은 `hani-office-*.test.mjs` + `hani-building-*.test.mjs` **73파일 전부 실행**했습니다. 초회 원문은 `office-results.json`·`office-summary.json`, 확인된 재실행만 반영한 최종본은 `office-final-summary.json`입니다.

| 항목 | 결과 |
|---|---:|
| 전체 test case | 812 |
| 통과 | 769 |
| Git 기준 조회 차단 | 36 |
| Git 외 실패 | 3 |
| 기존 skip | 4 |

파일 기준으로는 **43개 전부 통과, 27개 Git 차단만, 2개 Git 차단+성능 실패, 1개 별도 실패**입니다. 저장·Cloud·서버·Git write는 하지 않았습니다. 표시는 이 개발 환경의 결과이며 Release PASS가 아닙니다.

### 남은 실패 3건

1. `hani-building-206.test.mjs` — 3층 background가 `floor-3f-215.webp`라는 기존 기대와 현행 `floor-3f-218.webp`가 불일치합니다. 뉴스룸 패치가 바꾸지 않은 office owner입니다.
2. `hani-office-cafe-rest.test.mjs` — 기존 cold plan **400ms 미만** 기준 실패. 단독 재실행도 최소 **484.7981ms**였습니다.
3. `hani-office-lively-v2.test.mjs` — 기존 cold full-day plan **400ms 미만** 기준 실패. 단독 재실행도 최소 **500.2187ms**였습니다. warm snapshot은 **1.1845ms**, 기존 3ms 미만 기준을 충족했습니다.

두 성능 실패는 전체 시험 종료 뒤 해당 assertion만 한 번씩 재실행해도 남았습니다. 기준 완화·assertion 삭제·범위 밖 성능 코드는 수정하지 않았습니다.

### 기준/환경 차이 정리

- 273 보존 검사의 284/283 버전 차이는 정확한 바깥 역변환 후 재실행에서 해소됐습니다. barista night의 해당 보존 assertion PASS, 273 pin 파일은 로컬4 PASS·Git1 차단입니다.
- building safety는 원래 필요한 export 경로가 없는 CLI 호출에서 시작 실패했습니다. canonical 예상 경로를 명시한 재실행에서는 실제 Git 원문 조회에서 차단되는 것을 확인해 Git 차단으로 분류했습니다. 가짜 baseline은 제공하지 않았습니다.
- `219`는 과제에서 원래 실패한다고 명시한 항목입니다. 여기서는 Git 조회가 먼저 차단되어 원래 실패 assertion까지 재현하지 못했습니다.
- 이전 원문 JSON 부산물4개(`obr16/17/19-layout-node.json`, `office-drama/reachability.json`)는 runner가 원래 바이트로 복원했습니다.
- 검증 중 적용한 UI·284 inverse는 원래 lower owner의 전체 SHA를 유지합니다. office 결과를 최신 뉴스룸 실제 화면·최종 릴리스의 PASS로 사용하지 않습니다.

### Git 차단 파일 목록 (29개, 성능 실패 동반 2개 포함)

```text
hani-building-206-safety.test.mjs
hani-office-219.test.mjs
hani-office-actions-216.test.mjs
hani-office-affinity-274-pins.test.mjs
hani-office-barista-night-273-pins.test.mjs
hani-office-bori-stroll.test.mjs
hani-office-cafe-rest.test.mjs
hani-office-chairman-patrol-278-pins.test.mjs
hani-office-companion-homes.test.mjs
hani-office-companions-276-pins.test.mjs
hani-office-consult.test.mjs
hani-office-icons.test.mjs
hani-office-lively-v2.test.mjs
hani-office-mascot-label.test.mjs
hani-office-obr12.test.mjs
hani-office-obr14.test.mjs
hani-office-obr15.test.mjs
hani-office-obr21.test.mjs
hani-office-obr4.test.mjs
hani-office-obr6.test.mjs
hani-office-obr7.test.mjs
hani-office-obr8.test.mjs
hani-office-obr9.test.mjs
hani-office-pet-bori-272-pins.test.mjs
hani-office-pets-268-pins.test.mjs
hani-office-pets-bubble.test.mjs
hani-office-v2-215.test.mjs
hani-office-xmas-269-pins.test.mjs
hani-office-xmas.test.mjs
```
