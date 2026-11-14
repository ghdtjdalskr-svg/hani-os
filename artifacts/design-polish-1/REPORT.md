# 디자인 다듬기 1차

2026-11-14 KST · 도연/Codex · `hani/design-polish-1` · 기준 `cb119351ff7b0a01b77fdc04d6f0b1ba0c2b54dc`(로컬 HEAD/origin/main 일치, 원격 새 조회 없음).

운영 수정은 **hani-design-system.css 끝의 ‘2.9.29x 디자인 다듬기 1차’ 블록 + hani-main.js 월간 빈 제목 표시 1곳**이다. 버전 2.9.294·캐시·내부 버전·기존 저장/Cloud/이벤트/타이머 경로를 유지한다.

| 항목 | 바꾼 것 / 선택자 |
|---|---|
| 1 intake | 모바일 `body[data-view="intake"] #haniHelperBot`에 `--helper-safe-bottom:190px`. 기존 viewportBox/place가 저장된 위치도 입력 바 위로 제한. calc/env 문자열을 parseFloat로 읽을 수 없어 숫자 px 사용. |
| 2 투자 제목 | `#investmentCommittee .ic-header`를 세로 배치, 제목과 버튼을 별도 행으로. h2 어절 보존. |
| 3 카드 상태 | `.ic-filter` 레이블 줄바꿈 방지, select는 필요한 경우 다음 행으로. |
| 4 월간 빈 상태 | `renderMonthlyReport`의 기존 pending h4에 날짜/설명 span 두 개. 모바일 `.monthly-report-empty-title` 20px·두 행. 저장된 보고서 제목은 기존 출력. |
| 5 intake 안내 | `.yuna-desk #yunaTargetHelp`에 흰 바탕·진한 #4d4660. |
| 6 자산 투자상품 | `#assetStats .stat:has(.asset-evaluation)` 밝은 바탕 #f4f1fa, 값 #49385f·레이블 #51455f. |
| 7 미룬 일 | `.pb-header .pb-eyebrow/.pb-intro`에 Finish의 primary/secondary 글자 토큰. 만화 카드 팔레트 유지. |
| 8 검색 | `#board .board-search input[type=search]`, `#drive .gdrive-search input[type=search]` 높이 최소44px·안쪽10/12px. 관련 버튼 최소44px. |
| 9 할 일 | 모바일 `#tasks>.grid>.card:has(#taskText){order:-1}`. DOM·탭 순서·기존 이벤트는 보존. |
| 10 테마 소개 | 모바일 `.aura-preview`의 소개·이미지132px·서명 여백 축소. 기존 Finish/계절 카드·THAW 선택자에는 변경 없음. |

선택 사항인 certificate·ledger ‘목표 수정’·game 공통 확대는 **보류**했다. 기존 helper는 일반 스크롤 버튼을 장애물로 잡지 않으므로, 같은 하단 숫자만으로 모든 버튼 위치의 비겹침을 보장할 수 없다. 작은 CSS 범위를 넘는 위치/이벤트 변경은 하지 않았다.

시험 층은 `design-polish exact inverse → 294 version/history → THAW → 293 → 치비1 → 292 이하`다. 신규 source/preload/fixture와 THAW·release dispatcher의 입구만 연결했다. 전체 before/after SHA, 유일한 편집 조각, CSS 정확한 suffix를 검사하고 알려지지 않은 입력은 변환하지 않는다. 기존 fixture·단언·숫자·hash를 교체하지 않았다.

검증: **79파일 실행 → 76성공 / 지정된 기존 실패3**. Node test 집계 **848 PASS / 9 FAIL / 2 skip**, 별도 출력 방식 스크립트5개도 성공(history `--unit-only` 포함)했다. office는 **73파일 중 비Git46파일 모두 성공, 610 PASS / 실패0 / skip1**이고 Git27파일은 목록만 남겼다. 전체 분류111파일에는 브라우저 전용5개와 CSS 참조 시험30개가 포함된다. [시험 상세](test-summary.json).

기존 실패는 nav-groups(미룬 일 speaker coverage), qa-210(기존 VM에 syncThemeCollections 부재), qa-report-fixes(기존 VM에 renderChibiNote 부재, 9실패)다. 지시대로 수정하지 않았다. 신규 **6/6 PASS**, JS 문법 **10/10 PASS**, PowerShell parser PASS. Local/SessionStorage 호출 패턴26·이벤트68·타이머47 및 insert/update/delete/upsert 패턴31은 전후 동일하고 내부 버전·보호 키도 유지된다. **raw171→293 168→289 164 / 누락0**을 확인했다. 실제 운영 저장 검증을 뜻하지 않는다.

보존 감사: 기존 fixture **111개 바이트 불변**, 운영 변경은 위2파일뿐이다. 시험이 덮어쓴 기존 JSON4개는 원문 복원하고 신규 결과4개는 `generated/`로 이관했다. [감사](preservation-audit.json) · [원문 안전 확인](raw-safety.json). 개발 Patch이므로 버전 증가/Candidate build/One-Pass/HINA/Production은 N/A 또는 미실행이다.

브라우저는 **실행 대기 / 신규 PNG 0장**이다. 실행기는 1440×1000/390×844 × 두 Finish × before/after의 9화면과 aura SEASON, 총80장을 이 폴더에 저장한다. 10항목 배치·가로 넘침·입력 바 겹침·6 Finish×4계절의 계산된 대비 4.5 이상·수동 입력 없는 렌더링의 저장 쓰기0·원본 state 유지 검사를 준비했다. 기존 navigation/scroll 설정 쓰기는 별도 기록하며 생활 데이터 쓰기는 허용하지 않는다. 실제 겹침0·넘침0·24조합 대비·모바일 실제 키보드는 아직 PASS가 아니다.

기존 뉴스룸 시험 기본값이 Edge 실행을 1회 시도했으나 spawn EPERM으로 차단됐다. 이후 `--node`로만 실행했다. 독립 브라우저 시험은 서윤에게 인계하며 Git 명령·실제 Edge 실행·빌드·버전 증가·commit/push·merge·배포는 수행하지 않았다.

서윤 명령:

```powershell
powershell -NoProfile -File artifacts/design-polish-1/run-tests.ps1
node scripts/hani-design-polish-1.test.mjs
$polishPw = 'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
$polishEdge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node scripts/hani-design-polish-1.browser.mjs $polishPw $polishEdge
git diff --check
```

위 회귀 명령은 기존 실패3개도 그대로 실패로 집계하여 exit1을 반환한다. Git 필요 시험 목록은 [test-plan.json](test-plan.json)의 `GIT_REQUIRED` 행이다. 브라우저 기존 시험은 `BROWSER_DELEGATED`. CSS 참조 grep 결과와 보조/기준선 필요 CLI도 같은 파일에 구분했다. 치비2 배포 뒤 최신 main 통합 시, 이 작업 전용 delta를 새 원문에 재고정하고 전체 층·targeted test를 다시 확인해야 한다. 다른 기능/기존 하위 fixture의 핀을 바꾸지 않는다.

Notion 현황판 읽기는 성공했으나 착수 기록 추가는 자동 승인 검토에서 `approval policy is never`로 거절되어 **미반영**이다. [인수인계](../../docs/development-history/handoffs/2026-11-14-design-polish-1.md)에 갱신 대기를 보존했다. 성민 대표님 승인 범위는 UI 구현이며 Preview 승인·배포는 별도다.

## 브라우저 실패 정리

2026-11-14 KST · 도연/Codex · `../design1b-task.md` 전체를 UTF-8로 읽고 한글 정상 확인. 기존 `hani/design-polish-1` 미커밋 상태에서 작업했다. **Git·Edge 실행 없음**. 아래는 서윤이 제공한 FAIL100의 후속 수정이며, 위의 최초 개발 결과와 구분한다.

### 원인·수정

1. **procrastination 96건**: 기존 계산은 조상 단색만 합성한 뒤 배경 이미지가 있으면 무조건 `unresolved`로 남겼다. 새 `scripts/hani-design-polish-1-contrast.mjs`는 해당 요소와 인접 6px 여백의 실제 PNG clip을 촬영하고 브라우저 canvas로 디코딩한다. 텍스트의 Range rect와 주변 2px를 제외한 픽셀 전부에서 전경색의 alpha를 합성해 **가장 낮은 대비**를 사용한다. 평균·유리한 픽셀 선택·반올림 통과는 없다. **4.5 기준 유지**. 배경 여백이 없거나 opacity/filter/blend 합성이 별도로 필요한 경우는 계속 실패한다. ratio·최악 픽셀 위치/색·샘플 수·clip·텍스트 제외 rect·PNG 경로가 결과에 남는다. 실제 픽셀 대비가 4.5 미만이면 그대로 실패하므로, 서윤 재실행 후 해당 Finish 조합의 CSS 추가 보정 여부를 판단한다. 이번에는 미룬 일 CSS 토큰을 바꾸지 않았다.
2. **intake 2건**: 원래 결과는 before/after 모두 최초 intake에서 숨고 입력 포커스 후 나타났다. canonical `place()`는 로그인 gate가 보이면 `helperReason=login`으로 숨긴다. `unlockLoginGate()`의 `.is-hidden`은 visibility/opacity **0.22초 transition**을 시작하고, CSS-only 완료는 helper MutationObserver에 새 DOM 변경을 알리지 않는다. 따라서 조기 `place()` 결과가 다음 focus/resize까지 남을 수 있다. 기존 owner+DOM fixture로 이를 재현하고 공개 `HaniHelperBot.update()` 이후 `shown`, 저장 쓰기0을 확인했다. 검사 setup은 기존 `unlockLoginGate()`를 유지하고 실제 gate의 hidden/opacity0을 기다린 뒤 공개 `update()`와 `shown`을 기다린다. `hidden=false` 강제 변경·당번 조작·새 저장은 없다. 기존 가시성/겹침 단언을 모두 보존하고 helper가 viewport 안에 있는지도 추가 검사한다. `--helper-safe-bottom:190px`은 그대로다. 실제 Edge에서 원인이 동일한지는 새 `helperSetup` 진단으로 최종 확인한다.
3. **drive 2건**: 기존 모바일 공통 `#app.app :is(...input...):not(.hani-office-actor){min-height:40px!important}`가 작업 suffix의 일반 `44px`보다 우선했다. 기존 결과는 두 Finish 모두 43px. 기존 검색 input 두 선택자에만 `min-height:44px!important`를 적용했다. 다른 레이아웃·checkbox·저장·handler 변경은 없다. 검사에는 실제 높이와 함께 computed minHeight/height/padding/lineHeight/inline style도 남긴다.

운영 후속 diff는 **hani-design-system.css의 기존 검색 min-height 선언에 `!important` 한 곳 추가**뿐이다. `patch.css`, 이 작업 전용 `design-polish-1-delta.json`의 CSS suffix/after SHA 및 source의 fixture pin만 함께 갱신했다. 기존 하위 fixture와 단언은 변경하지 않았다. `hani-main.js`는 최초 작업 완료 상태 그대로다.

기존 `browser-results.json`(FAIL100)과 PNG80은 보존했다. 보정 실행은 **`artifacts/design-polish-1/browser-fixed/`**에 새 browser-results.json·기존80종 전체 화면·배경 clip PNG를 저장한다. 최초 실패 증거를 새 결과로 덮어쓰지 않는다.

### 검증·남은 위험

- 신규 픽셀 계산/clip 전달 시험 **4/4 PASS**: 밝은/어두운 전경의 최악 픽셀, 4.5 경계 양쪽, glyph 여백 제외와 좌표 스케일, alpha, 측정 불가 실패, PNG 전달·증거 연결을 확인했다.
- 기존 작업 시험 **6/6 PASS**: exact inverse, 보호 JS/월간 제목 보존, helper190px의 실제 clamp, 294/THAW/293 층·closure171→168→164 및 드리프트 거부를 확인했다.
- [helper setup 재현](browser-fix/helper-setup.json): 실제 owner·기존 DOM fixture로 로그인 전환 잔류/공개 갱신/외부 모달 유지/저장 쓰기0 확인.
- 기존 helper 관련 시험도 `--test-name-pattern='visibility reasons follow login|existing resize and open paths|phone keeps fixed UI|crowded 390'`으로 **4/4 PASS**. 전체 helper 실패4건과 구분한다. [해당 로그](browser-fix/helper-focused.log).
- 관련 전체 Node 회귀: **80파일 → 77성공 / 기존 실패3**, Node **852 PASS / 9 FAIL / skip2**, 별도 출력 스크립트5개 성공. office는 **비Git46파일 전부 성공 / 610 PASS / 0 FAIL / skip1**. THAW·294·release 층·save-guard·M9 관련 시험 통과. 기존 실패는 nav-groups의 speaker coverage, qa-210의 syncThemeCollections 미정의, qa-report-fixes의 renderChibiNote 미정의이며 최초 작업과 동일하다. Git27·브라우저 전용5개는 실행하지 않았다. [최종 집계](test-summary.json).
- 추가 기존 helper 전체 검사: **25 PASS / 4 FAIL / skip1**. 인원20 vs 기대19, procrastination 도움말 fallback, ieum crop, legacy closure169 vs159 불일치다. CSS/main은 전용 inverse를 통해 독립 cb11935 원문으로 투영된 상태이며 helper/roster/style08·기존 시험은 이번에 바꾸지 않았다. 이 광범위 기존 실패를 수정하거나 단언을 완화하지 않았다. [명령·분류](browser-fix/additional-helper-check.json).
- 문법·보존 감사: 변경·신규 JS의 직접 node --check 통과. Node 내부 spawnSync 문법 검사 시도는 환경상 차단되어 PowerShell에서 직접 실행했다. [syntax](browser-fix/syntax.json). **기존 시험306파일·하위 fixture111개·최초 브라우저 결과+PNG81파일 바이트 불변**, 추가 운영 변경은 CSS 한 곳의 `!important`뿐이고 JS는 전부 착수 상태다. 범위 밖 변경/누락0. 시험이 덮어쓴 합성 JSON4개는 정확한 착수 바이트로 복구하고 신규4개는 이 작업 증거 안으로 이관했다. [최종 범위 감사](browser-fix/scope-audit.json) · [부산물 이관](browser-fix/test-output-restoration.json).
- **실제 Edge·새 clip PNG·6 Finish×4계절 실측 대비·모바일 키보드·수정 후 100건 해소 여부는 미검증**이다. 신규 Node 시험만으로 브라우저 PASS를 선언하지 않는다. 새 배경 픽셀에 4.5 미만이 있으면 Finish 토큰 기반 최소 CSS 수정과 재검사가 필요하다.
- 표시/cache **2.9.294 유지**. 내부 버전·보호 키·기존 저장/Cloud/schema·이벤트·타이머 변경 없음. Candidate/build/One-Pass/HINA/main merge/Pages/Production read-back은 미실행이다.
- 착수 HEAD/base는 cb11935, 로컬 origin/main은 **5396c9f**로 진행했다(원격 새 조회 없음). 추가된 파일은 런타임 미참조 치비2 그림 시트 한 개이고 대상 CSS·main.js·UI JS·index 원문은 동일했다. 자동 merge/rebase 없음. 통합 시 최신 기준선 재확인은 서윤/배포 담당에게 인계한다.

### 서윤 재실행 명령

```powershell
node scripts/hani-design-polish-1-contrast.test.mjs
node scripts/hani-design-polish-1.test.mjs
node artifacts/design-polish-1/browser-fix/helper-setup-check.cjs
powershell -NoProfile -File artifacts/design-polish-1/run-tests.ps1
$polishPw = 'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
$polishEdge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node scripts/hani-design-polish-1.browser.mjs $polishPw $polishEdge
```

위 전체 회귀는 지정된 기존 실패3건도 집계해 exit1을 반환한다. 실제 브라우저 결과는 `browser-fixed/browser-results.json`의 failures·helperSetup·각 contrast.screenshot/ratio/unresolved 및 PNG를 함께 확인한다. 실패가 남으면 PNG와 해당 Finish/계절/viewport를 유지해 후속 수정한다.

Notion 후속 착수 기록 추가도 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절했다. 현황판 읽기는 성공했으나 **갱신 미반영**이며, 후속 인수인계에 완료 요약과 갱신 대기를 보존한다.

## 마지막 대비 1건

2026-11-14 KST · 도연/Codex · `../design1c-task.md` 전체 UTF-8 정상 확인. 기존 작업 블록의 `.pb-header .pb-intro` 선언만 `color-mix(in srgb,var(--text-secondary) 96%,var(--text-primary))`로 보정했다. 밝은 Finish는 조금 진하게, 어두운 Finish는 조금 밝게 하여 기존 톤을 유지한다. `patch.css`·전용 delta의 CSS suffix/after SHA·source fixture pin 및 전용 시험의 해당 색 기대식만 함께 갱신했다. 기존 하위 fixture와 나머지 단언은 보존한다.

**6 Finish×4계절×390/1440 =48건과 after 화면4건, 총52 clip의 모든 텍스트 제외 픽셀**을 계산했다. 원래 측정값도 정확히 재현했고, 4.5 기준을 유지하여 최저 **4.497646→4.658863**, 불리한 정수 RGB에서도 **4.632650**, 대비 저하0건이다. 기존 FAIL1 JSON·PNG는 그대로 두고 계산 입력을 별도 복사했다. [계산 근거/Finish별 최저값](last-contrast/CONTRAST.md) · [원값·픽셀·SHA](last-contrast/contrast-calculation.json). 실제 새 브라우저 측정은 아직 미검증이다.

검증: 전용 디자인 **6/6**, 대비 **4/4**, 변경/신규 검사 JS 문법 통과. 전체 회귀 **80파일77성공·기존실패3 / 852 PASS·9 FAIL·skip2**, office 비Git **46파일610 PASS·0 FAIL·skip1**, THAW·294·release 층 통과. 기존 실패는 nav-groups speaker coverage, qa-210 syncThemeCollections 미정의, qa-report-fixes renderChibiNote 미정의이며 이전 결과와 같다. [보존 감사](last-contrast/scope-audit.json): 하위fixture111·다른시험306·기존브라우저증거274 바이트 불변, 범위 밖 변경/누락0. 합성JSON4개 원문 복원·새4개 증거 이관. Git·Edge·버전/cache 증가·main 병합·배포 없음. 저장·Cloud·schema·DOM·event·renderer 변경 없음. Notion 기록 추가는 자동 승인 검토의 `approval policy is never` 거절로 미반영, [전용 인수인계](../../docs/development-history/handoffs/2026-11-14-design-polish-1-last-contrast.md)에 갱신 대기를 보존한다.

서윤 브라우저 재실행 명령(이 작업에서는 실행하지 않음):

```powershell
$polishPw = 'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
$polishEdge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node scripts/hani-design-polish-1.browser.mjs $polishPw $polishEdge
```

결과는 `browser-fixed/browser-results.json`의 failures와 대비 clip/ratio를 함께 확인한다. 계산 재현은 `node artifacts/design-polish-1/last-contrast/calculate.mjs`, Node 회귀는 기존 `powershell -NoProfile -File artifacts/design-polish-1/run-tests.ps1`(기존 실패3건도 집계해 exit1 반환)이다. 원격 최신성·실제 Git 검사·Preview·Candidate/HINA·Production read-back은 서윤/배포 담당 인계다.
