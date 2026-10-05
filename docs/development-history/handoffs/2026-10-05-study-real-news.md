# 공부 실제 뉴스 출제 보강 인수인계

## 최신 재개 상태 · 2026-10-05 KST

- 최종 재개: 대시보드 PR196의 운영 v2.9.181 완료 보고와 main `a7bb9137083d83f8170ac103ad7603bc6d6ac603` 확인. 해당 지표명/보호 변경을 그대로 유지한 새 작업 트리 `.worktrees/study-news-release-v182-final`, branch `hani/study-news-release-v182-final`에 본 작업만 적용. 버전2.9.182 및 공부 JS 캐시 갱신. 아래 bec89d3 기반 준비 기록과 PR195 실패 기록은 과거 이력.
- 대표님 기존 배포 승인 및 “배포 진행해줘”에 따라 새 후보 Freeze/패키지/One-Pass/서버 HINA 후 canonical 배포를 진행. 운영 quiz0.4.1과 사이트 양쪽 실제 source/기능 read-back 전에는 완료로 표시하지 않음.

- 대표님 요청: “응 배포까지 마무리해줘”. 기존 공부 패치 배포 승인 유지. 다른 담당 후보의 수정/폐기/병합 권한으로 확대하지 않음.
- 최신 기준 main: `bec89d309c2a5792ec3f136a63e595b6a3850a06`, 실제 브라우저 표시 v2.9.180. 품질 개선 PR192의 보호/인증 변경 및 최신 공통 지침 유지.
- 새 작업 트리: `.worktrees/study-news-release-v182`, branch `hani/study-news-release-v182`. 본 작업의 기능/테스트/인수인계 커밋만 재적용. 원래 모든 작업 트리와 미커밋 변경 보존. main/index와 다른 담당 변경은 아직 수정하지 않음.
- 최신 기준선 검사: 뉴스 mocked 실제 handler 및 client query/material/freshness/quota/JLPT/무변경 검사, v04 회귀, 서버 owner allow/deny 및 무외부효과, 공부 JS syntax 모두 PASS. 과거 실제 모델5/20 결과는 같은 생성 로직의 개발 증거이며 새 release identity의 HINA 증거로 재사용하지 않음.
- 실제 서버 배포센터 확인: 로그인/Cloud 연결 정상. PR195(v2.9.181) 서버 HINA BLOCKED. 상세의 예상 main `830fe42bf499`와 현재 `bec89d309c2a` 불일치. UI Queue에 이전 PR191 BLOCKED도 표시되어 Inbox PR195와 분리해서 기록. 단순 확인창 응답 문제로 단정하지 않음.
- 배포 충돌 경계: PR195는 다른 담당의 명칭 복원 후보. 후보를 수정/폐기하거나 직접 GitHub merge로 HINA 우회하지 않음. 공부 v182 이름의 새 브랜치는 준비 작업이며 표시 버전/후보 Freeze/새 패키지/서버 최종 검증은 아직 수행하지 않음.
- 다음: PR195 담당이 최신 main 기준으로 후보를 다시 검증하고 운영 반영하거나 대표님이 배포 순서를 별도로 정한 뒤, 실제 최신 main 위에서 공부 다음 버전을 확정. 새 패키지·One-Pass·서버 HINA→승인된 canonical 배포→Pages 및 quiz0.4.1 소스·실제 기능 read-back. 공부 Production 배포는 미완료.
- 서버0.4.1 운영 배포·새 AI 호출·데이터 쓰기·schema/auth/release tooling 변경 없음. Notion 현황판에 위 진행/차단 내용을 기록하고 읽어 확인할 예정.
- 후속 대표님 선택: “대시보드 담당 탭에 재검증을 요청하고, 완료 후 공부 패치 배포”. 해당 Gemini 프로젝트 탭에 기준선 실패 근거와 재검증/기존 승인 배포 요청을 전달. Notion 갱신과 실제 read-back 완료. 공부 배포는 대시보드 실제 운영 완료를 조건으로 진행.

아래 내용은 이전 개발/후보 이력이며 위 최신 상태가 우선한다.

## 작업 식별

- 작업 ID: STUDY-REAL-NEWS-20261005
- 갱신일: 2026-10-05 KST
- 담당: Codex 개발 / 별도 study_review Agent 읽기 전용 검토
- 상태: 실제 모델5/20 구조·뉴스 quota 통과 및 대표 Preview 확인. 최신 main의 owner 보호를 보존해 릴리스 후보 준비 중. Production 배포 미완료.
- 작업 트리: `.worktrees/study-news-release-main-v179`, branch `hani/study-news-release-main-v179`. 이전 모든 작업 트리 보존.
- 현재 base: `9ef4ea5af80bf7206fe7cdc59168022adb689eba` / 표시178 / 운영bridge34, contract2.0.8 / 운영quiz8,0.4.0 owner 보호 적용. 이전 base4cd5613/c544592와의 차이는 공통 문서 및 gate/owner 보호 변경이며 최신 규칙 보존.
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
- 대표님 첨부 화면에서 인증 이후 실제 모델 뉴스 소재 quota 검증 실패 확인. 실패 응답은 기존에 세부 실패 조건을 반환하지 않아 어느 필드가 누락됐는지 확정하지 못함. 원문 요약 일치 실패라고 단정하지 않음.
- 2026-10-05 진단 보강: 동일 뉴스 검증 조건 유지, 실패 응답에 문항 번호/자료 ID/누락 조건 이름만 추가. 비밀번호·토큰·뉴스 원문·사용자 기록을 진단에 출력하지 않음. mocked 서버 테스트에서 quota 차단 및 비밀정보 미출력 PASS. 기존 quota/auth/schema/write 정책 불변.
- 검증용 함수 진단 소스 배포 및 read-back 일치 확인(최신 조회 v3, verify_jwt=true), 운영 함수 미변경. 로컬 QA 페이지는 실패 진단 표시 및 메모리 로그인 재사용 버튼 추가. 기존 탭은 로그인 대기였고 로컬 서버 종료로 연결도 끊겨 있었음. 서버 재시작 및 새 페이지 로딩 확인. 대표님 최초 로그인 1회 필요; 이후 같은 페이지에서 검증 재시도 가능, 자동 재시도 없음.
- 실제 모델 JSON 완결성, 뉴스 비율, 정답/해설 의미 검증은 미완료. PASS로 보고하지 않음. 진단 결과 확인 전 구조 변경이나 검증 기준 완화 안 함.
- 대표님 전달 실제 응답: size5 / quota2 / matched1. Q1 N1은 summary, briefing_label만 누락; Q2 N2 정상, Q3~5 source_reference 없음. model_status=completed, output_tokens1401, db_write=false. 토큰 제한이나 로그인 실패가 아닌 macro 요약/표시 불일치로 확인.
- 수정: canonicalNewsContext는 기존 structured 뉴스 prefix/[질문]/허용 적용형type + 정확 title/date/name + 해설의 단일 자료ID/URL이 확인될 때만 source의 원문 요약과 브리핑 표시를 구성함. 질문/보기/정답/해설 보존, 없는 출처 연결·Definition 승격·새 저장 경로 없음. 원문을 모델이 재작성하지 않는 prompt로 보강. 클라이언트 원문 quota 검증은 그대로 유지.
- 자동 테스트: macro 요약 재작성/표시 누락 재현 후 정확 원문 복구 PASS, 질문 보존 PASS, Definition 승격 방지 PASS, 기존 quota/회귀 PASS. study_review 별도 읽기 전용 재검토에서 구현 안전 blocker 없음. 실제 요약→질문→정답 의미 검증은 아직 미완료.
- 수정 검증용 소스 배포 후 현재 탭의 DOM은 로그인 대기, retryVisible=false. 토큰 추출·다른 탭 세션 복사하지 않음. 대표님이 현재 페이지에서 인증해야 actual5/20 진행 가능. 운영 함수/PR183 HOLD 유지.
- 이후 실제 결과 탭2057863667 확인(이전 검증 탭과 별개): size5/count5/news2/min2/output1173, size20/count20/news12/min7/output4574. 두 요청 모두 DB write=false, local learning records unchanged=true. 기존 토큰 상한 내 완료. 대표님 “예 잘나오는것같아요”로 Preview 확인.
- 실제 질문·정답·해설의 경제 원리 연결 점검: 할인율/자사주 수급/재임차 자본 부담/AI 인프라/IP 협력/개인AI/Agent보안/주주환원/집중위험/채권가격. 저장 원문 자료를 기준으로 해석하며 기사 자체의 원문 전체 사실검증 완료를 주장하지 않음. `.audit/live-model-review.md`.
- 현재 live 표본 품질 한계: 20문제 정답 위치 모두1번, 일부 쉬운 오답,260자 요약 중간 종료, 기존 URL형 출처명. Q17은 summary가 없어 quota 불인정(전체12/7 통과). 보기 순서와 뉴스룸 원본을 이번 뉴스 연결 범위에서 임의 변경하지 않음.
- 최신 main branch에 이 작업 커밋만 분리 반영, 기존 ownerAccess 그대로 유지. 뉴스 mocked handler/auth 소유자 회귀/v04 targeted test PASS. 실제 Preview 모델 생성 로직은 동일하며 owner 인증 경계는 새 후보에서 별도 검증.
- main merge / Pages v179 / 최신 JS 실제 로딩 / 실제 기능 read-back: 모두 미수행. 운영 화면에서 v178 확인.

## 다음 담당에게

- 실제 모델 검증 화면 로그인 후 생성 결과를 확인한다. 비밀번호/토큰을 추출·저장·로그 출력하지 않는다. 결과의 정답·근거를 별도 검토한다.
- 실패하면 기존 토큰 예산을 무조건 늘리거나 재시도를 무제한 하지 말고 원인을 확인한다.
- 검증 통과 후 최신 main 문서 기준선의 별도 branch에 이 작업 커밋만 안전하게 반영. 기존 모든 작업 트리 보존. 새로운 후보 SHA/base/package/실제 서버 gate2.0.7 hash를 동결하고 One-Pass/HINA 수행.
- 운영 quiz 함수와 Pages 공부 모듈은 함께 반영되어야 완료. canonical 서버 최종 HINA 경로로 배포하며 직접 GitHub merge로 우회하지 않음.
- 보호 storage/internal version/DB schema/Cloud writes/auth/release tooling은 변경하지 않는다.
- CURRENT/DECISIONS 공통 파일은 타 담당과 충돌하지 않도록 여기서는 수정하지 않음. 이 파일의 확인된 작업 사실만 공유 원장에 반영 가능.
