# 투자 Portfolio 기존 패널 활성화 호환성 복구

## 작업 식별

- 갱신일(KST): 2026-10-11 / 담당: 도연(Codex)
- 상태: 구현·Node 검증 완료, 실제 Edge 검증 대기 / Risk: NORMAL, 읽기 전용 UI
- branch/worktree: `hani/integration-203` / `int203`
- 작업 기준 HEAD: `09c08c25b9630898ceb023319dfdb295d7883481`
- base/origin main: `b93925fe75f5e746a6101ed492e950516746fadc`. GitHub branches/main 읽기 연결로 원격 일치 확인; shell Git 네트워크는 제한됨.
- 목표: 기존 투자 view/panel 활성화 시 Portfolio 내용과 390px 수평 스크롤 안내 유지.
- 승인: 대표님 이번 요청, 앱 수정 및 IC Node 재검사. access 테스트 수정·커밋·버전 증가·merge·배포 없음.
- 수정 범위: `hani-main.js` IC wrapper와 canonical 투자 진입, 관련 IC regression 검사. 기존 미커밋 artifacts/qa-evidence 보존.

## 결과와 증거

- 원인: IC wrapper에 `.panel`을 사용하여 기존 `#investment .panel` active 초기화 시 부모까지 비활성화. `.panel` CSS가 부모를 숨김. `hidden`만으로 관리할 IC section과 기존 Portfolio panel 소유 범위가 충돌.
- 사용자 영향: showView 투자 재진입 때 Research/Monthly 선택이 남아 기존 Portfolio 대상 링크가 숨겨진 부모 안을 활성화할 수 있음. canonical activateInvestmentTab은 이미 Portfolio 선택을 수행.
- 변경: IC Portfolio/Research/Monthly wrapper에서 `.panel` 제거, 기존 `hidden` 및 IC 탭 선택 owner만 표시를 관리. Portfolio는 기본 표시 유지. `showView('investment')`에서 render 전에 Portfolio 선택하여 홈/알림/해시 재진입 이후 기존 panel 활성화 대상의 숨겨진 부모 해소. 기존 `activateInvestmentTab` 경로는 그대로 재사용. DOM observer·추가 event/renderer/CSS layer 없음.
- 변경 파일: `hani-main.js`, `scripts/hani-investment-research.test.cjs`, 이 인수인계. access 테스트·IC CSS/module·index 변경 없음.
- `node scripts/hani-investment-research.test.cjs`: 14/14 PASS. 실제 layout의 기본 wrapper와 legacy panel 직접 클래스 초기화/활성화, Research·Monthly 선택 후 실제 showView 재진입, 기존 activateInvestmentTab 및 타 view 진입 시 IC 선택 보존 검증 추가. 저장 경로 기존 검사도 PASS.
- `node scripts/hani-investment-committee.test.cjs`: 8/8 PASS.
- `node --check hani-main.js`, `node --check scripts/hani-investment-research.test.cjs`: PASS.
- `git -c core.whitespace=cr-at-eol diff --check`: PASS. 기본 diff-check의 CR trailing-whitespace 표시는 원래 CRLF 보존 때문으로, 파일 EOL 변경 없이 검사 옵션만 사용.
- 작업 직전 snapshot 대비 보호 owner 21개·VERSION/STORAGE_KEY/HANI_DISPLAY_VERSION·literal ID 목록·destructive-call 수 동일 PASS. 원래 줄별 mixed EOL 보존 PASS: main 원문 7,576줄, Research test 원문 212줄. snapshot 증거는 gitignored `artifacts/.codex-private/investment-legacy/`.
- 수정 후 `node scripts/hani-access-ui.test.mjs "C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"`: browserType.launch `spawn EPERM`. 실제 390/1440 hint·수평 스크롤·스크린샷·console은 미검증이며 PASS 아님. 대표님 제공 `../access-fail.txt`의 기존 실 Edge 실패는 line11 false !== true.
- 저장·Cloud·schema 영향: 없음; 저장 owner 수정 금지 유지.
- 표시 버전: v2.9.202 유지. 운영 표시/최신 JS 실제 로딩 및 Production read-back은 이번 기능 개발에서 미검증.
- PR/main/Pages/배포: 없음.
- Notion: 현황판 읽기 성공. 착수 append 자동 승인 검토 거절: `MCP tool call requires approval, but approval policy is never`. 갱신 대기.

## 다음 담당에게

- 먼저 읽을 함수: setupInvestmentCommitteeLayout / selectInvestmentSection / showView / activateInvestmentTab.
- 다음 행동: Edge 실행 가능한 담당 환경에서 위 access 명령 및 IC UI 검사를 재실행. 동일 미커밋 앱 패치 확인 후 배포 담당에게 인계.
- blocker: Edge browser spawn EPERM. Notion 자동 승인 검토 거절. 마지막 갱신 대기 내용: 원인·wrapper 분리·canonical 재진입 수정, IC Node22 PASS/안전·EOL PASS, Edge 미검증, 미커밋·미배포.
- CURRENT/DECISIONS 및 타 담당 인수인계 보존. Candidate/Release 절차는 수행하지 않음.
