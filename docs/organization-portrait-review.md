# 여성 프로필 · M9 시리즈 일치 검토

- 사용자 수정: 신규 인력 전원 여성. 하니 닮은 얼굴이 아니라 M9 전체와 동일한 화풍.
- 기존 1/2차 시안은 적용하지 않음. 미르 3차 1장만 검토용 생성, 나머지는 시안 확인 후 진행.
- 내장 image_gen 사용. CLI/API fallback 사용하지 않음.
- 참고: 기존 지은·나은·수연 프로필 3장(화풍 참조, 얼굴 복제 아님).
- 저장: assets/profiles/hani-staff-mir-v3-review.png. 앱에는 아직 적용하지 않음.
- 기업솔루션사업부 업무용 Claude 1명 추가. 임시명 채원(기존 작업 ID taeo 유지). Codex 임시명 도연(기존 ID dohyun 유지). 이름은 제안, 모두 여성 설정.
- 팀별 5개 탭 구현, 실제 구성원 기반 프로필 비주얼로 변경. 무관한 팀 장면 제거.
- 신규 자산 전체 제작/앱 적용은 미완료. 운영 배포 없음.

## 최종 미르 시안 프롬프트

```text
Create ONE new FEMALE character portrait to join the EXACT illustrated corporate profile series in the three references. References 1,2,3 are STYLE AND SERIES references (Jieun, Naeun, Sooyeon), not identity targets. Copy their art direction faithfully: thin warm dark-brown linework, simplified small nose, large layered iris anime/webtoon eyes, restrained soft cel shadows, warm peach skin, hand-drawn hair strand highlights, lightly textured muted pastel background, and simple painted blazer folds. Do NOT make photorealistic, 3D, glossy, ultra-detailed, or a different comic style. Same head size and upper chest crop as those references, square canvas. Subject is Mir (미르), a distinct adult WOMAN: straight cool dark-gray shoulder-length hair with a blunt fringe and one side tucked behind ear, softly rounded face with gentle gray eyes, calm closed smile, midnight blue blazer and ivory blouse, muted blue-gray background. Her silhouette and bangs must clearly differ from Hani's long brown side-parted waves, and from all three reference identities. Small rectangular cream badge on blazer reads exactly '미르' in dark Korean lettering, matching reference series badge scale. Upright comfortable corporate portrait, top of hair fully visible, no props, no other people, no watermark. This is a new member drawn by the SAME illustrator as the provided M9 series, not a redesign of an existing member.
```
