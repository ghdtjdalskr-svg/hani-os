# AI 업무 현황 catalog / 미래 버전 회귀 · 도연(Codex)

## 작업 식별

- 갱신: 2026-10-11 KST / 도연(Codex), 단독 개발 + 자동 검사 / 구현·targeted 검증 완료, 미커밋 인계.
- branch/worktree: `hani/green-209` / `w209`. 시작 HEAD/base `c796d2a01c063423ebdb06a769d13183ae616157`.
- 원격 main: `759ae689a2cd85507b6c82d9fdcf92816bc498cd`, GitHub branches/main 읽기로 최신 일치 확인. CLI는 proxy 연결 실패. 기존 merge HEAD에 포함됨.
- 기준 표시 v2.9.208, 마지막 UI JS `hani-ai-budget.js?v=2.9.208`. Production 실제 브라우저 로딩은 이번 범위 밖.
- 목표: `../w209-fail.txt`의 1건을 수정. v208 반영 범위와 v209 진행 항목을 catalog에 기록하고 exact latest/date pin을 구조·최소 버전 검증으로 교체.
- 수정 범위: `hani-main.js` developmentTeam 정적 catalog, `index.html` AI 업무 안내 문구, `scripts/hani-ai-work-status.test.mjs`, 이 인수인계/CURRENT. CODEMAP에 AI 업무 owner가 없어 CODEMAP_MISS 후 실제 teamMeta/renderTeamProfile 소유 경로 확인.
- 승인: 성민 대표님 현재 요청. 커밋·버전/cache 상승·데이터 변경·새 ID·새 clear 호출·main/배포 금지. 기존 미커밋/미추적 타 담당 artifacts 보존.

## 결과와 증거

- 원인: HTML은 v208 후보 문구, 테스트는 v207을 정확 기대. 프로필 catalog의 진행 중은 v205, 최근 완료는 v200~204까지여서 최신 승인 변경을 누락.
- 계획: v208 공부 집계·접힌 사이드바·미세 동작을 최근 완료, v209 뉴스룸 댓글·Gemini 2차 의견·경제 퀴즈·첫 호칭 정리를 진행 중으로 표시. 독립 QA 수행 여부는 기존 안내로 구분.
- 검증: 진행 중. 날짜는 catalog snapshot이며 실행일과 비교하지 않음.
- 데이터/Cloud/schema: 읽기 전용 정적 UI 수정만 수행. 저장 경로 변경 없음.
- Notion: 현황판 읽기 성공, 계획 append는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never` 거절. 저장/read-back 완료로 보고하지 않음.
- PR/Preview/배포: 없음. Candidate/One-Pass/독립 HINA/실제 사용자 Cloud/Android/Production read-back 미검증.

## 다음 담당에게

- 먼저 읽기: 위 catalog와 AI 업무 테스트, green-209/quiz-client-209/board-vocative 인수인계.
- 다음 행동: targeted 검사 후 결과 업데이트, Claude에게 미커밋 변경 인계. 열차 freeze/최종 검증/승인/배포는 별도.
- blocker: Notion 쓰기 정책. 추가 사용자 결정 없음.
- CURRENT/DECISIONS: 완료 시 CURRENT에 이 작업 요약만 추가, 새 결정 없음.
- Notion 갱신 대기: 날짜·담당·branch/base·위 수정 범위·최종 테스트 결과·미검증·커밋/배포 없음·이 인수인계 링크.

## 완료 결과와 검증

- `hani-main.js`: 7명 카탈로그에 v208 공부 집계·접힌 사이드바·미세 동작 최근 완료 1개씩 추가(기존 3~4개 기록 유지, 최종 4~5개). now는 v209 뉴스룸 댓글·Gemini 2차 의견·경제 퀴즈·첫 호칭 정리의 담당별 진행/검토 대기로 변경. 하니/QA 역할의 독립 수행 완료로 해석하지 않도록 기존 note 그대로 유지.
- `index.html`: AI 업무 설명만 `v2.9.208 반영 완료 · v2.9.209 후보 진행 중`으로 정정. title/표시 버전/HANI_DISPLAY_VERSION/cache 상승 없음.
- `scripts/hani-ai-work-status.test.mjs`: AI 업무 section에서 날짜 형식/유효 날짜/2026-10-11 하한·프로필과 요약 날짜 일치, shipped >= v208 / candidate >= v209 / candidate > shipped 검사. recent는 semantic version >= v200, 각 직원은 >= v208 recent와 >= v209 now 요구. 7명/고유 key/3~5 recent/모든 항목 실제 renderer 출력/독립 QA 안내/기존 no-write·no-commit throw 유지.
- 미래 `2027-01-01 / v2.10.0 → v2.10.1` 허용, stale v207/후보 v208/후보 역전/잘못된 날짜/과거 날짜 거절 실행 확인. 최신 버전·현재 날짜 정확 pin 없음.
- 실행 환경: Node v24.20.0, 시작 HEAD 위 현재 미커밋 파일, synthetic state/VM. 테스트 실행 중 실제 사용자 저장소·원격 DB 호출 없음.
- PASS `node scripts/hani-ai-work-status.test.mjs`: 7명 실제 profile renderer, 날짜/버전 경계, 원래 무쓰기 guard.
- PASS `node scripts/hani-fix-208.test.mjs`: 7/7(집계·orphan 보호/실패 rollback·완료 transition·reduced motion·count-up·기존 commit 성공 조건).
- PASS `node scripts/hani-quiz-client-209.test.cjs`: 7/7(client/server 정합성·재시도·뉴스 상한·기존 state/무쓰기).
- PASS `node scripts/hani-nav-groups.test.mjs`: 메뉴·speaker·collapse aria/layout contract.
- PASS `node artifacts/ai-work-status-209/safety.cjs`: 카탈로그 밖 main 전체 byte-identical, HTML 요약 밖 전체 byte-identical, IDs/storage/destructive 호출 불변, 기존 no-write/no-commit/독립 QA 안내 guard 원문 유지, 기존 줄별 EOL 유지(main은 CRLF catalog 행 7개 추가만).
- PASS `node scripts/hani-investment-research-safety.test.cjs artifacts/ai-work-status-209/hani-main.js.baseline artifacts/ai-work-status-209/index.html.baseline`: 21 보호 owner·내부/표시 버전·storage key·cache·mixed EOL 불변.
- PASS `node --check hani-main.js`, `node --check scripts/hani-ai-work-status.test.mjs`, `git -c core.whitespace=cr-at-eol diff --check`.
- 실패 로그에는 이 Node 테스트 1개뿐. 승인 변경 누락과 오래된 기대값을 수정했으며 기존 app event/renderer/write 경로의 결함은 이번 scope에서 발견하지 않음.
- 증거/원본: `artifacts/ai-work-status-209/` (수정 직전 raw byte baseline, scoped safety, 실행 요약). 기존 다른 담당 artifacts는 수정하지 않음.
- 미검증: 실제 Edge 화면/실사용 계정·Cloud·Android·Candidate/One-Pass/독립 HINA·열차/운영 read-back. VM 렌더 결과와 실제 화면 검증을 구분.
- CURRENT는 이 결과 요약만 prepend, 이전 기록 보존. 커밋·push·PR·merge·배포 없음. Claude가 이 미커밋 변경을 검토한 뒤 사용자 승인 범위 내 후속 처리.
- Notion 최종 갱신 대기: 도연/2026-10-11, hani/green-209@c796d2a, main759ae68/v208, 위3파일 수정·Node 및 safety PASS, Edge/열차/운영 미검증, 미커밋/배포 없음, 다음 Claude 인계. 계획 append 자동 승인 검토가 never로 거절되어 다른 쓰기 경로 우회·완료 보고 없음.
