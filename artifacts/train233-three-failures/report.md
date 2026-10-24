# train233 잔여 3개 실패 후속

기준: `hani/train233-verify`, 시작·종료 HEAD `f27be17c1b3ea989fec3b4886f36b3b32c4caa27`. **최소 CSS 수정·Node 검증 완료, 미커밋, 수정 후 Edge 미검증.** 기존 9종 browser PASS는 수정 전 f27be17의 과거 결과이며 이번 수정 후 PASS로 재사용하지 않는다.

## 분류와 수정

| 실패 | 분류 | 원인·최소 조치 | 실제 확인한 근거 |
|---|---|---|---|
| QA 1차 `390/porcelain-cream/ledger` 대비 1.028 | B: 기존 QA CSS 결함 | `hani-design-system.css`의 기존 ledger 색상 선언 3개에서 밝은 고정값을 `var(--appearance-ink,#273349)`로 교체. JISPI 제목·금액·지원 KPI·메타·보드 제목이 Finish ink를 사용. 새 override layer나 테마 전체 재작성 없음 | 688c6a4 QA 규칙과 style01/08, Finish token 경로 확인. 이전에는 certificate Remote 겹침에서 먼저 중단되어 ledger에 도달하지 못했음. 수정 후 실제 대비·390/1440·cream/black 확인은 대기 |
| Remote `390/reading/midnight-black` theme delta124 | B: 헤더로 옮긴 카드에 legacy 제목 장식 적용 | QA 1차의 기존 `placeMobileTrigger`가 같은 panel을 `header.top` 안으로 이동. `.top h2:after`의 42×4px·`var(--primary)` 장식이 Remote 제목에도 적용됨. `hani-context-remote.css`의 기존 media 제목 owner 옆에서 `h2::after{content:none}`으로 차단 | 저장된 두 PNG를 sharp로 원래 24px interior·delta1 기준 분석: 초과124픽셀, bbox x24–54/y104–107, 최대124. 제목 밑 테마 막대 위치와 일치. [픽셀 진단](pixel-diagnosis.json). **theme pixel assertion·tolerance 변경0** |
| settings / reviewed baseline의 `one pending approved connection` | A: 허용 변경 목록 누락 | f27be17의 CSS3개(header/panel flow, date40px, portfolio1열)를 고정 Git 원문으로 등록. 이번 CSS 보정2개는 원문 before/after와 full SHA-256으로 별도 한정. 최신 보정 → f27be17 → 기존 integration/Milestones 순으로 정확히 역변환 | Milestones CSS의 실제 훼손이 아니라 날짜 선언이 QA fragment 안에서 바뀌어 전체 anchor 불일치. 기존 7d0fa05 integration identity, release225 및 이후 승인 Git chain 유지. 상관없는 CSS/JS·저장 호출·EOL·누락/중복/이동 변조는 계속 거절 |

운영 변경은 CSS2개 +3/-3 및 +2줄이다. tooling은 `scripts/fixtures/train233-integrations.json`, `scripts/hani-reviewed-release-baseline.mjs`, 해당 `.test.mjs` 3개만 수정했다. portfolio CSS는 이번에 수정하지 않고 f27be17 변경을 등록만 했다. [diff](patch.diff), [파일 SHA·EOL 감사](audit.json).

## 검증

Git subprocess는 `spawnSync git EPERM`으로 직접 실행 차단됐다. 이를 PASS로 표시하지 않는다. 허용된 shell의 `git archive`로 고정 ref 25개에서 원문을 추출하고 `git ls-tree`의 blob ID와 122개 파일 바이트를 대조했다. 별도 test-only [입력 adapter](git-snapshot-loader.mjs)는 이 고정 Git 입력만 공급하며 원래 테스트 본문과 assertion을 실행한다. 예상하지 못한 명령/ref는 거절한다. 앱 코드·정규 Git oracle reader에 환경 우회 기능을 추가하지 않았다. [ref/commit/blob/SHA256 목록](snapshot-manifest.json).

| 명령·검증 | 결과·실행 방식 |
|---|---|
| `node --test --test-isolation=none scripts/hani-qa-1st.test.cjs` | **10/10 PASS**, 직접 실행. [로그](qa-node.log) |
| `node --import ./artifacts/train233-three-failures/git-snapshot-loader.mjs --test --test-isolation=none scripts/hani-reviewed-release-baseline.test.mjs` | **11/11 PASS**, 검증된 Git 추출 원문 adapter 사용. 정확한 양방향 delta, 전체 원문, 누락/변조/중복/이동/EOL 변조 검출 포함. [로그](reviewed-snapshot.log) |
| 위 adapter + `--test --test-isolation=none scripts/hani-ocr-accuracy-224.test.mjs` | **14/14 PASS**, 실제 OCR/Cloud 호출 없음. [로그](ocr-snapshot.log) |
| 위 adapter + `scripts/hani-settings-225.test.mjs --static` | **PASS(Node only)**: exact UI delta, 상태 projection/write0, 127 source ID/109 planned ID·기존 control/notice. **browser phase 미실행**. [로그](settings-static-snapshot.log) |
| `node scripts/hani-qa-1st-safety.mjs artifacts/train233-three-failures/safety-base` | **PASS**, raw f27be17 10파일 기준. runtime JS7 syntax, canonical save/commit/freshState/normalizeState, 저장·Cloud 호출, 표시/cache 불변. runtime graph68·기존 중복8 보존, 16,892 unchanged line/EOL 보존. [결과](safety-results.json) |
| `node scripts/hani-remote-media-219.test.mjs --node-only` | **PASS(Node only)**: palette·persistent slot25·write0·217 portrait 선택. 실제 AA/cover/overflow/action/browser 검사는 미실행. [로그](remote-node.log) |
| `node --check` 수정한 baseline helper·test | **PASS** |
| `node artifacts/train233-three-failures/audit.mjs` | **PASS**: 수정5파일의 unchanged 2,539줄 byte/EOL, main/index/Remote runtime JS 바이트 불변. [결과](audit.json) |
| `git -c core.whitespace=cr-at-eol diff --check` | **PASS** |
| Edge·Preview·새 PNG | **미실행 / 0장**. 기존 EPERM 환경의 재시도·다른 프로필·브라우저·CDP 우회 없음 |

## 남은 검증·인계

- 같은 diff를 Edge 허용 환경에서 `hani-qa-1st-ui.test.mjs`, `hani-remote-media-219.test.mjs`, `hani-remote-card-224.test.mjs`, `hani-context-remote-ui.test.mjs`로 확인. ledger cream/black ×390/1440 실제 대비·금액·겹침, Remote theme pixel identity·action·scroll·AA 확인 필요. 기존 assertion 유지.
- settings도 `--static` 없이 browser 단계 확인 필요. Node PASS가 세 browser 실패 전체 해소를 뜻하지 않는다. 다음 화면 실패가 발견되면 실제 결과로 후속 판단한다.
- 데이터/Cloud/storage/hani_os_life_v23/runtime JS/표시버전/cache `?v=`/내부 baseline 변경0. Full build/Candidate/HINA/Production은 요청 범위 밖으로 미실행. 원격 main 조회 연결 실패, 로컬 origin/main `a1e97d7`만 확인. 자동 merge/rebase 없음.
- Git: `git -c core.autocrlf=false add -- hani-design-system.css hani-context-remote.css` **1회 실패**. `.git/worktrees/t233/index.lock: Permission denied`. 재시도·직접 index 조작·다른 worktree 쓰기 없음. add 실패로 commit 미실행, HEAD f27be17 유지. 요청된 commit은 미완료이며 권한 가능한 환경의 담당자가 변경5파일·이 보고서·인수인계를 commit해야 한다. 원문 export용 tar/snapshot 디렉터리를 commit 대상으로 일괄 추가하지 않는다.
- push/PR/main merge/배포/Notion 작업0. Notion은 이번 대표님 명시 금지로 미갱신. CURRENT/DECISIONS와 타 담당·과거 기록 보존.
