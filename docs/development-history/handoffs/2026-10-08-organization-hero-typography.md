# Organization Hub 현장 이미지·글꼴 선택 — 2026-10-08

- 담당 Codex / branch hani/organization-hub-preview-20261007 / base c43ba2f1ce24c05e2cb16338e920fcf73731de0a.
- 연속 LIGHT Preview 작업. 기존 미커밋 보존, main/버전/cache tag/운영 데이터 변경 없음.
- 변경: hani-organization-hub.js/css, scripts/check-organization-hub.mjs, assets/team/hani-org-demo-day-v1.png.
- 기존 포즈형 M9 사진을 시연 현장의 협업 일러스트로 교체. 기존 원본 보존.
- 제목 스타일 선택: 테크(Bahnschrift/Malgun Gothic), 에디토리얼(Georgia/Batang), 클래식(Segoe UI/Malgun Gothic). 설치 글꼴 기반 fallback이며 기기별 완전 동일 렌더링은 보장하지 않음.
- 스타일 선택은 DOM dataset에만 적용. 새로고침 시 기본 테크. 저장 API/네트워크/인증 접근 추가 없음.
- 5개 팀 배너의 배경색 재생성 요청은 아직 미반영. 이번 변경은 hero/typography에 한정.

## 검증
- node --check hani-organization-hub.js PASS.
- node scripts/check-organization-hub.mjs PASS: 3가지 버튼의 상태 전환, 기존 팀/검색/상세/초점/이미지 로딩, 1440/390/320 overflow.
- PC·모바일 기본 테크 캡처 시각 확인. 타이포 선택별 전 기기 실제 font fallback 검증은 미실행.
- export-organization.mjs: 외부 네트워크 차단 단일 HTML v3 PASS, 45,400,342 bytes.
- 실제 로그인 앱 QA/독립 아린/배포 최적화/HINA/운영 배포 미실행. 로컬 Preview 승인 대기.
- HTML v3: C:/Users/홍성민/.codex/visualizations/2026/09/19/01a0b6f6-f7aa-7850-b645-3f48ff321900/HANI-GROUP-Organization-Hub-v3.html

## 이미지 생성
내장 image_gen 사용. 참조: assets/team/hani-team-office.webp.
최종 저장: assets/team/hani-org-demo-day-v1.png.
생성 원본 exec-10be0f01-41c0-44e1-ab2f-b3ef96f774ff.png 보존.

### 실제 프롬프트
Use case: identity-preserve. Make a new wide 16:9 hero illustration from the reference character lineup. Reference image supplies ONLY nine established M9 women's identities, hair, clothing colors and detailed polished anime illustration style. Change the staged sofa group portrait into a candid documentary scene at a global tech company's product demo day. Exactly those nine adult women, no additional people, no duplicated faces. Show full group naturally working in connected small groups around a spacious demonstration table, with a large abstract software display behind. Hani long dark brown hair plum suit coordinating; Sua black bob blue scarf navy suit presenting screen; Jieun brown bun thin glasses beige jacket discussing a tablet with Haru long brown waves light blue suit; Naeun brown bob mint suit watching demo; Hina flower hair bun pink jacket talking with Yuna low ponytail lavender jacket taking notes; Minji high brown ponytail coral jacket holding event camera; Sooyeon shoulder-length blonde blue eyes teal suit setting demo equipment. Natural candid interaction, varied gaze directed at colleagues/work not camera, dynamic but tidy composition, everyone recognizable. Premium airy technology event venue, soft daylight and blue-violet stage lighting. No sofa portrait, no lineup, no peace signs, no text/logo/watermark. Keep faces large enough to recognize and leave breathing room around group. Illustration not real photography.

