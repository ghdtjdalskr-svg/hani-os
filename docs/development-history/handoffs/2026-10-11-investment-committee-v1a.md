# Investment Committee V1a · 도연

## 작업 식별

- 갱신일(KST): 2026-10-11 / 담당: 도연(Codex), 단일 개발 Agent
- 상태: V1a 구현 완료 / 실제 UI 검증 대기 (브라우저 spawn EPERM)
- branch/worktree: `hani/investment-committee-v1a` / `ic1`
- base/HEAD: `b93925fe75f5e746a6101ed492e950516746fadc` (원격 GitHub main 조회 일치)
- candidate: 없음 (미커밋 개발 작업)
- 목표: 종목 Research, 변경 이력, GPT 복사 → 붙여넣기 → 검토 → 선택 반영. 월간 위원회는 저장 없는 V1b 안내.
- 승인: 이번 사용자 Prompt가 Step 0의 정확히 3개 최상위 배열 등록과 기존 state → commit/save 저장을 명시 승인.
- 수정 범위: hani-main.js(layout/배열 기본값·검증·Cloud 의미 판정·render 연계), index.html(로드), hani-ui-v02992.js(기존 투자 navigation 범위), hani-asset-market-view.js(기존 캐시 read API), 새 committee JS/CSS, codemap, fixture/tests, 이 문서와 CURRENT 요약.
- 경계: 커밋·push·버전/캐시태그 증가·PR·main 병합·배포 금지. 기존 계산·보호 write·Cloud write/schema·migration 변경 없음.

## 결과와 증거

- 구현: 기존 투자 layout owner 안에 포트폴리오(기본) / 종목 리서치 / 월간 위원회 3탭. 기존 투자 DOM을 그대로 이동하고 ID·기존 event path를 유지. 후속 arrangeNavigation은 포트폴리오 안에서 기존 탭·연도 picker를 정리하며, 기존 상세 이동 activateInvestmentTab은 먼저 포트폴리오를 선택.
- Research: 5단계 Rating, Fair Value Low/Mid/High·방법·메모·규칙·선택 변경 이유, 현재가/기준일, 6차원 configurable conviction/자동합, thesis/risk/역할·theme·3~5개 WHY WE OWN IT·Bull Case/위험/무효화/다음 점검·Action/custom·조건·HANI COMMENT·최종 검토일. 카드 상세의 세부 그룹은 접힌 상태로 열림.
- 생성: 보유종목/종목 마스터/관심종목 pick list 또는 직접 WATCH 작성. 기존 데이터에서 자동 생성 없음. 중복 종목·모호한 종목 매칭·잘못된 점수/범위/리포트 거부. 생산 seed 없음.
- GPT: 한국어 prompt + compact JSON + 정확한 OUTPUT JSON Schema 복사(navigator.clipboard / textarea fallback), fence·설명 포함 JSON 파싱, 기존 카드 매칭·새 WATCH/보유 OWNED 제안, 필드별 diff와 새/변경 텍스트 내용, include/exclude checkbox, 선택 반영만 저장. 편집/검토 중 원본 변경 시 재확인 요구.
- 변경 파일: `hani-main.js`, `index.html`, `hani-ui-v02992.js`, `hani-asset-market-view.js`, `dev-center/codemap.json`, `docs/development-history/CURRENT.md`.
- 추가 파일: `hani-investment-committee.js/.css`, `scripts/fixtures/investment-research-mock.json`, `scripts/hani-investment-research.test.cjs`, `scripts/hani-investment-research-safety.test.cjs`, `scripts/hani-investment-research-ui.test.mjs`, 이 인수인계.
- 원격 확인: shell 네트워크 연결 실패; GitHub connector main SHA 조회로 대체 확인.
- 표시 버전: 저장소 v2.9.202; Production 화면/JS 실로딩은 미검증.
- Notion: 현황판 읽기 성공. 착수 요약 append는 자동 승인 검토에서 `MCP tool call requires approval, but approval policy is never`로 거절. 갱신 대기 내용을 이 문서에 보존.

### 승인 데이터 구조 / 저장 방식 (spec §27)

- 정확히 3개 최상위 배열: `investmentResearchCards`, `investmentResearchHistory`, `investmentCommitteeSnapshots`. freshState·validateStoredRecords·normalizeState 누락 기본값·cloudHasMeaningfulLocalData에 등록.
- 기존 데이터 변환/기존 배열 backfill 없음. 등록 배열은 로드 시 map/재작성하지 않고 기존 객체·알 수 없는 필드를 그대로 보존. 잘못된 배열/레코드는 기존 validator 보호 경로를 사용.
- 최초 카드 작성: 메모리 draft → normalize/중복 검사 → 새 UUID·revision·카드와 추적 필드 초기 이력 준비 → state 배열 교체 → 기존 commit → save/read-back/Cloud 예약. 취소 시 저장 없음.
- 기존 카드 수정: 동일 경로. Rating, Fair Value 3값, conviction 총점, thesisStrength, riskLevel, action의 실질 변경만 from/to·reason 이력 추가. 텍스트/가격/검토 시각만 변경 또는 no-op은 이력 추가 없음. 기존 history 편집/삭제 UI·함수 없음. previousRating은 이력에서 도출.
- GPT 선택 반영: 선택한 카드의 검증·diff를 먼저 전부 준비 → 같은 applyBatch/save path를 한 번 호출. 하나라도 잘못됐거나 원본 fingerprint가 바뀌면 저장하지 않음. 저장 실패 시 카드·이력 배열을 원래 참조로 복원.
- 월간 위원회: `다음 단계에서 열려요`만 표시. 배열 등록 외에는 snapshot 생성·수정·삭제 없음 (V1b).
- storage key / 내부 버전 / Supabase schema / Cloud insert/update/upsert / migration: 변경 없음. 새 localStorage key, 직접 storage/Cloud write, `.clear(` 경로 없음. 기존 보호 write·기존 계산·save semantics 원문 그대로.
- 백업·복구: 기존 전체 state JSON 백업/로드에 새 배열이 포함됨. 테스트에서 저장 실패 및 원본 보호 active 시 기존 배열·저장값 유지 확인. 실제 계정 백업/복원/Cloud 동기화는 수행하지 않음.
- 한계: History append-only는 이 기능 저장 경로에서 보장함. 기존 전체 Cloud 상태 교체를 넘어서는 서버 수준 append-only 제약은 추가하지 않음.

### 현재가 / UI / fixture

- 기존 HaniMarketData.positions + calculate().holdings는 read-only 작성 후보에 사용. holdings·instruments·watchlist 변경 없음.
- `HaniAssetMarket.readResearchQuotes`는 기존 configured cache client의 stocks/prices 읽기만 노출. 기존 cache/gateway 외 신규 API 없음. 조회 도중 로그인 변경 응답을 거부하고, module도 동일 계정 가격만 표시.
- 기존 metadata의 시장·ticker·currency를 확인한 quote.lastPrice 사용, quote.timestamp를 기준으로 표시(수집시각/화면 방문시각으로 대체하지 않음). 캐시 미제공 시 카드의 manualPrice.value/currency/asOf. 통화가 다른 가격에는 Upside/Downside 계산을 표시하지 않음.
- Deep Navy/Cobalt/Gold + 기존 light/dark surface/text tokens. 390px 단일열·modal 한 열·세부 접기 CSS 구현. 실제 화면/모바일 overflow/스크린샷은 EPERM으로 미검증.
- fixture: 삼성전자우/LG전자우/오리온/NVIDIA/Amazon/Visa, 합성 예시이며 투자 추천/실제 시세가 아님. 테스트 파일만 읽고 index/runtime에는 fixture 참조 없음.

### 실행한 검증과 결과

모든 검사는 base HEAD `b93925f` 위의 이 미커밋 작업 파일을 대상으로 실행. Candidate Freeze/패키지 identity는 없음.

| 명령 / 검사 | 결과 |
|---|---|
| `node scripts/hani-investment-research.test.cjs` | 14/14 PASS: 실제 normalize/validation/Cloud 의미 판정, 6차원합, append-only/no-op, parse/match/diff/review/apply, all-or-nothing, 실패복원, 실제 commit/save/read-back 및 원본 보호, canonical layout DOM 유지 |
| `node scripts/hani-cloud-first.test.mjs` | 기존 40 cases PASS |
| `node scripts/hani-cloud-egress-save-sim.test.mjs` | PASS: 기존 저장 3회 egress412 bytes/full reads0, revision 충돌 차단을 포함한 mock 실행 |
| `node scripts/hani-market-data-test.cjs` | 기존 12/12 PASS: read-only 가격/시간/통화/원가/계좌별 보유 조회 |
| `node scripts/hani-portfolio-completeness-test.js` | 기존 Portfolio completeness/미확인 원가 회귀 PASS |
| `node scripts/hani-investment-research-safety.test.cjs .ic-main-baseline.tmp .ic-index-baseline.tmp` | PASS: 실제 git-show raw 기준선과 21개 storage/Cloud/계산 owner 원문 동일, internal/storage/display const 불변, main 기존7493줄·수정2줄 EOL 보존, index 기존1750줄 EOL 보존 |
| `node --check` runtime 변경 4 JS + UI test | PASS |
| fixture/CODEMAP JSON parse 및 하니 avatar 파일 | PASS |
| `git -c core.whitespace=cr-at-eol diff --check` | PASS; 기본 diff --check의 CRLF trailing whitespace 경고는 줄별 EOL 보존을 위한 설정으로만 처리(저장소 설정 변경 없음) |

Node `--test` 기본 모드는 테스트 subprocess `spawn EPERM`이어서 실패. subprocess를 만들지 않는 `node scripts/hani-investment-research.test.cjs` 직접 실행으로 동일 node:test 14개 PASS. 임시 raw 기준선 파일 2개는 비교 후 제거.

### 작성했으나 실행 차단 / N/A

- UI 명령: `node scripts/hani-investment-research-ui.test.mjs "C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" "C:/Program Files/Google/Chrome/Application/chrome.exe"`
- 결과: browserType.launch `spawn EPERM`. QA 흐름 1/2/3/4/6/7, GPT 복사/fallback·검토·제외·선택반영·stale guard, 시세/수동 가격, 재로드·기존 DOM/상태·월간 no-save·runtime ic ID·콘솔/390 overflow를 검사하는 파일은 작성 완료. 실행 PASS로 보고하지 않음.
- desktop1440/390 light/dark 스크린샷: 생성되지 않음. 테스트가 성공하면 `artifacts/investment-research/*-research.png`, `*-detail.png` 생성. 실화면 console errors 0: 미검증.
- 실제 auth/Cloud/백업복원/Android·종목 검색 네트워크: 미검증. 원본 상태/운영 데이터로 검증하지 않음.
- Risk tier: CRITICAL(승인된 보호 state 배열 확장). 위 실행·원문 비교가 이 개발 작업의 safety 근거이며 Full Safety Audit / One-Pass / HINA / 아린 Preview는 미수행. Release gate PASS 아님.
- 표시 버전 증가: 사용자 금지/기능 탭 규칙에 따라 v2.9.202·기존 cache tags 유지. 배포 담당이 열차 후보에서 한 번 증가.
- build/패키지/Candidate/운영 PR/main merge/Pages/Production read-back: N/A, 요청 범위 밖. 기존 Production v202의 실제 화면/최신 JS 조회도 이번 작업에서 수행하지 않음.

### 미커밋 runtime SHA-256 (Candidate SHA가 아님)

| 파일 | SHA-256 |
|---|---|
| hani-main.js | `7be6ff83fcc4cc951034d2b74852037a009d01de6ee74ef2f35ff00c9949e51b` |
| index.html | `2115ccca1feb253b4b7b7f438008b6b17fc57dae5b50c2015a5d3ccaf67c7641` |
| hani-ui-v02992.js | `0b50e6960e49d6f0cf2ebcaa8d42b6b62f7e7b9462ed1146ca366b7486adbe93` |
| hani-asset-market-view.js | `b4a3bb8f45374771dd9e07fe78f5fc986620f5a13805b4d00310e42b44b143b8` |
| hani-investment-committee.js | `ea5ddf3ec0688d2e449d096d2c2629215f07007ab49bffeeab68bb67d6a7e9b5` |
| hani-investment-committee.css | `5a85a5d082ad09fa4dd33d2758418c5a0e5330343351e6a0cf0811720a44e778` |

## 다음 담당에게

- 먼저 읽기: ../ic-spec.md, ../ic0-result.md, 이 문서, 새 모듈 및 targeted tests.
- 다음 한 가지 행동: 브라우저 실행이 가능한 환경에서 위 UI 명령을 실행해 실제 1440/390 스크린샷과 QA 흐름을 확인. EPERM 외의 구현 실패가 나오면 기능 담당에게 돌려보내 수정.
- 미구현/확장 추천: V1b는 승인된 investmentCommitteeSnapshots에 월별 deep snapshot을 저장하고 같은 reviewMonth overwrite를 거부해야 함. V1a의 read-only 가격/previousRating/conviction 조회 함수를 재사용 가능. snapshot 저장/UI·theme overlap warning·월간 Executive Summary는 현재 미구현.
- 승인되지 않은 다음 단계: 커밋/push/열차 탑승/운영 PR/배포. 이번 Prompt 범위에서는 하지 않음.
- Notion 갱신 대기 요약: 2026-10-11 도연, V1a 구현/Node14·기존Cloud40·시장12·Portfolio·기준원문/EOL 검사 완료, 실제 UI EPERM 미검증, base b93925f/v202 유지, no commit/no PR/no deploy, 다음 UI 검증. 로컬 이 문서가 원문이며 원격 branch 내용으로 표시하면 안 됨.
- CURRENT: 확인한 구현/검증/EPERM·Notion 미반영과 이 문서 링크 추가. DECISIONS 새 변경 없음. 다른 담당 기록 보존.

기준선 안전 비교 재현 시 PowerShell의 텍스트 파이프 대신 raw native redirection을 사용:

```powershell
cmd /c "git show b93925fe75f5e746a6101ed492e950516746fadc:hani-main.js > .ic-main-baseline.tmp"
cmd /c "git show b93925fe75f5e746a6101ed492e950516746fadc:index.html > .ic-index-baseline.tmp"
node scripts/hani-investment-research-safety.test.cjs .ic-main-baseline.tmp .ic-index-baseline.tmp
Remove-Item -LiteralPath '.ic-main-baseline.tmp','.ic-index-baseline.tmp'
```

## V1b · 작업 시작 (2026-10-11 KST)

- 담당: 도연(Codex), 단일 개발 Agent. branch hani/investment-committee-v1a / V1a HEAD d3999b4183bc23e6555557529a3b4d20f451badc.
- 원격 main GitHub connector 조회 b93925fe75f5e746a6101ed492e950516746fadc; 기존 V1a 기준선과 일치. shell 네트워크는 연결 불가.
- 승인 범위: 사용자 V1b Prompt의 월간 초안·확정·append-only 수정본·3배열/기존 commit(save) 저장·KST/UI·targeted tests. 커밋/버전증가/PR/배포 금지 유지.
- 변경 예정: committee JS/CSS, main의 기존 탭 진입 한 줄, 기존 Research Node/UI tests, codemap, 이 인수인계/CURRENT.
- Notion 착수 기록 추가: 자동 승인 검토가 MCP tool call requires approval, but approval policy is never로 거절. 원문/완료 요약 갱신 대기.

## V1b · 구현 및 검증 인수인계 (spec §27)

### 작업 식별 / 승인

- 담당: 도연(Codex), 단일 개발 Agent / 갱신일: 2026-10-11 KST.
- 상태: V1b 구현·Node targeted 검증 완료, 실화면 검증 대기. Release Candidate/배포 완료 아님.
- branch/worktree: `hani/investment-committee-v1a` / `C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/ic1`.
- V1b 개발 base/HEAD: `d3999b4183bc23e6555557529a3b4d20f451badc` (V1a 커밋). 원래 main 기준: `b93925fe75f5e746a6101ed492e950516746fadc`.
- 원격 최신성: Git shell은 네트워크 연결 실패. GitHub connector `git/ref/heads/main` 실제 조회 SHA가 b93925f로 원래 기준선과 일치. merge/rebase 없음.
- candidate SHA: 없음. V1b는 미커밋 작업이며 아래 SHA-256은 파일 identity 참고값이다.
- 승인 근거: 대표님 이번 V1b Prompt. 승인된 3배열 안에서 기존 `commit()` → `save()`로만 저장. 커밋·push·버전 증가·PR·main 병합·배포 금지 유지.

### 변경 파일 / 구조 분석

- `hani-investment-committee.js`: 기존 모듈에 KST presentation, 월간 초안/스냅샷 core, 월간 persistent panel 및 위임 이벤트, GPT 이어가기, 통합 Rating History 추가. 새 JS/event/renderer layer를 로드하지 않는다.
- `hani-investment-committee.css`: 월간 Executive Summary·하니 quote·테마/역할 요약·확정 종목 행·390px 단일열. desktop Research/Monthly에서 `.ui26-top`을 normal flow로 두어 sticky 겹침 원인을 제거하는 scoped CSS. 실브라우저 결과는 미검증.
- `hani-main.js`: 기존 canonical `selectInvestmentSection`에 Monthly 진입 `renderMonthly()` 호출 한 줄만 추가. 기존 행 CRLF 복원 확인, 나머지 mixed EOL 보존.
- `scripts/hani-investment-committee.test.cjs` 신규: freeze/수정본/월 중복 guard/overlap/KST/제안/실패복원/timeline 8건.
- `scripts/hani-investment-research.test.cjs`: 기존 14건 유지, 실제 commit/save 월간 저장 및 quota·원본보호 복원, canonical 월간 진입 검증 추가.
- `scripts/hani-investment-research-ui.test.mjs`: root = path.resolve(fileURLToPath(new URL('../', import.meta.url))) 유지. QA5·GPT 이어가기·월간 초안/no-write·수정본·past freeze·history·390/desktop·콘솔 검사 확대.
- `dev-center/codemap.json`: V1b owner/symbol/DOM event/targeted test 현황.
- 이 인수인계 및 `docs/development-history/CURRENT.md`: 실제 구현/검증/차단 기록. 타 담당 및 V1a 과거 기록 보존.
- runtime 로드/기존 ID owner: V1a main의 3개 persistent panel과 기존 Research host 재사용, module load 횟수 그대로. 새 literal DOM id 없음. 테스트에서 원래 Portfolio DOM 유지 및 탭 전환 no-save 확인.

### 추가 데이터 구조 / 저장 방식 / 호환성

- 새 최상위 state 구조 없음: 승인된 `investmentResearchCards`, `investmentResearchHistory`, `investmentCommitteeSnapshots`만 사용. 배열 등록/normalize/validator/Cloud write/schema/정책/보호 storage write owner는 V1a 그대로.
- 월간 record: `id`, `reviewMonth`(YYYY-MM), `revision`, `supersedesId`, `confirmedAt`, `portfolioRating`, `marketView`, `executiveSummary`, `haniRecommendation`, `strengthened`, `weakened`, `newWatchlist`, `valuationAlerts`, `deepValue`, `actionPlan`, `topConviction`, `portfolioSummary`, `securitySnapshots`, `holdingsRefs`.
- 각 `securitySnapshots`는 모든 OWNED/WATCH 카드 원문 전체를 deep copy하고 `researchId`, `previousRating`, `currentPrice`(value/currency/asOf/source), `convictionScore`, `upside/downside/high`, 연결 `holdingsRefs`를 추가한다. ARCHIVED 제외. 전체 최신 read-only holdings 참조도 deep copy한다.
- `portfolioSummary`: 실제 카드의 themes → securities 및 portfolioRoles.tags → securities. 동일 테마 OWNED 카드 ≥3개일 때만 HIGH, 실제 양수 보유 연결 건수는 확인 가능한 참조에서 계산. 미지정 테마는 경고 제외. 금액/비중/미연결 보유 수를 만들지 않는다. Past summary·종목·가격·확신도는 frozen 값만 렌더하며 live 값으로 재계산하지 않는다.
- 저장 ① 카드 생성/수정 및 append-only 판단 이력: V1a `applyBatch` → existing commit/save. ② GPT 선택 반영: 같은 `applyBatch` owner를 한 번 호출, 명시 선택 후에만 저장. ③ 월간 확정/수정본: validation/clone을 모두 준비 → snapshot 배열 append → existing commit/save, 실패 시 원래 배열 참조 복원.
- 초안·리포트 검토·preset·탭 이동·취소는 저장하지 않는다. 확정 전 카드/이력/보유/월간 기록 또는 계정 identity 변경 시 stale guard로 재작성 요구. 시세만 바뀌면 입력한 초안을 유지하고 확정 시 최신 조회값을 복사한다.
- 월별 최초 확정 1건 guard. 기존 월은 읽기 전용. `수정본 추가`를 명시 선택한 경우만 revision+1 및 새 ID/supersedesId로 append, 이전 객체/이력 삭제·overwrite 없음. 수정본의 종목 값은 현재 카드 기준임을 초안에 설명. 기본은 최신 수정본 표시, `이전 수정본 n개`에서 과거 수정본 조회.
- 최신 이전 월 스냅샷과 rating/thesisStrength 비교로 강화/약화 제안, 새 WATCH·가격대비 FV 초과/상승여력 ≥30% 후보·현재 Action 계획을 제안한다. 모두 실제 입력값 기반이며 편집 가능. Executive Summary는 현재 카드 rating/action, 하니 quote는 기존 카드 executiveComment로만 prefill. 시장 관점은 임의 생성하지 않는다.
- GPT 선택 반영 성공 후 `이번 달 위원회로 이어서` 버튼 → 현재 월 memory draft; 이미 확정한 월은 frozen 기록으로 연결. 월간 종목 행 → 현재 카드 detail의 열린 Rating History, 월간 month/rating/FV/conviction points와 기존 변경 log를 확정/변경 날짜 역순으로 병합한다.
- `hani_os_life_v23` 키와 `2.9.15-safe-baseline-bootstrap` 내부 버전 불변. direct storage write/remove/reset, `.clear(`, 신규 API, 기존 배열 migration/backfill, Supabase write/schema 변경 없음. 기존 unknown 필드/배열과 mixed EOL 보존.
- 백업/복원: 기존 전체 state JSON 경로에 snapshot 포함; 실제 save/read-back과 quota·원본보호 rollback을 합성 Node harness로 확인. 운영 원본/실제 계정/Cloud backup restore는 수행하지 않았다. 서버 append-only 제약은 추가하지 않아 기존 전체 Cloud 교체 경계를 넘어서는 보장은 없다.

### 현재가 / KST / UI

- V1a 기존 시세 캐시 readResearchQuotes/currentPrice 경로 재사용. cache 없으면 기존 manualPrice, 다른 통화 가격에는 upside/downside 미확인 유지. snapshot의 cache timestamp/source 및 manual 기준일은 확정 당시 원문으로 저장.
- 모든 Research/Monthly presentation timestamp는 명시적 Asia/Seoul: 검토일 `2026.10.11`, 현재가 `기준 10/09 10:00`, timeline/확정 시각 `2026.10.11 09:00 KST`. 저장·GPT machine JSON은 ISO 유지. 편집 입력은 KST human text, unchanged timestamp는 초/원래 ISO를 보존해 no-op history를 만들지 않는다.
- Rating/Action 코드는 English 유지, 상태/논리 강도/위험/확신도 차원/가치평가·조건 label은 한국어. HANI GROUP/Executive Summary/HANI RECOMMENDATION/WHY WE OWN IT/Rating History 브랜드 헤더 유지.
- 실제 desktop/390 light/dark 스크린샷: 없음. Playwright launch `spawn EPERM`으로 생성 전 차단. 기존 artifacts 폴더는 보존. 확장 UI test가 성공하면 `artifacts/investment-research/<width>-<finish>-monthly-draft.png`, `*-monthly.png` 및 기존 research/detail PNG 생성.

### 실행한 검증 / 회귀 / 남은 위험

검증 대상: d3999b4 위 V1b 미커밋 파일. frozen candidate/package/contract 없음.

| 명령/검사 | 결과 |
|---|---|
| `node scripts/hani-investment-committee.test.cjs` | 8/8 PASS: KST 경계/입력 no-op, memory draft 제안, deep freeze, 1/month, revision 보존/latest, 실패복원, 실카드 overlap, 통합 날짜순 timeline |
| `node scripts/hani-investment-research.test.cjs` | 14/14 PASS, 실제 commit/save/read-back 월간 저장·quota/protection rollback 및 canonical 월간 진입 포함 |
| `node scripts/hani-market-data-test.cjs` | 12/12 PASS |
| `node scripts/hani-portfolio-completeness-test.js` | PASS: completeness·미확인 원가 회귀 |
| `node scripts/hani-cloud-first.test.mjs` | 40 cases PASS |
| `node scripts/hani-cloud-egress-save-sim.test.mjs` | PASS: 3저장/412 bytes/full reads0, revision 충돌 거부 (예상 오류 로그) |
| `node scripts/hani-investment-research-safety.test.cjs .ic-main-baseline.tmp .ic-index-baseline.tmp` | PASS: b93925f 원문 기준 21개 storage/Cloud/계산 owner 동일, key/internal/display const 유지, main 기존7493줄·수정2줄 EOL 및 index 기존1750줄 EOL 보존 |
| `node --check hani-main.js`, `node --check hani-investment-committee.js`, `node --check scripts/hani-investment-research-ui.test.mjs` | PASS |
| CODEMAP JSON parse / `git -c core.whitespace=cr-at-eol diff --check` | PASS |
| `node scripts/hani-investment-research-ui.test.mjs "C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" "C:/Program Files/Google/Chrome/Application/chrome.exe"` | BLOCKED: browserType.launch `spawn EPERM`, 실화면/QA5 flow/390 overflow/콘솔 0은 PASS 아님 |

- 브라우저 검사 작성 범위: QA1/2/3/4/5/6/7, GPT select/continuation/cancel/stale, KST/desktop header, 월간 draft 메모리·tab reentry·확정·수정본·readonly old values·실제 3카드 테마 overlap·카드 history·중복 guard·저장 reload·legacy state/DOM·actual runtime id uniqueness·app console errors. 실제 실행은 launch 전에 차단됐다.
- JS syntax/기존 계산·DOM owner/저장 safety는 실행 증거 있음. 실제 렌더·이벤트·light/dark 색·sticky 겹침 제거·390px·console errors0는 미검증. 실제 로그인·Cloud 동기화·Android 및 운영 데이터 회귀도 미검증.
- Risk tier CRITICAL(승인된 보호 state 배열 저장). Full Safety Audit/One-Pass/HINA/아린/Preview approval은 Release train에서 필요; 이번 개발 결과로 Release gate PASS를 대신하지 않는다.
- 표시 버전/캐시 v2.9.202 유지: 대표님 no version bump와 기능 담당 규칙 준수. 후보 build/버전증가/PR/main merge/Pages/최신 운영JS 실로딩/Production read-back은 범위 밖, 수행하지 않음.
- 미구현: 요청 V1b 기능 코드의 의도적 누락 없음. 실제 UI 검사 완료와 스크린샷 증거는 환경 차단으로 미완료. V1 제외 자동매매/외부 API/AI 임의 변경 등은 추가하지 않았다.
- 확장 추천: 브라우저 검증 가능한 환경에서 확장 UI command를 먼저 실행하고, 배포 담당이 최신 main에서 train 후보/서버 gate/실제 계정·Android 검증을 수행한다. Snapshot 생성만으로 공식 Portfolio 회계 snapshot·운영 동기화 완료를 의미하지 않는다.

### 다음 담당 / Notion / 배포 단계

- 다음 한 가지 행동: 위 Playwright command 실행 → 실제 desktop/390 Monthly 스크린샷·QA5·console 결과 확인. 실패 시 이 branch 담당에게 되돌려 수정한다.
- Notion: 현황판 read 성공. V1b 착수 요약 insert_content는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never`로 거절. 완료 요약도 아직 미반영이며 같은 거절 동작을 반복하지 않았다.
- 갱신 대기 요약: 도연 / 2026-10-11 / V1b 월간 memory draft·deep snapshot·append revision·실카드 테마 요약·Rating History·GPT 이어가기·KST 구현. V1a d3999b4 위 미커밋, Node8+14/시장12/Cloud40/Portfolio/보호원문/EOL PASS, browser EPERM으로 desktop/390/console 미검증. v202 유지, 커밋·push·PR·main·배포 없음. 로컬 원문은 이 인수인계. 다음 browser UI 검증.
- CURRENT: 위 실제 결과만 새 V1b 요약으로 추가, V1a 및 다른 담당 기록 보존. DECISIONS 새 결정 없음.
- `구현 완료`와 `실화면 검증 완료` 구분. 커밋 없음 / PR 없음 / main merge 없음 / Pages 미확인 / 운영 표시 버전·최신 JS 실제 로딩·기능 read-back 미확인.


### V1b 미커밋 파일 SHA-256 (candidate SHA 아님)

| 파일 | SHA-256 |
|---|---|
| hani-investment-committee.js | `89e6e31903b6bccdb7b3247df98ad0bf2a57264451e9a6e3b4eabfb850199ef4` |
| hani-investment-committee.css | `5e15b8b92b1afce313a73cfe5fa4acfbd8335e7a0889308681b19976f01ffb5e` |
| hani-main.js | `37e158eb1c6679cc82fbef5366958fc9fb6886607bf0c054ea1eab05102d0908` |
| scripts/hani-investment-committee.test.cjs | `2fa8920e1382c0ae77fd91fa76d3fe23e7bc8a5cbda32841e672863085cc2110` |
| scripts/hani-investment-research.test.cjs | `4b44267a1cbf19b0d0de86492f2d5dcb4e46aa849cf70d29fa84e0def3bdf378` |
| scripts/hani-investment-research-ui.test.mjs | `4505a2a4563d8396f5dae4d2b01fd07cfca00b3357f114bc472d8ee686f9df41` |
