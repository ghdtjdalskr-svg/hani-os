# obr5 A — 2.9.233 열차 출발 준비

2026-10-23 KST / 도연(Codex), 배포·브라우저 담당 서윤.

## 식별과 승인 범위

- worktree `obr`, branch `hani/release-train-20261023`, 시작·유지 HEAD `fe7ac5e5db07bc5cd06058658cd8b84b07918089`.
- 기준 main `7a10595f2a0890e63cd04dbc95c057edbbd3d5b0`. 셸 원격 조회는 프록시 연결 실패였으나 GitHub 연결 도구의 `main` commit 조회로 같은 SHA를 확인했다. merge/rebase 없음.
- 사용자 obr5 명세에 따른 승인 기록·검사·로컬 증거만 변경. 버전·cache·HANI_DISPLAY_VERSION는 2.9.232 그대로다. push/PR/Notion/브라우저 실행 없음.
- 실제 Production 표시·JS 로딩·기능 read-back은 미실행. 로컬 index 마지막 script는 `./hani-launch-greeting.js`다.

## 바꾼 파일

| 파일 | 변경 이유 |
|---|---|
| `scripts/hani-reviewed-release-baseline.mjs` | 232의 확정 Git SHA `4ac6b6c0119eeacc7332f1c53c3c760675657c11`와 지정 6개 owner를 approvedReleases에 등록. trainBaseVersion 232. 이미 출고된 join pending 은퇴 |
| `scripts/fixtures/office-redesign-233.json` | main 대비 실제 runtime 3파일의 before/after를 immutable fixture로 고정. live JS 14개 hunk, 행동 JSON 각 1개 exact fragment |
| `scripts/hani-reviewed-release-baseline.test.mjs` | 232→233 버전 투영 기대값과 pending owner 3개를 갱신. 파일 처음/전체를 차지하는 fragment도 실제 이동·외부 byte 추가 부정검사가 되도록 조정 |
| `artifacts/office-behavior/report-obr5.md` | 본 결과 |
| `docs/development-history/handoffs/2026-10-23-office-obr5-codex.md` | 작업 식별·승인 경계·인수인계 |

pending 파일은 `hani-office-live.js`, `assets/data/office-actions-216.json`, `assets/data/office-actions-221.json`만이다. `git diff --name-only origin/main`에서 개발 증거·scripts·docs·root data를 제외한 런타임 목록과 일치한다. `data/` 시드는 pending runtime 목록에 넣지 않았다.

Git oracle는 정규화하지 않는다. current의 정확한 fragment가 각각 1회 있을 때만 복원한다. 누락·중복·변형·이동·미승인 코드·Storage·EOL 변경 거부 검사는 유지했다. 현재 HEAD나 merge-base 자체를 기대 소스로 사용하지 않았다.

## 검증

| 검사 | 최종 결과 | 증거 |
|---|---|---|
| `node --test --test-isolation=none scripts/hani-reviewed-release-baseline.test.mjs` | 8 PASS / 0 FAIL | `obr5-baseline-tests-final.txt` |
| `powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1` | 120개 / 117 PASS / 0 FAIL / 브라우저 3 SKIP, 161.90초 | `obr5-all-tests-final.txt` |
| `node docs/drafts/office-behavior-redesign/audit.mjs .` | 54,000 snapshot; frozen/mismatch/stuckSeconds/near30/near24 = 0/0/0/0/0; 공유 engine6 PASS | `obr5-audit.txt` |
| frozen Git 원문 검증 | 78/78 export가 `git rev-parse ref:file`와 `git hash-object --no-filters export` 객체 ID 동일 | `obr5-git-object-verification.json` |
| 데이터3 byte 비교 | obr=seed233 모두 동일, 변경 없음 | `obr5-identity.json` |
| runtime·표시·보호 경로 | HEAD 대비 index/main/live/assets/data/root data 무변경, safety·event·renderer 회귀 통과 | 전체 회귀·Git diff |
| diff/syntax | 관련 Node 실행 파싱 및 `git diff --check` PASS | 로컬 검사 |

이 환경의 Node→Git spawn은 EPERM이다. 셸에서 immutable Git blob을 byte 그대로 export하고, 로컬 `obr5-git-preload.cjs`가 `git show ref:file` 요청에 그 파일만 반환했다. preload는 SHA-256 무결성을 확인하고, 미등록 Git 요청은 실패한다. 운영 소스·테스트 helper의 oracle 경로를 완화하거나 바꾸지 않았다. 직접 Node→Git 통합 실행 성공과 구분되는 보조 검증이다.

재현용 로컬 보조: `obr5-export-plan.mjs`, `obr5-export-git.ps1`, `obr5-git-preload.cjs`와 `obr5-git-exports/manifest.json`. export PS 실행 후 `HANI_OBR5_GIT_EXPORTS`를 export 디렉터리로, `NODE_OPTIONS`를 `--require <obr 절대경로>/artifacts/office-behavior/obr5-git-preload.cjs`로 지정한다. 위 원래 검사 명령을 그대로 사용하며 전체 회귀의 baseline env와 OFFICE_SOFT=1은 기존 run-tests.ps1이 설정한다. 일반 Git spawn 가능 환경에서는 preload가 필요 없다.

## 데이터·운영 영향과 미검증

- 이번 A 변경은 개발도구·검사·문서뿐이다. 운영 코드/저장소/Cloud/schema/migration 변경0, 보호 localStorage write 경로 변경0. 버전 증가는 사용자 지시에 따라 N/A다.
- 감사는 실제 열차 runtime에 대해 실행했다. actual 화면·이미지 decode·1440/390 Preview·브라우저 console은 서윤 담당이며 3 SKIP을 PASS로 계산하지 않았다.
- package/One-Pass/독립 HINA/merge/Pages/Production read-back 미실행. 배포 완료가 아니다.
- 이전 obr4 인계의 관계 seed 근거 부재와 obr3 평일3인 동행 미해결 범위는 이번 승인 기록 보수로 해결했다고 주장하지 않는다. 최종 회귀에도 `trios 0` 출력은 남아 있다.

## Git·다음 담당 결정

- 지정 source 3파일을 `git add`했으나 `.git/worktrees/obr/index.lock: Permission denied`. 신규 commit 없음, HEAD 유지, 다른 기존 artifact 수정은 보존했다. 권한 우회·push·PR 없음.
- 서윤: B 시드 선행 PR/반영 여부와 실제232 화면을 확인한 뒤 열차를 출발시킨다. 최종 버전 증가는 make-release가 release branch에서만 수행한다.
- A 검사·문서 변경은 233 merge+read-back 이후 tooling PR로 인계한다. runtime release PR에 이 파일들을 섞지 않는다.
- Notion은 사용자 명시 금지로 미반영. 서버 Edge Function·설정 배포 없음.
