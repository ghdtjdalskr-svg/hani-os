# 치비 3탄 그림 근거

- 기본 image_gen 도구 사용. CLI/API 전환 없음.
- 스타일 참조: v1·v2 시트, pb-chibi-sheet-v1, 개별 jieun-think. 인물 참조: 하니·히나·나은·윤슬v2·하루·지은 프로필을 identity-reference.png로 묶음.
- 원본: Codex generated_images의 exec-b0ffa05d-bd5c-4da7-88ea-bc5f2fd23bb9.png. 1254×1254 RGBA 결과를 Sharp로 1024×1024 리사이즈, quality82/alphaQuality100/effort6 WebP 변환. 원본 alpha 유지, 배경 제거·그림 재합성 없음.
- 최종: assets/street-journal/chibi-sheet-v3.webp / 228,068 bytes / 222.72KiB. 512px×4 셀, 좌상 생일·우상 윤슬 노트·좌하 하루 팝콘·우하 지은 빈 파일철.
- compare.png: 윗줄 v1 네 칸, 가운데 v2 네 칸, 아랫줄 신규 네 칸. 그림 안 글자 없음. 갈색 선화·눈 광택·볼·머리 질감·정장 전신 비율 대조. 최종 취향 일치는 대표님 Preview 판단 대기.

## 최종 프롬프트

```text
Use case: illustration-story. Create ONE production sprite sheet for PROJECT HANI, exactly 1024x1024 pixels, genuine transparent RGBA background, four separate 512x512 cells in a 2x2 grid. No text, no lettering, no watermark, no drawn panel borders or background. Every full-body figure and prop wholly within its cell with padding. The first three references (chibi-sheet-v1.webp, chibi-sheet-v2.webp, pb-chibi-sheet-v1.webp) and jieun-think.webp are STYLE references: match their exact polished Korean office chibi illustration style, warm thin dark-brown outlines, glossy softly shaded brown hair, large expressive brown anime eyes, rosy cheeks, 2.5-head full body proportions, small office heels, detailed pastel suits. Do not switch to flat vector, 3D, watercolor, rough sketch or different face style. The fifth image is a six-portrait CHARACTER identity reference collage (top row Hani, Hina, Naeun; bottom row Yoonseul, Haru, Jieun), translate to precisely this existing chibi style.
TOP LEFT: Hani (long dark wavy hair, dark purple skirt suit), Hina (brown updo with pink cherry blossom ornaments, pink skirt suit), and Naeun (short brown bob, pale sage green skirt suit), THREE tiny chibis together happily celebrating, holding ONE little strawberry birthday cake with candle between them; gentle smiles, readable trio balanced centrally within this single 512px cell.
TOP RIGHT: Yoonseul, brown loose side braid with sage bow, gold round glasses, cream jacket, pale sage blouse, tan skirt, opening a small notebook toward viewer with inviting gentle smile. Match Yoonseul of v2 top-left and profile.
BOTTOM LEFT: Haru, long chestnut wavy hair, brown eyes, pale blue-lavender skirt suit, holding a red-and-white striped tub of popcorn and a piece of popcorn, warm smile. Follow Haru profile; do not give her glasses.
BOTTOM RIGHT: Jieun, short chestnut bob gathered in a low side bun, round thin gold glasses, tan skirt suit and white blouse, holding open an EMPTY cream report binder, calm welcoming smile. Follow jieun-think and profile. Blank binder pages without writing.
Each cell character uses nearly full cell height like existing v2, cake trio all contained in top-left. Preserve crisp transparent edges, no drop shadow or opaque backdrop.
```

