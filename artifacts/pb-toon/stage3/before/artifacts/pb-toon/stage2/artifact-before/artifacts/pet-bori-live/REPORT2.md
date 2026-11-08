# 반려 이름표 가독성 수정

2026-11-07 KST · Codex · `hani/pet-bori-live` · HEAD `772e9000` · 미커밋

치즈·크림·모찌·보리 이름표를 **직원 공통 pill 스타일 + 따뜻한 크림 배경/갈색 글자**로 변경했습니다. 런타임은 `hani-office-live.css:222` 한 줄만 수정했습니다. PC/폰의 배경·테두리·반경·패딩·굵기·크기 규칙을 직원과 공유하며, 폰은 10px·좌우 2px입니다.

- 네 펫 실제 computed text contrast **9.53:1, AA PASS**. 16개 조건(두 크기 × 낮/밤 × 네 층), 펫 이름표 14개 표본에서 겹침·화면 이탈·가로 넘침·page error·저장 쓰기 **0**.
- `placeStatusLabels` / `fitStatusLabels`를 포함한 **office JS 전체 byte 보존**. 배우 위치도 전후 동일. 레이어는 props/decorations **2 < actors/labels 4 < bubble 10** 유지.
- 272 exact 계층 CSS 변경 쌍 **1→2**, JS **20쌍 유지**. 고정 v271 원본 SHA·모든 거절 assertion 보존. 새 fixture SHA-256: `9e33ccacd692f69aec65e39cc1213bbfe7b01f46a0366d2ba743c6035a2cd9a7`.
- `index.html`·`hani-main.js` 원문, 표시 버전 **2.9.271**·캐시 태그 보존. commit/push/merge/배포 없음.

## 전후 화면

실제 owner/CSS/art를 실행한 읽기 전용 Edge harness입니다. 원본 앱 전체 화면·Production 검증과 구분합니다.

| 1F / KST | 수정 전 | 수정 후 |
|---|---|---|
| 낮 11/7 12:00 · 1280×900 | [전](labels-before-day-1280x900.png) | [후](labels-after-day-1280x900.png) |
| 낮 11/7 12:00 · 390×844 | [전](labels-before-day-390x844.png) | [후](labels-after-day-390x844.png) |
| 12/24 20:00 · 1280×900 | [전](labels-before-xmas-night-1280x900.png) | [후](labels-after-xmas-night-1280x900.png) |
| 12/24 20:00 · 390×844 | [전](labels-before-xmas-night-390x844.png) | [후](labels-after-xmas-night-390x844.png) |

## 검사

Node v24.22.1 / Edge headless. `node scripts/hani-office-*.test.mjs` **51개 전부 전후 실행**. 수정 후 **35명령 성공·16명령 기존 실패**, 신규 실패 0. 집계 가능한 결과 **565 PASS / 25 FAIL / 3 SKIP**이며, `219` 시작 assertion 실패는 이 집계 외입니다. 수정 전 60초 제한에 걸린 `obr14`·`pets-bubble`은 수정 후 180초 제한 내 정상 완료했습니다.

| 요청 검사 | 수정 후 결과 |
|---|---|
| `hani-office-pet-bori` | **14/14 PASS** |
| `hani-office-pets-bubble` | **22/22 PASS** |
| `hani-office-xmas` | 11 PASS / **기존 2 FAIL**: index 고정 v268 pin, closure 156≠152 |
| `hani-office-219` | **기존 직원 `.hani-office-name AA text contrast` 실패**. 펫은 별도 실제 computed 검증으로 AA PASS |
| 272 / 268 pins | **4/4 · 1/1 PASS**, Git 원본 증명 포함 |
| 269 pins | 1 PASS / 기존 runtime 외 변경 범위 assertion 1 FAIL |
| syntax / CSS / diff | 수정한 두 검사 모듈 syntax·실제 CSS 적용·`git diff --check` PASS |

기타 기존 실패는 G/source·입력 hash, 기존 동작/성능 assertion입니다. 삭제·완화하지 않았습니다. 전체 명령·실패명·전후 비교는 [검사 비교](labels-test-comparison.json), [전 로그](labels-before-tests/), [후 로그](labels-after-tests/), [화면/보존 검증](labels-verification.json)에 있습니다.

**`spawnSync git EPERM`: 환경 차단(blocked) 분류.** 이전 보리 작업의 blocker이며 이번에는 번들 Git PATH 사용으로 재발 0입니다. 실제 assertion 실패와 혼동하지 않았습니다.

원격 main `dab68f3d` 확인, 공통 base `5f13d8d`; merge/rebase 없음. package/Candidate/HINA·Arin 독립 리뷰·Production read-back은 미실행입니다. 다음은 배포 담당의 기존 실패 정리·열차 통합·Preview 승인입니다.

Notion 착수 쓰기는 **자동 승인 정책 never로 거절**되어 미반영입니다. [작업 인수인계](../../docs/development-history/handoffs/2026-11-07-pet-labels.md)에 갱신 대기를 보존했습니다.
