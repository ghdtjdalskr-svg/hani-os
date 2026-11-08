# 주간 학습 재시도 인수인계

## 작업 식별
- 작업 ID / 제목: study-retry / 주간 학습 실패 안내·재시도
- 갱신 시각(KST): 2026-11-08
- 담당 도구 / 검토 담당: Codex 단일 개발 Agent / 독립 검토 미실행
- 상태: 구현·targeted 검증 완료 / Git 권한 차단으로 미커밋 / UI 검증 대기
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/study-retry / study-retry
- base SHA: 2bc93683182728877a6b8e543badb330a3312756 (로컬 refs와 GitHub main 일치)
- 목표: 실패 이유 표시, 기존 생성 함수 버튼 재호출, 다음 접속 자동 재시도 1회. 기존 저장 구조·경로 보존.
- 수정 범위: hani-study-v02984.js owner, scripts/hani-study-retry.test.mjs, scripts/hani-study-retry-source.cjs, scripts/fixtures/study-retry-{delta,preservation}.json, scripts/hani-quiz-qa-212.test.cjs의 외부 projection 연결2줄, 이 인수인계·artifacts/study-retry 증거. 다른 담당 파일 변경 없음.
- 사용자 승인 근거: ../study-retry-task.md 전체 지시(11/7 승인 계획). push/merge/버전 변경 금지. 저장 구조·Cloud write/schema 변경 승인 없음.

## 결과와 증거
- 착수 기준: 표시·cache 2.9.280, 최종 versioned UI hani-ai-budget.js?v=2.9.280 (뒤에 unversioned hani-launch-greeting.js). 실제 운영 브라우저 로딩 미확인.
- owner: codemap study-daily-quiz → hani-study-v02984.js. renderLearning→renderMain→maybeAutoGenerate→generateTodayQuiz→quizApi→persistGeneratedQuiz→기존 learningCommit.
- 원인 후보: 생성일 7일 배수에만 시도(접속일 놓치면 건너뜀), 선택한 프로젝트만 자동 생성, 실패 Map/시도 Set이 같은 페이지에서 재시도 차단. 경제 뉴스는 최근21일·출처 검증, 로그인·문제 품질/중복 검증도 실패 요인. 운영4주 원인 미확정.
- Notion 착수 insert_content: 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 갱신 대기.
- Git/Node exe 실행: Access is denied. 최종 git add 실제 시도도 실행 단계에서 차단돼 staging/commit 미실행. Git metadata 우회 수정 없음. HEAD/ref 2bc9368 유지. push/merge/버전 변경/배포 없음.
- 구현: KST 월~일 주간 missing catch-up, 모든 활성 주간 프로젝트 순차 자동 생성, 쉬운 이유·다시 시도·공용 busy/disabled·저장 전 같은 주 중복 확인. boot/renderAll 및 로그인 완료와 hidden→visible 복귀에 1회. 실패 상태는 메모리만. 일간/기타 스케줄은 보존. 요청/저장 날짜 일치·task 생성 대상도 같은 판정 사용.
- 데이터·저장소·Cloud·schema: 기존 learningCommit/persist* 및 채점/오답 함수10개 원문 동일. 정상 성공 시 기존 commit1회, 실패/중복 시 write0. main/index/서버 함수 Git index와 일치. schema/migration/보호 key/내부 기준 버전 변경 없음.
- 최종 runtime SHA256: 77a03d403c6f188c3c3081ed79d2874fc3da658ca893bce84fd52ce6f07d6777. 상세 원문/최종 해시/로그: ../../../artifacts/study-retry/REPORT.md 및 test-summary.json.
- 실행 검증: Node 실행 도구 VM fallback(artifacts/study-retry/run-vm-tests.mjs)의 runVmFile로 변경 없는 assertion 실행. 전용26/26, 기존64/64+단독2개, JS syntax4/4. 실패 유형, 버튼 성공/20연타 잠금, 기존 세트3상태·API 대기 중 유입 중복0, KST 주/연도, 원래4주 접속 누락 재현, 실제 boot/스크립트 중복로드/가시성 복귀/재로그인/reload/프로젝트 순차/일간잠금/task read model, 저장 보존·timer0/listener1고정 및 누수0.
- 관련 기존 시험: hani-quiz-autogen-216 8/8, hani-quiz-client-209 7/7, hani-quiz-qa-212 10/10, hani-quiz-quality-210 16/16, hani-learning-quiz-quality 13/13, hani-study-tutor-215 3/3, hani-fix-208 7/7, hani-learning-quiz-v04·hani-study-news-material 단독2개 통과. 고정 QA212는 exact inverse 외부 레이어만 연결; assertion을 포함한 원래 전체 파일 복원 blob 동일 확인.
- 미통과/미검증: hani-dashboard-period.test.mjs가 OWNER_BINDING_BLOCKED/VERIFIED 불일치(관련 main 원문 불변), hani-office-219.test.mjs는 spawnSync git EPERM으로 차단. native node --test 실행, 전체 회귀 성공, 실제 PC/폰 화면·로그인·실제 AI 품질·운영 문제 해소를 PASS로 주장하지 않음.
- Edge: PC headless GPU 초기화 실패·재설정 후 PNG 미생성. 생성한 headless 프로세스3개만 종료. 폰 캡처·실화면 미확인, 격리 preview.html 준비. 프로필 재귀 정리는 실행 정책 차단; 로컬 edge-profile/·초기 원문 백업/중간 로그는 작업별 .gitignore 제외.
- Notion 최종 반영 대기: 착수 쓰기 자동 승인 거절(approval policy never), 최종 요약도 미반영. 담당/목적/방향·결과·검증·미검증·commit 차단·다음 행동·base/runtime 해시를 이 문서에 보존. 다음 허용 세션에서 Notion 현황판에 최소 추가하고 read-back 확인할 것.
- PR / Preview / 배포: 미실행.

## 다음 담당에게
- 먼저 읽을 파일: artifacts/study-retry/REPORT.md (완료 후), owner scheduling/generation/lifecycle.
- 다음 행동: Git 허용 환경에서 지정 파일만 commit(요청대로 push 금지), 실제 Edge PC/폰 UI 확인 및 관련 미통과 항목 확인 후 배포 담당에게 인계.
- blocker: Git executable·native Node 권한, Notion 자동 승인 never, Edge 렌더링/캡처 실패. 새 배포 승인 없음. 함께 배포할 Edge Function/설정 변경 없음, 클라이언트 기능만 열차에 포함.
- CURRENT/DECISIONS: 타 담당 기록 보존, 작업별 인수인계 사용.
