# 본사 행동·이동 재설계 · 도연 · 2차 실행

## 작업 식별

- 작업 ID: office-behavior-redesign / 갱신 2026-10-23 KST
- 담당: 도연(Codex), 단일 개발 Agent. 브라우저·Notion 담당: 서윤(Claude).
- 상태: 구현·모델/회귀 검증 완료. 서윤 브라우저·아린 화면 검토 대기.
- branch/worktree: `hani/office-behavior-redesign` / `obr`
- base: `ad3c2f3ed7716f97b81e1b0b66f3f4238a7aa04d`, HEAD `e58c2358e4b782ec5b5c4b353640ab85621ac443`
- GitHub API `branches/main` read-back: base와 일치. Git HTTPS 직접 조회는 프록시 연결 실패. merge/rebase 없음.
- 표시 버전/최신 JS: 로컬 index 및 설계 근거 2.9.230 / hani-office-live.js?v=2.9.230, 마지막 hani-launch-greeting.js. 운영 실제 로딩은 이번 실행에서 미검증.
- 수정 범위: 본사 모델·공간/장소 데이터·216/221 카탈로그·관련 테스트/overlay/결과 문서. CODEMAP scheduler anchor 누락은 실제 함수 검색으로 보완(CODEMAP_MISS).
- 승인: 성민 대표님이 전달한 2차 실행 명세. 구현·테스트·로컬 커밋 허용, 커밋 차단 시 작업 트리 보존 후 계속. push/PR/main/배포 금지. Notion 갱신은 서윤 담당으로 명시 위임.
- 다른 세션 경계: `hani-desk-mascots.js`, index.html, 표시/캐시 버전 및 보호 저장소·Cloud/Supabase 관련 코드 미변경.

## 결과와 증거

- 장소 카드 22개, 창가 슬롯 5개. hall 좌표 분리, 충돌하던 경로 수정, 화면 거리/180px/s 이동.
- 산책·정식 행동·방문객이 같은 reserve/stateAt 경로 사용. 10분 외출 블록 캐시, home 영구 소유, 통로 FIFO/독점, 0.5초 + 경계/연속 구간 근접 검사.
- idleStroll/strollPlan/idlePools.stroll/visitPlan/visitorAt와 snapshot 사후 산책 되돌리기/방문객 필터 삭제. Actor persistent DOM 및 기존 API 이름/회의 소집 경로 유지.
- 새 모델 테스트: 평일 26시간(93,600초), 주말 저녁 2시간(7,200초), 고정 재현 5시각·일반/동작 줄이기, 장소/경로/소유권/결정성 검사.
- 새 브라우저 테스트: 390/884/1440 × 5개 층 × 일반/동작 줄이기. 작성·syntax 확인만, 실행하지 않음.
- overlay: `docs/drafts/office-behavior-redesign/overlay-{1f,2f,3f,4f,5f}.{svg,png}`. 기존 sharp 의존성으로 Node에서 PNG 합성, Edge 미사용.
- 최종 Node 103개: 100 PASS / 0 FAIL / 3 SKIP(브라우저), exit 0. 새 모델 100,800시각 및 고정 재현 PASS. 216 120일 budget/예약 PASS, 208일 97행 도달성 PASS. lively 기준 변경 없이 PASS. 최종 해시는 summary.json/verified-files.json에 보존.
- 자세한 파일·명령·결과·기대값 변경 이유: [결과 보고](../../../artifacts/office-behavior/report.md).
- 감사 전: 제자리26 / 문구268 / 24px 미만11쌍(최소8px). 최종 감사: 54,000시각, 제자리0 / 문구0 / 제자리 walking0 / 24px 미만0 / 30px 미만0. audit-release-handoff.txt 참조.
- 데이터·저장소·Cloud/schema: 변경 없음. 본사 모델에 저장소·Cloud API 없음. 기존 보호 owner·버전/cache·mixed EOL safety 검사 통과.
- 로컬 커밋 0: 2차 git add도 `.git/worktrees/obr/index.lock: Permission denied`. 명세대로 작업 트리 보존. 권한 변경·우회·다른 worktree 수정 없음.
- push/PR/Preview Candidate/main/Pages/운영 read-back: 미실행.

## 다음 담당에게

- 먼저 읽기: 결과 보고, `hani-office-live.js`의 stateAt/reserve/blockPlan/snapshot, office-places.json, overlay PNG.
- 다음 행동: 서윤 환경에서 새/기존 browser 스크립트 실행, 아린과 창가·통로·가구·모바일 실제 화면 검토. 명세 승인 범위 내 커밋 준비.
- 모델 전체 회귀 실행: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/hani-office-behavior-run-tests.ps1`. Node spawn 제한 때문에 `--test-isolation=none`; 기존 safety/219 baseline은 읽기 전용 Git export로 공급.
- blocker: Git index.lock 권한. 브라우저 실행은 사용자 지시로 서윤에게 위임(차단 재시도하지 않음).
- 미검증: 실제 DOM 발 pivot/가구 가림/벽·문 통과/반응형/동작 줄이기 화면, 216/221 등 모든 office browser, 독립 아린/HINA/Candidate/운영 검증. PNG는 화면 합성 검토용이며 브라우저 PASS가 아님.
- Notion: 이번 실행에서 호출하지 않음. 서윤이 이 인수인계/결과를 갱신해야 함. 자동 연결/동기화 완료로 보고하지 않음.
- CURRENT/DECISIONS: 타 담당 공통 현황 수정 없음. 작업별 기록만 갱신. 1차 중단 기록은 `artifacts/office-behavior/handoff-first-attempt.md`, `report-first-attempt.md`에 보존.
