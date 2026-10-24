# Asset Intake v2 C · 저장 계약 정정 계획

## 성민 대표님께 드리는 1페이지 요약

2026-10-24 KST / 담당 도연(Codex) / CRITICAL. 미션에 인용된 대표님 승인: “저장 로직 수정(C) 승인. 백업·복구 계획 먼저 보여주고 진행해줘.” 이 계획서를 코드 수정 전에 작성합니다.

### 무엇이 바뀌나요?

합성 예: 이전 기록에 합성전자 2주, 평균 100원, 현재가 110원, 평가액 220원, 손익 20원이 있습니다. 새 화면에 수량 2주만 있으면, 지금은 현재가 110원 등이 새 기록에도 남습니다. 수정 뒤에는 현재가·평가액·손익·수익률은 null(미확인)입니다. 이번 입력에 없는 종목도 보유 목록과 수량·원가는 유지하되 새 기록의 동적 평가값은 null로 비웁니다. 0은 실제 입력값으로 보존합니다.

수량·평균단가·매입금액은 시세와 다른 보유 사실이므로 정확히 같은 종목일 때 이번 입력의 빈칸만 이전 값으로 유지합니다. 신규 종목의 원가는 없으면 null입니다. 종목 코드·시장·instrumentId가 충돌하거나 동일 이름 후보가 여러 개면 이전 종목의 identity·원가를 재사용하지 않습니다. 부분/unknown 목록의 누락은 매도가 아닙니다. 전체목록도 기존 누락 차단·수량0 명시 규칙을 유지합니다.

### 바뀌지 않는 것

기존 과거 snapshot을 일괄 수정하지 않습니다. 기존 동일 월 기록 갱신 방식은 유지하며 대상 계좌의 승인 내용만 바뀝니다. 이전 월 snapshot·다른 계좌·다른 기능·저장 key hani_os_life_v23·내부 버전 2.9.15-safe-baseline-bootstrap·schema를 유지합니다. 새 key·migration·Cloud 쓰기 구조·버전 증가·push·PR·배포는 없습니다.

### 배포 전 백업: 대표님이 할 것 / 자동으로 되는 것

대표님: 실제 배포 승인 전에 설정·데이터 → ① 백업·복원 → JSON 백업 / 복원 → ‘백업 파일 만들기’로 전체 JSON을 내려받아 별도로 보관하고 파일 존재·크기·기준일을 확인합니다. 사진이 있으면 기존 media 포함 내보내기를 기다립니다. 이 작업에서 실데이터 백업이나 복원은 실행하지 않습니다.

PC Drive Vault가 이미 연결되어 있으면 같은 화면의 ‘Google Drive 백업 보관함’ → ‘지금 백업’으로 검증된 파일을 추가 보관할 수 있습니다. 연결되지 않았다면 ‘백업 폴더 연결’로 PC Google Drive 폴더를 선택하는 기존 기능입니다. 권한 유지·소유자/원본 준비 조건이 맞을 때 시작/복귀 시 7일 간격 자동 백업을 시도합니다. Drive 업로드 자체가 이 코드만으로 보장되지는 않습니다.

자동: 보유정보 전용 승인에는 기존 before_positions_update 전체 내보내기가 선행합니다. 일반 approve에는 매번 전체 JSON 자동 내보내기가 없으므로 배포 전 수동 백업이 필요합니다. 기존 안전 사본·Drive 조건부 백업은 그대로이며 새 기능을 만들지 않습니다.

### 복구

코드 문제는 배포 담당이 마지막 승인 버전을 기존 배포 gate로 재배포합니다. 코드 되돌리기만으로 이미 저장된 null이 옛 값으로 돌아오지는 않습니다. 데이터 복구가 필요하면 대표님 확인 후 설정·데이터 → ① 백업·복원 → ‘백업 파일 불러오기’에서 검증된 배포 전 JSON을 선택합니다. 복원은 전체 데이터에 영향을 주므로 백업 후 새 기록 유무를 먼저 비교해야 합니다. 기존 경로는 구조 검증·복원 직전 before_import 전체 백업·동기화 보류 후 이 기기에 적용합니다. Cloud 반영은 별도 확인입니다.

저장 실패 시 기존 save 결과/read-back과 메모리 원복 경로를 유지합니다. 실패하면 입력·Preview를 지우지 않고 재시도할 수 있습니다. 저장 성공 후 표시 갱신 실패는 저장 실패와 구분합니다. 성공한 디스크 쓰기 뒤 read-back만 고장 난 경우에는 현재 owner에 디스크 원복이 없으므로 무조건 이전 저장값으로 복구된다고 보장하지 않습니다. 이 제한을 시험·인수인계에 명시합니다.

### 검증과 남는 위험

합성 자료로 동적 missing→null·0 보존, identity 정확/충돌/모호성, 수량·원가 보존, 부분 누락 보존, 타 계좌·과거 snapshot JSON 바이트 불변, 저장 실패/읽기 실패/메모리 원복, Preview write0, 보호 key·내부 버전·localStorage 호출 수 불변을 검사합니다. 기존 224·A+B·asset-update smoke도 재실행합니다. 실제 브라우저 실행 불가 시 서윤 재실행 대기로 기록합니다.

배포 후에는 대상 계좌의 새 기록에서 missing=null, 보유 목록·수량·원가, 다른 계좌·과거 기록, 새로고침 후 read-back을 확인해야 합니다. 현재 요청에서는 배포하지 않습니다. 실제 OCR 정확도·실계정 저장·Drive 업로드·Android·최종 release gate는 미검증입니다. 조회 계산 brokerCalc는 null에서 값을 계산할 수 있어 원시 저장 필드와 표시를 구분해야 합니다.

## 기술 상세 및 기준선

- branch hani/asset-intake-v2, 시작 HEAD bd39ea718e6b5ff8f12b261d96caa38c2f656e1c(A+B). base/main d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf, GitHub branches/main에서 이번 세션 확인. 로컬 표시 2.9.232 유지. 실제 운영 화면·최신 JS 로딩은 미검증.
- CODEMAP asset-update owner/approve 확인. 상세 저장 merge anchor는 CODEMAP_MISS로 좁은 함수 조사.
- 수정 범위: hani-asset-update-v1.js의 mergeWithExistingHoldings/approve/approvePositions 및 저장 identity 대응을 위한 최소 Preview 매칭 의존부, 관련 회귀 tests, 계획/인수인계/검증 artifact. normalizeBroker*는 이미 null을 보존하므로 수정 불필요.
- 기존 백업 근거: index.html #settingsData/#group-backup/#exportBtn/#importBtn/#driveVaultBackup. hani-main.js exportData(8133), importFile onchange(8161), setImportSyncHold(1226). hani-drive-vault.js weeklyDecision(9), writeBackup(22), backup(246), visibilitychange(350).
- 저장 근거: hani-asset-update-v1.js approvePositions, approve, readStoredState, storedAccount. 실패 catch는 메모리 원복 및 draft 유지. save는 hani-main.js 1331부터 확인. 백업/복원/삭제 동작은 수정하지 않음.
- 설계 판단: 설계 표의 수량 required 및 원가 optional 원칙을 신규 입력 검증에 유지. 저장 merge에서만 정확한 기존 보유 사실을 유지하며 원가를 평가자료처럼 지우지 않음. 평가 전용 저장에서 동적값은 합성하지 않고 canonical draft의 이번 값/null만 반영.
- Notion 착수 append는 자동 승인 검토에서 “MCP tool call requires approval, but approval policy is never”로 거절. 갱신 대기를 결과 인수인계에 보존. 저장/read-back 완료 아님.

## 중단 후 재개 검토 (2026-10-24 KST)

대표님이 기존 계획 검토·마무리와 C 미션 계속 수행을 지시했습니다. 원격 main은 d19aa0b로 재확인했습니다. 실제 HEAD의 JS는 처음 5행과 마지막 IIFE 닫힘만 CRLF(6개), 나머지 475개는 LF입니다. 이전 실행의 전행 CRLF 변환을 복구하고 비변경 행 바이트를 비교합니다. git CLI가 없어 요청한 diff --ignore-cr-at-eol은 현재 실행 불가이며 Git object의 HEAD 바이트와 줄바꿈 무시 비교를 병행합니다.

종목 재사용은 유일한 코드 또는 instrumentId 또는 정규화 이름+확정 시장 일치이며 알려진 코드·시장·instrumentId 충돌은 거절합니다. 이름만으로 재사용하지 않습니다. 수량·원가(계좌 매입합계 포함)는 보유 사실로 유지하지만 현재가·평가·손익·수익률·비중은 새 기록에서 missing=null입니다. 부분 누락 종목의 identity·수량·원가는 보존하고 평가 관측만 지웁니다. 보유정보 전용 경로도 원가는 유지합니다.

합성 Hana는 계좌 카드(국내/접힘 포함)+전체 잔고 두 화면·0 현금·실시간 평가차·서로 다른 수량·원가 보완 형태만 사용합니다. 실제 ground truth 수치는 .private-intake 안에서만 replay하고 코드·공개 결과에 넣지 않습니다. 승인 callback에서 성공/실패/throw/read-back 오류/성공 뒤 화면 갱신 오류·원복·Preview 무쓰기·과거/다른 계좌 보존을 검증합니다. 기존 read-back이 성공 쓰기 뒤 실패하면 디스크 값은 이미 바뀔 수 있다는 한계는 수정 범위 밖이며 보고합니다.

## 실행 완료·남은 검증

로컬 C 구현과 신규 C13·기존224 기능45·A+B9 합계67 및 smoke 검증을 완료했습니다(Node REPL VM). 계좌 매입합계는 null뿐 아니라 undefined missing도 보존합니다. runtime 최소 diff는 +21/-7, 비변경474행 바이트 일치입니다. 보호8함수 불변·승인된3함수 정확한 전후 원문·write 표면 불변을 확인했습니다. 최종 해시는 artifacts/asset-intake-v2-C/source-hashes.json에 있습니다. Git release-chain1은 CLI 부재로 차단, 실제 browser와 운영 검증은 미실행입니다. Hana 역산 매입 보완과 catalog exact는 미검증/미지원이며 C에서 확장하지 않았습니다. 상세 결과·Notion 자동 승인 거절·후속 담당은 2026-10-24-asset-intake-v2-C.md를 따릅니다. push·PR·배포·버전 증가는 수행하지 않았습니다.
