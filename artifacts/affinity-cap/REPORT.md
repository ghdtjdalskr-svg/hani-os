# 사무실 친밀도 하루 상한 인수인계

## 작업 식별
- 2026-11-08 KST / Codex / **구현·검증 종료, 미커밋(권한 차단)**
- worktree `affinity-cap`, branch `hani/affinity-daily-cap`
- base `2463e88526e585275395e3a564aaff7dfafc25c8` / 표시·캐시 `2.9.280` 유지
- 범위: 기존 `createOfficeAffinity`, 신규 시험, 고정 시험의 최외곽 exact inverse, 이 보고서.
- 승인: 과제 파일의 직원별 KST 하루 2점 및 `hani_office_affinity_v1` v2 전환. 다른 키·Cloud·push·merge·버전 변경 금지.

- 운영 변경은 `hani-office-live.js:createOfficeAffinity` 내부만. v1 점수 보존 후 다음 dirty flush에 v2 저장, KST 자정·자정 후 최초 읽기 처리, 하루 2점 제한, 첫 초과 탭 안내 후 기존 대사·비밀 대사 복귀. 레벨 5/15/35/70 유지.
- flush 직전 counts/max·같은 날짜 today/max 병합 및 형식 재검사. 형식 이상·접근/저장 실패 시 경고 1회와 메모리 전용, 기존 저장값 덮어쓰기 금지. 새 런타임 파일·DOM slot·timer·listener 없음.
- 신규 cap 시험/고정 delta/inverse, 기존 affinity/storage/서윤 시험 입력 연결. cap → seoyun M9 → bori → homes → 278 최외곽 체인으로 기존 assertion을 그대로 유지.

## 결과와 증거
- CODEMAP_MISS: living-office owner는 있으나 affinity anchor/targeted test 없음. 실제 owner·tap·단일 bubble·기존 flush 경로 확인.
- 원격 main 조회: 네트워크 연결 실패. 시작 시 로컬 origin/main=HEAD=base. 종료 시 공유 origin/main은 `2bc93683182728877a6b8e543badb330a3312756`로 1커밋 진행(#463): 런타임 미참조 이미지 `assets/character-archive/seoyun-m9-special-cut.webp`, `assets/hani-ilbo/extra-m9-comic.webp` 추가만. 친밀도/기존 runtime/버전 영향 없음. 자동 merge/rebase 없이 base `2463e88` 유지. 로컬 main index 최신 UI `hani-ui-v02992.js?v=2.9.280` 확인, 운영 화면·실제 JS 로딩 미검증.
- Notion 시작 기록: 읽기 성공, append는 도구 자동 승인 검토의 `approval policy is never`로 거절되어 미반영.
- Git 커밋 차단: `git add -- hani-office-live.js`가 공용 저장소 `.git/worktrees/affinity-cap/index.lock` 생성 권한 거부로 실패. 스테이징·커밋 없음. 과제의 “막히면 미커밋 보고” 적용, 권한 우회하지 않음.
- 안전: 실제 사용자 저장소 무접촉. 가상 저장소에서 점수/기존 원문 보존·다른 키 무쓰기·오류 시 덮어쓰기 금지 PASS. owner 밖 모든 base 바이트/EOL 보존을 hash inverse로 검증. 운영 JS SHA-256 `e668ac0c6ac8104f1c3c5619c1778f48f8fd470cb228549328ca67ba06120492`.
- Windows PowerShell / Node v24.20.0. `run-targeted.ps1` → `finish-validation.ps1` 실행. Node→Git spawn EPERM은 고정 blob 읽기 전용 export와 SHA-1 검증 adapter로 대응.
- affinity grep 관련 + 오피스 전체 + helper-bot + fun-chat + 서윤 **74파일 중 73 PASS**([결과](results-final.json)). 입력 누락이었던 cafe-rest/obr21/obr6는 보완 후 재실행 PASS.
- 유일한 기존 실패: `hani-office-219.test.mjs:50`의 `.hani-office-name AA text contrast` 고정 CSS 리터럴 검사. **수정 전 base 런타임에서도 동일 실패**([근거](base-219.log)). CSS 원문·검사 assertion 유지.
- 최종 친밀도 통합 **37/37 PASS**([로그](final-affinity.log)): v1 여러 id/9999 보존, 상한/KST 자정/안내 1회, malformed 무덮어쓰기, 양방향 두 인스턴스 flush, 단일 키/다른 키 무쓰기, PC1280/폰390×일반/감소 모션의 실제 owner·단일 말풍선·float·펫/양쪽 바리스타 경로. JS syntax 8파일·`git diff --check` PASS.
- cafe-rest/lively-v2를 다른 시험과 겹치지 않게 각각 **단독 3회 PASS**. 기존 cold best-of-3 <400ms, warm <3ms 기준 유지([수치](metrics.json)).

| 회차 | cafe 부재/재실 cold best(ms) | lively cold best(ms) | lively warm(ms) |
|---|---:|---:|---:|
| 1 | 291.28 / 347.70 | 298.95 | 0.722 |
| 2 | 282.81 / 329.22 | 316.15 | 0.680 |
| 3 | 297.97 / 331.42 | 290.15 | 0.664 |

- 미검증: 실제 브라우저 시각 결과·실제 다중 창 경합·Production read-back. Candidate build/One-Pass/HINA는 기능 패치 범위에서 미실행. v2 적용 후 v1 코드로 단순 복귀하면 메모리 전용이 되므로 저장값 복구는 별도 승인 필요.

## 다음 담당에게
- 쓰기 가능한 Git 환경에서 이 diff와 보고서를 확인해 승인 범위만 로컬 커밋. 원격 최신성·기존 CSS 검사 실패 확인 후 배포 담당의 별도 Candidate 절차로 인계. 이번 과제의 push·merge 금지는 유지. 서버 배포·설정 변경 없음.
- Notion 갱신 대기: 승인 범위·구현·73/74 및 기존 실패·성능 3회 PASS·미커밋 차단·다음 행동. 자동 승인 정책 거절로 미반영이며 연결/갱신 완료로 보고하지 않음.
- 임시 export 정리도 자동 승인 검토에서 `blocked by policy`로 거절되어 보존: `artifacts/office-behavior/{git-baseline,lively-baseline,obr13-git,safety-baseline}/`는 이번 시험이 생성한 미추적 Git 원본 사본이며 변경 commit 대상이 아님. 시험이 갱신한 기존 추적 산출물 4개는 증거를 이 폴더에 복사 후 base 원문으로 복원함.
