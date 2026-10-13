# Gemini 2차 의견 자동화 · 도연(Codex)

## 작업 식별

- 시작: 2026-10-13 KST. 갱신: 2026-10-14 KST. 상태: 구현·targeted/safety 검증 완료, 미커밋 개발 파일 인계 대기.
- branch/worktree: `hani/gemini-auto` / `gm211`.
- 시작 HEAD 및 로컬 origin/main: `8833943c62eedf251cb9266477a96cb7d7a29a74` (v2.9.210 + tooling). GitHub connector의 main commit 조회와 일치. checkout 원본은 해당 HEAD blob과 대조. 로컬 표시 v2.9.210, 마지막 script `hani-ai-budget.js?v=2.9.210`; Production URL 조회 실패로 실제 운영 화면/JS는 미확인.
- 담당: 도연(Codex) 단독 개발 + 자동 검사. 독립 리뷰/배포 QA 아님.
- 대표님 승인: 제공된 GOAL의 버튼 자동화·새 읽기 전용 Edge Function·테스트·인수인계 개발.
- 수정 범위: `hani-investment-committee.js`, `supabase/functions/hani-second-opinion/index.ts`, `scripts/hani-second-opinion.test.mjs`, `scripts/hani-second-opinion-ui.test.mjs`, 이 인수인계. 커밋·버전/cache 변경·push·main merge·배포 없음. Cloud schema/테이블/저장 경로 변경 없음. 로컬 검사 산출물은 `artifacts/gemini-auto/`, 기존 안전검사 화면은 `qa-evidence/`에 별도 보존.

## 결과와 증거

- 서버: POST/OPTIONS CORS, Supabase getUser로 JWT 검증 후 `HANI_OWNER_USER_ID` allowlist 검사(학습 퀴즈 helper와 같은 정책). 미인증401·비소유자403·owner 미설정503. prompt 문자열/비어 있음/60,000자 상한 검증. 서버 환경변수의 키를 `x-goog-api-key` header로만 전송, generateContent temperature0.4·60초 AbortController. 모델 기본값 `gemini-flash-latest`. 키 미설정503, quota429, upstream502. upstream body/예외/키/프롬프트 로그 및 응답 유출 경로 없음. 빈 응답/키 포함 응답도 거절.
- 서버 사용자별 warm isolate 메모리 제한: 10분당6회, 호출 전 예약(실패도 한도에 포함). isolate 재시작·복수 isolate 사이에 한도는 공유되지 않음. 전역 quota 보장 아님. DB 쓰기 없음.
- 클라이언트: 복사 옆 `✨ Gemini에게 바로 묻기`, 로그인 필요·실행 중 비활성화/aria-busy·한국어 loading. quizApi와 같은 cloudClient.auth.getSession/cloudConfig/POST header 호출 패턴. 복사와 정확히 같은 buildSecondOpinionPrompt 출력 전송. `showSecondOpinion`으로 기존 parse-second의 검사·Map·카드 renderer를 공유하며 계정/요청 카드 변경 시 반영 차단. 서버/네트워크/형식 오류는 수동 흐름 안내. 기존 파서/프롬프트/메모 저장 함수 및 save-second event bytes 그대로 유지.
- 데이터: 자동 응답은 메모리 패널만 사용. 새 localStorage 키·보호 write·Cloud write/schema/migration 없음. 기존 메모 저장 버튼·확인 이후의 기존 저장 경로 유지. `hani-main.js`/index.html raw bytes, 버전/cache 및 보호 owner21곳 변경 없음. client 유지/이동854행의 EOL 보존; 원본 LF606/CRLF355 → 수정본 LF609/CRLF406(혼합 유지). 중복 id literal 및 `.clear(` 없음.
- 테스트 환경: Windows PowerShell, Node24.21.0, Edge headless, 합성 fixture와 mocked env/auth/fetch. 실제 사용자 데이터·실제 Gemini 호출·DB 쓰기 없이 검사. `artifacts/gemini-auto/verified-identity.json`에 최종 runtime/test SHA256, 각 명령 로그에 결과 보존.

### 실행한 검증

- `node scripts/hani-second-opinion.test.mjs` — 16/16 PASS: 인증/owner/입력 경계/키 미설정/quota/upstream/성공/header 키 비노출/timeout/rate-limit, canonical client click·정확한 copy prompt·parser/card render·저장0·오류 fallback·로그아웃·중복 실행·계정/카드 stale·세션 불일치.
- `node scripts/hani-investment-committee.test.cjs` — 8/8 PASS.
- `node scripts/hani-investment-research.test.cjs` — 15/15 PASS.
- `node scripts/hani-post-audit-investment.test.mjs` — PASS.
- `node scripts/hani-second-opinion-ui.test.mjs <playwright/index.mjs> <browser.exe>` — Edge1440/390 × 밝음/어두움4조합 PASS: 버튼/로딩/실제 렌더·escaping·copy 동일 프롬프트·저장0·키 미설정 안내·수동 붙여넣기·로그아웃 disabled·콘솔오류0. header PNG 육안 확인.
- `node scripts/hani-investment-research-ui.test.mjs <playwright/index.mjs> <browser.exe> artifacts/gemini-auto/ui` — 기존 투자 리포트 전체4조합 UI 회귀 PASS(최종 EOL 보정 후 재실행).
- `node scripts/hani-investment-research-safety.test.cjs artifacts/gemini-auto/baseline/hani-main.js artifacts/gemini-auto/baseline/index.html` — 보호 owner21·기존 storage/internal/display/cache/EOL PASS. 임시 원본 사본은 검사 후 제거; 재실행 시 위 base SHA의 raw 파일을 repo 밖 임시 경로에 추출해 인자로 전달. 결과/identity/화면 로그만 보존.
- `node scripts/hani-server-owner-access.test.mjs` — 기존 deploy-bridge/learning-quiz owner 허용·타인/설정 누락/잘못된 인증 차단 PASS.
- `node scripts/hani-protected-write-contract.test.mjs` — 19 negative cases PASS.
- `node scripts/hani-cloud-first.test.mjs` — 40 cases PASS.
- `node scripts/hani-cloud-egress-save-sim.test.mjs` — 기존 저장/충돌/rollback simulation PASS.
- `node scripts/hani-owner-verification-runtime.test.mjs <playwright/index.mjs> <browser.exe>` — 1440/390 두 테마, 보호 key 보존/소유권 PASS.
- `node scripts/hani-backup-history-runtime.test.mjs <playwright/index.mjs> <browser.exe>` — 11 full runtime backup cases PASS.
- `node --check hani-investment-committee.js`, 신규 Node 테스트 및 UI script syntax PASS. Edge TS는 stripTypeScriptTypes + 실제 handler mock 실행으로 parse/동작 확인. Deno typecheck를 PASS로 표시하지 않음.

### 미검증·승인 경계

- Deno/CLI 미설치: Deno check/serve 및 CLI local help 미실행. 인증된 실제 서버·Gemini 품질/속도·실제 quota·Android 미검증.
- Arin 독립 리뷰·release package/One-Pass/서버 HINA·main/Pages/운영 read-back 미실행. 최종 후보 작업이 아니며 gate 우회 없음.
- `hani-investment-committee.js`는 **runtime 변경으로 release 필요**. 기능 branch에서 버전/cache를 올리지 않았음. 배포 담당 Claude가 열차 후보에 포함하고 버전을 한 번 올려 기존 Candidate/승인 절차를 수행해야 함.
- 커밋/push 금지 지시로 branch push/PR 없음. 탑승 가능한 원격 commit은 아직 없음.
- Notion 계획 기록: 현황판 읽기 성공, insert_content 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 완료 아님. 작업 결과 포함 갱신 대기.

## 다음 담당에게

- 먼저 읽기: 신규 Edge index.ts, client `invokeSecondOpinion`/`showSecondOpinion`/ask-second/parse-second, 위 테스트·identity.
- 다음 행동: 승인된 커밋/인계 범위가 정해지면 배포 담당이 최신 main에 기능을 수용하고 서버 설정·실제 호출을 검증. 타 branch/worktree 수정·기능 충돌 임의 해결 금지.
- CURRENT/DECISIONS: 기존 다른 담당 기록은 보존. 이 작업 승인 원문은 대표님 GOAL이며 배포 승인으로 바꾸지 않음. Notion에는 위 날짜/담당/목적·구현/검증/미검증·base/branch·인계 대기/다음 행동과 원문 링크 기록 대기.

## 서버 설정과 배포 순서 (이 작업에서는 실행하지 않음)

1. Supabase Dashboard → **Edge Functions → Secrets → GEMINI_API_KEY**에 키를 서버 secret으로 저장. 실제 값을 client/repo/테스트/로그/채팅에 넣지 않음. 기존 `HANI_OWNER_USER_ID`가 실제 허용 사용자로 설정되어 있는지 확인하고 값은 출력하지 않음. `GEMINI_MODEL`은 선택 사항(기본 `gemini-flash-latest`).
2. CLI 대안: repo 밖 비공개 env 파일에 secret을 두고 `supabase secrets set --env-file <비공개-env-파일> --project-ref qmgikfdwjzmhkwadycxk` 사용. 값이 shell history/로그에 남는 직접 인자 입력은 피함. CLI 설치 후 해당 commands의 `--help`부터 확인.
3. 서버를 client runtime release보다 먼저 배포:

   ```sh
   supabase functions deploy hani-second-opinion --project-ref qmgikfdwjzmhkwadycxk
   ```

   **verify_jwt 기본 ON 유지**, `--no-verify-jwt` 사용 금지. config.toml/auth 설정 변경 없음. owner/JWT·키 미설정·정상 owner 호출을 서버에서 read-back 확인(원본 저장 없이).
4. 배포 담당이 client runtime을 열차 후보로 freeze → targeted 재검증·버전 증가·package/One-Pass/HINA·Preview/대표님 승인 → canonical merge/Pages → 표시 버전/최신 JS/버튼 결과와 수동 fallback을 운영 read-back. 승인 이전에는 진행하지 않음.

공식 확인 근거: [Supabase JWT/headers](https://supabase.com/docs/guides/functions/auth-headers), [서버 secrets](https://supabase.com/docs/guides/functions/secrets), [CLI deploy](https://supabase.com/docs/reference/cli/supabase-functions-deploy), [Gemini generateContent](https://ai.google.dev/api/generate-content). Supabase changelog.md 조회는 web provider가 markdown content-type을 지원하지 않아 실패; 관련 auth docs/MCP는 확인.


## 2026-10-14 · 웹 하니 최종 투자 의견 후속 (도연/Codex)

### 작업 식별

- 담당: 도연(Codex), 단독 개발. 상태: 구현·Node targeted/safety 검증 완료, 실화면 검증 대기.
- branch/worktree: `hani/gemini-auto` / `gm211`. 시작 HEAD `9ebf7e33c00699482622e3ebdde9a76d5f4d6950`, base/main `8833943c62eedf251cb9266477a96cb7d7a29a74`. Git 직접 원격 조회는 네트워크 실패, GitHub connector main 조회는 base와 일치. 로컬 v2.9.210·마지막 JS `hani-ai-budget.js?v=2.9.210`, Production 실제 표시/JS는 미확인.
- 승인: 대표님 이번 요청의 수동 웹 하니 최종 검토 UI·파서·기존 메모 텍스트 저장·테스트·이 문서 추가. 커밋·push·버전/cache 변경·main merge·배포 없음.
- 범위: `hani-investment-committee.js`, 최종 검토/기존 2차 의견 UI 테스트, 이 인수인계. 기존 다른 untracked 산출물 보존. CODEMAP의 investment-research owner 확인; final/second anchor는 CODEMAP_MISS로 실제 owner 검색.
- Notion: 현황판 읽기 성공, 계획 insert_content는 자동 승인 검토의 `MCP tool call requires approval, but approval policy is never` 거절로 미반영. 계획·최종 결과 갱신 대기.

### 결과와 증거

- 하니(web ChatGPT) 원문 → Gemini 반론 → **동일 웹 하니에게 수동 최종 검토** 흐름을 구현. 서버 GPT를 하니로 부르거나 최종 의견 서버 호출을 추가하지 않음. Gemini 패널 제목은 `세린 연구원 2차 의견 · Gemini`, 최종 패널은 `하니 최종 의견 (대표님 채팅에서 받은 답)`.
- 2차 의견이 있는 현재 종목들을 한 한국어 프롬프트로 복사: 저장/파싱된 FIELDS 전체(원 투자의견·thesis·bullCase·executiveComment·위험·확인 포인트 포함) + Gemini 동의/일부 동의/반대·우려·빠진 위험·적정가 점검·한 줄 + 지정된 검토 지시 + additionalProperties:false의 엄격한 배열 스키마. 기존 `copyPrompt`/notice 재사용.
- `parseFinalReview`는 plain/fenced JSON을 검증해 ticker+name으로 요청 종목을 대조. 필수/추가 필드, boolean과 유지/상향/하향 일치, 근거 정확히3개, 문자열/배열/길이, 기각 point/reason, 미요청/중복 종목을 검사. 한국어 오류 안내. `finalOpinions` Map과 persistent dialog/toolbar만 사용; 기존 host delegated click과 카드 renderer를 확장. 반영/기각·이유·근거·다음 확인·배지·변경 표시, HTML escape. 계정/종목/Gemini 교체 및 복사 도중 변경 guard; 오래된 최종 패널 숨김.
- 기존 `save-second` 메모 저장 버튼·confirm → `saveSecondOpinionNote` → 기존 `applyBatch/commit` 경로만 사용. options의 일시적 finalOpinion을 `valuationNote` 문자열로만 덧붙이며 저장 필드/키 추가 없음. 이미 저장한 Gemini 의견은 중복 없이 최종 의견만 추가 가능. 중복 저장 차단·기존 실패 rollback 유지. 투자의견/적정가·판단 이력·확정 월간 리포트 불변. 기존 `prepareBatch`의 수정시각/revision bookkeeping 유지.
- 파일: `hani-investment-committee.js`, `scripts/hani-final-review.test.mjs`(신규), `scripts/hani-second-opinion.test.mjs`(실제 handler 검증 확장), `scripts/hani-second-opinion-ui.test.mjs`(실화면 시나리오 확장), 이 인수인계. Edge Function·CSS·main runtime/index·Cloud/schema 변경 없음.
- `artifacts/gemini-auto/final-verified-identity.json`에 최종 파일 SHA256와 기준선 기록. 보호 main/index raw bytes 동일; owner21·storage/internal/display/cache 유지. client의 원문 내용 유지904행 EOL 보존, LF609/CRLF406 → LF612/CRLF493(혼합 유지). 새 중복 id literal·`.clear(`·localStorage/Cloud write 경로 없음. 버전/cache 증가는 기능 탭 규칙과 사용자 금지로 N/A, Release 필요성 자체는 유지.

### 실행한 검증 (Windows PowerShell · Node24.20.0 · 합성 데이터)

- `node scripts/hani-final-review.test.mjs` — 5/5 PASS: 모든 원문/반론/스키마·지정 문구, plain/fenced 파싱, malformed/엄격한 필드/배열/identity 경계, 메모 텍스트 저장·기존 필드/확정본 보존, 2차 의견 선저장 후 중복 없는 최종 추가, 실패 복원·stale 차단.
- `node scripts/hani-second-opinion.test.mjs` — 18/18 PASS: 기존16 + canonical copy/import/render/save 이벤트 실행2. 저장 전0회·confirm 취소0회·기존 메모 버튼 이후1회·최종 메모 내용·중복 차단·배지/변경/escape·계정/종목/의견 변경 guard.
- 기존 투자 Node 회귀: `node scripts/hani-investment-committee.test.cjs` 8/8, `node scripts/hani-investment-research.test.cjs` 15/15, `node scripts/hani-post-audit-investment.test.mjs`, `node scripts/hani-market-data-test.cjs` 12/12, `node scripts/hani-portfolio-completeness-test.js`, `node scripts/hani-invest-basis.test.cjs`, `node scripts/hani-invest-split.test.mjs` 모두 PASS.
- 저장 보호 회귀: `node scripts/hani-protected-write-contract.test.mjs` 19 negative PASS, `node scripts/hani-cloud-first.test.mjs` 40 PASS, `node scripts/hani-cloud-egress-save-sim.test.mjs` PASS(의도된 revision 충돌/복원 경고 포함).
- `node scripts/hani-investment-research-safety.test.cjs <HEAD raw hani-main.js> <HEAD raw index.html>` — owner21 및 원문/EOL/storage/internal/display/cache PASS. raw 검사 사본·일시적 편집 helper·격리 Edge profile은 정리 명령이 실행 정책에서 거절되어 `artifacts/gemini-auto/`에 남아 있음. 기존 다른 담당 산출물과 구분하여 다음 환경에서 작업 소유 임시 파일만 정리할 것.
- `node --check` runtime·신규 final test·확장 UI test PASS. `git -c core.whitespace=cr-at-eol diff --check` PASS(기본 Git check는 혼합 CRLF의 CR을 trailing whitespace로 취급하므로 원문 EOL을 바꾸지 않음).

### 미검증·차단·다음 담당

- 확장 UI test는 1440/390 × 밝음/어두움에 copy/오류/fenced/plain JSON·배지/변경·읽기 전용/escape·순서·저장 전0·취소·메모 저장1·계정 reset/콘솔0 시나리오를 준비했으나 **실행 완료 아님**. 명령: `node scripts/hani-second-opinion-ui.test.mjs <playwright/index.mjs> <browser.exe>`. 이번 환경은 `browserType.launch: spawn EPERM`, 외부 Edge CDP도 연결 후 끊김/timeout. 결합 실행은 실행 정책이 blocked by policy로 거절. 실패를 PASS로 재사용하지 않음. 기존 investment-research-ui도 이번 최종 runtime으로 실화면 재검증하지 못함. 이전 Gemini 자동화 화면 증거는 이번 기능의 증거가 아님.
- NORMAL UI/파서·기존 메모 텍스트 확장 범위. 운영 데이터 쓰기·실제 Gemini/웹 하니 답 품질·Android·Production read-back·Arin/HINA/Release Gate 미실행. 커밋·push·PR·버전/cache 변경·main/Pages/배포 없음. 기존 Edge 배포 순서는 위 원 인수인계 유지; 이번 후속에 새 서버 배포/설정 없음.
- Notion 갱신은 계획 추가가 자동 승인 검토에서 approval policy never로 거절되어 미반영. 같은 지시의 결과 갱신도 대기하며 재승인 요청/우회 없음. 이 섹션의 날짜·도연·목적/구현/Node검증·실화면차단·branch/base/HEAD·미커밋/미배포·다음 행동과 원문 링크를 현황판에 요약할 것. CURRENT/DECISIONS의 타 담당 기록 보존.
- 다음 한 가지 행동: 브라우저 실행 가능한 환경에서 확장 second-opinion-ui 및 기존 investment-research-ui를 실행·Preview 확인. 그 뒤 대표님이 허용한 인계 범위에서 배포 담당이 열차에 수용. 대표님 이번 개발 요청은 배포 승인 아님.
