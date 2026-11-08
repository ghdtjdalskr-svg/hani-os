# M9 시험 기준 갱신 · 2026-11-08 KST

- 담당: Codex 단독 / 시험 기준 갱신·지정 검사 완료, 전체 사무실 PASS 아님·Git 차단으로 미커밋. `hani/m9-stage2-link`, 시작·종료 HEAD `33dc1d9038f34ac1b05d81859da7cdb879aaa7e1`, 저장된 origin/main `43eda9e2e3f69115c3569f585506904965c26c18`(v2.9.281).
- 승인: `../m9-rebase281-task.md` 전체 UTF-8 정상 확인. 시험 기준·fixture·근거만 수정, 새 commit 시도. runtime 바이트·gate/resolver·버전·push/merge 변경 금지.
- 범위: M9 3종 시험 source/fixture, originals/preservation pin. 기존 미커밋 archive 산출물과 untracked 파일은 보존.
- CODEMAP: living-office owner 확인. M9 시험·archive/organization 전용 anchor는 CODEMAP_MISS, 실제 시험과 source/fixture로 조사.
- 기준 확인: 표시 `HANI_DISPLAY_VERSION=2.9.281`, 최신 UI 참조 `hani-ui-v02992.js?v=2.9.281`. 원격 `ls-remote`는 GitHub 연결 실패, 최신성·Production 로딩 미확인. merge/rebase 없음.
- Notion: 현황판 읽기 성공. 착수 기록 저장은 자동 승인 검토에서 `MCP tool call requires approval, but approval policy is never`로 거절되어 갱신 대기.

## 변경과 근거

해시는 SHA-256 앞 12자리이며 전체값은 [baseline-changes.json](baseline-changes.json)에 보존했다. 기존 authored 치환 문자열·순서·함수·assertion은 그대로이며, 검사 완화·삭제는 없다.

| 시험 기준 | 이전 → 281 기준 | 이유 |
|---|---|---|
| originals + link preservation의 `hani-main.js` | `c0ae237d62e2` → `dc6179502d75` | 281 표시 버전은 main 릴리스의 변경 |
| 위 두 자료의 `index.html` | `42df58715adf` → `7026bb911aa9` | 281 표시·캐시 태그는 main 릴리스의 변경 |
| seoyun inverse의 office before / after | `6085c14f506f` / `880f8bef93ea` → `a80a18f69d06` / `8d2db0792144` | 친밀도 v2·마스코트 이름표를 유지하며 기존 M9 대사만 역변환 |
| seoyun / link / polish fixture 기준 SHA | `f1a457f` / `2bc9368` / `4bdfa54` → `43eda9e` | 각 논리적 pre-stage를 새 main 위에서 검증. link/polish 대상 파일 before/after 바이트는 281에서 바뀌지 않아 기존 해시 유지 |
| originals pin | `e017475524a5` → `333d76dd8009` | 위 main/index 해시 2개만 변경 |
| seoyun / link / polish fixture pin | `67daf458f753` / `4e9e013fbdf8` / `9d7a4fbf35c9` → `e38aaf1d180f` / `abecd6ea49bc` / `0f824124bbda` | 새 기준을 포함한 JSON 전체를 계속 exact pin으로 고정 |

281 office 입력은 main `43eda9e`와 바이트 동일하다. M9 역변환 후에도 친밀도 owner·마스코트 5종 자료·following label 갱신 경로가 보존된다([근거](released-281-preservation.json)).

## 검증

환경: Windows PowerShell / Node v24.20.0. 아래 `P`는 `--require ./scripts/hani-m9-polish-preload.cjs`, `L`은 `--require ./scripts/hani-m9-link-preload.cjs`이다. 모든 node:test 실행에 `--test --test-isolation=none`을 사용했다.

| 명령 (`node` 뒤 인수) | 결과 / 근거 |
|---|---|
| `P ... scripts/hani-m9-link.test.mjs` | 9 PASS / 알려진 package 포함 1 FAIL · `link.log` |
| `P L ... scripts/hani-seoyun-m9.test.mjs` | 15/15 PASS · `seoyun.log` |
| `... scripts/hani-m9-polish.test.mjs` | 2/2 PASS 유지 · `polish.log` |
| `P L scripts/hani-character-archive.test.cjs` | 단위 PASS · `archive-unit.log` |
| `P L scripts/hani-history-226.test.mjs --unit-only` | 실제 organization hub 단위 PASS · `organization-unit.log` |
| `P L ... --test-timeout=30000 --test-reporter=tap scripts/hani-office-*.test.mjs` (파일별 순차) | 67파일·666검사: 566 PASS / 97 FAIL / 3 SKIP / cancelled 0 · [파일별 결과](office-summary.json), `office-logs/` |
| 변경 CJS3/MJS1 및 검증 도구2 `node --check`, `git -c core.whitespace=cr-at-eol diff --check` | PASS |
| 최종 raw bytes → Git blob 비교, authored 치환·함수·assertion 보존 검사 | 런타임 513/513 HEAD `33dc1d9`와 바이트 동일, 시작 상태와도 동일 · [근거](runtime-integrity.json) |

**Office 실패:** Git subprocess EPERM 23건(219 포함)과 그 외 74건. 메시지 기준 고정 바이트/기준 불일치 59건, 기타 assertion 15건이다. 대표 원인은 278 레이어의 옛 해시 기대(`879d9c27…` vs 281을 보존한 `a80a18f6…`), 친밀도 v1 payload/하루 무제한 탭 기대, 이름표 layout read 수, 보리 수면·속도, pet bubble 기존 기대다. 원래 HEAD의 M9 inverse도 같은 281 runtime을 거부함을 별도 확인했다. 그러나 나머지 실패를 모두 변경 전 상태에서 개별 재실행하지는 않았으므로 전부 기존 실패라고 확정하지 않는다. 219의 원래 assertion은 Git 차단으로 재확인 불가. office assertion·278/Bori 레이어·runtime은 요청 범위 밖이므로 변경하지 않았다.

시험이 갱신한 기존 JSON 5개는 이 폴더 `generated/`에 새 결과를 보존한 뒤 세션 시작 바이트로 복원했다([복원 근거](artifact-restoration.json)). 시작 시 이미 수정돼 있던 `artifacts/character-archive/integration-qa.json`과 다른 기존 untracked 산출물은 보존했다.

**Package 실패 유지:** resolver closure 161개/missing 0이지만 목록·호외 JSON·그림 2개는 수집 밖이다. `#464`(`70c5d5d`)가 목록/호외 JSON을 선반영했고 그림은 `#463`(`2bc9368`)에 선반영되어, 281 main에는 네 파일이 모두 존재하며 현재 바이트도 일치한다([Git blob 근거](main-seeded-files.txt), [바이트 근거](runtime-integrity.json)). 이는 resolver/package 포함 PASS를 뜻하지 않는다. gate/resolver/builder/서버 변경 없음.

## 다음 담당에게

- 변경 범위: 시험 source3·fixture3·seoyun test pin/주석·originals·link preservation 기준과 이 폴더의 증거. 기존 미커밋 archive 산출물·다른 담당 파일 보존.
- 데이터·저장소·Cloud/schema·DOM/event/runtime 영향 없음. 버전 증가·Build·Candidate/One-Pass/HINA·새 Preview·main/Pages/Production read-back은 시험 전용 작업이므로 N/A/미실행. 배포 완료 보고 아님.
- **Git 차단:** 지정 시험 파일의 `git add`가 공용 Git 디렉터리 `.git/worktrees/m9-link/index.lock: Permission denied`로 실패(exit 128, `git-add.log`). staged 변경·새 commit 없음. 사용자 지시의 “막히면 미커밋 보고”를 적용하며 push/merge/버전 변경 없음.
- 다음 행동: Git 쓰기가 가능한 담당이 이 시험 변경을 commit하고, 별도 범위에서 281 사무실 고정 기준과 나머지 실패를 조사한다. 배포 담당은 #464 선반영과 resolver 한계를 구분해 패키징을 판단해야 한다. PR/새 Preview 없음. 커밋을 위해 권한 우회·다른 worktree 수정은 하지 않음.
- Notion 갱신 대기: M9 기준은 281로 갱신, 전용 시험·단위 결과와 office 실패·미커밋 상태는 위와 같다. 착수·종료 저장 모두 자동 승인 검토에서 `MCP tool call requires approval, but approval policy is never`로 거절되어 미반영. 저장/read-back 완료 아님. CURRENT/DECISIONS의 타 담당·과거 기록 변경 없음.
