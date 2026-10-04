# 승인된 AURA 배포 용량 확대 — Gate Contract 2.0.3

성민 대표님이 AURA 후보의 기존 용량 검증 차단(88파일 / 15,175,483 bytes)을 확인한 뒤 용량 제한 확대를 명시적으로 승인했다.

- 파일 한도 86 → 88.
- 전체 bytes 14,100,000 → 15,200,000.
- 단일 파일 5,000,000 유지. 경로 allowlist, 인증, 승인, SHA/무결성, 보호 storage/internal version, 서버 최종 Gate는 변경 없음.
- client contract와 server mirror를 같은 2.0.3 / 11f25f34efdafee7826e03d214234afe5914dc9f27bead970f49606e79e3d427로 연결.
- 기존 서버 source(version26)가 저장소 source와 일치함을 확인. verify_jwt=false의 기존 사용자 JWT custom auth 검증 경로 유지. 새 인증/권한 확대 없음.

## 검증 및 롤백

실행 테스트는 88허용/89차단, 15,200,000허용/15,200,001차단, 단일 5,000,001차단, client/server parity와 데이터 보호 계약의 다른 필드 불변을 검증한다. 기존 read-only PR QA의 drift/tamper 거부도 재검증.

Gate Self-Protection PR label은 대표님의 이번 명시 승인에만 근거해 설정하며 보호 경로를 무조건 허용하도록 수정하지 않는다. 이 tooling-only 변경은 런타임 표시 버전 N/A. runtime poster 후보와 별도 commit/PR로 관리한다.

운영 서버 배포 전 기존 version26의 source/설정 read-only 사본을 확보한다. 문제 시 해당 사본의 동일 설정으로 복구하고 신규 runtime 후보는 승인하지 않는다. 용량 초과 fixture는 실제 서비스에 전송하지 않고 격리된 로컬 코드 실행으로 검증한다. 서버 적용 후 인증 없는 요청이 여전히 401이고 authenticated health contract identity가 동일한지 확인한다.
