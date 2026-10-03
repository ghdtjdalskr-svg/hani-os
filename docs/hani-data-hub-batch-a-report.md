# HANI DATA HUB · Batch A Report

작성일: 2026-10-03 · 상태: Batch A 구현 및 targeted tests 완료

## 1. 기준선과 변경 범위

- 최신 main 기준: `fe07619e488cc00d7c009a4ce2e8bc8b07df7f1f`, v2.9.157.
- 브랜치: `hani/data-hub-batch-a`.
- worktree: `C:/Users/홍성민/Documents/HANI_OS_DEV/.worktrees/data-hub-batch-a`.
- 기존 감사 브랜치/문서는 그대로 보존하고 최신 main에서 새 브랜치를 생성했다. 다른 작업의 파일을 변경하거나 기존 브랜치를 merge/rebase하지 않았다.
- Production HTML의 UI script 참조는 `hani-ui-v02992.js?v=2.9.157`로 확인했다. 이번 작업은 Production 기능 검증/배포가 아니다.
- 변경 파일은 순수 엔진, 가상 fixture 테스트, 이 보고서 3개뿐이다. 기존 runtime/HTML/style/Cloud/배포 도구 변경 없음.

## 2. 구현 결과

| 구성 | 구현 | 경계 |
|---|---|---|
| Pure source adapters | 6개 지표, 원본 복사본만 읽고 검증 | 원본 normalizer/save/commit 호출 없음 |
| Extensible registry | metric_id별 정의 목록, 정의 버전/단위/기간/집계/품질 정책 | 6개 고정 열 schema 아님 |
| Monthly engine | 지표/월별 row, observed_days와 분자/분모, 출처/계산시각/revision | 명시적인 시계와 coverage 입력 |
| Comparison engine | 정확한 전월, 목표, budget usage/remaining, pp gap | UI 직접 계산 없음; 아직 UI 연결 안 함 |
| Read-only goal resolver | quarterly > annual > none, 유효기간/기록시각/충돌 검사 | 목표 생성·저장·기본값 이식 없음 |
| Quality/freshness | CONFIRMED/PARTIAL/NO_DATA/STALE, 이유 code | 실패 시 이전 정상값 보존 |
| Synthetic tests | 27개 자동 테스트 + 기존 월간보고 회귀 테스트 | 실사용자 데이터/브라우저 QA 아님 |

## 3. 대표 결정 반영

1. STORAGE: memory input/output만 구현했다. IndexedDB 생성이나 다른 durable store 없음. 보호 state에 derived metrics를 추가하지 않았다. Goal History도 캐시 안에 저장하지 않는다.
2. JISPI: 월 label이 2026-09이면 period_start=2026-08-18, period_end=2026-09-17, period_basis=settlement_18_17. 기존 결산 기준 유지, calendar 재정의 없음.
3. STEP: 양수 정수 steps를 가진 대표 일별 기록의 평균. total, numerator, denominator, observed_days를 보존한다. 0보는 분모에서 제외하고 ZERO_STEPS_AMBIGUITY를 공개한다. raw migration 없음.
4. HASDAQ: Confirmed Investment Account Total. actual/confirmed, positions 제외, 유효 당월 snapshot 중 last_valid. canonical broker total을 콜백으로 받으며 전체 생활 자산/수익률/holdings를 재구성하지 않는다.
5. GOAL HISTORY: 별도의 명시적 goal record만 읽는다. state.goals/ledger default를 자동 채택하지 않는다. 과거 목표 없으면 NO_GOAL. 누적 목표의 월 자동 나누기 없음.
6. EXTENSIBILITY: 정의+adapter를 등록하면 추가 metric_id/domain을 같은 월 row 계약으로 계산할 수 있다. 가상 Habit domain을 추가하는 테스트로 7번째 지표를 검증했다.
7. PORTFOLIO: quantity/market value/weight/account/history dataset은 미구현. 별도 HANI Portfolio Analytics · Architecture Study 전까지 확장하지 않는다.
8. DRIVE: 의존성/연결/호출 없음. Export UI/CSV/JSON도 이번 Batch에서는 구현하지 않았다. 향후 local export를 Drive 없이 제공하고 Vault는 독립 후속 Batch로 진행한다.

## 4. 모듈과 API 계약

`data-hub/metrics-core.mjs`는 standalone ES module이다. index.html이나 현재 앱에서 import/load하지 않는다.

- DEFAULT_REGISTRY / createRegistry(definitions): 정의를 검증하고 깊게 freeze한다. 고정 ID 외 지표와 domain을 허용한다. kind/aggregation/분기·연 집계 불일치를 차단한다.
- SOURCE_ADAPTERS: 기본 adapter 목록. custom adapters는 별도 map으로 주입한다. 원본 복사본은 깊게 freeze하여 adapter의 쓰기 시도를 차단한다.
- calculateMonth(source, options): 한 월의 metric row 배열. explicit month/asOf/calculatedAt 필수; ambient 현재 시간 없음.
- compareMetric(current, baseline, definition, resolvedGoal): 비교 결과만 반환한다. STALE/계약 불일치/잘못된 값을 공식 비교에서 제외한다.
- resolveGoal(goals, definition, clock): read-only 목표 선택. 유효기간, 연도/분기, 당시 기록시각, 단위/semantics, 중첩을 검사한다.
- markStale(row, expected): 불일치 revision을 STALE로 표시하되 입력/마지막 값을 변경하지 않는다.
- metricPeriod/previousMonth/validDate/koreaDate: strict date와 KST/결산기간 helpers.

호출 예시(가상/설명용):

```js
import {calculateMonth, DEFAULT_REGISTRY, compareMetric, resolveGoal}
  from './data-hub/metrics-core.mjs';

const options = {
  month: '2026-09', asOf: '2026-09-30',
  calculatedAt: '2026-09-30T12:00:00Z',
  canonical: {
    version: 'canonical-owner-version',
    brokerTotal: snapshot => brokerCalc(snapshot).total,
    ledgerSpending: ledger => ledgerCalc(ledger).jispiT
  },
  sourceContext: {
    books: {ready: true, complete: true}
    // Other sources need independently verified coverage for this period.
  },
  previousRows: []
};
const current = calculateMonth(readonlySourceSnapshot, options);
// Resolve goals and compare against the exact previous-month rows separately.
```

이 예시를 실제 운영에 연결한 것은 아니다.

호출 시 주의사항:

- complete=true는 해당 기간의 원본 coverage를 입증한 경우만 지정한다. 단순한 빈 배열/로그인으로 지정하지 않는다. 미지정은 PARTIAL, 미로드는 NO_DATA.
- canonical callback은 기존 owner의 검증된 결과만 반환한다. undefined/NaN/음수 총액이나 callback 부재는 NO_DATA, 또는 이전 정상값이 있으면 STALE. 새 재무 계산을 만들지 않는다.
- custom adapter는 자체 기간 규칙에 따라 value/sample_count/as_of를 반환한다. average/ratio에는 numerator/denominator가 필요하다. 미래 as_of/잘못된 결과는 차단한다.
- 임의 callback의 외부 동작까지 이 순수 모듈이 보증하지는 않는다. 향후 consumer는 읽기 전용 canonical owner만 전달해야 한다.

## 5. 월 row / 비교 / 목표 계약

결과는 metric_id+month별 행이며 6개 값 열을 고정하지 않는다.

월 row: metric_id/name/domain/month/value/unit/kind/aggregation/period_basis/period_start/period_end/status/reasons/coverage/sample_count/as_of/source/source_revision/calculated_at/revision/definition_version/engine_version. average/ratio는 분자/분모, STEP은 total/observed_days를 추가한다.

comparison: current/current_status/baseline/comparison_type/delta_absolute/delta_percent/delta_pp/target/target_gap/achievement_rate/usage_rate/remaining/goal_id/goal_revision/direction/as_of/reasons.

- 전월 없을 때 오래된 월 대용 금지. baseline=0이면 %는 null, 절대 차이는 가능하다.
- STEP은 목표비, JISPI는 예산 사용률/잔액, HINKEI는 pp. consumer는 계산 결과를 표시 직전에 반올림한다.
- 수치 movement와 좋은/나쁜 변화 interpretation을 분리한다. 체중 감소의 의미를 단정하지 않는다.
- goal 입력: goal_id/metric_id/goal_type/year/quarter/value/unit/semantics/status/revision/effective_from/to/created_at. 이력 쓰기는 없다.
- 유효 quarterly가 있으면 annual보다 우선한다. 최상위가 겹치면 CONFLICT, 잘못된 값이면 INVALID_TARGET. annual/default로 임의 fallback하지 않는다.
- 당시 미등록 목표는 선택하지 않는다. 과거 공식 목표가 없으면 NO_GOAL이다.

## 6. Quality / Stale / Revision

- CONFIRMED: 유효 계산과 coverage 확인 완료. point-in-time 외 진행 중 기간은 PERIOD_OPEN/PARTIAL.
- PARTIAL: 값은 있지만 coverage 미확인, 무효/모호/제외 기록 등의 이유가 있다. 0과 결측을 구분한다.
- NO_DATA: 관측 없음/분모0/미로드 등으로 value=null. 확인된 빈 book source의 0은 미로드의 null과 다르다.
- STALE: markStale의 revision 불일치 또는 previousRows를 받은 재계산에서 adapter/canonical 실패. 이전 정상값·출처를 유지하고 attempted_source_revision/last_attempt_at/이유를 기록한다. 공식 비교는 차단한다.
- 확인된 원본 삭제는 정상적인 NO_DATA/0 재계산이며 실패와 구분한다.
- 동일 일/ID 중복은 수정시각→stable ID로 선택한다. 키가 같고 값이 충돌하면 AMBIGUOUS_DUPLICATE. 배열 순서만으로 고르지 않는다.
- 해당 월 source/definition/quality 변경은 revision을 갱신한다. 다른 월의 유효 기록 수정은 당월을 바꾸지 않는다. 날짜가 불명확한 무효 기록은 대상 월을 알 수 없어 보수적으로 품질에 반영한다.
- source_revision은 변경 감지용 FNV64 fingerprint다. 보안·위변조 증명·Cloud revision으로 쓰지 않는다. Batch B에서 충돌 재검증/강한 hash를 최종 저장 계약으로 확정한다.

owner 경계/transaction/지속 revision/recovery와 목표의 durable 이력은 미구현이다.

## 7. 테스트 결과

실행: node --check data-hub/metrics-core.mjs, node --test scripts/hani-data-hub-batch-a.test.mjs, node scripts/hani-monthly-report-aggregation-test.mjs.

- JS syntax: PASS.
- 새 synthetic tests: **27/27 PASS**.
- 기존 월간보고 aggregation regression: PASS.
- 원본 deep-freeze/hash 비교: PASS. canonical callback의 frozen copy도 검증했다.
- 확장성: Habit domain/7번째 scalar metric 추가 테스트 PASS.
- 날짜/KST/윤일/월 경계/미래/전월 공백/0 기준값/양수 관측일/분모/weighted accuracy: PASS.
- 목표 우선순위/유효기간/기록시각/중첩/잘못된 목표/기본값 자동 이식 차단: PASS.
- 실패 시 STALE 유지/정상 삭제/정의·원본 변경/다른 월 수정 영향 분리: PASS.
- 저장·네트워크 API 미사용 검사, fetch 차단 계산, 현재 HTML의 module 미로드: PASS.

미검증/N/A: 실사용자 원본 coverage, 실제 backfill, IndexedDB/Cloud/Drive, browser UI/Arin/HINA/Production read-back. 구현·연결하지 않은 기능을 PASS로 보고하지 않는다.

## 8. 보호 경계와 다음 단계

hani_os_life_v23, 내부 2.9.15-safe-baseline-bootstrap, schema/DB/secrets, 현재 Dashboard/Report/Life Market, Finance owner와 release tooling 모두 변경 없음. index.html에 script 참조를 추가하지 않았고 main merge/push/배포를 하지 않았다. 현재 운영 runtime에 연결하지 않은 개발 모듈이므로 표시 version/build/release gate는 이번 작업에서 N/A이며, 실제 연결 candidate에서 수행한다.

**Batch A 완료. 다음은 Batch B Storage Contract 최종 확인이다.** Option B 방향은 승인됐지만 durable 구현 승인은 아직 아니다. owner/dataset scope, cache key/schema version, 원본 completeness, revision/strong hash, atomic publish, quota/recovery 및 목표 store 분리를 확인한 후에만 IndexedDB를 만든다. Dashboard migration은 Batch C까지 중단한다.

Portfolio Architecture Study와 Google Drive Vault는 별도 후속 범위로 남긴다.
