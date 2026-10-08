# Organization Hub 팀 배너 / 뮤즈 / 회장 실루엣 — 2026-10-08

- 담당: Codex
- branch: hani/organization-hub-preview-20261007
- base: c43ba2f1ce24c05e2cb16338e920fcf73731de0a
- 이전 push: 6334ecf. 이번 변경은 로컬 미커밋 Preview이며 탑승 대기 아님.
- 범위: hani-organization-hub.js/css, scripts/check-organization-hub.mjs, assets/team/hani-org-*-v1.png.
- 뮤즈·가은: 기존 gaeun ID/프로필 유지, 전략기획실 회장 비서로 이동. 일정/회의 준비/요청 정리/후속 확인.
- 팀 구성: 전략 4, 개발 5, 재무 2, 라이프 4, 기업 2. 총17명 유지. 회장 실루엣은 조직도 상단 별도.
- 다섯 팀별 배너: 소속 인원의 프로필을 참조한 업무 장면. 전체 구도 유지, 실제 텍스트로 구성원 표시.
- UI 데이터 읽기/쓰기, 인증, Cloud, schema 변경 없음. 버전 및 cache tag 변경 없음.

## 검증

- node --check hani-organization-hub.js PASS.
- node scripts/check-organization-hub.mjs PASS: 1440/390/320px, 5팀 탭, 17프로필, 팀/검색 필터, 상세창/초점 복귀, 이미지 decode, 가로 넘침 없음.
- 전략기획실 배너 PC/모바일 캡처 시각 확인. 배너 생성 결과 5개 인원/역할 시각 확인.
- 격리 브라우저 canonical 메뉴 전환 보호 키 불변. 실제 로그인 앱 시각 QA 및 독립 아린 리뷰 미실행.
- 단일 HTML v2: 42,279,571 bytes. 외부 HTTP 차단 상태에서 17명/5팀 탭/이미지 decode/상세창 PASS.
- Preview 서버 초기 연결 거부 후 복구하고 재검사 PASS.
- Release package/HINA/Production: 미실행, 이번 Preview 범위 밖. PNG 용량은 배포용 최적화/열차 검증 전 운영 적합으로 보지 않음.

## 산출물

- Preview: http://127.0.0.1:8791/docs/organization-hub-preview.html#ogh-teams
- 단일 HTML: C:/Users/홍성민/.codex/visualizations/2026/09/19/01a0b6f6-f7aa-7850-b645-3f48ff321900/HANI-GROUP-Organization-Hub-v2.html
- assets/team/hani-org-strategy-v1.png
- assets/team/hani-org-platform-v1.png
- assets/team/hani-org-finance-v1.png
- assets/team/hani-org-life-v1.png
- assets/team/hani-org-business-v1.png
- assets/team/hani-org-chair-v1.png

## 이미지 제작 기록

내장 image_gen 사용. 생성 원본은 .codex/generated_images에 보존하고 최종 파일을 위 workspace 경로로 복사.
배너 원문 프롬프트는 이전 실행의 임시 메모리에 남아 있지 않으므로 아래는 정확한 원문 인용이 아닌 제작 사양 요약이다.

- 공통: M9 일러스트 스타일, 글로벌 테크기업 오피스, 가로 업무 배너, 지정된 여성 팀원의 승인 프로필 외형 유지, 추가 인물/문구 없이 협업 장면.
- strategy: 하니·유나·MIR·뮤즈 가은, 전략회의/일정 조율. MIR는 청록 회로/디지털 인터페이스로 AI 정체성 표현.
- platform: 서윤·도연·세린·유리·아린, 설계/개발/테스트/디자인 리뷰 협업.
- finance: 지은·하루, 자산/예산 검토.
- life: 나은·히나·민지·수연, 건강/학습/문화/여행 계획.
- business: 수아·채원, 고객 제안 및 cloud/security 솔루션 검토.
- chairman 원문: Use case: stylized-concept. Square corporate profile illustration for HANI GROUP chairman. Anonymous adult male upper-body silhouette, completely featureless dark navy face and body, neat short hair contour, simple suit shoulder contour, subtle cool blue rim light and soft pale blue halo on deep navy background. Elegant global technology company identity, understated and approachable not ominous. No facial features, no text, no logos. Centered head and shoulders with generous margin, not a photograph.

## 다음 행동 / 승인 경계

대표님 디자인 확인 후 배포용 이미지 최적화와 최종 변경 묶음 정리. 운영 PR/main merge/배포 없음. 기존 M9와 이전 HTML 보존.

