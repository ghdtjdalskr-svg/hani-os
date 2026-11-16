# 독서·시청 사용 추이 카드 개선 보고 (`hani/reading-watch-trend`)

## 1. 바꾼 모양

- **빈 공간 해소 & 3단 배치 (`#readingActivityTrend`, `#movieActivityTrend`)**
  - 기존 `.activity-chart-figure { max-width: 640px }`와 2열(`1fr 170px`) 고정 배치로 넓은 PC 화면 가운데 생기던 빈 공간을 없애고, **그래프 → 오른쪽 요약 → 최근 기록 3개**의 3열 반응형 그리드로 채웠습니다.
  - 막대그래프 SVG(`viewBox`)가 데이터가 있는 기간만큼(최근 최대 12개월) 너비에 맞춰 확장되도록 변경하고(`width: 100%; height: auto`), 1120px 이하에서는 `그래프+요약 / 최근 기록 3개` 2단, 650px 이하(390px 폰 포함)에서는 **그래프 → 요약 → 최근 3개** 세로 1열로 쌓여 가로 넘침이 없도록 정리했습니다.
- **오른쪽 요약 세로 정리**
  - 그래프 바로 옆 패널에 **올해 합계 · 이번 달 · 월평균 · 가장 많이 읽은/본 달**을 세로로 묶고, 기존 연간 목표 링/예상 문구도 같은 패널 안에 유지했습니다.
- **최근 기록 3개 미니 목록 (읽기 전용)**
  - `state.books` / `state.movies`를 읽기만 하여 완료 기준 최신 3건을 표시합니다(독서: 책 제목·별점, 시청: 작품명·콘텐츠 종류).
  - 기존 `mediaImage` 표지·포스터가 있는 항목만 작은 썸네일을 표시하고, 없으면 텍스트만 표시합니다(새 이미지 0장).
- **막대그래프 & 평균선·범례 정리**
  - 이번 달 막대 강조(`current`), 0건 초과 막대 위 숫자 표시, **0건 달은 바닥 얇은 기준선(`height="2"`, `.is-zero`)**만 남기도록 수정했습니다.
  - 초기·최근 3개월 평균 점선이 0이면 바닥선과 겹치지 않게 생략하고, 둘 다 양수이면서 `y` 좌표가 4px 이내로 겹칠 경우 위아래(`±2px`, `data-overlap="1"`)로 분리했습니다. 범례는 한 줄(`flex-wrap: nowrap`)로 맞췄습니다.
- **민지 한마디**
  - 0건/이번 달 0건 권유/다독·정주행 칭찬/최고 달 칭찬/기록 다수 감탄/안정 흐름 등 데이터에 맞게 독서·시청 각각 30자 이내로 분기하며, 호칭은 `"회장님"`만 사용합니다.
- **어두운 마감(`midnight-black`, `titanium-graphite`)·밝은 마감 대비**
  - 고정 색상을 쓰지 않고 `--surface-raised`, `--surface-panel`, `--text-primary`, `--text-secondary`, `--border-subtle` 토큰으로 구성했습니다.

## 2. 바꾼 파일

- [`hani-main.js`](../../hani-main.js) (`activityTrend`, `activityTrendRecent`, `activityTrendReaction`, `activityTrendChart`, `activityTrendHtml`)
  - 기존 `완독 수`/`시청 수` 계산 기준, `hani_os_life_v23` 저장 구조, 표시 버전(`2.9.299`)은 수정하지 않았습니다.
- [`hani-design-system.css`](../../hani-design-system.css) (`.activity-trend-*` PC/태블릿/650px 이하 반응형 스타일)
- [`scripts/hani-reading-watch-trend.test.mjs`](../../scripts/hani-reading-watch-trend.test.mjs) (가상 데이터 기반 단위·CSS 계약 테스트 신규 작성)
- `artifacts/reading-watch-trend/REPORT.md` (본 보고서)

## 3. 깨질 수 있는 기존 시험

- `scripts/hani-one-pass-release.mjs` (`version_forward` 게이트): 배포 열차 규칙(`AGENTS.md` §11)에 따라 `HANI_DISPLAY_VERSION`·`index.html` 버전을 올리지 않았으므로, 릴리스 패키지 검증 시 배포 담당이 버전을 올리기 전까지는 `version_forward` 항목이 `BLOCKED`로 잡힙니다.
- `activityTrendChart` / `activityTrendHtml` / `.activity-trend-*` 기존 스냅샷·마크업 비교 시험이 별도로 존재할 경우 다음 변경으로 실패할 수 있습니다:
  - `<svg class="activity-chart">`의 고정 `viewBox="0 0 360 176"` 및 고정 6개월 가정 (`최근 12개월`까지 데이터 있는 만큼 동적 확장 + `data-months`)
  - 0건 달 막대 위의 `0` 숫자 제거 및 `height="2"` 기준선(`.is-zero`) 도입
  - `activityTrendHtml` 내부에 `.activity-summary-list`(이번 달·월평균·최고 달)와 `.activity-recent`(최근 기록 3개) DOM 추가 및 민지 한마디 문구 변경
  - `.activity-chart-figure { max-width: 640px }` 제거 및 `.activity-trend-visual` 3열 그리드 전환
- 참고: 셸 탐색이 제한되어 기존 `a216-2` 관련 테스트 파일 전체 목록은 확인하지 못했습니다(`scripts/hani-goal-period.test.mjs`, `scripts/hani-one-pass-release.mjs`, `scripts/hani-one-pass-rules.mjs`, `scripts/hani-history-coverage.test.mjs` 등 확인 범위에는 전용 `activityTrend` 단언이 없었습니다).

## 4. 서윤이 돌릴 명령 (로컬 미실행 · 실행 필요)

> 이 작업 환경에서는 셸 명령 실행이 금지되어 테스트를 직접 실행하지 못했습니다. 아래 명령으로 구문·단위·기존 회귀와 브라우저 미리보기를 확인해 주세요.

```powershell
# 1. JS 구문 확인
node --check hani-main.js

# 2. 이번 작업 신규 테스트 (요약·최근 3개·0건 달·민지 한마디·CSS 계약)
node --test scripts/hani-reading-watch-trend.test.mjs

# 3. 기존 관련 테스트 회귀 확인
node --test scripts/hani-goal-period.test.mjs
node scripts/hani-ci-scope.mjs --self-test
node scripts/hani-history-coverage.test.mjs
```

- **브라우저 수동 확인(Preview)**: PC(`~1900px`)와 폰(`390px`)에서 독서·시청 탭의 `#readingActivityTrend` / `#movieActivityTrend`를 열어, 그래프·요약·최근 3개 배치, 0건 달 기준선, 한 줄 범례, 밝은 마감과 어두운 마감(`midnight-black`, `titanium-graphite`) 글자 대비를 함께 확인해 주세요.
