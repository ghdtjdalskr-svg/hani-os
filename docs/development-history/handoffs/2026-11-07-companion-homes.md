# 동행 동물 부서 상주 인수인계

## 작업 식별
- 2026-11-07 KST / Codex / 구현·targeted 검증 완료, Git·실화면 검증 대기 / NORMAL.
- worktree companion-homes / branch hani/companion-homes / base c590f8ab64270857e5f50d82330f89a126e3b8a6.
- 승인: ../companion-homes-task.md 전체 UTF-8 정상. 지정 배치·전용 시험·기존 회귀·로컬 새 commit. push/merge/버전 변경 금지.
- 범위: hani-office-live.js의 companionSnapshot, strict 278 외곽 역변환과 시험, artifacts/companion-homes 및 이 인수인계. 다른 담당 파일 덮어쓰기 없음.
- CODEMAP living-office owner/DOM은 확인, companionSnapshot/petMotion anchor·전용 시험은 없어 CODEMAP_MISS로 실제 owner 검색. 기존 updateResidents → residentSnapshot → companionSnapshot → kidsVisits → persistent actor update 경로 사용.
- 원격 main: Git 통신 실패 후 GitHub connector로 882e6c604c5bdc1a72cb7fde1151f67d7b4f236f 확인(278 배포 commit). base와 공통조상 b736774, main ahead1/base ahead12. 수정 전 runtime JS Git blob d57be02b04aa8a4d8b51d9b70b97c10fb4211090이 main과 동일함 확인. 자동 merge/rebase 없음.
- 로컬 표시/cache는 실제 2.9.277(과제의 278 후보 명칭과 구분), index/main 수정 없음.

## 결과와 증거
- 구현·전체 지정 회귀 실행 완료. 아래 권한 차단/skip/실화면 미검증은 PASS로 표시하지 않음.
- Notion 착수 페이지 생성 후 fetch read-back 확인: https://app.notion.com/p/411c5275707481b69d22f4bfb5bbc11a.
- 저장/Cloud/schema 변경 예정 없음. runtime 파일·timer/listener 추가 없음.
- release build/One-Pass/HINA/배포/Production read-back은 이 기능 작업 범위 밖.
- 최종 runtime 84b448af3f4251d33b4d992016a7f158524fad49bbeb589c67e8a07c80d557ec / contract a096d64a75128b63d1b67e5b0a2c51ef648a24653be77da8100ca4ae68f21c2c. companionSnapshot 안 5개 complete replacement만 변경, 다른 모든 runtime byte 및 원래 278 계약 전체 일치.
- 실제 7일×1440분 비동행 지정 층·평일1마리/주말남매·펫 간 거리 PASS. 동행은 비동행보다 먼저 배치해 자리 우선권 보존. 2F 실제 실행 선택의 양끝 정류장 예약 분리, 기존 petMotion/free/residentSafe 그대로. 신규 파일은 개발 시험/증거/문서뿐이며 runtime 파일 추가0.
- 전용16 중15통과·Git subprocess EPERM1차단(공통DOM6 포함), kids-lively 별도15/15. 기존 주민 snapshot과 히든 방문/남매 동물 대사/순찰 소스 byte 일치. 새5종 5F 재회 대사는 더 이상 발생하지 않음, 지정 부서에서만 가능. 대사 일일 발생률 전수 검증 아님.
- 기존 안전 자리 부족 시 펭귄4·여우99 분 표본 숨김(각10080개 표본), 다른 동물0. 강제 겹침이나 타 층 fallback 없음. 상세 daily-maxima.json.
- Edge 원래 launch는 spawn EPERM, task-owned 임시 프로필 native launch 뒤 CDP는1006 연결 종료. 1280×900 토요일14시 4F/2F PNG 미생성, 실제 화면 PASS 아님. preview.ps1/mjs·preview.json에 재실행/실패 증거 보존.
- 로컬 Git add 실제 시도: worktree index.lock Permission denied(exit128), staged0·commit 없음. push/merge/버전 변경 없음. 보고서 git-add.log.
- Notion 착수 page 생성·fetch read-back은 성공. 이후 진행 replace_content는 자동 승인 검토 approval policy never로 거절. 최종 상태/결과/원문 링크를 Notion에 갱신 대기로 보존하며 완료로 표시하지 않음.
- 최종 `./artifacts/companion-homes/run-checks.ps1`: office65파일+helper-bot/fun-chat2 = 67파일, 최종736통과·Git EPERM33차단·기존skip5·그 외 실패0. Windows/Node v24.20.0. pets-bubble의 원래4마리 fixture가 상주 수달까지 집계한3건은 assertion을 그대로 두고 정확한 외곽 inverse로 원래 입력 복원, 해당 파일 전체 재실행21통과·Git1차단. kids-lively의 원래 pet 불변 비교도 정확한 inverse 입력으로 보존. 신규 홈 시험은 현재 raw runtime/DOM/7일 전체를 직접 검사함. 초기 실패 및 중간 재실행은 별도 로그로 보존.
- 전체 회귀 후 `./artifacts/companion-homes/final-performance.ps1`: 원래 성능 test body/400ms·warm3ms 기준을 수정 없이 targeted3회. cafe 부재 best291.4/281.7/302.3ms·재실316.7/311.8/306.2ms, lively282.5/288.4/282.2ms·warm0.755~0.767ms, 전체 개별cold최대344.5ms. 모두3/3 PASS. 초기/동시 실행 측정은 최종 근거로 재사용하지 않음.
- `node artifacts/companion-homes/summarize.mjs`, `node artifacts/companion-homes/performance-summary.mjs`, `node artifacts/companion-homes/final-proof.mjs` exit0. JS syntax6파일·git diff --check PASS. 직접 git rev-parse의 base runtime blob과 strict inverse 복원 blob 일치, index/main/CSS/data/atlas git diff0. closure161·누락0, timer/listener counts2/4/15 및 실제 mounted timer2 불변·실행 저장0. 최종 근거는 REPORT.md·regression.json·identity.json·daily-maxima.json·final-proof.json.
- 표시 버전/캐시 태그/HANI_DISPLAY_VERSION 증가 금지 준수. 새 runtime 파일0, Edge Function·설정 동반 배포 없음. 승인 범위 밖 데이터·보호 키·내부 기준 버전·Cloud/schema/migration 변경 없음. PR/main/Pages/Production 미수행·완료 선언 없음.

## 다음 담당에게
- 먼저 artifacts/companion-homes/REPORT.md 및 final-proof.json 확인. 기능 owner는 companionSnapshot/updateResidents이며 다른 runtime 함수는 전체 byte 보존.
- 다음 한 가지 행동: Git 쓰기 가능한 담당 환경에서 차단된 Git 검사 확인 후 이 작업 파일만 로컬 commit. 대표님이 금지한 push/merge/버전 변경은 계속 금지.
- 추가 미검증: Edge1280×900 토요일14시4F/2F 실제 화면·Android·auth/Cloud·release/Candidate gates/Production. 필요 시 preview.ps1 재실행. 브라우저/데이터/배포 승인 추정 금지.
- Notion 갱신 대기 내용: 날짜·Codex·branch/base·목적·정확한 최종 검사 수와 성능3회·숨김/대사 제한·Git/화면 차단·로컬 REPORT 링크. 착수 page URL은 위와 같으며 최종 갱신/read-back 완료 아님.
- CURRENT에 확인된 최종 요약만 추가, DECISIONS 변경 없음. 기존 시험이 생성한 다른 artifacts/의 미추적 증거(office-behavior·fix-218·l216-2·night-actions-221 등)는 작업 코드가 아니며 stage하지 않음. 작업 전 tracked 파일은 깨끗했고, 최종 tracked diff는 이 작업 범위뿐임.
