# Living Office 말풍선 카드 v2 리디자인 보고서

- 작성일: 2026-11-29
- 작업 대상: `hani-office-live.js`, `hani-office-live.css` (테스트 파일·공통/저장소 파일 미수정)
- 참고 목업: `artifacts/mock-ui/bubble-card.html`, `artifacts/mock-ui/bubble-card.png`

---

## 1. 변경 내역과 정확한 줄 위치

### 1) `hani-office-live.js` (LF 줄바꿈 유지, 총 5,635줄)

- **영구 헤더/본문 슬롯 및 헬퍼 추가 ([hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/hani-office-live.js#L4736-L4793))**
  - `BUBBLE_AVATAR_IDS`: `assets/profiles/thumb/hani-profile-<id>-128.webp` 실존 여부를 확인한 직원 21명 ID 상수 배열(`hani`, `yuna`, `mir`, `seoyun`, `dohyun`, `serin`, `yuri`, `arin`, `gaeun`, `jieun`, `haru`, `naeun`, `hina`, `minji`, `sooyeon`, `sua`, `taeo`, `hyejin`, `ieum`, `daon`, `yoonseul`) 정의.
  - `actorBubble` 생성 시 한 번만 `div.hani-office-bubble-head` (`span.hani-office-bubble-avatar`, `b.hani-office-bubble-name`, `small.hani-office-bubble-role`, `span.hani-office-bubble-place`)를 `bubbleLine` 앞에 삽입하고, `bubbleLine` 안에 `span.hani-office-bubble-say`와 `small.hani-office-bubble-quote`를 영구 슬롯으로 생성함.
  - `profileLink.textContent`를 `'프로필 보기'`로 변경함.
  - `setBubbleText(text)`:
    - 항상 `bubbleLine.dataset.full = full` 저장.
    - `' · '`로 분할해 조각 수에 따라 `>= 3`이면 앞=`bubbleName`, 중간=`bubbleSay`, 끝=`"..."` 감싼 인용=`bubbleQuote`; `=== 2`이면 앞=`bubbleName`, 뒤=`bubbleSay`(`bubbleQuote.hidden = true`); `=== 1`이면 `bubbleName.hidden = true`, 전체=`bubbleSay`(`bubbleQuote.hidden = true`)로 `.textContent`와 `.hidden`만 갱신.
  - `bubblePlaceEmoji(...)` / `syncBubbleMeta(id)`:
    - `BUBBLE_AVATAR_IDS`에 포함된 ID만 `url("assets/profiles/thumb/hani-profile-<id>-128.webp")` 적용(기존 `style.backgroundImage`와 같으면 재대입 생략), 방문객·반려동물·NPC·회장님(`seongmin`) 등은 `hidden`.
    - `window.HaniOrganizationRoster?.people`의 `rank` 필드로 직책 표시(없으면 `hidden`).
    - `floorSnapshot`에서 해당 인물 `state === 'AT_PLACE'`일 때만 장소 카드명과 이모지(`☕`, `🌿`, `🛋️`, `🪟`, `🏃`, `🍿`, `📚`)를 표시하고, 자리 복귀/재석(`AT_HOME` 등) 시 숨김.
    - `syncBubbleHead()`로 헤더 내 모든 요소가 숨겨진 경우 `bubbleHead` 자체도 `hidden` 처리.
- **기존 `bubbleLine.textContent =` 직접 대입 9곳 전량 `setBubbleText(...)`로 교체 + `syncBubbleMeta(...)` 연동**
  1. [showBubble](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/hani-office-live.js#L4892) (`setBubbleText(bubbleText(actor));syncBubbleMeta(bubblePerson);`)
  2. [openBubble 비동기 로드 완료](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/hani-office-live.js#L4928) (`setBubbleText(bubbleText(actor));syncBubbleMeta(bubblePerson);fitBubble();`)
  3. [queenFrame.onclick](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/hani-office-live.js#L4994) (`syncBubbleMeta(null);setBubbleText(queenFrame.title);`)
  4. [openBaristaBubble 기본 대사](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/hani-office-live.js#L5018) (`syncBubbleMeta(null);setBubbleText(...)`)
  5. [openBaristaBubble 친밀도 대사](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/hani-office-live.js#L5020) (`if(result?.line)setBubbleText(...)`)
  6. [updateBuilding](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/hani-office-live.js#L5400) (`if(bubblePerson===p.id){setBubbleText(bubbleText(actor));syncBubbleMeta(bubblePerson)}`)
  7. [updateResidents 상주 캐릭터 대사 변경](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/hani-office-live.js#L5488) (`setBubbleText(bubbleText(actor));syncBubbleMeta(bubblePerson)`)
  8. [updateResidents kidsVisits 바리스타 분기](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/hani-office-live.js#L5507) (`syncBubbleMeta(null);setBubbleText(visit.line.name+' · '+visit.line.text);`)
  9. [updateResidents staffChats 바리스타 분기](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/hani-office-live.js#L5519) (`syncBubbleMeta(null);setBubbleText(selection.name+' · '+line.text);`)
- `fitBubble` 위치/클램프 계산식, `localStorage`/Cloud 쓰기, 이벤트 리스너, 타이머, 옵저버 추가 없음.

### 2) `hani-office-live.css` (총 422줄)

- **파일 맨 끝 블록 추가 ([hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/hani-office-live.css#L383-L422))**
  - `/* Bubble card v2 (11/29) */` 아래에 단일 블록으로 추가 (기존 규칙 미삭제).
  - 목업(`.card`, `::after` 꼬리, `.head`, `.ava`, `.who` 계층 그리드 배치, `.place`, `.say`, `.say small`, `.heart` 분홍 알약 `.hani-office-affinity`, `.prof` 보라 알약 `"프로필 보기"`) 스타일 포팅.
  - `[data-zoom="true"]`: 3열 그리드(`max-content minmax(0,1fr) auto`)로 왼쪽 스프라이트(`row 1 / span 3`), 오른쪽 상단 헤더·중단 대사 박스·하단 좌측 호감도·우측 프로필 버튼 배치 유지.
  - `@media(max-width:600px)`: 28px 아바타, 직책(`.hani-office-bubble-role`)·장소(`.hani-office-bubble-place`)·꼬리(`::after`)·줌 스프라이트 숨김, `p` 2줄 클램프, `padding-right: 30px`로 `✕` 닫기 버튼 겹침 방지.
  - 맨 아래 `.hani-office-character-bubble[hidden], .hani-office-character-bubble[data-zoom="true"][hidden], .hani-office-character-bubble [hidden]`로 `[hidden]` 우선 숨김 보장.

---

## 2. `bubbleLine.textContent=` 잔존 0개 확인 방법

- 쉘 명령(`run_command`)이 비활성화된 환경이므로 파일 전체 구조와 편집 전후 줄을 직접 열람해 검증함.
- `hani-office-live.js` 1–4555줄은 모델/스케줄러용 `HaniBuildingScene` IIFE로 `bubbleLine` 변수가 존재하지 않으며, DOM 소유 IIFE(4557–5635줄)에서 확인한 `bubbleLine.textContent=` 대입 9곳(기존 4836, 4872, 4938, 4962, 4964, 5344, 5432, 5451, 5463줄)을 모두 `setBubbleText(...)`로 교체한 뒤 수정 구간(4735–4805, 4888–4935, 4985–5030, 5394–5408, 5480–5530줄)을 재열람하여 직접 대입이 0건임을 확인함.

---

## 3. 영향 받을 수 있는 `scripts/` 테스트 목록 (미수정)

### A. 말풍선 DOM 구조·`p.textContent` 직접 단언이 깨질 가능성이 큰 파일
1. [hani-office-kids-visit.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-kids-visit.test.mjs#L44-L50)
   - `f.bubble.children[0].textContent`를 `<p>`로 가정해 `' · '` 포함 여부와 `'이름 · 대사'` 전체 문자열 일치를 단언함 (`children[0]`이 `bubbleHead`로 바뀜). 60–62줄은 `restoreVisits278Source` 및 `hani-office-live.css` 바이트 일치도 검사함.
2. [hani-office-staff-chat.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-staff-chat.test.mjs#L48-L54)
   - `f.bubble.children[0].textContent`에서 `' · '`와 `'이름 · 대사'` 일치를 단언함. 58–61줄은 `restoreStaffChats278Source` 및 `hani-office-live.css` 바이트 일치 검사.
3. [hani-office-kids-weekday.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-kids-weekday.test.mjs#L138-L140)
   - `bubble.children[0].textContent.includes(arrival.line)` 및 `line` 포함 여부를 단언함 (`children[0]`이 `bubbleHead`로 바뀜). 28–58, 160–164줄은 역변환 SHA-256 핀 검사.
4. [hani-office-companions.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-companions.test.mjs#L59)
   - `bubble.children[0].textContent.includes(want.lines[i])` 단언. 65줄은 `restoreCompanions276Source` SHA-256 핀 검사.
5. [hani-seoyun-m9.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-seoyun-m9.test.mjs#L90-L91)
   - `bubble.children[0].textContent`로 서윤 탭 대사를 수집·검증함. 30–35줄은 `restoreSeoyunM9Source` SHA-256 핀 검사.
6. [hani-office-residents.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-residents.test.mjs#L591)
   - `bubble.querySelector('p').textContent === '크림 · 같이 놀자!!'` 정확 일치를 단언함 (`'크림'`이 `bubbleHead`의 `.hani-office-bubble-name`으로 분리되어 `<p>`에는 `'같이 놀자!!'`만 남음).
7. [hani-office-mascot-label.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-mascot-label.test.mjs#L68)
   - `bubble.querySelector('p').textContent.includes(a.dataset.name)` 단언 (마스코트 이름이 `bubbleHead`로 이동해 `<p>` 내부에 없음). 37–41줄은 `restoreMascotLabelSource` SHA-256 핀 검사.
8. [hani-office-barista.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-barista.test.mjs#L48-L63)
   - 48줄: `x.p.textContent.startsWith('바리스타 이슬 · ... · ')` 단언, 63줄: `x.p.textContent.includes(staff.dataset.name)` 단언 (화자 이름이 `bubbleHead`로 분리됨). 72줄은 `restorePets268Source` SHA-256 핀 검사.

### B. `<p>` 대사 포함 단언은 유지되나 소스 해시/역변환/노드 수 핀에 걸릴 수 있는 파일
- [hani-office-tap-lines.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-tap-lines.test.mjs#L101-L188): `panel.querySelector('p').textContent.includes(...)`와 브라우저 `locator('p').innerText()`는 대사가 `<p>` 안에 남아 통과 예상이나, 117줄의 `restoreAffinity274Source` SHA-256 역변환 검사에 영향을 받음.
- [hani-office-affinity.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-affinity.test.mjs#L75-L96): `<p>` 정규식(`회장님.*편한 동료` 등) 및 기존 CSS 매칭은 유지되나, `projectPreAffinityCapSource` 등 역사적 소스 경계 참조.
- [hani-office-affinity-cap.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-affinity-cap.test.mjs#L131-L145): `<p>` 검증은 유지되나 145줄 `restoreAffinityCapSource` SHA-256 핀 검사 포함.
- [hani-office-floor-bubble.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-floor-bubble.test.mjs#L138-L174): `fitBubble`/`fitStatusLabels` 및 타이머/리스너/스토리지/`getBoundingClientRect` 카운트는 유지되나, `baselineSource` 비교용 `restoreBubblePlace278Source`가 SHA-256 핀에 의존.
- [hani-office-bori-stroll.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-bori-stroll.test.mjs#L104-L110): `panel.textContent.includes('보리')`는 유지되나 110줄 `createElement` 총 호출 수 비교 및 22–35줄 `restoreBoriStrollSource` SHA-256 핀 검사 포함.
- [hani-office-cafe-rest.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/bubblecard/scripts/hani-office-cafe-rest.test.mjs#L44-L48): `placeStatusLabels` SHA-256은 유지되나 `restoreAffinity274Source` 호출 포함.

---

## 4. 미검증 및 불확실 사항

- **런타임·테스트 미실행**: 쉘 명령 사용 제한으로 `node --check hani-office-live.js`, Node 단위 테스트(`scripts/hani-office-*.test.mjs`), 실제 브라우저(PC/모바일 `<=600px`·`390px`, `data-zoom="true"`) 시각 검증을 실행하지 못함.
- **모바일 2줄 클램프 렌더링**: `<p>` 내부가 블록 자식(`span.hani-office-bubble-say` + `small.hani-office-bubble-quote`)으로 구성되어 있어 `<=600px`에서 `-webkit-line-clamp: 2`와 `max-height`가 일부 브라우저에서 2줄로 깔끔히 절단되는지 실측 확인이 필요함.
- **장소 알약 문구 형태**: `syncBubbleMeta`는 `office-places-v3.json`의 `place.name`을 그대로 우선 사용하며(`AT_PLACE`일 때만 표시), 실제 카드 데이터에서 일부 장소 `name`이 `'~로'` 형태이거나 어미 정제가 필요한지는 실화면 확인 후 조정 여부를 결정해야 함.
- **`fitBubble` 폭 상호작용**: PC에서 `fitBubble`이 설정하는 `width: max-content`와 신규 CSS `max-width: min(320px, calc(100% - 8px))` / `[data-zoom="true"]` `min(420px, calc(100% - 8px))` 조합에서 긴 대사 줄바꿈과 꼬리(`::after`) 위치가 바닥 경계 근처에서 잘리지 않는지 브라우저 확인이 필요함.
