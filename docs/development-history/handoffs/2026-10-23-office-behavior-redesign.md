# 작업 인수인계 — 본사 직원 행동·이동 재설계

## 작업 식별

- 작업 ID / 제목: office-behavior-redesign / 본사 직원 행동·이동 설계 새로 하기
- 갱신 시각(KST): 2026-10-23
- 담당 도구 / 검토 담당: Claude Code(서윤, 설계·검토·브라우저 확인) + 도연(Codex, 구현) / 아린(Gemini via agy, 창가 자리 UI 리뷰)
- 상태: **탑승 대기** (기능 구현·검증 완료, 배포 열차 대기)
- 저장소 / branch / worktree: HANI_OS_DEV / `hani/office-behavior-redesign` / `HANI_OS_DEV_CLAUDE/obr`
- base SHA: `ad3c2f3` (origin/main) · 구현 커밋 `ce6b657`
- 목표 / 완료 조건: 행동 문구·실제 위치·이동 경로가 항상 맞고, 좌석·지점이 겹치지 않는 단일 상태기계.
- 수정 파일: `hani-office-live.js`, `data/hani-building/{art-map-v1,spatial-contract,office-places}.json`, `assets/data/office-actions-{216,221}.json`, office/building 테스트 스크립트, 새 테스트 `scripts/hani-office-behavior{.test,.browser,-data,-overlay}.mjs`.
- 사용자 승인 근거: 성민 회장님 2026-10-23 "추천안대로 진행해. 창가는 실제 창 앞에 자리를 새로 만들고(아린 리뷰), 방문객도 같이 정리해." 배포·main 병합은 승인 범위 밖(배포 열차 규칙).

## 결과와 증거

- 변경 내용(설계 문서 3장 그대로)
  - 장소 카드 22개(`office-places.json`): 층에 있는 장소만 선택. 3층 커피 없음.
  - 상태기계 AT_HOME → GOING → AT_PLACE → RETURNING, 문구는 상태에서만. 이동 중엔 "○○ 가는 중", 도착 후에만 행동 문구.
  - `reserve()` 장부 하나: 정식 행동(하루 plan)·산책·방문객(10분 블록)이 슬롯 독점, 남의 home 금지(비어 있어도), 경로-타인 home 24px, 정지 20px/이동 24px 근접 검사.
  - 복도 `hall_*` 좌표를 문 앞마다 분리, 좁은 경로 이동. 이동 시간은 화면 거리(1672×941, 180px/s).
  - 삭제: `idlePools.stroll`, `strollPlan/idleStroll`, `visitPlan/visitorAt`, snapshot 사후 되돌리기·방문객 사후 필터·라운지 사후 덮어쓰기.
  - 창가 슬롯 5개: 1F 카페 통유리(92,40), 2F 팬트리 통창(83.5,19), 3F 개발실 라운지 통창(33.5,18.5), 4F 공용 복도 끝 유리창(51,13), 5F 가운데 길 끝 난간(50,89). 아린 1차 리뷰에서 2·3·5층 수정 요청 → 이동 후 재리뷰 전체 PASS. 4F는 회장실 안에서 공용 복도로 서윤이 옮김.
  - 방문객은 전용 문구 유지("상담 받는 중", "배달 왔습니다!", "안녕히 계세요~" 등).
  - 221 밤 행동: 창밖 야경 → 창가 슬롯으로, 장소 단어가 있던 presence_home 행동 문구 정리. 216 `sig-seongmin-4` 제목 1건 정정.
- 실행한 검증 (모두 `ce6b657` 작업 트리, Windows, Node v24, Edge)
  - 전체 office/building 회귀: `scripts/hani-office-behavior-run-tests.ps1` → **103개 중 100 PASS / 0 FAIL / 3 SKIP**(SKIP = 별도 실행하는 브라우저 검사).
  - 새 브라우저 테스트: `node scripts/hani-office-behavior.browser.mjs <playwright> <msedge>` → **PASS, 1,110 장면 확인, 스크린샷 30장**(390/884/1440 × 1F–5F × 일반/동작 줄이기), 저장소 쓰기 0, actor DOM 재생성 0.
  - 감사(`docs/drafts/office-behavior-redesign/audit.mjs`, 2026-10-22 08–23시 매초): 0px 보행 26→**0**, 문구·위치 불일치 268→**0**, 30px 이내 근접 12→**0**.
  - 기대값을 바꾼 테스트와 이유: `artifacts/office-behavior/report.md` "변경한 테스트 기대값과 이유" + 서윤 추가분(공간 SHA 갱신 2회: 창가 위치 이동, 방문객 전용 문구 기대값).
- 실행하지 않은 검증 / 남은 위험
  - 기존 `hani-office-actions-216.browser.mjs`, `hani-office-actions-221.browser.mjs`, `hani-office-217/fix-218.browser.mjs`는 이번에 실행하지 않음 → 열차 후보에서 실행 필요.
  - 운영(Pages) 화면 확인은 배포 전이라 N/A.
  - 외출이 안전 예약에 걸리면 출발하지 않으므로, 붐비는 시간에는 산책 빈도가 조금 줄 수 있음(lively 기준은 통과).
- 데이터·저장소·Cloud·schema 영향: 없음. `hani_os_life_v23`·Supabase 미접촉, 본사 코드 저장소 쓰기 0(브라우저 테스트 확인). 버전·`?v=` 미변경. `index.html`, `hani-desk-mascots.js` diff 0.
- 책상 마스코트 계약: `HaniBuildingScene` 기존 export·`canon.people[].homeAnchor`·`art.anchors`·`anchors`·`floors`·`#haniOfficeMap` 속성 유지. canon anchor 수만 326→331(창가 5개 추가), 개인 home 좌표 불변.

## 다음 담당에게 (배포 열차)

- 함께 배포할 서버 Edge Function·설정: 없음.
- **data/ 파일 순서(서윤 팀장님 안내: release package는 data/를 싣지 않음)**: `data/hani-building/office-places.json`(새 파일, 창가 5개 지점·연결·좌표 포함)과 `art-map-v1.json`(복도·경로 좌표만 수정)은 release PR 전에 **시드 PR**로 main에 먼저 넣는다. `spatial-contract.json`은 main과 byte 동일(326 지점, SHA `d02426b4…`)로 되돌렸다.
  - 데이터가 먼저 들어가도 안전: 운영 2.9.230 코드의 지도 수락 조건(326개·모든 지점 art 좌표) 통과 확인. 운영에선 복도 제자리 멈춤만 먼저 좋아짐.
  - 코드가 먼저 나가도 안전: office-places.json 404에서 화면 정상(장소 0, 지점 326, 직원 표시 정상), 외출만 쉼(Edge 확인).
  - 런타임은 장소 파일의 창가 지점을 **복사본**에 합침(불러온 지도 객체 변경 없음).
  - 서윤 팀장님 합의(10/23): 시드 PR에 office-219 등 art 좌표 불변 테스트 갱신을 함께 넣는다(main 테스트 실패 금지). art-map은 수정 파일이라 머지 즉시 운영 코드(2.9.231)에 반영되므로 ① PR 설명에 "운영에 즉시 반영되는 좌표 변경" 명시 + 회장님 별도 승인 ② 머지 후 운영에서 산책·복도 이동 read-back. 2.9.231 머지 후 그 main 기준으로 Edge 재확인.
- 버전은 2.9.232 이후(2.9.231 = 서윤 책상 마스코트 예정). 열차 후보에서 버전·캐시 태그를 한 번에 올리고 기존 office browser 스크립트를 함께 실행.
- office-219 index 기준선은 release SHA로 갱신 필요(이전 담당 메모).
- blocker: 없음. 회장님 Preview 확인 후 열차 탑승.
