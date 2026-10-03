# HANI Development History

이 디렉터리는 PROJECT HANI의 개발 상태를 한곳에서 찾기 위한 버전 관리 원본이다. 사용자용 중앙 사본은 `C:\Users\홍성민\Documents\HANI_DEV_HISTORY`에 둔다.

## 기록 원칙

- Production 완료는 `main 병합 → GitHub Pages 반영 → 표시 버전 → 최신 JS 로딩 → 기능 read-back`이 확인된 경우에만 사용한다.
- `preview`, `candidate`, `deferred`, `superseded`, `production`을 서로 바꾸어 쓰지 않는다.
- 오래된 PR이나 worktree는 삭제 여부와 별개로 최신 구현에 포함됐는지 먼저 판정한다.
- 후보 기록은 보존할 수 있지만 공식 Devlog는 실제 Production 배포 버전만 대상으로 한다.
- 보호 저장소 키, 내부 데이터 버전, 비밀정보, 사용자 원본 데이터는 개발 기록에 복제하지 않는다.
- 이 문서만 변경하는 작업은 runtime 버전 증가와 Production QA가 `N/A`다.
- 특정 작업이 Production read-back까지 완료되면 중앙 상태표와 통합 우선순위의 상태·완료일·다음 선행 작업을 같은 보고에서 갱신한다.

## 상태 정의

| 상태 | 의미 |
|---|---|
| `PRODUCTION` | 운영 반영과 read-back까지 완료 |
| `PAGES_LIVE` | main과 Pages 반영은 확인했지만 전체 기능 read-back은 아직 미확인 |
| `PARTIAL` | 일부가 운영 반영됐지만 정의한 최종 범위는 남음 |
| `CANDIDATE` | 구현 또는 검증 후보이며 main/Production 완료가 아님 |
| `DEFERRED` | 보류 사유가 있고 재진단 또는 승인이 필요 |
| `BACKLOG` | 설계 또는 아이디어 단계로 구현 근거 없음 |
| `SUPERSEDED` | 최신 릴리스나 후속 PR이 기능을 대체함. 병합 금지 |

## 진입점

- [중앙 인덱스](./INDEX.md)
- [2026-10-04 기준 프로젝트 상태](./2026-10-04-p0-project-status.md)
- [PR61·68 및 오래된 후보 분류](./2026-10-04-pr-triage.md)
- [v2.9.165 main drift 및 Pages 상태](./2026-10-04-v2.9.165-aura-menu-status.md)
