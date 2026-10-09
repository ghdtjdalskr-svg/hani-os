# HANI GROUP Organization Hub · Preview

## 후속 수정 · 여성 프로필 / 팀 탭
- 사용자 요청: 신규 전원 여성, 기존 M9와 같은 그림체(하니 얼굴 복제 금지), 글로벌 테크기업 톤, 팀별 탭, 실제 팀원만 비주얼에 포함. 기업솔루션 업무용 Claude 1명 추가.
- 17명으로 변경: M9 9명 + 신규 여성 8명. 신규 이름은 제안, 도연/Codex와 채원/업무용 Claude 포함.
- 5개 팀 탭/키보드 탐색 구현. 팀 장면 이미지는 제거하고 실제 구성원 프로필만 표시. 백색/블루 계열과 간결한 헤드라인으로 변경.
- 이미지 1/2차 시안 사용자 피드백으로 미적용. 지은·나은·수연 화풍 참조 미르 v3 시안 1장 생성. docs/organization-portrait-review.md에 프롬프트와 저장 위치.
- 나머지 여성 프로필은 미르 시안 방향 확인 후 진행. 아직 완성/배포/탑승 상태 아님.
- 수정 후 targeted QA PASS: 17명/9이미지/8placeholder, 5팀 탭 및 화살표/Home 키 전환, 업무용 Claude 포함, 팀 내 무관한 배너 없음, desktop/mobile 및 기존 회귀 검사.
- Preview 서버 로컬 8791 복구. 아래는 최초 Preview 기록.

## 작업 식별
- 날짜: 2026-10-07 KST / 담당: Codex
- 상태: Preview 디자인 승인 대기. 배포 열차 탑승/운영 PR/merge/deploy 하지 않음.
- branch: hani/organization-hub-preview-20261007
- base: c43ba2f1ce24c05e2cb16338e920fcf73731de0a (시작 시 origin/main 확인)
- 표시 버전: v2.9.190 유지. 기존 마지막 UI JS: hani-goal-progress.js?v=2.9.190
- worktree: .worktrees/organization-hub-preview-20261007
- 승인: 첨부 Organization Hub 구현 요청 및 그래픽 중심의 디자인 회사 조직도 요청.
- 범위: index.html 정적 메뉴/뷰, hani-main.js pageMeta, 전용 읽기 UI CSS/JS, Preview/targeted test/문서.
- owner: 기존 showView + data-view 내비게이션. 새 라우터/renderer wrapper 없음.
- CODEMAP_MISS: 조직도 기능 미등록, 관련 router/DOM만 좁게 탐색.

## 결과와 증거
- 다섯 팀 병렬 조직도 → 팀 장면 → 인물 갤러리 섹션형 IA.
- M9 기존 이미지 재사용. 미르와 신규 AI 6명은 임시 이름/배치안과 이니셜, 확정 바이블 대기.
- storage/cloud/auth/schema/write 변경 없음.
- 변경: index.html, hani-main.js(pageMeta 1항목), hani-organization-hub.js/.css, docs/organization-hub-preview.html, docs/organization-hub-design.md, Preview server/targeted test scripts, 작업별 기록.
- 검사: node --check hani-organization-hub.js, node --check hani-main.js, git -c core.whitespace=cr-at-eol diff --check PASS.
- targeted: node scripts/check-organization-hub.mjs PASS. 1440/390/320폭, 5팀, M9 9+AI7, 이미지, 검색/팀/그룹필터, empty/reset, 모달 5팀+인물, Escape/focus, 가로 넘침 검사.
- 통합: 격리 브라우저에서 index canonical navigation AI 팀 ↔ 조직도와 보호 키 전환 전후 동일 확인. 로그인 게이트 우회하지 않음.
- 실제 로그인 앱의 시각 QA와 독립 아린 Review 미실행. 로컬 디자인 화면은 직접 캡처 확인. Full candidate/preflight/HINA는 Preview 개발 범위 밖.
- 증거: qa-evidence/organization-hub/results.json, desktop.png, desktop-first-screen.png, mobile.png, mobile-first-screen.png, mobile-dialog.png (로컬 생성).
- Preview: http://127.0.0.1:8791/docs/organization-hub-preview.html / 앱: http://127.0.0.1:8791/index.html#organization
- main/Pages/Production: 수행 금지, 미실행. 버전/캐시 태그/HANI_DISPLAY_VERSION 변경 없음.
- 함께 배포할 서버 기능/설정 없음. 현재 운영 배포 후보 아님.
- Notion HANI-30: https://app.notion.com/p/3f1c5275707481f396c8c5dc3d717d44 (계획 및 최종 QA 저장/read-back 확인, 승인 대기).

## 다음 담당에게
- 먼저 읽기: hani-organization-hub.js / hani-organization-hub.css / 본 문서.
- 다음 행동: 대표님 그래픽 디자인 확인, 신규 인물 바이블/배치 확정.
- 미승인 경계: 바이블 확정, 신규 이미지 생성, 서버 변경, 배포.
- 이전 보고서/대시보드 작업 및 다른 worktree는 수정하지 않음.
