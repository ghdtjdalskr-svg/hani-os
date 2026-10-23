# 233 시드 선행 검증 인수인계

## 작업 식별
- 2026-10-23 KST / 도연(Codex), 브라우저·배포 담당 서윤.
- 상태: 최종 전체 회귀·VM 완료 / Git 쓰기 차단 / 서윤 Preview·시드 선행 반영 판단 대기. 사용자 obr5 B 명세로 데이터 불변·최소 기대값 조정·VM·로컬 커밋만 승인.
- worktree seed233 / branch hani/seed-233-office-data / base·유지 HEAD 7a10595f2a0890e63cd04dbc95c057edbbd3d5b0.
- 기존 staged 데이터3파일은 수정하지 않았다. 새 테스트 기대값/보조 모듈·로컬 증거만 작성했다.
- origin/main 로컬 7a10595, 셸 프록시 실패 후 GitHub 연결 도구로 원격 main 동일 SHA 확인. merge/rebase/main·버전/cache·Storage/Cloud/schema 변경 없음.
- push/PR/Notion/브라우저 명시 금지. Notion 미반영은 이 지시에 따른다.

## 결과와 증거
- 최초 전체 회귀: 99개 / 68 PASS / 29 FAIL / 2 browser SKIP. 두 CLI-only 검사에 wildcard 인수가 전달된 환경 실패와 옛 좌석·명부·SHA·art 기대값을 분리했다.
- 수정 후 1차: 99개 / 93 PASS / 3 FAIL / 3 browser SKIP. 남은 책상 문구·등록 좌석·lazy 슬롯 기대값을 수정했다.
- 최종 targeted: 26개 / 24 PASS / 0 FAIL / 2 browser SKIP. 최종 전체99개 / 96 PASS / 0 FAIL / 3 browser SKIP(209.01초). report-seed233.md에 파일·명령·분류·운영 영향·위험 기록 완료.
- 실제 232 JS+데이터 VM: loader 326 anchor 수락, planned 행0, 스케줄 신규2명0, 기존17명·좌석 유효, mascot data-planned=false, 쓰기0. 실제 브라우저·Production 미검증.
- 데이터3은 obr와 byte 동일. 보호 좌표·326 anchor·edge는 immutable Git canon+명시 등록 delta exact 비교, art는 고정 전체 SHA로 검증한다.
- git add는 .git/worktrees/seed233/index.lock Permission denied. 신규 커밋 없음, 기존 staged 데이터3 유지.
- main/Pages/Production read-back 미실행. 배포 완료가 아니다.

## 다음 담당에게
- 먼저 artifacts/office-behavior/report-seed233.md와 seed233-vm.json을 읽는다.
- seed 선행 반영 여부와 Preview를 서윤이 결정한다. 데이터3은 운영232에도 즉시 영향을 준다.
- 이 branch 기대값은 232+시드 상태 전용이다. 233 runtime 반영 후 tooling PR에는 열차 쪽 검사와 조정하여 통합하며, 이 기대값을 새 runtime에 그대로 덮어쓰지 않는다.
- 브라우저 검사는 미실행이며 기존 명시 CLI 본문은 보존했다. 233 배포 후 tooling 인계 문서·검사와 구분한다.
- CURRENT/DECISIONS 타 담당 기록은 변경하지 않았다. 서버 Edge Function·설정 배포 없음.
