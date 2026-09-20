# AI 결재실 · 회의 중 확인 질문 Front Preview

## 범위

승인된 Living Office, 9명 캐릭터 자산, 소집·이동·회의 UI를 사용해 `Decision Readiness`의 BLOCKING 질문을 실제 회의 대화 안에 배치한다. 1차 발언 뒤 HANI가 날짜·기간과 예산 상한을 묻고 회의가 멈춘다. 대표 답변은 같은 대화의 다음 발언으로 남는다. SOOYEON과 JIEUN의 재검토 발언 뒤에만 HANI Decision과 Action Preview가 열린다.

Desktop은 HANI 발언 바로 아래의 inline 질문 카드, Mobile 390은 Office Map 아래의 회의 대화 안 질문 카드를 사용한다. 화면 상태 버튼에서도 답변 전 F2·F3·G를 건너뛸 수 없다. 빈 답변은 진행되지 않는다.

## 검증 범위와 한계

- Front Interaction Prototype이다. Agent 답변 생성, 의미 분석, Case 저장, 실제 보고서·일정 생성, DB·Supabase·Cloud write는 연결하지 않았다.
- 데모 대화와 결론은 오사카 3박 4일 시나리오의 예시다. 대표가 입력한 날짜·예산은 회의 transcript와 Action Preview에 표시되지만, 실제 가격이나 일정의 타당성을 계산하지 않는다.
- Production 파일과 버전은 변경하지 않는다. `hani_os_life_v23` 및 다른 저장소 키에 접근하는 코드를 추가하지 않는다.
- 다음 Backend 연결 단계에서는 답변을 동일 Case에 저장하고, 관련 Agent의 재검토 근거와 Decision Readiness를 다시 평가한 뒤 결론을 내야 한다. 이 Preview가 그 기능을 구현했다고 간주하지 않는다.

## QA

`scripts/hani-meeting-inline-clarification-smoke.mjs`로 Desktop 1440과 Mobile 390에서 초기 단계 차단, 빈 답변 차단, 답변 후 재검토 발언·Decision 표시, 가로 넘침, 브라우저 오류를 확인한다. Office Map·Meeting 흐름의 기존 레이어를 유지한다.
