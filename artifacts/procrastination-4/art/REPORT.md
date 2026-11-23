# 미룬 일 4차 · 다섯 명 치비 시트

2026-11-24 · 도연(Codex) · 그림 제작·검수 완료, 서윤 UI 연결 대기.

- 파일: `assets/procrastination/pb-chibi-sheet-v2.webp` — **1536×1280px / 6열×5행 / 칸 256×256px**, 무손실 WebP RGBA, **1,253,332바이트(1.25MB)**.
- 행: **하니 → 가은 → 수연 → 윤슬 → 이음**. 서 있는 포즈의 외곽은 기존과 같은 칸 내 y=28~244(높이216px), 가로 중앙 정렬. 쪼그린 포즈는 같은 인물 스케일로 오른쪽·아래 끝244px에 배치.
- 비교: [compare.png](compare.png) — 1536×1792px, 기존 위 두 행 아래에 새 다섯 행을 **1:1 배율**로 배치. 비교용 배경만 크림색이며 납품 WebP는 투명.

## 칸별 포즈

| 행 | 0 신나게 응원 | 1 멈추고 쳐다봄 | 2 볼 부풀림 | 3 팔짱·등 돌림 | 4 구석에 쪼그림 | 5 기록 없음·기다림 |
|---|---|---|---|---|---|---|
| 하니 | 일기장 들고 손 올림 | 일기장 안고 응시 | 목표 체크 보드 곁에서 삐짐 | 뒤돌아 팔짱·곁눈질 | 무릎 안고 일기장·보드 옆에 앉음 | 일기장 들고 기다림 |
| 가은 | 목록 클립보드 들고 응원 | 클립보드 들고 응시 | 목록·펜 내려두고 삐짐 | 뒤돌아 팔짱·곁눈질 | 목록·펜 곁에서 무릎 안음 | 클립보드 들고 기다림 |
| 수연 | 덤벨 들고 응원 | 물병 들고 응시 | 매트·덤벨 곁에서 삐짐 | 뒤돌아 팔짱·곁눈질 | 매트·덤벨·물병 옆에 앉음 | 물병 들고 기다림 |
| 윤슬 | 책갈피 있는 오답노트 들고 응원 | 오답노트 들고 응시 | 노트·빨간펜 곁에서 삐짐 | 뒤돌아 팔짱·곁눈질 | 노트·빨간펜 옆에서 무릎 안음 | 오답노트 들고 기다림 |
| 이음 | 클라우드 아이콘 노트북 들고 응원 | 탭 바인더 들고 응시 | 외장하드·케이블 곁에서 삐짐 | 뒤돌아 팔짱·곁눈질 | 노트북·외장하드 옆에 앉음 | 바인더 들고 기다림 |

## 실제 참조 파일

그림체·여백: `assets/procrastination/pb-chibi-sheet-v1.webp`.

| 인물 | 얼굴·머리·의상 프로필 | 사무실 치비 |
|---|---|---|
| 하니 | `assets/profiles/hani-profile-hani.webp` | `assets/sprites-v3/hani.webp` |
| 가은 | `assets/profiles/hani-profile-gaeun.webp` | `assets/sprites-v3/gaeun.webp` |
| 수연 | `assets/profiles/hani-profile-sooyeon.webp` | `assets/sprites-v3/sooyeon.webp` |
| 윤슬 | `assets/profiles/hani-profile-yoonseul-v2.webp` | `assets/sprites-v3/yoonseul.webp` |
| 이음 | `assets/profiles/hani-profile-ieum.webp` | `assets/sprites-v3/ieum.webp` |

내장 **image_gen** 사용. 기존 시트를 `reference-style.png`, 프로필·사무실 치비를 `reference-identities.png`로 묶어 둘 다 생성 입력에 제공. 최종 프롬프트: [PROMPT.txt](PROMPT.txt). 생성 원본 보존 후 Pillow로 칸 정렬·WebP 인코딩·비교 이미지 합성.

## 검수·인계

- 자동 검사 통과: 30칸 고유 이미지, 6×5 계약, 256px 칸, 전 칸 바깥 투명 여백·잘림 없음, 서 있는25칸 높이216px, 알파0~255, WebP 무손실 디코딩 일치, 1.5MB 이하. [validation.json](validation.json)에 칸별 좌표·SHA256 기록.
- 시각 확인: 행 순서, 포즈 흐름, 의상·머리색·안경·머리핀, 소품, 새 시트 글자0·분노기호0 확인. 기존 시트 SHA256 보존 확인.
- 실행: `python artifacts/procrastination-4/art/prepare.py`, `python artifacts/procrastination-4/art/package.py`(Codex 내장 Python/Pillow).
- Git·Edge·JS/CSS 수정·버전 변경·데이터/Cloud 변경·배포 없음. 실제 앱 표시·CSS 연결은 **미검증**, 서윤 담당. 기존 CSS 계약은 읽기만 확인(CODEMAP_MISS).
- 전달 기준: `hani/procrastination-4` / `876d47e`(지시 값, 원격 새 확인 없음). Notion·공통 문서 갱신은 지정 쓰기 범위 밖이라 **미반영·인계 대기**. 상세 [HANDOFF.md](HANDOFF.md).
