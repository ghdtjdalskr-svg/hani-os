# 히어로 와이드 복원 · 도연

## 2026-10-21 회귀 10종 후속 · 착수

- 담당 도연(Codex), 단일 Agent. branch `hani/hero-restore`, 시작 HEAD `5bcacdf`, fork base `925d9e1`(v2.9.225). 기존 서윤 실 Edge 시각 검증 및 대표님 “좋아졌어” 평가는 사용자 전달 근거이며 이번 Node 검증과 구분한다.
- origin/main 캐시 `3908ff8`(v2.9.226, 자산 입력 개선). fetch는 FETCH_HEAD 권한 거절, ls-remote는 github.com:443 연결 실패. 자동 merge/rebase하지 않는다. 최신 main의 intake 변경은 이 범위에서 가져오지 않고 관련 assertion을 현재 main+승인된 hero/remote delta와 일치시킨다.
- 범위: 지정된 회귀 10종, 필요 시 실제 UI 회귀 최소 수정, index+참조 JS/CSS의 origin/main 대비 신규 duplicate-id 방지, Node 재검증·표 작성·commit 시도. 버전/cache·Storage/Cloud·hani-deploy-bridge 제외. 로그인/내비게이션 기존 소유 경로 보존 확인.
- CODEMAP_MISS: hero/remote/login/nav 전용 항목 없음. codemap의 nav targeted test 및 실제 owner/symbol로 fallback. 기존 다른 담당 artifact 변경은 보존한다.
- Notion 허브 fetch 성공. 착수 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절하여 반영 대기. 권한 요청 없이 저장소 인수인계에 상태를 보존한다.

## 작업 식별

- 갱신: 2026-10-21 KST / 도연(Codex), 단일 개발 Agent.
- 상태: 구현·Node targeted 검증 완료 / 실제 브라우저 검증 대기 / 미커밋·미push·탑승 보류. branch `hani/hero-restore`, base/HEAD `925d9e181564770594d2e1a98fa5bc1d59433914`, v2.9.225.
- 원격: ls-remote github.com:443 연결 실패. 로컬 origin/main=HEAD, 최신 원격은 미확인. 자동 merge/rebase 없음.
- 승인: 대표님 요청의 wide art·기존 canonical hero/remote·targeted tests·스크린샷·commit 시도. 버전/cache·Storage/Cloud·main/배포 제외.
- 범위: hani-ui-v02992.js의 단일 config/renderer, hani-design-system.css, hani-context-remote-v1.js, 관련 테스트, 신규 *-226w.webp 및 artifacts/hero-restore.
- CODEMAP_MISS: 전용 hero/remote owner 항목 없음. 실제 symbol mainCharacterSidebarMenuConfig/mainCharacterBanner/updateBanner와 기존 targeted tests로 fallback.
- 아트 기준: dev-center/banner-art-direction-prompts.md 공통 규칙 및 218 hero-style 인수인계의 ledger.webp/reading.webp/autumn-v2.webp/hani-team-office.webp 실제 참조. 배역은 218 정정 유지, movie만 대표님 명시적 217 예외.
- 기준선: index v2.9.225, 마지막 script hani-launch-greeting.js(캐시 태그 없음), 마지막 버전 태그 hani-ai-budget.js?v=2.9.225. 실제 Production 로딩 미확인.
- Notion: 허브 fetch 성공, 착수·최종 append 모두 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 완료 아님. 최종 요약을 아래에 보존하고 반영 대기.

## 결과와 증거

- 기존 owner `mainCharacterSidebarMenuConfig/mainCharacterBanner`에서 eyebrow·한국어 짧은 부제·한마디 슬롯, full-width cover와 왼쪽 mask/gradient를 복원했다. square/세로 배치용 218 CSS layer를 삭제하고 기존 단일 renderer를 사용한다. 모바일 기존236px shell에 메뉴별 focal과 fade를 적용했다. 실제390 crop/글자·버블 가독성은 미검증이다.
- 217 그림 복원: 시청 아카이브(`hina-cinema-canonical.webp`, 팝콘·3D 안경), 투자 리포트, 체중량, 여행. 이미 wide인 218 AI업무/개발/예산/캘린더 등은 현 배역을 유지한다.
- 정사각218에서 인물을 보존한 새 wide11장: `asset`, `exercise`, `ilbo`, `investment`, `investmentIntake`, `ledger`, `newsroom`, `organization`, `reading`, `study`, `university`의 `assets/heroes/*-226w.webp`. 각150KB 이하, 총1,524,070bytes. image_gen11호출, 기존 square+실제 승인 wide3장을 각 호출 참조. 생성 후 원본 크기 그대로 WebP 인코딩만 수행, stretch/합성/기존 파일 덮어쓰기 없음.
- **시청 배역 예외:** 218 담당은 민지·수연이지만, 대표님이 직접 지정한217 그림은 하루·히나·민지다. 그림은217, 담당/한마디/Remote 담당 민지는 그대로 유지한다. [전체 자산표](../../../artifacts/hero-restore/inventory.md)에 명시.
- Remote는 기존 `updateBanner` 내부에서 `sidebar-{season}-v*.webp`만 사용한다. 메뉴와 별개로 계절을 따르며 `syncSeasonCollection→Remote.update` 기존 호출을 유지한다. 현재화면 chip·메뉴명·담당·4개 round 버튼·bottom-only scrim/불투명 텍스트 backing/단일 click·persistent slot은 보존. Remote CSS는 변경하지 않았다.
- 증거: [README](../../../artifacts/hero-restore/README.md), nav35+내부2 인벤토리, 217/225/복원 **아트** 비교4장, 생성 prompt/ref/source, 자산 크기/hash, runtime hash, UI delta 정확 역변환. 아트 비교는 실브라우저 캡처 대체 증거가 아니다.
- 검증: 신규 `hani-hero-restore.test.mjs` 4 PASS, simplify225 4 PASS, banners203·cast218·remote224 node-only PASS. VM에서 실제 기존 hero/Remote 함수를 실행해 persistent25회, 사계절×모든 config/unknown route, hero.sceneImage 접근 금지·write0 확인. 변경 JS/browser syntax 및 CR-at-EOL diff check PASS. [명령·제한 전체](../../../artifacts/hero-restore/verification.md).
- 부분/차단: brand218은 nav test1 PASS, 역사/remote Git blob subprocess2개 `spawnSync git EPERM`으로 차단. 전체 PASS가 아니다.
- **실제 Edge before/after 모두 `spawn EPERM`: 390/1440 측정0·캡처0.** 요청된 시청·서재·회사·라이프 리포트·대학·Remote 전후24장은 미생성. 실제 렌더링/포커스·이벤트/모바일 crop/overflow·새 계절 배경의 AA 미검증. `scripts/hani-hero-restore.browser.mjs --before`는 정확한 UI delta만 역변환해225를 제공하며, 허용 환경에서 전후 실행 가능하다.
- 데이터/Cloud/schema: 새 write·migration 없음. index.html/hani-main.js/hani-context-remote.css diff0; 표시 v225/cache 불변. 보호 경로·control·버전 surface는 UI delta 역변환/음성 검사로 보존 확인. 실제 계정/생활 데이터·Cloud 접근 N/A.
- Git: explicit `git add`가 `.git/worktrees/herofix/index.lock` Permission denied. 신규 테스트/아트/인수인계를 포함한 `git commit --only`도 미등록 pathspec으로 실패. **미커밋·미push 상태 보존, HEAD925d9e1 그대로.** main/Pages/표시버전 실제 로딩/Production read-back 미수행.
- PR/Preview: PR 없음, 실제 Preview screenshot 없음. seed PR/열차 후보/One-Pass/독립 HINA/아린 review/운영 배포는 미수행.

### Seed PR · 먼저 반영할 신규 자산

`artifacts/hero-restore/seed-files.txt`가 동일 목록 원문이다. 참조 없는 seed11개를 먼저 반영한 뒤 기능 열차를 통합한다. 별도 Edge Function·Cloud/schema·설정 또는 배포 순서는 없다.

```text
assets/heroes/asset-226w.webp
assets/heroes/exercise-226w.webp
assets/heroes/ilbo-226w.webp
assets/heroes/investment-226w.webp
assets/heroes/investmentIntake-226w.webp
assets/heroes/ledger-226w.webp
assets/heroes/newsroom-226w.webp
assets/heroes/organization-226w.webp
assets/heroes/reading-226w.webp
assets/heroes/study-226w.webp
assets/heroes/university-226w.webp
```

### Notion 반영 대기 요약

도연 / 2026-10-21 KST / hani/hero-restore / base925d9e1. 와이드 hero·eyebrow/짧은 부제/버블·soft fade 복원, Remote 자체 계절 세로 아트. 218 배역 보존 및 movie217 대표님 지정 예외. 신규 wide11개 seed 필요. Node targeted PASS, 실제390/1440·전후24장·AA·역사 Git blob 일부검사 차단. Git index.lock 권한 거절로 미커밋/미push·탑승 보류. Storage/Cloud/버전/main/배포 변경 없음. 다음: 허용 환경 실브라우저 QA→대표님 Preview→seed→Claude 열차. 착수·결과 Notion 저장 모두 자동 승인 never 거절로 반영 대기.

## 다음 담당에게

- 먼저 `artifacts/hero-restore/README.md`와 `verification.md`, 기존3개 owner diff, `scripts/fixtures/hero-restore-ui-delta.json`을 읽는다. UI delta는 기존225 보존 검사에만 사용하며 새 상태의 동작은 별도 신규 테스트로 검증한다.
- 다음 한 가지 행동: 브라우저 허용 환경에서 `node scripts/hani-hero-restore.browser.mjs --before`와 같은 파일의 after 실행 및 Remote224 실제 AA 검사. 실패하면 담당 도연에게 기능 수정으로 돌린다.
- blocker: browser/Git subprocess·Git index write·Notion 승인 정책. 대표님의 코드를 직접 수정하는 작업은 필요 없다. 권한 있는 담당에게 worktree 파일 상태 그대로 인계한다.
- 이후 신규11자산 seed PR→Claude 열차 통합. 대표님 Preview/최종 승인과 release gate는 별도. 이 구현 승인을 main/배포 승인으로 해석하지 않는다.
- CURRENT에는 구현/검증/미검증/미커밋 사실만 추가, 타 담당 과거 기록 보존. DECISIONS 새 공통 결정 없음.

## 2026-10-21 REMOTE 세로 아트 정정 · 착수

- 담당 도연(Codex), `hani/hero-restore`, 시작 HEAD `274997a961c03216d5de7c600c5eda5ebb7593bb`, base/origin-main 캐시 `925d9e181564770594d2e1a98fa5bc1d59433914`. 원격 ls-remote는 github.com 연결 실패로 최신성 미확인. 기존 히어로 복원 커밋과 서윤의 wide/fade/eyebrow/subtitle 검증을 보존한다.
- 범위: remote owner 이미지 선택, 관련 Node/browser 테스트·fixture와 작업 기록. 버전/cache·Storage/Cloud·히어로 renderer·main/배포 제외. LIGHT UI + 선택 로직 NORMAL targeted regression. CODEMAP_MISS: remote/hero owner anchor가 없어 지정 owner/symbol로 fallback.
- 지정 원본 `60db7b5:hani-context-remote-v1.js`: 계절별 2장+공통 4장, 전체 12장, crypto/Math.random 선택을 `season:viewId` Map에 유지한다. 고정 도메인그룹 매핑은 없다. 실제 217의 선택 및 계절 변경 시 현재 화면의 계절 2장 재선택을 기존 update 경로에 복원한다. observer/event layer 추가 없음.
- 완료 목표: context-remote 세로 배경(생활 600×1000, 계절 320×800), 원본 선택과 동등성/안정성·cover·얼굴 focal·하단 scrim·AA, 3개 도메인 그룹 캡처, commit 시도.

### 정정 결과와 증거

- 상태: **구현·Node 검증 완료 / 실제 화면·AA·요청 PNG 미검증 / 미커밋·미push**. HEAD `274997a` 유지. 성민 대표님이 전달한 서윤의 기존 wide heroes/fade/eyebrow/subtitle 검증을 보존하며, 이번 실제 브라우저 PASS로 재사용하지 않는다.
- runtime 변경은 `hani-context-remote-v1.js`의 기존 `updateBanner` 이미지 선택 블록뿐이다. `assets/seasonal-collection/sidebar-*.webp` 사용을 제거하고 `assets/context-remote/` 원본 12장을 사용한다. 각 계절 2장과 공통 생활 4장 중 crypto 우선·Math fallback으로 선택하여 `season:viewId` Map에 보존한다. 계절 전환 시 현재 화면은 원본처럼 계절 2장 중 재선택한다. 페이지 hero의 이미지/변형이나 문구 갱신은 배경을 재추첨하지 않는다.
- 기존 `syncSeasonCollection → remote.update → updateBanner` 경로를 재사용한다. observer/handler 추가 없음. persistent card/image/버튼, chip/title/담당/4개 원형 버튼, `cover`, `50% 30%` focal, bottom-only scrim CSS는 그대로다. **focal의 실제 얼굴 노출과 AA는 이번 환경에서 미확인**이다.
- 원본 추출 fixture `scripts/fixtures/context-remote-217-selection.json`와 `scripts/hani-remote-217-oracle.mjs`는 217의 선언·선택·renderer·계절 observer callback을 직접 실행한다. 고정 도메인 그룹 매핑을 새로 만들지 않았다. 대표님의 예시 `life-brunch-v1.jpg`는 해당 계절 후보의 index 4다. 원본 계절 JPG는 320×800, 생활 `*-v1.jpg`는 600×1000임을 decode로 확인했다.
- 테스트/기록 변경: `scripts/hani-hero-restore.test.mjs`, `.browser.mjs`, `scripts/hani-remote-card-224.test.mjs`, 위 oracle/fixture, 기존 UI delta fixture, CURRENT, 이 인수인계와 `artifacts/hero-restore/remote-217-*`.

실행 결과(동일 worktree, 이번 수정 소스):

| 명령 | 결과 |
| --- | --- |
| `node --check hani-context-remote-v1.js` 및 수정한 browser/oracle 3개 syntax | PASS |
| `node scripts/hani-hero-restore.test.mjs` | 4 PASS. 전 메뉴+unknown의 계절 전환·재방문을 217 oracle와 대조, crypto/Math 양쪽 및 8개 entropy 값, 원본12장 세로 decode, 반복 갱신·write0·정확한 UI 역변환 보존 |
| `node scripts/hani-remote-card-224.test.mjs --node-only` | PASS. context-remote/217 선택·라벨·슬롯25회·write0 및 기존 scrim pixel sampler 음성 검사 |
| `node scripts/hani-simplify-225.test.mjs` | 4 PASS. UI 외 바이트/EOL·보호 경로·메뉴 보존 |
| `node scripts/hani-banners-203.test.mjs` | PASS |
| `node scripts/hani-hero-cast-218.test.mjs` | PASS, 메뉴 owner38개 및 프로필 경로 보존 |
| `git diff --check` | PASS |
| `node scripts/hani-hero-restore.browser.mjs` | BLOCKED, Edge `spawn EPERM`, 측정/캡처0 |
| `node scripts/hani-remote-card-224.test.mjs --restore-217` | BLOCKED, Edge `spawn EPERM`, 0 cases. `remote-217-browser.json` 기록 |
| `node scripts/hani-brand-heroes-218.test.mjs` | 1 PASS, 2개는 `spawnSync git EPERM`으로 기준 blob 읽기 차단. 기능 회귀 PASS로 표기하지 않음 |

- **요청한 `remote-*.png`는 0장으로 미생성**이다. 브라우저 명령은 시청(movie)·투자(investment)·학습(study) 3그룹 ×4계절 ×390/1440 ×밝음/어두움=48조건의 원본 선택/세로 비율/실제 cover/상단 무차광/AA 및 각 버튼 hover·focus를 검사하도록 갱신했다. 가을·밝음 조건의 요청 캡처 경로는 `artifacts/hero-restore/remote-{movie,investment,study}-{1440,390}.png`다. 실제 촬영 전까지 Preview 증거로 사용하지 않는다.
- 데이터/버전/배포: 버전/cache 및 hero renderer 파일 변경0, Storage/Cloud/schema/migration/자산 변경0. 실제 계정/Android/서버 HINA/Production은 범위 밖이며 N/A, release version은 열차 담당 단계이므로 이번에는 증가하지 않는다. main merge/Pages/Production read-back 수행 없음.
- Git: `git add -- <이번 owner/tests/fixture/handoff>`는 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/herofix/index.lock: Permission denied`로 실패했다. 이어 `git commit --only -m "fix: restore remote 217 portrait artwork selection" -- <같은 경로>`를 실제 시도했지만 신규 oracle/fixture pathspec 미등록으로 실패했다. **미커밋 보존**, push 미시도. 다른 기존 untracked 아트/비교판을 덮어쓰거나 삭제하지 않았다.
- Notion: 현황판 읽기는 성공. 정정 결과·검증·차단 요약을 끝에 추가하려 했지만 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절했다. 갱신/read-back 완료 아님. 위 구현·검증·미검증·Git 실패·다음 행동을 Notion에 반영하는 일이 대기다.

### 다음 담당에게 · 정정 후속

- 먼저 이 절과 원본 fixture, `remote-217-verification.md`, `remote-217-browser.json`을 읽는다.
- 다음 행동: 허용 환경에서 `node scripts/hani-remote-card-224.test.mjs --restore-217` 실행 → 실제 AA·얼굴 focal 및 `remote-*.png` 6장 확인. 기존 hero 검증을 다시 수행할 필요가 없다면 remote targeted 결과만 추가한다. 실패는 해당 기능 담당에게 돌린다.
- 이후 이번 정정을 동일 `hani/hero-restore`에 commit/push하고 Notion 갱신. 대표님 Preview와 Claude 배포 열차는 별도이며 이번 요청은 main/배포 승인이 아니다. 동반 Edge Function·설정·배포 순서 변경 없음.
- CURRENT에 이번 확인 사실만 앞에 추가했다. DECISIONS 공통 정책 변경 없음. 원격 최신성·Git 쓰기·browser 실행·Notion 자동 승인 차단이 남아 있으며 **탑승 완료가 아니다**.

## 2026-10-21 회귀 10종 후속 · 결과 / 서윤 인계

- 담당: 도연(Codex), 단일 Agent. branch `hani/hero-restore`; 시작·종료 HEAD `5bcacdf` 유지, fork base `925d9e181564770594d2e1a98fa5bc1d59433914`(v2.9.225). origin/main 캐시 `3908ff8ae4d43150ef1cbc62880913c0f308faec`(v2.9.226)은 작업 종료에도 동일하다. fetch는 FETCH_HEAD 권한, ls-remote는 github.com 연결 실패로 원격 최신성 미확인. merge/rebase 없음.
- 상태: **지정 10종 Node 부분 + 추가 4개 명령 PASS / 브라우저 회귀 해소 미검증 / 이번 수정 미커밋·미push**. 이전 서윤 시각 확인과 대표님 “좋아졌어”는 전달받은 승인 근거로 보존한다. 그것을 이번 전체 회귀 PASS로 해석하지 않는다.
- 승인 범위: wide hero/fade/eyebrow/짧은 부제 복원, 배역 유지, Remote 217 context-remote 세로 아트 및 회귀 정리·duplicate-id 가드·commit 시도. 버전/cache·Storage/Cloud/schema·hani-deploy-bridge·main·배포 제외.

### 실패 assertion별 분류

`a`는 승인된 UI 기대값 갱신, `b`는 동일 내용 줄의 EOL 복원, `c`는 실제 기능 회귀다. main에서도 실패하던 역사적 보존 검사에는 `stale`을 별도로 표시했다. 서윤의 전체 suite 원문 로그는 제공되지 않았으므로 아래는 로컬 재현, 남아 있는 브라우저 JSON, 해당 assertion 코드에서 확인한 범위다. 원인이 확정되지 않은 브라우저 실패는 해결 PASS로 쓰지 않는다.

| 검사 | 정확한 실패 / 관측 | 분류와 변경 | 이번 결과 |
| --- | --- | --- | --- |
| `hani-banners-203-ui` | `art.fit === 'contain'`, `art.mask === 'none'`, illustration 전용 flex/grid·3:1/정사각 슬롯 기대 | a. 기존 `*-218.webp`도 wide cover+soft fade를 사용한다. 실제 이미지 3:1·cover·mask·eyebrow/subtitle·persistent slot을 확인하도록 변경. viewport/overflow/이미지 decode/버전·저장소 검사는 유지 | `--node-only` PASS. 실제 화면 검사는 서윤 재실행 대기 |
| `hani-brand-heroes-218` | `one canonical photo UI connection: <p class="sub">PC의 Google Drive 안에 'HANI OS Vault'…` 실제 0, 기대 1 | stale. 현재 설정 UI를 한쪽에서만 과거 사진 UI로 역변환하던 비교를 제거. 공통 조상 통합본과 **정확한 hero/remote delta만 역변환한 소스 15개 전체 바이트**를 비교해 기존 control/auth/write/version/EOL을 보존한다 | 3 tests PASS |
| `hani-login-a-204` | v225 제공 기준 Node 실패 재현 없음. 최신 캐시 main226을 직접 비교하면 `HANI_DISPLAY_VERSION unchanged`: 실제 `2.9.225`, 기대 `2.9.226` | 후속 main drift에 의한 비교 기준 차이. 기능 브랜치 버전 증가 금지에 맞춰 공통 조상의 release 기준을 사용. 로그인/인증 source 변경 0. 실제 `syncSeasonCollection`, 4계절·default, persistent login slots, write0 및 gate·recovery·protected owners 원문 보존 검사를 실행 | 전체 Node PASS, 보존 SKIP 없음. 실제 login gate UI는 서윤 대기 |
| `hani-nav-groups` | `assert.match(bannerContext.banner.description,/HANI 본사입니다/)`: 실제 `중요한 안건을 함께 검토해요` | a. 승인된 짧은 부제를 정확 비교. 본사 제목/owner, 35개 nav route·7그룹, cleanup 재실행, 조직도 탭/scroll, 네이티브 button collapse handler·aria 상태와 quote bridge 동작 검사를 유지. 전체 duplicate-id 가드 연결 | PASS |
| `hani-proactive-204` | v225 제공 기준 Node 실패 재현 없음. main226 비교 시 `hani-main.js versions preserved except approved cache additions and obsolete display fallback` | main drift 기준 차이. 공통 조상 release/control 기준으로 비교하고 feature diff는 working tree만이 아니라 fork base부터 전체를 검사. 기존 EOL·저장소/Cloud 새 write 금지 검사는 유지 | 8 tests PASS |
| `hani-qa-210` | `hani-context-remote-v1.js retained EOL:   };` | b. runtime 125행의 동일 내용 LF를 원래 CRLF로 복원. exact UI delta fixture의 같은 바이트만 동기화 | PASS |
| `hani-qa-210` 후속 | Vault 및 index 보존에서 설정225 역변환을 현재에만 적용하던 비대칭 비교 | stale+a. 기준과 현재에 같은 exact settings/simplify 역변환 적용. legacy 보호 검사에서 hero/remote도 검토된 exact delta만 역변환. 전 소유자·버전·write·id·EOL 비교와 실제 contrast audit 음성 검사는 유지 | 전체 9 tests PASS |
| `hani-remote-card-224` | 기존 브라우저 `artifacts/remote-card-224/after.json`: 132 cases 중 20개, `home upper source pixels unchanged`, `maxDelta=76`, `minLuminanceRatio=.349767…`; `investment maxDelta=109`. 같은 JSON에 decoded context-remote JPG가 기록됨 | stale 측정 실패+a 세로 아트 계약 유지. 두 캡처 사이 텍스트·pseudo-element 제거로 이미지 합성 경로가 달라졌을 가능성은 **추론**이다. 텍스트를 양쪽에서 숨기고 하단 gradient 레이어를 유지한 reference로 보정. 상단 54% 전 영역을 **제외 박스 없이** 샘플링하며 기존 `maxDelta<=1`, luminance `>=.98` 유지. source 217 oracle, cover/focal, AA·control·overflow 조건 유지. runtime CSS 변경 0 | `--node-only` PASS: 선택/slot/write0, sampler 상단·양끝·scrim 직전 음성 검사. **20개 브라우저 실패 해소는 미검증**, 서윤 대기 |
| `hani-remote-media-219` | 기존 `artifacts/remote-219/after.json`: `remote uses its own tall season artwork`, `identity.src.endsWith('/sidebar-autumn-v2.webp')`; summer/winter에도 `sidebar-*` 기대 | a. 217 원본 12장 membership·decoded 세로 비율·per-view hero와 다른 src를 검사. 계절 전환은 `context-remote/summer-[12].jpg`, `winter-[12].jpg`. 217 정확 선택·persistent node/버튼/write0·pixel sampler를 remote224와 공통 Node helper로 실행. AA/실제 action 결과/overflow 검사는 유지 | `--node-only` PASS. 브라우저 대기 |
| `hani-settings-225` | `hani-design-system.css reviewed UI source`: 실제 hash `1883ed37…`, 기대 `b27a98a1…` | a. 승인된 hero CSS exact delta만 역변환한 뒤 통합 기준본 hash와 비교. settings status VM·127개 source ID/109개 계획 ID·원문 control/notice·reset/보호안내 변조 거절 검사는 유지. 배포별 오래된 전체 파일 hash 대신 공통 조상 실파일을 사용 | `--static` PASS |
| `hani-theme-white-215` | `only exact reviewed settings/simplify/offline entry markup changes`: index 전체 비교 불일치 | stale. 현재에만 설정/simplify225를 역변환하던 비교를 양쪽에 동일 적용. Finish palette/실제 apply·fallback·save, 기존 login gate·auth/storage owner와 모든 URL/cache 비교 유지 | Node PASS |

현재 Node에서 입증된 `c` 회귀는 없다. 실제 AA·overflow·JS error·login gate·이벤트 회귀가 없다는 브라우저 판정은 하지 않았다. 특히 remote224는 임계값을 낮춰 PASS 처리하지 않았으며, 보정한 측정 방식의 실제 효과를 서윤이 확인해야 한다.

### 기준선 / 안전 / 검증 증거

- `scripts/hani-regression-baseline.mjs`는 기본적으로 `git merge-base HEAD origin/main`의 통합 기준본을 읽는다. 이 기능 브랜치의 v225와 후속 main v226을 혼동해 버전을 올리지 않는다. duplicate-id는 별도로 **origin/main 자체**와 비교한다. 현재 main226의 `hani-main.js`는 base225 대비 표시 버전 1행만 다르며, auth/nav 함수는 같다. intake 관련 index·asset 변경은 이 브랜치에 가져오지 않았다.
- Node에서 git subprocess가 EPERM이므로 PowerShell/.NET으로 Git blob 원문을 `artifacts/hero-restore/regression/main225`, `main226`에 내보냈다. `HANI_BRANCH_BASELINE=main225`, `HANI_MAIN_BASELINE=main226`, `HANI_PROACTIVE_TEST_BASELINE=main225`로 직접 제공했다. 마지막 경로의 `runtime.diff`는 `git diff 925d9e1 --unified=0 -- hani-main.js index.html hani-study-v02984.js hani-goal-progress.js hani-yuna-helpdesk.js`의 원문이다. 보존 검사를 SKIP하거나 baseline을 현재 파일 복사로 만들지 않았다.
- 실행 명령: 표의 10개 `node scripts/hani-<이름>.test.mjs`(명시한 Node/static 옵션 사용), 추가 `node scripts/hani-duplicate-id-guard.test.mjs`, `node scripts/hani-hero-restore.test.mjs`, `node scripts/hani-simplify-225.test.mjs`, `node scripts/hani-hero-cast-218.test.mjs`. **14개 명령 전부 exit0**. 변경·신규 mjs 전부 `node --check`, remote runtime syntax 및 `git -c core.whitespace=cr-at-eol diff --check` PASS. plain diff check의 CR 경고를 데이터 whitespace 수정으로 오해해 LF로 재변환하지 않았다.
- duplicate-id: `scripts/hani-duplicate-id-guard.mjs` + `.test.mjs`, nav test에서 자동 실행. 각 snapshot의 index 참조 graph를 따라 JS/CSS 및 local module/CSS import를 한 번씩 읽는다. HTML+JS/CSS literal 합산 후 `count>1 && current>main`을 거절한다. 62파일 대62파일, **신규 중복 0 / 기존 중복 literal 8종**. JS·중첩 CSS·escaped literal·기존 중복 증가·신규 중복 음성 케이스 통과. `data-id`는 id로 오검출하지 않는다. literal 검사이며 실제 DOM 중복 0을 의미하지 않는다.
- 증거: [Node 명령/exit](../../../artifacts/hero-restore/regression/node-results.json), [runtime·test SHA256/환경/기준 SHA](../../../artifacts/hero-restore/regression/identity.json), 같은 폴더의 `*.before.log`, `*.baseline225.log`, `*.after.log`. 기존 서윤 브라우저 `remote-card-224/after.json`, `remote-219/after.json`은 이번에 덮어쓰지 않았다.
- runtime 수정은 **remote 125행 EOL 한 개뿐**이다. 이번 HEAD 대비 `index.html`, `hani-main.js`, `hani-ui-v02992.js`, `hani-design-system.css`, `hani-context-remote.css`, `hani-deploy-bridge.js` diff0 확인. 버전/cache/HANI_DISPLAY_VERSION 불변. Storage/Cloud/schema/write·migration 변경0; 실제 계정/데이터 접근 N/A. UI 동작 source나 새로운 handler/renderer는 추가하지 않았다.
- Git: 명시한 작업 파일만 `git add` 시도 → `.git/worktrees/herofix/index.lock: Permission denied`(exit128). 이어 `git commit --only -m "test: align hero restore regressions and guard duplicate ids" -- <작업 파일>` 실제 시도 → 신규 guard/baseline/helper가 index에 등록되지 않아 pathspec 실패(exit1). **이번 수정 미커밋 보존 / HEAD5bcacdf 유지 / push·PR 없음**. 기존 다른 담당 artifact·PNG·작업 파일은 add/삭제/되돌리기하지 않았다.
- Notion 허브 읽기 성공. 착수·검증 완료 append 모두 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절했다. 저장/read-back 완료가 아니다. 이 절 전체 요약(10종 분류·14 Node PASS·브라우저 대기·Git 차단·다음 행동)이 Notion 반영 대기 내용이다.
- Build/One-Pass/HINA/아린/Candidate Freeze/버전 증가/main merge/Pages/Production read-back은 이번 기능 담당 범위 밖으로 수행하지 않았다. 서버 Edge Function·설정 변경·추가 배포 순서 없음.

### 다음 한 가지 행동

서윤이 동일 소스에서 지정 10종의 브라우저 부분을 다시 실행한다. `hani-remote-card-224.test.mjs`의 full 모드는 전체 hero view×1440/390×light/dark, `--restore-217`은 3그룹×4계절을 검사한다. **상단 픽셀/AA/overflow/실제 controls·login gate/JS error 결과를 이 절에 추가**하고, 실패하면 정확한 assertion과 source/test hash로 도연에게 돌린다. 이후 권한이 있는 환경에서 위 작업 파일과 신규 helper를 함께 commit/push하고 Notion을 저장·read-back한다. 대표님 코드 수동 수정은 필요 없다. 열차 탑승/최종 Preview/배포 승인은 별도다.

CURRENT에는 이번 Node 확인 사실·미검증·미커밋만 추가했다. DECISIONS 공통 정책 변경은 없다.
