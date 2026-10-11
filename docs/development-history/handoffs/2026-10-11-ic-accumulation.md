# 투자위원회 장기 적립식 계좌 · 도연/Codex

## 작업 식별

- 갱신: 2026-10-11 KST / 담당: 도연(Codex), 단일 개발 Agent
- 상태: 구현 및 Node 검증 완료 / Edge 실화면 검증 대기 / 미커밋
- worktree: int204 / branch: hani/integration-204
- base/HEAD: c8bdfa789a13cdfafc42f3e3c685c5afefea6a92 / candidate 없음
- 원격 main: b23829b268b19b44fb3de81058374866287a9741 (GitHub 읽기 확인). 자동 merge/rebase 없음.
- 범위: hani-investment-committee.js, 관련 Node 테스트, 기존 Edge UI 테스트, 이 인수인계 및 CURRENT 요약.
- 승인: 대표님 요청의 state.ui.icAccumulationAccountIds 명시 저장, 기존 commit/save 경로, 월간 securitySnapshots kind:'accumulation'. 새 최상위 키/schema/storage key 없음.
- 금지 경계: commit/push/PR/main/배포/버전 증가 없음. 기존 타 담당 QA artifact 보존.

## 결과와 증거

- 변경: 키움 기본 계좌 분류 및 접힌 계좌 설정 패널. 저장 버튼만 기존 commit/save를 호출하며 state.ui.icAccumulationAccountIds에 명시 목록(빈 배열 포함)을 저장합니다. 기본 분류 조회는 쓰지 않습니다. 실패 시 이전 설정 속성/참조를 복원합니다.
- 변경: 현재 보유 전체가 적립식 계좌인 종목을 GPT 자료/반영 매칭에서 제외합니다. 반환된 제외 종목은 검토에 표시하며 기본 미선택·disabled, 기존 카드와 매칭/수정하지 않습니다. 일반/혼합 종목만 반영합니다.
- 변경: 일반 Research 선택 목록에서 제외하고 접힌 ‘적립식 종목 (의견 없이 보유)’ 그룹의 ‘그래도 작성’으로만 선택합니다. 기존 카드는 그대로 보존하고 ‘의견 선택 사항’, 혼합은 ‘일부 적립식’ 표시합니다.
- 변경: 월간 초안/빈 화면/확정본의 별도 적립식 영역. 평가액은 기록값을 읽으며 완전한 동일 통화 보유 자료일 때만 비중을 계산합니다. 연구 필드 없는 kind:'accumulation' 항목을 securitySnapshots에 deep-copy, 무카드 보유도 포함합니다. Rating/Conviction/테마 중복/판단 변화 자동 목록에서 제외합니다. 혼합 보유 판단은 유지하며 이후 설정/가격/계좌/카드 변경이 확정본에 영향을 주지 않습니다.
- 변경 파일: hani-investment-committee.js, scripts/hani-ic-accumulation.test.cjs(신규), scripts/hani-investment-research.test.cjs, scripts/hani-investment-research-ui.test.mjs, 이 인수인계 및 CURRENT 요약.
- Node PASS: `node scripts/hani-ic-accumulation.test.cjs` 10 / `node scripts/hani-investment-research.test.cjs` 15 / `node scripts/hani-investment-committee.test.cjs` 8. 기본/명시/혼합/현재 보유 owner/GPT export/import/무카드/월간 freeze/누락·통화·설정 실패 복원과 기존 normalizeState 재로딩 경로를 실행했습니다.
- 추가 PASS: `node scripts/hani-market-data-test.cjs` 12, `node scripts/hani-cloud-first.test.mjs` 40, `node scripts/hani-invest-basis.test.cjs`. Node syntax(운영 JS/UI 테스트/신규 테스트), CR-at-EOL을 허용한 diff-check PASS.
- 안전 PASS: `node scripts/hani-investment-research-safety.test.cjs <HEAD hani-main.js> <HEAD index.html>`의 보호 owner 21개·저장/버전/cache 보존. main/index 전체 바이트 불변 확인, 수정 파일 3개의 유지된 모든 비모호 줄 EOL 보존 검사. 신규 runtime id literal/direct storage/Cloud write/파괴 호출 없음. 기존 save/commit 실행 테스트에서 저장/read-back 및 실패 시 rollback 확인.
- Edge BLOCKED: `node scripts/hani-investment-research-ui.test.mjs "C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" "artifacts/ic-accumulation"` → browserType.launch spawn EPERM. 확장한 설정/복사 문구/제외 검토/선택 작성/월간 UI·모바일·스크린샷·콘솔 검사는 실제 실행되지 않았으므로 PASS 아님.
- 실제 운영 데이터/인증/Cloud 연결/실화면/후보 Build/One-Pass/HINA/Production read-back 미검증. Candidate 미요청으로 빌드/버전/배포 검증 N/A. Synthetic test만 실행.
- 표시/캐시: 로컬 v2.9.203 유지. 최신 로드 UI: hani-ai-budget.js?v=2.9.203. Production 미확인.
- Notion: 현황판 읽기 성공. 계획 append는 자동 승인 검토에서 'MCP tool call requires approval, but approval policy is never'로 거절. 갱신 대기.

## 다음 담당에게

- 먼저 읽기: 이 문서, hani-investment-committee.js의 분류/설정 저장/월간 snapshot 함수.
- 다음: 브라우저 실행이 가능한 환경에서 위 Edge UI 명령 실행. frozen Candidate 또는 배포 승인이 아닙니다.
- 원격 main 차이: 조회된 main은 기존 main 소유 투자 메뉴 안에 IC persistent panel을 통합한 코드이며, 요청된 integration-204는 독립 투자위원회 메뉴 소유입니다. 이번 변경은 지정된 integration-204의 기존 UI/event owner만 수정했습니다. 자동 merge/rebase하지 않았으며 향후 열차 통합 시 소유 경로 차이를 확인해야 합니다.
- 별도 서버/Edge Function/Cloud schema 배포 없음. commit 금지에 따라 탑승 push 미수행.
- CURRENT에 구현/Node 검증/Edge 차단/Notion 대기를 요약했습니다. 운영 완료로 보지 않습니다.
- Notion 갱신 대기 요약: 2026-10-11 도연/Codex 장기 적립식 계좌 구현, hani/integration-204@c8bdfa7 미커밋, IC33+시장12+Cloud40+평가기준 PASS, Edge spawn EPERM, 커밋/버전/main/배포 없음. 정책 never로 자동 승인 검토가 append를 거절하여 다른 도구로 우회하지 않음.
