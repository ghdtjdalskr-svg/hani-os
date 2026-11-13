# THAW · JSON 위치 이동

## 작업 식별

- 갱신 시각(KST): 2026-11-13 · 담당 도연/Codex 단독 + 자동 검사.
- 상태: 구현·지정 비Git 검증 완료 / 미커밋 / 서윤 Git·Edge 검증 인계.
- 저장소 / branch / worktree: HANI OS / hani/theme-thaw / theme-thaw. Git 명령 없이 기존 객체 reader로 HEAD 0e8f385df27d9518620e65e8a03150ff1c61b077 확인.
- base SHA: bcc588ba634cc28ca9922210153f1cffec6d9e91(#502 포함), 전달 기준과 로컬 origin/main 일치. 원격 새 조회는 지시에 따라 미수행.
- 목표: 허용된 assets 경로의 JSON과 JSON 기준 상대 그림 경로를 기존 런타임 로더에 연결; closure JSON1/WebP2·누락0 및 지정 시험 확인.
- 범위: assets/theme-collections/collections.json 추가, hani-main.js 로더, 연혁 맨 위294 title/subject, THAW 전용 시험·fixture·browser.mjs·증거·보고서. 코드맵 THAW 항목 없음(CODEMAP_MISS); 기존 themeCollection owner 직접 확인.
- 승인 근거: ../thaw-move-task.md 전체 UTF-8 정상 확인 및 실행 지시. Git·Edge·버전 변경·저장/Cloud·게이트 계약 변경·main 재병합·배포 금지. 루트 JSON과 그림 보존.

## 결과와 증거

- 변경: 새 assets/theme-collections/collections.json(그림만 JSON 상대경로), hani-main.js 기존 loader의 literal fetch와 JSON URL 기준 그림 해석, 연혁 맨 위294 title/subject 2값(16자). 루트 JSON·그림2는 main bcc588b 및 착수 원문과 동일.
- THAW source/전용 fixture/시험2개·browser.mjs 및 이번 검증 도구·증거·REPORT-294.md 끝 JSON 위치 이동 절 갱신. 기존 다른 시험281파일·fixture110 바이트 보존, 단언·숫자·hash 변경 없음.
- 지정87파일 중 비Git60파일 모두 성공: 729 PASS / 0 FAIL / skip1. 사무실73 중 비Git46파일610 PASS / skip1, Git 필요27파일은 전체 미실행·목록만. skip은 zoom 실제 브라우저 CSS. history unit PASS(단언 수 미집계). Git/Edge 가드 차단 시도0.
- Closure: 원래 scripts/hani-runtime-closure.mjs 사용, 기존 raw171→새171·누락0, 새 JSON1+WebP2 전부 포함·루트JSON 미수집. THAW inverse168→frozen289 164·누락0. 세 경로 기존 allowed_paths 만족; 게이트/수집기 변경0.
- 보존 감사: 착수2,275파일 대비 허용 범위 밖 변경·신규0, history 2값만 변경·형식/BOM/줄바꿈 보존. index·표시/cache293·기존 write 표현식·보호 키·내부 버전 보존. 시험 갱신JSON4 원문복원, 새 street package 증거는 THAW 폴더로 이관. syntax6/6·PS parser PASS.
- 증거: artifacts/theme-thaw/evidence-move-294.json(개별 명령/로그·Git27목록), audit-move-294.json(closure/바이트), logs-move-294/, history-unit-move-294.json, street-package-check-move-294.json. 대상은 HEAD0e8f385의 미커밋 작업 폴더, frozen Candidate 아님.
- 실행하지 않은 검증: Git 필요 시험은 목록만, Edge 실제 UI·Candidate·One-Pass·HINA·배포·운영 read-back 미수행.
- 데이터·저장소·Cloud·schema: 변경하지 않음. 서버 Edge Function·설정·배포 순서 추가 없음. commit/push/PR/merge/버전 증가/배포 없음.
- Notion: 기존 THAW 작업 페이지 읽기 성공. 착수 append는 자동 승인 검토가 approval policy never로 거절. 갱신 완료 아님.

## 다음 담당에게

- 원문: artifacts/theme-thaw/REPORT-294.md 끝의 JSON 위치 이동 절.
- 다음 행동: 서윤이 보고서의 Git 27파일·실제 Edge 명령을 실행하고 변경 범위 검토·커밋/열차 인계. 배포 담당은 새 JSON·그림2의 최종 package 포함 및 실제 One-Pass를 확인해야 함. 구현 완료와 배포 완료는 별개.
- Notion 갱신 대기: 2026-11-13 KST · 도연/Codex · JSON 위치 이동 및 비Git 검증 완료/서윤 인계, base bcc588b/HEAD0e8f385, runtime·THAW 시험/fixture·browser·연혁 제목 최소 변경, 729PASS/0FAIL/skip1·Git27목록·raw171/누락0. Git/Edge/버전/배포 미수행. 기존 작업 기록 보존하여 append 후 read-back 필요; 자동 승인 never 거절로 이번 갱신 불가.
- CURRENT: 확인된 위 결과 요약을 맨 위에 추가. DECISIONS: 새 제품 결정 없음.
