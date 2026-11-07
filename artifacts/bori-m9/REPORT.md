# 보리 산책 + 서윤 M9 통합 시험 정리

## 작업 식별

- 2026-11-08 KST / Codex 단독 / NORMAL / 파일 정리·검증 완료, 서윤 commit 인계 대기.
- `hani/bori-m9-280` / worktree `bori-m9` / base `a2f377d` / 병합 상대 `a7ce78e`. GitHub 읽기 도구로 원격 main `f1a457f`와 로컬 캐시 일치 확인([전체 SHA·기준선](baseline.json)).
- 승인: `../bori-m9-task.md` 전체 UTF-8 정상 확인. Git 명령·commit·push·merge·버전 변경·배포 없음. Git index의 병합 상태도 수정하지 않음.

## 결과와 증거

- 충돌 3곳 정리: CURRENT 양쪽 기록 전부 보존, patrol/home 시험의 양쪽 의도는 **M9 → 보리 → companion-homes → 기존 278** 순서로 연결. M9 office before/after 해시를 보리 적용 후 바이트로 갱신, 원래 replacement·assertion 보존. [정확한 해시·보존 증명](proof.json).
- 수정 범위: CURRENT, patrol source, companion-homes test, Bori source/test, M9 source/delta, 새 통합 test 및 이 작업 증거. 런타임 3파일·기존 278/Bori fixture·main/index는 시작 상태와 바이트 동일.
- **73파일 재실행: 755통과 / Git 조회 차단34 / 기존 skip5 / 신규 실패0.** Archive UI/integration 2파일과 별도 organization 검사는 브라우저 차단. [전체 집계·파일별 결과](summary.json), [정확한 실행 명령](commands.json), [순차 실행기](run-tests.ps1). Node 자식 실행 EPERM은 PowerShell 직접 실행으로 대체.
- 전용 묶음33건은 31통과·Git2차단. 새 통합2/2: 화요일 낮21,600표본 M9 전후 보리 자세·위치·리듬 동일. 실제 보리 자세에 합성 근접 서윤을 입력한 canonical affection에서 새 대사289회, 수면·산책·이동 및 잘못된 상대/층/거리/이동 상대에서는 제외([로그](integration.log)). M9 카드·배지·10줄 대사도 실제 기존 owner 경로 통과.
- **성능 cafe-rest / lively-v2 각각 단독3/3 PASS**, 기존 cold<400ms / warm<3ms assertion 유지([결과](performance-results.json)). Syntax9/9, closure161·누락0, 새 저장·Cloud·schema·migration·timer/listener 없음.
- 합성 persistent DOM 화요일10시·40배속90회·1F: 수면34 / 앉기·서기47 / 걷기9([표본](dom-40x.json)). Edge는 `spawn EPERM`: 실제 1초 간격90회 실측·PC/390 M9 PNG·실화면 미검증([실행 차단](edge-launch.log)).
- 기존 검사 생성물4개는 이번 [test-output](test-output/)에 보존 후 원문 복원. 기존 artifacts 전체 보존 확인([근거](artifact-preservation.json)). CODEMAP 세부 anchor 누락은 실제 기존 tick/pose/affection/bubble owner 검색으로 보완.

## 다음 담당에게

- 서윤: 이 보고서·proof·summary와 파일 내용을 확인하고 진행 중 병합의 index 확정·commit 처리. runtime `880f8bef…`, M9 delta `67daf458…`(전체 해시는 proof). 별도 서버 기능·설정·배포 순서 변경 없음.
- 표시/cache **2.9.279 유지**, 최신 UI `hani-ui-v02992.js?v=2.9.279`. 목표2.9.280 버전 변경·Candidate/build/HINA·main 병합·Pages·Production read-back은 미수행. 실제 로그인·Android·차단된 Git/브라우저 검사는 남음. CURRENT에 확인 결과만 추가, DECISIONS 변경 없음.
- Notion 현황판 읽기 성공. 착수 기록 쓰기는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 이 보고서의 목적·범위·검증·미검증·기준 SHA·다음 행동과 원문 링크 갱신 대기. 저장/read-back 갱신 완료로 보고하지 않음.
