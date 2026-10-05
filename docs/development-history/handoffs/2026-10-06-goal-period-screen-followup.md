# 분야별 목표 · 기간 진행 조회 후속

- 담당 Codex / 2026-10-06 KST / 개발·targeted 검증 완료, 탑승 대기.
- branch `hani/goal-period-screen-followup`, base `57719dcac0b221392dbe0a5ee3f5c7fb6e58cc02` (v2.9.185).
- 승인 근거: 대표님 후속 개발 지시(분야별 목표 완성 및 공통 목표·실적·기간을 실제 화면/계산에 연결). 실제 저장 구조 변경·Cloud·배포 승인으로 확대하지 않음.
- 범위: 설정 목표 패널에 분기/연간 목표 진행 조회를 추가하고 기존 `data-hub/period-goal.mjs` 계산을 연결. 보고서 UI/저장/분기 Q&A/PPT는 ‘누락된 QA 수행하기’ 담당이며 수정하지 않음. Cloud Sync·복원·백업은 Gemini 담당이며 수정하지 않음.
- 수정 앵커: `index.html` 목표 패널 내 별도 persistent 조회 슬롯/모듈 로딩, `hani-main.js`의 `renderGoalRegistry`·`dataHubRenderDashboard` 말미 및 신규 읽기 전용 조회 context helper. 기존 저장 handler/GOAL_METRICS/목표 삭제 경로 변경 없음.
- 순수 월간 계산 원본은 main의 GENERATED core. 생성기 소스가 저장소에 없으므로 이를 직접 수정하지 않고, 빌드 스크립트로 동일 core를 읽기 전용 ES module로 추출해 기간 조회에 재사용한다. 계산 알고리즘을 새로 작성하지 않으며 parity/generator freshness 검사 필요.
- 조회는 기존 원본 검증과 source audit 통과 시에만 가능. 실패·변경·로그아웃에는 숫자를 숨긴다. 저장소 write·IndexedDB 캐시·네트워크 추가 없음. 실제 지표 coverage가 불명확하면 PARTIAL 표시.
- 운동한 날 수는 D-20261005-12에 따라 보류. 새 지표 저장은 이번 범위 밖. BMI·체지방은 기존 지표 조회 연결, 시청은 순수 계약 준비 상태 유지.
- 당시 미검증 항목은 아래 완료 검사로 갱신. 실제 운영 로그인/Cloud/보고서 화면 통합은 여전히 미검증.
- 표시 버전/cache/HANI_DISPLAY_VERSION 증가·운영 PR/main 병합·배포 없음. 개발 완료 후 branch push, Notion 탑승 대기로 인계.

## 구현 결과

- 설정의 목표 관리 아래에 ‘분야별 목표 · 기간 진행’ persistent 슬롯 추가. 분기/연간·연도·분기를 골라 기존 8개 지표의 실적/승인 목표/차이·달성률·예산 사용률/기록 미확인 월을 조회한다. 원·권·보/일 표시. 모바일은 한 열 카드, desktop은 자동 다열.
- BMI/체지방은 기존 저장된 유효 값만 사용하며 키 변경으로 과거 BMI를 재계산하지 않음. 목표 의존 지표에 임의 성공/실패 판정 없음. 분기 조회에 연간 목표를 대신 적용하지 않음. 월 지출 예산은 실제 비교된 결산월 수에 맞춰 사용률 산출.
- `data-hub/goal-period-view.mjs`: 공통 projection, 동일 월간 core → 기존 `aggregatePeriod/resolvePeriodGoal/goalProgress` 사용. 기록 완전성 provenance를 추가하지 않으므로 확인된 관측값도 PARTIAL로 표시한다. 비어 있는 완독 월은 확인된 0으로 만들지 않음.
- `hani-goal-progress.mjs`: 작성용 UI source. `scripts/hani-goal-month-core.mjs`가 canonical GENERATED core와 기간 모듈·projection·UI를 읽어 runtime `hani-goal-progress.js` 및 test용 `data-hub/month-core.generated.mjs` 생성. generated main core 자체를 수정하지 않는다. `--check`는 원본과 산출물 불일치를 차단한다.
- 기존 release allowlist는 root `hani-*.js`만 허용해 ES module을 직접 운영 로딩하지 않고 classic JS bundle로 통합. 게이트/allowlist 변경 없음. runtime closure에 `hani-goal-progress.js` 포함, 작성용 `.mjs`는 runtime에 따로 포함하지 않음.
- `goalPeriodReadContext`: 기존 source audit·runtime.peek·live owner binding을 모두 통과한 경우에만 state clone과 기존 canonical 순수 계산을 넘긴다. asOf는 검증된 Data Hub의 KST 날짜를 사용. 조회 자체는 원본·LocalStorage·Cloud·IndexedDB에 쓰지 않는다.
- 보고서 연결점: `window.HANI_GOAL_PROGRESS.read({type:'quarter'|'annual',year,quarter?})`. 검증 실패 시 `null`, 성공 시 `{definition,actual,goal,progress}[]`. 화면과 같은 숫자이며 별도 인증·계산 우회 없음. 실제 분기/연간 보고서 UI에 호출하는 작업은 ‘누락된 QA 수행하기’ 담당이 수행한다. 기존 보고서 저장 구조는 변경하지 않음.
- 기존 목표 등록/Preview/승인 저장/삭제 기능과 GOAL_METRICS는 수정하지 않음. 시청 목표 등록 확대·운동일 목표·재보정 제안은 이번 작업에 포함하지 않음. 모든 분야 목표 로드맵 전체 완료를 뜻하지 않음.

## 검증 및 근거

- `node --test scripts/hani-goal-period.test.mjs scripts/hani-goal-period-view.test.mjs`: **23/23 PASS**. 기존 계산 19개 + 실제 canonical engine 추출 parity, projection 실적/목표/BMI/누락 월, 분기·연간 목표 분리/미래 실적 없음, 실제 app read boundary의 gate 거부/clone/canonical calculator 4개.
- `node scripts/hani-goal-month-core.mjs --check`: **PASS**, core 및 runtime bundle 원본 parity.
- `node --check hani-main.js`, `node --check hani-goal-progress.js`: **PASS**.
- `node scripts/hani-goal-progress-ui.test.mjs <playwright index.mjs> <Chrome executable>`: **4 조합 PASS**, 실제 앱 1440/390 × Porcelain/Midnight. 초기 검증 대기→격리 테스트의 모의 검증된 숫자→차단 후 숫자 제거, 분기/연간 전환, BMI 27·목표25·차이+2와 보고서 read API 값 일치, 모바일 카드 폭>250px/가로 overflow 없음, 콘솔 오류 없음, application state와 localStorage 동일·write 0. runtime closure 누락 없음·현행 allowlist 허용 확인.
- `node scripts/hani-owner-verification-runtime.test.mjs <playwright> <Chrome>`: **PASS**, 1440/390에서 기존 실제 runtime의 합성 same-owner 검증·binding 해제·protected key 보존·두 Finish·새 오류 0. 실제 계정/서버 성공을 뜻하지 않음.
- `node scripts/hani-quality-data-runtime.test.mjs <playwright> <Chrome>`: **28/28 PASS**, 합성 손상 데이터·quota·read 거부·보존·PC/모바일 복구/내보내기/import hold. 원본 보호 경로를 변경하지 않았지만 기존 회귀 검사로 확인. 실제 운영 데이터/외부 네트워크 없음.
- 마지막 변경은 read API와 단위 표시뿐이며 영향을 받는 목표 UI/API 검사를 재실행. 보호/복구 경로는 그 검사 이후 변경 없음.
- 이미지: 로컬 `artifacts/goal-progress/{1440,390}-{porcelain-cream,midnight-black}.png`, PC/모바일 육안 확인. panel 증거 캡처에서 global fixed header/remote overlay만 screenshot style로 숨김; 실제 UI overflow 검사는 스타일 변경 전에 수행. 이미지 파일은 commit하지 않으며 UI 검사로 재생성 가능.
- 전체 package/One-Pass/HINA/운영 read-back은 배포 열차 담당 단계로 남김. 개발용 targeted PASS를 배포 완료로 해석하지 않음.

## 배포 담당 / 다음 담당에게

- branch `hani/goal-period-screen-followup`, 최종 SHA는 branch HEAD 및 Notion 카드 참조. 운영 파일: `hani-main.js`, `index.html`, `hani-goal-progress.js`. 작성용/생성 원본: `hani-goal-progress.mjs`, `data-hub/goal-period-view.mjs`, `data-hub/month-core.generated.mjs`, `scripts/hani-goal-month-core.mjs`; 검사 파일 2개와 이 문서.
- 함께 배포할 서버 Edge Function·설정·schema: **없음**. 표시 버전 2.9.185 및 기존 cache tag 그대로. 열차 담당이 Frontend 통합 후 버전/cache를 한번 올린다.
- 기존 다른 탭의 후보·worktree는 보존. 대시보드/보고 담당도 `dataHubRenderDashboard`를 수정할 수 있어 main anchor 충돌 시 기능 담당 조정 필요. 임의 기능 충돌 해결·merge/rebase 없음.
- main의 월간 core 또는 source 계약 변경 시 생성 스크립트를 실행하고 --check/parity/targeted 검사를 다시 수행한다. 산출물만 손으로 고치지 않는다.
- 보고서 담당은 `HANI_GOAL_PROGRESS.read(period)`를 조회 연결점으로 재사용 가능. 검증 실패 null/부분 기록/목표 미설정 상태를 보고서에서도 그대로 구분해야 함. 저장 facts 필드 추가는 별도 보호 저장 승인 범위 확인 필요.
- 미검증: 실제 로그인/Cloud/read-back, 실기기 키보드, 보고서 화면 연결·자료 출력. 모든 기록 completeness가 불명확하므로 확정 결산으로 표현하지 않음. 목표 추가·이력 수정·삭제 저장은 기존 담당/기존 경로 유지.
- Notion에 작업 목적·범위·검증·미검증·서버 없음·다음 담당·원문 링크를 기록 후 읽기 확인. 상태 탑승 대기. 대표님 새 저장/Cloud 승인 요청 없음.
