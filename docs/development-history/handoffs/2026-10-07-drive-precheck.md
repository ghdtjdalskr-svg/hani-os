# Drive Vault 사전검사 도구 · 개발 준비 완료

- Codex / 2026-10-07. 대표님 가능한 항목 탑승 준비 지시. 중단된 다른 탭의 untracked 초안 2파일을 별도 branch로 복사해 원본 보존 후 완성.
- branch `hani/drive-precheck-complete-20261007`, base `691385cf11faa7906a0d27472d8e32884f2be1ea`.
- 변경은 scripts의 순수 검사와 합성 회귀, 이 인수인계만. 운영 runtime/storage/auth/Cloud/schema/버전/cache 변경 없음. 서버 동반 없음. 문서·개발도구로 runtime QA N/A.
- 기존 export의 `_haniBackup` format1/key/internal version 계약 검사, 예전 v22는 별도 분류·metadata 누락 경고. 파일 원본 sha256/byte size/기록 개수만 반환, 생활 내용 미출력·입력 불변. unsupported metadata/version/key, 손상 JSON·목록, 용량30MiB초과, 과도한 depth, token/secret 유사 내용 거부. byte/hash는 파일 그대로 계산하며 자동 변환/복구 없음.
- `node --test scripts/hani-drive-vault-precheck.test.mjs` PASS. 현재/legacy·오류 fixture, 원본 내용 미노출, Windows 한국어 경로 CLI 실제 실행/종료코드/파일 불변 검증. CLI는 선택한 합성 파일을 read-only로 읽음. syntax/diff PASS. 실제 민감 백업 파일 미사용.
- 30MiB는 사전검사 자원 상한이지 현재 서버 업로드 허용량이 아님. 이 검사는 파일 전송 전 준비 검사이며 기존 복원 보호 검사·owner 검증을 대체하지 않는다. 비밀정보 탐지는 휴리스틱이라 검출하지 않은 파일에 비밀이 없다는 보장으로 사용 금지.
- 실계정 OAuth·Drive 업로드/다운로드·복원 UI 미구현. Drive 제품 전체 탑승 완료 아님. 개발도구 준비 카드만 탑승 대기로 기록.
- 미래 연결: 업로드 전 파일 선택 → 이 검사 통과 → 명시적 업로드 확인 → 새 파일 생성 → 다운로드 bytes/hash 원본과 비교. 다운로드는 sha256 불일치 거부 후 동일 검사 → 기존 복원 Preview/승인 경로. 사용자 계정/파일 소유 확인 및 token 분리 저장은 별도 승인된 구현으로 진행.
- 운영 PR/main merge/배포 수행 없음. 기존 Drive 설계 및 복원 계약 보호 규칙을 유지.
