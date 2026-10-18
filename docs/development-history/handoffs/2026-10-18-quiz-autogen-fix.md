# 퀴즈 자동 생성 실패 수정 · 도연(Codex)

## 작업 식별

- 날짜(KST): 2026-10-18
- 담당: 도연(Codex), 단일 개발 Agent
- 상태: 구현·targeted 검증 완료, 서윤 검토 대기. Git 권한 차단으로 **미커밋** 보존.
- branch/worktree: `hani/quiz-fix-216`, `qf216`
- base SHA: `5dd6bebf1f42c139824cfc92196d46a6d0d970e8` (hani/office-v2-215)
- 범위: `hani-study-v02984.js` 자동/수동 생성 오류 표시와 메모리 cooldown, `supabase/functions/hani-learning-quiz/index.ts` 검증 계약, 관련 테스트 및 이 문서.
- 승인 근거: 2026-10-18 성민 대표님 수정 요청. 버전 변경·새 영속 write·보호 저장소 write 변경·Cloud/schema 변경·배포·main merge 제외.
- 기준선: git ls-remote는 로컬 프록시 연결 실패. GitHub 연결 도구의 main branch GET으로 `9820814510f9570641612d1369aa8b623ee69ab5` 확인, 기존 origin/main과 동일. main index 원문에 `v2.9.214`, study `?v=2.9.214`, 마지막 UI script `hani-ai-budget.js?v=2.9.214` 확인. 실제 로그인 화면/브라우저 JS 로딩은 미검증. office 기준 branch와 main의 기존 차이는 보존했으며 merge/rebase 없음.

## 결과와 증거

### 확인한 원인과 근거

- 클라이언트: `renderMain → maybeAutoGenerate → generateTodayQuiz` 경로. 자동/수동이 공통 catch의 `alert()`를 호출. `autoGenerationAttempts = new Set()`, `generationFailures = new Map()`은 페이지 메모리뿐이며 reload 시 초기화된다. 실패 기록의 기존 영속 경로는 없음.
- 서버: 운영 `hani-learning-quiz` **v14**를 읽기 전용으로 조회했다. `verificationPrompt`, `verificationSchema`, `validateQuestionConsistency/validateVerifiedQuestions`의 핵심 계약은 작업 기준선과 같다. 실제 OpenAI 호출·운영 문항 생성·DB 쓰기는 수행하지 않았다.
- **로컬에서 입증한 전량 탈락 원인:** 해설 정규식이 `금리 인상이 정답이 아닙니다` / `수입 원가 하락이 정답이 아닙니다`를 긍정 정답 선언으로 오인했다. 생성 key=0, blind `correct_indices:[0]`, `ambiguous:false`인데 두 문항 모두 `explanation_key_disagreement`. 변경 전 실행 출력:

  ```json
  [{"question_index":0,"reasons":["explanation_key_disagreement"]},{"question_index":1,"reasons":["explanation_key_disagreement"]}]
  ```

- 같은 fixtures를 수정 후 실제 validator에 통과시키면 경제 2/2·JLPT N3 2/2 허용, `rejected:[]`. 경제 뉴스의 canonical 원문·출처 판정도 통과한다. 실제 handler에 생성/검증 Responses envelope를 순서대로 주입한 5문항 fixture도 두 분야 모두 HTTP200, 모델 요청 2회, `db_write:false`, `hani_state_touched:false`.
- 긍정 해설 control은 수정 전에도 통과했다. 올바른 필드명/0-based index/N3 판정/뉴스 원문에 일괄 실패를 강제하는 구조는 확인되지 않았다. 필드 누락·중복 check·index 불일치·복수정답·blind 불일치·상위 수준·기초 수준 quota는 계속 거절한다.
- **운영 원인 확정 한계:** 실제 실패 응답 `validation.rejected` 및 원래 생성/검증 문항은 확보하지 못했다. read-only 함수 로그 조회에서도 문항별 탈락 사유는 확인되지 않았다. 위 오탐이 성민 대표님의 모든 운영 실패와 동일 원인이라고 확정하지 않는다. 실제 gpt-5.6-luna 출력 품질은 미검증이다. 후속 실패 시 화면에 표시되는 사유별 문항 수 또는 서버 응답의 `validation.rejected`로 대조해야 한다.

### 변경 파일

- `hani-study-v02984.js`: 생성 경로에서 alert 제거. 자동 생성은 전역 작업 오버레이도 열거나 닫지 않는다. 프로젝트 Learning Board의 기존 note에 자동/수동 실패·escaped 메시지·버튼 재시도 안내를 표시(`role=status`). 서버가 이미 반환한 허용된 탈락 사유만 한국어·건수로 표시하여 원인 확인 가능. 별도 이벤트/렌더러 layer 추가 없음.
- 같은 프로젝트·KST 당일 실패 Map과 시도 Set으로 자동 재시도를 차단한다. 실패 후 rerender도 추가 생성을 요청하지 않는다. 수동 버튼은 계속 재시도 가능. 기존 생성 날짜/스케줄 판정은 유지하고 cooldown key에만 KST 일자를 적용한다.
- **새로고침을 넘는 cooldown은 미구현:** 허용된 fallback인 페이지 세션 메모리만 사용했다. reload하면 다시 자동 요청할 수 있다. 이를 보장하려면 별도 영속 write 경로에 대한 대표님 승인이 필요하다. sessionStorage/localStorage/쿠키/Cloud 등 새 write는 추가하지 않았다.
- `supabase/functions/hani-learning-quiz/index.ts`: 정답 선언 직후의 한국어/일본어 부정문을 정답 선언으로 세지 않는다. 일본어 `が正解`의 긍정 선언도 검사한다. 이후 다른 긍정 정답 선언이 있으면 계속 검출한다. blind 검증·schema·prompt·정답일치·JLPT 수준 quota·뉴스 검사는 유지. 자동 재호출이나 추가 모델 호출 없음.
- `scripts/fixtures/quiz-autogen-216.json`, `scripts/hani-quiz-autogen-216.test.mjs`: 뉴스 경제·JLPT N3 실제 형태 데이터, 탈락 사유 출력, 실제 validator/handler·실패 UI·메모리 cooldown 테스트.
- `scripts/hani-quiz-qa-212.test.cjs`: 기존 alert 기대를 실제 in-page 실패 안내 및 alert 0회 검증으로 변경.

### 실행한 검증

Windows PowerShell / Node v24.20.0 / base 위 최종 작업 파일, NORMAL targeted 검사.

| 명령 | 결과 |
| --- | --- |
| `node scripts/hani-quiz-autogen-216.test.mjs` | 8 PASS |
| `node scripts/hani-quiz-quality-210.test.mjs` | 16 PASS |
| `node scripts/hani-quiz-qa-212.test.cjs` | 10 PASS |
| `node scripts/hani-quiz-client-209.test.cjs` | 7 PASS |
| `node scripts/hani-learning-quiz-quality.test.mjs` | 12 PASS |
| `node scripts/hani-study-tutor-215.test.mjs` | 3 PASS |
| `node scripts/hani-fix-208.test.mjs` | 7 PASS |
| `node scripts/hani-learning-quiz-v04.test.mjs` | standalone PASS |
| `node scripts/hani-study-news-material.test.js` | standalone PASS |

- 총 63 tests + standalone 2개 PASS. 자동 실패 alert/confirm/전역 overlay 0회, 수동 재시도, KST 자정 경계·프로젝트 분리, reload 시 메모리 초기화, 실패 상태 원본 보존을 실행 검증했다.
- `node --check hani-study-v02984.js`, `node --check supabase/functions/hani-learning-quiz/index.ts`, 변경 test 2개 syntax PASS. `git -c core.whitespace=cr-at-eol diff --check` PASS.
- 기준 HEAD와 함수 원문 비교: `persistQuizRegrade`, `persistNewProject`, `persistProjectUpdate`, `persistProjectStatus`, `persistGeneratedQuiz`, `persistQuizAnswer`, `persistWrongUpdate`, `gradeQuiz`, `upsertWrongAnswer` 9개 동일. localStorage/commit 호출 지점 동일. 보호 key write·Cloud write/schema·migration 변경 없음.
- UI 근거는 실제 owner renderer 실행의 VM DOM fixture다. 실제 브라우저 시각 Preview·운영 로그인·Deno serve/typecheck·실제 AI 의미 품질·Android 미검증. 전체 build/One-Pass/독립 HINA/아린은 기능 개발 범위 N/A, 열차에서 수행.
- 표시 버전/캐시 태그/internal baseline 변경 없음(대표님 지시). 운영 버전 상승은 배포 담당 열차에서 처리.

### Notion / Git / 배포 상태

- [Notion 개발 카드](https://app.notion.com/p/3fcc527570748180b7a8d5f6b26f766d): 초기 계획 생성·fetch 확인 완료. **최종 결과 반영 대기.** 진행 insert_content 요청은 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절했다. 재조회에도 최종 결과는 없음. 현재 진행 중 표시는 초기 계획 상태다.
- 다음 담당은 카드에 위 결과·미검증·영속 cooldown 승인 경계와 Git 상태를 반영하고, 인계가 수락되면 `탑승 대기`로 갱신 후 읽기 확인할 것.
- PR 생성·main merge·Edge 배포·Pages 반영·Production read-back **모두 미실행**. 운영 수정 완료로 보고하지 않는다.
- 커밋 시도: 지정한 6파일의 `git add -- ...`에서 `Unable to create 'C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/qf216/index.lock': Permission denied`. 실제 Git 관리 경로가 이 세션의 writable root 밖이라 staging부터 차단됐다. commit 명령은 add 성공 조건에 도달하지 못했다. 우회·권한 변경 없이 요청대로 **6파일 미커밋**, HEAD `5dd6beb` 유지. push도 미실행. Git 쓰기가 가능한 동일 branch 환경에서 이 6파일만 검토·commit·push 필요.

## 다음 담당에게

- 먼저 읽을 곳: 클라이언트 `renderMain/quizFailureMessage/maybeAutoGenerate/generateTodayQuiz`, 서버 `explanationAnswerIndices/validateVerifiedQuestions`, 신규 테스트/fixture.
- **서윤 검토 후 Edge Function + 클라이언트 release 모두 필요.** 클라이언트 알림 완화는 기존 서버와 호환된다. 열차에서 client 통합·검증 → 승인된 canonical merge/Pages → `hani-learning-quiz` 별도 배포 → 인증된 실제 경제·JLPT 프로젝트에서 read-back 순서. 기존 운영 JWT·owner·secret 설정 보존, 새 설정/schema/다른 Edge Function 변경 없음.
- 전량 거절이 재발하면 새 안내의 사유별 건수/서버 `validation.rejected`부터 확인. blind 불일치를 index 자동 보정하거나 level 검사를 해제해 통과시키지 말 것.
- 대표님 승인 범위는 이 수정·테스트·커밋 시도까지. 새 영속 cooldown·배포·main merge 승인은 아님. CURRENT/DECISIONS는 다른 작업 기록을 보존하여 수정하지 않았다.
