# tooling-284 · 2.9.284 시험 기준 갱신

2026-11-08 KST · Codex · `hani/tooling-284` · 지정/로컬 ref `5c375d9`. Git 명령·커밋·push·merge·배포 없음. 원격 최신성 새 조회 없음.

버전 층을 `scripts/hani-release-version-layers.cjs` + JSON manifest로 공통화했습니다. **284 버전(index60/main1 토큰·전후 전체 SHA256) → 치비툰 → 283 버전 → 생활 묶음 → M9/281** 순서이며, release history도 exact metadata inverse로 복원합니다. 기존 283 모듈은 공통 모듈에 위임합니다. 다음 릴리스는 JSON 맨 앞 행(from/to·토큰 수·전후 SHA256·필요한 history 치환)과 해당 frozen 기능 inverse(module/restore/fixture)만 추가합니다. 가상 285 버전+기능으로 기존 시험 입력 자동 복원을 검증했습니다.

기능6파일은 별도 release/life preload·외부 baseline 지정 없이 단독 실행했습니다. 기존 assertion 수·고정 fixture/pin 유지. legacy 보드의 읽기 plumbing만 exact inverse로 되돌린 뒤 원본 시험 전체 equality를 검사합니다. 빠졌던 독립 원본 시험·cases·closure·원화는 feature worktree에서 가져와 scripts의 압축 fixture로 고정(전체/개별 SHA256)했습니다. 하위 fixture·임시 파일 읽기는 건드리지 않습니다.

| 시험 | 결과 |
|---|---|
| pb-chibitoon | 5/5 PASS |
| procrastination-board | 6/6 PASS |
| life-bundle-source | 5/5 PASS |
| study-retry | 26/26 PASS |
| wishlist-quick-add | 7/7 PASS |
| dev-report-generate | 1/1 · 내부10그룹 PASS |
| seoyun-m9 (polish+link preload) | 15/15 PASS |
| m9-link (polish preload) | 9/10 · 기존 10번 packaging FAIL 유지 |
| m9-polish | 2/2 PASS |
| nav / navlogin / dashboard 정적 | 3파일 PASS |
| navlogin / navigation-state / dashboard UI | 3파일 PASS · PC/390 |
| 공통 버전 층 부정·미래 릴리스 | 5/5 PASS |
| office 전체 | 69파일 실행 · 745통과 / 35Git차단 / 3skip · 기타실패0 |
| 변경 JS syntax | 10/10 PASS |

office 41성공·28Git차단 파일 목록·실행 명령은 [SUMMARY.json](SUMMARY.json)에만 기록했습니다. 219는 Git 차단이 먼저 발생하여 기존 실패 원인 재현은 미검증입니다. m9-link의 기존 packaging 누락4개와 gate/server 계약은 그대로 두었습니다. UI는 격리된 합성 데이터 시험이며 실제 인증·Android·Production은 미검증입니다.

**런타임 498파일 로컬 origin/main 바이트 동일**, 착수 대비 변화0. Git을 실행하지 않고 검증된 commit/tree object ID와 실제 blob·assets/data 전체 tree를 대조했습니다. 표시 v2.9.284 유지, 저장·Cloud·schema 영향0. 지정 JSON을 포함한 기존 artifacts 원문 SHA256 일치, 새 PNG·중간 산출물 제거 완료. 로그·실행기·중간 증거는 저장소 밖 임시 디렉터리에만 보관했습니다.

다음: **서윤 검토·Git 차단 재검증·커밋**. runtime build/version/배포 QA N/A. Notion 읽기는 성공했으나 쓰기는 자동 승인 검토의 `approval policy is never` 거절로 미반영·read-back 없음. 요약 갱신 대기입니다.
