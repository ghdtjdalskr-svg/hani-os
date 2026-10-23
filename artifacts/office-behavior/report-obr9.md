# obr9 — 동작 보존 성능 회복

2026-10-23 KST · 도연(Codex) 단독. **성능·byte 보존·전체 회귀 검증 통과. 로컬 커밋은 Git index.lock 권한 거절로 차단되어 미완료.**

## 기준과 변경

- branch `hani/release-train-20261023`, base `0b7bedde2583387a626a898f00dcb7a3ef4fecae`(obr8). 원격 main 조회는 네트워크 연결 실패로 최신성 미확인. 지정 기준에서 작업했으며 merge/rebase 없음.
- CODEMAP living-office owner 확인, scheduler anchor CODEMAP_MISS 후 실제 createScheduler → plan/blockPlan → reserve → snapshot 경로 확인. 운영 변경은 hani-office-live.js 계산 경로 하나다. DOM/event/renderer/timer 추가 없음.
- cpuprofile에서 반복 target resources 구성, static home/path 검사, group attempt와 reserve의 임시 객체 할당을 확인했다. 시간순 actor/층 점유 종료 인덱스, 원래 경로·홈 기하 판정의 메모리 cache, 이미 불가능한 시점/경로의 조기 종료, 자리를 떠나지 않는 동작의 빈 이동 배열 및 기존 안전 판정 재사용으로 계산을 줄였다.
- 후보 카드 순위·상위3개 제한을 보존한다. 기하 조기 종료는 선택된 후보 안에서만 적용하며, 시간대 경계가 없는 구간에서 원래 동일 home/segment 계산을 재사용한다. 20.01/24.01px·정식/휴식/errand 체류·seed/재시도·취소 규칙은 유지한다.
- 자택 동작의 빠른 예약은 available()의 동일 actor/층 자격 검사와 기존 staticSafe proof를 함께 사용한다. 다른 외출이 모든 allowed home을 연속 보호하므로 그 자리에서 움직이지 않는 동작에는 추가 이동 충돌이 생기지 않는다. 이동 후보의 resource/capacity/continuous sweep은 기존 경로에서 계속 검사한다.
- resources cache를 public event로 내보낼 때 배열을 복사해 서로 다른 event의 resources alias를 추가하지 않는다. 캐시는 메모리에만 있으며 저장소/Cloud/schema/migration/write 변경0.
- 최종 runtime SHA256: `d66271019face3d4792a0f8f4fd20909e214f92ade3dafad2aacb40776d3038d`. 버전/cache/index/마스코트/data/·행동 catalog·obr8 gzip 원문 불변. 기존 behavior-browser.json 및 타 untracked 작업 보존.

## 단독 성능3회

최종 runtime으로 기존 lively-v2 성능 테스트를 다른 검증과 겹치지 않게 새 Node 프로세스3개에서 순차 실행했다. 최초 formal+outing 계산을 포함하며 파일 읽기/JS 파싱은 기존 검사와 동일하게 제외한다. 400ms/3ms 기준과 기존 assertion은 변경하지 않았다. 최적화 도중 실패 표본은 PASS로 재사용하지 않았다.

|회차|하루 첫 계획 ms|웜 snapshot ms|판정|
|---|---:|---:|---|
|1|367.861|0.511|PASS|
|2|367.244|0.554|PASS|
|3|385.396|0.514|PASS|

원인 측정용 CPU profile 전/후: 첫 계획 606.29→381.99ms, formal 239.36→114.82ms, outing 366.92→267.17ms. 이 값은 계측 오버헤드가 포함된 참고치이며 위 단독 판정을 대체하지 않는다. obr9-before/after.json.cpuprofile 및 profile-summary.json에 근거 보존.

## 검증

|검사|결과|근거|
|---|---|---|
|전체 office/building|130개: 127 PASS / 0 FAIL / 기존 browser3 SKIP|obr9-all-tests-final.txt|
|233 pending 승인 기록|8 PASS / 0 FAIL, 누락·중복·변조·이동·타파일 거절 유지|obr9-baseline-final.txt|
|obr8 frozen 계획|원본 gzip/hash 보존. 기존 formal/outing/snapshot byte 및 deepEqual 통과, 모든 route/tie order 보존|기존 obr6/obr8 tests|
|추가 원본 대조|고정 obr8 Git source와 날짜·재실8조합, cache eviction/revisit, 시간대/그룹 경계 × 일반/reduced/summoned/cancel snapshot 일치, storage writes0|obr9-equivalence-final.txt|
|감사|54,000 snapshot, frozen/mismatch/stuckSeconds/near30/near24 전부0|obr9-audit-final.txt|
|syntax·diff·보호범위|syntax 및 diff check 통과. 금지 파일/고정 gzip HEAD 대비 byte 불변, Git export 원본 재검증|obr9-safety.json|

233 fixture는 기존7a10595 고정 Git 원본에서3 owner의 exact hunk로 명시적으로 재생성했다. before/after fragment 각각1회 및 완전 역변환 byte 검사 통과. 검증기와 기존 부정 assertion은 그대로다. 테스트 중 기대값 생성 없음. obr8 고정 source identity와 최적화된 obr9 runtime identity를 별도로 정확히 pin했으며 frozen 계획 hash/byte 비교는 변경하지 않았다.

Node Git subprocess는 EPERM으로 차단되어 기존 read-only obr5 공급기의 native Git blob export를 사용했다. 공급기는 각 원본 SHA256을 확인하며 현재 runtime을 Git oracle로 대체하지 않는다. 기본 스크립트 최초 실행의 환경 실패 로그는 obr9-all-tests-initial.txt에 별도 보존하며 최종 PASS로 인용하지 않는다.

## 인수인계와 남은 경계

- `git add -- hani-office-live.js`가 `.git/worktrees/obr/index.lock: Permission denied`(exit128)로 거절됐다. stage0·commit0, HEAD obr8 유지. 별도 index/권한 우회 없음. 아래 파일은 로컬 변경으로 보존했다.
- 실제 Edge/폰 실화면·Candidate/package/One-Pass/독립HINA·main/Pages/Production read-back은 미수행. 기존 browser3 SKIP은 PASS가 아니다. 기능 담당의 버전 증가는 사용자 금지로 N/A, 표시 버전 보존은 별도 검사했다.
- push/PR/Notion 없음(사용자 명시 금지). 서버 Edge Function/설정 동반 변경 없음. 다음 담당은 권한이 있는 환경에서 명시된 파일만 로컬 커밋한다. 배포 여부는 별도 승인 범위다.

한국어 결과 재현: `node scripts/hani-office-obr9-report.mjs -o artifacts/office-behavior/obr9-results.json`. 상세 명령과 파일 목록: docs/development-history/handoffs/2026-10-23-office-obr9.md.
