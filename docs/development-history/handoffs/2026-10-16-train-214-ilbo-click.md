# train-214 일보 클릭 병합 회귀

## 작업 식별

- 갱신(KST): 2026-10-16. 담당: 도연(Codex), 단독 개발 및 자동 검사.
- 상태: selector 최소 수정 완료 / 브라우저 최종 검증 차단. 커밋·push·버전 증가·main 병합·배포 없음.
- branch / worktree: hani/train-214 / t214.
- base HEAD: 790c55692e780881dcb45c0a8f2b953c75a57fb3.
- GitHub main: 3aee805904679000673560b2f3eb9a97fa9e64d9 (API 확인; shell 네트워크 차단).
- 표시/cache v2.9.213, 마지막 runtime hani-ai-budget.js?v=2.9.213. 운영 read-back 미실행.
- 승인: 대표님 요청의 ilbo 클릭 timeout 원인 최소 수정 및 지정 회귀 재실행. 커밋·버전 증가 금지, mixed EOL·안전 assertion 유지.
- 수정 파일: scripts/hani-ilbo-213.test.mjs. 앱 파일 변경 없음. 시작 시 기존 artifact/qa-evidence 변경은 보존.
- CODEMAP: study-daily-quiz/living-office 확인; ilbo/PWA/staff 최신 경로는 CODEMAP_MISS로 관련 테스트·owner fallback.

## 결과와 증거

### 원인과 최소 수정

기존 OS temp의 실제 실패 결과를 읽어 artifacts/train-214-ilbo-click/original-timeout.json에 보존했다. browserError는 201행의 다음 locator 대기를 명시한다:

`section#ilbo → .ilbo-fold:not([open]) → nth(3) → :scope>summary`

Playwright .all()의 각 locator는 nth 순번을 매번 재평가한다. 클릭으로 open이 붙으면 :not([open]) 목록이 줄어 다음 nth가 다른 항목을 가리키거나 사라진다. 오버레이 차단 로그가 아니며, visual branch에도 같은 loop가 존재했다. 지목된 timeout의 원인은 이 동적인 selector다.

전체 `.ilbo-fold` 목록에 순번을 고정하고, 각 항목이 닫혔을 때만 summary를 실제 click한다. 각 클릭 뒤 open 및 전체 닫힌 항목 0개 assertion을 추가했다. force click·직접 DOM open·skip·timeout 증가·안전 assertion 삭제 없음.

### 요청 테스트별 결과

요청 4개 + 이전 PASS 9개에서 ilbo/PWA/staff 3개가 중복되어 고유 테스트 10개를 모두 호출했다.

| 테스트 (.test.mjs) | 최종 전체 결과 | 확인된 부분 / 제한 |
|---|---|---|
| hani-ilbo-213 | BLOCKED | Node 11 PASS, browser spawn EPERM. 수정 후 실제 클릭/6화면은 미검증 |
| hani-exam-popup-214 | BLOCKED | Node 7 PASS, --browser 실행은 spawn EPERM |
| hani-pwa-213 | BLOCKED | static 4 PASS, browser spawn EPERM |
| hani-staff-floors-214 | BLOCKED | Node 10 PASS, browser 1 skip(spawn EPERM); exit0을 전체 PASS로 취급하지 않음 |
| hani-board-community | PASS | 전체 실행 성공 |
| hani-google-drive-212 | PASS | 전체 실행 성공 |
| hani-investment-research-ui | BLOCKED | browser spawn EPERM |
| hani-login-a-204 | PASS | raw origin/main baseline으로 모든 preservation 검사 포함, skip 없음 |
| hani-proactive-204-ui | BLOCKED | browser spawn EPERM |
| hani-proactive-204 | PASS | 21/21, raw Git baseline 및 runtime.diff fixture 사용, assertion 변경 없음 |

환경: Node v24.19.0(번들), 최종 ilbo/login/proactive v24.20.0; 동일 작업 파일. Playwright는 기존 번들 모듈, 실제 Edge 지정. 명령/종료코드/로그는 artifacts/train-214-ilbo-click/status.json 및 run.ps1. Node의 git spawn EPERM은 기존 HANI_LOGIN_TEST_BASELINE/HANI_PROACTIVE_TEST_BASELINE 옵션으로 해결했다. native Git stdout을 cmd 리다이렉션으로 원문 바이트 그대로 export했다. main/index는 origin/main, 나머지 baseline은 HEAD, runtime.diff는 실제 git diff다. 초기 차단 로그도 보존했다.

브라우저 직접 생성과 번들 Node 생성 모두 EPERM. 별도 Edge/CDP 연결은 연결 단절/timeout으로 실패했고, Edge와 연결 검사를 묶은 추가 shell 명령은 정책 검토에서 blocked by policy로 거절됐다. 우회·권한 상승 없음. 이 환경에서 UI 결과를 PASS로 기록하지 않았다.

### 보존 검증

- node --check scripts/hani-ilbo-213.test.mjs PASS.
- git -c core.whitespace=cr-at-eol diff --check -- scripts/hani-ilbo-213.test.mjs PASS.
- artifacts/train-214-ilbo-click/safety.mjs PASS: 기존 모든 assertion 유지, loop 밖 원문 바이트/EOL 동일. diff 6추가/1삭제.
- runtime·저장소·Cloud·schema·보호키·버전/cache 수정 없음. 기존 테스트 assertion을 약화하지 않음.
- 수정 후 브라우저 클릭·실제 화면/AA/overflow/인쇄는 차단되어 미검증. UI 회귀 해소 확정은 다음 실행 필요.
- Package/One-Pass/HINA/main/Pages/Production 미실행(요청 범위 밖).

## 다음 담당에게

- 먼저 scripts/hani-ilbo-213.test.mjs 201행 및 original-timeout.json을 읽는다.
- 다음 행동: 브라우저 생성이 허용되는 환경에서 BLOCKED 6개를 동일 파일로 재실행한다. 시험지는 --browser 인자 필요. 전체 명령은 status.json/run.ps1 참고.
- 현재 4 PASS / 6 BLOCKED. 기능 assertion FAIL은 확인되지 않았으나 전체 통과가 아니다.
- Notion 시작 계획 생성 및 read-back 완료: https://app.notion.com/p/3fbc5275707481d292a3d4c028ea93fb
- Notion 최종 결과 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절했다. 이 문서의 원인·수정·테스트 표·차단·다음 행동이 Notion 갱신 대기 내용이다.
- CURRENT에는 이 작업의 확인된 결과만 기록. 타 담당 및 기존 증거 보존.
