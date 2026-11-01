# 사무실 층 진입 말풍선 인수인계

## 작업 식별
- 날짜(KST): 2026-11-01 / 담당: Codex
- 상태: 구현·targeted 검증 완료, 미커밋 검토 대기 / 위험: NORMAL
- branch: hani/office-floor-bubble / base·HEAD: 2239bf020eefe77304fc1b362ddcedcb3e2b9ca3
- 범위: hani-office-live.js의 기존 말풍선·층/가시성 경로, 신규 전용 테스트, 작업 보고서.
- 승인 근거: ../office-floor-bubble-task.md 전체 UTF-8 확인. commit/push/merge/버전 증가/Notion/assets 수정 금지.
- 기준선: 시작 시 작업 트리 clean. origin/main 캐시 333b0358960d9b60def7eb014670346bf3ffe351, 원격 연결 실패로 최신성 미확인. merge/rebase 없음.
- 표시 버전: index.html cache 2.9.252, 마지막 script hani-launch-greeting.js. 실제 화면/운영 JS 미확인.

## 결과와 증거
- 기존 openBubble/closeBubble·단일 actor/roster 이벤트 재사용. 렌더링 후 450ms 지연, 날짜·층 해시 선택, 정지·머리 아이콘 필터와 💬/📱 우선, 4초 닫기, 5초 사용자 탭 우선·60초 층별 제한. 숨김·동작 줄이기·로그인 잠금 차단. 단일 타이머 예약 경로와 bubbleSerial 사용.
- scheduler 모델 전체와 screenHomeClear/placeStatusLabels/fitStatusLabels 바이트 동일. plan 4·blockPlan 4·snapshot 12 직렬화 출력 동일. 최종 icons 검사의 7일·양쪽 presence 전체 출력 보존도 통과.
- 신규 `node scripts/hani-office-floor-bubble.test.mjs` 18/18 통과(신규12 + 기존 renderer6). syntax·diff --check 통과.
- `node artifacts/office-floor-bubble/run-tests.mjs`: 지정 office 38파일 모두 실행. 최종 31파일 통과·7파일 실패. obr14는 최초120초 제한 후 전체 재실행5/5 통과(약200초). 타이머 정리 후 영향받는 UI tests 별도 재검증 통과; final-rechecks.json·final-icons.log 확인.
- 실패: obr8/15/21 source pin(2509행), consult의 공용 office-labels-qa-source-delta.json afterSha256 pin. 서윤 재기준화 대상으로 기존 assertion·fixture 수정 없음. 해당 pin 뒤 검사는 미실행이며 별도 실제 output 보존검사는 통과.
- 기존/환경 실패: 219 AA contrast는 변경 전 소스에서도 동일. cafe-rest·lively-v2의 일일계획400ms 기준도 변경 전 소스로 재현(최선602/564ms). assertion 삭제·완화 없음.
- 실제 Edge390/1440 자동 표시·배치·사용자 전환·자동 종료시각 이후 수동 유지·노출 제한·저장 호출0 PASS, PNG2개 직접 시각 확인. 기존 tap-lines browser16/16 통과. 외부 트래픽 차단한 로컬 QA로 실제 Cloud/AI/사용자 데이터는 미검증.
- 최종 결과·전체 테스트 명령 도구·로그·화면: artifacts/office-floor-bubble/REPORT.md, summary.json, preservation-results.json, browser-auto-results.json. 테스트가 만든 추가 산출물은 generated/로 모아 보존.
- 최종 JS SHA-256: f486c4b6208353a810609fa18444d5bbdbb92303940e629cd8ed93529d4804ae.
- 저장/Cloud/schema/AI 호출·assets/data·버전/cache 변경 없음. 새 런타임 파일·새 이벤트/renderer layer 없음. commit/push/PR/main/배포 없음. 원격 최신성·Production·최종 Release Gate 미검증.

## 다음 담당에게
- 먼저 REPORT.md 및 hani-office-live.js의 scheduleFloorBubble/openBubble/closeBubble/queueBubbleTimer, 신규 전용 테스트 확인.
- 다음 행동: 서윤이 미커밋 변경 검토 및 공용 source pin 소비 지점(consult 포함) 재기준화 후 해당 검사 재실행. 추가 서버 설정·배포 순서 없음. 배포 승인 요청 단계 아님.
- Notion: 작업별 명시 지시로 수정하지 않음. CURRENT/DECISIONS 및 타 담당 파일 미수정.
