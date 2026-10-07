# 화면 위치 복원 1차

- 대표님 우선순위 4 진행 지시. Codex / branch `hani/navigation-state-20261007`, base `c43ba2f1ce24c05e2cb16338e920fcf73731de0a`, v2.9.190 유지.
- 변경: `hani-main.js` canonical showView 및 unlock 경계, `scripts/hani-navigation-state-ui.test.mjs`, 이 문서. 별도 파일 key `hani_os_navigation_v1`에 version/view/y만 저장. protected `hani_os_life_v23` 및 기존 state/write/Cloud/auth 동작 변경 없음.
- 마지막 일반 화면·scroll 복원, 명시적 hash 우선, 저장 실패/malformed/허용하지 않은 화면 안전 fallback. 로그인 UI가 해제된 뒤 복원하며 새 credential login의 기존 home 이동 유지. 인포데스크·배포/권한/설정·금융 등 작업 화면은 저장 제외. 기존 URL auth callback 처리는 그대로 유지.
- 격리 Chrome 1440/390 PASS: 다시 열기, 실제 scroll, 명시적 hash, malformed/제외 view, storage failure, 생활 원본/state 불변, 임시 제목 미저장. JS syntax/diff PASS. 실제 Android·로그인 세션 및 브라우저 OS별 복원 미검증.
- 10/07 후속: 보고서 월간·분기·연간 board를 같은 UI key의 선택적 board 필드로 복원. 기존 version=1/view/y 기록과 호환. 허용한 세 값만 읽고 다른 임의 필드는 무시. canonical board onclick만 사용하며 새 이벤트 layer 없음. PC1440/모바일390 실제 annual/quarterly 재열기 및 잘못된 board fallback, 보호 원본 불변 PASS. 로그인 게이트 뒤 복원. HANI-31의 monthlyReportBuildCurrent 변경과 별개 함수지만 HANI-7 이식 시 board handler를 보존할 것.
- UI subtab/선택/입력 draft 전체 persistence는 미완성. 안전한 좁은 입력 초안은 자산 업데이트실 v1 개발 탭에서 별도 후속 조사/개발. 이 1차를 전체 Mobile State Persistence 완료로 표시하지 않음.
- 서버 함께 배포 없음. 버전/cache 증가·운영PR/main merge/배포 없음. Claude 열차 통합 및 최종 QA/운영 read-back 필요.
