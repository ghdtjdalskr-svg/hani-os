# 308 준비 · 시험 층 정리

2026-11-22 KST · 도연/Codex, 단일 Agent. `hani/building-5f` / HEAD `735b0e4`. **main 합치기 전 조사 완료. 추가 연결이 필요한 새 실패 0건, 운영·시험 본문 수정 0건.**

`scripts/*.test.mjs` **293개를 각각 별도 Node 프로세스로 끝까지 실행**했다. **191 PASS / 종료 실패 101 / 전체 skip 1(미검증)**. 실패 101개는 tooling-306 이전 main `077df04`의 독립 Git 객체 입력에서도 같은 첫 오류·실패 검사명이 재현됐다. 101개 중 일반 실패 29개, Git·URL·브라우저 등 실행 제약을 포함한 파일 72개이며, 이 72개에는 아래 성능 실패 2개도 포함된다. 전체 PASS가 아니다.

대조는 같은 시험의 runtime owner 9개를 main 원문으로 읽는 방식이다. Git refs·객체·단언은 바꾸지 않았고, 실패 대조 후반은 해당 실패 단언만 골라 실행했다. 새 기능 전용 시험은 현재 입력으로 검증했다. [파일별 결과](local/layer308/results.md) · [실패 대조](local/layer308/comparison.json).

| 분류 | 확인 결과 | 처리 |
| --- | --- | --- |
| (a) 움직임 1·2단계 바이트 | 신규 실패 0 | 기존 office-motion inverse 연결 유지 |
| (b) Phase 1·2 변경 | 신규 실패 0 | 기존 최외곽 Phase 2 → Phase 1 연결 유지 |
| (c) Git merge-base/HEAD·고정 이력 | 새 실패 0. 기존 버전 투영 실패 4개는 아래 목록 | 수정 없이 서윤 인계. Git 실행 자체가 막힌 항목은 미검증 |
| (d) 성능 | lively-v2·cafe-rest 2파일의 cold 기준 미달, main에서도 재현 | 각각 현재/main 단독 2회 재시도. 기준·단언 유지 |

성능 재시도: lively-v2 현재 warm **1.239 / 1.265ms**(`<3ms`), cold best **509.1 / 515.9ms**; main warm **1.410 / 1.335ms**, cold **582.7 / 596.4ms**. cafe-rest 현재 cold **501.6 / 529.8ms**, main **602.8 / 542.1ms**. cold는 모두 `<400ms` 실패이며 단순 흔들림으로 PASS 처리하지 않았다. cafe는 회장님 부재 케이스에서 실패하여 재실 케이스는 미도달했다. 실제 브라우저 틱 성능은 미검증이다. [측정값](local/layer308/performance.json).

**보완·보존:** 누락 연결이 발견되지 않아 추가 import·새 inverse·기존 hash/fixture/단언 변경 **0개**. 현재 Phase 1 **10/10**, Phase 2 **14/14**, 새 움직임 polish-2 **10/10** 통과. 고정 역변환 경계 **14곳**의 Git 원문 대조 일치. 지정 JSON **5개** 원래 바이트 복원, 생성 자료 **16개**를 `local/layer308/`로 이관했다. 착수 **2,552파일** 대조에서 운영·보호 경로 변경·누락 0. 저장·Cloud·schema 변경 0, 표시/cache **2.9.306** 유지.

main 합친 뒤 서윤이 확인할 것:

- 기존 고정 이력 실패 목록: `hani-settings-225.test.mjs`, `hani-settings-225-qa-guard.test.mjs`, `hani-simplify-225.test.mjs`, `hani-theme-white-215.test.mjs` — 모두 `train version cannot roll back`, main 입력에서도 동일. Git/HEAD 신규 회귀로 단정하지 않았으며 이번에 수정하지 않았다.
- `scripts/hani-release-305-source.cjs`의 현재 Phase 1 진입과 main의 helper-bubble 진입 연결 정리. Phase 1에 내장된 306 역변환이 canonical release-306의 raw capture보다 먼저 실행되거나 중복 적용되지 않는지 확인. 기존 frozen fixture·단언·hash 유지.
- main에 추가된 `hani-helper-bubble.test.mjs`, `hani-helper-bubble-layer.test.mjs`, `hani-release-306.test.mjs`와 307 관련 시험·Git 기준을 통합 후 재검증. 현재 브랜치에는 이 3개가 없어 실행하지 않았다. 기존 cold 성능·Git/URL/브라우저 제약도 별도 해소·재검증 대상이다.

로컬 origin/main은 `cd916e2`; 원격 ls-remote 연결 실패로 최신성은 미확인이다. 소스 마지막 JS는 `hani-launch-greeting.js`, 실제 Production 로딩은 미검증. **main 통합·commit·push·배포·Notion 갱신은 수행하지 않았다.** [인수인계](../../docs/development-history/handoffs/2026-11-21-building-layer308.md).
