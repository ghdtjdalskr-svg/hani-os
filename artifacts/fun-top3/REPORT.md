# 재미 요소 3종 작업 보고

2026-11-06 KST · Codex 단독 · 구현 및 targeted 검증 완료, 미커밋.
`hani/fun-top3` / base·HEAD `0fa5866663edad7689157a1cf80e8fbe848d3a13` / v2.9.263 유지.

| 기능 | 변경 |
|---|---|
| F03 | 기존 `bookCard → renderReading`에서 고유 ID·유효한 과거/오늘 완독일의 완독 카드만 책갈피 표시. 정확한 고정 문구, native 펼침/접기·화면 밖 탭 닫기. 전체 서재 적격성은 페이지 분할 전 한 번 계산. |
| F05 | 기존 `renderQuizDetail`의 경제·일본어 채점 결과 상단에 닫힌 쪽지. 유효한 완료 시각·질문·프로젝트 연결 검사, 점수와 무관한 동일 문구. 채점 실패 rollback·기존 도장·복사·이의제기 보존. |
| F12 | 기존 `detail`과 `start` 클릭 위임에 비금융 달성 기록의 앙코르 추가. 상태 슬롯·박수 1회, 연타/늦은 timer 차단, 닫기·다른 카드·화면 이동 시 정리. 모션 감소는 정적 문구만, 버튼 포커스 유지. |

변경 파일: `hani-main.js`, `hani-study-v02984.js`, `hani-milestones.js`, `hani-design-system.css`, 신규 `scripts/hani-fun-top3.test.mjs`. 보고서·원문 기준선·실행 로그·PNG·SHA-256은 이 폴더에 보관했다. 명세의 `hani-milestones.css`는 실제로 없어 기존 공통 CSS owner의 `#milestones` 범위에 추가했다(CODEMAP 마일스톤 항목 없음, 실제 코드 fallback).

| 검사 | 결과 |
|---|---|
| JS syntax 3개 | PASS |
| 신규 전용 테스트 | 10/10 PASS: 조건·실제 renderer/위임·채점 성공/실패·열기/닫기·저장/요청 0·기존 markup/쓰기 owner 보존 |
| 실제 Edge 합성 Preview | 32/32 PASS: 360/390/412/1440px × 밝음/어두움 × 모션 감소/일반 × 글자 100/200%. 가로 넘침 없음, Enter/Space·Esc·포커스·앙코르 글자 AA 확인 |
| 명세 지정 기존 테스트 | `simplify-218`, `fix-208-ui`, `exam-popup-214`, `quiz-quality-210`, `quiz-client-209`, `milestones-v1`, `milestones-grade-ui` 모두 PASS. 마일스톤 기존 browser 검사도 PASS |
| 변경 owner를 직접 읽는 기존 테스트 등 총 108명령 | PASS 80 / FAIL 21 / 입력 부족 차단 5 / 시간 초과 2. FAIL 20은 변경 전에도 재현, 신규 pin 차단 1은 아래 참고. Git EPERM 차단 0 |
| 보존 | 기존 저장·분류·수정·삭제·채점 함수 원문 동일, index·사무실 JS/CSS 동일. storage/Cloud/schema/AI 경로·assets/data·버전/cache 수정 없음. 기존 assertion 삭제·완화 0 |

미검증·blocker: **`hani-reviewed-release-baseline.test.mjs`는 이번 미등록 변경의 기존 pin으로 차단**된다(변경 전 PASS). 파일별 canonical guard도 변경한 운영 파일 4개 모두 PIN_BLOCKED임을 확인했다([파일별 핀](pins.json)). 서윤님에게 [실패·차단 목록](TESTS.md)과 [명령·결과·파일 해시](verification.json)를 전달한다. pin을 갱신하거나 우회하지 않았다. 원래 baseline/package가 필요한 5검사는 임의 자료를 넣어 PASS로 만들지 않았다. 실제 휴대폰·사용자 계정·운영·독립 아린/HINA는 미검증이며 릴리스 후보 검사는 실행하지 않았다.

기준선: 원격 조회는 네트워크 실패. 로컬 origin/main 캐시 `e03a029d6a81f3c6fc025cc0234e82580c696870`는 base보다 1 commit 앞서며 문서·사무실 테스트/fixture만 다르고 이번 runtime owner와 겹치지 않는다. merge/rebase 없음. 표시 버전과 마지막 제품 script `hani-launch-greeting.js`는 소스 확인만 했다.

승인·다음 행동: 작업 파일의 세 기능 개발만 수행했다. commit/push/PR/merge/배포/버전 증가 없음, Notion은 명시 지시로 미편집. 서윤님이 미커밋 diff와 pin 목록을 검토하고 회장님 Preview 후 별도 배포 열차로 넘긴다. 서버/Edge Function 동반 배포나 데이터 복구·migration은 필요 없다.
