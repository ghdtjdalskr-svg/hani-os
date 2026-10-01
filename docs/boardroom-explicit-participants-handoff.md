# HANI BOARDROOM · 지명 Agent 선별 보정

## 원인과 수정 범위

- Production v2.9.150 / Edge Function v49의 `buildRouting`은 workflow와 `router_v2.context_domains`만으로 참가자를 정했다. 사용자 원문의 명시적 이름은 선별 조건에 없었다.
- QA 원문이 하니·수아·지은을 지명했지만 `GENERAL_REVIEW` 기본 하니와 `PREFERENCE` 맥락의 민지만 선택된 이유다.
- 이번 후보는 회의 함수의 Routing만 보정한다. UI, Case/Review/Event schema, 인증, Life OS 데이터 경로는 변경하지 않는다.

## 새 규칙

- 원문에서 회의·검토·관점 요청과 함께 명시된 canonical 9명 이름(한글/영문)을 읽는다. 단순 시간 표현인 “하루 동안”, 부정 지시인 “지은은 빼고”는 참가 요청에서 제외한다.
- 기존 workflow 필수 전문가는 유지하고, 명시 요청자는 교차 검토 발언 순서에서 우선한다. 미지명 안건은 기존 선별 결과를 유지한다.
- Pilot의 최대 5명 Review / 최대 3명 교차 검토 정원에 명시 요청과 필수 전문가를 모두 담지 못하면 `REQUESTED_AGENTS_EXCEED_MEETING_CAPACITY`로 중단한다. 임의로 누락한 채 검토를 진행하지 않는다.
- 기존 Case의 저장된 Routing이나 Review는 재작성하지 않는다. 수정 후 접수해 Routing하는 새 안건에 적용된다.

## 재현과 검증

| 입력 | 이전 | 수정 후보 |
|---|---|---|
| `하니, 수아, 지은의 관점으로 ... 검토` + `GENERAL_REVIEW/PREFERENCE` | 하니·민지 | 하니·수아·지은·민지 |
| 이름 없는 일반 검토 + `PREFERENCE` | 하니·민지 | 하니·민지 |
| 여행 필수 전문가 3명 + 추가 지명 3명 | 최대 5명으로 묵시적 잘림 | 명확한 정원 오류 |

- 운영 함수 v49를 읽어 재구성 기준선과 정규화한 내용이 일치함을 확인했다.
- `node scripts/hani-boardroom-rebuild-edge.mjs`로 소스 v1.9.3을 재구성한다. `--no-participants`는 변경 전 v1.9.2 기준선 확인용이다.
- `node scripts/hani-boardroom-routing.test.mjs <재구성된 index.ts 경로>`로 실제 Routing 함수의 배정·제외·정원 시나리오를 실행했다.
- 함수 전체 TypeScript를 변환한 JS 구문 검사와 기존 Boardroom / Meeting Engine / Voice 대상 회귀가 통과했다.

## 운영 반영 경계

- 이 커밋은 배포 가능한 함수 패치 후보이며 **아직 Production 함수에 적용하지 않는다**. Production은 v49 / HANI OS v2.9.150이다.
- 새 후보 승인 시 운영 함수 버전·소스 동일성을 재확인하고 v49 소스를 백업한 뒤 함수 v1.9.3만 교체한다. `verify_jwt:false` 기존 설정과 함수 내부의 사용자 인증 검사를 유지한다.
- 배포 후 지명 요청이 있는 저위험 QA Case에서 실제 선발과 교차 검토를 확인한다. 대표 결재·Life OS Commit은 실행하지 않는다.
