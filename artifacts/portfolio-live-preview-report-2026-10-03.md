# HANI Portfolio Analytics · Live Preview Report

## Baseline

- origin/main: `fe07619e488cc00d7c009a4ce2e8bc8b07df7f1f` (이번 세션에서 원격 최신성 확인).
- 기존 화면 표시 버전: `2.9.157`. 기존 시장 데이터 모듈: `2.9.150`.
- 기존 작업 디렉터리는 다른 작업이 사용 중이므로 변경하지 않았다.

## branch

`hani/portfolio-live-preview`

별도 작업 디렉터리: `C:/Users/홍성민/Documents/HANI_OS_DEV/.worktrees/portfolio-live-preview`.

## version

`live-preview-1` — Phase A/B 미배포 후보. 운영 버전·보호된 내부 버전 변경 없음. Release 버전 증가 및 최종 배포 검증은 이번 범위 아님.

## Source adapter

`hani-portfolio-analytics.js`의 순수 `build(state, options)` 함수. 기존 `HaniMarketData.positions`를 이용하고 계좌마다 최근 확정 보유기록 하나를 선택한다. 과거 스냅샷을 이어 붙이지 않는다.

`hani-asset-market-view.js`에 읽기 전용 복사본 제공 함수와 갱신 이벤트만 추가했다. 기존 시장 캐시의 종목정보·가격 응답을 재사용한다. 새 API 요청·수집 주기·가격 저장 경로 없음. 로그인 사용자 변경 시 이전 사용자의 응답은 새 adapter에 제공하지 않는다.

## Quantity source

`investmentBrokerSnapshots`의 confirmed actual / confirmed positions(recordType=positions) 계좌 holdings.quantity. 등록 계좌·enabled 계좌만 사용한다. 거래기록 평균가나 Master 가격으로 최신 수량·가격을 추정하지 않는다.

행별 실제 관측시각·원본목록 완전성은 기존 source에서 확정할 수 없다. 화면에 보유목록 완전성 미확인을 표시한다. 최신 source에서 계승된 보유종목을 신규 관측이라고 주장하지 않는다.

## Price source

기존 Toss 시장 데이터 reader의 metadata+quote. 종목 코드 정규화, Master 코드 충돌 확인, 유일한 metadata/quote, 시장통화 일치, 양의 유한 가격, 유효하고 미래가 아닌 시각을 확인한다.

`market_value = confirmed quantity × verified price`. 2분 이내 RECENT, 그 이후 LAST_KNOWN. LAST_KNOWN은 실시간 보장 아님. 가격 미연결은 NO_DATA/null이며 원본 recorded_value는 별도 유지한다.

## Cash source

기존 broker account에 신뢰 가능한 명시적 현금 canonical field가 없어 실제 연결에서는 현금 NO_DATA. `cashLike`, 총자산 차액, 미연결 종목 평가액을 현금으로 사용하지 않는다.

adapter는 account/currency/amount/as_of/source 및 EXPLICIT_CASH/CONFIRMED가 모두 있는 별도 관측값을 수용하지만, 이번 패치에서 이를 저장하거나 원본 화면에서 새로 추출하지 않는다. 모든 범위 내 등록 계좌의 해당 통화 현금이 유일하게 확인된 경우에만 합계 제공. 명시적 0원은 유효하다.

## Currency handling

KRW/USD 독립 bucket. 통화 미확인 보유기록은 별도 bucket에 보존하고 선택해서 조회 가능. 통화 미확인 active 기록이 있으면 다른 bucket도 부분 평가로 표시. FX 변환·KRW+USD 합산 없음. cost_currency와 price_currency 분리.

## Cost basis optional transition

읽기 전용 adapter는 원가 없는 종목을 정상 보유종목으로 처리한다. cost_basis/average_purchase_price/pnl/return_rate는 확인 불가 시 null/NO_DATA. 기존 buyPrice/purchaseAmount와 통화 원본을 별도로 보존한다.

통화가 명시되지 않은 기존 매입원가는 추정하지 않는다. 원가와 시장가격 통화가 다르면 손익·수익률 미제공. 원가가 확인되어도 시장 가격이 없으면 손익 미제공.

**기존 입력 폼의 원가 필수 정책은 변경하지 않았다.** 최소 입력을 종목+수량으로 완전히 전환하는 저장/검증 변경은 별도 승인·패치가 필요하다.

## Live holdings

계좌+시장/종목코드 identity로 투영. 같은 security의 다른 계좌 보유는 별도 행이며 구성은 종목 단위로 합산 가능. instrumentId/가격 연결 실패도 원본 이름·수량·기록평가액과 함께 보유한다.

동일 계좌 동일 identity 반복 기록은 동일 값이면 중복 계산하지 않음. 값/identity가 충돌하면 HOLDING_CONFLICT, 최신 평가 제외. 원본은 변경하지 않음. 수량 0은 EXPLICIT_ZERO로 adapter에 유지하되 active UI에서 제외한다. 목록 누락만으로 매도·청산을 생성하지 않는다.

## Valuation coverage

COMPLETE는 해당 통화 active 기록의 **가격 평가** 완료만 의미하며 목록 완전성을 의미하지 않는다. PARTIAL은 미평가 또는 통화 미확인 기록 존재. 가격 연결 금액만 표시하며 전체 계좌 총자산이라고 부르지 않는다. 모두 미평가이면 합계 null, 0으로 위장하지 않는다.

## Unpriced holdings

market_value=null. recorded_value와 원본 quantity 보존. 현금 또는 residual로 이동하지 않음. 통화 미확인 기록 수를 상단에 알리고 별도 통화 선택에서 조회한다. 모든 종목의 수동 검수를 요구하지 않음.

## Security weight

행 평가액 / 해당 계좌 범위·통화의 가격 연결 투자상품 합계. 가격 미연결 행은 null. 부분 평가이면 가격 연결분 기준임을 명시한다. 종목간 수량 비율을 비중으로 사용하지 않는다.

## Portfolio weight

행 평가액 / (가격 연결 투자상품 + 명시적 확인 현금). 확인 현금과 COMPLETE 가격 coverage가 있으면 기본 표시; 이외에는 종목 내 비중으로 표시한다. UNKNOWN 보유가 있으면 기본 포트폴리오 비중 불가.

## Desktop UI

자산 메뉴의 **자산 현황 / 내 포트폴리오** 전용 탭으로 분리. 기본은 기존 자산 현황이며 내 포트폴리오를 선택할 때 분석 화면을 표시한다. 기존 canonical tabs handler를 재사용하며 새 저장 handler는 추가하지 않았다. 탭 전환 후 source state 불변 및 기존 차트 복귀 통합 테스트 PASS.

포트폴리오 내부는 요약 / 보유종목 / 구성 탭. 계좌·통화 필터, 평가 coverage, 요약 카드, 평가액 면적 treemap, 상세 펼침 표. 구성: 종목·계좌·자산분류·시장/거래소·통화. 시장은 투자노출 국가와 같다고 주장하지 않는다.

treemap/구성 막대는 항상 가격 연결 투자상품 내 구성(현금 제외), 표 비중은 선택된 weight 정의. 서로 다른 분모를 명시적으로 표시한다. 큰 목록 막대는 상위 8개 및 생략 수 알림.

## Mobile UI

요약 카드, 상위 종목 막대, 수량·평가액·비중의 compact table 및 native details 펼침. 시장가격 별도 열은 작은 화면에서 숨김. 통화 미확인·부분 평가·빈 가격 상태 설명 제공. 모바일 페이지/표 가로 넘침 테스트 통과.

## Existing holdings compatibility

기존 accountId 선택·저장, holdings merge, 원본 계좌 totals, brokerCalc, 숫자검산, Resolver 변경 없음. 기존 Master className 사용. 직접 입력 코드와 Master 코드가 충돌하면 새 평가에서 제외하여 잘못된 자동 연결 방지.

기존 legacy transactions-only 계좌는 이번 adapter에서 확정 broker quantity가 없으므로 분석하지 않는다. 기존 자산 화면의 해당 기능은 유지한다.

## Data safety

source 불변성 단위 테스트, 기존 앱 통합 브라우저 회귀, 별도 Preview 저장/네트워크 호출 금지 테스트 통과. 새 분석 파일에 source 변경·save/commit·cloud mutation 경로 없음. 예시 페이지는 실제 사용자 자산/세션을 읽지 않는다.

## Protected key

`hani_os_life_v23` 기존 이름/쓰기 경로 변경 없음. 새 adapter/UI write 없음. 보호된 내부 버전 `2.9.15-safe-baseline-bootstrap` 변경 없음.

## Cloud

기존 읽기 전용 시장 reader 재사용. Supabase insert/update/delete/upsert 및 asset cloud semantics 변경 없음. production 실계좌 read-back/배포 QA는 이번 범위에서 수행하지 않음.

## Schema

기존 schema 및 destructive migration 없음. 월간 immutable revision 저장소, Data Hub dimensional snapshots 연결, export/report 구현 없음. 향후 Phase C에서 별도 설계·승인 필요.

## Tests

- 순수 adapter targeted test PASS: 평가액 비중, KRW/USD 분리, optional cost/null, 누락/미래/0/통화충돌 가격, 원본 기록평가 유지, residual 제외, 명시적 현금 0 및 계좌 scope, 최신 스냅샷/반복 입력, 중복 충돌, 명시적 수량0, identity 충돌, source 불변성.
- 새 Preview browser test PASS: 데스크톱 면적비, 부분평가/통화 미확인 조회, 상세/필터/현금 비중/구성 전환/빈 상태, 모바일 layout, 저장·추가 fetch 0.
- 기존 시장 browser smoke(Cache+OHLC) PASS: 차트/평균가선/기간/계좌 scope/lookup/미연결 보유/외화원가 guard/실패 fallback/모바일/보호 키 writes 0. 추가한 Live adapter 통합·owner 변경 guard도 PASS.
- 변경 JS syntax 및 diff whitespace 검사 PASS.
- Arin scoped UI review에서 분모 혼동·상태라벨·상위8개 생략·빈 가격 안내 지적을 반영. 수정 후 독립 재검토는 사용량 제한으로 완료하지 못했다. 수정 후 브라우저 테스트와 개발자 화면 확인은 별도로 수행했다. 독립 최종 UI 검토 PASS로 주장하지 않는다.
- production 계좌 값을 대상으로 한 검증, 최종 Release/HINA, 배포 read-back은 N/A(미배포 Preview).

## Known limitations

실계좌의 명시적 현금 source 미구축, 종목별 관측 provenance·목록 완전성 부재, legacy transaction-only 제외, 원가 필수 입력 정책 유지, FX 없음, 월간 저장/역사 분석/export 없음. 사용 중인 시장 캐시에 없는 보유종목은 NO_DATA. Preview fixture는 실제 보유자산이 아니며 실제 가격 연결 성공을 증명하지 않는다.

## READY FOR REPRESENTATIVE PREVIEW

Phase A/B 로컬 Preview 준비. 성민 대표님 UI 확인 대기. 구현 확대·원가 입력 정책 변경·월간 저장·PR/병합·배포는 이번 완료 범위에 포함하지 않는다.
