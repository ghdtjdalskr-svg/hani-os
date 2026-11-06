# 272 보리·라벨 테스트 보수

2026-11-07 KST · Codex · `hani/pet-bori-live` · 시작/종료 HEAD `4b9a00463264b50ffba331699c9b7b530ee75739` · 미커밋

**56명령 중 54성공·2실패. 목표(219만 실패)는 미달입니다.** 기존 219 대비 실패 외에, HD의 실제 manifest 총용량 불일치가 남았습니다. `currentEntry` fixture 오류는 해결했습니다. 런타임·자산·index 473파일 byte/inventory 보존, 표시 2.9.271 유지. commit/push/merge/버전 변경 없음.

- 고정 v268 `f753c66af9d2b6a7535924e8d237e8b1980ae67a` 원본 SHA·발생횟수·v267 역전 pin 유지. 두 Xmas 검사는 공유 projection으로 캐시 `?v=`·표시 상수·기존 표시 문구만 정규화해 양쪽 전체 바이트 비교. UI/style의 오래된 캐시 세대도 처리하며 내부 버전·일반 코드·개행은 strict입니다. 기대값에 origin/main 사용 없음.
- 주민 closure: helper270 3개·보리272 3개를 각각 주석 달린 승인 목록으로 명시. 현재 helper의 실제 추가 참조는 다온·윤슬 2개(가은은 참조 없음), 보리 초상화2개가 복원 baseline에 남아 142→기존138 계약을 검증합니다. 현재 전체 closure 158/160·누락0. Xmas는 272 원문을 먼저 복원하고 같은 승인 파일만 구분해 기존 152→153 및 유일한 Xmas atlas 차이를 유지합니다.
- HD: 보리를 주민으로 분류해 직원25명·원본100프레임 검증 유지, 전체 atlas34·배우28을 정확히 확인. Snack은 props와 동일한 272→269→268→이전 pet 복원 순서이며 기존 section/model 해시 불변. Props 파일 자체 변경 없음.

## 남은 실패·차단

1. `hani-office-hd-224`: manifest `spriteBytes=1,133,790`, 실제 34개 합계 `1,173,194`. 차이는 보리 `39,404`바이트와 정확히 일치합니다. 고정 v271 `5f13d8d794184b35b29fb45e6539fd0d68c08b76`의 33개 합계·선언값은 일치하며, 현재 manifest는 보리 entry 하나만 추가됐습니다. **기존 총용량 assertion을 보존**했습니다. `assets/` 수정 금지이므로 실제 메타데이터는 미수정. 다음 허용 범위는 `assets/sprites-v3/manifest-v3.json`의 총용량 정정(1,133,790→1,173,194) 검토입니다. [고정 원본·합계 증거](pins3-verification.json).
2. `hani-office-219`: 알려진 직원 이름표 AA 대비 assertion 실패. 런타임 수정 금지로 유지.
3. `spawnSync git EPERM`: **BLOCKED(환경)**. 기본 PATH로 실행한 추가 기존 projection 검사에서 발생했고, 번들 Git PATH 지정 후 동일 검사 1/1 PASS. 지정 전체 실행의 Git 차단은 0건. 원격 main 조회는 네트워크 연결 실패로 최신성 미검증(로컬 캐시 `2111fc303338b98326623ef02eacf1811fa29eeb`). 원격과 비교해 기대값을 만들지 않았습니다.

## 검사표

실행: 번들 Node v24.22.1 / Git PATH 지정, `node artifacts/pet-bori-live/run-pins3-tests.mjs after`. office 전체(신규 projection 포함)·helper-bot·history 전체 실행. 4개 병렬 실행에서 성능 한도 실패가 난 cafe-rest/lively-v2만 `HANI_TEST_WORKERS=1`로 단독 재실행했으며 원래 한도·assertion은 미변경입니다. 최초 전체 결과와 단독 결과는 각각 [전체](pins3-after/results.json), [재실행](pins3-serial/results.json)에 보존했습니다.

최종 Node 보고 합계 **628 PASS / 1 FAIL / 4 SKIP**(공통 import 검사 중복 포함; 219 시작 assertion 실패는 이 합계 밖). syntax 8/8·diff check PASS. 추가 기존 release projection 1/1 PASS([로그](pins3-legacy-projection.log)). helper 실브라우저·일부 선택 검사는 원래 SKIP이며 실화면/Production/Candidate 검증은 N/A(테스트 전용).

| 테스트 파일 | 결과 | PASS/FAIL/SKIP |
|---|---|---|
| [hani-helper-bot.test.mjs](pins3-after/hani-helper-bot.test.mjs.log) | PASS | 23/0/1 |
| [hani-history-226.test.mjs](pins3-after/hani-history-226.test.mjs.log) | PASS | — |
| [hani-history-coverage.test.mjs](pins3-after/hani-history-coverage.test.mjs.log) | PASS | — |
| [hani-history-unify.test.mjs](pins3-after/hani-history-unify.test.mjs.log) | PASS | 14/0/0 |
| [hani-office-219.test.mjs](pins3-after/hani-office-219.test.mjs.log) | 기존 대비 FAIL | — |
| [hani-office-actions-216.test.mjs](pins3-after/hani-office-actions-216.test.mjs.log) | PASS | 15/0/0 |
| [hani-office-actions-221.test.mjs](pins3-after/hani-office-actions-221.test.mjs.log) | PASS | 20/0/0 |
| [hani-office-barista.test.mjs](pins3-after/hani-office-barista.test.mjs.log) | PASS | 10/0/0 |
| [hani-office-behavior.test.mjs](pins3-after/hani-office-behavior.test.mjs.log) | PASS | 10/0/0 |
| [hani-office-bubble-close.test.mjs](pins3-after/hani-office-bubble-close.test.mjs.log) | PASS | 17/0/0 |
| [hani-office-cafe-rest.test.mjs](pins3-serial/hani-office-cafe-rest.test.mjs.log) | PASS (단독 재실행) | 4/0/0 |
| [hani-office-chairman-234.test.mjs](pins3-after/hani-office-chairman-234.test.mjs.log) | PASS | 15/0/0 |
| [hani-office-consult.test.mjs](pins3-after/hani-office-consult.test.mjs.log) | PASS | 20/0/0 |
| [hani-office-crowded-labels.test.mjs](pins3-after/hani-office-crowded-labels.test.mjs.log) | PASS | 19/0/0 |
| [hani-office-drama.test.mjs](pins3-after/hani-office-drama.test.mjs.log) | PASS | 20/0/0 |
| [hani-office-fix-218.test.mjs](pins3-after/hani-office-fix-218.test.mjs.log) | PASS | 6/0/0 |
| [hani-office-floor-bubble.test.mjs](pins3-after/hani-office-floor-bubble.test.mjs.log) | PASS | 18/0/0 |
| [hani-office-hd-224.test.mjs](pins3-after/hani-office-hd-224.test.mjs.log) | FAIL | 9/1/0 |
| [hani-office-icons.test.mjs](pins3-after/hani-office-icons.test.mjs.log) | PASS | 15/0/0 |
| [hani-office-labels-qa.test.mjs](pins3-after/hani-office-labels-qa.test.mjs.log) | PASS | 17/0/0 |
| [hani-office-lively-v2.test.mjs](pins3-serial/hani-office-lively-v2.test.mjs.log) | PASS (단독 재실행) | 8/0/0 |
| [hani-office-lively.test.mjs](pins3-after/hani-office-lively.test.mjs.log) | PASS | 13/0/0 |
| [hani-office-motion-1.test.mjs](pins3-after/hani-office-motion-1.test.mjs.log) | PASS | 16/0/0 |
| [hani-office-motion-2.test.mjs](pins3-after/hani-office-motion-2.test.mjs.log) | PASS | 24/0/0 |
| [hani-office-obr10.test.mjs](pins3-after/hani-office-obr10.test.mjs.log) | PASS | 4/0/0 |
| [hani-office-obr12.test.mjs](pins3-after/hani-office-obr12.test.mjs.log) | PASS | 5/0/0 |
| [hani-office-obr14.test.mjs](pins3-after/hani-office-obr14.test.mjs.log) | PASS | 5/0/0 |
| [hani-office-obr15.test.mjs](pins3-after/hani-office-obr15.test.mjs.log) | PASS | 14/0/0 |
| [hani-office-obr16.test.mjs](pins3-after/hani-office-obr16.test.mjs.log) | PASS | 12/0/0 |
| [hani-office-obr17.test.mjs](pins3-after/hani-office-obr17.test.mjs.log) | PASS | 3/0/0 |
| [hani-office-obr18.test.mjs](pins3-after/hani-office-obr18.test.mjs.log) | PASS | 12/0/0 |
| [hani-office-obr19.test.mjs](pins3-after/hani-office-obr19.test.mjs.log) | PASS | 3/0/0 |
| [hani-office-obr21.test.mjs](pins3-after/hani-office-obr21.test.mjs.log) | PASS | 6/0/0 |
| [hani-office-obr3.test.mjs](pins3-after/hani-office-obr3.test.mjs.log) | PASS | 5/0/0 |
| [hani-office-obr4.test.mjs](pins3-after/hani-office-obr4.test.mjs.log) | PASS | 10/0/0 |
| [hani-office-obr6.test.mjs](pins3-after/hani-office-obr6.test.mjs.log) | PASS | 4/0/0 |
| [hani-office-obr7.test.mjs](pins3-after/hani-office-obr7.test.mjs.log) | PASS | 2/0/0 |
| [hani-office-obr8.test.mjs](pins3-after/hani-office-obr8.test.mjs.log) | PASS | 3/0/0 |
| [hani-office-obr9.test.mjs](pins3-after/hani-office-obr9.test.mjs.log) | PASS | 1/0/0 |
| [hani-office-pet-bori-272-pins.test.mjs](pins3-after/hani-office-pet-bori-272-pins.test.mjs.log) | PASS | 4/0/0 |
| [hani-office-pet-bori.test.mjs](pins3-after/hani-office-pet-bori.test.mjs.log) | PASS | 14/0/0 |
| [hani-office-pets-268-pins.test.mjs](pins3-after/hani-office-pets-268-pins.test.mjs.log) | PASS | 1/0/0 |
| [hani-office-pets-bubble.test.mjs](pins3-after/hani-office-pets-bubble.test.mjs.log) | PASS | 22/0/0 |
| [hani-office-props.test.mjs](pins3-after/hani-office-props.test.mjs.log) | PASS | 11/0/0 |
| [hani-office-release-projection.test.mjs](pins3-after/hani-office-release-projection.test.mjs.log) | PASS | 2/0/0 |
| [hani-office-residents.test.mjs](pins3-after/hani-office-residents.test.mjs.log) | PASS | 49/0/0 |
| [hani-office-seats-215.test.mjs](pins3-after/hani-office-seats-215.test.mjs.log) | PASS | 12/0/0 |
| [hani-office-snack.test.mjs](pins3-after/hani-office-snack.test.mjs.log) | PASS | 26/0/0 |
| [hani-office-tap-lines.test.mjs](pins3-after/hani-office-tap-lines.test.mjs.log) | PASS | 15/0/0 |
| [hani-office-tlayout.test.mjs](pins3-after/hani-office-tlayout.test.mjs.log) | PASS | 13/0/0 |
| [hani-office-top-labels.test.mjs](pins3-after/hani-office-top-labels.test.mjs.log) | PASS | 7/0/0 |
| [hani-office-v2-215.test.mjs](pins3-after/hani-office-v2-215.test.mjs.log) | PASS | 18/0/2 |
| [hani-office-visitors-cafe.test.mjs](pins3-after/hani-office-visitors-cafe.test.mjs.log) | PASS | 5/0/0 |
| [hani-office-xmas-269-pins.test.mjs](pins3-after/hani-office-xmas-269-pins.test.mjs.log) | PASS | 2/0/0 |
| [hani-office-xmas.test.mjs](pins3-after/hani-office-xmas.test.mjs.log) | PASS | 13/0/0 |
| [hani-office-zoom.test.mjs](pins3-after/hani-office-zoom.test.mjs.log) | PASS | 12/0/1 |

## 변경 파일

- `scripts/hani-office-hd-224.test.mjs`
- `scripts/hani-office-residents.test.mjs`
- `scripts/hani-office-snack.test.mjs`
- `scripts/hani-office-xmas-269-pins.test.mjs`
- `scripts/hani-office-xmas.test.mjs`
- `scripts/hani-reviewed-release-baseline.mjs`
- `scripts/hani-office-runtime-additions.mjs`
- `scripts/hani-office-release-projection.test.mjs`
- 이 REPORT3·`docs/development-history/handoffs/2026-11-07-pets-pins272.md` 및 `artifacts/pet-bori-live/*pins3*` 검증 도구·로그·JSON. 이전 작업 파일/증거는 보존.

**Notion 갱신 대기:** 착수 기록 쓰기를 자동 승인 정책 `never`가 거절했습니다. 본 보고서와 인수인계에 목적·변경·검증·실패·다음 행동을 보존했습니다. 저장·read-back 완료로 보고하지 않습니다.
