# QA easy cleanup · QA-1·2·3·7·8·9·13·16

## 작업 식별

- 갱신일(KST): 2026-11-01
- 담당: Codex / 미커밋 코드 검토·실제 브라우저 담당: 서윤
- 상태: 구현·Node targeted test 완료, 서윤 검토·실화면 검증 대기. Candidate/Release 작업 아님.
- worktree: `C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/qa-b2`
- branch(HEAD/ref 직접 읽기): `hani/qa-easy-cleanup`
- base SHA(ref 직접 읽기): `930e0db6ab50dc812dc05b55c4f74205e029fdec`; 사용자 지정 `hani/qa-report-fixes` 기반.
- 로컬 origin/main ref: `9e441b99b21e64d028218ef846800f9a37af7314`. 원격 최신성·두 ref의 ancestry는 Git subprocess 제한으로 미검증. merge/rebase 없음.
- 정적 표시 버전: `2.9.245`, index 마지막 script 선언: `./hani-launch-greeting.js`. 실제 화면 버전·실제 로딩 확인과 구분.
- 승인 근거: 이번 사용자 Task의 8개 QA 구현·Node 검증. commit/push/merge/버전·`?v=`·`HANI_DISPLAY_VERSION` 변경/브라우저·Git subprocess 실행 금지. 작업은 미커밋 상태로 남김.
- 보호 경계: READ-ONLY UI. save/state shape/보호 저장/계산/Cloud/Supabase/schema 변경 없음. office-live 두 파일·`data/hani-building/*` 제외. 새 runtime 파일 없음.
- CODEMAP: dashboard/investment owner 우선 확인. lounge/theme/AI work/ledger 표시 anchor 부재는 `CODEMAP_MISS`로 실제 owner symbol 검색 fallback. hani-main.js 전체를 읽지 않고 관련 함수·줄만 조사.

## 결과와 증거

### QA별 변경

1. **QA-1**: index sidebar fallback에서 숫자를 제거. 기존 조직 허브가 roster를 만든 직후 모든 `.sidebar-corporate-lockup small`을 `window.HaniOrganizationRoster.people.length`로 갱신(현재 19). 같은 corporate lockup은 index의 한 군데이며, 조직 hero 등의 PERSONAL AI COMPANY 문구에는 낡은 직원 수 없음.
2. **QA-2**: 기존 care card renderer에서 `{N}월 종목 리포트 정리` / `회장님 할 일`로 변경. researchDone 양 분기 모두 회장님이 할 행동 한 문장, 기존 버튼 유지. 대시보드·ticker·오늘의 한마디 배치 변경 없음.
3. **QA-3**: navigation/pageMeta/빠른 이동 표시/office index heading·aria/banner config/UI cleanup의 현재 화면 이름을 HANI GROUP으로 변경. 현재 담당 소개와 구매 검토 Draft 안내·버튼·toast도 변경. `agentReview` 및 다른 ID 불변. 본사·하니 본사·HANI 본사·대표실 검색 별칭 유지. 과거 보고서 카탈로그·release history·일보 데이터 불변.
4. **QA-7**: paintLiving의 unread별 30여 개 버튼 생성 제거. 표의 새 댓글 badge와 읽음 추적 유지. 기존 unread 슬롯을 persistent banner로 사용; 기존 조직 허브 `organizationOverviewData`를 `overviewData`로 노출하여 실제 이달의 직원 결과만 사용. portraitSource도 기존 이미지 선택 owner를 공유. 실제 직원 결과가 없으면 일보 house ad만 표시. 6초 단일 timer, 기존 showView에서 화면 전환 즉시 중지, visibility/pagehide 중지·복귀 재개, focus 동안 자동 전환 보류. reduced motion은 자동 전환 없음. 기본 anchor·일시정지·다음 버튼 및 기존 라운지 click delegate 사용. 고정 높이·Finish 토큰 CSS. 저장 호출 없음.
   - house ad는 **이미 패키지에 있는 `assets/heroes/newsroom-218.webp`** 사용. 기존 일보 전용 아트를 직접 참조하면 closure가 129개가 되는 것을 발견해 교체했고 최종 파일 목록은 수정 전과 동일한 128개.
   - **이달의 여신**: 현재 runtime 코드와 assets/data·data JSON 검색에서 실제 선정 결과·선정 owner를 찾지 못함. 임의 선정 없이 제외.
5. **QA-8**: 계좌별 자산 / 자산 구성 제목. 계좌 카드의 월간 기록 subtext 유지. 총자산−평가액 차액은 현금·기타로 통일, “증권사 총자산에서 평가액을 뺀 금액으로, 예수금과 누락분이 섞일 수 있어요.” 안내. 자산 구성과 투자 overview tooltip, 포트폴리오 차액 안내에 적용. 실제 `confirmed_cash != null`이면 확인된 현금 의미·값·확인일을 유지; 기존 거래 기반 현금도 차액으로 바꾸지 않음. KPI 총액/평가/현금은 기존 텍스트·구조 토큰, 평가손익 양수 빨강·음수 파랑·0 기본색. 6개 Finish의 실제 지정 surface 토큰 대비 4.5:1 이상 계산 검증. 값·포맷·비율·계산 불변.
6. **QA-9**: 지난달과 달라진 고정비 / 받을 돈 모아보기 (더치페이·환급), 각 summary 바로 아래 짧은 설명. 기존 확정 기간·미수령 확인 안내 유지. 실제 월 상세 row renderer에서 category==='special'인 행에만 특수 badge. 금액·회수예정액·분류·정렬·저장 불변.
7. **QA-13**: 기존 UI cleanup CSS에서 AI 업무 이미지 object-position을 center top으로 변경. 상세 portrait 최대 360px, desktop grid 최소폭·본문 overflow/wrapping·line-height 정리, 980px 이하 단일열·최대 340px·제목 wrap. 상태 JSON 불변.
8. **QA-16**: 기존 탭은 .active panel 전환, CSS :has가 hero 선택을 소유함을 확인. 저장/탭 이벤트 수정 없이 계절 탭에서 image 왼쪽·text 오른쪽, 색상 탭은 반대. 휴대폰에서는 계절 image 우선·색상 text 우선으로 구분. 240ms fade, reduced motion에서 끔. saved theme/save path 불변.

### 남겨 둔 HANI 본사

- `hani-office-live.js:2277`: 배경 이미지 alt의 `층 이름 · HANI 본사` (수정 금지 파일).
- `data/hani-building/art-map-v1.json:1325`, `:1328`: label `HANI 본사`, fullLabel `HANI GROUP · HANI 본사` (수정 금지 데이터, 건물 표시에 남을 수 있음).
- main 빠른 이동의 옛 검색 keywords는 의도적으로 보존(화면 이름 아님).
- 과거 release history·Gemini report catalog·`data/hani-ilbo/*.json`의 당시 명칭은 사용자 지시에 따라 보존. 현재 안내나 화면 이름과 구분.

### 변경 파일

- 기존 runtime 9개: `index.html`, `hani-main.js`, `hani-organization-hub.js`, `hani-board.js`, `hani-board.css`, `hani-asset-market-view.js`, `hani-ui-cleanup-v02971.js`, `hani-ui-v02992.js`, `hani-design-system.css`.
- 신규 개발 테스트 1개: `scripts/hani-qa-easy-cleanup.test.mjs` (runtime 파일 아님).
- 기존 테스트 8개: 아래 변경 근거 참조.
- 문서 2개: 이 인수인계, `docs/development-history/CURRENT.md` 상단 요약. 타 담당 기록 보존.

### 실행한 검증 (Node v24.20.0, 최종 미커밋 작업본)

테스트/파일/출력 묶음은 단위를 구분하며 중복 import 검사 수를 합산하지 않음.

| 명령 | 통과 / 실패 | 근거·제한 |
| --- | --- | --- |
| `node scripts/hani-qa-easy-cleanup.test.mjs` | 12 / 0 tests | 실제 roster/care 양 분기/검색/배너·click·timer·lifecycle/badge/자산·ledger row 출력, write trap·동결 synthetic source, 값·비율·AA·기존 theme tab, closure 128/missing0 |
| `node scripts/hani-qa-report-fixes.test.mjs` | 10 / 0 tests | 앞선 QA-4/17 실제 생성·persistent control·공통 보고서 회귀 |
| `node scripts/hani-polish-215.test.mjs --unit` | 4 / 0 groups | 실제 상태 feed/7인/에러 fallback/옛 검색 alias; 브라우저 경로 미실행 |
| `node scripts/hani-invest-basis.test.cjs` | 1 / 0 bundle | 실제 broker 계산·가격·차액·실제 confirmed cash·원본 불변·shared summary renderer |
| `node scripts/hani-app-216-practical.test.cjs` | 12 / 0 tests | 고정비/환급/결산·기존 생활 기능 회귀 |
| `node scripts/hani-banners-203.test.mjs` | 1 / 0 bundle | 실제 기존 banner config·asset·responsive 계약 |
| `node scripts/hani-design-system-qa.mjs` | 1 / 0 bundle | 기존 dashboard 계산·빈 값·원본 불변 |
| `node scripts/hani-board.test.mjs` | 1 / 0 bundle | 실제 기존 save/rollback/ownership/backup/Cloud synthetic safety |
| `node scripts/hani-board-living.test.mjs` | 8 / 0 출력 bundles | 7개 lounge 묶음 + import된 기본 board 묶음 |
| `node scripts/hani-board-community.test.mjs` | 14 / 0 출력 bundles | community 6개 + imported 기본/living 8개; 중복 수 포함 |
| `node scripts/hani-board-203a.test.mjs` | 2 / 0 출력 bundles | chairman 반응·preview 무저장 + imported 기본 board |
| `node scripts/hani-board-views-211.test.mjs` | 7 / 0 tests + 기본 bundle PASS | 실제 표시값·tooltip·원본 무저장 |
| `node --check <변경 JS/테스트 각 파일>` | 15 / 0 files | runtime JS 6개 + 신규/수정 테스트 9개 전부 개별 실행 |
| `node --test-name-pattern=canonical scripts/hani-brand-heroes-218.test.mjs` | 0 / 시작 오류 1 | `hani-ui-v02992.js hero restore hunk drift`. 임시 보관한 **수정 전 UI에도 같은 helper의 같은 오류** 확인. 변경하지 않은 historical fixture와 보존 gate를 완화하지 않음. Git subprocess 전에 실패 |

- syntax 대상: runtime JS 6개, 신규 easy-cleanup, polish-215, invest-basis, nav-groups, brand-heroes-218, investment-research-ui, asset-update-browser-smoke, board, board-community.
- 추가 read-only 비교: 수정 전 파일 임시 사본과 save/calculate/brokerCalc/ledgerCalc/ledgerFixedChanges/ledgerReimbursements 원문 동일. state/bootstrap/storage owner 묶음 동일. board의 paintLiving 앞 데이터·interaction·계산 경로 원문 동일. employee 계산 원문 동일. 과거 report catalog 원문 동일. runtime 9개 version/cache 토큰 동일. 변경하지 않은 줄 EOL drift 0(혼합 개행 board 포함).
- runtime closure 해석만 수행: 수정 전/후 128개, missing 0, 최종 추가·제거 0. package build/후보 Gate를 수행하거나 PASS로 표시한 것이 아님.

### 기존 테스트 변경 근거 (검사 완화 없음)

- `scripts/hani-polish-215.test.mjs`: HANI GROUP 실제 제목/nav/office heading/aria·검색 결과 label 예상값만 변경. 대표실·하니 본사·HANI 본사 검색 입력은 그대로.
- `scripts/hani-nav-groups.test.mjs`: sidebar/pageMeta/banner title 예상 이름만 HANI GROUP으로 변경. ID·중복 ID·기존 보호 assertion 유지. 실행에는 Git main baseline 필요하여 이 환경에서 미실행.
- `scripts/hani-brand-heroes-218.test.mjs`: 현재 canonical agentReview 이름 예상값만 HANI GROUP으로 변경. 과거 이름 alias·immutable release fixture·보존 assertions 유지. 위 기존 fixture drift로 시작 못함.
- `scripts/hani-investment-research-ui.test.mjs`: nav label 예상값만 HANI GROUP으로 변경. 브라우저 미실행.
- `scripts/hani-asset-update-browser-smoke.js`: 차액 label 예상값 현금·기타, provenance 문장은 새 설명의 예수금·누락분으로 변경. 기존 계산 근거·숫자 검사 유지. 브라우저 미실행.
- `scripts/hani-invest-basis.test.cjs`: 차액 안내 문장 예상 표현 변경. 실제 residual cashLabel과 confirmed cashLabel 구분 assertion 추가; 기존 숫자·날짜·미확인·원본 불변 검사 전부 유지.
- `scripts/hani-board.test.mjs`: 기존 공유 VM에 fake timeout/clearTimeout 공급. assertion 변경 없음. 새 timer의 실제 단일성·중지 동작은 신규 테스트의 timer Map으로 별도 검증.
- `scripts/hani-board-community.test.mjs`: 기존 closest mock이 모든 selector에 같은 버튼을 돌려주던 부분을 실제 selector에 맞게 반환하도록 수정. assertion 변경 없음.

### 미검증·남은 위험

- 브라우저 subprocess 금지: 실화면 PASS 아님. 360px lounge 고정 높이·focus·버튼·6초 전환/숨김/재진입, 390px AI 상세 text/portrait crop·desktop, 모든 Finish 렌더링·실제 contrast, Theme Studio 좌우/모바일 순서/fade/reduced motion 확인 필요.
- 신규 검사의 AA는 지정 CSS 토큰과 surface에 대한 수치 증거이며, 실제 브라우저 compositing 측정이 아님.
- Git subprocess 금지: 원격 최신성·실제 diff/status·ancestry 및 nav-groups의 Git baseline 보호 검사 미실행. Git 제한을 우회하거나 main baseline을 현재 작업본으로 대체하지 않음.
- `hani-theme-white-215.test.mjs`, `hani-investment-research-ui.test.mjs`, `hani-asset-update-browser-smoke.js`와 polish browser path는 Git 또는 browser 필요로 미실행.
- brand-heroes의 pre-existing hero fixture drift는 서윤이 현재 기준으로 검토 필요. 정확한 보존 oracle을 임의 수정하지 않음.
- Notion: 현황판 읽기 성공. 착수 insert_content가 자동 승인 검토에서 `approval policy never`로 거절됨. 같은 차단 쓰기를 반복하지 않고 **착수·완료 요약 갱신 대기**를 여기 보존. Notion 저장/read-back 완료로 보고하지 않음.
- commit/push/merge/PR/Preview 배포 없음. main merge / Pages / 화면 표시 버전 / 최신 JS 실제 로딩 / 운영 기능 read-back 모두 미실행. 버전 불변.

## 다음 담당에게

- 먼저 읽기: 이 문서와 `scripts/hani-qa-easy-cleanup.test.mjs`, 위 9개 runtime 파일의 미커밋 diff.
- 다음 행동: 서윤이 코드 검토 후 허용된 브라우저에서 위 실화면 QA. 승인 범위는 이 UI 작업이며 배포·데이터 변경 승인이 아님.
- 기능 충돌 시 현재 worktree 파일을 덮어쓰거나 다른 branch를 merge/rebase하지 말고 담당 조정. office-live/building 담당 작업은 손대지 않음.
- Notion 갱신 대기: 작업명·Codex/서윤·base930e0db·미커밋 검토 대기·QA8개 요약·Node12/10 등 결과·128파일·브라우저/Git/fixture 제한·이 원문 경로를 현황판에 append 후 읽기 확인.
- CURRENT 상단에 이 작업의 확인된 결과만 추가. DECISIONS 변경 없음. 이 작업은 사용자 지시대로 push하지 않았으므로 탑승 완료·배포 완료로 표시하지 않음.