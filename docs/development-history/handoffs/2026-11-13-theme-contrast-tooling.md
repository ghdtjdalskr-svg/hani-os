# tc291b · 290 기준 글자색 시험 층 정리

## 작업 식별

- 갱신 시각: 2026-11-13 07:35 KST / 담당: 도연 Codex, Git·Edge 후속 검증: 서윤
- 상태: 시험 도구 구현·실행 완료 / 서윤 Git·Edge 검증 대기(미커밋)
- 저장소 / branch / worktree: HANI OS / hani/theme-contrast / tc291
- base: origin/main 로컬 ref 46cb7a69c4beeff3cce3bbe788be6f952e7b99e9, HEAD 로컬 ref 47b20fa8e6a702bc93c9adefcbb73634d84e3ea7. Git 명령 없이 ref 파일만 읽음. 원격 최신성 미확인.
- 목표: main의 290 버전·이음 inverse 뒤에 기존 289→288 단언 연결, CSS exact inverse를 기존 시험 체인에 연결.
- 범위: scripts/ 시험 도구·시험, artifacts/theme-contrast/ 근거, 이 인수인계와 CURRENT 요약. 운영 파일·고정 fixture·기존 assertion/hash/숫자 기대값 보존.
- 승인 근거: ../tc291b-task.md 전체 UTF-8 정상 확인. Git·Edge 금지, commit/push/PR/merge/배포 금지.
- CODEMAP_MISS: dev-center/codemap.json에 해당 시험 층 owner 없음. 지정 owner·의존 체인으로 fallback.

## 결과와 증거

- 변경: main release projection 앞 CSS exact inverse 연결, 290+이음 → 기존289/288 연결·동등성 증명, M9 기본 read API 회귀4개 추가. app216 audit·qa-easy·history Node fixture도 기존 exact 체인만 연결. 단언·수치·고정 fixture·운영 파일 보존.
- 실행 검증: 97파일 961 PASS · Git 차단36(29파일) · skip4 · 기타 실패0. office72파일 790 PASS/Git34/skip3, M9 15/15, release10/10, save10/10, join17/17, theme Node3/3·기본 preload4/4. 뉴스룸285/288 CSS pin2+7·life5 PASS. 문법7/7, 명시적 adapter owner4출력·raw reader 보존 PASS.
- 근거: artifacts/theme-contrast/TOOLING-291.md, TOOLING-291-results.json(파일별 명령·실패/차단·코드 해시), TOOLING-291-tests.txt(TAP). 결과 수는 실행별 TAP case로 의존 시험 중복 포함.
- 미검증: Git 필요 단언/파일 시작36건은 process guard로 실행 전 차단. Edge 부모+48조합은 지시대로 미실행, 전체52/52 미확인. 지정 기존 실패20개 직접 실행·수정 없음. 대표 실기기·원격·Production 미확인.
- 보존: 운영504파일 바이트 동일·추가/삭제0, fixture 5cff7afd…/5d59f5ee… 유지. 기존 산출물JSON4개 복원·새 시험 JSON2개 제거, 기존 Edge PNG/JSON 보존.
- 데이터·저장소·Cloud·schema: 수정하지 않음. 버전·runtime build·Production 검증 N/A(도구 전용).
- main / Pages / 표시 버전 / JS / read-back: 병합·배포 없음. 로컬 HTML 선언상 표시/cache2.9.290, UI hani-ui-v02992.js?v=2.9.290, 마지막 script hani-launch-greeting.js. 실제 JS 로딩·화면·원격·운영 새 확인 없음(Edge·Git 금지).
- Notion: HANI-87 읽기 성공. 착수 insert_content는 `MCP tool call requires approval, but approval policy is never`로 거절되어 미반영. 최종 요약도 갱신 대기: main46cb7a6/HEAD47b20fa8, 97파일961PASS·Git36·skip4·기타0, 운영504 불변, Edge52 미확인, 서윤 검토·Git/Edge·commit/push 인계. https://app.notion.com/p/415c5275707481fa9cbfe8d24b7e50f9

## 다음 담당에게

- 먼저 읽을 파일: artifacts/theme-contrast/TOOLING-291.md, scripts/hani-release-version-layers.cjs, scripts/hani-join-ieum-source.cjs.
- 다음 행동: 보고서 명령으로 서윤이 Git 차단29파일과 실제 Edge 전체52개 재검증 후 diff 검토·commit/push. 필요한 서버 배포·설정 변경 없음.
- 승인 경계: 이 작업은 시험 도구 수정만 승인됨. 기존 기능·배포 승인으로 확대하지 않음.
- CURRENT / DECISIONS: 확인된 결과를 CURRENT 맨 위에 추가. 새 제품 결정 없음. 기존 기록·타 담당 작업 보존.
