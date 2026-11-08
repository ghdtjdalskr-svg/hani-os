# 생활 편의 묶음 시험 정리 · 2026-11-08

- 담당 Codex / `hani/life-bundle` / 병합 HEAD `addcd20` / 기준 main `2bc9368`. 원격 최신성은 네트워크 실패로 미확인.
- 시험 전용 frozen delta와 preload로 **dev-report → wishlist → procrastination → study-retry → main** 역변환을 연결했다. 원래 assertion은 유지하고 혼합 개행까지 정확한 해시·원문 비교와 drift/중복/재적용 거부 검사를 추가했다.

| 시험 | 바로 아래 기준 / 바이트 기준 변경 이유 |
|---|---|
| dev-report | `aa09972`: 위시·미룬 일 보존, 보고서 내장 전18편. 생성기 기존 assertion을 이 층에서 유지하고 실제 병합 번들31편·신규13편·목록/본문/검색 검사를 추가. |
| wishlist | `c3f62f4`: 미룬 일 메뉴·view·render가 먼저 존재. inverse 해시를 main `c0ae237d…`→`94159172…`, index `42df5871…`→`fe35f0ba…`로 변경. |
| procrastination | `ff9283a`: 학습만 존재. main/index 기준 해시는 종전 그대로. dev-report·wishlist만 먼저 벗김. |
| study-retry | `2bc9368`: 세 바깥 레이어를 벗긴 뒤 기존 저장 owner·Cloud·서버·보호 버전 해시를 그대로 검사. |
| nav-groups | 새 메뉴 때문에 고정 nav 배열이 실패. canonical root main/index만 메모리 역변환; 임시 빌더·baseline 파일은 건드리지 않음. navlogin·dashboard Node 시험은 수정 전부터 통과. UI 결과는 별도 기록. |

- 검증: **92명령 실행 / 55성공 / 37실패**. 네 작업 전용 시험(학습26·미룬 일6·위시7·생성기10그룹), 역변환3, 번들5그룹, Quiz QA212·nav·navlogin·dashboard·design-system 정적 시험 PASS. 문법9파일·diff check PASS.
- office **67개 전부 실행: 39성공 / 28 Git `spawnSync git EPERM` 차단**. UI6개는 Edge/Chrome `browserType.launch: spawn EPERM`으로 차단. office 선택형 브라우저 옵션·실화면은 미검증이며 PASS로 처리하지 않았다.
- 기존 실패3개는 **독립 추출한 main `2bc9368`에서도 같은 오류 재현**: qa-1st의 `investmentMoveClass` fixture 미주입, qa-1st-safety의 `eol-map.diff` 입력 누락, 추가 tasks-QA212의 `homeActions` DOM fixture 누락. 이번 병합과 무관하여 assertion·런타임을 변경하지 않았다.
- 명령·개별 결과: [test-results.json](test-results.json), [실패 분류·main 재현](failure-analysis.json), [실행기](run-tests.ps1). Node 내부 Git 차단 때문에 Git archive로 독립 추출한 main을 `HANI_BRANCH_BASELINE`·`HANI_MAIN_BASELINE`에 지정했다.
- `hani-gemini-reports-build.test.mjs`의 임시 폴더 시험만 실행했다. 저장소의 번들 빌더 CLI·catalog 갱신은 실행하지 않았다.
- **런타임 closure 168파일 모두 병합 HEAD `addcd20`의 원시 Git blob과 정확히 일치**, 누락0. [파일별 SHA 증거](runtime-head-bytes.json). scripts/docs/artifacts 밖의 tracked diff도 0. 표시·cache2.9.280·보호 저장/Cloud/서버·schema 보존, 버전 증가·push·merge·배포 없음.
- 새 커밋은 `git add`의 `.git/worktrees/life-bundle/index.lock: Permission denied`로 차단되어 미커밋. Git 메타데이터 우회 수정 없음.
- Notion 착수 쓰기는 자동 승인 검토가 `approval policy is never`로 거절하여 미반영. 읽기만 성공했으며 최종 요약 갱신도 대기.
- 추가 QA 산출물 `artifacts/lounge-qa-212/`·`artifacts/qa-1st/ui-results.json`과 ignored 임시 archive는 보존했다(삭제 명령 정책 거절). 시험이 갱신한 tracked JSON4개는 이번 결과를 `generated-office/`에 복사한 뒤 검증된 HEAD 원문으로 복원, 관련 diff0. Git metadata 우회 수정 없음.
- 인수인계: [작업 기록](../../docs/development-history/handoffs/2026-11-08-life-bundle.md). Candidate Build·One-Pass·독립HINA·Production은 이번 시험 정리 범위 밖(N/A).
