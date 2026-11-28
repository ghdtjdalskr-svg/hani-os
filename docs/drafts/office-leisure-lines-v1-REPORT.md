# 대공사 4-1 보고서: 쉬는 장소 여가 말풍선 초안 (`office-leisure-lines-v1`)

- 작성자: 세린 연구원 (Gemini)
- 생성 파일: `docs/drafts/office-leisure-lines-v1.json`
- 인코딩 / 줄바꿈: UTF-8 / LF

## 1. 대상 범위 요약
- **대상 장소 (14곳)**:
  `coffee-1f`, `convenience-1f`, `cafe-1f`, `pantry-2f`, `pantry-seats-2f`, `sofa-3f`, `sofa-4f`, `garden-5f`, `terrace-5f`, `window-1f`, `window-2f`, `window-3f`, `window-4f`, `window-5f`
- **대상 인물 (21명)**:
  `terrace-5f.atByPerson` 및 `affinityEvidence` 기준 전원 포함:
  `seongmin`, `hani`, `yuna`, `gaeun`, `mir`, `seoyun`, `dohyun`, `serin`, `yuri`, `arin`, `jieun`, `haru`, `naeun`, `hina`, `minji`, `sooyeon`, `sua`, `taeo`, `daon`, `yoonseul`, `ieum`
  - `sooyeon`은 `terrace-5f.atByPerson` 및 `affinityEvidence`에 포함된 정식 직원(취미: 여행·스포츠·자전거·현장 체험)이므로 포함하였고, 아이들(꼬마 수현·수연)과 동물은 제외함.
- **총 문구 수**: 938개
  - 장소별 공용 `at`: 14 × 4 = 56개
  - 장소별 인물 `byPerson`: 14 × 21 × 3 = 882개

## 2. 규칙 준수 및 22자 이하 확인 방법
- **셸/도구 제약**: 지침에 따라 셸 명령을 사용하지 않고 파일 읽기/쓰기만 수행함.
- **길이 검증 방법**:
  1. 각 문구를 작성할 때 **텍스트 본문(이모지 제외)을 공백 포함 15~20자 이내**로 제한하고, 이모지가 붙는 문구는 **본문 최대 18자 + 공백 1자 + 이모지(UTF-16 기준 1~2단위)**로 설계하여 Python `len()`, JavaScript `.length`(UTF-16), 그래핌 단위 모두에서 22자를 넘지 않도록 직접 글자 수를 세어 확인함.
  2. 이모지는 3개 중 1개 비율(`byPerson`은 1인당 3문구 중 정확히 1개, `at`은 장소에 따라 4문구 중 1~2개)으로 문구 맨 끝에만 배치하고, 그 외 모든 문구는 `~중` / `~는 중`으로 끝냄.
  3. 3단위 이상의 결합 이모지(ZWJ 등)는 사용하지 않고 단일 코드포인트 또는 `FE0F` 포함 최대 2 UTF-16 단위 이모지만 사용함.
- **내용·금칙어 점검**:
  - `업무, 버그, 코딩, 고객, 보고, 회의, 검토, 기획, 설계, QA, 일정, 자료, 정리, 예산, 리스크, 제안` 등 일·업무 관련 단어를 모두 배제하고 간식·음료·휴식·풍경·취미·운동·음악·영화·여행·수다 내용으로만 구성함.
  - 연애·외모 묘사 제외, `seongmin` 회장님 문구는 개구리 캐릭터에 맞춰 점잖고 귀여운 톤으로 작성함.
  - 14개 장소 × 21명 전체 938문구에 대해 중복 문구가 없도록 장소별 테마와 인물별 취향·말투를 달리 배치하고 파일 저장 후 재검토함.

## 3. 후속 인계 (서윤 팀장님)
- JSON 파싱, 22자 이하 자동 단언 테스트, 중복 검사, 기존 `office-places-v3.json` 반영·병합은 서윤 팀장님 인계 범위로 남김.
