# 건물 Phase 2 · 새 5F와 6F 옥상

2026-11-21 KST · 도연/Codex · 단일 Agent. `hani/building-5f`, 고정 base `23c14e381b8dda9f4d8e4954986a44f864b08b16`. 구현·시험 실행 정리 완료, 실화면·cold 성능 gate와 잔여 제약은 서윤 인계. commit·push·배포·Notion은 지시대로 서윤 담당이다.

## 바뀐 곳

- `hani-office-live.js/css`: 새 5F `creative` 등록, 상주 0명·방문 최대 4명, 기존 승강기 이동·persistent actor·클릭 위임 경로 재사용. 구역 4개 HTML 버튼과 메뉴 9개 연결. 모바일은 2열×3행 탭과 지도 아래 44px 구역 버튼을 사용한다.
- `spatial-contract.json`, `art-map-v1.json`: 앵커 33개 추가(326→359), 방·좌석·복도·왕복 경로·실측 승강기 문턱 `(837,178)` 등록. 새 runtime JS/그림 생성 0개, 납품된 5F 그림을 연결했다. 1F 그림과 기존 앵커·직원 home·방 데이터는 보존했다.
- 옥상 내부 ID `5f` 유지, `order:6`으로 꼭대기와 `6F 옥상` 표시. 향후 등록부의 order 한 값으로 `7F 옥상` 표시 가능. 옥상 기존 아트·주민 시간표는 유지했다.
- 세린 사전 QA 6건: 검증 실패 경고 1회, 실제 fallback 탭 수, 문자열 기반 cap 캐시 키, 존재하는 기본 층 선택, 신규 층 anchorCount 누락 거절, 등록부 이동 문구·미등록 순찰 문구 fallback을 보완했다.

## 5F 시간표 요약 · KST

| 시간창 | 구역 / 방문 후보 |
| --- | --- |
| 평일 08:30–09:15 | 방송: 민지·유나 또는 하니, 일보 |
| 평일 11:30–12:15 | 방송: 민지·지은·다온, 시황 4컷(상한 3명) |
| 평일 12:15–13:00 | 피트니스: 나은·수연 / 시네마: 하루·민지 |
| 평일 15:00–16:00 | 방송: 지은·하니 / 도서관: 히나·윤슬 |
| 평일 18:30–21:00 | 운동: 나은·아린·서윤 / 독서·시네마: 히나·하루·재실 성민 |
| 주말 09:00–19:00 | 키즈·펫: 재실 회장님 가족 방문, 펫 1~2마리 순환 외출 |

후보 전원이 계속 상주하는 시간표가 아니다. 날짜·시각 해시와 기존 예약·재실·좌석·개인 휴식 45분/타층 이동 90분 간격으로 빈 구간만 예약한다. 심야 근무자는 운동으로 차출하지 않는다. 점심 방문은 해당 인물의 기존 점심 한 건을 재사용할 수 있으며, 별도 두 번째 휴식을 만들지 않는다. 기존 일일 원장은 변경하지 않는다. 수현·수연의 `createKidsVisits`, `companionActivity`, `kidsVisitLines` 원문과 우선권을 유지했다. 부서 동물은 평소 기존 부서, 주말에만 5F 외출한다.

## 서윤 화면 확인 목록

모두 **PC 1440×900 / 폰 390×844**, 라이트·다크, 5F 선택 후 확인. 실제 Edge는 이번 재개 환경에서 `spawn EPERM`이므로 아래는 **촬영 지시이며 최종 화면 PASS 증거가 아니다**. `local/`의 이전 PNG·browser-results도 중단 시점 참고 자료다.

| KST 고정 시각 | 확인할 장면 |
| --- | --- |
| 2026-11-23 08:32 | 민지·유나 스튜디오, HTML 이름표 4개, 6탭 및 맨 위 옥상 |
| 2026-11-23 11:31 | 다온의 시황 4컷 방문(기존 예약 때문에 민지·지은은 양보 가능) |
| 2026-11-23 12:17 / 12:54 | 나은 운동 / 하루 시네마(기존 점심 재사용) |
| 2026-11-23 15:02 / 15:44 | 뉴스룸 / 히나 도서관 |
| 2026-11-23 18:32 / 19:23 | 나은 운동·히나 독서 / 아린 운동 |
| 2026-11-21 09:02 / 17:59 | 주말 펫 순환 / 회장님과 남매의 5F 방문, 남매 장면 우선·겹침·승강기 이동 |

이름표·하단 메뉴에서 `ilbo`, `newsroom`, `investmentCommittee`, `reading`, `study`, `movie`, `exercise`, `diet`, `board`를 각각 확인한다. 배우와 겹치는 부분은 배우 클릭이 우선이며 이름표의 노출 부분 또는 하단 버튼을 사용한다. 모바일 가로 overflow·키보드 Enter/Space·가려진 층 링크 차단·배우 말풍선도 확인 대상이다.

## 검증

전체 `scripts/*.test.mjs` **293개를 각각 단독 실행**: **PASS 191 / 기존 FAIL 30 / 미검증 72**. 일반 실패는 독립 Phase 1 Git 입력에서도 같은 첫 오류·실패 검사명이 재현됐으며 신규 기능 회귀는 확인되지 않았다. Git EPERM·기존 URL/path 어댑터·브라우저 모듈/인자·전체 skip은 PASS로 세지 않았다. [파일별 결과](TEST-RESULTS.md) · [해시·검증 근거](VALIDATION.json).

사무실 기존 perf를 `node --test-name-pattern="warm snapshot" scripts/hani-office-lively-v2.test.mjs`로 **2회 단독 재시도**했다: warm **1.265/1.256ms PASS**(`<3ms`), cold best **490.3/488.3ms FAIL**(`<400ms`). 기존 입력의 cold 기준 미달을 유지하며 기준을 완화하지 않았다. raw 교차 warm 평균은 Phase 1 **2.012ms → 현재 2.364ms(+0.352ms)**로 측정했다. 참고값이며 브라우저 100ms 틱 성능 PASS로 사용하지 않는다.

착수 2533개 파일 해시 대조: 허용한 기존 코드/시험 6개와 작업 인수인계 문서 외 예기치 않은 변경·누락 0. 시험 JSON 5개를 착수 바이트로 복원하고, 신규 생성 28개를 `local/`로 이관했다. 로그·PNG·사본은 `local/`(.gitignore)에 보존한다.

신규 `node scripts/hani-building-phase2.test.mjs`는 **14/14 PASS**. 앵커 33개를 하나씩 제거한 입력 거절, 기존 층 144개 시각의 직원 위치 동일(방문 비활성), 원래 앵커·home·아트 좌표 보존, 방문·쿨다운·소집·부재·주말·DOM 메뉴 동작을 검증했다.

시험층은 **building-phase2 → building-phase1 → office-motion → 306 → 기존 체인**이다. 최외곽 inverse 4개 owner는 고정 Git 객체 원문과 일치했다. 기존 파일 연결은 아래 **각 1줄뿐**이며 기존 단언·fixture·hash는 변경하지 않았다.

- `scripts/hani-building-phase1-source.cjs`: Phase 2 preload require 1줄.
- `scripts/hani-ieum-seat.test.mjs`: Phase 2 preload import 1줄.

신규 source/preload·`scripts/fixtures/building-phase2-layer.json`은 정확한 전체 after hash에서만 역변환하고, 변형 입력은 승인하지 않는다. 저장·Cloud·친밀도·도우미 신규 접근 0, 타이머·리스너 수 증가 0. 기존 보호 저장 키·기준 버전·표시/cache `2.9.306`·보호 경로는 유지한다. syntax와 CR-at-EOL을 인지하는 `git diff --check` 통과. 원문 runtime closure 174/200·누락 0이며 동적 건물 아트는 별도 seeded 자산이므로 실제 배포 파일 read-back은 서윤 확인 대상이다.

## 남은 경계 / Phase 3

원격 `git ls-remote`는 연결 실패했으나 **GitHub 연결 도구로 최신 main `cd916e28466a17dfe5723fbce41ab3d0930522ec`를 확인**, 로컬 origin/main과 일치했다. 원격 `hani-main.js` blob `651a1b0e…`도 로컬과 같아 소스 표시 버전 `2.9.306`을 확인했고, 원격 index의 마지막 JS는 `hani-launch-greeting.js`다. 자동 merge/rebase 없음. 실제 PC/폰 최종 화면·100ms 브라우저 틱·Preview·Candidate/One-Pass/HINA·Production 실제 표시/JS 로딩·운영 read-back은 미검증이다. 버전·이력 갱신과 main 병합·배포·Notion 갱신은 수행하지 않았다.

공통 조상 `077df04` 이후 main 쪽 차이는 **17개 문서·시험 도구 파일**이며 이번 runtime owner 4개 변경은 0이다. 이 branch에 자동 통합하지 않았다. 서윤이 열차 통합할 때 최신 tooling-306/helper 시험층과 Phase 1의 내장 306 역변환 연결·중복을 확인해야 한다. 아래 전체 시험은 현재 branch에 있는 파일 기준이다.

Phase 3은 새 1F `floor-1f-v2.webp` 편입, HANI 24·로비·카페/기본 NPC, 승인 범위 내 기업솔루션의 2F 이동 및 남매 무충돌 검증이다. 이번에는 1F 개편·부서 이동·NPC 추가를 수행하지 않았다. 서버 Edge Function·설정·schema 변경 및 별도 배포 순서 없음. 서윤이 최종 화면·잔여 시험을 확인하고 배포 열차 절차를 이어간다.
