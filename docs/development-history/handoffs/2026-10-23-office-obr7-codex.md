# obr7 승인 기록 갱신·단조로움 점검

## 작업 식별

- 2026-10-23 KST / 도연(Codex), 상태: 승인 fixture·문구 개선·지정 검증 완료 / 단조로움 B2 전체 목표 미달 / Git 권한으로 미커밋.
- worktree obr / branch hani/release-train-20261023 / base ecc138414f0b1a01ea1747a51a85d976580419c4.
- 승인 범위: 현재 3개 runtime owner의 정확 변경 fixture 재생성, 230/obr6/개선 후 매초 비교, 필요 runtime 개선, 안전·성능·회귀·결과 동일성 검증, 로컬 커밋.
- 금지: 버전·cache·index·마스코트·data/ 변경, 기준 완화, push/PR/Notion. 기존 behavior-browser.json 수정 및 untracked 파일 보존.
- NORMAL 개발 작업. CODEMAP living-office owner 확인, scheduler anchor CODEMAP_MISS로 실제 createScheduler/idleFlavour/blockPlan/snapshot/기존 renderer 경로 추적.
- 원격 main 셸 조회는 프록시 연결 실패. 이후 GitHub 읽기 도구 fetch_commit(main)으로 d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf 확인, origin/main 캐시와 일치. merge/rebase 없음. 로컬 표시/cache 2.9.232, 마지막 script hani-launch-greeting.js. 운영 확인은 범위 밖.

## 결과와 증거

- 승인 fixture 복원 → 2026-10-22/24 각 86,400초 비교 → 문구 개선 → 동일 비교 및 기존 검사 → 한국어 보고와 -o 결과까지 수행.
- runtime은 hani-office-live.js 하나. 공용 시간대 문구72개·seed voice18명×4개 추가, 같은 층 idle 문구 충돌 회피. 원래 자세 선택/리듬은 별도 풀로 보존. 확장 문구 정렬은 메모리 cache로 재사용.
- 첫 단독 성능2회 중409.03ms 실패를 보존했다. 최종 코드에서 층·재실 phase별 roster 및 사람별 외출 이력 조회를 재사용해 결과를 유지하는 최적화 후 검사를 재실행.
- 최종 runtime SHA256 cce544474a1bb90c6220127e4656f61e47d0b8b4fb9dec5a93fde6c40a6c6e6d.
- scripts/fixtures/office-redesign-233.json은 고정 base7a10595 대비 현재3개 owner의 정확 hunk(JS15+JSON1+1)로 재생성. before/after1회·전체 역변환 확인, 원래 승인 baseline8개와 부정 assertion8 PASS. baseline owner/test 파일은 변경0.
- 원본 obr6 gzip·route fixture/hash는 불변. 별도 office-obr7-snapshot-lines.json에 의도한 문구8개(평일4/주말4/심야0)만 고정. 원래 obr6 test의 snapshot 기대에 이8개 line만 적용한 뒤 전체 byte/deepEqual 유지. 계획 장부·좌표·pose·plain·event 비교는 불변.
- 새 obr7 테스트: immutable ecc1384의 실제 source SHA를 고정하고,3일 장부 byte 비교와 총2,673개 시각의 line 외 snapshot 전체 동일성·문구 충돌·장소 단어·소집/취소/reduced motion·결정성·쓰기0 검사. obr6+obr7 최종6 PASS.
- 3구현×2일 매초518,400 snapshot 비교. 마지막 성능 최적화 뒤 최종 source로2일172,800 snapshot을 재측정하고 source hash 외 집계·10분창·개인별 지표 전체 동일 확인. 230 원본7개/legacy Git 공급 원문78개는 native Git blob 재검증.
- 2F 졸린 오후10분 문구 반복: 평일143.75→93.50, 주말142.33→89.33. 문구 종류58→113/53→108. 3F 저녁 동시 중복1.81%→0.37%/1.73%→0.05%.
- **미달:** 230보다 모든 지표가 좋아진 것은 아니다. 단조로움 관련15개 지표에서58개 구간의 열세가 남음(빈2F 심야·5F 포함). 1F/3F/4F 보행·일부 화면 정지·일별 장소/행동 다양성 등의 차이는 표에 표시. 230의 최대30초 산책을 현재 최소 체류/10분cooldown/연속 근접 계약에 그대로 복원하지 않음. B2 전체 해결 PASS로 보고하지 않는다.
- 최종 단독 성능 연속3회: first340.0940/350.8482/342.8832ms(<400), warm0.4606823/0.4772057/0.4975042ms(<3), 각각8 PASS/0 FAIL. 기존 한도·측정 코드 불변.
- 최종 전체 office/building 회귀126개:123 PASS/0 FAIL/기존 browser3 SKIP,166.25초. 감사54,000 snapshot frozen/mismatch/stuckSeconds/near30/near24=0/0/0/0/0, shared engine6 PASS.
- storage/Cloud/schema/migration 변경0. 기존 근접/예약/체류/결정성/성능 assertion 보존. 버전/cache/index/마스코트/data/행동 JSON HEAD 대비 변경0.
- 실행 명령: `node --test --test-isolation=none scripts/hani-office-obr7.test.mjs scripts/hani-office-obr6.test.mjs`; `powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1`; `node docs/drafts/office-behavior-redesign/audit.mjs .`; 기존 lively-v2.test.mjs 단독3회. Node Git spawn 제한은 기존 read-only obr5 export 공급기로 보완, native Git 자체 통과로 보고하지 않음.
- 보고: artifacts/office-behavior/report-obr7.md, monotony-compare.md, monotony-windows.csv, obr7-place-card-repeats.json, obr7-results.json. `node scripts/hani-office-obr7-report.mjs -o artifacts/office-behavior/obr7-results.json`이 실제 로그·hash·한도·동일성을 확인해 한국어 결과와 보고서 재생성.
- `git add -- hani-office-live.js`가 HANI_OS_DEV/.git/worktrees/obr/index.lock Permission denied(exit128). stage0·commit0, 시작 HEAD ecc1384 유지. 사용자 지시대로 미커밋 보존하며 권한 우회/별도 index/push 없음.
- 미검증: 실제 브라우저, Candidate/package/One-Pass/HINA, main/Pages/Production. Notion 사용자 명시 금지로 미반영.

## 다음 담당에게

- 먼저 report-obr7.md와 monotony-compare.md의 잔여 열세를 확인. 실제2F 녹화 추천: 평일2026-10-22 09:40–09:50 KST(수정 전 반복151회), 주말2026-10-24 13:40–13:50(152회). 졸린 오후15:00/저녁18:00도 확인. 명령은 비교표 하단에 보존.
- 다음 행동: 서윤의 실제2F 체감 확인 및 남은 보행·방문객 전환·정지 차이의 설계 판단. 이번 문구 개선을 모든 단조로움 해결로 간주하지 않는다.
- 구현 검증과 운영 배포는 별개. Candidate Freeze/기존 gate/승인/배포 절차 필요. 별도 서버 Edge Function·설정 변경 없음.
- CURRENT/DECISIONS의 다른 담당 기록 보존. Notion은 사용자 명시 금지로 미반영.
