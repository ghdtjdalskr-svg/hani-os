# HANI BUILDING V2 · floor art 217

> 2026-10-17: 성민 대표님 Preview 피드백에 따라 이 v2 배경·마스크 10개(800,466 bytes)는 제거했다. 아래는 과거 납품 기록이다. 현재 runtime은 `assets/building/floor-1f..5f-v1.webp`와 `data/hani-building/art-map-v1.json`을 사용하며 이 폴더의 manifest는 참조하지 않는다. 재검증 도구/미리보기는 삭제 전 아카이브 기록으로만 읽는다.

spatial-216-v1 기준의 정적 미술 납품본. 운영 앱에는 연결하지 않았다.

- 배경: `floor-{1f,2f,3f,4f,5f}-v2.webp`, 1600×1024, WebP q80.
- 전경: `floor-{1f,2f,3f,4f,5f}-foreground-v2.webp`, 1600×1024, lossless WebP alpha.
- 배경과 전경 10개 합계 **800,466 bytes**. 모든 배경 ≤220,000 bytes, 모든 전경 ≤70,000 bytes.
- 좌표는 1000×640 계약의 1.6배. 방·문·발 위치 변경 없음. 표면 rect의 정수 픽셀 반올림 오차 최대 0.4px.
- 무문자·무로고·무명패·무인물. 이름과 방 표시는 이후 HTML에서 처리한다.
- 배경 → 그림자/의자 후경 → 인물 → 전경 마스크 → 이름판. 의자 앞면/소파 팔걸이도 전경 파일에 함께 들어 있다.
- 전경의 불투명 RGB는 최종 배경을 디코딩한 동일 좌표 픽셀과 완전히 같다. 마스크를 겹쳐도 배경 색상이 바뀌지 않는다.
- 실제 캐릭터 4방향, 걷는 인물의 앞/뒤 depth 전환, 문/승강기 애니메이션은 이번 정적 미술 검증 범위가 아니다.

[검토 화면](_checks/preview.html) · [전체보기](_checks/floors-overview.webp) · [검증 JSON](_checks/final-verification.json) · [인수인계](../../docs/development-history/handoffs/2026-10-16-art-floors-217.md)

`_checks/`는 도면·생성 프롬프트·미리보기·검사 도구다. 런타임 자산 목록이나 전송 용량에 포함하지 않는다. 미술은 built-in image_gen으로 생성했고, 원화와 빈 방 배경을 계약 좌표에 합성했다. 프롬프트는 `_checks/prompts.json`, 원본 도구 경로는 `source-paths.json`/`backplate-paths.json`에 남아 있다. 원본 경로는 이 작업 PC의 도구 보관소 경로이며, 최종 납품 파일은 모두 이 폴더에 있다.

재검증: Node와 sharp가 있는 환경에서 `node assets/building-v2/_checks/verify-assets.cjs`. 필요하면 `SHARP_MODULE`에 설치된 sharp 패키지 경로를 지정한다. 전체 앱 Build/Release QA는 실행하지 않는다.
