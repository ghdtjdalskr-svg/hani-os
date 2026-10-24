# Asset Intake v2 · PHASE 1〜2 조사·설계

## 작업 식별

- 갱신일: 2026-10-24 KST / 담당: 도연(Codex), 개발 Agent 1명.
- 상태: PHASE 1〜2 조사·설계 완료, 구현 승인 전. 운영 코드 수정·구현·배포 작업이 아닌 설계 문서 작업.
- 저장소: ghdtjdalskr-svg/hani-os / branch `hani/asset-intake-v2` / worktree `intake-v2`.
- HEAD/base 및 origin/main 캐시: `d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf`. GitHub branches/main GET으로 원격 main 일치 확인.
- 표시 버전: 로컬 index 태그와 HANI_DISPLAY_VERSION `2.9.232`. 마지막 script `hani-launch-greeting.js`(버전 태그 없음). 운영 Pages 요청 실패로 실제 표시·최신 JS 로딩 미검증.
- 승인 근거: 대표님이 `MISSION-intake-v2-phase1.tmp.md` 실행을 지시. 조사·설계만 승인. 운영 코드·push·PR·배포·인프라·비용·secret 등록은 범위 밖.
- 변경 범위: 이 공개 인수인계와 git 제외된 `.private-intake/report-phase1.md`. 타 담당 파일·공통 CURRENT/DECISIONS는 수정하지 않음.
- 민감한 원본/실제 금액/보유 수량은 공개 문서에 넣지 않음. 계좌번호는 보고서에서도 미표시 또는 마스킹.

## 결과와 증거

### 조사 범위·집계 정의

브로커 원본 5장(토스 3, 키움 2)과 실패 Preview 10장을 모두 육안 확인했다. 하나 폴더는 비어 있다. 실패 캡처의 날짜·버전·요청 JSON·서버 배포 identity는 보이지 않으므로 현재 main에서 재현한 결과와 구별한다. 224 인수인계·테스트의 합성 330/330은 실제 OCR 정확도가 아니다.

Manual Confirmation Count(MCC)는 **서로 다른 필드 중 노란 확인 요구 또는 미확인 입력칸이 보이는 수**다. 같은 필드의 상단 경고와 입력칸은 한 번 센다. 빈 기준일도 포함하며, 구간 안내·검산 배지는 별도다. 일반 수정 버튼·이미 채운 정상값·최종 승인 버튼은 제외한다. 캡처 밖 종목은 추정하지 않는다. 따라서 계좌 전체의 정확한 총수가 아니라 관측 하한이다. 실제 저장을 차단하는 필수 필드 수와도 다르다.

| 원본 대응 | 실패 파일 번호 | 화면별 MCC | 중복 제거 관측 MCC | 결과 |
|---|---|---|---:|---|
| 토스 | 06 / 07 / 08 | 8 / 1 / 1 | 9 이상 | 계좌 8항목 + 보이는 종목 코드 1항목. 07·08 동일 종목 반복. 나머지 종목 카드는 미노출 |
| 키움 | 13 / 15 / 16 / 17 | 8 / 8 / 1 / 2 | 11 이상 | 13·15 계좌 반복. 계좌 8항목 + 세 종목의 수익률 각 1항목. 17 마지막 종목은 경고만 보임 |
| 원본 대응 불가 | 09 / 10 / 11 | 8 / 4 / 7 | 19 | 첨부 토스·키움 원본과 종목이 다름. 하나로 임의 분류하지 않음 |
| 하나 | 실제 원본 없음 | 측정 불가 | N/A | 기존 224 합성 자료만 조사, 실화면 미검증 |

10장 화면별 합계 48회, 확실한 반복 9회 제거 후 39개 관측 필드다. 이는 독립 계좌 39건이나 모델 오류 39건이라는 뜻이 아니다. 예수금·출금가능·날짜 부재 같은 정상적인 missing과 불필요한 UX도 포함한다. 정상 화면 계좌당 0〜2건 목표는 **현재 실패 화면에서 미달**, 새 설계의 달성 여부는 아직 미검증이다.

### 실패 분류와 인과 근거

| 분류 | 실제 관측 / 코드 근거 | 설계 대응 |
|---|---|---|
| Extraction | 키움 계좌 매입·평가·추정예탁자산이 원본에 보이나 Preview 빈칸. 현금·출금가능의 읽음 0은 원본의 대출/융자 0과 같은 의미가 아님 | 셀 좌표·헤더·범위를 묶고 금융 의미를 검증. 원 요청 JSON이 없어 OCR 단계/후단 누락의 정확한 비중은 미확정 |
| Label mapping | 토스 계좌 합계·손익·수익률, 키움 계좌 및 세 종목 수익률은 읽은 원문이 있는데 라벨 미확인으로 비워짐 | layout별 공식 라벨 정규화. `수익률(%)`, `총평가손익금액`, `추정예탁자산`, `내 투자`, `총 수익` 등을 scope와 함께 해석 |
| Merge | 모든 계좌 범위를 담은 토스 화면도 구간 판정이 잘못되면 합계가 버려질 위험. 키움은 부분 구간 안내가 표시됨 | 계좌/국내/해외 scope를 필드별 보존. 날짜 없음만으로 보이는 계좌값을 지우지 않음. 완전성은 별도 불리언 |
| Instrument resolution | 토스 제목·기존 매칭에 코드가 있으나 raw 코드 입력은 미확인 | 코드 해석 결과를 같은 canonical draft 필드에 전달. 이전 매칭은 후보 근거일 뿐 conflict 검증 필요 |
| Derivation | 원본 대응 불가 두 카드의 단가 공란. 그중 수량까지 없으면 단가를 확정 계산할 수 없음 | 모든 broker에 동일한 확정 계산 엔진. 피연산자 부족 시 null 유지. 해당 두 카드의 원본 추출 누락 여부는 판정 불가 |
| Validation false positive | 괄호·단위 포함 헤더가 exact allowlist에서 탈락. 수수료 포함 평가·손익에 단순 산식을 강제하면 정상값도 불일치 | 라벨과 숫자 판독 신뢰도 분리, 수수료/세금/환산 기준별 식 사용, 원본 보존 |
| Review UX | 예수금·출금가능 부재도 노란칸, 정상 종목까지 모든 필드 편집 폼으로 전개 | required-save 예외만 보이기. optional missing은 숨김, 전체 필드는 상세 펼침 |

분류는 주원인과 부원인이 겹친다. 항목별 판정·실제 숫자는 비공개 보고서에만 있다. 원본 미대응 화면의 Extraction 실패를 확정하지 않는다.

### 실제 owner와 실행 순서

- CODEMAP `asset-update`의 owner `hani-asset-update-v1.js`, `normalize/run/approve`, `#assetCapturePreview`를 실제 확인했다. CODEMAP 기준 SHA는 현재보다 오래됐으며 상세 evidence/catalog/TSV anchor가 없어 **CODEMAP_MISS**로 좁은 검색했다. CODEMAP 자체는 수정하지 않았다.
- canonical 이벤트: 파일·paste → `run` → `agentApi("extract_intake_image")` → 서버 `extractIntakeImage` → `normalize` → `hanaEvidence` → `accuracyEvidence` → `mergeScreens`/`mergeHoldings`/`deriveHolding` → `HaniAssetMarket.resolveHoldings` → `render` 또는 `renderPositions` → 기존 편집 callback → `approve`.
- `hani-asset-update-v1.js:12–29`: alias 목록과 `readOcrFields`는 공백만 제거하고 exact 라벨 비교한다. 거절되면 `row[key]=null`. `accuracyEvidence`는 앞서 읽은 값을 재작성한다. 실제 원문 라벨이 접힌 캡처라 모든 탈락 문자열을 확정할 수는 없지만, 화면의 '읽음→미확인·라벨 미확인' 및 allowlist 부재가 근거다.
- 같은 파일 `deriveHolding`은 `meta.evidence`가 있으면 즉시 반환한다. 그래서 최신 evidence 응답은 보완 계산에 진입하지 못한다. 계산은 평균·현재 단가 두 항목에 한정돼 있다.
- `mergeHoldings`는 더 풍부한 행을 우선하고 빈 필드를 채우며 수치 차이를 모두 review issue로 만든다. 동적 값끼리 서로 다른 촬영 시점의 '혼합 행'이 될 위험이 있다. `mergeScreens`에는 일부 금액 INFO 허용이 있으나 모든 행 경고까지 해결하지 않는다.
- `hani-market-data.js:39 resolve`: `instrumentId`/ticker 기반 exact resolve다. `createCatalogClient`의 전체 시장 catalog 검색은 별도다. `hani-asset-market-view.js:249 resolveHoldings`는 codes를 조회하고 boolean만 반환한다. 이름→catalog→ticker를 draft에 보충하는 intake resolver가 아니다.
- 기존 제목의 `previewHolding`/기존 보유 매칭과 `editControl`이 보는 raw row는 다르다. 따라서 '제목엔 코드, 입력엔 미확인'이 가능하다. catalog의 단순 검색 결과는 공식 alias 검증 근거가 아니다.
- 실제 저장 owner는 `approve` / `approvePositions`; `normalizeBrokerHolding/Account/Snapshot`, `brokerHoldingCalc/brokerCalc`는 `hani-main.js:2795` 부근. 대상은 `state.investmentBrokerSnapshots[].accounts[].holdings[]`, `save()` 후 localStorage read-back, 실패 시 메모리 원복이다. 이 문서 작성 중 해당 경로를 실행하지 않았다.
- `approve`는 이전 계좌를 복제하고 값이 null이면 기존 totals/holding fields를 보존한다. `mergeWithExistingHoldings`도 null 입력을 덮어쓰지 않아 **현재 snapshot에 이전 동적 값이 이어질 수 있다**. `approvePositions`는 이번 incoming 행의 동적 필드는 지우지만 미입력 종목과 일반 snapshot 경로까지 해결하는 것은 아니다. CRITICAL 승인 경계로 분리한다.
- 서버 `supabase/functions/hani-agent-orchestrator/index.ts:3018–3140`: strict Asset Vision schema, layout/section/holdingsComplete/accountEvidence/holding evidence, nullable raw 숫자, Responses `gpt-5.6-luna`. schema가 채워졌다는 사실은 화면 해석 정확성 보장이 아니다. 배포 identity는 미검증이다.

## PHASE 2 · 공통 데이터 계약 제안

### 모델과 필드별 분류

새 DB schema를 만드는 제안이 아니라 **승인 전 메모리 canonical draft**의 계약이다. 필드 단위 envelope는 `value, currency/unit, provenance, sourceImageId, sourceScope, sourceAsOf, raw, label, confidence, derivedFrom, formula, precision, conflicts`를 갖는다. account-level `capturedAt`은 가져온 시각이며 실제 촬영 시각을 알 수 없으면 unknown, `recordedAt`은 최종 저장 성공 시각이다. 원본의 as-of와 현재 날짜를 서로 대체하지 않는다. 실 UI는 ✓ 확인됨 / ~ 계산됨 / ⚠ 확인 필요만 표시한다. 상세에서 raw와 근거를 확인할 수 있다.

| 필드 | 기본 분류 | Snapshot 저장에 필요한가 / 처리 |
|---|---|---|
| 선택 HANI accountId·broker | required source / user confirmation | accountId 필수. 사용자가 계좌를 먼저 선택하고 API 계좌 대응은 서버 owner 검증. 계좌번호 원문 저장 불필요 |
| 이름·ticker·market·instrumentId | identity resolution | 이름 또는 코드 원본 필요, 유일한 identity 확정 필요. 시장 없는 동명/보통주·우선주 혼동은 1회 확인 |
| 수량 | required source | 보유정보 저장 필수. API/화면/명시 사용자 입력만. 금액÷가격으로 수량을 추정하지 않음. 소수 수량 그대로 |
| 매입 통화·평가/가격 통화 | required source(관련 값 존재 시) | 원화 환산 화면과 거래 원통화 별도. 해외라고 USD 추정 금지. 통화 다르면 산술 차단 |
| 평균매입가 / 매입금액 | optional source / derived | 둘 중 하나와 수량 있으면 보완. 원가가 모두 없으면 null, positions 기록 허용; 손익 확정 금지 |
| 현재가 / 평가금액 | optional source / derived | snapshot valuation에는 현시점 평가 근거 필요. positions 전용 저장은 현재가를 요구하지 않음. 다른 시점 시세 API는 별도 overlay |
| 손익 / 수익률 | optional source / derived | 저장 필수 아님. 화면값 우선, 비용 기준 맞을 때만 계산. missing은 사용자 확인에서 제외 |
| 수수료·세금·평가 기준 | optional source | 기존 holding fee/tax 필드로 표현 가능한 범위 사용 검토. 비용 기준 불명 시 net↔gross 변환 금지 |
| 일간 손익·일간 수익률·전일종가·비중 | ignore(이번 intake) | 총 손익과 혼동 금지. 월간 Portfolio 저장에 필수 아님 |
| 계좌 투자 평가총액 | required source 또는 derived(valuation 모드) | 범위·통화 확인된 합계. 토스 '내 투자'는 투자합계이며 현금 포함 계좌총자산으로 단정 금지 |
| 계좌 estimatedAssets / 추정예탁자산 | optional source / user confirmation(필수 owner 요구 시) | 화면에 명시된 값 보존. investment-only 합계를 전계좌 자산으로 강제 승격하지 않음. 기존 estimatedAssets 의미가 달라지면 STOP |
| 계좌 매입합계·평가합계 | optional source / derived | 원본 있으면 기록 후보. 완전한 동일 scope·동일 통화 종목만 합산. 부분 목록에서 추정 금지 |
| 계좌 손익·총수익률 | optional source / derived | Snapshot 필수 아님. 화면 있는 값의 라벨 거절 제거, 없으면 숨김. 비율은 더하지 않음 |
| 예수금 | optional source | 평가와 총자산 검산 참고. 현재 normalizeBrokerAccount에 별도 cash 필드 없음. 없는 값을 0으로 요구하지 않음 |
| 출금가능 | ignore(영속) / optional source(상세) | Snapshot 불필요. 예수금에 더하지 않음. 확인 항목 제외 |
| 융자·대출·대주 | optional source / ignore(미지원 항목) | 0을 예수금에 매핑 금지. 기존 loanAmount 외 새 부채 의미 저장 필요하면 STOP |
| sourceAsOf | required source 또는 user confirmation | 날짜 없는 화면은 계좌 단위 1회 기준일 확인. 업로드 시각을 화면 기준일로 표기 금지 |
| capturedAt / recordedAt | system-derived | 업로드 시각과 저장 성공 시각 분리. 영속 추가는 별도 승인 |
| holdingsComplete·section | required source(범위 판단) | unknown/partial 기본. 전체목록 명시 증거와 사용자 complete 확인 없으면 누락 종목 유지 |
| accountName·accountType·financialInstitution | optional source / identity resolution | 선택된 기존 계좌의 ID·broker가 우선. OCR 별칭만으로 다른 계좌에 쓰거나 신규 계좌를 만들지 않음 |
| target_hint·financial_detected·layout | required source(추출 유효성) | 자산 응답·지원 화면 검증용. Snapshot 숫자 확인 항목으로 노출하지 않음 |
| confidence·evidence·extracted_text·warnings·mismatch | optional source / ignore(영속) | 메모리 근거·예외 판정에 사용, 전역 confidence로 전필드 확정 금지. raw/개인 원문 저장 확대 없음 |
| principal·averagePrice·valuationAmount·profitLoss | source alias | 각각 purchase·buyPrice·evaluationAmount·pnl로 일원화. alias를 독립 금액처럼 합산하지 않음 |
| id·period·status·note·revision·createdAt·updatedAt·flowSummary | 기존 저장 owner 관리 / ignore(추출) | OCR이 생성할 값이 아님. 기존 snapshot 형식 유지, recordedAt과 createdAt을 무조건 같은 의미로 간주하지 않음 |

provenance enum: `API / VISIBLE_SOURCE / DERIVED / INSTRUMENT_MASTER / USER_EDIT / MISSING`. MISSING은 null이며 0은 근거 있는 값이다. 정상값과 선택 missing은 접고, 실제 저장 필수 예외만 계좌 단위로 묶는다. 최종 '승인하고 저장' 1회는 MCC에서 제외한다. 예외 0〜2개는 목표이지 불확실한 필드를 강제로 없애는 상한이 아니다.

### 계산·반올림·비용 기준

1. 양쪽 값이 보이면 OCR 원본을 보존하고 계산은 검산에만 사용한다. 한쪽이 missing이고 피연산자·통화·시점·비용 기준이 맞을 때만 DERIVED 보완한다.
2. 기본식: 매입=평균×수량, 평균=매입÷수량, 평가=현재×수량, 현재=평가÷수량, 손익=평가−매입, 수익률=손익÷매입×100. 수량>0, 수익률 분모>0 필요. 0÷0은 missing. 계산 graph에서 missing 피연산자를 지우면 종속 계산도 무효화하고 USER_EDIT은 보존한다.
3. **실제 원본에서 비용 기준 차이를 확인했다.** 토스는 수수료·세금 포함 평가, 키움은 평가−매입과 수수료 차감 손익이 다르다. 화면값 우선. net 평가÷수량을 거래소 현재가로 이름 붙이지 않는다. 비용이 명시되면 동일 scope의 gross/net bridge를 별도로 계산하고, 불명이면 계산 불가로 남긴다. mission의 기본식은 동일 기준일 때만 적용한다.
4. 소수 수량은 원문 decimal 정밀도를 보존한다. 이진 부동소수점 누적 대신 decimal 연산 또는 정수 스케일 방식을 검토한다. 중간 계산은 반올림하지 않고 원본과 별도 유지. 표시만 KRW 합계 1원, USD 0.01, 수익률 0.01%p로 half-up; 단가는 원문 자릿수를 유지한다. 저장 숫자 정밀도 변경은 기존 owner 계약/승인 대상이다.
5. 허용 오차는 표시 자릿수의 구간 오차로 검산한다(평균가 반올림×수량, 수수료 적용 순서 포함). 비용 의미가 다른 차이를 넓은 퍼센트 허용치로 숨기지 않는다. 획일적인 2% 허용을 정확성 증거로 삼지 않는다.
6. 여러 장의 평가/현재가/손익은 같은 source 시점 묶음을 우선한다. 파일 번호만으로 최신 촬영이라 단정하지 않는다. 동일 계좌·identity·통화·수량·원가가 확인된 근접 capture 세션에서 동적 차이만 기존 `max(1,000원,0.5%)` 범위이면 INFO 후보(정책 제안), 1회 기준 화면 선택 가능. USD에 1,000원을 적용하지 않음. 큰 차이는 예외. identity·수량은 정확 일치, 원가 차이는 표시 반올림 외 엄격 검토한다.

### Instrument Master 해결 순서

exact symbol(시장 포함) → exact 정규화 이름+시장 → 공식 alias → 공식 목록/식별 정보로 유일함이 검증된 후보 → 사용자 1회 확인. fuzzy-only 단독 후보도 자동 확정·저장하지 않는다. 일반 주식과 우선주 접미사·ETF 시리즈·시장·통화를 보존한다. 키움 A-prefix는 기존 `^A[0-9][0-9A-Z]{5}$`만 제거하고 영문 종목은 보존한다.

현재 catalog는 검색·코드 metadata 기반이며 한국어 별칭의 공식성/버전까지 보장하지 않는다. 별칭 registry와 catalog coverage를 읽기 전용으로 조사한 뒤 유일성 확인이 가능할 때만 자동 채운다. 장애·불충분한 catalog는 기존 ticker를 무검증 복제하지 않고 예외로 남긴다. Master 쓰기는 승인 단계 기존 owner에서만, 새로운 write는 별도 승인.

### 증권사별 strategy와 기존 UI 유지

- **TOSS**: API First. 수동 업데이트 버튼 → 인증된 계좌 조회 → canonical draft → exception review → 기존 승인. OCR은 사용자가 명시 선택하는 fallback. 실패하면 기존 자산 유지·다시 시도만, 자동 OCR 전환·자동 저장 금지. OCR은 총/일간 열 구분, KRW 토글·소수·수수료 badge·국내/해외/전체 scope를 읽는다.
- **KIWOOM**: 이미지에서 Header/Sub Header/Row Pair의 위치를 구조로 추출하고 기존 TSV parser와 같은 canonical column map으로 변환한다. 코드행의 코드/손익/매입가/매입금액/수량/수수료와 이름행의 이름/수익률/현재가/평가금액/세금을 페어링. `%`, 괄호, 줄바꿈을 정규화하되 다른 열로 이동시키지 않는다. TSV parser 성공은 이미지 표 추출 성공 증거가 아니다.
- **HANA**: 계좌/종목 화면별 라벨 근접·영역 분리, 여러 장 병합, 확정 계산. 기존 224 코드·합성 시험은 참고만, 실제 원본 확보 전 실화면 완료 판정 금지.
- **Generic**: OCR → Master → Derived → Exception Review. layout 모르면 불명확한 필수 항목만 확인. 추측으로 정상 badge를 만들지 않는다.
- strategy는 canonical `run → normalize → merge → render/edit → approve` 내부 호출로 분리한다. 기존 `render/renderPositions`, persistent preview slot 및 단일 이벤트 owner를 유지한다. 새 renderer/event layer·저장 API를 만들지 않는다.

## Toss API 연결 제안

### 기존 PC gateway 조사 결론

`market-gateway/server.mjs`는 OAuth token을 한 프로세스가 소유하고 HANI bearer를 서버에서 검증, 허용 owner를 검사한다. `pc-collector.mjs`는 **in-process·listener 없음**, PC에서 직접 Toss로 호출한다. `setup-toss-credentials.ps1`는 CurrentUser DPAPI+사용자/SYSTEM ACL 암호문 저장, `session-manager.mjs`는 전용 세션 갱신 owner다. 실제 credential 파일은 읽거나 복호화하지 않았다.

`PROVISIONING.md`에는 대표님이 당시 **PC outbound IP를 등록**했고 공개 시세·private cache read-back을 했다는 과거 근거가 있다. 고정 IP를 만들어주는 구조가 아니다. 집 PC/회선인지, 현재 IP가 고정인지, whitelist와 일치하는지는 이번에 미검증이며 실 IP를 수집하지 않았다. PC 꺼짐·회선 IP 변경에 취약하다.

기존 routes와 cache는 공개 시세·catalog 전용이다. HANI의 저장된 보유종목에서 symbol만 읽어 Toss에 시세 요청하는 `portfolio-collector`는 **Toss 보유잔고 수입 기능이 아니다**. 기존 latest.json/bucket에 실제 잔고·계좌·수량을 넣으면 안 된다. PC 재사용에도 account/holdings adapter와 안전한 응답 전달 경로가 새로 필요하다.

### 옵션 비교 (2026-10-24 확인, USD/월·세금·환율 제외)

| 옵션 | 월 비용 | 고정 IP·whitelist | secret 위치 | HANI 인증·전달 | 장애·운영·보안 |
|---|---|---|---|---|---|
| 1 기존 PC gateway 재사용 **추천** | 추가 서비스 $0, 전기·기존 회선 별도. ISP 고정IP 비용 미확인 | 현재 PC 공인 outbound 등록; 고정 보장 없음, 변경 시 대표님 재등록 | 기존 DPAPI, 실행 중 PC 메모리. 동 Windows 사용자 공격은 방어 못함 | 기존 exact owner/Auth 검증 재사용. 동일 PC 명시 실행→만료 짧은 메모리 Preview 전달 필요. 폰 원격 버튼 경로는 아직 없음 | PC OFF/IP 변경 때 재시도. 새 private 잔고 클라우드 저장 없이 시작 가능. 초기 비용·운영 변경 최소 |
| 2 Static outbound proxy | 예: QuotaGuard Static $19부터 + app host 비용 | 제공 proxy IP들 등록. 실제 TLS CONNECT·outbound 검증 필요 | app 서버 secret store, proxy credential 추가 | HANI JWT 서버 검증+owner/account allowlist; Pages에서 proxy 직접 사용 금지 | proxy 및 app 장애 지점. TLS 종단/로그 정책 확인, 유지 중간 |
| 3 소형 VPS gateway | 예: DO basic $4(512MiB) 또는 $6(1GiB)부터; IPv4/트래픽/백업 추가금 별도 확인 | 서버 고정 outbound 등록. reserved IP는 연결만으로 outbound 변경되지 않음, 라우팅·재부팅 검증 | VPS OS 보호 파일/secret store, PC와 토큰 동시 재발급 금지 | HTTPS endpoint에서 HANI JWT 검증+exact owner+account binding | 상시 모바일 버튼에 적합. 패치·TLS·방화벽·감시 필요, 운영 부담 높음 |
| 4 기타 최소비용: 기존 PC 유지+ISP 고정IP | ISP 견적 필요, 확정 가격 없음 | 실제 회선 고정 공인IP를 등록. CGNAT/라우터 LAN 고정 주소는 대체 불가 | 기존 DPAPI | 옵션1 동일. 고정IP만으로 원격 폰 요청 경로가 생기지는 않음 | PC 가동 의존 유지. 네트워크 안정성만 개선, 계약/비용 승인 필요 |

추천은 **옵션1로 동일 PC 수동 읽기 전용 PoC를 먼저 설계**하는 것이다. 이미 있는 인증·DPAPI·단일 token owner를 재사용하고 신규 유료 인프라를 피할 수 있다. 다만 '어디서나 폰 버튼 한 번'을 만족한 구조로 표시하지 않는다. 그 요구가 필수라면 옵션3의 비용/운영 승인과 별도 연결 설계가 필요하다. 기존 PC token owner와 새 프로세스를 동시에 띄워 서로 token을 무효화하지 않는다.

### 요청·보안·실패 계약

공식 REST 스펙 1.2.24 확인: OAuth2 client credentials, 서버 전용 client_secret, 허용 IP. `/api/v1/accounts`로 계좌를 식별하고 선택 계좌 `/api/v1/holdings` 요청에 `X-Tossinvest-Account: accountSeq`를 사용한다. `/stocks`, `/prices`는 종목 metadata·시세 보조다. API 잔고 통화/손익 기준과 화면 원화 토글은 동일하다고 가정하지 않는다. 실제 응답 필드·반환 목록 완전성·소수 지원은 실계정 연결 전 검증 항목이다.

- 외부 업무 API는 위 GET allowlist만. OAuth token 교환 POST 이외 주문·매수·매도·정정·취소·조건주문·자동매매 endpoint/코드 금지.
- HANI owner를 매 요청 서버 검증하고 선택 accountId와 계좌 mapping을 검증한다. Origin/CORS만으로 인증하지 않는다. 브라우저가 임의 upstream URL이나 다른 accountSeq를 지정하지 못하게 한다.
- Toss secret/token은 브라우저·저장소·로그·Preview로 전달하지 않는다. Preview에는 필요한 필드와 마스킹 계좌 alias만. 캐시·로그에 잔고 원문 추가 금지.
- API/Preview/OCR 단계는 보호 데이터 write0. 부분 API 응답·timeout·403/IP 불일치·429·token 충돌·계좌 미대응은 기존 자산 유지, 다시 시도. 명시적 사용자 선택 전 OCR 호출도 하지 않음.
- 다른 PC/폰에 실제 잔고를 전달하려고 기존 Storage cache나 새 테이블/RLS·세션 쓰기를 확대해야 하면 STOP. 이번 설계는 그 권한을 부여하지 않는다.

공식 근거: [Toss 인증](https://developers.tossinvest.com/docs/auth), [REST OpenAPI](https://openapi.tossinvest.com/openapi-docs/latest/openapi.json), [QuotaGuard 가격](https://www.quotaguard.com/products/pricing?tab=shield), [DO 가격](https://www.digitalocean.com/pricing/droplets), [reserved IP outbound 설정](https://docs.digitalocean.com/products/networking/reserved-ips/how-to/outbound-traffic/). 가격은 도입 직전 재확인한다. Supabase changelog.md는 web 도구 content-type 제한으로 읽기 실패했으며 Supabase 변경은 수행하지 않았다.

## 구현 PR 분할안 (이번에는 생성하지 않음)

| 순서 | 변경 후보 파일·범위 | 검증·경계 |
|---|---|---|
| A 읽기 전용 계약·broker strategy | `hani-asset-update-v1.js` normalize/evidence/merge/derive, `supabase/functions/hani-agent-orchestrator/index.ts` Asset Vision 계약·prompt, `scripts/hani-*-224.test.mjs` 및 익명 합성 fixture | punctuation/헤더/row pair/통화/수수료/0 vs null/피연산자 삭제·순서/중복·partial 회귀. 보호 approve body 불변. 실제 OCR replay는 별도 승인된 외부 처리로 수행 |
| B Master+예외 UI | `hani-market-data.js`, `hani-asset-market-view.js` 읽기 전용 intake resolver, `hani-asset-update-v1.js` 기존 editableAccounts/Holdings, `hani-style-07.css`, 해당 tests | 이름/시장/공식 alias·우선주/동명 충돌, fuzzy 금지, 정상 계좌 MCC 0〜2, 390/1440 화면, 아린 Preview. 전체 편집은 상세에 유지 |
| C 저장 계약 정정 **승인 전 STOP** | `hani-asset-update-v1.js` approve/mergeWithExistingHoldings/approvePositions와 필요 시 `hani-main.js` normalizeBroker* | 동적 이전값 carry 금지·부분목록 유지·백업/원복/read-back·타 계좌 보존. 기존 write 로직 변경이므로 §5 명시 승인 후 CRITICAL Full Safety |
| D Toss 연결 PoC **승인 전 STOP** | `market-gateway` read-only adapter/단일 token owner/보안 전달 설계, intake 수동 버튼 | credential·네트워크·account binding·장애·write0·실제 잔고 읽기 승인 필요. 새 cloud persistence/paid host는 별도 결정. 기존 market-cache 정책 확대 금지 |

A/B도 일반 snapshot에서 오래된 동적값이 재사용되는 문제를 남긴 채 전체 목표 완료로 출시하지 않는다. C 승인 후 통합 회귀가 필요하다. 모든 runtime 작업은 버전/cache를 올리지 않은 기능 branch에서 targeted 검사 후 Claude 열차에 넘긴다. 서버 AI 응답 계약과 client는 함께 candidate 검증, Edge 배포 순서는 배포 담당이 최신 열차 기준 확정한다. 이번 문서는 배포 순서 승인/실행이 아니다.

### STOP / 승인 필요

1. 일반 snapshot의 null 의미·동적 carry 정책을 바꾸는 것은 기존 보호 write 로직 변경이다. 이전 기록 보존·새 기록 null·부분보유 목록 유지의 정확한 범위, 백업·복구·read-back 계획을 제시한 뒤 대표님 명시 승인 필요.
2. sourceAsOf/capturedAt/recordedAt·provenance·net/gross 의미를 영속 저장하려면 현재 normalizer에 없는 필드가 필요하다. 지금은 WeakMap 메모리 설계만. 영속 schema/migration/기존 key/내부 버전 변경은 STOP·별도 승인. snapshotDate/createdAt/updatedAt만으로 세 시각과 필드 출처를 전부 표현했다고 주장하지 않는다.
3. 투자평가총액을 estimatedAssets에 넣는 의미 변경, 계좌 잔고용 Cloud Storage·RLS·새 endpoint auth·secret 등록·IP 변경·유료 인프라·Edge 배포는 별도 승인. 새 계좌/종목 write 경로도 자동 허용하지 않음.
4. 실제 이미지 외부 OCR 요청·실계정 API 조회·보호 데이터 쓰기는 이번에 실행하지 않았다. 민감 fixture를 공개 테스트/PR/Notion에 넣지 않음.

## 검증·미검증과 다음 담당

- 완료: 원본5/실패10 육안 대조, field-level warning/공란 집계와 반복 제거, scoped owner/계약/기존 224 시험 조사, 원격 main SHA 대조, 공식 Toss 스펙·비용 근거 조회. 코드 실행 시험 PASS가 아닌 문서 감사 결과다.
- 문서 최종 검사: PowerShell로 MCC 합계48·반복제거39 계산, 필수 계약/STOP/미대응 제한 포함 여부, 알려진 민감 금액·수량과 계좌번호 형태가 공개 문서에 없는지, `.private-intake/` git 제외 설정을 확인했다. 이는 실모델 회귀 시험이 아니다. `Get-FileHash` SHA-256으로 작업 중 비교한 runtime owner 6파일(`hani-asset-update-v1.js`, `hani-main.js`, `hani-market-data.js`, `hani-asset-market-view.js`, `index.html`, orchestrator `index.ts`) 모두 불변 확인. 실제 새 작성/수정은 지정된 보고서2개뿐이다.
- 문서 전용: runtime build/version·package·One-Pass·HINA·Production QA N/A. 실제 OCR/API·실계정 저장·UI 개선 목표 달성·하나 실화면·현재 PC IP/프로세스·운영 표시/JS 로딩 미검증.
- 환경: git/rg/node가 PATH에 없고 대표적인 설치 경로도 없음. git 작업 없이 공용 gitdir의 HEAD/ref를 읽어 branch·SHA 확인했다. 원격은 GitHub connector 사용. 운영 Pages는 web 및 PowerShell 연결 실패. merge/rebase하지 않았다.
- Notion: 공통 현황판 조회 성공, 착수 `insert_content`는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 저장 성공/read-back 없음, 갱신 대기. 우회하거나 반복 요청하지 않음.
- Notion 갱신 대기 요약: 2026-10-24·도연·위 branch/base·실제15장 감사·토스/키움 관측 MCC와 원본미대응 분리·비용 기준/라벨/derived/기존 동적 carry 문제·공통 계약·PC PoC 추천·PR A〜D·C/D 및 영속 변경 승인 전 STOP·운영 변경/commit/push/PR/배포 없음·다음은 설계 검토와 C 승인 범위 확정.
- 공개 근거: 이 파일. 민감 세부는 로컬 `.private-intake/report-phase1.md`만, commit 금지. PR/Preview/배포 링크 없음. main 병합·Pages 반영·운영 read-back은 수행하지 않았다.
- 다음 담당은 이 문서와 비공개 감사표, 224 인수인계 2개를 먼저 읽고 **A/B의 읽기 전용 구현 범위와 C의 저장 정정 승인 범위**를 구분해 제안한다. 코드·secret·인프라를 먼저 바꾸지 않는다. 미공개 로컬 문서 링크가 원격에 존재한다고 표시하지 않는다.
