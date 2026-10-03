# HANI DEV HISTORY

이 폴더는 성민 대표님이 PROJECT HANI의 개발 상태와 배포 기록을 날짜별로 확인하는 중앙 기록소다.

## 어디서 시작하나

1. `INDEX.md`에서 최신 기준선과 최근 Production 계보를 확인한다.
2. `2026-10-04/p0-project-status-v2.9.165.md`에서 완료·부분 완료·후보·미착수를 확인한다.
3. `2026-10-04/pr61-pr68-triage-v2.9.165.md`에서 오래된 PR과 후보의 처리 방향을 확인한다.
4. 날짜 폴더의 `release-record`는 실제 배포 근거를 보존한 기술 원장이다.

## 상태 해석

- `PRODUCTION`: 운영 반영과 기능 read-back 완료
- `PAGES_LIVE`: main과 Pages 반영 확인, 전체 기능 read-back 미완료
- `PARTIAL`: 일부 운영 완료, 최종 범위가 남음
- `CANDIDATE`: 구현 후보이며 main/Production 완료 아님
- `DEFERRED`: 재진단 또는 승인 대기
- `BACKLOG`: 미구현
- `SUPERSEDED`: 후속 릴리스가 대체했으므로 병합 금지

공식 비개발자용 Devlog는 Production 배포가 확인된 버전만 대상으로 한다. 후보·실험 branch와 보호 데이터·비밀정보는 이 폴더에 복제하지 않는다.

특정 작업의 Production read-back이 완료되면 해당 완료 보고에서 `INDEX.md`와 프로젝트 상태표의 통합 우선순위를 함께 갱신한다. 완료 항목은 완료일과 근거를 남기고, 다음 작업의 선행 관계와 우선순위를 다시 계산한다.
