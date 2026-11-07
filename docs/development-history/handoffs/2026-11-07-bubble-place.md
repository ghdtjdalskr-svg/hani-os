# PC 자동 말풍선 배치 — 작업 인수인계

## 작업 식별

- 작업 ID/담당/날짜: bubble-place / Codex / 2026-11-07 KST, 구현·targeted 검증 완료 / Git 차단·미커밋.
- 저장소/branch/worktree: ghdtjdalskr-svg/hani-os / hani/office-companions / companion-live.
- base·착수 HEAD: 0159d09ad769c2841c6aba09af4022cf1bd9da0d. 로컬 origin/main 캐시 b7367744898b79ce1c6efc572b1ddf94b64cc7c7.
- 승인: ../bubble-place-task.md 전체 UTF-8 정상 확인. 기존 owner PC 위치만 수정·시험 추가·278 확장·지정 회귀·가능하면 Edge 3PNG·로컬 commit(막히면 미커밋 보고). push/merge/버전 변경 금지.
- 범위: hani-office-live.js의 기존 위치 계산과 기존 labels batch 결과 재사용, 기존 시험/278 projection, 본 작업 artifacts/문서. 타 작업 파일 보존.
- CODEMAP living-office owner 확인; 최신 bubble/labels anchor는 좁은 검색으로 보완.

## 결과와 증거

- 착수 원문: artifacts/bubble-place/baseline/. 표시·cache 유지, 저장/Cloud/schema 변경 없음.
- Notion 착수 읽기 성공, append는 자동 승인 검토에서 approval policy never로 거절. 갱신 대기(저장/read-back 완료 아님).
- 구현: 기존 labels batch의 sprite/최종 name·status 크기/좌표를 PC exclusion으로 재사용. DOMRect의 prototype geometry를 명시적으로 읽고, 위치 이동으로 말풍선 줄바꿈이 변하지 않도록 PC max-content 폭을 고정. 위 공간 부족 시 아래·좌우 clamp, 같은 프레임 끝 label commit과 이동은 기존 follow 캐시로 반영. compact는 기존 순서/좌표 그대로.
- 278: bubblePlaceExtension 외 이전 contract 값 전체 deepEqual 확인. 정확한 3개 runtime 묶음만 역변환, 기존 모든 hash/assertion 유지. strict mutation 시험 추가. assertion 삭제/완화 없음.
- 전용 포함 floor-bubble 21/21. labels+pins 22통과·Git subprocess 5차단(EPERM), 그 외 실패0. labels 읽기 site 6개·전체 layout/timer/listener/storage/cloud reference 수 불변·steady frame 읽기0 검증.
- Edge156·실제 로컬 index/runtime·토요일14시·4층·1280×900, 가상480초·0.8초 간격: visible301표본·51대사, 본인 sprite/이름표 교차0/0·단일bubble·쓰기0·가로overflow0·page error0. PC PNG3장 직접 확인. 폰390×844도 같은 가상480초, 413표본의 말풍선·이름표 박스/대사/시각/발화자/논리좌표/교차결과가 base 원본 실행과 정확히 일치. 폰 기존 이름표 교차15·sprite 교차211표본 유지(폰 개선 PASS로 보고하지 않음). 폰 PNG3장 추가, 그중1장 직접 확인. 증거 phone-comparison.json, baseline-browser-results.json.
- 최초 전체 회귀에서 browser와 동시 실행된 기존400ms cold plan 시험의 chairman present 최소469.67ms 실패1건을 보존. scheduler byte는 변경 없음, 전체 완료 후 같은 기준 재검사 통과(아래 최종 결과).
- kids-visit raw safety 시험의 index2.9.277↔artifacts/kids-lively 원본2.9.276 비교 실패를 base runtime SHA256 87e892c3…로 동일 재현. baseline-visit.mjs는 진단 전용 read adapter이며 현재-runtime 검사/fixture/assertion을 대체하거나 변경하지 않음. baseline-visit.log에 정확한 원본 hash와 실패 기록.
- 로컬 commit 실제 시도: 명시한 작업 파일에 git add 실행을 요청했으나 spawnSync git EPERM으로 시작부터 차단, commit=null. git-commit.json. index/ref 변경 없음·push/merge/버전 변경 없음.
- baseline에 고정한 HEAD loose Git object를 read-only로 SHA1 검증. 보호 파일9개+runtime 역변환 원본 일치·syntax4/4·closure161불변·누락0. local 표시/cache2.9.277·마지막 UI hani-ui-v02992.js?v=2.9.277 유지. GitHub main b736774 조회, 로컬 origin/main과 일치. 자동 merge/rebase 없음.
- 초기 prototype/후속 labels/폭 문제의 화면 실패와 중단 회귀는 preliminary-*로 분리; 최종 증거로 재사용하지 않음.
- Candidate/package/HINA/운영 검증 N/A(기능 개발). 독립 Arin 리뷰나 운영 확인으로 보고하지 않음.
- 최종 runtime SHA256 `f3797ab8a7fdefdee7b475b604cc9aa8f60c9e15ade6089e517e735eb9efd1ff`, 278 contract `85944363691aca122e946bc2635682def7bc88e8cee03a7baac209b19e3339ae`. 본 identity의 회귀/화면/validation만 최종 근거로 사용.
- 검사 명령: bundled Node `C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`로 `artifacts/bubble-place/regression.mjs`, `browser-check.mjs`(원본 폰 비교용 `--phone-baseline` 추가), `verify-phone.mjs`, `--experimental-vm-modules --no-warnings artifacts/bubble-place/verify.mjs`. 전용은 `--test --test-isolation=none scripts/hani-office-floor-bubble.test.mjs`.

## 다음 담당에게

- 먼저 읽기: artifacts/bubble-place/REPORT.md 및 이 인수인계.
- 다음 행동: 허용된 Git 환경에서 본 작업 범위만 로컬 commit. 대표님 지시대로 push/merge/버전 변경 금지 유지. Preview 추가 판단/배포 열차 탑승은 별도 요청 범위.
- Notion 갱신 대기: 날짜·담당·base·목적·결과·미검증·Git 제약·보고서/인수인계 원문. push/merge/배포 승인 아님.

## 최종 검증·미검증

- 전체66파일 완료: raw717통과·Git EPERM31차단·버전fixture 비교2실패·성능1실패·skip5·미완료0. cafe-rest 동일400ms 기준 재검사3통과·Git1차단: 최소 부재324.4016ms/재실374.1773ms. 첫 실패를 보존하며 해당 항목만 최신 결과로 교체한 최종 집계718통과·Git31차단·기존실패2·skip5, 새 기능 실패0. final-summary.json, regression/summary.json, cafe-recheck.log.
- kids-visit와 staff-chat의 index2.9.277↔과거2.9.276 fixture 비교 실패는 모두 base runtime으로 동일 재현. baseline-visit.log·baseline-staff.log. 기존 fixture/assertion 수정·완화 없음. 본 수정의 CSS/index/main은 HEAD Git blob과 일치(별도 validation.json).
- 화면·폰 대조·syntax·closure·원본 보존 증거는 위와 동일 identity. 저장/Cloud/schema 변경0. 서버 Edge Function·배포 순서 N/A.
- CURRENT 맨 위에 최종 요약 추가, 과거·타 담당 기록 보존. DECISIONS 변경 없음. Notion 저장/read-back 미완료(자동 승인 검토 never 거절), 갱신 대기 초안은 본 파일/REPORT 내용.
- 실행하지 않음: 실제 로그인/Cloud, 독립 Arin/HINA, candidate package, PR/main merge/Pages/운영 read-back. 기능 개발 완료를 배포 완료로 간주하지 않음.
