# HANI GROUP Organization Hub · 1차 디자인 Preview

## 방향 / 구현
섹션형 IA: Overview → Organization → Teams → People. 디자인 스튜디오 소개서처럼 종이색 바탕, 차분한 팀 컬러, 큰 이미지, 불규칙한 사진 프레임, 여백을 사용한다. 모바일은 수평 계층도를 하나의 세로 연결선과 동등한 팀 노드로 전환한다. 개인 실적이나 운영 데이터를 조회하지 않는다.

- `index.html`: 기존 AI 팀을 보존하고 별도 HANI GROUP 메뉴/정적 view 추가.
- `hani-main.js`: 기존 `pageMeta`에 organization 한 항목. showView/event 소유권 유지.
- `hani-organization-hub.js`: 정적 조직/인물 데이터, 1회 mount, 전용 루트 내 이벤트 위임, filter, native dialog.
- `hani-organization-hub.css`: 루트에 제한한 디자인. container query로 좁은 앱 패널에도 대응.
- `docs/organization-hub-preview.html`: 동일 UI 모듈의 디자인 전용 미리보기. 로그인/운영 데이터와 무관.
- `scripts/hani-organization-preview-server.mjs`: loopback 8791만 사용하는 읽기 정적 서버.
- `scripts/check-organization-hub.mjs`: desktop/mobile/route targeted 자동 검사.

## 인원 배치
| 팀 | 인원 | 연결 |
|---|---|---|
| 전략기획실 | 하니 전무, 유나 사원, 미르 스페셜리스트(제안) | 전 조직 조율; 미르 독립 지원 연계 |
| AI플랫폼개발실 | 서윤(Claude 리드), 도현(Codex 선임), 세린(Gemini 연구원), 유리(QA 책임), 아린(UI/UX 선임), 가은(Muse 스페셜리스트) — 확장 배치안 | 히나와 학습 QA/사용자 관점 검수 |
| 재무자산관리실 | 지은 부장, 하루 대리 | 생활 예산·구매 검토 |
| 라이프&엔터테인먼트 | 나은 차장, 히나 과장, 민지 대리, 수연 주임 | 건강·학습·콘텐츠·여행/스포츠 |
| 기업솔루션사업부 | 수아 과장 | 전략실과 우선순위, 개발실과 기술 검토 |

M9 직급·소속은 사용자 지시 기준. 별도 캐릭터 바이블이 도착하지 않아 신규 인물/자세한 성향은 확정하지 않았다. 기존 AI 팀의 제미나이 프로필이나 실행 에이전트를 새 인물로 교체/연결하지 않았다. 이 화면은 소개 기획안이지 실시간 에이전트 상태·인사 시스템이 아니다.

## 이미지
- M9: 기존 `assets/profiles/hani-profile-*.webp` 9개 사용. naeun/sooyeon 파일명 준수.
- Hero: `assets/team/hani-team-office.webp`.
- 팀 장면: 기존 banner-preview-v1의 boardroom/development/investment/travel/tasks 이미지. 장면 안 인물은 실제 소속 명단이 아님을 팀 상세에 명시.
- 신규 7명: 미르, 서윤, 도현, 세린, 유리, 아린, 가은. 인물 이미지 없음 → 이니셜/팀색/프로필 준비 중 표시. 실제 프로필로 오해되지 않도록 AI·제안 배지.
- 새 이미지 생성/기존 이미지 변형은 수행하지 않음.

## 향후 이미지 가이드 (미생성·미확정)
공통: 기존 M9에 맞는 깔끔한 세미 리얼 캐릭터 일러스트, 4:5 상반신, 정면에 가까운 자연스러운 포즈, 부드러운 오피스 조명, 단색 배경, 문자/로고 없음. 기존 M9를 신규 인물의 얼굴로 재사용하지 않는다.

| 인물 | 제안 방향 | 후속 생성 프롬프트 보충 |
|---|---|---|
| 미르 | 신규 여성, 차분한 탐색자 | 긴 다크 애쉬 헤어, 절제된 미소, 잉크블루 재킷, 은회색 배경 |
| 서윤 | 설계 리드, 안정적인 인상 | 정돈된 중단발, 네이비 재킷, 슬레이트 배경 |
| 도현 | 실무 개발자 | 깔끔한 짧은 머리, 차콜 재킷, 침착한 눈빛, 밝은 회색 배경 |
| 세린 | 분석/연구 담당 | 단정한 포니테일, 블루그레이 의상, 열린 표정 |
| 유리 | QA 책임 | 단정한 보브, 명료한 시선, 쿨그레이 재킷 |
| 아린 | UI/UX 담당 | 자연스러운 중단발, 크림 재킷, 세이지 포인트 |
| 가은 | 비주얼 담당 | 부드러운 웨이브, 뮤트 라일락 의상, 편안한 미소 |

외형과 신규 이름·직급은 바이블 확인 및 대표님 선택 이후 확정한다.

## 검증과 한계
- Desktop 1440, mobile 390 및 narrow 320: 5팀 연결, 16명/M9 9/AI 7, 검색·교차필터·검색 없음·초기화, 팀/인물 상세, Escape/focus return, 이미지 로딩, 가로 넘침 없음 확인.
- 실제 index의 canonical navigation: AI 팀 ↔ 조직도 전환 및 DOM 중복 없음, 전환 전후 보호 키 동일 확인 (격리 브라우저).
- 인증 게이트 우회/토큰 복제 없이 검사. 실제 로그인한 앱에서의 최종 시각 QA 및 독립 아린 리뷰는 미실행.
- 결과/캡처는 로컬 `qa-evidence/organization-hub/`. 새 모듈은 storage/network/auth 의존성 없음.
- 버전 v2.9.190 유지. 최종 release candidate / One-Pass / HINA / main / Pages / 운영 read-back은 이 요청 범위 밖.

## Preview
- 디자인 전용: http://127.0.0.1:8791/docs/organization-hub-preview.html
- 앱 통합: http://127.0.0.1:8791/index.html#organization (기존 로그인 필요)
- 서버: `node scripts/hani-organization-preview-server.mjs 8791`
- 테스트: `node scripts/check-organization-hub.mjs` (HANI_PLAYWRIGHT_MODULE/HANI_CHROME 경로 override 가능)
- 다음: 대표님 디자인 확인 → 바이블/신규 인물 확정 → 필요한 수정. 현재는 배포 열차 탑승이 아니라 Preview 승인 대기.
