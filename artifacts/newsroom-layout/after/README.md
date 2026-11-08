# 실제 Edge 화면 검증 대기

2026-11-08, 이 작업 환경에서 Playwright의 Edge 시작이 `spawn EPERM`으로 실패했습니다. Windows 직접 실행도 자동 승인 검토에서 정책 차단됐습니다. 실제 after 스크린샷과 before/after 비교 이미지는 생성하지 못했습니다. 화면·다크 가독성·모바일 interaction은 PASS가 아닙니다.

재실행 명령: `node artifacts/newsroom-layout/verify-edge.mjs`

- 실제 앱 index/JS/CSS와 카탈로그·원본 그림을 로컬 HTTP로 제공
- 앱 데이터는 빈 격리 컨텍스트, F/U 뉴스는 합성 fixture 사용
- 로그인 우회는 해당 브라우저 컨텍스트에서만 적용
- 모든 외부 HTTP 요청은 intercept로 차단
- PC1280/폰390 × 밝음/다크 × 최신2호/지난1호: 총 8장
- 비교용 별도 1장: 제공 before와 같은 1호·관심 탭·빈 F/U·전역 UI 포함 구도
- 표의 정확한 값·빈 종가, 제목 중복 제거, 안내 중복 제거, archive/current/latest 전환, 모달, F/U 5채널, 카드 폭·모서리·16px 간격, 가로 넘침·저장0 검증

위 명령 성공 후 `node artifacts/newsroom-layout/compare.mjs`로 동일 PC 화면의 전후 비교를 생성합니다.
