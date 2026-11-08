# 뉴스룸 레이아웃 정리 보고서

2026-11-08 KST · Codex · `news4cut2` / `hani/newsroom-4cut-002` · 사용자 전달 HEAD `1b6274f`

## 변경 범위

- 원문 과제를 UTF-8 전체로 읽었고 한글은 정상이었습니다. 지정 before PC1280·폰390 두 장을 먼저 확인했습니다.
- CODEMAP에 뉴스룸 기존 owner는 있으나 4컷 anchor가 없어 `CODEMAP_MISS`로 owner를 직접 확인했습니다. `hani-main.js` 전체 읽기·수정은 하지 않았습니다.
- 착수 시 JS/CSS에 일부 수정이 이미 있었습니다. 이를 보존해 마무리했고, 과제 전 baseline 두 파일과 정확한 역변환을 연결했습니다.
- 4컷 이미지 버튼을 본문 전체 폭으로 배치하고, 그림·지수 표를 한 열로 정리했습니다.
- 중복된 “이번 주 한 줄” 패널을 제거했습니다. 그림에 포함된 안내는 본문과 원본 모달에서 중복하지 않고, 다른 그림에는 텍스트 fallback을 유지합니다.
- 지난 호 탐색을 호수·주간 바로 아래로 이동해 처음부터 펼쳤습니다. 짧은 호수·주간 버튼, 현재 호 표시, 선택 호 강조와 “최신 호로” 복귀를 제공합니다. 출처와 원본 모달은 기존 경로를 사용합니다.
- 종합/관심·새로고침 영역과 F/U의 폭·모서리·16px 간격을 정리했습니다. F/U는 PC3열·폰2열이며 영문 label의 글자 쪼개짐과 폰 옆 잘림을 줄였습니다. 기존 CSS의 밝음/다크·선택 색상을 정리했습니다.

## 지수 데이터 확인

표는 `issuePanels()`에서 **선택된 호의 issues.json alt**만 읽습니다. 실시간 뉴스·외부 시세를 섞지 않습니다.

| 호 | 코스피 | 코스닥 | S&P500 종가 | 나스닥 종가 |
|---|---|---|---|---|
| 1호 | 5,730.74 | 724.38 | 빈 칸 | 빈 칸 |
| 2호 | 5,059.69 | 644.27 | 7,376.86 | 24,579.42 |

1호 카탈로그에는 미국 주간 등락만 있고 종가 숫자는 없습니다. 그림 안에 보이는 종가를 새로 옮기거나 추정하지 않고 칸을 비웁니다. 2호는 alt에 이미 있는 “금요일 종가는 각각 …”을 읽습니다. 카탈로그·출처·그림 원본은 변경하지 않았습니다.

## 검증

- 실제 소스 4컷 Node: **7 PASS / 1 Git 차단**. KST 공개 경계, 빈 데이터, 실패 후 재시도, lazy fetch1회, 지난 호/최신/모달, 저장0, 두 호의 정확한 지수·빈 종가를 확인했습니다. 마지막 duplicate ID 원격 main 비교는 Git 금지로 차단됐습니다.
- 뉴스룸 persona 기존 시험: **4/4 PASS**.
- 정확한 outer inverse: **2/2 PASS**. 전체 입력/출력 SHA, 원래 baseline 원문, forward 복원, 부분·중복·다른 내용·EOL 변조 거절을 확인했습니다. 284→283은 index60개·main1개 버전 토큰만 복원하면 기존 283 고정 SHA와 각각 일치하는 독립된 시험 전용 바깥 층입니다. 기존 assertion과 고정 기준을 지우거나 완화하지 않았습니다. `scripts/hani-release-version-layers`는 이 checkout에 없습니다.
- 기존 2호 `verify-issue.mjs`: raw 실행은 승인된 UI owner 변경으로 보존 hash 실패, outer inverse 적용 후 **PASS**. 기존 baseline 숫자·그림·출처·보존 assertion은 그대로입니다. 새 UI 동작은 별도의 raw 4컷 시험에서 검증했습니다.
- JS syntax: owner·Edge 검증 스크립트 확인 완료.
- task-local 범위 검사: **PASS**. root 런타임·카탈로그 원문 보존, 새 저장/timer/listener0, 현행과 baseline의 ID 그래프70파일 비교에서 중복 증가0(기존8개)를 확인했습니다. 이 근거는 원격 main 비교를 대신한 PASS가 아닙니다.
- Edge 기존 4컷 브라우저 시험·F/U smoke·신규 레이아웃 검증: **시작 차단(`spawn EPERM`)**. 직접 Edge 실행도 자동 승인 검토에서 정책 차단됐습니다. PC/폰/다크 화면과 실제 interaction·가독성은 미검증입니다.
- **after PNG 및 before/after 비교 미생성**. 합성 이미지를 실제 화면처럼 제출하지 않았습니다. `after/README.md`에 재실행 방법을 남겼습니다.
- office 전체: **73파일 전부 실행, 최종 769 PASS / Git36 차단 / 별도3 FAIL / 기존4 skip**. 초회 원문과 확인된 재실행을 모두 보존했습니다. 아래 최종 결과·실패 근거·Git 차단 파일 목록을 확인합니다.

## 런타임 변경 파일

1. `hani-newsroom-4cut.js`
2. `hani-design-system.css`

착수 시 root 런타임·카탈로그 hash와 대조해 이 두 파일만 변경됐습니다. `index.html`, `hani-main.js`, `issues.json`·이미지·저장 키·내부 버전·Cloud·서버는 변경하지 않았습니다. 새로운 runtime JS·timer·listener·저장 경로는 없습니다. 표시 버전·cache tag는 올리지 않았습니다.

## 인수인계와 남은 경계

- Git 명령·commit·push·merge·배포는 하지 않았습니다. 원격 main 최신성은 새로 확인하지 않았으며 사용자 지정 기준을 사용했습니다.
- 2호와 함께 **2.9.285**로 커밋·배포할 담당은 **서윤**입니다. 이 작업은 배포 완료가 아닙니다.
- 다음 행동: Edge 실행 가능한 환경에서 검증 스크립트 → 실제 PNG·비교 이미지 확인 → 서윤 Git 기반 회귀와 커밋 → 해당 릴리스 Candidate 절차.
- Notion 현황판 읽기는 성공했습니다. 계획 기록 추가는 **자동 승인 검토에서 `approval policy never`로 거절**되어 미반영입니다. 종료 요약도 이 보고서와 작업별 인수인계에 보존하며 Notion 반영 대기입니다.
- 근거: `runtime-identity.json`, `layout-delta.json`, `logs/`, `after/README.md`, `docs/development-history/handoffs/2026-11-08-newsroom-layout.md`.

## 재실행 명령

```powershell
node --require ./artifacts/newsroom-layout/no-git.cjs --test --test-isolation=none scripts/hani-newsroom-4cut-230.test.mjs --node
node --require ./artifacts/newsroom-layout/no-git.cjs --test --test-isolation=none scripts/hani-newsroom-persona.test.mjs
node --test --test-isolation=none artifacts/newsroom-layout/layout-inverse.test.mjs
node artifacts/newsroom-layout/verify-scope.mjs
$env:HANI_LAYOUT_KEEP_VERSION='1'
node --require ./artifacts/newsroom-layout/layout-preload.cjs artifacts/newsroom-4cut-002/verify-issue.mjs
Remove-Item Env:HANI_LAYOUT_KEEP_VERSION
& ./artifacts/newsroom-layout/run-office.ps1
node artifacts/newsroom-layout/verify-edge.mjs
node artifacts/newsroom-layout/compare.mjs
```

`no-git.cjs`는 기준 조회를 가짜 성공으로 바꾸지 않고, Git 실행 전에 명시적으로 차단합니다. Git 가능한 환경에서는 서윤이 실제 기준선을 다시 확인해야 합니다. office는 구 시험의 상위 UI·284 버전 층만 역변환하며 실제 런타임 파일은 쓰지 않습니다.

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
