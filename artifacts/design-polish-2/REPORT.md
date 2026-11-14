# 디자인 다듬기 2차 · 도연 / Codex

2026-11-14 KST · `hani/design-polish-2` · 전달/로컬 기준 `7a91982de08a54452f6b9057f906d651f63a65ca` (2.9.296 + #510).
Git 명령·원격 조회·Edge·버전/cache 증가·main 병합·배포 없음. **운영 변경은 `hani-design-system.css` 끝 2차 블록 하나**이며 기존 CSS prefix와 runtime JS/HTML은 원문 보존했습니다. 한글 작업 지시 전체 UTF-8 정상 확인.

| 항목 | 바꾼 것 / 실제 선택자 |
|---|---|
| 도우미 여백 | 모바일 10화면 `body[data-view] #haniHelperBot`의 기존 `--helper-safe-bottom` 확장. certificate/tasks/investmentCommittee/investmentIntake/settings/diet 190px, ledger 150px, game 160px, travel/exercise 130px. 화면 끝 280px 여백은 helper 높이까지 포함. 사진 기준 초기값이며 실제 브라우저 확정 대기. 저장 위치·드래그·이벤트 보존. |
| 대비 | travel `.module-kpi small/.sub`는 밝은 카드와 진한 글자 쌍. aiWork `.member-role/.member-link/.member-copy p/.ai-team-profile-role`, board `.board-tab`, investment `.tab:not(.active)/.investment-live small/.broker-stats .label`, study `.study-main-empty`, newsroom `td.is-down`, ledger `.jispi-c` 수치, diary `[data-diary-view]`, diet/certificate `.date-mode-toggle` 및 native 날짜 입력의 밝은 색상 체계. 하락 파랑·지수 청록 의미 유지. |
| 글자·조작부 | dev `.hani-history-meta/.hani-history-row code` 13px, ‘변경 내용’ summary 14px·44px; aiWork 설명 14px; game `.sports-league/.sports-home-identity small/.sports-home-recent small/.sports-home-foot>span/.sports-result>div:first-child>span` 12px, 날짜 행 줄바꿈. drive `.gdrive-fulltext`와 aura `.launch-greeting-setting` 체크박스 18px, label 터치 높이 44px. |
| 모바일 배너 | `.view>.ds-main-character-banner` 168px, copy 166px, 그림 `contain`. 기존 inline 모바일 그림 설정보다 우선하도록 그림 토큰만 보정. aura showroom의 1차 132px 삽화는 원문 그대로. |
| 한국어 줄바꿈 | wishlist `.empty`, ilbo `h1/h2/h3`, milestones `.ms-tier small`에 keep-all. 모바일 등급 설명 12px. 문구 수정 없음. |
| 모바일 배치 | exercise `#exerciseStats>.stat:nth-child(5)`는 두 열 전체, board `.board-tabs`는 균등 3열×2행. 기존 버튼·DOM·필터 경로 보존. |

시험 층은 `design2 → main296 → 296/design1/295/chibi2/294/THAW 이하` 순서입니다. 새 `source + fixture + preload`를 추가하고 기존 source 3개의 input import 및 명시적 입력 projection/중앙 dispatcher만 연결했습니다. 기존 시험 단언·숫자·hash와 기존 fixture는 수정하지 않았습니다.

## 검증

- 신규 `hani-design-polish-2.test.mjs` 6/6 PASS: 독립 main296 객체와 완전 suffix 역변환, 변조 거부, runtime/fixture 보존, 실제 helper viewport/clamp, 색상 쌍 4.5 이상, sync/callback/promise/ESM reader 및 기존 closure 172→172→172→171→168→164.
- 최초 지정 비Git 회귀 **87파일 중 84성공, 887 PASS + 단일 script 성공 5, skip 2**. office 비Git **46파일 610 PASS/0FAIL**. 나머지 3파일은 아래와 같이 분리했으며 전체 PASS로 표시하지 않습니다. `test-summary.json` / `test-results.json`에 명령·로그 기록.
- 최종 CSS 보정 후 CSS를 읽는 관련 시험 **19파일 중 18성공, 102 PASS + 단일 script 성공 4, skip 1**. 남은 1파일은 동일한 main296 fixture 오류. `affected-results.json`. 디자인1 6/6·296 5/5·version layers도 재확인. JS syntax **10/10**, PowerShell 실행기 정상 파싱/실행, CSS 구분자 균형 확인. 실제 CSSOM 파싱은 Edge 대기.
- `hani-annual-report-ui-test.mjs`, `hani-design-system-phase1-qa.mjs`: Playwright 의존성 부재로 브라우저 시작 전 차단. 이후 실행 목록은 `BROWSER_DELEGATED`로 분리. Edge 실행 없음.
- `hani-exam-popup-214.test.mjs`: `renderChibiNote is not defined`. CSS를 정확한 main296으로 되돌린 별도 실행에서도 exit 1 재현했고 해당 시험·study·remote owner 모두 main296 원문 일치. 기존 fixture를 임의 수정하지 않음. `exam-popup-main296-reproduction.log`.
- 보존 감사: 루트 runtime 71파일 및 raw closure 172파일 중 변경은 CSS 하나뿐, closure 누락 0. 기존 중첩 fixture **114/114** 동일, 원본 QA JSON **172/172** 동일. 시험 생성 JSON은 이 작업의 `generated/`로 이관하고 기존 4개는 원문 복원. `preservation-audit.json`.
- 최초 Node 내부 child spawn은 EPERM 차단(시험 자체 미실행). PowerShell 직접 Node 실행으로 위 회귀를 수행했고 별도 Git/브라우저 child process 차단기를 사용. `node-child-spawn-blocked.json`은 초기 도구 차단 근거로만 보존.
- 브라우저 `--setup-only` PASS: 독립 before/실제 after CSS HTTP 응답, 23화면×전후×1440/390×2 Finish의 기본 184장 + helper 중간/끝 스크롤 80장, 6 Finish×4계절×2폭×10대상 480개 대비 조합 준비. **Edge 실행·PNG 생성·실제 CSSOM·화면·픽셀 대비·겹침 0·가로 넘침 0은 아직 미검증**입니다.
- Node에서 확인한 10개 명시 색상 쌍은 4.5 이상입니다. 이를 24개 테마 조합의 실제 픽셀 PASS로 대체하지 않습니다. 브라우저는 1차 `sampleBackgroundPixels`를 재사용해 글자 영역을 제외한 최저 대비 픽셀을 측정하고, 누락/숨김 요소도 실패로 기록합니다. 버튼/셀 바깥 여백 및 둥근 모서리 바깥은 실제 글자 바탕이 아니므로 가까운 불투명 surface 안으로 clip을 제한하며 기준 4.5는 유지합니다.
- CSS 적용 전후 저장 write 0, protected key/저장 위치/state 보존은 브라우저 실행기에 검사 경계를 넣었습니다. 기존 navigation preference 쓰기는 별도 기록하며 정상 Local을 지우지 않습니다.

## 보류·남은 위험

- **도우미 임의 위치/스크롤의 완전 무겹침은 확정하지 않았습니다.** 기존 canonical owner는 저장된 위치가 있으면 일반 스크롤 조작부 장애물 탐색을 생략합니다(`hani-ui-v02992.js` place). CSS token은 viewport 하단 제한이므로 모든 스크롤 지점·임의 저장 좌표에 대해 충돌 회피를 보장하지 못합니다. 실제 top/middle/bottom에서 버튼과 카드 겹침을 모두 실패로 잡도록 준비했습니다. Edge 근거로 여백을 확정하고, CSS 범위를 넘어서는 경우 별도 owner 변경 작업이 필요합니다.
- ledger JISPI 축하/장세 배지 판단은 `ledgerJispiStatus` 및 기존 데이터 경로로 별도 조사할 사안입니다. 계산/조건/문구를 바꾸지 않았습니다.
- 기존 중첩 ‘변경 내용’ details와 화면 순서는 유지했습니다. Git 필요 27개는 목록만, 사용자 지정 원래 실패 목록은 수정하지 않았습니다. `hani-theme-contrast*` 파일은 이 기준선에 없으며 대비 근거는 1차 contrast 및 새 시험으로 연결했습니다.
- Preview/Candidate/HINA/아린/실기기/Production read-back 미실행. 완료/배포 판정 아님. 서버 Edge Function·Cloud 설정 변경 및 동반 배포 순서 없음.

## 서윤 실행

```powershell
node scripts/hani-design-polish-2.test.mjs
node scripts/hani-design-polish-2-regression.mjs
# Node child spawn 제한이 있으면 직접 PowerShell 실행:
node scripts/hani-design-polish-2-regression.mjs --prepare-powershell
& artifacts/design-polish-2/run-regression.ps1
node scripts/hani-design-polish-2.browser.mjs --setup-only
node scripts/hani-design-polish-2.browser.mjs '<playwright/index.mjs>' '<msedge.exe>'
```

실제 Edge 결과는 `artifacts/design-polish-2/browser/`에 PNG와 `browser-results.json`을 저장합니다. 별도 Git 시험 명령은 `test-inventory.json`의 `GIT_DELEGATED` 27개를 사용하세요. 자동 실행과 별개로 서윤이 branch·최신 main을 재확인하고 feature branch push/탑승을 처리합니다. 대표님 승인 근거는 `../design2-task.md`의 표시 개선 승인 한정이며 merge/배포 승인으로 확대하지 않습니다.

Notion 착수 카드 생성/read-back 완료: https://app.notion.com/p/418c5275707481ac8544ee401322e1b4 . 최종 `update_properties`는 ‘승인 필요 / approval policy never’로 자동 거절되어 **최종 결과 미반영**. 재요청 없이 `notion-update-pending.md`와 작업 인수인계에 갱신 대기 보존.

임시 원본 검증 복사본 `input-evidence/` 정리 명령도 정책상 거절되어 172개 JSON 복사본을 보존했습니다. 원본들은 변경되지 않았으며 이 복사본은 runtime/fixture가 아닙니다. 서윤 Git 준비 시 commit 대상에서 제외할 검증 부산물입니다.

## 브라우저 실패 정리

2026-11-14 KST · design2b · `../design2b-task.md` 전체 UTF-8 정상 확인. 최초 `browser/browser-results.json`의 FAIL 194건과 PNG는 그대로 보존했습니다. 착수 폴더에 일부 CSS 보정과 첫 화면/report-only 정책이 이미 있어 보존하고, 실제 CSS에 맞춰 2차 delta/source pin을 다시 고정했습니다.

- **대비 원인·선택자:** `.investment-live small`과 `.ai-team-profile-role`은 텍스트가 면을 채워 측정할 빈 배경이 없었습니다. 밝은 면/진한 글자와 padding 6px 8px을 함께 고정했습니다. `.board-tab[data-board-filter="WORK"]`는 투명 버튼 아래의 다른 색과 테두리가 측정됐으므로 버튼 자체를 불투명하게 유지하고 tab bar도 함께 고정했습니다(밝은 면 `#fff`/WORK `#275b96`, 어두운 면 `#202633`/WORK `#a8ceff`). `.jispi-c .ledger-jispi-head span`은 주변 JISPI 면의 색이 섞여 헤더에 `#202633`/`#9ae0d9` 및 여백을 고정했습니다. `.date-mode-toggle`은 PNG에서 도우미 그림이 버튼을 덮고 있었으며 `#fff`/`#28374c`와 44px 조작부를 유지하고 도우미 위치를 옮겼습니다. 기존 선택자 모두 실제 DOM에 존재하므로 대상을 다른 요소로 바꾸지 않았습니다. 측정기·clip 방식·4.5 기준은 변경하지 않았습니다.
- **dev·game:** 실제 dev는 중첩된 `.hani-history-row .activity-trend-info>summary`입니다. 두 summary 모두 14px/44px `!important`, meta/code는 13px 규칙을 유지했습니다. game의 실제 `.sports-view-tabs`는 한 줄 가로 스크롤이 원인이므로 줄바꿈과 폭 제한, 버튼의 유연한 너비·44px 높이를 적용했습니다. DOM·기존 이벤트는 그대로입니다.
- **바뀐 시험 조건:** 모바일 10화면은 저장 위치 없음·`scrollY===0`·도우미 표시/viewport 안·입력/버튼 겹침 0을 gate로 확인합니다. 첫 화면의 일반 카드 겹침과 중간/끝 스크롤의 입력·버튼·카드 겹침은 JSON `observations`의 `report-only`로 남깁니다. 스크롤 중 도우미 표시·viewport 안·가로 넘침 검사는 유지했습니다. 첫 화면 여백은 390×844 배너 근거로 9화면 `--helper-safe-bottom:580px`, game은 배너가 30px 위에 있어 `620px`입니다. 저장 좌표를 바꾸거나 listener/timer를 추가하지 않았습니다.
- **Node 검증:** 신규 시험 **8/8 PASS**, 기존 6개 시험 보존 및 새 큰 여백의 canonical clamp/키보드 viewport·첫 화면/report-only 정책 검증 추가. 기존 190/150/160/130px clamp 회귀도 유지했습니다. JS syntax 4/4, browser `--setup-only` PASS(23화면/480대비 조합, 브라우저 실행 없음). 비Git 회귀는 **85파일 중 84성공, 889 PASS + 단독 script 성공 5, skip 2**. 이 안의 office **46파일 610 PASS/0FAIL**. 유일한 비성공 `hani-exam-popup-214.test.mjs`는 이전 main296 재현과 같은 `renderChibiNote is not defined` 시작 오류이며 이번에도 시험·runtime owner가 main296 원문과 같음을 확인했습니다. 기존 fixture/단언을 바꾸지 않았습니다. Git27·browser-only2는 담당 분리, 지정 기존 실패13은 실행기 정책대로 제외했습니다. 명령·로그는 `design2b/test-results.json`, `design2b/test-summary.json`, `test-logs/`에 있습니다.
- **보존·미검증:** 운영 71파일 중 CSS만 변경, 2차 블록 앞 원문 보존, 기존 중첩 fixture 114개 및 runtime owner·버전·저장 경로 보존 검증 PASS. 회귀가 생성한 JSON7은 `generated/`에 보존하고 기존4는 원문 복원했으며 원래 QA JSON172/172 동일합니다. 최초 browser JSON hash도 그대로입니다. 실제 Edge·새 PNG·24개 Finish×계절 조합 픽셀 대비·첫 화면 무겹침·game 가로 넘침 해소는 **아직 미검증**이며 FAIL 194건 해소를 PASS로 선언하지 않습니다. `design2b/preservation-audit.json`과 작업 인수인계에 근거를 남겼습니다. Git·버전 증가·main 병합·배포 없음.

서윤 재실행 명령(새 출력 폴더로 최초 실패 증거 보존):

```powershell
node scripts/hani-design-polish-2.test.mjs
node scripts/hani-design-polish-2-regression.mjs --prepare-powershell
& artifacts/design-polish-2/run-regression.ps1
node scripts/hani-design-polish-2.browser.mjs --setup-only
node scripts/hani-design-polish-2.browser.mjs '<playwright/index.mjs>' '<msedge.exe>' --output-dir=artifacts/design-polish-2/browser-design2b
```

Notion HANI-92 착수 기록 추가는 자동 승인 검토에서 `MCP tool call requires approval, but approval policy is never`로 거절됐습니다. 최종 반영도 미확인/미반영이며 `design2b/notion-update-pending.md`와 인수인계에 갱신할 내용을 보존합니다.

## design2c

2026-11-14 KST · 도연 / Codex · 전달 `hani/design-polish-2` / base `7a91982` · 작업 지시 UTF-8 정상 확인.

- **원인:** 실제 `#aiWork`는 `section.view`, `showView`가 `active`를 붙이며 `hani-style-01.css:27`의 `fadeUp .28s`(opacity 0→1·세로 이동)가 시작됩니다. 모션 감소 예외가 없고 시험은 `reducedMotion:'reduce'`에서 전환 100ms 후 측정하므로, 마지막 실패의 조상 `SECTION` 효과와 일치합니다. 스크린샷의 `animations:'disabled'`는 effects 검사 뒤에 적용돼 이 실패를 예방하지 못합니다. locator는 이미 첫 `.member-role` 한 개입니다. `textRects` 앞 4개는 BUTTON의 둥근 모서리 제외 영역이고, 나머지는 주변 이름·설명도 배경 픽셀에서 제외하려는 기존 수집 결과입니다. 다른 카드 전체를 측정 대상으로 고른 버그가 아닙니다.
- **수정:** CSS 끝 2차 블록에 `@media(prefers-reduced-motion:reduce){#app #aiWork.view.active{animation:none}}` 한 규칙만 추가했습니다. 밝은/어두운 글자·면 쌍은 보존하고 delta/source pin을 새 CSS의 exact inverse로 갱신했습니다. 측정 대상·측정기·clip·4.5·기존 단언·runtime JS/DOM/이벤트는 그대로입니다.
- **검증:** 신규 Node **8/8**, syntax **4/4**, `--setup-only` **PASS**(23화면·480대비 조합·브라우저 실행 없음). 비Git 회귀 **85파일 중 84성공·889 PASS + script5·skip2**, 사무실 **46파일·610 PASS**. 이전 design2b와 시험 목록·exit·pass·fail·skip 전부 동일하여 **새 회귀 0**입니다. 남은 1파일은 기존 `hani-exam-popup-214.test.mjs`의 `renderChibiNote is not defined` fixture 오류입니다. 소스 771개 비교에서 변경은 CSS·delta·source pin 3파일뿐이며, 독립 main296 exact inverse·기존 fixture114·측정기/단언·브라우저 원본 JSON·QA JSON172 보존을 확인했습니다. [최종 감사](design2c/preservation-audit.json)·[회귀 결과](design2c/test-results.json)·[로그](design2c/test-logs/)에 근거가 있습니다. 기존 design2b의 역할 대비 48개 중 47개는 최저 **9.468062622526778:1**, 나머지 한 개는 위 애니메이션 효과로 측정 중단입니다. 이를 새 결과의 PASS로 재사용하지 않습니다. 실제 새 CSSOM·PNG·24 Finish×계절 픽셀 대비·마지막 실패 해소는 **서윤 Edge 재실행 대기**입니다.
- **경계:** Git·Edge·버전/cache 증가·저장/Cloud 변경·main 병합·배포 없음. 최초 FAIL194와 design2b FAIL1 JSON·PNG를 보존합니다. Notion 착수 추가는 자동 승인 검토에서 거절됐습니다(`approval policy is never`). 최종 갱신 대기는 [인수인계](../../docs/development-history/handoffs/2026-11-14-design-polish-2-last-browser.md)에 보존합니다.

서윤 재실행 명령(출력 `browser-design2c`):

```powershell
node scripts/hani-design-polish-2.test.mjs
node scripts/hani-design-polish-2-regression.mjs --prepare-powershell
& artifacts/design-polish-2/run-regression.ps1
node scripts/hani-design-polish-2.browser.mjs --setup-only
node scripts/hani-design-polish-2.browser.mjs '<playwright/index.mjs>' '<msedge.exe>' --output-dir=artifacts/design-polish-2/browser-design2c
```
