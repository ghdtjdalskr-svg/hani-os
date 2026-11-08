# fix278 보고서

2026-11-07 KST / Codex / `hani/office-companions` / base `ccda3c8`, 확인한 원격 main `b736774`. runtime `aa5c9893`, contract `22a25dca`. **검증 완료·Git 권한 차단으로 미커밋**.

- 계획 계산: 정적 목표·동행·예약 색인과 연속 거리 검사 재사용, 내부 자원 예약 끝점 배열로 중간 객체 감소·공개 조회 형식 보존. 원본과 16개 날짜/재실 조합의 전체 계획·공개 자원 예약값·매분 snapshot, 3일 직원 수다/날짜 전환 동등성 **3/3 통과**.
- baseline: `index.html`·`hani-main.js`·`hani-office-live.css`를 main `b736774`의 정확한 Git blob으로 갱신. CSS의 기존 승인된 순찰 1줄은 고정 278 역변환으로 비교하며, 실제 세 파일은 착수 HEAD와 바이트 동일함을 별도 확인.
- xmas: 직원 수다·남매 방문의 메모리 Map 초기화 5곳을 새 Map 할당으로 교체. 현재 runtime `.clear(` **0개**, xmas 정규식 변경 없음. 기존 278 계약 값 보존·정확한 역변환 확장.

동일 코드에서 각 성능 시험 **3회**, 매회 새 엔진 3개. 기존 **best-of-three <400ms** 기준 그대로:

| 시험 | 1/2/3회 판정값(ms) | 전체 개별 표본 최대(ms) |
|---|---|---|
| cafe 회장님 부재 | 268.7 / 269.5 / 274.3 | 294.3 |
| cafe 회장님 재실 | 313.7 / 313.9 / 301.8 | 356.1 |
| lively-v2 | 331.4 / 340.4 / 324.4 | 429.6 |

두 성능 assertion은 3회 모두 통과. **320ms 목표는 lively 미달이며, 모든 개별 표본이 400ms 미만인 것은 아님**. 원시 표본은 [성능 결과](resume-performance.json)에 보존.

- 전체 재시험: office/helper-bot/fun-chat 및 신규 시험 **67개 파일, 724통과·Git 실행 차단 32·기존 skip 5·기타 실패 0·누락/취소 0**. xmas의 전체 source 검사는 Git 조회에서 차단되어 PASS가 아니며, raw clear 0과 저장/Cloud 참조 보존은 신규 검사로 별도 확인. 성능 2개와 xmas 시험 파일은 HEAD의 Git blob과 같아 기준 완화 없음.
- syntax 6/6·runtime closure 161개/누락 0·기존 계약 보존·보호 파일 9개 동일 확인. 표시/캐시 `2.9.277` 유지, 저장·Cloud·schema·새 timer/listener 경로 변경 없음. 실제 브라우저 및 release build/One-Pass/HINA/배포 검증은 이번 범위 밖.
- **미커밋**: 실제 `git add`가 worktree `index.lock` 생성 권한 거부로 실패, staged 파일 0. push/merge/버전 변경 없음. Notion 읽기는 성공했으나 기록 추가는 자동 승인 검토가 정책 `never`로 거절하여 갱신 대기.

근거: [전체 결과](resume-regression/summary.json), [최종 대조](final-proof.json), [동등성](equivalence-resumed.log), [보존·syntax·closure](validation.json), [Git·Notion 차단](resume-commit.json), [인수인계](../../docs/development-history/handoffs/2026-11-07-fix278.md).
