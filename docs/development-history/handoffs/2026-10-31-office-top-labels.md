# 휴대폰 본사 상단 배우 라벨

## 작업 식별

- 갱신: 2026-10-31 KST / Codex / 검토 담당: 대표님 지정 리뷰어(이름 원문 깨짐)
- 상태: 구현 완료 / 미커밋 검토 대기 / 실화면 검증 차단, NORMAL / READ-ONLY UI PATCH
- branch: `hani/office-top-labels`, worktree: `office-toplabel`
- base / HEAD / 로컬 origin/main: `b0a9ad0e5551ce21929e622c56c158ef6175ec23`
- 원격 main 조회: GitHub 연결 실패. 자동 merge/rebase 없음.
- 범위: `hani-office-live.js`의 단일 placeStatusLabels, 관련 scripts 테스트·측정 및 이 기록. CSS는 실측 overflow 재현 시에만.
- 승인: 사용자 Task의 기능 수정·테스트. commit/push/merge/version bump 금지. 모두 미커밋 보존.
- CODEMAP: living-office owner 확인. placeStatusLabels anchor/관련 최신 테스트 누락(CODEMAP_MISS), 실제 owner 및 obr14/15/18 검사로 fallback.

## 결과와 증거

- 작업 전 git status 깨끗함. 표시 태그 v2.9.238, 마지막 script `hani-launch-greeting.js`. 실제 브라우저 로딩 미검증.
- Edge Playwright 실행 `spawn EPERM`. 직접 Edge Start-Process도 policy blocked. 실화면 측정 불가를 PASS로 처리하지 않음.
- Notion 현황판 읽기 성공, 착수 insert는 자동 승인 검토 `approval policy is never` 거절. 갱신 대기.
- Storage/Cloud/schema/migration/데이터 변경 없음. 버전·배포·PR 없음.
- 최종 런타임: `hani-office-live.js`만 수정. 상단 공간 부족 시 자기 sprite 옆/아래·거리 <=19.5px·모든 이웃보다 엄격히 가까운 pill만 기존 head radius 예외. 긴 방문객 이름까지 지원. 기존 single placement/persistent 슬롯/충돌/경계/우선순위/dot 유지. CSS 변경 없음.
- 관련 변경: obr18 browser distant/Node geometry, obr21 단일 placement 함수 밖의 기존 바이트 고정 검사, 신규 `hani-office-top-labels.test.mjs` 및 `.browser.mjs`.
- 전체 요청 Node 28파일 실행: 통과14/실패14. 실패14 모두 변경하지 않은 로컬 origin/main에서 같은 실패명·`spawnSync git EPERM` 확인. 무관한 오류 수정 없음. 세부 이름·원문/수정본 로그는 [보고서](../../../artifacts/office-top-labels/REPORT.md)와 `comparison.json`.
- 최종 수정본 targeted 재실행: obr18 12/12, 신규 회귀7/7 PASS. JS syntax·diff check PASS. 원문 비교 후 수정본 복원. 테스트로 의도 밖 tracked 파일 변경 없음.
- 실제 Edge phone 검사 obr14/obr15/신규 측정3종: 실행 차단3, 통과0, 표본0/PNG0. obr14/15는 원문에서도 동일. 좌표 재현만으로 gap0, pill100x10, centre distance66.727px, 점→자기 sprite와 1.5px 떨어진 pill 확인(`top-contact.json`). 실제 phone 측정으로 표기하지 않음.
- 360/390/416px 각1–5F 점 전후 수 및 scrollWidth−innerWidth: 전부 미측정. 오른쪽 잘림·pinch zoom 원인 미확인. CSS 추정 수정 없음.
- Node_PATH: `C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules`, Playwright 그 아래 `playwright/index.mjs`, 브라우저 지정 Edge 경로 사용. Node v24.20.0. 상세 명령은 보고서.

## 다음 담당에게

- 먼저 읽을 함수: placeStatusLabels 및 fitStatusLabels; 브라우저 geometry helper.
- 목표: 상단 여백 부족 배우만 가까운 sprite 옆/아래 pill을 허용하고, 모든 충돌·경계·대화 우선순위 보존.
- 다음 행동: 허용된 Edge 환경에서 `scripts/hani-office-top-labels.browser.mjs` 실행. 원문 JS는 `artifacts/office-top-labels/before-hani-office-live.js`에 보존. 실제 index DOM/CSS·office owners만 실행하는 검사이며, 외부 폰트·인증 app bootstrap·Android 실기기는 별도 미검증.
- source SHA256: 원문 `0a62148d8e9b130c6bb8a8d6ece1af0383e1fea7c978194481eca447efbc38b5`, 수정본 `0083dec0e121e1c71027616d55be39b6f6c69d54eab6c7cc12e7ff85beafc8ff`.
- CURRENT에 구현/차단/미커밋 상태만 기록. DECISIONS 기존 기록 보존. Notion 착수 insert 자동 승인 never 거절로 최종 요약 갱신 대기. 이 지시는 push/배포 승인 아님.
