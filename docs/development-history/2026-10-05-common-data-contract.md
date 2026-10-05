# 공통 데이터 정의서 (초안) · 목표·실적·기간·보고서

- 작성: Claude Code · 2026-10-05 KST
- 기준: main `882057c` (PR184), 제품 v2.9.178
- 상태: **제안 초안**. 대표님 승인 전에는 구현 기준이 아닙니다. 이 문서는 schema 변경, migration, 저장 경로 변경을 승인하지 않습니다.
- 범위: 문서만 작성. 운영 코드, `hani_os_life_v23`, Cloud 변경 없음

## 1. 왜 필요한가

로드맵은 `목표 설정 → 분기·연간 보고서 → 공통 데이터 → 백업·복구 → Drive` 순서로 진행됩니다. 목표와 보고서가 같은 숫자를 같은 방식으로 계산해야 분기·연간 결산과 다음 기간 Guidance가 맞습니다. 지금 코드에는 같은 실적을 계산하는 경로와 목표를 저장하는 곳이 각각 둘씩 있습니다(§4). 이 문서는 현재 구조를 사실대로 정리하고, 앞으로 맞출 공통 기준을 제안합니다.

## 2. 현재 구조 (코드 기준 사실)

| 개념 | 현재 위치 | 주요 필드 | 비고 |
|---|---|---|---|
| 원본 기록 | `state.*` 배열 (`hani-main.js` `freshState`, 997행) | 영역별 상이 | `hani_os_life_v23`에 저장. 이 정의서는 원본 구조를 바꾸지 않음 |
| 지표 정의 | Data Hub core `baseDefinitions` (84~98행) | `metric_id, domain, kind, aggregation, unit, comparison, direction, source, adapter, goal_semantics, period_basis, definition_version` | 6개 지표. `quarter_aggregation`/`annual_aggregation` 선언만 있음 |
| 월간 지표 값 | `calculateMonth` (290행) | `value, status(CONFIRMED/PARTIAL/NO_DATA/STALE), reasons, coverage, sample_count, numerator/denominator, revision, source_revision` | 월 단위만 계산 |
| 목표 (신규) | `state.goalRegistry` (`goalRegistryBuildDraft`, 1212행) | `goal_id, revision, metric_id, goal_type(annual/quarter), year, quarter, value, unit, semantics, effective_from, effective_to, created_at, status(active/superseded)` | Preview → 승인 후 저장. 과거 소급 생성 불가 |
| 목표 해석 | `resolveGoal` (346행) | 분기 목표 우선, 없으면 연간 목표 | `effective_from/to`, `created_at` 기준으로 당시 목표 선택 |
| 비교 | `compareMetric` (370행) | `baseline, delta, target, target_gap, achievement_rate, usage_rate, remaining, direction` | `comparison` 종류에 따라 전월 비교 또는 목표 비교 |
| 목표 (기존) | `state.goals` (1002행), `ledgerMonths[].targetT/targetC` (2711행) | 투자 목표액, 1·2차 목표 체중, 연간·월간 독서 권수, 월별 지출 예산 | 기존 화면이 사용. 신규 Registry로 옮기지 않음(“no legacy target backfill”, 1205·4335행) |
| 월간 보고서 | `monthlyReportSnapshot` (5620행), `state.monthlyReports` | 저장 시 **화면 문구**(`view.kpis/domains` 문자열)만 보관 (5668행) | Data Hub core와 별도로 계산 |
| 내보내기 | `dataHubExport…` (4758행) | `hani-data-hub-export-v1`: 월간 확정 기록, 검증된 지표, 목표 이력 | Drive 연동 아님 |

## 3. 지표별 현재 계약

| metric_id | 의미 | 기간 기준 | 월 집계 | 목표 의미(`goal_semantics`) | 월간 비교 방식 |
|---|---|---|---|---|---|
| `investment_total_krw` | 확정 투자계좌 총액 | 달력월 | 마지막 유효 스냅샷 | `point_target` | **전월 비교** |
| `body_weight_kg` | 월 마지막 유효 체중 | 달력월 | 마지막 유효값 | `point_target` | **전월 비교** |
| `books_completed_count` | 완독 권수 | 달력월 | 합계 | `cumulative_total` | **전월 비교** |
| `steps_daily_average` | 걸음 입력일 평균 | 달력월 | 가중 평균(합계/일수) | `daily_average` | 목표 대비 달성률 |
| `spending_jispi_krw` | 결산 생활 지출(jispiT) | 전월 18일~당월 17일 | 합계 | `monthly_budget` | 예산 사용률·잔여 |
| `quiz_accuracy_percent` | 문항 기준 정답률 | 달력월 | 가중 비율 | `rate` | 목표 대비 %p |

## 4. 발견한 차이와 위험

| ID | 내용 | 근거 | 영향 |
|---|---|---|---|
| G1 | 목표 저장소가 둘. 기존 `state.goals`·가계부 `targetT/targetC`와 신규 `goalRegistry`가 연결되지 않음 | 1002, 2711, 1205, 4335행 | 화면마다 다른 목표가 보일 수 있음. 예: 지출 예산이 가계부 `targetT`와 Registry `monthly_budget` 두 곳에 존재 |
| G2 | 투자·체중·완독 목표는 저장되지만 월간 비교에 쓰이지 않음 (`comparison=exact_previous_month`) | 85~87, 389행 | 목표를 입력해도 Data Hub에는 달성률이 나오지 않음. 보고서 연동 시 별도 “목표 진행” 계산 필요 |
| G3 | 분기·연간 집계 함수 없음 | 95·110행에서만 참조 | 분기·연간 결산을 하려면 공통 집계 규칙이 먼저 필요 |
| G4 | 목표 기간과 지표 기간의 단위 차이 | `goalRegistryBuildDraft` 1218행, `resolveGoal` 350행 | 연간 완독 30권 목표를 월 완독 수와 직접 비교하면 안 됨. 분기 단위로 저장한 `monthly_budget`이 월 예산인지 분기 총액인지 정의 필요 |
| G5 | 월간 보고서가 Data Hub와 다른 계산 경로 사용 | 5620행 vs 290행 | 체중: 보고서는 “월 첫 측정 대비 변화”, Data Hub는 “월 마지막 값”. 보고서에는 “당시 목표 미보관”으로 표시(5656행)되어 신규 목표를 쓰지 않음 |
| G6 | 저장된 월간 보고서는 문구만 보관 | 5668행 | 저장본만으로는 분기·연간 숫자를 다시 합산할 수 없음 → 원본에서 재계산하거나 숫자 참조를 함께 저장해야 함 |
| G7 | 가계부 분기 정의 미정 | `metricPeriod` 56행 | 결산월(18~17일) 3개를 묶을지, 달력 분기로 자를지 정해야 함 |
| G8 | 목표 상태는 `active/superseded`만 있음 | 1228행 | 목표 삭제·철회 상태는 다른 탭(자산 업데이트실)이 개발 중. 새 상태값은 그 작업과 맞춰야 함 |

## 5. 제안: 공통 계약 v0 (승인 전 초안)

### 5.1 기간 (Period)

```
period = { type: "month" | "quarter" | "annual", year, quarter?, month? }
```

- 지표마다 `period_basis`를 그대로 따릅니다. 분기 = 해당 basis의 라벨 월 3개, 연간 = 12개.
- 가계부(`settlement_18_17`)의 1분기 = 1·2·3월 결산월(전년 12/18 ~ 3/17). **대표님 확인 필요(D4)**
- 시간대는 `Asia/Seoul` 고정(현행 유지).

### 5.2 기간 실적 (PeriodMetric)

월간 행(`calculateMonth` 결과)을 묶어 계산합니다. 원본을 다시 계산하지 않고 월간 행만 사용합니다.

| kind | 분기·연간 값 | 상태 규칙 |
|---|---|---|
| `point_in_time` | 마지막으로 유효한 월 값 | 마지막 월이 NO_DATA면 이전 유효 월 값 + `PARTIAL` |
| `cumulative` | 월 값 합계 | 한 달이라도 NO_DATA/STALE이면 `PARTIAL`, 해당 월 표시 |
| `average` | 월 `numerator` 합 ÷ `denominator` 합 | 월 평균의 평균 금지 |
| `ratio` | 월 정답 수 합 ÷ 문항 수 합 × 100 | 동일 |

결과 필드: `metric_id, period, value, status, months_included, months_missing, reasons, source_rows[{month, revision}], engine_version, definition_version`

### 5.3 목표 진행 (GoalProgress)

`compareMetric`의 월간 전월 비교와 분리해, 모든 지표에 목표 진행을 계산합니다(G2 해결).

| goal_semantics | 비교 대상 | 출력 |
|---|---|---|
| `point_target` | 기간 마지막 값 vs 목표값 | 남은 차이(`target_gap`), 방향(체중은 목표 방향에 따라 해석) |
| `cumulative_total` | 기간 누적 vs 목표 총량 | 달성률, 남은 수량, **진행 속도**(경과 개월 비율 대비) |
| `daily_average` | 기간 가중 평균 vs 목표 | 달성률 |
| `monthly_budget` | 기간 내 각 결산월 지출 vs 월 예산 | 월별 사용률 + 기간 합계 대비(예산 × 개월 수) — **D2 확인 필요** |
| `rate` | 기간 가중 정답률 vs 목표 | %p 차이 |

출력 필드: `goal_id, goal_revision, metric_id, period, target, actual, actual_status, gap, achievement_rate | usage_rate, pace?, reasons`

- 목표 선택은 현행 `resolveGoal` 규칙(분기 우선, 당시 유효 목표, 소급 금지)을 그대로 씁니다.
- 기존 `state.goals`·`targetT/targetC`는 **읽기 전용 참고값**으로만 표시하고 자동으로 옮기지 않습니다(D1).

### 5.4 보고서 기록 (ReportRecord)

```
report = { report_id, period, generated_at, format: 2,
           view: {…현행 문구…},
           facts: { metrics: [PeriodMetric 참조], goals: [GoalProgress 참조] },
           engine_version, data_hub_generation_id? }
```

- 문구와 함께 숫자 참조를 저장해 분기·연간 보고서가 월간 저장본을 재사용할 수 있게 합니다(G6).
- 기존 `format: 1` 보고서는 그대로 읽습니다. 재생성은 사용자 확인 후에만 합니다(현행 유지).
- **이 항목은 `hani_os_life_v23`에 저장되는 구조의 추가 변경이므로 구현 전에 대표님 승인이 필요합니다.**

### 5.5 계산 경로 일원화 (G5)

- 월간·분기·연간 보고서의 숫자는 Data Hub core(`calculateMonth` → PeriodMetric → GoalProgress) 한 경로에서 가져옵니다.
- 월간 보고서의 별도 계산(`monthlyReportSnapshot`)은 표현 문구용으로 축소하는 것을 제안합니다. 운영 화면 변경이므로 별도 승인·회귀 검증이 필요합니다.

## 6. 대표님 결정이 필요한 것

| ID | 질문 | 추천 |
|---|---|---|
| D1 | 기존 목표(투자 1억, 1·2차 체중, 독서 권수, 가계부 월 예산)와 새 목표 등록을 하나로 합칠까요? | 새 목표 등록을 기준으로 삼고, 기존 값은 “이전 설정”으로 보여 주기만. 자동 이전은 하지 않음 |
| D2 | 분기 목표로 입력한 지출 예산은 “월 예산”인가요, “분기 총액”인가요? | 월 예산(현재 화면 문구와 일치) |
| D3 | 연간 완독 같은 누적 목표에 “지금 속도면 연말 몇 권” 같은 진행 속도를 보여 줄까요? | 보여 주기 |
| D4 | 가계부 분기는 결산월 3개(12/18~3/17)로 묶을까요? | 결산월 기준(현재 월 결산과 일관) |

## 7. 다음 단계 제안

1. D1~D4 결정 기록 (`DECISIONS.md`)
2. PeriodMetric·GoalProgress를 **순수 함수 + 테스트**로 먼저 구현(앱 미연결, 데이터 쓰기 없음)
3. 분기·연간 보고서 담당 탭과 연결 지점 합의 후 화면 연결
4. ReportRecord `format: 2`는 별도 승인 후 진행

## 8. 확인하지 않은 것

- 실제 운영 데이터 값과 기기별 상태는 보지 않았습니다(개인 데이터 미열람).
- 다른 탭의 미병합 작업(분기 Conference Room, 목표 초안, 목표 삭제)의 최신 코드는 확인하지 않았습니다. 연결 전에 해당 담당의 최신 인수인계를 확인해야 합니다.
- 행 번호는 main `882057c` 기준이며 이후 변경 시 달라질 수 있습니다.
