# 직원 상호작용 v2 다듬기 노트

> **작성**: 세린 연구원 (Gemini · AI플랫폼개발실)  
> **결과 데이터**: [office-staff-interactions-v2.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/p4b/docs/drafts/office-staff-interactions-v2.json)  
> **참고 원문**: [office-staff-interactions-v1.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/p4b/docs/drafts/office-staff-interactions-v1.json) · [spatial-contract-v3.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/p4b/data/hani-building/spatial-contract-v3.json) · [art-map-v3.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/p4b/data/hani-building/art-map-v3.json) · [hani-office-live.js](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/p4b/hani-office-live.js) · [office-actions-315.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/p4b/assets/data/office-actions-315.json)

---

## 1. 바꾼 점 요약

1. **말풍선 길이 16자 이하 통일 (공백 포함, 이모지 1개 = 1자)**:
   - 기존 `L01`~`L60`의 190줄과 `TH01`~`TH12`의 대표 대사 24줄에서 17자 이상이던 문장을 뜻과 말투(반말·존댓말·이모지·`"회장님"` 호칭)는 그대로 살리면서 모두 **16자 이하**로 줄였습니다.
   - 예: `"유리 책임님, 이번엔 진짜 고쳤어요☕"`(20자) → `"책임님, 이번엔 고쳤어요☕"`(14자), `"추리 소설인데… 결말 반전이 무섭대요😅"`(22자) → `"추리 소설… 반전이 무섭대요😅"`(16자).
2. **관계 60쌍마다 `visitAnchor`, `visitNote`, `crossFloor`, `seatTalk` 확정**:
   - `spatial-contract-v3.json`의 `anchors`와 `office-actions-315.json` / `hani-office-live.js`의 `homeAnchor`를 대조해 `a`가 `b`를 찾아갈 때 서는 `junction` 앵커(`side_desk_*`, `approach_desk_*`, `side_secretary_desk`, `side_mir_station`)를 60쌍 전부 지정했습니다.
   - `a`와 `b`의 홈 층이 다른 **25쌍**에 `"crossFloor": true`를 표시했습니다(동일 층 35쌍은 `"crossFloor": false`).
3. **자리 대화 쌍(`seatTalk: true`) 5쌍 분리**:
   - `spatial-contract-v3.json` 좌표 기준으로 같은 방 같은 줄(또는 인접 책상) **90px 안쪽**인 5쌍을 `"seatTalk": true`로 표시했습니다.
     - `taeo ↔ daon`: 2F `finance` (`405,175` ↔ `350,175`, **55px**, 동일 `y=175`)
     - `naeun ↔ hina`: 2F `life` (`510,175` ↔ `580,175`, **70px**, 동일 `y=175`)
     - `hina ↔ yoonseul`: 2F `life` (`580,175` ↔ `650,175`, **70px**, 동일 `y=175`)
     - `minji ↔ sooyeon`: 2F `life` (`720,175` ↔ `790,175`, **70px**, 동일 `y=175`)
     - `yuna ↔ ieum`: 4F `secretariat` (`505,230` ↔ `480,175`, **60.4px**, `art-map-v3.json` 기준 동일 `y=76%` 옆자리)
   - 참고: `jieun ↔ sua`는 `spatial-contract-v3.json`상 `24px`(`130,175` ↔ `106,175`)이나 `art-map-v3.json`에서는 지은이 별도 임원실(`20.1, 20.4`)에 있어 실제 옆자리가 아니므로 `seatTalk: false`로 유지했습니다.
4. **14종 상호작용 시간대 가중치(`timeSlot`) + 요일 가중치(`weekday`) 완비**:
   - `rules.timeSlots`에 5개 시간대 구간을 명시했습니다: `morning` (`09:00~11:00`), `lunch` (`11:30~13:30`), `afternoon` (`13:30~17:00`), `evening` (`17:00~19:00`), `overtime` (`19:00~24:00`).
   - 14종 모두 `weights.timeSlot` 숫자 가중치를 넣었습니다(예: 아침 `work_question: 1.6`·`mentoring: 1.4`, 점심 `small_talk: 1.7`·`invite_walk_coffee: 1.6`, 오후 `review_feedback: 1.5`·`cross_dept_collab: 1.5`, 저녁 `desk_handoff: 1.8`·`praise_cheer: 1.4`, 야근 `comfort_support: 1.7`·`snack_share: 1.6`). 기존 `weekday` 가중치(월 `work_question: 1.6`, 금 `small_talk: 1.6` 등)도 함께 유지했습니다.
5. **이어지는 이야기 12개(`TH01`~`TH12`) 대사 세트 ID 완결 연결**:
   - 각 이야기의 `first`와 `then`에 `kind`, `a`, `b`, `timeSlot`, `time`, `lineSetId`를 모두 명시했습니다.
   - 기존 `L01`~`L60`과 1:1로 이어지는 9개 구간(`TH02.first`→`L15`, `TH03.first`→`L46`, `TH03.then`→`L10`, `TH04.first`→`L37`, `TH05.first`→`L42`, `TH06.first`→`L55`, `TH09.first`→`L27`, `TH10.first`→`L47`, `TH12.first`→`L34`)에 더해, 대사 세트가 비어 있던 나머지 15개 구간은 이어짐 전용 세트 **`L61`~`L75`**(`threadId` 포함, 각 줄 16자 이하)를 추가해 24개 구간 모두 실제 `lines[]` ID로 바로 조회되도록 맞췄습니다.

---

## 2. 자리 못 찾은 쌍 목록 (및 런타임 좌표 주의 쌍)

- **`"visitAnchor": null`인 쌍**: **0쌍** (`spatial-contract-v3.json` 기준 60쌍 모두 `b`의 방 안에 실존하는 `junction` 앵커를 찾았습니다.)
- **단, `spatial-contract-v3.json`과 `art-map-v3.json` / `hani-office-live.js` 사이의 기존 좌표 차이로 인해 구현 시 확인이 필요한 15쌍**을 아래에 별도로 남깁니다.

| 대상(`b`) | 해당 관계 쌍 | 선택한 `visitAnchor` | 좌표·런타임 주의 사유 |
|---|---|---|---|
| `sua` (`finance-row-spare`) | `jieun↔sua`, `haru↔sua`, `hani↔sua`, `naeun↔sua` (4쌍) | `approach_desk_sua` (`106, 245`) | `side_desk_sua`가 `spatial-contract-v3.json`에서 좌석과 동일 좌표(`106,175`, 0px)라 앞쪽 `approach_desk_sua`(70px)를 선택함. 다만 `art-map-v3.json`에서는 `approach_desk_sua`가 29.4 art-px로 `hani-office-live.js:608` 주석의 모바일 겹침 대상이므로, 폰 화면에서는 `side_desk_sua`(art 84.7px) 또는 `hall_finance` 폴백 검토 필요. |
| `taeo` (`finance-row-spare-east`) | `sua↔taeo`, `seoyun↔taeo`, `arin↔taeo` (3쌍) | `approach_desk_taeo` (`405, 245`) | `side_desk_taeo`가 `spatial-contract-v3.json`에서 좌석과 동일 좌표(`405,175`, 0px)라 `approach_desk_taeo`(70px)를 선택함. 수아와 동일하게 폰 화면에서는 `side_desk_taeo`(art 84.7px) 또는 `hall_finance` 폴백 검토 필요. |
| `seoyun` (`dev-lead`) | `hani↔seoyun` (1쌍) | `side_desk_seoyun` (`88, 175`) | `spatial-contract-v3.json`에서는 42px 옆자리로 완벽하나, `art-map-v3.json`에서는 243.9 art-px로 기존 `errandPlaces` 상한(`200px`)을 넘겨 자동 제외됨. 구현 시 `visitAnchor` 직접 경로 허용 필요. |
| `mir` (`mir_station`) | `hani↔mir`, `ieum↔mir`, `seoyun↔mir` (3쌍) | `side_mir_station` (`703, 540`) | `spatial`(42px)·`art`(71.3px) 모두 유효하나 기존 `hani-office-live.js` `errandPlaces` 필터가 `mir`를 제외하고 있어 대화 방문 대상에는 허용 처리 필요. |
| `yoonseul` (`desk_yoonseul`) | `naeun↔yoonseul`, `hina↔yoonseul`, `daon↔yoonseul`, `serin↔yoonseul` (4쌍) | `side_desk_yoonseul` (`608, 175`) | `approach_desk_yoonseul`이 `art-map-v3.json`에서 좌석과 9.4 art-px(`20.01px` 미만)로 겹치므로 반드시 `side_desk_yoonseul`(spatial 42px, art 101.7px)만 사용해야 함. |

*(※ `hina↔yoonseul`은 `seatTalk: true`이므로 같은 줄 옆자리 앉은 채 대화를 우선 쓰고, 서서 방문할 때만 `side_desk_yoonseul`을 씁니다.)*

---

## 3. 회장님용 쉬운 요약 (3줄)

1. 직원끼리 주고받는 모든 말풍선 대사를 **16자 이하**로 다듬어, 사무실 화면에서 한눈에 읽기 편하게 정리했습니다.
2. 60개 직원 관계 쌍마다 상대 자리 옆에 서는 위치(`visitAnchor`), 다른 층 이동 여부, 앉은 채 말하는 옆자리 5쌍을 실제 건물 지도에 맞춰 연결했습니다.
3. 아침·점심·오후·저녁·야근 시간대별 분위기와 12개 하루 이어짐 이야기의 대사 세트를 모두 이어 두어 바로 화면에 넣을 수 있습니다.
