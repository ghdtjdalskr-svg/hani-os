# 대공사 Phase 4용 '살아 있는 회사' 대사·장면 초안 (`building-story-pack-v1`)

- **문서 구분**: Phase 4 행동 엔진·NPC·Live-Ops 정적 데이터 초안 (운영 코드/저장 데이터 미수정)
- **작성**: 세린 연구원 (Gemini)
- **기반 설계**: [building-master-plan-v2.md](../design/building-master-plan-v2.md) §4·§6, [building-liveops-v1.md](../design/building-liveops-v1.md) TOP 3, [new-staff-voice-guide-v1.md](new-staff-voice-guide-v1.md)
- **데이터 파일**: [building-story-pack-v1.json](building-story-pack-v1.json)

---

## 회장님용 요약 3줄

1. **전 직원 20명과 신규 NPC 6명이 건물 전체(1F `HANI 24` 편의점~5F 크리에이티브~6F 옥상)를 오가며 살아 움직이는 대사·행동 팩 초안을 완성했습니다.**
2. **기업솔루션(수아·채원) 2F 이사, 부서 동물 평소 부서 상주(점심·주말·이벤트 외출 5장면), 회장님 전용 강아지(`chairmanDog`) 동행 3장면을 모두 반영했습니다.**
3. **12월~2월 12주치 편의점 1+1·카페 신메뉴·주간 갓생 미션까지 포함했으며, 모든 대사는 30자 이내 쉬운 우리말로 작성해 AI 호출·저장 없이 바로 쓸 수 있습니다.**

---

## 1. 회장님 결정 반영 체크리스트

| 결정 항목 | 반영 내용 |
| --- | --- |
| **1F 편의점 & 교대 점원** | 편의점 공식 명칭 `HANI 24`, 주간 점원(`npc-conv-day`, 07~19시) · 야간 점원(`npc-conv-night`, 19~07시) 반영 |
| **기업솔루션 2F 이사** | 수아(`sua`) · 채원(`taeo`) 홈 거점을 `2F`로 반영하고, 2F 이웃 인사·이사 기념 떡 장면 수록 |
| **부서 동물 외출 규칙** | 평소 자기 부서(3F 펭귄, 2F 수달·병아리·여우)에만 머물고, 점심·주말·이벤트 때만 외출(`rare-01`~`rare-05`) |
| **회장님 전용 강아지** | 기존 개구리 동행 자리를 이어받아 `"chairmanDog"` 자리표시자로 3개 희귀 장면(`rare-06`~`rare-08`) 수록 |
| **호칭 · 표현 안전** | 회장님 = 공식 개구리 성민 회장, 호칭은 `"회장님"`만 사용(애칭 금지). 수현·수연 남매는 경쟁·투표 제외, 연애·외모 얘기 제외 |
| **문체 · 길이 · 비용** | 직원별 기존 말투 유지, 모든 대사 30자 이내, 이모지 적당히 사용, `localStorage`/AI 호출 0의 순수 정적 데이터 |

---

## 2. 데이터 규모 요약

| 섹션 | JSON 키 | 수량 | 세부 내용 |
| --- | --- | --- | --- |
| **1. 직원 하루 이야기** | `microArcs` | **40개** | 직원 20명 × 각 2개 (2~3단계 이동·동작·대사, 시간대·1F~6F 층 포함) |
| **2. 단짝 어울리기** | `buddyOutings` | **15조합** | 15개 2인 조합 × 4턴 티키타카 대화 (장소·층·시간대 포함) |
| **3. 신규 NPC 6명** | `npcs` | **6명** | 주간 점원·야간 점원·경비·스튜디오 스태프·트레이너·사서 (각 혼잣말 6줄 + 직원 케미 4세트) |
| **4. 사내 이벤트 반응** | `eventReactions` | **8종 (64줄)** | 배포일·일보일·금요 4컷·퀸 시즌·생일·12월 크리스마스·1월 THAW 티저·2월 THAW 각 8줄 |
| **5. 희귀 장면 도감** | `rareScenes` | **20개** | 부서 동물 외출 5개 + `chairmanDog` 3개 + 직원·NPC·4펫·남매 12개 (조건·확률·쿨다운·2~4줄 대사) |
| **6. 편의점·카페 신메뉴** | `storefront.weeks` | **12주치** | 12월~2월 계절감 반영 `HANI 24` 1+1 상품 12종 + `HANI Coffee` 신메뉴 12종 + 직원 품평 |
| **7. 주간 갓생 미션** | `weeklyMissions` | **12주치** | 걸음·독서·시청·가계부·운동·일기·퀴즈 부담 없는 목표 + 달성 시 주말 회사 축하 이벤트 한 줄 |

---

## 3. JSON 키 구조 설명 (`building-story-pack-v1.json`)

```text
building-story-pack-v1.json
├── schemaVersion        // "building-story-pack-v1"
├── status               // "draft"
├── phase                // "Phase 4"
├── meta                 // 기준 규칙 (회장님 호칭·chairmanDog 자리표시자·HANI 24·2F 이사·제약)
│
├── microArcs[]          // [40개] 직원 하루 이야기 시퀀스
│   ├── id               // 예: "arc-seoyun-1"
│   ├── staffId / staffName
│   ├── title            // 시퀀스 제목
│   ├── timeSlot         // "morning" | "lunch" | "afternoon" | "evening" | "night"
│   └── steps[]          // 2~3단계: { step, floor("1F".."6F"), zone, action, line(<=30자) }
│
├── buddyOutings[]       // [15개] 단짝 어울리기 3~4턴 대화
│   ├── id               // 예: "buddy-06"
│   ├── aId / aName / bId / bName
│   ├── floor / zone / timeSlot
│   └── turns[]          // [{ speaker, text(<=30자) }]
│
├── npcs[]               // [6명] 비직원 NPC (명부·친밀도·투표 비대상)
│   ├── id / name / role / floor / zone / hours
│   ├── personality      // 성격 한 줄 설명
│   ├── monologues[]     // 혼잣말 6줄 (각 <=30자)
│   └── chemistries[]    // 직원 케미 4세트: { staffId, staffName, turns[{ speaker, text }] }
│
├── eventReactions       // [8종] 사내 이벤트·계절 반응 (각 8줄)
│   ├── deployDay[]      // { speakerId, speakerName, floor, text(<=30자) }
│   ├── ilboDay[]
│   ├── friday4Cut[]
│   ├── queenSeason[]
│   ├── birthday[]
│   ├── seasonDecXmas[]
│   ├── seasonJanThawTeaser[]
│   └── seasonFebThaw[]
│
├── rareScenes[]         // [20개] 희귀 장면 도감 데이터
│   ├── id / title       // 도감 표시용 제목
│   ├── category         // "department_animal_outing"(5) | "chairman_dog"(3) | "staff_rare"(12)
│   ├── condition        // { days, time, floor, actors[] }
│   ├── probability      // 출현 확률 (0.03 ~ 0.05)
│   ├── cooldownDays     // 재등장 주기 (3 ~ 7일)
│   └── lines[]          // 2~4줄: { speakerId, speakerName, text(<=30자) }
│
├── storefront.weeks[]   // [12주] 12월~2월 주간 편의점 1+1 + 카페 신메뉴
│   ├── week / month / periodLabel
│   ├── hani24OnePlusOne // { item, emoji, priceNote, clerkLine, staffReview{ staffId, staffName, line } }
│   └── cafeNewMenu      // { item, emoji, temp, barista, baristaLine, staffReview{ staffId, staffName, line } }
│
└── weeklyMissions[]     // [12주] 주간 갓생 미션 + 주말 축하 이벤트
    ├── week / month / theme
    ├── mission          // { title, category, targetSummary, easyCutline }
    └── weekendEvent     // { title, floor, zone, celebrationLine(<=30자) }
```

> **참고 (`chairmanDog` & 부서 동물)**:
> - 회장님 전용 강아지는 견종·이름 확정 전까지 `"chairmanDog"` ID와 `"회장님 강아지"` 표시명으로 분리해 두었으므로, 추후 확정 시 문자열 치환만으로 반영할 수 있습니다.
> - 부서 동물(꼬마 펭귄·아기 수달·병아리·아기 여우)은 평소 각 부서(3F·2F)에 상주하고 `rare-01`~`rare-05` 조건에서만 외출합니다.

---

## 4. 샘플 10줄 미리보기

| 구분 | 화자 · 장소 | 대사 미리보기 |
| --- | --- | --- |
| **직원 하루** | **도연** (1F HANI 24 · 야간) | `"물 붓고 3분 테스트 대기 중 ☕"` |
| **직원 하루** | **이음** (4F 전무실 · 오전) | `"이거… 끝난 거 맞죠?"` |
| **단짝 수다** | **세린 → 서윤** (5F 도서관) | `"리드님!! 대사 100줄 다 자동 생성해요?!"` |
| **단짝 수다** | **수아 → 채원** (1F HANI 24) | `"채원 매니저님, 2층 이사 기념 간식요ㅎㅎ"` |
| **NPC 혼잣말** | **편의점 점원 (야간)** (1F HANI 24) | `"야근엔 따뜻한 컵라면이죠 🍜"` |
| **NPC 케미** | **트레이너 → 나은** (5F 피트니스) | `"나은 차장님, 오늘 코어 폼 좋아요!"` |
| **이벤트 반응** | **아린** (1F · 1월 THAW 티저) | `"서리 블루 색감, 겨울 끝의 봄 같아요 ✨"` |
| **부서 동물 외출** | **아기 수달** (1F · 점심 마실) | `"2층에서 1층 카페로 마실 나왔어요!"` |
| **회장님 강아지** | **`chairmanDog`** (5F · 주말 라운지) | `"왕왕! (수연이 앞에서 꼬리를 빙글 돌린다)"` |
| **갓생 미션 축하** | **주말 이벤트** (6F 옥상 · THAW 주간) | `"THAW 꽃눈 아래 다 같이 축하 파티! 🌸"` |

---

## 마지막 3줄 요약

1. **기존 직원 20명·신규 NPC 6명·부서 동물 4종·회장님 강아지(`chairmanDog`)의 Phase 4 대사·장면 초안을 [building-story-pack-v1.json](building-story-pack-v1.json)에 구조화했습니다.**
2. **HANI 24 편의점 교대 점원, 수아·채원의 2F 이사, 12월 크리스마스~2월 THAW 시즌, 주간 갓생 미션 12주치까지 무저장·0-AI 토큰 기준으로 설계했습니다.**
3. **운영 파일은 전혀 수정하지 않았으며, 모든 대사를 30자 이내로 맞추고 남매 경쟁 제외·연애/외모 금지·호칭 `"회장님"` 고정 원칙을 지켰습니다.**
