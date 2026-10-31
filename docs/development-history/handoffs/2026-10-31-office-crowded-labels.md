# 휴대폰 혼잡 좌석 이름 라벨

## 작업 식별

- 갱신: 2026-10-31 KST / 담당 Codex / 검토 담당: 대표님 지정 리뷰어(이름 원문 깨짐)
- 상태: 구현·샌드박스 검증 완료 / 미커밋 리뷰·실제 브라우저 검증 대기, NORMAL / READ-ONLY UI PATCH
- worktree: `office-crowded`, branch: `hani/office-crowded-labels`
- base / HEAD / 로컬 origin/main: `a090419cfb3eb9529e033a0c5a102eb42174d4b6`
- 원격 main 최신성: `git ls-remote` GitHub 연결 실패. 자동 merge/rebase 없음.
- 범위: runtime은 `hani-office-live.js`, `hani-office-live.css`만. 관련 Node 테스트와 browser geometry, 본 인수인계.
- 승인 근거: 사용자 Task. commit/push/merge/version bump/Notion 수정 금지. 실제 브라우저는 리뷰어 담당, 샌드박스 차단 우회 금지.
- CODEMAP: living-office owner 일치, placement/최신 테스트 anchor 누락(CODEMAP_MISS). 실제 owner와 obr18/top-labels 검사를 확인.
- 기준 index 태그 v2.9.240, 마지막 script `hani-launch-greeting.js`. 실제 화면 버전과 JS 로딩은 미검증.

## 결과와 증거

- 수정 전 코드: full pill 탐색 실패 후 이름 단계 없이 5px dot. 일반 폰 head radius 19.5px, 대화 27.5px, 상단 공간 부족 시 nearest-sprite 예외.
- 수정 전 3F home-seat 합성 fixture(층 너비368px, pill81x10): 유리·아린은 dot. 마스코트 전체 제거/개별 제거에도 dot, 다른 sprite를 제거하면 pill. 상하 좌석 sprite 사이 약5.56px라 10px 라벨에 부족. 원인 분리 근거: `artifacts/office-crowded-labels/discovery.json`. 실제416px 측정과 구분.
- 데이터·Storage·Cloud·schema 변경 없음. 실화면/Preview/운영 검증 미실행.
- 변경: 단일 `placeStatusLabels` 내부에서 기존 full pill 탐색을 먼저 확정하고 이름 pill, dot 순서로 배치. full/name은 같은 후보 생성 경로·sprite/mascot 예약·floor 경계·head radius·상단 예외를 사용. 이름은 모든 이웃보다 자기 sprite에 엄격히 가까워야 함. full pill 위치를 이름/dot이 밀어내지 않음.
- `fitStatusLabels`는 기존 name 슬롯의 full/name 크기를 batch 측정하고 `data-label-mode="name"`으로 반영. 폰 media 안의 CSS 한 줄로 활동 span만 숨김. 10px 폰트·상태색 dot·전체 활동 원문/title/aria 유지. 새 DOM·handler·runtime 파일 없음.
- 원본 SHA256 `0083dec0e121e1c71027616d55be39b6f6c69d54eab6c7cc12e7ff85beafc8ff`, 수정 JS `c00801f4abf327c2d99044264cc83399aa727f6d9fcf1bdc87c9eb99e08df736`. 두 label 함수 밖의 JS 원문 byte 동일. CSS는 phone media selector 한 줄만 추가. scheduler·sprite·좌석·버전/cache 불변.
- 신규 `scripts/hani-office-crowded-labels.test.mjs`: 8개 신규 + import된 owner 6개 = **14/14 PASS**. 혼잡38px 가로열 dot→name, 대화/full 위치 보존, name/dot 마지막 단계, 충돌·경계·자기 배우 귀속, top-edge full/name, 먼 자리 거절, 3F 원인 분리, 실제 owner의 기존 이름 슬롯 탭→기존 bubble/전체 활동·title/aria·노드/발 좌표 보존, desktop 별도 슬롯, browser checker 부정 사례 검사.
- `scripts/hani-office-obr18.test.mjs`: **12/12 PASS**, synthetic 300/342/1348px 각370장면. 342/1348px 충돌·얼굴·마스코트·라벨·경계·거리·대화 위반0, 누락0. 300px는 기존 검사부터 completeness 예외인 너비로 누락43건이 남으며 전체 통과로 주장하지 않음. font/animation 합성 좌표이지 브라우저 pixel 증거 아님.
- `scripts/hani-office-top-labels.test.mjs`: **7/7 PASS**. dot은 기존 runtime에서 항상27.5px radius였으므로 독립 checker도 동일하게 수정. 상단 예외 거절 fixture를 그 radius 밖으로 옮겨 검사 의도를 보존하고 name 예외도 확인.
- browser geometry: mode별 short/name 실제 가시성·full title/aria·font>=10·정확한 head radius·name nearest·dialogue/speaker full 유지 검증. full coverage와 readable coverage 분리. obr14/top browser 집계에도 name 수 추가. 실제 browser 실행 없음.
- 원본과 합성 시간별 비교(2026-10-22, absent/active, 24시간×5층): desktop240장면 배치 완전 동일, phone240장면 기존 full pill 이동0. `hourly-node.json`에서 3F 아린 dot36→36, 유리 dot36→34(name2). 아린·유리 홈 좌석에서는 이름 pill도 공간 부족으로 dot 유지. 일부 2F/4F 배우는 name으로 개선되며 모든 dot 해결을 주장하지 않음. 실제416px/시간별 측정과 다름.
- 모든 `scripts/hani-office-*.test.mjs`를 `node <파일>`로 실행: **29파일 중15파일 PASS /14파일 Git 차단 포함**, 다른 원인의 최종 실패0. TAP 완료분은227건 중215 PASS·10 Git EPERM 실패·2 browser SKIP. 나머지6파일은 Git EPERM으로 TAP 집계 전 중단. import된 공통 검사가 중복 포함된 수치임.
- Git 차단 파일: `219`, `actions-216`, `chairman-234`, `lively-v2`, `obr12`, `obr14`, `obr15`, `obr21`, `obr4`, `obr6`, `obr7`, `obr8`, `obr9`, `v2-215`(모두 `hani-office-*.test.mjs`). `$env:HANI_GIT_PATH=(Get-Command git).Source` 설정. 절대 Git 경로로 Node `execFileSync --version`도 EPERM 확인. shell Git read만 가능. 차단을 PASS 처리하거나 browser 차단을 우회하지 않음.
- JS/변경 mjs syntax, CSS brace balance, `git diff --check`, persistence API 없음·두 label 함수 밖 원문 동일 검사 PASS. 모든 테스트 원문 로그·최종 파일별 결과: `artifacts/office-crowded-labels/tests.json`, `summary.json`. obr18/top-labels 로그는 최종 수정 후 재실행 결과로 갱신.

## 다음 담당에게

- 먼저 읽을 코드: `placeStatusLabels`, `fitStatusLabels`, phone CSS와 `scripts/hani-office-obr18-browser-geometry.mjs`.
- 리뷰어가 실제 브라우저에서 360/390/416px 모든 층·시간별 full/name/dot 수, 특히 3F 아린·유리 잔여 dot, 겹침·top-edge·활동 tap·desktop 회귀를 확인. browser 스크립트는 준비만 했으며 실화면/PNG/overflow/touch 결과는 미검증.
- 다음 명령: 허용 환경에서 `scripts/hani-office-top-labels.browser.mjs`, `scripts/hani-office-obr14.browser.mjs`, `scripts/hani-office-obr15.browser.mjs` 실행. Git 허용 환경에서 위14파일 재검사.
- 모든 변경은 지정 branch에 미커밋. commit/push/PR/main merge·Pages 배포·Production read-back 없음. version bump N/A(사용자 금지·기능 탭 규칙).
- Notion은 이번 사용자 지시로 수정하지 않음. CURRENT/DECISIONS의 다른 담당 기록 보존.

## 2차 수정 · 2026-10-31 KST / Codex

- 시작 branch/HEAD/base는 동일한 `hani/office-crowded-labels` / `a090419cfb3eb9529e033a0c5a102eb42174d4b6`. 기존 미커밋 변경 위에 작업. 사용자 승인 범위: 휴대폰 하체 이름표·엄격한 geometry 검사·관련 회귀·missing 원인 조사. commit/push/merge/version bump/Notion/브라우저 실행 금지 유지. 별도 main 갱신·Candidate 전환 없음.
- 상태: 하체 이름표 구현과 targeted Node 검증 완료. 실제 브라우저 및 민지 좁은 화면 누락 해결은 완료로 선언하지 않음.
- 이번 runtime 변경은 `placeStatusLabels` 안의 하체 이름표 단계 13줄 추가만. 2차 작업 직전 원문은 `artifacts/office-crowded-labels/second-pass/before-source.txt`, 해당 함수 밖 JS byte 동일 검증. CSS는 추가 수정 없음. 새 DOM/event/renderer/runtime 파일·sprite·좌석·scheduler 변경 없음.
- 순서: dialogue/full pill → 기존 name pill → own-body name → dot. `mode:'name', ownBody:true` placement로 같은 이름 슬롯·같은 CSS 재사용. 실제 sprite 중앙 x, 하단 40% 중앙 y를 사용하고 floor/발 아래로 나가지 않도록 clamp. 얼굴 상단 60% 경계를 넘지 않고, 자기 sprite 예약만 예외로 제외. 다른 sprite의 여유 예약·mascot·모든 라벨 예약은 그대로 검사. 이웃을 건드리는 넓은 이름표는 거절.
- 배경은 기존 `.hani-office-name`의 불투명 `#fff`, 글자 `#493752`. dark/midnight 규칙에 이름표 배경 override 없음을 코드 검사. 실제 테마별 시각 확인은 미검증.
- `readPhoneLabels`는 실제 box/sprite 좌표로 own-body 여부를 추론. 이름 모드·얼굴 아래·sprite 높이 안·sprite 중심 정렬·다른 sprite와 접촉 없음이 모두 맞을 때만 자기 sprite overlap/head distance 예외 적용. label/mascot/floor 검사는 계속 강제. `assertPhoneLabels`도 좌표를 다시 검사하여 잘못된 ownBody 플래그·누락된 플래그·조작된 요약 배열로 얼굴/이웃 겹침을 통과시키지 않음.
- 민지(`minji`) missing 원인: full/name/dot 모두 배치 실패하면 Map 값이 `null`, `fitStatusLabels`의 `node.style.visibility=p?'':'hidden'` 경로로 기존 슬롯이 숨겨짐. 배우가 scheduler에서 사라진 현상이 아님. 기존 browser.json을 새로 실행하지 않고 읽은 결과, 360px before13/after14, 390px before13/after13건이 민지이며 416px에는 해당 artifact의 missing 기록 없음. 사용자 최신 측정 26건과 동일한 결과라고 단정하지 않음.
- 민지의 좁은 맵(304/334px, viewport360/390에 해당) 홈 좌석 합성 재현에서는 양옆 sprite가 겹쳐 하체 이름표가 불법이며, 윗줄 sprite와 고정된 라벨 사이에도 27.5px 거리 내 안전한 5px dot 공간이 없음. 24시간×4맵너비 조사에서 missing14건 모두 다른 dot을 제거해도 legal candidate0. greedy dot 순서 문제가 아니므로 거리/충돌 검사를 느슨하게 바꾸지 않음. 하체가 안전하게 비는 null 배치 사례는 이번 단계로 name 복구됨을 회귀로 확인. **좁은 화면의 민지 누락은 잔여 한계이며 완전 해결 아님.**
- 테스트: `node scripts/hani-office-crowded-labels.test.mjs` **18/18 PASS**(공통 owner6 포함), `node scripts/hani-office-obr18.test.mjs` **12/12 PASS**(공통 owner6 포함), `node scripts/hani-office-top-labels.test.mjs` **7/7 PASS**. 합계37개 실행, import된 owner 검사 중복 포함. 테스트 범위: 윗줄 아래 하체 이름표, 얼굴/이웃/mascot/라벨/floor 거절, 이름폭 접촉 시 dot, null→안전한 하체 name 복구, 기존 full/dialogue 위치, 실제 persistent 슬롯 tap/title/aria/원문/노드/발 보존, geometry의 부정 사례.
- OBR18 합성 300/342/1348px 각370장면: 모든 geometry/대화 위반0. 342/1348 누락0. 기존 completeness 예외 300px는 누락41건(1차43) 남음. 이것을 전체 geometry/completeness PASS로 확대하지 않음.
- 별도 24시간×presence2×5층: 휴대폰 map360/368/416px 합계720장면, 기존 full pill 이동0; desktop1348px 240장면 byte-equivalent placement, 변경0. map416 합성에서 pill621/name36/dot128 → pill621/기존name36/하체name125/dot3, 누락0. **map 너비이며 viewport416 브라우저 수치가 아님.** map360/368 각각 하체71개 추가, 민지는 이 샘플에서 dot22 유지. 원문 증거 `second-pass/comparison.json`.
- JS/mjs syntax4개, CSS brace·불투명 배경·dark override 부재, 무 persistence API, 함수 밖 JS byte 동일, `git diff --check` PASS. 최종 runtime SHA256 `8a43f3aad1d6416b1dfac82fd8f065b3c39bbf804717277253e75a08169d0257`. 로그/비교/안전 검사: `artifacts/office-crowded-labels/second-pass/`.
- 다음 담당: 실제 브라우저에서 viewport360/390/416·애니메이션·두 테마·전체 시간의 own-body/name/dot/missing, 특히 2F 민지와 3F 아린/유리를 확인. 민지 누락은 no-overlap·head radius·sprite/좌석 불변 제약 하의 실제 공간 부족 여부를 분리 보고. 이번 사용자 지시로 브라우저 실행 및 우회 시도 없음. version/main/Pages/Production/Notion 모두 이번 검증 대상 아님.
