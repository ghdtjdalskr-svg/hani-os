# image_gen 제작 기록

2026-11-08 KST · built-in `image_gen.imagegen` 2회, CLI/API fallback 없음.
두 호출 모두 승인 B안 `../theme-quarterly/artifacts/theme-quarterly/teaser-b-thaw.png`를 `referenced_image_paths`에 전달했다. 기존 B안·홈 목업은 먼저 직접 열어 확인했다. 생성 결과도 직접 확인했다.

가로 프롬프트(실제 전달 원문):

> Use case: ads-marketing. Reference image 1 is the approved B campaign style and composition. Create a polished wide landscape 1536x1024 HANI OS THAW campaign illustration for a responsive app banner. Preserve the dark blue dawn, frosted arched window, warm pink sunrise, opening window, a woman with long dark brown wavy hair and plum blazer viewed only from behind, holding a notebook, first white buds and sage leaves. Keep the woman/window on the right half and quiet navy negative space on the left for live HTML copy. Subtle Frost #DCEAF2 Sage #BCD4C3 Pearl #F7F5EF Blush #EAC9CB Ink #29313A hints. Warm detailed Korean webtoon painted style matching the reference. Remove ALL lettering, logos, dates and D-7: NO TEXT anywhere; UI supplies accessible live text. No extra characters. This is finished app artwork, not a screenshot.

폰 프롬프트(실제 전달 원문):

> Use case: ads-marketing. Approved reference image 1 sets the B THAW campaign style. Create a square 1024x1024 mobile app companion illustration. Preserve frosted arched window at blue dawn, warm blush sunrise, first white blossom buds and sage leaves, the long dark brown wavy haired woman in plum blazer with notebook seen ONLY from behind. Right two thirds: silhouette at opening window, no face reveal. Left third dark navy negative space, top generous quiet dark space for live UI copy. Recompose for a square mobile image, retain the same elegant detailed Korean webtoon painted style. Palette Frost #DCEAF2 Sage #BCD4C3 Pearl #F7F5EF Blush #EAC9CB Ink #29313A. NO TEXT, lettering, logos, date or countdown anywhere. UI supplies accessible text. No extra characters, no UI frame.

원본은 Codex generated_images에 보존하고, sharp로 크기 정리/WebP quality83 인코딩만 했다. 그림 내용 편집은 image_gen에서 수행했다.

- [teaser-wide.webp](../../assets/theme-collections/thaw-2027q1/teaser-wide.webp): 1536×1024, 156,202B.
- [teaser-mobile.webp](../../assets/theme-collections/thaw-2027q1/teaser-mobile.webp): 1024×1024, 119,862B.

런타임 문구·날짜·카운트다운은 HTML이 그린다. 이미지에 고정 D-day가 없어 추가 결정의 D-31 변경에도 재생성 불필요. 아트의 뒷모습·창·빛과 실루엣 유지, 실제 PC/폰 크롭은 보고서 PNG 참고.
