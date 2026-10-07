# 작은 프로필 사진(썸네일) 도입

- 날짜: 2026-10-08 KST
- 담당: 서윤(Claude Code)
- branch: `hani/seoyun-profile-thumbs`
- base: origin/main 691385c
- 위험 등급: LIGHT (이미지·화면 표시만 바뀌고, 데이터·Cloud 영향 없음)

## 배경

대표님 보고에 따르면 작은 프로필 사진이 깨져 보인다. 프로필 원본은 720×720 한 장인데 화면에서는 30~150px로 줄여 쓴다. 최대 20배를 브라우저가 축소하는 셈이라, 환경에 따라 테두리가 계단처럼 보인다.

## 이번 PR (런타임 미참조 선반영)

- `scripts/hani-make-profile-thumbs.mjs`
  - Lanczos3로 리사이즈하고 약하게 sharpen한 뒤 WebP q90으로 저장한다.
  - 128px와 256px 두 종류를 만든다.
  - sharp 경로는 `HANI_SHARP_PATH` 환경변수를 쓴다. 없으면 Codex runtime의 node_modules를 쓴다.
  - 실행: `node scripts/hani-make-profile-thumbs.mjs [원본폴더] [출력폴더]`
- `assets/profiles/thumb/hani-profile-<key>-{128,256}.webp`
  - 기존 9명분 18장이다.
  - 장당 4.6~17KB다. 원본은 47~74KB다.
- 아직 index.html과 JS에서 참조하지 않는다. 열차 규칙에 따라 새 파일을 먼저 반영해 두는 단계다.

## 다음 단계 (열차 8호 탑승 예정)

- 작은 아바타가 썸네일을 쓰게 바꾼다. 대상: 사이드바 얼굴, AI 배너 아바타, 홈 대화 아바타, 팀 카드, 디자인시스템 화자 사진.
- 로그인 큰 사진과 프로필 패널처럼 큰 화면은 원본을 유지한다.
- Codex 「누락된 QA 수행하기」 탭의 신규 캐릭터(서윤·도연·세린·유리·아린·채원·MIR·뮤즈) 조직도는 그 탭 작업이 끝난 뒤 같은 도구로 처리한다. 대표님이 2026-10-08에 허락했다.

## 검증

- 18장 생성을 확인했다.
- Edge에서 DPR 1로 38/48/64px 비교 렌더를 했다. 썸네일의 눈과 머리선이 더 또렷하다. 서윤 PC 환경에서는 원본 축소도 심하게 깨지지는 않았다. 대표님 PC에서 보이는 계단 현상은 열차 Preview에서 재확인해야 한다.
