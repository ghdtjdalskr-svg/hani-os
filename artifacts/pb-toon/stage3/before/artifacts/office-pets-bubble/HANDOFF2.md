# 작업 인수인계

## 작업 식별
- 작업: office-pets-bubble 2차 / Codex / 2026-11-06 KST
- 상태: 구현·검사 실행 완료. 기준/행동 fixture 미통과 및 실제 화면 검증 대기
- branch/worktree: hani/office-pets-bubble / pets-bubble
- HEAD: bc0d0eba76ec8a4ce951cab5af1a9f814df0d576 / 확인한 원격 main: 461dfdff4d26275a4d6d61c177280fd2d6ed35fe
- source SHA-256: 447edb86def004395e66af6aa79950280c23f3698f53af28db8d1f6fe6f6b148
- 승인: ../pets-move2-task.md 전체 지시. 기존 말풍선 수정 유지. 커밋·push·merge·버전·Notion·data/·assets/ 변경 금지.
- 범위: residentPeople/rhythm/life/snapshot, 기존 fitStatusLabels/openBubble/updateResidents, pet CSS, 전용 테스트·작업 artifacts. CODEMAP owner 확인, 세부 anchor 없음 → 좁은 검색(CODEMAP_MISS).

## 결과와 증거
- 제스처 6초·동물별 2초 위상, 입장 1/2/3초 홉 예약, 3px 홉·7도 흔들기·좌우 atlas. 기존 반응 큐/100ms tick만 사용.
- 산책 치즈·크림 15~30초, 모찌 25~45초. 허용 지점·route·safe 불변. 고정 출발 대기로 실제 주기 상한 보존.
- 모찌 오전3F·12시 이후1F. 기존 4F 청소 담당과 충돌해 13~14시 숨던 문제 회피. 3일 업무시간 표본 각각95% 이상 표시 검사 통과.
- 감소 모션 60초 고정·화면 밖 상태 정지·수면 중 자동 홉 금지. 수동 탭 우선순위 보완.
- 전용21개 중20통과/기존 모델 전체 pin1실패. 신규9개 전부 통과. 영향4파일105개:85통과/20실패. 전체46파일537개:486통과/48실패/3생략. 실패는 Git BLOCKED18·원문/모델pin19·주민 행동 기대값11. REPORT2.md·round2-test-results.json 참조.
- 직원 scheduler(plan/blockPlan)·snapshot byte 동일. 명시한7구간 밖 JS 전체 동일. 기존 assertion 원문 보존. 새 timer/listener/node/rAF/저장 경로0.
- 전체 로그: round2-office-final.tap / 영향 로그: round2-affected-final.tap / 소스: round2-source-checks.json / 사회 방문 시각 비교: round2-social-witness.json.
- 데이터·storage·Cloud/schema·버전/cache 영향 없음. 바이트 검증에서 추적 파일 변경은 JS/CSS/전용 테스트3개.
- 실제 브라우저·1280x900 20초 GIF: browser access host unavailable로 BLOCKED. 실제 화면·운영·Arin/HINA·release gate 미검증.
- main merge / Pages / 운영 실제 JS / 기능 read-back: 미수행. commit/push/PR/merge/배포 없음.

## 다음 담당에게
- 먼저: REPORT2.md, round2-failures.json, round2-source-checks.json.
- 다음: 서윤이 원문 pin·기존 주민 고정시각/주기/층/라벨 여유 기대값을 검토하고, 연결 가능한 브라우저에서 움직임·겹침·GIF 확인. 기존 assertion은 이 작업에서 삭제·완화하지 않음.
- blocker: spawnSync git EPERM은 BLOCKED. 원문·행동 fixture 실패는 PASS가 아님. 사회 방문은 기존 고정시각에 걷는 중이며1초 뒤 방문 복귀 확인.
- CURRENT/DECISIONS/Notion: 명시된 작업 범위 밖. Notion은 지시대로 미수정.
