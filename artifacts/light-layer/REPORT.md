# 밝은 테마·출석판 시험 층 311

- 2026-11-23 KST · 도연 / Codex · 구현·요청 검사 완료, 서윤 인계 대기.
- branch `hani/theme-light-fix`, HEAD `6fb66ea86bece06b2bc56ab8df079c64903515fb`, 로컬 기준 `origin/main e707d3ada03f106c5b17c834fa5cf1a40e28754b`. 원격 최신성은 GitHub 연결 실패로 미확인. 임의 merge/rebase 없음.
- 승인 근거: `../lflayer-task.md`. commit·push·배포·Notion은 지시대로 수행하지 않음. CODEMAP_MISS로 실제 310/attendance owner를 확인.
- 구현: **light-311 → 310 → attendance → 309 → …** exact inverse. 새 source/preload/시험/fixture 4파일과 outerFiles 5파일 등록. 독립 Git 원문 대조·정방향 재생·변조 거부 검증. 추가 Git/ref 어댑터 없음.
- 기존 파일 변경 목록: `hani-release-310-source.cjs` 첫 bootstrap 1줄, `hani-attendance-board.test.mjs` 첫 import 1줄, `hani-menu-badges-historical-input.cjs` 새 등록 블록 7줄. 모두 `scripts/` 아래. **기존 단언·fixture·hash 불변**, attendance-layer 및 context-remote 시험 원문 보존.
- **전체 313파일 단독 실행: 212 통과 / 기존 실패 29 / 미검증 72 / 미실행 0.** 일반 실패 29개는 고정 main 입력에서도 동일 종료 코드·실패 단언·오류 내용으로 재현. REG 46개는 **45 통과 / UI203b 브라우저 1 미검증**. 신규 층 **8/8**, syntax **6/6**, `git diff --check` PASS. 사무실 성능 실패 0(실패 시 최대 2회 재시도 설정).
- 미검증 72: Git EPERM 10, 기존 Git 거부 어댑터의 URL 처리 오류 23, Edge launch EPERM 37, 프로세스·의존성 제약 2. PASS로 처리하지 않음. 실제 UI·Candidate·Production 미검증.
- 보존: 착수 tracked 2,627파일 중 위 기존 도구 3파일만 변경. 운영 177파일·보호 경로·버전/히스토리·기존 시험/fixture 보존. 지정 QA JSON 5개는 생성 결과를 local에 보관한 뒤 **착수 바이트로 복원·hash 확인**. 버전/cache 2.9.310 유지(도구 전용 버전 증가 N/A), 저장·Cloud·schema 변경 0.
- 이번 생성물 19개는 hash 보존해 `local/generated/`로 이관, 착수 전 산출물 218개는 원위치 보존. 로그·snapshot·큰 임시 자료는 `local/`에 보관하며 commit 제외.
- 실행: `node --test-reporter=spec scripts/<파일>.test.mjs`; 필요한 브라우저 인자는 실제 Playwright/Edge 경로로 보완. 근거: [최종 집계](local/final-evidence.json), [보존 검사](local/preservation.json), [이관 목록](local/relocated-generated.json), `local/final/*.log`, `local/main-input/*.log`.
- 다음: 서윤이 미검증 환경 재실행과 Git·Notion·후보 준비를 담당. main 병합·배포 승인으로 간주하지 않음.
