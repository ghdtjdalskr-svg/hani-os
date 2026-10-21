# 키움 코드·2행 붙여넣기 수정

## 작업 식별

- 날짜: 2026-10-21 KST / 담당: 도연(Codex), 개발 Agent 1명 + 자동 검사.
- 상태: 구현·targeted 검사 완료 / NORMAL(parser·matcher·읽기 전용 Preview). 버전·배포 열차 후보 생성 없음.
- 저장소/branch/worktree: ghdtjdalskr-svg/hani-os / `hani/kiwoom-code-fix` / `kiwoom`.
- base/시작 HEAD: `331291eb29ec73b2cd5ca3f07eb2d02436e9d1ea`. GitHub 연결 도구의 최신 main과 일치. 표시/cache v2.9.223 유지. 마지막 script는 `hani-launch-greeting.js`(cache 없음), main runtime `hani-main.js?v=2.9.223`.
- 승인: 대표님 요청의 A-prefix 정규화·키움 2행 파싱·코드 우선 매칭·Preview·회귀 검사 및 commit 시도. 확정/write body, storage 구조, 버전/cache, Cloud/schema, main/배포는 제외.
- 수정 범위: `hani-asset-update-v1.js`, 신규 `scripts/hani-kiwoom-code-224.test.mjs`, 기존 asset smoke 2파일, 이 문서 및 CURRENT 작업 요약. 기존 브라우저 검사의 메뉴 선택자만 nav 소유 경로로 한정. 다른 담당 파일 수정 없음.

## 결과와 증거

- CODEMAP: asset-update owner와 DOM/event 검증. TSV parser anchor는 CODEMAP_MISS이며 좁은 검색으로 확인: 기준선 paste handler는 이미지만 처리하고 TSV parser는 없음. 기존 단일 paste 이벤트에서 텍스트를 해석하여 기존 draft/render/approve 경로를 재사용. 새 handler/renderer layer 없음.
- 원격 Git ls-remote는 네트워크 차단. GitHub fetch_commit(main)으로 위 SHA 확인.
- Notion 현황판 읽기 성공. 계획 append는 자동 승인 검토 `approval policy is never` 거절로 미반영. 작업/branch/base/범위·검증 결과·미검증·다음 행동 갱신 대기.

### 변경

- `normalizeIntakeCode`: trim/uppercase 후 `A` 뒤가 `[0-9][0-9A-Z]{5}`일 때만 1개 제거. parser·holdingTicker·makeHolding·매칭/병합이 같은 함수를 사용. AAPL/AMZN/A 및 비유효 remainder 보존.
- `parseHoldingsTsv`: 키움의 코드행/이름행을 페어링. 코드=row1 col1, 이름=row2 col1, 수량=row1 col5, 평균매입가=row1 col3, 현재가=row2 col3, 평가=row2 col4, 매입금액=row1 col4. broker 이름을 lookup/추정으로 교체하지 않음. KRX 2행은 KR/KRW 명시. 헤더 유무·단일행(code/name 또는 name/code)·헤더 순서 변경 지원.
- `holdingMatchIndex`: 전체 목록에서 정규화 코드부터 검색한 후 정확한 정규화 이름으로 fallback. 앞선 동명 카드가 뒤의 코드 일치 카드를 가리지 않음. incoming 자체의 중복 병합은 코드가 다른 동명 종목을 분리하는 기존 회귀 유지.
- 기존 코드와 일치하면 원래 id/name/identity를 유지하며 수량·평균단가 등만 병합. 다른 instrument lookup ID가 코드 일치를 방해하지 않도록 기존 smoke 기대 1개를 새 요구에 맞게 갱신.
- Preview는 기존 이름·파싱된 수량/평균매입가, `증권사 표기: …` small(HTML escape), 기존 매칭/신규 후보 표시. 입력/취소까지 draft 메모리만 변경.
- 보유정보 입력 렌더는 기존 이름/코드만 매칭 결과로 표시하고 숫자는 draft 값을 그대로 사용. 수량/선택 평균가의 빈 입력을 이전 저장값으로 다시 채우는 부수 변경을 피함. 이 최종 보완 후 신규10/브라우저2폭·positions·원문보존 및 전체 앱 asset browser 재검사.
- TSV는 기존 보유정보 전용 Preview로 연결됨. 현재가/평가/매입금액은 정확히 파싱하지만 이후 저장되는 항목은 **기존 보유정보 확정 정책 그대로**임. 과거 평가기록은 유지하며 확정 함수를 바꾸지 않음.

### 검증

- 환경: Windows, Node v24.19.0, runtime Playwright + 설치된 headless Edge. 합성 계좌/종목만 사용.
- `node scripts/hani-kiwoom-code-224.test.mjs`: **10 PASS**. 정상/예외/lowercase 정규화, 헤더 유무 2행 필드 전체, 두 기존 카드만 매칭, 코드 우선/ID 충돌/앞선 동명 shadow, prefixed 저장 코드·중복, unmatched broker 이름 1개 후보, exact-name fallback/부분명 불일치, 단일행·미국 ticker·0수량, 실제 paste 이벤트/취소·선택 계좌 필요·HTML escape 포함.
- `node scripts/hani-kiwoom-code-224.test.mjs <playwright/index.mjs> <msedge.exe>`: **1440/390 격리 컴포넌트 실제 브라우저 PASS**. 실제 paste handler, 기존2카드/qty5·10/avg10100·20000, approve 활성, 수량 편집·취소·신규1후보, 보호원본 byte-identical·write0·page error0. 이 스크립트의 캡처는 CSS 없는 컴포넌트 증거이며 전체 앱 디자인/독립 아린 리뷰로 보고하지 않음.
- Node 기존 7명령 PASS: `hani-asset-update-smoke.js`, `hani-positions-only-test.cjs`, `hani-market-data-test.cjs`, `hani-portfolio-completeness-test.js`, `hani-invest-basis.test.cjs`, `hani-intake-audit-206.test.cjs`, `hani-mobile-intake-206.test.cjs` (모두 `node scripts/<파일>`).
- `hani-intake-audit-206-safety.cjs`: **미완료**. 기존 입력 `artifacts/intake-audit-206/baseline/hani-yuna-helpdesk.js`가 없어 ENOENT. 현재 파일을 baseline으로 만들어 검사를 통과시키지 않음. 이번 작업은 YUNA/main 원문을 변경하지 않음.
- 기존 `hani-asset-update-browser-smoke.js`: 처음 실행에서 nav와 REMOTE의 동일 `자산 업데이트` 버튼 2개 때문에 strict selector 실패. 메뉴 이동만 `.nav-btn[data-view="investmentIntake"]`로 한정한 복사본으로 기존 전체 assertion PASS 확인 후, 같은 test-only 선택자 수정을 원본 검사에 반영. 확정/실패복원·계좌보존·다중 이미지·수량/평균가·reload·모바일 overflow 등의 assertion은 변경 없음.
- 위 선택자 보완 후 **원본 브라우저 검사도 전체 PASS** (`.ai-budget-private/kiwoom-224/existing-browser.log`). 실제 전체 앱·합성 Cloud/계좌·1440/390 환경에서 pageErrors0, 모바일 overflow0. 원본 검사 재실행도 신규 parser의 실제 계좌/Android 또는 독립 리뷰를 대신하지 않음.
- 관련 syntax 및 `git diff --check` PASS. 기준선 대비 `approvePositions`, `approve`, `readStoredState`, `storedAccount`, `executeAccountDelete` 본문 byte-identical. save/commit/localStorage write/remove/clear 호출식 동일, 비변경 **242행 EOL 포함 보존**. main/index/CSS/storage 구조/Cloud/schema/버전/cache 변경 없음.
- 로컬 상세 로그/원문비교/캡처: `.ai-budget-private/kiwoom-224/` (Git 제외). commit 뒤 해시를 독립 QA 증거로 부풀리지 않음.
- 미검증: 실제 대표님 계좌/키움 원문·Android 실기기, 독립 아린/히나, Candidate package/One-Pass/서버 HINA, main/Pages/Production. 기존 baseline 누락 검사는 미완료로 유지.

## 다음 담당에게

- 먼저 읽기: 이 문서, `normalizeIntakeCode`, `parseHoldingsTsv`, `holdingMatchIndex`, `previewHolding`, 기존 `handleAssetPaste`.
- 다음 행동: 커밋/push 가능 환경에서 이 범위만 배포 담당 Claude에게 인계하고, 최신 열차에서 targeted 검사·실제 계좌 Preview를 재확인. 동반 Edge Function/설정 배포 없음.
- 승인 범위: 기능 수정·targeted 검사·commit 시도. merge/배포 승인으로 해석하지 않음. Notion 갱신 대기는 위 내용·검증·blocker를 포함하여 보존.
- Candidate/package/One-Pass/HINA·아린·Preview 승인·main/Pages/Production은 미실행. 기능 개발과 실제 배포 완료를 구분.

## 종료 / Git / 공유

- 작업 6파일만 지정하여 `git add -- …` 시도: 공용 gitdir `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/kiwoom/index.lock` 생성 Permission denied(exit128).
- 이어 같은 목록으로 `git commit --only -m 'fix: normalize Kiwoom KRX codes and pair balance rows' -- …` 시도: 신규 test/handoff pathspec 미등록으로 실패(exit1). **부분 커밋 없음, HEAD/base 331291eb 유지·미커밋·미push**. 권한 우회/원격 대체 commit·PR·merge·배포 없음.
- CURRENT에는 이 작업의 확인된 구현·검증·미완료를 앞에 추가하고 다른 담당 기록 전체를 보존. 사용자 승인 결정을 새로 추가하지 않아 DECISIONS 변경 없음.
- Notion 미반영: 자동 승인 검토가 현황판 `insert_content`를 `approval policy is never`로 거절. 갱신 대기 내용은 날짜·도연·branch/base·위 구현/테스트/미검증·Git 차단·배포 담당 인계를 포함. 읽기 성공을 갱신 완료로 보고하지 않음.

## 후속 · 확정 후 / 계좌 전환 입력 초기화 (2026-10-21 KST)

### 작업 식별

- 담당 도연(Codex), NORMAL UI 상태·렌더러 수정. 같은 hani/kiwoom-code-fix, 시작 HEAD 16821c9da13f233949e977f9f16f5dc8363020ba(기존 kiwoomcode 커밋 보존), base/원격 main 331291eb29ec73b2cd5ca3f07eb2d02436e9d1ea 일치. 원격은 GitHub 연결 도구 fetch_commit(main) 확인. 버전 2.9.223, cache·마지막 script 기준선 유지.
- 승인 근거: 대표님의 같은 branch에서 두 번째 버그 수정·브라우저 회귀 확장·intake 재검사·commit 시도 요청. 승인 제외: confirm 저장 경로 변경, 새 storage key, Cloud/schema, 버전 증가, merge/배포.
- 변경 파일: hani-asset-update-v1.js, index.html의 persistent prompt slot 1개, scripts/hani-kiwoom-code-224.test.mjs, 기존 hani-asset-update-browser-smoke.js 기대값·새 첨부 준비 및 prompt 확인, 이 인수인계와 CURRENT. 다른 담당 작업 수정 없음.

### 결과와 증거

- canonical selected/draft 상태와 renderSelectedFiles/render에서 첨부 thumbnail·object URL 소유. resetCaptureInput 한 경로로 File[]·file.value·draft/OCR/파싱 Preview를 정리하고 URL revoke. 기존 승인 함수의 성공 read-back 이후 UI-refresh try 안에서만 호출하여 UI 오류가 저장 rollback으로 번지지 않음. 완료 문구는 “○○ 계좌 반영 완료 · 다음 계좌를 선택하세요”.
- 계좌 변경은 기존 onchange 하나가 처리. 미반영 Preview/첨부가 있으면 원래 계좌·입력 유지 + 페이지 안 “반영하지 않은 입력을 버릴까요?”의 버리기/돌아가기. 돌아가기는 동일 Preview DOM·편집값·이미지 URL 유지, 버리기는 전부 정리하고 새 계좌로 전환. prompt 대기 중 Preview inert 및 분석/파일 비활성. 파일 배열 복사 직후 native input.value를 비워 동일 파일 재선택 가능.
- 입력 epoch와 분석 batch를 고정하여 계좌 전환·입력 교체 후 늦게 도착하는 OCR 결과가 Preview를 되살리지 못하게 함. 새로운 이벤트/renderer layer 없음.
- 현재 asset intake의 TSV raw는 paste 함수의 지역변수이며 별도 “TSV 원문 임시 보관” 영속 키/UI가 없음. 다른 intake/hani-main.js의 임시 보관 정책은 변경하지 않음. 파싱 draft만 현재 선택 계좌 소유이며 초기화 때 폐기. 새 storage key 0개.
- 확장 browser: 실제 Edge + Playwright 1440/390, production parser/render/approve/normalizer + 합성 backup/OCR/save I/O. A 이미지+TSV → 실패 시 입력 보존 → 확정 성공 시 image/Preview/input clear·URL revoke, B 빈 입력, 미확정 switch/back 편집 수량8·같은 URL 보존, discard/재진입 빈 입력, 동일 파일 change2회, 늦은 OCR 차단, totals/OCR 확정 후 같은 초기화 PASS. 보호키 실제 localStorage.setItem을 계측하여 **두 확정에서만 2회**, 전환·취소·Preview·실패에서 byte-identical/write0. 각 폭 pageError0.
- 명령: node scripts/hani-kiwoom-code-224.test.mjs <runtime/playwright/index.mjs> <msedge.exe>. Node 기존10 PASS + 두 폭 lifecycle PASS. UI 근거: .ai-budget-private/kiwoom-224/switch-{1440,390}.png(실제 CSS 컴포넌트), reset-full-ui/account-switch-{1440,390}.png(전체 앱; 메뉴/REMOTE 고정 패널 겹침은 별도 기존 UI 상태).
- intake 재검사: node scripts/<파일>로 hani-asset-update-smoke.js, hani-positions-only-test.cjs, hani-market-data-test.cjs, hani-portfolio-completeness-test.js, hani-invest-basis.test.cjs, hani-intake-audit-206.test.cjs, hani-mobile-intake-206.test.cjs 7명령 PASS. 기존 전체 앱 browser-smoke도 재실행 PASS(합성 Cloud/계좌, 보호 계좌 유지·실패복원·reload·다중 이미지·모바일 overflow0/pageError0). 성공 후 이전 첨부를 재사용하던 fixture는 실제로 파일을 다시 넣도록 갱신, 검증 assertion 유지.
- hani-intake-audit-206-safety.cjs는 기존 artifacts/intake-audit-206/baseline/hani-yuna-helpdesk.js ENOENT로 **미완료**. 가짜 baseline 생성 없음.
- preservation 검사: approve/approvePositions의 성공 UI cleanup·문구만 되돌린 본문이 시작 HEAD와 일치, backup/save/read-back/rollback·delete 함수·parser/matcher 동일. write 호출식 및 main 전체 바이트·버전/cache 동일. index는 prompt slot 제외 전체 바이트 동일. 관련 syntax·diff check 수행. 상세 로그/검사 helper는 .ai-budget-private/kiwoom-224/ (Git 제외).
- 미검증: 대표님 실제 계좌/키움 원문·Android, 독립 아린/히나, Candidate package/One-Pass/서버 HINA, main/Pages/Production. 열차 후보를 만들거나 운영 반영 완료로 표시하지 않음.

### 다음 담당에게 / 공유

- 먼저 읽기: resetCaptureInput, renderCaptureSwitchPrompt, accountSelect.onchange, run의 epoch 검사, 확장 lifecycle browser 검사. 다음 행동: commit/push 가능 환경에서 이 범위만 인계하고 Claude 배포 열차에서 통합 targeted 검사 및 실제 계좌 Preview. 함께 배포할 서버/Edge Function/설정 없음.
- Notion: 계획 append는 자동 승인 검토가 “MCP tool call requires approval, but approval policy is never”로 거절. 현황판 조회만 성공, 갱신 완료 아님. 위 branch/base·변경·검사/미검증·blocker·다음 행동 요약 갱신 대기. 권한 우회 없음.
- CURRENT에 이 후속 작업의 확인된 결과만 앞에 추가하며 타 담당 과거 기록 보존. DECISIONS는 새 승인 결정 없어 변경하지 않음.
- Git commit 시도 결과는 아래 종료 기록 참조. main merge·개별 배포 없음.

### 후속 종료 / Git

- 위 6파일만 지정하여 git add와 git commit --only 모두 시도했으나 공용 gitdir의 index.lock 생성 Permission denied(exit128)로 차단. 부분 커밋 없음, HEAD 16821c9 유지. 요청대로 미커밋·미push로 보존하고 권한 우회 없음.
- 최종 1440/390 browser 로그: .ai-budget-private/kiwoom-224/reset-browser-final.log. 두 폭 실제 CSS prompt 캡처 확인, 버튼/문구 표시 정상. 마지막 UI cleanup 배치 보완 뒤 component browser·전체 앱 browser·asset smoke/positions·syntax/preservation 재확인 완료. 변경된 runtime은 배포하지 않았음.

## 후속 · 토스 현재가/헤더 매핑 (2026-10-21 KST)

### 작업 식별

- 담당: 도연(Codex), NORMAL parser·매핑·읽기 전용 Preview. 같은 branch hani/kiwoom-code-fix, 시작 HEAD b86ca4a693a83155c0dec22f40b7f0ad8bf43f32(kiwoomcode 16821c9 + kiwoomreset b86ca4a 보존), base/원격 main 331291eb29ec73b2cd5ca3f07eb2d02436e9d1ea 일치(GitHub 연결 조회). v2.9.223/cache 및 마지막 script hani-launch-greeting.js 유지.
- 승인: 대표님 세 번째 토스 입력 버그 요청. 헤더 매핑·AI 추출 계약·Preview 2% 검산·intake 회귀·commit 시도. 저장 경로, 새 영속 필드·Cloud write/DB schema, 버전, main/배포 제외.
- 변경 파일: hani-asset-update-v1.js, supabase/functions/hani-agent-orchestrator/index.ts의 Asset Vision 추출 prompt/응답 계약만, scripts/hani-toss-intake-224.test.mjs, 이 인수인계와 CURRENT. 다른 담당 파일 수정 없음.
- 상태: 구현·targeted 검사 완료. Asset Vision holdings 응답 schema에 currentPrice가 없어 이미지 현재가 누락 원인 확인. 토스 TSV는 평균가/평가금/원금 별칭 및 구간 처리 누락.
- Notion 계획 append는 자동 승인 검토가 approval policy never로 거절. 계획·결과 갱신 대기 보존.

### 결과와 증거

- CODEMAP asset-update owner/DOM/run 검증, parser/Asset Vision 계약은 CODEMAP_MISS로 좁은 검색 fallback. 이미지: 기존 run → extract_intake_image → Asset Vision strict JSON → normalize/mergeScreens → 기존 Preview. 텍스트: 기존 paste → parseHoldingsTsv → 같은 positions Preview. 새 handler/renderer layer 없음.
- 토스는 열 번호 없이 공백 정규화한 헤더 이름으로 종목명·총 수익률/수익금·1주 평균금액·현재가·보유 수량·평가금·원금·수수료·세금 매핑. 국내/해외 구간 합계는 제외하고 다음 구간 전까지 구분 유지. 헤더 반복·순서 변경·TSV/pipe 및 수수료·세금 포함 배지 지원. 단위 원/%/+/주·쉼표·소수 수량 처리, '-'는 null. 현재가 헤더가 없으면 다른 열로 대체하지 않음.
- 화면 숫자에 원/₩가 있으면 해외 종목도 기존 buyCurrency=KRW. 국내 KR/해외 US 시장 태그를 사용하는 기존 입력 모델 안에서 처리하며 환율 환산 없음. 원화 환산 여부와 구간은 WeakMap에만 기록하고 Preview에서 국내주식/해외주식·원화 환산(KRW) 표시. 새 영속 필드/저장 schema 없음. 평균가/수량 편집은 기존 입력, 현재가·평가금·원금은 원본 참고 표시.
- 현재가×수량과 평가금의 상대차이(평가금 기준)가 2% 초과하면 행별 Preview 경고. 2% 이하는 검산 완료, 하나라도 없으면 검산 미확인. 원본 숫자 수정·저장 정책 변경·새 저장 차단 없음. 이 경고는 입력 확인용이며 live 시세로 사용하지 않음.
- Asset Vision strict 응답 계약에 currentPrice 및 market/marketSection/buyCurrency 추가. prompt는 열 이름별 매핑·일간/총 손익 구별·현재가 별도 추출·소수 수량·구간/원화 토글·2% 경고를 명시. **AI 응답 JSON 계약 변경이며 DB/Cloud schema 변경 아님.** 기존 서버 action/auth/Cloud write는 계약·prompt를 제외한 전체 원문 비교로 보존 확인.
- 신규 `node scripts/hani-toss-intake-224.test.mjs`: **10 PASS**. 제공 합성 표 2종목: 현재가99000/510000·수량2/.1·평균100000/500000·평가198000/51000·원금200000/50000·KRW·구간/환산. 열 순열/반복·pipe·badge·.093771주·'-'·2% 경계/불일치·현재가 열 없음·기존 키움/토스/하나·실제 Vision 요청 prompt/schema·paste/이미지 분석→Preview(시세 연결 true/false)·취소/write0 검증.
- `node scripts/hani-toss-intake-224.test.mjs <runtime/playwright/index.mjs> <msedge.exe>`: **실제 Edge 1440/390 PASS**. 기존 CSS·단일 paste 이벤트, 2종목/소수 수량/원본 현재가·원화 환산/경고 표시, 취소·보호원본 byte-identical/write0·pageErrors0. `.ai-budget-private/kiwoom-224/toss-{1440,390}.png` 확인. 격리 컴포넌트 증거이며 독립 아린 검토나 실제 대표님 데이터 확인으로 표시하지 않음.
- 기존 `hani-kiwoom-code-224.test.mjs` Node10 + 실제 Edge1440/390 lifecycle PASS: kiwoomcode·확정 후 초기화·계좌 전환/돌아가기/버리기·동일 파일 재선택·늦은 OCR 차단·확정 외 write0 보존.
- 기존 intake 7명령 PASS (`node scripts/<파일>`): hani-asset-update-smoke.js, hani-positions-only-test.cjs, hani-market-data-test.cjs, hani-portfolio-completeness-test.js, hani-invest-basis.test.cjs, hani-intake-audit-206.test.cjs, hani-mobile-intake-206.test.cjs. 기존 전체 앱 hani-asset-update-browser-smoke.js도 합성 I/O로 재실행 PASS(pageErrors0, 계좌 보존·저장/복원·reload·모바일 검사).
- 원문 보존: 시작 HEAD/before-toss 대비 approve/approvePositions/readStoredState/storedAccount/executeAccountDelete/resetCaptureInput/renderCaptureSwitchPrompt/run/holdingMatchIndex/mergeWithExistingHoldings/normalizeIntakeCode **본문 exact**, save/commit/localStorage write/remove/clear 호출식 동일. main/index 전체 바이트·v223/cache 동일. JS syntax·전체 Edge TS syntax(Node24 strip 후 check)·git diff --check PASS. 기존 비변경 행 EOL 보존. 로그/보존 helper: `.ai-budget-private/kiwoom-224/toss-*` (Git 제외).
- 미검증: 실제 토스 이미지의 외부 AI 응답/대표님 계좌·Android 실기기, 독립 아린/히나, Candidate/One-Pass/서버 HINA 및 Production. 과거 YUNA safety baseline 파일 누락 검사는 이번에도 미완료이며 재실행/인위적 baseline 생성 없음. Preview 입력 확인을 운영 반영으로 표시하지 않음.

### 다음 담당에게

- 먼저 읽기: parseHoldingsTsv/makeHolding/holdingCheck/holdingSourceNote, ASSET_HOLDING_SCHEMA/extractIntakeImage의 Asset 전용 prompt, 신규 토스 검사. 승인 범위는 parser·추출 계약·읽기 전용 Preview/검사/commit 시도이며 main/배포 승인 아님.
- **열차 동반 배포 필요**: hani-agent-orchestrator Edge Function의 prompt/AI 응답 계약. 클라이언트 변경과 함께 최신 main에서 targeted 검사를 다시 실행하고, 열차 승인 후 Edge Function 배포 → 프런트 운영 read-back 순서로 실제 토스 스크린샷 현재가를 확인. 기존 서버로는 strict 응답 계약에 currentPrice가 없어 이미지 수정이 완성되지 않음. DB/schema/migration·설정 변경은 없음. 이번 세션에서는 배포하지 않음.
- 다음 행동: commit/push 가능 환경에서 이 범위만 Claude 열차에 인계. CURRENT는 이 후속 결과만 앞에 추가하고 과거/타 담당 기록 보존, DECISIONS 변경 없음.
- Notion 갱신 대기: 날짜·도연·branch/base/시작 HEAD·위 변경/검사/미검증·동반 Edge 배포·Git 결과·다음 행동. 자동 승인 검토가 현황판 insert_content를 “MCP tool call requires approval, but approval policy is never”로 거절하여 미반영. 조회 성공을 갱신 완료로 표시하지 않음.

### 토스 후속 종료 / Git

- 이 후속의 5파일만 지정해 git add 시도: 공용 gitdir `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/kiwoom/index.lock` 생성 Permission denied(exit128). 이어 같은 목록으로 git commit --only 시도: 신규 `scripts/hani-toss-intake-224.test.mjs` pathspec 미등록으로 실패(exit1).
- 부분 커밋 없음, HEAD b86ca4a 유지. 대표님 지시대로 **미커밋·미push 보존**, 권한 우회 없음. 기존 kiwoomcode/kiwoomreset commit 보존. main/PR/배포 진행 없음.


## 후속 · 하나증권 라벨 매핑·공통 Preview 편집 (2026-10-21 KST)

### 작업 식별

- 담당 도연(Codex), NORMAL OCR/parser·매핑·validation·Preview UI. 같은 branch `hani/kiwoom-code-fix`, 시작 HEAD `fce2fdc`(kiwoomcode 16821c9·kiwoomreset b86ca4a·tossprice fce2fdc 보존). main/base `331291eb29ec73b2cd5ca3f07eb2d02436e9d1ea`, GitHub fetch_commit(main) 일치 확인. 표시 v2.9.223·cache·마지막 script hani-launch-greeting.js 유지.
- 대표님 승인: 네 번째 하나증권 버그 수정, 모든 증권사 Preview 필드 편집·행 추가/제외·OCR 되돌리기·live validation, targeted 검사와 commit 시도. 기존 승인 저장 경로·큰 불일치 차단 유지. Cloud write/DB schema·migration·버전/main/배포 제외.
- 범위: hani-asset-update-v1.js, hani-style-07.css의 편집 UI 스타일, 기존 Edge Function의 Asset Vision 추출 prompt/응답 계약만, 신규 scripts/hani-hana-intake-224.test.mjs, 이 인수인계와 CURRENT. 다른 담당 파일 수정 없음.
- 계획: 라벨 근접 매핑·불명값 미확인·명시적 원본으로 계산값 생성·화면 간 소폭 차이는 INFO, 기존 canonical draft/approve 경로에서 전체 편집 검증. 개발 Agent 한 명 + 자동 검사.
- Notion 현황판 조회 성공, 계획 insert_content는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절하여 갱신 대기.

### 하나증권 후속 결과와 검증 (도연, 2026-10-21 KST)

- 상태: 구현·Node targeted 검사 완료, **최종 브라우저 검증 대기**. 시작 시 이미 남아 있던 이 작업의 미커밋 파일을 보존해 보완했다. 원격 main은 이번에도 GitHub `fetch_commit(main)`으로 `331291eb29ec73b2cd5ca3f07eb2d02436e9d1ea` 일치 확인. CLI 원격 조회는 프록시 연결 실패였으며 자동 merge/rebase 없음.
- CODEMAP의 asset-update owner `normalize/run/approve`, DOM `assetCapturePreview`, 기존 테스트를 확인했다. 세부 OCR/editor anchor는 CODEMAP에 없어 `CODEMAP_MISS` fallback으로 기존 실행 경로만 조사했다. 기존 `run → normalize → mergeScreens → render/renderPositions → approve`를 수정했으며 새 renderer/event layer를 추가하지 않았다.
- 하나증권: 줄바꿈·라벨·종목 경계를 보존하고 예수금 라벨 값(0 포함)과 출금가능을 각각 읽는다. 계좌번호/종합매매 다음 큰 금액은 계좌 총액으로만 처리한다. 원본 텍스트에서 확인되지 않은 AI 수량·단가·매입금액은 비운다. 화면 B의 명시적인 주식평가금액을 우선하며, 같은 화면 A가 반복돼도 우선순위가 뒤집히지 않는다.
- 종목: 매입금액/수량으로 평균단가, 평가금액/수량으로 누락 현재가를 계산하고 `계산값`을 표시한다. 피연산자를 지우면 계산값도 비워진다. 접힌 카드의 미확인 값은 추정하지 않고 Preview에 표시하며 기존 merge 정책으로 저장된 값을 보존한다.
- 화면 간 금액 차이는 `≤1,000원 또는 ≤0.5%`일 때 `실시간 차이 …원` INFO로 표시한다. 초과 차이, 계좌 총액과 주식평가금액+예수금, 매입금액+손익, 종목 가격×수량의 큰 불일치는 비교한 숫자를 한국어로 설명하고 차단한다. **시세 연동 positions 경로에서도 검산을 먼저 통과해야 한다.**
- 모든 증권사의 기존 이미지/TSV Preview에 계좌 총액·예수금·출금가능·주식 매입/평가·손익·수익률·기준일과 종목명/코드·수량·평균단가·현재가·평가/매입금액 등의 입력/수정 버튼을 제공한다. 숫자는 쉼표·원·%·소수 수량을 받으며, 오류 문자열은 차단한다. `직접 수정`, live validation, 행 추가/제외, `OCR 값으로 되돌리기`, 모바일 decimal keyboard·label/focus를 구현했다. 제외는 이번 입력에서만 제외하며 기존 종목 삭제가 아니다.
- 기존 시세 연동 보유정보 저장과 화면 평가값 기록의 구분은 유지한다. 보유정보 전용 경로는 기존처럼 과거 평가 기록을 보존하며 화면 평가값은 기존 `sourceCapture`/화면 평가값 기록 방식으로 다룬다. 출금가능은 Preview 참고값으로만 사용하고 영속 schema를 늘리지 않는다.

실행한 검증:

- `node scripts/hani-hana-intake-224.test.mjs`: **13 PASS**. 합성 OCR A/B와 역순/반복, 예수금0·계좌 총액A·주식평가B·2종목·평균단가 계산·접힌 카드 미확인·소액 INFO/큰 불일치 ERROR, 실제 input/button callback의 오류 해제·수량/계산값 삭제·행 추가/제외·되돌리기·키움/토스 공통 편집·명시 승인 전 원본/state/write0 및 승인 후 단일 기존 save/read-back을 검증했다. DOM double 실행 증거이며 브라우저 화면 PASS로 표시하지 않는다.
- `node scripts/hani-kiwoom-code-224.test.mjs`: **10 PASS**; `node scripts/hani-toss-intake-224.test.mjs`: **10 PASS**. 기존 kiwoomcode/kiwoomreset/tossprice 작업 보존.
- 기존 targeted 7명령 PASS: `hani-asset-update-smoke.js`, `hani-positions-only-test.cjs`, `hani-market-data-test.cjs`(12), `hani-portfolio-completeness-test.js`, `hani-invest-basis.test.cjs`, `hani-intake-audit-206.test.cjs`, `hani-mobile-intake-206.test.cjs`를 각각 `node scripts/<파일>`로 실행했다.
- 보존 검증: `.ai-budget-private/kiwoom-224/before-hana.js`와 `before-hana-edge.ts`가 각각 HEAD blob `6e34b9f…`와 `a7c2d4a…`에 일치함을 `git hash-object --path=…`/`git rev-parse HEAD:<파일>`로 확인했다. 이 기준 대비 `approvePositions`, readStoredState/storedAccount, delete/reset, matcher/기존 holdings merge/TSV 본문 exact. `approve`의 백업·state 변경·save·read-back·rollback·cleanup 본문 및 전체 save/commit/localStorage write 호출식도 exact다. 변경은 승인 전 validation guard와 입력/표시뿐이다. main/index 수정 없음, v223/cache·보호키/내부 버전 유지.
- Edge는 Asset Vision AI 응답 계약의 withdrawable과 추출 지시 2줄만 변경했다. 그 외 action/auth/Cloud write 본문은 원문 exact, JS syntax·Node24 strip 후 TS syntax·`git diff --check` PASS. DB/Cloud schema 변경이 아니다.
- 기존 `hani-asset-update-browser-smoke.js`의 합성 하나 OCR/편집 selector 기대를 새 동작에 맞췄다. **이번 최종 상태의 Edge1440/390 및 전체 앱 browser는 `spawn EPERM`으로 실행 차단되어 미검증**이다. 이전 미커밋 작업의 1440/390 PNG와 PASS 로그는 참고 보존하고 최신 gate 변경의 PASS로 재사용하지 않았다. 기존 전체 앱 debug 로그도 수동 종목 추가 단계에서 끝나 완주 PASS가 아니다. 실제 OCR 외부 모델·성민 대표님 계좌·Android·독립 아린/히나·Candidate/One-Pass/서버 HINA/운영 read-back 미검증.

### 하나증권 후속 다음 담당에게

- 먼저 읽기: `hanaEvidence/deriveHolding/mergeScreens/validation`, `editControl/updatePreviewField/bindPreviewEditing`, 신규 하나 테스트와 수정한 기존 browser smoke.
- 다음 행동: 브라우저 실행 가능한 환경에서 `node scripts/hani-hana-intake-224.test.mjs <playwright/index.mjs> <msedge.exe>`와 키움/토스 동일 인자 검사, 전체 앱 `hani-asset-update-browser-smoke.js`를 실행한다. 390/1440 실제 화면·키보드 focus·overflow·입력→오류 해제→승인 저장을 확인한 뒤 Claude 열차에 인계한다. 기존 보호 검사를 우회하지 않는다.
- **열차 동반 Edge 배포 필요**: 기존 `hani-agent-orchestrator`의 Asset Vision 추출 지시/응답 계약(토스 currentPrice 후속 포함). 열차 승인 후 기존 인수인계 순서대로 서버/프런트를 반영하고 실제 OCR을 read-back한다. 이 작업은 배포·main 병합 승인이 아니다.
- Notion: 현황판/규격 조회 성공, 진행 내용 insert_content는 이번에도 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절했다. 날짜·담당·branch/base·위 결과/미검증·동반 Edge·Git 결과·다음 행동 **갱신 대기**. Notion 저장 후 read-back은 수행되지 않았으므로 갱신 완료가 아니다.
- CURRENT에는 이 확인 결과만 앞에 추가하며 DECISIONS·다른 담당/과거 기록은 보존한다. 커밋 시도 결과는 아래에 추가한다.

### 하나증권 후속 종료 / Git

- 위 7파일만 지정해 `git add -- …` 시도: 공용 gitdir `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/kiwoom/index.lock` 생성 Permission denied로 실패했다.
- 이어 같은 목록으로 `git commit --only -m "fix: hana intake and editable preview (Codex)" -- …` 시도: 신규 `scripts/hani-hana-intake-224.test.mjs`가 index에 등록되지 않아 pathspec 오류로 실패했다. 부분 커밋·push 없음. 대표님 지시대로 **미커밋 보존**, 권한 우회 없음.
- 최종 HEAD `fce2fdcf670fd7dcce9f75997833cbab4522dbc9`, branch `hani/kiwoom-code-fix` 유지. 기존 `16821c9 kiwoomcode`, `b86ca4a kiwoomreset`, `fce2fdc tossprice` 보존. main/PR/Pages/Production 진행 없음. 최종 브라우저 재검증과 커밋 가능한 환경에서의 열차 인계가 남았다.
