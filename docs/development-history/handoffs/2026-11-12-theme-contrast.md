# 테마별 글자색 대비 점검 · tc291

## 작업 식별

- 갱신: 2026-11-12 KST / Codex, 검토·커밋·push 담당 서윤
- 상태: 진행 중
- 저장소 / branch / worktree: HANI OS / hani/theme-contrast / tc291
- base: 7769fbe0fedd760f39493af3a97fe7b377977acb (직접 ref 읽기 확인, Git 명령 없음)
- 목표: 모든 마감·계절의 주요 화면 대비 감사, 퀴즈 보기·이의제기 4.5:1 이상
- 범위: hani-design-system.css 끝의 CSS 묶음, scripts/hani-theme-contrast.test.mjs 및 전용 검사 도구, artifacts/theme-contrast/REPORT.md·증거
- 승인 근거: ../tc291-task.md 전체 UTF-8 정상 확인. Git·버전 변경 금지. ie290·tl288 owner 파일 미수정.
- 원격 최신성: Git 금지로 새 origin/main 조회 없음. 제공 기준 7769fbe, 로컬 ref와 일치.

## 결과와 증거

- CODEMAP study-daily-quiz owner·DOM·TEST API 확인. theme owner 항목 없음(CODEMAP_MISS), 실제 CSS·applySignatureFinish/applySeasonTheme 경로 fallback.
- 조사: renderQuizDetail → .study-exam-sheet/.study-question/.study-choice/.study-dispute. 시험지 밝은 배경에 상위 dark finish 글자 상속 가능성.
- 실행 검증: 진행 중. Edge Playwright launch는 spawn EPERM, 기본 PowerShell 실행 후 CDP 확인 중.
- 데이터·저장소·Cloud·schema: 변경 금지, 메모리 fixture만 사용.
- main / Pages / 표시 버전 / JS / 운영 read-back: 배포 작업 없음. 표시/cache v2.9.289 유지.
- Notion: HANI-87 착수 저장·read-back 확인. https://app.notion.com/p/415c5275707481fa9cbfe8d24b7e50f9

## 다음 담당에게

- 상세 결과: artifacts/theme-contrast/REPORT.md (완료 후 작성)
- 다음: Edge 감사 → CSS 최소 수정 → 회귀 → 부산물 원문 복원 → 서윤 인계
- 최종 승인·후보·열차·배포는 별도. Git/commit/push는 이 작업에서 실행하지 않음.
