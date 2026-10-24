# train233 승인 통합 수정 후속 검증 · 2026-10-24 KST

**최종 요청 범위 97개 명령 PASS, 남은 FAIL 0.** 도연(Codex) 단일 Agent 검증이며 독립 HINA·Release Candidate 검증이 아니다. HEAD `7d0fa05e873d09bb7b7eb070bea7c8271a6cfa5c`, branch `hani/train233-verify`, worktree `t233`.

## 수정 파일

- `scripts/fixtures/train233-integrations.json`: 범위를 `b5a64e5 → 7d0fa05`로 갱신. 기존 13 owner/54 hunk 안에 승인된 `f2df938` number fallback·`7471e5a` sign-only guard만 반영. 두 승인 commit의 전체 SHA를 명시. `b1f7a48` main seed 병합은 기존 milestones blob과 동일하여 별도 runtime delta가 없다.
- `scripts/hani-reviewed-release-baseline.mjs` / `.test.mjs`: 고정 후보 identity·승인 목록 갱신, 두 commit이 각 한 줄만 바꿨음을 native Git 원본으로 확인. 원본 전체 forward/reverse byte, immutable 225→232 chain, 위치·중복·무단 변경·EOL·보호 control 검사를 유지하고 두 줄에 대한 삭제/되돌림/변조/중복/이동/EOL 부정 검사를 추가.
- `scripts/hani-ocr-accuracy-224.test.mjs`: 승인 fragment 역정규화 설명과 실제 raw runtime 숫자 입력 회귀 추가. `$221.97`, `(-11.72%)`, `A360750`, `1,350억` 및 부호 전용/잘못된 한국어 단위를 검사한다. 보호 함수 frozen hash·write 목록·Vision 밖 원본 검사는 그대로 유지.
- 이 폴더의 실행/결과/fixture 출처 기록과 [작업 인수인계](../../docs/development-history/handoffs/2026-10-24-train233-verify-followup.md).

## 테스트 결과

| 테스트 | 최종 결과 |
|---|---|
| hani-reviewed-release-baseline.test.mjs | 10/10 PASS |
| hani-ocr-accuracy-224.test.mjs | 14/14 PASS |
| hani-toss-intake-224.test.mjs | 10/10 PASS |
| hani-asset-intake-v2-AB.test.mjs | 9/9 PASS |
| hani-asset-intake-v2-C.test.mjs | 13/13 PASS |
| hani-asset-intake-v2-ease.test.mjs | 6/6 PASS |
| hani-kiwoom-code-224.test.mjs | 10/10 PASS |
| hani-hana-intake-224.test.mjs | 15/15 PASS |
| hani-asset-update-smoke.js | PASS |
| hani-qa-1st.test.cjs | 10/10 PASS |
| hani-qa-1st-safety.mjs | PASS |
| hani-milestones-v1.test.mjs | Node 14 PASS |
| 이전 PASS 중 영향 테스트의 나머지 85개 | 85/85 CLI PASS |

이전 PASS 151개 중 소유 파일 직접 읽기·상대 import/require 의존 경로·index runtime graph를 따라 **95개**를 선택했다. 지정 Toss(이전 FAIL) 1개와 QA safety 1개를 더해 중복 제외 **97개**다. [선택 근거](selection.json), [97행 결과표](tests.md), [명령·횟수·최종 결과](results.json), [실행 목록](inventory.json). 브라우저용 assertion skip은 Node 통과 수와 구분해 기록한다.

QA safety는 native Git `1cdf07f`의 원본 runtime graph **68파일**을 새로 export하고, `1cdf07f → 7d0fa05`의 `--ignore-space-at-eol --unified=0` diff로 기존 검사에 공급했다. Canonical save/commit/freshState/normalizeState·stored-record n·storage/Cloud 호출·버전/cache·보호 키 유지, 비변경 **16,656줄 원문/EOL 유지**, duplicate graph 68/68·기존 중복 8 유지 PASS. [결과](qa-safety-results.json), [export 계획](snapshot-plan.json).

초기 building safety 1건은 원본 기준 디렉터리 인자 누락으로 실패했다. `4ac6b6c...` release232의 8파일을 native export하여 원래 assertions 그대로 재실행 PASS. 새 OCR 표본의 한글이 PowerShell stdin 인코딩으로 깨진 초기 실패는 Unicode escape로 바로잡아 최종 14/14 PASS. 새 test 줄은 원본 LF 관례에 맞춰 exact/OCR 재실행 PASS. 최종 source syntax·diff check·수정 검사 파일 비변경 **548줄** EOL 결과는 [integrity.json](integrity.json)에 기록한다.

실행 명령(저장소 루트, PowerShell):

```powershell
node artifacts/train233-verify-followup/select-tests.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File artifacts/train233-verify-followup/export-snapshots.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File artifacts/train233-verify-followup/run.ps1 -Phase logs -Targets candidate
$env:HANI_VERIFY_CACHE=Join-Path $PWD 'artifacts/train233-verify-followup/git-cache'
$env:HANI_VERIFY_NO_BROWSER='1'
node --require ./artifacts/train233-verify-followup/git-read-cache.cjs scripts/hani-qa-1st-safety.mjs artifacts/train233-verify-followup/exports/pre-qa
```

전체 97개 명령은 native Git 실제 binary/exit/cwd/argv export adapter로 실행했다. 역사 원본을 현재 소스로 대체하지 않는다. cache와 긴 로그는 이 폴더의 git 제외 경로에 남겼고 최종 결과 JSON/표는 추적 대상이다.

실제 브라우저 프로세스·화면 검사·PNG 생성은 **0**. 초기 staff-floors의 자동 browser 분기가 pre-spawn 차단 가드에 도달해 skip된 사실은 숨기지 않으며, 이후 기존 `--static`으로 재실행해 browser import/launch 전 skip 및 Node 10 PASS를 확인했다. 나머지 선택형 browser 분기도 미실행. 이전 공통 FAIL 3개(newface217/protected-gate-integration/study-news-material)는 이번 지정/이전 PASS 영향 범위 밖이므로 재실행·수정하지 않았다.

## preview-fixture 출처

Git 파일/생성 스크립트가 아닌 **로컬 미추적 원본**을 찾았다: `../intake-v2/artifacts/asset-intake-v2/preview-fixture.html`, 5,305 bytes, SHA-256 `c21c46d8f45dde5b0a2a52f169da435542982e4da6f403e99640e8793ad5c7ad`. `origin/hani/asset-intake-v2`는 `3409eb1d86d839fda6ba4a2f09d63294724ecb96`이며 원격 tree에 해당 파일이 없어 파일 Git SHA는 없다. **복사 후 현재 parseKoreanNumber를 asset 모듈 앞에 주입**하는 [생성 절차](preview-fixture.md)를 제공했다. 이번 작업에서 생성/브라우저 실행은 하지 않았다.

## 경계와 인계

- Runtime `hani-*.js/css`·`index.html` 수정 0. 표시/cache `2.9.232`, 최신 외부 script `hani-launch-greeting.js` 유지. 저장·Cloud·schema·main·배포 변경 없음.
- 원격 Git 연결 실패로 최신성 미확인; 로컬 origin/main `a1e97d7`, 열차 ref와 HEAD 동일. 자동 merge/rebase 없음.
- Build·One-Pass·HINA·Preview·main merge·Pages·Production read-back은 이번 범위 밖. 배포 담당 서윤이 browser/정식 후보 경계를 수행한다.
- Git: `git -c core.autocrlf=false add` 1회가 `.git/worktrees/t233/index.lock: Permission denied`로 실패. commit은 실행하지 않았고 재시도/우회/push 없음. HEAD `7d0fa05` 유지. [변경 파일 목록](changed-files.md)을 배포 담당에게 인계한다.
- Notion fetch 성공, 착수 append는 자동 승인 검토가 `approval policy is never`로 거절. 계획/최종 결과는 Notion 미반영이며 이 보고서와 인수인계에 보존. 재승인 요청이나 우회는 하지 않았다.
