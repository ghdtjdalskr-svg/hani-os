# 설정 225 control mapping fixture

Source: settings225 proposal, 2026-10-21; base 331291eb.

| `#settings` | 설정·데이터 / 사내 규칙 | 설정·데이터 사내 규칙 Google Drive 백업 보관함폴더 권한 확인 PC의 Google Drive 안에 'HANI OS Vault' 폴더를 만들고 선택해 주세요. Google Drive 폴더에 저장하면 자동으로 | 조회 시/필요 시 | normal | index.html · 기존 카드/상태/summary | 공통/조건부 |
| `#settings-tab-data` | 설정·데이터 / 사내 규칙 | 설정·데이터 | 조회 시/필요 시 | normal | hani-main.js · selectSettingsTab/showView | 공통/조건부 |
| `#settings-tab-policy` | 설정·데이터 / 사내 규칙 | 사내 규칙 | 최초/변경 시 | normal | hani-main.js · agentPolicyInit/renderAgentPolicyRegistry/agentPolicyAction | 공통/조건부 |
| `#settingsData` | 설정·데이터 / 사내 규칙 | Google Drive 백업 보관함폴더 권한 확인 PC의 Google Drive 안에 'HANI OS Vault' 폴더를 만들고 선택해 주세요. Google Drive 폴더에 저장하면 자동으로 Drive에 올라가요  | 조회 시/필요 시 | normal | index.html · 기존 카드/상태/summary | 설정·데이터 전체 |
| `#driveVaultChip` | Google Drive 백업 보관함 | 폴더 권한 확인 | 주간/복구 시 | data-protection | hani-drive-vault.js · paint/connect/backup | ① 백업·복원 |
| `#driveVaultConnect` | Google Drive 백업 보관함 | 백업 폴더 연결 | 주간/복구 시 | data-protection | hani-drive-vault.js · connect | ① 백업·복원 |
| `#driveVaultBackup` | Google Drive 백업 보관함 | 지금 백업 | 주간/복구 시 | data-protection | hani-drive-vault.js · backup(false) | ① 백업·복원 |
| `#driveVaultPhotos` | Google Drive 백업 보관함 | 사진 백업 | 주간/복구 시 | data-protection | hani-drive-vault.js · backup(false,true) | ① 백업·복원 |
| `#driveVaultPhotoStatus` | Google Drive 백업 보관함 | 사진 백업 대기 · 백업 0장 / 신규 0장 / 누락 미확인 | 주간/복구 시 | data-protection | hani-drive-vault.js · paint/connect/backup | ① 백업·복원 |
| `#driveVaultStatus` | Google Drive 백업 보관함 | 백업 폴더를 연결해 주세요. | 주간/복구 시 | data-protection | hani-drive-vault.js · paint/connect/backup | ① 백업·복원 |
| `#driveVaultReminder` | Google Drive 백업 보관함 | driveVaultReminder | 주간/복구 시 | data-protection | hani-drive-vault.js · paint/connect/backup | ① 백업·복원 |
| `#driveVaultLast` | Google Drive 백업 보관함 | 검증된 Vault 백업 기록 없음 | 주간/복구 시 | data-protection | hani-drive-vault.js · paint/connect/backup | ① 백업·복원 |
| `#mediaSeparationStats` | 표지·포스터 분리 미리보기 | 미리보기 계산 대기 | 조회 시/필요 시 | data-protection | hani-main.js · renderMediaPreview / HANI_MEDIA.dryRunReport | ③ 저장 공간·이미지 |
| `#mediaRunB` | 표지·포스터 분리 미리보기 | B단계 · 이중 보관 실행 | 예외/장애 시 | data-protection | hani-main.js · renderMediaPreview → mediaRunB | ③ 저장 공간·이미지 |
| `#mediaBResult` | 표지·포스터 분리 미리보기 | 소유 계정 로그인과 Cloud 온라인 동기화 확인 후 실행할 수 있습니다. | 조회 시/필요 시 | data-protection | hani-main.js · mediaBStatus | ③ 저장 공간·이미지 |
| `#mediaBDialog` | 표지·포스터 분리 미리보기 | 표지·포스터 이중 보관 원본 전체 안전 백업을 확인한 뒤 기기와 Cloud에 이미지를 보관합니다. 모든 검증이 끝나면 참조만 추가하며 기록의 원본 이미지는 그대로 유지합니다. 기존 참조가 다른 항목은 변경하지 않습니 | 조회 시/필요 시 | data-protection | hani-main.js · renderMediaPreview/mediaRunB/mediaRunC/mediaCConfirm | ③ 저장 공간·이미지 |
| `#mediaBTitle` | 표지·포스터 분리 미리보기 | 표지·포스터 이중 보관 | 조회 시/필요 시 | data-protection | hani-main.js · renderMediaPreview/mediaRunB/mediaRunC/mediaCConfirm | ③ 저장 공간·이미지 |
| `#mediaRunC` | 표지·포스터 분리 미리보기 | C단계 · 내장 이미지 분리 | 예외/장애 시 | destructive | hani-main.js · renderMediaCControls → mediaRunC(false) | ③ 저장 공간·이미지 |
| `#mediaRollbackC` | 표지·포스터 분리 미리보기 | 표지·포스터 다시 내장 | 예외/장애 시 | destructive | hani-main.js · renderMediaCControls → mediaRunC(true) | ③ 저장 공간·이미지 |
| `#mediaCResult` | 표지·포스터 분리 미리보기 | 버튼을 누르면 기기 이미지 사본과 Cloud 보관함을 확인해요. | 조회 시/필요 시 | data-protection | hani-main.js · mediaCStatus | ③ 저장 공간·이미지 |
| `#mediaCDialog` | 표지·포스터 분리 미리보기 | 표지·포스터 C단계 기록을 약 2.16MB에서 0.3MB로 줄입니다. 모든 기기와 열린 탭을 v2.9.201 이상으로 새로고침한 뒤 실행하세요. 전체 안전 백업과 이미지 보관을 확인하고, 일치하는 내장 이미지만 비웁 | 조회 시/필요 시 | data-protection | hani-main.js · renderMediaPreview/mediaRunB/mediaRunC/mediaCConfirm | ③ 저장 공간·이미지 |
| `#mediaCTitle` | 표지·포스터 분리 미리보기 | 표지·포스터 C단계 | 조회 시/필요 시 | data-protection | hani-main.js · renderMediaPreview/mediaRunB/mediaRunC/mediaCConfirm | ③ 저장 공간·이미지 |
| `#mediaCDescription` | 표지·포스터 분리 미리보기 | 기록을 약 2.16MB에서 0.3MB로 줄입니다. 모든 기기와 열린 탭을 v2.9.201 이상으로 새로고침한 뒤 실행하세요. 전체 안전 백업과 이미지 보관을 확인하고, 일치하는 내장 이미지만 비웁니다. 다른 기기는  | 조회 시/필요 시 | data-protection | hani-main.js · renderMediaPreview/mediaRunB/mediaRunC/mediaCConfirm | ③ 저장 공간·이미지 |
| `#mediaCDevices` | 표지·포스터 분리 미리보기 | mediaCDevices | 조회 시/필요 시 | data-protection | hani-main.js · renderMediaPreview/mediaRunB/mediaRunC/mediaCConfirm | ③ 저장 공간·이미지 |
| `#mediaCApprove` | 표지·포스터 분리 미리보기 | C단계 실행 | 조회 시/필요 시 | destructive | hani-main.js · renderMediaPreview/mediaRunB/mediaRunC/mediaCConfirm | ③ 저장 공간·이미지 |
| `#dataHubLibraryPanel` | 설정·데이터 / 사내 규칙 | Data Hub · 기록 보관함확정 월간 기록과 검증된 지표를 조회합니다. 조회와 내보내기는 원본을 저장하거나 변경하지 않습니다.OverviewMonthlyMetricsGoalsExport확정 월간 기록 0건 · 승 | 월·분기/필요 시 | normal | hani-main.js · renderDataHubLibrary | ⑥ 기록·목표 |
| `#dataHubLibraryContent` | Data Hub · 기록 보관함 | OverviewMonthlyMetricsGoalsExport확정 월간 기록 0건 · 승인된 목표 이력 0건월간 기록은 저장 당시의 확정값입니다. 현재 시장가격으로 과거 값을 바꾸지 않습니다. 지표는 원본 검증이 완료 | 월·분기/필요 시 | normal | hani-main.js · renderDataHubLibrary | ⑥ 기록·목표 |
| `#dataHubExportJson` | Data Hub · 기록 보관함 | JSON 다운로드 | 월·분기/필요 시 | normal | hani-main.js · renderDataHubLibrary / download JSON projection | ⑥ 기록·목표 |
| `#dataHubExportCsv` | Data Hub · 기록 보관함 | 월간 CSV 다운로드 | 월·분기/필요 시 | normal | hani-main.js · renderDataHubLibrary / download monthly CSV | ⑥ 기록·목표 |
| `#goalRegistryPanel` | 설정·데이터 / 사내 규칙 | 목표 관리분기·연간 목표를 적용일부터 기록합니다. 기존 목표 설정이나 과거 기록은 바꾸지 않습니다.지표투자자산 · KRW체중 · kg완독 · book일평균 걸음 · steps/day월 지출 예산 · KRW퀴즈 정답률 | 월·분기/필요 시 | normal | hani-main.js · renderGoalRegistry/renderQuarterKickoff/bindGoalRegistryPreview | ⑥ 기록·목표 |
| `#goalRegistryContent` | 목표 관리 | 분기·연간 목표를 적용일부터 기록합니다. 기존 목표 설정이나 과거 기록은 바꾸지 않습니다.지표투자자산 · KRW체중 · kg완독 · book일평균 걸음 · steps/day월 지출 예산 · KRW퀴즈 정답률 · %B | 월·분기/필요 시 | normal | hani-main.js · renderGoalRegistry/renderQuarterKickoff/bindGoalRegistryPreview | ⑥ 기록·목표 |
| `#goalRegistryForm` | 목표 관리 | 지표투자자산 · KRW체중 · kg완독 · book일평균 걸음 · steps/day월 지출 예산 · KRW퀴즈 정답률 · %BMI · kg/m²체지방률 · %시청 작품 수 · 편기간분기연간연도분기1분기2분기3분기4분 | 월·분기/필요 시 | normal | hani-main.js · renderGoalRegistry/renderQuarterKickoff/bindGoalRegistryPreview | ⑥ 기록·목표 |
| `#goalRegistryPreview` | 목표 관리 | goalRegistryPreview | 월·분기/필요 시 | normal | hani-main.js · renderGoalRegistry/renderQuarterKickoff/bindGoalRegistryPreview | ⑥ 기록·목표 |
| `#goalBudgetSuggestion` | 목표 관리 | 입력칸에만 반영합니다. 변경 Preview와 승인을 거쳐 저장합니다.제안값으로 입력 | 월·분기/필요 시 | normal | hani-main.js · renderGoalRegistry/renderQuarterKickoff/bindGoalRegistryPreview | ⑥ 기록·목표 |
| `#goalBudgetUseSuggestion` | 목표 관리 | 제안값으로 입력 | 월·분기/필요 시 | normal | hani-main.js · renderGoalBudgetSuggestion / 입력칸만 변경 | ⑥ 기록·목표 |
| `#goalRegistryCancel` | 목표 관리 | 취소 | 월·분기/필요 시 | normal | hani-main.js · bindGoalRegistryPreview / draft 취소 | ⑥ 기록·목표 |
| `#goalRegistryApprove` | 목표 관리 | 승인하고 저장 / 승인하고 삭제 | 월·분기/필요 시 | destructive | hani-main.js · bindGoalRegistryPreview / 기존 save | ⑥ 기록·목표 |
| `#goalProgressPanel` | 설정·데이터 / 사내 규칙 | 분야별 목표 · 기간 진행조회 기간분기연간조회 연도조회 분기1분기2분기3분기4분기원본 검증 대기 · 실적과 목표 비교를 표시하지 않습니다. 데이터 연동의 원본 검증을 먼저 확인해 주세요. | 월·분기/필요 시 | normal | hani-goal-progress.js · render | ⑥ 기록·목표 |
| `#goalProgressContent` | 분야별 목표 · 기간 진행 | 조회 기간분기연간조회 연도조회 분기1분기2분기3분기4분기원본 검증 대기 · 실적과 목표 비교를 표시하지 않습니다. 데이터 연동의 원본 검증을 먼저 확인해 주세요. | 월·분기/필요 시 | normal | hani-goal-progress.js · render | ⑥ 기록·목표 |
| `#goalProgressType` | 분야별 목표 · 기간 진행 | 분기연간 | 월·분기/필요 시 | normal | hani-goal-progress.js · render | ⑥ 기록·목표 |
| `#goalProgressYear` | 분야별 목표 · 기간 진행 | goalProgressYear | 월·분기/필요 시 | normal | hani-goal-progress.js · render | ⑥ 기록·목표 |
| `#goalProgressQuarter` | 분야별 목표 · 기간 진행 | 1분기2분기3분기4분기 | 월·분기/필요 시 | normal | hani-goal-progress.js · render | ⑥ 기록·목표 |
| `#marketSettingsStatus` | 데이터 연동 · Toss Market Data | 연결 안 됨 · 서버 연결 전입니다. | 조회 시/필요 시 | normal | hani-asset-market-view.js · status | ② Cloud 동기화 |
| `#storageStatePill` | 데이터 저장 상태 | LOCAL | 조회 시/필요 시 | data-protection | hani-main.js · renderStoragePanel/renderCloudTransferUsage | 상단 저장 상세 |
| `#storageStats` | 데이터 저장 상태 | 저장 위치현재 브라우저마지막 저장미확인마지막 백업미확인저장 데이터실행 시 확인 | 조회 시/필요 시 | data-protection | hani-main.js · renderStoragePanel/renderCloudTransferUsage | 상단 저장 상세 |
| `#storageMessage` | 데이터 저장 상태 | storageMessage | 조회 시/필요 시 | data-protection | hani-main.js · renderStoragePanel/renderCloudTransferUsage | 상단 저장 상세 |
| `#safetyArchivePanel` | 데이터 저장 상태 | 최근 안전 백업 · 원본 전체 3개백업 목록을 확인해 주세요.검증된 안전 사본이 있을 때의 조작 예시최신 · 원본 전체 내려받기이전 1 · 원본 전체 내려받기이전 2 · 원본 전체 내려받기보관된 안전 백업이 없습니다 | 조회 시/필요 시 | data-protection | hani-main.js · renderSafetyArchive | ① 백업·복원 |
| `#safetyArchiveStatus` | 데이터 저장 상태 | 백업 목록을 확인해 주세요. | 조회 시/필요 시 | data-protection | hani-main.js · renderSafetyArchive | ① 백업·복원 |
| `#safetyArchiveList` | 데이터 저장 상태 | 검증된 안전 사본이 있을 때의 조작 예시최신 · 원본 전체 내려받기이전 1 · 원본 전체 내려받기이전 2 · 원본 전체 내려받기보관된 안전 백업이 없습니다.백업 보관소를 읽지 못했습니다. 기존 Local과 이전 안전 | 조회 시/필요 시 | data-protection | hani-main.js · renderSafetyArchive | ① 백업·복원 |
| `#loadRecoveryPanel` | 설정·데이터 / 사내 규칙 | 기록 원본 보호 중읽기 오류로 기록을 표시하지 못했습니다. 빈 화면이 데이터 삭제를 뜻하지 않습니다. 원본은 유지하며 저장과 Cloud 반영을 중지했습니다.원본 파일 내려받기검증된 백업으로 복원 | 예외/장애 시 | data-protection | hani-main.js · renderStoragePanel/downloadRecoveryOriginal/importFile.onchange | 공통/조건부 |
| `#loadRecoveryCopyStatus` | 기록 원본 보호 중 | loadRecoveryCopyStatus | 예외/장애 시 | data-protection | hani-main.js · renderStoragePanel/downloadRecoveryOriginal/importFile.onchange | 공통/조건부 |
| `#loadRecoveryExport` | 기록 원본 보호 중 | 원본 파일 내려받기 | 예외/장애 시 | data-protection | hani-main.js · downloadRecoveryOriginal | 공통/조건부 |
| `#loadRecoveryImport` | 기록 원본 보호 중 | 검증된 백업으로 복원 | 예외/장애 시 | destructive | hani-main.js · importFile.onchange | 공통/조건부 |
| `#cloudBridgeCard` | 설정·데이터 / 사내 규칙 | HANI Cloud 내 HANI OS를 여러 기기에서 이어서 사용해요. CLOUD · 준비 중 HANI OS 계정 이메일과 비밀번호만 입력하면 Cloud 데이터가 자동으로 연결됩니다. 🔐 새 비밀번호 설정 복구 링 | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | 공통/조건부 |
| `#cloudStatePill` | HANI Cloud | CLOUD · 준비 중 | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudLoginTitle` | HANI Cloud | HANI OS 계정 | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudLoginHint` | HANI Cloud | 이메일과 비밀번호만 입력하면 Cloud 데이터가 자동으로 연결됩니다. | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudRecoveryPanel` | HANI Cloud | 🔐 새 비밀번호 설정 복구 링크가 확인되었어요. 아래에서 새 비밀번호를 정하면 됩니다. 새 비밀번호 새 비밀번호 확인 새 비밀번호 저장 취소하고 로그인 비밀번호 변경 후 현재 기기에서 자동 동기화를 다시 확인합니다 | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudNewPassword` | HANI Cloud | 8자 이상 입력 | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudNewPasswordConfirm` | HANI Cloud | 한 번 더 입력 | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudSaveNewPassword` | HANI Cloud | 새 비밀번호 저장 | 조회 시/필요 시 | data-protection | hani-main.js · cloudSaveNewPassword | ② Cloud 동기화 |
| `#cloudCancelRecovery` | HANI Cloud | 취소하고 로그인 | 예외/장애 시 | data-protection | hani-main.js · cloudCancelRecovery | ② Cloud 동기화 |
| `#cloudRecoveryHelp` | HANI Cloud | 비밀번호 변경 후 현재 기기에서 자동 동기화를 다시 확인합니다. | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudEmail` | HANI Cloud | HANI OS 계정 이메일 | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudPassword` | HANI Cloud | 비밀번호 입력 | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudLogin` | HANI Cloud | HANI OS 로그인 | 조회 시/필요 시 | data-protection | hani-main.js · cloudLogin | ② Cloud 동기화 |
| `#cloudSyncNow` | HANI Cloud | 지금 동기화 | 조회 시/필요 시 | data-protection | hani-main.js · cloudManualSync | ② Cloud 동기화 |
| `#cloudLogout` | HANI Cloud | 로그아웃 | 조회 시/필요 시 | data-protection | hani-main.js · cloudLogout | ② Cloud 동기화 |
| `#cloudStatusGrid` | HANI Cloud | 계정미확인이 기기 상태미확인자동 동기화미확인Cloud revision미확인Cloud updated미확인마지막 동기화미확인Local 데이터미확인Cloud 데이터미확인Sync engine미확인 | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudMessage` | HANI Cloud | Cloud 연결 상태를 확인하고 있습니다. | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudConflictAction` | HANI Cloud | 차이 확인 | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel → cloudCompare | ② Cloud 동기화 |
| `#cloudRestoreGuide` | HANI Cloud | cloudRestoreGuide | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudSyncPolicy` | HANI Cloud | Cloud 우선(권장) 충돌 시 수동 선택 | 최초/변경 시 | data-protection | hani-main.js · cloudChangeSyncPolicy | ② Cloud 동기화 |
| `#cloudChoicePanel` | HANI Cloud | 기록 확인 차이 확인하고 원본 선택 백업 파일로 가져오기 | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudChoiceTitle` | HANI Cloud | 기록 확인 | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudChoiceSummary` | HANI Cloud | cloudChoiceSummary | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudChoiceList` | HANI Cloud | cloudChoiceList | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudChoiceOpen` | HANI Cloud | 차이 확인하고 원본 선택 | 예외/장애 시 | data-protection | hani-main.js · cloudOpenChoice | ② Cloud 동기화 |
| `#cloudChoiceImport` | HANI Cloud | 백업 파일로 가져오기 | 예외/장애 시 | data-protection | hani-main.js · importBtn.click → importFile.onchange | ② Cloud 동기화 |
| `#cloudChoiceDialog` | HANI Cloud | 어느 기록으로 이어갈까요? 이 기기 내용으로 Cloud에 저장 Cloud 내용으로 이 기기에 적용 나중에 결정 | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudChoiceDialogTitle` | HANI Cloud | 어느 기록으로 이어갈까요? | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudChoiceDialogSummary` | HANI Cloud | cloudChoiceDialogSummary | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudChoiceDialogList` | HANI Cloud | cloudChoiceDialogList | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudChoiceStatus` | HANI Cloud | cloudChoiceStatus | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudChoiceLocal` | HANI Cloud | 이 기기 내용으로 Cloud에 저장 | 예외/장애 시 | destructive | hani-main.js · cloudChooseOriginal("local") | ② Cloud 동기화 |
| `#cloudChoiceCloud` | HANI Cloud | Cloud 내용으로 이 기기에 적용 | 예외/장애 시 | destructive | hani-main.js · cloudChooseOriginal("cloud") | ② Cloud 동기화 |
| `#cloudChoicePause` | HANI Cloud | 나중에 결정 | 예외/장애 시 | data-protection | hani-main.js · cloudChooseOriginal("pause") | ② Cloud 동기화 |
| `#cloudDifferencePanel` | HANI Cloud | 이 기기와 Cloud 차이 건수가 같아도 내용이 다를 수 있습니다. 양쪽에 필요한 기록이 있다면 먼저 각각 백업해 주세요. 고급 복구 도구의 원본 선택은 한쪽 전체를 적용하는 작업입니다. | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudDifferenceTitle` | HANI Cloud | 이 기기와 Cloud 차이 | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudDifferenceSummary` | HANI Cloud | cloudDifferenceSummary | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudDifferenceList` | HANI Cloud | cloudDifferenceList | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ② Cloud 동기화 |
| `#cloudCreateSafetyBackup` | HANI Cloud | 현재 원본 안전 백업 | 조회 시/필요 시 | data-protection | hani-main.js · cloudCreateManualSafetyBackup | ② Cloud 동기화 |
| `#cloudAdvanced` | HANI Cloud | 고급 설정 · 복구 도구 안전 원칙: 모든 입력은 먼저 이 기기의 localStorage에 저장·검증된 뒤 Cloud에 반영됩니다. 양쪽 기기에서 동시에 수정되면 자동으로 덮어쓰지 않고 충돌 상태에서 멈춥니다. 기준 | 조회 시/필요 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ④ 고급·복구 |
| `#cloudEmergencyPanel` | HANI Cloud | 🛡️ v2.9.18 Sync Core 진단확인 중 v2.9.12가 Cloud를 강제로 기준본으로 적용하기 직전에 저장한 브라우저 내부 안전 스냅샷을 확인합니다. 복구는 먼저 투자·자산 데이터만 Local에 병합하고 | 예외/장애 시 | data-protection | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud | ④ 고급·복구 |
| `#cloudEmergencyBadge` | HANI Cloud | 확인 중 | 예외/장애 시 | data-protection | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud | ④ 고급·복구 |
| `#cloudEmergencyCurrent` | HANI Cloud | - | 예외/장애 시 | data-protection | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud | ④ 고급·복구 |
| `#cloudEmergencySnapshot` | HANI Cloud | - | 예외/장애 시 | data-protection | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud | ④ 고급·복구 |
| `#cloudEmergencySavedAt` | HANI Cloud | - | 예외/장애 시 | data-protection | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud | ④ 고급·복구 |
| `#cloudEmergencyReason` | HANI Cloud | - | 예외/장애 시 | data-protection | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud | ④ 고급·복구 |
| `#cloudEmergencyRefresh` | HANI Cloud | 스냅샷 다시 확인 | 예외/장애 시 | data-protection | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud (legacy 버튼 binding 미발견; 연결된 동작으로 단정하지 않음) | ④ 고급·복구 |
| `#cloudEmergencyDownload` | HANI Cloud | 안전 스냅샷 JSON 저장 | 예외/장애 시 | data-protection | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud (legacy 버튼 binding 미발견; 연결된 동작으로 단정하지 않음) | ④ 고급·복구 |
| `#cloudEmergencyRestoreInvestment` | HANI Cloud | 투자·자산만 Local 복원 | 예외/장애 시 | destructive | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud (legacy 버튼 binding 미발견; 연결된 동작으로 단정하지 않음) | ④ 고급·복구 |
| `#cloudEmergencyUndo` | HANI Cloud | 복원 직전 Local로 되돌리기 | 예외/장애 시 | destructive | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud (legacy 버튼 binding 미발견; 연결된 동작으로 단정하지 않음) | ④ 고급·복구 |
| `#cloudEmergencyPromote` | HANI Cloud | 확인한 Local을 Cloud 기준으로 확정 | 예외/장애 시 | destructive | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud (legacy 버튼 binding 미발견; 연결된 동작으로 단정하지 않음) | ④ 고급·복구 |
| `#cloudEmergencyMessage` | HANI Cloud | 복구 전에는 자동 Cloud 쓰기를 보류합니다. 먼저 안전 스냅샷 존재 여부를 확인합니다. | 예외/장애 시 | data-protection | hani-main.js · renderEmergencyRecoveryPanel/cloudEmergencyDownloadSnapshot/cloudEmergencyRestoreInvestment/cloudEmergencyUndoLocal/cloudEmergencyPromoteLocalToCloud | ④ 고급·복구 |
| `#cloudProjectUrl` | HANI Cloud | https://xxxxx.supabase.co | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ④ 고급·복구 |
| `#cloudPublishableKey` | HANI Cloud | sb_publishable_... | 예외/장애 시 | data-protection | hani-main.js · renderCloudPanel/bindCloudBridgeControls/cloudChooseOriginal | ④ 고급·복구 |
| `#cloudSaveConfig` | HANI Cloud | 연결 설정 저장 | 예외/장애 시 | data-protection | hani-main.js · cloudApplyConfigFromForm | ④ 고급·복구 |
| `#cloudFirstCopy` | HANI Cloud | 이 기기 Local을 Cloud 기준으로 확정 | 예외/장애 시 | destructive | hani-main.js · cloudFirstCopy | ④ 고급·복구 |
| `#cloudRestore` | HANI Cloud | Cloud를 이 기기 기준으로 적용 | 예외/장애 시 | destructive | hani-main.js · cloudRestoreToLocal | ④ 고급·복구 |
| `#cloudCompare` | HANI Cloud | Local ↔ Cloud 비교 | 조회 시/필요 시 | data-protection | hani-main.js · cloudCompare | ④ 고급·복구 |
| `#cloudVerifySourceOwner` | HANI Cloud | 원본 소유권 확인 · 읽기 전용 | 조회 시/필요 시 | data-protection | hani-main.js · cloudVerifySourceOwner | ④ 고급·복구 |
| `#cloudOwnerVerificationResult` | HANI Cloud | Data Hub 검증 전용입니다. 원본 저장·복원·동기화·캐시 생성은 하지 않습니다. 기존 앱의 자동 동기화와는 별개입니다. | 조회 시/필요 시 | data-protection | hani-main.js · cloudVerifySourceOwner | ④ 고급·복구 |
| `#calendarUrl` | Google Calendar 설정 | https://calendar.google.com/calendar/embed?... 입력 | 최초/변경 시 | normal | hani-main.js:4515 · 기존 input/click | ⑤ 화면·연결 설정 |
| `#calendarClear` | Google Calendar 설정 | URL 지우기 | 최초/변경 시 | normal | hani-main.js:4515 · 기존 input/click | ⑤ 화면·연결 설정 |
| `#calendarSave` | Google Calendar 설정 | 설정 저장 | 최초/변경 시 | normal | hani-main.js:4515 · 기존 input/click | ⑤ 화면·연결 설정 |
| `#exportBtn` | JSON 백업 / 복원 | 백업 파일 만들기 | 주간/복구 시 | data-protection | hani-main.js:8132–8162 · exportData/importFile.onchange/resetBtn.onclick | ① 백업·복원 |
| `#importBtn` | JSON 백업 / 복원 | 백업 파일 불러오기 | 주간/복구 시 | destructive | hani-main.js:8132–8162 · exportData/importFile.onchange/resetBtn.onclick | ① 백업·복원 |
| `#importFile` | JSON 백업 / 복원 | importFile | 조회 시/필요 시 | destructive | hani-main.js:8132–8162 · exportData/importFile.onchange/resetBtn.onclick | ① 백업·복원 |
| `#resetBtn` | JSON 백업 / 복원 | 전체 초기화 | 예외/장애 시 | destructive | hani-main.js:8132–8162 · exportData/importFile.onchange/resetBtn.onclick | ④ 고급·복구 |
| `#policy` | 설정·데이터 / 사내 규칙 | HANI COMPANY POLICY📜 사내 규칙AI TEAM이 판단할 때 공통으로 참고하는 운영 원칙과 학습 규정을 한곳에서 관리합니다. ↻ 규정 새로고침POLICY REGISTRY 🌐 어디에 적용되나요?AI 결 | 최초/변경 시 | normal | hani-main.js · agentPolicyInit/renderAgentPolicyRegistry/agentPolicyAction | 공통/조건부 |
| `#agentRefreshPolicies` | 📜 사내 규칙 | ↻ 규정 새로고침 | 조회 시/필요 시 | normal | hani-main.js · agentPolicyInit → agentLoadPolicyRegistry | 사내 규칙 |
| `#agentPolicyRegistryState` | 📜 사내 규칙 | POLICY REGISTRY | 최초/변경 시 | normal | hani-main.js · agentPolicyInit/renderAgentPolicyRegistry/agentPolicyAction | 사내 규칙 |
| `#agentPolicyRegistry` | Policy Registry | Cloud 로그인 후 사내 규정을 불러옵니다.사내 규칙 · 조건부 조작 예시 (기존 탭 유지)✓ 고정 규정 승인반려학습 제외비활성화Adaptive Policy Engine v0.2 · 일반 학습 규정은 대표가 매번  | 최초/변경 시 | normal | hani-main.js · agentPolicyInit/renderAgentPolicyRegistry/agentPolicyAction | 사내 규칙 |
| `#launchGreetingEnabled` | 테마 스튜디오 (#aura), index.html:967 | ⑤의 기존 테마 스튜디오 링크로 접근, 토글 복제 안 함 | hani-launch-greeting.js, 테마 UI prefs 저장 경로 보존 |
| `#quickBackup` | 전역 상단 | 현재 위치 유지, 같은 exportData 경로 | exportData |
