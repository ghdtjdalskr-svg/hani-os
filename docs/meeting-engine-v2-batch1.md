# AI 결재실 Meeting Engine v2 · Batch 1

## 기준선

- 최초 구현 기준선: `4f011be` · HANI OS v2.9.123
- 통합 기준선: `01efcec` · HANI OS v2.9.125 (자산 업데이트 변경 보존)
- 현재 Preview 표시 버전: v2.9.126
- 배포 Orchestrator 기준선: `hani-agent-orchestrator` v46
- 배포 함수 원문 SHA-256: `fc36b8594ceff62fb6cdb8c3b51956ede4dd966b9e7297775554461a7decd16a` (v46/v1.8.1)
- 구현 브랜치: `hani/meeting-engine-v2-batch1`
- 기존 Living Office, Agent Summon, Meeting UI, Character Portrait, Action Preview는 유지한다.

## 구현 전 Fact Check A–H

- **A. 현재 Meeting Flow**: `classify_request → create_case → route_case → run_reviews → preflight/research → verify_and_synthesize → representative_decision` 순서다.
- **B. 고정 결론 원인**: 복구 경로가 3차 Review부터 `force_finalize_with_current_context`를 자동 전송하고, 서버 질문 예산 정책이 실제 blocker를 라운드 수로 조건부 항목으로 내릴 수 있었다.
- **C. Clarification 제한 위치**: 서버 `applyHumanQuestionBudgetPolicy`의 LOW/MEDIUM 구매안건 질문 라운드 상한과 클라이언트 복구 경로에 분산돼 있었다.
- **D. Case Resume**: 기존 `apply_representative_context`와 동일 `case_id` Review 재호출이 있어 가능하다. 이번 패치는 `HELD`에서도 재개할 수 있게 한다.
- **E. 최소 변경 설계**: 기존 JSONB 안에 선택 필드를 추가하고, HANI Synthesis와 승인 앞에 동일 Readiness Gate를 둔다.
- **F. 수정 범위**: `hani-main.js`, `hani-style-07.css`, `index.html`, 운영 v46 재구성·변경 패치, 검증 스크립트, 문서와 Preview다. 함수 전체 복제본은 커밋하지 않는다.
- **G. 데이터/Cloud 영향**: schema, migration, `hani_state`, `hani_os_life_v23`, Cloud Sync 의미는 변경하지 않는다.
- **H. 회귀 위험**: 과거 Verification에는 새 `decision_status`가 없으므로 UI가 기존 `ready_for_decision + PASS`를 안전한 fallback으로 사용한다. Orchestrator는 실제 배포 전 별도 Gate와 read-back이 필요하다.

## Batch 1 구현

### Decision Readiness Gate

Verification 이후 다음 `decision_status` 중 하나를 기존 `verification` JSONB에 저장한다.

- `READY`
- `NEED_USER_INFO`
- `NEED_RESEARCH`
- `UNRESOLVED`
- `HOLD`

`READY`이고 Verification이 `PASS`인 경우에만 HANI Executive Synthesis를 생성한다. 그 외 결과는 `hani_final={}`와 Case `HELD`로 저장한다. 따라서 정보가 부족한 상태가 더 이상 `하니 최종 결론`으로 표시되지 않는다.
HANI Synthesis 자체가 `ready_for_decision=false`를 반환해도 이를 강제로 `true`로 바꾸지 않고 `HOLD`로 보존한다.

### Blocking Question

- `decision_blockers`와 `human_required_questions`만 BLOCKING으로 취급한다.
- 한 번에 최대 2개만 표시한다.
- `conditional_checks`는 USEFUL, `optimization_questions`는 OPTIONAL로 분리한다.
- USEFUL/OPTIONAL 부족만으로 Case를 HOLD하지 않는다.
- Review Round 수가 늘었다는 이유로 실제 blocker를 조건부 항목으로 강등하지 않는다.

### Clarification / Same Case Resume

- Case 생성 전 `prompt()`로 묻던 일회성 질문 경로를 제거한다.
- 먼저 Case를 생성하고, 답변은 같은 `case_id`의 `context.representative_answers`에 저장한다.
- 이전 답변은 `representative_answer_history`에 보존한다.
- Review는 삭제하지 않고 다음 Round를 추가한다.
- Case가 `HELD`여도 대표 답변 적용과 Research 재개를 허용한다.
- 질문이 없는 `HELD` Case에도 추가 조건 입력 및 동일 Case 재확인 경로를 제공한다.
- 질문 답변과 함께 `additional_condition`을 같은 Context에 누적할 수 있다.

### 대표 결재 Gate

- UI 승인/보류/반려/수정 버튼은 HANI Decision이 있고 `READY + PASS + AWAITING_APPROVAL`일 때만 활성화한다.
- 서버는 `APPROVE` 요청에 대해 동일한 readiness 조건을 다시 검증한다.
- Decision 생성과 Life OS Commit은 계속 분리된다.

## 기존 데이터 영향

- `hani_os_life_v23`: 변경 없음
- Supabase schema/migration: 없음
- Cloud Sync semantics: 변경 없음
- 기존 Case/Review/Event/Decision 삭제 또는 변환: 없음
- 기존 JSONB에 선택 필드만 추가하므로 과거 행은 그대로 읽을 수 있다.

## Batch 2 설계 연결점 — 구현하지 않음

향후 `hani_agent_reviews`의 기존 독립 Review를 유지하면서 HANI가 `issues[]`를 추출하고, 각 Issue에 필요한 Agent만 Cross Review하는 구조로 확장한다. 권장 Issue 계약은 `issue_key`, `participants`, `agreement`, `objection`, `missing_condition`, `alternative`, `agreement_conditions`, `resolved`이다. 이번 Batch에서는 새 필드, 호출, UI를 추가하지 않는다.

## Batch 3 설계 연결점 — 구현하지 않음

HANI Decision의 `deliverable_type`을 입력으로 별도 Builder가 Structured Preview를 만들고 Validator가 필수 필드·수치·일정·Decision 일치성을 검사하는 단계로 확장한다. XLSX/PDF와 HANI OS Action Candidate는 Validation PASS와 대표 승인 뒤 기존 저장 경로를 사용한다. 이번 Batch에서는 Builder, 파일 생성, Validator, Commit 확장을 구현하지 않는다.

## 검증 시나리오

- A: 불완전한 오사카 여행 요청 → BLOCKING 2개 이하 → 같은 Case 답변 → READY 후에만 Decision
- B: 중요 정보/무결성 문제 미해결 → `HOLD`, HANI Decision 미생성
- C: `호텔은 난바 근처` 추가조건 → 같은 Case Context 누적, Review 이력 보존
- D: 카페 취향 같은 OPTIONAL 부족 → READY 가능, 반복 질문 없음

## 검증 명령과 산출물

- 클라이언트 시나리오: `node scripts/hani-meeting-engine-v2-client.test.mjs`
- 서버 패치 재구성 시나리오: `node scripts/hani-meeting-engine-v2-batch1.test.mjs`
- Desktop/Mobile UI: `node scripts/hani-meeting-engine-v2-ui-smoke.mjs`
- 정적 설명 Preview: `docs/ai-approval-meeting-engine-v2-batch1-preview.html` (운영 Case와 분리)
- 운영 v46 재구성 패치: `docs/hani-agent-orchestrator-v46-baseline.patch`
- 운영 v46 대비 검토 패치: `docs/hani-agent-orchestrator-meeting-engine-v2-batch1.patch`

테스트는 Git의 v1.8.0 원본에 v46 재구성 패치를 적용해 배포 함수 원문 해시를 확인하고, Batch 1 패치를 적용해 시나리오를 실행한다. 실제 배포 시 재구성된 전체 소스를 사용하며 기존 `verify_jwt=false` 설정을 유지해야 한다. 이번 Preview 단계에서는 Edge Function, DB, Production을 변경하지 않는다. 적용 전 운영 함수 버전·해시를 다시 확인한다.

최신 `main`과의 통합 후 결재실 시나리오 A–D, Desktop/Mobile 390 UI, 자산 업데이트 단위·브라우저 회귀 및 v2.9.125 기준 사전 QA가 통과했다. UI Preview는 fixture 기반이며 실제 운영 Case write/read-back 또는 Edge Function 배포 검증을 대신하지 않는다. 대표 Preview 승인과 별도 Release Gate 전에는 배포하지 않는다.
