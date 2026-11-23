# 도움봇 전용 얼굴 시트 검수 · 2026-11-24

- 완성: `assets/helper/helper-faces-v1.webp` — **960×768px / 5열×4행 / 칸192×192px / 투명 / 무손실 WebP**.
- 크기: **506,182바이트 (506.18KB / 494.32KiB)**. 600KB 이하.
- 얼굴 기준점: 모든 칸 **(96, 88)**, 가로50%·세로45.83%. 아래 좌표는 시트 전체 좌상단 기준. 얼굴 타원 중심을 수동 판독해 정렬했으며 자동 얼굴 인식 측정은 아님.
- 제작: 내장 **image_gen**으로 20명 새로 그림 → 간격 수정1회 → 원본 픽셀의 인물 실루엣만 분리·축소·배치. 기존 단체 그림에서 직접 잘라 쓴 칸은 없음. 그림체·정체성은 launch 단체 그림을 기준으로 복원.
- 참조: `assets/launch/chibi-launch-v1-day.webp`, `assets/profiles/hani-profile-daon.webp`, `hani-profile-yoonseul-v2.webp`, `hani-profile-ieum.webp`, `assets/procrastination/pb-chibi-sheet-v2.webp`. 전체 프롬프트는 `PROMPT.txt`, 간격 수정은 `PROMPT-spacing.txt`.

| 칸 | 인물 ID | 출처 | 얼굴 중심(x,y) |
|---|---|---|---|
| 1행 1열 | hani | 새로 그림 · launch 참조 | (96, 88) |
| 1행 2열 | yuna | 새로 그림 · launch 참조 | (288, 88) |
| 1행 3열 | mir | 새로 그림 · launch 참조 | (480, 88) |
| 1행 4열 | seoyun | 새로 그림 · launch 참조 | (672, 88) |
| 1행 5열 | dohyun | 새로 그림 · launch 참조 | (864, 88) |
| 2행 1열 | serin | 새로 그림 · launch 참조 | (96, 280) |
| 2행 2열 | yuri | 새로 그림 · launch 참조 | (288, 280) |
| 2행 3열 | arin | 새로 그림 · launch 참조 | (480, 280) |
| 2행 4열 | gaeun | 새로 그림 · launch 참조 | (672, 280) |
| 2행 5열 | jieun | 새로 그림 · launch 참조 | (864, 280) |
| 3행 1열 | haru | 새로 그림 · launch 참조 | (96, 472) |
| 3행 2열 | naeun | 새로 그림 · launch 참조 | (288, 472) |
| 3행 3열 | hina | 새로 그림 · launch 참조 | (480, 472) |
| 3행 4열 | minji | 새로 그림 · launch 참조 | (672, 472) |
| 3행 5열 | sooyeon | 새로 그림 · launch 참조 | (864, 472) |
| 4행 1열 | sua | 새로 그림 · launch 참조 | (96, 664) |
| 4행 2열 | taeo | 새로 그림 · launch 참조 | (288, 664) |
| 4행 3열 | daon | 새로 그림 · 프로필 참조 | (480, 664) |
| 4행 4열 | yoonseul | 새로 그림 · 프로필 참조 | (672, 664) |
| 4행 5열 | ieum | 새로 그림 · 프로필 참조 | (864, 664) |

- 자동 검수 통과: 규격·순서20칸·서로 다른 이미지20개·알파0~255·무손실 재해독 바이트 일치·20명 각각 독립 실루엣·모든 유효 알파 픽셀의 반경88.32px 이내·윗여백 최소12px·원본 그림/프로필/CSS30개 SHA-256 보존. 자세한 수치는 `validation.json`.
- 육안 검수: `preview.png`의 이름 아래 **지름90px 원형20개**와 `atlas-review.png` 확인. 정수리·머리 윤곽 보존, 이웃 인물 조각·손·소품·배경·글자 없음. 히나의 꽃 장식·이음의 머리핀은 본인 외형으로 유지. 원래 윙크/나은의 눈웃음 유지.
- 실행: Python3.14.7 + Pillow, `package.py` → `finish.py`. Pillow는 인접 kidstoon의 기존 `tmp/pylibs`를 읽기 전용 PYTHONPATH로 재사용(PYTHONDONTWRITEBYTECODE=1). 설치 시도는 네트워크 차단, 추가 설치 없음.
- 이번 범위는 이미지 제작까지. JS·CSS 연결/실제 도움봇·Edge·Candidate·배포는 미검증이며 서윤 담당. Git 사용·commit·push·main 병합·버전 변경·저장/Cloud 변경 없음. 원격 main·운영 표시/최신JS 확인은 Git/Edge 금지로 미실행.
- Notion HANI-96: 착수 카드 생성·읽기 확인 성공. 최종 결과/상태 갱신은 자동 승인 검토의 approval policy never로 거절돼 미반영. 갱신 대기 원문은 HANDOFF.md에 보존.
- 최종 SHA-256: `32eac69d2aea8b444c48ab32a401cfb09277aadb658abdb85565de3973962cdf`.
