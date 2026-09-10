# HANI Design System v1 · v2.9.101

기존 HANI OS의 회사 세계관, 캐릭터 대화, 메뉴별 성격과 계절 테마를 유지하면서 공통 화면 틀을 정돈한다. 데이터를 변경하지 않는 표시 계층이다.

## 변경 소유권

| 대상 | 수정할 위치 | 원칙 |
| --- | --- | --- |
| 글꼴·간격·반경·공통 카드·반응형 | `hani-design-system.css` | 파일의 tokens → shared → domain → responsive 순서를 유지한다. 동일 선택자를 파일 끝에 계속 추가하지 말고 소유 규칙을 수정한다. |
| 기존 페이지 Hero·담당자 통합·보조 지표 | `hani-ui-v02992.js` | 기존 페이지 Skeleton 소유자를 사용한다. 새 Observer, 이벤트 위임, renderer wrapper를 추가하지 않는다. |
| 지수별 장면·담당자·대사 | 같은 파일의 `companions` | 키는 기존 6개 지수 ID. 장면과 프로필은 별개 역할이다. |
| 장면 파일 경로 | `index.html`의 `haniDesignAssets` template | inert 이미지 레지스트리로 배포 closure에 포함한다. 선택된 장면만 실제 이미지로 로드하며 새 경로를 JS 문자열만으로 추가하지 않는다. |
| 공식 프로필 9명 | `hani-main.js`의 `canonicalProfileImages` | 복제 레지스트리를 만들지 않는다. `nauen`/`suyeon`은 기존 호환 별칭만 유지한다. |
| 메인 그래프와 시장 방향 계산 | `hani-main.js`의 `renderLifeMarket` | 기존 원장을 읽는다. 저장 데이터나 입력 로직을 변경하지 않는다. |
| 퀴즈 정답률 | `homeQuizMetrics` | 완료 퀴즈만, 문항 수로 가중. Hero·카드·보조 표시가 같은 계산을 사용한다. |
| 뉴스룸 종목 로고 | `hani-ui-v02983.js` | v76/78/79/80/82의 로고 생성 경로는 canonical 소유자가 있을 때 양보한다. 투자 ETF 로고는 유지한다. |
| 뉴스룸 댓글 버튼·열림 상태 | `hani-ui-v02982.js` | v70/73/76/78/81의 구형 버튼 생성기를 중단한다. 숨겨진 부모 안의 자식은 열린 패널로 판정하지 않는다. |
| 계좌 입력·가계부 Import·유나 메신저 | 기존 입력 소유자 | DOM anchor와 이벤트·저장 경로를 보존한다. |

기존 스타일에는 높은 specificity와 `!important`가 많다. 새 CSS 파일은 이를 받는 단일 호환 경계다. 장기적으로 구형 파일을 제거할 때는 화면별 비교를 거쳐 이 파일의 해당 영역으로 옮긴다. 이번 변경은 전체 Legacy CSS/JS 삭제 작업이 아니며, 모든 과거 Observer가 제거된 것은 아니다.

## 화면 원칙

- SUIT Variable과 Pretendard fallback, 본문 15px 중심. 제목·핵심 수치·설명에 서로 다른 위계를 둔다.
- Dashboard: 짧은 팀 Hero, 기존 랜덤 한마디와 댓글, 동일한 6개 지수 카드, 통합 SRX, 메인 그래프와 캐릭터 보조 패널.
- 지수 선택용 `data-life-index`와 분석 패널 표시용 `data-selected-index`를 분리한다. 분석 패널을 클릭 대상으로 오인하지 않도록 한다.
- Desktop 메인·보조 패널은 같은 높이. 모바일에서는 콘텐츠에 맞춰 쌓아 잘림을 방지한다.
- 월말정산: 하나의 Hero 안에 가로형 하니 한마디. Desktop 두 입력 패널은 동일 높이, 모바일은 독립 높이. 지은·하니 코멘트는 입력 기능 밖의 지속 슬롯이다.
- 일반 Hero가 있는 페이지는 기존 `aiBanner`를 Hero 내부로 이동한다. 페이지를 나가면 기존 상단 위치로 돌린다. 같은 ID의 복제 노드를 만들지 않는다.
- 뉴스룸·유나는 기존 콘텐츠와 동작을 유지하며 공통 타이포와 카드 경계를 보수적으로 적용한다.
- 미기록은 미기록으로 표시한다. 몸무게 보조 정보는 BMI·골격근량·체지방량·체지방률이다.
- 걸음 메인 그래프는 월별 기록된 날 기준 일평균, 학습 메인 그래프는 월별 가중 퀴즈 정답률이다. 기존 월별 활동 건수와 정답률이 섞이던 표시를 정리했다.

## 장면 자산

Built-in imagegen으로 제작했다. 원본 구도와 해상도를 유지하고 WebP quality 90으로 전달 형식만 변환했다. 원본 PNG 합계 약 16.3MB, 배포 WebP 합계 약 2.0MB다.

| 파일 (`assets/design-system-v1/`) | 장면 | 담당자 |
| --- | --- | --- |
| `asset.webp` | 태블릿과 포트폴리오를 함께 검토하는 재무 팀 | 하니 |
| `naeun-running.webp` | 나은과 힘겹게 따라오는 동료들의 러닝 | 나은 |
| `hina-cinema.webp` | 3D 안경과 팝콘, 영화관의 동료들 | 히나 |
| `steps.webp` | 강변 산책과 스마트워치 | 하루 |
| `spending.webp` | 영수증·계산기·가계부를 확인하는 동료들 | 지은 |
| `learning.webp` | 책과 퀴즈 카드로 함께 공부하는 동료들 | 히나 |
| `srx.webp` | 하니·지은·히나의 시장 회의 | 하니 |

신규 5장 공통 생성 지시: polished Korean webtoon illustration for HANI OS, wide 3:1 landscape, adult characters, warm company slice-of-life atmosphere, detailed lineart and softly shaded pastel light. No UI, logos, embedded captions or speech bubbles. Heads remain fully in frame with safe margins. The reference portraits define the complete cast; preserve face, hair and signature accessories, especially Jieun's glasses/low bun and Hina's high bun/pink flower hairpin. Exactly three women; no invented or male characters.

장면별 지시: asset — bright modern investment review with tablet and portfolio diagrams, lavender accents; steps — sunny riverside walking break, raised smartwatch and a playfully tired colleague; spending — household receipts and calculator at a warm cafe desk, peach accents; learning — enthusiastic quiz teaching with a puzzled colleague in a cozy study room; SRX — lively investment meeting with simple red/blue chart strokes, no real financial figures. 영화관·러닝 두 장은 승인된 v3 예시를 사용한다.

## 검증과 배포 경계

`node scripts/hani-design-system-qa.mjs`는 실제 production helper를 분리 실행해 빈 기록, 문항 수 가중, 미완료 제외, null fallback, 명시적 0점, 입력 기록 불변성을 확인한다.

화면 QA는 실제 앱 코드를 사용하는 별도 localhost 검증 서버와 새 브라우저 컨텍스트에서 진행한다. 저장소는 메모리 mock, 외부 데이터 호출은 차단한다. 검증용 fixture나 로그인 우회는 배포 파일에 포함되지 않는다. 개인 원장·Cloud·schema·인증 로직을 수정하지 않는다.

Production 로그인 이후의 개인 데이터 read-back은 실제 로그인 세션이 있어야 별도로 확인할 수 있다. 배포 버전, JS 로딩, 로컬의 실제 renderer 검증과 인증된 운영 데이터 검증을 같은 것으로 표시하지 않는다.

## Release QA · 2026-09-10

Codex가 같은 작업 안에서 수행한 정적·화면 검증이며 별도 에이전트의 독립 검토를 의미하지 않는다.

- 기준선: `origin/main` `9df5dc7691b388c1183597f8e1aa47f7560e7b92`, production 표시 v2.9.100, 마지막 UI JS `hani-asset-update-v1.js?v=2.9.100`. 작업 중 main 변동 없음.
- 표시 버전과 변경 리소스 cache key: v2.9.101.
- 프로젝트 release-preqa: `YURI_PRE_QA_PASS`, 12개 검사 PASS. 저장소·Cloud 쓰기, 보호 key, 이벤트 바인딩 추가/중복, 비밀정보 변경 없음.
- 전체 `hani*.js` Node syntax PASS.
- 1920px 및 390px에서 27개 실제 메뉴 경로 + 6개 지수 선택: 총 66개 검사 PASS. 요청 경로 불일치, JS 예외, 깨진 이미지, 중복 ID, 가로 overflow, 분석 패널 내용 잘림 없음.
- 자산 업데이트 Desktop 패널: 836px / 836px. 모바일은 입력 내용에 따른 독립 높이.
- 6개 지수 카드: Desktop·mobile 모두 248px. Desktop 메인/보조 분석 660px. 신체 보조 값 4개, 독서·시청, 걸음, 가계부, 투자계좌, 학습 fixture로 전환 검증.
- 뉴스룸: 가상 기사 DOM에서 4회 연속 로고 클릭의 열림/닫힘 `true → false → true → false`, 동일 로고 노드 유지, 구형 로고 0개, 닫기 버튼 1개, 원장 state 불변. 두 해상도 PASS.
- 퀴즈 helper: 빈 기록, 문항 가중, 미완료 제외, null fallback, 명시적 0점, 원장 불변 PASS.
- 캐릭터 장면, 팀 얼굴 안전 영역, 월말정산, 일반 콘텐츠, 뉴스룸, 유나 메신저 스크린샷 육안 확인.
- 미검증: 실제 로그인 계정으로 Cloud 연동 및 개인 원장 화면 read-back. 해당 쓰기·인증·schema 코드는 변경하지 않았다.

성민 대표님의 전체 적용·안전한 자체 판단·가능한 자동 배포 지시 범위에서 PR과 배포를 진행한다. 데이터 migration, schema 변경, 운영 원장 삭제는 이 승인 범위로 확대 해석하지 않는다.


## v2.9.102 cinema cast correction
Built-in imagegen precise-object-edit: remove all background audience; retain three foreground women, cinema seats, projector light and 3:1 framing. Saved asset: assets/design-system-v1/hina-cinema-v2.webp. All seven design scenes visually rechecked. Versioned filename prevents reuse of the previous cached image. No event, storage or Cloud changes.

## v2.9.103 — 전체 화면 규격화

### 수정 기준
- 모든 `.view`는 하나의 Hero를 사용한다. `hani-ui-v02992.js`의 `hero()` / `mountSkeletons()`가 생성·갱신을 소유한다. 기존 투자 Hero 생산자는 양보하고 뉴스룸의 중복 배너는 제거한다.
- `hani-design-system.css`의 **Canonical page frame**이 유일한 공통 규격이다. 높이는 desktop 240px / mobile 300px, 제목은 32px / 27px. `--ds-hero-*`, `--ds-title-size`, `--ds-avatar-size`, `--ds-gap`을 변경한다. 개별 페이지에 같은 역할의 CSS override를 덧붙이지 않는다.
- 기존 `#aiBanner`는 복제하지 않고 활성 Hero로 이동한다. 월말정산 방식의 가로 말풍선과 오른쪽 프로필을 중앙에 정렬한다. 오래된 inline 배경 지정은 기존 소유자 v79에서 중단한다.
- 일반 페이지에도 같은 Hero를 적용한다. 유나 메신저는 자신의 본문만 갱신하고 공유 Hero 노드는 보존한다. 유나 인포데스크의 캐릭터는 유나를 사용한다.
- Hero 하단 간격과 탐색 줄을 공통화한다. 뉴스룸 모드·주간 아카이브·새로고침은 한 줄의 탐색 영역에 배치한다.
- 입력/요약 카드의 프로필 워터마크는 표시하지 않는다. JISPI 상단 중복 금액은 제거하고 아래 실제 상세 지표는 보존한다.
- 지은 코멘트는 프로필+읽기용 말풍선으로 표시하며, 기존 수정/저장 이벤트와 원장 저장 경로를 유지한다.
- 시즌 색은 캔버스, Hero, 말풍선 테두리, 카드 테두리, 선택 탭과 포커스에 적용한다. 도메인 색과 상승/하락의 의미색은 유지한다. 계절 전환 저장 경로는 변경하지 않는다.

### 로고 소유권
- 투자 일반 종목 로고: v79. 이전 v76/v78 생산자는 투자 영역을 수정하지 않는다.
- 투자 ETF 로고: v82. 앞선 ETF 생산자는 양보한다. 셀 내부의 로고는 문서 흐름을 따르며 absolute positioning으로 이름을 덮지 않는다.
- 뉴스룸 로고: v83. 정체성이 같은 노드는 유지하고 중복만 제거한다.
- v79/v83의 예약은 최초 갱신 예약을 유지한다. 연속 DOM 변화가 예약을 무한 연기하는 debounce starvation을 방지한다. 새 Observer나 새 전역 이벤트 계층은 추가하지 않았다.

### 공식 캐릭터 검수
- asset: 하니·지은·히나 / spending: 지은·하니·히나 / learning: 히나·지은·하니 / steps: 하루·지은·히나 / SRX: 하니·지은·히나 — 공식 프로필과 대조하여 유지.
- cinema: 히나·하루·민지로 재제작. `assets/design-system-v1/hina-cinema-canonical.webp`.
- running: 나은·하니·지은으로 재제작. `assets/design-system-v1/naeun-running-canonical.webp`.
- Built-in imagegen 사용. 각 장면의 3명 공식 프로필을 참조 이미지로 제공했다. 공통 프롬프트: 정확한 얼굴/헤어/눈/액세서리와 원화 스타일 유지, 지정된 성인 여성 3명만 등장, 추가 인물·실루엣·남성·텍스트 없음, 얼굴이 잘리지 않는 3:1 구도. 영화관은 3D 안경과 팝콘, 러닝은 나은 선두와 힘들어하는 하니·지은. 생성본 육안 검수 후 WebP 포맷 변환만 수행했다.

### 검증 및 범위
- 28개 메뉴 × 4계절 × desktop/mobile = 224개 조합: Hero 1개, 공통 높이, 가로 넘침과 말풍선 경계 확인.
- 기존 66개 메뉴/지수 전환 검사도 실행했다. 최종 수정 후에는 변경된 Hero·로고·코멘트 경로를 별도로 검증했다.
- 주간 아카이브와 관심 기사 fixture로 종합/관심 4회 전환 및 로고 노드 유지 확인. 대표 종목 5개에서 로고 1개와 이름 비겹침 확인, desktop/mobile 모두 통과.
- 검증용 데이터는 별도의 메모리 저장소 preview에서만 사용하며 배포 파일에 fixture/auth 우회를 포함하지 않는다.
- 원장·Cloud·인증·schema 변경 없음. 운영 로그인/Cloud 상태는 배포 후 접근 가능한 범위까지만 확인하고 미검증 사항을 보고한다.

## v2.9.104 — Compact domain Hero / security identity repair

- 공통 Hero 높이를 desktop 190px, 390px mobile 230px로 축소한다. 모바일에서는 eyebrow를 생략하고 설명을 한 줄로 제한해 긴 말풍선도 프레임 안에 유지한다.
- 계절 테마는 전체 캔버스와 일반 컨트롤에 유지하되 Hero는 `ds-tone-*`별 고유 accent/soft 색을 사용한다. 따라서 같은 메뉴의 Hero 색은 계절 전환과 무관하게 유지된다.
- Hero 제목은 사이드바 메뉴명과 지표·보드명을 `메뉴 - 현재 제목`으로 연결한다. 값의 변화가 양수면 red, 음수면 blue를 사용한다.
- 말풍선과 프로필은 Hero 오른쪽 끝에 정렬한다. 배경 장면 위에서 텍스트가 읽히도록 흰색 말풍선과 메뉴 accent 테두리를 유지한다.
- 투자 표의 ETF 셀에는 `.hani-etf-cell-content-v02982` 단일 flex wrapper를 사용한다. 로고와 종목명을 같은 행의 분리된 영역으로 유지하고, 전체 투자 행을 먼저 검사한 뒤 leaf 보정을 실행해 로고 누락을 방지한다.
- 28개 메뉴 × 4계절 × desktop/mobile 224개 조합과 14개 대표 주식·ETF 로고를 desktop/mobile에서 검사한다.
