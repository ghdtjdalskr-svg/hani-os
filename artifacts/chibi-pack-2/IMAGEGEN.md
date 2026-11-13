# 치비 2탄 그림 생성 근거

- 방식: 내장 `image_gen` 사용. CLI/API·외부 서비스·키 사용 없음.
- 최종 운영 파일: `assets/street-journal/chibi-sheet-v2.webp` (1024×1024, 투명 RGBA, 512×512 네 칸).
- 셀 순서: 좌상 윤슬 책갈피 / 우상 히나 잘했어요 / 좌하 히나 복습 / 우하 수연 지도·티켓.
- 직접 열어 본 스타일 원본: `assets/street-journal/chibi-sheet-v1.webp`, `assets/street-journal/chibi/minji-cheer.webp`, `assets/procrastination/pb-chibi-sheet-v1.webp`.
- 인물 원본: `assets/profiles/hani-profile-yoonseul-v2.webp`, `assets/profiles/hani-profile-hina.webp`, `assets/profiles/hani-profile-sooyeon.webp`.
- 최초 생성에 v1·pb·프로필 3개를 직접 전달. 스타일 보정에는 최초 결과·v1·개별 민지·pb·프로필 3개의 비교용 contact sheet를 전달(도구의 참조 최대 5개 제한).
- 도구 출력 PNG 1254×1254를 Pillow로 1024×1024 리샘플링, WebP quality82/method6 인코딩만 수행. 배경 제거·재색칠·그림 합성은 하지 않음. 모든 그림 내용은 image_gen 생성물.
- 비교 이미지 `compare.png`: v1 원본 네 포즈와 최종 WebP 네 칸을 같은 높이로 나열. 원본 그림 보존, 라벨은 비교 자료에만 추가. 운영 그림 안에는 글자 없음.

## 최종 보정 프롬프트 원문

```text
Use case: style-transfer. Image 1 is the edit target: preserve its four characters, exact 2x2 cell order, expressions, identities, clothes, poses and props. Images 2 and 3 are PRIMARY STYLE REFERENCES: render the four new characters with EXACTLY the same fine warm brown outlines, shiny detailed hair, chibi facial construction, cel shading, slight blush and full-body proportions as the existing street-journal chibis. Image 4 secondary chibi reference (especially Hina's floral bun in row 2). Image 5 a contact sheet of three IDENTITY reference profiles only, left Yoonseul (glasses, long braid, ivory/sage), center Hina (pink skirt suit, high dark bun and cherry blossoms), right Sooyeon (ash blonde short wavy hair, blue eyes, deep teal suit). Do not use realistic profile proportions. Keep Yoonseul offering bookmark with book top left, happy Hina holding notebook and red pen top right, gentle open-eyed Hina with open notebook and red pen bottom left, Sooyeon inviting with folded-open map and ticket bottom right. Final output ONE 1024x1024 sprite sheet with four exact 512x512 cells, transparent background and safe transparent margins so no hair or feet clip cell borders. No background, text, lettering, labels, numbers, dates, badges or watermarks anywhere, even on props. Keep Hina review reassuring rather than angry.
```

그림체 육안 확인: 갈색 선화·머리 광택·눈/볼 표현·작은 정장 전신 구성을 v1과 대조했고, 윤슬 안경/땋은 머리·히나 꽃 장식·수연 머리/눈/정장 색을 확인. 완전한 취향 일치·실제 72/56px 화면의 최종 판단은 대표님 Preview 확인 대기.
