# IC 월간 확정 UI 테스트 후속 · 도연/Codex

## 작업 식별

- 갱신: 2026-10-11 KST / 담당: 도연(Codex), 단일 개발 Agent
- 상태: 테스트 수정 및 Node 검증 완료 / Claude의 실제 Edge 재실행 대기 / 미커밋
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/integration-204 / int204
- base/HEAD: c8bdfa789a13cdfafc42f3e3c685c5afefea6a92 / candidate 없음
- 원격 main: GitHub GET으로 b23829b268b19b44fb3de81058374866287a9741 확인, origin/main과 일치. ls-remote는 네트워크 차단. merge/rebase 없음.
- 목표: ../icui-fail.txt의 310행 securitySnapshots undefined 원인 규명, 테스트 흐름 수정, 이후 전체 경로 정적 점검.
- 수정 범위: scripts/hani-investment-research-ui.test.mjs 및 이 작업 기록. 기존 IC 운영 코드·타 담당 미커밋 파일 보존.
- 승인 근거: 대표님의 테스트 수정 요청. commit/push/main/배포/버전 증가 금지, mixed EOL 보존.

## 결과와 증거

- 원인: 테스트가 월간 초안 시작 후 보유 evaluationAmount를 100000→120000으로 변경. UI의 draftFingerprint는 holdings()를 포함하므로 submit에서 원본 변경 보호 검사가 확정을 거절함. 테스트는 오류·무저장을 확인하지 않고 없는 snapshot을 읽었음.
- 앞선 확정/수정본 경로는 Claude 로그의 실패 지점에 도달하기 전에 실행된 구간. 새 전체 Edge PASS 근거는 아님.
- 변경: 보호 거절/무저장/초안 보존 확인 → 초안 취소·재시작 → 확정 성공·snapshot 존재/분류/read-back 확인 → 설정 변경 후 frozen 목록과 저장본 및 기존 Research 원문 불변 검증을 UI 테스트에 추가. snapshot 존재 확인 전 securitySnapshots 접근을 제거함.
- Fixture 판단: 앞선 일반 의견 회귀는 이미 state.ui.icAccumulationAccountIds=[]를 명시하며, 후반 fixture는 키움 전용 2종목(카드 1/무카드 1)과 토스·하나 일반/혼합 종목을 포함함. 계좌 fixture를 바꿀 필요 없음. 원인 해결을 위해 앱 보호 검사를 변경하지 않음.
- 이후 전체 정적 점검: Research 복귀 → 적립식 설정 해제/기존 save → 월간 복귀에서는 monthlyDraft=null이므로 frozen snapshot을 렌더링함. 현재 분류가 달라져도 securitySnapshots는 재계산하지 않음. 이 경로에서 메모리 snapshot·저장 read-back·카드 원문 보존 assertion 추가. 나머지 카드 3개/스크린샷/중복 ID/console 0/컨텍스트 종료·4조합 루프/마지막 정리의 owner와 접근 대상을 확인함. 수정 후 실제 렌더링 PASS를 뜻하지 않음.
- PASS: `node --check scripts/hani-investment-research-ui.test.mjs` 및 CR-at-EOL 허용 diff-check.
- PASS: `node scripts/hani-investment-research.test.cjs` 15, `node scripts/hani-investment-committee.test.cjs` 8, `node scripts/hani-ic-accumulation.test.cjs` 10. 로그: artifacts/ic-monthly-confirm-test/{research,monthly,accumulation}.log.
- PASS: `node artifacts/ic-monthly-confirm-test/confirm-flow.cjs`. 기존 UI input/click/submit handler·startCommittee·draftFingerprint와 실제 snapshot core/market positions/broker normalize 함수를 Node VM에서 실행. 변경 후 확정 거절(저장 0) → 취소/재시작 확정(저장 1) → 의견 2/적립식 2 및 평가액 120000 보관 → 설정 해제 저장 후 frozen snapshot/read-back/카드 원문 보존 확인. DOM render/freshState/무관한 market inference와 persist는 synthetic stub이므로 실제 화면·운영 저장 검사와 구분함. 실제 commit/save 회귀는 위 Research15의 기존 검사에서 실행됨.
- PASS: 변경 전 323개 유지 줄의 원문/EOL 보존. 혼합 EOL 유지, hani-investment-committee.js/hani-main.js/index.html/scripts/hani-investment-research.test.cjs 전체 SHA-256 불변. 근거 artifacts/ic-monthly-confirm-test/scope-eol.json 및 scope-before.json.
- 미검증: 수정 후 실제 Edge 4조합/화면/console 및 운영 auth/Cloud.
- 데이터·Cloud·schema 영향: 테스트만 수정, 운영 경로 변경 없음. Full build/후보/버전/배포 검증 N/A.
- 로컬 표시/cache v2.9.203, 마지막 UI script hani-ai-budget.js?v=2.9.203 유지. main/Pages/Production 작업 없음.
- Notion: 현황판 및 문법 문서 읽기 확인. 계획 요약 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절함. 갱신/read-back 미완료이며 우회하지 않음. 갱신 대기 요약: IC 월간 UI310 원인=초안 중 평가액 변경 guard, 테스트만 거절/재시작/분류/read-back 보강, Node33+실제 handler synthetic 검사+EOL/운영원문 불변 PASS, 전체 Edge 재실행 대기, 미커밋·미배포.

## 다음 담당에게

- 먼저 읽기: 이 문서와 UI 테스트 accumulation 구간, hani-investment-committee.js의 draftFingerprint/startCommittee/monthly submit.
- 다음: Claude의 실제 Edge 환경에서 `node scripts/hani-investment-research-ui.test.mjs <playwright/index.mjs> <msedge.exe> artifacts/ic-monthly-confirm-test-edge` 재실행. 1440/390 × 두 finish 전체 PASS는 아직 없음.
- blocker: 이 환경에서 실제 Edge 실행 불가. 새 사용자 결정은 필요하지 않음.
- CURRENT: 테스트 수정/Node 검증 완료와 Edge·Notion 대기를 추가. 이전 및 타 담당 기록 보존. 새 승인 요청 없음.
