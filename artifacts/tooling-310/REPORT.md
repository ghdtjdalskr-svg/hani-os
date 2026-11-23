# tooling-310 · 서윤 인계

- 2026-11-23 00:18:05 KST · 도연(Codex) · **시험 층 구현·검증 완료, 기존 실패·환경 미검증 인계**. 승인: `../tool310-task.md` UTF-8 전문.
- branch `hani/tooling-310` · HEAD `a6341c0c262b75f055ff218da824b7216941a191` · 출시310 기준 `71a4641`. 관측 origin/main `92cdcecf24106331eeb6c110b8e23981e25b8038`. 원격 망 조회는 실패해 최신성 미확인.
- 신규5개: `scripts/hani-release-310-{source,preload,reviewed-input}.cjs`, `hani-release-310.test.mjs`, `fixtures/release-310-layer.json`. 기존 수정은 attendance source bootstrap1줄·menu outerFiles5등록. **기존 시험 import 추가0**.
- 순서: **310 version/history → attendance →309 →ai-budget-view →308**. CODEMAP_MISS 후309/attendance 소유 경로 확인. main의 자료2파일(#544)·미참조WebP2개(#543) 진행은 독립 첫 부모 계보와 동결 owner 해시로 처리. 실제 Git refs·objects 조회는 보존하며, 자료는 검증된 완전한 before/after 쌍만 허용.
- `node scripts/<각파일>.test.mjs` **311개 전부 단독 실행** 후 영향 대상 재검증. 최신 고유파일 **210성공 / 101실패·미검증**. 새310 **9/9**, release300~309·reviewed baseline·필수 연결·helper/306 대조 PASS. **syntax6/6**.
- 동일 입력 대조 **새 실패0**. settings guard2실패는 출시 전 Git 동결 실행과 main/HTML SHA·기준·오류가 동일함을 확인; 시작 결과도 원문 보존. [실패·미검증101개 및 대조 근거](UNVERIFIED.md). **Git EPERM10파일은 미검증**.
- 사무실 perf 각각2회 재시도 완료. 마지막 cold 카페538ms·lively556ms로 기존400ms 실패 지속; warm0.806ms는3ms 통과. 단언·기준값 변경0.
- 원본2611파일 감사: 허용 tooling2개 외 변경0. 기존 시험310·fixture143·운영/보호 경로·.gitignore 보존. closure177/누락0, 지정 JSON5 원본 SHA 복원. 생성물16개·무거운 자료는 `local/`에 보존. **저장·Cloud·schema 변경0**.
- 명령·원문: `local/run.ps1`, `finish-checks.ps1`, `final-ancestry.ps1`, `summary.json`, `audit.json`, `settings-equivalence.json`. 실제 UI/Preview/Production 미검증; runtime build·버전 증가는 N/A(운영 파일 불변).
- **commit·push·merge/rebase·배포·Notion 실행 없음.** 다음은 서윤의 변경 검토·Git/Notion 처리. 검토 대상은 신규5·기존 tooling2·보고서/목록이며 **local/ 전체는 commit 제외**.
