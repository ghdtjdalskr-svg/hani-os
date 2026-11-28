# 세린 작업 보고 — 1층 로비 스태프 코너

## 바꾼 줄
- `hani-organization-hub.js` L174~L182: 기존 `.ogh-mascots` 닫는 태그(`</section>`) 바로 뒤에 `<section class="ogh-mascots ogh-lobby-staff" aria-labelledby="ogh-lobby-title">` 및 로비 스태프 6명 카드 마크업 추가 (`rows`/`people` 21명·조직도 팀 미포함, 정적 마크업만 추가).
- `hani-organization-hub.css` L407~L412: `.ogh-mascot-bori` 바로 뒤에 `#haniOrganizationHub .ogh-staff-{dasom,narae,sodam,haram,iseul,eunha}` 배경 이미지 6줄 추가 (`.ogh-mascots` 기존 여백·구분선 재사용, 360px 폭에서도 `minmax(min(100%,300px),1fr)`로 1열 유지).

## hours 확인 결과
- `hani-office-live.js` L3044~L3049(`residentPeople`) 및 L4331~L4342(`shiftHandoverPairs`) 확인 결과 모두 지시서 시간과 일치함:
  - 다솜 (`npc-clerk-day`): `[[7,19,'1f']]` → `07~19시`
  - 나래 (`npc-clerk-night`): `[[19,24,'1f'],[0,7,'1f']]` → `19~07시`
  - 소담 (`npc-guide`): `[[9,18,'1f']]` → `09~18시`
  - 하람 (`npc-desk-night`): `[[18,24,'1f'],[0,9,'1f']]` → `18~09시`
  - 이슬 (`npc-barista-iseul`): `[[7,19,'1f']]` → `07~19시`
  - 은하 (`npc-barista-eunha`): `[[19,24,'1f'],[0,7,'1f']]` → `19~07시`

## 걱정되는 점
- 셸 및 브라우저를 쓸 수 없어 문법 검사, 18개 이미지 파일 경로 실존 여부, 360px/데스크톱 실제 렌더링(특히 `.ogh-mascot-portrait`의 `background-position:center` 기준 인물 상반신 잘림 여부)은 미검증 상태입니다. 서윤 팀장님 확인이 필요합니다.
