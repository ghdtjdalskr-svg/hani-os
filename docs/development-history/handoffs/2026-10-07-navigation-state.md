# 화면 위치 복원 1차

- 대표님 우선순위 4 진행 지시. Codex / branch `hani/navigation-state-20261007`, base `c43ba2f1ce24c05e2cb16338e920fcf73731de0a`, v2.9.190 유지.
- 변경: `hani-main.js` canonical showView 및 unlock 경계, `scripts/hani-navigation-state-ui.test.mjs`, 이 문서. 별도 파일 key `hani_os_navigation_v1`에 version/view/y만 저장. protected `hani_os_life_v23` 및 기존 state/write/Cloud/auth 동작 변경 없음.
- 마지막 일반 화면·scroll 복원, 명시적 hash 우선, 저장 실패/malformed/허용하지 않은 화면 안전 fallback. 로그인 UI가 해제된 뒤 복원하며 새 credential login의 기존 home 이동 유지. 인포데스크·배포/권한/설정·금융 등 작업 화면은 저장 제외. 기존 URL auth callback 처리는 그대로 유지.
- 격리 Chrome 1440/390 PASS: 다시 열기, 실제 scroll, 명시적 hash, malformed/제외 view, storage failure, 생활 원본/state 불변, 임시 제목 미저장. JS syntax/diff PASS. 실제 Android·로그인 세션 및 브라우저 OS별 복원 미검증.
- UI subtab/선택/입력 draft 전체 persistence는 미완성. draft 대상 allowlist/보관 기간/계정 격리·명시적 폐기 정책 및 기존 write 승인 경계 검토 후 다음 작업. 이 1차를 전체 Mobile State Persistence 완료로 표시하지 않음.
- 서버 함께 배포 없음. 버전/cache 증가·운영PR/main merge/배포 없음. Claude 열차 통합 및 최종 QA/운영 read-back 필요.
