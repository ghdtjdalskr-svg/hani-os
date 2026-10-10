# MISSION M2 · 표지·포스터 C단계 패치 인수인계

## 작업 식별
- 날짜(KST): 2026-10-10 / 담당 도연(Codex), 관리 서윤(Claude Code).
- 상태: 읽기 전용 unified diff 준비. 실제 적용·실행·배포 없음.
- worktree: five / HEAD 및 원격 main: f56e1bbd3fe76a3ce7e67d3f6e0acf725d53bbf7.
- branch·candidate: 생성하지 않음. 표시 v2.9.197 및 캐시 태그 유지.
- 승인: MISSION M2 구현 준비. 실제 migration은 대표님 확인 후 owner 버튼 실행.
- 범위: media core, 설정 카드/dialog, C·복구 runner, 보호 media merge, 기존 VM 테스트.
- 타 기능·보호 키·내부 VERSION·schema·hani_state write 구조 변경 없음.

## 결과와 증거
- C 활성화: 모든 ref의 IDB 재읽기/digest 및 Cloud 목록 확인.
- 실행: idle·owner 확인 → 완전 재결합 안전본 → 모든 Cloud 본문 digest 확인 → 일치 inline만 비움.
- 참조·다른 데이터 유지. 같은 candidate에 minMediaWriterVersion 설정, 기존 save 한 번.
- 불일치 inline/ref는 보존·건수 보고. 누락·손상·계정/기록 경합은 저장 전 중단.
- 다시 내장: 빈 inline만 IDB/Cloud 본문으로 채움. 참조와 최소 쓰기 버전 유지.
- ref-only는 보호 병합에서 inline을 다시 삽입하지 않음. 실제 유실은 inline 또는 ref로 보호.
- cloudMediaSignature의 기록 식별 기준 및 해시 함수는 유지. inline-only hash 계약 변경 없음.
- resolver는 기존 캐시/hydration 사용. export 재결합은 Cloud 누락 캐시도 검증해 채움, 누락 시 중단.
- 실행 검증: V8 구문 및 모의 digest/IDB/Cloud로 C 추가 사례와 B targeted 회귀 통과.
- 실제 Node/SHA-256·IndexedDB·인증 RLS·UI·보호 storage·릴리스 gate는 미검증.
- Node 실행 파일을 현재 shell에서 찾지 못함. 파일·원본 데이터·PR/push·main·Pages 변경 없음.
- Notion 요약 미반영: update_page가 승인을 요구했으나 approval policy never로 차단. 저장/read-back 없음.

## 다음 담당에게
- 주변 CRLF/LF를 유지해 적용 후 node scripts/hani-media-core.test.mjs 실행.
- 기존 backup/cloud-stability/egress/보호 storage Full Safety 검사와 PC·모바일 Preview 필요.
- 취소/ESC·중복 클릭·세션 전환·quota·다른 기기 revision 경합·실제 export 누락 차단 확인.
- 다른 mission의 hash 계약 변경이 합쳐지면 C와 복구가 기존 save로 Cloud 전송되는지 재검증.
- 배포 열차 담당이 후보를 동결·버전을 한 번 증가. 대표님 Preview/승인·서버 HINA 후 배포.
- 실행 전 모든 기기/열린 탭 새로고침을 대표님이 확인. C 실행 후 36장 및 다른 기기 read-back 필요.
- CURRENT/DECISIONS의 타 작업 기록은 수정하지 않음. Notion에는 적용·검증 결과와 미검증 경계를 갱신.
