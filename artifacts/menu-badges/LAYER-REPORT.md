# 메뉴 NEW 배지 시험 층 · 서윤 인계

- 2026-11-21 KST · 도연(Codex) 단독 · **구현 완료 / Node 전체 검증 차단**.
- `hani/menu-new-badges` / 착수·현재 HEAD `6cda54ea3875677ea932c5ce47326757abd2daf3`, base `cd916e28466a17dfe5723fbce41ab3d0930522ec`. GitHub 읽기 조회의 최신 main도 base와 일치. 표시/cache **2.9.306 유지**.
- 승인·범위: UTF-8로 읽은 `../mblayer-task.md`. 운영·저장·Cloud·버전·히스토리 변경, commit·push·배포·Notion 금지 준수. CODEMAP에 이 시험 층 anchor가 없어(CODEMAP_MISS) 기존306/helper owner만 확인. 공통 허브는 읽었으며 히스토리 문서는 수정하지 않음.

## 변경

- 신규: `scripts/hani-menu-badges-{source,preload,reviewed-input}.cjs`, `scripts/hani-menu-badges-layer.test.mjs`, `scripts/fixtures/menu-badges-layer.json`.
- 순서: **menu-badges → 306 → helper-bubble → 305 → 304 → ui-polish-1 → 303 이하**. 운영4파일과 연결문을 exact-inverse로 복원하고 하위 owner196개가 모두 일치할 때만 과거 merge-base 입력을 선택. 실제 refs·Git 객체·디렉터리 열거는 보존.
- 기존 파일 수정 목록(1개): `scripts/hani-release-306-source.cjs` 맨 앞 `require('./hani-menu-badges-preload.cjs');` 한 줄. 이 줄 자체도 fixture로 역변환. **기존 시험 import 추가0, 단언·fixture·hash 수정0**.
- 새 시험8개: 독립 Git 바이트/양방향 복원·drift/EOL/중복/손상/잘못된 edit 거부·역사 입력 gate·sync/callback/promise/URL/Buffer/fd/오류 전달·하위 capture·원문 보존·실제 showView/renderer 저장 안전. Node 실행 결과는 미검증.

## 확인 결과

| 검증 | 결과 |
|---|---|
| 전체 `node scripts/<파일>.test.mjs` 단독 시도 | 변경 전295개, 변경 후296개 모두 **Node 실행 파일 접근 거부로 시작 실패**. PASS0, 실제 시험 FAIL 여부·새 회귀 여부 미검증 |
| 독립 Git 원문 대조(.NET, 객체 SHA-1 검증) | 5파일15편집 역변환·정방향 재구성, owner196개 일치 |
| V8 보조 검사(Node suite와 별개) | JS5파일 문법 파싱, 실제 저장 헬퍼 정상/손상/읽기 오류/쓰기 오류4경로 실행 성공 |
| 저장 안전 | 계산/표시 신규 코드의 저장 호출은 `getItem(MENU_SEEN_KEY)`·`setItem(MENU_SEEN_KEY)`뿐. 실행 헬퍼의 접근 키는 `hani_menu_seen_v1` 하나, 보호 키 접근0·remove/clear0·Cloud0. 실제 브라우저 통합은 미검증 |
| 원문 보존 | 착수 snapshot911개 중 연결문1개 외 변경0. 기존 시험295·fixture134·보호32경로·context-remote 보존. 지정 JSON5개는 기존 snapshot과 바이트 일치, 원복 필요 변경0 |
| 임시 자료 | 모든 로그·사본·실행기·상세 증거는 `artifacts/menu-badges/local/`. 기존 `.gitignore`의 `local/` 유지 |

- **Git 검사 별도 미검증:** native `git.exe`도 접근 거부. Git subprocess EPERM 검사는 Node가 시작하지 못해 재현/판정 불가. `git diff --check` 등 native Git 검사를 PASS로 표시하지 않음.
- 사무실 perf도 실행 전 차단. 실행기는 perf 실패 시 최대2회 추가 재시도를 준비했지만 실제 perf 재시도·안정성은 미검증.
- 기존306/helper 보존 시험은 디렉터리를 열거해 과거 Git에 없던 신규 fixture/test를 확인하는 단언이 있음. 이를 숨기거나 기존 단언을 고치지 않았으므로 전체 재실행 시 해당 호환성 실패도 별도 분류해야 함. 전체 통과를 선언하지 않음.
- 이전 local 초안·부분 로그는 현 실행환경의 통과 근거로 재사용하지 않음. runtime 변경0인 도구 작업이며 Candidate/Build/One-Pass/HINA·Preview·Production은 미실행/N/A.

## 다음 담당에게

- **서윤:** Node 실행 가능한 환경에서 `local/run-standalone.ps1 -Phase verified -NodePath <실행가능한 node.exe>`로 전부 단독 실행하고 원문 보존 검사를 다시 확인. 기존 실패·Git EPERM·환경 차단을 구분하고 사무실 perf 실패는2회 재시도. 아직 시험 실행 승인 이외의 새 승인 요청은 없음.
- 증거: `local/native-audit.json`, `local/v8-supplemental.json`, `local/baseline-identity.json`, `local/baseline/results.json`, `local/after/results.json`. 검증 입력 fixture SHA-256 `f099196509836d63e70509eb3125865387e4f2e4f2b81fc40136601c7a98660f`.
- main 병합·Pages·운영 JS 로딩·기능 read-back 없음. 후속 Git·Notion·307 후보 준비는 서윤 담당. 이 작업에서 CURRENT·DECISIONS·릴리스 히스토리 수정 없음.

## 2차 · 남은 4개 시험 층 보완

- 2026-11-21 KST · 도연(Codex) 단독. branch `hani/menu-new-badges`, 착수/종료 HEAD `55f3fe64e2b88aa1b39ed503e3133614265e88d7`, 로컬 base `cd916e28466a17dfe5723fbce41ab3d0930522ec`. 원격 main 재조회는 네트워크 연결 실패로 최신성 미확인. 승인 근거 `../mblayer2-task.md`·`../mblayer-task.md` UTF-8 정상 확인.
- **지정 8파일 각각 단독 실행: 65 PASS / 0 FAIL / 0 SKIP.** 2차에서는 아래 targeted 시험만 실행했으며 전체 `scripts/*.test.mjs` 통과를 선언하지 않음.

| 명령 (`node scripts/<파일>`) | 결과 |
|---|---|
| `hani-helper-bubble-layer.test.mjs` | 7/7 PASS |
| `hani-release-306.test.mjs` | 8/8 PASS |
| `hani-ui-polish-1.test.mjs` | 4/4 PASS |
| `hani-proactive-204.test.mjs` | 21/21 PASS |
| `hani-menu-badges-compat.test.mjs` | 신규 경계 시험 5/5 PASS |
| `hani-menu-badges-layer.test.mjs` | 8/8 PASS |
| `hani-menu-badges.test.mjs` | 7/7 PASS |
| `hani-menu-seen.test.mjs` | 5/5 PASS |

- 기존 시험 수정은 위 **helper-bubble-layer / release-306 / ui-polish-1 / proactive-204 네 파일 맨 앞에 동일한 `import './hani-menu-badges-preload.cjs';` 한 줄씩**뿐(설명 주석 포함). 독립 base Git blob과 나머지 전체 바이트가 같을 때만 이 연결문을 역변환. 기존 단언·fixture·hash 수정0, `hani-context-remote.test.mjs` 보존.
- 메뉴 source/preload 보완 및 신규 `scripts/hani-menu-badges-historical-input.cjs`: 기존304→305→306의 명시적인 바깥 층 구분을 메뉴 입력에서 처리. **helper/306 단독 프로세스에만** 메뉴 fixture와 시험 4파일의 과거 디렉터리 뷰를 제공. 기존 4파일은 1차 commit `55f3fe6`의 Git blob, 신규 compat 시험은 새 SHA-256 pin으로 확인. drift·모르는 파일은 그대로 노출하고 Git tree/object/ref는 변경하지 않음. 메뉴 자체 시험은 실제 디렉터리 항목을 계속 확인.
- proactive는 메뉴 inverse를 먼저 연결하고, 해당 단독 프로세스의 정확한 `git diff --unified=0 <menu-base> -- <기존 5파일>` 요청에만 역변환 후 **5파일 전체가 독립 Git 원문과 같은 경우** 빈 diff를 제공. 파일 하나라도 달라지거나 명령/옵션/경로/기준이 다르면 native 실행에 그대로 전달. 임의 추가 줄 삭제나 저장 금지 정규식 완화 없음.
- 신규 compat 시험은 import 원문·drift/중복 거부, 문자열/Dirent·미지 파일·오류·옵션 보존, 전체 diff 증명과 모든 owner drift 거부, 지원하지 않는 명령의 native 전달을 실제 실행. 기존 메뉴 층의 실제 renderer/showView 저장 안전 시험도 통과: 승인 키 `hani_menu_seen_v1` 외 쓰기0·보호 키 접근0·remove/clear0·Cloud0.
- syntax 8/8 및 PowerShell의 `git diff --check` PASS. 착수 snapshot 2,589파일 대조: 위 기존 도구2·import4 이외 변경0(보고서/인계 최종 추가 전). 운영·보호 경로·기존 fixture/hash와 지정 JSON5 원문 보존. 신규 source/test2파일 및 본 보고서/인계만 추가 기록. 임시 출력 전부 `artifacts/menu-badges/local/round2/`, 기존 `local/` ignore 확인.
- **Git 별도 미검증:** Node native `git rev-parse HEAD`는 `spawnSync git EPERM`. proactive의 수정 전 재현은 이 환경의 기존 검증된 Git-object fallback에서 이미21/21이었음. 이번 native diff 호환 분기는 신규 격리 시험으로 검증했지만, Git 허용 환경의 실제 subprocess 경로는 서윤 재실행 필요. helper/306/UI Polish의 수정 전 실패는 재현 후 해소. 사무실 perf는 2차 대상 밖(서윤 단독 재실행 통과 전달 근거), 추가 실행 없음.
- 증거: `local/round2/before-*.log`, `after-*.log`, `results.json`, `preservation.json`, `start-hashes.json`. Node v24.20.0 / Windows PowerShell. 기존1차 로그와 구분.
- 도구 전용 변경으로 표시/cache **2.9.306 유지**, 버전 증가·브라우저 Preview·Candidate/Build/One-Pass/HINA·Production read-back N/A/미실행. commit·push·main merge·배포·Notion 갱신 없음(명시 금지). 다음: 서윤이 Git 허용 환경에서 동일8명령 확인 후 Git·Notion 및 열차 인계 처리.
