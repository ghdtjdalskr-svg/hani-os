# 꼬마 남매 B + 평일 방문 · main 284 병합 정리

2026-11-08 KST · Codex · `hani/kids-visit-pose-b` · 지정 main `5c375d9`(v2.9.284). **파일 충돌 4개 정리, Git index 처리·커밋은 서윤 인계.** Git 명령·버전 증가·배포 없음.

- 런타임은 main의 친밀도 하루 2점·마스코트 이름표와 B 시트·평일 방문·아빠/이모 대사를 모두 보존했다. 아이들 변경을 모두 역변환하면 main 고정 SHA256 `8d2db079…cd54e`와 바이트 일치한다. CURRENT 양쪽 기록 보존.
- 시험 체인: **weekday → pose B → main mascot/cap → M9 → 기존 office**. 공통 `hani-release-version-layers`는 이 worktree와 지정 tooling-284 경로에서 찾지 못해 기존 283 방식에 정확한 284→283 버전 inverse를 연결했다. 283 고정 pin·생활 묶음 inverse·치비툰 및 기존 assertion 보존. raw index/main 기준 사본은 독립 283 pin에서 버전60/1개만 284로 변환했다.

| 검사 | 결과 |
|---|---|
| office 전체 | 72파일 · 783통과 · 35 Git 차단 · 1 기타 실패 · 3 skip |
| kids weekday | 16 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| kids B | 13 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| kids lively | 15 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| kids visit | 16 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| 결합 runtime | 10 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| main 친밀도 cap | 19 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| main 마스코트 | 9 통과 / 1 Git 차단 / 0 기타 실패 / 0 skip |
| M9 | 15 통과 / 0 실패 |
| 문법·안전 | 11파일 문법 통과 · 저장/Cloud/새 timer/listener 추가 0 · 원문 closure164/누락0 |
| Edge1280/390 | 미완료: spawn EPERM, 직접 실행 Windows 접근 거부 · PNG 0장 |

전체 파일별 결과와 **Git 차단 파일 목록만** [전체 표](merge-evidence/results.md)에 정리했다. 219는 지정된 기존 실패이며 이번 실행은 Git에서 차단되어 기존 assertion 재현은 미검증이다. 통과 수에는 공통 fixture 시험이 포함되며 재검사는 중복 합산하지 않았다.

**잔여 성능 실패 1건:** cafe-rest의 400ms 제한이 결합본 단독 재검사(최소496ms)와 **고정 main 단독 실행(최소460ms)**에서 모두 실패했다. scheduler·400ms assertion은 보존했고 PASS로 바꾸지 않았다. [순차 측정값·main identity](merge-evidence/performance.json). 병렬 진단값은 근거에서 제외했다.

**런타임 변경 목록(main 대비):** `hani-office-live.js`, `hani-office-live.css`, `assets/office-companions/kids-v2.webp`. 이번 충돌 정리에서 직접 바꾼 런타임은 JS 1개다. main의 친밀도 owner 전체·저장 키·저장 호출과 Cloud 경로 보존, 보호 키 신규 write/remove/clear 0, 새 timer/listener 0. 기존 저장 시험은 격리 VM만 사용했다.

**화면 미검증:** 평일 `2026-01-02 16:00 KST`, 날짜 seed `4231280260 % 4 = 0`, PC1280/폰390 각 1장 실행기를 준비했다. Edge 실행 권한 차단으로 새 캡처는 없으며 예전 그림을 재사용하지 않았다. [실행기](capture-merge.mjs) · [실패 근거](merge-shots/browser-results.json). 허용된 환경에서 `node artifacts/kids-visit-b/capture-merge.mjs` 재실행이 남았다.

자동 생성 JSON 4개를 착수 바이트로 복원하고 신규 출력 0개는 별도 근거로 보존했다. [안전·identity](merge-evidence/audit.json) · [집계/명령](merge-evidence/final-summary.json). 현재 runtime SHA256 `7e941be508a5efea0c309c8c689cd32bf976d3122a49ac34c7579e33acf67f36`.

**인계:** 서윤이 실제 Git 차단 검사·index 상태 확인 후 커밋. Edge 실화면, 원격 최신성, 최종 Candidate/HINA/운영 read-back은 미검증 또는 개발 범위 밖이다. Notion 현황판은 읽었으나 착수 쓰기가 자동 승인 검토에서 `approval policy is never`로 거절되어 완료 요약도 갱신 대기다. 임시 Edge 프로필 정리 명령도 실행 정책에서 거절되어 해당 임시 폴더는 근거 폴더에 남아 있다.
