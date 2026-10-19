# fix-218 히어로 화풍 재제작 · 도연

## 작업 식별
- 갱신: 2026-10-18 KST / 담당: 도연(Codex)
- 상태: 제작·targeted 검증 완료 / 미커밋·미push / 열차 인계 준비
- branch: hani/fix-218 / 시작 HEAD: a3ca5edb7248fcbddea05243b440bc61271dba90
- 로컬 origin/main: e007a66bc85f656c33e4da746a3ecf7d5cbc6de2; ls-remote 네트워크 차단. 최신 원격은 미확인. merge/rebase 없음.
- 목표: 기존 히어로 4장을 image_gen에 스타일 참조로 전달해 -218 그림3장 재제작, 공식 개구리/CI/직원 반영, 각150KB 이하와 동일 너비 비교 PNG.
- 수정 범위: assets/heroes/{ilbo,organization,investmentCommittee}-218.webp 및 artifacts/fix-218/heroes/ 신규 증거와 이 인수인계. 기존 코드/아트/기록 보존.
- 승인: 대표님의 이번 재제작 요청. 버전/cache·Storage·Cloud·main/배포 제외.
- CODEMAP_MISS: 전용 hero owner 없음. 이전 인수인계의 canonical 이미지 경로와 대상3개만 확인. 코드 수정 없음.
- 기준 표시/cache: index v2.9.217, 마지막 JS hani-ai-budget.js?v=2.9.217. 운영 확인 N/A.
- Notion 계획 append는 자동 승인 검토에서 "MCP tool call requires approval, but approval policy is never"로 거절. 갱신 대기.

## 결과와 증거
- 최종 교체는 요청된 WebP 3개뿐. 720×720, WebP quality90/method6. 코드·CSS·버전·cache·저장/Cloud 변경 없음. 이전 작업 및 이전 증거 파일은 그대로 보존.

| 파일 | bytes (150,000 이하) | 내용 |
|---|---:|---|
| assets/heroes/ilbo-218.webp | 119350 | 민지·공식 CEO 개구리의 편집실 |
| assets/heroes/organization-218.webp | 136134 | 공식 CI 로비·실제 직원9명 단체사진 |
| assets/heroes/investmentCommittee-218.webp | 113482 | 하니·지은 투자 검토 / 차분한 market screen |

### 화풍과 공식 외형을 맞춘 부분
- 세 번의 built-in image_gen 호출마다 ledger.webp, reading.webp, autumn-v2.webp, hani-team-office.webp **4장을 실제 style reference paths로 전달**. 최대5참조 제한에 맞춰 다섯 번째는 각각 공식 CEO 시트, hani-group-ci-official.webp, 지은 프로필. 공식 CI-lobby 및 직원 프로필10장도 육안 확인. CLI/API fallback 없음.
- ledger/reading: 따뜻한 중성 자연광, 낮고 자연스러운 채도, 나무·종이·유리의 입체 질감, 부드럽게 흐려지는 배경 디테일을 반영. autumn/team: 가는 갈색 계열의 끝이 가늘어지는 선, 레이어가 보이는 머리카락, 부드러운 피부/옷 음영, 성인 얼굴/몸 비율, 눈매·속눈썹·작은 코와 입·절제된 볼 홍조를 맞춤. 이전 그림의 chibi/큰 인형 눈·납작한 라벤더 위주 표현을 줄임. 기존 정사각 hero와 같은1:1 구도·잘리지 않는 얼굴/주요 소품 유지.
- 일보: 읽을 수 있었던 외부 공식 ceo-frog-sheet-v1.png를 직접 참조. sage/mint 피부, 검은 머리3가닥, 반쯤 감긴 ㅡㅅㅡ 인상, navy suit, 빨간 tie, 노란 badge 확인. 민지는 기존 coral suit/high ponytail 얼굴로 제작.
- 회사 소개: 실제 HANI GROUP 공식 보라4잎·원형 링·중앙 음각 diamond와 HANI GROUP 표기를 벽면에 반영. 기존 팀 사진의9명을 얼굴/헤어/옷으로 구분: 뒷줄 지은(안경/beige), 수아(검은 bob/navy·파란 scarf), 나은(mint/bob), 히나(pink/꽃장식 bun); 앞줄 수연(ash blonde/blue eyes/teal), 민지(coral/ponytail), 하니(plum/긴 wave), 하루(light blue/긴 brown), 유나(lavender/묶은 brown). 프로필과 비교해 확인. 새 인물·새 로고 없음.
- 투자: 하니의 긴 물결 brown hair/plum suit와 지은의 low bun/안경/beige 유지. 숫자·ticker 없는 낮은 대비 선 그래프와 차분한 협업 장면. 선택 사항인 다온은 추가하지 않음.
- 위 내용은 도연의 직접 육안 확인이며 독립 아린 리뷰나 화풍의 수학적 동일성 보장이 아님. 최종 미감 판단은 대표님 Preview 확인 대상.

### 검증과 증거
- `artifacts/fix-218/heroes/compare-style.png`: 기존 ledger/reading + 신작3장, 모두 동일360px 너비·정사각1:1 프레임으로 나란히 비교. 파일 직접 열어 육안 확인.
- `style-prompts.md`: 최종 프롬프트 전체 및 참조 역할. `style-assets.json`: 최종 bytes·SHA256·원본 생성 경로. `style-export.py`: Pillow로 resize/encoding 및 대표님 요청 비교 PNG만 수행; 수작업 재도색/합성 없음. 원본 생성 PNG는 .codex/generated_images에 보존, 프로젝트 사용 최종본은 위 assets 경로에 저장.
- Python export: 3개 실제 WebP decode/720×720/150,000byte 이하 검사 PASS.
- `HANI_GIT=<bundled git.exe> <bundled node.exe> --test scripts/hani-brand-heroes-218.test.mjs scripts/hani-banners-203.test.mjs`: **4 PASS/0 FAIL**, `style-targeted.log`. 기존 canonical hero owner·3개 경로/용량·버전/보호 write 경로/EOL 검사.
- `<node.exe> artifacts/fix-218/heroes/style-browser.mjs <playwright/index.mjs> <msedge.exe>`: **6뷰(3화면×390/1440)·내부탭12·캡처6 PASS**, `style-browser.log`, `style-preview/audit-after.json`. 기존 runner를 별도 산출물 경로로 복제하고 요청3개화면으로 좁힘. 원본 index/runtime/image의 실제 Edge headless 실행; 외부요청 차단·disposable context. decode·natural720·contain/mask none·opacity1·mobile square·overflow 없음·canonical slot 유지·보호 키 원문 불변·JS오류/누락자산0 확인. 캡처6장 직접 육안 확인. 계정/운영의 저장 상태를 PASS로 주장하지 않음.
- `style-before.json` / `style-preservation.json`: index.html·hero owner JS·CSS·기존 참조4개 SHA256 동일 PASS. Git tracked diff도 요청 WebP3개만. `git -c core.whitespace=cr-at-eol diff --check` PASS.
- 기존 `assets.json`, `audit-after.json`, 앞선 최상위 캡처들은 이전 자산 identity의 과거 근거로 보존. **새 이미지의 최신 근거는 style-assets.json과 style-preview/이며 과거 PASS를 재사용하지 않음.**
- 미수행: 실제 Android·실계정·Cloud·Production/CDN, 독립 아린/HINA, 최종 package/One-Pass·열차 gate. LIGHT asset 변경이며 전체 후보/배포 요청 없음. 서버 Edge Function/설정 동반 배포 없음.

### Git / Notion / 다음 행동
- 명시한 새 산출물·문서·자산만 `git add` 실제 시도. `.git/worktrees/fix218/index.lock` 생성 Permission denied로 실패하여 commit 실행 불가. `style-git-commit.log`. HEAD a3ca5ed 유지, stage 추가 없음, 미커밋·미push·main/배포 없음.
- Notion 계획 추가는 자동 승인 검토가 approval policy never로 거절. 새 이미지/검증/커밋 차단까지 이 인수인계에 갱신 대기로 보존. 저장/read-back 완료로 보고하지 않음.
- 다음 한 가지: 대표님이 비교 PNG를 확인한 뒤 Git 쓰기 가능한 담당이 이번3개자산/새증거/이문서를 선택 commit/push해 Claude 배포 열차에 인계. 기존 fix-218 코드와 함께 포함하되 버전/cache 증가는 배포 담당 경계에서 한 번만 수행. 대표님의 실제 배포 승인·열차 절차 유지.

## 다음 담당에게
- 기존 fix-218 인수인계의 앞선 코드/검증은 보존하며, 새 이미지 identity에 종전 화면 증거를 PASS로 재사용하지 않음.
- main/Pages/운영/독립 아린·HINA/최종 열차 gate 미수행.

## 2026-10-18 후속 · 전체 CHARACTER 통일 (진행 중)
- 담당 도연(Codex), hani/fix-218, 시작 HEAD 0d8a8e25b977ab865522abab8908a2241ac17689. 앞선 커밋과 artifacts 보존.
- 대표님 결정: 모든 hero를 2번 CHARACTER 스타일로 통일. 새 파일만 추가·canonical slot 경로 교체, no version/cache bump, no Storage/Cloud/main/배포.
- 감사: 원본 index 실제 Edge 35nav×2너비70조회 PASS. 활성34는 현재 character 이미지이며 퇴역 work N/A. 구형 heroImages/index preload/투자 표지에 무인물 실사12테마가 남아 있음. 이를 신작12개로 제작 후 해당 canonical slot에도 연결 예정. ledger/reading의 png/webp 중복도 동일 테마로 목록화.
- CODEMAP_MISS(hero owner 미등록), 검증된 hani-ui-v02992.js mainCharacterSidebarMenuConfig/mainCharacterBanner/mountSkeletons 단일 경로 사용. 새 layer·event 추가 없음.
- 수정 범위: 신작 assets/heroes/<view>-218.webp 12개, canonical config·구형 literal refs/preload, 새 비교·프롬프트·감사/검증 산출물과 이 인수인계.
- 원격 ls-remote 실패(네트워크 github.com:443), 최신 main 미확인. 로컬 기준과 배포 버전 v2.9.217/cache·마지막 hani-ai-budget.js 유지.
- Notion 기존 작업 페이지 fetch 성공. 계획 append는 자동 승인 검토 policy never 거절. 최종 결과까지 갱신 대기로 보존.


### 후속 범위 확정
- 무인물 실사12테마와 별도로 대표님 지정 배역을 맞추기 위해 tasks/calendar 및 dev/aiWork/geminiReports/deployment/aiBudget의 기존 인물형7개를 신작으로 제작. 총 신작19개. 기존 인물형 나머지15활성화면(승인3포함)은 유지. 홈 사계절4·기본·공통fallback도 인물형임을 직접 확인.
- 새 이미지 생성은 built-in image_gen만 사용. 승인3개를 각 호출의 실제 style reference로 전달하고, 이전 theme/props1개와 해당 staff reference board1개를 함께 사용. Pillow는 참조판·축소/WebP인코딩·요청 비교 PNG에만 사용.

## ALL HERO CHARACTER · 최종 인수인계 · 2026-10-18 KST

- 담당: 도연(Codex) 1명 + 자동 검사. 상태: 개발·targeted UI 검증 완료, seed PR/배포 열차 인계 대기.
- branch `hani/fix-218`, 시작 HEAD `0d8a8e25b977ab865522abab8908a2241ac17689`, 로컬 origin/main `e007a66bc85f656c33e4da746a3ecf7d5cbc6de2`. 기존4커밋·아트·인수인계·과거 artifacts 보존. 원격 ls-remote는 github.com:443 네트워크 차단, 최신 main 미확인. 자동 merge/rebase 없음.
- 대표님 승인: “2번으로 통일”, 무인물 실사 hero 신작·실제 직원 배역·old/new 비교·4화면390/1440·commit 시도. 버전/cache·Storage/Cloud·main merge/배포 제외.
- **감사 결과**: 활성34 canonical은 시작 때 이미 인물형. 구형 heroImages/preload/투자 표지에 실사 정물12테마(14파일)가 남아 있어 신작12개로 교체 연결. 대표님 지정 배역과 다른 tasks/calendar/개발5메뉴는 인물형 신작7개로 정정. 전체35nav 표와 정확한 전/후 경로는 `artifacts/fix-218/heroes/all-audit.md`. 홈 사계절4·기본/공통fallback·aura도 인물형 확인, 퇴역work는 유지/N/A.
- **신작19개**: built-in image_gen 생성19회 + diet 자세/calendar 숫자 제거 수정2회. 승인3장을 모든 최초 생성의 실제 STYLE REFERENCE로 사용하고 old theme/props 및 staff reference board 전달. `all-prompts.json`/`all-revision-prompts.json`에 전체 프롬프트, `all-final-sources.json`에 선택 원본 경로. CLI/API fallback 없음. Pillow는 참조판/동일크기 축소·WebP인코딩/요청 비교판에만 사용, 생성 아트 수작업 재도색·합성 없음.
- 얼굴: 윤슬 v2 옆땋기+둥근안경, 다온 v2 검은단발, 지은 안경+beige, 도연 적갈색 ponytail+각진안경, 서윤 검은긴머리+앞머리 등 실제 profiles 반영. 선택 사항인 개구리 cameo는 새19개에 추가하지 않았고 승인 일보의 공식 CEO는 그대로 보존. 새 이미지에 별도 문구·로고 없음.
- **연결**: hani-ui-v02992.js canonical config의 presentation 필드만 수정. 기존 compatibility heroImages, index preload/newsroom 정적 경로, hani-ui-v02976.js 투자 hero 및 hani-investment-committee.js 보고서 cover도 같은 literal 경로 사용. 새 renderer/event/저장 경로 없음.
- **표시**: square12는 기존 illustration-218 슬롯 사용. wide7은 canonical 슬롯의 illustration-wide-218 CSS6행으로 전체 구도를 위쪽에 표시하고 copy를 아래에 배치. cover/mask 효과로 개발5명 중 아린이 잘리던 중간 캡처를 확인해 수정했으며 최종8캡처는 수정 후 재생성. old 파일/승인3개는 SHA256 동일.

### 새 runtime 자산 · seed PR에 반드시 포함

| 새 파일 | 크기 | bytes | staff | 이전 테마/크기 참조 |
|---|---:|---:|---|---|
| `assets/heroes/ledger-218.webp` | 362×362 | 47420 | jieun, haru | `assets/heroes/ledger.webp` |
| `assets/heroes/reading-218.webp` | 362×362 | 49558 | yoonseul-v2, minji | `assets/heroes/reading.webp` |
| `assets/heroes/exercise-218.webp` | 362×362 | 53984 | naeun | `assets/heroes/exercise.png` |
| `assets/heroes/diet-218.webp` | 362×362 | 50332 | naeun | `assets/heroes/diet.png` |
| `assets/heroes/study-218.webp` | 362×362 | 46594 | hina, yoonseul-v2 | `assets/heroes/study.png` |
| `assets/heroes/travel-218.webp` | 362×362 | 44228 | sooyeon | `assets/heroes/travel.png` |
| `assets/heroes/investment-218.webp` | 362×362 | 52040 | hani, jieun, daon-v2 | `assets/heroes/investment.png` |
| `assets/heroes/asset-218.webp` | 362×362 | 42688 | jieun, daon-v2 | `assets/heroes/asset.png` |
| `assets/heroes/university-218.webp` | 362×362 | 43936 | haru | `assets/heroes/campus.png` |
| `assets/heroes/movie-218.webp` | 362×362 | 44872 | hina, minji | `assets/heroes/movie.png` |
| `assets/heroes/newsroom-218.webp` | 362×362 | 53102 | hani, minji | `assets/heroes/newsroom.png` |
| `assets/heroes/investmentIntake-218.webp` | 1254×1254 | 149378 | jieun, hani | `assets/heroes/month-end.png` |
| `assets/heroes/tasks-218.webp` | 2171×724 | 147352 | yuna, gaeun | `assets/banner-preview-v1/tasks-kanban-v1.webp` |
| `assets/heroes/calendar-218.webp` | 2169×725 | 146558 | yuna, gaeun | `assets/banner-preview-v1/calendar-planning-v1.webp` |
| `assets/heroes/dev-218.webp` | 2171×724 | 149532 | seoyun, dohyun, serin, yuri, arin | `assets/banner-preview-v1/development-studio-v1.webp` |
| `assets/heroes/aiWork-218.webp` | 2171×724 | 143612 | dohyun, yuri | `assets/banner-preview-v1/ai-work-status-v1.webp` |
| `assets/heroes/geminiReports-218.webp` | 2171×724 | 148500 | serin, dohyun | `assets/banner-preview-v1/dev-reports-research-v1.webp` |
| `assets/heroes/deployment-218.webp` | 2171×724 | 147628 | seoyun, yuri, arin | `assets/banner-preview-v1/deployment-control-v1.webp` |
| `assets/heroes/aiBudget-218.webp` | 2171×724 | 146834 | seoyun, dohyun | `assets/banner-preview-v1/ai-budget-control-v1.webp` |

각150,000 bytes 이하, old와 실제 pixel dimensions/aspect 동일 WebP decode 확인. `all-assets.json`에 최종 SHA256/quality/source 기록. 원본 파일은 삭제/덮어쓰기하지 않음.

### 실제 검증과 미검증

- `HANI_GIT=<bundled git.exe> <node.exe> --test scripts/hani-brand-heroes-218.test.mjs scripts/hani-banners-203.test.mjs scripts/hani-nav-groups.test.mjs`: **5 PASS / 0 FAIL**, `all-targeted.log`. 기존 banner 기대 경로/신규 wide variant만 정정, 보호 token·write·voice·route·EOL assertion 유지. 초기 퇴역work 경로 부수 변경과 patch context EOL 실패는 원본 복원 후 최종 재검증 PASS.
- `HANI_GIT=<git.exe> <node.exe> artifacts/fix-218/heroes/all-preservation.mjs`: **PASS**, `all-preservation.json`. 시작 HEAD와 비교해 기존파일3개는 literal path만, canonical은 presentation 필드만, 그 밖 event/renderer/기능 코드 byte 불변. CSS는 scoped panorama rule만 추가. hani-main.js/기존 hero/승인3개 hash 동일. JS syntax·기존 Storage/Cloud/버전/cache/내부버전 보호 검사 PASS.
- `<node.exe> artifacts/fix-218/heroes/all-browser.mjs <playwright/index.mjs> <msedge.exe>`: **70조회(35nav×2너비)·내부탭8·스크린샷8 PASS**. 실제 index/runtime·원본 자산, disposable Edge headless, synthetic 2026-10-18 19:31 KST, 외부요청 차단. 활성34 단일canonical hero·decode, 새19 literal경로/원래natural size/opacity1/contain/mask none, square 모바일 정사각, 변경화면 overflow없음, 보호 키 원문 보존. JS오류0/누락자산0. `all-preview/audit-after.json`, `all-browser.log`. 첫 실행의 crop/흐림 증거는 최종 PASS로 재사용하지 않음.
- **390/1440 캡처**: `all-preview/{ledger,reading,exercise,dev}-{390,1440}.png` 8장 직접 육안 확인. 개발5명·윤슬 side braid/안경·지은/하루·나은 화면 확인. 이는 도연의 개발 UI 확인이며 독립 아린 검토 아님.
- **비교판**: `artifacts/fix-218/heroes/compare-all.png`, 1140×15335. 승인3장을 상단에 포함하고 nav35별 legacy/시작canonical/최종canonical을 원비율로 나란히 배치. 추가 `new-contact-all.jpg`, `audit-contact-all.jpg`, `extra-contact.jpg` 직접 확인.
- 미검증: 실제 Android·실계정·Cloud/운영CDN·Production 기능 read-back·독립 아린/HINA·최종package/One-Pass/열차 gate. LIGHT 개발 패치이며 release candidate/배포 요청 없음. 서버 Edge Function/설정 동반 배포 없음.
- 버전 **v2.9.217/cache 그대로**, 마지막 script `hani-ai-budget.js?v=2.9.217`. Storage/Cloud/schema/보호owner/내부버전 변경 없음. main/Pages/Production 미진행.
- Notion 계획 append: 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 결과와 seed PR 목록도 갱신 대기로 이 문서에 보존. 저장/read-back 완료로 보고하지 않음.

### Seed PR / 다음 담당

- **seed PR 필요**. 런타임 기존5파일 + tests/handoff/CURRENT + 아래 신규19자산과 산출물을 선택 commit/push 후 Draft seed PR. 배포 담당 Claude가 기존 fix-218 변경과 함께 열차에 모으고 버전은 열차 경계에서 한 번만 증가. 이 탭의 main merge/개별 배포 없음.
- 기존 수정파일: `index.html`, `hani-ui-v02992.js`, `hani-ui-v02976.js`, `hani-investment-committee.js`, `hani-design-system.css`, `scripts/hani-banners-203.test.mjs`, 이 handoff 및 CURRENT.md.
- 다음 한 가지: Git 쓰기 가능한 담당이 아래 신규 파일 누락 없이 seed PR을 준비해 대표님 Preview 확인 후 열차로 인계. 최종 snapshot identity는 `all-identity.json`.

### Git / 최종 상태

- 선택 파일 `git add` 실제 시도: **exit128**, `.git/worktrees/fix218/index.lock` 생성 Permission denied. 해당 Git metadata는 허용 workspace 밖이라 우회/권한 변경 없이 중단. commit 실행 불가, 시작 HEAD `0d8a8e25` 그대로, 새 stage 없음, 미커밋·미push·PR 없음. `all-git-commit.log` 참조. 대표님 지시대로 작업 파일은 남김.
- 원격 최신 main 확인·Git push·Draft seed PR·Notion 최종 공유가 남음. Git 쓰기 가능한 담당이 신규19자산과 아래 목록을 선택 commit/push해야 함. 기존 artifacts의 unrelated untracked 파일을 통째로 stage하지 말 것.
- 최종 화면은 `all-preview/` 및 `compare-all.png`, 최종 hash는 `all-identity.json`/`all-assets.json`. 버전/cache·Storage/Cloud·main/배포 없음.
- 자동 승인 검토가 Notion 계획 append를 `approval policy is never`로 거절해 Notion 저장/read-back 갱신은 미완료. 결과·검증·seed PR 필요 사항까지 이 문서를 수동 동기화 대기 원문으로 보존.

### 이번 후속의 모든 신규 파일

```text
artifacts/fix-218/heroes/all-assets.json
artifacts/fix-218/heroes/all-audit.md
artifacts/fix-218/heroes/all-audit.py
artifacts/fix-218/heroes/all-before-hashes.json
artifacts/fix-218/heroes/all-browser.log
artifacts/fix-218/heroes/all-browser.mjs
artifacts/fix-218/heroes/all-commit.ps1
artifacts/fix-218/heroes/all-compare.py
artifacts/fix-218/heroes/all-eol.py
artifacts/fix-218/heroes/all-export.py
artifacts/fix-218/heroes/all-extra-audit.py
artifacts/fix-218/heroes/all-final-sources.json
artifacts/fix-218/heroes/all-finish.py
artifacts/fix-218/heroes/all-git-commit.log
artifacts/fix-218/heroes/all-handoff.py
artifacts/fix-218/heroes/all-identity.json
artifacts/fix-218/heroes/all-new-files.txt
artifacts/fix-218/heroes/all-plan.json
artifacts/fix-218/heroes/all-preservation.json
artifacts/fix-218/heroes/all-preservation.mjs
artifacts/fix-218/heroes/all-preview/audit-after.json
artifacts/fix-218/heroes/all-preview/audit-before.json
artifacts/fix-218/heroes/all-preview/dev-1440.png
artifacts/fix-218/heroes/all-preview/dev-390.png
artifacts/fix-218/heroes/all-preview/exercise-1440.png
artifacts/fix-218/heroes/all-preview/exercise-390.png
artifacts/fix-218/heroes/all-preview/ledger-1440.png
artifacts/fix-218/heroes/all-preview/ledger-390.png
artifacts/fix-218/heroes/all-preview/reading-1440.png
artifacts/fix-218/heroes/all-preview/reading-390.png
artifacts/fix-218/heroes/all-prompts.json
artifacts/fix-218/heroes/all-refs.py
artifacts/fix-218/heroes/all-revision-prompts.json
artifacts/fix-218/heroes/all-sources.json
artifacts/fix-218/heroes/all-targeted.log
artifacts/fix-218/heroes/all-wire.py
artifacts/fix-218/heroes/all-wiring.json
artifacts/fix-218/heroes/audit-contact-all.jpg
artifacts/fix-218/heroes/compare-all.png
artifacts/fix-218/heroes/extra-contact.jpg
artifacts/fix-218/heroes/new-contact-all.jpg
artifacts/fix-218/heroes/ref-aiBudget.jpg
artifacts/fix-218/heroes/ref-aiWork.jpg
artifacts/fix-218/heroes/ref-asset.jpg
artifacts/fix-218/heroes/ref-calendar.jpg
artifacts/fix-218/heroes/ref-deployment.jpg
artifacts/fix-218/heroes/ref-dev.jpg
artifacts/fix-218/heroes/ref-diet.jpg
artifacts/fix-218/heroes/ref-exercise.jpg
artifacts/fix-218/heroes/ref-geminiReports.jpg
artifacts/fix-218/heroes/ref-investment.jpg
artifacts/fix-218/heroes/ref-investmentIntake.jpg
artifacts/fix-218/heroes/ref-ledger.jpg
artifacts/fix-218/heroes/ref-movie.jpg
artifacts/fix-218/heroes/ref-newsroom.jpg
artifacts/fix-218/heroes/ref-reading.jpg
artifacts/fix-218/heroes/ref-study.jpg
artifacts/fix-218/heroes/ref-tasks.jpg
artifacts/fix-218/heroes/ref-travel.jpg
artifacts/fix-218/heroes/ref-university.jpg
artifacts/fix-218/heroes/staff-contact.jpg
assets/heroes/aiBudget-218.webp
assets/heroes/aiWork-218.webp
assets/heroes/asset-218.webp
assets/heroes/calendar-218.webp
assets/heroes/deployment-218.webp
assets/heroes/dev-218.webp
assets/heroes/diet-218.webp
assets/heroes/exercise-218.webp
assets/heroes/geminiReports-218.webp
assets/heroes/investment-218.webp
assets/heroes/investmentIntake-218.webp
assets/heroes/ledger-218.webp
assets/heroes/movie-218.webp
assets/heroes/newsroom-218.webp
assets/heroes/reading-218.webp
assets/heroes/study-218.webp
assets/heroes/tasks-218.webp
assets/heroes/travel-218.webp
assets/heroes/university-218.webp
```

## 2026-10-18 후속 · 메뉴 담당 canon / 배역 전수 감사 (진행 중)
- 담당: 도연(Codex) 단독 + 자동 검사 / branch hani/fix-218 / 시작 HEAD 1f223da6d591824f456520c6171b476c484ac305. 앞선 커밋과 artifacts 보존.
- 대표님 승인: 추정으로 정한 hero 배역 전수 점검, 코드 역할 canon 표·불일치 전부 기록, 잘못된 자체 -218 자산 재제작, 표시 매핑 정정, cast-audit.png, 선택 commit 시도. 버전·Storage·Cloud·main·배포 제외.
- 범위: hani-ui-v02992.js 표시 데이터와 hani-context-remote-v1.js agent 표시 값, 불일치한 assets/heroes/*-218.webp, artifacts/fix-218/heroes/cast-* 및 이 문서/CURRENT 요약. 새 renderer/event 없음.
- CODEMAP: hero canonical owner 전용 anchor 없음(CODEMAP_MISS). 실제 mainCharacterSidebarMenuConfig / TAB_CHARACTER_LINES / Remote defaults / 조직 rows / Archive roles / Yuna routeIntent를 좁혀 확인.
- 기준: 로컬 origin/main e007a66bc85f656c33e4da746a3ecf7d5cbc6de2, 원격 ls-remote github.com:443 차단으로 최신성 미확인. 현재 index 표시 v2.9.217·마지막 hani-ai-budget.js?v=2.9.217 유지. merge/rebase 없음.
- Notion 기존 카드 fetch 성공, 계획 append는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 완료 아님, 갱신 대기.


## 배역 canon 확정 / 전체 재감사 · 2026-10-18 KST · 도연

### 작업 식별·기준

- 상태: 구현 및 targeted 검증 완료. 시작 HEAD `1f223da6d591824f456520c6171b476c484ac305`, branch `hani/fix-218`. 기존5커밋·이전 아트·과거 artifacts 보존. 이번 원문/identity는 `cast-*`와 `cast-preview/`만 최신 근거다.
- `ls-remote`는 네트워크 차단됐지만 GitHub connector의 `/repos/ghdtjdalskr-svg/hani-os/commits/main` 조회로 원격 main `e007a66bc85f656c33e4da746a3ecf7d5cbc6de2` 확인. 로컬 origin/main과 동일, branch는 main 대비 5 ahead / 0 behind. merge/rebase 없음.
- 최종 범위: 자체 -218 WebP 3개(대학/영화/독서), `hani-ui-v02992.js` 표시 매핑·역할 데이터, `hani-context-remote-v1.js` 담당 표시 데이터, `index.html` 보조그림 URL6개, 관련 tests3개·신규 cast 증거·이 인수인계/CURRENT. 버전 v2.9.217/cache/마지막 `hani-ai-budget.js?v=2.9.217` 그대로.
- UI·Remote의 모든 event/renderer/function 본문, 메뉴 route/ID, 대사 원문·mode, 보호 Storage/Cloud/write 경로 byte 불변. 데이터 migration/schema/auth/서버/배포 변경 없음. HINA gate action `#deployHinaQaBtn` 보존.

### canon 근거와 해석

1. `hani-organization-hub.js`의 `rows`/`rows.push`: 유나 안내·일정, 가은 일정·회의, 나은 건강·운동, 히나 학습, 민지 콘텐츠·문화, 수연 여행·스포츠, 지은 재무, 하루 소비·구매, 수아/채원 기업 업무, 개발실5명 역할. 확장 예정 직원 다온·윤슬은 지원 역할이며 입사 상태를 바꾸지 않았다.
2. `hani-character-archive-data.js`의 각 `sections`/`CORE AREA`/`BOUNDARY`: 하루 **Books·Lifestyle·Everyday Taste** 명시, 민지 Movie/Drama/OTT/Review/Archive, 히나 Japanese/Study/University 학습 지도, 윤슬 독서 길잡이(히나 최종 지도 대체 금지). 조직 대분류만으로 Books를 다른 직원에게 넘기지 않는다.
3. `hani-ui-v02992.js`의 `TAB_CHARACTER_LINES`, `PAGE_CHARACTER_PROFILES`, `mainCharacterSidebarMenuConfig`, `companions`: 실제 배너·대사·프로필 표시 owner. `hani-context-remote-v1.js`의 `defaults`: Remote 담당. 아래 표가 이 작업의 **단일 메뉴→담당 기준**이며 화면별·재무/콘텐츠별 예외 이유를 명시했다.
4. `hani-yuna-helpdesk.js`의 `inferKind`/`routeIntent`/`parse`: 유나가 task/book/movie/travelWish/diary를 접수하고 금융/정밀 운동은 전문 메뉴로 안내한다. **접수자 유나를 모든 도메인의 주담당으로 해석하지 않는다.** 라우팅·저장 구현은 수정하지 않았다.
5. 회사 소개/홈/AI 팀/AURA/직원 아카이브는 전체 팀 소개이며 하니는 안내 화자. 승인 organization 그림은 실제 M9 9명 대표사진으로 유지했다. 19명 전원이 그려졌다고 주장하지 않는다. 하니일보(회사 주간신문)와 newsroom(금융 시황·종목 뉴스)은 구별한다.

### 단일 메뉴 → 담당 직원 표

| 메뉴 / view | 주담당·지원 | 최종 hero에 실제 그려진 인물 | 역할 판정·적용 범위 |
|---|---|---|---|
| 대시보드 `home` | 전원 / 하니 안내 | 하니·나은·히나·유나 (가을); 계절별 상세는 아래 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 인포데스크 `intake` | 유나 | 유나 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| HANI 본사 `agentReview` | 하니 / 수아·유나 지원 | 하니·수아·유나 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 컨퍼런스 룸 `monthlyReport` | 하니 / 수연·수아·유나 지원 | 하니·수연·수아·유나 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 회사 소개 `organization` | 전원 / 하니 안내 | 하니·지은·수아·나은·히나·민지·수연·하루·유나 | 전원 담당/하니 안내. 승인 그림은 M9 9명 대표 단체사진이며 확장 직원 19명 전원 사진이라는 뜻이 아님. |
| HANI 일보 `ilbo` | 민지 | 민지 + 공식 회장 개구리 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| HANI 라운지 `board` | 하니 / 유나·서윤 지원 | 하니·유나·서윤 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 투자 `investment` | 하니 / 지은·다온 지원 | 하니·지은·다온 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| HANI 투자 리포트 `investmentCommittee` | 하니 / 지은 지원 | 하니·지은 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 자산 업데이트 `investmentIntake` | 하니 / 지은 지원 | 하니·지은 | 하니 투자/지은 원본 숫자 대조. 유나는 접수·전문 메뉴 안내이며 투자 owner가 아님. |
| 자산 `asset` | 지은 / 다온 지원 | 지은·다온 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 가계부 `ledger` | 지은 / 하루 지원 | 지은·하루 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 뉴스룸 `newsroom` | 하니 / 민지 지원 | 하니·민지 | 재무 메뉴의 시장·종목 뉴스 분석은 하니, 기사·콘텐츠 지원 민지. 회사 주간신문 ilbo의 주담당은 민지. |
| 계체량 측정 `diet` | 나은 | 나은 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 헬스클럽 `exercise` | 나은 | 나은 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 성민의 서재 `reading` | 하루 / 윤슬 지원 | 하루·윤슬 | Archive 하루 CORE AREA에 Books 명시 + 기존 Remote/TAB 대사 하루. 윤슬 독서 길잡이 보조. 공부·대학·시험 지도는 히나이며 민지 Movie/Drama와 구분. |
| 공부 `study` | 히나 / 윤슬 지원 | 히나·윤슬 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 낭만 캠퍼스 라이프 `university` | 히나 | 히나 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 자격증 `certificate` | 히나 | 히나 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| Wish-list `wishlist` | 하루 / 수연 지원 | 하루·수연 | 하루 Wishlist·소비/구매 검토, 수연 장소·경험 보조. 유나는 접수·전달. |
| 여행 `travel` | 수연 | 수연 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 시청 아카이브 `movie` | 민지 / 수연 지원 | 민지·수연 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 스포츠 `game` | 수연 / 민지 지원 | 하니·민지·수연·수아·나은·하루·히나 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 일기 `diary` | 하루 | 하루 | 하루 Lifestyle·Everyday Taste의 개인 일상 동행. 민지 문화 콘텐츠 기록과 구분. 유나는 접수 담당. |
| 할 일 `tasks` | 유나 / 가은 지원 | 유나·가은 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 캘린더 `calendar` | 유나 / 가은 지원 | 유나·가은 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| Drive `drive` | 수아 / 유나 지원 | 수아·유나 | 수아 Document·기업 업무 + 유나 분류·연결. 채원 B2B 후속 지원. 저장 동작 수정 없음. |
| AI 업무 현황 `aiWork` | 도연 / 유리 지원 | 도연·유리 | 개발 작업 실행·검사는 도연/유리, 서윤은 설계·통합 총괄. |
| 개발센터 `dev` | 서윤 / 도연·세린·유리·아린 지원 | 서윤·도연·세린·유리·아린 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 개발 보고서 `geminiReports` | 세린 / 도연 지원 | 세린·도연 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 배포센터 `deployment` | 서윤 / 유리·아린 지원 | 서윤·유리·아린 | 서윤 배포 통합 + 유리 품질/아린 UI. 히나 최종 Release Gate는 메뉴 owner와 별도이며 기존 gate 불변. |
| AI 주간 예산 `aiBudget` | 서윤 / 도연 지원 | 서윤·도연 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 테마 스튜디오 `aura` | 전원 / 하니 안내 | 하니·유나·히나·하루·나은 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 설정·데이터 `settings` | 유나 / 지은 지원 | 유나·지은 | 유나 System Desk 안내 + 지은 보관·백업 자료 확인. 실제 보안·Cloud·저장 owner/구현은 바꾸지 않음. |
| 사내 규칙 - OPERATIONS GUIDE `policy` | 수아 | 수아 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| 업무 보조 - WORK ASSISTANT `work` | 수아 / 채원 지원 | 퇴역 view N/A · 보존된 fallback 테마는 수아 | 수아 기업 업무/채원 지원. 퇴역 view로 실제 hero는 없으며 기존 업무 테마 fallback만 보존. |
| AI 팀 - HANI GROUP `aiTeam` | 전원 / 하니 안내 | 하니·지은·수아·나은·히나·민지·수연·하루·유나 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |
| characterArchive `characterArchive` | 전원 / 하니 안내 | 독립 hero 없음 · 직원별 프로필 | 조직도 역할·Archive 전문영역과 대표님 배역 canon에 따름. |

### 발견한 불일치 전부와 조치

Gemini의 “9탭 차이” 숫자를 검증 결과로 재사용하지 않았다. 실제 코드의 **서로 다른 원천끼리의 차이**와 **같은 오배역으로 일치했지만 역할 canon과 다른 경우**를 모두 아래 기록한다. `—`는 정의가 없어 실제 Remote가 HANI fallback을 사용했다는 뜻이다.

| 메뉴 | 시작 Remote / TAB 대사 / 배너 owner | 불일치 및 해결 |
|---|---|---|
| `ilbo` | —(HANI fallback) / 민지 / 민지 | Remote HANI 기본값을 명시 담당으로 정정(기본 action/target 동일) |
| `investmentIntake` | 유나 / 하니 / 하니 | remote를 하니으로 정정 |
| `asset` | 하니 / 지은 / 지은 | remote를 지은으로 정정 |
| `exercise` | 나은 / 수연 / 나은 | line를 나은으로 정정 |
| `reading` | 하루 / 하루 / 민지 | banner를 하루으로 정정; 실제 그림 윤슬·민지 → 하루·윤슬 재제작 |
| `study` | 하루 / 히나 / 히나 | remote를 히나으로 정정 |
| `university` | 히나 / 히나 / 하루 | banner를 히나으로 정정; 실제 그림 하루 → 히나 재제작 |
| `certificate` | 하루 / 히나 / 히나 | remote를 히나으로 정정 |
| `wishlist` | 유나 / 하루 / 하루 | remote를 하루으로 정정 |
| `travel` | 유나 / 수연 / 수연 | remote를 수연으로 정정 |
| `movie` | 히나 / 민지 / 민지 | remote를 민지으로 정정; 실제 그림 히나·민지 → 민지·수연 재제작 |
| `diary` | 유나 / 하루 / 하루 | remote를 하루으로 정정 |
| `tasks` | 수아 / 수아 / 수아 | remote·line·banner를 유나으로 정정 |
| `calendar` | 수아 / 수아 / 수아 | remote·line·banner를 유나으로 정정 |
| `aiWork` | —(HANI fallback) / 서윤 / 서윤 | line·banner를 도연으로 정정; Remote HANI 기본값을 명시 담당으로 정정(기본 action/target 동일) |
| `dev` | 수아 / 서윤 / 수아 | remote·banner를 서윤으로 정정 |
| `geminiReports` | —(HANI fallback) / 세린 / 세린 | Remote HANI 기본값을 명시 담당으로 정정(기본 action/target 동일) |
| `deployment` | 히나 / 서윤 / 수아 | remote·banner를 서윤으로 정정; 히나 최종 Release Gate 권한·버튼은 유지 |
| `aiBudget` | —(HANI fallback) / 서윤 / 서윤 | Remote HANI 기본값을 명시 담당으로 정정(기본 action/target 동일) |
| `settings` | 하니 / 유나 / 유나 | remote를 유나으로 정정 |
| `policy` | 하니 / 수아 / 수아 | remote를 수아으로 정정 |
| `work` | —(HANI fallback) / 서윤 / 수아 | line를 수아으로 정정; Remote HANI 기본값을 명시 담당으로 정정(기본 action/target 동일) |

추가로 확인한 표시 데이터 불일치:
- `CHARACTER_REGISTRY`: 수연의 identity `Activity Coach`/authority `운동·스포츠·여행`가 조직도(여행·스포츠), 나은 건강·운동 canon과 충돌. 수연을 `Travel & Sports`, 나은을 건강·운동 주담당으로 영역 텍스트만 정정. 성격·말투·대사·호칭·의료 안전 경계 원문은 보존.
- 홈 `companions.hinaJones`: 문화 담당 히나 + 구형 히나 극장 그림 → 민지 + 재제작 영화(민지·수연). `companions.harukei`: 활동 담당 하루 + 구형 걸음 그림 → 나은 + 기존 exercise-218. **HINA JONES·HARUKEI 10K 브랜드 이름/계산·집계는 보존**. index template의 기존 key와 renderer를 그대로 사용한다. 나머지 HASDAQ/NE100/JISPI/HINKEI225도 승인된 자체 -218 투자·운동·가계부·공부 그림에 연결해 도메인 밖 보조 인물 혼선을 없앴다. 기존 파일은 보존하며 총 URL6개만 정정.
- 미사용 compatibility `genericHeroScenes`: 규정/배포/일기/할 일/캘린더/개발/설정의 fallback 인물이 실제 canon과 달랐다. 각 수아/개발팀/하루/유나/유나/개발팀/유나로 literal data만 정정. heroImages에 이미 있는 dev-218 경로1개를 연결했으며 이 helper를 새 활성 layer로 만들지 않았다.
- Reading은 원래 Remote/TAB/Archive(Books)가 하루였는데 그림과 배너 owner만 민지였다. 하루·윤슬로 복구한다. Study/University/Certificate와 어학·시험지도는 히나(+윤슬)로 유지. Diary의 하루는 Lifestyle·Everyday Taste 역할로 유지하며 접수자 유나 Remote만 정정.
- Newsroom 하니·민지, InvestmentIntake 하니·지은, Drive 수아·유나는 도메인 주담당과 접수/자료 지원의 구별로 해결했다. 그림은 이미 canon과 맞아 보존.

### 실제 인물 대조 범위·근거

- 활성34 view + 퇴역 work1 + 비노출 policy/aiTeam/characterArchive도 표에 포함. `assets/heroes/*-218.webp` **22개 전부**가 활성 view 경로에 포함되는지 확인하고 실제 이미지를 열어 대조. 그 외 활성 banner-preview/design-system/sports hero12개도 대조했다.
- 프로필 기준: 히나 검은 꽃장식 bun/분홍, 하루 긴 loose brown/하늘색, 민지 높은 ponytail/coral, 수연 ash blonde/blue eyes/teal, 나은 brown bob/mint, 지은 low bun/안경/beige, 하니 긴 wave/plum, 유나 묶은 brown/lavender, 수아 black bob/navy/파란 scarf. 개발팀 서윤 black long/bangs, 도연 auburn ponytail/각진 안경, 세린 long honey-brown/흰 coat, 유리 short dark/흰 blouse, 아린 long side braid/pink. 윤슬 v2 side braid/둥근 안경/mint, 다온 v2 black bob/navy. `cast-profiles.jpg`를 모든 hero와 직접 비교했다.
- 홈 계절 실제 인물: spring 유나·히나·나은·하니; summer 하니·히나·나은·유나; autumn 나은·하니·히나·유나; winter 하루·민지·지은·수아. 계절별 모임은 도메인 담당 대체가 아니며 metadata cast와 일치. 기본 home/team fallback/AI team은 M9 9명, policy/퇴역 work 테마는 수아. learning helper의 중심 히나 + 지은/하니, picnic helper M9도 확인. 기존 자산 덮어쓰기 없음.
- `cast-before.jpg`, `cast-alternates.jpg`: 시작 이미지 전체/계절·기본·fallback. `cast-audit.png`: **50카드**, view별 의도 담당·최종 실제 인물·이미지 + 계절/홈 지표6개/퇴역·독립 hero 없음 표시. `cast-plan.json`은 위 표를 재현하는 구조화 근거이며 별도 런타임 owner layer가 아니다.
- 재제작3회 모두 built-in image_gen. 승인 ilbo/organization/investmentCommittee -218 3장을 실제 스타일 참조로 전달. 대학은 히나 프로필+이전 대학을 edit target, 영화는 민지/수연 프로필, 독서는 하루/윤슬-v2 프로필을 identity 참조. `cast-generation.json`에 최종 전체 프롬프트·원본 경로. CLI/API fallback 없음. Pillow는 resize/WebP encoding 및 요청 audit/contact layout에만 사용.

### 검증 결과·한계

- `cast-assets.json`: 자체 `university-218.webp` 45,490B / `movie-218.webp` 45,848B / `reading-218.webp` 51,878B. 모두 기존362×362·WebP decode·150,000B 이하. 승인3개 포함 다른 -218 **19장 SHA256 동일**.
- `HANI_GIT=<bundled git.exe> <node.exe> --test scripts/hani-hero-cast-218.test.mjs scripts/hani-brand-heroes-218.test.mjs scripts/hani-banners-203.test.mjs scripts/hani-nav-groups.test.mjs scripts/hani-context-remote.test.mjs`: **7 PASS / 0 FAIL**, `cast-targeted.log`. 새 테스트는 실제 selector·profile·banner resolver·Remote defaults를 VM 실행해38메뉴 owner·이름·portrait·HINA gate target을 검증. 기존 안전 assertion은 유지하고 승인된 owner/역할 변경 기대값만 정정했다.
- `<node.exe> artifacts/fix-218/heroes/cast-preservation.mjs`: **PASS**, `cast-preservation.json/log`. 기존 대사 원문/mode·성격/말투·모든 UI/Remote 함수/이벤트/renderer·Storage/Cloud·index 버전/cache·보호 파일 hash·수정 밖 EOL 불변. index는 이미지URL6개만, Remote 기존 action/target 및 generic fallback 동작 불변.
- `<node.exe> artifacts/fix-218/heroes/cast-browser.mjs <playwright/index.mjs> <msedge.exe>`: 실제 원본 앱의 **35nav×390/1440=70조회, 내부탭/지표/계절20검사, 캡처28장 PASS**. `cast-preview/audit-after.json`, `cast-browser.log`. 활성34 단일 hero·decode·quote/배너/Remote owner 일치, 새3개 contain/no-mask·모바일 정사각/overflow없음, 보호 키 원문 불변, JS오류/누락자산0. 홈 지표6개와 계절4개를 두 너비에서 실행했다. 외부요청 차단, disposable Edge, 실제계정 없음.
- 대학/영화/독서390·1440 캡처6장을 직접 열어 얼굴·머리·옷·전체구도 확인. 나머지 변경 owner 화면/홈 지표도 `cast-preview`/contact에 보존. 개발자 직접 UI 확인이며 독립 아린/HINA 리뷰라고 보고하지 않는다.
- 초기 Node2실패는 이전 owner 기대값 때문에 발생해 허용된 역할 데이터 기대값을 정정하고 최종7검사 재실행. 초기 브라우저 계절 fixture는 showView가 season을 갱신해1실패; read-only `syncSeasonCollection()` 호출 순서로 fixture를 수정 후 전체70조회 재실행. 이전 실패는 `cast-targeted-initial.log` / `cast-preview/audit-initial-season-fixture-failed.json`에 보존하며 최종 PASS로 재사용하지 않는다.
- 미검증/N/A: 실제 Android·실계정/저장/Cloud·운영CDN·독립 아린/HINA·최종 package/One-Pass·열차 gate·main/Pages/Production read-back. LIGHT 표시·아트 패치이며 release candidate/배포 요청 없음. 서버 Edge Function/설정 동반 배포 없음.

### Notion·Git·다음 담당

- Notion 카드 `3fdc5275707481f986bed71118ff14f4` fetch 성공. 계획 append는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never`로 거절. 최종 결과(3장 배역 정정/38메뉴/7Node·70UI PASS/커밋 상태/열차 대기)도 이 문서에 갱신 대기로 남긴다. 저장/read-back 완료로 보고하지 않는다.
- 다음 한 가지: 이 문서의 단일 담당표와 `cast-audit.png` Preview를 확인하고, Git 쓰기 가능한 배포 담당이 이번 범위를 선택 commit/push 후 기존 fix-218 작업과 함께 Claude 열차에 인계. 버전 증가는 열차 후보 경계에서 한 번만. 대표님 최종 배포 승인·기존 HINA gate 유지. 커밋 시도 결과는 다음 절에 실제 기록한다.

### 이번 선택 commit 시도 결과

- 실제 `git add -- <자산3·runtime3·tests3·handoff/CURRENT·cast-* 증거>` 실행. 외부 Git 메타데이터 `.git/worktrees/fix218/index.lock` 생성 **Permission denied**, exit128로 stage 실패. commit 실행 조건을 충족하지 못해 커밋 생성 없음. `cast-git-commit.log`. staged 변경0, HEAD `1f223da6d591824f456520c6171b476c484ac305` 유지. 요청대로 수정분은 미커밋으로 보존. push/PR/main/배포 없음.
- 최종 감사판50카드·캡처28장/contact 직접 확인. 단체 실제 인물은 확대 확인 후 명단 정정: 월간 보고 하니·수연·수아·유나, 스포츠는 하니·민지·수연·수아·나은·하루·히나7명. 스포츠 담당은 수연/민지이며 나머지는 팀 동료 cameo다. 조직 승인 그림은 M9 9명. 추정으로 전원을 기록하지 않았다.
- 최종 identity/검증 묶음은 `cast-evidence.json`, 신규 파일 목록은 `cast-new-files.txt`. 기존 artifacts/fix-218의 다른 untracked 파일은 stage 시도 대상에 넣지 않았다. Notion 최종 요약도 갱신 대기. 다음은 Git 쓰기 가능한 담당의 선택 commit/push·Claude 열차 인계이며 별도 배포 승인 필요.
