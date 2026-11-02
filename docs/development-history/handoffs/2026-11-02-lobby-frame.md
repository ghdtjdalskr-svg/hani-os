# 1F 큰 액자 퀸 / 말풍선 바깥 탭 닫기

## 작업 식별

- 갱신: 2026-11-02 KST / 담당 Codex / 구현·targeted test 완료, 실화면 검증 대기.
- 저장소 PROJECT HANI / branch `hani/lobby-frame` / worktree `qa-b12`.
- base·HEAD·origin/main 로컬 캐시: `28cce59ac9d8b924cdb668bfe48d68ac8ba6afc4`. 로컬 main ref는 `53db8f60ed8b362a77af77d2f989da20abdbd722`로 다름. Git subprocess 금지로 원격 최신성 미검증, merge/rebase 없음.
- 승인 근거: `../qa-b12-task.md` 전체 UTF-8 정상 읽음. 기능 개발·지정 테스트·비교 PNG만 승인. commit/push/merge/배포·버전/cache 변경 금지.
- CODEMAP living-office owner 확인. queen/bubble anchor는 없어 `CODEMAP_MISS`로 좁은 symbol 검색 후 실제 owner 확인.
- 범위: office-live JS/CSS, board 읽기 API, portrait 자산 삭제, 테스트·exact-line fixtures/pins, 본 기록과 증거. 다른 담당 파일을 덮어쓰지 않았다.

## 결과와 증거

- 작은 세로 포스터 대신 1F 큰 액자의 안쪽 그림 영역에 persistent button + img + HTML caption 설치. 기존 배경·흰 매트·금색 액자 유지. 배우 뒤 z-index 2, 배우 sprite z-index 4. 보이지 않는 pseudo-element만 최소 44×44 CSS px로 확장해 폰 터치 영역 확보.
- 전역 휴대폰 버튼 규칙의 `min-height/min-width:40px!important`가 작은 액자를 늘리지 않도록 두 ID를 가진 액자 전용 selector로 시각 최소 크기만 0으로 지정. 44px 터치 pseudo-element는 유지. 기존 디자인 시스템은 수정하지 않음.
- `hani-board.js`의 기존 frozen `queenImages`를 읽기 API에 공개. 전광판과 액자는 **월→이미지 테이블 한 개**와 기존 `queenWinner()` 공유. 새 당선자 계산·저장 경로 없음.
- 수상 다음 달 규칙 유지: 2026-10 수상은 2026-11 KST에만 표시. 이미지 미등록 월·board 부재·층 아트 fallback·다른 층에서는 overlay를 숨김. 이미지 없는 월은 원래 그림 유지.
- 탭하면 기존 말풍선에 `👑 10월의 퀸 · 이름` 표시. 이름은 현재 roster에서 읽으며 퀸 말풍선의 프로필 링크는 숨김.
- 기존 document pointerdown/presence owner에서 같은 `activateActor(event, dismissOnly)`를 호출. 말풍선과 캐릭터 바깥을 누르면 즉시 `closeBubble()`. document listener 추가 없음(소스 호출 지점 2개 유지), 기존 actorLayer click 위임 유지. 다른 배우·배우 자식 노드·명부 항목 탭, 말풍선 내부 링크, 3초 timer·Escape·층 변경 닫기 보존. 인자 없는 합성 presence 이벤트도 처리.
- `assets/queen/poster-2026-10.webp` 삭제. 기존 `assets/queen/2026-10.webp`(1600×400) 재사용, 월별 추가 이미지 없음. 배너 SHA-256 `4003bd67e78e997aec43bf0bfbe37b2042231f1b3b99e873da4a6bff29deff81`.

### 좌표와 비교 PNG

- 근거: `data/hani-building/art-map-v1.json`의 1F 배경 `assets/building/floor-1f-217.webp`, 원본 **1672×941**. 아트맵에 별도 액자 좌표는 없어 실제 아트를 확대해 보라색 안쪽 캔버스를 측정. 아트맵 자체는 수정하지 않음.
- 안쪽 캔버스: **left 1171, top 73, right 1347, bottom 180**, 크기 **176×107 px**(약 1.645:1).
- 퍼센트: left **70.035885%**, top **7.757705%**, width **10.526316%**, height **11.370882%**.
- 이미지 위쪽 86%: `object-fit:cover; object-position:100% 50%`. 아래 14%: HTML `👑 10월의 퀸` 금색 caption, 글꼴 `.65cqw`. 왕관·옷·신발이 이미지 영역 안에 들어옴.
- [비교 PNG](../../../artifacts/lobby-frame/compare.png): 실제 배경과 실제 배너를 CSS 상당 방식으로 Sharp 합성. PC **1440×810**, 폰 **390×219**의 원래 그림/퀸 표시 비교와 액자 확대. **브라우저 스크린샷이 아님.** 직접 이미지 확인, 독립 아린 검토로 보고하지 않음.
- 재생성: `node artifacts/lobby-frame/render-compare.mjs`. 측정값 `geometry.json`, 확대 측정 `frame-measure.png`, 합성 원본 `after-native.png`.

### 최종 검증

Windows PowerShell / Node v24.20.0. 미커밋 최종 office source SHA-256 `bc100b705d67c74e85fb3c595f134359e111ff0672ceb6bef5902fa56245f62a`. 중간 실패 수정 후 최종 코드·delta/pin에서 재실행. 모든 테스트 명령: `node --test-reporter=tap scripts/<이름>.test.mjs`.

| 이름 | 통과 | 실패 |
|---|---:|---:|
| hani-mascots-poster | 22 | 0 |
| hani-office-residents | 36 | 0 |
| hani-office-labels-qa | 17 | 0 |
| hani-office-icons | 13 | 2 |
| hani-office-crowded-labels | 19 | 0 |
| hani-office-obr8 | 2 | 1 |
| hani-office-obr15 | 13 | 1 |
| hani-office-obr21 | 4 | 2 |
| hani-office-hd-224 | 10 | 0 |
| hani-office-consult | 19 | 1 |
| hani-lounge-billboard | 27 | 0 |
| **합계(11명령)** | **182** | **7** |

- skip 0. 실행된 테스트 건수 기준. 실패 7개는 모두 **`spawnSync git EPERM`**. PASS가 아니며 역사적 기준 소스 비교는 허용 환경에서 재실행 필요. guard를 건너뛰거나 완화하지 않음. 정확한 실패 이름·명령·오류: `artifacts/lobby-frame/test-results.json`, 전체 로그: 같은 폴더 각 `.log`.
- 전용22/22: 실제 owner·월 경계·fallback·좌표·44px·전신·바깥 탭·배우 전환·링크·timer·closure 등. 폰 360/390 및 PC 1440 DOM double에서 실제 pointer owner·actor 위임·링크 경로 실행. 타이머 취소·stale timer·다른 배우 탭·말풍선 내부 탭 확인.
- `node --check`: 변경 runtime/test/helper **8/8 통과**, 목록·exit는 `syntax-results.json`.
- `node artifacts/lobby-frame/verify-preservation.mjs`: **11/11 통과**, `preservation.json`. 전체 scene/scheduler/resident owner prefix 바이트 동일(직원·방문객·주민 plans 포함), board는 read-only export만 변경, main/index/board-library 완전 동일, CSS 교체 구간 밖 동일, 보호 저장·Cloud 호출 수 동일, exact resident 복원·tamper 거부·정확한 closure 확인.
- runtime closure **147→146 / 160**, 누락 **0**. 이전 frozen inventory에서 삭제 portrait 1개만 빠짐. 새 inventory hash `73680703cbd8d17cba268db3a5b51f56842843b6dccaf9b3773cfdde61a9cace`.
- 실제 브라우저 레이아웃·native hit testing·폰 실기기·운영 기능은 미검증.

### exact-line fixtures / 보존 경계

- 이전 residents·labels 두 fixture를 **complete-line LCS로 먼저 동일 재현**한 뒤, resident 전 원문에도 같은 승인 UI 패치를 적용해 재생성. resident delta는 resident 변경만 남고 label delta가 승인 UI 변경을 정확한 전체 행으로 복원. 줄 단위 guard·역사적 원문 hash·plan oracle 유지.
- 역사적 label source hash `406937ae1d69c0379bb735e961734b517ae9440a02c93a0d41771dc0c694d246` 유지. resident 전 UI source `672b4fa6b15ef08859822870c7a3ff12d8029a65a972010799391ea5eb33d00f`.
- residents fixture hash `f424f7b4c446c60277a9219dc591ef74c13be2b3edcfb7b89b4977ac2a9f23c7`; labels fixture hash `6b850fdbe8089984f01bf62dcd1c29568e2d1cb67220ea9c5dcc980730e0c50c`. helper/obr8·15·21은 필요한 pin만 갱신.
- 주민 closure 기대값은 포스터 삭제에 맞춰 **139→138**로 정확히 갱신. cap·oracle·assertion 범위 확대 없음. `delta-evidence.json`, 재현 절차 `update-deltas.mjs`.
- 파일별 개행 전체 정규화 없음. runtime은 기존 바이트에 승인 replacement만 적용한 결과와 동일. main/index/board-library의 혼합 개행 포함 바이트 동일.
- `hani_os_life_v23`·내부 버전·저장·Cloud·schema·직원/방문객/주민 일정·인원수 변경 없음. `hani-board-library.js` 미수정. 표시 버전·`?v=` **2.9.259 유지**.

### 변경 파일 / 배포 상태

- Runtime: `hani-office-live.js`, `hani-office-live.css`, `hani-board.js`, portrait WebP 삭제.
- Tests: `scripts/hani-mascots-poster.test.mjs`, `scripts/hani-office-residents.test.mjs`(정확한 closure 수만), `scripts/hani-office-residents-source.mjs`, obr8·15·21 test pin, residents/labels source-delta JSON.
- 기록: 본 인수인계·CURRENT 작업 요약·`artifacts/lobby-frame/` 증거. 다른 담당 파일·과거 기록 보존.
- PR/Preview URL 없음. commit/push/merge/rebase/배포 없음. Candidate Freeze·package·One-Pass·HINA는 요청 범위 밖으로 미실행, 릴리스 PASS 아님.
- main merge / Pages / 운영 표시 버전 / 실제 JS 로딩 / 기능 read-back: **수행하지 않음**. 로컬 index 마지막 정적 script `hani-ai-budget.js?v=2.9.259`; 실제 브라우저 로딩 미검증.

## 다음 담당에게

- 먼저 확인: office-live의 기존 presence 이벤트, `activateActor`, `updateQueenFrame`; CSS `.hani-office-queen-frame`; board의 기존 `queenImages`/공개 API; 비교 PNG와 `test-results.json`.
- 다음 행동: 허용 환경에서 Git 의존 실패 7항목과 PC/폰 실제 Preview 확인. 대표님 요청 없는 commit/push/merge/배포 금지.
- 발견된 기능 코드 blocker 없음. 남은 검증 blocker는 Git·browser subprocess 제한. 데이터·schema·배포 승인으로 확대 해석하지 않음.
- CURRENT에는 최종 검사와 실화면 미검증 상태만 요약. 결정 사항 추가 없음.
- **Notion 갱신 대기**: 현황판 fetch 성공, 착수 append는 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 미완료이므로 갱신 완료로 보고하지 않음. 연결·자동 동기화 완료로 보고하지 않음.
- Notion 갱신 대기 요약: “2026-11-02 KST / Codex qa-b12 / hani/lobby-frame / base28cce59a. 1F 큰 액자에 기존 queen 배너·HTML 금색 캡션, 기존 pointer owner로 바깥 탭 닫기 구현. 지정182통과·7실패(모두 Git EPERM), 전용22/22·주민36/36·syntax8/8·보존11/11, closure147→146/160·누락0. 버전2.9.259·저장/Cloud/schema·plans·board-library 보존. 미커밋·미배포, 실화면·역사적 Git 비교 재검증 대기. 원문: 본 인수인계.”
