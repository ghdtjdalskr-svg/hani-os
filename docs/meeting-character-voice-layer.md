# AI Approval Room · Character Voice & Relationship Layer

## Root Cause

회의 Review의 canonical 생성 경로는 운영 `hani-agent-orchestrator`의 `AGENT_BEHAVIOR → agentSystemPrompt → callAgentReview`이고, HANI Final은 `runHaniSynthesis`가 소유한다. 기존 `AGENT_BEHAVIOR`는 판단 원칙과 Hard Stop 중심이며 7명만 정의돼 있다. 말투·관계·유머 강도·금지 표현이 없어서 서로 다른 Agent도 비슷한 AI 보고서 문장으로 수렴한다.

## 변경

- 기존 판단용 `AGENT_BEHAVIOR`와 Router, Review Schema, Verification, Readiness, HOLD, 승인 흐름은 유지한다.
- 9명의 compact canonical `AGENT_VOICE`를 별도로 둔다.
- 선택된 Agent의 Voice 한 개만 `agentSystemPrompt`에 주입한다.
- HANI Final에는 HANI Voice와 전문가 이름·논점·채택 사유를 연결하는 규칙을 적용한다.
- 이전 회의 발언이 Context에 있을 때만 상대 발언에 반응한다. 없는 대화나 꽁트를 만들어내지 않는다.
- HIGH/CRITICAL 또는 Cloud·계약·재무손실·건강위험·보안·데이터손실 안건은 유머를 0~5%로 낮춘다.
- 한 회의의 짧은 꽁트는 0~2회이며 같은 캐치프레이즈를 연속 사용하지 않는다.

## Canonical Voice

| Agent | Voice 핵심 |
|---|---|
| HANI | 짧고 정확한 전무/Chair, 결론 우선, 전문가 논점 연결 |
| JIEUN | 숫자·현금흐름·기회비용, 가치 있는 지출은 인정 |
| NAEUN | 친근하지만 건강 위험에는 단호한 제동 |
| HINA | 학습 전문성은 정확하게, 허당 반응은 희소하게 |
| SUA | 고객·책임범위·Vendor 확정·일정 중심의 실무형 |
| HARU | 실사용 장면·가성비·반복 사용성 중심 |
| MINJI | 콘텐츠 몰입·미디어 UX·다음 화면의 힘 중심 |
| SOOYEON | 여행·스포츠의 일정·동선·현장 실행성 중심 |
| YUNA | 입력값·누락·Routing·Preview를 짧게 구조화 |

## Token 영향

모든 Persona를 매번 넣지 않고 선택된 Agent 한 명의 compact Voice만 추가한다. Targeted QA 기준 Voice Prompt는 약 700~900자 범위이며, Review 호출당 대략 수백 토큰이 추가된다. HANI Synthesis에는 HANI Voice 한 개만 추가한다.

## 안전 범위

- Supabase schema/migration 변경 없음
- Case/Review 저장 구조 변경 없음
- Agent 선정 및 역할 배정 변경 없음
- Decision Readiness/HOLD/승인 로직 변경 없음
- Living Office와 Newsroom Persona 변경 없음
- 이 문서의 Patch 자체는 배포를 수행하지 않으며, 승인된 Release Flow에서만 운영 함수에 반영한다.
