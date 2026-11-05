# 바리스타 온유 탭 구현

2026-11-06 KST / 담당 Codex / `hani/cafe-barista` / 시작 HEAD `a80c8e9f994716695b5b5f7a77d65cc953055865`. 작업 지시 파일 전체를 UTF-8로 읽었으며 한글은 정상이었다. 구현·지정 검사 완료, 미커밋·미배포 상태다.

1F 실제 아트에서만 보이는 투명 버튼 하나를 유지한다. 기존 `activateActor` 경로와 공용 말풍선·3초 타이머를 재사용하여 이름·PC/폰 상태·지정 대사 8개를 순환 표시한다. 바깥 탭·Escape·층 이동으로 닫히며, 온유의 프로필 링크만 숨기고 직원 탭 시 복원한다. 새 전역 listener·타이머·runtime 파일은 없다. 기존 누름 효과가 직원의 쌓임 순서를 바꾸는 경우에도 온유 버튼이 입력을 양보하도록 CSS로 보완했다.

좌표는 `art-map-v1.json`의 실제 배경 `assets/building/floor-1f-217.webp`(1672×941)를 직접 보고, 우하단 메뉴판 아래·진열장 옆 인물을 확대해 측정했다. **좌상단 (1536,650), 우하단 (1581,706), 45×56px**이다. 모자부터 손까지만 덮으며 터치 영역을 추가 확장하지 않는다. [확대 근거](barista-crop.png), [PC 화면](preview-1280-motion.png), [폰 화면](preview-390-reduced.png).

| 검사 | 결과 |
|---|---|
| 새 `hani-office-barista.test.mjs` | 10/10 통과: 전용 4개 + 같은 loader의 기존 6개 |
| Chrome 실제 화면 | 4/4 통과: 1280·390px × 일반·모션 줄이기 |
| 실제 포인터 겹침·닫기·프로필 | 직원·방문객 슬롯을 온유 위에 놓은 클릭, 바깥 탭·Escape·자동 닫기·직원 링크 복원 통과 |
| 일정·snapshot·라벨 보존 | 모델 전체와 `fitStatusLabels` 바이트 동일; 8개 조건의 plan·blockPlan 및 40개 시점의 양쪽 snapshot 해시 동일 |
| 전체 `hani-office-*.test.mjs` 43개 실행 | 합산 457 통과 / 33 실패 / 3 건너뜀, 파일 기준 22 성공·21 실패 |
| `cafe-rest` 분리 재검 | 3 통과 / Git 차단 1. 최초 400ms 한도 실패는 재검에서 통과 |
| 문법·변경 범위 | JS 문법 통과. 기존 office 검사 파일 전부 불변, `assets/`·`data/` 408개 및 index·main 불변 |

전체 파일별 표·명령은 [TESTS.md](TESTS.md), 정확한 실패 이름은 [test-summary.json](test-summary.json), 원문 로그는 `tests/`에 있다. 실행하지 못한 Git 비교는 **`spawnSync git EPERM` 차단**으로 분류하며 PASS가 아니다.

서윤 담당 고정값·생성 수 검사는 그대로 두었다.

| 파일 | 통과 / 실패 | 실패 항목 |
|---|---|---|
| `hani-office-icons` | 14 / 1 | 승인된 소스 pin 복원 검사 |
| `hani-office-zoom` | 11 / 1 (+1 skip) | 소스 pin 복원 검사 |
| `hani-office-residents` | 42 / 7 | closure 수, 소스 pin 복원 4건, 명시적 생성 수, 기존 애정 장면 경로 |

추가 실패는 Git 차단, `motion-1`·`obr21`·`consult`·`tlayout`의 소스 pin, `snack`·`tlayout`의 기존 고정 모델 기대값이다. 최초 `cafe-rest` 성능 실패는 분리 재검에서 통과했다. 변경 전 원문을 읽히는 대조에서도 icons 1·residents 1·snack 1·tlayout 1건이 재현되었고, consult·obr21은 Git 차단만 남았으며 zoom·motion-1은 통과했다. 상세는 [baseline-results.json](baseline-results.json). assertion 삭제·완화는 하지 않았다.

변경 파일은 `hani-office-live.js`, `hani-office-live.css`, 새 `scripts/hani-office-barista.test.mjs`와 본 디렉터리의 보고·검증 자료다. `plan`, `blockPlan`, `snapshot`, 직원·방문객 일정, `placeStatusLabels`, `fitStatusLabels`, `screenHomeClear`는 수정하지 않았다. 저장소·Cloud·schema·AI 경로와 버전/cache를 변경하지 않았고, 지시대로 Notion도 편집하지 않았다.

남은 항목: 실제 로그인 앱·물리 휴대폰·운영 read-back과 최종 release gate는 미실행이다. Chrome 검증은 실제 아트·CSS·owner를 사용하는 격리 화면이며 직원·방문객 겹침은 테스트용 위치다. 원격 main은 GitHub로 확인한 `813cedc5` / v2.9.264로 진행되었다(작업 기준과 diverged). 로컬 2.9.263과 지정 branch를 유지했으며 자동 merge·rebase하지 않았다. 통합 담당이 최신 main의 office JS/CSS 변경과 함께 재검증해야 한다. commit·push·merge·배포·버전 증가 승인으로 해석하지 않았다.
