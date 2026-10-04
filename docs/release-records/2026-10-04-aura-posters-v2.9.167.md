# HANI AURA 포스터 복원 및 탭별 캠페인 — v2.9.167

## 승인 및 범위

성민 대표님이 2026-10-04 배포 및 완료 후 `누락된 QA 수행하기` 대화에 후속 배포 요청 전달을 승인함. 별도 반복 승인 없이 기존 필수 Gate를 유지한다.

- 색상 선택: 승인 원본 실내 5인 이미지 / “함께 만드는 일상, 나만의 색으로.” 복원.
- 계절 선택: 새 사계절 컬렉션 이미지 / “우리의 일상, 계절을 입다.”.
- HANI AURA 브랜드는 각 포스터 내부에 배치. 최대 너비 500px, 원본 비율 유지.
- 색상 5종·계절 4종 선택 카드는 기존 저장/이벤트로 유지. 활성 탭 CSS만으로 서로 다른 대표 포스터 표시.
- 메뉴는 성민 오피스 하위 AURA, 업무/시스템 하위 배포센터 유지.

## 기준선 및 변경 파일

최종 작업 트리: `.worktrees/aura-posters-release-v167-final`, branch `hani/release-aura-posters-v29167-final`.
최신 main `f34ea0e` / v2.9.166 + 승인된 Gate 2.0.3에서 시작. 이전 개발 작업 트리를 merge/rebase하거나 전체 index/main 파일로 덮어쓰지 않음. 승인된 AURA 부분만 국소 패치.

기존 후보는 88개 파일 / 15,175,483 bytes로 Gate 2.0.2 제한에 걸려 배포하지 않았다. 대표님 명시 승인 후 별도 PR #163으로 Gate Contract 2.0.3 (88 files / 15,200,000 bytes)만 반영. 단일 파일·보호 데이터·인증·승인/무결성 검증 유지. server source read-back 동일, 무인증 401 확인. 최종 후보는 새 Gate와 기준선으로 다시 검증한다.

- hani-design-system.css: AURA 캠페인과 선택 카드 배치.
- index.html: 대표 포스터 2종, 표시 버전 / main JS·변경 CSS 캐시 버전.
- hani-main.js: HANI_DISPLAY_VERSION만 2.9.167 증가. 보호 내부 데이터 버전 유지.
- assets/seasonal-collection/aura-season-campaign-v1.webp: 새 이미지, 1536×1024 / 446300 bytes.
- 이 문서: 변경 및 검증 기록.

## 개발 검증

최신 운영 코드 위 1920 / 1440 / 390px × 색상 5종 × 두 탭 = 30 전환 조합 PASS, 추가 계절 선택 12건 PASS. 이미지 로딩, 항상 포스터 1개만 표시, 탭별 다른 자산, 새로고침 선택 유지, 가로 넘침 없음. 격리 브라우저 pageerror 0. 보호 localStorage 변경 없음. git diff --check PASS.

Cloud write/schema/auth/release tooling 변경 없음. 기존 데이터·기능 owner는 유지. 최종 후보 One-Pass / 서버 HINA / CI / Pages / Production read-back 증거는 `.audit/`의 동일 후보 증거로 관리하고 완료 후 원장에 추가한다. 개발 QA를 Production PASS로 간주하지 않는다.

## 이미지 제작

Built-in image_gen 사용, 기존 캐릭터 이미지 참조로 별도의 사계절 정원 캠페인 제작. 생성 원본을 WebP로 압축만 수행. 카피·HANI AURA는 HTML로 포스터 안에 배치. 상세 생성 프롬프트는 개발 작업 트리의 `2026-10-04-aura-distinct-tab-posters.md`에 기록됨.
