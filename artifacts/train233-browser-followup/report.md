# train233 browser 실패 후속 결과 · 2026-10-24 KST

담당 Codex, 단일 Agent. `hani/train233-verify` / t233. 시작·현재 HEAD `5a665a31637004a5feef3cb83b3711cab8a6449b`, 비교 기준 `2cbbe6ed0c14954008208f0db2316b5f09228c2a`. **최소 패치는 작성했으나 수정 후 browser PASS는 미검증이며 Release 승인 근거가 아니다.**

origin/main 로컬 참조는 `a1e97d7`. 원격 조회는 GitHub 연결 실패로 최신성 미확인. `2cbbe6e` 이후 seed main 병합이 이미 후보에 포함되어 있음을 Git log에서 확인했다. 새 merge/rebase 없음. 로컬 index 캐시 v2.9.232 / 마지막 script `hani-launch-greeting.js`; Production 확인은 수행하지 않았다.

## 실패 10종 분류

A = 승인 변경과 충돌하는 구 테스트 기대값. B = 실제 UI 결함. C = flaky/환경. 기존 main PASS는 대표님 제공 비교 결과이며 이번 환경에서 독립 재실행하지 못했다.

| # | 검사 | 분류와 근거 | 수정 / 남은 검증 |
|---|---|---|---|
| 1 | banners-203-ui | **A**. 로그의 desktop 690px 장면은 hero-crop-fix의 높이230px × 원본3:1과 일치. 전체 슬롯 폭 채움 기대가 승인 변경과 충돌. | desktop은 `min(슬롯 폭, 높이×원본비율)`, mobile은 슬롯 전체 폭을 검사. 높이·우측 정렬·mask·decode·넘침 검사 유지. 실제 Edge 재검증 필요. |
| 2 | brand-heroes-218.browser | **A**. HANI-77 승인으로 공통 회사 소개 배너와 overview의 제목·CTA·Demo Day hero가 함께 존재. 실제 로그도 정확히 이 2개. | overview만 2개, 나머지 탭은 1개. 직접 자식 공통 배너 1개·overview hero 1개·고정 Demo Day src 및 다른 탭에서 숨김을 명시 검사. |
| 3 | hero-illustrations-218.browser | **A**. Milestones 추가로 source nav가 35→36개. 이후 HANI-77의 overview hero 수 기대도 충돌. | 36개 + milestones 정확히1개 + 중복 nav0. overview의 공통 배너·복원 사진 decode를 각각 검사. |
| 4 | navlogin-ui | **A**. `.ogh-cta` 0개 기대는 승인된 제목·CTA 복원 이전 규칙. | overview CTA 정확히1개 및 공통 배너1개. 기존 로그인·Cloud 대기·keyboard·focus·logout 보존 검사 유지. |
| 5 | remote-card-224 | **B**. 390px light/dark 8조건 내부 스크롤 증가. 기존 reading baseline 639/639px에 비해 후보 일부는 panel628px/scroll642px. | 아래 Remote CSS 수정. 높이·픽셀·contrast·no-scroll assertion을 완화하지 않음. Edge 재검증 필요. |
| 6 | remote-media-219 | **B**. 기존 로그 `no added internal scroll at 390/reading`, #5와 같은 header panel의 `70dvh` 제한. | 같은 owner CSS 수정. action·pixel·scroll 기대값 유지. Edge 재검증 필요. |
| 7 | pwa-213 | **B**. 원래 run-status의 home viewWidth380/viewScroll382, 넘친 요소는 width40의 `.date-mode-toggle`. QA 규칙의 grid track38px와 기존 최소 tap40px 충돌. | QA date grid의 버튼 칸40px, 최소 너비140+6+40=186px로 일치. 기존 overflow 허용치 유지. 이후 matrix 항목은 미검증. |
| 8 | settings-225 | **A**. browser의 before route가 raw 후보 index에 225 exact hunk를 직접 역적용. QA 통합으로 겹친 hunk 때문에 실패. | static guard와 동일하게 기존 exact 승인 정규화·hero 역적용 후 settings 역적용. 고정 HEAD에서 원래 오류 재현→수정 변환 성공, resetBtn 변조 검출을 정적 실행. 전체 검사는 별도로 Git subprocess EPERM 차단. |
| 9 | market-browser-smoke | **A**, flaky 근거 없음. timeout 줄76은 390px에서 Remote 버튼이 옛 market toolbar에 오기를 기다림. 현재 owner는 <=768px에서 header `.top-actions` 우선 배치. | header persistent 버튼1개를 기다림. 실제 click/aria/Escape/chart resize/color 검사 유지. Edge 재검증 필요. |
| 10 | qa-1st-ui | **B**. 이 HEAD의 실제 로그는 certificateName과 Remote trigger 겹침. header sticky/고정높이/nowrap `!important`가 QA의 일반 규칙보다 우선함. 대표님 제공 main 결과에는 asset amount overflow도 존재하므로 금액 문제를 신규 회귀로 단정하지 않음. | header 정상 흐름·자동 높이·wrap·hidden transform 충돌 정리. 기존 <=640px portfolio summary의 2개 좁은 칸을 1열로 바꿔 nowrap 금액·상태 전체 공간 확보. 금액 문구/숫자/formatter 및 금액 assertion은 변경하지 않음. 수정 후 실제 글자 폭·contrast·다른 항목은 미검증. |

**C 환경 차단**: 이 세션 실제 Edge launch 1회 `spawn EPERM`. 이후 browser 재시도·우회·다른 worktree 수정·프로세스 일괄 종료 없음. flaky로 확정한 테스트는 0개다.

## 최소 diff와 소유 경로

- `hani-context-remote-v1.js`의 기존 `placeMobileTrigger()`가 header에 trigger/panel을 재배치한다. JS를 수정하거나 event/renderer layer를 추가하지 않았다.
- `hani-context-remote.css`: 기존 QA mobile block 3줄만 수정. 기존 `ui26-top`의 sticky·48px 고정 높이·nowrap·scroll hidden class보다 우선하도록 header를 relative/자동높이/wrap으로 정리. panel 최대높이 제거 및 page 흐름으로 내용 표시. panel의 그림·action·순서는 유지한다.
- `hani-design-system.css`: 기존 QA date block의 3줄 수치만 수정. 그림 crop 승인 규칙은 유지한다.
- `hani-portfolio-preview.css`: 기존 <=640px summary grid 1줄 수정. 금액이 좁은 card에서 clip되는 경로를 넓힌다. 모바일에서 현금/미평가 카드가 세로로 배치되므로 화면 길이는 늘어난다.
- browser 테스트 6개 수정: 위 #1/2/3/4/8/9. #5/6/7/10의 기존 assertion은 그대로다.
- 총 tracked diff: 9개 파일, +33/-16줄. 코드 외 인수인계·이 보고서·감사/실행 증거를 새 경로에 보존.

## 이번 실행 결과

| 명령 | 실제 결과 |
|---|---|
| `node scripts/hani-qa-1st.test.cjs` | PASS 10 |
| `node scripts/hani-navlogin.test.mjs` | PASS 45 cases |
| `node scripts/hani-banners-203.test.mjs` | PASS |
| `node scripts/hani-milestones-v1.test.mjs` | PASS Node14, browser NOT RUN |
| `node scripts/hani-remote-media-219.test.mjs --node-only` | PASS 실제 updateBanner·persistent slots x25·write0·pixel sampler 부정 검사. browser NOT RUN |
| `node scripts/hani-history-226.test.mjs --unit-only` | PASS 실제 연혁 모델·renderer·persistent slot·event·write0 |
| 수정 browser 검사 6개 `node --check` | 모두 PASS |
| `node scripts/hani-hero-restore.test.mjs` | 3 PASS / 1 FAIL: 새 date CSS가 기존 exact fragment와 다름. runtime 의미/geometry PASS로 대체하지 않음. |
| `node scripts/hani-brand-heroes-218.test.mjs` | 1 PASS / 2 차단: `spawnSync git EPERM` |
| `node scripts/hani-settings-225.test.mjs --static` | 차단: `spawnSync git EPERM`. 위 고정 HEAD route 정적 감사와 구분. |
| `node artifacts/train233-browser-followup/audit.mjs` | PASS: untouched 2,781줄 원문/EOL, 수정 파일 hash, main/index 전체 원문 보존, 고정 HEAD settings route 오류 재현/보정/변조 검출 |
| `git diff --check` | PASS |
| `git diff --exit-code 5a665a3 -- index.html hani-main.js hani-context-remote-v1.js hani-organization-hub.js hani-asset-market-view.js scripts/fixtures scripts/hani-reviewed-release-baseline.mjs scripts/hani-reviewed-release-baseline.test.mjs` | rc0, 모두 변경 없음 |

원시 실행 로그와 `audit.json`, `patch.diff`, `edge-availability.json`은 이 보고서와 같은 폴더에 있다. 원래 `artifacts/train233-browser/` 및 기존 화면·결과를 덮어쓰지 않았다. `head.tar`/`head/`는 감사에 사용한 고정 HEAD의 선택 파일 export이며 Release package가 아니다.

보호키·저장 로직·Cloud/schema·런타임 JS·표시 버전·`?v=`·내부 baseline 변경0. exact fixture를 새 CSS에 맞춰 등록하거나 완화하지 않았다. **따라서 보존 gate 전체 PASS 및 새 candidate 동결을 선언하지 않는다.**

## 미검증·다음 행동

Edge 허용 환경의 배포 담당이 이 diff를 검토한 뒤, 수정된 browser 검사와 기존 remote-card/media/context-remote UI·qa-1st UI·PWA·org-demoday/check-organization-hub를 순차 재실행한다. PC 1440/390 스크린샷을 새로 확보한다. 특히 더 긴 모바일 header·panel의 페이지 스크롤, 펼친 Remote의 마지막 action/닫기/Escape, 전체 금액 표시, 회사 소개 CTA 및 overview 전용 hero를 확인한다. hero-crop-fix desktop 원본 비율과 HANI-77 제목·CTA를 제거해 테스트를 맞추지 않는다.

이번 추가 CSS는 기존 frozen exact fragment와 다르다. Release 담당이 새 diff의 승인·candidate identity를 정리하고 기존 보존 gate를 통과해야 한다. 이전 candidate PASS를 재사용하지 않는다. Feature/Candidate build·One-Pass·HINA·Production read-back은 이번 작업에서 수행하지 않았다.

`git -c core.autocrlf=false add -- <수정 9파일 및 인수인계>` 1회는 `.git/worktrees/t233/index.lock: Permission denied`로 실패했다. commit 미실행, 권한 우회·재시도 없음. HEAD는 `5a665a3` 유지. push/PR/main merge/배포/Notion 갱신은 요청 범위에 따라 수행하지 않았다. 다른 worktree의 파일·branch도 수정하지 않았다.
