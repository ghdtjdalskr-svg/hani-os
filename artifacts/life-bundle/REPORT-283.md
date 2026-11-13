# 생활 묶음 283 시험 정리 · 2026-11-08

- Codex / `hani/life-bundle` / 착수 HEAD `ada3be2` / 사용자 지정 main `2feb724`. Git 명령·commit/push/merge·표시 버전/캐시 변경·배포 없음. 표시 버전은 **2.9.282 유지**.
- 보고서 빌더는 실제 worktree에 **1회만** 실행: **catalog 8→9, 31편(기존18+재생성13), 내장 “로컬 Git 실행 불가” 0건**. `--check`는 쓰기 없이 최신 상태 확인. 빌더 시험의 반복 실행은 격리된 임시 폴더만 대상.
- 런타임 변경은 `hani-main.js`의 catalog assignment 하나뿐. exact refresh inverse가 착수 원문 전체를 복원하며, 기존18편·renderer·그 외 런타임167개 원시 바이트 보존. 저장 키·내부 보호 버전·Cloud/schema 변경 없음.

| 시험 기준 변경 | 이유와 보존한 검사 |
|---|---|
| dev-report → wishlist | main before `02f322ff…`→`cbb75256…`, after `4cab375b…`. 282 버전 바이트와 새 catalog9를 포함. 원래 catalog7→8 assertion은 refresh inverse의 이전 catalog8에서 유지하고 8→9 assertion 추가. |
| wishlist → procrastination | main before `94159172…`→`8844a978…`, index before `fe35f0ba…`→`737717c4…`. 생활 묶음 직전 레이어를 정확히 비교. |
| procrastination → study/main | main `c0ae237d…`→`ef067e9f…`, index `42df5871…`→`2fe92354…`. 282 main/index pin으로 갱신. 병합 시 STYLE/SCRIPT의 개행과 NAV 원래 CRLF를 구분해 정확히 복원. |
| study-retry | 학습 JS·저장 owner·서버 해시는 그대로. preservation의 main/index만 위 새 기준에 맞춤. |
| 281/282·Git 자료 | 기존 affinity-cap/mascot-label/M9 exact inverse helper와 assertion 보존. 생성기 시험은 `ada3be2`의 공개 PR 참조 51건과 원고13편 해시를 고정한 cache를 사용하며 Git 호출 계약은 기존 mock 검사 유지. 이번 세션의 독립 Git 조회 증거가 아님. |

네 레이어 역변환 뒤 main/index/study는 별도로 캡처한 **release-282 `f5672cfa` 원문과 바이트까지 일치**. 이 원본의 closure161개 중 main/index/study만 현재 묶음과 다르고 나머지158개 동일. Git 금지 때문에 `2feb724` 원격 blob·최신성의 새 독립 확인은 미수행. [전체 pin·파일별 SHA](283/runtime-audit.json).

| 시험 | 최종 결과 |
|---|---|
| 학습 재시도 / 미룬 일 / 위시 / 개발보고서 | 26/26 · 6/6 · 7/7 · 10그룹 PASS |
| exact inverse / 번들 빌더 | 4/4 · 5그룹 PASS. 번들 시험은 `--import ./scripts/hani-life-bundle-preload.mjs` 사용 |
| nav / navlogin / dashboard 정적 | PASS. nav 초기 baseline snapshot의 의존 JS 누락은 독립282 closure 캡처 후 같은 assertion으로 재실행 PASS |
| navlogin / navigation-state / dashboard UI | 실제 묶음 원문3개 및 life preload3개 모두 PASS, 각 PC1440·390px |
| navlogin 실패2건 조사 | 묶음과 별도282 원본 모두 같은 시험 PC/390 PASS. 실패 재현 없음·미룬 일 메뉴로 인한 오류 확인 안 됨. 당시 실패 로그/환경과의 정확한 차이는 미확인, assertion/UI 수정 없음 |
| 미룬 일 / 위시 브라우저 | PASS(1280·390 / 1440·390). 위시 입력 저장·fetch0→기존 저장버튼1회·read-back; PNG8개 생성, 모바일2개 직접 확인 |
| M9 link / seoyun-m9 / polish | 9PASS·기존 packaging1FAIL(manifest·호외JSON·그림2개 미수집) / 15PASS / 2PASS. link에 polish preload, seoyun에 polish+link preload; 생활 묶음 preload도 적용 |
| tasks-qa-212 | 사용자 지정 기존 실패1건(`homeActions` fixture의 null.parentNode), 7PASS·1FAIL |
| office 전체69파일 | **41파일 성공·28파일 Git 차단 / 745통과·35차단·3skip / 그 외 실패0**. 원래 assertion 유지, Git 하위 프로세스 실행 전 USER_GIT_DISABLED로 차단. 219는 사용자 지정 기존 실패이며 이번에는 Git 차단이 먼저 발생 |
| syntax | main 및 변경 시험/helper7파일 PASS |

- 환경: Node24.22.1, Edge157.0.4341.42, 지정 Edge 경로와 `NODE_PATH=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules`. 브라우저는 합성 프로필·외부 요청 차단. 실제 운영 계정/운영 read-back 아님.
- **정적 closure168·누락0, 한도160 초과8(FAIL)**. 별도282 원본도161. 파일 삭제·동적 참조 변경·한도 assertion 완화는 하지 않음. [런타임 파일 목록168개](283/runtime-files.txt).
- 시험 결과: [최종 집계·각 실패 이유](283/all-results.json), [전용](283/features-results.json), [전체 회귀 첫 실행](283/regression-results.json), [nav 재실행·syntax·raw audit](283/final-checks.json), [UI](283/ui-results.json), [실제 원문 UI](283/ui-raw-results.json), [navlogin 비교](283/navlogin-comparison.json). 실행기: [run-283.ps1](run-283.ps1). legacy 시험의 메모리 projection과 실제 원시 closure168 검증을 구분했다.

| 시험 산출물 처리 | 결과 |
|---|---|
| office-behavior `obr16/obr17/obr19-layout-node.json`, office-drama `reachability.json` | 실행 전 원문 바이트로 4개 복원, 새 결과는 `283/generated-office/` 보존. 사전 snapshot 총9개 모두 원문 hash 일치 확인 |
| l216-2 simulation/reachability, night-actions-221 targeted, bori-fix daily/tour/dom-40x | 생성 결과6개 유지. 이 파일들은 실행 전 snapshot이 없어 원래 내용과의 차이·Git tracked 여부는 미확인 |
| 위시 edge-results JSON·PNG6개, 미룬 일 PNG2개 | 이번 브라우저 근거9개 유지. navlogin raw/main 비교 PNG는 `283/navlogin-*`에 별도 보존 |

[15개 유지 출력·9개 복원 검사 전체 목록](283/artifact-cleanup.json). 복원 후 raw audit도 다시 PASS(catalog 외 런타임 변경0); closure160 한도는 별도 FAIL 유지.

- Notion 착수 쓰기는 **자동 승인 검토가 `approval policy is never`로 거절**. 읽기만 성공, 최종 갱신 대기. [인수인계](../../docs/development-history/handoffs/2026-11-08-life-bundle-283.md)에 미반영 요약 보존.
- Candidate build·One-Pass·HINA·merge·배포·Production은 미수행. **다음: 서윤이 미커밋 변경을 검토·커밋**. Git 독립 검증35건·기존 tasks/packaging 실패·closure 한도 초과와 Notion 미반영을 함께 인계한다.
