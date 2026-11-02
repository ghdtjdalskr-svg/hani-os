# 3F 팀장 G 배치 적용

## 작업 식별

- 작업 ID / 제목: office-tlayout / 승인된 3F 팀장석 G 적용 마무리.
- 갱신 시각(KST): 2026-11-02.
- 담당 도구 / 검토 담당: Codex 단독 개발·자동 검사, 독립 Arin/HINA 미실행.
- 상태: 로컬 검증 완료·서윤 검토 대기 / 미커밋.
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/office-tlayout / office-tlayout-apply.
- base SHA / candidate SHA: 476210cdbe0408039672932aa3ab6bbde825860a / 미커밋, runtime SHA-256 3fe955345e8e843d05035159468ea364221b5bcb606a9edf73a80b9355455a46.
- 목표 / 완료 조건: 승인 G 아트·실제 의자·32px 틈 우회, 유지 수치·주민 정지점·폰 충돌·전체 사무실 검사·한국어 보고서.
- 수정 범위: building JSON 2개·이미지 1개, 기존 office JS 5 fragment·CSS mask rule 1개, 영향받은 도구/고정 fixture. 전체 목록은 보고서 참조.
- 사용자 승인 근거 / 경계: ../office-tlayout-apply-task.md 및 finish-task.md. 기존 미커밋 위 계속 작업. commit/push/merge/버전/cache/Notion 변경 금지. 서윤 소유 obr21·labels/residents source-delta 미수정.

## 결과와 증거

- 서윤 (11.5,61.5)→(9.1,68.5), facing right. 유리 (10.8,83.5)→(37.7,84.5). 도연·세린·아린 좌석 유지. 북쪽/왼쪽 우회·중복 의자 제거·기존 19개 소품 이동·기존 가림 slot 사용.
- 비점심 부재/출근 3.418889/3.552222, 점심 6.744444/6.938889, 옥상 .538889/.501111. 방문객·host 기준 충족, 드라마 출근96/100·부재90/100 PASS.
- 실제 Edge 360·390·416·1280px × 10:00·12:00, 직원 5명 착석 fixture: overlap0/overflow0/storage write0/pageerror0, PNG8개. 실제 scheduler는 별도 시험.
- 최종 v7 전체41검사 실행: 399통과·18 Git EPERM 차단·18기존/서윤 소유 fixture 실패·3skip. 전체 PASS 아님. 기존 주민12·HD3은 변경 전 원문에서도 재현. source-delta drift와 Git EPERM 차단 별도 기록. 새 G complete plan/outings/reverse-snapshot16건 oracle.
- 증거/최종 상세: [REPORT](../../../artifacts/office-tlayout-apply/REPORT.md), resume-final-effective-summary.json, resume-v7-summary.json, resume-final-inputs.json, resume-preservation.json, keep-final.json, browser-final.json, browser-phone-final.json.
- 실행하지 않은 검증 / 위험: Git subprocess 차단, 서윤 소유 fixture 재고정, 전체 앱/사용자 데이터/Cloud/운영 미검증. cold best-of-3는 모든 task worker 종료 후 단독 Node에서 부재349.38/출근358.55ms PASS. Worker 성능 실패 원문과 단독 CLI 재검증을 분리 보존.
- 데이터·저장소·Cloud·schema 영향: read-only 시각/행동 배치. localStorage/Cloud/schema/AI write 추가 없음. 보호 함수 screenHomeClear/placeStatusLabels byte 동일.
- PR / Preview / 배포: 없음. 로컬 스크린샷으로 검토 가능.
- main / Pages / 표시 버전 / 실제 JS / read-back: 원격 main28cce59 확인(기준 이후 tests/docs 진전, office JS baseline 동일), 자동 merge/rebase 없음. 표시2.9.259·cache/index 보존. main 병합·Pages·Production read-back 미실행.

## 다음 담당에게

- 먼저 읽을 파일: REPORT.md → resume-final-effective-summary.json → scripts/hani-office-tlayout-fixture.mjs / office-tlayout-data-delta.json.
- 다음 한 가지 행동: 서윤이 Git 차단 검사·예약된 fixture 갱신을 수행하고 별도 데이터/이미지 PR(3파일)과 runtime/tooling 분리를 검토.
- blocker / 사용자 결정: 남은 시험 근거·독립 Preview·열차 승인 대기. 배포 승인으로 해석하지 않음.
- 다른 작업 영향: 다른 worktree 미수정. 최신 main의 토끼 관련 시험 수정은 이 branch에 통합하지 않음.
- CURRENT / DECISIONS: 공통 파일 미수정, 작업별 근거만 보존. Notion은 작업별 명시 금지로 미수정.
