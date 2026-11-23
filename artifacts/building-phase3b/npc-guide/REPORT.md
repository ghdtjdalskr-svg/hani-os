# 안내 데스크 NPC

2026-11-24 KST · 도연 / Codex · 제작·파일 검수 완료, 서윤 연결 대기. 전달 branch `hani/building-phase3b`, SHA·원격 최신성은 Git 금지로 미확인.

완성 파일: [`npc-guide-v1.webp`](../../../assets/sprites-v3/npc-guide-v1.webp), **39,246바이트 / 50,000 이하**. 768×768 투명 아틀라스, 96×144 셀, 0행 0~3열만 사용한다.

standing / sitting / walk-a / walk-b의 실제 contentRect 높이 **120 / 105 / 111 / 111px**, pivot **(48,135)**, 셀 밖 불투명 픽셀 **0**. 무손실 WebP 디코딩·알파 일치·포즈 구분 검증 통과.

자주빛 낮은 묶음머리·청남색 재킷·흰 블라우스·살구색 스카프·빈 사원증의 여성 NPC. 두 필수 이미지를 built-in image_gen 참조로 사용했다. [원문 프롬프트](PROMPT.txt) / [1:1 비교](compare.png) / [프레임](frames.json) / [검증 수치](VALIDATION.txt).

기존 그림·manifest 포함 38파일 해시 보존. Git·Edge·운영 코드·데이터·버전 변경·배포 없음. 런타임 통합 화면은 미검증, 서윤 연결 후 확인한다.

Notion·공통 문서는 지정 쓰기 범위 밖으로 미반영·인계 대기. 상세 경계와 다음 행동은 [인수인계](HANDOFF.md)에 기록했다.
