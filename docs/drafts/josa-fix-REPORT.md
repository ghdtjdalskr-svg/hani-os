# 사무실 말풍선 한국어 조사 수정 보고

- 작성자: 세린 연구원 (Gemini)
- 대상 파일: `hani-office-live.js`
- 비고: 셸·Git 미사용 환경으로 코드 수정 및 보고서 작성만 수행했으며, 구문/동작 테스트 및 커밋은 서윤 팀장님 인계 대기 상태입니다.

## 1. 추가한 공용 함수

첫 번째 IIFE 안의 이름·텍스트 유틸(`bubble`, `hash`) 바로 아래(`hani-office-live.js` 571~576행)에 `withJosa(word, pair)`를 추가했습니다. 두 번째 IIFE(DOM 쪽)에서는 조사를 붙이는 곳이 없어 `HaniBuildingScene` 외부 노출이나 새 전역 변수는 추가하지 않았습니다.

```js
  function withJosa(word,pair){
    const text=String(word??'');if(!text)return '';
    const code=text.charCodeAt(text.length-1);
    if(code>=0xAC00&&code<=0xD7A3)return text+pair[(code-0xAC00)%28!==0?0:1];
    return text+pair[1];
  }
```

- 마지막 글자가 한글 음절(`0xAC00`~`0xD7A3`)이면 `(code - 0xAC00) % 28 !== 0`으로 받침 유무를 판별해 받침이 있으면 `pair[0]`(`'이랑'`/`'과'`), 없으면 `pair[1]`(`'랑'`/`'와'`)을 붙입니다.
- 마지막 글자가 한글 음절이 아닌 경우(영문 `MIR`·`MUSE`, 숫자 등)에는 `pair[1]`(`'랑'`/`'와'`)을 붙입니다.

## 2. 바꾼 곳 목록

대사 데이터(JSON 및 `staffChatLines` 등 정적 대사 테이블)와 동작·위치·시간 계산은 건드리지 않고, 코드에서 이름/이름 목록 뒤에 조사를 이어 붙이는 5개 지점(총 6곳)만 `withJosa`로 교체했습니다.

| 수정 후 줄 번호 (수정 전) | 바꾸기 전 | 바꾼 후 |
|---|---|---|
| 1035행 (1029행) | `at:[p.name+'에게 잠깐 물어보는 중',p.name+'랑 화면 같이 보는 중']` | `at:[p.name+'에게 잠깐 물어보는 중',withJosa(p.name,['이랑','랑'])+' 화면 같이 보는 중']` |
| 2637행 (2631행) | `(partners?partners+'와 ':'')` | `(partners?withJosa(partners,['과','와'])+' ':'')` |
| 2647행 (2641행, ①) | `location+'에서 '+partners+'와 나눈 이야기 정리 중'` | `location+'에서 '+withJosa(partners,['과','와'])+' 나눈 이야기 정리 중'` |
| 2647행 (2641행, ②) | `partners+'와 '+location+'에서 '+(event.companion?.topic\|\|'잠깐 수다')+' 중'` | `withJosa(partners,['과','와'])+' '+location+'에서 '+(event.companion?.topic\|\|'잠깐 수다')+' 중'` |
| 2711행 (2705행) | `peers.map(q=>personById.get(q.id).name).join('·')+'이랑 '+phrase` | `withJosa(peers.map(q=>personById.get(q.id).name).join('·'),['이랑','랑'])+' '+phrase` |
| 2719행 (2713행) | `ids.map(id=>personById.get(id).name).join('·')+'와 '+p.stayLine` | `withJosa(ids.map(id=>personById.get(id).name).join('·'),['과','와'])+' '+p.stayLine` |

## 3. 예시 5개 결과

| 입력 | 마지막 글자 및 코드 판정 | 결과 |
|---|---|---|
| `"유리"` | `'리'` (`0xB9AC`, `(0xB9AC - 0xAC00) % 28 === 0`, 받침 없음) | `"유리랑"` (`['이랑','랑']`) |
| `"도연"` | `'연'` (`0xC5F0`, `(0xC5F0 - 0xAC00) % 28 === 4 !== 0`, 받침 있음) | `"도연이랑"` (`['이랑','랑']`) |
| `"지은"` | `'은'` (`0xC740`, `(0xC740 - 0xAC00) % 28 === 4 !== 0`, 받침 있음) | `"지은과"` (`['과','와']`) |
| `"세린"` | `'린'` (`0xB9B0`, `(0xB9B0 - 0xAC00) % 28 === 4 !== 0`, 받침 있음) | `"세린과"` (`['과','와']`) |
| `"MIR · 미르"` | `'르'` (`0xB974`, `(0xB974 - 0xAC00) % 28 === 0`, 받침 없음) | `"MIR · 미르랑"` (`['이랑','랑']`) / `"MIR · 미르와"` (`['과','와']`) |

*(참고: 실제 `persons` 데이터의 `"미르/MIR"`, `"가은/MUSE"`처럼 마지막 글자가 영문인 경우에도 영문/숫자 규칙에 따라 `"미르/MIR랑"`·`"미르/MIR와"`, `"가은/MUSE랑"`·`"가은/MUSE와"`로 출력됩니다.)*

## 4. 검증 현황

- **미검증**: 셸 및 테스트 도구가 비활성화된 작업 환경이므로 JavaScript 문법 검사(`node --check`), 사무실 단위/UI 스모크 테스트, 실제 브라우저 화면 확인은 수행하지 못했습니다.
- **다음 단계**: 서윤 팀장님이 변경 diff, 구문/회귀 테스트, 커밋을 진행해 주시면 됩니다.
