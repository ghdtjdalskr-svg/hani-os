# 개발보고서 자동화 결과

- 담당 Codex · 2026-11-08 KST · `hani/dev-report-auto` · base/HEAD `2bc93683182728877a6b8e543badb330a3312756`.
- 구현: `scripts/hani-dev-report-generate.mjs`와 시험·공개용 편집 자료. 기본 릴리스당 1편, 누적 범위는 3~5개씩 묶기·민감 패턴 차단·중복 범위 차단·동일 입력 동일 출력·쓰기 없는 `--check` 지원. 로컬 Git 커밋 제목/본문을 읽고, 실행 불가·본문 부재는 미확인으로 표시.
- 작성: **v2.9.230~280, 51개 릴리스 / 13편**. 기존 18편 보존. `_SOURCE-release-log.md` 원자료 표를 보존하고 자동 목록 추가. 날짜는 작성일이 아닌 원장 배포일. v280 커밋/PR 누락·인수인계 날짜 불일치 명시.
- 절차: [릴리스 후속 tooling 한 줄 실행](../../docs/development-history/dev-report-automation.md). 예약/CI 실행 연결은 미구현.
- 원인: 개발센터는 공통 release JSON loader를 공유하지만, 보고서는 `hani-main.js`에 목록·본문이 내장됨. **Markdown·문서 목록만 갱신해서는 앱에 나타나지 않음**. 지시대로 runtime 미수정. 기존 빌더의 자동 `approved` 지정·고정 Gemini 작성자 표시도 후속 검토 필요.
- 검증: 생성기 **9그룹 PASS**, 기존 번들 빌더 **5그룹 PASS**, 기존 `hani-mission-203a.test.mjs` PASS. 최종 생성 `--check` exit 0 / 차이 0. 13편·새 목록 민감 패턴 0·참조 링크 존재·실제 renderer의 목록/본문/검색 격리 실행·fetch/저장 접근 0. Node CLI가 차단되어 Node REPL에서 시험 파일을 그대로 import해 실행. [검사 출력](test-results.txt).
- 보존: 런타임 JS/CSS/HTML/JSON **97파일 SHA-256 동일**. 읽기 전용 Git index 비교 1,676개 중 기존 tracked 변경은 `_SOURCE-release-log.md`만(현황 요약 갱신 전). 기존 원고 18편과 내장 본문 동일. 표시 버전·캐시·생활 저장·Cloud·schema·gate 변경 없음.
- 미검증/예상 실패: 기존 `hani-dash-218.test.mjs`는 실행 환경의 문자열 코드 생성 제한으로 시작 차단. 번들 `--check` exit 1(원고31/내장18)은 **앱 미반영 증거**, PASS 아님. 실제 브라우저/운영·Git/PR 본문·원격 main 최신성 미확인. 원격 API 조회도 접근 실패. runtime build/version/배포 QA는 문서·tooling 전용 작업으로 N/A.
- 커밋: `git add` 실행 **EPERM**, staging 전 차단되어 **미커밋**. push/merge/버전 변경/배포 없음. [Git 시도](git-attempt.json).
- 다음: 서윤 팀장이 원고·미검증·번들 승인/작성자 표시를 검토하고 후속 tooling PR 준비. runtime 반영은 별도 승인·기존 열차 절차 필요.
- Notion: [착수 카드](https://app.notion.com/p/411c5275707481e68af5cf0e0d0fe3c4) 저장/read-back 완료. **최종 append는 자동 승인 검토가 `approval policy is never`로 거절하여 미반영**. [갱신 대기 내용](notion-pending.md) 보존. 카드 상태는 착수 시점 그대로이며 최종 갱신 완료로 보고하지 않음.

[작업별 인수인계](../../docs/development-history/handoffs/2026-11-08-dev-report-auto.md)
