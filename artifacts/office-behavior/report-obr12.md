# obr12 — 성능 여유 확보: 성능 완료 조건 미달 · 보류

2026-10-24 KST · 도연/Codex 단독 · branch `hani/release-train-20261023` · 시작 HEAD `0d470157038dde9fe4ed76194cbb9b287a162361`.

**완료로 판정하지 않는다.** 전체 회귀는 136 PASS / 0 FAIL이고 계획·snapshot의 고정 fixture 바이트 및 deepEqual도 보존했지만, 단독 3회 최대 423.9279ms로 요청한 ≤300ms를 충족하지 못했다. 단독 1회는 기존 400ms 검사도 실패했다. 이 실패를 제외하거나 재측정의 좋은 표본으로 대체하지 않았다.

## 범위와 기준선

- 사용자 명세12: 계산 최적화·233 pending office 승인 기록 재생성·보고서/-o·로컬 커밋만 허용. 버전/cache/index/마스코트/data/ 수정·기준 완화·push/PR/Notion 금지.
- 로컬 origin/main `2cbbe6ed0c14954008208f0db2316b5f09228c2a`, 표시 2.9.232, 최신 UI owner `hani-ui-v02992.js`. 원격 main 조회는 연결 실패로 최신성 미확인. merge/rebase 없음. 운영 화면/실제 JS 로딩 확인과 구분한다.
- 작업 시작 origin/main 캐시는 `d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf`였고 종료 시 공유 ref가 2cbbe6e(PR340: office-places 두 번째 시드)로 진행했다. 차이는 data/hani-building/office-places.json 하나이며 최신 main과 현재 열차의 Git blob이 모두 `2a031576b3a7f5bb5807a73e95df53c681baaedd`로 같다. runtime/index/version 차이0, 현재 검증 입력 변경0. 자동 merge/rebase 없이 원래 열차 기준을 유지했다. 원격 실조회 성공으로 해석하지 않는다.
- CODEMAP living-office owner 파일은 유효하지만 scheduler/targeted-test anchor가 오래되어 CODEMAP_MISS 후 실제 owner 함수와 obr11 인수인계로 범위를 확인했다.
- 실행 경로: 기존 updateBuilding → building.snapshot → scheduler.snapshot → plan/blockPlan → reserve. DOM/Event/Renderer/CSS 변경이나 추가 layer 없음.

## 측정한 원인과 반영한 계산 변경

- 동일한 100μs 요청 간격의 CPU profile: 첫 전체 계획 402.8191 → 347.3663ms, 정규 일정 99.5324 → 87.0612ms, 외출 303.2867 → 260.3051ms. 단일 profile 관측값이며 단독 3회 결과를 대신하지 않는다. 두 경우 모두 정규 8252개·외출 1916개를 전부 계산했다.
- 초기 병목은 blockPlan의 후보 시도/예약 충돌 검사와 반복 경로·기하 계산이었다. [수정 전 CPU profile](obr12-before.cpuprofile), [수정 후 CPU profile](obr12-after.cpuprofile), [수정 후 함수별 표본](obr12-profile-summary.json).
- Dijkstra를 고정 anchor 순서의 숫자 인덱스/typed array로 계산한다. heap의 동일 거리 insertion tie 순서는 유지했다.
- 경로 leg의 고정 길이·resources/floors, 정규 홈 이벤트의 읽기 전용 people/resources/floors, 야간 홈, 시간대 리듬을 재사용한다. 동일 seed 접두사의 FNV 상태도 재사용하며 연산 순서는 바꾸지 않았다.
- 경로 구간과 좌석이 침범하는 홈 owner 집합을 기하별로 캐시한다. 기존 20.01/24.01px 식을 그대로 계산하고 본인 홈 제외 규칙도 동일하다.
- 한 분 bucket 조회는 중복 Set을 만들지 않는다. stationary actor/resource 검사 이후 capacity/transit/sweep은 이동 예약만 받는다. 그룹 FIFO의 같은 endpoint 검사는 임시 배열 대신 같은 네 항의 비교를 쓴다.
- gathering 연장 scratch는 원본 전체 ledger를 복제·재인덱싱하지 않고 필요한 overlap과 이미 수락한 연장만 검증한다. 수락/거절, 원자적 갱신, 기존 인덱스 무효화는 유지한다.
- 더 복잡한 층 mask/box/선행 카드 reachability/추가 stationary pruning 후보는 메모리 실험에서 300ms를 달성하지 못해 최종 소스에 넣지 않았다. 실험 소스·로그는 로컬 artifacts에 보존했다.

## 결과 동일성과 승인 기록

- 기존 office-obr6/obr8/obr10-v5 계획 및 route/tie oracle, obr7 문구 delta 파일은 변경0. 원래 formal/outings/snapshot JSON 문자열 비교와 deepEqual을 그대로 실행했다.
- 새 obr12 회귀 5개: 원본 Git 0d47015 runtime SHA-256을 고정하고 평일/주말/심야 경계·여러 presentIds·회장 동석·역순 조회·cancel/summon/reduced를 비교했다. 전체 계획 2종과 70쌍 snapshot의 JSON byte/deepEqual, storage write 0 확인.
- obr6의 현재 runtime identity만 새 소스 SHA에 엄격히 고정하고, 종전 identity는 고정 Git 원본과 기존 obr10 oracle의 hash가 같은지 별도로 확인한다. 고정 행동 expected 결과를 새 결과로 덮어쓰지 않았다.
- pending 233 office fixture의 runtime exact fragment만 고정 base 7a10595에 대해 재생성했다. before/after 유일성 및 전체 역변환 바이트 일치 확인. milestones/hero fixture와 release-chain/부정 검사는 그대로다.

## 단독 3회와 suite 성능

다른 suite·감사·profile와 동시에 실행하지 않고 새 Node 프로세스에서 기존 `node scripts/hani-office-lively-v2.test.mjs`를 순서대로 3회 실행했다. 기존 <400ms/<3ms assertion과 명세의 ≤300ms 목표를 구분한다.

|회차|첫 전체 계획 ms|warm snapshot ms|≤300ms|기존 파일 검사|
|---|---:|---:|---|---|
|1|423.9279|0.6417|미달|7 PASS / 1 FAIL|
|2|395.5199|0.6056|미달|8 PASS / 0 FAIL|
|3|340.0060|0.6523|미달|8 PASS / 0 FAIL|

- 최대 첫 계획 **423.9279ms → 목표 FAIL**. 최대 warm **0.6523ms → <3ms PASS**.
- 최종 전체 suite 내부 첫 계획 **330.8559ms**, warm **0.5811ms**. 원래 <400ms 검사 PASS, 여유 69.1441ms. 단독 실패를 상쇄하는 근거로 삼지 않는다.
- [단독1](obr12-performance-1.log) · [단독2](obr12-performance-2.log) · [단독3](obr12-performance-3.log). 재시도에서 좋은 3개를 골라 PASS 처리하지 않았다.

## 회귀·감사·보호

|검사|결과|근거|
|---|---|---|
|canonical office/building suite|136 PASS / 0 FAIL / 3 선택 browser SKIP|[최종 로그](obr12-all-tests-final.log)|
|pending 승인 기록|8 PASS / 0 FAIL|[로그](obr12-approval.log)|
|새 원본 동등성|5 PASS / 0 FAIL|[로그](obr12-equivalence.log)|
|감사|54,000 snapshot, frozen/mismatch/stuckSeconds/near30/near24 모두0|[로그](obr12-audit.log)|
|syntax/whitespace/금지 경로|PASS, 보호 경로 변경0|[보호 기록](obr12-safety.json)|
|Local/Cloud/schema|새 write/remove/clear 경로0, 기존 데이터/저장 로직 변경0|기존 safety·새 VM deny-write 검사|

- 첫 전체 실행은 135 PASS / Git subprocess EPERM 1 FAIL / browser SKIP3이었다. [실패 원문](obr12-all-tests.log)을 보존했다. 역사 원본 137개를 native Git object와 SHA-256으로 확인한 뒤 기존 read-only preload로 같은 Git bytes를 공급하여 canonical suite를 재실행했다. 현재 소스를 역사 원본으로 대체하거나 assertion을 바꾸지 않았다. [원본 대조](obr12-historical-verification.json).
- 실제 브라우저·회장님 PC/휴대폰의 frame stall/체감·실제 Cloud 왕복은 미검증이다. Browser SKIP을 PASS로 계산하지 않는다. 버전 증가/Build/Candidate/One-Pass/HINA/Preview/Production은 이번 기능 작업과 명시 금지에 따라 미실행이다.

## 현재 시각 우선 / 분할 계산 검토와 남은 작업

- 현재 알고리즘은 시간순 레저 수락 → 모임 연장 → 빈 시간 보충 → 심부름 → 방문객 → 응대의 전일 예약·novelty·pair budget에 의존한다. 현재 시간대만 먼저 수락하면 다른 시간대의 결정이 달라질 수 있다. 결과와 동기 API 계약을 보존할 근거 없이 순서를 바꾸거나 별도 renderer/event layer를 추가하지 않았다.
- canonical 순서를 유지한 bounded generator/idle continuation과 기존 화면의 비동기 readiness 처리 설계는 가능성만 검토했으며 구현·검증하지 않았다. 이번 소스의 첫 계산은 여전히 동기식이라 긴 메인 스레드 점유 문제가 해결됐다고 보고하지 않는다.
- **다음 행동:** 300ms 최대값과 단독 400ms 실패가 해결될 때까지 성능 작업을 계속해야 한다. 이후 같은 최종 runtime으로 단독3회·canonical suite·승인 기록·감사를 다시 확인한다. 현재 작업은 성능 완료/Release 승인/운영 반영 상태가 아니다.
- push/PR/Notion/main/배포 없음. 공통 CURRENT/DECISIONS와 타 담당 기록은 보존했다. [작업 인수인계](../../docs/development-history/handoffs/2026-10-24-office-obr12.md).
- **로컬 커밋도 미생성:** 승인된 26개 파일만 지정한 git add가 `.git/worktrees/obr/index.lock: Permission denied`로 거절됐다. commit은 실행하지 않았고 권한 우회/재시도 없이 미커밋 파일을 보존했다. HEAD는 시작 0d47015 그대로다.

최종 runtime SHA-256: `6cd4b68f14aa435d3de6d00e4b535ca74ebf6baed225b0c818506e911e3d2b21`. 전체 수치와 판정: [JSON](obr12-results.json).
