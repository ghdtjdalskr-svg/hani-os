# 표지·포스터 분리 A단계 · 패치 인수인계

## 작업 식별

- 날짜(KST): 2026-10-10
- 담당: 도연(Codex), 관리: 서윤(Claude Code)
- 상태: 읽기 전용 환경에서 unified diff 준비 / 적용·Node 검증 대기
- branch/worktree: hani/media-separation-a / media-a
- base: 6b18534a1e2a53e2ad7b5062355dbe8607229c0c (원격 main과 일치)
- 승인: 대표님 “2는 승인”, 2026-10-10 / A단계만
- 범위: media core, 렌더 3곳, 백업 호출부, 설정 카드, 로딩 순서, 테스트
- 데이터 쓰기·Cloud schema·migration·버전 증가·main 병합·배포: 승인 범위 밖

## 결과와 증거

- 파일 수정 없음. 이 문서도 패치에만 포함.
- inline 우선 resolver, 계정별 IDB namespace, commit 후 read-back/digest 확인.
- 자동 put 없음. ref 필드를 기존 state에 추가하지 않음.
- 백업용 복제본만 재결합. 누락 시 불완전 백업으로 중단.
- 백업 의존 호출부는 ref 재결합을 기다리고 실패 시 중단.
- 자산 업데이트실 2곳도 백업 호출자이므로 포함. 기존 저장·삭제·rollback 본문은 유지.
- inline export의 동기 boolean 반환·파일 내용·파일명 유지.
- import 검증은 이미 추가 필드를 허용하고 normalizer는 보존하므로 설명만 추가.
- Cloud 비교/해시/보호 media merge, Data Hub·월 fingerprint는 변경하지 않음.
- TODO: digest 정규화는 기존 inline hash를 바꾸고, cache→inline 정규화는 hydration에 따라 hash를 바꿈.
  B/C 전에 계정·기기와 무관한 공통 해시 계약 및 별도 승인 필요.
- 실행: V8 메모리 구문 검사, dry-run 원본 보존, inline 렌더 3곳 HTML parity,
  실제 export 함수의 inline 파일 bytes/동기 반환 parity, IDB 부재 시 불완전 export 무저장/무다운로드.
- 실제 cloud 함수 FNV fallback fixture: 변경 전/후 fnv-ae718f88.
- Node 테스트 실행은 Windows sandbox helper setup 오류로 차단. SHA-256·실제 IDB·화면은 미검증.
- 화면 표시/캐시 버전은 v2.9.194 유지. 새 core 태그 v2.9.195는 요청값.
- Production 실제 JS 로딩·기능 read-back, 후보 gate: 미실행.

## 다음 담당에게

- 패치 적용 후 node scripts/hani-media-core.test.mjs 실행.
- 이어서 backup-history/runtime, cloud-stability/runtime, cloud-egress-save-sim 관련 회귀.
- PC/모바일 서재·시청·설정, 계정 전환, IDB quota/private-mode, 참조 누락 백업 확인.
- 기존 혼합 CRLF/LF를 파일 전체 변환하지 않고 주변 줄 방식으로 보존.
- SHA fixture before/after는 테스트가 승인 base의 실제 cloud 함수와 후보를 각각 sandbox 실행.
- Node 기본 baseline은 git show 위 base:hani-main.js. baseline 파일을 세 번째 인자로 줄 수도 있음.
- 서윤이 적용·검증하고 배포 열차 탑승 여부 판단. Candidate/배포 완료로 표시하지 않음.
- CURRENT/DECISIONS 공통 내용은 변경하지 않음.
- Notion 요약 갱신 대기: 쓰기 도구가 승인을 요구했으나 approval policy: never로 차단. 저장/read-back 미완료.
