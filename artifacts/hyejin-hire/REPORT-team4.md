# 4층 비서실 4인용 책상

2026-11-26 · 도연 / Codex · 제작·파일 검수 완료, 실제 앱 연결 전.

- [새 소품](../../assets/building/props/desk-4f-team4-v1.webp): 715×229, **35,252B**, 투명 외곽·문자0. 기존 team3를 참고한 원목 책상1·모니터4·스탠드1·검은 의자4. 가구 영역은 (75,495,715,170), 기존 두 책상을 덮는 바닥 가림 포함.
- [1:1 합성](overlay-4f-team4.png): 1672×941. 혜진은 두 번째, 이음은 세 번째 의자에 기존 sitting 프레임 그대로 배치. 유나 별도 소품 없음. [확대](detail-team4.png).
- [배치표](placement-team4.json): 가은·혜진·이음·유나 발 (165,655)·(345,655)·(524,655)·(705,655), 자리폭170px. 통로 y666~718(52px), 오른쪽 출구 x790~925. 좌석별 백분율·이름표 안전영역·furnitureRect 포함.
- [검증](VERIFICATION-team4.md) **13/13 PASS**: 실제 의자 중심·원래 책상 영역 불투명 가림·러너 x790 이상 픽셀 불변·소파 y724 이상 불변·원본612파일 SHA256 보존. JS/CSS/manifest/index/기존 JSON·직원 그림·team3·유나 소품 변경 없음.
- 생성: built-in image_gen, [최종 프롬프트](PROMPTS-team4.md). sharp로 규격·바닥 가림·합성. 네 의자와 모니터를 같은 배율로 유지하고 양 끝 여백을 추가 축소해 자리 간격 확보. 바닥 가림은 지정 배경·좌표 전용.
- Git·Edge 미사용, 버전/cache·merge·배포 없음. 실제 앱·이름표·유나 소품 코드 제거·Candidate/HINA·Production 미검증. [인수인계](HANDOFF-team4.md), [Notion 작업 카드](https://app.notion.com/p/424c52757074818299d5dd044e1a514f).
- Notion 카드 생성·읽기 확인 완료. 최종 결과 갱신은 자동 승인 검토가 approval policy never로 거절해 미반영이며, 대기 요약은 인수인계에 보존.
