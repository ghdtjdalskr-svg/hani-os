# 공부 실제 뉴스 출제 보강 인수인계

## 작업 식별

- 작업 ID: STUDY-REAL-NEWS-20261005
- 갱신일: 2026-10-05 KST
- 담당: Codex 개발 / 별도 study_review Agent 읽기 전용 검토
- 상태: 실제 모델 검증 대기. Production 배포 미완료.
- 작업 트리: `.worktrees/study-news-release-final`, branch `hani/study-news-release-final`
- 개발 base: `4cd5613742742708df6207f8f386b3f90c977778`; 최신 확인 main: `c544592e427b44fd7c7c530213a790f50e92bce8` (공통 허브 문서만 추가)
- 개발 SHA: `0ebc5094aa8e9e81b300b4b85892fd4ce74ee331`. 최종 릴리스 후보 아님.
- 승인 근거: 이 대화의 “응 검증 및 배포 진행해줘”, “이어서 진행”. 공부 패치 검증·배포 승인; 저장 구조/Cloud write/auth/schema/릴리스 도구 변경 승인 아님.
- 범위: 공부 소유 모듈, quiz Edge Function, 테스트. main/index는 표시 버전 및 캐시 갱신만. 다른 담당의 자산 기능/공통 허브 변경은 덮어쓰지 않음.

## 결과와 증거

- 최근 21일 내 뉴스룸 자료를 사용자 ID로 읽고 출제를 기다림. 자료 없음과 조회 오류 구분, 뉴스 약 1/3 quota, 난이도/기존 문제 보존.
- 지문에 뉴스 제목·저장 요약 앞260자·자료 기준일·출처 표시. 해설에는 출처 ID/URL. 저장 브리핑은 단일 기사로 가장하지 않고 별도 표시.
- 별도 Agent가 긴 뉴스 공통 문맥으로 질문이 중복 처리되는 문제를 재현. `[질문]` 이후를 비교/재요청 문맥으로 사용하여 수정. 재검토에서 유사성 0.846→0.389, 서로 다른 질문 정상 구분.
- 소유 코드 mocked 실행 및 v04 회귀 PASS. 기존 저장/auth/DB write 경로 불변. 최종 개발 SHA의 기존 pre-QA PASS(`.audit/preqa.json`).
- 이전 frozen 후보 f12ff03의 One-Pass 및 GitHub CI PASS가 있지만 이후 수정·main 변경으로 최종 배포 증거로 재사용 불가.
- Desktop1440/Mobile390 격리 fixture QA PASS: 보호 storage 불변, uncaught error0, 수평 넘침 없음. `.audit/study-news-preview/qa.json` 및 캡처. 실제 모델 출력 아님.
- PR183: https://github.com/ghdtjdalskr-svg/hani-os/pull/183 . 오래된 후보의 자동 배포를 막기 위해 One-Pass-Preflight BLOCKED / QA HOLD로 표시함. 병합 안 함.
- 검증용 `hani-learning-quiz-preview` v1을 기존 quiz 소스와 동일하게 배포(JWT 검증 true, auth.getUser 유지, DB write 없음). 운영 `hani-learning-quiz`는 변경하지 않음. 실제 검증 후 운영 함수 배포/read-back과 검증용 함수 정리 판단이 남음.
- 로컬 실제 모델 검증 화면: http://127.0.0.1:8789/ . `.audit/live-quiz-qa.html` / `.audit/serve-live-qa.cjs`. auth.persistSession=false, 비밀번호 DOM 초기화, 운영 학습 기록 저장 안 함. 실제5/20 각1회 호출, 실패 자동 재시도 없음.
- 현재 실제 모델 JSON 완결성, 뉴스 비율, 정답/해설 의미 검증은 대기. PASS로 보고하지 않음.
- main merge / Pages v179 / 최신 JS 실제 로딩 / 실제 기능 read-back: 모두 미수행. 운영 화면에서 v178 확인.

## 다음 담당에게

- 실제 모델 검증 화면 로그인 후 생성 결과를 확인한다. 비밀번호/토큰을 추출·저장·로그 출력하지 않는다. 결과의 정답·근거를 별도 검토한다.
- 실패하면 기존 토큰 예산을 무조건 늘리거나 재시도를 무제한 하지 말고 원인을 확인한다.
- 검증 통과 후 최신 main 문서 기준선의 별도 branch에 이 작업 커밋만 안전하게 반영. 기존 모든 작업 트리 보존. 새로운 후보 SHA/base/package/실제 서버 gate2.0.7 hash를 동결하고 One-Pass/HINA 수행.
- 운영 quiz 함수와 Pages 공부 모듈은 함께 반영되어야 완료. canonical 서버 최종 HINA 경로로 배포하며 직접 GitHub merge로 우회하지 않음.
- 보호 storage/internal version/DB schema/Cloud writes/auth/release tooling은 변경하지 않는다.
- CURRENT/DECISIONS 공통 파일은 타 담당과 충돌하지 않도록 여기서는 수정하지 않음. 이 파일의 확인된 작업 사실만 공유 원장에 반영 가능.
