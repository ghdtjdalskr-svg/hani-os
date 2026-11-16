# 라운지 프로모션/광고 배너 개선 보고서

- 대상 UI: `#board .board-promo` (`"HANI 사내 소식"` / `"가상 광고"` 배너)
- 작업 방식: 기존 `assets/` 내 실존 이미지만 재매칭 (신규 이미지 0장, 광고 문구 원문 유지, 테스트 파일 미수정, 저장 쓰기·버전 변경 없음)
- 주의: 본 세션은 셸 실행이 제한되어 파일 읽기/쓰기 정적 검증만 수행했으며, 브라우저 실측·Node 테스트 실행은 미검증 상태입니다.

---

## 1. 탐색한 기존 `assets/` 이미지 목록

| 분류 | 확인된 실제 경로 (`assets/...`) | 구도·비율·내용 | 채택 여부 |
|---|---|---|---|
| 퀸 전속 | `assets/queen/2026-10.webp` | ~4:1 파노라마 · 가을 카페 앞 10월의 퀸(서윤), 좌측 여백 | 채택 (`queen-winner`) |
| 프로필 (1:1) | `assets/profiles/hani-profile-{hani,seoyun,mir,jieun,haru,minji,yuna,naeun,hina,sua,sooyeon,gaeun,dohyun,yuri,arin,daon,yoonseul}.webp` | 1:1 정사각 인물 초상 + 이름표 | 채택 (`employee`, `카페 멤버십`, `미르 야식 안내`, `queen-winner` 12월+) |
| 프로필 (동물) | `assets/profiles/thumb/hani-profile-{cheese,cream,mochi,bori}-256.webp` | 256×256 마스코트 썸네일 | 미채택 (인물 중심 배너) |
| 히어로 (3:1 와이드) | `assets/heroes/ilbo-226w.webp` | 3:1 와이드 · 민지 + 청개구리 회장님 HANI 일보 열람(우측 배치) | 채택 (`ilbo`) |
| 히어로 (3:1 와이드) | `assets/heroes/newsroom-226w.webp` | 3:1 와이드 · 하니 + 민지 뉴스룸·지표 차트(우측 배치) | 채택 (`market`) |
| 히어로 (3:1 와이드) | `assets/heroes/deployment-218.webp` | 3:1 와이드 · 서윤 중심 배포 팀 + 모니터 로켓(🚀) 파이프라인 | 채택 (`🚀 서윤의 배포 특가`) |
| 히어로 (3:1 와이드) | `assets/heroes/investment-226w.webp` | 3:1 와이드 · 하니 + 지은 + 수아 투자 차트 노트북(우측 배치) | 채택 (`📈 하니 투자 리포트`) |
| 히어로 (1:1) | `assets/heroes/movie-218.webp` | 1:1 · 극장에서 팝콘 들고 화면 가리키는 수연 + 민지 | 채택 (`🎭 주간 연속극`) |
| 히어로 (1:1 기타) | `assets/heroes/{investment-218,newsroom-218,study-218,diet-218,exercise-218,ledger-218,reading-218}.webp` | 1:1 도메인 일러스트 | 대안/보류 (와이드 버전 우선 사용) |
| 배너 프리뷰 (3:1) | `assets/banner-preview-v1/company-board-community-v1.webp` | 3:1 와이드 · 하니 + 유나 + 서윤 라운지/게시판 소통(우측 배치) | 채택 (`best`) |
| 배너 프리뷰 (3:1) | `assets/banner-preview-v1/investment-market-room-v1.webp` | 3:1 와이드 · 지은 + 하니 시세판 분석 | 대안 (`investment-226w.webp` 채택) |
| 팀/조직 | `assets/team/hani-team-office-active-v2.jpg` | ~3:1 와이드 · 전 직원 협업·화이트보드 씬(좌측 창가 여백) | 채택 (`queen-vote`) |
| 팀/조직 | `assets/team/hani-team-office.webp` | 기존 9인 단체 사진 | fallback 전용으로만 유지 (`bannerPortrait` 미로드 시) |
| 팀/조직 | `assets/team/hani-team-picnic.webp`, `hani-org-{platform,business,finance,life,strategy}-v1.webp` | 16:9 / 3:2 부서·피크닉 씬 | 미채택 (단독/전용 3:1 우선) |
| 사옥 층별 | `assets/building/floor-5f-217.webp` | 16:9 · 노을 빛 5층 루프탑 옥상 정원 (`오늘의 노을 맛집`) | 채택 (`🛗 5층 루프탑 오픈`) |
| 사옥 층별 | `assets/building/floor-{1f,2f,3f-215,4f,5f-night-243}.webp` | 사옥 층별 아이소메트릭 | 미채택 (3층 서버실·1층 카페 코너 등) |
| 시즌/치비/기타 | `assets/office-season/barista-night.webp`, `assets/launch/chibi-launch-v1-day.webp`, `assets/street-journal/chibi-sheet-v{1,2,3}.webp`, `assets/desk-mascots/mir.webp`, `assets/character-archive/seoyun-m9-special-cut.webp`, `assets/newsroom-4cut/002.webp`, `assets/office-companions/{companions,kids}-v1.webp` | 스프라이트 시트 / 4컷 세로만화 / 72px 소형 아이콘 | 미채택 (`<img>` 단일 `src` 및 테스트 `fs.existsSync` 제약) |

---

## 2. 슬라이드 ↔ 이미지 · 포인트 컬러 매칭 표

| 슬라이드 (`kind` / `title`) | 변경 전 이미지 | 변경 후 이미지 | 레이아웃 (`queenImage`) | 포인트 컬러 (`tone` / `--promo-accent`) |
|---|---|---|---|---|
| `queen-winner` (`👑 10월의 퀸` 등) | `./assets/queen/2026-10.webp` (12월+: 초상) | 동일 (`2026-10.webp` / `bannerPortrait(winner.id)`) | `solo` / `portrait` | 계절별 (`autumn` `#f4b876` 등) + 옅은 좌측 스크림 |
| `queen-vote` (`👑 N월의 퀸 투표 중`) | `./assets/team/hani-team-office.webp` | `./assets/team/hani-team-office-active-v2.jpg` | `""` (우측 66% 크롭) | `queen-vote` (`#f2b3d1`) |
| `employee` (`이달의 직원`) | `bannerPortrait(employee.id)` (`width:100%` 잘림) | `bannerPortrait(employee.id)` | `portrait` (우측 44% `contain`) | 직원별 ID 매핑 (`hani` `#c7a6ff` 등 19종) |
| `ilbo` (`신문은 역시 HANI 일보!`) | `./assets/heroes/newsroom-218.webp` | `./assets/heroes/ilbo-226w.webp` | `""` (우측 66%) | `ilbo` (`#ffac9c`) |
| `best` (`이번 주 라운지 베스트`) | `./assets/team/hani-team-office.webp` | `./assets/banner-preview-v1/company-board-community-v1.webp` | `""` (우측 66%) | `best` (`#c5afff`) |
| `market` (`이번 주 시장 4컷`) | `./assets/heroes/newsroom-218.webp` | `./assets/heroes/newsroom-226w.webp` | `""` (우측 66%) | `market` (`#8ec6ff`) |
| 광고 0: `☕ 하니 카페 멤버십` | `./assets/team/hani-team-office.webp` | `./assets/profiles/hani-profile-hani.webp` | `portrait` | `hani` (`#c7a6ff`) |
| 광고 1: `🛗 5층 루프탑 오픈` | `./assets/team/hani-team-office.webp` | `./assets/building/floor-5f-217.webp` | `""` (`75% 18%` 노을 집중) | `rooftop` (`#ffb478`) |
| 광고 2: `🚀 서윤의 배포 특가` | `./assets/team/hani-team-office.webp` | `./assets/heroes/deployment-218.webp` | `""` (`60% 20%`) | `seoyun` (`#93baff`) |
| 광고 3: `🍜 미르 야식 안내` | `./assets/team/hani-team-office.webp` | `./assets/profiles/hani-profile-mir.webp` | `portrait` | `mir` (`#7de2f0`) |
| 광고 4: `📈 하니 투자 리포트` | `./assets/heroes/investment-218.webp` | `./assets/heroes/investment-226w.webp` | `""` (우측 66%) | `jieun` (`#f2be7e`) |
| 광고 5: `🎭 주간 연속극` | `./assets/team/hani-team-office.webp` | `./assets/heroes/movie-218.webp` | `portrait` (1:1 팝콘 씬) | `sooyeon` (`#7ed6ca`) |

---

## 3. 광고 문구 변경 후보 (코드 미반영 · 보고서 전용)

기존 광고 문구는 요청대로 모두 유지했습니다. 추후 문구를 다듬을 경우 아래 후보를 검토할 수 있습니다.

| 광고 제목 | 현재 문구 | 매칭 이미지와의 괴리 포인트 | 변경 후보 |
|---|---|---|---|
| `☕ 하니 카페 멤버십` | 회장님 방문 시 아메리카노 사이즈업. 도장은 마음으로 찍어 드려요. | `hani-profile-hani.webp`가 카페·컵 소품 없는 정장 초상 (`barista-night.webp`는 3프레임 시트라 미사용) | `"하니 비서실 1층 카페 특전 · 아메리카노 사이즈업 대기 중"` 또는 향후 바리스타 단독 컷 추가 시 원안 유지 |
| `🛗 5층 루프탑 오픈` | 오늘의 노을 맛집은 5층입니다. 예약은 없고 눈치만 있습니다. | 이미지(`floor-5f-217.webp`)와 일치하나 제목 이모지(`🛗`)는 엘리베이터 | 제목 이모지 후보 `"🌇 5층 루프탑 오픈"` |
| `🚀 서윤의 배포 특가` | 오늘 배포하면 내일이 편해요. 환불은 롤백으로만 가능합니다. | `deployment-218.webp`·`#dev`와 매우 잘 맞음 | 유지 권장 |
| `🍜 미르 야식 안내` | 3층 야근단 모집 중. 라면 물 조절은 관찰 데이터로 보장합니다. | `hani-profile-mir.webp`에 라면·야식 소품이 없음 | `"3층 야근단 관찰 중. 야식·휴식 타이밍은 데이터로 챙겨 드려요."` |
| `📈 하니 투자 리포트` | 감으로 사지 말고 리포트 보고 사세요 ㅋㅋ | `investment-226w.webp`·`#investmentCommittee`와 잘 맞음 | 유지 권장 |
| `🎭 주간 연속극` | 평일마다 새 이야기. 회장님 몰래 보는 건 금지입니다. | `movie-218.webp`(팝콘·영화관)와 분위기 부합하나 링크가 `#agentReview` | `"평일마다 새 에피소드. 팝콘 챙겨 오시면 함께 상영해요."` (추후 `#office` 링크 검토 가능) |

---

## 4. 레이아웃 · 모바일(390px) · 다크 피니시 · 제어 보존

- **좌측 텍스트 / 우측 인물·장면 + 좌측 전용 옅은 스크림**:
  - `>a:after`를 전체 어둠(`rgba(0,0,0,.86) -> .72`)에서 좌측 텍스트 영역 한정 그라데이션(`0% -> 46% -> 68% -> 86% transparent`)으로 변경해 우측 일러스트·인물 얼굴이 어둡게 가려지거나 잘리지 않도록 조정.
  - 좌측 수직 포인트 바(`>a:before` 4px), 키커 텍스트(`[data-board-banner-kicker]`), `가상 광고` 칩 테두리, 활성 도트에 슬라이드별 `--promo-accent` 1종을 적용.
- **390px 폰 대응 (`@media(max-width:480px)`)**:
  - 배너 높이 `168px`, 하단 버튼 `44px` 터치 영역 유지.
  - 텍스트 열은 좌측 `width:62%`(제목 17px 최대 2줄, 카피 11.5px 최대 2줄), 이미지는 우측 `44%~46%`(`portrait` `contain`, 장면 `cover` 좌측 마스크 페이드)에 작게 배치해 텍스트와 얼굴이 겹치지 않도록 분리.
- **다크 피니시 (`midnight-black`, `titanium-graphite`)**:
  - `--border-subtle`/`--border-strong`과 `--promo-accent`를 혼합한 테두리 및 어두운 컨트롤 바 배경(`rgba(8,11,18,.48)`)을 명시해 배경 대비 경계가 또렷하게 유지되도록 보완.
- **기존 동작 보존**: `6000ms` 자동 전환(`syncBanner`), `Ⅱ`/`▶` 일시정지 토글, 도트 탐색, `prefers-reduced-motion: reduce`, 키보드/포커스 정지 로직 무변경.

---

## 5. 수정한 파일 (데이터 / 런타임 분리)

- **데이터(Data) 변경 파일**: **없음**
  - 라운지 광고·슬라이드 목록은 `data/*.json`이나 `hani-board-library.js`가 아닌 런타임 스크립트(`hani-board.js`)에 정의되어 있음. (`data/*.json`, `assets/data/*.json`, `hani-board-library.js` 무수정)
- **런타임(Runtime) 변경 파일**:
  1. `hani-board.js` (`1431~1485`줄 부근: `queenSlides`, `loungeAds`, `dailyLoungeAds`, `loungeBannerItems`, `paintLoungeBanner` — 슬라이드별 `image`, `queenImage`, `tone` 속성 반영; `slot.setAttribute?.(...)` 가드 적용)
  2. `hani-board.css` (`1~67`줄: 배너 톤별 `--promo-accent`/`--promo-bg`/`--promo-scrim`, 좌측 전용 스크림, 우측 인물·장면 프레이밍, 다크 피니시, `480px` 모바일 레이아웃)

---

## 6. 기존 테스트 영향 및 깨질 수 있는 항목 (테스트 파일 미수정)

셸 실행 불가 환경이므로 코드·테스트 정규식 기반 정적 대조 결과를 기록합니다.

1. **`scripts/hani-lounge-billboard.test.mjs`**:
   - **`solo artwork is traced in runtime closure...` (134~152줄)**:
     - `closure` 점검(`resolveRuntimeClosure` in `scripts/hani-runtime-closure.mjs`): `hani-board.js`의 일반 문자열 리터럴은 정적 closure 수집 대상이 아니며 `index.html`·`assets/queen/2026-10.webp`는 그대로 유지되므로 closure 검사는 **통과 예상**.
     - `fs.existsSync(row.image)` 루프(139~140줄): 매칭한 모든 이미지 경로의 실재 여부를 `read_file`로 확인했으므로 **통과 예상**.
     - CSS 정규식(`height:200px`, `height:168px`, `width:44px;height:44px`, `!data-board-banner-next`): 모두 유지되어 **통과 예상**.
     - 주의: 150~151줄은 고정 수식(`1 - .72`) 대비 계산이므로 통과하지만, 전폭 `.72` 검은 스크림을 전제하던 시각 의도와 달리 우측 일러스트 영역은 스크림을 `transparent`로 걷어냈음.
   - **`October uses solo art...` (372~393줄)**:
     - `fit('solo') === 'contain'`, `fit('portrait') === 'contain'`, `fit('') === 'cover'` 및 `data-board-queen-image="portrait"] img{left:56%;width:44%` 패턴을 모두 유지해 **깨지지 않도록 맞춤** (실행 미검증).
   - **VM fixture (`slot` 목업, 22줄)**: `slot.setAttribute`가 없으나 `hani-board.js:1481`에서 `slot.setAttribute?.(...)`를 사용해 예외 방지.
2. **`scripts/hani-qa-easy-cleanup.test.mjs` (`QA-7`, 51~78줄)**:
   - `kicker`, `title`, `copy`, `href`, `fs.existsSync(image.attrs.src)`, 쓰기 금지 패턴(`save|commit|persist|setItem|removeItem|insert|upsert`) 검사 모두 만족 (**통과 예상**, 실행 미검증).
3. **릴리즈/해시 가드 계열 (참고)**:
   - **`scripts/hani-brand-heroes-218.test.mjs`**: `index.html`, `hani-design-system.css` 등은 건드리지 않았으므로 해시/바이트 비교는 영향 없음.
   - **배포 열차 / One-Pass 버전 검사**: `AGENTS.md` §11 규칙에 따라 표시 버전(`?v=`, `HANI_DISPLAY_VERSION`)을 올리지 않았으므로, 배포 전 열차 후보 생성 전까지는 버전 증가 게이트가 실패(대기 상태)로 표시됨이 정상입니다.
4. **미실행/미검증 항목**:
   - `node --test scripts/hani-lounge-billboard.test.mjs scripts/hani-qa-easy-cleanup.test.mjs` 실제 실행 결과
   - 실제 브라우저(데스크톱 1280px 및 모바일 390px, `midnight-black` / `titanium-graphite` / 라이트 피니시) 렌더링 및 대비 실측 스크린샷
