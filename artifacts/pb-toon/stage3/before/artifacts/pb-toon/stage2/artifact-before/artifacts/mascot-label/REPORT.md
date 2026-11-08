# 부서 마스코트 이름표 인수인계

## 작업 식별
- 2026-11-08 KST / Codex / **구현·검증 종료, 미커밋(권한 차단)** / LIGHT 표시 패치.
- worktree `affinity-cap` / branch `hani/affinity-daily-cap` / base·HEAD `fe7cfbd20e63ef3d56413b3a84a349f0adb90b63` (친밀도 상한 커밋).
- 승인 근거: `../mascot-label-task.md` 전체 UTF-8 읽기·한글 정상 확인. 5마리 이름표만 수정, 신규 시험·최외곽 exact inverse·이 보고서 작성. 새 runtime 파일·timer·listener·저장·push·merge·버전 변경 금지.
- 범위: `hani-office-live.js` 기존 주민 이름표 보조 줄, 시험/고정 inverse. 기존 미추적 친밀도 산출물은 보존.
- CODEMAP_MISS: living-office owner만 있고 동행 이름표 anchor/시험 없음. 실제 `companionPeople` → `updateResidents` → `fitStatusLabels`의 persistent 이름표 경로 확인.

## 결과와 증거
- GitHub 읽기 도구로 원격 main `2bc93683182728877a6b8e543badb330a3312756` 확인. 공통 base `2463e88` 대비 runtime 미참조 이미지 2개만 추가, 자동 merge/rebase 없음. 표시·캐시 `2.9.280`, 마지막 UI `hani-ui-v02992.js?v=2.9.280` 유지. 운영 화면·실제 JS 로딩은 미검증.
- Notion 읽기는 성공, 착수 append는 자동 승인 검토 `approval policy is never`로 거절. 시작·완료 갱신 대기 내용을 이 보고서에 보존.
- 구현: 5종 정의에 부서 표시만 추가. 기존 `officeCompact`를 이름 아래 보조 줄로 재사용하고 같은 name 박스로 측정·겹침 배치. PC `오늘의 동행 · OO 마스코트`, 390폰 `동행 · OO 마스코트`(최대 16자), title/aria는 전체 문구. 비동행일 접두어 해제. 수달의 카페 성격·대사는 유지.
- 신규 `hani-office-mascot-label.test.mjs` **10/10 PASS**(공통 fixture 6 + 전용 4): PC1280/폰390 × 일반/감소 모션, 5종 상주·평일동행·주말전환, 기존 펫/남매/NPC 이름표, 단일 탭 말풍선, 저장 0, 등록수 불변, 7일 state 비교, runtime closure 161/누락0. [로그](new-test.log).
- 고정 시험은 mascot → affinity-cap → 기존 inverse 순서의 최외곽 연결만 추가. 기존 assertion·상한 계약 hash·검사 기준 삭제/완화 없음. 7개 정확한 치환을 역적용하면 HEAD 원문 전체 바이트/EOL 복원; 부분·중복·무관 변경 거절.
- 회귀: `& ./artifacts/mascot-label/run-targeted.ps1` → 성능 단독 재검사. **72파일 중 71 PASS; 총 851검사, 845 PASS / 기존 실패1 / skip5**([최종 결과](verification.json), [파일별](results-final.json)). office 전체 69파일(신규 포함, labels-qa17/17·상한19/19), helper-bot30/30, fun-chat6/6, 서윤15/15 재실행. Node→Git spawn EPERM은 기존 read-only adapter와 고정 export의 blob SHA-1 검증으로 대응.
- lively-v2 첫 실행 cold 최저452.0ms로 기존400ms 기준 실패. 다른 시험 종료 후 같은 파일·기준으로 단독 재검사 **8/8 PASS**, cold 최저339.225ms / warm0.647ms([로그](perf-lively-v2-standalone.log)); 기준·assertion 변경 없음. 최초 실패 로그도 보존.
- 기존 실패 `hani-office-219.test.mjs:50`의 `.hani-office-name AA text contrast` 리터럴 검사: 이번 runtime과 수정 전 HEAD에서 동일 재현([수정 전](base-219.log)). CSS와 assertion 보존.
- `node --check` 변경 JS/시험/helper 5파일, `git diff --check` PASS. 실제 사용자 저장소 무접촉, affinity owner 바이트·storage/Cloud·timer/listener·runtime 파일 수 불변.
- Edge `spawn EPERM`으로 PC1280×900/390 PNG·실제 화면은 **미검증**([로그](edge-launch.log)). DOM double 결과는 실제 픽셀 검증과 구분. Production·Preview 배포 없음.
- `git add -- <이번 변경 7파일>`은 공용 `.git/worktrees/affinity-cap/index.lock` 생성 `Permission denied`로 차단. **스테이징·새 커밋 없음**. 권한 우회·push·merge·버전 변경 없음.
- 최종 runtime SHA-256 `8d2db07921446cca8a234acfff4f026a2d44f0fdb2dedcea241dba6f462cd54e`; inverse 계약 SHA-256 `b5f68565f9ec61ab3f4f2697fb77144a1e9c4c1db26dc577500521f56879d26b`.
- 시험이 갱신한 공용 산출물 4개는 이 폴더에 증거 복사 후 HEAD 원문으로 복원. 타 담당 파일·과거 기록은 보존.

## 다음 담당에게
- 쓰기 가능한 Git 환경에서 이번 7파일 diff와 결과만 확인해 로컬 커밋. 기존 미추적 친밀도/고정 export 및 이번 임시 로그·base 사본은 기능 commit 대상 아님. 이 과제의 push/merge/버전 변경 금지 유지.
- Candidate build·One-Pass·HINA·Production은 기능 패치 단계에서 N/A. 서버·Cloud·schema 변경 없음.
- CURRENT/DECISIONS: 타 담당 기록 보존, 작업별 원문은 이 파일. Notion에는 목적·상태·검증·미검증·승인 범위·branch/base와 원문 경로 갱신 대기.
