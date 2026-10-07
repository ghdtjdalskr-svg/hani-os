# Google Drive Vault 1차 설계

대표님이 승인한 우선순위 5의 설계 범위. 실계정 OAuth·업로드·복구 구현 및 운영 데이터 변경 없음.

## 제품 흐름

Drive는 운영 원본 DB가 아니라 사용자가 소유하는 외부 백업·보고서 보관함으로 시작한다. 기존 Local-first 및 Cloud 원본 판정 유지. 연결 → 보관할 파일 Preview → 사용자 승인 → 새 파일 업로드 → 다시 다운로드하여 byte/hash 검증 → 성공 표시. Cloud 장애가 나도 Local 데이터를 수정하지 않는다.

## 파일과 권한

- 기존 HANI JSON 백업 계약과 원본 파일 그대로 보존. 새 형식으로 자동 migration하지 않음. 파일명은 `HANI_OS_backup_<KST timestamp>.json`; 같은 이름이라도 기존 파일 덮어쓰기 대신 새 파일 ID 생성.
- 보고서 PDF/PPTX는 별도 파일, 실제 출력 검증된 파일만 업로드 대상으로 사용.
- 소유자가 Drive UI에서 볼 수 있는 일반 `HANI OS Vault` 폴더 추천. `drive.file`은 앱 생성/사용자가 선택한 파일 단위 접근이므로 전체 Drive 접근보다 적합. OAuth client 등록·동의 화면·실제 계정 승인 및 token lifecycle 설계가 선행되어야 함. 토큰을 백업 JSON/개발 기록/보호 생활 데이터에 넣지 않음.
- 앱 전용 `appDataFolder`는 Drive UI에 보이지 않으므로 사용자 직접 관리 요구에는 1차 기본안으로 선택하지 않음.
- Google 공식 권한 안내: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- 앱 전용 공간 안내: https://developers.google.com/workspace/drive/api/guides/appdata

## 복구와 검증 조건

1. 선택한 백업을 메모리에 내려받아 기존 validateBackup/validateStoredRecords로 읽기 전용 확인. 실패하면 원본 유지.
2. 데이터 건수·작성시각·파일 해시·현재 Local과 차이 Preview. 다른 계정 파일인지 판정할 계약이 확정되기 전 실제 복구 차단.
3. 현재 Local 원본 백업 성공 확인 후 명시적 복구 승인. 기존 복구 hold·원본 보호 경로 재사용하며 Cloud로 자동 업로드하지 않음.
4. 복구 승인 이후에만 기존 저장 경로 사용. 새 protected write/schema를 추가하려면 보존/rollback 테스트와 대표님 별도 승인.

오프라인, OAuth 거부/취소/만료, 업로드 중단, 같은 이름 충돌, 다운로드 불일치, malformed/unknown fields, 다른 사용자, 실패 rollback 및 실제 Android/PC 검증이 구현 단계 필수 항목이다. 보관 자동 삭제·공유·지속 자동 동기화는 1차 범위에서 제외.

## 다음 구현 진입 조건

Cloud/백업 담당의 기존 백업·복구 계약 확정과 실기기 검증 → OAuth/파일 권한 연결 구체안 → 읽기 전용 파일 선택·Preview → 승인된 업로드/복구 개발. 이번 결과는 설계 완료이며 Drive 연결 기능 완료 또는 런타임 탑승 대기가 아니다.
