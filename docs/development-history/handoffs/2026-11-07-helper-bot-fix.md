# 도움봇 미표시 수정 인수인계

## 작업 식별
- 작업 ID / 제목: helper-bot-fix / 혼잡 화면 도움봇 배치 복원
- 갱신: 2026-11-07 KST / 담당: Codex, 독립 UI 검토 미실행
- 상태: 구현·targeted test 완료 / 실브라우저 검증 대기 / 미커밋
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/helper-bot-fix / helper-fix
- base·HEAD·원격 main: e936f8af0b71ab1cb18ca9120bfe04bfaa526d72 (GitHub compare identical)
- candidate SHA: 없음 / v2.9.270 유지 / 최종 script 선언 hani-launch-greeting.js, helper owner hani-ui-v02992.js
- 목표: 폰·PC 일반 콘텐츠 과밀 또는 슬롯 부족으로 도움봇이 사라지지 않음. 이유 속성 제공.
- 수정 범위: hani-ui-v02992.js helper place/update/기존 observer, scripts/hani-helper-bot.test.mjs, 본 인수인계·artifacts/helper-bot-fix/.
- 승인 근거: ../helper-fix-task.md 전부 UTF-8 정상 확인. commit/push/merge/버전 증가 금지 준수.
- CODEMAP_MISS: helper 항목 없음. 기존 owner·전용 테스트로 scoped discovery. 다른 담당 파일 변경 없음.

## 결과와 증거
- 수정 전 실행으로 폰 일반 버튼80개와 PC 1280/1920 mini 레일 슬롯 고갈의 숨김을 재현. 운영 계정 데이터 원인 확정과 구분.
- fixed/sticky UI·레일 조작부·포커스 입력만 회피. 슬롯 실패는 기본 우하단으로 복귀, 폰은 고정 하단바 위. 로그인/모달/no-duty의 명시적 숨김 및 data-helper-reason 추가.
- 기존 observer의 로그인/모달 변경 감지만 확장. 콘텐츠 애니메이션 스타일은 무시. 기존 리스너9개 유지.
- node scripts/hani-helper-bot.test.mjs: 23통과,0실패,브라우저1skip. 혼잡390×844·1280×900·1920×1080·레일상태·포커스·하단바·fallback·사유 검사 포함.
- node scripts/hani-nav-groups.test.mjs: 기본실행 git EPERM, 정확한 원문68파일을 HANI_MAIN_BASELINE으로 제공해 최종 통과. 원문 Git blob SHA 전부 main 트리와 일치, 검사는 수정하지 않음. 임시 사본: hani-helper-bot-fix-main-e936f8a.
- node scripts/hani-design-system-qa.mjs: 통과. vm.Script syntax 통과. helper place/update/observer 이외 UI 바이트 보존. 런타임 변경은 UI owner1파일뿐, closure155/160·누락0.
- 증거: artifacts/helper-bot-fix/REPORT.md, *.final.log, before-reproduction.log, verification.json, baseline-verification.json, browser-unverified.log. SHA는 미커밋 base이며 결과는 현재 작업파일 기준.
- 미검증: 실제 브라우저·로그인 실데이터·운영 read-back. Playwright import가 default export 오류, 선택적 브라우저 테스트1skip. 독립 Arin/HINA·Candidate package 미실행.
- 데이터·저장·Cloud·schema·보호 버전·표시/캐시 영향 없음. commit/push/PR/merge/배포 없음.
- PR/Preview: 없음. main merge/Pages 반영/운영 실제 로딩/기능 read-back: 미실행.

## 다음 담당에게
- 먼저 읽기: REPORT.md → hani-ui-v02992.js helper place() → scripts/hani-helper-bot.test.mjs.
- 다음 행동: 브라우저 가능한 환경에서 실제 로그인 Preview의 혼잡화면·로그인/모달 복귀 확인. 대표님이 금지한 commit/push/버전증가/merge는 수행하지 않음.
- blocker: 실브라우저 검증 환경. 구현 판단을 위한 추가 승인은 없음. 배포는 별도 승인/배포 담당 경계 유지.
- CURRENT/DECISIONS: 기존·다른 담당 기록 미수정. 본 작업 결과는 작업별 원문에 보관.
- Notion 갱신 대기: 착수 append가 자동 승인 검토 approval policy never로 거절. 다음 접근 가능한 담당이 본 보고의 날짜·branch/base·수정·검증/미검증·다음 행동을 현황판에 요약하고 저장 후 읽기 확인 필요. 연결/갱신 완료로 보고하지 않음.
