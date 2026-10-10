# 표지·포스터 B단계 · 구현 패치 인수인계

## 작업 식별

- 날짜(KST): 2026-10-10 / 담당 도연(Codex), 관리 서윤(Claude Code).
- 상태: 읽기 전용 unified diff 준비, 적용·실제 검증 대기.
- branch/worktree: hani/media-separation-b / media-b.
- base: ecec88e68dc1bff318516ccc8f0eff53370039e5. 로컬 HEAD/origin/main 및 GitHub main 확인.
- 승인: 대표님 “B단계 진행할게” / B단계 표·RLS·수동 이미지 보관·기존 save로 ref 추가.
- 범위: SQL, media core, 설정 카드·dialog, 기존 Cloud 판단의 수동 B 참조 전송, 테스트.
- inline 제거·보호 키/내부 버전 변경·hani_state write 구조 변경·자동 migration·버전 증가·배포 없음.

## 결과와 증거

- 안전본 재결합 및 기존 archive read-back 성공 후 IDB·Cloud 검증. 실패 시 참조 계획 폐기.
- Cloud 목록은 ID만 조회. 본문은 요청 ID만 조회하여 bytes/MIME/digest 확인.
- 원본 inline 유지, 다른 기존 ref는 충돌로 보존. 기존 save 한 번, 실패 시 메모리 원본 복원.
- 실제 A 코드의 cloudComparableState에는 ref 정규화가 없었음.
  전송용 comparable는 ref를 보존하고 fingerprint만 inline의 부가 ref를 제외한다.
  ref-only 기록의 해시 계약은 C단계로 유보한다.
- 해시 동등 시 기존 sync가 push를 생략하므로 버튼에서 생성한 메모리 ticket만
  기존 cloudPushLocalRow로 전달한다. 기존 revision·owner·import 보호와 hani_state write 구조 유지.
- 새로고침으로 ticket이 사라진 경우 버튼 재실행은 이미 같은 ref를 수정하지 않고 기존 sync queue로 재전송 가능.
- 실행: 새 함수 V8 메모리 구문 검사. 모의 digest/IDB/Cloud로 정상·업로드 실패·본문 불일치·스냅샷 실패·충돌 준비 경로 확인.
- 실제 hash 함수 FNV: 기준 inline / 후보 inline / 후보 inline+ref 모두 fnv-8c533171.
- Node/Git 실행은 sandbox 접근 거부. 추가 Node 테스트, 실제 SHA-256/IndexedDB, 실제 인증 RLS·UI 미실행.
- 파일 적용·SQL 실행·PR/push·main 병합·Pages·운영 read-back 미실행. 표시/캐시 버전 v2.9.195 유지.
- Notion 갱신 대기: insert_content 도구가 승인을 요구했으나 approval policy never로 차단. 저장/read-back 미완료.

## 다음 담당에게

- 서윤: 주변 CRLF/LF 유지해 패치 적용 후 node scripts/hani-media-core.test.mjs 실행.
- 기존 Cloud 안정화·egress save simulation·백업 runtime·보호 storage/full safety 검사 실행.
- 개발 DB에서 SQL 2회 적용, 본인 select/insert 및 다른 계정·비인증·update/delete 거부 확인.
- PC/모바일 설정 확인·취소/ESC·중복 클릭·계정 변경·offline·quota·다른 기기 revision 경합 확인.
- 서버 표+RLS를 먼저 준비하고 열차 런타임 배포. 열차 후보 버전은 배포 담당이 한 번만 증가.
- 롤백: B 버튼/참조 hydration 비활성화 또는 A 런타임 복귀. inline 원본과 보관본을 삭제하지 않는다.
- Notion에는 적용·검증 결과만 갱신. CURRENT/DECISIONS의 타 작업 기록은 수정하지 않음.

## 운영 결과 (서윤, 2026-10-10)
- v2.9.196 배포 후 버튼이 focus/poll Cloud 확인 중 비활성·중단되는 문제 발견 → v2.9.197(PR #232)에서 확인 종료를 기다리도록 수정, busy-sync 회귀 테스트 추가.
- 대표님이 처음 실행한 SQL에는 `grant select, insert ... to authenticated`가 빠져 42501(permission denied) 발생 → 대표님이 grant 실행. 이 파일의 SQL에는 grant가 포함되어 있음.
- 대표님 실행 결과: "e · 36장 보관 확인 · 충돌 0건". read-back: 로컬 36개 ref 모두 digest 일치, hani_media 33행(중복 이미지 3개는 같은 digest 공유, 약 1.79MB), hani_state revision 587에 ref 36개 + inline 36개 유지.
