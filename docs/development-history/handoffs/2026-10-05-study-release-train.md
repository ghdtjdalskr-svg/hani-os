# 공부 실제 뉴스 출제 — 배포 열차 인계

2026-10-05 KST / Codex / 상태: 탑승 대기. 최신 대표님 공지를 실제 사용자 메시지로 확인해 개별 배포를 중단했습니다.

## Branch / 기준 / 범위

- branch `hani/release-study-news-v185`, base `adb2e3bc34e6859a21bd092e1d5e149402358fdb` (운영 v2.9.184).
- runtime candidate `b065b5874323eeffedebe0b7459605d831fdeb17`; 인계 문서 추가 commit은 이 후보의 runtime을 바꾸지 않습니다.
- 변경 파일: `hani-study-v02984.js` (자료 조회·기사/거시/FU 소재·정규화·최소 뉴스 비율·중복 판정), `hani-main.js` (표시 버전만), `index.html` (버전/cache 참조만).
- 최신 공지 수신 전에 후보 표시 v2.9.185 및 캐시 태그를 이미 올렸습니다. 임의 rollback하지 않았으며 Claude가 묶음 버전과 참조를 결정해야 합니다.
- BMI·체지방률 목표 및 접근 가능한 배포 확인 UI 보존. 원본/다른 worktree 변경 없음.

## 서버 및 기존 PR

- `hani-learning-quiz` 0.4.1는 이미 Production Edge11/JWTtrue, 후보 소스 exact read-back 및 비로그인POST401 확인. 중복 배포 금지.
- 서버 소스 원본: `hani/study-news-release-v182-final` / `b9f5adb0ac0222f2feda1a49cb5164fb5115ed5d`, `supabase/functions/hani-learning-quiz/index.ts`. 현재 UI branch는 서버를 포함하지 않음; Claude가 서버 소스 Git 기록 통합 범위를 판단.
- 오래된 PR201/head ea8af082/base a7bb913/v182는 미병합이며 최신 기준선에 부적합. PR183/188은 과거 HOLD, PR197은 이미 병합 없이 종료. 이번 인계에서 어느 PR도 close/reset/merge하지 않음. 새 운영 PR 미생성.

## 검증 / 미검증

- 최신 v185 client 실제 VM 경로 + 서버 후보 모의 handler: 자료 추출/query·최근성·quota·오류/빈값 구분·JLPT 격리·state 무변경 PASS. JS syntax 및 diff check PASS.
- b065b58 새 package `142d503016e092c2d4c3258a05a9daba280e7ae51b977455fe9c714a6186a0a8`, 92파일/16,367,353bytes, contract2.0.8. OnePass PASS, PreQA YURI_PRE_QA_PASS. .audit/에 로컬 근거 보존, 독립 서버 HINA 완료 아님.
- 과거 실제 AI Preview 5/20문제 뉴스2/12·DBwritefalse, 대표님 Preview 확인. 기존 난이도 유지. 실제 기사 전체 사실검증·정답 위치 편중 해결을 주장하지 않음.
- 최신 후보 Desktop/Mobile 렌더 재검증은 완료하지 못한 채 새 공지로 중단. 이전 후보 화면 근거를 새 PASS로 재사용하지 않음. 새 CI·서버 HINA·사이트 merge/Pages/Production read-back 미수행.
- 데이터 키·내부 버전·Cloud write/schema/auth/release tooling 변경 없음.

## 다음 담당 / 자동화

Claude 배포 담당이 최신 main 기준에서 공부 소유 변경만 선택하고 버전·cache를 묶음 관리한 뒤 남은 UI/안전검사 및 필수 release gate를 수행합니다. Codex 개별 배포 자동화 `automation`은 PAUSED로 중지했고 과거 자동 배포 지시는 실행 금지로 기록했습니다.
실제 공부 Production 완료 후에만 기존 승인된 HANI 안정화 핫픽스 수행 후속 요청을 전달할 조건이며 이번에는 완료로 보고하거나 메시지를 보내지 않았습니다.
