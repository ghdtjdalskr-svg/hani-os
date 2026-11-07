# 직원 친밀도 Preview · 2026-11-07 KST

성민 대표님 요청 범위 구현·전용 검증 완료. 전체 회귀는 Git 차단·서윤 pin 재고정 대기·기존 성능 실패가 있어 Release PASS가 아닙니다.

- 담당: Codex 단독 / `hani/office-affinity` / base·HEAD `241b5081e97914aa90a4af9b8f384e0d5fc5f175` (`hani/barista-night-live` 동일, 미배포).
- 작업 파일은 UTF-8 전체 읽기 완료, 한글 정상. 기존 미커밋 구현·증거를 확인하고 검사·CSS·인수인계를 마무리했습니다.
- commit/push/merge/버전 증가/Notion/`data/` 편집 없음. 표시·캐시 `2.9.272` 유지. `274`는 테스트 pin 이름입니다.
- origin/main 캐시 `03b639bd9d7f9a460c7b2555bb795f41fabde565`; 원격 조회는 GitHub 연결 실패로 최신성 미확인. main 통합 안 함.

## 저장 설계와 증명

2026-11-06 승인 범위대로 새 키 `hani_office_affinity_v1` 하나에 `{"v":1,"counts":{"hani":16}}` 형태의 ID별 정수 횟수만 저장합니다. 직원19·반려동물4·이슬/은하만 허용하고 각 9999로 제한합니다. Cloud/schema/AI 호출 없음.

읽기·쓰기는 try/catch. 손상 JSON·형식 오류·저장 접근/용량 오류는 console 경고 1회 후 메모리로 계속합니다. 손상 원문을 덮어쓰지 않습니다. 실제 trusted click/Enter만 증가하며 자동 말풍선·hover·load·합성 이벤트·미등록 ID·키 반복은 저장하지 않습니다.

기존 100ms clock으로 2초 쓰기 간격을 유지합니다. 기존 visibilitychange를 재사용하고, visibilitychange 없이 종료되는 경우를 위해 **pagehide listener 정확히 1개**만 추가했습니다. 새 timer는 없습니다. 직전 저장 후 2초 이내 종료 시에는 간격 제한을 우선하므로 마지막 메모리 클릭이 저장되지 않을 수 있습니다. 기존 데이터는 변경·이동하지 않아 복구 절차가 필요한 migration도 없습니다.

실제 owner를 VM DOM fixture와 storage spy로 실행해 보호키 `hani_os_life_v23`·다른 키의 원문 유지, 전용키 외 write 0, 손상 원문 불변·경고1회, 클릭 전 write 0, 재로드·cap·actor/pet/barista 이벤트·레벨업 대사 유지·reduced-motion을 확인했습니다. [실행 로그](final-hani-office-affinity.test.mjs.log).

## 레벨과 대화

| 클릭 수 | 레벨 | 이름 |
|---|---|---|
| 0–4 | Lv1 | 처음 만남 |
| 5–14 | Lv2 | 인사하는 사이 |
| 15–34 | Lv3 | 편한 동료 |
| 35–69 | Lv4 | 단짝 |
| 70+ | Lv5 | 최애 콤비 |

말풍선 persistent 하트 행·레벨명, CSS `+1 ♡`, 해당 클릭의 특별 레벨업 대사를 연결했습니다. Lv3 비밀 대화3개 + Lv5 추가2개를 25명/마리 모두 제공(총125개). 기존 탭 대사·voice registry·신입 말투 가이드에 맞추고 회장님 호칭만 사용합니다.

- 히나: “제 필통엔 별 스티커가 숨어 있어용!”
- 유리: “회장님과의 잡담은 검사표에 넣지 않습니다.”
- 은하: “제 앞치마 별 자수는 밤에 더 잘 보여요.”

도우미 패널은 실제 당번 ID를 읽어 `오늘 당번과의 친밀도: Lv3 편한 동료 ♡♡♡`를 갱신합니다. 선택 사항인 조직도 카드 배지는 별도 profile owner 변경을 피하려고 생략했습니다.

## 검증

| 항목 | 결과 |
|---|---|
| 친밀도 전용 실행 | 21/21 PASS(자체15 + 공통 fixture6) |
| 도우미 패널 | 24/24 PASS, 직원/반려동물 당번·레벨 변경·저장 접근0 |
| 274 역복원·변조 거부·273→272→269→268 | 2/2 PASS; Git 직접 호출 subtest는 `spawnSync git EPERM` 차단 |
| 고정 Git base JS/CSS/UI 원문 | shell Git로 독립 추출·SHA256·완전 역복원 3/3 PASS ([근거](direct-git-baseline-proof.json)) |
| 모든 office 테스트 + helper | 57파일 실행, 파일 전체 PASS29·미통과28; [파일별 결과표](TESTS.md), [실패 상세·로그 경로](test-results.json) |
| fun-chat-fortune | 해당 파일 없음, N/A |
| syntax / diff whitespace | 수정 JS/MJS25개 PASS; 기존 CRLF 보존, `core.whitespace=cr-at-eol` 기준 PASS |

전체 결과의 PASS는 의존 fixture 중복을 포함합니다. 자체 테스트가 등록되지 못한 모듈도 별도로 검사해 차단으로 표시했습니다. assertion 삭제·정규식 완화 없음. 기존 무저장 검사는 274의 해시 고정 역복원 원문에 그대로 적용하고, 새 저장 경로는 전용 안전성 검사로 검증합니다. 273 baseline artifact 의존은 동일한 고정 원문 SHA256 검사로 바꿨습니다.

기준 commit의 JS SHA256 `66d5b20204569b8a9039aef1406a3536f24ae2668d3b237a50770b282b391137`, CSS `f44a75e570705d2c8cc196213bece505eb6603d5c163475e9883341d53de7fff`. 최종 변경 hash는 [독립 비교 근거](direct-git-baseline-proof.json)에 있습니다.

## 화면·미검증·인계

기존 캡처 6장을 열어 Lv1/Lv3 비밀 대화/레벨업을 확인했습니다: 1280×900 [Lv1](1280-lv1.png)·[Lv3](1280-lv3-secret.png)·[레벨업](1280-level-up.png), 390×844 [Lv1](390-lv1.png)·[Lv3](390-lv3-secret.png)·[레벨업](390-level-up.png). 이 캡처에서 하트 줄바꿈을 발견해 친밀도 bubble에만 CSS wrap/하트행 nowrap을 적용했습니다. **캡처는 최종 CSS 이전이며, 최종 CSS 실화면은 미검증**입니다.

- 브라우저 재실행: Node `spawn EPERM`. 숨김 Edge 실행도 자동 승인 검토의 정책 차단으로 거절됨. 새 캡처·최종 모바일 높이/넘침·전체 앱 통합 화면은 확인하지 못했습니다. fixture 캡처를 Production 증거로 사용하지 않습니다.
- 서윤 인계: G/tlayout·residents-source layers가 여전히 JS 기준 `66d5…1137`을 요구합니다. `274`의 정확한 역복원을 연결한 뒤 기존 plan/snapshot/원문 pin과 listener/node 기대값을 재검사해야 합니다. 담당 layer/fixture는 임의 재고정하지 않았습니다.
- `hani-office-219`는 알려진 실패. 나머지 Git 의존 실패도 `spawnSync git EPERM`으로 차단 표시했습니다.
- cafe/rest 400ms 기준은 그대로 유지. 최종 present 샘플 413.9/437.5/444.3ms로 실패했고, 기존 before 로그에도 483.1/458.4/488.4ms 실패가 있습니다. 기준을 완화하지 않았습니다.
- 변경 파일: `hani-office-live.js/.css`, `hani-ui-v02992.js`; 신규 affinity 테스트·274 source/pins·`fixtures/office-affinity-274-delta.json`; helper 및 관련 legacy 테스트의 정확한 기대 경로·앵커 조정. 전체 목록은 [changed-files.json](changed-files.json). 테스트가 생성한 기존 office 증거 파일도 보존했습니다.
- Notion은 작업 지시로 미편집. Candidate build/One-Pass/HINA/main/Pages/Production read-back은 미실행. 다음: 서윤 pin 정리 → 허용 환경 최종 CSS 화면 확인 → 대표님 Preview 검토.
