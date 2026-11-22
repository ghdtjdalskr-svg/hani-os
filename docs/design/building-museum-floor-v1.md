# HANI 그룹 '회사 박물관 · 명예의 전당' 층 설계안 v1 (6F 박물관, 7F 옥상)

- **문서 구분**: 건물 확장 설계·데이터 연계·위험 분석 v1 (코드/데이터/아트/운영 파일 미수정, 설계 전용)
- **작성**: 세린 연구원 (Gemini)
- **보고 대상**: 성민 대표님(회장님) / 하니 전무님(기획) / 서윤(개발 리드) / 도연 선임님(개발·아트) / 유리 책임(QA) / 아린 선임(UI/UX)
- **기준선**: 저장소 `floor5art` / `v2.9.306` 기준 (`one-pass-gate-contract.json`: `max_files: 200`, `required_storage_key: "hani_os_life_v23"`)
- **근거 문서**:
  - [building-master-plan-v2.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-master-plan-v2.md)
  - [building-creative-floor-v1.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-creative-floor-v1.md) (§9~§14 건물 표준 규격)
  - [building-liveops-v1.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-liveops-v1.md)

---

## 0. 회장님용 쉬운 요약 (5줄) & 확정 층 배치

### 0.1 회장님용 쉬운 요약 5줄

1. **6층을 회장님 마일스톤과 회사 역사를 전시하는 조용한 '회사 박물관 · 명예의 전당'으로 만들고, 기존 옥상 테라스는 꼭대기 7층으로 올립니다.**
2. **건강혁명·창립 마일스톤 카드, 역대 이달의 퀸 액자, 이달의 직원, 하니 일보, 시황 4컷, 배포 연표, 치비툰/앨범까지 이미 앱에 있는 기록을 '읽기만' 해서 자동 전시합니다(`hani_os_life_v23` 쓰기 0, 새 저장 0).**
3. **유리 진열대와 액자 슬롯 수를 고정해 두어, 앞으로 회장님이 새 마일스톤 카드를 추가하셔도 박물관 전시가 자동으로 순환·갱신됩니다.**
4. **직원 명단·친밀도·퀸 투표와 완전히 분리된 차분하고 꼼꼼한 여자 학예사(큐레이터) NPC 1명이 상주하며, 평소엔 조용하다가 주말 남매 견학이나 새 마일스톤·퀸 발표·배포 기념일에만 직원들이 조금 더 들릅니다.**
5. **1F~5F 공사가 자리 잡은 4단계 무렵에 6F 박물관(배경 그림 1장, 학예사는 기존 NPC 시트 통합)을 올리면 200개 파일 한도와 성능 기준 안에서 안전하게 추가할 수 있습니다.**

### 0.2 확정 7층 건물 배치 (11/21 회장님 결정 반영)

| 물리 층 (`order`) | 탭 표기 (`code`) | Floor Registry `id` 권장 | 구역 요약 | 상주 인원 |
| --- | --- | --- | --- | --- |
| **7F** (`7`) | `7F 옥상` | `5f` (안 A: `legacyIds: ["5f"]` 유지) 또는 `rooftop` | 루프톱 가든 · 테라스 · BBQ · 조용한 쉼터 | 상주 0 (정원사 NPC · 방문형) |
| **6F** (`6`) | **`6F 박물관`** | **`museum` (신규)** | 입구 안내대 · 마일스톤 갤러리 · 명예의 전당 · 회사 연표 복도 · 아카이브 열람실 | **정규 직원 상주 0 (학예사 NPC 1명 상주)** |
| **5F** (`5`) | `5F 라이프` | `creative` | 방송 스튜디오 · 도서관/시네마 · 피트니스 · 키즈/펫 라운지 | 상주 0 (방문형 · 보조 NPC) |
| **4F** (`4`) | `4F 경영` | `4f` | 성민 회장실 · 비서실 · 하니 전무실 · 임원회의실 · MIR Station | 5명 (성민·하니·가은·이음·미르) |
| **3F** (`3`) | `3F 개발` | `3f` | AI플랫폼개발실 · 서버실 · 스탠드업 룸 · 릴리스룸 | 5명 (서윤·도연·세린·유리·아린) |
| **2F** (`2`) | `2F 업무` | `2f` | 재무자산관리실 · 라이프&엔터 · 기업솔루션(안1 합류) · 팬트리 · 협업실 | 10명 (안 1 기준) |
| **1F** (`1`) | `1F 로비·상업` | `1f` | HANI 24 편의점 · 안내/일보/택배/부스 · 중앙 로비 · HANI Coffee | 1명 (유나 + 점원/보안/바리스타) |

---

## 1. 전시 데이터 원천 & 읽기 전용 보장 (실측 코드 검증표)

6F 박물관은 **새로운 사용자 저장 데이터를 만들지 않고**, 이미 앱에 탑재된 데이터 파일과 읽기 전용 메모리 투영 API만 참조합니다. 특히 회장님 마일스톤(`state.milestones`)을 포함한 모든 `hani_os_life_v23` 데이터는 **오직 읽기만(Read-Only Projection)** 수행하며 `save()`·`persist()`를 절대 호출하지 않습니다.

| 전시 분야 | 실제 코드/데이터 원천 (검증 완료) | 노출 API · 로드 방식 | 실제 확인된 필드 및 자산 | `hani_os_life_v23` 접근 |
| --- | --- | --- | --- | --- |
| **1. 회장님 마일스톤 카드** | [hani-milestones.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-milestones.js) (`L25-147`, `L266-290`, `L433-445`, `L616-617`) | `window.HaniMilestones.merged()` (`SEED` 4건 + `appState()?.milestones` 병합), `sorted()`, `isPending(m)`, `starCount(key)`, `homePick()` | - `SEED` 4종: `milestone_health_20261023`(건강혁명/LEGENDARY), `milestone_project_20260802`(HANI OS 출범/LEGENDARY), `milestone_health_30kg`(EPIC), `milestone_investment_5m`(달성 대기/RARE)<br>- 주요 필드: `id`, `date`, `title`, `category`(`HEALTH` 등 10종), `importance`(`NORMAL`/`MAJOR`/`HISTORIC`), `grade`(`RARE`/`EPIC`/`LEGENDARY`/null), `summary`, `metrics[]`(`label`, `before`, `after`, `change`), `featuredMetrics[]`, `agents[]`, `agentComments[]`, `chairmanComment`, `tags[]`, `relatedTabs[]`, `createdAt`<br>- 카드 아트 시트: `ART.sheet` (`./assets/milestone-cards/milestone-card-sheet-v2.webp`, 4열×3행 512×734 셀, `specials` + `cat-<category>`) | **읽기 전용 (`state.milestones` 메모리 조회만, 쓰기 0)** (`persist()`는 `#milestones` 화면 사용자 저장 버튼 전용) |
| **2. 이달의 퀸 역대 수상** | [hani-board.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-board.js) (`L1811-1908`), [index.html](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/index.html#L15) | `window.HaniBoard.queenWinner(now)`, `window.HaniBoard.queenImages`, 내부 `fixedQueenResults`, `queenTally(source, now)` | - `fixedQueenResults`: `{'2026-10': 'seoyun'}`<br>- `queenImages`: `{'2026-10': './assets/queen/2026-10.webp'}` (미지정 월은 `HaniOrganizationHub.portraitSource(id)` fallback)<br>- `queenWinner()` 반환: `{ month, id, name, rank }`<br>- 투표 데이터: `state.boardPosts` 내 `libraryId: "queen-YYYY-MM"` 게시글(읽기 집계만) | **읽기 전용 (`state.boardPosts` 집계 투영만, 쓰기 0)** |
| **3. 이달의 직원** | [hani-organization-hub.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-organization-hub.js#L68-L82), [hani-board.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-board.js#L1931) | `window.HaniOrganizationHub.overviewData(state, history, roster, now)` | - 반환 필드: `employee` (`{ id, name, rank, team, count }`) — KST 해당 월 `boardPosts` + 공개 `boardComments` 1위(동률 시 `id` 오름차순)<br>- 함께 산출되는 숫자 요약: `stats[]` (생활 기록 건수, 게시판 글 수, 이번 달 배포 횟수, AI 직원 수) | **읽기 전용 (`state` 집계 투영만, 쓰기 0)** |
| **4. 하니 일보 (주간 신문 & 호외)** | [data/hani-ilbo/issues.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/data/hani-ilbo/issues.json), [001.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/data/hani-ilbo/001.json), [extra-m9.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/data/hani-ilbo/extra-m9.json), [hani-ilbo.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-ilbo.js) | `window.HaniIlbo` (`publishedCount`, `parseManifest`, `parseIssue`, `parseExtras`, `compute`) + `fetch('data/hani-ilbo/issues.json')` | - 매니페스트: `issues[]` (`number` 1~5, `date`, `file`), `extras[]` (`id: "seoyun-m9"`, `date`, `file`, `title`)<br>- 호별 필드: `headline`, `headlineBody`, `reporter`, `comic` (`title`, `image`, `captions[]`), `interviewTitle`, `interviewee`, `interviewQuote`, `interview[]`, `news[]`, `praise` | **무저장 / 읽기 전용** (`state` 최근 7일 기록은 일보 뷰 열 때만 투영) |
| **5. 뉴스룸 시황 4컷** | [assets/data/newsroom-4cut/issues.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/assets/data/newsroom-4cut/issues.json), [hani-newsroom-4cut.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-newsroom-4cut.js) | `window.HaniNewsroom4cut` (`published`, `issuePanels`) + `fetch('assets/data/newsroom-4cut/issues.json')` | - `issues[]` (1~3호): `number`, `publishDate`, `week`, `image` (`assets/newsroom-4cut/<image>.webp`), `title`, `alt`, `facts[]` (`label`, `value`, `note`), `cuts[]` (`reporter`, `scene`), `sources[]` | **무저장 (정적 JSON + WebP)** |
| **6. 배포 연표 (HANI GROUP 연혁)** | [assets/data/hani-history-releases-v1.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/assets/data/hani-history-releases-v1.json), [hani-organization-hub.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-organization-hub.js#L86-L135) | `window.HaniReleaseCatalog.load()` + `historyMilestonePriority` | - `schema: 1`, `asOf`, `entries[]`: `id` (`v2.9.120`~`v2.9.306`), `date`, `status` (`released`/`pages`), `title`, `category`, `credits[]`, `source` (`commit`, `subject`)<br>- 주요 연혁 우선 ID: `v2.9.215`, `v2.9.213`, `v2.9.222`, `v2.9.216`, `v2.9.218`, `v2.9.161`, `v2.9.164`, `v2.9.120`, `v2.9.132`, `v2.9.135` | **무저장 (정적 JSON)** |
| **7. 직원 입사·프로필·캐릭터 아카이브** | [hani-organization-hub.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-organization-hub.js#L7-L40), [hani-character-archive-data.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-character-archive-data.js), [hani-character-archive.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-character-archive.js) | `window.HaniOrganizationRoster`, `window.HANI_CHARACTER_ARCHIVE_DATA` | - `Roster`: `chairman`, `teams[]`(5대 팀 색상·심볼), `people[]`(20명: `id`, `name`, `rank`, `team`, `role`, `line`, `keywords`, `group`, `status`)<br>- `Archive`: `characters[]`(M9+미르+다온+윤슬 설정 원문), `dynamics[]`, `gagBadges[]`, `rules[]`<br>- 기념 화보: `assets/character-archive/seoyun-m9-special-cut.webp`, `m9-group-portrait-v1.webp`, `m9-founders-teatime-v1.webp`, `m9-unit-*-v1.webp` | **무저장 (정적 JS/WebP)** |
| **8. 치비툰 · 웹툰 & 생활 투영 자산** | [hani-launch-greeting.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-launch-greeting.js), [hani-ui-v02992.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-ui-v02992.js#L1254), [hani-procrastination-board.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-procrastination-board.js), [index.html](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/index.html#L1805-L1885) | 전역 객체 및 `<template>` 정적 경로 참조 | - 출근 인사 치비: `assets/launch/chibi-launch-v1-day.webp`, `chibi-launch-v1-night.webp`<br>- 디자인/생활 장면: `assets/design-system-v1/srx.webp`, `learning.webp`, `assets/team/hani-team-office.webp`, `hani-team-picnic.webp`, `assets/sports/hani-sports-hero-v1.webp`<br>- 일보 6컷(`assets/hani-ilbo/001-comic.webp`, `extra-m9-comic.webp`)·시황 4컷(`assets/newsroom-4cut/*.webp`)·미룬 일 보드 7종 상태 투영 | **무저장 / 읽기 전용 투영** |

---

## 2. 층 평면 설계 (`1672×941` 기준 5구역 & 엘리베이터 정렬)

### 2.1 엘리베이터·코어 기준 정렬 (서윤 결정 기준 준수)

실제 운영 중인 `art-map-v1.json`의 `2F~5F(옥상)` 원화(`1672×941` 픽셀 기준 `%` 좌표)를 확인한 결과, 중앙 세로 복도(`x ≈ 47%..55%`)와 엘리베이터·계단 코어가 전 층 동일한 위치에 놓여 있습니다:
- **엘리베이터 (`elevator_5f` · `elevator_4f` · `elevator_3f` · `elevator_2f`)**: **`(x: 51%, y: 12%)`** — 가운데 세로 복도 **위쪽 끝**
- **층 합류 홀 (`hall_*`)**: **`(x: 51%, y: 46%~52%)`**
- **계단 (`stairs_*`)**: **`(x: 51%, y: 54%~58%)`**

따라서 6F 박물관도 **5F(현 옥상/2~4F)와 동일하게 가운데 세로 복도(`x ≈ 47%~55%`) 위쪽 끝 `(51%, 12%)`에 엘리베이터를 배치**해, 층 탭을 오갈 때 건물 코어 위치가 좌우로 점프하지 않게 합니다. *(참고: `spatial-contract.json`의 논리 `1000×640` 그래프는 경로 연결 토폴로지 용도로 `elevator_creative(5F) ↔ elevator_museum(6F) ↔ elevator_5f(7F)` 간선만 연결하고, 실제 화면 픽셀 좌표는 `art-map-v1.json` `%` 좌표가 소유합니다.)*

### 2.2 6F 박물관 5구역 평면도 (`1672×941` 원화 기준 도식)

```text
x:   4%                     46%  47%  55%  56%                    96%
y=5% +-------------------------+  +------+  +------------------------+
     |                         |  | ELEV |  |                        |
     | [NW] 마일스톤 갤러리     |  |(51,12)|  | [NE] 회사 연표 복도     |
     |  (milestone_gallery)    |  +------+  |  (company_chronicle)   |
     | - 유리 진열 케이스 6슬롯 |  |      |  | - 배포 연표 타임라인 벽 |
     | - LEGENDARY 중앙 좌대   |  | 중앙 |  | - HANI 일보 합본 스탠드|
     | - 달성 대기 목표 쇼케이스|  | 세로 |  | - 시황 4컷 벽면 프레임 |
y=48%+----------[문]-----------+  | 복도 |  +---------[문]-----------+
     |                         |  |(hall |                           |
     |   [중앙 로비 · 안내대]    |  |51,52)|   ← 이젤(월간 기획전 슬롯)
     |   (museum_lobby)        |  +------+                           |
     | - 학예사 데스크 (51,44)  |  |STAIRS|                           |
y=56%+----------[문]-----------+  |(51,58)| +---------[문]-----------+
     |                         |  +------+  |                        |
     | [SW] 명예의 전당         |  |      |  | [SE] 아카이브 열람실   |
     |  (hall_of_fame)         |  |      |  |  (archive_library)     |
     | - 역대 이달의 퀸 액자 4  |  |      |  | - 원목 열람 테이블 2석 |
     | - 이달의 직원 명예 패    |  |      |  | - 치비툰·화보 원화 선반|
     | - M9/AI 합류 기념 벽면   |  |      |  | - 조용한 관람 벤치 2석 |
y=95%+-------------------------+  +------+  +------------------------+
```

### 2.3 구역(Room) 5개 상세 스펙 및 앵커 배치

| 구역 (`room.id`) | 위치 · HTML 표지판 (`plates`) | 전시물 · 가구 (배경엔 빈 틀만 그림) | 주요 앵커 (`slots` / `pose`) | 동시 수용 상한 |
| --- | --- | --- | --- | --- |
| **1. 입구 로비 · 안내대** (`museum_lobby`) | 중앙 복도 중단·상단<br>`MUSEUM LOBBY / 박물관 안내` | 학예사 안내 데스크, 월간 기획전 이젤 1개, 방명록/도감 열람대, 중앙 엘리베이터 문(`51%, 12%`) | `curator_desk`(standing, 학예사 상주), `museum_easel_view`(standing), `hall_museum`(51, 52), `elevator_museum`(51, 12), `stairs_museum`(51, 58) | 학예사 1 + 관람객 2 |
| **2. 회장님 마일스톤 갤러리** (`milestone_gallery`) | **NW** (`x: 5~45%, y: 12~47%`)<br>`MILESTONES / 마일스톤 갤러리` | 유리 진열 케이스/액자 틀 6개(벽면 4 + 중앙 좌대 2), 은은한 스포트라이트 원형 조명 | `ms_view_main`(standing), `ms_view_east`(standing), `ms_bench_nw`(sitting) | 3명 |
| **3. 명예의 전당** (`hall_of_fame`) | **SW** (`x: 5~45%, y: 56~92%`)<br>`HALL OF FAME / 명예의 전당` | 역대 이달의 퀸 액자 틀 4개, 이달의 직원 황동 명패 1개, M9/특별합류 기념 벽면 프레임 1개 | `hof_queen_view`(standing), `hof_mvp_view`(standing), `hof_bench_sw`(sitting) | 3명 |
| **4. 회사 연표 복도** (`company_chronicle`) | **NE** (`x: 56~95%, y: 12~47%`)<br>`CHRONICLE / 회사 연표 복도` | 벽면 타임라인 레일(연혁), 일보 신문 거치대 2단, 시황 4컷 액자 틀 3개 | `chronicle_timeline`(standing), `chronicle_ilbo`(standing), `chronicle_4cut`(standing) | 3명 |
| **5. 아카이브 열람실** (`archive_library`) | **SE** (`x: 56~95%, y: 56~92%`)<br>`ARCHIVE ROOM / 아카이브 열람실` | 원목 열람 테이블 + 의자 2석, 치비툰·화보 원화 책장, 2인 관람 소파/벤치 | `archive_table_a`(sitting), `archive_table_b`(sitting), `archive_shelf`(standing), `archive_sofa_a`(sitting) | 3명 |

### 2.4 Floor Registry 데이터 예시 (`floor-registry-v1` + `Room` 표준 준수)

[building-creative-floor-v1.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-creative-floor-v1.md#L327-L380) §9.1·§10.1 표준 스키마에 맞춘 `6F 박물관` 등록 예시입니다.

```jsonc
{
  "id": "museum",
  "legacyIds": [],
  "order": 6,
  "code": "6F",
  "tabTitle": "박물관·전당",
  "fullTitle": "6F 박물관 · 명예의 전당",
  "category": "museum",
  "quiet": true,
  "outdoor": false,
  "defaultResidents": [],
  "maxCapacity": 5,
  "art": {
    "width": 1672,
    "height": 941,
    "background": "./assets/building/floor-museum-v1.webp",
    "nightBackground": null,
    "fallbackTint": "#d8ceb8",
    "foregroundMasks": [],
    "plates": [
      { "room": "museum_lobby",      "label": "박물관 안내",     "english": "MUSEUM INFO",     "x": 45.0, "y": 41.5, "rotate": 0, "skew": -1 },
      { "room": "milestone_gallery", "label": "마일스톤 갤러리", "english": "MILESTONES",      "x": 24.0, "y": 14.0, "rotate": 0, "skew": -1 },
      { "room": "hall_of_fame",      "label": "명예의 전당",     "english": "HALL OF FAME",    "x": 24.0, "y": 58.0, "rotate": 0, "skew": -1 },
      { "room": "company_chronicle", "label": "회사 연표 복도",  "english": "CHRONICLE",       "x": 76.0, "y": 14.0, "rotate": 0, "skew": -1 },
      { "room": "archive_library",   "label": "아카이브 열람실", "english": "ARCHIVE ROOM",    "x": 76.0, "y": 58.0, "rotate": 0, "skew": -1 }
    ]
  },
  "connectors": {
    "hallAnchor": "hall_museum",
    "elevatorAnchor": "elevator_museum",
    "stairsAnchor": "stairs_museum",
    "windowAnchors": ["window_museum_1"],
    "entryGateAnchor": null
  },
  "liveFeatures": {
    "supportsExecutiveMeeting": false,
    "supportsPublicVisitors": false,
    "hasMuseumExhibits": true,
    "supportsCuratorNpc": true
  }
}
```

---

## 3. 전시 연결 방식 · 자동 확장 슬롯 구조 (새 저장 0)

### 3.1 구역·전시물 클릭 동작 매핑

기존 `#haniOfficeMap`의 단일 클릭 위임 경로를 그대로 사용하며, **배우 히트박스(`.hani-office-actor`) z-index ≥ 4 > 전시 핫스팟(`.hani-museum-slot`) z-index 2** 순서를 지켜 캐릭터 탭 대사·친밀도를 절대 가리지 않습니다.

| 전시 구역 | 전시 슬롯 (고정 DOM) | 클릭 시 열리는 내용 (1차: 미니 말풍선/카드 + 화면 이동) | 연결 앱 메뉴 (`showView` ID) | 데이터 출처 (읽기 전용) |
| --- | --- | --- | --- | --- |
| **마일스톤 갤러리** | 카드 액자 슬롯 **6칸** (`[data-museum-ms-slot="0..5"]`) + 전체 버튼 | ① 클릭 시 **미니 전시 카드**(등급 ★, 제목, 날짜, 대표 지표 1줄, 담당 Agent, `마일스톤에서 자세히 보기 →` 버튼) 표시<br>② 버튼 클릭 시 `showView('milestones')` 이동 (선택적 후속 확장: 해당 `m.id` 상세 모달 바로 열기) | `milestones` | `HaniMilestones.merged()` |
| **명예의 전당** | 역대 퀸 액자 **4칸** + 이달의 직원 **1칸** + 합류 기념 **1칸** | ① `queenFrame`([hani-office-live.js:4218-4237](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-office-live.js#L4218-L4237))과 동일 패턴으로 **수상 월 · 이름 · 직급 · 한줄 코멘트** 출력 + `라운지에서 보기 →`<br>② 이달의 직원: 이번 달 게시글/댓글 건수 + `조직도 보기 →`<br>③ 합류 기념(`seoyun-m9-special-cut.webp`): 기념 설명 + `캐릭터 앨범 →` | `board` / `organization` / `characterArchive` | `HaniBoard.queenWinner()`, `queenImages`, `HaniOrganizationHub.overviewData()`, `HANI_CHARACTER_ARCHIVE_DATA` |
| **회사 연표 복도** | 배포 연표 **1칸** + 일보 거치대 **2칸** + 시황 4컷 **3칸** | ① 배포 연표: 총 릴리스 수(`entries.length`) + 최신 배포(`v2.9.xxx` 제목·날짜) 미리보기 + `회사 소개(연혁) →`<br>② 일보 거치대: 최신 호·호외 제목·발행일 + `HANI 일보 읽기 →`<br>③ 시황 4컷: 해당 호 주간·제목·요약 1줄 + `뉴스룸 보기 →` | `organization` / `ilbo` / `newsroom` | `HaniReleaseCatalog.load()`, `HaniIlbo`, `HaniNewsroom4cut` |
| **아카이브 열람실** | 원화 액자 **2칸** + 열람 책장 **1칸** | ① M9 단체 화보/출근 치비툰 컷 소개 + `캐릭터 앨범 →`<br>② 분석 보고서·미룬 일 보드 요약 안내 + `분석 보고서 →` | `characterArchive` / `geminiReports` | `HANI_CHARACTER_ARCHIVE_DATA`, `hani-ui-v02992.js` |
| **로비 이젤** | 월간 기획전 **1칸** | 이달의 테마 전시 제목·큐레이터 한마디·추천 대상 카드 연결 | 해당 테마 `showView(...)` | 정적 월간 기획 데이터 (§6.2) |

### 3.2 마일스톤 자동 증가 대응: '고정 슬롯 상한 + 결정적 순환' 구조

회장님이 앞으로 마일스톤 카드를 10개, 30개, 100개로 계속 추가하셔도 DOM을 무한정 생성하지 않고(**Persistent Slot + Update** 원칙), 박물관 벽면이 어지러워지지 않도록 다음 규칙으로 자동 전시합니다.

1. **고정 전시 슬롯 상한: 6칸 (Persistent DOM)**
   - **슬롯 0~1 (영구 상설 2칸)**: `importance === 'HISTORIC'` 또는 `grade === 'LEGENDARY'` 중 가장 상징적인 대표작 2건 우선 고정(예: `HANI OS 출범`, `건강혁명 프로젝트`; 3건 이상이면 주간 로테이션).
   - **슬롯 2~4 (최신 · 순환 3칸)**:
     - 가장 최근 달성된 마일스톤(`isNew(m)` 또는 최신 날짜) 1건 고정 우선 배치
     - 나머지 2칸은 상설·최신을 제외한 전체 마일스톤 풀(`merged().items.filter(m => !isPending(m))`)에서 **KST 날짜 시드(`hash(YYYY-MM-DD + "|museum-ms")`)**로 매일 2건씩 결정적 순환!
   - **슬롯 5 (미래 목표 쇼케이스 1칸)**: `isPending(m)`인 목표 카드(예: `투자금액 500만원 모으기` — 달성 대기 표시) 전용 진열대. 모두 달성된 상태면 순환 풀 1건으로 자동 채움.
2. **전체 아카이브 카운터 배지**:
   - 갤러리 표지판 옆 작은 HTML 칩에 `전시 중 6 / 전체 N건`을 실시간 표시하고, 클릭 시 `milestones` 화면으로 바로 이동합니다.
3. **카드 아트 자동 매핑**:
   - 각 슬롯의 `<img>`/`<span>` 배경은 기존 `HaniMilestones.ART.sheet`(`milestone-card-sheet-v2.webp`)와 `HaniMilestones.artKey(m)`(카테고리별 12셀 좌표)을 그대로 재사용하므로 **새 마일스톤이 생겨도 추가 이미지가 0장**입니다.
4. **갱신 시점 (성능 보호)**:
   - 슬롯 내용 계산은 **6F 탭 진입 시 1회 + KST 날짜가 바뀐 첫 프레임 1회**만 수행하며, 100ms 애니메이션 틱 안에서는 재계산하지 않습니다.

---

## 4. 조용한 층의 방문 규칙 (Visit Rules & Priority)

### 4.1 운영 리듬 요약

박물관은 업무층(`2F~4F`)이나 상업층(`1F`)과 달리 **차분하고 조용한 감상 공간**(`quiet: true`, `maxCapacity: 5`)으로 운영합니다.

- **학예사 NPC (`npc-curator`) 상주**:
  - 정규 관장 시간 `08:00 ~ 20:00` 동안 6F 로비 안내대(`curator_desk`)와 4개 전시실을 천천히 순회하며 먼지 털기·액자 정리·관람 안내를 수행합니다.
  - 심야(`20:00 ~ 08:00`)에는 관장이 퇴근하여 6F는 조용한 야간 감상 공간(`ambientWash: night`)으로 전환됩니다(단, 회장님이 밤에 직접 6F에 머무르실 경우를 대비해 `20:00~22:00`에는 정리 대기 모션·희귀 마감 대사 허용 가능).
- **일반 직원 방문 (평소 조용함)**:
  - 평일 휴식/점심(`11:30~13:30`, `15:00~17:30`, `19:00~21:00`) 중 **동시 0~2명**만 간헐적으로 올라와 액자를 바라보거나 열람실에 앉아 쉬다 복귀합니다.
  - 기존 불변식(`personalNonWork >= 2700s`, `crossFloor >= 5400s`, 실시간 `Agent Case` 회의 소집 최우선 회수)을 100% 준수합니다.
  - 외부 방문객(`visitor`, `visitor-2`)은 기존 규칙(`1F public only`)대로 6F 입장 불가.
- **주말 수현 · 수연 견학**:
  - 주말(`09:00~19:00`) 회장님 재실·순찰 중 `museum` 방문 시, 수현·수연 남매가 마일스톤 갤러리와 명예의 전당을 둘러보는 전용 견학 대사를 출력합니다.
  - 상주 펫(치즈·크림·모찌·보리)은 기본적으로 6F 박물관에 상주 배치하지 않되, 회장님 순찰 시 동행 펫/남매만 동반 입장해 전시품 파손 없이 바닥 안전 구역(`companionSafe`)에서만 따라다닙니다.
- **특별 북적일 (`specialBusyDay`, 최대 3~4명)**:
  - 다음 3가지 읽기 전용 날짜 조건 중 하나에 해당하면 방문 규칙 가중치(`probability`)를 평소 `0.18` → **`0.65`**로 높여 동시 `3~4명`이 모여 함께 축하/관람하는 분위기를 만듭니다:
    1. **새 마일스톤 탄생일**: `HaniMilestones.merged().items` 중 `createdAt` 또는 `date`가 오늘~3일 이내인 카드가 있을 때
    2. **이달의 퀸 취임·발표 주간**: 매월 `1일 ~ 3일` (전월 우승자 액자 교체 기념)
    3. **배포 기념일 · 창립일**: `HaniReleaseCatalog` 최신 `released` 날짜가 오늘(또는 어제)이거나, 매년 `08-02` (HANI OS 출범일)

### 4.2 기존 방문 규칙 엔진(`visit-rules-v1`) 표준 데이터 예시

[building-creative-floor-v1.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-creative-floor-v1.md#L574-L615) §11.1 스키마에 맞춘 6F 박물관 규칙 3종 예시입니다.

```jsonc
[
  {
    "id": "rule-museum-quiet-visit",
    "floorId": "museum",
    "roomId": "milestone_gallery",
    "category": "outing",
    "priority": 35,
    "who": {
      "required": [],
      "optional": ["hani", "seoyun", "minji", "yoonseul", "haru", "naeun", "jieun", "mir"],
      "maxParticipants": 2
    },
    "when": {
      "days": "weekday",
      "timeWindows": [["12:10", "13:20"], ["15:10", "17:00"], ["19:10", "21:00"]],
      "season": null
    },
    "trigger": {
      "mode": "deterministic_slot",
      "probability": 0.18,
      "condition": null
    },
    "where": {
      "anchors": ["ms_view_main", "hof_queen_view", "chronicle_ilbo", "archive_table_a"],
      "poseByRole": { "archive_table_a": "sitting", "default": "standing" }
    },
    "durationSeconds": [60, 150],
    "cooldowns": {
      "ruleSeconds": 7200,
      "personNonWorkSeconds": 2700,
      "crossFloorSeconds": 5400
    },
    "lines": [
      "마일스톤 카드 볼 때마다 뿌듯하네.",
      "이달의 퀸 액자, 구도가 깔끔하다.",
      "예전 배포 기록을 다시 읽는 중."
    ]
  },
  {
    "id": "rule-museum-celebration-day",
    "floorId": "museum",
    "roomId": "hall_of_fame",
    "category": "event",
    "priority": 55,
    "who": {
      "required": [],
      "optional": ["hani", "seoyun", "minji", "yuna", "hina", "naeun", "dohyun", "arin"],
      "maxParticipants": 4
    },
    "when": {
      "days": "daily",
      "timeWindows": [["10:00", "11:30"], ["14:00", "17:30"]],
      "season": null
    },
    "trigger": {
      "mode": "input_adapter",
      "probability": 0.65,
      "condition": { "any": ["newMilestoneWithin3d", "queenDay1To3", "releaseTodayOr0802"] }
    },
    "where": {
      "anchors": ["ms_view_main", "ms_view_east", "hof_queen_view", "chronicle_timeline"],
      "poseByRole": { "default": "standing" }
    },
    "durationSeconds": [90, 180],
    "cooldowns": {
      "ruleSeconds": 10800,
      "personNonWorkSeconds": 2700,
      "crossFloorSeconds": 5400
    },
    "lines": [
      "새 전시 걸렸다 해서 올라왔어요!",
      "오늘 기록은 박물관에 꼭 남아야죠.",
      "다 같이 축하 기념 사진 한 장!"
    ]
  },
  {
    "id": "rule-museum-kids-tour",
    "floorId": "museum",
    "roomId": "milestone_gallery",
    "category": "patrol",
    "priority": 60,
    "who": {
      "required": ["seongmin", "kid-suhyeon", "kid-suyeon"],
      "optional": [],
      "maxParticipants": 3
    },
    "when": {
      "days": "weekend",
      "timeWindows": [["10:00", "18:00"]],
      "season": null
    },
    "trigger": {
      "mode": "always_if_present",
      "probability": 1.0,
      "condition": { "eq": ["chairman.floor", "museum"] }
    },
    "where": {
      "anchors": ["ms_view_main", "hof_queen_view"],
      "poseByRole": { "default": "standing" }
    },
    "durationSeconds": [60, 120],
    "cooldowns": { "ruleSeconds": 3600, "personNonWorkSeconds": 0, "crossFloorSeconds": 0 },
    "lines": [
      "수연: 우와! 아빠 카드가 반짝반짝해!",
      "수현: …여기 글씨랑 숫자 다 진짜야?"
    ]
  }
]
```

---

## 5. 학예사(큐레이터) NPC 상세 설계

### 5.1 정체성 · 데이터 분리 규약 (절대 원칙)

- **표시 명칭**: **`박물관 학예사`** (내부 ID: `npc-curator`, 괄호 표기 시 `학예사 · 관장`)
- **성격 한 줄**: 목소리는 낮고 차분하지만, 회사 기록과 날짜 하나까지 반듯하게 맞춰 두는 꼼꼼한 기록 지킴이.
- **표현 금기 준수**: 외모·체형·연애 감정 묘사를 일절 두지 않으며, 오직 직함과 큐레이터 역할에 맞는 대사·행동만 부여합니다.
- **데이터 완전 분리**:
  - `HaniOrganizationRoster`(정규 직원 20명)에 등록하지 않습니다.
  - `hani_office_affinity_v1`(친밀도 저장)·`HaniBoard`(이달의 퀸 투표 후보)·`hani_os_life_v23`의 **완전한 비대상**입니다.
  - DOM 속성 `dataset.resident = "npc"`, 말풍선 `profileLink.hidden = true`, 명찰은 중립 슬레이트 톤(`#94a3b8` / `#f8fafc`)을 유지합니다.

### 5.2 대사 전수 (모든 문장 30자 이내 · 쉬운 우리말)

#### A. 혼잣말 (8개)

| 번호 | 상황 | 대사 (공백 포함 30자 이내) | 글자 수 |
| --- | --- | --- | --- |
| 1 | 액자 점검 | `액자 각도가 1도쯤 기울었네.` | 16자 |
| 2 | 진열장 청소 | `유리 진열장 먼지부터 닦자.` | 15자 |
| 3 | 연표 정리 | `오늘 날짜로 연표 정리 끝.` | 15자 |
| 4 | 한가한 오후 | `조용해서 기록 읽기 좋은 날.` | 16자 |
| 5 | 명예의 전당 | `이달의 퀸 액자 위치 확인.` | 15자 |
| 6 | 빈 전시대 | `새 마일스톤 자리가 비었네.` | 15자 |
| 7 | 신문 정리 | `신문 합본 순서가 잘 맞나.` | 15자 |
| 8 | 조명 조절 | `전시 불빛 밝기를 조금 낮추자.` | 17자 |

#### B. 전시 안내 대사 (10개 · 전시 종류별)

| 번호 | 전시 종류 | 대사 (공백 포함 30자 이내) | 글자 수 |
| --- | --- | --- | --- |
| 1 | 마일스톤 (건강) | `회장님 건강 혁명의 첫 기록이에요.` | 19자 |
| 2 | 마일스톤 (출범) | `우리 회사가 처음 문 연 날이죠.` | 18자 |
| 3 | 마일스톤 (대기) | `이 자리는 달성될 날을 기다려요.` | 18자 |
| 4 | 역대 이달의 퀸 | `역대 이달의 퀸을 모신 액자예요.` | 18자 |
| 5 | 이달의 직원 | `이달 라운지 빛낸 직원의 기록이죠.` | 19자 |
| 6 | 배포 연표 (초기) | `첫 파일 올라간 날부터 다 있어요.` | 19자 |
| 7 | 배포 연표 (최신) | `가장 최근 배포 기록까지 꽂았어요.` | 19자 |
| 8 | 하니 일보 | `매주 나온 하니 일보 합본이에요.` | 18자 |
| 9 | 시황 4컷 | `금요일마다 모은 시장 4컷이에요.` | 18자 |
| 10 | 치비툰 · 앨범 | `동료들 입사 이야기와 치비툰이죠.` | 19자 |

#### C. 직원 · 아이와 짧은 대사 (6개)

| 번호 | 상대 | 대사 (공백 포함 30자 이내) | 글자 수 |
| --- | --- | --- | --- |
| 1 | 민지 (직원) | `민지 대리님, 새 일보 컷 꽂을까요?` | 20자 |
| 2 | 윤슬 (직원) | `윤슬 사원님, 열람실 책 빌려갈래요?` | 21자 |
| 3 | 서윤 (직원) | `서윤 리드님, 10월의 퀸 액자예요.` | 20자 |
| 4 | 수연 (아이) | `수연아, 뛰지 말고 액자 구경하자.` | 18자 |
| 5 | 수현 (아이) | `수현아, 제일 멋있는 카드 골라볼래?` | 20자 |
| 6 | 수현·수연 (남매) | `둘이 나란히 서면 도장 찍어줄게.` | 19자 |

#### D. 희귀 장면 (3개)

| 번호 | 희귀 장면 · 발동 조건 | 대사 (각 30자 이내) | 연출 메모 |
| --- | --- | --- | --- |
| 1 | **마감 전 불 끄며 한 마디**<br>(평일 `19:45~20:00` 사이 확률 5%) | 학예사: `오늘도 회사 하루를 잘 지켰네.` (18자) | 마일스톤 중앙 좌대 앞에 잠시 서서 고개 끄덕임 후 퇴근 준비 |
| 2 | **새 마일스톤 첫 액자 걸기**<br>(`newMilestoneWithin3d` 기간 내) | 학예사: `새 기록 하나, 반듯하게 걸었어요.` (19자) | 마일스톤 갤러리 2번 슬롯 앞에서 양손 올린 뒤 반듯하게 정리 |
| 3 | **남매 비밀 기념 엽서 주기**<br>(주말 수현·수연 방문 시 10% 확률) | 학예사: `아빠한테 비밀로 엽서 한 장씩!` (18자)<br>수연: `우와, 개구리 그림 엽서다!` (16자)<br>수현: `…고마워요, 잘 간직할게요.` (17자) | 중앙 로비 안내대 앞에서 3턴 말풍선 교대(저장 0, 메모리 전용) |

---

## 6. 장기 운영(Live-Ops) 연결 설계

[building-liveops-v1.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-liveops-v1.md)의 장기 운영 콘텐츠와 6F 박물관이 가장 자연스럽게 결합되는 3가지 연결 축입니다.

### 6.1 희귀 장면 도감(`Rare Scene Codex`) & 회사 성장 레벨 연결

| 연결 콘텐츠 | 6F 박물관 내 물리 거점 | 1단계 (무저장 · 즉시 가능) | 2단계 (영구 저장 · **★ 회장님 승인 필요**) |
| --- | --- | --- | --- |
| **희귀 장면 도감** (`Live-Ops 후보 2`) | **SE 아카이브 열람실 책장** + 학예사 안내대 | 세션 내 목격한 희귀 장면 카드와 학예사 한줄 메모 열람(새로고침 시 초기화). 정적 `rare-scenes-v1.json` 목록만 안내. | 별도 로컬 키 `hani_office_codex_v1`(`< 2KB`)로 목격 날짜·수집률(`3/12`, `6/12`) 영구 보관 → **★ 회장님 명시적 승인 필요** (`hani_os_life_v23` 접근 금지) |
| **회사 성장 레벨** (`Live-Ops 후보 1`) | **SW 명예의 전당 중앙 좌대** + **NE 연표 복도** | 기존 `state` 기록 수 + `HaniReleaseCatalog` 배포 횟수 + `HaniOfficeAffinity` 총합을 **읽기 전용 파생 계산**해 회사 연륜/레벨 배지 표시. | 커스텀 트로피/해금 장식 선택 상태를 별도 키 `hani_building_progress_v1`(`< 1KB`)에 저장 → **★ 회장님 명시적 승인 필요** (`hani_os_life_v23` 접근 금지) |

### 6.2 월간 기획 전시 (로비 이젤 · 데이터 추가만으로 순환)

중앙 로비(`museum_lobby`)의 이젤 슬롯 1칸을 **매월 1일 자동 교체되는 '이달의 특별 기획전'** 무대로 사용합니다. 별도 코드 수정 없이 `assets/data/museum-exhibitions-v1.json`(또는 통합 시즌 JSON)에 월별 레코드 1줄만 추가하면 동작합니다.

| 월 (KST) | 특별 기획전 제목 (예시) | 연동 전시 원천 | 학예사 특별 안내 (≤ 30자) |
| --- | --- | --- | --- |
| **12월** | **'올해의 갓생' 연말 결산 특별전** | 올해 `milestones` + `hani-ilbo` 총결산 + `xmas` | `올해 쌓은 기록들을 한눈에 모았어요.` (20자) |
| **1월** | **'새해 첫 걸음 & THAW' 프리뷰전** | `collections.json` `THAW`(`01-08` 티저) + `HANI OS 출범` | `새해 다짐과 해빙의 정원을 먼저 봐요.` (21자) |
| **2월** | **'THAW 해빙의 정원 & 창립 아카이브'** | `THAW`(`02-08` 출시) + `HANI_CHARACTER_ARCHIVE_DATA` | `따뜻한 봄빛 전시가 막 열렸어요.` (18자) |

---

## 7. 그림 주문서 (도연 선임님용) & 쿠폰 2호 우선순위

[building-creative-floor-v1.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-creative-floor-v1.md) §12 아트 제작 표준을 준수합니다.

### 7.1 6F 박물관 배경 1장 (`assets/building/floor-museum-v1.webp`)

- **규격**: **`1672 × 941 px` WebP**, `≤ 240,000 B` (낮 버전 1장만 필수 제작; 밤은 기존 CSS `hani-office-wash-night` 야간 워시로 처리해 closure +1만 사용).
- **레퍼런스**: `floor-4f-217.webp`(따뜻한 원목·라운지 조명·차분한 톤) + `floor-2f-217.webp`(4실 분할 비례) + `floor-5f-217.webp`(중앙 코어 좌표).
- **필수 고정 구조 (절대 준수)**:
  1. **가운데 세로 복도(`x ≈ 47%~55%`) 위쪽 끝 엘리베이터(`x ≈ 51%, y ≈ 12%`)** 및 아래 계단(`x ≈ 51%, y ≈ 58%`)이 2F~5F(현 7F)와 1:1 픽셀 위치로 일치할 것.
  2. **글자 0 원칙**: 그림 안에 한글·영문 간판, 숫자, 실제 마일스톤 카드 이미지, 실제 퀸 인물 사진을 **절대 직접 그리지 말 것**.
  3. **빈 틀(Empty Frame) 원칙**:
     - **[NW] 마일스톤 갤러리**: 벽면 유리 케이스 4개 + 중앙 낮은 진열 좌대 2개를 **비어 있는 유리·황동 테두리 틀**로만 그림(실제 카드는 코드가 `milestone-card-sheet-v2.webp`로 얹음).
     - **[SW] 명예의 전당**: 붉은/금색 포인트 카펫 위에 빈 고급 액자 4개 + 명패 받침 1개 + 가로 기념 액자 1개를 **빈 캔버스 상태**로 그림(실제 퀸 사진은 `assets/queen/*.webp`로 얹음).
     - **[NE] 회사 연표 복도**: 벽면 연표 레일(장식 선만, 연도 숫자 없음) + 빈 신문 거치대 2개 + 빈 4컷 액자 3개.
     - **[SE] 아카이브 열람실**: 원목 열람 테이블 + 의자 2석 + 책장(책등만, 글자 0) + 관람 벤치.
     - **[중앙 로비]**: 학예사 데스크 + 빈 나무 이젤 1개 + 4개 구역 상단 벽에 HTML `.hani-office-room-plate` 부착용 빈 여백(`y ≈ 14%`, `58%`) 확보.
  4. **캐릭터 여유 공간**: 모든 관람 지점·의자 앞뒤는 `48×64` 비율 치비 캐릭터 머리·이름표가 상단 표지판을 가리지 않도록 충분한 바닥 여백 확보.

### 7.2 학예사 스프라이트 & 7F 옥상 처리

- **학예사 스프라이트 (`npc-curator`)**:
  - **권장 방식 (+0 파일)**: `building-master-plan-v2.md` §11.1의 통합 NPC 시트 **`assets/sprites-v3/npc-pack-v2.webp`** 안에 1개 행(예: `row 6`)으로 함께 제작 (`96×144` 또는 `144×192` 셀, 4포즈: `standing`, `sitting`, `walk-a`, `walk-b`, 정장/가디건 계열 단정한 학예사 복장 + 사원증/클립보드 소품).
  - 단독 파일 fallback 시: `assets/sprites-v3/npc-curator.webp` (`≤ 60KB`, +1 파일).
- **7F 옥상 처리 (+0 파일, 100% 재사용)**:
  - 기존 [assets/building/floor-5f-217.webp](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/assets/building/floor-5f-217.webp)와 [assets/building/floor-5f-night-243.webp](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/assets/building/floor-5f-night-243.webp)를 **수정 없이 100% 그대로 재사용**합니다. `FloorRegistry`의 `order: 7`, `code: "7F"`, `tabTitle: "옥상"`만 바뀝니다.

### 7.3 도연 선임님 쿠폰 2호 내 우선순위

쿠폰 1호(`floor-5f-creative-v1.webp` + `floor-1f-v2.webp`) 완료 후, **쿠폰 2호**에 포함할 때의 권장 우선순위입니다:

1. **1순위 (P1 · 1~3단계 직결)**: `npc-pack-v2.webp` (편의점·보안·스태프·트레이너·사서 + **박물관 학예사 행 선포함**) + `hani-dept-emblems-v1.webp` (부서 로고 시트)
2. **2순위 (P1 · 4단계 투입)**: **`floor-museum-v1.webp`** (6F 박물관 배경 1장)
3. **3순위 (P2 · 선택 디테일)**: `v2-props-v1.webp` (애니메이션 소품 시트) 및 선택 야간 배경(`floor-5f-creative-night-v1.webp` 등)

---

## 8. 영향 · 위험 분석 및 단계 일정 제안

### 8.1 7개 층 확장 시 영향 분석

| 점검 영역 | 구체적 영향 및 확인된 코드 위치 | 대응 및 방어 방안 |
| --- | --- | --- |
| **1. 모바일 층 탭 (`390px`)** | 현재 [hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-office-live.css#L42) `.hani-building-tabs`는 `repeat(5, minmax(0, 1fr))`이고, `L59` 모바일(`<=700px`)은 2열, `L118`은 `button:last-child{grid-column:1/-1}`이 고정되어 있음. **7개 층**이 되면 데스크톱 5열은 2행(5+2)으로 어색해지고, 모바일 `last-child`가 남아있으면 7번째 탭이 4행 풀폭은 맞지만 6층 과도기 때 깨짐. | - **데스크톱**: `--hani-floor-cols` CSS 변수로 `7`(또는 `repeat(auto-fit, minmax(115px, 1fr))`) 주입해 7개 탭 한 줄 균일 배치.<br>- **모바일 390px**: `L118`의 `button:last-child` 제거 후 **`button:nth-child(odd):last-child{grid-column:1/-1}`** 적용 (`2+2+2+1풀폭` = 4행, 버튼 높이 `min-height: 50px`로 조정해 세로 점유 최소화) 또는 `repeat(3, minmax(0, 1fr))` 3열(`3+3+1`) 선택. |
| **2. Floor Registry · 앵커 · 하드코딩** | - [hani-office-live.js:16](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/hani-office-live.js#L16): `canon.anchors.length === 326` 고정 검증<br>- `L87`: `/^[1-5]f$/` 드라마 정규식<br>- `L226`: `FLOOR_ART` 5층 맵<br>- `L4168-4187`: `'5f'` 옥상 소품 하드코딩<br>- `lowfi-216.mjs:270`: `parseInt(a.floor) - parseInt(b.floor)` (`'museum'`은 `NaN`!) | - Phase 1에서 `FloorRegistry`를 먼저 도입하면 **6층이든 7층이든 추가 JS 분기문 0줄**.<br>- 기존 옥상 `id: "5f"` 유지 + `order: 7, code: "7F"`(안 A)를 쓰면 `office-drama-v1.json`, `xmas-lights`, `lantern`, `floor-5f-night-243.webp`가 **수정 0건으로 7F에서 그대로 작동**.<br>- 승강기·계단 연결: `elevator_creative(5F) ↔ elevator_museum(6F) ↔ elevator_5f(7F)` (`|orderA - orderB| === 1`). |
| **3. 성능 & 파일 예산 (`200` 상한)** | - 현재 `one-pass-gate-contract.json` 상한 `200` 중 `174`개 사용(여유 26).<br>- `lively-v2` 틱 판정 `324~340ms` (합격선 `<400ms`). | - 박물관 추가 파일: 배경 1장(+1) + `npc-pack-v2` 내 1행(+0) + JSON 필요 시 기존 `office-places.json`/`art-map-v1.json` 병합(+0) → **총 +1파일**.<br>- 전시 데이터 조회는 6F 진입 시 1회 캐싱(100ms 틱 내 `HaniMilestones.merged()` 반복 호출 금지).<br>- 조용한 층(`maxCapacity: 5`)이므로 라벨 패커 부하 극소. |
| **4. 저장 안전 & 테스트** | - `hani_os_life_v23`의 `state.milestones`를 읽기만 해야 함.<br>- 기존 `5층`/`326 앵커` 단언 테스트 충돌. | - Phase 1에서 기존 테스트를 `floors.length`·층별 앵커 합계 검증으로 이관.<br>- 박물관 전용 테스트 추가: ① `denyWrite(hani_os_life_v23)` 무변경, ② 마일스톤 0/4/20건 시 DOM 슬롯 6칸 상한 및 순환 결정성, ③ 학예사 `HaniOrganizationRoster`·`HaniOfficeAffinity`·`HaniBoard` 투표 미포함. |

### 8.2 도입 일정 제안 (마스터 플랜 v2 4단계 무렵)

[building-master-plan-v2.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5art/docs/design/building-master-plan-v2.md#L616-L623)의 5단계 일정 중 **Phase 4(살아있는 행동 엔진·장기 콘텐츠 연결) 무렵에 `6F 박물관` 추가 및 `7F 옥상` 승격을 진행**하는 것을 제안합니다.

| 순서 | 연계 단계 | 수행 내용 | 이유 |
| --- | --- | --- | --- |
| 선행 | **Phase 1~3** | Floor Registry 뼈대 → 5F 라이프+옥상 → 1F 편의점·부서이동 + `npc-pack-v2` 준비 | 먼저 `FloorRegistry`와 Canon v2 테스트·모바일 탭 그리드·`npc-pack-v2` 아틀라스를 안정화해 둠 |
| **투입** | **Phase 4 무렵 (신규 4-B)** | **6F 박물관 개관 + 옥상 `7F` 승격** (`floor-museum-v1.webp` 편입, 학예사 가동, 전시 슬롯 연결, 희귀 장면 도감 1단계 연동) | Registry 위에서 **데이터+그림 1장만으로 7층 확장 실증**, 희귀 장면 도감·월간 기획전과 즉시 시너지 |
| 후속 | **Phase 5** | 회장님 직접 조작으로 6F 박물관 순찰 · 주말 남매 도감 관람 · *(승인 시) 영구 도감/트로피 저장* | 개구리 회장님이 직접 엘리베이터 타고 6F 전시를 둘러보는 RPG 완성 |

---

## 마지막 한국어 3줄 요약

1. **기존 옥상을 7F로 올리고 6F를 조용한 '회사 박물관 · 명예의 전당'으로 신설하며, 마일스톤(`HaniMilestones.merged`)·역대 퀸·이달의 직원·하니 일보·시황 4컷·배포 연표·치비툰/앨범을 새 저장 0·`hani_os_life_v23` 쓰기 0으로 읽어 고정 6슬롯 순환 전시합니다.**
2. **가운데 세로 복도 위쪽 끝 엘리베이터(`51%, 12%`) 규격을 유지한 1672×941 빈 틀 배경 1장과 직원 명부·친밀도·투표에서 완전 분리된 여자 학예사 NPC 1명(성격·혼잣말 8·안내 10·대화 6·희귀 3, 모두 30자 이내)을 설계했습니다.**
3. **7개 층 확장에 따른 모바일 390px 탭·Floor Registry·`<400ms` 성능·200파일 한도(`+1파일` 이내) 영향을 점검하고, 쿠폰 2호 배정 및 마스터 플랜 v2 Phase 4 무렵 투입 일정을 제안했습니다.**
