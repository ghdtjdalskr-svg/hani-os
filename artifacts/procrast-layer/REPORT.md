# 2.9.312 시험 층 작업 보고

## 작업 식별

- 일시: 2026-11-23 KST / 담당: 도연(Codex).
- 상태: 구현·검증 시도 완료, 서윤 인계. **전체 PASS 아님.** branch `hani/procrastination-3`, 시작/종료 HEAD `34e19c724eef9b115b7aaa34932f2bca73107b03`(미커밋).
- 기준: 로컬 origin/main `1868d1068ff6664ca42517a1594b72f0ce8420fd`(#547 tooling-311). 원격 조회는 네트워크 연결 실패로 최신성 미검증.
- 승인 근거: `../p312layer-task.md` 전체 UTF-8 정상 확인 및 실행 지시. 시험 층·신규 기능 시험·등록·보고서만 수정.
- 범위: `scripts/hani-procrast-312-*`, 새 fixture, 출석 보상 시험, 아래 기존 시험 import 1줄, release-311 source 첫 bootstrap 1줄, historical-input outerFiles 등록.
- 시작 상태 대비 운영·보호 경로·기존 단언/fixture/hash·버전/히스토리 불변. commit·push·배포·Notion 수행 없음(서윤 담당), Cloud 0.

## 결과와 증거

- `procrast-312 → 311 → light-311 → 310 → attendance → 309` 연결. 운영 4파일·release-311 bootstrap·아래 import를 전체 hash·65개 위치 고정 span으로 exact inverse. 독립 Git 원문 비교·정방향 재생·오염 거절·3종 read API·디렉터리 경계 포함 신규 8/8 PASS.
- 신규 `hani-attendance-bonus.test.mjs` 6/6 PASS: 원장 없음/2건 +4/모르는 id/깨진 원장 무쓰기/탭 저장 시 원본 count 분리/실제 7일째 click·중복·재마운트·깨진 원장 보존. 역사적 preload 없이 현재 운영 원문 실행, 가상 저장소만 사용.
- 새 source/preload/시험/fixture 및 기존 신규 시험 `hani-procrastination-2.test.mjs`를 outerFiles에 등록. 기존 시험 수정 목록: **`scripts/hani-menu-badges.test.mjs` 첫 import 1줄만**(층 연결이 없었던 독립 시험). 기존 source 수정은 `hani-release-311-source.cjs` 첫 require 1줄뿐. 기존 fixture·hash·단언은 그대로.
- syntax 7파일·diff whitespace PASS. runtime closure 183, pre312 closure 177, 양쪽 누락 0. 기존 시험/fixture/보호 경로 및 runtime·버전/히스토리 독립 HEAD 원문 보존 검증 PASS.
- 지정 JSON 5개와 착수 전 수정된 `artifacts/fix-218/clock-results.json`을 **착수 시 원문으로 복원·hash 확인**. 시험 산출물은 `local/test-produced/` 보존. tracked 2,651파일 확인: 허용한 기존 3파일 외 변경 0. 착수 전 clock 미커밋 수정분 보존.
- 로컬 표시 상수 `2.9.311`, index 마지막 UI JS `hani-attendance-board.js` 유지. 버전 증가·runtime build·One-Pass·배포/운영 확인 N/A(시험 도구 작업). 실제 브라우저 화면/JS 로딩은 미검증.
- CODEMAP에 해당 feature anchor가 없어 실제 owner 검색으로 fallback(CODEMAP_MISS).
- 전체 `scripts/*.test.mjs` **317파일을 각각 `node scripts/<파일>`로 단독 실행** + 메뉴 2파일 targeted 재실행: **214 PASS / 29 FAIL / 74 미검증**. skip 10건 보존, 전부 skip인 UI 1파일은 미검증에 포함. 신규 층 8/8, 보상 6/6, 미룬 일 2차 6/6, 메뉴 재검사 7/7·8/8 PASS. 최초 로그는 `local/all/`, 재검사는 `local/reruns/`, 최종 분류는 [실패·미검증 목록](local/FAILURES.md)·`local/summary.json`.
- 전달된 `REG.txt` **110개 전부 실행: 90 PASS / 1 FAIL(311 HEAD gate) / 19 미검증(Git EPERM 또는 기존 Git 어댑터의 URL cwd 오류)**. 나머지 28 FAIL은 제공 목록 밖이며 fixture 누락·역할 수/문구·legacy pin·버전 guard 등 원문 로그 보존, 단언/기대값 수정 없음. 브라우저 인자/의존성·하위 프로세스 차단도 PASS로 취급하지 않음.
- 사무실 성능 단언 실패 0: 초기 계획 best 약 271ms(<400), warm 약 0.56ms(<3), OBR16/17/18 비용 검사 PASS. 흔들림이 없어 2회 재시도 N/A.

## 덮지 않은 실제 동작 충돌

- 현재 `createOfficeAffinity`에 **기존 cap 동작 단언 7개를 수정 없이** 별도 실행: 6 PASS / **1 FAIL**. `raw v1 -> v2 keeps all known counts including 9999, unchanged key, no other writes`의 `assert.ok(x.reads.every(k=>k===key))` 실패. 새 `hani_attendance_bonus_v1` read가 기존 단일 read-key 계약과 충돌. count 저장 단언은 통과했으나 이 실패를 기능 PASS로 취급하지 않음. 서윤 판단 필요. 근거: `local/current-affinity-cap.cjs`, `.log`. 역사적 inverse로 실행한 호감도 시험의 PASS와 구분.
- 기존 311 시험의 `acceptsRemote(actualHead) === true` 실패: 현재 feature HEAD가 release311의 first-parent 후손이 아니므로 발생. 실제 ref/commit을 바꾸어 숨기지 않음.

## 다음 담당에게

- 다음 행동: 서윤이 실제 Git 가능한 환경에서 미검증 항목 재실행 및 위 호감도 read 계약/311 HEAD gate 판단. 임의 ref 보정·기존 단언 변경은 하지 않음.
- 미검증/차단: 원격 최신성(네트워크), 실제 브라우저, Git/Node 하위 프로세스 EPERM 및 기존 URL cwd 처리 오류. `local/` 전체는 임시 증거이므로 커밋 대상에서 제외.
- 공통 현황·Notion은 작업 지시대로 갱신하지 않음. 최종 결과는 이 파일로 서윤에게 인계.
