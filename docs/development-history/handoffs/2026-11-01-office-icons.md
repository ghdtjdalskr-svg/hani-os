# 휴대폰 행동 문구와 특수 행동 머리 아이콘

## 작업 식별

- 갱신 시각(KST): 2026-11-01
- 담당: Codex / 단일 개발자
- 상태: 구현 완료 / Node·실화면 검증 대기 / 미커밋
- 저장소 / branch / worktree: hani-os / `hani/office-action-icons` / `office-icons`
- base SHA: `15747bcdd120233e4d5334db9505a5ef34fcdc3c` (2.9.250). HEAD·origin/main 로컬 ref 일치, 로컬 main은 `53db8f6`. GitHub 읽기로 원격 main `4576dfe`·2.9.251 확인(사무실 JS/CSS 변경 없음). 지정 기준 유지, merge/rebase하지 않음.
- 목적: 상담 상태 분류·정확한 휴대폰 문구와 기존 prop 슬롯의 장식 아이콘.
- 범위: `hani-office-live.js`, `hani-office-live.css`, 신규 전용 테스트, `artifacts/office-icons/REPORT.md`와 작업 증거.
- 승인 근거: 대표님이 지정한 `../office-icons-task.md` 전체 지시. commit/push/merge/버전 증가·Notion·assets/data 수정 금지.

## 결과와 증거

- 원본 JS SHA256이 지정 기준선의 `office-labels-qa-source-delta.json` afterSha256과 일치함.
- 상담·면접 meeting 분류, 정확한 응대 4문구·방문객 문구와 추가 빈도 상위 10문구 수정. 개인 휴식/업무·방문객/이동 대기 분류 보정. 기존 prop의 정지 중 장식 아이콘과 값 변경 시에만 쓰기 구현.
- 최종 V8에서 신규 전용 9/9 + 기존 라벨 회귀 8/8 통과. 실제 소스와 기존 DOM fixture·assertion 사용, Node API 어댑터 기반이므로 Node 실행 통과로 보지 않음.
- Node/Git 실행이 Access denied로 차단됨. 전체 office Node 테스트 37파일 모두 실행 시도·모두 BLOCKED. 브라우저 연결 불가로 416px/desktop 실화면·터치 미검증. 기존 assertion 수정/삭제/완화 0.
- 스케줄러 전체와 공개 `snapshot`, `screenHomeClear`, `placeStatusLabels`, `fitStatusLabels`가 원격 지정 기준과 byte 동일. 14조합 plan/blockPlan 전체 JSON·scheduler/public snapshot 각70개 동일.
- 주간 14조합·584,949시점·9,897,703인물 표본·3,093문장. 일반 문구 660개 원문을 REPORT의 접힌 표에 전부 기록. 2.4초 idle beat 및 동등 이벤트 대표 시점 표본이며 연속 시점/임의 인원 조합의 완전 탐색은 미검증.
- 데이터·저장소·Cloud·schema·AI 호출 변경 없음.
- PR / Preview / main / Pages / 운영 read-back: 미실행.

## 다음 담당에게

- 증거와 최종 상태: `artifacts/office-icons/REPORT.md`.
- 다음 행동: 허용된 환경에서 Node 37개·실제 휴대폰/desktop 검사를 수행하고 서윤에게 인계. 요청서의 source pin 재기준화는 서윤 담당이며 이 작업에서 pin/fixture를 바꾸지 않음.
- blocker: 현재 환경의 Node/Git 실행 권한, 브라우저 연결 없음.
- CURRENT/DECISIONS: 타 작업 보존. Notion은 이번 명시 지시에 따라 수정하지 않음.
