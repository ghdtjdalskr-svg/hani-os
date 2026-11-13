# 치비툰 시험 3단계

2026-11-08 KST · Codex · `hani/procrastination-chibitoon` · HEAD `bc49346` / 로컬 origin/main `dca9ecf`. Git 명령·원격 조회·런타임 수정·버전 변경·merge·배포 없음.

| 고친 기준 | 변경과 이유 |
|---|---|
| Legacy 원문 pin | 2단계 원문 대신 main `dca9ecf`의 보드 시험 원문을 바이트 그대로 고정. tooling-283이 바꾼 baseline import·raw reader import·closure reader 3줄을 반영. 정규화 SHA-256 `643c216fb7ca396c60f5c0f01fc05fefb16be8d213f4c9727e0411c198e3b03a`도 검사. |
| DOM 모형 | 공유 `runRenderCases` 노드에 `attributes`·`setAttribute`만 복원. raw 시험과 main의 legacy/preload 경로 모두 같은 helper를 사용. 기존 assertion 삭제·완화 없음, main helper와 추가 부분 외 원문 동일. |
| Legacy preload | 치비툰 역변환만 담당하도록 중복 283→282 변환 제거. main이 소유한 283 inverse와 raw reader를 보존. 생활 preload가 제공하는 기존 main/index 최종 바이트는 전후 완전 동일하고, raw reader를 쓰는 기능·남매 방문·직원 수다는 최종 preload로 재검증. |
| 생활 묶음 검사 명령 | main의 283 원문 역변환 검사는 preload 없이 실행해 실제 디스크 원문을 검증. 검사·pin은 그대로 유지. |

| 시험 | 결과 |
|---|---|
| pb-chibitoon | 5/5 PASS |
| procrastination-board | 6/6 PASS |
| 생활 묶음 4개: source / study / board / wishlist | 5/5 · 26/26 · 6/6 · 7/7 PASS (board는 위와 같은 실행) |
| dev-report | 10그룹 PASS |
| office 전체 | 68파일: 41성공·27파일 Git 차단. 745통과·34건 Git 차단·3skip·그 외 실패0. 219는 지시대로 제외. [차단 파일 목록](stage3/git-blocked-files.md). |
| JS syntax / assertion 보존 | 수정한 시험·helper·preload 3/3 PASS / main 원문과 비교 PASS |

명령·로그: [실행 스크립트](stage3/run-tests.ps1), [최종 집계](stage3/summary.json), [기능·office 결과](stage3/results.json). preload 변경 영향은 기능6개·남매 방문을 `-RerunAffected`로 재실행하고 직원 수다는 최종 preload로 실행. 기존 legacy 출력의 바이트 동일성도 검사. Node 기본 시험 격리는 `spawn EPERM`으로 막혀 `--test-isolation=none` 사용. Git 호출은 `stage2/no-git.cjs`가 실행 전에 차단하며, 차단을 PASS로 계산하지 않음.

런타임 500파일: 이번 작업 변경 **0**. main 대비 차이는 `hani-procrastination-board.js`·`.css` **2개뿐**, `assets/procrastination/pb-chibi-sheet-v1.webp` 차이 **0**. 새 런타임·누락 0, closure 164/누락0. 표시2.9.283·최신 UI `hani-ui-v02992.js?v=2.9.283`은 로컬 파일 기준이며 실제 운영 로딩 검증은 아님. [바이트 비교 근거](stage3/runtime-audit.json).

부산물: 변경된 JSON4개(obr16/17/19·drama reachability)를 원래 바이트로 복원. 기존454파일 전부 일치·작업 폴더 밖 신규 부산물0. 새 결과는 stage3에 보존. [복원 근거](stage3/artifact-restoration.json). 브라우저·Preview·Production·원격 최신성은 범위 밖 또는 Git 금지로 미검증. 버전 증가·Candidate build/HINA는 시험 전용 작업이라 N/A. 데이터·보호 저장소·Cloud/schema 영향 없음.

Notion 착수 append는 자동 승인 검토가 `approval policy is never`로 거절해 미반영. 전달 요약과 다음 담당 작업은 [인수인계](../../docs/development-history/handoffs/2026-11-08-pb-chibitoon-stage3.md)에 보존.
