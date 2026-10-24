# 2.9.233 통합 검증 — HOLD

2026-10-24 KST · Codex 단일 Agent. frozen Candidate/독립 HINA 결과가 아닙니다.

## 기준과 결론

- branch: hani/train233-verify, 시작/검증 runtime HEAD: bbc1ff97b498876de752a5705f714cd00f2d7e64.
- 비교 baseline: 2cbbe6ed0c14954008208f0db2316b5f09228c2a, ../m233 읽기 전용. 운영 코드·버전/cache·보호 write·Cloud/schema 수정 0.
- 원격 main은 GitHub connector에서 a1e97d77d611a698e9dcd203510d54541b301a7c(#341)로 확인. 기존 baseline보다 1 commit 앞섬. 미참조 hani-milestones.js 추가만 있으며 후보와 blob 1673ed73771d2744d649c0290dec5fe66016d809 일치. 자동 merge/rebase 없음. 최종 배포 후보는 배포 담당이 새 main 기준으로 확인해야 합니다.
- **신규 실제 회귀 1개:** 공통 parseKoreanNumber가 '-', '+', '-%', '+원'을 null 대신 ±0으로 해석. Toss 224는 main PASS / 후보 FAIL(3 assertion). VM 의존성 보강 후에도 재현됩니다. 함수에서 부호 제거 후 빈 문자열을 거절하는 한 줄 수정은 제안만 준비했습니다. 승인 질문에 아직 답변이 없어 runtime 미수정. 제안 VM 14건 PASS는 실제 후보 PASS가 아닙니다.

## Targeted 결과

| 범위 | 실제 결과 | 화면/외부 영향 |
|---|---|---|
| Asset A/B, C, ease | 9/9 PASS, 13/13 PASS, 6/6 PASS | synthetic·격리 VM |
| Kiwoom / Hana / Toss 224 | 10/10 PASS, 15/15 PASS, 7/10 PASS | Toss FAIL은 위 ±0 회귀 |
| Asset smoke / OCR | PASS, 13/13 PASS | OCR은 합성 JSON 변환, 실이미지 인식률 아님 |
| QA 1차 / 투자위원회 / 유나 smoke | 10/10 PASS, 8/8 PASS, PASS | 실제 Cloud 왕복 미검증 |
| QA 안전 | PASS, canonical save/commit/freshState/normalizeState·storage/Cloud 호출·버전 불변, 16656줄 원문/EOL 보존 | QA 직전 통합 1cdf07f 원본과 비교 |
| Milestones | PASS | browser 선택 분기·실제 Cloud 미검증 |
| Hero / 통합 baseline | brand 3/3 PASS, reviewed baseline 9/9 PASS | CSS exact delta 확인, 실제 crop/AA 미검증 |
| Office | 219·216(120일)·221·obr3/4/6/7/8/9/10/12·behavior·lively·기존 관련 Node 재검증 PASS | browser 미검증. OFFICE_SOFT를 켜지 않음 |
| HANI-77 | browser probe BLOCKED | 실제 renderer/390·1440 screenshot 미검증; check-organization-hub도 Edge 차단으로 미실행 |
| Browser 4개 명시 probe | 전부 spawn EPERM, screenshot 0 | 초기 전체 실행의 자동 launch 경로도 EPERM 발생 후 quota interceptor 설치. 제한 4회가 전체 자동 경로까지 엄밀히 지켜졌다고 보고하지 않음 |

브라우저 재개 시 asset A/B browser가 요구하는 artifacts/asset-intake-v2/preview-fixture.html이 후보에 없다는 추가 blocker도 해결해야 합니다. 기존 browser smoke는 127.0.0.1:4173 서버·격리 인증/응답 fixture, org checker는 별도 8791 preview가 필요합니다. 실행하지 못한 UI를 PASS로 바꾸거나 기대값을 추측해 수정하지 않았습니다.

## 전체 비교

scripts 최상위의 *.test.*, *smoke*, *.browser.*, *-test.* 240개(239 Node + 활성 session fixture가 필요한 PS helper 1개). 기능별 추가 qa safety와 package/ID는 별도입니다. 같은 파일이 main에 없는 경우 ABSENT이며 PASS로 세지 않습니다.

- 후보: **151 파일 CLI PASS / 4 FAIL / 84 차단 / 1 미실행(PS helper)**.
- main: {"ABSENT":20,"BLOCKED_BROWSER":33,"BLOCKED_ENVIRONMENT":5,"BLOCKED_FIXTURE":40,"BLOCKED_NODE_SUBPROCESS":1,"FAIL":4,"NOT_RUN":1,"PASS":136}.
- 비교 분류: {"BLOCKED_OR_PARTIAL":84,"BOTH_FAIL":3,"BOTH_PASS":135,"NEW_PASS":15,"OTHER":2,"REGRESSION":1}.
- PASS는 해당 Node/CLI 조건에 대한 결과이며 선택 browser 분기가 생략된 경우 UI PASS를 의미하지 않습니다. 필수 browser 인자를 생략한 사전 종료·missing fixture·EPERM·timeout은 차단으로 분류하고 원래 exit/rawStatus도 보존했습니다.
- 전체 240행은 [비교표](comparison.md), [CSV](comparison.csv), [명령별 원시 상태·횟수·로그](comparison.json). 상세 로그와 native Git export는 로컬 scratch에 남겨 두었습니다.

| 남은 후보 FAIL | 후보 | main | 판단·다음 행동 |
|---|---|---|---|
| scripts/hani-newface-217.test.mjs | FAIL | FAIL | 양쪽 동일 실패. 기존 assertion 유지, 이번 범위에서 수정하지 않음 |
| scripts/hani-protected-gate-integration.test.mjs | FAIL | FAIL | 양쪽 동일 실패. 기존 assertion 유지, 이번 범위에서 수정하지 않음 |
| scripts/hani-study-news-material.test.js | FAIL | FAIL | 양쪽 동일 실패. 기존 assertion 유지, 이번 범위에서 수정하지 않음 |
| scripts/hani-toss-intake-224.test.mjs | FAIL | PASS | 신규 ±0 입력 회귀. runtime 수정 승인 필요 |

Office obr9는 초기 실패 로그를 보존했고, exact native Git export 준비 후 원본 test 무수정 재실행 및 동일 800개 조건 진단 PASS. 초기 PASS로 덮어쓰거나 기대값을 완화하지 않았습니다.

## 수정과 보존

- 운영 파일 변경 0. 변경은 기존 test/도구 18개 + 새 exact fixture 1개 + 작업 기록입니다. 숫자/날짜/평점 helper를 기존 VM에 공급하고, 실제 saveEntry가 요구하는 DOM querySelectorAll/removeAttribute/click 모의를 보완했습니다. 승인된 만점 확인 질문 흐름과 KST 입력일을 검증하도록 기대값을 조정했습니다.
- 새 train233-integrations.json은 b5a64e5 → bbc1ff9의 승인 통합 13 owner/54 hunk를 고정. asset-intake-v2 3409eb1 / qa-1st 688c6a4 / HANI-77 7d9e385의 충돌 해결 결과를 포함합니다. office·milestones·hero-crop(53a1b28) fixture와 기존 225→232 immutable SHA chain 유지.
- exact fragment 1회 일치, 고정 Git 원본 전체 forward/reverse byte, 무단 edit·삭제·중복·위치 이동·버전 rollback·보호 control 부정 검사를 유지했습니다. 문자열 교체의 $& 등을 원문으로 돌려놓도록 replacement callback을 사용했습니다.
- OCR 기능 검사는 현재 raw runtime을 실행하고, 보호 원문만 별도로 exact normalization 합니다. 오래된 함수3개 C 단계 표현을 현재 runtime으로 착각하지 않도록 기존 immutable hash와 최종 통합 exact 검사를 함께 적용했습니다.
- JS: 후보에서 추가/변경된 존재 파일 95개 node --check PASS(삭제 1개 N/A), 이번 수정 test/도구 18개 node --check PASS. git diff --check(cr-at-eol) PASS. 테스트 비변경 1651줄 EOL 확인, 무관 EOL 복구 필요 0.

## 중복 ID와 package

- index + runtime graph 68개(기존 67개): 신규 duplicate ID **0**. 기존 8개 ID count 유지(2회/3회 모두 실제 count로 비교). index + 모든 hani-*.js의 broad scan도 신규 0.
- 실제 명령: node scripts/hani-release-package.mjs build --base origin/main --candidate HEAD --output <scratch> (정확한 native Git read cache 환경).
- closure: main 126, 후보 **127/128**, data/ 0, 누락 0, 추가 hani-milestones.js 1개, 제거 0.
- package SHA-256: **cf8ed68e983ed81ae17c06dc2509d02649ee6464fd34d86c7b81c1f3fa2cf46e**, 15398293 bytes. 진단 build 1회이며 변경한 test/문서는 runtime closure에 포함되지 않습니다. 마지막 runtime 파일 해시는 동일합니다.
- Candidate Freeze·One-Pass·독립 HINA·Preview 승인·main merge·Edge Function 배포·Pages·Production read-back은 **미실행**. 로컬 표시/cache는 2.9.232 유지. 운영 완료 아님.

## 인수인계

1. 성민 대표님 scope 답변 후 제안한 숫자 입력 한 줄을 적용할지 결정 → Toss/QA 입력/자산 targeted 재검증.
2. Edge 허용 환경에서 browser fixture/서버를 갖추고 요청 UI를 실행 → 미검증 화면·AA·Cloud/다기기 확인.
3. Claude 배포 담당이 최신 main 위에서 고정 후보/버전 1회 증가/표준 Candidate Gate를 진행. 이번 검증을 merge/배포 승인으로 사용하지 않음.

Notion 페이지 읽기는 성공했으나 insert는 자동 승인 검토가 approval policy is never로 거절했습니다. 착수·최종 요약은 Notion 미반영이며 이 보고서와 작업별 handoff에 보존했습니다. Git commit 결과는 작업별 handoff의 최종 상태를 확인하세요. push/PR/main/배포는 수행하지 않았습니다.
