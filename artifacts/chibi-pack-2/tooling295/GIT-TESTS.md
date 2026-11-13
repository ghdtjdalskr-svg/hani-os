# Git 필요 시험 · 서윤 담당

Git·Edge 금지 지시로 아래 27파일은 실행하지 않았다. 비Git 시험의 기존 저장소 객체 helper는 검증된 고정 객체를 읽으며 Git 프로세스를 호출하지 않는다.

```powershell
& ./artifacts/chibi-pack-2/tooling295-run.ps1 -GitOnly -AllowProcesses
git diff --check
```

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
