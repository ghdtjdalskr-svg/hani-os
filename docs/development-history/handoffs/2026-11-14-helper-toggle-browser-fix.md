# helperoff2 · 브라우저 실패 정리

## 작업 식별

- 갱신 시각(KST): 2026-11-14, 담당 도연 / Codex 단독 개발.
- 상태: CSS 수정·지정 비Git 검증 완료 / 서윤 Edge·Git 재검증 대기. 미커밋 유지, 탑승·배포 완료 아님.
- 저장소 / branch / worktree: HANI OS / `hani/helper-toggle` / `helperoff` (작업 지시와 기존 인수인계 기준).
- base SHA: `7a91982de08a54452f6b9057f906d651f63a65ca`. Git 금지로 원격 최신성 재조회 없음.
- 목표: 설정 스위치와 말풍선 숨기기 버튼의 최소 44px 터치 크기 확보, main296 exact inverse 보존, 지정 회귀에서 새 실패 0.
- 수정 범위: `hani-style-08.css`의 두 버튼, `scripts/fixtures/helper-toggle-delta.json`, `scripts/hani-helper-toggle-source.cjs`, 관련 검증 산출물과 보고서.
- 승인 근거: UTF-8로 전체 읽은 `../helperoff2-task.md`. Git·Edge 금지. 서윤의 브라우저 대기 조건 수정 및 모든 기존/신규 단언 보존. 저장·Cloud·버전/cache 변경 없음.
- CODEMAP_MISS: 도우미 owner/anchor 없음. 기존 인수인계와 실제 CSS, helper 생성 경로 확인. 설정은 `#app` 안, 도우미는 `document.body.append(root)`로 밖에 위치.

## 결과와 증거

- 발견: `hani-design-system.css`의 모바일 `#app.app :is(...):not(.hani-office-actor)`가 `min-height:40px!important`, `min-width:40px!important`를 지정. 설정 스위치에는 이를 이기는 한정 선택자와 중요도 필요.
- 변경: 설정 스위치를 `#app #haniHelperSettings .btn[data-helper-visibility]`로 한정하고 최소 높이 44px·최소 폭 64px에 `!important` 적용. 말풍선은 `#app` 밖이므로 공통 모바일 규칙 대상이 아니며 `.btn[data-helper-hide]`로 한정해 최소 높이·폭 44px 지정.
- exact inverse: CSS after 해시와 신규 delta의 source pin만 갱신. main296 CSS before 해시 `ce9fbb9e75549f581443a241178fe0fa1fce45c84a614b5bc6652fb622e4350f` 유지. 신규 단위 시험 8/8 PASS로 독립 main296 객체와 양방향 원문 일치·변조 거절 확인.
- 보존 확인: 브라우저 시험·단위 시험·운영 JS는 착수 시와 바이트 동일. 기존 시험312개·fixture114개 원문과 단언 보존, runtime closure172→172/누락0. JS/source 문법 및 PowerShell parser PASS, 브라우저 raw serving/setup PASS(Edge 실행 없음).
- 실행기 보완: 첫 `& ./artifacts/helper-toggle/run.ps1`은 빈 결과 목록이 `$null`로 풀려 두 번째 결과 추가 시 dictionary 중복 키 오류로 중단. `$rows` 초기화를 명시적 배열로 감싼 한 줄만 보완해 전체 재실행 완료. 시험 단언·실패 판정 로직 변경 없음.
- 실행한 검증: `node scripts/hani-helper-toggle.test.mjs` 8/8 PASS(exit0), `& ./artifacts/helper-toggle/run.ps1` 비Git66파일 769PASS·기존6FAIL·skip3(exit1), `node artifacts/helper-toggle/summarize.cjs` 고정 main296 실패 목록·집계 동일 / 새 회귀0(exit0). office46파일 610PASS·0FAIL·skip1. Git27파일·지정 제외 settings2파일은 실행하지 않음.
- 추가 확인: `node artifacts/helper-toggle/audit.mjs` exit0, source/browser `node --check` 및 PowerShell parser PASS, process 차단 preload를 적용한 브라우저 `--check-setup` exit0(Edge/PNG 없음).
- 증거: `artifacts/helper-toggle/REPORT.md` 끝의 「브라우저 실패 정리」, `summary.json`, `audit.json`, `browser-setup.json`, `local/helperoff2-before.json`, `local/helperoff2-checks.json`, `local/test-logs/`.
- 최종 CSS SHA256: `f3d12144f169e4b76da3c44f325b254867aa456136d32ff676e670236de7038d`. delta SHA256: `1589b556e947f7e6a787e7edc9c633d01cbeff6e767e95657ea491996ba3e4d3`.
- 실제 Edge/PNG 및 Git 검증: 서윤 담당, 이 작업에서는 미실행.
- Notion 착수 기록 추가: 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 갱신 대기 내용을 이 인수인계에 보존하며 재시도하지 않음.

## 다음 담당에게

- 다음 행동: 서윤이 기존 브라우저 실행기로 390/1440 설정 스위치·말풍선 버튼 크기와 숨김/새로고침/복원 동작을 확인. 로그인 대기 조건 및 44px 단언은 원문 유지. 이후 Git 필요27시험·diff/commit/push는 서윤 담당.
- 미검증: 실제 Edge/PNG·44px 실측·기기 줌·Preview, 원격 최신성, Git 시험/commit/push, Candidate/HINA·Production. JS/저장·Cloud 및 표시 버전/cache 2.9.296 유지.
- 서버 Edge Function/설정 의존성 없음. main/Pages/운영 반영은 미실행.
- Notion 갱신 대기: helperoff2의 목적·두 버튼 CSS 수정·검증 결과·미검증·서윤 다음 행동을 기존 페이지 `418c52757074818bb28ad26939c9cb84`에 추가하고 저장 후 읽기 확인 필요.
- CURRENT: 확인된 helperoff2 수정·검증 결과와 서윤 재검증 대기 요약 추가. DECISIONS 변경 없음.
