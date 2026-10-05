# Cloud Sync 안정화 · 개발 인수인계

- 담당: Gemini 프로젝트 탭 / Codex
- 상태: 개발 검증 완료 / 배포 열차 인계 준비
- branch: hani/cloud-sync-stability-20261006
- base: 57719dcac0b221392dbe0a5ee3f5c7fb6e58cc02
- 운영 시작 기준: v2.9.185, hani-main.js?v=2.9.185 (공개 HTML과 실제 Chrome 확인)
- 승인: 대표님이 Cloud 안정화·충돌 안내·새 기기 복원·백업 복구 4과제의 개발을 이 탭에 요청.
- 범위: hani-main.js의 Cloud lifecycle/읽기 비교/진단/백업 UI, index.html의 해당 UI, 전용 자동 검사.
- 타 담당: 대시보드·목표·보고서는 기존 담당 탭에 요청 전달. 해당 함수는 수정하지 않음.
- 보호: 키·내부 버전·표시 버전·캐시 태그 유지. migration/schema/새 Cloud write 경로/운영 데이터 변경 없음. 개별 운영 PR·병합·배포 금지.

## 확인한 문제

- 통신 오류 후 cloudStopAutoSync가 polling/ready를 끄며 focus/visible도 ready만 확인하여 연결 회복을 감지하지 못함. online listener 없음.
- 차이 확인은 기존 비교 버튼 위치로만 이동하며, 실제 차이·기준 유무·복원 안내를 보여주지 않음.
- 기존 cloudCompare가 동일 상태에서 기준 metadata를 직접 변경하며 복원 hold나 revision 후퇴를 판정하지 않음. 비교를 읽기 전용으로 정리할 예정.
- 현재 운영 Chrome은 동기화 ON 및 Local/Cloud 요약 일치. 반복 오류의 실제 Android 원인은 아직 재현하지 못했으며, 생활 원본/개인 수치는 기록하지 않음.

## 다음 행동

통신 복구만 기존 전체 안전 판정으로 재진입, 지속 충돌 자동 덮어쓰기 금지. 읽기 전용 분야별 차이와 새 기기 안내, 기존 전체 백업 함수를 이용한 수동 백업 및 복원/실패 검사. 완료 후 push/Notion 탑승 대기, Claude 통합 QA.

## 개발 결과

- Cloud 연결 실패 후 online/focus/visible에서 기존 full-state/revision/owner/backup 판정을 다시 실행. 실제 충돌·권한 오류·복원 hold는 자동으로 풀지 않음. 실패 재시도는 lifecycle 이벤트당 재판정이며 5초 간격 보호, 무한 자동 retry timer 없음.
- 읽기 전용 분야별 차이(동일 건수 다른 내용 포함), 비교 중 저장/로그아웃/계정 변경 시 결과 무효화. 비교는 동기화 기준 metadata도 변경하지 않음.
- 새 기기 복원은 기존 Cloud-only 자동 pull·안전 백업·read-back·rollback 경로 재사용. null/빈 문자열/boolean/음수/비정수 revision 자동 반영 차단. 안내 보강.
- 현재 전체 원본 안전 백업 버튼: 기존 IndexedDB 최근3개/legacy fallback/read-back 함수 재사용. 보호 원본 write 없음. 아린 지적2건(이전 비교 유지·실행처럼 읽히는 문구) 수정 후 코드 재검토에서 해결 확인.
- 변경 파일: hani-main.js, index.html, scripts/hani-cloud-stability-runtime.test.mjs, 이 인수인계, qa-evidence/cloud-stability-390.png 및 -1440.png.
- 함께 배포할 서버 기능/설정: 없음. Cloud update/insert 및 schema/SDK/보호 write 함수/내부 버전/표시 버전 변경 없음.

## 검사 결과

실제 현재 runtime을 로컬 가상 Chrome에서 실행, 외부 요청은 차단. 스크린샷은 synthetic 데이터만 포함.

- 신규 hani-cloud-stability-runtime.test.mjs: 26건 PASS(390/1440, 연결 복구, 실제 충돌 STOP, 비교0쓰기, hold 유지, 잘못된 revision·권한 오류 차단, 새 기기 복원·백업 실패 원본 보존, 수동 백업, 저장/로그아웃 비교 무효화).
- 기존 hani-quality-data-runtime.test.mjs: 28건 PASS. 최종 저장 UI 무효화 변경 후 재실행 PASS.
- 기존 hani-backup-history-runtime.test.mjs: 11건 PASS. 3MB 미디어 전체3개 백업/공간 부족/IndexedDB 거부/불일치/동시 입력/수신 rollback/응답 중 타 탭 변경 보존. 최종 변경 후 재실행 PASS.
- hani-access-ui.test.mjs: 6건 PASS; hani-transaction-runtime.test.mjs: 실제 거래 handler PASS.
- hani-owner-verification-runtime.test.mjs: 1440/390 PASS; diagnostic fixture7 PASS; server owner handlers2 PASS.
- hani-protected-write-contract.test.mjs: 19건 PASS; hani-protected-gate-integration.test.mjs: 12건 PASS. 중간에 비교 읽기 helper 재사용으로 정적 Cloud 호출수6→5가 게이트 차단되어 기존 직접 읽기6경로를 보존해 해결. 게이트/계약 완화 없음.
- node --check hani-main.js / git diff --check PASS.
- 테스트 실행 인자: node scripts/<runtime-test>.mjs C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs 'C:/Program Files/Google/Chrome/Application/chrome.exe'. Node v24.20.0.

## 미검증·인계 경계

- 실제 Android/PC 두 기기 인증 동기화·반복 불일치 해소, 운영 새 UI, 다른 실제 사용자·서버 장애/실제 Cloud 저장·복원은 미검증. 자동 충돌 병합은 구현하지 않음. 양쪽 필요한 기록을 선택적으로 합치는 기능도 별도.
- 기존 fingerprint/normalize/media 차이 전체 재진단은 실제 차이 확인 결과에 따라 후속. 이번 변경을 전체 Sync 문제 해결 완료로 표시하지 않음.
- 최종 package/OnePass/독립 서버 HINA/최신 main 통합/운영 검증은 Claude 배포 열차 담당.
- 작업 중 main이 e0e9da1(v2.9.187, 열차3호)로 진행됨. hani-main.js는 표시 버전만 달라 Cloud 앵커 변경 없음. 공부·YUNA·index 및 관련 테스트/서버 뉴스 소스가 변경됨. 자동 merge/rebase 없음. Claude는 최신 main 위에 Cloud 기능 diff만 적용하며 v185 표시/캐시를 되돌리지 말 것.
- 운영 데이터 초기화·수동 원본 선택·실제 백업 생성/복원 미수행. 개별 운영 PR·main 병합·배포 없음.
- Notion 카드: https://app.notion.com/p/3f0c527570748180b740dfc7bb4323e0
