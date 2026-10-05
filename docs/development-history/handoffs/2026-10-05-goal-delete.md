# 목표 한 건 삭제 · 배포 전 준비

## 작업 식별

- 날짜: 2026-10-05 KST / 담당: Codex
- 상태: 기능 개발·테스트 완료 / 배포 열차 탑승 대기 (2026-10-05 대표님 공지 적용)
- branch: hani/goal-delete-release-v182
- worktree: .worktrees/goal-delete-release-v182
- base: a7bb9137083d83f8170ac103ad7603bc6d6ac603
- 이전 검증 후보: 3e9176ed5f8287ad53254b5ed5ae77da055e2f27. 이 SHA의 패키지는 폐기/배포 금지. 최종 기능 인수인계 SHA는 이 문서 포함 commit의 branch HEAD 참조.
- 사용자 승인: 삭제 Preview 기능 구현 및 배포 전 준비. main 병합·운영 배포·실제 사용자 목표 삭제는 이번 준비 범위에 포함하지 않음.

## 결과와 증거

- hani-main.js: 이력 한 건 삭제 Draft, 취소/승인 공통 canonical save 경로. 승인 전 state mutation/write 0. 승인 후 save 1회. 목표 외 기록 변경 없음.
- index.html / HANI_DISPLAY_VERSION: 임시 v2.9.182 증가를 되돌려 기준 v2.9.181 유지. index.html은 base 대비 변경 없음. 표시 버전·캐시 태그 증가는 배포 담당 Claude 소유.
- scripts/hani-goal-delete-test.js: 격리 Chrome 390px, Preview/cancel write 0, 실패 rollback, 단일 삭제 save, 중복 클릭, 기존 체중/책/다른 목표 보존 및 목표 등록 회귀 PASS. 개발 fixture screenshot 390/1200 생성. 실제 운영 데이터 미사용.
- Build: 92 files / 16,359,596 bytes / package c9134941b48b8d76abfe3ad8da4800bff278b6510b3a41abbfdb381b5d0c4f79
- contract: 2.0.8 / 53700c06eb573eeaa0d8dbfc674462bb6f6da92a8cd87a223f78ddff07b3f56d
- JS syntax / diff / Pre-QA / One-Pass Preflight PASS (위 candidate/base 기준). 로컬 hina_equivalent_state는 독립 서버 HINA 완료가 아님.
- Production 공개 표시·JS: v2.9.181, hani-main.js?v=2.9.181, hani-ui-v02992.js?v=2.9.181.
- GitHub 실제 main a7bb913 / 진행 중 main Actions 없음 (조회 시점).
- DB/schema/migration/storage format/sync engine/release tooling 변경 0. 기존 save 경로에 승인된 개별 목표 삭제만 추가.
- 기존 candidate958e6ee/기준c544592와 원래 worktree는 보존. 임의 merge/rebase 없음.

## 미검증 및 차단

- PR201: 공부·실제 뉴스 v2.9.182 ea8af0824dcb60b07035d73bfcf0370dd1665a0e OPEN. 버전 충돌.
- PR198: BMI·체지방률 목표 v2.9.183 f5a1c92137633bfbf70e45478d8ee532298d1930 OPEN. 같은 Goal Registry 소유 코드. 자동 병합하지 않음.
- PR202: 배포 확인 창 개선 개발 후보 v2.9.184 OPEN. 배포 순서 확인 필요.
- 독립 서버 HINA, GitHub Self-Protection 실제 check, 인증된 전체 앱 Preview, Android, 실제 삭제/백업/Cloud read-back 미실행. PR 미생성·push 미실행·큐 미등록.
- 모든 승인된 목표 이력 삭제는 영구 삭제이므로 실제 실행 전 해당 한 건·백업·기존 기록 보존을 확인하고 사용자 최종 삭제 확인을 받아야 함. 이 작업에서 운영 데이터는 삭제하지 않음.

## 다음 담당에게

- 대표님 결정: 공부 PR201·목표 PR198 반영 후 삭제 기능 배포. 이후 배포 열차 정책이 우선하므로 개별 배포 준비/운영 PR 생성/병합/배포 중단. Claude가 통합·버전·최종 패키지·게이트·배포를 담당.
- 함께 배포할 서버 기능: 없음. 기존 canonical save 및 Cloud sync 경로 재사용, Edge Function 변경/배포 불필요.
- Claude 통합 주의: PR198이 GOAL_METRICS/목표 등록 소유 코드를 변경. 삭제 helpers/renderer는 기존 새 metric 정의를 보존해야 함. 공부 PR201·배포 UI PR202 코드도 삭제 패치로 덮어쓰지 않음.
- 최종 변경 파일: hani-main.js, scripts/hani-goal-delete-test.js, 이 인수인계. index.html net 변경 없음. 테스트·JS syntax·diff는 버전 원복 후 재실행. 이전 package/PreQA/OnePass 증거는 다른 candidate의 역사적 증거이며 통합 열차에서 재검증 필요.
- 실제 사용자 목표 삭제는 아직 미실행. 운영 목표 삭제는 별도 명시적 최종 확인 후 기존 화면 승인으로 실행. 이 기능 배포와 사용자 데이터 삭제를 구분.
- 임시 패키지·로그·스크린샷·GitHub helper는 로컬 untracked 산출물이며 branch에 포함하지 않음. 개별 운영 PR은 생성하지 않음.
- Notion: 작업별 요약 갱신 후 read-back 필요. 개인 목표값·생활 원본은 기록하지 않음.
- CURRENT/다른 담당 문서는 수정하지 않음. 이 파일은 로컬 인수인계이며 GitHub 원문 링크는 아직 없음.
