# 다온·윤슬 공식 입사 반영

## 작업 식별

- 작업 ID / 제목: join-daon-yoonseul / 본사 장면 제외 공식 입사 반영
- 갱신 시각(KST): 2026-10-23
- 담당 도구 / 검토 담당: 도연(Codex) / 배포 담당 서윤
- 상태: 구현·targeted 검증 완료 / Git 커밋·push 차단 / 서윤 검증 인계 대기
- 저장소 / branch / worktree: hani-os / hani/join-daon-yoonseul / join
- base SHA: af2fd6d75aa30947987e45f1e6fd976d49464fe5 (v2.9.231)
- 목표 / 완료 조건: 다온·윤슬을 본사 장면 외 팀·조직·도감·직원 기반 게시판에 정식 직원으로 포함, 지정 회귀 검사 및 커밋.
- 수정할 파일·범위: hani-main.js, hani-organization-hub.js, hani-character-archive-data.js 및 필요 시 archive renderer / board / hani-ui-v02992.js; 두 사람 예정 상태를 고정한 테스트만 좁게 수정.
- 사용자 승인 근거: 2026-10-23 대표님 공식 입사 승인. 사원·2F·기존 팀/역할·외형·대사 보존.
- 승인되지 않은 경계: 본사 장면 소유 파일 전부, storage/Cloud/schema, 버전/cache 변경, main 병합/배포.
- 기준선: 지정 branch·HEAD 일치, clean 시작. git ls-remote origin refs/heads/main은 GitHub 네트워크 실패로 최신성 미확인. 자동 merge/rebase 없음.

## 결과와 증거

- Scoped Discovery: dev-center/codemap.json에 조직/도감/게시판 기능 anchor가 없어 CODEMAP_MISS, 지정 owner 파일 검색으로 fallback.
- 변경 파일: hani-main.js, hani-organization-hub.js, hani-character-archive-data.js, hani-character-archive.js, hani-ui-v02992.js. 테스트 6개: scripts/check-organization-hub.mjs, hani-board-living.test.mjs, hani-board-relationship.test.mjs, hani-character-archive.test.cjs, hani-newface-217.test.mjs, hani-newstaff-215.test.mjs.
- 변경 내용: 두 사람 status active / registration registered, 사원·2F 유지. 도감의 AI STAFF·기존 seniority 설명에 2026-10-23 입사 기록(별도 입사일 필드 없음). 설정 원문·설명에서 예정 좌석/입사 준비 문구 제거. 초상 로딩·404 fallback은 imageKey로 유지. 조직 카드와 상세는 공식 직원으로 표시.
- 기존 hani-board.js는 수정하지 않음: 기존 명부 필터·페르소나·작성자 선택 경로가 두 사람을 포함하는 것을 실행 검증. 기존 대사·목소리, 향후 예정 직원 제외 필터, generic plannedBadge 유지. 기존 관계 seed에 없는 신규 두 사람은 원래 프로필/명부 목소리 fallback을 그대로 사용.
- 본사 장면 소유 파일 모두 무변경. 신규 두 사람 homeSeat 없음·office residents 제외 유지. 본사 2F 예정 명부 UI 검증의 기존 기대값도 유지. 배포 2.9.233에서 별도 세션이 좌석 반영할 범위.
- 데이터·저장소·Cloud·schema 영향: 없음. primary write 경로·내부 baseline version·표시 버전 2.9.231·cache tag 무변경. index.html은 시작 SHA와 바이트 전체 일치.

### 통과한 검사 (기준 af2fd6d + 이 문서의 작업 diff)

- 변경 JS/CJS/MJS 11개 모두 `node --check`, `git diff --check` PASS.
- `node scripts/hani-board.test.mjs`, `hani-board-203a.test.mjs`, `hani-board-community.test.mjs`, `hani-board-guard.test.mjs`, `hani-board-library.test.mjs`, `hani-board-living.test.mjs`, `hani-board-relationship.test.mjs`, `hani-board-views-211.test.mjs`, `hani-board-vocative.test.mjs`: 9개 명령 PASS. 저장·rollback·unknown field·Cloud conflict 검사도 기존 경로에서 실행.
- `node scripts/hani-character-archive.test.cjs`: PASS. 원래 초기 인물 10명 Canon 보존 검사는 유지, 이미 원문 문서에 없던 신규 두 사람만 기존과 같은 제외 범위 유지.
- `node scripts/hani-newstaff-215.test.mjs --unit`: 3그룹 PASS. 직원 명부 19명·도감 12명, 두 사람 registered, board selectAuthors에 두 사람 포함, 기존 main 카드 renderer 실행.
- `node scripts/hani-newface-217.test.mjs`: 5그룹·decoded 자산 11개 PASS. 초상/thumbnail 경로·픽셀·용량·원래 보존 hash 검사, 두 사람 본사 좌석 비활성 유지.
- `node scripts/hani-staff-floors-214.test.mjs`: Node 10개 PASS, 실제 Edge 1개 SKIP(spawn EPERM). 프로필 owner 경로·closure·실제 office renderer fixture·persistent actor 슬롯 검사 포함. 브라우저 PASS 아님.
- `hani-qa-210-followup.test.mjs`: 직접 실행은 Git subprocess EPERM. 기준 af2fd6d 원본을 shell `git show`로 byte 그대로 export한 뒤 `HANI_QA_TEST_BASELINE` 및 `HANI_QA_EOL_BASELINE`을 그 경로로 지정하여 14/14 PASS. 테스트 소스 무변경, version/cache/write/id/기존 줄 EOL 보존 검사 통과.
- 기존 `hani-duplicate-id-guard.mjs`로 index+참조 JS/CSS 67개를 af2fd6d export와 비교: 새 중복 ID 0, literal ID 전체 count map 동일(기존 중복 8은 변화 없음).
- VM 실행 비교: 도감의 다른 10명 객체 전체 동일, 두 사람의 image·tagline·team·role·areas·성격·대사 등 상태 외 정보 동일. 정규 직원 19명 및 organizationOverviewData 집계 19. generic 도감 planned 배지는 합성 예정 직원에 정상 유지.
- 로컬 증거: `artifacts/join-daon-yoonseul/safety-summary.json`, `qa210-followup-exported.log`, 각 테스트 `.log` 및 `artifacts/newface-217/`. export/로그는 검증 산출물이며 commit 대상 아님.

### 미통과 / 미검증 및 기존 실패

- `OFFICE_SOFT=1 node scripts/hani-office-219.test.mjs`: 직접 실행은 `spawnSync git EPERM`. 스크립트가 원래 지원하는 `HANI_OFFICE_TEST_BASELINE`에 실제 Git 원문 217/218/230을 export하여 재실행한 결과 `index.html preserved` 실패: 현재 2.9.231 vs 고정 기준 04fb2b3의 2.9.230 cache tag. index.html 전체가 작업 시작 SHA와 byte-identical이므로 이 패치 이전의 실패. geometry/atlas/pose/5개 clock 단계 후 index 보존에서 멈춤. office219 테스트와 baseline·본사 소유 파일은 수정하지 않았으며 전체 PASS로 표시하지 않음. 서윤이 release 기준선 확인 필요.
- `node scripts/hani-qa-210.test.mjs`, `node scripts/hani-reviewed-release-baseline.test.mjs`: 내부 `spawnSync git EPERM`으로 검사 완료 불가. 보존 oracle/helper를 이 작업 범위 밖에서 완화하거나 변경하지 않음. 서윤 재실행 시 입사 승인 diff 및 v231 기준으로 strict preservation 기대값도 확인 필요.
- 실제 브라우저: archive integration 및 organization check에 아래 명시적 인자를 전달했지만 `browserType.launch: spawn EPERM`. 실화면·390/1440 layout·404 fallback·실제 클릭 동작 PASS를 주장하지 않음. newstaff 브라우저 경로는 승인 상태만 좁게 갱신하고 본사 예정 행 기대값은 보존했으나 실제 실행 대기.
- 추가로 넓게 선택된 boardroom 테스트는 live-meeting/recovery PASS, cross-review/voice-contract는 subprocess EPERM, routing은 별도 rebuilt Edge source 인자 필요. 게시판 입사 상태 작업의 서버/배포 범위 밖이므로 수정하지 않음.
- 실제 운영 데이터/Android/Production read-back, package/One-Pass/HINA: 기능 담당 범위 밖으로 미수행. 버전 증가는 서윤 열차에서만 수행.

### Git / 공유 상태

- `git add -- <지정 12개 파일>` 시도: 실제 Git 관리 경로 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/join/index.lock`에 Permission denied. 현 writable root 밖이며 .git은 읽기 전용이다. 권한 우회·main 수정·reset·merge/rebase 없음.
- `git commit --only -m "fix(staff): register Daon and Yoonseul as joined staff" -- <지정 12개 파일>`도 시도했으나 add가 불가능해 새 인수인계 파일이 Git 미등록 pathspec으로 실패. 커밋 성공으로 기록하지 않음. 최종 `git diff --check` PASS.
- 커밋·push 완료 아님. 변경 파일은 이 worktree에 보존. 서윤/허용 환경에서 지정 파일만 add/commit 후 push 필요. PR 없음.
- Notion: 개발 게시판 착수 카드 생성 후 읽기 확인 완료. https://app.notion.com/p/401c527570748146b04ee257ee296597 . 최종 결과 insert_content는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 완료 결과·blocker·검증 근거 및 카드 상태 변경은 미반영이며, 위 결과와 원문 링크를 서윤이 갱신해야 한다. 탑승 대기/완료로 표시하지 않음.
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 운영 단계 미수행. 표시 버전 v2.9.231 유지 예정.

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: 본 문서, organization rows/people/renderOverview, archive 신규 두 사람 정의와 page header, main team/teamMeta/teamCard. board의 personaMap/selectAuthors는 변경 없이 사용.
- 다음 한 가지 행동: 서윤이 이 worktree의 지정 파일을 커밋·push하고 허용 환경에서 아래 브라우저·기존 보존 검사를 재실행한 뒤 열차에 탑승. 본사 redesign 변경과 기능 충돌은 담당 세션에서 확인.
- 브라우저 재실행 공통 인자: `"C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"`.
- 재실행: `node scripts/hani-newstaff-215.test.mjs <공통 인자>`, `node scripts/hani-character-archive-integration.test.cjs <공통 인자>`, `node scripts/hani-staff-floors-214.test.mjs <공통 인자>`, organization preview server 기동 후 `node scripts/check-organization-hub.mjs <공통 인자>`. archive-ui는 기존 runner가 argv를 읽지 않으므로 `NODE_PATH=<runtime node_modules>`와 `HANI_QA_CHROME=<Edge exe>`로 기존 테스트를 실행. office219는 `OFFICE_SOFT=1`로 원본 그대로 재실행하고 기존 v230/v231 충돌을 먼저 확인.
- 함께 배포할 Edge Function·설정·순서: 없음.
- blocker: Git 관리 경로 쓰기 권한 없음, 원격 main 최신성 네트워크 확인 불가, Edge/Git child process 제한, 기존 office219 v230/v231 oracle 충돌. 새 데이터·배포 승인 요청 없음.
- CURRENT / DECISIONS: 타 작업의 공통 현황은 변경하지 않음. 본 작업 원문은 이 문서.

## 2026-10-23 · v231 이후 테스트 보수 및 입사 승인 기준선 (도연/Codex)

### 작업 식별

- 담당: 도연(Codex), branch `hani/join-daon-yoonseul`, worktree `join`.
- 시작 HEAD: `55556fd`, base/origin-main 캐시: `af2fd6d75aa30947987e45f1e6fd976d49464fe5`.
- 대표님 승인 범위: 테스트·fixture·중앙 기준선 및 본 인수인계만. 운영 파일·버전·Storage·Cloud·본사 장면 변경 금지.
- 계획: 마스코트 fixture 복구 → v231 immutable release chain 반영·배포된 pending 연결 제거 → 다온·윤슬 승인 diff만 current source에서 정규화 → 지정 회귀·mutation·브라우저 시도 → 커밋.
- CODEMAP_MISS: dev-center/codemap.json에 해당 중앙 보존 도구와 신규 fixture owner anchor가 없어 지정 파일과 import 경로로 탐색.
- 원격 main 최신성: `git ls-remote origin refs/heads/main` 네트워크 연결 실패. 자동 merge/rebase 없음. 로컬 index 및 canonical 표시 버전 `2.9.231`, 마지막 main runtime 태그도 `2.9.231` 확인.
- 작업 전 존재한 artifacts/qa-evidence 변경은 별도 산출물로 보존, 이번 커밋 대상 제외.
- Notion: 기존 HANI-74 카드 읽기 성공. 착수 insert_content는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never` 거절로 미반영. 본 절의 계획·결과·blocker 갱신 대기.

### 결과와 증거 (검증 진행 중)

- 수정 범위: scripts/hani-reviewed-release-baseline.mjs 및 테스트, desk/office219/theme/building/history 테스트, scripts/fixtures/desk-mascots/ JSON 2개, 입사 승인 exact-fragment fixture.
- v231에서 새로 승인 chain에 들어오는 마스코트 2파일은 v225에 없으므로 immutable seed `2784e4e9855211021766f9eb65d764b2aafac468`를 명시적 시작점으로 사용하고 release231 직전 bytes와 일치를 검사.
- 입사 fixture는 base af2fd6d 대비 승인된 HEAD55556fd의 5개 owner diff로 고정. 현재 소스의 정확한 조각이 각각 1회일 때만 복원하고 Git oracle는 정규화하지 않음. 다른 변경·EOL·중복·누락·이동은 부정 검사로 거부.
- building206은 조직 명부 입력에만 중앙 정규화를 연결. 본사 장면 17명 기대값과 scene/office fixture는 그대로 유지. 실제 직원 집계를 보는 history226은 승인된 19명으로 갱신.
- 직접 실행: 지정 14명령을 artifacts/join-daon-yoonseul/test-maintenance/direct-*.log에 기록. building21·history단위·desk단위·app216 감사 통과, 나머지 Git subprocess 및 실제 Edge는 EPERM으로 차단. Git 절대경로도 같은 제한.
- 다음: 셸에서 추출한 고정 Git 원문을 검사에 공급해 논리 검증 후 결과·커밋 상태 추가. 브라우저 PASS를 주장하지 않음.

### 최종 검증 결과

- Git 하위 프로세스가 가능한 셸에서 `git show`로 224개 원문을 export. 모두 `git rev-parse <ref>:<file>`와 `git hash-object --no-filters <export>`의 객체 해시가 같음(224/224). Node 프로세스에는 산출물 전용 `frozen-git.mjs` preload가 그 원문만 반환. Git oracle를 current source로 대체하지 않았으며, 이 preload와 export는 커밋 대상이 아님. 직접 Git 통합 실행 성공과 구분한 보조 검증임.
- 보조 실행 공통 명령: `node --import ./artifacts/join-daon-yoonseul/test-maintenance/frozen-git.mjs scripts/<아래 파일> <인자>`.

| 검사 파일 | 인자 / 결과 |
|---|---|
| hani-brand-heroes-218.test.mjs | 3/3 PASS |
| hani-building-206.test.mjs | 21/21 PASS; 직접 실행도 PASS |
| hani-history-226.test.mjs | --unit-only PASS; 직원 19명·persistent slot·무쓰기 |
| hani-ocr-accuracy-224.test.mjs | 13/13 PASS |
| hani-reviewed-release-baseline.test.mjs | 8/8 PASS; release chain, current-only, exact-once, mutation 거부 |
| hani-settings-225.test.mjs | --static: 3개 검사 그룹 PASS |
| hani-simplify-225.test.mjs | 4/4 PASS |
| hani-theme-white-215.test.mjs | Node PASS; finish/token/write/cache/HTML 보존 |
| hani-office-219.test.mjs | Node source/model PASS + 공유 Node6 PASS; index preserved v231 |
| hani-desk-mascots.test.mjs | --unit PASS + 공유 Node6 PASS; 직접 실행도 PASS |
| hani-newsroom-4cut-230.test.mjs | --node 6/6 PASS; index graph 67개·신규 중복ID 0 |
| hani-qa-210.test.mjs | 9/9 PASS; 실제 handler/save/rollback 및 EOL/write/id 보존 포함 |
| hani-app-216-audit.test.cjs | 7/7 PASS; 직접 실행도 PASS |

- desk fixture 2개는 `hani/train-231:artifacts/desk-mascots/{runtime-plan,placements}.json` Git 객체와 각각 전체 bytes 동일(2/2).
- 실제 브라우저 시도: desk 기본 실행, history·ocr·settings·theme 및 newsroom에 `<playwright index.mjs> <Edge exe>`, office에 `--browser <playwright index.mjs> <Edge exe>` 전달. 전부 `browserType.launch: spawn EPERM`. ocr/settings/theme/office/newsroom는 고정 Git 입력으로 선행 검사를 통과시킨 뒤에도 같은 Edge 차단을 확인. 실화면·스크린샷·클릭·AA/layout는 미검증.
- 공통 브라우저 인자: `"C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs" "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"`.
- 직접 명령 로그: `artifacts/join-daon-yoonseul/test-maintenance/direct-*.log`; 보조 Node/브라우저 로그: `frozen-*.log`; 객체 검증: `git-object-verification.json`.
- 데이터·Storage·Cloud·schema·운영 코드·버전/cache·본사 장면 소유 파일: 이번 수정 없음. 기존 입사 runtime 5개는 작업 시작 SHA-256 그대로이며 index는 HEAD 원문과 전체 bytes 동일. 실제 운영 데이터는 사용하지 않음.
- 버전 증가, package build, One-Pass, 독립 HINA, main 병합·Pages·운영 read-back: 테스트/fixture 전용 변경으로 N/A. 실제 Edge 검사는 차단으로 미검증이며 N/A나 PASS로 취급하지 않음.

### 다음 담당에게 (이번 테스트 보수)

- 읽을 원문: 본 절, `scripts/hani-reviewed-release-baseline.mjs`, `scripts/fixtures/join-daon-yoonseul.json`.
- 다음 행동: Git 쓰기·Node Git/Edge 하위 프로세스가 가능한 환경에서 지정 파일만 커밋·push 후 원래 테스트 명령을 재실행. 보조 preload는 실제 Git/브라우저 통합 PASS의 대체 근거가 아님.
- 승인 범위: 테스트 유지보수 및 기존 입사 승인 diff만. 새 운영 변경·데이터 변경·main/배포 승인 없음. 동반 Edge Function/설정 없음.
- CURRENT/DECISIONS: 다른 담당 기록 보존, 변경 없음. 공유 요약은 기존 HANI-74 카드에 본 절 링크·검증 결과·blocker를 반영할 예정이며 저장/read-back 성공 전 완료로 보고하지 않음.

### Git·공유 최종 상태

- 최종 syntax 7/7, fixture JSON 3/3, 변경 전 runtime 5개 SHA-256 및 index 전체 bytes, `git diff --check` PASS. 본사 scene 파일과 office 테스트는 office219 중앙 baseline wiring 외 변경 없음. building206의 변경도 조직 명부 보존 입력 wiring뿐이며 17명 장면 계약은 유지.
- 지정 11파일(테스트/중앙 helper 7개 + fixture 3개 + 본 문서)만 `git add -- ...` 실행했으나 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/join/index.lock: Permission denied`로 실패.
- `git commit --only -m "test: refresh v231 preservation and approved staff join fixtures" -- <같은 11파일>` 시도도 신규 fixture 3개가 미등록 pathspec이어서 실패. 실제 HEAD `55556fd95a2915efffb8608fbeb7a964d676a1ca` 유지. **이번 보수는 미커밋·미push**, 다른 담당 산출물은 staging하지 않음. 권한 우회·별도 Git 관리 경로 생성·merge/rebase 없음.
- Notion 최종 결과 insert_content도 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 착수/완료 요약·본 절 링크·상태 변경은 미반영이며 read-back 완료가 아님. 허용 환경에서 HANI-74 카드 갱신 필요.
- blocker: Git 관리 경로 쓰기 제한, Node Git/Edge spawn EPERM, 원격 main 네트워크 조회 실패, Notion 자동 승인 거절. 대표님께 새 데이터/배포 승인을 요청할 사안은 없음.
