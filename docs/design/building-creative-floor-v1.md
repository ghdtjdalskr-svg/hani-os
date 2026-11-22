# HANI 그룹 본사 "한 층 더" 대공사 — 라이프·크리에이티브 층 설계안 v1 및 확장 가능 건물 체계 표준

- **문서 구분**: 설계·아키텍처·영향 조사 v1 (코드/데이터/아트 미수정)
- **작성**: 세린 연구원 (Gemini)
- **보고 대상**: 성민 대표님(회장님) / 하니 전무님(기획) / 서윤(개발 리드) / 도연 선임님(개발·아트) / 유리 책임(QA) / 아린 선임(UI/UX)
- **기준선**: 저장소 `floor5` / 브랜치 `hani/building-5f` / 기준 `main` `v2.9.306` (`CURRENT.md` 기준 runtime closure `174` 파일, 누락 `0`)

---

## 목차 (Table of Contents)

- [0. 결정이 필요한 것 (Decision Checklist: 회장님 / 하니 전무님 / 서윤)](#0-결정이-필요한-것-decision-checklist)
- [0.5 현재 건물 조사 현황 (Verified As-Is)](#05-현재-건물-조사-현황-verified-as-is)
- [1. 새 층 평면 설계 (라이프·크리에이티브 층: 구역 4개 + 복도/엘리베이터)](#1-새-층-평면-설계)
- [2. 누가 언제 오나 (배치 규칙 및 기존 규칙과의 조화)](#2-누가-언제-오나-배치-규칙)
- [3. 앱 메뉴와 연결 (구역별 클릭 네비게이션 및 상호작용)](#3-앱-메뉴와-연결)
- [4. Spatial Canon 변경안 및 수정 대상 파일·위치 목록](#4-spatial-canon-변경안-및-수정-대상-파일위치-목록)
- [5. 그림 주문서 (도연 선임님용)](#5-그림-주문서-도연-선임님용)
- [6. 단계 계획 및 회장님 확인(Gate) 지점](#6-단계-계획-및-회장님-확인gate-지점)
- [7. 위험 분석 (데이터 보존·성능·기존 시험·파일 상한 200)](#7-위험-분석)
- [8. 회장님용 한 장 요약 (쉬운 말 5줄)](#8-회장님용-한-장-요약)
- [9. [표준] 층 등록부(Floor Registry) 설계 및 하드코딩 전수 조사표](#9-표준-층-등록부floor-registry-설계-및-하드코딩-전수-조사표)
- [10. [표준] 구역(Room) 데이터 표준 및 기존 구역 적용 예시 2건](#10-표준-구역room-데이터-표준)
- [11. [표준] 방문 규칙 엔진 표준 (Rule Engine & Priority)](#11-표준-방문-규칙-엔진-표준)
- [12. [표준] 그림 제작 표준 및 재사용 층 그림 주문서 템플릿](#12-표준-그림-제작-표준-및-주문서-템플릿)
- [13. [표준] Spatial Canon 변경 관리 (v1 → v2 및 앵커 합계 검증)](#13-표준-spatial-canon-변경-관리)
- [14. [표준] 향후 확장 예시 4종 (B1·계절 장식·야간 조명·신규 입사)](#14-표준-향후-확장-예시-4종)

---

## 0. 결정이 필요한 것 (Decision Checklist)

구현(그림 발주·코드 리팩터·Spatial Canon v2 전환)에 착수하기 전에 아래 결정을 확정해야 합니다.

### A. 회장님 (성민 대표님) 결정 사항
1. **층 구조 & 옥상 명칭 확정**:
   - 서윤 제안대로 **5F = 라이프·크리에이티브 층**, **6F(또는 `R 옥상`) = 옥상 테라스(꼭대기)** 배치를 승인할지 여부.
   - 6층 탭 표기를 `6F 옥상`으로 할지 `R 옥상`으로 할지 선택 (권장: 탭 `6F 옥상` 또는 `R 옥상` — 모바일 390px에서 글자 길이가 짧은 `5F 라이프` / `6F 옥상` 또는 `R 옥상` 권장).
2. **새 5F 밤 배경 제작 여부**:
   - 도연 선임님 여력(쿠폰 2개)으로 **낮 버전 1장만 먼저** 갈지, **밤 버전(`nightBackground`)까지 한 번에 2장** 뽑을지 결정. (시네마/스튜디오 분위기상 밤 버전이 매우 잘 어울리나, closure 파일 예산 +1 소비 — 파일 여분 26개 중 최대 2~3개 사용).
3. **구역별 앱 메뉴 연결 범위**:
   - 방송 스튜디오 클릭 시 **단일 메뉴 바로 이동(`ilbo` 또는 `newsroom`)** vs **작은 선택 말풍선(일보 / 뉴스룸 / 4컷 투자 리포트)** 중 선호 방식.
4. **방문·상주 방식**:
   - 새 5F에 **상주 인원 0명(기존 1~4F 데스크 유지 + 시간대별 방문)**으로 갈지, 아니면 특정 인물(예: 민지·나은)을 5F 상주로 옮길지 확인 (권장: **상주 0명**, §2 참고).
5. **대공사 범위(1단계 vs 2단계)**:
   - 이번에 **Floor Registry 표준화 리팩터(§9)까지 함께 진행**해 "앞으로 B1/6F/7F 추가가 그림+데이터만으로 되는 구조"를 먼저 깔고 5F를 얹을지 여부 (회장님 11/21 추가 요구 충족을 위해 **레지스트리 선행 후 5F 데이터 편입** 권장).

### B. 하니 전무님 결정 사항
1. **Spatial Canon v2 동결 해제 및 버전 승인**:
   - 동결 중인 `spatial-216-v1`([2026-10-16-spatial-plan-216.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/docs/development-history/handoffs/2026-10-16-spatial-plan-216.md))을 `spatial-225-v2`(가칭)로 개정하고, **"고정 326 앵커" 계약을 "층별 앵커 합계 무결성 검증"**으로 전환하는 안(§13) 승인.
2. **새 5F 구역별 방문 규칙 · 시간표 승인**:
   - 방송 스튜디오(일보/뉴스룸/4컷 시간대), 도서관·시네마(학습/야간 휴식), 피트니스(나은 운동 타임), 키즈·펫 라운지(주말 남매·반려동물 거점) 출현 시간대와 최대 수용 인원(`4+N` 규칙, §11) 승인.
3. **구역 이름판 공식 문구 승인**:
   - HTML 표지판(`.hani-office-room-plate`)에 들어갈 한/영 명칭 및 부제 확정 (예: `방송 스튜디오 / HANI Studio`, `도서관·시네마 / Library & Cinema`, `피트니스 / Wellness Gym`, `키즈·펫 라운지 / Kids & Pets`).

### C. 서윤 (개발 리드) 결정 사항
1. **내부 Floor ID 전략 최종 확정 (저장 데이터 영향은 둘 다 0)**:
   - **안 A (`'5f'` ID를 옥상에 유지 + 새 층에 `'creative'` 부여, `order: 5`/`6`으로 정렬)** vs **안 B (옥상 ID를 `'rooftop'`/`'6f'`로 이관 + 새 층에 `'5f'` 부여, `'5f'`를 Floor Registry 정규 ID로 사용)** 중 선택. (비교 및 추천은 §4.1에 상세 기록).
2. **기존 회귀 시험 고정값 개정 범위 승인**:
   - [hani-office-onboarding-232-assertions.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-onboarding-232-assertions.mjs#L14-L26)의 원본 `spatial-contract.json` SHA-256 고정 검사와 [hani-office-v2-215.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-v2-215.test.mjs#L19-L21)의 `326`/`333`·`5층` 단언, [hani-office-drama.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-drama.test.mjs)의 `/^[1-5]f$/` 검사를 Canon v2 계약으로 업데이트하는 PR 분리 순서 확정.
3. **모바일(390px) 층 탭 레이아웃 선택**:
   - 6개 층 탭을 `2열×3행` vs `3열×2행` 중 선택 (현재 [hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.css#L118)의 `button:last-child{grid-column:1/-1}` 제거 필요).

---

## 0.5 현재 건물 조사 현황 (Verified As-Is)

저장소 실제 파일에서 직접 확인한 현재 상태입니다.

| 영역 | 실제 파일 및 수치 | 비고 |
| --- | --- | --- |
| **배경 아트** | `assets/building/floor-1f-217.webp`, `floor-2f-217.webp`, `floor-3f-218.webp`, `floor-4f-217.webp`, `floor-5f-217.webp` (노을 옥상), `floor-5f-night-243.webp` (밤 옥상) | 모두 **1672×941** WebP ([art-map-v1.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/data/hani-building/art-map-v1.json)). 참고: `spatial-contract.json` 발주 초안은 `1600×1024`로 적혀 있으나 실제 원화는 `1672×941`이며, `hani-office-live.js:226` fallback `FLOOR_ART`의 `3f`만 구버전 `floor-3f-215.webp`를 가리킴. |
| **표지판(Plate)** | 과거 `signs-*-215.webp` 방식에서 217 패치로 **HTML 오버레이(`.hani-office-room-plate`)** 전환 완료 | `art-map-v1.json`의 `floors[id].plates[]`가 좌표·회전(`rotate`)·기울기(`skew: -1`)·색(`charcoal: #3f444a`)·한/영 문구를 정의 ([hani-office-v2-215.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-v2-215.test.mjs#L159-L178)). |
| **전경 마스크** | [index.html](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/index.html#L924)에 `.hani-office-foreground` `<img>` 3슬롯 존재 | 217 이후 1~5F 전부 `data-mask="none"`으로 숨김 상태; [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js#L4442)와 [hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.css#L237)에 `3f` 전용 마스크 흔적이 남아 있음. |
| **좌표계 2종 분리** | 1) V2 도식: `1000×640` (`x/10, y/6.4`)<br>2) 실제 아트: `1672×941` (`%` 좌표) | [spatial-contract.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/data/hani-building/spatial-contract.json#L10775)에 "V2 도식 좌표를 v1 원화 %에 그대로 쓰지 말 것" 명시. |
| **앵커 & 경로** | `spatial-contract.json`: `spatial-216-v1`, **326개** 고정 앵커 / 런타임 보강(+창가 5 + 카페 2) = **333개** | [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js#L16)가 `contractVersion==='spatial-216-v1' && canon.anchors.length===326`을 강제해, 1개만 달라도 V2 메타를 버리고 4층 레거시로 fallback. |
| **인원·주민·동행** | 직원/AI **20명**(+회장님 `seongmin` 재실 전용), 1F 방문객 슬롯 **2개**, 상주 주민(치즈·크림·모찌·보리 + 청소·정원사 + 임시알바 3), 회장님 동행(평일 5펫 순번 + 주말 수현·수연 + 5펫) | 모두 `hani-office-live.js` 단일 tick/persistent slot으로 동작, `localStorage`는 오직 `hani_office_affinity_v1`(인물 친밀도 카운트)만 사용하며 **층 ID는 전혀 저장하지 않음**. |
| **배포 파일 제한** | [one-pass-gate-contract.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/dev-center/one-pass-gate-contract.json#L5): `max_files: 200`, `max_total_bytes: 25,000,000` | 현재 closure: **174 / 200** 파일 (잔여 슬롯 **26개**). |

---

## 1. 새 층 평면 설계

### 1.1 기본 배치 철학 (기존 1F~4F와의 정합)
기존 1~4F([spatial-contract.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/data/hani-building/spatial-contract.json#L864-L2019))는 모두 **`1000×640` 도식** 기준으로 아래 공통 골격을 따릅니다.
- **중앙 공용 복도(`corridor`)**: `x: 30..970, y: 300..360` (높이 `60`)
- **우측 수직 코어(`core`)**: `x: 880..970, y: 180..410`
  - **엘리베이터(`elevator_<id>`)**: `(925, 240)` (`capacity: 4`)
  - **층 복도 합류점(`hall_<id>`)**: `(925, 330)`
  - **계단(`stairs_<id>`)**: `(925, 390)` (`capacity: 2`)
- **상단 구역 2개**: `y: 50..300` (출입문 `44px` 폭, `y: 300` 라인에 배치)
- **하단 구역 2개**: `y: 360..600` (출입문 `44px` 폭, `y: 360` 라인에 배치)

새 **5F 라이프·크리에이티브 층**도 이 동일한 `4구역 + 중앙 복도 + 우측 엘리베이터/계단 코어` 골격 위에 올립니다. 따라서 등각 원화(`1672×941`)를 그릴 때도 우측 엘리베이터 홀 위치가 1~4F와 정확히 일치하여, 층 탭을 넘길 때 건물 단면이 위아래로 어긋나지 않습니다.

### 1.2 구역(Room) 4개 평면도 (`1000×640` V2 도식 기준)

```text
x:   40                      430   450                     850   880     970
y=50 +------------------------+     +------------------------+
     | [NW] 방송 스튜디오      |     | [NE] 도서관 · 시네마    |   +-------+
     |  (studio)              |     |  (library_cinema)      |   | ELEV  | (925,240)
     | - 4컷 촬영 세트/백드롭  |     | - 원목 서가 2열         |   | 5F/C  |
     | - 앵커 데스크(2석)      |     | - 스터디 테이블(2석)    |   +-------+
     | - 카메라·키라이트·삼각대 |     | - 시네마 소파·미니스크린|     | hall  | (925,330)
y=300+--------[door 44]-------+     +-------[door 44]--------+   +-------+
     =============== 중앙 공용 복도 (y:300~360, x:30~970) ========| stairs| (925,390)
y=360+--------[door 44]-------+     +-------[door 44]--------+   +-------+
     | - 러닝머신 2대          |     | - 파스텔 놀이 매트      |
     | - 요가 매트 2장·아령    |     | - 낮은 그림책장·텐트    |
     | - 전면 벽 거울          |     | - 펫 쿠션/방석 4종      |
     |  (fitness)             |     |  (kids_pet_lounge)     |
     | [SW] 피트니스          |     | [SE] 키즈 · 펫 라운지   |
y=600+------------------------+     +------------------------+
```

### 1.3 구역별 상세 스펙 및 배치 소품·좌석(Slot)

| 구역 | `room.id` | 도식 경계 (`x, y, w, h`) | 출입문 앵커 (`y`) | 주요 시각 소품 (등각 원화 요소) | 가용 슬롯(Slot) / 포즈 |
| --- | --- | --- | --- | --- | --- |
| **NW: 방송 스튜디오** | `studio` | `40, 50, 390, 250` | `door_studio` `(235, 300)` | 뉴스/일보 앵커 데스크, 4컷 촬영 백드롭(배너 프레임), 카메라 1·삼각대, 소프트박스 조명 2, 프롬프터/모니터 | `studio_anchor_a`(sitting), `studio_anchor_b`(sitting), `studio_camera`(standing), `studio_4cut`(standing) — **최대 4석** |
| **NE: 도서관·시네마** | `library_cinema` | `450, 50, 400, 250` | `door_library` `(650, 300)` | 북쪽 원목 서가 2열 + 학습 테이블(좌측), 우측 2인 소파 + 작은 프로젝터 스크린/우드 보드(우측) | `lib_study_a`(sitting), `lib_study_b`(sitting), `cinema_sofa_a`(sitting), `cinema_sofa_b`(sitting) — **최대 4석** |
| **SW: 피트니스** | `fitness` | `40, 360, 390, 240` | `door_fitness` `(235, 360)` | 전면 대형 거울(북서 벽), 러닝머신 2대, 요가·스트레칭 매트 2장, 케틀벨/물병 선반 | `fit_treadmill_a`(walk/standing), `fit_treadmill_b`(walk/standing), `fit_mat_a`(standing/sitting), `fit_mat_b`(standing) — **최대 4석** |
| **SE: 키즈·펫 라운지** | `kids_pet_lounge` | `450, 360, 400, 240` | `door_kids_pet` `(650, 360)` | 부드러운 원형/사각 놀이 매트, 낮은 장난감/그림책 선반, 반려동물 쿠션 존(치즈·크림·모찌·보리 구별 방석), 보호자 1인 체어 | `lounge_kids_play_a`(standing/sitting), `lounge_kids_play_b`(standing/sitting), `lounge_parent_chair`(sitting), `pet_cushion_1..4`(펫 전용 정지점) |

- **창가/조망 스팟**: 복도 좌측 끝 창가(`window_creative_1`, 기존 `window_1f_1..window_4f_1`과 동일 패턴) 1개 추가.
- **최대 동시 체류 설계**: Floor Capacity 상한 원칙(`4 + N`, §11 참조)에 맞춰 평소(평일 일상) 층내 동시 인원 1~4명 수준으로 유지하여 390px 모바일 화면에서도 이름표·말풍선 겹침이 발생하지 않도록 설계합니다.

---

## 2. 누가 언제 오나 (배치 규칙)

### 2.1 상주 0명 vs 일부 상주 비교 결론
- **비교**:
  1. *일부 상주(예: 민지·나은·히나를 5F로 이주)*: 2F 라이프&엔터테인먼트 좌석(`life-a..d`, `desk_yoonseul`)이 비게 되며, `hani-office-v2-215.test.mjs:116-135`가 검증하는 **"2F 라이프 줄 5석 정원 일치"** 및 `spatial-contract.json` `people[].homeAnchor` 계약이 대거 깨집니다.
  2. *상주 0명 (방문·목적 기반 이동 층)*: 모든 직원 20명 + 회장님은 기존 1~4F 홈 데스크를 그대로 유지하고, **업무 이벤트·학습·운동·휴식·주말 가족 시간**에 5F로 올라왔다가 종료 후 홈 데스크로 복귀합니다.
- **권장**: **상주 0명** (기존 `homeAnchor` 20개 전량 불변, 회귀 위험 최소화). 단, 주말이나 특정 타임에 펫 4종(치즈·크림·모찌·보리) 중 1마리가 순찰 경유지로 `kids_pet_lounge`를 자주 들르도록 주민 리듬을 추가합니다.

### 2.2 KST 기준 5F 방문 시간표 (결정적 · 무저장)

모든 출현은 KST `YYYY-MM-DD|personId|slotKey` 기반 FNV-1a 해시 및 확정 시간창으로 계산하며, `localStorage`나 Cloud에는 **아무것도 쓰지 않습니다**.

| 시간대 (KST) | 요일 | 방문 구역 | 출현 인물 | 행동·대사 테마 | 기존 규칙 충돌 방지 |
| --- | --- | --- | --- | --- | --- |
| `08:30 ~ 09:15` | 평일 | 방송 스튜디오 | **민지**(카메라) + **유나**(대본/보조) 또는 **하니**(오프닝) | `"하니 일보 오프닝 큐!"`, `"오늘 헤드라인 조명 체크 중"` | 출근 정시(`09:00`) 전후 짧은 편성, 기존 `09:00` 정각 복귀 전 또는 점심/오후 분산 가능(§2.3 충돌 회피 규칙 적용) |
| `11:30 ~ 12:15` | 평일(특히 금) | 방송 스튜디오 | **민지** + **지은** + **다온**(시황 4컷) | `"이번 주 시황 4컷 앵글 잡는 중"`, `"하방 리스크 패널 확인 완료"` | 기존 금요일 `friday_camera`(`16:30~17:30`)와 연계하거나 점심 전 `11:30` 슬롯 중 1일 1회 확률/주기 선택 |
| `12:15 ~ 13:00` | 평일 | 피트니스 / 시네마 | **나은**(스트레칭/러닝), **수연**(러닝) / **하루·민지**(시네마) | `"점심 전 가벼운 러닝 20분!"`, `"오스카 단편 다시 보는 중"` | 기존 점심(`office-places.json` `lunch`: `11:30~13:00`) 외출 풀에 `studio`/`fitness`/`cinema` 가중치 편입 (개인 휴식 cooldown `2700s`, 층 이동 cooldown `5400s` 준수) |
| `15:00 ~ 16:00` | 평일 | 방송 스튜디오 / 도서관 | **지은·하니**(뉴스룸 촬영) / **히나·윤슬**(퀴즈·단어 복습) | `"뉴스룸 브리핑 테이크 1"`, `"오늘의 JLPT 카드 정리 중"` | `actions-221` 오후 시간대와 겹치면 `scheduler` 예약 시 `participantLock`으로 1인 1일정만 허용 |
| `18:30 ~ 21:00` | 평일 | 피트니스 / 도서관·시네마 | **나은·서윤·아린**(요가/러닝) / **히나·성민(재실 시)·하루**(독서·영화) | `"퇴근 후 코어 스트레칭 중"`, `"오늘의 한 편 상영 시작"` | `18:00` 이후 야근/휴식 인원 중 비근무 휴식 슬롯만 배정 (야근 중(`night`) 핵심 인력 강제 차출 금지) |
| `09:00 ~ 19:00` | 주말(토·일) | 키즈·펫 라운지 (+시네마) | **수현·수연**(회장님 재실 시 동행 또는 주말 방문) + **치즈·크림·모찌·보리**(순환 1~2마리) | 수연: `"여기 놀이 매트 폭신해!"`, 수현: `"그림책 두 권만 보고 가자"`, 펫 교대 휴식 | 기존 `companionSnapshot` 주말 남매·5펫 순찰 경로에 5F 경유지 추가; 회장님 부재 시에도 독립 펫 1마리는 쿠션 존 방문 가능 |

### 2.3 기존 위치 규칙과 충돌 방지 원칙
1. **실시간 안건 회의(`agentCase` / SUMMONING) 최우선**: 회장이 회의를 소집하면(2F/4F) 5F 체류 인원도 즉시 회수·이동.
2. **예약 잠금(`participantLock`)**: 동일 시각에 한 사람은 단 하나의 `seat`과 하나의 `activity`만 가짐(`office-actions-221.test.mjs:80-87` 불변식 유지).
3. **개인 휴식/층 이동 쿨다운 존중**: `personalNonWork` 간격 ≥ `2700초(45분)`, 홈 층 이탈 간격 ≥ `5400초(90분)` 규칙을 5F 방문 이벤트에도 동일 적용 ([hani-office-actions-221.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-actions-221.test.mjs#L71-L72)).
4. **방문자 접근 제어**: 1F 외부 방문객(`visitor`, `visitor-2`)은 기존 규칙(`access: 1F public only`)대로 5F 입장 불가.

---

## 3. 앱 메뉴와 연결

현재 앱은 [index.html](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/index.html#L224-L265)의 `nav` view ID와 `hani-main.js`의 `showView('<viewId>')`를 통해 화면 전환을 수행하며, [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js)는 이미 프로필 링크(`organization/people/<id>`) 클릭 시 `showView(...)`를 호출하는 패턴을 갖고 있습니다.

### 3.1 구역별 클릭 연결 매핑표

| 5F 구역 (`room.id`) | 클릭 대상(핫스팟/표지판) | 연결 메뉴 (`showView` ID) | 앱 화면 명칭 | UI 동작 방식 (READ-ONLY UI) |
| --- | --- | --- | --- | --- |
| **방송 스튜디오** (`studio`) | 스튜디오 룸 존 / 표지판(또는 앵커 데스크·4컷 세트 서브 영역) | `ilbo` / `newsroom` / `investmentCommittee` | HANI 일보 / 뉴스룸 / HANI 투자 리포트(4컷) | **권장**: 앵커 데스크/표지판 클릭 시 단일 기본 이동 `newsroom` + 작은 3버튼 선택 배지(`HANI 일보` · `뉴스룸` · `시황 4컷`), 또는 4컷 세트 핫스팟 분리 시 `investmentCommittee` 직결 |
| **도서관·시네마** (`library_cinema`) | 서가/스터디 테이블 측 | `reading` / `study` | 성민의 서재 / 공부 | 서가·테이블 핫스팟 클릭 시 `reading` (공부 퀵칩 `study` 옵션 제공 가능) |
| **도서관·시네마** (`library_cinema`) | 스크린/소파 측 | `movie` | 시청 아카이브 | 스크린·소파 핫스팟 클릭 시 `movie` 직결 |
| **피트니스** (`fitness`) | 피트니스 존 / 러닝머신·요가 매트 | `exercise` (보조: `diet`) | 헬스클럽 (체중 기록) | 피트니스 영역 클릭 시 `exercise` 직결 |
| **키즈·펫 라운지** (`kids_pet_lounge`) | 라운지 표지판 / 놀이 매트 | `board` (또는 캐릭터 반응 우선) | HANI 라운지 | **캐릭터(수현·수연·반려동물) 클릭 시 기존 말풍선(`hani-office-character-bubble`) 1순위 유지**, 빈 라운지/표지판 클릭 시 `board` 이동 |

### 3.2 이벤트 충돌 방지 원칙 (Canonical Event Path 유지)
- 새 전역 `addEventListener`를 추가하지 않습니다(기존 테스트 [hani-office-companions.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-companions.test.mjs#L66)가 `addEventListener` 개수 불변을 검사하거나 최소 변경을 요구함).
- `#haniOfficeMap`의 기존 단일 클릭 위임 경로에서 우선순위를 명확히 둡니다:
  1. `e.target.closest('.hani-office-actor')` → **인물 탭 대사/프로필 버블 우선** (기존 동작 100% 보존)
  2. `e.target.closest('.hani-office-room-plate, [data-room-hotspot]')` → **등록된 `menuLink`로 `showView(viewId)` 이동** (단, 배우 히트박스 40px를 절대 가리지 않도록 `pointer-events`·z-index 계층 분리: `.hani-office-actor` z-index ≥ 4 > 구역 핫스팟 z-index 1).
- **접근성 및 모바일**: 방 핫스팟은 터치 타깃 최소 `44×44px` 이상, `<button type="button">` 시맨틱 버튼으로 키보드 `Enter`/`Space` 지원, 지도 아래 방 목록(`.hani-building-rooms` 등 기존 영역)에도 이동 링크를 제공해 휴대폰 390px에서도 정밀 터치 없이 쉽게 이동 가능하도록 합니다.

---

## 4. Spatial Canon 변경안 및 수정 대상 파일·위치 목록

### 4.1 서윤 제안 구조 검토 및 내부 ID 전략 비교 (`'5f'` 유지 vs 새 ID)

서윤 제안(**"새 5F = 라이프·크리에이티브 층, 옥상 테라스는 6F / `R` 꼭대기로 이동"**)은 현실 건물 구조상 매우 타당합니다. 핵심은 **"내부 `floor.id`를 어떻게 둘 것인가"**입니다.

#### 사실 확인: 저장 데이터(`localStorage` / Cloud) 영향
저장소를 전수 확인한 결과,
- 핵심 보호 키 `hani_os_life_v23` 및 Cloud `hani_state`: **건물 층 ID를 일절 저장하지 않습니다.**
- 사무실 전용 키 `hani_office_affinity_v1`: 인물별 친밀도 카운트(`{v:2, counts, day, today}`)만 저장하며 **층 ID가 없습니다.**
- 설계 문서상의 `hani_living_office_ui_v1` 역시 미구현이며 층 이동·저장 규칙에 층 ID 영속 요구가 없습니다.

따라서 **두 안 모두 사용자 저장 데이터(`localStorage` / Cloud) 영향은 0**입니다. 차이는 **기존 코드·JSON·테스트 fixture 변경량과 장기 확장성**에서 발생합니다.

| 비교 항목 | 안 A: 옥상 ID `'5f'` 유지 + 새 층에 `'creative'` 부여 (`order`로 `5F`↔`6F` 배치) | 안 B: 옥상 ID를 `'rooftop'`(또는 `'6f'`)으로 이관 + 새 층에 `'5f'` 부여 |
| --- | --- | --- |
| **사용자 저장 데이터 영향** | **0 (변경 없음)** | **0 (변경 없음)** |
| **기존 옥상 JSON/아트 파일 변경** | **거의 0** (`office-places.json`의 `garden-5f`, `terrace-5f`, `window-5f`, `office-drama-v1.json`의 `floor:"5f"`, `floor-5f-217.webp`, `floor-5f-night-243.webp` 전부 유지) | **대규모 수정 필요** (`spatial-contract.json`, `art-map-v1.json`, `office-places.json`, `office-actions-221.json`, `office-drama-v1.json` 내 모든 옥상 `'5f'` 치환) |
| **기존 런타임/시험 하드코딩 영향** | 좁음 (단, `/^[1-5]f$/`, `parseInt(floor)`, `f.id==='5f'` 야간 조건 등은 Registry 속성으로 추상화 필요) | 넓음 (`drama`, `xmas`, `chairman-patrol`, `kids-visit`, `lowfi-216` 등의 옥상 `'5f'` 단언까지 전부 수정 필요) |
| **장기 직관성 (6F/7F/B1 확장 시)** | 낮음 (`id:'5f'`가 6층 꼭대기를 뜻하는 역설 잔존, 향후 개발자 혼동 위험) | **최고** (숫자/역할 기반 일관: `1f..5f` 실내 + `rooftop` 또는 `6f` 옥상; Floor Registry에서 `order`와 `id` 완전 일치) |

#### 세린 연구원 최종 추천
1. **데이터 관점**: 안 A · 안 B 모두 저장 데이터 영향 **0**이므로 데이터 마이그레이션 걱정은 없습니다.
2. **실행 전략 추천**: **§9 Floor Registry 도입을 전제로 하되, `id`에서 "층 번호(`5f`)" 의존성을 제거하고 `legacyId` 별칭을 두는 하이브리드(안 A → 필요 시 안 B)**를 추천합니다.
   - **실제 동작**: Registry 각 항목이 `{ id, order, code, label, legacyIds? }`를 가집니다.
   - **즉시 1차 대공사(최소 회귀 추천)**: 옥상 `id: "5f"`(또는 `"rooftop"`, `legacyIds: ["5f"]`), `order: 6`, `code: "6F"`, `badge: "R 옥상"`으로 두고, 새 라이프·크리에이티브 층은 `id: "creative"`, `order: 5`, `code: "5F"`, `badge: "5F 라이프"`로 등록합니다. 이렇게 하면 기존 옥상 드라마 100줄·액션 120개·크리스마스 조명(`xmas-lights`)·고양이/정원사/청소부 경로·야간 배경 파일명(`floor-5f-night-243.webp`)·순찰/남매 테스트를 단 하나도 깨뜨리지 않으면서 화면/탭/동선에서는 완벽히 **1F~4F → 5F(라이프·크리에이티브) → 6F/R(옥상 테라스)** 순서로 동작합니다.
   - *(대안)* 만약 회장님·서윤께서 "앞으로 10년을 위해 이번 기회에 옥상 ID 자체도 `'rooftop'`(또는 `'6f'`)으로 깔끔히 고치고 `'5f'`를 새 층에 주자"고 결정하신다면(안 B), Floor Registry 리팩터 단계에서 일괄 치환하는 것도 저장 데이터 영향이 0이므로 완전히 가능합니다.

### 4.2 Spatial Canon 주요 변경안 (`spatial-216-v1` → `spatial-225-v2`)
1. **앵커 수 계약 변경**: `canon.anchors.length === 326` 고정 검사를 **층별 앵커 합계 + 필수 그래프 연결(엘리베이터↔층↔방↔좌석) + 중복 ID 0 검증**으로 교체 (§13).
2. **층 목록(`floors`)**: 순서대로 `creative`(5F 라이프·크리에이티브, `order:5`) 추가, 옥상(`5f`/`rooftop`, `order:6`)은 `quiet: true` / 최상층으로 유지.
3. **엘리베이터·계단 연결 (`edges`)**:
   - 기존: `elevator_1f ↔ elevator_2f ↔ elevator_3f ↔ elevator_4f ↔ elevator_5f(옥상)`
   - 변경: `elevator_4f ↔ elevator_creative ↔ elevator_5f(옥상)` (계단 `stairs_4f ↔ stairs_creative ↔ stairs_5f`도 동일하게 중간 삽입).
   - `corridor_creative` ↔ `hall_creative` ↔ `elevator_creative`/`stairs_creative` 및 4개 방 `door_*` 연결.
4. **층 탭 UI 및 390px 모바일 overflow 방지**:
   - 데스크톱: [hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.css#L42) `.hani-building-tabs`를 `repeat(5, minmax(0, 1fr))` → **`repeat(6, minmax(0, 1fr))`** (또는 CSS 변수 `--hani-floor-count`, 향후 확장 대응 `repeat(auto-fit, minmax(110px, 1fr))`).
   - **390px 모바일(`@media(max-width:700px)`) 핵심 수정**:
     - 현재 [hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.css#L59)는 2열 그리드(`repeat(2, minmax(0, 1fr))`)이고, [hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.css#L118)에 `.hani-building-tabs button:last-child{grid-column:1/-1}`가 하드코딩되어 있습니다(5개일 때 5번째 버튼 한 줄 전체 확장용).
     - **6개 층이 되면 `last-child{grid-column:1/-1}`를 반드시 제거해야 합니다!** 그대로 두면 5번째 버튼 옆 한 칸이 빈 채 6번째 버튼만 4행 전체로 밀려 레이아웃이 망가집니다.
     - 제거 후 `2열×3행`(높이 44px×3 + 간격 = ~148px, 버튼 텍스트 충분) 또는 `3열×2행`(폭 약 `115px` per button at `390px` viewport, 높이 절약) 중 선택. **세린 추천: `2열×3행` (`button:last-child` 삭제) 또는 짝/홀 자동 대응 CSS(`nth-child(odd):last-child{grid-column:1/-1}`)**를 쓰면 5층·6층·7층 어떤 층 수가 와도 마지막 버튼이 홀수일 때만 풀폭으로 정렬되어 가로 overflow가 0이 됩니다!

### 4.3 수정이 필요한 파일·위치 목록 (이번 작업은 코드 수정 금지, 목록만 작성)

| 파일 | 현재 위치 (줄 번호) | 수정 내용 요약 |
| --- | --- | --- |
| [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js#L16) | L16 | `contractVersion==='spatial-216-v1'&&canon.anchors.length===326` → Registry/Canon v2 합계 검증 함수로 교체 |
| [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js#L60-L62) | L60-62 | `floor.id==='5f'` 하드코딩 대신 `Boolean(floor.nightBackground)` 데이터 속성 기반으로 전환 |
| [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js#L87) | L87 | `/^[1-5]f$/` 정규식을 Registry `floors.has(row.floor)` 검증으로 교체 |
| [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js#L226-L283) | L226-283 | `FLOOR_ART`, `legacyFloors`, `legacySeatMaps` fallback 및 정렬 순서를 Floor Registry `order` 역순(`6F→5F→…→1F`)으로 통합 |
| [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js#L1452-L4187) | L1452, 1655, 1998, 2122, 2388, 3235, 3246, 3488, 3497, 4168, 4442 | 순찰/휴식/주민/소품/3F마스크 등의 `'1f'..'5f'` 직접 분기를 Floor Registry 속성 조회로 단계 이관 (§9 상세 표 참고) |
| [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js) (클릭 위임부) | `#haniOfficeMap` click handler | 배우 클릭 우선 유지 + 방 표지판/핫스팟 클릭 시 `showView(room.menuView)` 라우팅 추가 |
| [hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.css#L42) | L42, L59, L118 | `.hani-building-tabs` 5열 하드코딩 → `--hani-floor-cols` / `nth-child(odd):last-child` 적용, 모바일 overflow 방지 + 구역 핫스팟 스타일 |
| [data/hani-building/spatial-contract.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/data/hani-building/spatial-contract.json) | `contractVersion`, `floors`, `anchors`, `edges` | 새 층 4구역·복도/엘리베이터·좌석 앵커·4F↔5F↔6F 승강기/계단 간선 추가, 옥상 라벨(`6F / R 옥상`) 갱신 |
| [data/hani-building/art-map-v1.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/data/hani-building/art-map-v1.json) | `contractVersion`, `floors`, `anchors` | 새 5F `background`, `plates`(4개 구역 HTML 표지판), 신규 앵커 % 좌표(`1672×941` 기준) 추가 |
| [data/hani-building/office-places.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/data/hani-building/office-places.json) | `places`, `anchors`, `rhythm` | 새 5F 창가(`window-creative`), 스튜디오/도서관/시네마/피트니스/키즈·펫 장소 및 `atByPerson` 대사 추가 |
| [assets/data/office-actions-221.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/assets/data/office-actions-221.json) | `rules`, `actions`, `families` | `groupMaxPerFloor`에 새 층 키 추가, 5F 방문 액션(촬영·독서·영화·운동 등) 추가 |
| [scripts/hani-office-lowfi-216.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-lowfi-216.mjs#L185-L270) | L185, 202, 212, 270 | 층 수 `5` 고정 및 `parseInt(floor)` 전제를 Floor Registry 동적 검증으로 업데이트 |
| 기존 office 회귀 테스트군 | §9.2 표 참조 | `spatial-216-v1` / `326` / `5 floors` 고정 단언 업데이트 |

---

## 5. 그림 주문서 (도연 선임님용)

### 5.1 발주 산출물 목록 및 파일 Budget (200파일 상한 준수)
현재 runtime closure가 **174/200**(여유 26개)이므로 소품·표지판을 개별 파일로 쪼개면 안 됩니다.

| 자산 | 권장 파일명 | 규격 / 형식 | 용량 상한 | 필수 여부 | 설명 |
| --- | --- | --- | --- | --- | --- |
| **1. 새 5F 낮 배경** | `assets/building/floor-5f-creative-v1.webp` | **1672×941** WebP (alpha 없음 or opaque) | ≤ 240,000 B | **필수 (+1 파일)** | 방송 스튜디오(NW)·도서관/시네마(NE)·피트니스(SW)·키즈/펫(SE)·중앙 복도·우측 코어 |
| **2. 새 5F 밤 배경** | `assets/building/floor-5f-creative-night-v1.webp` | **1672×941** WebP | ≤ 240,000 B | **선택 (+1 파일)** | 회장님 결정 사항: 스튜디오 링라이트/시네마 스크린 은은한 불빛/스탠드 무드. 낮 버전 완성 후 후속 추가도 가능(§14.3) |
| **3. 전경 가림 마스크** | `assets/building/floor-5f-creative-fg-v1.webp` | **1672×941** 투명 WebP (VP8X+alpha) | ≤ 70,000 B | **선택 (+0~1 파일)** | 앵커 데스크·스터디 책상·소파 앞면 하체 가림용. 배경 시점상 캐릭터 발 피벗이 가구 뒤로 들어갈 때만 사용, 불필요 시 `data-mask="none"` 유지 |
| **4. 5F 통합 소품 시트** | `assets/office-props/creative-props-v1.webp` (또는 배경에 직접 포함) | 예: 512×512 WebP (alpha) | ≤ 60,000 B | **선택 (+0~1 파일)** | 녹화 ON-AIR 램프(점멸), 4컷 카메라 플래시 등 **애니메이션이 필요한 소품만** 1장 atlas로 통합. 정적 소품(책, 아령, 러닝머신, 놀이매트, 쿠션)은 **배경 1장에 직접 그려 파일 수 0 증가** 권장! |
| **5. 표지판 (그림 제작 금지)** | *이미지 파일 생성 없음* | HTML `.hani-office-room-plate` | 0 B (+0 파일) | **금지 준수** | **한글/영문 텍스트는 절대 그림에 굽지 않습니다.** 기존 217 패치([hani-office-v2-215.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-v2-215.test.mjs#L159-L178))처럼 배경 상단/벽면에 비어 있는 표지판 부착 공간만 남겨 두고 HTML 오버레이로 띄웁니다. |

**총 closure 추가 파일 수**: **최소 +1 파일**(낮 배경만) ~ **최대 +3 파일**(낮+밤+애니 소품 시트) → 총 `175~177 / 200` (여유 23~25슬롯 보존).

### 5.2 스타일 참조 파일 목록 (도연 선임님 필독 레퍼런스)
- **가장 중요한 실내 기준**: [assets/building/floor-2f-217.webp](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/assets/building/floor-2f-217.webp) (4구역 분할·복도 바닥 톤·책상 높이·벽 두께), [assets/building/floor-3f-218.webp](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/assets/building/floor-3f-218.webp) (조명/모니터 발광감), [assets/building/floor-4f-217.webp](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/assets/building/floor-4f-217.webp) (원목·소파 라운지 질감), [assets/building/floor-1f-217.webp](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/assets/building/floor-1f-217.webp) (카페·라운지 조명).
- **밤 조명 참조(밤 버전 제작 시)**: [assets/building/floor-5f-night-243.webp](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/assets/building/floor-5f-night-243.webp) (따뜻한 전구/란탄 톤과 어두운 남색 야경 대비).
- **캐릭터 비율 비교 참조**: `assets/sprites-v3/*.webp` (기본 48×64 논리 셀 × 3배 = 144×192, 화면상 높이 `max(40px, 6.8cqw)`, 발 피벗 `y = 61/64`).

### 5.3 크기·시점 맞춤 필수 조건
1. 캔버스 **정확히 `1672×941`px**.
2. **하향 등각(Top-down Isometric) 각도·소실점·벽 높이**를 `floor-2f-217.webp`와 1:1 오버레이 비교 시 중앙 복도와 우측 엘리베이터/계단 코어가 일치할 것.
3. 각 구역의 **앉는/서 있는 위치(바닥 영역)**에는 치비 캐릭터(`48×64` 비율)가 섰을 때 머리나 이름표가 상단 방 경계선/표지판을 가리지 않도록 **상단 여백 60px 이상** 확보.
4. NW 스튜디오의 백드롭/조명/카메라가 복도 문(`door_studio`) 쪽 동선을 가로막지 않도록 좌측/북측 벽면 위주 배치.

---

## 6. 단계 계획 및 회장님 확인(Gate) 지점

| 단계 | 작업 내용 | 담당 | 산출물 | 회장님 확인(Gate) 지점 |
| --- | --- | --- | --- | --- |
| **Step 0: 설계·규약 확정** | §0 결정 목록 확정(6F/R 표기, ID 안 A/B, 밤 배경 여부, 메뉴 연결, Registry 우선 리팩터 여부) | 회장님 · 하니 전무 · 서윤 | 결정 기록 (`DECISIONS.md` 등) | **★ Gate 1**: 설계안 & 그림 주문서 승인 |
| **Step 1: 5F 그림 제작·검수** | 5F 낮(+선택 밤) 배경 WebP 생성 및 2F/4F 나란히 시점·선화·비율 대조 검수 (§12 체크리스트) | 도연 선임 (+아린 시각 검수) | `floor-5f-creative-v1.webp` (+`night`), 비교판 PNG | **★ Gate 2**: 아트 Preview 확인 (캐릭터 합성 목업 포함) |
| **Step 2: Floor Registry 뼈대 리팩터** | 5F 넣기 전에 기존 1~5F(옥상)를 `FloorRegistry` 데이터 구조로 이전 (동작 100% 동일 유지, §9.3 순서) | 서윤 / 도연 | `hani-office-live.js`, `hani-office-live.css`, 동등성 테스트 통과 | — (내부 기술 리팩터, 기존 1~4F+옥상 무결성 검증) |
| **Step 3: 5F 데이터·규칙·메뉴 구현** | Canon v2 개정, 5F 공간/좌표/방문 규칙/메뉴 클릭 라우팅/390px 6탭 적용 | 도연 / 서윤 | `spatial-contract.json`, `art-map-v1.json`, `office-places.json`, `office-actions-221.json` | — |
| **Step 4: 실화면 시간대·PC/폰 점검** | Edge headless 실제 캡처: 평일 아침/점심/오후/밤, 주말(수현·수연+펫), PC `1440×900` & 폰 `390×844` (라이트/다크), `localStorage` 쓰기 0, closure ≤ 200 | 유리 책임 · 아린 선임 | 시간대별 비교 스크린샷 + 회귀 리포트 | **★ Gate 3**: 실화면 Preview 승인 & 배포 열차 탑승 허가 |
| **Step 5: 배포 열차 & Production Read-back** | 배포 담당(Claude Code) 열차 통합 → 버전 1회 증가 → One-Pass → HINA → `main` merge → Pages 반영 → 최신 JS/5F·6F 실동작 read-back | 배포 담당 · 회장님 | 운영 반영 완료 (`AGENTS.md` §3 완료 조건 충족) | **★ Gate 4**: 배포센터 최종 승인 |

---

## 7. 위험 분석

### 7.1 저장 데이터 영향 (필수 조건: 0)
- **위험**: 층 추가/ID 변경 과정에서 `hani_os_life_v23` 또는 Cloud `hani_state`에 접근하거나 스키마가 오염될 위험.
- **대응**: `hani-office-live.js` 내 `localStorage` 접근은 기존 `createOfficeAffinity` (`hani_office_affinity_v1`, personId 기반) 단 한 곳뿐이며, Floor Registry와 방문 규칙 엔진은 **100% 순수 함수 + KST 시계 해시**로 유지합니다. 모든 신규/회귀 테스트에 기존 `denyWrite` Proxy(`setItem`/`removeItem`/`clear` 호출 시 즉시 fail) 및 `hani_os_life_v23` 바이트 불변 단언을 유지합니다.

### 7.2 성능 (이미지 용량 · 틱 연산량)
- **이미지 로드**: 현재 [hani-office-v2-215.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-v2-215.test.mjs#L229)가 검증하듯, 오피스 뷰 비활성 시 `.webp` 요청 0건, 활성 시에도 **현재 보이는 층의 배경만 lazy load**하므로 5F 추가가 초기 로딩 성능을 저하시키지 않습니다.
- **CPU/틱 연산량**: [artifacts/fix278/REPORT.md](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/artifacts/fix278/REPORT.md#L11-L17)에 따르면 현재 `lively-v2` 성능 판정값이 `324.4~340.4ms` (개별 최대 `429.6ms`, 합격선 `<400ms`)로 여유가 큰 편이 아닙니다. 층·액션·방문 규칙이 늘어나면 `scheduler.plan()`과 `snapshot()` 시간 복잡도가 증가할 수 있습니다.
  - **완화책**: (1) 방문 규칙 엔진을 층별·시간창별 사전 인덱싱(`Map`)해 매 100ms 틱마다 전체 규칙을 선형 탐색하지 않게 설계, (2) 5F 구현 후 반드시 `fix278` 계열 `<400ms` 성능 벤치마크 재측정.

### 7.3 기존 시험 고정값 충돌
현재 다수의 테스트가 `5개 층`, `326(333)개 앵커`, `spatial-216-v1`, `/^[1-5]f$/`, 원본 `SHA-256` 해시를 직접 단언합니다(§9.2 전수 표에 줄 번호 포함 상세 정리).
- 예: `assertOnboardedCanon()`([hani-office-onboarding-232-assertions.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-onboarding-232-assertions.mjs#L14-L26)), `api.floors.length === 5`([hani-office-v2-215.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-v2-215.test.mjs#L21)), `c.floors.length === 5`([hani-office-lowfi-216.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-lowfi-216.mjs#L202)) 등.
- **대응**: "테스트를 지우는" 방식이 아니라 §13 변경 관리 절차에 따라 **Canon v2 동결 해제 및 고정값 이관 전용 PR/커밋**으로 함께 업데이트합니다.

### 7.4 배포 파일 수 상한 (`max_files: 200`)
- [one-pass-gate-contract.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/dev-center/one-pass-gate-contract.json#L5) 상한 `200`개 중 현재 **174개 사용 중(여유 26개)**.
- **대응**:
  1. 5F에 필요한 파일은 **최소 1개(낮 배경 WebP) ~ 최대 3개(+밤 배경 +통합 애니 소품 시트)**로 제한합니다.
  2. 구역 클릭 메뉴/설명/표지판/방문 규칙 데이터는 별도 JSON 파일을 무작정 늘리지 않고 기존 JSON(`spatial-contract.json`, `art-map-v1.json`, `office-places.json`, `office-actions-221.json`) 또는 **단일 `data/hani-building/floor-registry-v1.json`** 1개(+1파일)에 통합해 파일 수 폭발을 차단합니다.
  3. 정적 소품은 전부 배경 아트에 그려 넣어 별도 이미지 파일 0개로 유지합니다.

---

## 8. 회장님용 한 장 요약

1. 현재 5층 옥상 테라스를 꼭대기(**6F / R 옥상**)로 올리고, 새로 만드는 **5층 라이프·크리에이티브 층**에 **방송 스튜디오·도서관/시네마·피트니스·키즈/펫 라운지** 4개 구역을 기존 층과 같은 크기(`1672×941`)·같은 엘리베이터 위치로 배치합니다.
2. 기존 직원 20명의 자리(1~4F)는 건드리지 않고 **상주 0명·시간대별 방문제**로 운영하여, 일보·뉴스룸 시간엔 민지·지은·하니가 스튜디오에, 공부·운동 시간엔 히나·나은이 도서관/피트니스에, 주말엔 수현·수연과 치즈·크림·모찌·보리가 라운지에 나타납니다.
3. 각 구역을 누르면 앱의 일보·뉴스룸·투자4컷·독서·영화·운동 메뉴로 바로 이동하며, 인물 탭 대사·프로필 기능은 그대로 우선 동작하고 **저장 데이터(`hani_os_life_v23`·Cloud) 변경은 0**입니다.
4. 배포 파일 수 여유(`174/200`, 26개 남음)를 지키기 위해 소품은 배경 1장(선택 밤 1장)에 통합하고 표지판은 기존처럼 HTML 라벨을 쓰며, 모바일 390px에서 6개 층 탭이 넘치지 않게 2×3 그리드로 고칩니다.
5. 이번 작업을 계기로 **층 등록부·구역·방문 규칙·그림·Canon 변경 표준(§9~§14)**을 함께 세워, 앞으로 지하 주차장이나 계절 장식, 7층을 넣을 때 코드 수술 없이 **그림 + 데이터 추가만으로** 확장할 수 있는 건물 체계를 완성합니다.

---

## 9. [표준] 층 등록부(Floor Registry) 설계 및 하드코딩 전수 조사표

### 9.1 Floor Registry 스키마 (`floor-registry-v1`)

앞으로 새 층(6F, 7F, B1 등)이나 새 방을 추가할 때 JS 조건문을 고치지 않고 **데이터 1묶음 + 그림 파일만 추가**해 동작하도록 하는 정식 등록부 스키마입니다. (단일 파일 `data/hani-building/floor-registry-v1.json` 또는 `spatial-contract.json` v2의 `floors[]`를 확장).

```jsonc
{
  "schemaVersion": "floor-registry-v1",
  "floors": [
    {
      "id": "creative",                // 불변 내부 식별자 (층 번호 변경에 영향 받지 않는 역할 ID)
      "legacyIds": [],                 // 과거 호환 별칭 (예: 옥상 안 A 적용 시 ["5f"])
      "order": 5,                      // 수직 물리 순서 (예: -1=B1, 1=1F ... 5=5F, 6=6F/옥상). 탭은 order 내림차순 렌더링
      "code": "5F",                    // 짧은 탭 층 표기 ("B1", "1F".."5F", "6F" 또는 "R")
      "tabTitle": "라이프·크리에이티브", // 탭 보조명
      "fullTitle": "5F 라이프·크리에이티브 · 스튜디오/도서관/피트니스/키즈·펫",
      "category": "amenity",           // "office" | "executive" | "lobby" | "amenity" | "rooftop" | "utility"
      "quiet": false,                  // 조용한 층 여부
      "outdoor": false,                // 야외/루프톱 여부 (날씨·야간·계절 오버레이 판단에 사용)
      "defaultResidents": [],          // 상주 직원 ID 목록 (5F=0명, 1~4F는 homeAnchor 기준으로 자동 계산 가능)
      "maxCapacity": 6,                // 기본 4 + N 동시 체류 상한 (§11 참조)
      "art": {
        "width": 1672,
        "height": 941,
        "background": "./assets/building/floor-5f-creative-v1.webp",
        "nightBackground": "./assets/building/floor-5f-creative-night-v1.webp", // 없으면 null
        "nightSchedule": "rooftop_default", // "18:30-06:00" 등 조명 규칙 키 (하드코딩 제거)
        "fallbackTint": "#a9c7b8",
        "foregroundMasks": [],         // [{ "src": "...", "forRooms": ["studio"], "zIndex": 5 }]
        "propsAtlas": "./assets/office-props/creative-props-v1.webp",
        "plates": [                    // HTML .hani-office-room-plate 정의
          { "room": "studio", "label": "방송 스튜디오", "english": "HANI STUDIO", "x": 23.5, "y": 9.2, "rotate": 0, "skew": -1 }
        ]
      },
      "connectors": {
        "hallAnchor": "hall_creative",
        "elevatorAnchor": "elevator_creative",
        "stairsAnchor": "stairs_creative",
        "windowAnchors": ["window_creative_1"],
        "entryGateAnchor": null        // 1F만 "arrival_gate" 보유
      },
      "rooms": [ /* §10 Room 표준 객체 배열 */ ],
      "menuLinks": [                   // 층/구역 클릭 네비게이션 인덱스 (§3, §10)
        { "roomId": "studio", "view": "newsroom", "label": "뉴스룸 열기" }
      ],
      "visitRules": [                  // §11 방문 규칙 ID 또는 인라인 룰 참조
        "rule-creative-studio-briefing",
        "rule-creative-cinema-evening",
        "rule-creative-kids-weekend"
      ],
      "liveFeatures": {                // 과거 floor.id==='4f'/'2f'/'1f' 조건문 대체용 선언적 플래그
        "supportsExecutiveMeeting": false,
        "supportsPublicVisitors": false,
        "supportsPhoneCompactFootClamp": false
      }
    }
  ]
}
```

### 9.2 현재 코드·데이터·테스트의 층 수·층 ID 하드코딩 전수 조사표

실제 파일에서 직접 확인한 **층 수(`5`, `4`) 및 층 ID(`'1f'..'5f'`, `/^[1-5]f$/`, `parseInt(floor)`) 하드코딩 목록**입니다.

#### A. 런타임 JS ([hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js))

| 줄 번호 | 현재 코드 / 패턴 | 하드코딩 내용 | Registry 전환 목표 |
| --- | --- | --- | --- |
| L16 | `canon.contractVersion==='spatial-216-v1'&&canon.anchors.length===326` | Canon 버전 및 326 앵커 고정 | Canon v2 검증 + `sum(floor anchors)` |
| L60-62 | `floor.id==='5f'&&floor.nightBackground&&officeLight(now).rooftopNight` | `'5f'`만 밤 배경 허용 | `Boolean(floor.nightBackground)&&isNightWindow(floor,now)` |
| L87 | `/^[1-5]f$/.test(row.floor)` | 드라마 floor ID를 `1f..5f`만 허용 | `registry.hasFloor(row.floor)` |
| L226 | `FLOOR_ART={"1f":...,"3f":"./assets/building/floor-3f-215.webp",...,"5f":...}` | 5개 층 fallback 경로 맵 | Registry `floor.art.background` 기본값 사용 (`3f` `218` 정합) |
| L228-233 | `legacyFloors=[4f,3f,2f,1f]` | Canon 미로드 시 4층만 fallback | Registry 기본 번들(`5f/6f` 포함) |
| L238-280 | `legacySeatMaps`, `legacySurfaces` (`"1f".."4f"`) | 4층 좌석/표면 맵 | Registry 기반 생성 |
| L283 | `legacyFloors.find(l=>l.id===f.id)?.tint||'#9cbd9a'` | 4층 외 틴트 일괄 fallback | `floor.art.fallbackTint` |
| L1150, 1181, 1185, 1197 | `floor==='1f'` (342px 폰 발 경계 보정) | `1f` 전용 발 경계 예외 | `floor.liveFeatures.phoneFootBounds` |
| L1452-1454 | `card.id==='cafe-1f'||card.floor==='5f'` | 주간 휴식 가중치에 `'5f'`(옥상) 직접 비교 | `floor.category==='rooftop'` 또는 `place.dayBias` |
| L1559, 1586 | `card.floor!=='1f'` / `floor==='1f'` | 1F 카페·로비 예외 분기 | `room.access==='public'` |
| L1655 | `['sofa-3f','coffee-1f','garden-5f','pantry-seats-2f']` | 회장님 순찰 4개 거점 고정 | Registry `patrolTargets` 또는 `floor.patrolSlots` |
| L1756, 1759 | `floor==='1f'` (`reserveHosts`) | 1F 방문객 호스트 고정 | `room.supportsVisitors` |
| L1869, 1911 | `p.home.floor==='1f'`, `(c.floor==='2f'?3:2)` | 심부름 재시도 및 2F 정원 예외 | `floor.errandCap` |
| L1998 | `{'3f':...,'1f':...,'5f':'옥상 정원 산책 중','2f':...}[state.floor]` | 순찰 중 대사 맵 | `floor.patrolStatusLine` |
| L2037 | `chair?.floor==='4f'` | 회장님 재실 인사 층 | `chairSeat.floor` (CEO 홈 층 동적 참조) |
| L2113, 2122-2125 | `f.id==='1f'`, `'rooftop'->'terrace-5f'`, `'cafe'->'coffee-1f'` | 수다 시간대·장소 4종 매핑 | Registry `chatLocationAlias` |
| L2388-2396 | `pet-cat:[12,17,'5f']`, `npc-cleaner:[15,18,'5f']`, `npc-gardener:[8,18,'5f']` | 고양이·청소·정원사 시간표에 `'5f'` 옥상 하드코딩 | `residentRule`에 `floorId` 또는 `category:'rooftop'` 매핑 |
| L3124 | 바리스타 peer `floor:'1f'` | 바리스타 소속 층 | 바리스타 place의 `floor` 조회 |
| L3235 | `['4f','3f','1f','2f','2f'][person.atlasRow]` | 퇴근 후 오프듀티 층 배열 | `person.homeFloor` 또는 Registry |
| L3246 | `phase==='1f'`, `phase==='5f'?'꽃이다!!'` | 남매 순찰 층별 대사 | `floor.kidsPatrolReaction` / Rule |
| L3488-3494 | `residentFurniture={'1f':..., '5f':...}` | 주민 가구 회피 사각형 맵 | `floor.noWalk` / `room.residentAvoid` |
| L3497-3518 | `residentStops` (`'1f'..'5f'`, `resident_cat_roof` 등) | 주민 정지점 층별 목록 | `floor.residentStops` |
| L3819, 3839 | `/옥상\|정원\|테라스/`, `/^(?:coffee\|cafe\|pantry\|sofa\|garden\|terrace\|window)-/` | 활동 아이콘/상태 정규식 | `room.activityKind` (`studio`/`library`/`fitness`/`lounge`/`rooftop`) |
| L4106, 4130 | `activeFloor==='1f'` (`queenFrame`, `barista`) | 1F 전용 액자·바리스타 렌더 | `floor.liveFeatures.hasLobbyFrame` / `hasBarista` |
| L4168-4187 | `xmas-lights` on `'5f'`, `lantern` on `'5f'`, 기타 `'1f'..'3f'` | 계절/상시 라이브 소품 층 매핑 | `prop.floorId` (Registry/소품 정의) |
| L4202 | `let activeFloor="4f", returnFloor="4f"` | 초기 진입 층 고정 | `registry.defaultFloorId` (`"4f"`) |
| L4442 | `if(floor.id==='3f')foregrounds[0].src=background` | 3F 전용 전경 마스크 슬롯 | `floor.art.foregroundMasks` 배열 순회 |
| L4466-4467 | `activeFloor==="2f"`, `activeFloor==='4f'` | 회의/MIR 오버라이드 분기 | `floor.liveFeatures.supportsMeeting` / `hasMir` |

#### B. 스타일 CSS · HTML · 기타 JS · 정적 JSON

| 파일 | 줄 번호 | 하드코딩 내용 | Registry 전환 목표 |
| --- | --- | --- | --- |
| [hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.css#L42) | L42 | `grid-template-columns:repeat(5,minmax(0,1fr))` | `--hani-floor-cols` CSS 변수 (JS가 `Math.min(6, floors.length)` 주입) 또는 `repeat(auto-fit,...)` |
| [hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.css#L59) | L59, L118 | 모바일 `repeat(2,...)` + `button:last-child{grid-column:1/-1}` | `last-child` 제거 → `button:nth-child(odd):last-child{grid-column:1/-1}` |
| [hani-office-live.css](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.css#L237) | L237 | `.hani-office-map[data-floor="3f"]...` | `[data-mask-mode="floor"]` 같은 범용 속성으로 교체 |
| [index.html](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/index.html#L924) | L924 | `aria-label="4F 대표실·라운지"` | 초기 마운트 시 `registry.defaultFloor.fullTitle` 동기화 |
| [hani-organization-hub.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-organization-hub.js#L35) | L35 | `floor:id==='ieum'?'4F':'2F'` | 조직도 표시 층 매핑 (필요 시 Registry 연동) |
| [office-drama-v1.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/assets/data/office-drama-v1.json) | 100개 대사 | `floor: "1f".."5f"` (옥상 의미로 `"5f"` 사용) | 안 A면 그대로 유지; 안 B면 옥상 대사를 `"6f"`/`"rooftop"`으로 이관 |
| [office-actions-221.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/assets/data/office-actions-221.json) | `groupMaxPerFloor`, `base-walk` | `{"1f":1,"2f":1,"3f":1,"4f":1,"5f":1}`, `hall_1f..5f` | Registry 층 키와 동적 병합 |

#### C. 테스트·검증 스크립트 (`scripts/*.mjs`) 고정값 표

| 테스트 파일 | 줄 번호 | 고정된 단언(Assertion) | Canon v2 / Registry 도입 시 대응 |
| --- | --- | --- | --- |
| [hani-office-lowfi-216.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-lowfi-216.mjs#L75) | L75, 185, 202, 212, 270 | `contractVersion==='spatial-216-v1'`, `c.floors.length===5`, `svg===5`, `Math.abs(parseInt(a.floor)-parseInt(b.floor))===1` | **중요!** `parseInt('creative')`/`parseInt('rooftop')`는 `NaN`이 됨! `floor.order` 차분(`Math.abs(orderA-orderB)===1`)으로 교체 필수 |
| [hani-office-onboarding-232-assertions.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-onboarding-232-assertions.mjs#L14-L26) | L14-26 | `spatial-contract.json` SHA-256 비교 + `actual.anchors.length === 326` | Canon v2 전환 시 v2 스냅샷 기준으로 갱신 |
| [hani-office-v2-215.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-v2-215.test.mjs#L19-L21) | L21, 47, 154, 164, 228, 241, 299 | `anchors.length===333`, `floors.length===5`, `['3f','2f','1f','5f','4f']`, failure 시 `4`/`5` 탭 수, `Object.keys(art.anchors).length===326`, 옥상 `people===0` | Registry `floors.length` 및 층별 합계 단언으로 갱신 |
| [hani-office-seats-215.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-seats-215.test.mjs#L86) | L86 | `['5f','4f','3f','2f','1f']` | `api.floors.map(f=>f.id)` 동적 순회로 교체 |
| [hani-office-219.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-219.test.mjs#L39) | L39, 113, 238 | `floors=['1f'..'5f']`, `priorCanon.floors` exact 비교, `[data-building-floor].length===5` | Registry 동적 층 목록 및 v2 기준 반영 |
| [hani-office-fix-218.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-fix-218.test.mjs#L57) | L57 | `['1f','2f','3f','4f']` (당시 4층) `visible.length > 0` | 상주 층(`residents.length>0`) 필터로 유지 |
| [hani-office-actions-216.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-actions-216.test.mjs#L130) | L130 | `['1f','2f','3f','4f','5f']` | `api.floors.map(f=>f.id)` |
| [hani-office-hd-224.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-hd-224.test.mjs#L83) | L83, 105, 158 | `anchors.length===333`, `['1f'..'5f']` | 합계 검증 + Registry 동적 층 목록 |
| [hani-office-tap-lines.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-tap-lines.test.mjs#L132) | L132 | `f.click('5f')` (옥상 탭 전환 테스트) | 안 A면 무변경; 안 B면 옥상 ID 적용 |
| [hani-staff-floors-214.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-staff-floors-214.test.mjs#L25) | L25, 109, 178 | `[1,2,3,4]` `floor-Nf-215`, `['4f','3f','2f','1f','5f']` (`217`/`218`) | 215/217 baseline은 역사적 핀이므로 신규 층 파일은 별도 조건 처리 |
| [hani-office-residents.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-residents.test.mjs#L134) | L134 | `['1f','2f','3f','4f','5f']` | `scene.floors.map(f=>f.id)` |
| [hani-office-companions.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-companions.test.mjs#L41-L42) | L41-42 | `floors.size === 5` (주말 펭귄 모든 층 순찰) | `floors.size === scene.floors.length`로 개선 (또는 6) |
| [hani-office-kids-visit.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-kids-visit.test.mjs#L19) | L19 | `e.card.floor==='5f'` → 치즈 1마리뿐이라는 전제 | 5F 키즈·펫 라운지가 추가되면 해당 층은 복수 대상 존재 가능; 옥상은 `'6f'`/`'rooftop'`(안 B) 또는 `'5f'`(안 A) 유지 |
| [hani-office-chairman-patrol.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-chairman-patrol.test.mjs#L20) | L20, 56, 61, 92 | 순찰 4곳 `['1f','2f','3f','5f']`, `'5f'`에서 `'꽃이다!!'` | 옥상 ID에 따라 유지(안 A) 또는 갱신(안 B) + 5F 크리에이티브 순찰 슬롯 추가 시 건수 조정 |
| [hani-office-drama.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-drama.test.mjs#L63) | L63, 109-110, 118, 197 | `[1-5]F` 파싱, `'5f'` 단서, 5층 reachability | Registry 층 집합 사용 (안 A는 무수정 통과 가능) |
| [hani-office-xmas.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-xmas.test.mjs#L26) | L26, 78, 90, 95 | `xmas-lights` 및 `lantern` `'5f'`, `['1f'..'5f']` | 안 A는 무수정 통과 가능; Registry에서 `prop.floorId` 참조 |

### 9.3 안전한 단계적 리팩터 계획 (한 번에 바꾸지 않는 5단계 순서)

1. **Stage 1 — Registry Loader 도입 (무동작 변화, Shadow Verification)**
   - `hani-office-live.js` 상단에 `buildFloorRegistry(canon, art, places, extraRegistry)`를 추가하고, 기존 5개 층(`1f..5f`)을 그대로 Registry 객체로 투영.
   - **회귀 확인**: 기존 19+개 office Node 테스트 전수 실행 → **모든 결과 100% 동일(0 diff)**.
2. **Stage 2 — 하드코딩 조건문을 Registry 속성 조회로 치환 (기존 5층 그대로)**
   - `floor.id==='5f'` → `floor.nightBackground`, `/^[1-5]f$/` → `registry.hasFloor(...)`, `3f` 마스크 → `floor.art.foregroundMasks`, CSS `repeat(5,...)` → `--hani-floor-cols` & `nth-child(odd):last-child`.
   - **회귀 확인**: 기존 Node 테스트 + Edge 390/1440px 시각 비교(pixel/overflow diff 0).
3. **Stage 3 — `order` 기반 정렬·층 간 연결(`parseInt` 제거) & 합계 검증 도입**
   - `lowfi-216.mjs` 및 `hani-office-live.js`의 `elevator`/`stairs` 인접층 판정을 `Math.abs(a.order - b.order) === 1`로 변경. `anchors.length===326`을 층별 합계 검증으로 교체.
   - **회귀 확인**: 합성 6층 mock test로 `order` 1..6 정렬 및 `4F↔5F↔6F` 경로 탐색 성공 확인.
4. **Stage 4 — `5F 라이프·크리에이티브` 데이터 + 그림 1묶음 편입 (JS 로직 수정 최소화)**
   - 새 층 데이터(방 4개, 앵커, 구역 메뉴 링크, 방문 규칙)와 `floor-5f-creative-v1.webp`만 등록부에 추가.
   - **회귀 확인**: 1~4F+옥상 기존 동작 불변 + 5F 스튜디오/도서관/피트니스/키즈·펫 4시각(아침/점심/오후/주말) 시뮬레이션 및 Edge 390/1440px 캡처.
5. **Stage 5 — 메뉴 클릭 위임 & 최종 QA**
   - 방 표지판/핫스팟 클릭 → `showView(...)` 연결, `localStorage` write 0, `closure <= 200`, `best-of-three < 400ms` 성능 검증.

---

## 10. [표준] 구역(Room) 데이터 표준

### 10.1 Room 표준 스키마

모든 층의 모든 구역은 아래 공통 형식을 따릅니다. (구역 이름 규칙: `floorId`는 소문자/숫자 `1f`, `creative`, `b1` / `room.id`는 `snake_case` 명사구, 앵커 ID는 `<roomId>_<slot>` 또는 `<kind>_<roomId>`).

```jsonc
{
  "id": "studio",                      // 층 내 고유 snake_case ID (전체 식별은 "creative/studio")
  "floor": "creative",                 // 소속 Floor Registry id
  "label": "방송 스튜디오",              // UI/표지판 표시명 (한글)
  "english": "HANI STUDIO",            // HTML 표지판 보조 영문
  "kind": "media",                     // "work" | "meeting" | "lounge" | "public" | "media" | "study" | "fitness" | "kids_pet" | "server" | "rooftop" | "utility"
  "access": "staff",                   // "all" | "public" | "staff" | "staff_authorized" | "family_pet"
  "boundsSchematic": { "x": 40, "y": 50, "w": 390, "h": 250 },       // 1000×640 도식 좌표
  "boundsArtPct": [2.4, 7.8, 25.7, 46.8],                            // 1672×941 아트 위 % 박스 [left, top, right, bottom]
  "door": { "anchorId": "door_studio", "width": 44, "x": 235, "y": 300 },
  "junctionAnchor": "junction_studio",
  "plate": { "x": 23.5, "y": 9.2, "mount": "wall", "rotate": 0, "skew": -1, "ink": "#ffffff" },
  "capacity": 4,                       // 동시 점유 가능한 최대 액터 수 (좌석/스팟 수와 일치)
  "slots": [                           // 구역 내 실제 착석/정지 앵커 ID 목록
    { "anchorId": "studio_anchor_a", "zone": "desk", "pose": "sitting", "role": "anchor" },
    { "anchorId": "studio_anchor_b", "zone": "desk", "pose": "sitting", "role": "guest" },
    { "anchorId": "studio_camera",   "zone": "work", "pose": "standing", "role": "camera" },
    { "anchorId": "studio_4cut",     "zone": "lounge", "pose": "standing", "role": "4cut" }
  ],
  "propActions": [                     // 구역 내 소품/오브젝트 연출 정의
    { "id": "onair-lamp", "atlas": "creative-props-v1", "trigger": "whenRoomOccupied", "pose": "pulse" }
  ],
  "menuLink": {                        // 클릭 시 앱 화면 연결 (§3)
    "primaryView": "newsroom",
    "choices": [
      { "view": "ilbo", "label": "HANI 일보" },
      { "view": "newsroom", "label": "뉴스룸" },
      { "view": "investmentCommittee", "label": "시황 4컷" }
    ],
    "hotspotPct": [4.0, 12.0, 24.0, 44.0]
  },
  "eventHooks": ["daily_ilbo_recording", "friday_4cut_shoot"]       // 연결 가능한 이벤트/규칙 ID
}
```

### 10.2 기존 1F · 옥상 구역을 Room 표준으로 표현한 예시 2건

실제 [spatial-contract.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/data/hani-building/spatial-contract.json#L1706-L1718) 및 [office-places.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/data/hani-building/office-places.json)의 실측 데이터를 표준 포맷으로 변환한 예시입니다.

#### 예시 1: 1F `HANI Coffee` (`1f/cafe`)
```json
{
  "id": "cafe",
  "floor": "1f",
  "label": "HANI Coffee",
  "english": "HANI COFFEE",
  "kind": "lounge",
  "access": "public",
  "boundsSchematic": { "x": 570, "y": 360, "w": 280, "h": 240 },
  "door": { "anchorId": "door_cafe", "width": 44, "x": 710, "y": 360 },
  "junctionAnchor": "junction_cafe",
  "capacity": 5,
  "slots": [
    { "anchorId": "coffee_counter", "zone": "lounge", "pose": "standing", "role": "order" },
    { "anchorId": "lobby-nw", "zone": "lounge", "pose": "sitting", "role": "seat" },
    { "anchorId": "lobby-ne", "zone": "lounge", "pose": "sitting", "role": "seat" },
    { "anchorId": "lobby-sw", "zone": "lounge", "pose": "sitting", "role": "seat" },
    { "anchorId": "lobby-se", "zone": "lounge", "pose": "sitting", "role": "seat" }
  ],
  "propActions": [
    { "id": "coffee-steam", "atlas": "./assets/office-props/coffee-steam.webp", "trigger": "alwaysDaytime" }
  ],
  "menuLink": null,
  "eventHooks": ["friday_camera", "staff_chat_barista", "visitor_coffee_guest"]
}
```

#### 예시 2: 옥상 `루프톱 가든` (`5f/garden` → 옥상 `6F`)
```json
{
  "id": "garden",
  "floor": "5f",
  "label": "루프톱 가든",
  "english": "ROOFTOP GARDEN",
  "kind": "rooftop",
  "access": "staff",
  "boundsSchematic": { "x": 40, "y": 50, "w": 390, "h": 250 },
  "door": { "anchorId": "door_garden", "width": 44, "x": 235, "y": 300 },
  "junctionAnchor": "junction_garden",
  "capacity": 1,
  "slots": [
    { "anchorId": "rooftop_garden", "zone": "lounge", "pose": "standing", "role": "stroll" }
  ],
  "propActions": [
    { "id": "lantern", "atlas": "./assets/office-props/lantern-flicker.webp", "trigger": "nightWindow" },
    { "id": "xmas-lights", "atlas": "./assets/office-season/xmas.webp", "trigger": "season_dec_01_26" }
  ],
  "menuLink": null,
  "eventHooks": ["chairman_patrol_rooftop", "resident_cat_roof", "resident_gardener"]
}
```

---

## 11. [표준] 방문 규칙 엔진 표준

### 11.1 방문 규칙 데이터 스키마 (`visit-rules-v1`)

기존 `actions-216/221` 및 `residentPeople` / `companionSnapshot`이 JS 코드 안에 흩어져 있던 조건문("누가/언제/어디로")을 아래 선언형 규칙 구조로 통합합니다.

```jsonc
{
  "id": "rule-creative-studio-briefing",
  "floorId": "creative",
  "roomId": "studio",
  "category": "program",               // "summon" | "event" | "patrol" | "program" | "outing" | "resident"
  "priority": 40,                      // 높을수록 우선 (§11.2 우선순위 표)
  "who": {
    "required": ["minji"],             // 전원 출근(presentAt) & 유휴 상태여야 실행
    "optional": ["jieun", "hani", "daon"],
    "maxParticipants": 3               // 규칙 당 인원 상한
  },
  "when": {
    "days": "weekday",                 // "daily" | "weekday" | "weekend" | [1..5]
    "timeWindows": [["08:40", "09:15"], ["15:00", "15:40"]], // KST 시작 포함/종료 미포함
    "season": null                     // 예: "12-01..12-26" 또는 null
  },
  "trigger": {
    "mode": "deterministic_slot",      // "deterministic_slot" | "daily_prob" | "always_if_present" | "input_adapter"
    "probability": 0.45,               // hash(KST day | rule.id) % 10000 / 10000 < probability
    "condition": null                  // 허용 연산자 eq/gte/lte/isTrue만 사용 (eval 금지)
  },
  "where": {
    "anchors": ["studio_anchor_a", "studio_camera", "studio_anchor_b"],
    "poseByRole": { "minji": "standing", "default": "sitting" }
  },
  "durationSeconds": [600, 1200],
  "cooldowns": {
    "ruleSeconds": 10800,
    "personNonWorkSeconds": 2700,      // 기존 221 불변식: 개인 비업무 휴식 간격 ≥ 45분
    "crossFloorSeconds": 5400          // 기존 221 불변식: 타층 이동 간격 ≥ 90분
  },
  "lines": [
    "오늘 뉴스룸 브리핑 큐 점검 중!",
    "시황 4컷 컷 구성 확인 중!"
  ]
}
```

### 11.2 최대 인원 규칙 (`4 + N`) 및 충돌 시 우선순위 원칙

- **층별 동시 최대 인원 `4 + N` 원칙**:
  - **상주 기본 정원(`Base`)**: 해당 층의 실제 고정 `homeAnchor` 상주 인원 (예: 1F=2, 2F=8, 3F=5, 4F=5, **5F=0**, 옥상=0). 단, 방문형 층(5F·옥상)은 과밀 방지를 위해 **방문 슬롯 `Base(유효 상주 0) + N(최대 4)` = 총 4명(특수 이벤트·주말 동행 시 최대 4+2명)**으로 제한하여 390px 모바일 화면의 이름표/말풍선 가독성과 10% 미만 겹침 규약을 보장합니다.
  - 이미 8명이 상주하는 2F 같은 층은 회의(6석)·외부 방문 합산 시 기존 `hani-building-overflow` 보호 및 `fitStatusLabels` 동적 우선순위 숨김(말풍선 > 회의 > 이동/일반 상태)을 그대로 적용합니다.

- **기존 층 규칙과의 우선순위 원칙 (높은 번호가 낮은 번호를 선점·취소)**:

| 순위 | 계층 | 대표 예시 | 충돌 시 처리 원칙 |
| --- | --- | --- | --- |
| **1 (최상)** | 실시간 회의 소집 (`Agent Case`) | `SUMMONING` / 임원·팀 회의 | 스튜디오/피트니스/옥상에 있더라도 즉시 회수 후 회의실로 이동 |
| **2** | 부재·심야 재실 경계 | `02:00~06:59` 심야 5인만 남음 / 회장님 `absent` | 5F 프로그램·주말 남매 전부 비활성, 심야 5인(`dohyun`,`minji`,`mir`,`seoyun`,`yuna`)만 허용 |
| **3** | 확정 특수 이벤트 · 생일 | `market_shock`, `release_eve`, 직원 생일 | 정해진 시점에 우선 예약(`participantLock`으로 5F 일반 규칙 양보) |
| **4** | **새 층(5F) 프로그램 규칙 & 회장 순찰** | 일보/4컷 촬영, 도서관 학습, 주말 남매 5F 방문 | 기존 일일 스케줄러 `plan()` 단계에서 2층·4층 외출 슬롯과 동일 자원으로 예약(개인 `2700s`/`5400s` 쿨다운 적용) |
| **5** | 일상 외출(`outing`) & 직원 수다(`staffChat`) | 카페·팬트리·옥상 휴식, 잠깐 수다 40종 | 상위 `1~4` 순위가 점유한 인물/앵커는 건너뛰고 남은 슬롯만 사용 |
| **6 (최하)** | 기본 근무 (`base-work`) | 각자 1~4F `homeAnchor` 착석 | 위 모든 일정이 없을 때 기본 복귀 자리 |

---

## 12. [표준] 그림 제작 표준 및 주문서 템플릿

### 12.1 전 층 공통 규격 (Art Spec Canon)

| 항목 | 표준 규격 | 근거 |
| --- | --- | --- |
| **캔버스 해상도** | **1672 × 941 px** (16:9 등각) | [art-map-v1.json](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/data/hani-building/art-map-v1.json), [hani-office-v2-215.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-v2-215.test.mjs#L114) |
| **포맷 및 파일 용량** | WebP (`<= 240,000 B` 배경 / `<= 70,000 B` 전경 마스크 / `<= 60,000 B` 소품 시트) | 217 포맷 기준 + closure 25MB/200파일 예산 |
| **시점 & 소실점** | 정면 하향 등각(Top-down Isometric) — 좌우 벽선 대칭, 수직선(기둥/문틀) 수직 유지 | `floor-2f-217.webp`, `floor-3f-218.webp`, `floor-4f-217.webp` 공통 |
| **바닥 높이 & 복도 밴드** | 중앙 가로 공용 복도 밴드 중심 `y ≈ 47%..56%` (도식 `y: 300..360` 대응), 외벽 상단 여백 확보 | 층 전환 시 복도 위치 점프 방지 |
| **엘리베이터·계단 코어 좌표** | 우측 끝단 고정 (`x ≈ 88%..97%`, 승강기 문 중심 `x ≈ 92.5%`, `y ≈ 37.5%`) | 1~4F·5F·6F 전 층 수직 코어 시각 일치 |
| **표지판/텍스트** | **아트에 한글/영문 글자 직접 삽입 금지** (브랜드 CI 예외 외). 표지판 자리만 비워 두고 HTML `.hani-office-room-plate` 렌더링 | 217 HTML 표지판 규약, 다국어/접근성/선명도 유지 |
| **조명 3종 규격** | 1) **낮(Day)**: 맑은 주광 + 은은한 그림자 (1~4F·5F 기본)<br>2) **노을(Sunset)**: `floor-5f-217.webp` 옥상 주황/보라 햇살<br>3) **밤(Night)**: `floor-5f-night-243.webp` 남색 야경 + 따뜻한 실내 포인트 라이트 (`18:30~05:59` 자동 전환) | [hani-office-xmas.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-xmas.test.mjs#L91) 야간 창 경계 일치 |
| **스타일 참조 세트** | `floor-2f-217.webp`(4실 분할), `floor-3f-218.webp`(디바이스), `floor-4f-217.webp`(라운지), `floor-5f-night-243.webp`(밤) | 파스텔·클린 라인·과도한 블랙/네온 지양 |

### 12.2 아트 납품 검수 체크리스트 (나란히 비교 필수)
납품 후 코드 연결 전, 반드시 **기존 `floor-2f-217.webp` 또는 `floor-4f-217.webp`와 50% 반투명/나란히 비교판 이미지**를 만들어 다음 7항목을 확인합니다.
- [ ] 해상도가 정확히 `1672×941` WebP이며 `<= 240KB`인가?
- [ ] 우측 엘리베이터 문·계단 코어가 기존 `2F/4F`와 픽셀 위치가 일치하는가?
- [ ] 중앙 복도 높이·폭이 기존 층과 이질감 없이 이어지는가?
- [ ] 그림 안에 구운 한글/영문 방 간판 텍스트가 **0개**인가?
- [ ] 모든 좌석/서기 앵커 위에 `48×64` 비율 치비 캐릭터를 얹었을 때 머리·이름표가 벽 상단이나 표지판 위치를 가리지 않는가?
- [ ] 전경 마스크를 쓴 경우, 투명 알파 외곽선이 깨지지 않았고(`VP8X` alpha) 가려야 할 책상 상판/팔걸이만 포함했는가?
- [ ] 다크 모드(`midnight-black`) 및 라이트 모드(`cream`) 배경 위에서도 화면 대비가 자연스러운가?

### 12.3 재사용 "층 그림 주문서 템플릿"

> 아래 양식을 복사해 새 층(예: B1 주차장, 6F 연구동 등) 발주 시 그대로 사용합니다.

```markdown
## 층 그림 주문서: [<층 코드> <층 이름>]
- **파일명**: `assets/building/floor-<id>-v1.webp` (+ 밤 버전 필요 시 `-night-v1.webp`)
- **규격**: 1672×941 px WebP, ≤ 240KB (전경 마스크 필요 시 1672×941 투명 WebP ≤ 70KB)
- **레퍼런스**: `floor-2f-217.webp`(구획·책상), `floor-4f-217.webp`(라운지), `floor-5f-night-243.webp`(밤 조명)
- **필수 고정 구조**: 우측 엘리베이터/계단 코어(x 88~97%) + 중앙 복도(44px 문 4개 연결)
- **4개 구역 구성**:
  1. [NW] <구역명>: <핵심 가구·소품>, 좌석 슬롯 <N>개
  2. [NE] <구역명>: <핵심 가구·소품>, 좌석 슬롯 <N>개
  3. [SW] <구역명>: <핵심 가구·소품>, 좌석 슬롯 <N>개
  4. [SE] <구역명>: <핵심 가구·소품>, 좌석 슬롯 <N>개
- **절대 금지**: 아트에 한글/영문 간판 텍스트 삽입 금지 (HTML 표지판용 빈 벽면만 남길 것)
- **검수 방법**: `floor-2f-217.webp`와 나란히/오버레이 비교 PNG + 치비 캐릭터 합성 1장 첨부
```

---

## 13. [표준] Spatial Canon 변경 관리

### 13.1 Canon 버전 개정 절차 (`spatial-216-v1` → `spatial-225-v2`)
1. **변경 제안서 작성**: 추가/변경되는 층, 방, 앵커, 간선 목록과 기존 `homeAnchor` 보존 여부 증명(20명 기존 좌석 불변 원칙).
2. **하위 호환·저장 데이터 0 영향 검증**: `hani_os_life_v23` / `hani_office_affinity_v1`에 층 ID 저장이 없음을 체크리스트로 재확인.
3. **고정 해시/어설션 이관**: [hani-office-onboarding-232-assertions.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-onboarding-232-assertions.mjs)의 v1 SHA-256 비교를 v2 계약 검증으로 업데이트.
4. **승인 및 동결**: 서윤 기술 검토 → **하니 전무님 Spatial v2 승인** → **회장님 최종 승인** → 동결(`contractVersion` 갱신).

### 13.2 앵커 수 계약 전환: '고정 326' → '층별 합계 및 무결성 검증'

현재 [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js#L16)의 `canon.anchors.length === 326` 단일 숫자는 5F만 추가해도 즉시 깨져 V2 전체를 4층 레거시로 무력화시킵니다. 이를 다음 **불변식 검증 함수**로 교체합니다.

1. **합계 일치**: `sum(floor.expectedAnchorCount for floor in registry.floors) === canon.anchors.length` (각 층 메타데이터에 자기 층 앵커 수 선언 + 런타임 보강 앵커 수 별도 합산).
2. **고유성**: `new Set(canon.anchors.map(a => a.id)).size === canon.anchors.length` (중복 0).
3. **그래프 연결성**: 모든 층에 `elevator_<id>`, `stairs_<id>`, `hall_<id>` 존재, 인접 층(`|orderA - orderB| === 1`) 간 승강기/계단 간선 연결, 모든 `rendererSeat`가 자기 층 `elevator_<id>`로부터 `stairs` 제외 최단 경로 도달 가능([hani-office-v2-215.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-v2-215.test.mjs#L49-L54) 방식 그대로 확장).
4. **기존 1~4F 앵커 보존**: 회귀 가드로 "기존 `1f..4f` 앵커 ID 집합이 v2에서도 100% 보존되는가"를 검사하면 숫자 326에 얽매이지 않고도 삭제 사고를 막을 수 있습니다.

- **예상 위험 및 시험 영향**: v1 전용 고정 테스트(`326`/`333` 비교) 4곳([hani-office-v2-215.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-v2-215.test.mjs#L21), [hani-office-hd-224.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-hd-224.test.mjs#L105), [hani-join-ieum.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-join-ieum.test.mjs#L38), [hani-office-onboarding-232-assertions.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-office-onboarding-232-assertions.mjs#L25))만 v2 합계 검증 어설션으로 동시 갱신하면 해결됩니다.

### 13.3 결정 기록 형식 (Building Canon ADR)
향후 모든 건물 변경은 `docs/development-history/DECISIONS.md`에 다음 최소 포맷으로 남깁니다.
- `ID`: `D-YYYYMMDD-XX` / `Canon`: `spatial-225-v2`
- `변경 대상`: 층 ID / 방 ID / 앵커 증감(`+N`, 기존 1~4F 보존 여부)
- `승인자`: 회장님 / 하니 전무 / 서윤
- `영향 범위`: closure 파일 수 변화(`현재/200`), 저장 데이터 영향(`0` 확인)

---

## 14. [표준] 향후 확장 예시 4종

위 표준 체계(Floor Registry + Room + Rule Engine + Art Spec)가 구축되면, 이후 아래 4가지 확장은 **핵심 런타임 로직을 고치지 않고** 그림 + 데이터 추가만으로 적용할 수 있습니다.

### 14.1 지하 주차장 / 창고 (`B1`)
- **필요한 데이터**: Floor Registry에 `id: "b1"`, `order: 0`(또는 `-1`), `code: "B1"`, `category: "utility"`, 구역 `parking`/`storage` 등록; `edges`에 `elevator_b1 ↔ elevator_1f` 연결; `visitRules`에 출퇴근 시간 `arrive`/`leave` 경유 또는 택배·비품 점검(`haru`, `npc-cleaner`) 규칙 2개 추가.
- **필요한 그림**: `floor-b1-v1.webp` (`1672×941`, 우측 엘리베이터 코어 정렬 + 지하 주차면/랙 선반) 1장 (+1 파일).

### 14.2 계절 한정 층 장식 (봄 벚꽃 · 여름 비치 · 가을 단풍 · 겨울 트리)
- **필요한 데이터**: `liveProps` / `art.seasonalOverlays[]` 데이터 배열에 `{ "id": "cherry-blossom", "floorId": "5f", "season": "04-01..04-15", "rect": [...], "atlas": "./assets/office-season/seasons-v1.webp" }` 항목만 추가(현재 [hani-office-live.js](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/hani-office-live.js#L4168-L4172)의 `xmas-lights`처럼 JS에 개별 시즌 날짜 분기를 추가할 필요 없음).
- **필요한 그림**: 기존 `xmas.webp`를 사계절 통합 atlas 1장(`seasons-v1.webp`, file 수 증가 0)으로 확장하거나 시즌별 1장씩만 추가.

### 14.3 층별 밤 조명 (1~5F 전체 야간 조명)
- **필요한 데이터**: 각 층 Registry `art.nightBackground` 필드에 야간 파일 경로만 채우면(예: `"./assets/building/floor-3f-night-v1.webp"`), Stage 2에서 일반화한 `Boolean(floor.nightBackground)&&isNightWindow(...)`가 추가 코드 0줄로 자동 전환.
- **필요한 그림**: 야간 조명이 필요한 층의 `1672×941` 밤 버전 배경 WebP 각 1장 (기존 낮 배경의 명도/색온도 다운 + 모니터·스탠드 발광 레이어 합성).

### 14.4 새 직원 입사 시 자리 추가
- **필요한 데이터**: (1) `spatial-contract.json` `people[]`에 직원 등록 + 빈 여유석(`freeDesks`, 예: 2F `finance-row-spare`)의 `anchor`를 `homeAnchor`로 바인딩, (2) 해당 층 `art.homeFurniture` label 갱신, (3) `office-tap-lines-v1.json` · `office-places.json` 대사 풀 추가 (기존 [hani-join-ieum.test.mjs](file:///C:/Users/%ED%99%8D%EC%84%B1%EB%AF%BC/Documents/HANI_OS_DEV_CLAUDE/floor5/scripts/hani-join-ieum.test.mjs) 절차와 동일하며 `anchors.length` 합계 검증으로 326 충돌 없음).
- **필요한 그림**: 기존 여유석을 쓰면 **배경 수정 0장**; 신규 책상 소품 1개(선택) + 신규 직원 치비 sprite 1장 (`assets/sprites-v3/<id>.webp`, 384×512 기준 3×) + 프로필 3종 (`720/256/128`).
