# 사무실 크리스마스 장식 적용

2026-11-06 KST · Codex · `hani/office-xmas-live` · 미커밋.
base/원격 main: `461dfdff4d26275a4d6d61c177280fd2d6ed35fe`(GitHub connector 확인). 표시 2.9.267, 마지막 JS `hani-launch-greeting.js`. 운영 로딩은 미검증입니다.

**기능 구현과 화면 검증을 마쳤으나, atlas 용량 조건이 미충족이라 작업 완료로 표시하지 않습니다.**

기존 `livePropLayer`의 같은 생성 경로에 장식 5개를 추가했습니다. 총 12개 슬롯을 한 번 생성하고, 기존 100ms clock에서 KST 행사 기간·층·실제로 표시된 야간 배경을 확인합니다. 매년 12월 1일 00:00~12월 27일 00:00 직전에만 표시하며, 옥상 조명은 기존 랜턴과 같은 조건입니다. 행사 행에 atlas·배치·공용 프레임 유형을 지정하므로 다음 행사도 같은 atlas 규격을 재사용합니다.

CSS `steps(4)`·3.2초, 리스·선물 정적, 모션 감소 시 동적 장식 2번 프레임 고정입니다. actor·말풍선 아래에서 클릭을 통과합니다. 리스만 HANI GROUP 로고를 피하려고 (832,136)→(832,196), 아래로 60px 옮겼습니다. 나머지는 승인 좌표입니다. 직원석·이름표·퀸 액자 영역·바리스타를 가리지 않는 배치를 확인했습니다.

수정: `hani-office-live.js`, `hani-office-live.css`, `scripts/hani-office-xmas.test.mjs`, 새 자산 `assets/office-season/xmas.webp` 하나. 별도 런타임 JS/CSS는 없습니다. closure **152→153/160, 누락 0**입니다. package/build·배포는 하지 않았습니다.

- 전용 테스트 **13/13 통과**(신규 7 + 공통 engine 6): 날짜 경계·연도 반복·층·야간·fallback·층 재선택 없는 자동 전환·한 번 생성·클릭 통과·모션 감소·literal atlas·저장 방어·바이트 보존·closure. [로그](final-tests/hani-office-xmas.test.log)
- 전체 사무실 테스트 **46개 파일 실행, 492통과·28실패·3건너뜀**, 시작 전 Git 차단 6개 파일은 별도입니다. 공통 engine 중복 포함. 성능 2개는 병렬 실패 뒤 동일 소스 단독 재검사에서 원래 제한 그대로 통과했습니다. [실패 목록·명령](TESTS.md) · [최종 집계](test-summary.json)
- `icons` 1·`zoom` 1·`residents` 7은 기존 source pin, `props` 2는 슬롯 7개 가정으로 실패합니다. 같은 pin으로 `motion-1` 1·`tlayout` 2·`consult` 1·`obr21` 1도 실패합니다. 서윤 담당으로 남겼으며 **기존 assertion은 수정하지 않았습니다**.
- **`spawnSync git EPERM`: 차단.** Git 의존 subtest 12개 실패와 시작 전 차단 6개 파일을 기록했습니다. `office-219` contrast의 main 기존 실패는 지시 파일 기준이며, 이번에는 Git 차단으로 직접 확인하지 못했습니다.
- 보호 scheduler(`plan`/`blockPlan`/`snapshot`)·view snapshot·`screenHomeClear`·두 label owner·주민의 7구간 바이트 일치, 기존 CSS 바이트 보존, JS syntax·diff check 통과. timer·listener·생성 경로 수 불변입니다. [근거](source-check.json)

Chrome 실제 owner/CSS/아트 harness, **12월 24일 20:00 KST** 화면을 확인했습니다. 전체 운영 앱의 read-back은 아닙니다. [1F 1280×900](1f-1280x900.png) · [5F 야간 1280×900](5f-1280x900.png) · [1F 390×844](1f-390x844.png) · [5F 야간 390×844](5f-390x844.png) · [브라우저 검사](browser-check.json)

**남은 차단:** 1536×400 atlas는 리샘플링 없이 RGBA 픽셀을 완전히 복사했고 저장 후 전 픽셀 일치를 확인했습니다. 하지만 무손실 파일이 **220,968B로 120KB를 초과**합니다. 용량 검사 assertion은 실패 상태로 유지했습니다. [픽셀·용량 근거](atlas-check.json) · [생성 스크립트](build-atlas.py)

다음 행동은 성민 대표님의 **픽셀 보존/용량 조건 우선순위 결정**, 이후 해당 자산 재검증과 서윤의 기존 pin 정리입니다. 현재 용량 예외나 손실 압축은 승인받지 않았습니다. 원격 직접 Git 연결은 실패했지만 connector로 기준 SHA 일치를 확인했습니다.

승인된 범위는 장식·행사 달력·테스트입니다. 데이터·저장·Cloud·schema·AI·보호 버전·표시 버전·캐시·`data/`는 변경하지 않았습니다. commit·push·merge·Notion 수정·배포는 하지 않았습니다.
