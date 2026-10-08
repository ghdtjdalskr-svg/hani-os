# HANI-30 Organization Hub — 배포 열차 탑승 인수인계

## 작업 식별
- 2026-10-08 KST / 담당 Codex / 배포 담당 Claude.
- 상태: 탑승 대기 요청. 본 문서 포함 commit push 및 Notion read-back 후 확정. 배포 가능 PASS 의미가 아님.
- branch: hani/organization-hub-preview-20261007
- base: c43ba2f1ce24c05e2cb16338e920fcf73731de0a
- 조회 origin/main: 691385cf11faa7906a0d27472d8e32884f2be1ea.
- 원격 main drift 있음. index.html/hani-main.js/조직도 JS·CSS는 base 대비 main 변경 없음. merge/rebase 하지 않음.
- 표시 버전 v2.9.190 및 마지막 기존 UI JS hani-goal-progress.js?v=2.9.190 유지.
- 승인 근거: 대표님 테크 스타일 선택 및 “배포 대기까지 진행해줘”. 운영 merge/deploy 직접 수행 승인으로 해석하지 않음.

## 변경 범위
- index.html: 기존 sidebar 내 Organization 메뉴, 정적 view, 전용 CSS/JS 연결.
- hani-main.js: 기존 canonical 내비게이션 pageMeta 조직도 항목.
- hani-organization-hub.js/css: 5팀/17명, 팀 탭/업무 배너, 성민 회장 실루엣, 뮤즈 전략기획실 비서, 팀 아이콘 필터, 팀장5명, 테크 기본 타이포. 스타일 비교 버튼은 현재 화면 한정이며 저장하지 않음.
- assets/profiles: 실제 참조 중인 신규 여성 AI 8개 PNG(서윤 v7, 나머지 v5).
- assets/team: hani-org-strategy/platform/finance/life/business/chair/demo-day-v1.png 7개.
- docs/organization-hub-preview.html, docs/organization-hub-design.md, 작업별 handoffs 및 CURRENT.
- scripts/check-organization-hub.mjs, scripts/hani-organization-preview-server.mjs, qa-evidence/organization-hub/results.json 및 대표 캡처.
- 이전 미적용 이미지 시안은 로컬 보존하되 이번 commit에서 제외.
- 서버 Edge Function/설정/배포 순서: 추가 없음. 정적 프런트엔드 변경만.

## 실행 검증
- node --check hani-organization-hub.js PASS.
- node scripts/check-organization-hub.mjs PASS: PC1440/모바일390·320, 팀 필터6개와 select 양방향·검색/그룹 교차 필터, 팀장5명, 팀 탭/키보드, 17이미지 decode, 상세창/초점 복귀, 가로 넘침 없음.
- git -c core.whitespace=cr-at-eol diff --check PASS.
- 격리 app canonical AI 팀 ↔ 조직도 전환 PASS. 보호 키 전환 전후 불변. 인증 우회 없음.
- UI 시각 근거: qa-evidence/organization-hub/desktop-first-screen.png, staff-nameplates.png, team-banner-desktop.png, team-banner-mobile.png.
- 이전 오프라인 HTML v4 검사 PASS. HTML은 repo runtime에 추가하지 않음.

## 배포 전 필수 경계 / 남은 위험
- 새 PNG 전체가 큰 용량. 팀 이미지 7개만 약15.8MB이며 신규 프로필 별도. 현재 원본을 기존 용량 계약에 맞는 운영 패키지로 간주하지 말 것.
- 배포 전 경량화·참조 경로 조정·최종 화질 Preview와 targeted 재검사가 필요. 파일수/총용량/단일파일 gate 확대 권한 없음. 제한 초과 시 배포 금지.
- 실제 로그인된 통합 앱 시각 QA, 독립 아린 리뷰, 최종 열차 package/preflight/서버 HINA는 미실행.
- 설치 글꼴 fallback으로 기기별 글꼴 차이 가능. 테크 기본값은 대표님 선택.
- 요청했지만 미반영: 팀 배너 배경색 팀별 차별화, M9 외 확장 AI가 참여하는 메인 현장 이미지. 현재 메인은 M9 시연 현장. 이 항목을 완료 처리하지 않음; 현재 시안 탑승 후 후속 디자인 또는 열차 포함 여부 확인.
- storage/localStorage/Cloud/schema/auth 변경 없음. 신규 보호 write 없음.
- main merge/Pages/표시버전/최신JS/기능 Production read-back 전부 미실행.

## 다음 담당
1. 본 문서와 branch diff 확인. 최신 main에 배포 담당이 통합하며 타 worktree 수정 금지.
2. 이미지 용량 조건 해결 및 미완료 디자인 범위 확인 후 실제 통합 Preview.
3. 열차에서 버전 1회 증가, 기존 전체 게이트·최종 승인·운영 read-back 수행.
- 운영 PR은 기능 담당이 만들지 않음.
