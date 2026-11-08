# Git 금지로 미검증인 office 파일

`USER_GIT_DISABLED`로 Git 실행 전에 차단했습니다. 아래 검사 assertion은 보존하며 PASS로 세지 않습니다. 서윤이 Git 허용 환경에서 다시 실행합니다. 공통 명령·환경은 `run-tests.mjs`와 `office-results.json` 참고.

- `scripts/hani-office-219.test.mjs` — 차단 1건
- `scripts/hani-office-actions-216.test.mjs` — 차단 1건
- `scripts/hani-office-affinity-274-pins.test.mjs` — 차단 1건
- `scripts/hani-office-barista-night-273-pins.test.mjs` — 차단 1건
- `scripts/hani-office-bori-stroll.test.mjs` — 차단 1건
- `scripts/hani-office-cafe-rest.test.mjs` — 차단 1건
- `scripts/hani-office-chairman-patrol-278-pins.test.mjs` — 차단 6건
- `scripts/hani-office-companion-homes.test.mjs` — 차단 1건
- `scripts/hani-office-companions-276-pins.test.mjs` — 차단 1건
- `scripts/hani-office-consult.test.mjs` — 차단 1건
- `scripts/hani-office-icons.test.mjs` — 차단 1건
- `scripts/hani-office-lively-v2.test.mjs` — 차단 1건
- `scripts/hani-office-mascot-label.test.mjs` — 차단 1건
- `scripts/hani-office-obr12.test.mjs` — 차단 1건
- `scripts/hani-office-obr14.test.mjs` — 차단 1건
- `scripts/hani-office-obr15.test.mjs` — 차단 1건
- `scripts/hani-office-obr21.test.mjs` — 차단 2건
- `scripts/hani-office-obr4.test.mjs` — 차단 2건
- `scripts/hani-office-obr6.test.mjs` — 차단 1건
- `scripts/hani-office-obr7.test.mjs` — 차단 1건
- `scripts/hani-office-obr8.test.mjs` — 차단 1건
- `scripts/hani-office-obr9.test.mjs` — 차단 1건
- `scripts/hani-office-pet-bori-272-pins.test.mjs` — 차단 1건
- `scripts/hani-office-pets-268-pins.test.mjs` — 차단 1건
- `scripts/hani-office-pets-bubble.test.mjs` — 차단 1건
- `scripts/hani-office-v2-215.test.mjs` — 차단 1건
- `scripts/hani-office-xmas-269-pins.test.mjs` — 차단 1건
- `scripts/hani-office-xmas.test.mjs` — 차단 1건

219는 원래 실패로 지정됐으나 이번에는 Git 차단이 먼저 발생하여 기존 실패 원인 재현은 미검증입니다.
