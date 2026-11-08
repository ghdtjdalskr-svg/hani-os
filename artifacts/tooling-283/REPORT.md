# 2.9.283 시험 기준 갱신

2026-11-08 KST · Codex · `hani/tooling-283` · 지정/로컬 origin/main `a28918df50ba5fef3e7dab498eaa5eec4a27a103`. Git 실행·commit/push/merge·버전 변경 없음. 원격 최신성 새 조회 없음. 서윤의 기존 미커밋 작업 보존.

## 바꾼 기준과 이유

| 시험 기준 | 처리·이유 |
|---|---|
| 283 버전 | 최외곽 exact inverse 추가. index 60개·main 1개 `2.9.283→2.9.282` 토큰과 파일 전후 전체 SHA256 검사. index `15226a2f→93f4ad56`, main `636a4ac9→4cab375b`. 누락·중복·부분·드리프트·재역변환 거절 시험 추가. |
| 생활 묶음 / study pin | 기존 fixture·고정 해시 유지. 283 → dev-report → wishlist → procrastination → study-retry 순서. 원문 reader를 legacy preload 전에 확보하여 feature 시험이 이미 투영된 바이트를 다시 역변환하지 않게 함. |
| M9 originals·preservation pin | 기존 index `2fe92354…` / main `ef067e9f…`와 originals JSON pin 유지. polish preload가 위 exact outer chain을 먼저 설치하고 polish → link → mascot-label/affinity-cap을 기존 순서대로 연결. 런타임 nav/view/script/catalog 변경을 M9 변경으로 오인하지 않음. 기존 161 closure assertion 유지, raw 추가분은 별도 검사. |
| 독립 하위 기준 | 새 main의 merge-base는 이미 생활 묶음이므로 과거 inverse와 같을 수 없음. `../rel282` 원문 main/index/study/UI 4개를 기존 pin과 대조 후 압축 fixture로 고정(전체 gzip SHA256·개별 원문 SHA256 검사). 전용 시험은 Git/외부 baseline 환경변수 없이 동일 전체 equality 유지. nav는 기존 baseline 환경변수로 rel282 사용. 이번 원격 Git export가 아님. |
| kids-visit / staff-chat raw 보존 | 이미 283으로 갱신된 공통 baseline 복사본과 비교하므로 index/main·closure는 raw reader 사용. CSS 역변환·전체 바이트 equality·기존 closure assertion 유지. |

수정 owner: `scripts/hani-release-283-source.cjs`·`fixtures/life-bundle-baseline-282.json.gz` 신규, `hani-life-bundle-source.mjs/source.test.mjs`, `hani-dev-report-generate.test.mjs`, `hani-procrastination-board.test.mjs`, `hani-m9-polish-preload.cjs`, `hani-seoyun-m9.test.mjs`(설명), `hani-office-kids-visit.test.mjs`·`hani-office-staff-chat.test.mjs`. assertion 삭제·완화 0, 기존 frozen fixture/pin 변경 0.

## 시험 결과

| 시험 | 결과 | 통과/전체 |
|---|---|---:|
| life-bundle-source | PASS | 5/5 |
| study-retry | PASS | 26/26 |
| procrastination-board | PASS | 6/6 |
| wishlist-quick-add | PASS | 7/7 |
| dev-report-generate | PASS | 1/1 |
| seoyun-m9 | PASS | 15/15 |
| m9-link | 기능 PASS / 기존 packaging FAIL | 9/10 |
| m9-polish | PASS | 2/2 |
| nav / navlogin / dashboard 정적 | PASS | 3/3 파일 |
| navlogin / navigation-state / dashboard Edge UI | PASS · PC/390 | 3/3 파일 |
| character-archive UI · 지정 Edge | PASS · 1440/390 카드·상세·포커스·넘침·저장0·외부요청0 | 1/1 파일 |
| office 전체 | 69/69 파일 실행 · 41 성공 / 28 Git 차단 파일 | 745 통과 / 35 차단 / 3 skip |
| 변경 시험 파일 syntax | PASS | 9/9 |

dev-report는 Node 파일 1개 안의 **10그룹** 전부 통과. m9-link 10번 기존 packaging 실패는 유지. office 기타 실패 0파일. 219는 Git 차단이 먼저 발생하여 기존 실패 원인 재현 미검증. [Git 차단 파일별 목록](GIT-BLOCKED.md).

명령/환경: `NODE_PATH=%USERPROFILE%/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`, Node 24.22.1. `NODE_OPTIONS=--require ./artifacts/life-bundle/no-git-283.cjs`로 Git을 실행 전에 차단. Edge `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`. `run-tests.mjs features|m9|nav|ui|office`가 파일별 실제 명령·전체 로그·결과 JSON 저장. 개발용 시험만 실행, package/build/One-Pass/HINA/배포 N/A.

## 보존·인계

- 런타임 **497파일 origin/main 바이트 동일**: 로컬 origin/main commit/tree의 검증된 object ID에 실제 파일 blob 및 assets/data 전체 tree를 대조, 차이0·착수 대비 변화0. Git 실행 없음. `runtime-origin-main.json`·`runtime-files.json` 근거. 저장 키·내부 버전·Cloud·schema 변경0.
- raw closure **168·누락0**, 하위 projection **161·누락0**. 차이7 = 미룬 일 CSS/JS 2개 + 참조 이미지5개. 기존 packaging 수집 한계는 해결 범위 밖, PASS로 바꾸지 않음.
- 지정 및 관련 JSON 16개 원문 SHA256 복원·확인, 새 PNG 24개 제거. 새 기타 artifacts 0개 목록은 `artifact-cleanup.json`. 결과 JSON 원문은 별도 generated 아래 보관.
- Notion 현황판 읽기 성공. 추가 쓰기는 자동 승인 검토가 `approval policy is never`로 거절하여 미반영·read-back 없음. 이 결과 요약 갱신 대기.
- 다음: **서윤이 diff 검토·커밋하고 Git 차단 파일 재실행**. push/merge/버전/배포 없음. 승인 요청 단계 아님.
