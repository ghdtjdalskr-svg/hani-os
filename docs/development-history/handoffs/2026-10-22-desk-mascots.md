# 책상 마스코트 A안 · 도연(Codex)

## 작업 식별

- 갱신: 2026-10-22 KST. 상태: 구현 완료 / 실제 브라우저 검증 차단 / 열차 인수인계 준비.
- 담당: 도연(Codex), 단독 개발. branch `hani/desk-mascots`, worktree `mascots`.
- base/시작 HEAD: `fec691838aec695b575708e3ad7dda7828ea96d0` (v2.9.229).
- 로컬 origin/main: `04fb2b377f28958aec1480ca09244f4567c3a339` (v2.9.230, 1 commit ahead). `git ls-remote origin refs/heads/main` 네트워크 연결 실패. 자동 merge/rebase 없음.
- 종료 시 **main drift 확인**: 로컬 origin/main이 `8fa6823ddd27352de29cf491a4ecb7356f36e855`로 진행(base보다2 commits ahead). 추가 #333은 CURRENT·office-lively-3 handoff 및 office219/actions216/lively 검사6파일만 변경하며 runtime 추가변경 없음. 이 worktree의 기존 기준선/테스트를 자동 교체하지 않았다. 사용자에게 보고했고, 다음 담당은 최신 office219의 기준선 변화도 확인한 뒤 통합 QA할 것. 원격 직접 연결은 여전히 미확인.
- 기준 index: 표시/cache v2.9.229, 마지막 script `hani-launch-greeting.js`(cache tag 없음). 운영 read-back은 이번 기능 개발 범위 밖.
- 승인: 이번 사용자 요청으로 `artifacts/desk-mascots/mapping.md` 전체 및 A안 승인. 전 직원 자기 책상, 예정자 다온·윤슬도 환영물 표시. 지도1440 너비에서32px, 모바일 최소16px.
- 수정 범위: 신규 `hani-desk-mascots.js/css`, `assets/data/desk-mascots-v1.json`, index의 CSS/JS 로딩 두 줄, 전용 browser test 및 지정 art/artifact와 이 인수인계.
- 타 세션 소유 `hani-office-live.js/css`, 표시 버전·cache tag·Storage·Cloud·main·배포 변경 없음.

## 결과와 증거

- CODEMAP living-office owner/API 확인. 공개 floor event 없음. **연결은 공개 `window.HaniBuildingScene` 한 개만 사용**한다. 기존 home anchor와 art 좌표를 조회하고, 기존 지도 data-floor/data-art/가시성 DOM을 MutationObserver로 관찰해 층별 persistent layer를 갱신한다. 본사 함수 wrapping/덮어쓰기·click/tab handler 추가 없음.
- 기존 `placements.json`은 2F/3F 13석의 제안 좌표만 포함. 나머지 1F/4F 6석은 동일 spatial-contract homeAnchor 및 art-map homeFurniture deskBounds를 근거로 보완한다.
- Notion 기존 작업 페이지 fetch 성공. 착수 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절하여 미반영.
- 구현: 층별 persistent layer5개·19명 image slot(1F2/2F8/3F5/4F4/5F0). `z-index:3`으로 floor art0/기존 소품2 위·actor4 아래, 부모/자식 `pointer-events:none`. 배치는 homeAnchor 기준이라 산책·출장 중에도 자기 책상에 남는다. 72×72 투명 source 유지, smooth 기본 보간, 지도 너비의32/1440 비율·최소16px, `loading=lazy`, load→decode 성공 후에만 표시한다. 다른 층/숨긴 view/document/바닥 fallback에서는 숨긴다. 예정자 다온·윤슬은 기존 예정 상태/빈 좌석을 유지하고 피규어만 표시한다.
- runtime 변경: `hani-desk-mascots.js/css`, `assets/data/desk-mascots-v1.json`, `index.html` 로딩2줄. `assets/desk-mascots/`19개 기존 제안 자산 재사용. `mapping.md`/승인 좌표 원문은 수정하지 않음. `runtime-plan.json`은19석별 발 밑 중심/책상 영역과 출처를 기록한 독립 QA 기준.
- **PASS**: `node --check hani-desk-mascots.js`, `node --check scripts/hani-desk-mascots.test.mjs`, `git diff --check`.
- **PASS**: `node scripts/hani-desk-mascots.test.mjs --unit`: 19개 ID/기존 home anchor·offset·deskBounds, 기존13석 좌표 유지,72×72 alpha 실제 파일 헤더, 실제 모듈+본사 renderer DOM 실행. async API 후착, persistent5/19슬롯·기존 actor identity, inactive floor 미요청, decode-before-show·실패 숨김, 층 전환·예정자2·숨긴 view/document/fallback, 중복 로딩, throwing Storage sentinel 미접근. import된 기존 engine6개도 PASS. **실제 픽셀/화면 판정 아님**.
- **PASS**: `node scripts/hani-office-tap-lines.test.mjs --browser`의 Node15개(공통engine6+대사9). 같은 명령의 browser1개는 `spawn EPERM` 차단으로 전체명령 exit1.
- **PASS**: `node scripts/hani-office-actions-221.test.mjs` 20개(공통engine6+action14). `node scripts/hani-office-actions-221.browser.mjs`는 Edge spawn EPERM 차단.
- **PASS**: canonical `assertNoNewDuplicateIds` 검사로 runtime graph66파일 vs base64파일 확인. 기존 중복8개를 늘리지 않아 **신규 중복0**. HEAD exact index에서 신규 로딩2줄만 제거하면 byte동일, 본사 owner JS/CSS도 HEAD와 byte동일. `isolation.json`.
- **BLOCKED/FAIL**: `OFFICE_SOFT=1 node scripts/hani-office-219.test.mjs --browser --labels-only`: 최초 Node의 git subprocess EPERM. Git archive로 기존 지원환경변수 `HANI_OFFICE_TEST_BASELINE`에 임시 기준선 전달 후 실제 실행했으나, 승인된 새 로딩2줄을 기존 index exact-preservation 검사가 거부함. 기존 검사 코드는 수정하지 않았고 **office219 전체 PASS로 보고하지 않는다**. Browser 단계 미도달.
- **BLOCKED**: `node scripts/hani-desk-mascots.test.mjs`: 실제 Edge spawn EPERM. 브라우저 suite는 office 실제 renderer 격리(boot부터 write trap) 및 production index(초기화 후 trap), 390/884/1440×5층을 검사하고 `app-*.png`30장 출력하도록 준비. **실행 PNG0장**. 픽셀±4px·실제 크기·이름표 겹침≤10%·실제 hit-test/선택 캐릭터 대사·console0은 미검증이며 PASS로 표시하지 않는다.
- 증거: `artifacts/desk-mascots/{verification.json,runtime-unit.json,browser-results.json,isolation.json,runtime-plan.json,office-219.log,tap-lines-browser.json,actions-221-unit.json,actions-221-browser.json}`. 이전 `mock-*.png`는 정적 제안이고 앱 screenshot이 아니다.
- 미검증: v230 본사3차 통합 실브라우저, Android, 독립 아린/HINA, Candidate/Release/Preview 승인, 운영. 기능 개발 단계이므로 Full Build/One-Pass/최종 HINA 미수행, 버전 증가는 Claude 열차 담당 소유로 보류.
- 데이터·Storage·Cloud·schema 변경 없음.
- Git: `git add -- <지정 파일>` 시 shared worktree의 `.git/worktrees/mascots/index.lock` 생성이 Permission denied. 이어 `git commit --only -m "feat: add isolated staff desk mascots" -- <지정 파일>`도 신규 pathspec 미등록으로 실패. **미커밋·미push**, HEAD/base `fec6918` 유지. 대표님 지시대로 결과를 이 worktree에 보존하며 Git 권한 우회 없음. commit 가능 후에도 아직 실화면 검증 차단 상태이므로 탑승 완료/운영 완료로 보고하지 않는다.

## 다음 담당에게

- 다음: 허용된 브라우저 환경에서 `node scripts/hani-desk-mascots.test.mjs` 및 요청 회귀 실행→실제 PNG 확인→Claude 열차 통합. 원본 office219의 exact index 보존 검사는 승인된 로딩2줄의 narrow exception을 배포 담당이 검토할 것. 기능 코드 충돌 해결/자동 rebase는 이 탭에서 수행하지 않는다.
- v230 본사 3차와 통합 후 실제 renderer/anchor·층 가시성 회귀 필요. 본사 파일은 수정하지 않는다.
- CURRENT/DECISIONS 미수정. Notion 갱신 대기: 승인 A안의 신규 모듈 구현 착수, base/로컬 main 차이, 검증 결과와 Git 상태를 완료 시 요약한다.
- main 병합/Pages/최신 JS/Production read-back 미수행. 기능 개발 단계, 버전 증가는 배포 담당 소유.

## Notion 갱신 대기

기존 작업 페이지 `https://app.notion.com/p/401c5275707481ffb1abcac9bc28cdf6` fetch 성공. append는 자동 승인 검토에서 거절(`MCP tool call requires approval, but approval policy is never`)되어 미반영. 요약: 2026-10-22 KST 도연, 대표님 mapping 전체/A안 승인, base fec6918·hani/desk-mascots, 별도 모듈/placement data·index2줄로19석 연결(예정석2 포함). 본사 JS/CSS·버전·Storage·Cloud·schema·main·배포 변경0. 전용 DOM 실행·tap Node15·actions20·신규중복ID0/byte보존PASS. Edge EPERM으로 390/884/1440 실화면/PNG0장; office219는 신규2태그 exact-preservation 실패. 실제 브라우저·v230 통합 재검증 후 열차 탑승 판단. 저장소 원문은 이 handoff와 artifacts/desk-mascots/verification.json. 승인 범위는 기능 구현이며 운영 배포 승인이 아니다.

## 2026-10-22 테스트 호환성 보정 · 도연

- 담당/범위: 도연(Codex), `hani/desk-mascots`, 시작 HEAD `e14392f`, 공통 기준 `8fa6823ddd27352de29cf491a4ecb7356f36e855`. 대표님 이번 요청으로 지정 테스트6개만 보정 및 tests-only commit, 이 인수인계 append 승인. CODEMAP 해당 anchor 없음(CODEMAP_MISS), 실제 assertion 검색으로 fallback.
- 기준선: 로컬 origin/main은 `8fa6823`. 원격 ls-remote는 네트워크 실패로 최신성 미확인. 소스 표시/cache v2.9.230, 마지막 script `hani-launch-greeting.js`. 자동 merge/rebase 없음.
- 변경: theme-white의 전체 index 비교에 기존 `withoutDeskMascots(html)` 적용. 나머지5개는 같은 helper로 정확히1회씩 있는 승인 태그2줄만 제외한 **기존 closure** 검증. 원래 missing/파일수/크기/패키지 assertion 유지. 테스트명·로그·Journal artifact scope에 pre-mascot 범위 명시. 브라우저는 실제 index 그대로 로드.
- **미해결 package blocker**: 전체 closure는124파일/누락19건. 새 JSON의 `./assets/desk-mascots/<id>.webp`를 resolver가 `assets/data/assets/desk-mascots/<id>.webp`로 해석한다. 허용목록만으로 해결되지 않아 기존 연결망 검증으로 범위를 명시했다. runtime 변경 금지에 따라 수정하지 않았으며, 새 모듈 포함 전체 package PASS가 아니다. 배포 담당이 별도 범위에서 해결 후 전체 closure 재검증 필요.
- **Node PASS**: `node scripts/hani-goal-progress-ui.test.mjs --static`(20개+binding), `node scripts/hani-office-hd-224.test.mjs`(10개), `node scripts/hani-runtime-closure-ilbo.test.mjs`(3개), `node scripts/hani-staff-floors-214.test.mjs --static`(10개+browser skip1), `node scripts/hani-street-journal-closure.test.mjs`(1개), `node scripts/hani-theme-white-215.test.mjs`(finish/storage/auth/cache 보존).
- 검증 환경: Node24.20.0. Node 내부 git EPERM으로 기존 지원 `HANI_BRANCH_BASELINE`에 `git archive 8fa6823`의 index/main/design-system 원문 임시 추출. `node --test`의 subprocess도 EPERM이므로 파일 직접 실행. 테스트 baseline 코드 변경 없음.
- **추가 PASS**: 변경6개 `node --check`, `git diff --check`, 태그 누락/중복 거부, 무관한 추가 script missing 검출, 기존 history catalog missing 검출. 기존 closure121파일/누락0, 기존128파일·크기 계약 유지.
- **Browser 미검증**: goal-progress/office-hd/staff-floors/theme-white 모두 Playwright index.mjs + Edge exe 인자로 실행했으나 `spawn EPERM`. staff는 기존 skip 처리(exit0), 나머지3개 exit1. 서윤은 이4개 Edge 재실행(HD만 `--browser` 추가). 로컬 실화면 PASS 아님.
- 보존: runtime/index/assets/버전/storage/Cloud/schema 변경0. PR332 소유10개·reviewed-release-baseline·공통 helper·release resolver/contract 변경0. 기존 타 작업 산출물 보존. Candidate/Build/HINA/main/Pages/Production N/A·미수행. CURRENT/DECISIONS 변경 없음.
- **Git 차단**: 테스트6개만 지정한 `git add -- ...`가 공유 worktree의 `.git/worktrees/mascots/index.lock` Permission denied로 실패. 커밋 생성 불가, HEAD `e14392f` 유지. 테스트6개와 이 append는 미커밋 상태로 보존. 다음 담당은 허용된 Git 환경에서 테스트6개만 commit.
- **Notion 갱신 대기**: 기존 작업 페이지 `401c5275-7074-81ff-b1ab-cac9bc28cdf6` fetch 성공. 착수 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 위 날짜/담당/범위/SHA/변경/검증/미검증/package blocker/Git 차단/다음 행동을 같은 페이지에 요약할 내용으로 보존.

## 2026-10-23 PR332 이후 테스트 회귀 보정 · 도연

- 담당/승인: 도연(Codex), `hani/desk-mascots`, HEAD `534e5a8673e793428bc7d1a37c557554a6750140`, main/base `ad3c2f3ed7716f97b81e1b0b66f3f4238a7aa04d`(PR332). 대표님 TESTS ONLY 요청: 지정7종+desk unit·커밋·이 절 append. CODEMAP_MISS로 지정 assertion 검색. 원격 조회 연결 실패로 최신성 미확인; 소스 v2.9.230·마지막 script hani-launch-greeting.js 유지.
- 변경: baseline 공통 `pendingApprovedConnections`에 정확한2행 명시, CURRENT reader/normalizer만 `withoutDeskMascots` 적용(각1회 필수). Git oracle·승인 SHA 불변. 5개 raw reader와 baseline 테스트 CURRENT 쪽 연결, app216 CSS 순서/pending 목록에 mascot CSS/JS 추가. 기존 mutation 유지·제3행 Git 비교 거부·누락/중복/변조 거부 검사 추가. runtime/index/assets/버전/cache/Storage/Cloud 변경0; 타 작업 산출물 보존.
- Node24.20.0 검증: app216 **7/7**, brand218 **3/3**, OCR224 **13/13**, QA210 **9/9**, reviewed-baseline **5/5**, settings225 `--static` **3검사군**, simplify225 **4/4**, desk-mascots `--unit` **6/6 + DOM** PASS. syntax8파일·`git diff --check` PASS. 기본 실행은 app/desk만 완료, 나머지6종은 Git spawn EPERM. 이6종은 셸 `git archive` 원문을 매 읽기 `git ls-tree` blob SHA-1과 대조하는 비커밋 adapter로 검증: `node --import ./artifacts/desk-mascots/pr332-git-show-adapter.mjs scripts/<파일>`(settings `--static`). 기대 바이트는 불변. 증거: `artifacts/desk-mascots/pr332-adapted-*.log`, `pr332-git-oracle/`.
- Browser 미검증: OCR/settings에 Playwright `C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`와 Edge `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe` 인자 전달, 둘 다 **spawn EPERM·exit1**. `pr332-ocr-browser.log`·`pr332-settings-browser.log` 참조. 기존 전체 closure/package blocker는 이번 범위에서 해결·재검증하지 않음.
- Git 차단: 위 테스트/공통 모듈8개와 이 문서만 지정한 `git add -- ...`가 `.git/worktrees/mascots/index.lock` Permission denied로 실패. **미커밋·미push**, HEAD 534e5a8 유지. 다음: 허용된 Git 환경에서 지정9파일 커밋, 기본7종·OCR/settings browser 재실행. 버전/Build/One-Pass/HINA/main/Pages/Production N/A·미수행; CURRENT/DECISIONS 미수정.
- Notion 갱신 대기: 기존 작업 페이지 `401c5275707481ffb1abcac9bc28cdf6` fetch 성공. 착수 append가 자동 승인 검토의 `MCP tool call requires approval, but approval policy is never`로 거절. 위 승인/변경/검증/차단/다음 행동을 요약해 반영할 내용으로 보존.
