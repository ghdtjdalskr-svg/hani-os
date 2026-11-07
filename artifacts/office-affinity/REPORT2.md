# 친밀도 저장 가드 보완 · 2026-11-07 KST

- Codex / `hani/office-affinity` / 기준·최종 HEAD `f9e8ddd0eff4c81503996d4d5838df581b72cb21`. 요청 파일 전체 UTF-8 읽기 완료, 한글 정상.
- `scripts/hani-office-affinity-storage.mjs`: 해시 고정 274 delta의 `count owner` before/after 한 쌍만 정확히 제거. 양쪽 anchor 유일성, 전용키 `hani_office_affinity_v1`, 해당 binding의 `getItem`/`setItem` 및 `{v:1,counts}` payload만 허용. 다른 키·remove/clear·sessionStorage·보호키·Supabase는 제외 불가.
- chairman/residents/tlayout/xmas/icons에 공통 helper 적용. **기존 정규식 15개 동일·assertion 삭제/완화 없음**([비교 근거](guards2-assertion-audit.json)). icons에는 하트 행·`+1` float의 정확한 생성 경로 2개와 주석 추가. 생성 수 `52→67`(기존 허용13+추가2), timer/fetch 수 유지([보조 검증](guards2-icons-count-proof.json)).

## 검증

- 모든 `scripts/hani-office-*.test.mjs`와 `hani-helper-bot` 실행: **58파일 중 35파일 전체 PASS, 23파일 BLOCKED; 620검사 PASS·25검사 Git 차단·4skip, Git 외 실패 0**. 친밀도·helper·신규 가드 부정검사 포함. [파일별 결과·차단 목록·로그](guards2-test-results.json).
- 명령: 각 파일에 `node --test --test-isolation=none --test-force-exit --test-reporter=tap scripts/<file>`. 기본 runner의 자식 프로세스 `spawn EPERM`을 피하기 위한 실행 옵션이며 assertion은 그대로 실행.
- 신규 가드 3/3, 친밀도 21/21, helper 24/24, chairman/residents/tlayout 파일 전체 PASS. 카페 기존 400ms 성능 검사 PASS.
- **차단: `spawnSync git EPERM`**. icons/xmas 일부 원문 비교 포함 위 23파일은 전체 PASS가 아님. shell Git의 아이콘 수 보조 검증을 전체 테스트 PASS로 간주하지 않음. 219는 미수정이며 이번 실행에서는 Git 차단 때문에 알려진 대비 assertion까지 도달하지 못함. 따라서 “219 외 전부 PASS” 목표는 환경 차단으로 미확인.
- 수정·신규 MJS syntax 7/7 및 `git -c core.whitespace=cr-at-eol diff --check` PASS. 원격 main 조회는 네트워크 실패; 캐시 `03b639bd9d7f9a460c7b2555bb795f41fabde565`의 최신성 미확인.

## 보존·인계

- runtime·데이터·Cloud/schema·버전 변경 없음. office JS/CSS/helper UI 해시는 기존 REPORT.md와 동일, 표시·캐시 `2.9.272` 및 마지막 UI `hani-ui-v02992.js` 유지. 기존 미추적 파일 보존, commit/push/merge 없음.
- build/Preview/HINA/Pages/운영 read-back: 개발도구 전용 수정으로 N/A. 다음: Git subprocess 허용 환경에서 같은 58파일 재실행, 219는 별도 유지.
- [작업 인수인계](../../docs/development-history/handoffs/2026-11-07-office-affinity-storage-guards.md). Notion 착수 기록은 자동 승인 검토가 `approval policy never`로 거절하여 미반영; 최종 요약도 갱신 대기.
