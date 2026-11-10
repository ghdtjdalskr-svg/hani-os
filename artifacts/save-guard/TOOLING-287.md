# tooling-287 · 저장 안전장치 시험 기준 갱신

## 작업 식별

- 담당: Codex / 2026-11-11 KST. 상태: 도구 수정·지정 시험 실행·증거 정리 완료, Git 의존 검사는 서윤 재검증 대기. 전체 PASS로 보고하지 않음.
- worktree: tl287 / branch: hani/tooling-287(로컬 HEAD 참조로 확인). 지정 base origin/main: 4086b9d, 운영 v2.9.287. Git 금지로 원격 최신성은 새로 조회하지 않음. candidate/commit SHA 없음.
- 승인 근거: ../tooling-287-task.md 전체를 UTF-8로 읽고 한글 정상 확인. 시험·문서·artifacts/save-guard 정리만 수행. Git 명령·commit·push·main merge·배포는 수행하지 않았으며, commit·push 담당은 서윤.
- CODEMAP_MISS: 저장 안전장치·release inverse anchor 없음. 기존 시험 owner, dependency와 frozen fixture를 좁게 추적함. 정상 런타임 DOM/event/renderer 경로는 변경하지 않음.

## 변경한 파일

착수 시 복사되어 있던 파일을 기준으로 이번 세션에서 수정한 도구는 아래 6개다. 상세 전후 SHA256은 RESULTS-287.json에 있다.

1. scripts/fixtures/release-version-layers.json: 287→286 버전/배포 기록 inverse 한 층 추가. index 60개·main 1개 버전 토큰, history의 완전한 metadata edit과 입력/출력 SHA256을 고정함. 이전 manifest 전체는 새 row를 제거하면 원문 바이트와 동일함.
2. scripts/hani-save-guard-source.cjs: pinned 287만 286으로 투영하는 바깥 함수 추가. restoreOuter / restoreSaveGuard284 / restoreSaveGuard286Source의 기존 strict 본문 바이트와 fixture pin은 그대로 유지함. 알 수 없는 입력은 통과 처리하지 않고 원문을 반환하여 하위 strict 검사가 거부하게 함.
3. scripts/hani-release-version-layers.cjs: 287 버전 → guarded 286 → guard inverse → 기존 286 이하 버전/feature 순서로 연결. 287 버전 경계는 raw 287, 287 feature 경계는 guarded 286을 유지함. 이 경계 보정 전후의 기존 282~286 view를 owner 10개·3 API·문자열/Buffer로 비교한 전체 바이트 동등성 300건 PASS. 따라서 먼저 실행된 하위 office/M9 증거에 영향을 주는 출력 변경은 없음.
4. scripts/hani-save-guard.test.mjs: 원문 287 안전 동작은 그대로 검사하고, 과거 inverse를 호출할 때만 정확한 286 입력을 공급함. 기존 10개 시험과 assertion 유지.
5. scripts/hani-office-kids-286-source.test.mjs: 286 전용 manifest view와 원문 비교 입력만 286 경계에 고정함. 기존 assertion 유지. kids-visit/staff-chat 시험 자체는 추가 수정 없이 공통 바깥 projection으로 연결됨.
6. scripts/hani-release-version-layers.test.mjs: raw 287부터 모든 층을 검사하고, 제공된 baseline 2개·Buffer·입력/출력 해시·drift/중복/재역변환 거부·실디스크 불변을 확인하는 회귀 1개 추가. 기존 6개를 유지해 7개가 됨. 미래 288 합성 시험도 현재 raw 287을 기준으로 실행함.

기존 frozen fixture/hash·assertion 삭제·완화 없음. 원래 혼합 CRLF/LF 유지. 보호 키·내부 버전·storage write·Cloud write/schema·migration·표시 버전·캐시 태그 변경 없음.

## 시험 결과

환경: Windows PowerShell / Node v24.20.0. Node 자식 프로세스 spawn EPERM 때문에 시험별 Node를 PowerShell/.NET에서 직접 실행하고 --test-isolation=none을 사용함. 일반 office 파일은 최대 3개 프로세스로 실행했으며 performance.now 성능 시험은 마지막에 단독 실행함. 400ms 등 기존 성능 제한은 그대로 유지함.

| 검사 | PASS(TAP) | Git 차단 | skip | 기타 실패 |
|---|---:|---:|---:|---:|
| office 전체 73파일 | 790 | 35 | 3 | 0 |
| board | 1 | 0 | 0 | 0 |
| cloud-conflict-choice | 1 | 0 | 0 | 0 |
| cloud-egress-save-sim | 1 | 0 | 0 | 0 |
| cloud-first (40 case) | 1 | 0 | 0 | 0 |
| dev-report-generate (10그룹) | 1 | 0 | 0 | 0 |
| egress-fix | 1 | 0 | 0 | 0 |
| investment-research | 15 | 0 | 0 | 0 |
| life-bundle-source | 5 | 0 | 0 | 0 |
| newsroom-285-source | 2 | 0 | 0 | 0 |
| newsroom-4cut-230 (--node) | 7 | 1 | 0 | 0 |
| pb-chibitoon | 5 | 0 | 0 | 0 |
| procrastination-board | 6 | 0 | 0 | 0 |
| release-version-layers | 7 | 0 | 0 | 0 |
| save-guard | 10 | 0 | 0 | 0 |
| study-retry | 26 | 0 | 0 | 0 |
| 지정 seoyun M9 | 15 | 0 | 0 | 0 |

- dev-report의 TAP 1건 안에 실제 10그룹이 모두 통과함. cloud-first도 TAP 1건 안에 40 case를 실행함. 나머지 단일 script형 검사를 별개의 세부 assertion 수로 부풀리지 않음.
- office kids-286-source / kids-visit / staff-chat 결과는 RESULTS-287.json의 파일별 기록 참조. office는 scripts/hani-office-*.test.mjs 73개를 빠짐없이 실행함.
- Git 차단은 사용자 금지를 지키는 worktree 밖 no-git.cjs가 실제 Git 실행 전에 USER_GIT_DISABLED로 중단한 항목이다. assertion과 Git 호출 본문을 대체하거나 skip으로 바꾸지 않음. 219의 기존 실패는 앞선 Git 기준본 조회에서 차단되어 이번에 재현하지 못함.
- 변경 JS syntax 5/5 PASS, JSON parse 및 이전 manifest row/strict guard 함수 원문 보존 PASS. 실행 명령·종료코드·TAP 수·차단 항목·로그 SHA256은 RESULTS-287.json에 저장함.

기본 명령:

~~~text
node --require <worktree 밖 임시>/no-git.cjs --test --test-isolation=none --test-reporter=tap scripts/<파일>
office 추가: --import ./scripts/hani-life-bundle-preload.mjs
뉴스룸 4컷 추가: --node
node --require <worktree 밖 임시>/no-git.cjs --require ./scripts/hani-m9-polish-preload.cjs --require ./scripts/hani-m9-link-preload.cjs --test --test-isolation=none scripts/hani-seoyun-m9.test.mjs
~~~

## 남긴 파일과 시험 참조

- TOOLING-287.md: 이 작업의 유일한 보고서·인수인계. 시험 입력 아님.
- RESULTS-287.json: 이번 실행의 최종 수치·명령·파일 해시·보존/정리 목록. 시험 입력 아님.
- browser-results.json, conflict-1280.png, conflict-390.png: 제공된 기존 브라우저 최종 증거를 바이트 그대로 보존함. scripts/hani-save-guard.browser.mjs가 생성하는 출력 경로와 일치함. PNG는 각각 1280×900 / 390×900이며, 이번 287 실브라우저 재실행 증거로 주장하지 않음.
- baseline/hani-main.js, baseline/index.html: 새 release-version-layers 회귀가 직접 읽는 독립 286 기준본. 현재 287에서 버전만 역변환한 전체 바이트와 같고 manifest의 독립 해시도 확인함. 파일 내용을 재작성하지 않음.

총 7개 파일을 남김. worktree 안에 실행 보조 스크립트·probe·중간 결과를 남기지 않음.

## 지운 파일

개발 중 임시·중간 결과 및 이전 보고서 36개 삭제. 목록은 아래와 같으며 최종 JSON에도 동일하게 기록함.

~~~text
BROWSER-BLOCKED.md
child-process-probe.cjs
child-process-probe.json
closure-evidence.json
closure.mjs
finalize-evidence.py
finish.py
GIT-BLOCKED.md
life-final-results.json
life-results.json
no-git.cjs
office-final-results.json
office-results.json
prepatch-preload.cjs
prepatch-results.json
related-final-results.json
related-results.json
REPORT-286.md
REPORT-287.md
REPORT.md
reproduce-existing.ps1
RESULTS-286.json
RESULTS.md
retry-hani-office-bori-stroll.test.mjs-results.json
retry-hani-office-kids-visit.test.mjs-results.json
run-tests.ps1
runtime.diff
safety-final-results.json
safety-results.json
static-evidence.json
summary.json
syntax-results.json
unit-final.log
UNVERIFIED.md
verify.py
workspace-preservation.json
~~~

## 부산물 복원과 보존

- 시험이 바꾼 파일 4개를 착수 시 원문 바이트로 복원: artifacts/office-behavior/obr16-layout-node.json, artifacts/office-behavior/obr17-layout-node.json, artifacts/office-behavior/obr19-layout-node.json, artifacts/office-drama/reachability.json.
- 새 시험 부산물 0개 제거: 없음(새 PNG도 없음).
- artifacts/office-behavior, artifacts/office-drama/reachability.json, artifacts/newsroom-4cut-230 및 qa-evidence의 기존 파일을 모두 착수 해시와 대조함. save-guard 정리 이외의 의도하지 않은 변경 0.
- root hani JS/CSS·index·assets/data 파일 79개 원문 동일. 전체 착수 1996개 파일 중 의도한 변경은 위 도구 6개와 save-guard 정리뿐임. 신규 파일은 이 보고서와 최종 결과 JSON뿐임.
- hani-main.js SHA256: abfa747c378aa826be9f286d60482d10dc12acfe5fcbab035122f5a0269d62fd, CRLF 5,310 / 단독 LF 3,624 유지.
- index.html SHA256: 9891fd175fe50b280f921a275ae2c9f17bceeca553ac6f8d8861c3ded7722b62, CRLF 1,124 / 단독 LF 758 유지. 표시/cache 2.9.287, 마지막 UI 선언 hani-ui-v02992.js 확인은 소스 기준이며 실제 브라우저 로딩 검증은 아님.
- 백업·runner·no-git·전체 로그는 worktree 밖 C:/Users/홍성민/AppData/Local/Temp/hani-tooling-287-JRr8oY에 있음.

## 미검증·다음 담당

- 이번 task의 Git 의존 검사는 미검증. 실제 브라우저·Android·실계정·운영 Cloud는 재실행하지 않음. 런타임/배포 파일 변경이 없어 build·버전 증가·Candidate/Production gate는 N/A. main merge / Pages 반영 / 최신 JS 실제 로딩 / 운영 기능 read-back은 이번 작업에서 수행하지 않음.
- 서윤: 이 보고서와 RESULTS-287.json의 branch/base·6개 도구 변경·정리 목록 검토 → Git 허용 환경에서 office/뉴스룸의 차단 항목 재실행(219 기존 실패 구분) → 담당 권한으로 commit·push. 이번 작업 완료를 main 병합·운영 배포 완료로 해석하지 않음. 서버 Edge Function·설정 변경 없음.
- Notion: 현황판 fetch는 성공했으나 착수 insert_content는 자동 승인 검토에서 “MCP tool call requires approval, but approval policy is never”로 거절됨. 갱신·저장 후 read-back 완료로 보고하지 않음. 이 보고서의 결과·검증 경계·다음 행동을 현황판에 옮기는 일이 갱신 대기로 남음. 보고서 하나 지시에 따라 별도 CURRENT/DECISIONS/인수인계 파일은 추가하지 않음.
