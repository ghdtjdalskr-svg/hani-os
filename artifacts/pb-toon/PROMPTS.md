# 생성 프롬프트와 참조

내장 `image_gen` 사용. CLI/API fallback 없음. 배경 투명 옵션 true.

스타일 참조: `assets/street-journal/chibi-sheet-v1.webp`. 직원 외형 참조: `assets/profiles/hani-profile-{naeun,hina,jieun,haru,minji}.webp` 5장을 순서대로 합친 `drafts/profile-reference.png`. 이미지 입력 5개 제한에 맞추기 위한 참조판이며 원본 프로필은 수정하지 않았다.

최종 생성 원본: `C:/Users/홍성민/.codex-2/generated_images/01a1bab1-17bb-7550-a849-b42cb9f1b1e6/exec-71d4b97a-e0e6-4cbf-870e-ca186ba11783.png`. 최종 WebP는 이 원본에서 각 직원·상태를 분리하여 투명 여백 안에 배치한 무손실 시트다. 개별 컷 파일은 만들지 않았다. 비교·카드는 원본 자산과 최종 시트를 정적으로 배치했으며 인물을 다시 생성하지 않았다.

실제 전송한 전체 최초 프롬프트와 여백 보완 프롬프트는 아래에 기록한다.

## 최초 생성

```text
Use case: illustration-story.
Create ONE transparent sprite sheet for PROJECT HANI procrastination board: exactly 30 full-body chibi illustrations, SIX equal columns by FIVE equal rows. Desired canvas 1536x1280 pixels, every cell 256x256, no outer margins, no headings, no panel borders. True transparent RGBA background, not checkerboard. Keep every figure and emotion symbol completely inside its own cell with 12px safety inset. Consistent baseline, figure size around 210px tall, seated figures naturally shorter. Exactly one employee in each cell.
REFERENCE ROLES: image 1 existing street-journal/chibi-sheet-v1.webp is the mandatory STYLE reference: precisely match its polished delicate dark-brown outlines, giant sparkling eyes, blush, clean softly shaded anime digital painting, finely highlighted layered hair, elegant cute SD adult office women, approximately 2.5-head full-body proportions, small hands and pumps. Do not switch to flat icons, watercolor, rough cartoons or 3D. Image 2 is a horizontal strip of FIVE CHARACTER IDENTITY AND CLOTHING references, LEFT TO RIGHT Naeun, Hina, Jieun, Haru, Minji, corresponding to rows 1-5 respectively. Preserve each hairstyle, hair color, glasses, accessories and jacket palette.
ROWS TOP TO BOTTOM:
1 Naeun / 나은: short side-parted dark chestnut bob, brown eyes, tiny stud earrings, sage mint blazer and matching knee-length skirt over white blouse, dark pumps. A small mint water bottle is her prop.
2 Hina / 히나: dark hair in high loose bun, pink cherry blossom hairpin and dangling pink ornament exactly like profile, brown eyes, pink blazer and skirt, white blouse, dark pumps. A small book is her prop.
3 Jieun / 지은: chestnut side part in low bun, round thin gold-brown glasses, beige blazer and skirt, white blouse, dark brown pumps. A small calculator is her prop. Match existing chibi Jieun in style sheet.
4 Haru / 하루: long loose wavy brown hair, side part, brown eyes, powder-blue blazer and skirt, white blouse, dark pumps. A small shopping bag is her prop.
5 Minji / 민지: long chestnut high ponytail, side swept fringe, warm brown eyes, coral salmon blazer and skirt, white blouse, coral pumps. A small notebook is her prop. Match existing chibi Minji in style sheet.
COLUMNS LEFT TO RIGHT FOR EVERY ROW:
0: delighted open smile, waving one hand, prop held in other hand.
1: mild disappointed pout, eyes open and gentle, fingers fidgeting together in front of waist, prop hanging safely at wrist or beside feet.
2: distinctly puffed cheeks, furrowed brows, closed mouth, BOTH arms tightly crossed, prop beside her feet. Cute annoyed, not crying.
3: back-facing full body, head turned slightly over shoulder, clearly see back of blazer and hairstyle, tiny Korean '흥' symbol above shoulder, prop held at side. Must actually turn body away.
4: tucked into lower-right corner of own cell, sitting low hugging bent knees, head bowed, small dark cartoon gloom cloud or mushroom above, prop tucked close by; caring sulk, no distress.
5: curious neutral head tilt, one hand near cheek, unmistakable '?' floating above head, prop in free hand.
Only characters, props and requested emotion symbols. NO speech bubbles, labels, extra words, logos, men, frogs or other animals. Do not omit, repeat, swap or merge any cells. All thirty fully separated. Use transparent empty space between characters.
```

## 여백·연기 보완

```text
Edit image 1, the 30-character transparent sprite sheet, while preserving all FIVE employee rows and SIX emotional-state columns and exactly the same polished anime chibi illustration style. Image 2 is the existing canonical street-journal style reference. Image 3 is the identity reference strip left to right Naeun, Hina, Jieun, Haru, Minji.
Mandatory repair: EVERY sprite must be COMPLETE and entirely contained within its own square cell, especially row 5 Minji currently has feet clipped. Redraw/complete cropped shoes. Make all figures about 15% smaller inside each cell, with at least 20px clear transparent padding on all FOUR edges of each cell, leaving at least 40px empty between adjacent figures. SIX columns x FIVE rows, uniform grid, desired 1536x1280 canvas, cells256x256. NO visible grid lines. True transparent background.
Also make column 2 (third column) puffed cheeks more visibly rounded, lips a tiny pouting 3 shape, both arms crossed, no open mouths. Every column 3 (fourth column) clearly has back facing viewer, head looking over shoulder and tiny '흥'. Column 4 (fifth) sits at LOWER RIGHT inside each cell hugging knees, small cloud above, never crossed into adjacent cell. Column5 '?' fully inside last column with safe right margin.
Preserve costumes and accessories: Naeun short bob mint suit water bottle; Hina cherry blossom bun pink suit book; Jieun low bun glasses beige suit calculator; Haru loose long wavy brown hair blue suit shopping bag; Minji high ponytail coral suit notebook. All five row characters remain distinct and identical across their own six cells. Preserve delicate linework, rich softly highlighted hair, big glossy eyes, blush and adult SD proportions of image2. Keep original emotional progression per row: happy waving, mildly sad fidgeting fingers, puffed cheeks crossed arms, back-facing sulk, crouching hugging knees, head tilt with question mark.
No extra characters, no men, no frogs, no animals, no labels, no speech balloons. ONE transparent sheet only.
```
