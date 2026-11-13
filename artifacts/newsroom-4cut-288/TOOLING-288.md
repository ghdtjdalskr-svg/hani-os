# tooling-288 · 시험 도구 정리

## 작업 식별

- 갱신: 2026-11-12 KST / 담당 Codex / 검토·커밋·push 서윤.
- worktree tl288 / branch hani/tooling-288 / HEAD·지정 base 98e21fab1bd0e7838e8245dd36423aca3fdeedd6 (v2.9.288). HEAD·branch 참조 파일만 읽어 확인, Git 명령 0. 원격 최신성 새 확인 없음.
- 승인 근거: 대표님의 `../tooling-288-task.md` 전체 수행 지시. 시험 도구만 수정하며 런타임·main 병합·배포·버전 증가는 범위 밖.
- 상태: 지정 288 기준 tooling 수정·실행 가능한 검증·부산물 정리 완료. 서윤 검토·커밋·차단 검사 재실행 대기. Git·브라우저 차단을 PASS로 처리하지 않음.
- CODEMAP_MISS: newsroom 항목에 4cut·시험 release layer owner 없음. scripts의 실제 exact inverse·reader·preload 경로 확인.
- 계획: 사전 실패 재현 → 288 배포 version/history exact inverse → frozen feature/287/guard/286/285 순서 연결 → 지정·office 전체·M9·기능 회귀 → 부산물 복원·해시 확인.

## 변경과 근거

- `scripts/fixtures/release-version-layers.json`: 287→288 층 1개 추가. HTML 60토큰·main JS 1토큰과 연혁의 288 항목/287 커밋 채움을 전체 입력·출력 SHA256, 고유한 완전한 replacement로 역투영. 연혁의 287 출력은 기존 독립 pin `cb3f7452361139780d45671764a2135fb638e42d177c90beb382f5a833c3af26`과 일치. 기존 287 이하 manifest 원문 전체 보존.
- `scripts/hani-release-version-layers.cjs`: 명시적인 `projectPreRelease288Source` 추가. manifest의 288 feature 경계에서 고정 newsroom inverse를 연결하며, 미래 release가 추가돼도 버전→기능 순서를 유지.
- `scripts/hani-newsroom-288-source.cjs`: opt-in projection 입구에서만 288 배포 층 제거. strict `restoreNewsroom288Source`의 assertion·fixture·해시는 원문 그대로.
- `scripts/hani-newsroom-4cut-288.test.mjs`: exact inverse 시험의 입력에만 배포 층 projection. raw runtime renderer 시험 유지.
- `scripts/hani-release-version-layers.test.mjs`: 전체 release/미래 release 시험은 raw 288을 읽고, frozen 287 시험만 288 역투영 입력 사용. 288 독립 pin·Buffer·드리프트/EOL·중복·재역변환 거절·strict feature 경계 시험 추가.
- 기존 두 시험의 연결·추가 시험만 메모리에서 제거하면 착수 백업과 전체 바이트가 같음. 기존 assertion 삭제·완화 0, 옛 fixture pin 변경 0. 수정 파일의 기존 EOL 바이트 유지.

## 검증

- **office 73파일 전부 실행: 파일 45성공 / 28 Git 차단, subtest 790 PASS / 35 Git 차단 / 3 skip. Git 외 실패 0.** 219도 Git 조회 초기화 차단으로 구분.
- **기존 기능 회귀 8파일 전부 exit0: Node 60/60.** 개발보고서 생성기는 이 중 Node 파일1개 안에서 자체 10그룹 PASS.
- 기본 모드로도 지정 8명령(핵심7+M9)을 전부 실행: Node 63 PASS / 2차단, 명령 exit0 6개 / exit1 2개. 230의 Git 기반 duplicate-ID 검사 및 Edge 실행이 각1개 차단됐고, history는 Node unit1 PASS 뒤 브라우저 BLOCKED로 exit1. 이후 230의 기존 snapshot/Node 모드 8/8, history unit-only를 별도로 통과시킴. 브라우저 PASS로 바꾸거나 assertion을 빼지 않음.

- newsroom-4cut-288 7/7, newsroom-285-source 2/2, release-version-layers 8/8, save-guard 10/10, server-owner-guard 13/13 PASS.
- M9: 요청 명령 그대로 실행하여 15/15 PASS.
- newsroom-4cut-230: 기존 `--node` 모드 8/8 PASS. `HANI_MAIN_BASELINE`에는 착수 SHA256과 일치하는 main288의 실제 HTML 의존 그래프 70파일을 worktree 밖에 복사. Git 대체 가짜 응답·assertion 변경 없음. 원격 Git에서 새 export한 증거는 아님.
- history-226 unit-only PASS. 기본 전체 실행은 unit PASS 후 Edge `spawn EPERM`으로 BLOCKED.
- 기존 8파일 모두 exit0: life-bundle-source 5, pb-chibitoon 5, procrastination-board 6, study-retry 26, dev-report-generate 10자체그룹/Node파일1, board 1, egress-fix 1, investment-research 15 PASS.
- syntax: 수정 CJS/MJS 4개 PASS. JSON parse 및 전체 과거 manifest 보존 PASS.
- 모든 일반 시험은 worktree 밖 no-git preload로 실제 Git child 실행 금지. spawnSync는 API 원래 계약대로 unavailable 오류 객체를 반환하고 execFileSync는 금지 오류를 던짐. 실제 Git 기반 독립 검사는 대체·완화하지 않으며 차단으로 분리.

### 실행 명령

- 일반 지정 시험·office 73개 각각: `node --require %TEMP%/hani-tooling-288-Srf0O1/no-git.cjs --test --test-isolation=none scripts/<파일명>`. 파일 목록과 결과는 아래 office 표 및 기존 기능 8파일 목록 참조. 경로는 실제 PowerShell에서 절대 경로로 확장.
- 요청 M9 명령: `node --require ./scripts/hani-m9-polish-preload.cjs --require ./scripts/hani-m9-link-preload.cjs --test --test-isolation=none scripts/hani-seoyun-m9.test.mjs`.
- 230 Node 전용: `node --require <임시경로>/no-git.cjs --test-reporter=tap scripts/hani-newsroom-4cut-230.test.mjs --node`. 이 명령 동안만 `HANI_MAIN_BASELINE=<임시경로>/main-288-baseline`을 설정하고 원래 환경값 복원.
- history Node 전용: `node scripts/hani-history-226.test.mjs --unit-only`.
- syntax: 수정한 CJS/MJS 4개에 각각 `node --check <파일>`.

## 남긴 파일·지운 파일·부산물

- 추가 보고서는 이 `TOOLING-288.md` 하나. 위 다섯 변경 파일 외 전달받은 아래 파일은 착수 바이트 그대로 유지:
  - `artifacts/newsroom-4cut-288/REPORT.md`
  - `scripts/fixtures/newsroom-288-delta.json`
  - `scripts/hani-newsroom-288-test-source.cjs`
  - `scripts/hani-newsroom-4cut-230.test.mjs`
  - `scripts/hani-release-285-test-source.cjs`
  - `scripts/hani-save-guard-source.cjs`
- 시험이 참조하지 않는 전달 baseline `artifacts/newsroom-4cut-288/baseline/index.html`, `hani-main.js` 두 파일과 빈 baseline 폴더 제거. 착수 원문은 worktree 밖 백업에 보존.
- 시험 부산물 JSON 5개를 착수 바이트로 복원: `artifacts/history-226/after-browser.json`, `artifacts/office-behavior/obr16-layout-node.json`, `artifacts/office-behavior/obr17-layout-node.json`, `artifacts/office-behavior/obr19-layout-node.json`, `artifacts/office-drama/reachability.json`.
- `artifacts/newsroom-4cut-230` 및 기존 qa-evidence 파일도 착수 해시 동일. 신규 PNG 0, 그 밖에 추가로 지울 시험 생성 파일 0.
- 전체 1,988개 착수 파일과 최종 비교: 허용 tooling 5개만 수정, 보고서1개 추가, 승인된 baseline2개 삭제. 런타임·에셋 484개 바이트 동일, 범위 밖 변경 0.
- runner·로그·초기 백업·main288 baseline·검사 결과는 `%TEMP%/hani-tooling-288-Srf0O1`에만 보관.

## 다음 담당에게

- 로컬 main 참조 차이: 종료 전 Git 명령 없이 읽은 `origin/main`은 `91d4943d2386a25d7ed49dc56de25c4d1ab5bd8f`. 전달·작업 기준 `98e21fa`와 다름. 이 작업은 98e21fa 런타임을 유지하며 자동 merge/rebase 0. 원격 fetch 없음, loose Git object를 파일로 읽고 SHA1 검증 후 두 tree를 비교: `assets/data/hani-history-releases-v1.json`, `hani-ai-budget.js`, `hani-main.js`, `index.html` 변경. 새 commit은 98e21fa의 직접 자식이며 제목은 `release: v2.9.289 예산 화면 Codex 보조 칸 정리 (#487)`. 289 통합·운영 상태는 이 과제에서 미검증. 이번 tooling 다섯 파일의 직접 충돌은 0이나 index/main/history의 고정 입력이 바뀌었으므로, 최신 main에 적용할 때는 별도 289 버전/feature 역투영 검토와 targeted test가 필요함. 이 보고서의 PASS는 지정 288/98e21fa 런타임에만 해당.

- 먼저 읽기: 이 보고서와 위 다섯 tooling 변경 파일. 다음 행동: 서윤이 diff 검토·Git/Edge 가능 환경에서 차단 검사를 실행한 뒤 승인된 범위로 commit/push.
- office-219는 과제에서 명시한 기존 실패 대상이며, 이번 실행은 고정 Git 원본 조회 단계에서 차단돼 기존 실패 지점까지 확인하지 못함. 해결됐다고 판단하지 않음.
- 데이터·저장소·Cloud/schema 영향 없음. Candidate/build/One-Pass/HINA/버전증가/Production 검증은 런타임 미변경 tooling 작업으로 N/A. PR·main 병합·Pages·운영 화면·최신 JS read-back은 수행하지 않음.
- Notion 현황판 읽기 성공. 착수 insert_content는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절해 미반영. 계획·최종 결과 모두 갱신 대기. CURRENT/DECISIONS는 다른 담당·기존 기록 보존 및 보고서 하나 지시에 따라 수정하지 않음.

## office 전체 결과 · 지정 288 기준

아래 실패 수는 원래 Node fail 집계이며 모두 실제 Git 실행 전 차단된 검사다. skip 3개는 통과로 계산하지 않았다. assertion을 삭제하거나 Git 결과를 성공으로 위조하지 않았다.

| office 파일 | 통과 | Git 차단 | skip | exit |
|---|---:|---:|---:|---:|
| `hani-office-219.test.mjs` | 0 | 1 | 0 | 1 |
| `hani-office-actions-216.test.mjs` | 14 | 1 | 0 | 1 |
| `hani-office-actions-221.test.mjs` | 20 | 0 | 0 | 0 |
| `hani-office-affinity-274-pins.test.mjs` | 2 | 1 | 0 | 1 |
| `hani-office-affinity-cap.test.mjs` | 19 | 0 | 0 | 0 |
| `hani-office-affinity-storage.test.mjs` | 3 | 0 | 0 | 0 |
| `hani-office-affinity.test.mjs` | 21 | 0 | 0 | 0 |
| `hani-office-barista-night-273-pins.test.mjs` | 4 | 1 | 0 | 1 |
| `hani-office-barista-night.test.mjs` | 13 | 0 | 0 | 0 |
| `hani-office-barista.test.mjs` | 10 | 0 | 0 | 0 |
| `hani-office-behavior.test.mjs` | 10 | 0 | 0 | 0 |
| `hani-office-bori-m9.test.mjs` | 2 | 0 | 0 | 0 |
| `hani-office-bori-stroll.test.mjs` | 13 | 1 | 0 | 1 |
| `hani-office-bubble-close.test.mjs` | 17 | 0 | 0 | 0 |
| `hani-office-cafe-rest.test.mjs` | 3 | 1 | 0 | 1 |
| `hani-office-chairman-234.test.mjs` | 6 | 0 | 0 | 0 |
| `hani-office-chairman-patrol-278-pins.test.mjs` | 6 | 6 | 0 | 1 |
| `hani-office-chairman-patrol.test.mjs` | 15 | 0 | 0 | 0 |
| `hani-office-companion-homes.test.mjs` | 15 | 1 | 0 | 1 |
| `hani-office-companions-276-pins.test.mjs` | 2 | 1 | 0 | 1 |
| `hani-office-companions.test.mjs` | 17 | 0 | 0 | 0 |
| `hani-office-consult.test.mjs` | 19 | 1 | 0 | 1 |
| `hani-office-crowded-labels.test.mjs` | 19 | 0 | 0 | 0 |
| `hani-office-drama.test.mjs` | 20 | 0 | 0 | 0 |
| `hani-office-fix-218.test.mjs` | 6 | 0 | 0 | 0 |
| `hani-office-floor-bubble.test.mjs` | 21 | 0 | 0 | 0 |
| `hani-office-hd-224.test.mjs` | 10 | 0 | 0 | 0 |
| `hani-office-icons.test.mjs` | 14 | 1 | 0 | 1 |
| `hani-office-kids-286-source.test.mjs` | 3 | 0 | 0 | 0 |
| `hani-office-kids-lively.test.mjs` | 15 | 0 | 0 | 0 |
| `hani-office-kids-merge.test.mjs` | 10 | 0 | 0 | 0 |
| `hani-office-kids-pose-b.test.mjs` | 13 | 0 | 0 | 0 |
| `hani-office-kids-visit.test.mjs` | 16 | 0 | 0 | 0 |
| `hani-office-kids-weekday.test.mjs` | 19 | 0 | 0 | 0 |
| `hani-office-labels-qa.test.mjs` | 17 | 0 | 0 | 0 |
| `hani-office-lively-v2.test.mjs` | 7 | 1 | 0 | 1 |
| `hani-office-lively.test.mjs` | 13 | 0 | 0 | 0 |
| `hani-office-mascot-label.test.mjs` | 9 | 1 | 0 | 1 |
| `hani-office-motion-1.test.mjs` | 16 | 0 | 0 | 0 |
| `hani-office-motion-2.test.mjs` | 24 | 0 | 0 | 0 |
| `hani-office-obr10.test.mjs` | 4 | 0 | 0 | 0 |
| `hani-office-obr12.test.mjs` | 0 | 1 | 0 | 1 |
| `hani-office-obr14.test.mjs` | 4 | 1 | 0 | 1 |
| `hani-office-obr15.test.mjs` | 13 | 1 | 0 | 1 |
| `hani-office-obr16.test.mjs` | 12 | 0 | 0 | 0 |
| `hani-office-obr17.test.mjs` | 3 | 0 | 0 | 0 |
| `hani-office-obr18.test.mjs` | 12 | 0 | 0 | 0 |
| `hani-office-obr19.test.mjs` | 3 | 0 | 0 | 0 |
| `hani-office-obr21.test.mjs` | 4 | 2 | 0 | 1 |
| `hani-office-obr3.test.mjs` | 5 | 0 | 0 | 0 |
| `hani-office-obr4.test.mjs` | 8 | 2 | 0 | 1 |
| `hani-office-obr6.test.mjs` | 0 | 1 | 0 | 1 |
| `hani-office-obr7.test.mjs` | 0 | 1 | 0 | 1 |
| `hani-office-obr8.test.mjs` | 2 | 1 | 0 | 1 |
| `hani-office-obr9.test.mjs` | 0 | 1 | 0 | 1 |
| `hani-office-pet-bori-272-pins.test.mjs` | 3 | 1 | 0 | 1 |
| `hani-office-pet-bori.test.mjs` | 14 | 0 | 0 | 0 |
| `hani-office-pets-268-pins.test.mjs` | 0 | 1 | 0 | 1 |
| `hani-office-pets-bubble.test.mjs` | 21 | 1 | 0 | 1 |
| `hani-office-props.test.mjs` | 11 | 0 | 0 | 0 |
| `hani-office-release-projection.test.mjs` | 2 | 0 | 0 | 0 |
| `hani-office-residents.test.mjs` | 49 | 0 | 0 | 0 |
| `hani-office-seats-215.test.mjs` | 12 | 0 | 0 | 0 |
| `hani-office-snack.test.mjs` | 26 | 0 | 0 | 0 |
| `hani-office-staff-chat.test.mjs` | 17 | 0 | 0 | 0 |
| `hani-office-tap-lines.test.mjs` | 15 | 0 | 0 | 0 |
| `hani-office-tlayout.test.mjs` | 13 | 0 | 0 | 0 |
| `hani-office-top-labels.test.mjs` | 7 | 0 | 0 | 0 |
| `hani-office-v2-215.test.mjs` | 17 | 1 | 2 | 1 |
| `hani-office-visitors-cafe.test.mjs` | 5 | 0 | 0 | 0 |
| `hani-office-xmas-269-pins.test.mjs` | 1 | 1 | 0 | 1 |
| `hani-office-xmas.test.mjs` | 12 | 1 | 0 | 1 |
| `hani-office-zoom.test.mjs` | 12 | 0 | 1 | 0 |
