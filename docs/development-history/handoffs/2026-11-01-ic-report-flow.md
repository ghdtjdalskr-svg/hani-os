# 투자 리포트 흐름 개선 4건

## 작업 식별

- 갱신: 2026-11-01 KST / 담당: 도연(Codex), 인계: 서윤 팀장
- 상태: 구현·targeted Node 검증 완료, 브라우저 검증 차단 / 서윤 팀장 미커밋 검토 대기
- branch/worktree: `hani/ic-report-flow` / `icflow`
- base·HEAD·로컬 origin/main: `012dfbc27e347416e63b72b7757cc1f110680463` (v2.9.253)
- 원격 `git ls-remote origin refs/heads/main`: 네트워크 연결 실패, 최신성 미확인. merge/rebase 없음.
- 수정 범위: `hani-investment-committee.js`, CSS, 신규 테스트, 변경된 동작에 대한 기존 Node/UI 검사 기대값, 본 인수인계와 합성 검사 로그. 타 담당 파일 변경 없음.
- 승인: `../icflow-task.md` 전체 지시. 빈 적정가 세 필드가 모두 비면 기존 세 값 유지하는 저장값 변경만 명시 승인됨. 수동 편집·prepareBatch/applyBatch/History·새 저장 경로 변경 금지.
- 커밋·push·PR·버전/cache 변경 금지. 미커밋 상태로 서윤 팀장에게 인계.

## 결과와 증거

- Scoped discovery: CODEMAP `investment-research` owner와 기존 host 위임 click, render/renderReview, persistent `.ic-next-step`, reviewReport/import followup 경로 확인.
- 데이터 보존/복구: 기존 applyBatch 원본 참조 복원·persist 실패 rollback 유지. 합성 fixture로 검증하고 운영 데이터에 접근/저장하지 않음.
- 변경:
  - `unresolvedHoldings` 순수 함수로 기존 withoutCards 계산을 재사용. ticker 또는 instrumentId가 있는 ready만 GPT 자료에 포함하고, 준비된 종목이 있을 때만 카드 생성 지시 추가. ready가 없을 때 기존 안내 바이트 SHA-256 및 전체 빈 자료 프롬프트 동일 확인.
  - 코드 없는 기록은 한 번 생성한 `.ic-unresolved` 슬롯에서 escape한 이름으로 안내·hidden 갱신. 저장 데이터는 수정하지 않음. 적립식 분류·Gemini 요청 대상 함수 그대로 유지.
  - `reviewReport`에서 들어온 세 적정가가 모두 비었을 때만 기존 세 값 보존. 보존 시 누락 경고 해제 및 검토용 `preservedFairValue` 표시. 저장 카드에는 플래그가 들어가지 않음. 일부 값 입력·수동 편집기 삭제 동작 유지.
  - 기존 `.ic-next-step` 하나에서 순수 `reportNextStep` 결과를 렌더. 지시된 1→7 순서, 기존 valuationNote의 월간 메모 표식 재사용. `.ic-continue`는 hidden 유지, 상단 버튼 및 기존 월간 시작 경로 유지. 기존 Gemini updater가 상단·안내 버튼의 요청 중/로그아웃 상태를 함께 갱신.
  - CSS는 기존 색 토큰·flex-wrap·줄바꿈을 재사용해 새 안내 슬롯만 기존 안내 스타일에 포함.
  - `scripts/hani-ic-polish-205.test.cjs`: 보존 시 경고 대신 안내 표시, 더 이상 쓰지 않는 appliedOwner 표식 제거에 해당하는 기대값만 조정.
  - 기존 UI 테스트 두 파일: 중복 동작의 버튼 locator를 상단 도구 영역으로 한정. research UI는 GPT 반영 후 Gemini 안내·숨긴 continue 버튼을 기대하고, 월간 회귀는 기존 월간 탭/시작 버튼으로 이동. 실제 브라우저 실행은 환경 차단으로 미검증.
- 신규 검사 `scripts/hani-ic-report-flow.test.cjs`: **10/10 PASS**. ready/unresolved·기존 안내 byte·삼성증권 OWNED·세 적정가 보존/부분 입력/기존 값 없음·실제 followup switch·History 0건·다음 단계 7분기·escape/persistent slot·Gemini 버튼 동기화 검증.
- 필수 **13개 명령: PASS 10 / FAIL 3**. FAIL은 원래 존재한 Node 문구 불일치 1명령과 환경 차단 브라우저 2명령. Node test runner 집계형 8파일은 **86 PASS / 1 FAIL**. post-audit 및 protected-write는 별도 자체 집계.
- Node v24.20.0, 합성 fixture/VM 사용. 로그: `artifacts/ic-report-flow/`. 검사 명령과 상세 결과는 아래 표 참고.
- main/Pages/Production read-back: 미실행, 요청 범위 밖. index의 cache v2.9.253 및 마지막 script `hani-launch-greeting.js` 확인. 운영 화면/실제 최신 JS 로딩 미확인.
- Notion 착수 insert_content: 자동 승인 검토가 `approval policy is never`로 거절. 공통 현황판 읽기는 성공했으나 갱신 미반영. 최종 요약도 인계 시 갱신 대기 상태로 보존.

## 다음 담당에게

- 먼저 읽을 파일: 본 문서, `../icflow-task.md`, 수정 diff 및 신규 테스트.
- 다음 행동: 서윤 팀장이 미커밋 diff 검토 후 브라우저 실행이 허용되는 환경에서 두 UI 검사를 재실행. 이후 커밋·배포 열차 판단은 서윤 담당.
- blocker/미검증: Edge spawn EPERM으로 390/1440 × 밝은/어두운 실제 화면·레이아웃·클릭·Preview PNG 생성 모두 미검증(0장). 실제 GPT/Gemini 응답·Cloud·운영 데이터 read-back 미실행. Node 모의 경로 검증을 실계정 검증으로 간주하지 않음.
- 기존 UI 검사의 나머지 과거 기준/문구가 현재 main과 일치하는지는 브라우저 재실행 시 확인 필요. 실행 차단을 기능 PASS로 표시하지 않음.
- 함께 배포할 Edge Function/설정: 없음. schema/migration/Cloud write/보호 저장 경로 변경 없음.
- CURRENT/DECISIONS: 과거·타 담당 기록 보존. 확정 결과는 작업별 문서에 기록.

## 실행한 필수 명령

`PW=$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`, `EDGE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` (실행 시 실제 절대 경로 전달).

| 명령 | 결과 |
| --- | --- |
| `node scripts/hani-ic-report-flow.test.cjs` | PASS 10/10 |
| `node scripts/hani-investment-committee.test.cjs` | PASS 8/8 |
| `node scripts/hani-investment-research.test.cjs` | PASS 15/15 |
| `node scripts/hani-ic-accumulation.test.cjs` | PASS 10/10 |
| `node scripts/hani-ic-polish-205.test.cjs` | FAIL: 10 PASS / 1 FAIL (기존 실패) |
| `node scripts/hani-ic-report-205.test.cjs` | PASS 10/10 |
| `node scripts/hani-post-audit-investment.test.mjs` | PASS |
| `node scripts/hani-second-opinion.test.mjs` | PASS 18/18 |
| `node scripts/hani-final-review.test.mjs` | PASS 5/5 |
| `node scripts/hani-protected-write-contract.test.mjs` | PASS (negative storage gate 19건) |
| `node --check hani-investment-committee.js` | PASS |
| `node scripts/hani-second-opinion-ui.test.mjs <PW> <EDGE>` | FAIL: `browserType.launch: spawn EPERM` |
| `node scripts/hani-investment-research-ui.test.mjs <PW> <EDGE> artifacts/ic-report-flow/ui` | FAIL: `browserType.launch: spawn EPERM` |

### 기존 실패와 추가 확인

- polish 최초 8 PASS/3 FAIL 중 이번 변경의 기대값 2건을 반영해 최종 10 PASS/1 FAIL. 남은 `existing proactive renderer displays reminder...`는 `hani-main.js`가 `10월 종목 리포트 정리`를 출력하는데 테스트는 `이번 달 HANI 투자 리포트 리뷰`를 기대하는 실패다. 이 문구와 기대값은 요청 범위 밖이라 보존.
- `git archive`로 추출한 **원본 HEAD 012dfbc의 JS/main/원본 테스트/원본 fixture**에서 `node .../baseline/scripts/hani-ic-polish-205.test.cjs`를 실행해 동일한 **10 PASS/1 FAIL** 재현. 근거: `artifacts/ic-report-flow/polish-baseline.log`. 비교용 원본 복제와 임시 편집 스크립트는 작업 후 제거.
- 추가 `node --check` UI 테스트 2파일 PASS. raw baseline과 LCS로 비교한 변경하지 않은 줄의 **EOL 차이 0건**: JS 1224줄, CSS 147줄, polish 125줄, second UI 168줄, research UI 501줄. `audit.log` 보존.
- `prepareBatch`~`applyBatch`/History 블록 byte 동일, `hani-main.js` byte 동일, runtime `.clear(` 없음·literal ID 중복 없음. 나머지 금지 파일은 git diff 대상에 없음.
- `git -c core.whitespace=cr-at-eol diff --check` PASS. 기본 diff --check는 보존된 CRLF를 trailing whitespace로 표시하므로 EOL을 변경하는 대신 명령 단위 설정으로 확인(저장소 Git 설정 변경 없음).
- 버전/cache 증가: 작업 지시 및 release train 규칙상 미수행. Full Package/One-Pass/HINA/merge/Pages/Production: 요청 범위 밖 미실행.

## Notion 갱신 대기 내용

- 날짜/담당: 2026-11-01 KST / 도연(Codex).
- 목적: 투자 리포트의 카드 누락·코드 없는 기록·빈 적정가 삭제·다음 단계 혼동 개선.
- 상태: 기능 구현·신규 10/10 PASS, 필수 명령 10 PASS/3 FAIL(기존 실패1·Edge 실행차단2). 미커밋 서윤 검토 대기, main/운영 미반영.
- 다음: 서윤 diff 검토 → 허용 환경 UI QA → 서윤 커밋 및 열차 판단. 기준 branch/base와 원문은 위 작업 식별 및 본 문서.
- 자동 승인 검토가 Notion `insert_content` 작업을 `approval policy is never`로 거절하여 기록하지 못함. read-back한 갱신이 없으므로 Notion 반영 완료가 아님. 대표님에게 추가 승인 요청/권한 우회 없이 로컬 인계.

## 서윤 검토 반영 (2026-11-01)

- 월간 확정 후에는 다음 단계 안내를 숨기도록 판단 순서를 바꿈.
- 메모를 모두 저장하면 최종 검토 단계에 멈추지 않도록 미저장 종목 수 기준으로 변경.
- 종목이 바뀐 낡은 2차 의견은 안내 계산에서 제외.
- 세린 연구원 문구 검토 반영: 단계 문구, GPT 지시문에 출력 카드 수와 종목 누락 금지 추가.
- 서윤 재검증: 신규 10, 투자위원회 8, 리서치 15, 적립식 10, 리포트205 10, 2차 의견 18, 최종 검토 5, post-audit, protected-write PASS. polish205는 10 PASS / 1 FAIL로 main과 같은 기존 실패. second-opinion-ui, investment-research-ui 4조합 PASS.
- 버전과 cache는 배포 열차에서 올림. 운영 반영 없음.
## 운영 반영 (2026-11-01)

- v2.9.254, PR #395, main 301362d. 배포센터에서 대표님 승인.
- read-back: 운영 index.html, hani-main.js, hani-investment-committee.js/.css가 main과 hash 일치. 390·1440에서 페이지 오류 0, 표시 버전과 JS v2.9.254, 새 기능 함수 동작 확인.
- 미검증: 실제 GPT가 카드 없는 종목을 작성하는지, 실제 Gemini 답변, 대표님 실제 데이터 화면.