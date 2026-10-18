# 하니 본사 · 캐릭터 행동 마스터 v1.3

> 도연(Codex) · 2026-10-17 KST · 총135개: 기본30(업무 기본 상태1 포함), Signature70, 다인35(평시27+특별8). 기존78개에서57개 추가. 빈도 예산 추가0.

DOCS ONLY. 상세 필드 원본은 [v1.3 JSON](office-actions-v1.3.json). 이전 [v1.2](office-actions-v1.2.md)·[v1.2 JSON](office-actions-v1.2.json)과 [v1](office-actions-v1.md)·[v1 JSON](office-actions-v1.json)·[v1.1](office-actions-v1.1.md)·[v1.1 JSON](office-actions-v1.1.json)은 변경하지 않습니다. 모든 `runtimeEnabled=false`, 데이터 `automaticReady=false`. 카탈로그 확장은 구현·탑승·Preview UI·배포 완료가 아닙니다.

## 기준과 Canon 경계

- 요청: 하니 전무 승인 “위 두 수정 반영 후 216 구현 착수 승인, 재검수 없이 진행”을 현재 사용자 메시지로 전달받아 수정 반영. AGENTS·START-HERE/CURRENT·v1.2 인수인계·Spatial 실제 ID 대조. 이번 worktree는 DOCS ONLY, 구현 착수 승인은 다음216 구현에 인계.
- branch `hani/office-actions-216`, base/HEAD `f03677f77ca33233330f250200351fb6f6891d6c`. GitHub branches/main GET·로컬 origin/main 일치. 로컬 index v2.9.214 / 마지막 hani-ai-budget.js?v=2.9.214, 실제 운영 화면 미검증. merge/rebase 없음.
- [Spatial v1](../../data/hani-building/spatial-contract.json) spatial-216-v1/base822d0925, [실제 명부](../../hani-organization-hub.js), [M9+MIR Bible](../character-bible-m9-mir.md), [캐릭터 원본](../../hani-character-archive-data.js) 대조. 개발팀·가은·채원은 명부 직무만, 상세 성격·관계 신설 없음.
- **원형 존재 ≠ V2 구현 완료 ≠ Production 완료.** v1.1의 원형/시제품 근거와 상태 필드는 JSON에 계승하며 이번 재실행 증거로 쓰지 않습니다. 신규57개는 문서 제안입니다.
- 하니 전무가 승인한 Spatial 정체성/외형 분리를 아래 승인된 Spatial 변경에 기록합니다. 인간 사용자 seongmin/chairman을 유지하며 office visual/avatar는 CEO Frog입니다. 현재 human_chibi 계약 원본은 보존하고 실제 필드 반영·검증은216 구현에서 수행합니다.
- 다온·윤슬은 Spatial planned 슬롯만 존재. 실제 명부 등록 전 자동 인물로 취급하지 않으며 기존 수동4개만 보존. MIR은 독립 AI 동료로 mir_station 사용, mir_core 점유·인간 책상/신체/섭취 복제 없음.
- 공간 명칭은 계약 그대로: dev-lounge는 3F platform 안, finance-lounge는 2F pantry 안, lobby-nw/ne/sw/se 좌석은 이름과 달리 1F cafe 안입니다. lobby 접수/택배/일보는 reception·parcel_box·ilbo_board를 사용합니다.
- 창밖·화분·화이트보드·프린터·우산은 손소품/시선 제안이며 새로운 spatial anchor나 시설 존재 확정이 아닙니다. 출력 대기는 자기 business-east, 지우기는 standup_room의 휴대용 미니보드, 우산은 reception에서 통로를 막지 않는 손짓. 미지원 소품은 생략/취소하고 새 좌표·시설을 만들지 않습니다.
- 서버실은 server-console의 고정 장식/분리된 모형 카드만, 실제 telemetry·로그·케이블·전원·설정·네트워크 접근 없음. 택배는 주소 없는 소품 상자, 실제 수령 기록/고객 데이터 조회 없음. 사진·게시·업로드·출력·결재·문서 쓰기·API/AI 실행 없음.

## 승인된 Spatial 변경 (하니 전무 2026-10-17)

**APPROVED.** 현재 사용자 메시지로 전달된 하니 전무의 Spatial v1 변경 승인입니다. 기존 승인 대기 제안을 승인된 결정으로 갱신하며, 이 문서 작업에서 Spatial 원본을 바꾸거나 구현 완료로 보고하지 않습니다.

- `seongmin`은 **human user identity / chairman**입니다. presence·재실/부재/퇴근, permissions, Agent Case 소집/반환, record owner는 계속 인간 사용자입니다. AI나 개구리 별도 개체로 바꾸지 않습니다.
- **office visual/avatar profile = CEO Frog**. **정장 + 빨간 넥타이 + 회장님 모드 기본**, `크아악`·`바닥이다`는 표정 변형입니다. 직원은 **회장님**으로 부릅니다. 시장 저점/매매 신호나 별명·사적 애칭으로 쓰지 않습니다.
- `spatial-contract.json`의 실제 필드 변경은 **216 구현**에서 기존 구조에 맞춰 수행합니다. 목표 의미 예시: `entity: human/user`, `role: chairman`, `officeVisual: ceo_frog`. 현재 구조의 `people`·`entity`·`registration`·`rank`·`team`과 맞춰 결정할 예시이며, 이 문서에서 새 필드를 적용하거나 migration을 실행하지 않습니다. 현재 `entity=human_chibi` 원문은 보존합니다.
- 하니 전무의 **“위 두 수정 반영 후 216 구현 착수 승인, 재검수 없이 진행”**을 인계합니다. 이 worktree는 DOCS ONLY이며 모든 `runtimeEnabled=false`. 실제 계약 반영·검증은 구현 담당의 다음 단계입니다. main 병합·배포 승인과 구분합니다.

## 실존 공간 정정 근거

[Spatial 계약](../../data/hani-building/spatial-contract.json)의 floors/rooms/anchors를 직접 확인했습니다. 새 좌표·시설·인물·빈도 가족을 추가하지 않습니다. 빈 슬롯·참여자·경로 예약 성공 시에만 선택하며 실패하면 원래 일정으로 돌아갑니다.

| 행동 | v1.2 → v1.3 | 실존 ID / 동선 이유 | 빈도 가족 |
| --- | --- | --- | --- |
| `base-lounge-cushion` | 민지 유지, 3F 개발 라운지 → 2F 공용 팬트리 라운지 | `2f` / `pantry` / `finance-lounge-a`: capacity1, rendererSeat.zone=lounge, 고정 주인 없는 seat. 민지 홈 `life-c`와 같은2F | `base-organize` 유지 |
| `base-meeting-marker` | 유리 유지, 2F 팀 협업실 → 3F 릴리스 회의 구역 | `3f` / `release` / `dev-meeting-nw`: capacity1, 회의 seat. 유리 홈 `dev-qa`와 같은3F, 휴대용 마커 정리만 | `base-organize` 유지 |
| `scene-routing-brief` | 2F 팀 협업실 → 4F 임원회의실 | `4f` / `exec` / 유나 `board-n` + 하니 `board-ne`: 각capacity1·서로 다른 seat. 두 사람 홈 `desk_yuna`·`office_hani` 모두4F | `scene-routing-brief` 유지 |

## 실제 인물·홈과 Signature 수

| 인물 / app ID | 등록 | 실제 홈: 층 / 방 / 앵커 | v1.1 → v1.2 Signature |
| --- | --- | --- | --- |
| 하니 / `hani` | registered | 4f / `hani_office` / `office_hani` | 3 → 4 |
| 유나 / `yuna` | registered | 4f / `secretariat` / `desk_yuna` | 2 → 4 |
| 지은 / `jieun` | registered | 2f / `finance` / `finance-a` | 3 → 4 |
| 하루 / `haru` | registered | 2f / `finance` / `finance-b` | 2 → 3 |
| 나은 / `naeun` | registered | 2f / `life` / `life-a` | 3 → 4 |
| 히나 / `hina` | registered | 2f / `life` / `life-b` | 4 → 4 |
| 민지 / `minji` | registered | 2f / `life` / `life-c` | 2 → 4 |
| 수연 / `sooyeon` | registered | 2f / `life` / `life-d` | 2 → 4 |
| 수아 / `sua` | registered | 1f / `business` / `business-west` | 2 → 3 |
| 서윤 / `seoyun` | registered | 3f / `platform` / `dev-lead` | 2 → 3 |
| 도연 / `dohyun` | registered | 3f / `platform` / `dev-build` | 2 → 3 |
| 세린 / `serin` | registered | 3f / `platform` / `dev-research` | 2 → 4 |
| 유리 / `yuri` | registered | 3f / `platform` / `dev-qa` | 2 → 3 |
| 아린 / `arin` | registered | 3f / `platform` / `dev-design` | 2 → 3 |
| 가은/MUSE / `gaeun` | registered | 4f / `secretariat` / `secretary_desk` | 2 → 4 |
| 채원 / `taeo` | registered | 1f / `business` / `business-east` | 2 → 4 |
| 다온 / `daon` | planned | 2f / `finance` / `desk_daon` | 2 → 2 |
| 윤슬 / `yoonseul` | planned | 2f / `life` / `desk_yoonseul` | 2 → 2 |
| 성민 회장 / `seongmin` | chairman | 4f / `ceo` / `ceo-reserved` | 3 → 5 |
| 미르/MIR / `mir` | registered | 4f / `mir_nook` / `mir_station` | 2 → 3 |

등록 직원17명+회장18명 모두3~5개. 예정2명은 기존2개씩 유지하며 이 목표에 포함하지 않습니다. dohyun=도연, taeo=채원입니다. 대표 Signature는 v1.1의18개 그대로이고 희귀 개그는 대표가 아닙니다.

## 빈도 불증가 계약 — 다양성만 확대

- **base-work는 기본/fallback 상태**, 랜덤 후보·횟수 채우기 대상 아님. 실제 presence/부재·퇴근·Agent Case 소집/반환 우선.
- **개인 비업무 전체 합산30~45분에1회 이하**, 초기45분=2700초. 커피·물·스트레칭·폰·산책·점심·휴식·새 비업무 변형/Signature도 한 개인 예산. 장식 층간 이동은 기본/특수/다인 합산60~90분, 초기90분=5400초. 실제 소집/반환·출퇴근을 지연하지 않습니다.
- **평시 다인 각각15~20% 범위·초기15%**, 건물 하루최대3개·층당동시1개. 개인당동시1·층당Signature1 유지. 확률은 각 가족의 기회에서 적용되는 gate이며 변형마다 독립 추첨하지 않습니다.
- **특별8종**은 원래 확률8~35%·휴지2~14일·사건당하루1·시각·priority·지속·conditions 그대로 유지. 실기록 Signature 포함 **건물 하루최대2·동시1** 공유. 추가217 제안3개도 기존 특별 가족 안에서만 선택됩니다.
- **크아악20%**, 2일휴지·하루최대1 유지. Market Shock 동일일 개인 크아악 억제, 하루 둘 중 하나만. 회장님 모드3변형(도장/커피/순시)은 sig-seongmin-1의 하루1 예산을 1/3씩 나눕니다. 데이터/수동 포함 회장 Signature 총5개입니다.
- **MIR “왜?” 0~2회/일**·“왜?” / “조금 더 볼게.” / “이건 연결되네.” 유지. 새 연결빛은 sig-mir-2 예산을 절반 나누며 질문 예산을 늘리지 않습니다.
- 수아1mm정렬·나은커피향·히나셀카각도는 각각8%·3일휴지·하루최대1, **rare/대표 제외** 유지. 수아는 실행/담당/기한, 나은은 물/휴식/돌봄, 히나는 교사 우선. **히나 교사:셀카 최소1:1**, 새 협력 수업 장면은 교사 노출로 집계하되 자기 가족 기회만 사용. 균형 채우기 강제 노출/실데이터 추정 금지.

**예산 보존 방법:** 기본 상태를 제외한 v1.1의77개 action ID를 그대로77개 frequency family로 유지합니다. 새 family는0개. 부모의 원래 조건·참여자 재실·자리/경로 적격성이 성립할 때만 동일 KST seed gate1회 → 가족 안에서 가중치1/N의 변형1개를 선택합니다. 원본도 N개 중 하나입니다. 예약·selector·소품·층간 간격 실패시0개, 다른 변형 재추첨/부모 미성립 기회 구제/복귀 후 몰아재생 없음. counter·cooldown은 가족 전체 공유하며216/217을 오가도 리셋하지 않습니다. 신규 변형 지속은 부모의 기존 최대 이내입니다.

77개는 예산 **종류** 수입니다. 기존 person_action은 `KSTday|familyId|actorId`, scene/사건은 `KSTday|familyId`로 횟수·휴지를 공유합니다. 개인 행동의 변형은 부모 selector가 선택한 같은1인일 때만, 다인 변형은 부모와 새 장면의 필수 인물·자리 모두 적격일 때만 선택합니다. 다른 변형·버전으로 key를 바꾸어 새 기회를 만들지 않습니다.

따라서 매 원래 기회에서 `원본 노출 + 변형 노출 ≤ 1`, `Σ(조건부 가중치)=1`, 가족별 횟수/휴지·전역 cap은 동일하거나 엄격합니다. **항목78→135, 예산77→77, 추가0**이므로 총 노출 빈도·상한·장면 총시간 예산은 증가하지 않습니다. 이는 설계/정적 모델 증명이며 실제 스케줄러 실행 결과 PASS가 아닙니다.

**원본 불일치 정정:** v1.1 MD/리뷰는 평시15%인데 JSON12개에는25%가 남아 있었습니다. v1.2에서만 모든 평시 gate를15%로 맞췄습니다. 리뷰 규칙 변경이 아니라 JSON 규칙 일치 정정이며 이전 PASS 주장을 재사용하지 않습니다.

### 분할이 생긴 기존 가족

| 부모 예산 ID | 원본+변형 | 공유 하루상한 / gate / 휴지 |
| --- | --- | --- |
| `base-read` | base-read, base-print-wait | 8 / 100% / 1800초 |
| `base-water` | base-water, base-pantry-cup | 4 / 100% / 5400초 |
| `base-break` | base-break, base-roof-view | 2 / 100% / 14400초 |
| `base-organize` | base-organize, base-desk-note, base-desk-clips, base-pantry-tray, base-lounge-cushion, base-meeting-erase, base-meeting-marker, base-garden-water, base-garden-leaf, base-lobby-umbrella, base-lobby-parcel, base-lobby-paper, base-server-label, base-mir-card | 2 / 100% / 14400초 |
| `base-think` | base-think, base-lounge-window, base-server-light | 3 / 100% / 7200초 |
| `sig-yuna-2` | sig-yuna-2, sig-yuna-3, sig-yuna-4 | 1 / 100% / 10800초 |
| `sig-jieun-2` | sig-jieun-2, sig-jieun-4 | 1 / 18.00% / 172800초 |
| `sig-haru-2` | sig-haru-2, sig-haru-3 | 1 / 100% / 10800초 |
| `sig-minji-2` | sig-minji-2, sig-minji-3, sig-minji-4 | 1 / 100% / 10800초 |
| `sig-sooyeon-1` | sig-sooyeon-1, sig-sooyeon-3 | 1 / 100% / 10800초 |
| `sig-sua-2` | sig-sua-2, sig-sua-3 | 1 / 100% / 10800초 |
| `sig-seoyun-1` | sig-seoyun-1, sig-seoyun-3 | 1 / 100% / 10800초 |
| `sig-dohyun-1` | sig-dohyun-1, sig-dohyun-3 | 1 / 100% / 10800초 |
| `sig-serin-2` | sig-serin-2, sig-serin-3 | 1 / 100% / 10800초 |
| `sig-yuri-1` | sig-yuri-1, sig-yuri-3 | 1 / 100% / 10800초 |
| `sig-arin-1` | sig-arin-1, sig-arin-3 | 1 / 100% / 10800초 |
| `sig-gaeun-1` | sig-gaeun-1, sig-gaeun-3 | 1 / 100% / 10800초 |
| `sig-gaeun-2` | sig-gaeun-2, sig-gaeun-4 | 1 / 100% / 10800초 |
| `sig-taeo-1` | sig-taeo-1, sig-taeo-3 | 1 / 100% / 10800초 |
| `sig-taeo-2` | sig-taeo-2, sig-taeo-4 | 1 / 100% / 10800초 |
| `sig-mir-2` | sig-mir-2, sig-mir-3 | 1 / 100% / 10800초 |
| `sig-seongmin-1` | sig-seongmin-1, sig-seongmin-4, sig-seongmin-5 | 1 / 100% / 10800초 |
| `scene-coffee-menu` | scene-coffee-menu, scene-rest-bookmark | 1 / 15.00% / 10800초 |
| `scene-snack-budget` | scene-snack-budget, scene-compare-care | 1 / 15.00% / 10800초 |
| `scene-routing-brief` | scene-routing-brief, scene-mir-context | 1 / 15.00% / 10800초 |
| `scene-priority` | scene-priority, scene-client-questions, scene-hani-delegate | 1 / 15.00% / 10800초 |
| `scene-watch-pick` | scene-watch-pick, scene-haru-minji-cover | 1 / 15.00% / 10800초 |
| `scene-travel-talk` | scene-travel-talk, scene-camera-route, scene-map-rest | 1 / 15.00% / 10800초 |
| `scene-intake-check` | scene-intake-check, scene-owner-label | 1 / 15.00% / 10800초 |
| `scene-update-board` | scene-update-board, scene-design-handoff, scene-review-pair, scene-readable-evidence, scene-source-layout | 1 / 15.00% / 10800초 |
| `scene-scope-banter` | scene-scope-banter, scene-study-scope | 1 / 15.00% / 10800초 |
| `scene-paper-delivery` | scene-paper-delivery, scene-secretary-tabs | 1 / 15.00% / 10800초 |
| `evt-study-week` | evt-study-week, sig-serin-4 | 1 / 18.00% / 345600초 |
| `evt-travel-eve` | evt-travel-eve, sig-sooyeon-4 | 1 / 25.00% / 259200초 |
| `sig-hani-3` | sig-hani-3, sig-hani-4 | 1 / 100% / 10800초 |
| `sig-naeun-3` | sig-naeun-3, sig-naeun-4 | 1 / 100% / 10800초 |

위에 없는 가족은 원본1개·가중치1로 유지됩니다. 모든77개 가족의 상한·부모·가중치·멤버는 JSON frequencyFamilies에 있으며 action.frequency는 공유 gate의 투영입니다.

## 216 = Living Office Core / 217 = Context-aware + Secondary/Rare Expansion / 수동 Preview 목록

**216 = Living Office Core: 98개 / 217 = Context-aware + Secondary/Rare Expansion: 37개 / 총135개. 수동 Preview6개는217의 부분집합**입니다. v1.2의96/39에서 하니 핵심 `sig-hani-1`(팀 흐름 살피기)·`sig-hani-2`(범위를 긋는 전무)만 217→216으로 이동합니다. 기존 대표18개 지정은 유지합니다. 하니의 전략·운영·팀 흐름·범위 조정이 핵심이며 **한발 빠지기는 그 위에 더하는 위임 레이어**입니다. 다른 보조·희귀 개그 배치와 빈도77가족은 그대로입니다.

### 216 = Living Office Core 전체 ID

- 기본 30: `base-work`, `base-read`, `base-coffee`, `base-stretch`, `base-phone`, `base-water`, `base-walk`, `base-break`, `base-organize`, `base-think`, `base-lunch`, `base-arrive-leave`, `base-desk-note`, `base-desk-clips`, `base-print-wait`, `base-pantry-cup`, `base-pantry-tray`, `base-lounge-window`, `base-lounge-cushion`, `base-meeting-erase`, `base-meeting-marker`, `base-garden-water`, `base-roof-view`, `base-garden-leaf`, `base-lobby-umbrella`, `base-lobby-parcel`, `base-lobby-paper`, `base-server-light`, `base-server-label`, `base-mir-card`.
- Signature 41: `sig-hani-1`, `sig-hani-2`, `sig-yuna-2`, `sig-jieun-1`, `sig-haru-2`, `sig-minji-2`, `sig-sooyeon-1`, `sig-sua-2`, `sig-seoyun-1`, `sig-dohyun-1`, `sig-serin-1`, `sig-yuri-1`, `sig-arin-1`, `sig-gaeun-1`, `sig-taeo-1`, `sig-mir-1`, `sig-seongmin-1`, `sig-hani-3`, `sig-naeun-3`, `sig-hina-4`, `sig-hani-4`, `sig-yuna-3`, `sig-yuna-4`, `sig-haru-3`, `sig-naeun-4`, `sig-minji-3`, `sig-minji-4`, `sig-sooyeon-3`, `sig-sua-3`, `sig-seoyun-3`, `sig-dohyun-3`, `sig-serin-3`, `sig-yuri-3`, `sig-arin-3`, `sig-gaeun-3`, `sig-gaeun-4`, `sig-taeo-3`, `sig-taeo-4`, `sig-mir-3`, `sig-seongmin-4`, `sig-seongmin-5`.
- 다인 27: `scene-meme`, `scene-coffee-menu`, `scene-snack-budget`, `scene-routing-brief`, `scene-priority`, `scene-watch-pick`, `scene-travel-talk`, `scene-intake-check`, `scene-update-board`, `scene-roof-selfie`, `scene-scope-banter`, `scene-paper-delivery`, `scene-study-scope`, `scene-compare-care`, `scene-rest-bookmark`, `scene-camera-route`, `scene-owner-label`, `scene-secretary-tabs`, `scene-design-handoff`, `scene-review-pair`, `scene-readable-evidence`, `scene-source-layout`, `scene-client-questions`, `scene-mir-context`, `scene-hani-delegate`, `scene-haru-minji-cover`, `scene-map-rest`.

### 217 = Context-aware + Secondary/Rare Expansion 전체 ID

- Signature 29: `sig-yuna-1`, `sig-jieun-2`, `sig-jieun-3`, `sig-haru-1`, `sig-naeun-1`, `sig-naeun-2`, `sig-hina-1`, `sig-hina-2`, `sig-hina-3`, `sig-minji-1`, `sig-sooyeon-2`, `sig-sua-1`, `sig-seoyun-2`, `sig-dohyun-2`, `sig-serin-2`, `sig-yuri-2`, `sig-arin-2`, `sig-gaeun-2`, `sig-taeo-2`, `sig-mir-2`, `sig-seongmin-2`, `sig-seongmin-3`, `sig-daon-1`, `sig-daon-2`, `sig-yoonseul-1`, `sig-yoonseul-2`, `sig-jieun-4`, `sig-sooyeon-4`, `sig-serin-4`.
- 다인 8: `evt-chairman-idea`, `evt-release-eve`, `evt-month-end`, `evt-study-week`, `evt-market-shock`, `evt-travel-eve`, `evt-friday-camera`, `evt-rooftop`.

### 216에서도 수동 Preview만

| 구분 | ID | 경계 |
| --- | --- | --- |
| 옥상 이벤트1 | evt-rooftop | 명명 참가 슬롯 미확정, 자동 배치/임의 좌표 금지. 대사 스토리보드만 |
| 예정 직원4 | sig-daon-1, sig-daon-2, sig-yoonseul-1, sig-yoonseul-2 | 실제 명부 등록 전 자동 actor·일정·사건 금지 |
| 수동 표정1 | sig-seongmin-3 | 바닥이다 수동 선택 계약 미확정, 시장 저점/매매 신호 아님 |

scene-roof-selfie 및 신규 옥상 대화는 terrace의 실재 명명 좌석을 예약하는 평시 장면입니다. 명명 슬롯 없는 evt-rooftop과 구분합니다. 회장 관련216 항목은 승인된 CEO Frog Spatial 필드 반영·검증을216 구현에서 수행한 뒤 연결합니다. 현재 문서는 runtimeEnabled=false입니다. 수동 Preview는 구현된 UI가 있다는 주장이 아닙니다.

## 1. 기본 행동30

상세 기간·소품·조건·빈도·상태/근거는 JSON과 위 예산표 참조. 신규는 v1.2 문서 제안, 대표는216 핵심1개, rare는 희귀 개그입니다.

| ID / 행동 | 인물 | 실제 층 / 방 / 앵커 | 연출·대사 | 예산 가족 / 계획 |
| --- | --- | --- | --- | --- |
| `base-work`<br>자기 자리에서 업무 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 4f/hani_office/`office_hani`<br>4f/secretariat/`desk_yuna`<br>2f/finance/`finance-a`<br>2f/finance/`finance-b`<br>2f/life/`life-a`<br>2f/life/`life-b`<br>2f/life/`life-c`<br>2f/life/`life-d`<br>1f/business/`business-west`<br>3f/platform/`dev-lead`<br>3f/platform/`dev-build`<br>3f/platform/`dev-research`<br>3f/platform/`dev-qa`<br>3f/platform/`dev-design`<br>4f/secretariat/`secretary_desk`<br>1f/business/`business-east`<br>4f/ceo/`ceo-reserved`<br>4f/mir_nook/`mir_station` | 자료 확인 중 | `base-work` / 216 |
| `base-read`<br>자료 읽기 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 4f/hani_office/`office_hani`<br>4f/secretariat/`desk_yuna`<br>2f/finance/`finance-a`<br>2f/finance/`finance-b`<br>2f/life/`life-a`<br>2f/life/`life-b`<br>2f/life/`life-c`<br>2f/life/`life-d`<br>1f/business/`business-west`<br>3f/platform/`dev-lead`<br>3f/platform/`dev-build`<br>3f/platform/`dev-research`<br>3f/platform/`dev-qa`<br>3f/platform/`dev-design`<br>4f/secretariat/`secretary_desk`<br>1f/business/`business-east`<br>4f/ceo/`ceo-reserved`<br>4f/mir_nook/`mir_station` | 한 장씩 확인 중 | `base-read` / 216 |
| `base-coffee`<br>커피 쉬는 시간 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 1f/cafe/`coffee_counter`<br>2f/pantry/`pantry_2f` | 잠깐 커피 한 잔 | `base-coffee` / 216 |
| `base-stretch`<br>짧게 몸 풀기 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 4f/hani_office/`side_desk_hani`<br>4f/secretariat/`side_desk_yuna`<br>2f/finance/`side_desk_jieun`<br>2f/finance/`side_desk_haru`<br>2f/life/`side_desk_naeun`<br>2f/life/`side_desk_hina`<br>2f/life/`side_desk_minji`<br>2f/life/`side_desk_sooyeon`<br>1f/business/`side_desk_sua`<br>3f/platform/`side_desk_seoyun`<br>3f/platform/`side_desk_dohyun`<br>3f/platform/`side_desk_serin`<br>3f/platform/`side_desk_yuri`<br>3f/platform/`side_desk_arin`<br>4f/secretariat/`junction_secretariat`<br>1f/business/`side_desk_taeo`<br>4f/ceo/`junction_ceo`<br>4f/mir_nook/`side_mir_station` | 잠깐 몸 풀기 | `base-stretch` / 216 |
| `base-phone`<br>휴대폰 잠깐 보기 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 4f/hani_office/`office_hani`<br>4f/secretariat/`desk_yuna`<br>2f/finance/`finance-a`<br>2f/finance/`finance-b`<br>2f/life/`life-a`<br>2f/life/`life-b`<br>2f/life/`life-c`<br>2f/life/`life-d`<br>1f/business/`business-west`<br>3f/platform/`dev-lead`<br>3f/platform/`dev-build`<br>3f/platform/`dev-research`<br>3f/platform/`dev-qa`<br>3f/platform/`dev-design`<br>4f/secretariat/`secretary_desk`<br>1f/business/`business-east`<br>4f/ceo/`ceo-reserved`<br>4f/mir_nook/`mir_station` | 잠깐 확인 중 | `base-phone` / 216 |
| `base-water`<br>물 마시기 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 2f/pantry/`pantry_2f` | 물 한 잔 마실게요 | `base-water` / 216 |
| `base-walk`<br>복도 짧은 산책 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 1f/공용복도/`hall_1f`<br>2f/공용복도/`hall_2f`<br>3f/공용복도/`hall_3f`<br>4f/공용복도/`hall_4f`<br>5f/공용복도/`hall_5f` | 잠깐 걸을게요 | `base-walk` / 216 |
| `base-break`<br>조용히 숨 고르기 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 5f/quiet_roof/`rooftop_rest_slot_1`<br>2f/pantry/`finance-lounge-a`<br>4f/mir_nook/`lounge-armchair` | 잠깐 쉬는 중 | `base-break` / 216 |
| `base-organize`<br>책상과 서류 정돈 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 4f/hani_office/`office_hani`<br>4f/secretariat/`desk_yuna`<br>2f/finance/`finance-a`<br>2f/finance/`finance-b`<br>2f/life/`life-a`<br>2f/life/`life-b`<br>2f/life/`life-c`<br>2f/life/`life-d`<br>1f/business/`business-west`<br>3f/platform/`dev-lead`<br>3f/platform/`dev-build`<br>3f/platform/`dev-research`<br>3f/platform/`dev-qa`<br>3f/platform/`dev-design`<br>4f/secretariat/`secretary_desk`<br>1f/business/`business-east`<br>4f/ceo/`ceo-reserved`<br>4f/mir_nook/`mir_station` | 순서대로 정리 중 | `base-organize` / 216 |
| `base-think`<br>잠깐 생각 정리 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 4f/hani_office/`office_hani`<br>4f/secretariat/`desk_yuna`<br>2f/finance/`finance-a`<br>2f/finance/`finance-b`<br>2f/life/`life-a`<br>2f/life/`life-b`<br>2f/life/`life-c`<br>2f/life/`life-d`<br>1f/business/`business-west`<br>3f/platform/`dev-lead`<br>3f/platform/`dev-build`<br>3f/platform/`dev-research`<br>3f/platform/`dev-qa`<br>3f/platform/`dev-design`<br>4f/secretariat/`secretary_desk`<br>1f/business/`business-east`<br>4f/ceo/`ceo-reserved`<br>4f/mir_nook/`mir_station` | 생각 정리 중 | `base-think` / 216 |
| `base-lunch`<br>점심 쉬기 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 5f/terrace/`rooftop_table_slot_1`<br>2f/pantry/`finance-lounge-a` | 점심 먹고 올게요 | `base-lunch` / 216 |
| `base-arrive-leave`<br>출퇴근 이동 | 하니·유나·지은·하루·나은·히나·민지·수연·수아·서윤·도연·세린·유리·아린·가은/MUSE·채원·성민 회장·미르/MIR | 1f/lobby/`arrival_gate` | 출입 중 | `base-arrive-leave` / 216 |
| `base-desk-note`<br>책상에 메모 붙이기 | 유나 | 4f/secretariat/`desk_yuna` | 분류 메모는 여기 둘게요. | `base-organize` / 신규·216 |
| `base-desk-clips`<br>서류 클립 나누기 | 수아 | 1f/business/`business-west` | 후속 자료부터 묶을게요. | `base-organize` / 신규·216 |
| `base-print-wait`<br>자기 자리에서 출력물 기다리기 | 채원 | 1f/business/`business-east` | 기다리는 동안 표지를 볼게요. | `base-read` / 신규·216 |
| `base-pantry-cup`<br>팬트리 컵 헹구기 | 나은 | 2f/pantry/`pantry_2f` | 컵도 가볍게 정리해요. | `base-water` / 신규·216 |
| `base-pantry-tray`<br>팬트리 쟁반 정돈 | 하루 | 2f/pantry/`pantry_2f` | 다음 사람이 쓰기 편하게. | `base-organize` / 신규·216 |
| `base-lounge-window`<br>라운지에서 창밖 보기 | 하니 | 4f/mir_nook/`lounge-armchair` | 잠깐 멀리 볼까요. | `base-think` / 신규·216 |
| `base-lounge-cushion`<br>라운지 쿠션 바로 놓기 | 민지 | 2f/pantry/`finance-lounge-a` | 이쪽이 편하겠다. | `base-organize` / 신규·216 |
| `base-meeting-erase`<br>회의실에서 화이트보드 지우기 | 서윤 | 3f/standup/`standup_room` | 다음 설명 자리부터 비워둘게요. | `base-organize` / 신규·216 |
| `base-meeting-marker`<br>회의실 마커 뚜껑 닫기 | 유리 | 3f/release/`dev-meeting-nw` | 도구는 정리하고 마칠게요. | `base-organize` / 신규·216 |
| `base-garden-water`<br>옥상 화분 물주기 | 하루 | 5f/garden/`rooftop_garden` | 조금씩 천천히. | `base-organize` / 신규·216 |
| `base-roof-view`<br>옥상 쉼터에서 먼 곳 보기 | 수연 | 5f/quiet_roof/`rooftop_rest_slot_1` | 잠깐 쉬었다 가요. | `base-break` / 신규·216 |
| `base-garden-leaf`<br>화분 옆 낙엽 정돈 | 나은 | 5f/garden/`rooftop_garden` | 발밑은 깔끔하게. | `base-organize` / 신규·216 |
| `base-lobby-umbrella`<br>로비에서 우산 정리 | 수아 | 1f/lobby/`reception` | 통로는 비워둘게요. | `base-organize` / 신규·216 |
| `base-lobby-parcel`<br>채원이 로비에서 택배 받기 | 채원 | 1f/lobby/`parcel_box` | 자료 상자는 제가 챙길게요. | `base-organize` / 신규·216 |
| `base-lobby-paper`<br>로비 일보 모서리 정리 | 유나 | 1f/lobby/`ilbo_board` | 보기 편하게 맞춰둘게요. | `base-organize` / 신규·216 |
| `base-server-light`<br>서버실 표시등 바라보기 | 세린 | 3f/server/`server-console` | 배치부터 차분히 볼게요. | `base-think` / 신규·216 |
| `base-server-label`<br>서버실 모형 라벨 정돈 | 도연 | 3f/server/`server-console` | 표시만 읽기 편하게. | `base-organize` / 신규·216 |
| `base-mir-card`<br>MIR Station 가상 메모 접기 | 미르/MIR | 4f/mir_nook/`mir_station` | 생각은 여기 둘게. | `base-organize` / 신규·216 |

## 2. Signature70

상세 기간·소품·조건·빈도·상태/근거는 JSON과 위 예산표 참조. 신규는 v1.2 문서 제안, 대표는216 핵심1개, rare는 희귀 개그입니다.

| ID / 행동 | 인물 | 실제 층 / 방 / 앵커 | 연출·대사 | 예산 가족 / 계획 |
| --- | --- | --- | --- | --- |
| `sig-hani-1`<br>팀 흐름 살피기 | 하니 | 4f/hani_office/`office_hani` | 목적부터 다시 잡죠. | `sig-hani-1` / 216 |
| `sig-hani-2`<br>범위를 긋는 전무 | 하니 | 4f/hani_office/`office_hani` | 회장님, 이번 범위는 여기까지. | `sig-hani-2` / 216 |
| `sig-yuna-1`<br>책갈피 색 고르기 | 유나 | 4f/secretariat/`desk_yuna` | 여기 표시해 둘게요. | `sig-yuna-1` / 217 |
| `sig-yuna-2`<br>들어온 질문 분류 | 유나 | 4f/secretariat/`desk_yuna` | 어디로 연결할지 볼게요. | `sig-yuna-2` / 216·대표 |
| `sig-jieun-1`<br>소수점 검산 | 지은 | 2f/finance/`finance-a` | 한 번 더 계산해 볼게요. | `sig-jieun-1` / 216·대표 |
| `sig-jieun-2`<br>예산 자료·확정 흐름 확인 | 지은 | 2f/finance/`finance-a` | 확인된 숫자부터 볼게요. | `sig-jieun-2` / 217 |
| `sig-jieun-3`<br>확정 무지출 날 작은 칭찬 | 지은 | 2f/finance/`finance-a` | 회장님, 오늘 기록은 깔끔하게 마감됐네요. | `sig-jieun-3` / 217 |
| `sig-haru-1`<br>화분에게 일정 설명 | 하루 | 5f/garden/`rooftop_garden` | 오늘은 이 순서로 가자. | `sig-haru-1` / 217 |
| `sig-haru-2`<br>생활용품 비교표 접기 | 하루 | 2f/finance/`finance-b` | 좋은 것과 필요한 건 따로 보자. | `sig-haru-2` / 216·대표 |
| `sig-naeun-1`<br>커피 향으로 컨디션 점검 | 나은 | 2f/pantry/`pantry_2f` | 잠깐 쉬어 가요. | `sig-naeun-1` / 217·rare(희귀) |
| `sig-naeun-2`<br>운동 기록 뒤 옥상 스트레칭 | 나은 | 5f/garden/`rooftop_garden` | 회장님, 기록 확인했어요. 잠깐 쉬어 가요. | `sig-naeun-2` / 217 |
| `sig-hina-1`<br>셀카 각도 연구 | 히나 | 2f/life/`life-b` | 이 각도 어때용? | `sig-hina-1` / 217·rare(희귀) |
| `sig-hina-2`<br>퀴즈 완료 복습 | 히나 | 2f/life/`life-b` | 오답 포인트부터 볼게용. | `sig-hina-2` / 217 |
| `sig-hina-3`<br>100점 도장 | 히나 | 2f/life/`life-b` | 회장님, 차근차근 잘 마무리했어용. 도장 쾅♡ | `sig-hina-3` / 217 |
| `sig-minji-1`<br>간식 재고 감사 | 민지 | 2f/pantry/`pantry_2f` | 간식 상태 확인 중. | `sig-minji-1` / 217 |
| `sig-minji-2`<br>일보의 한 컷 구상 | 민지 | 2f/life/`life-c` | 이 장면, 한 컷만. | `sig-minji-2` / 216·대표 |
| `sig-sooyeon-1`<br>지도에 별표 | 수연 | 2f/life/`life-d` | 동선은 이렇게 이어지네요. | `sig-sooyeon-1` / 216·대표 |
| `sig-sooyeon-2`<br>경기 일정 다시 보기 | 수연 | 2f/life/`life-d` | 시간부터 맞춰 볼게요. | `sig-sooyeon-2` / 217 |
| `sig-sua-1`<br>책상 각도 1mm 정렬 | 수아 | 1f/business/`business-west` | 이제 정리가 됐네요. | `sig-sua-1` / 217·rare(희귀) |
| `sig-sua-2`<br>담당과 기한 확인 | 수아 | 1f/business/`business-west` | 담당자와 기한, 둘 다 확인할게요. | `sig-sua-2` / 216·대표 |
| `sig-seoyun-1`<br>설계 검토 | 서윤 | 3f/platform/`dev-lead` | 구조부터 정리하죠. | `sig-seoyun-1` / 216·대표 |
| `sig-seoyun-2`<br>배포 기록 확인 | 서윤 | 3f/release/`dev-meeting-nw` | 배포 기록부터 확인하죠. | `sig-seoyun-2` / 217 |
| `sig-dohyun-1`<br>구현과 테스트 | 도연 | 3f/platform/`dev-build` | 동작부터 확인하겠습니다. | `sig-dohyun-1` / 216·대표 |
| `sig-dohyun-2`<br>늦은 시간 한 줄 점검 | 도연 | 3f/platform/`dev-build` | 한 줄만 확인하고 쉬겠습니다. | `sig-dohyun-2` / 217 |
| `sig-serin-1`<br>자동화 점검 | 세린 | 3f/platform/`dev-research` | 반복되는 부분부터 보겠습니다. | `sig-serin-1` / 216·대표 |
| `sig-serin-2`<br>자료 두 장 비교 | 세린 | 3f/platform/`dev-research` | 근거를 나란히 놓아 볼게요. | `sig-serin-2` / 217 |
| `sig-yuri-1`<br>변경 범위 리뷰 | 유리 | 3f/platform/`dev-qa` | 바뀐 범위부터 확인하겠습니다. | `sig-yuri-1` / 216·대표 |
| `sig-yuri-2`<br>검증 근거 체크 | 유리 | 3f/platform/`dev-qa` | 확인한 항목만 표시하겠습니다. | `sig-yuri-2` / 217 |
| `sig-arin-1`<br>화면과 사용성 검토 | 아린 | 3f/platform/`dev-design` | 직접 쓰는 흐름을 보겠습니다. | `sig-arin-1` / 216·대표 |
| `sig-arin-2`<br>작은 화면 터치 영역 점검 | 아린 | 3f/platform/`dev-design` | 작은 화면에서도 닿아야죠. | `sig-arin-2` / 217 |
| `sig-gaeun-1`<br>회장 일정·자료 선행 준비 | 가은/MUSE | 4f/secretariat/`secretary_desk` | 회장님, 필요한 건 먼저 준비해둘게요. | `sig-gaeun-1` / 216·대표 |
| `sig-gaeun-2`<br>회의 준비와 후속 메모 | 가은/MUSE | 4f/secretariat/`secretary_desk` | 빠진 후속이 있는지 볼게요. | `sig-gaeun-2` / 217 |
| `sig-taeo-1`<br>고객 제안 검토 | 채원 | 1f/business/`business-east` | 요구와 제안을 맞춰 보겠습니다. | `sig-taeo-1` / 216·대표 |
| `sig-taeo-2`<br>요구사항 연결표 | 채원 | 1f/business/`business-east` | 다음 실행까지 이어 보겠습니다. | `sig-taeo-2` / 217 |
| `sig-mir-1`<br>Station에서 자료·관찰·생각 | 미르/MIR | 4f/mir_nook/`mir_station` | 왜? | `sig-mir-1` / 216·대표 |
| `sig-mir-2`<br>흩어진 맥락 연결 | 미르/MIR | 4f/mir_nook/`mir_station` | 같은 이야기일까? | `sig-mir-2` / 217 |
| `sig-seongmin-1`<br>회장님 모드 · 서류 결재 도장 | 성민 회장 | 4f/ceo/`ceo-reserved` | 확인하고 차분히 이어가죠. | `sig-seongmin-1` / 216·대표 |
| `sig-seongmin-2`<br>급락일 크아악 | 성민 회장 | 4f/ceo/`ceo-reserved` | 크아악! | `sig-seongmin-2` / 217 |
| `sig-seongmin-3`<br>바닥이다 표정 시연 | 성민 회장 | 4f/ceo/`ceo-reserved` | 바닥이다… | `sig-seongmin-3` / 217·수동만 |
| `sig-daon-1`<br>리스크 자료 검토 | 다온 | 2f/finance/`desk_daon` | 위험 요인부터 살펴보겠습니다. | `sig-daon-1` / 217·수동만 |
| `sig-daon-2`<br>재무 협업 메모 | 다온 | 2f/finance/`desk_daon` | 확인한 조건을 나눠 볼게요. | `sig-daon-2` / 217·수동만 |
| `sig-yoonseul-1`<br>학습 자료 정리 | 윤슬 | 2f/life/`desk_yoonseul` | 출처를 함께 정리하겠습니다. | `sig-yoonseul-1` / 217·수동만 |
| `sig-yoonseul-2`<br>학습 비교 메모 | 윤슬 | 2f/life/`desk_yoonseul` | 서로 다른 설명을 비교할게요. | `sig-yoonseul-2` / 217·수동만 |
| `sig-hani-3`<br>담당자에게 맡기고 한발 빠지기 | 하니 | 4f/hani_office/`office_hani` | 이건 담당자가 먼저 보죠. | `sig-hani-3` / 216·대표 |
| `sig-naeun-3`<br>동료의 물·휴식 챙기기 | 나은 | 2f/life/`life-a` | 물 한 잔 하고, 잠깐 쉬어 가요. | `sig-naeun-3` / 216·대표 |
| `sig-hina-4`<br>설명 카드와 수업 준비 | 히나 | 2f/life/`life-b` | 이해하기 쉽게 설명해 볼게용. | `sig-hina-4` / 216·대표 |
| `sig-hani-4`<br>판단을 맡기고 메모 덮기 | 하니 | 4f/hani_office/`office_hani` | 방향은 맞췄으니 판단은 맡길게요. | `sig-hani-3` / 신규·216 |
| `sig-yuna-3`<br>분류 탭 먼저 붙이기 | 유나 | 4f/secretariat/`desk_yuna` | 어디로 갈 자료인지 먼저 볼게요. | `sig-yuna-2` / 신규·216 |
| `sig-yuna-4`<br>확인 질문 메모 접기 | 유나 | 4f/secretariat/`desk_yuna` | 확인할 부분만 남겨둘게요. | `sig-yuna-2` / 신규·216 |
| `sig-haru-3`<br>비교 카드 나란히 놓기 | 하루 | 2f/finance/`finance-b` | 좋은 것과 필요한 건 따로 보자. | `sig-haru-2` / 신규·216 |
| `sig-naeun-4`<br>쉬는 시간 안내 카드 놓기 | 나은 | 2f/life/`life-a` | 물 한 모금 하고 이어가요. | `sig-naeun-3` / 신규·216 |
| `sig-minji-3`<br>빈 스토리보드에 구도 잡기 | 민지 | 2f/life/`life-c` | 장면보다 흐름부터 볼게. | `sig-minji-2` / 신규·216 |
| `sig-minji-4`<br>카메라 내려놓고 메모하기 | 민지 | 2f/life/`life-c` | 이건 같이 보고 얘기하자. | `sig-minji-2` / 신규·216 |
| `sig-sooyeon-3`<br>지도 위 동선 손가락으로 짚기 | 수연 | 2f/life/`life-d` | 즐길 시간도 동선에 넣어요. | `sig-sooyeon-1` / 신규·216 |
| `sig-sua-3`<br>담당·기한 카드 맞추기 | 수아 | 1f/business/`business-west` | 담당부터 정하고 움직일게요. | `sig-sua-2` / 신규·216 |
| `sig-seoyun-3`<br>설계 화살표 다시 잇기 | 서윤 | 3f/platform/`dev-lead` | 연결 지점부터 맞추겠습니다. | `sig-seoyun-1` / 신규·216 |
| `sig-dohyun-3`<br>테스트 예시 카드 펼치기 | 도연 | 3f/platform/`dev-build` | 예시부터 맞춰보겠습니다. | `sig-dohyun-1` / 신규·216 |
| `sig-serin-3`<br>참고 자료 탭 나누기 | 세린 | 3f/platform/`dev-research` | 출처와 가정을 나눠둘게요. | `sig-serin-2` / 신규·216 |
| `sig-yuri-3`<br>범위 체크 카드 접기 | 유리 | 3f/platform/`dev-qa` | 확인한 범위만 표시하겠습니다. | `sig-yuri-1` / 신규·216 |
| `sig-arin-3`<br>빈 화면 카드 간격 보기 | 아린 | 3f/platform/`dev-design` | 읽는 순서부터 보겠습니다. | `sig-arin-1` / 신규·216 |
| `sig-gaeun-3`<br>회의 자료 표지 먼저 놓기 | 가은/MUSE | 4f/secretariat/`secretary_desk` | 회장님, 필요한 자료부터 준비할게요. | `sig-gaeun-1` / 신규·216 |
| `sig-gaeun-4`<br>후속 확인 메모 구분하기 | 가은/MUSE | 4f/secretariat/`secretary_desk` | 회장님, 확인할 부분은 따로 챙길게요. | `sig-gaeun-2` / 신규·216 |
| `sig-taeo-3`<br>고객 제안 표지 정리 | 채원 | 1f/business/`business-east` | 요청의 목적부터 확인할게요. | `sig-taeo-1` / 신규·216 |
| `sig-taeo-4`<br>확인 질문 카드 묶기 | 채원 | 1f/business/`business-east` | 확인할 질문부터 정리하겠습니다. | `sig-taeo-2` / 신규·216 |
| `sig-mir-3`<br>Station에서 연결빛 따라가기 | 미르/MIR | 4f/mir_nook/`mir_station` | 이쪽도 이어지네. | `sig-mir-2` / 신규·216 |
| `sig-seongmin-4`<br>회장님 모드 · 창밖 보며 커피 | 성민 회장 | 4f/ceo/`ceo-reserved` | 잠깐 보고 이어가죠. | `sig-seongmin-1` / 신규·216 |
| `sig-seongmin-5`<br>회장님 모드 · 직원들 사이 순시 | 성민 회장 | 2f/공용복도/`hall_2f` | 각자 페이스대로 이어가세요. | `sig-seongmin-1` / 신규·216 |
| `sig-jieun-4`<br>예산 정리 뒤 차분한 메모 | 지은 | 2f/finance/`finance-a` | 회장님, 정리할 흐름이 보이네요. | `sig-jieun-2` / 신규·217 |
| `sig-sooyeon-4`<br>여행 준비 카드 접기 | 수연 | 2f/life/`life-d` | 회장님, 준비는 차분히 이어가요. | `evt-travel-eve` / 신규·217 |
| `sig-serin-4`<br>학습 자료 연결 메모 | 세린 | 3f/platform/`dev-research` | 자료는 보기 편하게 묶어둘게요. | `evt-study-week` / 신규·217 |

## 3. 다인35 · 평시27 / 특별8

상세 기간·소품·조건·빈도·상태/근거는 JSON과 위 예산표 참조. 신규는 v1.2 문서 제안, 대표는216 핵심1개, rare는 희귀 개그입니다.

| ID / 행동 | 인물 | 실제 층 / 방 / 앵커 | 연출·대사 | 예산 가족 / 계획 |
| --- | --- | --- | --- | --- |
| `scene-meme`<br>히나와 수아의 밈 한 장 | 히나·수아 | 1f/cafe/`lobby-nw`<br>1f/cafe/`lobby-ne` | 히나: 이거 잠깐 봐용.<br>수아: 웃었으니 다시 일할게요. | `scene-meme` / 216 |
| `scene-coffee-menu`<br>나은의 커피 메뉴 추천 | 나은·유나 | 1f/cafe/`lobby-sw`<br>1f/cafe/`lobby-se` | 나은: 오늘은 편한 걸로 골라요.<br>유나: 추천부터 들어 볼게요. | `scene-coffee-menu` / 216 |
| `scene-snack-budget`<br>지은과 하루의 팬트리 간식 회의 | 지은·하루 | 2f/pantry/`finance-lounge-a`<br>2f/pantry/`finance-lounge-b` | 지은: 남길 만큼 사지는 말아요.<br>하루: 먹을 만큼, 좋아하는 걸로. | `scene-snack-budget` / 216 |
| `scene-routing-brief`<br>Routing Brief | 유나·하니 | 4f/exec/`board-n`<br>4f/exec/`board-ne` | 유나: 오늘 들어온 건 세 갈래예요.<br>하니: 좋아. 우선순위만 잡고 보내자. | `scene-routing-brief` / 216 |
| `scene-priority`<br>하니와 수아의 안건 우선순위 | 하니·수아 | 4f/exec/`board-n`<br>4f/exec/`board-ne` | 하니: 지금 필요한 것부터요.<br>수아: 담당과 기한도 붙일게요. | `scene-priority` / 216 |
| `scene-watch-pick`<br>하루와 민지의 오늘 볼 것 고르기 | 하루·민지 | 2f/pantry/`finance-lounge-a`<br>2f/pantry/`finance-lounge-b` | 하루: 지금 기분에는 이쪽이 어때?<br>민지: 보고 나서 얘기하자. 컷. | `scene-watch-pick` / 216 |
| `scene-travel-talk`<br>수연과 민지의 여행 한 장면 | 수연·민지 | 5f/terrace/`rooftop_table_slot_1`<br>5f/terrace/`rooftop_table_slot_2` | 수연: 동선이 있어야 즐기죠.<br>민지: 그 장면은 찍어 두자. | `scene-travel-talk` / 216 |
| `scene-intake-check`<br>수아와 유나의 일정 입력 확인 | 수아·유나 | 1f/consult/`client_booth_slot_1`<br>1f/consult/`client_booth_slot_2` | 수아: 담당과 날짜를 같이 볼까요?<br>유나: 빠진 부분부터 확인할게요. | `scene-intake-check` / 216 |
| `scene-update-board`<br>서윤과 하니의 HANI OS 업데이트 화이트보드 회의 | 서윤·하니 | 3f/release/`dev-meeting-nw`<br>3f/release/`dev-meeting-ne` | 서윤: 연결 구조부터 정리하죠.<br>하니: 이번 범위도 함께 표시해요. | `scene-update-board` / 216 |
| `scene-roof-selfie`<br>옥상 셀카 한 장 | 히나·민지 | 5f/terrace/`rooftop_table_slot_3`<br>5f/terrace/`rooftop_table_slot_4` | 히나: 이 각도 어때용?<br>민지: 좋아. 한 장 찍고 내려놓자. | `scene-roof-selfie` / 216 |
| `scene-scope-banter`<br>하니와 히나의 티격태격 | 하니·히나 | 2f/team_meeting/`meeting-sw`<br>2f/team_meeting/`meeting-se` | 하니: 이번 범위 밖인데요?<br>히나: 쉬는 시간 한 문제도요? | `scene-scope-banter` / 216 |
| `scene-paper-delivery`<br>유나가 가은에게 서류 전달 | 유나·가은/MUSE | 4f/secretariat/`desk_yuna`<br>4f/secretariat/`secretary_desk` | 유나: 분류한 자료 가져왔어요.<br>가은/MUSE: 고마워요. 다음 순서 볼게요. | `scene-paper-delivery` / 216 |
| `evt-chairman-idea`<br>갑자기 생각난 게 있는데 | 성민 회장·하니·가은/MUSE·미르/MIR | 4f/exec/`board-n`<br>4f/exec/`board-ne`<br>4f/exec/`secretary-side`<br>4f/exec/`mir_meeting_pos` | 성민 회장: 갑자기 생각난 게 있는데.<br>하니: 회장님, 목적부터 같이 잡죠.<br>가은/MUSE: 다음 순서 정리할게요.<br>미르/MIR: 왜 그게 떠올랐어? | `evt-chairman-idea` / 217 |
| `evt-release-eve`<br>배포 전날 릴리스 워 룸 | 하니·서윤·도연·세린·유리·아린 | 3f/release/`dev-meeting-nw`<br>3f/release/`dev-meeting-n`<br>3f/release/`dev-meeting-ne`<br>3f/release/`dev-meeting-sw`<br>3f/release/`dev-meeting-s`<br>3f/release/`dev-meeting-se` | 하니: 이번 후보 범위를 맞춰요.<br>서윤: 통합 순서를 보죠.<br>도연: 동작을 확인하겠습니다.<br>세린: 근거를 비교하겠습니다.<br>유리: 검증 범위부터요.<br>아린: 쓰는 화면도 볼게요. | `evt-release-eve` / 217 |
| `evt-month-end`<br>월말 재무 협업 | 지은·하루 | 2f/team_meeting/`meeting-nw`<br>2f/team_meeting/`meeting-ne` | 지은: 기간부터 확인할게요.<br>하루: 필요했던 소비도 같이 보죠. | `evt-month-end` / 217 |
| `evt-study-week`<br>학습 주간 자료 회의 | 히나·세린 | 2f/team_meeting/`meeting-sw`<br>2f/team_meeting/`meeting-se` | 히나: 이해되는 설명부터 볼게용.<br>세린: 근거를 비교하겠습니다. | `evt-study-week` / 217 |
| `evt-market-shock`<br>시장 큰 변동 확인 | 하니·미르/MIR | 4f/exec/`board-n`<br>4f/exec/`mir_meeting_pos` | 하니: 확인된 변동부터 볼까요?<br>미르/MIR: 같이 움직였다는 건 왜일까? | `evt-market-shock` / 217 |
| `evt-travel-eve`<br>여행 전날 계획 점검 | 수연·나은·지은 | 2f/team_meeting/`meeting-nw`<br>2f/team_meeting/`meeting-ne`<br>2f/team_meeting/`meeting-e` | 수연: 동선부터 한 번 더요.<br>나은: 쉬는 시간도 넣어요.<br>지은: 비용 범위도 같이 볼게요. | `evt-travel-eve` / 217 |
| `evt-friday-camera`<br>금요일 민지 카메라 | 민지·수연 | 1f/cafe/`lobby-nw`<br>1f/cafe/`lobby-ne` | 민지: 오늘 장면, 한 장만.<br>수연: 찍고 나면 다음 동선 보죠. | `evt-friday-camera` / 217 |
| `evt-rooftop`<br>가끔 열리는 옥상 모임 | 하니·민지·나은·수연 | 5f/event_roof/`rooftop_event` | 하니: 잠깐 함께 쉬어요.<br>민지: 한 장 찍고 내려놓을게요.<br>나은: 편하게 쉬다 가요.<br>수연: 돌아갈 시간도 정하죠. | `evt-rooftop` / 217·수동만 |
| `scene-study-scope`<br>하니와 히나의 수업 범위 합의 | 하니·히나 | 2f/team_meeting/`meeting-nw`<br>2f/team_meeting/`meeting-ne` | 하니: 수업도 핵심부터 잡아볼까요?<br>히나: 좋아용, 설명은 제가 맡을게요. | `scene-scope-banter` / 신규·216 |
| `scene-compare-care`<br>지은과 하루의 비교 기준 | 지은·하루 | 2f/pantry/`finance-lounge-a`<br>2f/pantry/`finance-lounge-b` | 지은: 오래 쓸 기준부터 보죠.<br>하루: 취향도 옆에 적어둘게요. | `scene-snack-budget` / 신규·216 |
| `scene-rest-bookmark`<br>나은과 히나의 쉬는 책갈피 | 나은·히나 | 2f/pantry/`finance-lounge-a`<br>2f/pantry/`finance-lounge-b` | 나은: 설명 끝나면 물 한 모금 해요.<br>히나: 책갈피 꽂고 쉬어갈게용. | `scene-coffee-menu` / 신규·216 |
| `scene-camera-route`<br>민지와 수연의 걷는 구도 | 민지·수연 | 5f/terrace/`rooftop_table_slot_1`<br>5f/terrace/`rooftop_table_slot_2` | 민지: 걷는 장면은 눈으로 담자.<br>수연: 좋아, 동선은 내가 볼게. | `scene-travel-talk` / 신규·216 |
| `scene-owner-label`<br>수아와 유나의 담당 라벨 | 수아·유나 | 2f/team_meeting/`meeting-nw`<br>2f/team_meeting/`meeting-ne` | 수아: 담당 칸을 남겨둘까요?<br>유나: 분류하고 함께 확인할게요. | `scene-intake-check` / 신규·216 |
| `scene-secretary-tabs`<br>유나와 가은의 자료 탭 | 유나·가은/MUSE | 4f/secretariat/`desk_yuna`<br>4f/secretariat/`secretary_desk` | 유나: 확인 질문은 앞쪽에 뒀어요.<br>가은/MUSE: 회장님 자료에 같이 챙길게요. | `scene-paper-delivery` / 신규·216 |
| `scene-design-handoff`<br>서윤과 도연의 연결 메모 | 서윤·도연 | 3f/platform/`dev-lounge-a`<br>3f/platform/`dev-lounge-b` | 서윤: 연결 지점부터 맞추죠.<br>도연: 구현 예시를 옆에 둘게요. | `scene-update-board` / 신규·216 |
| `scene-review-pair`<br>도연과 유리의 범위 확인 | 도연·유리 | 3f/platform/`dev-lounge-a`<br>3f/platform/`dev-lounge-b` | 도연: 예시는 여기까지 준비했어요.<br>유리: 확인할 범위부터 맞추죠. | `scene-update-board` / 신규·216 |
| `scene-readable-evidence`<br>유리와 아린의 읽는 순서 | 유리·아린 | 3f/platform/`dev-lounge-a`<br>3f/platform/`dev-lounge-b` | 유리: 근거는 어디에 둘까요?<br>아린: 읽는 순서에 맞춰볼게요. | `scene-update-board` / 신규·216 |
| `scene-source-layout`<br>세린과 아린의 자료 카드 | 세린·아린 | 3f/platform/`dev-lounge-a`<br>3f/platform/`dev-lounge-b` | 세린: 출처 표시는 남겨둘게요.<br>아린: 자료 흐름이 잘 보이게 둘게요. | `scene-update-board` / 신규·216 |
| `scene-client-questions`<br>수아와 채원의 제안 질문 | 수아·채원 | 1f/consult/`client_booth_slot_1`<br>1f/consult/`client_booth_slot_2` | 수아: 후속 담당부터 붙일게요.<br>채원: 요청 목적은 제가 정리할게요. | `scene-priority` / 신규·216 |
| `scene-mir-context`<br>하니와 MIR의 생각 여백 | 하니·미르/MIR | 4f/mir_nook/`hani-side`<br>4f/mir_nook/`mir_station` | 하니: 우선순위는 여기까지 잡죠.<br>미르/MIR: 남은 연결은 조금 더 볼게. | `scene-routing-brief` / 신규·216 |
| `scene-hani-delegate`<br>하니와 수아의 판단 넘기기 | 하니·수아 | 4f/exec/`board-n`<br>4f/exec/`board-ne` | 하니: 이건 담당자가 먼저 보죠.<br>수아: 실행 순서는 제가 잡을게요. | `scene-priority` / 신규·216 |
| `scene-haru-minji-cover`<br>하루와 민지의 감상 표지 | 하루·민지 | 2f/pantry/`finance-lounge-a`<br>2f/pantry/`finance-lounge-b` | 하루: 마음에 든 이유도 남겨볼까?<br>민지: 좋아, 장면 옆에 붙이자. | `scene-watch-pick` / 신규·216 |
| `scene-map-rest`<br>수연과 나은의 쉼표 동선 | 수연·나은 | 5f/terrace/`rooftop_table_slot_1`<br>5f/terrace/`rooftop_table_slot_2` | 수연: 쉬는 자리도 동선에 넣을게요.<br>나은: 그럼 오래 즐길 수 있겠네요. | `scene-travel-talk` / 신규·216 |

## 217 = Context-aware + Secondary/Rare Expansion 데이터 인지 제안과 미확정 경계

신규3개 모두 긍정/중립 대사, 정확한 숫자·평가·질책·생활 원문 없음. 기존 특별 가족의 조건/시간창도 계승하고 확정 readonly selector·공유 오피스 어댑터가 확인되기 전 자동 비활성입니다. 필드 이름은 구현된 selector라는 뜻이 아닙니다.

| 신규 ID | 조건 / 기존 예산 | 미확정·자동 차단 이유 |
| --- | --- | --- |
| sig-jieun-4 | budget_context / sig-jieun-2 | JISPI 경고/해제 확정 selector 미확인, fixture로 실제 재무 상태 추정 금지 |
| sig-sooyeon-4 | travel_tomorrow / evt-travel-eve | 계약 startDate만 계승, readonly selector·신선도·오피스 어댑터 근거 확인 전 차단 |
| sig-serin-4 | study_week_confirmed / evt-study-week | 확정 시험일 selector 없음, 완료 퀴즈로 미래 학습 주간 추정 금지 |

기존 quiz_completed/perfect·exercise_logged·no_spend_confirmed·production_deploy_record·market_crash_signed/abs_move·chairman_active/expression_manual·release_eve_confirmed·month_end·friday·rooftop_approved도 JSON triggerCatalog의 owner/근거/차단 사유 그대로입니다. 모두 automaticReady=false. 필드가 보인다는 이유로 자동 활성화하지 않습니다. 216 전체 triggerIds는 비어 있고 생활 원본·실데이터를 읽지 않습니다. 건강·재무·학습 대사는 긍정/중립만이며 정확 금액·점수·횟수·평가·질책을 전달하지 않습니다.

## 엔진·예약·데이터 보존 경계

기존 office canonical owner 한 곳에서 해석하는 후속 설계이며 새 timer/renderer/event layer를 추가하지 않습니다. 모든 참여자+명명 슬롯 원자 예약, 타인 홈 강제 점유 금지, 경로는 Spatial edge/문1인·승강기FIFO/벽·책상·core 관통 금지. capacity만으로 명명 슬롯을 대신하지 않습니다. 실패하면 base-work/원래 일정. MIR은 exec 참석 시 mir_meeting_pos, Station 장면에서는 mir_station입니다.

현재 층·visible에서만 animation, 다른 층은 상태투영·DOM/timer 중지, 복귀 밀린 재생 금지. reduced motion은 최종 pose+정적 대사, 깜박임/보행 loop 없음. 메모리만 사용하는 설계로 reload/다중탭 중복방지는 미보장, 보호 저장소·내부버전·Cloud write/schema·migration·신규 영속화 없음. 정확 수치/건강·재무·학습 원문은 대사·JSON에 복사하지 않습니다.

## 변경 이력 v1.1 → v1.2

| 계층 / 목록 | v1.1 | v1.2 | 증감 |
| --- | --- | --- | --- |
| 기본(업무 기본상태 포함) | 12 | 30 | +18 |
| Signature | 46 | 70 | +24 |
| 다인 전체 | 20 | 35 | +15 |
| 평시 다인(다인 부분집합) | 12 | 27 | +15 |
| 특별8종(다인 부분집합) | 8 | 8 | 0 |
| 전체 | 78 | 135 | +57 |
| 216 | 42 | 96 | +54 |
| 217 | 36 | 39 | +3 |
| 수동 Preview(217 부분집합) | 6 | 6 | 0 |
| 빈도 가족(기본상태 제외) | 77 | 77 | 0 |

- 공간 변형18개: desk3/pantry2/lounge2/meeting2/rooftop3/lobby3/server2/MIR1. 실제 앵커에만 연결, 시설/사람 추가 없음.
- Signature24개: 무데이터21개+217 데이터인지3개. 등록18명 모두3~5개, role-first 유지. 하니 한발 빠지기 변형, 회장 도장/커피/순시, 희귀 개그 rare 표시. 기존 sig-seongmin-1만 도장 제스처로 구체화하며 기존 ID 삭제 없음.
- 평시15개 추가: 모두2줄 한국어, 실제 방·서로 다른 명명 앵커. 하니+히나 협력 scene-study-scope를 구체화해 미래 후보에서 제거, 이중 집계 없음. 새 동료 대본은 제안이며 사적 관계를 Canon으로 확정하지 않습니다.
- 모든 빈도·cap은 리뷰 그대로. 평시 JSON25% 잔존값만 초기15%로 정정. 77개 부모 예산에서 원본+변형 하나만 선택하고 가중치를 분할하므로 총 빈도 증가 없음. 특별8개의 기존 contract 확률/cooldown/시각/priority/지속/조건 불변.
- v1→v1.1의26개 리뷰별 변경 이력은 JSON changeLog에 원문 계승, 역사 설명은 [v1.1 변경 이력](office-actions-v1.1.md) 참조. 이번 변경 요약은 JSON changeLogV12에 별도 기록.

## 변경 이력 v1.2 → v1.3

| 목록 | v1.2 | v1.3 | 증감 |
| --- | --- | --- | --- |
| 기본 / Signature / 다인 | 30 / 70 / 35 | 30 / 70 / 35 | 0 |
| 평시 다인 / 특별 | 27 / 8 | 27 / 8 | 0 |
| 전체 | 135 | 135 | 0 |
| 216 = Living Office Core | 96 | 98 | +2 |
| 217 = Context-aware + Secondary/Rare Expansion | 39 | 37 | -2 |
| 수동 Preview(217 부분집합) | 6 | 6 | 0 |
| 빈도 가족 / 신규 예산 | 77 / 0 | 77 / 0 | 0 |

- 하니 핵심 `sig-hani-1`·`sig-hani-2`를216으로 이동하고 전략/운영 성격 위에 한발 빠지기 위임 레이어를 유지했습니다.
- 민지 쿠션 정리는2F `finance-lounge-a`, 유리 마커 정리는3F `dev-meeting-nw`, 유나·하니 Routing Brief는4F `board-n`·`board-ne`로 정정했습니다. 사람·기존 가족·확률·휴지·상한은 동일합니다.
- 두 릴리스 명칭을 위 표대로 통일하고 **승인된 Spatial 변경 (하니 전무 2026-10-17)**을 기록했습니다. 인간 정체성과 CEO Frog 외형의 실제 Spatial 필드 분리는216 구현으로 인계합니다.
- 크아악20%·2일 cooldown·Market Shock 동일일 억제, 희귀 개그8%·3일, 평시 다인15%·건물 최대3/일, 특별 최대2/일·동시1, 데이터 `automaticReady=false`와 전체 `runtimeEnabled=false`를 보존했습니다.
- 기존 v1/v1.1/v1.2 파일을 보존합니다. 이전 변경 이력은 당시 기준 수치이며 현재 목록은 v1.3의98/37입니다. JSON `changeLogV13`에 같은 변경을 기록했습니다.

## 검증과 인계

JSON 파싱·135개 ID유일성·MD135행 대응·모든 person/room/floor/anchor/home/route 참조·등록18명 Signature3~5/대표1·216/217=98/37 배타분할·수동6 부분집합·모든 runtimeEnabled=false/automaticReady=false·77가족 및 기존 빈도/특별8종 계약 불변을 정적 검사합니다. 공간 정정3건의 홈→앵커 Spatial edge 연결도 확인합니다. 실제 스케줄러·렌더러 실행 PASS로 보고하지 않습니다.

이전 v1/v1.1/v1.2 여섯 파일·Spatial·명부·캐릭터 원본·office-live·index의 시작 SHA256을 대조합니다. 실제 결과·검사 명령·미검증·커밋 시도는 [v1.3 작업 인수인계](../development-history/handoffs/2026-10-17-office-actions-v1.3.md)에 기록합니다. runtime build/version/Production QA N/A. 실제 UI/selector·동시성·아린/HINA·Preview/운영 read-back 미실시. Notion 착수 append는 자동 승인 검토의 approval policy is never 거절로 갱신 대기입니다.
