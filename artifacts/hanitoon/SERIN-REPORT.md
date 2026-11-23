# 하니툰(HaniToons) 구현 보고 — 세린

## 만든 것
- [hani-toons.js](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/hanitoon/hani-toons.js)
  - `hani-ilbo.js` 패턴(IIFE, `'use strict'`, `esc()` 이스케이프, 무저장)을 따른 `window.HaniToons = Object.freeze({ enter, latestDate })` 구현.
  - `enter()` 최초 1회 `fetch('./assets/data/hani-toons-v1.json')` 호출(주소 리터럴 직접 사용), 성공 시 메모리 캐시 재사용, 실패·형식 오류 시 `"웹툰을 불러오지 못했어요"` 안내 표시.
  - 항목 검증: `id` (`/^[a-z0-9-]{1,40}$/`), `parts`·`thumb` (`assets/toons/` 시작 및 `.webp` 끝, `..`/쿼리/프로토콜 차단) 불합격 항목 제거, `episode`·`date`의 `null` 허용.
  - 목록 화면: 제목/부제(`총 N화`) 및 태그라인(`📚 오늘도 회사는 시끌벅적`), 목록 순서 기반 `[전체] + 시리즈` 필터 칩, 64px lazy 썸네일·제목·시리즈/회차·날짜·최근 7일 `NEW` 배지가 포함된 버튼형 행(`aria-label` 및 Enter/Space 키보드 동작 지원).
  - 보기 화면: `‹ 목록` 버튼, 시리즈·회차·제목, `parts` 세로 연속 배치(최대 800px 가운데, 간격 0, `width`/`height` 속성 지정 + `loading="lazy" decoding="async"`), 현재 필터 기준 `‹ 이전 화 / 목록 / 다음 화 ›` 하단 내비게이션(최신순 목록 기준으로 이전 화는 더 오래된 화, 다음 화는 더 최신 화로 연결, 없으면 `disabled`), 펼침·이동 시 맨 위 스크롤.
- [hani-toons.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/hanitoon/hani-toons.css)
  - 모든 클래스를 `toon-` 접두어로 작성하고 `#hanitoon` 하위로 스코프 제한.
  - `hani-design-system.css` 토큰(`--surface-panel`, `--surface-raised`, `--text-primary`, `--text-secondary`, `--border-subtle`, `--structure-accent`, `--structure-on-accent` 등)과 fallback을 사용해 밝은/어두운 테마(Finish) 모두 대응.
  - 360px 모바일 폭에서 가로 스크롤 없이 동작하도록 `min-width: 0`, 말줄임(`text-overflow: ellipsis`), 3단 하단 버튼 그리드 적용.

## 확인한 것
- 새 파일 `hani-toons.js`, `hani-toons.css`만 생성했고 기존 파일(`index.html`, `hani-main.js` 등)은 수정하지 않았음.
- `hani-ilbo.js`, `hani-design-system.css`, `hani-style-01.css`, `hani-board.css`를 직접 읽어 기존 토큰 체계(`--surface-*`, `--text-*`, `--structure-*`)와 모바일 터치 크기 규칙(`min-height: 40px`)과의 정합성을 코드 수준에서 대조 확인함.
- `localStorage`·외부 URL·미이스케이프 `innerHTML` 삽입이 없음을 코드 점검으로 확인함.

## 남은 걱정
- 현재 작업 환경에 셸/브라우저 실행 도구가 없어 실제 JSON 연동, 문법 체크, 360px 실화면 및 다크 테마(Midnight Black / Titanium Graphite) 렌더링 확인은 수행하지 못함.
- `parts`가 2장 이상이고 `height`가 전체 합산 높이를 뜻할 경우를 가정해 `Math.round(height / parts.length)`로 로딩 전 자리를 잡도록 했음(로딩 후에는 CSS `height: auto`로 원본 비율 유지). 만약 `hani-toons-v1.json`의 `height`가 1장 기준 높이로 내려온다면 초기 placeholder 높이가 실제보다 짧을 수 있으므로 도연 선임님 데이터 스펙과 한 번만 맞추면 좋겠음.
- `‹ 이전 화` / `다음 화 ›`는 최신순 목록(`items[0]`이 최신) 기준으로 `이전 화 = 다음 인덱스(과거 화)`, `다음 화 = 이전 인덱스(최신 화)`로 연결했으므로, 연재 순서 기준이 맞는지 서윤·회장님 확인 필요.
