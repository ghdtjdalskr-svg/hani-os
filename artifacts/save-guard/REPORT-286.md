# saveguard-286 결과 · 2026-11-10 KST

**전체 QA는 불통과입니다. hani-main.js 저장 안전장치 유실은 발견하지 않았으며 런타임 파일은 수정하지 않았습니다.**

**남은 항목:** M9는 **10/15**로 요구한 15/15에 미달합니다. office 69파일은 TAP **586 PASS / 102 FAIL / 3 SKIP**이며, 실패 102건 중 **Git 실행 전 차단 23건 / 그 외 79건**입니다. 치비툰 4/5(kids-v2 추가 자산), M9-link 9/10(package 포함 누락4개)도 실패를 보존했습니다. Edge 두 탭·1280/390은 spawn EPERM으로 미검증이며 서윤이 재실행해야 합니다.

## 변경과 기준선

- 담당 Codex, 후속 검토·커밋 서윤. branch hani/audit-safety-284, HEAD 765379601e912079f6cfaa3f7fb8b87e84b2dfe4. MERGE_HEAD·로컬 origin/main 참조는 5f40eb405cc057a16dc8f30ebc195ff5aed8d77c(2.9.286). 착수·종료 시 참조 파일로 확인했고 원격 최신성은 새로 조회하지 않았습니다.
- Git 명령 실행0, stage/commit/push/추가 merge/rebase/배포0. 기존 merge 진행 상태 유지. 작업 파일의 충돌 표시를 제거했으며 Git index 처리는 서윤 담당입니다.
- hani-life-bundle-source.test.mjs: 양쪽 import 보존, 저장 안전장치·286 외층을 먼저 벗기고 공통 projectReleaseSource(...,'2.9.283')를 적용합니다.
- hani-save-guard-source.cjs와 fixture: 전체 입력/출력 SHA256·완전한 변경행을 고정한 286→285 exact inverse로 갱신. guard-patch-only는 286에서 저장 안전장치만 제거하고 기존 XSS·가계부 보완을 유지합니다. Buffer 입력은 Buffer로 반환합니다.
- hani-release-version-layers.cjs: 공통 dispatcher 진입부에 pinned outer 투영만 연결했습니다. 서윤이 채택한 hani-release-283-source.cjs, 공통 release-version-layers.json, 기존 285·284·283/생활/M9 assertion·pin은 변경하지 않았습니다.
- 286 배포 연혁도 독립 main285 객체의 원문과 285 manifest pin에 맞춰 정확히 역변환합니다. raw 286 → outer(guard/286) → 공통285/284 feature·version → 283 → 생활 묶음 순서입니다.

## 런타임·저장 안전 확인

- hani-main.js는 기존 HEAD에서 표시2.9.284→2.9.286을 바꾼 결과와 전체 바이트가 동일합니다. branch 변경을 역변환하고 286으로 되돌린 원문은 지정 main286 객체와 전체 바이트가 동일합니다. Git 객체를 파일로 읽어 SHA1을 검증했으며 Git 프로그램을 실행하지 않았습니다.
- 루트 JS/CSS/HTML 71개를 main286 tree의 blob identity와 비교했습니다. 기존 branch 패치가 있는 hani-main.js 외 70개는 main286과 동일합니다. 이번 작업 중 런타임 변경0입니다.
- storageLoadedRaw(1166), loadState 기준 기록(1258), writeProtectedState(1293), removeProtectedState(1329), showStorageTabConflict(1415), assertStorageTabCurrent(1426), initStorageTabGuard(1430), save(1439), validateCloudRecords(5934), 초기화 호출(8805)이 남아 있습니다. 해당 함수의 원문 보존과 단위 실행을 함께 확인했습니다.
- save()는 conflict 결과를 반환하면서 입력 폼을 다시 렌더링하지 않습니다. 직접 보호 write/remove·Cloud 적용 및 사본 대기 중 다른 탭 저장 차단, Cloud 읽기/수동 복원 형식 검사, 정상 Cloud 결과 동일, 깨진 Local 격리·복구 read-back을 단위 시험에서 확인했습니다.
- localStorage setItem18→18 / removeItem5→5 / clear0→0. 직접 STORAGE_KEY set2→2 / remove1→1. Cloud upload 함수 원문 동일. 보호 키 hani_os_life_v23·내부2.9.15-safe-baseline-bootstrap·schema 보존.
- raw hani-main.js SHA256: 9e672c5d5926c5ea384ede9dab9f4c1e3e3e27a91b0eb2839e0e14b704bded4d. CRLF 5310개·전체 LF 8934개(단독 LF 3624개) 보존.
- index SHA256: fe7d00e8ad34b0095872144c434e6d299df240f6b4e89f46da29ff2bdc59e72c. 표시·cache 2.9.286 유지. 마지막 선언 script는 hani-launch-greeting.js(앞 두 개 ai-budget core/js는 ?v=2.9.286)입니다. 실제 최신 JS 로딩은 브라우저 차단으로 미검증입니다.

## 지정 시험 결과

파일마다 별도 Node24.22.1 프로세스로 실행했습니다. 모든 명령에 기존 no-git.cjs를 적용해 Git을 실행 전에 차단했으며 원래 Git assertion을 대체하거나 PASS 처리하지 않았습니다. office 및 일부 legacy 시험에는 기존 life preload를 사용했습니다. 공통 version·newsroom285 두 시험만 TEMP의 정확한 286→285 reader를 사용해 기존 raw285 경계를 검증했습니다. 저장 안전장치 단위·브라우저는 raw 286 원문을 읽었습니다. 정확한 명령·개별 실패는 [RESULTS-286.json](RESULTS-286.json)에 있습니다.

| 기능 시험 | 결과 | TAP 통과/전체 |
|---|---|---|
| hani-save-guard.test.mjs | PASS | 10/10 |
| hani-life-bundle-source.test.mjs | PASS | 5/5 |
| hani-study-retry.test.mjs | PASS | 26/26 |
| hani-procrastination-board.test.mjs | PASS | 6/6 |
| hani-wishlist-quick-add.test.mjs | PASS | 7/7 |
| hani-dev-report-generate.test.mjs | PASS | 1/1 |
| hani-pb-chibitoon.test.mjs | FAIL | 4/5 |
| hani-newsroom-persona.test.mjs | PASS | 4/4 |
| hani-m9-polish.test.mjs | PASS | 2/2 |
| hani-gemini-reports-build.test.mjs | PASS | 1/1 |
| hani-nav-groups.test.mjs | Git 차단 포함 | 0/1 |
| hani-navlogin.test.mjs | PASS | 1/1 |
| hani-dashboard-period.test.mjs | PASS | 1/1 |
| hani-release-version-layers.test.mjs | PASS | 5/5 |
| hani-newsroom-285-source.test.mjs | PASS | 2/2 |
| hani-newsroom-4cut-230.test.mjs | Git 차단 포함 | 7/8 |
| hani-m9-link.test.mjs | FAIL | 9/10 |
| hani-seoyun-m9.test.mjs | FAIL | 10/15 |
| hani-design-system-qa.mjs | PASS | 직접 실행 |

- dev-report는 **10그룹**, Gemini build는 **5그룹**, navlogin은 **45 cases**, dashboard는 네 실행 묶음이 PASS입니다. 직접 실행 스크립트의 TAP wrapper 수를 실제 assertion 수로 세지 않았습니다.
- office: **69파일 전부 실행**, 파일 전체 성공19 / Git 차단 포함21 / Git 없는 실패29. TAP 합계586/102/3(skip), import된 공통 engine 시험을 포함한 합계입니다. 219는 Git 단계에서 차단되어 알려진 기존 실패 자체를 이번에 재확인하지 못했습니다.
- office 실패에는 새 286 office 원문(1c1493de...)을 기존 278~M9/affinity inverse가 거부하는 경우와 그 결과로 예전 동작을 기대하는 assertion, 꼬마 응답 bubble·라벨·동물 동작 assertion 등이 포함됩니다. main286 office 원문과 일치함을 확인했으며 별도 수정·기대값 완화는 하지 않았습니다. 같은 원문에서 발생했다는 근거이며, 모든 실패를 수정 전 재실행했다고 주장하지 않습니다.
- 꼬마 방문: **15/16**, 활기: **11/15**. 활기 실패 중3건은 exact inverse 입력 불일치이고1건은 직원 응답 bubble 기대 실패입니다.
- M9: **10/15**. office JS inverse4건·office CSS 보존1건이 286 변경과 맞지 않습니다. M9-link의 package 누락4개는 data/hani-ilbo/issues.json, data/hani-ilbo/extra-m9.json, assets/hani-ilbo/extra-m9-comic.webp, assets/character-archive/seoyun-m9-special-cut.webp입니다. gate·server를 바꾸지 않았습니다.
- 치비툰: **4/5**, closure 차이에 새 assets/office-companions/kids-v2.webp가 추가되어 기존 “시트 하나만 추가” 기대와 다릅니다.
- newsroom4컷 **7/8**, 남은1건은 Git 차단. persona4/4·285 inverse2/2 PASS. nav-groups도 Git 차단입니다.
- syntax: 변경한 JS/시험3개 + hani-main.js **4/4 PASS**. 추가 exact inverse 검증은 4 owner 전체 forward·Buffer 왕복, drift/부분/중복/재적용/EOL 변경20건 거부, 286→285→283→282의 독립 pin 확인 PASS입니다.

### 부하 의존 400ms 성능 · 별도 기록

두 기존 성능 assertion은 PASS이며 한도를 바꾸지 않았습니다. 각3회 중 최소값 <400ms 기준입니다. cafe 회장 부재 최소317.44ms / 재실353.28ms, lively 첫 plan 최소363.36ms / warm snapshot0.909ms입니다. 전체 샘플은 JSON에 있습니다. 다른 프로세스 부하에 영향을 받는 측정이며 보편적인 속도를 보장하지 않습니다.

### 브라우저 · 미검증

Edge 저장 안전장치(두 탭·1280/390), navlogin, navigation-state, dashboard 네 명령 모두 browserType.launch: spawn EPERM. design-system phase1은 시험에 지정된 Chrome에서도 같은 오류입니다. 새 화면/PNG/read-back 증거0이며 기존 browser-results.json·PNG를 이번 PASS로 재사용하지 않았습니다. 서윤이 실행 가능한 환경에서 재검증해야 합니다.

### Git 차단 파일 목록

- `hani-office-219.test.mjs`
- `hani-office-actions-216.test.mjs`
- `hani-office-affinity-274-pins.test.mjs`
- `hani-office-barista-night-273-pins.test.mjs`
- `hani-office-cafe-rest.test.mjs`
- `hani-office-chairman-patrol-278-pins.test.mjs`
- `hani-office-companions-276-pins.test.mjs`
- `hani-office-consult.test.mjs`
- `hani-office-lively-v2.test.mjs`
- `hani-office-obr12.test.mjs`
- `hani-office-obr15.test.mjs`
- `hani-office-obr21.test.mjs`
- `hani-office-obr4.test.mjs`
- `hani-office-obr6.test.mjs`
- `hani-office-obr7.test.mjs`
- `hani-office-obr8.test.mjs`
- `hani-office-obr9.test.mjs`
- `hani-office-pet-bori-272-pins.test.mjs`
- `hani-office-pets-bubble.test.mjs`
- `hani-office-v2-215.test.mjs`
- `hani-office-xmas-269-pins.test.mjs`
- `hani-nav-groups.test.mjs`
- `hani-newsroom-4cut-230.test.mjs`

## 부산물·인수인계

- 생성 JSON4개(obr16/17/19-layout-node, office-drama/reachability)를 착수 원문으로 바이트 단위 복원했습니다. 그 외 예상 밖 파일 변경0, 신규 시험 출력 파일0입니다. 이번에 남기는 파일은 변경한 시험 도구4개·인수인계1개·이 보고서·결과JSON1개뿐입니다.
- 1,934파일 착수 snapshot 및 임시 helper/runner/로그/백업은 worktree 밖 TEMP(C:\Users\홍성민\AppData\Local\Temp\hani-saveguard-286-pV35Cu)에 있습니다. CURRENT 및 release283의 서윤 해결본은 원문 보존했습니다.
- 최초 두 시험을 한 프로세스로 묶은 탐색에서는 life preload가 guard의 마지막 raw read에 간섭해14/15였습니다. 파일별 별도 실행으로 교정해 guard10/10·life5/5를 확인했으며 최종93명령은 모두 별도 프로세스입니다.
- 인수인계: [2026-11-10-saveguard-286.md](../../docs/development-history/handoffs/2026-11-10-saveguard-286.md). 다음: 서윤 검토·병합 index 처리/커밋 → 286 office/kids tooling·closure/M9 실패 처리 → Git·실제 Edge 재검증. main merge·Candidate·Pages·Production read-back·배포는 수행하지 않았습니다. 문서/시험 도구 작업이므로 runtime 버전 증가 및 release build는 N/A입니다.
- Notion 읽기는 성공했지만 착수 insert_content는 자동 승인 정책 never가 거절했습니다. 착수·최종 검증 요약 갱신은 대기이며 로컬 인수인계에 보존했습니다.
