# HANI-28 + HANI-31 기능 결합 · 탑승 대기

- Codex / 2026-10-07 KST. 대표님 요청: 가능한 남은 작업을 탑승 대기까지 수행. 배포 승인 아님.
- branch `hani/goal-report-ready-20261007`, runtime base `c43ba2f1ce24c05e2cb16338e920fcf73731de0a`. HANI-28 `18d6a0a` 위에 HANI-31 `fe4a305`의 보고 범위만 적용. 원래 두 담당 branch는 수정하지 않음. main/release branch 아님.
- 두 작업에서 겹친 projection 및 generator를 담당자가 결합. 시청 metric, 예산 제안, report/guidance 소스 모두 보존하고 runtime bundle 재생성. 보고 API 확장이 예산 제안 API를 삭제하는 실제 결합 회귀를 발견해 기존 API spread로 보존. generated JS 직접 수정 없음.
- 최종 변경 범위는 두 원문 handoff와 동일 + `hani-report-progress.mjs` API 보존. 새 보호 write·Cloud mutation/schema·auth 변경 없음. 기존 Preview/승인 저장을 그대로 이용. 표시 버전 v2.9.190/cache tag 유지.

## 결합 결과 검증

- 단위 31/31 PASS: `node --test scripts/hani-goal-media-budget.test.mjs scripts/hani-goal-period.test.mjs scripts/hani-goal-period-view.test.mjs scripts/hani-report-common.test.mjs`.
- generator `node scripts/hani-goal-month-core.mjs --check`, main/bundle syntax, diff 검사 PASS.
- 실제 앱 격리 Chrome 1440/390 × 밝음/어두움: media/budget UI 4 PASS, report-common UI 4 PASS, 기존 goal-progress UI 4 PASS. 합성 원본 검증 문맥, 외부 요청 차단.
- 예산 +15%는 입력만 변경/취소 시 저장0, 시청 목표 Preview 저장0/승인 저장1 및 read-back/다른 필드 보존, 실패 rollback PASS. 신규 저장 경로를 만들지 않음.
- `hani-monthly-report-smoke.mjs` PC/모바일 PASS: 수동 생성, 보관/reload, 명시적 재생성, 두 달 보관, 원본 보존, 저장 실패 복구, 미완료/빈 월 차단, overflow.
- 최종 결합된 소스에 위 검사 재실행. 초기 예산 API 회귀 실패는 수정 후 PASS. 운영 로그인/Cloud/실기기/Production/HINA 미검증. 독립 리뷰로 표시하지 않음.

## Claude에게

- 작업 중 최신 main `691385cf`(PR220)이 source/tooling 25파일을 반영한 것을 fetch/diff로 확인. main runtime hani-main.js/index.html/hani-goal-progress.js는 이 변경에서 바뀌지 않음. upstream report API도 suggestMonthlyBudget를 명시 보존하므로 이번 spread 방식과 기능상 동등. 소스/검사/원문을 두 번 적용하지 말고, 최신 main 위 runtime 변경만 담당이 대조할 것. 이 탭 branch는 merge/rebase하지 않음. 기존 검증은 이 branch의 결합 코드 기준이며 최신 열차 PASS로 재사용하지 않음.

- HANI-28·31은 이 결합 branch로 함께 탑승. 이전 두 branch를 추가로 다시 적용하지 말 것. common generator를 다시 버리지 말 것.
- HANI-33 `hani/navigation-state-20261007@9aa7e38`은 별도 탑승: showView/unlock UI 위치/보고 board 복원, 서버 없음. HANI-7 고유 PPT/PDF 후보는 별도 담당. 기능 충돌 발생 시 담당에게 반환.
- 새 서버 함께 배포 없음. HANI-7의 기존 earnings-dialogue/annual-reports 서버 계약 확인은 별도.
- 열차 후보에서 targeted check 재실행 → 버전 1회 증가 → package/preflight/독립 HINA/Preview → 대표님 승인 → canonical 배포 및 read-back. 이 탭은 운영 PR/main 병합/배포하지 않음.
- Drive는 설계만 완료. 실제 OAuth 및 Vault 업로드/복원 구현·검증은 별도이며 완료로 표시하지 않음. 입력 초안은 계정간 노출 방지 연결 경계 조사 문서만 준비됨.
