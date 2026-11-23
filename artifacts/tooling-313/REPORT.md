# tooling-313 · 2.9.313 출시 후 시험 층 (서윤)

도연 선임님이 사용량 한도(11/28 22:15까지)에 걸려, 서윤이 직접 만들었다. 이 파일은 도연 선임님이 시작했다가 멈춘 보고서 자리를 대신한다.

## 변경
- 새 층 `release-313`(가장 바깥): `scripts/hani-release-313-{source,preload,reviewed-input}.cjs`, `hani-release-313.test.mjs`, `fixtures/release-313-layer.json`. 2.9.312 층과 같은 방식이다.
  - index.html 62곳과 hani-main.js 1곳: 2.9.313 → 2.9.312 되돌림. 되돌린 결과는 하니툰 브랜치 커밋 b65b4b0과 같다.
  - 연혁: v2.9.313 항목을 빼고 v2.9.312의 commit·subject를 비운다(한 구간 편집).
  - `merge-base HEAD origin/main`을 base 6868fa3으로 보이게 한다. release 7534e0e 조상일 때만 그렇다.
  - owners 1,538개는 HEAD fa87f81 기준으로 고정했다.
- 순서: 313 → toon-313 → 312 → procrast-312 → 311 → light-311 → …
  - 연결: `scripts/hani-toon-313-source.cjs` 첫 줄에 bootstrap 1줄.
  - 등록: `hani-menu-badges-historical-input.cjs`에 tooling313 블록 5줄.
- 이 PR에 함께 들어가는 것: 하니툰 기능 시험 `hani-toons.test.mjs`, toon-313 층(도연, hani/hanitoon에서 검증), `artifacts/hanitoon-layer/` 보고서.
- 기존 시험·fixture·hash·단언은 수정하지 않았다. 운영·보호 경로·저장·Cloud 변경도 0이다.

## 확인
- 핵심: release-313 9/9, toon-313 6/6, toons 8/8, release-312 9/9, procrast-312 8/8, release-311 8/8, release-306 8/8, menu-badges 7/7, helper-bubble 7/7, reviewed-release-baseline 18/18. 모두 PASS.
- 전체 321개를 단독 실행(4개 병렬, 90초 제한)한 결과는 아래와 같다. 기준은 2.9.312 출시 후 245/318이다.
  - 통과 248 = 기준 245 + 새 시험 3.
  - 회귀 0. 병렬 실행에서 시간 초과난 6개는 하나씩 다시 돌려 모두 PASS했다.
- 출시 직후 층 없이 돌렸을 때는 169개만 통과했다(77개 깨짐). 이번 층으로 모두 복구했다.
- 실행 후 지정 JSON(office-behavior, office-drama, m9-link)을 원래대로 되돌렸다.
