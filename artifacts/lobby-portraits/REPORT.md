# 로비 스태프 초상화 6종 · 아트 제작 완료

2026-11-28 KST · Codex · `hani/org-lobby-staff` · 로컬 기준 `3c3775d8eb1fe37fd5f50bf6ca4e653798b30745`. Git 명령·앱/runtime 변경·버전 증가·배포 없음. 서윤 Git 인계 대기.

## 산출물과 용량

본문 `assets/profiles/hani-profile-<id>.webp`는 720×720, 썸네일 `assets/profiles/thumb/hani-profile-<id>-128.webp`·`-256.webp`는 각각 128×128·256×256. 모두 손실 WebP q86/method6이며 동일 명찰 합성 원화에서 LANCZOS로 축소했다.

| 이름 / id | 720px bytes | 128px bytes | 256px bytes |
|---|---:|---:|---:|
| 다솜 / dasom | 63,722 | 4,022 | 11,882 |
| 나래 / narae | 54,254 | 3,692 | 10,580 |
| 소담 / sodam | 48,364 | 3,296 | 9,250 |
| 하람 / haram | 44,484 | 3,240 | 9,040 |
| 이슬 / iseul | 60,050 | 3,470 | 10,718 |
| 은하 / eunha | 54,728 | 3,454 | 10,234 |

18개 총 408,480바이트. 본문 6개 모두 90,000바이트 이하.

## 참조와 제작

- 내장 `image_gen` 사용. 모든 생성 호출에 `assets/profiles/hani-profile-yuna.webp`, `hani-profile-ieum.webp`, `hani-profile-hyejin.webp`를 화풍 참조로 전달했다.
- 디자인 참조는 `assets/sprites-v3/`의 `npc-clerk-day.webp`(다솜), `npc-clerk-night.webp`(나래), `npc-guide.webp`(소담), `npc-desk-night.webp`(하람), `npc-barista-iseul.webp`(이슬), `npc-barista-eunha.webp`(은하).
- 성인 여성의 어깨·가슴 위 구도, 역할별 표정과 파스텔 배경을 통일했다. 앞치마 하트·별, 모자 방패 형태는 원본과 대조해 후속 보정했다. 브랜드·로고·생성 문자는 없다.
- 이름은 생성하지 않은 빈 가슴 명찰에 PIL과 `C:/Windows/Fonts/malgun.ttf`로 한국어 이름만 합성했다. 기존 유나 썸네일의 치수·손실 포맷을 확인하고 q86으로 통일했다. 기존 파일의 원래 인코딩 품질 수치는 메타데이터로 확정할 수 없다.
- 전체 최종 프롬프트: [prompts.json](prompts.json). 후속 `refinementPrompt`가 해당 최초 프롬프트의 작은 장식 지시보다 우선한다. 원화·명찰 합성 PNG·마감 스크립트는 이 폴더 안에만 보관했다.

## 검증과 남은 확인

18/18 실제 WebP 디코딩·치수·손실 VP8·용량·SHA256 검사 통과. 지정 원본 이미지와 앱/runtime 등 보호대상 140파일의 마감 전후 SHA256 동일. [compare.png](compare.png)는 각 원본 첫 프레임과 최종 초상화를 나란히 배치하고 유나·이음·혜진 참조도 함께 표시한다. [badges.png](badges.png)에서 6개 한글 명찰이 테두리 안에 들어오는 것을 직접 확인했다. 수치 근거: [validation.json](validation.json).

작은 치비에서 성인 초상화로 확대한 세부 머리카락·눈동자·재질은 해석이 들어가므로 픽셀 단위 동일성은 보장하지 않는다. 최종 화풍·인물 해석은 성민 대표님 비교표 확인이 남는다. 실제 회사소개 연결·브라우저 UI·Candidate/운영 검증은 이번 아트 전용 범위 밖이며 미수행이다. 표시 버전 증가는 배포 담당 범위로 보류했다.

Notion [착수 카드](https://app.notion.com/p/426c52757074817981e8d9053de27f92)는 생성·읽기 확인 완료. 이후 진행/완료 갱신은 자동 승인 검토의 `approval policy never` 거절로 미반영이며, [HANDOFF.md](HANDOFF.md)에 대기 내용을 남겼다.
