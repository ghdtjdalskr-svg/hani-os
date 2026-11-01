# Office labels · QA-3 / QA-18 / QA-19

## 작업 식별

- 갱신 시각(KST): 2026-11-01, Codex
- 담당 도구 / 검토 담당: Codex / 별도 검토 담당(사용자 지정, 브라우저 검증 인계)
- 상태: QA-b5b 브라우저 지적 보완 구현 / 최신 targeted 52 PASS·2 FAIL(Git EPERM) / 미커밋 검토 대기 / 수정 후 실제 브라우저 미검증. 아래 QA-b5b 최종 기록 참조.
- 저장소 / branch / worktree: PROJECT HANI / `hani/office-labels-qa` / `qa-b5`
- base SHA: `024f3a20f27350105718c1896e38693cb82bc4cd` (로컬 branch 및 origin/main ref 일치). 원격 최신성은 Git subprocess 차단으로 미확인.
- 운영 기준: 사용자 지정 2.9.248. 버전·캐시 태그·HANI_DISPLAY_VERSION 유지.
- 목표: 지도 활동 라벨의 짧은 문구·상태색, 팀/직급 이름표, HANI GROUP alt. 원문·말풍선·일정 결과 보존.
- 수정 범위: `hani-office-live.js` 라벨 함수와 persistent 이름표 생성/alt, `hani-office-live.css` 라벨 규칙, `hani-organization-hub.js` 기존 팀 색의 읽기 전용 공개 필드, 아래 표시 테스트·고정 소스 delta fixture 및 신규 `scripts/hani-office-labels-qa.test.mjs`.
- 승인 근거: 이번 사용자 Task의 owner approved 1~4. commit/push/merge/버전 변경 금지. 일정·상담·소파 문구·activity sentence·data/hani-building 수정 금지.

## 결과와 증거

- Scoped discovery: CODEMAP living-office owner 확인. 최신 라벨 symbol과 test anchor는 CODEMAP에 없어 사용자 지정 symbol로 scoped fallback(CODEMAP_MISS). 직전 상단 라벨 인수인계도 확인. labels/fitStatusLabels/단일 status owner/기존 delegated click→openBubble→showBubble→bubbleText 경로 확인.
- QA-18: 기존 `labels.short`의 authored action을 데스크톱에도 사용. 모르는 문장은 상태별 완전한 단어 fallback을 선택하고 기존 used Set으로 중복을 피함. 보고 주제도 단어를 자르지 않고, 부적절한 문자는 회장보고로 fallback. 지도는 이모지 1개+짧은 문구, 원문은 dataset.full/title/aria/명단/기존 말풍선에 보존. CSS의 너비 제한·ellipsis 제거.
- QA-19: `actor.dataset.status`가 근무 흰색/휴식·play 노랑/회의 보라/이동 옅은 회색/야근 옅은 보라 토큰을 소유. 기존 mood/called의 별도 라벨 색 우선순위 제거. 폰 compact activity에도 동일 상태색 적용. 실제 activityStatus 함수와 CSS 색 조합으로 모든 상태 텍스트 AA >=4.5 확인.
- QA-3: 기존 roster member에서 team/rank를 읽음. roster의 기존 팀 color/tint 필드만 읽기 전용 export에 공개하여 색 복제도 피함. 데스크톱 이름표는 팀색·직급·활동 이모지, 폰은 직급을 먼저 숨기며 pill/name/dot 유지. 직급 span은 actor 생성 때 1회 생성하고 재사용. 회장님 표기는 기존 그대로, 추가 별칭·중복 직급 없음.
- 지도 배경 alt: `<층 이름> · HANI GROUP`.
- 검증 환경: Windows PowerShell / Node v24.20.0 / 지정 worktree. 브라우저 및 Git subprocess 차단. 테스트 내부 Git 접근 실패는 아래에 구분.
- source 바이트 비교: createScheduler, placeStatusLabels, 기존 click/말풍선 경로, 프레임 루프 전부 원문 동일. fitStatusLabels geometry read site 전후 5개 동일, steady frame 30회 layout read 0. 기존 event 등록 경로 추가 없음.
- `index.html` 및 `data/hani-building/*` SHA 불변. 바뀐 8개 기존 코드/테스트 파일의 보존된 행 EOL 모두 동일. runtime 원본은 LF, 기존 테스트는 원래 CRLF 유지. 검사 증거: [safety.json](../../../artifacts/office-labels-qa/safety.json).
- runtime closure만 정적으로 계산: 128 → 128, 경로 목록 동일, missing 0. Build/Candidate/One-Pass/배포 작업 아님. [closure.json](../../../artifacts/office-labels-qa/closure.json).
- 데이터·저장소·Cloud·schema: 표시 전용, 변경 없음.
- PR / Preview / 배포: 없음. main 병합·Pages·실제 운영 JS·운영 기능 read-back 미실행.
- Notion: 현황판 및 Markdown 규격 읽기 성공. 착수 insert_content는 `MCP tool call requires approval, but approval policy is never`로 거절. 갱신 대기. 저장/read-back 완료 아님.

## 테스트 변경과 이유

| 파일 | 변경 이유와 보존한 검사 |
| --- | --- |
| `scripts/hani-office-labels-qa.test.mjs` 신규 | 실제 labels.short, activityStatus/label, 실제 persistent renderer 실행. 두 action catalog·places 전체 문자열과 scheduler 한국어 literal 2,979개, 평일/주말·회장님 재실/부재 생성 문장 44,891건 검사. 길이 <=8(현재 authored phrase는 <=6), ellipsis 없음, unknown fallback, used 대안, 상태색 AA, canonical 팀/직급, 이모지 1개, 전체 원문 보존, 기존 클릭/키보드 말풍선·write 0·프레임 layout read 0. 6개 신규 검사+import되는 기존 engine 6개 = 12개. |
| `scripts/hani-office-crowded-labels.test.mjs` | 지도 textContent=원문 기대만 새 표시 형태로 갱신. 원문 aria 보존과 compact/지도 표시 일치로 검사. 모든 충돌·얼굴·mascot·거리·폰 모드·기존 슬롯 검사는 그대로. |
| `scripts/hani-office-obr18.test.mjs` | 같은 원문/짧은 표시 구분, 이모지 뒤 문구의 기존 <=6 검사를 유지. 스케줄/좌표/비율/고정 기대값 미변경. |
| `scripts/hani-office-obr18-browser-geometry.mjs` | expected에 상태별 이모지 1개를 포함. 문구의 기존 2~6 길이와 금지어 검사 유지, 총 길이는 추가된 이모지+공백 길이만 허용. 모든 실제 geometry/AA 이외 기존 검사 유지. 실제 브라우저 실행 증거는 아님. |
| `scripts/hani-office-obr21.test.mjs`, `scripts/hani-office-obr8.test.mjs` | 전체 소스 고정 검사가 승인된 표시 변경만 허용하도록 정확한 10개 행 diff를 역적용하고 원문 SHA를 검사. OBR-21의 기존 motion delta/소스 guard 및 mutation 거절 검사 유지. **기존 formal/outing/snapshot oracle·고정 SHA·숫자 기대값은 변경 없음.** |
| `scripts/fixtures/office-labels-qa-source-delta.json` 신규 | 위 10개 표시 변경의 before/after 정확한 행. fixture 자체 SHA를 두 검사에서 고정, 역적용 결과 전체 JS SHA도 작업 전 `5254d8be…`로 고정. 허용하지 않은 일정/원문 수정은 거절. runtime 파일 아님. |

## 실행 명령과 최종 결과

- `node --check <변경한 JS/MJS>`: **8/8 PASS, FAIL 0**. 목록과 exit code: [syntax.json](../../../artifacts/office-labels-qa/syntax.json).
- `node --test-reporter=tap scripts/hani-office*.test.mjs` 및 `scripts/hani-building*.test.mjs`를 각 파일별 직접 호출(PowerShell foreach, wildcard를 Node 한 프로세스 인자로 넘기지 않음): **총 39파일 실제 실행**. 최초 22 exit0/17 실패에서 표시 기대값을 갱신하고 아래 4파일 재검증 후 **최종 23 PASS / 15 FAIL / 브라우저 1 SKIP**. exit0는 SKIP 파일을 포함한 24개. 집계되는 Node assertion은 **PASS 326 / FAIL 12 / SKIP 1**이며, 이 외 7파일은 테스트 시작 전 실패라 assertion 집계에 포함되지 않음.
- 최종 targeted 4명령: `node --test-reporter=tap scripts/hani-office-labels-qa.test.mjs` **12/12**, `.../hani-office-crowded-labels.test.mjs` **19/19**, `.../hani-office-obr18.test.mjs` **12/12**, `.../hani-office-obr8.test.mjs` **3/3**. 합계 **46/46 PASS, FAIL 0**. [최종 targeted](../../../artifacts/office-labels-qa/final-targeted.json).
- 새 표시 guard가 들어간 OBR-21은 전체 실행에서 4 PASS / 2 Git 차단. 첫 frozen full-plan/snapshot/source guard PASS. 원래 소스에서도 guard 자체 PASS를 따로 확인했으며 골든 결과는 갱신하지 않음.
- 실제 전체 결과 및 파일별 숫자: [final-results.json](../../../artifacts/office-labels-qa/final-results.json). 최초 결과도 [results.json](../../../artifacts/office-labels-qa/results.json)에 보존. 개별 `<파일>.log`, `final-<파일>.log`에 상세 근거.
- Git 차단 비교: `node --require ./artifacts/office-labels-qa/baseline-preload.cjs --test-reporter=tap --test-name-pattern <실패 검사명> <test>`로 **작업 전 원본 함수를 읽어** 해당 실패만 재실행. 13파일 전부 같은 `spawnSync git EPERM`. [비교 결과](../../../artifacts/office-labels-qa/baseline-results.json). 이 확인은 Git을 우회하거나 역사적 fixture를 가짜로 만들지 않음.

### 최종 실패와 건너뜀 전부

| 파일 | 실패/미검증 사유 |
| --- | --- |
| `hani-building-206-safety.test.mjs` | baseline 디렉터리 인자/환경변수 미제공으로 시작 실패(ERR_INVALID_ARG_TYPE). Full Safety PASS 아님. 이번 범위의 불변성은 별도 source/EOL/index/data/closure 검사로 확인. |
| `hani-building-206-ui.test.mjs` | 의도된 browser 1 SKIP. 사용자 지정 검토 담당이 실행. |
| `hani-office-cafe-rest.test.mjs` | 사용자 사전 고지된 2실패 그대로: `artifacts/office-cafe/art-map.before.json` 없음, cold-plan 400ms 한계. 나머지 2검사는 PASS. |
| `hani-office-lively-v2.test.mjs` | Git EPERM 1개 + cold-plan 400ms 1개. 별도 순차 실행에서 작업 전 원문 best **461.6ms**, 수정본 **476.9ms**, 모두 동일 기준 초과. warm snapshot은 각각 0.955/0.959ms로 <3ms. 기준 완화 없음. [원문](../../../artifacts/office-labels-qa/baseline-performance.log) / [수정본](../../../artifacts/office-labels-qa/current-performance.log). |
| `hani-office-219.test.mjs` | Git EPERM, 원문에서도 동일 |
| `hani-office-actions-216.test.mjs` | Git EPERM 1개, 14 PASS; 원문에서도 동일 차단 |
| `hani-office-chairman-234.test.mjs` | Git EPERM으로 시작 실패, 원문에서도 동일 |
| `hani-office-obr12.test.mjs` | Git EPERM으로 시작 실패, 원문에서도 동일 |
| `hani-office-obr14.test.mjs` | Git EPERM 1개, 4 PASS; 원문에서도 동일 차단 |
| `hani-office-obr15.test.mjs` | Git EPERM 1개, 13 PASS; 원문에서도 동일 차단 |
| `hani-office-obr21.test.mjs` | Git EPERM 2개, 4 PASS; 원문에서도 동일 차단 |
| `hani-office-obr4.test.mjs` | Git EPERM 2개, 8 PASS; 원문에서도 동일 차단 |
| `hani-office-obr6.test.mjs` | Git EPERM으로 시작 실패, 원문에서도 동일 |
| `hani-office-obr7.test.mjs` | Git EPERM으로 시작 실패, 원문에서도 동일 |
| `hani-office-obr9.test.mjs` | Git EPERM으로 시작 실패, 원문에서도 동일 |
| `hani-office-v2-215.test.mjs` | Git EPERM 1개, 17 PASS; 원문에서도 동일 차단 |

기능 코드 변경에 따른 일정 결과 실패는 없음. 검사 실패를 PASS로 바꾸거나 기준을 완화하지 않았음. 위 차단/실패와 실제 화면 미검증을 포함하므로 Release/Candidate 완료가 아님.

## 다음 담당에게

- 먼저 읽을 파일: 이번 JS/CSS diff와 신규 라벨 테스트, 본 인수인계 최종 검증 결과.
- 다음 행동: 별도 담당이 desktop/360·390·416px phone, 각 층·밝은/어두운 테마 실화면 확인. work/rest/play/meeting/moving/night 색과 실제 대비, 긴 문구/직급의 잘림·얼굴/라벨 충돌·가로 overflow, pill/name/dot 전환, title·aria·명단·탭/클릭/키보드 말풍선 원문을 확인. 브라우저 PNG·실측값은 0건. Git 가능 환경에서 위 역사적 source 검사 재실행.
- 다른 탭의 일정·상담·소파 문구는 수정하지 않음. 배포 열차와 최종 승인은 별도.
- CURRENT/DECISIONS: 타 담당 기록 보존, 공통 사실 변경 없음.
- Notion 반영 대기 요약: 2026-11-01 Codex, office labels QA-3/18/19 구현 및 targeted 46/46, syntax8/8, 전체39파일23PASS/15FAIL/browser1SKIP(상세 위). 미커밋 검토 대기, base024f3a2/운영2.9.248 유지, 별도 담당 browser·Git 회귀 필요, commit/push/merge/배포 없음. 이 기록을 현황판에 저장 후 읽어 확인해야 갱신 완료로 볼 수 있음.

## QA-b5b 브라우저 지적 보완 착수 · 2026-11-01 KST

- 담당 Codex / branch hani/office-labels-qa / base 024f3a20f27350105718c1896e38693cb82bc4cd / 기존 미커밋 변경 이어서 작업.
- 범위: activityStatus 단일 표시 판정·phoneActions 투표/저녁 문구·phoneStatusLine compact 전달·지정 테스트·exact-line fixture 및 pinned hash. 일정/계획/데이터/버전/cache/다른 담당 문구 불변, 새 runtime 파일·commit/push/merge/배포 금지.
- 원격 main 조회: git ls-remote 연결 실패, 자동 merge/rebase 없음. CODEMAP living-office owner 확인, 라벨 anchor CODEMAP_MISS로 실제 symbol 분석.
- 상태: 어휘 감사 및 targeted 검증 진행 중. 아래 후속 최종 기록으로 결과 갱신.

## QA-b5b 최종 기록 · 2026-11-01 KST

### 작업 식별·승인 범위

- 담당 Codex / 검토 담당 사용자 지정 브라우저 담당 / branch `hani/office-labels-qa` / worktree `qa-b5` / base·HEAD `024f3a20f27350105718c1896e38693cb82bc4cd` 유지.
- 승인 근거: 사용자 지시로 UTF-8 전체 읽은 `../qa-b5b-task.md`. 한글 정상 확인. 기존 미커밋 변경 위 두 표시 결함 보완만 수행. 일정·plan·데이터·표시 버전·캐시·새 runtime 파일 변경 및 commit 금지. 다른 탭의 일정·상담·소파·인스타 원문 보존.
- 착수 때 `git ls-remote origin refs/heads/main`은 연결 실패(exit1). 로컬 origin/main=HEAD이지만 원격 최신성 미확인, merge/rebase 없음. 표시 기준 2.9.248과 index 바이트 유지. Production JS 재로딩·read-back은 이번 Patch 범위 N/A(미수행).

### 변경·예외

- 이번 추가 수정 파일은 `hani-office-live.js`, `scripts/hani-office-labels-qa.test.mjs`, `scripts/fixtures/office-labels-qa-source-delta.json`, `scripts/hani-office-obr8.test.mjs`, `scripts/hani-office-obr21.test.mjs`와 본 인수인계·개발 증거다. 기존 CSS/조직 허브/crowded/obr18 변경을 보존하고 추가 수정하지 않음.
- 단일 `activityStatus`에서 dataset.activity rest/play, 기존 휴식 seat zone lounge, 이름 붙인 작은 leisure 정규식으로 휴식 판정. 이동 → 회의 → 휴식 → 야근 → 근무 순서 유지. server/reception 등 다른 비책상 업무 구역은 휴식으로 묶지 않음. layout 조회 없음.
- 전체 어휘를 확인하고 업무 흰색을 유지한 예외는 정확히 4개: **고객 표현 쉬운 말로 바꾸는 중 / 어려운 용어 쉬운 말 퀴즈 중 / 다음 약속 준비물 적는 중 / 졸린 눈으로 문장 줄이는 중**. 이 예외도 명시적인 rest/play·lounge·이동·회의 판정 우선순위를 뒤집지 않음.
- `phoneActions`의 기존 음식 문구 matcher에 투표·저녁 뭐를 추가. 저녁 뭐 먹지 투표 중 → 휴식 노랑 + 폰 메뉴고르기 / wide 메뉴 고르기. 휴식의 근무중 fallback 금지 검증.
- `phoneStatusLine`에 compact 전달: 폰만 공백 없는 후보 우선(≤6자), wide는 공백 있는 원문 후보 우선(≤8자). `label`과 `fitStatusLabels`에서 화면 모드를 전달. 보고 문구도 폰 배포보고 / wide 배포 보고. 원문 title/aria/명단/기존 말풍선 유지.
- fixture는 기존과 같은 정확한 행·개행 역적용 방식으로 원본 전체 SHA `5254d8bed4e2927f2eea70cbc40cd24113627b9bf4a6f4f67d6e04b02dcab7fc` 복원. 11개 exact-line 묶음이며 함수 범위 제외·골든 plan/snapshot 갱신 없음. fixture SHA `ba942a28e5c83f6bf7dbfc4d41e3456649e03c38759481aca2764963b3ca944a`를 obr8/obr21에 고정. 두 검사 파일은 이번 후속 전 대비 이 해시 1곳씩만 변경.
- 전체 JS SHA `b79bc13dc3a125ee83127fb72fd7cb3002c8e6d2464f744ffb5be94c8189d42c`. createScheduler 바이트 SHA `b37bdd3e511aacae3a01391fbaab76b1c3299cac254f30f10193bdc14de2051d` 원문 동일. 이번 후속은 기존 phoneActions/phoneStatusLine, activityStatus/label, fitStatusLabels 세 표시 구간 외 바이트 동일. index·art-map·places·spatial-contract 해시 불변, runtime LF 유지.

### 실행한 검증·증거

각 명령은 `node --test-reporter=tap scripts/<파일>`로 실제 실행했다.

| 파일 | PASS | FAIL | SKIP |
| --- | ---: | ---: | ---: |
| hani-office-labels-qa.test.mjs | 14 | 0 | 0 |
| hani-office-crowded-labels.test.mjs | 19 | 0 | 0 |
| hani-office-obr8.test.mjs | 3 | 0 | 0 |
| hani-office-obr18.test.mjs | 12 | 0 | 0 |
| hani-office-obr21.test.mjs | 4 | 2 | 0 |
| 합계 | **52** | **2** | **0** |

- 명령 기준 4 PASS / 1 FAIL. OBR21 실패는 `fixed pre-patch collision witnesses`, `cached gathering/index decisions` 두 검사의 역사적 Git 소스 조회에서 `spawnSync git EPERM`. 기존 인수인계의 실패와 같은 사유이며 이번에도 FAIL로 기록. 우회·기준 완화 없음. OBR21 frozen full absent/present formal/outing/reverse snapshot/source guard·변조 거절과 나머지 3검사는 PASS.
- 라벨 검사 확장: 전체 vocabulary 2,979개에 상태를 실제 activityStatus로 부여하고 결과 파일 기록(책상/work 기본으로 분류한 superset: work 2,741 / rest 236 / night 2). 기존 모든 상태별 어휘 회귀도 양쪽 너비로 유지. 평일/주말·회장님 재실/부재 생성 문장 44,891건은 실제 activity·seat zone·walking에서 상태를 계산. 폰 ≤6 / wide ≤8, 휴식에 근무중 fallback 없음, 19개 휴식 예문·10개 업무 예문·네 예외·상태 우선순위·공백·실제 label/fit 전달·원문·쓰기0·기존 프레임 layout read0 확인. 실제 화면 픽셀 검사는 아님.
- `node --check`: 운영/테스트 JS·MJS 기존 변경 8개 모두 PASS(FAIL0), 추가 개발 증거 `review-regenerate-delta.mjs`도 PASS. **합계 9 PASS / 0 FAIL**. 최종 라벨 테스트 수정 후 해당 파일 문법·14검사 재실행 PASS.
- `git diff --check` PASS. 보호 저장·Cloud·schema·migration·event 경로 변경 없음. 새 runtime 파일 없음. Build·Candidate·One-Pass·HINA·merge·배포 미수행. Release 버전 증가는 사용자 금지와 배포 열차 규칙에 따라 N/A.
- 증거: [targeted 결과](../../../artifacts/office-labels-qa/review-targeted.json), [syntax](../../../artifacts/office-labels-qa/review-syntax.json), [소스·불변성](../../../artifacts/office-labels-qa/review-safety.json), [전체 어휘 상태/표시](../../../artifacts/office-labels-qa/review-vocabulary-states.json). 개별 `review-<test>.log`에 실행 원문. exact-line 재생성 개발 증거는 [review-regenerate-delta.mjs](../../../artifacts/office-labels-qa/review-regenerate-delta.mjs). 이전 결과는 과거 근거로 보존.

### 미검증·blocker·다음 행동

- 상태: 구현 및 지정 Node 검증 완료, 두 Git 의존 검사는 실패, 수정 후 실제 브라우저 검증 대기. commit/push/PR/main 병합/Pages/Production 완료 아님.
- 다음 담당: 이 최종 절과 변경 JS를 먼저 확인하고 desktop·360/390/416px phone에서 저녁 투표·소파 휴식 노랑, 실제 업무 흰색, wide 공백·폰 압축 및 6/8자 길이를 재확인. Git subprocess 가능한 환경에서 실패 2검사 재실행. 별도 열차/최종 승인 유지.
- CURRENT/DECISIONS는 타 담당·과거 기록을 보존하고 이번에는 수정하지 않음. 서버 Edge Function/설정 추가 배포 없음.
- Notion 현황판 fetch와 Markdown 규격 읽기는 성공. 착수 `insert_content` 갱신은 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절하여 저장/read-back 미완료. 같은 동작을 재시도하지 않음.
- **Notion 갱신 대기 요약:** 2026-11-01 KST Codex, Office labels QA-b5b, hani/office-labels-qa / base024f3a2. 표시 전용 휴식 판정·업무 예외4·저녁 투표 음식 문구·wide 공백/폰6자·wide8자 및 exact-line pin 보완. Targeted52PASS/2FAIL(Git EPERM), syntax9/9, vocabulary2979·generated44891, scheduler/index/data 불변. 미커밋·버전/cache 유지, 원격 최신성·수정 후 browser·운영 미검증. 다음은 browser review와 허용 환경 Git 회귀. 승인 범위는 qa-b5b-task의 표시 수정만이며 배포 승인이 아님. 현황판 저장 후 읽기 확인 필요.

- 2026-11-01 서윤 검토: 라운지 구역의 task·errand 장소는 업무로 유지하고 물 한 모금을 휴식으로 분류. obr15에도 표시 변경 복원 적용. 로컬 화면 데스크톱·360px 확인, 로그인 후 화면은 미검증. 시험 실패 3개(206-safety, 219, cafe-rest)는 main과 동일. hani/office-consult가 먼저 배포되면 office-labels-qa-source-delta.json과 obr8·15·21 고정값을 새 기준으로 다시 만들어야 한다.
