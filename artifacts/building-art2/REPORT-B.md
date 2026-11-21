# 그림 쿠폰 2호-B — 최종 납품

2026-11-22 KST · 도연 / Codex · 내장 image_gen 사용. UTF-8 지시 한글 정상 확인.

| 최종 파일 | 규격 / 용량 | WebP |
| --- | --- | --- |
| [6F 박물관](../../assets/building/floor-6f-museum-v1.webp) | 1672×941 / **234,668 B** | 손실 Q83, effort 6 |
| [부서 배지 8종](../../assets/brand/hani-dept-emblems-v1.webp) | 512×256 / **39,796 B** | 손실 Q81, alphaQuality 100 |

- **6F**: 안내 데스크·이젤, NW 빈 벽면 전시틀 4+유리 진열장 2, SW 빈 세로 액자 4+가로 액자 1+명패대, NE 연표 레일·빈 액자 3·거치대 2, SE 서가·열람 테이블·의자 2·벤치 확인. 사람·동물·글자·실제 전시 그림 0을 최종 WebP 육안 검수. 측벽에 남았던 작은 추상 그림은 image_gen 보정 후 제거했고 초안은 보존했다. 자동 OCR은 미수행.
- **정렬**: 5F와 같은 상단 중앙 승강기(문 중심 약 **837,118**, 문턱 y≈178), 중앙 세로 러너(x≈788~914, y≈243~878)를 [50% 겹침판](overlay-6f.png)·[코어 확대](core-6f-vs-5f.png)로 확인. 경계 육안 판독 약 ±5px이며 픽셀 동일을 보장하는 앵커 계약은 아니다. [5F·4F·옥상 나란히 비교](side-by-side-6f.png)에서 시점·재질·채색 확인.
- **배지**: 4×2, 셀 128×128, 가장자리 최소 8px 완전 투명. 요청 순서대로 악수 / 그래프·동전 / 음표·하트 / 칩 / 의자·별 / 편지·시계 / 지도·나침반 / 액자·월계관. 회장실 개구리·시계 숫자·나침반 글자 없음. [셀 좌표 JSON](emblems-grid.json), [밝고 어두운 배경](emblems-light-dark-B.png), [128·64·40px 확인](emblems-size-readback-B.png). 512×256에서 식별 가능해 1024 확대 불필요.
- **인코딩**: 6F 원본 1670×941을 가로 2px 정규화. Q85 257,842 B / Q84 246,576 B로 한도를 초과해 **Q83** 채택. 배지는 생성 alpha를 유지한 추출·축소·균일 셀 패킹만 수행. [인코딩 근거](encoding-B.json).
- **검증**: `node --check artifacts/building-art2/finalize-coupon-B.cjs`, `node artifacts/building-art2/finalize-coupon-B.cjs --verify-only` 통과. 최종 실디코딩·규격·용량·손실 VP8·8셀 alpha 여백·겹침판 모든 채널 50% 정확성·기존 **133파일 SHA-256 불변** PASS. [검증 JSON](validation-B.json). 기존 쿠폰 1호/2호-A 그림·기록 보존.
- **범위**: 새 운영 이미지 2장 및 이 artifact 내부만 작성. Git·Edge·앱 연결·저장·Cloud·schema·버전·캐시·배포 변경 없음. 실제 앱/캐릭터 가림/모바일/통합 Preview/Release gate/운영 read-back 미검증. JS syntax·DOM/event·Cloud write QA는 운영 코드 무변경으로 N/A, 버전 증가는 배포 담당 열차 단계에 인계.

[생성 명세](prompts-B.json) · [측벽 보정 명세](prompt-museum-corrections-B.json) · [최종 인수인계](HANDOFF-B-final.md). Git 금지로 전달 branch `hani/building-art`의 실제 branch/base SHA/원격 최신성 미조회. Notion·공통 현황 갱신은 지정 폴더 쓰기 제한으로 **대기**하며 인수인계에 요약을 남겼다. 아트 납품 완료이며 앱 적용·배포 완료는 아니다.
