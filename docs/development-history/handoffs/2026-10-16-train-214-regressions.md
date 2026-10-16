# train-214 병합 회귀 10개 수정

## 작업 식별

- 날짜(KST): 2026-10-16. 담당: 도연(Codex), 단독 개발 및 자동 검사.
- 상태: 9개 수정·개별 및 최종 재검증 완료, market 1개 범위 결정 대기. 커밋·push·버전 증가·main 병합·배포 없음.
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/train-214 / t214.
- 시작 HEAD: 7232e1025336853497e7a6854ee072dea41346ab.
- origin/main 및 GitHub main 조회: 3aee805904679000673560b2f3eb9a97fa9e64d9, 일치.
- index 표시/cache: v2.9.213, 마지막 runtime JS hani-ai-budget.js?v=2.9.213. 운영 read-back 미실행.
- 승인: 대표님 요청의 지정 테스트 10개 원인 분석·최소 수정·개별 및 최종 재실행.
- 범위: 지정 테스트 및 확인된 최소 runtime 결함. mixed EOL·무쓰기/안전 assertion 유지. Cloud·새 저장키·버전 변경 없음.
- 시작 시 다른 담당의 기존 artifact/qa-evidence 변경 존재. 보존하며 수정하지 않음.
- CODEMAP: investment-research / study-daily-quiz / living-office owner 확인. 최신 ilbo·PWA·staff·market refresh는 CODEMAP_MISS로 테스트와 관련 owner를 좁혀 확인.

## 결과와 증거

- 최초 실행 로그: artifacts/train-214-regressions/initial-*.log 및 initial2-*.log.
- 번들 Node v24.19.0 / Playwright / 실제 Edge 사용. 설치 AppData Node·Git 접근 거부는 번들 runtime으로 해결.
- Git 원격 shell 조회는 네트워크 차단, GitHub API로 main 확인.
- 수정 범위: runtime은 index.html의 기본 theme-color/기존 stylesheet 줄끝과 hani-design-system.css의 40px 날짜 버튼 열 너비뿐. JS·저장·Cloud owner는 시작 HEAD와 byte-identical.
- 변경 테스트: Board/Drive/Ilbo/Investment UI/Proactive UI/Proactive Node/PWA/Staff 8개. 로그인 테스트 자체는 변경하지 않음.
- 개별 및 최종 전체 재실행: browser 인자 기준 **9 PASS / market 1 FAIL**. 무인자 10개도 전부 실행: 6 PASS / market 1 FAIL / 필수인자·모듈 환경 오류 3개. 최종20호출은 final-status.json 및 각 로그 참조. 미검증/미실행을 PASS로 표시하지 않음.
- Notion 계획 생성 및 read-back 완료: https://app.notion.com/p/3fbc5275707481f58df2c63f50eaaba0.
- Notion 후속 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 아래 결과/남은 경계가 갱신 대기 내용.

### 테스트별 원인 → 최소 수정

| 테스트 (.test.mjs) | 원인 | 수정 |
|---|---|---|
| hani-board-community | MIR/AI STAFF의 이전 hani-staff 파일명 기대 | 승인된 모든 직원의 profile thumb 128 경로로 갱신, 18명/크기/lazy/fallback 검사 유지 |
| hani-fixes-213-market | main에는 #274 테스트만 seed, hani/fixes-213의 chartIsStale 및 수집기 구현 3파일 미반영 | assertion/구현 미변경. Cloud 캐시 갱신 동작에 영향이 있어 현재 Cloud 변경 금지 범위 밖이며 결정 대기 |
| hani-google-drive-212 | v212 고정 기대값이 현재 main v213과 다름 | 테스트의 main/UI cache 기대값만 현재 v213으로 정정. Calendar core hash/auth/무쓰기 검사 유지 |
| hani-ilbo-213 | v212 고정 기대값 | 현재 v213 기대값. 원문 digest/0쓰기/AA/overflow/인쇄 검사 유지 |
| hani-investment-research-ui | 승인된 PWA가 모바일 bar를 44→48px, 터치 영역 40px로 변경 | 높이 기대값 48px. 상태/저장 불변·실제 bar 겹침 검사 유지 |
| hani-login-a-204 | merge가 기존 index stylesheet 한 줄의 LF를 CRLF로 바꿈. meta 줄도 drift | 원래 stylesheet 한 줄 LF 복원. meta는 승인 PWA 색상으로 복원하며 LF 유지. 테스트 변경 없이 통과 |
| hani-proactive-204-ui | Remote가 이제 inline studyQuizDetail 대신 modal 시험지를 엶 | 실제 열린 dialog/4선택지/해당 퀴즈 launcher/닫기/저장0 검사로 갱신 |
| hani-proactive-204 | VM fixture에 새 canonical openExam 의존성 누락, merged HEAD의 잘못된 EOL을 기준으로 사용 | openExam spy와 같은 quiz 전달 assertion 추가. EOL/version/cache 비교 원문을 drift 전 origin/main으로 지정, 모든 보호 assertion 유지 |
| hani-pwa-213 | index theme-color가 이전 값으로 병합됨. 884px에서 38px 날짜 열에 40px 버튼이 2px 넘침 | 기본 #eee5d5 복원. 기존 max900 media에 날짜 열 최소40px 한 줄 추가. overflow 원인 진단 정보 추가, 기존 40px/resize/무쓰기 검사 유지 |
| hani-staff-floors-214 | 기본 회사소개 탭에서 숨겨진 People 이미지를 대기 | canonical organization/people 경로로 입장. 모든 배경/이미지 decode·404·overflow·보호키 불변 검사 유지 |

### 검증 경계

- Node v24.19.0, 번들 Playwright, 실제 msedge.exe, synthetic 격리 데이터/외부 요청 차단. 실제 계정·운영 데이터 사용 없음.
- hani-ilbo: 412/884/1440 × light/dark 6조합. Proactive: 1440/390 × Porcelain/Midnight 4조합. Investment: 동일4조합. Staff: 412/884/1440의 인물·4층 배경.
- PWA: 412/884/1440/360/700/900, 54화면 조합 및 412→884→412 입력값/같은 DOM/저장0 검사.
- 변경8테스트 syntax, PWA --static 4그룹, git diff --check(cr-at-eol), 보호 owner/버전/cache/id/새쓰기/변경 밖 EOL 및 최종 source identity 검사 PASS.
- 증거: artifacts/train-214-regressions/final-status.json, final-*.log, final-source-identity.json, safety.cjs. 최초/개별 실행 로그도 같은 폴더.
- 무인자 실행도 별도로 시도. Investment UI/Proactive UI는 명시된 필수 인자가 없어서 usage 오류, PWA는 미설치 bare playwright import로 환경 오류. 이 셋의 UI PASS 근거는 올바른 Playwright/Edge 인자로 실행한 실제 검사이며 무인자를 PASS로 간주하지 않음.
- 실제 auth/운영 Cloud/Android/서버 배포/Package/One-Pass/HINA/Pages/Production read-back 미실행. 표시/cache v213 유지, runtime version bump는 열차 담당 경계.

## 다음 담당에게

- 남은 핵심: market 구현을 현재 금지 범위로 보류할지, 별도 승인 범위에서 누락 3파일을 복원할지 대표님 결정 필요. 최신 금지 범위를 우선하며 타 branch/worktree 수정·merge/rebase 없음.
- 누락 파일: market-gateway/cache-publisher.mjs, pc-collector.mjs, portfolio-collector.mjs. 참고 hani/fixes-213와 현재 HEAD 차이는 45추가/6삭제. 참조 구현의 신규 clear 호출도 현재 요청 금지 범위이므로 파일을 통째로 가져오지 않았음. 테스트 완화·가짜 export·skip 없음.
- CURRENT에 이 작업의 확인된 9/10 결과만 추가. Notion 후속 결과는 자동 승인 거절로 갱신 대기.
- Candidate/Full Package/One-Pass/HINA/배포는 이번 요청 범위 밖.
