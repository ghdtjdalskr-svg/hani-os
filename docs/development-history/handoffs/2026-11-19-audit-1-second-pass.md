# audit-1 · 시험 층 2차 보강

## 작업 식별

- 갱신: 2026-11-19 KST · 도연 / Codex
- 상태: 구현·허용된 회귀 검증 완료 / Git·실제 브라우저·배포 미실시
- 저장소 / 전달 branch: queenlabel / `hani/queen-last-month` (Git 조회 없음)
- 전달 base: `2220b6129c63721906a3788ee9a7681f197c4523` / candidate SHA 미생성
- 승인 근거: 성민 대표님의 `../audit1b-task.md` UTF-8 전체 수행 요청
- 목적: 기존 시험·단언·hash·fixture를 보존하고, 누락된 직접 실행 경로에서도 audit-1 → main299 exact inverse를 먼저 설치
- 수정 범위: 기존 entry 5곳의 import 1줄씩, direct test 전용 경계 모듈 1개, audit-1 전용 실행·검증 도구와 보고서
- 경계: Git·commit·push·배포·Notion 금지. 운영 파일·저장·Cloud write 경로 변경 금지. 원격 최신성 조회 없음.

## 결과와 증거

- source entry: `scripts/hani-reviewed-release-baseline.mjs`, `scripts/hani-helper-toggle-source.cjs`, `scripts/hani-office-affinity-cap-source.cjs`
- test 전용 entry가 없는 라운지·히스토리 시험: `hani-board-library-build.mjs`, `hani-one-pass-rules.mjs` 첫 줄에서 `hani-audit-1-direct-input.mjs`를 연결. 정확한 두 시험의 argv basename일 때만 inverse 설치. 일반 library build·Release Gate import는 원래 fs reader와 candidate 바이트를 유지함을 별도 실행으로 확인. builder/Gate 함수·판정·contract는 변경하지 않음.
- 기존 각 파일의 모든 바이트를 보존하고 첫 줄에 outer preload만 추가. 기존 audit-1 fixture와 preload 구현 재사용.
- 지정 시험의 바이트 회귀: brand/helper/OCR/affinity-storage/motion/reviewed-release 통과. 사무실 pin의 복원·변조 거절 단언 통과, Git 호출 부분은 실행 guard로 차단.
- affinity-storage는 실제 저장 실행이 아닌, inverse 이후 승인 owner 문자열과 외부 storage guard를 검사. preload 적용 후 3/3 PASS, 런타임 저장 경로 수정 없음.
- 전체 시험 근거: `artifacts/audit-1/local/second-pass/` (커밋 제외). `scripts/*.test.mjs` 276개를 cwd=queenlabel, 별도 Node 프로세스로 순차 실행. current에는 audit preload를 전역 주입하지 않음.
- baseline에는 고정 main299 객체의 runtime 입력만 사용. Git 실행 guard와 출력 격리만 양쪽 공통 적용. Git·브라우저 의존 실패와 시간초과는 통과로 계산하지 않음.
- 운영·데이터·보호 키·Cloud·schema·버전·캐시: 이 2차 작업에서 변경 없음.
- PR / Preview / main / Pages / 실제 JS / Production: 수행하지 않음.
- Notion: 이번 요청이 명시적으로 금지하므로 접근·갱신하지 않음. 보고서와 이 인수인계가 원문이며, 후속 담당의 허용 시점에 요약 반영 대기.

## 다음 담당에게

- 먼저 읽기: `artifacts/audit-1/REPORT.md`의 「2차 보강」과 `local/second-pass/summary.json`.
- Git 및 실제 브라우저 검증·릴리스 권한은 이 작업에 포함되지 않음.
- CURRENT / DECISIONS: 공통 현황과 다른 담당 기록 보존.
- 전체 수치와 미검증 상세는 아래 완료 기록 및 보고서 「2차 보강」 참조.

## 완료 기록

- 전체 `scripts/*.test.mjs` 276개 순차 실행: 종료 성공 174 / 실패·차단·시간초과 102. TAP 1,557 PASS / 58 FAIL / skip 10. 종료 성공에는 TAP 집계 없는 49개와 전체 SKIP 1개 포함.
- 고정 main에는 기존 시험 274개가 있으며 현행 원문 전부 일치. 현행의 실패 102파일을 고정 main 입력으로 재실행했고 102개 모두 같은 종료 코드·시간초과 여부·실패 단언 이름/숫자 재현. TAP은 현재 실패한 단언만 선택, 이름 없는 script 및 시간초과는 전체 실행. 현재 통과 파일의 main 반복은 생략.
- 새 실패 파일 0 / 새로 실패한 TAP 단언 0. 추가 소스 보강의 영향 6파일은 별도 재검사 결과를 최종 집계에 적용.
- 지정 주요 결과: brand 3/3, helper 8/8, OCR 14/14, affinity-storage 3/3, motion 16/16, reviewed-release 18/18, Bori M9 2/2(약 69.3초). audit-1 14/14 및 제공 parser 7/7 보존.
- 실제 Git/browser 프로세스 차단 기록 44파일은 원래 시험 PASS로 표시하지 않음. 대신 고정 객체 독립 byte/blob 대조 27건 PASS. 라운지 23 PASS/기존4 FAIL, 히스토리 10 PASS/기존4 FAIL. Bori-stroll은 current/main 모두 180초 시간초과이며 미검증 유지.
- 보존: 2차 착수 768파일 중 source entry 5곳만 import 1줄 추가. 원래 함수 본문은 고정 main 객체와 일치. 시험 301개(mjs/cjs)·fixture 121개 원문 보존, 원본 1,699파일 범위 밖 변경/누락 0. 지정 출력 JSON 4개 원본 SHA256 일치. 보고서는 원문 바이트를 유지하고 끝에만 추가.
- syntax: 수정·신규 JS 8파일 및 PowerShell 1파일 확인. 일반 builder/Gate 모듈 import의 raw reader·candidate 바이트 불변 확인. 운영·저장·Cloud·schema·버전/cache 변경 없음.
- 실행기 초기 EPERM/exit capture/배열 처리 중단 시도는 local 초기 폴더에 별도 보존하고 최종 집계에서 제외.
- 최종 증거: `artifacts/audit-1/local/second-pass/summary.json`, `current/results-final.json`, `baseline/results.json`, `independent-pins.json`, `builder-isolation.json`, 파일별 로그.
- 다음 행동: 후속 담당이 금지 범위였던 Git·실제 브라우저 검증을 수행. 전체 PASS·Candidate/HINA·main·Production 완료로 기록하지 않음.
- Notion은 명시 금지로 미접근·미갱신. 이후 허용되는 담당이 위 요약을 반영할 때까지 갱신 대기. 모든 `artifacts/audit-1/local/` 내용은 commit 제외, `.gitignore` 변경 없음.
