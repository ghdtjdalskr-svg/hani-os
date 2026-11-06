# 반려동물 테스트 3차

2026-11-06 KST · Codex · `hani/office-pets-bubble` · HEAD `adb25cb22481c9974350387becb420f90205d0af` · 원격/로컬 origin/main `461dfdff4d26275a4d6d61c177280fd2d6ed35fe`. 구현 테스트 수정 완료, pin 갱신 대기. commit·push·merge·버전 증가 없음.

기존 기대값 → 새 기대값(각 항목에 `// v2.9.268:` 주석):

- 감소 모션: 0.05초 위치 고정 → 60초·여러 산책 beat 동안 정확히 같은 위치/정지 pose.
- 기존 57행 충돌: 고정 시각 2마리 → 새 동행 배치 3마리·96px 이상 분리. 고정 지점이 실제 겹칠 때 2마리로 생략되는 기존 보호도 유지.
- 66행 DOM: 10:02 고정 정지 가정 → 실제 정지한 깨어 있는 beat + 수면 구간, 각각 20회 tick 쓰기 정확히 0.
- 223행 방문: 10:02/10:05 고정 정지 → 45초 이내 실제 도착 후 partner/kind/층/거리·같은 quarter 방문 key·직원 불변/제외 대상 검사 유지.
- 300행 라벨: 실제 art top 그대로 → pet pad=max(4px,높이×0.14)만큼 정확한 top/폭/높이 확장, 라벨은 envelope 위·20px 이내. NPC는 pad=0.
- 384행 탭: 10:02 즉시 hop 가정 → 확인된 깨어 있는 정지 pet에서 즉시 hop. 이동 중 대기·도착 hop·키보드/무저장/감소 모션 검사 유지.
- 407행 모찌: 12~17시 4F → 1F, 경계 시각·오전 3F·야간/수면·안전 구역 검사 유지.
- 416행 모찌: 120~180초 산책/최초 30초 정지/반시간 이동<50초 → 25~45초, 일별 정확한 주기·출발 휴식 3~5초, 39회 이상 출발·이동 정확히 73초(95% 이상 휴식). hop·속도·전신 안전 유지.
- 506행 제스처: 10~20초/14회 이상 → 6초/300초당 정확히 50회, 종별 정확히 2초 위상. 네 종류·수면/감소 모션/이동/쓰담 억제 유지.
- 544행 주기: 치즈·크림 60~120초/모찌 120~180초 → 15~30초/25~45초. 기존 속도·연속 이동 검사 유지.
- 560행 출발 휴식: leg마다 여러 값 → 일별 정확히 한 seed 값(치즈·크림 0~2초/모찌 3~5초). leg 속도 변화·양끝 easing 유지.
- 574행 중간 휴식: 모든 실제 일일 경로에서 1~3초 pause → 치즈·크림 실제 snapshot과 모찌 긴 허용 경로에서 pause/재현/정지/재출발 유지. 모찌 새 짧은 1F 경로는 pause 정확히 0·안전/층 확인.
- round 1 모델 전체 불변 → 직원 scheduler/plan/blockPlan/snapshot 포함 직원 모델 전체 byte 동일 + origin/main 대비 residentPeople(모찌 hours만)·residentRhythm·residentLife·residentSnapshot 외 주민 byte 동일, 두 검사로 분리.

전체 실행: **46파일 543개 — 504통과 / 36실패 / 3기존 조건부 생략**. assertion 삭제·완화·새 skip 없음. 실패는 pin 18건, `spawnSync git EPERM` BLOCKED 18건이며 전체 PASS가 아님. 파일 시작에서 Git이 차단된 검사는 하위 검증 미실행. 생략 3건은 원본의 `--browser` 선택 검사(v2-215 2건·zoom 1건)이며 실제 브라우저 검증 미실행.

명령: 각 파일에 `node --test --experimental-test-isolation=none --test-reporter=tap scripts/hani-office-<이름>.test.mjs`. 아래 이름은 공통 접두·확장자를 생략.

| 검사 | 통과 | 실패 | 기존 생략 |
|---|---:|---:|---:|
| 219 | 0 | 1 | 0 |
| actions-216 | 14 | 1 | 0 |
| actions-221 | 20 | 0 | 0 |
| barista | 9 | 1 | 0 |
| behavior | 10 | 0 | 0 |
| bubble-close | 16 | 1 | 0 |
| cafe-rest | 3 | 1 | 0 |
| chairman-234 | 6 | 0 | 0 |
| consult | 18 | 2 | 0 |
| crowded-labels | 19 | 0 | 0 |
| drama | 20 | 0 | 0 |
| fix-218 | 6 | 0 | 0 |
| floor-bubble | 18 | 0 | 0 |
| hd-224 | 10 | 0 | 0 |
| icons | 14 | 1 | 0 |
| labels-qa | 17 | 0 | 0 |
| lively-v2 | 7 | 1 | 0 |
| lively | 13 | 0 | 0 |
| motion-1 | 15 | 1 | 0 |
| motion-2 | 24 | 0 | 0 |
| obr10 | 4 | 0 | 0 |
| obr12 | 0 | 1 | 0 |
| obr14 | 4 | 1 | 0 |
| obr15 | 13 | 1 | 0 |
| obr16 | 12 | 0 | 0 |
| obr17 | 3 | 0 | 0 |
| obr18 | 12 | 0 | 0 |
| obr19 | 3 | 0 | 0 |
| obr21 | 3 | 3 | 0 |
| obr3 | 5 | 0 | 0 |
| obr4 | 8 | 2 | 0 |
| obr6 | 0 | 1 | 0 |
| obr7 | 0 | 1 | 0 |
| obr8 | 2 | 1 | 0 |
| obr9 | 0 | 1 | 0 |
| pets-bubble | 21 | 1 | 0 |
| props | 10 | 1 | 0 |
| residents | 42 | 7 | 0 |
| seats-215 | 12 | 0 | 0 |
| snack | 25 | 1 | 0 |
| tap-lines | 15 | 0 | 0 |
| tlayout | 11 | 2 | 0 |
| top-labels | 7 | 0 | 0 |
| v2-215 | 17 | 1 | 2 |
| visitors-cafe | 5 | 0 | 0 |
| zoom | 11 | 1 | 1 |

서윤의 pin 갱신만 필요한 실패(변경하지 않음):

- `hani-office-barista.test.mjs` 1건(65행): 주민 포함 전체 모델 불변 기준 불일치.
- `hani-office-bubble-close.test.mjs` 1건(82행): 주민 포함 전체 모델 불변 기준 불일치.
- `hani-office-consult.test.mjs` 1건(98행): 동결 source delta/hash 기준 불일치.
- `hani-office-icons.test.mjs` 1건(111행): 동결 source delta/hash 기준 불일치.
- `hani-office-motion-1.test.mjs` 1건(26행): 동결 source delta/hash 기준 불일치.
- `hani-office-obr21.test.mjs` 1건(39행): 동결 source delta/hash 기준 불일치.
- `hani-office-props.test.mjs` 1건(87행): office-props-live baseline의 모델/label hash 불일치.
- `hani-office-residents.test.mjs` 7건(123·276·299·364·466·480·508행): 동결 source delta/hash 기준 불일치.
- `hani-office-snack.test.mjs` 1건(131행): fitStatusLabels hash 불일치.
- `hani-office-tlayout.test.mjs` 2건(33·39행): 동결 source delta/hash 기준 불일치.
- `hani-office-zoom.test.mjs` 1건(147행): 동결 source delta/hash 기준 불일치.

Git 차단: `hani-office-219.test.mjs`, `hani-office-actions-216.test.mjs`, `hani-office-cafe-rest.test.mjs`, `hani-office-consult.test.mjs`, `hani-office-lively-v2.test.mjs`, `hani-office-obr12.test.mjs`, `hani-office-obr14.test.mjs`, `hani-office-obr15.test.mjs`, `hani-office-obr21.test.mjs`, `hani-office-obr4.test.mjs`, `hani-office-obr6.test.mjs`, `hani-office-obr7.test.mjs`, `hani-office-obr8.test.mjs`, `hani-office-obr9.test.mjs`, `hani-office-pets-bubble.test.mjs`, `hani-office-v2-215.test.mjs`. 모두 `spawnSync git EPERM` BLOCKED이며 PASS로 계산하지 않음. 주민 origin/main 비교 테스트도 이 경로에서 차단됨. 별도 읽기 검증은 GitHub가 반환한 origin/main blob `a0b2daa0f94757160829952f88b4cb60aaf93ca4`의 SHA-1을 로컬 Git object와 대조한 뒤, 같은 네 허용 구간 외 byte 동일·모찌 hours만 변경·직원 전체 byte 동일을 확인함([근거](round3-source-checks.json)). Git 차단 테스트의 PASS를 대신 선언하지 않음.

변경 파일: `scripts/hani-office-residents.test.mjs`, `scripts/hani-office-pets-bubble.test.mjs`, 이 폴더 `REPORT3.md`·`HANDOFF3.md`·`round3-*` 근거. 런타임 JS/CSS·index·source pin/fixtures·icons/zoom pin·지정 snapshot baselines 포함 93개 파일은 시작 시 SHA-256과 동일. 두 테스트 문법 검사 통과. 표시/캐시 버전 `2.9.267` 유지, storage/Cloud/schema 영향 없음.

상세 [파일별 결과/오류](round3-test-results.json), 원문 로그 `round3-hani-office-*.tap`. 브라우저·Preview·Arin/HINA·운영 검증은 테스트 전용 작업으로 미실행(N/A). 다음 담당: 서윤 pin 갱신 후 해당 실패 재실행. main 병합·Pages·운영 read-back 미수행.

Notion 요약 갱신은 자동 승인 검토가 쓰기를 거절하여 미반영(`approval policy is never`). 갱신 대기는 HANDOFF3.md에 보존.
