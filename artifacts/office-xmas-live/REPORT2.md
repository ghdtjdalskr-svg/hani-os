# 크리스마스 장식 2차 수정

2026-11-06 KST · Codex · `hani/office-xmas-live` · HEAD `f81f170c` 위 미커밋. 원격 main `f753c66a` 확인, 표시 **2.9.268 유지**.

- **라벨 순서:** 기존 `#haniOfficeActors` 컨테이너를 CSS `z-index:4`로 명시했습니다. 소품 레이어는 2, 말풍선은 10을 유지합니다. 기존 소품 6종·시즌 장식 모두 이름/상태표·배우 아래에 그려집니다. 새 DOM 레이어·handler는 없습니다. 수정 전 fade/press 상태의 라벨 가림 재현, 수정 후 **576개 실제 브라우저 paint-order 검사 통과**.
- **선물:** `(548,450), 80×60` → **`(520,443), 48×36`**. 나무 화분 오른쪽에 닿도록 붙이고 앞쪽으로 8px 둔 배치입니다. 1F 주민 지점 **13곳**, 주민 경로 **17,069표본**, 직원 경로 **5,959표본** 확인. 선물 사각형과 바닥 좌표 사이 최소 간격은 주민 **78.47px**, 직원 **16.19px**입니다. PC/폰 낮·밤에서 모찌 이름표와 겹치지 않습니다. 폰의 긴 직원 pill이 걸치는 경우에도 라벨이 선물 위에 그려짐을 확인했습니다. 주민 지점·v2.9.268 산책 로직은 바이트 보존했습니다.
- **창문 눈:** 기존 `(1600,146), 88×112`는 오른쪽 위 끝에 있고 1280×900에서 거의 보이지 않았습니다. **오른쪽 도시 전망 큰 창 중앙 `(1580,230), 160×204`**로 옮겼습니다. 실제 표시 약 **119×152px**(PC), **34×44px**(폰). 희박한 원본 눈 입자를 기존 CSS filter로 밝히고 반복 음영을 주어 창 안에서 보이게 했습니다. atlas는 **77,544B·SHA256 동일**, 수정하지 않았습니다.

**검증:** JS syntax·정확한 변경 범위 비교·보호 파일 49개 SHA256·실제 CSS/owner/아트 Chrome 화면·모션 감소·클릭 통과 통과. runtime closure **153/160, 누락 0**. [소스·좌표 근거](round2-source-check.json) · [브라우저 근거](round2-browser-check.json).

전체 `scripts/hani-office-*.test.mjs` **46파일 실행: 475통과·45실패·3건너뜀**, 시작 전 Git 차단 6파일은 별도입니다. 실패 45건 중 **12건은 `spawnSync git EPERM` 차단**, 나머지는 pin/기존 기대값 22건·기존 주민 동작/기대값 불일치 11건입니다. **기존 assertion 파일 수정 0개**.

- `xmas`: **11/13**, 승인된 새 좌표의 이전 literal pin 1건 + v2.9.268 통합 전 보호 baseline 1건. 수정 전 파일로는 12/13(보호 baseline 실패만) 재현했습니다.
- `props`: **8/11**, 7슬롯 가정 2건·보호 source pin 1건. `residents`: **31/49**, hash pin 외에 일정·주기·방문·pose 등의 기대값 불일치 포함. 두 파일은 **수정 전에도 같은 3건·18건 실패**를 재현했습니다.
- **서윤 인계:** `barista`, `bubble-close`, `consult`, `icons`, `motion-1`, `props`, `obr21`, `snack`, `tlayout`, `xmas`, `residents`, `zoom`의 pin/기존 기대값 목록은 [전체 상세](ROUND2-TESTS.md)에 기록했습니다. 실패를 삭제·완화하거나 통과로 바꾸지 않았습니다.
- **추가 차단:** 지정된 `scripts/hani-office-pets-bubble.test.mjs`가 현재 checkout에 없어 직접 실행은 `MODULE_NOT_FOUND`. [실행 로그](round2-pets-bubble.log). 시작 전 Git 차단 파일·실패 subtest도 [상세](ROUND2-TESTS.md)에 구분했습니다.

| KST / 층 | 1280×900 | 390×844 |
|---|---|---|
| 12월24일 20:00 / 1F | [PNG](1f-1280x900.png) | [PNG](1f-390x844.png) |
| 12월24일 20:00 / 5F | [PNG](5f-1280x900.png) | [PNG](5f-390x844.png) |
| 12월24일 12:00 / 1F | [PNG](1f-12h-1280x900.png) | [PNG](1f-12h-390x844.png) |
| 12월24일 12:00 / 5F | [PNG](5f-12h-1280x900.png) | [PNG](5f-12h-390x844.png) |

기존 야간 PNG 4개를 덮어쓰고 낮 PNG 4개를 저장했습니다. 실제 owner/CSS/아트의 고정 시각 harness 검증이며 로그인 운영 앱·전 시간대 동행/방문 실화면·Production read-back은 미검증입니다. 저장·Cloud·schema·버전·캐시 변경, commit·push·merge·배포는 없습니다. 다음은 서윤의 실패 기대값 검토이며 배포 승인은 요청하지 않았습니다.

Notion 기록 쓰기는 자동 승인 검토가 `approval policy never`로 거절하여 미반영입니다. [로컬 인수인계](../../docs/development-history/handoffs/2026-11-06-office-xmas-live-round2.md)에 갱신 대기 내용을 보존했습니다.
