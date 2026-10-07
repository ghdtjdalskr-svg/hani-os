# 공통 보고서 실적·목표 연결 / 검토 초안

- 담당: Codex, 대표님 직접 지시로 우선순위 1~3 및 Drive 1차 설계 수행.
- branch `hani/reports-common-goals-20261007`, base `c43ba2f1ce24c05e2cb16338e920fcf73731de0a`. 운영 v2.9.190, cache/version 증가 없음. 서버 동반 기능 없음.
- 구현 범위: 월간 새 보고서는 Data Hub canonical core와 공통 period projection으로 계산. 분기/연간 9개 지표 실적·목표 조회 및 다음 기간 KEEP/SET/REVIEW 참고안. 건강 목표 상향/하향을 자동 제안하지 않음. 편집값을 기존 목표 form에 옮길 뿐 승인·저장하지 않음. 과거 보관 보고서/기존 저장 format 및 save/Cloud 경로 유지.
- owner/source 검증 실패 시 실적 숨김·새 보고서 생성 중단. 검토 중 원본/목표 변경 시 입력 전달 거부. 생활 원본·goalRegistry 수정 0 (입력 전달까지).

## 변경 파일

`hani-report-progress.mjs`, `data-hub/guidance-preview.mjs`, `data-hub/goal-period-view.mjs`, generator `scripts/hani-goal-month-core.mjs`, 생성된 `hani-goal-progress.js`, `hani-main.js` 보고서 호출 경계, `index.html` 기존 보고 패널 슬롯/정직한 상태 문구, 보고서 테스트 3개 및 이 인수인계/Drive 설계.

## 검증

- period/projection 기존 24건 + 새 report 공통 계산/가중 평균/결산월/검토 초안 4건 PASS.
- report 실제 앱 합성 UI 1440/390 × 밝음/어두움 4조합 PASS. monthly/quarter/annual 계산 일치, BMI 비교·입력 전달, 원본 gate, 생성 차단, 원본 및 localStorage 불변, overflow.
- 기존 목표 설정 진행 UI 4조합 PASS.
- 기존 monthly aggregation script PASS. 월간 보고서 smoke PC/모바일 PASS: 실제 기존 save로 수동 생성·reload 보관·명시적 재생성·두 달 누적·실패 rollback·원본 보존. 외부 통신 차단, 합성 원본 검증 문맥 사용.
- 운영 JS syntax, generator --check, diff --check PASS.
- Preview 캡처 `artifacts/report-common/390-midnight-black.png` 등 로컬 보존, commit 제외.

## 남은 단계·통합 주의

- HANI-28 미배포 시청 목표·예산 제안과 generator/hani-goal-progress.js이 겹친다. 양쪽 source 변경 보존 후 generator로 재생성. 미탑승 시청 metric도 조회하되 등록 선택은 UI 입력 시 해당 기능 배포 대기를 안내. 운동일 지표 보류 유지.
- HANI-7 과거 earnings 후보 전체 merge 금지. 최신 main에는 발표무대/PPT·연간 뷰어 구현이 없으므로 이번 연결은 이를 완료로 선언하지 않는다. 답변 포함 PPT·인증 연간 등록/read-back/복구는 해당 보존 후보의 충돌 분석 및 service 회복 이후 별도 QA가 필요하다.
- 이번 Guide는 참고안/검토 UI이다. 자동 RAISE/LOWER/RETIRE 판정이나 정식 승인 원장 구현 완료가 아님.
- Claude가 실제 통합 후보에서 targeted checks와 package/preflight/HINA/Preview 수행. 운영 PR/main merge/배포는 이번 탭이 하지 않음. 실제 auth/Cloud/Production·Android 미검증.
- 우선순위 5 Drive 설계는 `2026-10-07-drive-vault-design.md`. OAuth/업로드/복구 미구현, 별도 승인·연결 조건 명시.
