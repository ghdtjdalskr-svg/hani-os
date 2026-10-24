# obr8 작업 인수인계

## 작업 식별

- 작업 ID / 제목: obr8 · 휴식은 길게, 업무 용무는 짧게
- 갱신 시각(KST): 2026-10-23
- 담당 도구 / 검토 담당: 도연(Codex) 단독 / 서윤 후속 시각 검토
- 상태: 기능 구현·실측·검증 수행. 첫 계획 성능 미달 및 일부 단조로움 목표 미완료, 탑승 준비 PASS 아님.
- 저장소 / branch / worktree: hani-os / hani/release-train-20261023 / obr
- base SHA: 84cadbd (obr7), origin/main d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf (GitHub main 읽기 및 로컬 ref 일치)
- 목표: 휴식 체류 보존, 안전한 짧은 업무 용무와 낮 방문객 전환 추가, 230/obr7/obr8 비교 및 지정 검사.
- 수정 범위: hani-office-live.js scheduler, 관련 검사·고정 fixture·측정 도구·보고서. CODEMAP living-office owner 확인; scheduler anchor는 CODEMAP_MISS로 실제 함수 추적.
- 승인 근거: 성민 대표님 obr8 명세. 로컬 커밋 허용. 버전·cache·index·마스코트·data/ 수정, push·PR·Notion 금지. main merge/rebase 및 배포 권한 없음.
- 기존 behavior-browser.json 수정 및 untracked 산출물은 보존한다. 다른 AI 작업 없음.

## 결과와 증거

- 변경: runtime은 hani-office-live.js만. 업무 용무(동료·문 앞 전달·1F 게시판), 낮 짧은 방문객/테이크아웃 추가. 기존 휴식·정식 체류 하한 유지, 새 좌표0. owner/event/renderer 하나 유지.
- [최종 보고서](../../../artifacts/office-behavior/report-obr8.md), [4열 비교](../../../artifacts/office-behavior/monotony-compare.md), 한국어 -o: artifacts/office-behavior/obr8-results.json.
- source SHA256: 54fbf9a6f0301acf8c6e52d7ed3dc0ab8d05d684b763e84d2563f677981c6885. **미커밋**: git add가 `.git/worktrees/obr/index.lock: Permission denied`로 차단됐다. HEAD는 원래84cadbd. 권한 우회·push·PR 없음. 명시적 작업 파일 목록은 obr8-stage-files.txt, hash는 obr8-verified-files.json.
- 실행 검증: 기존 office/building 전체129개 =125 PASS/성능1 FAIL/browser3 SKIP. 233 pending exact hunk 재생성 후 승인 기록8/8 PASS. 기존 baseline 검증기 및 assertion 불변. 감사54,000 snapshot frozen/mismatch/stuckSeconds/near30/near24 전부0. 120일216·휴식/정식·DOM/event·소집/취소/reduced·storage0·원래109,561 route/tie 비교 PASS.
- 단독 기존 lively-v2 3회: 첫 계획464.6604 / 538.6028 / 475.9256ms 모두400ms 미달, warm0.720 / 0.701 / 0.707ms PASS. 이전 축소 구현의 PASS 재사용 안 함. 실패를 숨기거나 한도/검사 완화 안 함.
- 비교: 230/obr7 immutable source 실측 재사용 + obr8 2일172,800 snapshot 새 실행. 대상1F/3F/4F 핵심 열세 항목90→53 개선. 15지표 중 하나라도 열세인 구간58→61 악화; 재도착·문구 반복 및4F/1F 잔여 보행 등 전체 목표 미완료. 희소 재실2F 심야·5F 별도 표.
- 업무 용무3일 실측1098/1095/1108건, 체류8–25초, 왕복 최대53.57초. 모든 사람 실제 평균 간격6–15분 검사 PASS. 방문객296/290/286건. 개별 인물·지점·문구·좌표는 obr8-errands.json.
- 고정 비교 갱신 이유: 새 물리 행동은 기존 obr7 이동 불변 계약과 다름. 원본 obr6 gzip/route/obr7 단어 delta는 보존하고 현재 전체 outing/snapshot은 별도 고정 obr8 gzip/hash로 검사. formal 원본 bytes 및 역사적 obr7 모든 assertion 유지.
- 실제 Edge/폰·픽셀·녹화·서윤 시각 UX, package/One-Pass/독립HINA 및 운영 검증 미수행. 필요한 Edge Function·서버 설정 변경 없음.
- 데이터·저장소·Cloud·schema: 변경 범위 아님.
- main merge / Pages / 운영 read-back: 미수행. 원격 main SHA와 원문 index의232 태그·마지막 UI script 참조 hani-ui-v02992.js?v=2.9.232만 확인. 운영 화면 실제 로딩은 확인하지 않음. 버전 증가 N/A(사용자 금지).
- Notion: 대표님 명시 금지로 미반영.

## 다음 담당에게

- 먼저 읽을 파일: hani-office-live.js createScheduler → blockPlan → reserve → snapshot, scripts/hani-office-place-assertions.mjs.
- 다음 행동: 같은 기능을 보존하는 첫 계획 계산 최적화 및 재도착/문구 반복 설계. 현재 결과를 배포/탑승 PASS로 취급하지 않음.
- 재현: node scripts/hani-office-obr8-report.mjs -o artifacts/office-behavior/obr8-results.json. 전체: powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1 (현재 성능1 FAIL 반환). sandbox Git spawn 제한은 기존 read-only obr5 export 공급기 사용. native Git85 blob(기존78·230원본6·obr7 JS1) 재검증 근거 포함.
- blocker: 첫 계획 성능 미달, 전체15지표 열세 구간 증가, Git worktree index 쓰기 권한. 권한이 가능한 개발 환경에서 이 명시 파일만 로컬 커밋하고, 같은 사용자 승인 범위를 재사용한다. 성능/비교 목표 미완료 상태를 그대로 인계한다.
- 서윤 녹화 추천: 2026-10-22 1F10:00, 3F15:00, 4F18:00 각10분; 주말2026-10-24 3F13:40. 비교표에 recorder 명령·before/230 ref 포함.
- CURRENT / DECISIONS: 타 담당 기록 보존, 공통 현황 수정 없음.
