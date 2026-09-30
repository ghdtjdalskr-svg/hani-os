# HANI BOARDROOM · 실제 교차 검토 후보 구현

## 현재 상태

운영 함수 v48의 `route_case`는 실제 소집 대상 목록을 반환한다. `run_reviews`는 선정된 전문 Agent들을 `Promise.all`로 동시에 호출하고, 결과 전체를 `hani_agent_reviews`에 한 번에 저장한다. `preflight_case`가 대표 추가 질문을 판정하고, `verify_and_synthesize`가 하니 Final을 작성한다. 따라서 지금의 1차 의견은 서로의 주장을 읽지 못한다. 화면에서 순서대로 보여주는 것만으로는 실제 회의가 아니다.

## 목표 호출 순서

`요청 입력 → create_case → route_case → 소집/회의실 입장 → 1차 Domain Review → 실제 Cross Review → 하니 쟁점 요약 → preflight_case → [필요 시 대표 질문·답변 → Research/2차 Review·재교차] → verify_and_synthesize → 대표 Decision`

회의 패널은 소집 시 먼저 열리되, 서버 결과가 오기 전에는 진행 상태만 표시한다. `HANI Opening`은 실제 Case와 Routing Reason이 준비된 후에만 표시한다. 1차 의견은 저장 후 표시하고, 교차 발언은 해당 라운드의 Event 저장이 끝난 뒤 한 번에 표시한다. 현재 후보는 발언별 실시간 스트리밍을 제공하지 않으며, 로딩 시간을 채우기 위한 가상 대사는 사용하지 않는다.

## 서버 변경 경계

1. 1차 `hani_agent_reviews`는 수정하지 않고 보존한다.
2. 신규 `run_cross_review` 동작은 같은 Case의 실제 해당 라운드 Review, Case Context, Research와 Routing만 읽는다. 최대 3명의 초대된 전문 Agent가 상대의 **실제 주장 또는 앞선 발언**을 대상으로 동의·반론·보완한다. 전문 Agent가 한 명인 안건은 하니가 논점을 먼저 제시한다.
3. Event payload의 발언은 `review_round`, `turn_id`, `speaker`, `reply_to`, `claim_ref`, `content`, `source_refs`, `unresolved`를 가진 구조화 결과다. 참조 식별자와 발언 길이는 서버가 검사하고, 사실·수치의 근거는 모델 지침과 최종 검증에 의존한다. 따라서 실제 자료에 없는 수치가 절대 저장되지 않는다고 보장하지 않는다.
4. 검증된 회의 발언을 기존 `hani_agent_events`의 새 `CROSS_REVIEW_COMPLETED` 이벤트에 저장한다. 새 테이블이나 schema 변경은 없다. 같은 Case·round의 순차 재시도는 저장된 Event를 재사용하고, 실패한 호출은 기존 Review를 보존한다. **동시에 들어온 두 요청의 완전한 중복 방지는 DB 고유 제약 없이 보장하지 못하므로** 클라이언트는 중복 제출을 막고 Release QA에서 이 위험을 확인한다.
5. `preflight_case`와 하니 synthesis는 저장된 Cross Review를 읽어 의견 충돌·미해결 조건을 반영한다. HANI Final은 합의점/이견/누락 조건/추천안/대표 결정을 구분한다.
6. 기본 초대는 하니와 관련 전문가 1~3명이다. 고위험·복합 안건은 필요한 전문가를 늘릴 수 있고, 전문 영역의 판단을 직급으로 덮지 않는다.

## 비용·안전 Gate

- Case당 Cross Review 호출 수와 최대 토큰을 제한한다. 상한 초과·타임아웃 시 가짜 회의로 대체하지 않고 `검토 미완료`로 남긴다.
- 저장된 1차 Review, 대표 답변, 기존 결정 이력을 삭제·덮어쓰지 않는다.
- `hani_os_life_v23`, 내부 기준 버전, Supabase schema 및 기존 Life OS 데이터 경로는 변경하지 않는다.
- 실제 데이터가 없는 발언은 `확인 필요`로 돌리도록 지시하고, 고위험 안건은 유머를 거의 제거한다. 수치의 사실 검증은 별도 실제 Case QA 항목으로 남긴다.
- QA는 실제 Case에서 `상대 주장 인용 → 반론 → 재검토 → 이견이 남은 Final`, 불필요한 Agent 미소집, 질문 없는 직행, 질문 후 같은 Case 재개, 중복 요청·중단 복구를 확인한다.

성민 대표님의 명시적 승인 후 후보 구현을 현재 브랜치에 추가했다. 함수 변경은 `docs/hani-agent-orchestrator-boardroom-voice.patch`와 `docs/hani-agent-orchestrator-boardroom-cross-review.patch`에 보존한다. `scripts/hani-boardroom-rebuild-edge.mjs`로 운영 v48 기준선을 재구성해 두 패치를 순서대로 적용할 수 있다. 클라이언트는 각 `run_reviews` 뒤에 `run_cross_review`를 호출하고, 서버가 저장한 발언만 회의 화면에 표시한다. 운영 함수 배포와 Production read-back은 아직 실행하지 않았다.
