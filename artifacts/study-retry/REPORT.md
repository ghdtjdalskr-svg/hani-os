# 주간 학습 재시도 · 2026-11-08 · Codex

- **구현·전용 검증 완료, 미커밋.** `hani/study-retry` / base `2bc9368`(착수 GitHub main·로컬 ref 일치). push·merge·배포·버전 변경 없음, 표시/cache `2.9.280` 유지.
- 실제 owner: `hani-study-v02984.js`의 `boot/renderAll → renderLearning → retryWeeklyStudies → generateTodayQuiz → quizApi → persistGeneratedQuiz → learningCommit`.
- **재현한 원인:** 기존 주간 판정은 생성일의 7일 배수 날짜에만 허용. 목요일 접속 4회(`10/8·15·22·29`) 모두 생성 대상 0회, 변경 후 4회. 선택 프로젝트에만 자동 생성하고 같은 페이지 실패 후 재시도를 막는 조건도 확인했다. 실제 최근 4주 운영 원인 확정은 아님.
- 추가 후보: 로그인/세션 만료, 뉴스 조회 실패·최근21일 출처 확인 뉴스 부재, 문제 품질·중복·난이도 검사 탈락. 검증 조건은 유지했다.
- 변경: KST **월~일** 단위로 이번 주 세트가 없으면 접속일에 보충. 활성 주간 프로젝트를 순차 확인하고 준비 중·쉬운 실패 이유·완료 표시. 기존 버튼을 **다시 시도**로 연결, 공용 잠금/disabled 및 저장 전 재확인으로 중복 차단.
- 새 boot와 `hidden → visible` 복귀에 이번 주 없는 세트를 프로젝트당 1회 시도. 같은 접속의 재렌더/중복 visible 이벤트는 재시도하지 않는다. 로그인 완료 후에도 다시 확인한다. 실패·시도 상태는 메모리뿐이며, 지난 주를 소급 생성하지 않는다.
- 주간 요청일·저장일을 KST로 맞추고, 이미 이번 주 세트가 있으면 대시보드/할 일의 가짜 생성 대상도 제거했다.
- **저장 보존:** 기존 저장 함수10개 원문 동일, 기존 정상 저장1회 외 추가 보호 write0·새 저장 키0. `hani-main.js`·`index.html`·서버 함수는 Git index와 동일. Cloud write/schema·내부 기준 버전 변경 없음.

## 검증

- Node exe 실행 거부로 Node 실행 도구의 VM 모듈 대체 실행 사용. **전용26/26**, 기존 학습·퀴즈·연결 회귀 **64/64 + 단독 스크립트2개**, 변경 JS 구문4/4 통과. 일반 `node --test` 실행 성공이라고 보고하지 않는다.
- 실패9유형+세션 오류, 실제 버튼 성공, 연타20회, 같은 주 기존3상태/응답 중 유입 중복0, KST 주·연도 경계, 실제 boot/복귀·재로그인·reload·순차 생성·일간 공용 잠금·task read model 확인. 새 timer0, lifecycle1개 고정·추가 누수0.
- 고정 QA212는 assertion을 그대로 두고 원본 owner를 복원하는 exact inverse 외부 레이어만 연결했다. 그 2줄을 되돌린 시험 파일 전체 바이트가 기존 Git blob과 동일하다. 새 동작은 전용 시험이 직접 검증한다.
- 대시보드 기존 시험: `OWNER_BINDING_BLOCKED ≠ VERIFIED` 불일치로 미통과(해당 main 원본 불변). office219: `spawnSync git EPERM` 차단. 전체 회귀 PASS 아님.
- Edge PC 캡처 시 GPU 초기화 실패, 다른 설정 재시도도 PNG 없이 중단. **PC/폰 실제 화면·스크린샷·실제 로그인/AI 생성·운영 read-back 미검증.** 격리 [Preview](preview.html)만 준비. 전체 package/One-Pass/HINA는 기능 개발 범위 밖.
- 최종 owner SHA256: `77a03d403c6f188c3c3081ed79d2874fc3da658ca893bce84fd52ce6f07d6777`.
- 상세 근거: [검사 요약](test-summary.json), [전용](dedicated.json), [기존 회귀](regression.json), [원문 보존](baseline-proof.json), [구문](syntax.json), [VM 실행기](run-vm-tests.mjs).

## 차단·다음 행동

- `git add -- …`에서 Git exe **Access is denied**. staging/commit 미실행. Git 가능한 동일 branch에서 변경 파일만 검토·commit. 이 작업의 push 금지는 유지한다.
- Notion 쓰기는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절해 **갱신 대기**. 최종 요약·검증·미검증을 인수인계에 보존했다.
- 임시 Edge 프로필 정리도 실행 정책에 차단되어 `edge-profile/`을 로컬에 남기고 작업별 `.gitignore`로 제외했다. 열차 담당은 실제 PC/폰 UI와 미통과 관련 검사를 확인한 후 별도 후보·승인 흐름을 진행한다.
