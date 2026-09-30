# HANI BOARDROOM · 실제 교차 검토 엔진 변경안

## 현재 상태

운영 함수 v48의 `route_case`는 실제 소집 대상 목록을 반환한다. `run_reviews`는 선정된 전문 Agent들을 `Promise.all`로 동시에 호출하고, 결과 전체를 `hani_agent_reviews`에 한 번에 저장한다. `preflight_case`가 대표 추가 질문을 판정하고, `verify_and_synthesize`가 하니 Final을 작성한다. 따라서 지금의 1차 의견은 서로의 주장을 읽지 못한다. 화면에서 순서대로 보여주는 것만으로는 실제 회의가 아니다.

## 목표 호출 순서

`요청 입력 → create_case → route_case → 소집/회의실 입장 → 1차 Domain Review → 실제 Cross Review → 하니 쟁점 요약 → preflight_case → [필요 시 대표 질문·답변 → Research/2차 Review·재교차] → verify_and_synthesize → 대표 Decision`

회의 패널은 소집 시 먼저 열리되, 서버 결과가 오기 전에는 진행 상태만 표시한다. `HANI Opening`은 실제 Case와 Routing Reason이 준비된 후에만 표시한다. 각 발언은 생성과 저장이 완료된 시점에 나타나며, 로딩 시간을 채우기 위한 가상 대사는 사용하지 않는다.

## 서버 변경 경계

1. 1차 `hani_agent_reviews`는 수정하지 않고 보존한다.
2. 신규 `run_cross_review` 동작은 같은 Case의 실제 1차 Review, Case Context, Research와 Routing만 읽는다. 초대된 Agent가 상대의 **실제 주장** 하나 이상을 인용해 동의·반론·보완하도록 한다. 필요하면 한 번의 재답변을 허용하고 호출 수를 제한한다.
3. 발언은 `case_id`, `round`, `speaker`, `reply_to`, `claim_ref`, `content`, `source_refs`, `unresolved`를 가진 구조화 결과로 검증한다. 근거가 없는 수치·가격·조사결과는 저장하지 않는다.
4. 검증된 회의 발언을 기존 `hani_agent_events`의 새 `CROSS_REVIEW_COMPLETED` 이벤트에 저장한다. 새 테이블이나 schema 변경은 제안하지 않는다. 동일 Case·round 재시도 시 중복 생성·중복 저장을 막고, 실패한 호출은 기존 Review를 보존한다.
5. `preflight_case`와 하니 synthesis는 저장된 Cross Review를 읽어 의견 충돌·미해결 조건을 반영한다. HANI Final은 합의점/이견/누락 조건/추천안/대표 결정을 구분한다.
6. 기본 초대는 하니와 관련 전문가 1~3명이다. 고위험·복합 안건은 필요한 전문가를 늘릴 수 있고, 전문 영역의 판단을 직급으로 덮지 않는다.

## 비용·안전 Gate

- Case당 Cross Review 호출 수와 최대 토큰을 제한한다. 상한 초과·타임아웃 시 가짜 회의로 대체하지 않고 `검토 미완료`로 남긴다.
- 저장된 1차 Review, 대표 답변, 기존 결정 이력을 삭제·덮어쓰지 않는다.
- `hani_os_life_v23`, 내부 기준 버전, Supabase schema 및 기존 Life OS 데이터 경로는 변경하지 않는다.
- 실제 데이터가 없는 발언은 `확인 필요`로 돌리고, 고위험 안건은 유머를 거의 제거한다.
- QA는 실제 Case에서 `상대 주장 인용 → 반론 → 재검토 → 이견이 남은 Final`, 불필요한 Agent 미소집, 질문 없는 직행, 질문 후 같은 Case 재개, 중복 요청·중단 복구를 확인한다.

이 단계는 기존 Supabase 이벤트 `insert` 동작을 확장한다. 저장 구조 변경은 저장소 AGENTS.md §5의 명시적 승인 대상이므로, 현재 브랜치에는 실행 코드를 넣거나 운영 함수를 배포하지 않는다. 우선 UI와 회의 말투 계약만 리뷰 가능한 상태로 준비한다.
