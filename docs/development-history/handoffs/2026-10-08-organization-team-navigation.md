# 팀별 탐색과 팀장 표시 — 2026-10-08

- 담당 Codex / hani/organization-hub-preview-20261007 / base c43ba2f1ce24c05e2cb16338e920fcf73731de0a.
- 연속 Preview 수정. 로컬 미커밋, 버전/cache tag/main/배포 변경 없음.
- 변경 파일: hani-organization-hub.js/css, scripts/check-organization-hub.mjs.
- People 왼쪽에 팀 아이콘+팀명+전체 소속 인원수 필터 추가. 기존 select/search/group과 같은 filterPeople 경로 사용. 모바일은 2열 상단 배치.
- 팀별 박스 색상·상단선·모서리 형태 차별화. 동일한 위계와 읽기 순서는 유지.
- 팀장 배치안: 전략 하니, 개발 서윤, 재무 지은, 라이프 나은, 기업 수아. 직급 변경 없이 역할 배지 추가. 조직도·팀 탭·프로필 카드에 표시.
- node --check 및 scripts/check-organization-hub.mjs PASS. 6개 팀 필터 인원수/기존 선택기 양방향 연동/교차필터/팀장5명/PC1440·모바일390·320 overflow/기존 상세창 확인.
- People PC 캡처 시각 확인. 로그인 앱 시각 QA/독립 아린/Release HINA 미실행.
- 단일 HTML v4 오프라인 이미지·팀탭·필터·상세창 PASS, 45,404,902 bytes. 이전 HTML 보존.
- 보호 데이터/저장/Cloud/인증 경로 변경 없음.
- 남은 디자인: 팀별 배너 배경색, M9 외 확장 AI도 참여하는 메인 현장 이미지. 배포용 이미지 최적화와 최종 승인 별도.
