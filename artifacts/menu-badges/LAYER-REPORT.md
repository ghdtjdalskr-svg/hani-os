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