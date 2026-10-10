# Organization Hub — 신규 프로필과 업무 이름표 (2026-10-07)

## 후속: 승인한 서윤 최종 시안 적용

- 대표님 요청: 새로 만든 친구들 적용. 서윤의 부드러운 표정 수정본을 승인함.
- 서윤만 hani-staff-seoyun-v7.png로 교체: 청흑색 긴 생머리, 회색 터틀넥, 작은 미소, 이름/업무 명찰. 기존 v5 원본은 보존.
- 나머지 신규 7명은 v5 승인/제작 시안 그대로 유지. 공통 portrait 경로를 통해 조직도, 팀 탭, People, 상세창에 동일 반영.
- 표시 버전/캐시 태그/저장소 write 경로/main/배포 변경 없음. 로컬 Preview 반영이며 운영 배포가 아님.

- 담당: Codex / branch hani/organization-hub-preview-20261007
- 기준선: c43ba2f1ce24c05e2cb16338e920fcf73731de0a. 연속 LIGHT 수정, 기준선 병합/rebase 없음.
- 변경: 신규 여성 AI 8명 프로필 연결, 조직도/팀 탭 이름·업무 이름표, 전원 People 카드 이름표. MIR는 인간이 아닌 AI 명시. 기존 M9 이미지 유지.
- MIR와 도연 수정 시안은 대표님이 좋다고 확인. 나머지 6명은 이번 제작 시안으로 전체 Preview 확인 대기.
- UI text 이름표로 한글/업무 읽기 보장. 이미지 자체에 업무 글자를 구워 넣지 않음.
- 대상: hani-organization-hub.js/.css, assets/profiles/hani-staff-*-v5.png, scripts/check-organization-hub.mjs.
- 생성: 내장 image_gen, 개별 이미지 생성/편집. 기존 파일/폐기 시안 삭제 없음.
- 검증: JS syntax 및 targeted Playwright PASS. 1440/390/320, 17 portraits, 8 신규 이름표, 필터, 팀 탭, 상세창, 이미지 decode, 가로 넘침 없음. 격리 앱 canonical route 및 보호 키 불변 PASS.
- 환경: 처음 sandbox 로컬 접속 거부 후 권한 검사에서 서버 종료 확인. 기존 localhost 서버 재시작 후 최종 검사 PASS.
- 미검증: 실제 로그인 앱 시각 QA, 독립 아린 리뷰, release gate. 버전/캐시/main/운영 배포 변경 없음. 탑승 대기 아님.
- 다음: 대표님 전체 디자인 확인. 작업 파일은 로컬 미커밋 상태이며 기존 commit 6334ecf는 이번 프로필을 포함하지 않음.

## 생성 프롬프트/자산

MIR: 승인한 기존 얼굴·남청 단발·의상·화풍 유지, cyan segmented iris rings 및 관자놀이 회로만 강조. 파일 assets/profiles/hani-staff-mir-v5.png.

도연: 기존 얼굴·후드·화풍 유지, 적갈색 긴 낮은 묶음머리와 두꺼운 검정 acetate 뿔테로 교체. 파일 assets/profiles/hani-staff-dohyun-v5.png (기존 안정 ID 유지).

### 서윤 — Claude · 설계/통합

파일: assets/profiles/hani-staff-seoyun-v5.png

Use case: stylized-concept. Create ONE square chest-up professional adult FEMALE portrait, 서윤, HANI GROUP Claude · 설계/통합. Three attached M9 portraits are STYLE REFERENCES ONLY; do not copy the identities. Match the same artist: fine warm dark drawn contours, detailed layered illustrated irises, simplified nose, peach skin and restrained blush, crisp soft cel shading, drawn hair highlights, subtle painted texture. Not photorealistic, not 3D. Character: long straight espresso hair with a center part tucked behind one ear, elongated mature face, narrow warm brown eyes, composed small smile, navy collarless tailored jacket over ivory top, muted slate blue background. Long hair only, no short hair or bob. Natural adult feminine proportions, distinct identity rather than another Hani lookalike. Relaxed professional pose, whole hair crown with headroom, chest-up framing. No other characters, collage, props, text, logo or name badge; readable name and job label will be added as website typography outside the artwork. Role-appropriate clothing, same M9 art style, individual face and silhouette.

### 세린 — Gemini · 분석/자동화

파일: assets/profiles/hani-staff-serin-v5.png

Use case: stylized-concept. Create ONE square chest-up professional adult FEMALE portrait, 세린, HANI GROUP Gemini · 분석/자동화. Three attached M9 portraits are STYLE REFERENCES ONLY; do not copy the identities. Match the same artist: fine warm dark drawn contours, detailed layered illustrated irises, simplified nose, peach skin and restrained blush, crisp soft cel shading, drawn hair highlights, subtle painted texture. Not photorealistic, not 3D. Character: long ash taupe hair in a loose half-up style, softly rounded face, bright hazel eyes, curious open smile, pale blue casual button-up shirt with rolled sleeves and fine silver pendant, mist lavender background. Long hair only, no short hair or bob. Natural adult feminine proportions, distinct identity rather than another Hani lookalike. Relaxed professional pose, whole hair crown with headroom, chest-up framing. No other characters, collage, props, text, logo or name badge; readable name and job label will be added as website typography outside the artwork. Role-appropriate clothing, same M9 art style, individual face and silhouette.

### 유리 — 품질 · 사전 검증

파일: assets/profiles/hani-staff-yuri-v5.png

Use case: stylized-concept. Create ONE square chest-up professional adult FEMALE portrait, 유리, HANI GROUP 품질 · 사전 검증. Three attached M9 portraits are STYLE REFERENCES ONLY; do not copy the identities. Match the same artist: fine warm dark drawn contours, detailed layered illustrated irises, simplified nose, peach skin and restrained blush, crisp soft cel shading, drawn hair highlights, subtle painted texture. Not photorealistic, not 3D. Character: long glossy black hair tied neatly in a low ponytail with straight bangs, distinct angular oval face, steady dark gray eyes, calm serious closed-mouth smile, charcoal cardigan over crisp white collared shirt, pale cool gray background. Long hair only, no short hair or bob. Natural adult feminine proportions, distinct identity rather than another Hani lookalike. Relaxed professional pose, whole hair crown with headroom, chest-up framing. No other characters, collage, props, text, logo or name badge; readable name and job label will be added as website typography outside the artwork. Role-appropriate clothing, same M9 art style, individual face and silhouette.

### 아린 — 사용성 · 디자인 리뷰

파일: assets/profiles/hani-staff-arin-v5.png

Use case: stylized-concept. Create ONE square chest-up professional adult FEMALE portrait, 아린, HANI GROUP 사용성 · 디자인 리뷰. Three attached M9 portraits are STYLE REFERENCES ONLY; do not copy the identities. Match the same artist: fine warm dark drawn contours, detailed layered illustrated irises, simplified nose, peach skin and restrained blush, crisp soft cel shading, drawn hair highlights, subtle painted texture. Not photorealistic, not 3D. Character: long reddish chestnut hair with a loose side braid over shoulder, wide-set warm brown eyes, softly square face, thoughtful friendly smile, textured cream knit with cobalt blue overshirt, pale powder blue background. Long hair only, no short hair or bob. Natural adult feminine proportions, distinct identity rather than another Hani lookalike. Relaxed professional pose, whole hair crown with headroom, chest-up framing. No other characters, collage, props, text, logo or name badge; readable name and job label will be added as website typography outside the artwork. Role-appropriate clothing, same M9 art style, individual face and silhouette.

### 가은 — Muse · 비주얼

파일: assets/profiles/hani-staff-gaeun-v5.png

Use case: stylized-concept. Create ONE square chest-up professional adult FEMALE portrait, 가은, HANI GROUP Muse · 비주얼. Three attached M9 portraits are STYLE REFERENCES ONLY; do not copy the identities. Match the same artist: fine warm dark drawn contours, detailed layered illustrated irises, simplified nose, peach skin and restrained blush, crisp soft cel shading, drawn hair highlights, subtle painted texture. Not photorealistic, not 3D. Character: long flowing muted dusty rose brown hair with layered curtain bangs, distinct heart shaped face and lively amber eyes, joyful confident smile, warm cream creative studio blouse with subtle plum scarf accessory, pale warm peach background. Long hair only, no short hair or bob. Natural adult feminine proportions, distinct identity rather than another Hani lookalike. Relaxed professional pose, whole hair crown with headroom, chest-up framing. No other characters, collage, props, text, logo or name badge; readable name and job label will be added as website typography outside the artwork. Role-appropriate clothing, same M9 art style, individual face and silhouette.

### 채원 — Claude · 기업 업무

파일: assets/profiles/hani-staff-taeo-v5.png

Use case: stylized-concept. Create ONE square chest-up professional adult FEMALE portrait, 채원, HANI GROUP Claude · 기업 업무. Three attached M9 portraits are STYLE REFERENCES ONLY; do not copy the identities. Match the same artist: fine warm dark drawn contours, detailed layered illustrated irises, simplified nose, peach skin and restrained blush, crisp soft cel shading, drawn hair highlights, subtle painted texture. Not photorealistic, not 3D. Character: long dark brown hair in a sleek high ponytail clearly extending below shoulder, defined cheekbones, alert almond olive-brown eyes, confident businesslike smile, structured teal blazer over light beige blouse, pale sage background. Long hair only, no short hair or bob. Natural adult feminine proportions, distinct identity rather than another Hani lookalike. Relaxed professional pose, whole hair crown with headroom, chest-up framing. No other characters, collage, props, text, logo or name badge; readable name and job label will be added as website typography outside the artwork. Role-appropriate clothing, same M9 art style, individual face and silhouette.
