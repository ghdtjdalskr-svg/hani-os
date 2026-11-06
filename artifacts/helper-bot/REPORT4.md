# 도우미 4차 · 치즈·크림·모찌 당번

성민 대표님, 직원 19명과 동물 3마리가 **KST 기준 22일에 한 번씩** 당번을 맡습니다. 치즈(고양이)·크림(강아지)·모찌(토끼)는 7·7·8일 간격으로 등장해 주기 경계에서도 연속 배치되지 않습니다.

- 기존 `hani-ui-v02992.js`의 당번·인사·도움말·버튼 문구와 `hani-style-08.css`의 동물 얼굴 항목만 추가·수정했습니다. 종별 제목과 시간대 5종 인사에 기존 주민 대사를 재사용했습니다. 도움말 내용과 바로가기 목적지는 유지하고 동물 말투를 붙였습니다.
- 얼굴은 기존 `assets/profiles/thumb/hani-profile-{cheese,cream,mochi}-256.webp`를 사용합니다. 원본 그림과 주민·프로필의 종을 대조했습니다. **런타임 155→155/160, 누락 0, 새 이미지 0**입니다.
- 1~3차 변경을 보존했습니다. 기존 직원 얼굴 CSS 전체, DOM·배치·이벤트·타이머·소식 판정 코드는 바이트 보존을 확인했습니다. 직원 명부는 19명 그대로입니다.

| 검사 | 결과 |
|---|---|
| `node scripts/hani-helper-bot.test.mjs` | 19 통과 / 0 실패 / 선택 브라우저 1 생략 |
| 22일 순환·KST 경계·동물 비연속·종/대사·얼굴/개구리 배제·기존 interaction | 통과 |
| `node scripts/hani-nav-groups.test.mjs` | 통과. `HANI_MAIN_BASELINE` 원문 88파일을 최신 main 트리의 Git blob과 대조 |
| `node scripts/hani-design-system-qa.mjs` | 통과 |
| JS syntax 2파일 / `git diff --check` | 통과 |

실제 브라우저 화면은 이번에 실행하지 않았습니다(선택 인자 미제공, 3차 실행은 `spawn EPERM`). 동물 얼굴의 최종 원형 크롭과 버튼 줄바꿈 실화면 확인은 남아 있습니다. 별도 CSS syntax 검사는 미실행입니다.

`hani/helper-bot`, base `1bb9804`, 원격 main `f68f5dd` 확인. main의 추가 1커밋은 사무실 장식 테스트·기준 기록이며 runtime 차이 0, merge/rebase 없음. 소스 표시 버전 2.9.269·캐시 태그 유지. 저장·Cloud·AI·schema 변경, commit/push/merge·배포 없음. Candidate/Production 검증 N/A. Notion은 같은 작업의 1차 수정 금지 지시를 유지해 미반영했습니다.

검증 원문: `round4-unit-tests.txt`, `round4-nav-tests.txt`, `round4-design-qa.txt`, `round4-verification.json`. 다음은 실행 가능한 브라우저에서 세 동물 당번의 Preview 확인입니다. 서버 설정 변경은 없습니다.
