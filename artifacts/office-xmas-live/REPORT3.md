# 크리스마스 269 pin 계층 3차

2026-11-06 KST · Codex · `hani/office-xmas-live` · HEAD/base `bd8ba0c91344c4986ea0237190ad894c18d265cb` 위 미커밋.

**전체 49파일 실행: 48파일 성공, 1파일 실패.** TAP 집계 572통과·0실패·3기존 skip (TAP 이전에 중단한 219는 별도). 219의 기존 이름표 contrast assertion은 요청대로 보존했습니다. `spawnSync git EPERM`은 **BLOCKED로 분류할 항목이며, 이번 실행 발생 0파일**입니다. Native Git 경로를 PATH에 지정하여 고정 커밋 blob 검사도 실제 통과했습니다.

- 269 fixture: JS **7쌍**, CSS **2쌍**, 모든 after 유일·순서/비겹침·양방향 전체 바이트 일치. 기준은 이동하는 ref가 아닌 `f753c66af9d2b6a7535924e8d237e8b1980ae67a`의 실제 Git blob입니다. JS SHA256 `447edb86def004395e66af6aa79950280c23f3698f53af28db8d1f6fe6f6b148`, CSS `b00bf744040c4cc24529eda7c9a5ad1ce2da40fd9e16a5a626668869b15ae368`.
- 269→268 복원을 268 helper 앞에 연결했습니다. 기존 **268 fixture 23쌍·모든 hash 그대로**입니다. Zoom은 재고정된 G 전체 hash도 검증한 뒤 269→G literal pairs→268 pairs 순서와 G round-trip을 확인합니다. G/residents fixture hash 변경 없음.
- Props는 기존 7개와 **정확히 5개 장식·총12개**를 같은 생성 경로에서 검사합니다. 기존 createElement/listener 수는 증가하지 않아 icons 수정 불필요(15/15 통과). Residents closure에는 `assets/office-season/xmas.webp` **1개만 명시 추가**했습니다.
- Xmas 실패 원인: 2차 승인 좌표가 이전 literal과 달랐고, 보호 baseline은 268 pet/bubble 통합 전이었습니다. 눈 `(1580,230),160×204`·선물 `(520,443),48×36`을 검사하고 269→268→기존 baseline 복원으로 원래 section hash를 유지합니다. index/main은 고정268 hash와 정확한 버전 문자열 역변환 후 기존267 hash를 모두 검사합니다. assertion 삭제·skip·임의 범위 허용 없음.
- Syntax **9/9**, 보호 파일 **406/406 SHA256 불변**(운영 JS·CSS·index/main·268 fixture·assets 전체), closure **153/160·누락0**. 버전·캐시 **2.9.268 유지**, commit/push/merge/배포 없음. UI·운영 코드를 수정하지 않아 새 실화면/Release QA는 N/A이며 기존 skip 3건을 PASS로 표시하지 않았습니다.
- 병렬 실행에서 cafe-rest의 400ms 검사가 405~417ms로 실패했습니다. 다른 검사 종료 후 같은 코드·같은 400ms 한도로 단독 **4/4 통과**했으며 최초 실패 로그도 보존했습니다.

원격 main은 GitHub connector로 `9cd7cb44482f0bdf95e69e031a2fc4d6769eee97`(#431, atlas 1개 추가) 확인. 로컬 origin 캐시는 `67363f7`이며 #431 commit object는 없어 통합 여부는 단정하지 않습니다. 고정268 비교·현재 atlas 검증에는 영향 없으며 fetch/merge/rebase하지 않았습니다.

변경 파일(개발 도구 10개):

- 신규: `scripts/fixtures/office-xmas-269-delta.json`, `scripts/hani-office-xmas-269-source.mjs`, `scripts/hani-office-xmas-269-pins.test.mjs`.
- 수정: `scripts/hani-office-pets-268-source.mjs`, `scripts/hani-office-pets-268-pins.test.mjs`, `scripts/hani-office-tlayout-fixture.mjs`, `scripts/hani-office-props.test.mjs`, `scripts/hani-office-residents.test.mjs`, `scripts/hani-office-xmas.test.mjs`, `scripts/hani-office-zoom.test.mjs`.
- 기록/근거: 이 보고서, [인수인계](../../docs/development-history/handoffs/2026-11-06-office-xmas-live-round3.md), `round3-prepare.py`, `round3-summarize.py`, `round3-tests/`(실행기·전체 로그·고정 blob·보호 hash·identity·results/summary).

실행: `artifacts/office-xmas-live/round3-tests/run-tests.ps1` → 모든 `node --test-reporter=tap scripts/hani-office-*.test.mjs`를 파일별 실행. 상세는 [실행 원본](round3-tests/results.json)·[최종 집계](round3-tests/summary.json)·[identity](round3-tests/identity.json).

| 테스트 (`hani-office-*.test.mjs`) | 통과 | 실패 | 기존 skip | 결과 |
|---|---:|---:|---:|---|
| 219 | — | — | — | FAIL (기존 contrast) |
| actions-216 | 15 | 0 | 0 | PASS |
| actions-221 | 20 | 0 | 0 | PASS |
| barista | 10 | 0 | 0 | PASS |
| behavior | 10 | 0 | 0 | PASS |
| bubble-close | 17 | 0 | 0 | PASS |
| cafe-rest | 4 | 0 | 0 | PASS (단독 재검사) |
| chairman-234 | 15 | 0 | 0 | PASS |
| consult | 20 | 0 | 0 | PASS |
| crowded-labels | 19 | 0 | 0 | PASS |
| drama | 20 | 0 | 0 | PASS |
| fix-218 | 6 | 0 | 0 | PASS |
| floor-bubble | 18 | 0 | 0 | PASS |
| hd-224 | 10 | 0 | 0 | PASS |
| icons | 15 | 0 | 0 | PASS |
| labels-qa | 17 | 0 | 0 | PASS |
| lively-v2 | 8 | 0 | 0 | PASS |
| lively | 13 | 0 | 0 | PASS |
| motion-1 | 16 | 0 | 0 | PASS |
| motion-2 | 24 | 0 | 0 | PASS |
| obr10 | 4 | 0 | 0 | PASS |
| obr12 | 5 | 0 | 0 | PASS |
| obr14 | 5 | 0 | 0 | PASS |
| obr15 | 14 | 0 | 0 | PASS |
| obr16 | 12 | 0 | 0 | PASS |
| obr17 | 3 | 0 | 0 | PASS |
| obr18 | 12 | 0 | 0 | PASS |
| obr19 | 3 | 0 | 0 | PASS |
| obr21 | 6 | 0 | 0 | PASS |
| obr3 | 5 | 0 | 0 | PASS |
| obr4 | 10 | 0 | 0 | PASS |
| obr6 | 4 | 0 | 0 | PASS |
| obr7 | 2 | 0 | 0 | PASS |
| obr8 | 3 | 0 | 0 | PASS |
| obr9 | 1 | 0 | 0 | PASS |
| pets-268-pins | 1 | 0 | 0 | PASS |
| pets-bubble | 22 | 0 | 0 | PASS |
| props | 11 | 0 | 0 | PASS |
| residents | 49 | 0 | 0 | PASS |
| seats-215 | 12 | 0 | 0 | PASS |
| snack | 26 | 0 | 0 | PASS |
| tap-lines | 15 | 0 | 0 | PASS |
| tlayout | 13 | 0 | 0 | PASS |
| top-labels | 7 | 0 | 0 | PASS |
| v2-215 | 18 | 0 | 2 | PASS |
| visitors-cafe | 5 | 0 | 0 | PASS |
| xmas-269-pins | 2 | 0 | 0 | PASS |
| xmas | 13 | 0 | 0 | PASS |
| zoom | 12 | 0 | 1 | PASS |

Notion 기록은 자동 승인 검토가 `approval policy never`로 쓰기를 거절하여 미반영입니다. 이 결과·기준 SHA·다음 행동을 인수인계에 갱신 대기로 보존했습니다. 다음 담당은 변경 diff와 보고서를 검토하면 되며, 배포 승인 단계로 진행하지 않았습니다.
