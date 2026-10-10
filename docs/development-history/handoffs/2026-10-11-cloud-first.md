# Cloud 우선 정책 인수인계

## 작업 식별

- 갱신 시각(KST): 2026-10-11
- 담당 도구: Codex (단독 개발 + 자동 검사)
- 상태: 구현 및 Node targeted 검증 완료 / 브라우저 검증 환경 차단
- branch / worktree: hani/cloudfirst-20261011 / cloudfirst
- base SHA: 9f48074202b972f36dab3f15274227b261224b57 (production v2.9.201)
- 목표: Cloud 우선 기본 정책, snapshot-first 충돌/새 기기 복원, 유효 기준 이후 Local 단독 변경 업로드 유지.
- 수정 범위: hani-main.js, index.html Cloud 정책 카드, scripts/hani-cloud-first.test.mjs, scripts/hani-cloud-egress-save-sim.test.mjs, scripts/hani-cloud-stability-runtime.test.mjs, 본 인수인계.
- 사용자 승인: 2026-10-11 본 작업 요청. 기존 write 경로만 재사용. 커밋·버전 증가·merge·배포 금지.

## 결과와 증거

- 중단 시점의 기존 파일을 확인한 뒤 이어서 수정했다. 커밋·branch 재생성·타 작업 merge/rebase 없음.
- 원격 main은 GitHub connector의 fetch_commit(main)으로 확인: base와 동일한 `9f48074202b972f36dab3f15274227b261224b57`. shell git ls-remote는 네트워크 연결 차단으로 실패. 기준 index의 표시/캐시 v2.9.201 및 마지막 UI 스크립트 hani-ui-v02992.js?v=2.9.201 확인. 운영 브라우저 read-back을 새로 수행했다는 의미는 아님.
- CODEMAP cloud-sync owner/dependency 및 실제 함수 anchor 확인. 새 정책은 기존 `hani_os_cloud_meta_v1.syncPolicy`에 저장한다. 새 localStorage 키 없음. 저장하지 않은 기기는 Cloud 우선 기본값, `manual`이면 기존 충돌/새 기기 선택 흐름.
- Cloud 우선에서는 기준 없는 차이·새/빈 기기·동시 변경을 snapshot-first로 Cloud에 맞춘다. 기존 cloudSaveSafetySnapshot → cloudApplyRemoteRow → cloudSaveSyncMeta 경로만 사용한다. 자동 선택 문맥은 사용자 패널/dialog에 표시하지 않는다. 완료 후 차분한 toast, 기준 저장 실패 시 STOP.
- 자동·수동 동기화/복원 종료 후 기존 Cloud renderer를 갱신하여 새 정책 선택 카드가 비활성 상태로 남지 않도록 했다. write 로직 변경은 없다.
- 유효 기준 이후 Local 단독 변경은 기존 cloudPushLocalRow로 업로드한다. Cloud revision만 증가하고 내용은 기준과 같아도 Local 변경을 유지한다. 빈 Local 업로드 금지, 빈 Cloud 자동 업로드 금지, revision rollback/동일 revision 내용 불일치 차단 유지.
- owner/client/epoch/정책·복구 상태를 비동기 조회 후 검증하고, 백업 이후 기존 cloudVerifyChoice로 Local/원본 raw 및 최신 Cloud metadata를 재확인한다. metadata-first 및 검증된 메모리 캐시 경로 유지.
- 지정 Node는 재개 실행에서 정상 동작: v24.20.0. 이전 중단 기록의 Access is denied를 현재 결과로 재사용하지 않았다. V8 대체는 필요하지 않았다.
- 실행 PASS: `node scripts/hani-cloud-first.test.mjs` (40건), `node scripts/hani-cloud-conflict-choice.test.mjs`, `node scripts/hani-cloud-egress-save-sim.test.mjs`, `node scripts/hani-cloud-egress-sync.test.mjs`. 모두 합성 데이터, 실제 Supabase 호출 없음. 실제 snapshot/apply 함수와 선택 검증 함수를 VM에서 실행한다. egress 모의 검사는 실제 push 경로의 기본 정책 저장3회/full read0 및 수동 충돌·revision 경합 차단을 확인했다. 로그의 revision 20→21 오류는 의도한 차단이며 해당 이유까지 assertion으로 검증했다.
- PASS: hani-main.js·변경 runtime test의 Node syntax, git diff --check, 중복 HTML id 없음. baseline 대비 protectedSurface/표시·내부 버전 동일. snapshot/apply/push/writeProtectedState/removeProtectedState 5함수 원문 동일(줄바꿈 정규화 비교). 보호 키·기존 storage/Cloud write 경로, schema/migration 변경 없음. 신규 `.clear(` 없음.
- BLOCKED: `hani-cloud-stability-runtime.test.mjs`와 `hani-backup-history-runtime.test.mjs`를 아래 지정 인자로 실행했으나 둘 다 `browserType.launch: spawn EPERM` (exit1). 브라우저 테스트 본문·IndexedDB 이력 검증·390/1440 화면 검사 PASS 아님. Cloud runtime 검사에는 기존 수동 흐름을 유지하고 Cloud 우선 자동 적용·백업 실패·빈 기기 및 정책 UI 확인을 추가했으며 아직 실행 검증되지 않았다.
- 실행 환경: Node `C:/Users/홍성민/AppData/Local/Programs/nodejs/node.exe`, Playwright `C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`, Edge `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`. runtime 명령: `node scripts/<runtime-test>.mjs <Playwright index.mjs> <Edge msedge.exe>`.
- 상세 로컬 로그: `.ai-budget-private/cloudfirst-qa/` (gitignore 적용). 원문 코드와 변경분은 현재 미커밋 worktree. candidate/package SHA N/A (릴리스 후보 요청 없음).
- Notion: 현황판 읽기 성공. 재개 계획 append는 자동 승인 검토에서 “MCP tool call requires approval, but approval policy is never”로 거절됐다. 착수·최종 결과 모두 갱신 대기이며 저장/read-back 완료로 보고하지 않는다. 반영 대기 요약: Cloud 우선 구현, Node4검사·40건 및 보호 경로 비교 PASS, 브라우저2검사 EPERM 차단, 미커밋·미배포, 다음 환경 검증.
- main merge/Pages 반영/운영 기능 read-back: 실행 안 함, 미배포. 표시/캐시 버전 증가 없음. 실제 계정·Android, 독립 아린 및 Candidate/HINA 검증은 미검증. 개발 증거를 릴리스 승인으로 간주하지 않는다.

## 다음 담당에게

- 먼저 읽을 함수: cloudSyncDecision, cloudSyncCycle, cloudApplyRemoteRow, cloudVerifyChoice, cloudSaveSafetySnapshot.
- 다음 행동: 브라우저 실행 가능한 환경에서 두 runtime 검사를 완료하고 실제 Cloud/PC·모바일 Preview 확인. 이후 대표님 요청 범위에서 커밋·열차 인계 가능; 현재 요청은 커밋 금지.
- 별도 서버 Edge Function·설정 변경이나 배포 순서 없음. 운영 반영은 Claude 배포 열차의 후보 freeze·버전 증가·필수 gate·승인 경계를 따른다.
- CURRENT/DECISIONS: 타 작업 현황 보존. 이 파일이 미커밋 작업 원문.
