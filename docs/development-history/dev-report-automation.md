# 릴리스 뒤 개발보고서 작성

담당: 서윤 팀장의 릴리스 후속 tooling PR. 원고는 성민 회장님이 읽는 쉬운 한국어로, 무엇이 바뀌었는지·이유·검증 근거·남은 위험을 적습니다. 이번부터 기본은 **릴리스당 한 편**입니다. v2.9.230~280의 밀린 원고만 기존 관례에 맞춰 3~5개씩 묶었습니다.

## 후속 PR에서 실행할 한 줄

공통 릴리스 원장에 대상 버전이 등록된 뒤, 실제 버전으로 바꿔 실행합니다.

```sh
node scripts/hani-dev-report-generate.mjs 2.9.281
```

- 범위: `--from 2.9.281 --to 2.9.284` 또는 `2.9.281~2.9.284`. 기본은 한 편씩, 밀린 기록에만 `--group-size 4`를 사용합니다. 3·4·5도 지원하며 마지막 묶음은 균등하게 나눕니다. 입력 전체가 세 릴리스 미만이면 짧은 묶음이 됩니다.
- 생성기 시험: `node scripts/hani-dev-report-generate.test.mjs`.
- 재현성/누락 검사: 같은 생성 명령 뒤에 `--check`를 붙입니다. 차이가 있으면 exit 1, 파일 쓰기 없음. 이미 생성한 묶음을 다른 경계로 중복 생성하면 중단합니다.
- 출처: `assets/data/hani-history-releases-v1.json`의 정확한 버전·날짜·제목, 해당 커밋의 로컬 Git 제목/본문, `docs/development-history/handoffs/`. Git은 고정 커밋에 `git show -s --format=%s%n%b`만 실행하며 네트워크를 쓰지 않습니다. Git 불가·커밋 누락·PR 본문 미보관은 미확인으로 적습니다.
- 출력: `docs/gemini-reports/<마지막 릴리스일>-<범위>-dev-report.md`, `_SOURCE-release-log.md`의 자동 목록 블록. 기존 수동 원고와 원자료 표는 보존합니다. `_SOURCE`는 Markdown 표 원자료이며 앱의 목록 파일이 아닙니다.
- 과거 공개용 설명은 `scripts/fixtures/dev-report-editorial-v230-280.json`에 보관합니다. 이후 버전은 제목 기반의 보수적인 초안을 만듭니다. 구체적인 이유·검증·위험은 담당자가 근거를 읽고 원고를 편집합니다. 직접 편집한 원고에 생성기를 다시 쓰면 덮어쓸 수 있으므로 `--check`로 먼저 비교하고 편집 자료에 확정 문장을 보관합니다.
- 출력은 민감 패턴을 검사하고, Git·인수인계 원문은 복사하지 않습니다. 개인 생활 내용·금액·건강 수치·인증정보는 넣지 않습니다. 공개용 편집 자료와 생성 원고를 담당자가 함께 읽어 검토합니다. 패턴 검사는 모든 개인정보를 알아내는 판정기가 아닙니다.

## 앱에 보이는 조건

개발센터는 `hani-organization-hub.js:loadHistoryReleases`가 JSON을 가져오고 `window.HaniReleaseCatalog.load`를 공유합니다. `hani-development-history-v1.js:refreshCatalog/mergeEntries`와 AI 업무가 이를 사용하므로 원장 갱신을 따라갑니다. 이 경로에 서술형 개발보고서 자동 작성은 없습니다.

개발보고서는 `hani-main.js`의 `HANI_GEMINI_REPORTS_BUNDLE` 안 `HaniGeminiReportCatalog`에 **목록과 본문을 함께 내장**합니다. `showView` → `HaniGeminiReports.render` → `renderList/openReport`가 이 값을 읽습니다. 보고서 Markdown이나 `_SOURCE-release-log.md`를 fetch하지 않습니다. 따라서 이번 문서·목록 변경만으로는 앱에 새 원고가 나오지 않습니다.

기존 `scripts/hani-gemini-reports-build.mjs`는 `hani-main.js`의 카탈로그 대입문을 변경합니다. 현재 빌더는 모든 원고의 `review_status`를 `approved`로 만들고 화면의 작성자도 `Gemini 작성 / Codex 원장 대조`로 고정돼 있습니다. **생성 원고를 자동 승인하거나 작성자를 Gemini로 보고해서는 안 됩니다.** 검토 완료 후 배포 담당자가 승인 범위와 작성자 표시를 확인해야 합니다. 표시를 고쳐야 하면 별도 runtime 작업으로 처리합니다. 이번 과제에서는 빌더의 쓰기 모드·runtime·버전·캐시·보호 gate·workflow를 변경하지 않았습니다.

확인용 `node scripts/hani-gemini-reports-build.mjs --check`의 차이는 앱 미반영을 찾는 증거입니다. 이번 상태는 원고 31편과 내장 18편 사이에 차이가 있으므로 exit 1이 예상됩니다. 이를 PASS로 바꾸려고 임의로 번들을 갱신하지 않습니다. 후속 runtime 반영은 배포 열차·기존 승인과 Candidate 절차를 따릅니다.

원장 검증·생성·시험·공개용 내용 검토를 후속 tooling PR의 완료 조건으로 사용합니다. 예약 실행·CI 자동 연결은 이번에 구현하지 않았습니다. 반복 실행을 릴리스 담당 절차에 넣은 상태이며 무인 자동화 완료로 보고하지 않습니다.
