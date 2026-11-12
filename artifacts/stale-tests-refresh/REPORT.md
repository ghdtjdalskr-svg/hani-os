지정 시험 39개를 통과 15개, 은퇴 후보 6개, 실제 문제 후보 7개, 실행 차단 11개로 정리했습니다.
운영 파일·저장·Cloud·버전은 그대로이며, 시험 삭제·Git 명령·커밋·push·배포는 하지 않았습니다.
과거 코드 고정은 정확한 해시의 시험 전용 되돌리기로, 빠진 시험 의존성은 실제 소유 함수로 연결했습니다.
브라우저는 Chrome 실행 권한 때문에 확인하지 못했고, 은퇴와 운영 문제 수정은 서윤·성민 대표님 판단으로 남겼습니다.
전체 비정상 종료는 114개에서 95개로 줄었고 새 회귀는 없었으며, Notion 쓰기는 자동 승인 정책으로 차단됐습니다.

## 작업 인수인계

- 날짜: 2026-11-13 KST. 담당: Codex(도연 시험 정리).
- 최종 갱신 시각(KST): 2026-11-13 02:03:19 KST
- 목적: `../stale39-task.md`의 39개 시험을 안전 의미를 보존하여 갱신하고, 은퇴 후보와 실제 문제 후보를 분리.
- 지정 branch: `hani/stale-tests-refresh`. 파일로 확인한 HEAD: `49096deb9ca99790c48106bbff7ec275273b1b52`. Git 명령 0.
- 로컬 `origin/main` 참조: `52c289d650c02d13022247d48114533c8cf14a00`. 기준 이후 그림 seed #491 하나가 진행됨. 읽기 전용 객체 검사 결과 런타임 미참조 그림 추가 commit이며, 현재 기준 유지·merge/rebase 없음. 원격 네트워크 최신성 미확인.
- 소스 표시 버전은 `HANI_DISPLAY_VERSION=2.9.289`, HTML 마지막 local script는 `./hani-launch-greeting.js`입니다. 실제 운영 화면/JS 네트워크 로딩 확인을 대신하는 근거는 아닙니다.
- CODEMAP은 읽었으나 이 오래된 시험 묶음의 상세 owner/anchor는 없어 `CODEMAP_MISS`로 실제 import·실행 오류·소유 함수 주변을 확인했습니다. 운영 DOM/event/renderer 변경은 없습니다.
- 허용 범위: `scripts/` 시험·fixture·도우미, 이 보고서. 운영·데이터·schema 변경, 시험 삭제, 버전 증가, 배포 승인 없음.
- 착수 상태: 전체 원본 SHA256 및 시험 부산물 원본을 worktree 밖 임시 폴더에 보관. 종료 시 운영 바이트 및 범위 밖 변경을 비교·복원.
- Notion: 현황판 및 Markdown 규격 읽기 성공. 착수 `insert_content`는 자동 승인 검토가 `approval policy is never`로 거절하여 미반영. 서윤이 이 보고서 요약을 현황판에 기록하고 읽어 확인해야 함.

## 실행 조건

- Node v24.20.0. 각 파일을 별도 Node process로 실행하고 종료 코드 및 뒤쪽 하위 시험까지 수집.
- 하위 시험의 Git 실행도 preload로 거부. Git 제약은 기능 실패와 분리하며 PASS로 간주하지 않음.
- Playwright: `C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs`.
- Chrome: `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- Chrome `spawn EPERM` 재현. 해당 시험은 실제 브라우저 부분 BLOCKED.

## 39개 결과

파일 열은 모두 `scripts/hani-<파일>.test.mjs`입니다. PASS는 파일 전체 종료 코드 0이고 필요한 검증이 차단되지 않은 경우입니다. 첫 PASS 출력 뒤의 하위 시험·비동기 오류도 확인했습니다. staff-floors는 브라우저 실패를 skip하여 종료 코드가 0이어도 BLOCKED입니다. 은퇴 후보는 삭제 승인 요청 대상이며 파일을 수정하지 않았습니다. 실제 문제 후보는 운영 버그 확정이나 수정 완료를 뜻하지 않습니다.

| 파일 | 원인 | 조치 | 결과 |
|---|---|---|---|
| ai-budget-antigravity | 5개 카드 고정, 현재 4개 | v289 Codex 보조 카드 제거 결정과 충돌; 원본 보존 | 은퇴 후보 |
| board-november | 첫 PASS 뒤 builder가 배포 번들과 불일치 | builder assertion 유지; 최신 호 누락 확인 | 실제 문제 후보 |
| boardroom-routing | 필수 Edge 소스 인자 누락 | 저장소의 실제 orchestrator 소스를 기본값으로 사용; 기존 인자 보존 | PASS |
| brand-heroes-218 | 큰 hero hunk·35개 메뉴·조직도 hero 부재 고정 | 현재 새 메뉴/hero 구성과 충돌; 원본 보존 | 은퇴 후보 |
| building-206-safety | 외부 raw baseline 필수 | 고정 승인 commit의 객체를 기본 근거로 사용; 기존 인자 유지 | PASS |
| building-206 | 3F 그림 215 고정 | 승인된 218 그림 경로로 정확히 갱신; 자산 존재·fallback 검사 유지 | PASS |
| dash-218 | 기존 보고서 6개만 있다고 고정 | 기존 6개와 승인된 개발 보고서 13개 분리; 전체 파일/본문/선택 순서 비교 유지 | PASS |
| desk-mascots | 서윤·유리 장식의 계산 위치와 측정 fixture 불일치 | 좌표 assertion 유지; 실제 계산식과 어긋남 별도 기록 | 실제 문제 후보 |
| fun-chat-fortune | 159개 closure 고정 | 기존 159개 전부와 283의 지정 의존성 3개를 정확히 비교 | BLOCKED: Chrome EPERM |
| fun-top3 | 오래된 HTML 전체 바이트 비교 | 승인된 275 shell로 정확한 inverse; 기능 assertion 유지 | BLOCKED: Chrome EPERM |
| helper-275-pins | 후속 main/index 변경을 275 바이트로 검사 | 275 exact inverse 및 원래 hash/blob pin 유지; Git process 대신 검증된 객체 읽기 | PASS |
| helper-bot | 새 procrastination 화면의 전용 도움말 없음 | 기존 화면별 도움말 assertion 유지 | 실제 문제 후보 |
| hero-restore | 후속 hero/layout 변경으로 hunk 불일치 | 승인 228 presentation exact inverse; 원래 renderer·RNG·무쓰기 검사 유지 | PASS |
| ilbo-213 | 첫 단위 PASS 뒤 브라우저 시작 실패 | 원본 유지; 하위 브라우저 실패 포함 | BLOCKED: Chrome EPERM |
| ilbo-banner-215 | 첫 PASS 뒤 브라우저 시작 실패 | 원본 유지 | BLOCKED: Chrome EPERM |
| invest-split-safety | 외부 raw baseline 필수 | 승인 객체 기본값; 양쪽 실제 IC/analytics 경계 확인; 기존 인자 유지 | PASS |
| lounge-billboard | 첫 board PASS 뒤 발행 목록/투표 하위 시험 실패 | 누락 assertion 유지; library 번들 문제와 함께 인계 | 실제 문제 후보 |
| m9-link | polish 이전 bytes를 polish 이후 파일에서 검사 | 기존 polish preload를 자동 연결; 보존/기능 9개 통과, package 포함 assertion 유지 | 실제 문제 후보 |
| mascots-poster | 마스코트 3명·옛 scene/closure 고정 | 보리 합류로 현재 4명; 원본 보존 | 은퇴 후보 |
| nav-groups | 업무 그룹에 새 메뉴 추가 | 정확한 메뉴 배열 갱신; 이후 발견된 procrastination 공통 voice 누락 assertion 유지 | 실제 문제 후보 |
| newface-217 | 다온·윤슬을 planned/빈 자리로 검사 | 정식 입사 232와 충돌; 원본 보존 | 은퇴 후보 |
| newstaff-215 | 브라우저 시작 실패 | 원본 유지 | BLOCKED: Chrome EPERM |
| ocr-accuracy-224 | 승인 후속 변경을 224 바이트와 비교, 미등록 비동기 브라우저 실행 | 현재 원본 전체를 승인 객체와 비교하고 224 fixture pin도 보존; 브라우저를 정식 test에 등록. Node 14개 통과, locator는 미확인 | BLOCKED: Chrome EPERM |
| office-219 | 고정 색상·옛 mood/called·옛 좌석 검사 | 현재 CSS 변수/단일 status owner와 충돌; 원본 보존 | 은퇴 후보 |
| polish-205-safety | 외부 raw baseline 필수 | 승인 객체 기본값; 기존 flat 인자·쓰기/EOL/중복 검사 유지 | PASS |
| protected-gate-integration | 현재 BOM 포함 runtime과 서버 decode runtime hash 차이 | 시험/운영 모두 원본 유지; 별도 합성 진단으로 원인 확인 | 실제 문제 후보: 기본 Git 실행도 차단 |
| qa-210 | 첫 board PASS 뒤 과거 presentation hunk 검사 | 정확한 historical presentation과 현대 원본 oracle을 구분 | PASS |
| qa-design-b4 | summary만 있는 context를 기대; 128개 closure 고정 | 288에서 중복 summary panel 제거됨; 원본 보존 | 은퇴 후보 |
| qa-report-fixes | monthly 생성 후 새 home 갱신 의존성 누락 | fixture에 해당 외부 UI 의존성 연결; 기존 성공/실패/취소·저장 수 검사 유지 | PASS |
| remote-media-219 | Node PASS 뒤 브라우저 실패 | 원본 유지; 실브라우저/대비/넘침은 미검증 | BLOCKED: Chrome EPERM |
| reviewed-release-baseline | 233 이후 새 파일의 origin 누락, catalog/CSS mutation anchor 노후 | 실제 존재하는 233 객체 사용; 283 새 파일 origin 명시; 현재 anchor 변조 검사 유지 | PASS |
| seoyun-m9 | standalone 실행에서 필요한 inverse preload 없음 | 기존 두 preload 자동 연결; 지정 명령도 재검사 | PASS |
| settings-225-qa-guard | 예전 save owner와 현대 save guard 비교 | 승인된 현대 oracle에서 원래 승인 wrapper만 역변환; 실제 browser 전략대로 main 유지 | PASS |
| settings-225 | presentation hunk 노후화 | exact inverse 및 현대 QA guard oracle; 정적 검증 통과 | BLOCKED: Chrome EPERM |
| simplify-225 | 후속 코드 때문에 225 hunk 불일치 | 동일 역사 층으로 원래 assertion·hash/EOL/제어 보존 검사 수행 | PASS |
| staff-floors-214 | portrait 의존성, 215 그림/계약2.0.9 고정 | 실제 portraitSource, 3F218, 승인 계약2.0.11 연결. Node 10개 통과; browser skip을 PASS로 세지 않음 | BLOCKED: Chrome EPERM |
| tasks-qa-212 | 새 persistent homeActions slot이 fixture에 없음 | 현재 DOM slot 및 실제 count owner 연결; 기존 무쓰기/중복 방지 assertion 유지 | BLOCKED: Chrome EPERM |
| theme-white-215 | 옛 presentation hunk·Git 기준 읽기 | 역사 presentation과 현재 cache/저장 owner 구분; 실제 객체 기준 사용 | BLOCKED: Chrome EPERM |
| ui-203b | 배지 owner가 부르는 count 함수 미로드 | 실제 count owner 로드; 인자 없는 기준/EOL/쓰기 비교도 Git process 없이 수행 | PASS |

## 은퇴 후보: 삭제·수정 없음, 별도 승인 필요

1. **ai-budget-antigravity**: `91d4943d2386a25d7ed49dc56de25c4d1ab5bd8f` / v289는 Codex 보조 칸 제거 릴리스입니다. 4개 카드를 5개로 되돌려 통과시키지 않았습니다. `hani-ai-budget.test.mjs`, `hani-ai-budget-plan.test.mjs`가 기본 모델을 검사하지만 이 파일의 TSV·시간 제한·실패 보존 전부를 대체한다는 근거는 없습니다. 삭제 전에 유효한 세부 시험 분리 판단 필요.
2. **brand-heroes-218**: 35개 메뉴 고정은 `a28918df50ba5fef3e7dab498eaa5eec4a27a103` / v283의 미룬 일 메뉴 추가와 충돌합니다. 조직도 hero 부재 및 검색 결과 단일 개수 고정도 현재 구성과 다릅니다. `hero-restore`, `hero-cast-218`과 현대 nav 시험이 일부를 보완하나 전부의 대체는 미확정입니다.
3. **mascots-poster**: `c338bdab8589676979f85e1a5626fca2af5b86d8` / v272 보리 합류 이후 조직도 마스코트는 4명입니다. 현재 pet/label/office fixture 시험이 동물·상주·노드 안전을 검사합니다. 이 파일에 섞인 퀸 액자 기능 전체의 대체 여부는 삭제 전에 따로 확인해야 합니다.
4. **newface-217**: `4ac6b6c0119eeacc7332f1c53c3c760675657c11` / v232 정식 입사 이후 두 사람의 home anchor가 존재합니다. onboarding-232 assertions, building/portrait 시험이 현재 명단을 검사합니다. 원래 이미지 규격 검사의 별도 보존 여부 확인 필요.
5. **office-219**: v234~235 이후 단일 status owner와 CSS 변수 색상을 사용합니다. 첫 AA 오류는 `background:var(...)`를 고정 hex 정규식으로 읽어 bg가 undefined인 것으로, **실제 AA 미달 측정값이 아닙니다**. 예전 mood/called selector도 제거됐습니다. `office-labels-qa`의 실제 status/AA 검사와 현대 office 시험이 일부 대체합니다. 이름표 실제 픽셀 대비는 브라우저 미검증입니다.
6. **qa-design-b4**: `98e21fab1bd0e7838e8245dd36423aca3fdeedd6` / v288의 renderer는 context를 indices/facts/cuts가 있을 때만 만들며, summary-only 중복 panel은 만들지 않습니다. `newsroom-4cut-288`, `newsroom-persona`가 새 renderer를 검사합니다. 이 파일에 함께 들어 있는 건강 목표·캘린더 등 유효한 검사는 별도 보존 판단 전까지 제거하면 안 됩니다.

## 실제 문제 후보: 운영 수정 없음

- **라운지 번들 최신 발행 누락 — board-november / lounge-billboard**: `buildLibrary({check:true})`가 stale runtime을 거부합니다. 실제 library bulletin에는 일보 4호(11/09)와 4컷 2호(11/08)가 빠져 있습니다. billboard는 목록 불일치와 실제 투표 하위 검사도 실패합니다. 원본 builder/운영 번들을 재생성하거나 assertion을 없애지 않았습니다.
- **책상 장식 위치 — desk-mascots**: 실제 renderer의 `anchor + offset` 식으로 유리 장식은 `(716.768, 740.410)`이지만 승인 측정점은 `(267,731)`, 기존 책상 bounds의 x는 `66..300`입니다. 서윤도 `(245.872,582.870)` 대 `(286,517)`으로 다릅니다. 좌표/fixture 문제 또는 실제 배치 회귀 후보이며 실브라우저로 구분해야 합니다. 기능이 사라진 것이 아니므로 은퇴로 처리하지 않았습니다.
- **미룬 일 연결 범위 — helper-bot / nav-groups**: 새 메뉴는 있지만 helper의 전용 view help와 `TAB_CHARACTER_LINES`의 procrastination 항목이 없습니다. 본문은 자체 직원 대사를 가지므로 공통 안내/배너까지 등록할 의도인지 확인해야 합니다. 누락 guard를 유지했고 운영에 handler/대사를 추가하지 않았습니다.
- **M9 패키지 포함 — m9-link**: 기존 polish 층 연결 후 9개 보존/실행 시험은 통과하지만 마지막 required 목록 검사는 계속 실패합니다. `resolver.missing=[]`만으로 포함을 인증하지 않았습니다. `data/hani-ilbo/issues.json`, `data/hani-ilbo/extra-m9.json`, `assets/hani-ilbo/extra-m9-comic.webp`, `assets/character-archive/seoyun-m9-special-cut.webp`의 수집 결정을 배포 담당이 확인해야 합니다. gate/server/resolver 변경 없음.
- **서버/로컬 runtime BOM 일치 — protected-gate-integration**: 직접 서버·로컬 게이트는 합성 policy를 통과시키지만 supplied-package 경로는 `Source or package drift`로 실패합니다. `hani-street-journal.js`의 UTF-8 BOM을 서버 TextDecoder가 제거하고 로컬 원문 해시는 보존하는 차이입니다. 운영 파일을 건드리지 않은 외부 임시 fixture에서 BOM을 **양쪽 해시 전에만** 동일 처리하면 기존 12개 integration 검사가 모두 통과했습니다. 우회 패치를 넣지 않았으며 별도 release-pipeline 검토가 필요합니다. Supabase 서비스 호출·DB/schema 작업은 없었습니다.

## 변경 방식과 안전 근거

- 기존 release-version manifest 및 fixture pin은 변경하지 않았습니다. `stale39-legacy-layers.json.gz`는 승인 `49096de` → 고정 228/275 commit의 ordered exact line inverse입니다. 압축 파일 SHA256 `b5d13256bf3226467007cc2a74e98b73a0e1655a9014ad078d8669671667259b`를 고정했고 각 입력/출력 전체 해시·변경 줄·순서를 검사합니다. unknown bytes, 덧붙임, 삭제, 중복, EOL 변조를 거부합니다.
- 새 역사 층 앞에도 기존 `hani-release-version-layers.cjs`의 registered inverse를 연결했습니다. 다음 릴리스가 중앙 manifest에 등록되면 먼저 고정 289 경계를 노출한 뒤 역사 층을 적용합니다. 합성 다음 릴리스에서도 frozen pin을 갱신하지 않고 합성·drift 거부를 검증했고, 영향받는 사용 시험 8개도 재실행했습니다(5개 종료0, 3개 Chrome 차단).
- 새 객체 reader는 loose/pack 객체의 실제 `commit/tree/blob` SHA1과 길이를 검증하고 읽기만 합니다. ref/index/history를 수정하거나 Git executable을 호출하지 않습니다. commit을 못 찾으면 fail closed입니다. 233 commit은 이 환경에 실제 존재했습니다. 없다는 가정으로 시험을 은퇴시키거나 HEAD를 expected source로 승격하지 않았습니다.
- reviewed release oracle에는 233에 없었던 `hani-procrastination-board.js/.css`의 **고정 283 승인 origin**을 추가했습니다. 이후 릴리스의 parent/current 바이트 비교와 변조 거부는 그대로 유지합니다.
- settings는 역사 presentation과 현대 저장 owner를 구분합니다. 현대 승인 원문에서 `goalRegistryApprove`의 정확한 saveEntry wrapper 하나만 역변환하여 기대값을 만들고, 기존 검증기가 body/버튼/저장 owner/실패 경로 변조를 계속 거부합니다.
- safety 3개는 인자 없이 승인 객체로 PASS, 기존 flat/nested 인자로도 PASS입니다. 메모리에서만 `writeProtectedState`의 저장 호출을 변조한 음성 검사 3개는 모두 종료 코드 1로 거부했습니다. 운영 파일 변조는 하지 않았습니다.
- OCR은 현재 asset/Edge 전체 원문을 고정 승인 객체로 검사하면서 원래 224 함수/비-Vision pin도 역사 객체로 계속 검증합니다. 현재 asset 또는 Edge 원문을 메모리에서 각각 한 바이트 변조한 두 음성 검사도 모두 해당 승인 원문 assertion에서 거부했습니다. 합성 필드 정확도는 22 fixture·330/330이며 실제 이미지 인식률 주장이 아닙니다.

## 시험 숫자와 범위

| 검사 | 결과 |
|---|---|
| 과제에 제시된 과거 main 기준 | 226파일 중 47개 실패, 브라우저 인자 제공 시 39개. 사용자 제공 참고값이며 이번 환경 실측과 구분 |
| 이번 환경 수정 전 전체 | 251파일 / 137 종료 0 / 114 비정상 종료. Git·브라우저·누락 실행 인자 제약 포함 |
| 이번 환경 수정 후 전체 | 252파일 / 157 종료0 / 95 비정상 종료. 기존 251파일만 비교하면 156 종료0 / 95 비정상 종료: 기존 비정상 19개 감소, 기존 통과의 새 실패 0개 |
| 지정 39개 최종 분류 | PASS 15 / 은퇴 후보 6 / 실제 문제 후보 7 / BLOCKED 11 |
| release-version-layers | 9/9 PASS, 기존 manifest/pin 불변 |
| save-guard | 10/10 PASS |
| 새 historical inverse·객체 거부·다음 릴리스 합성 | 3/3 PASS |
| reviewed-release-baseline | 17/17 PASS, 전체 현대 owner의 byte/EOL/write/control 변조 거부 포함 |
| 지정 M9 명령 | 15/15 PASS; 자동 preload 연결 후에도 중복 실행/층 충돌 없음 |
| 외부 baseline 인자 호환 | 3명령 PASS, 메모리 보호 write 음성 검사 3명령 모두 거부 |
| OCR / staff Node | 각각 14 PASS + browser 1 차단, 10 PASS + browser 1 skip/차단 |
| 변경 JS/MJS/CJS 문법 | 30/30 PASS |
| 추가 related CJS | app-216-audit: 6 PASS / 1 기존 실패. 원본 snapshot에서도 동일한 procrastination CSS 배열 누락으로 재현; 미수정 |
| office 전체 | `hani-office-*.test.mjs` 73파일 전부 실행: 45 종료0 / 28 Git 차단. Git 외 새 실패 0개 |
| 바뀐 도우미 사용 MJS | 전체 252파일에 포함; 추가 CJS와 최종 층 사용 8파일 재검사도 위에 별도 기록 |
| 운영 관련 파일 | root JS/CSS/HTML/manifest·assets/data/data-hub/js 등 509개가 고정 승인 commit의 Git blob과 모두 일치 |
| 부산물·범위 | 기존 자동 산출물 4개 바이트 복원, 새 시험 산출물 20개 제거. scripts 및 이 보고서 외 변경 0, 예상 밖 새 파일 0 |
| 브라우저/픽셀/실서비스 | BLOCKED 또는 미검증. PASS 표시하지 않음 |

전체 집계는 각 `.test.mjs`를 별도 Node process로 실행한 파일 종료 코드 기준입니다. 39개에서 필요한 인자/환경 경로를 제공했고, fun-top3는 `--browser`도 실행했습니다. 나머지 전체 시험의 고유 실행 인자 누락은 전후 같은 방식으로 집계했습니다. Git 호출은 외부 preload로 거부했으므로 위 비정상 종료 수를 순수 제품 결함 수로 해석하면 안 됩니다(최종 95개 중 37파일에 Git 차단 포함). 전체 순회 중 드러난 OCR/staff의 뒤쪽 노후 기준은 추가 targeted 검사를 수행했습니다. OCR은 전체 순회 당시와 최종 targeted 모두 파일 종료 코드 1이며 최종 남은 실패는 browser뿐입니다. staff의 종료0에는 browser skip 1개가 있으므로 39개 분류에서는 BLOCKED로 유지했습니다. full build/One-Pass/HINA/Production은 운영 변경이 없는 시험 작업이므로 N/A입니다.

## 서윤이 돌려야 할 명령

권한이 있는 Windows PowerShell, 저장소 root에서 실행합니다. 이 환경의 Chrome EPERM을 PASS로 바꾸지 않았습니다. 특히 OCR의 원래 locator timeout과 실제 화면 결과는 이 명령으로 재확인해야 합니다.

```powershell
$pw = 'C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:HANI_PLAYWRIGHT = $pw
$env:HANI_PLAYWRIGHT_PATH = $pw
$env:HANI_PLAYWRIGHT_MODULE = $pw
$env:HANI_BROWSER = $chrome
$env:HANI_CHROME_PATH = $chrome
$env:HANI_CHROME = $chrome
node scripts/hani-fun-chat-fortune.test.mjs $pw $chrome
node scripts/hani-fun-top3.test.mjs --browser
node scripts/hani-ilbo-213.test.mjs $pw $chrome
node scripts/hani-ilbo-banner-215.test.mjs $pw $chrome
node scripts/hani-newstaff-215.test.mjs $pw $chrome
node scripts/hani-ocr-accuracy-224.test.mjs $pw $chrome
node scripts/hani-remote-media-219.test.mjs $pw $chrome
node scripts/hani-settings-225.test.mjs $pw $chrome
node scripts/hani-staff-floors-214.test.mjs $pw $chrome
node scripts/hani-tasks-qa-212.test.mjs $pw $chrome
node scripts/hani-theme-white-215.test.mjs $pw $chrome
```

```powershell
node --test --test-isolation=none scripts/hani-release-version-layers.test.mjs scripts/hani-stale39-source.test.mjs scripts/hani-reviewed-release-baseline.test.mjs scripts/hani-save-guard.test.mjs
node --require ./scripts/hani-m9-polish-preload.cjs --require ./scripts/hani-m9-link-preload.cjs --test --test-isolation=none scripts/hani-seoyun-m9.test.mjs
node scripts/hani-building-206-safety.test.mjs
node scripts/hani-polish-205-safety.test.mjs
node scripts/hani-invest-split-safety.test.mjs
node scripts/hani-board-november.test.mjs
node scripts/hani-lounge-billboard.test.mjs
node scripts/hani-desk-mascots.test.mjs --unit
node scripts/hani-helper-bot.test.mjs
node scripts/hani-nav-groups.test.mjs
node scripts/hani-m9-link.test.mjs
node scripts/hani-protected-gate-integration.test.mjs
```

뒤의 문제 후보 명령은 실패 원인을 인계하기 위한 것이며 성공을 예상한다는 뜻이 아닙니다. 은퇴 후보 6개는 성민 대표님께 따로 여쭌 뒤 처리해야 합니다.

## 변경 파일

기존 시험 24개: boardroom-routing, building-206-safety, building-206, dash-218, fun-chat-fortune, fun-top3, helper-275-pins, hero-restore, invest-split-safety, m9-link, nav-groups, ocr-accuracy-224, polish-205-safety, qa-210, qa-report-fixes, reviewed-release-baseline, seoyun-m9, settings-225-qa-guard, settings-225, simplify-225, staff-floors-214, tasks-qa-212, theme-white-215, ui-203b (`scripts/hani-*.test.mjs`).

기존 도우미 2개: `scripts/hani-regression-baseline.mjs`, `scripts/hani-reviewed-release-baseline.mjs`.

신규 시험/도우미/fixture 5개: `scripts/hani-test-repository-evidence.cjs`, `scripts/hani-stale39-source.cjs`, `scripts/hani-stale39-source.test.mjs`, `scripts/hani-stale39-reviewed-source.mjs`, `scripts/fixtures/stale39-legacy-layers.json.gz`. 보고서는 이 파일 하나입니다.

## 미검증·차단·다음 행동

- Chrome/Edge 실제 화면, 배치·넘침·픽셀 AA, OCR locator의 현재 동작은 미검증입니다. 브라우저 실패 후의 하위 단계가 성공했다고 추정하지 않습니다.
- Git executable 기반 검사는 작업 지시로 차단했습니다. 객체 원문 읽기 성공과 Git/원격 최신성 검증 완료를 혼동하지 않습니다.
- 운영 코드/manifest/assets/버전/cache tag/보호 키/내부 기준 버전, Cloud/DB/schema, 배포 설정은 변경하지 않았습니다. 전체 시험 종료 후 hash와 부산물 정리를 확인했습니다.
- 최종 확인: 운영 관련 509개 blob 일치, 은퇴 후보 6파일 원본 hash 일치, 기존 scripts 26개 수정 + 신규 scripts/fixture 5개 + 이 보고서만 남았습니다. 로컬 origin/main 참조도 종료 때 `52c289d`로 동일했습니다. 본문 위의 부산물 정리를 완료했습니다.
- worktree 밖 작업 임시 폴더를 삭제했고, 이 세션 로그로 식별한 실패한 브라우저의 잔여 profile 폴더 48개도 경로 확인 후 제거했습니다. 실제 branch HEAD는 끝까지 `49096de`입니다.
- Notion 착수 쓰기는 자동 승인 검토가 `approval policy is never`로 거절했습니다. 연결 완료/갱신 완료로 보고하지 않습니다. 서윤이 날짜·담당·branch/base·본 표·검증/미검증·승인 대기·다음 행동과 이 원문 링크를 현황판에 기록 후 읽어 확인해야 합니다.
- 다음: 서윤이 변경 검토·커밋/push → 브라우저/Git 제한 없는 재검사 → 성민 대표님께 은퇴 별도 질의. 실제 문제 후보는 별도 범위로 판단하며 이 작업에서 운영을 고치거나 배포하지 않습니다.

## 인수인계 식별 보충

- 작업 ID/상태: stale39 / 시험 정리·가능한 검증 완료, 서윤 인계 대기. 검토 담당: 서윤, 은퇴 결정: 성민 대표님.
- worktree: `C:\Users\홍성민\Documents\HANI_OS_DEV_CLAUDE\stale39`. base는 위 `49096de`, candidate SHA는 미커밋이므로 없음.
- 먼저 읽을 파일: 이 보고서 → 변경 시험 → `hani-stale39-source.cjs`/고정 fixture → 읽기 전용 `hani-test-repository-evidence.cjs`.
- 다른 담당 영향: 기존 release-layer pin/운영 owner/배포 열차는 유지. PR/Preview/merge/Pages/실제 JS/Production read-back은 모두 이 작업에서 미수행·N/A.
- CURRENT/DECISIONS: 과제의 scripts/보고서 한정 범위 때문에 변경하지 않음. 공통 현황/Notion 반영 대기는 이 보고서로 인계.
